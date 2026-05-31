/*
! In-memory CAPTCHA challenge store with TTL expiry.
!
! Each challenge is a math problem generated server-side. The client
! receives the expression string + challengeId; the answer stays here.
! Challenges auto-expire after CHALLENGE_TTL_MS (2 minutes).
!
! Single-instance store — challenges are lost on hard restart. Acceptable
! because captcha lifespan is short and restart just forces a new challenge.
!
! globalThis used to survive Next.js HMR module re-evaluation in dev.
! Stale entries are swept lazily on create and periodically (every 60s).
*/

const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60_000;

interface Challenge {
  answer: number;
  expiresAt: number;
}

type CaptchaGlobal = {
  __captchaStore?: Map<string, Challenge>;
  __captchaLastSweep?: number;
};

const g = globalThis as typeof globalThis & CaptchaGlobal;
const store: Map<string, Challenge> = g.__captchaStore ?? (g.__captchaStore = new Map());
let lastSweep: number = g.__captchaLastSweep ?? (g.__captchaLastSweep = Date.now());

function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = g.__captchaLastSweep = now;
  store.forEach((challenge, id) => {
    if (now > challenge.expiresAt) store.delete(id);
  });
}

type Operator = '+' | '-' | '×';

interface ChallengeResult {
  challengeId: string;
  expression: string;
  expiresAt: number;
}

/*
! Generates a math challenge and stores the answer.
! Returns the challengeId + expression for the client.
*/
export function createChallenge(): ChallengeResult {
  sweep();

  const challengeId = crypto.randomUUID();
  const { expression, answer } = generateMathProblem();
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;

  store.set(challengeId, { answer, expiresAt });

  return { challengeId, expression, expiresAt };
}

/*
! Validates a challenge answer. Returns true if correct.
! Challenge is consumed on first attempt (success or fail) to prevent replay.
*/
export function validateChallenge(challengeId: string, answer: number): boolean {
  const challenge = store.get(challengeId);
  if (!challenge) return false;

  store.delete(challengeId);

  if (Date.now() > challenge.expiresAt) return false;

  return challenge.answer === answer;
}

function generateMathProblem(): { expression: string; answer: number } {
  const operators: Operator[] = ['+', '-', '×'];
  const op = operators[Math.floor(Math.random() * operators.length)];

  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 20) + 1;
  let answer: number;

  if (op === '+') {
    answer = a + b;
  } else if (op === '-') {
    if (a < b) [a, b] = [b, a];
    answer = a - b;
  } else {
    b = Math.floor(Math.random() * 10) + 1;
    answer = a * b;
  }

  return { expression: `${a} ${op} ${b}`, answer };
}
