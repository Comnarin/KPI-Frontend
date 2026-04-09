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
import { Building2, Plus, Edit2, Trash2, CheckCircle, Users, ArrowRightLeft, UserPlus, Search, Briefcase } from 'lucide-react';
import { DepartmentRecord, Employee } from '@/shared/types';
import { getAvatarColor, getEmployeeInitials } from '@/shared/lib/data';
import NumberInput from '@/shared/components/NumberInput';

export default function DepartmentsView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { departments, createDepartment, updateDepartment, deleteDepartment, isLoading: isDeptLoading } = useDepartments({ q: debouncedSearch });
  const { employees, updateEmployee, partialUpdateEmployee, isLoading: isEmpLoading } = useEmployees();
  const { t } = useTranslation();
  const filtered = departments;

  // Department CRUD State
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [form, setForm] = useState({ name: '', description: '', code: '' });

  // Member Management State
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [viewingDept, setViewingDept] = useState<DepartmentRecord | null>(null);
  const [poolSearch, setPoolSearch] = useState('');
  const [isMoving, setIsMoving] = useState<string | null>(null); // employee ID
  const [modalMode, setModalMode] = useState<'MEMBERS' | 'EDIT'>('MEMBERS');

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', code: '' });
    setModalMode('EDIT');
    setMemberModalOpen(true);
  }

  function openEdit(dept: DepartmentRecord) {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '', code: dept.code || '' });
    setModalMode('EDIT');
  }

  async function handleSave() {
    try {
      if (editing) {
        await updateDepartment({ ...editing, ...form });
        setModalMode('MEMBERS');
      } else {
        await createDepartment(form);
        setMemberModalOpen(false);
      }
    } catch (err) {
      alert(String(err).replace('Error: ', ''));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('departments.confirm_delete'))) return;
    try {
      await deleteDepartment(id);
    } catch (err) {
      const msg = String(err).replace('Error: ', '');
      alert(t(msg));
    }
  }

  async function handleMoveEmployee(emp: Employee, targetDeptId: string) {
    try {
      if (!targetDeptId) return;
      // Optimized partial update — only send the field that changed
      await partialUpdateEmployee(emp.id, { departmentId: targetDeptId });
      // Notification or success state could go here
    } catch (err) {
      alert('Failed to move employee');
    }
  }

  const deptMembers = (deptId: string) => employees.filter(e => e.departmentId === deptId);
  const availablePool = employees.filter(e => e.departmentId !== viewingDept?.id);
  const filteredPool = availablePool.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(poolSearch.toLowerCase()) ||
    e.code?.toLowerCase().includes(poolSearch.toLowerCase())
  );

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(dept => {
            const members = deptMembers(dept.id);
            const empCount = members.length;

            return (
              <div
                key={dept.id}
                onClick={() => { setViewingDept(dept); setModalMode('MEMBERS'); setMemberModalOpen(true); }}
                className="group relative bg-white border border-slate-200 rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 cursor-pointer"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Building2 size={80} />
                </div>

                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                    <Building2 size={24} className="text-white" />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">{dept.name}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono font-bold tracking-tight uppercase">
                      {dept.code || 'NO-CODE'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                    {dept.description || t('departments.no_description')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {members.slice(0, 3).map(m => (
                        <div key={m.id} className={`w-7 h-7 rounded-full border-2 border-white ring-1 ring-slate-100 bg-gradient-to-br ${getAvatarColor(m.id)} flex items-center justify-center text-[10px] font-bold text-white`}>
                          {getEmployeeInitials(m)}
                        </div>
                      ))}
                      {empCount > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-slate-100 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{empCount - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {empCount} {t('common.people')}
                    </span>
                  </div>

                  <div className="w-8 h-8 bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all">
                    <ArrowRightLeft size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Consolidated Department Modal (Manage + Edit) */}
      <Modal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title={modalMode === 'EDIT'
          ? (editing ? t('departments.edit_title') : t('departments.add_title'))
          : (viewingDept ? `จัดการพนักงาน — ${viewingDept.name}` : '')
        }
        maxWidth={modalMode === 'EDIT' ? 480 : 760}
      >
        {modalMode === 'EDIT' ? (
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('departments.name')} *</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('departments.name_placeholder')} />
            </div>
            <div>
              <label className="form-label">{t('common.code')} *</label>
              <input className="input-field" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="D001" />
            </div>
            <div>
              <label className="form-label">{t('departments.description')}</label>
              <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('departments.description_placeholder')} />
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button className="btn-secondary flex-1" onClick={() => editing ? setModalMode('MEMBERS') : setMemberModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={!form.name || !form.code}>
                <CheckCircle size={16} />
                {editing ? t('departments.save_edit') : t('departments.add')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[600px]">
            {/* Header Info */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 flex items-center justify-between border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-slate-200">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{t('departments.employee_count')}</div>
                  <div className="text-xs text-slate-500">{deptMembers(viewingDept?.id || '').length} {t('common.people')}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">DEPARTMENT CODE</span>
                  <span className="text-sm font-mono font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-50 shadow-sm">{viewingDept?.code || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                  <button
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    onClick={() => { if (viewingDept) openEdit(viewingDept); }}
                    title={t('common.edit')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => { if (viewingDept) { handleDelete(viewingDept.id); setMemberModalOpen(false); } }}
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-8 flex-1 overflow-hidden">
              {/* Left Col: Current Members */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase size={14} /> {t('departments.employee_list')}
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {deptMembers(viewingDept?.id || '').length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <Users size={40} className="mb-2" />
                      <p className="text-xs font-medium">{t('departments.no_employee')}</p>
                    </div>
                  ) : (
                    deptMembers(viewingDept?.id || '').map(emp => (
                      <div key={emp.id} className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 hover:border-indigo-200 transition-colors shadow-sm">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(emp.id)} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                          {getEmployeeInitials(emp)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{emp.position}</div>
                        </div>
                        <select
                          className="text-[10px] font-bold bg-slate-50 border-none rounded-lg px-2 py-1 text-slate-500 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-100 transition-colors"
                          value={emp.departmentId}
                          onChange={(e) => handleMoveEmployee(emp, e.target.value)}
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Col: Pool (to add) */}
              <div className="w-[300px] border-l border-slate-100 pl-8 flex flex-col">
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <UserPlus size={14} /> {t('departments.add_employee')}
                  </h4>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder={t('departments.search_employee')}
                      value={poolSearch}
                      onChange={(e) => setPoolSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {filteredPool.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      ไม่พบพนักงานอื่นที่ค้นหา
                    </div>
                  ) : (
                    filteredPool.map(emp => (
                      <div key={emp.id} className="p-2.5 bg-slate-50 rounded-2xl flex items-center gap-3 group transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-indigo-100">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(emp.id)} flex items-center justify-center text-[9px] font-bold text-white opacity-80 group-hover:opacity-100`}>
                          {getEmployeeInitials(emp)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-slate-700 truncate">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[9px] text-slate-400 truncate">{emp.department?.name || 'ไม่มีแผนก'}</div>
                        </div>
                        <button
                          onClick={() => handleMoveEmployee(emp, viewingDept?.id || '')}
                          className="w-7 h-7 bg-white text-indigo-500 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
