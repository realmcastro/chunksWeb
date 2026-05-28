/*
! Token-tolerant string comparison for dictation / typing exercises.
!
! normalize() drops casing, punctuation, and collapses whitespace so common
! transcription artifacts ("That's"/"thats", trailing periods) do not penalise
! the learner. levenshtein() returns the edit distance for grading.
!
! similarity() returns a 0..1 score; >=0.9 = correct, >=0.7 = close, else miss.
*/

// ASCII-range punctuation/symbol set; covers most Latin-script chunks without
// requiring Unicode property escapes (which need ES2018+ target).
const PUNCT_RE = /[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~\-]/g;

export function normalize(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(PUNCT_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length === 0 && nb.length === 0) return 1;
  const max = Math.max(na.length, nb.length);
  if (max === 0) return 1;
  const distance = levenshtein(na, nb);
  return 1 - distance / max;
}

export type MatchGrade = 'correct' | 'close' | 'miss';

export function gradeAnswer(expected: string, actual: string): MatchGrade {
  const score = similarity(expected, actual);
  if (score >= 0.9) return 'correct';
  if (score >= 0.7) return 'close';
  return 'miss';
}
