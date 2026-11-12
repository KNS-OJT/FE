// ============================================================
// Product List Page — IN02, IN15
// ============================================================
import { useState } from 'react'
import { Table, Button, Input, Tag, Space, Select, message, Modal, Form, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Product, Category, PaginatedResponse, ProductFormData } from '@/types'
import { mockGetProducts, mockCreateProduct, mockGetCategories } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatDateTime } from '@/utils'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function ProductListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form] = Form.useForm<ProductFormData>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: async () => {
      try {
        const res = await http.get('/products', { params: { page, size: 20, search, categoryId: categoryFilter } })
        return res.data as PaginatedResponse<Product>
      } catch {
        return await mockGetProducts(page, 20, search)
      }
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      try {
        const res = await http.get('/categories', { params: { size: 100 } })
        return (res.data as PaginatedResponse<Category>).content
      } catch {
        return (await mockGetCategories(1, 100)).content
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      try {
        const res = await http.post('/products', formData)
        return res.data
      } catch (err: unknown) {
        const apiErr = err as { response?: { status?: number } }
        if (apiErr?.response?.status && apiErr.response.status < 500) throw err
        return await mockCreateProduct(formData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      message.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Tạo sản phẩm thành công')
      handleCloseModal()
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      message.error(apiErr?.response?.data?.message ?? 'Có lỗi xảy ra')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (product: Product) => {
      try {
        const res = await http.put(`/products/${product.productId}`, { isActive: !product.isActive })
        return res.data
      } catch {
        product.isActive = !product.isActive
        return product
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      message.success('Cập nhật trạng thái thành công')
    },
  })

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
    form.resetFields()
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    form.setFieldsValue({
      sku: product.sku,
      productName: product.productName,
      categoryId: product.categoryId,
      unit: product.unit,
    })
    setModalOpen(true)
  }

  const columns: ColumnsType<Product> = [
    {
      title: 'SKU', dataIndex: 'sku', key: 'sku', width: 150,
      render: (v: string) => <span className="font-mono text-xs font-medium">{v}</span>,
    },
    { title: 'Tên sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Nhóm hàng', dataIndex: 'categoryName', key: 'categoryName', width: 160 },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 120,
      render: (v: boolean) => v ? <Tag color="success">Hoạt động</Tag> : <Tag color="error">Ngừng KD</Tag>,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (v: string) => formatDateTime(v) },
    {
      title: 'Thao tác', key: 'actions', width: 140, fixed: 'right',
      render: (_: unknown, record: Product) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm
            title={record.isActive ? 'Ngừng kinh doanh sản phẩm này?' : 'Kích hoạt lại sản phẩm?'}
            onConfirm={() => toggleMutation.mutate(record)}
          >
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
      <PageHeader
        title="Quản lý sản phẩm"
        subtitle="Danh sách sản phẩm linh kiện máy tính"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Thêm sản phẩm
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input.Search
          placeholder="Tìm theo SKU hoặc tên..."
          allowClear
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          onSearch={(v) => { setSearch(v); setPage(1) }}
          onChange={(e) => { if (!e.target.value) { setSearch(''); setPage(1) } }}
        />
        <Select
          placeholder="Lọc theo nhóm hàng"
          allowClear
          style={{ width: 200 }}
          value={categoryFilter}
          onChange={(v) => { setCategoryFilter(v); setPage(1) }}
          options={categories?.filter(c => c.isActive).map(c => ({ value: c.categoryId, label: c.categoryName }))}
        />
      </div>

      <Table<Product>
        columns={columns}
        dataSource={data?.content ?? []}
        rowKey="productId"
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={{
          current: data?.page ?? 1,
          pageSize: data?.size ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} sản phẩm`,
          onChange: (p) => setPage(p),
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={modalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText={editingProduct ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={520}
        destroyOnClose
      >
        <Form<ProductFormData>
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
          className="mt-4"
        >
          <Form.Item name="sku" label="Mã SKU"
            rules={[
              { required: true, message: 'Vui lòng nhập mã SKU' },
              { pattern: /^[A-Z0-9._-]+$/, message: 'SKU chỉ gồm chữ in hoa, số, dấu ._-' },
              { max: 50, message: 'Tối đa 50 ký tự' },
            ]}
          >
            <Input placeholder="VD: CPU-I5-14400F" disabled={!!editingProduct}
              style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="productName" label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
            <Input placeholder="VD: Intel Core i5-14400F" />
          </Form.Item>
          <Form.Item name="categoryId" label="Nhóm hàng"
            rules={[{ required: true, message: 'Vui lòng chọn nhóm hàng' }]}>
            <Select placeholder="Chọn nhóm hàng"
              options={categories?.filter(c => c.isActive).map(c => ({ value: c.categoryId, label: c.categoryName }))} />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị tính"
            rules={[{ required: true, message: 'Vui lòng nhập đơn vị tính' }]}>
            <Input placeholder="VD: cái, thanh, bộ" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

