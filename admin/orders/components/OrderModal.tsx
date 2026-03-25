import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { notifyClientOrderStatus } from '../../../../utils/kakaoNotify';
import PhotoOrderProcessor from './PhotoOrderProcessor';

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
}

interface Client {
  id: string;
  name: string;
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

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order>) => void;
  order: Order | null;
  clients: Client[];
  mode: 'create' | 'edit' | 'view';
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

/** 상세보기 모드 전용 품목 목록 컴포넌트 */
function OrderItemsView({ notes }: { notes: string }) {
  const parsed = parseOrderNotes(notes);

  // 사진 주문 전용 뷰
  if (parsed && (parsed as any).type === 'photo_order') {
    const photoNotes = parsed as any;
    const images: string[] = photoNotes.images || [];
    const memo: string = photoNotes.memo || '';
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold">
            <i className="ri-camera-fill text-sm"></i>
            사진 업로드 주문
          </span>
          {images.length > 0 && (
            <span className="text-xs text-gray-400">{images.length}장의 이미지</span>
          )}
        </div>

        {memo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-semibold mb-0.5">메모</p>
            <p className="text-sm text-amber-900">{memo}</p>
          </div>
        )}

        {images.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">업로드된 이미지</p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="cursor-pointer group">
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={url}
                      alt={`주문사진 ${i + 1}`}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <p className="text-[10px] text-center text-gray-400 mt-1">사진 {i + 1}</p>
                </a>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              클릭하면 원본 이미지를 볼 수 있습니다
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <i className="ri-image-line text-2xl text-gray-300 mb-1"></i>
            <p className="text-xs text-gray-400">이미지를 불러올 수 없습니다</p>
          </div>
        )}
      </div>
    );
  }

  if (!parsed || !parsed.items || parsed.items.length === 0) {
    // JSON이 아닌 일반 텍스트 비고
    return notes ? (
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
    ) : (
      <p className="text-sm text-gray-400">-</p>
    );
  }

  const { items, paymentMethod } = parsed;
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);

  return (
    <div className="space-y-3">
      {/* 결제 방식 뱃지 */}
      {paymentMethod && (
        <span className="inline-flex items-center gap-1 text-xs bg-[#2B5F9E]/10 text-[#2B5F9E] px-2.5 py-1 rounded-full font-semibold">
          <i className="ri-bank-card-line"></i>
          {paymentMethod}
        </span>
      )}

      {/* 품목 목록 */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500">
          <span className="col-span-6">제품명</span>
          <span className="col-span-2 text-center">수량</span>
          <span className="col-span-2 text-right">단가</span>
          <span className="col-span-2 text-right">소계</span>
        </div>

        {/* 품목 행 */}
        <div className="divide-y divide-gray-50">
          {items.map((item, idx) => (
            <div key={idx} className="px-4 py-3">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-6">
                  <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                  {item.productCode && (
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{item.productCode}</p>
                  )}
                  
                  {/* 규격 정보 (파란 배경 강조) */}
                  {item.size_info && (
                    <div className="mt-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                      <p className="text-[10px] text-blue-600 font-semibold mb-0.5">규격</p>
                      <p className="text-xs text-blue-800 font-medium">{item.size_info}</p>
                    </div>
                  )}
                  
                  {/* 품목코드 */}
                  {item.model_code && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 font-semibold">품목코드:</span>
                      <span className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {item.model_code}
                      </span>
                    </div>
                  )}
                  
                  {/* 규격/품목코드 미등록 표시 */}
                  {!item.size_info && !item.model_code && (
                    <span className="inline-block mt-1.5 text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded">
                      규격 미등록
                    </span>
                  )}
                  
                  {/* 옵션 */}
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(item.selectedOptions).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 구성품 */}
                  {item.components && item.components.length > 0 && (
                    <div className="mt-1.5 pl-2 border-l-2 border-[#2B5F9E]/20 space-y-0.5">
                      {item.components.map((comp, ci) => (
                        <div key={ci} className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>{comp.productName}</span>
                          <span className="ml-2 text-gray-400">×{comp.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-center text-sm text-gray-700 font-medium pt-0.5">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right text-sm text-gray-600 pt-0.5">
                  ₩{(item.unitPrice ?? 0).toLocaleString()}
                </div>
                <div className="col-span-2 text-right text-sm font-bold text-[#2B5F9E] pt-0.5">
                  ₩{(item.totalPrice ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 합계 행 */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-500 font-semibold">
            총 {items.length}개 품목 · 수량 합계 {totalQty}개
          </span>
          <span className="text-base font-extrabold text-[#2B5F9E]">
            ₩{items.reduce((s, i) => s + (i.totalPrice ?? 0), 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OrderModal({ isOpen, onClose, onSave, order, clients, mode }: OrderModalProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    notes: '',
    delivery_date: '',
    status: '주문확인'
  });

  // ✅ Supabase에서 실제 제품 목록 로드
  const [supabaseProducts, setSupabaseProducts] = useState<{ id: string; name: string; unit_price: number }[]>([]);
  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_ko, name, unit_price')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setSupabaseProducts(
            data.map((p: any) => ({
              id: p.id,
              name: p.name_ko || p.name || '',
              unit_price: p.unit_price || 0,
            }))
          );
        }
      });
  }, []);

  useEffect(() => {
    if (order && mode !== 'create') {
      setFormData({
        client_id: order.client_id,
        product_name: order.product_name,
        quantity: order.quantity,
        unit_price: order.unit_price,
        notes: order.notes || '',
        delivery_date: order.delivery_date || '',
        status: order.status
      });
    } else {
      setFormData({
        client_id: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        notes: '',
        delivery_date: '',
        status: '주문확인'
      });
    }
  }, [order, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === formData.client_id);
    
    if (mode === 'create' && formData.client_id) {
      try {
        const totalPrice = formData.quantity * formData.unit_price;
        const { data: clientPoint, error: pointError } = await supabase
          .from('client_points')
          .select('point_balance')
          .eq('client_id', formData.client_id)
          .maybeSingle();

        if (!pointError && clientPoint) {
          const currentBalance = clientPoint.point_balance || 0;
          const newBalance = currentBalance - totalPrice;

          await supabase
            .from('client_points')
            .update({ point_balance: newBalance, last_updated: new Date().toISOString() })
            .eq('client_id', formData.client_id);

          await supabase
            .from('clients')
            .update({ point_balance: newBalance })
            .eq('business_number', formData.client_id);

          const tempOrderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

          await supabase.from('point_transactions').insert([{
            client_id: formData.client_id,
            client_name: selectedClient?.name || '',
            type: 'order',
            amount: -totalPrice,
            balance_after: newBalance,
            description: `주문 결제 (${tempOrderNumber})`,
            order_id: null,
            created_at: new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error('포인트 차감 처리 실패:', err);
      }
    }

    // 수정 모드에서 상태 변경 시 카카오 알림톡 발송
    if (mode === 'edit' && order && formData.status !== order.status) {
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('phone')
          .eq('id', formData.client_id)
          .maybeSingle();

        if (clientData?.phone) {
          await notifyClientOrderStatus({
            clientPhone: clientData.phone,
            orderNumber: order.order_number,
            status: formData.status,
            productName: formData.product_name,
            amount: formData.status === '환불' ? (formData.quantity * formData.unit_price) : undefined,
          });
          console.log('✅ 주문 상태 변경 알림 발송 완료');
        }
      } catch (err) {
        console.error('주문 상태 알림 발송 실패:', err);
      }
    }

    onSave({
      ...formData,
      client_name: selectedClient?.name || '',
      total_price: formData.quantity * formData.unit_price
    });
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const isPhotoOrder = order?.status === 'photo_order';
  const showExchangeRefundNote = formData.status === '교환' || formData.status === '반품' || formData.status === '환불';

  const getStatusColor = (status: string) => {
    switch (status) {
      case '주문접수': return 'bg-blue-100 text-blue-700';
      case '주문확인': return 'bg-emerald-100 text-emerald-700';
      case '배송준비': return 'bg-orange-100 text-orange-700';
      case '배송중':   return 'bg-violet-100 text-violet-700';
      case '배송완료': return 'bg-gray-100 text-gray-600';
      case '주문취소': return 'bg-red-100 text-red-600';
      case '교환':    return 'bg-orange-100 text-orange-700';
      case '반품':    return 'bg-red-100 text-red-700';
      case '환불':    return 'bg-purple-100 text-purple-700';
      case 'photo_order': return 'bg-purple-100 text-purple-700';
      default:        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl w-full max-h-[90vh] overflow-y-auto ${isPhotoOrder && isViewMode ? 'max-w-4xl' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? '새 주문 등록' : mode === 'edit' ? '주문 수정' : '주문 상세'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* View 모드 전용 레이아웃 */}
        {isViewMode && order ? (
          <div className="p-6 space-y-5">
            {/* 간편주문인 경우 — PhotoOrderProcessor 표시 */}
            {isPhotoOrder ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold">
                    <i className="ri-camera-fill text-sm"></i>
                    간편주문 접수 — {order.order_number}
                  </span>
                </div>
                <PhotoOrderProcessor order={order} onDone={onClose} />
              </>
            ) : (
              <>
                {/* 주문 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">주문번호</p>
                    <p className="text-sm font-bold text-[#2B5F9E]">{order.order_number}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">주문 상태</p>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">거래처</p>
                    <p className="text-sm font-semibold text-gray-800">{order.client_name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">주문일</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(order.order_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {order.delivery_date && (
                    <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                      <p className="text-xs text-gray-500 mb-1">배송예정일</p>
                      <p className="text-sm font-semibold text-gray-800">{order.delivery_date}</p>
                    </div>
                  )}
                </div>

                {/* 총 금액 */}
                <div className="bg-[#2B5F9E]/5 border border-[#2B5F9E]/10 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">총 결제 금액</span>
                  <span className="text-2xl font-extrabold text-[#2B5F9E]">
                    ₩{order.total_price.toLocaleString()}
                  </span>
                </div>

                {/* 품목 상세 */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">주문 품목</p>
                  <OrderItemsView notes={order.notes} />
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  닫기
                </button>
              </>
            )}
          </div>
        ) : (
          /* 생성/수정 모드 폼 */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">거래처</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer bg-white"
                required
              >
                <option value="">거래처 선택</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제품</label>
              <select
                value={formData.product_name}
                onChange={(e) => {
                  const selected = supabaseProducts.find((p) => p.name === e.target.value);
                  setFormData({
                    ...formData,
                    product_name: e.target.value,
                    unit_price: selected?.unit_price ?? formData.unit_price,
                  });
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer bg-white"
                required
              >
                <option value="">제품 선택</option>
                {supabaseProducts.map((product) => (
                  <option key={product.id} value={product.name}>{product.name}</option>
                ))}
              </select>
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">수량</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">단가 (원)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
                  required
                />
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 금액</span>
                <span className="text-xl font-bold text-[#2B5F9E]">
                  {(formData.quantity * formData.unit_price).toLocaleString()}원
                </span>
              </div>
            </div>

            {/* Status - 수정 모드에서만 표시 */}
            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주문 상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer bg-white"
                >
                  <option value="주문접수">주문접수</option>
                  <option value="주문확인">주문확인</option>
                  <option value="배송준비">배송준비</option>
                  <option value="배송중">배송중</option>
                  <option value="배송완료">배송완료</option>
                  <option value="주문취소">주문취소</option>
                  <option value="교환">교환</option>
                  <option value="반품">반품</option>
                  <option value="환불">환불</option>
                  <option value="photo_order">📷 사진주문</option>
                </select>
              </div>
            )}

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">배송예정일</label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고
                {showExchangeRefundNote && mode === 'edit' && (
                  <span className="ml-2 text-xs text-amber-600">(교환/반품/환불 사유를 입력해주세요)</span>
                )}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 500) })}
                rows={3}
                maxLength={500}
                placeholder={showExchangeRefundNote ? "교환/반품/환불 사유를 상세히 입력해주세요" : "특이사항을 입력하세요"}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#2B5F9E] text-white rounded-lg font-medium hover:bg-[#234b7d] transition-colors whitespace-nowrap cursor-pointer"
              >
                {mode === 'create' ? '등록' : '저장'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
