import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  highnessProducts,
  type HignessProduct,
} from '../../mocks/highness-catalog';
import Footer from '../home/components/Footer';

const fixtureProducts = highnessProducts.filter(
  (p) => p.category_id === 'fixture' && p.status === 'active',
);

// ─── 모델별 실제 지원 직경×길이 조합 ───────────────────────────
// 공식 사이트 규격표 기준
const SUPPORTED_COMBOS: Record<string, Record<string, string[]>> = {
  'fx-bl-001': {
    // HS-I: Ø3.5~5.0 × 8~13mm
    'Ø3.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø5.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
  },
  'fx-bl-007': {
    // HS-VII: Ø3.5~6.0 × 8~14.5mm (Ø3.5는 14.5mm 미지원, Ø6.0는 8mm 미지원)
    'Ø3.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø4.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø5.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø6.0': ['10.0mm', '11.5mm', '13.0mm', '14.5mm'],
  },
  'fx-bl-hsn1': {
    // HSN-I: Ø3.5~5.0 × 8~13mm
    'Ø3.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø5.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
  },
  'fx-bl-hsn7': {
    // HSN-VII: Ø3.5~6.0 × 8~14.5mm (HS-VII와 동일 패턴)
    'Ø3.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø4.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø5.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø6.0': ['10.0mm', '11.5mm', '13.0mm', '14.5mm'],
  },
  'fx-nx-001': {
    // 넥스츄어(NX-I): Ø3.5~5.0 × 8~13mm
    'Ø3.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø5.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
  },
  'fx-nx-007': {
    // 넥스츄어7(NX-VII): Ø3.5~6.0 × 8~14.5mm (HS-VII와 동일 패턴)
    'Ø3.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm'],
    'Ø4.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø4.5': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø5.0': ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'],
    'Ø6.0': ['10.0mm', '11.5mm', '13.0mm', '14.5mm'],
  },
};

function isSupported(productId: string, diameter: string, length: string): boolean {
  const combo = SUPPORTED_COMBOS[productId];
  if (!combo) return true; // 데이터 없으면 전체 지원으로 간주
  return combo[diameter]?.includes(length) ?? false;
}

// ─── 전체 길이 목록 (모든 모델 통합) ───────────────────────────
const ALL_LENGTHS = ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'];

interface CompareSpec {
  key: string;
  label: string;
  category: string;
  getValue: (p: HignessProduct) => string;
}

const compareSpecs: CompareSpec[] = [
  {
    key: 'type',
    label: '타입',
    category: '기본 정보',
    getValue: (p) =>
      p.model_code.startsWith('HSN')
        ? 'Tissue Level'
        : p.model_code.startsWith('NX')
        ? 'Tissue Level (넥스츄어)'
        : 'Bone Level',
  },
  {
    key: 'material',
    label: '소재',
    category: '기본 정보',
    getValue: (p) => p.specs.find((s) => s.label === '소재')?.value || '-',
  },
  {
    key: 'surface',
    label: '표면처리',
    category: '기본 정보',
    getValue: (p) => p.specs.find((s) => s.label === '표면처리')?.value || '-',
  },
  {
    key: 'connection',
    label: '연결 방식',
    category: '기본 정보',
    getValue: (p) => p.specs.find((s) => s.label === '연결 방식')?.value || '-',
  },
  {
    key: 'diameter',
    label: '직경 옵션',
    category: '사이즈',
    getValue: (p) =>
      p.options.find((o) => o.label === '직경')?.values.join(', ') || '-',
  },
  {
    key: 'length',
    label: '길이 옵션',
    category: '사이즈',
    getValue: (p) =>
      p.options.find((o) => o.label === '길이')?.values.join(', ') || '-',
  },
  {
    key: 'neck',
    label: 'Neck 높이',
    category: '사이즈',
    getValue: (p) =>
      p.options.find((o) => o.label === 'neck 높이')?.values.join(', ') ||
      '해당 없음',
  },
  {
    key: 'torque',
    label: '식립 토크',
    category: '성능',
    getValue: (p) =>
      p.specs.find((s) => s.label === '식립 토크')?.value || '-',
  },
  {
    key: 'body',
    label: '바디 형태',
    category: '성능',
    getValue: (p) =>
      p.specs.find((s) => s.label === '바디 형태')?.value ||
      'Standard Tapered',
  },
  {
    key: 'hex',
    label: 'Hex 사이즈',
    category: '성능',
    getValue: (p) =>
      p.specs.find((s) => s.label === 'Hex 사이즈')?.value || '-',
  },
  {
    key: 'scanbody',
    label: '호환 스캔바디',
    category: '호환 정보',
    getValue: (p) => {
      if (p.sub_type === 'tissue_level' || p.model_code.startsWith('NX')) {
        return 'D Type (HN-DSB-D), B Type (HN-DSB-B)';
      }
      return 'D Type (HN-DSB-D), B Type (HN-DSB-B)';
    },
  },
  {
    key: 'abutment',
    label: '호환 어버트먼트',
    category: '호환 정보',
    getValue: () => 'Base, Angled Base, Multi, Milling',
  },
  {
    key: 'packaging',
    label: '패키징',
    category: '기타',
    getValue: (p) =>
      p.specs.find((s) => s.label === '패키징')?.value || '-',
  },
  {
    key: 'cert',
    label: '인증',
    category: '기타',
    getValue: (p) =>
      p.specs.find((s) => s.label === '인증')?.value || '-',
  },
];

