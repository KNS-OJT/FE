import { api } from '@/lib/http';
import { asObj, num, optNum, str, toPage, type Obj } from '@/lib/pick';

export type TxType = 'IN' | 'OUT' | 'ADJUST_IN' | 'ADJUST_OUT';
export interface LedgerRow {
  id: number;
  createdAt: string;
  productId: number;
  sku: string;
  productName: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  actorId?: number;
  actorName: string;
  note: string;
}
const map = (o: Obj): LedgerRow => {
  const p = asObj(o.product);
  return {
    id: num(o, 'id', 'stockTransactionId'),
    createdAt: str(o, 'createdAt', 'occurredAt', 'transactionAt'),
    productId: num(o, 'productId') || num(p, 'id'),
    sku: str(o, 'sku') || str(p, 'sku'),
    productName: str(o, 'productName') || str(p, 'name', 'productName'),
    type: str(o, 'transactionType', 'type').toUpperCase(),
    quantity: num(o, 'quantity'),
    balanceAfter: num(o, 'balanceAfter'),
    actorId: optNum(o, 'createdBy', 'createdById', 'actorId', 'userId'),
    actorName: str(o, 'createdByName', 'actorName', 'fullName'),
    note: str(o, 'note', 'reference', 'sourceCode'),
  };
};

export const ledgerApi = {
  /** GET /api/stock-transactions?productId=&type=&q=&page=&size= */
  list: async (p: { productId?: number; type?: string; q?: string; page: number; size: number }) =>
    toPage(await api.get<unknown>('/stock-transactions', p), map),
};
export const _mapLedger = (o: unknown) => map(asObj(o));
