/**
 * Official Solitaire Scenario Map Presets
 *
 * Sourced directly from the per-scenario reference files in /docs/scenarios/*.md
 * and verified cropped diagrams in /docs/scenarios/*.png.
 */

import { MapPreset } from './types';

export const SOLITAIRE_MAP_PRESETS: Record<string, MapPreset> = {
  scenario_mesopotamia: {
    id: 'scenario_mesopotamia',
    name: 'Mesopotamia',
    description:
      'Exact Splotter layout: 19-tile pointy-top basin crossed by northern, western, and southern rivers draining into eastern seas.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: 0, r: 0 }], // CP (Pasture)
    hexes: [
      // Row -2: NM, NR, ND
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'rock' },
      { q: 2, r: -2, terrain: 'desert' },
      // Row -1: NWM, NWW, NEW, NES
      { q: -1, r: -1, terrain: 'mountain' },
      { q: 0, r: -1, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: 2, r: -1, terrain: 'water' },
      // Row 0: WM, WW, CP, EP, ES
      { q: -2, r: 0, terrain: 'mountain' },
      { q: -1, r: 0, terrain: 'forest' },
      { q: 0, r: 0, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'water' },
      // Row +1: SWM, SWW, SEW, SES
      { q: -2, r: 1, terrain: 'mountain' },
      { q: -1, r: 1, terrain: 'forest' },
      { q: 0, r: 1, terrain: 'forest' },
      { q: 1, r: 1, terrain: 'water' },
      // Row +2: SM, SR, SD
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: 0, r: 2, terrain: 'desert' },
    ],
    riverEdges: [
      // Northern river: NM -> NR -> ND -> NES
      { q1: 0, r1: -2, q2: 1, r2: -2 },
      { q1: 1, r1: -2, q2: 2, r2: -2 },
      { q1: 2, r1: -2, q2: 2, r2: -1 },
      // Western tributary: WM -> WW -> NWW -> NEW -> EP
      { q1: -2, r1: 0, q2: -1, r2: 0 },
      { q1: -1, r1: 0, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 1, r2: -1 },
      { q1: 1, r1: -1, q2: 1, r2: 0 },
      // Southern tributary: SM -> SWW -> CP -> SEW -> EP
      { q1: -2, r1: 2, q2: -1, r2: 1 },
      { q1: -1, r1: 1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 1, r2: 0 },
      // Combined outflow: EP -> ES
      { q1: 1, r1: 0, q2: 2, r2: 0 },
    ],
    initialRoads: [],
  },

  scenario_lord_of_the_ring: {
    id: 'scenario_lord_of_the_ring',
    name: 'Lord of the Ring',
    description:
      'Exact Splotter layout: 19-tile pointy-top hexagonal ring around a 6-hex inland sea and central Desert Island (DI).',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: -1, r: -1 }], // P10 (Pasture)
    hexes: [
      // Row -2: M11, M12, M1
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'mountain' },
      { q: 2, r: -2, terrain: 'mountain' },
      // Row -1: P10, S11, S1, W2
      { q: -1, r: -1, terrain: 'pasture' },
      { q: 0, r: -1, terrain: 'water' },
      { q: 1, r: -1, terrain: 'water' },
      { q: 2, r: -1, terrain: 'forest' },
      // Row 0: W9, S9, DI, S3, W3
      { q: -2, r: 0, terrain: 'forest' },
      { q: -1, r: 0, terrain: 'water' },
      { q: 0, r: 0, terrain: 'desert' },
      { q: 1, r: 0, terrain: 'water' },
      { q: 2, r: 0, terrain: 'forest' },
      // Row +1: W8, S7, S5, P4
      { q: -2, r: 1, terrain: 'forest' },
      { q: -1, r: 1, terrain: 'water' },
      { q: 0, r: 1, terrain: 'water' },
      { q: 1, r: 1, terrain: 'pasture' },
      // Row +2: R7, R6, R5
      { q: -2, r: 2, terrain: 'rock' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: 0, r: 2, terrain: 'rock' },
    ],
    riverEdges: [],
    initialRoads: [],
  },

  scenario_sea_for_one: {
    id: 'scenario_sea_for_one',
    name: 'Sea For One',
    description:
      'Exact Splotter layout: 22-tile pointy-top archipelago linked by four narrow desert land bridges and twin inland seas.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: -3, r: 0 }], // WP (Pasture)
    hexes: [
      // Row -1 (7 tiles): NWP, NWD, NWW, NEW, NED, NEM, FNM
      { q: -2, r: -1, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'desert' },
      { q: 0, r: -1, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: 2, r: -1, terrain: 'desert' },
      { q: 3, r: -1, terrain: 'mountain' },
      { q: 4, r: -1, terrain: 'mountain' },
      // Row 0 (8 tiles): WP, WS, WR, CR, CS, ES, FES, FEM
      { q: -3, r: 0, terrain: 'pasture' },
      { q: -2, r: 0, terrain: 'water' },
      { q: -1, r: 0, terrain: 'rock' },
      { q: 0, r: 0, terrain: 'rock' },
      { q: 1, r: 0, terrain: 'water' },
      { q: 2, r: 0, terrain: 'water' },
      { q: 3, r: 0, terrain: 'water' },
      { q: 4, r: 0, terrain: 'mountain' },
      // Row +1 (7 tiles): SWP, SWD, SWW, SEW, SED, SEM, FSM
      { q: -3, r: 1, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'desert' },
      { q: -1, r: 1, terrain: 'forest' },
      { q: 0, r: 1, terrain: 'forest' },
      { q: 1, r: 1, terrain: 'desert' },
      { q: 2, r: 1, terrain: 'mountain' },
      { q: 3, r: 1, terrain: 'mountain' },
    ],
    riverEdges: [],
    initialRoads: [],
  },

  scenario_river_runs_through_it: {
    id: 'scenario_river_runs_through_it',
    name: 'A River Runs Through It',
    description:
      'Exact Splotter layout: 11-tile pointy-top map where a single continuous river winds from UM across eight hexes into sea LPS.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: 0, r: 1 }], // LP (Lower Pasture)
    hexes: [
      // Row -1 (4 tiles): UM, UW, CR, CM
      { q: -1, r: -1, terrain: 'mountain' },
      { q: 0, r: -1, terrain: 'forest' },
      { q: 1, r: -1, terrain: 'rock' },
      { q: 2, r: -1, terrain: 'mountain' },
      // Row 0 (4 tiles): CD, CW, CP, CMS
      { q: -1, r: 0, terrain: 'desert' },
      { q: 0, r: 0, terrain: 'forest' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'water' },
      // Row +1 (3 tiles): LD, LP, LPS
      { q: -1, r: 1, terrain: 'desert' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'water' },
    ],
    riverEdges: [
      // UM -> UW -> CR -> CP -> CW -> CD -> LD -> LP -> LPS
      { q1: -1, r1: -1, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 1, r2: -1 },
      { q1: 1, r1: -1, q2: 1, r2: 0 },
      { q1: 1, r1: 0, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: -1, r2: 0 },
      { q1: -1, r1: 0, q2: -1, r2: 1 },
      { q1: -1, r1: 1, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 1, r2: 1 },
    ],
    initialRoads: [],
  },

  scenario_small_world_s22: {
    id: 'scenario_small_world_s22',
    name: 'Small World S22',
    description:
      'Exact Splotter layout: 8-tile pointy-top minimal puzzle with just enough terrain variety to produce two Shares.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: 0, r: 0 }], // CP (Central Pasture)
    hexes: [
      // Row -1: NP, M
      { q: 0, r: -1, terrain: 'pasture' },
      { q: 1, r: -1, terrain: 'mountain' },
      // Row 0: WP, CP, R
      { q: -1, r: 0, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'rock' },
      // Row +1: W, SP, FP
      { q: -1, r: 1, terrain: 'forest' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'pasture' },
    ],
    riverEdges: [],
    initialRoads: [],
  },

  scenario_small_world_s33: {
    id: 'scenario_small_world_s33',
    name: 'Small World S33',
    description:
      'Exact Splotter layout: 10-tile pointy-top puzzle featuring three separate mountain hexes and minimal space to produce three Shares.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: 1, r: 0 }], // CP (Central Pasture)
    hexes: [
      // Row -1: NM, NP, NW
      { q: 0, r: -1, terrain: 'mountain' },
      { q: 1, r: -1, terrain: 'pasture' },
      { q: 2, r: -1, terrain: 'forest' },
      // Row 0: CM, CR, CP
      { q: -1, r: 0, terrain: 'mountain' },
      { q: 0, r: 0, terrain: 'rock' },
      { q: 1, r: 0, terrain: 'pasture' },
      // Row +1: SM, SWP, SEP, SW
      { q: -2, r: 1, terrain: 'mountain' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'forest' },
    ],
    riverEdges: [],
    initialRoads: [],
  },

  scenario_small_world_s42: {
    id: 'scenario_small_world_s42',
    name: 'Small World S42',
    description:
      'Exact Splotter layout: 13-tile flat-topped grid designed by Uwe Gemming as the smallest map capable of four Shares in 20 turns.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'flat',
    playerHomeHexes: [{ q: 0, r: 0 }], // CP (Central Pasture)
    hexes: [
      // Col -2: WS, FWP
      { q: -2, r: 1, terrain: 'water' },
      { q: -2, r: 2, terrain: 'pasture' },
      // Col -1: WP, CS, SM
      { q: -1, r: 0, terrain: 'pasture' },
      { q: -1, r: 1, terrain: 'water' },
      { q: -1, r: 2, terrain: 'mountain' },
      // Col 0: NP, CP, CW
      { q: 0, r: -1, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'pasture' },
      { q: 0, r: 1, terrain: 'forest' },
      // Col +1: NM, EP, EW
      { q: 1, r: -1, terrain: 'mountain' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'forest' },
      // Col +2: R, FEP
      { q: 2, r: -1, terrain: 'rock' },
      { q: 2, r: 0, terrain: 'pasture' },
    ],
    riverEdges: [
      // Main river: NM -> EP -> CP -> CS and CP -> NP -> WP -> WS
      { q1: 1, r1: -1, q2: 1, r2: 0 },
      { q1: 1, r1: 0, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: -1, r2: 1 },
      { q1: 0, r1: 0, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: -1, r2: 0 },
      { q1: -1, r1: 0, q2: -2, r2: 1 },
      // Southern river: SM -> FWP -> CS
      { q1: -1, r1: 2, q2: -2, r2: 2 },
      { q1: -2, r1: 2, q2: -1, r2: 1 },
    ],
    initialRoads: [],
  },

  scenario_small_world_s52: {
    id: 'scenario_small_world_s52',
    name: 'Small World S52',
    description:
      'Exact Splotter layout: 19-tile pointy-top puzzle constructed by Uwe Gemming for five-Share production across winding twin seas.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: 1, r: 0 }], // CP (Central Pasture)
    hexes: [
      // Row -2: NWM, NM
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'mountain' },
      // Row -1: WM, NS, NP, NEP, EM
      { q: -1, r: -1, terrain: 'mountain' },
      { q: 0, r: -1, terrain: 'water' },
      { q: 1, r: -1, terrain: 'pasture' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 3, r: -1, terrain: 'mountain' },
      // Row 0: WP, CS, CP, NR
      { q: -1, r: 0, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'water' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 2, r: 0, terrain: 'rock' },
      // Row +1: SWP, SM, WW, SEP, EW
      { q: -2, r: 1, terrain: 'pasture' },
      { q: -1, r: 1, terrain: 'mountain' },
      { q: 0, r: 1, terrain: 'forest' },
      { q: 1, r: 1, terrain: 'pasture' },
      { q: 2, r: 1, terrain: 'forest' },
      // Row +2: SP, SR, SW
      { q: -1, r: 2, terrain: 'pasture' },
      { q: 0, r: 2, terrain: 'rock' },
      { q: 1, r: 2, terrain: 'forest' },
    ],
    riverEdges: [
      // NM -> NS
      { q1: 1, r1: -2, q2: 0, r2: -1 },
      // SM -> SWP -> WP -> CS
      { q1: -1, r1: 1, q2: -2, r2: 1 },
      { q1: -2, r1: 1, q2: -1, r2: 0 },
      { q1: -1, r1: 0, q2: 0, r2: 0 },
      // EM -> NR -> SEP -> CP -> NEP -> NP -> NS
      { q1: 3, r1: -1, q2: 2, r2: 0 },
      { q1: 2, r1: 0, q2: 1, r2: 1 },
      { q1: 1, r1: 1, q2: 1, r2: 0 },
      { q1: 1, r1: 0, q2: 2, r2: -1 },
      { q1: 2, r1: -1, q2: 1, r2: -1 },
      { q1: 1, r1: -1, q2: 0, r2: -1 },
      // Central connector: CP -> CS
      { q1: 1, r1: 0, q2: 0, r2: 0 },
    ],
    initialRoads: [],
  },

  scenario_small_world_sx2: {
    id: 'scenario_small_world_sx2',
    name: 'Small World SX2',
    description:
      'Exact Splotter layout: 25-tile flat-topped grand Paradise puzzle supporting six-Share optimization and 800-point ceilings.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'flat',
    playerHomeHexes: [{ q: -1, r: 0 }], // CP (Central Pasture)
    hexes: [
      // Col -3: WM, WW, SWP
      { q: -3, r: 1, terrain: 'mountain' },
      { q: -3, r: 2, terrain: 'forest' },
      { q: -3, r: 3, terrain: 'pasture' },
      // Col -2: NWM, NWW, CW, SWM, SWW
      { q: -2, r: -1, terrain: 'mountain' },
      { q: -2, r: 0, terrain: 'forest' },
      { q: -2, r: 1, terrain: 'forest' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: -2, r: 3, terrain: 'forest' },
      // Col -1: NW, CP, SR, SP
      { q: -1, r: -1, terrain: 'forest' },
      { q: -1, r: 0, terrain: 'pasture' },
      { q: -1, r: 1, terrain: 'rock' },
      { q: -1, r: 2, terrain: 'pasture' },
      // Col 0: NM, NR, ER, SM, SEP
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 0, r: -1, terrain: 'rock' },
      { q: 0, r: 0, terrain: 'rock' },
      { q: 0, r: 1, terrain: 'mountain' },
      { q: 0, r: 2, terrain: 'pasture' },
      // Col +1: NEM, EP, SEM, SEW
      { q: 1, r: -2, terrain: 'mountain' },
      { q: 1, r: -1, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'mountain' },
      { q: 1, r: 1, terrain: 'forest' },
      // Col +2: EM, NS, SS
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 2, r: -1, terrain: 'water' },
      { q: 2, r: 0, terrain: 'water' },
      // Col +3: FM
      { q: 3, r: -1, terrain: 'mountain' },
    ],
    riverEdges: [
      // Northern river: NWM -> NW -> CP -> NR -> EP -> NS
      { q1: -2, r1: -1, q2: -1, r2: -1 },
      { q1: -1, r1: -1, q2: -1, r2: 0 },
      { q1: -1, r1: 0, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 1, r2: -1 },
      { q1: 1, r1: -1, q2: 2, r2: -1 },
      // NE tributary: EM -> NS
      { q1: 2, r1: -2, q2: 2, r2: -1 },
      // Southern river: WM -> WW -> SWP -> SWW -> SP -> SEP -> SEW -> SS
      { q1: -3, r1: 1, q2: -3, r2: 2 },
      { q1: -3, r1: 2, q2: -3, r2: 3 },
      { q1: -3, r1: 3, q2: -2, r2: 3 },
      { q1: -2, r1: 3, q2: -1, r2: 2 },
      { q1: -1, r1: 2, q2: 0, r2: 2 },
      { q1: 0, r1: 2, q2: 1, r2: 1 },
      { q1: 1, r1: 1, q2: 2, r2: 0 },
    ],
    initialRoads: [],
  },

  scenario_charing_cross: {
    id: 'scenario_charing_cross',
    name: 'Charing Cross',
    description:
      'Exact Splotter layout: 38-tile flat-topped X-shaped railway crossroads with four coastal sea belts flanking twin central pasture hubs.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'flat',
    playerHomeHexes: [{ q: 0, r: 0 }], // NP (North Hub Pasture)
    hexes: [
      // NW-SE Mainline & Central Hub
      { q: 0, r: -3, terrain: 'mountain' }, // NM
      { q: 0, r: -2, terrain: 'desert' },   // ND
      { q: 0, r: -1, terrain: 'forest' },   // NW
      { q: 0, r: 0, terrain: 'pasture' },   // NP (Home hub)
      { q: 0, r: 1, terrain: 'pasture' }, // SP (South hub)
      { q: 0, r: 2, terrain: 'forest' },    // SW
      { q: 0, r: 3, terrain: 'desert' },    // SD
      { q: 0, r: 4, terrain: 'mountain' },  // SM
      // NE Rail Arm
      { q: 1, r: 0, terrain: 'rock' },      // ER
      { q: 2, r: 0, terrain: 'forest' },    // EW
      { q: 3, r: 0, terrain: 'pasture' },   // EP
      { q: 4, r: 0, terrain: 'mountain' },  // EM
      // SW Rail Arm
      { q: -1, r: 1, terrain: 'rock' },     // WR
      { q: -2, r: 1, terrain: 'forest' },   // WW
      { q: -3, r: 1, terrain: 'pasture' },  // WP
      { q: -4, r: 1, terrain: 'mountain' }, // WM
      // NE Sea Belt (6 tiles)
      { q: 1, r: -3, terrain: 'water' },    // NES1
      { q: 1, r: -2, terrain: 'water' },    // NES2
      { q: 1, r: -1, terrain: 'water' },    // NES3
      { q: 2, r: -1, terrain: 'water' },    // NES4
      { q: 3, r: -1, terrain: 'water' },    // NES5
      { q: 4, r: -1, terrain: 'water' },    // NES6
      // NW Sea Belt (5 tiles)
      { q: -3, r: 0, terrain: 'water' },    // NWS1
      { q: -2, r: 0, terrain: 'water' },    // NWS2
      { q: -1, r: 0, terrain: 'water' },    // NWS3
      { q: -1, r: -1, terrain: 'water' },   // NWS4
      { q: -1, r: -2, terrain: 'water' },   // NWS5
      // SE Sea Belt (5 tiles)
      { q: 3, r: 1, terrain: 'water' },     // SES1
      { q: 2, r: 1, terrain: 'water' },     // SES2
      { q: 1, r: 1, terrain: 'water' },     // SES3
      { q: 1, r: 2, terrain: 'water' },     // SES4
      { q: 1, r: 3, terrain: 'water' },     // SES5
      // SW Sea Belt (6 tiles)
      { q: -1, r: 4, terrain: 'water' },    // SWS1
      { q: -1, r: 3, terrain: 'water' },    // SWS2
      { q: -1, r: 2, terrain: 'water' },    // SWS3
      { q: -2, r: 2, terrain: 'water' },    // SWS4
      { q: -3, r: 2, terrain: 'water' },    // SWS5
      { q: -4, r: 2, terrain: 'water' },    // SWS6
    ],
    riverEdges: [],
    initialRoads: [],
    railroads: [
      // NW-SE Mainline (7 edges)
      { q1: 0, r1: -3, q2: 0, r2: -2 },
      { q1: 0, r1: -2, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 0, r2: 2 },
      { q1: 0, r1: 2, q2: 0, r2: 3 },
      { q1: 0, r1: 3, q2: 0, r2: 4 },
      // NE Branch from NP (4 edges)
      { q1: 0, r1: 0, q2: 1, r2: 0 },
      { q1: 1, r1: 0, q2: 2, r2: 0 },
      { q1: 2, r1: 0, q2: 3, r2: 0 },
      { q1: 3, r1: 0, q2: 4, r2: 0 },
      // SW Branch from SP (4 edges)
      { q1: -4, r1: 1, q2: -3, r2: 1 },
      { q1: -3, r1: 1, q2: -2, r2: 1 },
      { q1: -2, r1: 1, q2: -1, r2: 1 },
      { q1: -1, r1: 1, q2: 0, r2: 1 },
    ],
  },

  scenario_rocket_science: {
    id: 'scenario_rocket_science',
    name: 'Rocket Science',
    description:
      'Exact Splotter layout: 34-tile flat-topped archipelago featuring a 7-hex main island encircled by sea and three 3-hex outer islands.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'flat',
    playerHomeHexes: [{ q: 0, r: -1 }], // NP (Main island North Pasture)
    hexes: [
      // Col -4: WM
      { q: -4, r: 3, terrain: 'mountain' },
      // Col -3: WS, FW, SWM
      { q: -3, r: 2, terrain: 'water' },
      { q: -3, r: 3, terrain: 'forest' },
      { q: -3, r: 4, terrain: 'mountain' },
      // Col -2: S10, S9, S8, SWS
      { q: -2, r: 0, terrain: 'water' },
      { q: -2, r: 1, terrain: 'water' },
      { q: -2, r: 2, terrain: 'water' },
      { q: -2, r: 3, terrain: 'water' },
      // Col -1: NWM, NWS, S11, NR, SR, S7
      { q: -1, r: -3, terrain: 'mountain' },
      { q: -1, r: -2, terrain: 'water' },
      { q: -1, r: -1, terrain: 'water' },
      { q: -1, r: 0, terrain: 'rock' },
      { q: -1, r: 1, terrain: 'rock' },
      { q: -1, r: 2, terrain: 'water' },
      // Col 0: FP, S12, NP, CD, SP, S6
      { q: 0, r: -3, terrain: 'pasture' },
      { q: 0, r: -2, terrain: 'water' },
      { q: 0, r: -1, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'desert' },
      { q: 0, r: 1, terrain: 'pasture' },
      { q: 0, r: 2, terrain: 'water' },
      // Col +1: NEM, NES, S1, NW, SW, S5
      { q: 1, r: -4, terrain: 'mountain' },
      { q: 1, r: -3, terrain: 'water' },
      { q: 1, r: -2, terrain: 'water' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: 1, r: 0, terrain: 'forest' },
      { q: 1, r: 1, terrain: 'water' },
      // Col +2: S2, S3, S4, SES
      { q: 2, r: -2, terrain: 'water' },
      { q: 2, r: -1, terrain: 'water' },
      { q: 2, r: 0, terrain: 'water' },
      { q: 2, r: 1, terrain: 'water' },
      // Col +3: ES, FR, SEM
      { q: 3, r: -1, terrain: 'water' },
      { q: 3, r: 0, terrain: 'rock' },
      { q: 3, r: 1, terrain: 'mountain' },
      // Col +4: EM
      { q: 4, r: -1, terrain: 'mountain' },
    ],
    riverEdges: [],
    initialRoads: [],
  },

  scenario_tierra_del_fuego_s11: {
    id: 'scenario_tierra_del_fuego_s11',
    name: 'Tierra del Fuego S11',
    description:
      'Exact Splotter layout: 6-tile pointy-top triangle where every tile must be recycled carefully with Planes & Trains demolition bombs.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: -1, r: 0 }], // WP (West Pasture)
    hexes: [
      // Row -1: W
      { q: 0, r: -1, terrain: 'forest' },
      // Row 0: WP, R
      { q: -1, r: 0, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'rock' },
      // Row +1: M, SP, EP
      { q: -2, r: 1, terrain: 'mountain' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: 0, r: 1, terrain: 'pasture' },
    ],
    riverEdges: [],
    initialRoads: [],
  },

  scenario_sheikh_of_the_ring: {
    id: 'scenario_sheikh_of_the_ring',
    name: 'Sheikh of the Ring',
    description:
      'Exact Splotter layout: 19-tile pointy-top ring surrounding a 6-hex desert ring around the central SEA, demanding air support or careful land routing.',
    recommendedPlayers: '1 Player (Solo)',
    hexOrientation: 'pointy',
    playerHomeHexes: [{ q: -1, r: -1 }], // P10 (Northwest Pasture)
    hexes: [
      // Row -2: M11, M12, M1
      { q: 0, r: -2, terrain: 'mountain' },
      { q: 1, r: -2, terrain: 'mountain' },
      { q: 2, r: -2, terrain: 'mountain' },
      // Row -1: P10, D11, D1, W2
      { q: -1, r: -1, terrain: 'pasture' },
      { q: 0, r: -1, terrain: 'desert' },
      { q: 1, r: -1, terrain: 'desert' },
      { q: 2, r: -1, terrain: 'forest' },
      // Row 0: W9, D9, SEA, D3, W3
      { q: -2, r: 0, terrain: 'forest' },
      { q: -1, r: 0, terrain: 'desert' },
      { q: 0, r: 0, terrain: 'water' },
      { q: 1, r: 0, terrain: 'desert' },
      { q: 2, r: 0, terrain: 'forest' },
      // Row +1: W8, D7, D5, P4
      { q: -2, r: 1, terrain: 'forest' },
      { q: -1, r: 1, terrain: 'desert' },
      { q: 0, r: 1, terrain: 'desert' },
      { q: 1, r: 1, terrain: 'pasture' },
      // Row +2: R7, R6, R5
      { q: -2, r: 2, terrain: 'rock' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: 0, r: 2, terrain: 'rock' },
    ],
    riverEdges: [],
    initialRoads: [],
  },
};
