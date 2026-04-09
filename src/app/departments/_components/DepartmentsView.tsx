'use client';

import { useState } from 'react';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useDepartments } from '@/shared/hooks/useDepartments';
import { useEmployees } from '@/shared/hooks/useEmployees';
import { useTranslation } from '@/shared/i18n/provider';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import { useDebounce } from '@/shared/hooks/useDebounce';
import Modal from '@/shared/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import { Building2, Plus, Edit2, Trash2, CheckCircle, Users } from 'lucide-react';
import { DepartmentRecord } from '@/shared/types';

export default function DepartmentsView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { departments, createDepartment, updateDepartment, deleteDepartment, isLoading: isDeptLoading } = useDepartments({ q: debouncedSearch });
  const { employees, isLoading: isEmpLoading } = useEmployees();
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [form, setForm] = useState({ name: '', description: '', code: '' });

  const filtered = departments;

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', code: '' });
    setModalOpen(true);
  }

  function openEdit(dept: DepartmentRecord) {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '', code: dept.code || '' });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      if (editing) {
        await updateDepartment({ ...editing, ...form });
      } else {
        await createDepartment(form);
      }
      setModalOpen(false);
    } catch (err) {
      alert(String(err).replace('Error: ', ''));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('departments.confirm_delete'))) return;
    await deleteDepartment(id);
  }

  return (
    <div className="page-container">
      <PageHeader
        title={t('departments.title')}
        subtitle={t('departments.subtitle').replace('{count}', String(departments.length))}
        icon={Building2}
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} />{t('departments.add')}
          </button>
        }
      />

      <div className="mb-6 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder={t('departments.search')} />
      </div>

      {isDeptLoading || isEmpLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={t('departments.empty')} />
      ) : (
        <div className="card-static overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('departments.title')}</th>
                <th>{t('departments.description')}</th>
                <th>{t('departments.employee_count')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.manage')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dept => {
                const empCount = employees.filter(e => e.departmentId === dept.id).length;
                return (
                  <tr key={dept.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <Building2 size={16} className="text-indigo-500" />
                        </div>
                        <span className="font-medium text-slate-800">{dept.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-slate-500">{dept.description || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{empCount} {t('common.people')}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn-icon" onClick={() => openEdit(dept)} title={t('common.edit')}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon-danger" onClick={() => handleDelete(dept.id)} title={t('common.delete')}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('departments.edit_title') : t('departments.add_title')}
        maxWidth={480}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary" onClick={handleSave}>
              <CheckCircle size={16} />
              {editing ? t('departments.save_edit') : t('departments.add')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">{t('departments.name')}</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('departments.name_placeholder')} />
          </div>
          <div>
            <label className="form-label">{t('common.code')}</label>
            <input className="input-field" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="D001" />
          </div>
          <div>
            <label className="form-label">{t('departments.description')}</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('departments.description_placeholder')} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
