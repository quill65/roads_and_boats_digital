/**
 * River-Divided Tile Geometry, Bank Topology, Connectivity & Visual Offsets
 *
 * Determines how river edges divide a hex into disjoint land banks ("sides"),
 * tracks per-side goods, validates bridge connections across divided banks,
 * and computes UI visual offsets away from unbridged rivers and water barriers.
 */

import { GameState, GoodType, HexOrientation, HexTile, Transporter } from './types';
import { getEdgeKey, HEX_DIRECTIONS, hexToPixel, parseHexKey } from './hexMath';

export interface NeighborExitInfo {
  neighborId: string;
  edgeId: string;
  angle: number; // [0, 2*PI) in SVG pixel coords (+x right, +y down)
  isRiver: boolean;
  isWaterNeighbor: boolean;
  existsInMap: boolean;
}

export interface HexSideRegion {
  side: number;
  startAngle: number;
  endAngle: number;
  span: number;
  bisectorAngle: number;
  compassLabel: string;
  nonRiverNeighborIds: string[];
  allDirectionNeighborIds: string[];
  flankingRiverEdgeIds: string[];
  touchesWater: boolean;
  touchesLand: boolean;
}

export interface HexSideLayout {
  hexId: string;
  isSplit: boolean;
  riverExits: NeighborExitInfo[];
  sides: HexSideRegion[];
}

function normalizeAngle(rad: number): number {
  const twoPi = Math.PI * 2;
  return ((rad % twoPi) + twoPi) % twoPi;
}

export function getCompassLabel(angleRad: number): string {
  // SVG coordinates: 0 = East, PI/2 = South, PI = West, 3PI/2 = North
  const deg = (normalizeAngle(angleRad) * 180) / Math.PI;
  if (deg >= 337.5 || deg < 22.5) return 'East Bank';
  if (deg < 67.5) return 'SE Bank';
  if (deg < 112.5) return 'South Bank';
  if (deg < 157.5) return 'SW Bank';
  if (deg < 202.5) return 'West Bank';
  if (deg < 247.5) return 'NW Bank';
  if (deg < 292.5) return 'North Bank';
  return 'NE Bank';
}

/**
 * Computes the angular bank regions of a hex tile given `state.edges`.
 * - 0 or 1 incident river exit (e.g. normal hex or river source/end): 1 undivided side (`side = 0`).
 * - 2+ incident river exits: divides the hex perimeter into K sectors bounded by consecutive river exits.
 */
