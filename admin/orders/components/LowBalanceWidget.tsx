import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface ClientWithDebt {
  id: string;
  name: string;
  business_number: string;
  outstanding_balance: number;
  phone?: string;
}

export default function LowBalanceWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [clients, setClients] = useState<ClientWithDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDebtClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, business_number, outstanding_balance, phone')
        .gt('outstanding_balance', 0)
        .order('outstanding_balance', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('미수금 거래처 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtClients();

    const channel = supabase
      .channel('debt-clients-widget')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => { fetchDebtClients(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const displayClients = showAll ? clients : clients.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return null;
  }

  const totalDebt = clients.reduce((s, c) => s + c.outstanding_balance, 0);

  return (
    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg shadow-sm border border-red-200 overflow-hidden">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <i className="ri-bill-line text-white text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">미수금 거래처</h3>
            <p className="text-sm text-gray-600">
              총 <span className="font-semibold text-red-600">{clients.length}개</span> 거래처
              <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                합계 ₩{totalDebt.toLocaleString()}
              </span>
            </p>
          </div>
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        >
          <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-xl text-gray-700`}></i>
        </button>
      </div>

      {/* 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    거래처명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    사업자번호
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    미수금
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayClients.map((client) => (
                  <tr key={client.id} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      {client.phone && (
                        <div className="text-xs text-gray-400">{client.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{client.business_number || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-red-600">
                        ₩{client.outstanding_balance.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        <i className="ri-error-warning-line text-xs"></i>
                        미수금
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {clients.length > 5 && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  {showAll ? (
                    <><i className="ri-arrow-up-s-line"></i> 접기</>
                  ) : (
                    <><i className="ri-arrow-down-s-line"></i> {clients.length - 5}개 더보기</>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <i className="ri-information-line text-sm flex-shrink-0 mt-0.5"></i>
            <span>
              <strong>outstanding_balance &gt; 0</strong> 인 거래처입니다. 
              거래처 관리에서 잔액 조정 또는 결제 요청을 진행해주세요.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
