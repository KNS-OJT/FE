import { api } from '@/lib/http';
import { asObj, bool, num, str, toPage, type Obj } from '@/lib/pick';

export interface StockRow {
  productId: number;
  sku: string;
  productName: string;
  categoryName: string;
  unit: string;
  quantity: number;
  minimumStock: number;
  low: boolean;
  updatedAt: string;
}
const map = (o: Obj): StockRow => {
  const p = asObj(o.product);
  const quantity = num(o, 'quantity', 'onHand');
  const minimumStock = num(o, 'minimumStock', 'minStock');
  return {
    productId: num(o, 'productId') || num(p, 'id', 'productId'),
    sku: str(o, 'sku') || str(p, 'sku'),
    productName: str(o, 'productName', 'name') || str(p, 'name', 'productName'),
    categoryName: str(o, 'categoryName'),
    unit: str(o, 'unit') || str(p, 'unit'),
    quantity,
    minimumStock,
    low: bool(o, quantity < minimumStock, 'low', 'lowStock', 'isLow'),
    updatedAt: str(o, 'updatedAt'),
  };
};

export const stockApi = {
  /** GET /api/stock?q=&page=&size= */
  list: async (p: { q?: string; page: number; size: number }) => toPage(await api.get<unknown>('/stock', p), map),
  /** GET /api/stock/low?page=&size= */
  low: async (p: { page: number; size: number }) => toPage(await api.get<unknown>('/stock/low', p), map),
};
export const _mapStock = (o: unknown) => map(asObj(o));
