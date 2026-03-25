import { useState, useEffect } from 'react';
import { getSetting } from '../../../../utils/settings';

interface ChargeModalProps {
  clientId: string;
  clientName: string;
  currentBalance: number;
  onClose: () => void;
  onRequestCharge: (
    clientId: string,
    clientName: string,
    amount: number,
    packageName: string
  ) => void;
}

export default function ChargeModal({
  clientId,
  clientName,
  currentBalance,
  onClose,
  onRequestCharge,
}: ChargeModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chargedAmount, setChargedAmount] = useState(0);

  // ✅ 치팡 정책에 맞춘 충전 패키지 (100만원, 300만원, 500만원)
  const [packages, setPackages] = useState<
    Array<{
      id: string;
      name: string;
      amount: number;
      bonus_rate: number;
      bonus_amount: number;
      total_points: number;
      description: string;
      badge?: string;
    }>
  >([
    {
      id: 'pkg-100',
      name: '100만원 패키지',
      amount: 1000000,
      bonus_rate: 5,
      bonus_amount: 50000,
      total_points: 1050000,
      description: '5% 보너스 포인트 추가 지급',
    },
    {
      id: 'pkg-300',
      name: '300만원 패키지',
      amount: 3000000,
      bonus_rate: 10,
      bonus_amount: 300000,
      total_points: 3300000,
      description: '10% 보너스 포인트 추가 지급',
      badge: '추천',
    },
    {
      id: 'pkg-500',
      name: '500만원 패키지',
      amount: 5000000,
      bonus_rate: 10,
      bonus_amount: 500000,
      total_points: 5500000,
      description: '10% 보너스 포인트 추가 지급',
      badge: '최대혜택',
    },
  ]);

  useEffect(() => {
    getSetting<any[]>('charge_package_config').then((config) => {
      if (config) {
        try {
          setPackages(
            config.map((pkg: any) => ({
              ...pkg,
              total_points: pkg.amount + pkg.bonus_amount,
              description:
                pkg.bonus_rate > 0
                  ? `${pkg.bonus_rate}% 보너스 포인트 추가 지급`
                  : '기본 충전 패키지',
              badge:
                pkg.id === 'pkg-300'
                  ? '추천'
                  : pkg.id === 'pkg-500'
                  ? '최대혜택'
                  : undefined,
            }))
          );
        } catch (e) {
          console.error('Failed to load package config:', e);
        }
      }
    });
  }, []);

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  const formatCardNumber = (value: string) => {
    const chunks = value.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    if (value.length >= 2) {
      return value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    return value;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(value);
      if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiryDate(value);
      if (errors.expiryDate) setErrors((prev) => ({ ...prev, expiryDate: '' }));
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 3 && /^\d*$/.test(value)) {
      setCvc(value);
      if (errors.cvc) setErrors((prev) => ({ ...prev, cvc: '' }));
    }
  };

  const validateCard = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (cardNumber.length !== 16) newErrors.cardNumber = '카드번호 16자리를 입력해주세요';
    if (expiryDate.length !== 4) {
      newErrors.expiryDate = 'MM/YY 형식으로 입력해주세요';
    } else {
      const month = parseInt(expiryDate.slice(0, 2));
      const year = parseInt(expiryDate.slice(2, 4));
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      if (month < 1 || month > 12) newErrors.expiryDate = '올바른 월을 입력해주세요';
      else if (year < currentYear || (year === currentYear && month < currentMonth))
        newErrors.expiryDate = '유효기간이 만료되었습니다';
    }
    if (cvc.length !== 3) newErrors.cvc = 'CVC 3자리를 입력해주세요';
    if (!cardHolder.trim()) newErrors.cardHolder = '카드 소유자명을 입력해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoToPayment = () => {
    if (!selectedPkg) return;
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!selectedPkg) return;
    if (!validateCard()) return;
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      setChargedAmount(selectedPkg.total_points);
      onRequestCharge(clientId, clientName, selectedPkg.total_points, selectedPkg.name);
      setStep('success');
    } catch (e) {
      console.error('Charge request failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={step === 'success' ? undefined : onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        {step !== 'success' && (
          <div className="bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step === 'payment' && (
                  <button
                    onClick={() => setStep('select')}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <i className="ri-arrow-left-line text-white text-lg"></i>
                  </button>
                )}
                <h3 className="text-base md:text-lg font-bold text-white">
                  {step === 'select' ? '선결제 잔액(포인트) 충전' : '카드 결제'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-white text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-white/70 mt-1">{clientName}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* 충전 성공 화면 */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 animate-bounce">
                <i className="ri-check-double-line text-4xl text-emerald-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">충전 완료!</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">
                선결제 잔액(포인트)이 즉시 반영되었습니다.
              </p>

              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">충전 금액</span>
                  <span className="text-base font-bold text-emerald-700">
                    +₩{chargedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                  <span className="text-xs font-semibold text-gray-700">충전 후 잔액</span>
                  <span className="text-lg font-extrabold text-[#2B5F9E]">
                    ₩{(currentBalance + chargedAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                <div className="flex items-start gap-2">
                  <i className="ri-notification-3-line text-amber-600 text-sm mt-0.5"></i>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">충전 알림 발송 완료</p>
                    <p className="text-[10px] text-amber-600">
                      충전 내역이 카카오톡 알림으로 발송되었습니다.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2B5F9E] hover:bg-[#3A7BC8] transition-colors whitespace-nowrap cursor-pointer"
              >
                확인
              </button>
            </div>
          )}

          {step === 'select' && (
            <>
              {/* 현재 잔액 */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-wallet-3-line text-[#2B5F9E] text-sm"></i>
                  <span className="text-xs text-gray-600">선결제 잔액(포인트)</span>
                </div>
                <span className="text-sm md:text-base font-bold text-gray-900">
                  ₩{currentBalance.toLocaleString()}
                </span>
              </div>

              {/* 패키지 선택 */}
              <div className="space-y-2.5 mb-4">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`relative w-full p-3.5 md:p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#2B5F9E] bg-[#2B5F9E]/5 shadow-md'
                          : 'border-gray-200 hover:border-[#2B5F9E]/40 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-[#2B5F9E] bg-[#2B5F9E]' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <i className="ri-check-line text-white text-xs"></i>}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm md:text-base font-bold text-gray-900">
                                {pkg.name}
                              </h4>
                              {pkg.badge && (
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold rounded-full ${
                                    pkg.badge === '추천'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                              {pkg.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">충전 금액</p>
                          <p className="text-sm md:text-base font-extrabold text-gray-900">
                            {(pkg.amount / 10000).toLocaleString()}만 원
                          </p>
                          {pkg.bonus_amount > 0 && (
                            <p className="text-[10px] md:text-xs font-semibold text-emerald-600 mt-0.5">
                              +{(pkg.bonus_amount / 10000).toLocaleString()}만 원
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-[#2B5F9E]/15 flex items-center justify-between">
                          <span className="text-xs text-[#2B5F9E] font-medium">총 지급 포인트</span>
                          <span className="text-sm md:text-base font-extrabold text-[#2B5F9E]">
                            ₩{pkg.total_points.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 안내 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-[10px] md:text-xs text-amber-700 font-semibold mb-1">
                  <i className="ri-information-line mr-1"></i>충전 안내
                </p>
                <ul className="text-[10px] md:text-xs text-amber-600 space-y-0.5 list-disc list-inside">
                  <li>충전 요청 후 카드 결제가 완료되면 선결제 잔액(포인트)이 즉시 지급됩니다.</li>
                  <li>충전 완료 시 카카오톡 알림이 자동 발송됩니다.</li>
                  <li>문의: 하이니스 영업팀 (02-0000-0000)</li>
                </ul>
              </div>
            </>
          )}

          {step === 'payment' && selectedPkg && (
            <>
              {/* 결제 요약 */}
              <div className="bg-[#2B5F9E]/5 border border-[#2B5F9E]/15 rounded-xl p-3.5 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">충전 패키지</span>
                  <span className="text-sm font-bold text-gray-900">{selectedPkg.name}</span>
                </div>
                {selectedPkg.bonus_amount > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-emerald-600">
                      보너스 ({selectedPkg.bonus_rate}%)
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      +₩{selectedPkg.bonus_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-[#2B5F9E]/10">
                  <span className="text-xs font-semibold text-[#2B5F9E]">결제 금액</span>
                  <span className="text-base md:text-lg font-extrabold text-[#2B5F9E]">
                    ₩{selectedPkg.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 카드 정보 입력 */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    카드번호
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCardNumber(cardNumber)}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.cardNumber
                          ? 'border-red-300 focus:ring-red-500/10'
                          : 'border-gray-200 focus:border-[#2B5F9E] focus:ring-[#2B5F9E]/10'
                      }`}
                      maxLength={19}
                    />
                    <i className="ri-bank-card-line absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                  {errors.cardNumber && (
                    <p className="text-[10px] text-red-500 mt-1">
                      <i className="ri-error-warning-line mr-0.5"></i>
                      {errors.cardNumber}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      유효기간
                    </label>
                    <input
                      type="text"
                      value={formatExpiryDate(expiryDate)}
                      onChange={handleExpiryDateChange}
                      placeholder="MM/YY"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.expiryDate
                          ? 'border-red-300 focus:ring-red-500/10'
                          : 'border-gray-200 focus:border-[#2B5F9E] focus:ring-[#2B5F9E]/10'
                      }`}
                      maxLength={5}
                    />
                    {errors.expiryDate && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={handleCvcChange}
                      placeholder="123"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.cvc
                          ? 'border-red-300 focus:ring-red-500/10'
                          : 'border-gray-200 focus:border-[#2B5F9E] focus:ring-[#2B5F9E]/10'
                      }`}
                      maxLength={3}
                    />
                    {errors.cvc && (
                      <p className="text-[10px] text-red-500 mt-1">{errors.cvc}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    카드 소유자명
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => {
                      setCardHolder(e.target.value);
                      if (errors.cardHolder)
                        setErrors((prev) => ({ ...prev, cardHolder: '' }));
                    }}
                    placeholder="홍길동"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.cardHolder
                        ? 'border-red-300 focus:ring-red-500/10'
                        : 'border-gray-200 focus:border-[#2B5F9E] focus:ring-[#2B5F9E]/10'
                    }`}
                  />
                  {errors.cardHolder && (
                    <p className="text-[10px] text-red-500 mt-1">
                      <i className="ri-error-warning-line mr-0.5"></i>
                      {errors.cardHolder}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-start gap-2">
                  <i className="ri-shield-check-line text-blue-600 text-sm mt-0.5"></i>
                  <p className="text-[10px] md:text-xs text-blue-700">
                    카드 정보는 안전하게 암호화되어 처리됩니다.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        {step !== 'success' && (
          <div className="border-t border-gray-100 p-4 md:p-6 flex gap-2">
            <button
              onClick={step === 'payment' ? () => setStep('select') : onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
            >
              {step === 'payment' ? '이전' : '취소'}
            </button>
            {step === 'select' ? (
              <button
                onClick={handleGoToPayment}
                disabled={!selectedPackage}
                className="flex-1 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold text-white bg-[#2B5F9E] hover:bg-[#3A7BC8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="ri-bank-card-line text-sm"></i>
                카드 결제하기
              </button>
            ) : (
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold text-white bg-[#2B5F9E] hover:bg-[#3A7BC8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm"></i>
                    결제 처리중...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line text-sm"></i>
                    ₩{selectedPkg?.amount.toLocaleString()} 결제
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}