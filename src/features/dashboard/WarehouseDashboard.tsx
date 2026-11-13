// ============================================================
// Warehouse Dashboard — IN16 tailored for WAREHOUSE_STAFF role
// Scope: P2 (Goods Receipt Stock-In), P3 (Stock Issue Confirmation Stock-Out) & P4 (Inventory / Ledger)
// ============================================================
import { Card, Col, Row, Statistic, Table, Tag, Button, Badge } from 'antd'
import {
  InboxOutlined,
  ExportOutlined,
  AlertOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { purchaseOrderApi, stockIssueApi, stockApi } from '@/api'
import { formatDateTime, formatDate, formatNumber } from '@/utils'
import { TX_TYPE_COLORS, TX_TYPE_LABELS, PO_STATUS_COLORS, PO_STATUS_LABELS } from '@/constants'
import type { PurchaseOrder, StockIssue, StockTransaction } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export function WarehouseDashboard() {
  const navigate = useNavigate()

  // 1. POs waiting to be received (ORDERED or PARTIALLY_RECEIVED)
  const { data: posData, isLoading: posLoading } = useQuery({
    queryKey: ['warehouse', 'pos-to-receive'],
    queryFn: async () => {
      const res = await purchaseOrderApi.getPurchaseOrders(1, 50)
      return res.content.filter((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED')
    },
  })

  // 2. Stock issues awaiting confirmation (DRAFT)
  const { data: siData, isLoading: siLoading } = useQuery({
    queryKey: ['warehouse', 'pending-issues'],
    queryFn: async () => {
      const res = await stockIssueApi.getStockIssues(1, 50, 'DRAFT')
      return res.content.filter((si) => si.status === 'DRAFT')
    },
  })

  // 3. Low stock products
  const { data: lowStockData } = useQuery({
    queryKey: ['warehouse', 'low-stock'],
    queryFn: async () => {
      return await stockApi.getLowStockProducts()
    },
  })

  // 4. Recent transactions (Ledger)
  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ['warehouse', 'recent-ledger'],
    queryFn: async () => {
      return await stockApi.getStockLedger({ page: 1, size: 6 })
    },
  })

  const pendingPOs = posData ?? []
  const pendingSIs = siData ?? []
  const lowStockProducts = lowStockData ?? []
  const recentTransactions = ledgerData?.content ?? []

  // Columns for Pending Stock Issues (Stock-Out Queue)
  const siCols: ColumnsType<StockIssue> = [
    {
      title: 'Mã SI',
      dataIndex: 'issueCode',
      key: 'issueCode',
      width: 140,
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
      title: 'Người yêu cầu',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 140,
      render: (v: string) => <span className="text-xs font-medium">{v}</span>,
    },
    {
      title: 'Lý do cấp hàng',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Số mặt hàng',
      key: 'itemsCount',
      width: 90,
      align: 'center',
      render: (_, r) => <Tag color="purple">{r.items?.length ?? 0} linh kiện</Tag>,
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 130,
      render: (v: string) => <span className="text-xs text-gray-500">{formatDateTime(v)}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<ExportOutlined />}
          onClick={() => navigate(`/stock-issues/${r.stockIssueId}`)}
          className="bg-purple-600 hover:bg-purple-700 border-purple-600"
        >
          Xác nhận xuất
        </Button>
      ),
    },
  ]

  // Columns for POs waiting to be received (Stock-In Queue)
  const poCols: ColumnsType<PurchaseOrder> = [
    {
      title: 'Mã PO',
      dataIndex: 'orderCode',
      key: 'orderCode',
      width: 140,
      render: (code: string, r) => (
        <a
          onClick={() => navigate(`/purchase-orders/${r.purchaseOrderId}`)}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      ellipsis: true,
    },
    {
      title: 'Hẹn giao',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      width: 110,
      render: (v: string | null) => (v ? <span className="text-xs">{formatDate(v)}</span> : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={PO_STATUS_COLORS[status]}>{PO_STATUS_LABELS[status] ?? status}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => navigate(`/goods-receipts/create?poId=${r.purchaseOrderId}`)}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          Lập phiếu nhận
        </Button>
      ),
    },
  ]

  // Columns for Ledger
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
      {/* 4 Stat Cards for Warehouse */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-green-500"
            onClick={() => navigate('/purchase-orders')}
          >
            <Statistic
              title={
                <span className="flex items-center gap-1 font-medium">
                  Đơn PO chờ nhận hàng (Stock-In)
                  {pendingPOs.length > 0 && <Badge count={pendingPOs.length} style={{ backgroundColor: '#389e0d' }} size="small" />}
                </span>
              }
              value={pendingPOs.length}
              prefix={<InboxOutlined className="text-green-600" />}
              valueStyle={{ color: '#389e0d', fontWeight: 700 }}
              suffix={<span className="text-xs text-gray-400 font-normal">đơn chờ nhập</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-purple-500"
            onClick={() => navigate('/stock-issues')}
          >
            <Statistic
              title={
                <span className="flex items-center gap-1 font-medium">
                  Phiếu xuất chờ xác nhận (Stock-Out)
                  {pendingSIs.length > 0 && <Badge count={pendingSIs.length} style={{ backgroundColor: '#722ed1' }} size="small" />}
                </span>
              }
              value={pendingSIs.length}
              prefix={<ExportOutlined className="text-purple-600" />}
              valueStyle={{ color: '#722ed1', fontWeight: 700 }}
              suffix={<span className="text-xs text-gray-400 font-normal">chờ trừ tồn</span>}
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
              suffix={<span className="text-xs text-gray-400 font-normal">cần bổ sung</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-blue-500"
            onClick={() => navigate('/stock-ledger')}
          >
            <Statistic
              title="Giao dịch kho gần nhất"
              value={recentTransactions.length}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">thẻ kho lưu vết</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Action Bar */}
      <Card size="small" className="mb-6 bg-green-50/40 border-green-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-950">Thao tác kho & nhập xuất:</span>
            <Button
              type="primary"
              icon={<InboxOutlined />}
              onClick={() => navigate('/goods-receipts/create')}
              className="bg-green-600 hover:bg-green-700 border-green-600 font-medium"
            >
              Lập Phiếu nhận hàng (Stock-In)
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => navigate('/stock-issues')}
            >
              Xác nhận Xuất kho (Stock-Out)
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => navigate('/stock-ledger')}
            >
              Tra cứu Sổ kho (Stock Ledger)
            </Button>
            <Button
              icon={<AlertOutlined />}
              onClick={() => navigate('/stock-alerts')}
            >
              Cảnh báo tồn kho
            </Button>
          </div>
          <Tag color="green" className="py-1 px-2">
            BR-04: Chỉ chứng từ Confirmed mới làm thay đổi số lượng tồn kho và ghi Ledger
          </Tag>
        </div>
      </Card>

      {/* Work Area */}
      <Row gutter={[16, 16]}>
        {/* Left Col: Stock Issues awaiting confirmation */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <ExportOutlined className="mr-2 text-purple-600" />
                  Yêu cầu xuất kho chờ thủ kho xác nhận (Action Queue)
                </span>
                <Badge count={pendingSIs.length} style={{ backgroundColor: '#722ed1' }} />
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/stock-issues?status=DRAFT')}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Table<StockIssue>
              columns={siCols}
              dataSource={pendingSIs}
              rowKey="stockIssueId"
              size="small"
              loading={siLoading}
              pagination={{ pageSize: 4, size: 'small' }}
              scroll={{ x: 600 }}
              locale={{ emptyText: 'Không có yêu cầu xuất kho nào đang chờ xử lý' }}
            />
          </Card>
        </Col>

        {/* Right Col: POs ready for Goods Receipt */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <InboxOutlined className="mr-2 text-green-600" />
                  Đơn PO chờ nhập hàng thực tế về kho (Action Queue)
                </span>
                <Badge count={pendingPOs.length} style={{ backgroundColor: '#389e0d' }} />
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/purchase-orders')}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Table<PurchaseOrder>
              columns={poCols}
              dataSource={pendingPOs}
              rowKey="purchaseOrderId"
              size="small"
              loading={posLoading}
              pagination={{ pageSize: 4, size: 'small' }}
              scroll={{ x: 550 }}
              locale={{ emptyText: 'Không có đơn PO nào đang chờ nhận hàng' }}
            />
          </Card>
        </Col>

        {/* Bottom: Stock Ledger Mini Audit Trail */}
        <Col xs={24}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <FileTextOutlined className="mr-2 text-blue-500" />
                  Nhật ký giao dịch thẻ kho mới nhất (Stock Ledger)
                </span>
                <span className="text-xs text-gray-400">
                  Không thể chỉnh sửa hay xóa (BR-07) – Truy vết kiểm toán tuyệt đối
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
              loading={ledgerLoading}
              pagination={false}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
