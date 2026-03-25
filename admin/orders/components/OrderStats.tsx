
interface OrderStatsProps {
  totalOrders: number;
  pendingOrders: number;
  shippingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export default function OrderStats({ 
  totalOrders, 
  pendingOrders, 
  shippingOrders, 
  completedOrders,
  totalRevenue 
}: OrderStatsProps) {
  const stats = [
    {
      label: '전체 주문',
      value: totalOrders,
      icon: 'ri-file-list-3-line',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      label: '처리 대기',
      value: pendingOrders,
      icon: 'ri-time-line',
      color: 'bg-amber-50 text-amber-600'
    },
    {
      label: '배송중',
      value: shippingOrders,
      icon: 'ri-truck-line',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      label: '배송완료',
      value: completedOrders,
      icon: 'ri-checkbox-circle-line',
      color: 'bg-emerald-50 text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
              <i className={`${stat.icon} text-xl`}></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-sm text-gray-500">{stat.label}</p>
        </div>
      ))}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <i className="ri-money-dollar-circle-line text-xl"></i>
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {(totalRevenue / 10000).toLocaleString()}만원
        </p>
        <p className="text-sm text-gray-500">총 매출</p>
      </div>
    </div>
  );
}
