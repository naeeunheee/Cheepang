import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { supabase } from '../../../../lib/supabase';

export interface PriceTierRow {
  id: string;
  product_code: string;
  product_name: string;
  consumer_price: number;
  price_1000: number;
  price_2000: number;
  price_3000: number;
  price_5000: number;
  price_10000: number;
  sort_order: number;
}

type EditCol =
  | 'consumer_price'
  | 'price_1000'
  | 'price_2000'
  | 'price_3000'
  | 'price_5000'
  | 'price_10000';

interface EditingCell {
  rowId: string;
  col: EditCol;
}

interface Props {
  rows: PriceTierRow[];
  loading: boolean;
  searchTerm: string;
  onRefetch: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const TIER_CONFIG: {
  col: EditCol;
  label: string;
  headerBg: string;
  headerText: string;
}[] = [
  { col: 'consumer_price', label: '소비자가', headerBg: 'bg-gray-100', headerText: 'text-gray-800' },
  { col: 'price_1000', label: '1000pkg', headerBg: 'bg-gray-500', headerText: 'text-white' },
  { col: 'price_2000', label: '2000pkg', headerBg: 'bg-blue-500', headerText: 'text-white' },
  { col: 'price_3000', label: '3000pkg', headerBg: 'bg-emerald-500', headerText: 'text-white' },
  { col: 'price_5000', label: '5000pkg', headerBg: 'bg-orange-500', headerText: 'text-white' },
  { col: 'price_10000', label: '10000pkg (VIP)', headerBg: 'bg-red-500', headerText: 'text-white' },
];

export default function PriceTierTable({ rows, loading, searchTerm, onRefetch, showToast }: Props) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const filteredRows = searchTerm
    ? rows.filter(
        r =>
          r.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rows;

  const startEdit = (row: PriceTierRow, col: EditCol) => {
    setEditingCell({ rowId: row.id, col });
    setEditValue(String(row[col] ?? ''));
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async (row: PriceTierRow, col: EditCol) => {
    const cleaned = editValue.replace(/,/g, '').trim();
    const newVal = cleaned === '' ? 0 : parseInt(cleaned, 10);
    if (isNaN(newVal)) {
      cancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('price_tiers')
        .update({ [col]: newVal })
        .eq('id', row.id);
      if (error) throw error;
      showToast('저장됨', 'success');
      onRefetch();
    } catch {
      showToast('저장에 실패했습니다.', 'error');
    } finally {
      setIsSaving(false);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, row: PriceTierRow, col: EditCol) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(row, col);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 bg-gray-50 w-10">순번</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 bg-gray-50">제품코드</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 bg-gray-50 min-w-[140px]">제품명</th>
              {TIER_CONFIG.map(tc => (
                <th
                  key={tc.col}
                  className={`px-4 py-3 text-center text-xs font-bold ${tc.headerBg} ${tc.headerText} min-w-[110px]`}
                >
                  {tc.label}
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-medium text-gray-400 bg-gray-50 w-14 text-center">안내</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <i className="ri-price-tag-3-line text-4xl text-gray-300"></i>
                    <p className="text-sm">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 단가 데이터가 없습니다.'}
                    </p>
                    {!searchTerm && (
                      <p className="text-xs">위의 &quot;제품 추가&quot; 버튼으로 시작해보세요.</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                      {row.product_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm">{row.product_name}</td>

                  {TIER_CONFIG.map(tc => {
                    const isEditing =
                      editingCell?.rowId === row.id && editingCell?.col === tc.col;
                    const val = row[tc.col] as number;
                    return (
                      <td
                        key={tc.col}
                        className="px-2 py-2 text-center cursor-pointer"
                        onClick={() => !isEditing && !isSaving && startEdit(row, tc.col)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => handleKeyDown(e, row, tc.col)}
                            onBlur={() => saveEdit(row, tc.col)}
                            disabled={isSaving}
                            className="w-24 px-2 py-1.5 border-2 border-teal-500 rounded-lg text-sm text-center focus:outline-none font-medium"
                          />
                        ) : (
                          <div className="group inline-flex items-center justify-center gap-1">
                            <span className={`font-medium tabular-nums ${val ? 'text-gray-900' : 'text-gray-300'}`}>
                              {val ? `₩${val.toLocaleString()}` : '—'}
                            </span>
                            <i className="ri-pencil-line text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-3 py-3 text-center">
                    <span className="text-[10px] text-gray-300">클릭 편집</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
