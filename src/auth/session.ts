import type { Role } from './roles';

/**
 * NƠI DUY NHẤT đọc/ghi token. BE chưa có refresh token nên dùng sessionStorage
 * (tự xóa khi đóng tab, không chia sẻ giữa các tab). Vẫn đọc được bằng JS → phải chống XSS.
 */
const KEY = 'p03.session';

export interface SessionUser {
  userId: number;
  username: string;
  fullName: string;
  role: Role;
}
export interface Session {
  accessToken: string;
  expiresAt: number;
  user: SessionUser;
}

export function loadSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.accessToken || typeof s.expiresAt !== 'number' || Date.now() >= s.expiresAt) {
      clearStoredSession();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}
export function saveSession(s: Session) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage bị chặn */
  }
}
export function clearStoredSession() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
