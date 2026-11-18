/**
 * Transporter Movement & Cargo Management
 */

import { GameState, GoodType, Transporter } from '../types';
import { TRANSPORTER_SPECS } from '../constants';
import { areHexNeighbors, getEdgeKey, parseHexKey } from '../hexMath';
import {
  addGoodOnSide,
  areSidesConnectedByBridgeOnHex,
  doesSideFlankRiverEdge,
  getAccessibleSidesOnHex,
  getBestAccessibleSide,
  getEntrySideFromNeighbor,
  getValidEntrySidesFromNeighbor,
  getGoodsOnSide,
  getHexSideLayout,
  getInteractableSidesForTransporter,
  getNeighborSideOnHex,
  getTransporterSide,
  normalizeSideForHex,
  removeGoodOnSide,
} from '../riverSides';
import { addLog, calculateScores, recordHistorySnapshot } from './history';

function getCargoInteractableSides(state: GameState, transporter: Transporter): number[] {
  const spec = TRANSPORTER_SPECS[transporter.type];
  if (spec.waterOnly) {
    return getInteractableSidesForTransporter(state, transporter);
  }
  const tSide = getTransporterSide(state, transporter);
  return Array.from(getAccessibleSidesOnHex(state, transporter.hexId, tSide));
}

export function canMoveTransporter(
  state: GameState,
  transporterId: string,
  targetHexId: string,
  actingPlayerId?: string,
  targetSide?: number
): { valid: boolean; reason?: string; moveCost?: number } {
  const transporter = state.transporters[transporterId];
  if (!transporter) return { valid: false, reason: 'Transporter not found' };

  if (actingPlayerId && transporter.ownerId !== actingPlayerId) {
    return { valid: false, reason: 'Transporter belongs to another player' };
  }

  if (state.phase !== 'MOVEMENT') {
    return { valid: false, reason: 'Movement is only permitted during the Movement Phase' };
  }

  if (transporter.movesLeft <= 0) {
    return { valid: false, reason: 'Transporter has no moves remaining this round' };
  }

  const currentHex = state.hexes[transporter.hexId];
  const targetHex = state.hexes[targetHexId];
  if (!currentHex || !targetHex) return { valid: false, reason: 'Invalid hex tile' };

  const spec = TRANSPORTER_SPECS[transporter.type];

  // Allow crossing an internal bridged river to another bank on the same hex
  if (transporter.hexId === targetHexId) {
    if (!spec.waterOnly && typeof targetSide === 'number') {
      const layout = getHexSideLayout(state, transporter.hexId);
      const fromSide = getTransporterSide(state, transporter);
      const normTarget = normalizeSideForHex(state, transporter.hexId, targetSide);
      if (layout.isSplit && fromSide !== normTarget) {
        if (areSidesConnectedByBridgeOnHex(state, transporter.hexId, fromSide, normTarget)) {
          return { valid: true, moveCost: 1 };
        }
        return {
          valid: false,
          reason: 'Blocked by an unbridged river dividing this tile! Pave a Bridge first.',
        };
      }
    }
    return { valid: false, reason: 'Transporter is already at this location' };
  }

  const currCoord = parseHexKey(transporter.hexId);
  const targetCoord = parseHexKey(targetHexId);

  if (!areHexNeighbors(currCoord, targetCoord)) {
    return { valid: false, reason: 'Target hex must be directly adjacent' };
  }

  const edgeKey = getEdgeKey(currCoord.q, currCoord.r, targetCoord.q, targetCoord.r);
  const edge = state.edges[edgeKey];
  const isPavedEdge = Boolean(
    edge && (edge.improvement === 'road' || edge.improvement === 'bridge' || edge.isRailroad)
  );

  if (spec.waterOnly) {
    const isRiverEdge = Boolean(edge && edge.isRiver);
    const bothWater = currentHex.terrain === 'water' && targetHex.terrain === 'water';
    const isDocking =
      (currentHex.terrain === 'water' && targetHex.terrain !== 'water') ||
      (currentHex.terrain !== 'water' && targetHex.terrain === 'water');

    if (currentHex.terrain !== 'water' && targetHex.terrain !== 'water') {
      if (!isRiverEdge) {
        return {
          valid: false,
          reason: 'Boats and rafts cannot travel overland between land tiles without a river',
        };
      }
      // If docked on a shore away from the river on a split tile, verify side touches this river exit
      if (transporter.waterLocation === 'shore') {
        const fromSide = getTransporterSide(state, transporter);
        if (!doesSideFlankRiverEdge(state, transporter.hexId, fromSide, edgeKey)) {
          return {
            valid: false,
            reason: 'Watercraft cannot cross dry land to reach a separate river channel',
          };
        }
      }
    } else if (!bothWater && !isRiverEdge && !isDocking) {
      return {
        valid: false,
        reason: 'Watercraft can only navigate along rivers, across open water, or at docks',
      };
    } else if (
      currentHex.terrain !== 'water' &&
      targetHex.terrain === 'water' &&
      transporter.waterLocation === 'shore'
    ) {
      const fromSide = getTransporterSide(state, transporter);
      const facingSide = getNeighborSideOnHex(state, transporter.hexId, targetHexId);
      if (facingSide !== null && facingSide !== fromSide) {
        return {
          valid: false,
          reason: 'Watercraft docked on the opposite coast cannot cross overland inside this tile',
        };
      }
    }

    return { valid: true, moveCost: 1 };
  }

  // Land transporters (Donkey, Wagon, Truck)
  if (targetHex.terrain === 'water') {
    return { valid: false, reason: 'Land transporters cannot traverse open water' };
  }

  const fromSide = getTransporterSide(state, transporter);
  const isRiverEdge = Boolean(edge && edge.isRiver);

  if (isRiverEdge) {
    if (!doesSideFlankRiverEdge(state, transporter.hexId, fromSide, edgeKey)) {
      return {
        valid: false,
        reason: 'Blocked by an unbridged river dividing this tile! Pave a Bridge to reach that riverbank.',
      };
    }
    if (spec.roadOnly && edge.improvement !== 'bridge') {
      return { valid: false, reason: 'Cannot cross an unbridged river! Pave a Bridge first.' };
    }
    if (typeof targetSide === 'number') {
      const entrySides = getValidEntrySidesFromNeighbor(
        state,
        transporter.hexId,
        fromSide,
        targetHexId
      );
      const normTarget = normalizeSideForHex(state, targetHexId, targetSide);
      if (
        !entrySides.some(entrySide =>
          areSidesConnectedByBridgeOnHex(state, targetHexId, entrySide, normTarget)
        )
      ) {
        return {
          valid: false,
          reason: 'Cannot cross an unbridged river to land on the opposite riverbank',
        };
      }
    }
  } else {
    const neededExitSide = getNeighborSideOnHex(state, transporter.hexId, targetHexId);
    if (
      neededExitSide !== null &&
      !areSidesConnectedByBridgeOnHex(state, transporter.hexId, fromSide, neededExitSide)
    ) {
      return {
        valid: false,
        reason: 'Blocked by an unbridged river dividing this tile! Pave a Bridge first.',
      };
    }

    if (spec.roadOnly && !isPavedEdge) {
      return {
        valid: false,
        reason: 'Wagons and trucks can only travel along paved Roads, Bridges, or Railroads',
      };
    }

    if (typeof targetSide === 'number') {
      const entrySides = getValidEntrySidesFromNeighbor(
        state,
        transporter.hexId,
        fromSide,
        targetHexId
      );
      const normTarget = normalizeSideForHex(state, targetHexId, targetSide);
      if (
        !entrySides.some(entrySide =>
          areSidesConnectedByBridgeOnHex(state, targetHexId, entrySide, normTarget)
        )
      ) {
        return {
          valid: false,
          reason: 'Cannot enter opposite side of an unbridged river',
        };
      }
    }
  }

  if (transporter.type === 'donkey' && !isPavedEdge) {
    // Official Rule: A Donkey may move 1 space off-road OR 2 spaces strictly along roads per round.
    if (transporter.movesLeft < transporter.maxMoves) {
      return {
        valid: false,
        reason: 'Donkeys cannot move off-road after moving along a road (1 off-road OR 2 road moves)',
      };
    }
    return { valid: true, moveCost: transporter.movesLeft };
  }

  return { valid: true, moveCost: 1 };
}

