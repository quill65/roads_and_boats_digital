/**
 * Infrastructure, Factory Construction, Wonder Contributions & Tech Research
 */

import { BuildingType, GameState, GoodType, Transporter } from '../types';
import { INFRASTRUCTURE_RULES, ROADS_AND_BOATS_RULES, TRANSPORTER_RULES } from '../rules-engine';
import { BUILDING_SPECS, TECH_UPGRADES, TRANSPORTER_SPECS } from '../constants';
import { areHexNeighbors, getEdgeKey, parseHexKey } from '../hexMath';
import {
  doesSideFlankRiverEdge,
  ensureHexGoodsBySide,
  getAccessibleSidesOnHex,
  getBestAccessibleSide,
  getBuildingSide,
  getGoodsOnSide,
  getHexSideLayout,
  getInteractableSidesForTransporter,
  getMatchingBankAcrossRiverEdge,
  getNeighborSideOnHex,
  getTransporterSide,
  isSideAdjacentToWater,
  removeGoodOnSide,
} from '../riverSides';
import { addLog, calculatePlayerScore, calculateScores, getLeaderPlayerId, recordHistorySnapshot } from './history';
import { canPlayerSpawnTransporter } from './production';

export function getBuilderAccessibleSides(
  state: GameState,
  hexId: string,
  transporter: Transporter
): Set<number> {
  const spec = TRANSPORTER_SPECS[transporter.type];
  if (spec.waterOnly && transporter.waterLocation === 'river') {
    return new Set(getInteractableSidesForTransporter(state, transporter));
  }
  return getAccessibleSidesOnHex(state, hexId, getTransporterSide(state, transporter));
}

function isTransporterOnAccessibleSides(
  state: GameState,
  t: Transporter,
  accessibleSides: Set<number>
): boolean {
  const spec = TRANSPORTER_SPECS[t.type];
  if (spec.waterOnly && t.waterLocation === 'river') {
    return getInteractableSidesForTransporter(state, t).some(s => accessibleSides.has(s));
  }
  return accessibleSides.has(getTransporterSide(state, t));
}

export function getAccessibleSiteMaterials(
  state: GameState,
  playerId: string,
  hexId: string,
  good: GoodType,
  transporterId?: string
): {
  carriedByBuilder: number;
  onOtherTransporters: number;
  onGround: number;
  totalAvailable: number;
  accessibleSides: Set<number>;
} {
  const builder = transporterId ? state.transporters[transporterId] : undefined;
  let accessibleSides: Set<number>;

  if (builder && builder.hexId === hexId) {
    accessibleSides = getBuilderAccessibleSides(state, hexId, builder);
  } else {
    const hex = state.hexes[hexId];
    const defaultSide = hex?.building
      ? getBuildingSide(state, hex)
      : getBestAccessibleSide(state, hexId);
    accessibleSides = getAccessibleSidesOnHex(state, hexId, defaultSide);
  }

  const carriedByBuilder =
    builder && builder.ownerId === playerId && builder.hexId === hexId
      ? builder.cargo[good] || 0
      : 0;

  let onGround = 0;
  for (const s of accessibleSides) {
    onGround += getGoodsOnSide(state, hexId, s)[good] || 0;
  }

  const onOtherTransporters = Object.values(state.transporters)
    .filter(
      t =>
        t.id !== transporterId &&
        t.ownerId === playerId &&
        t.hexId === hexId &&
        isTransporterOnAccessibleSides(state, t, accessibleSides)
    )
    .reduce((sum, t) => sum + (t.cargo[good] || 0), 0);

  return {
    carriedByBuilder,
    onOtherTransporters,
    onGround,
    totalAvailable: carriedByBuilder + onGround + onOtherTransporters,
    accessibleSides,
  };
}

function consumeAccessibleSiteMaterial(
  state: GameState,
  playerId: string,
  hexId: string,
  good: GoodType,
  amount: number,
  accessibleSides: Set<number>,
  transporterId?: string,
  orderedSidesOverride?: number[]
): void {
  let remaining = amount;
  const builder = transporterId ? state.transporters[transporterId] : undefined;

  if (builder && builder.ownerId === playerId && builder.hexId === hexId && builder.cargo[good]) {
    const take = Math.min(builder.cargo[good] || 0, remaining);
    builder.cargo[good] = (builder.cargo[good] || 0) - take;
    if (builder.cargo[good]! <= 0) delete builder.cargo[good];
    remaining -= take;
  }

  if (remaining > 0) {
    const others = Object.values(state.transporters).filter(
      t =>
        t.id !== transporterId &&
        t.ownerId === playerId &&
        t.hexId === hexId &&
        isTransporterOnAccessibleSides(state, t, accessibleSides)
    );
    for (const ot of others) {
      if (remaining <= 0) break;
      if (ot.cargo[good]) {
        const take = Math.min(ot.cargo[good] || 0, remaining);
        ot.cargo[good] = (ot.cargo[good] || 0) - take;
        if (ot.cargo[good]! <= 0) delete ot.cargo[good];
        remaining -= take;
      }
    }
  }

  if (remaining > 0) {
    const sideOrder = orderedSidesOverride || Array.from(accessibleSides);
    for (const s of sideOrder) {
      if (remaining <= 0) break;
      const taken = removeGoodOnSide(state, hexId, s, good, remaining);
      remaining -= taken;
    }
  }
}

