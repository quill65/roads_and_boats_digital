/**
 * Shared Official-Rules AI Capability Layer
 *
 * Provides rule-compliant movement pathfinding, cargo management, road/bridge
 * construction, factory construction, raft/transporter crafting, tech research,
 * Wonder contribution, and strict AI-owned ground-goods isolation so bots
 * only consume goods produced by their own buildings or starting stock.
 */

import { BuildingType, GameState, GoodType, HexTile, Player, Transporter } from '../../types';
import { BUILDING_SPECS, TRANSPORTER_SPECS } from '../../constants';
import { areHexNeighbors, getEdgeKey, hexDistance, parseHexKey } from '../../hexMath';
import {
  areSidesConnectedByBridgeOnHex,
  doesSideFlankRiverEdge,
  getAccessibleSidesOnHex,
  getBestAccessibleSide,
  getBuildingSide,
  getEntrySideFromNeighbor,
  getGoodsOnSide,
  getHexSideLayout,
  getMatchingBankAcrossRiverEdge,
  getNeighborSideOnHex,
  getRiverEdgeRoadTargets,
  getTransporterSide,
  getValidEntrySidesFromNeighbor,
  normalizeSideForHex,
} from '../../riverSides';
import { canDropGoods, canPickupGoods, executeDropGoods, executePickupGoods, executeMoveTransporter, getTransporterCargoWeight } from '../movement';
import {
  areAdjacentToWater,
  BuildRoadOptions,
  canBuildFactory,
  canBuildRaft,
  canBuildRoad,
  canBuildWonder,
  canResearchTech,
  executeBuildFactory,
  executeBuildRaft,
  executeBuildRoad,
  executeBuildWonder,
  executeResearchTech,
  getAccessibleSiteMaterials,
  getBuilderAccessibleSides,
} from '../building';

export function getNeighborHexIds(state: GameState, hexId: string): string[] {
  const coord = parseHexKey(hexId);
  const dirs = [
    { q: coord.q + 1, r: coord.r },
    { q: coord.q, r: coord.r + 1 },
    { q: coord.q - 1, r: coord.r + 1 },
    { q: coord.q - 1, r: coord.r },
    { q: coord.q, r: coord.r - 1 },
    { q: coord.q + 1, r: coord.r - 1 },
  ];
  return dirs.map(d => `${d.q},${d.r}`).filter(id => Boolean(state.hexes[id]));
}

export function getTransporterSideEdgeExits(
  state: GameState,
  transporter: Transporter,
  fromHexId: string,
  fromSide: number,
  toHexId: string
): number[] {
  const currentHex = state.hexes[fromHexId];
  const targetHex = state.hexes[toHexId];
  if (!currentHex || !targetHex) return [];

  const currCoord = parseHexKey(fromHexId);
  const targetCoord = parseHexKey(toHexId);
  if (!areHexNeighbors(currCoord, targetCoord)) return [];

  const edgeKey = getEdgeKey(currCoord.q, currCoord.r, targetCoord.q, targetCoord.r);
  const edge = state.edges[edgeKey];
  const spec = TRANSPORTER_SPECS[transporter.type];

  if (spec.waterOnly) {
    const isRiverEdge = Boolean(edge && edge.isRiver);
    const bothWater = currentHex.terrain === 'water' && targetHex.terrain === 'water';
    const isDocking =
      (currentHex.terrain === 'water' && targetHex.terrain !== 'water') ||
      (currentHex.terrain !== 'water' && targetHex.terrain === 'water');

    if (currentHex.terrain !== 'water' && targetHex.terrain !== 'water') {
      if (!isRiverEdge) return [];
      if (transporter.waterLocation === 'shore' && transporter.hexId === fromHexId) {
        if (!doesSideFlankRiverEdge(state, fromHexId, fromSide, edgeKey)) return [];
      }
      return [getBestAccessibleSide(state, toHexId)];
    }
    if (!bothWater && !isRiverEdge && !isDocking) {
      return [];
    }
    if (
      currentHex.terrain !== 'water' &&
      targetHex.terrain === 'water' &&
      transporter.waterLocation === 'shore' &&
      transporter.hexId === fromHexId
    ) {
      const facingSide = getNeighborSideOnHex(state, fromHexId, toHexId);
      if (facingSide !== null && facingSide !== fromSide) return [];
    }
    return [
      targetHex.terrain === 'water'
        ? 0
        : isRiverEdge
        ? getBestAccessibleSide(state, toHexId)
        : getEntrySideFromNeighbor(state, fromHexId, fromSide, toHexId),
    ];
  }

  if (targetHex.terrain === 'water') return [];
  const isRiverEdge = Boolean(edge && edge.isRiver);

  if (isRiverEdge) {
    if (!doesSideFlankRiverEdge(state, fromHexId, fromSide, edgeKey)) {
      return [];
    }
    const hasBridgeOrRail = edge.improvement === 'bridge' || Boolean(edge.isRailroad);
    const bankRoadTargets = getRiverEdgeRoadTargets(state, edge, fromHexId, fromSide);
    if (spec.roadOnly && !hasBridgeOrRail) {
      return bankRoadTargets;
    }
    return getValidEntrySidesFromNeighbor(state, fromHexId, fromSide, toHexId);
  }

  const neededExitSide = getNeighborSideOnHex(state, fromHexId, toHexId);
  if (
    neededExitSide !== null &&
    !areSidesConnectedByBridgeOnHex(state, fromHexId, fromSide, neededExitSide)
  ) {
    return [];
  }

  if (spec.roadOnly) {
    if (!edge || (edge.improvement !== 'road' && edge.improvement !== 'bridge' && !edge.isRailroad)) {
      return [];
    }
  }

  return getValidEntrySidesFromNeighbor(state, fromHexId, fromSide, toHexId);
}

