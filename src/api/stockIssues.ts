import { api } from '@/lib/http';
import { arr, asObj, normStatus, num, str, toPage, type Obj } from '@/lib/pick';

export interface IssueItem {
  id: number;
  productId: number;
  quantity: number;
}
export interface StockIssue {
  id: number;
  code: string;
  requesterId: number;
  requesterName: string;
  reason: string;
  note: string;
  status: string;
  createdAt: string;
  items: IssueItem[];
}
const map = (o: Obj): StockIssue => ({
  id: num(o, 'id', 'stockIssueId'),
  code: str(o, 'issueCode', 'code'),
  requesterId: num(o, 'requestedBy', 'requesterId', 'createdBy'),
  requesterName: str(o, 'requestedByName', 'requesterName'),
  reason: str(o, 'reason'),
  note: str(o, 'note'),
  status: normStatus(str(o, 'status') || 'DRAFT'),
  createdAt: str(o, 'requestedAt', 'createdAt'),
  items: arr(o, 'items', 'lines').map((i) => ({ id: num(i, 'id', 'stockIssueItemId'), productId: num(i, 'productId'), quantity: num(i, 'quantity') })),
});
export interface IssueInput {
  reason: string;
  note?: string;
  items: { productId: number; quantity: number }[];
}
const body = (v: IssueInput) => ({ reason: v.reason.trim(), note: v.note?.trim() || null, items: v.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) });

export const issuesApi = {
  /** GET /api/stock-issues?page=&size=&status= */
  list: async (p: { page: number; size: number; status?: string }) => toPage(await api.get<unknown>('/stock-issues', p), map),
  /** GET /api/stock-issues/{id} */
  get: async (id: number) => map(asObj(await api.get<unknown>(`/stock-issues/${id}`))),
  /** POST /api/stock-issues */
  create: async (v: IssueInput) => map(asObj(await api.post<unknown>('/stock-issues', body(v)))),
  /** PUT /api/stock-issues/{id} */
  update: async (id: number, v: IssueInput) => map(asObj(await api.put<unknown>(`/stock-issues/${id}`, body(v)))),
  /** POST /api/stock-issues/{id}/confirm — Warehouse Staff xác nhận xuất kho (trừ tồn) */
  confirm: async (id: number) => map(asObj(await api.post<unknown>(`/stock-issues/${id}/confirm`))),
  /** POST /api/stock-issues/{id}/reject { reason } — Warehouse Staff từ chối */
  reject: async (id: number, reason: string) => map(asObj(await api.post<unknown>(`/stock-issues/${id}/reject`, { reason }))),
  /** POST /api/stock-issues/{id}/cancel { reason } — Người tạo hủy */
  cancel: async (id: number, reason: string) => map(asObj(await api.post<unknown>(`/stock-issues/${id}/cancel`, { reason }))),
};
