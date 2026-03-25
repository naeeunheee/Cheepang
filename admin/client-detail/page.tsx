import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import AdminHeader from '../../../components/feature/AdminHeader';
import ChargeRequestNotify from '../../../components/feature/ChargeRequestNotify';
import ChargeRequestModal from './components/ChargeRequestModal';
import ClientInfoSection from './components/ClientInfoSection';
import ClientPeriodStatementModal from './components/ClientPeriodStatementModal';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Client {
  id: string;
  name: string;
  clinic_name: string;
  business_no: string;
  business_number?: string;
  representative: string;
  business_type?: string;
  business_category?: string;
  phone: string;
  fax?: string;
  email: string;
  address: string;
  address_detail?: string;
  contact_person?: string;
  contact_phone?: string;
  notes?: string;
  point_balance: number;
  outstanding_balance?: number;
  biz_license_url?: string;
  package_tier?: string | number | null;
  verification_status?: string;
  user_id?: string;
  auth_user_id?: string;
  auth_linked?: boolean;
  created_at?: string;
}

interface Order {
  id: string;
  client_id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  order_date: string;
  notes: string;
}

interface PointTransaction {
  id: string;
  client_id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'points'>('orders');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [showPeriodStatement, setShowPeriodStatement] = useState(false);
  // 잔액 실시간 갱신 알림 상태
  const [balanceUpdated, setBalanceUpdated] = useState(false);

