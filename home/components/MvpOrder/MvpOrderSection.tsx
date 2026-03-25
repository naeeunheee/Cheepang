import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts, fetchProductOptionsByIds } from '../../../../hooks/useProducts';
import type { ProductOption } from '../../../../hooks/useProducts';
import { inferCategoryId } from '../../../../hooks/useProducts';
import {
  highnessCategories,
  HignessProduct,
  MvpOrderItem,
  MvpOrder,
  OrderStatus,
} from '../../../../mocks/highness-catalog';
import { ComponentItem } from './ProductCard';
import GroupedProductCard from './GroupedProductCard';
import CartPanel from './CartPanel';
import OrderList from './OrderList';
import AdminPricePanel from './AdminPricePanel';
import OrderExport, { generateOrderId, buildOrderText } from './OrderExport';
import PointBadge from './PointBadge';
import ChargeModal from './ChargeModal';
import CardPaymentModal from './CardPaymentModal';
import QuickOrderSection from './QuickOrderSection';
import DenforceOrderSection from './DenforceOrderSection';
import PhotoUploadOrder from './PhotoUploadOrder';
import KakaoOrderSection from './KakaoOrderSection';
import { usePoints } from '../../../../hooks/usePoints';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { notifyAdminNewOrder } from '../../../../utils/kakaoNotify';

type ViewTab = 'shop' | 'cart' | 'orders' | 'admin';
type OrderMethodTab = 'product' | 'photo' | 'kakao';

// ── 직접 매칭 방식으로 price_tiers에서 단가 조회 ──
function getProductPrice(
  product: { model_code?: string; unit_price?: number; base_price?: number },
  priceTiers: Record<string, unknown>[],
  tier: string | null,
): number {
  if (!priceTiers || priceTiers.length === 0) {
    return (product.base_price as number) || (product.unit_price as number) || 0;
  }

  const modelCode = (product.model_code || '').toUpperCase().trim();

  if (!modelCode) {
    return (product.base_price as number) || (product.unit_price as number) || 0;
  }

  // 매칭 1: model_code === product_code (정확히 일치)
  let match = priceTiers.find(
    (p) => ((p.product_code as string) || '').toUpperCase().trim() === modelCode,
  );

  // 매칭 2: model_code가 product_code로 시작
  if (!match) {
    match = priceTiers.find((p) => {
      const pc = ((p.product_code as string) || '').toUpperCase().trim();
      return pc && modelCode.startsWith(pc);
    });
  }

  // 매칭 3: product_code가 model_code로 시작
  if (!match) {
    match = priceTiers.find((p) => {
      const pc = ((p.product_code as string) || '').toUpperCase().trim();
      return pc && pc.startsWith(modelCode);
    });
  }

  // 매칭 4: 특수 매핑 테이블
  if (!match) {
    const MAP: Record<string, string> = {
      'HSI': 'FIXTURE', 'HS7': 'FIXTURE', 'HS1': 'FIXTURE',
      'HSO-': 'NEXTURE', 'HSO': 'NEXTURE', 'HSO7-': 'NEXTURE7', 'HSO7': 'NEXTURE7',
      'HDB20': 'HDB', 'HDB10': 'HDB',
      'HDB-B': 'HDB-S', 'HDAB': 'ANGLED-BASE',
      'HDABC': 'HDABC', 'HDBCG': 'CUFF-GAUGE', 'HDBG': 'BASE-GAUGE',
      'HDLS100': 'LINK-SCREW', 'BLA 45S': 'LAB-ANALOG',
      'TP-HC': 'TP-HC', 'TP-HD': 'TP-HD', 'TP-HHD': 'TP-HHD',
      'TP-BA': 'TP-BA', 'TP-SB': 'TP-SB', 'TP-BH': 'TP-BH', 'TP-BL': 'TP-BL',
    };
    const mapped = MAP[modelCode] || MAP[product.model_code || ''];
    if (mapped) {
      match = priceTiers.find(
        (p) => ((p.product_code as string) || '').toUpperCase().trim() === mapped.toUpperCase(),
      );
    }
  }

  if (!match) {
    return (product.base_price as number) || (product.unit_price as number) || 0;
  }

  if (!tier) {
    return (match.consumer_price as number) || 0;
  }

  const priceKey = 'price_' + tier;
  return (match[priceKey] as number) || (match.consumer_price as number) || 0;
}

