interface ClientData {
  name: string;
  business_number: string;
  package_tier?: string;
  outstanding_balance?: number;
  created_at?: string;
  package_applied_at?: string;
}

interface ClientInfoCardProps {
  clientData: ClientData | null;
  loading: boolean;
}

export default function ClientInfoCard({ clientData, loading }: ClientInfoCardProps) {
  const balance = clientData?.outstanding_balance ?? 0;
  const isCredit = balance < 0;
  const isArrears = balance > 0;

  const tierNum = clientData?.package_tier ? Number(clientData.package_tier) : null;
  const tierBadge = (tier: number | null) => {
    if (!tier) return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };
    if (tier >= 10000) return { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' };
    if (tier >= 5000)  return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    if (tier >= 3000)  return { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200' };
    if (tier >= 2000)  return { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' };
    return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  };
  const badge = tierBadge(tierNum);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E0D5C3] p-6 animate-pulse" style={{ background: '#FAF6F0' }}>
        <div className="h-6 bg-[#E0D5C3] rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-[#E0D5C3] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="rounded-2xl border border-[#E0D5C3] p-6 text-center" style={{ background: '#FAF6F0' }}>
        <i className="ri-error-warning-line text-3xl mb-2" style={{ color: '#8B6914' }}></i>
        <p className="text-sm font-medium" style={{ color: '#5C5346' }}>거래처 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E0D5C3] overflow-hidden" style={{ background: 'linear-gradient(135deg, #FAF6F0 0%, #F5EDE0 100%)' }}>
      {/* 상단 헤더 */}
      <div className="px-5 py-4 border-b border-[#E0D5C3] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.12)' }}>
          <i className="ri-hospital-line text-lg" style={{ color: '#8B6914' }}></i>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{clientData.name}</h2>
          <p className="text-xs font-medium" style={{ color: '#8C7E6A' }}>
            사업자번호 {clientData.business_number}
          </p>
        </div>
      </div>

      {/* 패키지 하이라이트 섹션 */}
      <div className="px-5 py-4 border-b border-[#E0D5C3]" style={{ background: 'rgba(139,105,20,0.04)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.15)' }}>
              <i className="ri-vip-crown-2-line text-lg" style={{ color: '#8B6914' }}></i>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#8C7E6A' }}>현재 적용 패키지</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xl font-extrabold px-3 py-1 rounded-xl border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {clientData.package_tier ? `${clientData.package_tier} PKG` : '미설정'}
                </span>
                {clientData.package_applied_at && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-white border border-[#E0D5C3]" style={{ color: '#8C7E6A' }}>
                    <i className="ri-time-line mr-1"></i>
                    {new Date(clientData.package_applied_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })} 적용
                  </span>
                )}
                {!clientData.package_applied_at && clientData.created_at && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-white border border-[#E0D5C3]" style={{ color: '#8C7E6A' }}>
                    <i className="ri-time-line mr-1"></i>
                    {new Date(clientData.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })} 가입 시 적용
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* 패키지 변경 문의 버튼 */}
          <a
            href="tel:010-8950-3379"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap border border-[#D4C4A8] hover:border-[#8B6914]"
            style={{ background: 'white', color: '#5C5346' }}
          >
            <i className="ri-phone-line text-base w-4 h-4 flex items-center justify-center" style={{ color: '#8B6914' }}></i>
            패키지 변경 문의
          </a>
        </div>
      </div>

      {/* 정보 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-y divide-[#E0D5C3] border-t border-[#E0D5C3]">
        {/* 잔액 */}
        <div className="px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7E6A' }}>잔액 현황</p>
          <div className="flex items-center gap-1.5">
            <i className={`ri-wallet-line text-sm w-4 h-4 flex items-center justify-center ${isCredit ? 'text-blue-500' : isArrears ? 'text-red-500' : 'text-gray-400'}`}></i>
            <span className={`text-sm font-bold ${isCredit ? 'text-blue-600' : isArrears ? 'text-red-600' : 'text-gray-500'}`}>
              ₩{Math.abs(balance).toLocaleString()}
            </span>
          </div>
          {isCredit && <p className="text-[10px] text-blue-500 mt-0.5 font-medium">사용가능 잔액</p>}
          {isArrears && <p className="text-[10px] text-red-500 mt-0.5 font-medium">미수금</p>}
          {balance === 0 && <p className="text-[10px] text-gray-400 mt-0.5">잔액 없음</p>}
        </div>

        {/* 가입일 */}
        <div className="px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7E6A' }}>가입일</p>
          <div className="flex items-center gap-1.5">
            <i className="ri-calendar-line text-sm w-4 h-4 flex items-center justify-center" style={{ color: '#8B6914' }}></i>
            <span className="text-sm font-medium" style={{ color: '#3D3428' }}>
              {clientData.created_at
                ? new Date(clientData.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                : '-'}
            </span>
          </div>
        </div>

        {/* 계정 상태 */}
        <div className="px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7E6A' }}>계정 상태</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
            <span className="text-sm font-semibold text-emerald-600">정상</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">문의: 010-8950-3379</p>
        </div>
      </div>
    </div>
  );
}
