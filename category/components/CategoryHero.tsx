
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HignessCategory, highnessCategories } from '../../../mocks/highness-catalog';

interface CategoryHeroProps {
  category: HignessCategory;
  productCount: number;
  currentId: string;
}

/**
 * 이미지 로드 실패 시 대체 아이콘을 표시하는 컴포넌트
 * onError 핸들러에서 상태를 업데이트해 재렌더링을 트리거합니다.
 */
function CatImage({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);

  // 이미지 로드에 실패했을 때 아이콘을 반환
  if (err) {
    return (
      <i className="ri-image-line text-gray-500 text-xs w-full h-full flex items-center justify-center" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-contain"
      onError={() => setErr(true)}
    />
  );
}

/**
 * 카테고리 히어로 섹션 컴포넌트
 * 배경 이미지 로드 오류에 대비해 오류 상태를 관리하고,
 * 네비게이션 및 카테고리 리스트를 렌더링합니다.
 */
export default function CategoryHero({
  category,
  productCount,
  currentId,
}: CategoryHeroProps) {
  const [bgErr, setBgErr] = useState(false);

  return (
    <section className="relative bg-[#0F1E2E] overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0">
        {!bgErr && (
          <img
            src={category.hero_image_url}
            alt={category.name_ko}
            className="w-full h-full object-contain object-center"
            style={{ opacity: 0.06 }}
            onError={() => setBgErr(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E2E] via-[#0F1E2E]/90 to-[#0F1E2E]/70" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        {/* 브레드크럼 */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            홈
          </Link>
          <i className="ri-arrow-right-s-line text-gray-600 w-4 h-4 flex items-center justify-center" />
          <Link
            to="/#products"
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            제품
          </Link>
          <i className="ri-arrow-right-s-line text-gray-600 w-4 h-4 flex items-center justify-center" />
          <span className="text-white font-medium whitespace-nowrap">{category.name_ko}</span>
        </nav>

        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-10">
          {/* 텍스트 */}
          <div className="flex-1">
            <span className="inline-block text-[#4A9EE0] text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Highness Implant · {category.name_en}
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {category.name_ko}
            </h1>
            <p className="text-gray-400 text-base max-w-xl leading-relaxed">{category.description}</p>
            <div className="flex items-center gap-3 mt-6">
              <span className="bg-white/10 text-white text-xs px-4 py-1.5 rounded-full font-semibold">
                총 {productCount}개 제품
              </span>
              <span className="bg-[#2B5F9E]/30 text-[#7BB8E8] text-xs px-4 py-1.5 rounded-full font-semibold">
                CE · KFDA 인증
              </span>
            </div>
          </div>

          {/* 카테고리 사이드 네비 */}
          <div className="flex flex-row lg:flex-col gap-2 flex-wrap">
            {[...highnessCategories]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    cat.id === currentId
                      ? 'bg-white text-[#0F1E2E] shadow-lg'
                      : 'text-gray-400 hover:text-white border border-white/10'
                  }`}
                  style={
                    cat.id !== currentId ? { backgroundColor: 'rgba(255,255,255,0.06)' } : {}
                  }
                >
                  <div className="w-5 h-5 flex items-center justify-center overflow-hidden">
                    <CatImage src={cat.hero_image_url} alt={cat.name_ko} />
                  </div>
                  {cat.name_ko}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
