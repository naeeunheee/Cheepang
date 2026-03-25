import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../../../../utils/settings';

export default function PackageSettingsPanel() {
  const [threshold, setThreshold] = useState<number>(100000);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getSetting<number>('point_balance_threshold').then((saved) => {
      if (saved !== null) setThreshold(saved);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    await setSetting('point_balance_threshold', threshold);
    
    // 커스텀 이벤트 발생 (같은 탭 내에서 변경 감지)
    window.dispatchEvent(new CustomEvent('thresholdChanged', { detail: { threshold } }));
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => { setSaveSuccess(false); }, 2000);
  };

  const handleReset = async () => {
    setThreshold(100000);
    await setSetting('point_balance_threshold', 100000);
    window.dispatchEvent(new CustomEvent('thresholdChanged', { detail: { threshold: 100000 } }));
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* 포인트 잔액 임계값 설정 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-alarm-warning-line text-amber-600 text-2xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">포인트 잔액 임계값 설정</h3>
            <p className="text-sm text-gray-600">
              거래처의 포인트 잔액이 설정한 금액 이하로 떨어지면 관리자 화면에 경고 알림이 표시됩니다.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              임계값 금액
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 0)}
                  min="0"
                  step="10000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-semibold"
                  placeholder="100000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  원
                </span>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-restart-line mr-1"></i>
                초기화
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              현재 설정: <span className="font-bold text-amber-600">{threshold.toLocaleString()}원</span> 이하일 때 알림
            </p>
          </div>

          {/* 빠른 설정 버튼 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              빠른 설정
            </label>
            <div className="flex flex-wrap gap-2">
              {[50000, 100000, 200000, 300000, 500000, 1000000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setThreshold(amount)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    threshold === amount
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amount.toLocaleString()}원
                </button>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {isSaving ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  저장 중...
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-2"></i>
                  설정 저장
                </>
              )}
            </button>

            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                <i className="ri-checkbox-circle-fill text-xl"></i>
                <span className="text-sm font-medium">저장되었습니다</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 알림 동작 방식 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <i className="ri-information-line text-blue-600 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-900 mb-2">알림 동작 방식</h4>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li className="flex items-start gap-2">
                <i className="ri-checkbox-circle-line text-blue-600 flex-shrink-0 mt-0.5"></i>
                <span>거래처의 포인트 잔액이 임계값 이하로 떨어지면 관리자 화면 상단에 경고 배너가 표시됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-checkbox-circle-line text-blue-600 flex-shrink-0 mt-0.5"></i>
                <span>배너에는 잔액이 부족한 거래처 목록과 현재 잔액이 표시됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-checkbox-circle-line text-blue-600 flex-shrink-0 mt-0.5"></i>
                <span>배너의 닫기 버튼으로 숨길 수 있으며, 새로운 변경 감지 시 다시 표시됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-checkbox-circle-line text-blue-600 flex-shrink-0 mt-0.5"></i>
                <span>포인트 잔액 변경은 실시간으로 감지되어 즉시 알림이 업데이트됩니다</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 추가 설정 안내 (향후 확장 가능) */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <i className="ri-lightbulb-line text-gray-600 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 mb-2">추가 설정 (향후 제공 예정)</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <i className="ri-time-line text-gray-500 flex-shrink-0 mt-0.5"></i>
                <span>이메일 또는 SMS 알림 발송</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-time-line text-gray-500 flex-shrink-0 mt-0.5"></i>
                <span>거래처별 개별 임계값 설정</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-time-line text-gray-500 flex-shrink-0 mt-0.5"></i>
                <span>자동 충전 요청 생성</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}