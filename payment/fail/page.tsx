import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-error-warning-line text-4xl text-red-600"></i>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">결제 실패</h2>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-800 mb-2">
            {message || '결제가 취소되었거나 실패했습니다.'}
          </p>
          {code && (
            <p className="text-xs text-red-600">오류 코드: {code}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#2B5F9E] text-white rounded-xl font-semibold hover:bg-[#3A7BC8] transition-colors cursor-pointer whitespace-nowrap"
          >
            다시 시도하기
          </button>
          
          <button
            onClick={() => navigate('/my-orders')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            주문 목록 보기
          </button>
        </div>
      </div>
    </div>
  );
}