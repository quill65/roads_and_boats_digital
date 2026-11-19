/**
 * Production Phase, Animal Breeding & Turn Advancement
 * Driven by the 3rd Edition Base Game ruleset (`src/game/rules-engine.ts`)
 */

import { BuildingType, GameState, GoodType, HexTile, Transporter, TransporterType } from '../types';
import {
  BREEDING_RULES,
  BUILDING_RULES,
  FLEET_LIMIT_RULES,
  ROADS_AND_BOATS_RULES,
  TRANSPORTER_RULES,
} from '../rules-engine';
import { BUILDING_SPECS, TRANSPORTER_SPECS } from '../constants';
import {
  addGoodOnSide,
  doesSideTouchRoad,
  ensureHexGoodsBySide,
  getAccessibleSidesOnHex,
  getBestAccessibleSide,
  getBuildingSide,
  getGoodsOnSide,
  getHexSideLayout,
  getInteractableSidesForTransporter,
  getTransporterSide,
  normalizeSideForHex,
  removeGoodOnSide,
} from '../riverSides';
import { addLog, calculateScores, getLeaderPlayerId, recordHistorySnapshot } from './history';

export interface ProductionPhaseOptions {
  /**
   * Whether transporters owned by the factory owner on accessible sides may supply inputs from cargo.
   * Defaults to true. Pass false for ground-only, or an array of allowed transporter IDs.
   */
  allowTransporterCargo?: boolean | string[];
}

export interface TransporterProductionCandidate {
  hexId: string;
  buildingType: BuildingType;
  buildingName: string;
  buildingSide: number;
  transporterId: string;
  transporterType: TransporterType;
  transporterName: string;
  usableGoods: Array<{ good: GoodType; quantity: number }>;
}

function syncAiFlatGoodsForHex(
  owner: {
    aiOwnedGoods?: Record<string, Partial<Record<GoodType, number>>>;
    aiOwnedGoodsBySide?: Record<string, Record<number, Partial<Record<GoodType, number>>>>;
  },
  hexId: string
) {
  const bySide = owner.aiOwnedGoodsBySide?.[hexId];
  if (!bySide) return;
  if (!owner.aiOwnedGoods) owner.aiOwnedGoods = {};
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
    owner.aiOwnedGoods[hexId] = total;
  } else {
    delete owner.aiOwnedGoods[hexId];
  }
}

function getAiAnchorSide(state: GameState, hexId: string): number {
  const hex = state.hexes[hexId];
  if (!hex) return 0;
  return hex.building ? getBuildingSide(state, hex) : getBestAccessibleSide(state, hexId);
}

function creditAiGood(
  state: GameState,
  ownerId: string | undefined,
  hexId: string,
  good: GoodType,
  amount: number,
  side?: number
) {
  if (!ownerId || amount <= 0) return;
  const owner = state.players.find(p => p.id === ownerId);
  if (!owner || !owner.isAI) return;
  const resolvedSide = normalizeSideForHex(
    state,
    hexId,
    typeof side === 'number' ? side : getAiAnchorSide(state, hexId)
  );

  if (!owner.aiOwnedGoodsBySide) owner.aiOwnedGoodsBySide = {};
  if (!owner.aiOwnedGoodsBySide[hexId]) {
    owner.aiOwnedGoodsBySide[hexId] = {};
    // Preserve any legacy flat goods onto anchor side before adding
    const legacy = owner.aiOwnedGoods?.[hexId];
    if (legacy) {
      const anchor = getAiAnchorSide(state, hexId);
      const seed: Partial<Record<GoodType, number>> = {};
      Object.entries(legacy).forEach(([g, q]) => {
        if (q && q > 0) seed[g as GoodType] = q;
      });
      if (Object.keys(seed).length > 0) {
        owner.aiOwnedGoodsBySide[hexId][anchor] = seed;
      }
    }
  }
  if (!owner.aiOwnedGoodsBySide[hexId][resolvedSide]) {
    owner.aiOwnedGoodsBySide[hexId][resolvedSide] = {};
  }
  owner.aiOwnedGoodsBySide[hexId][resolvedSide][good] =
    (owner.aiOwnedGoodsBySide[hexId][resolvedSide][good] || 0) + amount;
  syncAiFlatGoodsForHex(owner, hexId);
}

function consumeAiGood(
  state: GameState,
  ownerId: string | undefined,
  hexId: string,
  good: GoodType,
  amount: number,
  side?: number
) {
  if (!ownerId || amount <= 0) return;
  const owner = state.players.find(p => p.id === ownerId);
  if (!owner || !owner.isAI) return;

  if (owner.aiOwnedGoodsBySide?.[hexId]) {
    const resolvedSide =
      typeof side === 'number' ? normalizeSideForHex(state, hexId, side) : undefined;
    const layout = getHexSideLayout(state, hexId);
    const orderedSides =
      resolvedSide !== undefined
        ? [resolvedSide, ...layout.sides.map(s => s.side).filter(s => s !== resolvedSide)]
        : [getAiAnchorSide(state, hexId), ...layout.sides.map(s => s.side)];

    let remaining = amount;
    for (const s of orderedSides) {
      if (remaining <= 0) break;
      const sideMap = owner.aiOwnedGoodsBySide[hexId][s];
      if (!sideMap || !sideMap[good]) continue;
      const take = Math.min(sideMap[good] || 0, remaining);
      const next = (sideMap[good] || 0) - take;
      if (next <= 0) {
        delete sideMap[good];
      } else {
        sideMap[good] = next;
      }
      remaining -= take;
    }
    syncAiFlatGoodsForHex(owner, hexId);
    return;
  }

  if (!owner.aiOwnedGoods?.[hexId]) return;
  const current = owner.aiOwnedGoods[hexId][good] || 0;
  const next = Math.max(0, current - amount);
  if (next === 0) {
    delete owner.aiOwnedGoods[hexId][good];
  } else {
    owner.aiOwnedGoods[hexId][good] = next;
  }
}

