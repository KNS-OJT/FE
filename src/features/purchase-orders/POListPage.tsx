// ============================================================
// PO List Page — IN08
// ============================================================
import { useState } from 'react'
import { Table, Button } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { PurchaseOrder, PaginatedResponse } from '@/types'
import { mockGetPurchaseOrders } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatDateTime } from '@/utils'
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import { useAuthStore } from '@/auth/store'
import type { ColumnsType } from 'antd/es/table'

export function POListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page],
    queryFn: async () => {
      try {
        const res = await http.get('/purchase-orders', { params: { page, size: 20 } })
        return res.data as PaginatedResponse<PurchaseOrder>
      } catch {
        return await mockGetPurchaseOrders(page, 20)
      }
    },
  })

  const columns: ColumnsType<PurchaseOrder> = [
    { title: 'Mã PO', dataIndex: 'orderCode', key: 'orderCode', width: 160, render: (v: string) => <span className="font-mono text-xs font-medium text-blue-600">{v}</span> },
    { title: 'Mã PR', dataIndex: 'requestCode', key: 'requestCode', width: 160, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName', ellipsis: true },
    { title: 'Người tạo', dataIndex: 'creatorName', key: 'creatorName', width: 160 },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 160,
      render: (v: string) => <StatusTag status={v} labels={PO_STATUS_LABELS} colors={PO_STATUS_COLORS} />,
    },
    { title: 'Ngày đặt', dataIndex: 'orderDate', key: 'orderDate', width: 140, render: (v: string | null) => formatDateTime(v) },
    { title: 'Dự kiến nhận', dataIndex: 'expectedDeliveryDate', key: 'expectedDeliveryDate', width: 140, render: (v: string | null) => formatDateTime(v) },
    {
      title: '', key: 'actions', width: 80, fixed: 'right',
      render: (_: unknown, record: PurchaseOrder) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/purchase-orders/${record.purchaseOrderId}`)}>Xem</Button>
      ),
    },
  ]

  const canCreate = user?.roleName === 'PURCHASING_STAFF' || user?.roleName === 'MANAGER'

  return (
    <div>
      <PageHeader
        title="Đơn đặt hàng"
        subtitle="Quản lý PO — Purchase Orders"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Đơn đặt hàng' }]}
        extra={canCreate ? <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchase-orders/create')}>Tạo PO</Button> : undefined}
      />

      <Table<PurchaseOrder>
        columns={columns} dataSource={data?.content ?? []} rowKey="purchaseOrderId"
        loading={isLoading} scroll={{ x: 1100 }}
        onRow={(record) => ({ onClick: () => navigate(`/purchase-orders/${record.purchaseOrderId}`), className: 'cursor-pointer' })}
        pagination={{ current: data?.page ?? 1, pageSize: data?.size ?? 20, total: data?.totalElements ?? 0, showSizeChanger: false, showTotal: (t) => `Tổng ${t} PO`, onChange: (p) => setPage(p) }}
      />
    </div>
  )
}

