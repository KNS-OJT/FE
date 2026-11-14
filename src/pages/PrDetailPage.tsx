import { useState } from 'react';
import { palette } from '@/theme';
import { useNavigate, useParams } from 'react-router';
import { Alert, App, Button, Card, Col, Descriptions, Popconfirm, Row, Spin, Table, Timeline } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prApi, type PrItem } from '@/api/pr';
import { useProductMap, useStockMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { ReasonModal } from '@/components/ReasonModal';
import { ErrorAlert } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { useAuth } from '@/auth/useAuth';
import { errMsg } from '@/lib/errors';
import { fmtDateTime, fmtNum } from '@/lib/format';

export default function PrDetailPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { user, can } = useAuth();
  const q = useQuery({ queryKey: ['pr', id], queryFn: () => prApi.get(id) });
  const products = useProductMap();
  const stock = useStockMap(can('stock:view'));
  const [modal, setModal] = useState<'reject' | 'cancel' | null>(null);

  const done = (msg: string) => {
    message.success(msg);
    setModal(null);
    qc.invalidateQueries({ queryKey: ['pr'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const act = useMutation({
    mutationFn: async (a: { kind: 'submit' | 'approve' | 'reject' | 'cancel'; reason?: string }) => {
      if (a.kind === 'submit') await prApi.submit(id);
      if (a.kind === 'approve') await prApi.approve(id);
      if (a.kind === 'reject') await prApi.reject(id, a.reason!);
      if (a.kind === 'cancel') await prApi.cancel(id, a.reason!);
      return a.kind;
    },
    onSuccess: (k) => done({ submit: 'Đã gửi duyệt', approve: 'Đã duyệt PR', reject: 'Đã từ chối PR', cancel: 'Đã hủy PR' }[k]),
    onError: (e) => message.error(errMsg(e)),
  });

  if (q.isLoading) return <Spin />;
  if (q.error || !q.data) return <ErrorAlert error={q.error} onRetry={() => q.refetch()} />;
  const pr = q.data;
  const isOwner = pr.requesterId === user?.userId;
  const isManager = can('pr:approve');
  const busy = act.isPending;

  const actions = [
    isOwner && pr.status === 'DRAFT' && <Button key="edit" onClick={() => nav(`/pr/${id}/edit`)}>Sửa</Button>,
    isOwner && pr.status === 'DRAFT' && (
      <Popconfirm key="submit" title="Gửi PR để Quản lý duyệt?" description="Sau khi gửi, PR sẽ bị khóa sửa." okText="Gửi" cancelText="Không" onConfirm={() => act.mutateAsync({ kind: 'submit' })}>
        <Button type="primary" loading={busy && act.variables?.kind === 'submit'} disabled={busy}>Gửi duyệt</Button>
      </Popconfirm>
    ),
    isOwner && (pr.status === 'DRAFT' || pr.status === 'SUBMITTED') && <Button key="cancel" danger disabled={busy} onClick={() => setModal('cancel')}>Hủy PR</Button>,
    isManager && !isOwner && pr.status === 'SUBMITTED' && <Button key="reject" danger disabled={busy} onClick={() => setModal('reject')}>Từ chối</Button>,
    isManager && !isOwner && pr.status === 'SUBMITTED' && (
      <Popconfirm key="approve" title="Duyệt đề nghị mua này?" okText="Duyệt" cancelText="Không" onConfirm={() => act.mutateAsync({ kind: 'approve' })}>
        <Button type="primary" loading={busy && act.variables?.kind === 'approve'} disabled={busy}>Duyệt</Button>
      </Popconfirm>
    ),
    can('po:manage') && pr.status === 'APPROVED' && <Button key="po" type="primary" onClick={() => nav(`/po/new?prId=${id}`)}>Tạo PO từ PR này</Button>,
  ].filter(Boolean);

  const history = [
    { label: 'Tạo PR', at: pr.createdAt, by: pr.requesterName },
    pr.submittedAt && { label: 'Gửi duyệt', at: pr.submittedAt, by: pr.requesterName },
    pr.reviewedAt && { label: pr.status === 'REJECTED' ? 'Từ chối' : 'Duyệt', at: pr.reviewedAt, by: pr.reviewedByName, note: pr.reviewReason },
    pr.status === 'CANCELED' && { label: 'Hủy', at: '', by: '', note: pr.cancelReason },
  ].filter(Boolean) as { label: string; at: string; by: string; note?: string }[];

  return (
    <>
      <PageHeader back="/pr" title={pr.code || `PR #${pr.id}`} tags={<StatusTag status={pr.status} />} extra={actions} />
      {isManager && isOwner && pr.status === 'SUBMITTED' && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Bạn là người tạo PR này nên không thể tự duyệt (BR-08). Cần một Quản lý khác duyệt." />
      )}
      {pr.status === 'REJECTED' && <Alert type="error" showIcon style={{ marginBottom: 16 }} message="PR bị từ chối" description={pr.reviewReason || '—'} />}
      {pr.status === 'CANCELED' && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="PR đã hủy" description={pr.cancelReason || '—'} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Thông tin chung" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, md: 2 }} items={[
              { key: 'r', label: 'Người yêu cầu', children: pr.requesterName || `#${pr.requesterId}` },
              { key: 'c', label: 'Ngày tạo', children: fmtDateTime(pr.createdAt) },
              { key: 's', label: 'Ngày gửi', children: fmtDateTime(pr.submittedAt) },
              { key: 'v', label: 'Người duyệt', children: pr.reviewedByName || (pr.reviewedById ? `#${pr.reviewedById}` : '—') },
              { key: 'reason', label: 'Lý do', span: 'filled', children: pr.reason },
            ]} />
          </Card>
          <Card title="Dòng hàng">
            <Table<PrItem>
              rowKey={(r) => `${r.id}-${r.productId}`}
              dataSource={pr.items}
              pagination={false}
              scroll={{ x: 640 }}
              columns={[
                { title: 'SKU', key: 'sku', render: (_, r) => <span className="sku">{r.sku || products.data?.get(r.productId)?.sku || `#${r.productId}`}</span> },
                { title: 'Sản phẩm', key: 'name', render: (_, r) => r.productName || products.data?.get(r.productId)?.name || '—' },
                { title: 'Đơn vị', key: 'unit', render: (_, r) => r.unit || products.data?.get(r.productId)?.unit || '—' },
                { title: 'Số lượng', dataIndex: 'quantity', align: 'right', render: fmtNum },
                ...(stock.data ? [{ title: 'Tồn hiện tại', key: 'stock', align: 'right' as const, render: (_: unknown, r: PrItem) => {
                  const s = stock.data?.get(r.productId);
                  return s ? <span style={{ color: s.low ? palette.danger : undefined }}>{fmtNum(s.quantity)}</span> : '—';
                } }] : []),
                { title: 'Ghi chú', dataIndex: 'note', render: (v) => v || '—' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Lịch sử xử lý">
            <Timeline items={history.map((h) => ({ children: (
              <>
                <strong>{h.label}</strong>
                <div style={{ color: palette.muted }}>{[h.by, h.at && fmtDateTime(h.at)].filter(Boolean).join(' · ')}</div>
                {h.note && <div style={{ color: palette.muted }}>Lý do: {h.note}</div>}
              </>
            ) }))} />
          </Card>
        </Col>
      </Row>
      <ReasonModal open={modal === 'reject'} title={`Từ chối ${pr.code}`} okText="Xác nhận từ chối" onCancel={() => setModal(null)} onSubmit={(reason) => act.mutateAsync({ kind: 'reject', reason })} />
      <ReasonModal open={modal === 'cancel'} title={`Hủy ${pr.code}`} okText="Xác nhận hủy" onCancel={() => setModal(null)} onSubmit={(reason) => act.mutateAsync({ kind: 'cancel', reason })} />
    </>
  );
}
