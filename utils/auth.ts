import { supabase } from '../lib/supabase';

export type UserRole = 'dental' | 'admin';

export type Session = {
  businessNo: string;
  role: UserRole;
  clinicName?: string;
};

// 사업자번호 정규화: 하이픈 제거 후 비교
export const normalizeBizNo = (biz: string): string =>
  (biz || '').replace(/-/g, '').trim();

// Admin 사업자번호 — 단일 정의 (Step 7: DB 전환 시 이 상수 제거)
export const ADMIN_BIZ_NO = '7618801913';

// ─── Supabase Auth 기반 함수 ───

export async function getSupabaseSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

export async function getSupabaseUser(): Promise<Session | null> {
  const session = await getSupabaseSession();
  if (!session) return null;

  const meta = session.user.user_metadata || {};
  const bizNo = meta.business_number ||
    session.user.email?.replace('@cheepang.local', '') || '';
  const role: UserRole = meta.role === 'admin' ? 'admin' : 'dental';

  return {
    businessNo: normalizeBizNo(bizNo),
    role,
    clinicName: meta.clinic_name || bizNo,
  };
}

export async function logout() {
  await supabase.auth.signOut();
  // 레거시 localStorage 정리
  localStorage.removeItem('cheepang_session_v1');
  localStorage.removeItem('currentClient');
  localStorage.removeItem('cheepang_users_v1');
}

// ─── Deprecated 동기 래퍼 (Step 5 전환 완료 시 제거) ───
// AuthContext가 localStorage 동기화하므로 전환 기간 동안 작동

const LS_SESSION = 'cheepang_session_v1';

/** @deprecated useAuth() 훅으로 교체 예정 */
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.businessNo || !parsed.role) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

/** @deprecated useAuth() 훅으로 교체 예정 */
export function getAuthUser(): Session | null {
  return getSession();
}

/** @deprecated AuthContext에서 자동 관리 */
export function setAuthUser(session: Session) {
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
}

/** @deprecated useAuth().role === 'admin' 사용 */
export function isAdmin(): boolean {
  const session = getSession();
  return session?.role === 'admin';
}

/** @deprecated useAuth().role 사용 */
export function getUserRole(): UserRole | null {
  const session = getSession();
  return session?.role || null;
}

export function clearAuth(): void {
  logout();
}

/** @deprecated user_metadata.role 기반으로 전환됨 */
export function determineRole(businessNo: string): UserRole {
  return normalizeBizNo(businessNo) === ADMIN_BIZ_NO ? 'admin' : 'dental';
}