export function canBuildRoad(
  state: GameState,
  playerId: string,
  hexA: string,
  hexB: string,
  material: 'boards' | 'stone',
  transporterId: string
): { valid: boolean; reason?: string; isBridge?: boolean; cost?: number } {
  if (state.phase !== 'BUILDING') {
    return { valid: false, reason: 'Roads may only be constructed during the Building Phase' };
  }

  const coordA = parseHexKey(hexA);
  const coordB = parseHexKey(hexB);
  if (!areHexNeighbors(coordA, coordB)) {
    return { valid: false, reason: 'Road must connect two adjacent hexes' };
  }

  const edgeKey = getEdgeKey(coordA.q, coordA.r, coordB.q, coordB.r);
  const edge = state.edges[edgeKey];
  if (!edge) return { valid: false, reason: 'Hex edge does not exist' };

  if (edge.improvement === 'road' || edge.improvement === 'bridge' || edge.isRailroad) {
    return { valid: false, reason: 'A road, bridge, or railroad already exists on this border' };
  }

  const transporter = state.transporters[transporterId];
  if (!transporter) return { valid: false, reason: 'Builder transporter not found' };
  if (transporter.ownerId !== playerId) return { valid: false, reason: 'Transporter does not belong to you' };

  if (transporter.hexId !== hexA && transporter.hexId !== hexB) {
    return { valid: false, reason: 'Transporter must be present at one of the connecting hexes' };
  }

  const hexAObj = state.hexes[hexA];
  const hexBObj = state.hexes[hexB];
  if (
    (hexAObj?.terrain === 'water' || hexBObj?.terrain === 'water') &&
    !ROADS_AND_BOATS_RULES.waterMovement.allowRoadsInOpenSea
  ) {
    return { valid: false, reason: 'Cannot construct roads or bridges into open sea water' };
  }

  const isBridge = edge.isRiver;
  const cost = isBridge ? INFRASTRUCTURE_RULES.bridge.materialCost : INFRASTRUCTURE_RULES.road.materialCost;

  if (isBridge && !(INFRASTRUCTURE_RULES.bridge.allowedMaterials as ReadonlyArray<string>).includes(material)) {
    return {
      valid: false,
      reason: 'River Bridges require strictly 2 Boards (Stone cannot build bridges)',
      isBridge,
      cost,
    };
  }
  if (!isBridge && !(INFRASTRUCTURE_RULES.road.allowedMaterials as ReadonlyArray<string>).includes(material)) {
    return {
      valid: false,
      reason: 'Land Roads require strictly 1 Stone (Boards cannot build roads)',
      isBridge,
      cost,
    };
  }

  const builderHexId = transporter.hexId;
  const otherHexId = builderHexId === hexA ? hexB : hexA;
  const builderSide = getTransporterSide(state, transporter);
  const specT = TRANSPORTER_SPECS[transporter.type];
  const accessibleBuilder = getBuilderAccessibleSides(state, builderHexId, transporter);

  let accessibleOther: Set<number>;

  if (isBridge) {
    if (
      !(specT.waterOnly && transporter.waterLocation === 'river') &&
      !doesSideFlankRiverEdge(state, builderHexId, builderSide, edgeKey)
    ) {
      return {
        valid: false,
        reason: 'Transporter is across an unbridged river inside this tile and cannot reach this border',
        isBridge,
        cost,
      };
    }
    const matchingOtherSide = getMatchingBankAcrossRiverEdge(
      state,
      builderHexId,
      builderSide,
      otherHexId
    );
    accessibleOther = getAccessibleSidesOnHex(state, otherHexId, matchingOtherSide);
  } else {
    const requiredSide = getNeighborSideOnHex(state, builderHexId, otherHexId);
    if (requiredSide !== null && !accessibleBuilder.has(requiredSide)) {
      return {
        valid: false,
        reason: 'Blocked by an unbridged river inside this hex! Build a Bridge first to reach this border.',
        isBridge,
        cost,
      };
    }
    const otherSide = getNeighborSideOnHex(state, otherHexId, builderHexId);
    accessibleOther =
      otherSide !== null
        ? getAccessibleSidesOnHex(state, otherHexId, otherSide)
        : new Set([getBestAccessibleSide(state, otherHexId)]);
  }

  const builderCargo = transporter.cargo[material] || 0;
  let builderGround = 0;
  for (const s of accessibleBuilder) {
    builderGround += getGoodsOnSide(state, builderHexId, s)[material] || 0;
  }
  let otherGround = 0;
  for (const s of accessibleOther) {
    otherGround += getGoodsOnSide(state, otherHexId, s)[material] || 0;
  }
  const otherTransporters = Object.values(state.transporters)
    .filter(t => {
      if (t.id === transporterId || t.ownerId !== playerId) return false;
      if (t.hexId === builderHexId) return isTransporterOnAccessibleSides(state, t, accessibleBuilder);
      if (t.hexId === otherHexId) return isTransporterOnAccessibleSides(state, t, accessibleOther);
      return false;
    })
    .reduce((sum, t) => sum + (t.cargo[material] || 0), 0);

  const totalAvailable = builderCargo + builderGround + otherGround + otherTransporters;

  if (totalAvailable < cost) {
    return {
      valid: false,
      reason: `Requires ${cost}x ${material} (accessible on this side: ${totalAvailable})`,
      isBridge,
      cost,
    };
  }

  return { valid: true, isBridge, cost };
}