  // UUID 형식 검증
  const isValidUUID = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      navigate('/admin/clients', { replace: true });
      return;
    }
    fetchClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Realtime 구독: clients 테이블 변경 시 잔액 즉시 반영
  useEffect(() => {
    if (!id || !isValidUUID(id)) return;

    const channel = supabase
      .channel(`client_detail_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updated = payload.new as Client;
          setClient((prev) => {
            if (!prev) return prev;
            const prevBalance = prev.point_balance;
            const newBalance = updated.point_balance;
            // 잔액이 실제로 변경된 경우에만 알림 표시
            if (prevBalance !== newBalance) {
              setBalanceUpdated(true);
              setTimeout(() => setBalanceUpdated(false), 3000);
            }
            return { ...prev, ...updated };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'point_transactions',
          filter: `client_id=eq.${id}`,
        },
        async () => {
          // 새 거래 내역 추가 시 목록 갱신
          const { data } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('client_id', id)
            .order('created_at', { ascending: false });
          if (data) setTransactions(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        navigate('/admin/clients', { replace: true });
        return;
      }

      setClient(clientData);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (err: any) {
      console.error('데이터 조회 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 프리셋 함수
  const applyDatePreset = (preset: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        start = weekStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        start = monthStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      }
      case 'lastMonth': {
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        start = lastMonthStart.toISOString().split('T')[0];
        end = lastMonthEnd.toISOString().split('T')[0];
        break;
      }
      case 'all':
        start = '';
        end = '';
        break;
    }

    setDateRange({ start, end });
  };

  // 날짜 필터링된 주문 목록
  const filteredOrders = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return orders;
    
    return orders.filter((order) => {
      const orderDate = new Date(order.order_date).toISOString().split('T')[0];
      if (dateRange.start && orderDate < dateRange.start) return false;
      if (dateRange.end && orderDate > dateRange.end) return false;
      return true;
    });
  }, [orders, dateRange]);

  // 월별 주문 통계 (최근 12개월)
  const monthlyOrderStats = useMemo(() => {
    const now = new Date();
    const data: { month: string; 주문건수: number; 주문금액: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getMonth() + 1}월`;

      const monthOrders = orders.filter((o) => o.order_date.startsWith(monthKey));
      data.push({
        month: label,
        주문건수: monthOrders.length,
        주문금액: Math.round(monthOrders.reduce((sum, o) => sum + o.total_price, 0) / 10000),
      });
    }

    return data;
  }, [orders]);

  // 월별 포인트 사용 통계 (최근 12개월)
  const monthlyPointStats = useMemo(() => {
    const now = new Date();
    const data: { month: string; 포인트사용: number; 포인트충전: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getMonth() + 1}월`;

      const monthTransactions = transactions.filter((t) => t.created_at.startsWith(monthKey));

      const usageAmount = monthTransactions
        .filter((t) => t.type === 'use' || t.type === 'order')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const chargeAmount = monthTransactions
        .filter((t) => t.type === 'charge' || t.type === 'refund')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      data.push({ month: label, 포인트사용: usageAmount, 포인트충전: chargeAmount });
    }

    return data;
  }, [transactions]);

  // 요약 통계 (필터링된 주문 기준)
  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_price, 0);
    const currentBalance = client?.point_balance || 0;
    const totalPointUsage = transactions
      .filter((t) => t.type === 'use' || t.type === 'order')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { totalOrders, totalRevenue, currentBalance, totalPointUsage };
  }, [filteredOrders, transactions, client]);

  const hasDateFilter = dateRange.start || dateRange.end;

  const getDateRangeLabel = () => {
    if (!hasDateFilter) return '';
    if (dateRange.start && dateRange.end) {
      if (dateRange.start === dateRange.end) {
        return new Date(dateRange.start).toLocaleDateString('ko-KR');
      }
      return `${new Date(dateRange.start).toLocaleDateString('ko-KR')} ~ ${new Date(dateRange.end).toLocaleDateString('ko-KR')}`;
    }
    if (dateRange.start) return `${new Date(dateRange.start).toLocaleDateString('ko-KR')} ~`;
    if (dateRange.end) return `~ ${new Date(dateRange.end).toLocaleDateString('ko-KR')}`;
    return '';
  };

  const handleChargeSuccess = () => {
    setShowChargeModal(false);
    setChargeSuccess(true);
    setTimeout(() => setChargeSuccess(false), 4000);
  };

  const handleClientInfoUpdated = (updated: Partial<Client>) => {
    setClient((prev) => prev ? { ...prev, ...updated } : prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-3xl text-red-500"></i>
            </div>
            <p className="text-gray-700 font-medium mb-2">{error}</p>
            <button
              onClick={() => navigate('/admin/clients')}
              className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              거래처 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!client) return null;

  const formatPointBalance = (balance: number) => {
    if (balance < 0) return `선포인트 ${Math.abs(balance).toLocaleString()}원`;
    if (balance === 0) return '0원';
    return `미수금 ${balance.toLocaleString()}원`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <AdminHeader />
      <ChargeRequestNotify />

      {/* 충전 요청 성공 토스트 */}
      {chargeSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-teal-600 text-white px-5 py-3.5 rounded-xl shadow-lg animate-fade-in">
          <i className="ri-checkbox-circle-fill text-xl"></i>
          <div>
            <p className="font-semibold text-sm">충전 요청이 생성되었습니다</p>
            <p className="text-teal-100 text-xs mt-0.5">포인트 관리 &gt; 충전 요청 탭에서 승인해주세요</p>
          </div>
          <button onClick={() => setChargeSuccess(false)} className="ml-2 cursor-pointer">
            <i className="ri-close-line text-teal-200 hover:text-white"></i>
          </button>
        </div>
      )}

      {/* 잔액 실시간 갱신 알림 토스트 */}
      {balanceUpdated && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg">
          <i className="ri-refresh-line text-lg animate-spin"></i>
          <p className="font-semibold text-sm">포인트 잔액이 실시간으로 갱신되었습니다</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/admin/clients')}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              {client?.clinic_name || client?.name}
              <span className="text-xs md:text-sm font-normal text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {client?.business_number || client?.business_no}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {client?.representative} · {client?.phone}
            </p>
          </div>
          {/* 기간별 거래명세서 버튼 */}
          <button
            onClick={() => setShowPeriodStatement(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-file-chart-line text-base"></i>
            기간별 거래명세서
          </button>
          <button
            onClick={() => setShowChargeModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <i className="ri-add-circle-line text-base"></i>
            충전 요청 생성
          </button>
        </div>

        {/* 거래처 상세 정보 섹션 */}
        <ClientInfoSection client={client} onUpdated={handleClientInfoUpdated} />

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-shopping-cart-line text-blue-600 text-xl"></i>
              </div>
              <div className="text-sm text-gray-600">총 주문 수</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {summary.totalOrders}
              <span className="text-base md:text-lg text-gray-500 ml-1">건</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-teal-600 text-xl"></i>
              </div>
              <div className="text-sm text-gray-600">총 주문 금액</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-teal-600">
              {summary.totalRevenue.toLocaleString()}
              <span className="text-base md:text-lg text-gray-500 ml-1">원</span>
            </div>
          </div>

          {/* 포인트 잔액 카드 — 실시간 갱신 표시 */}
          <div
            className={`bg-white rounded-lg shadow-sm border p-4 md:p-5 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden ${
              balanceUpdated ? 'border-emerald-400 ring-2 ring-emerald-300' : 'border-gray-100 hover:border-teal-300'
            }`}
            onClick={() => setShowChargeModal(true)}
            title="클릭하여 충전 요청 생성"
          >
            {/* 실시간 갱신 펄스 효과 */}
            {balanceUpdated && (
              <div className="absolute inset-0 bg-emerald-50 animate-pulse pointer-events-none rounded-lg"></div>
            )}
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${balanceUpdated ? 'bg-emerald-100' : 'bg-purple-100 group-hover:bg-teal-100'}`}>
                  <i className={`text-xl transition-colors ${balanceUpdated ? 'ri-refresh-line text-emerald-600 animate-spin' : 'ri-wallet-3-line text-purple-600 group-hover:text-teal-600'}`}></i>
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  현재 포인트 잔액
                  {balanceUpdated && (
                    <span className="text-xs text-emerald-600 font-semibold ml-1">갱신됨</span>
                  )}
                  {!balanceUpdated && (
                    <i className="ri-add-circle-line text-teal-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  )}
                </div>
              </div>
              <div className={`text-xl md:text-2xl font-bold ${
                summary.currentBalance < 0 ? 'text-emerald-600' : summary.currentBalance === 0 ? 'text-gray-500' : 'text-red-600'
              }`}>
                {formatPointBalance(summary.currentBalance)}
              </div>
              <p className="text-xs text-teal-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                클릭하여 충전 요청 생성 →
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-arrow-down-circle-line text-orange-600 text-xl"></i>
              </div>
              <div className="text-sm text-gray-600">누적 포인트 사용</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-orange-600">
              {summary.totalPointUsage.toLocaleString()}
              <span className="text-base md:text-lg text-gray-500 ml-1">원</span>
            </div>
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 월별 주문 통계 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="ri-bar-chart-box-line text-teal-600"></i>
              월별 주문 통계 (최근 12개월)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyOrderStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === '주문금액') return [`${value.toLocaleString()}만원`, name];
                    return [`${value}건`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="주문건수" fill="rgba(20,184,166,0.8)" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="주문금액" fill="rgba(59,130,246,0.8)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 월별 포인트 사용 통계 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="ri-line-chart-line text-purple-600"></i>
              월별 포인트 사용 내역 (최근 12개월)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyPointStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number, name: string) => [`${value.toLocaleString()}원`, name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="포인트사용"
                  stroke="rgba(239,68,68,1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="포인트충전"
                  stroke="rgba(34,197,94,1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 탭 전환 */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="ri-shopping-bag-line mr-1.5"></i>
            주문 내역 ({filteredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'points'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="ri-wallet-3-line mr-1.5"></i>
            포인트 거래 내역 ({transactions.length})
          </button>
        </div>

        {/* 주문 내역 테이블 */}
        {activeTab === 'orders' && (
          <>
            {/* 기간 필터 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex flex-col lg:flex-row gap-3">
                {/* 날짜 범위 입력 */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  <span className="text-gray-400 text-sm flex-shrink-0">~</span>
                  <div className="relative flex-1">
                    <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>

                {/* 빠른 선택 프리셋 */}
                <div className="flex gap-2 flex-wrap lg:flex-nowrap">
                  <button
                    onClick={() => applyDatePreset('today')}
                    className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    오늘
                  </button>
                  <button
                    onClick={() => applyDatePreset('week')}
                    className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    이번주
                  </button>
                  <button
                    onClick={() => applyDatePreset('month')}
                    className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    이번달
                  </button>
                  <button
                    onClick={() => applyDatePreset('lastMonth')}
                    className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    지난달
                  </button>
                  <button
                    onClick={() => applyDatePreset('all')}
                    className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    전체
                  </button>
                </div>
              </div>

              {/* 활성 필터 태그 */}
              {hasDateFilter && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">적용된 필터:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    <i className="ri-calendar-line text-[10px]"></i>
                    {getDateRangeLabel()}
                    <button onClick={() => setDateRange({ start: '', end: '' })} className="ml-0.5 hover:text-purple-900 cursor-pointer">
                      <i className="ri-close-line text-[10px]"></i>
                    </button>
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-shopping-bag-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500">
                    {hasDateFilter ? '선택한 기간에 주문 내역이 없습니다.' : '주문 내역이 없습니다.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">주문번호</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">제품명</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">수량</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">단가</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">금액</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">주문일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{order.order_number}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">{order.product_name}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-gray-700">{order.quantity}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm text-gray-700">{order.unit_price.toLocaleString()}원</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-gray-900">{order.total_price.toLocaleString()}원</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === '배송완료'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === '배송중'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === '준비중'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {new Date(order.order_date).toLocaleDateString('ko-KR')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* 포인트 거래 내역 테이블 */}
        {activeTab === 'points' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-wallet-3-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">포인트 거래 내역이 없습니다.</p>
                <button
                  onClick={() => setShowChargeModal(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap mx-auto"
                >
                  <i className="ri-add-circle-line"></i>
                  첫 충전 요청 생성하기
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">포인트 거래 내역</span>
                  <button
                    onClick={() => setShowChargeModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-circle-line"></i>
                    충전 요청 생성
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">유형</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">금액</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">거래 후 잔액</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">설명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">일시</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((tx) => {
                        const isCharge = tx.type === 'charge' || tx.type === 'refund';
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isCharge ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {isCharge ? (
                                  <><i className="ri-arrow-up-line mr-1"></i>충전</>
                                ) : (
                                  <><i className="ri-arrow-down-line mr-1"></i>사용</>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`text-sm font-semibold ${isCharge ? 'text-green-600' : 'text-red-600'}`}>
                                {isCharge ? '+' : '-'}
                                {Math.abs(tx.amount).toLocaleString()}원
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-gray-700">{tx.balance_after.toLocaleString()}원</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{tx.description || '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {new Date(tx.created_at).toLocaleString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* 충전 요청 생성 모달 */}
      {showChargeModal && client && (
        <ChargeRequestModal
          client={client}
          onClose={() => setShowChargeModal(false)}
          onSuccess={handleChargeSuccess}
        />
      )}

      {/* 기간별 거래명세서 모달 */}
      {showPeriodStatement && client && (
        <ClientPeriodStatementModal
          client={client}
          onClose={() => setShowPeriodStatement(false)}
        />
      )}
    </div>
  );
}
