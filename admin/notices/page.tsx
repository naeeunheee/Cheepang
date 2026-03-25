import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminHeader from '../../../components/feature/AdminHeader';
import AdminBottomNav from '../../../components/feature/AdminBottomNav';
import BackButton from '../../../components/feature/BackButton';

interface Notice {
  id: string;
  type: string;
  tag: string;
  tag_color: string;
  title: string;
  description: string;
  date: string;
  start_date?: string;
  end_date?: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface NoticeFormData {
  tag: string;
  tag_color: string;
  title: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

// "2025. 07. 01." 같은 브라우저 포맷 → "2025-07-01" (YYYY-MM-DD)
function toIsoDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const cleaned = d.replace(/\.\s*/g, '-').replace(/-$/, '').trim();
  // 이미 YYYY-MM-DD 이면 그대로
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  return cleaned || null;
}

// start_date, end_date (YYYY-MM-DD) → 목록 표시용 텍스트
function formatDateDisplay(startDate: string | null | undefined, endDate: string | null | undefined): string {
  if (!startDate) return '';
  const start = startDate.replace(/-/g, '.');
  if (endDate) {
    const end = endDate.replace(/-/g, '.');
    return `${start} ~ ${end}`;
  }
  return `${start} ~`;
}

// DB notice 객체에서 폼 초기값 추출
function noticeToFormData(notice: Notice): NoticeFormData {
  return {
    tag: notice.tag ?? '',
    tag_color: notice.tag_color ?? 'bg-rose-500',
    title: notice.title ?? '',
    description: notice.description ?? '',
    dateStart: toIsoDate(notice.start_date) ?? '',
    dateEnd: toIsoDate(notice.end_date) ?? '',
    icon: notice.icon ?? 'ri-megaphone-line',
    is_active: notice.is_active ?? true,
    sort_order: notice.sort_order ?? 1,
  };
}

const newForm = (order: number): NoticeFormData => ({
  tag: '이벤트',
  tag_color: 'bg-rose-500',
  title: '',
  description: '',
  dateStart: new Date().toISOString().split('T')[0],
  dateEnd: '',
  icon: 'ri-megaphone-line',
  is_active: true,
  sort_order: order,
});

export default function NoticesManagementPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<NoticeFormData>(newForm(1));
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tagColorOptions = [
    { value: 'bg-rose-500', label: '로즈 (이벤트)' },
    { value: 'bg-blue-500', label: '블루 (공지)' },
    { value: 'bg-amber-500', label: '앰버 (안내)' },
    { value: 'bg-emerald-500', label: '에메랄드' },
    { value: 'bg-purple-500', label: '퍼플' },
    { value: 'bg-teal-500', label: '틸' },
  ];

  const iconOptions = [
    'ri-megaphone-line',
    'ri-notification-line',
    'ri-information-line',
    'ri-gift-line',
    'ri-star-line',
    'ri-fire-line',
    'ri-lightbulb-line',
    'ri-calendar-line',
  ];

  useEffect(() => {
    fetchNotices();
  }, []);

