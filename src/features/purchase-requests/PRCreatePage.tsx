// ============================================================
// PR Create Page — IN06
// ============================================================
import { useState } from 'react'
import { Card, Form, Input, Button, Table, Select, InputNumber, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { Product, PaginatedResponse, PRItemFormData } from '@/types'
import { mockGetProducts, mockCreatePR } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { PageHeader } from '@/components/common'

interface PRFormValues {
  reason: string
}

export function PRCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<PRFormValues>()
  const [items, setItems] = useState<(PRItemFormData & { key: number; productName?: string; sku?: string; unit?: string })[]>([])
  let keyCounter = 0

  const { data: products } = useQuery({
    queryKey: ['products-active'],
    queryFn: async () => {
      try {
        const res = await http.get('/products', { params: { size: 200 } })
        return (res.data as PaginatedResponse<Product>).content.filter(p => p.isActive)
      } catch {
        return (await mockGetProducts(1, 200)).content.filter(p => p.isActive)
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: { reason?: string; items: PRItemFormData[]; submit?: boolean }) => {
      try {
        const res = await http.post('/purchase-requests', { reason: payload.reason, items: payload.items })
        if (payload.submit) {
          await http.post(`/purchase-requests/${res.data.purchaseRequestId}/submit`)
        }
        return res.data
      } catch {
        return await mockCreatePR({ reason: payload.reason, items: payload.items })
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      message.success(variables.submit ? 'Tạo và gửi PR thành công' : 'Lưu PR nháp thành công')
      navigate('/purchase-requests')
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      message.error(apiErr?.response?.data?.message ?? 'Có lỗi xảy ra')
    },
  })

  const addItem = () => {
    setItems([...items, { key: ++keyCounter, productId: 0, quantity: 1 }])
  }

  const removeItem = (key: number) => {
    setItems(items.filter(i => i.key !== key))
  }

  const updateItem = (key: number, field: string, value: unknown) => {
    setItems(items.map(item => {
      if (item.key !== key) return item
      const updated = { ...item, [field]: value }
      if (field === 'productId' && products) {
        const prod = products.find(p => p.productId === value)
        if (prod) {
          updated.productName = prod.productName
          updated.sku = prod.sku
          updated.unit = prod.unit
        }
      }
      return updated
    }))
  }

  const handleSave = (submit = false) => {
    form.validateFields().then((values) => {
      if (items.length === 0) {
        message.warning('PR phải có ít nhất một dòng hàng')
        return
      }
      const invalidItems = items.filter(i => !i.productId || i.quantity <= 0)
      if (invalidItems.length > 0) {
        message.warning('Vui lòng chọn sản phẩm và nhập số lượng > 0 cho tất cả dòng')
        return
      }
      createMutation.mutate({
        reason: values.reason,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, note: i.note })),
        submit,
      })
    })
  }

  const itemColumns = [
    { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, index: number) => index + 1 },
    {
      title: 'Sản phẩm', key: 'productId', width: 350,
      render: (_: unknown, record: (typeof items)[0]) => (
        <Select
          showSearch
          placeholder="Chọn sản phẩm"
          value={record.productId || undefined}
          onChange={(v) => updateItem(record.key, 'productId', v)}
          filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
          options={products?.map(p => ({ value: p.productId, label: `${p.sku} — ${p.productName}` }))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Đơn vị', key: 'unit', width: 80,
      render: (_: unknown, record: (typeof items)[0]) => record.unit || '—',
    },
    {
      title: 'Số lượng', key: 'quantity', width: 120,
      render: (_: unknown, record: (typeof items)[0]) => (
        <InputNumber min={1} value={record.quantity}
          onChange={(v) => updateItem(record.key, 'quantity', v ?? 1)}
          style={{ width: '100%' }} />
      ),
    },
    {
      title: 'Ghi chú', key: 'note', width: 200,
      render: (_: unknown, record: (typeof items)[0]) => (
        <Input placeholder="Ghi chú (tùy chọn)" value={record.note}
          onChange={(e) => updateItem(record.key, 'note', e.target.value)} />
      ),
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: unknown, record: (typeof items)[0]) => (
        <Popconfirm title="Xóa dòng này?" onConfirm={() => removeItem(record.key)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Tạo đề nghị mua hàng"
        subtitle="Tạo PR mới — Lưu nháp hoặc gửi luôn để chờ duyệt"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Đề nghị mua hàng', path: '/purchase-requests' },
          { label: 'Tạo mới' },
        ]}
      />

      <Card className="mb-4">
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="Lý do mua hàng"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder="VD: RAM DDR5 sắp hết, cần bổ sung cho dàn máy mới" />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="Danh sách sản phẩm cần mua"
        extra={
          <Button icon={<PlusOutlined />} onClick={addItem}>
            Thêm dòng
          </Button>
        }
      >
        <Table
          columns={itemColumns}
          dataSource={items}
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          locale={{ emptyText: 'Chưa có sản phẩm nào. Bấm "Thêm dòng" để bắt đầu.' }}
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={() => navigate('/purchase-requests')}>
            Hủy
          </Button>
          <Button icon={<SaveOutlined />} onClick={() => handleSave(false)}
            loading={createMutation.isPending}>
            Lưu nháp
          </Button>
          <Popconfirm title="Gửi PR ngay? PR sẽ không thể sửa sau khi gửi." onConfirm={() => handleSave(true)}>
            <Button type="primary" icon={<SendOutlined />} loading={createMutation.isPending}>
              Lưu & Gửi duyệt
            </Button>
          </Popconfirm>
        </div>
      </Card>
    </div>
  )
}