export function getHexSideLayout(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string
): HexSideLayout {
  const hex = state.hexes[hexId];
  const orientation: HexOrientation = state.hexOrientation || 'pointy';
  const coord = hex ? { q: hex.q, r: hex.r } : parseHexKey(hexId);
  const c1 = hexToPixel(coord.q, coord.r, 1, orientation);

  const exits: NeighborExitInfo[] = HEX_DIRECTIONS.map(dir => {
    const nq = coord.q + dir.q;
    const nr = coord.r + dir.r;
    const neighborId = `${nq},${nr}`;
    const edgeId = getEdgeKey(coord.q, coord.r, nq, nr);
    const edge = state.edges[edgeId];
    const nbHex = state.hexes[neighborId];
    const c2 = hexToPixel(nq, nr, 1, orientation);
    const angle = normalizeAngle(Math.atan2(c2.y - c1.y, c2.x - c1.x));
    return {
      neighborId,
      edgeId,
      angle,
      isRiver: Boolean(edge && edge.isRiver),
      isWaterNeighbor: Boolean(nbHex && nbHex.terrain === 'water'),
      existsInMap: Boolean(nbHex),
    };
  }).sort((a, b) => a.angle - b.angle);

  const riverExits = exits.filter(e => e.isRiver);

  if (riverExits.length < 2) {
    const nonRiverInMap = exits.filter(e => !e.isRiver && e.existsInMap);
    const touchesWater =
      riverExits.length > 0 || nonRiverInMap.some(e => e.isWaterNeighbor);
    const touchesLand = nonRiverInMap.some(e => !e.isWaterNeighbor);

    // Pick a clean default interior angle facing away from any single river exit or water
    let sumX = 0;
    let sumY = 0;
    exits.forEach(e => {
      if (e.isRiver || e.isWaterNeighbor) {
        sumX -= Math.cos(e.angle);
        sumY -= Math.sin(e.angle);
      } else if (e.existsInMap) {
        sumX += Math.cos(e.angle) * 0.4;
        sumY += Math.sin(e.angle) * 0.4;
      }
    });
    const bisectorAngle =
      Math.hypot(sumX, sumY) > 1e-3 ? normalizeAngle(Math.atan2(sumY, sumX)) : Math.PI * 1.5;

    return {
      hexId,
      isSplit: false,
      riverExits,
      sides: [
        {
          side: 0,
          startAngle: 0,
          endAngle: Math.PI * 2,
          span: Math.PI * 2,
          bisectorAngle,
          compassLabel: 'Center',
          nonRiverNeighborIds: nonRiverInMap.map(e => e.neighborId),
          allDirectionNeighborIds: exits.filter(e => e.existsInMap).map(e => e.neighborId),
          flankingRiverEdgeIds: riverExits.map(r => r.edgeId),
          touchesWater,
          touchesLand,
        },
      ],
    };
  }

  const k = riverExits.length;
  const sides: HexSideRegion[] = [];

  for (let s = 0; s < k; s++) {
    const exitA = riverExits[s];
    const exitB = riverExits[(s + 1) % k];
    const startAngle = exitA.angle;
    const endAngle = exitB.angle;
    const span = normalizeAngle(endAngle - startAngle) || Math.PI * 2;
    const bisectorAngle = normalizeAngle(startAngle + span / 2);

    const sectorExits = exits.filter(e => {
      if (e.isRiver) return false;
      const offset = normalizeAngle(e.angle - startAngle);
      return offset > 1e-4 && offset < span - 1e-4;
    });

    const inMapSector = sectorExits.filter(e => e.existsInMap);
    const touchesWater = true; // Bounded by river on both flanks
    const touchesLand = inMapSector.some(e => !e.isWaterNeighbor);

    sides.push({
      side: s,
      startAngle,
      endAngle,
      span,
      bisectorAngle,
      compassLabel: getCompassLabel(bisectorAngle),
      nonRiverNeighborIds: inMapSector.map(e => e.neighborId),
      allDirectionNeighborIds: inMapSector.map(e => e.neighborId),
      flankingRiverEdgeIds: [exitA.edgeId, exitB.edgeId],
      touchesWater,
      touchesLand,
    });
  }

  return {
    hexId,
    isSplit: true,
    riverExits,
    sides,
  };
}

/**
 * Normalizes a candidate side index to [0, sideCount - 1].
 */
export function normalizeSideForHex(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side?: number
): number {
  const layout = getHexSideLayout(state, hexId);
  if (!layout.isSplit || layout.sides.length <= 1) return 0;
  if (typeof side === 'number' && Number.isInteger(side) && side >= 0 && side < layout.sides.length) {
    return side;
  }
  return getBestAccessibleSide(state, hexId);
}

/**
 * Picks the side of a hex that has the strongest land/road connectivity (avoiding off-map outer rims).
 */
export function getBestAccessibleSide(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  candidateSides?: number[]
): number {
  const layout = getHexSideLayout(state, hexId);
  if (!layout.isSplit || layout.sides.length <= 1) return 0;

  const coord = parseHexKey(hexId);
  const candidates = candidateSides && candidateSides.length > 0
    ? layout.sides.filter(s => candidateSides.includes(s.side))
    : layout.sides;
  if (candidates.length === 0) return 0;

  let bestSide = candidates[0].side;
  let bestScore = -Infinity;

  for (const region of candidates) {
    let score = 0;
    const landNbs = region.nonRiverNeighborIds.filter(
      id => state.hexes[id] && state.hexes[id].terrain !== 'water'
    );
    const anyMapNbs = region.nonRiverNeighborIds.length;
    if (landNbs.length > 0) score += 100 + landNbs.length * 15;
    else if (anyMapNbs > 0) score += 20;
    else score -= 50;

    // Bonus if connected to a paved road or bridge
    for (const nbId of region.nonRiverNeighborIds) {
      const nb = parseHexKey(nbId);
      const edge = state.edges[getEdgeKey(coord.q, coord.r, nb.q, nb.r)];
      if (edge && (edge.improvement === 'road' || edge.isRailroad)) {
        score += 30;
      }
    }
    for (const rEdgeId of region.flankingRiverEdgeIds) {
      if (state.edges[rEdgeId]?.improvement === 'bridge') {
        score += 10;
      }
    }

    // Prefer more open sector span slightly on ties
    score += region.span;

    if (score > bestScore) {
      bestScore = score;
      bestSide = region.side;
    }
  }

  return bestSide;
}

