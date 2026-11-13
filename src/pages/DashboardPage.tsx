import { useNavigate } from 'react-router';
import { Flex, Skeleton, Typography } from 'antd';
import {
  AlertOutlined, CheckSquareOutlined, DatabaseOutlined, ExportOutlined, FileAddOutlined, FileDoneOutlined,
  HistoryOutlined, ImportOutlined, ShopOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getDashboard, type DashboardStats } from '@/api/dashboard';
import { ErrorAlert } from '@/components/States';
import { useAuth } from '@/auth/useAuth';
import type { Permission } from '@/auth/permissions';
import type { Role } from '@/auth/roles';
import { env } from '@/config/env';
import { palette } from '@/theme';

type Metric = { key: keyof DashboardStats; label: string; to: string; perm: Permission; tone?: 'danger' | 'waiting' };
const METRICS: Metric[] = [
  { key: 'prWaitingApproval', label: 'Đề nghị mua chờ duyệt', to: '/pr?status=SUBMITTED', perm: 'pr:view', tone: 'waiting' },
  { key: 'poWaitingReceipt', label: 'Đơn hàng chờ nhận', to: '/po?status=ORDERED', perm: 'po:view' },
  { key: 'issuesWaitingConfirm', label: 'Phiếu xuất chờ xác nhận', to: '/issues', perm: 'issue:view', tone: 'waiting' },
  { key: 'lowStockProducts', label: 'Sản phẩm dưới mức tối thiểu', to: '/stock/low', perm: 'stock:low', tone: 'danger' },
  { key: 'activeProducts', label: 'Sản phẩm đang kinh doanh', to: '/products', perm: 'product:view' },
];

const TINTS = [
  { bg: '#E1EBF3', fg: palette.primary },
  { bg: '#DCEBF2', fg: '#2E5E80' },
  { bg: '#F3E3D0', fg: '#7A4E1D' },
  { bg: '#ECECFF', fg: '#4C4FC0' },
];
type Shortcut = { title: string; desc: string; to: string; icon: React.ReactNode };
const SHORTCUTS: Record<Role, Shortcut[]> = {
  REQUESTER: [
    { title: 'Tạo đề nghị mua', desc: 'Khi cần mua hoặc bổ sung hàng', to: '/pr/new', icon: <FileAddOutlined /> },
    { title: 'Yêu cầu xuất kho', desc: 'Xin cấp hàng từ kho', to: '/issues/new', icon: <ExportOutlined /> },
    { title: 'Đề nghị của tôi', desc: 'Theo dõi trạng thái duyệt', to: '/pr', icon: <FileDoneOutlined /> },
  ],
  WAREHOUSE_STAFF: [
    { title: 'Nhận hàng theo PO', desc: 'Lập và xác nhận phiếu nhập', to: env.demoMockMissing ? '/receipts/new' : '/po', icon: <ImportOutlined /> },
    { title: 'Hàng tồn thấp', desc: 'Sản phẩm cần bổ sung', to: '/stock/low', icon: <AlertOutlined /> },
    { title: 'Tồn kho', desc: 'Số lượng hiện có', to: '/stock', icon: <DatabaseOutlined /> },
    { title: 'Sổ kho', desc: 'Lịch sử nhập, xuất, điều chỉnh', to: '/ledger', icon: <HistoryOutlined /> },
  ],
  PURCHASING_STAFF: [
    { title: 'Tạo đơn đặt hàng', desc: 'Từ đề nghị mua đã duyệt', to: '/po/new', icon: <FileAddOutlined /> },
    { title: 'Hàng tồn thấp', desc: 'Cân nhắc đề nghị mua', to: '/stock/low', icon: <AlertOutlined /> },
    { title: 'Nhà cung cấp', desc: 'Hồ sơ và liên hệ', to: '/suppliers', icon: <ShopOutlined /> },
  ],
  MANAGER: [
    { title: 'Duyệt đề nghị mua', desc: 'Các đề nghị đang chờ bạn', to: '/pr?status=SUBMITTED', icon: <CheckSquareOutlined /> },
    { title: 'Tồn kho', desc: 'Giám sát số lượng hiện có', to: '/stock', icon: <DatabaseOutlined /> },
    { title: 'Sổ kho', desc: 'Toàn bộ giao dịch kho', to: '/ledger', icon: <HistoryOutlined /> },
    { title: 'Người dùng', desc: 'Tài khoản và vai trò', to: '/users', icon: <TeamOutlined /> },
  ],
};

const greet = () => {
  const h = new Date().getHours();
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
};

export default function DashboardPage() {
  const nav = useNavigate();
  const { can, user } = useAuth();
  const q = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const metrics = METRICS.filter((m) => user?.role === 'MANAGER' || can(m.perm));
  const firstName = user?.fullName.trim().split(/\s+/).pop() ?? '';

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Typography.Text type="secondary">{dayjs().format('dddd, DD/MM/YYYY').replace(/^./, (c) => c.toUpperCase())}</Typography.Text>
        <Typography.Title level={2} style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em' }}>
          {greet()}, {firstName}
        </Typography.Title>
      </div>

      {q.error && <ErrorAlert error={q.error} onRetry={() => q.refetch()} />}

      <section aria-label="Chỉ số" style={{ background: '#fff', border: `1px solid ${palette.line}`, borderRadius: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', overflow: 'hidden', marginBottom: 32 }}>
        {metrics.map((m, i) => {
          const v = q.data?.[m.key] ?? 0;
          const hot = v > 0 && m.tone;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => nav(m.to)}
              className="plain-btn metric"
              style={{
                padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6,
                borderLeft: i ? `1px solid ${palette.lineSoft}` : 'none',
                background: hot === 'waiting' ? palette.sandSoft : undefined,
              }}
            >
              <span style={{ color: palette.muted, fontSize: 13 }}>{m.label}</span>
              {q.isLoading ? <Skeleton.Input active size="small" style={{ width: 48 }} /> : (
                <span className="num" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: hot === 'danger' ? palette.danger : palette.ink }}>{v}</span>
              )}
            </button>
          );
        })}
      </section>

      <Typography.Title level={4} style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Việc thường làm</Typography.Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {(user ? SHORTCUTS[user.role] : []).map((s, i) => {
          const t = TINTS[i % TINTS.length];
          return (
            <button key={s.title} type="button" onClick={() => nav(s.to)} className="plain-btn tile">
              <span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 10, background: t.bg, color: t.fg, display: 'grid', placeItems: 'center', fontSize: 19, flex: 'none' }}>{s.icon}</span>
              <Flex vertical gap={2}>
                <span style={{ fontWeight: 600 }}>{s.title}</span>
                <span style={{ color: palette.muted, fontSize: 13 }}>{s.desc}</span>
              </Flex>
            </button>
          );
        })}
      </div>
    </>
  );
}
