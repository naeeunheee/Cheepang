import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../lib/supabase';

interface Product {
  id: string;
  name: string;
  model_code: string;
  unit_price: number;
}

interface ProductOption {
  id: string;
  model_code: string;
  size_info: string;
}

interface OrderRow {
  uid: string;
  productId: string;
  productName: string;
  modelCode: string;
  optionId: string;
  sizeInfo: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  client_id: string;
  client_name: string;
  order_number: string;
  notes: string;
  status: string;
}

interface PhotoOrderProcessorProps {
  order: Order;
  onDone: () => void;
}

function parseEasyOrderNotes(notes: string) {
  try {
    const p = JSON.parse(notes || '{}');
    if (p && (p.type === 'easy_order' || p.type === 'photo_order')) return p;
  } catch { /* ignore */ }
  return {};
}

export default function PhotoOrderProcessor({ order, onDone }: PhotoOrderProcessorProps) {
  const notes = useMemo(() => parseEasyOrderNotes(order.notes), [order.notes]);

  const images: string[] = notes.images || [];
  const textOrder: string = notes.text_order || '';
  const deliveryInfo: string = notes.delivery_info || notes.delivery_type || '';
  const labName: string = notes.lab_name || '';
  const memo: string = notes.memo || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, ProductOption[]>>({});
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_ko, name, model_code, unit_price')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setProducts(data.map((p: any) => ({
            id: p.id,
            name: p.name_ko || p.name || '',
            model_code: p.model_code || '',
            unit_price: p.unit_price || 0,
          })));
        }
      });
  }, []);

  const loadOptions = async (productId: string) => {
    if (optionsMap[productId] !== undefined) return;
    setLoadingOptions(prev => new Set(prev).add(productId));
    try {
      const { data } = await supabase
        .from('product_options')
        .select('id, model_code, size_info')
        .eq('product_id', productId)
        .order('size_info', { ascending: true });
      setOptionsMap(prev => ({ ...prev, [productId]: data || [] }));
    } finally {
      setLoadingOptions(prev => { const n = new Set(prev); n.delete(productId); return n; });
    }
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      uid: `row-${Date.now()}-${Math.random()}`,
      productId: '', productName: '', modelCode: '',
      optionId: '', sizeInfo: '', quantity: 1, unitPrice: 0,
    }]);
  };

  const removeRow = (uid: string) => setRows(prev => prev.filter(r => r.uid !== uid));

  const updateRow = (uid: string, updates: Partial<OrderRow>) =>
    setRows(prev => prev.map(r => r.uid === uid ? { ...r, ...updates } : r));

  const handleProductChange = async (uid: string, productId: string) => {
    if (!productId) { updateRow(uid, { productId: '', productName: '', modelCode: '', unitPrice: 0, optionId: '', sizeInfo: '' }); return; }
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    updateRow(uid, { productId, productName: prod.name, modelCode: prod.model_code, unitPrice: prod.unit_price, optionId: '', sizeInfo: '' });
    await loadOptions(productId);
  };

  const handleOptionChange = (uid: string, optionId: string) => {
    const row = rows.find(r => r.uid === uid);
    if (!row) return;
    if (!optionId) { updateRow(uid, { optionId: '', sizeInfo: '' }); return; }
    const opts = optionsMap[row.productId] || [];
    const opt = opts.find(o => o.id === optionId);
    if (opt) updateRow(uid, { optionId, sizeInfo: opt.size_info, modelCode: opt.model_code || row.modelCode });
  };

  const total = rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0);

  const handleConfirm = async () => {
    if (rows.length === 0) { alert('제품을 1개 이상 추가해주세요.'); return; }
    const invalidRows = rows.filter(r => !r.productId || r.quantity < 1);
    if (invalidRows.length > 0) { alert('모든 행에 제품과 수량을 입력해주세요.'); return; }

    setIsProcessing(true);
    try {
      const items = rows.map(r => ({
        productId: r.productId,
        productName: r.productName,
        productCode: r.sizeInfo ? `${r.modelCode} (${r.sizeInfo})` : r.modelCode,
        sizeInfo: r.sizeInfo,
        model_code: r.modelCode,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        totalPrice: r.quantity * r.unitPrice,
      }));

      let existingNotes: Record<string, any> = {};
      try { existingNotes = JSON.parse(order.notes || '{}'); } catch { /* ignore */ }

      const updatedNotes = JSON.stringify({
        ...existingNotes,
        confirmed_items: items,
        paymentMethod: '잔액차감',
        items,
        confirmed_at: new Date().toISOString(),
      });

      const { error } = await supabase.from('orders').update({
        status: '주문확인',
        product_name: rows.map(r => r.sizeInfo ? `${r.productName} (${r.sizeInfo})` : r.productName).join(', '),
        quantity: rows.reduce((s, r) => s + r.quantity, 0),
        unit_price: rows[0]?.unitPrice || 0,
        total_price: total,
        notes: updatedNotes,
      }).eq('id', order.id);

      if (error) throw error;
      alert(`주문 확정 완료!\n주문번호: ${order.order_number}\n합계: ₩${total.toLocaleString()}`);
      onDone();
    } catch (err) {
      alert('처리 실패: ' + (err instanceof Error ? err.message : '오류'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      let existingNotes: Record<string, any> = {};
      try { existingNotes = JSON.parse(order.notes || '{}'); } catch { /* ignore */ }
      await supabase.from('orders').update({
        status: 'cancelled',
        notes: JSON.stringify({ ...existingNotes, reject_reason: rejectReason, rejected_at: new Date().toISOString() }),
      }).eq('id', order.id);
      setShowRejectModal(false);
      onDone();
    } catch (err) {
      alert('처리 실패: ' + (err instanceof Error ? err.message : '오류'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* 라이트박스 */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <img src={lightboxImg} alt="주문 사진" className="w-full h-full object-contain rounded-xl" />
            <button onClick={() => setLightboxImg(null)} className="absolute top-3 right-3 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center cursor-pointer transition-colors">
              <i className="ri-close-line text-white text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* 거절 모달 */}
      {showRejectModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setShowRejectModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">주문 거절</h3>
            <p className="text-xs text-gray-500 mb-4">거절 사유를 입력해주세요 (선택)</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="예: 재고 없음, 모델코드 확인 필요, 고객에게 연락 후 처리 예정"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer whitespace-nowrap">취소</button>
              <button onClick={handleReject} disabled={isProcessing} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 cursor-pointer disabled:opacity-50 whitespace-nowrap">
                {isProcessing ? '처리 중...' : '거절 확정'}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── 왼쪽: 주문 내용 ─── */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <i className="ri-file-text-line text-purple-500"></i>
            간편주문 내용
          </h4>

          {/* 텍스트 주문 */}
          {textOrder && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <i className="ri-text text-sm"></i>텍스트 주문 내용
              </p>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed break-all">{textOrder}</pre>
            </div>
          )}

          {/* 업로드 이미지 */}
          {images.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <i className="ri-image-line text-sm"></i>업로드 이미지 ({images.length}장) — 클릭하여 확대
              </p>
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <div key={i} onClick={() => setLightboxImg(url)} className="aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity bg-gray-50">
                    <img src={url} alt={`주문사진 ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 배송 정보 */}
          {(deliveryInfo || labName) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <i className="ri-truck-line text-blue-500 mt-0.5 flex-shrink-0"></i>
              <div>
                <p className="text-xs font-semibold text-blue-700">배송 정보</p>
                <p className="text-sm text-blue-800">{deliveryInfo}</p>
                {labName && <p className="text-xs text-blue-600 mt-0.5">기공소: {labName}</p>}
              </div>
            </div>
          )}

          {/* 메모 */}
          {memo && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <i className="ri-chat-1-line text-amber-500 mt-0.5 flex-shrink-0"></i>
              <p className="text-sm text-amber-800">{memo}</p>
            </div>
          )}

          {!textOrder && images.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">주문 내용이 없습니다</div>
          )}
        </div>

        {/* ─── 오른쪽: 주문서 생성 ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <i className="ri-list-check text-emerald-500"></i>
              주문서 생성
            </h4>
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B5F9E] text-white rounded-lg text-xs font-bold hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line"></i>제품 추가
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <i className="ri-add-circle-line text-3xl text-gray-300 mb-2"></i>
              <p className="text-sm text-gray-400">"제품 추가" 버튼을 눌러 품목을 추가하세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => {
                const opts = optionsMap[row.productId] || [];
                const hasOptions = opts.length > 0;
                return (
                  <div key={row.uid} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    {/* 제품 선택 */}
                    <div className="flex items-center gap-2">
                      <select
                        value={row.productId}
                        onChange={e => handleProductChange(row.uid, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#2B5F9E] cursor-pointer min-w-0"
                      >
                        <option value="">제품 선택</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.model_code ? `[${p.model_code}] ` : ''}{p.name}</option>
                        ))}
                      </select>
                      <button onClick={() => removeRow(row.uid)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0">
                        <i className="ri-delete-bin-line text-base"></i>
                      </button>
                    </div>

                    {/* 규격 선택 (옵션이 있을 때) */}
                    {row.productId && (
                      loadingOptions.has(row.productId) ? (
                        <div className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
                          <i className="ri-loader-4-line animate-spin"></i>규격 로딩 중...
                        </div>
                      ) : hasOptions ? (
                        <select
                          value={row.optionId}
                          onChange={e => handleOptionChange(row.uid, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
                        >
                          <option value="">규격 선택 (선택)</option>
                          {opts.map(o => (
                            <option key={o.id} value={o.id}>{o.model_code ? `[${o.model_code}] ` : ''}{o.size_info}</option>
                          ))}
                        </select>
                      ) : null
                    )}

                    {/* 수량 / 단가 */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <label className="text-xs text-gray-500 flex-shrink-0">수량</label>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={e => updateRow(row.uid, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:border-[#2B5F9E]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1">
                        <label className="text-xs text-gray-500 flex-shrink-0">단가</label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={row.unitPrice}
                          onChange={e => updateRow(row.uid, { unitPrice: parseInt(e.target.value) || 0 })}
                          className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-right focus:outline-none focus:border-[#2B5F9E]"
                        />
                      </div>
                      <div className="text-sm font-bold text-[#2B5F9E] flex-shrink-0 min-w-[70px] text-right">
                        ₩{(row.quantity * row.unitPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 합계 */}
              <div className="bg-[#2B5F9E]/5 border border-[#2B5F9E]/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">합계 ({rows.length}개 품목)</span>
                <span className="text-xl font-extrabold text-[#2B5F9E]">₩{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleConfirm}
              disabled={isProcessing || rows.length === 0}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="ri-check-double-line text-base"></i>
              {isProcessing ? '처리 중...' : '주문 확정 (주문확인으로 전환)'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onDone()}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-time-line mr-1"></i>보류
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <i className="ri-close-line mr-1"></i>거절
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
