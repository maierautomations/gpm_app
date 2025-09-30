/**
 * Toast Provider & Hook
 *
 * Provides a context for showing toast messages anywhere in the app.
 * Use the useToast hook to show messages.
 *
 * USAGE:
 * 1. Wrap your app with <ToastProvider>
 * 2. Use useToast() hook in any component:
 *
 * const { showToast } = useToast();
 * showToast('Operation successful!', 'success');
 * showToast('Network error', 'error');
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from './Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration: number;
  }>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToastConfig({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const showError = (message: string) => {
    showToast(message, 'error', 4000); // Longer duration for errors
  };

  const showSuccess = (message: string) => {
    showToast(message, 'success', 2000);
  };

  const showWarning = (message: string) => {
    showToast(message, 'warning', 3000);
  };

  const showInfo = (message: string) => {
    showToast(message, 'info', 2500);
  };

  const hideToast = () => {
    setToastConfig((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider
      value={{ showToast, showError, showSuccess, showWarning, showInfo }}
    >
      {children}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}