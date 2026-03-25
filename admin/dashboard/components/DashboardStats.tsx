interface StatsData {
  todayOrders: number;
  monthOrders: number;
  monthRevenue: number;
  pendingUrgent: number;
  activeClients: number;
  totalArrears: number;
  totalCredit: number;
  loading: boolean;
}

const CARDS = (s: StatsData) => [
  {
    title: '오늘 주문',
    value: `${s.todayOrders}건`,
    icon: 'ri-shopping-bag-3-line',
    bg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    valueCls: 'text-teal-700',
    sub: '금일 신규 주문',
    subIcon: 'ri-calendar-today-line',
  },
  {
    title: '이번달 주문',
    value: `${s.monthOrders}건`,
    icon: 'ri-file-list-3-line',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    valueCls: 'text-sky-700',
    sub: `₩${s.monthRevenue.toLocaleString()}`,
    subIcon: 'ri-money-dollar-circle-line',
  },
  {
    title: '처리 대기 (긴급)',
    value: `${s.pendingUrgent}건`,
    icon: 'ri-alarm-warning-line',
    bg: s.pendingUrgent > 0 ? 'bg-red-50' : 'bg-gray-50',
    iconColor: s.pendingUrgent > 0 ? 'text-red-500' : 'text-gray-400',
    valueCls: s.pendingUrgent > 0 ? 'text-red-600' : 'text-gray-500',
    sub: s.pendingUrgent > 0 ? '즉시 처리 필요' : '처리 대기 없음',
    subIcon: 'ri-error-warning-line',
    urgent: s.pendingUrgent > 0,
  },
  {
    title: '활성 거래처',
    value: `${s.activeClients}곳`,
    icon: 'ri-hospital-line',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueCls: 'text-emerald-700',
    sub: '이번달 주문 거래처',
    subIcon: 'ri-group-line',
  },
  {
    title: '미수금 합계',
    value: `₩${s.totalArrears.toLocaleString()}`,
    icon: 'ri-error-warning-line',
    bg: s.totalArrears > 0 ? 'bg-red-50' : 'bg-gray-50',
    iconColor: s.totalArrears > 0 ? 'text-red-500' : 'text-gray-400',
    valueCls: s.totalArrears > 0 ? 'text-red-600' : 'text-gray-400',
    sub: '정산 미완료 총액',
    subIcon: 'ri-bill-line',
  },
  {
    title: '사용가능잔액 합계',
    value: `₩${s.totalCredit.toLocaleString()}`,
    icon: 'ri-wallet-3-line',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    valueCls: 'text-blue-600',
    sub: '전체 선수금 잔액',
    subIcon: 'ri-coin-line',
  },
];

export default function DashboardStats(props: StatsData) {
  const cards = CARDS(props);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-xl border border-gray-100 p-4 ${card.bg} ${card.urgent ? 'ring-2 ring-red-300 ring-offset-1' : ''}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${card.bg.replace('50', '100')}`}>
              <i className={`${card.icon} text-lg ${card.iconColor}`}></i>
            </div>
            {card.urgent && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse whitespace-nowrap">
                긴급
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium text-gray-500 mb-0.5">{card.title}</p>
          {props.loading ? (
            <div className="h-7 bg-gray-200 rounded animate-pulse w-3/4 mb-1"></div>
          ) : (
            <p className={`text-xl font-extrabold leading-tight ${card.valueCls}`}>{card.value}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <i className={`${card.subIcon} text-[10px] text-gray-400 w-3 h-3 flex items-center justify-center`}></i>
            <p className="text-[10px] text-gray-400 leading-tight">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
