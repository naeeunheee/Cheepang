import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeBizNo, ADMIN_BIZ_NO, type UserRole } from '../utils/auth';
import type { Session as SupabaseSession, User } from '@supabase/supabase-js';

interface AuthState {
  session: SupabaseSession | null;
  user: User | null;
  businessNo: string;
  clinicName: string;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// ─── Helper: Supabase User → 앱 세션 정보 추출 ───
function extractUserInfo(user: User | null) {
  if (!user) return { businessNo: '', clinicName: '', role: 'dental' as UserRole };

  const meta = user.user_metadata || {};
  const bizNo = normalizeBizNo(
    meta.business_number || user.email?.replace('@cheepang.local', '') || ''
  );
  // Step 7 완료 전까지: metadata.role 우선, 없으면 bizNo 기반 판별
  const role: UserRole =
    meta.role === 'admin' || bizNo === ADMIN_BIZ_NO ? 'admin' : 'dental';
  const clinicName = meta.clinic_name || (role === 'admin' ? '관리자' : bizNo);

  return { businessNo: bizNo, clinicName, role };
}

// ─── Helper: localStorage 동기화 (deprecated 래퍼 호환용) ───
function syncLegacyStorage(user: User | null) {
  if (!user) {
    localStorage.removeItem('cheepang_session_v1');
    localStorage.removeItem('currentClient');
    return;
  }

  const { businessNo, clinicName, role } = extractUserInfo(user);

  localStorage.setItem(
    'cheepang_session_v1',
    JSON.stringify({ businessNo, clinicName, role })
  );

  // currentClient도 동기화 (MvpOrderSection 등에서 사용)
  if (role === 'dental') {
    localStorage.setItem(
      'currentClient',
      JSON.stringify({
        id: businessNo,
        name: clinicName,
        businessNumber: businessNo,
      })
    );
  }
}

// ─── Provider ───
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      syncLegacyStorage(s?.user ?? null);
      setIsLoading(false);
    });

    // 2. 세션 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        syncLegacyStorage(s?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cheepang_session_v1');
    localStorage.removeItem('currentClient');
    localStorage.removeItem('cheepang_users_v1');
  }, []);

  const user = session?.user ?? null;
  const { businessNo, clinicName, role } = extractUserInfo(user);

  const value: AuthState = {
    session,
    user,
    businessNo,
    clinicName,
    role,
    isAdmin: role === 'admin',
    isLoading,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
