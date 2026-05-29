import { useToastStore } from '@/store/toastStore';

export const toast = {
  error: (message: string) => useToastStore.getState().showToast(message, 'error'),
  success: (message: string) => useToastStore.getState().showToast(message, 'success'),
  info: (message: string) => useToastStore.getState().showToast(message, 'info'),
};
