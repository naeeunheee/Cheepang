import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usePoints } from '../../../hooks/usePoints';
import { supabase } from '../../../lib/supabase';
import ChargeModal from './MvpOrder/ChargeModal';

interface OrderStats {
  totalCount: number;
  pendingCount: number;
  latestStatus: string | null;
}

interface LatestDelivery {
  orderNumber: string;
  productName: string;
  status: string;
  orderDate: string;
}

const DELIVERY_STATUS_MAP: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  '주문접수': { icon: 'ri-inbox-archive-line', color: 'text-sky-600', bg: 'bg-sky-50', label: '주문접수' },
  '처리중':   { icon: 'ri-loader-4-line',      color: 'text-orange-500', bg: 'bg-orange-50', label: '처리중' },
  '배송준비': { icon: 'ri-shopping-bag-3-line', color: 'text-violet-500', bg: 'bg-violet-50', label: '배송준비' },
  '배송중':   { icon: 'ri-truck-line',          color: 'text-emerald-600', bg: 'bg-emerald-50', label: '배송중' },
  '배송완료': { icon: 'ri-checkbox-circle-line', color: 'text-emerald-700', bg: 'bg-emerald-100', label: '배송완료' },
  '취소':     { icon: 'ri-close-circle-line',   color: 'text-red-500', bg: 'bg-red-50', label: '취소됨' },
};

