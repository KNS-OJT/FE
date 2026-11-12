// ============================================================
// Stock Issue Create Page — IN11
// ============================================================
import { useState } from 'react'
import { Card, Form, Input, Button, Table, Select, InputNumber, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { Product, PaginatedResponse } from '@/types'
import { mockGetProducts, mockCreateSI } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { PageHeader } from '@/components/common'

interface SIItemRow {
  key: number
  productId: number
  quantity: number
  productName?: string
  sku?: string
  unit?: string
}

export function SICreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<{ reason: string; note?: string }>()
  const [items, setItems] = useState<SIItemRow[]>([])
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
    mutationFn: async (payload: { reason: string; note?: string; items: { productId: number; quantity: number }[] }) => {
      try {
        const res = await http.post('/stock-issues', payload)
        return res.data
      } catch {
        return await mockCreateSI(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-issues'] })
      message.success('Tạo yêu cầu xuất kho thành công')
      navigate('/stock-issues')
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

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (items.length === 0) {
        message.warning('Phải có ít nhất một dòng sản phẩm')
        return
      }
      const invalidItems = items.filter(i => !i.productId || i.quantity <= 0)
      if (invalidItems.length > 0) {
        message.warning('Vui lòng chọn sản phẩm và nhập số lượng > 0 cho tất cả dòng')
        return
      }
      createMutation.mutate({
        reason: values.reason,
        note: values.note,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      })
    })
  }

  const itemColumns = [
    { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, index: number) => index + 1 },
    {
      title: 'Sản phẩm', key: 'productId', width: 350,
      render: (_: unknown, record: SIItemRow) => (
        <Select showSearch placeholder="Chọn sản phẩm"
          value={record.productId || undefined}
          onChange={(v) => updateItem(record.key, 'productId', v)}
          filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
          options={products?.map(p => ({ value: p.productId, label: `${p.sku} — ${p.productName}` }))}
          style={{ width: '100%' }} />
      ),
    },
    { title: 'Đơn vị', key: 'unit', width: 80, render: (_: unknown, record: SIItemRow) => record.unit || '—' },
    {
      title: 'Số lượng', key: 'quantity', width: 120,
      render: (_: unknown, record: SIItemRow) => (
        <InputNumber min={1} value={record.quantity}
          onChange={(v) => updateItem(record.key, 'quantity', v ?? 1)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: unknown, record: SIItemRow) => (
        <Popconfirm title="Xóa dòng này?" onConfirm={() => removeItem(record.key)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Tạo yêu cầu xuất kho"
        subtitle="Tạo phiếu yêu cầu cấp hàng từ kho"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Xuất kho', path: '/stock-issues' },
          { label: 'Tạo mới' },
        ]}
      />

      <Card className="mb-4">
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="Lý do xuất kho" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
            <Input.TextArea rows={2} placeholder="VD: Cấp RAM cho dự án lắp máy văn phòng" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input placeholder="Ghi chú thêm (tùy chọn)" />
          </Form.Item>
        </Form>
      </Card>

      <Card title="Danh sách sản phẩm cần xuất"
        extra={<Button icon={<PlusOutlined />} onClick={addItem}>Thêm dòng</Button>}>
        <Table columns={itemColumns} dataSource={items} rowKey="key" pagination={false}
          size="small" scroll={{ x: 600 }}
          locale={{ emptyText: 'Chưa có sản phẩm nào. Bấm "Thêm dòng" để bắt đầu.' }} />

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={() => navigate('/stock-issues')}>Hủy</Button>
          <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit}
            loading={createMutation.isPending}>
            Gửi yêu cầu xuất kho
          </Button>
        </div>
      </Card>
    </div>
  )
}

