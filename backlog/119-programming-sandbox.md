---
prioridade: 119
categoria: feature,learning-engine,ux
esforco: 4-5 dias
risco: alto
dependencias: [117-study-modes-per-topic, 118-programming-topic-seed]
---

# Programming sandbox — execução de código + learning roadmap

## Contexto

Estudar programação com flashcards é útil para conceitos, mas não para habilidade. Executar código dentro do sistema fecha o loop: ver → entender → escrever → executar → corrigir.

## Problema

- Flashcard de Python mostra conceito mas user nunca executa o código
- Sem exercícios de "escreva esta função" com feedback
- Sem visão de onde o user está no aprendizado de uma linguagem (roadmap)

## Proposta

### Execução sandbox (segura)

**Abordagem**: não rodar código no servidor (risco de execução arbitrária). Usar WebAssembly ou API de terceiro.

| Linguagem | Engine |
|-----------|--------|
| Python | Pyodide (WASM, no browser — sem server) |
| JavaScript | `new Function()` isolado em iframe sandboxado |
| SQL | sql.js (SQLite WASM) |
| Outros | API Judge0 (hosted, open source) |

```typescript
// Interface do sandbox
interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

async function runInSandbox(code: string, language: string): Promise<SandboxResult>
```

**Timeout**: 5s hard limit. **Memory**: 50MB max (Pyodide config).

### Modo de estudo: "Código Livre" (exercise mode)

- Chunk com `type: 'exercise'`: `front` = enunciado, `back` = solução de referência
- User escreve código em editor (Monaco Editor ou CodeMirror)
- Executa → compara output com output esperado (não compara código, apenas resultado)
- Self-assessment: "Chegou na solução?" → qualidade SM-2 aplicada
- Mostrar solução de referência após tentativa

### Modo: Fill-in-the-blank com código

- Chunk com `type: 'code_cloze'`: `back` tem `___` marcando token removido
- User preenche o blank no editor
- Execução valida se código completo roda sem erro

### Learning roadmap por domínio

```sql
CREATE TABLE domain_roadmaps (
  id INTEGER PRIMARY KEY,
  domain_id INTEGER NOT NULL REFERENCES study_domains(id),
  title TEXT NOT NULL,
  milestones TEXT NOT NULL,  -- JSON: array de { id, title, chunk_tags: string[], order }
);

CREATE TABLE user_roadmap_progress (
  user_id INTEGER NOT NULL REFERENCES users(id),
  roadmap_id INTEGER NOT NULL REFERENCES domain_roadmaps(id),
  milestone_id TEXT NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY(user_id, roadmap_id, milestone_id)
);
```

Roadmap de Python (exemplo):
1. Tipos e variáveis (tags: basics, types)
2. Controle de fluxo (tags: if, loops)
3. Funções (tags: functions, scope)
4. Estruturas de dados (tags: list, dict, set)
5. OOP (tags: class, inheritance)
6. Módulos e stdlib (tags: imports, pathlib)
7. Async (tags: asyncio, await)

Milestone completo quando: ≥ 80% dos chunks das tags marcados como "bom" no SM-2.

### Visualização do roadmap

- `/study/python/roadmap` — mapa visual de progresso
- Barras de progresso por milestone
- Próximo milestone recomendado (desbloqueado quando anterior ≥ 60%)

## Arquivos

- `src/features/study/presentation/CodeEditor.tsx` — Monaco/CodeMirror wrapper
- `src/lib/sandbox/pyodideSandbox.ts` — WASM execution
- `src/lib/sandbox/jsSandbox.ts` — iframe isolado
- `src/lib/sandbox/sqlSandbox.ts` — sql.js
- `src/app/api/sandbox/run/route.ts` — fallback para Judge0
- `src/features/study/presentation/ExerciseMode.tsx` — modo exercício
- Migration: `domain_roadmaps`, `user_roadmap_progress`
- `src/app/study/[topicSlug]/roadmap/page.tsx`

## Validação

- [ ] `print("hello")` em Python executa via Pyodide em < 3s (primeiro load)
- [ ] Código malicioso (`import os; os.system(...)`) isolado pelo Pyodide sandbox
- [ ] Timeout 5s funciona: código com loop infinito interrompido
- [ ] Exercise mode: output correto → SM-2 qualidade aplicada
- [ ] Roadmap milestone "Funções": marca como completo quando 80% dos chunks de #functions revisados

## Decisões pendentes

- Judge0: self-hosted ou serviço? — começar com Pyodide WASM (sem backend), Judge0 para linguagens não suportadas
- Monaco Editor (pesado, 2MB+ JS) vs CodeMirror (leve)? — CodeMirror para launch
- Roadmaps: criados pelo sistema ou user pode criar o seu?
