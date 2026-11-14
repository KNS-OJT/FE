import { useState } from 'react';
import { Pill } from '@/components/StatusTag';
import { palette } from '@/theme';
import { Flex, Input, Select, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { ledgerApi, type LedgerRow } from '@/api/ledger';
import { useProductMap, useUserMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert } from '@/components/States';
import { usePaging } from '@/components/usePaging';
import { useDebounced } from '@/components/useDebounced';
import { useAuth } from '@/auth/useAuth';
import { TX_TYPE } from '@/constants/status';
import { fmtDateTime, fmtNum } from '@/lib/format';

export default function LedgerPage() {
  const { user } = useAuth();
  const [productId, setProductId] = useState<number>();
  const [type, setType] = useState<string>();
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const { page, size, setPage, pagination } = usePaging();
  const products = useProductMap();
  const users = useUserMap(user?.role === 'MANAGER'); // BE chỉ trả ID người thực hiện; chỉ Manager tra được tên
  const list = useQuery({
    queryKey: ['ledger', { productId, type, dq, page, size }],
    queryFn: () => ledgerApi.list({ productId, type, q: dq || undefined, page, size }),
  });

  return (
    <>
      <PageHeader title="Sổ kho" subtitle="Lịch sử nhập, xuất và điều chỉnh tồn. Chỉ xem, không thể sửa hay xóa." />
      <div className="toolbar">
        <Flex gap={12} wrap>
          <Select
            allowClear showSearch optionFilterProp="label" placeholder="Sản phẩm" style={{ width: 280 }} value={productId}
            onChange={(v) => { setProductId(v); setPage(0); }}
            options={[...(products.data?.values() ?? [])].map((p) => ({ value: p.id, label: `${p.sku} · ${p.name}` }))}
          />
          <Select
            allowClear placeholder="Loại giao dịch" style={{ width: 200 }} value={type}
            onChange={(v) => { setType(v); setPage(0); }}
            options={Object.entries(TX_TYPE).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Input allowClear prefix={<SearchOutlined style={{ color: palette.muted }} />} placeholder="Từ khóa" style={{ width: 220 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </Flex>
      </div>
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<LedgerRow>
        className="table-shell"
        rowKey={(r) => `${r.id}-${r.createdAt}`}
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        scroll={{ x: 1000 }}
        locale={{
          emptyText:
            productId || type || dq ? (
              <EmptyState title="Không có giao dịch phù hợp" hint="Thử bỏ bớt bộ lọc." />
            ) : (
              <EmptyState title="Chưa có giao dịch kho" hint="Giao dịch xuất hiện khi phiếu nhập, xuất hoặc điều chỉnh được xác nhận." />
            ),
        }}
        columns={[
          { title: 'Thời gian', dataIndex: 'createdAt', width: 150, render: fmtDateTime },
          { title: 'SKU', dataIndex: 'sku', render: (v, r) => <span className="sku">{v || products.data?.get(r.productId)?.sku || `#${r.productId}`}</span> },
          { title: 'Sản phẩm', dataIndex: 'productName', render: (v, r) => v || products.data?.get(r.productId)?.name || '—' },
          { title: 'Loại', dataIndex: 'type', width: 150, render: (t: string) => <Pill tone={TX_TYPE[t]?.tone ?? 'neutral'}>{TX_TYPE[t]?.label ?? t}</Pill> },
          {
            title: 'Số lượng', dataIndex: 'quantity', align: 'right', width: 110,
            render: (v: number, r) => {
              const sign = TX_TYPE[r.type]?.sign ?? 1;
              return <strong style={{ color: sign > 0 ? palette.success : palette.danger }}>{sign > 0 ? '+' : '−'}{fmtNum(Math.abs(v))}</strong>;
            },
          },
          { title: 'Tồn sau', dataIndex: 'balanceAfter', align: 'right', width: 100, render: fmtNum },
          { title: 'Người thực hiện', key: 'actor', render: (_, r) => r.actorName || (r.actorId ? users.data?.get(r.actorId)?.fullName ?? `Người dùng #${r.actorId}` : '—') },
          { title: 'Ghi chú', dataIndex: 'note', render: (v) => v || '—' },
        ]}
      />
    </>
  );
}