export function executeBuildRoad(
  state: GameState,
  playerId: string,
  hexA: string,
  hexB: string,
  material: 'boards' | 'stone',
  transporterId: string
): boolean {
  const check = canBuildRoad(state, playerId, hexA, hexB, material, transporterId);
  if (!check.valid || !check.cost) return false;

  const coordA = parseHexKey(hexA);
  const coordB = parseHexKey(hexB);
  const edgeKey = getEdgeKey(coordA.q, coordA.r, coordB.q, coordB.r);
  const edge = state.edges[edgeKey];
  const transporter = state.transporters[transporterId];
  const builderHexId = transporter.hexId;
  const otherHexId = builderHexId === hexA ? hexB : hexA;
  const builderSide = getTransporterSide(state, transporter);
  const accessibleBuilder = getBuilderAccessibleSides(state, builderHexId, transporter);
  const accessibleOther = check.isBridge
    ? getAccessibleSidesOnHex(
        state,
        otherHexId,
        getMatchingBankAcrossRiverEdge(state, builderHexId, builderSide, otherHexId)
      )
    : (() => {
        const os = getNeighborSideOnHex(state, otherHexId, builderHexId);
        return os !== null
          ? getAccessibleSidesOnHex(state, otherHexId, os)
          : new Set([getBestAccessibleSide(state, otherHexId)]);
      })();

  recordHistorySnapshot(
    state,
    `Construct ${check.isBridge ? 'Bridge' : 'Road'} (${hexA} - ${hexB})`,
    playerId
  );

  let remaining = check.cost;
  if (transporter.cargo[material]) {
    const take = Math.min(transporter.cargo[material] || 0, remaining);
    transporter.cargo[material] = (transporter.cargo[material] || 0) - take;
    if (transporter.cargo[material]! <= 0) delete transporter.cargo[material];
    remaining -= take;
  }
  if (remaining > 0) {
    for (const s of accessibleBuilder) {
      if (remaining <= 0) break;
      remaining -= removeGoodOnSide(state, builderHexId, s, material, remaining);
    }
  }
  if (remaining > 0) {
    const others = Object.values(state.transporters).filter(t => {
      if (t.id === transporterId || t.ownerId !== playerId) return false;
      if (t.hexId === builderHexId) return isTransporterOnAccessibleSides(state, t, accessibleBuilder);
      if (t.hexId === otherHexId) return isTransporterOnAccessibleSides(state, t, accessibleOther);
      return false;
    });
    for (const ot of others) {
      if (remaining <= 0) break;
      if (ot.cargo[material]) {
        const take = Math.min(ot.cargo[material] || 0, remaining);
        ot.cargo[material] = (ot.cargo[material] || 0) - take;
        if (ot.cargo[material]! <= 0) delete ot.cargo[material];
        remaining -= take;
      }
    }
  }
  if (remaining > 0) {
    for (const s of accessibleOther) {
      if (remaining <= 0) break;
      remaining -= removeGoodOnSide(state, otherHexId, s, material, remaining);
    }
  }

  edge.improvement = check.isBridge ? 'bridge' : 'road';
  edge.ownerId = playerId;

  addLog(
    state,
    `Constructed a ${check.isBridge ? 'Bridge' : 'Road'} between (${hexA}) and (${hexB}) using ${check.cost}x ${material}`,
    playerId
  );

  state.updatedAt = Date.now();
  return true;
}

export function areAdjacentToWater(state: GameState, hexId: string, side?: number): boolean {
  if (typeof side === 'number') {
    return isSideAdjacentToWater(state, hexId, side);
  }
  const coord = parseHexKey(hexId);
  const neighbors = [
    { q: coord.q + 1, r: coord.r },
    { q: coord.q, r: coord.r + 1 },
    { q: coord.q - 1, r: coord.r + 1 },
    { q: coord.q - 1, r: coord.r },
    { q: coord.q, r: coord.r - 1 },
    { q: coord.q + 1, r: coord.r - 1 },
  ];

  return neighbors.some(nb => {
    const nbHex = state.hexes[`${nb.q},${nb.r}`];
    if (nbHex && nbHex.terrain === 'water') return true;
    const edgeKey = getEdgeKey(coord.q, coord.r, nb.q, nb.r);
    const edge = state.edges[edgeKey];
    return edge && edge.isRiver;
  });
}

