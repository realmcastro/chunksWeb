import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';

/*
! /settings/account — account-level settings (currently password change).
! Server-component shell handles auth gate so the form mounts only for
! signed-in users; unauthenticated requests are redirected to /login.
*/

export default async function AccountSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/settings/account');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{session.username}</span>.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your current password to authorize the update.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
