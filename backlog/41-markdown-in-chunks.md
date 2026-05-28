---
prioridade: 41
categoria: feature,ux
esforco: 4h
risco: baixo
---

# Markdown em chunk_text / meaning / examples

## Contexto

Atual: plain text. Sem bold, italic, links, code (relevante para technical English).

## Problema

- Limitações didáticas: não dá para enfatizar partícula importante ("**make** up your mind")
- Sem links contextuais (ex: link para grammar rule explicando phrasal verbs)
- Code chunks ("git commit") não diferenciados visualmente

## Proposta

### Subset markdown safe
- Bold `**x**`
- Italic `*x*`
- Inline code `\`x\``
- Link `[text](url)` — apenas https URLs, blocked javascript:

### Render
- Lib: `marked` ou `markdown-it` com sanitizer
- Ou: regex-based custom (subset pequeno) para evitar dep + XSS surface

### Sanitize
- DOMPurify após render
- Whitelist tags: strong, em, code, a (apenas href https/http)
- Strip todo o resto

### Aplicar em
- chunk_text (modesto — apenas bold/italic recomendado)
- meaning (full subset)
- example.text_en, example.text_target

## Arquivos

- `src/lib/markdown/render.ts` (NEW)
- `src/components/chunks/ChunkCard.tsx` — render via dangerouslySetInnerHTML (sanitized)
- `src/components/chunks/ChunkDetail.tsx`

## Validação

- [ ] `**bold**` renderiza `<strong>`
- [ ] `<script>` strip silently
- [ ] javascript: URL strip
- [ ] Markdown preview em admin/chunk editor (futuro item 81)
- [ ] Plain text user input non-broken (fallback graceful)

## Decisões pendentes

- Render server ou client? Server reduz hydration cost.
- Headings (h1-h6) permitidos? Provavelmente não (chunks são frases).
- Imagens inline? Não (já temos vocabulary/image system separado).
