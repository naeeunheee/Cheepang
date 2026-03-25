import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingChargeCount, setPendingChargeCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);

  const { isAdmin: sessionIsAdmin } = useAuth();

  // 미읽음 메시지 카운트
  useEffect(() => {
    if (!sessionIsAdmin) return;
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('sender_role', 'client');
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('admin-messages-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionIsAdmin]);

  // 대기 충전 요청 카운트
  useEffect(() => {
    if (!sessionIsAdmin) return;
    const fetchPendingChargeCount = async () => {
      const { count } = await supabase
        .from('charge_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingChargeCount(count || 0);
    };

    fetchPendingChargeCount();

    const channel = supabase
      .channel('admin-charge-requests-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charge_requests' }, () => {
        fetchPendingChargeCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionIsAdmin]);

  // 신규 주문 카운트 (마지막 확인 이후 INSERT된 주문)
  useEffect(() => {
    if (!sessionIsAdmin) return;

    const fetchNewOrderCount = async () => {
      const lastSeen = localStorage.getItem('orders_last_seen');
      if (!lastSeen) {
        setNewOrderCount(0);
        return;
      }
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastSeen);
      if (!error) setNewOrderCount(count || 0);
    };

    fetchNewOrderCount();

    // 실시간 신규 주문 구독
    const channel = supabase
      .channel('admin-bottom-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        fetchNewOrderCount();
      })
      .subscribe();

    // 주문 관리 페이지 진입 시 뱃지 초기화
    const handleBadgeReset = () => {
      setNewOrderCount(0);
    };
    window.addEventListener('orders-badge-reset', handleBadgeReset);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('orders-badge-reset', handleBadgeReset);
    };
  }, [sessionIsAdmin]);

  if (!sessionIsAdmin && !location.pathname.startsWith('/admin')) {
    return null;
  }

  const tabs = [
    {
      path: '/admin/dashboard',
      icon: 'ri-dashboard-line',
      label: '대시보드',
      badge: null,
    },
    {
      path: '/admin/orders',
      icon: 'ri-file-list-3-line',
      label: '주문',
      badge: newOrderCount > 0 ? newOrderCount : null,
    },
    {
      path: '/admin/clients',
      icon: 'ri-building-line',
      label: '거래처',
      badge: null,
    },
    {
      path: '/admin/client-orders',
      icon: 'ri-bar-chart-box-line',
      label: '통계',
      badge: null,
    },
    {
      path: '/admin/points',
      icon: 'ri-coin-line',
      label: '잔액',
      badge: pendingChargeCount > 0 ? pendingChargeCount : null,
    },
    {
      path: '/admin/products',
      icon: 'ri-box-3-line',
      label: '제품',
      badge: null,
    },
    {
      path: '/admin/notices',
      icon: 'ri-notification-line',
      label: '공지',
      badge: null,
    },
    {
      path: '/admin/price-tiers',
      icon: 'ri-price-tag-3-line',
      label: '단가표',
      badge: null,
    },
  ];

  const isHomePage = location.pathname === '/';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      {isHomePage && sessionIsAdmin ? (
        <div className="flex items-center justify-around h-16 px-1">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex flex-col items-center justify-center flex-1 h-full text-amber-600 cursor-pointer"
          >
            <div className="relative">
              <i className="ri-shield-check-line text-xl"></i>
              {newOrderCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {newOrderCount > 9 ? '9+' : newOrderCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-semibold whitespace-nowrap">관리자</span>
          </button>
          {[tabs[0], tabs[1], tabs[3], tabs[4], tabs[6]].map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors text-gray-400 hover:text-amber-600 cursor-pointer"
            >
              <div className="relative">
                <i className={`${tab.icon} text-xl`}></i>
                {tab.badge !== null && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 whitespace-nowrap">{tab.label}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors cursor-pointer ${
                  isActive ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="relative">
                  <i className={`${tab.icon} text-lg`}></i>
                  {tab.badge !== null && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] mt-0.5 whitespace-nowrap ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-teal-600 rounded-full"></span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}