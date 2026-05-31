import { redirect } from 'next/navigation';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { AuditClient } from './AuditClient';

export const metadata = { title: 'Content Audit' };

export default async function AuditPage() {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect('/login');

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Content Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, search, and edit all chunks, grammar structures, and vocabulary.
          </p>
        </div>
        <AuditClient />
      </div>
    </main>
  );
}
