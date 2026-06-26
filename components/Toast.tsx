import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border max-w-sm animate-in slide-in-from-right-8 fade-in duration-300
            ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : ''}
            ${toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-900' : ''}
            ${toast.type === 'info' ? 'bg-indigo-50 border-indigo-100 text-indigo-900' : ''}
          `}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />}
          
          <div className="flex-1">
            <p className="text-sm font-semibold leading-relaxed">{toast.message}</p>
          </div>
          
          <button 
            onClick={() => removeToast(toast.id)}
            className={`transition-colors p-1 -m-1 rounded-lg
              ${toast.type === 'success' ? 'text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100/50' : ''}
              ${toast.type === 'error' ? 'text-rose-400 hover:text-rose-700 hover:bg-rose-100/50' : ''}
              ${toast.type === 'info' ? 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100/50' : ''}
            `}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
