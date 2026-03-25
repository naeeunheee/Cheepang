import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../../components/feature/BackButton';

type MethodFilter = '전체' | '카드' | '포인트' | '계좌이체';
type DatePreset = '전체' | '이번달' | '지난달' | '3개월' | '6개월';

interface PaymentRecord {
  id: string;
  provider: string;
  payment_key: string;
  order_id: string;
  amount: number;
  method: string | null;
  raw_json: Record<string, unknown> | null;
  created_at: string;
  order_number?: string;
  order_status?: string;
  invoice_id?: string;
  invoice_number?: string;
  pdf_url?: string;
}

const METHOD_LABEL: Record<string, string> = {
  card: '카드',
  '카드': '카드',
  virtualAccount: '가상계좌',
  transfer: '계좌이체',
  point: '포인트',
  '포인트': '포인트',
};

const METHOD_COLOR: Record<string, string> = {
  card: 'bg-[#2B5F9E]/10 text-[#2B5F9E] border-[#2B5F9E]/20',
  '카드': 'bg-[#2B5F9E]/10 text-[#2B5F9E] border-[#2B5F9E]/20',
  point: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '포인트': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  virtualAccount: 'bg-amber-50 text-amber-700 border-amber-200',
  transfer: 'bg-violet-50 text-violet-700 border-violet-200',
};

const METHOD_ICON: Record<string, string> = {
  card: 'ri-bank-card-line',
  '카드': 'ri-bank-card-line',
  point: 'ri-coin-line',
  '포인트': 'ri-coin-line',
  virtualAccount: 'ri-building-2-line',
  transfer: 'ri-exchange-line',
};

