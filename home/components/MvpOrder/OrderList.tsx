import { MvpOrder, OrderStatus } from '../../../../mocks/highness-catalog';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import DeliveryStatusModal from '../../../../components/feature/DeliveryStatusModal';
import KakaoStatusNotify from '../../../../components/feature/KakaoStatusNotify';

interface OrderListProps {
  orders: MvpOrder[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isAdmin: boolean;
}

export default function OrderList({ orders, onStatusChange, isAdmin }: OrderListProps) {
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<MvpOrder | null>(null);
  const [kakaoNotify, setKakaoNotify] = useState<{
    isOpen: boolean;
    orderId: string;
    clientName: string;
    newStatus: string;
    productSummary: string;
    totalAmount: number;
  }>({ isOpen: false, orderId: '', clientName: '', newStatus: '', productSummary: '', totalAmount: 0 });

  const statusOptions: OrderStatus[] = ['주문접수', '준비중', '배송중', '배송완료'];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case '주문접수':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '준비중':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '배송중':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case '배송완료':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleAdminStatusChange = (order: MvpOrder, newStatus: OrderStatus) => {
    onStatusChange(order.id, newStatus);
    
    if (newStatus === '준비중' || newStatus === '배송중' || newStatus === '배송완료') {
      const productNames = order.items.map(item => item.productName).join(', ');
      const summary = productNames.length > 40 ? productNames.substring(0, 40) + '...' : productNames;
      setKakaoNotify({
        isOpen: true,
        orderId: order.id,
        clientName: order.clientName,
        newStatus,
        productSummary: summary,
        totalAmount: order.totalAmount,
      });
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">주문 내역이 없습니다</h3>
        <p className="text-sm text-gray-500 mb-6">아직 주문하신 내역이 없습니다.</p>
        {!isAdmin && (
          <Link
            to="/my-orders"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#2B5F9E] hover:text-[#3A7BC8] transition-colors cursor-pointer"
          >
            <i className="ri-external-link-line"></i>
            전체 주문 내역 보기
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {!isAdmin && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              최근 주문 <span className="font-semibold text-[#2B5F9E]">{orders.length}</span>건
            </p>
            <Link
              to="/my-orders"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#2B5F9E] hover:text-[#3A7BC8] hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
            >
              <i className="ri-external-link-line text-sm"></i>
              전체 주문 내역 보기
            </Link>
          </div>
        )}

        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Order Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      주문번호: {order.id}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.clientName} • {order.orderedAt}
                    </p>
                  </div>
                  {isAdmin ? (
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleAdminStatusChange(order, e.target.value as OrderStatus)
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white focus:outline-none focus:border-[#2B5F9E] focus:ring-2 focus:ring-[#2B5F9E]/10 cursor-pointer"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">주문 금액</p>
                  <p className="text-lg font-bold text-[#2B5F9E]">
                    ₩{order.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <div className="space-y-3">
                {order.items.map((item, idx) => {
                  const componentTotal = (item.components ?? []).reduce(
                    (s, c) => s + c.unitPrice * c.quantity,
                    0
                  );
                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.productName}
                        </p>
                        {/* 품목코드: selectedOptionModelCode 우선 */}
                        {(item.selectedOptionModelCode || item.productCode) && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {item.selectedOptionModelCode || item.productCode}
                          </p>
                        )}
                        {/* 규격 정보 */}
                        {item.sizeInfo && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-[#2B5F9E]/8 text-[#2B5F9E] border border-[#2B5F9E]/20 px-2 py-0.5 rounded-md font-medium">
                            <i className="ri-ruler-line text-[10px] w-3 h-3 flex items-center justify-center"></i>
                            {item.sizeInfo}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.selectedOptions ?? {})
                            .filter(([key]) => key !== '규격')
                            .map(([k, v]) => (
                              <span
                                key={k}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                              >
                                {k}: {v}
                              </span>
                            ))}
                        </div>
                        {item.components && item.components.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold text-gray-500">
                              구성품:
                            </p>
                            {item.components.map((c, ci) => (
                              <p key={ci} className="text-xs text-gray-500 ml-3">
                                • {c.productName} ({c.productCode}) x{c.quantity} -
                                ₩
                                {(c.unitPrice * c.quantity).toLocaleString()}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-xs text-gray-500">
                          수량: {item.quantity}개
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          ₩
                          {(
                            (item.totalPrice ?? 0) + componentTotal
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Status Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedOrderForDelivery(order)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-truck-line text-base"></i>
                  배송현황 보기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Status Modal */}
      {selectedOrderForDelivery && (
        <DeliveryStatusModal
          orderId={selectedOrderForDelivery.id}
          currentStatus={selectedOrderForDelivery.status}
          orderedAt={selectedOrderForDelivery.orderedAt}
          onClose={() => setSelectedOrderForDelivery(null)}
        />
      )}

      {/* Kakao Status Change Notify */}
      <KakaoStatusNotify
        isOpen={kakaoNotify.isOpen}
        orderId={kakaoNotify.orderId}
        clientName={kakaoNotify.clientName}
        newStatus={kakaoNotify.newStatus}
        productSummary={kakaoNotify.productSummary}
        totalAmount={kakaoNotify.totalAmount}
        onClose={() => setKakaoNotify(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
