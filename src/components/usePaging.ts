import { useState } from 'react';
import type { TablePaginationConfig } from 'antd';

/** Ant Design đếm trang từ 1, BE đếm từ 0. */
export function usePaging(defaultSize = 20) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultSize);
  const pagination = (total: number): TablePaginationConfig => ({
    current: page + 1,
    pageSize: size,
    total,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100],
    showTotal: (t) => `${t} dòng`,
    locale: { items_per_page: '/ trang' },
    onChange: (p, s) => {
      setPage(s !== size ? 0 : p - 1);
      setSize(Math.min(s, 100));
    },
  });
  return { page, size, setPage, pagination };
}
