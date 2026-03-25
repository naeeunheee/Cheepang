import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminHeader from '../../../components/feature/AdminHeader';
import PointStats from './components/PointStats';
import ClientPointTable from './components/ClientPointTable';
import PointHistoryPanel from './components/PointHistoryPanel';
import ChargeHistoryPanel from './components/ChargeHistoryPanel';
import ChargeRequestNotify from '../../../components/feature/ChargeRequestNotify';
import PackageSettingsPanel from './components/PackageSettingsPanel';
import BackButton from '../../../components/feature/BackButton';

export default function AdminPointsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'history' | 'settings'>('overview');
  const [searchParams] = useSearchParams();
  const [highlightClientId, setHighlightClientId] = useState<string | null>(null);

  // URL 파라미터로 탭 및 하이라이트 처리
  useEffect(() => {
    const tab = searchParams.get('tab');
    const highlight = searchParams.get('highlight');
    if (tab === 'clients') {
      setActiveTab('clients');
    }
    if (highlight) {
      setHighlightClientId(highlight);
    }
  }, [searchParams]);

  type ActiveTab = 'overview' | 'clients' | 'history' | 'settings';
  const tabs: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'overview', label: '전체 현황', icon: 'ri-dashboard-line' },
    { key: 'clients', label: '거래처별 잔액', icon: 'ri-building-line' },
    { key: 'history', label: '거래 내역', icon: 'ri-history-line' },
    { key: 'settings', label: '설정', icon: 'ri-settings-3-line' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminHeader />
      <ChargeRequestNotify />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 lg:pb-8">
        <BackButton />
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-coin-line text-xl md:text-2xl text-white"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">잔액 관리</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">거래처별 잔액 조회 및 미수금/선결제 현황을 관리합니다</p>
          </div>
        </div>

        <PointStats />

        {/* 탭 — 모바일에서 가로 스크롤 */}
        <div className="overflow-x-auto mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-max min-w-full md:w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key ? 'bg-[#2B5F9E] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className={`${tab.icon} w-4 h-4 flex items-center justify-center`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="ri-building-line text-[#2B5F9E]"></i>
                거래처별 잔액 현황 (미리보기)
              </h2>
              <ClientPointTable highlightClientId={highlightClientId} onHighlightClear={() => setHighlightClientId(null)} />
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                거래처별 잔액 현황
              </h2>
            </div>
            <ClientPointTable highlightClientId={highlightClientId} onHighlightClear={() => setHighlightClientId(null)} />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                전체 거래 내역
              </h2>
            </div>
            <PointHistoryPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                잔액 관리 설정
              </h2>
            </div>
            <PackageSettingsPanel />
          </div>
        )}
      </main>
    </div>
  );
}
