'use client';

import { useState } from 'react';

import useSWR from 'swr';
import { api } from '@/shared/api';
import { useAppStore } from '@/shared/stores/useAppStore';
import { usePeriods } from '@/shared/hooks/usePeriods';
import { useTranslation } from '@/shared/i18n/provider';
import PageHeader from '@/shared/components/PageHeader';
import { LayoutDashboard, Users, ClipboardCheck, TrendingUp, DollarSign, AlertCircle, Award, Calendar, ChevronDown, Check } from 'lucide-react';
import { formatCurrency, getAvatarColor } from '@/shared/lib/data';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const fetcher = (url: string) => api.get<DashboardStats>(url);

const SCORE_COLOR = (s: number) => {
  if (s >= 90) return '#059669';
  if (s >= 80) return '#2563eb';
  if (s >= 70) return '#d97706';
  if (s >= 60) return '#ea580c';
  return '#dc2626';
};

const getRatingBg = (rating: string) => {
  switch (rating) {
    case 'ดีเยี่ยม': return 'badge-emerald';
    case 'เกินเป้า': return 'badge-blue';
    case 'ได้เป้า': return 'badge-amber';
    case 'ต้องปรับปรุง': return 'badge-orange';
    case 'ไม่ผ่านเกณฑ์': return 'badge-red';
    default: return 'badge-slate';
  }
};

interface DashboardStats {
  totalEmployees: number;
  evaluatedCount: number;
  averageScore: number;
  totalSalaryBudget: number;
  barData: { name: string; score: number }[];
  radarData: { subject: string; value: number }[];
  ratingDist: { level: string; count: number }[];
  recentEvaluations: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    position: string;
    totalScore: number;
    ratingLevel: string;
    evaluatedAt: string;
  }[];
}

export default function DashboardView() {
  const { user } = useAppStore();
  const { t } = useTranslation();
  const isCEO = user?.role === 'CEO' || user?.role === 'SUPERADMIN';
  const period = `${new Date().getFullYear()} - Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

  const { periods } = usePeriods();
  const [periodFilter, setPeriodFilter] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: stats, isLoading, error } = useSWR<DashboardStats>(
    periodFilter ? `/dashboard/stats?period=${encodeURIComponent(periodFilter)}` : '/dashboard/stats',
    fetcher
  );

  const totalBudget = stats?.totalSalaryBudget ?? 0;

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-2">
        <AlertCircle size={32} />
        <p>{t('common.error_loading') || 'Failed to load dashboard data'}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        icon={LayoutDashboard}
        action={
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-indigo-100"
            >
              <Calendar size={16} />
              {periodFilter ? periods.find(p => p.label === periodFilter)?.label : (t('dashboard.all_periods') || 'All Periods')}
              <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden text-sm flex flex-col py-1.5 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => { setPeriodFilter(''); setDropdownOpen(false); }}
                    className={`px-4 py-2.5 text-left flex justify-between items-center hover:bg-slate-50 transition-colors ${!periodFilter ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-600'}`}
                  >
                    {t('dashboard.all_periods') || 'All Periods'}
                    {!periodFilter && <Check size={16} />}
                  </button>
                  {periods.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setPeriodFilter(p.label); setDropdownOpen(false); }}
                      className={`px-4 py-2.5 text-left flex justify-between items-center hover:bg-slate-50 transition-colors ${periodFilter === p.label ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-600'}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span>{p.label}</span>
                        {p.isActive && <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Active Period</span>}
                      </div>
                      {periodFilter === p.label && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: t('dashboard.total_employees'), value: stats.totalEmployees, unit: t('dashboard.unit_people'), icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: t('dashboard.evaluated'), value: stats.evaluatedCount, unit: t('dashboard.unit_people'), icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-600' },
          { label: t('dashboard.avg_score'), value: stats.averageScore, unit: t('dashboard.unit_score'), icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
          { label: t('dashboard.budget'), value: formatCurrency(totalBudget), unit: t('dashboard.unit_month'), icon: DollarSign, color: 'bg-violet-50 text-violet-600' },
        ].map((stat, i) => (
          <div key={stat.label} className="stat-card animate-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                <span className="text-xs text-slate-400">{stat.unit}</span>
              </div>
            </div>
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {/* Bar Chart */}
        <div className="col-span-2 card-static p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-800">{t('dashboard.kpi_by_person')}</h2>
          </div>
          {stats.barData.some(d => d.score > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.barData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Bar
                  dataKey="score"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                  name={t('dashboard.score_label')}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <AlertCircle size={32} className="mb-2" />
              <p className="text-sm">{t('dashboard.no_data')}</p>
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="card-static p-6">
          <div className="flex items-center gap-2 mb-6">
            <Award size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-800">{t('dashboard.team_capacity')}</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={stats.radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={t('dashboard.radar_label')}
                dataKey="value"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-2 gap-5">
        {/* Rating Distribution */}
        <div className="card-static p-6">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardCheck size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-800">{t('dashboard.rating_distribution')}</h2>
          </div>
          <div className="space-y-3">
            {stats.ratingDist.map(r => (
              <div key={r.level} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-700 font-medium">{r.level}</span>
                <span className={`text-sm font-semibold ${r.count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {r.count} {t('common.people')} ({stats.evaluatedCount > 0 ? Math.round((r.count / stats.evaluatedCount) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="card-static overflow-hidden">
          <div className="flex items-center gap-2 p-6 pb-4">
            <ClipboardCheck size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-800">{t('dashboard.recent_evaluations')}</h2>
          </div>
          {stats.recentEvaluations.length === 0 ? (
            <div className="px-6 pb-6 text-center text-sm text-slate-400 py-8">
              {t('dashboard.no_data')}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.employee')}</th>
                  <th>{t('common.position')}</th>
                  <th>{t('common.score')}</th>
                  <th>{t('common.rating')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvaluations.map((ev, idx) => {
                  return (
                    <tr key={ev.id || idx}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`avatar avatar-sm bg-gradient-to-br ${getAvatarColor(ev.employeeId)}`}>
                            {ev.firstName.slice(0, 1).toUpperCase()}{ev.lastName.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{ev.firstName} {ev.lastName}</span>
                        </div>
                      </td>
                      <td className="text-slate-500 text-sm">{ev.position}</td>
                      <td>
                        <span className="text-lg font-bold" style={{ color: SCORE_COLOR(ev.totalScore) }}>
                          {ev.totalScore}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRatingBg(ev.ratingLevel)}`}>{ev.ratingLevel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
