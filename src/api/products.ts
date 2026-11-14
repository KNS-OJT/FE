import { api } from '@/lib/http';
import { asObj, bool, num, str, toPage, type Obj } from '@/lib/pick';

export interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  active: boolean;
  createdAt: string;
}
export const mapProduct = (o: Obj): Product => {
  const cat = asObj(o.category);
  return {
    id: num(o, 'id', 'productId'),
    sku: str(o, 'sku'),
    name: str(o, 'name', 'productName'),
    categoryId: num(o, 'categoryId') || num(cat, 'id', 'categoryId'),
    categoryName: str(o, 'categoryName') || str(cat, 'name', 'categoryName'),
    unit: str(o, 'unit'),
    active: bool(o, true, 'active', 'isActive'),
    createdAt: str(o, 'createdAt'),
  };
};

export interface ProductQuery {
  q?: string;
  categoryId?: number;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}
export interface ProductCreate {
  sku: string;
  name: string;
  categoryId: number;
  unit: string;
}

export const productsApi = {
  /** GET /api/products?q=&categoryId=&activeOnly=&page=&size= */
  list: async (p: ProductQuery) => toPage(await api.get<unknown>('/products', p), mapProduct),
  get: async (id: number) => mapProduct(asObj(await api.get<unknown>(`/products/${id}`))),
  /** POST /api/products { sku, name, categoryId, unit } */
  create: (v: ProductCreate) => api.post<unknown>('/products', { sku: v.sku.trim(), name: v.name.trim(), categoryId: v.categoryId, unit: v.unit.trim() }),
  /** PUT /api/products/{id} { sku, name, categoryId, unit, active } */
  update: (id: number, v: ProductCreate & { active: boolean }) =>
    api.put<unknown>(`/products/${id}`, { sku: v.sku.trim(), name: v.name.trim(), categoryId: v.categoryId, unit: v.unit.trim(), active: v.active }),
  /** PUT /api/products/{id}/min-stock { minimumStock } */
  setMinStock: (id: number, minimumStock: number) => api.put<unknown>(`/products/${id}/min-stock`, { minimumStock }),
};
