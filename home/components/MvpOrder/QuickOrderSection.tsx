import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { HignessProduct } from '../../../../mocks/highness-catalog';
import type { ProductOption } from '../../../../hooks/useProducts';
import QuickOrderCard, { QuickOrderCartParams } from './QuickOrderCard';

interface QuickOrderItem {
  productId: string;
  productName: string;
  productCode?: string;
  selectedOptionModelCode?: string;
  sizeInfo?: string;
  unitPrice: number;
  quantity: number;
}

interface ScoredProduct {
  product: HignessProduct;
  score: number;
  orderCount: number;
  lastOrderedAt: string;
  recentItem?: QuickOrderItem;
}

interface QuickOrderSectionProps {
  activeProducts: HignessProduct[];
  prices: Record<string, number>;
  onBulkAddToCart: (items: {
    product: HignessProduct;
    quantity: number;
    unitPrice: number;
    selectedOptionId?: string;
    selectedOptionModelCode?: string;
    sizeInfo?: string;
    selectedOptions?: Record<string, string>;
  }[]) => void;
  clientBusinessNumber?: string;
  isLoggedIn: boolean;
  productOptions?: Record<string, ProductOption[]>;
}

const STORAGE_KEY = 'reorder_pinned_products';

export default function QuickOrderSection({
  activeProducts,
  prices,
  onBulkAddToCart,
  clientBusinessNumber,
  isLoggedIn,
  productOptions = {},
}: QuickOrderSectionProps) {
  const [scoredProducts, setScoredProducts] = useState<ScoredProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  /* ── 즐겨찾기 상태 ── */
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [favSortOrder, setFavSortOrder] = useState<Record<string, number>>({});
  const [favTogglingId, setFavTogglingId] = useState<string | null>(null);
  const [starToast, setStarToast] = useState<{ msg: string; type: 'add' | 'remove' } | null>(null);
  const starToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── 재주문 핀 상태 ── */
  const [reorderPinnedIds, setReorderPinnedIds] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── 즐겨찾기 로드 ── */
  const fetchFavorites = useCallback(async () => {
    if (!clientBusinessNumber) return;
    const { data, error } = await supabase
      .from('quick_order_favorites')
      .select('product_id, sort_order')
      .eq('client_business_number', clientBusinessNumber)
      .order('sort_order', { ascending: true });
    if (!error && data) {
      setFavoritedIds(new Set(data.map((r) => r.product_id)));
      const so: Record<string, number> = {};
      data.forEach((r) => { so[r.product_id] = r.sort_order; });
      setFavSortOrder(so);
    }
  }, [clientBusinessNumber]);

  /* ── 즐겨찾기 토글 ── */
  const toggleFavorite = useCallback(async (productId: string, productName: string) => {
    if (!clientBusinessNumber || favTogglingId) return;
    setFavTogglingId(productId);
    const isFav = favoritedIds.has(productId);

    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (isFav) {
        await supabase
          .from('quick_order_favorites')
          .delete()
          .eq('client_business_number', clientBusinessNumber)
          .eq('product_id', productId);
        showStarToast(`${productName} 즐겨찾기 해제`, 'remove');
      } else {
        const maxOrder = Math.max(0, ...Object.values(favSortOrder)) + 1;
        await supabase
          .from('quick_order_favorites')
          .insert({ client_business_number: clientBusinessNumber, product_id: productId, sort_order: maxOrder });
        setFavSortOrder((prev) => ({ ...prev, [productId]: maxOrder }));
        showStarToast(`${productName} 즐겨찾기 추가!`, 'add');
      }
    } catch {
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } finally {
      setFavTogglingId(null);
    }
  }, [clientBusinessNumber, favoritedIds, favSortOrder, favTogglingId]);

  const showStarToast = (msg: string, type: 'add' | 'remove') => {
    if (starToastTimerRef.current) clearTimeout(starToastTimerRef.current);
    setStarToast({ msg, type });
    starToastTimerRef.current = setTimeout(() => setStarToast(null), 2000);
  };

  /* ── 재주문 핀 ── */
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const ids: string[] = JSON.parse(raw);
        setReorderPinnedIds(ids.filter(Boolean));
      } catch { /* ignore */ }
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* ── 주문 이력 기반 스코어링 ── */
  const fetchAndScore = useCallback(async () => {
    if (!clientBusinessNumber || activeProducts.length === 0) return;
    setLoading(true);
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('notes, order_date')
        .eq('client_business_number', clientBusinessNumber)
        .gte('order_date', ninetyDaysAgo.toISOString())
        .order('order_date', { ascending: false })
        .limit(50);

      if (error || !orders || orders.length === 0) {
        setIsNewUser(true);
        setLoading(false);
        return;
      }

      const productMap = new Map<string, { count: number; latestDate: string; latestItem: QuickOrderItem }>();
      const now = Date.now();

      orders.forEach((order) => {
        if (!order.notes) return;
        let parsed: { items?: QuickOrderItem[] } = {};
        try { parsed = JSON.parse(order.notes); } catch { return; }
        const items: QuickOrderItem[] = parsed.items || [];
        const orderDate = order.order_date || new Date().toISOString();
        const daysAgo = (now - new Date(orderDate).getTime()) / (1000 * 60 * 60 * 24);
        const multiplier = daysAgo <= 30 ? 2.0 : daysAgo <= 60 ? 1.3 : 1.0;

        items.forEach((item) => {
          if (!item.productId) return;
          const existing = productMap.get(item.productId);
          if (!existing || orderDate > existing.latestDate) {
            productMap.set(item.productId, {
              count: (existing?.count ?? 0) + multiplier,
              latestDate: orderDate,
              latestItem: item,
            });
          } else {
            existing.count += multiplier;
          }
        });
      });

      if (productMap.size === 0) {
        setIsNewUser(true);
        setLoading(false);
        return;
      }

      const scored: ScoredProduct[] = [];
      productMap.forEach((val, pid) => {
        const product = activeProducts.find((p) => p.id === pid);
        if (!product) return;
        scored.push({
          product,
          score: val.count,
          orderCount: Math.round(val.count),
          lastOrderedAt: val.latestDate,
          recentItem: val.latestItem,
        });
      });

      scored.sort((a, b) => b.score - a.score);
      const top10 = scored.slice(0, 10);
      setScoredProducts(top10);
      setIsNewUser(false);
    } catch {
      setIsNewUser(true);
    } finally {
      setLoading(false);
    }
  }, [clientBusinessNumber, activeProducts]);

  useEffect(() => {
    if (isLoggedIn && clientBusinessNumber) {
      fetchAndScore();
      fetchFavorites();
    } else if (!isLoggedIn) {
      setIsNewUser(true);
    }
  }, [isLoggedIn, clientBusinessNumber, fetchAndScore, fetchFavorites]);

  /* ── 신규 유저 추천 상품 ── */
  const recommendedProducts: ScoredProduct[] = isNewUser
    ? activeProducts.slice(0, 8).map((p) => ({
        product: p,
        score: 0,
        orderCount: 0,
        lastOrderedAt: '',
        recentItem: undefined,
      }))
    : [];

  /* ── 최종 표시 목록 구성 ── */
  const buildDisplayList = (): Array<ScoredProduct & { isFavorite: boolean; isReorderPin: boolean }> => {
    if (isNewUser) {
      return recommendedProducts.map((sp) => ({ ...sp, isFavorite: false, isReorderPin: false }));
    }

    const allScored = scoredProducts;
    const scoredMap = new Map(allScored.map((sp) => [sp.product.id, sp]));

    const makeEntry = (
      pid: string,
      isFav: boolean,
      isPin: boolean,
    ): (ScoredProduct & { isFavorite: boolean; isReorderPin: boolean }) | null => {
      const product = activeProducts.find((p) => p.id === pid);
      if (!product) return null;
      const scored = scoredMap.get(pid);
      return {
        product,
        score: scored?.score ?? 0,
        orderCount: scored?.orderCount ?? 0,
        lastOrderedAt: scored?.lastOrderedAt ?? '',
        recentItem: scored?.recentItem,
        isFavorite: isFav,
        isReorderPin: isPin,
      };
    };

    const seen = new Set<string>();
    const result: Array<ScoredProduct & { isFavorite: boolean; isReorderPin: boolean }> = [];

    /* 1. 즐겨찾기 */
    const favIds = [...favoritedIds].sort((a, b) => (favSortOrder[a] ?? 0) - (favSortOrder[b] ?? 0));
    favIds.forEach((pid) => {
      if (seen.has(pid)) return;
      const entry = makeEntry(pid, true, false);
      if (entry) { result.push(entry); seen.add(pid); }
    });

    /* 2. 재주문 핀 */
    reorderPinnedIds.forEach((pid) => {
      if (seen.has(pid)) return;
      const entry = makeEntry(pid, false, true);
      if (entry) { result.push(entry); seen.add(pid); }
    });

    /* 3. 일반 스코어 순 */
    allScored.forEach((sp) => {
      if (seen.has(sp.product.id) || result.length >= 12) return;
      result.push({ ...sp, isFavorite: false, isReorderPin: false });
      seen.add(sp.product.id);
    });

    return result;
  };

  const displayList = buildDisplayList();

  const getQty = (pid: string) => quantities[pid] ?? 1;

  const handleQtyChange = (pid: string, delta: number) => {
    setQuantities((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] ?? 1) + delta) }));
  };

  const handleAddToCart = (params: QuickOrderCartParams) => {
    onBulkAddToCart([{
      product: params.product,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      selectedOptionId: params.selectedOptionId,
      selectedOptionModelCode: params.selectedOptionModelCode,
      sizeInfo: params.sizeInfo,
      selectedOptions: params.sizeInfo ? { '규격': params.sizeInfo } : undefined,
    }]);
    setAddedMap((prev) => ({ ...prev, [params.product.id]: true }));
    setTimeout(() => setAddedMap((prev) => ({ ...prev, [params.product.id]: false })), 1500);
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="mb-6 md:mb-8">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse mb-3 w-48"></div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-44 h-52 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (displayList.length === 0) return null;

  const hasFavorites = favoritedIds.size > 0;
  const hasReorderPin = reorderPinnedIds.length > 0;
  const sectionLabel = isNewUser ? '추천 상품' : hasFavorites ? '즐겨찾기 · 자주 주문' : '자주 주문';
  const sectionDesc = isNewUser
    ? '인기 제품을 빠르게 담아보세요'
    : hasFavorites
    ? '⭐ 즐겨찾기 상품이 상단에 고정됩니다'
    : hasReorderPin
    ? '재주문 상품이 상단에 고정되었습니다'
    : '최근 90일 주문 기반 빠른 재주문';

  return (
    <div className="mb-6 md:mb-8 bg-[#F8FAFF] border border-[#E8EEFF] rounded-xl p-4 md:p-5 relative">
      {/* 별 토스트 */}
      {starToast && (
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all ${
            starToast.type === 'add' ? 'bg-amber-400 text-amber-900' : 'bg-gray-200 text-gray-600'
          }`}
        >
          <i className={`${starToast.type === 'add' ? 'ri-star-fill' : 'ri-star-line'} text-sm`}></i>
          {starToast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center bg-[#2B5F9E]/10 rounded-lg">
            <i className={`text-[#2B5F9E] text-sm ${hasFavorites ? 'ri-star-fill' : 'ri-history-line'}`}></i>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A] whitespace-nowrap">{sectionLabel}</h3>
            <p className="text-[10px] text-[#999999] leading-tight">{sectionDesc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!isNewUser && (
            <span className="text-[9px] text-[#2B5F9E]/60 bg-[#2B5F9E]/8 px-2 py-0.5 rounded-full border border-[#2B5F9E]/15 whitespace-nowrap">
              ⭐ 탭해서 고정
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#E8EEFF] transition-colors cursor-pointer text-[#666666]"
          >
            <i className={`text-sm ri-${collapsed ? 'arrow-down-s-line' : 'arrow-up-s-line'}`}></i>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {displayList.map((entry) => (
            <QuickOrderCard
              key={entry.product.id}
              entry={entry}
              productOptions={productOptions[entry.product.id] ?? []}
              prices={prices}
              qty={getQty(entry.product.id)}
              added={addedMap[entry.product.id] ?? false}
              isNewUser={isNewUser}
              onQtyChange={handleQtyChange}
              onAddToCart={handleAddToCart}
              onToggleFavorite={toggleFavorite}
              isTogglingFavorite={favTogglingId === entry.product.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
