import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ClientInfoCard from './components/ClientInfoCard';
import OrderHistoryTab from './components/OrderHistoryTab';
import BalanceTab from './components/BalanceTab';
import DeliveryTrackingTab from './components/DeliveryTrackingTab';
import type { OrderRow } from './components/OrderHistoryTab';

type TabKey = 'orders' | 'balance' | 'delivery';

interface ClientData {
  name: string;
  business_number: string;
  package_tier?: string;
  outstanding_balance?: number;
  created_at?: string;
  package_applied_at?: string;
}

export default function MyPage() {
  const navigate = useNavigate();
  const { businessNo, clinicName, role, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !businessNo) {
      navigate('/login', { replace: true });
    }
  }, [navigate, authLoading, businessNo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bizNo = businessNo || '';

        if (!bizNo) {
          setClientLoading(false);
          setOrdersLoading(false);
          return;
        }

        const cleanBizNo = bizNo.replace(/-/g, '');

        // 거래처 정보 조회
        setClientLoading(true);
        const { data: cData, error: cErr } = await supabase
          .from('clients')
          .select('name, business_number, package_tier, outstanding_balance, created_at')
          .or(`business_number.eq.${cleanBizNo},business_number.eq.${bizNo}`)
          .maybeSingle();

        if (!cErr && cData) {
          // 패키지 변경 이력에서 최근 적용일 조회
          let packageAppliedAt: string | undefined;
          try {
            const bno = (cData as any).business_number || cleanBizNo;
            const { data: logData } = await supabase
              .from('package_logs')
              .select('created_at')
              .or(`business_number.eq.${bno},business_number.eq.${cleanBizNo}`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (logData) packageAppliedAt = logData.created_at;
          } catch { /* ignore */ }

          setClientData({ ...(cData as ClientData), package_applied_at: packageAppliedAt });
        }
        setClientLoading(false);

        // 주문 내역 조회
        setOrdersLoading(true);
        const { data: oData, error: oErr } = await supabase
          .from('orders')
          .select('id, order_number, order_date, status, total_price, product_name, quantity, unit_price, notes')
          .or(`client_business_number.eq.${cleanBizNo},client_business_number.eq.${bizNo}`)
          .order('order_date', { ascending: false })
          .limit(200);

        if (!oErr && oData) {
          const mapped: OrderRow[] = oData.map((o: any) => {
            let items: OrderRow['items'] = [];
            try {
              if (o.notes) {
                const parsed = JSON.parse(o.notes);
                if (parsed.items && Array.isArray(parsed.items)) {
                  items = parsed.items.map((it: any) => ({
                    productName: it.productName || '제품명 없음',
                    quantity: it.quantity || 1,
                    totalPrice: it.totalPrice || 0,
                    productCode: it.productCode,
                  }));
                }
              }
            } catch { /* ignore */ }

            if (items.length === 0) {
              items = [{
                productName: o.product_name || '제품명 없음',
                quantity: o.quantity || 1,
                totalPrice: Number(o.total_price) || 0,
              }];
            }

            return {
              id: o.order_number || o.id,
              dbId: o.id,
              items,
              totalAmount: Number(o.total_price) || 0,
              status: o.status || '주문접수',
              orderedAt: o.order_date,
            };
          });
          setOrders(mapped);
        }
        setOrdersLoading(false);
      } catch (e) {
        console.error('MyPage fetch error:', e);
        setClientLoading(false);
        setOrdersLoading(false);
      }
    };

    fetchData();
  }, [businessNo]);

  if (!businessNo) return null;

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'orders',   label: '주문이력',  icon: 'ri-file-list-3-line' },
    { key: 'balance',  label: '잔액내역',  icon: 'ri-wallet-line' },
    { key: 'delivery', label: '배송조회',  icon: 'ri-truck-line' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#FAF6F0' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-[#E0D5C3]"
        style={{ background: 'rgba(250,246,240,0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="cursor-pointer flex-shrink-0">
            <img
              src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/5c3738dea2759a2f9802f6cc31c064c5.png"
              alt="치팡 Logo"
              className="h-9"
            />
          </Link>
          <h1 className="text-base font-bold flex-1 text-center" style={{ color: '#3D3428' }}>
            마이페이지
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/my-orders"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D4C4A8] cursor-pointer hover:border-[#8B6914] transition-colors whitespace-nowrap"
              style={{ color: '#5C5346' }}
            >
              <i className="ri-file-list-3-line text-sm"></i>
              주문내역
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap text-white transition-colors"
              style={{ background: '#8B6914' }}
            >
              <i className="ri-shopping-cart-2-line text-sm"></i>
              주문
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-3">
          <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D4C4A8] cursor-pointer hover:border-[#8B6914] transition-colors" style={{ color: '#8B6914' }}>
            <i className="ri-arrow-left-s-line text-lg"></i>
          </Link>
          <div>
            <p className="text-xs font-medium" style={{ color: '#8C7E6A' }}>
              {session.clinicName ?? session.businessNo}
            </p>
            <p className="text-xl font-bold leading-tight" style={{ color: '#1a1a1a' }}>
              거래처 마이페이지
            </p>
          </div>
        </div>

        {/* 거래처 정보 카드 */}
        <ClientInfoCard clientData={clientData} loading={clientLoading} />

        {/* 탭 네비게이션 */}
        <div className="flex bg-white rounded-xl border border-[#E0D5C3] p-1 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
              style={activeTab === tab.key ? { background: '#8B6914' } : {}}
            >
              <i className={`${tab.icon} text-base w-4 h-4 flex items-center justify-center`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'orders' && (
          <OrderHistoryTab orders={orders} loading={ordersLoading} />
        )}
        {activeTab === 'balance' && (
          <BalanceTab
            outstandingBalance={clientData?.outstanding_balance}
            clientName={clientData?.name ?? (session.clinicName ?? '거래처')}
          />
        )}
        {activeTab === 'delivery' && (
          <DeliveryTrackingTab orders={orders} loading={ordersLoading} />
        )}

        {/* 하단 빠른 이동 */}
        <div className="flex gap-2 pb-4">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
            style={{ background: '#8B6914' }}
          >
            <i className="ri-shopping-cart-2-line w-4 h-4 flex items-center justify-center"></i>
            제품 주문하기
          </Link>
          <Link
            to="/my-orders"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-[#D4C4A8] cursor-pointer whitespace-nowrap transition-colors hover:border-[#8B6914]"
            style={{ color: '#5C5346' }}
          >
            <i className="ri-file-list-3-line w-4 h-4 flex items-center justify-center"></i>
            주문내역 상세
          </Link>
        </div>
      </main>
    </div>
  );
}
