// ============================================================
// Workflow Steps Indicator — Visual coordination between 4 roles
// ============================================================
import { Card, Steps, Tag } from 'antd'
import {
  FileAddOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { Role } from '@/types'

interface WorkflowStepsProps {
  currentRole: Role
}

const roleToStepIndex: Record<Role, number> = {
  REQUESTER: 0,
  MANAGER: 1,
  PURCHASING_STAFF: 2,
  WAREHOUSE_STAFF: 3,
}

export function WorkflowSteps({ currentRole }: WorkflowStepsProps) {
  const currentStep = roleToStepIndex[currentRole] ?? 0

  const items = [
    {
      title: (
        <span className="font-semibold text-xs md:text-sm">
          1. Đề xuất
          {currentRole === 'REQUESTER' && <Tag color="blue" className="ml-1 text-[10px]">Vai trò của bạn</Tag>}
        </span>
      ),
      description: (
        <span className="text-xs text-gray-500">
          <strong>Requester:</strong> Tạo PR mua hàng hoặc Yêu cầu xuất kho
        </span>
      ),
      icon: <FileAddOutlined />,
    },
    {
      title: (
        <span className="font-semibold text-xs md:text-sm">
          2. Phê duyệt
          {currentRole === 'MANAGER' && <Tag color="red" className="ml-1 text-[10px]">Vai trò của bạn</Tag>}
        </span>
      ),
      description: (
        <span className="text-xs text-gray-500">
          <strong>Manager:</strong> Kiểm tra tồn, duyệt/từ chối PR
        </span>
      ),
      icon: <CheckCircleOutlined />,
    },
    {
      title: (
        <span className="font-semibold text-xs md:text-sm">
          3. Mua sắm
          {currentRole === 'PURCHASING_STAFF' && <Tag color="orange" className="ml-1 text-[10px]">Vai trò của bạn</Tag>}
        </span>
      ),
      description: (
        <span className="text-xs text-gray-500">
          <strong>Purchasing:</strong> Tạo PO từ PR đã duyệt, theo dõi NCC
        </span>
      ),
      icon: <ShoppingCartOutlined />,
    },
    {
      title: (
        <span className="font-semibold text-xs md:text-sm">
          4. Nhập / Xuất kho
          {currentRole === 'WAREHOUSE_STAFF' && <Tag color="green" className="ml-1 text-[10px]">Vai trò của bạn</Tag>}
        </span>
      ),
      description: (
        <span className="text-xs text-gray-500">
          <strong>Warehouse:</strong> Nhận hàng theo PO (tăng tồn) & Xuất kho (giảm tồn)
        </span>
      ),
      icon: <InboxOutlined />,
    },
  ]

  return (
    <Card size="small" className="mb-6 bg-gradient-to-r from-gray-50 to-white border-gray-200 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
          Quy trình vận hành phối hợp 4 vai trò (P1 – P4)
        </div>
        <div className="text-xs text-gray-400 hidden sm:block">
          Dữ liệu lưu vết qua Stock Ledger & chứng từ Confirmed
        </div>
      </div>
      <Steps
        current={currentStep}
        size="small"
        items={items}
        className="overflow-x-auto"
      />
    </Card>
  )
}

