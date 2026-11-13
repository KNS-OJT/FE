// ============================================================
// Requester Dashboard — IN16 tailored for REQUESTER role
// Scope: P1 (Create PR) & P3 (Request Stock Issue)
// ============================================================
import { Card, Col, Row, Statistic, Table, Tag, Button, Typography, Space, Tooltip } from 'antd'
import {
  ShoppingCartOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { purchaseRequestApi, stockIssueApi } from '@/api'
import { useAuthStore } from '@/auth/store'
import { formatDateTime } from '@/utils'
import { PR_STATUS_COLORS, PR_STATUS_LABELS, SI_STATUS_COLORS, SI_STATUS_LABELS } from '@/constants'
import type { PurchaseRequest, StockIssue } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

export function RequesterDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // 1. Fetch PRs created by this user
  const { data: prData, isLoading: prLoading } = useQuery({
    queryKey: ['requester', 'prs', user?.userId],
    queryFn: async () => {
      const res = await purchaseRequestApi.getPurchaseRequests(1, 50)
      return res.content.filter((pr) => pr.requesterId === user?.userId || user?.username === 'requester1')
    },
  })

  // 2. Fetch Stock Issues created by this user
  const { data: siData, isLoading: siLoading } = useQuery({
    queryKey: ['requester', 'stock-issues', user?.userId],
    queryFn: async () => {
      const res = await stockIssueApi.getStockIssues(1, 50)
      return res.content.filter((si) => si.requestedBy === user?.userId || user?.username === 'requester1')
    },
  })

  const myPRs = prData ?? []
  const mySIs = siData ?? []

  const submittedPRs = myPRs.filter((p) => p.status === 'SUBMITTED')
  const approvedPRs = myPRs.filter((p) => p.status === 'APPROVED')
  const rejectedPRs = myPRs.filter((p) => p.status === 'REJECTED')
  const pendingSIs = mySIs.filter((s) => s.status === 'DRAFT')

  // Table columns for PRs
  const prCols: ColumnsType<PurchaseRequest> = [
    {
      title: 'Mã PR',
      dataIndex: 'requestCode',
      key: 'requestCode',
      width: 140,
      render: (code: string, r) => (
        <a
          onClick={() => navigate(`/purchase-requests/${r.purchaseRequestId}`)}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Lý do đề xuất',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Số mục',
      key: 'itemCount',
      width: 80,
      align: 'center',
      render: (_, r) => <Tag>{r.items?.length ?? 0} món</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, r) => (
        <Space size={4}>
          <Tag color={PR_STATUS_COLORS[status]}>{PR_STATUS_LABELS[status] ?? status}</Tag>
          {status === 'REJECTED' && r.reviewReason && (
            <Tooltip title={`Lý do từ chối: ${r.reviewReason}`}>
              <CloseCircleOutlined className="text-red-500 cursor-pointer" />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v: string) => <span className="text-xs text-gray-500">{formatDateTime(v)}</span>,
    },
    {
      title: '',
      key: 'action',
      width: 70,
      render: (_, r) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/purchase-requests/${r.purchaseRequestId}`)}
        />
      ),
    },
  ]

  // Table columns for Stock Issues
  const siCols: ColumnsType<StockIssue> = [
    {
      title: 'Mã phiếu',
      dataIndex: 'issueCode',
      key: 'issueCode',
      width: 130,
      render: (code: string, r) => (
        <a
          onClick={() => navigate(`/stock-issues/${r.stockIssueId}`)}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Lý do cấp hàng',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Số lượng',
      key: 'itemsCount',
      width: 90,
      align: 'center',
      render: (_, r) => (
        <span className="text-xs">
          {r.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0} linh kiện
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={SI_STATUS_COLORS[status]}>
          {status === 'DRAFT' ? 'Chờ thủ kho xuất' : SI_STATUS_LABELS[status] ?? status}
        </Tag>
      ),
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 130,
      render: (v: string) => <span className="text-xs text-gray-500">{formatDateTime(v)}</span>,
    },
  ]

  return (
    <div>
      {/* 4 Stat Cards for Requester */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer border-t-2 border-blue-500" onClick={() => navigate('/purchase-requests')}>
            <Statistic
              title="Đề nghị mua sắm (PR) của tôi"
              value={myPRs.length}
              prefix={<ShoppingCartOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">đơn</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer border-t-2 border-orange-500" onClick={() => navigate('/purchase-requests?status=SUBMITTED')}>
            <Statistic
              title="PR đang chờ quản lý duyệt"
              value={submittedPRs.length}
              prefix={<ClockCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">chờ duyệt</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer border-t-2 border-green-500" onClick={() => navigate('/purchase-requests?status=APPROVED')}>
            <Statistic
              title="PR đã được phê duyệt"
              value={approvedPRs.length}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">sẵn sàng mua</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer border-t-2 border-purple-500" onClick={() => navigate('/stock-issues')}>
            <Statistic
              title="Yêu cầu xuất linh kiện từ kho"
              value={mySIs.length}
              prefix={<ExportOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">{pendingSIs.length > 0 ? `(${pendingSIs.length} chờ xử lý)` : 'phiếu'}</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Action Bar */}
      <Card size="small" className="mb-6 bg-blue-50/40 border-blue-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-900">Thao tác nhanh cho Requester:</span>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/purchase-requests/create')}
              className="font-medium"
            >
              Tạo đề nghị mua hàng (PR) mới
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => navigate('/stock-issues/create')}
            >
              Tạo yêu cầu cấp linh kiện (Stock Issue)
            </Button>
            <Button
              icon={<AppstoreOutlined />}
              onClick={() => navigate('/products')}
            >
              Tra cứu linh kiện & danh mục
            </Button>
          </div>
          {rejectedPRs.length > 0 && (
            <Tag color="error" className="py-1 px-2">
              Có {rejectedPRs.length} PR bị từ chối cần bạn điều chỉnh
            </Tag>
          )}
        </div>
      </Card>

      {/* Work Area: 2 Columns */}
      <Row gutter={[16, 16]}>
        {/* Left Col: My Purchase Requests */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <ShoppingCartOutlined className="mr-2 text-blue-500" />
                  Đề nghị mua sắm (PR) gần đây của bạn
                </span>
                <span className="text-xs font-normal text-gray-400">
                  {myPRs.length} đề nghị
                </span>
              </div>
            }
            extra={<Button type="link" size="small" onClick={() => navigate('/purchase-requests')}>Xem tất cả PR</Button>}
          >
            <Table<PurchaseRequest>
              columns={prCols}
              dataSource={myPRs}
              rowKey="purchaseRequestId"
              size="small"
              loading={prLoading}
              pagination={{ pageSize: 5, size: 'small' }}
              scroll={{ x: 550 }}
            />
          </Card>
        </Col>

        {/* Right Col: Stock Issues & Guide */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" size={16} className="w-full">
            {/* My Stock Issues */}
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">
                    <ExportOutlined className="mr-2 text-purple-500" />
                    Yêu cầu xuất linh kiện của bạn
                  </span>
                  <span className="text-xs font-normal text-gray-400">
                    {mySIs.length} phiếu
                  </span>
                </div>
              }
              extra={<Button type="link" size="small" onClick={() => navigate('/stock-issues')}>Xem tất cả</Button>}
            >
              <Table<StockIssue>
                columns={siCols}
                dataSource={mySIs}
                rowKey="stockIssueId"
                size="small"
                loading={siLoading}
                pagination={{ pageSize: 4, size: 'small' }}
                scroll={{ x: 480 }}
              />
            </Card>

            {/* Requester Guidelines */}
            <Card size="small" className="bg-gray-50 border-gray-200">
              <div className="flex items-start gap-2.5">
                <InfoCircleOutlined className="text-blue-500 text-base mt-0.5 shrink-0" />
                <div className="text-xs space-y-1.5 text-gray-600">
                  <Text strong className="text-gray-800 block text-xs">
                    Quy tắc vận hành dành cho Requester (P03):
                  </Text>
                  <p className="m-0">
                    • <strong>Đề nghị mua sắm (PR):</strong> Lập khi linh kiện trong kho chạm ngưỡng tồn tối thiểu hoặc dự án mới cần thêm vật tư.
                  </p>
                  <p className="m-0">
                    • <strong>Phân chia quyền hạn (BR-08):</strong> Bạn không thể tự duyệt PR do mình lập, yêu cầu sẽ được chuyển đến Manager xem xét.
                  </p>
                  <p className="m-0">
                    • <strong>Yêu cầu xuất kho (SI):</strong> Phải có lý do cụ thể. Thủ kho sẽ kiểm tra tồn khả dụng trước khi xác nhận bàn giao linh kiện.
                  </p>
                </div>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
