import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface InquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = '입점문의' | '신규제품';

interface InquiryFormData {
  dentalName: string;
  businessNumber: string;
  representativeName: string;
  contact: string;
  email: string;
  inquiryContent: string;
}

interface ProductFormData {
  productName: string;
  manufacturer: string;
  category: string;
  specifications: string;
  desiredPrice: string;
  attachmentFile: File | null;
}

export default function InquiryFormModal({ isOpen, onClose }: InquiryFormModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('입점문의');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // 입점문의 폼 데이터
  const [inquiryForm, setInquiryForm] = useState<InquiryFormData>({
    dentalName: '',
    businessNumber: '',
    representativeName: '',
    contact: '',
    email: '',
    inquiryContent: '',
  });

  // 신규제품 폼 데이터
  const [productForm, setProductForm] = useState<ProductFormData>({
    productName: '',
    manufacturer: '',
    category: '',
    specifications: '',
    desiredPrice: '',
    attachmentFile: null,
  });

  // 사업자번호 자동 하이픈 포맷
  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  // 입점문의 양식 다운로드
  const handleDownloadInquiryTemplate = () => {
    const template = [
      {
        '치과명': '',
        '사업자번호': '000-00-00000',
        '대표자명': '',
        '연락처': '010-0000-0000',
        '이메일': 'example@email.com',
        '문의내용': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '입점문의');
    XLSX.writeFile(wb, '입점문의_양식.xlsx');
  };

  // 신규제품 양식 다운로드
  const handleDownloadProductTemplate = () => {
    const template = [
      {
        '제품명': '',
        '제조사': '',
        '카테고리': '',
        '규격/사양': '',
        '희망단가': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '신규제품');
    XLSX.writeFile(wb, '신규제품_양식.xlsx');
  };

  // 입점문의 양식 업로드
  const handleUploadInquiryTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const row: any = jsonData[0];
          setInquiryForm({
            dentalName: row['치과명'] || '',
            businessNumber: row['사업자번호'] || '',
            representativeName: row['대표자명'] || '',
            contact: row['연락처'] || '',
            email: row['이메일'] || '',
            inquiryContent: row['문의내용'] || '',
          });
        }
      } catch (error) {
        console.error('파일 읽기 오류:', error);
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // 신규제품 양식 업로드
  const handleUploadProductTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const row: any = jsonData[0];
          setProductForm({
            ...productForm,
            productName: row['제품명'] || '',
            manufacturer: row['제조사'] || '',
            category: row['카테고리'] || '',
            specifications: row['규격/사양'] || '',
            desiredPrice: row['희망단가'] || '',
          });
        }
      } catch (error) {
        console.error('파일 읽기 오류:', error);
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // 입점문의 제출
  const handleSubmitInquiry = async () => {
    if (!inquiryForm.dentalName || !inquiryForm.businessNumber || !inquiryForm.contact) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        type: '입점문의',
        dental_name: inquiryForm.dentalName,
        business_number: inquiryForm.businessNumber,
        representative_name: inquiryForm.representativeName,
        contact: inquiryForm.contact,
        email: inquiryForm.email,
        inquiry_content: inquiryForm.inquiryContent,
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
        resetForms();
      }, 2000);
    } catch (error) {
      console.error('입점문의 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 신규제품 제출
  const handleSubmitProduct = async () => {
    if (!productForm.productName || !productForm.manufacturer || !productForm.category) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      let attachmentUrl = '';

      // 파일 업로드 (Supabase Storage 사용 시)
      if (productForm.attachmentFile) {
        const fileName = `${Date.now()}_${productForm.attachmentFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-attachments')
          .upload(fileName, productForm.attachmentFile);

        if (uploadError) {
          console.error('파일 업로드 오류:', uploadError);
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('product-attachments')
            .getPublicUrl(fileName);
          attachmentUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('inquiries').insert({
        type: '신규제품',
        product_name: productForm.productName,
        manufacturer: productForm.manufacturer,
        category: productForm.category,
        specifications: productForm.specifications,
        desired_price: productForm.desiredPrice,
        attachment_url: attachmentUrl,
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
        resetForms();
      }, 2000);
    } catch (error) {
      console.error('신규제품 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 초기화
  const resetForms = () => {
    setInquiryForm({
      dentalName: '',
      businessNumber: '',
      representativeName: '',
      contact: '',
      email: '',
      inquiryContent: '',
    });
    setProductForm({
      productName: '',
      manufacturer: '',
      category: '',
      specifications: '',
      desiredPrice: '',
      attachmentFile: null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">문의 등록</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* 연락처 안내 배너 */}
        <div className="px-6 pt-4 pb-0">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex flex-wrap gap-x-5 gap-y-1.5">
            <p className="w-full text-xs font-semibold text-amber-800 mb-0.5">바로 연락하기</p>
            <a href="tel:15224936" className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-phone-line w-3.5 h-3.5 flex items-center justify-center"></i>
              <span>사무실: 1522-4936</span>
            </a>
            <a href="tel:01089503379" className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-smartphone-line w-3.5 h-3.5 flex items-center justify-center"></i>
              <span>제품문의: 010-8950-3379</span>
            </a>
            <a href="tel:01053411522" className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-kakao-talk-fill w-3.5 h-3.5 flex items-center justify-center"></i>
              <span>카카오톡·주문: 010-5341-1522</span>
            </a>
          </div>
        </div>

        {/* 탭 */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('입점문의')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === '입점문의'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              입점문의
            </button>
            <button
              onClick={() => setActiveTab('신규제품')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === '신규제품'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              신규제품 등록
            </button>
          </div>
        </div>

        {/* 성공 메시지 */}
        {submitSuccess && (
          <div className="mx-6 mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
            <i className="ri-checkbox-circle-fill text-2xl text-teal-600"></i>
            <span className="text-teal-800 font-medium">제출이 완료되었습니다!</span>
          </div>
        )}

        {/* 입점문의 폼 */}
        {activeTab === '입점문의' && (
          <div className="p-6 space-y-4">
            {/* 양식 다운로드/업로드 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadInquiryTemplate}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <i className="ri-download-line"></i>
                양식 다운로드
              </button>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <i className="ri-upload-line"></i>
                양식 업로드
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUploadInquiryTemplate}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                치과명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inquiryForm.dentalName}
                onChange={(e) => setInquiryForm({ ...inquiryForm, dentalName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="치과명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inquiryForm.businessNumber}
                onChange={(e) =>
                  setInquiryForm({ ...inquiryForm, businessNumber: formatBusinessNumber(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="000-00-00000"
                maxLength={12}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
              <input
                type="text"
                value={inquiryForm.representativeName}
                onChange={(e) => setInquiryForm({ ...inquiryForm, representativeName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="대표자명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={inquiryForm.contact}
                onChange={(e) => setInquiryForm({ ...inquiryForm, contact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={inquiryForm.email}
                onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문의내용</label>
              <textarea
                value={inquiryForm.inquiryContent}
                onChange={(e) => setInquiryForm({ ...inquiryForm, inquiryContent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                rows={4}
                placeholder="문의하실 내용을 입력하세요"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{inquiryForm.inquiryContent.length}/500자</p>
            </div>

            <button
              onClick={handleSubmitInquiry}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              {isSubmitting ? '제출 중...' : '입점문의 제출'}
            </button>
          </div>
        )}

        {/* 신규제품 폼 */}
        {activeTab === '신규제품' && (
          <div className="p-6 space-y-4">
            {/* 양식 다운로드/업로드 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadProductTemplate}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <i className="ri-download-line"></i>
                양식 다운로드
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <i className="ri-upload-line"></i>
                양식 업로드
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUploadProductTemplate}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productForm.productName}
                onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="제품명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제조사 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productForm.manufacturer}
                onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="제조사를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="">카테고리 선택</option>
                <option value="임플란트">임플란트</option>
                <option value="어버트먼트">어버트먼트</option>
                <option value="스캔바디">스캔바디</option>
                <option value="링크">링크</option>
                <option value="게이지">게이지</option>
                <option value="키트">키트</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">규격/사양</label>
              <input
                type="text"
                value={productForm.specifications}
                onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="예: Ø4.0 x 10mm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">희망단가</label>
              <input
                type="text"
                value={productForm.desiredPrice}
                onChange={(e) => setProductForm({ ...productForm, desiredPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="예: 50,000원"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">첨부파일 (이미지)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setProductForm({ ...productForm, attachmentFile: e.target.files?.[0] || null })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
              {productForm.attachmentFile && (
                <p className="text-xs text-gray-600 mt-1">선택된 파일: {productForm.attachmentFile.name}</p>
              )}
            </div>

            <button
              onClick={handleSubmitProduct}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              {isSubmitting ? '제출 중...' : '신규제품 등록'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}