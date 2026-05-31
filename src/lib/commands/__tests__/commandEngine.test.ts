import { describe, it, expect, vi } from 'vitest';
import {
  registerTag,
  registerCommand,
  getTagHandler,
  getCommandHandler,
  listTagHandlers,
  listCommandHandlers,
  dispatchToken,
} from '../commandEngine';
import type { ParsedToken } from '../grammar';
import type { CommandContext } from '../commandEngine';

const CTX: CommandContext = { userId: 1, date: '2026-05-31' };

describe('registerTag', () => {
  it('registers and retrieves by name (without @)', () => {
    registerTag('@reg-test-a', { description: 'a', onParse: vi.fn() });
    expect(getTagHandler('reg-test-a')).toBeDefined();
  });

  it('registers without @ prefix', () => {
    registerTag('reg-test-b', { description: 'b', onParse: vi.fn() });
    expect(getTagHandler('reg-test-b')).toBeDefined();
  });

  it('normalizes to lowercase', () => {
    registerTag('@UPPER-TAG', { description: 'c', onParse: vi.fn() });
    expect(getTagHandler('upper-tag')).toBeDefined();
  });

  it('boot-time tags are present', () => {
    expect(getTagHandler('feito')).toBeDefined();
    expect(getTagHandler('meta')).toBeDefined();
    expect(getTagHandler('erro')).toBeDefined();
  });

  it('overwrites existing handler on re-registration', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    registerTag('@overwrite-tag', { description: 'first', onParse: fn1 });
    registerTag('@overwrite-tag', { description: 'second', onParse: fn2 });
    const h = getTagHandler('overwrite-tag');
    expect(h?.description).toBe('second');
  });
});

describe('registerCommand', () => {
  it('registers and retrieves command', () => {
    registerCommand('cmd-test-a', { description: 'cmd a', onExecute: vi.fn() });
    expect(getCommandHandler('cmd-test-a')).toBeDefined();
  });

  it('normalizes to lowercase for retrieval', () => {
    registerCommand('CmdUpper', { description: 'upper', onExecute: vi.fn() });
    expect(getCommandHandler('cmdupper')).toBeDefined();
    expect(getCommandHandler('CmdUpper')).toBeDefined(); // retrieval also lowercases
  });
});

describe('listTagHandlers', () => {
  it('returns array including boot-time tags', () => {
    const tags = listTagHandlers();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.some((t) => t.tag === 'feito')).toBe(true);
    expect(tags.some((t) => t.tag === 'meta')).toBe(true);
  });

  it('each entry has tag and description fields', () => {
    const tags = listTagHandlers();
    for (const entry of tags) {
      expect(typeof entry.tag).toBe('string');
      expect(typeof entry.description).toBe('string');
    }
  });
});

describe('listCommandHandlers', () => {
  it('returns array with command and description', () => {
    registerCommand('list-cmd-test', { description: 'for listing', onExecute: vi.fn() });
    const cmds = listCommandHandlers();
    expect(Array.isArray(cmds)).toBe(true);
    const found = cmds.find((c) => c.command === 'list-cmd-test');
    expect(found?.description).toBe('for listing');
  });
});

describe('dispatchToken', () => {
  it('calls semantic_tag handler with text and context', async () => {
    const onParse = vi.fn();
    registerTag('@dispatch-tag-1', { description: 'test', onParse });

    const token: ParsedToken = {
      type: 'semantic_tag',
      raw: '@dispatch-tag-1:value',
      value: 'dispatch-tag-1',
      extra: 'value',
      position: { start: 0, end: 21 },
      status: 'pending',
    };

    await dispatchToken(token, CTX);
    expect(onParse).toHaveBeenCalledOnce();
    expect(onParse).toHaveBeenCalledWith('value', CTX);
  });

  it('calls command handler with args and context', async () => {
    const onExecute = vi.fn();
    registerCommand('dispatch-cmd-1', { description: 'test', onExecute });

    const token: ParsedToken = {
      type: 'command',
      raw: '/dispatch-cmd-1 arg1 arg2',
      value: 'dispatch-cmd-1',
      extra: 'arg1 arg2',
      position: { start: 0, end: 25 },
      status: 'pending',
    };

    await dispatchToken(token, CTX);
    expect(onExecute).toHaveBeenCalledWith('arg1 arg2', CTX);
  });

  it('does not throw when no semantic_tag handler registered', async () => {
    const token: ParsedToken = {
      type: 'semantic_tag',
      raw: '@no-handler:x',
      value: 'no-handler-xyz',
      extra: 'x',
      position: { start: 0, end: 13 },
      status: 'pending',
    };
    await expect(dispatchToken(token, CTX)).resolves.toBeUndefined();
  });

  it('does not throw when no command handler registered', async () => {
    const token: ParsedToken = {
      type: 'command',
      raw: '/no-such-cmd',
      value: 'no-such-cmd-xyz',
      extra: '',
      position: { start: 0, end: 12 },
      status: 'pending',
    };
    await expect(dispatchToken(token, CTX)).resolves.toBeUndefined();
  });

  it('catches and swallows semantic_tag handler errors', async () => {
    registerTag('@throw-tag', {
      description: 'throws',
      onParse: () => { throw new Error('tag handler boom'); },
    });

    const token: ParsedToken = {
      type: 'semantic_tag',
      raw: '@throw-tag:x',
      value: 'throw-tag',
      extra: 'x',
      position: { start: 0, end: 12 },
      status: 'pending',
    };

    await expect(dispatchToken(token, CTX)).resolves.toBeUndefined();
  });

  it('catches and swallows command handler errors', async () => {
    registerCommand('throw-cmd', {
      description: 'throws',
      onExecute: () => { throw new Error('cmd handler boom'); },
    });

    const token: ParsedToken = {
      type: 'command',
      raw: '/throw-cmd',
      value: 'throw-cmd',
      extra: '',
      position: { start: 0, end: 10 },
      status: 'pending',
    };

    await expect(dispatchToken(token, CTX)).resolves.toBeUndefined();
  });

  it('does not dispatch for text token type', async () => {
    const fn = vi.fn();
    registerTag('@text-no-dispatch', { description: 'test', onParse: fn });

    const token: ParsedToken = {
      type: 'text',
      raw: 'hello',
      value: 'hello',
      position: { start: 0, end: 5 },
      status: 'resolved',
    };

    await dispatchToken(token, CTX);
    expect(fn).not.toHaveBeenCalled();
  });

  it('does not dispatch semantic_tag when extra is undefined', async () => {
    const fn = vi.fn();
    registerTag('@no-extra-tag', { description: 'test', onParse: fn });

    const token: ParsedToken = {
      type: 'semantic_tag',
      raw: '@no-extra-tag',
      value: 'no-extra-tag',
      // extra intentionally absent
      position: { start: 0, end: 13 },
      status: 'pending',
    };

    await dispatchToken(token, CTX);
    expect(fn).not.toHaveBeenCalled();
  });
});
