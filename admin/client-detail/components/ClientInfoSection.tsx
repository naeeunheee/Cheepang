import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

interface ClientDetail {
  id: string;
  name?: string;
  clinic_name?: string;
  business_no?: string;
  business_number?: string;
  representative?: string;
  business_type?: string;
  business_category?: string;
  phone?: string;
  fax?: string;
  email?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  address_detail?: string;
  notes?: string;
  biz_license_url?: string;
  package_tier?: string | number | null;
  outstanding_balance?: number;
  created_at?: string;
}

const PACKAGE_OPTIONS = [
  { value: '', label: '미설정' },
  { value: '1000', label: '1000' },
  { value: '2000', label: '2000' },
  { value: '3000', label: '3000' },
  { value: '4000', label: '4000' },
  { value: '5000', label: '5000' },
  { value: '10000', label: '10000 ★VIP' },
];

interface Props {
  client: ClientDetail;
  onUpdated: (updated: Partial<ClientDetail>) => void;
}

type FormState = {
  name: string;
  representative: string;
  business_type: string;
  business_category: string;
  phone: string;
  fax: string;
  email: string;
  contact_person: string;
  contact_phone: string;
  address: string;
  address_detail: string;
  notes: string;
  package_tier: string;
};

export default function ClientInfoSection({ client, onUpdated }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    representative: '',
    business_type: '',
    business_category: '',
    phone: '',
    fax: '',
    email: '',
    contact_person: '',
    contact_phone: '',
    address: '',
    address_detail: '',
    notes: '',
    package_tier: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleEdit = () => {
    setForm({
      name: client.clinic_name || client.name || '',
      representative: client.representative || '',
      business_type: client.business_type || '',
      business_category: client.business_category || '',
      phone: client.phone || '',
      fax: client.fax || '',
      email: client.email || '',
      contact_person: client.contact_person || '',
      contact_phone: client.contact_phone || '',
      address: client.address || '',
      address_detail: client.address_detail || '',
      notes: client.notes || '',
      package_tier: client.package_tier != null ? String(client.package_tier) : '',
    });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      name: '',
      representative: '',
      business_type: '',
      business_category: '',
      phone: '',
      fax: '',
      email: '',
      contact_person: '',
      contact_phone: '',
      address: '',
      address_detail: '',
      notes: '',
      package_tier: '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatePayload: Record<string, unknown> = {
        name: form.name,
        clinic_name: form.name,
        representative: form.representative,
        business_type: form.business_type || null,
        business_category: form.business_category || null,
        phone: form.phone,
        fax: form.fax || null,
        email: form.email || null,
        contact_person: form.contact_person || null,
        contact_phone: form.contact_phone || null,
        address: form.address || null,
        address_detail: form.address_detail || null,
        notes: form.notes || null,
        package_tier: form.package_tier || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', client.id);

      if (error) throw error;

      setSaveMsg('저장 완료');
      setTimeout(() => setSaveMsg(''), 3000);
      setEditMode(false);

      onUpdated({
        name: form.name,
        clinic_name: form.name,
        representative: form.representative,
        business_type: form.business_type,
        business_category: form.business_category,
        phone: form.phone,
        fax: form.fax,
        email: form.email,
        contact_person: form.contact_person,
        contact_phone: form.contact_phone,
        address: form.address,
        address_detail: form.address_detail,
        notes: form.notes,
        package_tier: form.package_tier || null,
      });
    } catch (err) {
      console.error(err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const balance = client.outstanding_balance ?? 0;
  const displayName = client.clinic_name || client.name || '-';
  const bizNo = client.business_number || client.business_no || '-';

  const balanceDisplay = (() => {
    if (balance < 0) return { text: `잔액 ₩${Math.abs(balance).toLocaleString()}`, cls: 'text-sky-600 font-bold' };
    if (balance > 0) return { text: `미수금 ₩${balance.toLocaleString()}`, cls: 'text-red-600 font-bold' };
    return { text: '₩0', cls: 'text-gray-500' };
  })();

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-800">{value || <span className="text-gray-300">-</span>}</dd>
    </div>
  );

  const InputField = ({
    label,
    fieldKey,
    type = 'text',
  }: {
    label: string;
    fieldKey: keyof FormState;
    type?: string;
  }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[fieldKey]}
        onChange={(e) => setForm({ ...form, [fieldKey]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 mb-6">
      {saveMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold">
          <i className="ri-checkbox-circle-line text-lg"></i>
          {saveMsg}
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <i className="ri-building-2-line text-teal-600"></i>
          거래처 상세 정보
        </h2>
        {!editMode ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-edit-line"></i>수정
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg whitespace-nowrap cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
              저장
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* 기본 정보 */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <i className="ri-information-line"></i>기본 정보
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            {editMode ? (
              <>
                <InputField label="거래처명" fieldKey="name" />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">사업자번호</label>
                  <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">{bizNo}</div>
                </div>
                <InputField label="대표자" fieldKey="representative" />
                <InputField label="업태" fieldKey="business_type" />
                <InputField label="종목" fieldKey="business_category" />
              </>
            ) : (
              <>
                <Field label="거래처명" value={displayName} />
                <Field label="사업자번호" value={bizNo} />
                <Field label="대표자" value={client.representative} />
                <Field label="업태" value={client.business_type} />
                <Field label="종목" value={client.business_category} />
              </>
            )}
          </dl>
        </div>

        {/* 연락처 */}
        <div className="border-t border-gray-50 pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <i className="ri-phone-line"></i>연락처
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            {editMode ? (
              <>
                <InputField label="전화" fieldKey="phone" />
                <InputField label="팩스" fieldKey="fax" />
                <InputField label="이메일" fieldKey="email" type="email" />
                <InputField label="담당자" fieldKey="contact_person" />
                <InputField label="담당자 연락처" fieldKey="contact_phone" />
              </>
            ) : (
              <>
                <Field label="전화" value={client.phone} />
                <Field label="팩스" value={client.fax} />
                <Field label="이메일" value={client.email} />
                <Field label="담당자" value={client.contact_person} />
                <Field label="담당자 연락처" value={client.contact_phone} />
              </>
            )}
          </dl>
        </div>

        {/* 주소 */}
        <div className="border-t border-gray-50 pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <i className="ri-map-pin-line"></i>주소
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {editMode ? (
              <>
                <InputField label="주소" fieldKey="address" />
                <InputField label="상세주소" fieldKey="address_detail" />
              </>
            ) : (
              <>
                <Field label="주소" value={client.address} />
                <Field label="상세주소" value={client.address_detail} />
              </>
            )}
          </dl>
        </div>

        {/* 거래 정보 */}
        <div className="border-t border-gray-50 pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <i className="ri-exchange-dollar-line"></i>거래 정보
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            {editMode ? (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">패키지</label>
                  <select
                    value={form.package_tier}
                    onChange={(e) => setForm({ ...form, package_tier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                  >
                    {PACKAGE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">잔액</label>
                  <div className={`text-sm px-3 py-2 bg-gray-50 rounded-lg ${balanceDisplay.cls}`}>
                    {balanceDisplay.text}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">가입일</label>
                  <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString('ko-KR') : '-'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field label="패키지" value={client.package_tier != null ? String(client.package_tier) : '미설정'} />
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">잔액</dt>
                  <dd className={`text-sm ${balanceDisplay.cls}`}>{balanceDisplay.text}</dd>
                </div>
                <Field label="가입일" value={client.created_at ? new Date(client.created_at).toLocaleDateString('ko-KR') : '-'} />
              </>
            )}
          </dl>
        </div>

        {/* 기타 */}
        <div className="border-t border-gray-50 pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <i className="ri-file-text-line"></i>기타
          </h3>
          {editMode ? (
            <div>
              <label className="block text-xs text-gray-500 mb-1">비고</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 resize-none"
                placeholder="비고 입력..."
                maxLength={500}
              />
            </div>
          ) : (
            <Field label="비고" value={client.notes} />
          )}
          {client.biz_license_url && (
            <div className="mt-4">
              <dt className="text-xs text-gray-400 mb-2">사업자등록증</dt>
              <a
                href={client.biz_license_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-medium transition-colors cursor-pointer mb-2"
              >
                <i className="ri-file-text-line"></i>사업자등록증 보기
                <i className="ri-external-link-line text-[10px]"></i>
              </a>
              <div className="max-w-xs">
                <img
                  src={client.biz_license_url}
                  alt="사업자등록증"
                  className="w-full rounded-lg border border-gray-200 object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
