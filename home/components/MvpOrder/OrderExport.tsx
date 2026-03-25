import { useState } from 'react';
import { MvpOrderItem } from '../../../../mocks/highness-catalog';

interface OrderExportProps {
  items: MvpOrderItem[];
  clientName: string;
  orderId: string;
  onClose: () => void;
}

// Define a constant for the KRW symbol to avoid JSX parsing issues
const KRW = '\u20A9';

function formatDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function buildOrderText(items: MvpOrderItem[], clientName: string, orderId: string): string {
  const dateStr = formatDate();
  const totalAmount = items.reduce((sum, item) => {
    const compTotal = (item.components ?? []).reduce((s, c) => s + c.unitPrice * c.quantity, 0);
    return sum + (item.totalPrice ?? 0) + compTotal;
  }, 0);

  let text = `[치팡 주문요청서]\n`;
  text += `━━━━━━━━━━━━━━━━\n`;
  text += `주문번호: ${orderId}\n`;
  text += `거래처: ${clientName}\n`;
  text += `주문일시: ${dateStr}\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;

  items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.productName}\n`;
    if (item.productCode) text += `   코드: ${item.productCode}\n`;
    const optStr = Object.entries(item.selectedOptions ?? {}).map(([k, v]) => `${k}:${v}`).join(' / ');
    if (optStr) text += `   옵션: ${optStr}\n`;
    text += `   수량: ${item.quantity}개\n`;
    text += `   금액: ${KRW}${(item.totalPrice ?? 0).toLocaleString()}\n`;

    if (item.components && item.components.length > 0) {
      text += `   [구성품]\n`;
      item.components.forEach((c) => {
        text += `   ├ ${c.productName} (${c.productCode}) x${c.quantity} = ${KRW}${(c.unitPrice * c.quantity).toLocaleString()}\n`;
      });
    }
    text += `\n`;
  });

  text += `━━━━━━━━━━━━━━━━\n`;
  text += `총 금액: ${KRW}${totalAmount.toLocaleString()}\n`;
  text += `━━━━━━━━━━━━━━━━\n`;
  text += `\n(주)하이니스중부지사`;

  return text;
}

function generateOrderId(): string {
  const now = new Date();
  return `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

async function downloadPdf(items: MvpOrderItem[], clientName: string, orderId: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dateStr = formatDate();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Request', 14, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Order ID: ${orderId}`, 14, 30);
  doc.text(`Client: ${clientName}`, 14, 35);
  doc.text(`Date: ${dateStr}`, 14, 40);

  doc.setDrawColor(200);
  doc.line(14, 44, 196, 44);

  // Table rows
  const rows: (string | number)[][] = [];
  let rowNum = 1;

  items.forEach((item) => {
    const modelCode = (item as any).model_code || item.productCode || '-';
    const sizeInfo = (item as any).size_info || '-';
    
    rows.push([
      rowNum++,
      item.productName,
      modelCode,
      sizeInfo,
      item.quantity,
      `${(item.unitPrice ?? 0).toLocaleString()}`,
      `${(item.totalPrice ?? 0).toLocaleString()}`,
    ]);

    if (item.components && item.components.length > 0) {
      item.components.forEach((c) => {
        rows.push([
          '',
          `  + ${c.productName}`,
          c.productCode,
          '(Component)',
          c.quantity,
          `${c.unitPrice.toLocaleString()}`,
          `${(c.unitPrice * c.quantity).toLocaleString()}`,
        ]);
      });
    }
  });

  const totalAmount = items.reduce((sum, item) => {
    const compTotal = (item.components ?? []).reduce((s, c) => s + c.unitPrice * c.quantity, 0);
    return sum + (item.totalPrice ?? 0) + compTotal;
  }, 0);

  autoTable(doc, {
    startY: 48,
    head: [['No', 'Product', 'Model Code', 'Size', 'Qty', 'Unit Price (KRW)', 'Amount (KRW)']],
    body: rows,
    foot: [['', '', '', '', '', 'Total', `${totalAmount.toLocaleString()}`]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [43, 95, 158], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 244, 248], textColor: [43, 95, 158], fontStyle: 'bold', fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
    },
    theme: 'grid',
  });

  doc.save(`${orderId}_order.pdf`);
}

async function downloadExcel(items: MvpOrderItem[], clientName: string, orderId: string) {
  const XLSX = await import('xlsx');
  const dateStr = formatDate();

  const headerRows = [
    ['Order Request'],
    [`Order ID: ${orderId}`],
    [`Client: ${clientName}`],
    [`Date: ${dateStr}`],
    [],
    ['No', 'Product', 'Model Code', 'Size', 'Qty', 'Unit Price (KRW)', 'Amount (KRW)'],
  ];

  let rowNum = 1;
  const dataRows: (string | number)[][] = [];

  items.forEach((item) => {
    const modelCode = (item as any).model_code || item.productCode || '-';
    const sizeInfo = (item as any).size_info || '-';
    
    dataRows.push([
      rowNum++,
      item.productName,
      modelCode,
      sizeInfo,
      item.quantity,
      item.unitPrice ?? 0,
      item.totalPrice ?? 0,
    ]);

    if (item.components && item.components.length > 0) {
      item.components.forEach((c) => {
        dataRows.push([
          '',
          `  + ${c.productName}`,
          c.productCode,
          '(Component)',
          c.quantity,
          c.unitPrice,
          c.unitPrice * c.quantity,
        ]);
      });
    }
  });

  const totalAmount = items.reduce((sum, item) => {
    const compTotal = (item.components ?? []).reduce((s, c) => s + c.unitPrice * c.quantity, 0);
    return sum + (item.totalPrice ?? 0) + compTotal;
  }, 0);

  dataRows.push([]);
  dataRows.push(['', '', '', '', '', 'Total', totalAmount]);

  const allRows = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 18 },
    { wch: 25 },
    { wch: 6 },
    { wch: 15 },
    { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Order');
  XLSX.writeFile(wb, `${orderId}_order.xlsx`);
}

