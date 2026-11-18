/**
 * ROADS & BOATS - AUTHORITATIVE RULES ENGINE & SPECIFICATION MATRIX
 *
 * Driven by the Google Drive-hosted 3rd Edition Base Game ruleset:
 * `game_files/roads&boats/Roadsandboats.type.ts` & `Roadsandboats.base.json`
 * (see `src/game/drive-ruleset.ts`).
 *
 * Designers: Jeroen Doumen & Joris Wiersinga (Splotter Spellen)
 */

import { BuildingType, GoodType, TerrainType, TransporterType } from './types';
import {
  DRIVE_ROADS_AND_BOATS_RULESET,
  RoadsAndBoatsRuleset,
} from './drive-ruleset';

export { DRIVE_ROADS_AND_BOATS_RULESET };
export type { RoadsAndBoatsRuleset };

// ============================================================================
// 1. SETUP & FLEET LIMIT RULES (3rd Edition Base Game)
// ============================================================================
export interface GameSetupRules {
  readonly homeMarkersPerPlayer: number;
  readonly startingDonkeysPerPlayer: number;
  readonly startingGoodsPerPlayer: Readonly<Partial<Record<GoodType, number>>>;
  readonly startingDonkeyCapacity: number;
  readonly startingDonkeyMoves: number;
}

export interface FleetLimitRules {
  readonly maxTotalTransporters: number;
  readonly maxLandTransporters: number;
  readonly maxWaterTransporters: number;
}

export const SETUP_RULES: GameSetupRules = {
  homeMarkersPerPlayer: DRIVE_ROADS_AND_BOATS_RULESET.startingInventory.homeMarkers,
  startingDonkeysPerPlayer:
    DRIVE_ROADS_AND_BOATS_RULESET.startingInventory.transporters[0]?.count ?? 3,
  startingGoodsPerPlayer: {
    boards: 5, // Superseded by Drive ruleset: 5 Boards, 1 Stone, 2 Geese
    stone: 1,
    goose: 2,
  },
  startingDonkeyCapacity:
    DRIVE_ROADS_AND_BOATS_RULESET.transporters.Donkey.cargoCapacity,
  startingDonkeyMoves:
    DRIVE_ROADS_AND_BOATS_RULESET.transporters.Donkey.baseMovementPoints,
} as const;

export const FLEET_LIMIT_RULES: FleetLimitRules = {
  maxTotalTransporters: DRIVE_ROADS_AND_BOATS_RULESET.fleetLimits.maxTotalTransporters, // 8
  maxLandTransporters: DRIVE_ROADS_AND_BOATS_RULESET.fleetLimits.maxLandTransporters,   // 5
  maxWaterTransporters: DRIVE_ROADS_AND_BOATS_RULESET.fleetLimits.maxWaterTransporters, // 5
} as const;

// ============================================================================
// 2. TRANSPORTER SPECIFICATIONS & MOVEMENT RULES
// ============================================================================
export interface TransporterRuleSpec {
  readonly id: TransporterType;
  readonly driveType: 'Donkey' | 'Wagon' | 'Truck' | 'Raft' | 'Rowboat' | 'Steamer';
  readonly name: string;
  readonly category: 'land' | 'water';
  readonly capacity: number;
  readonly baseSpeed: number;
  readonly roadSpeed: number;
  readonly waterOnly: boolean;
  readonly roadOnly: boolean;
  readonly requiresFuel: boolean;
  readonly consumedTransporter?: TransporterType;
  readonly canCrossRiversWithoutBridge: boolean;
  readonly canEnterDeepWater: boolean;
  readonly canMoveOverlandWithoutRiver: boolean;
  readonly cost: Readonly<Partial<Record<GoodType, number>>>;
  readonly buildCost: Readonly<Partial<Record<GoodType, number>>>;
  readonly requiredTech?: string;
  readonly icon: string;
  readonly description: string;
}

