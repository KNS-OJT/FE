import type { Role } from './roles';

/**
 * Ma trận quyền phía FE (UX). BE vẫn kiểm tra RBAC cho từng API.
 * Nguồn: SRS v1.1 mục 2 + 4, đối chiếu tài liệu BE hiện tại. Chỗ BE rộng hơn SRS, FE theo SRS (chặt hơn).
 */
const R: Role = 'REQUESTER', W: Role = 'WAREHOUSE_STAFF', P: Role = 'PURCHASING_STAFF', M: Role = 'MANAGER';

export const PERMISSIONS = {
  'dashboard:view': [R, W, P, M],
  'user:manage': [M], // IN01
  'category:view': [R, W, P, M],
  'category:manage': [W, M], // IN02
  'product:view': [R, W, P, M], // IN15
  'product:manage': [W, M], // IN02
  'stock:minimum': [W, M], // IN05
  'stock:view': [W, M], // IN04 (BE hiện cho mọi role xem — đã báo IA)
  'stock:low': [W, P, M], // IN14
  'ledger:view': [W, M], // IN13 (BE hiện cho mọi role xem — đã báo IA)
  'pr:view': [R, W, P, M], // IN06
  'pr:create': [R, W, P, M],
  'pr:approve': [M], // IN07, BR-09
  'supplier:view': [P, M], // IN03
  'supplier:manage': [P],
  'po:view': [W, P, M], // IN08
  'po:manage': [P], // BR-09
  'gr:view': [W, P, M], // IN09-10
  'gr:manage': [W],
  'issue:view': [R, W, M], // IN11 (BE chưa cho Purchasing)
  'issue:create': [R, W, M],
  'issue:confirm': [W], // IN12 (BE chưa có API)
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, p: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[p] as readonly Role[]).includes(role);
}
