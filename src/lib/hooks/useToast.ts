'use client';

import { notification, Modal } from 'antd';

/*
! Thin wrapper over antd notification so call sites depend on a project-owned
! API, not the third-party lib. Swapping notification lib later only touches
! this file.
!
! Duration: antd uses seconds (default 4.5s). Incoming ms values are converted.
!
! Also includes `confirmToast` — a promise-based alternative to
! `window.confirm()`. Uses antd Modal.confirm; resolves true on OK, false on
! Cancel or backdrop click.
*/

interface ToastOptions {
  description?: string;
  /** Duration in milliseconds (converted to seconds for antd). */
  duration?: number;
}

function toSeconds(ms?: number): number | undefined {
  return ms !== undefined ? ms / 1000 : undefined;
}

export const toast = {
  success(message: string, options?: ToastOptions) {
    notification.success({
      message,
      description: options?.description,
      duration: toSeconds(options?.duration),
    });
  },
  error(message: string, options?: ToastOptions) {
    notification.error({
      message,
      description: options?.description,
      duration: toSeconds(options?.duration),
    });
  },
  info(message: string, options?: ToastOptions) {
    notification.info({
      message,
      description: options?.description,
      duration: toSeconds(options?.duration),
    });
  },
  warning(message: string, options?: ToastOptions) {
    notification.warning({
      message,
      description: options?.description,
      duration: toSeconds(options?.duration),
    });
  },
  message(message: string, options?: ToastOptions) {
    notification.open({
      message,
      description: options?.description,
      duration: toSeconds(options?.duration),
    });
  },
  dismiss(key?: string | number) {
    if (key !== undefined) {
      notification.destroy(String(key));
    } else {
      notification.destroy();
    }
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
  const { description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false } =
    options;

  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title,
      content: description,
      okText: confirmLabel,
      cancelText: cancelLabel,
      okButtonProps: destructive ? { danger: true } : undefined,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}
