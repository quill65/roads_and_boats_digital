# Roads & Boats — Project Architecture Guide

Quick reference so sessions can jump straight to the right module without scanning the whole repo.

## Stack & Commands
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite (`src/`).
- **Backend**: Express + SSE (`server.ts`, port `3000`, `data/roads_and_boats_db.json`).
- **Verify Rules/Simulation**: `npx tsx scripts/run-simulation-test.ts` (13 suites)
- **Typecheck / Build**: `npm run lint` (`tsc --noEmit`), `npm run build`

## Scenario Reference (Do NOT Re-Read PDF)
- `docs/scenarios/README.md`: Authoritative index of all **13** official Solitaire scenarios (20 turns, 4 pre-filled Wonder rows, strictly 1 player only — zero bots, no extra joiners, reconnect attaches to the sole player, 1-player mining).
- `docs/scenarios/<slug>.md` + `docs/scenarios/<slug>.png`: Per-scenario geometry (`pointy` vs `flat`), exact `(q, r)` tile tables, rivers, railroads, rules, and official records. Always read these `.md`/`.png` files instead of the raw PDF.

## Directory Map
- `src/App.tsx`: Top-level screen router (`lobby` | `game`), API/SSE sync, modal state, `handleStartSolitaireScenario`.
- `server.ts`: REST endpoints (`/api/games`, `/join`, `/action`, `/resign`, `/reset`, `/stream`), disk persistence, AI turn trigger.
- `src/game/types.ts`: Core types (`TerrainType`, `GoodType`, `BuildingType`, `TransporterType`, `BotProfileId`, `HexOrientation`, `HexTile`, `HexEdge`, `GameState`).
- `src/game/hexMath.ts`: Pointy-top & flat-top axial `(q, r)` math (`E:+1,0`, `W:-1,0`, `NE:+1,-1`, `NW:0,-1`, `SE:0,+1`, `SW:-1,+1`), `getEdgeKey`, `hexToPixel`, `getHexCornerPoints`, `getSharedEdgeSegment`.
- `src/game/rules-engine.ts`: Authoritative Splotter rules (`SETUP_RULES`, `TRANSPORTER_RULES`, `INFRASTRUCTURE_RULES`, `BREEDING_RULES`, `RESEARCH_RULES`, `BUILDING_RULES`, `WONDER_TIER_RULES`).
- `src/game/constants.ts`: Terrain textures (`TERRAIN_AERIAL_TEXTURES`), terrain styling (`TERRAIN_INFO`), `GOOD_DETAILS`, `INITIAL_WONDER_TIERS`.
- `src/game/scenarios.ts`: `SOLITAIRE_SCENARIOS` metadata for all 13 official scenarios (targetScore, maxRounds: 20, mapPresetId, tactics, startingNotes).
- `src/game/maps/` (re-exported by `src/game/maps.ts`):
  - `types.ts`: `MapPreset` interface (includes optional `hexOrientation?: HexOrientation`)
  - `standard.ts`: Multiplayer & tutorial presets (`river_valley`, `archipelago`, `twin_peaks`, `tutorial_meadow`)
  - `solitaire.ts`: All 13 official solitaire scenario presets (`scenario_*`) matching `/docs/scenarios/*.md`
  - `builder.ts`: `MAP_PRESETS`, `buildMapState(mapId)`
- `src/game/engine/` (re-exported by `src/game/engine.ts`):
  - `setup.ts`: `createInitialGame`, `isSolitaireMap`, `isSoloGameState`, `reconnectSoloPlayer`, `resignPlayer`, `canDeleteMatch`, `canRenameMatch`
  - `history.ts`: `addLog`, scoring (`calculateScores`), snapshots, `undoMove`, `redoMove`, `revertToHistoryIndex`
  - `movement.ts`: `canMoveTransporter`, `executeMoveTransporter`, cargo pickup/drop
  - `building.ts`: `canBuildRoad`/`executeBuildRoad`, `canBuildFactory`/`executeBuildFactory`, `canBuildWonder`/`executeBuildWonder`, `canResearchTech`/`executeResearchTech`
  - `production.ts`: `runProductionPhase`, breeding, `advancePhase`
  - `bot.ts` + `bots/`: Modular AI opponent framework (`bots/capabilities.ts`, `bots/registry.ts`, `bots/stockBeginnerBot.ts`, `bots/index.ts`)
- `src/game/simulationTest.ts`: Automated gameplay & rule verification test suite (13 suites including Stock Apprentice AI pipeline verification).
- `src/components/HexBoard.tsx` + `src/components/board/`:
  - `useBoardViewport.ts`: Pan/zoom/touch/keyboard + auto-centering (`fitBoardToView`)
  - `HexTileLayer.tsx`: Hex terrain images, color washes, water ripples, Home (starting) tile pins
  - `EdgeAndRailLayer.tsx`: River paths, `isRailroad` tracks, roads, bridges, road-build targets
  - `TokenLayer.tsx`: Buildings, loose ground goods, transporters
- `src/components/`: `GameHUD.tsx`, `SolitaireModal.tsx`, `MultiplayerLobby.tsx`, `BuildMenuModal.tsx`, `TransporterCargoModal.tsx`, `WonderPyramidModal.tsx`, `PlayerAidModal.tsx`, `AlmanacModal.tsx`, `TutorialDrawer.tsx`, `RevertHistoryDrawer.tsx`, `TestSimulationModal.tsx`.
