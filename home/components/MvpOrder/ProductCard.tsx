
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HignessProduct,
  getProductById,
} from '../../../../mocks/highness-catalog';

interface ProductCardProps {
  product: HignessProduct;
  unitPrice: number;
  prices: Record<string, number>;
  onAddToCart: (
    productId: string,
    productName: string,
    modelCode: string,
    options: Record<string, string>,
    quantity: number,
    unitPrice: number,
    components?: ComponentItem[],
  ) => void;
}

export interface ComponentItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

export default function ProductCard({
  product,
  unitPrice,
  prices,
  onAddToCart,
}: ProductCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () => {
      const defaults: Record<string, string> = {};
      const opts = Array.isArray(product.options) ? product.options : [];
      opts.forEach((opt) => {
        defaults[opt.label] = opt.values[0] ?? '';
      });
      return defaults;
    },
  );

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showComponents, setShowComponents] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<Record<string, boolean>>({});
  const [componentQty, setComponentQty] = useState<Record<string, number>>({});
  const [showImagePopup, setShowImagePopup] = useState(false);

  const hasKitOptions =
    product.kit_price_simple !== undefined && product.kit_price_full !== undefined;
  const currentKitOption = selectedOptions['구성'] ?? '';
  const isFullKit = currentKitOption.toLowerCase().includes('full');

  const effectivePrice = useMemo(() => {
    if (hasKitOptions) {
      return isFullKit
        ? product.kit_price_full ?? unitPrice
        : product.kit_price_simple ?? unitPrice;
    }
    return unitPrice;
  }, [hasKitOptions, isFullKit, product.kit_price_full, product.kit_price_simple, unitPrice]);

  const relatedProducts = (Array.isArray(product.related_product_ids) ? product.related_product_ids : [])
    .map((id) => getProductById(id))
    .filter((p): p is HignessProduct => p !== undefined);

  const selectedComponentItems: ComponentItem[] = relatedProducts
    .filter((p) => selectedComponents[p.id])
    .map((p) => ({
      productId: p.id,
      productName: p.name_ko,
      productCode: p.model_code,
      quantity: componentQty[p.id] ?? 1,
      unitPrice: prices[p.id] ?? p.base_price,
    }));

  const selectedComponentCount = selectedComponentItems.length;

  const handleOptionChange = (label: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [label]: value }));
  };

  const toggleComponent = (id: string) => {
    setSelectedComponents((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id] && !componentQty[id]) {
        setComponentQty((q) => ({ ...q, [id]: 1 }));
      }
      return next;
    });
  };

  const handleComponentQty = (id: string, val: number) => {
    setComponentQty((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  const handleAdd = () => {
    if (quantity < 1) return;
    onAddToCart(
      product.id,
      product.name_ko,
      product.model_code,
      { ...selectedOptions },
      quantity,
      effectivePrice,
      selectedComponentCount > 0 ? selectedComponentItems : undefined,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const addButtonClass = added
    ? 'bg-emerald-500 text-white'
    : 'bg-[#2B5F9E] text-white hover:bg-[#3A7BC8]';

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">
        {/* 이미지 프레임 - 클릭 시 팝업 */}
        <div
          className="w-full aspect-square bg-white border-b border-gray-100 p-2 md:p-3 flex items-center justify-center overflow-hidden relative cursor-pointer group"
          onClick={() => !imageError && setShowImagePopup(true)}
        >
          {!imageError ? (
            <>
              <img
                src={product.image_url}
                alt={product.name_ko}
                className="w-full h-full object-contain object-center transition-transform duration-200 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
              {/* 확대 힌트 오버레이 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                  <i className="ri-zoom-in-line text-[#2B5F9E] text-sm"></i>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full">
              <i className="ri-image-line text-2xl md:text-3xl mb-1"></i>
              <span className="text-[8px] md:text-[10px]">이미지 준비중</span>
            </div>
          )}
          {/* 모델 코드 뱃지 */}
          <span className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-[#2B5F9E]/10 text-[#2B5F9E] text-[7px] md:text-[9px] font-bold px-1 md:px-1.5 py-0.5 rounded-md z-10">
            {product.model_code}
          </span>
          {/* 키트 뱃지 */}
          {product.kit_components && product.kit_components.length > 0 && (
            <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-amber-100 text-amber-700 text-[7px] md:text-[9px] font-bold px-1 md:px-1.5 py-0.5 rounded-md z-10">
              KIT
            </span>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-2.5 md:p-4 flex flex-col flex-1">
          <h3 className="text-[11px] md:text-sm font-bold text-gray-800 mb-0.5 leading-tight line-clamp-2">
            {product.name_ko}
          </h3>
          <p className="text-[8px] md:text-[10px] text-gray-400 font-mono mb-0.5 truncate">
            {product.name_en}
          </p>
          <p className="text-[8px] md:text-[10px] text-gray-500 mb-1.5 md:mb-2 line-clamp-2 hidden sm:block">
            {product.short_desc}
          </p>

          {/* 가격 표시 */}
          {hasKitOptions ? (
            <div className="mb-2 md:mb-3">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] md:text-xs text-[#2B5F9E] font-semibold">
                  ₩{effectivePrice.toLocaleString()}
                </p>
                <span className={`text-[7px] md:text-[9px] font-bold px-1 py-0.5 rounded ${isFullKit ? 'bg-[#2B5F9E]/10 text-[#2B5F9E]' : 'bg-emerald-50 text-emerald-600'}`}>
                  {isFullKit ? 'Full' : 'Simple'}
                </span>
              </div>
              {product.kit_price_simple !== product.kit_price_full && (
                <p className="text-[7px] md:text-[9px] text-gray-400 mt-0.5">
                  Simple ₩{(product.kit_price_simple ?? 0).toLocaleString()} / Full ₩{(product.kit_price_full ?? 0).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[10px] md:text-xs text-[#2B5F9E] font-semibold mb-2 md:mb-3">
              ₩{effectivePrice.toLocaleString()} / 개
            </p>
          )}

          {/* 옵션 선택 */}
          <div className="space-y-1.5 md:space-y-2 mb-2 md:mb-3">
            {(Array.isArray(product.options) ? product.options : []).map((opt) => (
              <div key={opt.label}>
                <label className="text-[8px] md:text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  {opt.label}
                </label>
                <select
                  value={selectedOptions[opt.label] ?? ''}
                  onChange={(e) => handleOptionChange(opt.label, e.target.value)}
                  className={`w-full mt-0.5 px-1.5 md:px-2 py-1 md:py-1.5 text-[10px] md:text-xs border rounded-lg bg-white focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 cursor-pointer ${opt.label === '구성' && hasKitOptions ? 'border-[#2B5F9E]/40 font-semibold' : 'border-gray-200'}`}
                >
                  {opt.values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                      {opt.label === '구성' && hasKitOptions && v.toLowerCase().includes('full')
                        ? ` (₩${(product.kit_price_full ?? 0).toLocaleString()})`
                        : opt.label === '구성' && hasKitOptions
                        ? ` (₩${(product.kit_price_simple ?? 0).toLocaleString()})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* 구성품 추가 */}
          {relatedProducts.length > 0 && (
            <div className="mb-2 md:mb-3">
              <button
                type="button"
                onClick={() => setShowComponents((v) => !v)}
                className="w-full flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-dashed border-gray-300 hover:border-[#2B5F9E] hover:bg-[#2B5F9E]/5 transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[11px] font-semibold text-gray-600 group-hover:text-[#2B5F9E]">
                  <i className="ri-add-circle-line text-xs md:text-sm w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center"></i>
                  구성품
                  {selectedComponentCount > 0 && (
                    <span className="bg-[#2B5F9E] text-white text-[8px] md:text-[9px] font-bold px-1 md:px-1.5 py-0.5 rounded-full ml-0.5">
                      {selectedComponentCount}
                    </span>
                  )}
                </span>
                <i className={`ri-arrow-down-s-line text-gray-400 transition-transform duration-200 w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center ${showComponents ? 'rotate-180' : ''}`}></i>
              </button>

              {showComponents && (
                <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">함께 구성 가능한 제품</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {relatedProducts.map((comp) => {
                      const isChecked = !!selectedComponents[comp.id];
                      const compPrice = prices[comp.id] ?? comp.base_price;
                      return (
                        <div
                          key={comp.id}
                          className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors cursor-pointer ${isChecked ? 'bg-[#2B5F9E]/5' : 'hover:bg-gray-50'}`}
                          onClick={() => toggleComponent(comp.id)}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-[#2B5F9E] border-[#2B5F9E]' : 'border-gray-300 bg-white'}`}>
                            {isChecked && <i className="ri-check-line text-white text-[10px]"></i>}
                          </div>
                          <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img src={comp.image_url} alt={comp.name_ko} className="w-full h-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-gray-700 truncate leading-tight">{comp.name_ko}</p>
                            <p className="text-[9px] text-gray-400 font-mono">{comp.model_code}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-bold text-[#2B5F9E]">₩{compPrice.toLocaleString()}</span>
                            {isChecked && (
                              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
                                <button type="button" onClick={() => handleComponentQty(comp.id, (componentQty[comp.id] ?? 1) - 1)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">
                                  <i className="ri-subtract-line text-[10px]"></i>
                                </button>
                                <span className="w-6 text-center text-[10px] font-medium border-x border-gray-200">{componentQty[comp.id] ?? 1}</span>
                                <button type="button" onClick={() => handleComponentQty(comp.id, (componentQty[comp.id] ?? 1) + 1)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">
                                  <i className="ri-add-line text-[10px]"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedComponentCount > 0 && (
                    <div className="px-3 py-2 bg-[#2B5F9E]/5 border-t border-[#2B5F9E]/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#2B5F9E] font-semibold">구성품 {selectedComponentCount}종 선택됨</span>
                        <span className="text-[10px] font-bold text-[#2B5F9E]">+₩{selectedComponentItems.reduce((s, c) => s + c.unitPrice * c.quantity, 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 수량 & 장바구니 */}
          <div className="mt-auto">
            <label className="text-[8px] md:text-[10px] font-medium text-gray-500 uppercase tracking-wide">수량</label>
            <div className="flex items-center mt-0.5 border border-gray-200 rounded-lg bg-white" style={{ overflow: 'visible' }}>
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer rounded-l-lg border-r border-gray-200">
                <i className="ri-subtract-line text-sm"></i>
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center text-[11px] font-medium h-8 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
              />
              <button type="button" onClick={() => setQuantity((q) => q + 1)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer rounded-r-lg border-l border-gray-200">
                <i className="ri-add-line text-sm"></i>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className={`w-full mt-2 md:mt-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 md:gap-1.5 ${addButtonClass}`}
            >
              {added ? (
                <>
                  <i className="ri-check-line text-xs md:text-sm w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center"></i>
                  담김!
                </>
              ) : (
                <>
                  <i className="ri-shopping-cart-line text-xs md:text-sm w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center"></i>
                  {selectedComponentCount > 0 ? `세트 (${selectedComponentCount + 1}종)` : hasKitOptions ? `₩${effectivePrice.toLocaleString()}` : '장바구니'}
                </>
              )}
            </button>

            <div className="flex gap-1.5 md:gap-2 mt-1.5 md:mt-2">
              {product.detail_page_id && (
                <Link to={`/product/${product.detail_page_id}`} className="flex-1 py-1.5 md:py-2 rounded-lg text-[9px] md:text-xs font-medium border border-[#2B5F9E] text-[#2B5F9E] hover:bg-[#2B5F9E]/5 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-0.5 md:gap-1">
                  <i className="ri-information-line text-xs md:text-sm w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center"></i>
                  상세
                </Link>
              )}
              <button type="button" onClick={() => setShowInquiryModal(true)} className="flex-1 py-1.5 md:py-2 rounded-lg text-[9px] md:text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-0.5 md:gap-1">
                <i className="ri-question-line text-xs md:text-sm w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center"></i>
                문의
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 팝업 모달 */}
      {showImagePopup && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowImagePopup(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => setShowImagePopup(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-gray-100 shadow-md transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl text-gray-700"></i>
            </button>

            {/* 제품 정보 헤더 */}
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="bg-[#2B5F9E]/10 text-[#2B5F9E] text-xs font-bold px-2 py-0.5 rounded-md">
                  {product.model_code}
                </span>
                {product.kit_components && product.kit_components.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md">KIT</span>
                )}
              </div>
              <h3 className="text-base font-bold text-gray-800 mt-1.5">{product.name_ko}</h3>
              <p className="text-xs text-gray-400 font-mono">{product.name_en}</p>
            </div>

            {/* 이미지 영역 */}
            <div className="bg-white p-6 flex items-center justify-center" style={{ minHeight: '320px' }}>
              <img
                src={product.image_url}
                alt={product.name_ko}
                className="max-w-full max-h-72 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* 하단 설명 */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-600 leading-relaxed">{product.short_desc}</p>
            </div>
          </div>
        </div>
      )}

      {showInquiryModal && (
        <InquiryModal
          productName={`${product.name_ko} (${product.model_code})`}
          onClose={() => setShowInquiryModal(false)}
        />
      )}
    </>
  );
}

function InquiryModal({ productName, onClose }: { productName: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    clinicName: '',
    email: '',
    interestedProduct: productName,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formBody = new URLSearchParams();
      Object.entries(formData).forEach(([k, v]) => formBody.append(k, v));
      const response = await fetch('https://readdy.ai/api/form/d6f8671ghdq4qda6vilg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
      });
      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">제품 문의</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>
        {submitSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-3xl text-emerald-600"></i>
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">문의가 접수되었습니다</h4>
            <p className="text-sm text-gray-600">빠른 시일 내에 연락드리겠습니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4" data-readdy-form>
            {[
              { label: '이름', name: 'name', type: 'text', required: true, placeholder: '홍길동' },
              { label: '연락처', name: 'phone', type: 'tel', required: true, placeholder: '010-1234-5678' },
              { label: '이메일', name: 'email', type: 'email', required: true, placeholder: 'example@email.com' },
              { label: '치과명', name: 'clinicName', type: 'text', required: false, placeholder: '치팡 치과' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  required={field.required}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관심 제품</label>
              <input type="text" name="interestedProduct" value={formData.interestedProduct} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문의 내용 <span className="text-red-500">*</span></label>
              <textarea
                name="message"
                required
                maxLength={500}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm resize-none"
                rows={4}
                placeholder="문의하실 내용을 입력해주세요 (최대 500자)"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.message.length} / 500자</p>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#2B5F9E] text-white rounded-lg font-semibold hover:bg-[#3A7BC8] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap">
              {isSubmitting ? '전송 중...' : '문의하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
