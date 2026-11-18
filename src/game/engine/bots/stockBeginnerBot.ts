/**
 * Stock Apprentice (Beginner AI)
 *
 * Strategy:
 * - Plans and builds a complete, independent Stock Certificate production chain:
 *   Woodcutter -> Sawmill -> Quarry -> (Woodcutter #2) -> Mine -> Paper Mill ->
 *   Coal Burner -> Royal Mint -> Stock Exchange, plus Specialized Mines research
 *   (2 Geese + 1 Paper) and supporting Roads / Bridges.
 * - Ignores Wonder brick contributions completely.
 * - Ignores other players and strictly uses only starting stock & outputs
 *   produced by its own buildings.
 * - Operates 100% within official game rules.
 */

import { BuildingType, GameState, GoodType, HexTile, Player, Transporter } from '../../types';
import { BUILDING_SPECS } from '../../constants';
import { ROADS_AND_BOATS_RULES } from '../../rules-engine';
import { getEdgeKey, parseHexKey } from '../../hexMath';
import {
  areAdjacentToWater,
  canBuildRoad,
  getAccessibleSiteMaterials,
} from '../building';
import {
  areSidesConnectedByBridgeOnHex,
  doesSideFlankRiverEdge,
  getAccessibleSidesOnHex,
  getBestAccessibleSide,
  getBuildingSide,
  getHexSideLayout,
  getMatchingBankAcrossRiverEdge,
  getNeighborSideOnHex,
  getTransporterSide,
} from '../../riverSides';
import {
  botBuildFactory,
  botBuildRoad,
  botDropGoods,
  botPickupGoods,
  botResearchTech,
  findShortestPath,
  getBotGroundGood,
  getBotOwnedGoodsTotals,
  getFreeCapacity,
  getHexDistance,
  getNeighborHexIds,
  getReachableStateSet,
  getTransporterSideEdgeExits,
  isValidHexForBuilding,
  moveTransporterToward,
} from './capabilities';

interface BuildTarget {
  buildingType: BuildingType;
  hexId: string;
  side: number;
}

interface BridgeTarget {
  hexA: string;
  hexB: string;
  anchorHexId: string;
  anchorSide: number;
}

interface ResearchSite {
  hexId: string;
  side: number;
}

function getOwnedBuildingsOfType(state: GameState, botId: string, type: BuildingType): HexTile[] {
  return Object.values(state.hexes).filter(
    h => h.building && h.building.ownerId === botId && h.building.type === type
  );
}

function countBotDepositedCostGoods(
  state: GameState,
  bot: Player,
  hexId: string,
  type: BuildingType,
  side?: number
): number {
  const cost = BUILDING_SPECS[type].cost;
  let sum = 0;
  for (const g of Object.keys(cost) as GoodType[]) {
    sum += getBotGroundGood(state, bot, hexId, g, side);
  }
  return sum;
}

function getAllBotReachableStates(state: GameState, transporters: Transporter[]): {
  reachableStates: Set<string>;
  reachableHexes: Set<string>;
} {
  const reachableStates = new Set<string>();
  const reachableHexes = new Set<string>();
  transporters.forEach(t => {
    getReachableStateSet(state, t).forEach(k => {
      reachableStates.add(k);
      const [hId] = k.split('#');
      reachableHexes.add(hId);
    });
  });
  return { reachableStates, reachableHexes };
}

function computeWalkDistanceMap(
  state: GameState,
  anchor: Transporter,
  startHexId: string,
  startSide?: number
): Map<string, number> {
  const dist = new Map<string, number>();
  if (!state.hexes[startHexId]) return dist;
  const resolvedSide =
    typeof startSide === 'number' ? startSide : getTransporterSide(state, anchor);
  const startStateKey = `${startHexId}#${resolvedSide}`;
  const visited = new Set<string>([startStateKey]);
  dist.set(startHexId, 0);
  dist.set(startStateKey, 0);
  const queue: Array<{ hexId: string; side: number; d: number }> = [
    { hexId: startHexId, side: resolvedSide, d: 0 },
  ];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const altSide of getAccessibleSidesOnHex(state, curr.hexId, curr.side)) {
      const k = `${curr.hexId}#${altSide}`;
      if (!visited.has(k)) {
        visited.add(k);
        if (!dist.has(k) || curr.d + 1 < dist.get(k)!) {
          dist.set(k, curr.d + 1);
        }
        queue.push({ hexId: curr.hexId, side: altSide, d: curr.d + 1 });
      }
    }
    for (const nb of getNeighborHexIds(state, curr.hexId)) {
      const exits = getTransporterSideEdgeExits(state, anchor, curr.hexId, curr.side, nb);
      for (const toSide of exits) {
        const k = `${nb}#${toSide}`;
        if (visited.has(k)) continue;
        visited.add(k);
        if (!dist.has(nb) || curr.d + 1 < dist.get(nb)!) {
          dist.set(nb, curr.d + 1);
        }
        if (!dist.has(k) || curr.d + 1 < dist.get(k)!) {
          dist.set(k, curr.d + 1);
        }
        queue.push({ hexId: nb, side: toSide, d: curr.d + 1 });
      }
    }
  }
  return dist;
}

function chooseBestBuildSite(
  state: GameState,
  bot: Player,
  buildingType: BuildingType,
  reachableStates: Set<string>
): { hexId: string; side: number } | null {
  const candidates: Array<{ hex: HexTile; side: number }> = [];
  reachableStates.forEach(stateKey => {
    const [hId, sideStr] = stateKey.split('#');
    const side = Number(sideStr);
    const hex = state.hexes[hId];
    if (hex && isValidHexForBuilding(state, bot, hex, buildingType, side)) {
      candidates.push({ hex, side });
    }
  });
  if (candidates.length === 0) return null;

  const anchor = Object.values(state.transporters).find(t => t.ownerId === bot.id);
  const homeDistMap = anchor ? computeWalkDistanceMap(state, anchor, bot.homeHexId) : null;
  const walkMapCache = new Map<string, Map<string, number>>();
  const walkDist = (fromHex: HexTile, toId: string, toSide?: number): number => {
    if (!anchor) return getHexDistance(fromHex.id, toId);
    const fromSide = fromHex.building ? getBuildingSide(state, fromHex) : undefined;
    const cacheKey = `${fromHex.id}#${fromSide ?? 'def'}`;
    let map = walkMapCache.get(cacheKey);
    if (!map) {
      map = computeWalkDistanceMap(state, anchor, fromHex.id, fromSide);
      walkMapCache.set(cacheKey, map);
    }
    if (typeof toSide === 'number' && map.has(`${toId}#${toSide}`)) {
      return map.get(`${toId}#${toSide}`)!;
    }
    return map.get(toId) ?? (getHexDistance(fromHex.id, toId) + 10);
  };

  const hasMine = getOwnedBuildingsOfType(state, bot.id, 'mine').length > 0;
  const hasQuarry = getOwnedBuildingsOfType(state, bot.id, 'quarry').length > 0;
  const hasPaperMill = getOwnedBuildingsOfType(state, bot.id, 'papermill').length > 0;

  const freeMountains = new Set(
    candidates.filter(c => c.hex.terrain === 'mountain').map(c => c.hex.id)
  ).size;
  const freeWaterAdj = candidates.filter(
    c =>
      c.hex.terrain !== 'water' &&
      c.hex.terrain !== 'mountain' &&
      areAdjacentToWater(state, c.hex.id, c.side)
  ).length;

  const scoreHex = (h: HexTile, s: number): number => {
    let score = 0;
    const distHome =
      homeDistMap?.get(`${h.id}#${s}`) ??
      homeDistMap?.get(h.id) ??
      getHexDistance(bot.homeHexId, h.id);
    score -= distHome * 10;

    // Slight preference for undivided hexes when equidistant
    if (getHexSideLayout(state, h.id).isSplit) {
      score -= 1;
    }

    // Strictly prefer clean hexes with no foreign loose goods
    const hasForeignGoods = (Object.keys(h.goods) as GoodType[]).some(
      g => (h.goods[g] || 0) > getBotGroundGood(state, bot, h.id, g, s)
    );
    if (hasForeignGoods) {
      score -= 500;
    }

    if (buildingType === 'quarry') {
      if (h.terrain === 'rock') score += 50;
      if (h.terrain === 'mountain' && !hasMine && freeMountains <= 1) score -= 200;
    } else if (buildingType !== 'mine' && buildingType !== 'woodcutter' && buildingType !== 'papermill') {
      if (h.terrain === 'pasture' || h.terrain === 'desert') score += 10;
      if (h.terrain === 'rock' && !hasQuarry) score -= 40;
      if (h.terrain === 'mountain' && !hasMine) score -= 120;
      if (!hasPaperMill && areAdjacentToWater(state, h.id, s) && freeWaterAdj <= 1) score -= 80;
    }

    if (buildingType === 'sawmill') {
      const woodcutters = getOwnedBuildingsOfType(state, bot.id, 'woodcutter');
      woodcutters.forEach(wc => {
        score -= walkDist(wc, h.id, s) * 8;
      });
    }

    if (buildingType === 'stockexchange') {
      const mints = getOwnedBuildingsOfType(state, bot.id, 'mint');
      const pms = getOwnedBuildingsOfType(state, bot.id, 'papermill');
      const quarries = getOwnedBuildingsOfType(state, bot.id, 'quarry');
      mints.forEach(m => {
        score -= walkDist(m, h.id, s) * 8;
      });
      pms.forEach(pm => {
        score -= walkDist(pm, h.id, s) * 6;
      });
      quarries.forEach(q => {
        score -= walkDist(q, h.id, s) * 5;
      });
    }

    if (buildingType === 'mint') {
      const mines = getOwnedBuildingsOfType(state, bot.id, 'mine');
      const burners = getOwnedBuildingsOfType(state, bot.id, 'burner');
      mines.forEach(m => {
        score -= walkDist(m, h.id, s) * 6;
      });
      burners.forEach(bu => {
        score -= walkDist(bu, h.id, s) * 6;
      });
    }

    if (buildingType === 'papermill' || buildingType === 'burner') {
      const sawmills = getOwnedBuildingsOfType(state, bot.id, 'sawmill');
      const woodcutters = getOwnedBuildingsOfType(state, bot.id, 'woodcutter');
      sawmills.forEach(sm => {
        score -= walkDist(sm, h.id, s) * 4;
      });
      woodcutters.forEach(wc => {
        score -= walkDist(wc, h.id, s) * 4;
      });
    }

    return score;
  };

  const scoredCandidates = candidates.map(c => ({
    ...c,
    staged: countBotDepositedCostGoods(state, bot, c.hex.id, buildingType, c.side),
    score: scoreHex(c.hex, c.side),
  }));

  scoredCandidates.sort((ca, cb) => {
    if (ca.staged !== cb.staged) return cb.staged - ca.staged;
    if (cb.score !== ca.score) return cb.score - ca.score;
    if (ca.hex.id !== cb.hex.id) return ca.hex.id.localeCompare(cb.hex.id);
    return ca.side - cb.side;
  });

  return { hexId: scoredCandidates[0].hex.id, side: scoredCandidates[0].side };
}

