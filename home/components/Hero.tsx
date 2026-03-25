import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import InquiryModal from '../../../components/feature/InquiryModal';
import { usePoints } from '../../../hooks/usePoints';
import { useAuth } from '../../../contexts/AuthContext';

export default function Hero() {
  const [scrolled, setScrolled] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const { businessNo, clinicName, role, isAdmin, logout: authLogout } = useAuth();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
  const [showStaffToast, setShowStaffToast] = useState(false);
  const { clientPoint } = usePoints(businessNo || null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };

  const handleImplantCardClick = () => {
    const el = document.getElementById('mvp-order');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleConsumableCardClick = () => {
    setShowStaffToast(true);
    setTimeout(() => setShowStaffToast(false), 3500);
  };

  const adminMenuItems = [
    { label: '대시보드', path: '/admin/dashboard' },
    { label: '주문관리', path: '/admin/orders' },
    { label: '거래처관리', path: '/admin/clients' },
    { label: '거래처별주문', path: '/admin/client-orders' },
    { label: '포인트관리', path: '/admin/points' },
    { label: '제품관리', path: '/admin/products' },
    { label: '단가표 관리', path: '/admin/price-tiers' },
    { label: '채팅관리', path: '/admin/chat' },
    { label: '상담 이력', path: '/admin/consultations' },
    { label: '이미지분류', path: '/admin/image-classifier' },
    { label: '이미지검증', path: '/admin/image-validator' },
    { label: '공지사항 관리', path: '/admin/notices' },
  ];

  const navLinks = [
    { label: '홈', href: '/', isLink: true },
    { label: '주문하기', href: '#mvp-order', isLink: false },
    { label: '하이니스 제품관', href: '#products', isLink: false },
    { label: '서비스 소개', href: '#about', isLink: false },
    { label: '유명관', href: '#features', isLink: false },
    { label: '모델 비교', href: '/fixture-compare', isLink: true },
    { label: '입점/문의', href: '#contact', isLink: false },
  ];

  const isLoggedIn = !!businessNo;
  const displayName = clinicName ?? businessNo ?? '';

  return (
    <>
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FAF6F0, #F5EDE0, #EFE6D5)' }}
      >
        {/* 배경 글로우 — 웜 톤 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 right-1/3 w-[600px] h-[600px] bg-amber-300/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-yellow-200/15 rounded-full blur-[100px]"></div>
        </div>

        {/* Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'shadow-sm'
              : 'bg-transparent'
          }`}
          style={scrolled ? { background: 'rgba(250,246,240,0.95)', backdropFilter: 'blur(12px)' } : {}}
        >
          {/* 상단 연락처 배너 */}
          <div
            className="hidden md:flex items-center justify-end gap-6 px-6 py-1.5 text-xs border-b"
            style={{
              background: scrolled ? 'rgba(240,232,215,0.95)' : 'rgba(0,0,0,0.25)',
              borderColor: scrolled ? 'rgba(212,196,168,0.4)' : 'rgba(255,255,255,0.12)',
            }}
          >
            <a
              href="tel:15224936"
              className="flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              style={{ color: scrolled ? '#5C5346' : 'rgba(255,255,255,0.85)' }}
            >
              <i className="ri-phone-line w-3 h-3 flex items-center justify-center"></i>
              <span>사무실: 1522-4936</span>
            </a>
            <span style={{ color: scrolled ? '#D4C4A8' : 'rgba(255,255,255,0.25)' }}>|</span>
            <a
              href="tel:01089503379"
              className="flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              style={{ color: scrolled ? '#5C5346' : 'rgba(255,255,255,0.85)' }}
            >
              <i className="ri-smartphone-line w-3 h-3 flex items-center justify-center"></i>
              <span>제품문의: 010-8950-3379</span>
            </a>
            <span style={{ color: scrolled ? '#D4C4A8' : 'rgba(255,255,255,0.25)' }}>|</span>
            <a
              href="tel:01053411522"
              className="flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              style={{ color: scrolled ? '#8B6914' : '#FEE500' }}
            >
              <i className="ri-kakao-talk-fill w-3 h-3 flex items-center justify-center"></i>
              <span>카카오톡·주문: 010-5341-1522</span>
            </a>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/">
                <img
                  src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/5c3738dea2759a2f9802f6cc31c064c5.png"
                  alt="치팡 Logo"
                  className="h-14 md:h-20 cursor-pointer"
                />
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((item) => {
                const isActive = item.isLink && location.pathname === item.href;
                const baseCls = `text-base transition-all whitespace-nowrap cursor-pointer`;
                const colorCls = isActive
                  ? 'font-bold'
                  : 'font-medium hover:font-bold';
                const colorStyle = isActive
                  ? { color: '#8B6914' }
                  : { color: '#3D3428' };
                return item.isLink ? (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`${baseCls} ${colorCls}`}
                    style={colorStyle}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`${baseCls} ${colorCls}`}
                    style={{ color: '#3D3428' }}
                  >
                    {item.label}
                  </a>
                );
              })}

              {/* 관리자모드 드롭다운 */}
              {isAdmin && (
                <div
                  className="relative"
                  onMouseEnter={() => setShowAdminDropdown(true)}
                  onMouseLeave={() => setShowAdminDropdown(false)}
                >
                  <button
                    className="text-base font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1"
                    style={{ color: '#3D3428' }}
                  >
                    관리자모드
                    <i className={`ri-arrow-down-s-line text-base ${showAdminDropdown ? 'rotate-180' : ''} transition-transform`}></i>
                  </button>
                  {showAdminDropdown && (
                    <div className="absolute top-full left-0 w-48 z-50 pt-2">
                      <div className="bg-white rounded-lg border border-[#E0D5C3] py-2" style={{ boxShadow: '0 4px 16px rgba(139,105,20,0.1)' }}>
                        {adminMenuItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="block px-4 py-2 text-sm font-medium hover:bg-[#FAF6F0] transition-colors whitespace-nowrap cursor-pointer"
                            style={{ color: '#3D3428' }}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 마이페이지 링크 — 치과 로그인 시만 표시 */}
              {isLoggedIn && !isAdmin && (
                <Link
                  to="/my-page"
                  className="text-base font-medium transition-all whitespace-nowrap cursor-pointer hover:font-bold flex items-center gap-1"
                  style={{ color: '#3D3428' }}
                >
                  <i className="ri-user-line text-sm w-4 h-4 flex items-center justify-center"></i>
                  마이페이지
                </Link>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* 치과명 */}
              {isLoggedIn && displayName && (
                <span
                  className="hidden md:block font-semibold"
                  style={{ fontSize: '15px', color: '#5C5346' }}
                >
                  {displayName}
                </span>
              )}

              {/* 포인트 배지 */}
              {isLoggedIn && clientPoint && (
                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-[#EDE0CC] border border-[#D4C4A8]">
                  <i className="ri-coin-line text-sm w-4 h-4 flex items-center justify-center" style={{ color: '#8B6914' }}></i>
                  <span className="text-xs md:text-sm font-bold whitespace-nowrap" style={{ color: '#7A6340' }}>
                    ₩{clientPoint.point_balance.toLocaleString()}
                  </span>
                </div>
              )}

              {/* 로그인/로그아웃 버튼 (데스크탑) */}
              <div className="hidden md:block">
                {isLoggedIn ? (
                  <button
                    onClick={() => { logout(); setSession(null); navigate('/login'); }}
                    className="px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer text-white"
                    style={{ background: '#8B6914' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#7A5A0F'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#8B6914'; }}
                  >
                    로그아웃
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer text-white"
                    style={{ background: '#8B6914' }}
                  >
                    로그인
                  </Link>
                )}
              </div>

              {/* 모바일 햄버거 버튼 */}
              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer hover:bg-[#EDE0CC]"
                style={{ color: '#3D3428' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="메뉴 열기"
              >
                <i className={`text-xl ${mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
              </button>
            </div>
          </div>

          {/* 모바일 메뉴 패널 */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#E0D5C3]" style={{ background: 'rgba(250,246,240,0.98)' }}>
              <div className="px-4 py-3 space-y-1">
                {isLoggedIn && (
                  <div className="flex items-center justify-between py-3 border-b border-[#E0D5C3] mb-2">
                    <div className="flex items-center gap-2">
                      <i className="ri-user-line w-4 h-4 flex items-center justify-center" style={{ color: '#8C7E6A' }}></i>
                      <span className="text-sm font-medium" style={{ color: '#3D3428' }}>{displayName}</span>
                    </div>
                    {clientPoint && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#EDE0CC]">
                        <i className="ri-coin-line text-xs w-3 h-3 flex items-center justify-center" style={{ color: '#8B6914' }}></i>
                        <span className="text-xs font-bold" style={{ color: '#7A6340' }}>₩{clientPoint.point_balance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                {navLinks.map((item) =>
                  item.isLink ? (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-[#EDE0CC]"
                      style={{ color: '#3D3428' }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-[#EDE0CC]"
                      style={{ color: '#3D3428' }}
                    >
                      {item.label}
                    </a>
                  )
                )}
                {isLoggedIn && (
                  <div className="border-t border-[#E0D5C3] pt-2 mt-1 space-y-1">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8C7E6A' }}>내 메뉴</p>
                    <Link
                      to="/my-orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-[#EDE0CC]"
                      style={{ color: '#3D3428' }}
                    >
                      <i className="ri-file-list-3-line w-4 h-4 flex items-center justify-center" style={{ color: '#8B6914' }}></i>
                      내 주문내역
                    </Link>
                    <Link
                      to="/my-page"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-[#EDE0CC]"
                      style={{ color: '#3D3428' }}
                    >
                      <i className="ri-user-line w-4 h-4 flex items-center justify-center" style={{ color: '#8B6914' }}></i>
                      마이페이지
                    </Link>
                    <Link
                      to="/my-points"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-[#EDE0CC]"
                      style={{ color: '#3D3428' }}
                    >
                      <i className="ri-coin-line w-4 h-4 flex items-center justify-center" style={{ color: '#8B6914' }}></i>
                      내 잔액
                    </Link>
                  </div>
                )}
                {isAdmin && (
                  <div>
                    <button
                      onClick={() => setMobileAdminOpen(!mobileAdminOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-[#EDE0CC] hover:bg-[#E0D5C3] transition-colors cursor-pointer"
                      style={{ color: '#7A6340' }}
                    >
                      <span className="flex items-center gap-2">
                        <i className="ri-shield-user-line w-4 h-4 flex items-center justify-center"></i>
                        관리자모드
                      </span>
                      <i className={`ri-arrow-down-s-line text-base transition-transform ${mobileAdminOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {mobileAdminOpen && (
                      <div className="mt-1 ml-4 space-y-1 border-l-2 border-[#D4C4A8] pl-3">
                        {adminMenuItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer hover:bg-[#EDE0CC]"
                            style={{ color: '#5C5346' }}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t border-[#E0D5C3]">
                  {isLoggedIn ? (
                    <button
                      onClick={() => { logout(); setSession(null); navigate('/login'); setMobileMenuOpen(false); }}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
                      style={{ background: '#8B6914' }}
                    >
                      로그아웃
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors text-center cursor-pointer"
                      style={{ background: '#8B6914' }}
                    >
                      로그인
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 py-24 md:py-28">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-6">

            {/* 좌측: 로고 + 텍스트 */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left max-w-xl">

              {/* 메인 타이틀 */}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 md:mb-5" style={{ color: '#1a1a1a' }}>
                치과 재료 유통의<br className="hidden md:block" /> 새로운{' '}
                <span style={{ color: '#8B6914' }}>운영체제</span>
              </h1>

              {/* 서브 텍스트 */}
              <p className="text-sm md:text-base font-medium mb-2 md:mb-3 leading-relaxed" style={{ color: '#5C5346' }}>
                하이니스 임플란트 전 제품 온라인 주문 · AI 재고 예측 · 자동 발주
              </p>
              <p className="text-xs md:text-sm mb-8 md:mb-9 leading-relaxed" style={{ color: '#8C7E6A' }}>
                더 이상 카카오톡으로 주문하지 마세요. 실시간 재고 확인부터 자동 발주까지,<br className="hidden md:block" />
                치팡이 치과 운영의 효율을 완전히 바꿔드립니다.
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 md:gap-4 w-full">
                <a
                  href="#mvp-order"
                  className="w-full sm:w-auto text-white px-6 md:px-9 py-2.5 md:py-3.5 rounded-lg text-sm md:text-base font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer text-center"
                  style={{ background: '#8B6914' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#7A5A0F'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#8B6914'; }}
                >
                  <i className="ri-shopping-cart-2-line mr-1.5"></i>
                  바로 주문하기
                </a>
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full sm:w-auto bg-transparent px-6 md:px-9 py-2.5 md:py-3.5 rounded-lg text-sm md:text-base font-semibold border-2 transition-all duration-300 whitespace-nowrap cursor-pointer"
                  style={{ borderColor: '#8B6914', color: '#8B6914' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,105,20,0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  입점 문의
                </button>
                {!isLoggedIn && (
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-6 md:px-9 py-2.5 md:py-3.5 rounded-lg text-sm md:text-base font-semibold border transition-all duration-300 whitespace-nowrap cursor-pointer text-center"
                    style={{ borderColor: '#D4C4A8', color: '#5C5346', background: 'rgba(255,255,255,0.6)' }}
                  >
                    로그인 / 회원가입
                  </Link>
                )}
              </div>

              {/* 신뢰 지표 */}
              <div className="flex items-center gap-4 md:gap-6 mt-8 md:mt-10">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-lg md:text-2xl font-bold" style={{ color: '#1a1a1a' }}>200+</span>
                  <span className="text-[10px] md:text-xs" style={{ color: '#8C7E6A' }}>취급 품목</span>
                </div>
                <div className="w-px h-8" style={{ background: '#D4C4A8' }}></div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-lg md:text-2xl font-bold" style={{ color: '#1a1a1a' }}>24h</span>
                  <span className="text-[10px] md:text-xs" style={{ color: '#8C7E6A' }}>주문~배송</span>
                </div>
                <div className="w-px h-8" style={{ background: '#D4C4A8' }}></div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-lg md:text-2xl font-bold" style={{ color: '#1a1a1a' }}>B2B</span>
                  <span className="text-[10px] md:text-xs" style={{ color: '#8C7E6A' }}>치과 전용</span>
                </div>
              </div>
            </div>

            {/* 우측: 제품 카드 + AI 직원 카드 */}
            <div className="hidden md:block flex-shrink-0 w-[400px] lg:w-[480px] relative" style={{ minHeight: '460px' }}>

              {/* 메인 제품 카드 (중앙) */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] lg:w-[300px] rounded-[20px] overflow-hidden border"
                style={{
                  boxShadow: '0 20px 60px rgba(139,105,20,0.15)',
                  borderColor: 'rgba(139,105,20,0.1)',
                }}
              >
                <div className="relative w-full h-[320px] lg:h-[360px]">
                  <img
                    src="https://qibboprrgxliolrvrvot.supabase.co/storage/v1/object/public/products/ai-staff/nexture-product.png"
                    alt="Nexture Implant System"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[55%] flex flex-col justify-end px-4 pb-4"
                    style={{ background: 'linear-gradient(to top, rgba(60,40,20,0.92) 0%, rgba(90,60,30,0.5) 60%, transparent 100%)' }}
                  >
                    <p className="text-white font-extrabold text-lg tracking-widest leading-none">NEXTURE</p>
                    <p className="text-white/60 text-[11px] mt-0.5 font-medium">Highness Implant System</p>
                  </div>
                </div>
              </div>

              {/* AI 직원 카드 — 좌측 하단 (임플란트팀) */}
              <div
                onClick={() => { const el = document.getElementById('mvp-order'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                className="absolute left-0 bottom-4 w-[160px] rounded-2xl overflow-hidden border cursor-pointer hover:scale-105 transition-all duration-300"
                style={{
                  boxShadow: '0 8px 24px rgba(139,105,20,0.12)',
                  borderColor: 'rgba(139,105,20,0.15)',
                  background: '#F5EDE0',
                }}
              >
                <div className="relative w-full h-[160px]">
                  <img
                    src="https://qibboprrgxliolrvrvot.supabase.co/storage/v1/object/public/products/ai-staff/staff-implant.png"
                    alt="치팡 임플란트팀"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[45%] flex items-end px-2.5 pb-2"
                    style={{ background: 'linear-gradient(to top, rgba(90,75,50,0.8) 0%, transparent 100%)' }}
                  >
                    <p className="text-white text-[11px] font-bold">치팡 임플란트팀</p>
                  </div>
                </div>
              </div>

              {/* AI 직원 카드 — 우측 상단 (소모품팀) */}
              <div
                onClick={() => { setShowStaffToast(true); setTimeout(() => setShowStaffToast(false), 3500); }}
                className="absolute right-0 -top-8 w-[150px] rounded-2xl overflow-hidden border cursor-pointer hover:scale-105 transition-all duration-300"
                style={{
                  boxShadow: '0 8px 24px rgba(139,105,20,0.12)',
                  borderColor: 'rgba(139,105,20,0.15)',
                  background: '#F5EDE0',
                }}
              >
                <div className="relative w-full h-[150px]">
                  <img
                    src="https://qibboprrgxliolrvrvot.supabase.co/storage/v1/object/public/products/ai-staff/staff-denforce.png"
                    alt="치팡 소모품팀"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[45%] flex items-end px-2.5 pb-2"
                    style={{ background: 'linear-gradient(to top, rgba(90,75,50,0.8) 0%, transparent 100%)' }}
                  >
                    <p className="text-white text-[11px] font-bold">치팡 소모품팀</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full flex items-start justify-center p-2" style={{ border: '2px solid rgba(139,105,20,0.3)' }}>
            <div className="w-1 h-3 rounded-full animate-bounce" style={{ background: 'rgba(139,105,20,0.5)' }}></div>
          </div>
        </div>
      </section>

      {/* 소모품팀 준비중 토스트 */}
      {showStaffToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3.5 rounded-xl text-white" style={{ background: 'rgba(90,75,50,0.95)', boxShadow: '0 8px 24px rgba(139,105,20,0.2)' }}>
          <i className="ri-time-line w-5 h-5 flex items-center justify-center" style={{ color: '#D4A827' }}></i>
          <span className="text-sm font-medium whitespace-nowrap">소모품·재료 사업부는 준비중입니다. 곧 오픈 예정!</span>
          <button
            onClick={() => setShowStaffToast(false)}
            className="ml-2 w-5 h-5 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
          >
            <i className="ri-close-line text-base"></i>
          </button>
        </div>
      )}

      {showInquiryModal && (
        <InquiryModal onClose={() => setShowInquiryModal(false)} />
      )}
    </>
  );
}
