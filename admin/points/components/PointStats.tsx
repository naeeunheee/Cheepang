import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function PointStats() {
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalDebt: 0,
    availableCount: 0,
    debtCount: 0,
    zeroCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('outstanding_balance');

      let totalAvailable = 0;
      let totalDebt = 0;
      let availableCount = 0;
      let debtCount = 0;
      let zeroCount = 0;

      (clients || []).forEach(c => {
        const bal = c.outstanding_balance || 0;
        if (bal < 0) { totalAvailable += Math.abs(bal); availableCount++; }
        else if (bal > 0) { totalDebt += bal; debtCount++; }
        else { zeroCount++; }
      });

      setStats({ totalAvailable, totalDebt, availableCount, debtCount, zeroCount });
    } catch (error) {
      console.error('통계 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">사용 가능 잔액 총액</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalAvailable.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats.availableCount}개 거래처</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i className="ri-wallet-3-line text-2xl text-green-600"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">미수금 총액</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.totalDebt.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats.debtCount}개 거래처</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <i className="ri-alert-line text-2xl text-red-600"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">잔액 없음</p>
            <p className="text-2xl font-bold text-gray-500">
              {stats.zeroCount}개
            </p>
            <p className="text-xs text-gray-500 mt-1">거래처</p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <i className="ri-building-line text-2xl text-gray-500"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">미수금 비율</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.debtCount + stats.availableCount > 0
                ? Math.round((stats.debtCount / (stats.debtCount + stats.availableCount + stats.zeroCount)) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">전체 거래처 대비</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <i className="ri-pie-chart-line text-2xl text-orange-600"></i>
          </div>
        </div>
      </div>
    </div>
  );
}