import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';

/*
! Empty-state primitive. Replaces ad-hoc "No items" text blocks.
! Pass an `Icon` from lucide, a `title`, optional `description` and `action`
! (a CTA — usually a <Button> wrapping a <Link>).
*/

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="py-12 px-4 text-center">
        <Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" aria-hidden />
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
