import { useMemo, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

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

interface ClientOrderStatsProps {
  orders: Order[];
  clientId?: string;
  dateRange?: { from: string; to: string };
}

interface PointTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function ClientOrderStats({ orders, clientId, dateRange }: ClientOrderStatsProps) {
  const [pointDeductions, setPointDeductions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // 포인트 차감 내역 조회
  useEffect(() => {
    if (!clientId) return;

    const fetchPointDeductions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('point_transactions')
          .select('id, amount, type, description, created_at')
          .eq('client_id', clientId)
          .eq('type', 'order')
          .order('created_at', { ascending: false });

        // 기간 필터 적용
        if (dateRange?.from) {
          query = query.gte('created_at', dateRange.from);
        }
        if (dateRange?.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          query = query.lte('created_at', toDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        setPointDeductions(data || []);
      } catch (error) {
        console.error('포인트 차감 내역 조회 실패:', error);
        setPointDeductions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPointDeductions();
  }, [clientId, dateRange]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
    const completedOrders = orders.filter(o => o.status === '배송완료');
    const completedRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // 포인트 차감 합계 (음수 금액의 절댓값 합계)
    const totalPointDeduction = pointDeductions.reduce((sum, pt) => sum + Math.abs(pt.amount), 0);

    // 미결제 잔액 = 총 주문금액 - 포인트 차감 합계
    const unpaidBalance = totalRevenue - totalPointDeduction;

    const productMap = new Map<string, number>();
    orders.forEach(o => {
      productMap.set(o.product_name, (productMap.get(o.product_name) || 0) + o.quantity);
    });
    const topProduct = [...productMap.entries()].sort((a, b) => b[1] - a[1])[0];

    const now = new Date();
    const thisMonth = orders.filter(o => {
      const d = new Date(o.order_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthRevenue = thisMonth.reduce((sum, o) => sum + o.total_price, 0);

    return {
      totalOrders: orders.length,
      totalRevenue,
      completedRevenue,
      avgOrderValue,
      topProduct: topProduct ? topProduct[0] : '-',
      topProductQty: topProduct ? topProduct[1] : 0,
      thisMonthOrders: thisMonth.length,
      thisMonthRevenue,
      totalPointDeduction,
      unpaidBalance,
    };
  }, [orders, pointDeductions]);

  const cards = [
    {
      label: '총 주문 건수',
      value: `${stats.totalOrders}건`,
      icon: 'ri-file-list-3-line',
      color: 'bg-sky-50 text-sky-600',
    },
    {
      label: '총 주문 금액',
      value: `${(stats.totalRevenue / 10000).toLocaleString()}만원`,
      icon: 'ri-money-dollar-circle-line',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: '포인트 차감 합계',
      value: loading ? '...' : `${(stats.totalPointDeduction / 10000).toLocaleString()}만원`,
      sub: `${pointDeductions.length}건 차감`,
      icon: 'ri-wallet-3-line',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: '미결제 잔액',
      value: loading ? '...' : `${(stats.unpaidBalance / 10000).toLocaleString()}만원`,
      sub: stats.unpaidBalance > 0 ? '정산 필요' : '정산 완료',
      icon: 'ri-alert-line',
      color: stats.unpaidBalance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
              <i className={`${card.icon} text-xl`}></i>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{card.value}</p>
          {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
          <p className="text-sm text-gray-500 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}