export function canTransporterTraverseSideEdge(
  state: GameState,
  transporter: Transporter,
  fromHexId: string,
  fromSide: number,
  toHexId: string
): { valid: boolean; toSide: number } {
  const exits = getTransporterSideEdgeExits(state, transporter, fromHexId, fromSide, toHexId);
  if (exits.length === 0) return { valid: false, toSide: 0 };
  return { valid: true, toSide: exits[0] };
}

export function canTransporterTraverseEdge(
  state: GameState,
  transporter: Transporter,
  fromHexId: string,
  toHexId: string,
  fromSide?: number
): boolean {
  const resolvedSide =
    typeof fromSide === 'number'
      ? fromSide
      : transporter.hexId === fromHexId
      ? getTransporterSide(state, transporter)
      : getBestAccessibleSide(state, fromHexId);
  return canTransporterTraverseSideEdge(state, transporter, fromHexId, resolvedSide, toHexId).valid;
}

export function findShortestPath(
  state: GameState,
  transporter: Transporter,
  targetHexIds: Set<string>,
  targetSideByHex?: Record<string, number | number[]>
): {
  targetHexId: string;
  targetSide: number;
  path: string[];
  steps: Array<{ hexId: string; targetSide?: number }>;
  distance: number;
} | null {
  const startSide = getTransporterSide(state, transporter);
  const spec = TRANSPORTER_SPECS[transporter.type];

  const isGoal = (hexId: string, side: number): boolean => {
    if (!targetHexIds.has(hexId)) return false;
    const reqSide = targetSideByHex?.[hexId];
    if (reqSide === undefined) return true;
    const reqSides = Array.isArray(reqSide) ? reqSide : [reqSide];
    return reqSides.some(rs => rs === side);
  };

  if (isGoal(transporter.hexId, startSide)) {
    return { targetHexId: transporter.hexId, targetSide: startSide, path: [], steps: [], distance: 0 };
  }

  const startKey = `${transporter.hexId}#${startSide}`;
  const visited = new Set<string>([startKey]);
  const parent = new Map<string, { prevKey: string; step: { hexId: string; targetSide?: number } }>();
  const queue: Array<{ hexId: string; side: number; key: string }> = [
    { hexId: transporter.hexId, side: startSide, key: startKey },
  ];

  const buildResult = (goalKey: string, goalHex: string, goalSide: number) => {
    const steps: Array<{ hexId: string; targetSide?: number }> = [];
    let k: string | undefined = goalKey;
    while (k && k !== startKey) {
      const p = parent.get(k);
      if (!p) break;
      steps.unshift(p.step);
      k = p.prevKey;
    }
    return {
      targetHexId: goalHex,
      targetSide: goalSide,
      path: steps.map(s => s.hexId),
      steps,
      distance: steps.length,
    };
  };

  while (queue.length > 0) {
    const curr = queue.shift()!;

    // Internal bridge crossings on the same hex
    if (!spec.waterOnly) {
      for (const altSide of getAccessibleSidesOnHex(state, curr.hexId, curr.side)) {
        if (altSide === curr.side) continue;
        const nKey = `${curr.hexId}#${altSide}`;
        if (visited.has(nKey)) continue;
        visited.add(nKey);
        parent.set(nKey, { prevKey: curr.key, step: { hexId: curr.hexId, targetSide: altSide } });
        if (isGoal(curr.hexId, altSide)) {
          return buildResult(nKey, curr.hexId, altSide);
        }
        queue.push({ hexId: curr.hexId, side: altSide, key: nKey });
      }
    }

    for (const nb of getNeighborHexIds(state, curr.hexId)) {
      const exits = getTransporterSideEdgeExits(state, transporter, curr.hexId, curr.side, nb);
      if (exits.length === 0) continue;
      const nbSplit = getHexSideLayout(state, nb).isSplit;

      for (const toSide of exits) {
        const nKey = `${nb}#${toSide}`;
        if (visited.has(nKey)) continue;

        visited.add(nKey);
        parent.set(nKey, {
          prevKey: curr.key,
          step: nbSplit ? { hexId: nb, targetSide: toSide } : { hexId: nb },
        });

        if (isGoal(nb, toSide)) {
          return buildResult(nKey, nb, toSide);
        }

        queue.push({ hexId: nb, side: toSide, key: nKey });
      }
    }
  }

  return null;
}

