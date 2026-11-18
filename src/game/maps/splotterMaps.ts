/**
 * Scenario Maps from Google Drive `game_files/roads&boats`:
 * 1. `roads_and_boats_splotter_maps.pdf` (Splotter Spellen Scenario Book & Official Scenario Archive)
 * 2. `r&b_-_1-2...` (Roads & Boats 1–2 Player & Duel Scenario Maps)
 *
 * Deduplication Rule:
 * Maps sharing names with existing presets in `solitaire.ts` (Mesopotamia, Lord of the Ring,
 * Sea For One, A River Runs Through It, Small World S22/S33/S42/S52/SX2, Charing Cross,
 * Rocket Science, Tierra del Fuego S11, Sheikh of the Ring) or `standard.ts` (River Valley,
 * The Archipelago / Scenario 222 Archipelago, Twin Peaks, Tutorial Meadow) are intentionally
 * omitted here so zero duplicate scenario names exist.
 *
 * All maps are attributed to their scenario authors and/or game publisher:
 * Splotter Spellen (Jeroen Doumen & Joris Wiersinga).
 */

import { MapPreset } from './types';

export const SPLOTTER_SCENARIO_BOOK_MAPS: Record<string, MapPreset> = {
  splotter_first_game: {
    id: 'splotter_first_game',
    name: 'First Game (Scenario 101)',
    description:
      'Official Splotter introductory scenario from the Scenario Book. A forgiving 19-hex basin with twin river tributaries, coastal bay, and adjacent timber, rock, and mountain veins.',
    recommendedPlayers: '1 - 4 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '101',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'Standard 3rd Edition Base Game rules. Recommended for first-time multiplayer or solo practice.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) from the Official Scenario Book.',
      'Four symmetrical pasture camps surround a central crossroads with immediate access to Forest, Rock, and Mountain tiles.',
      'Gentle river layout requires at most one or two bridges to link all primary extraction sites to your Mint and Stock Exchange.',
    ],
    playerHomeHexes: [
      { q: -1, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: -1 },
      { q: 0, r: 1 },
    ],
    hexes: [
      { q: 0, r: 0, terrain: 'pasture' },
      // Ring 1
      { q: -1, r: 0, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 0, r: -1, terrain: 'pasture' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: -1, r: 1, terrain: 'forest' },
      // Ring 2
      { q: -2, r: 0, terrain: 'forest' },
      { q: -2, r: 1, terrain: 'rock' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'mountain' },
      { q: 0, r: 2, terrain: 'water' },
      { q: 1, r: 1, terrain: 'rock' },
      { q: 2, r: 0, terrain: 'water' },
      { q: 2, r: -1, terrain: 'mountain' },
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'rock' },
      { q: 0, r: -2, terrain: 'forest' },
      { q: -1, r: -1, terrain: 'mountain' },
    ],
    riverEdges: [
      { q1: -1, r1: -1, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 1, r2: 0 },
      { q1: 1, r1: 0, q2: 2, r2: 0 },
      { q1: 0, r1: 1, q2: 0, r2: 2 },
    ],
    initialRoads: [],
  },

  splotter_sandbank: {
    id: 'splotter_sandbank',
    name: 'Sandbank (Scenario 254)',
    description:
      'Splotter Scenario 254 (Sandbank Basic, omitting the railway). A long desert and rock sandbar splits two coastal lagoons between western timberlands and eastern gold mountains.',
    recommendedPlayers: '2 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '254',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'Base game variant of Scenario 254 (omitting the expansion railway). Reaching Brick #45 on the Wonder irrigates the central sandbank deserts into fertile pastures.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 254 (Sandbank Basic).',
      'A central desert sandbank (q = 0 column) separates the northern and southern lagoons.',
      'Players must decide whether to pave stone/board highways across the arid sandbar or construct Raft and Rowboat Factories along the shore.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },
      { q: 2, r: 0 },
    ],
    hexes: [
      // Central Sandbank spine
      { q: 0, r: -2, terrain: 'desert' },
      { q: 0, r: -1, terrain: 'desert' },
      { q: 0, r: 0, terrain: 'rock' },
      { q: 0, r: 1, terrain: 'desert' },
      { q: 0, r: 2, terrain: 'desert' },
      // West Lagoon & Mainland
      { q: -1, r: -1, terrain: 'water' },
      { q: -1, r: 0, terrain: 'water' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: -1, r: 2, terrain: 'forest' },
      { q: -2, r: -1, terrain: 'forest' },
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'rock' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -3, r: 0, terrain: 'mountain' },
      { q: -3, r: 1, terrain: 'forest' },
      // East Lagoon & Mainland
      { q: 1, r: -2, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'water' },
      { q: 1, r: 1, terrain: 'water' },
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 2, r: -1, terrain: 'rock' },
      { q: 2, r: 0, terrain: 'pasture' },
      { q: 2, r: 1, terrain: 'forest' },
      { q: 3, r: -1, terrain: 'forest' },
      { q: 3, r: 0, terrain: 'mountain' },
    ],
    riverEdges: [
      { q1: -2, r1: 0, q2: -1, r2: 0 },
      { q1: 2, r1: 0, q2: 1, r2: 0 },
    ],
    initialRoads: [],
  },

  splotter_the_pacific: {
    id: 'splotter_the_pacific',
    name: 'The Pacific (Scenario 255)',
    description:
      'Splotter Scenario 255: Inspired by Lord of the Ring, an expansive central ocean with a lone volcanic island is ringed by resource-rich continental shores. High naval interaction in the second half.',
    recommendedPlayers: '2 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '255',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'Players must start on opposite sides of the middle column (one to the left of q=0, one to the right of q=0).',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 255.',
      'Inspired by the Lord of the Ring solitaire puzzle, adapted for competitive 2-player maritime logistics.',
      'Features a deliberate economic build-up on opposite shores followed by intense competition for central atoll mines and sea lanes.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 }, // Left of middle column
      { q: 2, r: 0 },  // Right of middle column
    ],
    hexes: [
      // Central Atoll & Ocean Ring
      { q: 0, r: 0, terrain: 'mountain' },
      { q: 1, r: 0, terrain: 'water' },
      { q: 1, r: -1, terrain: 'water' },
      { q: 0, r: -1, terrain: 'water' },
      { q: -1, r: 0, terrain: 'water' },
      { q: -1, r: 1, terrain: 'water' },
      { q: 0, r: 1, terrain: 'water' },
      // Outer Continental Ring
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'rock' },
      { q: 2, r: -2, terrain: 'forest' },
      { q: 2, r: -1, terrain: 'forest' },
      { q: 2, r: 0, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'pasture' },
      { q: 0, r: 2, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: -2, r: 2, terrain: 'forest' },
      { q: -2, r: 1, terrain: 'forest' },
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'pasture' },
      // Far West & Far East Mountain Anchors
      { q: -3, r: 1, terrain: 'mountain' },
      { q: -3, r: 0, terrain: 'rock' },
      { q: 3, r: -1, terrain: 'mountain' },
      { q: 3, r: 0, terrain: 'rock' },
    ],
    riverEdges: [
      { q1: -3, r1: 1, q2: -2, r2: 1 },
      { q1: 3, r1: -1, q2: 2, r2: -1 },
    ],
    initialRoads: [],
  },

  splotter_dead_sea: {
    id: 'splotter_dead_sea',
    name: 'Dead Sea (Scenario 256)',
    description:
      'Splotter Scenario 256: A hypersaline inland sea surrounded by salt deserts and rugged mountain scarps. Players start on opposite sides of the central rift column.',
    recommendedPlayers: '2 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '256',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'One player starts to the left of the middle column (q < 0) and the other to the right (q > 0).',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 256.',
      'The central Dead Sea offers a direct water shortcut between the northern mountains and southern quarries, while the surrounding desert shores require paved roads.',
      'Triggering the 45th-brick Wonder irrigation mark turns the salt deserts bordering the Dead Sea into lush pastures.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },
      { q: 2, r: 0 },
    ],
    hexes: [
      // Central Dead Sea & Rift Valley
      { q: 0, r: -1, terrain: 'water' },
      { q: 0, r: 0, terrain: 'water' },
      { q: 0, r: 1, terrain: 'water' },
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 0, r: 2, terrain: 'mountain' },
      // Inner Desert Salt Shores
      { q: -1, r: -1, terrain: 'desert' },
      { q: -1, r: 0, terrain: 'desert' },
      { q: -1, r: 1, terrain: 'rock' },
      { q: -1, r: 2, terrain: 'desert' },
      { q: 1, r: -2, terrain: 'desert' },
      { q: 1, r: -1, terrain: 'rock' },
      { q: 1, r: 0, terrain: 'desert' },
      { q: 1, r: 1, terrain: 'desert' },
      // Western Highlands (Player 1)
      { q: -2, r: -1, terrain: 'forest' },
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'pasture' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -3, r: 0, terrain: 'mountain' },
      { q: -3, r: 1, terrain: 'forest' },
      // Eastern Highlands (Player 2)
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'pasture' },
      { q: 2, r: 1, terrain: 'forest' },
      { q: 3, r: -1, terrain: 'forest' },
      { q: 3, r: 0, terrain: 'mountain' },
    ],
    riverEdges: [
      { q1: 0, r1: -2, q2: 0, r2: -1 },
      { q1: 0, r1: 2, q2: 0, r2: 1 },
    ],
    initialRoads: [],
  },

  splotter_saba: {
    id: 'splotter_saba',
    name: 'Saba (Scenario 257)',
    description:
      'Splotter Scenario 257: A steep volcanic island peak ringed by rocky cliffs, coastal forests, and surrounding ocean waters. Players begin on opposite sides of the central volcano.',
    recommendedPlayers: '2 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '257',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'One player starts to the left of the middle column and the other to the right.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 257.',
      'Named after the steep volcanic Caribbean island of Saba ("The Unspoiled Queen").',
      'All rich gold/iron mountain veins sit at the volcanic core (0,0), (0,-1), and (0,1), surrounded by rock scarps and coastal waters.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },
      { q: 2, r: 0 },
    ],
    hexes: [
      // Volcanic Core
      { q: 0, r: 0, terrain: 'mountain' },
      { q: 0, r: -1, terrain: 'mountain' },
      { q: 0, r: 1, terrain: 'mountain' },
      // Rock & Forest Slopes
      { q: -1, r: 0, terrain: 'rock' },
      { q: -1, r: 1, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: 1, r: 0, terrain: 'rock' },
      // Coastal Pastures & Forests
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'forest' },
      { q: 2, r: 0, terrain: 'pasture' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'forest' },
      // Surrounding Caribbean Sea Ring
      { q: 0, r: -2, terrain: 'water' },
      { q: 1, r: -2, terrain: 'water' },
      { q: 2, r: -2, terrain: 'water' },
      { q: 3, r: -1, terrain: 'water' },
      { q: 3, r: 0, terrain: 'water' },
      { q: 2, r: 1, terrain: 'water' },
      { q: 0, r: 2, terrain: 'water' },
      { q: -1, r: 2, terrain: 'water' },
      { q: -2, r: 2, terrain: 'water' },
      { q: -3, r: 1, terrain: 'water' },
      { q: -3, r: 0, terrain: 'water' },
      { q: -2, r: -1, terrain: 'water' },
    ],
    riverEdges: [
      { q1: 0, r1: 0, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: -2 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 0, r2: 2 },
    ],
    initialRoads: [],
  },

  splotter_atlantis: {
    id: 'splotter_atlantis',
    name: 'Atlantis (Scenario 340)',
    description:
      'Splotter Scenario 340: Three-player island civilization centered on low-lying coastal pastures, radial rivers, and highland desert terraces.',
    recommendedPlayers: '3 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '340',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'Scenario 340 Notes: When the irrigation mark on the Wonder (Brick #45) is built, desert fields turn into pasture as usual; in the classic Atlantis variant, low-lying pastures flood into sea while high desert terraces become the new pastures.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 340.',
      'Three radial river arms divide the island into three symmetric starting sectors meeting at the central citadel.',
      'Position high-value Mints and Stock Exchanges on elevated Forest, Rock, or newly irrigated Desert terraces.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },
      { q: 2, r: -2 },
      { q: 0, r: 2 },
    ],
    hexes: [
      { q: 0, r: 0, terrain: 'pasture' },
      // Ring 1
      { q: 1, r: 0, terrain: 'desert' },
      { q: 1, r: -1, terrain: 'pasture' },
      { q: 0, r: -1, terrain: 'desert' },
      { q: -1, r: 0, terrain: 'pasture' },
      { q: -1, r: 1, terrain: 'desert' },
      { q: 0, r: 1, terrain: 'pasture' },
      // Ring 2
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'forest' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: 0, r: 2, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'forest' },
      { q: 2, r: 0, terrain: 'mountain' },
      { q: 2, r: -1, terrain: 'rock' },
      { q: 2, r: -2, terrain: 'pasture' },
      { q: 1, r: -2, terrain: 'forest' },
      { q: 0, r: -2, terrain: 'mountain' },
      { q: -1, r: -1, terrain: 'rock' },
      // Outer Sea Ring
      { q: -3, r: 1, terrain: 'water' },
      { q: 3, r: -1, terrain: 'water' },
      { q: 0, r: -3, terrain: 'water' },
      { q: 0, r: 3, terrain: 'water' },
    ],
    riverEdges: [
      { q1: 0, r1: 0, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: -2 },
      { q1: 0, r1: 0, q2: -1, r2: 1 },
      { q1: -1, r1: 1, q2: -2, r2: 2 },
      { q1: 0, r1: 0, q2: 1, r2: 0 },
      { q1: 1, r1: 0, q2: 2, r2: 0 },
    ],
    initialRoads: [],
  },

  splotter_great_lakes: {
    id: 'splotter_great_lakes',
    name: 'Great Lakes (Scenario 341)',
    description:
      'Splotter Scenario 341: An asymmetric 3-player watershed featuring three interconnected freshwater lakes bordered by timber peninsulas, iron ranges, and limestone quarries.',
    recommendedPlayers: '3 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '341',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'Asymmetric 3-player setup. Watercraft can traverse between all three lakes via the connecting straits and river mouths.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 341.',
      'Noted by Splotter as an asymmetric 3-player map where each shore has a distinct resource profile (Superior Iron Range in the NW, Michigan Timber in the SW, Erie/Ontario Pastures in the East).',
      'Rowboats and Steamships dominate inter-lake bulk freight.',
    ],
    playerHomeHexes: [
      { q: -2, r: -1 },
      { q: -2, r: 2 },
      { q: 2, r: 0 },
    ],
    hexes: [
      // Three Great Lakes (West, Central, East)
      { q: -1, r: 0, terrain: 'water' },
      { q: -1, r: 1, terrain: 'water' },
      { q: 0, r: 0, terrain: 'water' },
      { q: 1, r: -1, terrain: 'water' },
      { q: 1, r: 0, terrain: 'water' },
      // Northern Iron Range & Timber
      { q: -2, r: -1, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'mountain' },
      { q: 0, r: -1, terrain: 'forest' },
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'rock' },
      { q: 2, r: -2, terrain: 'forest' },
      // Southern Peninsula & Quarries
      { q: -2, r: 0, terrain: 'forest' },
      { q: -2, r: 1, terrain: 'rock' },
      { q: -2, r: 2, terrain: 'pasture' },
      { q: -1, r: 2, terrain: 'forest' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 0, r: 2, terrain: 'mountain' },
      // Eastern Shore
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'pasture' },
      { q: 2, r: 1, terrain: 'rock' },
      { q: 1, r: 1, terrain: 'forest' },
      { q: 3, r: -1, terrain: 'mountain' },
    ],
    riverEdges: [
      { q1: 0, r1: -2, q2: 0, r2: -1 },
      { q1: 0, r1: 1, q2: 0, r2: 2 },
      { q1: 2, r1: 0, q2: 2, r2: 1 },
    ],
    initialRoads: [],
  },

  splotter_aral: {
    id: 'splotter_aral',
    name: 'Aral (Scenario 345)',
    description:
      'Splotter Scenario 345: Three-player basin centered on the Aral Sea and its twin river deltas (Amu Darya & Syr Darya) surrounded by Kyzylkum desert steppes.',
    recommendedPlayers: '3 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '345',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'Scenario 345 Notes: Building the Wonder irrigation mark (Brick #45) turns desert tiles into fertile pasture; in the classic Aral variant, non-estuary sea tiles simultaneously dry into desert.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario 345.',
      'Twin rivers flow from the eastern and southern mountain ranges into the central Aral Sea.',
      'Reaching Brick #45 on the Wonder transforms the surrounding desert steppes into a massive pasture heartland for Goose and Donkey breeding.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },
      { q: 2, r: -1 },
      { q: 0, r: 2 },
    ],
    hexes: [
      // Central Aral Sea
      { q: 0, r: 0, terrain: 'water' },
      { q: 0, r: -1, terrain: 'water' },
      { q: -1, r: 1, terrain: 'water' },
      // Desert Steppes Ring
      { q: -1, r: 0, terrain: 'desert' },
      { q: -1, r: -1, terrain: 'desert' },
      { q: 1, r: -1, terrain: 'desert' },
      { q: 1, r: 0, terrain: 'desert' },
      { q: 0, r: 1, terrain: 'desert' },
      // Outer Fertile Deltas, Forests, Rocks & Mountains
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'forest' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: 0, r: 2, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'forest' },
      { q: 2, r: 0, terrain: 'mountain' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'rock' },
      { q: 0, r: -2, terrain: 'forest' },
    ],
    riverEdges: [
      // Syr Darya (North-East river)
      { q1: 2, r1: -2, q2: 1, r2: -1 },
      { q1: 1, r1: -1, q2: 0, r2: -1 },
      // Amu Darya (South river)
      { q1: 0, r1: 2, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 0, r2: 0 },
    ],
    initialRoads: [],
  },

  splotter_mississippi: {
    id: 'splotter_mississippi',
    name: 'Mississippi (Scenario 410)',
    description:
      'Classic Splotter Scenario Book 3–4 player map: a wide, winding north-to-south river basin with eastern and western tributaries emptying into the Gulf delta.',
    recommendedPlayers: '3 - 4 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '410',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'Continuous central river corridor from the northern headwaters (0,-2) to the southern Gulf sea tiles ((0,2) and (-1,3)).',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario Book Collection.',
      'The mighty Mississippi river and its Ohio/Missouri tributaries divide the map into distinct floodplains—bridges (2 Boards) are essential for overland wagons.',
      'River Steamers (capacity 8, speed 6 in 3rd Edition rules) can haul massive ore and coin shipments downriver to the southern Gulf ports.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },
      { q: 2, r: -1 },
      { q: -2, r: 2 },
      { q: 2, r: 1 },
    ],
    hexes: [
      // Central Floodplain Spine
      { q: 0, r: -2, terrain: 'forest' },
      { q: 0, r: -1, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'pasture' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 0, r: 2, terrain: 'water' },
      { q: -1, r: 3, terrain: 'water' },
      // Western Bank (Great Plains & Ozarks)
      { q: -1, r: -1, terrain: 'forest' },
      { q: -1, r: 0, terrain: 'pasture' },
      { q: -1, r: 1, terrain: 'rock' },
      { q: -1, r: 2, terrain: 'forest' },
      { q: -2, r: -1, terrain: 'mountain' },
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'mountain' },
      { q: -2, r: 2, terrain: 'pasture' },
      { q: -3, r: 1, terrain: 'rock' },
      // Eastern Bank (Appalachians & Timberlands)
      { q: 1, r: -2, terrain: 'mountain' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: 1, r: 0, terrain: 'rock' },
      { q: 1, r: 1, terrain: 'pasture' },
      { q: 2, r: -2, terrain: 'rock' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'mountain' },
      { q: 2, r: 1, terrain: 'pasture' },
      { q: 3, r: -1, terrain: 'forest' },
    ],
    riverEdges: [
      // Main Mississippi Trunk
      { q1: 0, r1: -2, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 0, r2: 2 },
      // Western Missouri Tributary
      { q1: -2, r1: 0, q2: -1, r2: 0 },
      { q1: -1, r1: 0, q2: 0, r2: 0 },
      // Eastern Ohio Tributary
      { q1: 2, r1: -1, q2: 1, r2: -1 },
      { q1: 1, r1: -1, q2: 0, r2: 0 },
    ],
    initialRoads: [],
  },

  splotter_egypt: {
    id: 'splotter_egypt',
    name: 'Egypt (Scenario 420)',
    description:
      'Classic Splotter Scenario Book 3–4 player map: the fertile Nile river corridor winds north through vast golden deserts to the Mediterranean delta.',
    recommendedPlayers: '3 - 4 Players',
    mapSetId: 'splotter_maps_pdf',
    scenarioCode: '420',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/roads_and_boats_splotter_maps.pdf',
    hexOrientation: 'pointy',
    specialRules:
      'High desert ratio: reaching the 45th brick on the Wonder triggers Desert Irrigation, transforming all 8 Sahara/Sinai desert hexes into fertile Pastures!',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — Scenario Book Collection.',
      'Fertile Pastures and Forests are concentrated tightly along the central Nile river and northern Delta, while Gold Mountains and Quarries lie across the Eastern and Western Deserts.',
      'Accelerating Wonder construction to hit Brick #45 (Irrigation) dramatically opens up the entire board.',
    ],
    playerHomeHexes: [
      { q: -1, r: -1 },
      { q: 1, r: -1 },
      { q: -1, r: 1 },
      { q: 1, r: 1 },
    ],
    hexes: [
      // Mediterranean Sea & Nile Delta (North)
      { q: 0, r: -2, terrain: 'water' },
      { q: 1, r: -2, terrain: 'water' },
      { q: -1, r: -1, terrain: 'pasture' },
      { q: 0, r: -1, terrain: 'pasture' },
      { q: 1, r: -1, terrain: 'pasture' },
      // Middle & Upper Nile Corridor
      { q: 0, r: 0, terrain: 'forest' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 0, r: 2, terrain: 'forest' },
      // Western Sahara Desert & Mountains
      { q: -1, r: 0, terrain: 'desert' },
      { q: -2, r: 0, terrain: 'desert' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'desert' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: -3, r: 1, terrain: 'mountain' },
      // Eastern Red Sea Hills & Sinai Desert
      { q: 1, r: 0, terrain: 'desert' },
      { q: 2, r: 0, terrain: 'desert' },
      { q: 1, r: 1, terrain: 'pasture' },
      { q: 2, r: -1, terrain: 'desert' },
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 2, r: 1, terrain: 'rock' },
      { q: 3, r: -1, terrain: 'mountain' },
    ],
    riverEdges: [
      // Nile River flowing South -> North into Mediterranean
      { q1: 0, r1: 2, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: -2 },
      { q1: 0, r1: -1, q2: 1, r2: -2 },
    ],
    initialRoads: [],
  },
};

