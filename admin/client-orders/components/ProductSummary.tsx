
import { useMemo } from 'react';

interface Order {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
}

interface ProductSummaryProps {
  orders: Order[];
}

export default function ProductSummary({ orders }: ProductSummaryProps) {
  const productStats = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number; count: number }>();
    orders.forEach(o => {
      const prev = map.get(o.product_name) || { qty: 0, revenue: 0, count: 0 };
      map.set(o.product_name, {
        qty: prev.qty + o.quantity,
        revenue: prev.revenue + o.total_price,
        count: prev.count + 1,
      });
    });
    return [...map.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const maxRevenue = productStats.length > 0 ? productStats[0].revenue : 1;

  if (productStats.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
          <i className="ri-pie-chart-line text-lg"></i>
        </div>
        제품별 주문 현황
      </h3>
      <div className="space-y-3">
        {productStats.map((item, i) => (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-800 truncate max-w-[50%]">{item.name}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">{item.count}건 / {item.qty}개</span>
                <span className="font-semibold text-gray-900 min-w-[80px] text-right">
                  {item.revenue.toLocaleString()}원
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-400 to-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
