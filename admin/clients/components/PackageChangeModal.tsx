import { useState } from 'react';

const TIER_LABELS: Record<string, string> = {
  '1000':  '1000',
  '2000':  '2000',
  '3000':  '3000',
  '5000':  '5000',
  '10000': '10000 ★VIP',
};

interface PackageChangeModalProps {
  clientName: string;
  previousTier: number | null;
  newTier: number | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}

export default function PackageChangeModal({
  clientName,
  previousTier,
  newTier,
  onClose,
  onConfirm,
  saving,
}: PackageChangeModalProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const prevLabel = previousTier ? (TIER_LABELS[String(previousTier)] || String(previousTier)) : '미설정';
  const newLabel  = newTier     ? (TIER_LABELS[String(newTier)]      || String(newTier))      : '미설정';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setReasonError('변경 사유를 입력해주세요.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-50">
              <i className="ri-vip-crown-line text-teal-600 text-base"></i>
            </div>
            <h2 className="text-base font-bold text-gray-900">패키지 변경</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 변경 요약 */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-700 mb-2">
              <i className="ri-hospital-line mr-1"></i>{clientName}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 mb-1">이전 패키지</p>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold border border-gray-200">
                  {prevLabel}
                </span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center text-teal-500">
                <i className="ri-arrow-right-line text-xl"></i>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 mb-1">새 패키지</p>
                <span className="px-3 py-1.5 bg-teal-100 text-teal-800 rounded-lg text-sm font-bold border border-teal-300">
                  {newLabel}
                </span>
              </div>
            </div>
          </div>

          {/* 사유 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              변경 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setReasonError(''); }}
              placeholder="예: 월 주문량 증가, 계약 갱신, 프로모션 적용, 신규 거래처 세팅"
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
            {reasonError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <i className="ri-error-warning-line"></i>{reasonError}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1 text-right">{reason.length}/200</p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><i className="ri-loader-4-line animate-spin"></i>저장 중...</>
              ) : (
                <><i className="ri-save-line"></i>변경 확정</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
