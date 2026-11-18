/**
 * AUTHORITATIVE GOOGLE DRIVE RULESET (3rd Edition Base Game)
 * Imported directly from `game_files/roads&boats/Roadsandboats.type.ts`
 * and `game_files/roads&boats/Roadsandboats.base.json`.
 *
 * This module supersedes all previous ad-hoc rule definitions.
 */

export type DriveTerrainType =
  | 'Pasture'
  | 'Woods'
  | 'Rock'
  | 'Mountain'
  | 'Desert'
  | 'Sea';

export type DriveGoodType =
  | 'Trunk'
  | 'Board'
  | 'Stone'
  | 'Clay'
  | 'Gold'
  | 'Iron'
  | 'Fuel'
  | 'Paper'
  | 'Coin'
  | 'StockBond'
  | 'Goose';

export type DriveTransporterType =
  | 'Donkey'
  | 'Wagon'
  | 'Truck'
  | 'Raft'
  | 'Rowboat'
  | 'Steamer';

export type TransporterDomain = 'Land' | 'Water';

export type ResearchId =
  | 'Rowing'
  | 'Trucking'
  | 'Shipping'
  | 'Drilling'
  | 'Specialisation'
  | 'Enlargement'
  | 'NewShafts';

export type BuildingId =
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

export type InfrastructureId =
  | 'Road'
  | 'Bridge'
  | 'NewMineShaft'
  | 'Wall'
  | 'DemolishWall';

export type BuildTerrainRequirement =
  | { kind: 'ExactTerrain'; terrains: DriveTerrainType[] }
  | { kind: 'Shore' } // Land tile with a River or adjacent to Sea
  | { kind: 'AnyNonDesertLand' };

export interface GoodQuantity {
  good: DriveGoodType;
  amount: number;
}

export interface RecipeInput {
  /** Exact required items */
  fixedGoods?: GoodQuantity[];
  /** Flexible pool (e.g., 2 Trunks and/or Boards for Coal Burner / Papermill) */
  anyOfGoods?: {
    allowed: DriveGoodType[];
    totalAmount: number;
    unattendedPriorityOrder?: DriveGoodType[];
  };
  /** Consumed transporter (e.g., 1 Donkey for Wagon Factory) */
  consumedTransporter?: DriveTransporterType;
}

export interface RecipeOutput {
  good?: GoodQuantity;
  transporter?: DriveTransporterType;
  /** Used by Mine: draws 1 random counter from internal bag */
  mineDrawPool?: {
    defaultPool: GoodQuantity[];
    specialisedOptions?: GoodQuantity[][];
    enlargedPool?: GoodQuantity[];
  };
}

export interface BuildingDefinition {
  id: BuildingId;
  category: 'PrimaryProducer' | 'SecondaryProducer' | 'TransporterFactory';
  buildCost: GoodQuantity[];
  terrainRequirement: BuildTerrainRequirement;
  requiredResearch?: ResearchId;
  input?: RecipeInput;
  output: RecipeOutput;
  maxBatchesPerTurn: number;
}

export interface TransporterDefinition {
  type: DriveTransporterType;
  domain: TransporterDomain;
  cargoCapacity: number;
  baseMovementPoints: number;
  roadMovementPoints?: number;
  requiresRoad: boolean;
  requiredResearch?: ResearchId;
}

export interface ResearchDefinition {
  id: ResearchId;
  cost: GoodQuantity[];
  prerequisites: ResearchId[]; // Always empty in Base Game
  unlocksBuilding?: BuildingId;
  unlocksInfrastructure?: InfrastructureId;
  freeUpgradeFromBuildings?: BuildingId[];
  minePoolOverride?: {
    cannotCombineOnSameMineWith?: ResearchId;
    pools: GoodQuantity[][];
  };
}

export interface WonderRowSpec {
  rowNumber: number; // 1-indexed from bottom
  capacity: number;
  pointsPerRow: number; // 10 VP split among non-neutral bricks
}

export interface WonderRules {
  baseCostIncreaseAfterBrickIndex: number; // 17 (18th brick starts at +1 good)
  irrigationTriggerBrickIndex: number; // 45th brick converts Desert -> Pasture
  maxNeutralBricksTurnLimit: number; // 33 turns
  endGameBrickIndexByPlayerCount: Record<1 | 2 | 3 | 4, number | null>;
  soloPrebuiltRows: number; // 4 rows pre-filled with neutral bricks in solo
  rows: WonderRowSpec[];
}

