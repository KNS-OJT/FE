import { api } from '@/lib/http';
import { asObj, bool, num, str, type Obj } from '@/lib/pick';

export interface Category {
  id: number;
  name: string;
  description: string;
  active: boolean;
}
const map = (o: Obj): Category => ({
  id: num(o, 'id', 'categoryId'),
  name: str(o, 'name', 'categoryName'),
  description: str(o, 'description'),
  active: bool(o, true, 'active', 'isActive'),
});

export interface CategoryInput {
  name: string;
  description?: string;
  active: boolean;
}
// Gửi kèm tên trường thay thế: Spring/Jackson mặc định bỏ qua trường lạ.
const body = (v: CategoryInput) => ({ name: v.name.trim(), categoryName: v.name.trim(), description: v.description?.trim() || null, active: v.active, isActive: v.active });

export const categoriesApi = {
  /** GET /api/categories → mảng (không phân trang) */
  list: async () => {
    const raw = await api.get<unknown>('/categories');
    return (Array.isArray(raw) ? raw : []).map((x) => map(asObj(x)));
  },
  create: (v: CategoryInput) => api.post<unknown>('/categories', body(v)),
  update: (id: number, v: CategoryInput) => api.put<unknown>(`/categories/${id}`, body(v)),
};