function getCoreBuildSequence(state: GameState, botId: string): BuildingType[] {
  const count = (t: BuildingType) => getOwnedBuildingsOfType(state, botId, t).length;
  const bot = state.players.find(p => p.id === botId);
  const seq: BuildingType[] = [];

  if (count('woodcutter') < 1) seq.push('woodcutter');
  if (count('sawmill') < 1) seq.push('sawmill');
  if (count('quarry') < 1) seq.push('quarry');
  if (count('papermill') < 1) seq.push('papermill');
  if (count('mine') < 1) seq.push('mine');
  if (count('burner') < 1) seq.push('burner');
  if (count('mint') < 1) seq.push('mint');

  if (bot && count('mine') >= 1 && count('stockexchange') < 1) {
    // Under finite mine rules (default pool = 3 Gold + 3 Iron), ensure Gold/Coin potential reaches >= 4 (1 Stock)
    // Only request a 2nd Mine if spare buildable land remains after Burner + Mint (and ideally Stock Exchange)
    const totals = getBotOwnedGoodsTotals(state, bot);
    const poolGold = getOwnedBuildingsOfType(state, botId, 'mine').reduce(
      (sum, h) => sum + (h.building?.minePool?.gold || 0),
      0
    );
    const goldPotential =
      (totals.gold || 0) +
      (totals.coin || 0) * 2 +
      (totals.stock || 0) * 4 +
      poolGold;
    const emptyBuildableLand = Object.values(state.hexes).filter(
      h => !h.building && h.terrain !== 'water' && h.terrain !== 'desert'
    ).length;
    const remainingCoreSlots =
      (count('burner') < 1 ? 1 : 0) +
      (count('mint') < 1 ? 1 : 0) +
      (count('stockexchange') < 1 ? 1 : 0);
    if (goldPotential < 4 && emptyBuildableLand > remainingCoreSlots) {
      seq.push('mine');
    }
  }

  if (count('stockexchange') < 1) seq.push('stockexchange');

  return seq;
}

function getExpansionBuildSequence(state: GameState, botId: string): BuildingType[] {
  const count = (t: BuildingType) => getOwnedBuildingsOfType(state, botId, t).length;
  const seq: BuildingType[] = [];

  if (count('woodcutter') < 2) seq.push('woodcutter');
  if (count('mine') < 2) seq.push('mine');
  if (count('papermill') < 2) seq.push('papermill');
  if (count('mint') < 2) seq.push('mint');
  if (count('stockexchange') < 2) seq.push('stockexchange');

  return seq;
}

function findNextBuildTargetFromSequence(
  state: GameState,
  bot: Player,
  reachableStates: Set<string>,
  seq: BuildingType[]
): BuildTarget | null {
  for (const bType of seq) {
    const pick = chooseBestBuildSite(state, bot, bType, reachableStates);
    if (pick) {
      return { buildingType: bType, hexId: pick.hexId, side: pick.side };
    }
  }
  return null;
}

function findMissingTerrainBridge(
  state: GameState,
  bot: Player,
  reachableStates: Set<string>,
  buildingType: BuildingType
): BridgeTarget | null {
  for (const stateKey of reachableStates) {
    const [hexId, sideStr] = stateKey.split('#');
    const side = Number(sideStr);
    const layout = getHexSideLayout(state, hexId);

    for (const nbId of getNeighborHexIds(state, hexId)) {
      const nbHex = state.hexes[nbId];
      if (!nbHex || nbHex.terrain === 'water') continue;

      const c1 = parseHexKey(hexId);
      const c2 = parseHexKey(nbId);
      const edge = state.edges[getEdgeKey(c1.q, c1.r, c2.q, c2.r)];
      if (!edge || !edge.isRiver || edge.improvement === 'bridge') continue;
      if (!doesSideFlankRiverEdge(state, hexId, side, edge.id)) continue;

      const matchingOtherSide = getMatchingBankAcrossRiverEdge(state, hexId, side, nbId);
      if (!reachableStates.has(`${nbId}#${matchingOtherSide}`) &&
          isValidHexForBuilding(state, bot, nbHex, buildingType, matchingOtherSide)) {
        return { hexA: hexId, hexB: nbId, anchorHexId: hexId, anchorSide: side };
      }

      // Or bridging this flanking river unlocks the opposite bank inside `hexId` itself
      if (layout.isSplit && state.hexes[hexId]) {
        for (const region of layout.sides) {
          if (
            region.flankingRiverEdgeIds.includes(edge.id) &&
            !reachableStates.has(`${hexId}#${region.side}`) &&
            isValidHexForBuilding(state, bot, state.hexes[hexId], buildingType, region.side)
          ) {
            return { hexA: hexId, hexB: nbId, anchorHexId: hexId, anchorSide: side };
          }
        }
      }
    }
  }
  return null;
}

function findBridgeForUnreachableGoods(
  state: GameState,
  bot: Player,
  reachableStates: Set<string>,
  neededGoods: GoodType[]
): BridgeTarget | null {
  if (neededGoods.length === 0) return null;

  // Check if any needed good exists on a ground side outside reachableStates
  const hasUnreachableGood = Object.keys(state.hexes).some(hexId => {
    const layout = getHexSideLayout(state, hexId);
    return layout.sides.some(
      region =>
        !reachableStates.has(`${hexId}#${region.side}`) &&
        neededGoods.some(g => getBotGroundGood(state, bot, hexId, g, region.side) > 0)
    );
  });
  if (!hasUnreachableGood) return null;

  for (const stateKey of reachableStates) {
    const [hexId, sideStr] = stateKey.split('#');
    const side = Number(sideStr);
    const layout = getHexSideLayout(state, hexId);

    for (const nbId of getNeighborHexIds(state, hexId)) {
      const nbHex = state.hexes[nbId];
      if (!nbHex || nbHex.terrain === 'water') continue;

      const c1 = parseHexKey(hexId);
      const c2 = parseHexKey(nbId);
      const edge = state.edges[getEdgeKey(c1.q, c1.r, c2.q, c2.r)];
      if (!edge || !edge.isRiver || edge.improvement === 'bridge') continue;
      if (!doesSideFlankRiverEdge(state, hexId, side, edge.id)) continue;

      const matchingOtherSide = getMatchingBankAcrossRiverEdge(state, hexId, side, nbId);
      if (!reachableStates.has(`${nbId}#${matchingOtherSide}`)) {
        return { hexA: hexId, hexB: nbId, anchorHexId: hexId, anchorSide: side };
      }

      if (layout.isSplit) {
        for (const region of layout.sides) {
          if (
            region.flankingRiverEdgeIds.includes(edge.id) &&
            !reachableStates.has(`${hexId}#${region.side}`)
          ) {
            return { hexA: hexId, hexB: nbId, anchorHexId: hexId, anchorSide: side };
          }
        }
      }
    }
  }
  return null;
}

function findResearchSite(state: GameState, bot: Player): ResearchSite | null {
  if (bot.unlockedTechs?.includes('specialized_mines')) return null;

  let bestSite: ResearchSite | null = null;
  let bestCount = 0;

  const hexIds = new Set<string>([
    bot.homeHexId,
    ...Object.keys(bot.aiOwnedGoodsBySide || {}),
    ...Object.keys(bot.aiOwnedGoods || {}),
  ]);

  hexIds.forEach(hexId => {
    if (!state.hexes[hexId]) return;
    const layout = getHexSideLayout(state, hexId);
    const seenSide = new Set<number>();

    for (const region of layout.sides) {
      if (seenSide.has(region.side)) continue;
      const accList = Array.from(getAccessibleSidesOnHex(state, hexId, region.side)).sort(
        (a, b) => a - b
      );
      accList.forEach(s => seenSide.add(s));
      const accSet = new Set(accList);

      const groundGeese = getBotGroundGood(state, bot, hexId, 'goose', accList[0]);
      const localTransporters = Object.values(state.transporters).filter(
        t => t.ownerId === bot.id && t.hexId === hexId && accSet.has(getTransporterSide(state, t))
      );
      const carriedGeese = localTransporters.reduce((s, t) => s + (t.cargo.goose || 0), 0);
      const total = groundGeese + carriedGeese;
      if (total > bestCount) {
        bestCount = total;
        const repSide = localTransporters[0]
          ? getTransporterSide(state, localTransporters[0])
          : accList[0];
        bestSite = { hexId, side: repSide };
      }
    }
  });

  return bestCount >= 2 ? bestSite : null;
}