export function canBuildFactory(
  state: GameState,
  playerId: string,
  hexId: string,
  buildingType: BuildingType,
  transporterId: string
): { valid: boolean; reason?: string } {
  if (state.phase !== 'BUILDING') {
    return { valid: false, reason: 'Factories may only be erected during the Building Phase' };
  }

  const hex = state.hexes[hexId];
  if (!hex) return { valid: false, reason: 'Hex not found' };
  if (hex.building) return { valid: false, reason: 'Hex already contains a building' };

  const spec = BUILDING_SPECS[buildingType];
  if (!spec) return { valid: false, reason: 'Unknown building type' };

  const allowsWater = spec.allowedTerrain?.includes('water');
  if (hex.terrain === 'water' && !allowsWater) {
    return { valid: false, reason: 'Cannot construct land buildings on open water' };
  }

  if (spec.allowedTerrain && !spec.allowedTerrain.includes(hex.terrain as any)) {
    return {
      valid: false,
      reason: `${spec.name} can only be built on: ${spec.allowedTerrain.join(', ')}`,
    };
  }

  if (spec.requiredTech) {
    const player = state.players.find(p => p.id === playerId);
    if (!player?.unlockedTechs?.includes(spec.requiredTech)) {
      const techSpec = TECH_UPGRADES[spec.requiredTech];
      return {
        valid: false,
        reason: `Requires researching ${techSpec?.name || spec.requiredTech} first (Cost: 2 Geese + 1 Paper)`,
      };
    }
  }

  const transporter = state.transporters[transporterId];
  if (!transporter) return { valid: false, reason: 'Builder transporter not found' };
  if (transporter.ownerId !== playerId) return { valid: false, reason: 'Transporter does not belong to you' };
  if (transporter.hexId !== hexId) return { valid: false, reason: 'Transporter must be present on the building site' };

  const builderSide = getTransporterSide(state, transporter);
  if (spec.requiresAdjacentWater && !areAdjacentToWater(state, hexId, builderSide)) {
    return { valid: false, reason: `${spec.name} requires a Shore side touching Sea or River` };
  }

  for (const [mat, reqQty] of Object.entries(spec.cost)) {
    const goodKey = mat as GoodType;
    const required = reqQty || 0;
    const { totalAvailable } = getAccessibleSiteMaterials(
      state,
      playerId,
      hexId,
      goodKey,
      transporterId
    );
    if (totalAvailable < required) {
      const unsplitGround = hex.goods[goodKey] || 0;
      const allPlayerTransporters = Object.values(state.transporters)
        .filter(t => t.ownerId === playerId && t.hexId === hexId)
        .reduce((s, t) => s + (t.cargo[goodKey] || 0), 0);
      if (unsplitGround + allPlayerTransporters >= required) {
        return {
          valid: false,
          reason: `Cannot pool ${mat} across an unbridged river (${spec.name} needs ${required}x ${mat} on this side; accessible: ${totalAvailable})`,
        };
      }
      return {
        valid: false,
        reason: `Missing materials: ${spec.name} requires ${required}x ${mat} (available: ${totalAvailable})`,
      };
    }
  }

  return { valid: true };
}

