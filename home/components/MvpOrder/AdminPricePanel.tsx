
import { useState } from 'react';
import { highnessProducts, highnessCategories } from '../../../../mocks/highness-catalog';

interface AdminPricePanelProps {
  prices: Record<string, number>;
  onPriceChange: (productId: string, price: number) => void;
  kitPrices?: Record<string, { simple?: number; full?: number }>;
  onKitPriceChange?: (productId: string, type: 'simple' | 'full', price: number) => void;
}

/**
 * AdminPricePanel
 *
 * Handles display and inline editing of product base prices as well as optional
 * kit‑price variations (Simple / Full). The component is defensive – it validates
 * input before propagating changes and falls back to the original mock data when
 * a price is missing.
 */
export default function AdminPricePanel({
  prices,
  onPriceChange,
  kitPrices,
  onKitPriceChange,
}: AdminPricePanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'base' | 'simple' | 'full'>('base');
  const [tempPrice, setTempPrice] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  /** Open edit mode for a specific product / field */
  const handleEdit = (
    id: string,
    currentPrice: number,
    field: 'base' | 'simple' | 'full' = 'base',
  ) => {
    setEditingId(id);
    setEditingField(field);
    setTempPrice(currentPrice.toString());
  };

  /** Validate and commit the edited price */
  const handleSave = (id: string) => {
    const newPrice = parseInt(tempPrice, 10);

    // Basic validation – price must be a positive integer
    if (Number.isNaN(newPrice) || newPrice <= 0) {
      // keep edit mode but clear the invalid input to give feedback
      setTempPrice('');
      return;
    }

    if (editingField === 'base') {
      onPriceChange(id, newPrice);
    } else if (onKitPriceChange) {
      onKitPriceChange(id, editingField, newPrice);
    }

    // Reset edit state
    setEditingId(null);
    setEditingField('base');
    setTempPrice('');
  };

  /** Cancel editing and restore previous state */
  const handleCancel = () => {
    setEditingId(null);
    setEditingField('base');
    setTempPrice('');
  };

  /** Tabs for category filtering – includes an “All” tab */
  const categoryTabs = [
    {
      key: 'all',
      label: '전체',
      count: highnessProducts.filter((p) => p.status === 'active').length,
    },
    ...highnessCategories.map((c) => ({
      key: c.id,
      label: c.name_ko,
      count: highnessProducts.filter(
        (p) => p.category_id === c.id && p.status === 'active',
      ).length,
    })),
  ];

  /** Apply category + search filters */
  const filteredProducts = highnessProducts.filter((product) => {
    if (product.status !== 'active') return false;

    const matchesCategory =
      categoryFilter === 'all' || product.category_id === categoryFilter;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      product.name_ko.toLowerCase().includes(q) ||
      product.name_en.toLowerCase().includes(q) ||
      product.model_code.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-amber-50">
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-price-tag-3-line text-amber-600 text-lg w-5 h-5 flex items-center justify-center" />
          <h3 className="text-base font-bold text-gray-800">제품 단가 관리</h3>
        </div>
        <p className="text-xs text-gray-600">
          각 제품의 단가를 설정하면 주문 시 해당 가격이 적용됩니다. 키트 제품은 Simple/Full 옵션별 가격을 별도로 관리할 수 있습니다.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        {/* Search input */}
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm w-4 h-4 flex items-center justify-center" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제품명 또는 모델코드로 검색..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#2B5F9E] focus:ring-2 focus:ring-[#2B5F9E]/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-gray-400 text-xs" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categoryTabs.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat.key
                  ? 'bg-[#2B5F9E] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
              <span className="ml-1 opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Filter summary & reset */}
        {(searchQuery || categoryFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-600">
              <span className="font-semibold text-[#2B5F9E]">{filteredProducts.length}</span> 개 제품
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
              className="text-xs text-gray-500 hover:text-[#2B5F9E] flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-refresh-line w-3 h-3 flex items-center justify-center" />
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="max-h-[600px] overflow-y-auto">
        {filteredProducts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((product) => {
              const currentBasePrice = prices[product.id] ?? product.base_price;
              const isEditing = editingId === product.id;
              const hasKitOptions =
                typeof product.kit_price_simple === 'number' &&
                typeof product.kit_price_full === 'number';
              const kitSimple = kitPrices?.[product.id]?.simple ?? product.kit_price_simple;
              const kitFull = kitPrices?.[product.id]?.full ?? product.kit_price_full;
              const isKit = product.category_id === 'gauge-kit' && Array.isArray(product.kit_components) && product.kit_components.length > 0;

              return (
                <div
                  key={product.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${isKit ? 'bg-amber-50/30' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Product image */}
                    <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={product.image_url}
                        alt={product.name_ko}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">{product.name_ko}</h4>
                        <span className="bg-[#2B5F9E]/10 text-[#2B5F9E] text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0">
                          {product.model_code}
                        </span>
                        {isKit && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0">
                            KIT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">{product.name_en}</p>
                    </div>

                    {/* Base price column */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing && editingField === 'base' ? (
                        <>
                          <div className="flex items-center border border-[#2B5F9E] rounded-lg overflow-hidden bg-white">
                            <span className="px-2 text-xs text-gray-500">₩</span>
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave(product.id);
                                if (e.key === 'Escape') handleCancel();
                              }}
                              className="w-24 px-2 py-1.5 text-sm text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              autoFocus
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSave(product.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                          >
                            <i className="ri-check-line text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors cursor-pointer"
                          >
                            <i className="ri-close-line text-sm" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">
                              ₩{currentBasePrice.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {hasKitOptions ? '기본가' : '/ 개'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEdit(product.id, currentBasePrice, 'base')}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Kit price controls */}
                  {hasKitOptions && (
                    <div className="mt-3 ml-16 grid grid-cols-2 gap-3">
                      {/* Simple Kit */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase">
                              Simple Kit
                            </span>
                          </div>
                          {isEditing && editingField === 'simple' ? (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center border border-emerald-400 rounded-md overflow-hidden bg-white">
                                <span className="px-1.5 text-[10px] text-gray-500">₩</span>
                                <input
                                  type="number"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave(product.id);
                                    if (e.key === 'Escape') handleCancel();
                                  }}
                                  className="w-20 px-1 py-1 text-xs text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  autoFocus
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSave(product.id)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-emerald-500 text-white cursor-pointer"
                              >
                                <i className="ri-check-line text-[10px]" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancel}
                                className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 text-gray-600 cursor-pointer"
                              >
                                <i className="ri-close-line text-[10px]" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-emerald-700">
                                ₩{(kitSimple ?? 0).toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEdit(product.id, kitSimple ?? 0, 'simple')}
                                className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                              >
                                <i className="ri-edit-line text-[10px]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Full Kit */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#2B5F9E]" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase">
                              Full Kit
                            </span>
                          </div>
                          {isEditing && editingField === 'full' ? (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center border border-[#2B5F9E] rounded-md overflow-hidden bg-white">
                                <span className="px-1.5 text-[10px] text-gray-500">₩</span>
                                <input
                                  type="number"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave(product.id);
                                    if (e.key === 'Escape') handleCancel();
                                  }}
                                  className="w-20 px-1 py-1 text-xs text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  autoFocus
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSave(product.id)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-[#2B5F9E] text-white cursor-pointer"
                              >
                                <i className="ri-check-line text-[10px]" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancel}
                                className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 text-gray-600 cursor-pointer"
                              >
                                <i className="ri-close-line text-[10px]" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#2B5F9E]">
                                ₩{(kitFull ?? 0).toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEdit(product.id, kitFull ?? 0, 'full')}
                                className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                              >
                                <i className="ri-edit-line text-[10px]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ri-search-line text-2xl text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">검색 결과가 없습니다</p>
            <p className="text-xs text-gray-400">다른 검색어나 카테고리를 시도해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
