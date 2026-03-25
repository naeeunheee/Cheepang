import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Footer from '../home/components/Footer';
import { useProducts, useProductOptions, fetchProductOptionsByIds, Product, ProductOption } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name_ko: string;
  name_en: string;
  description: string;
  hero_image_url: string;
  sort_order: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'fixture', name_ko: '픽스처', name_en: 'Fixture', description: '하이니스 임플란트 픽스처. Bone Level과 Tissue Level 총 6가지 모델.', hero_image_url: '', sort_order: 0 },
  { id: 'abutment', name_ko: '어버트먼트', name_en: 'Abutment', description: '임플란트와 보철물을 연결하는 핵심 부품. Base, Angled, Multi, Milling 타입.', hero_image_url: '', sort_order: 1 },
  { id: 'scanbody', name_ko: '스캔바디', name_en: 'Scanbody', description: '디지털 구강 스캔에 최적화된 정밀 스캔바디.', hero_image_url: '', sort_order: 2 },
  { id: 'link', name_ko: '링크 어버트먼트', name_en: 'Link Abutment', description: 'No Cementation 시스템. Long/Short/Angled/Internal 타입.', hero_image_url: '', sort_order: 3 },
  { id: 'gauge-kit', name_ko: '게이지 & 키트', name_en: 'Gauge & Kit', description: '정확한 측정과 수술 효율을 높이는 게이지 세트 및 키트.', hero_image_url: '', sort_order: 4 },
];

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const { products: allProducts, loading } = useProducts();
  const [allOptions, setAllOptions] = useState<Record<string, ProductOption[]>>({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Supabase에서 카테고리 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order');
        if (!error && data && data.length > 0) setCategories(data);
      } catch { /* fallback to defaults */ }
    };
    loadCategories();
  }, []);

  // 전체 옵션 로드
  useEffect(() => {
    if (allProducts.length === 0) return;
    const productIds = allProducts.map(p => p.id);
    fetchProductOptionsByIds(productIds).then(setAllOptions);
  }, [allProducts]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSearchQuery('');
  }, [id]);

  const category = categories.find(c => c.id === id);

  const categoryProducts = useMemo(() => {
    return allProducts
      .filter(p => p.category_id === id && p.status === 'active')
      .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
  }, [allProducts, id]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categoryProducts;
    return categoryProducts.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.name_ko || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q) ||
      (p.model_code || '').toLowerCase().includes(q)
    );
  }, [categoryProducts, searchQuery]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-3xl text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-4">카테고리를 찾을 수 없습니다.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2B5F9E] hover:underline cursor-pointer">
            <i className="ri-arrow-left-line" />홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 네비게이션 */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center cursor-pointer">
            <img src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png" alt="CHIPANG Logo" className="h-10" />
          </a>
          <div className="hidden md:flex items-center space-x-8">
            <a href="/#about" className="text-sm font-medium text-gray-600 hover:text-[#2B5F9E] transition-colors whitespace-nowrap cursor-pointer">서비스 소개</a>
            <a href="/#products" className="text-sm font-semibold text-[#2B5F9E] whitespace-nowrap cursor-pointer">하이니스 제품관</a>
            <a href="/#mvp-order" className="text-sm font-medium text-gray-600 hover:text-[#2B5F9E] transition-colors whitespace-nowrap cursor-pointer">주문하기</a>
            <a href="/#contact" className="text-sm font-medium text-gray-600 hover:text-[#2B5F9E] transition-colors whitespace-nowrap cursor-pointer">입점/문의</a>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/category/${cat.id}`} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${cat.id === id ? 'bg-[#1A2B3C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat.name_ko}
              </Link>
            ))}
          </div>
          <Link to="/login" className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#2B5F9E] text-white hover:bg-[#3A7BC8] transition-all whitespace-nowrap cursor-pointer">로그인</Link>
        </div>
      </nav>

      <main className="pt-[72px]">
        {/* 히어로 섹션 */}
        <section className="relative bg-[#0F1E2E] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E2E] via-[#0F1E2E]/90 to-[#0F1E2E]/70" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <nav className="flex items-center gap-2 text-sm mb-8">
              <button onClick={() => window.history.back()} className="text-gray-400 hover:text-white transition-colors cursor-pointer mr-2 flex items-center gap-1">
                <i className="ri-arrow-left-line text-lg" />
                <span className="text-xs">뒤로</span>
              </button>
              <Link to="/" className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer whitespace-nowrap">홈</Link>
              <i className="ri-arrow-right-s-line text-gray-600 w-4 h-4 flex items-center justify-center" />
              <a href="/#products" className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer whitespace-nowrap">제품</a>
              <i className="ri-arrow-right-s-line text-gray-600 w-4 h-4 flex items-center justify-center" />
              <span className="text-white font-medium whitespace-nowrap">{category.name_ko}</span>
            </nav>
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-10">
              <div className="flex-1">
                <span className="inline-block text-[#4A9EE0] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  Highness Implant · {category.name_en}
                </span>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">{category.name_ko}</h1>
                <p className="text-gray-400 text-base max-w-xl leading-relaxed">{category.description}</p>
                <div className="flex items-center gap-3 mt-6">
                  <span className="bg-white/10 text-white text-xs px-4 py-1.5 rounded-full font-semibold">총 {categoryProducts.length}개 제품</span>
                  <span className="bg-[#2B5F9E]/30 text-[#7BB8E8] text-xs px-4 py-1.5 rounded-full font-semibold">CE · KFDA 인증</span>
                </div>
              </div>
              <div className="flex flex-row lg:flex-col gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.id}`}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      cat.id === id ? 'bg-white text-[#0F1E2E] shadow-lg' : 'text-gray-400 hover:text-white border border-white/10'
                    }`}
                    style={cat.id !== id ? { backgroundColor: 'rgba(255,255,255,0.06)' } : {}}
                  >
                    {cat.name_ko}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 제품 그리드 */}
        <section className="py-14 bg-[#F4F7FB]">
          <div className="max-w-7xl mx-auto px-6">
            {/* 검색 */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제품명 또는 모델코드 검색..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#2B5F9E] transition-colors"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                <span className="font-semibold text-[#1A1A1A]">{filteredProducts.length}</span>개 제품
                {searchQuery && <button onClick={() => setSearchQuery('')} className="ml-3 text-xs text-[#2B5F9E] hover:underline cursor-pointer">초기화</button>}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-3 border-[#2B5F9E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-400">제품 목록 로딩 중...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} options={allOptions[product.id] || []} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <i className="ri-search-line text-2xl text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-600 mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-gray-400 mb-4">다른 검색어를 시도해보세요.</p>
                <button onClick={() => setSearchQuery('')} className="text-sm font-semibold text-[#2B5F9E] hover:underline cursor-pointer">필터 초기화</button>
              </div>
            )}

            {/* 다른 카테고리 */}
            <div className="mt-16 pt-10 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">다른 카테고리 보기</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.filter(cat => cat.id !== id).map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.id}`} className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group border border-gray-100 hover:border-[#2B5F9E]/30">
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-mono mb-0.5 truncate">{cat.name_en}</p>
                      <p className="text-sm font-bold text-[#1A2B3C] group-hover:text-[#2B5F9E] transition-colors truncate">{cat.name_ko}</p>
                    </div>
                    <div className="w-5 h-5 flex items-center justify-center ml-auto shrink-0">
                      <i className="ri-arrow-right-line text-gray-300 group-hover:text-[#2B5F9E] transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ── 제품 카드 (Supabase 데이터 직접 사용) ── */
function ProductCard({ product, options }: { product: Product; options: ProductOption[] }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const displayName = product.name_ko || product.name || '';
  const displayNameEn = product.name_en || product.name || '';
  const optionCount = options.length;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-100">
      {/* 이미지 */}
      <div className="relative w-full aspect-square bg-white p-4 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
        {!imageError && product.image_url ? (
          <img
            src={product.image_url}
            alt={displayName}
            className={`w-full h-full object-contain object-center transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => { setImageError(true); setImageLoaded(true); }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full">
            <i className="ri-image-line text-4xl" />
            <span className="text-xs text-gray-400 mt-1">이미지 준비중</span>
          </div>
        )}
        {product.model_code && (
          <span className="absolute top-3 left-3 bg-[#1A2B3C]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wide">
            {product.model_code}
          </span>
        )}
        {optionCount > 0 && (
          <span className="absolute top-3 right-3 bg-[#1D4ED8]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {optionCount}종
          </span>
        )}
      </div>

      {/* 정보 */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 font-mono mb-0.5 tracking-wide">{displayNameEn}</p>
        <h3 className="text-sm font-bold text-[#1A2B3C] mb-1.5 group-hover:text-[#2B5F9E] transition-colors leading-snug">
          {displayName}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* 규격 미리보기 */}
        {optionCount > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {options.slice(0, 3).map((opt) => (
              <span key={opt.id} className="text-[10px] bg-[#F4F7FB] text-[#2B5F9E] border border-[#D0E0F5] px-2 py-0.5 rounded-md font-medium">
                {opt.size_info}
              </span>
            ))}
            {optionCount > 3 && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">
                +{optionCount - 3}
              </span>
            )}
          </div>
        )}

        {/* 가격 */}
        <div className="mb-3">
          <span className="text-base font-bold text-[#1A1A1A]">
            {(product.unit_price || 0).toLocaleString()}P
          </span>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 mt-auto">
          <a
            href="/#mvp-order"
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="ri-shopping-cart-line text-sm" />
            주문하기
          </a>
        </div>
      </div>
    </div>
  );
}