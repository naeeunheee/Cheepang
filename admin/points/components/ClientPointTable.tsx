import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import * as XLSX from 'xlsx';
import PaymentRequestNotify from '../../../../components/feature/PaymentRequestNotify';

interface Client {
  id: string;
  name: string;
  clinic_name: string | null;
  business_no: string | null;
  business_number: string | null;
  representative: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  point_balance: number;
  outstanding_balance: number;
  created_at: string;
  updated_at: string | null;
}

interface ClientWithBalance extends Client {
  initial_balance: number;
  current_balance: number;
  total_used: number;
  total_charged: number;
}

interface ClientPointTableProps {
  highlightClientId?: string | null;
  onHighlightClear?: () => void;
}

export default function ClientPointTable({ highlightClientId, onHighlightClear }: ClientPointTableProps) {
  const [clients, setClients] = useState<ClientWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'initial' | 'current' | 'debt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [adjustModal, setAdjustModal] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
    currentBalance: number;
  } | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('set');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithBalance | null>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDebtClients, setSelectedDebtClients] = useState<Set<string>>(new Set());
  const [showPaymentNotify, setShowPaymentNotify] = useState(false);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | HTMLDivElement | null>>({});

  // highlightClientId가 들어오면 해당 행으로 스크롤 + 3초 후 하이라이트 해제
  useEffect(() => {
    if (!highlightClientId || loading) return;

    const el = rowRefs.current[highlightClientId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        onHighlightClear?.();
      }, 3000);
    }
  }, [highlightClientId, loading]);

  useEffect(() => {
    loadClientsWithTransactions();
  }, []);

  const getDisplayName = (client: Client) => client.clinic_name || client.name || '-';
  const getBusinessNo = (client: Client) => client.business_no || client.business_number || '-';

  const loadClientsWithTransactions = async () => {
    setLoading(true);
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;
      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // outstanding_balance 기반으로 직접 사용
      const clientsWithBalance: ClientWithBalance[] = clientsData.map(client => {
        const outstandingBal = client.outstanding_balance || 0;
        // outstanding_balance < 0 = 사용가능잔액(선결제), > 0 = 미수금
        return {
          ...client,
          initial_balance: outstandingBal,
          current_balance: outstandingBal,
          total_used: 0,
          total_charged: 0,
        };
      });

      setClients(clientsWithBalance);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientHistory = async (clientId: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (!error) setClientHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredClients = clients
    .filter(c => {
      const name = getDisplayName(c).toLowerCase();
      const bno = getBusinessNo(c);
      const rep = (c.representative || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || bno.includes(term) || rep.includes(term);
    })
    .sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'name') {
        compareValue = getDisplayName(a).localeCompare(getDisplayName(b), 'ko');
      } else if (sortBy === 'initial') {
        compareValue = a.initial_balance - b.initial_balance;
      } else if (sortBy === 'current') {
        compareValue = a.current_balance - b.current_balance;
      } else if (sortBy === 'debt') {
        const aDebt = a.current_balance > 0 ? a.current_balance : 0;
        const bDebt = b.current_balance > 0 ? b.current_balance : 0;
        compareValue = aDebt - bDebt;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const handleSort = (field: 'name' | 'initial' | 'current' | 'debt') => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const handleExcelDownload = () => {
    const excelData = filteredClients.map(client => ({
      '거래처명': getDisplayName(client),
      '사업자번호': getBusinessNo(client),
      '대표자': client.representative || '-',
      '기초잔액': client.initial_balance,
      '총충전': client.total_charged,
      '총사용': client.total_used,
      '현재잔액': client.current_balance,
      '상태': client.current_balance > 0 ? '미수금' : client.current_balance < 0 ? '포인트' : '정상',
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '포인트현황');
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
    XLSX.writeFile(wb, `포인트현황_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`);
  };

  const openAdjustModal = (clientId: string, clientName: string, currentBalance: number) => {
    setAdjustModal({ isOpen: true, clientId, clientName, currentBalance });
    setAdjustType('set');
    setAdjustAmount('');
    setAdjustReason('');
  };

  const closeAdjustModal = () => {
    setAdjustModal(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  const handleAdjustSubmit = async () => {
    if (!adjustModal) return;
    const amount = parseInt(adjustAmount.replace(/,/g, ''));
    if (isNaN(amount)) { alert('올바른 금액을 입력해주세요'); return; }
    if (!adjustReason.trim()) { alert('조정 사유를 입력해주세요'); return; }

    setIsSubmitting(true);
    try {
      let newBalance = adjustModal.currentBalance;
      let actualAmount = amount;

      if (adjustType === 'add') { newBalance = adjustModal.currentBalance + amount; }
      else if (adjustType === 'subtract') { newBalance = adjustModal.currentBalance - amount; actualAmount = -amount; }
      else if (adjustType === 'set') { actualAmount = amount - adjustModal.currentBalance; newBalance = amount; }

      // outstanding_balance 기반으로 업데이트
      const { error: updateError } = await supabase
        .from('clients')
        .update({ outstanding_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', adjustModal.clientId);
      if (updateError) throw updateError;

      const { error: transError } = await supabase
        .from('point_transactions')
        .insert([{
          client_id: adjustModal.clientId,
          client_name: adjustModal.clientName,
          type: 'adjust',
          amount: actualAmount,
          balance_after: newBalance,
          description: adjustReason,
          admin_note: `관리자 조정 (${adjustType === 'add' ? '추가' : adjustType === 'subtract' ? '차감' : '설정'})`,
          created_at: new Date().toISOString()
        }]);
      if (transError) console.warn('거래 내역 기록 실패 (무시):', transError);

      closeAdjustModal();
      loadClientsWithTransactions();
    } catch (error) {
      console.error('잔액 조정 실패:', error);
      alert('잔액 조정에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNewBalance = () => {
    if (!adjustModal) return 0;
    const amount = parseInt(adjustAmount.replace(/,/g, '')) || 0;
    if (adjustType === 'add') return adjustModal.currentBalance + amount;
    if (adjustType === 'subtract') return adjustModal.currentBalance - amount;
    return amount;
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      charge: 'bg-teal-100 text-teal-700',
      use: 'bg-red-100 text-red-700',
      order: 'bg-red-100 text-red-700',
      subtract: 'bg-red-100 text-red-700',
      adjust: 'bg-amber-100 text-amber-700',
      bonus: 'bg-green-100 text-green-700',
      refund: 'bg-orange-100 text-orange-700',
      add: 'bg-teal-100 text-teal-700',
    };
    const labelMap: Record<string, string> = {
      charge: '충전', use: '사용', order: '주문차감', subtract: '차감',
      adjust: '조정', bonus: '보너스', refund: '환불', add: '추가',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${map[type] || 'bg-gray-100 text-gray-600'}`}>
        {labelMap[type] || type}
      </span>
    );
  };

  const handleSelectDebtClient = (clientId: string, isDebt: boolean) => {
    if (!isDebt) return;
    
    setSelectedDebtClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleSelectAllDebtClients = () => {
    const debtClients = filteredClients.filter(c => c.current_balance > 0);
    if (selectedDebtClients.size === debtClients.length) {
      setSelectedDebtClients(new Set());
    } else {
      setSelectedDebtClients(new Set(debtClients.map(c => c.id)));
    }
  };

  const handleOpenPaymentNotify = () => {
    const selectedClientsData = filteredClients
      .filter(c => selectedDebtClients.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        clinic_name: c.clinic_name,
        phone: c.phone,
        debtAmount: c.current_balance,
      }));
    
    if (selectedClientsData.length === 0) {
      alert('결제 요청을 보낼 거래처를 선택해주세요.');
      return;
    }
    
    setShowPaymentNotify(true);
  };

  const debtClientsCount = filteredClients.filter(c => c.current_balance > 0).length;
  const allDebtSelected = debtClientsCount > 0 && selectedDebtClients.size === debtClientsCount;

  const totalPrepaid = clients.reduce((s, c) => c.current_balance < 0 ? s + Math.abs(c.current_balance) : s, 0);
  const totalDebt = clients.reduce((s, c) => c.current_balance > 0 ? s + c.current_balance : s, 0);
  const debtCount = clients.filter(c => c.current_balance > 0).length;
  const prepaidCount = clients.filter(c => c.current_balance < 0).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 요약 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border-l-4 border-teal-500">
          <p className="text-xs text-gray-500 mb-1">전체 거래처</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{clients.length}<span className="text-xs md:text-sm font-normal text-gray-500 ml-1">개</span></p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 mb-1">사용 가능 잔액 총액</p>
          <p className="text-base md:text-xl font-bold text-green-600">{totalPrepaid.toLocaleString()}원</p>
          <p className="text-xs text-gray-400">{prepaidCount}개 거래처</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 mb-1">미수금 총액</p>
          <p className="text-base md:text-xl font-bold text-red-600">{totalDebt.toLocaleString()}원</p>
          <p className="text-xs text-gray-400">{debtCount}개 거래처</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border-l-4 border-gray-300">
          <p className="text-xs text-gray-500 mb-1">잔액 없음</p>
          <p className="text-base md:text-xl font-bold text-gray-500">{clients.length - prepaidCount - debtCount}<span className="text-xs md:text-sm font-normal ml-1">개</span></p>
        </div>
      </div>

      {/* 검색 및 다운로드 */}
      <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 max-w-full md:max-w-md relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="거래처명, 사업자번호, 대표자 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <span className="whitespace-nowrap">{filteredClients.length}개 표시</span>
            {selectedDebtClients.size > 0 && (
              <button
                onClick={handleOpenPaymentNotify}
                className="inline-flex items-center px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                <i className="ri-notification-3-line mr-1.5"></i>결제 요청 ({selectedDebtClients.size})
              </button>
            )}
            <button
              onClick={handleExcelDownload}
              className="inline-flex items-center px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-excel-2-line mr-1.5"></i>엑셀
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={allDebtSelected}
                    onChange={handleSelectAllDebtClients}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                    title="미수금 거래처 전체 선택"
                  />
                </th>
                <th onClick={() => handleSort('name')} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap">
                  <div className="flex items-center gap-1">거래처명 {sortBy === 'name' && <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-s-line text-teal-600`}></i>}</div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">대표자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">연락처</th>
                <th onClick={() => handleSort('initial')} className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">기초잔액 {sortBy === 'initial' && <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-s-line text-teal-600`}></i>}</div>
                </th>
                <th onClick={() => handleSort('current')} className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">현재잔액 {sortBy === 'current' && <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-s-line text-teal-600`}></i>}</div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredClients.map((client) => {
                const isDebt = client.current_balance > 0;
                const isPrepaid = client.current_balance < 0;
                const displayName = getDisplayName(client);
                const businessNo = getBusinessNo(client);
                const isSelected = selectedDebtClients.has(client.id);
                const isHighlighted = highlightClientId === client.id;

                return (
                  <tr
                    key={client.id}
                    ref={(el) => { rowRefs.current[client.id] = el; }}
                    className={`hover:bg-gray-50 transition-all duration-500 ${
                      isSelected ? 'bg-red-50' :
                      isHighlighted ? 'bg-amber-50 ring-2 ring-amber-400 ring-inset' :
                      ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isDebt ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectDebtClient(client.id, isDebt)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => { setSelectedClient(client); loadClientHistory(client.id); }}
                        className="text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-teal-600 transition-colors">{displayName}</div>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full animate-pulse whitespace-nowrap">
                              ← 여기
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{businessNo}</div>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{client.representative || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{client.phone || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {client.initial_balance === 0 ? (
                        <span className="text-sm text-gray-400">0원</span>
                      ) : client.initial_balance > 0 ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">미수금</span>
                          <span className="text-sm font-semibold text-red-600">{client.initial_balance.toLocaleString()}원</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">포인트</span>
                          <span className="text-sm font-semibold text-green-600">{Math.abs(client.initial_balance).toLocaleString()}원</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {client.current_balance === 0 ? (
                        <span className="text-sm text-gray-400">0원</span>
                      ) : isDebt ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">미수금</span>
                          <span className="text-sm font-bold text-red-600">{client.current_balance.toLocaleString()}원</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">포인트</span>
                          <span className="text-sm font-bold text-teal-600">{Math.abs(client.current_balance).toLocaleString()}원</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setSelectedClient(client); loadClientHistory(client.id); }}
                          className="inline-flex items-center px-2.5 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-history-line mr-1"></i>이력
                        </button>
                        <button
                          onClick={() => openAdjustModal(client.id, displayName, client.current_balance)}
                          className="inline-flex items-center px-2.5 py-1 border border-teal-300 rounded-md text-xs font-medium text-teal-700 bg-white hover:bg-teal-50 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-edit-line mr-1"></i>조정
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-building-line text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">{searchTerm ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'}</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <i className="ri-building-line text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 text-sm">{searchTerm ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'}</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const isDebt = client.current_balance > 0;
            const isPrepaid = client.current_balance < 0;
            const displayName = getDisplayName(client);
            const businessNo = getBusinessNo(client);
            const isSelected = selectedDebtClients.has(client.id);
            const isHighlighted = highlightClientId === client.id;

            return (
              <div
                key={client.id}
                ref={(el) => { rowRefs.current[client.id] = el; }}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-500 ${
                  isSelected ? 'border-red-300 bg-red-50' :
                  isHighlighted ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50' :
                  'border-gray-100'
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {isDebt && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectDebtClient(client.id, isDebt)}
                          className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{displayName}</h3>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full animate-pulse whitespace-nowrap">
                              ← 여기
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{businessNo}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedClient(client); loadClientHistory(client.id); }}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <i className="ri-more-2-fill text-gray-400"></i>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">대표자</span>
                      <p className="text-gray-900 font-medium mt-0.5">{client.representative || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">연락처</span>
                      <p className="text-gray-900 font-medium mt-0.5">{client.phone || '-'}</p>
                    </div>
                  </div>

                  {/* Balances */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-xs text-gray-500 mb-1">기초잔액</p>
                      {client.initial_balance === 0 ? (
                        <p className="text-sm font-semibold text-gray-400">0원</p>
                      ) : client.initial_balance > 0 ? (
                        <div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">미수금</span>
                          <p className="text-sm font-bold text-red-600 mt-1">{client.initial_balance.toLocaleString()}원</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">포인트</span>
                          <p className="text-sm font-bold text-green-600 mt-1">{Math.abs(client.initial_balance).toLocaleString()}원</p>
                        </div>
                      )}
                    </div>
                    <div className={`rounded-lg p-2.5 ${isDebt ? 'bg-red-50' : isPrepaid ? 'bg-teal-50' : 'bg-gray-50'}`}>
                      <p className="text-xs text-gray-500 mb-1">현재잔액</p>
                      {client.current_balance === 0 ? (
                        <p className="text-sm font-semibold text-gray-400">0원</p>
                      ) : isDebt ? (
                        <div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-200 text-red-700 font-medium">미수금</span>
                          <p className="text-sm font-bold text-red-600 mt-1">{client.current_balance.toLocaleString()}원</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-200 text-teal-700 font-medium">포인트</span>
                          <p className="text-sm font-bold text-teal-600 mt-1">{Math.abs(client.current_balance).toLocaleString()}원</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setSelectedClient(client); loadClientHistory(client.id); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-history-line"></i>이력
                    </button>
                    <button
                      onClick={() => openAdjustModal(client.id, displayName, client.current_balance)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-teal-300 rounded-lg text-xs font-medium text-teal-700 bg-white hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-edit-line"></i>조정
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 거래처 이력 사이드 패널 */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50" onClick={() => setSelectedClient(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-bold text-gray-900">{getDisplayName(selectedClient)}</h3>
                <p className="text-xs text-gray-500 mt-0.5">포인트 거래 이력</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* 잔액 요약 */}
            <div className="px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">기초잔액</p>
                  <p className={`text-xs md:text-sm font-bold ${selectedClient.initial_balance > 0 ? 'text-red-600' : selectedClient.initial_balance < 0 ? 'text-teal-600' : 'text-gray-500'}`}>
                    {selectedClient.initial_balance.toLocaleString()}원
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">총 충전</p>
                  <p className="text-xs md:text-sm font-bold text-teal-600">+{selectedClient.total_charged.toLocaleString()}원</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">현재잔액</p>
                  <p className={`text-xs md:text-sm font-bold ${selectedClient.current_balance > 0 ? 'text-red-600' : selectedClient.current_balance < 0 ? 'text-teal-600' : 'text-gray-500'}`}>
                    {selectedClient.current_balance.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>

            {/* 이력 목록 */}
            <div className="divide-y divide-gray-100">
              {historyLoading ? (
                <div className="p-8 text-center text-gray-400">
                  <i className="ri-loader-4-line animate-spin text-2xl mb-2"></i>
                  <p className="text-sm">불러오는 중...</p>
                </div>
              ) : clientHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <i className="ri-inbox-line text-4xl mb-2"></i>
                  <p className="text-sm">거래 이력이 없습니다</p>
                </div>
              ) : (
                clientHistory.map(tx => (
                  <div key={tx.id} className="px-4 md:px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getTypeBadge(tx.type)}
                          <span className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString('ko-KR')}</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-700 break-words">{tx.description || '-'}</p>
                        {tx.admin_note && <p className="text-xs text-gray-400 mt-0.5">{tx.admin_note}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm md:text-base font-bold ${tx.amount >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                        </p>
                        <p className="text-xs text-gray-400">잔액 {tx.balance_after.toLocaleString()}원</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 결제 요청 알림 모달 */}
      <PaymentRequestNotify
        isOpen={showPaymentNotify}
        clients={filteredClients
          .filter(c => selectedDebtClients.has(c.id))
          .map(c => ({
            id: c.id,
            name: c.name,
            clinic_name: c.clinic_name,
            phone: c.phone,
            debtAmount: c.current_balance,
          }))}
        onClose={() => setShowPaymentNotify(false)}
        onSuccess={() => {
          setSelectedDebtClients(new Set());
          loadClientsWithTransactions();
        }}
      />

      {/* 포인트 조정 모달 */}
      {adjustModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-bold text-gray-900">포인트 조정</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">{adjustModal.clientName}</p>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">현재 잔액</label>
                <div className={`text-xl md:text-2xl font-bold ${adjustModal.currentBalance > 0 ? 'text-red-600' : adjustModal.currentBalance < 0 ? 'text-teal-600' : 'text-gray-900'}`}>
                  {adjustModal.currentBalance.toLocaleString()}원
                  <span className="text-xs md:text-sm font-normal text-gray-500 ml-2">
                    {adjustModal.currentBalance > 0 ? '(미수금)' : adjustModal.currentBalance < 0 ? '(포인트)' : ''}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">조정 방식</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['add', 'subtract', 'set'] as const).map(t => (
                    <button key={t} onClick={() => setAdjustType(t)}
                      className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap cursor-pointer ${adjustType === t ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {t === 'add' ? '추가' : t === 'subtract' ? '차감' : '설정'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  {adjustType === 'set' ? '설정할 금액' : '조정 금액'}
                </label>
                <input
                  type="text"
                  value={adjustAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9-]/g, '');
                    if (value === '' || value === '-') { setAdjustAmount(value); return; }
                    const num = parseInt(value);
                    if (!isNaN(num)) setAdjustAmount(num.toLocaleString());
                  }}
                  placeholder="금액 입력 (음수 가능)"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
              {adjustAmount && adjustAmount !== '-' && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">변경 후 잔액</span>
                    <span className="text-lg md:text-xl font-bold text-teal-600">{getNewBalance().toLocaleString()}원</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">조정 사유 <span className="text-red-500">*</span></label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="예: 2026-03-01 기준 잔액 조정"
                  rows={3}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>
            <div className="p-4 md:p-6 border-t border-gray-200 flex gap-3">
              <button onClick={closeAdjustModal} disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap disabled:opacity-50 cursor-pointer">
                취소
              </button>
              <button onClick={handleAdjustSubmit}
                disabled={isSubmitting || !adjustAmount || adjustAmount === '-' || !adjustReason.trim()}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {isSubmitting ? '처리중...' : '조정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}