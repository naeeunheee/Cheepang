interface DeliveryTimelineProps {
  status: string;
}

const DELIVERY_STEPS = [
  { key: '주문접수', icon: 'ri-file-list-3-line',      label: '주문접수' },
  { key: '처리중',   icon: 'ri-settings-3-line',       label: '처리중'   },
  { key: '배송준비', icon: 'ri-shopping-bag-3-line',   label: '배송준비' },
  { key: '배송중',   icon: 'ri-truck-line',            label: '배송중'   },
  { key: '배송완료', icon: 'ri-checkbox-circle-line',  label: '배송완료' },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    '주문접수': 0,
    '처리중':   1,
    '준비중':   1,
    '배송준비': 2,
    '배송중':   3,
    '배송완료': 4,
  };
  return map[status] ?? 0;
}

export default function DeliveryTimeline({ status }: DeliveryTimelineProps) {
  const currentStep = getStepIndex(status);
  const isCancelled = status === '취소';

  if (isCancelled) {
    return (
      <div className="py-3 px-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
        <i className="ri-close-circle-line text-red-500 text-lg w-5 h-5 flex items-center justify-center"></i>
        <span className="text-sm font-semibold text-red-600">주문 취소됨</span>
      </div>
    );
  }

  return (
    <div className="py-3 px-1">
      {/* 타임라인 스텝 */}
      <div className="flex items-start">
        {DELIVERY_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive    = idx === currentStep;
          const isPending   = idx > currentStep;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {/* 연결선 (첫 번째 스텝 제외) */}
              {idx > 0 && (
                <div
                  className="absolute left-0 right-1/2 top-[18px] -translate-y-1/2 h-0.5 z-0"
                  style={{
                    background: isCompleted || isActive
                      ? 'linear-gradient(to right, #2563EB, #2563EB)'
                      : '#E5E7EB',
                  }}
                />
              )}
              {/* 오른쪽 연결선 */}
              {idx < DELIVERY_STEPS.length - 1 && (
                <div
                  className="absolute left-1/2 right-0 top-[18px] -translate-y-1/2 h-0.5 z-0"
                  style={{
                    background: isCompleted
                      ? '#2563EB'
                      : '#E5E7EB',
                  }}
                />
              )}

              {/* 아이콘 원 */}
              <div
                className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: isCompleted
                    ? '#2563EB'
                    : isActive
                      ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                      : '#F3F4F6',
                  border: isActive
                    ? '2.5px solid #93C5FD'
                    : isCompleted
                      ? 'none'
                      : '2px solid #E5E7EB',
                  boxShadow: isActive
                    ? '0 0 0 4px rgba(59,130,246,0.15)'
                    : 'none',
                }}
              >
                {isCompleted ? (
                  <i className="ri-check-line text-white text-sm w-4 h-4 flex items-center justify-center"></i>
                ) : (
                  <i
                    className={`${step.icon} text-sm w-4 h-4 flex items-center justify-center ${
                      isActive ? 'text-white' : isPending ? 'text-gray-300' : 'text-white'
                    } ${isActive && step.key === '처리중' ? 'animate-spin' : ''} ${isActive && step.key === '배송중' ? 'animate-pulse' : ''}`}
                  ></i>
                )}
              </div>

              {/* 스텝 라벨 */}
              <span
                className={`mt-1.5 text-[10px] font-semibold text-center leading-tight ${
                  isActive    ? 'text-blue-600'
                  : isCompleted ? 'text-blue-500'
                  : 'text-gray-300'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 현재 상태 안내 텍스트 */}
      <div className="mt-3 text-center">
        {currentStep === 4 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <i className="ri-checkbox-circle-fill w-3.5 h-3.5 flex items-center justify-center"></i>
            배송이 완료되었습니다
          </span>
        ) : currentStep === 3 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full animate-pulse">
            <i className="ri-truck-line w-3.5 h-3.5 flex items-center justify-center"></i>
            현재 배송 중입니다
          </span>
        ) : currentStep === 2 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            <i className="ri-shopping-bag-3-line w-3.5 h-3.5 flex items-center justify-center"></i>
            배송 준비 중입니다
          </span>
        ) : currentStep === 1 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            <i className="ri-settings-3-line w-3.5 h-3.5 flex items-center justify-center"></i>
            주문을 처리 중입니다
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
            <i className="ri-file-list-3-line w-3.5 h-3.5 flex items-center justify-center"></i>
            주문이 접수되었습니다
          </span>
        )}
      </div>
    </div>
  );
}
