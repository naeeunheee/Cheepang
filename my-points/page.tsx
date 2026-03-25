import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BackButton from '../../components/feature/BackButton';

interface ClientData {
  id: string;
  name: string;
  clinic_name: string;
  business_number: string;
  outstanding_balance: number;
  package_tier?: number;
}

const TIER_STYLE: Record<number, { label: string; bg: string; text: string; border: string }> = {
  1000:  { label: '1000',        bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  2000:  { label: '2000',        bg: '#DBEAFE', text: '#1D40AE', border: '#93C5FD' },
  3000:  { label: '3000',        bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  5000:  { label: '5000',        bg: '#FFEDD5', text: '#9A3412', border: '#FCA67A' },
  10000: { label: '10000 ★VIP', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

/** outstanding_balance 기반 잔액 표시 로직
 *  < 0 → 사용 가능 잔액 (초록)  |  > 0 → 미수금 (빨강)  |  0 → 잔액 없음 */
function getBalanceInfo(balance: number) {
  if (balance < 0) {
    return {
      label: '사용 가능 잔액',
      amount: Math.abs(balance),
      color: '#22C55E',
      bgColor: 'from-green-500 to-emerald-600',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50 border-green-200',
      badgeBg: 'bg-green-100 text-green-800',
      isAvailable: true,
      isDebt: false,
    };
  }
  if (balance > 0) {
    return {
      label: '미수금',
      amount: balance,
      color: '#EF4444',
      bgColor: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50 border-red-200',
      badgeBg: 'bg-red-100 text-red-800',
      isAvailable: false,
      isDebt: true,
    };
  }
  return {
    label: '잔액',
    amount: 0,
    color: '#6B7280',
    bgColor: 'from-gray-400 to-gray-500',
    textColor: 'text-gray-600',
    bgLight: 'bg-gray-50 border-gray-200',
    badgeBg: 'bg-gray-100 text-gray-600',
    isAvailable: false,
    isDebt: false,
  };
}

export default function MyPointsPage() {
  const navigate = useNavigate();
  const { businessNo, isLoading: authLoading } = useAuth();

  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      if (!businessNo) {
        navigate('/login');
        return;
      }

      try {
        const bizClean = businessNo.replace(/-/g, '');
        const { data: client, error } = await supabase
          .from('clients')
          .select('id, name, clinic_name, business_number, outstanding_balance, package_tier')
          .or(
            `business_number.eq.${bizClean},business_no.eq.${bizClean},` +
            `business_number.eq.${businessNo},business_no.eq.${businessNo}`
          )
          .maybeSingle();

        if (error) console.error('거래처 조회 실패:', error);
        setClientData(client || null);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [businessNo, authLoading, navigate]);

  // outstanding_balance 실시간 구독
  useEffect(() => {
    if (!clientData?.id) return;

    const channel = supabase
      .channel(`client_balance_${clientData.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${clientData.id}` },
        (payload) => {
          const updated = payload.new as { outstanding_balance: number };
          if (typeof updated.outstanding_balance === 'number') {
            setClientData(prev =>
              prev ? { ...prev, outstanding_balance: updated.outstanding_balance } : null
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientData?.id]);

  const handleGoToOrder = () => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('mvp-order');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-5xl text-[#2B5F9E] animate-spin mb-4"></i>
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 mb-4">거래처 정보를 찾을 수 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">관리자에게 문의해주세요</p>
          <Link to="/" className="text-[#2B5F9E] hover:underline cursor-pointer">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const balance = clientData.outstanding_balance || 0;
  const info = getBalanceInfo(balance);
  const displayName = clientData.clinic_name || clientData.name;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="cursor-pointer flex-shrink-0">
              <img
                src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png"
                alt="CHIPANG Logo"
                className="h-8 sm:h-12"
              />
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/my-orders"
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap"
              >
                주문내역
              </Link>
              <Link
                to="/"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-left-line"></i>
                <span className="hidden sm:inline">홈으로</span>
                <span className="sm:hidden">홈</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <BackButton />

        {/* Page Title */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-wallet-3-line text-xl sm:text-2xl text-white"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">내 잔액 현황</h1>
              {clientData.package_tier && TIER_STYLE[clientData.package_tier] && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  style={{
                    background: TIER_STYLE[clientData.package_tier].bg,
                    color: TIER_STYLE[clientData.package_tier].text,
                    borderColor: TIER_STYLE[clientData.package_tier].border,
                  }}
                >
                  <i className="ri-price-tag-3-line text-[10px]"></i>
                  적용 패키지: {TIER_STYLE[clientData.package_tier].label}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {displayName} — 잔액 현황
            </p>
          </div>
        </div>

        {/* 미수금 알림 배너 */}
        {info.isDebt && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-alarm-warning-line text-2xl text-white"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-800 mb-1">미수금이 있습니다</h3>
              <p className="text-sm text-red-600">
                현재 미수금이 <strong>₩{info.amount.toLocaleString()}</strong> 있습니다.
                자세한 내용은 담당자에게 문의해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 잔액 메인 카드 */}
        <div className={`bg-gradient-to-br ${info.bgColor} rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-6`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold opacity-80 mb-2">{info.label}</p>
              <p className="text-4xl sm:text-5xl font-extrabold mb-1">
                ₩{info.amount.toLocaleString()}
              </p>
              <p className="text-sm opacity-70 mt-2">{displayName}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <i className="ri-wallet-3-line text-3xl text-white"></i>
            </div>
          </div>

          {/* 패키지 표시 */}
          {clientData.package_tier && TIER_STYLE[clientData.package_tier] && (
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
              <i className="ri-price-tag-3-line text-sm opacity-80"></i>
              <span className="text-sm font-semibold opacity-90">
                적용 패키지: {TIER_STYLE[clientData.package_tier].label}
              </span>
            </div>
          )}
        </div>

        {/* 잔액 안내 카드 */}
        <div className={`rounded-xl p-5 mb-6 border ${info.bgLight}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: info.color + '20' }}>
              <i className="ri-information-line text-lg" style={{ color: info.color }}></i>
            </div>
            <div>
              {info.isAvailable && (
                <>
                  <p className="text-sm font-bold text-green-800 mb-1">사용 가능한 선결제 잔액이 있습니다</p>
                  <p className="text-sm text-green-700">
                    현재 <strong>₩{info.amount.toLocaleString()}</strong>의 선결제 잔액이 있어 제품 주문이 가능합니다.
                  </p>
                </>
              )}
              {info.isDebt && (
                <>
                  <p className="text-sm font-bold text-red-800 mb-1">미수금 잔액 안내</p>
                  <p className="text-sm text-red-700">
                    미수금 <strong>₩{info.amount.toLocaleString()}</strong>이 있습니다.
                    결제 처리 관련 문의는 담당 영업 담당자에게 연락해주세요.
                  </p>
                </>
              )}
              {!info.isAvailable && !info.isDebt && (
                <>
                  <p className="text-sm font-bold text-gray-700 mb-1">현재 잔액 없음</p>
                  <p className="text-sm text-gray-600">
                    현재 선결제 잔액이 없습니다. 제품 주문은 가능합니다.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 주문 내역으로 이동 안내 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#2B5F9E]/10 rounded-xl flex items-center justify-center">
              <i className="ri-file-list-3-line text-lg text-[#2B5F9E]"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">거래 내역 조회</h2>
              <p className="text-xs text-gray-500 mt-0.5">주문 내역에서 상세 거래 이력을 확인하세요</p>
            </div>
          </div>
          <Link
            to="/my-orders"
            className="flex items-center justify-between p-4 bg-[#2B5F9E]/5 rounded-xl hover:bg-[#2B5F9E]/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <i className="ri-shopping-bag-3-line text-xl text-[#2B5F9E] w-6 h-6 flex items-center justify-center"></i>
              <div>
                <p className="text-sm font-semibold text-gray-800">주문 내역 보기</p>
                <p className="text-xs text-gray-500">주문 현황 및 배송 내역 확인</p>
              </div>
            </div>
            <i className="ri-arrow-right-line text-[#2B5F9E] group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleGoToOrder}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-[#2B5F9E] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#3A7BC8] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-shopping-cart-2-line w-4 h-4 flex items-center justify-center"></i>
            제품 주문하기
          </button>
          <Link
            to="/my-orders"
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 border border-[#2B5F9E]/30 text-[#2B5F9E] rounded-xl text-xs sm:text-sm font-bold hover:bg-[#2B5F9E]/5 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-file-list-3-line w-4 h-4 flex items-center justify-center"></i>
            주문 내역 보기
          </Link>
        </div>
      </main>
    </div>
  );
}