/**
 * Returns all sides on `hexId` connected to `fromSide` via bridges on `hexId`'s incident river edges.
 * If no bridge connects two banks on `hexId`, returns only `Set([normalizedFromSide])`.
 */
export function getAccessibleSidesOnHex(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  fromSide: number
): Set<number> {
  const layout = getHexSideLayout(state, hexId);
  const start = normalizeSideForHex(state, hexId, fromSide);
  const visited = new Set<number>([start]);
  if (!layout.isSplit) return visited;

  const k = layout.sides.length;
  const queue: number[] = [start];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    // River exit `curr` sits between `(curr - 1 + k) % k` and `curr`
    // River exit `(curr + 1) % k` sits between `curr` and `(curr + 1) % k`
    const adjPairs: Array<{ exitIdx: number; nextSide: number }> = [
      { exitIdx: curr, nextSide: (curr - 1 + k) % k },
      { exitIdx: (curr + 1) % k, nextSide: (curr + 1) % k },
    ];
    for (const { exitIdx, nextSide } of adjPairs) {
      if (visited.has(nextSide)) continue;
      const riverExit = layout.riverExits[exitIdx];
      if (!riverExit) continue;
      const edge = state.edges[riverExit.edgeId];
      if (edge && edge.improvement === 'bridge') {
        visited.add(nextSide);
        queue.push(nextSide);
      }
    }
  }

  return visited;
}

export function areSidesConnectedByBridgeOnHex(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  sideA: number,
  sideB: number
): boolean {
  const a = normalizeSideForHex(state, hexId, sideA);
  const b = normalizeSideForHex(state, hexId, sideB);
  if (a === b) return true;
  return getAccessibleSidesOnHex(state, hexId, a).has(b);
}

/**
 * Returns true if `hexId` is split into >= 2 banks that are NOT fully joined by bridges.
 */
export function isHexDividedByUnbridgedRiver(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string
): boolean {
  const layout = getHexSideLayout(state, hexId);
  if (!layout.isSplit) return false;
  const reachable = getAccessibleSidesOnHex(state, hexId, 0);
  return reachable.size < layout.sides.length;
}

/**
 * For a non-river neighbor of `hexId`, returns which side of `hexId` faces `neighborId`.
 */
export function getNeighborSideOnHex(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  neighborId: string
): number | null {
  const layout = getHexSideLayout(state, hexId);
  if (!layout.isSplit) {
    return layout.sides[0]?.nonRiverNeighborIds.includes(neighborId) ? 0 : null;
  }
  const region = layout.sides.find(s => s.nonRiverNeighborIds.includes(neighborId));
  return region ? region.side : null;
}

/**
 * Checks whether a side (or any side bridged to it) directly borders the given `riverEdgeId`.
 */
export function doesSideFlankRiverEdge(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side: number,
  riverEdgeId: string
): boolean {
  const layout = getHexSideLayout(state, hexId);
  if (!layout.isSplit) {
    return layout.riverExits.some(r => r.edgeId === riverEdgeId);
  }
  const accessible = getAccessibleSidesOnHex(state, hexId, side);
  for (const s of accessible) {
    if (layout.sides[s]?.flankingRiverEdgeIds.includes(riverEdgeId)) {
      return true;
    }
  }
  return false;
}

