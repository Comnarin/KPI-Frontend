'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useTranslation } from '@/shared/i18n/provider';
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  ClipboardCheck,
  Banknote,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Globe,
  UserCog,
  Lock,
  CalendarClock,
  KeyRound,
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard', perm: 'view_dashboard' },
  { labelKey: 'nav.employees', icon: Users, href: '/employees', perm: 'crud_employee' },
  { labelKey: 'nav.departments', icon: Building2, href: '/departments', perm: 'crud_department' },
  { labelKey: 'nav.kpi_template', icon: Target, href: '/kpi-template', perm: 'crud_template' },
  { labelKey: 'nav.evaluation', icon: ClipboardCheck, href: '/evaluation', perm: 'eval_kpi' },
  { labelKey: 'nav.salary', icon: Banknote, href: '/salary', perm: 'approve_salary' },
];

const ADMIN_NAV_ITEMS = [
  { labelKey: 'nav.accounts', icon: UserCog, href: '/accounts', perm: 'manage_users' },
  { labelKey: 'nav.permissions', icon: Lock, href: '/permissions', perm: 'manage_settings' },
  { labelKey: 'nav.period_config', icon: CalendarClock, href: '/period-config', perm: 'manage_period' },
];


function NavLink({ href, icon: Icon, label, isActive, iconActiveClass }: {
  href: string; icon: React.ElementType; label: string; isActive: boolean; iconActiveClass?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${isActive
        ? 'bg-white/12 text-white'
        : 'text-slate-400 hover:text-white hover:bg-white/6'
        }`}
      style={{ textDecoration: 'none' }}
    >
      <Icon size={18} className={isActive ? (iconActiveClass ?? 'text-indigo-400') : 'text-slate-500 group-hover:text-slate-300'} />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight size={14} className={iconActiveClass ?? 'text-indigo-400'} />}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission, logout, permissions, loading } = useAppStore();
  const { t, locale, setLocale } = useTranslation();
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-sm border border-slate-700/50">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">{t('app.name')}</div>
            <div className="text-slate-400 text-xs">{t('app.subtitle')}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {/* Show main menu only for non-SuperAdmin users */}
        {!isSuperAdmin && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
              {t('nav.main_menu')}
            </div>
            <div className="flex flex-col gap-0.5">
              {loading && permissions.length === 0 ? (
                // Skeleton loading state
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                    <div className="w-5 h-5 bg-slate-700/50 rounded-md" />
                    <div className="h-4 bg-slate-700/50 rounded-md flex-1" />
                  </div>
                ))
              ) : (
                NAV_ITEMS.filter((item) => hasPermission(item.perm)).map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    isActive={pathname === item.href}
                  />
                ))
              )}
            </div>

            {/* Administration section — accounts & permissions */}
            {ADMIN_NAV_ITEMS.some(item => hasPermission(item.perm)) && (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mt-5 mb-2">
                  {t('nav.admin_section')}
                </div>
                <div className="flex flex-col gap-0.5">
                  {ADMIN_NAV_ITEMS.filter(item => hasPermission(item.perm)).map(item => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={t(item.labelKey)}
                      isActive={pathname === item.href}
                      iconActiveClass="text-violet-400"
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Super Admin section */}
        {isSuperAdmin && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
              {t('nav.admin')}
            </div>
            <div className="flex flex-col gap-0.5">
              <NavLink
                href="/admin"
                icon={ShieldCheck}
                label={t('nav.super_admin')}
                isActive={pathname === '/admin'}
                iconActiveClass="text-amber-400"
              />
            </div>
          </>
        )}
      </nav>


      {/* User info + Language Switcher */}
      {user && (
        <div className="px-4 pb-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <Globe size={14} className="text-slate-500" />
            <div className="flex rounded-lg bg-white/5 p-0.5 flex-1">
              <button
                onClick={() => setLocale('th')}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${locale === 'th'
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
                style={{ border: 'none', cursor: 'pointer', background: locale === 'th' ? 'rgba(99,102,241,0.3)' : 'none' }}
              >
                TH
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${locale === 'en'
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
                style={{ border: 'none', cursor: 'pointer', background: locale === 'en' ? 'rgba(99,102,241,0.3)' : 'none' }}
              >
                EN
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold">
                {user.fullName?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{user.fullName}</div>
                <div className="text-slate-400 text-xs">{user.role}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setIsPwdModalOpen(true)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 text-xs font-medium transition-all cursor-pointer"
                style={{ border: 'none', background: 'none' }}
              >
                <KeyRound size={14} />
                {t('nav.change_password')}
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all cursor-pointer"
                style={{ border: 'none', background: 'none' }}
              >
                <LogOut size={14} />
                {t('nav.logout')}
              </button>
            </div>
          </div>
          <ChangePasswordModal open={isPwdModalOpen} onClose={() => setIsPwdModalOpen(false)} />

          <div className="text-center mt-3">
            <span className="text-slate-600 text-[10px]">V2.0 · © 2025 KPI Manager</span>
          </div>
        </div>
      )}
    </aside>
  );
}
