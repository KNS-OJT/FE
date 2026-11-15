import { api } from '@/lib/http';
import { arr, asObj, normStatus, num, optNum, str, toPage, type Obj } from '@/lib/pick';

export type GrStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED';

export interface GrItem {
  id: number;
  productId?: number;
  purchaseOrderItemId?: number;
  receivedQuantity: number;
}

export interface GoodsReceipt {
  id: number;
  code: string;
  purchaseOrderId: number;
  receivedBy: number;
  receivedAt: string;
  confirmedBy: number;
  confirmedAt: string;
  status: GrStatus;
  documentReference: string;
  note: string;
  cancelReason: string;
  items: GrItem[];
}

const mapItem = (o: Obj): GrItem => ({
  id: num(o, 'id'),
  productId: optNum(o, 'productId'),
  purchaseOrderItemId: optNum(o, 'purchaseOrderItemId', 'poItemId'),
  receivedQuantity: num(o, 'receivedQuantity', 'quantity'),
});

const mapGr = (o: Obj): GoodsReceipt => ({
  id: num(o, 'id', 'goodsReceiptId'),
  code: str(o, 'code', 'receiptCode'),
  purchaseOrderId: num(o, 'purchaseOrderId', 'poId'),
  receivedBy: num(o, 'receivedBy'),
  receivedAt: str(o, 'receivedAt'),
  confirmedBy: num(o, 'confirmedBy'),
  confirmedAt: str(o, 'confirmedAt'),
  status: normStatus(str(o, 'status') || 'DRAFT') as GrStatus,
  documentReference: str(o, 'documentReference'),
  note: str(o, 'note'),
  cancelReason: str(o, 'cancelReason'),
  items: arr(o, 'items', 'lines').map(mapItem),
});

export interface GrCreateInput {
  purchaseOrderId: number;
  documentReference?: string;
  note?: string;
  items: { purchaseOrderItemId: number; receivedQuantity: number }[];
}

export interface GrUpdateInput {
  documentReference?: string;
  note?: string;
  items: { purchaseOrderItemId: number; receivedQuantity: number }[];
}

export const goodsReceiptsApi = {
  /** GET /api/goods-receipts?status=&page=&size= */
  list: async (p: { status?: string; page?: number; size?: number }) =>
    toPage(await api.get<unknown>('/goods-receipts', p), mapGr),

  /** GET /api/goods-receipts/{id} */
  get: async (id: number) => mapGr(asObj(await api.get<unknown>(`/goods-receipts/${id}`))),

  /** POST /api/goods-receipts */
  create: async (v: GrCreateInput) =>
    mapGr(asObj(await api.post<unknown>('/goods-receipts', {
      purchaseOrderId: v.purchaseOrderId,
      documentReference: v.documentReference?.trim() || null,
      note: v.note?.trim() || null,
      items: v.items.filter(i => i.receivedQuantity > 0).map(i => ({
        purchaseOrderItemId: i.purchaseOrderItemId,
        receivedQuantity: i.receivedQuantity,
      })),
    }))),

  /** PUT /api/goods-receipts/{id} */
  update: async (id: number, v: GrUpdateInput) =>
    mapGr(asObj(await api.put<unknown>(`/goods-receipts/${id}`, {
      documentReference: v.documentReference?.trim() || null,
      note: v.note?.trim() || null,
      items: v.items.map(i => ({
        purchaseOrderItemId: i.purchaseOrderItemId,
        receivedQuantity: i.receivedQuantity,
      })),
    }))),

  /** POST /api/goods-receipts/{id}/confirm { documentReference } */
  confirm: async (id: number, documentReference: string) =>
    mapGr(asObj(await api.post<unknown>(`/goods-receipts/${id}/confirm`, { documentReference }))),

  /** POST /api/goods-receipts/{id}/cancel { reason } */
  cancel: async (id: number, reason: string) =>
    mapGr(asObj(await api.post<unknown>(`/goods-receipts/${id}/cancel`, { reason }))),
};
