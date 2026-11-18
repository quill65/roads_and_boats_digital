# Roads & Boats — Official Solitaire Scenarios Reference

Authoritative per-scenario documentation and cropped Splotter map diagrams extracted from the official Splotter Spellen *Collected Scenarios for Roads & Boats* compendium. Use these Markdown files and paired `.png` images as the direct reference instead of the PDF.

## Standard Solitaire Rules (All 13 Scenarios)
- **Players**: Strictly **1 human player only** (0 AI bots; no second player can join, and reconnecting/joining always attaches to the single solo player). Use the 1-player mining rule.
- **Starting Tile**: You may start on any land tile on the board.
- **Turn Limit**: **20 turns** (instead of 33; 13 neutral bricks are unused).
- **Wonder Rules**: Fill the first 4 rows of the Wonder with neutral bricks before playing (first brick costs 2 goods immediately; max 80 Wonder points, ending at the 2-player mark).

## Scenario Index

| # | Scenario | Markdown Reference | Map Image | Orientation | Tiles | Rivers | Rails | Record | Level | Planes & Trains |
|---|----------|--------------------|-----------|-------------|-------|--------|-------|--------|-------|-----------------|
| 1 | Mesopotamia | [mesopotamia.md](./mesopotamia.md) | [mesopotamia.png](./mesopotamia.png) | `pointy` | 19 | 12 edges | — | 440 | modest | No |
| 2 | Lord of the Ring | [lord_of_the_ring.md](./lord_of_the_ring.md) | [lord_of_the_ring.png](./lord_of_the_ring.png) | `pointy` | 19 | — | — | 360 | difficult | No |
| 3 | Sea For One | [sea_for_one.md](./sea_for_one.md) | [sea_for_one.png](./sea_for_one.png) | `pointy` | 22 | — | — | 420 | difficult | No |
| 4 | A River Runs Through It | [a_river_runs_through_it.md](./a_river_runs_through_it.md) | [a_river_runs_through_it.png](./a_river_runs_through_it.png) | `pointy` | 11 | 8 edges | — | 300 | modest | No |
| 5 | Small World S22 | [small_world_s22.md](./small_world_s22.md) | [small_world_s22.png](./small_world_s22.png) | `pointy` | 8 | — | — | 360 (+7 geese) | difficult | No |
| 6 | Small World S33 | [small_world_s33.md](./small_world_s33.md) | [small_world_s33.png](./small_world_s33.png) | `pointy` | 10 | — | — | 510 | very difficult | No |
| 7 | Small World S42 | [small_world_s42.md](./small_world_s42.md) | [small_world_s42.png](./small_world_s42.png) | `flat` | 13 | 8 edges | — | 580 | difficult | No |
| 8 | Small World S52 | [small_world_s52.md](./small_world_s52.md) | [small_world_s52.png](./small_world_s52.png) | `pointy` | 19 | 11 edges | — | 650 | very difficult | No |
| 9 | Small World SX2 | [small_world_sx2.md](./small_world_sx2.md) | [small_world_sx2.png](./small_world_sx2.png) | `flat` | 25 | 13 edges | — | 800 | very difficult | No |
| 10 | Charing Cross | [charing_cross.md](./charing_cross.md) | [charing_cross.png](./charing_cross.png) | `flat` | 38 | — | 15 edges | 450 | modest | Yes |
| 11 | Rocket Science | [rocket_science.md](./rocket_science.md) | [rocket_science.png](./rocket_science.png) | `flat` | 34 | — | — | 390 | modest | Yes |
| 12 | Tierra del Fuego S11 | [tierra_del_fuego_s11.md](./tierra_del_fuego_s11.md) | [tierra_del_fuego_s11.png](./tierra_del_fuego_s11.png) | `pointy` | 6 | — | — | 230 | difficult | Yes |
| 13 | Sheikh of the Ring | [sheikh_of_the_ring.md](./sheikh_of_the_ring.md) | [sheikh_of_the_ring.png](./sheikh_of_the_ring.png) | `pointy` | 19 | — | — | 350 | difficult | Yes |

## Axial Coordinate Convention `(q, r)`
- **Pointy-Top (`pointy`)**: `x = R * sqrt(3) * (q + r/2)`, `y = R * 1.5 * r`. Constant `r` forms horizontal staggered rows.
- **Flat-Top (`flat`)**: `x = R * 1.5 * q`, `y = R * sqrt(3) * (r + q/2)`. Constant `q` forms vertical staggered columns.
- **Adjacency**: Identical in both orientations (`(+1,0)`, `(0,+1)`, `(-1,+1)`, `(-1,0)`, `(0,-1)`, `(+1,-1)`).
