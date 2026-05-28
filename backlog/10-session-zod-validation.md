---
prioridade: 10
categoria: security
esforco: 2h
risco: baixo
status: done
---

# Session payload Zod validation

## Contexto

`src/lib/auth/session.ts` lê cookie `session` e faz `JSON.parse` + `as Partial<SessionData>` sem validação estrutural. Cookie httpOnly mas qualquer payload malformado/truncado/legacy passa adiante com tipos errados.

## Problema

- `userId` poderia chegar como string, array, objeto — qualquer query SQL recebe input inesperado
- `expiresAt` ausente = sessão eterna (atualmente guarda com `if (session.expiresAt)`, mas tipo permite undefined silencioso)
- Sem schema central, qualquer mudança de payload quebra silenciosamente

## Proposta

1. Adicionar `sessionPayloadSchema` em `src/lib/validation/schemas.ts`:
   ```ts
   export const sessionPayloadSchema = z.object({
     userId: z.number().int().positive(),
     username: z.string().min(1).max(200),
     expiresAt: z.number().int().positive(),
   });
   ```
2. Refatorar `getSession()` para `safeParse` o JSON parsed
3. Rejeitar (return null) em: cookie ausente, JSON inválido, schema mismatch, expirado

## Arquivos

- `src/lib/auth/session.ts`
- `src/lib/validation/schemas.ts`

## Validação

- [x] Teste: cookie ausente → null
- [x] Teste: JSON inválido → null
- [x] Teste: `userId` string → null
- [x] Teste: `expiresAt` ausente → null
- [x] Teste: payload expirado → null
- [x] Teste: payload válido → SessionData

## Decisões pendentes

- Assinatura/encriptação do cookie (HMAC + KMS) — fora deste escopo
