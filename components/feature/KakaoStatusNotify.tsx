
import { useState, useEffect } from 'react';

interface KakaoStatusNotifyProps {
  isOpen: boolean;
  orderId: string;
  clientName: string;
  newStatus: string;
  productSummary?: string;
  totalAmount?: number;
  onClose: () => void;
}

const statusMessages: Record<string, { emoji: string; title: string; desc: string; color: string; bgColor: string; iconBg: string }> = {
  '준비중': {
    emoji: '📦',
    title: '제품 준비 시작',
    desc: '주문하신 제품을 준비하고 있습니다.',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
  },
  '배송중': {
    emoji: '🚚',
    title: '배송 출발',
    desc: '제품이 배송을 시작했습니다. 곧 도착할 예정입니다.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
  },
  '배송완료': {
    emoji: '✅',
    title: '배송 완료',
    desc: '제품이 배송 완료되었습니다. 확인 부탁드립니다.',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100',
  },
  '주문확인': {
    emoji: '📋',
    title: '주문 확인',
    desc: '주문이 확인되었습니다.',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-100',
  },
  '주문접수': {
    emoji: '📋',
    title: '주문 접수',
    desc: '주문이 접수되었습니다.',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-100',
  },
};

export default function KakaoStatusNotify({
  isOpen,
  orderId,
  clientName,
  newStatus,
  productSummary,
  totalAmount,
  onClose,
}: KakaoStatusNotifyProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSent(false);
      setSending(false);
    }
  }, [isOpen, orderId, newStatus]);

  if (!isOpen) return null;

  const statusInfo = statusMessages[newStatus] || statusMessages['주문확인'];

  const buildKakaoMessage = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let msg = `${statusInfo.emoji} [치팡] 주문 상태 알림\n\n`;
    msg += `안녕하세요, ${clientName}님.\n`;
    msg += `주문 상태가 변경되었습니다.\n\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `📌 주문번호: ${orderId}\n`;
    msg += `📦 상태: ${newStatus}\n`;
    if (productSummary) {
      msg += `🏷️ 제품: ${productSummary}\n`;
    }
    if (totalAmount && totalAmount > 0) {
      msg += `💰 금액: ₩${totalAmount.toLocaleString()}\n`;
    }
    msg += `🕐 변경일시: ${dateStr}\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;

    switch (newStatus) {
      case '준비중':
        msg += `주문하신 제품을 정성껏 준비하고 있습니다.\n출고 준비가 완료되면 다시 안내드리겠습니다.`;
        break;
      case '배송중':
        msg += `제품이 배송을 시작했습니다!\n영업일 기준 1~2일 내 도착 예정입니다.\n배송 관련 문의: 010-XXXX-XXXX`;
        break;
      case '배송완료':
        msg += `제품이 배송 완료되었습니다.\n제품 확인 후 문제가 있으시면 연락 부탁드립니다.\n📞 고객센터: 010-XXXX-XXXX`;
        break;
      default:
        msg += `주문이 정상적으로 처리되고 있습니다.`;
    }

    msg += `\n\n하이니스 / 치팡 드림`;
    return msg;
  };

  const handleSendKakao = () => {
    setSending(true);
    const text = buildKakaoMessage();
    const encoded = encodeURIComponent(text);
    window.open(
      `https://sharer.kakao.com/talk/friends/picker/shorturl?url=&text=${encoded}`,
      '_blank',
      'width=480,height=640',
    );
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1000);
  };

  const getStatusIcon = () => {
    switch (newStatus) {
      case '준비중':
        return 'ri-box-3-line';
      case '배송중':
        return 'ri-truck-line';
      case '배송완료':
        return 'ri-checkbox-circle-line';
      default:
        return 'ri-file-list-3-line';
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[70]"
        onClick={onClose}
      ></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <i className={`${getStatusIcon()} text-xl text-white`}></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">주문 상태 변경 알림</h3>
                <p className="text-xs text-white/80 mt-0.5">카카오톡으로 고객에게 알림을 보냅니다</p>
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
          {/* Status Change Info */}
          <div className={`rounded-xl p-4 border ${statusInfo.bgColor} mb-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${statusInfo.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-xl">{statusInfo.emoji}</span>
              </div>
              <div>
                <p className={`text-sm font-bold ${statusInfo.color}`}>{statusInfo.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{statusInfo.desc}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">주문번호</span>
              <span className="text-sm font-semibold text-[#2B5F9E]">{orderId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">거래처</span>
              <span className="text-sm font-semibold text-gray-800">{clientName}</span>
            </div>
            {productSummary && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">제품</span>
                <span className="text-sm text-gray-700 text-right max-w-[200px] truncate">{productSummary}</span>
              </div>
            )}
            {totalAmount !== undefined && totalAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">주문 금액</span>
                <span className="text-sm font-bold text-gray-900">₩{totalAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">변경 상태</span>
              <span className={`text-sm font-bold ${statusInfo.color}`}>{newStatus}</span>
            </div>
          </div>

          {/* Kakao Preview */}
          <div className="bg-[#FEE500]/15 border border-[#FEE500]/50 rounded-xl p-3.5 mb-5">
            <div className="flex items-center gap-2 justify-center mb-1.5">
              <i className="ri-kakao-talk-fill text-lg text-[#3C1E1E] w-5 h-5 flex items-center justify-center"></i>
              <span className="text-xs font-bold text-[#3C1E1E]">카카오톡 알림 미리보기</span>
            </div>
            <div className="bg-white rounded-lg p-3 text-[11px] text-gray-600 leading-relaxed max-h-24 overflow-y-auto">
              <p>{statusInfo.emoji} [치팡] 주문 상태 알림</p>
              <p className="mt-1">안녕하세요, {clientName}님.</p>
              <p>📌 주문번호: {orderId}</p>
              <p>📦 상태: {newStatus}</p>
              <p className="text-gray-400 mt-1">...</p>
            </div>
          </div>

          {/* Actions */}
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-check-double-line text-2xl text-emerald-600"></i>
              </div>
              <p className="text-sm font-bold text-emerald-700 mb-1">알림 전송 완료!</p>
              <p className="text-xs text-gray-500 mb-4">카카오톡으로 상태 변경 알림이 전송되었습니다.</p>
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
                onClick={handleSendKakao}
                disabled={sending}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835] disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#3C1E1E]/30 border-t-[#3C1E1E] rounded-full animate-spin"></div>
                    전송 중...
                  </>
                ) : (
                  <>
                    <i className="ri-kakao-talk-fill text-lg w-5 h-5 flex items-center justify-center"></i>
                    카카오톡으로 알림 보내기
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                나중에 보내기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