export const TRANSPORTER_RULES: Record<TransporterType, TransporterRuleSpec> = {
  donkey: {
    id: 'donkey',
    driveType: 'Donkey',
    name: 'Donkey',
    category: 'land',
    capacity: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Donkey.cargoCapacity, // 2
    baseSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Donkey.baseMovementPoints, // 1
    roadSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Donkey.roadMovementPoints ?? 2, // 2
    waterOnly: false,
    roadOnly: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Donkey.requiresRoad,
    requiresFuel: false,
    canCrossRiversWithoutBridge: false,
    canEnterDeepWater: false,
    canMoveOverlandWithoutRiver: true,
    buildCost: {},
    cost: {},
    icon: '🫏',
    description:
      'Living pack animal. Carries 2 goods. Moves 1 space off-road or 2 on roads. Cannot cross unbridged rivers. Bred on pasture.',
  },
  wagon: {
    id: 'wagon',
    driveType: 'Wagon',
    name: 'Wagon',
    category: 'land',
    capacity: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Wagon.cargoCapacity, // 3
    baseSpeed: 0,
    roadSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Wagon.baseMovementPoints, // 3
    waterOnly: false,
    roadOnly: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Wagon.requiresRoad, // true
    requiresFuel: false,
    consumedTransporter: 'donkey',
    canCrossRiversWithoutBridge: false,
    canEnterDeepWater: false,
    canMoveOverlandWithoutRiver: false,
    buildCost: { boards: 2 },
    cost: { boards: 2, stone: 1 },
    icon: '🛒',
    description:
      'Heavy wheeled overland hauler. Carries 3 goods. Moves 3 hexes strictly along paved roads or bridges. Consumes 1 Donkey + 2 Boards at Wagon Factory.',
  },
  truck: {
    id: 'truck',
    driveType: 'Truck',
    name: 'Steam Truck',
    category: 'land',
    capacity: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Truck.cargoCapacity, // 6
    baseSpeed: 0,
    roadSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Truck.baseMovementPoints, // 4
    waterOnly: false,
    roadOnly: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Truck.requiresRoad, // true
    requiresFuel: true,
    canCrossRiversWithoutBridge: false,
    canEnterDeepWater: false,
    canMoveOverlandWithoutRiver: false,
    buildCost: { fuel: 1, iron: 1 },
    cost: { boards: 2, stone: 2 },
    requiredTech: 'truck_factory',
    icon: '🚚',
    description:
      'Industrial powerhouse hauler. Carries 6 goods. Travels 4 hexes strictly along roads. Requires Trucking research.',
  },
  raft: {
    id: 'raft',
    driveType: 'Raft',
    name: 'Raft',
    category: 'water',
    capacity: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Raft.cargoCapacity, // 3 (Drive rules)
    baseSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Raft.baseMovementPoints, // 3 (Drive rules)
    roadSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Raft.baseMovementPoints, // 3
    waterOnly: true,
    roadOnly: false,
    requiresFuel: false,
    canCrossRiversWithoutBridge: true,
    canEnterDeepWater: true,
    canMoveOverlandWithoutRiver: false,
    buildCost: { wood: 2 },
    cost: { boards: 1, stone: 1 },
    icon: '🪵',
    description:
      'River & coastal craft. Carries 3 goods and navigates waterways and coastal waters at speed 3 (3rd Edition Base Game).',
  },
  rowboat: {
    id: 'rowboat',
    driveType: 'Rowboat',
    name: 'Rowboat',
    category: 'water',
    capacity: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Rowboat.cargoCapacity, // 5 (Drive rules)
    baseSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Rowboat.baseMovementPoints, // 4 (Drive rules)
    roadSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Rowboat.baseMovementPoints, // 4
    waterOnly: true,
    roadOnly: false,
    requiresFuel: false,
    canCrossRiversWithoutBridge: true,
    canEnterDeepWater: true,
    canMoveOverlandWithoutRiver: false,
    buildCost: { boards: 5 },
    cost: { boards: 2, stone: 1 },
    requiredTech: 'rowboat_factory',
    icon: '🚣',
    description:
      'Versatile water transport. Carries 5 goods and navigates waterways and sea at speed 4. Requires Rowing research.',
  },
  steamship: {
    id: 'steamship',
    driveType: 'Steamer',
    name: 'Steamer',
    category: 'water',
    capacity: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Steamer.cargoCapacity, // 8 (Drive rules)
    baseSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Steamer.baseMovementPoints, // 6 (Drive rules)
    roadSpeed: DRIVE_ROADS_AND_BOATS_RULESET.transporters.Steamer.baseMovementPoints, // 6
    waterOnly: true,
    roadOnly: false,
    requiresFuel: true,
    canCrossRiversWithoutBridge: true,
    canEnterDeepWater: true,
    canMoveOverlandWithoutRiver: false,
    buildCost: { fuel: 2, iron: 1 },
    cost: { boards: 2, stone: 2 },
    requiredTech: 'steamer_factory',
    icon: '🚢',
    description:
      'Fast maritime hauler. Carries 8 goods and moves 6 on rivers and open sea. Requires Shipping research.',
  },
} as const;

