/**
 * Roads & Boats — Unified Scenario Map Sets & Solitaire Compendium
 *
 * Includes:
 * 1. Official Solitaire Scenarios Compendium (13 scenarios, strictly 1 player, 20 turns)
 * 2. Splotter Official Scenario Book Maps (`roads_and_boats_splotter_maps.pdf`, 10 non-duplicate scenarios)
 * 3. 1–2 Player & Duel Scenario Maps (`r&b_-_1-2...`, 6 non-duplicate scenarios)
 * 4. Classic Multiplayer & Tutorial Maps (4 standard scenarios)
 *
 * Deduplication Policy:
 * Any scenario map in `roads_and_boats_splotter_maps.pdf` or `r&b_-_1-2...` sharing a name
 * with an existing scenario in the project (such as the 13 Solitaire scenarios or
 * Archipelago / Scenario 222) is ignored so zero duplicate names exist.
 *
 * Author & Publisher Attribution:
 * Every scenario is explicitly attributed to its scenario designer/author and to the game
 * publisher: Splotter Spellen (Jeroen Doumen & Joris Wiersinga).
 */

import { ScenarioMapSetId } from './maps/types';

export interface ScenarioMapSetInfo {
  id: ScenarioMapSetId;
  name: string;
  shortName: string;
  icon: string;
  sourceFile: string;
  attribution: string;
  playerRange: string;
  description: string;
}

export const SCENARIO_MAP_SETS: ScenarioMapSetInfo[] = [
  {
    id: 'solitaire_compendium',
    name: 'Official Pre-Made Scenarios (1P Puzzles)',
    shortName: 'Solo Puzzles (1P)',
    icon: '🧩',
    sourceFile: 'Collected Scenarios for Roads & Boats (Solitaire Compendium)',
    attribution: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga) · Herman Haverkort, Uwe Gemming, Gary Brennan, Werner Bär, Hannes Ernst',
    playerRange: '1 Player (Zero Bots · 20 Turns)',
    description:
      'All 13 official Splotter 1-player optimization puzzles: 20 turns, 4 pre-built Wonder rows, 1-player mining rule, and historical community VP records.',
  },
  {
    id: 'splotter_maps_pdf',
    name: 'Splotter Official Scenario Book Maps',
    shortName: 'Splotter Maps PDF',
    icon: '🗺️',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    attribution: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    playerRange: '1 – 4 Players',
    description:
      'Official multi-player and introductory scenario maps from Splotter Spellen (First Game #101, Sandbank #254, The Pacific #255, Dead Sea #256, Saba #257, Atlantis #340, Great Lakes #341, Aral #345, Mississippi #410, Egypt #420).',
  },
  {
    id: 'rb_1_2_player_maps',
    name: '1–2 Player & Duel Scenario Maps',
    shortName: '1–2 Player Maps',
    icon: '⚔️',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    attribution: 'Herman Haverkort, Uwe Gemming, Aaron Marriner & Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    playerRange: '1 – 2 Players',
    description:
      'Dedicated 1–2 player scenarios and tight logistical duels (Paradise, Two Bridges #210, The Narrow Sea #220, Four Islands #230, Oasis Duel #240, Fjordland #250). Playable solo or head-to-head vs AI/human.',
  },
  {
    id: 'classic_multiplayer',
    name: 'Classic Multiplayer & Tutorial Maps',
    shortName: 'Classic Multiplayer',
    icon: '🏛️',
    sourceFile: 'Core Project Multiplayer & Tutorial Presets',
    attribution: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    playerRange: '1 – 4 Players',
    description:
      'Core Roads & Boats multiplayer and tutorial boards including River Valley, The Archipelago (Scenario #222), Twin Peaks, and Tutorial Meadow.',
  },
];

export const DEDUPLICATED_DRIVE_SCENARIO_NAMES: Array<{
  name: string;
  existingScenarioId: string;
  sourceFile: string;
  reason: string;
}> = [
  {
    name: 'Mesopotamia',
    existingScenarioId: 'mesopotamia',
    sourceFile: 'r&b_-_1-2... / roads_and_boats_splotter_maps.pdf',
    reason: 'Already present in Official Pre-Made Scenarios (scenario_mesopotamia)',
  },
  {
    name: 'Lord of the Ring',
    existingScenarioId: 'lord_of_the_ring',
    sourceFile: 'r&b_-_1-2... / roads_and_boats_splotter_maps.pdf',
    reason: 'Already present in Official Pre-Made Scenarios (scenario_lord_of_the_ring)',
  },
  {
    name: 'Sea For One',
    existingScenarioId: 'sea_for_one',
    sourceFile: 'r&b_-_1-2... / roads_and_boats_splotter_maps.pdf',
    reason: 'Already present in Official Pre-Made Scenarios (scenario_sea_for_one)',
  },
  {
    name: 'A River Runs Through It',
    existingScenarioId: 'river_runs_through_it',
    sourceFile: 'r&b_-_1-2... / roads_and_boats_splotter_maps.pdf',
    reason: 'Already present in Official Pre-Made Scenarios (scenario_river_runs_through_it)',
  },
  {
    name: 'Small World S22 / S33 / S42 / S52 / SX2',
    existingScenarioId: 'small_world_s22',
    sourceFile: 'r&b_-_1-2...',
    reason: 'All 5 Small World puzzles already present in Official Pre-Made Scenarios',
  },
  {
    name: 'Charing Cross / Rocket Science / Tierra del Fuego S11 / Sheikh of the Ring',
    existingScenarioId: 'charing_cross',
    sourceFile: 'r&b_-_1-2...',
    reason: 'All 4 Planes & Trains solo puzzles already present in Official Pre-Made Scenarios',
  },
  {
    name: 'Archipelago (Scenario 222)',
    existingScenarioId: 'archipelago',
    sourceFile: 'roads_and_boats_splotter_maps.pdf',
    reason: 'Already present in Classic Multiplayer Maps as The Archipelago (archipelago)',
  },
];

