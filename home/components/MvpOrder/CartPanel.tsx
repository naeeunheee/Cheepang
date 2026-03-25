import { useState, useEffect } from 'react';
import { MvpOrderItem } from '../../../../mocks/highness-catalog';
import { HignessProduct } from '../../../../mocks/highness-catalog';
import { ClientPoint } from '../../../../mocks/points';
import ShippingUpsell from './ShippingUpsell';

interface CartPanelProps {
  items: MvpOrderItem[];
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onOrder: () => void;
  onExport: () => void;
  onCharge?: () => void;
  isOpen: boolean;
  onToggle: () => void;
  clientPoint?: ClientPoint;
  activeProducts?: HignessProduct[];
  prices?: Record<string, number>;
  onQuickAdd?: (items: {
    product: HignessProduct;
    quantity: number;
    unitPrice: number;
    selectedOptionModelCode?: string;
    sizeInfo?: string;
  }[]) => void;
}

export default function CartPanel({
  items = [],
  onRemove,
  onUpdateQuantity,
  onOrder,
  onExport,
  onCharge,
  isOpen,
  onToggle,
  clientPoint,
  activeProducts = [],
  prices = {},
  onQuickAdd,
}: CartPanelProps) {
  // 스크롤 기반 플로팅 버튼 표시 (히어로 구간에선 숨김)
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 히어로 섹션 높이 이후(약 500px)부터 플로팅 버튼 표시
      setShowFloating(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate total amount (including component prices)
  const totalAmount = items.reduce((sum, item) => {
    const componentTotal = (item.components ?? []).reduce(
      (cs, c) => cs + c.unitPrice * c.quantity,
      0
    );
    return sum + (item.totalPrice ?? 0) + componentTotal;
  }, 0);

  // Calculate total quantity of items
  const totalCount = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  // Safely handle quantity changes
  const handleQuantityChange = (index: number, newQty: number) => {
    const safeQty = Number.isFinite(newQty) ? Math.max(1, newQty) : 1;
    onUpdateQuantity(index, safeQty);
  };

  // Point balance calculations
  const balance = clientPoint?.point_balance ?? null;
  const afterDeduct = balance !== null ? balance - totalAmount : null;
  const isZeroBalance = balance !== null && balance === 0;
  const isInsufficient =
    balance !== null && totalAmount > 0 && afterDeduct !== null && afterDeduct < 0;
  const shortage = isInsufficient && afterDeduct !== null ? Math.abs(afterDeduct) : 0;

  return (
    <>
      {/* Floating Cart Button - 히어로 이후 구간에서만 표시 */}
      {showFloating && (
        <button
          onClick={onToggle}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-[#2B5F9E] text-white w-14 h-14 rounded-full shadow-xl hover:bg-[#3A7BC8] active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer"
          aria-label="장바구니 열기"
        >
          <i className="ri-shopping-cart-2-line text-2xl" aria-hidden="true"></i>
          {totalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Cart Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[90vw] sm:max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <i className="ri-shopping-cart-2-line text-base md:text-lg text-[#2B5F9E] w-5 h-5 flex items-center justify-center"></i>
            <h3 className="text-sm md:text-base font-bold text-gray-800">장바구니</h3>
            <span className="bg-[#2B5F9E] text-white text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg text-gray-500"></i>
          </button>
        </div>

        {/* 포인트 0원 경고 배너 — 제거됨 (잔액 시스템 전환) */}

        {/* ShippingUpsell — 아이템이 있을 때 헤더 아래 표시 */}
        {items.length > 0 && onQuickAdd && (
          <ShippingUpsell
            totalAmount={totalAmount}
            activeProducts={activeProducts}
            prices={prices}
            cartProductIds={new Set(items.map((i) => i.productId))}
            onQuickAdd={onQuickAdd}
          />
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-5 py-3 md:py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <i className="ri-shopping-cart-line text-5xl mb-3 w-12 h-12 flex items-center justify-center"></i>
              <p className="text-sm">장바구니가 비어있습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const hasComponents =
                  Array.isArray(item.components) && item.components.length > 0;
                const componentTotal = (item.components ?? []).reduce(
                  (s, c) => s + c.unitPrice * c.quantity,
                  0
                );
                return (
                  <div
                    key={index}
                    className={`rounded-xl relative overflow-hidden ${
                      hasComponents
                        ? 'border border-[#2B5F9E]/20 bg-[#2B5F9E]/5'
                        : 'bg-gray-50'
                    }`}
                  >
                    {hasComponents && (
                      <div className="flex items-center gap-1.5 px-3.5 pt-3 pb-1">
                        <i className="ri-stack-line text-[#2B5F9E] text-xs w-4 h-4 flex items-center justify-center"></i>
                        <span className="text-[10px] font-bold text-[#2B5F9E] uppercase tracking-wide">
                          세트 구성 ({(item.components?.length ?? 0) + 1}종)
                        </span>
                      </div>
                    )}

                    <div className={`p-3.5 ${hasComponents ? 'pt-1' : ''} relative`}>
                      <button
                        onClick={() => onRemove(index)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        <i className="ri-close-line text-sm text-gray-400"></i>
                      </button>

                      <div className="flex items-start gap-2 pr-6">
                        <div
                          className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                            hasComponents ? 'bg-[#2B5F9E]' : 'bg-gray-300'
                          }`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.productName}
                          </p>
                          {/* 품목코드 (selectedOptionModelCode 우선, 없으면 productCode) */}
                          {(item.selectedOptionModelCode || item.productCode) && (
                            <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                              {item.selectedOptionModelCode || item.productCode}
                            </p>
                          )}
                          {/* 규격 정보 */}
                          {item.sizeInfo && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-[#2B5F9E]/8 text-[#2B5F9E] border border-[#2B5F9E]/20 px-2 py-0.5 rounded-md font-medium">
                              <i className="ri-ruler-line text-[10px] w-3 h-3 flex items-center justify-center"></i>
                              {item.sizeInfo}
                            </span>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(item.selectedOptions ?? {})
                              .filter(([key]) => key !== '규격') // sizeInfo로 이미 표시하므로 중복 제거
                              .map(([key, val]) => (
                                <span
                                  key={key}
                                  className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded-md border border-gray-200"
                                >
                                  {key}: {val}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <button
                            onClick={() =>
                              handleQuantityChange(index, (item.quantity ?? 1) - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
                          >
                            <i className="ri-subtract-line text-xs"></i>
                          </button>
                          <span className="min-w-[32px] w-8 text-center text-xs font-medium border-x border-gray-200">
                            {item.quantity ?? 1}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(index, (item.quantity ?? 1) + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
                          >
                            <i className="ri-add-line text-xs"></i>
                          </button>
                        </div>
                        <p className="text-sm font-bold text-[#2B5F9E] flex-shrink-0 ml-2">
                          ₩{(item.totalPrice ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {hasComponents && (
                      <div className="border-t border-[#2B5F9E]/10 mx-3.5 mb-3">
                        <div className="pt-2 space-y-1.5">
                          {item.components!.map((comp, ci) => (
                            <div key={ci} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#2B5F9E]/40 flex-shrink-0 ml-1"></div>
                                <div className="min-w-0">
                                  <span className="text-[11px] text-gray-600 font-medium truncate block">
                                    {comp.productName}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    {comp.productCode}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-[10px] text-gray-500">×{comp.quantity}</span>
                                <span className="text-[11px] font-semibold text-gray-700">
                                  ₩{(comp.unitPrice * comp.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2B5F9E]/10">
                          <span className="text-[10px] font-semibold text-[#2B5F9E]">
                            세트 합계
                          </span>
                          <span className="text-xs font-bold text-[#2B5F9E]">
                            ₩{((item.totalPrice ?? 0) + componentTotal).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 md:px-5 py-3 md:py-4 space-y-2.5 md:space-y-3">
            {/* Total Amount */}
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">총 금액</span>
              <span className="text-lg md:text-xl font-extrabold text-gray-900">
                ₩{totalAmount.toLocaleString()}
              </span>
            </div>

            {/* Order button */}
            <button
              onClick={onOrder}
              className="w-full py-2.5 md:py-3 bg-[#2B5F9E] text-white rounded-xl text-xs md:text-sm font-bold hover:bg-[#3A7BC8] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="ri-file-list-3-line text-sm md:text-base w-4 h-4 flex items-center justify-center"></i>
              주문하기
            </button>

            {/* Export button */}
            <button
              onClick={onExport}
              className="w-full py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-semibold border border-[#2B5F9E]/30 text-[#2B5F9E] bg-[#2B5F9E]/5 hover:bg-[#2B5F9E]/10 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="ri-kakao-talk-fill text-xs md:text-sm w-4 h-4 flex items-center justify-center"></i>
              카카오톡 전송 / 주문서 다운로드
            </button>
          </div>
        )}
      </div>
    </>
  );
}
