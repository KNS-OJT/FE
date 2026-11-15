import { api } from '@/lib/http';
import { arr, asObj, normStatus, num, optNum, str, toPage, type Obj } from '@/lib/pick';

export type AdjustmentType = 'OPENING' | 'STOCKTAKE' | 'CORRECTION';
export type AdjustmentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED';

export interface AdjustmentItem {
  id: number;
  productId: number;
  countedQuantity: number;
  note?: string;
}

export interface StockAdjustment {
  id: number;
  code: string;
  type: AdjustmentType;
  createdBy: number;
  confirmedBy?: number;
  status: AdjustmentStatus;
  reason: string;
  cancelReason?: string;
  createdAt: string;
  confirmedAt?: string;
  items: AdjustmentItem[];
}

const mapItem = (o: Obj): AdjustmentItem => ({
  id: num(o, 'id'),
  productId: num(o, 'productId'),
  countedQuantity: num(o, 'countedQuantity', 'quantity'),
  note: str(o, 'note') || undefined,
});

const mapAdj = (o: Obj): StockAdjustment => ({
  id: num(o, 'id', 'stockAdjustmentId'),
  code: str(o, 'code', 'adjustmentCode'),
  type: (str(o, 'type') || 'STOCKTAKE') as AdjustmentType,
  createdBy: num(o, 'createdBy'),
  confirmedBy: optNum(o, 'confirmedBy'),
  status: normStatus(str(o, 'status') || 'DRAFT') as AdjustmentStatus,
  reason: str(o, 'reason'),
  cancelReason: str(o, 'cancelReason') || undefined,
  createdAt: str(o, 'createdAt'),
  confirmedAt: str(o, 'confirmedAt') || undefined,
  items: arr(o, 'items', 'lines').map(mapItem),
});

export interface AdjustmentInput {
  type: AdjustmentType;
  reason: string;
  items: { productId: number; countedQuantity: number; note?: string }[];
}

export interface AdjustmentUpdateInput {
  reason: string;
  items: { productId: number; countedQuantity: number; note?: string }[];
}

const createBody = (v: AdjustmentInput) => ({
  type: v.type,
  reason: v.reason.trim(),
  items: v.items.map((i) => ({
    productId: i.productId,
    countedQuantity: i.countedQuantity,
    note: i.note?.trim() || null,
  })),
});

const updateBody = (v: AdjustmentUpdateInput) => ({
  reason: v.reason.trim(),
  items: v.items.map((i) => ({
    productId: i.productId,
    countedQuantity: i.countedQuantity,
    note: i.note?.trim() || null,
  })),
});

export const adjustmentsApi = {
  /** GET /api/stock-adjustments?status=&page=&size= */
  list: async (p: { status?: string; page?: number; size?: number }) =>
    toPage(await api.get<unknown>('/stock-adjustments', p), mapAdj),

  /** GET /api/stock-adjustments/{id} */
  get: async (id: number) => mapAdj(asObj(await api.get<unknown>(`/stock-adjustments/${id}`))),

  /** POST /api/stock-adjustments */
  create: async (v: AdjustmentInput) =>
    mapAdj(asObj(await api.post<unknown>('/stock-adjustments', createBody(v)))),

  /** PUT /api/stock-adjustments/{id} */
  update: async (id: number, v: AdjustmentUpdateInput) =>
    mapAdj(asObj(await api.put<unknown>(`/stock-adjustments/${id}`, updateBody(v)))),

  /** POST /api/stock-adjustments/{id}/approve — Manager phê duyệt */
  approve: async (id: number) =>
    mapAdj(asObj(await api.post<unknown>(`/stock-adjustments/${id}/approve`))),

  /** POST /api/stock-adjustments/{id}/cancel { reason } */
  cancel: async (id: number, reason: string) =>
    mapAdj(asObj(await api.post<unknown>(`/stock-adjustments/${id}/cancel`, { reason }))),
};
