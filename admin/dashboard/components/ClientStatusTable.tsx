import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export interface ClientRow {
  id: string;
  name: string;
  business_number: string;
  package_tier?: string;
  outstanding_balance?: number;
  lastOrderDate?: string;
  totalOrders?: number;
}

interface ClientStatusTableProps {
  clients: ClientRow[];
  loading: boolean;
  onRefresh: () => void;
}

const PACKAGE_TIERS = ['1000 PKG', '2000 PKG', '3000 PKG', '4000 PKG', '5000 PKG', '10000 PKG'];

function getBalanceStyle(balance: number | undefined) {
  if (balance === undefined || balance === null) return { cls: 'text-gray-400', label: '-' };
  if (balance < 0) return { cls: 'text-blue-600 font-bold', label: `₩${Math.abs(balance).toLocaleString()} 사용가능` };
  if (balance > 0) return { cls: 'text-red-600 font-bold', label: `₩${balance.toLocaleString()} 미수금` };
  return { cls: 'text-gray-400', label: '₩0' };
}

export default function ClientStatusTable({ clients, loading, onRefresh }: ClientStatusTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; client: ClientRow | null }>({ open: false, client: null });
  const [balanceInput, setBalanceInput] = useState('');
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [search, setSearch] = useState('');

  const handlePackageChange = async (clientId: string, newTier: string) => {
    setUpdatingId(clientId + '_pkg');
    try {
      await supabase.from('clients').update({ package_tier: newTier }).eq('id', clientId);
      onRefresh();
    } catch (e) {
      console.error('패키지 변경 실패:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const openBalanceModal = (client: ClientRow) => {
    setBalanceInput(String(client.outstanding_balance ?? 0));
    setBalanceModal({ open: true, client });
  };

  const handleBalanceSave = async () => {
    if (!balanceModal.client) return;
    const num = Number(balanceInput);
    if (isNaN(num)) return;
    setBalanceSaving(true);
    try {
      await supabase
        .from('clients')
        .update({ outstanding_balance: num })
        .eq('id', balanceModal.client.id);
      onRefresh();
      setBalanceModal({ open: false, client: null });
    } catch (e) {
      console.error('잔액 수정 실패:', e);
    } finally {
      setBalanceSaving(false);
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.business_number.includes(q);
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-building-line text-emerald-600 text-base"></i>
            </div>
            <h2 className="text-base font-bold text-gray-900">거래처 현황</h2>
            <span className="text-xs text-gray-400 font-medium">{clients.length}곳</span>
          </div>
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="치과명, 사업자번호 검색..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full sm:w-52 focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">불러오는 중...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">치과명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap hidden sm:table-cell">사업자번호</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">패키지</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">잔액</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap hidden lg:table-cell">최근주문일</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap hidden md:table-cell">총주문</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">잔액수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(client => {
                  const balStyle = getBalanceStyle(client.outstanding_balance);
                  const isPkgUpdating = updatingId === client.id + '_pkg';
                  return (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{client.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs font-mono text-gray-500">{client.business_number}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPkgUpdating ? (
                          <div className="flex justify-center">
                            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <select
                            value={client.package_tier || ''}
                            onChange={e => handlePackageChange(client.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-teal-400 cursor-pointer"
                          >
                            <option value="">미설정</option>
                            {PACKAGE_TIERS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className={`text-xs whitespace-nowrap ${balStyle.cls}`}>{balStyle.label}</p>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {client.lastOrderDate
                            ? new Date(client.lastOrderDate).toLocaleDateString('ko-KR')
                            : '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-xs font-semibold text-gray-700">{client.totalOrders ?? 0}건</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openBalanceModal(client)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-edit-line mr-1"></i>수정
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 잔액 수정 모달 */}
      {balanceModal.open && balanceModal.client && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setBalanceModal({ open: false, client: null })}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">잔액 수정</h3>
                <p className="text-sm text-gray-500 mt-0.5">{balanceModal.client.name}</p>
              </div>
              <button onClick={() => setBalanceModal({ open: false, client: null })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">현재 잔액</p>
              <p className={`text-base font-bold ${getBalanceStyle(balanceModal.client.outstanding_balance).cls}`}>
                {getBalanceStyle(balanceModal.client.outstanding_balance).label}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                새 잔액 입력
                <span className="ml-2 text-gray-400 font-normal">(음수: 사용가능잔액 / 양수: 미수금)</span>
              </label>
              <input
                type="number"
                value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)}
                placeholder="예: -50000 (사용가능) 또는 30000 (미수금)"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400"
              />
              <div className="mt-2 flex gap-2">
                <button onClick={() => setBalanceInput('0')} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 cursor-pointer whitespace-nowrap">0</button>
                <button onClick={() => setBalanceInput(String(Number(balanceInput) - 100000))} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 cursor-pointer whitespace-nowrap">-10만</button>
                <button onClick={() => setBalanceInput(String(Number(balanceInput) - 500000))} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 cursor-pointer whitespace-nowrap">-50만</button>
                <button onClick={() => setBalanceInput(String(Number(balanceInput) + 100000))} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 cursor-pointer whitespace-nowrap">+10만</button>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setBalanceModal({ open: false, client: null })} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer whitespace-nowrap">
                취소
              </button>
              <button
                onClick={handleBalanceSave}
                disabled={balanceSaving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {balanceSaving ? <i className="ri-loader-4-line animate-spin"></i> : '저장'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
