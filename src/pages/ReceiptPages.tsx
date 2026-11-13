/**
 * Phiếu nhập kho (IN09, IN10, IN17) — BE CHƯA có API → chạy trên bản MÔ PHỎNG (src/api/goodsReceiptsMock.ts)
 * khi VITE_DEMO_MOCK_MISSING=true. Không làm thay đổi tồn kho thật.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Alert, App, Button, Card, Descriptions, Flex, Form, Input, InputNumber, Popconfirm, Select, Space, Spin, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { grMock, receivedByPoItem, type GoodsReceipt, type GrItem } from '@/api/goodsReceiptsMock';
import { poApi, type PoItem } from '@/api/po';
import { useProductMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { ReasonModal } from '@/components/ReasonModal';
import { ErrorAlert, PendingApiBanner } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { useAuth } from '@/auth/useAuth';
import { env } from '@/config/env';
import { errMsg } from '@/lib/errors';
import { fmtDateTime, fmtNum } from '@/lib/format';

const SIM = 'Đây là bản MÔ PHỎNG vì Backend chưa có API phiếu nhập. Dữ liệu chỉ lưu trong tab trình duyệt này và KHÔNG làm thay đổi tồn kho thật.';

function MockGate({ children }: { children: React.ReactNode }) {
  if (!env.demoMockMissing) return <PendingApiBanner text="Backend chưa có API lập và xác nhận phiếu nhập kho. Màn hình sẽ hoạt động khi có API." />;
  return (
    <>
      <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Chức năng chờ Backend" description={SIM} />
      {children}
    </>
  );
}

export function ReceiptListPage() {
  const nav = useNavigate();
  const { can } = useAuth();
  const list = useQuery({ queryKey: ['receipts'], queryFn: grMock.list, enabled: env.demoMockMissing });
  return (
    <>
      <PageHeader title="Phiếu nhập kho" extra={can('gr:manage') && env.demoMockMissing && <Button type="primary" onClick={() => nav('/receipts/new')}>+ Lập phiếu nhận hàng</Button>} />
      <MockGate>
        <Table<GoodsReceipt>
          className="table-shell"
          rowKey="id"
          loading={list.isLoading}
          dataSource={list.data ?? []}
          onRow={(r) => ({ onClick: () => nav(`/receipts/${r.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'Chưa có phiếu nhập' }}
          columns={[
            { title: 'Mã phiếu', dataIndex: 'code' },
            { title: 'PO', dataIndex: 'poCode' },
            { title: 'Số chứng từ', dataIndex: 'documentReference' },
            { title: 'Trạng thái', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
            { title: 'Ngày lập', dataIndex: 'createdAt', render: fmtDateTime },
          ]}
        />
      </MockGate>
    </>
  );
}

export function ReceiptFormPage() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { user } = useAuth();
  const [poId, setPoId] = useState<number | undefined>(sp.get('poId') ? Number(sp.get('poId')) : undefined);
  const [form] = Form.useForm<{ documentReference: string; note?: string; qty: Record<string, number> }>();
  const products = useProductMap();
  const ordered = useQuery({ queryKey: ['po', 'receivable'], queryFn: () => poApi.list({ page: 0, size: 100 }), enabled: env.demoMockMissing });
  const po = useQuery({ queryKey: ['po', poId], queryFn: () => poApi.get(poId!), enabled: !!poId && env.demoMockMissing });
  const done = po.data ? receivedByPoItem(po.data.id) : new Map<number, number>();
  const remaining = (i: PoItem) => Math.max(0, i.quantity - i.receivedQuantity - (done.get(i.id) ?? 0));

  useEffect(() => {
    if (po.data) form.setFieldsValue({ qty: Object.fromEntries(po.data.items.map((i) => [String(i.id), 0])) });
  }, [po.data, form]);

  const save = useMutation({
    mutationFn: async () => {
      const v = await form.validateFields().catch(() => null);
      if (!v) throw { status: 400, message: 'Vui lòng kiểm tra lại các ô bị báo lỗi.' };
      const p = po.data!;
      return grMock.create({
        poId: p.id,
        poCode: p.code || `PO #${p.id}`,
        documentReference: v.documentReference.trim(),
        note: v.note?.trim() ?? '',
        createdBy: user?.fullName ?? '',
        items: p.items.map<GrItem>((i) => ({ poItemId: i.id, productId: i.productId, orderedQuantity: i.quantity - i.receivedQuantity, receivedQuantity: v.qty?.[String(i.id)] ?? 0 })),
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
      <MockGate>
        <Form form={form} layout="vertical">
          <Card title="Thông tin" style={{ marginBottom: 16 }}>
            <Flex gap={16} wrap>
              <Form.Item label="PO tham chiếu" required style={{ flex: '1 1 280px' }} extra="Chỉ PO đã đặt hàng hoặc đang nhận một phần">
                <Select
                  value={poId} onChange={setPoId} loading={ordered.isLoading} placeholder="Chọn PO"
                  options={(ordered.data?.items ?? []).filter((p) => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED').map((p) => ({ value: p.id, label: p.code || `PO #${p.id}` }))}
                />
              </Form.Item>
              <Form.Item name="documentReference" label="Số chứng từ giao hàng" style={{ flex: '1 1 220px' }} rules={[{ required: true, whitespace: true, message: 'Bắt buộc' }, { max: 100 }]}>
                <Input />
              </Form.Item>
            </Flex>
            <Form.Item name="note" label="Ghi chú" rules={[{ max: 500 }]}><Input /></Form.Item>
          </Card>
          <Card title="Hàng thực nhận" style={{ marginBottom: 16 }}>
            {!poId ? <Alert type="info" message="Chọn PO để hiển thị dòng hàng." /> : po.isLoading ? <Spin /> : po.error ? <ErrorAlert error={po.error} /> : (
              <Table<PoItem>
                rowKey="id"
                dataSource={po.data?.items ?? []}
                pagination={false}
                columns={[
                  { title: 'SKU', key: 'sku', render: (_, r) => <span className="sku">{products.data?.get(r.productId)?.sku ?? `#${r.productId}`}</span> },
                  { title: 'Sản phẩm', key: 'n', render: (_, r) => products.data?.get(r.productId)?.name ?? '—' },
                  { title: 'SL đặt', dataIndex: 'quantity', align: 'right', render: fmtNum },
                  { title: 'Đã nhận', key: 'd', align: 'right', render: (_, r) => fmtNum(r.receivedQuantity + (done.get(r.id) ?? 0)) },
                  { title: 'Còn lại', key: 'r', align: 'right', render: (_, r) => <strong>{fmtNum(remaining(r))}</strong> },
                  {
                    title: 'SL thực nhận', key: 'q', width: 180,
                    render: (_, r) => (
                      <Form.Item noStyle name={['qty', String(r.id)]} rules={[{ type: 'number', min: 0, max: remaining(r), message: `Không được nhận vượt số còn lại (${fmtNum(remaining(r))})` }]}>
                        <InputNumber min={0} style={{ width: '100%' }} aria-label="Số lượng thực nhận" />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            )}
          </Card>
          <Flex justify="flex-end"><Space>
            <Button onClick={() => nav('/receipts')}>Hủy bỏ</Button>
            <Button type="primary" disabled={!po.data} loading={save.isPending} onClick={() => save.mutate()}>Lưu nháp</Button>
          </Space></Flex>
        </Form>
      </MockGate>
    </>
  );
}

export function ReceiptDetailPage() {
  const id = Number(useParams().id);
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { can } = useAuth();
  const products = useProductMap();
  const [cancelOpen, setCancelOpen] = useState(false);
  const q = useQuery({ queryKey: ['receipts', id], queryFn: () => grMock.get(id), enabled: env.demoMockMissing });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['receipts'] });
    qc.invalidateQueries({ queryKey: ['po'] });
  };
  const confirm = useMutation({ mutationFn: () => grMock.confirm(id), onSuccess: () => { message.success('Đã xác nhận nhập kho (mô phỏng)'); refresh(); }, onError: (e) => message.error(errMsg(e)) });

  if (!env.demoMockMissing) return <MockGate>{null}</MockGate>;
  if (q.isLoading) return <Spin />;
  if (q.error || !q.data) return <ErrorAlert error={q.error} />;
  const gr = q.data;
  const draft = gr.status === 'DRAFT' && can('gr:manage');
  return (
    <>
      <PageHeader back="/receipts" title={gr.code} tags={<StatusTag status={gr.status} />} extra={draft && [
        <Button key="c" danger onClick={() => setCancelOpen(true)}>Hủy phiếu</Button>,
        <Popconfirm key="ok" title="Xác nhận nhập kho?" description="Phiếu đã xác nhận không thể sửa." okText="Xác nhận" cancelText="Không" onConfirm={() => confirm.mutateAsync()}>
          <Button type="primary" loading={confirm.isPending}>Xác nhận nhập kho</Button>
        </Popconfirm>,
      ]} />
      <MockGate>
        <Card title="Thông tin" style={{ marginBottom: 16 }}>
          <Descriptions column={{ xs: 1, md: 2 }} items={[
            { key: 'po', label: 'PO', children: gr.poCode },
            { key: 'doc', label: 'Số chứng từ', children: gr.documentReference },
            { key: 'by', label: 'Người lập', children: gr.createdBy || '—' },
            { key: 'at', label: 'Ngày lập', children: fmtDateTime(gr.createdAt) },
            { key: 'cf', label: 'Ngày xác nhận', children: fmtDateTime(gr.confirmedAt) },
            { key: 'cr', label: 'Lý do hủy', children: gr.cancelReason || '—' },
          ]} />
        </Card>
        <Card title="Dòng hàng">
          <Table<GrItem> rowKey="poItemId" dataSource={gr.items} pagination={false} columns={[
            { title: 'SKU', key: 's', render: (_, r) => <span className="sku">{products.data?.get(r.productId)?.sku ?? `#${r.productId}`}</span> },
            { title: 'Sản phẩm', key: 'n', render: (_, r) => products.data?.get(r.productId)?.name ?? '—' },
            { title: 'SL thực nhận', dataIndex: 'receivedQuantity', align: 'right', render: fmtNum },
          ]} />
        </Card>
      </MockGate>
      <ReasonModal open={cancelOpen} title={`Hủy ${gr.code}`} okText="Xác nhận hủy" onCancel={() => setCancelOpen(false)}
        onSubmit={async (reason) => { try { await grMock.cancel(id, reason); message.success('Đã hủy phiếu'); setCancelOpen(false); refresh(); } catch (e) { message.error(errMsg(e)); } }} />
    </>
  );
}
