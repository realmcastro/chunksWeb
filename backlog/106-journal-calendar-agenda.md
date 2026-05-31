---
prioridade: 106
categoria: feature,journal,ux
esforco: 1.5 dias
risco: baixo
dependencias: [105-journal-module-schema]
---

# Journal calendar — visão mensal + agenda do dia

## Contexto

Com entradas criadas (105), o user precisa de uma visão temporal: calendar mensal para navegar entre dias, e agenda detalhada para o dia selecionado.

## Problema

- `/journal/YYYY-MM-DD` acessa uma entrada mas sem contexto do mês
- Sem visão do que foi feito nos dias anteriores
- Sem "hoje" como ponto de entrada natural

## Proposta

### Rota principal
`/journal` → redireciona para `/journal/YYYY-MM-DD` (hoje)

### Layout split (desktop)
```
┌──────────────────┬──────────────────────────┐
│  Calendar mensal │  Editor do dia selecionado│
│  (mini, 280px)   │  + goals checklist        │
│                  │  + cross-references (107) │
└──────────────────┴──────────────────────────┘
```

### Calendar mensal
- Navegação mês anterior/próximo
- Dias com entrada: dot indicator (cor por mood se preenchido)
- Dia atual: destaque visual
- Clique num dia → carrega editor à direita (client navigation sem reload)
- Mobile: calendar colapsável (accordion), editor full-width abaixo

### Agenda lateral (abaixo do calendar)
- Mostra goals do dia selecionado como checklist compacto
- "3/5 metas concluídas hoje"
- Link rápido para o dia

### Indicators no calendar
- Entrada existente: dot cinza (sem mood) ou dot colorido (com mood 1–5)
- Goals completadas: ícone de check pequeno
- Dias sem entrada: vazio

## Arquivos

- `src/app/journal/page.tsx` — redirect para hoje
- `src/app/journal/layout.tsx` — layout split + calendar sidebar
- `src/components/journal/MonthCalendar.tsx` — Client, calendar interativo
- `src/components/journal/DayAgenda.tsx` — goals compactos do dia
- `src/app/api/journal/route.ts` — GET com `from` + `to` para carregar indicators

## Validação

- [ ] Navegar entre meses carrega indicators corretos
- [ ] Clicar em dia com entrada abre editor com conteúdo
- [ ] Clicar em dia vazio abre editor vazio pronto para escrever
- [ ] Mobile: calendar colapsável, editor full-width
- [ ] "Hoje" sempre destacado independente do mês navegado

## Decisões pendentes

- Mood colors: escala de cor (vermelho→verde) ou ícones (emoji)?
- Calendar: biblioteca (react-calendar, react-day-picker) ou componente custom?
