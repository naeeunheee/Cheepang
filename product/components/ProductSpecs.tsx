import { useState } from 'react';
import type { HignessProduct } from '../../../mocks/highness-catalog';

interface ProductSpecsProps {
  product: HignessProduct;
}

interface DrillStep {
  step: number;
  name: string;
  diameter: string;
  depth: string;
  speed: string;
  description: string;
  icon: string;
}

const drillSequences: Record<string, DrillStep[]> = {
  'fx-bl-001': [
    { step: 1, name: '파일럿 드릴', diameter: 'Ø2.0mm', depth: '식립 깊이 + 1mm', speed: '800-1200 RPM', description: '초기 천공 및 방향 설정', icon: 'ri-arrow-down-circle-line' },
    { step: 2, name: '확장 드릴 1', diameter: 'Ø2.8mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '1차 확장 (Ø3.5 이상 사용 시)', icon: 'ri-arrow-down-circle-line' },
    { step: 3, name: '확장 드릴 2', diameter: 'Ø3.2mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '2차 확장 (Ø4.0 이상 사용 시)', icon: 'ri-arrow-down-circle-line' },
    { step: 4, name: '최종 드릴', diameter: '직경별 상이', depth: '식립 깊이', speed: '800-1200 RPM', description: '최종 직경 형성', icon: 'ri-checkbox-circle-line' },
    { step: 5, name: '탭핑 (선택)', diameter: '해당 직경', depth: '식립 깊이', speed: '15-25 RPM', description: '나사산 형성', icon: 'ri-settings-3-line' },
    { step: 6, name: '임플란트 식립', diameter: '선택 직경', depth: '계획 깊이', speed: '15-35 RPM', description: '최종 식립', icon: 'ri-check-double-line' },
  ],
  'fx-bl-007': [
    { step: 1, name: '파일럿 드릴', diameter: 'Ø2.0mm', depth: '식립 깊이 + 1mm', speed: '800-1200 RPM', description: '초기 천공 및 방향 설정', icon: 'ri-arrow-down-circle-line' },
    { step: 2, name: '확장 드릴 1', diameter: 'Ø2.8mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '1차 확장', icon: 'ri-arrow-down-circle-line' },
    { step: 3, name: '확장 드릴 2', diameter: 'Ø3.2mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '2차 확장 (Ø4.0 이상 사용 시)', icon: 'ri-arrow-down-circle-line' },
    { step: 4, name: '최종 드릴', diameter: '직경별 상이', depth: '식립 깊이', speed: '800-1200 RPM', description: '최종 직경 형성 (Root Type)', icon: 'ri-checkbox-circle-line' },
    { step: 5, name: '탭핑 (선택)', diameter: '해당 직경', depth: '식립 깊이', speed: '15-25 RPM', description: '나사산 형성', icon: 'ri-settings-3-line' },
    { step: 6, name: '임플란트 식립', diameter: '선택 직경', depth: '계획 깊이', speed: '15-35 RPM', description: '최종 식립 (Root Type 형상)', icon: 'ri-check-double-line' },
  ],
  'fx-bl-hsn1': [
    { step: 1, name: '파일럿 드릴', diameter: 'Ø2.0mm', depth: '식립 깊이 + 1mm', speed: '800-1200 RPM', description: '초기 천공 및 방향 설정', icon: 'ri-arrow-down-circle-line' },
    { step: 2, name: '확장 드릴 1', diameter: 'Ø2.8mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '1차 확장', icon: 'ri-arrow-down-circle-line' },
    { step: 3, name: '확장 드릴 2', diameter: 'Ø3.2mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '2차 확장 (Ø4.0 이상 사용 시)', icon: 'ri-arrow-down-circle-line' },
    { step: 4, name: '최종 드릴', diameter: '직경별 상이', depth: '식립 깊이', speed: '800-1200 RPM', description: '최종 직경 형성 (HSN 표면)', icon: 'ri-checkbox-circle-line' },
    { step: 5, name: '탭핑 (선택)', diameter: '해당 직경', depth: '식립 깊이', speed: '15-25 RPM', description: '나사산 형성', icon: 'ri-settings-3-line' },
    { step: 6, name: '임플란트 식립', diameter: '선택 직경', depth: '계획 깊이', speed: '15-35 RPM', description: '최종 식립 (HSN 표면처리)', icon: 'ri-check-double-line' },
  ],
  'fx-bl-hsn7': [
    { step: 1, name: '파일럿 드릴', diameter: 'Ø2.0mm', depth: '식립 깊이 + 1mm', speed: '800-1200 RPM', description: '초기 천공 및 방향 설정', icon: 'ri-arrow-down-circle-line' },
    { step: 2, name: '확장 드릴 1', diameter: 'Ø2.8mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '1차 확장', icon: 'ri-arrow-down-circle-line' },
    { step: 3, name: '확장 드릴 2', diameter: 'Ø3.2mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '2차 확장 (Ø4.0 이상 사용 시)', icon: 'ri-arrow-down-circle-line' },
    { step: 4, name: '최종 드릴', diameter: '직경별 상이', depth: '식립 깊이', speed: '800-1200 RPM', description: '최종 직경 형성 (HSN Root Type)', icon: 'ri-checkbox-circle-line' },
    { step: 5, name: '카운터싱크', diameter: '해당 직경', depth: 'Neck 높이', speed: '800-1200 RPM', description: 'Tissue Level용 상부 확장', icon: 'ri-contrast-drop-2-line' },
    { step: 6, name: '임플란트 식립', diameter: '선택 직경', depth: '계획 깊이', speed: '15-35 RPM', description: '최종 식립 (HSN Root Type)', icon: 'ri-check-double-line' },
  ],
  'fx-nx-001': [
    { step: 1, name: '파일럿 드릴', diameter: 'Ø2.0mm', depth: '식립 깊이 + 1mm', speed: '800-1200 RPM', description: '초기 천공 및 방향 설정', icon: 'ri-arrow-down-circle-line' },
    { step: 2, name: '확장 드릴 1', diameter: 'Ø2.8mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '1차 확장', icon: 'ri-arrow-down-circle-line' },
    { step: 3, name: '확장 드릴 2', diameter: 'Ø3.2mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '2차 확장 (Ø4.0 이상 사용 시)', icon: 'ri-arrow-down-circle-line' },
    { step: 4, name: '최종 드릴', diameter: '직경별 상이', depth: '식립 깊이', speed: '800-1200 RPM', description: '최종 직경 형성 (Tissue Level)', icon: 'ri-checkbox-circle-line' },
    { step: 5, name: '카운터싱크', diameter: '해당 직경', depth: 'Neck 높이', speed: '800-1200 RPM', description: 'Tissue Level용 상부 확장', icon: 'ri-contrast-drop-2-line' },
    { step: 6, name: '임플란트 식립', diameter: '선택 직경', depth: '계획 깊이', speed: '15-35 RPM', description: '최종 식립 (Tissue Level)', icon: 'ri-check-double-line' },
  ],
  'fx-nx-007': [
    { step: 1, name: '파일럿 드릴', diameter: 'Ø2.0mm', depth: '식립 깊이 + 1mm', speed: '800-1200 RPM', description: '초기 천공 및 방향 설정', icon: 'ri-arrow-down-circle-line' },
    { step: 2, name: '확장 드릴 1', diameter: 'Ø2.8mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '1차 확장', icon: 'ri-arrow-down-circle-line' },
    { step: 3, name: '확장 드릴 2', diameter: 'Ø3.2mm', depth: '식립 깊이', speed: '800-1200 RPM', description: '2차 확장 (Ø4.0 이상 사용 시)', icon: 'ri-arrow-down-circle-line' },
    { step: 4, name: '최종 드릴', diameter: '직경별 상이', depth: '식립 깊이', speed: '800-1200 RPM', description: '최종 직경 형성 (Root Type Tissue Level)', icon: 'ri-checkbox-circle-line' },
    { step: 5, name: '카운터싱크', diameter: '해당 직경', depth: 'Neck 높이', speed: '800-1200 RPM', description: 'Tissue Level용 상부 확장', icon: 'ri-contrast-drop-2-line' },
    { step: 6, name: '임플란트 식립', diameter: '선택 직경', depth: '계획 깊이', speed: '15-35 RPM', description: '최종 식립 (Root Type Tissue Level)', icon: 'ri-check-double-line' },
  ],
};

export default function ProductSpecs({ product }: ProductSpecsProps) {
  const [activeTab, setActiveTab] = useState('specs');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isFixture = product.category_id === 'fixture';
  const drillSteps = drillSequences[product.id] || [];
  const hasSpecImages = product.spec_image_urls && product.spec_image_urls.length > 0;

  const tabs = [
    { id: 'specs', label: '기술 사양', icon: 'ri-file-list-3-line' },
    { id: 'features', label: '주요 특징', icon: 'ri-star-line' },
    ...(hasSpecImages ? [{ id: 'spec-images', label: '규격표', icon: 'ri-image-line' }] : []),
    ...(isFixture && drillSteps.length > 0 ? [{ id: 'drill-sequence', label: '드릴 시퀀스', icon: 'ri-surgical-mask-line' }] : []),
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-[#2B5F9E] border-b-2 border-[#2B5F9E] bg-blue-50/40'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <i className={`${tab.icon} text-base w-4 h-4 flex items-center justify-center`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">

            {/* ── 기술 사양 탭 ── */}
            {activeTab === 'specs' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1A2B3C] mb-4">기술 사양</h3>
                  {product.specs && product.specs.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <tbody>
                          {product.specs.map((spec, i) => (
                            <tr
                              key={i}
                              className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                            >
                              <td className="px-5 py-3.5 font-semibold text-gray-500 w-40 whitespace-nowrap">
                                {spec.label}
                              </td>
                              <td className="px-5 py-3.5 text-[#1A2B3C] font-medium">
                                {spec.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">사양 정보가 없습니다.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── 주요 특징 탭 ── */}
            {activeTab === 'features' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#1A2B3C] mb-4">주요 특징</h3>
                {product.features && product.features.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-4"
                      >
                        <div className="flex-shrink-0 w-7 h-7 bg-[#2B5F9E] text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{feature}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">특징 정보가 없습니다.</p>
                )}
              </div>
            )}

            {/* ── 규격표 탭 (이미지만 표시) ── */}
            {activeTab === 'spec-images' && hasSpecImages && product.spec_image_urls && (
              <div className="space-y-6">
                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-xl font-bold text-[#1A2B3C]">제품 규격표</h3>
                  <p className="text-sm text-gray-500">이미지를 클릭하면 크게 볼 수 있습니다</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.spec_image_urls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="group relative bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-[#2B5F9E] hover:shadow-xl transition-all duration-300 cursor-pointer aspect-[4/3] flex items-center justify-center p-6"
                    >
                      <img
                        src={url}
                        alt={`${product.name_ko} 규격표 ${i + 1}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = 'none';
                          const parent = el.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex flex-col items-center justify-center text-gray-300 w-full h-full"><i class="ri-image-line text-5xl mb-3"></i><span class="text-sm">이미지 로딩 실패</span></div>';
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-semibold text-[#2B5F9E] flex items-center gap-2 shadow-lg">
                          <i className="ri-zoom-in-line w-4 h-4 flex items-center justify-center"></i>
                          확대 보기
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 드릴 시퀀스 탭 ── */}
            {activeTab === 'drill-sequence' && isFixture && drillSteps.length > 0 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-[#1A2B3C]">수술 순서 가이드</h3>
                  <p className="text-gray-500 text-sm">{product.name_ko} 모델의 권장 드릴 시퀀스입니다</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <i className="ri-error-warning-line text-amber-500 text-xl flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center"></i>
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">수술 전 확인사항</p>
                    <ul className="space-y-1 list-disc list-inside text-amber-700">
                      <li>골질(D1-D4)에 따라 드릴 시퀀스를 조정하세요</li>
                      <li>충분한 생리식염수 냉각을 유지하세요</li>
                      <li>드릴 회전 속도와 압력을 준수하세요</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  {drillSteps.map((step, index) => (
                    <div key={step.step} className="relative">
                      {index < drillSteps.length - 1 && (
                        <div className="absolute left-8 top-full w-0.5 h-3 bg-[#2B5F9E]/20 z-10"></div>
                      )}
                      <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-14 h-14 bg-[#2B5F9E] text-white rounded-full flex items-center justify-center font-bold text-lg shadow">
                            {step.step}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <i className={`${step.icon} text-xl text-[#2B5F9E] w-5 h-5 flex items-center justify-center`}></i>
                              <h4 className="text-base font-bold text-[#1A2B3C]">{step.name}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{step.description}</p>
                            <div className="grid grid-cols-3 gap-3 pt-1">
                              <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                                <div className="text-[10px] text-gray-400 uppercase mb-0.5">직경</div>
                                <div className="text-xs font-semibold text-[#1A2B3C]">{step.diameter}</div>
                              </div>
                              <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                                <div className="text-[10px] text-gray-400 uppercase mb-0.5">깊이</div>
                                <div className="text-xs font-semibold text-[#1A2B3C]">{step.depth}</div>
                              </div>
                              <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                                <div className="text-[10px] text-gray-400 uppercase mb-0.5">속도</div>
                                <div className="text-xs font-semibold text-[#1A2B3C]">{step.speed}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#EEF2F8] border border-[#2B5F9E]/20 rounded-xl p-4 flex gap-3">
                  <i className="ri-information-line text-[#2B5F9E] text-xl flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center"></i>
                  <div className="text-sm text-[#1A2B3C]">
                    <p className="font-semibold mb-1">추가 안내</p>
                    <ul className="space-y-1 list-disc list-inside text-gray-600">
                      <li>골질이 단단한 경우(D1-D2) 탭핑을 권장합니다</li>
                      <li>골질이 무른 경우(D3-D4) 탭핑을 생략할 수 있습니다</li>
                      <li>최종 식립 시 35Ncm 이상의 초기 고정력을 확보하세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 라이트박스 (확대 보기) */}
      {lightboxIndex !== null && hasSpecImages && product.spec_image_urls && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-5xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <i className="ri-image-line text-[#2B5F9E] text-xl w-5 h-5 flex items-center justify-center"></i>
                <span className="text-base font-bold text-[#1A2B3C]">
                  {product.name_ko} 규격표
                </span>
                <span className="text-sm text-gray-400 font-medium">
                  {lightboxIndex + 1} / {product.spec_image_urls.length}
                </span>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-gray-600 text-xl w-5 h-5 flex items-center justify-center"></i>
              </button>
            </div>
            <div className="p-8 flex items-center justify-center bg-gray-50 min-h-[500px] max-h-[70vh]">
              <img
                src={product.spec_image_urls[lightboxIndex]}
                alt={`${product.name_ko} 규격표 ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {product.spec_image_urls.length > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                <button
                  onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : product.spec_image_urls!.length - 1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center"></i>
                  이전
                </button>
                <div className="flex gap-2">
                  {product.spec_image_urls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${i === lightboxIndex ? 'bg-[#2B5F9E] w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setLightboxIndex((prev) => (prev !== null && prev < product.spec_image_urls!.length - 1 ? prev + 1 : 0))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  다음
                  <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
