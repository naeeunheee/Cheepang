import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { usePoints } from '../../../hooks/usePoints';
import AdminHeader from '../../../components/feature/AdminHeader';
import ChargeRequestNotify from '../../../components/feature/ChargeRequestNotify';
import ClientOrderStats from './components/ClientOrderStats';
import ClientOrderList from './components/ClientOrderList';
import ProductSummary from './components/ProductSummary';
import MonthlyChart from './components/MonthlyChart';
import OrderModal from '../orders/components/OrderModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Client {
  id: string;
  name: string;
  business_number: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  point_balance: number;
}

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
  client_business_number?: string;
}

// 거래처 목록 조회 (필요한 컬럼만)
const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, business_number, business_no, representative, phone, email, address, point_balance')
    .order('name', { ascending: true })
    .limit(500);

  if (error) throw error;
  
  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    business_number: c.business_number || c.business_no || '',
    representative: c.representative || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    point_balance: c.point_balance || 0
  }));
};

// 주문 목록 조회 (모바일 최적화: limit 30)
const fetchOrders = async (limit = 50): Promise<Order[]> => {
  // 모바일 환경 감지
  const isMobile = window.innerWidth < 768;
  const actualLimit = isMobile ? 30 : limit;
  
  const { data, error } = await supabase
    .from('orders')
    .select('id, client_id, client_name, order_number, product_name, quantity, unit_price, total_price, status, order_date, delivery_date, notes, client_business_number')
    .order('order_date', { ascending: false })
    .limit(actualLimit);

  if (error) throw error;
  return data || [];
};

