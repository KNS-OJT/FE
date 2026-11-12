// ============================================================
// Stock Ledger Page — IN13
// ============================================================
import { useState } from 'react'
import { Table, Tag, Select, Input, Card } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { StockTransaction, PaginatedResponse } from '@/types'
import { mockGetStockTransactions } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatDateTime, formatNumber } from '@/utils'
import { TX_TYPE_LABELS, TX_TYPE_COLORS } from '@/constants'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function StockLedgerPage() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-ledger', page, typeFilter, search],
    queryFn: async () => {
      try {
        const res = await http.get('/stock/ledger', { params: { page, size: 20, type: typeFilter, search } })
        return res.data as PaginatedResponse<StockTransaction>
      } catch {
        return await mockGetStockTransactions(page, 20)
      }
    },
  })

  const columns: ColumnsType<StockTransaction> = [
    { title: 'ID', dataIndex: 'stockTransactionId', key: 'stockTransactionId', width: 60 },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (v: string) => formatDateTime(v) },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    {
      title: 'Loại', dataIndex: 'transactionType', key: 'transactionType', width: 130,
      render: (v: string) => (
        <Tag icon={v === 'IN' || v === 'ADJUST_IN' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          color={TX_TYPE_COLORS[v]}>
          {TX_TYPE_LABELS[v]}
        </Tag>
      ),
    },
    {
      title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 110, align: 'right',
      render: (v: number, r: StockTransaction) => {
        const isIn = r.transactionType === 'IN' || r.transactionType === 'ADJUST_IN'
        return <span className={isIn ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {isIn ? '+' : '−'}{formatNumber(v)}
        </span>
      },
    },
    {
      title: 'Tồn sau GD', dataIndex: 'balanceAfter', key: 'balanceAfter', width: 110, align: 'right',
      render: (v: number) => <span className="font-medium">{formatNumber(v)}</span>,
    },
    { title: 'Chứng từ', dataIndex: 'sourceCode', key: 'sourceCode', width: 160, render: (v: string) => <span className="font-mono text-xs text-blue-600">{v}</span> },
    { title: 'Người thực hiện', dataIndex: 'creatorName', key: 'creatorName', width: 160 },
  ]

  return (
    <div>
      <PageHeader
        title="Sổ kho (Stock Ledger)"
        subtitle="Lịch sử giao dịch nhập/xuất/điều chỉnh — Chỉ đọc, không sửa/xóa (BR-07)"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Sổ kho' }]}
      />

      {/* Filters */}
      <Card className="mb-4" size="small">
        <div className="flex flex-wrap gap-3">
          <Input.Search
            placeholder="Tìm theo SKU hoặc tên SP..."
            allowClear style={{ width: 280 }}
            prefix={<SearchOutlined />}
            onSearch={(v) => { setSearch(v); setPage(1) }}
            onChange={(e) => { if (!e.target.value) { setSearch(''); setPage(1) } }}
          />
          <Select placeholder="Loại giao dịch" allowClear style={{ width: 160 }}
            value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1) }}
            options={[
              { value: 'IN', label: '📥 Nhập kho' },
              { value: 'OUT', label: '📤 Xuất kho' },
              { value: 'ADJUST_IN', label: '🔼 Điều chỉnh tăng' },
              { value: 'ADJUST_OUT', label: '🔽 Điều chỉnh giảm' },
            ]}
          />
        </div>
      </Card>

      <Table<StockTransaction>
        columns={columns}
        dataSource={data?.content ?? []}
        rowKey="stockTransactionId"
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={{
          current: data?.page ?? 1,
          pageSize: data?.size ?? 20,
          total: data?.totalElements ?? 0,
          showSizeChanger: false,
          showTotal: (t) => `Tổng ${t} giao dịch`,
          onChange: (p) => setPage(p),
        }}
      />

      <div className="mt-3 text-xs text-gray-400">
        ℹ️ Stock Ledger chỉ được ghi thêm, không sửa/xóa (BR-07). Hash chain SHA-256 bảo vệ tính toàn vẹn (IA-IN06).
      </div>
    </div>
  )
}

