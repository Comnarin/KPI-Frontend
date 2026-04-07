'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'ยืนยันการดำเนินการ',
  message,
  confirmLabel = 'ยืนยัน',
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null;

  const colors = variant === 'danger'
    ? { bg: 'bg-red-50', icon: 'text-red-500', btn: 'bg-red-600 hover:bg-red-700 text-white' }
    : { bg: 'bg-amber-50', icon: 'text-amber-500', btn: 'bg-amber-600 hover:bg-amber-700 text-white' };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle size={28} className={colors.icon} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>ยกเลิก</button>
            <button className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${colors.btn}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
