import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MvpOrder } from '../../mocks/highness-catalog';
import { usePoints } from '../../hooks/usePoints';
import { PointTransactionType } from '../../mocks/points';
import DeliveryStatusModal from '../../components/feature/DeliveryStatusModal';
import { useCustomer, getArBalanceStatus } from '../../hooks/useCustomer';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import DeliveryStatusNotify from '../../components/feature/DeliveryStatusNotify';
import DeliveryTimeline from './components/DeliveryTimeline';
import BackButton from '../../components/feature/BackButton';
import CancelReturnModal from './components/CancelReturnModal';

type DatePreset = 'all' | 'month' | 'last-month' | '3months' | '6months';
type ActiveView = 'orders' | 'points';
type StatusTabFilter = 'all' | '주문접수' | '주문확인' | '배송준비' | '배송중' | '배송완료' | '주문취소' | 'cancel_requested' | 'return_requested' | 'cancelled' | 'returned' | 'photo_order';
type PointTransactionType = 'all' | '충전' | '차감' | '조정' | '정정' | '충전요청';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<MvpOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<MvpOrder[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('orders');
  const [statusTabFilter, setStatusTabFilter] = useState<StatusTabFilter>('all');
  const [pointTypeFilter, setPointTypeFilter] = useState<PointTransactionType | 'all'>('all');
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<MvpOrder | null>(null);
  const [statusToast, setStatusToast] = useState<{ orderId: string; newStatus: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const { getClientPoint, getClientTransactions } = usePoints();
  const { businessNo, clinicName } = useAuth();
  const customer = useCustomer(businessNo || null);

  const [cancelReturnModal, setCancelReturnModal] = useState<{
    open: boolean;
    type: 'cancel' | 'return';
    order: (MvpOrder & { dbId?: string }) | null;
  }>({ open: false, type: 'cancel', order: null });

  const loadData = async () => {
    try {
      if (!businessNo) return;

      const cleanBizNo = businessNo.replace(/-/g, '');

      const orFilter = [
        ...(cleanBizNo ? [`client_business_number.eq.${cleanBizNo}`] : []),
        ...(businessNo !== cleanBizNo ? [`client_business_number.eq.${businessNo}`] : []),
      ].join(',');

      if (!orFilter) {
        setOrders([]);
        setFilteredOrders([]);
        return;
      }

      const { data: supabaseOrders, error } = await supabase
        .from('orders')
        .select('*')
        .or(orFilter)
        .order('order_date', { ascending: false })
        .limit(200);

      if (error) console.error('주문조회 에러:', error);
      console.log('[my-orders] bizNo:', cleanBizNo, '| 조회된 주문 수:', supabaseOrders?.length ?? 0, supabaseOrders);

      if (!error && supabaseOrders && supabaseOrders.length > 0) {
        const convertedOrders: MvpOrder[] = supabaseOrders.map((o: any) => {
          let items: any[] = [];
          try {
            if (o.notes) {
              const parsed = JSON.parse(o.notes);
              if (parsed.items && Array.isArray(parsed.items)) items = parsed.items;
            }
          } catch { /* ignore */ }

          if (items.length === 0) {
            items = [{
              productId: '',
              productName: o.product_name || '제품명 없음',
              productCode: '',
              selectedOptions: {},
              quantity: o.quantity || 1,
              unitPrice: o.unit_price || 0,
              totalPrice: o.total_price || 0,
              components: []
            }];
          }

          return {
            id: o.order_number || o.id,
            dbId: o.id,
            items,
            totalAmount: Number(o.total_price) || 0,
            status: o.status || '주문접수',
            orderedAt: o.order_date,
            deliveredAt: o.status === '배송완료' ? (o.updated_at || o.order_date) : undefined,
            clientName: o.client_name || clinicName,
            clientId: businessNo,
            businessNumber: businessNo
          } as MvpOrder & { dbId: string };
        });

        setOrders(convertedOrders);
        setFilteredOrders(convertedOrders);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (e) {
      console.error('Failed to load data', e);
    }
  };

  useEffect(() => {
    loadData();

    if (!businessNo) return;
    const cleanBizNo = businessNo.replace(/-/g, '');

    const subscription = supabase
      .channel(`my_orders_realtime_${cleanBizNo}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `client_business_number=eq.${cleanBizNo}`
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `client_business_number=eq.${cleanBizNo}`
        },
        (payload) => {
          const updated = payload.new as any;

          setOrders(prev =>
            prev.map(o =>
              (o as any).dbId === updated.id
                ? {
                    ...o,
                    status: updated.status,
                    deliveredAt: updated.status === '배송완료' ? (updated.updated_at || o.orderedAt) : (o as any).deliveredAt
                  }
                : o
            )
          );

          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          setStatusToast({ orderId: updated.order_number || updated.id, newStatus: updated.status });
          toastTimerRef.current = setTimeout(() => setStatusToast(null), 4000);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessNo]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset, startDate, endDate, searchQuery, orders, statusTabFilter]);

  const applyFilters = () => {
    let filtered = [...orders];
    const now = new Date();

    if (datePreset !== 'all') {
      let filterFrom: Date | null = null;
      let filterTo: Date | null = null;

      if (datePreset === 'month') {
        filterFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        filterFrom.setHours(0, 0, 0, 0);
      } else if (datePreset === 'last-month') {
        filterFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        filterFrom.setHours(0, 0, 0, 0);
        filterTo = new Date(now.getFullYear(), now.getMonth(), 0);
        filterTo.setHours(23, 59, 59, 999);
      } else if (datePreset === '3months') {
        filterFrom = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        filterFrom.setHours(0, 0, 0, 0);
      } else if (datePreset === '6months') {
        filterFrom = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        filterFrom.setHours(0, 0, 0, 0);
      }

      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.orderedAt);
        if (isNaN(orderDate.getTime())) return true;
        if (filterFrom && orderDate < filterFrom) return false;
        if (filterTo && orderDate > filterTo) return false;
        return true;
      });
    }

    if (startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.orderedAt);
        return !isNaN(orderDate.getTime()) && orderDate >= startDateTime;
      });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.orderedAt);
        return !isNaN(orderDate.getTime()) && orderDate <= endDateTime;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.items.some(
            (item) =>
              item.productName.toLowerCase().includes(q) ||
              (item.productCode?.toLowerCase() || '').includes(q)
          )
      );
    }

    if (statusTabFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusTabFilter);
    }

    setFilteredOrders(filtered);
  };

  const clientPoint = businessNo ? getClientPoint(businessNo) : undefined;
  const allTransactions = businessNo ? getClientTransactions(businessNo) : [];
  const filteredTransactions =
    pointTypeFilter === 'all'
      ? allTransactions
      : allTransactions.filter((t) => t.type === pointTypeFilter);

  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const balance = clientPoint?.point_balance ?? 0;
  const arBalance = customer?.arBalance ?? 0;
  const arStatus = getArBalanceStatus(arBalance);
  const totalCharged = allTransactions.filter((t) => t.type === '충전').reduce((s, t) => s + t.amount, 0);
  const totalDeducted = allTransactions.filter((t) => t.type === '차감').reduce((s, t) => s + Math.abs(t.amount), 0);

  const presetButtons: { key: DatePreset; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'month', label: '이번 달' },
    { key: 'last-month', label: '지난 달' },
    { key: '3months', label: '최근 3개월' },
    { key: '6months', label: '최근 6개월' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '주문접수': return 'bg-blue-50 text-blue-700 border-blue-200';
      case '주문확인': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '배송준비': return 'bg-orange-50 text-orange-700 border-orange-200';
      case '배송중':   return 'bg-violet-50 text-violet-700 border-violet-200';
      case '배송완료': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '주문취소':
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      case 'cancel_requested': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'return_requested': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'returned': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'photo_order': return 'bg-purple-50 text-purple-700 border-purple-200';
      default:         return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'cancel_requested': '취소요청',
      'return_requested': '반품요청',
      'cancelled': '취소완료',
      'returned': '반품완료',
      'photo_order': '📷 사진주문 접수',
    };
    return labels[status] || status;
  };

  const getStatusToastColor = (status: string) => {
    switch (status) {
      case '주문확인': return 'bg-emerald-500';
      case '배송준비': return 'bg-orange-500';
      case '배송중':   return 'bg-violet-600';
      case '배송완료': return 'bg-gray-600';
      case '주문취소':
      case 'cancelled': return 'bg-red-500';
      case 'cancel_requested':
      case 'return_requested': return 'bg-orange-500';
      default:         return 'bg-[#2B5F9E]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '주문확인': return 'ri-checkbox-circle-line';
      case '배송준비': return 'ri-settings-3-line';
      case '배송중':   return 'ri-truck-line';
      case '배송완료': return 'ri-checkbox-circle-fill';
      case '주문취소': return 'ri-close-circle-line';
      default:         return 'ri-file-list-3-line';
    }
  };

  const getTransactionColor = (type: PointTransactionType) => {
    switch (type) {
      case '충전': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case '차감': return 'text-red-500 bg-red-50 border-red-200';
      case '조정': return 'text-amber-600 bg-amber-50 border-amber-200';
      case '정정': return 'text-gray-600 bg-gray-50 border-gray-200';
      case '충전요청': return 'text-[#2B5F9E] bg-[#2B5F9E]/10 border-[#2B5F9E]/20';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTransactionIcon = (type: PointTransactionType) => {
    switch (type) {
      case '충전': return 'ri-add-circle-line';
      case '차감': return 'ri-subtract-line';
      case '조정': return 'ri-equalizer-line';
      case '정정': return 'ri-edit-line';
      case '충전요청': return 'ri-time-line';
      default: return 'ri-coin-line';
    }
  };

  const handleGoToOrder = () => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('mvp-order');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  // 재주문: 해당 주문 상품 ID를 sessionStorage에 저장 후 주문 섹션으로 이동
  const handleReorder = (order: MvpOrder) => {
    const productIds = order.items
      .map((item) => item.productId)
      .filter(Boolean);
    if (productIds.length > 0) {
      sessionStorage.setItem('reorder_pinned_products', JSON.stringify(productIds));
    }
    handleGoToOrder();
  };

  const handleRequestSubmit = async (
    order: MvpOrder & { dbId?: string },
    reason: string
  ) => {
    const dbId = (order as any).dbId;
    if (!dbId) {
      alert('주문 정보를 찾을 수 없습니다.');
      return;
    }

    const isCancel = cancelReturnModal.type === 'cancel';
    const newStatus = isCancel ? 'cancel_requested' : 'return_requested';
    const reasonKey = isCancel ? 'cancel_reason' : 'return_reason';
    const dateKey = isCancel ? 'cancel_date' : 'return_date';

    let existingNotes: Record<string, any> = {};
    try {
      const parsed = JSON.parse((order as any).notes || '{}');
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        existingNotes = parsed;
      }
    } catch { /* ignore */ }

    const updatedNotes = JSON.stringify({
      ...existingNotes,
      [reasonKey]: reason,
      [dateKey]: new Date().toISOString(),
      previous_status: order.status,
    });

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, notes: updatedNotes })
      .eq('id', dbId);

    if (error) {
      throw new Error(error.message);
    }

    setOrders(prev =>
      prev.map(o => (o as any).dbId === dbId ? { ...o, status: newStatus } : o)
    );

    setCancelReturnModal({ open: false, type: 'cancel', order: null });
    alert(
      isCancel
        ? '취소 요청이 접수되었습니다. 담당자 검토 후 처리됩니다.'
        : '반품 요청이 접수되었습니다. 담당자 확인 후 처리됩니다.'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DeliveryStatusNotify />

      {/* 주문 상태 변경 실시간 토스트 */}
      {statusToast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] ${getStatusToastColor(statusToast.newStatus)} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce`}>
          <i className={`${getStatusIcon(statusToast.newStatus)} text-lg w-5 h-5 flex items-center justify-center`}></i>
          <div>
            <p className="text-xs font-bold">주문 상태가 변경되었습니다</p>
            <p className="text-[11px] opacity-90">{statusToast.orderId} → <strong>{statusToast.newStatus}</strong></p>
          </div>
          <button onClick={() => setStatusToast(null)} className="ml-2 w-5 h-5 flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer">
            <i className="ri-close-line text-sm"></i>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/" className="cursor-pointer flex-shrink-0">
            <img
              src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png"
              alt="CHIPANG Logo"
              className="h-8 sm:h-10"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link
              to="/my-page"
              className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-user-line"></i>
              <span className="hidden sm:inline">마이페이지</span>
              <span className="sm:hidden">내정보</span>
            </Link>
            <Link
              to="/my-payments"
              className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-receipt-line"></i>
              <span className="hidden sm:inline">결제 내역</span>
              <span className="sm:hidden">결제</span>
            </Link>
            <button
              onClick={handleGoToOrder}
              className="flex items-center gap-1.5 text-xs sm:text-sm bg-[#2B5F9E] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-shopping-cart-2-line"></i>
              <span className="hidden sm:inline">제품 주문하기</span>
              <span className="sm:hidden">주문</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Page Title */}
        <BackButton />
        <div className="mb-5 sm:mb-6 flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-file-list-3-line text-xl sm:text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">내 주문 / 잔액</h1>
            {clinicName && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{clinicName}</p>}
          </div>
        </div>

        {/* 포인트 0원 경고 배너 */}
        {clientPoint && clientPoint.point_balance <= 0 && (
          <div className="mb-5 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-300 rounded-2xl p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-error-warning-fill text-white text-2xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-rose-700 mb-1">
                  선결제 잔액(포인트)이 없습니다 — 주문이 차단됩니다
                </h4>
                <p className="text-sm text-rose-600 mb-1">
                  현재 포인트 잔액이 <strong>₩0</strong>입니다. 포인트를 충전하셔야 주문이 가능합니다.
                </p>
                <p className="text-xs text-rose-500">
                  충전 요청은 주문 화면의 <strong>포인트 충전</strong> 버튼을 이용하거나 담당자에게 문의해주세요.
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-rose-400 font-medium">현재 잔액</p>
                <p className="text-2xl font-extrabold text-rose-600">₩0</p>
              </div>
            </div>
          </div>
        )}

        {/* Point Summary Cards */}
        {clientPoint && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className={`rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border ${balance < 500000 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${balance < 500000 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                <i className={`ri-coin-line text-xl sm:text-2xl ${balance < 500000 ? 'text-red-500' : 'text-emerald-600'}`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">내 잔액</p>
                <p className={`text-lg sm:text-2xl font-extrabold truncate ${balance < 500000 ? 'text-red-600' : 'text-emerald-700'}`}>
                  ₩{balance.toLocaleString()}
                </p>
                {balance < 500000 && (
                  <p className="text-[10px] sm:text-[11px] text-red-500 mt-0.5 font-medium">충전 권장</p>
                )}
              </div>
            </div>

            <div className={`rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border ${arStatus.bgClass} ${arStatus.bgClass.replace('bg-', 'border-').replace('-50', '-200')}`}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${arStatus.bgClass.replace('-50', '-100')}`}>
                <i className={`ri-file-list-2-line text-xl sm:text-2xl ${arStatus.iconClass}`}></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[11px] sm:text-xs text-gray-500 font-medium">미수잔액</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full hidden sm:inline ${arStatus.bgClass.replace('-50', '-100')} ${arStatus.colorClass}`}>
                    {arStatus.label}
                  </span>
                </div>
                <p className={`text-lg sm:text-2xl font-extrabold truncate ${arStatus.colorClass}`}>
                  ₩{Math.abs(arBalance).toLocaleString()}
                  {arBalance < 0 && <span className="text-xs ml-1 font-normal hidden sm:inline">(선수)</span>}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2B5F9E]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-add-circle-line text-xl sm:text-2xl text-[#2B5F9E]"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">총 충전</p>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-900 truncate">₩{totalCharged.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-subtract-line text-xl sm:text-2xl text-rose-500"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">총 사용</p>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-900 truncate">₩{totalDeducted.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-5 sm:mb-6 w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveView('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${activeView === 'orders' ? 'bg-[#2B5F9E] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <i className="ri-shopping-bag-line w-4 h-4 flex items-center justify-center"></i>
            주문 내역
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full hidden sm:inline ${activeView === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {orders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveView('points')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${activeView === 'points' ? 'bg-[#2B5F9E] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <i className="ri-coin-line w-4 h-4 flex items-center justify-center"></i>
            포인트 내역
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeView === 'points' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {allTransactions.length}
            </span>
          </button>
        </div>

        {/* Orders View */}
        {activeView === 'orders' && (
          <>
            {/* 배송현황 상태 필터 탭 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
              {(
                [
                  { key: 'all',              label: '전체',     icon: 'ri-list-check',            color: 'text-gray-600' },
                  { key: 'photo_order',      label: '사진주문', icon: 'ri-camera-line',           color: 'text-purple-600' },
                  { key: '주문접수',          label: '주문접수', icon: 'ri-file-list-3-line',     color: 'text-blue-600' },
                  { key: '주문확인',          label: '주문확인', icon: 'ri-checkbox-circle-line', color: 'text-emerald-600' },
                  { key: '배송준비',          label: '배송준비', icon: 'ri-settings-3-line',      color: 'text-orange-600' },
                  { key: '배송중',            label: '배송중',   icon: 'ri-truck-line',           color: 'text-violet-600' },
                  { key: '배송완료',          label: '배송완료', icon: 'ri-checkbox-circle-fill', color: 'text-gray-500' },
                  { key: '주문취소',          label: '주문취소', icon: 'ri-close-circle-line',    color: 'text-red-500' },
                  { key: 'cancel_requested', label: '취소요청', icon: 'ri-alarm-warning-line',   color: 'text-orange-500' },
                  { key: 'return_requested', label: '반품요청', icon: 'ri-arrow-go-back-line',   color: 'text-orange-500' },
                  { key: 'cancelled',        label: '취소완료', icon: 'ri-forbid-line',          color: 'text-red-500' },
                  { key: 'returned',         label: '반품완료', icon: 'ri-refresh-line',          color: 'text-gray-500' },
                ] as { key: StatusTabFilter; label: string; icon: string; color: string }[]
              ).map((tab) => {
                const count = tab.key === 'all'
                  ? orders.length
                  : orders.filter((o) => o.status === tab.key).length;
                const isActive = statusTabFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusTabFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 border ${
                      isActive
                        ? 'bg-[#2B5F9E] text-white border-[#2B5F9E] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#2B5F9E]/40 hover:text-[#2B5F9E]'
                    }`}
                  >
                    <i className={`${tab.icon} text-sm w-4 h-4 flex items-center justify-center ${isActive ? 'text-white' : tab.color}`}></i>
                    {tab.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-shopping-bag-line text-xl text-blue-600"></i>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{filteredOrders.length}</p>
                  <p className="text-xs text-gray-500">총 주문 건수</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-11 h-11 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-money-dollar-circle-line text-xl text-emerald-600"></i>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">₩{totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">총 주문 금액</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-11 h-11 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-box-3-line text-xl text-violet-600"></i>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {filteredOrders.reduce((s, o) => s + o.items.length, 0)}
                  </p>
                  <p className="text-xs text-gray-500">총 제품 수량</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 mb-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">기간 선택</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {presetButtons.map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => { setDatePreset(btn.key); setStartDate(''); setEndDate(''); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${datePreset === btn.key ? 'bg-[#2B5F9E] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">시작일</p>
                  <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDatePreset('all'); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">종료일</p>
                  <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setDatePreset('all'); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]" />
                </div>
              </div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => applyFilters()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-search-line text-sm"></i>
                  조회
                </button>
              </div>
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="주문번호, 제품명, 제품코드로 검색..."
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">주문 내역이 없습니다</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {searchQuery || startDate || endDate ? '검색 조건에 맞는 주문이 없습니다.' : '아직 주문하신 내역이 없습니다.'}
                </p>
                <button
                  onClick={handleGoToOrder}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B5F9E] text-white rounded-lg text-sm font-semibold hover:bg-[#3A7BC8] transition-colors cursor-pointer"
                >
                  <i className="ri-shopping-cart-2-line"></i>제품 주문하러 가기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                      <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-wrap">
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900">주문번호: {order.id}</p>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{new Date(order.orderedAt).toLocaleString('ko-KR')}</p>
                            {order.status === '배송완료' && order.deliveredAt && (
                              <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
                                <i className="ri-checkbox-circle-fill text-emerald-500"></i>
                                배송완료: {new Date(order.deliveredAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[11px] sm:text-xs text-gray-500">주문 금액</p>
                          <p className="text-base sm:text-lg font-bold text-[#2B5F9E]">
                            {order.status === 'photo_order' ? '금액 미정' : `₩${order.totalAmount.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      {/* 사진주문 전용 UI */}
                      {order.status === 'photo_order' ? (() => {
                        let photoNotes: { memo?: string; images?: string[]; file_count?: number } = {};
                        try {
                          const parsed = JSON.parse((order as any).notes || '{}');
                          if (parsed.type === 'photo_order') photoNotes = parsed;
                        } catch { /* ignore */ }
                        const images = photoNotes.images || [];
                        return (
                          <div className="space-y-3">
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="ri-camera-fill text-xl text-purple-600"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-purple-800 mb-0.5">사진 업로드 주문 접수됨</p>
                                <p className="text-xs text-purple-600">
                                  담당자 확인 후 주문서를 생성해드립니다.<br />
                                  빠른 문의: <a href="tel:010-8950-3379" className="font-semibold underline cursor-pointer">010-8950-3379</a>
                                </p>
                              </div>
                            </div>
                            {images.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto">
                                {images.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 cursor-pointer">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                      <img src={url} alt={`주문사진 ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                            {photoNotes.memo && (
                              <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">
                                "{photoNotes.memo}"
                              </p>
                            )}
                          </div>
                        );
                      })() : (
                        order.items.map((item, idx) => {
                          const compTotal = (item.components ?? []).reduce((s, c) => s + c.unitPrice * c.quantity, 0);
                          return (
                            <div key={idx} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                                {item.productCode && <p className="text-xs text-gray-400 font-mono mt-0.5">{item.productCode}</p>}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(item.selectedOptions ?? {}).map(([k, v]) => (
                                    <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{k}: {v}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right ml-4 flex-shrink-0">
                                <p className="text-xs text-gray-500">수량: {item.quantity}개</p>
                                <p className="text-sm font-bold text-gray-900 mt-1">₩{((item.totalPrice ?? 0) + compTotal).toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* 배송 추적 타임라인 */}
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                          <i className="ri-map-pin-time-line w-3.5 h-3.5 flex items-center justify-center text-blue-500"></i>
                          배송 추적
                        </p>
                        <DeliveryTimeline status={order.status} />
                      </div>

                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        {/* 취소 요청 버튼 */}
                        {['주문접수', '주문확인', 'pending', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={() => setCancelReturnModal({ open: true, type: 'cancel', order: order as any })}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-close-circle-line text-base"></i>
                            취소 요청
                          </button>
                        )}

                        {/* 배송현황 / 재주문 버튼 */}
                        {order.status === '배송완료' || order.status === 'delivered' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedOrderForDelivery(order)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-checkbox-circle-line text-base text-emerald-600"></i>
                              배송현황 보기
                            </button>
                            <button
                              onClick={() => handleReorder(order)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-refresh-line text-base"></i>
                              재주문 바로가기
                            </button>
                          </div>
                        ) : !['cancel_requested', 'return_requested', 'cancelled', '주문취소', 'returned'].includes(order.status) ? (
                          <button
                            onClick={() => setSelectedOrderForDelivery(order)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-truck-line text-base"></i>
                            배송현황 보기
                          </button>
                        ) : null}

                        {/* 반품 요청 버튼 */}
                        {(order.status === '배송완료' || order.status === 'delivered') && (
                          <button
                            onClick={() => setCancelReturnModal({ open: true, type: 'return', order: order as any })}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-semibold hover:bg-orange-50 transition-all cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-arrow-go-back-line text-base"></i>
                            반품 요청
                          </button>
                        )}

                        {/* 취소/반품 요청 중 상태 안내 */}
                        {(order.status === 'cancel_requested' || order.status === 'return_requested') && (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                            <i className="ri-time-line text-orange-500 text-base flex-shrink-0"></i>
                            <p className="text-xs text-orange-700 font-semibold">
                              {order.status === 'cancel_requested' ? '취소 요청이 접수되어 담당자 검토 중입니다.' : '반품 요청이 접수되어 담당자 확인 중입니다.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Points View */}
        {activeView === 'points' && (
          <>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5">
              {(['all', '충전', '차감', '조정', '충전요청'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPointTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${pointTypeFilter === type ? 'bg-[#2B5F9E] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#2B5F9E] hover:text-[#2B5F9E]'}`}
                >
                  {type === 'all' ? '전체' : type}
                  <span className="ml-1.5 opacity-70">
                    ({type === 'all' ? allTransactions.length : allTransactions.filter((t) => t.type === type).length})
                  </span>
                </button>
              ))}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-coin-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">포인트 내역이 없습니다</h3>
                <p className="text-sm text-gray-500">아직 포인트 이력이 없습니다.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        <div className={`w-9 h-9 sm:w-10 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${getTransactionColor(tx.type)}`}>
                          <i className={`${getTransactionIcon(tx.type)} text-sm sm:text-base`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${getTransactionColor(tx.type)}`}>{tx.type}</span>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">{tx.created_at}</p>
                          {tx.admin_note && (
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 italic hidden sm:block">
                              <i className="ri-admin-line mr-1"></i>{tx.admin_note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2 sm:ml-4">
                        <p className={`text-sm sm:text-base font-extrabold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {tx.amount >= 0 ? '+' : ''}₩{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">잔액 ₩{tx.balance_after.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Actions — 항상 표시 */}
        <div className="mt-6 pb-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleGoToOrder}
            className="flex-1 sm:flex-none px-5 py-3 bg-[#2B5F9E] text-white rounded-xl text-sm font-bold hover:bg-[#3A7BC8] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-shopping-cart-2-line w-4 h-4 flex items-center justify-center"></i>
            제품 주문하러 가기
          </button>
          <Link
            to="/my-points"
            className="flex-1 sm:flex-none px-5 py-3 border border-[#2B5F9E]/30 text-[#2B5F9E] rounded-xl text-sm font-bold hover:bg-[#2B5F9E]/5 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-coin-line w-4 h-4 flex items-center justify-center"></i>
            내 잔액
          </Link>
        </div>
      </main>

      {selectedOrderForDelivery && (
        <DeliveryStatusModal
          orderId={selectedOrderForDelivery.id}
          currentStatus={selectedOrderForDelivery.status}
          orderedAt={selectedOrderForDelivery.orderedAt}
          onClose={() => setSelectedOrderForDelivery(null)}
        />
      )}

      <CancelReturnModal
        isOpen={cancelReturnModal.open}
        type={cancelReturnModal.type}
        order={cancelReturnModal.order}
        onClose={() => setCancelReturnModal({ open: false, type: 'cancel', order: null })}
        onSubmit={handleRequestSubmit}
      />
    </div>
  );
}