export function executeBuildFactory(
  state: GameState,
  playerId: string,
  hexId: string,
  buildingType: BuildingType,
  transporterId: string
): boolean {
  const check = canBuildFactory(state, playerId, hexId, buildingType, transporterId);
  if (!check.valid) return false;

  const hex = state.hexes[hexId];
  const spec = BUILDING_SPECS[buildingType];
  const transporter = state.transporters[transporterId];
  const builderSide = getTransporterSide(state, transporter);
  const accessibleSides = getBuilderAccessibleSides(state, hexId, transporter);

  recordHistorySnapshot(state, `Erect ${spec.name} on hex (${hexId})`, playerId);

  for (const [mat, reqQty] of Object.entries(spec.cost)) {
    const goodKey = mat as GoodType;
    const required = reqQty || 0;
    consumeAccessibleSiteMaterial(
      state,
      playerId,
      hexId,
      goodKey,
      required,
      accessibleSides,
      transporterId
    );
  }

  const owner = state.players.find(p => p.id === playerId);
  let initialMinePool: Partial<Record<GoodType, number>> | undefined;
  let initialMineVariant: 'default' | 'specialized' | 'enlarged' | undefined;
  if (buildingType === 'mine') {
    if (owner?.unlockedTechs?.includes('specialized_mines')) {
      initialMinePool = { gold: 4, iron: 0 };
      initialMineVariant = 'specialized';
    } else if (owner?.unlockedTechs?.includes('large_mines')) {
      initialMinePool = { gold: 5, iron: 5 };
      initialMineVariant = 'enlarged';
    } else {
      initialMinePool = { gold: 3, iron: 3 };
      initialMineVariant = 'default';
    }
  }

  hex.building = {
    id: `bld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: buildingType,
    ownerId: playerId,
    builtRound: state.round,
    side: builderSide,
    ...(initialMinePool ? { minePool: initialMinePool, mineVariant: initialMineVariant } : {}),
  };

  addLog(state, `Erected ${spec.name} on hex (${hexId})`, playerId);
  calculateScores(state);
  state.updatedAt = Date.now();
  return true;
}

const WONDER_SPEND_PRIORITY: ReadonlyArray<GoodType> = [
  'bricks',
  'stone',
  'clay',
  'wood',
  'boards',
  'iron',
  'fuel',
  'paper',
  'goose',
  'gold',
  'coin',
  'stock',
];

export function calculateWonderContributionCost(
  currentWonderBricks: number,
  playerBricksPlacedThisRound: number,
  amount: number
): number {
  const escalateAfter = ROADS_AND_BOATS_RULES.wonderRules.baseCostIncreaseAfterBrickIndex; // 17
  let totalGoods = 0;
  for (let i = 0; i < amount; i++) {
    const baseCost = currentWonderBricks + i >= escalateAfter ? 2 : 1;
    totalGoods += baseCost + (playerBricksPlacedThisRound + i);
  }
  return totalGoods;
}

function getWonderAccessibleSides(
  state: GameState,
  homeHexId: string,
  transporterId?: string
): Set<number> {
  const useGroundAnchor = !transporterId || transporterId === 'GROUND';
  if (!useGroundAnchor && state.transporters[transporterId]) {
    return getBuilderAccessibleSides(state, homeHexId, state.transporters[transporterId]);
  }
  const homeHex = state.hexes[homeHexId];
  const campSide = homeHex?.building
    ? getBuildingSide(state, homeHex)
    : getBestAccessibleSide(state, homeHexId);
  return getAccessibleSidesOnHex(state, homeHexId, campSide);
}

export function canBuildWonder(
  state: GameState,
  playerId: string,
  transporterId: string,
  amount: number = 1
): { valid: boolean; reason?: string; targetTier?: number; pointsEarned?: number; goodsCost?: number } {
  if (state.phase !== 'WONDER') {
    return { valid: false, reason: 'Wonder bricks can only be contributed during the Wonder Phase' };
  }
  if (amount <= 0) {
    return { valid: false, reason: 'Must contribute at least 1 Wonder brick' };
  }

  const player = state.players.find(p => p.id === playerId);
  if (!player) return { valid: false, reason: 'Player not found' };

  const homeHex = state.hexes[player.homeHexId];
  if (!homeHex) return { valid: false, reason: 'Home tile not found' };

  const useGroundAnchor = !transporterId || transporterId === 'GROUND';
  if (!useGroundAnchor) {
    const transporter = state.transporters[transporterId];
    if (!transporter) return { valid: false, reason: 'Transporter not found' };
    if (transporter.ownerId !== playerId) return { valid: false, reason: 'Transporter belongs to another player' };
    if (transporter.hexId !== player.homeHexId) {
      return { valid: false, reason: 'Transporter must be at your home (starting) tile to contribute bricks to the Wonder' };
    }
  }

  const targetTier = state.wonder.find(t => t.bricks.length < t.totalSlots);
  if (!targetTier) {
    return { valid: false, reason: 'The Wonder is already fully completed!' };
  }

  const openSlotsRemaining = state.wonder.reduce((sum, t) => sum + (t.totalSlots - t.bricks.length), 0);
  if (amount > openSlotsRemaining) {
    return { valid: false, reason: `Only ${openSlotsRemaining} slot(s) remaining in the Wonder` };
  }

  const prevTotalBricks = state.wonder.reduce((sum, t) => sum + t.bricks.length, 0);
  const prevPlayerRoundBricks = state.wonderBricksThisRoundByPlayer?.[playerId] || 0;
  const goodsCost = calculateWonderContributionCost(prevTotalBricks, prevPlayerRoundBricks, amount);

  const accessibleSides = getWonderAccessibleSides(state, player.homeHexId, transporterId);
  ensureHexGoodsBySide(state, homeHex);
  let groundGoodsCount = 0;
  for (const s of accessibleSides) {
    groundGoodsCount += Object.values(getGoodsOnSide(state, homeHex.id, s)).reduce(
      (sum, q) => sum + (q || 0),
      0
    );
  }
  const carriedAtHomeCount = Object.values(state.transporters)
    .filter(
      t =>
        t.ownerId === playerId &&
        t.hexId === player.homeHexId &&
        isTransporterOnAccessibleSides(state, t, accessibleSides)
    )
    .reduce((sum, t) => sum + Object.values(t.cargo).reduce((s, q) => s + (q || 0), 0), 0);

  const totalHomeGoods = groundGoodsCount + carriedAtHomeCount;
  if (totalHomeGoods < goodsCost) {
    return {
      valid: false,
      reason: `Placing ${amount} Wonder brick(s) costs ${goodsCost} good(s) at your home tile (available on accessible bank: ${totalHomeGoods})`,
      goodsCost,
    };
  }

  return {
    valid: true,
    targetTier: targetTier.tierIndex,
    pointsEarned: targetTier.pointsPerBrick,
    goodsCost,
  };
}

export function executeBuildWonder(
  state: GameState,
  playerId: string,
  transporterId: string,
  amount: number = 1
): boolean {
  const check = canBuildWonder(state, playerId, transporterId, amount);
  if (!check.valid || check.targetTier === undefined || !check.goodsCost) return false;

  recordHistorySnapshot(
    state,
    `Lay ${amount}x Wonder Brick(s) into Tier ${check.targetTier + 1}`,
    playerId
  );

  const player = state.players.find(p => p.id === playerId)!;
  const homeHex = state.hexes[player.homeHexId];
  const scoreBefore = calculatePlayerScore(state, playerId);
  const accessibleSides = getWonderAccessibleSides(state, player.homeHexId, transporterId);

  let toDeduct = check.goodsCost;
  const primaryTransporter =
    transporterId && transporterId !== 'GROUND' ? state.transporters[transporterId] : null;

  // Spend goods using canonical priority: preferred bricks/stone/raw first before high-VP goods
  for (const good of WONDER_SPEND_PRIORITY) {
    if (toDeduct <= 0) break;
    if (primaryTransporter && primaryTransporter.cargo[good]) {
      const take = Math.min(primaryTransporter.cargo[good] || 0, toDeduct);
      primaryTransporter.cargo[good] = (primaryTransporter.cargo[good] || 0) - take;
      if (primaryTransporter.cargo[good]! <= 0) delete primaryTransporter.cargo[good];
      toDeduct -= take;
    }
    if (toDeduct > 0) {
      for (const s of accessibleSides) {
        if (toDeduct <= 0) break;
        toDeduct -= removeGoodOnSide(state, homeHex.id, s, good, toDeduct);
      }
    }
    if (toDeduct > 0) {
      const homeTransporters = Object.values(state.transporters).filter(
        t =>
          t.ownerId === playerId &&
          t.hexId === player.homeHexId &&
          t.id !== transporterId &&
          isTransporterOnAccessibleSides(state, t, accessibleSides)
      );
      for (const ht of homeTransporters) {
        if (toDeduct <= 0) break;
        if (ht.cargo[good]) {
          const take = Math.min(ht.cargo[good] || 0, toDeduct);
          ht.cargo[good] = (ht.cargo[good] || 0) - take;
          if (ht.cargo[good]! <= 0) delete ht.cargo[good];
          toDeduct -= take;
        }
      }
    }
  }

  const prevTotalBricks = state.wonder.reduce((sum, t) => sum + t.bricks.length, 0);

  for (let i = 0; i < amount; i++) {
    const tier = state.wonder.find(t => t.bricks.length < t.totalSlots);
    if (!tier) break;

    tier.bricks.push({
      brickIndex: tier.bricks.length,
      tier: tier.tierIndex,
      ownerId: playerId,
      points: tier.pointsPerBrick,
      round: state.round,
    });
  }

  if (!state.wonderBricksThisRoundByPlayer) state.wonderBricksThisRoundByPlayer = {};
  state.wonderBricksThisRoundByPlayer[playerId] =
    (state.wonderBricksThisRoundByPlayer[playerId] || 0) + amount;

  const newTotalBricks = state.wonder.reduce((sum, t) => sum + t.bricks.length, 0);
  const irrigationTrigger = ROADS_AND_BOATS_RULES.wonderRules.irrigationTriggerBrickIndex;
  if (prevTotalBricks < irrigationTrigger && newTotalBricks >= irrigationTrigger) {
    let irrigatedCount = 0;
    Object.values(state.hexes).forEach(h => {
      if (h.terrain === 'desert') {
        h.terrain = 'pasture';
        irrigatedCount++;
      }
    });
    if (irrigatedCount > 0) {
      addLog(
        state,
        `🌊 Wonder Irrigation Triggered (Brick #${irrigationTrigger})! Converted ${irrigatedCount} Desert tile(s) into fertile Pasture!`
      );
    }
  }

  calculateScores(state);
  const scoreAfter = calculatePlayerScore(state, playerId);
  const deltaVp = scoreAfter - scoreBefore;

  addLog(
    state,
    `Laid ${amount}x Brick(s) into Wonder Tier ${check.targetTier + 1} (spent ${check.goodsCost} good(s), ${deltaVp >= 0 ? `+${deltaVp}` : deltaVp} VP)`,
    playerId
  );

  const playerCountKey = Math.max(1, Math.min(4, state.players.length)) as 1 | 2 | 3 | 4;
  const endGameBrickIdx = ROADS_AND_BOATS_RULES.wonderRules.endGameBrickIndexByPlayerCount[playerCountKey];
  const reachedEndBrick = endGameBrickIdx !== null && newTotalBricks >= endGameBrickIdx;
  const isFull = state.wonder.every(t => t.bricks.length >= t.totalSlots);
  if (isFull || reachedEndBrick) {
    state.phase = 'COMPLETED';
    state.status = 'finished';
    state.winnerId = getLeaderPlayerId(state);
    addLog(state, `THE WONDER OF THE WORLD IS COMPLETED (${newTotalBricks} bricks)! Game finished.`);
  }

  state.updatedAt = Date.now();
  return true;
}

