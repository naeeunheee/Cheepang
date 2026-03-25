import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import AdminHeader from '../../../components/feature/AdminHeader';
import DashboardStats from './components/DashboardStats';
import UrgentRequests, { UrgentOrder } from './components/UrgentRequests';
import OrderStatusTable, { OrderRow } from './components/OrderStatusTable';
import ClientStatusTable, { ClientRow } from './components/ClientStatusTable';
import MonthlyOrderChart from './components/MonthlyOrderChart';

const URGENT_STATUSES = ['cancel_requested', 'exchange_requested', 'return_requested'];

interface StatsState {
  todayOrders: number;
  monthOrders: number;
  monthRevenue: number;
  pendingUrgent: number;
  activeClients: number;
  totalArrears: number;
  totalCredit: number;
  loading: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsState>({
    todayOrders: 0, monthOrders: 0, monthRevenue: 0,
    pendingUrgent: 0, activeClients: 0, totalArrears: 0, totalCredit: 0,
    loading: true,
  });
  const [urgentOrders, setUrgentOrders] = useState<UrgentOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [allOrders, setAllOrders] = useState<{ order_date: string; total_price: number; status: string; client_business_number?: string }[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const fetchStats = useCallback(async () => {
    setStats(prev => ({ ...prev, loading: true }));
    try {
      const [
        todayRes,
        monthRes,
        urgentRes,
        clientsRes,
      ] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('orders').select('total_price, client_business_number').gte('created_at', monthStart).not('status', 'eq', 'cancelled').not('status', 'eq', '주문취소'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', URGENT_STATUSES),
        supabase.from('clients').select('outstanding_balance'),
      ]);

      const monthRevenue = (monthRes.data ?? []).reduce((s: number, o: any) => s + Number(o.total_price || 0), 0);
      const activeClientSet = new Set((monthRes.data ?? []).map((o: any) => o.client_business_number).filter(Boolean));

      let totalArrears = 0;
      let totalCredit = 0;
      (clientsRes.data ?? []).forEach((c: any) => {
        const bal = Number(c.outstanding_balance || 0);
        if (bal > 0) totalArrears += bal;
        if (bal < 0) totalCredit += Math.abs(bal);
      });

      setStats({
        todayOrders: todayRes.count ?? 0,
        monthOrders: monthRes.data?.length ?? 0,
        monthRevenue,
        pendingUrgent: urgentRes.count ?? 0,
        activeClients: activeClientSet.size,
        totalArrears,
        totalCredit,
        loading: false,
      });
    } catch (e) {
      console.error('stats fetch error:', e);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [todayStart, monthStart]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const [urgentRes, recentRes, allRes] = await Promise.all([
        supabase.from('orders')
          .select('id, order_number, client_name, product_name, status, notes, order_date, total_price')
          .in('status', URGENT_STATUSES)
          .order('order_date', { ascending: false })
          .limit(50),
        supabase.from('orders')
          .select('id, order_number, client_name, product_name, quantity, total_price, status, order_date')
          .order('order_date', { ascending: false })
          .limit(50),
        supabase.from('orders')
          .select('order_date, total_price, status, client_business_number')
          .order('order_date', { ascending: false })
          .limit(500),
      ]);

      setUrgentOrders(urgentRes.data ?? []);
      setRecentOrders(recentRes.data ?? []);
      setAllOrders(allRes.data ?? []);
    } catch (e) {
      console.error('orders fetch error:', e);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const { data } = await supabase
        .from('clients')
        .select('id, name, business_number, package_tier, outstanding_balance')
        .order('name', { ascending: true })
        .limit(300);

      if (!data) { setClientsLoading(false); return; }

      // 주문 집계용 별도 쿼리
      const { data: orderAgg } = await supabase
        .from('orders')
        .select('client_business_number, order_date')
        .order('order_date', { ascending: false })
        .limit(1000);

      const aggMap: Record<string, { count: number; lastDate: string }> = {};
      (orderAgg ?? []).forEach((o: any) => {
        const biz = o.client_business_number;
        if (!biz) return;
        if (!aggMap[biz]) aggMap[biz] = { count: 0, lastDate: o.order_date };
        aggMap[biz].count += 1;
        if (o.order_date > aggMap[biz].lastDate) aggMap[biz].lastDate = o.order_date;
      });

      const enriched: ClientRow[] = data.map((c: any) => {
        const agg = aggMap[c.business_number] ?? { count: 0, lastDate: undefined };
        return {
          id: c.id,
          name: c.name,
          business_number: c.business_number,
          package_tier: c.package_tier,
          outstanding_balance: c.outstanding_balance,
          lastOrderDate: agg.lastDate,
          totalOrders: agg.count,
        };
      });

      setClients(enriched);
    } catch (e) {
      console.error('clients fetch error:', e);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    setLastRefresh(new Date());
    fetchStats();
    fetchOrders();
    fetchClients();
  }, [fetchStats, fetchOrders, fetchClients]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
    fetchClients();
  }, [fetchStats, fetchOrders, fetchClients]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 transition-colors cursor-pointer whitespace-nowrap border border-gray-200 px-2.5 py-1.5 rounded-lg hover:border-teal-300 bg-white"
            >
              <i className="ri-arrow-left-s-line"></i>주문관리
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                최종 갱신: {lastRefresh.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line text-base"></i>
            데이터 새로고침
          </button>
        </div>

        {/* 통계 카드 6개 */}
        <DashboardStats {...stats} />

        {/* 긴급 처리 영역 */}
        <UrgentRequests orders={urgentOrders} onRefresh={refreshAll} />

        {/* 월별 차트 */}
        <MonthlyOrderChart orders={allOrders} />

        {/* 주문 현황 테이블 */}
        <OrderStatusTable orders={recentOrders} loading={ordersLoading} onRefresh={fetchOrders} />

        {/* 거래처 현황 테이블 */}
        <ClientStatusTable clients={clients} loading={clientsLoading} onRefresh={fetchClients} />
      </main>
    </div>
  );
}