function getBuildRemainingNeeds(
  state: GameState,
  bot: Player,
  target: BuildTarget
): Partial<Record<GoodType, number>> {
  const spec = BUILDING_SPECS[target.buildingType];
  const needs: Partial<Record<GoodType, number>> = {};
  const accSides = getAccessibleSidesOnHex(state, target.hexId, target.side);

  for (const [mat, reqQty] of Object.entries(spec.cost)) {
    const g = mat as GoodType;
    const req = reqQty || 0;
    const onGround = getBotGroundGood(state, bot, target.hexId, g, target.side);
    const carriedAtSite = Object.values(state.transporters)
      .filter(
        t =>
          t.ownerId === bot.id &&
          t.hexId === target.hexId &&
          accSides.has(getTransporterSide(state, t))
      )
      .reduce((sum, t) => sum + (t.cargo[g] || 0), 0);
    const rem = Math.max(0, req - onGround - carriedAtSite);
    if (rem > 0) {
      needs[g] = rem;
    }
  }

  return needs;
}

function getTotalBuildingCostCount(type: BuildingType): number {
  return Object.values(BUILDING_SPECS[type].cost).reduce((s, q) => s + (q || 0), 0);
}

function findBestPickupSourceForGoods(
  state: GameState,
  bot: Player,
  transporter: Transporter,
  goodsPriority: GoodType[],
  excludedHexId?: string,
  destHexId?: string
): { hexId: string; side: number; good: GoodType; distance: number } | null {
  let best: { hexId: string; side: number; good: GoodType; distance: number; score: number } | null = null;
  const tSide = getTransporterSide(state, transporter);

  for (const good of goodsPriority) {
    const candidateHexes = new Set<string>();
    const targetSideByHex: Record<string, number[]> = {};
    Object.keys(state.hexes).forEach(hexId => {
      if (hexId === excludedHexId) return;
      if (!(bot.aiOwnedGoods?.[hexId]?.[good] || 0) && !bot.aiOwnedGoodsBySide?.[hexId]) return;
      const validSides: number[] = [];
      if (hexId === transporter.hexId) {
        if (getBotGroundGood(state, bot, hexId, good, tSide) > 0) {
          validSides.push(tSide);
        }
      } else {
        const layout = getHexSideLayout(state, hexId);
        for (const region of layout.sides) {
          if (getBotGroundGood(state, bot, hexId, good, region.side) > 0) {
            validSides.push(region.side);
          }
        }
      }
      if (validSides.length > 0) {
        candidateHexes.add(hexId);
        targetSideByHex[hexId] = validSides;
      }
    });
    if (candidateHexes.size === 0) continue;

    const path = findShortestPath(state, transporter, candidateHexes, targetSideByHex);
    if (path) {
      const returnDist = destHexId ? getHexDistance(path.targetHexId, destHexId) : 0;
      const totalScore = path.distance * 2 + returnDist;
      if (!best || totalScore < best.score) {
        best = {
          hexId: path.targetHexId,
          side: path.targetSide,
          good,
          distance: path.distance,
          score: totalScore,
        };
      }
    }
  }

  return best
    ? { hexId: best.hexId, side: best.side, good: best.good, distance: best.distance }
    : null;
}

function unloadCompletedDeliveries(
  state: GameState,
  bot: Player,
  t: Transporter,
  activeBuildTarget: BuildTarget | null,
  researchSite: ResearchSite | null,
  intendedDestHexId?: string,
  allowFactoryDrop: boolean = true
): void {
  const hex = state.hexes[t.hexId];
  if (!hex) return;

  const tSide = getTransporterSide(state, t);

  // 1. Building delivery site: drop any needed building materials onto the build hex (if on accessible side)
  if (
    activeBuildTarget &&
    t.hexId === activeBuildTarget.hexId &&
    areSidesConnectedByBridgeOnHex(state, t.hexId, tSide, activeBuildTarget.side)
  ) {
    const spec = BUILDING_SPECS[activeBuildTarget.buildingType];
    for (const [mat, reqQty] of Object.entries(spec.cost)) {
      const g = mat as GoodType;
      const carried = t.cargo[g] || 0;
      const groundAtSite = getBotGroundGood(state, bot, activeBuildTarget.hexId, g, activeBuildTarget.side);
      const neededOnSite = Math.max(0, (reqQty || 0) - groundAtSite);
      if (carried > 0 && neededOnSite > 0) {
        const dropAmt = Math.min(carried, neededOnSite);
        botDropGoods(state, bot, t, g, dropAmt);
      }
    }
  }

  // 2. Research site delivery: drop paper if 2 geese are here waiting for BUILDING phase
  if (
    researchSite &&
    t.hexId === researchSite.hexId &&
    areSidesConnectedByBridgeOnHex(state, t.hexId, tSide, researchSite.side) &&
    (t.cargo.paper || 0) > 0
  ) {
    const groundPaper = getBotGroundGood(state, bot, researchSite.hexId, 'paper', researchSite.side);
    if (groundPaper < 1) {
      botDropGoods(state, bot, t, 'paper', 1);
    }
  }

  if (!allowFactoryDrop) return;

  // 3. Factory input deliveries (strictly onto buildings owned by this bot AND accessible on same bank side)
  // Do NOT accidentally dump wood onto an intermediate factory hex while walking through toward ANOTHER wood-using factory
  const destBuildingType = intendedDestHexId ? state.hexes[intendedDestHexId]?.building?.type : undefined;
  const headingToWoodRefinery =
    destBuildingType === 'sawmill' || destBuildingType === 'burner' || destBuildingType === 'papermill';
  const arrivedAtIntended = !intendedDestHexId || t.hexId === intendedDestHexId;
  if (
    hex.building &&
    hex.building.ownerId === bot.id &&
    areSidesConnectedByBridgeOnHex(state, hex.id, tSide, getBuildingSide(state, hex))
  ) {
    const bSide = getBuildingSide(state, hex);
    const bType = hex.building.type;
    const canDropWoodHere = arrivedAtIntended || !headingToWoodRefinery;
    if (bType === 'sawmill' && (t.cargo.wood || 0) > 0 && canDropWoodHere) {
      botDropGoods(state, bot, t, 'wood', t.cargo.wood!);
    } else if (bType === 'burner') {
      if ((t.cargo.wood || 0) > 0 && canDropWoodHere) {
        const curFuelFeed =
          getBotGroundGood(state, bot, hex.id, 'wood', bSide) +
          getBotGroundGood(state, bot, hex.id, 'boards', bSide);
        const drop = Math.min(t.cargo.wood!, Math.max(0, 2 - curFuelFeed));
        if (drop > 0) botDropGoods(state, bot, t, 'wood', drop);
      }
      if (
        (t.cargo.boards || 0) > 0 &&
        (!activeBuildTarget || activeBuildTarget.hexId !== hex.id) &&
        getOwnedBuildingsOfType(state, bot.id, 'mint').length > 0
      ) {
        botDropGoods(state, bot, t, 'boards', t.cargo.boards!);
      }
    } else if (bType === 'papermill') {
      if ((t.cargo.wood || 0) > 0) {
        const curPaperFeed =
          getBotGroundGood(state, bot, hex.id, 'wood', bSide) +
          getBotGroundGood(state, bot, hex.id, 'boards', bSide);
        const drop = Math.min(t.cargo.wood!, Math.max(0, 2 - curPaperFeed));
        if (drop > 0) botDropGoods(state, bot, t, 'wood', drop);
      }
      if (
        (t.cargo.boards || 0) > 0 &&
        getBotGroundGood(state, bot, hex.id, 'boards', bSide) +
          getBotGroundGood(state, bot, hex.id, 'wood', bSide) < 2 &&
        (!activeBuildTarget || !(activeBuildTarget.buildingType in BUILDING_SPECS && BUILDING_SPECS[activeBuildTarget.buildingType].cost.boards))
      ) {
        botDropGoods(state, bot, t, 'boards', Math.min(t.cargo.boards!, 2));
      }
    } else if (arrivedAtIntended && bType === 'mint') {
      if ((t.cargo.gold || 0) > 0) botDropGoods(state, bot, t, 'gold', t.cargo.gold!);
      if ((t.cargo.fuel || 0) > 0) botDropGoods(state, bot, t, 'fuel', t.cargo.fuel!);
    } else if (arrivedAtIntended && bType === 'stockexchange') {
      if ((t.cargo.coin || 0) > 0) botDropGoods(state, bot, t, 'coin', t.cargo.coin!);
      if ((t.cargo.paper || 0) > 0 && !researchSite) {
        botDropGoods(state, bot, t, 'paper', t.cargo.paper!);
      }
    }
  }
}

function collectCriticalOutputsOnCurrentHex(
  state: GameState,
  bot: Player,
  t: Transporter,
  researchSite: ResearchSite | null,
  canCollectCoinsDirect: boolean = false
): void {
  if (getFreeCapacity(t) <= 0) return;
  const tSide = getTransporterSide(state, t);

  // Always pick up Stock Certificates immediately (+120 VP in cargo!) if accessible on this side
  while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'stock', tSide) > 0) {
    if (!botPickupGoods(state, bot, t, 'stock', 1)) break;
  }

  const hex = state.hexes[t.hexId];
  const sameSideBuilding =
    hex?.building &&
    hex.building.ownerId === bot.id &&
    areSidesConnectedByBridgeOnHex(state, hex.id, tSide, getBuildingSide(state, hex));
  const buildingType = sameSideBuilding ? hex!.building!.type : null;
  const hasStockExchange = getOwnedBuildingsOfType(state, bot.id, 'stockexchange').length > 0;

  // Pick up Coin from Mint when Stock Exchange exists OR as direct Coin VP (40 VP) if SE is unbuildable / endgame
  if (buildingType === 'mint' && (hasStockExchange || canCollectCoinsDirect)) {
    while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'coin', tSide) > 0) {
      if (!botPickupGoods(state, bot, t, 'coin', 1)) break;
    }
  }

  // Pick up Paper from Paper Mill only when actively needed for Research or Stock Exchange
  if (buildingType === 'papermill' && (researchSite || hasStockExchange)) {
    const carriedPaperTotal = Object.values(state.transporters)
      .filter(tr => tr.ownerId === bot.id)
      .reduce((s, tr) => s + (tr.cargo.paper || 0), 0);
    if ((researchSite && carriedPaperTotal < 1) || hasStockExchange) {
      while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'paper', tSide) > 0) {
        if (!botPickupGoods(state, bot, t, 'paper', 1)) break;
        if (!hasStockExchange) break; // Only 1 paper needed for research
      }
    }
  }
}

