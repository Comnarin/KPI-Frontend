'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/shared/stores/useAppStore';
import { useTranslation } from '@/shared/i18n/provider';
import { Target, Mail, Lock, Building2, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAppStore();
  const { t } = useTranslation();
  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(user.role === 'SUPERADMIN' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(tenantCode, email, password);
      // login() updates the store, but we might want to check the updated state
      // useAppStore.getState() is another way, but the effect will pick it up too.
      // To be safe and immediate:
    } catch (err) {
      setError(String(err).replace('Error: ', '') || t('login.error_default'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)' }}>
      {/* Subtle decorative elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full opacity-30 blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-20 blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="pt-10 pb-6 px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-5 shadow-lg shadow-indigo-200">
              <Target size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{t('login.title')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('login.description')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
            {/* Tenant Code */}
            <div>
              <label className="form-label">{t('login.org_code')}</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field input-with-icon"
                  placeholder={t('login.org_code_placeholder')}
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">{t('login.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className="input-field input-with-icon"
                  placeholder={t('login.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">{t('login.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field input-with-icon pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full py-3 text-base"
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('login.loading')}
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  {t('login.submit')}
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              V2.0 · Multi-Tenant SaaS Platform
            </span>
          </div>
        </div>

        {/* Demo hint */}
        <p className="text-center mt-5 text-xs text-slate-400">
          {t('login.demo_hint')} <span className="font-semibold text-slate-500">DEMO</span> · {t('login.email')} <code className="text-indigo-500">ceo@demo.com</code>
        </p>
      </div>
    </div>
  );
}