function findResearchAccessibleSides(
  state: GameState,
  playerId: string,
  hexId: string,
  reqGeese: number,
  reqPaper: number,
  transporterId?: string
): { accessibleSides: Set<number>; totalGeese: number; totalPaper: number } {
  const transporter = transporterId ? state.transporters[transporterId] : undefined;
  if (transporter && transporter.hexId === hexId && transporter.ownerId === playerId) {
    const gRes = getAccessibleSiteMaterials(state, playerId, hexId, 'goose', transporterId);
    const pRes = getAccessibleSiteMaterials(state, playerId, hexId, 'paper', transporterId);
    return {
      accessibleSides: gRes.accessibleSides,
      totalGeese: gRes.totalAvailable,
      totalPaper: pRes.totalAvailable,
    };
  }

  // No transporter specified: check each disjoint bank component on hexId for both 2 Geese + 1 Paper
  const layout = getHexSideLayout(state, hexId);
  let best = { accessibleSides: new Set<number>([0]), totalGeese: 0, totalPaper: 0 };

  for (const region of layout.sides) {
    const sides = getAccessibleSidesOnHex(state, hexId, region.side);
    let gSum = 0;
    let pSum = 0;
    for (const s of sides) {
      const m = getGoodsOnSide(state, hexId, s);
      gSum += m.goose || 0;
      pSum += m.paper || 0;
    }
    Object.values(state.transporters).forEach(t => {
      if (t.ownerId === playerId && t.hexId === hexId && isTransporterOnAccessibleSides(state, t, sides)) {
        gSum += t.cargo.goose || 0;
        pSum += t.cargo.paper || 0;
      }
    });

    if (gSum >= reqGeese && pSum >= reqPaper) {
      return { accessibleSides: sides, totalGeese: gSum, totalPaper: pSum };
    }
    if (gSum + pSum > best.totalGeese + best.totalPaper) {
      best = { accessibleSides: sides, totalGeese: gSum, totalPaper: pSum };
    }
  }

  return best;
}

