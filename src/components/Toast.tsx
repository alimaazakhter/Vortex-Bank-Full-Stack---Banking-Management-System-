'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

// Global emitter function
let toastEmitter: (msg: string, type: ToastType) => void = () => {};

export function showToast(message: string, type: ToastType = 'info') {
  toastEmitter(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Register the global emitter
    toastEmitter = (message: string, type: ToastType) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts(prev => [...prev, { id, message, type }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={styles.toastContainer} id="global-toast-container">
      {toasts.map((t) => {
        const Icon = t.type === 'success' 
          ? CheckCircle2 
          : t.type === 'error' 
            ? AlertCircle 
            : Info;

        return (
          <div 
            key={t.id} 
            className={`${styles.toast} ${styles[t.type]} animated-fade-in`}
          >
            <Icon size={20} className={styles.icon} />
            <span className={styles.message}>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className={styles.closeBtn}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
