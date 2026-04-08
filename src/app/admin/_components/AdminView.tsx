'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/shared/stores/useAppStore';
import { api } from '@/shared/api';
import { RolePermission } from '@/shared/types';
import PageHeader from '@/shared/components/PageHeader';
import Modal from '@/shared/components/Modal';
import {
  ShieldCheck, Building2, Users, Plus, X, Save,
  RefreshCw, Settings, ChevronRight, CheckCircle, XCircle, Trash2, Edit2
} from 'lucide-react';

interface Tenant {
  id: string; name: string; code: string; size: string; maxUsers: number; isActive: boolean; createdAt?: string;
  users?: { id: string }[];
}

interface TenantConfig {
  enableHrEval: boolean;
  enableDeptHeadEval: boolean;
  enableCeoEval: boolean;
}

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'ดูภาพรวม', crud_employee: 'จัดการพนักงาน',
  crud_department: 'จัดการแผนก', crud_template: 'ตั้งค่า KPI',
  eval_kpi: 'ประเมิน KPI', approve_salary: 'ปรับเงินเดือน',
};

const ROLES = ['CEO', 'HR', 'HEAD_OF_DEPT', 'EMPLOYEE'];
const ROLE_LABELS: Record<string, string> = {
  CEO: 'CEO / ผู้บริหาร', HR: 'HR / ทรัพยากรบุคคล',
  HEAD_OF_DEPT: 'หัวหน้าแผนก', EMPLOYEE: 'พนักงาน',
};

const getMaxUsersBySize = (size: string) => {
  switch (size) {
    case 'SMALL': return 20;
    case 'MEDIUM': return 200;
    case 'ENTERPRISE': return 1000;
    default: return 20;
  }
};

