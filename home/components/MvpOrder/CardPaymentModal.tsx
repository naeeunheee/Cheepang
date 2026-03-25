import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

interface CartItem {
  productId?: string;
  productName: string;
  productCode?: string;
  selectedOptionModelCode?: string;
  sizeInfo?: string;
  selectedOptions?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  components?: {
    productId?: string;
    productName: string;
    productCode?: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface CardPaymentModalProps {
  totalAmount: number;
  clientName: string;
  onClose: () => void;
  onConfirm: (paymentMethod: 'point' | 'card') => void;
  clientPoint?: number;
  orderId?: string;
  cartItems?: CartItem[];
  businessNumber?: string;
}

export default function CardPaymentModal({
  totalAmount,
  clientName,
  onClose,
  onConfirm,
  cartItems,
  businessNumber,
}: CardPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'point' | 'card'>('point');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // clients 테이블에서 outstanding_balance 조회
  useEffect(() => {
    const fetchBalance = async () => {
      if (!businessNumber) {
        setBalanceLoading(false);
        return;
      }
      try {
        const cleanBiz = businessNumber.replace(/-/g, '');
        const { data } = await supabase
          .from('clients')
          .select('outstanding_balance')
          .or(`business_number.eq.${cleanBiz},business_no.eq.${cleanBiz},business_number.eq.${businessNumber},business_no.eq.${businessNumber}`)
          .limit(1)
          .maybeSingle();
        if (data !== null && data !== undefined) {
          setOutstandingBalance(data.outstanding_balance ?? 0);
        }
      } catch (err) {
        console.error('잔액 조회 실패:', err);
      } finally {
        setBalanceLoading(false);
      }
    };
    fetchBalance();
  }, [businessNumber]);

  // 사용 가능 잔액: outstanding_balance가 음수일 때만 abs값이 잔액
  const availableBalance = outstandingBalance !== null && outstandingBalance < 0
    ? Math.abs(outstandingBalance)
    : 0;

  const isBalanceSufficient = availableBalance >= totalAmount;
  const afterDeduct = availableBalance - totalAmount;
  const shortage = Math.max(0, totalAmount - availableBalance);

  const canSubmit = paymentMethod === 'point' && isBalanceSufficient && !balanceLoading;

  const handleSubmit = async () => {
    if (paymentMethod === 'card') return; // 카드결제 준비중
    if (!canSubmit || isProcessing) return;

    if (!isBalanceSufficient) {
      setErrorMsg('잔액이 부족합니다. 중부지사에 문의해주세요 (010-8950-3379)');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    onConfirm('point');
    // 모달은 부모(MvpOrderSection)에서 닫힘 — 이중 클릭 방지를 위해 setIsProcessing(false) 제거
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-white">결제하기</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-white text-xl"></i>
            </button>
          </div>
          <p className="text-sm text-white/80">{clientName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* 총 주문금액 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">총 주문금액</span>
              <span className="text-2xl font-extrabold text-gray-900">₩{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* 결제 수단 탭 */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => { setPaymentMethod('point'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${paymentMethod === 'point' ? 'bg-white text-[#2B5F9E]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <i className="ri-wallet-3-line text-base w-4 h-4 flex items-center justify-center"></i>
              잔액 차감
            </button>
            <button
              onClick={() => { setPaymentMethod('card'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${paymentMethod === 'card' ? 'bg-white text-[#2B5F9E]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <i className="ri-bank-card-line text-base w-4 h-4 flex items-center justify-center"></i>
              카드 결제
            </button>
          </div>

          {/* ── 잔액 차감 ── */}
          {paymentMethod === 'point' && (
            <div className="space-y-3">
              {balanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#2B5F9E] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-500">잔액 조회 중...</span>
                </div>
              ) : outstandingBalance !== null ? (
                <>
                  <div className={`rounded-xl p-4 border ${isBalanceSufficient ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <i className={`ri-wallet-3-line text-base ${isBalanceSufficient ? 'text-emerald-600' : 'text-red-500'}`}></i>
                        <span className={`text-sm font-semibold ${isBalanceSufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                          사용 가능 잔액
                        </span>
                      </div>
                      <span className={`text-base font-bold ${isBalanceSufficient ? 'text-emerald-700' : 'text-red-600'}`}>
                        ₩{availableBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">주문 금액</span>
                        <span className="text-xs font-semibold text-gray-700">-₩{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">
                          {isBalanceSufficient ? '차감 후 잔액' : '부족 금액'}
                        </span>
                        <span className={`text-base font-extrabold ${isBalanceSufficient ? 'text-gray-800' : 'text-red-600'}`}>
                          {isBalanceSufficient
                            ? `₩${afterDeduct.toLocaleString()}`
                            : `₩${shortage.toLocaleString()} 부족`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isBalanceSufficient && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <i className="ri-error-warning-line text-red-500 text-sm mt-0.5"></i>
                        <div>
                          <p className="text-xs font-bold text-red-700 mb-1">잔액이 부족합니다</p>
                          <p className="text-xs text-red-600">
                            중부지사에 문의해주세요{' '}
                            <a
                              href="tel:010-8950-3379"
                              className="font-bold underline cursor-pointer"
                            >
                              010-8950-3379
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {availableBalance === 0 && outstandingBalance >= 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <i className="ri-information-line text-amber-600 text-sm mt-0.5"></i>
                        <p className="text-xs text-amber-700">
                          사용 가능한 잔액이 없습니다. 중부지사에 문의해주세요{' '}
                          <a href="tel:010-8950-3379" className="font-bold underline cursor-pointer">
                            010-8950-3379
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">잔액 정보를 불러올 수 없습니다.</p>
                  <p className="text-xs text-gray-400 mt-1">관리자에게 문의해주세요.</p>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <i className="ri-error-warning-line text-red-500 text-sm mt-0.5"></i>
                  <p className="text-xs text-red-600">{errorMsg}</p>
                </div>
              )}
            </div>
          )}

          {/* ── 카드 결제 (준비중) ── */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ri-bank-card-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-sm font-bold text-gray-600 mb-1">카드 결제는 준비중입니다</p>
                <p className="text-xs text-gray-400">잔액 차감으로 결제해주시거나<br />중부지사에 문의해주세요</p>
                <a
                  href="tel:010-8950-3379"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <i className="ri-phone-line text-sm w-4 h-4 flex items-center justify-center"></i>
                  010-8950-3379
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="border-t border-gray-100 p-5 flex gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isProcessing || paymentMethod === 'card'}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
              paymentMethod === 'card'
                ? 'bg-gray-300 cursor-not-allowed'
                : !canSubmit
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#2B5F9E] hover:bg-[#3A7BC8]'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <>
                <i className="ri-loader-4-line animate-spin text-base"></i>
                처리중...
              </>
            ) : paymentMethod === 'card' ? (
              <>
                <i className="ri-bank-card-line text-base"></i>
                준비중
              </>
            ) : !isBalanceSufficient ? (
              <>
                <i className="ri-error-warning-line text-base"></i>
                잔액 부족
              </>
            ) : (
              <>
                <i className="ri-wallet-3-line text-base"></i>
                잔액 차감 결제
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
