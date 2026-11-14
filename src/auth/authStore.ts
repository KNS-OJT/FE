import { create } from 'zustand';
import { clearStoredSession, loadSession, saveSession, type Session, type SessionUser } from './session';

interface AuthState {
  accessToken: string | null;
  expiresAt: number | null;
  user: SessionUser | null;
  /** 'logout' = người dùng chủ động đăng xuất → không nhớ trang cũ cho lần đăng nhập sau. */
  endReason: 'logout' | 'expired' | null;
  setSession: (s: Session) => void;
  clearSession: (reason?: 'logout' | 'expired') => void;
}

const initial = loadSession();
let timer: ReturnType<typeof setTimeout> | undefined;
const schedule = (at: number, fn: () => void) => {
  if (timer) clearTimeout(timer);
  const ms = at - Date.now();
  if (ms > 0) timer = setTimeout(fn, Math.min(ms, 2_147_000_000));
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  accessToken: initial?.accessToken ?? null,
  expiresAt: initial?.expiresAt ?? null,
  user: initial?.user ?? null,
  endReason: null,
  setSession: (s) => {
    saveSession(s);
    set({ accessToken: s.accessToken, expiresAt: s.expiresAt, user: s.user, endReason: null });
    schedule(s.expiresAt, () => get().clearSession());
  },
  clearSession: (reason = 'expired') => {
    if (timer) clearTimeout(timer);
    clearStoredSession();
    set({ accessToken: null, expiresAt: null, user: null, endReason: reason });
  },
}));

if (initial) schedule(initial.expiresAt, () => useAuthStore.getState().clearSession());
