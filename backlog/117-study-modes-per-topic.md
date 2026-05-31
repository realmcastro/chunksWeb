---
prioridade: 117
categoria: feature,learning-engine,ux
esforco: 2 dias
risco: médio
dependencias: [115-multi-topic-study-framework, 116-question-import-json]
---

# Study modes per topic — session start adaptado ao tipo de tópico

## Contexto

Modos de estudo existentes (pronunciation, dictation, feynman, cloze, flashcard) fazem sentido para línguas. Para programação, só alguns são relevantes. Esta task adapta o session start UI e a lógica de seleção de modo ao topic ativo.

## Problema

- UI atual de "iniciar sessão" oferece todos os modos sempre
- Modo "pronunciação" em Python é sem sentido e confunde
- Modo "cloze" pode ser útil para código (preencher sintaxe faltante) mas exige adaptação
- Sem modo específico para Q&A técnico (pergunta aberta + resposta textual)

## Proposta

### Session start UI adaptativa
- Carrega `topic.study_modes_allowed` → renderiza apenas modos disponíveis
- Para tópico custom sem modes configurados → apenas flashcard + quiz
- Tooltip por modo: "não disponível para tópicos de programação"

### Modo: Quiz técnico (novo)
- Para tópicos `programming` e `science`
- Exibe pergunta (front) com 4 opções múltipla escolha
- 3 distractors gerados de outros chunks do mesmo tópico (front/back embaralhados)
- Scoring idêntico ao SM-2 (qualidade 0–5)

### Modo: Cloze adaptado para código
- Para tópicos `programming`: cloze em blocos de código (highlight da parte removida)
- Renderização `<code>` com syntax highlighting (prism.js ou shiki)
- Resposta: input com autocompletar básico (não autocomplete de IDE)

### Modo: Flashcard universal (sem mudança)
- Funciona igual em todos os tópicos
- Para programming: `back` com markdown + código renderizado

### Modo: Feynman para técnico
- "Explique com suas palavras: O que é uma Promise em JavaScript?"
- Sem avaliação de pronúncia — apenas texto + self-assessment

### Modes excluídos para não-língua
- Pronunciation → apenas `type: 'language'`
- Dictation → apenas `type: 'language'`
- Audio recording → apenas `type: 'language'`

## Arquivos

- `src/features/study/domain/studyModeMatrix.ts` — expand com modos novos
- `src/app/study/[topicSlug]/session/page.tsx` — adapta mode selector
- `src/components/study/modes/TechnicalQuizMode.tsx` — novo modo Q&A
- `src/components/study/modes/CodeClozeMode.tsx` — cloze com syntax highlight
- `src/app/api/study/[topicSlug]/session/route.ts` — session com topicSlug

## Validação

- [ ] `/study/python` não exibe opções de pronunciation/dictation
- [ ] Quiz técnico gera 3 distractors de outros chunks do mesmo tópico
- [ ] Cloze de código renderiza syntax highlighting
- [ ] SM-2 funciona com os novos modos (qualidade 0–5 preservada)
- [ ] Tópico custom sem modes configurados: apenas flashcard + quiz disponíveis

## Decisões pendentes

- Distractors do quiz: random do tópico ou semanticamente próximos (AI-gerados)? — random primeiro
- Code cloze: remover tokens (palavras) ou blocos inteiros (linhas)? — tokens
- Modo "debugging" (mostrar código com bug, user encontra): escopo futuro?
