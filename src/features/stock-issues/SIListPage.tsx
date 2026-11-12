// ============================================================
// Stock Issue List Page — IN11
// ============================================================
import { useState } from 'react'
import { Table, Button, Tabs } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { StockIssue, PaginatedResponse } from '@/types'
import { mockGetStockIssues } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatDateTime } from '@/utils'
import { SI_STATUS_LABELS, SI_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

const STATUS_TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'DRAFT', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'CANCELED', label: 'Đã hủy' },
]

export function SIListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-issues', page, statusFilter],
    queryFn: async () => {
      try {
        const res = await http.get('/stock-issues', { params: { page, size: 20, status: statusFilter || undefined } })
        return res.data as PaginatedResponse<StockIssue>
      } catch {
        return await mockGetStockIssues(page, 20)
      }
    },
  })

  const columns: ColumnsType<StockIssue> = [
    { title: 'Mã phiếu', dataIndex: 'issueCode', key: 'issueCode', width: 160, render: (v: string) => <span className="font-mono text-xs font-medium text-blue-600">{v}</span> },
    { title: 'Người yêu cầu', dataIndex: 'requesterName', key: 'requesterName', width: 180 },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason', ellipsis: true, render: (v: string | null) => v || '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => <StatusTag status={v} labels={SI_STATUS_LABELS} colors={SI_STATUS_COLORS} />,
    },
    { title: 'Ngày yêu cầu', dataIndex: 'requestedAt', key: 'requestedAt', width: 150, render: (v: string | null) => formatDateTime(v) },
    { title: 'Người xác nhận', dataIndex: 'confirmerName', key: 'confirmerName', width: 160, render: (v: string | null) => v || '—' },
    { title: 'Ngày xác nhận', dataIndex: 'confirmedAt', key: 'confirmedAt', width: 150, render: (v: string | null) => formatDateTime(v) },
    {
      title: '', key: 'actions', width: 80, fixed: 'right',
      render: (_: unknown, record: StockIssue) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/stock-issues/${record.stockIssueId}`)}>Xem</Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Xuất kho"
        subtitle="Quản lý yêu cầu xuất kho — Stock Issues"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Xuất kho' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/stock-issues/create')}>Tạo yêu cầu xuất</Button>}
      />

      <Tabs activeKey={statusFilter}
        onChange={(key) => { setStatusFilter(key); setPage(1) }}
        items={STATUS_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
        className="mb-4" />

      <Table<StockIssue>
        columns={columns} dataSource={data?.content ?? []} rowKey="stockIssueId"
        loading={isLoading} scroll={{ x: 1100 }}
        onRow={(record) => ({ onClick: () => navigate(`/stock-issues/${record.stockIssueId}`), className: 'cursor-pointer' })}
        pagination={{ current: data?.page ?? 1, pageSize: data?.size ?? 20, total: data?.totalElements ?? 0, showSizeChanger: false, showTotal: (t) => `Tổng ${t} phiếu`, onChange: (p) => setPage(p) }}
      />
    </div>
  )
}

