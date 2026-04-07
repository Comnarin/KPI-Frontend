'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useTranslation } from '@/shared/i18n/provider';
import { api } from '@/shared/api';
import { RolePermission } from '@/shared/types';
import PageHeader from '@/shared/components/PageHeader';
import { ShieldCheck, CheckCircle, XCircle, Save, Info } from 'lucide-react';

import { usePermissions } from '@/shared/hooks/usePermissions';

// Configurable roles (not EMPLOYEE — they inherit from what's set)
const ROLES = ['CEO', 'HR', 'HEAD_OF_DEPT', 'EMPLOYEE'] as const;

const ROLE_LABELS: Record<string, string> = {
  CEO:          'permissions.role_ceo',
  HR:           'permissions.role_hr',
  HEAD_OF_DEPT: 'permissions.role_head',
  EMPLOYEE:     'permissions.role_employee',
};

const ROLE_COLORS: Record<string, string> = {
  CEO:          '#ef4444',
  HR:           '#3b82f6',
  HEAD_OF_DEPT: '#f97316',
  EMPLOYEE:     '#94a3b8',
};

interface PermissionDef {
  key: string;
  labelKey: string;
  category: string;
}

const PERMISSIONS: PermissionDef[] = [
  { key: 'view_dashboard',  labelKey: 'permissions.perm_view_dashboard',  category: 'permissions.cat_overview' },
  { key: 'crud_employee',   labelKey: 'permissions.perm_crud_employee',   category: 'permissions.cat_employees' },
  { key: 'crud_department', labelKey: 'permissions.perm_crud_department', category: 'permissions.cat_employees' },
  { key: 'crud_template',   labelKey: 'permissions.perm_crud_template',   category: 'permissions.cat_kpi' },
  { key: 'eval_kpi',        labelKey: 'permissions.perm_eval_kpi',        category: 'permissions.cat_kpi' },
  { key: 'approve_salary',  labelKey: 'permissions.perm_approve_salary',  category: 'permissions.cat_salary' },
  { key: 'manage_users',    labelKey: 'permissions.perm_manage_users',    category: 'permissions.cat_system' },
  { key: 'manage_settings', labelKey: 'permissions.perm_manage_settings', category: 'permissions.cat_system' },
  { key: 'manage_period',   labelKey: 'permissions.perm_manage_period',   category: 'permissions.cat_system' },
];

const CATEGORIES = ['permissions.cat_overview', 'permissions.cat_employees', 'permissions.cat_kpi', 'permissions.cat_salary', 'permissions.cat_system'];

export default function PermissionsView() {
  const { user } = useAppStore();
  const { t } = useTranslation();
  const { permissions: backendPerms, isLoading, updatePermissions } = usePermissions();

  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync SWR data to local edit state once loaded
  useEffect(() => {
    if (backendPerms.length > 0) {
      const expanded: RolePermission[] = [];
      for (const role of ROLES) {
        for (const perm of PERMISSIONS) {
          const found = backendPerms.find(p => p.role === role && p.permissionKey === perm.key);
          expanded.push(found ?? {
            role,
            permissionKey: perm.key,
            allowed: role === 'CEO',
            tenantId: user?.tenantId || '',
          });
        }
      }
      setPermissions(expanded);
    }
  }, [backendPerms, user?.tenantId]);

  function toggle(role: string, permKey: string) {
    if (role === 'CEO') return;
    setPermissions(prev =>
      prev.map(p =>
        p.role === role && p.permissionKey === permKey
          ? { ...p, allowed: !p.allowed }
          : p
      )
    );
  }

  function getVal(role: string, permKey: string) {
    if (role === 'CEO') return true;
    return permissions.find(p => p.role === role && p.permissionKey === permKey)?.allowed ?? false;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updatePermissions(permissions);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert(t('permissions.save_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title={t('permissions.title')}
        subtitle={t('permissions.subtitle')}
        icon={ShieldCheck}
        action={
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saved
              ? <><CheckCircle size={16} /> {t('permissions.saved')}</>
              : <><Save size={16} /> {saving ? t('permissions.saving') : t('permissions.save')}</>
            }
          </button>
        }
      />

      {/* CEO lock notice */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12,
        padding: '12px 16px', marginBottom: 28,
      }}>
        <Info size={15} style={{ color: '#ea580c', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#9a3412' }}>
          {t('permissions.ceo_notice')}
        </span>
      </div>

      {isLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="card-static overflow-hidden">
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px repeat(4, 1fr)',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0',
          }}>
            <div style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
              {t('permissions.permission_label')}
            </div>
            {ROLES.map(role => (
              <div key={role} style={{
                padding: '14px 20px',
                textAlign: 'center',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: ROLE_COLORS[role],
                borderLeft: '1px solid #f1f5f9',
              }}>
                {t(ROLE_LABELS[role])}
              </div>
            ))}
          </div>

          {/* Group by category */}
          {CATEGORIES.map(cat => {
            const catPerms = PERMISSIONS.filter(p => p.category === cat);
            return (
              <div key={cat}>
                {/* Category header */}
                <div style={{
                  padding: '8px 20px',
                  background: '#f1f5f9',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0',
                  borderTop: '1px solid #e2e8f0',
                }}>
                  {t(cat)}
                </div>

                {catPerms.map((perm, idx) => (
                  <div
                    key={perm.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px repeat(4, 1fr)',
                      borderBottom: idx < catPerms.length - 1 ? '1px solid #f8fafc' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ padding: '13px 20px', fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
                      {t(perm.labelKey)}
                    </div>

                    {ROLES.map(role => {
                      const isOn = getVal(role, perm.key);
                      const isCEO = role === 'CEO';
                      return (
                        <div key={role} style={{ padding: '13px 20px', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>
                          <button
                            onClick={() => toggle(role, perm.key)}
                            disabled={isCEO}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: isCEO ? 'not-allowed' : 'pointer',
                              padding: 0,
                              opacity: isCEO ? 0.5 : 1,
                              transition: 'transform 0.15s',
                            }}
                            onMouseEnter={e => { if (!isCEO) (e.currentTarget.style.transform = 'scale(1.2)'); }}
                            onMouseLeave={e => { (e.currentTarget.style.transform = 'scale(1)'); }}
                            title={isCEO ? t('permissions.ceo_all_access') : isOn ? t('permissions.click_to_disable') : t('permissions.click_to_enable')}
                          >
                            {isOn
                              ? <CheckCircle size={20} style={{ color: '#10b981' }} />
                              : <XCircle size={20} style={{ color: '#cbd5e1' }} />
                            }
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 160 }}>
          {saved
            ? <><CheckCircle size={16} /> {t('permissions.saved')}</>
            : <><Save size={16} /> {saving ? t('permissions.saving') : t('permissions.save')}</>
          }
        </button>
      </div>
    </div>
  );
}
