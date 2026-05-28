---
prioridade: 79
categoria: feature,ux,delight
esforco: 3-5 dias
risco: medio
---

# Mascot / companion pet (Tamagotchi-style engagement)

## Contexto

Apps de aprendizado bem-sucedidos têm mascot identitário (Duolingo Owl, Memrise rocket, Speak fox). ChunksWeb sem persona / no character anchoring.

## Problema

- Sem identidade visual marcante além do logo
- Sem hook emocional ("não quero decepcionar meu pet")
- Brand recognition baixo
- Sem narrative companion durante journey longo (meses de study)

## Proposta

### Companion: "Chunkie" (nome pendente)
Personagem amistoso, design indie/charming (não infantil demais). Sugestões:
- Cute creature inspirado em chunks (bricks? Lego-like animal?)
- Polyglot owl (variation de Duolingo evitada por copyright)
- Chunky polvo (oito tentáculos = oito linguagens?)
- Estilo: low-poly 3D OR flat illustration vector

**Final design**: subject de design sprint separada.

### Estados emocionais (sprite/animation variants)
- Happy: streak ativo, study today completed
- Excited: PR record broken, achievement unlocked
- Sleepy: late night session
- Sad: streak quebrado, missed N days
- Studious: actively studying mode
- Confused: low quality ratings recentes
- Hungry: pet "feeds on chunks" — N reviews/dia keep happy

### Evolução / Growth
Stages baseados em total mastered chunks:
- Egg (0 chunks): just hatched
- Baby (10): tiny version
- Junior (100): basic form
- Pro (500): grown
- Master (2000): full evolution
- Legend (5000): special form, glowing

### Placement
- **Hero spot**: dashboard pet anchored
- **Floating buddy**: small corner em todas pages (toggleable)
- **Study companion**: cheerleader em study mode
- **Screensaver star**: pet ocupa idle screensaver (item 78)

### Interactions
- Tap pet → speech bubble com fala contextual ("Welcome back!", "5 reviews due!", "I missed you")
- Daily petting (1× day): tap pet → animation + small XP
- Feed pet: study reviews count automatic (no manual feed friction)
- Customize: hat, accessory, color (unlocked via achievements)

### Speech corpus
- Phrasebook curated: ~200 phrases per language
- Per-state, per-time-of-day, per-streak-length
- LLM-generated dynamic phrases (item 80 hook) — opcional

### Audio
- Optional voice clips (cute "boop" sounds)
- Disable in settings

### Anti-dark-pattern
- **NEVER** "pet is dying" guilt-trip (Duolingo-style criticism)
- Pet just sleeps quando idle long. Sem death.
- Tone: encouragement, never shame

### Customization
- Color picker (unlock palette via streaks)
- Outfit (hats, glasses, scarf) — earnable through achievements
- Name (user names own pet — bonding)

## Arquivos

- `public/mascot/` — sprites/animations (Lottie JSON ideal: vector + animation)
- `src/components/mascot/Mascot.tsx`
- `src/components/mascot/MascotSpeechBubble.tsx`
- `src/components/mascot/MascotCustomizer.tsx`
- `src/lib/mascot/state.ts` — derive emotional state from user stats
- `src/lib/mascot/phrases.ts` — i18n speech corpus
- `src/lib/db/sqlite.ts` — user_mascot_state (name, level, outfit, last_petted_at)
- Migration

## Validação

- [ ] Mascot renders smooth on all pages onde toggle ON
- [ ] State accurate: streak active → happy; streak broken → sad (not snarky)
- [ ] Evolution upgrade ceremony (em mastered threshold cross)
- [ ] Pet name persiste cross-device
- [ ] Accessibility: image alt + screen reader announces state
- [ ] Performance: Lottie/SVG < 50kb total, 60fps animation
- [ ] Mobile: corner placement não conflita com nav

## Decisões pendentes

- **Design / mascot identity**: hire illustrator ou DIY/AI-gen?
- Lottie animation vs sprite sheet vs SVG inline? Lottie melhor for complexity.
- 3D model (Three.js) — defer cost overhead.
- Default OFF ou ON? **OFF default**, user opts in (avoid imposing).
- Pet voice clips: tem royalty-free options? Iconic vs generic?
- Multi-mascot choice (different species)? Defer V2.
- Optional dark mode pet variant?
