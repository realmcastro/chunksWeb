'use client';

import { useState, useCallback, useRef } from 'react';

interface SliderCaptchaProps {
  onSuccess: () => void;
}

/*
? Slider CAPTCHA requires user to drag handle to end of track (>90%).
? Visual track with handle that follows mouse/touch drag.
*/
export function SliderCaptcha({ onSuccess }: SliderCaptchaProps) {
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      const handleWidth = 40;

      let newPosition = clientX - rect.left - handleWidth / 2;
      newPosition = Math.max(0, Math.min(newPosition, trackWidth - handleWidth));

      const percentage = (newPosition / (trackWidth - handleWidth)) * 100;
      setPosition(newPosition);

      if (percentage >= 90) {
        setPosition(trackWidth - handleWidth);
        onSuccess();
      }
    },
    [onSuccess],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      handleMove(e.clientX);
    },
    [handleMove],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      handleMove(e.touches[0].clientX);
    },
    [handleMove],
  );

  const handleMoveEvent = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleMove(clientX);
    },
    [isDragging, handleMove],
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm text-center text-muted-foreground">Slide the handle to unlock</p>
      <div
        ref={trackRef}
        className="relative h-10 bg-muted rounded-full overflow-hidden cursor-pointer"
        onMouseMove={handleMoveEvent as any}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={handleMoveEvent as any}
        onTouchEnd={handleEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary/30 transition-all"
            style={{ width: `${(position / (trackRef.current?.offsetWidth || 300 - 40)) * 100}%` }}
          />
        </div>
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{ left: position }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <svg
            className="w-5 h-5 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Start</span>
        <span>Slide to end</span>
        <span>End</span>
      </div>
    </div>
  );
}