function sendKakao(items: MvpOrderItem[], clientName: string, orderId: string) {
  const text = buildOrderText(items, clientName, orderId);
  const encoded = encodeURIComponent(text);
  window.open(`https://sharer.kakao.com/talk/friends/picker/shorturl?url=&text=${encoded}`, '_blank', 'width=480,height=640');
}

function copyToClipboard(items: MvpOrderItem[], clientName: string, orderId: string): Promise<void> {
  const text = buildOrderText(items, clientName, orderId);
  return navigator.clipboard.writeText(text);
}

export default function OrderExport({ items, clientName, orderId, onClose }: OrderExportProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const totalAmount = items.reduce((sum, item) => {
    const compTotal = (item.components ?? []).reduce((s, c) => s + c.unitPrice * c.quantity, 0);
    return sum + (item.totalPrice ?? 0) + compTotal;
  }, 0);

  const handlePdf = async () => {
    setDownloading('pdf');
    try {
      await downloadPdf(items, clientName, orderId);
    } catch (e) {
      console.error('PDF download error:', e);
    }
    setDownloading(null);
  };

  const handleExcel = async () => {
    setDownloading('excel');
    try {
      await downloadExcel(items, clientName, orderId);
    } catch (e) {
      console.error('Excel download error:', e);
    }
    setDownloading(null);
  };

  const handleKakao = () => {
    sendKakao(items, clientName, orderId);
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(items, clientName, orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy to clipboard failed:', e);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">주문요청서</h3>
            <p className="text-xs text-gray-400 mt-0.5">{orderId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <i className="ri-close-line text-lg text-gray-500"></i>
          </button>
        </div>

        {/* Order Summary */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">거래처</span>
              <span className="text-sm font-semibold text-gray-800">{clientName}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">주문일시</span>
              <span className="text-sm text-gray-700">{formatDate()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">총 품목</span>
              <span className="text-sm text-gray-700">{items.length}건</span>
            </div>
          </div>

          {/* Items Preview */}
          <div className="space-y-2 mb-4">
            {items.map((item, idx) => {
              const compTotal = (item.components ?? []).reduce((s, c) => s + c.unitPrice * c.quantity, 0);
              return (
                <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                    {item.productCode && (
                      <p className="text-[10px] text-gray-400 font-mono">{item.productCode}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {Object.entries(item.selectedOptions ?? {}).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                    {item.components && item.components.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.components.map((c, ci) => (
                          <p key={ci} className="text-[10px] text-gray-400">
                            + {c.productName} ({c.productCode}) x{c.quantity}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                    <p className="text-sm font-bold text-gray-800">
                      {KRW}{((item.totalPrice ?? 0) + compTotal).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="bg-[#2B5F9E]/5 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#2B5F9E]">총 주문 금액</span>
            <span className="text-xl font-extrabold text-[#2B5F9E]">
              {KRW}{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-3">
          {/* 카카오톡 전송 */}
          <button
            onClick={handleKakao}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835]"
          >
            <i className="ri-kakao-talk-fill text-lg w-5 h-5 flex items-center justify-center"></i>
            카카오톡으로 주문 전송
          </button>

          {/* 다운로드 버튼 그룹 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePdf}
              disabled={downloading === 'pdf'}
              className="py-2.5 rounded-xl text-xs font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {downloading === 'pdf' ? (
                <i className="ri-loader-4-line animate-spin text-sm w-4 h-4 flex items-center justify-center"></i>
              ) : (
                <i className="ri-file-pdf-2-line text-sm w-4 h-4 flex items-center justify-center"></i>
              )}
              PDF 다운로드
            </button>
            <button
              onClick={handleExcel}
              disabled={downloading === 'excel'}
              className="py-2.5 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {downloading === 'excel' ? (
                <i className="ri-loader-4-line animate-spin text-sm w-4 h-4 flex items-center justify-center"></i>
              ) : (
                <i className="ri-file-excel-2-line text-sm w-4 h-4 flex items-center justify-center"></i>
              )}
              엑셀 다운로드
            </button>
          </div>

          {/* 클립보드 복사 */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <i className="ri-check-line text-emerald-500 text-sm w-4 h-4 flex items-center justify-center"></i>
                <span className="text-emerald-600">복사 완료!</span>
              </>
            ) : (
              <>
                <i className="ri-clipboard-line text-sm w-4 h-4 flex items-center justify-center"></i>
                주문 내용 복사 (카카오톡/문자 붙여넣기용)
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export { generateOrderId, buildOrderText };