export function executeMoveTransporter(
  state: GameState,
  transporterId: string,
  targetHexId: string,
  actingPlayerId?: string,
  targetSide?: number
): boolean {
  const check = canMoveTransporter(state, transporterId, targetHexId, actingPlayerId, targetSide);
  if (!check.valid) return false;

  const transporter = state.transporters[transporterId];
  const fromHex = transporter.hexId;
  const fromSide = getTransporterSide(state, transporter);
  const spec = TRANSPORTER_SPECS[transporter.type];
  const currCoord = parseHexKey(fromHex);
  const targetCoord = parseHexKey(targetHexId);
  const edge =
    fromHex !== targetHexId
      ? state.edges[getEdgeKey(currCoord.q, currCoord.r, targetCoord.q, targetCoord.r)]
      : undefined;
  const targetHex = state.hexes[targetHexId];

  recordHistorySnapshot(
    state,
    fromHex === targetHexId
      ? `Cross bridge inside (${fromHex}) with ${spec.name}`
      : `Move ${spec.name} from (${fromHex}) to (${targetHexId})`,
    transporter.ownerId
  );

  if (fromHex === targetHexId && typeof targetSide === 'number') {
    transporter.side = normalizeSideForHex(state, targetHexId, targetSide);
  } else if (spec.waterOnly) {
    transporter.hexId = targetHexId;
    if (targetHex?.terrain === 'water') {
      transporter.waterLocation = 'sea';
      transporter.side = 0;
    } else if (edge && edge.isRiver) {
      transporter.waterLocation = 'river';
      transporter.side = getBestAccessibleSide(state, targetHexId);
    } else {
      transporter.waterLocation = 'shore';
      transporter.side = getEntrySideFromNeighbor(state, fromHex, fromSide, targetHexId);
    }
  } else {
    transporter.hexId = targetHexId;
    const entrySides = getValidEntrySidesFromNeighbor(state, fromHex, fromSide, targetHexId);
    const defaultEntry = entrySides[0] ?? 0;
    const normTarget =
      typeof targetSide === 'number'
        ? normalizeSideForHex(state, targetHexId, targetSide)
        : undefined;
    if (
      normTarget !== undefined &&
      entrySides.some(entrySide =>
        areSidesConnectedByBridgeOnHex(state, targetHexId, entrySide, normTarget)
      )
    ) {
      transporter.side = normTarget;
    } else {
      transporter.side = defaultEntry;
    }
  }

  transporter.movesLeft = Math.max(0, transporter.movesLeft - (check.moveCost || 1));

  addLog(
    state,
    fromHex === targetHexId
      ? `${spec.name} crossed Bridge inside (${fromHex})`
      : `${spec.name} moved from (${fromHex}) to (${targetHexId})`,
    transporter.ownerId
  );
  state.updatedAt = Date.now();
  return true;
}

