// ============================================================
// PO Detail Page — IN08, IN09
// ============================================================
import { Card, Descriptions, Table, Button, Alert, Spin, Tag, Progress } from 'antd'
import { ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router'
import type { PurchaseOrderItem } from '@/types'
import { purchaseOrderApi } from '@/api'
import { formatDateTime, formatNumber } from '@/utils'
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import { useAuthStore } from '@/auth/store'
import type { ColumnsType } from 'antd/es/table'

export function PODetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getPurchaseOrderById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>
  if (!po) return <Alert message="Không tìm thấy PO" type="error" showIcon />

  const canReceive = (user?.roleName === 'WAREHOUSE_STAFF' || user?.roleName === 'MANAGER') &&
    (po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED')

  const itemCols: ColumnsType<PurchaseOrderItem> = [
    { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Số đặt', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right', render: (v: number) => formatNumber(v) },
    { title: 'Đã nhận', dataIndex: 'receivedQuantity', key: 'receivedQuantity', width: 100, align: 'right', render: (v: number) => <span className="text-green-600">{formatNumber(v)}</span> },
    { title: 'Còn lại', dataIndex: 'remainingQuantity', key: 'remainingQuantity', width: 100, align: 'right', render: (v: number) => v > 0 ? <span className="text-orange-500">{formatNumber(v)}</span> : <Tag color="success">Đủ</Tag> },
    {
      title: 'Tiến độ', key: 'progress', width: 120,
      render: (_: unknown, r: PurchaseOrderItem) => {
        const pct = r.quantity > 0 ? Math.round((r.receivedQuantity / r.quantity) * 100) : 0
        return <Progress percent={pct} size="small" strokeColor={pct === 100 ? '#52c41a' : '#1677ff'} />
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title={po.orderCode}
        subtitle={`Đơn đặt hàng — ${PO_STATUS_LABELS[po.status]}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Đơn đặt hàng', path: '/purchase-orders' },
          { label: po.orderCode },
        ]}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase-orders')}>Quay lại</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Thông tin PO" className="lg:col-span-2">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Mã PO"><span className="font-mono font-medium">{po.orderCode}</span></Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><StatusTag status={po.status} labels={PO_STATUS_LABELS} colors={PO_STATUS_COLORS} /></Descriptions.Item>
            <Descriptions.Item label="PR tham chiếu">
              <Button type="link" size="small" className="!p-0" onClick={() => navigate(`/purchase-requests/${po.purchaseRequestId}`)}>
                {po.requestCode}
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Người tạo">{po.creatorName}</Descriptions.Item>
            <Descriptions.Item label="Ngày đặt">{formatDateTime(po.orderDate)}</Descriptions.Item>
            <Descriptions.Item label="Dự kiến giao">{formatDateTime(po.expectedDeliveryDate)}</Descriptions.Item>
            {po.note && <Descriptions.Item label="Ghi chú" span={2}>{po.note}</Descriptions.Item>}
          </Descriptions>
        </Card>

        <Card title="Nhà cung cấp">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Tên">{po.supplierName}</Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      <Card
        title={`Dòng hàng (${po.items.length} sản phẩm)`}
        extra={
          canReceive ? (
            <Button type="primary" icon={<InboxOutlined />}
              onClick={() => navigate(`/goods-receipts/create?poId=${po.purchaseOrderId}`)}>
              Lập phiếu nhận hàng
            </Button>
          ) : undefined
        }
      >
        <Table<PurchaseOrderItem>
          columns={itemCols} dataSource={po.items} rowKey="purchaseOrderItemId"
          pagination={false} size="small" scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}

