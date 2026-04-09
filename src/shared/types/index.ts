// ============================================================
// Core Types for KPI Evaluation System (Thai HR App)
// ============================================================

// Department is now a DB entity — do NOT use as a string union
export interface DepartmentRecord {
  id: string;
  tenantId?: string;
  name: string;
  code: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EmployeeStatus = 'ทำงาน' | 'ลาพัก' | 'ทดลองงาน' | 'ลาออก' | 'ACTIVE' | 'INACTIVE';

export type RatingLevel =
  | 'ดีเยี่ยม'
  | 'เกินเป้า'
  | 'ได้เป้า'
  | 'ต้องปรับปรุง'
  | 'ไม่ผ่านเกณฑ์';

export type EvaluationPeriodType = 'รายเดือน' | 'รายไตรมาส' | 'รายปี' | string;

// ----------------------------------------------------------------
// Employee
// ----------------------------------------------------------------
export interface Employee {
  id: string;
  tenantId?: string;
  code?: string; // EMP001 (backend auto-generates on create)
  firstName: string;
  lastName: string;
  departmentId: string; // DB department ID
  department?: DepartmentRecord; // Preloaded department entity
  position: string;
  baseSalary: number; // P1
  personalCapacity: number; // P2 — extra fixed pay (experience/seniority)
  variablePayBase: number; // Base for P3 calculation
  yearsOfService: number;
  startDate: string; // ISO date
  status?: EmployeeStatus;
  avatar?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

// ----------------------------------------------------------------
// System User (login account — separate from Employee HR record)
// ----------------------------------------------------------------
export interface SystemUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: string; // CEO | HR | HEAD_OF_DEPT | EMPLOYEE
  departmentId?: string; // assigned department for HEAD_OF_DEPT
}


// ----------------------------------------------------------------
// KPI Template & Assignment
// ----------------------------------------------------------------
export interface KPIItem {
  id: string;
  name: string; // "ยอดขายรายเดือน"
  description?: string;
  weight: number; // 0–100, all KPIs on a card must sum to 100
  targetValue: number;
  unit: string; // "บาท", "%", "ชิ้น"
  minValue?: number;
  maxValue?: number;
}

export interface KPITemplate {
  id: string;
  tenantId?: string;
  name: string; // "แม่แบบฝ่ายขาย"
  departmentId: string; // DB department ID
  department?: DepartmentRecord; // Preloaded department entity
  visibility?: string; // PERSONAL | GENERAL
  period: EvaluationPeriodType | string;
  definition?: KPIItem[];
  createdAt?: string;
  createdById?: string;
}

// ----------------------------------------------------------------
// KPI Evaluation (backend EvaluationResult)
// ----------------------------------------------------------------
export interface KPIActual {
  kpiItemId: string;
  actualValue: number;
}

export interface KPIDetail extends KPIActual {
  name: string;
  targetValue: number;
  weight: number;
  unit: string;
}

export interface KPIEvaluation {
  id: string;
  tenantId?: string;
  employeeId: string;
  employeeName?: string;
  departmentName?: string;
  templateId: string;
  period: string;
  periodType: string;
  actuals?: KPIActual[];
  details?: KPIDetail[] | string;
  totalScore: number;
  ratingLevel?: string;
  evaluatedAt?: string;
  currentStage?: string;
  completed?: boolean;
  notes?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  evaluatorRole?: string;
  createdAt?: string;
}

// ----------------------------------------------------------------
// Salary Adjustment
// ----------------------------------------------------------------
export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  period: string;
  kpiScore: number;
  ratingLevel: RatingLevel;
  meritPercent: number;
  tenureBonus: number;
  marketCorrection: number;
  costOfLiving: number;
  totalAdjustmentPercent: number;
  currentSalary: number;
  recommendedSalary: number;
  p3Amount: number;
  createdAt: string;
  approved: boolean;
}

// ----------------------------------------------------------------
// Salary Formula (DB-backed, per-tenant)
// ----------------------------------------------------------------
export interface SalaryFormula {
  id?: string;
  tenantId?: string;
  tenureRatePerYear: number;
  maxTenureBonus: number;
  meritMap: Record<string, number>; // { 'ดีเยี่ยม': 8, ... }
  updatedAt?: string;
}

// SalarySettings = alias for SalaryFormula (backward compat)
export type SalarySettings = SalaryFormula;

// ----------------------------------------------------------------
// RBAC Permission
// ----------------------------------------------------------------
export interface RolePermission {
  id?: string;
  tenantId?: string;
  role: string;
  permissionKey: string;
  allowed: boolean;
}

// ----------------------------------------------------------------
// Dashboard Stats
// ----------------------------------------------------------------
export interface DashboardStats {
  totalEmployees: number;
  evaluatedThisPeriod: number;
  avgKpiScore: number;
  teamBalanceIndex: number;
  pendingEvaluations: number;
  totalSalaryBudget: number;
}

// ----------------------------------------------------------------
// Tenant Period Configuration
// ----------------------------------------------------------------
export interface TenantPeriod {
  id: string;
  tenantId: string;
  label: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
