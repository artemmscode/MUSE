import { create } from 'zustand';
import type { Toast } from '@/types';

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = createId();
    set((state) => ({ toasts: [...state.toasts.slice(-3), { ...toast, id }] }));
    window.setTimeout(() => {
      if (get().toasts.some((item) => item.id === id)) {
        set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
      }
    }, 4800);
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const toast = {
  success(title: string, description?: string): string {
    return useToastStore.getState().push({ title, description, variant: 'success' });
  },
  error(title: string, description?: string): string {
    return useToastStore.getState().push({ title, description, variant: 'error' });
  },
  info(title: string, description?: string): string {
    return useToastStore.getState().push({ title, description, variant: 'info' });
  },
};
