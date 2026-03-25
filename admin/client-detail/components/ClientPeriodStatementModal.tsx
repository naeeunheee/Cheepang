import { useState, useEffect, useRef, CSSProperties } from 'react';
import { supabase } from '../../../../lib/supabase';
import { getSetting, setSetting, deleteSetting } from '../../../../utils/settings';

interface ClientInfo {
  id: string;
  name?: string;
  clinic_name?: string;
  business_number?: string;
  business_no?: string;
  representative?: string;
  address?: string;
}

interface Order {
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  order_date: string;
  notes: string;
}

interface StatementItem {
  no: number;
  orderNumber: string;
  orderDate: string;
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Props {
  client: ClientInfo;
  onClose: () => void;
}

// ─── 숫자 → 한글 금액 ────────────────────────────────────────────────────────
function numberToKorean(n: number): string {
  if (n === 0) return '영원';
  const ones = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  function chunk(num: number): string {
    if (num === 0) return '';
    let r = '';
    const t = Math.floor(num / 1000);
    const h = Math.floor((num % 1000) / 100);
    const te = Math.floor((num % 100) / 10);
    const o = num % 10;
    if (t > 0) r += (t === 1 ? '' : ones[t]) + '천';
    if (h > 0) r += (h === 1 ? '' : ones[h]) + '백';
    if (te > 0) r += (te === 1 ? '' : ones[te]) + '십';
    if (o > 0) r += ones[o];
    return r;
  }
  let num = Math.abs(n);
  let result = '';
  const jo = Math.floor(num / 1_000_000_000_000);
  if (jo > 0) { result += chunk(jo) + '조'; num -= jo * 1_000_000_000_000; }
  const eok = Math.floor(num / 100_000_000);
  if (eok > 0) { result += chunk(eok) + '억'; num -= eok * 100_000_000; }
  const man = Math.floor(num / 10000);
  if (man > 0) { result += chunk(man) + '만'; num -= man * 10000; }
  if (num > 0) result += chunk(num);
  return result + '원';
}

// ─── notes JSON에서 품목 파싱 ────────────────────────────────────────────────
function parseItems(order: Order, startNo: number): StatementItem[] {
  try {
    const parsed = JSON.parse(order.notes || '[]');
    const items = parsed?.items ?? (Array.isArray(parsed) ? parsed : null);
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item: Record<string, unknown>, idx: number) => ({
        no: startNo + idx,
        orderNumber: order.order_number,
        orderDate: new Date(order.order_date).toLocaleDateString('ko-KR'),
        name: (item.productName as string) || (item.product_name as string) || '-',
        spec: [(item.model_code as string), (item.size_info as string)].filter(Boolean).join(' / ') || '-',
        quantity: (item.quantity as number) || 0,
        unitPrice: (item.unitPrice as number) || (item.unit_price as number) || 0,
        amount: (item.totalPrice as number) || (item.total_price as number) || 0,
      }));
    }
  } catch { /* not JSON */ }
  return [{
    no: startNo,
    orderNumber: order.order_number,
    orderDate: new Date(order.order_date).toLocaleDateString('ko-KR'),
    name: order.product_name,
    spec: '-',
    quantity: order.quantity,
    unitPrice: order.unit_price,
    amount: order.total_price,
  }];
}

const SUPPLIER = {
  name: '(주)하이니스중부지사',
  bizNo: '761-88-01913',
  representative: '이석',
  address: '충청남도 천안시 동남구 청수14로 102 에이스법조타워710호',
  phone: '1522-4936',
};

const EXCLUDED_STATUSES = ['cancelled', 'returned', '취소', '반품', '취소됨', '반품됨'];

