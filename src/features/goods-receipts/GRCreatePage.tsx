// ============================================================
// GR Create Page — IN09, IN10
// ============================================================
import { useState } from 'react'
import { Card, Form, Select, Input, Button, Table, InputNumber, message } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import type { PurchaseOrder, PaginatedResponse } from '@/types'
import { mockGetPurchaseOrders, mockGetPurchaseOrder, mockCreateGR } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatNumber } from '@/utils'
import { PageHeader } from '@/components/common'

interface GRItemRow {
  purchaseOrderItemId: number
  sku: string
  productName: string
  unit: string
  ordered: number
  alreadyReceived: number
  remaining: number
  receivedQuantity: number
}

export function GRCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const poIdParam = searchParams.get('poId')
  const [form] = Form.useForm()
  const [selectedPOId, setSelectedPOId] = useState<number | undefined>(() =>
    poIdParam ? Number(poIdParam) : undefined,
  )
  const [customQuantities, setCustomQuantities] = useState<Record<number, number>>({})

  // Fetch POs that can receive goods
  const { data: receivablePOs } = useQuery({
    queryKey: ['purchase-orders', 'receivable'],
    queryFn: async () => {
      try {
        const res = await http.get('/purchase-orders', { params: { size: 100 } })
        return (res.data as PaginatedResponse<PurchaseOrder>).content
          .filter(po => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED')
      } catch {
        return (await mockGetPurchaseOrders(1, 100)).content
          .filter(po => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED')
      }
    },
  })

  // Fetch selected PO detail
  const { data: selectedPO } = useQuery({
    queryKey: ['purchase-order', selectedPOId],
    queryFn: async () => {
      if (!selectedPOId) return null
      try {
        const res = await http.get(`/purchase-orders/${selectedPOId}`)
        return res.data as PurchaseOrder
      } catch {
        return await mockGetPurchaseOrder(selectedPOId)
      }
    },
    enabled: !!selectedPOId,
  })

  const grItems: GRItemRow[] = (selectedPO?.items ?? [])
    .filter(i => i.remainingQuantity > 0)
    .map(i => ({
      purchaseOrderItemId: i.purchaseOrderItemId,
      sku: i.sku,
      productName: i.productName,
      unit: i.unit,
      ordered: i.quantity,
      alreadyReceived: i.receivedQuantity,
      remaining: i.remainingQuantity,
      receivedQuantity: customQuantities[i.purchaseOrderItemId] ?? i.remainingQuantity,
    }))

  const updateItemQty = (poiId: number, qty: number) => {
    setCustomQuantities(prev => ({ ...prev, [poiId]: qty }))
  }

  const createMutation = useMutation({
    mutationFn: async (values: { purchaseOrderId: number; documentReference?: string; note?: string }) => {
      const payload = {
        ...values,
        items: grItems.filter(i => i.receivedQuantity > 0).map(i => ({
          purchaseOrderItemId: i.purchaseOrderItemId,
          receivedQuantity: i.receivedQuantity,
        })),
      }
      try {
        const res = await http.post('/goods-receipts', payload)
        return res.data
      } catch {
        return await mockCreateGR(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      message.success('Lập phiếu nhận hàng thành công')
      navigate('/goods-receipts')
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      message.error(apiErr?.response?.data?.message ?? 'Có lỗi xảy ra')
    },
  })

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 70 },
    { title: 'Số đặt', dataIndex: 'ordered', key: 'ordered', width: 90, align: 'right' as const, render: (v: number) => formatNumber(v) },
    { title: 'Đã nhận', dataIndex: 'alreadyReceived', key: 'alreadyReceived', width: 90, align: 'right' as const, render: (v: number) => <span className="text-green-600">{formatNumber(v)}</span> },
    { title: 'Còn lại', dataIndex: 'remaining', key: 'remaining', width: 90, align: 'right' as const, render: (v: number) => <span className="text-orange-500">{formatNumber(v)}</span> },
    {
      title: 'Nhận lần này', key: 'receivedQuantity', width: 130,
      render: (_: unknown, record: GRItemRow) => (
        <InputNumber min={0} max={record.remaining} value={record.receivedQuantity}
          onChange={(v) => updateItemQty(record.purchaseOrderItemId, v ?? 0)} style={{ width: '100%' }} />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Lập phiếu nhận hàng"
        subtitle="Ghi nhận hàng nhận theo PO"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Nhập kho', path: '/goods-receipts' },
          { label: 'Tạo mới' },
        ]}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/goods-receipts')}>Quay lại</Button>}
      />

      <Card className="mb-4">
        <Form form={form} layout="vertical" initialValues={{ purchaseOrderId: selectedPOId }} onFinish={(v) => createMutation.mutate(v)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="purchaseOrderId" label="Chọn PO" rules={[{ required: true, message: 'Chọn PO cần nhận hàng' }]}>
              <Select placeholder="Chọn đơn đặt hàng"
                onChange={(v) => {
                  setSelectedPOId(v)
                  setCustomQuantities({})
                  form.setFieldsValue({ purchaseOrderId: v })
                }}
                options={receivablePOs?.map(po => ({
                  value: po.purchaseOrderId,
                  label: `${po.orderCode} — ${po.supplierName} (${po.status === 'PARTIALLY_RECEIVED' ? 'Nhận một phần' : 'Chờ nhận'})`,
                }))} />
            </Form.Item>
            <Form.Item name="documentReference" label="Số chứng từ NCC">
              <Input placeholder="VD: INV-PV-2026-1234" />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú" className="md:col-span-2">
              <Input.TextArea rows={2} placeholder="Ghi chú (tùy chọn)" />
            </Form.Item>
          </div>
        </Form>
      </Card>

      {selectedPO && (
        <Card title={`Hàng nhận từ ${selectedPO.orderCode}`} className="mb-4">
          <Table
            dataSource={grItems}
            rowKey="purchaseOrderItemId"
            columns={itemColumns}
            pagination={false}
            size="small"
            scroll={{ x: 700 }}
          />
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={() => navigate('/goods-receipts')}>Hủy</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}
          loading={createMutation.isPending} disabled={!selectedPO || grItems.every(i => i.receivedQuantity === 0)}>
          Lập phiếu nhận hàng
        </Button>
      </div>
    </div>
  )
}
