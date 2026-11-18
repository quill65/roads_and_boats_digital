# Small World S42

![Small World S42 Map](./small_world_s42.png)

## Metadata
- **Scenario ID**: `small_world_s42` (`mapPresetId`: `scenario_small_world_s42`)
- **Source**: `http://www.splotter.nl/english/r&b/sws42.html`
- **Goal**: Find how to get the most points on the map shown.
- **Conditions**: Play without the Planes & Trains expansion set; skip the first four rows of the wonder; play 20 turns.
- **Current Record**: **580** (4 shares, 1 coin, 1 gold, 5 wonder rows) — by Uwe Gemming
- **Level**: difficult
- **Status**: well-studied

## Scenario Briefing & Rules
> This map, constructed by Uwe Gemming, is the smallest known map on which four shares can be produced in 20 turns. It is hard to say whether or not it is difficult to match or break the record on this map. On one hand, the map was designed to fit a particular strategy, so you might need to reproduce that exact strategy to achieve the maximum score. On the other hand, the map might guide you to the right strategy because everything is exactly in the right place.
>
> You can start on any tile on the board. Before playing, fill the first four rows of the wonder with bricks of unused colours. This means that the first wonder brick in a turn costs two goods right from the beginning. The maximum number of points you can get in the wonder is 80 - the game ends at the two-player mark. You have only 20 turns instead of the usual 33 to finish the game: 13 neutral bricks will not be used. Play by the rules of the second edition. For mining, use the one-player rule (see scenario book).

## Exact Map Geometry
- **Hex Orientation**: `flat` (vertical staggered columns: `2 - 3 - 3 - 3 - 2`)
- **Total Tiles**: 13
- **Default App Starting Hex**: `CP` `(0, 0)` (central pasture)

### Tiles (`(q, r)` Axial — Flat-Topped)
| Col (`q`) | Code | `(q, r)` | Terrain | Notes |
|-----------|------|----------|---------|-------|
| `-2` | `WS` | `(-2, 1)` | `water` | West sea (receives northern river) |
| `-2` | `FWP` | `(-2, 2)` | `pasture` | Far-west pasture (southern river) |
| `-1` | `WP` | `(-1, 0)` | `pasture` | West pasture (northern river) |
| `-1` | `CS` | `(-1, 1)` | `water` | Central sea (connects to both rivers) |
| `-1` | `SM` | `(-1, 2)` | `mountain` | South mountain (southern river source) |
| `0` | `NP` | `(0, -1)` | `pasture` | North pasture (northern river) |
| `0` | `CP` | `(0, 0)` | `pasture` | Central pasture (confluence; Default home) |
| `0` | `CW` | `(0, 1)` | `forest` | Central forest |
| `+1` | `NM` | `(1, -1)` | `mountain` | North mountain (eastern tributary source) |
| `+1` | `EP` | `(1, 0)` | `pasture` | East pasture |
| `+1` | `EW` | `(1, 1)` | `forest` | East forest |
| `+2` | `R` | `(2, -1)` | `rock` | East rock |
| `+2` | `FEP` | `(2, 0)` | `pasture` | Far-east pasture |

### Rivers (8 Edges)
- **Main river system (flowing into `WS` and `CS`)**:
  - `NM (1, -1) <-> EP (1, 0)`
  - `EP (1, 0) <-> CP (0, 0)`
  - `CP (0, 0) <-> CS (-1, 1)`
  - `CP (0, 0) <-> NP (0, -1)`
  - `NP (0, -1) <-> WP (-1, 0)`
  - `WP (-1, 0) <-> WS (-2, 1)`
- **Southern river (`SM` through `FWP` to `CS`)**:
  - `SM (-1, 2) <-> FWP (-2, 2)`
  - `FWP (-2, 2) <-> CS (-1, 1)`

### Railroads
- None.
