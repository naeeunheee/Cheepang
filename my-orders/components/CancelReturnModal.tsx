import { useState } from 'react';

interface Order {
  id: string;
  dbId?: string;
  status: string;
  notes?: string;
}

interface CancelReturnModalProps {
  isOpen: boolean;
  type: 'cancel' | 'return';
  order: Order | null;
  onClose: () => void;
  onSubmit: (order: Order, reason: string) => Promise<void>;
}

const CANCEL_REASONS = [
  '단순 변심',
  '주문 실수 (수량/제품 오류)',
  '배송 지연',
  '기타 (직접 입력)',
];

const RETURN_REASONS = [
  '단순 반품',
  '제품 불량/파손',
  '주문 실수',
  '배송 오류',
  '기타 (직접 입력)',
];

export default function CancelReturnModal({
  isOpen,
  type,
  order,
  onClose,
  onSubmit,
}: CancelReturnModalProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = type === 'cancel' ? CANCEL_REASONS : RETURN_REASONS;
  const isCustom = reason === '기타 (직접 입력)';
  const finalReason = isCustom ? customReason.trim() : reason;

  const canSubmit = reason !== '' && (!isCustom || customReason.trim().length > 0);

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!order || !canSubmit) return;
    setLoading(true);
    try {
      await onSubmit(order, finalReason);
      setReason('');
      setCustomReason('');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const isCancel = type === 'cancel';
  const title = isCancel ? '취소 요청' : '반품 요청';
  const desc = isCancel
    ? '주문을 취소 요청하시겠습니까?'
    : '해당 주문의 반품을 요청하시겠습니까?';
  const iconClass = isCancel ? 'ri-close-circle-line' : 'ri-arrow-go-back-line';
  const accentColor = isCancel ? 'text-red-600' : 'text-orange-600';
  const accentBg = isCancel ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200';
  const btnColor = isCancel
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-orange-600 hover:bg-orange-700';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      ></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${accentBg}`}>
            <i className={`${iconClass} text-2xl ${accentColor}`}></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer flex-shrink-0"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* 사유 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {isCancel ? '취소 사유' : '반품 사유'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setCustomReason('');
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="">사유를 선택해주세요</option>
            {reasons.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* 직접 입력 텍스트 */}
        {isCustom && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              직접 입력
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
              placeholder="사유를 직접 입력해주세요..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{customReason.length}/200</p>
          </div>
        )}

        {/* 안내 */}
        <div className={`rounded-xl px-4 py-3 border mb-5 ${accentBg}`}>
          <p className={`text-xs font-semibold ${accentColor} flex items-start gap-1.5`}>
            <i className="ri-information-line mt-0.5 flex-shrink-0"></i>
            {isCancel
              ? '취소 요청 후 담당자 검토를 거쳐 처리됩니다. 이미 배송 준비 중인 경우 취소가 불가할 수 있습니다.'
              : '반품 요청 후 담당자 확인 후 처리됩니다. 제품 상태에 따라 반품이 제한될 수 있습니다.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            닫기
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${btnColor}`}
          >
            {loading ? (
              <><i className="ri-loader-4-line animate-spin"></i>처리 중...</>
            ) : (
              <><i className={iconClass}></i>요청하기</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
