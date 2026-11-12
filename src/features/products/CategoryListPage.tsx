// ============================================================
// Category List Page
// ============================================================
import { useState } from 'react'
import { Table, Button, Tag, Space, Modal, Form, Input, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Category, PaginatedResponse, CategoryFormData } from '@/types'
import { mockGetCategories, mockCreateCategory } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function CategoryListPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form] = Form.useForm<CategoryFormData>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await http.get('/categories', { params: { size: 100 } })
        return res.data as PaginatedResponse<Category>
      } catch {
        return await mockGetCategories(1, 100)
      }
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (formData: CategoryFormData) => {
      try {
        if (editing) {
          const res = await http.put(`/categories/${editing.categoryId}`, formData)
          return res.data
        }
        const res = await http.post('/categories', formData)
        return res.data
      } catch (err: unknown) {
        const apiErr = err as { response?: { status?: number } }
        if (apiErr?.response?.status && apiErr.response.status < 500) throw err
        return await mockCreateCategory(formData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      message.success(editing ? 'Cập nhật nhóm hàng thành công' : 'Tạo nhóm hàng thành công')
      handleClose()
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      message.error(apiErr?.response?.data?.message ?? 'Có lỗi xảy ra')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (cat: Category) => {
      try {
        const res = await http.put(`/categories/${cat.categoryId}`, { isActive: !cat.isActive })
        return res.data
      } catch {
        cat.isActive = !cat.isActive
        return cat
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      message.success('Cập nhật trạng thái thành công')
    },
  })

  const handleClose = () => { setModalOpen(false); setEditing(null); form.resetFields() }

  const handleEdit = (cat: Category) => {
    setEditing(cat)
    form.setFieldsValue({ categoryName: cat.categoryName, description: cat.description ?? '' })
    setModalOpen(true)
  }

  const columns: ColumnsType<Category> = [
    { title: 'ID', dataIndex: 'categoryId', key: 'categoryId', width: 60 },
    { title: 'Tên nhóm hàng', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true, render: (v: string | null) => v || '—' },
    {
      title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 120,
      render: (v: boolean) => v ? <Tag color="success">Hoạt động</Tag> : <Tag color="error">Ngừng</Tag>,
    },
    {
      title: 'Thao tác', key: 'actions', width: 160,
      render: (_: unknown, record: Category) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm title={record.isActive ? 'Ngừng hoạt động?' : 'Kích hoạt lại?'}
            onConfirm={() => toggleMutation.mutate(record)}>
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
      <PageHeader title="Nhóm hàng" subtitle="Quản lý danh mục nhóm hàng"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Thêm nhóm hàng</Button>} />

      <Table<Category>
        columns={columns} dataSource={data?.content ?? []} rowKey="categoryId"
        loading={isLoading} pagination={false} />

      <Modal title={editing ? 'Sửa nhóm hàng' : 'Thêm nhóm hàng'} open={modalOpen}
        onCancel={handleClose} onOk={() => form.submit()} confirmLoading={saveMutation.isPending}
        okText={editing ? 'Cập nhật' : 'Tạo mới'} cancelText="Hủy" destroyOnClose>
        <Form<CategoryFormData> form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)} className="mt-4">
          <Form.Item name="categoryName" label="Tên nhóm hàng" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="VD: CPU / Processor" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả nhóm hàng..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

