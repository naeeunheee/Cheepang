import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { MvpOrderItem } from '../../../../mocks/highness-catalog';

interface SpecItem {
  label: string;
  value: string;
}

interface DenforceFullProduct {
  id: string;
  name_ko: string;
  name_en?: string;
  model_code: string;
  category: string;
  unit_price: number;
  image_url?: string;
  short_description?: string;
  features_json?: string[] | string | null;
  specs_json?: SpecItem[] | string | null;
}

interface DenforceProductModalProps {
  productId: string;
  onClose: () => void;
  onAddToCart: (items: MvpOrderItem[]) => void;
}

function parseFeatures(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseSpecs(raw: SpecItem[] | string | null | undefined): SpecItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((r) => r.label);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((r: SpecItem) => r.label);
    // { key: value } 형태도 지원
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([label, value]) => ({
        label,
        value: String(value),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export default function DenforceProductModal({
  productId,
  onClose,
  onAddToCart,
}: DenforceProductModalProps) {
  const [product, setProduct] = useState<DenforceFullProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_ko, name_en, model_code, category, unit_price, image_url, short_description, features_json, specs_json')
        .eq('id', productId)
        .maybeSingle();

      if (!error && data) {
        setProduct(data as DenforceFullProduct);
      }
    } catch (err) {
      console.error('제품 상세 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleAddToCart = () => {
    if (!product || product.unit_price <= 0) return;
    const item: MvpOrderItem = {
      productId: product.id,
      productName: product.name_ko,
      productCode: product.model_code,
      selectedOptions: {},
      quantity,
      unitPrice: product.unit_price,
      totalPrice: product.unit_price * quantity,
    };
    onAddToCart([item]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const features = product ? parseFeatures(product.features_json) : [];
  const specs = product ? parseSpecs(product.specs_json) : [];
  const hasPrice = product ? product.unit_price > 0 : false;

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-[80]"
        onClick={onClose}
      />

      {/* 모달 패널 */}
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#2B5F9E]/10 rounded flex items-center justify-center">
                <i className="ri-box-3-line text-[#2B5F9E] text-xs"></i>
              </div>
              <span className="text-xs font-bold text-[#2B5F9E]">Denforce 소모품·재료사업부</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-[#666666] text-lg"></i>
            </button>
          </div>

          {/* 콘텐츠 (스크롤) */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#2B5F9E] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-[#999999]">제품 정보 로딩 중...</p>
              </div>
            ) : !product ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="ri-error-warning-line text-3xl text-[#CCCCCC] mb-3"></i>
                <p className="text-sm text-[#999999]">제품 정보를 찾을 수 없습니다</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-0">
                {/* 좌측: 이미지 */}
                <div className="md:w-64 flex-shrink-0 bg-[#F8F8F8] flex items-center justify-center p-6" style={{ minHeight: '240px' }}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_ko}
                      className="w-full max-h-48 object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300">
                      <i className="ri-image-line text-5xl mb-2"></i>
                      <span className="text-xs text-gray-400">이미지 준비중</span>
                    </div>
                  )}
                </div>

                {/* 우측: 상세 정보 */}
                <div className="flex-1 p-6">
                  {/* 모델코드 + 카테고리 */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {product.model_code && (
                      <span className="text-[10px] font-mono text-[#999999] bg-[#F5F5F5] px-2 py-0.5 rounded">
                        {product.model_code}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-[#2B5F9E] bg-[#EEF4FF] px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                  </div>

                  {/* 제품명 */}
                  <h2 className="text-xl font-bold text-[#1A1A1A] mb-1 leading-snug">
                    {product.name_ko}
                  </h2>
                  {product.name_en && (
                    <p className="text-xs text-[#999999] font-medium mb-3">{product.name_en}</p>
                  )}

                  {/* 간단 설명 */}
                  {product.short_description && (
                    <p className="text-sm text-[#555555] leading-relaxed mb-5 pb-5 border-b border-[#F0F0F0]">
                      {product.short_description}
                    </p>
                  )}

                  {/* 주요 특징 */}
                  {features.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-[#333333] uppercase tracking-widest mb-3">
                        주요 특징
                      </h3>
                      <ul className="space-y-2">
                        {features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#2B5F9E] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <i className="ri-check-line text-white text-[9px]"></i>
                            </div>
                            <span className="text-sm text-[#444444] leading-relaxed">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 제품 사양 */}
                  {specs.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-[#333333] uppercase tracking-widest mb-3">
                        제품 사양
                      </h3>
                      <div className="rounded-lg border border-[#EBEBEB] overflow-hidden">
                        {specs.map((spec, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-3 px-4 py-2.5 ${
                              i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'
                            }`}
                          >
                            <span className="text-xs font-bold text-[#555555] w-28 flex-shrink-0 pt-0.5">
                              {spec.label}
                            </span>
                            <span className="text-xs text-[#333333] leading-relaxed">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 하단 CTA */}
          {!loading && product && (
            <div className="px-6 py-4 border-t border-[#F0F0F0] bg-[#FAFAFA]">
              {hasPrice ? (
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold text-[#1A1A1A] flex-shrink-0">
                    ₩{product.unit_price.toLocaleString()}
                  </p>
                  {/* 수량 */}
                  <div className="flex items-center border border-[#E0E0E0] rounded overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer"
                    >
                      <i className="ri-subtract-line text-sm"></i>
                    </button>
                    <span className="w-10 text-center text-sm font-medium border-x border-[#E0E0E0]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer"
                    >
                      <i className="ri-add-line text-sm"></i>
                    </button>
                  </div>
                  {/* 장바구니 */}
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                      added
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#1A1A1A] hover:bg-[#000000] text-white'
                    }`}
                  >
                    {added ? (
                      <>
                        <i className="ri-check-line text-sm"></i>
                        장바구니에 담겼습니다
                      </>
                    ) : (
                      <>
                        <i className="ri-shopping-cart-2-line text-sm"></i>
                        장바구니 담기
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#EEF4FF] rounded-lg px-4 py-2.5">
                    <p className="text-xs text-[#2B5F9E] font-medium mb-0.5">가격 문의</p>
                    <p className="text-sm font-bold text-[#1A1A1A]">010-8950-3379</p>
                  </div>
                  <a
                    href="tel:010-8950-3379"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#2B5F9E] hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-phone-line text-sm"></i>
                    전화 문의
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
