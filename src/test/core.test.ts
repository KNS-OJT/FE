import { describe, expect, it, beforeEach } from 'vitest';
import { can } from '@/auth/permissions';
import { toPage, normStatus } from '@/lib/pick';
import { safeRedirect } from '@/lib/safeRedirect';
import { toApiError } from '@/lib/errors';
import { AxiosError, AxiosHeaders } from 'axios';
import { grMock } from '@/api/goodsReceiptsMock';

describe('permissions (SRS mục 2, 4)', () => {
  it('chỉ Manager quản lý user và duyệt PR (IN01, IN07, BR-09)', () => {
    expect(can('MANAGER', 'user:manage')).toBe(true);
    expect(can('MANAGER', 'pr:approve')).toBe(true);
    for (const r of ['REQUESTER', 'WAREHOUSE_STAFF', 'PURCHASING_STAFF'] as const) {
      expect(can(r, 'user:manage')).toBe(false);
      expect(can(r, 'pr:approve')).toBe(false);
    }
  });
  it('chỉ Purchasing tạo PO (BR-09); Requester không xem PO', () => {
    expect(can('PURCHASING_STAFF', 'po:manage')).toBe(true);
    expect(can('MANAGER', 'po:manage')).toBe(false);
    expect(can('REQUESTER', 'po:view')).toBe(false);
  });
  it('mọi role tạo được PR (IN06)', () => {
    for (const r of ['REQUESTER', 'WAREHOUSE_STAFF', 'PURCHASING_STAFF', 'MANAGER'] as const) expect(can(r, 'pr:create')).toBe(true);
  });
  it('chỉ Warehouse xác nhận xuất / nhập (IN10, IN12)', () => {
    expect(can('WAREHOUSE_STAFF', 'issue:confirm')).toBe(true);
    expect(can('MANAGER', 'issue:confirm')).toBe(false);
    expect(can('WAREHOUSE_STAFF', 'gr:manage')).toBe(true);
  });
  it('không có role thì không có quyền', () => expect(can(undefined, 'dashboard:view')).toBe(false));
});

describe('chuẩn hóa dữ liệu BE', () => {
  it('đọc trang chuẩn { items, page, totalElements }', () => {
    const p = toPage({ items: [{ a: 1 }], page: 2, size: 20, totalElements: 41, totalPages: 3 }, (o) => o.a);
    expect(p).toEqual({ items: [1], page: 2, size: 20, totalElements: 41, totalPages: 3 });
  });
  it('đọc Spring Page và mảng trực tiếp', () => {
    expect(toPage({ content: [{ a: 1 }], number: 1, totalElements: 5 }, (o) => o.a).page).toBe(1);
    expect(toPage([{ a: 1 }, { a: 2 }], (o) => o.a).totalElements).toBe(2);
  });
  it('CANCELLED → CANCELED', () => expect(normStatus('cancelled')).toBe('CANCELED'));
});

describe('bảo mật', () => {
  it('chặn open redirect', () => {
    expect(safeRedirect('/pr/1')).toBe('/pr/1');
    expect(safeRedirect('//evil.com')).toBe('/');
    expect(safeRedirect('https://evil.com')).toBe('/');
    expect(safeRedirect('/\\evil.com')).toBe('/');
  });
  it('không lộ message lỗi 5xx của server', () => {
    const err = new AxiosError('x', 'ERR', undefined, undefined, {
      status: 500, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: { message: 'org.postgresql.util.PSQLException: ...' },
    });
    expect(toApiError(err).message).not.toContain('PSQL');
  });
  it('map INSUFFICIENT_STOCK sang câu của SRS', () => {
    const err = new AxiosError('x', 'ERR', undefined, undefined, {
      status: 409, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: { code: 'INSUFFICIENT_STOCK', message: 'x' },
    });
    expect(toApiError(err).message).toBe('Số lượng xuất vượt quá tồn kho khả dụng');
  });
});

describe('phiếu nhập mô phỏng (BR-06, chống xác nhận lặp)', () => {
  beforeEach(() => window.sessionStorage.clear());
  const base = { poId: 1, poCode: 'PO-1', documentReference: 'HD-01', note: '', createdBy: 'A' };
  it('chặn nhận vượt số đặt', async () => {
    await expect(grMock.create({ ...base, items: [{ poItemId: 1, productId: 1, orderedQuantity: 10, receivedQuantity: 11 }] })).rejects.toMatchObject({ status: 409 });
  });
  it('xác nhận 1 lần; lần 2 bị chặn; lũy kế không vượt số đặt', async () => {
    const a = await grMock.create({ ...base, items: [{ poItemId: 1, productId: 1, orderedQuantity: 10, receivedQuantity: 6 }] });
    await grMock.confirm(a.id);
    await expect(grMock.confirm(a.id)).rejects.toMatchObject({ status: 409 });
    await expect(grMock.create({ ...base, items: [{ poItemId: 1, productId: 1, orderedQuantity: 10, receivedQuantity: 5 }] })).rejects.toMatchObject({ status: 409 });
  });
});

describe('chuẩn hóa lỗi theo nhiều dạng body', () => {
  const resp = (status: number, data: unknown, headers: Record<string, string> = {}) =>
    new AxiosError('x', 'ERR', undefined, undefined, { status, statusText: '', headers, config: { headers: new AxiosHeaders() }, data });

  it('đọc errorCode + errors[] (field, rule, message)', () => {
    const e = toApiError(resp(400, { success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', errors: [{ field: 'email', rule: 'isEmail', message: 'Email sai định dạng' }] }));
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e.fieldErrors).toEqual({ email: 'Email sai định dạng' });
  });
  it('không hiển thị tên mã HTTP tiếng Anh', () => {
    expect(toApiError(resp(403, { status: 403, error: 'Forbidden', message: 'Forbidden' })).message).toBe('Bạn không có quyền thực hiện thao tác này.');
    expect(toApiError(resp(400, { error: 'Bad Request' })).message).not.toMatch(/Bad Request/);
  });
  it('404 không khẳng định chứng từ không tồn tại (chống dò ID)', () => {
    expect(toApiError(resp(404, {})).message).toContain('không có quyền xem');
  });
  it('429 dùng Retry-After', () => {
    expect(toApiError(resp(429, {}, { 'retry-after': '30' })).message).toContain('30 giây');
  });
  it('503 và 5xx không lộ message server, không trả fieldErrors', () => {
    const e = toApiError(resp(503, { message: 'Connection refused: db:5432', errors: [{ field: 'x', message: 'y' }] }));
    expect(e.message).toBe('Hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.');
    expect(e.fieldErrors).toBeUndefined();
  });
  it('mã nghiệp vụ P03 có câu tiếng Việt', () => {
    expect(toApiError(resp(409, { errorCode: 'PR_ALREADY_HAS_PO', message: 'x' })).message).toBe('Đề nghị mua này đã có đơn đặt hàng.');
    expect(toApiError(resp(403, { errorCode: 'SELF_APPROVAL_FORBIDDEN' })).message).toContain('tự duyệt');
  });
});
