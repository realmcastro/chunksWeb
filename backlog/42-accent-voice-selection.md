---
prioridade: 42
categoria: feature,ux
esforco: 1 dia
risco: baixo
---

# Accent / voice variety per language

## Contexto

`src/lib/pronunciation/` usa Web Speech API TTS. Default voice por language. User não pode escolher US vs UK vs AU, ou male vs female. Isso para outras linguagens, revisar ingles mas provavel que seja o unico funcional.

## Problema

- Aprendizado polifônico: user precisa expor múltiplos accents
- Preferência individual não atendida
- Voice settings (`voice-settings` route) existe mas underexplored

## Proposta

### Voice catalog

- Enumerar `speechSynthesis.getVoices()` por language
- UI: dropdown agrupado por accent (US/UK/AU/IN/etc.)
- Per-language preference: `user_voice_preferences (user_id, lang, voice_name)` — já existe?

### Multi-voice play

- Setting: "Hear in different accents" (FR: France, Canada)
- Random per chunk, ou cycle US → UK → AU
- Útil em listening exposure

### Speed / pitch

- Slider 0.5x – 1.5x speed
- Pitch ±20% (subtle)

### Preview

- Em settings: botão "Preview" play voice exemplo

## Arquivos

- `src/lib/pronunciation/voices.ts` — enumerate + filter
- `src/components/settings/VoiceSettings.tsx`
- `src/app/api/voice-settings/route.ts` (existe — expand)
- `src/lib/pronunciation/services/TTSCoordinator.ts` — accept voice param

## Validação

- [ ] Dropdown lista vozes disponíveis no browser
- [ ] Switch voice persiste cross-session
- [ ] Multi-accent mode varia entre reviews
- [ ] Fallback se voice unavailable (default)
- [ ] Mobile: iOS/Android voice lists differ (handle gracefully)

## Decisões pendentes

- Server-side TTS (ElevenLabs, OpenAI) para qualidade superior? Custo $$, defer. User quer free e local.
- Cache local de voice preferences vs sync server? Sync mantém cross-device.
