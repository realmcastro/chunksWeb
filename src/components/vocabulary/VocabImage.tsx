'use client';

import { useState, useEffect } from 'react';

interface Props {
  query: string;
  word: string;
  src?: string;
  /** Fill the parent container (object-cover). Default: natural aspect ratio. */
  fill?: boolean;
  className?: string;
}

export function VocabImage({ query, word, src: externalSrc, fill = false, className }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(externalSrc ?? null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);

    if (externalSrc !== undefined) {
      setImgSrc(externalSrc ?? null);
      return;
    }

    setImgSrc(null);
    const params = new URLSearchParams({ word, query });
    fetch(`/api/vocabulary/image?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.url) setImgSrc(d.url);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [word, query, externalSrc]);

  const handleError = () => {
    if (!error) {
      setImgSrc(`https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(word)}`);
      setError(true);
    }
  };

  if (fill) {
    // Cover mode: fills the parent container, used in the match game cards
    return (
      <div className={`relative w-full h-full bg-muted flex items-center justify-center ${className ?? ''}`}>
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted z-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Loading…</span>
          </div>
        )}
        {imgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={imgSrc}
            src={imgSrc}
            alt={word}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={handleError}
          />
        )}
        {loaded && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 z-10">
            <span className="text-white text-sm font-medium drop-shadow">{query}</span>
          </div>
        )}
      </div>
    );
  }

  // Natural mode: card height adapts to the image's own aspect ratio
  return (
    <div className={`relative w-full bg-muted ${className ?? ''}`}>
      {!loaded && (
        <div className="flex flex-col items-center justify-center gap-2 min-h-48 py-10">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Loading image…</span>
        </div>
      )}
      {imgSrc && (
        <div className={`relative ${loaded ? 'block' : 'absolute inset-0 opacity-0 pointer-events-none'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={imgSrc}
            src={imgSrc}
            alt={word}
            className="w-full h-auto block max-h-[70vh] object-contain"
            onLoad={() => setLoaded(true)}
            onError={handleError}
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <span className="text-white text-sm font-medium drop-shadow">{query}</span>
          </div>
        </div>
      )}
    </div>
  );
}