export function getGoodCargoWeight(good: GoodType): number {
  // Official Splotter Rule: Geese can be transported freely without using cargo capacity
  return good === 'goose' ? 0 : 1;
}

export function getTransporterCargoWeight(transporter: Transporter): number {
  return Object.entries(transporter.cargo).reduce(
    (sum, [good, qty]) => sum + getGoodCargoWeight(good as GoodType) * (qty || 0),
    0
  );
}

export function canPickupGoods(
  state: GameState,
  transporterId: string,
  good: GoodType,
  amount: number,
  actingPlayerId?: string,
  targetSide?: number
): { valid: boolean; reason?: string } {
  if (state.phase !== 'MOVEMENT') {
    return { valid: false, reason: 'Goods can only be picked up during the Movement Phase' };
  }
  if (amount <= 0) return { valid: false, reason: 'Amount must be greater than zero' };
  const transporter = state.transporters[transporterId];
  if (!transporter) return { valid: false, reason: 'Transporter not found' };

  if (actingPlayerId && transporter.ownerId !== actingPlayerId) {
    return { valid: false, reason: 'Transporter belongs to another player' };
  }

  const hex = state.hexes[transporter.hexId];
  if (!hex) return { valid: false, reason: 'Hex not found' };

  const interactableSides = getCargoInteractableSides(state, transporter);
  if (typeof targetSide === 'number') {
    const normSide = normalizeSideForHex(state, hex.id, targetSide);
    if (!interactableSides.includes(normSide)) {
      return {
        valid: false,
        reason: `Cannot collect ${good} across an unbridged river from the other side of this hex`,
      };
    }
    const availOnSide = getGoodsOnSide(state, hex.id, normSide)[good] || 0;
    if (availOnSide < amount) {
      return {
        valid: false,
        reason: `Only ${availOnSide} ${good} available on that riverbank`,
      };
    }
  } else {
    const availAccessible = interactableSides.reduce(
      (sum, s) => sum + (getGoodsOnSide(state, hex.id, s)[good] || 0),
      0
    );
    if (availAccessible < amount) {
      const totalOnHex = hex.goods[good] || 0;
      if (totalOnHex >= amount) {
        return {
          valid: false,
          reason: `Cannot collect ${good}: it is across an unbridged river on the opposite bank`,
        };
      }
      return {
        valid: false,
        reason: `Only ${availAccessible} ${good} available on your side of this hex`,
      };
    }
  }

  const currentWeight = getTransporterCargoWeight(transporter);
  const addedWeight = getGoodCargoWeight(good) * amount;
  if (currentWeight + addedWeight > transporter.capacity) {
    return {
      valid: false,
      reason: `Exceeds capacity (Max: ${transporter.capacity}, Current: ${currentWeight})`,
    };
  }

  return { valid: true };
}

