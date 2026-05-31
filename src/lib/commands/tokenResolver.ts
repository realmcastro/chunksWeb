import type { ParsedToken } from './grammar';

/*
? Resolves parsed tokens to internal URLs or structured data.
? Returns null for unresolvable tokens (render as broken/gray).
*/

export interface ResolvedToken {
  token: ParsedToken;
  url: string | null;
  label: string;
  exists: boolean;
}

/*
! Server-side resolver. Uses db directly — call only from server components or API routes.
? Client-side resolution: send token to /api/commands/resolve endpoint.
*/
export function resolveToken(token: ParsedToken): ResolvedToken {
  switch (token.type) {
    case 'date_ref':
    case 'relative_ref':
      return {
        token,
        url: `/journal/${token.value}`,
        label: token.value,
        exists: true, // optimistic — journal creates entry on demand
      };

    case 'entity_ref': {
      const { value: entityType, extra: identifier } = token;
      if (entityType === 'chunk' && identifier) {
        return { token, url: `/study/chunk/${identifier}`, label: `chunk:${identifier}`, exists: true };
      }
      if (entityType === 'book' && identifier) {
        return { token, url: `/library/${identifier}`, label: identifier, exists: true };
      }
      return { token, url: null, label: token.raw, exists: false };
    }

    case 'wikilink': {
      const title = token.value;
      // Slugify for URL — lowercase, spaces to hyphens
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return { token, url: `/journal/wiki/${slug}`, label: title, exists: false };
    }

    case 'hashtag':
      return { token, url: `/search?q=tag:${token.value}`, label: `#${token.value}`, exists: true };

    case 'semantic_tag':
      return { token, url: null, label: `@${token.value}: ${token.extra ?? ''}`, exists: true };

    default:
      return { token, url: null, label: token.raw, exists: true };
  }
}
