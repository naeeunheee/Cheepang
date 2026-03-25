import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { getCurrentBusinessNo } from '../../../../hooks/useCustomer';

interface PointBadgeProps {
  orderAmount?: number;
}

/** outstanding_balance 기반 잔액 상태 */
function getBalanceStatus(balance: number) {
  if (balance < 0) {
    return {
      label: '사용 가능 잔액',
      displayAmount: Math.abs(balance),
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textStrong: 'text-emerald-700',
      textNormal: 'text-emerald-600',
      isAvailable: true,
      isDebt: false,
    };
  }
  if (balance > 0) {
    return {
      label: '미수금',
      displayAmount: balance,
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      textStrong: 'text-red-600',
      textNormal: 'text-red-500',
      isAvailable: false,
      isDebt: true,
    };
  }
  return {
    label: '잔액',
    displayAmount: 0,
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-500',
    textStrong: 'text-gray-700',
    textNormal: 'text-gray-500',
    isAvailable: false,
    isDebt: false,
  };
}

export default function PointBadge({ orderAmount = 0 }: PointBadgeProps) {
  const businessNo = getCurrentBusinessNo();
  const [outstandingBalance, setOutstandingBalance] = useState<number | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessNo) { setLoading(false); return; }

    const fetchBalance = async () => {
      try {
        const bizClean = businessNo.replace(/-/g, '');
        const { data } = await supabase
          .from('clients')
          .select('id, outstanding_balance')
          .or(
            `business_number.eq.${bizClean},business_no.eq.${bizClean},` +
            `business_number.eq.${businessNo},business_no.eq.${businessNo}`
          )
          .maybeSingle();

        if (data) {
          setOutstandingBalance(data.outstanding_balance || 0);
          setClientId(data.id);
        }
      } catch (err) {
        console.error('잔액 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [businessNo]);

  // 실시간 구독
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`point_badge_balance_${clientId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${clientId}` },
        (payload) => {
          const updated = payload.new as { outstanding_balance?: number };
          if (typeof updated.outstanding_balance === 'number') {
            setOutstandingBalance(updated.outstanding_balance);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  if (loading || outstandingBalance === null) return null;

  const balance = outstandingBalance;
  const status = getBalanceStatus(balance);

  return (
    <div className={`rounded-xl px-3 md:px-5 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 border ${status.bgClass} ${status.borderClass}`}>
      {/* 잔액 표시 */}
      <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status.iconBg}`}>
          <i className={`ri-wallet-3-line text-base md:text-xl ${status.iconColor}`}></i>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs text-gray-500 font-medium">
            {status.label}
          </p>
          <p className={`text-base md:text-2xl font-extrabold tracking-tight ${status.textStrong}`}>
            ₩{status.displayAmount.toLocaleString()}
          </p>
          {status.isDebt && (
            <p className="text-[10px] md:text-[11px] text-red-600 mt-0.5 font-medium">
              <i className="ri-alert-line mr-1"></i>미수금이 있습니다. 담당자에게 문의해주세요.
            </p>
          )}
          {!status.isAvailable && !status.isDebt && (
            <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5">
              현재 선결제 잔액이 없습니다
            </p>
          )}
        </div>
      </div>

      {/* 내역 링크 */}
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
        <Link
          to="/my-points"
          className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-white border border-gray-200 hover:border-[#2B5F9E] hover:bg-[#2B5F9E]/5 transition-all cursor-pointer group flex-shrink-0"
        >
          <i className="ri-wallet-3-line text-xs md:text-sm text-gray-500 group-hover:text-[#2B5F9E] w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center"></i>
          <span className="text-[10px] md:text-xs font-semibold text-gray-600 group-hover:text-[#2B5F9E] whitespace-nowrap">잔액 현황</span>
        </Link>
      </div>
    </div>
  );
}
