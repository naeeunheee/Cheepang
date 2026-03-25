import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Papa from 'papaparse';
import AdminHeader from '../../../components/feature/AdminHeader';
import { useProducts, Product } from '../../../hooks/useProducts';
import BackButton from '../../../components/feature/BackButton';
import {
  highnessCategories,
  HignessCategory,
} from '../../../mocks/highness-catalog';
import { supabase } from '../../../lib/supabase';
import ProductEditModal from './components/ProductEditModal';

// ── 인터페이스 ──
interface UploadResult {
  success: boolean;
  newCount: number;
  updateCount: number;
  failCount: number;
  failures: Array<{ productId: string; reason: string }>;
}

interface LocalProductOption {
  id: string;
  product_id: string;
  model_code: string;
  size_info: string;
}

interface ProductOptionsStats {
  totalProducts: number;
  withOptions: number;
  withoutOptions: number;
  totalOptions: number;
}

// ── CSV 업로드 결과 모달 ──
function UploadResultModal({ result, onClose }: { result: UploadResult; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">CSV 업로드 결과</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#2B5F9E] mb-1">{result.newCount}</div>
              <div className="text-xs text-gray-600">신규 생성</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{result.updateCount}</div>
              <div className="text-xs text-gray-600">업데이트</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{result.failCount}</div>
              <div className="text-xs text-gray-600">실패</div>
            </div>
          </div>
          {result.failures.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <i className="ri-error-warning-line text-red-500"></i>실패 항목 상세
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">제품ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">실패 사유</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.failures.map((failure, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-900">{failure.productId}</td>
                        <td className="px-4 py-2 text-red-600 text-xs">{failure.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-checkbox-circle-line text-3xl text-emerald-600"></i>
              </div>
              <p className="text-sm font-medium text-gray-900">모든 제품이 성공적으로 처리되었습니다!</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-3 bg-[#2B5F9E] text-white rounded-xl font-semibold hover:bg-[#234b7d] transition-colors cursor-pointer">
            확인
          </button>
        </div>
      </div>
    </>
  );
}

// ── 카테고리 패널 ──
function CategoryPanel({ categories }: { categories: HignessCategory[]; showToast: (msg: string, type: 'success' | 'error') => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">카테고리 관리</h2>
        <p className="text-sm text-gray-500 mt-1">제품 분류 카테고리를 관리할 수 있습니다.</p>
      </div>
      <div className="space-y-3">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-gray-400 border border-gray-200 flex-shrink-0">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{cat.name_ko}</span>
                <span className="text-xs text-gray-400">/ {cat.name_en}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-[#2B5F9E]">기본</span>
              </div>
              {cat.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 규격 옵션 관리 패널 ──
function ProductOptionsPanel({
  products,
  showToast,
}: {
  products: Product[];
  showToast: (msg: string, type: 'success' | 'error') => void;
  refetchProducts: () => Promise<void>;
}) {
  const [options, setOptions] = useState<LocalProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductOptionsStats>({ totalProducts: 0, withOptions: 0, withoutOptions: 0, totalOptions: 0 });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newOption, setNewOption] = useState({ model_code: '', size_info: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with' | 'without'>('all');

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_options')
        .select('*')
        .order('product_id', { ascending: true })
        .order('model_code', { ascending: true });
      if (error) throw error;
      setOptions(data || []);
      const productIds = new Set(data?.map((opt: LocalProductOption) => opt.product_id) || []);
      setStats({
        totalProducts: products.length,
        withOptions: productIds.size,
        withoutOptions: products.length - productIds.size,
        totalOptions: data?.length || 0,
      });
    } catch {
      showToast('옵션 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOptions(); }, [products.length]);

  const handleDownloadTemplate = () => {
    const headers = ['product_id', 'model_code', 'size_info'];
    const sampleRows = [
      [products[0]?.id || 'uuid-example-1', 'HN-BA-01', 'Ø3.5 × 10mm'],
      [products[0]?.id || 'uuid-example-1', 'HN-BA-02', 'Ø4.0 × 12mm'],
      [products[1]?.id || 'uuid-example-2', 'HN-AA-01', 'Ø3.5 × 8mm'],
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(row => row.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product_options_template_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV 템플릿이 다운로드되었습니다.', 'success');
  };

  const processCSVData = async (rows: Record<string, string>[]) => {
    const result: UploadResult = { success: true, newCount: 0, updateCount: 0, failCount: 0, failures: [] };
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        const productId = row['product_id']?.trim() || row['제품ID']?.trim();
        const modelCode = row['model_code']?.trim() || row['모델코드']?.trim();
        const sizeInfo = row['size_info']?.trim() || row['규격']?.trim();
        if (!productId) { result.failures.push({ productId: `행 ${index + 2}`, reason: '제품 ID가 누락되었습니다' }); result.failCount++; continue; }
        if (!modelCode) { result.failures.push({ productId: `행 ${index + 2}`, reason: '모델코드가 누락되었습니다' }); result.failCount++; continue; }
        const { data: existing } = await supabase.from('product_options').select('id').eq('product_id', productId).eq('model_code', modelCode).maybeSingle();
        if (existing) {
          const { error } = await supabase.from('product_options').update({ size_info: sizeInfo }).eq('id', existing.id);
          if (error) throw error;
          result.updateCount++;
        } else {
          const { error } = await supabase.from('product_options').insert({ product_id: productId, model_code: modelCode, size_info: sizeInfo });
          if (error) throw error;
          result.newCount++;
        }
      } catch (error) {
        result.failures.push({ productId: `행 ${index + 2}`, reason: error instanceof Error ? error.message : '알 수 없는 오류' });
        result.failCount++;
      }
    }
    await fetchOptions();
    setUploadResult(result);
    if (result.failCount === 0) showToast(`CSV 업로드 완료: 신규 ${result.newCount}개, 업데이트 ${result.updateCount}개`, 'success');
    else showToast(`CSV 업로드 완료 (일부 실패: ${result.failCount}개)`, 'error');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { showToast('CSV 파일만 업로드 가능합니다.', 'error'); return; }
    Papa.parse(file, {
      header: true, skipEmptyLines: true, encoding: 'UTF-8',
      complete: (results) => processCSVData(results.data as Record<string, string>[]),
      error: (error) => showToast(`CSV 파싱 오류: ${error.message}`, 'error'),
    });
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  };

  const handleAddOption = async () => {
    if (!selectedProductId || !newOption.model_code || !newOption.size_info) { showToast('모든 필드를 입력해주세요.', 'error'); return; }
    setIsAdding(true);
    try {
      const { data: existing } = await supabase.from('product_options').select('id').eq('product_id', selectedProductId).eq('model_code', newOption.model_code).maybeSingle();
      if (existing) { showToast('이미 존재하는 품목코드입니다.', 'error'); return; }
      const { error } = await supabase.from('product_options').insert({ product_id: selectedProductId, model_code: newOption.model_code, size_info: newOption.size_info });
      if (error) throw error;
      showToast('옵션이 추가되었습니다.', 'success');
      setNewOption({ model_code: '', size_info: '' });
      setSelectedProductId('');
      await fetchOptions();
    } catch { showToast('옵션 추가에 실패했습니다.', 'error'); }
    finally { setIsAdding(false); }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('이 옵션을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('product_options').delete().eq('id', optionId);
      if (error) throw error;
      showToast('옵션이 삭제되었습니다.', 'success');
      await fetchOptions();
    } catch { showToast('옵션 삭제에 실패했습니다.', 'error'); }
  };

  const filteredProducts = (() => {
    const map = new Map<string, number>();
    options.forEach(opt => map.set(opt.product_id, (map.get(opt.product_id) || 0) + 1));
    let filtered = products;
    if (searchTerm) filtered = filtered.filter(p => (p.name_ko || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || p.model_code.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType === 'with') filtered = filtered.filter(p => map.has(p.id));
    else if (filterType === 'without') filtered = filtered.filter(p => !map.has(p.id));
    return filtered.map(p => ({ ...p, optionCount: map.get(p.id) || 0 }));
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#2B5F9E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: 'ri-box-3-line', color: 'bg-blue-50 text-[#2B5F9E]', value: stats.totalProducts, label: '전체 제품' },
          { icon: 'ri-checkbox-circle-line', color: 'bg-emerald-50 text-emerald-600', value: stats.withOptions, label: '옵션 등록됨' },
          { icon: 'ri-alert-line', color: 'bg-orange-50 text-orange-600', value: stats.withoutOptions, label: '옵션 미등록' },
          { icon: 'ri-list-check', color: 'bg-purple-50 text-purple-600', value: stats.totalOptions, label: '총 옵션 수' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color.split(' ')[0]}`}>
                <i className={`${item.icon} text-xl ${item.color.split(' ')[1]}`}></i>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="ri-upload-cloud-line text-[#2B5F9E]"></i>CSV 일괄 업로드 (옵션)
            </h3>
            <p className="text-sm text-gray-500 mt-1">product_id, model_code, size_info 컬럼이 포함된 CSV 파일을 업로드하세요.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-download-2-line"></i>템플릿 다운로드
            </button>
            <button onClick={() => csvFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-upload-2-line"></i>CSV 업로드
            </button>
            <input ref={csvFileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-lg text-[#2B5F9E] flex-shrink-0 mt-0.5"></i>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium text-gray-900">CSV 파일 형식 안내</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-600">
                <li><strong>product_id</strong>: 제품의 UUID</li>
                <li><strong>model_code</strong>: 품목코드 (예: HN-BA-01)</li>
                <li><strong>size_info</strong>: 규격 정보 (예: Ø3.5 × 10mm)</li>
                <li>동일한 product_id + model_code 조합이 있으면 size_info가 업데이트됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <i className="ri-add-circle-line text-[#2B5F9E]"></i>개별 옵션 추가
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer">
            <option value="">제품 선택</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name_ko || p.name} ({p.model_code})</option>)}
          </select>
          <input type="text" value={newOption.model_code} onChange={(e) => setNewOption({ ...newOption, model_code: e.target.value })} placeholder="품목코드 (예: HN-BA-01)" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]" />
          <input type="text" value={newOption.size_info} onChange={(e) => setNewOption({ ...newOption, size_info: e.target.value })} placeholder="규격 (예: Ø3.5 × 10mm)" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]" />
          <button onClick={handleAddOption} disabled={isAdding} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2B5F9E] text-white rounded-lg text-sm font-medium hover:bg-[#234b7d] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap">
            <i className="ri-add-line"></i>{isAdding ? '추가 중...' : '옵션 추가'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" placeholder="제품명, 모델명으로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'with' | 'without')} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer">
            <option value="all">전체 제품</option>
            <option value="with">옵션 등록된 제품만</option>
            <option value="without">옵션 미등록 제품만</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-list-settings-line text-[#2B5F9E]"></i>제품별 옵션 현황
            <span className="text-sm font-normal text-gray-500">({filteredProducts.length}개 제품)</span>
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-inbox-line text-3xl text-gray-400"></i>
              </div>
              <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const productOptions = options.filter(opt => opt.product_id === product.id);
              return (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={product.image_url} alt={product.name_ko || product.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/highness/placeholder.png'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-sm">{product.name_ko || product.name}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#2B5F9E]">{product.model_code}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.optionCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                          {product.optionCount}개 옵션
                        </span>
                      </div>
                      {productOptions.length === 0 ? (
                        <p className="text-xs text-gray-400">등록된 옵션이 없습니다.</p>
                      ) : (
                        <div className="space-y-2">
                          {productOptions.map((opt) => (
                            <div key={opt.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-0.5">품목코드</p>
                                  <p className="text-sm font-medium text-gray-900 font-mono">{opt.model_code}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-0.5">규격</p>
                                  <p className="text-sm font-medium text-gray-900">{opt.size_info}</p>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteOption(opt.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0">
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {uploadResult && <UploadResultModal result={uploadResult} onClose={() => setUploadResult(null)} />}
    </div>
  );
}

// ── 드래그 가능한 제품 행 ──
function SortableProductRow({
  product,
  isDragMode,
  onEdit,
  onToggleStatus,
}: {
  product: Product;
  isDragMode: boolean;
  onEdit: (p: Product) => void;
  onToggleStatus: (p: Product) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 transition-colors ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
    >
      {isDragMode && (
        <td className="px-3 py-3 w-10">
          <div
            {...attributes}
            {...listeners}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className="ri-draggable text-lg"></i>
          </div>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={product.image_url || '/assets/highness/placeholder.png'}
              alt={product.name_ko || product.name}
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/highness/placeholder.png'; }}
            />
          </div>
          <div>
            <span className="font-medium text-gray-900 text-sm block">{product.name_ko || product.name}</span>
            {product.short_description && (
              <span className="text-xs text-gray-400 truncate max-w-[200px] block">{product.short_description}</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gray-600">{product.model_code}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{product.category_id}</span>
      </td>
      <td className="px-4 py-3 text-gray-900 font-medium">{product.unit_price?.toLocaleString()}원</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {product.status === 'active' ? '활성' : '비활성'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B5F9E]/10 text-[#2B5F9E] rounded-lg text-xs font-medium hover:bg-[#2B5F9E]/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-edit-line"></i>수정
          </button>
          <button
            onClick={() => onToggleStatus(product)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${product.status === 'active' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            {product.status === 'active' ? '비활성화' : '활성화'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── 제품 목록 패널 ──
function ProductListPanel({
  products,
  loading,
  showToast,
  refetchProducts,
}: {
  products: Product[];
  loading: boolean;
  showToast: (msg: string, type: 'success' | 'error') => void;
  refetchProducts: () => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [isDragMode, setIsDragMode] = useState(false);
  const [sortedProducts, setSortedProducts] = useState<Product[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setSortedProducts(products);
  }, [products]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSortedProducts(prev => {
      const oldIndex = prev.findIndex(p => p.id === active.id);
      const newIndex = prev.findIndex(p => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const updates = sortedProducts.map((p, idx) =>
        supabase.from('products').update({ sort_order: idx + 1, updated_at: new Date().toISOString() }).eq('id', p.id)
      );
      await Promise.all(updates);
      await refetchProducts();
      showToast('정렬 순서가 저장되었습니다.', 'success');
      setIsDragMode(false);
    } catch {
      showToast('정렬 저장에 실패했습니다.', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelDrag = () => {
    setSortedProducts(products);
    setIsDragMode(false);
  };

  const processProductCSVData = async (rows: Record<string, string>[]) => {
    const result: UploadResult = { success: true, newCount: 0, updateCount: 0, failCount: 0, failures: [] };
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        const productId = row['product_id']?.trim() || row['제품ID']?.trim();
        const nameKo = row['name_ko']?.trim() || row['제품명(한글)']?.trim();
        const modelCode = row['model_code']?.trim() || row['모델코드']?.trim();
        if (!modelCode) { result.failures.push({ productId: `행 ${index + 2}`, reason: '필수 필드(model_code)가 누락되었습니다' }); result.failCount++; continue; }
        const productData: Record<string, unknown> = {};
        if (nameKo) { productData.name_ko = nameKo; productData.name = nameKo; }
        if (row['name_en']?.trim()) productData.name_en = row['name_en'].trim();
        productData.model_code = modelCode;
        if (row['category_id']?.trim()) productData.category_id = row['category_id'].trim();
        if (row['short_description']?.trim()) productData.short_description = row['short_description'].trim();
        if (row['image_url']?.trim()) productData.image_url = row['image_url'].trim();
        const priceStr = row['unit_price']?.trim() || row['단가']?.trim();
        if (priceStr) { const parsed = Number(priceStr.replace(/,/g, '')); if (!isNaN(parsed)) productData.unit_price = parsed; }
        const statusStr = row['status']?.trim();
        if (statusStr === 'active' || statusStr === 'inactive') productData.status = statusStr;

        if (productId) {
          const { error } = await supabase.from('products').upsert({ id: productId, ...productData }, { onConflict: 'id' });
          if (error) throw error;
          result.updateCount++;
        } else {
          const { data: existing } = await supabase.from('products').select('id').eq('model_code', modelCode).maybeSingle();
          if (existing) {
            const { error } = await supabase.from('products').update(productData).eq('id', existing.id);
            if (error) throw error;
            result.updateCount++;
          } else {
            const { error } = await supabase.from('products').insert({ ...productData, stock: 999 });
            if (error) throw error;
            result.newCount++;
          }
        }
      } catch (error) {
        result.failures.push({ productId: row['model_code']?.trim() || `행 ${index + 2}`, reason: error instanceof Error ? error.message : '알 수 없는 오류' });
        result.failCount++;
      }
    }
    await refetchProducts();
    setUploadResult(result);
    if (result.failCount === 0) showToast(`CSV 업로드 완료: 신규 ${result.newCount}개, 업데이트 ${result.updateCount}개`, 'success');
    else showToast(`CSV 업로드 완료 (일부 실패: ${result.failCount}개)`, 'error');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { showToast('CSV 파일만 업로드 가능합니다.', 'error'); return; }
    Papa.parse(file, {
      header: true, skipEmptyLines: true, encoding: 'UTF-8',
      complete: (results) => processProductCSVData(results.data as Record<string, string>[]),
      error: (error) => showToast(`CSV 파싱 오류: ${error.message}`, 'error'),
    });
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', product.id);
      if (error) throw error;
      await refetchProducts();
      showToast('제품 상태가 변경되었습니다.', 'success');
    } catch { showToast('상태 변경에 실패했습니다.', 'error'); }
  };

  const displayProducts = isDragMode ? sortedProducts : sortedProducts.filter(p => {
    const matchSearch = !searchTerm || (p.name_ko || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || p.model_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'fixture', name: '픽스쳐' },
    { id: 'abutment', name: '어버트먼트' },
    { id: 'scanbody', name: '스캔바디' },
    { id: 'link', name: '링크' },
    { id: 'gauge-kit', name: '게이지·키트·드라이버류' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#2B5F9E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 & 액션 바 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {isDragMode ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="ri-drag-move-line text-amber-600"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">드래그 정렬 모드</p>
                <p className="text-xs text-gray-500">행을 드래그하여 순서를 변경하세요</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelDrag}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isSavingOrder ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>저장 중...</>
                ) : (
                  <><i className="ri-save-line"></i>순서 저장</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input type="text" placeholder="제품명, 모델코드 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]" />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer">
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
            <button
              onClick={() => setIsDragMode(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-drag-move-line"></i>순서 변경
            </button>
            <button
              onClick={() => setEditingProduct(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line"></i>신규 추가
            </button>
            <button onClick={() => csvFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-[#2B5F9E] text-white rounded-lg text-sm font-medium hover:bg-[#234b7d] transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-upload-2-line"></i>CSV 업로드
            </button>
            <input ref={csvFileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </div>
        )}
      </div>

      {/* 제품 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">총 {displayProducts.length}개 제품</span>
          {isDragMode && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <i className="ri-information-line"></i>
              드래그 핸들을 잡고 이동하세요
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {isDragMode && <th className="px-3 py-3 w-10"></th>}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">제품</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">모델코드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">카테고리</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">단가</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <SortableContext
                items={displayProducts.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-gray-100">
                  {displayProducts.map((product) => (
                    <SortableProductRow
                      key={product.id}
                      product={product}
                      isDragMode={isDragMode}
                      onEdit={setEditingProduct}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
          {displayProducts.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-inbox-line text-3xl text-gray-400"></i>
              </div>
              <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {uploadResult && <UploadResultModal result={uploadResult} onClose={() => setUploadResult(null)} />}

      {editingProduct !== undefined && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSaved={refetchProducts}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── 메인 페이지 컴포넌트 ──
export default function ProductsManagementPage() {
  const { products, loading, refetch } = useProducts();
  const [activeTab, setActiveTab] = useState<'products' | 'options' | 'categories'>('products');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const categories = highnessCategories.sort((a, b) => a.sort_order - b.sort_order);

  const tabs = [
    { id: 'products' as const, label: '제품 목록', icon: 'ri-box-3-line' },
    { id: 'options' as const, label: '규격 옵션 관리', icon: 'ri-list-settings-line' },
    { id: 'categories' as const, label: '카테고리', icon: 'ri-folder-line' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
          <p className="text-sm text-gray-500 mt-1">제품 목록, 규격 옵션, 카테고리를 관리합니다.</p>
        </div>

        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'bg-[#2B5F9E] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <ProductListPanel products={products} loading={loading} showToast={showToast} refetchProducts={refetch} />
        )}
        {activeTab === 'options' && (
          <ProductOptionsPanel products={products} showToast={showToast} refetchProducts={refetch} />
        )}
        {activeTab === 'categories' && (
          <CategoryPanel categories={categories} showToast={showToast} />
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <i className={toast.type === 'success' ? 'ri-checkbox-circle-line text-lg' : 'ri-error-warning-line text-lg'}></i>
          {toast.message}
        </div>
      )}
    </div>
  );
}