function tryLoadBuildMaterialsOnCurrentHex(
  state: GameState,
  bot: Player,
  t: Transporter,
  buildTarget: BuildTarget,
  remaining: Partial<Record<GoodType, number>>,
  alreadyCarriedElsewhere: Partial<Record<GoodType, number>>
): boolean {
  if (t.hexId === buildTarget.hexId) return false;
  const neededGoods = Object.keys(remaining) as GoodType[];
  const tSide = getTransporterSide(state, t);
  let pickedAny = false;

  while (getFreeCapacity(t) > 0) {
    let picked = false;
    for (const g of neededGoods) {
      const stillNeed = (remaining[g] || 0) - (alreadyCarriedElsewhere[g] || 0);
      if (stillNeed <= 0) continue;
      if (getBotGroundGood(state, bot, t.hexId, g, tSide) > 0) {
        if (botPickupGoods(state, bot, t, g, 1)) {
          alreadyCarriedElsewhere[g] = (alreadyCarriedElsewhere[g] || 0) + 1;
          picked = true;
          pickedAny = true;
          break;
        }
      }
    }
    if (!picked) break;
  }

  return pickedAny;
}

function assignBuildTask(
  state: GameState,
  bot: Player,
  t: Transporter,
  buildTarget: BuildTarget,
  localPickupOnly: boolean = false
): { targets: Set<string>; sideMap?: Record<string, number> } | null {
  const remaining = getBuildRemainingNeeds(state, bot, buildTarget);
  const neededGoods = Object.keys(remaining) as GoodType[];

  if (neededGoods.length === 0) {
    const buildersAtSite = Object.values(state.transporters).filter(
      tr =>
        tr.ownerId === bot.id &&
        tr.hexId === buildTarget.hexId &&
        areSidesConnectedByBridgeOnHex(state, buildTarget.hexId, getTransporterSide(state, tr), buildTarget.side)
    );
    if (buildersAtSite.length === 0 || buildersAtSite[0].id === t.id) {
      return {
        targets: new Set([buildTarget.hexId]),
        sideMap: { [buildTarget.hexId]: buildTarget.side },
      };
    }
    return null;
  }

  if (neededGoods.some(g => (t.cargo[g] || 0) > 0)) {
    const alreadyCarriedElsewhere: Partial<Record<GoodType, number>> = {};
    Object.values(state.transporters).forEach(other => {
      if (other.ownerId === bot.id && other.id !== t.id && other.hexId !== buildTarget.hexId) {
        neededGoods.forEach(g => {
          if (other.cargo[g]) {
            alreadyCarriedElsewhere[g] = (alreadyCarriedElsewhere[g] || 0) + (other.cargo[g] || 0);
          }
        });
      }
    });
    tryLoadBuildMaterialsOnCurrentHex(state, bot, t, buildTarget, remaining, alreadyCarriedElsewhere);
    return {
      targets: new Set([buildTarget.hexId]),
      sideMap: { [buildTarget.hexId]: buildTarget.side },
    };
  }

  const alreadyCarriedElsewhere: Partial<Record<GoodType, number>> = {};
  Object.values(state.transporters).forEach(other => {
    if (other.ownerId === bot.id && other.hexId !== buildTarget.hexId) {
      neededGoods.forEach(g => {
        if (other.cargo[g]) {
          alreadyCarriedElsewhere[g] = (alreadyCarriedElsewhere[g] || 0) + (other.cargo[g] || 0);
        }
      });
    }
  });

  if (tryLoadBuildMaterialsOnCurrentHex(state, bot, t, buildTarget, remaining, alreadyCarriedElsewhere)) {
    return {
      targets: new Set([buildTarget.hexId]),
      sideMap: { [buildTarget.hexId]: buildTarget.side },
    };
  }

  if (localPickupOnly) return null;

  // Only send THIS empty transporter to fetch build materials if remaining needs aren't already in transit
  if (getFreeCapacity(t) > 0) {
    const stillNeededList = neededGoods.filter(
      g => (remaining[g] || 0) - (alreadyCarriedElsewhere[g] || 0) > 0
    );
    if (stillNeededList.length > 0) {
      const src = findBestPickupSourceForGoods(state, bot, t, stillNeededList, buildTarget.hexId);
      if (src) {
        return {
          targets: new Set([src.hexId]),
          sideMap: { [src.hexId]: src.side },
        };
      }
    }
  }

  return null;
}

function getTransporterCargoCount(t: Transporter): number {
  return Object.values(t.cargo).reduce((s, q) => s + (q || 0), 0);
}