export default function MyPaymentsPage() {
  const navigate = useNavigate();
  const { businessNo, clinicName, role } = useAuth();
  const authUser = businessNo ? { businessNo, clinicName, role } : null;

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  const [methodFilter, setMethodFilter] = useState<MethodFilter>('전체');
  const [datePreset, setDatePreset] = useState<DatePreset>('전체');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadPayments = useCallback(async (cid: string) => {
    try {
      // orders join
      const { data: orderRows } = await supabase
        .from('orders')
        .select('id, order_number, status, client_id')
        .eq('client_id', cid);

      if (!orderRows || orderRows.length === 0) {
        setPayments([]);
        return;
      }

      const orderIds = orderRows.map((o) => o.id);

      // payments
      const { data: payRows, error } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // invoices
      const { data: invoiceRows } = await supabase
        .from('invoices')
        .select('id, order_id, invoice_number, pdf_url')
        .in('order_id', orderIds);

      const invoiceMap: Record<string, { invoice_id: string; invoice_number: string; pdf_url: string | null }> = {};
      (invoiceRows || []).forEach((inv) => {
        invoiceMap[inv.order_id] = {
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          pdf_url: inv.pdf_url,
        };
      });

      const orderMap: Record<string, { order_number: string; status: string }> = {};
      orderRows.forEach((o) => {
        orderMap[o.id] = { order_number: o.order_number, status: o.status };
      });

      const merged: PaymentRecord[] = (payRows || []).map((p) => ({
        ...p,
        order_number: orderMap[p.order_id]?.order_number,
        order_status: orderMap[p.order_id]?.status,
        invoice_id: invoiceMap[p.order_id]?.invoice_id,
        invoice_number: invoiceMap[p.order_id]?.invoice_number,
        pdf_url: invoiceMap[p.order_id]?.pdf_url ?? undefined,
      }));

      setPayments(merged);
    } catch (e) {
      console.error('결제 내역 로드 실패', e);
    }
  }, []);

  useEffect(() => {
    if (!authUser?.businessNo) {
      navigate('/login');
      return;
    }

    const init = async () => {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('business_number', authUser.businessNo)
        .maybeSingle();

      if (!client) {
        setLoading(false);
        return;
      }

      setClientId(client.id);
      await loadPayments(client.id);
      setLoading(false);
    };

    init();
  }, [authUser, navigate, loadPayments]);

  const getDateRange = (preset: DatePreset): [string, string] => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (preset) {
      case '이번달': {
        const first = new Date(y, m, 1).toISOString().split('T')[0];
        const last = new Date(y, m + 1, 0).toISOString().split('T')[0];
        return [first, last];
      }
      case '지난달': {
        const first = new Date(y, m - 1, 1).toISOString().split('T')[0];
        const last = new Date(y, m, 0).toISOString().split('T')[0];
        return [first, last];
      }
      case '3개월': {
        const first = new Date(y, m - 3, 1).toISOString().split('T')[0];
        const last = new Date(y, m, now.getDate()).toISOString().split('T')[0];
        return [first, last];
      }
      case '6개월': {
        const first = new Date(y, m - 6, 1).toISOString().split('T')[0];
        const last = new Date(y, m, now.getDate()).toISOString().split('T')[0];
        return [first, last];
      }
      default:
        return ['', ''];
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== '전체') {
      const label = METHOD_LABEL[p.method ?? ''] ?? p.method ?? '';
      if (label !== methodFilter) return false;
    }

    let rangeStart = '';
    let rangeEnd = '';
    if (datePreset !== '전체') {
      [rangeStart, rangeEnd] = getDateRange(datePreset);
    } else if (startDate && endDate) {
      rangeStart = startDate;
      rangeEnd = endDate;
    }
    if (rangeStart && rangeEnd) {
      const txDate = p.created_at.split('T')[0];
      if (txDate < rangeStart || txDate > rangeEnd) return false;
    }

    return true;
  });

  const totalAmount = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);

  const handleInvoiceDownload = async (p: PaymentRecord) => {
    if (p.pdf_url) {
      window.open(p.pdf_url, '_blank');
      return;
    }
    setDownloadingId(p.id);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/generate-invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_id: p.order_id }),
        }
      );
      if (resp.ok) {
        const result = await resp.json();
        if (result.pdf_url) {
          setPayments((prev) =>
            prev.map((x) => (x.id === p.id ? { ...x, pdf_url: result.pdf_url } : x))
          );
          window.open(result.pdf_url, '_blank');
        } else {
          showToast('청구서를 생성했습니다. PDF 링크를 가져올 수 없습니다.');
        }
      } else {
        showToast('청구서 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch {
      showToast('청구서 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-5xl text-[#2B5F9E] animate-spin mb-4"></i>
          <p className="text-gray-500 text-sm">결제 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const methodOptions: MethodFilter[] = ['전체', '카드', '포인트', '계좌이체'];
  const dateOptions: DatePreset[] = ['전체', '이번달', '지난달', '3개월', '6개월'];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <i className="ri-information-line text-base w-4 h-4 flex items-center justify-center"></i>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/" className="cursor-pointer flex-shrink-0">
            <img
              src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png"
              alt="CHIPANG Logo"
              className="h-8 sm:h-10"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link to="/my-orders" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap">
              주문내역
            </Link>
            <Link to="/my-points" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap hidden sm:inline">
              포인트
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-arrow-left-line"></i>
              <span className="hidden sm:inline">홈으로</span>
              <span className="sm:hidden">홈</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Title */}
        <BackButton />
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-receipt-line text-xl sm:text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">결제 내역</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">결제 완료된 내역과 청구서를 확인하세요</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-[#2B5F9E] to-[#3A7BC8] rounded-2xl p-5 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <i className="ri-money-dollar-circle-line text-xl w-5 h-5 flex items-center justify-center"></i>
              <span className="text-sm font-semibold opacity-90">총 결제금액</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold mb-1">₩{totalAmount.toLocaleString()}</p>
            <p className="text-xs opacity-70">조회 기간 내 결제 합계</p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <i className="ri-file-list-3-line text-xl text-[#2B5F9E] w-5 h-5 flex items-center justify-center"></i>
              <span className="text-sm font-semibold text-gray-700">결제 건수</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">{filteredPayments.length}건</p>
            <p className="text-xs text-gray-400">조회 기간 내 결제 수</p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <i className="ri-file-download-line text-xl text-emerald-500 w-5 h-5 flex items-center justify-center"></i>
              <span className="text-sm font-semibold text-gray-700">청구서 발행</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mb-1">
              {filteredPayments.filter((p) => p.pdf_url).length}건
            </p>
            <p className="text-xs text-gray-400">PDF 청구서 다운로드 가능</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">결제 수단</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {methodOptions.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      methodFilter === m
                        ? 'bg-[#2B5F9E] text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">조회 기간</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {dateOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDatePreset(d);
                      if (d === '전체') {
                        setStartDate('');
                        setEndDate('');
                      }
                    }}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      datePreset === d
                        ? 'bg-[#2B5F9E] text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {datePreset === '전체' && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 sm:gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  초기화
                </button>
              )}
            </div>
          )}
        </div>

        {/* Payment List */}
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl p-10 sm:p-16 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-receipt-line text-3xl text-gray-300"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">결제 내역이 없습니다</h3>
            <p className="text-sm text-gray-500 mb-6">
              {methodFilter !== '전체' || datePreset !== '전체' || startDate
                ? '조건에 맞는 결제 내역이 없습니다.'
                : '아직 결제한 내역이 없습니다.'}
            </p>
            <Link
              to="/#mvp-order"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B5F9E] text-white rounded-xl text-sm font-semibold hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-shopping-cart-2-line"></i>
              제품 주문하러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((p) => {
              const method = p.method ?? 'point';
              const methodLabel = METHOD_LABEL[method] ?? method;
              const methodColor = METHOD_COLOR[method] ?? 'bg-gray-100 text-gray-600 border-gray-200';
              const methodIcon = METHOD_ICON[method] ?? 'ri-money-dollar-circle-line';
              const rawJson = p.raw_json as Record<string, unknown> | null;
              const cardCompany =
                rawJson &&
                typeof rawJson === 'object' &&
                rawJson.card &&
                typeof rawJson.card === 'object'
                  ? (rawJson.card as Record<string, unknown>).company ?? null
                  : null;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#2B5F9E]/30 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-50 bg-gray-50/60">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${methodColor}`}>
                        <i className={`${methodIcon} text-sm sm:text-base`}></i>
                      </div>
                      <div className="min-w-0">
                        {p.order_number && (
                          <p className="text-[11px] sm:text-xs text-gray-400 font-mono truncate">
                            주문번호: {p.order_number}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm font-semibold text-gray-800">
                          {new Date(p.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                      <span className={`text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border ${methodColor}`}>
                        {methodLabel}
                        {cardCompany ? ` · ${String(cardCompany)}` : ''}
                      </span>
                      {p.order_status && (
                        <span className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border ${
                          p.order_status === 'paid' || p.order_status === '배송완료'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.order_status === '배송중'
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {p.order_status === 'paid' ? '결제완료' : p.order_status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">결제 금액</p>
                        <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                          ₩{Number(p.amount).toLocaleString()}
                        </p>
                      </div>
                      {p.invoice_number && (
                        <div className="border-l border-gray-100 pl-4 sm:pl-6">
                          <p className="text-xs text-gray-400 mb-0.5">청구서 번호</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-700 font-mono">{p.invoice_number}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Link
                        to={`/my-orders`}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-file-list-3-line text-sm w-4 h-4 flex items-center justify-center"></i>
                        주문 확인
                      </Link>
                      <button
                        onClick={() => handleInvoiceDownload(p)}
                        disabled={downloadingId === p.id}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          p.pdf_url
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-[#2B5F9E] text-white hover:bg-[#3A7BC8]'
                        }`}
                      >
                        {downloadingId === p.id ? (
                          <>
                            <i className="ri-loader-4-line animate-spin text-sm w-4 h-4 flex items-center justify-center"></i>
                            생성중...
                          </>
                        ) : p.pdf_url ? (
                          <>
                            <i className="ri-download-2-line text-sm w-4 h-4 flex items-center justify-center"></i>
                            청구서 PDF
                          </>
                        ) : (
                          <>
                            <i className="ri-file-pdf-line text-sm w-4 h-4 flex items-center justify-center"></i>
                            청구서 발행
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/my-orders"
            className="flex-1 sm:flex-none min-w-0 sm:min-w-fit px-4 sm:px-6 py-2.5 sm:py-3 border border-[#2B5F9E]/30 text-[#2B5F9E] rounded-xl text-xs sm:text-sm font-bold hover:bg-[#2B5F9E]/5 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-file-list-3-line w-4 h-4 flex items-center justify-center"></i>
            주문 내역 보기
          </Link>
          <Link
            to="/my-points"
            className="flex-1 sm:flex-none min-w-0 sm:min-w-fit px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 text-gray-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-coin-line w-4 h-4 flex items-center justify-center"></i>
            포인트 내역 보기
          </Link>
        </div>
      </main>
    </div>
  );
}
