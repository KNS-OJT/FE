import { Select } from 'antd';
import { useProductMap } from '@/api/lookups';

/** Chọn sản phẩm đang hoạt động (BR-12). `exclude`: sản phẩm đã chọn ở dòng khác. */
export function ProductSelect({ value, onChange, exclude = [], id }: { value?: number; onChange?: (v: number) => void; exclude?: number[]; id?: string }) {
  const { data, isLoading } = useProductMap();
  const options = [...(data?.values() ?? [])]
    .filter((p) => p.active || p.id === value)
    .map((p) => ({ value: p.id, label: `${p.sku} · ${p.name} (${p.unit})`, disabled: exclude.includes(p.id) && p.id !== value }));
  return (
    <Select
      id={id}
      showSearch
      optionFilterProp="label"
      placeholder="Chọn sản phẩm"
      loading={isLoading}
      value={value}
      onChange={onChange}
      options={options}
      style={{ width: '100%' }}
      notFoundContent="Không có sản phẩm"
    />
  );
}