const clinicalFitData: Record<string, { situation: string; score: number }[]> = {
  'fx-bl-001': [
    { situation: '구치부 단일 임플란트', score: 5 },
    { situation: '전치부 심미 임플란트', score: 4 },
    { situation: '발치 즉시 식립', score: 3 },
    { situation: '연골(D3-D4) 식립', score: 4 },
    { situation: '1회법 수술', score: 2 },
    { situation: '전악 임플란트', score: 3 },
  ],
  'fx-bl-007': [
    { situation: '구치부 단일 임플란트', score: 4 },
    { situation: '전치부 심미 임플란트', score: 3 },
    { situation: '발치 즉시 식립', score: 5 },
    { situation: '연골(D3-D4) 식립', score: 5 },
    { situation: '1회법 수술', score: 2 },
    { situation: '전악 임플란트', score: 4 },
  ],
  'fx-tl-001': [
    { situation: '구치부 단일 임플란트', score: 5 },
    { situation: '전치부 심미 임플란트', score: 4 },
    { situation: '발치 즉시 식립', score: 3 },
    { situation: '연골(D3-D4) 식립', score: 3 },
    { situation: '1회법 수술', score: 5 },
    { situation: '전악 임플란트', score: 3 },
  ],
  'fx-tl-002': [
    { situation: '구치부 단일 임플란트', score: 4 },
    { situation: '전치부 심미 임플란트', score: 3 },
    { situation: '발치 즉시 식립', score: 5 },
    { situation: '연골(D3-D4) 식립', score: 5 },
    { situation: '1회법 수술', score: 5 },
    { situation: '전악 임플란트', score: 3 },
  ],
  'fx-nx-001': [
    { situation: '구치부 단일 임플란트', score: 5 },
    { situation: '전치부 심미 임플란트', score: 4 },
    { situation: '발치 즉시 식립', score: 3 },
    { situation: '연골(D3-D4) 식립', score: 4 },
    { situation: '1회법 수술', score: 5 },
    { situation: '전악 임플란트', score: 4 },
  ],
  'fx-nx-007': [
    { situation: '구치부 단일 임플란트', score: 4 },
    { situation: '전치부 심미 임플란트', score: 3 },
    { situation: '발치 즉시 식립', score: 5 },
    { situation: '연골(D3-D4) 식립', score: 5 },
    { situation: '1회법 수술', score: 4 },
    { situation: '전악 임플란트', score: 4 },
  ],
};

// ─── 모델별 색상 팔레트 ───────────────────────────────────────
const MODEL_COLORS = [
  {
    dot: 'bg-teal-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    check: 'text-teal-600',
  },
  {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    check: 'text-blue-600',
  },
  {
    dot: 'bg-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    check: 'text-purple-600',
  },
  {
    dot: 'bg-pink-500',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    check: 'text-pink-600',
  },
  {
    dot: 'bg-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    check: 'text-orange-600',
  },
  {
    dot: 'bg-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    check: 'text-green-600',
  },
];

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-2 rounded-sm ${
              i < score
                ? score >= 4
                  ? 'bg-emerald-500'
                  : score >= 3
                  ? 'bg-amber-400'
                  : 'bg-gray-300'
                : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold text-gray-500 ml-1">
        {score}/{max}
      </span>
    </div>
  );
}

