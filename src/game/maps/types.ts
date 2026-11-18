/**
 * Map Preset Type Definitions
 */

import { HexOrientation, TerrainType } from '../types';

export type ScenarioMapSetId =
  | 'solitaire_compendium'
  | 'splotter_maps_pdf'
  | 'rb_1_2_player_maps'
  | 'classic_multiplayer';

export interface MapPreset {
  id: string;
  name: string;
  description: string;
  recommendedPlayers: string;
  mapSetId?: ScenarioMapSetId;
  scenarioCode?: string;
  author?: string;
  publisher?: string;
  sourceFile?: string;
  scenarioNotes?: string[];
  specialRules?: string;
  hexOrientation?: HexOrientation;
  hexes: Array<{ q: number; r: number; terrain: TerrainType }>;
  riverEdges: Array<{ q1: number; r1: number; q2: number; r2: number }>;
  initialRoads?: Array<{ q1: number; r1: number; q2: number; r2: number }>;
  railroads?: Array<{ q1: number; r1: number; q2: number; r2: number }>;
  playerHomeHexes: Array<{ q: number; r: number }>;
}