/**
 * When walking along a shared river edge `(fromHexId -> toHexId)` from `(fromHexId, fromSide)`,
 * returns the topologically matching riverbank side on `toHexId`.
 * Left of A->B equals Right of B->A, and Right of A->B equals Left of B->A.
 */
export function getMatchingBankAcrossRiverEdge(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  fromHexId: string,
  fromSide: number,
  toHexId: string
): number {
  const fromLayout = getHexSideLayout(state, fromHexId);
  const toLayout = getHexSideLayout(state, toHexId);
  if (!toLayout.isSplit) return 0;

  const coordFrom = parseHexKey(fromHexId);
  const coordTo = parseHexKey(toHexId);
  const edgeId = getEdgeKey(coordFrom.q, coordFrom.r, coordTo.q, coordTo.r);

  const toExitIdx = toLayout.riverExits.findIndex(r => r.edgeId === edgeId);
  if (toExitIdx < 0) return getBestAccessibleSide(state, toHexId);

  const kt = toLayout.sides.length;
  const toRightBank = toExitIdx % kt;
  const toLeftBank = (toExitIdx - 1 + kt) % kt;

  if (!fromLayout.isSplit) {
    return getBestAccessibleSide(state, toHexId, [toLeftBank, toRightBank]);
  }

  const fromExitIdx = fromLayout.riverExits.findIndex(r => r.edgeId === edgeId);
  if (fromExitIdx < 0) {
    return getBestAccessibleSide(state, toHexId, [toLeftBank, toRightBank]);
  }

  const kf = fromLayout.sides.length;
  const fromRightBank = fromExitIdx % kf;
  const fromLeftBank = (fromExitIdx - 1 + kf) % kf;
  const normFrom = normalizeSideForHex(state, fromHexId, fromSide);

  if (normFrom === fromLeftBank) return toRightBank;
  if (normFrom === fromRightBank) return toLeftBank;

  // Fallback if `normFrom` only reached `edgeId` via an internal bridge
  const accessible = getAccessibleSidesOnHex(state, fromHexId, normFrom);
  if (accessible.has(fromLeftBank)) return toRightBank;
  if (accessible.has(fromRightBank)) return toLeftBank;
  return getBestAccessibleSide(state, toHexId, [toLeftBank, toRightBank]);
}

/**
 * Returns all valid sides of `targetHexId` that a transporter can land on when
 * arriving from `(fromHexId, fromSide)`.
 * - Unsplit riverhead/source (`!fromLayout.isSplit`) stepping onto a split river hex
 *   touches both flanking banks (`toLeftBank` and `toRightBank`), so either bank is valid.
 * - Split hex stepping along a shared river edge maps accessible left/right banks across.
 */
export function getValidEntrySidesFromNeighbor(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  fromHexId: string,
  fromSide: number,
  targetHexId: string
): number[] {
  const fromLayout = getHexSideLayout(state, fromHexId);
  const toLayout = getHexSideLayout(state, targetHexId);
  if (!toLayout.isSplit) return [0];

  const c1 = parseHexKey(fromHexId);
  const c2 = parseHexKey(targetHexId);
  const edgeId = getEdgeKey(c1.q, c1.r, c2.q, c2.r);
  const edge = state.edges[edgeId];

  if (edge && edge.isRiver) {
    const toExitIdx = toLayout.riverExits.findIndex(r => r.edgeId === edgeId);
    if (toExitIdx < 0) return [getBestAccessibleSide(state, targetHexId)];

    const kt = toLayout.sides.length;
    const toRightBank = toExitIdx % kt;
    const toLeftBank = (toExitIdx - 1 + kt) % kt;
    const bestPair = getBestAccessibleSide(state, targetHexId, [toLeftBank, toRightBank]);

    if (!fromLayout.isSplit) {
      const otherBank = bestPair === toLeftBank ? toRightBank : toLeftBank;
      return otherBank !== bestPair ? [bestPair, otherBank] : [bestPair];
    }

    const fromExitIdx = fromLayout.riverExits.findIndex(r => r.edgeId === edgeId);
    if (fromExitIdx < 0) {
      return [bestPair];
    }

    const kf = fromLayout.sides.length;
    const fromRightBank = fromExitIdx % kf;
    const fromLeftBank = (fromExitIdx - 1 + kf) % kf;
    const normFrom = normalizeSideForHex(state, fromHexId, fromSide);
    const accessible = getAccessibleSidesOnHex(state, fromHexId, normFrom);

    const validSides: number[] = [];
    if (normFrom === fromLeftBank && !validSides.includes(toRightBank)) validSides.push(toRightBank);
    if (normFrom === fromRightBank && !validSides.includes(toLeftBank)) validSides.push(toLeftBank);
    if (accessible.has(fromLeftBank) && !validSides.includes(toRightBank)) validSides.push(toRightBank);
    if (accessible.has(fromRightBank) && !validSides.includes(toLeftBank)) validSides.push(toLeftBank);

    if (validSides.length > 0) return validSides;
    return [bestPair];
  }

  const facingSide = getNeighborSideOnHex(state, targetHexId, fromHexId);
  return [facingSide !== null ? facingSide : getBestAccessibleSide(state, targetHexId)];
}

