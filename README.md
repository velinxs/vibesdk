# After Hours

A first-person social challenge game set in a rooftop lounge at blue hour. You approach four fictional adult women with distinct personalities and social circles, speak or type freely, and an AI actor performs them while an authored encounter graph and a deterministic rules engine decide what your words actually did. The interface is a gorgeous, serious-looking simulator with an absurdly earnest 2000s pickup-artist HUD bolted on top. The coach is satire. The scoring is not.

The design brief is in `docs/AFTER_HOURS_BRIEF.md`. It is the source of truth for scope and tone.

## What is here

- **Engine** (`shared/game/`): authoritative run state, seeded randomness, a data-driven node graph with eight stages per character, recovery branches, boundaries, rejections, endings, routines with mastery separate from suitability, four difficulty scenarios, and the Canadian newcomer storyline. Pure TypeScript with tests.
- **Worker** (`worker/`): a Hono API and one Durable Object per run. Each turn is evaluated by a separate model context, validated against a schema, applied exactly once, then performed by the actor. Duplicate submissions replay the cached result. Provider outages return a retryable error without scoring.
- **Client** (`src/`): React and three.js. A procedural lounge with a curved walnut bar, brass, charcoal velvet, pendant lamps, a glass wall onto a generated skyline, animated characters with gaze, expressions, gestures, and speech-driven mouths. Desktop pointer lock and WASD, touch look and tap-to-approach on mobile. Practice, challenge, and replay flows, coach, routines, codex, settings, and a debrief with evidence per turn.

## Run it

```bash
bun install
cp .dev.vars.example .dev.vars

# Live characters on Workers AI (Nemotron). Needs a Cloudflare login because the AI binding runs remotely.
npx wrangler login
bun run dev

# No login: authored demo mode. Scripted lines and a heuristic evaluator, labeled as such in the HUD.
bun run dev:demo
```

Open http://localhost:5173. Practice mode with Mara is the tutorial path; a reachable positive ending exists on every difficulty.

Checks:

```bash
bun run test        # engine acceptance tests
bun run typecheck
bun run lint
bun run build
```

Deploy with `bun run deploy` (runs `wrangler deploy`). The Worker needs the `AI` binding and the `ENCOUNTER_SESSION` Durable Object declared in `wrangler.jsonc`; both are created on first deploy.

## Configuration

`wrangler.jsonc` vars:

| Var | Meaning |
|---|---|
| `AI_PROVIDER` | `workers-ai` (default) or `demo`. |
| `WORKERS_AI_ACTOR_MODEL` | Model for the NPC actor. Default `@cf/nvidia/nemotron-3-120b-a12b`. |
| `WORKERS_AI_EVALUATOR_MODEL` | Model for the evaluator. Same default, separate context. |

Nothing model-related reaches the browser. `/api/health` reports whether the server is live or demo, and the HUD labels demo output.

## Persistence

Progress (settings, routine mastery, unlocks, run summaries, achievements) is saved in the browser's local storage on that device only. There is no account. A new run resets encounter interest and scenario memory; only the intended progression persists.

## Speech

Typed play is the baseline. The settings panel can enable spoken character lines (browser speech synthesis) and a microphone button (browser speech recognition). Microphone access is requested only when the button is pressed, transcripts are shown before sending, and no audio is stored.

## Content

Everything is fictional. All romantic characters are adults. Follower counts and phone numbers are invented. Nothing connects to a real messaging service or social account. See `docs/RESEARCH_NOTE.md` for the terminology pass and `docs/ASSET_CREDITS.md` for asset provenance.

## Limitations

See the delivery notes in the pull request or commit message for the honest status of visuals, live AI validation, and measured performance.
