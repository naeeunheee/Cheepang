
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  highnessProducts,
  getProductById,
  getRelatedProducts,
  type HignessProduct,
} from '../../../mocks/highness-catalog';

interface RelatedProductsProps {
  currentProductId?: string;
}

export default function RelatedProducts({ currentProductId }: RelatedProductsProps) {
  const product: HignessProduct =
    highnessProducts.find((p) => p.id === currentProductId) ||
    highnessProducts.find((p) => p.detail_page_id === currentProductId) ||
    highnessProducts[0];

  // related_product_ids 기반 관련 구성품
  const relatedByIds = getRelatedProducts(product);

  // 같은 카테고리 내 다른 제품 (보완)
  const sameCategoryProducts = highnessProducts
    .filter(
      (p) =>
        p.category_id === product.category_id &&
        p.id !== product.id &&
        p.status === 'active'
    )
    .slice(0, 2);

  // 최종 관련 제품 목록 (중복 제거, 최대 4개)
  const allRelated = [
    ...relatedByIds,
    ...sameCategoryProducts.filter((p) => !relatedByIds.find((r) => r.id === p.id)),
  ].slice(0, 4);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* 관련 구성품 섹션 */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="inline-block bg-[#EEF2F8] text-[#2B5F9E] text-xs font-semibold px-3 py-1 rounded-full mb-2 uppercase tracking-wide">
                Compatible Components
              </span>
              <h2 className="text-2xl font-bold text-[#1A2B3C]">함께 사용하는 구성품</h2>
              <p className="text-gray-400 text-sm mt-1">
                {product.name_ko}와 함께 사용하면 최적의 결과를 얻을 수 있는 제품들입니다.
              </p>
            </div>
          </div>

          {allRelated.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5" data-product-shop>
              {allRelated.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              관련 구성품 정보가 없습니다.
            </div>
          )}
        </div>

        {/* CTA 배너 */}
        <div className="relative rounded-3xl overflow-hidden">
          <img
            src="https://readdy.ai/api/search-image?query=modern%20dental%20clinic%20professional%20environment%20with%20advanced%20implant%20equipment%2C%20clean%20medical%20workspace%2C%20teal%20and%20white%20tones%2C%20professional%20healthcare%20setting%2C%20sterile%20atmosphere%2C%20contemporary%20minimalist%20design%2C%20bright%20lighting&width=1400&height=400&seq=cta-banner-product-001&orientation=landscape"
            alt="하이니스 임플란트 솔루션"
            className="w-full h-72 object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B3C]/85 to-[#1A2B3C]/40 flex items-center">
            <div className="px-12 text-white max-w-xl">
              <h3 className="text-2xl font-bold mb-3 leading-tight">
                전문가를 위한 프리미엄<br />임플란트 솔루션
              </h3>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                하이니스의 혁신적인 기술력으로 더 나은 치료 결과를 경험하세요.
                전문 상담팀이 최적의 제품 구성을 안내해드립니다.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/#contact"
                  className="bg-white text-[#1A2B3C] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all whitespace-nowrap cursor-pointer"
                >
                  전문가 상담 신청
                </Link>
                <Link
                  to="/"
                  className="border border-white/50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer"
                >
                  전체 제품 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 관련 제품 카드 ── */
function RelatedProductCard({ product }: { product: HignessProduct }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const linkTarget = product.detail_page_id || product.id;

  return (
    <Link
      to={`/product/${linkTarget}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* 이미지 프레임 */}
      <div className="w-full aspect-square bg-white border-b border-gray-50 p-4 flex items-center justify-center overflow-hidden relative">
        {/* 스켈레톤 */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-t-2xl" />
        )}

        {!imgError ? (
          <img
            src={product.image_url}
            alt={product.name_ko}
            className={`w-full h-full object-contain object-center transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full">
            <i className="ri-image-line text-3xl mb-1 w-8 h-8 flex items-center justify-center"></i>
            <span className="text-xs">이미지 준비중</span>
          </div>
        )}

        {/* 모델코드 뱃지 */}
        <span className="absolute top-2 left-2 bg-white/90 text-gray-500 text-[9px] font-mono px-1.5 py-0.5 rounded border border-gray-100">
          {product.model_code}
        </span>
      </div>

      {/* 제품 정보 */}
      <div className="p-4 text-center">
        <h3 className="text-[#1A2B3C] text-sm font-bold mb-0.5 group-hover:text-[#2B5F9E] transition-colors leading-snug">
          {product.name_ko}
        </h3>
        <p className="text-gray-400 text-[11px] font-medium">{product.name_en}</p>
        <div className="mt-3 flex items-center justify-center gap-1 text-[#2B5F9E] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>상세보기</span>
          <i className="ri-arrow-right-line w-3 h-3 flex items-center justify-center"></i>
        </div>
      </div>
    </Link>
  );
}
