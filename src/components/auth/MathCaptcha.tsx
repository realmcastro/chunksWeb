'use client';

import { useState, useCallback } from 'react';

interface MathCaptchaProps {
  onSuccess: () => void;
  onFail?: () => void;
}

/*
? Math CAPTCHA generates random math problems (1-20) with +, -, × operations.
? User must type correct answer to pass. Regenerates on failure.
*/
export function MathCaptcha({ onSuccess, onFail }: MathCaptchaProps) {
  const [problem, setProblem] = useState(() => generateProblem());
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  function generateProblem() {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operations = ['+', '-', '×'];
    const op = operations[Math.floor(Math.random() * operations.length)];

    let a = num1;
    let b = num2;
    let result: number;

    if (op === '+') {
      result = a + b;
    } else if (op === '-') {
      if (a < b) [a, b] = [b, a];
      result = a - b;
    } else {
      b = Math.floor(Math.random() * 10) + 1;
      result = a * b;
    }

    return { a, b, op, answer: result.toString() };
  }

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (answer.trim() === problem.answer) {
        onSuccess();
      } else {
        setError(true);
        setProblem(generateProblem());
        setAnswer('');
        onFail?.();
        setTimeout(() => setError(false), 500);
      }
    },
    [answer, problem, onSuccess, onFail],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-center">
        <span className="text-lg font-medium">
          What is {problem.a} {problem.op} {problem.b}?
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer"
          className={`flex-1 px-3 py-2 border rounded-md text-center text-lg ${
            error ? 'border-red-500 bg-red-50' : 'border-input'
          }`}
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Verify
        </button>
      </div>
      {error && <p className="text-red-500 text-sm text-center">Incorrect answer, try again</p>}
    </form>
  );
}
