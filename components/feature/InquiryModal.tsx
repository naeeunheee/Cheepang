import { useState } from 'react';

interface InquiryModalProps {
  onClose: () => void;
  defaultProduct?: string;
}

export default function InquiryModal({ onClose, defaultProduct = '' }: InquiryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    clinicName: '',
    email: '',
    interestedProduct: defaultProduct,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append('name', formData.name);
      formBody.append('phone', formData.phone);
      formBody.append('clinicName', formData.clinicName);
      formBody.append('email', formData.email);
      formBody.append('interestedProduct', formData.interestedProduct);
      formBody.append('message', formData.message);

      const response = await fetch('https://readdy.ai/api/form/d6f8671ghdq4qda6vilg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">입점 / 제품 문의</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-3xl text-emerald-600"></i>
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">문의가 접수되었습니다</h4>
            <p className="text-sm text-gray-600">빠른 시일 내에 연락드리겠습니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4" data-readdy-form>
            {/* 연락처 안내 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-amber-800 mb-1">바로 연락하기</p>
              <a href="tel:15224936" className="flex items-center gap-2 text-xs text-amber-700 hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-phone-line w-3.5 h-3.5 flex items-center justify-center"></i>
                <span>사무실: 1522-4936</span>
              </a>
              <a href="tel:01089503379" className="flex items-center gap-2 text-xs text-amber-700 hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-smartphone-line w-3.5 h-3.5 flex items-center justify-center"></i>
                <span>제품문의: 010-8950-3379</span>
              </a>
              <a href="tel:01053411522" className="flex items-center gap-2 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-kakao-talk-fill w-3.5 h-3.5 flex items-center justify-center"></i>
                <span>카카오톡·주문: 010-5341-1522</span>
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm"
                placeholder="010-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                치과명
              </label>
              <input
                type="text"
                name="clinicName"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm"
                placeholder="치팡 치과"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관심 제품 / 입점 문의
              </label>
              <input
                type="text"
                name="interestedProduct"
                value={formData.interestedProduct}
                onChange={(e) => setFormData({ ...formData, interestedProduct: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm"
                placeholder="관심 제품명 또는 입점 문의"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문의 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                required
                maxLength={500}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]/20 text-sm resize-none"
                rows={4}
                placeholder="문의하실 내용을 입력해주세요 (최대 500자)"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.message.length} / 500자</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#2B5F9E] text-white rounded-lg font-semibold hover:bg-[#3A7BC8] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isSubmitting ? '전송 중...' : '문의하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
