import { useState } from 'react';
import { palette } from '@/theme';
import { SearchOutlined } from '@ant-design/icons';
import { Pill } from '@/components/StatusTag';
import { applyFieldErrors, validated } from '@/lib/validate';
import { App, Button, Flex, Form, Input, Modal, Select, Switch, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suppliersApi, type Supplier, type SupplierInput } from '@/api/suppliers';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { usePaging } from '@/components/usePaging';
import { useDebounced } from '@/components/useDebounced';
import { useAuth } from '@/auth/useAuth';
import { errMsg, toApiError } from '@/lib/errors';

export default function SuppliersPage() {
  const { can } = useAuth();
  const canManage = can('supplier:manage');
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const dq = useDebounced(q.trim());
  const { page, size, setPage, pagination } = usePaging();
  const list = useQuery({
    queryKey: ['suppliers', { dq, isActive, page, size }],
    queryFn: () => suppliersApi.list({ q: dq || undefined, isActive, page, size }),
  });
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null);
  const [form] = Form.useForm<SupplierInput>();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['suppliers'] });
    qc.invalidateQueries({ queryKey: ['lookup', 'suppliers'] });
  };
  const save = useMutation({
    mutationFn: (v: SupplierInput) => (editing && editing !== 'new' ? suppliersApi.update(editing.id, v) : suppliersApi.create(v)),
    onSuccess: () => {
      message.success('Đã lưu nhà cung cấp');
      setEditing(null);
      invalidate();
    },
    onError: (e) => {
      const err = toApiError(e);
      if (!applyFieldErrors(form, err)) message.error(err.message);
    },
  });
  const toggle = useMutation({
    mutationFn: (s: Supplier) => suppliersApi.update(s.id, { ...s, active: !s.active }),
    onSuccess: invalidate,
    onError: (e) => message.error(errMsg(e)),
  });
  const open = (s: Supplier | 'new') => {
    setEditing(s);
    form.setFieldsValue(s === 'new' ? { name: '', contactPerson: '', phone: '', email: '', address: '', active: true } : s);
  };

  return (
    <>
      <PageHeader title="Nhà cung cấp" extra={canManage && <Button type="primary" onClick={() => open('new')}>+ Thêm nhà cung cấp</Button>} />
      <div className="toolbar">
        <Flex gap={12} wrap>
          <Input allowClear prefix={<SearchOutlined style={{ color: palette.muted }} />} placeholder="Tìm theo tên, liên hệ" style={{ width: 280 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          <Select
            style={{ width: 200 }}
            value={isActive === undefined ? 'all' : isActive ? 'on' : 'off'}
            onChange={(v) => { setIsActive(v === 'all' ? undefined : v === 'on'); setPage(0); }}
            options={[{ value: 'all', label: 'Tất cả' }, { value: 'on', label: 'Đang hợp tác' }, { value: 'off', label: 'Ngừng hợp tác' }]}
          />
        </Flex>
      </div>
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<Supplier>
        className="table-shell"
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        scroll={{ x: 1000 }}
        locale={{ emptyText: 'Chưa có nhà cung cấp' }}
        columns={[
          { title: 'Tên nhà cung cấp', dataIndex: 'name' },
          { title: 'Người liên hệ', dataIndex: 'contactPerson', render: (v) => v || '—' },
          { title: 'Điện thoại', dataIndex: 'phone', render: (v) => v || '—' },
          { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
          { title: 'Địa chỉ', dataIndex: 'address', ellipsis: true, render: (v) => v || '—' },
          { title: 'Trạng thái', dataIndex: 'active', width: 140, render: (a) => (a ? <Pill tone="ok">Đang hợp tác</Pill> : <Pill tone="neutral">Ngừng hợp tác</Pill>) },
          ...(canManage
            ? [{
                title: 'Thao tác', key: 'act', width: 210, fixed: 'right' as const,
                render: (_: unknown, s: Supplier) => (
                  <>
                    <Button type="link" size="small" onClick={() => open(s)}>Sửa</Button>
                    <Button type="link" size="small" danger={s.active} loading={toggle.isPending && toggle.variables?.id === s.id} onClick={() => toggle.mutate(s)}>
                      {s.active ? 'Ngừng hợp tác' : 'Hợp tác lại'}
                    </Button>
                  </>
                ),
              }]
            : []),
        ]}
      />
      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Thêm nhà cung cấp' : 'Sửa nhà cung cấp'}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={save.isPending}
        onCancel={() => setEditing(null)}
        onOk={async () => { const v = await validated(form); if (v) save.mutate(v); }}
        forceRender
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên nhà cung cấp" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên' }, { max: 200 }]}>
            <Input />
          </Form.Item>
          <Flex gap={16}>
            <Form.Item name="contactPerson" label="Người liên hệ" style={{ flex: 1 }} rules={[{ max: 100 }]}><Input /></Form.Item>
            <Form.Item name="phone" label="Điện thoại" style={{ flex: 1 }} rules={[{ pattern: /^[0-9+\-\s().]{0,20}$/, message: 'Số điện thoại không hợp lệ' }]}><Input /></Form.Item>
          </Flex>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không đúng định dạng' }, { max: 150 }]}><Input /></Form.Item>
          <Form.Item name="address" label="Địa chỉ" rules={[{ max: 300 }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="active" label="Đang hợp tác" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
