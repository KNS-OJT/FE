import { api } from '@/lib/http';
import { asObj, bool, num, str, toPage, type Obj } from '@/lib/pick';
import type { Role } from '@/auth/roles';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  lastLoginAt: string;
  createdAt: string;
}
const map = (o: Obj): User => {
  const r = o.role;
  const role = typeof r === 'string' ? r : str(asObj(r), 'name', 'roleName');
  return {
    id: num(o, 'id', 'userId'),
    username: str(o, 'username'),
    fullName: str(o, 'fullName'),
    email: str(o, 'email'),
    role: role || str(o, 'roleName'),
    active: bool(o, true, 'active', 'isActive', 'enabled'),
    lastLoginAt: str(o, 'lastLoginAt'),
    createdAt: str(o, 'createdAt'),
  };
};
export interface UserCreate {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: Role;
}

export const usersApi = {
  /** GET /api/users?q=&page=&size= (chỉ Manager) */
  list: async (p: { q?: string; page: number; size: number }) => toPage(await api.get<unknown>('/users', p), map),
  get: async (id: number) => map(asObj(await api.get<unknown>(`/users/${id}`))),
  create: (v: UserCreate) => api.post<unknown>('/users', { ...v, username: v.username.trim(), fullName: v.fullName.trim(), email: v.email.trim() }),
  lock: (id: number) => api.post<unknown>(`/users/${id}/lock`),
  changeRole: (id: number, role: Role) => api.put<unknown>(`/users/${id}/role`, { role }),
};
