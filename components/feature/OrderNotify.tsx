
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NewOrder {
  id: string;
  client_name: string;
  product_name: string;
  total_price: number;
  order_date: string;
  order_number: string;
}

interface NotifyItem extends NewOrder {
  progress: number; // 0~100
}

const DURATION = 8000; // 8초
const TICK = 80;       // 80ms 간격으로 progress 업데이트

export default function OrderNotify() {
  const [items, setItems] = useState<NotifyItem[]>([]);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // 개별 알림 제거
  const dismiss = (id: string) => {
    setItems(prev => prev.filter(o => o.id !== id));
  };

  // progress 타이머
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setItems(prev =>
        prev
          .map(item => ({ ...item, progress: item.progress + (TICK / DURATION) * 100 }))
          .filter(item => item.progress < 100)
      );
    }, TICK);
    return () => clearInterval(timer);
  }, [items.length]);

  // Supabase Realtime 구독
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin_order_notify')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const o = payload.new as any;
          const newItem: NotifyItem = {
            id: o.id,
            client_name: o.client_name || '알 수 없음',
            product_name: o.product_name || '',
            total_price: o.total_price || 0,
            order_date: o.order_date || new Date().toISOString(),
            order_number: o.order_number || '',
            progress: 0,
          };
          setItems(prev => [newItem, ...prev.slice(0, 4)]); // 최대 5개
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  if (!isAdmin || items.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3 w-80">
      {items.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ animation: 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* 진행 바 (남은 시간 표시) */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-[#2B5F9E] transition-all"
              style={{ width: `${100 - order.progress}%` }}
            />
          </div>

          <div className="p-4">
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#2B5F9E] rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-shopping-bag-3-line text-white text-base"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">🎉 신규 주문 접수!</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    <span className="font-semibold text-[#2B5F9E]">{order.client_name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismiss(order.id)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>

            {/* 주문 정보 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
              {order.order_number && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">주문번호</span>
                  <span className="font-mono font-semibold text-[#2B5F9E] text-[11px]">{order.order_number}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">제품명</span>
                <span className="font-medium text-gray-800 truncate ml-2 max-w-[160px]">{order.product_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">주문 금액</span>
                <span className="font-bold text-[#2B5F9E]">₩{order.total_price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">주문 시간</span>
                <span className="text-gray-500">
                  {new Date(order.order_date).toLocaleString('ko-KR', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* 이동 버튼 */}
            <button
              onClick={() => { dismiss(order.id); navigate('/admin/orders'); }}
              className="w-full py-2 bg-[#2B5F9E] text-white text-xs font-semibold rounded-lg hover:bg-[#234b7d] transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <i className="ri-eye-line text-sm"></i>
              주문 관리에서 확인
            </button>
          </div>
        </div>
      ))}

      {/* 슬라이드인 애니메이션 키프레임 */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
