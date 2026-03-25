import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export interface UrgentOrder {
  id: string;
  order_number: string;
  client_name: string;
  product_name: string;
  status: string;
  notes: string | null;
  order_date: string;
  total_price: number;
}

interface UrgentRequestsProps {
  orders: UrgentOrder[];
  onRefresh: () => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; approveLabel: string; approveStatus: string }> = {
  cancel_requested:   { label: '취소요청',  color: 'text-orange-700', bg: 'bg-orange-50',  approveLabel: '취소 승인',  approveStatus: 'cancelled' },
  return_requested:   { label: '반품요청',  color: 'text-orange-700', bg: 'bg-orange-50',  approveLabel: '반품 승인',  approveStatus: 'returned' },
  exchange_requested: { label: '교환요청',  color: 'text-cyan-700',   bg: 'bg-cyan-50',    approveLabel: '교환 승인',  approveStatus: 'exchanged' },
};

export default function UrgentRequests({ orders, onRefresh }: UrgentRequestsProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const getPreviousStatus = (notes: string | null): string => {
    try {
      const parsed = JSON.parse(notes || '{}');
      return parsed.previous_status || '주문확인';
    } catch {
      return '주문확인';
    }
  };

  const getReason = (notes: string | null, status: string): string => {
    try {
      const parsed = JSON.parse(notes || '{}');
      const key = status === 'cancel_requested' ? 'cancel_reason'
        : status === 'return_requested' ? 'return_reason'
        : 'exchange_reason';
      return parsed[key] || '사유 없음';
    } catch {
      return '사유 없음';
    }
  };

  const handleApprove = async (order: UrgentOrder) => {
    const meta = STATUS_META[order.status];
    if (!meta) return;
    setProcessing(order.id);
    try {
      await supabase.from('orders').update({ status: meta.approveStatus }).eq('id', order.id);
      onRefresh();
    } catch (e) {
      console.error('승인 실패:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (order: UrgentOrder) => {
    const prevStatus = getPreviousStatus(order.notes);
    setProcessing(order.id + '_reject');
    try {
      await supabase.from('orders').update({ status: prevStatus }).eq('id', order.id);
      onRefresh();
    } catch (e) {
      console.error('거절 실패:', e);
    } finally {
      setProcessing(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="ri-checkbox-circle-line text-emerald-500 text-xl"></i>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-700">처리 대기 없음</p>
          <p className="text-xs text-gray-400">취소·반품·교환 요청이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="ri-alarm-warning-line text-red-500 text-base animate-pulse"></i>
        </div>
        <h2 className="text-base font-bold text-gray-900">긴급 처리 대기</h2>
        <span className="ml-1 text-xs font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
          {orders.length}건
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {orders.map(order => {
          const meta = STATUS_META[order.status];
          if (!meta) return null;
          const isProc = processing === order.id || processing === order.id + '_reject';
          const reason = getReason(order.notes, order.status);

          return (
            <div key={order.id} className={`${meta.bg} border-2 border-orange-200 rounded-xl p-4`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} border-orange-200`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(order.order_date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{order.client_name}</p>
                  <p className="text-xs text-gray-500 truncate">{order.order_number}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">₩{order.total_price.toLocaleString()}</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-white/60 rounded-lg px-3 py-2 mb-3">
                <p className="font-medium text-gray-500 mb-0.5">사유</p>
                <p className="font-semibold">{reason}</p>
              </div>

              <p className="text-xs text-gray-500 truncate mb-3">
                <i className="ri-box-3-line mr-1"></i>{order.product_name}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(order)}
                  disabled={isProc}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {processing === order.id ? (
                    <i className="ri-loader-4-line animate-spin"></i>
                  ) : (
                    <><i className="ri-check-line mr-1"></i>{meta.approveLabel}</>
                  )}
                </button>
                <button
                  onClick={() => handleReject(order)}
                  disabled={isProc}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {processing === order.id + '_reject' ? (
                    <i className="ri-loader-4-line animate-spin"></i>
                  ) : (
                    <><i className="ri-close-line mr-1"></i>거절</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
