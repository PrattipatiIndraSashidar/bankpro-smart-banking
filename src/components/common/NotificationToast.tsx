import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface NotificationToastProps {
  message: string | null;
  type?: 'success' | 'error';
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type = 'success',
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 ${
          type === 'success'
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-rose-900 border-rose-700 text-white'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
        )}

        <div className="text-xs font-medium leading-relaxed pr-2">
          {message}
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white transition-colors p-0.5 ml-auto shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
