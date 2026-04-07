import {
  Employee,
  KPITemplate,
  KPIEvaluation,
  SalaryAdjustment,
  KPIItem,
  KPIActual,
  RatingLevel,
  SalarySettings,
} from '@/shared/types';



// ----------------------------------------------------------------
// Calculation Helpers
// ----------------------------------------------------------------
export function getRatingLevel(score: number): RatingLevel {
  if (score >= 90) return 'ดีเยี่ยม';
  if (score >= 80) return 'เกินเป้า';
  if (score >= 70) return 'ได้เป้า';
  if (score >= 60) return 'ต้องปรับปรุง';
  return 'ไม่ผ่านเกณฑ์';
}

export function getRatingColor(level: RatingLevel): string {
  switch (level) {
    case 'ดีเยี่ยม': return 'text-emerald-400';
    case 'เกินเป้า': return 'text-blue-400';
    case 'ได้เป้า': return 'text-yellow-400';
    case 'ต้องปรับปรุง': return 'text-orange-400';
    case 'ไม่ผ่านเกณฑ์': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

export function getRatingBg(level: RatingLevel): string {
  switch (level) {
    case 'ดีเยี่ยม': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'เกินเป้า': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'ได้เป้า': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'ต้องปรับปรุง': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'ไม่ผ่านเกณฑ์': return 'bg-red-500/20 text-red-300 border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

export function getMeritPercent(score: number, settings: SalarySettings): number {
  const level = getRatingLevel(score);
  return settings.meritMap[level] ?? 0;
}

export function calculateKPIScore(kpis: KPIItem[], actuals: KPIActual[]): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const kpi of kpis) {
    const actual = actuals.find(a => a.kpiItemId === kpi.id);
    if (!actual) continue;

    let achievement: number;

    // For metrics where lower is better (e.g., bug rate, FRT)
    const lowerIsBetter = kpi.name.includes('บั๊ก') || kpi.name.includes('เวลาตอบสนอง');
    if (lowerIsBetter) {
      achievement = kpi.targetValue > 0
        ? Math.min((kpi.targetValue / actual.actualValue) * 100, 120)
        : 0;
    } else {
      achievement = kpi.targetValue > 0
        ? Math.min((actual.actualValue / kpi.targetValue) * 100, 120)
        : 0;
    }

    totalScore += (achievement * kpi.weight) / 100;
    totalWeight += kpi.weight;
  }

  return totalWeight > 0 ? Math.min(Math.round((totalScore / totalWeight) * 100), 100) : 0;
}



export function calculateSalaryAdjustment(
  employee: Employee,
  kpiScore: number,
  settings: SalarySettings,
  marketCorrection: number = 2,
  costOfLiving: number = 3
): Omit<SalaryAdjustment, 'id' | 'period' | 'createdAt' | 'approved'> {
  const ratingLevel = getRatingLevel(kpiScore);
  const meritPercent = getMeritPercent(kpiScore, settings);
  const tenureBonus = Math.min(employee.yearsOfService * settings.tenureRatePerYear, settings.maxTenureBonus);
  const totalAdjustmentPercent = meritPercent + tenureBonus + marketCorrection + costOfLiving;
  const currentSalary = employee.baseSalary + employee.personalCapacity;
  const recommendedSalary = Math.round(currentSalary * (1 + totalAdjustmentPercent / 100));
  const p3Amount = Math.round(employee.variablePayBase * (kpiScore / 100));

  return {
    employeeId: employee.id,
    kpiScore,
    ratingLevel,
    meritPercent,
    tenureBonus,
    marketCorrection,
    costOfLiving,
    totalAdjustmentPercent,
    currentSalary,
    recommendedSalary,
    p3Amount,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getEmployeeInitials(emp: Employee): string {
  if (!emp || !emp.firstName || !emp.lastName) return '??';
  return (emp.firstName[0] + emp.lastName[0]).toUpperCase();
}

export function getAvatarColor(id: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-600',
    'from-teal-500 to-green-600',
    'from-fuchsia-500 to-pink-600',
  ];
  if (!id || typeof id !== 'string' || id.length === 0) return colors[0];
  const charCode = id.charCodeAt(id.length - 1);
  const index = isNaN(charCode) ? 0 : charCode % colors.length;
  return colors[index];
}
