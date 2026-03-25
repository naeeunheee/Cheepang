
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HignessProduct } from '../../../mocks/highness-catalog';

interface CategoryProductCardProps {
  product: HignessProduct;
}

export default function CategoryProductCard({ product }: CategoryProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cardContent = (
    <>
      {/* 이미지 프레임 */}
      <div className="relative w-full aspect-square bg-white p-4 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {/* 스켈레톤 */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {!imageError ? (
          <img
            src={product.image_url}
            alt={product.name_ko}
            className={`w-full h-full transition-opacity duration-300 ${
              product.object_fit === 'cover' ? 'object-cover' : 'object-contain'
            } object-center ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => { setImageError(true); setImageLoaded(true); }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full">
            <div className="w-10 h-10 flex items-center justify-center mb-2">
              <i className="ri-image-line text-4xl" />
            </div>
            <span className="text-xs text-gray-400">이미지 준비중</span>
          </div>
        )}

        {/* 모델 코드 뱃지 */}
        <span className="absolute top-3 left-3 bg-[#1A2B3C]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wide">
          {product.model_code}
        </span>

        {/* 상세보기 오버레이 */}
        {product.detail_page_id && (
          <div className="absolute inset-0 bg-[#1A2B3C]/0 group-hover:bg-[#1A2B3C]/10 transition-all duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white text-[#1A2B3C] text-xs font-bold px-4 py-2 rounded-xl shadow-lg group-hover:bg-[#2B5F9E] group-hover:text-white whitespace-nowrap pointer-events-none">
              상세보기 →
            </span>
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 font-mono mb-0.5 tracking-wide">{product.name_en}</p>
        <h3 className="text-sm font-bold text-[#1A2B3C] mb-1.5 group-hover:text-[#2B5F9E] transition-colors leading-snug">
          {product.name_ko}
        </h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1 leading-relaxed">
          {product.short_desc}
        </p>

        {/* 주요 옵션 태그 */}
        {product.options.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.options.slice(0, 3).map((opt) => (
              <span
                key={opt.label}
                className="text-[10px] bg-[#F4F7FB] text-[#2B5F9E] border border-[#D0E0F5] px-2 py-0.5 rounded-md font-medium"
              >
                {opt.label}: {opt.values.slice(0, 2).join(' / ')}
                {opt.values.length > 2 ? ' +' + (opt.values.length - 2) : ''}
              </span>
            ))}
          </div>
        )}

        {/* 주요 특징 1개 미리보기 */}
        {product.features.length > 0 && (
          <div className="flex items-start gap-1.5 mb-4">
            <div className="w-4 h-4 flex items-center justify-center mt-0.5 shrink-0">
              <i className="ri-check-line text-[#2B5F9E] text-xs" />
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
              {product.features[0]}
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
          {product.detail_page_id ? (
            <Link
              to={`/product/${product.detail_page_id}`}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#1A2B3C] text-white hover:bg-[#2B5F9E] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-file-list-3-line text-sm" />
              </div>
              상세보기
            </Link>
          ) : (
            <div className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-not-allowed">
              준비중
            </div>
          )}
          <Link
            to="/#mvp-order"
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[#2B5F9E] text-[#2B5F9E] hover:bg-[#2B5F9E] hover:text-white transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-shopping-cart-line text-sm" />
            </div>
            주문하기
          </Link>
        </div>
      </div>
    </>
  );

  if (product.detail_page_id) {
    return (
      <Link
        to={`/product/${product.detail_page_id}`}
        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-100 cursor-pointer"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-100">
      {cardContent}
    </div>
  );
}