export function getReachableStateSet(state: GameState, transporter: Transporter): Set<string> {
  const startSide = getTransporterSide(state, transporter);
  const startKey = `${transporter.hexId}#${startSide}`;
  const visited = new Set<string>([startKey]);
  const queue: Array<{ hexId: string; side: number }> = [{ hexId: transporter.hexId, side: startSide }];
  const spec = TRANSPORTER_SPECS[transporter.type];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (!spec.waterOnly) {
      for (const altSide of getAccessibleSidesOnHex(state, curr.hexId, curr.side)) {
        const k = `${curr.hexId}#${altSide}`;
        if (!visited.has(k)) {
          visited.add(k);
          queue.push({ hexId: curr.hexId, side: altSide });
        }
      }
    }
    for (const nb of getNeighborHexIds(state, curr.hexId)) {
      const exits = getTransporterSideEdgeExits(state, transporter, curr.hexId, curr.side, nb);
      for (const toSide of exits) {
        const k = `${nb}#${toSide}`;
        if (!visited.has(k)) {
          visited.add(k);
          queue.push({ hexId: nb, side: toSide });
        }
      }
    }
  }
  return visited;
}

export function getReachableHexSet(state: GameState, transporter: Transporter): Set<string> {
  const hexes = new Set<string>();
  getReachableStateSet(state, transporter).forEach(key => {
    const [hexId] = key.split('#');
    hexes.add(hexId);
  });
  return hexes;
}

export function moveTransporterToward(
  state: GameState,
  transporter: Transporter,
  targetHexIds: Set<string>,
  targetSideByHex?: Record<string, number | number[]>
): boolean {
  if (state.phase !== 'MOVEMENT' || transporter.movesLeft <= 0) return false;
  let movedAny = false;

  while (transporter.movesLeft > 0) {
    const curSide = getTransporterSide(state, transporter);
    const reqSide = targetSideByHex?.[transporter.hexId];
    const atTarget =
      targetHexIds.has(transporter.hexId) &&
      (reqSide === undefined ||
        (Array.isArray(reqSide) ? reqSide.includes(curSide) : reqSide === curSide));
    if (atTarget) break;

    const res = findShortestPath(state, transporter, targetHexIds, targetSideByHex);
    if (!res || res.steps.length === 0) break;
    const nextStep = res.steps[0];
    if (!executeMoveTransporter(state, transporter.id, nextStep.hexId, undefined, nextStep.targetSide)) {
      break;
    }
    movedAny = true;
  }

  return movedAny;
}

