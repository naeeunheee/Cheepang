import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../lib/supabase';

interface ChargeRequest {
  id: string;
  client_id: string;
  amount: number;
  bonus_amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  clients?: {
    name: string;
  };
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | 'approved' | 'rejected' | 'pending';

export default function ChargeHistoryPanel() {
  const [chargeRequests, setChargeRequests] = useState<ChargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [pendingStart, setPendingStart] = useState('');
  const [pendingEnd, setPendingEnd] = useState('');

  useEffect(() => {
    fetchChargeHistory();

    const channel = supabase
      .channel('charge_history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'charge_requests'
        },
        () => {
          fetchChargeHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchChargeHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('charge_requests')
        .select(`
          *,
          clients!charge_requests_client_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChargeRequests(data || []);
    } catch (error) {
      console.error('충전 이력 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = [...chargeRequests];

    // 커스텀 날짜가 있으면 우선 적용
    if (customDateStart || customDateEnd) {
      filtered = filtered.filter(req => {
        const reqDate = req.created_at.split('T')[0];
        if (customDateStart && reqDate < customDateStart) return false;
        if (customDateEnd && reqDate > customDateEnd) return false;
        return true;
      });
    } else if (periodFilter !== 'all') {
      // 기간 필터
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(req => {
        const reqDate = new Date(req.created_at);
        
        if (periodFilter === 'today') {
          return reqDate >= today;
        } else if (periodFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return reqDate >= weekAgo;
        } else if (periodFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return reqDate >= monthAgo;
        }
        return true;
      });
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.clients?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [chargeRequests, periodFilter, statusFilter, searchQuery, customDateStart, customDateEnd]);

  const monthlySummary = useMemo(() => {
    const approved = filteredRequests.filter(req => req.status === 'approved');
    const totalAmount = approved.reduce((sum, req) => sum + req.amount, 0);
    const totalBonus = approved.reduce((sum, req) => sum + (req.bonus_amount || 0), 0);
    const count = approved.length;

    return { totalAmount, totalBonus, count };
  }, [filteredRequests]);

  const exportToExcel = () => {
    const headers = ['거래처명', '요청일시', '충전금액', '보너스', '총지급액', '결제방법', '상태', '처리일시', '처리자'];
    const rows = filteredRequests.map(req => [
      req.clients?.name || '-',
      new Date(req.created_at).toLocaleString('ko-KR'),
      req.amount.toLocaleString(),
      (req.bonus_amount || 0).toLocaleString(),
      (req.amount + (req.bonus_amount || 0)).toLocaleString(),
      req.payment_method === 'card' ? '카드' : req.payment_method === 'bank' ? '계좌이체' : req.payment_method,
      req.status === 'approved' ? '승인' : req.status === 'rejected' ? '거절' : '대기',
      req.processed_at ? new Date(req.processed_at).toLocaleString('ko-KR') : '-',
      req.processed_by || '-'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `충전이력_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700'
    };
    const labels = {
      approved: '승인',
      rejected: '거절',
      pending: '대기'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 월별 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 충전금액</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monthlySummary.totalAmount.toLocaleString()}원
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 보너스</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monthlySummary.totalBonus.toLocaleString()}원
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-gift-line text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">충전 건수</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monthlySummary.count}건
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-list-3-line text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 기간 필터 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'today', label: '오늘' },
                { value: 'week', label: '이번주' },
                { value: 'month', label: '이번달' },
                { value: 'all', label: '전체' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => { setPeriodFilter(period.value as PeriodFilter); setCustomDateStart(''); setCustomDateEnd(''); setPendingStart(''); setPendingEnd(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    periodFilter === period.value && !customDateStart && !customDateEnd
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            {/* 커스텀 날짜 입력 */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-500 whitespace-nowrap">직접입력</span>
              <input
                type="date"
                value={pendingStart}
                onChange={(e) => setPendingStart(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 cursor-pointer"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                type="date"
                value={pendingEnd}
                onChange={(e) => setPendingEnd(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 cursor-pointer"
              />
              <button
                onClick={() => {
                  setCustomDateStart(pendingStart);
                  setCustomDateEnd(pendingEnd);
                  if (pendingStart || pendingEnd) setPeriodFilter('all');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-search-line text-sm"></i>
                조회
              </button>
              {(customDateStart || customDateEnd) && (
                <button
                  onClick={() => { setCustomDateStart(''); setCustomDateEnd(''); setPendingStart(''); setPendingEnd(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer whitespace-nowrap"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 상태 필터 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: '전체' },
                { value: 'approved', label: '승인' },
                { value: 'rejected', label: '거절' },
                { value: 'pending', label: '대기' }
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value as StatusFilter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === status.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">거래처 검색</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="거래처명 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 엑셀 다운로드 */}
          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-file-excel-2-line"></i>
              엑셀 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* 충전 이력 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래처명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  요청일시
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  충전금액
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  보너스
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  총지급액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제방법
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  처리일시
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  처리자
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    충전 이력이 없습니다
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {req.clients?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleTimeString('ko-KR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {req.amount.toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-green-600 font-medium">
                        +{(req.bonus_amount || 0).toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {(req.amount + (req.bonus_amount || 0)).toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {req.payment_method === 'card' ? '카드' : 
                         req.payment_method === 'bank' ? '계좌이체' : 
                         req.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req.processed_at ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {new Date(req.processed_at).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(req.processed_at).toLocaleTimeString('ko-KR')}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {req.processed_by || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 결과 요약 */}
      <div className="text-sm text-gray-600 text-center">
        총 {filteredRequests.length}건의 충전 이력
      </div>
    </div>
  );
}