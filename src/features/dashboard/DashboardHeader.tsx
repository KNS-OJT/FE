// ============================================================
// Shared Dashboard Header — Role Badge, Slogan, and Demo Role Switcher
// ============================================================
import { Card, Tag, Button, Typography, message } from 'antd'
import {
  UserOutlined,
  SwapOutlined,
  CheckCircleTwoTone,
} from '@ant-design/icons'
import type { Role } from '@/types'
import { ROLE_CONFIGS, getDemoUserByRole } from './roleConfig'
import { useAuthStore } from '@/auth/store'

const { Title, Paragraph, Text } = Typography

interface DashboardHeaderProps {
  currentRole: Role
}

const ROLES_LIST: Role[] = ['MANAGER', 'REQUESTER', 'PURCHASING_STAFF', 'WAREHOUSE_STAFF']

export function DashboardHeader({ currentRole }: DashboardHeaderProps) {
  const { user, setAuth } = useAuthStore()
  const roleConfig = ROLE_CONFIGS[currentRole]

  const handleSwitchRole = (targetRole: Role) => {
    if (targetRole === currentRole) return
    const targetUser = getDemoUserByRole(targetRole)
    if (!targetUser) return
    // Simulated token for demo switching
    const demoToken = `demo_jwt_token_${targetUser.username}`
    setAuth(demoToken, targetUser)
    message.success(`Đã chuyển đổi sang tài khoản: ${targetUser.fullName} (${ROLE_CONFIGS[targetRole].shortLabel})`)
  }

  return (
    <Card
      className="mb-6 border-l-4 shadow-sm"
      style={{
        borderLeftColor: roleConfig.color,
        background: `linear-gradient(to right, ${roleConfig.bgLight} 0%, #ffffff 100%)`,
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Role & User Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Title level={4} className="!mb-0 text-gray-800">
              Dashboard: {roleConfig.title}
            </Title>
            <Tag color={roleConfig.color} className="font-semibold text-xs px-2 py-0.5">
              {roleConfig.scope}
            </Tag>
          </div>
          <Paragraph className="!mb-0 text-sm text-gray-600 max-w-3xl">
            {roleConfig.description}
          </Paragraph>
          <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
            <UserOutlined />
            <span>Tài khoản hiện tại:</span>
            <Text strong className="text-gray-700">{user?.fullName}</Text>
            <span className="text-gray-400">({user?.email})</span>
          </div>
        </div>

        {/* Demo Quick Switcher */}
        <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-gray-200 shrink-0">
          <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <SwapOutlined className="text-blue-500" />
            <span>Chuyển đổi vai trò trải nghiệm (1-Click Demo):</span>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
            {ROLES_LIST.map((r) => {
              const cfg = ROLE_CONFIGS[r]
              const isCurrent = r === currentRole
              return (
                <Button
                  key={r}
                  size="small"
                  type={isCurrent ? 'primary' : 'default'}
                  onClick={() => handleSwitchRole(r)}
                  className={`text-xs flex items-center gap-1 ${
                    isCurrent ? '!font-semibold shadow-xs' : 'hover:border-blue-400'
                  }`}
                  style={
                    isCurrent
                      ? { backgroundColor: cfg.color, borderColor: cfg.color }
                      : undefined
                  }
                >
                  {isCurrent && <CheckCircleTwoTone twoToneColor="#52c41a" />}
                  {cfg.shortLabel}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

