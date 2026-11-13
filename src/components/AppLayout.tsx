import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Button, Flex, Grid, Layout, Menu, Typography, type MenuProps } from 'antd';
import {
  AlertOutlined, AppstoreOutlined, BarChartOutlined, DatabaseOutlined, ExportOutlined, FileDoneOutlined,
  FileTextOutlined, HistoryOutlined, ImportOutlined, LogoutOutlined, ShopOutlined, TagsOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { ROLE_LABELS } from '@/auth/roles';
import { useAuth } from '@/auth/useAuth';
import type { Permission } from '@/auth/permissions';
import { logout } from '@/api/auth';
import { palette } from '@/theme';
import { BrandMark } from './BrandMark';

type Leaf = { key: string; label: string; icon: React.ReactNode; perm: Permission };
type Group = { group: string; items: Leaf[] };

const NAV: (Leaf | Group)[] = [
  { key: '/', label: 'Tổng quan', icon: <BarChartOutlined />, perm: 'dashboard:view' },
  { group: 'Mua hàng', items: [
    { key: '/pr', label: 'Đề nghị mua', icon: <FileTextOutlined />, perm: 'pr:view' },
    { key: '/po', label: 'Đơn đặt hàng', icon: <FileDoneOutlined />, perm: 'po:view' },
  ] },
  { group: 'Nhập / Xuất', items: [
    { key: '/receipts', label: 'Phiếu nhập kho', icon: <ImportOutlined />, perm: 'gr:view' },
    { key: '/issues', label: 'Phiếu xuất kho', icon: <ExportOutlined />, perm: 'issue:view' },
  ] },
  { group: 'Kho', items: [
    { key: '/stock', label: 'Tồn kho', icon: <DatabaseOutlined />, perm: 'stock:view' },
    { key: '/stock/low', label: 'Cảnh báo tồn thấp', icon: <AlertOutlined />, perm: 'stock:low' },
    { key: '/ledger', label: 'Sổ kho', icon: <HistoryOutlined />, perm: 'ledger:view' },
  ] },
  { group: 'Danh mục', items: [
    { key: '/products', label: 'Sản phẩm', icon: <AppstoreOutlined />, perm: 'product:view' },
    { key: '/categories', label: 'Nhóm hàng', icon: <TagsOutlined />, perm: 'category:view' },
    { key: '/suppliers', label: 'Nhà cung cấp', icon: <ShopOutlined />, perm: 'supplier:view' },
  ] },
  { group: 'Quản trị', items: [{ key: '/users', label: 'Người dùng', icon: <TeamOutlined />, perm: 'user:manage' }] },
];
const LEAVES = NAV.flatMap((n) => ('group' in n ? n.items : [n])).map((l) => l.key);

const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

export function AppLayout() {
  const { user, can } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const screens = Grid.useBreakpoint();

  const items = useMemo<MenuProps['items']>(
    () =>
      NAV.flatMap((n): NonNullable<MenuProps['items']> => {
        if ('group' in n) {
          const children = n.items.filter((l) => can(l.perm)).map((l) => ({ key: l.key, label: l.label, icon: l.icon }));
          return children.length ? [{ type: 'group' as const, key: n.group, label: n.group, children }] : [];
        }
        return can(n.perm) ? [{ key: n.key, label: n.label, icon: n.icon }] : [];
      }),
    [can],
  );
  const selected = LEAVES.filter((k) => (k === '/' ? loc.pathname === '/' : loc.pathname === k || loc.pathname.startsWith(k + '/')))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={248} breakpoint="lg" collapsedWidth={0} zeroWidthTriggerStyle={{ top: 12, borderRadius: '0 8px 8px 0', background: palette.primary }} style={{ borderRight: `1px solid ${palette.line}` }}>
        <Flex align="center" gap={10} style={{ padding: '20px 24px 8px' }}>
          <BrandMark />
          <span style={{ fontWeight: 700, fontSize: 16, color: palette.ink }}>{env.appName}</span>
        </Flex>
        <Menu mode="inline" selectedKeys={selected ? [selected] : []} items={items} onClick={({ key }) => nav(key)} style={{ borderInlineEnd: 0, paddingBottom: 24 }} />
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ borderBottom: `1px solid ${palette.line}`, lineHeight: 'normal' }}>
          <Flex justify="flex-end" align="center" gap={14} style={{ height: '100%' }}>
            <Flex align="center" gap={10}>
              <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 999, background: '#E5E6FF', color: '#3F42A8', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13 }}>
                {initials(user?.fullName)}
              </span>
              {screens.sm && (
                <div style={{ lineHeight: 1.25 }}>
                  <div style={{ fontWeight: 600 }}>{user?.fullName}</div>
                  <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>{user ? ROLE_LABELS[user.role] : ''}</Typography.Text>
                </div>
              )}
            </Flex>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                qc.clear();
                nav('/login', { replace: true, state: null });
              }}
            >
              Đăng xuất
            </Button>
          </Flex>
        </Layout.Header>
        <Layout.Content style={{ padding: screens.md ? '28px 32px 40px' : '20px 16px 32px', maxWidth: 1360, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
