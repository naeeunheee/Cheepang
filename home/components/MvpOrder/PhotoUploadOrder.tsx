import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';

interface UploadedFile {
  file: File;
  preview: string;
  name: string;
  size: number;
}

type DeliveryType = '치과배송' | '기공소배송' | '기타';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function genOrderNumber(): string {
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `EZ-${getDateStr()}-${rand}`;
}

export default function PhotoUploadOrder() {
  const [textOrder, setTextOrder] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('치과배송');
  const [labName, setLabName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { businessNo, clinicName, role } = useAuth();
  const sessionUser = businessNo ? { businessNo, clinicName, role } : null;

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const addFiles = useCallback((incoming: File[]) => {
    const errs: string[] = [];
    const valid: UploadedFile[] = [];
    incoming.forEach(f => {
      if (f.size > MAX_FILE_SIZE) { errs.push(`${f.name}: 10MB 초과`); return; }
      valid.push({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : '', name: f.name, size: f.size });
    });
    if (errs.length) showError(errs.join('\n'));
    setFiles(prev => {
      const merged = [...prev, ...valid];
      if (merged.length > MAX_FILES) { showError(`최대 ${MAX_FILES}개까지 가능합니다.`); return merged.slice(0, MAX_FILES); }
      return merged;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setFiles(prev => { const n = [...prev]; if (n[idx].preview) URL.revokeObjectURL(n[idx].preview); n.splice(idx, 1); return n; });
  };

  const handleSubmit = async () => {
    if (!sessionUser || sessionUser.role !== 'dental') { showError('로그인 후 이용해주세요.'); return; }
    if (!textOrder.trim() && files.length === 0) { showError('주문 내용을 입력하거나 사진을 업로드해주세요.'); return; }
    if (deliveryType === '기공소배송' && !labName.trim()) { showError('기공소명을 입력해주세요.'); return; }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const bizNo = sessionUser.businessNo.replace(/-/g, '');
      const ts = Date.now();
      const dateStr = getDateStr();
      const uploadedUrls: string[] = [];

      for (const uf of files) {
        const ext = uf.name.split('.').pop() || 'jpg';
        const path = `${bizNo}/${dateStr}_${ts}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        try {
          const { data: ud, error: ue } = await supabase.storage
            .from('photo-orders').upload(path, uf.file, { contentType: uf.file.type, upsert: false });
          if (!ue && ud) {
            const { data: urlData } = supabase.storage.from('photo-orders').getPublicUrl(ud.path);
            if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
          } else {
            console.warn('이미지 업로드 실패:', ue?.message);
          }
        } catch (e) { console.warn('업로드 오류:', e); }
      }

      const { data: clientData } = await supabase
        .from('clients').select('id, name')
        .or(`business_number.eq.${bizNo},business_no.eq.${bizNo}`)
        .limit(1).maybeSingle();

      const clientId = clientData?.id || '';
      const clientName = clientData?.name || sessionUser.clinicName || sessionUser.businessNo;
      const orderNumber = genOrderNumber();

      const deliveryInfo = deliveryType === '기공소배송'
        ? `기공소배송 — ${labName}${deliveryAddress ? ' / ' + deliveryAddress : ''}`
        : deliveryType === '기타'
        ? `기타 — ${deliveryAddress}`
        : '치과배송';

      const { error: orderError } = await supabase.from('orders').insert({
        client_id: clientId,
        client_name: clientName,
        client_business_number: bizNo,
        product_name: '간편 주문',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        status: 'photo_order',
        order_number: orderNumber,
        order_date: new Date().toISOString(),
        notes: JSON.stringify({
          type: 'easy_order',
          text_order: textOrder.trim(),
          images: uploadedUrls,
          delivery_type: deliveryType,
          delivery_address: deliveryType === '기타' ? deliveryAddress : deliveryType === '기공소배송' ? (labName + (deliveryAddress ? ' / ' + deliveryAddress : '')) : '',
          lab_name: deliveryType === '기공소배송' ? labName : '',
          memo: memo.trim(),
          delivery_info: deliveryInfo,
          submitted_at: new Date().toISOString(),
        }),
      });

      if (orderError) throw new Error(orderError.message);
      setSuccessOrder(orderNumber);
      setTextOrder(''); setFiles([]); setMemo(''); setLabName(''); setDeliveryAddress('');
    } catch (err) {
      showError(err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <i className="ri-checkbox-circle-fill text-4xl text-emerald-500"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">간편 주문이 접수되었습니다!</h3>
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 mb-4">
          <span className="text-xs text-gray-500">주문번호</span>
          <span className="text-sm font-bold text-gray-800 font-mono">{successOrder}</span>
        </div>
        <p className="text-sm text-gray-500 mb-1">담당자가 확인 후 정식 주문서를 생성합니다.</p>
        <p className="text-sm text-gray-500 mb-1">처리 완료 시 주문내역에서 확인 가능합니다.</p>
        <p className="text-sm font-semibold text-gray-700 mt-3 mb-6">
          빠른 문의:&nbsp;
          <a href="tel:010-8950-3379" className="text-[#2B5F9E] hover:underline cursor-pointer">010-8950-3379</a>
        </p>
        <button
          onClick={() => setSuccessOrder(null)}
          className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors whitespace-nowrap cursor-pointer"
        >
          추가 주문하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* 안내 배너 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <i className="ri-lightbulb-line text-amber-500 text-lg mt-0.5 flex-shrink-0"></i>
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-0.5">간편 주문 — 텍스트 또는 사진으로 빠르게</p>
          <p className="text-xs text-amber-700">
            카톡 메시지 복사 붙여넣기, 손글씨 사진, 제품 라벨 사진 모두 가능합니다.
            담당자가 확인 후 정식 주문서를 생성합니다.
          </p>
        </div>
      </div>

      {/* ─── 영역 1: 텍스트 입력 ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-[#2B5F9E] rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">1</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800">주문 내용 입력</h3>
          <span className="text-xs text-gray-400">(텍스트 또는 사진 중 택1 이상)</span>
        </div>
        <textarea
          value={textOrder}
          onChange={e => setTextOrder(e.target.value.slice(0, 2000))}
          rows={7}
          placeholder={`예시:
HDB402010 3개
HDB403010 5개
453010 30개

또는

453010=3, 451015=4, 453015=3

치과명과 배송지도 함께 적어주세요
예: 큰숲맑은샘치과 / 화이트기공소 배송`}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2B5F9E] resize-y transition-colors font-mono leading-relaxed"
          style={{ minHeight: '200px' }}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{textOrder.length}/2000</p>
      </div>

      {/* ─── 영역 2: 사진 업로드 ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-[#2B5F9E] rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">2</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800">사진 업로드</h3>
          <span className="text-xs text-gray-400">(메모지 / 주문서 / 제품 포장)</span>
        </div>

        {/* 드래그앤드롭 영역 */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-3 ${
            isDragging ? 'border-[#2B5F9E] bg-[#2B5F9E]/5' : 'border-gray-300 hover:border-[#2B5F9E] hover:bg-gray-50'
          } ${files.length >= MAX_FILES ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" capture="environment" onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }} className="hidden" />
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <i className="ri-camera-line text-xl text-gray-400"></i>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-0.5">클릭하거나 사진을 드래그하세요</p>
          <p className="text-xs text-gray-400">JPG · PNG · PDF · 최대 {MAX_FILES}개 · 파일당 10MB</p>
          <p className="text-[11px] text-[#2B5F9E] mt-1.5 font-medium">📱 모바일에서 카메라 촬영 가능</p>
          {files.length > 0 && (
            <span className="absolute top-3 right-3 bg-[#2B5F9E] text-white text-xs font-bold px-2 py-0.5 rounded-full">{files.length}/{MAX_FILES}</span>
          )}
        </div>

        {/* 썸네일 미리보기 */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {files.map((uf, idx) => (
              <div key={idx} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  {uf.preview
                    ? <img src={uf.preview} alt={uf.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><i className="ri-file-pdf-line text-2xl text-red-400"></i></div>
                  }
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <i className="ri-close-line text-xs"></i>
                </button>
                <p className="text-[9px] text-gray-400 text-center mt-0.5 truncate">{formatFileSize(uf.size)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 영역 3: 배송 정보 ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-[#2B5F9E] rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">3</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800">배송 정보</h3>
        </div>

        <div className="flex gap-2 mb-4">
          {(['치과배송', '기공소배송', '기타'] as DeliveryType[]).map(type => (
            <button
              key={type}
              onClick={() => setDeliveryType(type)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                deliveryType === type
                  ? 'bg-[#2B5F9E] text-white border-[#2B5F9E]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#2B5F9E]/40'
              }`}
            >
              {type === '치과배송' && '🏥 '}{type === '기공소배송' && '🦷 '}{type === '기타' && '📦 '}{type}
            </button>
          ))}
        </div>

        {deliveryType === '치과배송' && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            로그인 거래처 주소로 배송됩니다. 변경 사항은 메모에 적어주세요.
          </p>
        )}

        {deliveryType === '기공소배송' && (
          <div className="space-y-2">
            <input
              value={labName}
              onChange={e => setLabName(e.target.value)}
              placeholder="기공소명 (예: 화이트기공소, 유앤아이기공소)"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2B5F9E]"
            />
            <input
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="기공소 주소 (선택)"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2B5F9E]"
            />
          </div>
        )}

        {deliveryType === '기타' && (
          <input
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            placeholder="배송 주소를 입력해주세요"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2B5F9E]"
          />
        )}
      </div>

      {/* ─── 영역 4: 추가 메모 ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gray-400 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">4</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800">추가 요청사항 <span className="text-gray-400 font-normal text-xs">(선택)</span></h3>
        </div>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value.slice(0, 500))}
          rows={2}
          maxLength={500}
          placeholder="예: 택배로 보내주세요, 직배 부탁, 급한 건 먼저 처리 부탁드립니다"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2B5F9E] resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{memo.length}/500</p>
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 whitespace-pre-line">{errorMsg}</p>
        </div>
      )}

      {/* 주문 요청 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl text-base font-bold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <><i className="ri-loader-4-line animate-spin text-lg"></i>접수 중...</>
        ) : (
          <><i className="ri-send-plane-fill text-lg"></i>간편 주문 요청하기</>
        )}
      </button>

      {(!sessionUser || sessionUser.role !== 'dental') && (
        <p className="text-center text-xs text-red-500">간편 주문은 로그인 후 이용하실 수 있습니다.</p>
      )}
    </div>
  );
}
