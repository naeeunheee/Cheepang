import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminHeader from '../../../components/feature/AdminHeader';
import BackButton from '../../../components/feature/BackButton';

interface Consultation {
  id: string;
  client_name: string | null;
  business_number: string | null;
  question: string;
  answer: string;
  category: string | null;
  created_at: string;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: '오늘',
  week: '이번 주',
  month: '이번 달',
  all: '전체',
};

const CATEGORY_COLORS: Record<string, string> = {
  '스크류 문제': 'bg-red-100 text-red-700',
  '사용법': 'bg-amber-100 text-amber-700',
  '브랜드/마케팅': 'bg-sky-100 text-sky-700',
  '가격/패키지': 'bg-emerald-100 text-emerald-700',
  '호환성': 'bg-violet-100 text-violet-700',
  '기공소/워크플로우': 'bg-orange-100 text-orange-700',
  '교합 관리': 'bg-teal-100 text-teal-700',
  '전치부 심미': 'bg-pink-100 text-pink-700',
  '시멘트 비교': 'bg-cyan-100 text-cyan-700',
  '정밀도/피팅': 'bg-indigo-100 text-indigo-700',
  'NEXTURE 제품': 'bg-lime-100 text-lime-700',
  '배송/주문': 'bg-yellow-100 text-yellow-700',
  '기타': 'bg-gray-100 text-gray-600',
};

const CATEGORY_BAR_COLORS: Record<string, string> = {
  '스크류 문제': '#EF4444',
  '사용법': '#F59E0B',
  '브랜드/마케팅': '#0EA5E9',
  '가격/패키지': '#10B981',
  '호환성': '#8B5CF6',
  '기공소/워크플로우': '#F97316',
  '교합 관리': '#14B8A6',
  '전치부 심미': '#EC4899',
  '시멘트 비교': '#06B6D4',
  '정밀도/피팅': '#6366F1',
  'NEXTURE 제품': '#84CC16',
  '배송/주문': '#EAB308',
  '임상 상담': '#A855F7',
  '기타': '#9CA3AF',
};

function getCategoryBadge(category: string | null) {
  const cat = category || '기타';
  const cls = CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {cat}
    </span>
  );
}

function getDateRangeStart(filter: DateFilter): string | null {
  const now = new Date();
  if (filter === 'today') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.toISOString();
  }
  if (filter === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const d = new Date(now.getFullYear(), now.getMonth(), diff);
    return d.toISOString();
  }
  if (filter === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString();
  }
  return null;
}

