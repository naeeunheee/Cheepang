import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

interface FormState {
  product_code: string;
  product_name: string;
  consumer_price: string;
  price_1000: string;
  price_2000: string;
  price_3000: string;
  price_5000: string;
  price_10000: string;
}

const TIER_FIELDS: { key: keyof Omit<FormState, 'product_code' | 'product_name' | 'consumer_price'>; label: string; badgeCls: string }[] = [
  { key: 'price_1000', label: '1000pkg', badgeCls: 'bg-gray-100 text-gray-700' },
  { key: 'price_2000', label: '2000pkg', badgeCls: 'bg-blue-100 text-blue-700' },
  { key: 'price_3000', label: '3000pkg', badgeCls: 'bg-emerald-100 text-emerald-700' },
  { key: 'price_5000', label: '5000pkg', badgeCls: 'bg-orange-100 text-orange-700' },
  { key: 'price_10000', label: '10000pkg (VIP)', badgeCls: 'bg-red-100 text-red-700' },
];

const INITIAL: FormState = {
  product_code: '',
  product_name: '',
  consumer_price: '',
  price_1000: '',
  price_2000: '',
  price_3000: '',
  price_5000: '',
  price_10000: '',
};

function parseIntOrZero(val: string): number {
  const n = parseInt(val.replace(/,/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export default function AddProductModal({ onClose, onSaved, showToast }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.product_code.trim() || !form.product_name.trim()) {
      showToast('제품코드와 제품명은 필수 입력 항목입니다.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('price_tiers').insert({
        product_code: form.product_code.trim(),
        product_name: form.product_name.trim(),
        consumer_price: parseIntOrZero(form.consumer_price),
        price_1000: parseIntOrZero(form.price_1000),
        price_2000: parseIntOrZero(form.price_2000),
        price_3000: parseIntOrZero(form.price_3000),
        price_5000: parseIntOrZero(form.price_5000),
        price_10000: parseIntOrZero(form.price_10000),
      });
      if (error) throw error;
      showToast('제품이 추가되었습니다.', 'success');
      onSaved();
      onClose();
    } catch {
      showToast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">제품 추가</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                제품코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.product_code}
                onChange={e => set('product_code', e.target.value)}
                placeholder="예: HN-BA-01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                제품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.product_name}
                onChange={e => set('product_name', e.target.value)}
                placeholder="예: 베이스 어버트먼트"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">소비자가</label>
            <input
              type="text"
              value={form.consumer_price}
              onChange={e => set('consumer_price', e.target.value)}
              placeholder="예: 159000"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">패키지별 단가</label>
            <div className="space-y-2">
              {TIER_FIELDS.map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold w-28 justify-center shrink-0 ${f.badgeCls}`}>
                    {f.label}
                  </span>
                  <input
                    type="text"
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 text-right tabular-nums"
                  />
                  <span className="text-xs text-gray-400 shrink-0">원</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? '저장 중...' : '추가'}
          </button>
        </div>
      </div>
    </>
  );
}
