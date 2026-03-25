import { useState } from 'react';
import { usePoints } from '../../../../hooks/usePoints';
import { notifyClientPaymentSuccess } from '../../../../utils/kakaoNotify';
import { supabase } from '../../../../lib/supabase';

export default function ChargeRequestList() {
  const { chargeRequests, loading, approveChargeRequest, rejectChargeRequest, refresh } = usePoints();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; requestId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredRequests = chargeRequests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const handleApprove = async (requestId: string) => {
    if (!confirm('충전 요청을 승인하시겠습니까?')) return;

    setIsProcessing(true);
    try {
      await approveChargeRequest(requestId, '관리자');
      alert('충전이 승인되었습니다');
      await refresh();

      // ✅ 승인 후 거래처에 결제 완료 알림 발송
      const request = chargeRequests.find(r => r.id === requestId);
      if (request) {
        // 거래처 전화번호 조회
        const { data: clientData } = await supabase
          .from('clients')
          .select('phone')
          .eq('id', request.client_id)
          .maybeSingle();

        if (clientData?.phone) {
          // 충전 후 잔액 조회
          const { data: pointData } = await supabase
            .from('client_points')
            .select('point_balance')
            .eq('client_id', request.client_id)
            .maybeSingle();

          await notifyClientPaymentSuccess({
            clientPhone: clientData.phone,
            amount: request.total_amount,
            balance: pointData?.point_balance || 0,
          });
          console.log('✅ 거래처 결제 완료 알림 발송 완료');
        }
      }
    } catch (error) {
      console.error('충전 승인 실패:', error);
      alert('충전 승인에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (requestId: string) => {
    setRejectModal({ isOpen: true, requestId });
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectModal(null);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectChargeRequest(rejectModal.requestId, '관리자', rejectReason);
      alert('충전 요청이 거절되었습니다');
      closeRejectModal();
      await refresh();
    } catch (error) {
      console.error('충전 거절 실패:', error);
      alert('충전 거절에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full whitespace-nowrap">대기중</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full whitespace-nowrap">승인완료</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full whitespace-nowrap">거절됨</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">충전 요청 관리</h2>
            <span className="text-sm text-gray-500">
              총 {filteredRequests.length}건
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              대기중 ({chargeRequests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                filter === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              승인완료 ({chargeRequests.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                filter === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              거절됨 ({chargeRequests.filter(r => r.status === 'rejected').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 ({chargeRequests.length})
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">
              {filter === 'pending' ? '대기중인 충전 요청이 없습니다' : '충전 요청 내역이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{request.client_name}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-500">{request.business_number}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">요청일시</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(request.requested_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">충전금액</div>
                    <div className="text-lg font-bold text-gray-900">
                      {request.amount.toLocaleString()}원
                    </div>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-3">
                    <div className="text-xs text-teal-600 mb-1">보너스</div>
                    <div className="text-lg font-bold text-teal-600">
                      +{request.bonus_amount.toLocaleString()}원
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 mb-1">총 지급액</div>
                    <div className="text-lg font-bold text-blue-600">
                      {request.total_amount.toLocaleString()}원
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">결제방법</div>
                    <div className="text-sm font-medium text-gray-900">
                      {request.payment_method}
                    </div>
                  </div>
                </div>

                {request.status === 'approved' && request.processed_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <i className="ri-check-line"></i>
                      <span>
                        {new Date(request.processed_at).toLocaleString('ko-KR')}에 {request.processed_by}님이 승인
                      </span>
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && request.processed_at && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
                      <i className="ri-close-line"></i>
                      <span>
                        {new Date(request.processed_at).toLocaleString('ko-KR')}에 {request.processed_by}님이 거절
                      </span>
                    </div>
                    {request.reject_reason && (
                      <div className="text-sm text-red-600 ml-6">
                        사유: {request.reject_reason}
                      </div>
                    )}
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-check-line mr-2"></i>
                      승인
                    </button>
                    <button
                      onClick={() => openRejectModal(request.id)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-close-line mr-2"></i>
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 거절 사유 입력 모달 */}
      {rejectModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">충전 요청 거절</h3>
              <p className="text-sm text-gray-500 mt-1">거절 사유를 입력해주세요</p>
            </div>

            <div className="p-6">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="예: 입금 확인 불가, 서류 미비 등"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeRejectModal}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '처리중...' : '거절 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}