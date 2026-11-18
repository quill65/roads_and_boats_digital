# ROADS & BOATS - COMPLETE AUTHORITATIVE RULES COMPENDIUM
### Official Splotter Spellen Rules & Mechanics Reference Guide
**Designers:** Jeroen Doumen & Joris Wiersinga  
**Publisher:** Splotter Spellen  

This compendium is the single source of truth for all game rules, components, logistics, terrain, movement, production, breeding, research, and scoring in this Roads & Boats digital adaptation. AI agents and code modules MUST always consult this document before modifying or evaluating gameplay mechanics.

---

## 1. GAME CONCEPT & PHILOSOPHY
- **No Territorial Ownership:** Players do NOT own land, hexes, roads, or ground goods. Any transporter can travel on any road or water, use any factory, or pick up any neutral goods lying on the ground.
- **Transporter Ownership:** Players only own their **transporters** (donkeys, wagons, trucks, rafts, rowboats, steamships) and **wonder bricks**.
- **Neutral Ground Goods:** Any good dropped on a hex or produced by a factory sits neutral on the ground. Any player's transporter on that hex can pick it up (unless protected by walls in expansions).
- **Primary Goal:** Amass Victory Points before the Wonder of the World is completed or game end rounds expire.

---

## 2. STARTING INVENTORY (Setup per Player)
On each player's designated home tile:
- **3 Donkeys** (living land transporters, capacity 2 goods each)
- **2 Geese** (living counters on the ground, used for reproduction and research)
- **4 Boards** (wooden building planks on the ground)
- **1 Stone** (masonry stone on the ground)

---

## 3. THE FOUR PHASES OF A ROUND
Every round proceeds through 4 sequential phases:

### Phase 1: Production (and Reproduction)
1. **Primary Extractors:**
   - Woodcutter produces 1 Wood / Trunk onto hex.
   - Clay Pit produces 1 Clay onto hex.
   - Quarry produces 1 Stone onto hex.
   - Mine produces 2 Gold + 1 Iron/Fuel onto hex (or 4 Gold / 4 Iron if Specialized Mines researched).
2. **Secondary Producers (Automatic conversion if inputs present on hex):**
   - Sawmill: 1 Wood → 2 Boards.
   - Brickworks: 1 Clay → 2 Bricks.
   - Coal Burner: 1 Wood → 1 Fuel.
   - Paper Mill: 2 Boards → 1 Paper.
   - Mint: 2 Gold + 1 Fuel → 1 Coin (worth 40 VP).
   - Stock Exchange: 1 Coin + 1 Paper → 1 Stock Certificate (worth 120 VP).
3. **Animal Reproduction:**
   - **Donkey Breeding (Privacy Rule):** If exactly 2 donkeys of the same player are on an empty Pasture hex with NO buildings, NO cargo, and NO goods on the ground, a 3rd newborn Donkey is born!
   - **Goose Breeding (Privacy Rule):** If exactly 2 Geese are on a Pasture hex with NO buildings, NO other living animals, and NO other goods, +1 newborn Goose is placed there!
4. **Movement Reset:**
   - Transporters refresh their movement points for Phase 2.

### Phase 2: Movement & Logistics
- Transporters move across the map within their movement allowances.
- Cargo may be picked up or dropped at any point along a transporter's route.
- Land transporters cannot enter water tiles and cannot cross unbridged rivers.
- Water transporters travel along river channels and across sea tiles, or dock at coastal hexes.
- Goods cannot be dumped into open water.

