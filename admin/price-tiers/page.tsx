import { useState, useEffect, useCallback } from 'react';
import AdminHeader from '../../../components/feature/AdminHeader';
import { supabase } from '../../../lib/supabase';
import PriceTierTable, { PriceTierRow } from './components/PriceTierTable';
import AddProductModal from './components/AddProductModal';
import BackButton from '../../../components/feature/BackButton';

export default function PriceTiersPage() {
  const [rows, setRows] = useState<PriceTierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_tiers')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setRows((data ?? []) as PriceTierRow[]);
    } catch {
      showToast('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const headers = ['제품코드', '제품명', '소비자가', '1000pkg', '2000pkg', '3000pkg', '5000pkg', '10000pkg'];
    const dataRows = rows.map(r => [
      r.product_code,
      r.product_name,
      r.consumer_price,
      r.price_1000,
      r.price_2000,
      r.price_3000,
      r.price_5000,
      r.price_10000,
    ]);
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...dataRows.map(row => row.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `price_tiers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV 파일이 다운로드되었습니다.', 'success');
  };

  const tierBadge: Record<string, string> = {
    '1000': 'bg-gray-100 text-gray-700',
    '2000': 'bg-blue-100 text-blue-700',
    '3000': 'bg-emerald-100 text-emerald-700',
    '5000': 'bg-orange-100 text-orange-700',
    '10000': 'bg-red-100 text-red-700',
  };

  const tierStats = ['1000', '2000', '3000', '5000', '10000'].map(t => ({
    tier: t,
    count: rows.filter(r => (r[`price_${t}` as keyof PriceTierRow] as number) > 0).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">단가표 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            거래처 패키지별 단가를 관리합니다. 가격 셀을 클릭하면 바로 수정할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">등록 제품 수</p>
          </div>
          {tierStats.map(({ tier, count }) => (
            <div key={tier} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${tierBadge[tier]}`}>
                  {tier === '10000' ? 'VIP' : `${tier}pkg`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 액션 바 */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="제품명 또는 제품코드 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i>제품 추가
          </button>
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <i className="ri-download-2-line"></i>CSV 내보내기
          </button>
        </div>

        {/* 편집 안내 */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
          <i className="ri-pencil-line text-teal-600"></i>
          <p className="text-xs text-teal-700">
            가격 셀을 클릭하면 바로 편집됩니다. <strong>Enter</strong>로 저장,{' '}
            <strong>Esc</strong>로 취소합니다. 수정 즉시 Supabase에 반영됩니다.
          </p>
        </div>

        {/* 테이블 */}
        <PriceTierTable
          rows={rows}
          loading={loading}
          searchTerm={searchTerm}
          onRefetch={fetchData}
          showToast={showToast}
        />

        {/* 하단 안내 */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
          <i className="ri-alert-line text-amber-500 text-lg shrink-0 mt-0.5"></i>
          <p className="text-sm text-amber-800">
            여기서 수정한 단가는 해당 패키지가 적용된 모든 거래처에 즉시 반영됩니다.
          </p>
        </div>
      </div>

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSaved={fetchData}
          showToast={showToast}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <i
            className={
              toast.type === 'success'
                ? 'ri-checkbox-circle-line text-lg'
                : 'ri-error-warning-line text-lg'
            }
          ></i>
          {toast.message}
        </div>
      )}
    </div>
  );
}
