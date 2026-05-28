import { NextResponse } from 'next/server';

const cache = new Map<string, string[]>();

async function fetchWikipediaImage(title: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data?.query?.pages ?? {})[0] as any;
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

async function fetchWikipediaSearchImage(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`;
    const res = await fetch(searchUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const results: { title: string }[] = (await res.json())?.query?.search ?? [];
    for (const r of results) {
      const img = await fetchWikipediaImage(r.title);
      if (img) return img;
    }
    return null;
  } catch {
    return null;
  }
}

// Returns JPEG photos from Commons — avoids SVGs, icons, diagrams
async function fetchCommonsJpeg(query: string, offset = 0): Promise<string | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=600&format=json&origin=*&gsrlimit=20&gsroffset=${offset}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const pages = (await res.json())?.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages) as any[]) {
      const mime: string = page?.imageinfo?.[0]?.mime ?? '';
      const imgUrl: string = page?.imageinfo?.[0]?.url ?? '';
      if (mime.includes('jpeg') && imgUrl) return imgUrl;
    }
    return null;
  } catch {
    return null;
  }
}

// Primary noun from a multi-word query (e.g. "red lighthouse coast" → "lighthouse")
function primaryKeyword(query: string): string {
  const stopWords = new Set(['a', 'an', 'the', 'in', 'at', 'on', 'with', 'of', 'for', 'and', 'or', 'near', 'by', 'to', 'from', 'into', 'red', 'blue', 'green', 'large', 'small', 'big', 'old', 'new']);
  const words = query.split(/\s+/).filter(w => !stopWords.has(w.toLowerCase()));
  return words[0] ?? query;
}

async function fetchPrimaryImage(word: string, query: string): Promise<string> {
  return (
    (await fetchWikipediaImage(word)) ??
    (await fetchWikipediaSearchImage(query)) ??
    (await fetchCommonsJpeg(query)) ??
    `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(word)}`
  );
}

async function fetchAlternateImage(word: string, query: string, exclude: string): Promise<string | null> {
  // Try Commons with the full query first
  const a = await fetchCommonsJpeg(query);
  if (a && a !== exclude) return a;

  // Try Commons with just the primary keyword
  const keyword = primaryKeyword(query);
  if (keyword !== query) {
    const b = await fetchCommonsJpeg(keyword);
    if (b && b !== exclude) return b;
  }

  // Try Commons with just the word itself (different from the query)
  if (word !== keyword) {
    const c = await fetchCommonsJpeg(word);
    if (c && c !== exclude) return c;
  }

  // Try with an offset to get the second batch of results
  const d = await fetchCommonsJpeg(query, 10);
  if (d && d !== exclude) return d;

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word') || '';
  const query = searchParams.get('query') || word;

  if (!word) return NextResponse.json({ images: [] }, { status: 400 });

  const cacheKey = word.toLowerCase();
  if (cache.has(cacheKey)) {
    return NextResponse.json({ images: cache.get(cacheKey) });
  }

  // Fetch primary and alternate in parallel where possible
  const primary = await fetchPrimaryImage(word, query);
  const alternate = await fetchAlternateImage(word, query, primary);

  const images: string[] = alternate ? [primary, alternate] : [primary];
  cache.set(cacheKey, images);
  return NextResponse.json({ images });
}