function runMovementPhase(state: GameState, bot: Player): void {
  const transporters = Object.values(state.transporters).filter(t => t.ownerId === bot.id);
  if (transporters.length === 0) return;

  const { reachableStates } = getAllBotReachableStates(state, transporters);

  const ownedTotals = getBotOwnedGoodsTotals(state, bot);
  const researchSite = findResearchSite(state, bot);

  const coreSeq = getCoreBuildSequence(state, bot.id);
  const coreBuildTarget = findNextBuildTargetFromSequence(state, bot, reachableStates, coreSeq);
  const hasSecuredFirstStock =
    (ownedTotals.stock || 0) > 0 ||
    Object.values(state.transporters).some(tr => tr.ownerId === bot.id && (tr.cargo.stock || 0) > 0);
  const expansionBuildTarget =
    coreSeq.length === 0 && hasSecuredFirstStock
      ? findNextBuildTargetFromSequence(state, bot, reachableStates, getExpansionBuildSequence(state, bot.id))
      : null;
  const activeBuildTarget = coreBuildTarget || expansionBuildTarget;

  let bridgeTarget: BridgeTarget | null = null;
  if (coreSeq.length > 0 && !coreBuildTarget) {
    for (const bType of coreSeq) {
      bridgeTarget = findMissingTerrainBridge(state, bot, reachableStates, bType);
      if (bridgeTarget) break;
    }
  } else if (coreBuildTarget) {
    // Check if required remaining materials for coreBuildTarget are completely unreachable across unbridged rivers
    const remNeeds = getBuildRemainingNeeds(state, bot, coreBuildTarget);
    const missingGoods = Object.keys(remNeeds) as GoodType[];
    if (missingGoods.length > 0) {
      const carriedMissing = missingGoods.some(g =>
        transporters.some(tr => (tr.cargo[g] || 0) > 0)
      );
      const anyReachableSource = transporters.some(
        tr => findBestPickupSourceForGoods(state, bot, tr, missingGoods, coreBuildTarget.hexId) !== null
      );
      if (!carriedMissing && !anyReachableSource) {
        bridgeTarget = findBridgeForUnreachableGoods(state, bot, reachableStates, missingGoods);
      }
    }
  }

  const mintHexes = getOwnedBuildingsOfType(state, bot.id, 'mint');
  const stockExHexes = getOwnedBuildingsOfType(state, bot.id, 'stockexchange');
  const sawmillHexes = getOwnedBuildingsOfType(state, bot.id, 'sawmill');
  const paperMillHexes = getOwnedBuildingsOfType(state, bot.id, 'papermill');
  const burnerHexes = getOwnedBuildingsOfType(state, bot.id, 'burner');

  const stockExchangeBuilt = stockExHexes.length > 0;
  const playerCountKey = Math.max(1, Math.min(4, state.players.length)) as 1 | 2 | 3 | 4;
  const endGameBrickIdx =
    ROADS_AND_BOATS_RULES.wonderRules.endGameBrickIndexByPlayerCount[playerCountKey];
  const totalBricksNow = state.wonder.reduce((s, tier) => s + tier.bricks.length, 0);
  const totalCapacityLeft = Math.max(
    0,
    state.wonder.reduce((s, tier) => s + (tier.totalSlots - tier.bricks.length), 0)
  );
  const neutralRoundsLeft = Math.max(
    0,
    ROADS_AND_BOATS_RULES.wonderRules.maxNeutralBricksTurnLimit - (state.neutralBricksUsed || 0)
  );
  const brickRoundsLeft =
    endGameBrickIdx !== null ? Math.max(0, endGameBrickIdx - totalBricksNow) : 99;
  const wonderRoundsLeft = Math.min(brickRoundsLeft, neutralRoundsLeft, totalCapacityLeft);
  const effectiveRoundsLeft = Math.min(state.maxRounds - state.round + 1, wonderRoundsLeft);
  const isFinalRound = effectiveRoundsLeft <= 1;

  const stockExchangePossible =
    stockExchangeBuilt || chooseBestBuildSite(state, bot, 'stockexchange', reachableStates) !== null;
  const canCollectCoinsDirect =
    !stockExchangeBuilt && (!stockExchangePossible || isFinalRound);
  const canCollectGoldDirect =
    (mintHexes.length === 0 && !coreBuildTarget) || isFinalRound;

  let reservedSeCoin = 0;
  let reservedSePaper = 0;
  let reservedMintGold = 0;
  let reservedMintFuel = 0;
  let reservedBuildJobs = 0;
  const reservedWoodByDest: Record<string, number> = {};

  // Pre-pass: unload already-completed build/research items and grab free critical outputs on current hex
  for (const t of transporters) {
    if (isFinalRound) {
      // Drop 0-VP materials in the final round so transporters can scoop loose Stock/Coin/Gold
      const cargoTypes = Object.keys(t.cargo) as GoodType[];
      for (const g of cargoTypes) {
        const qty = t.cargo[g] || 0;
        if (qty > 0 && g !== 'stock' && g !== 'coin' && g !== 'gold' && g !== 'goose') {
          botDropGoods(state, bot, t, g, qty);
        }
      }
      collectCriticalOutputsOnCurrentHex(state, bot, t, null, true);
    } else {
      unloadCompletedDeliveries(state, bot, t, activeBuildTarget, researchSite, undefined, false);
      collectCriticalOutputsOnCurrentHex(state, bot, t, researchSite, canCollectCoinsDirect);
    }
  }

  const handledIds = new Set<string>();

  const processTransporter = (t: Transporter, localPickupOnly: boolean): boolean => {
    const tSide = getTransporterSide(state, t);
    let targetSet: Set<string> | null = null;
    let targetSideMap: Record<string, number> | undefined = undefined;
    let plannedPickup: { hexId: string; side: number; good: GoodType; destHexId: string; destSide?: number; maxAmount?: number } | null = null;
    const setTarget = (targets: Set<string>, sideMap?: Record<string, number>) => {
      targetSet = targets;
      targetSideMap = sideMap;
    };

    // 1. Highest priority: Pick up any loose Stock Certificate (+120 VP)
    if (!targetSet && getFreeCapacity(t) > 0) {
      const stockSrc = findBestPickupSourceForGoods(state, bot, t, ['stock']);
      if (stockSrc && (!localPickupOnly || stockSrc.distance === 0)) {
        if (stockSrc.distance === 0) {
          while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'stock', tSide) > 0) {
            if (!botPickupGoods(state, bot, t, 'stock', 1)) break;
          }
        } else {
          setTarget(new Set([stockSrc.hexId]), { [stockSrc.hexId]: stockSrc.side });
          plannedPickup = { hexId: stockSrc.hexId, side: stockSrc.side, good: 'stock', destHexId: stockSrc.hexId, destSide: stockSrc.side, maxAmount: getFreeCapacity(t) };
        }
      }
    }

    if (!isFinalRound) {
    // 2. Specialized Mines Research (1 Paper -> hex/side with 2 Geese)
    if (!targetSet && researchSite && (ownedTotals.paper || 0) >= 1) {
      const accRes = getAccessibleSidesOnHex(state, researchSite.hexId, researchSite.side);
      const paperAlreadyAtResearch =
        getBotGroundGood(state, bot, researchSite.hexId, 'paper', researchSite.side) +
        Object.values(state.transporters)
          .filter(
            tr =>
              tr.ownerId === bot.id &&
              tr.hexId === researchSite.hexId &&
              accRes.has(getTransporterSide(state, tr))
          )
          .reduce((s, tr) => s + (tr.cargo.paper || 0), 0);

      if (paperAlreadyAtResearch < 1) {
        if ((t.cargo.paper || 0) >= 1) {
          setTarget(new Set([researchSite.hexId]), { [researchSite.hexId]: researchSite.side });
        } else if (getFreeCapacity(t) > 0) {
          const paperSrc = findBestPickupSourceForGoods(state, bot, t, ['paper'], undefined, researchSite.hexId);
          if (paperSrc && (!localPickupOnly || paperSrc.distance === 0)) {
            if (paperSrc.distance === 0) {
              botPickupGoods(state, bot, t, 'paper', 1);
              setTarget(new Set([researchSite.hexId]), { [researchSite.hexId]: researchSite.side });
            } else {
              setTarget(new Set([paperSrc.hexId]), { [paperSrc.hexId]: paperSrc.side });
              plannedPickup = {
                hexId: paperSrc.hexId,
                side: paperSrc.side,
                good: 'paper',
                destHexId: researchSite.hexId,
                destSide: researchSite.side,
                maxAmount: 1,
              };
            }
          }
        }
      }
    }

    // 3a. Core Stock-Chain Construction (or Bridge if needed terrain / needed materials are across an unbridged river)
    const mintSide0 = mintHexes.length > 0 ? getBuildingSide(state, mintHexes[0]) : 0;
    const mintNeedsKickstart =
      mintHexes.length > 0 &&
      !stockExchangeBuilt &&
      getBotGroundGood(state, bot, mintHexes[0].id, 'gold', mintSide0) +
        getBotGroundGood(state, bot, mintHexes[0].id, 'coin', mintSide0) * 2 < 4;
    const carryingBuildMat =
      coreBuildTarget &&
      Object.keys(getBuildRemainingNeeds(state, bot, coreBuildTarget)).some(
        g => (t.cargo[g as GoodType] || 0) > 0
      );
    const skipForMintParallel =
      coreBuildTarget?.buildingType === 'stockexchange' &&
      mintNeedsKickstart &&
      !carryingBuildMat &&
      reservedBuildJobs >= 2;

    if (!targetSet && bridgeTarget && (!coreBuildTarget || (!carryingBuildMat && reservedBuildJobs === 0))) {
      if ((t.cargo.boards || 0) >= 2) {
        setTarget(new Set([bridgeTarget.anchorHexId]), { [bridgeTarget.anchorHexId]: bridgeTarget.anchorSide });
      } else if (getFreeCapacity(t) > 0) {
        const src = findBestPickupSourceForGoods(state, bot, t, ['boards'], undefined, bridgeTarget.anchorHexId);
        if (src && (!localPickupOnly || src.distance === 0)) {
          if (src.distance === 0) {
            botPickupGoods(state, bot, t, 'boards', 1);
            setTarget(new Set([bridgeTarget.anchorHexId]), { [bridgeTarget.anchorHexId]: bridgeTarget.anchorSide });
          } else {
            setTarget(new Set([src.hexId]), { [src.hexId]: src.side });
            plannedPickup = {
              hexId: src.hexId,
              side: src.side,
              good: 'boards',
              destHexId: bridgeTarget.anchorHexId,
              destSide: bridgeTarget.anchorSide,
            };
          }
        }
      }
    }

    if (!targetSet && coreBuildTarget && !skipForMintParallel) {
      const task = assignBuildTask(state, bot, t, coreBuildTarget, localPickupOnly);
      if (task) {
        setTarget(task.targets, task.sideMap);
        reservedBuildJobs += 1;
      }
    }

    // 3b. Parallel Mint Kickstart: leftover Stage-3 transporters feed Gold/Fuel to Mint while Stock Exchange is being built
    if (!targetSet && !localPickupOnly && mintHexes.length > 0 && !stockExchangeBuilt) {
      const mint = mintHexes[0];
      const mintSide = getBuildingSide(state, mint);
      const goldAtMint = getBotGroundGood(state, bot, mint.id, 'gold', mintSide);
      const fuelAtMint = getBotGroundGood(state, bot, mint.id, 'fuel', mintSide);
      const coinsAtMint = getBotGroundGood(state, bot, mint.id, 'coin', mintSide);
      const carriedGold = Object.values(state.transporters)
        .filter(tr => tr.ownerId === bot.id)
        .reduce((s, tr) => s + (tr.cargo.gold || 0), 0);
      const carriedFuel = Object.values(state.transporters)
        .filter(tr => tr.ownerId === bot.id)
        .reduce((s, tr) => s + (tr.cargo.fuel || 0), 0);

      if ((t.cargo.gold || 0) > 0 || (t.cargo.fuel || 0) > 0) {
        setTarget(new Set([mint.id]), { [mint.id]: mintSide });
      } else if (getFreeCapacity(t) > 0 && goldAtMint + coinsAtMint * 2 < 4) {
        const fuelCovered = fuelAtMint + coinsAtMint + carriedFuel + reservedMintFuel;
        const goldCovered = goldAtMint + coinsAtMint * 2 + carriedGold + reservedMintGold;
        const wanted: GoodType[] = [];
        if (fuelCovered < 1) {
          wanted.push('fuel');
        } else if (goldCovered < 2) {
          wanted.push('gold');
        } else if (fuelCovered < 2) {
          wanted.push('fuel');
        } else if (goldCovered < 4) {
          wanted.push('gold');
        }
        if (wanted.length > 0) {
          const src = findBestPickupSourceForGoods(state, bot, t, wanted, mint.id, mint.id);
          if (src && (!localPickupOnly || src.distance === 0)) {
            if (src.good === 'gold') reservedMintGold += 2;
            if (src.good === 'fuel') reservedMintFuel += 1;
            if (src.distance === 0) {
              while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, src.good, tSide) > 0) {
                if (!botPickupGoods(state, bot, t, src.good, 1)) break;
              }
              setTarget(new Set([mint.id]), { [mint.id]: mintSide });
            } else {
              setTarget(new Set([src.hexId]), { [src.hexId]: src.side });
              plannedPickup = {
                hexId: src.hexId,
                side: src.side,
                good: src.good,
                destHexId: mint.id,
                destSide: mintSide,
                maxAmount: src.good === 'fuel' ? 1 : 2,
              };
            }
          }
        }
      }
    }

    // 3c. Pre-stage minted Coins on an idle Stage-3 donkey toward upcoming Stock Exchange site
    if (!targetSet && !localPickupOnly && mintHexes.length > 0 && !stockExchangeBuilt && coreBuildTarget?.buildingType === 'stockexchange') {
      const seSite = coreBuildTarget.hexId;
      const seSide = coreBuildTarget.side;
      if ((t.cargo.coin || 0) > 0) {
        while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'coin', tSide) > 0) {
          if (!botPickupGoods(state, bot, t, 'coin', 1)) break;
        }
        setTarget(new Set([seSite]), { [seSite]: seSide });
      } else if (getFreeCapacity(t) > 0) {
        const carriedCoin = Object.values(state.transporters)
          .filter(tr => tr.ownerId === bot.id)
          .reduce((s, tr) => s + (tr.cargo.coin || 0), 0);
        if (carriedCoin + reservedSeCoin < 2) {
          const coinSrc = findBestPickupSourceForGoods(state, bot, t, ['coin'], seSite, seSite);
          if (coinSrc && (!localPickupOnly || coinSrc.distance === 0)) {
            reservedSeCoin += 2;
            if (coinSrc.distance === 0) {
              while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'coin', tSide) > 0) {
                if (!botPickupGoods(state, bot, t, 'coin', 1)) break;
              }
              setTarget(new Set([seSite]), { [seSite]: seSide });
            } else {
              setTarget(new Set([coinSrc.hexId]), { [coinSrc.hexId]: coinSrc.side });
              plannedPickup = { hexId: coinSrc.hexId, side: coinSrc.side, good: 'coin', destHexId: seSite, destSide: seSide, maxAmount: 2 };
            }
          }
        }
      }
    }

    // 4. Stock Exchange inputs (Coins + Paper) with cross-transporter reservation
    const stockExHasEnoughCoins =
      stockExchangeBuilt &&
      getBotGroundGood(state, bot, stockExHexes[0].id, 'coin', getBuildingSide(state, stockExHexes[0])) >= 2;
    const stockExNeedsPaperNow =
      stockExchangeBuilt &&
      (ownedTotals.paper || 0) === 0 &&
      getBotGroundGood(state, bot, stockExHexes[0].id, 'paper', getBuildingSide(state, stockExHexes[0])) === 0 &&
      paperMillHexes.length > 0 &&
      getBotGroundGood(state, bot, paperMillHexes[0].id, 'wood', getBuildingSide(state, paperMillHexes[0])) +
        getBotGroundGood(state, bot, paperMillHexes[0].id, 'boards', getBuildingSide(state, paperMillHexes[0])) < 2;

    if (!targetSet && stockExchangeBuilt) {
      const se = stockExHexes[0];
      const seSide = getBuildingSide(state, se);
      if ((t.cargo.coin || 0) > 0) {
        while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'coin', tSide) > 0) {
          if (!botPickupGoods(state, bot, t, 'coin', 1)) break;
        }
        setTarget(new Set([se.id]), { [se.id]: seSide });
      } else if ((t.cargo.paper || 0) > 0 && !researchSite) {
        setTarget(new Set([se.id]), { [se.id]: seSide });
      } else if (getFreeCapacity(t) > 0) {
        const carriedCoin = Object.values(state.transporters)
          .filter(tr => tr.ownerId === bot.id)
          .reduce((s, tr) => s + (tr.cargo.coin || 0), 0);
        const carriedPaper = Object.values(state.transporters)
          .filter(tr => tr.ownerId === bot.id)
          .reduce((s, tr) => s + (tr.cargo.paper || 0), 0);
        const coinOnSe = getBotGroundGood(state, bot, se.id, 'coin', seSide) + carriedCoin + reservedSeCoin;
        const paperOnSe = getBotGroundGood(state, bot, se.id, 'paper', seSide) + carriedPaper + reservedSePaper;
        const wanted: GoodType[] = [];
        if (coinOnSe < 2) wanted.push('coin');
        if (paperOnSe < 1 && !researchSite) wanted.push('paper');
        if (wanted.length > 0) {
          const src = findBestPickupSourceForGoods(state, bot, t, wanted, se.id, se.id);
          if (src && (!localPickupOnly || src.distance === 0)) {
            if (src.good === 'coin') reservedSeCoin += 1;
            if (src.good === 'paper') reservedSePaper += 1;
            if (src.distance === 0) {
              while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, src.good, tSide) > 0) {
                if (!botPickupGoods(state, bot, t, src.good, 1)) break;
              }
              setTarget(new Set([se.id]), { [se.id]: seSide });
            } else {
              setTarget(new Set([src.hexId]), { [src.hexId]: src.side });
              plannedPickup = { hexId: src.hexId, side: src.side, good: src.good, destHexId: se.id, destSide: seSide };
            }
          }
        }
      }
    }

    // 4b. Urgent Paper Mill wood if Stock Exchange already has 2 Coins and zero Paper exists
    if (!targetSet && stockExHasEnoughCoins && stockExNeedsPaperNow && (reservedWoodByDest[paperMillHexes[0].id] || 0) < 2) {
      const pmHex = paperMillHexes[0];
      const pmId = pmHex.id;
      const pmSide = getBuildingSide(state, pmHex);
      if ((t.cargo.wood || 0) > 0) {
        while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'wood', tSide) > 0) {
          if (!botPickupGoods(state, bot, t, 'wood', 1)) break;
        }
        reservedWoodByDest[pmId] = (reservedWoodByDest[pmId] || 0) + (t.cargo.wood || 0);
        setTarget(new Set([pmId]), { [pmId]: pmSide });
      } else if (getFreeCapacity(t) > 0) {
        const src = findBestPickupSourceForGoods(state, bot, t, ['wood'], pmId, pmId);
        if (src && (!localPickupOnly || src.distance === 0)) {
          reservedWoodByDest[pmId] = (reservedWoodByDest[pmId] || 0) + 2;
          if (src.distance === 0) {
            while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'wood', tSide) > 0) {
              if (!botPickupGoods(state, bot, t, 'wood', 1)) break;
            }
            setTarget(new Set([pmId]), { [pmId]: pmSide });
          } else {
            setTarget(new Set([src.hexId]), { [src.hexId]: src.side });
            plannedPickup = { hexId: src.hexId, side: src.side, good: 'wood', destHexId: pmId, destSide: pmSide };
          }
        }
      }
    }

    // 5. Mint inputs (Gold + Fuel) with cross-transporter reservation
    if (!targetSet && mintHexes.length > 0) {
      const mint = mintHexes[0];
      const mintSide = getBuildingSide(state, mint);
      if ((t.cargo.gold || 0) > 0 || (t.cargo.fuel || 0) > 0) {
        if ((t.cargo.gold || 0) > 0 && getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'gold', tSide) > 0) {
          botPickupGoods(state, bot, t, 'gold', 1);
        }
        setTarget(new Set([mint.id]), { [mint.id]: mintSide });
      } else if (getFreeCapacity(t) > 0) {
        const carriedGold = Object.values(state.transporters)
          .filter(tr => tr.ownerId === bot.id)
          .reduce((s, tr) => s + (tr.cargo.gold || 0), 0);
        const carriedFuel = Object.values(state.transporters)
          .filter(tr => tr.ownerId === bot.id)
          .reduce((s, tr) => s + (tr.cargo.fuel || 0), 0);
        const goldCovered = getBotGroundGood(state, bot, mint.id, 'gold', mintSide) + carriedGold + reservedMintGold;
        const fuelCovered = getBotGroundGood(state, bot, mint.id, 'fuel', mintSide) + carriedFuel + reservedMintFuel;
        const wanted: GoodType[] = [];
        if (fuelCovered < 1) wanted.push('fuel');
        else if (goldCovered < 2) wanted.push('gold');
        if (wanted.length > 0) {
          const src = findBestPickupSourceForGoods(state, bot, t, wanted, mint.id, mint.id);
          if (src && (!localPickupOnly || src.distance === 0)) {
            if (src.good === 'gold') reservedMintGold += 2;
            if (src.good === 'fuel') reservedMintFuel += 1;
            if (src.distance === 0) {
              while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, src.good, tSide) > 0) {
                if (!botPickupGoods(state, bot, t, src.good, 1)) break;
              }
              setTarget(new Set([mint.id]), { [mint.id]: mintSide });
            } else {
              setTarget(new Set([src.hexId]), { [src.hexId]: src.side });
              plannedPickup = {
                hexId: src.hexId,
                side: src.side,
                good: src.good,
                destHexId: mint.id,
                destSide: mintSide,
                maxAmount: src.good === 'fuel' ? 1 : 2,
              };
            }
          }
        }
      }
    }

    // 6. Upstream Refining Supply (Sawmill / Research Paper / Burner Fuel / SE Paper)
    const coreNeedsBoards =
      Boolean(coreBuildTarget) && (getBuildRemainingNeeds(state, bot, coreBuildTarget!).boards || 0) > 0;
    const totalPaperAvail = ownedTotals.paper || 0;
    const sePaper = stockExchangeBuilt
      ? getBotGroundGood(state, bot, stockExHexes[0].id, 'paper', getBuildingSide(state, stockExHexes[0]))
      : 0;
    const papersStillNeeded = (researchSite ? 1 : 0) + (hasSecuredFirstStock ? 2 : 1);
    const needPaper =
      paperMillHexes.length > 0 &&
      totalPaperAvail < papersStillNeeded &&
      sePaper < 1 + (hasSecuredFirstStock ? 1 : 0);
    // ownedTotals.fuel already counts fuel on Mint + carried fuel; do not double-count
    const coinsAndFuelCount = (ownedTotals.fuel || 0) + (ownedTotals.coin || 0);
    const needFuel =
      burnerHexes.length > 0 && (hasSecuredFirstStock || coinsAndFuelCount < 2);
    const coreChainStillNeedsBoards =
      coreSeq.some(bt => (BUILDING_SPECS[bt].cost.boards || 0) > 0) &&
      (ownedTotals.boards || 0) < 4;

    if (!targetSet && (t.cargo.wood || 0) > 0) {
      const sawmillLow =
        sawmillHexes.length > 0 &&
        getBotGroundGood(state, bot, sawmillHexes[0].id, 'wood', getBuildingSide(state, sawmillHexes[0])) < 2;
      const pmNeedsWood =
        needPaper &&
        getBotGroundGood(state, bot, paperMillHexes[0].id, 'wood', getBuildingSide(state, paperMillHexes[0])) +
          getBotGroundGood(state, bot, paperMillHexes[0].id, 'boards', getBuildingSide(state, paperMillHexes[0])) < 2;
      const burnerNeedsWood =
        needFuel &&
        getBotGroundGood(state, bot, burnerHexes[0].id, 'wood', getBuildingSide(state, burnerHexes[0])) +
          getBotGroundGood(state, bot, burnerHexes[0].id, 'boards', getBuildingSide(state, burnerHexes[0])) < 2;

      if (needPaper && researchSite && totalPaperAvail === 0 && pmNeedsWood) {
        targetSet = new Set([paperMillHexes[0].id]);
      } else if ((coreNeedsBoards || coreChainStillNeedsBoards) && sawmillLow) {
        targetSet = new Set([sawmillHexes[0].id]);
      } else if (burnerNeedsWood) {
        targetSet = new Set([burnerHexes[0].id]);
      } else if (pmNeedsWood) {
        targetSet = new Set([paperMillHexes[0].id]);
      } else if (burnerHexes.length > 0 && needFuel) {
        targetSet = new Set([burnerHexes[0].id]);
      } else if (sawmillHexes.length > 0) {
        targetSet = new Set([sawmillHexes[0].id]);
      } else if (paperMillHexes.length > 0) {
        targetSet = new Set([paperMillHexes[0].id]);
      }
      if (targetSet && targetSet.size === 1) {
        const dId = [...targetSet][0];
        const dHex = state.hexes[dId];
        if (dHex?.building) {
          targetSideMap = { [dId]: getBuildingSide(state, dHex) };
        }
        if (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'wood', tSide) > 0) {
          botPickupGoods(state, bot, t, 'wood', 1);
        }
        reservedWoodByDest[dId] = (reservedWoodByDest[dId] || 0) + (t.cargo.wood || 0);
      }
    }

    if (!targetSet && getFreeCapacity(t) > 0) {
      const supplyQueue: Array<{ goods: GoodType[]; destId: string; threshold: number }> = [];

      if (needPaper && researchSite && (ownedTotals.paper || 0) === 0) {
        supplyQueue.push({ goods: ['wood'], destId: paperMillHexes[0].id, threshold: 2 });
      }
      if (coreNeedsBoards && sawmillHexes.length > 0) {
        supplyQueue.push({ goods: ['wood'], destId: sawmillHexes[0].id, threshold: 2 });
      }
      if (needFuel) {
        supplyQueue.push({ goods: ['wood'], destId: burnerHexes[0].id, threshold: 2 });
      }
      if (
        needPaper &&
        (researchSite ||
          (stockExchangeBuilt &&
            getBotGroundGood(state, bot, stockExHexes[0].id, 'coin', getBuildingSide(state, stockExHexes[0])) >= 2))
      ) {
        supplyQueue.push({ goods: ['wood'], destId: paperMillHexes[0].id, threshold: 2 });
      }
      if (needPaper) {
        supplyQueue.push({ goods: ['wood'], destId: paperMillHexes[0].id, threshold: 2 });
      }
      if (!coreNeedsBoards && sawmillHexes.length > 0 && (hasSecuredFirstStock || coreChainStillNeedsBoards)) {
        supplyQueue.push({ goods: ['wood'], destId: sawmillHexes[0].id, threshold: 2 });
      }

      for (const job of supplyQueue) {
        const dHex = state.hexes[job.destId];
        const dSide = dHex?.building ? getBuildingSide(state, dHex) : undefined;
        const destStock =
          job.goods.reduce((s, g) => s + getBotGroundGood(state, bot, job.destId, g, dSide), 0) +
          (reservedWoodByDest[job.destId] || 0);
        const need = Math.max(0, job.threshold - destStock);
        if (need === 0) continue;
        const src = findBestPickupSourceForGoods(state, bot, t, job.goods, job.destId, job.destId);
        if (src && (!localPickupOnly || src.distance === 0)) {
          reservedWoodByDest[job.destId] = (reservedWoodByDest[job.destId] || 0) + Math.min(2, need);
          if (src.distance === 0) {
            while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, src.good, tSide) > 0) {
              if (!botPickupGoods(state, bot, t, src.good, 1)) break;
            }
            setTarget(new Set([job.destId]), dSide !== undefined ? { [job.destId]: dSide } : undefined);
          } else {
            setTarget(new Set([src.hexId]), { [src.hexId]: src.side });
            plannedPickup = { hexId: src.hexId, side: src.side, good: src.good, destHexId: job.destId, destSide: dSide };
          }
          break;
        }
      }
    }

    // 6b. Pre-stage next Mint batch (up to 4 gold / 2 fuel) using leftover idle donkeys so Mint strikes Coins back-to-back
    if (!targetSet && mintHexes.length > 0 && getFreeCapacity(t) > 0 && (ownedTotals.coin || 0) < 2) {
      const mint = mintHexes[0];
      const mintSide = getBuildingSide(state, mint);
      const carriedGold = Object.values(state.transporters)
        .filter(tr => tr.ownerId === bot.id)
        .reduce((s, tr) => s + (tr.cargo.gold || 0), 0);
      const carriedFuel = Object.values(state.transporters)
        .filter(tr => tr.ownerId === bot.id)
        .reduce((s, tr) => s + (tr.cargo.fuel || 0), 0);
      const goldCovered = getBotGroundGood(state, bot, mint.id, 'gold', mintSide) + carriedGold + reservedMintGold;
      const fuelCovered = getBotGroundGood(state, bot, mint.id, 'fuel', mintSide) + carriedFuel + reservedMintFuel;
      const wanted: GoodType[] = [];
      if (fuelCovered < 2) wanted.push('fuel');
      if (goldCovered < 4) wanted.push('gold');
      if (wanted.length > 0) {
        const src = findBestPickupSourceForGoods(state, bot, t, wanted, mint.id, mint.id);
        if (src && (!localPickupOnly || src.distance === 0)) {
          if (src.good === 'gold') reservedMintGold += 2;
          if (src.good === 'fuel') reservedMintFuel += 1;
          if (src.distance === 0) {
            while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, src.good, tSide) > 0) {
              if (!botPickupGoods(state, bot, t, src.good, 1)) break;
            }
            setTarget(new Set([mint.id]), { [mint.id]: mintSide });
          } else {
            setTarget(new Set([src.hexId]), { [src.hexId]: src.side });
            plannedPickup = {
              hexId: src.hexId,
              side: src.side,
              good: src.good,
              destHexId: mint.id,
              destSide: mintSide,
              maxAmount: src.good === 'fuel' ? 1 : 2,
            };
          }
        }
      }
    }

    // 7. Expansion Builds (Woodcutter #2, Mine #2, PaperMill #2, Mint #2, StockExchange #2) once Stock #1 secured
    if (!targetSet && expansionBuildTarget) {
      const task = assignBuildTask(state, bot, t, expansionBuildTarget, localPickupOnly);
      if (task) {
        setTarget(task.targets, task.sideMap);
      }
    }
    } // end if (!isFinalRound)

    // 7b. Fallback Direct VP Scoring: pick up loose Coins (+40 VP) or Gold (+10 VP) if Stock Exchange/Mint cannot be completed or endgame arrived
    if (!targetSet && getFreeCapacity(t) > 0) {
      const vpGoods: GoodType[] = [];
      if (canCollectCoinsDirect) vpGoods.push('coin');
      if (canCollectGoldDirect) vpGoods.push('gold');
      if (vpGoods.length > 0) {
        let vpSrc = findBestPickupSourceForGoods(state, bot, t, vpGoods);
        if (vpSrc && vpSrc.distance === 0) {
          while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, vpSrc.good, tSide) > 0) {
            if (!botPickupGoods(state, bot, t, vpSrc.good, 1)) break;
          }
          vpSrc = getFreeCapacity(t) > 0 ? findBestPickupSourceForGoods(state, bot, t, vpGoods) : null;
        }
        if (vpSrc && vpSrc.distance > 0 && !localPickupOnly) {
          setTarget(new Set([vpSrc.hexId]), { [vpSrc.hexId]: vpSrc.side });
          plannedPickup = {
            hexId: vpSrc.hexId,
            side: vpSrc.side,
            good: vpSrc.good,
            destHexId: vpSrc.hexId,
            destSide: vpSrc.side,
            maxAmount: getFreeCapacity(t),
          };
        }
      }
    }

    if (!targetSet) return false;

    // 8. Execute movement & perform arrival unloads / pickups (even multi-step on roads & side-specific bridges)
    moveTransporterToward(state, t, targetSet, targetSideMap);

    // If arriving on a planned pickup hex, load that planned good immediately (picking up is free even at 0 movesLeft)
    if (
      plannedPickup &&
      t.hexId === plannedPickup.hexId &&
      areSidesConnectedByBridgeOnHex(state, t.hexId, getTransporterSide(state, t), plannedPickup.side) &&
      getFreeCapacity(t) > 0
    ) {
      const maxLoad = plannedPickup.maxAmount ?? t.capacity;
      let loaded = 0;
      while (loaded < maxLoad && getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, plannedPickup.good, getTransporterSide(state, t)) > 0) {
        if (!botPickupGoods(state, bot, t, plannedPickup.good, 1)) break;
        loaded += 1;
      }
      if (!isFinalRound && loaded > 0 && t.movesLeft > 0 && (t.hexId !== plannedPickup.destHexId || (plannedPickup.destSide !== undefined && getTransporterSide(state, t) !== plannedPickup.destSide))) {
        const destSideMap = plannedPickup.destSide !== undefined ? { [plannedPickup.destHexId]: plannedPickup.destSide } : undefined;
        moveTransporterToward(state, t, new Set([plannedPickup.destHexId]), destSideMap);
        setTarget(new Set([plannedPickup.destHexId]), destSideMap);
      }
    }

    if (isFinalRound) {
      collectCriticalOutputsOnCurrentHex(state, bot, t, null, true);
      if (getFreeCapacity(t) > 0) {
        const tSideNow = getTransporterSide(state, t);
        while (getFreeCapacity(t) > 0 && getBotGroundGood(state, bot, t.hexId, 'gold', tSideNow) > 0) {
          if (!botPickupGoods(state, bot, t, 'gold', 1)) break;
        }
      }
    } else {
      const intendedDestHexId = targetSet && (targetSet as Set<string>).size === 1 ? [...(targetSet as Set<string>)][0] : undefined;
      unloadCompletedDeliveries(state, bot, t, activeBuildTarget, researchSite, intendedDestHexId, true);
      collectCriticalOutputsOnCurrentHex(state, bot, t, researchSite, canCollectCoinsDirect);

      // If arriving on a build-material source while still having movesLeft, load ONLY materials not already in transit and return
      if (t.movesLeft > 0 && activeBuildTarget) {
        const rem = getBuildRemainingNeeds(state, bot, activeBuildTarget);
        if (Object.keys(rem).length > 0) {
          const carriedElsewhere: Partial<Record<GoodType, number>> = {};
          Object.values(state.transporters).forEach(other => {
            if (other.ownerId === bot.id && other.id !== t.id && other.hexId !== activeBuildTarget.hexId) {
              (Object.keys(rem) as GoodType[]).forEach(g => {
                if (other.cargo[g]) {
                  carriedElsewhere[g] = (carriedElsewhere[g] || 0) + (other.cargo[g] || 0);
                }
              });
            }
          });
          const picked = tryLoadBuildMaterialsOnCurrentHex(state, bot, t, activeBuildTarget, rem, carriedElsewhere);
          if (picked && t.hexId !== activeBuildTarget.hexId) {
            const buildSideMap = { [activeBuildTarget.hexId]: activeBuildTarget.side };
            moveTransporterToward(state, t, new Set([activeBuildTarget.hexId]), buildSideMap);
            unloadCompletedDeliveries(state, bot, t, activeBuildTarget, researchSite, activeBuildTarget.hexId, true);
          }
        }
      }
    }

    return true;
  };

  // Stage 1: Loaded transporters finish delivering cargo first
  for (const t of transporters) {
    if (getTransporterCargoCount(t) > 0) {
      if (processTransporter(t, false)) {
        handledIds.add(t.id);
      }
    }
  }

  // Stage 2: Idle empty transporters already standing on a needed pickup source (distance === 0) grab and go
  for (const t of transporters) {
    if (handledIds.has(t.id)) continue;
    if (processTransporter(t, true)) {
      handledIds.add(t.id);
    }
  }

  // Stage 3: Remaining idle empty transporters fetch needed distant pickups
  for (const t of transporters) {
    if (handledIds.has(t.id)) continue;
    if (processTransporter(t, false)) {
      handledIds.add(t.id);
    }
  }
}

