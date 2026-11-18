# Roads & Boats — Digital Edition

A faithful digital adaptation of **Roads & Boats**, the classic logistics and economic optimization board game designed by **Jeroen Doumen & Joris Wiersinga** and published by **Splotter Spellen**.

Players command donkeys, wagons, steam trucks, rafts, rowboats, and steamers across a hex-grid landscape to extract raw resources, construct roads and bridges across rivers, refine goods through an interconnected industrial tech tree, research new technologies, score wealth in coins and stock certificates, and contribute bricks to the Wonder of the World.

---

## Project Goals

1. **Rules-Faithful 3rd Edition Engine**
   - Server-authoritative TypeScript rules engine (`src/game/rules-engine.ts`, `src/game/drive-ruleset.ts`, `src/game/engine/`) enforcing the 4-phase round structure (**Production → Movement → Building → Wonder**).
   - **River-Divided Tile Isolation**: Tiles split by unbridged rivers track banks independently—construction materials, factory inputs/outputs, pickup/drop access, and road/bridge connections respect river barriers until a bridge connects the banks.
   - **Authentic Logistics & Production**: Fixed 2-good donkey capacity (geese consume 0 capacity), stone-only land roads, board-only river bridges, finite mine ore draw pools, privacy breeding for Donkeys and Geese (strictly 2 on an isolated empty pasture), technology research (`2 Geese + 1 Paper`), and building/producing using either ground goods or loaded transporter cargo (with an interactive pre-production cargo prompt).
   - **Wonder & Victory Scoring**: Escalating per-round brick costs, neutral brick progression, desert-to-pasture irrigation trigger, proportional row scoring, and cargo wealth scoring (Gold, Coins, Stock Certificates).

2. **Full Solo, Bot, and Real-Time Multiplayer Play**
   - **33 Deduplicated Map Scenarios** across 4 map sets, including all **13 official 20-turn Solitaire optimization puzzles** (`docs/scenarios/`, `src/game/scenarios.ts`), Splotter Scenario Book maps, 1–2 player duel maps, and standard multiplayer/tutorial boards.
   - **Server-Backed Multiplayer & SSE Sync**: Express backend (`server.ts`) with persistent match state (`data/roads_and_boats_db.json`), Server-Sent Events streaming, match codes, resign/rejoin handling, and multi-step undo/redo snapshot memory.
   - **Rule-Compliant AI Opponents**: Modular bot framework (`src/game/engine/bots/`) including the **Stock Apprentice AI**, which plans roads, bridges, research, and full Stock Certificate production chains strictly under player rules.

3. **Clean Interactive Board UI & Rule Verification**
   - Full-viewport SVG hex map (`src/components/HexBoard.tsx`) supporting both pointy-top and flat-top map orientations, pan/zoom/touch controls, side-specific bank anchors around unbridged rivers, and bottom-bar stage controls.
   - Built-in learning and verification tools: interactive **Tutorial**, **Player Aid**, **Almanac**, and an automated **15-suite Gameplay & Rules Simulator** (`src/game/simulationTest.ts`) runnable both in-app and from the CLI.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS 4
- **Backend**: Node.js, Express, Server-Sent Events (SSE), `tsx`
- **Verification**: Custom 15-suite rules & AI simulation runner (`npm test`) and TypeScript strict check (`npm run lint`)

---

## Getting Started

### Prerequisites
- Node.js 20+ (tested on Node 22)

### Installation & Development

```bash
npm install
npm run dev
```

The Express + Vite dev server runs on **`http://localhost:3000`**.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start full-stack Express + Vite dev server on port 3000 |
| `npm start` | Start the server (`tsx server.ts`) |
| `npm run build` | Build production frontend bundle (`dist/`) |
| `npm run lint` | Run TypeScript typechecking (`tsc --noEmit`) |
| `npm test` | Run all 15 automated gameplay, river-isolation, cargo, breeding, and AI simulation tests |

---

## Project Structure

- `server.ts` — Express REST API, SSE state broadcast, match persistence, and AI turn execution
- `src/App.tsx` — Top-level Lobby / Game state router, SSE synchronization, and modal orchestration
- `src/game/rules-engine.ts` & `src/game/drive-ruleset.ts` — Authoritative 3rd Edition rule specifications
- `src/game/engine/` — Modular engine (`setup.ts`, `movement.ts`, `building.ts`, `production.ts`, `history.ts`, `bots/`)
- `src/game/riverSides.ts` & `src/game/hexMath.ts` — Axial hex math and unbridged riverbank region partitioning
- `src/game/maps/` & `src/game/scenarios.ts` — Map builders and scenario metadata across all 33 scenarios
- `src/components/` — Hex board layers, HUD, Construction/Research menu, Cargo manager, Wonder pyramid, Pre-Production Cargo prompt, Player Aid, Tutorial, and Test Runner UI
- `src/game/simulationTest.ts` — Automated test suite verifying rules, edge cases, and AI play

---

## Credits

- Original tabletop board game **Roads & Boats** by **Jeroen Doumen & Joris Wiersinga** (**Splotter Spellen**).
- Solitaire scenario designs and community records attributed to their respective designers in `src/game/scenarios.ts` and `docs/scenarios/`.
