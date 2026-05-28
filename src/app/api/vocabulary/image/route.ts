import { NextResponse } from 'next/server';

const cache = new Map<string, string>();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// DuckDuckGo unofficial image search — most relevant results for any query
async function fetchDuckDuckGoImage(query: string): Promise<string | null> {
  try {
    // Step 1: get VQD token from the search page
    const initRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      { headers: { 'User-Agent': UA } },
    );
    if (!initRes.ok) return null;
    const html = await initRes.text();

    const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return null;
    const vqd = vqdMatch[1];

    // Step 2: fetch image results JSON
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&f=,,,,,&p=1`,
      {
        headers: {
          'User-Agent': UA,
          'Referer': 'https://duckduckgo.com/',
          'Accept': 'application/json',
        },
      },
    );
    if (!imgRes.ok) return null;

    const data = await imgRes.json();
    // Return first result that looks like a direct image URL
    for (const r of data?.results ?? []) {
      const url: string = r?.image ?? '';
      if (url && url.startsWith('http')) return url;
    }
    return null;
  } catch {
    return null;
  }
}

// Wikipedia article thumbnail (stable, reliable for concrete nouns)
async function fetchWikipediaImage(title: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const page = Object.values((await res.json())?.query?.pages ?? {})[0] as any;
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

// Wikimedia Commons JPEG search (last resort before placeholder)
async function fetchCommonsJpeg(query: string): Promise<string | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=600&format=json&origin=*&gsrlimit=20`;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word  = searchParams.get('word')  || '';
  const query = searchParams.get('query') || word;

  if (!word) return NextResponse.json({ error: 'word required' }, { status: 400 });

  const cacheKey = query.toLowerCase();
  if (cache.has(cacheKey)) {
    return NextResponse.json({ url: cache.get(cacheKey), source: 'cache' });
  }

  // 1. DuckDuckGo — best relevance, uses the crafted image_search_query
  const ddg = await fetchDuckDuckGoImage(query);
  if (ddg) {
    cache.set(cacheKey, ddg);
    return NextResponse.json({ url: ddg, source: 'duckduckgo' });
  }

  // 2. Wikipedia — stable thumbnail for the exact word
  const wiki = await fetchWikipediaImage(word);
  if (wiki) {
    cache.set(cacheKey, wiki);
    return NextResponse.json({ url: wiki, source: 'wikipedia' });
  }

  // 3. Wikimedia Commons — JPEG photo search
  const commons = await fetchCommonsJpeg(query);
  if (commons) {
    cache.set(cacheKey, commons);
    return NextResponse.json({ url: commons, source: 'commons' });
  }

  // 4. Text placeholder — always works
  const placeholder = `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(word)}`;
  cache.set(cacheKey, placeholder);
  return NextResponse.json({ url: placeholder, source: 'placeholder' });
}
