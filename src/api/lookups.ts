import { useQuery } from '@tanstack/react-query';
import { productsApi, type Product } from './products';
import { stockApi, type StockRow } from './stock';
import { suppliersApi, type Supplier } from './suppliers';
import { usersApi, type User } from './users';

/**
 * Bảng tra cứu dùng chung: BE trả dòng PO/phiếu xuất chỉ có productId, sổ kho chỉ có ID người thực hiện.
 * Kích thước tối đa BE cho phép là 100 → đủ cho dữ liệu demo.
 */
export function useProductMap(enabled = true) {
  return useQuery({
    queryKey: ['lookup', 'products'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const page = await productsApi.list({ page: 0, size: 100 });
      return new Map<number, Product>(page.items.map((p) => [p.id, p]));
    },
  });
}
export function useStockMap(enabled = true) {
  return useQuery({
    queryKey: ['lookup', 'stock'],
    enabled,
    staleTime: 10_000,
    queryFn: async () => {
      const page = await stockApi.list({ page: 0, size: 100 });
      return new Map<number, StockRow>(page.items.map((s) => [s.productId, s]));
    },
  });
}
export function useSupplierMap(enabled = true) {
  return useQuery({
    queryKey: ['lookup', 'suppliers'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const page = await suppliersApi.list({ page: 0, size: 100 });
      return new Map<number, Supplier>(page.items.map((s) => [s.id, s]));
    },
  });
}
export function useUserMap(enabled = true) {
  return useQuery({
    queryKey: ['lookup', 'users'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const page = await usersApi.list({ page: 0, size: 100 });
      return new Map<number, User>(page.items.map((u) => [u.id, u]));
    },
  });
}

export const productLabel = (m: Map<number, Product> | undefined, id: number) => {
  const p = m?.get(id);
  return p ? `${p.sku} · ${p.name}` : `Sản phẩm #${id}`;
};
