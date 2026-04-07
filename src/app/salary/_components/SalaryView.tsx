'use client';

import { useState } from 'react';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useEmployees } from '@/shared/hooks/useEmployees';
import { usePeriods } from '@/shared/hooks/usePeriods';
import { useEvaluations } from '@/shared/hooks/useEvaluations';
import { useSalarySettings } from '@/shared/hooks/useSalarySettings';
import { useSalaryAdjustments } from '@/shared/hooks/useSalaryAdjustments';
import PageHeader from '@/shared/components/PageHeader';
import Modal from '@/shared/components/Modal';
import {
  Banknote, CheckCircle, AlertCircle, TrendingUp, Download, FileText,
  Sparkles, Settings2, Save, Info
} from 'lucide-react';
import {
  calculateSalaryAdjustment, formatCurrency, getRatingBg, getRatingLevel,
  getAvatarColor, getEmployeeInitials,
} from '@/shared/lib/data';
import { SalaryAdjustment, SalarySettings, RatingLevel } from '@/shared/types';
import { generateSalaryApprovalPDF } from '@/shared/lib/pdfGenerator';
import { useTranslation } from '@/shared/i18n/provider';
import NumberInput from '@/shared/components/NumberInput';

const SCORE_COLOR = (s: number) => {
  if (s >= 90) return '#059669';
  if (s >= 80) return '#2563eb';
  if (s >= 70) return '#d97706';
  if (s >= 60) return '#ea580c';
  return '#dc2626';
};