export default function AdminView() {
  const router = useRouter();
  const { user } = useAppStore();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [config, setConfig] = useState<TenantConfig>({ enableHrEval: false, enableDeptHeadEval: false, enableCeoEval: true });
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', code: '', size: 'SMALL', maxUsers: 20, adminEmail: '', adminPassword: '', adminName: '' });
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', code: '', size: 'SMALL', maxUsers: 20, isActive: true });
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'features'>('overview');

  useEffect(() => { if (user && user.role !== 'SUPERADMIN') router.push('/dashboard'); }, [user, router]);
  useEffect(() => { loadTenants(); }, []);

  const loadTenants = async () => {
    setLoadingTenants(true);
    try { setTenants(await api.get<Tenant[]>('/admin/tenants')); } catch (e) { console.error(e); } finally { setLoadingTenants(false); }
  };

  const selectTenant = async (tenant: Tenant) => { setSelectedTenant(tenant); setActiveTab('overview'); };

  useEffect(() => {
    if (activeTab === 'features' && selectedTenant) loadConfig();
  }, [activeTab, selectedTenant]);

  const loadConfig = async () => {
    if (!selectedTenant) return;
    setLoadingConfig(true);
    try { 
      const data = await api.get<TenantConfig>(`/admin/tenants/${selectedTenant.id}/config`);
      setConfig(data);
    } catch (e) { console.error(e); } finally { setLoadingConfig(false); }
  };

  const saveConfig = async () => {
    if (!selectedTenant) return;
    setSavingConfig(true);
    try { await api.put(`/admin/tenants/${selectedTenant.id}/config`, config as unknown as Record<string, unknown>); } catch (e) { console.error(e); alert('Failed to save configuration'); } finally { setSavingConfig(false); }
  };

  const handleCreateTenant = async () => {
    setCreating(true);
    try {
      await api.post('/admin/tenants', createForm as unknown as Record<string, unknown>);
      setShowCreateModal(false);
      setCreateForm({ name: '', code: '', size: 'SMALL', maxUsers: 20, adminEmail: '', adminPassword: '', adminName: '' });
      await loadTenants();
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const handleEditTenant = async () => {
    if (!selectedTenant) return;
    setSavingEdit(true);
    try {
      const updated = await api.put<Tenant>(`/admin/tenants/${selectedTenant.id}`, editForm as unknown as Record<string, unknown>);
      setShowEditModal(false);
      setSelectedTenant(updated);
      setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (e) { console.error(e); alert('Failed to update tenant'); } finally { setSavingEdit(false); }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Tenant '${selectedTenant.name}'?\nข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้`)) return;
    try { await api.delete(`/admin/tenants/${selectedTenant.id}`); setSelectedTenant(null); await loadTenants(); } catch (e) { console.error(e); alert('Failed to delete tenant'); }
  };

  if (!user || user.role !== 'SUPERADMIN') {
    return <div className="text-slate-400 text-center mt-20">กำลังตรวจสอบสิทธิ์...</div>;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Super Admin Portal"
        subtitle="จัดการ Tenants, สิทธิ์ และการตั้งค่าระบบ"
        icon={ShieldCheck}
        action={
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> สร้าง Tenant
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Tenant List */}
        <div className="card-static p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-slate-800">รายการ Tenants ({tenants.length})</h2>
            <button onClick={loadTenants} className="text-slate-400 hover:text-slate-600" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <RefreshCw size={15} className={loadingTenants ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="space-y-2">
            {tenants.map(tenant => (
              <button key={tenant.id} onClick={() => selectTenant(tenant)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedTenant?.id === tenant.id
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`} style={{ display: 'flex' }}>
                <div>
                  <div className={`text-sm font-semibold ${selectedTenant?.id === tenant.id ? 'text-indigo-700' : 'text-slate-700'}`}>{tenant.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    <span className={`font-bold ${selectedTenant?.id === tenant.id ? 'text-indigo-500' : 'text-indigo-400'}`}>{tenant.code}</span> · {tenant.size}
                  </div>
                </div>
                {selectedTenant?.id === tenant.id && <ChevronRight size={14} className="text-indigo-500" />}
              </button>
            ))}
            {tenants.length === 0 && !loadingTenants && (
              <p className="text-slate-400 text-sm text-center py-6">ไม่มี Tenant</p>
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className="col-span-2">
          {!selectedTenant ? (
            <div className="card-static flex flex-col items-center justify-center py-16">
              <Building2 size={40} className="text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">เลือก Tenant จากรายการทางซ้าย</p>
            </div>
          ) : (
            <div className="card-static overflow-hidden">
              {/* Tenant Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Building2 size={20} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{selectedTenant.name}</div>
                      <div className="text-xs text-slate-400">ID: {selectedTenant.id} · รหัส: {selectedTenant.code}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditForm({ name: selectedTenant.name, code: selectedTenant.code, size: selectedTenant.size, maxUsers: selectedTenant.maxUsers || 20, isActive: selectedTenant.isActive }); setShowEditModal(true); }}
                      className="btn-icon text-xs flex items-center gap-1.5" style={{ padding: '6px 12px' }}>
                      <Edit2 size={14} /> แก้ไข
                    </button>
                    <button onClick={handleDeleteTenant}
                      className="btn-icon-danger text-xs flex items-center gap-1.5" style={{ padding: '6px 12px' }}>
                      <Trash2 size={14} /> ลบ
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                  {[
                    { id: 'overview', label: 'ภาพรวม', icon: Settings },
                    { id: 'features', label: 'ตั้งค่าฟีเจอร์', icon: ShieldCheck },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as 'overview' | 'features')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'text-slate-400 border border-transparent hover:text-slate-600'
                      }`} style={{ background: activeTab === tab.id ? undefined : 'none' }}>
                      <tab.icon size={14} /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'รหัส Tenant', value: selectedTenant.code, color: 'text-indigo-600' },
                      { label: 'ขนาดองค์กร', value: selectedTenant.size, color: 'text-blue-600' },
                      { label: 'สถานะ', value: selectedTenant.isActive ? 'ใช้งาน' : 'ระงับ', color: selectedTenant.isActive ? 'text-emerald-600' : 'text-red-500' },
                      { label: 'จำกัดผู้ใช้', value: `${selectedTenant.maxUsers || 20} คน`, color: 'text-violet-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-xl p-4">
                        <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                        <div className={`font-bold text-base ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* User count progress bar */}
                  {(() => {
                    const userCount = selectedTenant.users?.length ?? 0;
                    const maxUsers = selectedTenant.maxUsers || 20;
                    const pct = Math.min(100, Math.round((userCount / maxUsers) * 100));
                    const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-400">จำนวนผู้ใช้ปัจจุบัน</span>
                          <span className="text-sm font-bold text-slate-700">{userCount} / {maxUsers}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        {pct > 90 && (
                          <p className="text-xs text-red-500 mt-2">⚠ ใกล้ถึงจำนวนสูงสุดแล้ว</p>
                        )}
                      </div>
                    );
                  })()}
                  </>
                )}

                {activeTab === 'features' && (
                  <div>
                    {loadingConfig ? (
                      <p className="text-slate-400 text-center py-10">กำลังโหลดการตั้งค่า...</p>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4">
                          {[
                            { key: 'enableHrEval', label: 'เปิดใช้งานการประเมินโดย HR (HR Evaluation Stage)', icon: Users },
                            { key: 'enableDeptHeadEval', label: 'เปิดใช้งานการประเมินโดยหัวหน้าแผนก (Dept Head Stage)', icon: RefreshCw },
                            { key: 'enableCeoEval', label: 'เปิดใช้งานการประเมินโดยผู้บริหาร (CEO Stage)', icon: ShieldCheck },
                          ].map(f => (
                            <div key={f.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                                  <f.icon size={18} />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-700">{f.label}</div>
                                  <div className="text-xs text-slate-400">กำหนดว่าการประเมินต้องผ่านขั้นตอนนี้หรือไม่</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setConfig(prev => ({ ...prev, [f.key]: !prev[f.key as keyof TenantConfig] }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${config[f.key as keyof TenantConfig] ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                style={{ padding: 0, border: 'none', cursor: 'pointer' }}
                              >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config[f.key as keyof TenantConfig] ? 'left-7' : 'left-1'}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end pt-4">
                          <button className="btn-primary" onClick={saveConfig} disabled={savingConfig}>
                            <Save size={16} /> {savingConfig ? 'กำลังบันทึก...' : 'บันทึกฟีเจอร์'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="สร้าง Tenant ใหม่" maxWidth={540}
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>ยกเลิก</button>
            <button className="btn-primary flex-1" onClick={handleCreateTenant} disabled={creating || !createForm.name || !createForm.code}>
              <Plus size={16} /> {creating ? 'กำลังสร้าง...' : 'สร้าง Tenant'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <div className="section-label">ข้อมูลองค์กร</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">ชื่อองค์กร *</label><input className="input-field" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Company Name" /></div>
              <div><label className="form-label">รหัส *</label><input className="input-field" value={createForm.code} onChange={e => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })} placeholder="COMPANY01" /></div>
              <div>
                <label className="form-label">ขนาดองค์กร</label>
                <select className="input-field" value={createForm.size} onChange={e => {
                  const size = e.target.value;
                  setCreateForm({ ...createForm, size, maxUsers: getMaxUsersBySize(size) });
                }}>
                  <option value="SMALL">Small (20)</option>
                  <option value="MEDIUM">Medium (200)</option>
                  <option value="ENTERPRISE">Enterprise (1,000)</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <div className="section-label">Admin แรกขององค์กร</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">ชื่อ Admin</label><input className="input-field" value={createForm.adminName} onChange={e => setCreateForm({ ...createForm, adminName: e.target.value })} placeholder="Admin Name" /></div>
              <div><label className="form-label">อีเมล</label><input type="email" className="input-field" value={createForm.adminEmail} onChange={e => setCreateForm({ ...createForm, adminEmail: e.target.value })} placeholder="admin@company.com" /></div>
              <div><label className="form-label">รหัสผ่าน</label><input type="password" className="input-field" value={createForm.adminPassword} onChange={e => setCreateForm({ ...createForm, adminPassword: e.target.value })} placeholder="Password" /></div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Tenant Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="แก้ไข Tenant" maxWidth={540}
        footer={
          <>
            <button className="btn-secondary flex-1" onClick={() => setShowEditModal(false)}>ยกเลิก</button>
            <button className="btn-primary flex-1" onClick={handleEditTenant} disabled={savingEdit || !editForm.name || !editForm.code}>
              <Save size={16} /> {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">ชื่อองค์กร *</label><input className="input-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
          <div><label className="form-label">รหัส *</label><input className="input-field" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} /></div>
          <div>
            <label className="form-label">ขนาดองค์กร</label>
            <select className="input-field" value={editForm.size} onChange={e => {
              const size = e.target.value;
              setEditForm({ ...editForm, size, maxUsers: getMaxUsersBySize(size) });
            }}>
              <option value="SMALL">Small (20)</option>
              <option value="MEDIUM">Medium (200)</option>
              <option value="ENTERPRISE">Enterprise (1,000)</option>
            </select>
          </div>
          <div>
            <label className="form-label">จำกัดผู้ใช้ (กำหนดเอง)</label>
            <input type="number" className="input-field" value={editForm.maxUsers} onChange={e => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="form-label">สถานะการใช้งาน</label>
            <select className="input-field" value={editForm.isActive ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}>
              <option value="true">ใช้งาน (Active)</option><option value="false">ระงับ (Inactive)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