  // 초기 로딩용 (스피너 표시)
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('공지사항 조회 실패:', err);
      showToast('공지사항을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 저장 후 백그라운드 리프레시 (스피너 없이 목록만 갱신)
  const refreshNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('공지사항 갱신 실패:', err);
    }
  };

  const handleOpenModal = (notice?: Notice) => {
    if (notice) {
      // DB에서 가져온 실제 값만 사용
      setEditingNotice(notice);
      setFormData(noticeToFormData(notice));
    } else {
      setEditingNotice(null);
      setFormData(newForm(notices.length + 1));
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      showToast('제목과 내용을 입력해주세요.', 'error');
      return;
    }
    if (!formData.dateStart) {
      showToast('시작 날짜를 선택해주세요.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingNotice) {
        const startDate = formData.dateStart
          ? formData.dateStart.replace(/\.\s*/g, '-').replace(/-$/, '')
          : null;
        const endDate = formData.dateEnd
          ? formData.dateEnd.replace(/\.\s*/g, '-').replace(/-$/, '')
          : null;

        const { data, error } = await supabase
          .from('notices')
          .update({
            sort_order: formData.sort_order,
            tag: formData.tag,
            tag_color: formData.tag_color,
            icon: formData.icon,
            title: formData.title,
            description: formData.description,
            start_date: startDate,
            end_date: endDate || null,
            is_active: formData.is_active,
            date: startDate && endDate ? startDate + ' ~ ' + endDate : startDate || '',
          })
          .eq('id', editingNotice.id)
          .select();

        if (error) {
          alert('저장 실패: ' + error.message);
          console.error('Notice save error:', error);
          return;
        }

        console.log('저장 성공:', data);
        alert('저장 완료');

        const { data: fresh } = await supabase
          .from('notices')
          .select('*')
          .order('sort_order', { ascending: true });
        setNotices(fresh || []);
        handleCloseModal();
      } else {
        const { error } = await supabase
          .from('notices')
          .insert([{
            sort_order: formData.sort_order,
            tag: formData.tag,
            tag_color: formData.tag_color,
            icon: formData.icon,
            title: formData.title,
            description: formData.description,
            start_date: toIsoDate(formData.dateStart),
            end_date: toIsoDate(formData.dateEnd) || null,
            is_active: formData.is_active,
          }]);

        if (error) {
          showToast('추가 실패: ' + error.message, 'error');
          return;
        }

        showToast('공지사항이 추가되었습니다.');
        handleCloseModal();
        await refreshNotices();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      alert('오류: ' + message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('공지사항이 삭제되었습니다.');
      setDeleteConfirm(null);
      await refreshNotices();
    } catch (err) {
      console.error('공지사항 삭제 실패:', err);
      showToast('공지사항 삭제에 실패했습니다.', 'error');
    }
  };

  const handleToggleActive = async (notice: Notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id);

      if (error) throw error;
      await refreshNotices();
    } catch (err) {
      console.error('활성 상태 변경 실패:', err);
      showToast('활성 상태 변경에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      {/* 토스트 메시지 */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
            toast.type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <i className={`${toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-lg`}></i>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
            <p className="text-gray-600 mt-2">홈페이지 상단 배너 공지사항을 관리합니다</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            공지 추가
          </button>
        </div>

        {/* 공지사항 목록 */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">로딩 중...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <i className="ri-notification-off-line text-6xl text-gray-300"></i>
            <p className="text-gray-600 mt-4 text-lg">등록된 공지사항이 없습니다</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              첫 공지 추가하기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">순서</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">태그</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">제목</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">날짜</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">활성</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{notice.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white ${notice.tag_color}`}>
                        <i className={`${notice.icon} text-sm`}></i>
                        {notice.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notice.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{notice.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {notice.start_date
                          ? (notice.end_date
                            ? `${notice.start_date.replace(/-/g, '.')} ~ ${notice.end_date.replace(/-/g, '.')}`
                            : `${notice.start_date.replace(/-/g, '.')} ~`)
                          : (notice.date || '-')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(notice)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notice.is_active ? 'bg-teal-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notice.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(notice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(notice.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 공지 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingNotice ? '공지사항 수정' : '공지사항 추가'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i className="ri-close-line text-2xl text-gray-600"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 순서 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  표시 순서 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">숫자가 작을수록 먼저 표시됩니다</p>
              </div>

              {/* 태그 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    태그 텍스트 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tag: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="예: 이벤트, 공지, 안내"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    태그 색상 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tag_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tag_color: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    {tagColorOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 아이콘 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  아이콘 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.icon === icon ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <i className={`${icon} text-2xl ${formData.icon === icon ? 'text-teal-600' : 'text-gray-600'}`}></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="공지사항 내용을 입력하세요"
                  required
                />
              </div>

              {/* 날짜 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  날짜 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">시작일 <span className="text-red-400">*</span></p>
                    <input
                      type="date"
                      value={formData.dateStart}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateStart: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">종료일 <span className="text-gray-400">(비우면 무기한)</span></p>
                    <input
                      type="date"
                      value={formData.dateEnd}
                      min={formData.dateStart}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateEnd: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                {formData.dateStart && (
                  <p className="mt-2 text-xs text-teal-700 font-medium">
                    저장 형식: {formatDateDisplay(formData.dateStart, formData.dateEnd)}
                  </p>
                )}
              </div>

              {/* 활성 여부 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-900">
                  {formData.is_active ? '활성 (홈페이지에 표시됨)' : '비활성 (홈페이지에 표시 안 됨)'}
                </span>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {editingNotice ? '수정 완료' : '추가 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-3xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">공지사항 삭제</h3>
              <p className="text-gray-600 mb-6">
                정말로 이 공지사항을 삭제하시겠습니까?<br />
                삭제된 데이터는 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}
