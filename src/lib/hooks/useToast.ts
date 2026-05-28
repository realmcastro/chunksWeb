'use client';

import { toast as sonnerToast } from 'sonner';

/*
! Thin wrapper over sonner so call sites depend on a project-owned API,
! not the third-party lib. Swapping toast lib later only touches this file.
!
! Also includes `confirmToast` — a promise-based alternative to
! `window.confirm()`. Renders an action button on a persistent toast; resolves
! true if the user clicks "Confirm", false if they click "Cancel" or the
! toast is dismissed by timeout.
*/

interface ToastOptions {
  description?: string;
  duration?: number;
}

export const toast = {
  success(message: string, options?: ToastOptions) {
    sonnerToast.success(message, options);
  },
  error(message: string, options?: ToastOptions) {
    sonnerToast.error(message, options);
  },
  info(message: string, options?: ToastOptions) {
    sonnerToast.info(message, options);
  },
  warning(message: string, options?: ToastOptions) {
    sonnerToast.warning(message, options);
  },
  message(message: string, options?: ToastOptions) {
    sonnerToast(message, options);
  },
  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  },
};

export function useToast() {
  return toast;
}

interface ConfirmOptions {
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Mark as a destructive confirmation for styling. */
  destructive?: boolean;
}

export function confirmToast(
  title: string,
  options: ConfirmOptions = {},
): Promise<boolean> {
  const {
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
  } = options;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const settle = (value: boolean, id: string | number) => {
      if (settled) return;
      settled = true;
      sonnerToast.dismiss(id);
      resolve(value);
    };

    sonnerToast(title, {
      description,
      duration: 15_000,
      action: {
        label: confirmLabel,
        onClick: () => {
          // sonner passes back the toast id via the closure; we rely on
          // sonner's auto-dismiss-on-action behaviour and resolve true.
          settled = true;
          resolve(true);
        },
      },
      cancel: {
        label: cancelLabel,
        onClick: () => {
          settled = true;
          resolve(false);
        },
      },
      onDismiss: (t) => settle(false, t.id),
      onAutoClose: (t) => settle(false, t.id),
      className: destructive ? 'border-destructive/40' : undefined,
    });
  });
}
