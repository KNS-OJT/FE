import { useEffect } from 'react';
import { validated } from '@/lib/validate';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Alert, App, Button, Card, Flex, Form, Input, InputNumber, Space, Spin } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prApi, type PrInput } from '@/api/pr';
import { ProductSelect } from '@/components/ProductSelect';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { useAuth } from '@/auth/useAuth';
import { toApiError } from '@/lib/errors';

type FormValues = { reason: string; items: { productId?: number; quantity?: number; note?: string }[] };

export default function PrFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : undefined;
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm<FormValues>();
  const items = Form.useWatch('items', form) ?? [];

  const existing = useQuery({ queryKey: ['pr', editId], queryFn: () => prApi.get(editId!), enabled: !!editId });
  const prefill = loc.state as Partial<FormValues> | null;

  useEffect(() => {
    if (existing.data) {
      form.setFieldsValue({ reason: existing.data.reason, items: existing.data.items.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note })) });
    } else if (!editId) {
      form.setFieldsValue({ reason: prefill?.reason ?? '', items: prefill?.items?.length ? prefill.items : [{}] });
    }
  }, [existing.data, editId, form, prefill]);

  const save = useMutation({
    mutationFn: async ({ v, submit }: { v: PrInput; submit: boolean }) => {
      const pr = editId ? await prApi.update(editId, v) : await prApi.create(v);
      const prId = pr.id || editId!;
      if (submit) await prApi.submit(prId);
      return { prId, submit };
    },
    onSuccess: ({ prId, submit }) => {
      message.success(submit ? 'Đã gửi duyệt PR' : 'Đã lưu nháp PR');
      qc.invalidateQueries({ queryKey: ['pr'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      nav(prId ? `/pr/${prId}` : '/pr', { replace: true });
    },
    onError: (e) => message.error(toApiError(e).message),
  });

  const onSave = async (submit: boolean) => {
    const v = await validated(form);
    if (!v) return;
    save.mutate({
      submit,
      v: { reason: v.reason, items: v.items.map((i) => ({ productId: i.productId!, quantity: i.quantity!, note: i.note })) },
    });
  };

  if (editId && existing.isLoading) return <Spin />;
  if (existing.error) return <ErrorAlert error={existing.error} />;
  const locked = existing.data && (existing.data.status !== 'DRAFT' || existing.data.requesterId !== user?.userId);
  const chosen = items.map((i) => i?.productId).filter((x): x is number => !!x);

  return (
    <>
      <PageHeader
        back={editId ? `/pr/${editId}` : '/pr'}
        title={editId ? existing.data?.code || `PR #${editId}` : 'Tạo đề nghị mua'}
        tags={<StatusTag status={existing.data?.status ?? 'DRAFT'} />}
      />
      {locked ? (
        <Alert type="warning" showIcon message="PR chỉ sửa được khi còn ở trạng thái Nháp và do chính bạn tạo (BR-11)." />
      ) : (
        <>
          <Alert type="info" showIcon style={{ marginBottom: 16 }} message='PR chỉ sửa được khi ở trạng thái Nháp. Sau khi "Gửi duyệt", PR bị khóa và chờ Quản lý duyệt.' />
          <Form form={form} layout="vertical" requiredMark>
            <Card title="Thông tin chung" style={{ marginBottom: 16 }}>
              <Form.Item name="reason" label="Lý do đề nghị mua" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do' }, { max: 500 }]}>
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>
            </Card>
            <Card title="Dòng hàng (ít nhất 1 dòng)" style={{ marginBottom: 16 }}>
              <Form.List
                name="items"
                rules={[{ validator: async (_, v) => { if (!v || v.length < 1) throw new Error('PR phải có ít nhất một dòng hàng (BR-12)'); } }]}
              >
                {(fields, { add, remove }, { errors }) => (
                  <>
                    {fields.map((f, idx) => (
                      <Flex key={f.key} gap={12} align="flex-start" wrap>
                        <Form.Item
                          name={[f.name, 'productId']}
                          label={idx === 0 ? 'Sản phẩm' : undefined}
                          style={{ flex: '2 1 320px' }}
                          rules={[
                            { required: true, message: 'Chọn sản phẩm' },
                            { validator: async (_, val) => { if (val && chosen.filter((c) => c === val).length > 1) throw new Error('Sản phẩm bị trùng với dòng khác'); } },
                          ]}
                        >
                          <ProductSelect exclude={chosen} />
                        </Form.Item>
                        <Form.Item
                          name={[f.name, 'quantity']}
                          label={idx === 0 ? 'Số lượng' : undefined}
                          style={{ flex: '0 1 160px' }}
                          rules={[{ required: true, message: 'Nhập số lượng' }, { type: 'number', min: 0.001, message: 'Số lượng phải lớn hơn 0' }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name={[f.name, 'note']} label={idx === 0 ? 'Ghi chú' : undefined} style={{ flex: '1 1 200px' }} rules={[{ max: 255 }]}>
                          <Input />
                        </Form.Item>
                        <Button aria-label="Xóa dòng" icon={<DeleteOutlined />} danger type="text" style={{ marginTop: idx === 0 ? 30 : 0 }} onClick={() => remove(f.name)} />
                      </Flex>
                    ))}
                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>Thêm dòng hàng</Button>
                    <Form.ErrorList errors={errors} />
                  </>
                )}
              </Form.List>
            </Card>
            <Flex justify="flex-end">
              <Space wrap>
                <Button onClick={() => nav(editId ? `/pr/${editId}` : '/pr')}>Hủy bỏ</Button>
                <Button loading={save.isPending && !save.variables?.submit} disabled={save.isPending} onClick={() => onSave(false)}>Lưu nháp</Button>
                <Button type="primary" loading={save.isPending && !!save.variables?.submit} disabled={save.isPending} onClick={() => onSave(true)}>Lưu & gửi duyệt</Button>
              </Space>
            </Flex>
          </Form>
        </>
      )}
    </>
  );
}