export function canResearchTech(
  state: GameState,
  playerId: string,
  hexId: string,
  techId: string,
  transporterId?: string
): { valid: boolean; reason?: string } {
  if (state.phase !== 'BUILDING') {
    return { valid: false, reason: 'Research can only be conducted during the Building Phase' };
  }
  const spec = TECH_UPGRADES[techId];
  if (!spec) return { valid: false, reason: 'Unknown technology' };

  const player = state.players.find(p => p.id === playerId);
  if (!player) return { valid: false, reason: 'Player not found' };

  if (player.unlockedTechs?.includes(techId)) {
    return { valid: false, reason: `Technology "${spec.name}" already researched` };
  }

  const hex = state.hexes[hexId];
  if (!hex) return { valid: false, reason: 'Hex not found' };

  const { totalGeese, totalPaper } = findResearchAccessibleSides(
    state,
    playerId,
    hexId,
    spec.requiredGeese,
    spec.requiredPaper,
    transporterId
  );

  if (totalGeese < spec.requiredGeese) {
    return {
      valid: false,
      reason: `Requires ${spec.requiredGeese}x Geese present on this side (available: ${totalGeese})`,
    };
  }

  if (totalPaper < spec.requiredPaper) {
    return {
      valid: false,
      reason: `Requires ${spec.requiredPaper}x Paper present on this side (available: ${totalPaper})`,
    };
  }

  return { valid: true };
}

export function executeResearchTech(
  state: GameState,
  playerId: string,
  hexId: string,
  techId: string,
  transporterId?: string
): boolean {
  const check = canResearchTech(state, playerId, hexId, techId, transporterId);
  if (!check.valid) return false;

  const spec = TECH_UPGRADES[techId];
  const player = state.players.find(p => p.id === playerId)!;

  recordHistorySnapshot(state, `Research ${spec.name} with Geese and Paper`, playerId);

  const { accessibleSides } = findResearchAccessibleSides(
    state,
    playerId,
    hexId,
    spec.requiredGeese,
    spec.requiredPaper,
    transporterId
  );

  consumeAccessibleSiteMaterial(
    state,
    playerId,
    hexId,
    'goose',
    spec.requiredGeese,
    accessibleSides,
    transporterId
  );
  consumeAccessibleSiteMaterial(
    state,
    playerId,
    hexId,
    'paper',
    spec.requiredPaper,
    accessibleSides,
    transporterId
  );

  if (!player.unlockedTechs) player.unlockedTechs = [];
  player.unlockedTechs.push(techId);

  // 3rd Edition Rule: Free automatic factory upgrades when researching Rowing, Trucking, or Shipping
  if (spec.unlocksBuilding && spec.freeUpgradeFromBuildings && spec.freeUpgradeFromBuildings.length > 0) {
    Object.values(state.hexes).forEach(h => {
      if (
        h.building &&
        h.building.ownerId === playerId &&
        spec.freeUpgradeFromBuildings!.includes(h.building.type)
      ) {
        const prevType = BUILDING_SPECS[h.building.type]?.name || h.building.type;
        const nextType = BUILDING_SPECS[spec.unlocksBuilding!]?.name || spec.unlocksBuilding!;
        h.building.type = spec.unlocksBuilding!;
        addLog(
          state,
          `⬆️ Free Research Upgrade: ${prevType} on (${h.id}) upgraded to ${nextType}!`,
          playerId
        );
      }
    });
  }

  // 3rd Edition Rule: Mine pool overrides for Specialisation, Enlargement (mutually exclusive per mine), and NewShafts
  if (techId === 'specialized_mines') {
    Object.values(state.hexes).forEach(h => {
      if (
        h.building &&
        h.building.ownerId === playerId &&
        h.building.type === 'mine' &&
        h.building.mineVariant !== 'enlarged'
      ) {
        const isDepleted =
          h.building.minePool !== undefined &&
          (h.building.minePool.gold || 0) + (h.building.minePool.iron || 0) === 0;
        if (!isDepleted) {
          h.building.mineVariant = 'specialized';
          h.building.minePool = { gold: 4, iron: 0 };
        }
      }
    });
  } else if (techId === 'large_mines') {
    Object.values(state.hexes).forEach(h => {
      if (
        h.building &&
        h.building.ownerId === playerId &&
        h.building.type === 'mine' &&
        h.building.mineVariant !== 'specialized'
      ) {
        const isDepleted =
          h.building.minePool !== undefined &&
          (h.building.minePool.gold || 0) + (h.building.minePool.iron || 0) === 0;
        if (!isDepleted) {
          h.building.mineVariant = 'enlarged';
          h.building.minePool = { gold: 5, iron: 5 };
        }
      }
    });
  } else if (techId === 'extra_shafts') {
    Object.values(state.hexes).forEach(h => {
      if (h.building && h.building.ownerId === playerId && h.building.type === 'mine') {
        const remaining = (h.building.minePool?.gold || 0) + (h.building.minePool?.iron || 0);
        if (remaining === 0) {
          const variant = h.building.mineVariant;
          h.building.minePool =
            variant === 'specialized'
              ? { gold: 4, iron: 0 }
              : variant === 'enlarged'
              ? { gold: 5, iron: 5 }
              : { gold: 3, iron: 3 };
        }
      }
    });
  }

  addLog(
    state,
    `🧪 Researched ${spec.name}! (consumed ${spec.requiredGeese}x Geese + ${spec.requiredPaper}x Paper). Benefit: ${spec.benefit}`,
    playerId
  );

  state.updatedAt = Date.now();
  return true;
}

