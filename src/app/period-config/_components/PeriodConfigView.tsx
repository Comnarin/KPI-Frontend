'use client';

import { useState } from 'react';
import { usePeriods } from '@/shared/hooks/usePeriods';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useTranslation } from '@/shared/i18n/provider';
import PageHeader from '@/shared/components/PageHeader';
import {
  CalendarClock, CheckCircle, Save, AlertTriangle, Clock, Calendar,
  Shield, Edit3, Plus, Trash2, X
} from 'lucide-react';
import { TenantPeriod } from '@/shared/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPeriodExpired(periodEnd?: string): boolean {
  if (!periodEnd) return false;
  return new Date(periodEnd) < new Date();
}

function isPeriodEndingSoon(periodEnd?: string): boolean {
  if (!periodEnd) return false;
  const daysDiff = (new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysDiff > 0 && daysDiff <= 7;
}

function getDaysRemaining(periodEnd?: string): number | null {
  if (!periodEnd) return null;
  const diff = Math.ceil((new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PeriodConfigView() {
  const { t, locale } = useTranslation();
  const { hasPermission, permissions } = useAppStore();
  const { periods, activePeriod, isLoading, createPeriod, updatePeriod, deletePeriod, setActivePeriod } = usePeriods();

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr.startsWith('0001')) return '—';
    return new Date(dateStr).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canManage = hasPermission('manage_period');
  const daysRemaining = getDaysRemaining(activePeriod?.endDate);

  function openCreateModal() {
    setEditingId(null);
    setLabel('');
    setStartDate('');
    setEndDate('');
    setError('');
    setModalOpen(true);
  }

  function openEditModal(p: TenantPeriod) {
    setEditingId(p.id);
    setLabel(p.label);
    setStartDate(p.startDate ? p.startDate.slice(0, 10) : '');
    setEndDate(p.endDate ? p.endDate.slice(0, 10) : '');
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!label.trim()) {
      setError(t('period.label_required'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        label: label.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      if (editingId) {
        await updatePeriod(editingId, payload);
      } else {
        await createPeriod(payload);
      }
      setModalOpen(false);
    } catch {
      setError(t('period.save_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm(t('period.delete_confirm'))) {
      try {
        await deletePeriod(id);
      } catch (err) {
        alert(t('period.delete_error'));
      }
    }
  }

  return (
    <div className="page-container">
      <style>{`
        .period-table { width: 100%; border-collapse: collapse; }
        .period-table th { text-align: left; padding: 14px 16px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-weight: 600; font-size: 0.8125rem; }
        .period-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
        .badge.active { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .badge.inactive { background: #f1f5f9; color: #64748b; }
      `}</style>

      <PageHeader
        title={t('period.title')}
        subtitle={t('period.subtitle')}
        icon={CalendarClock}
        action={
          canManage && (
            <button className="btn-primary" onClick={openCreateModal}>
              <Plus size={16} /> {t('period.create_new')}
            </button>
          )
        }
      />

      {!canManage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12,
          padding: '12px 16px', marginBottom: 24,
        }}>
          <Shield size={15} style={{ color: '#ea580c', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', color: '#9a3412' }}>
            {t('period.no_permission')}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Active Period Banner */}
          <div className="card-static" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              background: activePeriod ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#fef3c7',
              padding: '24px 32px',
              color: activePeriod ? '#fff' : '#92400e',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: activePeriod ? '#94a3b8' : '#b45309', marginBottom: 8 }}>
                  {t('period.system_status')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>
                    {activePeriod ? activePeriod.label : t('period.no_active_period')}
                  </span>
                  {activePeriod && (
                    <span className="badge active">
                      <CheckCircle size={12} /> {t('period.activated')}
                    </span>
                  )}
                </div>
              </div>

              {activePeriod && daysRemaining !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 12,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid rgba(255,255,255,0.1)`
                }}>
                  <Clock size={20} style={{ color: daysRemaining < 0 ? '#ef4444' : daysRemaining <= 7 ? '#f97316' : '#a5b4fc' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('period.remaining_time')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: daysRemaining < 0 ? '#ef4444' : '#fff' }}>
                      {daysRemaining < 0 
                        ? t('period.overdue', { days: Math.abs(daysRemaining) }) 
                        : t('period.days_remaining', { days: daysRemaining })}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!activePeriod && (
              <div style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
                <AlertTriangle size={15} style={{ color: '#d97706' }} />
                <span style={{ fontSize: '0.875rem', color: '#b45309' }}>{t('period.no_active_warning')}</span>
              </div>
            )}
          </div>

          {/* Periods Table */}
          <div className="card-static" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>{t('period.table_title')}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="period-table">
                <thead>
                  <tr>
                    <th>{t('period.status')}</th>
                    <th>{t('period.label')}</th>
                    <th>{t('period.start_date')}</th>
                    <th>{t('period.end_date')}</th>
                    <th style={{ textAlign: 'right' }}>{t('period.manage')}</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                        {t('period.no_data')}
                      </td>
                    </tr>
                  ) : (
                    periods.map(p => (
                      <tr key={p.id} style={{ background: p.isActive ? '#f8fafc' : 'transparent' }}>
                        <td>
                          {p.isActive ? (
                            <span className="badge active"><CheckCircle size={12}/> {t('period.status_active')}</span>
                          ) : (
                            <span className="badge inactive">{t('period.status_pending')}</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.label}</div>
                        </td>
                        <td>{formatDate(p.startDate)}</td>
                        <td>
                          {formatDate(p.endDate)}
                          {isPeriodExpired(p.endDate) && (
                            <span style={{ color: '#ef4444', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>{t('period.expired')}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {canManage && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              {!p.isActive && (
                                <button 
                                  onClick={() => setActivePeriod(p.id)}
                                  style={{ padding: '6px 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                                  {t('period.activate')}
                                </button>
                              )}
                              <button onClick={() => openEditModal(p)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            overflow: 'hidden', animation: 'slideIn 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                {editingId ? t('period.edit_title') : t('period.add_title')}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  {t('period.label_field')}
                </label>
                <input
                  className="input-field"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder={t('period.label_placeholder')}
                  disabled={saving}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    {t('period.start_date_field')}
                  </label>
                  <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={saving} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    {t('period.end_date_field')}
                  </label>
                  <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={saving} />
                </div>
              </div>

              {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.8125rem', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>{t('common.cancel')}</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving || !label.trim()}>
                  {saving ? t('period.saving') : t('period.save_btn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
