'use client';

import { Toaster } from 'sonner';

/*
! Mounts sonner's Toaster once at the root layout boundary so any client
! component can call `toast()` / `useToast()` without re-rendering the host.
! `richColors` provides built-in success/error/warning/info palettes mapped
! to sonner's defaults; `closeButton` keeps long messages dismissible.
*/

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: 'font-sans text-sm',
      }}
    />
  );
}
