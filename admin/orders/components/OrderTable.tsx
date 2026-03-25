import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import InvoicePrint from './InvoicePrint';

interface OrderItem {
  productName: string;
  productCode?: string;
  selectedOptions?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  components?: { productName: string; productCode?: string; quantity: number; unitPrice: number }[];
  size_info?: string;
  model_code?: string;
}

interface ParsedNotes {
  paymentMethod?: string;
  items?: OrderItem[];
  type?: string;
  memo?: string;
  images?: string[];
  file_count?: number;
}

interface Order {
  id: string;
  client_id: string;
  client_name: string;
  order_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  order_date: string;
  delivery_date: string | null;
  notes: string;
}

interface OrderTableProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  onViewDetail: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onBulkStatusChange?: (orderIds: string[], newStatus: string) => void;
}

interface ClientInfo {
  name: string;
  business_number: string;
  representative: string;
  address?: string;
}

function parseOrderNotes(notes: string): ParsedNotes | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
      return parsed as ParsedNotes;
    }
    return null;
  } catch {
    return null;
  }
}

function getTotalQuantity(order: Order): number {
  const parsed = parseOrderNotes(order.notes);
  if (parsed?.items && parsed.items.length > 0) {
    return parsed.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }
  return order.quantity;
}

function OrderItemsDetail({ notes }: { notes: string }) {
  const [expanded, setExpanded] = useState(false);
  const parsed = parseOrderNotes(notes);

  // 사진 주문인 경우
  if (parsed && (parsed as any).type === 'photo_order') {
    const photoNotes = parsed as any;
    const images: string[] = photoNotes.images || [];
    const memo: string = photoNotes.memo || '';
    return (
      <div className="mt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
            📷 사진주문
          </span>
          {images.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-purple-600 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <i className={`ri-arrow-${expanded ? 'up' : 'down'}-s-line text-xs`}></i>
              이미지 {images.length}장
            </button>
          )}
        </div>
        {memo && (
          <p className="text-xs text-gray-500 mt-1 italic">"{memo}"</p>
        )}
        {expanded && images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={url} alt={`주문사진 ${i + 1}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!parsed || !parsed.items || parsed.items.length === 0) {
    return notes ? (
      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{notes}</p>
    ) : null;
  }

  const items = parsed.items;

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1.5">
        {parsed.paymentMethod && (
          <span className="text-[10px] bg-[#2B5F9E]/10 text-[#2B5F9E] px-1.5 py-0.5 rounded font-medium">
            {parsed.paymentMethod}
          </span>
        )}
        {items.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-[#2B5F9E] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <i className={`ri-arrow-${expanded ? 'up' : 'down'}-s-line text-xs`}></i>
            {items.length}개 품목
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          {items.map((item, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800 block truncate">{item.productName}</span>
                  {item.productCode && (
                    <span className="text-[10px] text-gray-400 font-mono">{item.productCode}</span>
                  )}
                  {item.size_info && (
                    <div className="mt-1 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                      <span className="text-[9px] text-blue-600 font-semibold">규격: </span>
                      <span className="text-[10px] text-blue-800 font-medium">{item.size_info}</span>
                    </div>
                  )}
                  {item.model_code && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[9px] text-gray-500 font-semibold">품목코드:</span>
                      <span className="text-[10px] text-gray-700 font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                        {item.model_code}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-gray-500">×{item.quantity}</span>
                  <span className="block font-semibold text-[#2B5F9E]">
                    ₩{(item.totalPrice ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              {idx < items.length - 1 && <div className="border-t border-gray-100 mt-1.5"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = ['주문접수', '주문확인', '배송준비', '배송중', '배송완료', '주문취소', 'cancel_requested', 'cancelled', 'return_requested', 'returned', '교환', '반품', '환불', 'photo_order'];

function getPreviousStatus(notes: string): string {
  try {
    const parsed = JSON.parse(notes || '{}');
    if (parsed && typeof parsed === 'object' && parsed.previous_status) {
      return parsed.previous_status as string;
    }
  } catch { /* ignore */ }
  return '주문확인';
}

export default function OrderTable({
  orders,
  onStatusChange,
  onViewDetail,
  onEditOrder,
  onBulkStatusChange,
}: OrderTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceClientInfo, setInvoiceClientInfo] = useState<ClientInfo>({ name: '', business_number: '', representative: '' });
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const allSelected = orders.length > 0 && selectedIds.size === orders.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < orders.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApply = () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkConfirmOpen(true);
  };

  const confirmBulkChange = () => {
    if (onBulkStatusChange) {
      onBulkStatusChange(Array.from(selectedIds), bulkStatus);
    }
    setSelectedIds(new Set());
    setBulkStatus('');
    setBulkConfirmOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '주문접수': return 'bg-blue-100 text-blue-700';
      case '주문확인': return 'bg-emerald-100 text-emerald-700';
      case '배송준비': return 'bg-orange-100 text-orange-700';
      case '배송중':   return 'bg-violet-100 text-violet-700';
      case '배송완료': return 'bg-gray-100 text-gray-600';
      case '주문취소':
      case 'cancelled': return 'bg-red-100 text-red-600';
      case 'cancel_requested': return 'bg-orange-100 text-orange-700';
      case 'return_requested': return 'bg-orange-100 text-orange-700';
      case 'returned': return 'bg-gray-200 text-gray-500';
      case '교환':    return 'bg-orange-100 text-orange-700';
      case '반품':    return 'bg-red-100 text-red-700';
      case '환불':    return 'bg-purple-100 text-purple-700';
      case 'photo_order': return 'bg-purple-100 text-purple-700';
      default:        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'cancel_requested': '취소요청',
      'return_requested': '반품요청',
      'cancelled': '취소완료',
      'returned': '반품완료',
      'photo_order': '📷 사진주문',
    };
    return labels[status] || status;
  };

  const handleGenerateInvoice = async (order: Order) => {
    setGeneratingInvoice(order.id);
    try {
      // 거래처 정보 조회 (business_number, representative)
      let clientInfo: ClientInfo = {
        name: order.client_name || '',
        business_number: order.client_business_number || '',
        representative: '',
      };

      if (order.client_id) {
        const { data } = await supabase
          .from('clients')
          .select('id, name, business_number, business_no, representative, address')
          .eq('id', order.client_id)
          .maybeSingle();

        if (data) {
          clientInfo = {
            name: data.name || order.client_name || '',
            business_number: data.business_number || data.business_no || order.client_business_number || '',
            representative: data.representative || '',
            address: data.address || '',
          };
        }
      }

      setInvoiceClientInfo(clientInfo);
      setInvoiceOrder(order);
      setShowInvoice(true);
    } catch (err) {
      console.error('거래처 정보 조회 실패:', err);
      // 조회 실패해도 주문 정보만으로 인보이스 표시
      setInvoiceClientInfo({
        name: order.client_name || '',
        business_number: order.client_business_number || '',
        representative: '',
      });
      setInvoiceOrder(order);
      setShowInvoice(true);
    } finally {
      setGeneratingInvoice(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
        </div>
        <p className="text-gray-500">주문 내역이 없습니다.</p>
      </div>
    );
  }

  // 취소/반품 요청 주문 목록
  const requestOrders = orders.filter(
    (o) => o.status === 'cancel_requested' || o.status === 'return_requested'
  );

  return (
    <>
      {/* 인보이스 모달 */}
      {showInvoice && invoiceOrder && (
        <InvoicePrint
          order={invoiceOrder}
          clientInfo={invoiceClientInfo}
          onClose={() => { setShowInvoice(false); setInvoiceOrder(null); }}
        />
      )}

      {/* 일괄 변경 확인 모달 */}
      {bulkConfirmOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setBulkConfirmOpen(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-checkbox-multiple-line text-2xl text-amber-600"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">일괄 상태 변경</h3>
                <p className="text-xs text-gray-500">선택된 {selectedIds.size}건의 주문 상태를 변경합니다</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{selectedIds.size}건</span>의 주문을{' '}
              <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${getStatusColor(bulkStatus)}`}>{bulkStatus}</span>
              {' '}으로 변경할까요?
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBulkConfirmOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer">취소</button>
              <button onClick={confirmBulkChange} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2B5F9E] hover:bg-[#3A7BC8] transition-colors whitespace-nowrap cursor-pointer">변경 적용</button>
            </div>
          </div>
        </>
      )}

      {/* 취소/반품 요청 경고 배너 */}
      {requestOrders.length > 0 && (
        <div className="mb-4 bg-orange-50 border-2 border-orange-300 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-alarm-warning-fill text-orange-600 text-lg"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-orange-800">취소/반품 요청 확인 필요</h4>
              <p className="text-xs text-orange-600">{requestOrders.length}건의 요청이 처리를 기다리고 있습니다</p>
            </div>
          </div>
          <div className="space-y-2">
            {requestOrders.map((order) => {
              const isCancel = order.status === 'cancel_requested';
              const prevStatus = getPreviousStatus(order.notes);
              const approveStatus = isCancel ? 'cancelled' : 'returned';
              return (
                <div key={order.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 border border-orange-100">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{order.client_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{order.order_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onStatusChange(order.id, approveStatus)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-check-line"></i>
                      승인
                    </button>
                    <button
                      onClick={() => onStatusChange(order.id, prevStatus)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-close-line"></i>
                      거절
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 일괄 변경 액션 바 */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#2B5F9E]/5 border border-[#2B5F9E]/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 bg-[#2B5F9E] rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-checkbox-multiple-line text-white text-sm"></i>
            </div>
            <span className="text-sm font-semibold text-[#2B5F9E]">
              {selectedIds.size}건 선택됨
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="text-sm border border-[#2B5F9E]/30 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
            >
              <option value="">상태 선택</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleBulkApply}
              disabled={!bulkStatus}
              className="px-4 py-2 bg-[#2B5F9E] text-white rounded-lg text-sm font-bold hover:bg-[#3A7BC8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              일괄 적용
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-center w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#2B5F9E] cursor-pointer accent-[#2B5F9E]"
                  />
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">주문번호</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">거래처</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">제품명</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">수량</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">금액</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">상태</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">주문일</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50 transition-colors ${selectedIds.has(order.id) ? 'bg-[#2B5F9E]/5' : ''}`}
                >
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[#2B5F9E]"
                    />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-[#2B5F9E] font-semibold">{order.order_number}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{order.client_name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700">{order.product_name}</span>
                  </td>
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <span className="text-sm text-gray-700">{order.quantity}</span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{order.total_price.toLocaleString()}원</span>
                  </td>
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <span className="text-sm text-gray-600">{new Date(order.order_date).toLocaleDateString('ko-KR')}</span>
                  </td>
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {/* 취소/반품 요청 빠른 승인/거절 */}
                      {(order.status === 'cancel_requested' || order.status === 'return_requested') && (
                        <>
                          <button
                            onClick={() => onStatusChange(order.id, order.status === 'cancel_requested' ? 'cancelled' : 'returned')}
                            className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="승인"
                          >
                            <i className="ri-check-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => onStatusChange(order.id, getPreviousStatus(order.notes))}
                            className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="거절 (이전 상태 복원)"
                          >
                            <i className="ri-close-line text-lg"></i>
                          </button>
                        </>
                      )}
                      <button onClick={() => onViewDetail(order)} className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="상세보기">
                        <i className="ri-eye-line text-lg"></i>
                      </button>
                      <button onClick={() => onEditOrder(order)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="수정">
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                      <button
                        onClick={() => handleGenerateInvoice(order)}
                        disabled={generatingInvoice === order.id}
                        className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="인보이스 발행"
                      >
                        {generatingInvoice === order.id ? (
                          <i className="ri-loader-4-line text-lg animate-spin"></i>
                        ) : (
                          <i className="ri-file-text-line text-lg"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 뷰 */}
        <div className="md:hidden divide-y divide-gray-100">
          {/* 모바일 전체선택 바 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[#2B5F9E]"
            />
            <span className="text-xs text-gray-600 font-medium">
              {selectedIds.size > 0 ? `${selectedIds.size}건 선택` : '전체 선택'}
            </span>
          </div>

          {orders.map((order) => (
            <div key={order.id} className={`p-4 ${selectedIds.has(order.id) ? 'bg-[#2B5F9E]/5' : ''}`}>
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggleSelect(order.id)}
                  className="w-4 h-4 rounded border-gray-300 mt-1 flex-shrink-0 cursor-pointer accent-[#2B5F9E]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-[#2B5F9E] font-semibold mb-1">{order.order_number}</p>
                      <p className="text-sm font-medium text-gray-900">{order.client_name}</p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer ml-2 flex-shrink-0 ${getStatusColor(order.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                    </select>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-700 mb-2">{order.product_name}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>수량: {order.quantity}</span>
                      <span className="text-sm font-semibold text-gray-900">{order.total_price.toLocaleString()}원</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    <i className="ri-calendar-line mr-1"></i>
                    {new Date(order.order_date).toLocaleDateString('ko-KR')}
                  </p>
                  {/* 모바일 카드 - 취소/반품 요청 빠른 처리 */}
                  {(order.status === 'cancel_requested' || order.status === 'return_requested') && (
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => onStatusChange(order.id, order.status === 'cancel_requested' ? 'cancelled' : 'returned')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-check-line"></i>승인
                      </button>
                      <button
                        onClick={() => onStatusChange(order.id, getPreviousStatus(order.notes))}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-close-line"></i>거절
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => onViewDetail(order)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer">
                      <i className="ri-eye-line"></i>상세
                    </button>
                    <button onClick={() => onEditOrder(order)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer">
                      <i className="ri-edit-line"></i>수정
                    </button>
                    <button
                      onClick={() => handleGenerateInvoice(order)}
                      disabled={generatingInvoice === order.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingInvoice === order.id ? (
                        <><i className="ri-loader-4-line animate-spin"></i>발행중</>
                      ) : (
                        <><i className="ri-file-text-line"></i>인보이스</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}