// ----------------------------------------------------------------------------
// Strict AI-Owned Goods Isolation
// Ensures bots ONLY pick up / consume goods created by their own buildings or
// their own starting stock, completely ignoring other players' buildings/drops.
// ----------------------------------------------------------------------------

function getBotAnchorSide(state: GameState, hexId: string): number {
  const hex = state.hexes[hexId];
  if (!hex) return 0;
  return hex.building ? getBuildingSide(state, hex) : getBestAccessibleSide(state, hexId);
}

function syncBotFlatGoodsForHex(bot: Player, hexId: string): void {
  const bySide = bot.aiOwnedGoodsBySide?.[hexId];
  if (!bySide) return;
  if (!bot.aiOwnedGoods) bot.aiOwnedGoods = {};
  const total: Partial<Record<GoodType, number>> = {};
  Object.values(bySide).forEach(sideMap => {
    if (!sideMap) return;
    Object.entries(sideMap).forEach(([g, q]) => {
      if (q && q > 0) {
        const gt = g as GoodType;
        total[gt] = (total[gt] || 0) + q;
      }
    });
  });
  if (Object.keys(total).length > 0) {
    bot.aiOwnedGoods[hexId] = total;
  } else {
    delete bot.aiOwnedGoods[hexId];
  }
}

function ensureBotOwnedBySideForHex(
  state: GameState,
  bot: Player,
  hexId: string
): Record<number, Partial<Record<GoodType, number>>> {
  if (!bot.aiOwnedGoodsBySide) bot.aiOwnedGoodsBySide = {};
  if (bot.aiOwnedGoodsBySide[hexId]) {
    return bot.aiOwnedGoodsBySide[hexId];
  }

  const bySide: Record<number, Partial<Record<GoodType, number>>> = {};
  const legacy = bot.aiOwnedGoods?.[hexId];
  if (legacy) {
    const anchor = getBotAnchorSide(state, hexId);
    const layout = getHexSideLayout(state, hexId);
    const sideOrder = [anchor, ...layout.sides.map(s => s.side).filter(s => s !== anchor)];

    Object.entries(legacy).forEach(([g, q]) => {
      let rem = q || 0;
      if (rem <= 0) return;
      const gt = g as GoodType;
      for (const s of sideOrder) {
        if (rem <= 0) break;
        const avail = getGoodsOnSide(state, hexId, s)[gt] || 0;
        if (avail > 0) {
          const alloc = Math.min(avail, rem);
          if (!bySide[s]) bySide[s] = {};
          bySide[s][gt] = (bySide[s][gt] || 0) + alloc;
          rem -= alloc;
        }
      }
      if (rem > 0) {
        if (!bySide[anchor]) bySide[anchor] = {};
        bySide[anchor][gt] = (bySide[anchor][gt] || 0) + rem;
      }
    });
  }

  bot.aiOwnedGoodsBySide[hexId] = bySide;
  return bySide;
}

export function getBotGroundGood(
  state: GameState,
  bot: Player,
  hexId: string,
  good: GoodType,
  side?: number
): number {
  const flatOwned = bot.aiOwnedGoods?.[hexId]?.[good] || 0;
  if (flatOwned <= 0 && !bot.aiOwnedGoodsBySide?.[hexId]) return 0;

  const bySide = ensureBotOwnedBySideForHex(state, bot, hexId);
  if (typeof side === 'number') {
    const accessibleSides = getAccessibleSidesOnHex(state, hexId, side);
    let sideOwned = 0;
    let sideActual = 0;
    for (const s of accessibleSides) {
      sideOwned += bySide[s]?.[good] || 0;
      sideActual += getGoodsOnSide(state, hexId, s)[good] || 0;
    }
    return Math.min(sideActual, sideOwned);
  }

  let totalOwned = 0;
  Object.values(bySide).forEach(map => {
    totalOwned += map?.[good] || 0;
  });
  const actual = state.hexes[hexId]?.goods[good] || 0;
  return Math.min(actual, totalOwned);
}

