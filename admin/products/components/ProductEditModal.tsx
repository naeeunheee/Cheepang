import { useState, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Product } from '../../../../hooks/useProducts';

interface ProductEditModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const CATEGORIES = [
  { id: 'abutment', name: '어버트먼트' },
  { id: 'scanbody', name: '스캔바디' },
  { id: 'link', name: '링크 어버트먼트' },
  { id: 'gauge-kit', name: '게이지 & 키트' },
  { id: 'fixture', name: '픽스쳐' },
];

export default function ProductEditModal({ product, onClose, onSaved, showToast }: ProductEditModalProps) {
  const isNew = !product;
  const [activeTab, setActiveTab] = useState<'basic' | 'detail' | 'specs' | 'image'>('basic');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const specImageInputRef = useRef<HTMLInputElement>(null);

  // 기본 정보
  const [nameKo, setNameKo] = useState(product?.name_ko || product?.name || '');
  const [nameEn, setNameEn] = useState(product?.name_en || '');
  const [modelCode, setModelCode] = useState(product?.model_code || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || 'abutment');
  const [unitPrice, setUnitPrice] = useState(String(product?.unit_price ?? ''));
  const [status, setStatus] = useState<'active' | 'inactive'>(product?.status || 'active');
  const [sortOrder, setSortOrder] = useState(String(product?.sort_order ?? ''));

  // 상세 설명
  const [shortDescription, setShortDescription] = useState(product?.short_description || '');
  const [description, setDescription] = useState(product?.description || '');
  const [featuresText, setFeaturesText] = useState(() => {
    if (product?.features_json && Array.isArray(product.features_json)) {
      return product.features_json.join('\n');
    }
    return product?.features || '';
  });

  // 규격 정보
  const [specsJson, setSpecsJson] = useState<Array<{ label: string; value: string }>>(() => {
    if (product?.specs_json && Array.isArray(product.specs_json)) return product.specs_json;
    return [];
  });
  const [diameterOptions, setDiameterOptions] = useState(product?.diameter_options || '');
  const [lengthOptions, setLengthOptions] = useState(product?.length_options || '');
  const [neckOptions, setNeckOptions] = useState(product?.neck_options || '');

  // 이미지
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [specImageUrl, setSpecImageUrl] = useState(product?.spec_image_url || '');
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>(product?.image_fit || 'contain');

  const handleImageUpload = async (file: File, type: 'main' | 'spec') => {
    if (!file.type.startsWith('image/')) { showToast('이미지 파일만 업로드 가능합니다.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('파일 크기는 5MB 이하여야 합니다.', 'error'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const tempId = product?.id || `new_${Date.now()}`;
      const fileName = `products/${tempId}_${type}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      if (type === 'main') setImageUrl(urlData.publicUrl);
      else setSpecImageUrl(urlData.publicUrl);
      showToast('이미지가 업로드되었습니다.', 'success');
    } catch {
      showToast('이미지 업로드에 실패했습니다. URL을 직접 입력해주세요.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const addSpecRow = () => setSpecsJson(prev => [...prev, { label: '', value: '' }]);
  const removeSpecRow = (idx: number) => setSpecsJson(prev => prev.filter((_, i) => i !== idx));
  const updateSpecRow = (idx: number, field: 'label' | 'value', val: string) => {
    setSpecsJson(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  };

  const handleSave = async () => {
    if (!nameKo.trim()) { showToast('제품명(한글)을 입력해주세요.', 'error'); return; }
    if (!modelCode.trim()) { showToast('모델코드를 입력해주세요.', 'error'); return; }
    const price = parseInt(unitPrice.replace(/,/g, ''), 10);
    if (isNaN(price) || price < 0) { showToast('올바른 단가를 입력해주세요.', 'error'); return; }

    setSaving(true);
    try {
      const featuresArr = featuresText.split('\n').map(s => s.trim()).filter(Boolean);
      const validSpecs = specsJson.filter(s => s.label.trim() && s.value.trim());

      const productData = {
        name_ko: nameKo.trim(),
        name: nameKo.trim(),
        name_en: nameEn.trim() || undefined,
        model_code: modelCode.trim(),
        category_id: categoryId,
        unit_price: price,
        status,
        sort_order: sortOrder ? Number(sortOrder) : undefined,
        short_description: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        features: featuresText.trim() || undefined,
        features_json: featuresArr.length > 0 ? featuresArr : undefined,
        specs_json: validSpecs.length > 0 ? validSpecs : undefined,
        diameter_options: diameterOptions.trim() || undefined,
        length_options: lengthOptions.trim() || undefined,
        neck_options: neckOptions.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        image_fit: imageFit,
        spec_image_url: specImageUrl.trim() || undefined,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { error } = await supabase.from('products').insert({ ...productData, stock: 999 });
        if (error) {
          console.error('제품 추가 실패:', error);
          throw error;
        }
        showToast('새 제품이 추가되었습니다.', 'success');
      } else {
        const { data: updated, error } = await supabase
          .from('products')
          .update({
            ...productData,
            unit_price: price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product!.id)
          .select();

        if (error) {
          console.error('제품 저장 실패:', error);
          throw error;
        }

        if (!updated || updated.length === 0) {
          console.error('제품 업데이트 실패: 매칭 행 없음 — product.id:', product!.id);
          throw new Error(`제품을 찾을 수 없습니다. (id: ${product!.id})`);
        }

        console.log('제품 저장 성공 — unit_price:', updated[0]?.unit_price, updated[0]);
        showToast('제품 정보가 저장되었습니다.', 'success');
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('handleSave 오류:', err);
      showToast(err instanceof Error ? err.message : '저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic' as const, label: '기본 정보', icon: 'ri-information-line' },
    { id: 'detail' as const, label: '상세 설명', icon: 'ri-file-text-line' },
    { id: 'specs' as const, label: '규격 정보', icon: 'ri-ruler-line' },
    { id: 'image' as const, label: '이미지', icon: 'ri-image-line' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isNew ? 'bg-emerald-50' : 'bg-[#2B5F9E]/10'}`}>
              <i className={`text-lg ${isNew ? 'ri-add-circle-line text-emerald-600' : 'ri-edit-line text-[#2B5F9E]'}`}></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{isNew ? '신규 제품 추가' : '제품 수정'}</h3>
              <p className="text-xs text-gray-500">{isNew ? '새 제품 정보를 입력하세요' : (product?.name_ko || product?.name)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0 border-b border-gray-100 pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#2B5F9E] text-[#2B5F9E] bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 기본 정보 탭 */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">제품명 (한글) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={nameKo}
                    onChange={e => setNameKo(e.target.value)}
                    placeholder="예: Base Abutment"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">제품명 (영문)</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    placeholder="예: Base Abutment"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">모델코드 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={modelCode}
                    onChange={e => setModelCode(e.target.value)}
                    placeholder="예: HN-BA"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">카테고리</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">단가 (원) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value={unitPrice}
                      onChange={e => setUnitPrice(e.target.value.replace(/[^0-9,]/g, ''))}
                      placeholder="예: 15000"
                      className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                  </div>
                  {unitPrice && !isNaN(Number(unitPrice.replace(/,/g, ''))) && (
                    <p className="text-xs text-gray-400 mt-1">{Number(unitPrice.replace(/,/g, '')).toLocaleString()}원</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">정렬 순서</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    placeholder="숫자가 작을수록 앞에 표시"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">상태</label>
                  <div className="flex gap-3">
                    {(['active', 'inactive'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                          status === s
                            ? s === 'active'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-gray-100 border-gray-300 text-gray-600'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <i className={s === 'active' ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'}></i>
                        {s === 'active' ? '활성' : '비활성'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 상세 설명 탭 */}
          {activeTab === 'detail' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">짧은 설명 (목록 카드용)</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  placeholder="예: 완벽한 보철을 위한 첫 단계"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">상세 설명</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="제품 상세 설명을 입력하세요..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  특징/장점 목록
                  <span className="ml-1 text-gray-400 font-normal">(한 줄에 하나씩 입력)</span>
                </label>
                <textarea
                  value={featuresText}
                  onChange={e => setFeaturesText(e.target.value)}
                  rows={6}
                  placeholder={"특징 1\n특징 2\n특징 3"}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 resize-none"
                />
                {featuresText && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">미리보기</p>
                    <ul className="space-y-1">
                      {featuresText.split('\n').filter(Boolean).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <i className="ri-check-line text-emerald-500 flex-shrink-0 mt-0.5"></i>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 규격 정보 탭 */}
          {activeTab === 'specs' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">직경 옵션</label>
                  <input
                    type="text"
                    value={diameterOptions}
                    onChange={e => setDiameterOptions(e.target.value)}
                    placeholder="예: 3.5,4.0,4.5,5.0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">쉼표로 구분</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">길이 옵션</label>
                  <input
                    type="text"
                    value={lengthOptions}
                    onChange={e => setLengthOptions(e.target.value)}
                    placeholder="예: 8,10,12,14"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">쉼표로 구분</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">넥 옵션</label>
                  <input
                    type="text"
                    value={neckOptions}
                    onChange={e => setNeckOptions(e.target.value)}
                    placeholder="예: Regular,Wide"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">쉼표로 구분</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">상세 규격 테이블</label>
                  <button
                    onClick={addSpecRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#2B5F9E]/10 text-[#2B5F9E] rounded-lg text-xs font-medium hover:bg-[#2B5F9E]/20 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line"></i>행 추가
                  </button>
                </div>
                {specsJson.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <i className="ri-table-line text-3xl text-gray-300 mb-2 block"></i>
                    <p className="text-sm text-gray-400">규격 항목을 추가하세요</p>
                    <button onClick={addSpecRow} className="mt-3 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap">
                      + 첫 번째 항목 추가
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {specsJson.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.label}
                          onChange={e => updateSpecRow(idx, 'label', e.target.value)}
                          placeholder="항목명 (예: 직경)"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={e => updateSpecRow(idx, 'value', e.target.value)}
                          placeholder="값 (예: 3.5mm ~ 5.0mm)"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
                        />
                        <button
                          onClick={() => removeSpecRow(idx)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 이미지 탭 */}
          {activeTab === 'image' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-3">메인 이미지</label>
                <div className="flex gap-4">
                  <div className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="메인 이미지"
                        className={`w-full h-full ${imageFit === 'cover' ? 'object-cover' : 'object-contain'} p-2`}
                        onError={e => { (e.target as HTMLImageElement).src = '/assets/highness/placeholder.png'; }}
                      />
                    ) : (
                      <div className="text-center">
                        <i className="ri-image-line text-2xl text-gray-300 block mb-1"></i>
                        <span className="text-xs text-gray-400">미리보기</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="이미지 URL 직접 입력"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <i className="ri-upload-2-line"></i>
                      {uploading ? '업로드 중...' : '파일 업로드'}
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'main'); }} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">이미지 맞춤:</span>
                      {(['contain', 'cover'] as const).map(fit => (
                        <button
                          key={fit}
                          onClick={() => setImageFit(fit)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${imageFit === fit ? 'bg-[#2B5F9E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {fit === 'contain' ? '여백 포함' : '꽉 채움'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-3">규격 이미지 (상세 페이지용)</label>
                <div className="flex gap-4">
                  <div className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {specImageUrl ? (
                      <img
                        src={specImageUrl}
                        alt="규격 이미지"
                        className="w-full h-full object-contain p-2"
                        onError={e => { (e.target as HTMLImageElement).src = '/assets/highness/placeholder.png'; }}
                      />
                    ) : (
                      <div className="text-center">
                        <i className="ri-image-2-line text-2xl text-gray-300 block mb-1"></i>
                        <span className="text-xs text-gray-400">미리보기</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={specImageUrl}
                      onChange={e => setSpecImageUrl(e.target.value)}
                      placeholder="규격 이미지 URL 직접 입력"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20"
                    />
                    <button
                      onClick={() => specImageInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <i className="ri-upload-2-line"></i>
                      {uploading ? '업로드 중...' : '파일 업로드'}
                    </button>
                    <input ref={specImageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'spec'); }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap ${isNew ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#2B5F9E] hover:bg-[#234b7d]'}`}
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>저장 중...</>
            ) : (
              <><i className={isNew ? 'ri-add-line' : 'ri-save-line'}></i>{isNew ? '제품 추가' : '저장하기'}</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
