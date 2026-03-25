
import { useMemo } from 'react';

interface Order {
  id: string;
  order_date: string;
  total_price: number;
  status: string;
}

interface MonthlyChartProps {
  orders: Order[];
}

export default function MonthlyChart({ orders }: MonthlyChartProps) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string; revenue: number; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}월`;
      months.push({ label, key, revenue: 0, count: 0 });
    }

    orders.forEach(o => {
      const d = new Date(o.order_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find(m => m.key === key);
      if (month) {
        month.revenue += o.total_price;
        month.count += 1;
      }
    });

    return months;
  }, [orders]);

  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
          <i className="ri-line-chart-line text-lg"></i>
        </div>
        월별 주문 추이 (최근 6개월)
      </h3>
      <div className="flex items-end gap-3 h-40">
        {monthlyData.map((m, i) => {
          const height = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-gray-700">
                {m.revenue > 0 ? `${(m.revenue / 10000).toFixed(0)}만` : '-'}
              </div>
              <div className="w-full flex justify-center" style={{ height: '100px' }}>
                <div className="relative w-full max-w-[48px] flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-sky-400 to-sky-300 rounded-t-md transition-all duration-500 hover:from-sky-500 hover:to-sky-400"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">{m.label}</div>
              <div className="text-xs text-gray-400">{m.count}건</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
