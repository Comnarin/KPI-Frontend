import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export {
  calculateKPIScore,
  getRatingLevel,
  getRatingBg,
  getAvatarColor,
  getEmployeeInitials,
  formatCurrency,
  calculateSalaryAdjustment,
} from '@/shared/lib/data';
export { generateSalaryApprovalPDF } from '@/shared/lib/pdfGenerator';
