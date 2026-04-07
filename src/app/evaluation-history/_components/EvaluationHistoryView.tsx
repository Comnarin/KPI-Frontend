'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useEmployees } from '@/shared/hooks/useEmployees';
import { useEvaluations } from '@/shared/hooks/useEvaluations';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDepartments } from '@/shared/hooks/useDepartments';
import { usePeriods } from '@/shared/hooks/usePeriods';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import EmptyState from '@/shared/components/EmptyState';
import { History, Trash2 } from 'lucide-react';
import { getRatingLevel, getRatingBg, getAvatarColor, getEmployeeInitials } from '@/shared/lib/data';
import { useTranslation } from '@/shared/i18n/provider';

export default function EvaluationHistoryView() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { employees, isLoading: isEmpLoading } = useEmployees();
  const { evaluations, deleteEvaluation, isLoading: isEvalLoading } = useEvaluations({
    q: debouncedSearch,
    department: deptFilter,
    period: periodFilter,
  });
  const { departments, isLoading: isDeptLoading } = useDepartments();
  const { periods, isLoading: isPeriodLoading } = usePeriods();
  const isCEO = user?.role === 'CEO' || user?.role === 'SUPERADMIN';

  // Role-based filtering: regular users only see their evaluations
  const visibleEvaluations = useMemo(() => {
    // Sort by newest first
    return [...evaluations].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [evaluations]);

  return (
    <div className="page-container">
      <PageHeader
        title={t('evaluation_history.title')}
        subtitle={t('evaluation_history.subtitle')}
        icon={History}
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="max-w-sm flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('evaluation_history.search')}
          />
        </div>
        
        {/* Period Filter */}
        <select
          className="input-field"
          style={{ maxWidth: 200 }}
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
        >
          <option value="">ทุกรอบการประเมิน</option>
          {periods.map((p) => (
            <option key={p.id} value={p.label}>
              {p.label} {p.isActive ? '(Active)' : ''}
            </option>
          ))}
        </select>

        {/* Department Filter (CEO only) */}
        {isCEO && (
          <select
            className="input-field"
            style={{ maxWidth: 200 }}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">{t('evaluation_history.all_departments')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {isEmpLoading || isEvalLoading || isDeptLoading || isPeriodLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : visibleEvaluations.length === 0 ? (
        <EmptyState message={t('evaluation_history.empty')} />
      ) : (
        <div className="card-static overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.employee')}</th>
                <th>{t('common.department')}</th>
                <th>{t('common.period')}</th>
                <th>{t('common.score')}</th>
                <th>{t('common.rating')}</th>
                <th>{t('common.date')}</th>
                {isCEO && <th style={{ textAlign: 'right' }}>{t('common.manage')}</th>}
              </tr>
            </thead>
            <tbody>
              {visibleEvaluations.map((ev, idx) => {
                const emp = employees.find((e) => e.id === ev.employeeId);
                const name = emp
                  ? `${emp.firstName} ${emp.lastName}`
                  : ev.employeeName || '-';
                const rating = getRatingLevel(ev.totalScore);
                const dateStr = ev.createdAt
                  ? new Date(ev.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                  : '-';

                return (
                  <tr key={ev.id || idx}>
                    <td>
                      <div className="flex items-center gap-3">
                        {emp && (
                          <div
                            className={`avatar avatar-sm bg-gradient-to-br ${getAvatarColor(emp.id)}`}
                          >
                            {getEmployeeInitials(emp)}
                          </div>
                        )}
                        <span className="font-medium text-slate-800">{name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-slate-500">
                      {emp?.department || '-'}
                    </td>
                    <td className="text-sm text-slate-500">{ev.period}</td>
                    <td>
                      <span
                        className="text-lg font-bold"
                        style={{
                          color:
                            ev.totalScore >= 90
                              ? '#059669'
                              : ev.totalScore >= 80
                                ? '#2563eb'
                                : ev.totalScore >= 70
                                  ? '#d97706'
                                  : ev.totalScore >= 60
                                    ? '#ea580c'
                                    : '#dc2626',
                        }}
                      >
                        {ev.totalScore}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getRatingBg(rating)}`}>
                        {rating}
                      </span>
                    </td>
                    <td className="text-sm text-slate-400">{dateStr}</td>
                    {isCEO && (
                      <td>
                        <div className="flex items-center justify-end">
                          <button
                            className="btn-icon-danger"
                            onClick={() => deleteEvaluation(ev.id)}
                            title={t('common.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
