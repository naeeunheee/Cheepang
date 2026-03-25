import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface PaymentRequestNotifyProps {
  isOpen: boolean;
  clients: Array<{
    id: string;
    name: string;
    clinic_name: string | null;
    phone: string | null;
    debtAmount: number;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentRequestNotify({
  isOpen,
  clients,
  onClose,
  onSuccess,
}: PaymentRequestNotifyProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifyMethod, setNotifyMethod] = useState<'kakao' | 'sms'>('kakao');

  useEffect(() => {
    if (isOpen) {
      setSent(false);
      setSending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalDebt = clients.reduce((sum, c) => sum + c.debtAmount, 0);

  const buildKakaoMessage = (clientName: string, debtAmount: number) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    let msg = `💳 [치팡] 결제 요청 안내\n\n`;
    msg += `안녕하세요, ${clientName}님.\n`;
    msg += `미수금 결제를 요청드립니다.\n\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💰 미수금액: ₩${debtAmount.toLocaleString()}\n`;
    msg += `📅 확인일: ${dateStr}\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;
    msg += `원활한 거래를 위해 미수금 결제를 부탁드립니다.\n`;
    msg += `결제 방법은 아래 연락처로 문의해주세요.\n\n`;
    msg += `📞 고객센터: 010-XXXX-XXXX\n`;
    msg += `💳 계좌번호: 하나은행 123-456789-01234\n`;
    msg += `예금주: (주)하이니스중부지사\n\n`;
    msg += `감사합니다.\n`;
    msg += `(주)하이니스중부지사 - 치팡 드림`;
    return msg;
  };

  const handleSendNotifications = async () => {
    setSending(true);

    try {
      // 각 거래처별로 알림 발송 이력 기록
      const transactions = clients.map(client => ({
        client_id: client.id,
        client_name: client.clinic_name || client.name,
        type: 'notify',
        amount: 0,
        balance_after: -client.debtAmount,
        description: `미수금 결제 요청 알림 발송 (${notifyMethod === 'kakao' ? '카카오톡' : 'SMS'})`,
        admin_note: `미수금 ${client.debtAmount.toLocaleString()}원 결제 요청`,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('point_transactions')
        .insert(transactions);

      if (error) throw error;

      // 카카오톡 발송
      if (notifyMethod === 'kakao') {
        // 첫 번째 거래처 메시지로 카카오톡 열기
        if (clients.length > 0) {
          const firstClient = clients[0];
          const text = buildKakaoMessage(
            firstClient.clinic_name || firstClient.name,
            firstClient.debtAmount
          );
          const encoded = encodeURIComponent(text);
          window.open(
            `https://sharer.kakao.com/talk/friends/picker/shorturl?url=&text=${encoded}`,
            '_blank',
            'width=480,height=640'
          );
        }
      }

      setTimeout(() => {
        setSending(false);
        setSent(true);
        onSuccess();
      }, 1000);
    } catch (error) {
      console.error('알림 발송 실패:', error);
      alert('알림 발송에 실패했습니다.');
      setSending(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[70]"
        onClick={onClose}
      ></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="ri-notification-3-line text-xl text-white"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">미수금 결제 요청 알림</h3>
                <p className="text-xs text-white/80 mt-0.5">선택한 거래처에 결제 요청을 보냅니다</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl text-white"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-red-700">선택된 거래처</span>
              <span className="text-lg font-bold text-red-600">{clients.length}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-700">총 미수금액</span>
              <span className="text-xl font-bold text-red-600">₩{totalDebt.toLocaleString()}</span>
            </div>
          </div>

          {/* Client List */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">알림 발송 대상</p>
            <div className="bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {client.clinic_name || client.name}
                    </p>
                    {client.phone && (
                      <p className="text-xs text-gray-500">{client.phone}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-red-600">
                      ₩{client.debtAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Method */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">알림 발송 방법</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNotifyMethod('kakao')}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  notifyMethod === 'kakao'
                    ? 'border-[#FEE500] bg-[#FEE500]/10'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <i className="ri-kakao-talk-fill text-xl text-[#3C1E1E] w-5 h-5 flex items-center justify-center"></i>
                  <span className="text-sm font-bold text-gray-900">카카오톡</span>
                </div>
                <p className="text-xs text-gray-500 text-center">즉시 발송</p>
              </button>
              <button
                onClick={() => setNotifyMethod('sms')}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  notifyMethod === 'sms'
                    ? 'border-[#2B5F9E] bg-[#2B5F9E]/10'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <i className="ri-message-3-line text-xl text-[#2B5F9E] w-5 h-5 flex items-center justify-center"></i>
                  <span className="text-sm font-bold text-gray-900">문자(SMS)</span>
                </div>
                <p className="text-xs text-gray-500 text-center">준비중</p>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          {notifyMethod === 'kakao' && clients.length > 0 && (
            <div className="bg-[#FEE500]/15 border border-[#FEE500]/50 rounded-xl p-3.5 mb-5">
              <div className="flex items-center gap-2 justify-center mb-1.5">
                <i className="ri-kakao-talk-fill text-lg text-[#3C1E1E] w-5 h-5 flex items-center justify-center"></i>
                <span className="text-xs font-bold text-[#3C1E1E]">카카오톡 메시지 미리보기</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-[11px] text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
                <p>💳 [치팡] 결제 요청 안내</p>
                <p className="mt-1">안녕하세요, {clients[0].clinic_name || clients[0].name}님.</p>
                <p>미수금 결제를 요청드립니다.</p>
                <p className="mt-1">━━━━━━━━━━━━━━━</p>
                <p>💰 미수금액: ₩{clients[0].debtAmount.toLocaleString()}</p>
                <p className="text-gray-400 mt-1">...</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-check-double-line text-2xl text-emerald-600"></i>
              </div>
              <p className="text-sm font-bold text-emerald-700 mb-1">알림 발송 완료!</p>
              <p className="text-xs text-gray-500 mb-4">
                {clients.length}개 거래처에 결제 요청 알림이 전송되었습니다.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                닫기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleSendNotifications}
                disabled={sending || notifyMethod === 'sms'}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#3C1E1E]/30 border-t-[#3C1E1E] rounded-full animate-spin"></div>
                    발송 중...
                  </>
                ) : (
                  <>
                    <i className={`${notifyMethod === 'kakao' ? 'ri-kakao-talk-fill' : 'ri-message-3-line'} text-lg w-5 h-5 flex items-center justify-center`}></i>
                    {notifyMethod === 'kakao' ? '카카오톡으로 알림 보내기' : 'SMS로 알림 보내기'}
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}