// ============================================================================
// 3. INFRASTRUCTURE & CONSTRUCTION RULES
// ============================================================================
export interface InfrastructureRules {
  readonly road: {
    readonly materialCost: number;
    readonly allowedMaterials: ReadonlyArray<'stone'>;
    readonly disallowOnOpenDeepSea: boolean;
  };
  readonly bridge: {
    readonly materialCost: number;
    readonly allowedMaterials: ReadonlyArray<'boards'>;
    readonly requiresRiverBorder: boolean;
  };
  readonly wall: {
    readonly materialCost: number;
    readonly allowedMaterials: ReadonlyArray<'stone'>;
  };
}

export const INFRASTRUCTURE_RULES: InfrastructureRules = {
  road: {
    materialCost: 1, // Official rule: 1 Stone only (cannot use Boards)
    allowedMaterials: ['stone'],
    disallowOnOpenDeepSea: true,
  },
  bridge: {
    materialCost: 2, // Official rule: 2 Boards across a river border (cannot use Stone)
    allowedMaterials: ['boards'],
    requiresRiverBorder: true,
  },
  wall: {
    materialCost: 2,
    allowedMaterials: ['stone'],
  },
} as const;

// ============================================================================
// 4. ANIMAL REPRODUCTION RULES
// ============================================================================
export interface DonkeyBreedingRule {
  readonly terrain: TerrainType;
  readonly exactDonkeyCount: number;
  readonly disallowBuildingsOnHex: boolean;
  readonly disallowCargoOnDonkeys: boolean;
  readonly disallowLooseGoodsOnHex: boolean;
  readonly requireSameOwner: boolean;
  readonly newbornDonkeyCount: number;
}

export interface GooseBreedingRule {
  readonly terrain: TerrainType;
  readonly exactGeeseCount: number;
  readonly disallowBuildingsOnHex: boolean;
  readonly disallowTransportersOnHex: boolean;
  readonly disallowOtherGoodsOnHex: boolean;
  readonly newbornGeeseCount: number;
}

export const BREEDING_RULES = {
  donkey: {
    terrain: 'pasture',
    exactDonkeyCount: 2,
    disallowBuildingsOnHex: true,
    disallowCargoOnDonkeys: true,
    disallowLooseGoodsOnHex: true,
    requireSameOwner: true,
    newbornDonkeyCount: 1,
  } as DonkeyBreedingRule,
  goose: {
    terrain: 'pasture',
    exactGeeseCount: 2,
    disallowBuildingsOnHex: true,
    disallowTransportersOnHex: true,
    disallowOtherGoodsOnHex: true,
    newbornGeeseCount: 1,
  } as GooseBreedingRule,
} as const;

// ============================================================================
// 5. RESEARCH & TECHNOLOGIES SPECIFICATIONS (3rd Edition Base Game)
// ============================================================================
export interface ResearchCostSpec {
  readonly goose: number;
  readonly paper: number;
}

export interface ResearchTechRuleSpec {
  readonly id: string;
  readonly driveId:
    | 'Rowing'
    | 'Trucking'
    | 'Shipping'
    | 'Drilling'
    | 'Specialisation'
    | 'Enlargement'
    | 'NewShafts';
  readonly name: string;
  readonly requiredGeese: number;
  readonly requiredPaper: number;
  readonly unlocksBuilding?: BuildingType;
  readonly freeUpgradeFromBuildings?: ReadonlyArray<BuildingType>;
  readonly icon: string;
  readonly description: string;
  readonly benefit: string;
}

