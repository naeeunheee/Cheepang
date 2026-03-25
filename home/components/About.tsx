export default function About() {
  return (
    <section
      id="about"
      className="py-32 relative"
      style={{
        backgroundImage: 'url(https://readdy.ai/api/search-image?query=warm%20elegant%20professional%20workspace%20golden%20afternoon%20sunlight%2C%20cream%20beige%20ivory%20interior%2C%20soft%20natural%20light%20streaming%20through%20windows%2C%20blurred%20bokeh%20background%2C%20cozy%20sophisticated%20ambiance%2C%20warm%20amber%20honey%20tones%2C%20no%20text%2C%20minimalist%20aesthetic%2C%20serene%20productive%20atmosphere&width=1600&height=900&seq=about-bg-warm-cafe-001&orientation=landscape)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      {/* 웜 오버레이 */}
      <div className="absolute inset-0" style={{ background: 'rgba(248,246,240,0.88)' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Image Card */}
          <div className="w-full lg:w-5/12">
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl bg-white">
              <img
                src="https://readdy.ai/api/search-image?query=professional%20dental%20implant%20products%20display%20on%20clean%20white%20surface%2C%20medical%20grade%20equipment%2C%20high%20quality%20dental%20materials%2C%20precision%20instruments%2C%20sterile%20packaging%2C%20modern%20healthcare%20products%2C%20bright%20studio%20lighting%2C%20minimalist%20composition&width=600&height=700&seq=about-img-001&orientation=portrait"
                alt="하이니스 제품"
                className="w-full h-[500px] object-cover object-top"
              />
              <div className="absolute top-6 left-6">
                <div className="bg-white px-6 py-3 rounded-full shadow-lg">
                  <span className="text-[#2B5F9E] font-semibold text-sm">하이니스 공식 유통업체</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-lg">신뢰할 수 있는 파트너</span>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="w-full lg:w-7/12">
            <div className="mb-4">
              <span className="text-[#2B5F9E] text-xs font-bold uppercase tracking-[2px]">ABOUT US</span>
            </div>
            <h2 className="text-[#1A2B3C] text-2xl font-bold leading-relaxed mb-8">
              당사는 <strong className="text-[#2B5F9E]">AI 기반 재고 예측</strong> 및 <strong className="text-[#2B5F9E]">자동 갱신 결제 시스템</strong>을 통해<br />
              전화/카카오톡 주문의 비효율성을<br />
              <strong className="text-[#2B5F9E]">디지털 시스템</strong>으로 전환했습니다.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              &apos;하이니스&apos; 브랜드의 공식 유통업체로서, 치과 업계의 디지털 전환을 선도하고 있습니다.
            </p>

            {/* Statistics */}
            <div className="flex items-center space-x-16 mt-16">
              <div>
                <div className="text-[#2B5F9E] text-4xl font-extrabold mb-2">500+</div>
                <div className="text-gray-500 text-sm">파트너 치과</div>
              </div>
              <div>
                <div className="text-[#2B5F9E] text-4xl font-extrabold mb-2">10,000+</div>
                <div className="text-gray-500 text-sm">월간 거래 건수</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