export function canPlayerSpawnTransporter(
  state: GameState,
  ownerId: string,
  type: TransporterType,
  consumingDonkey = false
): boolean {
  const spec = TRANSPORTER_SPECS[type];
  const playerTransporters = Object.values(state.transporters).filter(
    t => t.ownerId === ownerId
  );
  const totalCount = playerTransporters.length - (consumingDonkey ? 1 : 0);
  if (totalCount >= FLEET_LIMIT_RULES.maxTotalTransporters) {
    return false;
  }

  if (spec.category === 'land') {
    const landCount =
      playerTransporters.filter(t => TRANSPORTER_SPECS[t.type].category === 'land').length -
      (consumingDonkey ? 1 : 0);
    if (landCount >= FLEET_LIMIT_RULES.maxLandTransporters) {
      return false;
    }
  } else {
    const waterCount = playerTransporters.filter(
      t => TRANSPORTER_SPECS[t.type].category === 'water'
    ).length;
    if (waterCount >= FLEET_LIMIT_RULES.maxWaterTransporters) {
      return false;
    }
  }

  return true;
}

function spawnProducedTransporter(
  state: GameState,
  ownerId: string,
  hexId: string,
  type: TransporterType,
  side: number
) {
  const spec = TRANSPORTER_SPECS[type];
  const id = `t_${ownerId}_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const layout = getHexSideLayout(state, hexId);
  const sideRegion = layout.sides[side];
  const waterLocation =
    spec.category === 'water'
      ? sideRegion && sideRegion.flankingRiverEdgeIds.length > 0
        ? 'river'
        : 'shore'
      : undefined;

  state.transporters[id] = {
    id,
    ownerId,
    type,
    hexId,
    side,
    ...(waterLocation ? { waterLocation } : {}),
    cargo: {},
    movesLeft: spec.baseSpeed,
    maxMoves: spec.baseSpeed,
    capacity: spec.capacity,
  };
  const owner = state.players.find(p => p.id === ownerId);
  addLog(state, `${spec.name} constructed at (${hexId}) for ${owner?.name || 'player'}.`, ownerId);
}

function getAvailableOnSides(
  state: GameState,
  hexId: string,
  sides: number[],
  good: GoodType
): number {
  let sum = 0;
  for (const s of sides) {
    sum += getGoodsOnSide(state, hexId, s)[good] || 0;
  }
  return sum;
}

function isTransporterAccessibleForFactory(
  state: GameState,
  t: Transporter,
  accessibleSet: Set<number>
): boolean {
  const spec = TRANSPORTER_SPECS[t.type];
  if (spec.waterOnly && t.waterLocation === 'river') {
    return getInteractableSidesForTransporter(state, t).some(s => accessibleSet.has(s));
  }
  return accessibleSet.has(getTransporterSide(state, t));
}

function isTransporterCargoAllowed(
  state: GameState,
  transporterId: string,
  ownerId: string | undefined,
  options?: ProductionPhaseOptions
): boolean {
  const setting = options?.allowTransporterCargo;
  if (setting === false) return false;
  if (Array.isArray(setting)) return setting.includes(transporterId);
  const owner = ownerId ? state.players.find(p => p.id === ownerId) : undefined;
  if (owner?.isAI) return false;
  return true;
}

function getAccessibleFactoryTransporters(
  state: GameState,
  hexId: string,
  sides: number[],
  ownerId: string | undefined,
  options?: ProductionPhaseOptions,
  excludeTransporterId?: string
): Transporter[] {
  if (!ownerId || options?.allowTransporterCargo === false) return [];
  const sideSet = new Set(sides);
  return Object.values(state.transporters).filter(
    t =>
      t.ownerId === ownerId &&
      t.hexId === hexId &&
      t.id !== excludeTransporterId &&
      isTransporterCargoAllowed(state, t.id, ownerId, options) &&
      isTransporterAccessibleForFactory(state, t, sideSet)
  );
}

function getAvailableFromSidesAndCargo(
  state: GameState,
  hexId: string,
  sides: number[],
  ownerId: string | undefined,
  good: GoodType,
  options?: ProductionPhaseOptions,
  excludeTransporterId?: string
): number {
  let sum = getAvailableOnSides(state, hexId, sides, good);
  const matching = getAccessibleFactoryTransporters(
    state,
    hexId,
    sides,
    ownerId,
    options,
    excludeTransporterId
  );
  for (const t of matching) {
    sum += t.cargo[good] || 0;
  }
  return sum;
}

function consumeFromSidesAndCargo(
  state: GameState,
  hexId: string,
  sides: number[],
  ownerId: string | undefined,
  good: GoodType,
  amount: number,
  options?: ProductionPhaseOptions,
  excludeTransporterId?: string
): boolean {
  if (
    getAvailableFromSidesAndCargo(
      state,
      hexId,
      sides,
      ownerId,
      good,
      options,
      excludeTransporterId
    ) < amount
  ) {
    return false;
  }
  let remaining = amount;
  // 1. Consume ground goods on accessible sides first
  for (const s of sides) {
    if (remaining <= 0) break;
    const taken = removeGoodOnSide(state, hexId, s, good, remaining);
    if (taken > 0) {
      consumeAiGood(state, ownerId, hexId, good, taken, s);
      remaining -= taken;
    }
  }
  // 2. Consume remaining needed inputs directly from accessible owner transporters' cargo
  if (remaining > 0) {
    const matching = getAccessibleFactoryTransporters(
      state,
      hexId,
      sides,
      ownerId,
      options,
      excludeTransporterId
    );
    for (const t of matching) {
      if (remaining <= 0) break;
      const inCargo = t.cargo[good] || 0;
      if (inCargo > 0) {
        const take = Math.min(inCargo, remaining);
        const nextQty = inCargo - take;
        if (nextQty <= 0) {
          delete t.cargo[good];
        } else {
          t.cargo[good] = nextQty;
        }
        remaining -= take;
      }
    }
  }
  return true;
}

/**
 * Consumes `totalAmount` from `sides` (and owner transporters on those sides) on `hex`
 * across `priorityOrder` (e.g. ['boards', 'wood'] for CoalBurner / Papermill).
 */
function consumeFlexibleInputs(
  state: GameState,
  hex: HexTile,
  sides: number[],
  ownerId: string | undefined,
  priorityOrder: ReadonlyArray<GoodType>,
  totalAmount: number,
  options?: ProductionPhaseOptions
): boolean {
  const available = priorityOrder.reduce(
    (sum, g) => sum + getAvailableFromSidesAndCargo(state, hex.id, sides, ownerId, g, options),
    0
  );
  if (available < totalAmount) return false;

  let remaining = totalAmount;
  for (const good of priorityOrder) {
    if (remaining <= 0) break;
    const avail = getAvailableFromSidesAndCargo(state, hex.id, sides, ownerId, good, options);
    if (avail > 0) {
      const take = Math.min(avail, remaining);
      consumeFromSidesAndCargo(state, hex.id, sides, ownerId, good, take, options);
      remaining -= take;
    }
  }
  return true;
}

function getDisjointSideGroups(state: GameState, hexId: string): number[][] {
  const layout = getHexSideLayout(state, hexId);
  const visited = new Set<number>();
  const groups: number[][] = [];
  for (const region of layout.sides) {
    if (visited.has(region.side)) continue;
    const component = Array.from(getAccessibleSidesOnHex(state, hexId, region.side)).sort(
      (a, b) => a - b
    );
    component.forEach(s => visited.add(s));
    groups.push(component);
  }
  return groups;
}

export function runProductionPhase(state: GameState, options?: ProductionPhaseOptions): void {
  // 1. Primary Producers produce raw resources on their factory's bank side (maxBatchesPerTurn: 1)
  Object.values(state.hexes).forEach(hex => {
    if (!hex.building) return;
    const bType = hex.building.type;
    const bOwnerId = hex.building.ownerId;
    const bSide = getBuildingSide(state, hex);

    if (bType === 'woodcutter') {
      addGoodOnSide(state, hex.id, bSide, 'wood', 1);
      creditAiGood(state, bOwnerId, hex.id, 'wood', 1, bSide);
    } else if (bType === 'claypit') {
      addGoodOnSide(state, hex.id, bSide, 'clay', 1);
      creditAiGood(state, bOwnerId, hex.id, 'clay', 1, bSide);
    } else if (bType === 'quarry') {
      addGoodOnSide(state, hex.id, bSide, 'stone', 1);
      creditAiGood(state, bOwnerId, hex.id, 'stone', 1, bSide);
    } else if (bType === 'oilrig') {
      addGoodOnSide(state, hex.id, bSide, 'fuel', 1);
      creditAiGood(state, bOwnerId, hex.id, 'fuel', 1, bSide);
    } else if (bType === 'mine') {
      const owner = state.players.find(p => p.id === bOwnerId);
      const variant = hex.building.mineVariant;

      if (!hex.building.minePool) {
        const hasSpecialized =
          variant === 'specialized' ||
          (variant !== 'enlarged' && owner?.unlockedTechs?.includes('specialized_mines'));
        const hasLarge =
          variant === 'enlarged' ||
          (variant !== 'specialized' && owner?.unlockedTechs?.includes('large_mines'));

        hex.building.minePool = hasSpecialized
          ? { gold: 4, iron: 0 }
          : hasLarge
          ? { gold: 5, iron: 5 }
          : { gold: 3, iron: 3 };
        if (!hex.building.mineVariant) {
          hex.building.mineVariant = hasSpecialized
            ? 'specialized'
            : hasLarge
            ? 'enlarged'
            : 'default';
        }
      }

      const pool = hex.building.minePool;
      const goldLeft = pool.gold || 0;
      const ironLeft = pool.iron || 0;
      const totalLeft = goldLeft + ironLeft;
      if (totalLeft > 0) {
        // Authentic 3rd Edition Rule: Mines always draw strictly 1 ore counter per turn from finite bag pool
        const drawGold = Math.random() < goldLeft / totalLeft;
        if (drawGold) {
          pool.gold = goldLeft - 1;
          addGoodOnSide(state, hex.id, bSide, 'gold', 1);
          creditAiGood(state, bOwnerId, hex.id, 'gold', 1, bSide);
        } else {
          pool.iron = ironLeft - 1;
          addGoodOnSide(state, hex.id, bSide, 'iron', 1);
          creditAiGood(state, bOwnerId, hex.id, 'iron', 1, bSide);
        }
      }
    }
  });

  // 2. Secondary Refinement & Transporter Factories
  // Strictly isolated per factory side (unless sides are connected by a Bridge on that hex);
  // inputs may come from accessible ground OR loaded cargo on owner's accessible transporters.
  Object.values(state.hexes).forEach(hex => {
    if (!hex.building) return;
    ensureHexGoodsBySide(state, hex);
    const bType = hex.building.type;
    const bOwnerId = hex.building.ownerId;
    const bSide = getBuildingSide(state, hex);
    const accessibleSides = [
      bSide,
      ...Array.from(getAccessibleSidesOnHex(state, hex.id, bSide)).filter(s => s !== bSide),
    ];
    const maxBatches = BUILDING_RULES[bType]?.maxBatchesPerTurn ?? 1;

    if (bType === 'sawmill') {
      for (let b = 0; b < maxBatches; b++) {
        if (!consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'wood', 1, options)) break;
        addGoodOnSide(state, hex.id, bSide, 'boards', 2);
        creditAiGood(state, bOwnerId, hex.id, 'boards', 2, bSide);
      }
    } else if (bType === 'brickworks') {
      // 3rd Edition StoneFactory: 1 Clay -> 2 Stone (up to 3 batches/turn)
      for (let b = 0; b < maxBatches; b++) {
        if (!consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'clay', 1, options)) break;
        addGoodOnSide(state, hex.id, bSide, 'stone', 2);
        creditAiGood(state, bOwnerId, hex.id, 'stone', 2, bSide);
      }
    } else if (bType === 'burner') {
      // 3rd Edition CoalBurner: any 2 Boards and/or Trunks (priority: Board then Trunk) -> 1 Fuel (max 6 batches)
      const priority = BUILDING_RULES.burner.anyOfInputs?.priorityOrder || ['boards', 'wood'];
      for (let b = 0; b < maxBatches; b++) {
        if (!consumeFlexibleInputs(state, hex, accessibleSides, bOwnerId, priority, 2, options)) break;
        addGoodOnSide(state, hex.id, bSide, 'fuel', 1);
        creditAiGood(state, bOwnerId, hex.id, 'fuel', 1, bSide);
      }
    } else if (bType === 'papermill') {
      // 3rd Edition Papermill: any 2 Boards and/or Trunks (priority: Board then Trunk) -> 1 Paper (max 1 batch)
      const priority = BUILDING_RULES.papermill.anyOfInputs?.priorityOrder || ['boards', 'wood'];
      for (let b = 0; b < maxBatches; b++) {
        if (!consumeFlexibleInputs(state, hex, accessibleSides, bOwnerId, priority, 2, options)) break;
        addGoodOnSide(state, hex.id, bSide, 'paper', 1);
        creditAiGood(state, bOwnerId, hex.id, 'paper', 1, bSide);
      }
    } else if (bType === 'mint') {
      for (let b = 0; b < maxBatches; b++) {
        if (
          getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'gold', options) < 2 ||
          getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'fuel', options) < 1
        ) {
          break;
        }
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'gold', 2, options);
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'fuel', 1, options);
        addGoodOnSide(state, hex.id, bSide, 'coin', 1);
        creditAiGood(state, bOwnerId, hex.id, 'coin', 1, bSide);
      }
    } else if (bType === 'stockexchange') {
      for (let b = 0; b < maxBatches; b++) {
        if (
          getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'coin', options) < 2 ||
          getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'paper', options) < 1
        ) {
          break;
        }
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'coin', 2, options);
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'paper', 1, options);
        addGoodOnSide(state, hex.id, bSide, 'stock', 1);
        creditAiGood(state, bOwnerId, hex.id, 'stock', 1, bSide);
      }
    } else if (bType === 'wagonfactory') {
      const sideSet = new Set(accessibleSides);
      const emptyDonkey = Object.values(state.transporters).find(
        t =>
          t.ownerId === bOwnerId &&
          t.hexId === hex.id &&
          t.type === 'donkey' &&
          sideSet.has(getTransporterSide(state, t)) &&
          Object.values(t.cargo).every(q => !q)
      );
      if (
        emptyDonkey &&
        getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'boards', options, emptyDonkey.id) >= 2 &&
        canPlayerSpawnTransporter(state, bOwnerId, 'wagon', true)
      ) {
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'boards', 2, options, emptyDonkey.id);
        delete state.transporters[emptyDonkey.id];
        spawnProducedTransporter(state, bOwnerId, hex.id, 'wagon', bSide);
      }
    } else if (
      bType === 'raftfactory' &&
      getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'wood', options) >= 2
    ) {
      if (canPlayerSpawnTransporter(state, bOwnerId, 'raft')) {
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'wood', 2, options);
        spawnProducedTransporter(state, bOwnerId, hex.id, 'raft', bSide);
      }
    } else if (
      bType === 'shipyard' &&
      getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'boards', options) >= 5
    ) {
      if (canPlayerSpawnTransporter(state, bOwnerId, 'rowboat')) {
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'boards', 5, options);
        spawnProducedTransporter(state, bOwnerId, hex.id, 'rowboat', bSide);
      }
    } else if (
      bType === 'truckfactory' &&
      getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'fuel', options) >= 1 &&
      getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'iron', options) >= 1
    ) {
      if (canPlayerSpawnTransporter(state, bOwnerId, 'truck')) {
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'fuel', 1, options);
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'iron', 1, options);
        spawnProducedTransporter(state, bOwnerId, hex.id, 'truck', bSide);
      }
    } else if (
      bType === 'steamerfactory' &&
      getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'fuel', options) >= 2 &&
      getAvailableFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'iron', options) >= 1
    ) {
      if (canPlayerSpawnTransporter(state, bOwnerId, 'steamship')) {
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'fuel', 2, options);
        consumeFromSidesAndCargo(state, hex.id, accessibleSides, bOwnerId, 'iron', 1, options);
        spawnProducedTransporter(state, bOwnerId, hex.id, 'steamship', bSide);
      }
    }
  });

  // 3. Natural Donkey Reproduction on Pastures (evaluated per bank side, respecting Fleet Limits)
  Object.values(state.hexes).forEach(hex => {
    if (hex.terrain !== BREEDING_RULES.donkey.terrain) return;
    if (BREEDING_RULES.donkey.disallowBuildingsOnHex && hex.building) return;
    ensureHexGoodsBySide(state, hex);

    for (const groupSides of getDisjointSideGroups(state, hex.id)) {
      const groupSet = new Set(groupSides);
      if (BREEDING_RULES.donkey.disallowLooseGoodsOnHex) {
        const hasLooseGoods = groupSides.some(s =>
          Object.values(getGoodsOnSide(state, hex.id, s)).some(q => (q || 0) > 0)
        );
        if (hasLooseGoods) continue;
      }

      const transportersOnSide = Object.values(state.transporters).filter(
        t => t.hexId === hex.id && groupSet.has(getTransporterSide(state, t))
      );
      if (transportersOnSide.length !== BREEDING_RULES.donkey.exactDonkeyCount) continue;
      if (!transportersOnSide.every(t => t.type === 'donkey')) continue;

      const ownerId = transportersOnSide[0].ownerId;
      if (BREEDING_RULES.donkey.requireSameOwner && transportersOnSide[1].ownerId !== ownerId) continue;

      if (BREEDING_RULES.donkey.disallowCargoOnDonkeys) {
        const hasCargo = transportersOnSide.some(d =>
          Object.values(d.cargo || {}).some(q => (q || 0) > 0)
        );
        if (hasCargo) continue;
      }

      if (!canPlayerSpawnTransporter(state, ownerId, 'donkey')) continue;

      const breedSide = getTransporterSide(state, transportersOnSide[0]);
      for (let i = 0; i < BREEDING_RULES.donkey.newbornDonkeyCount; i++) {
        if (!canPlayerSpawnTransporter(state, ownerId, 'donkey')) break;
        const newDonkeyId = `t_${ownerId}_donkey_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        state.transporters[newDonkeyId] = {
          id: newDonkeyId,
          ownerId,
          type: 'donkey',
          hexId: hex.id,
          side: breedSide,
          cargo: {},
          movesLeft: TRANSPORTER_RULES.donkey.baseSpeed,
          maxMoves: TRANSPORTER_RULES.donkey.baseSpeed,
          capacity: TRANSPORTER_RULES.donkey.capacity,
        };
      }

      const owner = state.players.find(p => p.id === ownerId);
      addLog(
        state,
        `🌱 Two donkeys alone on pasture (${hex.id}) bred a newborn donkey for ${owner?.name || 'player'}!`
      );
    }
  });

  // 4. Goose Reproduction on Pasture (evaluated per bank side)
  Object.values(state.hexes).forEach(hex => {
    if (
      hex.terrain !== BREEDING_RULES.goose.terrain ||
      (BREEDING_RULES.goose.disallowBuildingsOnHex && hex.building)
    )
      return;
    ensureHexGoodsBySide(state, hex);

    for (const groupSides of getDisjointSideGroups(state, hex.id)) {
      const groupSet = new Set(groupSides);
      const geeseOnSide = getAvailableOnSides(state, hex.id, groupSides, 'goose');
      if (geeseOnSide !== BREEDING_RULES.goose.exactGeeseCount) continue;

      if (BREEDING_RULES.goose.disallowOtherGoodsOnHex) {
        const hasOtherGoods = groupSides.some(s =>
          Object.entries(getGoodsOnSide(state, hex.id, s)).some(
            ([g, q]) => g !== 'goose' && (q || 0) > 0
          )
        );
        if (hasOtherGoods) continue;
      }

      if (BREEDING_RULES.goose.disallowTransportersOnHex) {
        const hasTransporters = Object.values(state.transporters).some(
          t => t.hexId === hex.id && groupSet.has(getTransporterSide(state, t))
        );
        if (hasTransporters) continue;
      }

      addGoodOnSide(state, hex.id, groupSides[0], 'goose', BREEDING_RULES.goose.newbornGeeseCount);
      state.players.forEach(p => {
        if (!p.isAI) return;
        const ownedGeeseOnGroup = p.aiOwnedGoodsBySide?.[hex.id]
          ? groupSides.reduce((sum, s) => sum + (p.aiOwnedGoodsBySide?.[hex.id]?.[s]?.goose || 0), 0)
          : p.aiOwnedGoods?.[hex.id]?.goose || 0;
        if (ownedGeeseOnGroup === BREEDING_RULES.goose.exactGeeseCount) {
          creditAiGood(state, p.id, hex.id, 'goose', BREEDING_RULES.goose.newbornGeeseCount, groupSides[0]);
        }
      });
      addLog(
        state,
        `🪿 Two geese alone on pasture (${hex.id}) bred a newborn goose (+${BREEDING_RULES.goose.newbornGeeseCount} Goose)!`
      );
    }
  });

  // 4.5. Remove Unattended Geese & Paper (2 Geese + 1 Paper with no transporter on accessible side)
  const reqResearchGeese = ROADS_AND_BOATS_RULES.research.standardCost.goose;
  const reqResearchPaper = ROADS_AND_BOATS_RULES.research.standardCost.paper;
  Object.values(state.hexes).forEach(hex => {
    ensureHexGoodsBySide(state, hex);
    for (const groupSides of getDisjointSideGroups(state, hex.id)) {
      const groupSet = new Set(groupSides);
      const hasAttendingTransporter = Object.values(state.transporters).some(
        t => t.hexId === hex.id && isTransporterAccessibleForFactory(state, t, groupSet)
      );
      if (hasAttendingTransporter) continue;

      const geeseOnSide = getAvailableOnSides(state, hex.id, groupSides, 'goose');
      const paperOnSide = getAvailableOnSides(state, hex.id, groupSides, 'paper');
      const unattendedSets = Math.min(
        Math.floor(geeseOnSide / reqResearchGeese),
        Math.floor(paperOnSide / reqResearchPaper)
      );
      if (unattendedSets <= 0) continue;

      const geeseToRemove = unattendedSets * reqResearchGeese;
      const paperToRemove = unattendedSets * reqResearchPaper;

      let remGeese = geeseToRemove;
      for (const s of groupSides) {
        if (remGeese <= 0) break;
        const avail = getGoodsOnSide(state, hex.id, s).goose || 0;
        if (avail > 0) {
          const take = Math.min(avail, remGeese);
          removeGoodOnSide(state, hex.id, s, 'goose', take);
          remGeese -= take;
        }
      }

      let remPaper = paperToRemove;
      for (const s of groupSides) {
        if (remPaper <= 0) break;
        const avail = getGoodsOnSide(state, hex.id, s).paper || 0;
        if (avail > 0) {
          const take = Math.min(avail, remPaper);
          removeGoodOnSide(state, hex.id, s, 'paper', take);
          remPaper -= take;
        }
      }

      state.players.forEach(p => {
        if (!p.isAI) return;
        if (p.aiOwnedGoodsBySide?.[hex.id]) {
          let changed = false;
          for (const s of groupSides) {
            const aiSide = p.aiOwnedGoodsBySide[hex.id][s];
            if (!aiSide) continue;
            const groundSide = getGoodsOnSide(state, hex.id, s);
            (['goose', 'paper'] as const).forEach(good => {
              const cur = aiSide[good] || 0;
              const maxAllowed = groundSide[good] || 0;
              if (cur > maxAllowed) {
                if (maxAllowed <= 0) delete aiSide[good];
                else aiSide[good] = maxAllowed;
                changed = true;
              }
            });
          }
          if (changed) syncAiFlatGoodsForHex(p, hex.id);
        } else if (p.aiOwnedGoods?.[hex.id]) {
          (['goose', 'paper'] as const).forEach(good => {
            const cur = p.aiOwnedGoods![hex.id][good] || 0;
            const maxAllowed = hex.goods[good] || 0;
            if (cur > maxAllowed) {
              if (maxAllowed <= 0) delete p.aiOwnedGoods![hex.id][good];
              else p.aiOwnedGoods![hex.id][good] = maxAllowed;
            }
          });
        }
      });

      addLog(
        state,
        `🪿📜 Unattended geese & paper on (${hex.id}) without a transporter: ${geeseToRemove} Geese and ${paperToRemove} Paper were removed from the game.`
      );
    }
  });

  // 5. Reset Transporter Movement (road-speed applies only if a road/bridge touches transporter's side)
  Object.values(state.transporters).forEach(t => {
    const spec = TRANSPORTER_SPECS[t.type];
    const hex = state.hexes[t.hexId];
    const tSide = getTransporterSide(state, t);
    const hasRoad = hex ? doesSideTouchRoad(state, t.hexId, tSide) : false;

    t.maxMoves = hasRoad ? spec.roadSpeed : spec.baseSpeed;
    t.movesLeft = t.maxMoves;
  });

  addLog(state, `Production cycle concluded. Transporters refreshed.`);
}

