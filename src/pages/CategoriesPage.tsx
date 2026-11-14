import { useState } from 'react';
import { Pill } from '@/components/StatusTag';
import { applyFieldErrors, validated } from '@/lib/validate';
import { App, Button, Form, Input, Modal, Switch, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, type Category, type CategoryInput } from '@/api/categories';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert } from '@/components/States';
import { useAuth } from '@/auth/useAuth';
import { errMsg, toApiError } from '@/lib/errors';

export default function CategoriesPage() {
  const { can } = useAuth();
  const canManage = can('category:manage');
  const { message } = App.useApp();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [form] = Form.useForm<CategoryInput>();

  const save = useMutation({
    mutationFn: (v: CategoryInput) => (editing && editing !== 'new' ? categoriesApi.update(editing.id, v) : categoriesApi.create(v)),
    onSuccess: () => {
      message.success('Đã lưu nhóm hàng');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['lookup'] });
    },
    onError: (e) => {
      const err = toApiError(e);
      if (applyFieldErrors(form, err)) return;
      if (err.status === 409) form.setFields([{ name: 'name', errors: [err.code ? err.message : 'Tên nhóm đã tồn tại'] }]);
      else message.error(err.message);
    },
  });
  const toggle = useMutation({
    mutationFn: (c: Category) => categoriesApi.update(c.id, { name: c.name, description: c.description, active: !c.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    onError: (e) => message.error(errMsg(e)),
  });

  const open = (c: Category | 'new') => {
    setEditing(c);
    form.setFieldsValue(c === 'new' ? { name: '', description: '', active: true } : { name: c.name, description: c.description, active: c.active });
  };

  return (
    <>
      <PageHeader title="Nhóm hàng" extra={canManage && <Button type="primary" onClick={() => open('new')}>+ Thêm nhóm</Button>} />
      {q.error && <ErrorAlert error={q.error} onRetry={() => q.refetch()} />}
      <Table<Category>
        className="table-shell"
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data ?? []}
        pagination={{ pageSize: 20, showTotal: (t) => `Tổng ${t}` }}
        locale={{
          emptyText: <EmptyState title="Chưa có nhóm hàng" hint="Nhóm hàng giúp lọc và tìm sản phẩm nhanh hơn." actionLabel={canManage ? 'Thêm nhóm hàng' : undefined} onAction={() => open('new')} />,
        }}
        columns={[
          { title: 'Tên nhóm', dataIndex: 'name' },
          { title: 'Mô tả', dataIndex: 'description', render: (v) => v || '—' },
          { title: 'Trạng thái', dataIndex: 'active', width: 160, render: (a) => (a ? <Pill tone="ok">Đang sử dụng</Pill> : <Pill tone="neutral">Ngừng sử dụng</Pill>) },
          ...(canManage
            ? [{
                title: 'Thao tác', key: 'act', width: 220,
                render: (_: unknown, c: Category) => (
                  <>
                    <Button type="link" onClick={() => open(c)}>Sửa</Button>
                    <Button type="link" danger={c.active} loading={toggle.isPending && toggle.variables?.id === c.id} onClick={() => toggle.mutate(c)}>
                      {c.active ? 'Ngừng sử dụng' : 'Kích hoạt lại'}
                    </Button>
                  </>
                ),
              }]
            : []),
        ]}
      />
      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Thêm nhóm hàng' : 'Sửa nhóm hàng'}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={save.isPending}
        onCancel={() => setEditing(null)}
        onOk={async () => { const v = await validated(form); if (v) save.mutate(v); }}
        forceRender
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên nhóm" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên nhóm' }, { max: 100 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ max: 500 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="active" label="Đang sử dụng" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