export function executePickupGoods(
  state: GameState,
  transporterId: string,
  good: GoodType,
  amount: number,
  actingPlayerId?: string,
  targetSide?: number
): boolean {
  const check = canPickupGoods(state, transporterId, good, amount, actingPlayerId, targetSide);
  if (!check.valid) return false;

  const transporter = state.transporters[transporterId];
  const hex = state.hexes[transporter.hexId];

  recordHistorySnapshot(
    state,
    `Load ${amount}x ${good} onto ${TRANSPORTER_SPECS[transporter.type].name}`,
    transporter.ownerId
  );

  if (typeof targetSide === 'number') {
    removeGoodOnSide(state, hex.id, normalizeSideForHex(state, hex.id, targetSide), good, amount);
  } else {
    const tSide = getTransporterSide(state, transporter);
    const orderedSides = [
      tSide,
      ...getCargoInteractableSides(state, transporter).filter(s => s !== tSide),
    ];
    let remaining = amount;
    for (const s of orderedSides) {
      if (remaining <= 0) break;
      const taken = removeGoodOnSide(state, hex.id, s, good, remaining);
      remaining -= taken;
    }
  }

  transporter.cargo[good] = (transporter.cargo[good] || 0) + amount;

  addLog(
    state,
    `${TRANSPORTER_SPECS[transporter.type].name} loaded ${amount}x ${good}`,
    transporter.ownerId
  );
  calculateScores(state);
  state.updatedAt = Date.now();
  return true;
}

export function canDropGoods(
  state: GameState,
  transporterId: string,
  good: GoodType,
  amount: number,
  actingPlayerId?: string,
  targetSide?: number
): { valid: boolean; reason?: string } {
  if (state.phase !== 'MOVEMENT') {
    return { valid: false, reason: 'Goods can only be dropped during the Movement Phase' };
  }
  if (amount <= 0) return { valid: false, reason: 'Amount must be positive' };
  const transporter = state.transporters[transporterId];
  if (!transporter) return { valid: false, reason: 'Transporter not found' };

  if (actingPlayerId && transporter.ownerId !== actingPlayerId) {
    return { valid: false, reason: 'Transporter belongs to another player' };
  }

  const carried = transporter.cargo[good] || 0;
  if (carried < amount) {
    return { valid: false, reason: `Only carrying ${carried}x ${good}` };
  }

  const hex = state.hexes[transporter.hexId];
  if (hex && hex.terrain === 'water') {
    return { valid: false, reason: 'Goods cannot be abandoned in open water/sea' };
  }

  if (hex && typeof targetSide === 'number') {
    const interactableSides = getCargoInteractableSides(state, transporter);
    const normSide = normalizeSideForHex(state, hex.id, targetSide);
    if (!interactableSides.includes(normSide)) {
      return {
        valid: false,
        reason: `Cannot drop or feed ${good} across an unbridged river onto the other side of this hex`,
      };
    }
  }

  return { valid: true };
}

export function executeDropGoods(
  state: GameState,
  transporterId: string,
  good: GoodType,
  amount: number,
  actingPlayerId?: string,
  targetSide?: number
): boolean {
  const check = canDropGoods(state, transporterId, good, amount, actingPlayerId, targetSide);
  if (!check.valid) return false;

  const transporter = state.transporters[transporterId];
  const hex = state.hexes[transporter.hexId];

  recordHistorySnapshot(
    state,
    `Drop ${amount}x ${good} from ${TRANSPORTER_SPECS[transporter.type].name}`,
    transporter.ownerId
  );

  transporter.cargo[good] = (transporter.cargo[good] || 0) - amount;
  if (transporter.cargo[good]! <= 0) delete transporter.cargo[good];

  const interactableSides = getCargoInteractableSides(state, transporter);
  const defaultSide = interactableSides.includes(getTransporterSide(state, transporter))
    ? getTransporterSide(state, transporter)
    : interactableSides[0] ?? 0;
  const dropSide =
    typeof targetSide === 'number'
      ? normalizeSideForHex(state, hex.id, targetSide)
      : defaultSide;

  addGoodOnSide(state, hex.id, dropSide, good, amount);

  addLog(
    state,
    `${TRANSPORTER_SPECS[transporter.type].name} dropped ${amount}x ${good} onto ground (now neutral)`,
    transporter.ownerId
  );
  calculateScores(state);
  state.updatedAt = Date.now();
  return true;
}

