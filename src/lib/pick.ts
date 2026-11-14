/**
 * Đọc trường từ JSON của BE theo danh sách tên ứng viên.
 * Lý do: tài liệu BE chưa ghi chính xác tên trường của mọi DTO. Tên đúng đặt ĐẦU danh sách;
 * khi BE chốt Swagger, chỉ cần sửa trong src/api/*.ts.
 */
export type Obj = Record<string, unknown>;

export const asObj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});

export function str(o: Obj, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (v != null && v !== '') return String(v);
  }
  return '';
}
export function num(o: Obj, ...keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (v != null && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}
export function optNum(o: Obj, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (v != null && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}
export function bool(o: Obj, fallback: boolean, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'boolean') return v;
  }
  return fallback;
}
export function arr(o: Obj, ...keys: string[]): Obj[] {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v.map(asObj);
  }
  return [];
}

export interface Page<T> {
  items: T[];
  page: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Chuẩn hóa phân trang: { items,... } (chuẩn của BE), Spring Page { content, number }, hoặc mảng. */
export function toPage<T>(raw: unknown, map: (o: Obj) => T): Page<T> {
  if (Array.isArray(raw)) {
    const items = raw.map((x) => map(asObj(x)));
    return { items, page: 0, size: items.length, totalElements: items.length, totalPages: 1 };
  }
  const o = asObj(raw);
  const list = Array.isArray(o.items) ? o.items : Array.isArray(o.content) ? o.content : [];
  const items = list.map((x: unknown) => map(asObj(x)));
  return {
    items,
    page: num(o, 'page', 'number'),
    size: num(o, 'size') || items.length,
    totalElements: num(o, 'totalElements', 'total') || items.length,
    totalPages: num(o, 'totalPages') || 1,
  };
}

/** Trạng thái: viết hoa, CANCELLED → CANCELED (SRS viết lẫn 2 kiểu, BE dùng CANCELED). */
export const normStatus = (s: string) => {
  const u = s.toUpperCase().replace(/\s+/g, '_');
  return u === 'CANCELLED' ? 'CANCELED' : u;
};