function AnswerCell({ answer }: { answer: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = answer.length > 60 ? answer.slice(0, 60) + '…' : answer;
  return (
    <div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {expanded ? answer : preview}
      </p>
      {answer.length > 60 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-teal-600 hover:underline cursor-pointer whitespace-nowrap"
        >
          {expanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  );
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [pendingStart, setPendingStart] = useState('');
  const [pendingEnd, setPendingEnd] = useState('');

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_consultations')
        .select('*')
        .order('created_at', { ascending: false });

      // 커스텀 날짜가 있으면 우선 적용, 없으면 프리셋 사용
      if (customDateStart || customDateEnd) {
        if (customDateStart) {
          query = query.gte('created_at', customDateStart + 'T00:00:00');
        }
        if (customDateEnd) {
          query = query.lte('created_at', customDateEnd + 'T23:59:59');
        }
      } else {
        const start = getDateRangeStart(dateFilter);
        if (start) {
          query = query.gte('created_at', start);
        }
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.question.toLowerCase().includes(q) ||
            (c.client_name || '').toLowerCase().includes(q) ||
            (c.business_number || '').includes(q)
        );
      }

      setConsultations(filtered);
      setTotalCount(filtered.length);
    } catch {
      setConsultations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, categoryFilter, searchQuery, customDateStart, customDateEnd]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    consultations.forEach((c) => {
      const cat = c.category || '기타';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [consultations]);

  const maxCatCount = useMemo(
    () => Math.max(...categoryStats.map(([, v]) => v), 1),
    [categoryStats]
  );

  // CSV 다운로드
  const downloadCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['일시', '거래처명', '사업자번호', '카테고리', '질문', '답변'];
    const rows = consultations.map((c) => [
      formatDate(c.created_at),
      c.client_name || '',
      c.business_number || '',
      c.category || '기타',
      `"${c.question.replace(/"/g, '""')}"`,
      `"${c.answer.replace(/"/g, '""')}"`,
    ]);
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI상담이력_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allCategories = Object.keys(CATEGORY_COLORS);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 페이지 헤더 */}
        <BackButton />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-100">
              <i className="ri-robot-2-line text-violet-600 text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI 상담 이력</h1>
              <p className="text-sm text-gray-500">거래처 AI 상담 내역 전체 조회</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {consultations.length > 0 && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: '#10B981' }}
              >
                <i className="ri-file-excel-2-line w-4 h-4 flex items-center justify-center"></i>
                Excel 다운로드
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
              <i className="ri-chat-history-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
              <span className="text-sm font-semibold text-gray-700">총 {totalCount.toLocaleString()}건</span>
            </div>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 space-y-3">
          {/* 날짜 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1 whitespace-nowrap">기간</span>
            {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setDateFilter(f); setCustomDateStart(''); setCustomDateEnd(''); setPendingStart(''); setPendingEnd(''); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  dateFilter === f && !customDateStart && !customDateEnd
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {DATE_FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          {/* 커스텀 날짜 입력 + 조회 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">직접입력</span>
            <div className="relative">
              <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs w-3 h-3 flex items-center justify-center"></i>
              <input
                type="date"
                value={pendingStart}
                onChange={(e) => setPendingStart(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 w-38 cursor-pointer"
              />
            </div>
            <span className="text-gray-400 text-sm">~</span>
            <div className="relative">
              <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs w-3 h-3 flex items-center justify-center"></i>
              <input
                type="date"
                value={pendingEnd}
                onChange={(e) => setPendingEnd(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 w-38 cursor-pointer"
              />
            </div>
            <button
              onClick={() => {
                setCustomDateStart(pendingStart);
                setCustomDateEnd(pendingEnd);
                if (pendingStart || pendingEnd) {
                  setDateFilter('all');
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-search-line text-xs"></i>
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

          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1 whitespace-nowrap">카테고리</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm w-4 h-4 flex items-center justify-center"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="거래처명 · 사업자번호 · 질문 검색"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-teal-400 transition-colors"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer whitespace-nowrap"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 카테고리별 통계 차트 */}
        {!loading && categoryStats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-bar-chart-2-line text-violet-500 w-5 h-5 flex items-center justify-center"></i>
              <h2 className="text-sm font-bold text-gray-800">카테고리별 상담 건수</h2>
              <span className="text-xs text-gray-400 ml-1">(현재 필터 기준)</span>
            </div>
            <div className="space-y-2.5">
              {categoryStats.map(([cat, count]) => {
                const barColor = CATEGORY_BAR_COLORS[cat] || '#9CA3AF';
                const widthPct = Math.max((count / maxCatCount) * 100, 4);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 font-medium whitespace-nowrap w-28 shrink-0 text-right">
                      {cat}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                        style={{ width: `${widthPct}%`, background: barColor }}
                      >
                        {widthPct > 12 && (
                          <span className="text-white text-xs font-bold">{count}</span>
                        )}
                      </div>
                    </div>
                    {widthPct <= 12 && (
                      <span className="text-xs font-bold text-gray-700 w-6 shrink-0">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">불러오는 중...</p>
              </div>
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100">
                <i className="ri-chat-off-line text-2xl text-gray-400 w-7 h-7 flex items-center justify-center"></i>
              </div>
              <p className="text-sm font-semibold text-gray-500">상담 이력이 없습니다</p>
              <p className="text-xs text-gray-400">조건을 변경하거나 상담이 진행된 후 확인해주세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap w-40">일시</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap w-32">거래처명</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap w-28">카테고리</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">질문</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">답변</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        idx % 2 === 0 ? '' : 'bg-gray-50/40'
                      }`}
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(c.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                          {c.client_name || '—'}
                        </p>
                        {c.business_number && (
                          <p className="text-xs text-gray-400 mt-0.5">{c.business_number}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {getCategoryBadge(c.category)}
                      </td>
                      <td className="px-4 py-3 align-top max-w-[220px]">
                        <p className="text-sm text-gray-800 leading-relaxed">{c.question}</p>
                      </td>
                      <td className="px-4 py-3 align-top max-w-[320px]">
                        <AnswerCell answer={c.answer} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        <div className="mt-4 px-4 py-3 rounded-xl flex items-center gap-2"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <i className="ri-information-line text-green-600 w-4 h-4 flex items-center justify-center"></i>
          <p className="text-xs text-green-700">
            상담 이력은 Supabase <strong>ai_consultations</strong> 테이블에 저장됩니다. 
            테이블이 없으면 Supabase SQL Editor에서 테이블을 먼저 생성해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