/**
 * Returns which side of `targetHexId` a transporter enters by default when arriving from `fromHexId`.
 */
export function getEntrySideFromNeighbor(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  fromHexId: string,
  fromSide: number,
  targetHexId: string
): number {
  return getValidEntrySidesFromNeighbor(state, fromHexId, fromSide, targetHexId)[0] ?? 0;
}

/**
 * Canonical resolved side of a transporter.
 */
export function getTransporterSide(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  transporter: Transporter
): number {
  const hex = state.hexes[transporter.hexId];
  if (!hex) return 0;
  if (typeof transporter.side === 'number') {
    return normalizeSideForHex(state, transporter.hexId, transporter.side);
  }
  if (hex.building && typeof hex.building.side === 'number') {
    return normalizeSideForHex(state, transporter.hexId, hex.building.side);
  }
  return getBestAccessibleSide(state, transporter.hexId);
}

/**
 * Canonical resolved side of a building on `hex`.
 */
export function getBuildingSide(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hex: HexTile
): number {
  if (!hex.building) return getBestAccessibleSide(state, hex.id);
  if (typeof hex.building.side === 'number') {
    return normalizeSideForHex(state, hex.id, hex.building.side);
  }
  return getBestAccessibleSide(state, hex.id);
}

/**
 * Checks whether a specific side of a hex touches water (river flanking edge or adjacent sea hex).
 */
export function isSideAdjacentToWater(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side: number
): boolean {
  const layout = getHexSideLayout(state, hexId);
  const norm = normalizeSideForHex(state, hexId, side);
  return Boolean(layout.sides[norm]?.touchesWater);
}

/**
 * Checks whether any road, bridge, or railroad touches `(hexId, side)` (or bridged sides).
 */
export function doesSideTouchRoad(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side: number
): boolean {
  const coord = parseHexKey(hexId);
  const layout = getHexSideLayout(state, hexId);
  const accessible = getAccessibleSidesOnHex(state, hexId, side);

  for (const s of accessible) {
    const region = layout.sides[s];
    if (!region) continue;
    for (const nbId of region.nonRiverNeighborIds) {
      const nb = parseHexKey(nbId);
      const edge = state.edges[getEdgeKey(coord.q, coord.r, nb.q, nb.r)];
      if (edge && (edge.improvement === 'road' || edge.improvement === 'bridge' || edge.isRailroad)) {
        return true;
      }
    }
    for (const rEdgeId of region.flankingRiverEdgeIds) {
      const edge = state.edges[rEdgeId];
      if (edge && (edge.improvement === 'bridge' || edge.isRailroad)) {
        return true;
      }
    }
  }
  return false;
}

// ============================================================================
// Per-Side Goods Storage & Synchronization (`hex.goodsBySide` <-> `hex.goods`)
// ============================================================================

