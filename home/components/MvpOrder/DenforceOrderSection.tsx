import { useState, useMemo } from 'react';
import { MvpOrderItem } from '../../../../mocks/highness-catalog';
import DenforceProductModal from './DenforceProductModal';

interface DenforceProduct {
  id: string;
  name_ko: string;
  name_en?: string;
  model_code: string;
  category: string;
  unit_price: number;
  pricing_type?: string;
  image_url?: string;
  short_description?: string;
}

interface DenforceOrderSectionProps {
  products: DenforceProduct[];
  onAddToCart: (items: MvpOrderItem[]) => void;
}

const DENFORCE_TABS = [
  { key: 'all', label: '전체' },
  { key: '소장비', label: '소장비' },
  { key: '기타 소모재료', label: '기타 소모재료' },
];

export default function DenforceOrderSection({ products, onAddToCart }: DenforceOrderSectionProps) {
  const [catFilter, setCatFilter] = useState('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const tabs = DENFORCE_TABS.map((t) => ({
    ...t,
    count: t.key === 'all' ? products.length : products.filter((p) => p.category === t.key).length,
  }));

  const filtered = useMemo(() => {
    if (catFilter === 'all') return products;
    return products.filter((p) => p.category === catFilter);
  }, [products, catFilter]);

  const getQty = (id: string) => quantities[id] ?? 1;

  const handleQtyChange = (e: React.MouseEvent, id: string, delta: number) => {
    e.stopPropagation();
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));
  };

  const handleAddToCart = (e: React.MouseEvent, product: DenforceProduct) => {
    e.stopPropagation();
    const qty = getQty(product.id);
    const item: MvpOrderItem = {
      productId: product.id,
      productName: product.name_ko,
      productCode: product.model_code,
      selectedOptions: {},
      quantity: qty,
      unitPrice: product.unit_price,
      totalPrice: product.unit_price * qty,
    };
    onAddToCart([item]);
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedMap((prev) => ({ ...prev, [product.id]: false })), 1500);
  };

  const isEmpty = catFilter === '기타 소모재료' && filtered.length === 0;

  return (
    <>
      <div id="denforce-order">
        {/* ── 구분선 ── */}
        <div className="flex items-center gap-4 my-8" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
          <div className="flex-1 border-t border-[#E2E8F0]"></div>
          <div className="flex items-center gap-2 px-3">
            <i className="ri-box-3-line text-[#2B5F9E] text-base w-5 h-5 flex items-center justify-center"></i>
            <span className="text-sm font-bold text-[#2B5F9E] whitespace-nowrap">
              소모품·재료사업부 — Denforce
            </span>
          </div>
          <div className="flex-1 border-t border-[#E2E8F0]"></div>
        </div>

        {/* ── 섹션 헤더 ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A]">소모품·재료사업부</h3>
            <p className="text-xs text-[#999999] mt-0.5">Denforce — 치과 소모품·장비 전문 / 클릭하면 상세 정보를 볼 수 있습니다</p>
          </div>
        </div>

        {/* ── 카테고리 탭 ── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCatFilter(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer rounded-t-lg ${
                catFilter === tab.key
                  ? 'text-[#1D4ED8] border-b-[3px] border-[#1D4ED8] bg-[#EEF2FF]'
                  : 'text-[#94A3B8] border-b-[3px] border-transparent hover:text-[#1D4ED8] hover:bg-[#F8FAFC]'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* ── 제품 목록 or 준비중 ── */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
              <i className="ri-time-line text-2xl text-[#CCCCCC]"></i>
            </div>
            <h3 className="text-sm font-bold text-[#333333] mb-1">제품 준비중입니다</h3>
            <p className="text-xs text-[#999999]">인공뼈, 세포막 등 재료가 순차적으로 등록됩니다</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
              <i className="ri-search-line text-2xl text-[#CCCCCC]"></i>
            </div>
            <p className="text-sm text-[#999999]">해당 카테고리 제품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {filtered.map((product) => {
              const hasPrice = product.unit_price > 0;
              const qty = getQty(product.id);
              const added = addedMap[product.id];

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="rounded-xl border border-[#E0E0E0] bg-white overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-[#2B5F9E]/30 cursor-pointer group"
                >
                  {/* 이미지 */}
                  <div
                    className="w-full bg-[#F8F8F8] flex items-center justify-center overflow-hidden relative"
                    style={{ height: '140px' }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name_ko}
                        className="w-full h-full object-contain object-top p-3 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-300">
                        <i className="ri-image-line text-3xl"></i>
                        <span className="text-xs text-gray-400 mt-1">이미지 준비중</span>
                      </div>
                    )}
                    {/* 상세보기 힌트 */}
                    <div className="absolute inset-0 bg-[#2B5F9E]/0 group-hover:bg-[#2B5F9E]/8 transition-colors duration-200 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-[#2B5F9E] text-[10px] font-bold px-2 py-1 rounded-full">
                        상세 보기
                      </span>
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="p-3 flex flex-col flex-1">
                    {product.model_code && (
                      <p className="text-[10px] font-mono text-[#999999] mb-0.5">{product.model_code}</p>
                    )}
                    <h4 className="text-sm font-bold text-[#1A1A1A] leading-snug mb-1 flex-1">
                      {product.name_ko}
                    </h4>
                    {product.short_description && (
                      <p className="text-[10px] text-[#999999] leading-relaxed mb-2 line-clamp-2">
                        {product.short_description}
                      </p>
                    )}

                    {hasPrice ? (
                      <>
                        <p className="text-base font-bold text-[#1A1A1A] mb-2">
                          ₩{product.unit_price.toLocaleString()}
                        </p>
                        {/* 수량 조절 */}
                        <div
                          className="flex items-center border border-[#E0E0E0] rounded overflow-hidden bg-white mb-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleQtyChange(e, product.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer"
                          >
                            <i className="ri-subtract-line text-sm"></i>
                          </button>
                          <span className="flex-1 text-center text-sm font-medium border-x border-[#E0E0E0]">
                            {qty}
                          </span>
                          <button
                            onClick={(e) => handleQtyChange(e, product.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer"
                          >
                            <i className="ri-add-line text-sm"></i>
                          </button>
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className={`w-full py-2 rounded text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                            added
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[#333333] hover:bg-[#000000] text-white'
                          }`}
                        >
                          {added ? (
                            <>
                              <i className="ri-check-line text-xs"></i>
                              담겼습니다
                            </>
                          ) : (
                            <>
                              <i className="ri-shopping-cart-2-line text-xs"></i>
                              장바구니 담기
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <a
                        href="tel:010-8950-3379"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded text-xs font-semibold text-white bg-[#2B5F9E] hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-phone-line text-xs"></i>
                        가격 문의
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Denforce 제품 상세 모달 ── */}
      {selectedProductId && (
        <DenforceProductModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onAddToCart={(items) => {
            onAddToCart(items);
            setSelectedProductId(null);
          }}
        />
      )}
    </>
  );
}
