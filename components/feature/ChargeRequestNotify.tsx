import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface ChargeRequest {
  id: string;
  client_id: string;
  amount: number;
  payment_method: string;
  created_at: string;
  client_name?: string;
}

export default function ChargeRequestNotify() {
  const [notification, setNotification] = useState<ChargeRequest | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const channel = supabase
      .channel('charge-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'charge_requests'
        },
        async (payload) => {
          const newRequest = payload.new as ChargeRequest;
          
          // 거래처명 조회
          const { data: clientData } = await supabase
            .from('clients')
            .select('name')
            .eq('id', newRequest.client_id)
            .single();

          setNotification({
            ...newRequest,
            client_name: clientData?.name || '알 수 없음'
          });

          // 8초 후 자동 닫힘
          setTimeout(() => {
            setNotification(null);
          }, 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!notification) return null;

  const paymentMethodText = {
    card: '카드결제',
    bank: '무통장입금',
    cash: '현금'
  }[notification.payment_method] || notification.payment_method;

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-teal-500 p-5 w-80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-money-dollar-circle-line text-white text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 mb-1">💰 포인트 충전 요청</h4>
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">{notification.client_name}</span>
            </p>
            <p className="text-sm text-gray-600 mb-1">
              요청 금액: <span className="font-bold text-teal-600">{notification.amount.toLocaleString()}원</span>
            </p>
            <p className="text-xs text-gray-500 mb-3">
              결제 수단: {paymentMethodText}
            </p>
            <button
              onClick={() => {
                navigate('/admin/points');
                setNotification(null);
              }}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors whitespace-nowrap"
            >
              포인트 관리에서 확인
            </button>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
}