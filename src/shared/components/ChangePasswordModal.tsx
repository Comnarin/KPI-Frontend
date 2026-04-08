'use client';

import { useState } from 'react';
import { api } from '@/shared/api';
import Modal from '@/shared/components/Modal';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/shared/i18n/provider';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  async function handleSave() {
    if (!password) {
      setError('กรุณาระบุรหัสผ่านใหม่');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.put('/users/change-password', { password });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPassword('');
        setConfirmPassword('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="เปลี่ยนรหัสผ่าน"
      maxWidth={400}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>ยกเลิก</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading || success}>
            {loading ? 'กำลังบันทึก...' : success ? 'บันทึกสำเร็จ' : 'บันทึก'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-emerald-500" size={24} />
            </div>
            <p className="text-emerald-600 font-medium">เปลี่ยนรหัสผ่านสำเร็จแล้ว</p>
          </div>
        ) : (
          <>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
              <Lock size={18} className="text-indigo-500 mt-0.5" />
              <p className="text-xs text-indigo-700 leading-relaxed">
                รหัสผ่านใหม่ของคุณต้องมีความปลอดภัย และคุณจะต้องใช้รหัสผ่านนี้ในการเข้าสู่ระบบครั้งถัดไป
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="form-label">รหัสผ่านใหม่</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>

            <div>
              <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
