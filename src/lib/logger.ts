/*
! Structured logger — single source for app logs.
! Replaces ad-hoc console.* calls so every entry carries level + msg + ctx + ts.
!
! Output shape (JSON when JSON-serializable):
!   { level, msg, ctx?: Record<string, unknown>, ts: ISO8601 }
!
! In dev: pretty console output with color.
! In prod: JSON line per entry for log shippers.
! No telemetry sink yet — see plan B18 for remote shipping.
*/

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  msg: string;
  ctx?: LogContext;
  ts: string;
}

const isDev = process.env.NODE_ENV !== 'production';

function serializeError(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: isDev ? value.stack : undefined,
    };
  }
  return value;
}

function normalizeContext(ctx?: LogContext): LogContext | undefined {
  if (!ctx) return undefined;
  const out: LogContext = {};
  for (const key of Object.keys(ctx)) {
    out[key] = serializeError(ctx[key]);
  }
  return out;
}

function emit(level: LogLevel, msg: string, ctx?: LogContext): void {
  const entry: LogEntry = {
    level,
    msg,
    ctx: normalizeContext(ctx),
    ts: new Date().toISOString(),
  };

  if (isDev) {
    const prefix = `[${entry.ts}] ${level.toUpperCase()} ${msg}`;
    const detail = entry.ctx ?? '';
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'debug'
            ? console.debug
            : console.log;
    if (entry.ctx) fn(prefix, detail);
    else fn(prefix);
    return;
  }

  // Prod: single JSON line.
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  debug(msg: string, ctx?: LogContext): void {
    if (!isDev) return;
    emit('debug', msg, ctx);
  },
  info(msg: string, ctx?: LogContext): void {
    emit('info', msg, ctx);
  },
  warn(msg: string, ctx?: LogContext): void {
    emit('warn', msg, ctx);
  },
  error(msg: string, ctx?: LogContext): void {
    emit('error', msg, ctx);
  },
};