export default function ClientPeriodStatementModal({ client, onClose }: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'filter' | 'preview'>('filter');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sealImage, setSealImage] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const sealInputRef = useRef<HTMLInputElement>(null);

  const clientName = client.clinic_name || client.name || '-';
  const clientBizNo = client.business_number || client.business_no || '-';

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

  // 인쇄 스타일 주입
  useEffect(() => {
    if (step !== 'preview') return;
    const styleId = 'client-period-print-style';
    const existing = document.getElementById(styleId);
    if (!existing) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          body > *:not(#client-period-print-root) { display: none !important; }
          #client-period-print-root { display: block !important; position: fixed; inset: 0; z-index: 99999; background: white; overflow: auto; }
          #client-period-print-root .cp-modal-bg { display: none !important; }
          #client-period-print-root .cp-actions { display: none !important; }
          #client-period-print-root .cp-no-print { display: none !important; }
          #client-period-print-content {
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 14mm !important;
          }
          .cp-item-row { page-break-inside: avoid; }
          .cp-header-block { page-break-inside: avoid; page-break-after: avoid; }
          table { page-break-inside: auto; }
          tr.cp-item-row { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          @page { size: A4; margin: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [step]);

  const applyPreset = (preset: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    if (preset === 'thisMonth') {
      const lastDay = new Date(y, m + 1, 0).getDate();
      const mm = String(m + 1).padStart(2, '0');
      setStartDate(`${y}-${mm}-01`);
      setEndDate(`${y}-${mm}-${lastDay}`);
    } else if (preset === 'lastMonth') {
      const d = new Date(y, m - 1, 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      setStartDate(`${d.getFullYear()}-${mm}-01`);
      setEndDate(`${d.getFullYear()}-${mm}-${lastDay}`);
    } else if (preset === '3months') {
      const s = new Date(now); s.setMonth(s.getMonth() - 3);
      setStartDate(fmt(s)); setEndDate(fmt(now));
    } else if (preset === 'year') {
      setStartDate(`${y}-01-01`); setEndDate(`${y}-12-31`);
    }
  };

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, product_name, quantity, unit_price, total_price, status, order_date, notes')
        .eq('client_id', client.id)
        .gte('order_date', startDate + 'T00:00:00')
        .lte('order_date', endDate + 'T23:59:59')
        .order('order_date', { ascending: true });
      if (error) throw error;
      const filtered = (data || []).filter(
        (o) => !EXCLUDED_STATUSES.includes(o.status)
      );
      setOrders(filtered);
      setStep('preview');
    } catch (err) {
      console.error('주문 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 모든 주문 품목 합산
  const allItems: StatementItem[] = [];
  let rowNo = 1;
  orders.forEach((order) => {
    const items = parseItems(order, rowNo);
    allItems.push(...items);
    rowNo += items.length;
  });

  // VAT 역산 계산
  const itemsWithVat = allItems.map((item) => {
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
  const issueDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const MIN_ROWS = 8;
  const emptyRows = Math.max(0, MIN_ROWS - allItems.length);

  const cellS = (extra?: CSSProperties): CSSProperties => ({
    border: '1px solid #bbb', padding: '1.5mm 2mm', fontSize: '8pt', ...extra,
  });
  const headS = (extra?: CSSProperties): CSSProperties => ({
    border: '1px solid #888', padding: '1.5mm 2mm', textAlign: 'center' as const, background: '#f0f0f0', fontSize: '8pt', ...extra,
  });

  const clientAddress = (client as any).address || '-';

  // ── 미리보기 ────────────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div id="client-period-print-root" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div className="cp-modal-bg fixed inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-4xl">
          {/* 액션 바 */}
          <div className="cp-actions flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('filter')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-left-line" />
                조건 변경
              </button>
              <div>
                <p className="text-white font-bold text-sm">기간별 거래명세서</p>
                <p className="text-white/60 text-xs">{clientName} · {startDate} ~ {endDate} · {orders.length}건</p>
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
                  <i className="ri-delete-bin-line text-sm" />
                  직인 삭제
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

          {/* 비고 입력 */}
          <div className="cp-no-print bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 relative z-10">
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

          {orders.length === 0 && (
            <div className="cp-no-print bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-4 flex items-center gap-3 relative z-10">
              <i className="ri-information-line text-amber-500 text-xl" />
              <p className="text-sm text-amber-700">선택한 기간에 해당 거래처의 주문이 없습니다. (취소/반품 제외)</p>
            </div>
          )}

          {/* 인보이스 본문 */}
          <div
            id="client-period-print-content"
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
            <div className="cp-header-block" style={{ textAlign: 'center', marginBottom: '3mm' }}>
              <h1 style={{ fontSize: '20pt', fontWeight: 'bold', letterSpacing: '8px', margin: '0 0 1.5mm 0' }}>거래명세서</h1>
              <p style={{ fontSize: '8.5pt', color: '#555', margin: 0 }}>
                기간: {startDate.replace(/-/g, '.')} ~ {endDate.replace(/-/g, '.')}
              </p>
            </div>

            {/* VAT 안내 */}
            <div className="cp-header-block" style={{ textAlign: 'center', marginBottom: '4mm' }}>
              <span style={{ fontSize: '8.5pt', color: '#c00', background: '#fff8f8', border: '1px solid #f5c6c6', borderRadius: '3px', padding: '1mm 3mm', display: 'inline-block' }}>
                ※ 상품가격은 부가세 포함가입니다
              </span>
            </div>

            {/* 발행일 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4mm', fontSize: '8.5pt' }}>
              <span>발행일: <strong>{issueDate}</strong></span>
            </div>

            {/* 공급자 / 공급받는자 */}
            <table className="cp-header-block" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: '9pt' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', padding: '2.5mm 3.5mm', border: '1.5px solid #333', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', borderBottom: '1px solid #ccc', paddingBottom: '1.5mm', marginBottom: '2mm' }}>공 급 자</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ width: '26%', color: '#555', paddingBottom: '1.5mm' }}>상호</td><td style={{ fontWeight: 'bold' }}>{SUPPLIER.name}</td></tr>
                        <tr><td style={{ color: '#555', paddingBottom: '1.5mm' }}>대표자</td><td>{SUPPLIER.representative}</td></tr>
                        <tr><td style={{ color: '#555', paddingBottom: '1.5mm' }}>사업자번호</td><td>{SUPPLIER.bizNo}</td></tr>
                        <tr><td style={{ color: '#555', paddingBottom: '1.5mm' }}>주소</td><td style={{ fontSize: '8pt', lineHeight: '1.4' }}>{SUPPLIER.address}</td></tr>
                        <tr><td style={{ color: '#555' }}>전화</td><td>{SUPPLIER.phone}</td></tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ width: '50%', padding: '2.5mm 3.5mm', border: '1.5px solid #333', borderLeft: 'none', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', borderBottom: '1px solid #ccc', paddingBottom: '1.5mm', marginBottom: '2mm' }}>공 급 받 는 자</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ width: '26%', color: '#555', paddingBottom: '1.5mm' }}>상호</td><td style={{ fontWeight: 'bold' }}>{clientName}</td></tr>
                        <tr><td style={{ color: '#555', paddingBottom: '1.5mm' }}>사업자번호</td><td>{clientBizNo}</td></tr>
                        <tr><td style={{ color: '#555', paddingBottom: '1.5mm' }}>대표자</td><td>{client.representative || '-'}</td></tr>
                        <tr><td style={{ color: '#555' }}>주소</td><td style={{ fontSize: '8pt', lineHeight: '1.4' }}>{clientAddress}</td></tr>
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
                  <th style={headS({ width: '5%' })}>No</th>
                  <th style={headS({ width: '12%' })}>주문번호</th>
                  <th style={headS({ width: '9%' })}>주문일</th>
                  <th style={headS({ width: '23%', textAlign: 'left' })}>품명</th>
                  <th style={headS({ width: '6%' })}>수량</th>
                  <th style={headS({ width: '11%' })}>단가(VAT포함)</th>
                  <th style={headS({ width: '11%' })}>공급가액</th>
                  <th style={headS({ width: '11%' })}>부가세(10%)</th>
                  <th style={headS({ width: '12%' })}>합계</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithVat.map((item) => (
                  <tr key={`item-${item.no}`} className="cp-item-row">
                    <td style={cellS({ textAlign: 'center' })}>{item.no}</td>
                    <td style={cellS({ textAlign: 'center', color: '#555', fontSize: '7.5pt' })}>{item.orderNumber}</td>
                    <td style={cellS({ textAlign: 'center', fontSize: '7.5pt' })}>{item.orderDate}</td>
                    <td style={cellS({ paddingLeft: '2mm' })}>{item.name}</td>
                    <td style={cellS({ textAlign: 'center' })}>{item.quantity}</td>
                    <td style={cellS({ textAlign: 'right' })}>{item.unitPrice.toLocaleString()}</td>
                    <td style={cellS({ textAlign: 'right' })}>{item.unitSupply.toLocaleString()}</td>
                    <td style={cellS({ textAlign: 'right' })}>{item.unitVat.toLocaleString()}</td>
                    <td style={cellS({ textAlign: 'right', fontWeight: 'bold' })}>{item.lineTotal.toLocaleString()}</td>
                  </tr>
                ))}
                {Array.from({ length: emptyRows }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="cp-item-row">
                    {Array.from({ length: 9 }).map((__, ci) => (
                      <td key={ci} style={cellS({ textAlign: 'center' })}>&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* VAT 합계 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm' }} className="cp-item-row">
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #bbb', padding: '2mm 4mm', background: '#fafafa', width: '20%', textAlign: 'center', fontSize: '8.5pt', color: '#555' }}>공급가액 합계</td>
                  <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', textAlign: 'right', fontSize: '9pt', width: '30%' }}>₩{totalSupply.toLocaleString()}</td>
                  <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', background: '#fafafa', textAlign: 'center', fontSize: '8.5pt', color: '#555', width: '20%' }}>부가세 합계</td>
                  <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', textAlign: 'right', fontSize: '9pt', width: '30%' }}>₩{totalVat.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #bbb', borderTop: 'none', padding: '2.5mm 4mm', background: '#f0f0f0', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold', borderRight: '2px solid #333' }}>최종합계</td>
                  <td colSpan={3} style={{ border: '1px solid #bbb', borderTop: 'none', borderLeft: 'none', padding: '2.5mm 4mm', fontSize: '10pt' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '8mm' }}>₩{totalAmount.toLocaleString()}</span>
                    <span style={{ color: '#555', fontSize: '8.5pt' }}>({numberToKorean(totalAmount)}) (VAT 포함)</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 비고란 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm' }} className="cp-item-row">
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #bbb', padding: '2mm 4mm', background: '#fafafa', width: '12%', fontWeight: 'bold', textAlign: 'center', fontSize: '9pt' }}>비고</td>
                  <td style={{ border: '1px solid #bbb', borderLeft: 'none', padding: '2mm 4mm', color: '#444', fontSize: '9pt', minHeight: '10mm' }}>
                    {invoiceNotes || <span style={{ color: '#bbb' }}>&nbsp;</span>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 하단 서명란 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="cp-item-row">
              <div style={{ fontSize: '9pt', color: '#444' }}>
                <strong>공급자: (주)하이니스중부지사</strong>
              </div>
              <div style={{ textAlign: 'center', border: '1px solid #888', padding: '4mm 10mm', minWidth: '60mm', position: 'relative' }}>
                <p style={{ margin: '0 0 1.5mm 0', fontSize: '8.5pt', color: '#555' }}>공급자</p>
                <p style={{ margin: '0 0 3mm 0', fontWeight: 'bold', fontSize: '9.5pt' }}>{SUPPLIER.name}</p>
                {sealImage ? (
                  <div style={{ height: '18mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={sealImage}
                      alt="직인"
                      style={{ maxHeight: '18mm', maxWidth: '28mm', objectFit: 'contain', opacity: 0.85 }}
                    />
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

  // ── Step 1: 기간 선택 ────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="ri-file-chart-line text-teal-600 text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">기간별 거래명세서</h3>
              <p className="text-xs text-gray-500">{clientName} · 기간을 선택하여 명세서를 출력합니다</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">기간 설정 <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">시작일</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 cursor-pointer"
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">종료일</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs text-gray-500 mb-2">빠른 선택</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '이번 달', key: 'thisMonth' },
              { label: '지난 달', key: 'lastMonth' },
              { label: '최근 3개월', key: '3months' },
              { label: '올해', key: 'year' },
            ].map(({ label, key }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <i className={`ri-stamp-line text-base ${sealImage ? 'text-emerald-500' : 'text-gray-400'}`} />
            <span className="text-xs text-gray-600">
              직인: {sealImage
                ? <span className="text-emerald-600 font-semibold">등록됨</span>
                : <span className="text-gray-400">미등록</span>
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => sealInputRef.current?.click()}
              className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              {sealImage ? '변경' : '업로드'}
            </button>
            {sealImage && (
              <button
                onClick={() => { setSealImage(''); deleteSetting('invoice_seal_image'); }}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                삭제
              </button>
            )}
          </div>
          <input ref={sealInputRef} type="file" accept="image/*" className="hidden" onChange={handleSealUpload} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleFetch}
            disabled={!startDate || !endDate || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            {loading
              ? <><i className="ri-loader-4-line animate-spin" />조회 중...</>
              : <><i className="ri-search-line" />명세서 출력</>
            }
          </button>
        </div>
      </div>
    </>
  );
}