export function creditBotOwnedGood(
  state: GameState,
  bot: Player,
  hexId: string,
  good: GoodType,
  amount: number,
  side?: number
): void {
  if (amount <= 0) return;
  const bySide = ensureBotOwnedBySideForHex(state, bot, hexId);
  const resolvedSide = normalizeSideForHex(
    state,
    hexId,
    typeof side === 'number' ? side : getBotAnchorSide(state, hexId)
  );
  if (!bySide[resolvedSide]) bySide[resolvedSide] = {};
  bySide[resolvedSide][good] = (bySide[resolvedSide][good] || 0) + amount;
  syncBotFlatGoodsForHex(bot, hexId);
}

export function consumeBotOwnedGood(
  state: GameState,
  bot: Player,
  hexId: string,
  good: GoodType,
  amount: number,
  side?: number
): void {
  if (amount <= 0) return;
  const bySide = ensureBotOwnedBySideForHex(state, bot, hexId);
  const resolvedSide =
    typeof side === 'number' ? normalizeSideForHex(state, hexId, side) : undefined;
  const orderedSides =
    resolvedSide !== undefined
      ? [
          resolvedSide,
          ...Array.from(getAccessibleSidesOnHex(state, hexId, resolvedSide)).filter(
            s => s !== resolvedSide
          ),
        ]
      : [
          getBotAnchorSide(state, hexId),
          ...getHexSideLayout(state, hexId).sides.map(s => s.side),
        ];

  let remaining = amount;
  for (const s of orderedSides) {
    if (remaining <= 0) break;
    const map = bySide[s];
    if (!map || !map[good]) continue;
    const take = Math.min(map[good] || 0, remaining);
    const next = (map[good] || 0) - take;
    if (next <= 0) {
      delete map[good];
    } else {
      map[good] = next;
    }
    remaining -= take;
  }
  syncBotFlatGoodsForHex(bot, hexId);
}

function consumeBotOwnedFromSides(
  state: GameState,
  bot: Player,
  hexId: string,
  sides: Iterable<number>,
  good: GoodType,
  amount: number
): void {
  if (amount <= 0) return;
  const bySide = ensureBotOwnedBySideForHex(state, bot, hexId);
  let remaining = amount;
  for (const s of sides) {
    if (remaining <= 0) break;
    const avail = bySide[s]?.[good] || 0;
    if (avail > 0) {
      const take = Math.min(avail, remaining);
      consumeBotOwnedGood(state, bot, hexId, good, take, s);
      remaining -= take;
    }
  }
}

export function getBotOwnedGoodsTotals(
  state: GameState,
  bot: Player
): Partial<Record<GoodType, number>> {
  const totals: Partial<Record<GoodType, number>> = {};

  Object.values(state.transporters).forEach(t => {
    if (t.ownerId !== bot.id) return;
    Object.entries(t.cargo).forEach(([g, q]) => {
      if (q && q > 0) {
        totals[g as GoodType] = (totals[g as GoodType] || 0) + q;
      }
    });
  });

  Object.keys(state.hexes).forEach(hexId => {
    if (!bot.aiOwnedGoods?.[hexId] && !bot.aiOwnedGoodsBySide?.[hexId]) return;
    const hexGoods = state.hexes[hexId]?.goods;
    if (!hexGoods) return;
    Object.keys(hexGoods).forEach(g => {
      const avail = getBotGroundGood(state, bot, hexId, g as GoodType);
      if (avail > 0) {
        totals[g as GoodType] = (totals[g as GoodType] || 0) + avail;
      }
    });
  });

  return totals;
}

