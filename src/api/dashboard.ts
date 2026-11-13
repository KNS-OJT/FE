import { api } from '@/lib/http';
import { asObj, num } from '@/lib/pick';

export interface DashboardStats {
  activeProducts: number;
  lowStockProducts: number;
  prWaitingApproval: number;
  poWaitingReceipt: number;
  issuesWaitingConfirm: number;
}

/** GET /api/dashboard */
export async function getDashboard(): Promise<DashboardStats> {
  const o = asObj(await api.get<unknown>('/dashboard'));
  return {
    activeProducts: num(o, 'activeProducts'),
    lowStockProducts: num(o, 'lowStockProducts'),
    prWaitingApproval: num(o, 'prWaitingApproval'),
    poWaitingReceipt: num(o, 'poWaitingReceipt'),
    issuesWaitingConfirm: num(o, 'issuesWaitingConfirm'),
  };
}