const FACTORY_ACCEPTED_INPUT_GOODS: Partial<Record<BuildingType, ReadonlyArray<GoodType>>> = {
  sawmill: ['wood'],
  brickworks: ['clay'],
  burner: ['boards', 'wood'],
  papermill: ['boards', 'wood'],
  mint: ['gold', 'fuel'],
  stockexchange: ['coin', 'paper'],
  wagonfactory: ['boards'],
  raftfactory: ['wood'],
  shipyard: ['boards'],
  truckfactory: ['iron', 'fuel'],
  steamerfactory: ['iron', 'fuel'],
};

/**
 * Checks if advancing from the WONDER phase will start a new round and run Production
 * (rather than ending the game).
 */
export function willAdvanceFromWonderRunProduction(state: GameState): boolean {
  if (state.phase !== 'WONDER') return false;
  const bricksPlacedThisRound = Object.values(state.wonderBricksThisRoundByPlayer || {}).reduce(
    (sum, qty) => sum + (qty || 0),
    0
  );
  const currentTotalBricks = state.wonder.reduce((sum, t) => sum + t.bricks.length, 0);
  const allCurrentlyFull = state.wonder.every(t => t.bricks.length >= t.totalSlots);
  const addedNeutral = bricksPlacedThisRound === 0 && !allCurrentlyFull ? 1 : 0;

  const projectedTotalBricks = currentTotalBricks + addedNeutral;
  const projectedNeutralBricks = (state.neutralBricksUsed || 0) + addedNeutral;
  const playerCountKey = Math.max(1, Math.min(4, state.players.length)) as 1 | 2 | 3 | 4;
  const endGameBrickIdx =
    ROADS_AND_BOATS_RULES.wonderRules.endGameBrickIndexByPlayerCount[playerCountKey];

  const reachedEndBrick = endGameBrickIdx !== null && projectedTotalBricks >= endGameBrickIdx;
  const reachedNeutralLimit =
    projectedNeutralBricks >= ROADS_AND_BOATS_RULES.wonderRules.maxNeutralBricksTurnLimit;
  const allWonderFull =
    allCurrentlyFull ||
    (addedNeutral === 1 &&
      projectedTotalBricks >= state.wonder.reduce((sum, t) => sum + t.totalSlots, 0));

  return !(reachedEndBrick || reachedNeutralLimit || allWonderFull || state.round >= state.maxRounds);
}