export interface RoadsAndBoatsRuleset {
  edition: '3rd Edition (Base Game)';
  turnPhases: ('Production' | 'Movement' | 'Building' | 'Wonder')[];
  startingInventory: {
    homeMarkers: number;
    transporters: { type: DriveTransporterType; count: number }[];
    goods: GoodQuantity[];
  };
  fleetLimits: {
    maxTotalTransporters: number;
    maxLandTransporters: number;
    maxWaterTransporters: number;
  };
  scoringGoodsVP: Partial<Record<DriveGoodType, number>>;
  transporters: Record<DriveTransporterType, TransporterDefinition>;
  buildings: Record<BuildingId, BuildingDefinition>;
  research: Record<ResearchId, ResearchDefinition>;
  wonder: WonderRules;
}

export const DRIVE_ROADS_AND_BOATS_RULESET: RoadsAndBoatsRuleset = {
  edition: '3rd Edition (Base Game)',
  turnPhases: ['Production', 'Movement', 'Building', 'Wonder'],
  startingInventory: {
    homeMarkers: 1,
    transporters: [{ type: 'Donkey', count: 3 }],
    goods: [
      { good: 'Board', amount: 5 },
      { good: 'Stone', amount: 1 },
      { good: 'Goose', amount: 2 },
    ],
  },
  fleetLimits: {
    maxTotalTransporters: 8,
    maxLandTransporters: 5,
    maxWaterTransporters: 5,
  },
  scoringGoodsVP: {
    Gold: 10,
    Coin: 40,
    StockBond: 120,
  },
  transporters: {
    Donkey: {
      type: 'Donkey',
      domain: 'Land',
      cargoCapacity: 2,
      baseMovementPoints: 1,
      roadMovementPoints: 2,
      requiresRoad: false,
    },
    Wagon: {
      type: 'Wagon',
      domain: 'Land',
      cargoCapacity: 3,
      baseMovementPoints: 3,
      requiresRoad: true,
    },
    Truck: {
      type: 'Truck',
      domain: 'Land',
      cargoCapacity: 6,
      baseMovementPoints: 4,
      requiresRoad: true,
      requiredResearch: 'Trucking',
    },
    Raft: {
      type: 'Raft',
      domain: 'Water',
      cargoCapacity: 3,
      baseMovementPoints: 3,
      requiresRoad: false,
    },
    Rowboat: {
      type: 'Rowboat',
      domain: 'Water',
      cargoCapacity: 5,
      baseMovementPoints: 4,
      requiresRoad: false,
      requiredResearch: 'Rowing',
    },
    Steamer: {
      type: 'Steamer',
      domain: 'Water',
      cargoCapacity: 8,
      baseMovementPoints: 6,
      requiresRoad: false,
      requiredResearch: 'Shipping',
    },
  },
  buildings: {
    Woodcutter: {
      id: 'Woodcutter',
      category: 'PrimaryProducer',
      buildCost: [{ good: 'Board', amount: 1 }],
      terrainRequirement: { kind: 'ExactTerrain', terrains: ['Woods'] },
      output: { good: { good: 'Trunk', amount: 1 } },
      maxBatchesPerTurn: 1,
    },
    Quarry: {
      id: 'Quarry',
      category: 'PrimaryProducer',
      buildCost: [{ good: 'Board', amount: 2 }],
      terrainRequirement: { kind: 'ExactTerrain', terrains: ['Rock'] },
      output: { good: { good: 'Stone', amount: 1 } },
      maxBatchesPerTurn: 1,
    },
    ClayPit: {
      id: 'ClayPit',
      category: 'PrimaryProducer',
      buildCost: [{ good: 'Board', amount: 3 }],
      terrainRequirement: { kind: 'Shore' },
      output: { good: { good: 'Clay', amount: 1 } },
      maxBatchesPerTurn: 1,
    },
    Mine: {
      id: 'Mine',
      category: 'PrimaryProducer',
      buildCost: [
        { good: 'Board', amount: 3 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'ExactTerrain', terrains: ['Mountain'] },
      output: {
        mineDrawPool: {
          defaultPool: [
            { good: 'Gold', amount: 3 },
            { good: 'Iron', amount: 3 },
          ],
          specialisedOptions: [
            [
              { good: 'Gold', amount: 4 },
              { good: 'Iron', amount: 0 },
            ],
            [
              { good: 'Gold', amount: 0 },
              { good: 'Iron', amount: 4 },
            ],
          ],
          enlargedPool: [
            { good: 'Gold', amount: 5 },
            { good: 'Iron', amount: 5 },
          ],
        },
      },
      maxBatchesPerTurn: 1,
    },
    OilRig: {
      id: 'OilRig',
      category: 'PrimaryProducer',
      buildCost: [
        { good: 'Board', amount: 3 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'ExactTerrain', terrains: ['Sea'] },
      requiredResearch: 'Drilling',
      output: { good: { good: 'Fuel', amount: 1 } },
      maxBatchesPerTurn: 1,
    },
    Sawmill: {
      id: 'Sawmill',
      category: 'SecondaryProducer',
      buildCost: [
        { good: 'Board', amount: 2 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      input: {
        fixedGoods: [{ good: 'Trunk', amount: 1 }],
      },
      output: { good: { good: 'Board', amount: 2 } },
      maxBatchesPerTurn: 3,
    },
    StoneFactory: {
      id: 'StoneFactory',
      category: 'SecondaryProducer',
      buildCost: [{ good: 'Board', amount: 2 }],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      input: {
        fixedGoods: [{ good: 'Clay', amount: 1 }],
      },
      output: { good: { good: 'Stone', amount: 2 } },
      maxBatchesPerTurn: 3,
    },
    CoalBurner: {
      id: 'CoalBurner',
      category: 'SecondaryProducer',
      buildCost: [{ good: 'Board', amount: 3 }],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      input: {
        anyOfGoods: {
          allowed: ['Trunk', 'Board'],
          totalAmount: 2,
          unattendedPriorityOrder: ['Board', 'Trunk'],
        },
      },
      output: { good: { good: 'Fuel', amount: 1 } },
      maxBatchesPerTurn: 6,
    },
    Papermill: {
      id: 'Papermill',
      category: 'SecondaryProducer',
      buildCost: [
        { good: 'Board', amount: 1 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      input: {
        anyOfGoods: {
          allowed: ['Trunk', 'Board'],
          totalAmount: 2,
          unattendedPriorityOrder: ['Board', 'Trunk'],
        },
      },
      output: { good: { good: 'Paper', amount: 1 } },
      maxBatchesPerTurn: 1,
    },
    Mint: {
      id: 'Mint',
      category: 'SecondaryProducer',
      buildCost: [
        { good: 'Board', amount: 2 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      input: {
        fixedGoods: [
          { good: 'Gold', amount: 2 },
          { good: 'Fuel', amount: 1 },
        ],
      },
      output: { good: { good: 'Coin', amount: 1 } },
      maxBatchesPerTurn: 1,
    },
    StockExchange: {
      id: 'StockExchange',
      category: 'SecondaryProducer',
      buildCost: [{ good: 'Stone', amount: 3 }],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      input: {
        fixedGoods: [
          { good: 'Coin', amount: 2 },
          { good: 'Paper', amount: 1 },
        ],
      },
      output: { good: { good: 'StockBond', amount: 1 } },
      maxBatchesPerTurn: 6,
    },
    WagonFactory: {
      id: 'WagonFactory',
      category: 'TransporterFactory',
      buildCost: [
        { good: 'Board', amount: 2 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      input: {
        fixedGoods: [{ good: 'Board', amount: 2 }],
        consumedTransporter: 'Donkey',
      },
      output: { transporter: 'Wagon' },
      maxBatchesPerTurn: 1,
    },
    TruckFactory: {
      id: 'TruckFactory',
      category: 'TransporterFactory',
      buildCost: [
        { good: 'Board', amount: 2 },
        { good: 'Stone', amount: 2 },
      ],
      terrainRequirement: { kind: 'AnyNonDesertLand' },
      requiredResearch: 'Trucking',
      input: {
        fixedGoods: [
          { good: 'Iron', amount: 1 },
          { good: 'Fuel', amount: 1 },
        ],
      },
      output: { transporter: 'Truck' },
      maxBatchesPerTurn: 1,
    },
    RaftFactory: {
      id: 'RaftFactory',
      category: 'TransporterFactory',
      buildCost: [
        { good: 'Board', amount: 1 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'Shore' },
      input: {
        fixedGoods: [{ good: 'Trunk', amount: 2 }],
      },
      output: { transporter: 'Raft' },
      maxBatchesPerTurn: 1,
    },
    RowboatFactory: {
      id: 'RowboatFactory',
      category: 'TransporterFactory',
      buildCost: [
        { good: 'Board', amount: 2 },
        { good: 'Stone', amount: 1 },
      ],
      terrainRequirement: { kind: 'Shore' },
      requiredResearch: 'Rowing',
      input: {
        fixedGoods: [{ good: 'Board', amount: 5 }],
      },
      output: { transporter: 'Rowboat' },
      maxBatchesPerTurn: 1,
    },
    SteamerFactory: {
      id: 'SteamerFactory',
      category: 'TransporterFactory',
      buildCost: [
        { good: 'Board', amount: 2 },
        { good: 'Stone', amount: 2 },
      ],
      terrainRequirement: { kind: 'Shore' },
      requiredResearch: 'Shipping',
      input: {
        fixedGoods: [
          { good: 'Iron', amount: 1 },
          { good: 'Fuel', amount: 2 },
        ],
      },
      output: { transporter: 'Steamer' },
      maxBatchesPerTurn: 1,
    },
  },
  research: {
    Rowing: {
      id: 'Rowing',
      cost: [
        { good: 'Goose', amount: 2 },
        { good: 'Paper', amount: 1 },
      ],
      prerequisites: [],
      unlocksBuilding: 'RowboatFactory',
      freeUpgradeFromBuildings: ['RaftFactory'],
    },
    Trucking: {
      id: 'Trucking',
      cost: [
        { good: 'Goose', amount: 2 },
        { good: 'Paper', amount: 1 },
      ],
      prerequisites: [],
      unlocksBuilding: 'TruckFactory',
      freeUpgradeFromBuildings: ['WagonFactory'],
    },
    Shipping: {
      id: 'Shipping',
      cost: [
        { good: 'Goose', amount: 2 },
        { good: 'Paper', amount: 1 },
      ],
      prerequisites: [],
      unlocksBuilding: 'SteamerFactory',
      freeUpgradeFromBuildings: ['RaftFactory', 'RowboatFactory'],
    },
    Drilling: {
      id: 'Drilling',
      cost: [
        { good: 'Goose', amount: 2 },
        { good: 'Paper', amount: 1 },
      ],
      prerequisites: [],
      unlocksBuilding: 'OilRig',
    },
    Specialisation: {
      id: 'Specialisation',
      cost: [
        { good: 'Goose', amount: 2 },
        { good: 'Paper', amount: 1 },
      ],
      prerequisites: [],
      minePoolOverride: {
        cannotCombineOnSameMineWith: 'Enlargement',
        pools: [
          [
            { good: 'Gold', amount: 4 },
            { good: 'Iron', amount: 0 },
          ],
          [
            { good: 'Gold', amount: 0 },
            { good: 'Iron', amount: 4 },
          ],
        ],
      },
    },
    Enlargement: {
      id: 'Enlargement',
      cost: [
        { good: 'Goose', amount: 2 },
        { good: 'Paper', amount: 1 },
      ],
      prerequisites: [],
      minePoolOverride: {
        cannotCombineOnSameMineWith: 'Specialisation',
        pools: [
          [
            { good: 'Gold', amount: 5 },
            { good: 'Iron', amount: 5 },
          ],
        ],
      },
    },
    NewShafts: {
      id: 'NewShafts',
      cost: [
        { good: 'Goose', amount: 2 },
        { good: 'Paper', amount: 1 },
      ],
      prerequisites: [],
      unlocksInfrastructure: 'NewMineShaft',
    },
  },
  wonder: {
    baseCostIncreaseAfterBrickIndex: 17,
    irrigationTriggerBrickIndex: 45,
    maxNeutralBricksTurnLimit: 33,
    endGameBrickIndexByPlayerCount: {
      1: 58,
      2: 52,
      3: 58,
      4: 64,
    },
    soloPrebuiltRows: 4,
    rows: [
      { rowNumber: 1, capacity: 4, pointsPerRow: 10 },
      { rowNumber: 2, capacity: 4, pointsPerRow: 10 },
      { rowNumber: 3, capacity: 4, pointsPerRow: 10 },
      { rowNumber: 4, capacity: 4, pointsPerRow: 10 },
      { rowNumber: 5, capacity: 5, pointsPerRow: 10 },
      { rowNumber: 6, capacity: 5, pointsPerRow: 10 },
      { rowNumber: 7, capacity: 5, pointsPerRow: 10 },
      { rowNumber: 8, capacity: 5, pointsPerRow: 10 },
      { rowNumber: 9, capacity: 6, pointsPerRow: 10 },
      { rowNumber: 10, capacity: 6, pointsPerRow: 10 },
      { rowNumber: 11, capacity: 6, pointsPerRow: 10 },
      { rowNumber: 12, capacity: 7, pointsPerRow: 10 },
      { rowNumber: 13, capacity: 3, pointsPerRow: 10 },
    ],
  },
};
