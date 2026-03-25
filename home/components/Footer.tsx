import { useState } from 'react';
import { Link } from 'react-router-dom';
import InquiryFormModal from '../../../components/feature/InquiryFormModal';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('https://readdy.ai/api/form/d68j2l5biueuoqm1ri4g', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email }).toString(),
      });

      if (response.ok) {
        setSubmitMessage('구독해 주셔서 감사합니다!');
        setEmail('');
      } else {
        setSubmitMessage('오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      setSubmitMessage('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <footer id="contact" className="bg-[#1a2332] py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Newsletter Section */}
          <div className="mb-12 pb-12 border-b border-white/10">
            <div className="max-w-2xl">
              <h4 className="text-white text-xl font-semibold mb-3">최신 소식을 받아보세요</h4>
              <p className="text-gray-400 text-sm mb-6">신제품 및 프로모션 정보를 이메일로 받아보실 수 있습니다</p>
              <form onSubmit={handleSubmit} className="flex items-center" data-readdy-form id="newsletter-form">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="flex-1 bg-white/5 border border-white/20 text-white px-5 py-3 rounded-l-full text-sm focus:outline-none focus:border-[#3A7BC8] placeholder:text-gray-500"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  className="bg-[#3A7BC8] w-12 h-12 rounded-full flex items-center justify-center -ml-1 hover:bg-[#4A8BD8] transition-colors whitespace-nowrap cursor-pointer"
                  disabled={isSubmitting}
                >
                  <i className="ri-arrow-right-line text-xl text-white"></i>
                </button>
              </form>
              {submitMessage && (
                <p className={`mt-3 text-sm ${submitMessage.includes('감사') ? 'text-green-400' : 'text-red-400'}`}>
                  {submitMessage}
                </p>
              )}
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <img 
                src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png" 
                alt="CHIPANG Logo" 
                className="h-10 mb-4"
              />
              <div className="space-y-2 text-sm">
                <p className="text-gray-300 font-semibold">(주)하이니스중부지사 - 치팡</p>
                <p className="text-gray-400">(주)Highness 중부지사 - Cheepang</p>
                <p className="text-gray-400">대표자: 이석</p>
                <p className="text-gray-400 text-xs">통신판매업신고번호: 제0000-충남천안-0000호</p>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm">연락처</h5>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <i className="ri-map-pin-line text-[#3A7BC8] text-base mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <p className="text-gray-400 leading-relaxed">충남 천안시 서북구 백석동 881<br />백석종합상가 410호</p>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-phone-line text-[#3A7BC8] text-base w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <div>
                    <p className="text-gray-400 leading-none">사무실: 1522-4936</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-smartphone-line text-[#3A7BC8] text-base w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <div>
                    <p className="text-gray-400 leading-none">제품문의: 010-8950-3379</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-kakao-talk-fill text-[#3A7BC8] text-base w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <div>
                    <p className="text-gray-400 leading-none">카카오톡·주문: 010-5341-1522</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-mail-line text-[#3A7BC8] text-base w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <p className="text-gray-400">dentalmain1@naver.com</p>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-time-line text-[#3A7BC8] text-base mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <div className="text-gray-400 leading-relaxed text-xs">
                    <p>평일 09:00 ~ 18:00</p>
                    <p>토요일 09:00 ~ 13:00</p>
                    <p className="text-gray-500">일요일 · 공휴일 휴무</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Guide */}
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm">고객 안내</h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <i className="ri-checkbox-circle-line text-[#3A7BC8] text-base mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <span className="text-gray-400">전자세금계산서 발행 가능</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-checkbox-circle-line text-[#3A7BC8] text-base mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <span className="text-gray-400">사업자 전용 B2B 주문 플랫폼</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-checkbox-circle-line text-[#3A7BC8] text-base mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                  <span className="text-gray-400">의료기관 및 자격 보유 사업자 대상 판매</span>
                </li>
                <li>
                  <button
                    onClick={() => setIsInquiryModalOpen(true)}
                    className="flex items-start gap-2 text-[#3A7BC8] hover:text-[#4A8BD8] transition-colors cursor-pointer"
                  >
                    <i className="ri-questionnaire-line text-base mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0"></i>
                    <span>입점문의 / 신규제품 등록</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm">법적 고지</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-[#3A7BC8] transition-colors cursor-pointer">
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-[#3A7BC8] transition-colors cursor-pointer">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link to="/refund" className="text-gray-400 hover:text-[#3A7BC8] transition-colors cursor-pointer">
                    반품 및 교환 정책
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Medical Device Notice */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <i className="ri-alert-line text-[#3A7BC8] text-lg mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0"></i>
              <div className="text-xs text-gray-400 leading-relaxed space-y-1">
                <p>※ 본 사이트에 등록된 제품은 의료기기 관련 법규에 따라 자격을 갖춘 사업자에게만 판매됩니다.</p>
                <p>※ 제품 사용은 의료전문가의 판단과 책임 하에 이루어져야 합니다.</p>
              </div>
            </div>
          </div>

          {/* Platform Notice */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm">
              본 플랫폼은 치과 의료기관 전용 B2B 주문 및 정산 시스템입니다.
            </p>
          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 (주)하이니스중부지사 - Cheepang. All rights reserved.
            </p>
            <a 
              href="https://readdy.ai/?ref=logo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 text-sm hover:text-[#3A7BC8] transition-colors cursor-pointer"
            >
              Powered by Readdy
            </a>
          </div>
        </div>
      </footer>

      {/* Inquiry Form Modal */}
      <InquiryFormModal isOpen={isInquiryModalOpen} onClose={() => setIsInquiryModalOpen(false)} />
    </>
  );
}