export function botPickupGoods(
  state: GameState,
  bot: Player,
  transporter: Transporter,
  good: GoodType,
  amount: number
): boolean {
  if (transporter.ownerId !== bot.id) return false;
  const hexId = transporter.hexId;
  const isRiverWatercraft =
    TRANSPORTER_SPECS[transporter.type].waterOnly && transporter.waterLocation === 'river';
  const candidateSides = isRiverWatercraft
    ? getHexSideLayout(state, hexId).sides.map(s => s.side)
    : (() => {
        const tSide = getTransporterSide(state, transporter);
        return [
          tSide,
          ...Array.from(getAccessibleSidesOnHex(state, hexId, tSide)).filter(s => s !== tSide),
        ];
      })();

  const bySide = ensureBotOwnedBySideForHex(state, bot, hexId);
  const plan: Array<{ side: number; take: number }> = [];
  let remaining = amount;

  for (const s of candidateSides) {
    if (remaining <= 0) break;
    const botOwnedOnSide = bySide[s]?.[good] || 0;
    const actualOnSide = getGoodsOnSide(state, hexId, s)[good] || 0;
    const avail = Math.min(botOwnedOnSide, actualOnSide);
    if (avail > 0) {
      const take = Math.min(avail, remaining);
      plan.push({ side: s, take });
      remaining -= take;
    }
  }

  if (remaining > 0) return false;
  if (!canPickupGoods(state, transporter.id, good, amount, undefined, plan.length === 1 ? plan[0].side : undefined).valid) {
    return false;
  }

  for (const step of plan) {
    if (!executePickupGoods(state, transporter.id, good, step.take, undefined, step.side)) {
      return false;
    }
    consumeBotOwnedGood(state, bot, hexId, good, step.take, step.side);
  }
  return true;
}

export function botDropGoods(
  state: GameState,
  bot: Player,
  transporter: Transporter,
  good: GoodType,
  amount: number
): boolean {
  if (transporter.ownerId !== bot.id) return false;
  if (!canDropGoods(state, transporter.id, good, amount).valid) return false;
  const hexId = transporter.hexId;
  const dropSide = getTransporterSide(state, transporter);
  if (!executeDropGoods(state, transporter.id, good, amount, undefined, dropSide)) return false;
  creditBotOwnedGood(state, bot, hexId, good, amount, dropSide);
  return true;
}

export function getBotCarriedOnHex(
  state: GameState,
  botId: string,
  hexId: string,
  good: GoodType,
  transporterId?: string
): number {
  if (transporterId) {
    const mat = getAccessibleSiteMaterials(state, botId, hexId, good, transporterId);
    return mat.carriedByBuilder + mat.onOtherTransporters;
  }
  return Object.values(state.transporters)
    .filter(t => t.ownerId === botId && t.hexId === hexId)
    .reduce((sum, t) => sum + (t.cargo[good] || 0), 0);
}

export function botBuildFactory(
  state: GameState,
  bot: Player,
  hexId: string,
  buildingType: BuildingType,
  transporterId: string
): boolean {
  if (!canBuildFactory(state, bot.id, hexId, buildingType, transporterId).valid) {
    return false;
  }
  const builder = state.transporters[transporterId];
  if (!builder) return false;
  const builderSide = getTransporterSide(state, builder);
  const accessibleSides = [
    builderSide,
    ...Array.from(getAccessibleSidesOnHex(state, hexId, builderSide)).filter(s => s !== builderSide),
  ];
  const spec = BUILDING_SPECS[buildingType];
  const carriedBefore: Partial<Record<GoodType, number>> = {};

  for (const [mat, req] of Object.entries(spec.cost)) {
    const g = mat as GoodType;
    const reqQty = req || 0;
    const site = getAccessibleSiteMaterials(state, bot.id, hexId, g, transporterId);
    const carried = site.carriedByBuilder + site.onOtherTransporters;
    const botGround = getBotGroundGood(state, bot, hexId, g, builderSide);
    if (carried + botGround < reqQty) {
      return false; // Refuse to pool goods belonging to other players or across unbridged river
    }
    carriedBefore[g] = carried;
  }

  if (!executeBuildFactory(state, bot.id, hexId, buildingType, transporterId)) {
    return false;
  }

  for (const [mat, req] of Object.entries(spec.cost)) {
    const g = mat as GoodType;
    const reqQty = req || 0;
    const carried = carriedBefore[g] || 0;
    const groundUsed = Math.max(0, reqQty - carried);
    consumeBotOwnedFromSides(state, bot, hexId, accessibleSides, g, groundUsed);
  }
  return true;
}

