import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePoints } from '../../hooks/usePoints';
import { getSetting } from '../../utils/settings';

interface LowBalanceClient {
  id: string;
  client_name: string;
  business_number: string;
  point_balance: number;
}

// 최초 1회 팝업 표시 여부를 세션 단위로 관리 (새로고침 시 초기화)
const SESSION_KEY = 'low_balance_popup_shown';

export default function LowBalanceNotify() {
  const [lowBalanceClients, setLowBalanceClients] = useState<LowBalanceClient[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // 현재 팝업이 "특정 치과 접속" 때문에 뜬 건지 여부
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
  const { pointsData } = usePoints();
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef<string>('');

  // 포인트 부족 거래처 목록 갱신
  useEffect(() => {
    let cancelled = false;
    getSetting<number>('point_balance_threshold').then((saved) => {
      if (cancelled) return;
      const threshold = saved ?? 100000;
      const lowClients = pointsData.filter(client => client.point_balance <= threshold);
      setLowBalanceClients(lowClients);
    });
    return () => { cancelled = true; };
  }, [pointsData]);

  // 최초 1회 팝업 (세션 기준)
  useEffect(() => {
    if (lowBalanceClients.length === 0) return;
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (!alreadyShown) {
      setTargetClientId(null);
      setIsVisible(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  }, [lowBalanceClients]);

  // 특정 치과 상세 페이지 접속 시 팝업
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === prevPathRef.current) return;
    prevPathRef.current = currentPath;

    // /admin/clients/:id 패턴 감지
    const match = currentPath.match(/^\/admin\/clients\/([^/]+)$/);
    if (!match) return;

    const clientId = match[1];
    const isLowBalance = lowBalanceClients.some(c => c.id === clientId);
    if (isLowBalance) {
      setTargetClientId(clientId);
      setIsExpanded(false);
      setIsVisible(true);
    }
  }, [location.pathname, lowBalanceClients]);

  if (!isVisible || lowBalanceClients.length === 0) return null;

  const handleClose = () => setIsVisible(false);

  const handleNavigateToClient = (clientId: string) => {
    navigate(`/admin/points?tab=clients&highlight=${clientId}`);
    setIsVisible(false);
  };

  const handleNavigateAll = () => {
    navigate('/admin/points?tab=clients');
    setIsVisible(false);
  };

  // 특정 치과 접속 팝업일 경우 해당 치과만 표시
  const displayClients = targetClientId
    ? lowBalanceClients.filter(c => c.id === targetClientId)
    : lowBalanceClients;

  const title = targetClientId
    ? '⚠️ 이 거래처 포인트 잔액 부족'
    : '⚠️ 포인트 잔액 부족 경고';

  const subtitle = targetClientId
    ? '현재 접속한 거래처의 포인트 잔액이 임계값 이하입니다'
    : `${lowBalanceClients.length}개 거래처의 포인트 잔액이 임계값 이하입니다`;

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-amber-500 p-5 w-96 max-w-[calc(100vw-3rem)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-alarm-warning-line text-white text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-700 mb-2">{subtitle}</p>

            <div className="space-y-2 mb-3">
              {displayClients.slice(0, isExpanded ? undefined : 3).map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleNavigateToClient(client.id)}
                  className="w-full bg-amber-50 rounded-md p-2 border border-amber-200 hover:bg-amber-100 hover:border-amber-400 transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-amber-700">
                        {client.client_name}
                      </p>
                      <p className="text-xs text-gray-500">{client.business_number}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <p className="text-sm font-bold text-amber-600">
                        {client.point_balance.toLocaleString()}원
                      </p>
                      <i className="ri-arrow-right-s-line text-amber-400 group-hover:text-amber-600 text-base"></i>
                    </div>
                  </div>
                </button>
              ))}

              {displayClients.length > 3 && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full text-xs text-amber-600 hover:text-amber-700 font-medium py-1 cursor-pointer whitespace-nowrap"
                >
                  +{displayClients.length - 3}개 더보기
                </button>
              )}
            </div>

            {!targetClientId && (
              <button
                onClick={handleNavigateAll}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                포인트 관리에서 전체 확인
              </button>
            )}

            {targetClientId && (
              <button
                onClick={() => {
                  navigate(`/admin/clients/${targetClientId}`);
                  setIsVisible(false);
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                충전 요청 생성하기
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
