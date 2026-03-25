
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProductHero from './components/ProductHero';
import ProductSpecs from './components/ProductSpecs';
import KitComponentsTable from './components/KitComponentsTable';
import RelatedProducts from './components/RelatedProducts';
import Footer from '../home/components/Footer';
import { highnessProducts, highnessCategories, type HignessProduct } from '../../mocks/highness-catalog';

const STORAGE_KEY = 'chipang_product_overrides';

function getProductWithOverride(id: string | undefined): HignessProduct | null {
  const base =
    highnessProducts.find((p) => p.id === id) ||
    highnessProducts.find((p) => p.detail_page_id === id) ||
    null;
  if (!base) return null;
  try {
    const overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const override = overrides[base.id];
    return override ? { ...base, ...override } : base;
  } catch {
    return base;
  }
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [product, setProduct] = useState<HignessProduct | null>(() => getProductWithOverride(id));

  const category = product
    ? highnessCategories.find((c) => c.id === product.category_id)
    : null;

  // localStorage 변경 시 제품 데이터 재로드
  useEffect(() => {
    setProduct(getProductWithOverride(id));
  }, [id]);

  useEffect(() => {
    const handleStorageChange = () => {
      setProduct(getProductWithOverride(id));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('chipang_product_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chipang_product_updated', handleStorageChange);
    };
  }, [id]);

  // Scroll handling
  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  // 장바구니 개수 동기화
  useEffect(() => {
    const syncCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('chipang_cart') || '[]');
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      } catch {
        setCartCount(0);
      }
    };
    syncCart();
    window.addEventListener('storage', syncCart);
    window.addEventListener('chipang_cart_updated', syncCart);
    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('chipang_cart_updated', syncCart);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const goToHome = () => navigate('/#mvp-order');

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600 text-lg">제품을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center cursor-pointer">
            <img
              src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png"
              alt="CHIPANG Logo"
              className="h-10"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/#about" className="text-sm font-medium text-gray-600 hover:text-[#1A2B3C] transition-colors whitespace-nowrap cursor-pointer">서비스 소개</Link>
            <Link to="/#products" className="text-sm font-medium text-gray-600 hover:text-[#1A2B3C] transition-colors whitespace-nowrap cursor-pointer">하이니스 제품관</Link>

            <div className="relative group">
              <button className="text-sm font-medium text-gray-600 hover:text-[#1A2B3C] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1">
                카테고리
                <i className="ri-arrow-down-s-line w-4 h-4 flex items-center justify-center"></i>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {highnessCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                      category?.id === cat.id ? 'text-[#2B5F9E] font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <i className="ri-grid-line w-4 h-4 flex items-center justify-center text-gray-400"></i>
                    {cat.name_ko}
                    <span className="ml-auto text-[10px] text-gray-400 font-mono">{cat.name_en}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/#contact" className="text-sm font-medium text-gray-600 hover:text-[#1A2B3C] transition-colors whitespace-nowrap cursor-pointer">입점/문의</Link>
          </div>

          <div className="flex items-center gap-3">
            {category && (
              <Link
                to={`/category/${category.id}`}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#1A2B3C] hover:text-[#1A2B3C] transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center"></i>
                {category.name_ko} 목록
              </Link>
            )}
            <Link to="/login" className="px-5 py-2 rounded-lg text-sm font-medium bg-[#1A2B3C] text-white hover:bg-[#2B5F9E] transition-all whitespace-nowrap cursor-pointer">로그인</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {/* ProductHero에 오버라이드 적용된 product 전달 */}
        <ProductHero productId={id} product={product} />
        {product.kit_components && product.kit_components.length > 0 && (
          <KitComponentsTable product={product} />
        )}
        {/* ProductSpecs에도 동일한 product 전달 */}
        <ProductSpecs product={product} />
        <RelatedProducts currentProductId={id} />
      </main>

      <Footer />

      {/* 플로팅 버튼 영역 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-11 h-11 bg-white text-[#2B5F9E] border border-gray-200 rounded-full shadow-md hover:bg-[#2B5F9E] hover:text-white hover:border-[#2B5F9E] transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110"
            aria-label="맨 위로 이동"
          >
            <i className="ri-arrow-up-line text-lg"></i>
          </button>
        )}
        <button
          onClick={goToHome}
          className="relative w-14 h-14 bg-[#2B5F9E] text-white rounded-full shadow-lg hover:bg-[#3A7BC8] transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110"
          aria-label="장바구니로 이동"
        >
          <i className="ri-shopping-cart-2-line text-xl"></i>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
