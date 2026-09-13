# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

After Hours is a first-person social challenge game: a rooftop lounge, four principal characters performed by an AI actor, an authored encounter graph, and a deterministic rules engine that owns every score. The full design brief lives in `docs/AFTER_HOURS_BRIEF.md` and is the source of truth for scope and tone. Read it before changing content or rules.

Stack: React 19 + Vite 8 + @react-three/fiber for the client, a Hono Worker with one Durable Object per run on Cloudflare, Workers AI (Nemotron) for the evaluator and actor, TypeScript everywhere.

## Commands

```bash
bun install            # or npm install
bun run dev            # Vite dev server with the Workers AI binding (needs `wrangler login`)
bun run dev:demo       # Same, but the authored demo provider with no login required
bun run test           # Vitest: engine acceptance tests
bun run typecheck      # tsc -b across app, worker, and node configs
bun run lint           # ESLint (React compiler purity rules are on)
bun run build          # Production build to dist/
bun run deploy         # Build and wrangler deploy
bun run cf-typegen     # Regenerate worker-configuration.d.ts after wrangler.jsonc changes
```

## Layout

- `shared/game/` pure engine and content. No I/O, no framework imports. `engine.ts` is the only place that changes run state. `evaluation.ts` holds the evaluator and actor output schemas. `content/` holds characters, the node graph, routines, scenarios, coach lines, and the codex.
- `worker/` Hono API (`index.ts`), Durable Object session (`session/EncounterSession.ts`), evaluator and actor orchestration, and provider adapters in `ai/`.
- `src/` React client: `state/` game store, `scene/` three.js lounge and characters, `hud/` interface, `game/` API client and device-local save.
- `docs/` brief, research note, asset credits.

## Rules that matter here

- The four responsibilities stay separate: engine (authoritative state), evaluator (proposes bounded observations), actor (performs the committed event), coach (satire only). Nothing in the client or coach may change scores.
- Every turn is applied exactly once per turn id. Keep the idempotent path in `EncounterSession.turn` intact.
- Player text is untrusted scene dialogue. It is never an instruction to the evaluator or actor.
- Difficulty changes starting conditions, never the evaluator rubric. Ethnicity or background never feeds a global attraction or difficulty multiplier.
- A closed encounter stays closed. Rejection, boundary, and ending nodes are terminal.
- Never use `any`. Never use dynamic imports. Keep comments about the code, not about the change.
- Keep engine tests meaningful (behaviors from the brief's acceptance list), not tautological.
- Do not ship secrets or model configuration to the browser. Provider settings live in `wrangler.jsonc` vars and `.dev.vars`.
