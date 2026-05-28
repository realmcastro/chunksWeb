import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/*
! Next.js App Router 404 page.
! Rendered when a route segment matches no page or `notFound()` is called.
*/

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex justify-center gap-2 pt-2">
        <Link href="/">
          <Button>Home</Button>
        </Link>
        <Link href="/browse">
          <Button variant="outline">Browse chunks</Button>
        </Link>
      </div>
    </div>
  );
}
