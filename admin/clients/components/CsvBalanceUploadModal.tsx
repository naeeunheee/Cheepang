import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../../../lib/supabase';

interface ClientRecord {
  id: string;
  name: string;
  clinic_name: string;
  business_no: string;
  outstanding_balance: number;
}

interface CsvBalanceUploadModalProps {
  clients: ClientRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewRow {
  clinicName: string;
  bizNo: string;
  currentBalance: number;
  newBalance: number;
  changeAmount: number;
  matched: boolean;
  clientId: string;
}

const cleanBiz = (b: string) => String(b || '').replace(/-/g, '').trim();

export default function CsvBalanceUploadModal({ clients, onClose, onSuccess }: CsvBalanceUploadModalProps) {
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [reason, setReason] = useState('');
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ applied: number; unmatched: number } | null>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setPreview([]);
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data as any[];
        if (!rows.length) { setError('파일이 비어있습니다.'); return; }

        const parsed: PreviewRow[] = rows.map(row => {
          const rawBiz = String(row['사업자번호'] || row['business_number'] || row['사업자'] || '').trim();
          const rawBal = String(row['잔액'] || row['outstanding_balance'] || row['balance'] || '0').replace(/[^0-9.-]/g, '');
          const newBal = Number(rawBal) || 0;
          const cleanedBiz = cleanBiz(rawBiz);

          const matched = clients.find(c =>
            cleanBiz(c.business_no) === cleanedBiz
          );

          return {
            clinicName: matched ? (matched.clinic_name || matched.name) : rawBiz || '미매칭',
            bizNo: rawBiz,
            currentBalance: matched ? (matched.outstanding_balance ?? 0) : 0,
            newBalance: newBal,
            changeAmount: matched ? newBal - (matched.outstanding_balance ?? 0) : 0,
            matched: !!matched,
            clientId: matched?.id ?? '',
          };
        });
        setPreview(parsed);
      },
      error: () => setError('CSV 파일을 읽는 중 오류가 발생했습니다.'),
    });
  };

  const matchedCount = preview.filter(r => r.matched).length;
  const unmatchedCount = preview.filter(r => !r.matched).length;

  const handleApply = async () => {
    if (!reason.trim()) { setError('사유를 입력해주세요.'); return; }
    if (!matchedCount) { setError('매칭된 거래처가 없습니다.'); return; }
    setApplying(true);
    setError('');
    let applied = 0;
    const matched = preview.filter(r => r.matched);
    for (const row of matched) {
      try {
        const client = clients.find(c => c.id === row.clientId);
        await supabase.from('clients').update({ outstanding_balance: row.newBalance }).eq('id', row.clientId);
        await supabase.from('balance_logs').insert([{
          client_id: row.clientId,
          client_name: row.clinicName,
          business_number: row.bizNo,
          previous_balance: row.currentBalance,
          new_balance: row.newBalance,
          change_amount: row.changeAmount,
          change_type: 'csv_upload',
          reason: reason.trim(),
          admin_name: '관리자',
          created_at: new Date().toISOString(),
        }]);
        applied++;
      } catch { /* skip */ }
    }
    setResult({ applied, unmatched: unmatchedCount });
    setApplying(false);
    onSuccess();
  };

  const getBalanceText = (bal: number) => {
    if (bal < 0) return { t: `₩${Math.abs(bal).toLocaleString()} 사용가능`, cls: 'text-blue-600' };
    if (bal > 0) return { t: `₩${bal.toLocaleString()} 미수금`, cls: 'text-red-600' };
    return { t: '₩0', cls: 'text-gray-400' };
  };

  if (result) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose}></div>
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-checkbox-circle-fill text-teal-500 text-3xl"></i>
          </div>
          <h3 className="text-lg font-bold mb-2">적용 완료</h3>
          <p className="text-sm text-gray-500 mb-4">
            총 {preview.length}건 중 <strong className="text-teal-600">{result.applied}건 적용</strong>,
            {result.unmatched > 0 && <> <strong className="text-red-500">{result.unmatched}건 미매칭</strong></>}
          </p>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm cursor-pointer whitespace-nowrap">확인</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-base font-bold text-gray-900">잔액 일괄 업로드</h3>
            <p className="text-xs text-gray-400 mt-0.5">CSV 파일로 잔액을 일괄 업데이트합니다</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400">
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* CSV 형식 안내 */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <p className="text-xs font-bold text-sky-700 mb-2">CSV 파일 형식</p>
            <pre className="text-xs text-sky-800 bg-sky-100 rounded-lg p-3 font-mono">사업자번호,잔액{'\n'}3123229293,-500000{'\n'}1234567890,200000</pre>
            <p className="text-[11px] text-sky-600 mt-2">
              · 음수: 사용가능잔액 / 양수: 미수금<br />
              · 하이픈 포함/미포함 모두 인식
            </p>
          </div>

          {/* 파일 업로드 */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${fileName ? 'border-teal-400 bg-teal-50' : 'border-gray-300 hover:border-teal-400'}`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <i className={`text-3xl mb-1 block ${fileName ? 'ri-file-text-fill text-teal-500' : 'ri-upload-2-line text-gray-400'}`}></i>
            <p className="text-sm font-medium text-gray-600">{fileName || 'CSV 파일 선택'}</p>
            <p className="text-xs text-gray-400 mt-0.5">.csv 파일만 지원</p>
          </div>

          {/* 사유 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              사유 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="예: 2026년 3월 이카운트 잔액 동기화"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400"
              maxLength={100}
            />
          </div>

          {/* 미리보기 테이블 */}
          {preview.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-bold text-gray-700">매칭 결과 미리보기</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">{matchedCount}건 매칭</span>
                {unmatchedCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">{unmatchedCount}건 미매칭</span>}
              </div>
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">치과명</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">사업자번호</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">기존잔액</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">새잔액</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">변동액</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((row, i) => {
                      const curD = getBalanceText(row.currentBalance);
                      const newD = getBalanceText(row.newBalance);
                      const chg = row.changeAmount;
                      return (
                        <tr key={i} className={row.matched ? 'bg-white' : 'bg-red-50/50'}>
                          <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{row.clinicName}</td>
                          <td className="px-3 py-2.5 font-mono text-gray-500 whitespace-nowrap">{row.bizNo}</td>
                          <td className={`px-3 py-2.5 text-right whitespace-nowrap ${curD.cls}`}>{row.matched ? curD.t : '-'}</td>
                          <td className={`px-3 py-2.5 text-right whitespace-nowrap font-bold ${newD.cls}`}>{row.matched ? newD.t : '-'}</td>
                          <td className={`px-3 py-2.5 text-right whitespace-nowrap ${chg < 0 ? 'text-blue-600' : chg > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {row.matched ? (chg >= 0 ? '+' : '') + chg.toLocaleString() : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {row.matched
                              ? <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-bold">매칭</span>
                              : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">미매칭</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer whitespace-nowrap">취소</button>
            <button
              onClick={handleApply}
              disabled={applying || !preview.length || !matchedCount}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {applying ? <i className="ri-loader-4-line animate-spin"></i> : `매칭 ${matchedCount}건 적용`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
