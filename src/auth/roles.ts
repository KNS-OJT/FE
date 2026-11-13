/** Đúng 4 role theo SRS mục 2 / bảng roles. Không có ADMIN. */
export const ROLES = ['REQUESTER', 'WAREHOUSE_STAFF', 'PURCHASING_STAFF', 'MANAGER'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  REQUESTER: 'Người yêu cầu',
  WAREHOUSE_STAFF: 'Nhân viên kho',
  PURCHASING_STAFF: 'Nhân viên mua hàng',
  MANAGER: 'Quản lý',
};

export const isRole = (v: unknown): v is Role => typeof v === 'string' && (ROLES as readonly string[]).includes(v);
