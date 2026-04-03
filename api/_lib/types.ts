export type LoginMethod = 'phone' | 'wechat' | 'qq';

export interface AuthUser {
  id: string;
  phone: string;
  username?: string;
  avatar?: string;
  courseType?: string;
  loginMethod: LoginMethod;
  createdAt: number;
}

export interface AppUserRow {
  id: string;
  phone: string;
  username: string | null;
  avatar_url: string | null;
  course_type: string | null;
  login_method: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenPayload {
  uid: string;
  phone: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

export interface SmsVerificationResult {
  success: boolean;
  message?: string;
}

export interface SmsSendResult extends SmsVerificationResult {
  status?: number;
}
