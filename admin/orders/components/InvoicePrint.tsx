import { useEffect, useRef, useState, CSSProperties } from 'react';
import { getSetting, setSetting, deleteSetting } from '../../../../utils/settings';

interface InvoiceItem {
  no: number;
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface ClientInfo {
  name: string;
  business_number: string;
  representative: string;
  address?: string;
}

interface Order {
  id: string;
  client_name: string;
  order_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_date: string;
  notes: string;
  client_business_number?: string;
}

interface InvoicePrintProps {
  order: Order;
  clientInfo: ClientInfo;
  onClose: () => void;
}

// ─── 숫자 → 한글 금액 변환 ───────────────────────────────────────────────────
function numberToKorean(n: number): string {
  if (n === 0) return '영원';
  const ones = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  function chunkToKorean(num: number): string {
    if (num === 0) return '';
    let result = '';
    const thousands = Math.floor(num / 1000);
    const hundreds = Math.floor((num % 1000) / 100);
    const tens = Math.floor((num % 100) / 10);
    const onesDigit = num % 10;
    if (thousands > 0) result += (thousands === 1 ? '' : ones[thousands]) + '천';
    if (hundreds > 0) result += (hundreds === 1 ? '' : ones[hundreds]) + '백';
    if (tens > 0) result += (tens === 1 ? '' : ones[tens]) + '십';
    if (onesDigit > 0) result += ones[onesDigit];
    return result;
  }
  let num = Math.abs(n);
  let result = '';
  const jo = Math.floor(num / 1_000_000_000_000);
  if (jo > 0) { result += chunkToKorean(jo) + '조'; num -= jo * 1_000_000_000_000; }
  const eok = Math.floor(num / 100_000_000);
  if (eok > 0) { result += chunkToKorean(eok) + '억'; num -= eok * 100_000_000; }
  const man = Math.floor(num / 10000);
  if (man > 0) { result += chunkToKorean(man) + '만'; num -= man * 10000; }
  if (num > 0) result += chunkToKorean(num);
  return result + '원';
}

// ─── 주문 비고에서 품목 파싱 ────────────────────────────────────────────────
function parseOrderItems(order: Order): InvoiceItem[] {
  try {
    const parsed = JSON.parse(order.notes || '[]');
    const items = parsed?.items ?? (Array.isArray(parsed) ? parsed : null);
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item: any, idx: number) => ({
        no: idx + 1,
        name: item.productName || item.product_name || '-',
        spec: [item.model_code, item.size_info].filter(Boolean).join(' / ') || '-',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || item.unit_price || 0,
        amount: item.totalPrice || item.total_price || 0,
      }));
    }
  } catch { /* not JSON */ }
  return [{
    no: 1,
    name: order.product_name,
    spec: '-',
    quantity: order.quantity,
    unitPrice: order.unit_price,
    amount: order.total_price,
  }];
}

// ─── 공급자 고정 정보 ───────────────────────────────────────────────────────
const SUPPLIER = {
  name: '(주)하이니스중부지사',
  bizNo: '761-88-01913',
  representative: '이석',
  address: '충청남도 천안시 동남구 청수14로 102 에이스법조타워710호',
  phone: '1522-4936',
};

