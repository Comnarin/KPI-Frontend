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

// // ----------------------------------------------------------------
// // Seed Data
// // ----------------------------------------------------------------
// export const SEED_EMPLOYEES: Employee[] = [
//   {
//     id: 'emp-001',
//     code: 'EMP001',
//     firstName: 'สมชาย',
//     lastName: 'ใจดี',
//     department: 'ฝ่ายขาย',
//     position: 'ผู้จัดการฝ่ายขาย',
//     baseSalary: 45000,
//     personalCapacity: 8000,
//     variablePayBase: 10000,
//     yearsOfService: 5,
//     startDate: '2020-03-01',
//     status: 'ทำงาน',
//     email: 'somchai@company.com',
//     phone: '081-234-5678',
//   },
//   {
//     id: 'emp-002',
//     code: 'EMP002',
//     firstName: 'สุดา',
//     lastName: 'รักงาน',
//     department: 'ฝ่ายพัฒนาซอฟต์แวร์',
//     position: 'Senior Developer',
//     baseSalary: 55000,
//     personalCapacity: 10000,
//     variablePayBase: 12000,
//     yearsOfService: 3,
//     startDate: '2022-06-15',
//     status: 'ทำงาน',
//     email: 'suda@company.com',
//     phone: '082-345-6789',
//   },
//   {
//     id: 'emp-003',
//     code: 'EMP003',
//     firstName: 'วิชัย',
//     lastName: 'มุ่งมั่น',
//     department: 'ฝ่ายบริการลูกค้า',
//     position: 'เจ้าหน้าที่บริการลูกค้า',
//     baseSalary: 28000,
//     personalCapacity: 3000,
//     variablePayBase: 5000,
//     yearsOfService: 2,
//     startDate: '2023-01-10',
//     status: 'ทำงาน',
//     email: 'vichai@company.com',
//     phone: '083-456-7890',
//   },
//   {
//     id: 'emp-004',
//     code: 'EMP004',
//     firstName: 'นิภา',
//     lastName: 'ขยันดี',
//     department: 'ฝ่ายทรัพยากรบุคคล',
//     position: 'HR Manager',
//     baseSalary: 40000,
//     personalCapacity: 6000,
//     variablePayBase: 8000,
//     yearsOfService: 4,
//     startDate: '2021-09-01',
//     status: 'ทำงาน',
//     email: 'nipa@company.com',
//     phone: '084-567-8901',
//   },
//   {
//     id: 'emp-005',
//     code: 'EMP005',
//     firstName: 'ธนกร',
//     lastName: 'เก่งการ',
//     department: 'ฝ่ายการเงิน',
//     position: 'นักบัญชีอาวุโส',
//     baseSalary: 38000,
//     personalCapacity: 5000,
//     variablePayBase: 7000,
//     yearsOfService: 6,
//     startDate: '2019-04-01',
//     status: 'ทำงาน',
//     email: 'thankorn@company.com',
//     phone: '085-678-9012',
//   },
// ];

// export const SEED_TEMPLATES: KPITemplate[] = [
//   {
//     id: 'tpl-001',
//     name: 'แม่แบบฝ่ายขาย',
//     department: 'ฝ่ายขาย',
//     period: 'รายไตรมาส',
//     createdAt: new Date().toISOString(),
//     definition: [
//       { id: 'k1', name: 'ยอดขายรายไตรมาส', weight: 35, targetValue: 3000000, unit: 'บาท', description: 'ยอดขายรวมเทียบกับเป้าหมาย' },
//       { id: 'k2', name: 'อัตราการรักษาลูกค้า', weight: 25, targetValue: 90, unit: '%', description: 'ลูกค้าเก่าที่ยังคงซื้อสินค้า' },
//       { id: 'k3', name: 'จำนวนลูกค้าใหม่', weight: 20, targetValue: 20, unit: 'ราย', description: 'จำนวนลูกค้าใหม่ที่ปิดการขายได้' },
//       { id: 'k4', name: 'ความพึงพอใจลูกค้า', weight: 10, targetValue: 90, unit: '%', description: 'คะแนน CSAT จากการสำรวจ' },
//       { id: 'k5', name: 'การทำงานเป็นทีม', weight: 10, targetValue: 5, unit: 'คะแนน', description: 'คะแนนจาก Peer Review (1-5)' },
//     ],
//   },
//   {
//     id: 'tpl-002',
//     name: 'แม่แบบฝ่าย Developer',
//     department: 'ฝ่ายพัฒนาซอฟต์แวร์',
//     period: 'รายไตรมาส',
//     createdAt: new Date().toISOString(),
//     definition: [
//       { id: 'k1', name: 'อัตราการทำงานเสร็จใน Sprint', weight: 30, targetValue: 100, unit: '%', description: 'งานที่เสร็จตาม Sprint Backlog' },
//       { id: 'k2', name: 'คุณภาพโค้ด (Bug Rate)', weight: 25, targetValue: 2, unit: 'บั๊ก/ฟีเจอร์', description: 'จำนวนบั๊กต่อฟีเจอร์ (น้อยกว่าดีกว่า)' },
//       { id: 'k3', name: 'การส่งงานตรงเวลา', weight: 20, targetValue: 95, unit: '%', description: 'เปอร์เซ็นต์งานที่ส่งตรงกำหนด' },
//       { id: 'k4', name: 'การ Review Code', weight: 15, targetValue: 100, unit: '%', description: 'ส่วนร่วมในการ Review Code ของทีม' },
//       { id: 'k5', name: 'คุณภาพเอกสาร', weight: 10, targetValue: 5, unit: 'คะแนน', description: 'คะแนนคุณภาพเอกสาร (1-5)' },
//     ],
//   },
//   {
//     id: 'tpl-003',
//     name: 'แม่แบบฝ่ายบริการลูกค้า',
//     department: 'ฝ่ายบริการลูกค้า',
//     period: 'รายเดือน',
//     createdAt: new Date().toISOString(),
//     definition: [
//       { id: 'k1', name: 'เวลาตอบสนองครั้งแรก (FRT)', weight: 25, targetValue: 30, unit: 'นาที', description: 'เวลาเฉลี่ยในการตอบสนองครั้งแรก (น้อยกว่าดี)' },
//       { id: 'k2', name: 'อัตราการแก้ปัญหาสำเร็จ', weight: 30, targetValue: 95, unit: '%', description: 'เคสที่แก้ปัญหาสำเร็จโดยไม่ต้องส่งต่อ' },
//       { id: 'k3', name: 'ความพึงพอใจ (CSAT)', weight: 25, targetValue: 4.5, unit: 'คะแนน', description: 'คะแนนความพึงพอใจจากลูกค้า (1-5)' },
//       { id: 'k4', name: 'จำนวนเคสที่รับผิดชอบ', weight: 10, targetValue: 80, unit: 'เคส', description: 'เคสที่รับผิดชอบต่อเดือน' },
//       { id: 'k5', name: 'การอบรมและพัฒนาตนเอง', weight: 10, targetValue: 4, unit: 'ชั่วโมง', description: 'ชั่วโมงการอบรมต่อเดือน' },
//     ],
//   },
// ];

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