export function syncHexTotalGoods(hex: HexTile): void {
  if (!hex.goodsBySide) return;
  const total: Partial<Record<GoodType, number>> = {};
  Object.values(hex.goodsBySide).forEach(sideMap => {
    if (!sideMap) return;
    Object.entries(sideMap).forEach(([g, qty]) => {
      if (qty && qty > 0) {
        const gt = g as GoodType;
        total[gt] = (total[gt] || 0) + qty;
      }
    });
  });
  hex.goods = total;
}

/**
 * Reconciles `hex.goodsBySide` if external callers/tests directly overwrote `hex.goods`
 * without calling `addGoodOnSide`/`removeGoodOnSide`.
 */
export function ensureHexGoodsBySide(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hex: HexTile
): Record<number, Partial<Record<GoodType, number>>> {
  const anchorSide = hex.building
    ? getBuildingSide(state, hex)
    : getBestAccessibleSide(state, hex.id);

  if (!hex.goodsBySide) {
    hex.goodsBySide = {};
    const initial: Partial<Record<GoodType, number>> = {};
    Object.entries(hex.goods || {}).forEach(([g, q]) => {
      if (q && q > 0) initial[g as GoodType] = q;
    });
    if (Object.keys(initial).length > 0) {
      hex.goodsBySide[anchorSide] = initial;
    }
    return hex.goodsBySide;
  }

  // Verify total sums match flat `hex.goods`; reconcile any external diff cleanly
  const layout = getHexSideLayout(state, hex.id);
  const sideSum: Partial<Record<GoodType, number>> = {};
  Object.values(hex.goodsBySide).forEach(map => {
    if (!map) return;
    Object.entries(map).forEach(([g, q]) => {
      if (q && q > 0) {
        const gt = g as GoodType;
        sideSum[gt] = (sideSum[gt] || 0) + q;
      }
    });
  });

  const allGoods = new Set<GoodType>([
    ...(Object.keys(hex.goods || {}) as GoodType[]),
    ...(Object.keys(sideSum) as GoodType[]),
  ]);

  let hadMismatch = false;
  allGoods.forEach(g => {
    const flatVal = hex.goods[g] || 0;
    const sumVal = sideSum[g] || 0;
    if (flatVal === sumVal) return;
    hadMismatch = true;
    if (flatVal > sumVal) {
      if (!hex.goodsBySide![anchorSide]) hex.goodsBySide![anchorSide] = {};
      hex.goodsBySide![anchorSide][g] = (hex.goodsBySide![anchorSide][g] || 0) + (flatVal - sumVal);
    } else {
      let toRemove = sumVal - flatVal;
      const sideKeys = [
        anchorSide,
        ...layout.sides.map(s => s.side).filter(s => s !== anchorSide),
      ];
      for (const s of sideKeys) {
        if (toRemove <= 0) break;
        const map = hex.goodsBySide![s];
        if (!map || !map[g]) continue;
        const take = Math.min(map[g] || 0, toRemove);
        map[g] = (map[g] || 0) - take;
        if (map[g]! <= 0) delete map[g];
        toRemove -= take;
      }
    }
  });

  if (hadMismatch) {
    syncHexTotalGoods(hex);
  }
  return hex.goodsBySide;
}

export function getGoodsOnSide(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side: number
): Partial<Record<GoodType, number>> {
  const hex = state.hexes[hexId];
  if (!hex) return {};
  const bySide = ensureHexGoodsBySide(state, hex);
  const norm = normalizeSideForHex(state, hexId, side);
  return bySide[norm] || {};
}

export function addGoodOnSide(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side: number,
  good: GoodType,
  amount: number
): void {
  const hex = state.hexes[hexId];
  if (!hex || amount <= 0) return;
  const bySide = ensureHexGoodsBySide(state, hex);
  const norm = normalizeSideForHex(state, hexId, side);
  if (!bySide[norm]) bySide[norm] = {};
  bySide[norm][good] = (bySide[norm][good] || 0) + amount;
  syncHexTotalGoods(hex);
}