export default function ClientOrdersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId') || '';

  const [selectedClientId, setSelectedClientId] = useState(clientIdParam);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [quickPeriod, setQuickPeriod] = useState<string>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showClientList, setShowClientList] = useState(!clientIdParam);

  const { getClientPoint } = usePoints();

  // React Query로 거래처 목록 캐싱
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['client_orders_clients'],
    queryFn: fetchClients,
    staleTime: 60 * 1000,
  });

  // React Query로 주문 목록 캐싱
  const { data: rawOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['client_orders_orders'],
    queryFn: () => fetchOrders(50),
    staleTime: 60 * 1000,
  });

  // 과거 데이터 호환: client_id가 UUID가 아닌 경우 매칭
  const orders = useMemo(() => {
    return rawOrders.map((o: any) => {
      let finalClientId = o.client_id;
      let finalClientName = o.client_name || '';

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.client_id);
      
      if (!isUUID && o.client_business_number) {
        const matchedClient = clients.find(c => c.business_number === o.client_business_number);
        
        if (matchedClient) {
          finalClientId = matchedClient.id;
          finalClientName = matchedClient.name;
        }
      }

      return {
        ...o,
        client_id: finalClientId,
        client_name: finalClientName,
      };
    });
  }, [rawOrders, clients]);

  const isLoading = clientsLoading || ordersLoading;

  // clientIdParam이 사업자번호인 경우 UUID로 변환
  useMemo(() => {
    if (clientIdParam && clients.length > 0) {
      const matchedClient = clients.find(c => c.business_number === clientIdParam);
      if (matchedClient) {
        setSelectedClientId(matchedClient.id);
      } else {
        setSelectedClientId(clientIdParam);
      }
      setShowClientList(false);
    }
  }, [clientIdParam, clients]);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);

  const clientOrders = useMemo(() => {
    if (!selectedClientId) return [];
    return orders.filter(o => o.client_id === selectedClientId);
  }, [orders, selectedClientId]);

  const filteredOrders = useMemo(() => {
    return clientOrders.filter(o => {
      const matchesStatus = !statusFilter || o.status === statusFilter;
      const matchesSearch = !searchTerm ||
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateFrom = !dateRange.from || o.order_date >= dateRange.from;
      const matchesDateTo = !dateRange.to || o.order_date <= dateRange.to;
      return matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [clientOrders, statusFilter, searchTerm, dateRange]);

  // 거래처별 주문 요약 (주문이 있는 거래처만)
  const clientOrderSummary = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number; lastOrder: string }>();
    orders.forEach(o => {
      const prev = map.get(o.client_id);
      if (!prev) {
        map.set(o.client_id, { name: o.client_name, count: 1, revenue: o.total_price, lastOrder: o.order_date });
      } else {
        map.set(o.client_id, { ...prev, count: prev.count + 1, revenue: prev.revenue + o.total_price, lastOrder: o.order_date > prev.lastOrder ? o.order_date : prev.lastOrder });
      }
    });
    return map;
  }, [orders]);

  const getPointBadgeStyle = (balance: number) => {
    if (balance < 0) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (balance === 0) {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    } else {
      return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const formatPointBalance = (balance: number) => {
    if (balance < 0) {
      return `선포인트 ${Math.abs(balance).toLocaleString()}원`;
    } else if (balance === 0) {
      return '0원';
    } else {
      return `미수금 ${balance.toLocaleString()}원`;
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setSearchParams({ clientId });
    setShowClientList(false);
    setStatusFilter('');
    setDateRange({ from: '', to: '' });
    setQuickPeriod('전체');
    setSearchTerm('');
  };

  const handleBackToList = () => {
    setSelectedClientId('');
    setSearchParams({});
    setShowClientList(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['client_orders_orders'] });
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) return;
    
    const wsData = [
      ['주문번호', '제품명', '수량', '단가', '금액', '상태', '주문일', '배송일', '비고'],
      ...filteredOrders.map(o => [
        o.order_number,
        o.product_name,
        o.quantity,
        o.unit_price,
        o.total_price,
        o.status,
        o.order_date,
        o.delivery_date || '',
        o.notes
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문내역');
    XLSX.writeFile(wb, `${selectedClient?.name || '거래처'}_주문내역.xlsx`);
  };

  const handleExportPDF = () => {
    if (filteredOrders.length === 0) return;

    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`${selectedClient?.name || '거래처'} 주문내역`, 14, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`출력일: ${new Date().toLocaleDateString('ko-KR')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['주문번호', '제품명', '수량', '단가', '금액', '상태', '주문일']],
      body: filteredOrders.map(o => [
        o.order_number,
        o.product_name,
        o.quantity,
        o.unit_price.toLocaleString(),
        o.total_price.toLocaleString(),
        o.status,
        o.order_date
      ]),
      styles: { font: 'helvetica', fontSize: 9 },
      headStyles: { fillColor: [43, 95, 158], textColor: 255 },
    });

    doc.save(`${selectedClient?.name || '거래처'}_주문내역.pdf`);
  };

  const handlePointClick = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      window.REACT_APP_NAVIGATE(`/admin/points?clientId=${client.business_number}`);
    }
  };

  const handleQuickPeriod = (period: string) => {
    setQuickPeriod(period);
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    if (period === '오늘') {
      const t = fmt(today);
      setDateRange({ from: t, to: t });
    } else if (period === '이번주') {
      const day = today.getDay();
      const mon = new Date(today);
      mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      setDateRange({ from: fmt(mon), to: fmt(today) });
    } else if (period === '이번달') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateRange({ from: fmt(from), to: fmt(today) });
    } else if (period === '3개월') {
      const from = new Date(today);
      from.setMonth(today.getMonth() - 3);
      setDateRange({ from: fmt(from), to: fmt(today) });
    } else {
      setDateRange({ from: '', to: '' });
    }
  };

  const statuses = ['전체', '주문확인', '준비중', '배송중', '배송완료'];
  const quickPeriods = ['오늘', '이번주', '이번달', '3개월', '전체'];

  // 기간 필터 요약 통계
  const periodStats = useMemo(() => {
    const count = filteredOrders.length;
    const total = filteredOrders.reduce((sum, o) => sum + o.total_price, 0);
    const completed = filteredOrders.filter(o => o.status === '배송완료').length;
    return { count, total, completed };
  }, [filteredOrders]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <AdminHeader />
      <ChargeRequestNotify />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {showClientList ? (
          <>
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">거래처별 주문 내역</h1>
              <p className="text-sm text-gray-500 mt-1">거래처를 선택하여 주문 이력을 조회합니다</p>
            </div>
            
            {isLoading ? (
              <div className="space-y-6">
                {/* KPI 스켈레톤 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-5">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
                
                {/* 로딩 메시지 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 md:p-12 text-center">
                  <div className="w-12 h-12 border-4 border-[#2B5F9E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm md:text-base text-gray-500">거래처 데이터를 불러오는 중...</p>
                  <p className="text-xs text-gray-400 mt-2">잠시만 기다려주세요</p>
                </div>
              </div>
            ) : clients.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-building-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">등록된 거래처가 없습니다</h3>
                <p className="text-sm text-gray-500 mb-6">거래처 관리에서 거래처를 등록해주세요</p>
                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/admin/clients')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2B5F9E] text-white rounded-lg text-sm font-semibold hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line text-lg"></i>
                  거래처 등록하기
                </button>
              </div>
            ) : (
              <>
                {/* 모바일 카드뷰 */}
                <div className="md:hidden space-y-3 mb-6">
                  {clients.map((client) => {
                    const summary = clientOrderSummary.get(client.id);
                    return (
                      <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">{client.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-gray-900 truncate">{client.name}</h3>
                              <p className="text-xs text-gray-400">{client.business_number}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs mb-3">
                          <div className="flex justify-between">
                            <span className="text-gray-500">대표자</span>
                            <span className="text-gray-700">{client.representative || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">연락처</span>
                            <span className="text-gray-700">{client.phone || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">포인트잔액</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getPointBadgeStyle(client.point_balance || 0)}`}>
                              {formatPointBalance(client.point_balance || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">총 주문</span>
                            <span className="text-gray-700 font-medium">{summary ? `${summary.count}건` : '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">총 금액</span>
                            <span className="text-[#2B5F9E] font-bold">
                              {summary ? `${summary.revenue.toLocaleString()}원` : '-'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectClient(client.id)}
                          className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-[#2B5F9E] text-white rounded-lg text-xs font-medium hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          주문내역 보기
                          <i className="ri-arrow-right-s-line text-base"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 데스크톱 테이블 */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">거래처명</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">대표자</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">전화번호</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">포인트잔액</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">총 주문건</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">총 금액</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clients.map((client) => {
                        const summary = clientOrderSummary.get(client.id);
                        return (
                          <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">{client.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{client.name}</p>
                                  <p className="text-xs text-gray-400">{client.business_number}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{client.representative}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{client.phone}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getPointBadgeStyle(client.point_balance || 0)}`}>
                                {formatPointBalance(client.point_balance || 0)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm text-gray-700">{summary ? `${summary.count}건` : '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-semibold text-[#2B5F9E]">
                                {summary ? `${summary.revenue.toLocaleString()}원` : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleSelectClient(client.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2B5F9E] text-white rounded-lg text-sm font-medium hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
                              >
                                주문내역
                                <i className="ri-arrow-right-s-line text-base"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* 거래처 상세 — 모바일 최적화 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <button onClick={handleBackToList} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors cursor-pointer flex-shrink-0">
                  <i className="ri-arrow-left-line text-xl"></i>
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3 flex-wrap">
                    <span className="truncate">{selectedClient?.name || '거래처'}</span>
                    <span className="text-xs md:text-sm font-normal text-gray-400 bg-gray-100 px-2 md:px-2.5 py-1 rounded-full whitespace-nowrap">{selectedClient?.business_number}</span>
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">{selectedClient?.representative} · {selectedClient?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <button onClick={handleExportExcel} disabled={filteredOrders.length === 0} className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-xs md:text-sm hover:bg-emerald-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <i className="ri-file-excel-2-line text-base md:text-lg"></i>
                  <span className="hidden sm:inline">엑셀</span>
                </button>
                <button onClick={handleExportPDF} disabled={filteredOrders.length === 0} className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg font-medium text-xs md:text-sm hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <i className="ri-file-pdf-line text-base md:text-lg"></i>
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            </div>

            {selectedClient && (
              <div 
                onClick={() => handlePointClick(selectedClientId)}
                className={`mb-6 p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${getPointBadgeStyle(selectedClient.point_balance || 0)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-white/50 rounded-lg">
                      <i className="ri-wallet-3-line text-xl"></i>
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-80 mb-0.5">포인트 잔액</p>
                      <p className="text-xl md:text-2xl font-bold">{formatPointBalance(selectedClient.point_balance || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm font-medium opacity-70">
                    <span className="hidden sm:inline">포인트 관리</span>
                    <i className="ri-arrow-right-s-line text-lg"></i>
                  </div>
                </div>
                {selectedClient.point_balance > 0 && (
                  <div className="mt-3 pt-3 border-t border-current/20">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <i className="ri-alert-line"></i>
                      결제 필요 - 미수금 정산 요청
                    </p>
                  </div>
                )}
              </div>
            )}

            <ClientOrderStats orders={clientOrders} clientId={selectedClientId} dateRange={dateRange} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              <MonthlyChart orders={clientOrders} />
              <ProductSummary orders={clientOrders} />
            </div>

            {/* 필터 — 빠른 기간 선택 + 날짜 직접 입력 */}
            <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border border-gray-100 mb-4">
              <div className="flex flex-col gap-3 md:gap-4">
                {/* 검색 */}
                <div className="relative">
                  <i className="ri-search-line absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="주문번호, 제품명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]"
                  />
                </div>

                {/* 빠른 기간 선택 버튼 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">기간 선택</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {quickPeriods.map((period) => (
                      <button
                        key={period}
                        onClick={() => handleQuickPeriod(period)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                          quickPeriod === period
                            ? 'bg-[#2B5F9E] text-white border-[#2B5F9E] shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#2B5F9E] hover:text-[#2B5F9E]'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 날짜 직접 입력 */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <i className="ri-calendar-line text-gray-400 text-sm flex-shrink-0"></i>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => {
                        setDateRange({ ...dateRange, from: e.target.value });
                        setQuickPeriod('');
                      }}
                      className="flex-1 px-3 py-2.5 md:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
                    />
                    <span className="text-gray-400 text-sm">~</span>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => {
                        setDateRange({ ...dateRange, to: e.target.value });
                        setQuickPeriod('');
                      }}
                      className="flex-1 px-3 py-2.5 md:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
                    />
                    <button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['client_orders_orders'] })}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-search-line text-sm"></i>
                      조회
                    </button>
                  </div>
                  {/* 상태 필터 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status === '전체' ? '' : status)}
                        className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          (status === '전체' && !statusFilter) || statusFilter === status
                            ? 'bg-[#2B5F9E] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 기간 필터 요약 통계 배너 */}
            {(dateRange.from || dateRange.to || statusFilter) && (
              <div className="bg-gradient-to-r from-[#2B5F9E]/5 to-[#3A7BC8]/5 border border-[#2B5F9E]/20 rounded-lg px-4 py-3 mb-4 flex flex-wrap items-center gap-3 md:gap-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <i className="ri-filter-3-line text-[#2B5F9E]"></i>
                  <span className="font-medium text-[#2B5F9E]">필터 적용 결과</span>
                  {(dateRange.from || dateRange.to) && (
                    <span className="text-gray-400">
                      {dateRange.from || '시작'} ~ {dateRange.to || '현재'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 ml-auto flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">조회 건수</span>
                    <span className="text-sm font-bold text-gray-900">{periodStats.count}건</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 hidden sm:block"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">합계 금액</span>
                    <span className="text-sm font-bold text-[#2B5F9E]">{periodStats.total.toLocaleString()}원</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 hidden sm:block"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">배송완료</span>
                    <span className="text-sm font-bold text-emerald-600">{periodStats.completed}건</span>
                  </div>
                </div>
              </div>
            )}

            <ClientOrderList orders={filteredOrders} onViewDetail={handleViewDetail} onStatusChange={handleStatusChange} />
          </>
        )}
      </main>

      <OrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => {}} order={selectedOrder} clients={clients} mode="view" />
    </div>
  );
}