export function botBuildRoad(
  state: GameState,
  bot: Player,
  hexA: string,
  hexB: string,
  material: 'boards' | 'stone',
  transporterId: string,
  options?: BuildRoadOptions
): boolean {
  const check = canBuildRoad(state, bot.id, hexA, hexB, material, transporterId, options);
  if (!check.valid || !check.cost) return false;

  const transporter = state.transporters[transporterId];
  if (!transporter) return false;
  const builderHexId = transporter.hexId;
  const otherHexId = builderHexId === hexA ? hexB : hexA;
  const builderSide = getTransporterSide(state, transporter);
  const accessibleBuilder = getBuilderAccessibleSides(state, builderHexId, transporter);

  const edge = state.edges[
    (() => {
      const ca = parseHexKey(hexA);
      const cb = parseHexKey(hexB);
      return getEdgeKey(ca.q, ca.r, cb.q, cb.r);
    })()
  ];
  const otherAnchorSide = check.bankPair
    ? (builderHexId === edge?.hexA ? check.bankPair.hexBSide : check.bankPair.hexASide)
    : edge?.isRiver
    ? getMatchingBankAcrossRiverEdge(state, builderHexId, builderSide, otherHexId)
    : (getNeighborSideOnHex(state, otherHexId, builderHexId) ?? getBestAccessibleSide(state, otherHexId));

  const siteBuilder = getAccessibleSiteMaterials(state, bot.id, builderHexId, material, transporterId);
  const siteOther = getAccessibleSiteMaterials(
    state,
    bot.id,
    otherHexId,
    material,
    Object.values(state.transporters).find(
      t =>
        t.ownerId === bot.id &&
        t.hexId === otherHexId &&
        getAccessibleSidesOnHex(state, otherHexId, otherAnchorSide).has(getTransporterSide(state, t))
    )?.id
  );
  const carriedBuilder = siteBuilder.carriedByBuilder + siteBuilder.onOtherTransporters;
  const carriedOther = Object.values(state.transporters)
    .filter(
      t =>
        t.ownerId === bot.id &&
        t.hexId === otherHexId &&
        getAccessibleSidesOnHex(state, otherHexId, otherAnchorSide).has(getTransporterSide(state, t))
    )
    .reduce((sum, t) => sum + (t.cargo[material] || 0), 0);

  const groundA = getBotGroundGood(state, bot, builderHexId, material, builderSide);
  const groundB = getBotGroundGood(state, bot, otherHexId, material, otherAnchorSide);

  if (carriedBuilder + carriedOther + groundA + groundB < check.cost) {
    return false;
  }

  let actualGroundBuilderSide = 0;
  for (const s of accessibleBuilder) {
    actualGroundBuilderSide += getGoodsOnSide(state, builderHexId, s)[material] || 0;
  }
  const accessibleOther = getAccessibleSidesOnHex(state, otherHexId, otherAnchorSide);
  let actualGroundOtherSide = 0;
  for (const s of accessibleOther) {
    actualGroundOtherSide += getGoodsOnSide(state, otherHexId, s)[material] || 0;
  }
  void siteOther;

  // Simulate consumption order in building.ts: builder cargo -> builder hex -> other transporters -> other hex
  let rem = check.cost;
  const builderCargo = transporter.cargo[material] || 0;
  rem = Math.max(0, rem - builderCargo);
  const usedOnBuilderHex = Math.min(actualGroundBuilderSide, rem);
  rem -= usedOnBuilderHex;
  const otherCargo = Math.max(0, carriedBuilder + carriedOther - builderCargo);
  rem = Math.max(0, rem - otherCargo);
  const usedOnOtherHex = Math.min(actualGroundOtherSide, rem);

  if (usedOnBuilderHex > groundA || usedOnOtherHex > groundB) {
    return false;
  }

  if (!executeBuildRoad(state, bot.id, hexA, hexB, material, transporterId, options)) {
    return false;
  }

  consumeBotOwnedFromSides(state, bot, builderHexId, accessibleBuilder, material, usedOnBuilderHex);
  consumeBotOwnedFromSides(state, bot, otherHexId, accessibleOther, material, usedOnOtherHex);
  return true;
}

