import { createBrowserRouter } from 'react-router';
import { RequireAuth, RequirePermission } from '@/auth/guards';
import { AppLayout } from '@/components/AppLayout';
import { ForbiddenPage, NotFoundPage } from '@/components/States';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CategoriesPage from '@/pages/CategoriesPage';
import ProductsPage from '@/pages/ProductsPage';
import SuppliersPage from '@/pages/SuppliersPage';
import StockPage from '@/pages/StockPage';
import LedgerPage from '@/pages/LedgerPage';
import PrListPage from '@/pages/PrListPage';
import PrFormPage from '@/pages/PrFormPage';
import PrDetailPage from '@/pages/PrDetailPage';
import PoListPage from '@/pages/PoListPage';
import PoFormPage from '@/pages/PoFormPage';
import PoDetailPage from '@/pages/PoDetailPage';
import IssueListPage from '@/pages/IssueListPage';
import IssueFormPage from '@/pages/IssueFormPage';
import IssueDetailPage from '@/pages/IssueDetailPage';
import { ReceiptDetailPage, ReceiptFormPage, ReceiptListPage } from '@/pages/ReceiptPages';
import UsersPage from '@/pages/UsersPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import type { Permission } from '@/auth/permissions';

const guard = (perm: Permission, children: { path?: string; index?: boolean; element: React.ReactNode }[]) => ({
  element: <RequirePermission perm={perm} />,
  children,
});

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/403', element: <ForbiddenPage /> },
          { path: '/account/password', element: <ChangePasswordPage /> },
          guard('dashboard:view', [{ index: true, element: <DashboardPage /> }]),
          guard('category:view', [{ path: '/categories', element: <CategoriesPage /> }]),
          guard('product:view', [{ path: '/products', element: <ProductsPage /> }]),
          guard('supplier:view', [{ path: '/suppliers', element: <SuppliersPage /> }]),
          guard('stock:view', [{ path: '/stock', element: <StockPage defaultTab="all" /> }]),
          guard('stock:low', [{ path: '/stock/low', element: <StockPage defaultTab="low" /> }]),
          guard('ledger:view', [{ path: '/ledger', element: <LedgerPage /> }]),
          guard('pr:view', [
            { path: '/pr', element: <PrListPage /> },
            { path: '/pr/:id', element: <PrDetailPage /> },
          ]),
          guard('pr:create', [
            { path: '/pr/new', element: <PrFormPage /> },
            { path: '/pr/:id/edit', element: <PrFormPage /> },
          ]),
          guard('po:view', [{ path: '/po', element: <PoListPage /> }, { path: '/po/:id', element: <PoDetailPage /> }]),
          guard('po:manage', [{ path: '/po/new', element: <PoFormPage /> }, { path: '/po/:id/edit', element: <PoFormPage /> }]),
          guard('gr:view', [{ path: '/receipts', element: <ReceiptListPage /> }, { path: '/receipts/:id', element: <ReceiptDetailPage /> }]),
          guard('gr:manage', [{ path: '/receipts/new', element: <ReceiptFormPage /> }]),
          guard('issue:view', [{ path: '/issues', element: <IssueListPage /> }, { path: '/issues/:id', element: <IssueDetailPage /> }]),
          guard('issue:create', [{ path: '/issues/new', element: <IssueFormPage /> }, { path: '/issues/:id/edit', element: <IssueFormPage /> }]),
          guard('user:manage', [{ path: '/users', element: <UsersPage /> }]),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
