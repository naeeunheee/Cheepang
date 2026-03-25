export type UserRole = 'dental' | 'admin';

export interface AuthUser {
  businessNo: string;
  clinicName: string;
  role: UserRole;
}

export interface StoredUser {
  businessNo: string;
  clinicName: string;
  contactName?: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export const AUTH_STORAGE_KEY = 'currentClient';
export const ROLE_STORAGE_KEY = 'userRole';
export const USERS_STORAGE_KEY = 'cheepang_users_v1';