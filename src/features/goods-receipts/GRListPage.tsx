// ============================================================
// Goods Receipt List Page — IN09, IN10
// ============================================================
import { useState } from 'react'
import { Table, Button } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { GoodsReceipt } from '@/types'
import { goodsReceiptApi } from '@/api'
import { formatDateTime } from '@/utils'
import { GR_STATUS_LABELS, GR_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function GRListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['goods-receipts', page],
    queryFn: () => goodsReceiptApi.getGoodsReceipts(page, 20),
  })

  const columns: ColumnsType<GoodsReceipt> = [
    { title: 'Mã phiếu', dataIndex: 'receiptCode', key: 'receiptCode', width: 160, render: (v: string) => <span className="font-mono text-xs font-medium text-blue-600">{v}</span> },
    { title: 'Mã PO', dataIndex: 'orderCode', key: 'orderCode', width: 160, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Người nhận', dataIndex: 'receiverName', key: 'receiverName', width: 160 },
    { title: 'Chứng từ NCC', dataIndex: 'documentReference', key: 'documentReference', width: 180, ellipsis: true, render: (v: string | null) => v || '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => <StatusTag status={v} labels={GR_STATUS_LABELS} colors={GR_STATUS_COLORS} />,
    },
    { title: 'Ngày nhận', dataIndex: 'receivedAt', key: 'receivedAt', width: 150, render: (v: string | null) => formatDateTime(v) },
    { title: 'Ngày xác nhận', dataIndex: 'confirmedAt', key: 'confirmedAt', width: 150, render: (v: string | null) => formatDateTime(v) },
    {
      title: '', key: 'actions', width: 80, fixed: 'right',
      render: (_: unknown, record: GoodsReceipt) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/goods-receipts/${record.goodsReceiptId}`)}>Xem</Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Nhập kho"
        subtitle="Quản lý phiếu nhận hàng — Goods Receipts"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Nhập kho' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/goods-receipts/create')}>Lập phiếu nhận</Button>}
      />

      <Table<GoodsReceipt>
        columns={columns} dataSource={data?.content ?? []} rowKey="goodsReceiptId"
        loading={isLoading} scroll={{ x: 1100 }}
        onRow={(record) => ({ onClick: () => navigate(`/goods-receipts/${record.goodsReceiptId}`), className: 'cursor-pointer' })}
        pagination={{ current: data?.page ?? 1, pageSize: data?.size ?? 20, total: data?.totalElements ?? 0, showSizeChanger: false, showTotal: (t) => `Tổng ${t} phiếu`, onChange: (p) => setPage(p) }}
      />
    </div>
  )
}

