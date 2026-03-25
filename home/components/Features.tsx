export default function Features() {
  const features = [
    {
      title: '🤖 AI 재고/수요 예측',
      description: '치과별 사용 패턴을 분석하여 재고 소진 시점을 미리 알려드립니다. 결품과 급한 주문 스트레스에서 해방되세요.',
      icon: 'ri-brain-line',
      image: 'https://readdy.ai/api/search-image?query=artificial%20intelligence%20predictive%20analytics%20dashboard%20showing%20inventory%20forecasting%20graphs%20and%20charts%2C%20dental%20clinic%20usage%20pattern%20analysis%2C%20clean%20modern%20interface%20with%20data%20visualization%2C%20professional%20medical%20technology%2C%20white%20and%20blue%20color%20scheme%2C%20minimalist%20design&width=500&height=400&seq=feature-ai-002&orientation=landscape',
      width: 'lg:w-[40%]'
    },
    {
      title: '💳 선결제 한도 자동관리',
      description: '영업사원 방문 없이도 잔액 부족 시 자동 알림 및 원클릭 연장 결제가 가능합니다. 투명한 거래원장을 실시간 제공합니다.',
      icon: 'ri-wallet-3-line',
      image: 'https://readdy.ai/api/search-image?query=automated%20payment%20management%20system%20interface%2C%20prepaid%20balance%20tracking%20dashboard%2C%20transparent%20transaction%20ledger%20display%2C%20modern%20fintech%20design%2C%20clean%20white%20background%2C%20professional%20business%20illustration&width=400&height=400&seq=feature-payment-002&orientation=squarish',
      width: 'lg:w-[28%]'
    },
    {
      title: '🦷 하이니스 & 브랜드 마켓',
      description: '하이니스 정품 임플란트/보철은 기본, 다양한 치과 재료 브랜드 제품을 하나의 아이디로 통합 구매하세요.',
      icon: 'ri-store-3-line',
      image: 'https://readdy.ai/api/search-image?query=unified%20dental%20marketplace%20platform%20showing%20multiple%20brand%20products%2C%20integrated%20shopping%20system%2C%20professional%20medical%20supplies%20display%2C%20organized%20product%20catalog%2C%20clean%20white%20background%2C%20modern%20e-commerce%20design&width=400&height=400&seq=feature-market-002&orientation=squarish',
      width: 'lg:w-[28%]'
    }
  ];

  return (
    <section
      id="features"
      className="py-32 relative"
      style={{
        backgroundImage: 'url(https://readdy.ai/api/search-image?query=warm%20cozy%20golden%20bokeh%20light%20background%2C%20soft%20amber%20cream%20tones%2C%20sunlit%20warm%20interior%20ambiance%2C%20blurred%20warm%20dreamy%20atmosphere%2C%20golden%20hour%20light%20particles%2C%20cozy%20cafe%20aesthetic%2C%20professional%20photography%2C%20elegant%20lifestyle%20backdrop%2C%20rich%20warm%20gradient%20tones&width=1600&height=800&seq=features-bg-warm-cafe-001&orientation=landscape)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      {/* 웜 오버레이 */}
      <div className="absolute inset-0" style={{ background: 'rgba(240,232,218,0.87)' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Title Area */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-extrabold leading-tight mb-4" style={{ color: '#1a1a1a' }}>
            치팡만의 딥테크(Deep-Tech) 솔루션
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="flex flex-col lg:flex-row gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.width} bg-white rounded-3xl p-8 transition-all duration-300`}
              style={{ border: '1px solid #E0D5C3' }}
            >
              {index === 0 ? (
                <>
                  <div className="mb-8">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-64 object-cover object-top rounded-2xl"
                    />
                  </div>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                    style={{ background: 'rgba(139,105,20,0.1)' }}
                  >
                    <i className={`${feature.icon} text-3xl`} style={{ color: '#8B6914' }}></i>
                  </div>
                  <h3 className="text-3xl font-bold mb-4" style={{ color: '#1a1a1a' }}>{feature.title}</h3>
                  <p className="text-lg leading-relaxed" style={{ color: '#8C7E6A' }}>{feature.description}</p>
                </>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto"
                    style={{ background: 'rgba(139,105,20,0.1)' }}
                  >
                    <i className={`${feature.icon} text-3xl`} style={{ color: '#8B6914' }}></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#1a1a1a' }}>{feature.title}</h3>
                  <div className="mb-6">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-48 object-cover object-top rounded-2xl"
                    />
                  </div>
                  <p className="text-base leading-relaxed text-center" style={{ color: '#8C7E6A' }}>{feature.description}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
