
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HignessProduct } from '../../../mocks/highness-catalog';
import { highnessCategories } from '../../../mocks/highness-catalog';

interface ScanbodyShowcaseProps {
  products: HignessProduct[];
}

const TYPE_INFO: Record<string, {
  badge: string;
  badgeColor: string;
  accentColor: string;
  bgGradient: string;
  tagBg: string;
  tagText: string;
  borderColor: string;
  highlight: string;
  usageTitle: string;
  usageDesc: string;
  usageIcon: string;
}> = {
  'sb-003': {
    badge: 'D Type',
    badgeColor: 'bg-[#1A2B3C] text-white',
    accentColor: 'text-[#1A2B3C]',
    bgGradient: 'from-[#EEF2F8] to-white',
    tagBg: 'bg-[#1A2B3C]/8',
    tagText: 'text-[#1A2B3C]',
    borderColor: 'border-[#1A2B3C]/15',
    highlight: 'bg-[#1A2B3C]',
    usageTitle: 'Direct 체결 방식',
    usageDesc: '픽스쳐에 직접 체결하여 사용하는 표준형 스캔바디입니다.',
    usageIcon: 'ri-focus-3-line',
  },
  'sb-004': {
    badge: 'B Type',
    badgeColor: 'bg-[#2B5F9E] text-white',
    accentColor: 'text-[#2B5F9E]',
    bgGradient: 'from-[#EEF5FF] to-white',
    tagBg: 'bg-[#2B5F9E]/8',
    tagText: 'text-[#2B5F9E]',
    borderColor: 'border-[#2B5F9E]/15',
    highlight: 'bg-[#2B5F9E]',
    usageTitle: 'Base Abutment 전용',
    usageDesc: 'Base Abutment 체결 후 사용하는 전용 스캔바디입니다.',
    usageIcon: 'ri-links-line',
  },
};

