import { Link } from 'react-router-dom';

export default function RefundPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">반품 및 교환 정책</h1>
          <p className="text-gray-500 mb-8">최종 수정일: 2026년 1월 1일</p>

          <div className="space-y-8">
            {/* 서문 */}
            <section>
              <p className="text-gray-700 leading-relaxed">
                하이니스 / 치팡은 고객 만족을 최우선으로 하며, 공정하고 투명한 반품 및 교환 정책을 운영합니다.
                의료기기의 특성상 일부 제한 사항이 있으니 아래 내용을 반드시 확인해 주시기 바랍니다.
              </p>
            </section>

            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">1</span>
                반품 및 교환 신청 기간
              </h2>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-calendar-check-line text-[#3A7BC8] text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">제품 수령 후 7일 이내</p>
                    <p className="text-gray-700 leading-relaxed">
                      제품 수령일로부터 7일 이내에 반품 또는 교환을 신청할 수 있습니다.
                      단, 의료기기의 특성상 개봉 또는 사용된 제품은 반품 및 교환이 불가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">2</span>
                반품 및 교환 가능 조건
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
                  <i className="ri-checkbox-circle-line text-green-600 text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">가능한 경우</p>
                    <ul className="text-gray-700 text-sm space-y-1 mt-2">
                      <li>• 제품이 미개봉 상태이며 포장이 훼손되지 않은 경우</li>
                      <li>• 제품에 초기 불량이 있는 경우</li>
                      <li>• 주문한 제품과 다른 제품이 배송된 경우</li>
                      <li>• 배송 중 파손된 경우</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <i className="ri-close-circle-line text-red-600 text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">불가능한 경우</p>
                    <ul className="text-gray-700 text-sm space-y-1 mt-2">
                      <li>• 제품을 개봉하거나 사용한 경우</li>
                      <li>• 제품의 포장이 훼손된 경우</li>
                      <li>• 고객의 부주의로 제품이 손상된 경우</li>
                      <li>• 반품 신청 기간(7일)이 경과한 경우</li>
                      <li>• 주문 제작 또는 맞춤 제작된 제품의 경우</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">3</span>
                반품 배송비 부담
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-user-line text-[#3A7BC8] text-xl"></i>
                    <p className="font-semibold text-gray-900">고객 부담</p>
                  </div>
                  <ul className="text-gray-700 text-sm space-y-1.5">
                    <li>• 단순 변심에 의한 반품</li>
                    <li>• 주문 착오로 인한 반품</li>
                    <li>• 고객 사정에 의한 교환</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-store-line text-[#3A7BC8] text-xl"></i>
                    <p className="font-semibold text-gray-900">회사 부담</p>
                  </div>
                  <ul className="text-gray-700 text-sm space-y-1.5">
                    <li>• 제품 초기 불량</li>
                    <li>• 오배송 (다른 제품 배송)</li>
                    <li>• 배송 중 파손</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">4</span>
                초기 불량 제품 처리
              </h2>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-tools-line text-yellow-600 text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">확인 후 교환 처리</p>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      제품 수령 후 초기 불량이 발견된 경우, 즉시 고객센터로 연락하여 불량 내용을 신고해 주시기 바랍니다.
                      회사에서 불량 여부를 확인한 후 교환 또는 환불 처리해 드립니다.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        <i className="ri-information-line text-yellow-600 mr-2"></i>
                        초기 불량 신고 절차
                      </p>
                      <ol className="text-sm text-gray-600 space-y-1 ml-6">
                        <li>1. 고객센터 연락 (전화 또는 이메일)</li>
                        <li>2. 불량 내용 및 사진 전송</li>
                        <li>3. 회사 확인 후 교환 승인</li>
                        <li>4. 제품 회수 및 새 제품 발송</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">5</span>
                환불 처리
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-refund-line text-[#3A7BC8] text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900 mb-2">환불 처리 기간</p>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      반품 제품이 회사에 도착하고 검수가 완료된 후 영업일 기준 3~5일 이내에 환불 처리됩니다.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <i className="ri-arrow-right-s-line text-[#3A7BC8] mr-1"></i>
                        포인트 결제: 포인트로 즉시 환불
                      </p>
                      <p className="text-sm text-gray-600">
                        <i className="ri-arrow-right-s-line text-[#3A7BC8] mr-1"></i>
                        계좌이체: 등록된 계좌로 환불 (영업일 기준 3~5일)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">6</span>
                반품 신청 방법
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-phone-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">전화 신청</p>
                    <p className="text-gray-600 text-sm">010-8950-3379 (평일 09:00~18:00)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-mail-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">이메일 신청</p>
                    <p className="text-gray-600 text-sm">dentalmain1@naver.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-computer-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">플랫폼 내 신청</p>
                    <p className="text-gray-600 text-sm">마이페이지 &gt; 주문내역 &gt; 반품/교환 신청</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 주의사항 */}
            <section className="bg-red-50 border border-red-100 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <i className="ri-error-warning-line text-red-600 text-2xl mt-0.5"></i>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">의료기기 특성상 주의사항</p>
                  <p className="text-gray-700 leading-relaxed">
                    본 플랫폼에서 판매하는 제품은 의료기기로서, 개봉 후에는 위생 및 안전상의 이유로 반품 및 교환이 원칙적으로 불가능합니다.
                    주문 전 제품 사양을 반드시 확인하시고, 수령 시 즉시 제품 상태를 확인해 주시기 바랍니다.
                  </p>
                </div>
              </div>
            </section>

            {/* 문의 */}
            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">반품/교환 문의</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                <p className="text-gray-700"><span className="font-medium">담당부서:</span> 고객지원팀</p>
                <p className="text-gray-700"><span className="font-medium">이메일:</span> dentalmain1@naver.com</p>
                <p className="text-gray-700"><span className="font-medium">전화:</span> 010-8950-3379</p>
                <p className="text-gray-700"><span className="font-medium">운영시간:</span> 평일 09:00~18:00 (주말 및 공휴일 휴무)</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
