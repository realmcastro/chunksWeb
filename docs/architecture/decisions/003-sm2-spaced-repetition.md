# ADR-003: SM-2 Algorithm for Spaced Repetition

## Status

Accepted — core learning algorithm.

## Context

Application needs a scientifically-backed algorithm for scheduling review intervals. Options: SM-2, SM-5, FSRS, Leitner system, custom.

## Decision

Implement SM-2 (SuperMemo 2) algorithm. Implementation: `src/lib/spaced-repetition/sm2.ts`.

## Algorithm Summary

- Quality scale: 0–5 (0 = blackout, 5 = perfect recall)
- Quality ≥ 3 = correct answer
- First interval: 1 day
- Second interval: 6 days
- Subsequent: previousInterval × easeFactor
- Ease factor adjustment per review (minimum 1.3)
- Quality < 3 resets repetition count

## Rationale

1. **Proven** — SM-2 is the most widely-implemented spaced repetition algorithm (Anki, SuperMemo legacy).
2. **Simplicity** — Easy to implement, understand, and debug. Pure function.
3. **Predictable** — Deterministic scheduling from quality + current state.
4. **Extensible** — Can evolve to FSRS or SM-5 later without changing the data model significantly.

## Trade-offs

| Gain | Cost |
|------|------|
| Battle-tested algorithm | Less optimal than FSRS for individual learners |
| Simple implementation | Fixed initial intervals (1d, 6d) |
| Pure function, testable | No learning-rate personalization |
| Wide community knowledge | Ease factor can destabilize with repeated failures |

## Data Model

`user_progress` table stores per-user-per-chunk:
- `repetitions` — count of consecutive correct reviews
- `easeFactor` — current ease factor (starts at 2.5)
- `interval` — current interval in days
- `nextReview` — next review date (ISO string)

## Consequences

- Review submission at `/api/review/submit` is the single entry point for SM-2 updates
- Quality rating UI must clearly communicate the 0–5 scale
- Mastery levels (0–5) derived from repetitions + ease factor
- Feynman mode also feeds into SM-2 via quality ratings
