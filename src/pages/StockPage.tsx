import { useState } from 'react';
import { Pill } from '@/components/StatusTag';
import { palette } from '@/theme';
import { useNavigate } from 'react-router';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Table, Tabs } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { stockApi, type StockRow } from '@/api/stock';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { usePaging } from '@/components/usePaging';
import { useDebounced } from '@/components/useDebounced';
import { useAuth } from '@/auth/useAuth';
import { fmtDateTime, fmtNum } from '@/lib/format';

function StockTable({ low }: { low: boolean }) {
  const nav = useNavigate();
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const { page, size, setPage, pagination } = usePaging();
  const [selected, setSelected] = useState<StockRow[]>([]);
  const list = useQuery({
    queryKey: ['stock', low ? 'low' : 'all', { dq, page, size }],
    queryFn: () => (low ? stockApi.low({ page, size }) : stockApi.list({ q: dq || undefined, page, size })),
  });

  return (
    <>
      {!low && (
        <div className="toolbar">
          <Input allowClear prefix={<SearchOutlined style={{ color: palette.muted }} />} placeholder="Tìm theo SKU hoặc tên" style={{ maxWidth: 320 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
      )}
      {low && can('pr:create') && (
        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 12 }}>
          <span>{selected.length ? `Đã chọn ${selected.length} sản phẩm` : 'Chọn sản phẩm để tạo đề nghị mua. Hệ thống chỉ điền sẵn PR, không tự gửi.'}</span>
          <Button
            type="primary"
            disabled={!selected.length}
            onClick={() =>
              nav('/pr/new', {
                state: {
                  reason: 'Bổ sung hàng tồn dưới mức tối thiểu',
                  items: selected.map((s) => ({ productId: s.productId, quantity: Math.max(1, s.minimumStock - s.quantity) })),
                },
              })
            }
          >
            Tạo PR từ các dòng đã chọn
          </Button>
        </Flex>
      )}
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<StockRow>
        className="table-shell"
        rowKey="productId"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        scroll={{ x: 900 }}
        rowSelection={low && can('pr:create') ? { selectedRowKeys: selected.map((s) => s.productId), onChange: (_, rows) => setSelected(rows) } : undefined}
        onRow={(r) => ({ style: r.low ? { background: palette.sandSoft } : undefined })}
        locale={{ emptyText: low ? 'Không có sản phẩm dưới mức tối thiểu' : 'Chưa có dữ liệu tồn kho' }}
        columns={[
          { title: 'SKU', dataIndex: 'sku', render: (v) => <span className="sku">{v}</span> },
          { title: 'Sản phẩm', dataIndex: 'productName' },
          { title: 'Nhóm', dataIndex: 'categoryName', render: (v) => v || '—' },
          { title: 'Đơn vị', dataIndex: 'unit', width: 90 },
          { title: 'Tồn hiện có', dataIndex: 'quantity', align: 'right', render: (v) => <strong>{fmtNum(v)}</strong> },
          { title: 'Tồn tối thiểu', dataIndex: 'minimumStock', align: 'right', render: fmtNum },
          ...(low ? [{ title: 'Số thiếu', key: 'short', align: 'right' as const, render: (_: unknown, r: StockRow) => <strong style={{ color: palette.danger }}>{fmtNum(Math.max(0, r.minimumStock - r.quantity))}</strong> }] : []),
          { title: 'Tình trạng', dataIndex: 'low', width: 120, render: (l) => (l ? <Pill tone="bad">Tồn thấp</Pill> : <Pill tone="ok">Đủ hàng</Pill>) },
          { title: 'Cập nhật', dataIndex: 'updatedAt', width: 150, render: fmtDateTime },
        ]}
      />
    </>
  );
}

export default function StockPage({ defaultTab = 'all' }: { defaultTab?: 'all' | 'low' }) {
  const { can } = useAuth();
  const nav = useNavigate();
  const tabs = [
    ...(can('stock:view') ? [{ key: 'all', label: 'Tất cả tồn kho', children: <StockTable low={false} /> }] : []),
    ...(can('stock:low') ? [{ key: 'low', label: 'Hàng tồn thấp', children: <StockTable low /> }] : []),
  ];
  const active = tabs.some((t) => t.key === defaultTab) ? defaultTab : tabs[0]?.key;
  const title = active === 'low' ? 'Cảnh báo tồn thấp' : 'Tồn kho';
  const subtitle = active === 'low'
    ? 'Sản phẩm có số tồn nhỏ hơn mức tối thiểu.'
    : 'Số tồn chỉ thay đổi khi phiếu nhập, xuất hoặc điều chỉnh được xác nhận. Ngưỡng tối thiểu chỉnh ở màn Sản phẩm.';
  // Chỉ một tab (Nhân viên mua hàng) thì không cần thanh tab.
  if (tabs.length === 1) return (<><PageHeader title={title} subtitle={subtitle} />{tabs[0].children}</>);
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Tabs activeKey={active} items={tabs} onChange={(k) => nav(k === 'low' ? '/stock/low' : '/stock')} destroyOnHidden />
    </>
  );
}
