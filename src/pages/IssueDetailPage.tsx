import { useNavigate, useParams } from 'react-router';
import { Alert, Button, Card, Descriptions, Spin, Table, Tooltip } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { issuesApi, type IssueItem } from '@/api/stockIssues';
import { useProductMap, useStockMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert, PendingApiBanner } from '@/components/States';
import { Pill, StatusTag } from '@/components/StatusTag';
import { useAuth } from '@/auth/useAuth';
import { fmtDateTime, fmtNum } from '@/lib/format';
import { INSUFFICIENT } from './IssueFormPage';

export default function IssueDetailPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const { user, can } = useAuth();
  const q = useQuery({ queryKey: ['issues', id], queryFn: () => issuesApi.get(id) });
  const products = useProductMap();
  const stock = useStockMap();

  if (q.isLoading) return <Spin />;
  if (q.error || !q.data) return <ErrorAlert error={q.error} onRetry={() => q.refetch()} />;
  const si = q.data;
  const isOwner = si.requesterId === user?.userId;
  const shortage = si.items.some((i) => (stock.data?.get(i.productId)?.quantity ?? Infinity) < i.quantity);
  const pending = (label: string, danger = false) => (
    <Tooltip key={label} title="Backend chưa có API"><Button danger={danger} disabled>{label}</Button></Tooltip>
  );

  return (
    <>
      <PageHeader
        back="/issues"
        title={si.code || `SI #${si.id}`}
        tags={<StatusTag status={si.status} />}
        extra={[
          isOwner && si.status === 'DRAFT' && <Button key="e" onClick={() => nav(`/issues/${id}/edit`)}>Sửa</Button>,
          isOwner && si.status === 'DRAFT' && pending('Gửi yêu cầu'),
          isOwner && si.status === 'DRAFT' && pending('Hủy', true),
          can('issue:confirm') && !isOwner && pending('Từ chối', true),
          can('issue:confirm') && !isOwner && pending('Xác nhận xuất'),
        ].filter(Boolean)}
      />
      <PendingApiBanner text="Xác nhận xuất (trừ tồn, ghi sổ kho) chưa có API. Người tạo phiếu không được tự xác nhận (BR-23)." />
      {shortage && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={INSUFFICIENT} description="Có dòng vượt tồn khả dụng hiện tại; phiếu này sẽ bị chặn khi xác nhận (BR-05)." />}
      <Card title="Thông tin" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 2 }} items={[
          { key: 'r', label: 'Người yêu cầu', children: si.requesterName || (isOwner ? user?.fullName : `#${si.requesterId}`) },
          { key: 'c', label: 'Ngày tạo', children: fmtDateTime(si.createdAt) },
          { key: 'l', label: 'Lý do', span: 'filled', children: si.reason },
          { key: 'n', label: 'Ghi chú', span: 'filled', children: si.note || '—' },
        ]} />
      </Card>
      <Card title="Dòng hàng">
        <Table<IssueItem>
          rowKey={(r) => `${r.id}-${r.productId}`}
          dataSource={si.items}
          pagination={false}
          columns={[
            { title: 'SKU', key: 'sku', render: (_, r) => <span className="sku">{products.data?.get(r.productId)?.sku ?? `#${r.productId}`}</span> },
            { title: 'Sản phẩm', key: 'name', render: (_, r) => products.data?.get(r.productId)?.name ?? '—' },
            { title: 'SL yêu cầu', dataIndex: 'quantity', align: 'right', render: fmtNum },
            { title: 'Tồn khả dụng', key: 'av', align: 'right', render: (_, r) => fmtNum(stock.data?.get(r.productId)?.quantity) },
            {
              title: 'Kiểm tra', key: 'ck',
              render: (_, r) => {
                const av = stock.data?.get(r.productId)?.quantity;
                if (av === undefined) return '—';
                return av >= r.quantity ? <Pill tone="ok">Đủ</Pill> : <Pill tone="bad">Thiếu {fmtNum(r.quantity - av)}</Pill>;
              },
            },
          ]}
        />
      </Card>
    </>
  );
}
