// ============================================================
// PR List Page — IN06
// ============================================================
import { useState } from 'react'
import { Table, Button, Tabs, Space } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import type { PurchaseRequest } from '@/types'
import { purchaseRequestApi } from '@/api'
import { formatDateTime } from '@/utils'
import { PR_STATUS_LABELS, PR_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import { useAuthStore } from '@/auth/store'
import type { ColumnsType } from 'antd/es/table'

const STATUS_TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUBMITTED', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'CANCELED', label: 'Đã hủy' },
]

export function PRListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') ?? ''
  const [page, setPage] = useState(1)
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-requests', page, statusFilter],
    queryFn: () => purchaseRequestApi.getPurchaseRequests(page, 20, statusFilter || undefined),
  })

  const columns: ColumnsType<PurchaseRequest> = [
    {
      title: 'Mã PR', dataIndex: 'requestCode', key: 'requestCode', width: 160,
      render: (v: string) => <span className="font-mono text-xs font-medium text-blue-600">{v}</span>,
    },
    { title: 'Người yêu cầu', dataIndex: 'requesterName', key: 'requesterName', width: 180 },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason', ellipsis: true, render: (v: string | null) => v || '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => <StatusTag status={v} labels={PR_STATUS_LABELS} colors={PR_STATUS_COLORS} />,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (v: string) => formatDateTime(v) },
    { title: 'Ngày gửi', dataIndex: 'submittedAt', key: 'submittedAt', width: 150, render: (v: string | null) => formatDateTime(v) },
    { title: 'Người duyệt', dataIndex: 'reviewerName', key: 'reviewerName', width: 160, render: (v: string | null) => v || '—' },
    {
      title: 'PO', dataIndex: 'hasPO', key: 'hasPO', width: 70,
      render: (v: boolean) => v ? <span className="text-green-600">✓</span> : '—',
    },
    {
      title: '', key: 'actions', width: 80, fixed: 'right',
      render: (_: unknown, record: PurchaseRequest) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/purchase-requests/${record.purchaseRequestId}`)}>
          Xem
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Đề nghị mua hàng"
        subtitle="Quản lý PR — Purchase Requests"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Đề nghị mua hàng' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchase-requests/create')}>
            Tạo PR
          </Button>
        }
      />

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => { setSearchParams(key ? { status: key } : {}); setPage(1) }}
        items={STATUS_TABS.map((tab) => {
          const count = tab.key ? data?.content?.filter(pr => pr.status === tab.key).length : data?.totalElements
          return { key: tab.key, label: <Space>{tab.label}{count !== undefined && <span className="text-gray-400 text-xs">({count})</span>}</Space> }
        })}
        className="mb-4"
      />

      <Table<PurchaseRequest>
        columns={columns}
        dataSource={data?.content ?? []}
        rowKey="purchaseRequestId"
        loading={isLoading}
        scroll={{ x: 1100 }}
        onRow={(record) => ({
          onClick: () => navigate(`/purchase-requests/${record.purchaseRequestId}`),
          className: 'cursor-pointer',
        })}
        pagination={{
          current: data?.page ?? 1,
          pageSize: data?.size ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: false,
          showTotal: (t) => `Tổng ${t} PR`,
          onChange: (p) => setPage(p),
        }}
      />

      {user?.roleName === 'MANAGER' && statusFilter === '' && (
        <div className="mt-2 text-sm text-gray-500">
          💡 Tip: Chuyển tab "Chờ duyệt" để xem các PR cần bạn phê duyệt
        </div>
      )}
    </div>
  )
}

