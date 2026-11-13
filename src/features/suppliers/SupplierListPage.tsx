// ============================================================
// Supplier List Page — IN03
// ============================================================
import { useState } from 'react'
import { Table, Button, Tag, Space, Modal, Form, Input, message, Popconfirm, Descriptions } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Supplier, SupplierFormData } from '@/types'
import { supplierApi } from '@/api'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function SupplierListPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [viewing, setViewing] = useState<Supplier | null>(null)
  const [form] = Form.useForm<SupplierFormData>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page],
    queryFn: () => supplierApi.getSuppliers(page, 20),
  })

  const saveMutation = useMutation({
    mutationFn: (formData: SupplierFormData) => {
      if (editing) {
        return supplierApi.updateSupplier(editing.supplierId, formData)
      }
      return supplierApi.createSupplier(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      message.success(editing ? 'Cập nhật NCC thành công' : 'Tạo NCC thành công')
      handleClose()
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      message.error(apiErr?.response?.data?.message ?? 'Có lỗi xảy ra')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (sup: Supplier) =>
      supplierApi.updateSupplier(sup.supplierId, { isActive: !sup.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      message.success('Cập nhật trạng thái thành công')
    },
  })

  const handleClose = () => { setModalOpen(false); setEditing(null); form.resetFields() }
  const handleEdit = (sup: Supplier) => {
    setEditing(sup)
    form.setFieldsValue({ supplierName: sup.supplierName, contactPerson: sup.contactPerson ?? '', phone: sup.phone ?? '', email: sup.email ?? '', address: sup.address ?? '' })
    setModalOpen(true)
  }

  const columns: ColumnsType<Supplier> = [
    { title: 'Tên nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName', ellipsis: true },
    { title: 'Người liên hệ', dataIndex: 'contactPerson', key: 'contactPerson', width: 160, render: (v: string | null) => v || '—' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', width: 140, render: (v: string | null) => v ? <span><PhoneOutlined className="mr-1" />{v}</span> : '—' },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200, render: (v: string | null) => v ? <span><MailOutlined className="mr-1" />{v}</span> : '—' },
    {
      title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 130,
      render: (v: boolean) => v ? <Tag color="success">Hợp tác</Tag> : <Tag color="error">Ngừng HT</Tag>,
    },
    {
      title: 'Thao tác', key: 'actions', width: 200, fixed: 'right',
      render: (_: unknown, record: Supplier) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setViewing(record); setDetailOpen(true) }}>Chi tiết</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm title={record.isActive ? 'Ngừng hợp tác?' : 'Hợp tác lại?'} onConfirm={() => toggleMutation.mutate(record)}>
            <Button type="link" size="small" danger={record.isActive}
              icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}>
              {record.isActive ? 'Ngừng' : 'Kích hoạt'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Nhà cung cấp" subtitle="Quản lý nhà cung cấp linh kiện"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Thêm NCC</Button>} />

      <Table<Supplier> columns={columns} dataSource={data?.content ?? []} rowKey="supplierId"
        loading={isLoading} scroll={{ x: 900 }}
        pagination={{ current: data?.page ?? 1, pageSize: data?.size ?? 20, total: data?.totalElements ?? 0, showSizeChanger: false, showTotal: (t) => `Tổng ${t} NCC`, onChange: (p) => setPage(p) }} />

      {/* Detail Drawer */}
      <Modal title="Chi tiết nhà cung cấp" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {viewing && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Tên">{viewing.supplierName}</Descriptions.Item>
            <Descriptions.Item label="Người liên hệ">{viewing.contactPerson || '—'}</Descriptions.Item>
            <Descriptions.Item label="SĐT">{viewing.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewing.email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{viewing.address || '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{viewing.isActive ? <Tag color="success">Hợp tác</Tag> : <Tag color="error">Ngừng HT</Tag>}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal title={editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'} open={modalOpen}
        onCancel={handleClose} onOk={() => form.submit()} confirmLoading={saveMutation.isPending}
        okText={editing ? 'Cập nhật' : 'Tạo mới'} cancelText="Hủy" width={560} destroyOnClose>
        <Form<SupplierFormData> form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)} className="mt-4">
          <Form.Item name="supplierName" label="Tên nhà cung cấp" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="VD: Phong Vũ Trading" />
          </Form.Item>
          <Form.Item name="contactPerson" label="Người liên hệ">
            <Input placeholder="VD: Nguyễn Phong" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="VD: 028-1234-5678" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không đúng định dạng' }]}>
            <Input placeholder="VD: sales@phongvu.vn" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Địa chỉ nhà cung cấp" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

