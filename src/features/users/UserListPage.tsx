// ============================================================
// User Management Page — IN01
// ============================================================
import { useState } from 'react'
import { Table, Button, Tag, Modal, Form, Input, Select, message, Popconfirm, Avatar } from 'antd'
import { PlusOutlined, LockOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { User, PaginatedResponse, CreateUserRequest } from '@/types'
import { mockGetUsers, mockCreateUser, mockLockUser } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatDateTime } from '@/utils'
import { ROLE_LABELS, ROLE_COLORS } from '@/constants'
import { getInitials, stringToColor } from '@/utils'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'
import type { Role } from '@/types'

export function UserListPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<CreateUserRequest>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      try {
        const res = await http.get('/users', { params: { page, size: 20 } })
        return res.data as PaginatedResponse<User>
      } catch {
        return await mockGetUsers(page, 20)
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (formData: CreateUserRequest) => {
      try {
        const res = await http.post('/users', formData)
        return res.data
      } catch (err: unknown) {
        const apiErr = err as { response?: { status?: number } }
        if (apiErr?.response?.status && apiErr.response.status < 500) throw err
        return await mockCreateUser(formData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('Tạo tài khoản thành công')
      setModalOpen(false)
      form.resetFields()
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      message.error(apiErr?.response?.data?.message ?? 'Có lỗi xảy ra')
    },
  })

  const lockMutation = useMutation({
    mutationFn: async (userId: number) => {
      try {
        const res = await http.post(`/users/${userId}/lock`)
        return res.data
      } catch {
        return await mockLockUser(userId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('Cập nhật trạng thái thành công')
    },
  })

  const columns: ColumnsType<User> = [
    {
      title: 'Người dùng', key: 'user', width: 280,
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-3">
          <Avatar size={36} style={{ backgroundColor: stringToColor(record.fullName) }}>
            {getInitials(record.fullName)}
          </Avatar>
          <div>
            <div className="font-medium">{record.fullName}</div>
            <div className="text-xs text-gray-500">@{record.username}</div>
          </div>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: 'Vai trò', dataIndex: 'roleName', key: 'roleName', width: 160,
      render: (v: Role) => <Tag color={ROLE_COLORS[v]}>{ROLE_LABELS[v]}</Tag>,
    },
    {
      title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 120,
      render: (v: boolean) => v ? <Tag color="success">Hoạt động</Tag> : <Tag color="error">Bị khóa</Tag>,
    },
    { title: 'Đăng nhập cuối', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 160, render: (v: string | null) => formatDateTime(v) },
    {
      title: 'Thao tác', key: 'actions', width: 120, fixed: 'right',
      render: (_: unknown, record: User) => (
        <Popconfirm title={record.isActive ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản?'}
          onConfirm={() => lockMutation.mutate(record.userId)}>
          <Button type="link" size="small" danger={record.isActive}
            icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}>
            {record.isActive ? 'Khóa' : 'Mở khóa'}
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Quản lý người dùng" subtitle="Tạo, khóa tài khoản và phân quyền"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Tạo tài khoản</Button>} />

      <Table<User> columns={columns} dataSource={data?.content ?? []} rowKey="userId"
        loading={isLoading} scroll={{ x: 900 }}
        pagination={{ current: data?.page ?? 1, pageSize: data?.size ?? 20, total: data?.totalElements ?? 0, showSizeChanger: false, showTotal: (t) => `Tổng ${t} tài khoản`, onChange: (p) => setPage(p) }} />

      <Modal title="Tạo tài khoản mới" open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()} confirmLoading={createMutation.isPending} okText="Tạo" cancelText="Hủy" width={520} destroyOnClose>
        <Form<CreateUserRequest> form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)} className="mt-4">
          <Form.Item name="username" label="Tên đăng nhập"
            rules={[{ required: true, message: 'Bắt buộc' }, { pattern: /^[A-Za-z0-9._-]{3,100}$/, message: '3-100 ký tự, chỉ gồm chữ, số, ._-' }]}>
            <Input prefix={<UserOutlined />} placeholder="username" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu"
            rules={[{ required: true, message: 'Bắt buộc' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Bắt buộc' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="roleId" label="Vai trò" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select placeholder="Chọn vai trò" options={[
              { value: 1, label: 'Requester' },
              { value: 2, label: 'Warehouse Staff' },
              { value: 3, label: 'Purchasing Staff' },
              { value: 4, label: 'Manager' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

