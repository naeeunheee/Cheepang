
interface Order {
  id: string;
  client_id: string;
  client_name: string;
  order_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  order_date: string;
  delivery_date: string | null;
  notes: string;
}

interface ClientOrderListProps {
  orders: Order[];
  onViewDetail: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
}

const STATUS_OPTIONS = ['주문확인', '준비중', '배송중', '배송완료'];

export default function ClientOrderList({
  orders,
  onViewDetail,
  onStatusChange,
}: ClientOrderListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case '주문확인': return 'bg-gray-100 text-gray-700';
      case '준비중': return 'bg-amber-100 text-amber-700';
      case '배송중': return 'bg-sky-100 text-sky-700';
      case '배송완료': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const totalAmount = orders.reduce((sum, o) => sum + o.total_price, 0);

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
        </div>
        <p className="text-gray-500">해당 조건의 주문 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">주문번호</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">제품명</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">수량</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">단가</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">금액</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">상태</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">주문일</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">배송일</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-[#2B5F9E]">{order.order_number}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{order.product_name}</span>
                  {order.notes ? (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <i className="ri-chat-3-line text-xs"></i>
                      {order.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-700">{order.quantity}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-gray-500">{order.unit_price.toLocaleString()}원</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-semibold text-gray-900">{order.total_price.toLocaleString()}원</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <select
                    key={`status-${order.id}`}
                    value={order.status}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border-0 outline-none ${getStatusColor(order.status)}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-500">{formatDate(order.order_date)}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-500">{formatDate(order.delivery_date)}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onViewDetail(order)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#2B5F9E] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-eye-line text-lg"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">합계 ({orders.length}건)</span>
          <span className="text-sm font-bold text-[#2B5F9E]">{totalAmount.toLocaleString()}원</span>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-gray-100">
        {orders.map((order) => (
          <div key={order.id} className="p-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2B5F9E]">{order.order_number}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">{order.product_name}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{order.quantity}개 × {order.unit_price.toLocaleString()}원</span>
              <span className="font-semibold text-gray-900">{order.total_price.toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{formatDate(order.order_date)}</span>
              <button
                type="button"
                onClick={() => onViewDetail(order)}
                className="text-[#2B5F9E] hover:underline cursor-pointer"
              >
                상세보기
              </button>
            </div>
          </div>
        ))}
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">합계 ({orders.length}건)</span>
          <span className="text-sm font-bold text-[#2B5F9E]">{totalAmount.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );
}
