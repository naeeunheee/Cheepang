import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  highnessProducts,
  highnessCategories,
  type HignessProduct,
} from '../../../mocks/highness-catalog';

interface ProductHeroProps {
  productId?: string;
  product?: HignessProduct;
}

interface CartItem {
  product: HignessProduct;
  selectedOptions: Record<string, string>;
  quantity: number;
}

export default function ProductHero({ productId, product: productProp }: ProductHeroProps) {
  // 외부에서 product prop이 오면 그것을 우선 사용 (localStorage 오버라이드 적용된 데이터)
  const product =
    productProp ||
    highnessProducts.find((p) => p.id === productId) ||
    highnessProducts.find((p) => p.detail_page_id === productId) ||
    highnessProducts[0];

  const category = highnessCategories.find((c) => c.id === product.category_id);

  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    product.options.forEach((opt) => {
      init[opt.label] = opt.values[0];
    });
    return init;
  });
  const [addedToCart, setAddedToCart] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);

  const handleOptionChange = (label: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [label]: value }));
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = { product, selectedOptions, quantity };
    const existing = JSON.parse(localStorage.getItem('chipang_cart') || '[]') as CartItem[];
    existing.push(cartItem);
    localStorage.setItem('chipang_cart', JSON.stringify(existing));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm mb-8">
          <Link to="/" className="text-gray-400 hover:text-[#1A2B3C] transition-colors cursor-pointer">홈</Link>
          <i className="ri-arrow-right-s-line text-gray-300 w-4 h-4 flex items-center justify-center"></i>
          {category && (
            <>
              <Link
                to={`/category/${category.id}`}
                className="text-gray-400 hover:text-[#1A2B3C] transition-colors cursor-pointer"
              >
                {category.name_ko}
              </Link>
              <i className="ri-arrow-right-s-line text-gray-300 w-4 h-4 flex items-center justify-center"></i>
            </>
          )}
          <span className="text-[#1A2B3C] font-medium">{product.name_ko}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* ── 이미지 영역 ── */}
          <div>
            <div className="w-full aspect-square bg-white border border-gray-100 rounded-2xl p-8 flex items-center justify-center overflow-hidden shadow-sm">
              {!imageError ? (
                <img
                  src={product.image_url}
                  alt={product.name_ko}
                  className="w-full h-full object-contain object-center"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full">
                  <i className="ri-image-line text-5xl mb-2"></i>
                  <span className="text-sm">이미지 준비중</span>
                </div>
              )}
            </div>

            {/* 제품 코드 뱃지 */}
            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-mono px-3 py-1.5 rounded-lg">
                <i className="ri-barcode-line w-3.5 h-3.5 flex items-center justify-center"></i>
                {product.model_code}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 text-xs font-medium px-3 py-1.5 rounded-lg">
                <i className="ri-checkbox-circle-line w-3.5 h-3.5 flex items-center justify-center"></i>
                재고 있음
              </span>
            </div>
          </div>

          {/* ── 제품 정보 영역 ── */}
          <div className="flex flex-col gap-6">
            {/* 카테고리 + 제품명 */}
            <div>
              {category && (
                <Link
                  to={`/category/${category.id}`}
                  className="inline-block bg-[#EEF2F8] text-[#2B5F9E] text-xs font-semibold px-3 py-1 rounded-full mb-3 hover:bg-[#dce6f5] transition-colors cursor-pointer"
                >
                  {category.name_en}
                </Link>
              )}
              <h1 className="text-3xl font-bold text-[#1A2B3C] leading-tight mb-1">
                {product.name_ko}
              </h1>
              <p className="text-base text-gray-400 font-medium">{product.name_en}</p>
            </div>

            {/* 한줄 설명 */}
            <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-[#2B5F9E]/20 pl-4">
              {product.short_desc}
            </p>

            {/* 주요 특징 */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A2B3C] mb-3 uppercase tracking-wide">주요 특징</h3>
              <ul className="space-y-2.5">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <i className="ri-check-line text-[#2B5F9E] mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* 옵션 선택 */}
            {product.options.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#1A2B3C] uppercase tracking-wide">옵션 선택</h3>
                {product.options.map((opt) => (
                  <div key={opt.label}>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      {opt.label}
                      <span className="ml-2 text-[#2B5F9E] font-semibold">
                        {selectedOptions[opt.label]}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val) => (
                        <button
                          key={val}
                          onClick={() => handleOptionChange(opt.label, val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                            selectedOptions[opt.label] === val
                              ? 'bg-[#1A2B3C] text-white border-[#1A2B3C]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 수량 + 장바구니 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-subtract-line w-4 h-4 flex items-center justify-center"></i>
                </button>
                <span className="w-12 text-center text-sm font-semibold text-[#1A2B3C]">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-add-line w-4 h-4 flex items-center justify-center"></i>
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1A2B3C] text-white hover:bg-[#2B5F9E]'
                }`}
              >
                <i className={`${addedToCart ? 'ri-check-line' : 'ri-shopping-cart-line'} w-4 h-4 flex items-center justify-center`}></i>
                {addedToCart ? '장바구니 담김!' : '장바구니 담기'}
              </button>

              <button
                onClick={() => setShowInquiry(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border-2 border-[#1A2B3C] text-[#1A2B3C] hover:bg-gray-50 transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-file-list-3-line w-4 h-4 flex items-center justify-center"></i>
                견적 요청
              </button>
            </div>

            {/* 빠른 스펙 요약 */}
            {product.specs.length > 0 && (
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">빠른 사양</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.specs.slice(0, 4).map((spec, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase">{spec.label}</span>
                      <span className="text-xs font-medium text-[#1A2B3C]">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 견적 요청 모달 */}
      {showInquiry && (
        <InquiryModal
          product={product}
          selectedOptions={selectedOptions}
          quantity={quantity}
          onClose={() => setShowInquiry(false)}
        />
      )}
    </section>
  );
}

/* ── 견적 요청 모달 ── */
interface InquiryModalProps {
  product: HignessProduct;
  selectedOptions: Record<string, string>;
  quantity: number;
  onClose: () => void;
}

function InquiryModal({ product, selectedOptions, quantity, onClose }: InquiryModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const optionSummary = Object.entries(selectedOptions)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
    try {
      await fetch('https://readdy.ai/api/form/d6f8o471jbcgr9kd6qjg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString(),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#1A2B3C]">견적 / 주문 요청</h2>
            <p className="text-xs text-gray-400 mt-0.5">{product.name_ko} · {product.model_code}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-gray-500 w-5 h-5 flex items-center justify-center"></i>
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 flex items-center justify-center bg-green-50 rounded-full mx-auto mb-4">
              <i className="ri-check-line text-green-500 text-2xl w-7 h-7 flex items-center justify-center"></i>
            </div>
            <h3 className="text-base font-bold text-[#1A2B3C] mb-2">요청이 접수되었습니다</h3>
            <p className="text-sm text-gray-500 mb-6">담당자가 확인 후 빠르게 연락드리겠습니다.</p>
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-[#1A2B3C] text-white rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
            >
              닫기
            </button>
          </div>
        ) : (
          <form
            data-readdy-form
            id="product-inquiry-form"
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-4"
          >
            {/* 숨김 필드 */}
            <input type="hidden" name="product_name" value={product.name_ko} />
            <input type="hidden" name="model_code" value={product.model_code} />
            <input type="hidden" name="selected_options" value={optionSummary} />
            <input type="hidden" name="quantity" value={quantity} />

            {/* 선택 요약 */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">제품</span>
                <span className="font-medium text-[#1A2B3C]">{product.name_ko}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">모델코드</span>
                <span className="font-mono text-xs text-gray-600">{product.model_code}</span>
              </div>
              {optionSummary && (
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">옵션</span>
                  <span className="text-gray-700 text-xs text-right max-w-[60%]">{optionSummary}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">수량</span>
                <span className="font-semibold text-[#1A2B3C]">{quantity}개</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">치과명 / 기관명 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="clinic_name"
                  required
                  placeholder="예) 서울치과의원"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2B5F9E] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">담당자명 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="contact_name"
                  required
                  placeholder="홍길동"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2B5F9E] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">연락처 <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="010-0000-0000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2B5F9E] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">이메일</label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2B5F9E] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">추가 요청사항</label>
              <textarea
                name="message"
                rows={3}
                maxLength={500}
                placeholder="추가 옵션, 납기 요청, 기타 문의사항을 입력해주세요."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2B5F9E] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#1A2B3C] text-white rounded-xl text-sm font-semibold hover:bg-[#2B5F9E] transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {submitting ? '전송 중...' : '견적 요청 보내기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
