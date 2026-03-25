import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase';

interface PhotoOrder {
  id: string;
  client_id: string;
  client_name: string;
  order_number: string;
  status: string;
  order_date: string;
  notes: string;
  parsedNotes?: {
    text_order?: string;
    images?: string[];
    delivery_type?: string;
    delivery_info?: string;
    lab_name?: string;
    memo?: string;
    submitted_at?: string;
  };
}

const PHOTO_STATUSES = ['photo_order', 'photo_confirmed', 'photo_completed'];

const STATUS_LABEL: Record<string, string> = {
  photo_order: '주문접수',
  photo_confirmed: '확인중',
  photo_completed: '처리완료',
};

const STATUS_COLORS: Record<string, string> = {
  photo_order: 'bg-amber-100 text-amber-700 border-amber-200',
  photo_confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  photo_completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_FLOW = ['photo_order', 'photo_confirmed', 'photo_completed'];

const fetchPhotoOrders = async (): Promise<PhotoOrder[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, client_id, client_name, order_number, status, order_date, notes')
    .in('status', PHOTO_STATUSES)
    .order('order_date', { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data || []).map((o: any) => {
    let parsedNotes: PhotoOrder['parsedNotes'] = {};
    try {
      const p = JSON.parse(o.notes || '{}');
      if (p.type === 'easy_order') parsedNotes = p;
    } catch {
      parsedNotes = {};
    }
    return { ...o, parsedNotes };
  });
};

interface LightboxProps {
  images: string[];
  initialIdx: number;
  onClose: () => void;
}

function Lightbox({ images, initialIdx, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(initialIdx);
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-4xl w-full px-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-4 text-white hover:text-gray-300 cursor-pointer"
        >
          <i className="ri-close-line text-3xl"></i>
        </button>
        <img
          src={images[idx]}
          alt={`주문사진 ${idx + 1}`}
          className="max-h-[80vh] w-full object-contain rounded-lg"
        />
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setIdx(i => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="w-10 h-10 flex items-center justify-center bg-white/20 text-white rounded-full disabled:opacity-30 hover:bg-white/30 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
            <span className="text-white text-sm font-medium">{idx + 1} / {images.length}</span>
            <button
              onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
              disabled={idx === images.length - 1}
              className="w-10 h-10 flex items-center justify-center bg-white/20 text-white rounded-full disabled:opacity-30 hover:bg-white/30 cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
          </div>
        )}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 justify-center flex-wrap">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer flex-shrink-0 ${i === idx ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PhotoOrderCardProps {
  order: PhotoOrder;
  onStatusChange: (id: string, status: string) => void;
  onOpenImage: (images: string[], idx: number) => void;
}

function PhotoOrderCard({ order, onStatusChange, onOpenImage }: PhotoOrderCardProps) {
  const n = order.parsedNotes || {};
  const images = n.images || [];
  const currentIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-[#2B5F9E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="ri-camera-line text-[#2B5F9E] text-sm"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{order.order_number}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{order.client_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {new Date(order.order_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* 텍스트 주문 내용 */}
        {n.text_order && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">주문 내용</p>
            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed break-all">{n.text_order}</pre>
          </div>
        )}

        {/* 사진 */}
        {images.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">첨부 사진 ({images.length}장)</p>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => onOpenImage(images, i)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-[#2B5F9E] transition-colors cursor-pointer relative group flex-shrink-0"
                >
                  <img src={img} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <i className="ri-zoom-in-line text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 배송 정보 */}
        {n.delivery_info && (
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
            <i className="ri-truck-line text-blue-500 flex-shrink-0"></i>
            <span>{n.delivery_info}</span>
          </div>
        )}

        {/* 메모 */}
        {n.memo && (
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-yellow-50 rounded-lg px-3 py-2">
            <i className="ri-sticky-note-line text-yellow-500 flex-shrink-0 mt-0.5"></i>
            <span>{n.memo}</span>
          </div>
        )}

        {!n.text_order && images.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-2">주문 내용 없음</p>
        )}
      </div>

      {/* Status Flow Buttons */}
      <div className="px-4 pb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">처리 단계 변경</p>
        <div className="flex items-center gap-1">
          {STATUS_FLOW.map((s, i) => {
            const isActive = order.status === s;
            const isPast = currentIdx > i;
            return (
              <button
                key={s}
                onClick={() => !isActive && onStatusChange(order.id, s)}
                disabled={isActive}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                  isActive
                    ? STATUS_COLORS[s] + ' cursor-default'
                    : isPast
                    ? 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#2B5F9E] hover:text-[#2B5F9E]'
                }`}
              >
                {i > 0 && <span className="mr-1 opacity-60">›</span>}
                {STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface Props {
  clients: { id: string; name: string }[];
}

export default function PhotoOrderTab({ clients }: Props) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: photoOrders = [], isLoading } = useQuery({
    queryKey: ['photo_orders'],
    queryFn: fetchPhotoOrders,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  const filteredOrders = useMemo(() => {
    return photoOrders.filter(o => {
      const matchStatus = !statusFilter || o.status === statusFilter;
      const matchClient = !clientFilter || o.client_id === clientFilter;
      const matchSearch = !searchTerm
        || o.order_number.toLowerCase().includes(searchTerm.toLowerCase())
        || o.client_name.toLowerCase().includes(searchTerm.toLowerCase())
        || (o.parsedNotes?.text_order || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchDate = true;
      if (dateRange.start || dateRange.end) {
        const d = new Date(o.order_date).toISOString().split('T')[0];
        if (dateRange.start && d < dateRange.start) matchDate = false;
        if (dateRange.end && d > dateRange.end) matchDate = false;
      }
      return matchStatus && matchClient && matchSearch && matchDate;
    });
  }, [photoOrders, statusFilter, clientFilter, searchTerm, dateRange]);

  const stats = useMemo(() => ({
    total: photoOrders.length,
    pending: photoOrders.filter(o => o.status === 'photo_order').length,
    confirming: photoOrders.filter(o => o.status === 'photo_confirmed').length,
    completed: photoOrders.filter(o => o.status === 'photo_completed').length,
  }), [photoOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['photo_orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
    } catch (err) {
      console.error('상태 업데이트 실패:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#2B5F9E] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-400">간편주문 내역을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIdx={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '전체 접수', value: stats.total, icon: 'ri-image-line', color: 'text-gray-700', bg: 'bg-gray-100' },
          { label: '주문접수', value: stats.pending, icon: 'ri-inbox-archive-line', color: 'text-amber-700', bg: 'bg-amber-100' },
          { label: '확인중', value: stats.confirming, icon: 'ri-eye-line', color: 'text-blue-700', bg: 'bg-blue-100' },
          { label: '처리완료', value: stats.completed, icon: 'ri-checkbox-circle-line', color: 'text-emerald-700', bg: 'bg-emerald-100' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.bg}`}>
                <i className={`${item.icon} text-sm ${item.color}`}></i>
              </div>
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
            <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* 검색 */}
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="주문번호, 거래처, 내용 검색"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2B5F9E]"
            />
          </div>
          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2B5F9E] bg-white cursor-pointer"
          >
            <option value="">전체 상태</option>
            {PHOTO_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          {/* 거래처 필터 */}
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2B5F9E] bg-white cursor-pointer"
          >
            <option value="">전체 거래처</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {/* 날짜 범위 */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
              className="flex-1 px-2 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
            />
            <span className="text-gray-400 text-xs flex-shrink-0">~</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
              className="flex-1 px-2 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
            />
          </div>
        </div>
        {(statusFilter || clientFilter || searchTerm || dateRange.start || dateRange.end) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">{filteredOrders.length}건 필터됨</span>
            <button
              onClick={() => { setStatusFilter(''); setClientFilter(''); setSearchTerm(''); setDateRange({ start: '', end: '' }); }}
              className="text-xs text-[#2B5F9E] hover:underline cursor-pointer"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* 빠른 상태 필터 탭 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${!statusFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
        >
          전체 ({stats.total})
        </button>
        {PHOTO_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${statusFilter === s ? STATUS_COLORS[s] : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
          >
            {STATUS_LABEL[s]} ({s === 'photo_order' ? stats.pending : s === 'photo_confirmed' ? stats.confirming : stats.completed})
          </button>
        ))}
      </div>

      {/* 주문 카드 목록 */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-camera-off-line text-2xl text-gray-400"></i>
          </div>
          <p className="text-sm font-semibold text-gray-500">간편주문 내역이 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">거래처가 간편주문을 접수하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className={`transition-opacity ${updatingId === order.id ? 'opacity-60 pointer-events-none' : ''}`}>
              <PhotoOrderCard
                order={order}
                onStatusChange={handleStatusChange}
                onOpenImage={(imgs, idx) => setLightbox({ images: imgs, idx })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
