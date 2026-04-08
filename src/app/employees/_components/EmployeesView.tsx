'use client';

import { useState } from 'react';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useEmployees } from '@/shared/hooks/useEmployees';
import { useDepartments } from '@/shared/hooks/useDepartments';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useTranslation } from '@/shared/i18n/provider';
import PageHeader from '@/shared/components/PageHeader';
import SearchInput from '@/shared/components/SearchInput';
import Modal from '@/shared/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import { Users, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { getAvatarColor, getEmployeeInitials } from '@/shared/lib/data';
import NumberInput from '@/shared/components/NumberInput';
import { Employee, EmployeeStatus } from '@/shared/types';

interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  code: string;
  department: string;
  position: string;
  baseSalary: number;
  personalCapacity: number;
  variablePayBase: number;
  yearsOfService: number;
  status: EmployeeStatus;
  startDate: string;
}

export default function EmployeesView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { employees, createEmployee, updateEmployee, deleteEmployee, isLoading: isEmpLoading } = useEmployees({ search: debouncedSearch });
  const { departments, isLoading: isDeptLoading } = useDepartments();
  const { t } = useTranslation();


  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>({
    firstName: '', lastName: '', email: '', code: '', department: '',
    position: '', baseSalary: 0, personalCapacity: 0, variablePayBase: 0,
    yearsOfService: 0, status: 'ACTIVE', startDate: new Date().toISOString().slice(0, 10),
  });

  const filtered = employees;

  function openAdd() {
    setEditing(null);
    setForm({
      firstName: '', lastName: '', email: '', code: '', department: departments[0]?.name || '',
      position: '', baseSalary: 0, personalCapacity: 0, variablePayBase: 0,
      yearsOfService: 0, status: 'ACTIVE', startDate: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email || '', code: emp.code || '',
      department: emp.department, position: emp.position, baseSalary: emp.baseSalary,
      personalCapacity: emp.personalCapacity, variablePayBase: emp.variablePayBase,
      yearsOfService: emp.yearsOfService, status: (emp.status as EmployeeStatus) || 'ทำงาน', startDate: emp.startDate || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.code.trim()) {
      alert(t('employees.field_required'));
      return;
    }

    try {
      if (editing) {
        await updateEmployee({ ...editing, ...form });
      } else {
        await createEmployee(form);
      }
      setModalOpen(false);
    } catch (err) {
      alert(String(err).replace('Error: ', ''));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบพนักงานนี้?')) return;
    await deleteEmployee(id);
  }

  return (
    <div className="page-container">
      <PageHeader
        title={t('employees.title')}
        subtitle={t('employees.subtitle').replace('{count}', String(employees.length))}
        icon={Users}
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} />{t('employees.add')}
          </button>
        }
      />

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder={t('employees.search')} />
      </div>

      {/* Table */}
      {isEmpLoading || isDeptLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={t('employees.empty')} />
      ) : (
        <div className="card-static overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.employee')}</th>
                <th>{t('common.code')}</th>
                <th>{t('common.department')}</th>
                <th>{t('common.position')}</th>
                <th>{t('common.status')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.manage')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`avatar avatar-sm bg-gradient-to-br ${getAvatarColor(emp.id)}`}>
                        {getEmployeeInitials(emp)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-slate-400">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-slate-500 font-mono">{emp.code}</td>
                  <td><span className="badge badge-purple">{emp.department}</span></td>
                  <td className="text-sm text-slate-600">{emp.position}</td>
                  <td>
                    <span className={`badge ${String(emp.status) === 'ACTIVE' || emp.status === 'ทำงาน' ? 'badge-green' : 'badge-slate'}`}>
                      {String(emp.status) === 'ACTIVE' || emp.status === 'ทำงาน' ? t('employees.status_active') : emp.status || t('employees.status_not_specified')}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-icon" onClick={() => openEdit(emp)} title={t('common.edit')}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn-icon-danger" onClick={() => handleDelete(emp.id)} title={t('common.delete')}>
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

      {/* Modal — pure HR record, no system account fields */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('employees.edit_title') : t('employees.add_title')}
        maxWidth={640}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary" onClick={handleSave}>
              <CheckCircle size={16} />
              {editing ? t('employees.save_edit') : t('employees.add')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">{t('employees.first_name')}</label><input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label className="form-label">{t('employees.last_name')}</label><input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">{t('employees.email')}</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="form-label">{t('employees.code')}</label><input className="input-field" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('employees.department')}</label>
              <select className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">{t('employees.select_department')}</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">{t('employees.position')}</label><input className="input-field" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
          </div>

          <div className="section-label mt-2">{t('employees.salary_section')}</div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">{t('employees.p1')}</label><NumberInput value={form.baseSalary} onChange={v => setForm({ ...form, baseSalary: v })} placeholder="0" /></div>
            <div><label className="form-label">{t('employees.p2')}</label><NumberInput value={form.personalCapacity} onChange={v => setForm({ ...form, personalCapacity: v })} placeholder="0" /></div>
            <div><label className="form-label">{t('employees.p3')}</label><NumberInput value={form.variablePayBase} onChange={v => setForm({ ...form, variablePayBase: v })} placeholder="0" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">{t('employees.years_of_service')}</label><NumberInput value={form.yearsOfService} onChange={v => setForm({ ...form, yearsOfService: v })} placeholder="0" /></div>
            <div><label className="form-label">{t('employees.start_date')}</label><input type="date" className="input-field" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
            <div>
              <label className="form-label">{t('common.status')}</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as EmployeeStatus })}>
                <option value="ACTIVE">{t('employees.status_active')}</option>
                <option value="INACTIVE">{t('employees.status_inactive')}</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
