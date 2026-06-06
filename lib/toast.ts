import * as Burnt from 'burnt';

export const toast = {
  success: (title: string, message?: string) => {
    Burnt.toast({
      title,
      message,
      preset: 'done',
      haptic: 'success',
      duration: 3,
    });
  },

  error: (title: string, message?: string) => {
    Burnt.toast({
      title,
      message,
      preset: 'error',
      haptic: 'error',
      duration: 3,
    });
  },

  info: (title: string, message?: string) => {
    Burnt.toast({
      title,
      message,
      preset: 'none',
      haptic: 'warning',
      duration: 3,
    });
  },

  warning: (title: string, message?: string) => {
    Burnt.alert({
      title,
      message,
      preset: 'error',
      duration: 3,
    });
  },
};
