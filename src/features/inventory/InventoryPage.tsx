// ============================================================
// Inventory Page — IN04, IN05
// ============================================================
import { useState } from 'react'
import { Table, Input, Tag, Progress, InputNumber, Button, message } from 'antd'
import { SearchOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { StockBalance, PaginatedResponse } from '@/types'
import { mockGetStockBalances } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatNumber, formatDateTime } from '@/utils'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function InventoryPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editMinStock, setEditMinStock] = useState<number>(0)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['stock-balances', page, search],
    queryFn: async () => {
      try {
        const res = await http.get('/stock/balances', { params: { page, size: 20, search } })
        return res.data as PaginatedResponse<StockBalance>
      } catch {
        return await mockGetStockBalances(page, 20)
      }
    },
  })

  const updateMinStockMutation = useMutation({
    mutationFn: async ({ productId, minimumStock }: { productId: number; minimumStock: number }) => {
      try {
        const res = await http.put(`/products/${productId}/min-stock`, { minimumStock })
        return res.data
      } catch {
        message.info('(Mock) Cập nhật mức tồn tối thiểu thành công')
        return {}
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      message.success('Cập nhật mức tồn tối thiểu thành công')
      setEditingId(null)
    },
  })

  const columns: ColumnsType<StockBalance> = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs font-medium">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Nhóm hàng', dataIndex: 'categoryName', key: 'categoryName', width: 150 },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 70 },
    {
      title: 'Tồn hiện tại', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right',
      render: (v: number, r: StockBalance) => {
        const isLow = v < r.minimumStock
        return <span className={isLow ? 'text-red-600 font-bold' : 'font-medium'}>{formatNumber(v)}</span>
      },
    },
    {
      title: 'Tồn tối thiểu', key: 'minimumStock', width: 140, align: 'right',
      render: (_: unknown, r: StockBalance) => {
        if (editingId === r.productId) {
          return (
            <div className="flex items-center gap-1">
              <InputNumber size="small" min={0} value={editMinStock}
                onChange={(v) => setEditMinStock(v ?? 0)} style={{ width: 80 }} />
              <Button type="primary" size="small" icon={<SaveOutlined />}
                onClick={() => updateMinStockMutation.mutate({ productId: r.productId, minimumStock: editMinStock })}
                loading={updateMinStockMutation.isPending} />
            </div>
          )
        }
        return (
          <span className="cursor-pointer hover:text-blue-500"
            onClick={() => { setEditingId(r.productId); setEditMinStock(r.minimumStock) }}>
            {formatNumber(r.minimumStock)} <EditOutlined className="text-xs text-gray-400" />
          </span>
        )
      },
    },
    {
      title: 'Trạng thái', key: 'status', width: 140,
      render: (_: unknown, r: StockBalance) => {
        if (r.quantity === 0) return <Tag color="error">Hết hàng</Tag>
        if (r.quantity < r.minimumStock) return <Tag color="warning">Tồn thấp</Tag>
        return <Tag color="success">Bình thường</Tag>
      },
    },
    {
      title: 'Mức tồn', key: 'level', width: 120,
      render: (_: unknown, r: StockBalance) => {
        const pct = r.minimumStock > 0 ? Math.min(Math.round((r.quantity / (r.minimumStock * 2)) * 100), 100) : 100
        let color = '#52c41a'
        if (r.quantity < r.minimumStock) color = '#ff4d4f'
        else if (r.quantity < r.minimumStock * 1.5) color = '#faad14'
        return <Progress percent={pct} size="small" strokeColor={color} showInfo={false} />
      },
    },
    { title: 'Cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 150, render: (v: string) => formatDateTime(v) },
  ]

  return (
    <div>
      <PageHeader title="Tồn kho" subtitle="Theo dõi số lượng tồn kho theo sản phẩm — IN04" />

      <div className="mb-4">
        <Input.Search
          placeholder="Tìm theo SKU hoặc tên sản phẩm..."
          allowClear style={{ width: 350 }}
          prefix={<SearchOutlined />}
          onSearch={(v) => { setSearch(v); setPage(1) }}
          onChange={(e) => { if (!e.target.value) { setSearch(''); setPage(1) } }}
        />
      </div>

      <Table<StockBalance>
        columns={columns} dataSource={data?.content ?? []} rowKey="stockBalanceId"
        loading={isLoading} scroll={{ x: 1100 }}
        pagination={{ current: data?.page ?? 1, pageSize: data?.size ?? 20, total: data?.totalElements ?? 0, showSizeChanger: false, showTotal: (t) => `Tổng ${t} sản phẩm`, onChange: (p) => setPage(p) }}
        rowClassName={(r) => r.quantity < r.minimumStock ? 'bg-red-50' : ''}
      />
    </div>
  )
}

