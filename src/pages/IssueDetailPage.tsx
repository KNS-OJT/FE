import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, App, Button, Card, Descriptions, Popconfirm, Spin, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { issuesApi, type IssueItem } from '@/api/stockIssues';
import { useProductMap, useStockMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { ReasonModal } from '@/components/ReasonModal';
import { ErrorAlert } from '@/components/States';
import { Pill, StatusTag } from '@/components/StatusTag';
import { useAuth } from '@/auth/useAuth';
import { errMsg } from '@/lib/errors';
import { fmtDateTime, fmtNum } from '@/lib/format';
import { INSUFFICIENT } from './IssueFormPage';

export default function IssueDetailPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { user, can } = useAuth();
  const q = useQuery({ queryKey: ['issues', id], queryFn: () => issuesApi.get(id) });
  const products = useProductMap();
  const stock = useStockMap();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['issues'] });
    qc.invalidateQueries({ queryKey: ['stock'] });
    qc.invalidateQueries({ queryKey: ['lookup', 'stock'] });
  };

  const confirmMut = useMutation({
    mutationFn: () => issuesApi.confirm(id),
    onSuccess: () => { message.success('Đã xác nhận xuất kho'); refresh(); },
    onError: (e) => message.error(errMsg(e)),
  });

  if (q.isLoading) return <Spin />;
  if (q.error || !q.data) return <ErrorAlert error={q.error} onRetry={() => q.refetch()} />;
  const si = q.data;
  const isOwner = si.requesterId === user?.userId;
  const shortage = si.items.some((i) => (stock.data?.get(i.productId)?.quantity ?? Infinity) < i.quantity);

  return (
    <>
      <PageHeader
        back="/issues"
        title={si.code || `SI #${si.id}`}
        tags={<StatusTag status={si.status} />}
        extra={[
          isOwner && si.status === 'DRAFT' && (
            <Button key="e" onClick={() => nav(`/issues/${id}/edit`)}>Sửa</Button>
          ),
          isOwner && si.status === 'DRAFT' && (
            <Button key="cancel" danger onClick={() => setCancelOpen(true)}>Hủy</Button>
          ),
          can('issue:confirm') && !isOwner && si.status === 'DRAFT' && (
            <Button key="reject" danger onClick={() => setRejectOpen(true)}>Từ chối</Button>
          ),
          can('issue:confirm') && !isOwner && si.status === 'DRAFT' && (
            <Popconfirm
              key="confirm"
              title="Xác nhận xuất kho?"
              description="Tồn kho sẽ bị trừ khi xác nhận."
              okText="Xác nhận"
              cancelText="Không"
              onConfirm={() => confirmMut.mutateAsync()}
            >
              <Button type="primary" loading={confirmMut.isPending}>Xác nhận xuất</Button>
            </Popconfirm>
          ),
        ].filter(Boolean)}
      />
      {shortage && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={INSUFFICIENT}
          description="Có dòng vượt tồn khả dụng hiện tại; phiếu này sẽ bị chặn khi xác nhận (BR-05)."
        />
      )}
      <Card title="Thông tin" style={{ marginBottom: 16 }}>
        <Descriptions
          column={{ xs: 1, md: 2 }}
          items={[
            { key: 'r', label: 'Người yêu cầu', children: si.requesterName || (isOwner ? user?.fullName : `#${si.requesterId}`) },
            { key: 'c', label: 'Ngày tạo', children: fmtDateTime(si.createdAt) },
            { key: 'l', label: 'Lý do', span: 'filled', children: si.reason },
            { key: 'n', label: 'Ghi chú', span: 'filled', children: si.note || '—' },
          ]}
        />
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
              title: 'Kiểm tra',
              key: 'ck',
              render: (_, r) => {
                const av = stock.data?.get(r.productId)?.quantity;
                if (av === undefined) return '—';
                return av >= r.quantity ? <Pill tone="ok">Đủ</Pill> : <Pill tone="bad">Thiếu {fmtNum(r.quantity - av)}</Pill>;
              },
            },
          ]}
        />
      </Card>
      <ReasonModal
        open={cancelOpen}
        title={`Hủy ${si.code || `SI #${si.id}`}`}
        okText="Xác nhận hủy"
        onCancel={() => setCancelOpen(false)}
        onSubmit={async (reason) => {
          try {
            await issuesApi.cancel(id, reason);
            message.success('Đã hủy phiếu xuất');
            setCancelOpen(false);
            refresh();
          } catch (e) {
            message.error(errMsg(e));
          }
        }}
      />
      <ReasonModal
        open={rejectOpen}
        title={`Từ chối ${si.code || `SI #${si.id}`}`}
        okText="Xác nhận từ chối"
        onCancel={() => setRejectOpen(false)}
        onSubmit={async (reason) => {
          try {
            await issuesApi.reject(id, reason);
            message.success('Đã từ chối phiếu xuất');
            setRejectOpen(false);
            refresh();
          } catch (e) {
            message.error(errMsg(e));
          }
        }}
      />
    </>
  );
}
