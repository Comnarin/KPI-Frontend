import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Employee,
  KPITemplate,
  KPIEvaluation,
  SalaryAdjustment,
  SalaryFormula,
  DepartmentRecord,
  RolePermission,
} from '@/shared/types';
import { api } from '@/shared/api';

const DEFAULT_MERIT_MAP: Record<string, number> = {
  'ดีเยี่ยม': 8,
  'เกินเป้า': 6,
  'ได้เป้า': 4,
  'ต้องปรับปรุง': 2,
  'ไม่ผ่านเกณฑ์': 0,
};

const DEFAULT_SALARY_FORMULA: SalaryFormula = {
  tenureRatePerYear: 0.5,
  maxTenureBonus: 10,
  meritMap: DEFAULT_MERIT_MAP,
};

interface AppState {
  // Auth
  token?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string;
    departmentId?: string;
  };
  isAuthenticated: boolean;
  login: (tenantCode: string, email: string, password: string) => Promise<void>;
  logout: () => void;

  // Permissions
  permissions: RolePermission[];
  loadPermissions: (tenantId: string) => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;

  // Backend sync (permissions only post-SWR)
  loading: boolean;
  error?: string;
  loadFromBackend: (tenantId: string) => Promise<void>;

  // Salary adjustments (removed - now server-side)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      token: undefined,
      user: undefined,
      isAuthenticated: false,
      permissions: [],

      loading: false,
      error: undefined,

      // ─── Auth ────────────────────────────────────────────────
      login: async (tenantCode: string, email: string, password: string) => {
        const data = await api.post<{
          token: string;
          id: string;
          fullName: string;
          tenantId: string;
          role: string;
          departmentId?: string;
        }>('/auth/login', { tenantCode, email, password });

        localStorage.setItem('auth_token', data.token);
        set({
          token: data.token,
          user: { id: data.id, email, fullName: data.fullName, tenantId: data.tenantId, role: data.role, departmentId: data.departmentId },
          isAuthenticated: true,
        });

        // Load everything after login
        await get().loadFromBackend(data.tenantId);
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          token: undefined,
          user: undefined,
          isAuthenticated: false,
          permissions: [],
        });
      },

      // ─── Permissions ─────────────────────────────────────────
      loadPermissions: async (tenantId: string) => {
        try {
          const perms = await api.get<RolePermission[]>('/permissions');
          set({ permissions: perms });
        } catch {
          console.warn('Failed to load permissions', tenantId);
          set({ permissions: [] });
        }
      },

      hasPermission: (permissionKey: string) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.role === 'SUPERADMIN') return true;
        const perm = permissions.find(
          (p) => p.role === user.role && p.permissionKey === permissionKey
        );
        return perm?.allowed ?? false;
      },

      // ─── Load essential auth-bound context from backend ──────
      loadFromBackend: async (tenantId: string) => {
        set({ loading: true, error: undefined });
        try {
          await get().loadPermissions(tenantId);
          set({ loading: false });
        } catch (err: any) {
          if (err.status === 401) {
            console.warn('Unauthorized access detected, logging out...');
            get().logout();
          }
          set({ loading: false, error: String(err) });
        }
      },

      // ─── Salary adjustments (removed) ──────────────
    }),
    {
      name: 'kpi-app-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Persist permissions so menu/visibility survives full refresh
        permissions: state.permissions,
      }),
    }
  )
);