const TIER_STYLE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  1000:  { label: '1000',  bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  2000:  { label: '2000',  bg: '#DBEAFE', text: '#1D40AE', border: '#93C5FD' },
  3000:  { label: '3000',  bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  5000:  { label: '5000',  bg: '#FFEDD5', text: '#9A3412', border: '#FCA67A' },
  10000: { label: '10000 \u2605VIP', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
} as unknown as Record<string, { label: string; bg: string; text: string; border: string }>;

export default function MvpOrderSection() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { businessNo, clinicName, role, isAdmin: authIsAdmin } = useAuth();
  const sessionIsAdmin = authIsAdmin;

  const [isAdmin, setIsAdmin] = useState(sessionIsAdmin);
  const [activeTab, setActiveTab] = useState<ViewTab>('shop');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 주요취급품목에서 카테고리 클릭 시 자동 필터
  useEffect(() => {
    const handleCategoryFilter = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setCategoryFilter(detail);
    };
    window.addEventListener('chipang-category-filter', handleCategoryFilter);
    return () => window.removeEventListener('chipang-category-filter', handleCategoryFilter);
  }, []);

  const [cartItems, setCartItems] = useState<MvpOrderItem[]>([]);
  const [orders, setOrders] = useState<MvpOrder[]>([]);
  const [clientPackageTier, setClientPackageTier] = useState<string | null>(null);

  const { products: supabaseProducts, loading: productsLoading } = useProducts();

  // ── Denforce 소모품 제품 분리 ──
  const denforceProducts = useMemo(() =>
    supabaseProducts
      .filter(p => {
        const cat = (p as unknown as Record<string, string>).category;
        return p.status === 'active' && (cat === '소장비' || cat === '기타 소모재료');
      })
      .map(p => {
        const raw = p as unknown as Record<string, unknown>;
        return {
          id: p.id,
          name_ko: p.name_ko || p.name || '',
          name_en: p.name_en || '',
          model_code: p.model_code || '',
          category: (raw.category as string) || '',
          unit_price: p.unit_price || 0,
          pricing_type: (raw.pricing_type as string) || 'fixed',
          image_url: p.image_url || '',
          short_description: p.short_description || '',
        };
      }),
    [supabaseProducts]
  );

  // ── 하이니스 제품만 (소모품 제외) ──
  const activeProducts: HignessProduct[] = useMemo(() =>
    supabaseProducts
      .filter(p => {
        const cat = (p as unknown as Record<string, string>).category;
        return p.status === 'active' && cat !== '소장비' && cat !== '기타 소모재료';
      })
      .map(p => {
        const resolvedCategoryId =
          p.category_id && p.category_id.trim() !== ''
            ? p.category_id
            : inferCategoryId(p.name_ko || p.name || '');
        return {
          id: p.id,
          name_ko: p.name_ko || p.name || '',
          name_en: p.name_en || '',
          model_code: p.model_code || '',
          category_id: resolvedCategoryId,
          short_description: p.short_description || '',
          short_desc: p.short_description || '',
          image_url: p.image_url || '',
          image_fit: p.image_fit || 'contain',
          base_price: p.unit_price || 0,
          status: p.status as 'active' | 'inactive',
          sort_order: p.sort_order || 0,
          options: p.options || [],
          features: p.features_json || [],
          specs: p.specs_json || [],
          spec_images: p.spec_image_urls || [],
          related_product_ids: p.related_product_ids || [],
          kit_components: p.kit_components || [],
        };
      }),
    [supabaseProducts]
  );

  // ── product_options 일괄 로드 ──
  const [productOptionsMap, setProductOptionsMap] = useState<Record<string, ProductOption[]>>({});
  const [optionsLoading, setOptionsLoading] = useState(false);

  // 제품 목록이 로드되면 product_options 일괄 조회
  useEffect(() => {
    if (activeProducts.length === 0) return;
    const ids = activeProducts.map(p => p.id);
    setOptionsLoading(true);
    fetchProductOptionsByIds(ids)
      .then(map => {
        // diameter_options가 있지만 product_options 항목이 없는 제품: 자동으로 가상 옵션 생성
        const merged: Record<string, ProductOption[]> = { ...map };
        supabaseProducts
          .filter(p => p.status === 'active' && p.diameter_options)
          .forEach(p => {
            // 이미 product_options 항목이 있으면 건드리지 않음
            if (merged[p.id] && merged[p.id].length > 0) return;
            const opts = (p.diameter_options as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
            if (opts.length > 0) {
              merged[p.id] = opts.map((opt: string, i: number) => ({
                id: `syn-${p.id}-${i}`,
                product_id: p.id,
                model_code: p.model_code || '',
                size_info: opt,
              }));
            }
          });
        setProductOptionsMap(merged);
      })
      .finally(() => setOptionsLoading(false));
  }, [activeProducts.length]);

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [consumerPrices, setConsumerPrices] = useState<Record<string, number>>({});

  // base_price 초기값 세팅
  useEffect(() => {
    if (activeProducts.length === 0) return;
    const p: Record<string, number> = {};
    const cp: Record<string, number> = {};
    activeProducts.forEach((prod) => {
      p[prod.id] = prod.base_price;
      cp[prod.id] = prod.base_price;
    });
    setPrices(p);
    setConsumerPrices(cp);
  }, [activeProducts]);

  const [kitPrices, setKitPrices] = useState<Record<string, { simple?: number; full?: number }>>({});

  useEffect(() => {
    if (activeProducts.length === 0) return;
    const kp: Record<string, { simple?: number; full?: number }> = {};
    activeProducts.forEach((prod) => {
      if (prod.kit_price_simple !== undefined || prod.kit_price_full !== undefined) {
        kp[prod.id] = { simple: prod.kit_price_simple, full: prod.kit_price_full };
      }
    });
    setKitPrices(kp);
  }, [activeProducts]);

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [clientName, setClientName] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOrderId, setExportOrderId] = useState('');
  const [exportClientName, setExportClientName] = useState('');
  const [exportItems, setExportItems] = useState<MvpOrderItem[]>([]);
  const [showExportNameModal, setShowExportNameModal] = useState(false);
  const [exportNameInput, setExportNameInput] = useState('');
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [pointDeductError, setPointDeductError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false);
  const [showKakaoNotify, setShowKakaoNotify] = useState(false);
  const [kakaoNotifyData, setKakaoNotifyData] = useState<{ orderId: string; clientName: string; totalAmount: number; items: MvpOrderItem[]; remainingBalance?: number } | null>(null);
  const [postPaymentBalance, setPostPaymentBalance] = useState<number | null>(null);

  const { getClientPoint, deductPoints, chargePoints, refresh: refreshPoints } = usePoints();

  const getCurrentClient = () => {
    if (!businessNo || role !== 'dental') return null;
    return {
      id: businessNo,
      name: clinicName || businessNo,
      businessNumber: businessNo,
    };
  };
  const currentClient = getCurrentClient();
  const clientPoint = currentClient ? getClientPoint(currentClient.businessNumber) : undefined;

  const totalCartAmount = cartItems.reduce((sum, item) => {
    const compTotal = (item.components ?? []).reduce((cs, c) => cs + c.unitPrice * c.quantity, 0);
    return sum + (item.totalPrice ?? 0) + compTotal;
  }, 0);

  // ── 개별 장바구니 담기 (기존 호환) ──
  const handleAddToCart = useCallback(
    (
      productId: string,
      productName: string,
      modelCode: string,
      options: Record<string, string>,
      quantity: number,
      unitPrice: number,
      components?: ComponentItem[],
    ) => {
      const newItem: MvpOrderItem = {
        productId,
        productName,
        productCode: modelCode,
        selectedOptions: options,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        components: components?.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          productCode: c.productCode,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
      };
      setCartItems((prev) => [...prev, newItem]);
    },
    [],
  );

  // ── 그룹 일괄 장바구니 담기 ──
  const handleBulkAddToCart = useCallback(
    (items: {
      product: HignessProduct;
      quantity: number;
      unitPrice: number;
      selectedOptionId?: string;
      selectedOptionModelCode?: string;
      sizeInfo?: string;
      selectedOptions?: Record<string, string>;
    }[]) => {
      const newItems: MvpOrderItem[] = items.map(({ product, quantity, unitPrice, selectedOptionId, selectedOptionModelCode, sizeInfo, selectedOptions }) => ({
        productId: product.id,
        productName: product.name_ko,
        productCode: selectedOptionModelCode || product.model_code,
        selectedOptionId,
        selectedOptionModelCode,
        sizeInfo,
        selectedOptions: selectedOptions ?? (sizeInfo ? { '\uaddc\uaca9': sizeInfo } : {}),
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
      }));
      setCartItems((prev) => [...prev, ...newItems]);
    },
    [],
  );

  const handleRemoveFromCart = useCallback((index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity, totalPrice: item.unitPrice * quantity } : item,
      ),
    );
  }, []);

  // 인증 상태 + 패키지 티어 조회
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!currentClient) return;
      try {
        const rawBizNo = currentClient.businessNumber || '';
        const cleanBizNo = rawBizNo.replace(/-/g, '');
        const { data, error } = await supabase
          .from('clients')
          .select('package_tier')
          .or(
            `business_number.eq.${cleanBizNo},business_no.eq.${cleanBizNo},business_number.eq.${rawBizNo},business_no.eq.${rawBizNo}`,
          )
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          if (data.package_tier) setClientPackageTier(String(data.package_tier));
        }
      } catch (err) {
        console.error('거래처 정보 조회 실패:', err);
      }
    };
    fetchClientInfo();
  }, [currentClient]);

  // ── 가격 로드 (소비자가 + 패키지 단가 통합) ──
  useEffect(() => {
    const loadPrices = async () => {
      if (activeProducts.length === 0) return;

      try {
        // price_tiers 전체 로드
        const { data: priceTiers } = await supabase
          .from('price_tiers')
          .select('*');

        if (!priceTiers || priceTiers.length === 0) return;

        const newConsumerPrices: Record<string, number> = {};
        const newPrices: Record<string, number> = {};

        // 소비자가 세팅 + prices도 소비자가로 초기화 (비로그인 기본값)
        activeProducts.forEach((prod) => {
          const cp = getProductPrice(prod, priceTiers as Record<string, unknown>[], null);
          if (cp > 0) {
            newConsumerPrices[prod.id] = cp;
            newPrices[prod.id] = cp; // 기본값: 소비자가
          }
        });

        if (Object.keys(newConsumerPrices).length > 0) {
          setConsumerPrices((prev) => ({ ...prev, ...newConsumerPrices }));
        }

        // 로그인 상태면 패키지 단가로 덮어쓰기
        if (currentClient) {
          const rawBizNo = currentClient.businessNumber || '';
          const cleanBizNo = rawBizNo.replace(/-/g, '');

          const { data: clientData } = await supabase
            .from('clients').select('package_tier')
            .or(
              `business_number.eq.${cleanBizNo},business_no.eq.${cleanBizNo},business_number.eq.${rawBizNo},business_no.eq.${rawBizNo}`,
            )
            .limit(1)
            .maybeSingle();

          const tier = clientData?.package_tier ? String(clientData.package_tier) : null;
          if (tier) setClientPackageTier(tier);

          // 패키지 단가 적용 (소비자가 위에 덮어쓰기)
          activeProducts.forEach((prod) => {
            const pkgPrice = getProductPrice(prod, priceTiers as Record<string, unknown>[], tier);
            if (pkgPrice > 0) newPrices[prod.id] = pkgPrice;
          });
        }

        if (Object.keys(newPrices).length > 0) {
          setPrices((prev) => ({ ...prev, ...newPrices }));
        }
      } catch (err) {
        console.error('가격 로드 실패:', err);
      }
    };

    loadPrices();
  }, [activeProducts.length, currentClient?.businessNumber]);

  // ✅ 결제 중복 실행 방지 락
  const paymentLockRef = useRef(false);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowCardPaymentModal(true);
  };

  const sendKakaoOrderNotify = (orderId: string, cName: string, amount: number, items: MvpOrderItem[]) => {
    const text = buildOrderText(items, cName, orderId);
    const encoded = encodeURIComponent(text);
    window.open(`https://sharer.kakao.com/talk/friends/picker/shorturl?url=&text=${encoded}`, '_blank', 'width=480,height=640');
  };

  const handlePaymentConfirm = async (
    paymentMethod: 'point' | 'card',
    _cardInfo?: { cardNumber: string; expiryDate: string; cvc: string; cardHolder: string },
  ) => {
    if (paymentLockRef.current) return;
    paymentLockRef.current = true;

    setShowCardPaymentModal(false);
    setPointDeductError('');

    if (!currentClient) { paymentLockRef.current = false; return; }

    try {
      // 1. 사업자번호 정규화
      const bizNo = (currentClient.businessNumber || '').replace(/-/g, '');

      // 2. clients 테이블에서 잔액 조회 (client_points 사용 안 함!)
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name, outstanding_balance')
        .or(`business_number.eq.${bizNo},business_no.eq.${bizNo}`)
        .limit(1)
        .maybeSingle();

      if (clientError || !client) {
        alert('거래처 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.');
        paymentLockRef.current = false;
        return;
      }

      // 3. 잔액 확인 (outstanding_balance가 음수면 사용 가능 잔액)
      const available = Math.abs(Math.min(client.outstanding_balance || 0, 0));
      if (totalCartAmount > available) {
        alert(`잔액이 부족합니다. 사용 가능 잔액: ₩${available.toLocaleString()} / 주문금액: ₩${totalCartAmount.toLocaleString()}\n중부지사에 문의해주세요. (010-8950-3379)`);
        paymentLockRef.current = false;
        return;
      }

      // 4. 주문 저장
      const orderNumber = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);

      const orderData = {
        client_id: client.id,
        client_name: client.name,
        client_business_number: bizNo,
        order_number: orderNumber,
        product_name: cartItems.map(i => i.productName + (i.sizeInfo ? ` (${i.sizeInfo})` : '')).join(', '),
        quantity: cartItems.reduce((s, i) => s + i.quantity, 0),
        unit_price: cartItems[0]?.unitPrice || 0,
        total_price: totalCartAmount,
        status: '주문접수',
        order_date: new Date().toISOString(),
        notes: JSON.stringify({
          paymentMethod: '잔액차감',
          items: cartItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,
            selectedOptionModelCode: item.selectedOptionModelCode,
            sizeInfo: item.sizeInfo,
            selectedOptions: item.selectedOptions,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            components: item.components || [],
          })),
        }),
      };

      console.log('[주문저장] 데이터:', orderData);

      const { error: orderError } = await supabase
        .from('orders')
        .insert(orderData);

      if (orderError) {
        console.error('[주문저장] 실패:', orderError);
        alert('주문 저장 실패: ' + orderError.message);
        paymentLockRef.current = false;
        return;
      }

      console.log('[주문저장] 성공');

      // 5. 잔액 차감 (실패해도 주문은 유지)
      try {
        const newBalance = (client.outstanding_balance || 0) + totalCartAmount;
        await supabase
          .from('clients')
          .update({ outstanding_balance: newBalance })
          .eq('id', client.id);
        console.log('[잔액차감] 성공, 새 잔액:', newBalance);
      } catch (balErr) {
        console.error('[잔액차감] 실패 (주문은 저장됨):', balErr);
      }

      // 6. 관리자 알림 (실패해도 주문 완료 처리)
      try {
        await notifyAdminNewOrder({
          clientName: client.name,
          productName: cartItems.map(item => item.productName).join(', '),
          amount: totalCartAmount,
        });
      } catch (notifyErr) {
        console.error('[알림] 발송 실패 (무시):', notifyErr);
      }

      // 7. 장바구니 초기화 + 페이지 이동
      localStorage.removeItem('chipang_cart');
      localStorage.removeItem('cart');
      // currentClient는 AuthContext에서 자동 관리
      setCartItems([]);
      setCartOpen(false);
      setShowCardPaymentModal(false);
      paymentLockRef.current = false;

      try {
        queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
        queryClient.invalidateQueries({ queryKey: ['client_orders_orders'] });
      } catch (_) { /* ignore */ }

      alert('주문이 완료되었습니다! 주문번호: ' + orderNumber);
      navigate('/my-orders');

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[주문저장] 예외:', err);
      alert('주문 처리 중 오류: ' + errMsg);
      paymentLockRef.current = false;
    }
  };

  const handleExportFromCart = () => {
    if (cartItems.length === 0) return;
    setShowExportNameModal(true);
  };

  const handleConfirmExportName = () => {
    if (!exportNameInput.trim()) return;
    setExportOrderId(generateOrderId());
    setExportClientName(exportNameInput.trim());
    setExportItems([...cartItems]);
    setShowExportNameModal(false);
    setExportNameInput('');
    setCartOpen(false);
    setShowExportModal(true);
  };

  const handleStatusChange = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, []);

  const handlePriceChange = useCallback((productId: string, price: number) => {
    setPrices((prev) => ({ ...prev, [productId]: price }));
  }, []);

  const handleKitPriceChange = useCallback((productId: string, type: 'simple' | 'full', price: number) => {
    setKitPrices((prev) => ({ ...prev, [productId]: { ...prev[productId], [type]: price } }));
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const tabs: { key: ViewTab; label: string; icon: string }[] = isAdmin
    ? [
        { key: 'shop', label: '\uc8fc\ubb38\ud558\uae30', icon: 'ri-store-2-line' },
        { key: 'cart', label: '\uc7a5\ubc14\uad6c\ub2c8', icon: 'ri-shopping-cart-2-line' },
        { key: 'orders', label: '\uc8fc\ubb38 \ub0b4\uc5ed', icon: 'ri-file-list-3-line' },
        { key: 'admin', label: '\ub2e8\uac00 \uad00\ub9ac', icon: 'ri-settings-3-line' },
      ]
    : [
        { key: 'shop', label: '\uc8fc\ubb38\ud558\uae30', icon: 'ri-store-2-line' },
        { key: 'cart', label: '\uc7a5\ubc14\uad6c\ub2c8', icon: 'ri-shopping-cart-2-line' },
        { key: 'orders', label: '\ub0b4 \uc8fc\ubb38', icon: 'ri-file-list-3-line' },
      ];

  const CATEGORY_ORDER = ['fixture', 'abutment', 'scanbody', 'link', 'gauge-kit'];

  const categoryTabs = [
    { key: 'all', label: '\uc804\uccb4', count: activeProducts.length },
    ...highnessCategories
      .slice()
      .sort((a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id))
      .map((c) => ({
        key: c.id,
        label: c.name_ko,
        count: activeProducts.filter((p) => p.category_id === c.id).length,
      }))
      .filter((tab) => tab.count > 0),
  ];

  const filteredProducts = activeProducts.filter((product) => {
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      product.name_ko.toLowerCase().includes(q) ||
      product.name_en.toLowerCase().includes(q) ||
      product.model_code.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const groupedProducts = useMemo(() => {
    return filteredProducts.map(p => ({ name: p.name_ko, products: [p] }));
  }, [filteredProducts]);

  const groupedByCategory = useMemo(() => {
    return highnessCategories
      .slice()
      .sort((a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id))
      .filter((cat) => activeProducts.some((p) => p.category_id === cat.id))
      .map((cat) => {
        const catProducts = activeProducts.filter((p) => p.category_id === cat.id);
        return {
          category: cat,
          groups: catProducts.map(p => ({ name: p.name_ko, products: [p] })),
        };
      });
  }, [activeProducts]);

  // ── Denforce 장바구니 담기 ──
  const handleDenforceAddToCart = useCallback((items: MvpOrderItem[]) => {
    setCartItems((prev) => [...prev, ...items]);
  }, []);

  const [orderMethodTab, setOrderMethodTab] = useState<OrderMethodTab>('product');

  return (
    <section id="mvp-order" className="py-16 md:py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 pb-28">

        {/* ── 주문 방식 탭 ── */}
        <div className="mb-8">
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setOrderMethodTab('product')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                orderMethodTab === 'product'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-shopping-cart-2-line text-sm"></i>
              </div>
              제품 선택 주문
            </button>
            <button
              onClick={() => setOrderMethodTab('photo')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                orderMethodTab === 'photo'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-camera-line text-sm"></i>
              </div>
              간편 주문
            </button>
            <button
              onClick={() => setOrderMethodTab('kakao')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                orderMethodTab === 'kakao'
                  ? 'bg-white text-[#3C1E1E] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-kakao-talk-fill text-sm"></i>
              </div>
              카톡 주문
            </button>
          </div>
        </div>

        {/* ── 사진 업로드 주문 ── */}
        {orderMethodTab === 'photo' && (
          <PhotoUploadOrder />
        )}

        {/* ── 카톡 주문 ── */}
        {orderMethodTab === 'kakao' && (
          <KakaoOrderSection />
        )}

        {/* ── 기존 제품 선택 주문 (변경 없음) ── */}
        {orderMethodTab === 'product' && (
          <>
            <QuickOrderSection
              activeProducts={activeProducts}
              prices={prices}
              onBulkAddToCart={handleBulkAddToCart}
              clientBusinessNumber={currentClient?.businessNumber}
              isLoggedIn={!!currentClient}
              productOptions={productOptionsMap}
            />

            {/* ── 임플란트 사업부 레이블 ── */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 bg-[#2B5F9E]/10 rounded-lg flex items-center justify-center">
                <i className="ri-tooth-line text-[#2B5F9E] text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">임플란트 사업부</h3>
                <p className="text-[10px] text-[#999999]">Highness Implant</p>
              </div>
            </div>

            <div className="mb-6 md:mb-8 space-y-4">
              <div className="relative max-w-md">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999] text-base w-4 h-4 flex items-center justify-center"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제품명 또는 모델코드 검색"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E0E0E0] rounded bg-white focus:outline-none focus:border-[#333333] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                  >
                    <i className="ri-close-line text-[#999999] text-sm"></i>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
                {categoryTabs.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer rounded-t-lg ${
                      categoryFilter === cat.key
                        ? 'text-[#1D4ED8] border-b-[3px] border-[#1D4ED8] bg-[#EEF2FF]'
                        : 'text-[#94A3B8] border-b-[3px] border-transparent hover:text-[#1D4ED8] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {cat.label}
                    <span className="ml-1.5 text-xs opacity-60">({cat.count})</span>
                  </button>
                ))}
              </div>

              {(searchQuery || categoryFilter !== 'all') && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-[#666666]">
                    <span className="font-semibold text-[#333333]">{groupedProducts.length}</span>개 제품
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
                    className="text-xs text-[#999999] hover:text-[#333333] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-refresh-line w-4 h-4 flex items-center justify-center"></i>
                    초기화
                  </button>
                </div>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              categoryFilter === 'all' && !searchQuery ? (
                <div className="space-y-12 md:space-y-16">
                  {groupedByCategory.map(({ category: cat, groups }) => {
                    if (groups.length === 0) return null;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-5 md:mb-6 pb-3 border-b border-[#E0E0E0]">
                          <div>
                            <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A] mb-0.5">{cat.name_ko}</h3>
                            <p className="text-xs text-[#999999]">{cat.name_en}</p>
                          </div>
                          <button
                            onClick={() => setCategoryFilter(cat.id)}
                            className="flex items-center gap-1 text-xs text-[#666666] hover:text-[#333333] cursor-pointer whitespace-nowrap"
                          >
                            전체보기
                            <i className="ri-arrow-right-s-line w-4 h-4 flex items-center justify-center"></i>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                          {groups.map(({ name, products }) => (
                            <GroupedProductCard
                              key={name}
                              groupName={name}
                              products={products}
                              prices={prices}
                              consumerPrices={consumerPrices}
                              isLoggedIn={!!currentClient}
                              clientPackageTier={clientPackageTier}
                              onBulkAddToCart={handleBulkAddToCart}
                              productOptions={productOptionsMap}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                  {groupedProducts.map(({ name, products }) => (
                    <GroupedProductCard
                      key={name}
                      groupName={name}
                      products={products}
                      prices={prices}
                      consumerPrices={consumerPrices}
                      isLoggedIn={!!currentClient}
                      clientPackageTier={clientPackageTier}
                      onBulkAddToCart={handleBulkAddToCart}
                      productOptions={productOptionsMap}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-20">
                <div className="w-14 h-14 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-search-line text-2xl text-[#CCCCCC]"></i>
                </div>
                <h3 className="text-base font-bold text-[#333333] mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-[#999999] mb-5">다른 검색어를 시도해보세요</p>
                <button
                  onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#333333] text-white rounded text-sm font-medium hover:bg-[#000000] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line w-4 h-4 flex items-center justify-center"></i>
                  전체 제품 보기
                </button>
              </div>
            )}

            {/* ── 소모품·재료사업부 영역 ── */}
            <DenforceOrderSection
              products={denforceProducts}
              onAddToCart={handleDenforceAddToCart}
            />
          </>
        )}

        {activeTab === 'cart' && (
          <div className="bg-white rounded-lg border border-[#E0E0E0] overflow-hidden">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-shopping-cart-line text-3xl text-[#CCCCCC]"></i>
                </div>
                <h3 className="text-base font-bold text-[#333333] mb-2">장바구니가 비어있습니다</h3>
                <p className="text-sm text-[#999999] mb-5">제품을 선택하고 장바구니에 담아보세요</p>
                <button onClick={() => setActiveTab('shop')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#333333] text-white rounded text-sm font-medium hover:bg-[#000000] transition-colors cursor-pointer whitespace-nowrap">
                  <i className="ri-store-2-line w-4 h-4 flex items-center justify-center"></i>
                  제품 둘러보기
                </button>
              </div>
            ) : (
              <>
                {/* 장바구니 목록 */}
                <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={index} className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-4 relative">
                      <button onClick={() => handleRemoveFromCart(index)} className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-[#999999] hover:bg-[#E0E0E0] transition-colors cursor-pointer">
                        <i className="ri-close-line text-sm"></i>
                      </button>
                      <div className="pr-8 mb-3">
                        <p className="text-sm font-semibold text-[#1A1A1A]">{item.productName}</p>
                        {item.productCode && <p className="text-xs text-[#999999] font-mono mt-0.5">{item.productCode}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-[#E0E0E0] rounded overflow-hidden bg-white">
                          <button onClick={() => handleUpdateQuantity(index, Math.max(1, (item.quantity ?? 1) - 1))} className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer">
                            <i className="ri-subtract-line text-sm"></i>
                          </button>
                          <span className="w-10 text-center text-sm font-medium border-x border-[#E0E0E0]">{item.quantity ?? 1}</span>
                          <button onClick={() => handleUpdateQuantity(index, (item.quantity ?? 1) + 1)} className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#F5F5F5] cursor-pointer">
                            <i className="ri-add-line text-sm"></i>
                          </button>
                        </div>
                        <p className="text-base font-bold text-[#1A1A1A]">₩{(item.totalPrice ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E0E0E0] p-5 space-y-4 bg-[#FAFAFA]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#666666] font-medium">총 주문금액</span>
                    <span className="text-2xl font-bold text-[#1A1A1A]">₩{totalCartAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleCheckout}
                      className="flex-1 py-3 rounded text-sm font-semibold text-white bg-[#333333] hover:bg-[#000000] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                    >
                      결제하기
                    </button>
                    <button
                      onClick={handleExportFromCart}
                      className="flex-1 py-3 rounded text-sm font-medium border border-[#E0E0E0] text-[#333333] bg-white hover:bg-[#F5F5F5] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <i className="ri-download-2-line text-base w-4 h-4 flex items-center justify-center"></i>
                      주문서 다운로드
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <OrderList orders={orders} onStatusChange={handleStatusChange} isAdmin={isAdmin} />
        )}

        {activeTab === 'admin' && isAdmin && sessionIsAdmin && (
          <AdminPricePanel
            prices={prices}
            onPriceChange={handlePriceChange}
            kitPrices={kitPrices}
            onKitPriceChange={handleKitPriceChange}
          />
        )}

        <CartPanel
          items={cartItems}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onOrder={handleCheckout}
          onExport={handleExportFromCart}
          onCharge={() => { setCartOpen(false); setShowChargeModal(true); }}
          isOpen={cartOpen}
          onToggle={() => setCartOpen(!cartOpen)}
          clientPoint={clientPoint}
          activeProducts={activeProducts}
          prices={prices}
          onQuickAdd={handleBulkAddToCart}
        />

        {showCardPaymentModal && currentClient && (
          <CardPaymentModal
            totalAmount={totalCartAmount}
            clientName={currentClient.name}
            clientPoint={clientPoint?.point_balance}
            cartItems={cartItems}
            businessNumber={currentClient.businessNumber}
            onClose={() => { setShowCardPaymentModal(false); setPointDeductError(''); }}
            onConfirm={handlePaymentConfirm}
          />
        )}

        {showKakaoNotify && kakaoNotifyData && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setShowKakaoNotify(false); setKakaoNotifyData(null); }}></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-md overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-checkbox-circle-fill text-3xl text-emerald-600"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">주문이 완료되었습니다!</h3>
                <p className="text-xs text-gray-500 mb-4">주문번호: <span className="font-semibold text-[#1A1A1A]">{kakaoNotifyData.orderId}</span></p>
                <div className="bg-gray-50 rounded-xl p-3.5 mb-4 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">거래처</span>
                    <span className="text-sm font-semibold text-gray-800">{kakaoNotifyData.clientName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">주문 금액</span>
                    <span className="text-base font-extrabold text-[#1A1A1A]">₩{kakaoNotifyData.totalAmount.toLocaleString()}</span>
                  </div>
                  {kakaoNotifyData.remainingBalance !== undefined && (
                    <div className={`flex items-center justify-between pt-2 mt-2 border-t ${kakaoNotifyData.remainingBalance === 0 ? 'border-red-100' : 'border-gray-100'}`}>
                      <span className="text-xs text-gray-500">차감 후 잔여 잔액</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${kakaoNotifyData.remainingBalance === 0 ? 'text-red-600' : kakaoNotifyData.remainingBalance < 100000 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ₩{kakaoNotifyData.remainingBalance.toLocaleString()}
                        </span>
                        {kakaoNotifyData.remainingBalance === 0 && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">잔액없음</span>
                        )}
                        {kakaoNotifyData.remainingBalance > 0 && kakaoNotifyData.remainingBalance < 100000 && (
                          <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">잔액부족</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {kakaoNotifyData.remainingBalance !== undefined && kakaoNotifyData.remainingBalance < 100000 && (
                  <div className={`rounded-xl p-3 mb-4 text-left flex items-start gap-2 ${kakaoNotifyData.remainingBalance === 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <i className={`text-sm mt-0.5 ${kakaoNotifyData.remainingBalance === 0 ? 'ri-error-warning-line text-red-500' : 'ri-information-line text-amber-500'}`}></i>
                    <p className={`text-xs font-medium ${kakaoNotifyData.remainingBalance === 0 ? 'text-red-700' : 'text-amber-700'}`}>
                      {kakaoNotifyData.remainingBalance === 0
                        ? '잔액이 소진되었습니다. 중부지사에 문의해주세요 (010-8950-3379)'
                        : `잔여 잔액이 ₩${kakaoNotifyData.remainingBalance.toLocaleString()}입니다. 중부지사에 문의해주세요 (010-8950-3379)`}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <button
                    onClick={() => sendKakaoOrderNotify(kakaoNotifyData.orderId, kakaoNotifyData.clientName, kakaoNotifyData.totalAmount, kakaoNotifyData.items)}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835]"
                  >
                    <i className="ri-kakao-talk-fill text-lg w-5 h-5 flex items-center justify-center"></i>
                    카카오톡으로 주문 알림 보내기
                  </button>
                  <button
                    onClick={() => { setShowKakaoNotify(false); setKakaoNotifyData(null); setShowExportModal(true); }}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold border border-[#333333]/30 text-[#333333] bg-white hover:bg-[#F5F5F5] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <i className="ri-file-list-3-line text-sm w-4 h-4 flex items-center justify-center"></i>
                    주문서 보기 / 다운로드
                  </button>
                  {kakaoNotifyData.remainingBalance !== undefined && kakaoNotifyData.remainingBalance < 100000 && (
                    <button
                      onClick={() => { setShowKakaoNotify(false); setKakaoNotifyData(null); setShowChargeModal(true); }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#333333] text-white hover:bg-[#000000] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <i className="ri-add-circle-line text-sm w-4 h-4 flex items-center justify-center"></i>
                      포인트 충전하기
                    </button>
                  )}
                  <button onClick={() => { setShowKakaoNotify(false); setKakaoNotifyData(null); }} className="w-full py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap cursor-pointer">
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {showExportNameModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowExportNameModal(false)}></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="text-base font-bold text-gray-800 mb-1">주문서 전송 / 다운로드</h3>
              <p className="text-xs text-gray-500 mb-4">거래처명을 입력하면 주문요청서를 카카오톡으로 전송하거나 PDF/엑셀로 다운로드할 수 있습니다.</p>
              <input
                type="text"
                value={exportNameInput}
                onChange={(e) => setExportNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmExportName(); }}
                placeholder="예: 서울치과의원"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#333333] focus:ring-2 focus:ring-[#333333]/10"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowExportNameModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer">취소</button>
                <button onClick={handleConfirmExportName} disabled={!exportNameInput.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#000000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer">확인</button>
              </div>
            </div>
          </>
        )}

        {showExportModal && exportItems.length > 0 && (
          <OrderExport items={exportItems} clientName={exportClientName} orderId={exportOrderId} onClose={() => setShowExportModal(false)} />
        )}

        {showChargeModal && currentClient && (
          <ChargeModal
            clientId={currentClient.id}
            clientName={currentClient.name}
            currentBalance={clientPoint?.point_balance ?? 0}
            onClose={() => setShowChargeModal(false)}
            onRequestCharge={(cId, cName, amount, pkgName) => {
              chargePoints(cId, cName, amount, `카드 결제 충전 \u2014 ${pkgName}`);
            }}
          />
        )}
      </div>
    </section>
  );
}
