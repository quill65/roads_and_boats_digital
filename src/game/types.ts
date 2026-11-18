/**
 * Roads & Boats - Core Type Definitions
 */

export type TerrainType = 'pasture' | 'forest' | 'mountain' | 'rock' | 'desert' | 'water';

export type GoodType =
  // Raw goods
  | 'wood'
  | 'clay'
  | 'stone'
  | 'iron'
  | 'gold'
  // Refined / Factory goods
  | 'boards'
  | 'bricks'
  | 'paper'
  | 'coin'
  | 'stock'
  | 'fuel'
  // Living animals
  | 'goose';

export type BuildingType =
  // Primary
  | 'woodcutter'
  | 'claypit'
  | 'quarry'
  | 'mine'
  | 'oilrig'
  // Secondary / Refinement
  | 'sawmill'
  | 'brickworks'
  | 'burner'
  | 'papermill'
  | 'mint'
  | 'stockexchange'
  // Transporter Producers
  | 'wagonfactory'
  | 'raftfactory'
  | 'shipyard'
  | 'truckfactory'
  | 'steamerfactory'
  // The Great Wonder
  | 'wonder';

export type TransporterType =
  | 'donkey'
  | 'wagon'
  | 'truck'
  | 'raft'
  | 'rowboat'
  | 'steamship';

export type EdgeImprovement = 'none' | 'road' | 'bridge';

export type HexOrientation = 'pointy' | 'flat';

export type Phase =
  | 'PRODUCTION'
  | 'MOVEMENT'
  | 'BUILDING'
  | 'WONDER'
  | 'COMPLETED';

export interface HexCoordinate {
  q: number;
  r: number;
}

export interface BuildingInstance {
  id: string;
  type: BuildingType;
  ownerId: string;
  builtRound: number;
  side?: number;
  minePool?: Partial<Record<GoodType, number>>;
  mineVariant?: 'default' | 'specialized' | 'enlarged';
}

export interface HexTile {
  id: string; // "q,r"
  q: number;
  r: number;
  terrain: TerrainType;
  goods: Partial<Record<GoodType, number>>;
  goodsBySide?: Record<number, Partial<Record<GoodType, number>>>;
  building?: BuildingInstance | null;
}

export interface HexEdge {
  id: string; // normalized "q1,r1|q2,r2"
  hexA: string;
  hexB: string;
  isRiver: boolean;
  isRailroad?: boolean;
  improvement: EdgeImprovement;
  ownerId?: string | null;
}

export interface Transporter {
  id: string;
  ownerId: string;
  type: TransporterType;
  hexId: string;
  side?: number;
  waterLocation?: 'sea' | 'river' | 'shore';
  cargo: Partial<Record<GoodType, number>>;
  movesLeft: number;
  maxMoves: number;
  capacity: number;
}

export interface WonderBrick {
  brickIndex: number;
  tier: number;
  ownerId: string;
  points: number;
  round: number;
}

export interface WonderTier {
  tierIndex: number;
  name: string;
  pointsPerBrick: number;
  totalSlots: number;
  bricks: WonderBrick[];
}

export type BotProfileId = 'stock_beginner';

export interface Player {
  id: string;
  name: string;
  color: string;
  isAI: boolean;
  aiProfileId?: BotProfileId | string;
  aiOwnedGoods?: Record<string, Partial<Record<GoodType, number>>>;
  aiOwnedGoodsBySide?: Record<string, Record<number, Partial<Record<GoodType, number>>>>;
  isHost: boolean;
  isReady: boolean;
  score: number;
  homeHexId: string;
  connected?: boolean;
  resigned?: boolean;
  clientId?: string;
  unlockedTechs?: string[];
}

export interface GameLogEntry {
  id: string;
  round: number;
  phase: Phase;
  playerId?: string;
  playerName?: string;
  message: string;
  timestamp: number;
}

export interface HistoryEntry {
  id: string;
  label: string;
  round: number;
  phase: Phase;
  playerId?: string;
  playerName?: string;
  timestamp: number;
  snapshot: string; // JSON serialized state
}

export interface GameState {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  mapName: string;
  hexOrientation?: HexOrientation;
  round: number;
  maxRounds: number;
  phase: Phase;
  activePlayerId: string;
  players: Player[];
  hexes: Record<string, HexTile>;
  edges: Record<string, HexEdge>;
  transporters: Record<string, Transporter>;
  wonder: WonderTier[];
  neutralBricksUsed?: number;
  wonderBricksThisRoundByPlayer?: Record<string, number>;
  logs: GameLogEntry[];
  history: HistoryEntry[];
  redoStack: HistoryEntry[];
  isSolitaire?: boolean;
  scenarioId?: string;
  creatorClientId?: string;
  creatorPlayerId?: string;
  winnerId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type GameAction =
  | { type: 'MOVE_TRANSPORTER'; transporterId: string; targetHexId: string; targetSide?: number }
  | { type: 'PICKUP_GOODS'; transporterId: string; good: GoodType; amount: number; targetSide?: number }
  | { type: 'DROP_GOODS'; transporterId: string; good: GoodType; amount: number; targetSide?: number }
  | { type: 'BUILD_ROAD'; hexA: string; hexB: string; material: 'boards' | 'stone'; transporterId: string }
  | { type: 'BUILD_FACTORY'; hexId: string; buildingType: BuildingType; transporterId: string }
  | { type: 'BUILD_WONDER'; transporterId: string; amount: number }
  | { type: 'RESEARCH_TECH'; hexId: string; techId: string; transporterId?: string }
  | { type: 'REPLENISH_MINE'; hexId: string; transporterId?: string }
  | { type: 'CONVERT_FACTORY'; hexId: string; recipeId: string }
  | { type: 'RESIGN_GAME'; playerId?: string }
  | { type: 'UNDO_MOVE' }
  | { type: 'REDO_MOVE' }
  | { type: 'REVERT_TO_HISTORY'; targetIndex: number }
  | { type: 'END_TURN' }
  | { type: 'ADVANCE_PHASE'; allowTransporterCargo?: boolean | string[] };
