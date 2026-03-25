import DeliveryTimeline from '../../my-orders/components/DeliveryTimeline';
import type { OrderRow } from './OrderHistoryTab';

interface DeliveryTrackingTabProps {
  orders: OrderRow[];
  loading: boolean;
}

const ACTIVE_STATUSES = ['주문확인', 'confirmed', '배송준비', '배송중', 'shipping'];

function getStepProgress(status: string): number {
  const map: Record<string, number> = {
    '주문접수': 0, 'pending': 0,
    '주문확인': 1, 'confirmed': 1,
    '배송준비': 2,
    '배송중': 3, 'shipping': 3,
    '배송완료': 4, 'delivered': 4,
  };
  return map[status] ?? 0;
}

function getStatusKorean(status: string): string {
  const map: Record<string, string> = {
    '주문접수': '주문접수', 'pending': '주문접수',
    '주문확인': '주문확인', 'confirmed': '주문확인',
    '배송준비': '배송준비',
    '배송중': '배송중', 'shipping': '배송중',
    '배송완료': '배송완료', 'delivered': '배송완료',
  };
  return map[status] ?? status;
}

export default function DeliveryTrackingTab({ orders, loading }: DeliveryTrackingTabProps) {
  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-[#E0D5C3] p-5 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-gray-100 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E0D5C3] p-14 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139,105,20,0.08)' }}>
          <i className="ri-truck-line text-3xl" style={{ color: '#8B6914' }}></i>
        </div>
        <p className="text-base font-bold mb-1" style={{ color: '#3D3428' }}>현재 배송중인 주문이 없습니다</p>
        <p className="text-sm" style={{ color: '#8C7E6A' }}>배송 준비중이거나 배송중인 주문이 있으면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
        <p className="text-sm font-semibold" style={{ color: '#5C5346' }}>
          현재 진행 중인 주문 <strong style={{ color: '#8B6914' }}>{activeOrders.length}건</strong>
        </p>
      </div>

      {activeOrders.map(order => {
        const stepIdx = getStepProgress(order.status);
        const statusKr = getStatusKorean(order.status);
        const isShipping = order.status === '배송중' || order.status === 'shipping';

        return (
          <div key={order.id} className="bg-white rounded-xl border border-[#E0D5C3] overflow-hidden">
            {/* 주문 헤더 */}
            <div className="px-4 py-3 border-b border-[#F0E8D8] flex items-center justify-between gap-2 flex-wrap" style={{ background: '#FAF6F0' }}>
              <div>
                <p className="text-xs font-bold" style={{ color: '#3D3428' }}>주문번호: {order.id}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#8C7E6A' }}>
                  주문일 {new Date(order.orderedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isShipping ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>
                {isShipping && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse flex-shrink-0"></span>}
                <i className={isShipping ? 'ri-truck-line' : 'ri-settings-3-line'}></i>
                {statusKr}
              </div>
            </div>

            {/* 제품 목록 */}
            <div className="px-4 pt-3 pb-1">
              {order.items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#F8F4EC] last:border-0">
                  <p className="text-sm font-semibold truncate flex-1" style={{ color: '#3D3428' }}>{item.productName}</p>
                  <p className="text-xs text-gray-400 ml-4 flex-shrink-0">x{item.quantity}</p>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-xs mt-1.5 pb-1" style={{ color: '#8C7E6A' }}>외 {order.items.length - 2}개 품목</p>
              )}
            </div>

            {/* 배송 진행 단계 */}
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#8C7E6A' }}>배송 진행 현황</p>
              <DeliveryTimeline status={order.status} />
            </div>

            {/* 예상 정보 */}
            {stepIdx >= 1 && (
              <div className="mx-4 mb-4 mt-1 rounded-lg px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(139,105,20,0.06)', border: '1px solid rgba(139,105,20,0.15)' }}>
                <i className="ri-time-line text-sm flex-shrink-0" style={{ color: '#8B6914' }}></i>
                <p className="text-xs font-medium" style={{ color: '#5C5346' }}>
                  {isShipping
                    ? '현재 배송 중입니다. 곧 도착 예정입니다.'
                    : '주문이 확인되어 배송 준비 중입니다.'}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
