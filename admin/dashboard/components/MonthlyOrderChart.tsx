import { useMemo } from 'react';

interface OrderData {
  order_date: string;
  total_price: number;
  status: string;
}

interface MonthlyOrderChartProps {
  orders: OrderData[];
}

export default function MonthlyOrderChart({ orders }: MonthlyOrderChartProps) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { label: string; month: string; key: string; count: number; revenue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        label: `${d.getMonth() + 1}월`,
        month: `${d.getFullYear()}.${d.getMonth() + 1}`,
        key,
        count: 0,
        revenue: 0,
      });
    }

    orders.forEach(o => {
      if (['cancelled', '주문취소', 'returned'].includes(o.status)) return;
      const d = new Date(o.order_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find(m => m.key === key);
      if (m) {
        m.count += 1;
        m.revenue += o.total_price;
      }
    });

    return months;
  }, [orders]);

  const maxCount = Math.max(...monthlyData.map(m => m.count), 1);
  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="ri-bar-chart-grouped-line text-sky-600 text-base"></i>
        </div>
        <h2 className="text-base font-bold text-gray-900">월별 주문 추이</h2>
        <span className="text-xs text-gray-400">최근 6개월</span>
      </div>

      {/* 이중 바 차트 (주문건수 + 매출) */}
      <div className="flex items-end gap-4" style={{ height: '140px' }}>
        {monthlyData.map((m, i) => {
          const countH = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
          const revH = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
          const isCurrentMonth = i === monthlyData.length - 1;
          return (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1 h-full">
              {/* 금액 레이블 */}
              <div className="text-[10px] font-semibold text-gray-500 text-center">
                {m.revenue > 0 ? `${Math.round(m.revenue / 10000)}만` : ''}
              </div>

              {/* 바 영역 */}
              <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '90px' }}>
                {/* 주문건수 바 */}
                <div className="flex-1 flex items-end max-w-[20px]">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${isCurrentMonth ? 'bg-teal-500' : 'bg-teal-200'}`}
                    style={{ height: `${Math.max(countH, 2)}%` }}
                    title={`${m.count}건`}
                  ></div>
                </div>
                {/* 매출 바 */}
                <div className="flex-1 flex items-end max-w-[20px]">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${isCurrentMonth ? 'bg-sky-400' : 'bg-sky-100'}`}
                    style={{ height: `${Math.max(revH, 2)}%` }}
                    title={`₩${m.revenue.toLocaleString()}`}
                  ></div>
                </div>
              </div>

              {/* 라벨 */}
              <div className={`text-[11px] font-semibold text-center ${isCurrentMonth ? 'text-teal-600' : 'text-gray-500'}`}>
                {m.label}
              </div>
              <div className="text-[10px] text-gray-400 font-medium">{m.count}건</div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-400 flex-shrink-0"></span>
          <span className="text-xs text-gray-500">주문건수</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sky-300 flex-shrink-0"></span>
          <span className="text-xs text-gray-500">매출 (정규화)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-500 flex-shrink-0"></span>
          <span className="text-xs text-teal-600 font-medium">이번달</span>
        </div>
      </div>

      {/* 요약 행 */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: '이번달 주문', value: `${monthlyData[5]?.count ?? 0}건`, icon: 'ri-calendar-line', color: 'text-teal-600' },
          { label: '이번달 매출', value: `₩${(monthlyData[5]?.revenue ?? 0).toLocaleString()}`, icon: 'ri-money-dollar-circle-line', color: 'text-sky-600' },
          { label: '6개월 합계', value: `${monthlyData.reduce((s,m) => s + m.count, 0)}건`, icon: 'ri-bar-chart-line', color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <i className={`${s.icon} text-sm w-4 h-4 flex items-center justify-center ${s.color}`}></i>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
