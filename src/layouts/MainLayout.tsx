// ============================================================
// MainLayout – Sidebar + Header + Content shell
// ============================================================
import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, theme, Badge } from 'antd'
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ExportOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ShopOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  BarChartOutlined,
  AlertOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '@/auth/store'
import { getInitials, stringToColor } from '@/utils'
import type { Role } from '@/types'

const { Header, Sider, Content } = Layout
const { Text } = Typography

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  roles?: Role[]
  badge?: number
}

const menuItems: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <AppstoreOutlined />, label: 'Sản phẩm' },
  { key: '/categories', icon: <DatabaseOutlined />, label: 'Nhóm hàng' },
  { key: '/suppliers', icon: <ShopOutlined />, label: 'Nhà cung cấp', roles: ['PURCHASING_STAFF', 'MANAGER'] },
  { key: '/purchase-requests', icon: <ShoppingCartOutlined />, label: 'Đề nghị mua hàng' },
  { key: '/purchase-orders', icon: <FileTextOutlined />, label: 'Đơn đặt hàng', roles: ['PURCHASING_STAFF', 'MANAGER', 'WAREHOUSE_STAFF'] },
  { key: '/goods-receipts', icon: <InboxOutlined />, label: 'Nhập kho', roles: ['WAREHOUSE_STAFF', 'MANAGER'] },
  { key: '/stock-issues', icon: <ExportOutlined />, label: 'Xuất kho' },
  { key: '/inventory', icon: <BarChartOutlined />, label: 'Tồn kho', roles: ['WAREHOUSE_STAFF', 'MANAGER'] },
  { key: '/stock-alerts', icon: <AlertOutlined />, label: 'Cảnh báo tồn thấp', roles: ['WAREHOUSE_STAFF', 'PURCHASING_STAFF', 'MANAGER'] },
  { key: '/stock-ledger', icon: <FileTextOutlined />, label: 'Sổ kho', roles: ['WAREHOUSE_STAFF', 'MANAGER'] },
  { key: '/users', icon: <TeamOutlined />, label: 'Người dùng', roles: ['MANAGER'] },
]

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { token: themeToken } = theme.useToken()

  if (!user) return null

  const visibleItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user.roleName),
  )

  const selectedKey = visibleItems
    .map((i) => i.key)
    .filter((key) => location.pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0] ?? '/dashboard'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        className="!fixed left-0 top-0 bottom-0 z-10 overflow-auto"
        style={{ background: themeToken.colorBgContainer }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div
            className="flex items-center justify-center rounded-lg text-white font-bold text-lg shrink-0"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)' }}
          >
            P3
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <Text strong className="block text-sm leading-tight truncate">
                Inventory & PR
              </Text>
              <Text type="secondary" className="text-xs">
                Management System
              </Text>
            </div>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={visibleItems.map((item) => ({
            key: item.key,
            icon: item.badge ? (
              <Badge count={item.badge} size="small">{item.icon}</Badge>
            ) : item.icon,
            label: item.label,
          }))}
          onClick={({ key }) => navigate(key)}
          className="border-none !mt-2"
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          className="flex items-center justify-between px-6 sticky top-0 z-10"
          style={{
            background: themeToken.colorBgContainer,
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
            height: 64,
            padding: '0 24px',
          }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <UserOutlined />,
                  label: (
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-xs text-gray-500">{user.roleName}</div>
                    </div>
                  ),
                  disabled: true,
                },
                { type: 'divider' },
                { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt', disabled: true },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
              ],
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
              <Avatar
                size={36}
                style={{ backgroundColor: stringToColor(user.fullName), fontWeight: 600 }}
              >
                {getInitials(user.fullName)}
              </Avatar>
              {!collapsed && (
                <div className="hidden md:block">
                  <Text className="text-sm font-medium block leading-tight">{user.fullName}</Text>
                  <Text type="secondary" className="text-xs">{user.roleName}</Text>
                </div>
              )}
            </div>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content className="p-6" style={{ background: themeToken.colorBgLayout, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

