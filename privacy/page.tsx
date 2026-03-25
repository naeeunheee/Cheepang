import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="cursor-pointer">
              <img
                src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png"
                alt="CHIPANG Logo"
                className="h-14"
              />
            </Link>
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
              <i className="ri-arrow-left-line"></i>
              홈으로
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">개인정보처리방침</h1>
          <p className="text-gray-500 mb-8">최종 수정일: 2026년 1월 1일</p>

          <div className="space-y-8">
            {/* 서문 */}
            <section>
              <p className="text-gray-700 leading-relaxed">
                하이니스 / 치팡은 개인정보보호법에 따라 이용자의 개인정보를 보호하며, 관련 법령에 의거하여 개인정보처리방침을 수립·공개합니다.
              </p>
            </section>

            {/* 1. 수집항목 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">1</span>
                수집하는 개인정보 항목
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <i className="ri-checkbox-circle-fill text-[#3A7BC8] text-lg mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">필수 정보</p>
                    <p className="text-gray-600 text-sm">사업자명, 대표자명, 연락처, 이메일, 사업자등록번호</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="ri-checkbox-circle-fill text-[#3A7BC8] text-lg mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">거래 정보</p>
                    <p className="text-gray-600 text-sm">주문 및 배송 관련 정보, 결제 정보</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. 수집목적 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">2</span>
                개인정보 수집 및 이용 목적
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-shopping-cart-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">주문 처리</p>
                    <p className="text-gray-600 text-sm">제품 주문 접수, 배송, 결제 처리</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-building-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">거래처 관리</p>
                    <p className="text-gray-600 text-sm">B2B 거래처 등록 및 관리, 계약 이행</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-file-list-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">채권 관리</p>
                    <p className="text-gray-600 text-sm">전자세금계산서 발행, 채권 관리</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-customer-service-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">고객 상담</p>
                    <p className="text-gray-600 text-sm">문의 응대, 불만 처리, 공지사항 전달</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. 보유기간 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">3</span>
                개인정보 보유 및 이용 기간
              </h2>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-time-line text-[#3A7BC8] text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">거래 종료 후 5년간 보관</p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      전자상거래 등에서의 소비자보호에 관한 법률 및 국세기본법에 따라 거래 종료 후 5년간 보관합니다.
                      보유 기간 경과 후에는 지체 없이 파기합니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. 제3자 제공 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">4</span>
                개인정보의 제3자 제공
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-shield-check-line text-[#3A7BC8] text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900 mb-2">최소한의 제공 원칙</p>
                    <p className="text-gray-700 leading-relaxed">
                      회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
                      다만, 배송 목적으로 물류사에 필요 최소한의 정보(수령인명, 연락처, 주소)를 제공할 수 있으며,
                      이 경우에도 사전에 고지하고 동의를 받습니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. 권리 행사 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">5</span>
                정보주체의 권리
              </h2>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2 text-gray-700">
                    <i className="ri-arrow-right-s-line text-[#3A7BC8] mt-1"></i>
                    <span>개인정보 열람 요구</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <i className="ri-arrow-right-s-line text-[#3A7BC8] mt-1"></i>
                    <span>개인정보 정정·삭제 요구</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <i className="ri-arrow-right-s-line text-[#3A7BC8] mt-1"></i>
                    <span>개인정보 처리 정지 요구</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 문의 */}
            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">개인정보 보호 책임자</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                <p className="text-gray-700"><span className="font-medium">담당자:</span> 개인정보보호팀</p>
                <p className="text-gray-700"><span className="font-medium">이메일:</span> dentalmain1@naver.com</p>
                <p className="text-gray-700"><span className="font-medium">전화:</span> 010-8950-3379</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
