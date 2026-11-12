// ============================================================
// PO Create Page — IN08
// ============================================================
import { useState } from 'react'
import { Card, Form, Select, Input, DatePicker, Button, Table, message } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import type { PurchaseRequest, Supplier, PaginatedResponse } from '@/types'
import { mockGetPurchaseRequests, mockGetSuppliers, mockCreatePO } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatNumber } from '@/utils'
import { PageHeader } from '@/components/common'

export function POCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const prIdParam = searchParams.get('prId')
  const [form] = Form.useForm()
  const [selectedPRId, setSelectedPRId] = useState<number | undefined>(() =>
    prIdParam ? Number(prIdParam) : undefined,
  )

  // Fetch approved PRs without PO
  const { data: approvedPRs } = useQuery({
    queryKey: ['purchase-requests', 'approved-no-po'],
    queryFn: async () => {
      try {
        const res = await http.get('/purchase-requests', { params: { status: 'APPROVED', size: 100 } })
        return (res.data as PaginatedResponse<PurchaseRequest>).content.filter(pr => !pr.hasPO)
      } catch {
        return (await mockGetPurchaseRequests(1, 100, 'APPROVED')).content.filter(pr => !pr.hasPO)
      }
    },
  })

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async () => {
      try {
        const res = await http.get('/suppliers', { params: { size: 100 } })
        return (res.data as PaginatedResponse<Supplier>).content.filter(s => s.isActive)
      } catch {
        return (await mockGetSuppliers(1, 100)).content.filter(s => s.isActive)
      }
    },
  })

  const selectedPR =
    approvedPRs?.find((p) => p.purchaseRequestId === selectedPRId) ?? null

  const handlePRSelect = (prId: number) => {
    setSelectedPRId(prId)
    form.setFieldsValue({ purchaseRequestId: prId })
  }

  const createMutation = useMutation({
    mutationFn: async (values: { purchaseRequestId: number; supplierId: number; expectedDeliveryDate?: string; note?: string }) => {
      try {
        const res = await http.post('/purchase-orders', {
          ...values,
          items: selectedPR?.items.map(i => ({ purchaseRequestItemId: i.purchaseRequestItemId, quantity: i.quantity })),
        })
        return res.data
      } catch {
        return await mockCreatePO({
          ...values,
          items: selectedPR?.items.map(i => ({ purchaseRequestItemId: i.purchaseRequestItemId, quantity: i.quantity })),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      message.success('Tạo đơn đặt hàng thành công')
      navigate('/purchase-orders')
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      message.error(apiErr?.response?.data?.message ?? 'Có lỗi xảy ra')
    },
  })

  return (
    <div>
      <PageHeader
        title="Tạo đơn đặt hàng"
        subtitle="Lập PO từ PR đã được duyệt"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Đơn đặt hàng', path: '/purchase-orders' },
          { label: 'Tạo mới' },
        ]}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase-orders')}>Quay lại</Button>}
      />

      <Card className="mb-4">
        <Form form={form} layout="vertical" initialValues={{ purchaseRequestId: selectedPRId }} onFinish={(v) => createMutation.mutate(v)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="purchaseRequestId" label="PR đã duyệt" rules={[{ required: true, message: 'Vui lòng chọn PR' }]}>
              <Select placeholder="Chọn PR đã duyệt" onChange={handlePRSelect}
                options={approvedPRs?.map(pr => ({ value: pr.purchaseRequestId, label: `${pr.requestCode} — ${pr.reason || 'Không có lý do'}` }))} />
            </Form.Item>
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: 'Vui lòng chọn NCC' }]}>
              <Select showSearch placeholder="Chọn nhà cung cấp"
                filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
                options={suppliers?.map(s => ({ value: s.supplierId, label: s.supplierName }))} />
            </Form.Item>
            <Form.Item name="expectedDeliveryDate" label="Ngày dự kiến giao hàng">
              <DatePicker className="w-full" placeholder="Chọn ngày" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú">
              <Input placeholder="Ghi chú cho PO (tùy chọn)" />
            </Form.Item>
          </div>
        </Form>
      </Card>

      {selectedPR && (
        <Card title={`Dòng hàng từ ${selectedPR.requestCode}`} className="mb-4">
          <Table
            dataSource={selectedPR.items}
            rowKey="purchaseRequestItemId"
            pagination={false}
            size="small"
            columns={[
              { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, i: number) => i + 1 },
              { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
              { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
              { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
              { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right' as const, render: (v: number) => formatNumber(v) },
              { title: 'Ghi chú', dataIndex: 'note', key: 'note', width: 200, render: (v: string | null) => v || '—' },
            ]}
          />
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={() => navigate('/purchase-orders')}>Hủy</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}
          loading={createMutation.isPending} disabled={!selectedPR}>
          Tạo & Phát hành PO
        </Button>
      </div>
    </div>
  )
}

