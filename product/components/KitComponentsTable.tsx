
import { useState } from 'react';
import type { HignessProduct, KitComponent } from '../../../mocks/highness-catalog';

interface KitComponentsTableProps {
  product: HignessProduct;
}

export default function KitComponentsTable({ product }: KitComponentsTableProps) {
  const components = product.kit_components ?? [];
  const hasSimpleFullOption =
    product.kit_price_simple !== undefined && product.kit_price_full !== undefined;
  const [selectedOption, setSelectedOption] = useState<'simple' | 'full'>('simple');

  if (components.length === 0) return null;

  const filteredComponents = hasSimpleFullOption
    ? components.filter((c) => {
        if (!c.included_in) return true;
        return c.included_in.includes('all') || c.included_in.includes(selectedOption);
      })
    : components;

  const currentPrice = hasSimpleFullOption
    ? selectedOption === 'full'
      ? product.kit_price_full ?? product.base_price
      : product.kit_price_simple ?? product.base_price
    : product.base_price;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-[#D68910]/10 text-[#D68910] text-xs font-bold px-4 py-1.5 rounded-full mb-3 uppercase tracking-wide">
            <i className="ri-box-3-line w-4 h-4 flex items-center justify-center"></i>
            Kit Components
          </span>
          <h2 className="text-2xl font-bold text-[#1A2B3C] mb-2">구성품 상세</h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            {product.name_ko}에 포함된 모든 구성품을 확인하세요.
          </p>
        </div>

        {/* Simple / Full 옵션 선택 */}
        {hasSimpleFullOption && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedOption('simple')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedOption === 'simple'
                  ? 'bg-[#1A2B3C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1A2B3C]'
              }`}
            >
              <i className="ri-checkbox-circle-line w-4 h-4 flex items-center justify-center"></i>
              Simple Kit
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedOption === 'simple' ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                ₩{(product.kit_price_simple ?? 0).toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => setSelectedOption('full')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedOption === 'full'
                  ? 'bg-[#2B5F9E] text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#2B5F9E]'
              }`}
            >
              <i className="ri-vip-crown-line w-4 h-4 flex items-center justify-center"></i>
              Full Kit
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedOption === 'full' ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                ₩{(product.kit_price_full ?? 0).toLocaleString()}
              </span>
            </button>
          </div>
        )}

        {/* 가격 배너 */}
        <div className="bg-gradient-to-r from-[#1A2B3C] to-[#2B5F9E] rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <i className="ri-price-tag-3-line text-white text-2xl w-7 h-7 flex items-center justify-center"></i>
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                {hasSimpleFullOption
                  ? selectedOption === 'full'
                    ? 'Full Kit 가격'
                    : 'Simple Kit 가격'
                  : '키트 가격'}
              </p>
              <p className="text-white text-2xl font-extrabold">
                ₩{currentPrice.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              {filteredComponents.length}종 구성
            </span>
            {hasSimpleFullOption && selectedOption === 'full' && (
              <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg">
                프리미엄
              </span>
            )}
          </div>
        </div>

        {/* 구성품 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              No.
            </div>
            <div className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              이미지
            </div>
            <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              구성품명
            </div>
            <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              코드
            </div>
            <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              수량
            </div>
            <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              비고
            </div>
          </div>

          {/* 테이블 바디 */}
          <div className="divide-y divide-gray-100">
            {filteredComponents.map((comp, i) => (
              <KitComponentRow
                key={`${comp.code}-${i}`}
                component={comp}
                index={i}
                isFullOnly={
                  hasSimpleFullOption &&
                  comp.included_in !== undefined &&
                  !comp.included_in.includes('all') &&
                  !comp.included_in.includes('simple') &&
                  comp.included_in.includes('full')
                }
              />
            ))}
          </div>

          {/* 테이블 푸터 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ri-information-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                <span className="text-xs text-gray-500">
                  총{' '}
                  <strong className="text-[#1A2B3C]">{filteredComponents.length}종</strong>{' '}
                  구성품 포함
                </span>
              </div>
              {hasSimpleFullOption && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[10px] text-gray-500">Simple 포함</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2B5F9E]"></div>
                    <span className="text-[10px] text-gray-500">Full 전용</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 멸균 안내 */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            <i className="ri-shield-check-line w-4 h-4 flex items-center justify-center"></i>
            멸균 및 관리 안내
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-amber-700">
              <i className="ri-check-line mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
              오토클레이브 멸균: 134°C, 3bar, 18분 권장
            </li>
            <li className="flex items-start gap-2 text-sm text-amber-700">
              <i className="ri-check-line mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
              사용 전 초음파 세척 후 멸균 진행
            </li>
            <li className="flex items-start gap-2 text-sm text-amber-700">
              <i className="ri-check-line mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
              전용 케이스에 보관하여 기구 손상 방지
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function KitComponentRow({
  component,
  index,
  isFullOnly,
}: {
  component: KitComponent;
  index: number;
  isFullOnly: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-gray-50/50 transition-colors items-center">
      {/* No */}
      <div className="hidden md:flex col-span-1 items-center">
        <span className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg text-xs font-bold text-gray-500">
          {index + 1}
        </span>
      </div>

      {/* 이미지 */}
      <div className="hidden md:flex col-span-1 items-center justify-center">
        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
          {component.image_url && !imgError ? (
            <img
              src={component.image_url}
              alt={component.name}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <i className="ri-image-line text-gray-300 text-lg"></i>
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="md:hidden flex items-center gap-3">
        <span className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg text-xs font-bold text-gray-500 flex-shrink-0">
          {index + 1}
        </span>
        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
          {component.image_url && !imgError ? (
            <img
              src={component.image_url}
              alt={component.name}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <i className="ri-image-line text-gray-300"></i>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-[#1A2B3C] truncate">{component.name}</p>
            {isFullOnly && (
              <span className="bg-[#2B5F9E]/10 text-[#2B5F9E] text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                FULL
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-mono">{component.code}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">{component.qty_desc}</span>
            <span className="text-[10px] text-gray-400">{component.note}</span>
          </div>
        </div>
      </div>

      {/* 데스크탑: 구성품명 */}
      <div className="hidden md:flex col-span-3 items-center gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-[#1A2B3C]">{component.name}</p>
            {isFullOnly && (
              <span className="bg-[#2B5F9E]/10 text-[#2B5F9E] text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                FULL
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 코드 */}
      <div className="hidden md:flex col-span-2 items-center">
        <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2.5 py-1 rounded-lg">
          {component.code}
        </span>
      </div>

      {/* 수량 */}
      <div className="hidden md:flex col-span-2 items-center">
        <span className="text-sm text-gray-700">{component.qty_desc}</span>
      </div>

      {/* 비고 */}
      <div className="hidden md:flex col-span-3 items-center">
        <span className="text-xs text-gray-500">{component.note}</span>
      </div>
    </div>
  );
}
