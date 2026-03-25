import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { usePoints } from '../../../hooks/usePoints';
import { useProducts } from '../../../hooks/useProducts';
import { notifyClientOrderStatus } from '../../../utils/kakaoNotify';
import AdminHeader from '../../../components/feature/AdminHeader';
import OrderStats from './components/OrderStats';
import OrderFilters from './components/OrderFilters';
import OrderTable from './components/OrderTable';
import OrderModal from './components/OrderModal';
import OrderDashboard from './components/OrderDashboard';
import LowBalanceWidget from './components/LowBalanceWidget';
import ChargeRequestNotify from '../../../components/feature/ChargeRequestNotify';
import OrderNotify from '../../../components/feature/OrderNotify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BackButton from '../../../components/feature/BackButton';
import PeriodStatementModal from './components/PeriodStatementModal';
import PhotoOrderTab from './components/PhotoOrderTab';

interface Client {
  id: string;
  name: string;
  business_number: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
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
    .select('id, name, business_number, business_no, representative, phone, email, address')
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
    address: c.address || ''
  }));
};

// 주문 목록 조회 (limit 증가 및 매칭 로직 강화)
const fetchOrders = async (limit = 100): Promise<Order[]> => {
  // 모바일 환경 감지
  const isMobile = window.innerWidth < 768;
  const actualLimit = isMobile ? 50 : limit;
  
  const { data, error } = await supabase
    .from('orders')
    .select('id, client_id, client_name, order_number, product_name, quantity, unit_price, total_price, status, order_date, delivery_date, notes, client_business_number')
    .order('order_date', { ascending: false })
    .limit(actualLimit);

  if (error) throw error;
  
  console.log('✅ 관리자 주문 조회 성공:', data?.length || 0, '건');
  return data || [];
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'photo_orders'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [showDashboard, setShowDashboard] = useState(true);
  const [kakaoNotifyEnabled, setKakaoNotifyEnabled] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPeriodStatement, setShowPeriodStatement] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({ start: '', end: '' });
  const [exportClientId, setExportClientId] = useState('');
  const [notifyToast, setNotifyToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const { pointsData, refresh: refreshPoints } = usePoints();
  
  // ✅ Supabase 제품 데이터 연동
  const { products: allProducts, loading: productsLoading } = useProducts();

  // 주문 관리 페이지 진입 시 신규 주문 뱃지 초기화
  useEffect(() => {
    localStorage.setItem('orders_last_seen', new Date().toISOString());
    // 전역 이벤트로 헤더/탭바에 뱃지 초기화 알림
    window.dispatchEvent(new CustomEvent('orders-badge-reset'));
  }, []);

  // 간편주문 미처리 건수 (탭 뱃지용)
  const { data: photoOrderCount = 0 } = useQuery({
    queryKey: ['photo_order_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['photo_order', 'photo_confirmed']);
      return count || 0;
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  // ✅ Supabase Realtime 구독 추가 - orders 테이블
  useEffect(() => {
    console.log('🔔 Realtime 구독 시작: orders 테이블');

    const ordersChannel = supabase
      .channel('realtime_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔔 orders 테이블 변경 감지:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
          queryClient.invalidateQueries({ queryKey: ['photo_orders'] });
          queryClient.invalidateQueries({ queryKey: ['photo_order_count'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Realtime 구독 해제: orders 테이블');
      supabase.removeChannel(ordersChannel);
    };
  }, [queryClient]);

  // React Query로 거래처 목록 캐싱
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['admin_clients'],
    queryFn: fetchClients,
    staleTime: 60 * 1000, // 60초 캐시
  });

  // React Query로 주문 목록 캐싱 (staleTime 단축)
  const { data: rawOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin_orders'],
    queryFn: () => fetchOrders(100),
    staleTime: 10 * 1000, // 10초로 단축 (실시간 반영 강화)
    refetchOnWindowFocus: true, // 포커스 시 자동 갱신
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
          console.log(`🔄 과거 데이터 매칭: ${o.order_number} → ${matchedClient.name}`);
        } else {
          console.warn(`⚠️ 매칭 실패: ${o.order_number} - 사업자번호 ${o.client_business_number}`);
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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesClient = !clientFilter || order.client_id === clientFilter;
      
      // 날짜 범위 필터링
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        if (dateRange.start && orderDate < dateRange.start) matchesDate = false;
        if (dateRange.end && orderDate > dateRange.end) matchesDate = false;
      }
      
      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, clientFilter, dateRange]);

  const stats = useMemo(() => ({
    totalOrders: filteredOrders.length,
    pendingOrders: filteredOrders.filter(o => o.status === '주문확인' || o.status === '준비중').length,
    shippingOrders: filteredOrders.filter(o => o.status === '배송중').length,
    completedOrders: filteredOrders.filter(o => o.status === '배송완료').length,
    totalRevenue: filteredOrders.reduce((sum, o) => sum + o.total_price, 0)
  }), [filteredOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.status;

    // 환불 처리 시 포인트 복원
    if (newStatus === '환불' && oldStatus !== '환불') {
      try {
        const clientPoint = pointsData.find(p => p.client_id === order.client_id);
        if (clientPoint) {
          const newBalance = clientPoint.point_balance + order.total_price;

          const { error: pointError } = await supabase
            .from('client_points')
            .update({
              point_balance: newBalance,
              last_updated: new Date().toISOString()
            })
            .eq('client_id', order.client_id);

          if (!pointError) {
            await supabase.from('point_transactions').insert([{
              client_id: order.client_id,
              client_name: order.client_name,
              type: 'refund',
              amount: order.total_price,
              balance_after: newBalance,
              description: `주문 환불 (${order.order_number})`,
              order_id: order.order_number,
              created_at: new Date().toISOString()
            }]);

            await refreshPoints();
          }
        }
      } catch (err) {
        console.error('포인트 환불 처리 실패:', err);
      }
    }

    // Supabase 업데이트
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });

      // 카카오 알림톡 발송 (토글이 켜져있을 때만)
      if (kakaoNotifyEnabled && oldStatus !== newStatus) {
        try {
          const { data: clientData } = await supabase
            .from('clients')
            .select('phone')
            .eq('id', order.client_id)
            .maybeSingle();

          if (clientData?.phone) {
            const notifyResult = await notifyClientOrderStatus({
              clientPhone: clientData.phone,
              orderNumber: order.order_number,
              status: newStatus,
              productName: order.product_name,
              amount: newStatus === '환불' ? order.total_price : undefined,
            });

            if (notifyResult) {
              setNotifyToast({
                show: true,
                message: `${order.client_name}에게 알림이 발송되었습니다`,
                type: 'success'
              });
            } else {
              setNotifyToast({
                show: true,
                message: '알림 발송에 실패했습니다',
                type: 'error'
              });
            }

            // 3초 후 토스트 자동 닫기
            setTimeout(() => {
              setNotifyToast({ show: false, message: '', type: 'success' });
            }, 3000);
          }
        } catch (err) {
          console.error('카카오 알림 발송 실패:', err);
          setNotifyToast({
            show: true,
            message: '알림 발송 중 오류가 발생했습니다',
            type: 'error'
          });
          setTimeout(() => {
            setNotifyToast({ show: false, message: '', type: 'success' });
          }, 3000);
        }
      }
    } catch (err) {
      console.error('주문 상태 업데이트 실패:', err);
    }
  };

  // ✅ 일괄 상태 변경
  const handleBulkStatusChange = async (orderIds: string[], newStatus: string) => {
    const updatePromises = orderIds.map(async (orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // 환불 처리 시 포인트 복원
      if (newStatus === '환불' && order.status !== '환불') {
        try {
          const clientPoint = pointsData.find(p => p.client_id === order.client_id);
          if (clientPoint) {
            const newBalance = clientPoint.point_balance + order.total_price;
            const { error: pointError } = await supabase
              .from('client_points')
              .update({ point_balance: newBalance, last_updated: new Date().toISOString() })
              .eq('client_id', order.client_id);
            if (!pointError) {
              await supabase.from('point_transactions').insert([{
                client_id: order.client_id,
                client_name: order.client_name,
                type: 'refund',
                amount: order.total_price,
                balance_after: newBalance,
                description: `주문 환불 (${order.order_number})`,
                order_id: order.order_number,
                created_at: new Date().toISOString()
              }]);
            }
          }
        } catch (err) {
          console.error('포인트 환불 처리 실패:', err);
        }
      }

      return supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    });

    try {
      await Promise.all(updatePromises);
      await refreshPoints();
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });

      // 카카오 알림톡 (활성화 상태일 때)
      if (kakaoNotifyEnabled) {
        for (const orderId of orderIds) {
          const order = orders.find(o => o.id === orderId);
          if (!order) continue;
          try {
            const { data: clientData } = await supabase
              .from('clients')
              .select('phone')
              .eq('id', order.client_id)
              .maybeSingle();
            if (clientData?.phone) {
              await notifyClientOrderStatus({
                clientPhone: clientData.phone,
                orderNumber: order.order_number,
                status: newStatus,
                productName: order.product_name,
              });
            }
          } catch { /* skip notification error */ }
        }
      }

      setNotifyToast({
        show: true,
        message: `${orderIds.length}건의 주문 상태가 ${newStatus}으로 변경되었습니다`,
        type: 'success'
      });
      setTimeout(() => setNotifyToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (err) {
      console.error('일괄 상태 변경 실패:', err);
      setNotifyToast({ show: true, message: '일괄 변경 중 오류가 발생했습니다', type: 'error' });
      setTimeout(() => setNotifyToast({ show: false, message: '', type: 'success' }), 3000);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (orderData: Partial<Order>) => {
    if (modalMode === 'create') {
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;
      const client = clients.find(c => c.id === orderData.client_id);
      
      const newOrder = {
        id: `order_${Date.now()}`,
        client_id: orderData.client_id || '',
        client_name: client?.name || orderData.client_name || '',
        order_number: orderNumber,
        product_name: orderData.product_name || '',
        quantity: orderData.quantity || 1,
        unit_price: orderData.unit_price || 0,
        total_price: orderData.total_price || 0,
        status: '주문확인',
        order_date: new Date().toISOString(),
        delivery_date: orderData.delivery_date || null,
        notes: orderData.notes || '',
        client_business_number: client?.business_number || '',
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('orders').insert([newOrder]);
        queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      } catch (err) {
        console.error('주문 저장 실패:', err);
      }
    } else if (modalMode === 'edit' && selectedOrder) {
      const oldStatus = selectedOrder.status;
      const newStatus = orderData.status || selectedOrder.status;

      // 환불 처리
      if (newStatus === '환불' && oldStatus !== '환불') {
        try {
          const clientPoint = pointsData.find(p => p.client_id === selectedOrder.client_id);
          if (clientPoint) {
            const newBalance = clientPoint.point_balance + selectedOrder.total_price;

            const { error: pointError } = await supabase
              .from('client_points')
              .update({
                point_balance: newBalance,
                last_updated: new Date().toISOString()
              })
              .eq('client_id', selectedOrder.client_id);

            if (!pointError) {
              await supabase.from('point_transactions').insert([{
                client_id: selectedOrder.client_id,
                client_name: selectedOrder.client_name,
                type: 'refund',
                amount: selectedOrder.total_price,
                balance_after: newBalance,
                description: `주문 환불 (${selectedOrder.order_number})`,
                order_id: selectedOrder.order_number,
                created_at: new Date().toISOString()
              }]);

              await refreshPoints();
            }
          }
        } catch (err) {
          console.error('포인트 환불 처리 실패:', err);
        }
      }

      try {
        await supabase
          .from('orders')
          .update({
            product_name: orderData.product_name,
            quantity: orderData.quantity,
            unit_price: orderData.unit_price,
            total_price: orderData.total_price,
            status: orderData.status,
            delivery_date: orderData.delivery_date,
            notes: orderData.notes
          })
          .eq('id', selectedOrder.id);
        
        queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      } catch (err) {
        console.error('주문 업데이트 실패:', err);
      }
    }
    setIsModalOpen(false);
  };

  // 엑셀 다운로드
  const handleExcelDownload = (exportOrders?: typeof filteredOrders) => {
    const targetOrders = exportOrders || filteredOrders;
    // notes JSON 파싱하여 각 아이템을 개별 행으로 펼치기
    const expandedData: any[] = [];
    
    targetOrders.forEach((order) => {
      let orderItems: any[] = [];
      
      // notes에서 아이템 배열 파싱
      try {
        const parsed = JSON.parse(order.notes || '[]');
        if (parsed && parsed.items && Array.isArray(parsed.items)) {
          orderItems = parsed.items;
        } else if (Array.isArray(parsed)) {
          orderItems = parsed;
        }
      } catch {
        orderItems = [];
      }

      if (orderItems.length === 0) {
        expandedData.push({
          '주문번호': order.order_number,
          '거래처': order.client_name,
          '제품명': order.product_name,
          '품목코드': '-',
          '규격': '-',
          '수량': order.quantity,
          '단가': order.unit_price,
          '금액': order.total_price,
          '상태': order.status,
          '주문일': new Date(order.order_date).toLocaleDateString('ko-KR'),
          '배송예정일': order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ko-KR') : '-'
        });
      } else {
        orderItems.forEach((item: any, idx: number) => {
          expandedData.push({
            '주문번호': idx === 0 ? order.order_number : '',
            '거래처': idx === 0 ? order.client_name : '',
            '제품명': item.productName || item.product_name || '-',
            '품목코드': item.selectedOptionModelCode || item.model_code || item.productCode || '-',
            '규격': item.sizeInfo || item.size_info || '-',
            '수량': item.quantity || 0,
            '단가': item.unitPrice || item.unit_price || 0,
            '금액': item.totalPrice || item.total_price || 0,
            '상태': idx === 0 ? order.status : '',
            '주문일': idx === 0 ? new Date(order.order_date).toLocaleDateString('ko-KR') : '',
            '배송예정일': idx === 0 && order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ko-KR') : ''
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(expandedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문내역');

    ws['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 20 },
      { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];

    const clientSuffix = exportClientId ? `_${clients.find(c => c.id === exportClientId)?.name || ''}` : '';
    const dateSuffix = exportDateRange.start ? `_${exportDateRange.start}~${exportDateRange.end || ''}` : '';
    const fileName = `주문내역${clientSuffix}${dateSuffix}_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 엑셀 내보내기 모달에서 필터링된 주문 반환
  const getExportOrders = () => {
    return orders.filter((order) => {
      const matchesClient = !exportClientId || order.client_id === exportClientId;
      let matchesDate = true;
      if (exportDateRange.start || exportDateRange.end) {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        if (exportDateRange.start && orderDate < exportDateRange.start) matchesDate = false;
        if (exportDateRange.end && orderDate > exportDateRange.end) matchesDate = false;
      }
      return matchesClient && matchesDate;
    });
  };

  // PDF 다운로드
  const handlePdfDownload = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('주문 관리 내역', 14, 15);
    doc.setFontSize(10);
    doc.text(`출력일: ${new Date().toLocaleDateString('ko-KR')}`, 14, 22);

    // notes JSON 파싱하여 각 아이템을 개별 행으로 펼치기
    const tableData: any[] = [];
    
    filteredOrders.forEach((order) => {
      let orderItems: any[] = [];
      
      try {
        const parsed = JSON.parse(order.notes || '[]');
        orderItems = Array.isArray(parsed) ? parsed : [];
      } catch {
        orderItems = [{
          productName: order.product_name,
          quantity: order.quantity,
          unitPrice: order.unit_price,
          totalPrice: order.total_price
        }];
      }

      if (orderItems.length === 0) {
        tableData.push([
          order.order_number,
          order.client_name,
          order.product_name,
          '-',
          '-',
          order.quantity.toString(),
          order.total_price.toLocaleString() + '원',
          order.status,
          new Date(order.order_date).toLocaleDateString('ko-KR'),
          order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ko-KR') : '-'
        ]);
      } else {
        orderItems.forEach((item: any, idx: number) => {
          tableData.push([
            idx === 0 ? order.order_number : '',
            idx === 0 ? order.client_name : '',
            item.productName || item.product_name || '-',
            item.model_code || item.productCode || '-',
            item.size_info || '-',
            (item.quantity || 0).toString(),
            ((item.totalPrice || item.total_price || 0).toLocaleString()) + '원',
            idx === 0 ? order.status : '',
            idx === 0 ? new Date(order.order_date).toLocaleDateString('ko-KR') : '',
            idx === 0 && order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ko-KR') : ''
          ]);
        });
      }
    });

    autoTable(doc, {
      startY: 28,
      head: [['주문번호', '거래처', '제품명', '품목코드', '규격', '수량', '금액', '상태', '주문일', '배송예정']],
      body: tableData,
      styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [43, 95, 158], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22 },  // 주문번호
        1: { cellWidth: 25 },  // 거래처
        2: { cellWidth: 45 },  // 제품명
        3: { cellWidth: 25 },  // 품목코드
        4: { cellWidth: 28 },  // 규격
        5: { cellWidth: 12 },  // 수량
        6: { cellWidth: 22 },  // 금액
        7: { cellWidth: 18 },  // 상태
        8: { cellWidth: 22 },  // 주문일
        9: { cellWidth: 22 }   // 배송예정
      },
      margin: { left: 14, right: 14 }
    });

    const fileName = `주문내역_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <AdminHeader />
      <ChargeRequestNotify />
      <OrderNotify />

      {/* 기간별 명세서 모달 */}
      {showPeriodStatement && (
        <PeriodStatementModal
          clients={clients}
          onClose={() => setShowPeriodStatement(false)}
        />
      )}

      {/* 알림 발송 토스트 */}
      {notifyToast.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            notifyToast.type === 'success' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <i className={`${
              notifyToast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'
            } text-xl`}></i>
            <span className="text-sm font-medium">{notifyToast.message}</span>
            <button
              onClick={() => setNotifyToast({ show: false, message: '', type: 'success' })}
              className="ml-2 hover:bg-white/20 rounded p-1 cursor-pointer"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <BackButton />
        {/* 헤더 — 모바일 최적화 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            {/* 뒤로가기/홈 버튼 */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              title="홈으로"
            >
              <i className="ri-home-4-line text-base"></i>
              <span className="hidden sm:inline">홈</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">주문 관리</h1>
              <p className="text-sm text-gray-500 mt-1">거래처별 주문 내역을 관리합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {/* 기간별 명세서 버튼 */}
            <button
              onClick={() => setShowPeriodStatement(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-xs md:text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-chart-line text-base"></i>
              <span className="hidden sm:inline">기간별 명세서</span>
              <span className="sm:hidden">명세서</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-xs md:text-sm hover:bg-emerald-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-excel-2-line text-base"></i>
              <span className="hidden sm:inline">엑셀 내보내기</span>
              <span className="sm:hidden">엑셀</span>
            </button>
            <button
              onClick={handlePdfDownload}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg font-medium text-xs md:text-sm hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-pdf-line text-base"></i>
              <span className="hidden sm:inline">PDF 다운로드</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border transition-colors whitespace-nowrap cursor-pointer ${showDashboard ? 'bg-blue-50 text-[#2B5F9E] border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <i className="ri-bar-chart-2-line text-base"></i>
              통계 대시보드
            </button>
            <button
              onClick={handleCreateOrder}
              className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-[#2B5F9E] text-white rounded-lg font-medium text-xs md:text-sm hover:bg-[#234b7d] transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line text-base"></i>
              <span className="hidden sm:inline">새 주문 등록</span>
              <span className="sm:hidden">주문 등록</span>
            </button>
          </div>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-full md:w-auto md:inline-flex">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex-1 md:flex-none justify-center ${
              activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="ri-list-check-2 text-base"></i>
            일반 주문
          </button>
          <button
            onClick={() => setActiveTab('photo_orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex-1 md:flex-none justify-center relative ${
              activeTab === 'photo_orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="ri-camera-line text-base"></i>
            간편주문(사진)
            {photoOrderCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {photoOrderCount > 99 ? '99+' : photoOrderCount}
              </span>
            )}
          </button>
        </div>

        {/* 로딩 중 — KPI 스켈레톤 먼저 표시 */}
        {activeTab === 'orders' && isLoading ? (
          <div className="space-y-6">
            {/* KPI 스켈레톤 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-5">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
            
            {/* 로딩 메시지 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 md:p-12 text-center">
              <div className="w-12 h-12 border-4 border-[#2B5F9E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm md:text-base text-gray-500">주문 데이터를 불러오는 중...</p>
              <p className="text-xs text-gray-400 mt-2">잠시만 기다려주세요</p>
            </div>
          </div>
        ) : activeTab === 'orders' ? (
          <>
            {/* 포인트 잔액 부족 거래처 위젯 */}
            <div className="mb-6">
              <LowBalanceWidget />
            </div>

            {showDashboard && <OrderDashboard orders={orders} />}
            
            {/* KPI 요약 카드 — 필터링된 데이터 기준 */}
            <OrderStats {...stats} />
            
            <OrderFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              clientFilter={clientFilter}
              onClientChange={setClientFilter}
              clients={clients}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              kakaoNotifyEnabled={kakaoNotifyEnabled}
              onKakaoNotifyToggle={setKakaoNotifyEnabled}
              onSearch={() => queryClient.invalidateQueries({ queryKey: ['admin_orders'] })}
            />

            {/* 거래처 포인트 잔액 위젯 — 특정 거래처 선택 시 표시 */}
            {clientFilter && (() => {
              const selClient = clients.find(c => c.id === clientFilter);
              const selPoint = pointsData.find((p: any) => p.client_id === clientFilter);
              if (!selClient) return null;
              const bal = selPoint?.point_balance ?? null;
              const isEmpty = bal !== null && bal === 0;
              const isLow = bal !== null && bal > 0 && bal < 500000;
              const isGood = bal !== null && bal >= 500000;
              return (
                <div className={`mb-4 rounded-xl px-4 py-3 border flex items-center justify-between gap-4 ${
                  isEmpty ? 'bg-red-50 border-red-200'
                  : isLow ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isEmpty ? 'bg-red-100' : isLow ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                      <i className={`ri-coin-line text-base ${isEmpty ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">
                        <span className="font-semibold text-gray-700">{selClient.name}</span> 포인트 잔액
                      </p>
                      {bal === null ? (
                        <p className="text-sm font-bold text-gray-400">조회 중...</p>
                      ) : (
                        <p className={`text-lg font-extrabold ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                          ₩{bal.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEmpty && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">잔액없음</span>
                    )}
                    {isLow && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">잔액부족</span>
                    )}
                    {isGood && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">정상</span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {filteredOrders.length}건 필터됨
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 주문 목록 (모바일/데스크톱 통합) */}
            <OrderTable
              orders={filteredOrders}
              onStatusChange={handleStatusChange}
              onViewDetail={handleViewDetail}
              onEditOrder={handleEditOrder}
              onBulkStatusChange={handleBulkStatusChange}
            />
          </>
        ) : (
          /* ── 간편주문(사진주문) 탭 ── */
          <PhotoOrderTab clients={clients} />
        )}
      </main>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOrder}
        order={selectedOrder}
        clients={clients}
        mode={modalMode}
      />

      {/* ── 엑셀 내보내기 모달 ── */}
      {showExportModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowExportModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-file-excel-2-line text-emerald-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">엑셀 내보내기</h3>
                  <p className="text-xs text-gray-500">날짜/거래처별 필터 후 다운로드</p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* 날짜 범위 */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">날짜 범위</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">시작일</p>
                  <input
                    type="date"
                    value={exportDateRange.start}
                    onChange={(e) => setExportDateRange(p => ({ ...p, start: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">종료일</p>
                  <input
                    type="date"
                    value={exportDateRange.end}
                    onChange={(e) => setExportDateRange(p => ({ ...p, end: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 거래처 선택 */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-2">거래처</label>
              <select
                value={exportClientId}
                onChange={(e) => setExportClientId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-400 cursor-pointer bg-white"
              >
                <option value="">전체 거래처</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 예상 건수 */}
            <div className="bg-gray-50 rounded-xl p-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">내보낼 주문</span>
                <span className="text-base font-bold text-gray-900">
                  {getExportOrders().length}건
                </span>
              </div>
              {exportClientId && (
                <p className="text-[11px] text-gray-400 mt-1">
                  거래처: {clients.find(c => c.id === exportClientId)?.name}
                </p>
              )}
              {(exportDateRange.start || exportDateRange.end) && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  기간: {exportDateRange.start || '처음'} ~ {exportDateRange.end || '현재'}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setExportDateRange({ start: '', end: '' });
                  setExportClientId('');
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                초기화
              </button>
              <button
                onClick={() => {
                  handleExcelDownload(getExportOrders());
                  setShowExportModal(false);
                }}
                disabled={getExportOrders().length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-download-2-line text-base"></i>
                {getExportOrders().length}건 다운로드
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}