export interface SolitaireScenario {
  id: string;
  name: string;
  subtitle: string;
  designer: string;
  author?: string;
  publisher?: string;
  sourceFile?: string;
  scenarioCode?: string;
  mapSetId?: ScenarioMapSetId;
  recommendedPlayers?: string;
  minPlayers?: number;
  maxPlayers?: number;
  isSolitaireOnly?: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  description: string;
  objective: string;
  targetScore: number;
  maxRounds: number;
  mapPresetId: string;
  keyTactics: string[];
  startingNotes: string;
  specialRules?: string;
}

export type ScenarioDefinition = SolitaireScenario;

export const SOLITAIRE_SCENARIOS: SolitaireScenario[] = [
  {
    id: 'mesopotamia',
    name: 'Mesopotamia',
    subtitle: 'Twin Confluence Rivers & Eastern Coastal Seas',
    designer: 'Splotter Spellen · Record: Herman Haverkort',
    author: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SOL-01',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Beginner',
    description:
      'A puzzle with lots of resources. Although it is a compact 19-tile map, three winding river channels make overland distances tricky and invite barge traffic toward the eastern seas. Balance stone quarries, bridges, and river rafts carefully.',
    objective:
      'Skip the first 4 Wonder rows and maximize VP in 20 turns (Official Record: 440 VP).',
    targetScore: 440,
    maxRounds: 20,
    mapPresetId: 'scenario_mesopotamia',
    keyTactics: [
      'Plan stone allocation early—bridges and roads compete with buildings for quarry output.',
      'Exploit the western and southern river tributaries meeting at EP before draining into ES.',
      'Use CP as a central logistics hub feeding Brickworks, Sawmills, and river docks.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Central Pasture CP (0,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'lord_of_the_ring',
    name: 'Lord of the Ring',
    subtitle: 'Outer Resource Ring Around an Inland Sea & Desert Island',
    designer: 'Splotter Spellen · Record: Werner Bär',
    author: 'Jeroen Doumen, Joris Wiersinga & Werner Bär (Record)',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SOL-02',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Intermediate',
    description:
      'A nice little six-hex sea surrounds the central Desert Island (DI), enclosed by a twelve-tile resource ring. Watercraft dock only once per turn—ideal for bulk long hauls across the lake, awkward for short hopping.',
    objective:
      'Coordinate land and naval transporters over 20 turns (Official Record: 360 VP).',
    targetScore: 360,
    maxRounds: 20,
    mapPresetId: 'scenario_lord_of_the_ring',
    keyTactics: [
      'The inland sea is slightly too wide for single-turn Raft crossings—plan intermediate water stops or Rowboats.',
      'Link outer ring mountains, forests, rock, and pasture with paved perimeter roads where sailing stalls.',
      'Use the central Desert Island (DI) or perimeter pastures strategically while keeping high-bulk goods moving.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Northwest Pasture P10 (-1,-1).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'sea_for_one',
    name: 'Sea For One',
    subtitle: 'Three Land Clusters Joined by Narrow Desert Bridges & Seas',
    designer: 'Splotter Spellen · Record: Hannes Ernst',
    author: 'Jeroen Doumen, Joris Wiersinga, Hannes Ernst & Gary Brennan',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SOL-03',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Intermediate',
    description:
      'Abundant raw materials and room for factories across three main zones: western pastures, central woodlands and rock, and eastern mountains. Twin inland seas separate them, bridged north and south by four desert passes.',
    objective:
      'Unite the pastures, woods, rock, and mountain clusters in 20 turns (Official Record: 420 VP).',
    targetScore: 420,
    maxRounds: 20,
    mapPresetId: 'scenario_sea_for_one',
    keyTactics: [
      'Choose whether to sail across WS/CS/ES or pave roads across the four narrow desert land bridges.',
      'Pair the central rock plateau (WR, CR) and central woods (NWW, NEW, SWW, SEW) for rapid early infrastructure.',
      'Schedule steady ore transfers back from the eastern four-mountain massif (NEM, FNM, FEM, SEM, FSM).',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on West Pasture WP (-3,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'river_runs_through_it',
    name: 'A River Runs Through It',
    subtitle: 'Single Winding Eight-Hex River & Minimal Road Puzzle',
    designer: 'Splotter Spellen · Record: Gary Brennan',
    author: 'Jeroen Doumen, Joris Wiersinga, Gary Brennan & Herman Haverkort',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SOL-04',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Beginner',
    description:
      'One continuous river winds from mountain UM through UW, CR, CP, CW, CD, LD, and LP out to sea LPS. Remarkably, 300 points can be achieved with just 5 donkeys and clever scheduling—or with seamless donkey-raft handoffs.',
    objective:
      'Gather maximum wealth and Wonder progress in 20 turns (Official Record: 300 VP).',
    targetScore: 300,
    maxRounds: 20,
    mapPresetId: 'scenario_river_runs_through_it',
    keyTactics: [
      'Follow the winding river corridor from UM (-1,-1) down to sea LPS (1,1) to minimize bridge construction.',
      'Coordinated donkey + raft loops eliminate downtime during turns 11–19.',
      'Use LP (0,1) and CP (1,0) pastures as primary Clay, Goose breeding, and processing hubs.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Lower Pasture LP (0,1).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'small_world_s22',
    name: 'Small World S22',
    subtitle: 'Smallest Known 2-Share Optimization Puzzle (8 Tiles)',
    designer: 'Herman Haverkort · Splotter Archive',
    author: 'Herman Haverkort',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'S22',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Advanced',
    description:
      'Born from the Paradise puzzles, this 8-tile map has just enough terrain diversity to produce Shares. Every single trunk of wood before Turn 19 is needed for buildings, fuel, and paper—leaving goose breeding as your Wonder engine.',
    objective:
      'Build 2 Shares and breed spare Geese in 20 turns (Official Record: 360 VP + 7 Geese).',
    targetScore: 360,
    maxRounds: 20,
    mapPresetId: 'scenario_small_world_s22',
    keyTactics: [
      'Construct the full Share chain: Woodcutter, Quarry, Sawmill, Mine, Papermill, Coal Burner, Mint, Stock Exchange.',
      'Conserve almost every wood trunk for construction, charcoal, and paper rather than boards for the Wonder.',
      'Breed Geese relentlessly across the five pasture tiles to score up to 6 Wonder rows without wasting timber.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Central Pasture CP (0,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'small_world_s33',
    name: 'Small World S33',
    subtitle: 'Three-Mountain 3-Share Spatial Puzzle (10 Tiles)',
    designer: 'Herman Haverkort · Splotter Archive',
    author: 'Herman Haverkort',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'S33',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Master',
    description:
      'Just 10 tiles with three distinct mountain peaks (NM, CM, SM) surrounding a tight core of pastures, two forests, and a single rock hex. Built to barely permit 3 Shares alongside gold, coin, and Wonder rows.',
    objective:
      'Produce 3 Shares and high Wonder/gold totals in 20 turns (Official Record: 510 VP).',
    targetScore: 510,
    maxRounds: 20,
    mapPresetId: 'scenario_small_world_s33',
    keyTactics: [
      'Run two Woodcutters, a Sawmill, Quarry, Papermill, Coal Burner, two Mines, a Mint, and a Stock Exchange.',
      'Choose carefully which two of the three mountains (NM, CM, SM) receive Mines to shorten donkey hauls.',
      'Keep central rock CR (0,0) and Central Pasture CP (1,0) uncongested so high-tier factories fit without deadlocks.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Center Pasture CP (1,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'small_world_s42',
    name: 'Small World S42',
    subtitle: 'Uwe Gemming’s Precision 4-Share Blueprint (13 Tiles)',
    designer: 'Uwe Gemming',
    author: 'Uwe Gemming',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'S42',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Advanced',
    description:
      'The smallest known map capable of producing 4 Shares in 20 turns. Everything on this 13-tile flat-topped river map sits in an exact puzzle relationship—every tile and river fork serves a calculated link in the four-Share chain.',
    objective:
      'Execute the 4-Share industrial chain in 20 turns (Official Record: 580 VP).',
    targetScore: 580,
    maxRounds: 20,
    mapPresetId: 'scenario_small_world_s42',
    keyTactics: [
      'Exploit the confluence at CP (0,0) and adjacent inner sea CS (-1,1) to keep short haul paths open.',
      'Use both mountain peaks—NM (1,-1) in the north and SM (-1,2) in the south—plus single Rock R (2,-1).',
      'Balance forestry on CW (0,1) & EW (1,1) with heavy goose/clay output across the six pasture hexes.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Central Pasture CP (0,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'small_world_s52',
    name: 'Small World S52',
    subtitle: 'Uwe Gemming’s Five-Share Winding-River Puzzle (19 Tiles)',
    designer: 'Uwe Gemming',
    author: 'Uwe Gemming',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'S52',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Master',
    description:
      'Constructed as the smallest known map on which 5 Shares can be completed within 20 turns. Winding rivers curl around NS and CS seas, threading past five pastures, four mountains, three woods, and two rocks.',
    objective:
      'Reach 5 Shares or outscore it via Coins in 20 turns (Official Record: 650 VP).',
    targetScore: 650,
    maxRounds: 20,
    mapPresetId: 'scenario_small_world_s52',
    keyTactics: [
      'Coordinate bridge placement where the Eastern loop encircles CP (1,0) and SEP (1,1).',
      'Balance four mountain peaks against three southern/eastern forests to avoid charcoal or paper starvation.',
      'Maximize Stock Exchange batches late without stranding Coins or Paper across unbridged rivers.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Central Pasture CP (1,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'small_world_sx2',
    name: 'Small World SX2',
    subtitle: 'Six-Share 800-Point Paradise Challenge (25 Tiles)',
    designer: 'Herman Haverkort · Splotter Archive',
    author: 'Herman Haverkort',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SX2',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Master',
    description:
      'Designed specifically to chase the highest 20-turn score in Roads & Boats history. Across 25 flat-topped tiles, two long parallel river systems carry resources eastward toward twin seas NS and SS through seven mountains, six woods, six pastures, and three rocks.',
    objective:
      'Optimize massive Share & Coin throughput in 20 turns (Official Record: 800 VP).',
    targetScore: 800,
    maxRounds: 20,
    mapPresetId: 'scenario_small_world_sx2',
    keyTactics: [
      'Feed the northern (NWM -> NS) and southern (WM -> SS) river corridors cleanly toward central pastures.',
      'Scale mining early across the seven mountain tiles to supply 6-Share Mint + Coal Burner demand.',
      'Reserve central rocks (NR, ER, SR) and central pasture CP (-1,0) for high-velocity processing.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Central Pasture CP (-1,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'charing_cross',
    name: 'Charing Cross',
    subtitle: 'Intersecting Rail Crossroads & Coastal Bays (Planes & Trains)',
    designer: 'Splotter Spellen · Record: Herman Haverkort',
    author: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SOL-10',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Beginner',
    description:
      'Two long pre-built railroad arms cross through central pasture hubs NP and SP, flanked by four coastal seas. Built for experimenting with Planes & Trains: trains, ships, trucks, and aircraft competing on long corridors.',
    objective:
      'Master public/private long-distance transit in 20 turns (Official Record: 450 VP).',
    targetScore: 450,
    maxRounds: 20,
    mapPresetId: 'scenario_charing_cross',
    keyTactics: [
      'Leverage the 15 pre-built railroad segments linking all four outer Mountain tips straight to NP/SP.',
      'Keep heavy ore/stone traffic flowing inward while timber/paper moves efficiently across the twin hubs.',
      'Four surrounding sea belts allow coastal Watercraft shortcuts between diagonal arms if you build docks.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on North Hub Pasture NP (0,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'rocket_science',
    name: 'Rocket Science',
    subtitle: 'Central Colony & Three Outer Resource Islands (Planes & Trains)',
    designer: 'Splotter Spellen · Record: Herman Haverkort',
    author: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SOL-11',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Beginner',
    description:
      'Three outer 3-hex resource islands ring a spacious inland sea around a 7-hex central island (3 pastures, 2 rocks, 2 forests, central desert). Designed for Planes & Trains expansion colonization—will you tap one, two, or all three outer islands?',
    objective:
      'Colonize the surrounding resource islands in 20 turns (Official Record: 390 VP).',
    targetScore: 390,
    maxRounds: 20,
    mapPresetId: 'scenario_rocket_science',
    keyTactics: [
      'Notice the main 7-hex island has NO mountains—you must reach at least one outer island for Mines & ore!',
      'North (FP/NWM/NEM) sits closest to starting wood/pasture, while SW (FW) and SE (FR) offer bonus wood/rock.',
      'Use Shipyards + Steamships/Rowboats—or air links when available—to ferry iron & gold onto the main island.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Main Island Pasture NP (0,-1).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'tierra_del_fuego_s11',
    name: 'Tierra del Fuego S11',
    subtitle: 'Six-Tile Micro Map & Explosive Demolition Puzzle (Planes & Trains)',
    designer: 'Herman Haverkort · Splotter Archive',
    author: 'Herman Haverkort',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'S11',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Advanced',
    description:
      'Just six tiles total—one Forest, one Rock, one Mountain, and three Pastures—the exact minimum needed to manufacture demolition bombs and recycle buildings to fit a Papermill, Mint, and Stock Exchange for a Share.',
    objective:
      'Recycle tiles carefully to craft at least 1 Share in 20 turns (Official Record: 230 VP).',
    targetScore: 230,
    maxRounds: 20,
    mapPresetId: 'scenario_tierra_del_fuego_s11',
    keyTactics: [
      'Transport distance is trivial—every tile sits right beside you; tile slot scarcity is the entire puzzle.',
      'Time exactly when each Pasture is built over so you still harvest enough Geese for research and the Wonder.',
      'Stage early extraction buildings, then replace obsolete sites once higher-tier Mint/Exchange slots are needed.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on West Pasture WP (-1,0).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
  {
    id: 'sheikh_of_the_ring',
    name: 'Sheikh of the Ring',
    subtitle: 'Arid Inner Desert Ring Around a Landlocked Sea (Planes & Trains)',
    designer: 'Splotter Spellen · Record: Herman Haverkort',
    author: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
    publisher: 'Splotter Spellen',
    sourceFile: 'Collected Scenarios for Roads & Boats',
    scenarioCode: 'SOL-13',
    mapSetId: 'solitaire_compendium',
    recommendedPlayers: '1 Player (Solo)',
    minPlayers: 1,
    maxPlayers: 1,
    isSolitaireOnly: true,
    difficulty: 'Advanced',
    description:
      'An inverted, hostile twin of Lord of the Ring: the central hex is a tiny landlocked SEA surrounded by a six-hex inner Desert ring, completely blocking watercraft and punishing wagons and donkeys unless properly engineered or flown over.',
    objective:
      'Overcome harsh desert logistics in 20 turns (Official Record: 350 VP).',
    targetScore: 350,
    maxRounds: 20,
    mapPresetId: 'scenario_sheikh_of_the_ring',
    keyTactics: [
      'Only two Pastures exist on the entire board—NW (P10) and SE (P4); guard your Goose/Donkey breeding carefully.',
      'Inner deserts D11, D1, D3, D5, D7, D9 starve donkeys unless paved with fast road corridors.',
      'Pave direct radial links from outer Mountains (M11, M12, M1), Forests, and Rocks toward your central factories.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Northwest Pasture P10 (-1,-1).',
    specialRules: '1-player mining rule; skip first 4 Wonder rows; 20 turns max.',
  },
];

export const MULTIPLAYER_AND_DRIVE_SCENARIOS: ScenarioDefinition[] = [
  // ============================================================================
  // SET 2: Splotter Official Scenario Book Maps (`roads_and_boats_splotter_maps.pdf`)
  // ============================================================================
  {
    id: 'splotter_first_game',
    name: 'First Game (Scenario 101)',
    subtitle: 'Official Splotter Introductory Scenario Basin (1–4 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '101',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '1 - 4 Players',
    minPlayers: 1,
    maxPlayers: 4,
    isSolitaireOnly: false,
    difficulty: 'Beginner',
    description:
      'The official introductory scenario from the Splotter Spellen Scenario Book. Four fertile central pastures sit surrounded by nearby forests, rock outcrops, gold mountains, and a gentle river emptying into eastern coastal waters.',
    objective:
      'Build a complete Board, Stone, Gold, Coin, and Stock Exchange economy while contributing to the Wonder.',
    targetScore: 400,
    maxRounds: 24,
    mapPresetId: 'splotter_first_game',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 101.',
      'Start with a Woodcutter on an adjacent Forest and a Sawmill on your home Pasture to multiply your 5 starting Boards.',
      'Place a Stone Factory (2 Boards) on an adjacent Rock hex to supply Stone for Mines, Mints, and Stock Exchanges.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player on their chosen starting Pasture.',
    specialRules: 'Standard 3rd Edition Base Game rules.',
  },
  {
    id: 'splotter_sandbank',
    name: 'Sandbank (Scenario 254)',
    subtitle: 'Central Desert Sandbar Splitting Two Coastal Lagoons (2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '254',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'Official Splotter Scenario 254 (Sandbank Basic, omitting the expansion railway). A five-hex central sandbank of desert dunes and rock divides the western and eastern lagoons.',
    objective:
      'Outscore your rival across the central sandbar via maritime ferries or trans-desert highways.',
    targetScore: 420,
    maxRounds: 24,
    mapPresetId: 'splotter_sandbank',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 254.',
      'Construct a Raft Factory (1 Board + 1 Stone) on a coastal shore tile to ferry goods across the lagoons at speed 3.',
      'Pave across the central Rock (0,0) or trigger the 45th Wonder brick to irrigate the Sandbank deserts into Pastures.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player on West (-2,0) and East (2,0) Pastures.',
    specialRules: 'Base game version of Scenario 254 (railway omitted).',
  },
  {
    id: 'splotter_the_pacific',
    name: 'The Pacific (Scenario 255)',
    subtitle: 'Vast Central Ocean & Volcanic Gold Atoll (2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '255',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Advanced',
    description:
      'Official Splotter Scenario 255: Inspired by the Lord of the Ring puzzle, players begin on opposite shores of a six-hex ocean surrounding a central mountain atoll. A calm opening builds into a fierce naval second half.',
    objective:
      'Command the Pacific shipping lanes and tap the central volcanic mountain at (0,0).',
    targetScore: 440,
    maxRounds: 24,
    mapPresetId: 'splotter_the_pacific',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 255.',
      'Players start on opposite sides of the middle column (West vs. East).',
      'Research Rowing (Rowboat: cap 5, spd 4) or Shipping (Steamer: cap 8, spd 6) to dominate cross-ocean transport and Offshore Oil Rigs.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player on opposite sides of the central column.',
    specialRules: 'One player must start to the left of the middle column and the other to the right.',
  },
  {
    id: 'splotter_dead_sea',
    name: 'Dead Sea (Scenario 256)',
    subtitle: 'Hypersaline Rift Sea Surrounded by Salt Deserts & Escarpments (2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '256',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Advanced',
    description:
      'Official Splotter Scenario 256: A three-hex inland Dead Sea sits locked between arid salt deserts, rock cliffs, and polar mountain peaks at (0,-2) and (0,2).',
    objective:
      'Bridge the salt deserts or launch Dead Sea barges to connect the northern and southern mountain mines.',
    targetScore: 410,
    maxRounds: 24,
    mapPresetId: 'splotter_dead_sea',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 256.',
      'Players start on opposite sides of the middle column (West Highlands vs. East Highlands).',
      'Reaching Brick #45 on the Wonder transforms all six inner salt-desert shore tiles into fertile Pastures!',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player on West (-2,0) and East (2,0) Pastures.',
    specialRules: 'One player starts to the left of the middle column and the other to the right.',
  },
  {
    id: 'splotter_saba',
    name: 'Saba (Scenario 257)',
    subtitle: 'Steep Three-Peak Volcanic Island Ringed by Caribbean Waters (2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '257',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'Official Splotter Scenario 257: Named after the steep volcanic island of Saba. All three mountain tiles form a vertical central spine flanked by rock cliffs, coastal pastures, and a 12-hex surrounding sea ring.',
    objective:
      'Climb the central volcanic spine to secure gold/iron mines while sailing around the coastal ring.',
    targetScore: 430,
    maxRounds: 24,
    mapPresetId: 'splotter_saba',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 257.',
      'Pave roads up the Rock slopes (-1,0) and (1,0) into the central volcanic Mountains (0,-1), (0,0), and (0,1).',
      'Use the outer Caribbean sea ring for Offshore Oil Rigs (Drilling research) and coastal Steamer loops.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player on West (-2,0) and East (2,0) coastal Pastures.',
    specialRules: 'One player starts to the left of the middle column and the other to the right.',
  },
  {
    id: 'splotter_atlantis',
    name: 'Atlantis (Scenario 340)',
    subtitle: 'Three-Player Radial River Island & Floodplain Terraces (3 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '340',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '3 Players',
    minPlayers: 2,
    maxPlayers: 3,
    isSolitaireOnly: false,
    difficulty: 'Advanced',
    description:
      'Official Splotter Scenario 340: Three radial rivers divide the island of Atlantis into three sectors around a central hub. Famous in the Splotter Scenario Book for its environmental irrigation twist.',
    objective:
      'Coordinate bridges, radial river traffic, and high-ground factories across three-way competition.',
    targetScore: 450,
    maxRounds: 24,
    mapPresetId: 'splotter_atlantis',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 340.',
      'Build Bridges (2 Boards) across the radial rivers early or use Rafts along the three river spokes.',
      'When the 45th Wonder brick is placed, the inner Desert ring (1,0), (0,-1), (-1,1) transforms into lush Pasture.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player at (-2,0), (2,-2), and (0,2).',
    specialRules: 'Scenario 340 environmental notes: Wonder Brick #45 irrigates the inner desert terraces into pasture.',
  },
  {
    id: 'splotter_great_lakes',
    name: 'Great Lakes (Scenario 341)',
    subtitle: 'Asymmetric Three-Lake Watershed & Iron Ranges (3 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '341',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '3 Players',
    minPlayers: 2,
    maxPlayers: 3,
    isSolitaireOnly: false,
    difficulty: 'Advanced',
    description:
      'Official Splotter Scenario 341: An asymmetric 3-player map built around five connected freshwater lake hexes. Each starting shore offers a different balance of timber, stone quarries, and mountain ore.',
    objective:
      'Exploit your region’s comparative advantage and link the three lakes with Rowboats and Steamships.',
    targetScore: 440,
    maxRounds: 24,
    mapPresetId: 'splotter_great_lakes',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 341.',
      'Northwest starts adjacent to the Superior Iron/Gold Range; Southwest commands rich timber and stone; East controls broad fertile pastures.',
      'Connected lake hexes allow a single Steamer or Rowboat fleet to service all three peninsulas.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player at (-2,-1), (-2,2), and (2,0).',
    specialRules: 'Intentionally asymmetric 3-player Splotter scenario.',
  },
  {
    id: 'splotter_aral',
    name: 'Aral (Scenario 345)',
    subtitle: 'Central Aral Sea Basin, Twin River Deltas & Desert Steppes (3 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '345',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '3 Players',
    minPlayers: 2,
    maxPlayers: 3,
    isSolitaireOnly: false,
    difficulty: 'Advanced',
    description:
      'Official Splotter Scenario 345: Twin rivers (Syr Darya and Amu Darya) flow through an arid desert ring into the central Aral Sea. Reaching the Wonder irrigation mark transforms the surrounding desert steppes.',
    objective:
      'Navigate the twin river deltas and capitalize on the Wonder’s 45th-brick desert irrigation transformation.',
    targetScore: 430,
    maxRounds: 24,
    mapPresetId: 'splotter_aral',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 345.',
      'Outer ring holds all starting Pastures, Forests, Rocks, and Mountains; the inner ring is arid Desert surrounding the 3-hex Aral Sea.',
      'Contributing Bricks to reach the 45th Wonder brick converts all 5 inner Desert tiles into Pastures right around the central sea.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player at (-2,0), (2,-1), and (0,2).',
    specialRules: 'Scenario 345 environmental notes: Wonder Brick #45 irrigates the desert steppes around the Aral Sea.',
  },
  {
    id: 'splotter_mississippi',
    name: 'Mississippi (Scenario 410)',
    subtitle: 'Continental North–South River Artery & Twin Tributaries (3–4 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '410',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '3 - 4 Players',
    minPlayers: 2,
    maxPlayers: 4,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'Classic Splotter 3–4 player river-basin scenario. A long north-to-south Mississippi river trunk joined by western and eastern tributaries divides the map into four quadrants draining into the Gulf sea.',
    objective:
      'Master river barge logistics and strategic bridge crossings across the four floodplains.',
    targetScore: 460,
    maxRounds: 24,
    mapPresetId: 'splotter_mississippi',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 410.',
      'Eight river edges divide the central basin—place Bridges (2 Boards) at key central confluences (0,0) and (0,-1).',
      'Use river Rafts and Rowboats along the central channel to move heavy Gold, Iron, and Stone without needing long road networks.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player across the four river quadrants.',
    specialRules: 'Standard 3rd Edition Base Game rules.',
  },
  {
    id: 'splotter_egypt',
    name: 'Egypt (Scenario 420)',
    subtitle: 'Fertile Nile River Corridor & Mediterranean Delta Across the Sahara (3–4 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    scenarioCode: '420',
    mapSetId: 'splotter_maps_pdf',
    recommendedPlayers: '3 - 4 Players',
    minPlayers: 2,
    maxPlayers: 4,
    isSolitaireOnly: false,
    difficulty: 'Advanced',
    description:
      'Classic Splotter 3–4 player scenario. Green pastures and forests hug the narrow Nile river and northern Mediterranean delta, while all gold mountains and stone quarries sit across the Eastern and Western deserts.',
    objective:
      'Pave caravan roads across the Sahara to the mountain gold mines and trigger Nile Irrigation at Brick #45.',
    targetScore: 450,
    maxRounds: 24,
    mapPresetId: 'splotter_egypt',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 420.',
      'Space along the Nile river is scarce—build Clay Pits and Stone Factories on the Nile shore to fuel Wonder construction.',
      'Pave desert roads to reach the outer Mountain mines (-2,2), (-3,1), (2,-2), (3,-1), then hit Brick #45 to turn all 6 desert tiles into Pasture!',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player along the Nile corridor.',
    specialRules: 'Wonder Brick #45 triggers Nile Desert Irrigation across all 6 desert hexes.',
  },

  // ============================================================================
  // SET 3: 1–2 Player & Duel Scenario Maps (`r&b_-_1-2...`)
  // ============================================================================
  {
    id: 'duel_paradise',
    name: 'Paradise (1–2P Optimization Basin)',
    subtitle: 'Herman Haverkort’s High-Yield Share & Coin Basin (1–2 Players)',
    designer: 'Herman Haverkort & Splotter Spellen',
    author: 'Herman Haverkort',
    publisher: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    scenarioCode: '1-2P-01',
    mapSetId: 'rb_1_2_player_maps',
    recommendedPlayers: '1 - 2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Beginner',
    description:
      'From the 1–2 Player Scenario Collection: The classic Paradise layout by Herman Haverkort that gave birth to the Small World puzzle series. Rich, symmetrical access to Forests, Rocks, Mountains, and a central river.',
    objective:
      'Maximize multi-batch Share and Coin output (playable solo in 20 turns or as a 2-player duel).',
    targetScore: 550,
    maxRounds: 20,
    mapPresetId: 'duel_paradise',
    keyTactics: [
      'Attributed to Herman Haverkort & Splotter Spellen (from `game_files/roads&boats/r&b_-_1-2...`).',
      'Central Rocks (0,-1) and (0,1) sit immediately adjacent to both starting Pastures (-1,0) and (1,0) for Turn-1 Stone Factory construction.',
      'Four outer Mountains and four Forests support full 6-batch Stock Exchange and Mint production.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on West (-1,0) and East (1,0) Pastures.',
    specialRules: 'Can be launched as a 1-Player Solo Puzzle (20 turns, 0 bots) or a 2-Player Duel (with AI or human opponent).',
  },
  {
    id: 'duel_two_bridges',
    name: 'Two Bridges (Scenario 210)',
    subtitle: 'Twin Parallel Rivers Separating Timber, Pastures & Gold Mountains (1–2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    scenarioCode: '210',
    mapSetId: 'rb_1_2_player_maps',
    recommendedPlayers: '1 - 2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Beginner',
    description:
      'From the 1–2 Player Scenario Collection: A compact 15-tile river duel where the central pasture belt is separated from northern forests/quarries and southern gold mountains by two parallel rivers.',
    objective:
      'Bridge both rivers efficiently (2 Boards per bridge) to unite timber, stone, and mountain gold.',
    targetScore: 420,
    maxRounds: 20,
    mapPresetId: 'duel_two_bridges',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 210 (`r&b_-_1-2...`).',
      'Spend 2 of your 5 starting Boards to bridge north into the Forest/Rock bank on Turn 1, then build a Woodcutter and Sawmill.',
      'Bridge south across the second river once your Stone Factory is producing Stone for Mines and a Mint.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on Central Island Pastures (-1,0) and (1,0).',
    specialRules: 'Playable solo (1P, 20 turns) or 2-player head-to-head.',
  },
  {
    id: 'duel_narrow_sea',
    name: 'The Narrow Sea (Scenario 220)',
    subtitle: 'Asymmetric Timber vs. Mountain Peninsulas Across a Two-Hex Strait (1–2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    scenarioCode: '220',
    mapSetId: 'rb_1_2_player_maps',
    recommendedPlayers: '1 - 2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'From the 1–2 Player Scenario Collection: Two elongated peninsulas face each other across a four-hex Narrow Sea channel, joined only at the northern tip by a desert/rock isthmus.',
    objective:
      'Establish cross-strait Raft/Rowboat ferries or pave the northern isthmus to combine western timber with eastern gold.',
    targetScore: 430,
    maxRounds: 22,
    mapPresetId: 'duel_narrow_sea',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 220 (`r&b_-_1-2...`).',
      'A Raft Factory (1 Board + 1 Stone) on the central shore lets Rafts (cap 3, spd 3) cross the Narrow Sea in a single move.',
      'Research Drilling to place an Offshore Oil Rig in the Narrow Sea for unlimited Fuel.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on West (-2,0) and East (2,0) Pastures.',
    specialRules: 'Playable solo (1P) or 2-player duel.',
  },
  {
    id: 'duel_four_islands',
    name: 'Four Islands (Scenario 230)',
    subtitle: 'Four Specialized Resource Islands Divided by Intersecting Sea Channels (1–2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    scenarioCode: '230',
    mapSetId: 'rb_1_2_player_maps',
    recommendedPlayers: '1 - 2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'From the 1–2 Player Scenario Collection: A 21-hex archipelago split by a cross-shaped sea channel into four 4-hex islands. No bridges can span open sea—watercraft are mandatory to reach the Mountain islands!',
    objective:
      'Build Rafts, Rowboats, and Steamers to link your starting Pasture/Forest island with the Mountain/Rock islands.',
    targetScore: 410,
    maxRounds: 22,
    mapPresetId: 'duel_four_islands',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 230 (`r&b_-_1-2...`).',
      'Each starting island (NW and SE) has Pasture, Forest, and Rock—enough to build a Woodcutter, Sawmill, Stone Factory, and Raft Factory!',
      'Sail across the central channel to colonize the NE and SW Mountain islands for Gold and Iron.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on NW (-1,-1) and SE (1,1) Island Pastures.',
    specialRules: 'Pure archipelago logistics: watercraft required to reach Mountain islands.',
  },
  {
    id: 'duel_oasis',
    name: 'Oasis Duel (Scenario 240)',
    subtitle: 'Twin River Oases Separated by a Central Desert Dune Belt (1–2 Players)',
    designer: 'Aaron Marriner · Splotter Community & Splotter Spellen',
    author: 'Aaron Marriner & Splotter Spellen',
    publisher: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    scenarioCode: '240',
    mapSetId: 'rb_1_2_player_maps',
    recommendedPlayers: '1 - 2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'From the 1–2 Player Scenario Collection: Two fertile river oases sit on opposite edges of a central desert dune belt, with four rich gold mountains on the northern and southern rims.',
    objective:
      'Pave across the rock/desert corridor or trigger Wonder Brick #45 Irrigation to bloom the central desert into pasture.',
    targetScore: 420,
    maxRounds: 22,
    mapPresetId: 'duel_oasis',
    keyTactics: [
      'Attributed to Aaron Marriner / Splotter Community Archive & Splotter Spellen (`r&b_-_1-2...`).',
      'Use Rock (-1,0) and (1,0) as stepping stones across the central desert so Donkeys never end their turn on unpaved Desert.',
      'Build Clay Pits on the oasis river banks to mass-produce Wonder Bricks and trigger Desert Irrigation at Brick #45.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on West Oasis (-2,1) and East Oasis (2,-1).',
    specialRules: 'Playable solo (1P) or 2-player duel.',
  },
  {
    id: 'duel_fjordland',
    name: 'Fjordland (Scenario 250)',
    subtitle: 'Deep Coastal Fjords & Central Rock Pass (1–2 Players)',
    designer: 'Uwe Gemming · Splotter Scenario Archive',
    author: 'Uwe Gemming',
    publisher: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    scenarioCode: '250',
    mapSetId: 'rb_1_2_player_maps',
    recommendedPlayers: '1 - 2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Advanced',
    description:
      'From the 1–2 Player Scenario Collection: Flat-topped Nordic coastline where northern and southern sea fjords nearly pinch the continent in two, leaving only a single central Rock pass at (0,0).',
    objective:
      'Control the central Rock pass at (0,0) and launch cross-fjord ferries to link the outer mountain headlands.',
    targetScore: 440,
    maxRounds: 22,
    mapPresetId: 'duel_fjordland',
    keyTactics: [
      'Attributed to Uwe Gemming & Splotter Spellen Scenario Archive (`r&b_-_1-2...`).',
      'The central Rock hex (0,0) is the sole overland bridge between East and West—paving it creates a high-traffic choke point.',
      'Building a Raft or Rowboat Factory on a fjord shore bypasses the central pass completely.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese on West (-2,1) and East (2,-1) Fjord Pastures.',
    specialRules: 'Flat-top hex orientation; playable solo (1P) or 2-player duel.',
  },

  // ============================================================================
  // SET 4: Classic Multiplayer & Tutorial Maps
  // ============================================================================
  {
    id: 'river_valley',
    name: 'River Valley (Standard)',
    subtitle: 'Classic 2–4 Player Central River Basin & Western Deserts',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Base Game Multiplayer Preset',
    scenarioCode: 'STD-01',
    mapSetId: 'classic_multiplayer',
    recommendedPlayers: '2 - 4 Players',
    minPlayers: 1,
    maxPlayers: 4,
    isSolitaireOnly: false,
    difficulty: 'Beginner',
    description:
      'The classic Splotter layout featuring a winding central river, deep pine forests, highland quarries, and fertile pastures for 2 to 4 players.',
    objective:
      'Build a thriving transport network and claim victory via Shares, Coins, Gold, and Wonder bricks.',
    targetScore: 450,
    maxRounds: 24,
    mapPresetId: 'river_valley',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga).',
      'Use the pre-paved starter road segments at West (-2,0) and East (2,-1) to accelerate Turn-1 forestry.',
      'Bridge the central river at (0,0) to connect both halves of the valley.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player.',
    specialRules: 'Standard 3rd Edition Base Game rules.',
  },
  {
    id: 'archipelago',
    name: 'The Archipelago (Scenario 222)',
    subtitle: 'Island Chains & Coastal Waterways (Deduplicated with Scenario 222)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Base Project / Scenario 222 (Deduplicated from Drive PDF)',
    scenarioCode: '222',
    mapSetId: 'classic_multiplayer',
    recommendedPlayers: '2 - 3 Players',
    minPlayers: 1,
    maxPlayers: 3,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'Island archipelagos separated by wide coastal waterways and rivers. Corresponds to Splotter Scenario 222 (Archipelago)—essential for naval logistics, shipyards, rafts, and bridges.',
    objective:
      'Combine coastal Raft/Rowboat factories with island mining to dominate maritime trade.',
    targetScore: 420,
    maxRounds: 24,
    mapPresetId: 'archipelago',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 222 (deduplicated).',
      'Construct Raft and Rowboat Factories on coastal pastures to cross the central 4-hex sea.',
      'Place an Offshore Oil Rig on a central water hex once Drilling is researched.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player.',
    specialRules: 'Canonical Archipelago map (Scenario 222 duplicate in Drive PDF ignored).',
  },
  {
    id: 'twin_peaks',
    name: 'Twin Peaks',
    subtitle: 'East & West Mountain Massifs Across a Desert Saddle (2–4 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Base Game Multiplayer Preset',
    scenarioCode: 'STD-03',
    mapSetId: 'classic_multiplayer',
    recommendedPlayers: '2 - 4 Players',
    minPlayers: 1,
    maxPlayers: 4,
    isSolitaireOnly: false,
    difficulty: 'Intermediate',
    description:
      'Vast mountainous frontier with rich mineral veins, stone quarries, and arid desert valleys. Heavy road network and Wagon/Truck fleets required.',
    objective:
      'Tap the twin mountain ranges for massive Gold and Iron output to fuel Mints and Stock Exchanges.',
    targetScore: 460,
    maxRounds: 24,
    mapPresetId: 'twin_peaks',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga).',
      'Four central Mountain hexes (-1,0), (-2,0), (1,0), (2,0) sit right beside the starting camps.',
      'Research Specialisation or Enlargement to maximize Gold extraction across the twin peaks.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player.',
    specialRules: 'Standard 3rd Edition Base Game rules.',
  },
  {
    id: 'tutorial_meadow',
    name: 'Tutorial Meadow',
    subtitle: 'Compact Step-by-Step Learning Valley (1–2 Players)',
    designer: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Interactive Tutorial Map',
    scenarioCode: 'TUT-01',
    mapSetId: 'classic_multiplayer',
    recommendedPlayers: '1 - 2 Players',
    minPlayers: 1,
    maxPlayers: 2,
    isSolitaireOnly: false,
    difficulty: 'Beginner',
    description:
      'A tranquil compact 9-hex valley designed to step-by-step master donkeys, forestry, sawmills, road paving, and the Wonder.',
    objective:
      'Learn the core 4-phase loop of Production, Movement, Building, and Wonder contribution.',
    targetScore: 300,
    maxRounds: 18,
    mapPresetId: 'tutorial_meadow',
    keyTactics: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga).',
      'Follow the interactive tutorial prompts or use this compact valley for quick 1–2 player practice matches.',
    ],
    startingNotes: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese per player.',
    specialRules: 'Pre-paved road between (-1,0) and (-1,-1).',
  },
];

export const ALL_SCENARIOS: ScenarioDefinition[] = [
  ...SOLITAIRE_SCENARIOS,
  ...MULTIPLAYER_AND_DRIVE_SCENARIOS,
];
