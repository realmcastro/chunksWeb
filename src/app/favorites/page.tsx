import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Heart, ArrowLeft, Dices } from 'lucide-react';
import { getFavoritesForUser, getFavoritesCount, getCategories } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

/*
? Server-rendered favorites listing.
? Auth-required: redirects to /login if no session.
? Pagination: offset-based, 30 per page via ?page=N (1-indexed).
*/

interface FavoritesPageProps {
  searchParams: { page?: string; language?: string };
}

const ITEMS_PER_PAGE = 30;

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const userId = await getUserId();
  if (!userId) redirect('/login?redirect=/favorites');

  const page = Math.max(parseInt(searchParams.page || '1', 10) || 1, 1);
  const language = searchParams.language || undefined;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const chunks = getFavoritesForUser(userId, ITEMS_PER_PAGE, offset, language);
  const totalCount = getFavoritesCount(userId, language);
  const totalPages = Math.max(Math.ceil(totalCount / ITEMS_PER_PAGE), 1);
  const categories = getCategories();
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <Suspense>
      <div className="container py-6 sm:py-8 max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="shrink-0">
              <Button variant="ghost" size="icon" aria-label="Back to home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                Favorites
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {totalCount} chunk{totalCount === 1 ? '' : 's'} saved
              </p>
            </div>
          </div>
          {totalCount > 0 && (
            <Link href="/study/random?source=favorites">
              <Button>
                <Dices className="h-4 w-4 mr-2" />
                Study favorites
              </Button>
            </Link>
          )}
        </div>

        {chunks.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Tap the heart on any chunk to save it for later."
            action={
              <Link href="/browse">
                <Button variant="outline">Browse chunks</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {chunks.map((chunk) => {
              const cat = categoryById.get(chunk.category_id);
              return (
                <Link key={chunk.id} href={`/chunk/${chunk.id}`}>
                  <Card variant="interactive" className="h-full">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-2 break-words">
                        {chunk.chunk_text}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {chunk.meaning}
                      </p>
                      {cat && (
                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color_hex || '#607d8b' }}
                          />
                          <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {page > 1 && (
              <Link href={`/favorites?page=${page - 1}`}>
                <Button variant="outline" size="sm">Previous</Button>
              </Link>
            )}
            <span className="px-3 py-2 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/favorites?page=${page + 1}`}>
                <Button variant="outline" size="sm">Next</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Suspense>
  );
}