function ScanbodyCard({ product }: { product: HignessProduct }) {
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'specs' | 'options'>('features');
  const info = TYPE_INFO[product.id] ?? TYPE_INFO['sb-003'];

  return (
    <div className={`bg-gradient-to-br ${info.bgGradient} rounded-3xl border ${info.borderColor} overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col`}>
      {/* 상단 헤더 */}
      <div className="px-8 pt-8 pb-0 flex items-start justify-between">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${info.badgeColor} mb-3`}>
            <i className="ri-scan-line text-xs" />
            {info.badge}
          </span>
          <h2 className={`text-2xl font-extrabold ${info.accentColor} leading-tight`}>
            {product.name_ko}
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">{product.model_code}</p>
        </div>
        <div className={`w-10 h-10 flex items-center justify-center rounded-2xl ${info.highlight} shadow-lg`}>
          <i className={`${info.usageIcon} text-white text-lg`} />
        </div>
      </div>

      {/* 제품 이미지 */}
      <div className="relative mx-8 mt-6 mb-0 h-64 flex items-center justify-center bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #1A2B3C 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {!imageError ? (
          <img
            src={product.image_url}
            alt={product.name_ko}
            className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300">
            <i className="ri-image-line text-5xl mb-2" />
            <span className="text-xs text-gray-400">이미지 준비중</span>
          </div>
        )}
        {/* 모델 코드 워터마크 */}
        <span className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-300 font-mono">
          {product.model_code}
        </span>
      </div>

      {/* 사용 방식 배너 */}
      <div className={`mx-8 mt-4 px-4 py-3 rounded-xl ${info.tagBg} border ${info.borderColor} flex items-center gap-3`}>
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${info.highlight}`}>
          <i className={`${info.usageIcon} text-white text-sm`} />
        </div>
        <div>
          <p className={`text-xs font-bold ${info.accentColor}`}>{info.usageTitle}</p>
          <p className="text-[11px] text-gray-500 leading-snug">{info.usageDesc}</p>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="px-8 mt-5 flex-1 flex flex-col">
        {/* 탭 버튼 */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {(['features', 'specs', 'options'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-[#1A2B3C] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'features' ? '특징' : tab === 'specs' ? '규격' : '옵션'}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="flex-1 min-h-[140px]">
          {activeTab === 'features' && (
            <ul className="space-y-2.5">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 flex items-center justify-center rounded-full ${info.highlight} flex-shrink-0 mt-0.5`}>
                    <i className="ri-check-line text-white text-[10px]" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{f}</p>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-2">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-[11px] font-semibold text-gray-500 w-24 flex-shrink-0">{spec.label}</span>
                  <span className="text-[11px] text-gray-700 leading-snug">{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-3">
              {product.options.map((opt) => (
                <div key={opt.label}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">{opt.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {opt.values.map((v) => (
                      <span
                        key={v}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${info.tagBg} ${info.accentColor} border ${info.borderColor}`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-8 pb-8 pt-5 flex gap-3 mt-auto">
        {product.detail_page_id ? (
          <Link
            to={`/product/${product.detail_page_id}`}
            className={`flex-1 py-3 rounded-xl text-sm font-bold ${info.highlight} text-white hover:opacity-90 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 shadow-md`}
          >
            <i className="ri-file-list-3-line text-base" />
            상세보기
          </Link>
        ) : (
          <div className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 whitespace-nowrap flex items-center justify-center gap-2 cursor-not-allowed">
            준비중
          </div>
        )}
        <Link
          to="/#mvp-order"
          className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 ${info.borderColor} ${info.accentColor} hover:${info.highlight} transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2`}
          style={{ borderColor: product.id === 'sb-003' ? '#1A2B3C' : '#2B5F9E' }}
        >
          <i className="ri-shopping-cart-line text-base" />
          주문하기
        </Link>
      </div>
    </div>
  );
}

export default function ScanbodyShowcase({ products }: ScanbodyShowcaseProps) {
  return (
    <div className="bg-[#F4F7FB]">
      {/* 인트로 섹션 */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-[#EEF2F8] text-[#2B5F9E] px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <i className="ri-scan-line" />
              Digital Scanbody System
            </span>
            <h2 className="text-3xl font-extrabold text-[#1A2B3C] mb-3">
              2가지 타입으로 모든 케이스 대응
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
              하이니스 디지털 스캔바디는 <strong>D Type</strong>과 <strong>B Type</strong> 두 가지로 구성되어
              픽스쳐 직결 방식과 Base Abutment 방식 모두를 지원합니다.
            </p>
          </div>

          {/* 비교 요약 배너 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: 'ri-scan-2-line', title: '라이브러리 자동 매칭', desc: 'Oral Scanner 스캔 시 라이브러리와 정확히 매칭' },
              { icon: 'ri-ruler-2-line', title: '다양한 사이즈', desc: '3.5 ~ 5.0mm 직경, 10 / 12mm 높이 옵션' },
              { icon: 'ri-exchange-line', title: '인상 채득 겸용', desc: '러버임프레션 시 Transfer Impression Coping으로 활용 가능' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-[#F4F7FB] rounded-2xl p-4 border border-gray-100">
                <div className="w-9 h-9 flex items-center justify-center bg-[#2B5F9E]/10 rounded-xl flex-shrink-0">
                  <i className={`${item.icon} text-[#2B5F9E] text-base`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A2B3C] mb-0.5">{item.title}</p>
                  <p className="text-[11px] text-gray-500 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 제품 카드 2열 쇼케이스 */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-6">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {products.map((product) => (
                <ScanbodyCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <i className="ri-search-line text-2xl text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">제품을 찾을 수 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* 타입 선택 가이드 */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-lg font-extrabold text-[#1A2B3C] text-center mb-8">어떤 타입을 선택해야 할까요?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#EEF2F8] rounded-2xl p-6 border border-[#1A2B3C]/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#1A2B3C] rounded-xl">
                  <i className="ri-focus-3-line text-white text-lg" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#1A2B3C]">D Type 선택 시</p>
                  <p className="text-[11px] text-gray-500">HN-DSB-D</p>
                </div>
              </div>
              <ul className="space-y-2">
                {['픽스쳐에 직접 스캔바디를 체결하는 경우', 'Base Abutment 없이 직결 방식으로 진행하는 케이스', 'Transfer Impression Coping으로도 활용하고 싶은 경우'].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-gray-600">
                    <i className="ri-arrow-right-s-line text-[#1A2B3C] mt-0.5 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#EEF5FF] rounded-2xl p-6 border border-[#2B5F9E]/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#2B5F9E] rounded-xl">
                  <i className="ri-links-line text-white text-lg" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#2B5F9E]">B Type 선택 시</p>
                  <p className="text-[11px] text-gray-500">HN-DSB-B</p>
                </div>
              </div>
              <ul className="space-y-2">
                {['Base Abutment(HN-BA)를 이미 체결한 상태에서 스캔하는 경우', 'Base Abutment 위에서 정확한 디지털 인상을 채득해야 하는 케이스', 'Soft Tissue Sealing을 유지하면서 스캔이 필요한 경우'].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-gray-600">
                    <i className="ri-arrow-right-s-line text-[#2B5F9E] mt-0.5 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 다른 카테고리 바로가기 */}
      <section className="py-12 bg-[#F4F7FB]">
        <div className="max-w-7xl mx-auto px-6">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">
            다른 카테고리 보기
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...highnessCategories]
              .sort((a, b) => a.sort_order - b.sort_order)
              .filter((cat) => cat.id !== 'scanbody')
              .map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group border border-gray-100 hover:border-[#2B5F9E]/30"
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-[#F4F7FB] rounded-xl overflow-hidden">
                    <img
                      src={cat.hero_image_url}
                      alt={cat.name_ko}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-mono mb-0.5 truncate">{cat.name_en}</p>
                    <p className="text-sm font-bold text-[#1A2B3C] group-hover:text-[#2B5F9E] transition-colors truncate">
                      {cat.name_ko}
                    </p>
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center ml-auto shrink-0">
                    <i className="ri-arrow-right-line text-gray-300 group-hover:text-[#2B5F9E] transition-colors" />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
