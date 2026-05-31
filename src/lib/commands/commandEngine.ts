import type { ParsedToken } from './grammar';

/*
! Command engine — registry for semantic tag handlers and /command handlers.
! Modules register handlers at boot time. Parser core stays stable.
! New handler: zero changes to parser or other modules.
*/

export interface TagHandler {
  description: string;
  onParse: (text: string, context: CommandContext) => void | Promise<void>;
}

export interface CommandHandler {
  description: string;
  onExecute: (args: string, context: CommandContext) => void | Promise<void>;
}

export interface CommandContext {
  userId: number;
  date: string; // YYYY-MM-DD context date
  entryId?: string;
}

const tagHandlers = new Map<string, TagHandler>();
const commandHandlers = new Map<string, CommandHandler>();

/*
? Register a semantic tag handler.
? Example: commandEngine.registerTag('@feito', { ... })
*/
export function registerTag(tag: string, handler: TagHandler): void {
  const normalized = tag.startsWith('@') ? tag.slice(1).toLowerCase() : tag.toLowerCase();
  tagHandlers.set(normalized, handler);
}

/*
? Register a /command handler.
? Example: commandEngine.registerCommand('template', { ... })
*/
export function registerCommand(command: string, handler: CommandHandler): void {
  commandHandlers.set(command.toLowerCase(), handler);
}

export function getTagHandler(tag: string): TagHandler | undefined {
  return tagHandlers.get(tag.toLowerCase());
}

export function getCommandHandler(command: string): CommandHandler | undefined {
  return commandHandlers.get(command.toLowerCase());
}

export function listTagHandlers(): Array<{ tag: string; description: string }> {
  return Array.from(tagHandlers.entries()).map(([tag, h]) => ({ tag, description: h.description }));
}

export function listCommandHandlers(): Array<{ command: string; description: string }> {
  return Array.from(commandHandlers.entries()).map(([command, h]) => ({ command, description: h.description }));
}

/*
! Dispatches a parsed token to its registered handler (if any).
! Called after parseLine() to execute side effects.
! Errors in handlers are caught — parser does not crash.
*/
export async function dispatchToken(token: ParsedToken, context: CommandContext): Promise<void> {
  if (token.type === 'semantic_tag' && token.value && token.extra !== undefined) {
    const handler = getTagHandler(token.value);
    if (handler) {
      try {
        await handler.onParse(token.extra, context);
      } catch (err) {
        console.error('[commandEngine] semantic_tag handler error', { tag: token.value, err });
      }
    }
  }

  if (token.type === 'command' && token.value) {
    const handler = getCommandHandler(token.value);
    if (handler) {
      try {
        await handler.onExecute(token.extra ?? '', context);
      } catch (err) {
        console.error('[commandEngine] command handler error', { command: token.value, err });
      }
    }
  }
}

// Register built-in semantic tags
registerTag('@feito', {
  description: 'Marca tarefa como concluída',
  onParse: (_text, _context) => {
    // Journal events module (#107) will implement the actual persistence
    void _text;
    void _context;
  },
});

registerTag('@meta', {
  description: 'Define uma meta para a entrada',
  onParse: (_text, _context) => {
    void _text;
    void _context;
  },
});

registerTag('@erro', {
  description: 'Marca um erro ou aprendizado negativo',
  onParse: (_text, _context) => {
    void _text;
    void _context;
  },
});
