import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

type PageStatus = 'processing' | 'success' | 'error';

interface PaymentInfo {
  method: string;
  amount: number;
  orderId: string;
  approvedAt?: string;
  cardCompany?: string;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PageStatus>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setErrorMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      try {
        const { data: supabaseData } = await supabase.auth.getSession();
        const token = supabaseData.session?.access_token;

        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/toss-confirm`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: parseInt(amount),
            }),
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          const raw = result.payment ?? {};
          setPaymentInfo({
            method: raw.method ?? '카드',
            amount: parseInt(amount),
            orderId,
            approvedAt: raw.approvedAt ?? new Date().toISOString(),
            cardCompany: raw.card?.company ?? undefined,
          });
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(result.error || '결제 확인에 실패했습니다.');
        }
      } catch {
        setStatus('error');
        setErrorMessage('결제 처리 중 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate('/my-orders');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, navigate]);

  const methodLabel: Record<string, string> = {
    card: '신용/체크카드',
    '카드': '신용/체크카드',
    virtualAccount: '가상계좌',
    transfer: '계좌이체',
    point: '포인트',
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Processing */}
        {status === 'processing' && (
          <div className="bg-white rounded-2xl p-10 text-center">
            <div className="w-20 h-20 bg-[#2B5F9E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-loader-4-line text-4xl text-[#2B5F9E] animate-spin"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">결제 확인 중</h2>
            <p className="text-sm text-gray-500">잠시만 기다려 주세요...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && paymentInfo && (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-fill text-4xl text-white"></i>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">결제 완료</h2>
              <p className="text-sm text-white/80">주문이 성공적으로 접수되었습니다</p>
            </div>

            {/* Receipt Body */}
            <div className="px-6 py-6 space-y-4">
              {/* Dashed Divider */}
              <div className="border-t-2 border-dashed border-gray-200"></div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">주문번호</span>
                  <span className="text-sm font-semibold text-gray-800 font-mono">{paymentInfo.orderId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">결제 수단</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {methodLabel[paymentInfo.method] ?? paymentInfo.method}
                    {paymentInfo.cardCompany ? ` · ${paymentInfo.cardCompany}` : ''}
                  </span>
                </div>
                {paymentInfo.approvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">결제 시각</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {new Date(paymentInfo.approvedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-dashed border-gray-200"></div>

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-700">총 결제금액</span>
                <span className="text-3xl font-extrabold text-emerald-600">
                  ₩{paymentInfo.amount.toLocaleString()}
                </span>
              </div>

              <div className="border-t-2 border-dashed border-gray-200"></div>

              {/* Auto Redirect */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">주문 내역 페이지로 자동 이동합니다</p>
                <span className="text-sm font-bold text-[#2B5F9E]">{countdown}초</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-2">
              <Link
                to="/my-orders"
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2B5F9E] hover:bg-[#3A7BC8] transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-file-list-3-line text-base w-4 h-4 flex items-center justify-center"></i>
                주문 내역 바로가기
              </Link>
              <Link
                to="/my-payments"
                className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-receipt-line text-base w-4 h-4 flex items-center justify-center"></i>
                결제 내역 확인
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-close-circle-line text-4xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">결제 실패</h2>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-[#2B5F9E] text-white rounded-xl text-sm font-bold hover:bg-[#3A7BC8] transition-colors whitespace-nowrap cursor-pointer"
              >
                다시 시도하기
              </button>
              <Link
                to="/my-orders"
                className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
              >
                주문 내역 확인
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
