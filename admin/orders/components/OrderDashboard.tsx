
import { useMemo, useState } from 'react';

interface Order {
  id: string;
  client_id: string;
  client_name: string;
  order_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  order_date: string;
  delivery_date: string | null;
  notes: string;
}

interface OrderDashboardProps {
  orders: Order[];
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const STATUS_COLORS: Record<string, string> = {
  '배송완료': '#10b981',
  '배송중': '#3b82f6',
  '준비중': '#f59e0b',
  '주문확인': '#8b5cf6',
  '취소': '#ef4444',
};

export default function OrderDashboard({ orders }: OrderDashboardProps) {
  const [chartType, setChartType] = useState<'revenue' | 'count'>('revenue');

  // 월별 통계
  const monthlyData = useMemo(() => {
    const data: Record<number, { revenue: number; count: number }> = {};
    for (let i = 1; i <= 12; i++) data[i] = { revenue: 0, count: 0 };

    orders.forEach((order) => {
      const month = new Date(order.order_date).getMonth() + 1;
      if (data[month]) {
        data[month].revenue += order.total_price;
        data[month].count += 1;
      }
    });
    return data;
  }, [orders]);

  const maxRevenue = useMemo(() => Math.max(...Object.values(monthlyData).map((d) => d.revenue), 1), [monthlyData]);
  const maxCount = useMemo(() => Math.max(...Object.values(monthlyData).map((d) => d.count), 1), [monthlyData]);

  // 제품별 통계 (상위 6개)
  const productStats = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    orders.forEach((order) => {
      if (!map[order.product_name]) map[order.product_name] = { revenue: 0, count: 0 };
      map[order.product_name].revenue += order.total_price;
      map[order.product_name].count += order.quantity;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 6);
  }, [orders]);

  const maxProductRevenue = useMemo(() => Math.max(...productStats.map(([, v]) => v.revenue), 1), [productStats]);

  // 거래처별 통계
  const clientStats = useMemo(() => {
    const map: Record<string, { revenue: number; count: number; clientId: string }> = {};
    orders.forEach((order) => {
      if (!map[order.client_name]) map[order.client_name] = { revenue: 0, count: 0, clientId: order.client_id };
      map[order.client_name].revenue += order.total_price;
      map[order.client_name].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [orders]);

  // 상태별 통계
  const statusStats = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((order) => {
      map[order.status] = (map[order.status] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const totalStatusCount = orders.length || 1;

  // 이번 달 vs 지난 달
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const thisMonthRevenue = monthlyData[thisMonth]?.revenue || 0;
  const lastMonthRevenue = monthlyData[lastMonth]?.revenue || 0;
  const revenueGrowth = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0;

  const PRODUCT_COLORS = ['#2B5F9E', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  return (
    <div className="space-y-6 mb-8">
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg text-[#2B5F9E]">
              <i className="ri-calendar-line text-xl"></i>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${revenueGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(thisMonthRevenue / 10000).toLocaleString()}만원</p>
          <p className="text-xs text-gray-500 mt-1">이번 달 매출</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 rounded-lg text-emerald-600">
              <i className="ri-bar-chart-line text-xl"></i>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{(lastMonthRevenue / 10000).toLocaleString()}만원</p>
          <p className="text-xs text-gray-500 mt-1">지난 달 매출</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 flex items-center justify-center bg-amber-50 rounded-lg text-amber-600">
              <i className="ri-store-line text-xl"></i>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{clientStats.length}개</p>
          <p className="text-xs text-gray-500 mt-1">활성 거래처</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-lg text-indigo-600">
              <i className="ri-box-3-line text-xl"></i>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{productStats.length}종</p>
          <p className="text-xs text-gray-500 mt-1">판매 제품 종류</p>
        </div>
      </div>

      {/* 월별 추이 차트 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">월별 주문 추이</h3>
            <p className="text-xs text-gray-400 mt-0.5">2024년 기준</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('revenue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${chartType === 'revenue' ? 'bg-white text-[#2B5F9E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              매출액
            </button>
            <button
              onClick={() => setChartType('count')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${chartType === 'count' ? 'bg-white text-[#2B5F9E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              주문 건수
            </button>
          </div>
        </div>

        <div className="flex items-end gap-2 h-48">
          {MONTH_LABELS.map((label, idx) => {
            const month = idx + 1;
            const value = chartType === 'revenue' ? monthlyData[month].revenue : monthlyData[month].count;
            const max = chartType === 'revenue' ? maxRevenue : maxCount;
            const heightPct = max > 0 ? (value / max) * 100 : 0;
            const isCurrentMonth = month === thisMonth;

            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '160px' }}>
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {chartType === 'revenue' ? `${(value / 10000).toLocaleString()}만원` : `${value}건`}
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${isCurrentMonth ? 'bg-[#2B5F9E]' : 'bg-blue-200 group-hover:bg-[#2B5F9E]/70'}`}
                    style={{ height: `${Math.max(heightPct, value > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className={`text-xs ${isCurrentMonth ? 'text-[#2B5F9E] font-bold' : 'text-gray-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 제품별 매출 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-5">제품별 매출 현황</h3>
          <div className="space-y-3">
            {productStats.map(([name, stat], idx) => {
              const pct = Math.round((stat.revenue / maxProductRevenue) * 100);
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 truncate max-w-[60%]" title={name}>{name}</span>
                    <span className="text-xs font-semibold text-gray-900">{(stat.revenue / 10000).toLocaleString()}만원</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: PRODUCT_COLORS[idx % PRODUCT_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 거래처별 + 상태별 */}
        <div className="space-y-6">
          {/* 주문 상태 분포 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4">주문 상태 분포</h3>
            <div className="flex items-center gap-4">
              {/* 도넛 차트 (CSS) */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  {(() => {
                    let offset = 0;
                    return statusStats.map(([status, count], idx) => {
                      const pct = (count / totalStatusCount) * 100;
                      const color = STATUS_COLORS[status] || '#94a3b8';
                      const el = (
                        <circle
                          key={status}
                          cx="18" cy="18" r="15.9"
                          fill="none"
                          stroke={color}
                          strokeWidth="3.8"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-800">{orders.length}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {statusStats.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[status] || '#94a3b8' }} />
                      <span className="text-xs text-gray-600">{status}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{count}건</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 거래처별 주문 현황 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4">거래처별 주문 현황</h3>
            <div className="space-y-3">
              {clientStats.map(([name, stat], idx) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-[#2B5F9E] text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{(stat.revenue / 10000).toLocaleString()}만원</p>
                    <p className="text-xs text-gray-400">{stat.count}건</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
