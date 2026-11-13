// ============================================================
// Role configuration & metadata for Role-Based Dashboards
// P03: Inventory & Purchase Request Management System
// ============================================================
import type { Role, User } from '@/types'
import { mockUsers } from '@/lib/mock-data'

export interface RoleInfo {
  role: Role
  title: string
  shortLabel: string
  color: string
  bgLight: string
  borderColor: string
  scope: string
  description: string
  demoAccount: {
    username: string
    name: string
    title: string
  }
  coreDuties: string[]
}

export const ROLE_CONFIGS: Record<Role, RoleInfo> = {
  REQUESTER: {
    role: 'REQUESTER',
    title: 'Người yêu cầu (Requester)',
    shortLabel: 'Requester',
    color: '#1677ff',
    bgLight: '#e6f4ff',
    borderColor: '#91caff',
    scope: 'P1 – Khởi tạo PR & P3 – Yêu cầu cấp hàng',
    description: 'Khởi tạo các đề nghị mua sắm linh kiện máy tính khi thiếu hụt và yêu cầu xuất kho phục vụ công việc phòng ban.',
    demoAccount: {
      username: 'requester1',
      name: 'Phạm Đức Yêu Cầu',
      title: 'Nhân viên IT / Kỹ thuật',
    },
    coreDuties: [
      'Phát hiện linh kiện tồn thấp hoặc thiếu hụt để tạo Purchase Request (PR)',
      'Tạo yêu cầu xuất kho (Stock Issue) khi cần linh kiện lắp ráp/sử dụng',
      'Theo dõi tiến độ duyệt PR của Manager và trạng thái xuất kho',
      'Tuân thủ phân nhiệm: Không tự duyệt PR và không tự ý xuất kho',
    ],
  },
  MANAGER: {
    role: 'MANAGER',
    title: 'Quản lý & Phê duyệt (Manager)',
    shortLabel: 'Manager',
    color: '#cf1322',
    bgLight: '#fff1f0',
    borderColor: '#ffa39e',
    scope: 'P1 – Phê duyệt PR, Giám sát kho & Ngân sách',
    description: 'Kiểm soát và phê duyệt/từ chối các đề nghị mua hàng từ Requester; giám sát mức tồn an toàn và toàn bộ hoạt động kho.',
    demoAccount: {
      username: 'admin',
      name: 'Nguyễn Văn Admin',
      title: 'Giám đốc / Trưởng phòng Vận hành',
    },
    coreDuties: [
      'Kiểm tra tính hợp lý của PR: Tồn kho hiện tại, nhu cầu và lý do mua hàng',
      'Phê duyệt (Approved) hoặc Từ chối (Rejected) kèm lý do bắt buộc (BR-10)',
      'Chống xung đột lợi ích: Không tự phê duyệt PR do chính mình tạo (BR-08)',
      'Giám sát các mặt hàng tồn thấp dưới mức tối thiểu và thẻ kho toàn hệ thống',
    ],
  },
  PURCHASING_STAFF: {
    role: 'PURCHASING_STAFF',
    title: 'Nhân viên Mua hàng (Purchasing Staff)',
    shortLabel: 'Purchasing',
    color: '#d46b08',
    bgLight: '#fff7e6',
    borderColor: '#ffd591',
    scope: 'P1 – Lập PO & Quản lý Nhà cung cấp',
    description: 'Tiếp nhận các PR đã được Manager phê duyệt, chọn nhà cung cấp uy tín, đàm phán và phát hành đơn đặt hàng (PO).',
    demoAccount: {
      username: 'purchasing1',
      name: 'Lê Minh Mua',
      title: 'Chuyên viên Thu mua & Cung ứng',
    },
    coreDuties: [
      'Tiếp nhận các PR đã được phê duyệt để xúc tiến đặt hàng (BR-02/BR-19)',
      'Tạo đơn đặt hàng Purchase Order (PO) gửi đến các Nhà cung cấp đối tác',
      'Quản lý hồ sơ nhà cung cấp máy tính, theo dõi công nợ/hợp đồng cơ bản',
      'Theo dõi tiến độ giao hàng của NCC và cập nhật trạng thái đơn PO',
    ],
  },
  WAREHOUSE_STAFF: {
    role: 'WAREHOUSE_STAFF',
    title: 'Thủ kho & Nhập xuất (Warehouse Staff)',
    shortLabel: 'Warehouse',
    color: '#389e0d',
    bgLight: '#f6ffed',
    borderColor: '#b7eb8f',
    scope: 'P2 – Nhập hàng, P3 – Xác nhận xuất kho & P4 – Quản lý tồn',
    description: 'Kiểm đếm hàng thực tế từ nhà cung cấp theo PO để lập phiếu nhận (Stock-In); xác nhận xuất kho (Stock-Out) và quản lý thẻ kho.',
    demoAccount: {
      username: 'warehouse1',
      name: 'Trần Thị Kho',
      title: 'Trưởng kho / Thủ kho Linh kiện',
    },
    coreDuties: [
      'Lập phiếu nhận hàng (Goods Receipt) đối chiếu chính xác theo PO (IN09/IN10)',
      'Xác nhận nhận hàng: Tự động ghi tăng tồn kho và ghi nhật ký Stock Ledger (BR-04)',
      'Tiếp nhận yêu cầu xuất kho (SI), kiểm tra tồn khả dụng và xác nhận trừ tồn (IN12)',
      'Theo dõi ngưỡng an toàn tối thiểu và kiểm kê đối chiếu thực tế (IN05/IN18)',
    ],
  },
}

export function getDemoUserByRole(role: Role): User | undefined {
  return mockUsers.find((u) => u.roleName === role)
}

