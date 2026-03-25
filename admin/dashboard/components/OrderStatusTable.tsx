import { useState, useMemo } from 'react';
import { supabase } from '../../../../lib/supabase';

export interface OrderRow {
  id: string;
  order_number: string;
  client_name: string;
  product_name: string;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
}

interface OrderStatusTableProps {
  orders: OrderRow[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_OPTIONS = [
  '주문접수', '주문확인', '배송준비', '배송중', '배송완료',
  '취소요청', '취소완료', '반품요청', '반품완료', '교환요청', '교환완료',
];

const STATUS_MAP: Record<string, string> = {
  pending: '주문접수', confirmed: '주문확인', shipping: '배송중', delivered: '배송완료',
  cancel_requested: '취소요청', cancelled: '취소완료',
  return_requested: '반품요청', returned: '반품완료',
  exchange_requested: '교환요청', exchanged: '교환완료',
};

const STATUS_COLORS: Record<string, string> = {
  '주문접수': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '주문확인': 'bg-teal-50 text-teal-700 border-teal-200',
  'confirmed': 'bg-teal-50 text-teal-700 border-teal-200',
  '배송준비': 'bg-amber-50 text-amber-700 border-amber-200',
  '배송중': 'bg-violet-50 text-violet-700 border-violet-200',
  'shipping': 'bg-violet-50 text-violet-700 border-violet-200',
  '배송완료': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'cancel_requested': 'bg-orange-50 text-orange-700 border-orange-200',
  '취소요청': 'bg-orange-50 text-orange-700 border-orange-200',
  'cancelled': 'bg-red-50 text-red-700 border-red-200',
  '취소완료': 'bg-red-50 text-red-700 border-red-200',
  '주문취소': 'bg-red-50 text-red-700 border-red-200',
  'return_requested': 'bg-orange-50 text-orange-600 border-orange-200',
  '반품요청': 'bg-orange-50 text-orange-600 border-orange-200',
  'returned': 'bg-gray-100 text-gray-500 border-gray-200',
  '반품완료': 'bg-gray-100 text-gray-500 border-gray-200',
  'exchange_requested': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  '교환요청': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'exchanged': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  '교환완료': 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

const FILTER_TABS = [
  { key: 'all',               label: '전체' },
  { key: 'pending',           label: '대기' },
  { key: '주문확인',           label: '확인' },
  { key: '배송중',             label: '배송' },
  { key: '배송완료',           label: '완료' },
  { key: 'cancel_requested',  label: '취소요청' },
  { key: 'exchange_requested',label: '교환요청' },
  { key: 'return_requested',  label: '반품요청' },
];

function getStatusLabel(status: string): string {
  return STATUS_MAP[status] || status;
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-50 text-gray-600 border-gray-200';
}

export default function OrderStatusTable({ orders, loading, onRefresh }: OrderStatusTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const NEXT_STATUS_OPTIONS: Record<string, string[]> = {
    '주문접수': ['주문확인', '배송준비', '배송중', '배송완료', '취소완료'],
    'pending':  ['주문확인', '배송준비', '배송중', '배송완료', '취소완료'],
    '주문확인': ['배송준비', '배송중', '배송완료', '취소완료'],
    'confirmed':['배송준비', '배송중', '배송완료', '취소완료'],
    '배송준비': ['배송중', '배송완료'],
    '배송중':   ['배송완료'],
    'shipping': ['배송완료'],
  };

  const getStatusOptions = (status: string): string[] => {
    return NEXT_STATUS_OPTIONS[status] || STATUS_OPTIONS;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      onRefresh();
    } catch (e) {
      console.error('상태 변경 실패:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        o.client_name.toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="ri-file-list-3-line text-teal-600 text-base"></i>
          </div>
          <h2 className="text-base font-bold text-gray-900">주문 현황</h2>
          <span className="text-xs text-gray-400 font-medium">최근 50건</span>
        </div>
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="거래처명, 주문번호 검색..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full sm:w-56 focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>

      {/* 상태 필터 탭 */}
      <div className="px-5 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto">
        {FILTER_TABS.map(tab => {
          const cnt = tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length;
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${isActive ? 'bg-teal-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              {tab.label}
              <span className={`text-[10px] px-1 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center">
          <i className="ri-file-list-3-line text-3xl text-gray-300 mb-2 block"></i>
          <p className="text-sm text-gray-400">해당 조건의 주문이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">주문번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">거래처명</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap hidden md:table-cell">제품명</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap hidden sm:table-cell">수량</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">금액</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">상태</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap hidden lg:table-cell">주문일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">상태변경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-700 whitespace-nowrap">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{order.client_name}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-600 max-w-[160px] truncate">{order.product_name}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600 hidden sm:table-cell">{order.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap">₩{order.total_price.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-full border ${getStatusColor(order.status)} whitespace-nowrap`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(order.order_date).toLocaleDateString('ko-KR')}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {updatingId === order.id ? (
                      <div className="flex justify-center">
                        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-teal-400 cursor-pointer w-28"
                      >
                        <option value={order.status}>{getStatusLabel(order.status)}</option>
                        {getStatusOptions(order.status).filter(s => s !== getStatusLabel(order.status) && s !== order.status).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