export default function FixtureComparePage() {
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 데스크톱: 체크박스 다중 선택 / 모바일: 드롭다운 최대 2개 선택
  const [selectedIds, setSelectedIds] = useState<string[]>(
    fixtureProducts.slice(0, 3).map((p) => p.id),
  );
  // 모바일 드롭다운 선택 (최대 2개)
  const [mobileSelectA, setMobileSelectA] = useState<string>(fixtureProducts[0]?.id ?? '');
  const [mobileSelectB, setMobileSelectB] = useState<string>(fixtureProducts[1]?.id ?? '');

  const [activeSection, setActiveSection] = useState<'table' | 'radar' | 'recommend' | 'spec-matrix'>('table');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // 모바일에서는 드롭다운 2개 선택 기준으로 비교
  const mobileSelectedProducts = useMemo(() => {
    const ids = [mobileSelectA, mobileSelectB].filter(Boolean);
    return fixtureProducts.filter((p) => ids.includes(p.id));
  }, [mobileSelectA, mobileSelectB]);

  const desktopSelectedProducts = useMemo(
    () => fixtureProducts.filter((p) => selectedIds.includes(p.id)),
    [selectedIds],
  );

  const selectedProducts = isMobile ? mobileSelectedProducts : desktopSelectedProducts;

  const specCategories = [...new Set(compareSpecs.map((s) => s.category))];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center cursor-pointer">
            <img
              src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png"
              alt="CHIPANG Logo"
              className="h-8 md:h-10"
            />
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/#products"
              className="text-sm font-medium text-gray-600 hover:text-[#1A2B3C] transition-colors whitespace-nowrap cursor-pointer"
            >
              하이니스 제품관
            </Link>
            <Link
              to="/category/fixture"
              className="text-sm font-medium text-gray-600 hover:text-[#1A2B3C] transition-colors whitespace-nowrap cursor-pointer"
            >
              픽스쳐
            </Link>
          </div>
          <Link
            to="/login"
            className="px-4 md:px-5 py-2 rounded-lg text-sm font-medium bg-[#1A2B3C] text-white hover:bg-[#2B5F9E] transition-all whitespace-nowrap cursor-pointer"
          >
            로그인
          </Link>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero */}
        <section className="relative py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://readdy.ai/api/search-image?query=modern%20dental%20implant%20technology%20comparison%20analysis%2C%20abstract%20geometric%20background%20with%20dental%20implant%20silhouettes%2C%20dark%20navy%20and%20teal%20gradient%2C%20professional%20medical%20technology%20concept%2C%20clean%20minimalist%20design&width=1400&height=500&seq=compare-hero-bg-001&orientation=landscape"
              alt=""
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B3C]/90 to-[#1A2B3C]/60"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 md:px-6 text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
              <i className="ri-bar-chart-grouped-line w-4 h-4 flex items-center justify-center"></i>
              Fixture Comparison
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
              픽스쳐 모델 비교 분석
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              하이니스 픽스쳐의 사양, 성능, 임상 적합성을 한눈에 비교하여 최적의 제품을 선택하세요.
            </p>
          </div>
        </section>

        {/* ── 모바일: 드롭다운 선택 ── */}
        <section className="md:hidden py-5 bg-gray-50 border-b border-gray-200">
          <div className="px-4">
            <p className="text-xs font-bold text-[#1A2B3C] mb-3 flex items-center gap-1.5">
              <i className="ri-git-compare-line w-4 h-4 flex items-center justify-center text-[#2B5F9E]"></i>
              비교할 모델 2개 선택
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* 모델 A */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  모델 A
                </label>
                <select
                  value={mobileSelectA}
                  onChange={(e) => setMobileSelectA(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#2B5F9E] cursor-pointer font-medium text-gray-700"
                >
                  {fixtureProducts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === mobileSelectB}>
                      {p.name_ko}
                    </option>
                  ))}
                </select>
                {mobileSelectA && (
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-2 py-1.5">
                    <div className="w-8 h-8 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                      <img
                        src={fixtureProducts.find((p) => p.id === mobileSelectA)?.image_url}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#1A2B3C] truncate">
                        {fixtureProducts.find((p) => p.id === mobileSelectA)?.name_ko}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">
                        {fixtureProducts.find((p) => p.id === mobileSelectA)?.model_code}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* 모델 B */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  모델 B
                </label>
                <select
                  value={mobileSelectB}
                  onChange={(e) => setMobileSelectB(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#2B5F9E] cursor-pointer font-medium text-gray-700"
                >
                  {fixtureProducts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === mobileSelectA}>
                      {p.name_ko}
                    </option>
                  ))}
                </select>
                {mobileSelectB && (
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-2 py-1.5">
                    <div className="w-8 h-8 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                      <img
                        src={fixtureProducts.find((p) => p.id === mobileSelectB)?.image_url}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#1A2B3C] truncate">
                        {fixtureProducts.find((p) => p.id === mobileSelectB)?.name_ko}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">
                        {fixtureProducts.find((p) => p.id === mobileSelectB)?.model_code}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 데스크톱: 체크박스 다중 선택 ── */}
        <section className="hidden md:block py-8 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1A2B3C] flex items-center gap-2">
                <i className="ri-checkbox-multiple-line w-4 h-4 flex items-center justify-center text-[#2B5F9E]"></i>
                비교할 모델 선택
                <span className="text-xs font-normal text-gray-400 ml-1">
                  ({selectedIds.length}/{fixtureProducts.length}개 선택)
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(fixtureProducts.map((p) => p.id))}
                  className="text-[10px] font-semibold text-[#2B5F9E] hover:underline cursor-pointer whitespace-nowrap"
                >
                  전체 선택
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-[10px] font-semibold text-gray-500 hover:underline cursor-pointer whitespace-nowrap"
                >
                  전체 해제
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {fixtureProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#1A2B3C] text-white border-[#1A2B3C] shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-white border-white' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <i className="ri-check-line text-[#1A2B3C] text-[10px]"></i>
                      )}
                    </div>
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                    </div>
                    {p.name_ko}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 섹션 탭 */}
        <section className="py-4 md:py-6 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 overflow-x-auto pb-1">
              {[
                { id: 'table' as const, label: '사양 비교표', icon: 'ri-table-line' },
                { id: 'spec-matrix' as const, label: '규격 비교표', icon: 'ri-grid-line' },
                { id: 'radar' as const, label: '임상 적합성', icon: 'ri-radar-line' },
                { id: 'recommend' as const, label: '상황별 추천', icon: 'ri-lightbulb-line' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                    activeSection === tab.id
                      ? 'bg-[#1A2B3C] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className={`${tab.icon} w-4 h-4 inline-flex items-center justify-center mr-1`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 사양 비교표 */}
        {activeSection === 'table' && (
          <section className="py-8 md:py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              {selectedProducts.length < 2 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-bar-chart-grouped-line text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">2개 이상의 모델을 선택해주세요</h3>
                  <p className="text-sm text-gray-500">비교할 픽스쳐 모델을 위에서 선택하면 상세 비교표가 표시됩니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm -mx-4 md:mx-0">
                  <table className="w-full" style={{ minWidth: `${selectedProducts.length * 130 + 120}px` }}>
                    <thead>
                      <tr className="bg-[#1A2B3C]">
                        <th className="text-left px-3 md:px-5 py-3 md:py-4 text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wide w-28 md:w-40 sticky left-0 bg-[#1A2B3C] z-10">
                          비교 항목
                        </th>
                        {selectedProducts.map((p) => (
                          <th key={p.id} className="px-3 md:px-4 py-3 md:py-4 text-center min-w-[120px] md:min-w-[140px]">
                            <Link to={`/product/${p.detail_page_id || p.id}`} className="group cursor-pointer">
                              <div className="w-10 h-10 md:w-14 md:h-14 bg-white/10 rounded-xl mx-auto mb-1.5 md:mb-2 flex items-center justify-center overflow-hidden">
                                <img src={p.image_url} alt={p.name_ko} className="w-full h-full object-contain" />
                              </div>
                              <p className="text-[10px] md:text-xs font-bold text-white group-hover:text-[#7FB3E0] transition-colors leading-tight">
                                {p.name_ko}
                              </p>
                              <p className="text-[9px] md:text-[10px] text-white/50 font-mono mt-0.5">
                                {p.model_code}
                              </p>
                            </Link>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {specCategories.map((cat) => (
                        <>
                          <tr key={`cat-${cat}`}>
                            <td
                              colSpan={selectedProducts.length + 1}
                              className="bg-gray-50 px-3 md:px-5 py-2 text-[10px] md:text-xs font-bold text-[#2B5F9E] uppercase tracking-wide border-t border-gray-200"
                            >
                              <i className="ri-folder-line w-3.5 h-3.5 inline-flex items-center justify-center mr-1.5"></i>
                              {cat}
                            </td>
                          </tr>
                          {compareSpecs
                            .filter((s) => s.category === cat)
                            .map((spec, si) => (
                              <tr key={spec.key} className={si % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                <td className="px-3 md:px-5 py-2.5 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 border-r border-gray-100 sticky left-0 bg-inherit z-10">
                                  {spec.label}
                                </td>
                                {selectedProducts.map((p) => (
                                  <td key={p.id} className="px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-xs text-gray-700 text-center border-r border-gray-50 last:border-0">
                                    {spec.getValue(p)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </>
                      ))}

                      <tr>
                        <td
                          colSpan={selectedProducts.length + 1}
                          className="bg-gray-50 px-3 md:px-5 py-2 text-[10px] md:text-xs font-bold text-[#2B5F9E] uppercase tracking-wide border-t border-gray-200"
                        >
                          <i className="ri-star-line w-3.5 h-3.5 inline-flex items-center justify-center mr-1.5"></i>
                          핵심 특징
                        </td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 md:px-5 py-2.5 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 border-r border-gray-100 sticky left-0 bg-white z-10 align-top">
                          주요 특징
                        </td>
                        {selectedProducts.map((p) => (
                          <td key={p.id} className="px-3 md:px-4 py-2.5 md:py-3 text-left border-r border-gray-50 last:border-0 align-top">
                            <ul className="space-y-1">
                              {p.features.slice(0, 3).map((f, fi) => (
                                <li key={fi} className="flex items-start gap-1 text-[10px] md:text-[11px] text-gray-600 leading-snug">
                                  <i className="ri-check-line text-[#2B5F9E] mt-0.5 w-3 h-3 flex items-center justify-center flex-shrink-0"></i>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-[#EEF2F8]">
                        <td className="px-3 md:px-5 py-3 md:py-4 text-[10px] md:text-xs font-bold text-[#1A2B3C] border-r border-[#2B5F9E]/10 sticky left-0 bg-[#EEF2F8] z-10">
                          기본 단가
                        </td>
                        {selectedProducts.map((p) => (
                          <td key={p.id} className="px-3 md:px-4 py-3 md:py-4 text-center border-r border-[#2B5F9E]/10 last:border-0">
                            <span className="text-xs md:text-sm font-bold text-[#2B5F9E]">
                              ₩{p.base_price.toLocaleString()}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── 규격 비교표 ─── */}
        {activeSection === 'spec-matrix' && (
          <section className="py-8 md:py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-bold text-[#1A2B3C] mb-1">규격 비교표</h2>
                <p className="text-xs md:text-sm text-gray-500">각 픽스쳐 모델의 직경(Ø) × 길이(mm) 지원 조합을 시각적으로 비교합니다.</p>
              </div>

              {selectedProducts.length < 1 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm">비교할 모델을 선택해주세요.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* 모델별 색상 범례 */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    {selectedProducts.map((p, idx) => {
                      const color = MODEL_COLORS[idx % MODEL_COLORS.length];
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-sm ${color.dot}`}></div>
                          <span className="text-xs font-semibold text-gray-700">{p.name_ko}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({p.model_code})</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 모델별 직경 × 길이 매트릭스 */}
                  {selectedProducts.map((product, idx) => {
                    const color = MODEL_COLORS[idx % MODEL_COLORS.length];
                    const diameterOption = product.options.find((o) => o.label === '직경');
                    const lengthOption = product.options.find((o) => o.label === '길이');
                    const neckOption = product.options.find((o) => o.label === 'neck 높이');

                    const diameters = diameterOption?.values || [];
                    const lengths = lengthOption?.values || [];
                    const necks = neckOption?.values || [];

                    // 이 모델이 지원하는 길이만 컬럼으로 표시
                    const supportedLengths = ALL_LENGTHS.filter((len) =>
                      diameters.some((dia) => isSupported(product.id, dia, len))
                    );

                    // 총 지원 조합 수
                    const totalCombos = diameters.reduce((acc, dia) => {
                      return acc + supportedLengths.filter((len) => isSupported(product.id, dia, len)).length;
                    }, 0);

                    return (
                      <div key={product.id} className={`rounded-2xl border-2 ${color.border} overflow-hidden shadow-sm`}>
                        {/* 헤더 */}
                        <div className={`${color.bg} px-4 md:px-6 py-3 md:py-4 flex items-center gap-3`}>
                          <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                            <img src={product.image_url} alt={product.name_ko} className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm md:text-base font-bold ${color.text}`}>{product.name_ko}</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 font-mono">{product.model_code}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-xl md:text-2xl font-extrabold ${color.text}`}>{totalCombos}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">총 규격 조합</p>
                          </div>
                        </div>

                        {/* 직경 × 길이 매트릭스 테이블 */}
                        <div className="overflow-x-auto">
                          <table className="w-full" style={{ minWidth: `${supportedLengths.length * 90 + 100}px` }}>
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 md:px-5 py-2.5 md:py-3 text-left text-[10px] font-bold text-gray-600 border-r border-gray-200 sticky left-0 bg-gray-50 z-10 min-w-[80px]">
                                  직경 ╲ 길이
                                </th>
                                {supportedLengths.map((len) => (
                                  <th key={len} className="px-3 md:px-4 py-2.5 md:py-3 text-center text-[10px] font-bold text-gray-600 border-r border-gray-100 last:border-0 min-w-[70px]">
                                    {len}
                                  </th>
                                ))}
                                <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-400 min-w-[50px]">합계</th>
                              </tr>
                            </thead>
                            <tbody>
                              {diameters.map((dia, diaIdx) => {
                                const rowCount = supportedLengths.filter((len) => isSupported(product.id, dia, len)).length;
                                return (
                                  <tr key={dia} className={diaIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                                    <td className={`px-3 md:px-5 py-2.5 md:py-3 text-[10px] font-bold ${color.text} border-r border-gray-200 sticky left-0 z-10 ${diaIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                                      {dia}
                                    </td>
                                    {supportedLengths.map((len) => {
                                      const supported = isSupported(product.id, dia, len);
                                      return (
                                        <td key={`${dia}-${len}`} className="px-3 md:px-4 py-2.5 md:py-3 text-center border-r border-gray-50 last:border-0">
                                          {supported ? (
                                            <div className="flex items-center justify-center">
                                              <div className={`w-6 h-6 rounded-full ${color.bg} border ${color.border} flex items-center justify-center`}>
                                                <i className={`ri-check-line text-sm font-bold ${color.check}`}></i>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center">
                                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-gray-200 text-xs font-bold">—</span>
                                              </div>
                                            </div>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`text-[10px] font-bold ${color.text}`}>{rowCount}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* 열 합계 행 */}
                              <tr className={`${color.bg} border-t-2 ${color.border}`}>
                                <td className={`px-3 md:px-5 py-2 text-[10px] font-bold ${color.text} border-r border-gray-200 sticky left-0 ${color.bg} z-10`}>합계</td>
                                {supportedLengths.map((len) => {
                                  const colCount = diameters.filter((dia) => isSupported(product.id, dia, len)).length;
                                  return (
                                    <td key={len} className="px-3 py-2 text-center border-r border-gray-100 last:border-0">
                                      <span className={`text-[10px] font-bold ${color.text}`}>{colCount}</span>
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-2 text-center">
                                  <span className={`text-xs font-extrabold ${color.text}`}>{totalCombos}</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Neck 높이 옵션 */}
                        {necks.length > 0 && (
                          <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="ri-ruler-line text-sm text-gray-500"></i>
                              <span className="text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">Neck 높이 옵션</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {necks.map((neck) => (
                                <span key={neck} className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold ${color.bg} ${color.text} border ${color.border}`}>
                                  {neck}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 상세 보기 버튼 */}
                        <div className="px-4 md:px-6 py-3 md:py-4 bg-white border-t border-gray-100 flex items-center justify-between">
                          <p className="text-[10px] text-gray-400">
                            <i className="ri-information-line mr-1"></i>
                            ✓ 지원 &nbsp;|&nbsp; — 미지원
                          </p>
                          <Link
                            to={`/product/${product.detail_page_id || product.id}`}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-2 ${color.border} ${color.text} transition-colors cursor-pointer whitespace-nowrap`}
                          >
                            <i className="ri-information-line w-3.5 h-3.5 flex items-center justify-center"></i>
                            상세 규격 보기
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {/* 전체 모델 통합 비교 테이블 */}
                  {selectedProducts.length >= 2 && (
                    <div className="mt-10">
                      <h3 className="text-base font-bold text-[#1A2B3C] mb-4 flex items-center gap-2">
                        <i className="ri-table-2 w-5 h-5 flex items-center justify-center text-[#2B5F9E]"></i>
                        전체 모델 통합 규격 비교
                      </h3>
                      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                        <table className="w-full" style={{ minWidth: `${selectedProducts.length * 110 + 160}px` }}>
                          <thead>
                            <tr className="bg-[#1A2B3C]">
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-white/70 uppercase tracking-wide sticky left-0 bg-[#1A2B3C] z-10 min-w-[100px]">직경 ╲ 길이</th>
                              {ALL_LENGTHS.map((len) => (
                                <th key={len} className="px-3 py-3 text-center text-[10px] font-bold text-white/70 min-w-[70px]">{len}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* 모든 직경 수집 */}
                            {Array.from(new Set(selectedProducts.flatMap((p) => p.options.find((o) => o.label === '직경')?.values || []))).map((dia, diaIdx) => (
                              <tr key={dia} className={diaIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                <td className={`px-4 py-3 text-xs font-bold text-[#1A2B3C] border-r border-gray-200 sticky left-0 z-10 ${diaIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>{dia}</td>
                                {ALL_LENGTHS.map((len) => {
                                  const supportingModels = selectedProducts.filter((p) => {
                                    const hasDia = p.options.find((o) => o.label === '직경')?.values.includes(dia);
                                    return hasDia && isSupported(p.id, dia, len);
                                  });
                                  return (
                                    <td key={len} className="px-2 py-2 text-center border-r border-gray-50 last:border-0">
                                      {supportingModels.length > 0 ? (
                                        <div className="flex flex-wrap gap-0.5 justify-center">
                                          {supportingModels.map((p, pIdx) => {
                                            const origIdx = selectedProducts.findIndex((sp) => sp.id === p.id);
                                            const color = MODEL_COLORS[origIdx % MODEL_COLORS.length];
                                            return (
                                              <span key={p.id} className={`inline-block w-2 h-2 rounded-full ${color.dot}`} title={p.name_ko}></span>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="text-gray-200 text-xs">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 text-center">
                        각 색상 점은 해당 조합을 지원하는 모델을 나타냅니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 임상 적합성 분석 */}
        {activeSection === 'radar' && (
          <section className="py-8 md:py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-bold text-[#1A2B3C] mb-2">임상 적합성 분석</h2>
                <p className="text-xs md:text-sm text-gray-500">각 픽스쳐 모델의 임상 상황별 적합도를 5점 척도로 비교합니다.</p>
              </div>

              {selectedProducts.length < 1 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm">비교할 모델을 선택해주세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                  {selectedProducts.map((p, idx) => {
                    const color = MODEL_COLORS[idx % MODEL_COLORS.length];
                    const fits = clinicalFitData[p.id] || [];
                    const avgScore =
                      fits.length > 0
                        ? (fits.reduce((s, f) => s + f.score, 0) / fits.length).toFixed(1)
                        : '0';
                    return (
                      <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="bg-gradient-to-r from-[#1A2B3C] to-[#2B5F9E] px-4 md:px-5 py-3 md:py-4 flex items-center gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img src={p.image_url} alt={p.name_ko} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-bold text-white truncate">{p.name_ko}</p>
                            <p className="text-[9px] md:text-[10px] text-white/60 font-mono">{p.model_code}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl md:text-2xl font-extrabold text-white">{avgScore}</p>
                            <p className="text-[9px] text-white/60 uppercase">평균 점수</p>
                          </div>
                        </div>
                        <div className="p-4 md:p-5 space-y-2.5 md:space-y-3">
                          {fits.map((f, fi) => (
                            <div key={fi} className="flex items-center justify-between">
                              <span className="text-[10px] md:text-xs font-medium text-gray-600 min-w-[120px] md:min-w-[140px]">
                                {f.situation}
                              </span>
                              <ScoreBar score={f.score} />
                            </div>
                          ))}
                        </div>
                        <div className="px-4 md:px-5 pb-4">
                          <Link
                            to={`/product/${p.detail_page_id || p.id}`}
                            className={`w-full flex items-center justify-center gap-1.5 py-2 md:py-2.5 rounded-xl text-xs font-semibold border-2 ${color.border} ${color.text} transition-colors cursor-pointer whitespace-nowrap`}
                          >
                            <i className="ri-information-line w-3.5 h-3.5 flex items-center justify-center"></i>
                            상세 보기
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 상황별 추천 */}
        {activeSection === 'recommend' && (
          <section className="py-8 md:py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-bold text-[#1A2B3C] mb-2">임상 상황별 추천 모델</h2>
                <p className="text-xs md:text-sm text-gray-500">각 임상 상황에 가장 적합한 픽스쳐 모델을 추천합니다.</p>
              </div>

              <div className="space-y-4 md:space-y-5">
                {[
                  { situation: '구치부 단일 임플란트', icon: 'ri-tooth-line', desc: '구치부 단일 치아 결손 시 가장 범용적으로 사용할 수 있는 모델' },
                  { situation: '전치부 심미 임플란트', icon: 'ri-palette-line', desc: '심미 부위에서 연조직 보존과 자연스러운 결과를 위한 모델' },
                  { situation: '발치 즉시 식립', icon: 'ri-timer-flash-line', desc: '발치 후 즉시 식립하여 치료 기간을 단축하는 케이스' },
                  { situation: '연골(D3-D4) 식립', icon: 'ri-shield-line', desc: '골질이 약한 부위에서 초기 고정력을 확보해야 하는 케이스' },
                  { situation: '1회법 수술', icon: 'ri-surgical-mask-line', desc: '2차 수술 없이 1회법으로 진행하는 케이스' },
                  { situation: '전악 임플란트', icon: 'ri-layout-grid-line', desc: '무치악 환자의 전악 고정성 보철을 위한 다수 임플란트 식립' },
                ].map((sit) => {
                  const rankings = fixtureProducts
                    .map((p) => {
                      const fits = clinicalFitData[p.id] || [];
                      const match = fits.find((f) => f.situation === sit.situation);
                      return { product: p, score: match?.score || 0 };
                    })
                    .sort((a, b) => b.score - a.score);

                  const topScore = rankings[0]?.score || 0;
                  const topProducts = rankings.filter((r) => r.score === topScore);

                  return (
                    <div key={sit.situation} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="p-4 md:p-6">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#2B5F9E]/10 rounded-xl flex-shrink-0">
                            <i className={`${sit.icon} text-[#2B5F9E] text-lg md:text-xl w-5 h-5 flex items-center justify-center`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-bold text-[#1A2B3C] mb-1">{sit.situation}</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">{sit.desc}</p>

                            <div className="flex flex-wrap gap-2 md:gap-3">
                              {topProducts.map(({ product: p, score }) => (
                                <Link
                                  key={p.id}
                                  to={`/product/${p.detail_page_id || p.id}`}
                                  className="flex items-center gap-2 md:gap-3 bg-white rounded-border border border-gray-200 px-3 md:px-4 py-2 md:py-3 hover:border-[#2B5F9E] hover:shadow-md transition-colors group"
                                >
                                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                                    <img src={p.image_url} alt={p.name_ko} className="w-full h-full object-contain" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] md:text-xs font-bold text-[#1A2B3C] group-hover:text-[#2B5F9E] transition-colors">
                                      {p.name_ko}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-gray-400 font-mono">{p.model_code}</p>
                                  </div>
                                  <div className="ml-1 md:ml-2 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 md:px-2 py-1 rounded-lg flex-shrink-0">
                                    <i className="ri-trophy-line text-xs w-3 h-3 flex items-center justify-center"></i>
                                    <span className="text-[9px] md:text-[10px] font-bold">{score}/5</span>
                                  </div>
                                </Link>
                              ))}
                            </div>

                            <div className="mt-2 md:mt-3 flex flex-wrap gap-2">
                              {rankings.slice(topProducts.length).map(({ product: p, score }) => (
                                <Link
                                  key={p.id}
                                  to={`/product/${p.detail_page_id || p.id}`}
                                  className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-[#2B5F9E] transition-colors cursor-pointer"
                                >
                                  <span className="font-medium">{p.model_code}</span>
                                  <span className="text-gray-300">({score}/5)</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* 플로팅 위로가기 버튼 */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-white text-[#2B5F9E] border border-gray-200 rounded-full shadow-md hover:bg-[#2B5F9E] hover:text-white hover:border-[#2B5F9E] transition-all duration-300 flex items-center justify-center cursor-pointer"
          aria-label="맨 위로 이동"
        >
          <i className="ri-arrow-up-line text-lg"></i>
        </button>
      )}
    </div>
  );
}
