/**
 * Combined Map Presets & Board State Builder
 */

import { HexEdge, HexTile } from '../types';
import { getEdgeKey, getHexNeighbors, hexToKey } from '../hexMath';
import { MapPreset } from './types';
import { STANDARD_MAP_PRESETS } from './standard';
import { SOLITAIRE_MAP_PRESETS } from './solitaire';
import {
  SPLOTTER_SCENARIO_BOOK_MAPS,
  RB_1_2_PLAYER_SCENARIO_MAPS,
} from './splotterMaps';

const SOLITAIRE_AUTHOR_BY_MAP_ID: Record<string, string> = {
  scenario_mesopotamia: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
  scenario_lord_of_the_ring: 'Jeroen Doumen, Joris Wiersinga & Werner Bär (Record)',
  scenario_sea_for_one: 'Jeroen Doumen, Joris Wiersinga, Hannes Ernst & Gary Brennan',
  scenario_river_runs_through_it: 'Jeroen Doumen, Joris Wiersinga, Gary Brennan & Herman Haverkort',
  scenario_small_world_s22: 'Herman Haverkort',
  scenario_charing_cross: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
  scenario_small_world_s33: 'Herman Haverkort',
  scenario_small_world_s42: 'Uwe Gemming',
  scenario_small_world_s52: 'Uwe Gemming',
  scenario_rocket_science: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
  scenario_small_world_sx2: 'Herman Haverkort',
  scenario_tierra_del_fuego_s11: 'Herman Haverkort',
  scenario_sheikh_of_the_ring: 'Jeroen Doumen, Joris Wiersinga & Herman Haverkort (Record)',
};

const ENRICHED_SOLITAIRE_PRESETS: Record<string, MapPreset> = Object.fromEntries(
  Object.entries(SOLITAIRE_MAP_PRESETS).map(([key, preset]) => [
    key,
    {
      ...preset,
      mapSetId: preset.mapSetId || 'solitaire_compendium',
      author:
        preset.author ||
        SOLITAIRE_AUTHOR_BY_MAP_ID[key] ||
        'Jeroen Doumen & Joris Wiersinga (Splotter Spellen)',
      publisher: preset.publisher || 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga)',
      sourceFile:
        preset.sourceFile ||
        'Collected Scenarios for Roads & Boats (Deduplicated against Drive PDFs)',
    },
  ])
);

export const MAP_PRESETS: Record<string, MapPreset> = {
  ...STANDARD_MAP_PRESETS,
  ...SPLOTTER_SCENARIO_BOOK_MAPS,
  ...RB_1_2_PLAYER_SCENARIO_MAPS,
  ...ENRICHED_SOLITAIRE_PRESETS,
};


export function buildMapState(mapId: string): {
  hexes: Record<string, HexTile>;
  edges: Record<string, HexEdge>;
} {
  const preset = MAP_PRESETS[mapId] || MAP_PRESETS.river_valley;
  const hexes: Record<string, HexTile> = {};
  const edges: Record<string, HexEdge> = {};

  preset.hexes.forEach(h => {
    const key = hexToKey(h.q, h.r);
    hexes[key] = {
      id: key,
      q: h.q,
      r: h.r,
      terrain: h.terrain,
      goods: {},
      building: null,
    };
  });

  Object.values(hexes).forEach(hex => {
    const neighbors = getHexNeighbors(hex.q, hex.r);
    neighbors.forEach(nb => {
      const nbKey = hexToKey(nb.q, nb.r);
      if (hexes[nbKey]) {
        const edgeKey = getEdgeKey(hex.q, hex.r, nb.q, nb.r);
        if (!edges[edgeKey]) {
          edges[edgeKey] = {
            id: edgeKey,
            hexA: hex.id < nbKey ? hex.id : nbKey,
            hexB: hex.id < nbKey ? nbKey : hex.id,
            isRiver: false,
            improvement: 'none',
            ownerId: null,
          };
        }
      }
    });
  });

  preset.riverEdges.forEach(r => {
    const edgeKey = getEdgeKey(r.q1, r.r1, r.q2, r.r2);
    if (edges[edgeKey]) {
      edges[edgeKey].isRiver = true;
    }
  });

  if (preset.initialRoads) {
    preset.initialRoads.forEach(rd => {
      const edgeKey = getEdgeKey(rd.q1, rd.r1, rd.q2, rd.r2);
      if (edges[edgeKey]) {
        edges[edgeKey].improvement = edges[edgeKey].isRiver ? 'bridge' : 'road';
      }
    });
  }

  if (preset.railroads) {
    preset.railroads.forEach(rr => {
      const edgeKey = getEdgeKey(rr.q1, rr.r1, rr.q2, rr.r2);
      if (edges[edgeKey]) {
        edges[edgeKey].isRailroad = true;
      }
    });
  }

  return { hexes, edges };
}
