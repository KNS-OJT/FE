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

/** BE mới có bản nháp: danh sách/chi tiết/tạo/sửa. Chưa có gửi, xác nhận, từ chối, hủy. */
export const issuesApi = {
  list: async (p: { page: number; size: number }) => toPage(await api.get<unknown>('/stock-issues', p), map),
  get: async (id: number) => map(asObj(await api.get<unknown>(`/stock-issues/${id}`))),
  create: async (v: IssueInput) => map(asObj(await api.post<unknown>('/stock-issues', body(v)))),
  update: async (id: number, v: IssueInput) => map(asObj(await api.put<unknown>(`/stock-issues/${id}`, body(v)))),
};