export const RESEARCH_RULES = {
  standardCost: {
    goose: 2, // 2 Geese
    paper: 1, // 1 Paper
  } as ResearchCostSpec,
  technologies: {
    rowboat_factory: {
      id: 'rowboat_factory',
      driveId: 'Rowing',
      name: 'Rowing (Rowboat Factory)',
      requiredGeese: 2,
      requiredPaper: 1,
      unlocksBuilding: 'shipyard',
      freeUpgradeFromBuildings: ['raftfactory'],
      icon: '🚣',
      description:
        'Unlocks Rowboat Factory (costs 2 Boards + 1 Stone on Shore; builds 5-capacity, 4-speed Rowboats from 5 Boards) and grants free upgrade from Raft Factory.',
      benefit: 'Unlocks Rowboat Factory + Free Upgrade from Raft Factory',
    },
    truck_factory: {
      id: 'truck_factory',
      driveId: 'Trucking',
      name: 'Trucking (Steam Truck Factory)',
      requiredGeese: 2,
      requiredPaper: 1,
      unlocksBuilding: 'truckfactory',
      freeUpgradeFromBuildings: ['wagonfactory'],
      icon: '🚚',
      description:
        'Unlocks Truck Factory (costs 2 Boards + 2 Stone; builds 6-capacity, 4-speed Trucks from 1 Iron + 1 Fuel) and grants free upgrade from Wagon Factory.',
      benefit: 'Unlocks Truck Factory + Free Upgrade from Wagon Factory',
    },
    steamer_factory: {
      id: 'steamer_factory',
      driveId: 'Shipping',
      name: 'Shipping (Steamer Factory)',
      requiredGeese: 2,
      requiredPaper: 1,
      unlocksBuilding: 'steamerfactory',
      freeUpgradeFromBuildings: ['raftfactory', 'shipyard'],
      icon: '🚢',
      description:
        'Unlocks Steamer Factory (costs 2 Boards + 2 Stone on Shore; builds 8-capacity, 6-speed Steamers from 1 Iron + 2 Fuel) and grants free upgrade from Raft/Rowboat Factory.',
      benefit: 'Unlocks Steamer Factory + Free Upgrade from Raft/Rowboat Factory',
    },
    oil_rig: {
      id: 'oil_rig',
      driveId: 'Drilling',
      name: 'Drilling (Off-Shore Oil Rig)',
      requiredGeese: 2,
      requiredPaper: 1,
      unlocksBuilding: 'oilrig',
      icon: '🛢️',
      description:
        'Unlocks Off-Shore Oil Rig on Sea tiles (costs 3 Boards + 1 Stone; extracts 1 Fuel per turn).',
      benefit: 'Unlocks Sea Oil Rig Platforms (+1 Fuel/turn)',
    },
    specialized_mines: {
      id: 'specialized_mines',
      driveId: 'Specialisation',
      name: 'Specialisation (Specialized Mines)',
      requiredGeese: 2,
      requiredPaper: 1,
      icon: '💎',
      description:
        'Allows Mines to specialize their ore pool to 4 Gold (0 Iron) or 4 Iron (0 Gold). Cannot combine on the same mine with Enlargement.',
      benefit: 'Mines specialize in 4 Gold or 4 Iron',
    },
    large_mines: {
      id: 'large_mines',
      driveId: 'Enlargement',
      name: 'Enlargement (Enlarged Mines)',
      requiredGeese: 2,
      requiredPaper: 1,
      icon: '⛏️',
      description:
        'Expands Mountain Mine ore pools to 5 Gold + 5 Iron (10 counters total). Cannot combine on the same mine with Specialisation.',
      benefit: 'Expands Mine Ore Pool to 5 Gold + 5 Iron',
    },
    extra_shafts: {
      id: 'extra_shafts',
      driveId: 'NewShafts',
      name: 'New Shafts (Mine Replenishment)',
      requiredGeese: 2,
      requiredPaper: 1,
      icon: '🪜',
      description:
        'Unlocks New Mine Shafts infrastructure to replenish depleted Mountain Mines with a fresh ore pool.',
      benefit: 'Replenishes Depleted Mountain Mines',
    },
  } as Record<string, ResearchTechRuleSpec>,
} as const;

