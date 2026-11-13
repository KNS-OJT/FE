import { api } from '@/lib/http';
import { arr, asObj, normStatus, num, optNum, str, toPage, type Obj } from '@/lib/pick';

export type PoStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELED';
export interface PoItem {
  id: number;
  purchaseRequestItemId?: number;
  productId: number;
  quantity: number;
  receivedQuantity: number;
}
export interface PurchaseOrder {
  id: number;
  code: string;
  purchaseRequestId: number;
  prCode: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: PoStatus;
  note: string;
  createdAt: string;
  items: PoItem[];
}
const mapItem = (o: Obj): PoItem => ({
  id: num(o, 'id', 'purchaseOrderItemId'),
  purchaseRequestItemId: optNum(o, 'purchaseRequestItemId', 'prItemId'),
  productId: num(o, 'productId'),
  quantity: num(o, 'quantity', 'orderedQuantity'),
  receivedQuantity: num(o, 'receivedQuantity', 'received'),
});
export const mapPo = (o: Obj): PurchaseOrder => {
  const sup = asObj(o.supplier);
  return {
    id: num(o, 'id', 'purchaseOrderId'),
    code: str(o, 'orderCode', 'code', 'poCode'),
    purchaseRequestId: num(o, 'purchaseRequestId', 'prId'),
    prCode: str(o, 'requestCode', 'prCode', 'purchaseRequestCode'),
    supplierId: num(o, 'supplierId') || num(sup, 'id'),
    supplierName: str(o, 'supplierName') || str(sup, 'name', 'supplierName'),
    orderDate: str(o, 'orderDate'),
    expectedDeliveryDate: str(o, 'expectedDeliveryDate', 'expectedDate'),
    status: normStatus(str(o, 'status')) as PoStatus,
    note: str(o, 'note'),
    createdAt: str(o, 'createdAt'),
    items: arr(o, 'items', 'lines').map(mapItem),
  };
};

export interface PoInput {
  purchaseRequestId: number;
  supplierId: number;
  expectedDeliveryDate?: string | null; // YYYY-MM-DD, từ hôm nay trở đi
  note?: string;
  items: { purchaseRequestItemId: number; productId: number; quantity: number }[];
}
const body = (v: PoInput) => ({
  purchaseRequestId: v.purchaseRequestId,
  prId: v.purchaseRequestId,
  supplierId: v.supplierId,
  expectedDeliveryDate: v.expectedDeliveryDate || null,
  note: v.note?.trim() || null,
  items: v.items.map((i) => ({ purchaseRequestItemId: i.purchaseRequestItemId, prItemId: i.purchaseRequestItemId, productId: i.productId, quantity: i.quantity })),
});

export const poApi = {
  /** GET /api/po?status=&page=&size= */
  list: async (p: { status?: string; page: number; size: number }) => toPage(await api.get<unknown>('/po', p), mapPo),
  get: async (id: number) => mapPo(asObj(await api.get<unknown>(`/po/${id}`))),
  create: async (v: PoInput) => mapPo(asObj(await api.post<unknown>('/po', body(v)))),
  update: async (id: number, v: PoInput) => mapPo(asObj(await api.put<unknown>(`/po/${id}`, body(v)))),
  /** POST /api/po/{id}/order: DRAFT → ORDERED */
  order: (id: number) => api.post<unknown>(`/po/${id}/order`),
};
