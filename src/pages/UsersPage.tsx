import { useState } from 'react';
import { palette } from '@/theme';
import { SearchOutlined } from '@ant-design/icons';
import { Pill } from '@/components/StatusTag';
import { applyFieldErrors, validated } from '@/lib/validate';
import { App, Button, Form, Input, Modal, Popconfirm, Select, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type User, type UserCreate } from '@/api/users';
import { ROLES, ROLE_LABELS, isRole, type Role } from '@/auth/roles';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { usePaging } from '@/components/usePaging';
import { useDebounced } from '@/components/useDebounced';
import { useAuth } from '@/auth/useAuth';
import { errMsg, toApiError } from '@/lib/errors';
import { fmtDateTime } from '@/lib/format';

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export default function UsersPage() {
  const { user: me } = useAuth();
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const { page, size, setPage, pagination } = usePaging();
  const list = useQuery({ queryKey: ['users', { dq, page, size }], queryFn: () => usersApi.list({ q: dq || undefined, page, size }) });
  const [creating, setCreating] = useState(false);
  const [roleFor, setRoleFor] = useState<User | null>(null);
  const [form] = Form.useForm<UserCreate>();
  const [roleForm] = Form.useForm<{ role: Role }>();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const create = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      message.success('Đã tạo tài khoản');
      setCreating(false);
      invalidate();
    },
    onError: (e) => {
      const err = toApiError(e);
      if (applyFieldErrors(form, err)) return;
      if (err.status === 409) form.setFields([{ name: 'username', errors: [err.code ? err.message : 'Tên đăng nhập đã tồn tại'] }]);
      else message.error(err.message);
    },
  });
  const lock = useMutation({ mutationFn: (id: number) => usersApi.lock(id), onSuccess: () => { message.success('Đã khóa tài khoản'); invalidate(); }, onError: (e) => message.error(errMsg(e)) });
  const changeRole = useMutation({
    mutationFn: (v: { id: number; role: Role }) => usersApi.changeRole(v.id, v.role),
    onSuccess: () => { message.success('Đã đổi vai trò'); setRoleFor(null); invalidate(); },
    onError: (e) => message.error(errMsg(e)),
  });

  return (
    <>
      <PageHeader title="Người dùng" extra={<Button type="primary" onClick={() => { form.resetFields(); setCreating(true); }}>+ Tạo tài khoản</Button>} />
      <div className="toolbar">
        <Input allowClear prefix={<SearchOutlined style={{ color: palette.muted }} />} placeholder="Tìm theo tên đăng nhập, họ tên" style={{ maxWidth: 320 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
      </div>
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<User>
        className="table-shell"
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        scroll={{ x: 1000 }}
        columns={[
          { title: 'Tên đăng nhập', dataIndex: 'username' },
          { title: 'Họ tên', dataIndex: 'fullName' },
          { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
          { title: 'Vai trò', dataIndex: 'role', render: (r: string) => <Pill tone="sky">{isRole(r) ? ROLE_LABELS[r] : r}</Pill> },
          { title: 'Trạng thái', dataIndex: 'active', render: (a) => (a ? <Pill tone="ok">Hoạt động</Pill> : <Pill tone="bad">Đã khóa</Pill>) },
          { title: 'Đăng nhập cuối', dataIndex: 'lastLoginAt', render: fmtDateTime },
          { title: 'Ngày tạo', dataIndex: 'createdAt', render: fmtDateTime },
          {
            title: 'Thao tác', key: 'act', width: 200, fixed: 'right',
            render: (_, u) =>
              u.id === me?.userId ? <Pill tone="neutral">Tài khoản của bạn</Pill> : (
                <>
                  <Button type="link" size="small" disabled={!u.active} onClick={() => { setRoleFor(u); roleForm.setFieldsValue({ role: isRole(u.role) ? u.role : 'REQUESTER' }); }}>Đổi vai trò</Button>
                  <Popconfirm title={`Khóa tài khoản ${u.username}?`} description="Tài khoản bị khóa sẽ không đăng nhập được." okText="Khóa" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => lock.mutateAsync(u.id)} disabled={!u.active}>
                    <Button type="link" size="small" danger disabled={!u.active}>Khóa</Button>
                  </Popconfirm>
                </>
              ),
          },
        ]}
      />
      <Modal open={creating} title="Tạo tài khoản" okText="Tạo" cancelText="Hủy" confirmLoading={create.isPending} onCancel={() => setCreating(false)} onOk={async () => { const v = await validated(form); if (v) create.mutate(v); }} forceRender>
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Bắt buộc' }, { pattern: /^[A-Za-z0-9._-]{3,100}$/, message: '3–100 ký tự: chữ, số, . _ -' }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu ban đầu" rules={[{ required: true, message: 'Bắt buộc' }, { min: 8, max: 72, message: 'Mật khẩu 8–72 ký tự' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Bắt buộc' }, { max: 150 }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không đúng định dạng' }]}><Input /></Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}><Select options={roleOptions} /></Form.Item>
        </Form>
      </Modal>
      <Modal open={!!roleFor} title={`Đổi vai trò · ${roleFor?.username ?? ''}`} okText="Lưu" cancelText="Hủy" confirmLoading={changeRole.isPending} onCancel={() => setRoleFor(null)}
        onOk={async () => { const v = await validated(roleForm); if (v && roleFor) changeRole.mutate({ id: roleFor.id, role: v.role }); }} forceRender>
        <Form form={roleForm} layout="vertical">
          <Form.Item name="role" label="Vai trò mới" rules={[{ required: true }]}><Select options={roleOptions} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
