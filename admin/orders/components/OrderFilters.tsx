import { useState, useRef, useEffect } from 'react';

interface Client {
  id: string;
  name: string;
  business_number?: string;
}

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  clientFilter: string;
  onClientChange: (value: string) => void;
  clients: Client[];
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  kakaoNotifyEnabled: boolean;
  onKakaoNotifyToggle: (enabled: boolean) => void;
  onSearch?: () => void;
}

export default function OrderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  clientFilter,
  onClientChange,
  clients,
  dateRange,
  onDateRangeChange,
  kakaoNotifyEnabled,
  onKakaoNotifyToggle,
  onSearch,
}: OrderFiltersProps) {
  const statuses = ['전체', '주문확인', '준비중', '배송중', '배송완료', '교환', '반품', '환불'];
  const [clientSearch, setClientSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find(c => c.id === clientFilter);

  const filteredClients = clients.filter(c =>
    clientSearch === '' ||
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.business_number || '').includes(clientSearch)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClient = (clientId: string) => {
    onClientChange(clientId);
    setClientSearch('');
    setDropdownOpen(false);
  };

  const handleClearClient = () => {
    onClientChange('');
    setClientSearch('');
    setDropdownOpen(false);
  };

  // 날짜 프리셋 함수
  const applyDatePreset = (preset: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        start = weekStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        start = monthStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      }
      case 'lastMonth': {
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        start = lastMonthStart.toISOString().split('T')[0];
        end = lastMonthEnd.toISOString().split('T')[0];
        break;
      }
      case 'all':
        start = '';
        end = '';
        break;
    }

    onDateRangeChange({ start, end });
  };

  const hasDateFilter = dateRange.start || dateRange.end;

  const getDateRangeLabel = () => {
    if (!hasDateFilter) return '';
    if (dateRange.start && dateRange.end) {
      if (dateRange.start === dateRange.end) {
        return new Date(dateRange.start).toLocaleDateString('ko-KR');
      }
      return `${new Date(dateRange.start).toLocaleDateString('ko-KR')} ~ ${new Date(dateRange.end).toLocaleDateString('ko-KR')}`;
    }
    if (dateRange.start) return `${new Date(dateRange.start).toLocaleDateString('ko-KR')} ~`;
    if (dateRange.end) return `~ ${new Date(dateRange.end).toLocaleDateString('ko-KR')}`;
    return '';
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 mb-6 space-y-4">
      {/* 카카오 알림톡 토글 */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <i className="ri-message-3-line text-[#2B5F9E] text-lg"></i>
          <div>
            <p className="text-sm font-semibold text-gray-800">카카오 알림톡 자동 발송</p>
            <p className="text-xs text-gray-500">주문 상태 변경 시 거래처에 자동으로 알림을 발송합니다</p>
          </div>
        </div>
        <button
          onClick={() => onKakaoNotifyToggle(!kakaoNotifyEnabled)}
          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
            kakaoNotifyEnabled ? 'bg-[#2B5F9E]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
              kakaoNotifyEnabled ? 'translate-x-7' : 'translate-x-0'
            }`}
          ></span>
        </button>
      </div>

      {/* 1행: 주문번호/제품명 검색 + 거래처 검색 */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* 주문번호/제품명 검색 */}
        <div className="flex-1">
          <div className="relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="주문번호, 제품명으로 검색..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <i className="ri-close-line text-gray-400 text-sm"></i>
              </button>
            )}
          </div>
        </div>

        {/* 거래처 검색 드롭다운 */}
        <div className="w-full lg:w-72 relative" ref={dropdownRef}>
          <div
            className={`flex items-center gap-2 px-3 py-3 border rounded-lg cursor-pointer transition-all ${
              dropdownOpen ? 'border-[#2B5F9E] ring-1 ring-[#2B5F9E]' : 'border-gray-200 hover:border-gray-300'
            } bg-white`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <i className="ri-building-2-line text-gray-400 flex-shrink-0"></i>
            {selectedClient ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate">{selectedClient.name}</span>
                {selectedClient.business_number && (
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{selectedClient.business_number}</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400 flex-1">거래처 검색 / 선택...</span>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedClient && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleClearClient(); }}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <i className="ri-close-line text-gray-400 text-xs"></i>
                </button>
              )}
              <i className={`ri-arrow-${dropdownOpen ? 'up' : 'down'}-s-line text-gray-400 text-sm`}></i>
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="거래처명 또는 사업자번호..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2B5F9E]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto">
                <button
                  onClick={() => handleSelectClient('')}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                    !clientFilter ? 'bg-[#2B5F9E]/5 text-[#2B5F9E] font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="ri-list-check text-sm"></i>
                  전체 거래처
                  <span className="ml-auto text-xs text-gray-400">{clients.length}개</span>
                </button>

                {filteredClients.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-gray-400">
                    <i className="ri-search-line block text-2xl mb-1 opacity-40"></i>
                    검색 결과가 없습니다
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                        clientFilter === client.id
                          ? 'bg-[#2B5F9E]/5 text-[#2B5F9E] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500">
                        {client.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{client.name}</p>
                        {client.business_number && (
                          <p className="text-[10px] text-gray-400 font-mono">{client.business_number}</p>
                        )}
                      </div>
                      {clientFilter === client.id && (
                        <i className="ri-check-line text-[#2B5F9E] flex-shrink-0"></i>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2행: 기간 필터 */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* 날짜 범위 입력 */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]"
            />
          </div>
          <span className="text-gray-400 text-sm flex-shrink-0">~</span>
          <div className="relative flex-1">
            <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]"
            />
          </div>
          <button
            onClick={() => onSearch?.()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            <i className="ri-search-line text-sm"></i>
            조회
          </button>
        </div>

        {/* 빠른 선택 프리셋 */}
        <div className="flex gap-2 flex-wrap lg:flex-nowrap">
          <button
            onClick={() => applyDatePreset('today')}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            오늘
          </button>
          <button
            onClick={() => applyDatePreset('week')}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            이번주
          </button>
          <button
            onClick={() => applyDatePreset('month')}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            이번달
          </button>
          <button
            onClick={() => applyDatePreset('lastMonth')}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            지난달
          </button>
          <button
            onClick={() => applyDatePreset('all')}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            전체
          </button>
        </div>
      </div>

      {/* 3행: 상태 필터 버튼 */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status === '전체' ? '' : status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              (status === '전체' && !statusFilter) || statusFilter === status
                ? 'bg-[#2B5F9E] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* 활성 필터 태그 표시 */}
      {(searchTerm || clientFilter || statusFilter || hasDateFilter) && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400 font-medium">적용된 필터:</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2B5F9E]/10 text-[#2B5F9E] rounded-full text-xs font-medium">
              <i className="ri-search-line text-[10px]"></i>
              {searchTerm}
              <button onClick={() => onSearchChange('')} className="ml-0.5 hover:text-[#1a3d6e] cursor-pointer">
                <i className="ri-close-line text-[10px]"></i>
              </button>
            </span>
          )}
          {selectedClient && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
              <i className="ri-building-2-line text-[10px]"></i>
              {selectedClient.name}
              <button onClick={handleClearClient} className="ml-0.5 hover:text-emerald-900 cursor-pointer">
                <i className="ri-close-line text-[10px]"></i>
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
              <i className="ri-flag-line text-[10px]"></i>
              {statusFilter}
              <button onClick={() => onStatusChange('')} className="ml-0.5 hover:text-amber-900 cursor-pointer">
                <i className="ri-close-line text-[10px]"></i>
              </button>
            </span>
          )}
          {hasDateFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
              <i className="ri-calendar-line text-[10px]"></i>
              {getDateRangeLabel()}
              <button onClick={() => onDateRangeChange({ start: '', end: '' })} className="ml-0.5 hover:text-purple-900 cursor-pointer">
                <i className="ri-close-line text-[10px]"></i>
              </button>
            </span>
          )}
          <button
            onClick={() => { 
              onSearchChange(''); 
              onClientChange(''); 
              onStatusChange(''); 
              onDateRangeChange({ start: '', end: '' });
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer ml-1"
          >
            전체 초기화
          </button>
        </div>
      )}
    </div>
  );
}