/**
 * Standard Multiplayer & Tutorial Map Presets
 */

import { MapPreset } from './types';

export const STANDARD_MAP_PRESETS: Record<string, MapPreset> = {
  river_valley: {
    id: 'river_valley',
    name: 'River Valley (Standard)',
    description: 'The classic Splotter layout featuring a winding central river, deep pine forests, highland quarries, and fertile pastures.',
    recommendedPlayers: '2 - 4 Players',
    mapSetId: 'classic_multiplayer',
    scenarioCode: 'STD-01',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Base Game Rulebook',
    scenarioNotes: [
      'A balanced 2–4 player basin split by a central north-to-south river tributary.',
      'Each starting camp sits on a Pasture adjacent to Forest, Rock, and Mountain tiles for fast early Woodcutter, Sawmill, and Quarry placement.',
      'Western deserts convert to fertile Pasture if the 45th brick Irrigation mark on the Wonder is reached.',
    ],
    playerHomeHexes: [
      { q: -2, r: 0 },  // Player 1 home (west)
      { q: 2, r: -1 },  // Player 2 home (east)
      { q: 0, r: 2 },   // Player 3 home (south)
      { q: 0, r: -2 },  // Player 4 home (north)
    ],
    hexes: [
      { q: 0, r: 0, terrain: 'pasture' },
      // Ring 1
      { q: 1, r: 0, terrain: 'pasture' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: 0, r: -1, terrain: 'forest' },
      { q: -1, r: 0, terrain: 'pasture' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: 0, r: 1, terrain: 'mountain' },
      // Ring 2
      { q: 2, r: 0, terrain: 'forest' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: -2, terrain: 'rock' },
      { q: 1, r: -2, terrain: 'mountain' },
      { q: 0, r: -2, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'forest' },
      { q: -2, r: 0, terrain: 'pasture' },
      { q: -2, r: 1, terrain: 'forest' },
      { q: -2, r: 2, terrain: 'rock' },
      { q: -1, r: 2, terrain: 'pasture' },
      { q: 0, r: 2, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'mountain' },
      // Outskirts & water bodies
      { q: 3, r: -1, terrain: 'water' },
      { q: 3, r: -2, terrain: 'water' },
      { q: -3, r: 1, terrain: 'desert' },
      { q: -3, r: 2, terrain: 'desert' },
      { q: -1, r: -2, terrain: 'forest' },
      { q: -2, r: -1, terrain: 'mountain' },
      { q: 1, r: -3, terrain: 'pasture' },
      { q: -1, r: 3, terrain: 'mountain' },
    ],
    riverEdges: [
      { q1: 1, r1: -2, q2: 0, r2: -1 },
      { q1: 0, r1: -2, q2: 0, r2: -1 },
      { q1: 0, r1: -1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
      { q1: 0, r1: 1, q2: 0, r2: 2 },
      { q1: 0, r1: 1, q2: 1, r2: 1 },
    ],
    initialRoads: [
      { q1: -2, r1: 0, q2: -1, r2: 0 },
      { q1: 2, r1: -1, q2: 1, r2: -1 },
    ],
  },

  archipelago: {
    id: 'archipelago',
    name: 'The Archipelago',
    description: 'Island archipelagos separated by wide coastal waterways and rivers. Essential for naval logistics, shipyards, rafts, and bridges.',
    recommendedPlayers: '2 - 3 Players',
    mapSetId: 'classic_multiplayer',
    scenarioCode: '222',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Base Project / Scenario 222 (Deduplicated from Drive PDF)',
    scenarioNotes: [
      'Matches Splotter Scenario 222 (Archipelago); kept as the canonical Archipelago preset without duplicating.',
      'Central sea tiles divide three outer island clusters, rewarding early Raft Factory and Rowboat Factory investments.',
      'Use coastal pastures as dock transfer hubs between land donkeys and maritime barges.',
    ],
    playerHomeHexes: [
      { q: -2, r: 1 },
      { q: 2, r: -1 },
      { q: 0, r: -2 },
    ],
    hexes: [
      { q: 0, r: 0, terrain: 'water' },
      { q: 1, r: 0, terrain: 'water' },
      { q: 0, r: 1, terrain: 'water' },
      { q: -1, r: 1, terrain: 'pasture' },
      { q: -1, r: 0, terrain: 'forest' },
      { q: 0, r: -1, terrain: 'water' },
      // Islands
      { q: -2, r: 1, terrain: 'pasture' },
      { q: -2, r: 0, terrain: 'forest' },
      { q: -2, r: 2, terrain: 'mountain' },
      { q: 2, r: -1, terrain: 'pasture' },
      { q: 2, r: -2, terrain: 'mountain' },
      { q: 1, r: -1, terrain: 'forest' },
      { q: 0, r: -2, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'mountain' },
      { q: 1, r: 1, terrain: 'forest' },
      { q: 0, r: 2, terrain: 'rock' },
      { q: 2, r: 0, terrain: 'pasture' },
      { q: -1, r: 2, terrain: 'rock' },
      { q: 1, r: -2, terrain: 'rock' },
    ],
    riverEdges: [
      { q1: -1, r1: 0, q2: -1, r2: 1 },
      { q1: -2, r1: 1, q2: -1, r2: 1 },
      { q1: 1, r1: -1, q2: 2, r2: -1 },
    ],
    initialRoads: [],
  },

  twin_peaks: {
    id: 'twin_peaks',
    name: 'Twin Peaks',
    description: 'Vast mountainous frontier with rich mineral veins, stone quarries, and arid desert valleys. Heavy road network required.',
    recommendedPlayers: '2 - 4 Players',
    mapSetId: 'classic_multiplayer',
    scenarioCode: 'STD-03',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Base Game Multiplayer Preset',
    scenarioNotes: [
      'East and West mountain ranges flank a central pasture and desert saddle.',
      'High concentration of Mountain tiles supports multiple Mines and Stone Factories for rapid Coin and Stock production.',
      'Requires paved road networks and Wagon/Truck fleets to cross the central highland passes.',
    ],
    playerHomeHexes: [
      { q: -2, r: -1 },
      { q: 2, r: 1 },
      { q: -1, r: 2 },
      { q: 1, r: -2 },
    ],
    hexes: [
      { q: 0, r: 0, terrain: 'pasture' },
      { q: -1, r: 0, terrain: 'mountain' },
      { q: -2, r: 0, terrain: 'rock' },
      { q: -2, r: -1, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'forest' },
      { q: 1, r: 0, terrain: 'mountain' },
      { q: 2, r: 0, terrain: 'rock' },
      { q: 2, r: 1, terrain: 'pasture' },
      { q: 1, r: 1, terrain: 'forest' },
      { q: 0, r: 1, terrain: 'desert' },
      { q: -1, r: 2, terrain: 'pasture' },
      { q: 0, r: -1, terrain: 'desert' },
      { q: 1, r: -2, terrain: 'pasture' },
      { q: 0, r: -2, terrain: 'forest' },
      { q: 0, r: 2, terrain: 'forest' },
    ],
    riverEdges: [
      { q1: 0, r1: -1, q2: 0, r2: 0 },
      { q1: 0, r1: 0, q2: 0, r2: 1 },
    ],
    initialRoads: [
      { q1: -2, r1: -1, q2: -1, r2: -1 },
      { q1: 2, r1: 1, q2: 1, r2: 1 },
    ],
  },

  tutorial_meadow: {
    id: 'tutorial_meadow',
    name: 'Tutorial Meadow',
    description: 'A tranquil compact valley designed to step-by-step master donkeys, forestry, sawmills, road paving, and the Wonder.',
    recommendedPlayers: '1 - 2 Players',
    mapSetId: 'classic_multiplayer',
    scenarioCode: 'TUT-01',
    author: 'Jeroen Doumen & Joris Wiersinga',
    publisher: 'Splotter Spellen',
    sourceFile: 'Interactive Tutorial Map',
    scenarioNotes: [
      'Compact 9-hex valley with immediate access to Pasture, Forest, Mountain, and coastal Water.',
      'Pre-paved starter road segment lets new players test donkey movement and sawmill conversion on Turn 1.',
    ],
    playerHomeHexes: [
      { q: -1, r: 0 },
      { q: 1, r: 0 },
    ],
    hexes: [
      { q: -1, r: 0, terrain: 'pasture' },
      { q: 0, r: 0, terrain: 'pasture' },
      { q: 1, r: 0, terrain: 'pasture' },
      { q: -1, r: -1, terrain: 'forest' },
      { q: 0, r: -1, terrain: 'forest' },
      { q: -1, r: 1, terrain: 'mountain' },
      { q: 0, r: 1, terrain: 'rock' },
      { q: 1, r: -1, terrain: 'water' },
      { q: 1, r: 1, terrain: 'pasture' },
    ],
    riverEdges: [
      { q1: 0, r1: 0, q2: 1, r2: 0 },
      { q1: 0, r1: -1, q2: 1, r2: -1 },
    ],
    initialRoads: [
      { q1: -1, r1: 0, q2: -1, r2: -1 },
    ],
  },
};

