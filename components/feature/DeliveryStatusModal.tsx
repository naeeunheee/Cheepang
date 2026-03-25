import { useState } from 'react';
import { OrderStatus } from '../../mocks/highness-catalog';

interface DeliveryStatusModalProps {
  orderId: string;
  currentStatus: OrderStatus;
  orderedAt: string;
  onClose: () => void;
}

interface DeliveryStep {
  status: OrderStatus;
  label: string;
  icon: string;
  description: string;
}

export default function DeliveryStatusModal({
  orderId,
  currentStatus,
  orderedAt,
  onClose,
}: DeliveryStatusModalProps) {
  const [copied, setCopied] = useState(false);
  const trackingNumber = 'CJ-2024-' + orderId.slice(-8).toUpperCase();

  const deliverySteps: DeliveryStep[] = [
    { status: '주문접수', label: '주문접수', icon: 'ri-file-list-3-line', description: '주문이 접수되었습니다' },
    { status: '준비중', label: '준비중', icon: 'ri-box-3-line', description: '제품을 준비하고 있습니다' },
    { status: '배송중', label: '배송중', icon: 'ri-truck-line', description: '제품이 배송 중입니다' },
    { status: '배송완료', label: '배송완료', icon: 'ri-checkbox-circle-line', description: '배송이 완료되었습니다' },
  ];

  const currentStepIndex = deliverySteps.findIndex((step) => step.status === currentStatus);

  const getStepDate = (index: number) => {
    const orderDate = new Date(orderedAt);
    const stepDate = new Date(orderDate);
    stepDate.setDate(stepDate.getDate() + index * 2);
    return stepDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getEstimatedDate = (index: number) => {
    const orderDate = new Date(orderedAt);
    const stepDate = new Date(orderDate);
    stepDate.setDate(stepDate.getDate() + index * 2);
    return stepDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-truck-line text-base sm:text-xl text-white"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">배송현황 조회</h2>
              <p className="text-[10px] sm:text-xs text-white/80 mt-0.5 truncate max-w-[180px] sm:max-w-none">
                주문: {orderId.length > 16 ? orderId.slice(-12) : orderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
          >
            <i className="ri-close-line text-xl text-white"></i>
          </button>
        </div>

        {/* Tracking Number */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium mb-0.5">운송장 번호</p>
              <p className="text-sm sm:text-base font-bold text-gray-900 font-mono truncate">{trackingNumber}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                copied
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'}></i>
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        </div>

        {/* Delivery Steps - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-8">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div
              className="absolute left-4 sm:left-6 top-0 w-0.5 bg-gradient-to-b from-[#2B5F9E] to-[#3A7BC8] transition-all duration-500"
              style={{ height: `${(currentStepIndex / (deliverySteps.length - 1)) * 100}%` }}
            ></div>

            <div className="space-y-6 sm:space-y-8 relative">
              {deliverySteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.status} className="flex items-start gap-3 sm:gap-4 relative">
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300 relative z-10 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] border-[#2B5F9E] shadow-md'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <i className={`${step.icon} text-sm sm:text-xl ${isCompleted ? 'text-white' : 'text-gray-400'}`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-sm sm:text-base font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#2B5F9E] text-white text-[9px] sm:text-[10px] font-bold rounded-full whitespace-nowrap">
                            현재
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm mb-1 ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                          <i className="ri-time-line flex-shrink-0"></i>
                          <span>{getStepDate(index)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400">
                          <i className="ri-calendar-line flex-shrink-0"></i>
                          <span>예상: {getEstimatedDate(index)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-information-line text-sm sm:text-base text-blue-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">배송 안내</p>
                <ul className="text-[10px] sm:text-xs text-blue-700 space-y-1">
                  <li>• 영업일 기준 2-3일 소요됩니다</li>
                  <li>• 제주/도서산간 지역은 추가 배송일이 소요될 수 있습니다</li>
                  <li>• 배송 문의: 1588-0000</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            닫기
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-[#2B5F9E] text-white rounded-lg text-sm font-semibold hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-customer-service-2-line"></i>
            배송 문의
          </button>
        </div>
      </div>
    </div>
  );
}
