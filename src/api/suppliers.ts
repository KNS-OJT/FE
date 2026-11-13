import { api } from '@/lib/http';
import { asObj, bool, num, str, toPage, type Obj } from '@/lib/pick';

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
}
const map = (o: Obj): Supplier => ({
  id: num(o, 'id', 'supplierId'),
  name: str(o, 'name', 'supplierName'),
  contactPerson: str(o, 'contactPerson', 'contactName'),
  phone: str(o, 'phone'),
  email: str(o, 'email'),
  address: str(o, 'address'),
  active: bool(o, true, 'active', 'isActive'),
});
export type SupplierInput = Omit<Supplier, 'id'>;
const clean = (s?: string) => (s && s.trim() ? s.trim() : null);
const body = (v: SupplierInput) => ({
  name: v.name.trim(),
  supplierName: v.name.trim(),
  contactPerson: clean(v.contactPerson),
  phone: clean(v.phone),
  email: clean(v.email),
  address: clean(v.address),
  active: v.active,
  isActive: v.active,
});

export const suppliersApi = {
  /** GET /api/suppliers?q=&isActive=&page=&size= */
  list: async (p: { q?: string; isActive?: boolean; page: number; size: number }) => toPage(await api.get<unknown>('/suppliers', p), map),
  get: async (id: number) => map(asObj(await api.get<unknown>(`/suppliers/${id}`))),
  create: (v: SupplierInput) => api.post<unknown>('/suppliers', body(v)),
  update: (id: number, v: SupplierInput) => api.put<unknown>(`/suppliers/${id}`, body(v)),
};
