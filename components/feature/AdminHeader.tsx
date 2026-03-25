import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LowBalanceNotify from './LowBalanceNotify';

interface Notification {
  id: string;
  type: 'order' | 'charge' | 'message';
  title: string;
  content: string;
  timestamp: string;
  link: string;
  read: boolean;
}

export default function AdminHeader() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'order' | 'charge' | 'message'>('all');
  const [newOrderBadge, setNewOrderBadge] = useState(0);
  const [pendingChargeBadge, setPendingChargeBadge] = useState(0);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // 신규 주문 뱃지 카운트 (localStorage 기준)
  useEffect(() => {
    const fetchNewOrderBadge = async () => {
      const lastSeen = localStorage.getItem('orders_last_seen');
      if (!lastSeen) {
        setNewOrderBadge(0);
        return;
      }
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastSeen);
      if (!error) setNewOrderBadge(count || 0);
    };

    fetchNewOrderBadge();

    // 실시간 신규 주문 구독
    const ordersChannel = supabase
      .channel('admin-header-orders-badge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchNewOrderBadge();
        }
      )
      .subscribe();

    // 주문 관리 페이지 진입 시 뱃지 초기화
    const handleBadgeReset = () => {
      setNewOrderBadge(0);
    };
    window.addEventListener('orders-badge-reset', handleBadgeReset);

    return () => {
      supabase.removeChannel(ordersChannel);
      window.removeEventListener('orders-badge-reset', handleBadgeReset);
    };
  }, []);

  // 미처리 충전 요청 뱃지 카운트
  useEffect(() => {
    const fetchPendingChargeBadge = async () => {
      const { count, error } = await supabase
        .from('charge_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (!error) setPendingChargeBadge(count || 0);
    };

    fetchPendingChargeBadge();

    // 실시간 충전 요청 구독
    const chargeChannel = supabase
      .channel('admin-header-charge-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'charge_requests',
        },
        () => {
          fetchPendingChargeBadge();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chargeChannel);
    };
  }, []);

  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem('admin_notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }

    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('admin-orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const order = payload.new;
          
          // Fetch client name
          let clientName = order.client_business_number || '거래처';
          try {
            const { data: client } = await supabase
              .from('clients')
              .select('name')
              .eq('business_number', order.client_business_number)
              .maybeSingle();
            
            if (client) {
              clientName = client.name;
            }
          } catch (error) {
            console.error('Error fetching client name:', error);
          }

          const newNotification: Notification = {
            id: `order-${order.id}`,
            type: 'order',
            title: '신규 주문',
            content: `${clientName}에서 ${order.total_amount?.toLocaleString()}원 주문`,
            timestamp: new Date().toISOString(),
            link: '/admin/orders',
            read: false,
          };

          setNotifications((prev) => {
            const updated = [newNotification, ...prev].slice(0, 50);
            localStorage.setItem('admin_notifications', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    // Subscribe to charge requests
    const chargeChannel = supabase
      .channel('admin-charge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'charge_requests',
        },
        async (payload) => {
          const request = payload.new;
          
          // Fetch client name
          let clientName = '거래처';
          try {
            const { data: client } = await supabase
              .from('clients')
              .select('name')
              .eq('id', request.client_id)
              .maybeSingle();
            
            if (client) {
              clientName = client.name;
            }
          } catch (error) {
            console.error('Error fetching client name:', error);
          }

          const newNotification: Notification = {
            id: `charge-${request.id}`,
            type: 'charge',
            title: '충전 요청',
            content: `${clientName}에서 ${request.amount?.toLocaleString()}원 충전 요청`,
            timestamp: new Date().toISOString(),
            link: '/admin/points',
            read: false,
          };

          setNotifications((prev) => {
            const updated = [newNotification, ...prev].slice(0, 50);
            localStorage.setItem('admin_notifications', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    // Subscribe to messages from dental clinics
    const messagesChannel = supabase
      .channel('admin-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const message = payload.new;
          
          // Only show notifications for messages from dental clinics
          if (message.sender_role !== 'dental') return;

          // Fetch client name from room_id (business_number)
          let clientName = '거래처';
          try {
            const { data: client } = await supabase
              .from('clients')
              .select('name')
              .eq('business_number', message.room_id)
              .maybeSingle();
            
            if (client) {
              clientName = client.name;
            }
          } catch (error) {
            console.error('Error fetching client name:', error);
          }

          const newNotification: Notification = {
            id: `message-${message.id}`,
            type: 'message',
            title: '새 메시지',
            content: `${clientName}: ${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`,
            timestamp: new Date().toISOString(),
            link: '/admin/chat',
            read: false,
          };

          setNotifications((prev) => {
            const updated = [newNotification, ...prev].slice(0, 50);
            localStorage.setItem('admin_notifications', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      ordersChannel.unsubscribe();
      chargeChannel.unsubscribe();
      messagesChannel.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
    
    // 주문 알림 클릭 시 뱃지 초기화
    if (notification.type === 'order') {
      localStorage.setItem('orders_last_seen', new Date().toISOString());
      setNewOrderBadge(0);
      window.dispatchEvent(new Event('orders-badge-reset'));
    }
    
    navigate(notification.link);
  };

  const handleOrderBadgeClick = () => {
    localStorage.setItem('orders_last_seen', new Date().toISOString());
    setNewOrderBadge(0);
    window.dispatchEvent(new Event('orders-badge-reset'));
    navigate('/admin/orders');
  };

  const handleChargeBadgeClick = () => {
    navigate('/admin/points');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'ri-shopping-cart-line';
      case 'charge':
        return 'ri-wallet-line';
      case 'message':
        return 'ri-message-3-line';
      default:
        return 'ri-notification-line';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const totalBadgeCount = newOrderBadge + pendingChargeBadge;

  const quickMenuItems = [
    { path: '/admin/dashboard', icon: 'ri-dashboard-line', label: '대시보드', badge: 0 },
    { path: '/admin/orders', icon: 'ri-file-list-3-line', label: '주문 관리', badge: newOrderBadge },
    { path: '/admin/clients', icon: 'ri-building-line', label: '거래처 관리', badge: 0 },
    { path: '/admin/client-orders', icon: 'ri-bar-chart-box-line', label: '거래처별 주문', badge: 0 },
    { path: '/admin/points', icon: 'ri-coin-line', label: '포인트 관리', badge: pendingChargeBadge },
    { path: '/admin/products', icon: 'ri-box-3-line', label: '제품 관리', badge: 0 },
    { path: '/admin/price-tiers', icon: 'ri-price-tag-3-line', label: '단가표 관리', badge: 0 },
    { path: '/admin/chat', icon: 'ri-message-3-line', label: '채팅 관리', badge: 0 },
    { path: '/admin/consultations', icon: 'ri-robot-2-line', label: '상담 이력', badge: 0 },
    { path: '/admin/image-classifier', icon: 'ri-image-line', label: '이미지 분류', badge: 0 },
    { path: '/admin/image-validator', icon: 'ri-shield-check-line', label: '이미지 검증', badge: 0 },
    { path: '/admin/notices', icon: 'ri-notification-line', label: '공지사항 관리', badge: 0 },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <LowBalanceNotify />
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/admin/orders" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <i className="ri-admin-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">관리자 모드</h1>
              <p className="text-xs text-gray-500">(주)하이니스중부지사</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Quick Menu Button (Desktop) */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-apps-line text-xl"></i>
                <span className="text-sm font-medium">관리 메뉴</span>
              </button>

              {showQuickMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowQuickMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">관리자 메뉴</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {quickMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setShowQuickMenu(false)}
                          className="relative flex flex-col items-center p-3 rounded-lg hover:bg-teal-50 transition-colors group cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-teal-100 transition-colors">
                            <i className={`${item.icon} text-xl text-gray-600 group-hover:text-teal-600`}></i>
                          </div>
                          <span className="text-xs text-center text-gray-700 group-hover:text-teal-700 font-medium whitespace-nowrap">
                            {item.label}
                          </span>
                          {item.badge > 0 && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Badge Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              {newOrderBadge > 0 && (
                <button
                  onClick={handleOrderBadgeClick}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-shopping-cart-line text-lg"></i>
                  <span className="text-sm font-semibold">신규 주문 {newOrderBadge}</span>
                </button>
              )}
              {pendingChargeBadge > 0 && (
                <button
                  onClick={handleChargeBadgeClick}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-wallet-line text-lg"></i>
                  <span className="text-sm font-semibold">충전 요청 {pendingChargeBadge}</span>
                </button>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-notification-3-line text-2xl"></i>
                {(unreadCount > 0 || totalBadgeCount > 0) && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {(unreadCount + totalBadgeCount) > 99 ? '99+' : (unreadCount + totalBadgeCount)}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">알림</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer whitespace-nowrap"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>

                      {/* Quick Action Badges */}
                      {(newOrderBadge > 0 || pendingChargeBadge > 0) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {newOrderBadge > 0 && (
                            <button
                              onClick={handleOrderBadgeClick}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium"
                            >
                              <i className="ri-shopping-cart-line"></i>
                              <span>신규 주문 {newOrderBadge}</span>
                            </button>
                          )}
                          {pendingChargeBadge > 0 && (
                            <button
                              onClick={handleChargeBadgeClick}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium"
                            >
                              <i className="ri-wallet-line"></i>
                              <span>충전 요청 {pendingChargeBadge}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Tabs */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setActiveTab('all')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                            activeTab === 'all'
                              ? 'bg-teal-100 text-teal-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          전체
                        </button>
                        <button
                          onClick={() => setActiveTab('order')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                            activeTab === 'order'
                              ? 'bg-teal-100 text-teal-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          주문
                        </button>
                        <button
                          onClick={() => setActiveTab('charge')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                            activeTab === 'charge'
                              ? 'bg-teal-100 text-teal-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          충전
                        </button>
                        <button
                          onClick={() => setActiveTab('message')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                            activeTab === 'message'
                              ? 'bg-teal-100 text-teal-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          메시지
                        </button>
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                      {filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <i className="ri-notification-off-line text-4xl mb-2"></i>
                          <p className="text-sm">알림이 없습니다</p>
                        </div>
                      ) : (
                        filteredNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left cursor-pointer ${
                              !notification.read ? 'bg-teal-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notification.type === 'order'
                                    ? 'bg-blue-100 text-blue-600'
                                    : notification.type === 'charge'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-purple-100 text-purple-600'
                                }`}
                              >
                                <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{notification.content}</p>
                                <p className="text-xs text-gray-400">
                                  {getTimeAgo(notification.timestamp)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-logout-box-line mr-2"></i>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}