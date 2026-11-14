import { Navigate, Outlet, useLocation } from 'react-router';
import type { Permission } from './permissions';
import { useAuthStore } from './authStore';
import { useAuth } from './useAuth';

export function RequireAuth() {
  const { user } = useAuth();
  const loc = useLocation();
  const endReason = useAuthStore((s) => s.endReason);
  // Hết phiên: nhớ trang để quay lại. Chủ động đăng xuất: không nhớ (người sau không bị đưa về trang của người trước).
  if (!user) return <Navigate to="/login" replace state={endReason === 'logout' ? null : { from: loc.pathname + loc.search }} />;
  return <Outlet />;
}

export function RequirePermission({ perm }: { perm: Permission }) {
  const { can } = useAuth();
  if (!can(perm)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