export default function InvoicePrint({ order, clientInfo, onClose }: InvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);
  const [sealImage, setSealImage] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  useEffect(() => {
    getSetting<string>('invoice_seal_image').then((saved) => {
      if (saved) setSealImage(saved);
    });
  }, []);

  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setSealImage(base64);
      setSetting('invoice_seal_image', base64);
    };
    reader.readAsDataURL(file);
  };

  const items = parseOrderItems(order);

  // VAT 역산 계산
  const itemsWithVat = items.map((item) => {
    const unitSupply = Math.round(item.unitPrice / 1.1);
    const unitVat = item.unitPrice - unitSupply;
    const lineSupply = unitSupply * item.quantity;
    const lineVat = unitVat * item.quantity;
    const lineTotal = item.unitPrice * item.quantity;
    return { ...item, unitSupply, unitVat, lineSupply, lineVat, lineTotal };
  });

  const totalSupply = itemsWithVat.reduce((s, i) => s + i.lineSupply, 0);
  const totalVat = itemsWithVat.reduce((s, i) => s + i.lineVat, 0);
  const totalAmount = itemsWithVat.reduce((s, i) => s + i.lineTotal, 0);

  const issueDate = new Date(order.order_date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  // 인쇄 전용 스타일 주입
  useEffect(() => {
    const styleId = 'invoice-print-style';
    const existing = document.getElementById(styleId);
    if (!existing) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root { display: block !important; position: fixed; inset: 0; z-index: 99999; background: white; }
          #invoice-print-root .invoice-modal-bg { display: none !important; }
          #invoice-print-root .invoice-actions { display: none !important; }
          #invoice-print-root .invoice-notes-edit { display: none !important; }
          #invoice-print-content {
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm !important;
          }
          .invoice-item-row { page-break-inside: avoid; }
          table { page-break-inside: auto; }
          tr.invoice-item-row { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .invoice-footer-block { page-break-inside: avoid; }
          @page { size: A4; margin: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const bizNo = clientInfo.business_number || order.client_business_number || '-';
  const clientName = clientInfo.name || order.client_name || '-';
  const clientAddress = clientInfo.address || '-';

  const MIN_ROWS = 7;
  const emptyRows = Math.max(0, MIN_ROWS - items.length);

  const cellStyle = (extra?: CSSProperties): CSSProperties => ({
    border: '1px solid #bbb',
    padding: '2mm 2mm',
    fontSize: '8.5pt',
    ...extra,
  });
  const headStyle = (extra?: CSSProperties): CSSProperties => ({
    border: '1px solid #888',
    padding: '2mm 2.5mm',
    textAlign: 'center' as const,
    background: '#f0f0f0',
    fontSize: '8.5pt',
    ...extra,
  });

  return (
    <div id="invoice-print-root" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      {/* 배경 오버레이 */}
      <div className="invoice-modal-bg fixed inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-4xl">
        {/* 액션 버튼 바 */}
        <div className="invoice-actions flex items-center justify-between mb-4 relative z-10 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg">
              <i className="ri-file-text-line text-white text-lg" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">거래명세서</p>
              <p className="text-white/60 text-xs">{order.order_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => sealInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-stamp-line text-base" />
              직인 {sealImage ? '변경' : '등록'}
            </button>
            <input ref={sealInputRef} type="file" accept="image/*" className="hidden" onChange={handleSealUpload} />
            {sealImage && (
              <button
                onClick={() => { setSealImage(''); deleteSetting('invoice_seal_image'); }}
                className="flex items-center gap-1 px-3 py-2.5 bg-red-500/60 text-white rounded-lg text-sm hover:bg-red-500/80 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-delete-bin-line text-sm" />직인 삭제
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line text-base" />
              인쇄 / PDF 저장
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl" />
            </button>
          </div>
        </div>

        {/* 비고 입력 (화면 전용) */}
        <div className="invoice-notes-edit bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-edit-2-line text-white/70 text-sm" />
            <p className="text-white/80 text-xs font-semibold">비고 입력 (인쇄물에 포함됩니다)</p>
          </div>
          <textarea
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value.slice(0, 300))}
            placeholder="예: 다음 주문 시 할인 적용 예정 / 별도 협의 완료 등"
            rows={2}
            maxLength={300}
            className="w-full bg-white/10 text-white placeholder-white/40 text-sm border border-white/20 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-white/50"
          />
        </div>

        {/* 인보이스 본문 */}
        <div
          id="invoice-print-content"
          ref={printRef}
          style={{
            width: '210mm',
            minHeight: '297mm',
            background: 'white',
            padding: '12mm 14mm',
            boxSizing: 'border-box',
            fontFamily: '"Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", sans-serif',
            fontSize: '9.5pt',
            color: '#000',
            position: 'relative',
          }}
        >
          {/* 제목 */}
          <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
            <h1 style={{ fontSize: '20pt', fontWeight: 'bold', letterSpacing: '8px', margin: 0 }}>거래명세서</h1>
          </div>

          {/* VAT 안내 문구 */}
          <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
            <span style={{
              fontSize: '8.5pt', color: '#c00',
              background: '#fff8f8', border: '1px solid #f5c6c6',
              borderRadius: '3px', padding: '1mm 3mm', display: 'inline-block',
            }}>
              ※ 상품가격은 부가세 포함가입니다
            </span>
          </div>

          {/* 발행일 / 주문번호 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4mm', fontSize: '8.5pt' }}>
            <span style={{ marginRight: '10mm' }}>발행일: <strong>{issueDate}</strong></span>
            <span>No. <strong>{order.order_number}</strong></span>
          </div>

          {/* 공급자 / 공급받는자 2열 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: '9pt' }}>
            <tbody>
              <tr>
                {/* 공급자 */}
                <td style={{ width: '50%', padding: '2.5mm 3.5mm', border: '1.5px solid #333', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '9.5pt', borderBottom: '1px solid #ccc', paddingBottom: '1.5mm', marginBottom: '2mm' }}>
                    공 급 자
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '26%', color: '#555', paddingBottom: '1.5mm' }}>상호</td>
                        <td style={{ fontWeight: 'bold' }}>{SUPPLIER.name}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#555', paddingBottom: '1.5mm' }}>대표자</td>
                        <td>{SUPPLIER.representative}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#555', paddingBottom: '1.5mm' }}>사업자번호</td>
                        <td>{SUPPLIER.bizNo}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#555', paddingBottom: '1.5mm' }}>주소</td>
                        <td style={{ fontSize: '8pt', lineHeight: '1.4' }}>{SUPPLIER.address}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#555' }}>전화</td>
                        <td>{SUPPLIER.phone}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                {/* 공급받는자 */}
                <td style={{ width: '50%', padding: '2.5mm 3.5mm', border: '1.5px solid #333', borderLeft: 'none', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '9.5pt', borderBottom: '1px solid #ccc', paddingBottom: '1.5mm', marginBottom: '2mm' }}>
                    공 급 받 는 자
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '26%', color: '#555', paddingBottom: '1.5mm' }}>상호</td>
                        <td style={{ fontWeight: 'bold' }}>{clientName}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#555', paddingBottom: '1.5mm' }}>사업자번호</td>
                        <td>{bizNo}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#555', paddingBottom: '1.5mm' }}>대표자</td>
                        <td>{clientInfo.representative || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#555' }}>주소</td>
                        <td style={{ fontSize: '8pt', lineHeight: '1.4' }}>{clientAddress}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 품목 테이블 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3mm' }}>
            <thead>
              <tr>
                <th style={headStyle({ width: '5%' })}>No</th>
                <th style={headStyle({ width: '32%', textAlign: 'left' })}>품목</th>
                <th style={headStyle({ width: '7%' })}>수량</th>
                <th style={headStyle({ width: '14%' })}>단가(VAT포함)</th>
                <th style={headStyle({ width: '14%' })}>공급가액</th>
                <th style={headStyle({ width: '14%' })}>부가세(10%)</th>
                <th style={headStyle({ width: '14%' })}>합계</th>
              </tr>
            </thead>
            <tbody>
              {itemsWithVat.map((item) => (
                <tr key={item.no} className="invoice-item-row">
                  <td style={cellStyle({ textAlign: 'center' })}>{item.no}</td>
                  <td style={cellStyle({ paddingLeft: '3mm' })}>
                    <div style={{ fontWeight: 'bold', fontSize: '8.5pt' }}>{item.name}</div>
                    {item.spec && item.spec !== '-' && (
                      <div style={{ fontSize: '7.5pt', color: '#666', marginTop: '0.5mm' }}>{item.spec}</div>
                    )}
                  </td>
                  <td style={cellStyle({ textAlign: 'center' })}>{item.quantity}</td>
                  <td style={cellStyle({ textAlign: 'right' })}>{item.unitPrice.toLocaleString()}</td>
                  <td style={cellStyle({ textAlign: 'right' })}>{item.unitSupply.toLocaleString()}</td>
                  <td style={cellStyle({ textAlign: 'right' })}>{item.unitVat.toLocaleString()}</td>
                  <td style={cellStyle({ textAlign: 'right', fontWeight: 'bold' })}>{item.lineTotal.toLocaleString()}</td>
                </tr>
              ))}
              {Array.from({ length: emptyRows }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="invoice-item-row">
                  {[0,1,2,3,4,5,6].map((ci) => (
                    <td key={ci} style={cellStyle({ textAlign: 'center' })}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* VAT 합계 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm' }} className="invoice-footer-block">
            <tbody>
              <tr>
                <td style={{ border: '1px solid #bbb', padding: '2mm 4mm', background: '#fafafa', width: '20%', textAlign: 'center', fontSize: '8.5pt', color: '#555' }}>
                  공급가액 합계
                </td>
                <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', textAlign: 'right', fontSize: '9pt', width: '30%' }}>
                  ₩{totalSupply.toLocaleString()}
                </td>
                <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', background: '#fafafa', textAlign: 'center', fontSize: '8.5pt', color: '#555', width: '20%' }}>
                  부가세 합계
                </td>
                <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', textAlign: 'right', fontSize: '9pt', width: '30%' }}>
                  ₩{totalVat.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #bbb', borderTop: 'none', padding: '2.5mm 4mm', background: '#f0f0f0', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold', borderRight: '2px solid #333' }}>
                  최종합계
                </td>
                <td colSpan={3} style={{ border: '1px solid #bbb', borderTop: 'none', borderLeft: 'none', padding: '2.5mm 4mm', fontSize: '10pt' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8mm' }}>₩{totalAmount.toLocaleString()}</span>
                  <span style={{ color: '#555', fontSize: '8.5pt' }}>({numberToKorean(totalAmount)}) (VAT 포함)</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 비고란 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm' }} className="invoice-footer-block">
            <tbody>
              <tr>
                <td style={{ border: '1px solid #bbb', padding: '2mm 4mm', background: '#fafafa', width: '12%', fontWeight: 'bold', textAlign: 'center', fontSize: '9pt' }}>
                  비고
                </td>
                <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', color: '#444', fontSize: '9pt', minHeight: '10mm' }}>
                  {invoiceNotes || <span style={{ color: '#bbb' }}>&nbsp;</span>}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 하단 서명란 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="invoice-footer-block">
            <div style={{ fontSize: '9pt', color: '#444' }}>
              <strong>공급자: (주)하이니스중부지사</strong>
            </div>
            <div style={{ textAlign: 'center', border: '1px solid #888', padding: '4mm 10mm', minWidth: '60mm' }}>
              <p style={{ margin: '0 0 1.5mm 0', fontSize: '8.5pt', color: '#555' }}>공급자</p>
              <p style={{ margin: '0 0 3mm 0', fontWeight: 'bold', fontSize: '9.5pt' }}>{SUPPLIER.name}</p>
              {sealImage ? (
                <div style={{ height: '18mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={sealImage} alt="직인" style={{ maxHeight: '18mm', maxWidth: '28mm', objectFit: 'contain', opacity: 0.85 }} />
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '9pt', color: '#888', height: '18mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>(인)</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