### Phase 3: Building & Construction
- Roads, bridges, and factories can be built on hexes where a transporter is present and sufficient resources are available (pooled from the transporter's cargo, other friendly transporters on the hex, and ground goods on the hex).

### Phase 4: Wonder Phase
- Players contribute Bricks to the Wonder of the World pyramid to claim permanent victory points.

---

## 4. TRANSPORTER SPECIFICATIONS & FLEET

| Transporter | Type | Capacity | Base Speed (Off-Road) | Road Speed | Requires Fuel? | Construction Cost | Notes / Restrictions |
|---|---|---|---|---|---|---|---|
| **Donkey** | Land | **2 goods** | 1 hex | 2 hexes | No | Bred on Pasture (2 donkeys alone) | **Capacity is ALWAYS 2 goods.** No research or upgrade ever increases donkey capacity! |
| **Wagon** | Land | **3 goods** | 0 (Road-only) | 3 hexes | No | 1 Donkey + 2 Boards at Wagon Factory | Requires paved roads or bridges for all moves. |
| **Steam Truck** | Land | **6 goods** | 0 (Road-only) | 4 hexes | **Yes** (1 Fuel) | 1 Fuel + 1 Iron at Truck Factory (**Requires Truck Factory Research**) | Requires paved roads or bridges. Consumes fuel. |
| **Raft** | Water | **1 good** | 1 hex | 1 hex | No | 2 Wood at Woodcutter / Coast | Navigates rivers and coastal/sea water. |
| **Rowboat** | Water | **3 goods** | 2 hexes | 2 hexes | No | 5 Boards at Rowboat Factory (**Requires Rowboat Factory Research**) | Navigates waterways and sea at speed 2. |
| **Steamship** | Water | **5 goods** | 3 hexes | 3 hexes | **Yes** (1 Fuel) | 2 Fuel + 1 Iron at Steamer Factory (**Requires Steamer Factory Research**) | Fast maritime hauler. Navigates waterways. Consumes fuel. |

---

## 5. RESEARCH & TECHNOLOGIES (The Authentic Rules)

### The Research Formula
- **Cost:** Exactly **2 Geese + 1 Paper** on the same map hex during the production/building phase.
- **Consumption:** The 2 Geese and 1 Paper are consumed ("disappear forever into academic research").
- **Marker:** A discovery stone is placed on the player's Research Board to mark the technological breakthrough.

### What Research Can Unlock (Base Game Technologies):
Research items may be researched in any order:
1. **Rowboat Factory (`rowboat_factory`):**
   - Unlocks construction of the Rowboat Factory (costs 2 Boards, 1 Stone to build).
   - Allows producing Rowboats (5 Boards → 1 Rowboat).
2. **Truck Factory (`truck_factory`):**
   - Unlocks construction of the Steam Truck Factory (costs 2 Boards, 2 Stone to build).
   - Allows producing Steam Trucks (1 Fuel + 1 Iron → 1 Truck).
3. **Steamer Factory (`steamer_factory`):**
   - Unlocks construction of the Steamer Factory (costs 2 Boards, 2 Stone to build).
   - Allows producing Steamships (2 Fuel + 1 Iron → 1 Steamer).
4. **Specialized Mines (`specialized_mines`):**
   - Modifies mine production: allows mines to produce exclusively 4 Gold or exclusively 4 Iron/Fuel rather than mixed 2 Gold + 1 Iron.
   - *Mutual Exclusivity:* Cannot be combined with Large Mines.
5. **Large Mines (`large_mines`):**
   - Increases mine production capacity to yield up to 5 Gold and 5 Iron/Fuel.
   - *Mutual Exclusivity:* Cannot be combined with Specialized Mines.
6. **New Mine Shafts (`extra_shafts`):**
   - Unlocks sinking additional mine shafts onto existing mountain mines to replenish depleted veins.
7. **Off-Shore Oil Rig (`oil_rig`):**
   - Unlocks building offshore drilling platforms on coastal water hexes to extract crude oil/fuel.

### What Research NEVER Does:
- **NO "Heavy Hauling":** No technology exists in Roads & Boats called "Heavy Hauling".
- **NO Donkey Upgrades:** Donkey capacity is **always strictly 2 goods**. Donkeys can never carry 3 goods.
- **NO Road Speed Buffs:** Vehicle speeds are fixed per their spec sheet.

---

## 6. FACTORIES & PRODUCTION SPECIFICATIONS

| Building | Category | Construction Cost | Allowed Terrain | Input Materials | Output Goods | Research Prerequisite |
|---|---|---|---|---|---|---|
| **Woodcutter** | Primary | 1 Board | Forest | None | 1 Wood / Trunk | None |
| **Clay Pit** | Primary | 3 Boards | Pasture, Desert | None | 1 Clay | None |
| **Quarry** | Primary | 2 Boards, 1 Stone | Mountain | None | 1 Stone | None |
| **Mine** | Primary | 3 Boards, 1 Stone | Mountain | None | 2 Gold + 1 Iron/Fuel | None |
| **Sawmill** | Secondary | 2 Boards, 1 Stone | Pasture, Forest | 1 Wood | 2 Boards | None |
| **Brickworks** | Secondary | 2 Boards, 1 Stone | Pasture, Forest | 1 Clay | 2 Bricks | None |
| **Coal Burner** | Secondary | 2 Boards, 1 Stone | Pasture, Forest | 1 Wood | 1 Fuel | None |
| **Paper Mill** | Secondary | 2 Boards, 1 Stone | Pasture, Forest | 2 Boards | 1 Paper | None |
| **Royal Mint** | Secondary | 2 Boards, 1 Stone | Pasture, Forest | 2 Gold + 1 Fuel | 1 Coin (40 VP) | None |
| **Stock Exchange** | Secondary | 2 Boards, 1 Stone | Pasture, Forest | 1 Coin + 1 Paper | 1 Stock (120 VP) | None |
| **Wagon Factory** | Transporter | 1 Board, 2 Stone | Pasture, Mountain | 1 Donkey + 2 Boards | 1 Wagon | None |
| **Rowboat Factory** | Transporter | 2 Boards, 1 Stone | Pasture, Forest (Water adj.) | 5 Boards | 1 Rowboat | **Requires `rowboat_factory` Research** |
| **Truck Factory** | Transporter | 2 Boards, 2 Stone | Pasture, Mountain | 1 Fuel + 1 Iron | 1 Truck | **Requires `truck_factory` Research** |
| **Steamer Factory** | Transporter | 2 Boards, 2 Stone | Pasture, Forest (Water adj.) | 2 Fuel + 1 Iron | 1 Steamer | **Requires `steamer_factory` Research** |

---

## 7. RIVERS, BRIDGES & WATER RULES
1. **Rivers Cut Across Tiles:** In the original game, rivers are pre-printed on tiles and physically divide land.
2. **Land Movement Across Rivers:** Land transporters (Donkey, Wagon, Truck) CANNOT cross an unbridged river under any circumstances. A **Bridge** must be built across the river.
3. **Bridge Construction:** Paving across a river border constructs a Bridge and costs **2 Boards** (instead of 1 Board/Stone for an ordinary overland road).
4. **Water Transporters:**
   - Rafts, Rowboats, and Steamers can only navigate along river waterways and across open water tiles.
   - Watercraft CANNOT move overland between two dry land tiles if there is no river.
   - Watercraft can dock at coastal land tiles adjacent to water (costing 1 movement point).
5. **No Dumping Goods at Sea:** Transporters may not drop goods into open water. Goods can only be placed on land, at docks, or on oil rigs.
6. **No Roads in Open Sea:** Cobblestone roads cannot be constructed across open deep water tiles.

---

## 8. VICTORY POINTS & SCORING
- **Wonder Pyramid Bricks:**
  - Tier 1: 1 VP per brick
  - Tier 2: 2 VP per brick
  - Tier 3: 3 VP per brick
  - Tier 4: 5 VP per brick
- **Minted Coins:** 40 VP each (in player's transporters or claimed).
- **Stock Certificates:** 120 VP each (in player's transporters or claimed).
- **Other Goods:** Raw materials and intermediate goods hold nominal tiebreaker/endgame values (e.g., Goose: 3 VP, Boards: 2 VP, Stone: 2 VP, Iron: 5 VP, Gold: 10 VP).