/**
 * Identifies player transporters stationed on player's own input-taking factory tiles
 * (on accessible sides) carrying items that can be used as production inputs.
 */
export function getProductionCargoCandidates(
  state: GameState,
  playerId: string
): TransporterProductionCandidate[] {
  const potentialPairs: Array<{
    hex: HexTile;
    buildingType: BuildingType;
    bSide: number;
    transporter: Transporter;
    acceptedGoods: ReadonlyArray<GoodType>;
  }> = [];

  Object.values(state.hexes).forEach(hex => {
    if (!hex.building || hex.building.ownerId !== playerId) return;
    const acceptedGoods = FACTORY_ACCEPTED_INPUT_GOODS[hex.building.type];
    if (!acceptedGoods || acceptedGoods.length === 0) return;

    const bSide = getBuildingSide(state, hex);
    const accessibleSet = getAccessibleSidesOnHex(state, hex.id, bSide);
    Object.values(state.transporters).forEach(t => {
      if (t.ownerId !== playerId || t.hexId !== hex.id) return;
      if (!isTransporterAccessibleForFactory(state, t, accessibleSet)) return;
      const carriesAccepted = acceptedGoods.some(g => (t.cargo[g] || 0) > 0);
      if (!carriesAccepted) return;
      potentialPairs.push({
        hex,
        buildingType: hex.building!.type,
        bSide,
        transporter: t,
        acceptedGoods,
      });
    });
  });

  if (potentialPairs.length === 0) return [];

  // Dry-run production with all transporter cargo allowed, and per-transporter fallback for alternate transporters
  const cloneState = (): GameState => {
    const copy = JSON.parse(JSON.stringify(state)) as GameState;
    copy.history = [];
    copy.redoStack = [];
    return copy;
  };

  const simAll = cloneState();
  runProductionPhase(simAll, { allowTransporterCargo: true });

  const candidates: TransporterProductionCandidate[] = [];

  for (const pair of potentialPairs) {
    const origT = pair.transporter;
    const simT = simAll.transporters[origT.id];
    const usableGoods: Array<{ good: GoodType; quantity: number }> = [];

    for (const g of pair.acceptedGoods) {
      const before = origT.cargo[g] || 0;
      const after = simT?.cargo?.[g] || 0;
      if (before > after) {
        usableGoods.push({ good: g, quantity: before - after });
      }
    }

    // If another transporter on the same factory was drawn first in simAll, also check if THIS transporter alone can supply inputs
    if (usableGoods.length === 0) {
      const simOne = cloneState();
      runProductionPhase(simOne, { allowTransporterCargo: [origT.id] });
      const simOneT = simOne.transporters[origT.id];
      for (const g of pair.acceptedGoods) {
        const before = origT.cargo[g] || 0;
        const after = simOneT?.cargo?.[g] || 0;
        if (before > after) {
          usableGoods.push({ good: g, quantity: before - after });
        }
      }
    }

    if (usableGoods.length > 0) {
      candidates.push({
        hexId: pair.hex.id,
        buildingType: pair.buildingType,
        buildingName: BUILDING_SPECS[pair.buildingType]?.name || pair.buildingType,
        buildingSide: pair.bSide,
        transporterId: origT.id,
        transporterType: origT.type,
        transporterName: TRANSPORTER_SPECS[origT.type]?.name || origT.type,
        usableGoods,
      });
    }
  }

  return candidates;
}

