import { useNavigate, useParams } from 'react-router';
import { App, Button, Card, Descriptions, Popconfirm, Progress, Spin, Table, Tooltip } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { poApi, type PoItem } from '@/api/po';
import { prApi } from '@/api/pr';
import { useProductMap, useSupplierMap } from '@/api/lookups';
import { receivedByPoItem } from '@/api/goodsReceiptsMock';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { useAuth } from '@/auth/useAuth';
import { env } from '@/config/env';
import { errMsg } from '@/lib/errors';
import { fmtDate, fmtDateTime, fmtNum } from '@/lib/format';

export default function PoDetailPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['po', id], queryFn: () => poApi.get(id) });
  const pr = useQuery({ queryKey: ['pr', q.data?.purchaseRequestId], queryFn: () => prApi.get(q.data!.purchaseRequestId), enabled: !!q.data?.purchaseRequestId && can('pr:view') });
  const products = useProductMap();
  const suppliers = useSupplierMap(can('supplier:view'));
  const order = useMutation({
    mutationFn: () => poApi.order(id),
    onSuccess: () => {
      message.success('Đã phát hành đơn đặt hàng');
      qc.invalidateQueries({ queryKey: ['po'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => message.error(errMsg(e)),
  });

  if (q.isLoading) return <Spin />;
  if (q.error || !q.data) return <ErrorAlert error={q.error} onRetry={() => q.refetch()} />;
  const po = q.data;
  const mockReceived = env.demoMockMissing ? receivedByPoItem(po.id) : new Map<number, number>();
  const prItem = (i: PoItem) => pr.data?.items.find((x) => (i.purchaseRequestItemId ? x.id === i.purchaseRequestItemId : x.productId === i.productId));
  const name = (i: PoItem) => prItem(i)?.productName || products.data?.get(i.productId)?.name || `Sản phẩm #${i.productId}`;
  const sku = (i: PoItem) => prItem(i)?.sku || products.data?.get(i.productId)?.sku || `#${i.productId}`;
  const received = (i: PoItem) => i.receivedQuantity + (mockReceived.get(i.id) ?? 0);
  const canReceive = can('gr:manage') && (po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED');

  const actions = [
    can('po:manage') && po.status === 'DRAFT' && <Button key="edit" onClick={() => nav(`/po/${id}/edit`)}>Sửa</Button>,
    can('po:manage') && po.status === 'DRAFT' && (
      <Popconfirm key="order" title="Phát hành đơn đặt hàng?" description="PO chuyển sang Đã đặt hàng và không sửa được nữa." okText="Phát hành" cancelText="Không" onConfirm={() => order.mutateAsync()}>
        <Button type="primary" loading={order.isPending}>Phát hành đặt hàng</Button>
      </Popconfirm>
    ),
    can('po:manage') && (po.status === 'DRAFT' || po.status === 'ORDERED') && (
      <Tooltip key="cancel" title="Backend chưa có API hủy PO"><Button danger disabled>Hủy PO</Button></Tooltip>
    ),
    canReceive && (env.demoMockMissing
      ? <Button key="gr" type="primary" onClick={() => nav(`/receipts/new?poId=${id}`)}>+ Lập phiếu nhận hàng</Button>
      : <Tooltip key="gr" title="Backend chưa có API phiếu nhập"><Button disabled>+ Lập phiếu nhận hàng</Button></Tooltip>),
  ].filter(Boolean);

  return (
    <>
      <PageHeader back="/po" title={po.code || `PO #${po.id}`} tags={<StatusTag status={po.status} />} extra={actions} />
      <Card title="Thông tin" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 2 }} items={[
          { key: 'sup', label: 'Nhà cung cấp', children: po.supplierName || suppliers.data?.get(po.supplierId)?.name || `Nhà cung cấp #${po.supplierId}` },
          { key: 'pr', label: 'PR tham chiếu', children: can('pr:view') ? <a onClick={() => nav(`/pr/${po.purchaseRequestId}`)}>{po.prCode || pr.data?.code || `PR #${po.purchaseRequestId}`}</a> : po.prCode || `PR #${po.purchaseRequestId}` },
          { key: 'od', label: 'Ngày đặt', children: fmtDate(po.orderDate) },
          { key: 'ed', label: 'Ngày giao dự kiến', children: fmtDate(po.expectedDeliveryDate) },
          { key: 'ca', label: 'Ngày tạo', children: fmtDateTime(po.createdAt) },
          { key: 'n', label: 'Ghi chú', children: po.note || '—' },
        ]} />
      </Card>
      <Card title="Dòng hàng">
        <Table<PoItem>
          rowKey={(r) => `${r.id}-${r.productId}`}
          dataSource={po.items}
          pagination={false}
          scroll={{ x: 720 }}
          columns={[
            { title: 'SKU', key: 'sku', render: (_, r) => <span className="sku">{sku(r)}</span> },
            { title: 'Sản phẩm', key: 'name', render: (_, r) => name(r) },
            { title: 'SL đặt', dataIndex: 'quantity', align: 'right', render: fmtNum },
            { title: 'Đã nhận', key: 'rec', align: 'right', render: (_, r) => fmtNum(received(r)) },
            { title: 'Còn lại', key: 'rem', align: 'right', render: (_, r) => <strong>{fmtNum(Math.max(0, r.quantity - received(r)))}</strong> },
            { title: 'Tiến độ', key: 'p', width: 180, render: (_, r) => <Progress percent={r.quantity ? Math.round((received(r) / r.quantity) * 100) : 0} size="small" /> },
          ]}
        />
      </Card>
    </>
  );
}
