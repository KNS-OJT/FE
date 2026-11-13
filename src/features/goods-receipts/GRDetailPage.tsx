// ============================================================
// GR Detail Page — IN09, IN10
// ============================================================
import { Card, Descriptions, Table, Button, Spin, Alert, message, Popconfirm } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router'
import type { GoodsReceiptItem } from '@/types'
import { goodsReceiptApi } from '@/api'
import { formatDateTime, formatNumber } from '@/utils'
import { GR_STATUS_LABELS, GR_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import { useAuthStore } from '@/auth/store'
import type { ColumnsType } from 'antd/es/table'

export function GRDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data: gr, isLoading } = useQuery({
    queryKey: ['goods-receipt', id],
    queryFn: () => goodsReceiptApi.getGoodsReceiptById(Number(id)),
    enabled: !!id,
  })

  const confirmMutation = useMutation({
    mutationFn: () => goodsReceiptApi.confirmGoodsReceipt(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipt', id] })
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      message.success('Xác nhận phiếu nhận hàng thành công — Tồn kho đã được cập nhật')
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>
  if (!gr) return <Alert message="Không tìm thấy phiếu nhận hàng" type="error" showIcon />

  const canConfirm = gr.status === 'DRAFT' && (user?.roleName === 'WAREHOUSE_STAFF' || user?.roleName === 'MANAGER')

  const itemCols: ColumnsType<GoodsReceiptItem> = [
    { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Số lượng nhận', dataIndex: 'receivedQuantity', key: 'receivedQuantity', width: 130, align: 'right', render: (v: number) => <span className="font-medium text-green-600">{formatNumber(v)}</span> },
  ]

  return (
    <div>
      <PageHeader
        title={gr.receiptCode}
        subtitle={`Phiếu nhận hàng — ${GR_STATUS_LABELS[gr.status]}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Nhập kho', path: '/goods-receipts' },
          { label: gr.receiptCode },
        ]}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/goods-receipts')}>Quay lại</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Thông tin phiếu nhận" className="lg:col-span-2">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Mã phiếu"><span className="font-mono font-medium">{gr.receiptCode}</span></Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><StatusTag status={gr.status} labels={GR_STATUS_LABELS} colors={GR_STATUS_COLORS} /></Descriptions.Item>
            <Descriptions.Item label="PO tham chiếu">
              <Button type="link" size="small" className="!p-0" onClick={() => navigate(`/purchase-orders/${gr.purchaseOrderId}`)}>
                {gr.orderCode}
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Người nhận">{gr.receiverName}</Descriptions.Item>
            <Descriptions.Item label="Ngày nhận">{formatDateTime(gr.receivedAt)}</Descriptions.Item>
            <Descriptions.Item label="Chứng từ NCC">{gr.documentReference || '—'}</Descriptions.Item>
            {gr.confirmedBy && <Descriptions.Item label="Người xác nhận">{gr.confirmerName}</Descriptions.Item>}
            {gr.confirmedAt && <Descriptions.Item label="Ngày xác nhận">{formatDateTime(gr.confirmedAt)}</Descriptions.Item>}
            {gr.note && <Descriptions.Item label="Ghi chú" span={2}>{gr.note}</Descriptions.Item>}
          </Descriptions>
        </Card>

        <Card title="Trạng thái">
          <div className="text-center py-4">
            <StatusTag status={gr.status} labels={GR_STATUS_LABELS} colors={GR_STATUS_COLORS} />
            {gr.status === 'CONFIRMED' && (
              <p className="text-green-600 mt-2 text-sm">✓ Tồn kho đã được cập nhật</p>
            )}
            {gr.status === 'DRAFT' && (
              <p className="text-orange-500 mt-2 text-sm">Chờ xác nhận để cập nhật tồn</p>
            )}
          </div>
        </Card>
      </div>

      <Card title={`Hàng nhận (${gr.items.length} sản phẩm)`}>
        <Table<GoodsReceiptItem>
          columns={itemCols} dataSource={gr.items} rowKey="goodsReceiptItemId"
          pagination={false} size="small" scroll={{ x: 500 }}
        />
      </Card>

      {canConfirm && (
        <div className="flex justify-end mt-4">
          <Popconfirm title="Xác nhận phiếu nhận hàng? Tồn kho sẽ được cập nhật." onConfirm={() => confirmMutation.mutate()}>
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} loading={confirmMutation.isPending}>
              Xác nhận nhận hàng
            </Button>
          </Popconfirm>
        </div>
      )}
    </div>
  )
}

