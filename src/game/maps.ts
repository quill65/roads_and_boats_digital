/**
 * Map Presets and Board Initializers Barrel Export
 */

export type { MapPreset, ScenarioMapSetId } from './maps/types';
export { STANDARD_MAP_PRESETS } from './maps/standard';
export { SOLITAIRE_MAP_PRESETS } from './maps/solitaire';
export {
  SPLOTTER_SCENARIO_BOOK_MAPS,
  RB_1_2_PLAYER_SCENARIO_MAPS,
} from './maps/splotterMaps';
export { MAP_PRESETS, buildMapState } from './maps/builder';

