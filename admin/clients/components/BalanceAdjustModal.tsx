import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

interface Client {
  id: string;
  name: string;
  clinic_name: string;
  business_no: string;
  outstanding_balance: number;
}

interface BalanceAdjustModalProps {
  client: Client;
  onClose: () => void;
  onSuccess: () => void;
}

type AdjustType = 'increase' | 'decrease' | 'direct';

export default function BalanceAdjustModal({ client, onClose, onSuccess }: BalanceAdjustModalProps) {
  const [adjustType, setAdjustType] = useState<AdjustType>('increase');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentBalance = client.outstanding_balance ?? 0;
  const clientName = client.clinic_name || client.name;

  const calcNewBalance = (): number => {
    const amt = Number(amount) || 0;
    if (adjustType === 'increase') return currentBalance - amt;
    if (adjustType === 'decrease') return currentBalance + amt;
    return amt; // direct
  };

  const newBalance = calcNewBalance();
  const changeAmount = newBalance - currentBalance;

  const getBalanceDisplay = (bal: number) => {
    if (bal < 0) return { text: `₩${Math.abs(bal).toLocaleString()} 사용가능`, cls: 'text-blue-600' };
    if (bal > 0) return { text: `₩${bal.toLocaleString()} 미수금`, cls: 'text-red-600' };
    return { text: '₩0', cls: 'text-gray-500' };
  };

  const currentDisplay = getBalanceDisplay(currentBalance);
  const newDisplay = getBalanceDisplay(newBalance);

  const handleSave = async () => {
    if (!reason.trim()) { setError('사유를 입력해주세요.'); return; }
    if (adjustType !== 'direct' && !Number(amount)) { setError('금액을 입력해주세요.'); return; }
    if (adjustType === 'direct' && amount === '') { setError('직접 입력할 잔액을 입력해주세요.'); return; }

    setSaving(true);
    setError('');
    try {
      const { error: updateErr } = await supabase
        .from('clients')
        .update({ outstanding_balance: newBalance })
        .eq('id', client.id);
      if (updateErr) throw updateErr;

      const changeTypeLabel = adjustType === 'increase' ? '증가' : adjustType === 'decrease' ? '차감' : '직접입력';
      await supabase.from('balance_logs').insert([{
        client_id: client.id,
        client_name: clientName,
        business_number: client.business_no,
        previous_balance: currentBalance,
        new_balance: newBalance,
        change_amount: changeAmount,
        change_type: changeTypeLabel,
        reason: reason.trim(),
        admin_name: '관리자',
        created_at: new Date().toISOString(),
      }]);

      onSuccess();
    } catch (e: any) {
      setError(e.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">잔액 조정</h3>
            <p className="text-sm text-gray-500 mt-0.5">{clientName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400">
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* 현재 잔액 */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-gray-500 mb-0.5">현재 잔액</p>
          <p className={`text-lg font-bold ${currentDisplay.cls}`}>{currentDisplay.text}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">DB 값: {currentBalance.toLocaleString()}</p>
        </div>

        {/* 조정 유형 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">조정 유형</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'increase', label: '잔액 증가', sub: '입금/충전', icon: 'ri-arrow-down-line', cls: 'text-blue-600' },
              { key: 'decrease', label: '잔액 차감', sub: '사용/정산', icon: 'ri-arrow-up-line', cls: 'text-red-500' },
              { key: 'direct',   label: '직접 입력', sub: '덮어쓰기',  icon: 'ri-edit-line',      cls: 'text-gray-600' },
            ] as { key: AdjustType; label: string; sub: string; icon: string; cls: string }[]).map(opt => (
              <button
                key={opt.key}
                onClick={() => { setAdjustType(opt.key); setAmount(''); }}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${adjustType === opt.key ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center mb-1.5 ${opt.cls}`}>
                  <i className={`${opt.icon} text-base`}></i>
                </div>
                <p className="text-xs font-bold text-gray-800 leading-tight">{opt.label}</p>
                <p className="text-[10px] text-gray-400">{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 금액 입력 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {adjustType === 'direct' ? '새 잔액 (직접 입력)' : '금액'}
            <span className="ml-1 text-gray-400 font-normal">
              {adjustType === 'direct' ? '(음수: 사용가능잔액 / 양수: 미수금)' : '(원)'}
            </span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={adjustType === 'direct' ? '예: -500000 또는 200000' : '금액 입력'}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400"
          />
          {adjustType !== 'direct' && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {[50000, 100000, 200000, 500000].map(v => (
                <button key={v} onClick={() => setAmount(String(v))} className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-600 cursor-pointer whitespace-nowrap hover:bg-gray-200">
                  {(v/10000).toFixed(0)}만
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 사유 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            사유 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="예: 3월분 정산, 이카운트 잔액 동기화"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400"
            maxLength={100}
          />
        </div>

        {/* 변경 미리보기 */}
        {amount !== '' && (
          <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
            <p className="text-xs font-semibold text-teal-700 mb-2">변경 미리보기</p>
            <div className="flex items-center gap-3">
              <div className="text-center flex-1">
                <p className="text-[10px] text-gray-400">현재</p>
                <p className={`text-sm font-bold ${currentDisplay.cls}`}>{currentDisplay.text}</p>
              </div>
              <i className="ri-arrow-right-line text-teal-500"></i>
              <div className="text-center flex-1">
                <p className="text-[10px] text-gray-400">변경 후</p>
                <p className={`text-sm font-bold ${newDisplay.cls}`}>{newDisplay.text}</p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer whitespace-nowrap">취소</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {saving ? <i className="ri-loader-4-line animate-spin"></i> : '저장'}
          </button>
        </div>
      </div>
    </>
  );
}