export function advancePhase(state: GameState, options?: ProductionPhaseOptions): GameState {
  if (state.phase === 'COMPLETED') return state;

  recordHistorySnapshot(
    state,
    `Advance phase from ${state.phase} (Round ${state.round})`,
    state.activePlayerId
  );

  switch (state.phase) {
    case 'PRODUCTION':
      state.phase = 'MOVEMENT';
      addLog(state, `Phase changed to MOVEMENT. Command your pack donkeys and boats.`);
      break;
    case 'MOVEMENT':
      state.phase = 'BUILDING';
      addLog(state, `Phase changed to BUILDING. Pave roads, erect bridges, and build factories.`);
      break;
    case 'BUILDING':
      state.phase = 'WONDER';
      addLog(state, `Phase changed to WONDER. Contribute bricks to the great monument.`);
      break;
    case 'WONDER': {
      // Official 3rd Edition Rule: If no player laid bricks onto the Wonder this round, add 1 Neutral brick
      const bricksPlacedThisRound = Object.values(state.wonderBricksThisRoundByPlayer || {}).reduce(
        (sum, qty) => sum + (qty || 0),
        0
      );
      if (bricksPlacedThisRound === 0) {
        const prevTotal = state.wonder.reduce((sum, t) => sum + t.bricks.length, 0);
        const openTier = state.wonder.find(t => t.bricks.length < t.totalSlots);
        if (openTier) {
          openTier.bricks.push({
            brickIndex: openTier.bricks.length,
            tier: openTier.tierIndex,
            ownerId: 'NEUTRAL',
            points: 0,
            round: state.round,
          });
          state.neutralBricksUsed = (state.neutralBricksUsed || 0) + 1;
          addLog(
            state,
            `🏛️ No Wonder bricks placed in Round ${state.round} — added 1 Neutral Brick to ${openTier.name}.`
          );

          const newTotal = prevTotal + 1;
          const irrigationTrigger = ROADS_AND_BOATS_RULES.wonderRules.irrigationTriggerBrickIndex;
          if (prevTotal < irrigationTrigger && newTotal >= irrigationTrigger) {
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
        }
      }
      state.wonderBricksThisRoundByPlayer = {};

      const totalWonderBricks = state.wonder.reduce((sum, t) => sum + t.bricks.length, 0);
      const playerCountKey = Math.max(1, Math.min(4, state.players.length)) as 1 | 2 | 3 | 4;
      const endGameBrickIdx =
        ROADS_AND_BOATS_RULES.wonderRules.endGameBrickIndexByPlayerCount[playerCountKey];
      const reachedEndBrick = endGameBrickIdx !== null && totalWonderBricks >= endGameBrickIdx;
      const reachedNeutralLimit =
        (state.neutralBricksUsed || 0) >= ROADS_AND_BOATS_RULES.wonderRules.maxNeutralBricksTurnLimit;
      const allWonderFull = state.wonder.every(t => t.bricks.length >= t.totalSlots);

      if (reachedEndBrick || reachedNeutralLimit || allWonderFull || state.round >= state.maxRounds) {
        state.phase = 'COMPLETED';
        state.status = 'finished';
        calculateScores(state);
        state.winnerId = getLeaderPlayerId(state);
        addLog(
          state,
          reachedEndBrick
            ? `THE WONDER REACHED ${totalWonderBricks} BRICKS (Endgame Mark ${endGameBrickIdx})! Game finished.`
            : reachedNeutralLimit
            ? `All ${ROADS_AND_BOATS_RULES.wonderRules.maxNeutralBricksTurnLimit} neutral Wonder bricks placed! Game finished.`
            : `Max rounds (${state.maxRounds}) reached. Game finished!`
        );
      } else {
        state.round += 1;
        state.phase = 'PRODUCTION';
        runProductionPhase(state, options);
        addLog(state, `Round ${state.round} began. Running production phase.`);
      }
      break;
    }
  }

  calculateScores(state);
  state.updatedAt = Date.now();
  return state;
}
