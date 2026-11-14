import { useNavigate } from 'react-router';
import { Button, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { issuesApi, type StockIssue } from '@/api/stockIssues';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert, PendingApiBanner } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { usePaging } from '@/components/usePaging';
import { useAuth } from '@/auth/useAuth';
import { fmtDateTime } from '@/lib/format';

export default function IssueListPage() {
  const nav = useNavigate();
  const { can } = useAuth();
  const { page, size, pagination } = usePaging();
  const list = useQuery({ queryKey: ['issues', { page, size }], queryFn: () => issuesApi.list({ page, size }) });
  return (
    <>
      <PageHeader title="Phiếu xuất kho" subtitle="Danh sách phiếu xuất của bạn" extra={can('issue:create') && <Button type="primary" onClick={() => nav('/issues/new')}>+ Tạo yêu cầu xuất</Button>} />
      <PendingApiBanner text="Backend mới hỗ trợ tạo và sửa phiếu Nháp. Gửi yêu cầu, xác nhận xuất (trừ tồn), từ chối và hủy sẽ bật khi BE có API." />
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<StockIssue>
        className="table-shell"
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        onRow={(r) => ({ onClick: () => nav(`/issues/${r.id}`), style: { cursor: 'pointer' } })}
        locale={{
          emptyText: (
            <EmptyState title="Chưa có phiếu xuất" hint="Yêu cầu cấp hàng từ kho bạn tạo sẽ hiện ở đây." actionLabel={can('issue:create') ? 'Tạo yêu cầu xuất' : undefined} onAction={() => nav('/issues/new')} />
          ),
        }}
        columns={[
          { title: 'Mã phiếu', dataIndex: 'code', render: (v, r) => <a href={`/issues/${r.id}`} onClick={(e) => e.preventDefault()}>{v || `SI #${r.id}`}</a> },
          { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
          { title: 'Số dòng', key: 'n', align: 'right', render: (_, r) => r.items.length },
          { title: 'Trạng thái', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
          { title: 'Ngày tạo', dataIndex: 'createdAt', render: fmtDateTime },
        ]}
      />
    </>
  );
}
