'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useEmployees } from '@/shared/hooks/useEmployees';
import { useTemplates } from '@/shared/hooks/useTemplates';
import { useEvaluations } from '@/shared/hooks/useEvaluations';
import { useDepartments } from '@/shared/hooks/useDepartments';
import { usePeriods } from '@/shared/hooks/usePeriods';
import { useTranslation } from '@/shared/i18n/provider';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import Modal from '@/shared/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import {
  ClipboardCheck, Plus, Trash2, CheckCircle, Eye, X,
  User, Calendar, BarChart2, Award, FileText, AlertCircle,
} from 'lucide-react';
import { KPIActual, KPIItem, KPIEvaluation, RatingLevel, KPIDetail } from '@/shared/types';
import {
  calculateKPIScore, getRatingLevel, getRatingBg,
  getAvatarColor, getEmployeeInitials,
} from '@/shared/lib/data';
import NumberInput from '@/shared/components/NumberInput';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCORE_COLOR = (s: number) => {
  if (s >= 90) return '#059669';
  if (s >= 80) return '#2563eb';
  if (s >= 70) return '#d97706';
  if (s >= 60) return '#ea580c';
  return '#dc2626';
};

const SCORE_BG = (s: number) => {
  if (s >= 90) return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
  if (s >= 80) return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
  if (s >= 70) return 'linear-gradient(135deg, #fef3c7, #fde68a)';
  if (s >= 60) return 'linear-gradient(135deg, #ffedd5, #fed7aa)';
  return 'linear-gradient(135deg, #fee2e2, #fecaca)';
};

const ROLE_LABEL: Record<string, string> = {
  CEO: 'CEO',
  HR: 'ฝ่าย HR',
  HEAD_OF_DEPT: 'หัวหน้าแผนก',
  EMPLOYEE: 'พนักงาน',
  SUPERADMIN: 'Super Admin',
};

// ─── Score Detail Modal (centered popup) ─────────────────────────────────────

interface DetailModalProps {
  evaluation: KPIEvaluation;
  employeeName: string;
  employeeDept: string;
  employeeId: string;
  templateName: string;
  onClose: () => void;
}