// ============================================================================
// 6. FACTORIES & PRODUCTION SPECIFICATIONS (3rd Edition Base Game)
// ============================================================================
export interface BuildingRuleSpec {
  readonly name: string;
  readonly driveId?:
    | 'Woodcutter'
    | 'Quarry'
    | 'ClayPit'
    | 'Mine'
    | 'OilRig'
    | 'Sawmill'
    | 'StoneFactory'
    | 'CoalBurner'
    | 'Papermill'
    | 'Mint'
    | 'StockExchange'
    | 'WagonFactory'
    | 'TruckFactory'
    | 'RaftFactory'
    | 'RowboatFactory'
    | 'SteamerFactory';
  readonly category: 'primary' | 'secondary' | 'transporter' | 'wonder';
  readonly cost: Readonly<Partial<Record<GoodType, number>>>;
  readonly allowedTerrain?: ReadonlyArray<TerrainType>;
  readonly requiresAdjacentWater?: boolean;
  readonly requiredTech?: string;
  readonly maxBatchesPerTurn: number;
  readonly consumedTransporter?: TransporterType;
  readonly anyOfInputs?: {
    readonly allowed: ReadonlyArray<GoodType>;
    readonly totalAmount: number;
    readonly priorityOrder: ReadonlyArray<GoodType>;
  };
  readonly production: {
    readonly inputs: Readonly<Partial<Record<GoodType, number>>>;
    readonly outputs: Readonly<Partial<Record<GoodType, number>>>;
    readonly description: string;
  };
  readonly icon: string;
  readonly description: string;
}

const ANY_NON_DESERT_LAND: ReadonlyArray<TerrainType> = [
  'pasture',
  'forest',
  'rock',
  'mountain',
];