export function removeGoodOnSide(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side: number,
  good: GoodType,
  amount: number
): number {
  const hex = state.hexes[hexId];
  if (!hex || amount <= 0) return 0;
  const bySide = ensureHexGoodsBySide(state, hex);
  const norm = normalizeSideForHex(state, hexId, side);
  const cur = bySide[norm]?.[good] || 0;
  const taken = Math.min(cur, amount);
  if (taken <= 0) return 0;
  bySide[norm][good] = cur - taken;
  if (bySide[norm][good]! <= 0) delete bySide[norm][good];
  syncHexTotalGoods(hex);
  return taken;
}

/**
 * Returns the sides on `transporter.hexId` that `transporter` can physically load/drop on.
 * - Land transporters (`donkey`/`wagon`/`truck`) and sea-docked watercraft (`waterLocation !== 'river'`):
 *   strictly their current bank side (`getTransporterSide`).
 * - River watercraft (`waterOnly` with `waterLocation === 'river'` on a split river hex):
 *   touches any bank of that river segment (`layout.sides`).
 */
export function getInteractableSidesForTransporter(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  transporter: Transporter
): number[] {
  const layout = getHexSideLayout(state, transporter.hexId);
  if (!layout.isSplit) return [0];

  const isWater =
    transporter.type === 'raft' ||
    transporter.type === 'rowboat' ||
    transporter.type === 'steamship';
  if (isWater && transporter.waterLocation === 'river') {
    return layout.sides.map(s => s.side);
  }
  return [getTransporterSide(state, transporter)];
}

// ============================================================================
// UI Visual Offsets (Legal Side of Unbridged Rivers & Barriers)
// ============================================================================

/**
 * Computes pixel offset (dx, dy) relative to hex center for UI elements:
 * - Split hexes: pushes tokens squarely onto their bank sector away from river curves,
 *   separating buildings, goods chips, and transporters along the sector's tangent so
 *   nothing collides or crosses the river line.
 * - Undivided hexes near rivers/open water: nudges land pieces slightly onto the inland side
 *   away from river strokes and water barriers, and docks watercraft toward coastal water.
 */
export function getHexSideVisualAnchor(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  hexId: string,
  side: number,
  hexRadius: number
): { dx: number; dy: number; angle: number } {
  const layout = getHexSideLayout(state, hexId);
  const normSide = normalizeSideForHex(state, hexId, side);
  const hex = state.hexes[hexId];

  if (layout.isSplit) {
    const region = layout.sides[normSide] || layout.sides[0];
    let ang = region.bisectorAngle;
    let dist = hexRadius * 0.4;

    // On wide >180° arcs, nudge gently toward accessible non-water neighbors inside that sector
    if (hex && hex.terrain !== 'water') {
      const landNbs = region.nonRiverNeighborIds.filter(
        id => state.hexes[id] && state.hexes[id].terrain !== 'water'
      );
      if (landNbs.length > 0) {
        const orientation: HexOrientation = state.hexOrientation || 'pointy';
        const c1 = hexToPixel(hex.q, hex.r, 1, orientation);
        let vx = Math.cos(ang) * 1.4;
        let vy = Math.sin(ang) * 1.4;
        for (const nbId of landNbs) {
          const nc = parseHexKey(nbId);
          const c2 = hexToPixel(nc.q, nc.r, 1, orientation);
          const na = Math.atan2(c2.y - c1.y, c2.x - c1.x);
          vx += Math.cos(na) * 0.35;
          vy += Math.sin(na) * 0.35;
        }
        const blended = normalizeAngle(Math.atan2(vy, vx));
        const off = normalizeAngle(blended - region.startAngle);
        if (off > 0.25 && off < region.span - 0.25) {
          ang = blended;
        }
      }
      if (region.span >= Math.PI * 1.2) {
        dist = hexRadius * 0.37;
      } else if (region.span <= Math.PI * 0.45) {
        dist = hexRadius * 0.45;
      }
    }

    return {
      dx: Math.cos(ang) * dist,
      dy: Math.sin(ang) * dist,
      angle: ang,
    };
  }

  // Unsplit hex: check 1-edge river source or adjacent water hexes ("other barriers")
  if (!hex) return { dx: 0, dy: 0, angle: -Math.PI / 2 };

  const orientation: HexOrientation = state.hexOrientation || 'pointy';
  const c1 = hexToPixel(hex.q, hex.r, 1, orientation);
  let awayX = 0;
  let awayY = 0;
  let hasBarrier = false;

  for (const dir of HEX_DIRECTIONS) {
    const nq = hex.q + dir.q;
    const nr = hex.r + dir.r;
    const nbId = `${nq},${nr}`;
    const edge = state.edges[getEdgeKey(hex.q, hex.r, nq, nr)];
    const nbHex = state.hexes[nbId];
    const isRiverBarrier = Boolean(edge && edge.isRiver);
    const isWaterBarrier = Boolean(hex.terrain !== 'water' && nbHex && nbHex.terrain === 'water');
    if (isRiverBarrier || isWaterBarrier) {
      const c2 = hexToPixel(nq, nr, 1, orientation);
      const a = Math.atan2(c2.y - c1.y, c2.x - c1.x);
      const weight = isRiverBarrier ? 1.2 : 0.75;
      awayX -= Math.cos(a) * weight;
      awayY -= Math.sin(a) * weight;
      hasBarrier = true;
    }
  }

  if (hasBarrier && Math.hypot(awayX, awayY) > 0.15) {
    const ang = normalizeAngle(Math.atan2(awayY, awayX));
    const dist = layout.riverExits.length === 1 ? hexRadius * 0.24 : hexRadius * 0.18;
    return {
      dx: Math.cos(ang) * dist,
      dy: Math.sin(ang) * dist,
      angle: ang,
    };
  }

  return { dx: 0, dy: 0, angle: -Math.PI / 2 };
}