export function botResearchTech(
  state: GameState,
  bot: Player,
  hexId: string,
  techId: string,
  transporterId?: string,
  targetSide?: number
): boolean {
  if (state.phase !== 'PRODUCTION') return false;
  if (!canResearchTech(state, bot.id, hexId, techId, transporterId).valid) return false;

  const tr = transporterId ? state.transporters[transporterId] : undefined;
  const sideScope =
    tr && tr.hexId === hexId
      ? getTransporterSide(state, tr)
      : typeof targetSide === 'number'
      ? targetSide
      : getBotAnchorSide(state, hexId);
  const accessibleSides = getAccessibleSidesOnHex(state, hexId, sideScope);
  const gMat = getAccessibleSiteMaterials(state, bot.id, hexId, 'goose', transporterId);
  const pMat = getAccessibleSiteMaterials(state, bot.id, hexId, 'paper', transporterId);
  const carriedGeese = gMat.carriedByBuilder + gMat.onOtherTransporters;
  const groundGeese = getBotGroundGood(state, bot, hexId, 'goose', sideScope);
  const carriedPaper = pMat.carriedByBuilder + pMat.onOtherTransporters;
  const groundPaper = getBotGroundGood(state, bot, hexId, 'paper', sideScope);

  if (carriedGeese + groundGeese < 2 || carriedPaper + groundPaper < 1) {
    return false;
  }

  if (!executeResearchTech(state, bot.id, hexId, techId, transporterId)) {
    return false;
  }

  const groundGeeseUsed = Math.max(0, 2 - carriedGeese);
  const groundPaperUsed = Math.max(0, 1 - carriedPaper);
  consumeBotOwnedFromSides(state, bot, hexId, accessibleSides, 'goose', groundGeeseUsed);
  consumeBotOwnedFromSides(state, bot, hexId, accessibleSides, 'paper', groundPaperUsed);
  return true;
}

export function botBuildRaft(
  state: GameState,
  bot: Player,
  hexId: string,
  transporterId: string
): boolean {
  if (!canBuildRaft(state, bot.id, hexId, transporterId).valid) return false;
  const tr = state.transporters[transporterId];
  const sideScope = tr ? getTransporterSide(state, tr) : getBotAnchorSide(state, hexId);
  const accessibleSides = getAccessibleSidesOnHex(state, hexId, sideScope);
  const wMat = getAccessibleSiteMaterials(state, bot.id, hexId, 'wood', transporterId);
  const carriedWood = wMat.carriedByBuilder + wMat.onOtherTransporters;
  const groundWood = getBotGroundGood(state, bot, hexId, 'wood', sideScope);
  if (carriedWood + groundWood < 2) return false;

  if (!executeBuildRaft(state, bot.id, hexId, transporterId)) return false;
  consumeBotOwnedFromSides(state, bot, hexId, accessibleSides, 'wood', Math.max(0, 2 - carriedWood));
  return true;
}

export function botBuildWonder(
  state: GameState,
  bot: Player,
  transporterId: string,
  amount: number = 1
): boolean {
  if (!canBuildWonder(state, bot.id, transporterId, amount).valid) return false;
  return executeBuildWonder(state, bot.id, transporterId, amount);
}

export function isValidHexForBuilding(
  state: GameState,
  player: Player,
  hex: HexTile,
  buildingType: BuildingType,
  side?: number
): boolean {
  if (hex.building) return false;
  const spec = BUILDING_SPECS[buildingType];
  if (!spec) return false;
  if (hex.terrain === 'water' && !spec.allowedTerrain?.includes('water')) return false;
  if (spec.allowedTerrain && !spec.allowedTerrain.includes(hex.terrain)) return false;
  if (spec.requiresAdjacentWater && !areAdjacentToWater(state, hex.id, side)) return false;
  if (spec.requiredTech && !player.unlockedTechs?.includes(spec.requiredTech)) return false;
  return true;
}

export function getFreeCapacity(transporter: Transporter): number {
  return Math.max(0, transporter.capacity - getTransporterCargoWeight(transporter));
}

export function getHexDistance(hexA: string, hexB: string): number {
  return hexDistance(parseHexKey(hexA), parseHexKey(hexB));
}
