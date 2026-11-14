import { useEffect, useMemo, useState } from 'react';
import { validated } from '@/lib/validate';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Alert, App, Button, Card, DatePicker, Flex, Form, InputNumber, Select, Space, Spin, Table } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { poApi, type PoInput } from '@/api/po';
import { prApi, type PrItem } from '@/api/pr';
import { suppliersApi } from '@/api/suppliers';
import { useProductMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { errMsg } from '@/lib/errors';
import { fmtNum } from '@/lib/format';

type FormValues = { purchaseRequestId?: number; supplierId?: number; expectedDeliveryDate?: Dayjs | null; qty: Record<string, number> };

export default function PoFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : undefined;
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [pickedPrId, setPickedPrId] = useState<number | undefined>(sp.get('prId') ? Number(sp.get('prId')) : undefined);
  const products = useProductMap();

  const existing = useQuery({ queryKey: ['po', editId], queryFn: () => poApi.get(editId!), enabled: !!editId });
  const approved = useQuery({ queryKey: ['pr', 'approved-options'], queryFn: () => prApi.list({ status: 'APPROVED', page: 0, size: 100 }), enabled: !editId });
  const usedPr = useQuery({ queryKey: ['po', 'used-pr'], queryFn: () => poApi.list({ page: 0, size: 100 }), enabled: !editId });
  const suppliers = useQuery({ queryKey: ['suppliers', 'active-options'], queryFn: () => suppliersApi.list({ isActive: true, page: 0, size: 100 }) });
  // Khi sửa PO, PR được suy ra từ PO đã tải; khi tạo mới, PR là lựa chọn của người dùng.
  const prId = editId ? existing.data?.purchaseRequestId : pickedPrId;
  const pr = useQuery({ queryKey: ['pr', prId], queryFn: () => prApi.get(prId!), enabled: !!prId });

  // BR-19: mỗi PR tối đa 1 PO → ẩn PR đã có PO.
  const prOptions = useMemo(() => {
    const used = new Set((usedPr.data?.items ?? []).map((p) => p.purchaseRequestId));
    return (approved.data?.items ?? []).filter((p) => !used.has(p.id)).map((p) => ({ value: p.id, label: `${p.code || `PR #${p.id}`} · ${p.requesterName || ''} · ${p.reason}` }));
  }, [approved.data, usedPr.data]);

  useEffect(() => {
    if (existing.data) {
      form.setFieldsValue({
        purchaseRequestId: existing.data.purchaseRequestId,
        supplierId: existing.data.supplierId,
        expectedDeliveryDate: existing.data.expectedDeliveryDate ? dayjs(existing.data.expectedDeliveryDate) : null,
        qty: Object.fromEntries(existing.data.items.map((i) => [String(i.purchaseRequestItemId), i.quantity])),
      });
    }
  }, [existing.data, form]);
  useEffect(() => {
    if (pr.data && !editId) form.setFieldsValue({ purchaseRequestId: pr.data.id, qty: Object.fromEntries(pr.data.items.map((i) => [String(i.id), i.quantity])) });
  }, [pr.data, editId, form]);

  const save = useMutation({
    mutationFn: async ({ v, order }: { v: PoInput; order: boolean }) => {
      const po = editId ? await poApi.update(editId, v) : await poApi.create(v);
      const poId = po.id || editId!;
      if (order) await poApi.order(poId);
      return { poId, order };
    },
    onSuccess: ({ poId, order }) => {
      message.success(order ? 'Đã phát hành đơn đặt hàng' : 'Đã lưu nháp PO');
      qc.invalidateQueries({ queryKey: ['po'] });
      qc.invalidateQueries({ queryKey: ['pr'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      nav(poId ? `/po/${poId}` : '/po', { replace: true });
    },
    onError: (e) => message.error(errMsg(e)),
  });

  const onSave = async (order: boolean) => {
    if (!pr.data || pr.isFetching || save.isPending) return;
    const v = await validated(form);
    if (!v) return;
    if (pr.data.status !== 'APPROVED') return message.error('Chỉ lập PO từ đề nghị mua đã duyệt.');
    if (pr.data.items.some((i) => !Number.isInteger(i.id) || i.id <= 0)) return message.error('Dữ liệu dòng đề nghị mua không hợp lệ. Vui lòng tải lại trang.');
    const lines = pr.data.items.map((i) => ({ prItemId: i.id, quantity: v.qty?.[String(i.id)] ?? 0 }));
    if (!lines.some((l) => l.quantity > 0)) return message.error('PO phải có ít nhất một dòng với số lượng lớn hơn 0.');
    save.mutate({
      order,
      v: {
        purchaseRequestId: v.purchaseRequestId!,
        supplierId: v.supplierId!,
        expectedDeliveryDate: v.expectedDeliveryDate ? v.expectedDeliveryDate.format('YYYY-MM-DD') : null,
        items: lines.filter((l) => l.quantity > 0),
      },
    });
  };

  if (editId && existing.isLoading) return <Spin />;
  if (existing.error) return <ErrorAlert error={existing.error} />;
  if (existing.data && existing.data.status !== 'DRAFT') return <Alert type="warning" showIcon message="Chỉ sửa được PO ở trạng thái Nháp." />;

  return (
    <>
      <PageHeader back={editId ? `/po/${editId}` : '/po'} title={editId ? `Sửa ${existing.data?.code || `PO #${editId}`}` : 'Tạo đơn đặt hàng'} />
      <Form form={form} layout="vertical">
        <Card title="1. Chọn PR đã duyệt" style={{ marginBottom: 16 }}>
          <Form.Item name="purchaseRequestId" label="Đề nghị mua" extra="Chỉ hiển thị PR đã duyệt và chưa lập PO (BR-02, BR-19)" rules={[{ required: true, message: 'Chọn PR' }]}>
            <Select
              showSearch optionFilterProp="label" disabled={!!editId} loading={approved.isLoading}
              placeholder="Chọn PR đã duyệt" onChange={(v: number) => setPickedPrId(v)}
              options={editId && existing.data ? [{ value: existing.data.purchaseRequestId, label: existing.data.prCode || `PR #${existing.data.purchaseRequestId}` }] : prOptions}
              notFoundContent="Không có PR đã duyệt nào chưa lập PO"
            />
          </Form.Item>
        </Card>
        <Card title="2. Nhà cung cấp & giao hàng" style={{ marginBottom: 16 }}>
          <Flex gap={16} wrap>
            <Form.Item name="supplierId" label="Nhà cung cấp" style={{ flex: '1 1 280px' }} extra="Chỉ nhà cung cấp đang hợp tác" rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}>
              <Select showSearch optionFilterProp="label" loading={suppliers.isLoading} options={(suppliers.data?.items ?? []).filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
            <Form.Item name="expectedDeliveryDate" label="Ngày giao dự kiến" style={{ flex: '0 1 220px' }}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs().startOf('day'))} />
            </Form.Item>
          </Flex>
        </Card>
        <Card title="3. Dòng hàng" style={{ marginBottom: 16 }}>
          {!prId ? <Alert type="info" message="Chọn PR để lấy dòng hàng." /> : pr.isLoading ? <Spin /> : pr.error ? <ErrorAlert error={pr.error} onRetry={() => pr.refetch()} /> : (
            <Table<PrItem>
              rowKey={(r) => String(r.id)}
              dataSource={pr.data?.items ?? []}
              pagination={false}
              columns={[
                { title: 'SKU', key: 'sku', render: (_, r) => <span className="sku">{r.sku || products.data?.get(r.productId)?.sku}</span> },
                { title: 'Sản phẩm', key: 'name', render: (_, r) => r.productName || products.data?.get(r.productId)?.name },
                { title: 'Đơn vị', key: 'unit', render: (_, r) => r.unit || products.data?.get(r.productId)?.unit },
                { title: 'SL đã duyệt', dataIndex: 'quantity', align: 'right', render: fmtNum },
                {
                  title: 'SL đặt', key: 'qty', width: 180,
                  render: (_, r) => (
                    <Form.Item noStyle name={['qty', String(r.id)]}
                      rules={[{ type: 'number', min: 0, max: r.quantity, message: `Không vượt số đã duyệt (${fmtNum(r.quantity)})` }]}>
                      <InputNumber min={0} max={r.quantity} style={{ width: '100%' }} aria-label="Số lượng đặt" />
                    </Form.Item>
                  ),
                },
              ]}
            />
          )}
        </Card>
        <Flex justify="flex-end">
          <Space wrap>
            <Button onClick={() => nav(editId ? `/po/${editId}` : '/po')}>Hủy bỏ</Button>
            <Button disabled={save.isPending || !pr.data || pr.isFetching || !!pr.error} loading={save.isPending && !save.variables?.order} onClick={() => onSave(false)}>Lưu nháp</Button>
            <Button type="primary" disabled={save.isPending || !pr.data || pr.isFetching || !!pr.error} loading={save.isPending && !!save.variables?.order} onClick={() => onSave(true)}>Lưu & đặt hàng</Button>
          </Space>
        </Flex>
      </Form>
    </>
  );
}
