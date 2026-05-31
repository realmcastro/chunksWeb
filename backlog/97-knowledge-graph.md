---
prioridade: 97
categoria: feature,architecture,ux
esforco: 4-5 dias
risco: alto
dependencias: [84-internal-event-bus, 94-global-search-architecture, 107-journal-cross-reference]
---

# Knowledge graph pessoal — mapa de conexões entre conhecimento

## Contexto

Estudei distributed systems → li livro X → anotei no diário → relacionei com meta do semestre → projeto Discord. Com event bus e cross-references, essas conexões já existem nos dados. Esta task as torna visíveis como grafo navegável.

## Problema

- Conhecimento fragmentado em silos: estudo, leitura, diário, projetos
- Sem visão de como conceitos se conectam
- Insights de conexões ficam implícitos, nunca visualizados
- "O que eu sei sobre Redis?" requer lembrar onde anotei

## Proposta

### Schema de relações

```sql
CREATE TABLE knowledge_nodes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL,   -- 'chunk' | 'book' | 'journal_entry' | 'concept' | 'tag'
  entity_id TEXT NOT NULL,     -- id na tabela de origem
  label TEXT NOT NULL,         -- texto exibido no grafo
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE TABLE knowledge_edges (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  source_node_id INTEGER NOT NULL REFERENCES knowledge_nodes(id),
  target_node_id INTEGER NOT NULL REFERENCES knowledge_nodes(id),
  relation_type TEXT NOT NULL,   -- 'referenced_in' | 'tagged_with' | 'studied_after' | 'inspired_by' | 'same_concept'
  weight REAL DEFAULT 1.0,       -- frequência/força da conexão
  created_at INTEGER NOT NULL,
  UNIQUE(source_node_id, target_node_id, relation_type)
);
```

### Construção automática de arestas

Via event bus subscribers:
- `journal.cross_reference.created` → edge `journal_entry → chunk/book`
- `study.domain.chunk_reviewed` (N vezes no mesmo dia de entrada no diário) → edge `chunk → journal_entry` com weight
- Tags compartilhadas entre chunk e journal entry → edge `same_concept`
- Highlights em livros + chunk sobre mesmo tópico → edge sugerida

### Visualização

- `/knowledge` — grafo interativo (força-directed)
- Biblioteca: D3.js force graph ou `react-force-graph` (3D opcional)
- Nós por tipo: cor diferente (chunks=azul, livros=verde, diário=laranja, conceitos=roxo)
- Zoom in: ver label, tipo, data
- Clique no nó: painel lateral com detalhes + link para o recurso
- Filtrar por tipo de nó ou by tag
- "Vizinhos de 2º grau": expandir conexões indiretas

### Busca no grafo

"O que eu sei sobre Redis?" →
1. FTS busca nodes com label contendo "redis"
2. Expande grafo até 2 níveis
3. Retorna: "3 chunks estudados, 1 capítulo no livro X, 2 entradas no diário mencionando redis"

### Detecção de clusters

- Algoritmo de community detection (Louvain simplificado sobre as arestas)
- Identifica automaticamente: "Você tem um cluster forte sobre 'sistemas distribuídos'"
- Mostra no dashboard como "Áreas de conhecimento"

## Arquivos

- Migration: `knowledge_nodes`, `knowledge_edges`
- `src/lib/knowledge/graphBuilder.ts` — criação de nós e arestas via eventos
- `src/lib/knowledge/graphQuery.ts` — queries de vizinhança, clusters
- `src/app/api/knowledge/graph/route.ts` — GET subgrafo do user
- `src/app/knowledge/page.tsx` — visualização principal
- `src/components/knowledge/ForceGraph.tsx` — Client, D3/react-force-graph
- `src/components/knowledge/NodeDetail.tsx` — painel lateral ao clicar nó
- `src/lib/events/subscribers/knowledgeGraphBuilder.ts`

## Validação

- [ ] Criar cross-reference no diário → edge criada entre entry e chunk
- [ ] Grafo com 200 nós renderiza em < 2s
- [ ] Clicar em nó do tipo `book` → painel mostra capa + link para /library/[bookId]
- [ ] Cluster detection: 10+ nós sobre "python" → identificados como cluster
- [ ] Filtrar por tipo: apenas journal entries visíveis

## Decisões pendentes

- 3D graph (react-force-graph-3d) ou 2D? — 2D primeiro, 3D como delight opcional
- Nodes manuais (user cria conceito explícito): sim (tipo `concept`) — mas não bloqueia launch
- Export do grafo como JSON para uso externo?
- Privacidade: grafo contém conteúdo do diário — nunca indexar externamente
