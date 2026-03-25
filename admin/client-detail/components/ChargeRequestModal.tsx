import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

interface Client {
  id: string;
  name: string;
  clinic_name: string;
  business_no: string;
  point_balance: number;
}

interface PackageOption {
  amount: number;
  bonus: number;
  total: number;
  label: string;
  recommended?: boolean;
}

interface Props {
  client: Client;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_PACKAGES: PackageOption[] = [
  { amount: 1000000, bonus: 50000, total: 1050000, label: '100만원' },
  { amount: 3000000, bonus: 300000, total: 3300000, label: '300만원', recommended: true },
  { amount: 5000000, bonus: 500000, total: 5500000, label: '500만원' },
];

const PAYMENT_METHODS = ['계좌이체', '카드결제', '현금', '기타'];

export default function ChargeRequestModal({ client, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('계좌이체');
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 커스텀 금액 계산
  const getCustomPackage = (): PackageOption | null => {
    const amt = parseInt(customAmount.replace(/,/g, ''), 10);
    if (!amt || amt <= 0) return null;
    let bonusRate = 0;
    if (amt >= 5000000) bonusRate = 0.1;
    else if (amt >= 3000000) bonusRate = 0.1;
    else if (amt >= 1000000) bonusRate = 0.05;
    const bonus = Math.floor(amt * bonusRate);
    return { amount: amt, bonus, total: amt + bonus, label: `${amt.toLocaleString()}원` };
  };

  const activePackage = useCustom ? getCustomPackage() : selectedPackage;

  const handleCustomAmountChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    setCustomAmount(numeric ? parseInt(numeric, 10).toLocaleString() : '');
  };

  const handleNext = () => {
    if (!activePackage) {
      setError('충전 금액을 선택하거나 입력해주세요.');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!activePackage) return;
    setIsSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('charge_requests').insert([
        {
          client_id: client.id,
          client_name: client.clinic_name || client.name,
          business_number: client.business_no,
          amount: activePackage.amount,
          bonus_amount: activePackage.bonus,
          total_amount: activePackage.total,
          payment_method: paymentMethod,
          status: 'pending',
          requested_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('충전 요청 생성 실패:', err);
      setError('충전 요청 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="ri-coin-line text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">포인트 충전 요청 생성</h2>
                <p className="text-teal-100 text-sm mt-0.5">
                  {client.clinic_name || client.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-white text-lg"></i>
            </button>
          </div>

          {/* 현재 잔액 */}
          <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-teal-100 text-sm">현재 포인트 잔액</span>
            <span className={`text-base font-bold ${client.point_balance < 0 ? 'text-green-300' : client.point_balance === 0 ? 'text-white/60' : 'text-red-300'}`}>
              {client.point_balance < 0
                ? `선포인트 ${Math.abs(client.point_balance).toLocaleString()}원`
                : client.point_balance === 0
                ? '0원'
                : `미수금 ${client.point_balance.toLocaleString()}원`}
            </span>
          </div>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'select' ? 'text-teal-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'select' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            금액 선택
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-3"></div>
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'confirm' ? 'text-teal-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'confirm' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            최종 확인
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-5">
              {/* 패키지 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">충전 패키지 선택</label>
                <div className="space-y-2.5">
                  {DEFAULT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.amount}
                      onClick={() => { setSelectedPackage(pkg); setUseCustom(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        !useCustom && selectedPackage?.amount === pkg.amount
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          !useCustom && selectedPackage?.amount === pkg.amount
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-gray-300'
                        }`}>
                          {!useCustom && selectedPackage?.amount === pkg.amount && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{pkg.label} 충전</span>
                            {pkg.recommended && (
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">추천</span>
                            )}
                          </div>
                          {pkg.bonus > 0 && (
                            <span className="text-xs text-teal-600 font-medium">
                              +{pkg.bonus.toLocaleString()}원 보너스 포함
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{pkg.total.toLocaleString()}원</div>
                        <div className="text-xs text-gray-400">지급 포인트</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 직접 입력 */}
              <div>
                <button
                  onClick={() => { setUseCustom(true); setSelectedPackage(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                    useCustom ? 'border-teal-500 bg-teal-50' : 'border-dashed border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    useCustom ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                  }`}>
                    {useCustom && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className={`text-sm font-medium ${useCustom ? 'text-teal-700' : 'text-gray-500'}`}>
                    직접 금액 입력
                  </span>
                </button>

                {useCustom && (
                  <div className="mt-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="충전 금액 입력 (예: 2,000,000)"
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">원</span>
                    </div>
                    {getCustomPackage() && (
                      <div className="mt-2 px-3 py-2 bg-teal-50 rounded-lg text-xs text-teal-700">
                        보너스 <span className="font-bold">+{getCustomPackage()!.bonus.toLocaleString()}원</span> 포함 →
                        총 지급 <span className="font-bold">{getCustomPackage()!.total.toLocaleString()}원</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 결제 방법 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">결제 방법</label>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        paymentMethod === method
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <i className="ri-error-warning-line flex-shrink-0"></i>
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && activePackage && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-700 mb-3">충전 요청 내용 확인</h3>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">거래처</span>
                  <span className="font-semibold text-gray-900">{client.clinic_name || client.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">사업자번호</span>
                  <span className="font-medium text-gray-700">{client.business_no || '-'}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">충전 금액</span>
                    <span className="font-semibold text-gray-900">{activePackage.amount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">보너스 포인트</span>
                    <span className="font-semibold text-teal-600">+{activePackage.bonus.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                    <span className="font-bold text-gray-700">총 지급 포인트</span>
                    <span className="font-extrabold text-teal-600 text-base">{activePackage.total.toLocaleString()}원</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                  <span className="text-gray-500">결제 방법</span>
                  <span className="font-medium text-gray-900">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">요청 상태</span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">대기중 (승인 필요)</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-700">
                <i className="ri-information-line flex-shrink-0 mt-0.5"></i>
                <span>충전 요청 생성 후 <strong>포인트 관리 &gt; 충전 요청</strong> 탭에서 승인해야 포인트가 실제로 지급됩니다.</span>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <i className="ri-error-warning-line flex-shrink-0"></i>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 pb-6 flex gap-3">
          {step === 'select' ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                다음 단계
                <i className="ri-arrow-right-line ml-1.5"></i>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('select')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <i className="ri-arrow-left-line mr-1.5"></i>
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? (
                  <><i className="ri-loader-4-line animate-spin mr-1.5"></i>처리 중...</>
                ) : (
                  <><i className="ri-check-line mr-1.5"></i>충전 요청 생성</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