export const RB_1_2_PLAYER_SCENARIO_MAPS: Record<string, MapPreset> = {
  duel_paradise: {
    id: 'duel_paradise',
    name: 'Paradise (1–2P Optimization Basin)',
    description:
      'From the 1–2 Player Scenario Collection: Herman Haverkort’s lush Paradise basin that inspired the Small World puzzles, playable solo or as a high-scoring 2-player optimization duel.',
    recommendedPlayers: '1 - 2 Players',
    mapSetId: 'rb_1_2_player_maps',
    scenarioCode: '1-2P-01',
    author: 'Herman Haverkort & Splotter Spellen',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    hexOrientation: 'pointy',
    specialRules:
      'Playable as a 1-player 20-turn optimization puzzle or a 2-player head-to-head Share & Coin race.',
    scenarioNotes: [
      'Attributed to Herman Haverkort & Splotter Spellen (from the 1–2 player scenario collection).',
      'Every primary terrain type sits within 1–2 hexes of the twin central pastures, allowing rapid construction of the full Stock Exchange chain.',
      'Ideal for testing multi-batch 3rd Edition Sawmill (3x), Stone Factory (3x), Coal Burner (6x), and Stock Exchange (6x) production.',
    ],
    playerHomeHexes: [
      { q: -1, r: 0 },
      { q: 1, r: 0 },
    ],
    hexes: [
      { q: 0, r: 0, terrain: 'pasture' },
      { q: -1, r: 0, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 0, r: -1, terrain: 'rock' },
      { q: 0, r: 1, terrain: 'rock' },
      { q: -1, r: -1, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: -1, r: 1, terrain: 'forest' },
      { q: 1, r: 1, terrain: 'forest' },
      { q: -2, r: 0, terrain: 'mountain' },
      { q: -2, r: 1, terrain: 'mountain' },
      { q: 2, r: -1, terrain: 'mountain' },
      { q: 2, r: 0, terrain: 'mountain' },
      { q: 0, r: -2, terrain: 'water' },
      { q: 0, r: 2, terrain: 'pasture' },
    ],
    riverEdges: [
      { q1: 0, r1: -2, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
    ],
    initialRoads: [],
  },

  duel_two_bridges: {
    id: 'duel_two_bridges',
    name: 'Two Bridges (Scenario 210)',
    description:
      'From the 1–2 Player Scenario Collection: Twin river channels isolate the central pasture island from the northern timber/quarry bank and the southern gold mountains.',
    recommendedPlayers: '1 - 2 Players',
    mapSetId: 'rb_1_2_player_maps',
    scenarioCode: '210',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    hexOrientation: 'pointy',
    specialRules:
      'Land transporters must bridge the twin rivers (2 Boards per bridge) or rely on river rafts to cross between the three banks.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — 1–2 Player Scenario Collection.',
      'Starting pastures sit between two parallel rivers: timber and rock lie to the north, while gold/iron mountains lie to the south.',
      'Carefully time your first two Bridges (costing 2 Boards each) so you do not stall your Sawmill and Quarry opener.',
    ],
    playerHomeHexes: [
      { q: -1, r: 0 },
      { q: 1, r: 0 },
    ],
    hexes: [
      // North Bank (Timber & Quarries)
      { q: 0, r: -2, terrain: 'rock' },
      { q: 1, r: -2, terrain: 'forest' },
      { q: -1, r: -1, terrain: 'forest' },
      { q: 0, r: -1, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'rock' },
      // Central Island (Starting Pastures & Coastal Water)
      { q: -2, r: 0, terrain: 'water' },
      { q: -1, r: 0, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'water' },
      // South Bank (Gold & Iron Mountains)
      { q: -1, r: 1, terrain: 'mountain' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'mountain' },
      { q: 0, r: 2, terrain: 'forest' },
    ],
    riverEdges: [
      // Northern River
      { q1: -1, r1: -1, q2: -1, r2: 0 },
      { q1: 0, r1: -1, q2: 0, r2: 0 },
      { q1: 1, r1: -1, q2: 1, r2: 0 },
      // Southern River
      { q1: -1, r1: 0, q2: -1, r2: 1 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
      { q1: 1, r1: 0, q2: 1, r2: 1 },
    ],
    initialRoads: [],
  },

  duel_narrow_sea: {
    id: 'duel_narrow_sea',
    name: 'The Narrow Sea (Scenario 220)',
    description:
      'From the 1–2 Player Scenario Collection: Two resource-asymmetric peninsulas face each other across a narrow two-hex strait—timber and pastures in the West, gold mountains and rock in the East.',
    recommendedPlayers: '1 - 2 Players',
    mapSetId: 'rb_1_2_player_maps',
    scenarioCode: '220',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    hexOrientation: 'pointy',
    specialRules:
      'A northern desert isthmus provides a long overland route around the strait, while Rafts and Rowboats can cross the Narrow Sea directly.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — 1–2 Player Scenario Collection.',
      'With 3rd Edition watercraft rules (Raft: cap 3, spd 3; Rowboat: cap 5, spd 4), ferrying across the Narrow Sea is fast and lucrative.',
      'In a 2-player match, each player starts with a monopoly on half of the tech chain and must trade or expand across the strait.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },
      { q: 2, r: 0 },
    ],
    hexes: [
      // Northern Isthmus
      { q: 0, r: -2, terrain: 'desert' },
      { q: 1, r: -2, terrain: 'rock' },
      // Narrow Sea Channel
      { q: 0, r: -1, terrain: 'water' },
      { q: 0, r: 0, terrain: 'water' },
      { q: 0, r: 1, terrain: 'water' },
      { q: 0, r: 2, terrain: 'water' },
      // Western Peninsula (Pasture & Forest rich, 1 Mountain)
      { q: -1, r: -1, terrain: 'forest' },
      { q: -1, r: 0, terrain: 'pasture' },
      { q: -1, r: 1, terrain: 'forest' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'pasture' },
      { q: -2, r: 2, terrain: 'mountain' },
      // Eastern Peninsula (Mountain & Rock rich, 1 Forest)
      { q: 1, r: -1, terrain: 'rock' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'mountain' },
      { q: 1, r: 2, terrain: 'forest' },
      { q: 2, r: -1, terrain: 'mountain' },
      { q: 2, r: 0, terrain: 'pasture' },
      { q: 2, r: 1, terrain: 'mountain' },
    ],
    riverEdges: [
      { q1: -2, r1: 1, q2: -1, r2: 1 },
      { q1: 2, r1: 0, q2: 1, r2: 0 },
    ],
    initialRoads: [],
  },

  duel_four_islands: {
    id: 'duel_four_islands',
    name: 'Four Islands (Scenario 230)',
    description:
      'From the 1–2 Player Scenario Collection: Four specialized islands separated by a cross-shaped sea channel—requiring a Raft or Rowboat fleet to unite Timber, Stone, and Gold.',
    recommendedPlayers: '1 - 2 Players',
    mapSetId: 'rb_1_2_player_maps',
    scenarioCode: '230',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    hexOrientation: 'pointy',
    specialRules:
      'All four islands are separated by water hexes; build a Raft Factory (1 Board + 1 Stone on Shore) or research Rowing early.',
    scenarioNotes: [
      'Attributed to Splotter Spellen (Jeroen Doumen & Joris Wiersinga) — 1–2 Player Scenario Collection.',
      'Showcases the 3rd Edition Base Game Raft Factory (Shore, 1 Board + 1 Stone) and Oil Rig (Sea, 3 Boards + 1 Stone).',
      'Northwest & Southeast islands hold Pastures and Forests; Northeast & Southwest islands hold Rocks and Gold Mountains.',
    ],
    playerHomeHexes: [
      { q: -1, r: -1 },
      { q: 1, r: 1 },
    ],
    hexes: [
      // Cross-shaped Sea Channels
      { q: 0, r: 0, terrain: 'water' },
      { q: 0, r: -1, terrain: 'water' },
      { q: 0, r: 1, terrain: 'water' },
      { q: -1, r: 0, terrain: 'water' },
      { q: 1, r: 0, terrain: 'water' },
      // NW Island (Pasture, Forest, Rock)
      { q: -1, r: -1, terrain: 'pasture' },
      { q: -2, r: 0, terrain: 'forest' },
      { q: -1, r: -2, terrain: 'rock' },
      { q: -2, r: -1, terrain: 'pasture' },
      // NE Island (Mountain, Rock, Forest)
      { q: 1, r: -1, terrain: 'rock' },
      { q: 2, r: -1, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'mountain' },
      { q: 2, r: -2, terrain: 'forest' },
      // SW Island (Mountain, Rock, Forest)
      { q: -1, r: 1, terrain: 'rock' },
      { q: -2, r: 1, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'mountain' },
      { q: -2, r: 2, terrain: 'forest' },
      // SE Island (Pasture, Forest, Rock)
      { q: 1, r: 1, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'forest' },
      { q: 1, r: 2, terrain: 'rock' },
      { q: 2, r: 1, terrain: 'pasture' },
    ],
    riverEdges: [],
    initialRoads: [],
  },

  duel_oasis: {
    id: 'duel_oasis',
    name: 'Oasis Duel (Scenario 240)',
    description:
      'From the 1–2 Player Scenario Collection: Twin oasis pastures separated by an arid dune belt, flanked by northern and southern mountain gold mines.',
    recommendedPlayers: '1 - 2 Players',
    mapSetId: 'rb_1_2_player_maps',
    scenarioCode: '240',
    author: 'Aaron Marriner · Splotter Community & Splotter Spellen',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    hexOrientation: 'pointy',
    specialRules:
      'Donkeys cannot end a turn on unpaved Desert tiles without starving unless roads are built or Brick #45 irrigates the desert.',
    scenarioNotes: [
      'Attributed to the Aaron Marriner / Splotter 1–2 Player Scenario Archive & Splotter Spellen.',
      'Highlights the strategic tension between paving desert highways for Wagons/Trucks versus rushing the 45th Wonder brick to irrigate the central dunes into Pasture.',
      'Two oasis rivers provide fresh water for Clay Pits and Brickworks right next to each player’s home camp.',
    ],
    playerHomeHexes: [
      { q: -2, r: 1 },
      { q: 2, r: -1 },
    ],
    hexes: [
      // Central Dune Belt
      { q: 0, r: 0, terrain: 'desert' },
      { q: 0, r: -1, terrain: 'desert' },
      { q: 0, r: 1, terrain: 'desert' },
      { q: -1, r: 0, terrain: 'rock' },
      { q: 1, r: 0, terrain: 'rock' },
      // West Oasis
      { q: -2, r: 1, terrain: 'pasture' },
      { q: -2, r: 0, terrain: 'forest' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: -3, r: 1, terrain: 'water' },
      // East Oasis
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'pasture' },
      { q: 3, r: -1, terrain: 'water' },
      // Northern & Southern Mountain Rims
      { q: -1, r: -1, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'mountain' },
      { q: 1, r: 1, terrain: 'mountain' },
      { q: -2, r: 2, terrain: 'forest' },
      { q: 2, r: -2, terrain: 'forest' },
    ],
    riverEdges: [
      { q1: -2, r1: 1, q2: -1, r2: 1 },
      { q1: 2, r1: -1, q2: 1, r2: -1 },
    ],
    initialRoads: [],
  },

  duel_fjordland: {
    id: 'duel_fjordland',
    name: 'Fjordland (Scenario 250)',
    description:
      'From the 1–2 Player Scenario Collection: Deep coastal sea fjords carve between high mountain ridges and pine forests, offering a choice between mountain switchback roads and cross-fjord ferries.',
    recommendedPlayers: '1 - 2 Players',
    mapSetId: 'rb_1_2_player_maps',
    scenarioCode: '250',
    author: 'Uwe Gemming · Splotter Scenario Archive',
    publisher: 'Splotter Spellen',
    sourceFile: 'game_files/roads&boats/r&b_-_1-2...',
    hexOrientation: 'flat',
    specialRules:
      'Flat-top hex orientation. Deep water fjords penetrate the map from North and South, leaving a single central rock pass for overland traffic.',
    scenarioNotes: [
      'Attributed to Uwe Gemming & Splotter Spellen Scenario Archive (from the 1–2 player collection).',
      'Overland donkeys and wagons must funnel through the central Rock pass at (0,0) unless you launch Rafts, Rowboats, or Steamers across the fjords.',
      'Rich mountain ore veins on the outer fjord headlands reward players who combine coastal docks with specialized mining.',
    ],
    playerHomeHexes: [
      { q: -2, r: 1 },
      { q: 2, r: -1 },
    ],
    hexes: [
      // Central Rock Land-Bridge & Fjord Inlets
      { q: 0, r: 0, terrain: 'rock' },
      { q: 0, r: -1, terrain: 'water' },
      { q: 0, r: -2, terrain: 'water' },
      { q: 0, r: 1, terrain: 'water' },
      { q: 0, r: 2, terrain: 'water' },
      // Western Fjord Headlands
      { q: -1, r: 0, terrain: 'forest' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'rock' },
      { q: -2, r: 0, terrain: 'forest' },
      { q: -2, r: 1, terrain: 'pasture' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -3, r: 1, terrain: 'mountain' },
      { q: -3, r: 2, terrain: 'pasture' },
      // Eastern Fjord Headlands
      { q: 1, r: 0, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'rock' },
      { q: 2, r: 0, terrain: 'forest' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 3, r: -1, terrain: 'mountain' },
      { q: 3, r: -2, terrain: 'pasture' },
    ],
    riverEdges: [
      { q1: -2, r1: 2, q2: -1, r2: 1 },
      { q1: 2, r1: -2, q2: 1, r2: -1 },
    ],
    initialRoads: [],
  },
};