export default function SalaryView() {
  const { user } = useAppStore();
  const { adjustments: salaryAdjustments, addAdjustment, isLoading: isAdjLoading } = useSalaryAdjustments();
  const { employees: allEmployees, isLoading: isEmpLoading } = useEmployees();
  const { employees: activeEmployees } = useEmployees({ status: 'ACTIVE' });
  const [period, setPeriod] = useState('');

  const { periods, activePeriod, isLoading: isPeriodLoading } = usePeriods();
  const { evaluations, isLoading: isEvalLoading } = useEvaluations({ period });
  const { salarySettings, updateSalarySettings, isLoading: isSetLoading } = useSalarySettings();
  const { t } = useTranslation();

  const [selectedEmp, setSelectedEmp] = useState('');
  const [marketCorr, setMarketCorr] = useState(2);
  const [col, setCol] = useState(3);


  // Set default period to active period once loaded
  if (!period && activePeriod?.label) {
    setPeriod(activePeriod.label);
  }

  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<SalarySettings | null>(null);
  const [approvedAdj, setApprovedAdj] = useState<SalaryAdjustment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Eval for selected period per employee
  const periodEvalMap = new Map<string, number>();
  allEmployees.forEach(emp => {
    const evs = evaluations.filter(e => e.employeeId === emp.id && (!period || e.period === period));
    if (evs.length) {
      const latest = evs.sort((a, b) => (b.evaluatedAt ?? '').localeCompare(a.evaluatedAt ?? ''))[0];
      periodEvalMap.set(emp.id, latest.totalScore);
    }
  });

  const empForCalc = selectedEmp ? allEmployees.find(e => e.id === selectedEmp) : null;
  const empScore = empForCalc ? periodEvalMap.get(empForCalc.id) ?? null : null;
  const calc = empForCalc && empScore !== null && salarySettings
    ? calculateSalaryAdjustment(empForCalc, empScore, salarySettings, marketCorr, col) : null;

  async function handleApprove() {
    if (!calc || !empForCalc || empScore === null) return;
    const adj: Partial<SalaryAdjustment> = {
      employeeId: empForCalc.id,
      period,
      kpiScore: empScore,
      ratingLevel: getRatingLevel(empScore) as RatingLevel,
      meritPercent: calc.meritPercent,
      tenureBonus: calc.tenureBonus,
      marketCorrection: calc.marketCorrection,
      costOfLiving: calc.costOfLiving,
      totalAdjustmentPercent: calc.totalAdjustmentPercent,
      currentSalary: calc.currentSalary,
      recommendedSalary: calc.recommendedSalary,
      p3Amount: calc.p3Amount,
      approved: true,
    };
    try {
      const saved = await addAdjustment(adj);
      setApprovedAdj(saved);
      setSelectedEmp('');
    } catch (err) {
      alert('Failed to save salary adjustment');
    }
  }

  function handleDownloadPDF(adj: SalaryAdjustment) {
    const emp = allEmployees.find(e => e.id === adj.employeeId);
    if (!emp) return;
    setIsGenerating(true);
    setTimeout(() => { generateSalaryApprovalPDF(emp, adj); setIsGenerating(false); }, 400);
  }

  const openSettings = () => { setTempSettings(salarySettings ? { ...salarySettings } : null); setShowSettings(true); };
  const saveSettings = () => { if (tempSettings) { updateSalarySettings(tempSettings); setShowSettings(false); } };

  const totalBudgetIncrease = salaryAdjustments.filter(a => a.approved).reduce((s, a) => s + (a.recommendedSalary - a.currentSalary), 0);
  const ratingLevels: RatingLevel[] = ['ดีเยี่ยม', 'เกินเป้า', 'ได้เป้า', 'ต้องปรับปรุง', 'ไม่ผ่านเกณฑ์'];

  return (
    <div className="page-container">
      <PageHeader
        title={t('salary.title')}
        subtitle={t('salary.subtitle')}
        icon={Banknote}
        action={
          <button className="btn-secondary flex items-center gap-2" onClick={openSettings}>
            <Settings2 size={16} /> {t('salary.settings_btn')}
          </button>
        }
      />

      {isEmpLoading || isEvalLoading || isSetLoading || isPeriodLoading || isAdjLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : !salarySettings ? null : (
        <div className="grid grid-cols-3 gap-6">
        {/* Calculator Panel */}
        <div className="col-span-2">
          <div className="card-static p-7">
            <h2 className="text-base font-semibold text-slate-800 mb-6">{t('salary.calculator')}</h2>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="form-label">{t('salary.select_employee')}</label>
                <select className="input-field" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
                  <option value="">{t('salary.select_employee_placeholder')}</option>
                  {activeEmployees.map(emp => {
                    const score = periodEvalMap.get(emp.id);
                    const isAlreadyAdjusted = salaryAdjustments.some(adj => adj.employeeId === emp.id && adj.period === period);
                    return (
                      <option key={emp.id} value={emp.id} disabled={isAlreadyAdjusted}>
                        {emp.firstName} {emp.lastName} {isAlreadyAdjusted ? `(${t('salary.already_adjusted')})` : score !== undefined ? `(คะแนน: ${score})` : `(${t('salary.not_evaluated')})`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="form-label">{t('salary.period')}</label>
                <select className="input-field" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {periods.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">{t('salary.market_adj')}: {marketCorr}%</label>
                <input type="range" min={0} max={10} step={0.5} value={marketCorr} onChange={(e) => setMarketCorr(+e.target.value)}
                  className="w-full mt-1.5" />
              </div>
              <div>
                <label className="form-label">{t('salary.col_adj')}: {col}%</label>
                <input type="range" min={0} max={10} step={0.5} value={col} onChange={(e) => setCol(+e.target.value)}
                  className="w-full mt-1.5" />
              </div>
            </div>

            {empForCalc && calc ? (
              <div>
                {/* Employee header */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl">
                  <div className={`avatar avatar-lg bg-gradient-to-br ${getAvatarColor(empForCalc.id)}`}>
                    {getEmployeeInitials(empForCalc)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">{empForCalc.firstName} {empForCalc.lastName}</div>
                    <div className="text-xs text-slate-500">{empForCalc.position} · {empForCalc.department}</div>
                  </div>
                  {empScore !== null && (
                    <div className="text-right">
                      <div className="text-3xl font-extrabold" style={{ color: SCORE_COLOR(empScore) }}>{empScore}</div>
                      <span className={`badge ${getRatingBg(getRatingLevel(empScore))}`}>{getRatingLevel(empScore)}</span>
                    </div>
                  )}
                </div>

                {/* 3P Breakdown */}
                <div className="mb-6">
                  <div className="section-label">{t('salary.structure_3p')}</div>
                  <div className="space-y-2">
                    {[
                      { label: t('salary.p1_label'), val: empForCalc.baseSalary, color: 'text-indigo-600' },
                      { label: t('salary.p2_label'), val: empForCalc.personalCapacity, color: 'text-blue-600' },
                      { label: t('salary.p3_label'), val: calc.p3Amount, color: 'text-emerald-600' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <span className={`font-bold ${item.color}`}>{formatCurrency(item.val)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <span className="font-semibold text-slate-800">{t('salary.total_salary')}</span>
                      <span className="font-extrabold text-indigo-600">{formatCurrency(calc.currentSalary + calc.p3Amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Adjustment breakdown */}
                <div className="mb-6">
                  <div className="section-label">{t('salary.annual_adj')}</div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: t('salary.merit_kpi'), val: `+${calc.meritPercent}%`, color: 'text-emerald-600' },
                      { label: t('salary.tenure'), val: `+${calc.tenureBonus.toFixed(1)}%`, color: 'text-blue-600' },
                      { label: t('salary.market'), val: `+${marketCorr}%`, color: 'text-amber-600' },
                      { label: t('salary.cost_of_living'), val: `+${col}%`, color: 'text-orange-600' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className={`text-lg font-bold ${item.color}`}>{item.val}</div>
                        <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <Info size={14} className="text-blue-500" />
                    <span className="text-xs text-slate-500">
                      คำนวณอายุงาน {empForCalc.yearsOfService} ปี ({salarySettings.tenureRatePerYear}% ต่อปี, สูงสุดไม่เกิน {salarySettings.maxTenureBonus}%)
                    </span>
                  </div>
                </div>

                {/* Final result */}
                <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">{t('salary.current')}</div>
                      <div className="text-lg font-bold text-slate-700">{formatCurrency(calc.currentSalary)}</div>
                    </div>
                    <TrendingUp size={24} className="text-indigo-400" />
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">{t('salary.recommended')}</div>
                      <div className="text-2xl font-extrabold gradient-text">{formatCurrency(calc.recommendedSalary)}</div>
                      <div className="text-xs text-emerald-600 mt-0.5">
                        +{formatCurrency(calc.recommendedSalary - calc.currentSalary)} (+{calc.totalAdjustmentPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>

                <button className="btn-primary w-full py-3.5 text-base" onClick={handleApprove}>
                  <CheckCircle size={18} /> {t('salary.approve')}
                </button>
              </div>
            ) : empForCalc && empScore === null ? (
              <div className="py-12 text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-500">{t('salary.not_evaluated_msg')}</p>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Banknote size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">{t('salary.select_employee_msg')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Approved history */}
          <div className="card-static p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">{t('salary.approved_history')}</h2>
            {salaryAdjustments.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <AlertCircle size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">{t('salary.no_approvals')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {salaryAdjustments.slice(-6).reverse().map((adj) => {
                  const emp = allEmployees.find(e => e.id === adj.employeeId);
                  if (!emp) return null;
                  return (
                    <div key={adj.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`avatar avatar-sm bg-gradient-to-br ${getAvatarColor(emp.id)}`} style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                          {getEmployeeInitials(emp)}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-slate-700">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[10px] text-slate-400">{adj.period}</div>
                        </div>
                        <button onClick={() => handleDownloadPDF(adj)} title="ดาวน์โหลดเอกสาร PDF"
                          className="btn-icon text-xs" style={{ padding: '3px 6px' }}>
                          <Download size={12} /> PDF
                        </button>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{formatCurrency(adj.currentSalary)}</span>
                        <span className="text-emerald-600 font-semibold">→ {formatCurrency(adj.recommendedSalary)}</span>
                      </div>
                    </div>
                  );
                })}
                {salaryAdjustments.length > 0 && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-[10px] text-slate-500 mb-1">งบเพิ่มเติมทั้งหมด</div>
                    <div className="text-sm font-bold text-indigo-600">+{formatCurrency(totalBudgetIncrease)}</div>
                    <div className="text-[10px] text-slate-400">ต่อเดือน</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Merit table guide */}
          <div className="card-static p-5">
            <div className="section-label mb-3">{t('salary.merit_table')}</div>
            <div className="space-y-2">
              {ratingLevels.map((level) => (
                <div key={level} className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-600">{level}</span>
                  <span className={`text-sm font-bold ${salarySettings.meritMap[level] > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    +{salarySettings.meritMap[level]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title={t('salary.settings_title')} maxWidth={500}
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={() => setShowSettings(false)}>{t('common.cancel')}</button>
            <button className="btn-primary flex-1" onClick={saveSettings}><Save size={16} /> {t('salary.save_settings')}</button>
          </>
        }
      >
        {tempSettings && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-indigo-600 mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> การคำนวณตามอายุงาน (Tenure)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">ปรับต่อปี (%/ปี)</label>
                  <NumberInput
                    allowDecimal
                    value={tempSettings.tenureRatePerYear ?? 0}
                    onChange={(v) => setTempSettings({ ...tempSettings, tenureRatePerYear: v })}
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <label className="form-label">เพดานสูงสุด (%)</label>
                  <NumberInput
                    allowDecimal
                    value={tempSettings.maxTenureBonus ?? 0}
                    onChange={(v) => setTempSettings({ ...tempSettings, maxTenureBonus: v })}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                <Sparkles size={16} /> Merit Pay ตามผลประเมิน (KPI)
              </h3>
              <div className="space-y-3">
                {ratingLevels.map((level) => (
                  <div key={level} className="flex items-center gap-4">
                    <div className="flex-1 text-sm text-slate-600">{level}</div>
                    <div className="relative" style={{ width: 120 }}>
                      <NumberInput
                        className="input-field text-right"
                        style={{ paddingRight: 28 }}
                        value={tempSettings.meritMap[level] ?? 0}
                        onChange={(v) => setTempSettings({
                          ...tempSettings,
                          meritMap: { ...tempSettings.meritMap, [level]: v }
                        })}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval Success Modal */}
      {approvedAdj && (() => {
        const emp = allEmployees.find(e => e.id === approvedAdj.employeeId);
        if (!emp) return null;
        return (
          <Modal open={true} onClose={() => setApprovedAdj(null)} title="" maxWidth={480}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ animation: 'pulse-glow 2s infinite' }}>
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">{t('salary.approved_title')}</h2>
              <p className="text-sm text-slate-500">
                การปรับเงินเดือนสำหรับ <strong className="text-slate-800">{emp.firstName} {emp.lastName}</strong> ได้รับการอนุมัติแล้ว
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'คะแนน KPI', val: `${approvedAdj.kpiScore} / 100`, color: 'text-indigo-600' },
                { label: 'ระดับ', val: approvedAdj.ratingLevel, color: 'text-emerald-600' },
                { label: 'เงินเดือนเดิม', val: formatCurrency(approvedAdj.currentSalary), color: 'text-slate-500' },
                { label: 'เงินเดือนใหม่', val: formatCurrency(approvedAdj.recommendedSalary), color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 mb-1">{s.label}</div>
                  <div className={`font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <FileText size={20} className="text-indigo-500" />
                <div>
                  <div className="text-sm font-semibold text-slate-800">เอกสารอนุมัติพร้อมดาวน์โหลด</div>
                  <div className="text-xs text-slate-400">salary-approval-{emp.code}-{approvedAdj.period.replace('/', '-')}.pdf</div>
                </div>
              </div>
              <button className="btn-primary w-full" onClick={() => handleDownloadPDF(approvedAdj)} disabled={isGenerating}>
                {isGenerating ? <><Sparkles size={16} className="animate-spin" /> กำลังสร้างเอกสาร...</> : <><Download size={16} /> ดาวน์โหลดเอกสาร PDF</>}
              </button>
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setApprovedAdj(null)}>{t('salary.close')}</button>
              <button className="btn-primary flex-1" onClick={() => { handleDownloadPDF(approvedAdj); setApprovedAdj(null); }} disabled={isGenerating}>
                <Download size={14} /> ดาวน์โหลด & ปิด
              </button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