/**
 * Computes water vessel visual offset:
 * - River vessel on split hex: positioned right along the river curve / center channel.
 * - Shore-docked vessel: nudged toward the bordering sea (`water`) edge on its docked side.
 * - Sea vessel: near hex center.
 */
export function getWatercraftVisualOffset(
  state: Pick<GameState, 'hexes' | 'edges' | 'hexOrientation'>,
  transporter: Transporter,
  hexRadius: number,
  indexInGroup: number = 0,
  totalInGroup: number = 1
): { dx: number; dy: number } {
  const hex = state.hexes[transporter.hexId];
  if (!hex) return { dx: 0, dy: 0 };
  const layout = getHexSideLayout(state, hex.id);

  let baseDx = 0;
  let baseDy = 0;

  if (hex.terrain !== 'water') {
    if (transporter.waterLocation === 'river' && layout.riverExits.length > 0) {
      // Float right on the river channel near midpoint toward primary river exit
      const exit = layout.riverExits[0];
      const d = layout.riverExits.length === 1 ? hexRadius * 0.35 : 0;
      baseDx = Math.cos(exit.angle) * d;
      baseDy = Math.sin(exit.angle) * d;
    } else {
      // Shore docked: pull toward the adjacent sea edge on `transporter.side`
      const side = getTransporterSide(state, transporter);
      const region = layout.sides[side] || layout.sides[0];
      const orientation: HexOrientation = state.hexOrientation || 'pointy';
      const c1 = hexToPixel(hex.q, hex.r, 1, orientation);
      const waterNbId = region.nonRiverNeighborIds.find(id => state.hexes[id]?.terrain === 'water');
      if (waterNbId) {
        const wc = parseHexKey(waterNbId);
        const c2 = hexToPixel(wc.q, wc.r, 1, orientation);
        const a = Math.atan2(c2.y - c1.y, c2.x - c1.x);
        baseDx = Math.cos(a) * (hexRadius * 0.44);
        baseDy = Math.sin(a) * (hexRadius * 0.44);
      } else {
        const anchor = getHexSideVisualAnchor(state, hex.id, side, hexRadius);
        baseDx = anchor.dx;
        baseDy = anchor.dy;
      }
    }
  }

  if (totalInGroup <= 1) {
    return { dx: baseDx, dy: baseDy };
  }
  const spreadAngle = (indexInGroup / totalInGroup) * Math.PI * 2;
  const spreadR = 13;
  return {
    dx: baseDx + Math.cos(spreadAngle) * spreadR,
    dy: baseDy + Math.sin(spreadAngle) * spreadR,
  };
}
