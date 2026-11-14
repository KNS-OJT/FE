import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Button, Drawer, Dropdown, Flex, Grid, Layout, Menu, Typography, type MenuProps } from 'antd';
import {
  AlertOutlined, AppstoreOutlined, BarChartOutlined, DatabaseOutlined, DownOutlined, ExportOutlined, FileDoneOutlined,
  FileTextOutlined, HistoryOutlined, ImportOutlined, KeyOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ShopOutlined, TagsOutlined, TeamOutlined,
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isDesktop = !!screens.lg;
  const inlineCollapsed = isDesktop && collapsed;

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    // Đóng drawer khi route đổi, kể cả điều hướng từ dropdown hoặc nút Back.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [loc.pathname]);

  const items = useMemo<MenuProps['items']>(
    () =>
      NAV.flatMap((n): NonNullable<MenuProps['items']> => {
        if ('group' in n) {
          const children = n.items.filter((l) => can(l.perm)).map((l) => ({ key: l.key, label: l.label, icon: l.icon }));
          if (!children.length) return [];
          return inlineCollapsed
            ? [{ type: 'divider', key: n.group }, ...children]
            : [{ type: 'group', key: n.group, label: n.group, children }];
        }
        return can(n.perm) ? [{ key: n.key, label: n.label, icon: n.icon }] : [];
      }),
    [can, inlineCollapsed],
  );
  const selected = LEAVES.filter((k) => (k === '/' ? loc.pathname === '/' : loc.pathname === k || loc.pathname.startsWith(k + '/')))
    .sort((a, b) => b.length - a.length)[0];

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Flex align="center" style={{ height: 64, flexShrink: 0 }}>
        <Link to="/" aria-label={`${env.appName} — Tổng quan`} style={{ display: 'flex', alignItems: 'center', justifyContent: inlineCollapsed ? 'center' : undefined, gap: 10, height: '100%', flex: 1, minWidth: 0, padding: inlineCollapsed ? 0 : '0 24px', textDecoration: 'none' }}>
          <span style={{ display: 'flex', flexShrink: 0 }}><BrandMark /></span>
          {!inlineCollapsed && <span style={{ fontWeight: 700, fontSize: 16, color: palette.ink }}>{env.appName}</span>}
        </Link>
        {!isDesktop && <Button type="text" aria-label="Đóng thanh bên" icon={<MenuFoldOutlined />} onClick={() => setMobileOpen(false)} style={{ marginRight: 8, flexShrink: 0 }} />}
      </Flex>
      <nav id="main-navigation" aria-label="Điều hướng chính" className="sider-scroll">
        <Menu mode="inline" inlineCollapsed={inlineCollapsed} selectedKeys={selected ? [selected] : []} items={items} onClick={({ key }) => { setMobileOpen(false); nav(key); }} style={{ background: 'transparent', borderInlineEnd: 0, paddingBottom: 24 }} />
      </nav>
    </div>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {isDesktop ? (
        <Layout.Sider width={248} collapsedWidth={72} collapsed={collapsed} trigger={null} style={{ height: '100vh', borderRight: `1px solid ${palette.line}` }}>
          {sidebar}
        </Layout.Sider>
      ) : (
        <Drawer placement="left" width={264} closable={false} forceRender open={mobileOpen} onClose={() => setMobileOpen(false)} aria-label="Thanh điều hướng" styles={{ body: { padding: 0, background: palette.sidebar } }}>
          {sidebar}
        </Drawer>
      )}
      <Layout style={{ minWidth: 0 }}>
        <Layout.Header style={{ borderBottom: `1px solid ${palette.line}`, lineHeight: 'normal', flexShrink: 0 }}>
          <Flex justify="space-between" align="center" gap={14} style={{ height: '100%' }}>
            <Button
              type="text"
              aria-label={isDesktop ? (collapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên') : (mobileOpen ? 'Đóng thanh bên' : 'Mở thanh bên')}
              aria-expanded={isDesktop ? !collapsed : mobileOpen}
              aria-controls="main-navigation"
              icon={(isDesktop ? !collapsed : mobileOpen) ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              onClick={() => isDesktop ? setCollapsed((value) => !value) : setMobileOpen((value) => !value)}
            />
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  { key: 'password', icon: <KeyOutlined />, label: 'Đổi mật khẩu' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === 'password') nav('/account/password');
                  if (key === 'logout') {
                    logout();
                    qc.clear();
                    nav('/login', { replace: true, state: null });
                  }
                },
              }}
            >
              <Button type="text" aria-label="Menu tài khoản" style={{ height: 'auto', padding: '4px 8px' }}>
                <Flex align="center" gap={10}>
                  <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 999, background: '#E5E6FF', color: '#3F42A8', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13 }}>
                    {initials(user?.fullName)}
                  </span>
                  {screens.sm && (
                    <div style={{ lineHeight: 1.25, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{user?.fullName}</div>
                      <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>{user ? ROLE_LABELS[user.role] : ''}</Typography.Text>
                    </div>
                  )}
                  <DownOutlined aria-hidden="true" style={{ fontSize: 11, color: palette.muted }} />
                </Flex>
              </Button>
            </Dropdown>
          </Flex>
        </Layout.Header>
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          <Layout.Content style={{ padding: screens.md ? '28px 32px 40px' : '20px 16px 32px', maxWidth: 1360, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <Outlet />
          </Layout.Content>
        </div>
      </Layout>
    </Layout>
  );
}
