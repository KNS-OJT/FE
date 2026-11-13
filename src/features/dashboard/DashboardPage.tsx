// ============================================================
// Main Dashboard Page — IN16
// Architecture: 1 Application – 1 UI Shell – 4 Role-Based Dashboards
// P03: Inventory & Purchase Request Management System
// ============================================================
import { useAuthStore } from '@/auth/store'
import { DashboardHeader } from './DashboardHeader'
import { WorkflowSteps } from './WorkflowSteps'
import { RequesterDashboard } from './RequesterDashboard'
import { ManagerDashboard } from './ManagerDashboard'
import { PurchasingDashboard } from './PurchasingDashboard'
import { WarehouseDashboard } from './WarehouseDashboard'

export function DashboardPage() {
  const { user } = useAuthStore()

  const currentRole = user?.roleName ?? 'MANAGER'

  return (
    <div className="space-y-6">
      {/* 1. Shared Role Header with Identity Badge and 1-Click Role Switcher */}
      <DashboardHeader currentRole={currentRole} />

      {/* 2. Visual 4-Step Supply Chain Pipeline (P1 – P4) */}
      <WorkflowSteps currentRole={currentRole} />

      {/* 3. Role-Tailored Dashboard View */}
      {currentRole === 'REQUESTER' && <RequesterDashboard />}
      {currentRole === 'MANAGER' && <ManagerDashboard />}
      {currentRole === 'PURCHASING_STAFF' && <PurchasingDashboard />}
      {currentRole === 'WAREHOUSE_STAFF' && <WarehouseDashboard />}
    </div>
  )
}
