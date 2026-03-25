import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StatusNotification {
  id: string;
  orderNumber: string;
  status: string;
  timestamp: number;
}

const statusLabels: Record<string, string> = {
  pending: '주문 접수',
  confirmed: '주문 확인',
  processing: '제작 중',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
};

export default function DeliveryStatusNotify() {
  const [notifications, setNotifications] = useState<StatusNotification[]>([]);
  const { businessNo } = useAuth();

  useEffect(() => {
    if (!businessNo) return;

    const cleanBizNo = businessNo.replace(/-/g, '');

    // Supabase Realtime으로 주문 상태 변경 감지
    const channel = supabase
      .channel('order-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `client_business_number=eq.${cleanBizNo}`,
        },
        (payload) => {
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;

          // 상태가 실제로 변경된 경우만 알림 표시
          if (newOrder.status !== oldOrder.status) {
            const notification: StatusNotification = {
              id: `${newOrder.id}-${Date.now()}`,
              orderNumber: newOrder.order_number || newOrder.id,
              status: newOrder.status,
              timestamp: Date.now(),
            };

            setNotifications((prev) => [...prev, notification]);

            // 8초 후 자동 제거
            setTimeout(() => {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
            }, 8000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessNo]);

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 w-80">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in-right"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <i className="ri-truck-line text-teal-600 text-lg"></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  주문 상태 변경
                </h4>
                <p className="text-xs text-gray-500">
                  주문번호: {notification.orderNumber}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleClose(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
          <div className="ml-10">
            <p className="text-sm text-gray-700">
              상태가{' '}
              <span className="font-semibold text-teal-600">
                {statusLabels[notification.status] || notification.status}
              </span>
              (으)로 변경되었습니다.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}