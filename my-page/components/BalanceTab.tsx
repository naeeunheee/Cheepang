interface BalanceTabProps {
  outstandingBalance: number | undefined;
  clientName: string;
}

export default function BalanceTab({ outstandingBalance, clientName }: BalanceTabProps) {
  const balance = outstandingBalance ?? 0;
  const isCredit = balance < 0;
  const isArrears = balance > 0;
  const isZero = balance === 0;

  return (
    <div className="space-y-4">
      {/* 현재 잔액 크게 표시 */}
      <div className={`rounded-2xl border-2 p-6 text-center ${isCredit ? 'border-blue-200 bg-blue-50/50' : isArrears ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8C7E6A' }}>
          {clientName} 잔액 현황
        </p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCredit ? 'bg-blue-100' : isArrears ? 'bg-red-100' : 'bg-gray-100'}`}>
            <i className={`ri-wallet-3-line text-2xl ${isCredit ? 'text-blue-500' : isArrears ? 'text-red-500' : 'text-gray-400'}`}></i>
          </div>
          <div className="text-left">
            <p className={`text-3xl font-extrabold ${isCredit ? 'text-blue-600' : isArrears ? 'text-red-600' : 'text-gray-400'}`}>
              ₩{Math.abs(balance).toLocaleString()}
            </p>
            <p className={`text-sm font-semibold mt-0.5 ${isCredit ? 'text-blue-500' : isArrears ? 'text-red-500' : 'text-gray-400'}`}>
              {isCredit ? '사용 가능 잔액' : isArrears ? '미수금 (결제 필요)' : '잔액 없음'}
            </p>
          </div>
        </div>

        {/* 상태 배지 */}
        <div className="mt-4">
          {isCredit && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              <i className="ri-check-line w-4 h-4 flex items-center justify-center"></i>
              주문 가능 상태입니다
            </div>
          )}
          {isArrears && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
              <i className="ri-alarm-warning-line w-4 h-4 flex items-center justify-center"></i>
              미수금 정산이 필요합니다
            </div>
          )}
          {isZero && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-sm font-semibold">
              <i className="ri-information-line w-4 h-4 flex items-center justify-center"></i>
              현재 잔액이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 잔액 설명 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-[#E0D5C3] p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.1)' }}>
              <i className="ri-information-line text-base" style={{ color: '#8B6914' }}></i>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#3D3428' }}>잔액 안내</p>
              <p className="text-xs leading-relaxed" style={{ color: '#8C7E6A' }}>
                <strong style={{ color: '#1D4ED8' }}>사용가능 잔액 (음수)</strong>: 선불 충전된 금액으로, 주문 시 차감됩니다.
              </p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: '#8C7E6A' }}>
                <strong style={{ color: '#DC2626' }}>미수금 (양수)</strong>: 아직 결제되지 않은 금액으로, 정산이 필요합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E0D5C3] p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.1)' }}>
              <i className="ri-phone-line text-base" style={{ color: '#8B6914' }}></i>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#3D3428' }}>잔액 문의</p>
              <p className="text-xs" style={{ color: '#8C7E6A' }}>잔액 충전 및 정산 문의</p>
              <a
                href="tel:01089503379"
                className="text-base font-bold mt-1 block cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: '#8B6914' }}
              >
                010-8950-3379
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 공지 배너 */}
      <div className="rounded-xl border border-[#D4C4A8] px-5 py-4 flex items-center gap-3" style={{ background: 'rgba(139,105,20,0.05)' }}>
        <i className="ri-bank-card-line text-xl flex-shrink-0" style={{ color: '#8B6914' }}></i>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#5C5346' }}>
            잔액 충전 및 정산 문의: <strong style={{ color: '#8B6914' }}>010-8950-3379</strong>
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#8C7E6A' }}>
            담당자 상담 후 처리됩니다. 영업시간 내 문의 부탁드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}
