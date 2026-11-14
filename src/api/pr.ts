import { api } from '@/lib/http';
import { arr, asObj, normStatus, num, optNum, str, toPage, type Obj } from '@/lib/pick';

export type PrStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELED';
export interface PrItem {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  unit: string;
  quantity: number;
  note: string;
}
export interface PurchaseRequest {
  id: number;
  code: string;
  requesterId: number;
  requesterName: string;
  reason: string;
  status: PrStatus;
  createdAt: string;
  submittedAt: string;
  reviewedById?: number;
  reviewedByName: string;
  reviewedAt: string;
  reviewReason: string;
  cancelReason: string;
  items: PrItem[];
}
const mapItem = (o: Obj): PrItem => {
  const p = asObj(o.product);
  return {
    id: num(o, 'id', 'purchaseRequestItemId', 'itemId'),
    productId: num(o, 'productId') || num(p, 'id'),
    sku: str(o, 'sku') || str(p, 'sku'),
    productName: str(o, 'productName', 'name') || str(p, 'name'),
    unit: str(o, 'unit') || str(p, 'unit'),
    quantity: num(o, 'quantity'),
    note: str(o, 'note'),
  };
};
export const mapPr = (o: Obj): PurchaseRequest => ({
  id: num(o, 'id', 'purchaseRequestId'),
  code: str(o, 'requestCode', 'code', 'prCode'),
  requesterId: num(o, 'requesterId', 'createdBy'),
  requesterName: str(o, 'requesterName', 'requesterFullName', 'createdByName'),
  reason: str(o, 'reason'),
  status: normStatus(str(o, 'status')) as PrStatus,
  createdAt: str(o, 'createdAt'),
  submittedAt: str(o, 'submittedAt'),
  reviewedById: optNum(o, 'reviewedBy', 'reviewedById', 'approverId'),
  reviewedByName: str(o, 'reviewedByName', 'reviewerName', 'approverName'),
  reviewedAt: str(o, 'reviewedAt'),
  reviewReason: str(o, 'reviewReason', 'rejectReason'),
  cancelReason: str(o, 'cancelReason'),
  items: arr(o, 'items', 'lines').map(mapItem),
});

export interface PrInput {
  reason: string;
  items: { productId: number; quantity: number; note?: string }[];
}
/** Body chỉ gồm trường người dùng được nhập — KHÔNG gửi status/reviewedBy/requesterId (IA-IN07). */
const body = (v: PrInput) => ({
  reason: v.reason.trim(),
  items: v.items.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note?.trim() || null })),
});

export const prApi = {
  /** GET /api/pr?status=&q=&page=&size= */
  list: async (p: { status?: string; q?: string; page: number; size: number }) => toPage(await api.get<unknown>('/pr', p), mapPr),
  get: async (id: number) => mapPr(asObj(await api.get<unknown>(`/pr/${id}`))),
  create: async (v: PrInput) => mapPr(asObj(await api.post<unknown>('/pr', body(v)))),
  update: async (id: number, v: PrInput) => mapPr(asObj(await api.put<unknown>(`/pr/${id}`, body(v)))),
  submit: (id: number) => api.post<unknown>(`/pr/${id}/submit`),
  approve: (id: number) => api.post<unknown>(`/pr/${id}/approve`),
  /** Lý do bắt buộc (BR-10). Gửi cả 2 tên trường phổ biến. */
  reject: (id: number, reason: string) => api.post<unknown>(`/pr/${id}/reject`, { reason, reviewReason: reason }),
  cancel: (id: number, reason: string) => api.post<unknown>(`/pr/${id}/cancel`, { reason, cancelReason: reason }),
};
