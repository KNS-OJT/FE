import { api } from '@/lib/http';
import { asObj, num, str } from '@/lib/pick';
import { isRole } from '@/auth/roles';
import { useAuthStore } from '@/auth/authStore';
import type { ApiError } from '@/lib/errors';

/** POST /api/auth/login → { accessToken, tokenType, expiresIn, role, userId, username, fullName } */
export async function login(username: string, password: string): Promise<void> {
  const raw = asObj(await api.post<unknown>('/auth/login', { username: username.trim(), password }));
  const token = str(raw, 'accessToken', 'token');
  const role = str(raw, 'role');
  if (!token || !isRole(role)) {
    const e: ApiError = { status: 500, message: 'Phản hồi đăng nhập không hợp lệ.' };
    throw e;
  }
  const expiresIn = num(raw, 'expiresIn') || 1800;
  useAuthStore.getState().setSession({
    accessToken: token,
    expiresAt: Date.now() + Math.max(0, expiresIn - 30) * 1000,
    user: { userId: num(raw, 'userId', 'id'), username: str(raw, 'username'), fullName: str(raw, 'fullName', 'username'), role },
  });
  // Không log raw: có token.
}

export const logout = () => useAuthStore.getState().clearSession('logout');

/** GET /api/auth/me */
export const me = async () => asObj(await api.get<unknown>('/auth/me'));
