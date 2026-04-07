'use client';

import { useState } from 'react';
import { useUsers } from '@/shared/hooks/useUsers';
import { useDepartments } from '@/shared/hooks/useDepartments';
import { useTranslation } from '@/shared/i18n/provider';
import { useDebounce } from '@/shared/hooks/useDebounce';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import Modal from '@/shared/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import { UserCog, Plus, Edit2, Trash2, CheckCircle, Shield, Mail, Key, User, Building2 } from 'lucide-react';
import { SystemUser } from '@/shared/types';

const ROLE_COLORS: Record<string, string> = {
  CEO: 'badge-red',
  HR: 'badge-blue',
  HEAD_OF_DEPT: 'badge-orange',
  EMPLOYEE: 'badge-slate',
};

const ROLE_LABELS: Record<string, string> = {
  CEO: 'CEO',
  HR: 'HR',
  HEAD_OF_DEPT: 'หัวหน้าแผนก',
  EMPLOYEE: 'พนักงาน',
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_BG: Record<string, string> = {
  CEO: 'from-red-500 to-rose-600',
  HR: 'from-blue-500 to-indigo-600',
  HEAD_OF_DEPT: 'from-amber-500 to-orange-600',
  EMPLOYEE: 'from-slate-400 to-slate-600',
};

export default function AccountsView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { users, isLoading, createUser, updateUser, deleteUser } = useUsers({ q: debouncedSearch });
  const { departments } = useDepartments();
  const { t } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'EMPLOYEE', departmentId: '' });
  const [saving, setSaving] = useState(false);

  const filtered = users;

  function openAdd() {
    setEditing(null);
    setForm({ email: '', fullName: '', password: '', role: 'EMPLOYEE', departmentId: '' });
    setModalOpen(true);
  }

  function openEdit(u: SystemUser) {
    setEditing(u);
    setForm({ email: u.email, fullName: u.fullName, password: '', role: u.role, departmentId: u.departmentId || '' });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await updateUser(editing.id, { fullName: form.fullName, role: form.role, departmentId: form.departmentId });
      } else {
        await createUser({ email: form.email, password: form.password, fullName: form.fullName, role: form.role, departmentId: form.departmentId });
      }
      setModalOpen(false);
    } catch (err) {
      alert(String(err).replace('Error: ', ''));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: SystemUser) {
    if (!confirm(t('accounts.confirm_delete'))) return;
    await deleteUser(u.id);
  }

  return (
    <div className="page-container">
      <PageHeader
        title={t('accounts.title')}
        subtitle={t('accounts.subtitle').replace('{count}', String(users.length))}
        icon={UserCog}
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} />{t('accounts.add')}
          </button>
        }
      />

      {/* Info banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
        border: '1px solid #c7d2fe',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <Shield size={16} style={{ color: '#4f46e5', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
          {t('accounts.no_access_note')}
        </span>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder={t('accounts.search')} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={t('accounts.empty')} />
      ) : (
        <div className="card-static overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.employee')}</th>
                <th>อีเมล</th>
                <th>ตำแหน่งระบบ</th>
                <th style={{ textAlign: 'right' }}>{t('common.manage')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`avatar avatar-sm bg-gradient-to-br ${AVATAR_BG[u.role] || AVATAR_BG.EMPLOYEE}`}>
                        {initials(u.fullName)}
                      </div>
                      <div className="font-medium text-slate-800">{u.fullName}</div>
                    </div>
                  </td>
                  <td className="text-sm text-slate-500">{u.email}</td>
                  <td>
                    <div>
                      <span className={`badge ${ROLE_COLORS[u.role] || 'badge-slate'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                      {u.role === 'HEAD_OF_DEPT' && u.departmentId && (
                        <span className="ml-2 text-xs text-slate-400">
                          ({departments.find(d => d.id === u.departmentId)?.name || u.departmentId})
                        </span>
                      )}
                      {u.role === 'HEAD_OF_DEPT' && !u.departmentId && (
                        <span className="ml-2 text-xs text-amber-500">⚠ ยังไม่ระบุแผนก</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-icon" onClick={() => openEdit(u)} title={t('common.edit')}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn-icon-danger" onClick={() => handleDelete(u)} title={t('common.delete')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('accounts.edit_title') : t('accounts.add_title')}
        maxWidth={520}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              <CheckCircle size={16} />
              {saving ? 'กำลังบันทึก...' : editing ? t('accounts.save_edit') : t('accounts.add')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={13} style={{ color: '#6366f1' }} />{t('accounts.full_name')}
            </label>
            <input
              className="input-field"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              placeholder="ชื่อ นามสกุล"
            />
          </div>

          {/* Email — readonly when editing */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} style={{ color: '#6366f1' }} />{t('accounts.email')}
            </label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={!!editing}
              placeholder="email@company.com"
            />
          </div>

          {/* Password — only on create */}
          {!editing && (
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={13} style={{ color: '#6366f1' }} />{t('accounts.password')}
              </label>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={t('accounts.password_placeholder')}
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={13} style={{ color: '#6366f1' }} />{t('accounts.role')}
            </label>
            <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, departmentId: '' })}>
              <option value="EMPLOYEE">{t('accounts.role_employee')}</option>
              <option value="HEAD_OF_DEPT">{t('accounts.role_head')}</option>
              <option value="HR">{t('accounts.role_hr')}</option>
              <option value="CEO">{t('accounts.role_ceo')}</option>
            </select>
          </div>

          {/* Department — only for HEAD_OF_DEPT */}
          {form.role === 'HEAD_OF_DEPT' && (
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={13} style={{ color: '#f59e0b' }} />แผนกที่รับผิดชอบ
              </label>
              <select
                className="input-field"
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">-- เลือกแผนก --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">หัวหน้าแผนกจะประเมินได้เฉพาะพนักงานในแผนกนี้เท่านั้น</p>
            </div>
          )}

          {/* Role description hint */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: '0.8rem',
            color: '#64748b',
            lineHeight: 1.6,
          }}>
            {form.role === 'CEO' && '👑 CEO เห็นทุกอย่าง สามารถใช้ฟีเจอร์ทั้งหมดและจัดการสิทธิ์ได้'}
            {form.role === 'HR' && '🏢 HR จัดการพนักงาน ประเมิน KPI และปรับเงินเดือน'}
            {form.role === 'HEAD_OF_DEPT' && '📋 หัวหน้าแผนก ประเมิน KPI ของสมาชิกในแผนก'}
            {form.role === 'EMPLOYEE' && '👤 พนักงานทั่วไป เข้าถึงได้เฉพาะที่ได้รับสิทธิ์'}
          </div>
        </div>
      </Modal>
    </div>
  );
}
