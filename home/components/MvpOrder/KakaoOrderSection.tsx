const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_치팡';
const PHONE_OFFICE = '1522-4936';
const PHONE_INQUIRY = '010-8950-3379';
const PHONE_ORDER = '010-5341-1522';

export default function KakaoOrderSection() {
  return (
    <div className="max-w-xl mx-auto">
      {/* 안내 문구 */}
      <div className="bg-[#FEE500]/20 border border-[#FEE500] rounded-xl p-4 mb-6 flex items-start gap-3">
        <i className="ri-kakao-talk-fill text-[#3C1E1E] text-xl mt-0.5 flex-shrink-0"></i>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">기존처럼 카카오톡으로 주문하셔도 됩니다</p>
          <p className="text-xs text-gray-600">
            담당자가 확인 후 치팡 주문내역에 반영해드립니다.
          </p>
        </div>
      </div>

      {/* 카카오톡 버튼 */}
      <button
        onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
        className="w-full flex items-center justify-center gap-3 py-5 bg-[#FEE500] text-[#3C1E1E] rounded-xl font-bold text-base hover:bg-[#FDD835] transition-colors cursor-pointer whitespace-nowrap mb-3"
      >
        <i className="ri-kakao-talk-fill text-2xl"></i>
        카카오톡으로 주문하기
      </button>

      {/* 연락처 3개 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <a
          href={`tel:${PHONE_OFFICE.replace(/-/g, '')}`}
          className="flex flex-col items-center gap-2 py-4 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full">
            <i className="ri-phone-line text-lg text-blue-600"></i>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">사무실</p>
            <p className="text-xs font-bold whitespace-nowrap">{PHONE_OFFICE}</p>
          </div>
        </a>
        <a
          href={`tel:${PHONE_INQUIRY.replace(/-/g, '')}`}
          className="flex flex-col items-center gap-2 py-4 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 flex items-center justify-center bg-emerald-50 rounded-full">
            <i className="ri-smartphone-line text-lg text-emerald-600"></i>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">제품문의</p>
            <p className="text-xs font-bold whitespace-nowrap">{PHONE_INQUIRY}</p>
          </div>
        </a>
        <a
          href={`tel:${PHONE_ORDER.replace(/-/g, '')}`}
          className="flex flex-col items-center gap-2 py-4 bg-white border-2 border-amber-200 text-gray-800 rounded-xl font-medium text-sm hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 flex items-center justify-center bg-[#FEE500]/30 rounded-full">
            <i className="ri-kakao-talk-fill text-lg text-[#3C1E1E]"></i>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">카카오·주문</p>
            <p className="text-xs font-bold whitespace-nowrap">{PHONE_ORDER}</p>
          </div>
        </a>
      </div>

      {/* 안내사항 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <i className="ri-information-line text-base text-[#2B5F9E]"></i>
          주문 시 알려주세요
        </p>
        <ul className="space-y-2.5">
          {[
            { icon: 'ri-barcode-line', text: '제품명/모델코드, 사이즈(규격), 수량을 명확히 기재해주세요.' },
            { icon: 'ri-truck-line', text: '치과 배송인지 기공소 배송인지 배송 방법(택배/직배)도 알려주세요.' },
            { icon: 'ri-hospital-line', text: '치과명과 기공소명을 함께 알려주시면 빠르게 처리됩니다.' },
            { icon: 'ri-check-double-line', text: '주문 확인 후 치팡 주문내역에 자동으로 반영됩니다.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
              <i className={`${item.icon} text-sm text-gray-400 mt-0.5 flex-shrink-0`}></i>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          영업시간: 평일 오전 9시 ~ 오후 6시 (주말/공휴일 제외)
        </p>
      </div>
    </div>
  );
}
