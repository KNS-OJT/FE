import { useCallback } from 'react';
import { useAuthStore } from './authStore';
import { can as canFn, type Permission } from './permissions';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const can = useCallback((p: Permission) => canFn(user?.role, p), [user?.role]);
  return { user, role: user?.role, can };
}
