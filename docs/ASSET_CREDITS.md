# Asset credits and provenance

All 3D geometry in After Hours is procedural, built in code with three.js primitives (`src/scene/`). No third-party models are used.

## Generated images

The textures in `public/textures/` and the Dream Loop target image were generated during the build with Cloudflare Workers AI on the project owner's account. They are original outputs, not stock assets.

| File | Model | Use |
|---|---|---|
| `skyline2.jpg` | `@cf/black-forest-labs/flux-1-schnell` | Blue hour city backdrop behind the glass wall (top half is used). |
| `skyline.jpg` | `@cf/bytedance/stable-diffusion-xl-lightning` | Earlier night skyline, kept as an alternative backdrop. |
| `walnut.jpg` | `@cf/black-forest-labs/flux-1-schnell` | Bar top and front panel. |
| `floor.jpg` | `@cf/black-forest-labs/flux-1-schnell` | Terrazzo floor. |
| `velvet.jpg` | `@cf/black-forest-labs/flux-1-schnell` | Stool and lounge chair upholstery. |
| `brass.jpg` | `@cf/black-forest-labs/flux-1-schnell` | Brushed brass rail. |

The Dream Loop target (`.dream-loop/target.png`, not committed) was generated with `@cf/black-forest-labs/flux-2-dev` from the brief's reference composition description.

## Fonts

System font stacks only. No web fonts are loaded.

## Text content

All characters, dialogue, rejections, routines, coach lines, and codex adaptations are original to this project. The codex cites the brief's source register (R1 to R9) for historical community meanings.
