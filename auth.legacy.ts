import { supabase } from '../lib/supabase';

export type UserRole = "dental" | "admin";

export type UserRecord = {
  businessNo: string;
  clinicName?: string;
  contactName?: string;
  phone?: string;
  role: UserRole;
  password: string;
};

const LS_USERS = "cheepang_users_v1";
const LS_SESSION = "cheepang_session_v1";

// 사업자번호 정규화: 하이픈 제거 후 비교
export const normalizeBizNo = (biz: string): string =>
  (biz || '').replace(/-/g, '').trim();

const seedUsers: UserRecord[] = [
  {
    businessNo: "123-45-67890",
    clinicName: "샘플치과의원",
    role: "dental",
    password: "dental123",
  },
  {
    businessNo: "761-88-01913",
    role: "admin",
    password: "admin123",
  },
  {
    businessNo: "999-99-99999",
    clinicName: "하이니스-샘플치과",
    role: "dental",
    password: "sample123",
  },
];

// 항상 시드 계정이 존재하도록 강제 병합
export function ensureSeedUsers() {
  let users: UserRecord[] = [];
  try {
    users = JSON.parse(localStorage.getItem(LS_USERS) || "[]");
    if (!Array.isArray(users)) users = [];
  } catch {
    users = [];
  }

  let changed = false;
  for (const seed of seedUsers) {
    const idx = users.findIndex((u) => u.businessNo === seed.businessNo);
    if (idx < 0) {
      users.push(seed);
      changed = true;
    }
    // 시드 계정 비밀번호는 항상 원래 값으로 보장
    else if (users[idx].password !== seed.password || users[idx].role !== seed.role) {
      users[idx] = { ...users[idx], password: seed.password, role: seed.role };
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  }
}

export function getUsers(): UserRecord[] {
  ensureSeedUsers();
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_USERS) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertUser(user: UserRecord) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.businessNo === user.businessNo);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

export type Session = {
  businessNo: string;
  role: UserRole;
  clinicName?: string;
};

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

export function logout() {
  supabase.auth.signOut(); // fire and forget — Supabase Auth 세션 무효화
  localStorage.removeItem(LS_SESSION);
  localStorage.removeItem('currentClient');
  localStorage.removeItem('cheepang_session_v1');
}

// 사업자번호로 역할 자동 판정
export function determineRole(businessNo: string): UserRole {
  return normalizeBizNo(businessNo) === "7618801913" ? "admin" : "dental";
}

// 로그인 검증 - businessNo + password 로만 찾음 (role 무관)
export function validateLogin(
  businessNo: string,
  password: string
): { success: boolean; message?: string; user?: UserRecord } {
  const users = getUsers();
  const normalizedInput = normalizeBizNo(businessNo);
  const found = users.find((u) => normalizeBizNo(u.businessNo) === normalizedInput);

  if (!found) {
    return { success: false, message: "등록되지 않은 사업자번호입니다." };
  }
  if (found.password !== password) {
    return { success: false, message: "비밀번호가 올바르지 않습니다." };
  }
  return { success: true, user: found };
}

// 회원가입
export function registerUser(params: {
  businessNo: string;
  clinicName: string;
  contactName?: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
}): { success: boolean; message: string } {
  const users = getUsers();
  const normalizedBizNo = normalizeBizNo(params.businessNo);
  const exists = users.find((u) => normalizeBizNo(u.businessNo) === normalizedBizNo);
  if (exists) {
    return { success: false, message: "이미 등록된 사업자번호입니다." };
  }

  const newUser: UserRecord = {
    businessNo: normalizedBizNo,
    clinicName: params.clinicName,
    contactName: params.contactName,
    phone: params.phone,
    role: params.role,
    password: params.passwordHash,
  };

  upsertUser(newUser);
  return { success: true, message: "회원가입이 완료되었습니다." };
}

// 관리자 계정 초기화 (앱 실행 시 seed 보장)
export function initializeAdminAccount() {
  ensureSeedUsers();
}

// 세션 저장
export function setAuthUser(session: Session) {
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
}

export function getUserRole(): UserRole | null {
  const session = getSession();
  return session?.role || null;
}

export function isAdmin(): boolean {
  return getUserRole() === "admin";
}

export function clearAuth(): void {
  logout();
}

export function getAuthUser(): Session | null {
  return getSession();
}

// 로그인 함수 (구버전 호환)
export function login(params: { businessNo: string; password: string; role: UserRole }): Session {
  const result = validateLogin(params.businessNo, params.password);
  if (!result.success || !result.user) throw new Error(result.message || "로그인 실패");
  const session: Session = {
    businessNo: result.user.businessNo,
    role: result.user.role,
    clinicName: result.user.clinicName,
  };
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
  return session;
}
