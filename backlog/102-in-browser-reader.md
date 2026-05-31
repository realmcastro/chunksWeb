---
prioridade: 102
categoria: feature,library,ux
esforco: 3-5 dias
risco: alto
dependencias: [100-reading-module-schema, 101-book-library-ui]
---

# In-browser reader — renderização de PDF/EPUB/Mobi

## Contexto

O reader é o core do módulo de leitura. Deve renderizar o conteúdo do livro dentro do site, com persistência de posição automática (task 103) e controles de leitura confortáveis.

## Problema

- PDF/EPUB/Mobi são formatos binários — sem biblioteca específica são ilegíveis no browser
- Cada formato exige engine diferente
- Reader deve ser usável em mobile (tela pequena, touch scroll, font size)
- Performance: PDF de 500 páginas não pode ser carregado todo de uma vez

## Proposta

### Rota
`/library/[bookId]/read` — reader dedicado (full-screen, sem navbar)

### Engines por formato
| Formato | Biblioteca | Notas |
|---------|-----------|-------|
| PDF | `pdfjs-dist` (Mozilla PDF.js) | Render canvas por página, lazy load |
| EPUB | `epubjs` | Reflowable, CSS customizável |
| MOBI | Converter server-side → EPUB ou texto | Mobi é proprietário; fallback txt |
| TXT | Componente custom | Split por parágrafos, scroll virtual |

### Controles de leitura
- Navegação: próxima página, página anterior, input "ir para página N"
- Fonte: size slider (12px–24px), família (serif/sans)
- Tema: light / sepia / dark (respeitar dark mode do sistema)
- Barra de progresso visual (topo da página)
- Sidebar: índice/TOC (se epub/pdf tiver bookmarks)

### Persistência automática
- Ao mudar de página → `PATCH /api/books/[id]/progress` com `current_page` + `total_pages_rendered`
- Debounce 1s (não bater API a cada scroll pixel)
- Ao abrir livro → fetch `GET /api/books/[id]/progress` → jump direto para última página

### Performance
- PDF: renderizar apenas página atual ± 2 (lazy canvas render via IntersectionObserver)
- EPUB: lazy chapter load
- Lazy import do engine: `dynamic(() => import('./PdfReader'), { ssr: false })`

## Arquivos

- `src/app/library/[bookId]/read/page.tsx` — shell, fetch metadata/progress
- `src/features/reader/presentation/ReaderShell.tsx` — layout full-screen
- `src/features/reader/presentation/PdfReader.tsx` — client, pdfjs
- `src/features/reader/presentation/EpubReader.tsx` — client, epubjs
- `src/features/reader/presentation/TxtReader.tsx` — client, custom
- `src/features/reader/domain/readerTypes.ts` — ReadingPosition, ReaderConfig
- `src/app/api/books/[id]/progress/route.ts` — GET + PATCH

## Validação

- [ ] PDF 200 páginas carrega página 1 em < 2s
- [ ] Mudança de página persiste em < 1.5s (debounce)
- [ ] Reload da página → reader abre na última página salva
- [ ] Font size funciona em PDF e EPUB
- [ ] Mobile: touch scroll suave, controles acessíveis (touch targets ≥ 44px)
- [ ] Tema sepia/dark funciona sem flash de branco

## Decisões pendentes

- MOBI: converter server-side (Calibre CLI?) ou rejeitar e pedir EPUB?
- Highlight/anotação de trechos no reader? (escopo futuro — não bloqueia agora)
- Offline: service worker cache das páginas mais recentes?
