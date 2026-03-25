import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ADMIN_BIZ_NO } from '../../utils/auth';

type TabType = '로그인' | '회원가입';

// 사업자번호 자동 하이픈 포맷 함수
const formatBusinessNumber = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');
  const limited = numbers.slice(0, 10);
  if (limited.length <= 3) return limited;
  else if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  else return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
};

interface PostLoginInfo {
  clinicName: string;
  balance: number;
  isAdmin: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('로그인');

  const [loginBusinessNo, setLoginBusinessNo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 로그인 후 포인트 잔액 미리보기
  const [postLoginInfo, setPostLoginInfo] = useState<PostLoginInfo | null>(null);

  const [signupClinicName, setSignupClinicName] = useState('');
  const [signupBusinessNo, setSignupBusinessNo] = useState('');
  const [signupContactName, setSignupContactName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [bizLicenseFile, setBizLicenseFile] = useState<File | null>(null);
  const [bizLicensePreview, setBizLicensePreview] = useState<string>('');

  useEffect(() => {
    // 이미 로그인 상태면 홈으로
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  // ── Supabase Auth 로그인 (자동 마이그레이션 포함) ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const bizOriginal = loginBusinessNo.trim();
      const bizNoClean = bizOriginal.replace(/-/g, '');
      const email = `${bizNoClean}@cheepang.local`;

      let authUser: { id: string; email?: string } | null = null;

      // 1차 시도: Supabase Auth signIn
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (
          msg.includes('invalid login credentials') ||
          msg.includes('invalid credentials') ||
          msg.includes('email not confirmed') ||
          msg.includes('user not found')
        ) {
          // 자동 마이그레이션: 기존 계정이 아직 Supabase에 없는 경우
          // clients 테이블에서 사업자번호 존재 여부 확인
          const { data: clientCheck } = await supabase
            .from('clients')
            .select('id, name')
            .or(
              `business_number.eq.${bizNoClean},business_number.eq.${bizOriginal}`,
            )
            .maybeSingle();

          // admin 계정은 항상 마이그레이션 허용
          const isAdminBiz = bizNoClean === ADMIN_BIZ_NO;

          if (clientCheck || isAdminBiz) {
            // Supabase에 계정 생성 후 재로그인
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password: loginPassword,
              options: {
                data: {
                  business_number: bizNoClean,
                  clinic_name: clientCheck?.name || (isAdminBiz ? '관리자' : bizNoClean),
                },
              },
            });

            if (signUpError && !signUpError.message.includes('already registered')) {
              setLoginError('로그인에 실패했습니다. 비밀번호를 확인해주세요.');
              setIsLoggingIn(false);
              return;
            }

            if (signUpData?.user) {
              // 링크 업데이트
              await supabase
                .from('clients')
                .update({ auth_user_id: signUpData.user.id, auth_linked: true })
                .eq('business_number', bizNoClean);
            }

            // 재로그인 시도
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: loginPassword,
            });

            if (retryError || !retryData.user) {
              setLoginError('로그인에 실패했습니다. 비밀번호를 확인해주세요.');
              setIsLoggingIn(false);
              return;
            }
            authUser = retryData.user;
          } else {
            // clients 테이블에도 없고 Supabase에도 없음 → 미등록 사업자번호
            setLoginError('등록되지 않은 사업자번호이거나 비밀번호가 올바르지 않습니다.');
            setIsLoggingIn(false);
            return;
          }
        } else {
          setLoginError('로그인에 실패했습니다: ' + signInError.message);
          setIsLoggingIn(false);
          return;
        }
      } else {
        authUser = signInData.user;
      }

      if (!authUser) {
        setLoginError('로그인에 실패했습니다.');
        setIsLoggingIn(false);
        return;
      }

      // 2. clients 테이블에서 거래처 정보 조회
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name, outstanding_balance, package_tier')
        .or(
          `business_number.eq.${bizNoClean},business_number.eq.${bizOriginal}`,
        )
        .maybeSingle();

      const clinicName =
        clientData?.name ||
        authUser.email?.replace('@cheepang.local', '') ||
        bizNoClean;

      // role은 AuthContext에서 user_metadata + 사업자번호 기반으로 자동 판별
      const meta = authUser.user_metadata || {};
      const role = meta.role === 'admin' || bizNoClean === ADMIN_BIZ_NO ? 'admin' : 'dental';

      // AuthContext의 onAuthStateChange가 세션 동기화를 자동 처리

      // 4. 관리자는 바로 이동
      if (role === 'admin') {
        navigate('/');
        return;
      }

      // 5. 치과 → 잔액 미리보기 표시
      setPostLoginInfo({
        clinicName,
        balance: clientData?.outstanding_balance || 0,
        isAdmin: false,
      });
    } catch (err) {
      console.error('로그인 오류:', err);
      setLoginError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBizLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSignupError('파일 크기는 5MB 이하여야 합니다.'); return; }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) { setSignupError('JPG, PNG, PDF 파일만 업로드 가능합니다.'); return; }
    setBizLicenseFile(file);
    setSignupError('');
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => { setBizLicensePreview(reader.result as string); };
      reader.readAsDataURL(file);
    } else {
      setBizLicensePreview('');
    }
  };

  const linkOrCreateClient = async (params: {
    businessNo: string;
    clinicName: string;
    contactName?: string;
    phone?: string;
    bizLicenseUrl?: string;
    authUserId?: string;
  }) => {
    try {
      const bizOriginal = params.businessNo.trim();
      const bizClean = bizOriginal.replace(/-/g, '');

      const { data: existing } = await supabase
        .from('clients')
        .select('*')
        .or(
          `business_number.eq.${bizClean},business_number.eq.${bizOriginal}`,
        )
        .maybeSingle();

      if (existing) {
        await supabase
          .from('clients')
          .update({
            clinic_name: params.clinicName,
            representative: params.contactName || existing.representative,
            phone: params.phone || existing.phone,
            auth_user_id: params.authUserId || existing.auth_user_id,
            auth_linked: true,
            linked_at: new Date().toISOString(),
            biz_license_url: params.bizLicenseUrl || existing.biz_license_url,
            verification_status: 'approved',
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('clients').insert([
          {
            clinic_name: params.clinicName,
            business_number: bizClean,
            representative: params.contactName || '',
            phone: params.phone || '',
            email: '',
            address: '',
            point_balance: 0,
            outstanding_balance: 0,
            package_tier: 1000,
            auth_user_id: params.authUserId || null,
            auth_linked: true,
            linked_at: new Date().toISOString(),
            biz_license_url: params.bizLicenseUrl || null,
            verification_status: 'approved',
          },
        ]);
      }
    } catch (err) {
      console.error('거래처 연결 오류:', err);
    }
  };

  // ── Supabase Auth 회원가입 ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    setIsSigningUp(true);

    try {
      if (signupPassword !== signupPasswordConfirm) {
        setSignupError('비밀번호가 일치하지 않습니다.');
        setIsSigningUp(false);
        return;
      }

      const cleanBizNo = signupBusinessNo.trim().replace(/-/g, '');
      const email = `${cleanBizNo}@cheepang.local`;

      let bizLicenseUrl: string | undefined;
      if (bizLicenseFile) {
        const fileExt = bizLicenseFile.name.split('.').pop();
        const fileName = `${cleanBizNo}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('biz-licenses')
          .upload(fileName, bizLicenseFile, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          setSignupError('사업자등록증 업로드에 실패했습니다. 다시 시도해주세요.');
          setIsSigningUp(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('biz-licenses').getPublicUrl(fileName);
        bizLicenseUrl = urlData.publicUrl;
      }

      // Supabase Auth 계정 생성
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: signupPassword,
        options: {
          data: {
            clinic_name: signupClinicName,
            business_number: cleanBizNo,
            phone: signupPhone || '',
          },
        },
      });

      if (signUpError) {
        if (
          signUpError.message.includes('already registered') ||
          signUpError.message.includes('User already registered')
        ) {
          setSignupError('이미 등록된 사업자번호입니다. 로그인을 이용해주세요.');
        } else {
          setSignupError('회원가입에 실패했습니다: ' + signUpError.message);
        }
        setIsSigningUp(false);
        return;
      }

      // clients 테이블 연결
      await linkOrCreateClient({
        businessNo: cleanBizNo,
        clinicName: signupClinicName,
        contactName: signupContactName || undefined,
        phone: signupPhone || undefined,
        bizLicenseUrl,
        authUserId: signUpData?.user?.id,
      });

      setSignupSuccess(
        '회원가입이 완료되었습니다! 기본 패키지(1000)가 적용되었습니다. 패키지 변경은 담당자(010-8950-3379)에게 문의해주세요.',
      );
      setTimeout(() => {
        setActiveTab('로그인');
        setSignupSuccess('');
      }, 3000);
    } catch (err) {
      console.error('회원가입 오류:', err);
      setSignupError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8">
        {/* 로고 */}
        <div className="text-center mb-8">
          <img
            src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png"
            alt="CHIPANG Logo"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {activeTab === '로그인' ? '로그인' : '회원가입'}
          </h1>
          <p className="text-gray-600 text-sm">치팡 주문 시스템에 오신 것을 환영합니다</p>
        </div>

        {/* 탭 전환 */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => { setActiveTab('로그인'); setLoginError(''); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === '로그인' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('회원가입'); setSignupError(''); setSignupSuccess(''); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === '회원가입' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 로그인 폼 */}
        {activeTab === '로그인' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사업자번호</label>
              <input
                type="text"
                value={loginBusinessNo}
                onChange={(e) => setLoginBusinessNo(formatBusinessNumber(e.target.value))}
                placeholder="000-00-00000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <i className="ri-error-warning-line text-red-500"></i>
                <span className="text-sm text-red-700">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#2B5F9E] text-white py-3 rounded-lg font-medium hover:bg-[#234b7d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
              <p className="text-center text-xs text-gray-500 font-medium">테스트 계정</p>
              <p className="text-center text-xs text-gray-400">관리자: 761-88-01913 / admin123</p>
              <p className="text-center text-xs text-gray-400">치과: 123-45-67890 / dental123</p>
              <p className="text-center text-xs text-gray-400">샘플: 999-99-99999 / sample123</p>
            </div>
          </form>
        )}

        {/* 회원가입 폼 */}
        {activeTab === '회원가입' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">치과명</label>
              <input
                type="text"
                value={signupClinicName}
                onChange={(e) => setSignupClinicName(e.target.value)}
                placeholder="예: 서울치과의원"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사업자번호</label>
              <input
                type="text"
                value={signupBusinessNo}
                onChange={(e) => setSignupBusinessNo(formatBusinessNumber(e.target.value))}
                placeholder="000-00-00000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자명 <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              <input
                type="text"
                value={signupContactName}
                onChange={(e) => setSignupContactName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                휴대폰 <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              <input
                type="tel"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
              />
            </div>

            {/* 사업자등록증 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업자등록증 <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              <div className="space-y-2">
                <div
                  onClick={() => document.getElementById('biz-license-input')?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    bizLicenseFile
                      ? 'border-[#2B5F9E] bg-[#2B5F9E]/5'
                      : 'border-gray-300 hover:border-[#2B5F9E] hover:bg-gray-50'
                  }`}
                >
                  <input
                    id="biz-license-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleBizLicenseChange}
                    className="hidden"
                  />
                  {bizLicenseFile ? (
                    <div className="space-y-2">
                      {bizLicensePreview ? (
                        <img
                          src={bizLicensePreview}
                          alt="사업자등록증 미리보기"
                          className="w-full h-32 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                          <i className="ri-file-pdf-line text-2xl text-red-600"></i>
                        </div>
                      )}
                      <p className="text-sm font-medium text-[#2B5F9E]">{bizLicenseFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(bizLicenseFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <i className="ri-upload-cloud-2-line text-2xl text-gray-400"></i>
                      </div>
                      <p className="text-sm text-gray-600">클릭하여 파일 선택</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (최대 5MB)</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  <i className="ri-information-line mr-1"></i>
                  사업자등록증은 선택사항입니다. 기존 거래처는 없이도 가입 가능합니다.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
              <input
                type="password"
                value={signupPasswordConfirm}
                onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5F9E] focus:border-transparent text-sm"
                required
              />
            </div>

            {signupError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <i className="ri-error-warning-line text-red-500"></i>
                <span className="text-sm text-red-700">{signupError}</span>
              </div>
            )}

            {signupSuccess && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center gap-2">
                <i className="ri-checkbox-circle-line text-teal-500"></i>
                <span className="text-sm text-teal-700">{signupSuccess}</span>
              </div>
            )}

            {/* 거래처 연결 안내 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <i className="ri-information-line mr-1"></i>
              기존 거래처로 등록된 사업자번호로 가입하시면 거래처 정보가 자동으로 연결됩니다.
              대표자·전화번호 변경 시에도 자동으로 업데이트됩니다.
            </div>

            <button
              type="submit"
              disabled={isSigningUp}
              className="w-full bg-[#2B5F9E] text-white py-3 rounded-lg font-medium hover:bg-[#234b7d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {isSigningUp ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  가입 중...
                </span>
              ) : '회원가입'}
            </button>
          </form>
        )}
      </div>

      {/* ── 로그인 후 잔액 현황 미리보기 오버레이 ── */}
      {postLoginInfo && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              {/* 상단 성공 헤더 */}
              <div className="bg-gradient-to-r from-[#2B5F9E] to-[#3A7BC8] px-6 py-5 text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ri-checkbox-circle-fill text-white text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-white">로그인 성공!</h3>
                <p className="text-sm text-white/80 mt-1">{postLoginInfo.clinicName}</p>
              </div>

              <div className="p-5">
                {/* 잔액 현황 카드 */}
                {(() => {
                  const bal = postLoginInfo.balance;
                  const isCredit = bal < 0;
                  const isArrear = bal > 0;
                  const cardClass = isCredit
                    ? 'bg-emerald-50 border-emerald-200'
                    : isArrear
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200';
                  const iconClass = isCredit ? 'text-emerald-600' : isArrear ? 'text-red-500' : 'text-gray-400';
                  const labelClass = isCredit ? 'text-emerald-700' : isArrear ? 'text-red-700' : 'text-gray-600';
                  const amountClass = isCredit ? 'text-emerald-700' : isArrear ? 'text-red-600' : 'text-gray-600';
                  const label = isCredit ? '사용 가능 잔액' : isArrear ? '미수금' : '잔액';
                  const amount = isCredit ? `₩${Math.abs(bal).toLocaleString()}` : isArrear ? `₩${bal.toLocaleString()}` : '₩0';

                  return (
                    <div className={`rounded-xl p-4 mb-4 border ${cardClass}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`ri-wallet-3-line text-base ${iconClass}`}></i>
                        <span className={`text-sm font-semibold ${labelClass}`}>{label}</span>
                      </div>
                      <p className={`text-2xl font-extrabold ${amountClass}`}>{amount}</p>
                    </div>
                  );
                })()}

                {postLoginInfo.balance > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs text-red-700 font-medium">
                      미수금 ₩{postLoginInfo.balance.toLocaleString()}이 있습니다. 확인 후 정산해 주세요.
                    </p>
                  </div>
                )}
                {postLoginInfo.balance < 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-emerald-500 text-sm mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs text-emerald-700 font-medium">
                      사용 가능 잔액이 있습니다. 편리하게 주문하세요!
                    </p>
                  </div>
                )}
                {postLoginInfo.balance === 0 && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <i className="ri-information-line text-gray-400 text-sm mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs text-gray-600 font-medium">
                      잔액이 없습니다. 카드결제로 주문 가능합니다.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => { setPostLoginInfo(null); navigate('/'); }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2B5F9E] hover:bg-[#234b7d] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-arrow-right-line text-base"></i>
                  주문 시작하기
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