export function canReplenishMine(
  state: GameState,
  playerId: string,
  hexId: string
): { valid: boolean; reason?: string } {
  if (state.phase !== 'BUILDING') {
    return { valid: false, reason: 'New mine shafts can only be sunk during the Building Phase' };
  }
  const player = state.players.find(p => p.id === playerId);
  if (!player?.unlockedTechs?.includes('extra_shafts')) {
    return { valid: false, reason: 'Requires New Shafts research first' };
  }
  const hex = state.hexes[hexId];
  if (!hex?.building || hex.building.type !== 'mine') {
    return { valid: false, reason: 'Hex does not contain a Mine' };
  }
  if (hex.building.ownerId !== playerId) {
    return { valid: false, reason: 'Can only replenish your own Mine' };
  }
  const remaining = (hex.building.minePool?.gold || 0) + (hex.building.minePool?.iron || 0);
  if (remaining > 0) {
    return { valid: false, reason: `Mine still has ${remaining} ore counter(s) remaining` };
  }
  return { valid: true };
}

export function executeReplenishMine(
  state: GameState,
  playerId: string,
  hexId: string
): boolean {
  const check = canReplenishMine(state, playerId, hexId);
  if (!check.valid) return false;
  const hex = state.hexes[hexId];
  if (!hex?.building) return false;

  recordHistorySnapshot(state, `Sink New Mine Shaft on (${hexId})`, playerId);

  const variant = hex.building.mineVariant;
  hex.building.minePool =
    variant === 'specialized'
      ? { gold: 4, iron: 0 }
      : variant === 'enlarged'
      ? { gold: 5, iron: 5 }
      : { gold: 3, iron: 3 };

  addLog(state, `🪜 Sunk New Mine Shaft at (${hexId}), restoring its ore pool.`, playerId);
  state.updatedAt = Date.now();
  return true;
}

export function canBuildRaft(
  state: GameState,
  playerId: string,
  hexId: string,
  transporterId: string
): { valid: boolean; reason?: string } {
  if (state.phase !== 'BUILDING') {
    return { valid: false, reason: 'Rafts may only be constructed during the Building Phase' };
  }

  if (!canPlayerSpawnTransporter(state, playerId, 'raft')) {
    return { valid: false, reason: 'Fleet limit reached (max 5 water / 8 total transporters)' };
  }

  const hex = state.hexes[hexId];
  if (!hex) return { valid: false, reason: 'Hex not found' };
  if (hex.terrain === 'water') {
    return { valid: false, reason: 'Cannot build a raft while standing in open water' };
  }

  const transporter = state.transporters[transporterId];
  if (!transporter) return { valid: false, reason: 'Builder transporter not found' };
  if (transporter.ownerId !== playerId) return { valid: false, reason: 'Transporter does not belong to you' };
  if (transporter.hexId !== hexId) return { valid: false, reason: 'Transporter must be present on the hex' };

  const builderSide = getTransporterSide(state, transporter);
  if (!areAdjacentToWater(state, hexId, builderSide)) {
    return { valid: false, reason: 'Raft construction requires this bank to touch water or a river' };
  }

  const reqWood = TRANSPORTER_RULES.raft.buildCost.wood || 2;
  const { totalAvailable } = getAccessibleSiteMaterials(
    state,
    playerId,
    hexId,
    'wood',
    transporterId
  );

  if (totalAvailable < reqWood) {
    return {
      valid: false,
      reason: `Requires ${reqWood}x wood to craft a Raft (accessible: ${totalAvailable})`,
    };
  }

  return { valid: true };
}

export function executeBuildRaft(
  state: GameState,
  playerId: string,
  hexId: string,
  transporterId: string
): boolean {
  const check = canBuildRaft(state, playerId, hexId, transporterId);
  if (!check.valid) return false;

  const transporter = state.transporters[transporterId];
  const builderSide = getTransporterSide(state, transporter);
  const accessibleSides = getBuilderAccessibleSides(state, hexId, transporter);
  const reqWood = TRANSPORTER_RULES.raft.buildCost.wood || 2;

  recordHistorySnapshot(state, `Craft Raft on hex (${hexId})`, playerId);

  consumeAccessibleSiteMaterial(
    state,
    playerId,
    hexId,
    'wood',
    reqWood,
    accessibleSides,
    transporterId
  );

  const layout = getHexSideLayout(state, hexId);
  const sideRegion = layout.sides[builderSide];
  const touchesRiver = Boolean(sideRegion && sideRegion.flankingRiverEdgeIds.length > 0);

  const raftSpec = TRANSPORTER_RULES.raft;
  const raftId = `t_${playerId}_raft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  state.transporters[raftId] = {
    id: raftId,
    ownerId: playerId,
    type: 'raft',
    hexId,
    side: builderSide,
    waterLocation: touchesRiver ? 'river' : 'shore',
    cargo: {},
    movesLeft: raftSpec.baseSpeed,
    maxMoves: raftSpec.baseSpeed,
    capacity: raftSpec.capacity,
  };

  addLog(state, `Crafted a river Raft on hex (${hexId}) using 2x wood`, playerId);
  calculateScores(state);
  state.updatedAt = Date.now();
  return true;
}

