# ADR-005: Pronunciation Subsystem Architecture

## Status

Accepted — most complex module in the codebase.

## Context

Application needs text-to-speech, IPA phoneme display, and voice preference management for language learning. This requires browser APIs (Web Speech API), offline caching (IndexedDB), and SSR safety.

## Decision

Create a layered pronunciation subsystem at `src/lib/pronunciation/` with:
- Engine layer (TTS, IPA, G2P)
- Service layer (coordination, highlighting, preferences)
- Hook layer (React integration)
- Storage layer (IndexedDB persistence)
- UI layer (display components)

Each layer has both server-safe and client-safe variants.

## Architecture

```
engines/     → Pure computation (IPA conversion, G2P rules, TTS wrapper)
services/    → Orchestration (coordinate engines, manage state)
hooks/       → React integration (connect services to components)
storage/     → Persistence (IndexedDB via Dexie for offline)
ui/          → Presentation (PhonemeDisplay, PlaybackControls, etc.)
```

## Rationale

1. **SSR safety** — Separate server-safe and client-safe implementations prevent hydration errors from Web Speech API access.
2. **Offline support** — IndexedDB caching via Dexie enables pronunciation data access without network.
3. **Separation of concerns** — Each layer has single responsibility. Engine doesn't know about React. Hook doesn't know about storage format.
4. **Testability** — Engines are pure functions. Services can be tested with mocked engines.

## Trade-offs

| Gain | Cost |
|------|------|
| SSR safe | Dual implementations (server + client) |
| Offline capable | IndexedDB complexity |
| Well-layered | More files than simple implementation |
| Testable in isolation | Higher learning curve for new contributors |

## Consequences

- New pronunciation features must respect the layer boundaries
- Client-safe variants must never access Web Speech API directly (use hooks)
- Storage layer owns all IndexedDB operations
- UI components are presentation-only (hooks provide data and actions)

## Risk

- Web Speech API availability varies by browser
- IndexedDB storage limits on mobile
- G2P accuracy depends on rules database completeness
