// ============================================================
// Manager Dashboard — IN16 tailored for MANAGER role
// Scope: P1 (Approve PR) & Overall Inventory / Purchasing Supervision
// ============================================================
import { Card, Col, Row, Statistic, Table, Tag, Button, Badge } from 'antd'
import {
  FileProtectOutlined,
  AlertOutlined,
  InboxOutlined,
  DatabaseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { purchaseRequestApi, stockApi, purchaseOrderApi } from '@/api'
import { formatDateTime, formatNumber } from '@/utils'
import { TX_TYPE_COLORS, TX_TYPE_LABELS } from '@/constants'
import type { PurchaseRequest, StockBalance, StockTransaction } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export function ManagerDashboard() {
  const navigate = useNavigate()

  // 1. Pending PRs awaiting approval
  const { data: prData, isLoading: prLoading } = useQuery({
    queryKey: ['manager', 'pending-prs'],
    queryFn: async () => {
      const res = await purchaseRequestApi.getPurchaseRequests(1, 50, 'SUBMITTED')
      return res.content
    },
  })

  // 2. Low stock items
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['manager', 'low-stock'],
    queryFn: async () => {
      return await stockApi.getLowStockProducts()
    },
  })

  // 3. Ongoing POs
  const { data: poData } = useQuery({
    queryKey: ['manager', 'ongoing-pos'],
    queryFn: async () => {
      const res = await purchaseOrderApi.getPurchaseOrders(1, 50)
      return res.content.filter((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED')
    },
  })

  // 4. All stock balances (for total product count)
  const { data: balancesData } = useQuery({
    queryKey: ['manager', 'all-balances'],
    queryFn: async () => {
      return await stockApi.getStockBalances(1, 100)
    },
  })

  // 5. Recent transactions (Ledger)
  const { data: ledgerData } = useQuery({
    queryKey: ['manager', 'recent-transactions'],
    queryFn: async () => {
      return await stockApi.getStockLedger({ page: 1, size: 6 })
    },
  })

  const pendingPRs = prData ?? []
  const lowStockProducts = lowStockData ?? []
  const ongoingPOs = poData ?? []
  const totalProducts = balancesData?.totalElements ?? 13
  const recentTransactions = ledgerData?.content ?? []

  // Columns for Pending PRs
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
      title: 'Người yêu cầu',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 150,
      render: (name: string) => <span className="text-xs font-medium">{name}</span>,
    },
    {
      title: 'Lý do đề xuất',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Số mặt hàng',
      key: 'itemsCount',
      width: 100,
      align: 'center',
      render: (_, r) => <Tag color="blue">{r.items?.length ?? 0} mặt hàng</Tag>,
    },
    {
      title: 'Ngày gửi duyệt',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 130,
      render: (v: string | null) => <span className="text-xs text-gray-500">{v ? formatDateTime(v) : '—'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          danger
          icon={<CheckCircleOutlined />}
          onClick={() => navigate(`/purchase-requests/${r.purchaseRequestId}`)}
        >
          Duyệt ngay
        </Button>
      ),
    },
  ]

  // Columns for Low Stock Products
  const lowStockCols: ColumnsType<StockBalance> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 130,
      render: (v: string) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
    },
    {
      title: 'Tồn hiện tại',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (v: number) => <span className="font-semibold text-red-600">{formatNumber(v)}</span>,
    },
    {
      title: 'Tồn tối thiểu',
      dataIndex: 'minimumStock',
      key: 'minimumStock',
      width: 100,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'Mức thiếu',
      key: 'shortage',
      width: 90,
      align: 'right',
      render: (_, r) => {
        const diff = r.minimumStock - r.quantity
        return <Tag color="red">−{formatNumber(diff)}</Tag>
      },
    },
  ]

  // Columns for Recent Transactions
  const txCols: ColumnsType<StockTransaction> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v: string) => <span className="text-xs text-gray-500">{formatDateTime(v)}</span>,
    },
    {
      title: 'Chứng từ',
      dataIndex: 'sourceCode',
      key: 'sourceCode',
      width: 140,
      render: (v: string) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 110,
      render: (v: string) => (
        <Tag
          icon={v === 'IN' || v === 'ADJUST_IN' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          color={TX_TYPE_COLORS[v]}
        >
          {TX_TYPE_LABELS[v]}
        </Tag>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'Tồn sau GD',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 100,
      align: 'right',
      render: (v: number) => <span className="font-semibold">{formatNumber(v)}</span>,
    },
  ]

  return (
    <div>
      {/* 4 Stat Cards for Manager */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-red-500"
            onClick={() => navigate('/purchase-requests?status=SUBMITTED')}
          >
            <Statistic
              title={
                <span className="flex items-center gap-1 font-medium">
                  PR chờ bạn duyệt
                  {pendingPRs.length > 0 && <Badge count={pendingPRs.length} size="small" />}
                </span>
              }
              value={pendingPRs.length}
              prefix={<FileProtectOutlined className="text-red-500" />}
              valueStyle={{ color: '#cf1322', fontWeight: 700 }}
              suffix={<span className="text-xs text-gray-400 font-normal">yêu cầu cần duyệt</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-orange-500"
            onClick={() => navigate('/stock-alerts')}
          >
            <Statistic
              title="Linh kiện tồn kho thấp"
              value={lowStockProducts.length}
              prefix={<AlertOutlined className="text-orange-500" />}
              valueStyle={{ color: '#d46b08', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">dưới ngưỡng an toàn</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-blue-500"
            onClick={() => navigate('/purchase-orders')}
          >
            <Statistic
              title="Đơn đặt hàng (PO) đang mở"
              value={ongoingPOs.length}
              prefix={<InboxOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">đang theo dõi</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-green-500"
            onClick={() => navigate('/inventory')}
          >
            <Statistic
              title="Tổng danh mục linh kiện"
              value={totalProducts}
              prefix={<DatabaseOutlined className="text-green-500" />}
              valueStyle={{ color: '#389e0d', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">SKU quản lý</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Action Bar */}
      <Card size="small" className="mb-6 bg-red-50/40 border-red-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-red-900">Thao tác phê duyệt & giám sát:</span>
            <Button
              type="primary"
              danger
              icon={<FileProtectOutlined />}
              onClick={() => navigate('/purchase-requests?status=SUBMITTED')}
              className="font-medium"
            >
              Phê duyệt PR chờ xử lý ({pendingPRs.length})
            </Button>
            <Button
              icon={<AlertOutlined />}
              onClick={() => navigate('/stock-alerts')}
            >
              Xem danh sách tồn thấp ({lowStockProducts.length})
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => navigate('/stock-ledger')}
            >
              Tra cứu Sổ kho (Stock Ledger)
            </Button>
            <Button
              icon={<DatabaseOutlined />}
              onClick={() => navigate('/inventory')}
            >
              Báo cáo tồn kho
            </Button>
          </div>
          <Tag color="volcano" className="py-1 px-2">
            BR-08: Người phê duyệt không được tự duyệt PR do chính mình tạo
          </Tag>
        </div>
      </Card>

      {/* Work Area */}
      <Row gutter={[16, 16]}>
        {/* Left Col: Pending PRs for Approval */}
        <Col xs={24} lg={13}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <FileProtectOutlined className="mr-2 text-red-500" />
                  Hàng đợi PR chờ bạn phê duyệt (Action Queue)
                </span>
                <Badge count={pendingPRs.length} style={{ backgroundColor: '#cf1322' }} />
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/purchase-requests?status=SUBMITTED')}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Table<PurchaseRequest>
              columns={prCols}
              dataSource={pendingPRs}
              rowKey="purchaseRequestId"
              size="small"
              loading={prLoading}
              pagination={{ pageSize: 4, size: 'small' }}
              scroll={{ x: 600 }}
              locale={{ emptyText: 'Không có PR nào đang chờ duyệt' }}
            />
          </Card>
        </Col>

        {/* Right Col: Low Stock Alerts */}
        <Col xs={24} lg={11}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <AlertOutlined className="mr-2 text-orange-500" />
                  Linh kiện tồn kho dưới mức an toàn
                </span>
                <span className="text-xs text-red-600 font-medium">
                  {lowStockProducts.length} mặt hàng thiếu
                </span>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/stock-alerts')}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Table<StockBalance>
              columns={lowStockCols}
              dataSource={lowStockProducts}
              rowKey="stockBalanceId"
              size="small"
              loading={lowStockLoading}
              pagination={{ pageSize: 4, size: 'small' }}
              scroll={{ x: 480 }}
            />
          </Card>
        </Col>

        {/* Bottom Full-Width: Recent Stock Audit Trail */}
        <Col xs={24}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <FileTextOutlined className="mr-2 text-blue-500" />
                  Giám sát biến động sổ kho mới nhất (Stock Ledger Audit Trail)
                </span>
                <span className="text-xs text-gray-400">
                  Ghi nhận tự động từ phiếu nhập GR và phiếu xuất SI Confirmed
                </span>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/stock-ledger')}>
                Mở toàn bộ Sổ kho <RightOutlined />
              </Button>
            }
          >
            <Table<StockTransaction>
              columns={txCols}
              dataSource={recentTransactions}
              rowKey="stockTransactionId"
              size="small"
              pagination={false}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