export default function QuickSummaryBanner() {
  const { businessNo, clinicName: authClinicName, role } = useAuth();
  const session = businessNo ? { businessNo, clinicName: authClinicName, role } : null;
  const { chargePoints } = usePoints();
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [clientUUID, setClientUUID] = useState<string | null>(null);
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [pointLoading, setPointLoading] = useState(false);
  const [pointError, setPointError] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [latestDelivery, setLatestDelivery] = useState<LatestDelivery | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const fetchDelivery = async (cId: string) => {
    setDeliveryLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('order_number, product_name, status, order_date')
        .eq('client_id', cId)
        .not('status', 'eq', '취소')
        .order('order_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLatestDelivery({
          orderNumber: data.order_number ?? '',
          productName: data.product_name ?? '',
          status: data.status ?? '주문접수',
          orderDate: data.order_date ?? '',
        });
      }
    } catch (err) {
      console.error('배송 현황 조회 실패:', err);
    } finally {
      setDeliveryLoading(false);
    }
  };

  useEffect(() => {
    if (!session || session.role !== 'dental' || !session.businessNo) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      setPointLoading(true);
      setPointError(false);
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('business_number', session.businessNo)
          .maybeSingle();

        if (!clientData) {
          setPointError(true);
          setPointLoading(false);
          setStatsLoading(false);
          return;
        }
        setClientUUID(clientData.id);

        // 포인트 잔액 조회
        const { data: pointData, error: pointErr } = await supabase
          .from('client_points')
          .select('point_balance')
          .eq('client_id', clientData.id)
          .maybeSingle();

        if (pointErr || !pointData) {
          setPointError(true);
        } else {
          setPointBalance(Number(pointData.point_balance) || 0);
          setPointError(false);
        }
        setPointLoading(false);

        // 주문 통계 조회
        const { data: orders } = await supabase
          .from('orders')
          .select('status, order_date')
          .eq('client_id', clientData.id)
          .order('order_date', { ascending: false })
          .limit(30);

        if (orders) {
          const pendingStatuses = ['주문접수', '처리중', '배송준비', '배송중'];
          setOrderStats({
            totalCount: orders.length,
            pendingCount: orders.filter((o) => pendingStatuses.includes(o.status)).length,
            latestStatus: orders[0]?.status ?? null,
          });
        }

        // 배송 현황 조회
        await fetchDelivery(clientData.id);
      } catch (err) {
        console.error('배너 통계 조회 실패:', err);
        setPointError(true);
        setPointLoading(false);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();

    // 실시간 주문 상태 구독 (배송 현황 자동 업데이트)
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeAfterClient = async () => {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('business_number', session.businessNo!)
        .maybeSingle();

      if (!clientData?.id) return;

      channel = supabase
        .channel(`order-status-${clientData.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `client_id=eq.${clientData.id}`,
          },
          () => {
            fetchDelivery(clientData.id);
            // 주문 통계도 갱신
            supabase
              .from('orders')
              .select('status, order_date')
              .eq('client_id', clientData.id)
              .order('order_date', { ascending: false })
              .limit(30)
              .then(({ data: orders }) => {
                if (orders) {
                  const pendingStatuses = ['주문접수', '처리중', '배송준비', '배송중'];
                  setOrderStats({
                    totalCount: orders.length,
                    pendingCount: orders.filter((o) => pendingStatuses.includes(o.status)).length,
                    latestStatus: orders[0]?.status ?? null,
                  });
                }
              });
          }
        )
        .subscribe();
    };

    setupRealtimeAfterClient();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [session?.businessNo]);

  if (!session || session.role !== 'dental') return null;

  const balance = pointBalance;
  const clinicName = session.clinicName || session.businessNo || '';

  const balanceStatus =
    pointLoading ? 'loading'
    : pointError ? 'error'
    : balance === null ? 'error'
    : balance === 0 ? 'empty'
    : balance < 100000 ? 'low'
    : 'good';

  const badgeMap: Record<string, { label: string; cls: string } | null> = {
    empty: { label: '충전필요', cls: 'bg-red-100 text-red-600' },
    low: { label: '잔액부족', cls: 'bg-amber-100 text-amber-600' },
    good: null,
    loading: null,
    error: null,
  };

  const badge = badgeMap[balanceStatus];

  const renderPointValue = () => {
    if (balanceStatus === 'loading') {
      return <p className="text-lg font-bold text-gray-300 leading-none">···</p>;
    }
    if (balanceStatus === 'error') {
      return <p className="text-lg font-bold text-gray-400 leading-none">조회 중...</p>;
    }
    if (balanceStatus === 'empty') {
      return <p className="text-lg font-extrabold leading-none text-red-600 group-hover:underline">₩0</p>;
    }
    return (
      <p className="text-lg font-extrabold leading-none group-hover:underline" style={{ color: '#8B6914' }}>
        ₩{(balance ?? 0).toLocaleString()}
      </p>
    );
  };

  const deliveryInfo = latestDelivery
    ? (DELIVERY_STATUS_MAP[latestDelivery.status] ?? DELIVERY_STATUS_MAP['주문접수'])
    : null;

  // 배송 상태 애니메이션 (배송중일 때 트럭 아이콘 pulse)
  const deliveryIconAnimation = latestDelivery?.status === '배송중' ? 'animate-pulse' : '';

  return (
    <>
      <div className="bg-white border-b" style={{ borderColor: '#E0D5C3' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 min-h-[60px]">
          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">

            {/* 치과명 */}
            <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.1)' }}>
                <i className="ri-hospital-line text-base" style={{ color: '#8B6914' }}></i>
              </div>
              <span className="text-[18px] font-bold text-gray-800 truncate max-w-[110px] sm:max-w-[200px]">
                {clinicName}
              </span>
            </div>

            <div className="w-[2px] h-10 flex-shrink-0" style={{ background: '#E0D5C3' }} />

            {/* 포인트 잔액 */}
            {balanceStatus === 'empty' ? (
              <button
                onClick={() => setShowChargeModal(true)}
                className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
              >
                <i className="ri-coin-line text-lg text-red-500" />
                <div>
                  <p className="text-sm text-gray-500 leading-none mb-0.5">내 잔액</p>
                  <p className="text-lg font-extrabold leading-none text-red-600 group-hover:underline">₩0</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap bg-red-100 text-red-600">
                  충전필요
                </span>
              </button>
            ) : (
              <Link
                to="/my-points"
                className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
              >
                <i
                  className={`ri-coin-line text-lg ${balanceStatus === 'low' ? 'text-amber-500' : balanceStatus === 'error' || balanceStatus === 'loading' ? 'text-gray-400' : ''}`}
                  style={balanceStatus === 'good' ? { color: '#8B6914' } : {}}
                />
                <div>
                  <p className="text-sm text-gray-500 leading-none mb-0.5">내 잔액</p>
                  {renderPointValue()}
                </div>
                {badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </Link>
            )}

            <div className="w-[2px] h-10 flex-shrink-0" style={{ background: '#E0D5C3' }} />

            {/* 최근 주문 현황 */}
            <Link
              to="/my-orders"
              className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
            >
              <i className="ri-file-list-3-line text-lg" style={{ color: '#8B6914' }} />
              <div>
                <p className="text-sm text-gray-500 leading-none mb-0.5">최근 주문</p>
                {statsLoading ? (
                  <p className="text-lg font-bold text-gray-300 leading-none">···</p>
                ) : orderStats ? (
                  <p className="text-lg font-extrabold leading-none text-gray-800 group-hover:underline">
                    {orderStats.totalCount}건
                    {orderStats.pendingCount > 0 && (
                      <span className="ml-1.5 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
                        처리중 {orderStats.pendingCount}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-lg font-bold text-gray-400 leading-none">주문 없음</p>
                )}
              </div>
            </Link>

            <div className="w-[2px] h-10 flex-shrink-0 hidden md:block" style={{ background: '#E0D5C3' }} />

            {/* 실시간 배송 현황 */}
            <Link
              to="/my-orders"
              className="hidden md:flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
            >
              {deliveryLoading ? (
                <>
                  <i className="ri-loader-4-line text-lg text-gray-300 animate-spin" />
                  <div>
                    <p className="text-sm text-gray-500 leading-none mb-0.5">배송 현황</p>
                    <p className="text-lg font-bold text-gray-300 leading-none">···</p>
                  </div>
                </>
              ) : latestDelivery && deliveryInfo ? (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${deliveryInfo.bg}`}>
                    <i className={`${deliveryInfo.icon} text-lg ${deliveryInfo.color} ${deliveryIconAnimation}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 leading-none mb-0.5">실시간 배송</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-extrabold leading-none ${deliveryInfo.color} group-hover:underline whitespace-nowrap`}>
                        {deliveryInfo.label}
                      </span>
                      {latestDelivery.orderNumber && (
                        <span className="text-[11px] text-gray-400 font-mono hidden lg:inline">
                          #{latestDelivery.orderNumber.slice(-6)}
                        </span>
                      )}
                    </div>
                    {latestDelivery.productName && (
                      <p className="text-[10px] text-gray-400 truncate max-w-[120px] leading-none mt-0.5">
                        {latestDelivery.productName.length > 16
                          ? latestDelivery.productName.slice(0, 16) + '…'
                          : latestDelivery.productName}
                      </p>
                    )}
                  </div>
                  {latestDelivery.status === '배송중' && (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                      LIVE
                    </span>
                  )}
                  {latestDelivery.status === '배송완료' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      완료
                    </span>
                  )}
                </>
              ) : (
                <>
                  <i className="ri-truck-line text-lg text-gray-300" />
                  <div>
                    <p className="text-sm text-gray-500 leading-none mb-0.5">배송 현황</p>
                    <p className="text-sm font-bold text-gray-400 leading-none">없음</p>
                  </div>
                </>
              )}
            </Link>

            {/* 우측 빠른 액션 */}
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <Link
                to="/my-orders"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                style={{ background: '#8B6914' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#7A5A0F'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#8B6914'; }}
              >
                <i className="ri-file-list-3-line text-base" />
                <span className="hidden sm:inline">주문내역</span>
              </Link>
              {balanceStatus === 'empty' ? (
                <button
                  onClick={() => setShowChargeModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-colors whitespace-nowrap cursor-pointer bg-red-500 hover:bg-red-600"
                >
                  <i className="ri-add-circle-line text-base" />
                  <span>충전 요청</span>
                </button>
              ) : (
                <Link
                  to="/my-points"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-colors whitespace-nowrap cursor-pointer"
                  style={{ background: balanceStatus === 'low' ? '#C4831A' : '#8B6914' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#7A5A0F'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = balanceStatus === 'low' ? '#C4831A' : '#8B6914'; }}
                >
                  <i className="ri-coin-line text-base" />
                  <span className="hidden sm:inline">내 잔액</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {showChargeModal && clientUUID && (
        <ChargeModal
          clientId={clientUUID}
          clientName={clinicName}
          currentBalance={balance ?? 0}
          onClose={() => setShowChargeModal(false)}
          onRequestCharge={(cId, cName, amount, pkgName) => {
            chargePoints(cId, cName, amount, `카드 결제 충전 — ${pkgName}`);
          }}
        />
      )}
    </>
  );
}
