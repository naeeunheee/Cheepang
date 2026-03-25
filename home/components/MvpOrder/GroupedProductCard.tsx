import { useState, useMemo } from 'react';
import { HignessProduct } from '../../../../mocks/highness-catalog';
import type { ProductOption } from '../../../../hooks/useProducts';

interface GroupedProductCardProps {
  groupName: string;
  products: HignessProduct[];
  onBulkAddToCart: (items: {
    product: HignessProduct;
    quantity: number;
    unitPrice: number;
    selectedOptionId?: string;
    selectedOptionModelCode?: string;
    sizeInfo?: string;
  }[]) => void;
  prices: Record<string, number>;
  consumerPrices?: Record<string, number>;
  isLoggedIn?: boolean;
  clientPackageTier?: string | null;
  productOptions: Record<string, ProductOption[]>;
  isAdmin?: boolean;
  adminPrice?: number;
}

export default function GroupedProductCard({
  groupName,
  products,
  onBulkAddToCart,
  prices,
  consumerPrices,
  isLoggedIn,
  clientPackageTier,
  productOptions,
  isAdmin,
  adminPrice,
}: GroupedProductCardProps) {
  const representativeProduct = products[0];

  const options: ProductOption[] = useMemo(() => {
    return productOptions[representativeProduct.id] ?? [];
  }, [productOptions, representativeProduct.id]);

  const sortedOptions: ProductOption[] = useMemo(() => {
    const extractDiameter = (label: string): number => {
      const oMatch = label.match(/[Øø]\s*([\d.]+)/);
      if (oMatch) return parseFloat(oMatch[1]);
      const numMatch = label.match(/^[\s\[\(]*[\d.]+/);
      if (numMatch) return parseFloat(numMatch[0].replace(/[^\d.]/g, ''));
      return 0;
    };

    return [...options].sort((a, b) => {
      const labelA = a.size_info || a.model_code || '';
      const labelB = b.size_info || b.model_code || '';
      const diamA = extractDiameter(labelA);
      const diamB = extractDiameter(labelB);
      if (diamA !== diamB) return diamA - diamB;
      return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [options]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDimension1, setSelectedDimension1] = useState<string | null>(null);
  const [selectedDimension2, setSelectedDimension2] = useState<string | null>(null);
  const [selectedDimension3, setSelectedDimension3] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const hasOptions = options.length > 0;
  const unitPrice = prices[representativeProduct.id] ?? representativeProduct.base_price ?? 0;
  const consumerPrice = consumerPrices?.[representativeProduct.id];
  // 로그인 + 패키지 등급 있으면 무조건 패키지 단가 표시
  const hasPackagePrice = isLoggedIn && !!clientPackageTier;

  const handlePhoneConsult = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = 'tel:010-8950-3379';
    } else {
      window.open('tel:010-8950-3379');
    }
  };

  const dimensionData = useMemo(() => {
    if (sortedOptions.length === 0) return null;

    const parsedOptions = sortedOptions.map(opt => {
      const sizeText = (opt.size_info || opt.model_code || '').trim();
      if (sizeText.includes('*')) {
        const parts = sizeText.split('*').map((p: string) => p.trim());
        // split 결과 중 빈 문자열이 있어도 원문 그대로 유지 (filter 금지)
        const dimensions = parts.length > 0 ? parts : [sizeText];
        return { product: opt, dimensions, fullText: sizeText };
      } else {
        // *가 없으면 통째로 1단계 단추 하나로
        return { product: opt, dimensions: [sizeText || opt.model_code || ''], fullText: sizeText };
      }
    });

    const maxDimensions = Math.max(...parsedOptions.map(p => p.dimensions.length));

    const dimension1Set = new Set(parsedOptions.map(p => p.dimensions[0]));
    const dimension1List = Array.from(dimension1Set).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    return { maxDimensions, parsedOptions, dimension1List };
  }, [sortedOptions]);

  const dimension2List = useMemo(() => {
    if (!dimensionData || !selectedDimension1) return [];
    const filtered = dimensionData.parsedOptions.filter(p => p.dimensions[0] === selectedDimension1);
    const set = new Set(filtered.map(p => p.dimensions[1]).filter(Boolean));
    return Array.from(set).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
      return numA - numB;
    });
  }, [dimensionData, selectedDimension1]);

  const dimension3List = useMemo(() => {
    if (!dimensionData || dimensionData.maxDimensions < 3 || !selectedDimension1 || !selectedDimension2) return [];
    const filtered = dimensionData.parsedOptions.filter(
      p => p.dimensions[0] === selectedDimension1 && p.dimensions[1] === selectedDimension2
    );
    const set = new Set(filtered.map(p => p.dimensions[2]).filter(Boolean));
    return Array.from(set).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
      return numA - numB;
    });
  }, [dimensionData, selectedDimension1, selectedDimension2]);

  const selectedProduct = useMemo(() => {
    if (!dimensionData || !selectedDimension1) return null;
    const required = dimensionData.maxDimensions;

    // 1단계: *가 없는 단일 텍스트 → 직경 선택만으로 즉시 확정
    if (required === 1) {
      return dimensionData.parsedOptions.find(
        p => p.dimensions[0] === selectedDimension1
      )?.product || null;
    }
    // 2단계
    if (required === 2 && selectedDimension2) {
      return dimensionData.parsedOptions.find(
        p => p.dimensions[0] === selectedDimension1 && p.dimensions[1] === selectedDimension2
      )?.product || null;
    }
    // 3단계 이상
    if (required >= 3 && selectedDimension2 && selectedDimension3) {
      return dimensionData.parsedOptions.find(
        p => p.dimensions[0] === selectedDimension1 &&
             p.dimensions[1] === selectedDimension2 &&
             p.dimensions[2] === selectedDimension3
      )?.product || null;
    }
    return null;
  }, [dimensionData, selectedDimension1, selectedDimension2, selectedDimension3]);

  const handleDimension1Change = (value: string) => {
    setSelectedDimension1(value);
    setSelectedDimension2(null);
    setSelectedDimension3(null);
  };

  const handleDimension2Change = (value: string) => {
    setSelectedDimension2(value);
    setSelectedDimension3(null);
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      onBulkAddToCart([{
        product: representativeProduct,
        quantity,
        unitPrice,
        selectedOptionId: selectedProduct.id,
        selectedOptionModelCode: selectedProduct.model_code,
        sizeInfo: selectedProduct.size_info,
      }]);
      setSelectedDimension1(null);
      setSelectedDimension2(null);
      setSelectedDimension3(null);
      setIsExpanded(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    }
  };

  /* ── 공통 Chip 버튼 스타일 ── */
  const chipBase = 'px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap border';
  const chipActive = 'bg-[#1D4ED8] text-white shadow-md border-[#1D4ED8] ring-2 ring-[#1D4ED8]/30';
  const chipInactive = 'bg-white text-[#1A1A1A] border-[#CBD5E1] hover:border-[#1D4ED8] hover:bg-[#EEF2FF] hover:text-[#1D4ED8] hover:shadow-sm';

  /* ── 드라이버 제품 여부: 규격이 [Machine...] / [Ratchet...] 패턴이면 그룹 표시 ── */
  const isDriverProduct = dimensionData
    ? dimensionData.dimension1List.some(
        (dim) =>
          dim.toLowerCase().startsWith('[machine') ||
          dim.toLowerCase().startsWith('[ratchet'),
      )
    : false;

  const driverGroups = isDriverProduct && dimensionData
    ? [
        {
          key: 'machine',
          label: '── Machine ──',
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          items: dimensionData.dimension1List.filter((d) =>
            d.toLowerCase().startsWith('[machine'),
          ),
        },
        {
          key: 'ratchet',
          label: '── Ratchet ──',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          items: dimensionData.dimension1List.filter((d) =>
            d.toLowerCase().startsWith('[ratchet'),
          ),
        },
        {
          key: 'other',
          label: '── 기타 ──',
          bg: 'bg-gray-50',
          text: 'text-gray-500',
          items: dimensionData.dimension1List.filter(
            (d) =>
              !d.toLowerCase().startsWith('[machine') &&
              !d.toLowerCase().startsWith('[ratchet'),
          ),
        },
      ].filter((g) => g.items.length > 0)
    : [];

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white hover:shadow-lg hover:border-[#CBD5E1] transition-all duration-200 pb-2">
      {/* 카드 헤더 (이미지 + 기본 정보) */}
      <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>

        {/* ── 이미지 영역: 고정 높이 + object-contain ── */}
        <div className="relative bg-white w-full h-[180px] sm:h-[200px] flex items-center justify-center overflow-hidden">
          <img
            src={representativeProduct.image_url || '/assets/highness/placeholder.png'}
            alt={representativeProduct.name_ko}
            style={{ maxHeight: '160px', width: '100%', objectFit: 'contain', padding: '12px' }}
            onError={(e) => { e.currentTarget.src = '/assets/highness/placeholder.png'; }}
          />
          {hasOptions && (
            <span className="absolute top-2 right-2 bg-[#1D4ED8]/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {options.length}종
            </span>
          )}
        </div>

        {/* 제품 정보 */}
        <div className="px-3.5 py-3 border-t border-[#F0F4FF]">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[#1A1A1A] leading-snug mb-0.5 line-clamp-2">
            {representativeProduct.name_ko || groupName}
          </h3>
          {representativeProduct.name_en && (
            <p className="text-[10px] text-[#AAAAAA] mb-2.5 truncate font-mono leading-tight">
              {representativeProduct.name_en}
            </p>
          )}
          <div className="flex items-center justify-between mt-1">
            {/* 가격 표시 */}
            {isAdmin && adminPrice !== undefined ? (
              <span className="text-[12px] sm:text-[13px] font-bold text-[#1A1A1A]">
                {adminPrice.toLocaleString()}P
              </span>
            ) : !isLoggedIn ? (
              /* 비로그인: 소비자가 + 로그인 유도 */
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1A1A1A]">
                  ₩{(consumerPrices?.[representativeProduct.id] ?? representativeProduct.base_price ?? 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-medium leading-tight text-[#6B7280]">
                  로그인 시 패키지 단가 적용
                </span>
              </div>
            ) : hasPackagePrice ? (
              /* 로그인 + 패키지 단가 적용 */
              <div className="flex flex-col gap-0.5">
                {consumerPrice !== undefined && consumerPrice !== unitPrice && (
                  <span className="text-[10px] text-[#9CA3AF] line-through">
                    ₩{consumerPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-[14px] font-extrabold" style={{ color: '#2563EB' }}>
                  ₩{unitPrice.toLocaleString()}
                </span>
                <span
                  className="inline-flex items-center text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit"
                  style={{ background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                >
                  {clientPackageTier} PKG
                </span>
              </div>
            ) : (
              /* 로그인 + 기본 단가 (패키지 없음) */
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1A1A1A]">
                  ₩{unitPrice.toLocaleString()}
                </span>
              </div>
            )}
            <button
              className="text-[11px] text-[#1D4ED8] font-semibold flex items-center gap-1 hover:text-[#1E40AF] transition-colors cursor-pointer whitespace-nowrap"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              {isExpanded ? '접기' : '규격 선택'}
              <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-sm`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* ── 확장 영역: 다단계 Chip UI ── */}
      {isExpanded && dimensionData && (
        <div className="px-4 py-4 bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF] border-t border-[#E2E8F0]">

          {/* Step 1: 직경 (또는 단일 규격) */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-[#1D4ED8] mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]"></span>
              {dimensionData.maxDimensions === 1 ? '규격' : '직경'}
            </p>

            {isDriverProduct ? (
              /* 드라이버 제품: Machine / Ratchet / 기타 그룹 분리 표시 */
              <div className="space-y-3">
                {driverGroups.map((group) => (
                  <div key={group.key}>
                    <div className={`w-full text-center text-[10px] font-bold py-1 rounded-md mb-2 ${group.bg} ${group.text}`}>
                      {group.label}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((dim) => (
                        <button
                          key={dim}
                          onClick={() => handleDimension1Change(dim)}
                          className={`${chipBase} ${selectedDimension1 === dim ? chipActive : chipInactive}`}
                        >
                          {dim}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 일반 제품: 기존 플랫 리스트 */
              <div className="flex flex-wrap gap-2">
                {dimensionData.dimension1List.map((dim) => (
                  <button
                    key={dim}
                    onClick={() => handleDimension1Change(dim)}
                    className={`${chipBase} ${selectedDimension1 === dim ? chipActive : chipInactive}`}
                  >
                    {dim}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: 길이 (2단계 이상인 경우만) */}
          {dimensionData.maxDimensions >= 2 && selectedDimension1 && dimension2List.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-bold text-[#1D4ED8] mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]"></span>
                길이</p>
              <div className="flex flex-wrap gap-2">
                {dimension2List.map((dim) => (
                  <button
                    key={dim}
                    onClick={() => handleDimension2Change(dim)}
                    className={`${chipBase} ${selectedDimension2 === dim ? chipActive : chipInactive}`}
                  >
                    {dim}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: 커프 (3단계 이상인 경우만) */}
          {dimensionData.maxDimensions >= 3 && selectedDimension2 && dimension3List.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-bold text-[#1D4ED8] mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]"></span>
                커프</p>
              <div className="flex flex-wrap gap-2">
                {dimension3List.map((dim) => (
                  <button
                    key={dim}
                    onClick={() => setSelectedDimension3(dim)}
                    className={`${chipBase} ${selectedDimension3 === dim ? chipActive : chipInactive}`}
                  >
                    {dim}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 선택 요약 + 담기 버튼 */}
          {selectedProduct && (
            <div className="mt-3 pt-3 border-t border-[#C7D2FE]">
              <div className="flex items-center gap-2 bg-[#EEF2FF] rounded-lg px-3 py-2.5 mb-3 border border-[#1D4ED8]/20">
                <i className="ri-checkbox-circle-fill text-[#1D4ED8] text-base flex-shrink-0"></i>
                <p className="text-[12px] font-bold text-[#1A1A1A] truncate">{selectedProduct.size_info}</p>
              </div>

              {/* 수량 선택 */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider whitespace-nowrap">수량</span>
                <div className="flex items-center border border-[#CBD5E1] rounded-lg overflow-hidden bg-white flex-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] transition-colors cursor-pointer border-r border-[#CBD5E1]"
                  >
                    <i className="ri-subtract-line text-sm"></i>
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(999, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    className="flex-1 text-center text-[13px] font-bold h-9 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] transition-colors cursor-pointer border-l border-[#CBD5E1]"
                  >
                    <i className="ri-add-line text-sm"></i>
                  </button>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  {hasPackagePrice && consumerPrice !== undefined && consumerPrice !== unitPrice && (
                    <span className="text-[10px] text-[#9CA3AF] line-through whitespace-nowrap">
                      ₩{(consumerPrice * quantity).toLocaleString()}
                    </span>
                  )}
                  <span
                    className="text-[12px] font-bold whitespace-nowrap"
                    style={{ color: hasPackagePrice ? '#2563EB' : '#1A1A1A' }}
                  >
                    ₩{(unitPrice * quantity).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className={`w-full py-2.5 rounded-lg font-bold text-[13px] transition-all shadow-md whitespace-nowrap cursor-pointer ${
                  added ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] hover:shadow-lg'
                }`}
              >
                {added ? '✓ 담겼습니다!' : `장바구니에 담기 (${quantity}개)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 옵션 없는 경우 */}
      {isExpanded && !dimensionData && (
        <div className="px-4 py-4 bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF] border-t border-[#E2E8F0]">
          {/* 수량 선택 (옵션 없는 경우) */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider whitespace-nowrap">수량</span>
            <div className="flex items-center border border-[#CBD5E1] rounded-lg overflow-hidden bg-white flex-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] transition-colors cursor-pointer border-r border-[#CBD5E1]"
              >
                <i className="ri-subtract-line text-sm"></i>
              </button>
              <input
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(999, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="flex-1 text-center text-[13px] font-bold h-9 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                className="w-9 h-9 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] transition-colors cursor-pointer border-l border-[#CBD5E1]"
              >
                <i className="ri-add-line text-sm"></i>
              </button>
            </div>
            <span className="text-[11px] text-[#8B6914] font-semibold whitespace-nowrap">
              ₩{(unitPrice * quantity).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => {
              onBulkAddToCart([{ product: representativeProduct, quantity, unitPrice }]);
              setIsExpanded(false);
            }}
            className="w-full bg-[#1D4ED8] text-white py-2.5 rounded-lg font-bold text-[13px] hover:bg-[#1E40AF] transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
          >
            장바구니에 담기 ({quantity}개)
          </button>
        </div>
      )}
    </div>
  );
}