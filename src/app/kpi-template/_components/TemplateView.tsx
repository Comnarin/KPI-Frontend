'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useTranslation } from '@/shared/i18n/provider';
import PageHeader from '@/shared/components/PageHeader';
import Modal from '@/shared/components/Modal';
import EmptyState from '@/shared/components/EmptyState';
import { Target, Plus, Trash2, X, Edit2, CheckCircle, User, Globe } from 'lucide-react';

import { KPITemplate, KPIItem } from '@/shared/types';
import { useTemplates } from '@/shared/hooks/useTemplates';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDepartments } from '@/shared/hooks/useDepartments';
import { usePeriods } from '@/shared/hooks/usePeriods';
import NumberInput from '@/shared/components/NumberInput';

type VisibilityTab = 'GENERAL' | 'PERSONAL';

function emptyKpi(): KPIItem {
  return { id: `k-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: '', weight: 20, targetValue: 100, unit: '%', description: '' };
}

export default function TemplateView() {
  const { user } = useAppStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { templates, isLoading: isTplLoading, createTemplate, updateTemplate, deleteTemplate } = useTemplates({ q: debouncedSearch });
  const { departments, isLoading: isDeptLoading } = useDepartments();
  const { periods, isLoading: isPeriodLoading } = usePeriods();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<VisibilityTab>('GENERAL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KPITemplate | null>(null);
  const [name, setName] = useState('');
  const [dept, setDept] = useState<string>('All');
  const [visibility, setVisibility] = useState<string>('GENERAL');
  const [period, setPeriod] = useState<string>('ALL');
  const [kpis, setKpis] = useState<KPIItem[]>([emptyKpi()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter templates by tab
  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      const v = tpl.visibility || 'GENERAL';
      if (activeTab === 'GENERAL') return v === 'GENERAL';
      // PERSONAL tab: show only own personal templates
      return v === 'PERSONAL' && tpl.createdById === user?.id;
    });
  }, [templates, activeTab, user?.id]);

  function openAdd() {
    setEditing(null);
    setName(''); setDept('All');
    setVisibility('GENERAL'); setPeriod('ALL'); setKpis([emptyKpi()]);
    setModalOpen(true);
  }

  function openEdit(tpl: KPITemplate) {
    setEditing(tpl);
    setName(tpl.name); setDept(tpl.department);
    setVisibility(tpl.visibility || 'GENERAL'); setPeriod(tpl.period);
    setKpis([...(tpl.definition ?? [])]);
    setModalOpen(true);
  }

  const totalWeight = kpis.reduce((s, k) => s + Number(k.weight), 0);
  const weightOk = totalWeight === 100;

  async function handleSave() {
    if (!name) { setFormError(t('kpi.name_required')); return; }
    if (!weightOk) { setFormError(t('kpi.weight_required')); return; }
    const baseFields: Omit<KPITemplate, 'id'> = {
      name,
      department: dept,
      visibility,
      period,
      definition: kpis,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };

    try {
      setSaving(true); setFormError(null);
      if (editing) {
        await updateTemplate({ ...baseFields, id: editing.id });
      } else {
        await createTemplate(baseFields);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(String(err).replace('Error: ', '') || t('kpi.save_error'));
    } finally { setSaving(false); }
  }

  function updateKpi(idx: number, field: keyof KPIItem, val: string | number) {
    setKpis(k => k.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  const isLoading = isTplLoading || isDeptLoading || isPeriodLoading;

  return (
    <div className="page-container">
      <PageHeader
        title={t('kpi.title')}
        subtitle={t('kpi.subtitle')}
        icon={Target}
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} />{t('kpi.create')}
          </button>
        }
      />

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 self-start" style={{ width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'GENERAL'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <Globe size={14} />
          {t('kpi.tab_general')}
        </button>
        <button
          onClick={() => setActiveTab('PERSONAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'PERSONAL'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <User size={14} />
          {t('kpi.tab_personal')}
        </button>
      </div>

      {isLoading ? (
        <div className="card-static p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState message={activeTab === 'PERSONAL' ? t('kpi.empty_personal') : t('kpi.empty')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 max-w-3xl">
          {filteredTemplates.map((tpl, tIdx) => {
            const total = (tpl.definition ?? []).reduce((s, k) => s + k.weight, 0);
            const isPersonal = (tpl.visibility || 'GENERAL') === 'PERSONAL';
            return (
              <div key={tpl.id || tIdx} className="card-static p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-slate-800">{tpl.name}</h3>
                      {isPersonal && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          <User size={10} />{t('kpi.visibility_personal')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-purple">{tpl.department}</span>
                      <span className="badge badge-blue">
                        {tpl.period === 'ALL' ? t('kpi.all_periods') : tpl.period}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-icon" onClick={() => openEdit(tpl)} title={t('common.edit')}><Edit2 size={14} /></button>
                    <button className="btn-icon-danger" onClick={() => deleteTemplate(tpl.id)} title={t('common.delete')}><Trash2 size={14} /></button>
                  </div>
                </div>
                {/* KPI Items Table */}
                <div className="bg-slate-50 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div>{t('kpi.indicator')}</div><div>{t('kpi.target')}</div><div>{t('kpi.weight')}</div>
                  </div>
                  {(tpl.definition ?? []).map((kpi, kIdx) => (
                    <div key={kpi.id || kIdx} className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-slate-100">
                      <div className="text-sm text-slate-700">{kpi.name}</div>
                      <div className="text-sm text-slate-500">{kpi.targetValue} {kpi.unit}</div>
                      <div>
                        <span className={`text-sm font-semibold ${kpi.weight >= 25 ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {kpi.weight}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <span className={`text-xs font-semibold ${total === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t('kpi.total_weight')}: {total}% {total !== 100 ? t('kpi.weight_error') : t('kpi.weight_ok')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('kpi.edit_title') : t('kpi.create_title')}
        maxWidth={640}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              <CheckCircle size={16} />
              {saving ? t('kpi.saving') : editing ? t('kpi.save_edit') : t('kpi.save_create')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">{t('kpi.name')}</label>
            <input className="input-field" placeholder={t('kpi.name_placeholder')} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('kpi.department')}</label>
              <select className="input-field" value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="All">{t('kpi.all_departments')}</option>
                {departments.map((d: { name: string }) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">{t('kpi.visibility')}</label>
              <select className="input-field" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="GENERAL">{t('kpi.visibility_general')}</option>
                <option value="PERSONAL">{t('kpi.visibility_personal')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('kpi.period')}</label>
              <select className="input-field" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="ALL">{t('kpi.all_periods')}</option>
                {periods.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
              </select>
            </div>
            <div></div>
          </div>

          {/* KPI List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0">{t('kpi.items_label')}</label>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold ${weightOk ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t('kpi.total_weight')}: {totalWeight}%
                </span>
                <button className="btn-secondary text-xs" style={{ padding: '4px 10px' }}
                  onClick={() => setKpis(k => [...k, emptyKpi()])}>
                  {t('kpi.add_item')}
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {kpis.map((kpi, idx) => (
                <div key={kpi.id || idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <label className="text-xs text-slate-400 mb-1 block">{t('kpi.item_name')}</label>
                      <input className="input-field text-sm" placeholder={t('kpi.item_name_placeholder')} value={kpi.name} onChange={(e) => updateKpi(idx, 'name', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 mb-1 block">{t('kpi.item_target')}</label>
                      <NumberInput className="input-field text-sm" value={kpi.targetValue} onChange={(v) => updateKpi(idx, 'targetValue', v)} placeholder="100" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 mb-1 block">{t('kpi.item_unit')}</label>
                      <input className="input-field text-sm" placeholder="%" value={kpi.unit} onChange={(e) => updateKpi(idx, 'unit', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 mb-1 block">{t('kpi.item_weight')}</label>
                      <NumberInput className="input-field text-sm" value={kpi.weight} onChange={(v) => updateKpi(idx, 'weight', Math.max(0, Math.min(100, v)))} placeholder="20" />
                    </div>
                    <div className="col-span-1 flex justify-center pt-5">
                      {kpis.length > 1 && (
                        <button onClick={() => setKpis(k => k.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {formError && <p className="mt-2 text-sm text-orange-500">{formError}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
