import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../lib/supabase';
import * as XLSX from 'xlsx';

interface BalanceLog {
  id: string;
  client_id?: string;
  client_name?: string;
  business_number?: string;
  amount?: number;
  balance_before?: number;
  balance_after?: number;
  description?: string;
  type?: string;
  admin_name?: string;
  created_at: string;
  [key: string]: any;
}

interface PointHistoryPanelProps {
  clientId?: string;
  clientName?: string;
}

type FilterType = 'all' | 'adjust' | 'order' | 'charge';

export default function PointHistoryPanel({ clientId, clientName }: PointHistoryPanelProps) {
  const [logs, setLogs] = useState<BalanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBalanceLogs();
  }, [clientId]);

  const loadBalanceLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('balance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('balance_logs 조회 실패:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchType = filter === 'all' || (log.type || '').includes(filter);
      const matchSearch = !searchTerm ||
        (log.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.business_number || '').includes(searchTerm);
      return matchType && matchSearch;
    });
  }, [logs, filter, searchTerm]);

  const handleExcelDownload = () => {
    const excelData = filteredLogs.map(log => ({
      '거래처명': log.client_name || '-',
      '사업자번호': log.business_number || '-',
      '유형': log.type || '-',
      '금액': log.amount ?? '-',
      '변경전잔액': log.balance_before ?? '-',
      '변경후잔액': log.balance_after ?? '-',
      '설명': log.description || '-',
      '처리자': log.admin_name || '-',
      '일시': new Date(log.created_at).toLocaleString('ko-KR'),
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '잔액조정이력');
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 20 }];
    XLSX.writeFile(wb, `잔액조정이력_${clientName || '전체'}_${new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g, '-')}.xlsx`);
  };

  const getTypeBadge = (type?: string) => {
    const t = type || 'adjust';
    const map: Record<string, string> = {
      adjust: 'bg-amber-100 text-amber-700',
      order: 'bg-red-100 text-red-700',
      charge: 'bg-teal-100 text-teal-700',
      payment: 'bg-teal-100 text-teal-700',
      refund: 'bg-orange-100 text-orange-700',
    };
    const labelMap: Record<string, string> = {
      adjust: '조정',
      order: '주문차감',
      charge: '충전',
      payment: '결제',
      refund: '환불',
    };
    const cls = map[t] || 'bg-gray-100 text-gray-600';
    const label = labelMap[t] || t;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
        {label}
      </span>
    );
  };

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: `전체 (${logs.length})` },
    { key: 'adjust', label: `조정 (${logs.filter(l => (l.type || '').includes('adjust')).length})` },
    { key: 'order', label: `주문 (${logs.filter(l => (l.type || '').includes('order')).length})` },
    { key: 'charge', label: `충전 (${logs.filter(l => (l.type || '').includes('charge') || (l.type || '').includes('payment')).length})` },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold text-gray-900">
            {clientName ? `${clientName} 잔액 조정 이력` : '전체 잔액 조정 이력'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExcelDownload}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-excel-2-line"></i>엑셀 다운로드
            </button>
            <button
              onClick={loadBalanceLogs}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-xs md:text-sm whitespace-nowrap cursor-pointer"
            >
              <i className="ri-refresh-line"></i>새로고침
            </button>
            <span className="text-sm text-gray-500 whitespace-nowrap">총 {filteredLogs.length}건</span>
          </div>
        </div>

        {/* 안내 배너 */}
        <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <i className="ri-information-line flex-shrink-0 mt-0.5"></i>
          <span>
            잔액 이력은 <strong>balance_logs</strong> 테이블 기반으로 표시됩니다. 
            모든 잔액은 <strong>clients.outstanding_balance</strong> 기준으로 관리됩니다.
          </span>
        </div>

        {!clientId && (
          <div className="mb-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="거래처명, 사업자번호, 설명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap cursor-pointer ${
                filter === tab.key ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center">
          <i className="ri-inbox-line text-5xl text-gray-300 mb-3"></i>
          <p className="text-gray-500 text-sm">잔액 조정 이력이 없습니다</p>
          <p className="text-gray-400 text-xs mt-1">balance_logs 테이블에 데이터가 없습니다</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredLogs.map((log) => {
            const amount = log.amount ?? 0;
            return (
              <div key={log.id} className="px-4 md:px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getTypeBadge(log.type)}
                      {!clientId && log.client_name && (
                        <span className="font-medium text-gray-900 text-sm">{log.client_name}</span>
                      )}
                      {log.business_number && (
                        <span className="text-xs text-gray-400">{log.business_number}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 break-words">{log.description || '-'}</p>
                    {log.admin_name && (
                      <p className="text-xs text-gray-400 mt-0.5">처리자: {log.admin_name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {log.amount !== undefined && log.amount !== null && (
                      <p className={`text-base font-bold ${amount >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                        {amount >= 0 ? '+' : ''}{amount.toLocaleString()}원
                      </p>
                    )}
                    {log.balance_after !== undefined && log.balance_after !== null && (
                      <p className="text-xs text-gray-400">
                        잔액 {log.balance_after.toLocaleString()}원
                      </p>
                    )}
                    {log.balance_before !== undefined && log.balance_before !== null && (
                      <p className="text-xs text-gray-400">
                        변경전 {log.balance_before.toLocaleString()}원
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
