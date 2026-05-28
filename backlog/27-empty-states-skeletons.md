---
prioridade: 27
categoria: ux
esforco: 1 dia
risco: baixo
---

# Empty states + loading skeleton consistency

## Contexto

`loading.tsx` existe em algumas rotas. Skeletons usados parcialmente. **Empty states ausentes**: "sem chunks due", "favoritos vazios", "histórico Feynman vazio" mostram ou nada ou texto genérico.

## Problema

- User novo abre app vazio → confusão sobre próximos passos
- Sem CTA contextual em estado vazio
- Skeleton vs spinner inconsistente entre rotas

## Proposta

### Componente compartilhado
`src/components/ui/EmptyState.tsx`:
```tsx
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
}
```

### Aplicar em
- `/review` due vazio → "All caught up! 🎉 Start learning new chunks." + CTA `/learn`
- `/favorites` vazio → "No favorites yet. Star chunks while studying."
- `/feynman/history` vazio → "Explain a chunk to start tracking your understanding."
- `/browse` filtros zero match → "No chunks match. Try adjusting filters." + clear button
- `/progress` zero sessions → onboarding hint

### Skeletons
- Auditar todas rotas com fetch — toda devem ter skeleton consistente (matching final layout)
- Padrão: 3-5 skeleton cards, animação `animate-pulse`, sem flash

### Onboarding flow
- Primeira sessão: tooltip overlay (1× only, stored em localStorage)
- Steps: "Click here to start", "Rate yourself 1-5", "See your streak"

## Arquivos

- `src/components/ui/EmptyState.tsx` (NEW)
- Múltiplas pages — adicionar branch quando count === 0
- `src/components/dashboard/DashboardClient.tsx` — onboarding hint

## Validação

- [ ] Cada empty state tem CTA acionável
- [ ] Onboarding aparece 1× e desaparece após dismiss
- [ ] Skeleton match final layout (sem layout shift)
- [ ] i18n traduz todas mensagens

## Decisões pendentes

- Onboarding: tooltip overlay (intrusive) ou inline hints?
- Onboarding reset: settings option "Reset tutorial"?
