---
prioridade: 56
categoria: ux,layout
esforco: 1 dia
risco: baixo
---

# Split-pane layout (chunk + notes/context lateral)

## Contexto

Chunk detail page é single-column scroll. User não pode tomar notas enquanto vê chunk + examples + IPA + grammar context.

## Problema

- Workflow estudo profundo requer ver chunk + escrever em paralelo
- Browse: clicou chunk → navigated away → perdeu lista context
- Sem multi-tarefa within app

## Proposta

### Pattern: Master-Detail Split
Desktop ≥1024px:
- Browse: lista chunks (40% esquerda) | detalhe selecionado (60% direita)
- Click chunk em lista NÃO navega — abre no painel direito
- URL atualiza (`?selected=123`) para shareable + back-button

Mobile <1024px:
- Stack normal — clicar chunk navega para detail page

### Resizable splitter
- Drag divider horizontal para ajustar 30/70, 50/50, 70/30
- Persist size em localStorage
- Min widths para evitar collapse (200px / 300px)

### Aplicação
- `/browse` — list + detail
- `/study/feynman` — chunk pane + texarea pane
- `/favorites` — list + detail
- Future `/collections/[id]` (item 38)

### Tab system dentro do detail pane
- Tabs: Overview | Examples | IPA | Grammar | Notes (item 38) | History (versioning item 18)
- Active tab persiste per chunk

### Quick switcher
- Keys: `↑` / `↓` navegam lista, `Enter` selects, `→` foca detail
- Vim-like JK shortcuts (item 26)

### Primitive
`src/components/ui/SplitPane.tsx`:
```tsx
<SplitPane storageKey="browse-split" minLeft={200} minRight={300}>
  <SplitPane.Left><BrowseList /></SplitPane.Left>
  <SplitPane.Right><ChunkDetail /></SplitPane.Right>
</SplitPane>
```

## Arquivos

- `src/components/ui/SplitPane.tsx` (NEW)
- `src/components/browse/BrowseLayout.tsx` (refactor master-detail)
- `src/components/chunks/ChunkDetailPane.tsx`
- `src/lib/hooks/useSplitSize.ts`

## Validação

- [ ] Resizable funciona, persiste size
- [ ] Mobile fallback navega normal
- [ ] URL sync com selection (`?selected=123`)
- [ ] Browser back retorna a selection anterior
- [ ] Keyboard arrow nav funciona
- [ ] Focus management: tab cycles entre panels

## Decisões pendentes

- Tab pane sticky ou scroll independente? Independente preferível.
- Pin/unpin chunks para reference enquanto navega lista?
- Multi-pane (3-col: list + detail + notes)? Defer — complexidade.
