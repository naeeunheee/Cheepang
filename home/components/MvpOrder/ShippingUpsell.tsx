import { useState } from 'react';
import { HignessProduct } from '../../../../mocks/highness-catalog';

export const FREE_SHIPPING_THRESHOLD = 50000;

interface ShippingUpsellProps {
  totalAmount: number;
  activeProducts: HignessProduct[];
  prices: Record<string, number>;
  cartProductIds: Set<string>;
  onQuickAdd: (items: {
    product: HignessProduct;
    quantity: number;
    unitPrice: number;
    selectedOptionModelCode?: string;
    sizeInfo?: string;
  }[]) => void;
}

export default function ShippingUpsell({
  totalAmount,
  activeProducts,
  prices,
  cartProductIds,
  onQuickAdd,
}: ShippingUpsellProps) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalAmount);
  const progress = Math.min(100, Math.round((totalAmount / FREE_SHIPPING_THRESHOLD) * 100));
  const isAchieved = remaining === 0;
  const [upsellQty, setUpsellQty] = useState<Record<string, number>>({});
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  // 추천 상품: 장바구니 미포함 + 가격 오름차순 (부족액에 맞는 상품 우선)
  const recommendedProducts = activeProducts
    .filter((p) => !cartProductIds.has(p.id))
    .map((p) => ({ product: p, price: prices[p.id] ?? p.base_price }))
    .filter(({ price }) => price > 0)
    .sort((a, b) => {
      // 부족금액 이하 상품 우선, 그 다음 가격 오름차순
      const aFits = a.price <= remaining;
      const bFits = b.price <= remaining;
      if (aFits && !bFits) return -1;
      if (!aFits && bFits) return 1;
      return a.price - b.price;
    })
    .slice(0, 6);

  const getQty = (pid: string) => upsellQty[pid] ?? 1;

  const handleQtyChange = (pid: string, delta: number) => {
    setUpsellQty((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] ?? 1) + delta) }));
  };

  const handleAdd = (product: HignessProduct, unitPrice: number) => {
    const qty = getQty(product.id);
    onQuickAdd([{ product, quantity: qty, unitPrice }]);
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedMap((prev) => ({ ...prev, [product.id]: false })), 1500);
  };

  return (
    <div className="border-b border-gray-100">
      {/* 배송비 진행 바 */}
      <div className={`px-4 md:px-5 py-3 ${isAchieved ? 'bg-emerald-50' : 'bg-[#F8FAFF]'} transition-colors duration-500`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <i className={`text-sm ${isAchieved ? 'ri-truck-fill text-emerald-500' : 'ri-truck-line text-[#2B5F9E]'}`}></i>
            {isAchieved ? (
              <span className="text-xs font-bold text-emerald-600">무료배송 적용 완료!</span>
            ) : (
              <span className="text-xs font-semibold text-gray-700">
                무료배송까지{' '}
                <span className="text-[#2B5F9E] font-extrabold">₩{remaining.toLocaleString()}</span>{' '}
                남았습니다
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isAchieved ? 'bg-emerald-100 text-emerald-600' : 'bg-[#2B5F9E]/10 text-[#2B5F9E]'}`}>
            {progress}%
          </span>
        </div>

        {/* 진행바 */}
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${
              isAchieved
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : progress >= 70
                ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                : 'bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8]'
            }`}
            style={{ width: `${progress}%` }}
          />
          {isAchieved && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/30 to-transparent animate-pulse rounded-full" />
          )}
        </div>

        {!isAchieved && (
          <p className="text-[9px] text-gray-400 mt-1">
            ₩{totalAmount.toLocaleString()} / ₩{FREE_SHIPPING_THRESHOLD.toLocaleString()}
          </p>
        )}
      </div>

      {/* 추천 상품 — 미달성 시만 표시 */}
      {!isAchieved && recommendedProducts.length > 0 && (
        <div className="px-4 md:px-5 py-3 bg-white border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-500 mb-2 flex items-center gap-1">
            <i className="ri-lightbulb-flash-line text-amber-400"></i>
            무료배송 완성 추천
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {recommendedProducts.map(({ product, price }) => {
              const added = addedMap[product.id] ?? false;
              const qty = getQty(product.id);
              const fitsRemaining = price <= remaining;

              return (
                <div
                  key={product.id}
                  className={`flex-shrink-0 w-[130px] rounded-xl border overflow-hidden bg-white transition-all hover:shadow-sm ${
                    fitsRemaining
                      ? 'border-emerald-200 ring-1 ring-emerald-100'
                      : 'border-gray-200'
                  }`}
                >
                  {/* 상품 이미지 */}
                  <div className="w-full h-20 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name_ko}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <i className="ri-box-3-line text-2xl text-gray-300"></i>
                    )}
                    {fitsRemaining && (
                      <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
                        딱 맞음
                      </div>
                    )}
                  </div>

                  <div className="p-2 flex flex-col gap-1">
                    <p className="text-[10px] font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[24px]">
                      {product.name_ko}
                    </p>
                    <p className="text-[11px] font-bold text-[#2B5F9E]">₩{price.toLocaleString()}</p>

                    {/* 수량 + 담기 */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex items-center border border-gray-200 rounded overflow-hidden flex-shrink-0">
                        <button
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                          <i className="ri-subtract-line text-[9px]"></i>
                        </button>
                        <span className="w-5 text-center text-[10px] font-medium border-x border-gray-200">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                          <i className="ri-add-line text-[9px]"></i>
                        </button>
                      </div>
                      <button
                        onClick={() => handleAdd(product, price)}
                        className={`flex-1 h-5 rounded text-[9px] font-bold flex items-center justify-center gap-0.5 cursor-pointer transition-all whitespace-nowrap ${
                          added
                            ? 'bg-emerald-500 text-white'
                            : fitsRemaining
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-[#2B5F9E] text-white hover:bg-[#3A7BC8]'
                        }`}
                      >
                        {added ? (
                          <><i className="ri-check-line text-[9px]"></i>담김</>
                        ) : (
                          <><i className="ri-add-line text-[9px]"></i>담기</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 달성 축하 메시지 */}
      {isAchieved && (
        <div className="px-4 md:px-5 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
          <i className="ri-gift-2-line text-emerald-500 text-base"></i>
          <p className="text-[11px] text-emerald-700 font-semibold">
            축하합니다! 이 주문은 무료배송이 적용됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
