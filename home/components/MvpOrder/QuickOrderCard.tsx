import { useState, useMemo } from 'react';
import type { ProductOption } from '../../../../hooks/useProducts';
import { HignessProduct } from '../../../../mocks/highness-catalog';

export interface QuickOrderCartParams {
  product: HignessProduct;
  quantity: number;
  unitPrice: number;
  selectedOptionId?: string;
  selectedOptionModelCode?: string;
  sizeInfo?: string;
}

interface QuickOrderCardEntry {
  product: HignessProduct;
  orderCount: number;
  lastOrderedAt: string;
  isFavorite: boolean;
  isReorderPin: boolean;
}

interface QuickOrderCardProps {
  entry: QuickOrderCardEntry;
  productOptions: ProductOption[];
  prices: Record<string, number>;
  qty: number;
  added: boolean;
  isNewUser: boolean;
  onQtyChange: (productId: string, delta: number) => void;
  onAddToCart: (params: QuickOrderCartParams) => void;
  onToggleFavorite: (productId: string, productName: string) => void;
  isTogglingFavorite: boolean;
}

export default function QuickOrderCard({
  entry,
  productOptions,
  prices,
  qty,
  added,
  isNewUser,
  onQtyChange,
  onAddToCart,
  onToggleFavorite,
  isTogglingFavorite,
}: QuickOrderCardProps) {
  const { product, orderCount, lastOrderedAt, isFavorite, isReorderPin } = entry;
  const unitPrice = prices[product.id] ?? product.base_price;

  const [selectedDimension1, setSelectedDimension1] = useState<string | null>(null);
  const [selectedDimension2, setSelectedDimension2] = useState<string | null>(null);
  const [selectedDimension3, setSelectedDimension3] = useState<string | null>(null);

  /* ── 옵션 정렬 ── */
  const sortedOptions = useMemo(() => {
    return [...productOptions].sort((a, b) => {
      const aLabel = a.size_info || a.model_code || '';
      const bLabel = b.size_info || b.model_code || '';
      return aLabel.localeCompare(bLabel, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [productOptions]);

  /* ── 다단계 파싱 (GroupedProductCard와 동일 로직) ── */
  const dimensionData = useMemo(() => {
    if (sortedOptions.length === 0) return null;

    const parsedOptions = sortedOptions.map((opt) => {
      const sizeText = (opt.size_info || opt.model_code || '').trim();
      if (sizeText.includes('*')) {
        const parts = sizeText.split('*').map((p: string) => p.trim());
        const dimensions = parts.length > 0 ? parts : [sizeText];
        return { product: opt, dimensions, fullText: sizeText };
      }
      return { product: opt, dimensions: [sizeText || opt.model_code || ''], fullText: sizeText };
    });

    const maxDimensions = Math.max(...parsedOptions.map((p) => p.dimensions.length));
    const dimension1Set = new Set(parsedOptions.map((p) => p.dimensions[0]));
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
    const filtered = dimensionData.parsedOptions.filter((p) => p.dimensions[0] === selectedDimension1);
    const set = new Set(filtered.map((p) => p.dimensions[1]).filter(Boolean));
    return Array.from(set).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
      return numA - numB;
    });
  }, [dimensionData, selectedDimension1]);

  const dimension3List = useMemo(() => {
    if (!dimensionData || dimensionData.maxDimensions < 3 || !selectedDimension1 || !selectedDimension2) return [];
    const filtered = dimensionData.parsedOptions.filter(
      (p) => p.dimensions[0] === selectedDimension1 && p.dimensions[1] === selectedDimension2,
    );
    const set = new Set(filtered.map((p) => p.dimensions[2]).filter(Boolean));
    return Array.from(set).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''));
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''));
      return numA - numB;
    });
  }, [dimensionData, selectedDimension1, selectedDimension2]);

  const selectedOption = useMemo(() => {
    if (!dimensionData || !selectedDimension1) return null;
    const required = dimensionData.maxDimensions;
    if (required === 1) {
      return dimensionData.parsedOptions.find((p) => p.dimensions[0] === selectedDimension1)?.product || null;
    }
    if (required === 2 && selectedDimension2) {
      return dimensionData.parsedOptions.find(
        (p) => p.dimensions[0] === selectedDimension1 && p.dimensions[1] === selectedDimension2,
      )?.product || null;
    }
    if (required >= 3 && selectedDimension2 && selectedDimension3) {
      return dimensionData.parsedOptions.find(
        (p) =>
          p.dimensions[0] === selectedDimension1 &&
          p.dimensions[1] === selectedDimension2 &&
          p.dimensions[2] === selectedDimension3,
      )?.product || null;
    }
    return null;
  }, [dimensionData, selectedDimension1, selectedDimension2, selectedDimension3]);

  const hasOptions = productOptions.length > 0;
  const canAddToCart = !hasOptions || !!selectedOption;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    onAddToCart({
      product,
      quantity: qty,
      unitPrice,
      selectedOptionId: selectedOption?.id,
      selectedOptionModelCode: selectedOption?.model_code,
      sizeInfo: selectedOption?.size_info,
    });
    setSelectedDimension1(null);
    setSelectedDimension2(null);
    setSelectedDimension3(null);
  };

  const relativeDate = lastOrderedAt
    ? (() => {
        const days = Math.floor((Date.now() - new Date(lastOrderedAt).getTime()) / (1000 * 60 * 60 * 24));
        return days === 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`;
      })()
    : '';

  /* ── 테두리 스타일 ── */
  const borderStyle = isFavorite
    ? 'border-amber-300 ring-1 ring-amber-200'
    : isReorderPin
    ? 'border-orange-300 ring-1 ring-orange-200'
    : 'border-[#E0E8FF] hover:border-[#2B5F9E]/40';

  /* ── 칩 스타일 (GroupedProductCard와 동일) ── */
  const chipBase = 'px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap border';
  const chipActive = 'bg-[#1D4ED8] text-white shadow-md border-[#1D4ED8] ring-2 ring-[#1D4ED8]/30';
  const chipInactive =
    'bg-white text-[#1A1A1A] border-[#CBD5E1] hover:border-[#1D4ED8] hover:bg-[#EEF2FF] hover:text-[#1D4ED8] hover:shadow-sm';

  return (
    <div
      className={`flex-shrink-0 w-[272px] bg-white border rounded-xl overflow-hidden transition-all hover:shadow-sm ${borderStyle}`}
    >
      <div className="flex flex-row">
        {/* ── 왼쪽: 이미지 ── */}
        <div className="relative w-[88px] flex-shrink-0 bg-[#F5F7FF] flex items-center justify-center overflow-hidden self-stretch">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name_ko}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center">
              <i className="ri-box-3-line text-2xl text-[#CCCCCC]"></i>
            </div>
          )}

          {/* 뱃지 */}
          <div className="absolute bottom-1.5 left-1.5">
            {isFavorite && (
              <div className="bg-amber-400 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 leading-none">
                <i className="ri-star-fill text-[8px]"></i>고정
              </div>
            )}
            {!isFavorite && isReorderPin && (
              <div className="bg-orange-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 leading-none">
                <i className="ri-refresh-line text-[8px]"></i>재주문
              </div>
            )}
            {!isFavorite && !isReorderPin && !isNewUser && orderCount > 0 && (
              <div className="bg-[#2B5F9E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {orderCount}회
              </div>
            )}
          </div>

          {/* 즐겨찾기 버튼 */}
          {!isNewUser && (
            <button
              onClick={() => onToggleFavorite(product.id, product.name_ko)}
              disabled={isTogglingFavorite}
              className={`absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-amber-400/90 text-amber-900 hover:bg-amber-300'
                  : 'bg-white/80 text-gray-400 hover:bg-amber-50 hover:text-amber-400'
              } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <i className={`text-xs ${isFavorite ? 'ri-star-fill' : 'ri-star-line'}`}></i>
            </button>
          )}
        </div>

        {/* ── 오른쪽: 정보 + 칩 + 담기 ── */}
        <div className="flex-1 min-w-0 p-2.5 flex flex-col gap-1.5">
          {/* 제품명 + 날짜 */}
          <div>
            <p className="text-[11px] font-semibold text-[#1A1A1A] leading-tight line-clamp-2">{product.name_ko}</p>
            {!isNewUser && relativeDate && (
              <p className="text-[9px] text-[#AAAAAA] mt-0.5">마지막 주문: {relativeDate}</p>
            )}
          </div>

          {/* 가격 */}
          <p className="text-xs font-bold text-[#2B5F9E] leading-none">₩{unitPrice.toLocaleString()}</p>

          {/* ── 칩 선택 영역 ── */}
          {dimensionData && (
            <div className="bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF] rounded-lg p-2 border border-[#E2E8F0] space-y-2">
              {/* Step 1: 직경 / 규격 */}
              <div>
                <p className="text-[10px] font-bold text-[#1D4ED8] mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] flex-shrink-0"></span>
                  {dimensionData.maxDimensions === 1 ? '규격' : '직경'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dimensionData.dimension1List.map((dim) => (
                    <button
                      key={dim}
                      onClick={() => {
                        setSelectedDimension1(dim);
                        setSelectedDimension2(null);
                        setSelectedDimension3(null);
                      }}
                      className={`${chipBase} ${selectedDimension1 === dim ? chipActive : chipInactive}`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: 길이 */}
              {dimensionData.maxDimensions >= 2 && selectedDimension1 && dimension2List.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#1D4ED8] mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] flex-shrink-0"></span>
                    길이
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {dimension2List.map((dim) => (
                      <button
                        key={dim}
                        onClick={() => {
                          setSelectedDimension2(dim);
                          setSelectedDimension3(null);
                        }}
                        className={`${chipBase} ${selectedDimension2 === dim ? chipActive : chipInactive}`}
                      >
                        {dim}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: 커프 */}
              {dimensionData.maxDimensions >= 3 && selectedDimension2 && dimension3List.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#1D4ED8] mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] flex-shrink-0"></span>
                    커프
                  </p>
                  <div className="flex flex-wrap gap-1.5">
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

              {/* 선택 요약 */}
              {selectedOption && (
                <div className="flex items-center gap-1.5 bg-[#EEF2FF] rounded-md px-2 py-1.5 border border-[#1D4ED8]/20">
                  <i className="ri-checkbox-circle-fill text-[#1D4ED8] text-xs flex-shrink-0"></i>
                  <span className="text-[10px] font-bold text-[#1A1A1A] truncate">{selectedOption.size_info}</span>
                </div>
              )}
            </div>
          )}

          {/* 수량 + 담기 버튼 */}
          <div className="flex items-center gap-1.5 mt-auto">
            <div className="flex items-center border border-[#E0E0E0] rounded-lg overflow-hidden bg-white flex-shrink-0">
              <button
                onClick={() => onQtyChange(product.id, -1)}
                className="w-6 h-6 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
              >
                <i className="ri-subtract-line text-[10px]"></i>
              </button>
              <span className="w-7 text-center text-[11px] font-semibold border-x border-[#E0E0E0]">{qty}</span>
              <button
                onClick={() => onQtyChange(product.id, 1)}
                className="w-6 h-6 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
              >
                <i className="ri-add-line text-[10px]"></i>
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`flex-1 h-7 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                added
                  ? 'bg-emerald-500 text-white cursor-pointer'
                  : canAddToCart
                  ? 'bg-[#2B5F9E] text-white hover:bg-[#3A7BC8] cursor-pointer'
                  : 'bg-[#EEF2FF] text-[#1D4ED8] cursor-default border border-[#1D4ED8]/30'
              }`}
            >
              {added ? (
                <>
                  <i className="ri-check-line text-xs"></i>담김
                </>
              ) : canAddToCart ? (
                <>
                  <i className="ri-shopping-cart-line text-xs"></i>담기
                </>
              ) : (
                <>규격 선택↑</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