function runBuildingPhase(state: GameState, bot: Player): void {
  const transporters = Object.values(state.transporters).filter(t => t.ownerId === bot.id);
  if (transporters.length === 0) return;

  // 1. Attempt Specialized Mines research (2 Geese + 1 Paper)
  const researchSite = findResearchSite(state, bot);
  if (researchSite) {
    const accRes = getAccessibleSidesOnHex(state, researchSite.hexId, researchSite.side);
    const researcher =
      transporters.find(
        t => t.hexId === researchSite.hexId && accRes.has(getTransporterSide(state, t))
      ) || transporters[0];
    botResearchTech(
      state,
      bot,
      researchSite.hexId,
      'specialized_mines',
      researcher?.id,
      researchSite.side
    );
  }

  // 2. Construct next priority factory in the Stock Certificate pipeline
  const { reachableStates } = getAllBotReachableStates(state, transporters);
  let builtSomething = true;

  let safetyCounter = 0;
  while (builtSomething && safetyCounter < 4) {
    safetyCounter += 1;
    builtSomething = false;
    const seq = [
      ...getCoreBuildSequence(state, bot.id),
      ...getExpansionBuildSequence(state, bot.id),
    ];
    const nextTarget = findNextBuildTargetFromSequence(state, bot, reachableStates, seq);
    if (!nextTarget) break;

    const builder = transporters.find(
      t =>
        t.hexId === nextTarget.hexId &&
        areSidesConnectedByBridgeOnHex(state, nextTarget.hexId, getTransporterSide(state, t), nextTarget.side)
    );
    if (builder) {
      if (botBuildFactory(state, bot, nextTarget.hexId, nextTarget.buildingType, builder.id)) {
        builtSomething = true;
      }
    }
  }

  // 3. Build a required bridge if terrain or needed materials are locked across an unbridged river
  const coreSeq = getCoreBuildSequence(state, bot.id);
  const postCoreTarget = findNextBuildTargetFromSequence(state, bot, reachableStates, coreSeq);
  let bridgeNeeded: BridgeTarget | null = null;
  if (coreSeq.length > 0 && !postCoreTarget) {
    for (const bType of coreSeq) {
      bridgeNeeded = findMissingTerrainBridge(state, bot, reachableStates, bType);
      if (bridgeNeeded) break;
    }
  } else if (postCoreTarget) {
    const remNeeds = getBuildRemainingNeeds(state, bot, postCoreTarget);
    const missingGoods = Object.keys(remNeeds) as GoodType[];
    if (missingGoods.length > 0) {
      const carriedMissing = missingGoods.some(g =>
        transporters.some(tr => (tr.cargo[g] || 0) > 0)
      );
      const anyReachableSource = transporters.some(
        tr => findBestPickupSourceForGoods(state, bot, tr, missingGoods, postCoreTarget.hexId) !== null
      );
      if (!carriedMissing && !anyReachableSource) {
        bridgeNeeded = findBridgeForUnreachableGoods(state, bot, reachableStates, missingGoods);
      }
    }
  }

  if (bridgeNeeded) {
    const builder = transporters.find(
      t =>
        (t.hexId === bridgeNeeded!.hexA || t.hexId === bridgeNeeded!.hexB) &&
        canBuildRoad(state, bot.id, bridgeNeeded!.hexA, bridgeNeeded!.hexB, 'boards', t.id).valid
    );
    if (builder) {
      botBuildRoad(state, bot, bridgeNeeded.hexA, bridgeNeeded.hexB, 'boards', builder.id);
    }
  }

  // 4. Pave connecting roads between bot hubs using surplus ground Stone (never steal Stone in cargo or active build reserve)
  const quarryCount = getOwnedBuildingsOfType(state, bot.id, 'quarry').length;
  const stockExchangeDone = getOwnedBuildingsOfType(state, bot.id, 'stockexchange').length > 0;
  if (quarryCount > 0 || stockExchangeDone) {
    const coreSeqNow = getCoreBuildSequence(state, bot.id);
    const nextCore = findNextBuildTargetFromSequence(state, bot, reachableStates, coreSeqNow);
    const activeStoneReserve = nextCore
      ? Math.max(
          0,
          (BUILDING_SPECS[nextCore.buildingType].cost.stone || 0) -
            getBotGroundGood(state, bot, nextCore.hexId, 'stone', nextCore.side)
        )
      : 0;

    const botHubs = new Set<string>([
      bot.homeHexId,
      ...Object.values(state.hexes)
        .filter(h => h.building && h.building.ownerId === bot.id)
        .map(h => h.id),
    ]);

    for (const builder of transporters) {
      if (!botHubs.has(builder.hexId)) continue;
      if ((builder.cargo.stone || 0) > 0) continue; // Do not steal Stone actively being delivered
      const totalsNow = getBotOwnedGoodsTotals(state, bot);
      if ((totalsNow.stone || 0) <= activeStoneReserve + (stockExchangeDone ? 0 : 1)) break;

      for (const nbId of getNeighborHexIds(state, builder.hexId)) {
        if (!botHubs.has(nbId)) continue;
        const c1 = parseHexKey(builder.hexId);
        const c2 = parseHexKey(nbId);
        const edge = state.edges[getEdgeKey(c1.q, c1.r, c2.q, c2.r)];
        if (!edge || edge.isRiver || edge.improvement !== 'none') continue;

        const bSide = getTransporterSide(state, builder);
        const nbSide = getNeighborSideOnHex(state, nbId, builder.hexId) ?? getBestAccessibleSide(state, nbId);
        const siteMat = getAccessibleSiteMaterials(state, bot.id, builder.hexId, 'stone', builder.id);
        const endpointGroundStone =
          Math.min(siteMat.onGround, getBotGroundGood(state, bot, builder.hexId, 'stone', bSide)) +
          getBotGroundGood(state, bot, nbId, 'stone', nbSide);
        if (endpointGroundStone < 1) continue;

        const latestStone = getBotOwnedGoodsTotals(state, bot).stone || 0;
        if (latestStone <= activeStoneReserve + (stockExchangeDone ? 0 : 1)) break;
        if (botBuildRoad(state, bot, builder.hexId, nbId, 'stone', builder.id)) break;
      }
    }
  }
}

export function runStockBeginnerBotTurn(state: GameState, botPlayerId: string): void {
  const bot = state.players.find(p => p.id === botPlayerId);
  if (!bot || !bot.isAI || bot.resigned) return;

  if (state.phase === 'MOVEMENT') {
    runMovementPhase(state, bot);
  } else if (state.phase === 'BUILDING') {
    runBuildingPhase(state, bot);
  }
  // WONDER phase: Intentionally ignored per Stock Apprentice strategy
}