function ScoreDetailModal({
  evaluation, employeeName, employeeDept, employeeId, templateName, onClose,
}: DetailModalProps) {
  // The actuals/breakdown is stored in evaluation.details (JSONB from backend)
  // It could be an array directly, or a string that needs JSON.parse
  let actuals: KPIDetail[] = [];
  const raw = evaluation.details;
  if (Array.isArray(raw)) {
    actuals = raw as KPIDetail[];
  } else if (typeof raw === 'string') {
    try { actuals = JSON.parse(raw); } catch { actuals = []; }
  } else if (typeof raw === 'object' && raw !== null) {
    // Might be wrapped: { actuals: [...] }
    const obj = raw as { actuals?: KPIDetail[] };
    actuals = Array.isArray(obj.actuals) ? obj.actuals : [];
  }

  const rating = (evaluation.ratingLevel || getRatingLevel(evaluation.totalScore)) as RatingLevel;
  const score = Math.round(evaluation.totalScore || 0);
  const evaluatorName = evaluation.evaluatorName || '—';
  const evaluatorRole = evaluation.evaluatorRole ? (ROLE_LABEL[evaluation.evaluatorRole] || evaluation.evaluatorRole) : '';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 60,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal box */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw', maxWidth: 560,
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          zIndex: 61,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
          @keyframes popIn {
            from { opacity:0; transform:translate(-50%,-48%) scale(0.94); }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
          }
        `}</style>

        {/* ── Hero Header ─────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '24px 24px 20px', color: '#fff', flexShrink: 0 }}>
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Employee + Score row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {/* Left: Employee info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div
                className={`avatar bg-gradient-to-br ${getAvatarColor(employeeId)}`}
                style={{ width: 48, height: 48, fontSize: '1rem', flexShrink: 0 }}
              >
                {employeeName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employeeName}</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{employeeDept}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{templateName} · {evaluation.period}</div>
              </div>
            </div>

            {/* Right: Score bubble */}
            <div style={{
              background: SCORE_BG(score),
              borderRadius: 16,
              padding: '12px 20px',
              textAlign: 'center',
              flexShrink: 0,
              minWidth: 90,
              border: `1.5px solid ${SCORE_COLOR(score)}33`,
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: SCORE_COLOR(score), textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>คะแนนรวม</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, lineHeight: 1, color: SCORE_COLOR(score) }}>{score}</div>
              <div style={{ fontSize: '0.7rem', color: SCORE_COLOR(score), opacity: 0.7 }}>/ 100</div>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${getRatingBg(rating)}`} style={{ fontSize: '0.68rem' }}>{rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Meta: Evaluator + Date ──────────────────────── */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Evaluator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {evaluatorName !== '—' ? evaluatorName.slice(0, 2).toUpperCase() : <User size={13} />}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ประเมินโดย</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                  {evaluatorName}
                  {evaluatorRole && (
                    <span style={{ marginLeft: 6, fontSize: '0.68rem', fontWeight: 600, background: '#e0e7ff', color: '#4338ca', borderRadius: 4, padding: '1px 6px' }}>
                      {evaluatorRole}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Date */}
            {(evaluation.evaluatedAt || evaluation.createdAt) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} style={{ color: '#94a3b8' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>วันที่ประเมิน</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                    {new Date(evaluation.evaluatedAt || evaluation.createdAt || '').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Indicator Breakdown (scrollable) ─────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <BarChart2 size={14} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ผลลัพธ์แต่ละตัวชี้วัด</span>
          </div>

          {actuals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
              <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>ไม่มีข้อมูลรายละเอียด</p>
              <p style={{ fontSize: '0.75rem', margin: '4px 0 0', color: '#cbd5e1' }}>การประเมินรุ่นเก่าอาจไม่มีข้อมูลนี้</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actuals.map((actual, idx: number) => {
                const name = actual.name || actual.kpiItemId || `ตัวชี้วัด ${idx + 1}`;
                const target = Number(actual.targetValue ?? 0);
                const value = Number(actual.actualValue ?? 0);
                const weight = Number(actual.weight ?? 0);
                const unit = actual.unit || '';
                const achievement = target > 0 ? Math.min((value / target) * 100, 120) : 0;
                const clampedAch = Math.min(achievement, 100);
                const contribution = weight > 0 ? (achievement / 100) * weight : 0;
                const clamped = Math.min(contribution, weight); // cap at weight

                return (
                  <div key={idx} style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid #f1f5f9',
                  }}>
                    {/* Name + weight badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#1e293b' }}>{name}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700,
                        background: '#e0e7ff', color: '#4338ca',
                        borderRadius: 6, padding: '2px 8px',
                      }}>น้ำหนัก {weight}%</span>
                    </div>

                    {/* Values row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ผลจริง: <strong style={{ color: '#1e293b', fontSize: '0.88rem' }}>{value} {unit}</strong>
                        <span style={{ color: '#94a3b8', marginLeft: 6 }}>/ เป้า {target} {unit}</span>
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: SCORE_COLOR(achievement) }}>
                        {Math.round(achievement)}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{
                        height: '100%',
                        width: `${clampedAch}%`,
                        background: SCORE_COLOR(achievement),
                        borderRadius: 99,
                        transition: 'width 0.7s ease',
                      }} />
                    </div>

                    {/* Contribution */}
                    {weight > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'right' }}>
                        คะแนนสมทบ:{' '}
                        <strong style={{ color: SCORE_COLOR(clamped), fontWeight: 700 }}>
                          {clamped.toFixed(1)}
                        </strong>
                        {' '}/ {weight} คะแนน
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes */}
          {evaluation.notes && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginBottom: 4 }}>💬 หมายเหตุ</div>
              <p style={{ fontSize: '0.82rem', color: '#78350f', margin: 0 }}>{evaluation.notes}</p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#fafafa', flexShrink: 0 }}>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            ปิด
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function EvaluationView() {
  const { user } = useAppStore();
  const { activePeriod } = usePeriods();
  const { employees: allEmployees, isLoading: isEmpLoading } = useEmployees();
  const { employees: activeEmployees } = useEmployees({
    status: 'ACTIVE',
    excludeEvaluatedPeriod: activePeriod?.label,
    evaluatorId: user?.id
  });
  const { templates, isLoading: isTplLoading } = useTemplates();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const { evaluations, addEvaluation, deleteEvaluation, isLoading: isEvalLoading } = useEvaluations({
    department: deptFilter,
    period: periodFilter,
  });
  const { departments, isLoading: isDeptLoading } = useDepartments();
  const { activePeriod: activePeriodData, isLoading: isPeriodLoading } = usePeriods();
  const { t } = useTranslation();

  const isCEO = user?.role === 'CEO' || user?.role === 'SUPERADMIN';
  const isHead = user?.role === 'HEAD_OF_DEPT';

  // ── New Evaluation Modal state ────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [selEmployee, setSelEmployee] = useState('');
  const [selTemplate, setSelTemplate] = useState('');
  const [actuals, setActuals] = useState<KPIActual[]>([]);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<{ score: number; rating: string } | null>(null);
  const [selectedEval, setSelectedEval] = useState<KPIEvaluation | null>(null);

  // ── Filtered evaluations (role-scoped + search + filters)
  const visibleEvaluations = useMemo(() => {
    let evals = [...evaluations];

    // Frontend Search (Search by employee name or evaluator name)
    if (search.trim()) {
      const q = search.toLowerCase();
      evals = evals.filter(ev => {
        const emp = allEmployees.find(e => e.id === ev.employeeId);
        const name = (emp ? `${emp.firstName} ${emp.lastName}` : ev.employeeName || '').toLowerCase();
        const evaluator = (ev.evaluatorName || '').toLowerCase();
        return name.includes(q) || evaluator.includes(q);
      });
    }

    return evals.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [evaluations, search, allEmployees]);

  // ── Employee list (Filtered by backend + Head of Dept scope) ──
  const availableEmployees = useMemo(() => {
    let filtered = activeEmployees;

    if (isHead && user?.departmentId) {
      filtered = activeEmployees.filter(e => e.department === user.departmentId);
    }

    return filtered;
  }, [activeEmployees, isHead, user?.departmentId]);

  function openModal() {
    setSelEmployee(''); setSelTemplate(''); setActuals([]); setNotes(''); setPreview(null);
    setModalOpen(true);
  }

  function handleTemplateSelect(tplId: string) {
    setSelTemplate(tplId);
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      setActuals((tpl.definition ?? []).map(k => ({ kpiItemId: k.id, actualValue: 0 })));
    }
  }

  function updateActual(kpiItemId: string, val: number) {
    const updated = actuals.map(x => x.kpiItemId === kpiItemId ? { ...x, actualValue: val } : x);
    setActuals(updated);
    const tpl = templates.find(t => t.id === selTemplate);
    if (tpl) {
      const score = calculateKPIScore(tpl.definition ?? [], updated);
      setPreview({ score, rating: getRatingLevel(score) });
    }
  }

  function handleSave() {
    if (!selEmployee || !selTemplate || actuals.length === 0 || !preview) return;
    const tpl = templates.find(t => t.id === selTemplate);

    // Build enriched actuals — stored in `details` (JSONB) so the backend persists them
    const detailsPayload = actuals.map(a => {
      const kpiDef = tpl?.definition?.find((k: KPIItem) => k.id === a.kpiItemId);
      return {
        kpiItemId: a.kpiItemId,
        actualValue: a.actualValue,
        name: kpiDef?.name || '',
        targetValue: kpiDef?.targetValue ?? 0,
        weight: kpiDef?.weight ?? 0,
        unit: kpiDef?.unit || '',
      };
    });

    addEvaluation({
      employeeId: selEmployee,
      templateId: selTemplate,
      period: activePeriod?.label || '',
      periodType: 'รายไตรมาส',
      // Send as `details` so GORM stores it in the JSONB column
      details: detailsPayload,
      notes,
      totalScore: preview.score,
      ratingLevel: preview.rating,
    });
    setModalOpen(false);
  }

  const selectedTemplate = templates.find(t => t.id === selTemplate);
  const isLoading = isEmpLoading || isTplLoading || isEvalLoading || isDeptLoading || isPeriodLoading;
  const noPeriod = !isLoading && !activePeriod;

  const uniquePeriods = useMemo(() => {
    const periods = new Set(evaluations.map(e => e.period).filter(Boolean));
    return [...periods].sort().reverse();
  }, [evaluations]);

  return (
    <>
      <div className="page-container">
        <PageHeader
          title={t('evaluation.title')}
          subtitle={t('evaluation.subtitle')}
          icon={ClipboardCheck}
          action={
            <button className="btn-primary" onClick={openModal} disabled={noPeriod}>
              <Plus size={16} />{t('evaluation.start')}
            </button>
          }
        />

        {/* ── No-period warning banner ──────────────────────── */}
        {noPeriod && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#fff7ed', border: '1px solid #fed7aa',
            borderRadius: 14, padding: '14px 18px', marginBottom: 8,
          }}>
            <AlertCircle size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>ยังไม่ได้กำหนดรอบการประเมิน</div>
              <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: 2 }}>
                กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่ารอบการประเมินก่อนเริ่มประเมิน KPI
              </div>
            </div>
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div style={{ maxWidth: 280, flex: '1 1 200px' }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="ค้นหาพนักงาน หรือ ผู้ประเมิน..."
            />
          </div>
          {isCEO && (
            <select
              className="input-field"
              style={{ maxWidth: 190 }}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">ทุกแผนก</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          {uniquePeriods.length > 0 && (
            <select
              className="input-field"
              style={{ maxWidth: 160 }}
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
            >
              <option value="">ทุกรอบ</option>
              {uniquePeriods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────── */}
        {isLoading ? (
          <div className="card-static p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : visibleEvaluations.length === 0 ? (
          <EmptyState message={t('evaluation.empty')} />
        ) : (
          <div className="card-static overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.employee')}</th>
                  <th>{t('common.department')}</th>
                  <th>{t('common.period')}</th>
                  <th>ประเมินโดย</th>
                  <th>{t('common.score')}</th>
                  <th>{t('common.rating')}</th>
                  <th>{t('common.date')}</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {visibleEvaluations.map((ev, idx) => {
                  const emp = allEmployees.find(e => e.id === ev.employeeId);
                  const name = emp ? `${emp.firstName} ${emp.lastName}` : ev.employeeName || '-';
                  const rating = (ev.ratingLevel || getRatingLevel(ev.totalScore)) as RatingLevel;
                  const dateStr = ev.createdAt
                    ? new Date(ev.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: '2-digit' })
                    : '-';

                  return (
                    <tr
                      key={ev.id || idx}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedEval(ev)}
                      className="hover:bg-slate-50"
                    >
                      {/* Employee */}
                      <td>
                        <div className="flex items-center gap-3">
                          {emp && (
                            <div className={`avatar avatar-sm bg-gradient-to-br ${getAvatarColor(emp.id)}`}>
                              {getEmployeeInitials(emp)}
                            </div>
                          )}
                          <span className="font-medium text-slate-800">{name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-slate-500">{emp?.department?.name || '-'}</td>
                      <td className="text-sm text-slate-600">{ev.period}</td>

                      {/* Evaluator */}
                      <td>
                        {ev.evaluatorName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.62rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                            }}>
                              {ev.evaluatorName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', lineHeight: 1.2 }}>{ev.evaluatorName}</div>
                              {ev.evaluatorRole && (
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ROLE_LABEL[ev.evaluatorRole] || ev.evaluatorRole}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      {/* Score */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: SCORE_COLOR(ev.totalScore) }}>
                            {Math.round(ev.totalScore)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>/ 100</span>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${getRatingBg(rating)}`}>{rating}</span>
                      </td>
                      <td className="text-sm text-slate-500" style={{ whiteSpace: 'nowrap' }}>{dateStr}</td>

                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            className="btn-icon"
                            onClick={() => setSelectedEval(ev)}
                            title="ดูรายละเอียด"
                            style={{ color: '#6366f1' }}
                          >
                            <Eye size={14} />
                          </button>
                          {isCEO && (
                            <button
                              className="btn-icon-danger"
                              onClick={() => deleteEvaluation(ev.id)}
                              title={t('common.delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── New Evaluation Modal ──────────────────────────── */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={t('evaluation.modal_title')}
          maxWidth={620}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
              <button className="btn-primary" onClick={handleSave} disabled={!selEmployee || !selTemplate || !preview}>
                <CheckCircle size={16} />{t('evaluation.save')}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('evaluation.select_employee')} *</label>
                <select className="input-field" value={selEmployee} onChange={(e) => {
                  setSelEmployee(e.target.value); setSelTemplate(''); setActuals([]); setPreview(null);
                }}>
                  <option value="">{t('evaluation.select_employee_placeholder')}</option>
                  {availableEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.department?.name || '-'})</option>
                  ))}
                </select>
                  <p className="mt-1 text-xs text-amber-600">แสดงเฉพาะพนักงานในแผนกที่คุณดูแล</p>
              </div>
              <div>
                <label className="form-label">{t('evaluation.select_template')} *</label>
                <select className="input-field" value={selTemplate} onChange={(e) => handleTemplateSelect(e.target.value)}>
                  <option value="">{t('evaluation.select_template_placeholder')}</option>
                  {templates
                    .filter(tpl => {
                      // Filter by department
                      const emp = allEmployees.find(e => e.id === selEmployee);
                      const deptMatch = !emp || tpl.departmentId === emp.departmentId || tpl.departmentId === '';

                      // Filter by period logic
                      // Match if template is global ('ALL') OR matches current active period label
                      const periodMatch = tpl.period === 'ALL' || tpl.period === activePeriod?.label;

                      return deptMatch && periodMatch;
                    })
                    .map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name} ({tpl.period === 'ALL' ? t('kpi.all_periods') : tpl.period})</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">{t('evaluation.period')}</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: activePeriod ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : '#fef3c7',
                borderRadius: 10, padding: '10px 14px',
                border: `1px solid ${activePeriod ? '#c7d2fe' : '#fde68a'}`,
              }}>
                <Calendar size={15} style={{ color: activePeriod ? '#6366f1' : '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: activePeriod ? '#6366f1' : '#92400e', marginBottom: 2 }}>
                    รอบการประเมินที่ระบบกำหนด
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: activePeriod ? '#3730a3' : '#92400e' }}>
                    {activePeriod?.label || 'ยังไม่ได้กำหนดรอบ — กรุณาติดต่อผู้ดูแล'}
                  </div>
                </div>
                {activePeriod && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, background: '#6366f1', color: '#fff',
                    borderRadius: 5, padding: '2px 7px', letterSpacing: '0.04em',
                  }}>AUTO</span>
                )}
              </div>
            </div>

            {/* KPI Inputs */}
            {selectedTemplate && actuals.length > 0 && (
              <div>
                <label className="form-label mb-3">{t('evaluation.actual_value')}</label>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {(selectedTemplate.definition ?? []).map((kpi: KPIItem, idx: number) => {
                    const actual = actuals.find(a => a.kpiItemId === kpi.id);
                    const achievement = kpi.targetValue > 0 ? Math.min(((actual?.actualValue || 0) / kpi.targetValue) * 100, 120) : 0;
                    return (
                      <div key={kpi.id || idx} className="bg-slate-50 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-slate-700">{kpi.name}</span>
                            <span className="text-xs text-slate-400 ml-2">เป้า: {kpi.targetValue} {kpi.unit} · น้ำหนัก: {kpi.weight}%</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: SCORE_COLOR(achievement) }}>
                            {Math.round(achievement)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <NumberInput
                            className="input-field"
                            style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                            allowDecimal
                            placeholder={`ผลจริง (${kpi.unit})`}
                            value={actual?.actualValue || 0}
                            onChange={(v) => updateActual(kpi.id, v)}
                          />
                          <div className="progress-bar flex-1" style={{ height: 6 }}>
                            <div className="progress-fill" style={{ width: `${Math.min(achievement, 100)}%`, background: SCORE_COLOR(achievement) }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {preview && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: SCORE_BG(preview.score), border: `1px solid ${SCORE_COLOR(preview.score)}33` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award size={16} style={{ color: SCORE_COLOR(preview.score) }} />
                        <span className="text-sm font-semibold" style={{ color: SCORE_COLOR(preview.score) }}>{t('evaluation.result')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-extrabold" style={{ color: SCORE_COLOR(preview.score) }}>
                          {preview.score}
                        </span>
                        <span className={`badge ${getRatingBg(preview.rating as RatingLevel)}`}>{preview.rating}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="form-label">{t('evaluation.notes')}</label>
              <textarea className="input-field" rows={2} placeholder={t('evaluation.notes_placeholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </Modal>
      </div>

      {/* ── Score Detail Centered Popup ── */}
      {selectedEval && (() => {
        const emp = allEmployees.find(e => e.id === selectedEval.employeeId);
        const tpl = templates.find(t => t.id === selectedEval.templateId);
        return (
          <ScoreDetailModal
            evaluation={selectedEval}
            employeeName={emp ? `${emp.firstName} ${emp.lastName}` : selectedEval.employeeName || '-'}
            employeeDept={emp?.department?.name || '-'}
            employeeId={emp?.id || ''}
            templateName={tpl?.name || '-'}
            onClose={() => setSelectedEval(null)}
          />
        );
      })()}
    </>
  );
}
