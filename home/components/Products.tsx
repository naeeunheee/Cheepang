import { useState } from 'react';
import { Link } from 'react-router-dom';
import { highnessCategories } from '../../../mocks/highness-catalog';
import { useNotices } from '../../../hooks/useNotices';

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full">
        <i className="ri-image-line text-4xl" />
        <span className="text-xs text-gray-400 mt-1">이미지 준비중</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-contain object-center"
      onError={() => setError(true)}
    />
  );
}

// 카테고리별 상세 설명 데이터 (전문 스펙 기반 고급 문구)
const categoryDetails: Record<string, {
  highlights: string[];
  badge: string;
  accentColor: string;
  bgColor: string;
  iconColor: string;
  icon: string;
  detailDesc: string;
  specTable: { label: string; value: string }[];
}> = {
  fixture: {
    highlights: [
      'Bone Level 4종 — HS-I / HS-VII / HSN-I / HSN-VII',
      'Tissue Level 2종 — 넥스츄어(NX-I) / 넥스츄어7(NX-VII)',
      'Internal Hex + 11° Morse Taper 이중 잠금 구조',
      'SLA 및 HSN 이중 표면처리로 골유착 촉진',
      '직경 Ø3.5 ~ Ø6.0 / 길이 8.0 ~ 14.5 mm 전 규격',
      'CE · KFDA · ISO 13485 국제 인증 완비',
    ],
    badge: 'Bone & Tissue Level',
    accentColor: 'text-[#2B5F9E]',
    bgColor: 'bg-[#EEF4FF]',
    iconColor: 'bg-[#2B5F9E]',
    icon: 'ri-capsule-line',
    detailDesc:
      '하이니스 픽스쳐는 Bone Level 4종(HS-I, HS-VII, HSN-I, HSN-VII)과 Tissue Level 2종(넥스츄어, 넥스츄어7), 총 6가지 모델로 구성됩니다. Internal Hex + 11° Morse Taper 이중 잠금 구조로 Micro-gap을 최소화하고, 독자적인 나사산 디자인이 식립 시 초기 고정력(Primary Stability)을 극대화합니다. SLA 및 HSN 이중 표면처리는 골유착(Osseointegration) 속도를 높여 치유 기간을 단축시키며, 256~262 N의 높은 피로강도로 장기 안정성을 보장합니다.',
    specTable: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (Cp-Ti)' },
      { label: '연결 방식', value: 'Internal Hex + 11° Morse Taper' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0 / Ø6.0' },
      { label: '길이', value: '8.0 / 10.0 / 11.5 / 13.0 / 14.5 mm' },
      { label: '표면처리', value: 'SLA / HSN (이중 처리)' },
      { label: '식립 토크', value: '최대 35 Ncm' },
      { label: '피로강도', value: '256 ~ 262 N' },
    ],
  },
  abutment: {
    highlights: [
      'Base / Angled(15°·25°) / Multi(0°·17°·30°) / Milling — 4타입 완비',
      'Grade 5 티타늄(Ti-6Al-4V) 소재로 최고 강도 구현',
      'Base Abutment 비제거 방식으로 Soft Tissue Sealing 영구 유지',
      '직경 Ø3.5 ~ Ø5.0 전 규격 / 높이 1.0 ~ 6.0 mm 세분화',
      '하이니스 전 픽스쳐 모델 100% 호환',
      'CAD/CAM 밀링 가공 전용 Milling Abutment 별도 제공',
    ],
    badge: '4 Type System',
    accentColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    iconColor: 'bg-emerald-600',
    icon: 'ri-links-line',
    detailDesc:
      '임플란트와 보철물을 연결하는 핵심 상부 구조물입니다. Base Abutment는 체결 후 제거 없이 Soft Tissue Sealing을 영구적으로 유지하여 세균 침투를 차단합니다. Angled(15°/25°) 타입은 각도 보정이 필요한 케이스에, Multi(0°/17°/30°) 타입은 임플란트 오버덴처 및 복잡한 보철 케이스에 최적화되어 있습니다. Milling Abutment는 디지털 CAD/CAM 워크플로우에 완벽히 통합되어 정밀한 맞춤 보철을 구현합니다.',
    specTable: [
      { label: '소재', value: 'Grade 5 Ti-6Al-4V (ELI)' },
      { label: '타입', value: 'Base / Angled / Multi / Milling' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0' },
      { label: '높이', value: '1.0 ~ 6.0 mm (세분화)' },
      { label: '각도 옵션', value: '0° / 15° / 17° / 25° / 30°' },
      { label: '체결 토크', value: '15 ~ 25 Ncm' },
    ],
  },
  scanbody: {
    highlights: [
      'D Type — 픽스쳐 Direct 체결 / B Type — Base Abutment 전용',
      'PEEK 소재, 스캔 정밀도 ±10 μm 이내 보장',
      '구강 스캐너 라이브러리 자동 매칭 (오차 최소화)',
      'Transfer Impression Coping 겸용 (Screw 교체만으로 전환)',
      '협소한 개구량에서도 안정적인 스캔 가능',
      '하이니스 전 픽스쳐 모델 호환',
    ],
    badge: 'Digital Workflow',
    accentColor: 'text-violet-700',
    bgColor: 'bg-violet-50',
    iconColor: 'bg-violet-600',
    icon: 'ri-scan-line',
    detailDesc:
      '완전한 디지털 보철 워크플로우를 위한 고정밀 스캔바디입니다. D Type은 픽스쳐에 Direct 체결하여 임플란트 위치를 정확히 기록하고, B Type은 Base Abutment 위에 체결하여 상부 보철 제작에 활용합니다. PEEK 소재의 독자적인 기하학적 형상이 구강 스캐너 라이브러리와 ±10 μm 이내의 정밀도로 자동 매칭되며, Screw 교체만으로 Transfer Impression Coping으로 즉시 전환 가능합니다.',
    specTable: [
      { label: '소재', value: 'PEEK (Polyether ether ketone)' },
      { label: '타입', value: 'D Type (Direct) / B Type (Base)' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0' },
      { label: '높이', value: '10.0 / 12.0 mm' },
      { label: '스캔 정밀도', value: '±10 μm 이내' },
      { label: '겸용', value: 'Transfer Impression Coping' },
    ],
  },
  link: {
    highlights: [
      'No Cementation 시스템 — Zirconia 파절·탈락 원천 차단',
      'Long / Short / Angled(15°·25°) / Internal — 4타입 완비',
      'Double Pressing 구조로 Crown과 Link 동시 압착 고정',
      '필요 시 탈착·세척·재장착 가능 (주기적 관리 용이)',
      'Grade 5 티타늄(Ti-6Al-4V) 소재, 체결 토크 25 Ncm',
      '하이니스 전 픽스쳐 모델 100% 호환',
    ],
    badge: 'No Cementation',
    accentColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    iconColor: 'bg-amber-600',
    icon: 'ri-link-m',
    detailDesc:
      '기존 시멘트 합착 방식의 한계를 극복한 No Cementation 보철 연결 시스템입니다. Screw가 Crown과 Link Abutment를 동시에 Double Pressing하여 강력한 유지력을 제공하며, 시멘트 잔류물로 인한 Zirconia 파절과 Abutment 탈락을 원천적으로 차단합니다. Long / Short / Angled / Internal 4가지 타입으로 모든 임상 케이스에 대응하며, 필요 시 탈착하여 세척·관리 후 재장착이 가능합니다.',
    specTable: [
      { label: '소재', value: 'Grade 5 Ti-6Al-4V (ELI)' },
      { label: '타입', value: 'Long / Short / Angled / Internal' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0' },
      { label: '높이', value: '1.0 ~ 7.0 mm (타입별 상이)' },
      { label: '각도 옵션', value: '15° / 25° (Angled 타입)' },
      { label: '체결 토크', value: '25 Ncm' },
    ],
  },
  'gauge-kit': {
    highlights: [
      'Angle / Cuff / Base 게이지 세트 — 정밀도 ±0.1 mm',
      'Bone Kit — Profiler · Spreader · Condenser 체계적 구성',
      'HS-I Simple Kit — 핵심 수술 구성품 원스톱 패키지',
      '의료용 SUS 316L 스테인리스 스틸 소재',
      '오토클레이브 멸균 가능 (134°C, 3 bar)',
      '전용 스테인리스 보관 케이스 포함',
    ],
    badge: 'Surgical Tools',
    accentColor: 'text-rose-700',
    bgColor: 'bg-rose-50',
    iconColor: 'bg-rose-600',
    icon: 'ri-tools-line',
    detailDesc:
      '임플란트 수술의 정확성과 효율을 극대화하는 전문 수술 기구 세트입니다. Angle·Cuff·Base 게이지는 ±0.1 mm의 정밀도로 식립 깊이와 각도를 측정하며, Bone Kit은 Profiler·Spreader·Condenser 등 골이식 수술에 필요한 기구를 체계적으로 구성하여 임상 워크플로우를 최적화합니다. HS-I Simple Kit은 픽스쳐부터 Healing Abutment까지 핵심 구성품을 원스톱으로 제공합니다.',
    specTable: [
      { label: '소재', value: '의료용 SUS 316L 스테인리스 스틸' },
      { label: '게이지 정밀도', value: '±0.1 mm' },
      { label: '측정 범위', value: '각도 0~30° / 깊이 0~15 mm' },
      { label: '멸균', value: '오토클레이브 (134°C, 3 bar)' },
      { label: '보관', value: '전용 스테인리스 케이스 포함' },
      { label: '호환', value: '하이니스 전 픽스쳐 모델' },
    ],
  },
};

// 카테고리 순서 고정
const CATEGORY_ORDER = ['fixture', 'abutment', 'scanbody', 'link', 'gauge-kit'];

export default function Products() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeNoticeIdx, setActiveNoticeIdx] = useState(0);
  
  // DB에서 공지사항 불러오기
  const { notices, loading: noticesLoading } = useNotices();

  const sortedCategories = [...highnessCategories].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id)
  );

  const activeCat = activeCategory
    ? sortedCategories.find((c) => c.id === activeCategory)
    : null;
  const activeDetail = activeCategory ? categoryDetails[activeCategory] : null;

  return (
    <section id="products" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* ── 공지사항 / 이벤트 배너 ── */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-notification-3-line text-[#2B5F9E] w-4 h-4 flex items-center justify-center"></i>
            <span className="text-xs font-bold text-[#2B5F9E] uppercase tracking-widest">공지사항 & 이벤트</span>
            <div className="flex-1 h-px bg-gray-100 ml-2"></div>
          </div>

          {/* 배너 카드 */}
          {noticesLoading ? (
            // 로딩 중 스켈레톤 UI
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
              <div className="flex border-b border-gray-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-1 py-3 px-4 flex items-center justify-center gap-1.5">
                    <div className="w-10 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-20 h-3 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-5 p-5 md:p-6">
                <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-full h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-24 h-2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : notices.length === 0 ? (
            // 공지사항 없을 때
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-gradient-to-br from-slate-50 to-white p-8 text-center">
              <i className="ri-notification-off-line text-gray-300 text-4xl mb-2 w-10 h-10 flex items-center justify-center mx-auto"></i>
              <p className="text-sm text-gray-400">등록된 공지사항이 없습니다</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
              {/* 탭 인디케이터 */}
              <div className="flex border-b border-gray-100">
                {notices.map((n, i) => (
                  <button
                    key={n.id}
                    onClick={() => setActiveNoticeIdx(i)}
                    className={`flex-1 py-3 px-4 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      activeNoticeIdx === i
                        ? 'text-[#1A2B3C] border-b-2 border-[#2B5F9E] bg-white'
                        : 'text-gray-400 hover:text-gray-600 bg-transparent'
                    }`}
                  >
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white`} style={{ backgroundColor: n.tag_color }}>
                      {n.tag}
                    </span>
                    <span className="hidden sm:inline truncate max-w-[120px]">{n.title}</span>
                  </button>
                ))}
              </div>

              {/* 활성 공지 내용 */}
              {notices[activeNoticeIdx] && (() => {
                const n = notices[activeNoticeIdx];
                const dateDisplay = n.start_date
                  ? (n.end_date
                    ? `${n.start_date.replace(/-/g, '.')} ~ ${n.end_date.replace(/-/g, '.')}`
                    : `${n.start_date.replace(/-/g, '.')} ~`)
                  : (n.date || '');
                return (
                  <div className="flex items-center gap-5 p-5 md:p-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: n.tag_color }}>
                      <i className={`${n.icon} text-white text-xl w-6 h-6 flex items-center justify-center`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: n.tag_color }}>
                          {n.tag}
                        </span>
                        <h4 className="text-sm md:text-base font-bold text-[#1A2B3C] truncate">{n.title}</h4>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-1">{n.description}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{dateDisplay}</p>
                    </div>
                    <div className="flex-shrink-0 hidden md:flex items-center gap-1 text-xs text-gray-400">
                      <button
                        onClick={() => setActiveNoticeIdx((prev) => (prev - 1 + notices.length) % notices.length)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-arrow-left-s-line text-base"></i>
                      </button>
                      <span className="font-semibold text-gray-500">{activeNoticeIdx + 1} / {notices.length}</span>
                      <button
                        onClick={() => setActiveNoticeIdx((prev) => (prev + 1) % notices.length)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-arrow-right-s-line text-base"></i>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── 섹션 헤더 ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#2B5F9E]/10 text-[#2B5F9E] px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
            <i className="ri-medal-line w-4 h-4 flex items-center justify-center"></i>
            하이니스 정품 임플란트 & 치과 재료
          </div>
          <h2 className="text-[#1A2B3C] text-4xl md:text-5xl font-bold leading-tight mb-4">
            주요 취급 품목
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto">
            픽스쳐부터 게이지·키트까지, 임플란트 시술에 필요한 모든 제품을 한 곳에서 만나보세요.
          </p>
        </div>

        {/* ── 카테고리 카드 그리드 ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10" data-product-shop="">
          {sortedCategories.map((cat) => {
            const detail = categoryDetails[cat.id];
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer text-left ${
                  isActive
                    ? 'border-[#2B5F9E] shadow-xl scale-[1.02]'
                    : 'border-gray-100 hover:border-[#2B5F9E]/40 hover:shadow-lg hover:scale-[1.01] shadow-sm'
                }`}
              >
                {/* 이미지 영역 */}
                <div className="w-full bg-white flex items-center justify-center overflow-hidden" style={{ height: '140px' }}>
                  <ImageWithFallback src={cat.hero_image_url} alt={cat.name_ko} />
                </div>

                {/* 텍스트 영역 */}
                <div className={`p-4 transition-colors duration-300 ${isActive ? 'bg-[#2B5F9E]' : 'bg-white group-hover:bg-slate-50'}`}>
                  {detail && (
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5 inline-block ${
                      isActive ? 'bg-white/20 text-white' : `${detail.bgColor} ${detail.accentColor}`
                    }`}>
                      {detail.badge}
                    </span>
                  )}
                  <h3 className={`text-sm font-bold leading-snug mb-0.5 ${isActive ? 'text-white' : 'text-[#1A2B3C]'}`}>
                    {cat.name_ko}
                  </h3>
                  <p className={`text-[10px] font-medium ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                    {cat.name_en}
                  </p>
                </div>

                {/* 활성 표시 화살표 */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#2B5F9E]"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 카테고리 상세 설명 패널 (클릭 시 펼침) ── */}
        {activeCat && activeDetail && (
          <div className={`rounded-3xl border border-gray-100 shadow-lg overflow-hidden mb-10 transition-all duration-300 ${activeDetail.bgColor}`}>
            <div className="flex flex-col lg:flex-row gap-0">
              {/* 좌측: 이미지 */}
              <div className="lg:w-72 xl:w-80 flex-shrink-0 bg-white flex items-center justify-center p-8" style={{ minHeight: '280px' }}>
                <ImageWithFallback src={activeCat.hero_image_url} alt={activeCat.name_ko} />
              </div>

              {/* 우측: 상세 정보 */}
              <div className="flex-1 p-8 lg:p-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${activeDetail.iconColor} text-white`}>
                      <i className={`${activeDetail.icon} w-3.5 h-3.5 flex items-center justify-center`}></i>
                      {activeDetail.badge}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#1A2B3C] mb-1">
                      {activeCat.name_ko}
                    </h3>
                    <p className={`text-sm font-semibold ${activeDetail.accentColor} mb-4`}>
                      {activeCat.name_en}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white transition-colors cursor-pointer flex-shrink-0 ml-4"
                  >
                    <i className="ri-close-line text-gray-500 text-base"></i>
                  </button>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {activeDetail.detailDesc}
                </p>

                <div className="flex flex-col xl:flex-row gap-6 mb-6">
                  {/* 주요 특징 리스트 */}
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">주요 특징</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeDetail.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${activeDetail.iconColor}`}>
                            <i className="ri-check-line text-white text-[10px]"></i>
                          </div>
                          <span className="text-xs text-gray-700 leading-relaxed">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 스펙 테이블 */}
                  <div className="xl:w-64 flex-shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">주요 사양</p>
                    <div className="bg-white/70 rounded-xl overflow-hidden border border-white">
                      {activeDetail.specTable.map((row, i) => (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 ${i % 2 === 0 ? 'bg-white/50' : ''}`}>
                          <span className="text-[10px] font-bold text-gray-400 w-20 flex-shrink-0 pt-0.5">{row.label}</span>
                          <span className="text-[10px] text-gray-700 leading-relaxed">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/category/${activeCat.id}`}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 whitespace-nowrap cursor-pointer ${activeDetail.iconColor}`}
                  >
                    <i className="ri-eye-line w-4 h-4 flex items-center justify-center"></i>
                    제품 상세 보기
                  </Link>
                  <a
                    href="#mvp-order"
                    onClick={() => {
                      setActiveCategory(null);
                      window.dispatchEvent(new CustomEvent('chipang-category-filter', { detail: activeCat.id }));
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-300 text-gray-700 bg-white hover:border-[#2B5F9E] hover:text-[#2B5F9E] transition-all whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-shopping-cart-line w-4 h-4 flex items-center justify-center"></i>
                    바로 주문하기
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 전체 카테고리 설명 배너 (카드 미선택 시) ── */}
        {!activeCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* 좌측: 픽스쳐 + 어버트먼트 통합 배너 */}
            <div className="rounded-3xl bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF] border border-[#2B5F9E]/10 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#2B5F9E] rounded-xl flex items-center justify-center">
                    <i className="ri-capsule-line text-white text-lg w-5 h-5 flex items-center justify-center"></i>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1A2B3C]">픽스쳐 & 어버트먼트</h4>
                    <p className="text-xs text-[#2B5F9E] font-semibold">Fixture & Abutment</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Bone Level 4종(HS-I, HS-VII, HSN-I, HSN-VII) + Tissue Level 2종(넥스츄어, 넥스츄어7) 픽스쳐와
                  Base / Angled / Multi / Milling 4타입 어버트먼트로 모든 임상 케이스를 완벽히 커버합니다.
                  Internal Hex + 11° Morse Taper 이중 잠금 구조로 Micro-gap을 최소화합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['HS-I', 'HS-VII', 'HSN-I', 'HSN-VII', '넥스츄어', '넥스츄어7'].map((m) => (
                    <span key={m} className="text-[10px] font-bold bg-white text-[#2B5F9E] border border-[#2B5F9E]/20 px-2.5 py-1 rounded-full">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setActiveCategory('fixture')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#2B5F9E] text-white hover:bg-[#3A7BC8] transition-colors whitespace-nowrap cursor-pointer"
                >
                  픽스쳐 보기
                </button>
                <button
                  onClick={() => setActiveCategory('abutment')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-[#2B5F9E]/30 text-[#2B5F9E] bg-white hover:bg-[#2B5F9E]/5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  어버트먼트 보기
                </button>
              </div>
            </div>

            {/* 우측: 스캔바디 + 링크 + 게이지 통합 배너 */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                    <i className="ri-scan-line text-white text-lg w-5 h-5 flex items-center justify-center"></i>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1A2B3C]">스캔바디 · 링크 · 게이지</h4>
                    <p className="text-xs text-slate-500 font-semibold">Scanbody · Link · Gauge & Kit</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  ±10 μm 정밀도의 PEEK 스캔바디(D/B Type), No Cementation 링크 어버트먼트(4종),
                  그리고 ±0.1 mm 정밀 게이지 세트 & 수술 키트까지 디지털 워크플로우를 원스톱으로 완성합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['D Type', 'B Type', 'Long', 'Short', 'Angled', 'Gauge Set', 'Bone Kit'].map((m) => (
                    <span key={m} className="text-[10px] font-bold bg-white text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setActiveCategory('scanbody')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-700 text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                >
                  스캔바디 보기
                </button>
                <button
                  onClick={() => setActiveCategory('link')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  링크 보기
                </button>
                <button
                  onClick={() => setActiveCategory('gauge-kit')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  게이지 보기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 하단 CTA ── */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            카드를 클릭하면 각 카테고리의 상세 정보를 확인할 수 있습니다.
          </p>
          <a
            href="#mvp-order"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1A2B3C] text-white rounded-2xl text-sm font-bold hover:bg-[#2B5F9E] transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap cursor-pointer"
          >
            <i className="ri-shopping-bag-3-line text-lg w-5 h-5 flex items-center justify-center"></i>
            지금 바로 주문하기
            <i className="ri-arrow-down-line text-base w-4 h-4 flex items-center justify-center"></i>
          </a>
        </div>
      </div>
    </section>
  );
}