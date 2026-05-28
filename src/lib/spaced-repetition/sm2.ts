/*
SM-2 Spaced Repetition Algorithm Implementation

Based on the SuperMemo 2 algorithm by Piotr Wozniak.

Pre-conditions:
- quality: 0-5 rating from the learner
- repetitions: number of consecutive correct responses
- easeFactor: difficulty multiplier (minimum 1.3)
- interval: days until next review

Post-conditions:
- Returns updated repetitions, easeFactor, interval, and nextReview date
- If quality < 3, repetitions reset to 0 and interval to 1
*/

export interface SM2Input {
  quality: number;
  repetitions: number;
  easeFactor: number;
  interval: number;
}

export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReview: Date;
}

export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, repetitions, easeFactor, interval } = input;

  let newRepetitions = repetitions;
  let newEaseFactor = easeFactor;
  let newInterval = interval;

  // Quality rating scale:
  // 0 - Complete blackout, no recall
  // 1 - Incorrect response, but upon seeing correct answer, remembered
  // 2 - Incorrect response, but correct answer seemed easy to recall
  // 3 - Correct response with serious difficulty
  // 4 - Correct response after hesitation
  // 5 - Perfect response

  if (quality >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newRepetitions += 1;
  } else {
    // Incorrect response - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor using SM-2 formula
  newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Minimum ease factor is 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  nextReview.setHours(0, 0, 0, 0);

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReview,
  };
}

export function getQualityLabel(quality: number): string {
  switch (quality) {
    case 0:
      return 'Complete blackout';
    case 1:
      return 'Incorrect, but remembered after';
    case 2:
      return 'Incorrect, but easy to recall';
    case 3:
      return 'Correct with difficulty';
    case 4:
      return 'Correct after hesitation';
    case 5:
      return 'Perfect response';
    default:
      return 'Unknown';
  }
}

export function getMasteryLevel(repetitions: number, easeFactor: number): number {
  // Convert SM-2 parameters to a 0-5 mastery level for display
  if (repetitions === 0) return 0;
  if (repetitions === 1) return 1;
  if (repetitions === 2) return 2;
  if (repetitions >= 3 && easeFactor < 2.0) return 3;
  if (repetitions >= 3 && easeFactor < 2.5) return 4;
  return 5;
}

export function getNextIntervals(): { days: number; label: string }[] {
  return [
    { days: 1, label: '1 day' },
    { days: 3, label: '3 days' },
    { days: 7, label: '1 week' },
    { days: 14, label: '2 weeks' },
    { days: 30, label: '1 month' },
    { days: 90, label: '3 months' },
  ];
}