export const BUILDING_RULES: Record<BuildingType, BuildingRuleSpec> = {
  woodcutter: {
    name: 'Woodcutter',
    driveId: 'Woodcutter',
    category: 'primary',
    cost: { boards: 1 },
    allowedTerrain: ['forest'],
    maxBatchesPerTurn: 1,
    production: {
      inputs: {},
      outputs: { wood: 1 },
      description: 'Produces 1 Trunk / Wood per turn on Woods (Forest) terrain (max 1 batch/turn).',
    },
    icon: '🪓',
    description: 'Fells trees in the woods to produce 1 raw Trunk (Wood) each production phase.',
  },
  quarry: {
    name: 'Quarry',
    driveId: 'Quarry',
    category: 'primary',
    cost: { boards: 2 },
    allowedTerrain: ['rock'],
    maxBatchesPerTurn: 1,
    production: {
      inputs: {},
      outputs: { stone: 1 },
      description: 'Extracts 1 Stone block per turn from Rock terrain only (max 1 batch/turn).',
    },
    icon: '⛏️',
    description: 'Chisels building Stone strictly out of Rock plateaus (1 Stone/turn).',
  },
  claypit: {
    name: 'Clay Pit',
    driveId: 'ClayPit',
    category: 'primary',
    cost: { boards: 3 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    requiresAdjacentWater: true, // Shore
    maxBatchesPerTurn: 1,
    production: {
      inputs: {},
      outputs: { clay: 1 },
      description: 'Excavates 1 raw Clay per turn on any Shore tile (adjacent to River or Sea).',
    },
    icon: '🏺',
    description: 'Extracts 1 Clay per turn from any Shore hex (land with River or adjacent to Sea).',
  },
  mine: {
    name: 'Mine',
    driveId: 'Mine',
    category: 'primary',
    cost: { boards: 3, stone: 1 },
    allowedTerrain: ['mountain'],
    maxBatchesPerTurn: 1,
    production: {
      inputs: {},
      outputs: { gold: 1, iron: 1 },
      description:
        'Draws from internal ore pool (Default: 3 Gold + 3 Iron; Specialised: 4 Gold or 4 Iron; Enlarged: 5 Gold + 5 Iron).',
    },
    icon: '💎',
    description:
      'Mountain mine with finite ore pool (3 Gold + 3 Iron default; upgradable via Specialisation, Enlargement, and New Shafts).',
  },
  oilrig: {
    name: 'Oil Rig',
    driveId: 'OilRig',
    category: 'primary',
    cost: { boards: 3, stone: 1 },
    allowedTerrain: ['water'], // Sea
    requiredTech: 'oil_rig',
    maxBatchesPerTurn: 1,
    production: {
      inputs: {},
      outputs: { fuel: 1 },
      description: 'Extracts 1 Fuel per turn directly on Sea tiles. Requires Drilling research.',
    },
    icon: '🛢️',
    description: 'Off-shore drilling platform built on Sea tiles; produces 1 Fuel each turn.',
  },
  sawmill: {
    name: 'Sawmill',
    driveId: 'Sawmill',
    category: 'secondary',
    cost: { boards: 2, stone: 1 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    maxBatchesPerTurn: 3,
    production: {
      inputs: { wood: 1 },
      outputs: { boards: 2 },
      description: 'Converts 1 Trunk (Wood) into 2 Boards (up to 3 batches / 6 Boards per turn).',
    },
    icon: '🪵',
    description: 'Milling facility on any non-desert land; converts up to 3 Trunks into 6 Boards per turn.',
  },
  brickworks: {
    name: 'Stone Factory',
    driveId: 'StoneFactory',
    category: 'secondary',
    cost: { boards: 2 }, // Superseded by Drive ruleset: StoneFactory costs 2 Boards
    allowedTerrain: ANY_NON_DESERT_LAND,
    maxBatchesPerTurn: 3,
    production: {
      inputs: { clay: 1 },
      outputs: { stone: 2 },
      description: 'Fires 1 Clay into 2 Stone (up to 3 batches / 6 Stone per turn). Costs 2 Boards to build.',
    },
    icon: '🧱',
    description: '3rd Edition Stone Factory: costs 2 Boards on any non-desert land and fires 1 Clay into 2 Stone (max 3 batches/turn).',
  },
  burner: {
    name: 'Coal Burner',
    driveId: 'CoalBurner',
    category: 'secondary',
    cost: { boards: 3 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    maxBatchesPerTurn: 6,
    anyOfInputs: {
      allowed: ['boards', 'wood'],
      totalAmount: 2,
      priorityOrder: ['boards', 'wood'],
    },
    production: {
      inputs: { wood: 2 },
      outputs: { fuel: 1 },
      description: 'Converts any 2 Trunks (Wood) and/or Boards into 1 Fuel (up to 6 batches per turn).',
    },
    icon: '🔥',
    description: 'Smolders any combination of 2 Trunks and/or Boards into 1 Fuel (max 6 batches/turn).',
  },
  papermill: {
    name: 'Papermill',
    driveId: 'Papermill',
    category: 'secondary',
    cost: { boards: 1, stone: 1 },
    allowedTerrain: ANY_NON_DESERT_LAND, // Superseded by Drive ruleset: AnyNonDesertLand (no water adjacency required)
    maxBatchesPerTurn: 1,
    anyOfInputs: {
      allowed: ['boards', 'wood'],
      totalAmount: 2,
      priorityOrder: ['boards', 'wood'],
    },
    production: {
      inputs: { wood: 2 },
      outputs: { paper: 1 },
      description: 'Pulps any 2 Trunks (Wood) and/or Boards into 1 Paper on any non-desert land (max 1 batch/turn).',
    },
    icon: '📜',
    description: 'Converts any 2 Trunks and/or Boards into 1 Paper on any non-desert land.',
  },
  mint: {
    name: 'Mint',
    driveId: 'Mint',
    category: 'secondary',
    cost: { boards: 2, stone: 1 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    maxBatchesPerTurn: 1,
    production: {
      inputs: { gold: 2, fuel: 1 },
      outputs: { coin: 1 },
      description: 'Strikes 2 Gold + 1 Fuel into 1 Coin worth 40 VP (max 1 batch/turn).',
    },
    icon: '🪙',
    description: 'Stamps 2 Gold + 1 Fuel into 1 gleaming 40 VP Coin per turn.',
  },
  stockexchange: {
    name: 'Stock Exchange',
    driveId: 'StockExchange',
    category: 'secondary',
    cost: { stone: 3 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    maxBatchesPerTurn: 6,
    production: {
      inputs: { coin: 2, paper: 1 },
      outputs: { stock: 1 },
      description: 'Combines 2 Coins + 1 Paper into 1 Stock Bond worth 120 VP (up to 6 batches per turn).',
    },
    icon: '📈',
    description: 'Financial headquarters issuing 120 VP Stock Bonds from 2 Coins + 1 Paper (max 6 batches/turn).',
  },
  wagonfactory: {
    name: 'Wagon Factory',
    driveId: 'WagonFactory',
    category: 'transporter',
    cost: { boards: 2, stone: 1 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    maxBatchesPerTurn: 1,
    consumedTransporter: 'donkey',
    production: {
      inputs: { boards: 2 },
      outputs: {},
      description: 'Constructs 1 Wagon (cap 3, road spd 3) from 2 Boards + 1 Donkey on the hex.',
    },
    icon: '🛠️',
    description: 'Assembles 1 Wagon per turn from 2 Boards + 1 Donkey on any non-desert land.',
  },
  raftfactory: {
    name: 'Raft Factory',
    driveId: 'RaftFactory',
    category: 'transporter',
    cost: { boards: 1, stone: 1 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    requiresAdjacentWater: true, // Shore
    maxBatchesPerTurn: 1,
    production: {
      inputs: { wood: 2 },
      outputs: {},
      description: 'Builds 1 Raft (cap 3, water spd 3) from 2 Trunks (Wood) on a Shore hex.',
    },
    icon: '🛶',
    description: 'Shore workshop crafting 3-capacity, 3-speed Rafts from 2 Trunks (Wood).',
  },
  shipyard: {
    name: 'Rowboat Factory',
    driveId: 'RowboatFactory',
    category: 'transporter',
    cost: { boards: 2, stone: 1 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    requiresAdjacentWater: true, // Shore
    requiredTech: 'rowboat_factory',
    maxBatchesPerTurn: 1,
    production: {
      inputs: { boards: 5 },
      outputs: {},
      description: 'Builds 1 Rowboat (cap 5, water spd 4) from 5 Boards on a Shore hex. Requires Rowing research.',
    },
    icon: '🚣',
    description: 'Shore drydock crafting 5-capacity, 4-speed Rowboats from 5 Boards.',
  },
  truckfactory: {
    name: 'Truck Factory',
    driveId: 'TruckFactory',
    category: 'transporter',
    cost: { boards: 2, stone: 2 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    requiredTech: 'truck_factory',
    maxBatchesPerTurn: 1,
    production: {
      inputs: { iron: 1, fuel: 1 },
      outputs: {},
      description: 'Constructs 1 Truck (cap 6, road spd 4) from 1 Iron + 1 Fuel. Requires Trucking research.',
    },
    icon: '🚚',
    description: 'Industrial plant manufacturing 6-capacity, 4-speed Trucks from 1 Iron + 1 Fuel.',
  },
  steamerfactory: {
    name: 'Steamer Factory',
    driveId: 'SteamerFactory',
    category: 'transporter',
    cost: { boards: 2, stone: 2 },
    allowedTerrain: ANY_NON_DESERT_LAND,
    requiresAdjacentWater: true, // Shore
    requiredTech: 'steamer_factory',
    maxBatchesPerTurn: 1,
    production: {
      inputs: { iron: 1, fuel: 2 },
      outputs: {},
      description: 'Constructs 1 Steamer (cap 8, water spd 6) from 1 Iron + 2 Fuel on a Shore hex. Requires Shipping research.',
    },
    icon: '🚢',
    description: 'Maritime shipyard building 8-capacity, 6-speed Steamers from 1 Iron + 2 Fuel.',
  },
  wonder: {
    name: 'Wonder of the World',
    category: 'wonder',
    cost: {},
    maxBatchesPerTurn: 1,
    production: {
      inputs: { stone: 1 },
      outputs: {},
      description: 'Spend goods at your home tile to place bricks (10 VP per row; cost increases after brick 17; Desert irrigates at brick 45).',
    },
    icon: '🏛️',
    description: 'The monumental 13-row stepped pyramid that marks the pinnacle of civilization.',
  },
} as const;

// ============================================================================
// 7. WONDER PYRAMID & VICTORY SCORING RULES (3rd Edition Base Game)
// ============================================================================
export interface WonderTierRuleSpec {
  readonly tierIndex: number;
  readonly name: string;
  readonly pointsPerBrick: number;
  readonly totalSlots: number;
  readonly rowCapacities: ReadonlyArray<number>;
}

export const WONDER_TIER_RULES: ReadonlyArray<WonderTierRuleSpec> = [
  { tierIndex: 0, name: 'Foundation (Rows 1–4)', pointsPerBrick: 10, totalSlots: 16, rowCapacities: [4, 4, 4, 4] },
  { tierIndex: 1, name: 'Lower Terrace (Rows 5–8)', pointsPerBrick: 10, totalSlots: 20, rowCapacities: [5, 5, 5, 5] },
  { tierIndex: 2, name: 'Upper Colonnade (Rows 9–11)', pointsPerBrick: 10, totalSlots: 18, rowCapacities: [6, 6, 6] },
  { tierIndex: 3, name: 'Apex Sanctuary (Rows 12–13)', pointsPerBrick: 10, totalSlots: 10, rowCapacities: [7, 3] },
] as const;

/**
 * 3rd Edition Base Game Wealth Victory Points (`scoringGoodsVP` from Drive ruleset):
 * - StockBond (`stock`): 120 VP
 * - Coin (`coin`): 40 VP
 * - Gold (`gold`): 10 VP
 * - All raw & intermediate goods: 0 VP
 */
export const GOOD_VICTORY_POINTS: Record<GoodType, number> = {
  stock: DRIVE_ROADS_AND_BOATS_RULESET.scoringGoodsVP.StockBond ?? 120, // 120 VP
  coin: DRIVE_ROADS_AND_BOATS_RULESET.scoringGoodsVP.Coin ?? 40,        // 40 VP
  gold: DRIVE_ROADS_AND_BOATS_RULESET.scoringGoodsVP.Gold ?? 10,        // 10 VP
  goose: 0,
  iron: 0,
  paper: 0,
  wood: 0,
  clay: 0,
  stone: 0,
  boards: 0,
  bricks: 0,
  fuel: 0,
} as const;

// ============================================================================
// 8. AUTHORITATIVE MASTER RULES ENGINE OBJECT
// ============================================================================
export const ROADS_AND_BOATS_RULES = {
  version: '3.0.0-drive-3rd-edition',
  edition: DRIVE_ROADS_AND_BOATS_RULESET.edition,
  turnPhases: DRIVE_ROADS_AND_BOATS_RULESET.turnPhases,
  driveRuleset: DRIVE_ROADS_AND_BOATS_RULESET,
  setup: SETUP_RULES,
  fleetLimits: FLEET_LIMIT_RULES,
  transporters: TRANSPORTER_RULES,
  infrastructure: INFRASTRUCTURE_RULES,
  breeding: BREEDING_RULES,
  research: RESEARCH_RULES,
  buildings: BUILDING_RULES,
  wonderTiers: WONDER_TIER_RULES,
  wonderRules: DRIVE_ROADS_AND_BOATS_RULESET.wonder,
  scoring: GOOD_VICTORY_POINTS,
  waterMovement: {
    allowDumpingCargoAtSea: false,
    allowRoadsInOpenSea: false,
  },
} as const;

export type RoadsAndBoatsRulesType = typeof ROADS_AND_BOATS_RULES;
