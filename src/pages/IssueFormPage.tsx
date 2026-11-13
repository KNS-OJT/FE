import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, App, Button, Card, Flex, Form, Input, InputNumber, Space, Spin, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { issuesApi } from '@/api/stockIssues';
import { useStockMap } from '@/api/lookups';
import { ProductSelect } from '@/components/ProductSelect';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { errMsg } from '@/lib/errors';
import { fmtNum } from '@/lib/format';

type FormValues = { reason: string; note?: string; items: { productId?: number; quantity?: number }[] };
export const INSUFFICIENT = 'Số lượng xuất vượt quá tồn kho khả dụng';

export default function IssueFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : undefined;
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const items = Form.useWatch('items', form) ?? [];
  const stock = useStockMap();
  const existing = useQuery({ queryKey: ['issues', editId], queryFn: () => issuesApi.get(editId!), enabled: !!editId });

  useEffect(() => {
    if (existing.data) form.setFieldsValue({ reason: existing.data.reason, note: existing.data.note, items: existing.data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) });
    else if (!editId) form.setFieldsValue({ reason: '', items: [{}] });
  }, [existing.data, editId, form]);

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const body = { reason: v.reason, note: v.note, items: v.items.map((i) => ({ productId: i.productId!, quantity: i.quantity! })) };
      return editId ? issuesApi.update(editId, body) : issuesApi.create(body);
    },
    onSuccess: (r) => {
      message.success('Đã lưu phiếu xuất (Nháp)');
      qc.invalidateQueries({ queryKey: ['issues'] });
      nav(`/issues/${r.id || editId}`, { replace: true });
    },
    onError: (e) => message.error(errMsg(e)),
  });

  if (editId && existing.isLoading) return <Spin />;
  if (existing.error) return <ErrorAlert error={existing.error} />;
  if (existing.data && existing.data.status !== 'DRAFT') return <Alert type="warning" showIcon message="Chỉ sửa được phiếu ở trạng thái Nháp." />;
  const chosen = items.map((i) => i?.productId).filter((x): x is number => !!x);

  return (
    <>
      <PageHeader back={editId ? `/issues/${editId}` : '/issues'} title={editId ? `Sửa ${existing.data?.code || `SI #${editId}`}` : 'Tạo yêu cầu xuất kho'} />
      <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
        <Card title="Thông tin" style={{ marginBottom: 16 }}>
          <Form.Item name="reason" label="Lý do xuất" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do' }, { max: 500 }]}>
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú" rules={[{ max: 500 }]}><Input /></Form.Item>
        </Card>
        <Card title="Sản phẩm cần xuất" style={{ marginBottom: 16 }}>
          <Form.List name="items" rules={[{ validator: async (_, v) => { if (!v?.length) throw new Error('Phiếu phải có ít nhất một dòng'); } }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((f, idx) => {
                  const pid = items[f.name]?.productId;
                  const avail = pid ? stock.data?.get(pid)?.quantity : undefined;
                  const qty = items[f.name]?.quantity;
                  const over = avail !== undefined && qty !== undefined && qty !== null && qty > avail;
                  return (
                    <div key={f.key}>
                    <Flex gap={12} align="flex-start" wrap>
                      <Form.Item name={[f.name, 'productId']} label={idx === 0 ? 'Sản phẩm' : undefined} style={{ flex: '2 1 320px' }} rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                        <ProductSelect exclude={chosen} />
                      </Form.Item>
                      <Form.Item
                        name={[f.name, 'quantity']}
                        label={idx === 0 ? 'Số lượng' : undefined}
                        style={{ flex: '0 1 160px' }}
                        rules={[{ required: true, message: 'Nhập số lượng' }, { type: 'number', min: 0.001, message: 'Số lượng phải lớn hơn 0' }]}
                        validateStatus={over ? 'warning' : undefined}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Typography.Text type="secondary" style={{ marginTop: idx === 0 ? 36 : 6, minWidth: 120 }}>
                        Tồn khả dụng: {avail === undefined ? '—' : fmtNum(avail)}
                      </Typography.Text>
                      <Button aria-label="Xóa dòng" icon={<DeleteOutlined />} danger type="text" style={{ marginTop: idx === 0 ? 30 : 0 }} onClick={() => remove(f.name)} />
                    </Flex>
                    {over && <Alert type="warning" showIcon style={{ margin: '-8px 0 16px' }} message={`${INSUFFICIENT} (tồn khả dụng ${fmtNum(avail)}). Phiếu sẽ bị chặn khi xác nhận (BR-05).`} />}
                    </div>
                  );
                })}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>Thêm dòng</Button>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </Card>
        <Flex justify="flex-end">
          <Space>
            <Button onClick={() => nav('/issues')}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu nháp</Button>
          </Space>
        </Flex>
      </Form>
    </>
  );
}
