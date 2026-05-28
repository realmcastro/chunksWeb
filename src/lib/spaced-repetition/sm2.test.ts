import { describe, it, expect } from 'vitest';
import {
  calculateSM2,
  getMasteryLevel,
  getQualityLabel,
  type SM2Input,
} from './sm2';

/*
! Pure unit tests for SM-2 algorithm.
! No external dependencies — the function is deterministic except for the
! `nextReview` Date, which we assert relative to "now" rather than absolute.
*/

const BASE: SM2Input = {
  quality: 4,
  repetitions: 0,
  easeFactor: 2.5,
  interval: 0,
};

function daysFromNow(date: Date): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.round(diff / 86_400_000);
}

describe('calculateSM2', () => {
  describe('correct response (quality >= 3)', () => {
    it('schedules the first review 1 day out when repetitions=0', () => {
      const result = calculateSM2({ ...BASE, repetitions: 0 });
      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(daysFromNow(result.nextReview)).toBe(1);
    });

    it('schedules the second review 6 days out when repetitions=1', () => {
      const result = calculateSM2({ ...BASE, repetitions: 1, interval: 1 });
      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });

    it('multiplies interval by easeFactor for repetitions >= 2', () => {
      const result = calculateSM2({
        quality: 5,
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
      });
      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(15); // round(6 * 2.5)
    });

    it('quality=3 still counts as correct', () => {
      const result = calculateSM2({ ...BASE, quality: 3 });
      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
    });
  });

  describe('incorrect response (quality < 3)', () => {
    it('resets repetitions to 0 and interval to 1', () => {
      const result = calculateSM2({
        quality: 2,
        repetitions: 5,
        easeFactor: 2.5,
        interval: 30,
      });
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('quality=0 still produces a valid next-review date', () => {
      const result = calculateSM2({
        quality: 0,
        repetitions: 4,
        easeFactor: 2.5,
        interval: 20,
      });
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.nextReview).toBeInstanceOf(Date);
    });
  });

  describe('ease factor adjustment', () => {
    it('raises ease factor on perfect recall (quality=5)', () => {
      const result = calculateSM2({ ...BASE, quality: 5, easeFactor: 2.0 });
      expect(result.easeFactor).toBeGreaterThan(2.0);
    });

    it('lowers ease factor on poor recall (quality=0)', () => {
      const result = calculateSM2({ ...BASE, quality: 0, easeFactor: 2.5 });
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('clamps ease factor at minimum 1.3', () => {
      const result = calculateSM2({
        quality: 0,
        repetitions: 1,
        easeFactor: 1.3,
        interval: 1,
      });
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('never drops below 1.3 even after repeated failures', () => {
      let state: SM2Input = { quality: 0, repetitions: 5, easeFactor: 2.5, interval: 20 };
      for (let i = 0; i < 20; i++) {
        const out = calculateSM2(state);
        state = {
          quality: 0,
          repetitions: out.repetitions,
          easeFactor: out.easeFactor,
          interval: out.interval,
        };
      }
      expect(state.easeFactor).toBe(1.3);
    });
  });

  describe('nextReview Date', () => {
    it('returns a Date instance set to midnight', () => {
      const result = calculateSM2(BASE);
      expect(result.nextReview).toBeInstanceOf(Date);
      expect(result.nextReview.getHours()).toBe(0);
      expect(result.nextReview.getMinutes()).toBe(0);
      expect(result.nextReview.getSeconds()).toBe(0);
    });
  });
});

describe('getMasteryLevel', () => {
  it('returns 0 when no repetitions', () => {
    expect(getMasteryLevel(0, 2.5)).toBe(0);
  });

  it('returns 1 and 2 for early repetitions', () => {
    expect(getMasteryLevel(1, 2.5)).toBe(1);
    expect(getMasteryLevel(2, 2.5)).toBe(2);
  });

  it('returns 3 for mastered chunks with low ease', () => {
    expect(getMasteryLevel(5, 1.9)).toBe(3);
  });

  it('returns 4 for mastered chunks with medium ease', () => {
    expect(getMasteryLevel(5, 2.3)).toBe(4);
  });

  it('returns 5 for mastered chunks with high ease', () => {
    expect(getMasteryLevel(5, 2.8)).toBe(5);
  });
});

describe('getQualityLabel', () => {
  it('returns labels for all six valid quality values', () => {
    for (let q = 0; q <= 5; q++) {
      expect(getQualityLabel(q)).not.toBe('Unknown');
    }
  });

  it('returns Unknown for invalid quality', () => {
    expect(getQualityLabel(7)).toBe('Unknown');
    expect(getQualityLabel(-1)).toBe('Unknown');
  });
});
