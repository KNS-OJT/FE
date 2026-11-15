/**
 * Phiếu nhập kho (IN09, IN10, IN17) — gọi API thật /api/goods-receipts.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { App, Button, Card, Descriptions, Flex, Form, Input, InputNumber, Popconfirm, Select, Space, Spin, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptsApi, type GoodsReceipt, type GrItem } from '@/api/goodsReceipts';
import { poApi, type PoItem } from '@/api/po';
import { useProductMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ReasonModal } from '@/components/ReasonModal';
import { ErrorAlert } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { usePaging } from '@/components/usePaging';
import { useAuth } from '@/auth/useAuth';
import { errMsg } from '@/lib/errors';
import { fmtDateTime, fmtNum } from '@/lib/format';

/* ───────────────────────── LIST ───────────────────────── */

export function ReceiptListPage() {
  const nav = useNavigate();
  const { can } = useAuth();
  const { page, size, pagination } = usePaging();
  const list = useQuery({
    queryKey: ['receipts', { page, size }],
    queryFn: () => goodsReceiptsApi.list({ page, size }),
  });
  return (
    <>
      <PageHeader
        title="Phiếu nhập kho"
        extra={can('gr:manage') && <Button type="primary" onClick={() => nav('/receipts/new')}>+ Lập phiếu nhận hàng</Button>}
      />
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<GoodsReceipt>
        className="table-shell"
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        onRow={(r) => ({ onClick: () => nav(`/receipts/${r.id}`), style: { cursor: 'pointer' } })}
        locale={{
          emptyText: (
            <EmptyState
              title="Chưa có phiếu nhập"
              hint="Phiếu nhập được lập khi nhận hàng theo đơn đặt hàng."
              actionLabel={can('gr:manage') ? 'Lập phiếu nhận hàng' : undefined}
              onAction={() => nav('/receipts/new')}
            />
          ),
        }}
        columns={[
          { title: 'Mã phiếu', dataIndex: 'code' },
          { title: 'Số chứng từ', dataIndex: 'documentReference' },
          { title: 'Trạng thái', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
          { title: 'Ngày lập', dataIndex: 'receivedAt', render: fmtDateTime },
          { title: 'Ngày xác nhận', dataIndex: 'confirmedAt', render: fmtDateTime },
        ]}
      />
    </>
  );
}

/* ───────────────────────── FORM (CREATE) ───────────────────────── */

export function ReceiptFormPage() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [poId, setPoId] = useState<number | undefined>(sp.get('poId') ? Number(sp.get('poId')) : undefined);
  const [form] = Form.useForm<{ documentReference: string; note?: string; qty: Record<string, number> }>();
  const products = useProductMap();

  // Load danh sách PO đang chờ nhận
  const ordered = useQuery({
    queryKey: ['po', 'receivable'],
    queryFn: () => poApi.list({ page: 0, size: 100 }),
  });
  const po = useQuery({
    queryKey: ['po', poId],
    queryFn: () => poApi.get(poId!),
    enabled: !!poId,
  });

  const remaining = (i: PoItem) => Math.max(0, i.quantity - i.receivedQuantity);

  useEffect(() => {
    if (po.data) {
      form.setFieldsValue({
        qty: Object.fromEntries(po.data.items.map((i) => [String(i.id), 0])),
      });
    }
  }, [po.data, form]);

  const save = useMutation({
    mutationFn: async () => {
      const v = await form.validateFields().catch(() => null);
      if (!v) throw { status: 400, message: 'Vui lòng kiểm tra lại các ô bị báo lỗi.' };
      const p = po.data!;
      return goodsReceiptsApi.create({
        purchaseOrderId: p.id,
        documentReference: v.documentReference.trim(),
        note: v.note?.trim() ?? '',
        items: p.items.map((i) => ({
          purchaseOrderItemId: i.id,
          receivedQuantity: v.qty?.[String(i.id)] ?? 0,
        })),
      });
    },
    onSuccess: (gr) => {
      message.success('Đã lập phiếu nhập (Nháp)');
      qc.invalidateQueries({ queryKey: ['receipts'] });
      nav(`/receipts/${gr.id}`, { replace: true });
    },
    onError: (e) => message.error(errMsg(e)),
  });

  return (
    <>
      <PageHeader back="/receipts" title="Lập phiếu nhận hàng theo PO" />
      <Form form={form} layout="vertical">
        <Card title="Thông tin" style={{ marginBottom: 16 }}>
          <Flex gap={16} wrap>
            <Form.Item label="PO tham chiếu" required style={{ flex: '1 1 280px' }} extra="Chỉ PO đã đặt hàng hoặc đang nhận một phần">
              <Select
                value={poId}
                onChange={setPoId}
                loading={ordered.isLoading}
                placeholder="Chọn PO"
                options={(ordered.data?.items ?? [])
                  .filter((p) => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED')
                  .map((p) => ({ value: p.id, label: p.code || `PO #${p.id}` }))}
              />
            </Form.Item>
            <Form.Item
              name="documentReference"
              label="Số chứng từ giao hàng"
              style={{ flex: '1 1 220px' }}
              rules={[{ required: true, whitespace: true, message: 'Bắt buộc' }, { max: 100 }]}
            >
              <Input />
            </Form.Item>
          </Flex>
          <Form.Item name="note" label="Ghi chú" rules={[{ max: 4000 }]}>
            <Input />
          </Form.Item>
        </Card>
        <Card title="Hàng thực nhận" style={{ marginBottom: 16 }}>
          {!poId ? (
            <div style={{ color: '#999' }}>Chọn PO để hiển thị dòng hàng.</div>
          ) : po.isLoading ? (
            <Spin />
          ) : po.error ? (
            <ErrorAlert error={po.error} />
          ) : (
            <Table<PoItem>
              rowKey="id"
              dataSource={po.data?.items ?? []}
              pagination={false}
              columns={[
                {
                  title: 'SKU',
                  key: 'sku',
                  render: (_, r) => (
                    <span className="sku">{products.data?.get(r.productId)?.sku ?? `#${r.productId}`}</span>
                  ),
                },
                { title: 'Sản phẩm', key: 'n', render: (_, r) => products.data?.get(r.productId)?.name ?? '—' },
                { title: 'SL đặt', dataIndex: 'quantity', align: 'right', render: fmtNum },
                { title: 'Đã nhận', dataIndex: 'receivedQuantity', align: 'right', render: fmtNum },
                { title: 'Còn lại', key: 'r', align: 'right', render: (_, r) => <strong>{fmtNum(remaining(r))}</strong> },
                {
                  title: 'SL thực nhận',
                  key: 'q',
                  width: 180,
                  render: (_, r) => (
                    <Form.Item
                      noStyle
                      name={['qty', String(r.id)]}
                      rules={[
                        {
                          type: 'number',
                          min: 0,
                          max: remaining(r),
                          message: `Không được nhận vượt số còn lại (${fmtNum(remaining(r))})`,
                        },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} aria-label="Số lượng thực nhận" />
                    </Form.Item>
                  ),
                },
              ]}
            />
          )}
        </Card>
        <Flex justify="flex-end">
          <Space>
            <Button onClick={() => nav('/receipts')}>Hủy bỏ</Button>
            <Button type="primary" disabled={!po.data} loading={save.isPending} onClick={() => save.mutate()}>
              Lưu nháp
            </Button>
          </Space>
        </Flex>
      </Form>
    </>
  );
}

/* ───────────────────────── DETAIL ───────────────────────── */

export function ReceiptDetailPage() {
  const id = Number(useParams().id);
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { can } = useAuth();
  const products = useProductMap();
  const [cancelOpen, setCancelOpen] = useState(false);

  const q = useQuery({ queryKey: ['receipts', id], queryFn: () => goodsReceiptsApi.get(id) });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['receipts'] });
    qc.invalidateQueries({ queryKey: ['po'] });
    qc.invalidateQueries({ queryKey: ['stock'] });
    qc.invalidateQueries({ queryKey: ['lookup', 'stock'] });
  };

  const confirm = useMutation({
    mutationFn: () => goodsReceiptsApi.confirm(id, q.data?.documentReference ?? ''),
    onSuccess: () => {
      message.success('Đã xác nhận nhập kho');
      refresh();
    },
    onError: (e) => message.error(errMsg(e)),
  });

  if (q.isLoading) return <Spin />;
  if (q.error || !q.data) return <ErrorAlert error={q.error} />;
  const gr = q.data;
  const draft = gr.status === 'DRAFT' && can('gr:manage');

  return (
    <>
      <PageHeader
        back="/receipts"
        title={gr.code || `GR #${gr.id}`}
        tags={<StatusTag status={gr.status} />}
        extra={
          draft && [
            <Button key="c" danger onClick={() => setCancelOpen(true)}>
              Hủy phiếu
            </Button>,
            <Popconfirm
              key="ok"
              title="Xác nhận nhập kho?"
              description="Phiếu đã xác nhận không thể sửa. Tồn kho sẽ được cập nhật."
              okText="Xác nhận"
              cancelText="Không"
              onConfirm={() => confirm.mutateAsync()}
            >
              <Button type="primary" loading={confirm.isPending}>
                Xác nhận nhập kho
              </Button>
            </Popconfirm>,
          ]
        }
      />
      <Card title="Thông tin" style={{ marginBottom: 16 }}>
        <Descriptions
          column={{ xs: 1, md: 2 }}
          items={[
            { key: 'doc', label: 'Số chứng từ', children: gr.documentReference || '—' },
            { key: 'at', label: 'Ngày lập', children: fmtDateTime(gr.receivedAt) },
            { key: 'cf', label: 'Ngày xác nhận', children: fmtDateTime(gr.confirmedAt) },
            { key: 'note', label: 'Ghi chú', children: gr.note || '—' },
            { key: 'cr', label: 'Lý do hủy', children: gr.cancelReason || '—' },
          ]}
        />
      </Card>
      <Card title="Dòng hàng">
        <Table<GrItem>
          rowKey="id"
          dataSource={gr.items}
          pagination={false}
          columns={[
            {
              title: 'SKU',
              key: 'sku',
              render: (_, r) => (
                <span className="sku">
                  {r.productId ? (products.data?.get(r.productId)?.sku ?? `#${r.productId}`) : r.purchaseOrderItemId ? `#PO-${r.purchaseOrderItemId}` : `#${r.id}`}
                </span>
              ),
            },
            {
              title: 'Sản phẩm',
              key: 'name',
              render: (_, r) => (r.productId ? (products.data?.get(r.productId)?.name ?? '—') : '—'),
            },
            {
              title: 'SL thực nhận',
              dataIndex: 'receivedQuantity',
              align: 'right',
              render: fmtNum,
            },
          ]}
        />
      </Card>
      <ReasonModal
        open={cancelOpen}
        title={`Hủy ${gr.code || `GR #${gr.id}`}`}
        okText="Xác nhận hủy"
        onCancel={() => setCancelOpen(false)}
        onSubmit={async (reason) => {
          try {
            await goodsReceiptsApi.cancel(id, reason);
            message.success('Đã hủy phiếu');
            setCancelOpen(false);
            refresh();
          } catch (e) {
            message.error(errMsg(e));
          }
        }}
      />
    </>
  );
}
