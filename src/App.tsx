// ============================================================
// App — Root component with routing
// ============================================================
import { Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/app/providers'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { MainLayout } from '@/layouts/MainLayout'

// Auth
import { LoginPage } from '@/features/auth/LoginPage'

// Features
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProductListPage } from '@/features/products/ProductListPage'
import { CategoryListPage } from '@/features/products/CategoryListPage'
import { SupplierListPage } from '@/features/suppliers/SupplierListPage'
import { UserListPage } from '@/features/users/UserListPage'
import { PRListPage } from '@/features/purchase-requests/PRListPage'
import { PRCreatePage } from '@/features/purchase-requests/PRCreatePage'
import { PRDetailPage } from '@/features/purchase-requests/PRDetailPage'
import { POListPage } from '@/features/purchase-orders/POListPage'
import { POCreatePage } from '@/features/purchase-orders/POCreatePage'
import { PODetailPage } from '@/features/purchase-orders/PODetailPage'
import { GRListPage } from '@/features/goods-receipts/GRListPage'
import { GRCreatePage } from '@/features/goods-receipts/GRCreatePage'
import { GRDetailPage } from '@/features/goods-receipts/GRDetailPage'
import { SIListPage } from '@/features/stock-issues/SIListPage'
import { SICreatePage } from '@/features/stock-issues/SICreatePage'
import { SIDetailPage } from '@/features/stock-issues/SIDetailPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { StockAlertsPage } from '@/features/inventory/StockAlertsPage'
import { StockLedgerPage } from '@/features/inventory/StockLedgerPage'

export default function App() {
  return (
    <AppProviders>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected – MainLayout wraps all authenticated routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Products & Categories */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/categories" element={<CategoryListPage />} />

          {/* Suppliers */}
          <Route path="/suppliers" element={
            <ProtectedRoute roles={['PURCHASING_STAFF', 'MANAGER']}>
              <SupplierListPage />
            </ProtectedRoute>
          } />

          {/* Purchase Requests */}
          <Route path="/purchase-requests" element={<PRListPage />} />
          <Route path="/purchase-requests/create" element={<PRCreatePage />} />
          <Route path="/purchase-requests/:id" element={<PRDetailPage />} />

          {/* Purchase Orders */}
          <Route path="/purchase-orders" element={
            <ProtectedRoute roles={['PURCHASING_STAFF', 'MANAGER', 'WAREHOUSE_STAFF']}>
              <POListPage />
            </ProtectedRoute>
          } />
          <Route path="/purchase-orders/create" element={
            <ProtectedRoute roles={['PURCHASING_STAFF', 'MANAGER']}>
              <POCreatePage />
            </ProtectedRoute>
          } />
          <Route path="/purchase-orders/:id" element={
            <ProtectedRoute roles={['PURCHASING_STAFF', 'MANAGER', 'WAREHOUSE_STAFF']}>
              <PODetailPage />
            </ProtectedRoute>
          } />

          {/* Goods Receipts */}
          <Route path="/goods-receipts" element={
            <ProtectedRoute roles={['WAREHOUSE_STAFF', 'MANAGER']}>
              <GRListPage />
            </ProtectedRoute>
          } />
          <Route path="/goods-receipts/create" element={
            <ProtectedRoute roles={['WAREHOUSE_STAFF', 'MANAGER']}>
              <GRCreatePage />
            </ProtectedRoute>
          } />
          <Route path="/goods-receipts/:id" element={
            <ProtectedRoute roles={['WAREHOUSE_STAFF', 'MANAGER']}>
              <GRDetailPage />
            </ProtectedRoute>
          } />

          {/* Stock Issues */}
          <Route path="/stock-issues" element={<SIListPage />} />
          <Route path="/stock-issues/create" element={<SICreatePage />} />
          <Route path="/stock-issues/:id" element={<SIDetailPage />} />

          {/* Inventory */}
          <Route path="/inventory" element={
            <ProtectedRoute roles={['WAREHOUSE_STAFF', 'MANAGER']}>
              <InventoryPage />
            </ProtectedRoute>
          } />

          {/* Stock Alerts */}
          <Route path="/stock-alerts" element={
            <ProtectedRoute roles={['WAREHOUSE_STAFF', 'PURCHASING_STAFF', 'MANAGER']}>
              <StockAlertsPage />
            </ProtectedRoute>
          } />

          {/* Stock Ledger */}
          <Route path="/stock-ledger" element={
            <ProtectedRoute roles={['WAREHOUSE_STAFF', 'MANAGER']}>
              <StockLedgerPage />
            </ProtectedRoute>
          } />

          {/* User Management */}
          <Route path="/users" element={
            <ProtectedRoute roles={['MANAGER']}>
              <UserListPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppProviders>
  )
}
