import { useState, useMemo } from 'react';
import DeliveryTimeline from '../../my-orders/components/DeliveryTimeline';

interface OrderItem {
  productName: string;
  quantity: number;
  totalPrice: number;
  productCode?: string;
}

export interface OrderRow {
  id: string;
  dbId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  orderedAt: string;
}

interface OrderHistoryTabProps {
  orders: OrderRow[];
  loading: boolean;
}

type MonthFilter = 'all' | 'this-month' | 'last-month';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  '주문접수':         { label: '주문접수',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  '주문확인':         { label: '주문확인',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'confirmed':        { label: '주문확인',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  '배송준비':         { label: '배송준비',  cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  '배송중':           { label: '배송중',    cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  'shipping':         { label: '배송중',    cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  '배송완료':         { label: '배송완료',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'delivered':        { label: '배송완료',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'cancel_requested': { label: '취소요청',  cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  'cancelled':        { label: '취소완료',  cls: 'bg-red-50 text-red-600 border-red-200' },
  '주문취소':         { label: '취소완료',  cls: 'bg-red-50 text-red-600 border-red-200' },
  'exchange_requested': { label: '교환요청', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'exchanged':        { label: '교환완료',  cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'return_requested': { label: '반품요청',  cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  'returned':         { label: '반품완료',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function getStatusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
}

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: '주문접수', label: '주문접수' },
  { key: '주문확인', label: '주문확인' },
  { key: '배송중', label: '배송중' },
  { key: '배송완료', label: '배송완료' },
  { key: 'cancel_requested', label: '취소요청' },
  { key: 'cancelled', label: '취소완료' },
  { key: 'return_requested', label: '반품요청' },
  { key: 'returned', label: '반품완료' },
];

export default function OrderHistoryTab({ orders, loading }: OrderHistoryTabProps) {
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const date = new Date(o.orderedAt);
      if (monthFilter === 'this-month') {
        if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return false;
      } else if (monthFilter === 'last-month') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lme = new Date(now.getFullYear(), now.getMonth(), 0);
        if (date < lm || date > lme) return false;
      }
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, monthFilter, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-[#E0D5C3] p-5 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* 월별 필터 */}
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-[#E0D5C3]">
          {([
            { key: 'this-month', label: '이번달' },
            { key: 'last-month', label: '지난달' },
            { key: 'all',        label: '전체' },
          ] as { key: MonthFilter; label: string }[]).map(b => (
            <button
              key={b.key}
              onClick={() => setMonthFilter(b.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${monthFilter === b.key ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
              style={monthFilter === b.key ? { background: '#8B6914' } : {}}
            >
              {b.label}
            </button>
          ))}
        </div>
        {/* 상태별 필터 */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTER_OPTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${statusFilter === s.key ? 'text-white border-transparent' : 'bg-white border-[#E0D5C3] text-gray-500 hover:border-[#8B6914]/40'}`}
              style={statusFilter === s.key ? { background: '#8B6914' } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: 'ri-shopping-bag-line', label: '총 주문', value: `${filtered.length}건`, color: 'text-amber-700' },
          { icon: 'ri-money-dollar-circle-line', label: '총 금액', value: `₩${filtered.reduce((s,o) => s + o.totalAmount, 0).toLocaleString()}`, color: 'text-emerald-700' },
          { icon: 'ri-box-3-line', label: '총 품목', value: `${filtered.reduce((s,o) => s + o.items.length, 0)}개`, color: 'text-violet-700' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#E0D5C3] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.08)' }}>
              <i className={`${stat.icon} text-base`} style={{ color: '#8B6914' }}></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
              <p className={`text-sm font-bold ${stat.color} truncate`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 주문 목록 */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0D5C3] p-12 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(139,105,20,0.08)' }}>
            <i className="ri-file-list-3-line text-2xl" style={{ color: '#8B6914' }}></i>
          </div>
          <p className="text-sm font-medium" style={{ color: '#5C5346' }}>해당 조건의 주문이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const meta = getStatusMeta(order.status);
            return (
              <div key={order.id} className="bg-white rounded-xl border border-[#E0D5C3] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F0E8D8] flex items-center justify-between gap-2 flex-wrap" style={{ background: '#FAF6F0' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#3D3428' }}>주문번호: {order.id}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#8C7E6A' }}>
                      {new Date(order.orderedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.cls}`}>{meta.label}</span>
                    <span className="text-sm font-bold" style={{ color: '#8B6914' }}>₩{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#F0E8D8] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#3D3428' }}>{item.productName}</p>
                        {item.productCode && <p className="text-[10px] font-mono" style={{ color: '#8C7E6A' }}>{item.productCode}</p>}
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                        <p className="text-xs font-bold" style={{ color: '#5C5346' }}>₩{(item.totalPrice ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {/* 배송 타임라인 */}
                  <div className="mt-3 pt-3 border-t border-[#F0E8D8]">
                    <DeliveryTimeline status={order.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
