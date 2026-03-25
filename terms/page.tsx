import { Link } from 'react-router-dom';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">이용약관</h1>
          <p className="text-gray-500 mb-8">최종 수정일: 2026년 1월 1일</p>

          <div className="space-y-8">
            {/* 서문 */}
            <section>
              <p className="text-gray-700 leading-relaxed">
                본 약관은 하이니스 / 치팡(이하 "회사")이 운영하는 B2B 의료기기 유통 플랫폼의 이용 조건 및 절차에 관한 사항을 규정합니다.
              </p>
            </section>

            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">1</span>
                플랫폼의 성격
              </h2>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-hospital-line text-[#3A7BC8] text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">의료기관 및 관련 사업자 전용 B2B 시스템</p>
                    <p className="text-gray-700 leading-relaxed">
                      본 플랫폼은 치과 의료기관 및 의료기기 관련 자격을 보유한 사업자를 대상으로 하는 B2B 전용 주문 및 정산 시스템입니다.
                      일반 소비자는 이용할 수 없으며, 의료기기 관련 법규에 따라 자격이 확인된 사업자에게만 판매됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">2</span>
                거래처 승인 및 이용 자격
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-file-list-3-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">거래처 등록 심사</p>
                    <p className="text-gray-600 text-sm">
                      거래처 등록 신청 시 사업자등록증, 의료기관 개설 허가증 등 관련 서류를 제출해야 하며,
                      회사의 심사를 거쳐 승인된 후 이용 가능합니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-shield-check-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">자격 유지 의무</p>
                    <p className="text-gray-600 text-sm">
                      거래처는 이용 기간 동안 의료기관 또는 의료기기 판매업 자격을 유지해야 하며,
                      자격 상실 시 즉시 회사에 통보해야 합니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">3</span>
                가격 및 결제 조건
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-price-tag-3-line text-[#3A7BC8] text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900 mb-2">거래처별 차등 가격</p>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      제품 가격은 거래처와의 계약 조건, 거래 규모, 결제 조건 등에 따라 상이할 수 있습니다.
                      플랫폼에 표시된 가격은 기본 가격이며, 실제 거래 가격은 별도 협의를 통해 결정됩니다.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600">
                        <i className="ri-information-line text-[#3A7BC8] mr-2"></i>
                        포인트 충전 후 주문 시 충전 금액 내에서 자유롭게 제품을 구매할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">4</span>
                제품 사양 및 변경
              </h2>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <i className="ri-alert-line text-yellow-600 text-2xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900 mb-2">사전 공지 없는 변경 가능</p>
                    <p className="text-gray-700 leading-relaxed">
                      제품의 사양, 디자인, 포장 등은 제조사의 사정에 따라 사전 공지 없이 변경될 수 있습니다.
                      단, 제품의 본질적 기능에 영향을 미치는 중요한 변경 사항은 사전에 공지하도록 노력합니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">5</span>
                의료기기 관련 법규 준수
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-file-shield-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">판매 자격 제한</p>
                    <p className="text-gray-600 text-sm">
                      의료기기법에 따라 본 플랫폼에 등록된 제품은 의료기관 또는 의료기기 판매업 허가를 받은 사업자에게만 판매됩니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-user-star-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">전문가 책임 사용</p>
                    <p className="text-gray-600 text-sm">
                      제품 사용은 의료전문가의 판단과 책임 하에 이루어져야 하며,
                      회사는 제품의 부적절한 사용으로 인한 결과에 대해 책임을 지지 않습니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <i className="ri-book-open-line text-[#3A7BC8] text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium text-gray-900">사용 설명서 준수</p>
                    <p className="text-gray-600 text-sm">
                      모든 제품은 제조사가 제공하는 사용 설명서 및 주의사항을 반드시 숙지하고 준수해야 합니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#3A7BC8] text-white rounded-full flex items-center justify-center text-sm">6</span>
                배송 및 인도
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <p className="text-gray-700">
                  <i className="ri-truck-line text-[#3A7BC8] mr-2"></i>
                  주문 확인 후 영업일 기준 2~5일 이내 배송됩니다.
                </p>
                <p className="text-gray-700">
                  <i className="ri-map-pin-line text-[#3A7BC8] mr-2"></i>
                  배송지는 거래처로 등록된 주소로 한정되며, 변경 시 사전 협의가 필요합니다.
                </p>
                <p className="text-gray-700">
                  <i className="ri-checkbox-circle-line text-[#3A7BC8] mr-2"></i>
                  제품 수령 시 파손 여부를 즉시 확인하고, 이상 발견 시 즉시 연락해야 합니다.
                </p>
              </div>
            </section>

            {/* 문의 */}
            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">약관 관련 문의</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                <p className="text-gray-700"><span className="font-medium">담당부서:</span> 고객지원팀</p>
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
