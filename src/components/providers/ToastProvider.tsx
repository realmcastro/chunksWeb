/*
! antd notification static API manages its own DOM container — no provider
! component needed. This file is kept as a no-op stub so layout.tsx import
! compiles cleanly; AntdRegistry in layout handles SSR CSS extraction.
*/

export function ToastProvider() {
  return null;
}
