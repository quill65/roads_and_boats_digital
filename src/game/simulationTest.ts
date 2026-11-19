/**
 * Roads & Boats - Comprehensive Game Simulation & Automated Test Suite
 * Simulates user taking all game actions:
 * - Movement off-road vs on-road
 * - River blocking and bridge crossing
 * - Cargo pickup, drop, and capacity enforcement
 * - Building roads & bridges using pooled materials
 * - Building ALL 12 building types with authentic terrain & resource rules
 * - Production conversions across the complete industrial tech tree
 * - Natural donkey breeding on pasture
 * - Wonder contributions and victory point calculations
 * - Multi-choice undo and redo move memory
 */

import {
  addGoodOnSide,
  advancePhase,
  BOT_PROFILES,
  canBuildFactory,
  canBuildRaft,
  canBuildRoad,
  canBuildWonder,
  canDeleteMatch,
  canDropGoods,
  canMoveTransporter,
  canPickupGoods,
  canReplenishMine,
  canResearchTech,
  calculateScores,
  createInitialGame,
  doesSideTouchRoad,
  executeBuildFactory,
  executeBuildRoad,
  executeBuildWonder,
  executeDropGoods,
  executeMoveTransporter,
  executePickupGoods,
  executeReplenishMine,
  executeResearchTech,
  findExistingPlayer,
  getBestAccessibleSide,
  getDryRoadGeometry,
  getEligibleResearchSites,
  getGoodsOnSide,
  getHexSideLayout,
  getHexSideVisualAnchor,
  getLegalResearchUpgrades,
  getMatchingBankAcrossRiverEdge,
  getNeighborSideOnHex,
  getProductionCargoCandidates,
  getRiverBankRoadGeometry,
  getRiverBridgeGeometry,
  getRiverEdgeBankPairs,
  getTransporterCargoWeight,
  getTransporterSide,
  isHexGameCode,
  isOnlyActivePlayerRemaining,
  isPlayerMatchStarter,
  reconnectSoloPlayer,
  redoMove,
  resignPlayer,
  runBotTurn,
  runProductionPhase,
  undoMove,
  willAdvanceFromWonderRunProduction,
} from './engine';
import { BuildingType, GameState, GoodType } from './types';
import { BUILDING_SPECS, TRANSPORTER_SPECS } from './constants';
import { areHexNeighbors, getEdgeKey, getSharedEdgeSegment, hexToPixel, parseHexKey } from './hexMath';
import {
  ALL_SCENARIOS,
  DEDUPLICATED_DRIVE_SCENARIO_NAMES,
  SCENARIO_MAP_SETS,
  SOLITAIRE_SCENARIOS,
} from './scenarios';
import { MAP_PRESETS } from './maps';

export interface TestResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string[];
  error?: string;
}

export interface SimulationSuiteResult {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  tests: TestResult[];
}

function createTestGame(): GameState {
  return createInitialGame('Test Match', 'river_valley', [
    { name: 'Tester Alice', isAI: false },
    { name: 'Tester Bob', isAI: false },
  ]);
}

/**
 * 1. Test Starting State & Rulebook Setup
 */
export function testInitialGameState(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();

  try {
    const player1 = state.players[0];
    const donkeys = Object.values(state.transporters).filter(t => t.ownerId === player1.id && t.type === 'donkey');
    if (donkeys.length !== 3) {
      throw new Error(`Expected exactly 3 donkeys, found ${donkeys.length}`);
    }
    details.push(`✓ Starting donkeys verified: 3`);

    const homeHex = state.hexes[player1.homeHexId];
    if (!homeHex) throw new Error('Home hex not found');

    const boards = homeHex.goods.boards || 0;
    const stone = homeHex.goods.stone || 0;
    const goose = homeHex.goods.goose || 0;
    if (boards !== 5 || stone !== 1 || goose !== 2) {
      throw new Error(`Expected starting stock of 5 boards, 1 stone, and 2 geese, found ${boards} boards, ${stone} stone, ${goose} geese`);
    }
    details.push(`✓ Starting stock verified (3rd Edition Drive Rules): 5 Boards, 1 Stone, 2 Geese`);

    if (donkeys[0].maxMoves !== 2 || donkeys[0].movesLeft !== 2) {
      throw new Error(`Expected Round 1 donkey on roaded home hex to have 2 road speed, got maxMoves=${donkeys[0].maxMoves}`);
    }
    details.push(`✓ Round 1 starting donkey road speed verified (2 moves on road-adjacent home hex)`);

    if (state.wonder.length !== 4) {
      throw new Error(`Expected 4 wonder tiers, found ${state.wonder.length}`);
    }
    details.push(`✓ Wonder monument initialized with 4 tiers`);

    return {
      id: 'initial_state',
      category: 'Setup & Rules',
      name: 'Initial State & Starting Stock (5 Boards, 1 Stone, 2 Geese, 3 Donkeys)',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'initial_state',
      category: 'Setup & Rules',
      name: 'Initial State & Starting Stock',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 2. Test Cargo Transport (Pickup, Drop, Capacity Constraints)
 */
export function testCargoTransport(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];
  const donkey = Object.values(state.transporters).find(t => t.ownerId === player1.id)!;
  const homeHex = state.hexes[player1.homeHexId];

  try {
    // Verify cargo pickup & drop are blocked outside MOVEMENT phase
    if (canPickupGoods(state, donkey.id, 'boards', 1).valid) {
      throw new Error('Cargo pickup must be blocked during PRODUCTION phase!');
    }
    if (canDropGoods(state, donkey.id, 'boards', 1).valid) {
      throw new Error('Cargo drop must be blocked during PRODUCTION phase!');
    }
    details.push('✓ Cargo pickup & drop blocked outside Movement Phase');

    state.phase = 'MOVEMENT';

    // Pick up 1 board (from 5 starting boards -> 4 left on ground)
    const picked1 = executePickupGoods(state, donkey.id, 'boards', 1);
    if (!picked1 || donkey.cargo.boards !== 1) {
      throw new Error('Failed to pick up 1 board');
    }
    if (homeHex.goods.boards !== 4) {
      throw new Error(`Hex boards should decrease to 4, but is ${homeHex.goods.boards}`);
    }
    details.push('✓ Donkey successfully picked up 1 Board from ground goods');

    // Pick up 1 more board (total 2 = max donkey capacity)
    const picked2 = executePickupGoods(state, donkey.id, 'boards', 1);
    if (!picked2 || ((donkey.cargo.boards as number) !== 2)) {
      throw new Error('Failed to pick up 2nd board to reach capacity');
    }
    details.push('✓ Donkey reached max capacity of 2 goods');

    // Try to pick up a 3rd item (should be rejected by capacity rule)
    const picked3 = executePickupGoods(state, donkey.id, 'stone', 1);
    if (picked3) {
      throw new Error('Transporter should NOT be able to exceed max capacity (2)!');
    }
    details.push('✓ Overcapacity pickup properly blocked');

    // Drop 1 board onto ground (from 3 on ground -> 4 on ground)
    const dropped = executeDropGoods(state, donkey.id, 'boards', 1);
    if (!dropped || donkey.cargo.boards !== 1) {
      throw new Error('Failed to drop 1 board');
    }
    if (homeHex.goods.boards !== 4) {
      throw new Error('Ground goods should increase after drop');
    }
    // Verify geese do NOT consume transporter capacity (e.g. Donkey can carry 2 boards + 2 geese simultaneously)
    const addSecondBoard = executePickupGoods(state, donkey.id, 'boards', 1);
    if (!addSecondBoard || (donkey.cargo.boards as number) !== 2) {
      throw new Error('Failed to pick up 2nd board before goose capacity check');
    }
    const pickGoose1 = executePickupGoods(state, donkey.id, 'goose', 1);
    const pickGoose2 = executePickupGoods(state, donkey.id, 'goose', 1);
    if (!pickGoose1 || !pickGoose2 || donkey.cargo.goose !== 2 || (donkey.cargo.boards as number) !== 2) {
      throw new Error(`Donkey with 2 boards must still legally carry 2 geese (got boards=${donkey.cargo.boards}, goose=${donkey.cargo.goose})`);
    }
    if (getTransporterCargoWeight(donkey) !== 2) {
      throw new Error(`Expected cargo weight 2 (geese cost 0 capacity), got ${getTransporterCargoWeight(donkey)}`);
    }
    if (executePickupGoods(state, donkey.id, 'stone', 1)) {
      throw new Error('Donkey carrying 2 boards + 2 geese must still block picking up a 3rd weighted good (stone)');
    }
    details.push('✓ Verified Donkey carrying 2 boards can still pick up 2 geese (geese use 0 capacity) while blocking 3rd weighted good');

    // Verify reverse order: loading 2 geese first leaves full 2/2 capacity free for 2 boards
    const donkey2 = Object.values(state.transporters).find(t => t.ownerId === player1.id && t.id !== donkey.id)!;
    addGoodOnSide(state, donkey2.hexId, getTransporterSide(state, donkey2), 'goose', 2);
    const g1 = executePickupGoods(state, donkey2.id, 'goose', 1);
    const g2 = executePickupGoods(state, donkey2.id, 'goose', 1);
    if (!g1 || !g2 || getTransporterCargoWeight(donkey2) !== 0) {
      throw new Error('Donkey carrying 2 geese must have 0 cargo weight used');
    }
    const b1 = executePickupGoods(state, donkey2.id, 'boards', 1);
    const b2 = executePickupGoods(state, donkey2.id, 'boards', 1);
    if (!b1 || !b2 || donkey2.cargo.goose !== 2 || donkey2.cargo.boards !== 2) {
      throw new Error('Donkey carrying 2 geese must still legally pick up 2 boards');
    }
    details.push('✓ Verified Donkey carrying 2 geese can still pick up 2 boards (2 geese + 2 boards)');

    return {
      id: 'cargo_transport',
      category: 'Transport & Freight',
      name: 'Cargo Loading, Unloading & Capacity Enforcement',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'cargo_transport',
      category: 'Transport & Freight',
      name: 'Cargo Loading, Unloading & Capacity Enforcement',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 3. Test Movement, Off-Road, Roads & River Barriers
 */
export function testMovementAndRivers(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];
  const donkey = Object.values(state.transporters).find(t => t.ownerId === player1.id)!;

  try {
    state.phase = 'MOVEMENT';
    const currHex = donkey.hexId;

    // Find an adjacent land hex without a river
    let targetHexId = '';
    const neighbors = [
      { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
      { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
    ];
    const [cq, cr] = currHex.split(',').map(Number);

    for (const nb of neighbors) {
      const tq = cq + nb.q;
      const tr = cr + nb.r;
      const hid = `${tq},${tr}`;
      const h = state.hexes[hid];
      if (h && h.terrain !== 'water') {
        const edgeKey = getEdgeKey(cq, cr, tq, tr);
        const edge = state.edges[edgeKey];
        if (edge && !edge.isRiver && edge.improvement === 'none') {
          targetHexId = hid;
          break;
        }
      }
    }

    if (!targetHexId) throw new Error('Could not find unpaved neighbor for movement test');

    const moved = executeMoveTransporter(state, donkey.id, targetHexId);
    if (!moved || donkey.hexId !== targetHexId) {
      throw new Error('Donkey failed to move to adjacent off-road hex');
    }
    details.push(`✓ Donkey moved 1 hex off-road (${currHex} → ${targetHexId})`);

    // Official rule: 1 off-road move OR 2 road-only moves; off-road consumes all remaining moves!
    if (donkey.movesLeft !== 0) {
      throw new Error(`Expected 0 moves left after off-road step, found ${donkey.movesLeft}`);
    }
    details.push('✓ Donkey off-road move consumed all remaining round movement (1 off-road OR 2 road-only)');

    // Also verify partial road move (maxMoves = 2, movesLeft = 1) cannot subsequently enter an off-road edge
    donkey.maxMoves = 2;
    donkey.movesLeft = 1;
    const mixedMoveCheck = canMoveTransporter(state, donkey.id, currHex);
    if (mixedMoveCheck.valid) {
      throw new Error('Donkey should NOT be able to move off-road after using 1 road move!');
    }
    details.push('✓ Donkey blocked from mixing 1 road move + 1 off-road move in the same round');

    // Find a river edge and verify Donkeys can walk along riverbanks into river-connected land tiles (e.g. Stone tile in A River Runs Through It), while roadOnly Wagons require a Bridge
    let riverHexA = '';
    let riverHexB = '';
    let riverEdgeId = '';
    for (const edge of Object.values(state.edges)) {
      if (edge.isRiver && edge.improvement === 'none') {
        const ha = state.hexes[edge.hexA];
        const hb = state.hexes[edge.hexB];
        if (ha && hb && ha.terrain !== 'water' && hb.terrain !== 'water') {
          riverHexA = edge.hexA;
          riverHexB = edge.hexB;
          riverEdgeId = edge.id;
          break;
        }
      }
    }

    if (riverHexA && riverHexB) {
      const flankingSide = getHexSideLayout(state, riverHexA).sides.find(s =>
        s.flankingRiverEdgeIds.includes(riverEdgeId)
      )?.side ?? 0;
      donkey.hexId = riverHexA;
      donkey.side = flankingSide;
      donkey.maxMoves = 1;
      donkey.movesLeft = 1;
      const donkeyRiverCheck = canMoveTransporter(state, donkey.id, riverHexB);
      if (!donkeyRiverCheck.valid) {
        throw new Error('Donkey should be able to walk along riverbank into adjacent river-connected land tile!');
      }

      const wagonId = 't_test_wagon_1';
      state.transporters[wagonId] = {
        id: wagonId,
        ownerId: player1.id,
        type: 'wagon',
        hexId: riverHexA,
        side: flankingSide,
        cargo: {},
        movesLeft: 3,
        maxMoves: 3,
        capacity: 3,
      };
      const wagonRiverCheck = canMoveTransporter(state, wagonId, riverHexB);
      if (wagonRiverCheck.valid) {
        throw new Error('Wheeled Wagon should NOT be able to cross an unbridged river!');
      }
      delete state.transporters[wagonId];
      details.push('✓ Donkey riverbank movement & Wagon unbridged river restriction verified');
    }

    // Explicitly verify Donkey can enter the stone (rock) tile (1,-1) in "A River Runs Through It" from all 4 adjacent land hexes
    const arrtiGame = createInitialGame('A River Runs Through It', 'scenario_river_runs_through_it', [
      { name: 'Solo', isAI: false },
    ], { isSolitaire: true, scenarioId: 'river_runs_through_it', maxRounds: 20 });
    arrtiGame.phase = 'MOVEMENT';
    const arrtiDonkey = Object.values(arrtiGame.transporters)[0];
    for (const adjId of ['0,-1', '2,-1', '0,0', '1,0']) {
      arrtiDonkey.hexId = adjId;
      arrtiDonkey.side = getNeighborSideOnHex(arrtiGame, adjId, '1,-1') ?? getBestAccessibleSide(arrtiGame, adjId);
      arrtiDonkey.movesLeft = 1;
      const check = canMoveTransporter(arrtiGame, arrtiDonkey.id, '1,-1');
      if (!check.valid) {
        throw new Error(`Donkey in A River Runs Through It could not enter stone tile 1,-1 from ${adjId}: ${check.reason}`);
      }
    }
    details.push('✓ Donkey can enter Stone (rock) tile (1,-1) in "A River Runs Through It" from all adjacent land tiles');

    // Land transporter cannot enter deep water tiles
    const waterHex = Object.values(state.hexes).find(h => h.terrain === 'water');
    if (waterHex) {
      const neighborsOfWater = [
        { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
        { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
      ];
      const wCoord = parseHexKey(waterHex.id);
      let adjacentLandHex = '';
      for (const n of neighborsOfWater) {
        const key = `${wCoord.q + n.q},${wCoord.r + n.r}`;
        if (state.hexes[key] && state.hexes[key].terrain !== 'water') {
          adjacentLandHex = key;
          break;
        }
      }
      if (adjacentLandHex) {
        donkey.hexId = adjacentLandHex;
        donkey.movesLeft = 1;
        const waterMoveCheck = canMoveTransporter(state, donkey.id, waterHex.id);
        if (waterMoveCheck.valid) {
          throw new Error('Land transporter should NOT be able to move into deep water!');
        }
        details.push('✓ Land transporter entry into open water blocked');
      }
    }

    // Watercraft movement rules: Raft can navigate river, cannot travel overland without river
    const raftId = 't_test_raft_1';
    state.transporters[raftId] = {
      id: raftId,
      ownerId: player1.id,
      type: 'raft',
      hexId: riverHexA || currHex,
      cargo: {},
      movesLeft: 1,
      maxMoves: 1,
      capacity: 1,
    };

    if (riverHexA && riverHexB) {
      state.transporters[raftId].hexId = riverHexA;
      state.transporters[raftId].waterLocation = 'river';
      const raftRiverMove = canMoveTransporter(state, raftId, riverHexB);
      if (!raftRiverMove.valid) {
        throw new Error(`Watercraft should navigate along rivers: ${raftRiverMove.reason}`);
      }
      details.push('✓ Raft navigation along river waterway validated');
    }

    // Raft overland move across land tiles without river must be blocked
    state.transporters[raftId].hexId = currHex;
    state.transporters[raftId].waterLocation = 'river';
    const raftOverlandMove = canMoveTransporter(state, raftId, targetHexId);
    if (raftOverlandMove.valid) {
      throw new Error('Watercraft should NOT be able to travel overland between land tiles without a river!');
    }
    details.push('✓ Watercraft overland movement without river properly blocked');

    // Cargo dumping into open water must be blocked
    if (waterHex) {
      state.transporters[raftId].hexId = waterHex.id;
      state.transporters[raftId].cargo = { wood: 1 };
      const waterDropCheck = canDropGoods(state, raftId, 'wood', 1);
      if (waterDropCheck.valid) {
        throw new Error('Goods should NOT be allowed to be dumped into open water/sea!');
      }
      details.push('✓ Dumping cargo into open water blocked as required by tabletop rules');
    }

    return {
      id: 'movement_and_rivers',
      category: 'Movement & Obstacles',
      name: 'Off-Road, Waterways & River Rules Validation',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'movement_and_rivers',
      category: 'Movement & Obstacles',
      name: 'Off-Road Travel & River Obstacle Validation',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 4. Test Road and Bridge Construction with Pooled Resources
 */
export function testRoadAndBridgeConstruction(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];
  const donkey = Object.values(state.transporters).find(t => t.ownerId === player1.id)!;
  state.phase = 'BUILDING';

  try {
    const hexA = donkey.hexId;
    const [cq, cr] = hexA.split(',').map(Number);
    const neighbors = [
      { q: 0, r: 1 }, { q: -1, r: 1 },
      { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 1, r: 0 },
    ];
    let hexB = '';
    for (const nb of neighbors) {
      const tq = cq + nb.q;
      const tr = cr + nb.r;
      const candidateId = `${tq},${tr}`;
      const edgeKey = getEdgeKey(cq, cr, tq, tr);
      const edge = state.edges[edgeKey];
      if (edge && edge.improvement === 'none' && !edge.isRiver) {
        hexB = candidateId;
        break;
      }
    }
    if (!hexB) throw new Error('Could not find unpaved edge for road test');

    // Official rule: Land Roads require strictly 1 Stone (Boards must be REJECTED!)
    state.hexes[hexA].goods.boards = 2;
    state.hexes[hexA].goods.stone = 2;
    donkey.cargo = {}; // Donkey carries nothing

    const illegalBoardRoad = canBuildRoad(state, player1.id, hexA, hexB, 'boards', donkey.id);
    if (illegalBoardRoad.valid) {
      throw new Error('Land Roads MUST reject Boards (Stone only per official rules)!');
    }
    details.push('✓ Verified Land Road strictly rejects Boards');

    const canRoad = canBuildRoad(state, player1.id, hexA, hexB, 'stone', donkey.id);
    if (!canRoad.valid) {
      throw new Error(`canBuildRoad failed with pooled ground stone: ${canRoad.reason}`);
    }
    details.push('✓ canBuildRoad validated with 1 Stone on hex');

    const roadBuilt = executeBuildRoad(state, player1.id, hexA, hexB, 'stone', donkey.id);
    if (!roadBuilt) throw new Error('executeBuildRoad failed to build road');

    const [bq, br] = hexB.split(',').map(Number);
    const builtEdgeKey = getEdgeKey(cq, cr, bq, br);
    if (state.edges[builtEdgeKey]?.improvement !== 'road') {
      throw new Error('Edge improvement was not updated to road');
    }
    if (state.hexes[hexA].goods.stone !== 1) {
      throw new Error(`Ground stone should decrease from 2 to 1, but is ${state.hexes[hexA].goods.stone}`);
    }
    details.push('✓ Road paved successfully using 1 Stone (Boards untouched)');

    // Test Bridge Construction across a river: strictly 2 Boards (Stone must be REJECTED!)
    const riverEdge = Object.values(state.edges).find(e => e.isRiver && e.improvement === 'none');
    if (riverEdge) {
      const bridgeSide = getHexSideLayout(state, riverEdge.hexA).sides.find(s =>
        s.flankingRiverEdgeIds.includes(riverEdge.id)
      )?.side ?? 0;
      donkey.hexId = riverEdge.hexA;
      donkey.side = bridgeSide;
      addGoodOnSide(state, riverEdge.hexA, bridgeSide, 'boards', 2);
      addGoodOnSide(state, riverEdge.hexA, bridgeSide, 'stone', 2);

      const illegalStoneBridge = canBuildRoad(
        state,
        player1.id,
        riverEdge.hexA,
        riverEdge.hexB,
        'stone',
        donkey.id,
        { buildType: 'bridge' }
      );
      if (illegalStoneBridge.valid) {
        throw new Error('River Bridges MUST reject Stone (2 Boards only per official rules)!');
      }
      details.push('✓ Verified River Bridge strictly rejects Stone');

      const canBridge = canBuildRoad(state, player1.id, riverEdge.hexA, riverEdge.hexB, 'boards', donkey.id);
      if (!canBridge.valid || !canBridge.isBridge || canBridge.cost !== 2) {
        throw new Error(`Bridge check failed: ${canBridge.reason}`);
      }
      details.push('✓ River border recognized as Bridge requirement costing 2 Boards');

      const bridgeBuilt = executeBuildRoad(state, player1.id, riverEdge.hexA, riverEdge.hexB, 'boards', donkey.id);
      if (!bridgeBuilt || state.edges[riverEdge.id]?.improvement !== 'bridge') {
        throw new Error('Bridge execution failed');
      }
      details.push('✓ River Bridge paved successfully with 2 Boards');

      // Now verify donkey CAN cross the river over the bridge!
      state.phase = 'MOVEMENT';
      donkey.movesLeft = 2;
      const crossCheck = canMoveTransporter(state, donkey.id, riverEdge.hexB);
      if (!crossCheck.valid) {
        throw new Error(`Donkey should be able to cross bridged river over bridge, but was blocked: ${crossCheck.reason}`);
      }
      details.push('✓ Donkey successfully crossed the river across the new Bridge');
    }

    // Coastal Land <-> Water edges must reject both Land Roads and River Bridges
    const coastalEdge = Object.values(state.edges).find(e => {
      const ha = state.hexes[e.hexA];
      const hb = state.hexes[e.hexB];
      return ha && hb && (ha.terrain === 'water' || hb.terrain === 'water');
    });
    if (coastalEdge) {
      state.phase = 'BUILDING';
      const landSide = state.hexes[coastalEdge.hexA].terrain === 'water' ? coastalEdge.hexB : coastalEdge.hexA;
      donkey.hexId = landSide;
      state.hexes[landSide].goods.stone = 2;
      state.hexes[landSide].goods.boards = 2;
      if (canBuildRoad(state, player1.id, coastalEdge.hexA, coastalEdge.hexB, 'stone', donkey.id).valid) {
        throw new Error('Land Road must NOT be buildable across a coastal edge into open water!');
      }
      if (canBuildRoad(state, player1.id, coastalEdge.hexA, coastalEdge.hexB, 'boards', donkey.id).valid) {
        throw new Error('Bridge must NOT be buildable across a coastal edge into open water!');
      }
      details.push('✓ Verified Land Roads & Bridges strictly reject coastal/open-water borders');
    }

    return {
      id: 'road_bridge_construction',
      category: 'Infrastructure',
      name: 'Roads & Bridges Construction & Crossing',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'road_bridge_construction',
      category: 'Infrastructure',
      name: 'Roads & Bridges Construction & Crossing',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 5. Test Erecting ALL 12 Building Types (Woodcutter, Sawmill, Clay Pit, Quarry, Mine, Burner, Mint, etc.)
 */
export function testAllBuildingTypesConstruction(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];
  const donkey = Object.values(state.transporters).find(t => t.ownerId === player1.id)!;
  state.phase = 'BUILDING';

  const buildingsToTest: BuildingType[] = [
    'woodcutter',
    'sawmill',
    'claypit',
    'quarry',
    'mine',
    'oilrig',
    'brickworks',
    'burner',
    'papermill',
    'mint',
    'stockexchange',
    'wagonfactory',
    'raftfactory',
    'shipyard',
    'truckfactory',
    'steamerfactory',
  ];

  try {
    for (const bType of buildingsToTest) {
      const spec = BUILDING_SPECS[bType];
      // If building requires research technology, ensure player has unlocked it for this build test
      if (spec.requiredTech) {
        if (!player1.unlockedTechs) player1.unlockedTechs = [];
        if (!player1.unlockedTechs.includes(spec.requiredTech)) {
          player1.unlockedTechs.push(spec.requiredTech);
        }
      }

      const needsWaterHex = spec.allowedTerrain?.includes('water');

      // Find a suitable hex for this building
      let candidateHexId = '';
      for (const hex of Object.values(state.hexes)) {
        if (hex.building) continue;
        if (!needsWaterHex && hex.terrain === 'water') continue;
        if (spec.allowedTerrain && !spec.allowedTerrain.includes(hex.terrain as any)) continue;
        if (spec.requiresAdjacentWater) {
          const coord = parseHexKey(hex.id);
          const neighbors = [
            { q: coord.q + 1, r: coord.r },
            { q: coord.q, r: coord.r + 1 },
            { q: coord.q - 1, r: coord.r + 1 },
            { q: coord.q - 1, r: coord.r },
            { q: coord.q, r: coord.r - 1 },
            { q: coord.q + 1, r: coord.r - 1 },
          ];
          const hasWater = neighbors.some(nb => {
            const nbHex = state.hexes[`${nb.q},${nb.r}`];
            return nbHex && nbHex.terrain === 'water';
          });
          if (!hasWater) continue;
        }
        candidateHexId = hex.id;
        break;
      }

      if (!candidateHexId) {
        const fallbackHex = Object.values(state.hexes).find(
          h => !h.building && (needsWaterHex ? true : h.terrain !== 'water')
        )!;
        fallbackHex.terrain = spec.allowedTerrain ? spec.allowedTerrain[0] : 'pasture';
        if (spec.requiresAdjacentWater) {
          const coord = parseHexKey(fallbackHex.id);
          const adjKey = `${coord.q + 1},${coord.r}`;
          if (state.hexes[adjKey]) {
            state.hexes[adjKey].terrain = 'water';
          }
        }
        candidateHexId = fallbackHex.id;
      }

      const targetHex = state.hexes[candidateHexId];
      const buildSide = getBestAccessibleSide(state, candidateHexId);
      donkey.hexId = candidateHexId;
      donkey.side = buildSide;

      // Provide exact required cost goods on hex on the builder's side
      for (const [mat, qty] of Object.entries(spec.cost)) {
        addGoodOnSide(state, candidateHexId, buildSide, mat as GoodType, qty || 0);
      }

      const check = canBuildFactory(state, player1.id, candidateHexId, bType, donkey.id);
      if (!check.valid) {
        throw new Error(`Building check failed for ${spec.name}: ${check.reason}`);
      }

      const built = executeBuildFactory(state, player1.id, candidateHexId, bType, donkey.id);
      if (!built || targetHex.building?.type !== bType) {
        throw new Error(`Failed to erect ${spec.name}`);
      }

      details.push(`✓ Successfully erected ${spec.name} (${bType}) on terrain '${targetHex.terrain}'`);
    }

    // Verify Quarry strictly requires Rock (rejected on Mountain terrain)
    const emptyMountain = Object.values(state.hexes).find(h => h.terrain === 'mountain' && !h.building);
    if (emptyMountain) {
      donkey.hexId = emptyMountain.id;
      emptyMountain.goods.boards = 2;
      if (canBuildFactory(state, player1.id, emptyMountain.id, 'quarry', donkey.id).valid) {
        throw new Error('Quarry must NOT be buildable on Mountain terrain (Rock only)!');
      }
      details.push('✓ Verified Quarry strictly requires Rock terrain (blocked on Mountain)');
    }

    // Verify Raft fleet limit enforcement (max 5 water transporters)
    const coastHex = Object.values(state.hexes).find(h => h.terrain !== 'water');
    if (coastHex) {
      for (let i = 0; i < 5; i++) {
        state.transporters[`t_fleet_raft_${i}`] = {
          id: `t_fleet_raft_${i}`,
          ownerId: player1.id,
          type: 'raft',
          hexId: coastHex.id,
          cargo: {},
          movesLeft: 3,
          maxMoves: 3,
          capacity: 3,
        };
      }
      coastHex.goods.wood = 2;
      donkey.hexId = coastHex.id;
      if (canBuildRaft(state, player1.id, coastHex.id, donkey.id).valid) {
        throw new Error('canBuildRaft must enforce water fleet limit (max 5 water transporters)');
      }
      details.push('✓ Verified Raft building enforces water fleet limit (max 5)');
    }

    return {
      id: 'all_buildings_construction',
      category: 'Industry & Workshops',
      name: 'Constructing All 16 Building Types (3rd Edition Drive Rules)',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'all_buildings_construction',
      category: 'Industry & Workshops',
      name: 'Constructing All 16 Building Types (3rd Edition Drive Rules)',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 6. Test Production Phase Conversions Across Tech Tree
 */
export function testProductionConversions(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];

  try {
    state.round = 1;

    // Set up a Woodcutter on Forest
    const forestHex = Object.values(state.hexes).find(h => h.terrain === 'forest')!;
    forestHex.building = { id: 'b_wc', type: 'woodcutter', ownerId: player1.id, builtRound: 1 };
    forestHex.goods = {};

    // Set up a Sawmill with 3 Wood input (tests maxBatchesPerTurn: 3 -> 6 Boards)
    const millHex = Object.values(state.hexes).find(h => h.id !== forestHex.id && h.terrain !== 'water')!;
    millHex.building = { id: 'b_sm', type: 'sawmill', ownerId: player1.id, builtRound: 1 };
    millHex.goods = { wood: 3 };

    // Set up a StoneFactory / Brickworks with 1 Clay input
    const brickHex = Object.values(state.hexes).find(h => h.id !== forestHex.id && h.id !== millHex.id && h.terrain !== 'water')!;
    brickHex.building = { id: 'b_bw', type: 'brickworks', ownerId: player1.id, builtRound: 1 };
    brickHex.goods = { clay: 1 };

    // Set up a Coal Burner with mixed input: 1 Board + 1 Trunk (tests anyOfGoods flexibility)
    const burnerHex = Object.values(state.hexes).find(
      h => h.id !== forestHex.id && h.id !== millHex.id && h.id !== brickHex.id && h.terrain !== 'water'
    )!;
    burnerHex.building = { id: 'b_cb', type: 'burner', ownerId: player1.id, builtRound: 1 };
    burnerHex.goods = { boards: 1, wood: 1 };

    // Run production
    runProductionPhase(state);

    // Verify Woodcutter output: 1 raw Wood
    if (forestHex.goods.wood !== 1) {
      throw new Error(`Woodcutter should produce 1 wood, found ${forestHex.goods.wood}`);
    }
    details.push('✓ Woodcutter harvested 1 Trunk / Wood');

    // Verify Sawmill converted 3 Wood -> 6 Boards (maxBatchesPerTurn: 3)
    if (millHex.goods.boards !== 6 || (millHex.goods.wood || 0) !== 0) {
      throw new Error(`Sawmill should convert 3 wood into 6 boards (maxBatchesPerTurn=3), found boards: ${millHex.goods.boards}, wood: ${millHex.goods.wood}`);
    }
    details.push('✓ Sawmill processed 3 batches (3 Trunks → 6 Boards in 1 turn)');

    // Verify StoneFactory / Brickworks converted 1 Clay -> 2 Stone
    if (brickHex.goods.stone !== 2 || (brickHex.goods.clay || 0) !== 0) {
      throw new Error(`Stone Factory should convert 1 clay into 2 stone, found stone: ${brickHex.goods.stone}`);
    }
    details.push('✓ Stone Factory fired 1 Clay into 2 Stone');

    // Verify Coal Burner converted mixed 1 Board + 1 Wood -> 1 Fuel
    if (burnerHex.goods.fuel !== 1 || (burnerHex.goods.boards || 0) !== 0 || (burnerHex.goods.wood || 0) !== 0) {
      throw new Error(`Coal Burner failed mixed 1 Board + 1 Wood input conversion`);
    }
    details.push('✓ Coal Burner converted mixed input (1 Board + 1 Trunk → 1 Fuel)');

    // Verify Mine draws strictly 1 ore counter per turn from finite bag (3G + 3I = 6 total)
    const mineHex = Object.values(state.hexes).find(
      h => h.terrain === 'mountain' && h.id !== forestHex.id && h.id !== millHex.id && h.id !== brickHex.id && h.id !== burnerHex.id
    )!;
    mineHex.building = {
      id: 'b_mine_test',
      type: 'mine',
      ownerId: player1.id,
      builtRound: 1,
      minePool: { gold: 3, iron: 3 },
    };
    mineHex.goods = {};
    for (let turn = 0; turn < 7; turn++) {
      runProductionPhase(state);
    }
    const producedGold = mineHex.goods.gold || 0;
    const producedIron = mineHex.goods.iron || 0;
    if (producedGold !== 3 || producedIron !== 3) {
      throw new Error(`Finite mine pool should yield exactly 3 Gold & 3 Iron over 7 turns, got ${producedGold}G / ${producedIron}I`);
    }
    details.push('✓ Mine draws 1 ore/turn from finite 3G+3I bag and depletes cleanly');

    // Verify Specialisation & Enlargement cannot overwrite each other on the same mine, and New Shafts refills depleted mines
    state.phase = 'PRODUCTION';
    player1.unlockedTechs = [];
    const home = state.hexes[player1.homeHexId];
    home.goods.goose = 6;
    home.goods.paper = 3;
    const upgradedMineHex = Object.values(state.hexes).find(h => h.terrain === 'mountain' && h.id !== mineHex.id)!;
    upgradedMineHex.building = {
      id: 'b_mine_excl',
      type: 'mine',
      ownerId: player1.id,
      builtRound: 1,
      minePool: { gold: 3, iron: 3 },
    };
    executeResearchTech(state, player1.id, player1.homeHexId, 'specialized_mines');
    executeResearchTech(state, player1.id, player1.homeHexId, 'large_mines');
    if (upgradedMineHex.building.mineVariant !== 'specialized' || upgradedMineHex.building.minePool?.iron !== 0) {
      throw new Error('Enlargement must not overwrite an already-Specialised mine!');
    }
    executeResearchTech(state, player1.id, player1.homeHexId, 'extra_shafts');
    if (!canReplenishMine(state, player1.id, mineHex.id).valid || !executeReplenishMine(state, player1.id, mineHex.id)) {
      // already replenished automatically by researching extra_shafts when depleted!
      if ((mineHex.building.minePool?.gold || 0) !== 3 || (mineHex.building.minePool?.iron || 0) !== 3) {
        throw new Error('extra_shafts failed to refill depleted mine');
      }
    }
    mineHex.building.minePool = { gold: 0, iron: 0 };
    if (!canReplenishMine(state, player1.id, mineHex.id).valid || !executeReplenishMine(state, player1.id, mineHex.id)) {
      throw new Error('Manual executeReplenishMine failed on depleted mine');
    }
    details.push('✓ Verified mine Specialisation vs Enlargement exclusion & New Shafts replenishment');

    return {
      id: 'production_conversions',
      category: 'Economy & Refinement',
      name: 'Production Phase Resource Conversions',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'production_conversions',
      category: 'Economy & Refinement',
      name: 'Production Phase Resource Conversions',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 7. Test Authentic Natural Donkey Breeding on Pasture
 */
export function testDonkeyBreeding(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];

  try {
    // Find an empty pasture hex
    const pastureHex = Object.values(state.hexes).find(h => h.terrain === 'pasture' && !h.building)!;
    pastureHex.goods = {}; // No goods on ground

    // Place exactly 2 donkeys of player 1 with empty cargo on this pasture
    const donkeys = Object.values(state.transporters).filter(t => t.ownerId === player1.id).slice(0, 2);
    donkeys.forEach(d => {
      d.hexId = pastureHex.id;
      d.cargo = {};
    });

    // Move 3rd donkey away
    const otherDonkey = Object.values(state.transporters).find(t => t.ownerId === player1.id && !donkeys.includes(t))!;
    otherDonkey.hexId = '99,99';

    // Count donkeys on pasture before production
    const beforeCount = Object.values(state.transporters).filter(t => t.hexId === pastureHex.id).length;
    if (beforeCount !== 2) throw new Error('Setup failed: expected 2 donkeys on pasture');

    runProductionPhase(state);

    // Count donkeys on pasture after production
    const afterCount = Object.values(state.transporters).filter(t => t.hexId === pastureHex.id).length;
    if (afterCount !== 3) {
      throw new Error(`Natural breeding failed! Expected 3 donkeys, found ${afterCount}`);
    }
    details.push('✓ Two donkeys alone on pasture bred 1 new Donkey naturally (Privacy Rule satisfied)');

    // Now test negative privacy case: 2 donkeys carrying goods should NOT breed
    pastureHex.goods = { wood: 1 }; // Polluted pasture ground
    runProductionPhase(state);
    const afterPollutedCount = Object.values(state.transporters).filter(t => t.hexId === pastureHex.id).length;
    if (afterPollutedCount !== 3) {
      throw new Error('Donkeys should NOT breed when goods are lying on pasture!');
    }
    details.push('✓ Privacy rule enforced: No breeding when ground has loose goods');

    return {
      id: 'donkey_breeding',
      category: 'Demographics & Breeding',
      name: 'Natural Donkey Breeding on Pasture (Privacy Rule)',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'donkey_breeding',
      category: 'Demographics & Breeding',
      name: 'Natural Donkey Breeding on Pasture',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 8. Test Wonder Contributions & Endgame Scoring
 */
export function testWonderAndScoring(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];
  const donkey = Object.values(state.transporters).find(t => t.ownerId === player1.id)!;

  try {
    state.phase = 'WONDER';

    // Verify off-home transporter cannot anchor Wonder contributions
    const offHomeHex = Object.values(state.hexes).find(h => h.id !== player1.homeHexId)!;
    donkey.hexId = offHomeHex.id;
    donkey.cargo = { wood: 2 };
    const offHomeCheck = canBuildWonder(state, player1.id, donkey.id, 1);
    if (offHomeCheck.valid) {
      throw new Error('Expected Wonder contribution anchored to off-home transporter to be blocked');
    }
    details.push('✓ Off-home-tile Wonder contribution properly blocked');

    // Move donkey carrying goods to home tile & test escalating cost:
    // 1st brick costs 1 good, 2nd brick in same round costs 2 goods (total 3 goods for 2 bricks).
    donkey.hexId = player1.homeHexId;
    state.hexes[player1.homeHexId].goods = { stone: 1, boards: 1 }; // ground has 2 goods + donkey carries 2 wood = 4 goods total

    const tooFewCheck = canBuildWonder(state, player1.id, donkey.id, 3);
    if (tooFewCheck.valid) {
      throw new Error('Buying 3 Wonder bricks in 1 round costs 1+2+3=6 goods; should fail with only 4 home goods');
    }
    details.push('✓ Escalating Wonder cost (1+2+3=6 goods for 3 bricks in same round) enforced');

    const check = canBuildWonder(state, player1.id, donkey.id, 2);
    if (!check.valid || check.goodsCost !== 3) {
      throw new Error(`Wonder check failed (expected goodsCost=3): ${check.reason}`);
    }
    details.push('✓ canBuildWonder validated using any goods at home hex (2 bricks = 3 goods)');

    const scoreBefore = player1.score;
    const contributed = executeBuildWonder(state, player1.id, donkey.id, 2);
    if (!contributed) throw new Error('executeBuildWonder failed');

    calculateScores(state);
    // All 2 non-neutral bricks in Row 1 (capacity 4, 10 VP total) => 10 VP for player 1!
    if (player1.score !== scoreBefore + 10) {
      throw new Error(`Expected +10 VP for owning all bricks in Row 1 (10 VP/row), got delta ${player1.score - scoreBefore}`);
    }
    details.push(`✓ Contributed 2 Wonder Bricks (10 VP Row 1 proportional score verified: ${scoreBefore} → ${player1.score} VP)`);

    // Verify neutral brick added when advancing from WONDER phase with no contributions in that round
    advancePhase(state); // -> Round 2 PRODUCTION
    state.phase = 'WONDER';
    const bricksBeforeQuietRound = state.wonder.reduce((s, t) => s + t.bricks.length, 0);
    advancePhase(state); // Round 2 WONDER -> Round 3 PRODUCTION with 0 bricks placed in Round 2
    const bricksAfterQuietRound = state.wonder.reduce((s, t) => s + t.bricks.length, 0);
    if (bricksAfterQuietRound !== bricksBeforeQuietRound + 1 || state.neutralBricksUsed !== 1) {
      throw new Error(`Expected 1 NEUTRAL brick on quiet Wonder round, got count delta=${bricksAfterQuietRound - bricksBeforeQuietRound}, neutral=${state.neutralBricksUsed}`);
    }
    details.push('✓ Neutral Wonder brick placed automatically when no player builds in a round');

    return {
      id: 'wonder_and_scoring',
      category: 'Monument & Scoring',
      name: 'Wonder Contributions, Escalating Costs & Row Scoring',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'wonder_and_scoring',
      category: 'Monument & Scoring',
      name: 'Wonder Contributions & Victory Point Scoring',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 9. Test Revert Move Memory (Undo & Redo)
 */
export function testUndoRedoMemory(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();
  const player1 = state.players[0];
  const donkey = Object.values(state.transporters).find(t => t.ownerId === player1.id)!;

  try {
    state.phase = 'MOVEMENT';
    const originalBoards = state.hexes[player1.homeHexId].goods.boards || 0;

    // Action 1: Pickup
    executePickupGoods(state, donkey.id, 'boards', 1);
    if (donkey.cargo.boards !== 1) throw new Error('Pickup failed');
    details.push('✓ Action executed: Picked up 1 board');

    // Undo action
    const undone = undoMove(state);
    if (!undone) throw new Error('undoMove returned false');
    const restoredDonkey = state.transporters[donkey.id];
    const restoredHex = state.hexes[player1.homeHexId];

    if ((restoredDonkey.cargo.boards || 0) !== 0 || restoredHex.goods.boards !== originalBoards) {
      throw new Error('Undo did not restore original cargo and ground goods');
    }
    details.push('✓ Undo successfully rolled back board state');

    // Redo action
    const redone = redoMove(state);
    if (!redone) throw new Error('redoMove returned false');
    const redoneDonkey = state.transporters[donkey.id];
    if (redoneDonkey.cargo.boards !== 1) {
      throw new Error('Redo did not re-apply the move');
    }
    details.push('✓ Redo successfully re-applied the move');

    return {
      id: 'undo_redo_memory',
      category: 'Time Travel & Revert',
      name: 'Move Choice Memory & Multi-Step Undo / Redo',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'undo_redo_memory',
      category: 'Time Travel & Revert',
      name: 'Move Choice Memory & Multi-Step Undo / Redo',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 10. Test Geese & Technology Upgrades (Starting Stock, Living Cargo, Pasture Breeding, and Tech Research)
 */
export function testGooseBreedingAndTechUpgrades(): TestResult {
  const start = performance.now();
  const details: string[] = [];
  const state = createTestGame();

  try {
    const player1 = state.players[0];
    const homeHex = state.hexes[player1.homeHexId];
    if (!homeHex) throw new Error('Home hex not found');

    // 1. Verify starting 2 Geese
    if (homeHex.goods.goose !== 2) {
      throw new Error(`Expected 2 starting geese on home hex, found ${homeHex.goods.goose}`);
    }
    details.push('✓ Verified 2 starting Geese on player home camp');

    // 2. Verify living cargo handling: Donkeys can transport living geese in Movement Phase
    state.phase = 'MOVEMENT';
    const donkey = Object.values(state.transporters).find(
      t => t.ownerId === player1.id && t.type === 'donkey'
    );
    if (!donkey) throw new Error('Donkey not found');

    const pickupSuccess = executePickupGoods(state, donkey.id, 'goose', 1);
    if (!pickupSuccess) throw new Error('Failed to load living goose into donkey cargo');
    if ((donkey.cargo.goose as number) !== 1 || (homeHex.goods.goose as number) !== 1) {
      throw new Error('Donkey cargo does not reflect 1 goose loaded');
    }
    details.push('✓ Living goose loaded onto donkey cargo and ground goods updated');

    // Drop goose back to home hex
    const dropSuccess = executeDropGoods(state, donkey.id, 'goose', 1);
    if (!dropSuccess || (homeHex.goods.goose as number) !== 2) {
      throw new Error('Failed to unload goose back to home hex');
    }
    details.push('✓ Living goose unloaded back to pasture grounds');

    // Research must be rejected outside PRODUCTION phase (e.g. MOVEMENT and BUILDING)
    homeHex.goods.paper = 1;
    if (canResearchTech(state, player1.id, player1.homeHexId, 'truck_factory').valid) {
      throw new Error('Research should be rejected during MOVEMENT phase (PRODUCTION phase only)!');
    }
    state.phase = 'BUILDING';
    if (canResearchTech(state, player1.id, player1.homeHexId, 'truck_factory').valid) {
      throw new Error('Research should be rejected during BUILDING phase (PRODUCTION phase only)!');
    }
    delete homeHex.goods.paper;

    // 3. Verify Goose Reproduction on empty Pasture (ONLY exactly 2 geese alone reproduce +1 goose)
    const pastureHex = Object.values(state.hexes).find(
      h => h.terrain === 'pasture' && !h.building && h.id !== player1.homeHexId
    );
    if (!pastureHex) throw new Error('Pasture hex for goose breeding test not found');
    pastureHex.goods = { goose: 2 };
    pastureHex.goodsBySide = undefined;

    runProductionPhase(state);
    if (pastureHex.goods.goose !== 3) {
      throw new Error(`Expected 3 geese after breeding on pasture, found ${pastureHex.goods.goose}`);
    }

    // Running production again with 3 geese on the tile must NOT breed a 4th goose
    runProductionPhase(state);
    if (pastureHex.goods.goose !== 3) {
      throw new Error(`Expected 3 geese NOT to reproduce again (must stay 3), found ${pastureHex.goods.goose}`);
    }

    // 1 goose alone must NOT breed
    pastureHex.goods = { goose: 1 };
    pastureHex.goodsBySide = undefined;
    runProductionPhase(state);
    if (pastureHex.goods.goose !== 1) {
      throw new Error(`Expected 1 goose NOT to reproduce (must stay 1), found ${pastureHex.goods.goose}`);
    }

    // 4 geese must NOT breed
    pastureHex.goods = { goose: 4 };
    pastureHex.goodsBySide = undefined;
    runProductionPhase(state);
    if (pastureHex.goods.goose !== 4) {
      throw new Error(`Expected 4 geese NOT to reproduce (must stay 4), found ${pastureHex.goods.goose}`);
    }

    pastureHex.goods = {};
    pastureHex.goodsBySide = undefined;
    details.push('✓ Goose natural reproduction on pasture verified (only exactly 2 geese breed +1; 1, 3, and 4 do not)');

    // 4. Verify Authentic Technology Research during PRODUCTION Phase (Requires 2 Geese + 1 Paper)
    state.phase = 'BUILDING';

    // Home hex has 2 geese. Initial donkey capacity is 2.
    if (donkey.capacity !== 2) {
      throw new Error(`Expected initial donkey capacity 2, got ${donkey.capacity}`);
    }

    // A. Verify that building a Truck Factory before researching truck_factory is blocked
    homeHex.goods.boards = 2;
    homeHex.goods.stone = 2;
    const preResearchBuildCheck = canBuildFactory(state, player1.id, player1.homeHexId, 'truckfactory', donkey.id);
    if (preResearchBuildCheck.valid) {
      throw new Error('canBuildFactory should reject truckfactory before truck_factory is researched');
    }
    details.push('✓ Verified factory research prerequisite (Truck Factory blocked before research)');

    // Switch to PRODUCTION Phase for research & selective factory/mine upgrade tests
    state.phase = 'PRODUCTION';

    // B. Attempt research with 2 Geese but NO Paper (must fail)
    const checkResearchNoPaper = canResearchTech(state, player1.id, player1.homeHexId, 'truck_factory');
    if (checkResearchNoPaper.valid) {
      throw new Error('canResearchTech should reject research when paper is missing');
    }
    if (getEligibleResearchSites(state, player1.id).length !== 0) {
      throw new Error('getEligibleResearchSites must return empty when paper is missing');
    }
    details.push('✓ Missing paper rule verified: Research requires both 2 Geese AND 1 Paper');

    // C. Verify unattended 2 Geese + 1 Paper cannot research AND are removed during Production,
    //    while attended 2 Geese + 1 Paper survive Production and allow research!
    const unattendedHex = Object.values(state.hexes).find(
      h =>
        h.terrain !== 'water' &&
        !h.building &&
        h.id !== player1.homeHexId &&
        !Object.values(state.transporters).some(t => t.hexId === h.id)
    );
    if (!unattendedHex) {
      throw new Error('Could not find an empty unattended land hex for research test');
    }
    unattendedHex.goods = { goose: 2, paper: 1 };
    unattendedHex.goodsBySide = undefined;

    const checkUnattendedResearch = canResearchTech(state, player1.id, unattendedHex.id, 'truck_factory');
    if (checkUnattendedResearch.valid) {
      throw new Error('canResearchTech must reject research when no transporter is on the tile');
    }
    if (getEligibleResearchSites(state, player1.id).some(s => s.hexId === unattendedHex.id)) {
      throw new Error('getEligibleResearchSites must exclude tiles with no attending transporter');
    }

    // Provide 1 Paper on the attended homeHex (donkey is on homeHex) and run Production
    homeHex.goods.paper = 1;
    homeHex.goodsBySide = undefined;
    runProductionPhase(state);

    if ((unattendedHex.goods.goose || 0) !== 0 || (unattendedHex.goods.paper || 0) !== 0) {
      throw new Error(
        `Unattended 2 Geese + 1 Paper must be removed during Production, found ${unattendedHex.goods.goose || 0}G / ${unattendedHex.goods.paper || 0}P`
      );
    }
    if ((homeHex.goods.goose || 0) < 2 || (homeHex.goods.paper || 0) < 1) {
      throw new Error(
        `Attended 2 Geese + 1 Paper must survive Production when a transporter is present, found ${homeHex.goods.goose || 0}G / ${homeHex.goods.paper || 0}P`
      );
    }
    details.push('✓ Verified transporter requirement: unattended Geese & Paper are removed in Production while attended sets survive');

    // Place 2 Wagon Factories on map to test selective legal upgrades
    const wagonHexes = Object.values(state.hexes)
      .filter(h => h.terrain !== 'water' && !h.building && h.id !== player1.homeHexId && h.id !== unattendedHex.id)
      .slice(0, 2);
    wagonHexes.forEach((h, i) => {
      h.building = { id: `b_wf_test_${i}`, type: 'wagonfactory', ownerId: player1.id, builtRound: 1 };
    });

    const eligibleSites = getEligibleResearchSites(state, player1.id);
    if (!eligibleSites.some(s => s.hexId === player1.homeHexId)) {
      throw new Error('Expected attended home hex to be detected by getEligibleResearchSites');
    }
    const legalTruckUpgrades = getLegalResearchUpgrades(state, player1.id, 'truck_factory');
    if (legalTruckUpgrades.length !== 2) {
      throw new Error(`Expected 2 legal Wagon Factory -> Truck Factory upgrades, found ${legalTruckUpgrades.length}`);
    }

    const checkResearch = canResearchTech(state, player1.id, player1.homeHexId, 'truck_factory');
    if (!checkResearch.valid) {
      throw new Error(`canResearchTech rejected valid truck_factory: ${checkResearch.reason}`);
    }

    // Choose to upgrade ONLY the first Wagon Factory (leaving the second untouched)
    const researched = executeResearchTech(state, player1.id, player1.homeHexId, 'truck_factory', undefined, [
      { hexId: wagonHexes[0].id },
    ]);
    if (!researched) {
      throw new Error('executeResearchTech returned false for truck_factory');
    }
    if (wagonHexes[0].building?.type !== 'truckfactory' || wagonHexes[1].building?.type !== 'wagonfactory') {
      throw new Error('Selective factory upgrade failed: expected 1st Wagon Factory upgraded and 2nd kept');
    }

    if (!player1.unlockedTechs?.includes('truck_factory')) {
      throw new Error('Player unlockedTechs does not contain truck_factory');
    }
    details.push('✓ Researched "Steam Truck Factory" during Production Phase & selectively upgraded 1 of 2 Wagon Factories');

    // Check geese consumed
    if (((homeHex.goods.goose as number | undefined) || 0) !== 0) {
      throw new Error(`Expected 2 geese consumed (0 remaining), found ${homeHex.goods.goose}`);
    }
    // Check paper consumed
    if (((homeHex.goods.paper as number | undefined) || 0) !== 0) {
      throw new Error(`Expected 1 paper consumed (0 remaining), found ${homeHex.goods.paper}`);
    }
    details.push('✓ Exactly 2 Geese + 1 Paper consumed for technological discovery');

    // Also test specialized_mines choosing 4 Iron on a mine
    const ironMineHex = Object.values(state.hexes).find(h => h.terrain === 'mountain' && !h.building);
    if (ironMineHex) {
      ironMineHex.building = {
        id: 'b_mine_iron_choice',
        type: 'mine',
        ownerId: player1.id,
        builtRound: 1,
        minePool: { gold: 3, iron: 3 },
      };
      homeHex.goods.goose = 2;
      homeHex.goods.paper = 1;
      const specOk = executeResearchTech(state, player1.id, player1.homeHexId, 'specialized_mines', undefined, [
        { hexId: ironMineHex.id, mineSpecialization: 'iron' },
      ]);
      if (!specOk || ironMineHex.building.minePool?.iron !== 4 || ironMineHex.building.minePool?.gold !== 0) {
        throw new Error('Expected specialized_mines iron selection to set minePool to 4 Iron / 0 Gold');
      }
      details.push('✓ Verified Production Phase Specialized Mines dialog choice (4 Iron / 0 Gold)');
    }

    // D. Verify Donkey capacity remains STRICTLY 2 (authentic Splotter tabletop rule)
    const donkeyAfterResearch = state.transporters[donkey.id];
    if (donkeyAfterResearch.capacity !== 2) {
      throw new Error(`Donkey capacity must remain permanently 2, found ${donkeyAfterResearch.capacity}`);
    }
    details.push('✓ Tabletop rule verified: Donkey capacity is permanently fixed at 2 (no upgrades)');

    // E. Verify Truck Factory can now be built in BUILDING Phase after research!
    state.phase = 'BUILDING';
    const postResearchBuildCheck = canBuildFactory(state, player1.id, player1.homeHexId, 'truckfactory', donkey.id);
    if (!postResearchBuildCheck.valid) {
      throw new Error(`Truck Factory should now be buildable after research: ${postResearchBuildCheck.reason}`);
    }
    details.push('✓ Technological breakthrough verified: Steam Truck Factory now unlocked for construction');

    // Researching already-unlocked tech should fail
    state.phase = 'PRODUCTION';
    const duplicateCheck = canResearchTech(state, player1.id, player1.homeHexId, 'truck_factory');
    if (duplicateCheck.valid) {
      throw new Error('canResearchTech should reject already-unlocked tech');
    }
    details.push('✓ Duplicate tech research prevented');

    // Researching without geese/paper should fail
    const noResourcesCheck = canResearchTech(state, player1.id, player1.homeHexId, 'steamer_factory');
    if (noResourcesCheck.valid) {
      throw new Error('canResearchTech should reject when no geese/paper are present');
    }
    details.push('✓ Insufficient resources rule enforcement verified');

    return {
      id: 'goose_tech_upgrades',
      category: 'Research & Breeding',
      name: 'Geese Starting Stock, Reproduction & Research Tech Upgrades',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'goose_tech_upgrades',
      category: 'Research & Breeding',
      name: 'Geese Starting Stock, Reproduction & Research Tech Upgrades',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 11. Test Official Solitaire Scenarios (No Bots, 1 Human Player, Accurate Map & Goals)
 */
export function testSolitaireScenarioRules(): TestResult {
  const start = performance.now();
  const details: string[] = [];

  try {
    // 1. Create a game with Small World S42 scenario
    const s42Game = createInitialGame('Small World S42 Match', 'scenario_small_world_s42', [
      { name: 'Solo Strategist', isAI: false },
    ], {
      isSolitaire: true,
      scenarioId: 'small_world_s42',
      maxRounds: 20,
    });

    // Enforce strictly 1 human player
    if (s42Game.players.length !== 1) {
      throw new Error(`Solitaire mode must have strictly 1 player, got ${s42Game.players.length}`);
    }
    if (s42Game.players[0].isAI) {
      throw new Error('Solitaire player must be human, not AI');
    }
    details.push('Verified Solitaire game has strictly 1 human player and 0 bots');

    if (!s42Game.isSolitaire) {
      throw new Error('Expected isSolitaire flag to be true');
    }
    if (s42Game.maxRounds !== 20) {
      throw new Error(`Expected maxRounds to be 20 for Small World S42, got ${s42Game.maxRounds}`);
    }
    details.push('Verified scenario turn limit (20 rounds) and isSolitaire flag');

    // Verify official starting stock on home camp
    const homeHex = s42Game.hexes[s42Game.players[0].homeHexId];
    if (!homeHex) {
      throw new Error('Home hex not found in map');
    }
    if ((homeHex.goods.boards || 0) < 5) {
      throw new Error(`Expected 5 starting boards, found ${homeHex.goods.boards}`);
    }
    if ((homeHex.goods.stone || 0) < 1) {
      throw new Error(`Expected at least 1 starting stone, found ${homeHex.goods.stone}`);
    }
    if ((homeHex.goods.goose || 0) < 2) {
      throw new Error(`Expected at least 2 starting geese, found ${homeHex.goods.goose}`);
    }
    if ((s42Game.wonder[0]?.bricks.length || 0) !== 16) {
      throw new Error(`Expected 16 pre-built NEUTRAL Wonder bricks in solo setup, found ${s42Game.wonder[0]?.bricks.length}`);
    }
    details.push('Verified starting stock (5 Boards, 1 Stone, 2 Geese) & 16 pre-built Neutral Wonder bricks for Solitaire');

    // Verify donkeys
    const playerDonkeys = Object.values(s42Game.transporters).filter(
      t => t.ownerId === s42Game.players[0].id && t.type === 'donkey'
    );
    if (playerDonkeys.length !== 3) {
      throw new Error(`Expected 3 starting donkeys, found ${playerDonkeys.length}`);
    }
    details.push('Verified starting 3 donkeys under player ownership');

    // Verify home hex is a valid land tile
    if (homeHex.terrain === 'water') {
      throw new Error(`Expected land home hex, found ${homeHex.terrain}`);
    }
    details.push(`Verified home (starting) tile at ${homeHex.id} (${homeHex.terrain})`);

    // Verify all official Solitaire scenarios load cleanly at Round 1 with exact map setup
    for (const sc of SOLITAIRE_SCENARIOS) {
      const scGame = createInitialGame(sc.name, sc.mapPresetId, [
        { name: 'Solo Sovereign', isAI: false },
        { name: 'Disallowed Bot', isAI: true },
      ], {
        isSolitaire: true,
        scenarioId: sc.id,
        maxRounds: sc.maxRounds,
      });

      if (scGame.round !== 1) {
        throw new Error(`Scenario ${sc.id} did not start at round 1 (got ${scGame.round})`);
      }
      if (scGame.players.length !== 1 || scGame.players[0].isAI) {
        throw new Error(`Scenario ${sc.id} failed strictly-1-human-player check`);
      }
      const scHome = scGame.hexes[scGame.players[0].homeHexId];
      if (!scHome || scHome.terrain === 'water') {
        throw new Error(`Scenario ${sc.id} missing valid land home hex ${scGame.players[0].homeHexId}`);
      }
    }
    // Verify scenario_* map strictly enforces 1 human player even without explicit isSolitaire flag
    const mapOnlySolo = createInitialGame(
      'Mesopotamia Direct Launch',
      'scenario_mesopotamia',
      [
        { name: 'Solo Sovereign', isAI: false },
        { name: 'Disallowed Rival', isAI: false },
        { name: 'Disallowed Bot', isAI: true },
      ]
    );
    if (!mapOnlySolo.isSolitaire || mapOnlySolo.players.length !== 1 || mapOnlySolo.players[0].isAI) {
      throw new Error('scenario_* map failed to strictly enforce 1 human player only');
    }

    // Verify reconnecting to an active solo game attaches to the existing sole player without adding players or resetting progress
    mapOnlySolo.round = 4;
    const solePlayerBefore = mapOnlySolo.players[0];
    const reconnected = reconnectSoloPlayer(mapOnlySolo);
    if (
      !reconnected ||
      reconnected.id !== solePlayerBefore.id ||
      mapOnlySolo.players.length !== 1 ||
      mapOnlySolo.round !== 4
    ) {
      throw new Error('reconnectSoloPlayer failed to preserve sole player and game progress');
    }

    // Verify a single-player-so-far multiplayer lobby room remains non-solitaire so others can join
    const openMultiplayer = createInitialGame('Open Valley Room', 'river_valley', [
      { name: 'Host', isAI: false },
    ]);
    if (openMultiplayer.isSolitaire) {
      throw new Error('Multiplayer map with 1 initial player should remain joinable (isSolitaire=false)');
    }

    details.push(`Verified all ${SOLITAIRE_SCENARIOS.length} pre-made solo scenarios & reconnectSoloPlayer strictly enforce 1 human player`);

    // Verify all 4 Scenario Map Sets and all 33 non-duplicate scenarios have valid maps, author/publisher attributions, and unique names
    if (SCENARIO_MAP_SETS.length !== 4) {
      throw new Error(`Expected 4 Scenario Map Sets, found ${SCENARIO_MAP_SETS.length}`);
    }
    const seenNames = new Set<string>();
    for (const sc of ALL_SCENARIOS) {
      const normalized = sc.name.trim().toLowerCase();
      if (seenNames.has(normalized)) {
        throw new Error(`Duplicate scenario name detected in ALL_SCENARIOS: ${sc.name}`);
      }
      seenNames.add(normalized);
      if (!sc.author || !sc.publisher || !sc.sourceFile) {
        throw new Error(`Scenario ${sc.id} missing author/publisher/sourceFile attribution`);
      }
      const preset = MAP_PRESETS[sc.mapPresetId];
      if (!preset) {
        throw new Error(`Scenario ${sc.id} references missing mapPresetId ${sc.mapPresetId}`);
      }
      if (!preset.author || !preset.publisher) {
        throw new Error(`MapPreset ${preset.id} missing author/publisher attribution`);
      }
    }
    for (const preset of Object.values(MAP_PRESETS)) {
      const hexCoordMap = new Map<string, { q: number; r: number; terrain: string }>();
      for (const h of preset.hexes) {
        const key = `${h.q},${h.r}`;
        if (hexCoordMap.has(key)) {
          throw new Error(`MapPreset ${preset.id} has duplicate hex coordinate ${key}`);
        }
        hexCoordMap.set(key, h);
      }
      for (const home of preset.playerHomeHexes) {
        const homeKey = `${home.q},${home.r}`;
        const homeTile = hexCoordMap.get(homeKey);
        if (!homeTile || homeTile.terrain === 'water') {
          throw new Error(`MapPreset ${preset.id} has invalid/water home hex ${homeKey}`);
        }
      }
      for (const e of [...(preset.riverEdges || []), ...(preset.initialRoads || []), ...(preset.railroads || [])]) {
        const a = hexCoordMap.get(`${e.q1},${e.r1}`);
        const b = hexCoordMap.get(`${e.q2},${e.r2}`);
        if (!a || !b || !areHexNeighbors(a, b)) {
          throw new Error(`MapPreset ${preset.id} has non-neighbor or missing edge (${e.q1},${e.r1})-(${e.q2},${e.r2})`);
        }
      }
    }
    if (DEDUPLICATED_DRIVE_SCENARIO_NAMES.length < 7) {
      throw new Error('Expected deduplicated Drive scenario manifest to record ignored duplicate maps');
    }

    // Verify a Splotter Scenario Book multiplayer map (e.g. The Pacific) launches cleanly with 2 players when isSolitaire=false
    const pacificMatch = createInitialGame(
      'The Pacific Duel',
      'splotter_the_pacific',
      [
        { name: 'Admiral 1', isAI: false },
        { name: 'Stock Bot', isAI: true, aiProfileId: 'stock_beginner' },
      ],
      {
        isSolitaire: false,
        scenarioId: 'splotter_the_pacific',
        maxRounds: 20,
      }
    );
    if (pacificMatch.isSolitaire || pacificMatch.players.length !== 2) {
      throw new Error('Expected Splotter Scenario Book 2P map to preserve 2 players when isSolitaire=false');
    }

    details.push(
      `Verified ${SCENARIO_MAP_SETS.length} Scenario Map Sets (${ALL_SCENARIOS.length} non-duplicate maps) with full author & Splotter Spellen publisher attributions`
    );

    return {
      id: 'solitaire_scenarios',
      category: 'Pre-Made Scenarios',
      name: 'Pre-Made Scenarios & Splotter Map Sets (33 Non-Duplicate Maps & Attributions)',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'solitaire_scenarios',
      category: 'Pre-Made Scenarios',
      name: 'Pre-Made Scenarios & Splotter Map Sets (33 Non-Duplicate Maps & Attributions)',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 12. Test Game Resignation & Match-Starter Deletion Rules
 */
export function testResignAndDeletePermissions(): TestResult {
  const start = performance.now();
  const details: string[] = [];

  try {
    // A. Solo game resign -> must remove match immediately
    const soloGame = createInitialGame(
      'Solo Resign Match',
      'scenario_small_world_s42',
      [{ name: 'Solo Starter', isAI: false }],
      { isSolitaire: true, scenarioId: 'small_world_s42', creatorClientId: 'client_solo_1' }
    );
    if (!isOnlyActivePlayerRemaining(soloGame, soloGame.players[0].id)) {
      throw new Error('Expected solo player to be recognized as only remaining active player');
    }
    const soloResign = resignPlayer(soloGame, soloGame.players[0].id);
    if (!soloResign.resigned || !soloResign.shouldRemoveMatch) {
      throw new Error('Solo player resigning must mark match for removal');
    }
    details.push('✓ Solo game resign flags match for removal');

    // B. 1 Human + 1 AI game -> human resigns -> removes match (no human left)
    const vsAiGame = createInitialGame(
      'Human vs AI',
      'river_valley',
      [
        { name: 'Human Host', isAI: false, clientId: 'client_host' },
        { name: 'Bot Opponent', isAI: true },
      ],
      { creatorClientId: 'client_host' }
    );
    const aiResign = resignPlayer(vsAiGame, vsAiGame.players[0].id);
    if (!aiResign.resigned || !aiResign.shouldRemoveMatch) {
      throw new Error('Sole human resigning against AI should flag match for removal');
    }
    details.push('✓ Resigning when only AI bots remain flags match for removal');

    // C. 2 Human multiplayer game -> first resign keeps match alive; second resign removes match
    const multiGame = createInitialGame(
      'Two Humans Match',
      'river_valley',
      [
        { name: 'Alice Starter', isAI: false, clientId: 'client_alice' },
        { name: 'Bob Challenger', isAI: false, clientId: 'client_bob' },
      ],
      { creatorClientId: 'client_alice' }
    );
    const alice = multiGame.players[0];
    const bob = multiGame.players[1];

    // Starter check: Alice can delete, Bob cannot, John Burt can delete any game even as non-player
    if (!isPlayerMatchStarter(multiGame, alice.id, 'client_alice')) {
      throw new Error('Starter player/client should be authorized to delete match');
    }
    if (isPlayerMatchStarter(multiGame, bob.id, 'client_bob')) {
      throw new Error('Non-starter player/client must NOT be authorized to delete match');
    }
    if (!canDeleteMatch(multiGame, { playerName: 'John Burt', clientId: 'unrelated_client' })) {
      throw new Error('Elevated player "John Burt" must be able to delete any match');
    }
    if (canDeleteMatch(multiGame, { playerName: 'Random Guest', clientId: 'unrelated_client' })) {
      throw new Error('Unrelated regular player must NOT be able to delete match');
    }
    details.push('✓ Match delete permission restricted to starter & elevated player "John Burt"');

    const aliceResign = resignPlayer(multiGame, alice.id);
    if (!aliceResign.resigned || aliceResign.shouldRemoveMatch) {
      throw new Error('First human resigning with active opponent must NOT remove match');
    }
    if (!alice.resigned || multiGame.activePlayerId !== bob.id) {
      throw new Error('Resigned player flag or activePlayerId handoff failed');
    }
    if (!isOnlyActivePlayerRemaining(multiGame, bob.id)) {
      throw new Error('Bob should now be recognized as only remaining active player');
    }
    details.push('✓ First player resigning keeps match active and hands turn focus to Bob');

    // Resigned player attempting to rejoin by clientId or name must match existing entry (never duplicate)
    const rejoinByClient = findExistingPlayer(multiGame, { clientId: 'client_alice', playerName: 'Different Alias' });
    const rejoinByName = findExistingPlayer(multiGame, { clientId: 'new_browser_id', playerName: ' alice starter ' });
    if (!rejoinByClient || rejoinByClient.id !== alice.id || !rejoinByName || rejoinByName.id !== alice.id) {
      throw new Error('Resigned player rejoin lookup must match existing single player entry');
    }
    details.push('✓ Rejoining a game after resigning resolves to existing single player record (no duplicates)');

    // Creating a game with duplicate player names/clientIds must represent each player once
    const dedupedGame = createInitialGame('Dedup Check', 'river_valley', [
      { name: 'Alice', isAI: false, clientId: 'c1' },
      { name: 'alice', isAI: false, clientId: 'c2' },
      { name: 'Bob', isAI: false, clientId: 'c1' },
      { name: 'Carol', isAI: false, clientId: 'c3' },
    ]);
    if (dedupedGame.players.length !== 2) {
      throw new Error(`Expected 2 unique players after deduplication, got ${dedupedGame.players.length}`);
    }
    details.push('✓ Engine enforces unique player representation per match');

    // Verify generated game IDs are 8-digit hex codes
    if (!isHexGameCode(multiGame.id) || multiGame.id.length !== 8) {
      throw new Error(`Expected 8-digit hex game code, got "${multiGame.id}"`);
    }
    details.push(`✓ Game code generated as 8-digit hex string (${multiGame.id})`);

    // Second player resigns ("everyone else has resigned") -> removes match
    const bobResign = resignPlayer(multiGame, bob.id);
    if (!bobResign.resigned || !bobResign.shouldRemoveMatch) {
      throw new Error('Final remaining player resigning must remove match');
    }
    details.push('✓ Final remaining player resigning (everyone else resigned) removes match');

    return {
      id: 'resign_and_delete_permissions',
      category: 'Match Lifecycle',
      name: 'Resign Match, Last-Player Removal & Starter-Only Delete',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'resign_and_delete_permissions',
      category: 'Match Lifecycle',
      name: 'Resign Match, Last-Player Removal & Starter-Only Delete',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 13. Test Stock Apprentice AI Bot (End-to-End Stock Certificate Strategy, Research & Isolation)
 */
export function testStockBeginnerBotEndToEnd(): TestResult {
  const start = performance.now();
  const details: string[] = [];

  try {
    if (!BOT_PROFILES.some(b => b.id === 'stock_beginner')) {
      throw new Error('BOT_PROFILES missing stock_beginner opponent');
    }

    const state = createInitialGame(
      'Stock AI Simulation',
      'river_valley',
      [
        { name: 'Human Observer', isAI: false },
        { name: 'Stock Apprentice (AI)', isAI: true, aiProfileId: 'stock_beginner' },
      ],
      { maxRounds: 30 }
    );

    const human = state.players[0];
    const bot = state.players[1];

    // Place human decoy goods on neutral/non-bot hex and a human-owned building nearby
    // to prove the AI strictly ignores other players and never steals their goods/output
    const decoyHexId = '-1,0';
    state.hexes[decoyHexId].goods = {
      boards: 4,
      stone: 4,
      gold: 4,
      coin: 4,
      stock: 1,
    };
    state.hexes['-1,-1'].building = {
      id: 'human_wc_decoy',
      type: 'woodcutter',
      ownerId: human.id,
      builtRound: 1,
    };

    // Simulate 25 full rounds of phase transitions + bot turns
    while (state.phase !== 'COMPLETED') {
      advancePhase(state);
      runBotTurn(state, bot.id);
    }

    const botBuildings = Object.values(state.hexes)
      .filter(h => h.building?.ownerId === bot.id)
      .map(h => h.building!.type);

    const requiredBuildings: BuildingType[] = [
      'woodcutter',
      'sawmill',
      'quarry',
      'mine',
      'papermill',
      'burner',
      'mint',
      'stockexchange',
    ];
    for (const req of requiredBuildings) {
      if (!botBuildings.includes(req)) {
        throw new Error(
          `AI failed to construct ${req} within 30 rounds (built: ${botBuildings.join(', ')})`
        );
      }
    }
    details.push(`✓ AI planned and constructed complete Stock Certificate chain: ${requiredBuildings.join(' → ')}`);

    if (!bot.unlockedTechs?.includes('specialized_mines')) {
      throw new Error('AI failed to research Specialized Mines (2 Geese + 1 Paper)');
    }
    details.push('✓ AI completed Specialized Mines research (2 Geese + 1 Paper consumed)');

    const botStockCarried = Object.values(state.transporters)
      .filter(t => t.ownerId === bot.id)
      .reduce((sum, t) => sum + (t.cargo.stock || 0), 0);
    const botStockOnGround = Object.values(state.hexes).reduce(
      (sum, h) => sum + (h.building?.ownerId === bot.id ? h.goods.stock || 0 : 0),
      0
    );

    if (botStockCarried < 1 || bot.score < 120) {
      throw new Error(
        `AI failed to manufacture and carry Stock Certificate (carried=${botStockCarried}, ground=${botStockOnGround}, score=${bot.score})`
      );
    }
    details.push(`✓ AI manufactured and secured ${botStockCarried}x Stock Certificate(s) (${bot.score} VP)`);

    const botWonderBricks = state.wonder.reduce(
      (sum, tier) => sum + tier.bricks.filter(b => b.ownerId === bot.id).length,
      0
    );
    if (botWonderBricks !== 0) {
      throw new Error(`Expected 0 Wonder bricks from Stock AI, found ${botWonderBricks}`);
    }
    details.push('✓ Verified AI ignored Wonder brick contributions (0 bricks)');

    const decoy = state.hexes[decoyHexId].goods;
    if (
      decoy.boards !== 4 ||
      decoy.stone !== 4 ||
      decoy.gold !== 4 ||
      decoy.coin !== 4 ||
      decoy.stock !== 1
    ) {
      throw new Error(`AI touched decoy goods belonging to another player on ${decoyHexId}`);
    }
    details.push('✓ Verified AI ignored other player buildings and decoy goods');

    return {
      id: 'stock_beginner_ai_bot',
      category: 'AI Opponents',
      name: 'Stock Apprentice AI (Full Stock Pipeline, Research & Isolation)',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'stock_beginner_ai_bot',
      category: 'AI Opponents',
      name: 'Stock Apprentice AI (Full Stock Pipeline, Research & Isolation)',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 14. Test River-Divided Tile Rules & UI Bank Offset Geometry
 * Verifies on tiles split by unbridged rivers:
 * 1) Factories can only be built using materials accessible on the builder's bank (no cross-river pooling)
 * 2) Factories only consume inputs and emit outputs on their own side
 * 3) Players can only feed factory inputs and collect outputs from the same side as the factory
 * 4) Legal road & bridge building strictly respects accessible bank edges, and building a bridge unlocks crossing
 * 5) UI anchor offsets place buildings/transporters on distinct separated sides away from river barriers
 */
function testRiverDividedTileRules(): TestResult {
  const start = performance.now();
  const details: string[] = [];

  try {
    const state = createTestGame();
    const p1 = state.players[0];

    // Pick a river-divided land hex in river_valley that is split into at least 2 unbridged sides
    const splitHex = Object.values(state.hexes).find(h => {
      if (h.terrain === 'water') return false;
      const layout = getHexSideLayout(state, h.id);
      return layout.isSplit && layout.sides.length >= 2;
    });
    if (!splitHex) {
      throw new Error('Expected at least one river-divided tile on river_valley map');
    }

    const layout = getHexSideLayout(state, splitHex.id);
    const side0 = layout.sides[0];
    const side1 = layout.sides[1];
    // Find a river edge separating side0 and side1 (flanked by both sides)
    const separatingEdgeId = side0.flankingRiverEdgeIds.find(eId =>
      side1.flankingRiverEdgeIds.includes(eId)
    );
    if (!separatingEdgeId) {
      throw new Error(`Could not find separating river edge between Side ${side0.side} and Side ${side1.side} on ${splitHex.id}`);
    }
    const separatingEdge = state.edges[separatingEdgeId];
    const splitSideNeighborId =
      separatingEdge.hexA === splitHex.id ? separatingEdge.hexB : separatingEdge.hexA;

    // Make splitHex terrain 'pasture' so we can test Sawmill (cost: 2 Boards + 1 Stone)
    splitHex.terrain = 'pasture';
    splitHex.building = undefined;
    splitHex.goods = {};
    splitHex.goodsBySide = undefined;

    // Clear all p1 transporters except donkeyA and place donkeyA on Side 0
    const allP1Transporters = Object.values(state.transporters).filter(t => t.ownerId === p1.id);
    const donkeyA = allP1Transporters[0];
    for (const extra of allP1Transporters.slice(1)) {
      delete state.transporters[extra.id];
    }

    // === RULE 1: Construction material isolation across unbridged river ===
    state.phase = 'BUILDING';
    donkeyA.hexId = splitHex.id;
    donkeyA.side = side0.side;
    donkeyA.cargo = { boards: 1, stone: 1 }; // Missing 1 board on Side 0
    addGoodOnSide(state, splitHex.id, side1.side, 'boards', 1); // Extra board isolated on Side 1

    const crossPoolGroundCheck = canBuildFactory(state, p1.id, splitHex.id, 'sawmill', donkeyA.id);
    if (crossPoolGroundCheck.valid) {
      throw new Error('Should NOT allow pooling construction boards across an unbridged river!');
    }
    details.push('✓ Rule 1a: Blocked pooling construction material between Side 0 transporter and Side 1 ground');

    // Add Donkey B on Side 1 carrying 1 board -> still must NOT pool with Donkey A on Side 0
    const donkeyBId = 't_split_test_donkey_b';
    state.transporters[donkeyBId] = {
      id: donkeyBId,
      ownerId: p1.id,
      type: 'donkey',
      hexId: splitHex.id,
      side: side1.side,
      cargo: { boards: 1 },
      movesLeft: 2,
      maxMoves: 2,
      capacity: 2,
    };
    // Clear Side 1 ground so only Donkey A (Side 0: 1 board, 1 stone) + Donkey B (Side 1: 1 board) exist
    splitHex.goods = {};
    splitHex.goodsBySide = undefined;

    const crossPoolTransportersCheck = canBuildFactory(state, p1.id, splitHex.id, 'sawmill', donkeyA.id);
    if (crossPoolTransportersCheck.valid) {
      throw new Error('Should NOT allow pooling construction boards between Donkey A on Side 0 and Donkey B on Side 1!');
    }
    details.push('✓ Rule 1b: Blocked pooling construction material between two transporters on opposite banks');

    // Give Donkey A 2 boards on Side 0 + 1 stone on Side 0 ground -> must now succeed and anchor building strictly on Side 0
    donkeyA.cargo = { boards: 2 };
    addGoodOnSide(state, splitHex.id, side0.side, 'stone', 1);
    const legalBuildCheck = canBuildFactory(state, p1.id, splitHex.id, 'sawmill', donkeyA.id);
    if (!legalBuildCheck.valid) {
      throw new Error(`Expected legal Sawmill build on Side ${side0.side}, got valid=${legalBuildCheck.valid}, reason=${legalBuildCheck.reason}`);
    }
    const builtOk = executeBuildFactory(state, p1.id, splitHex.id, 'sawmill', donkeyA.id);
    const builtBuilding = state.hexes[splitHex.id].building;
    if (!builtOk || builtBuilding?.side !== side0.side) {
      throw new Error(`Expected built Sawmill to be anchored on Side ${side0.side}, got ${builtBuilding?.side}`);
    }
    details.push(`✓ Rule 1c: Sawmill built on Side ${side0.side} using Side ${side0.side} materials (Side ${side1.side} Donkey B cargo untouched)`);

    // === RULE 2: Production inputs & outputs stay strictly on the factory's side ===
    splitHex.terrain = 'pasture';
    splitHex.building = {
      id: 'b_split_test_sawmill',
      type: 'sawmill',
      ownerId: p1.id,
      builtRound: state.round,
      side: side0.side,
    };
    splitHex.goods = {};
    splitHex.goodsBySide = undefined;
    // Place 1 wood ONLY on Side 1 (wrong side)
    addGoodOnSide(state, splitHex.id, side1.side, 'wood', 1);

    runProductionPhase(state);
    if ((getGoodsOnSide(state, splitHex.id, side0.side).boards ?? 0) !== 0 ||
        (getGoodsOnSide(state, splitHex.id, side1.side).wood ?? 0) !== 1) {
      throw new Error('Sawmill on Side 0 consumed or produced boards from Wood isolated on Side 1!');
    }
    details.push('✓ Rule 2a: Sawmill on Side 0 ignored Wood isolated on Side 1');

    // Now place 1 wood on Side 0 -> must produce 2 boards strictly on Side 0
    addGoodOnSide(state, splitHex.id, side0.side, 'wood', 1);
    runProductionPhase(state);
    if ((getGoodsOnSide(state, splitHex.id, side0.side).boards ?? 0) !== 2 ||
        (getGoodsOnSide(state, splitHex.id, side1.side).boards ?? 0) !== 0 ||
        (getGoodsOnSide(state, splitHex.id, side1.side).wood ?? 0) !== 1) {
      throw new Error(`Expected 2 boards strictly on Side ${side0.side} and Side ${side1.side} wood untouched`);
    }
    details.push('✓ Rule 2b: Sawmill consumed Side 0 Wood and placed 2 Boards strictly on Side 0');

    // === RULE 3: Feeding inputs & collecting outputs restricted to factory side ===
    state.phase = 'MOVEMENT';
    donkeyBId && (state.transporters[donkeyBId].cargo = { wood: 1 });
    // Donkey B is on Side 1 -> cannot drop wood onto Side 0, and cannot pick up Side 0 boards
    const crossDropCheck = canDropGoods(state, donkeyBId, 'wood', 1, p1.id, side0.side);
    if (crossDropCheck.valid) {
      throw new Error('Transporter on Side 1 should NOT be able to drop input goods onto Side 0!');
    }
    const crossPickupCheck = canPickupGoods(state, donkeyBId, 'boards', 1, p1.id, side0.side);
    if (crossPickupCheck.valid) {
      throw new Error('Transporter on Side 1 should NOT be able to collect Sawmill outputs on Side 0!');
    }
    const defaultPickupSide1 = canPickupGoods(state, donkeyBId, 'boards', 1, p1.id);
    if (defaultPickupSide1.valid) {
      throw new Error('Transporter on Side 1 without targetSide should NOT find Side 0 boards!');
    }
    details.push('✓ Rule 3a: Blocked Side 1 transporter from feeding Side 0 or collecting Side 0 boards');

    // Donkey A on Side 0 CAN collect Side 0 boards and drop onto Side 0
    donkeyA.cargo = {};
    const side0PickupCheck = canPickupGoods(state, donkeyA.id, 'boards', 1, p1.id, side0.side);
    if (!side0PickupCheck.valid) {
      throw new Error(`Donkey A on Side ${side0.side} should collect Side ${side0.side} boards: ${side0PickupCheck.reason}`);
    }
    executePickupGoods(state, donkeyA.id, 'boards', 1, p1.id, side0.side);
    if (donkeyA.cargo.boards !== 1 || (getGoodsOnSide(state, splitHex.id, side0.side).boards ?? 0) !== 1) {
      throw new Error('Expected Side 0 board pickup to transfer 1 board to Donkey A');
    }
    details.push('✓ Rule 3b: Side 0 transporter collected output Boards from Side 0');

    // === RULE 4: Legal road/bridge borders on split hex & bridge unlocks crossing ===
    state.phase = 'BUILDING';
    donkeyA.cargo = {};
    addGoodOnSide(state, splitHex.id, side0.side, 'stone', 1);
    addGoodOnSide(state, splitHex.id, side0.side, 'boards', 2);

    // Find a dry neighbor attached ONLY to Side 1 (not Side 0)
    const side1OnlyNeighbor = side1.nonRiverNeighborIds.find((nId: string) => {
      if (side0.nonRiverNeighborIds.includes(nId)) return false;
      const c1 = parseHexKey(splitHex.id);
      const c2 = parseHexKey(nId);
      const e = state.edges[getEdgeKey(c1.q, c1.r, c2.q, c2.r)];
      return Boolean(e && !e.isRiver && state.hexes[nId]?.terrain !== 'water');
    });
    if (side1OnlyNeighbor) {
      const blockedRemoteRoad = canBuildRoad(state, p1.id, splitHex.id, side1OnlyNeighbor, 'stone', donkeyA.id);
      if (blockedRemoteRoad.valid) {
        throw new Error('Donkey on Side 0 should NOT be able to pave a road on a border belonging solely to Side 1!');
      }
      details.push('✓ Rule 4a: Blocked paving road on opposite-bank border across unbridged river');
    }

    // Build a Bridge across separatingEdge between Side 0 and Side 1 (via neighbor across river)
    const bridgeFromSide0 = canBuildRoad(state, p1.id, splitHex.id, splitSideNeighborId, 'boards', donkeyA.id);
    if (!bridgeFromSide0.valid || !bridgeFromSide0.isBridge) {
      throw new Error(`Expected legal bridge build from Side ${side0.side} to ${splitSideNeighborId}: ${bridgeFromSide0.reason}`);
    }
    const bridgeBuiltOk = executeBuildRoad(state, p1.id, splitHex.id, splitSideNeighborId, 'boards', donkeyA.id);
    if (!bridgeBuiltOk || state.edges[separatingEdgeId].improvement !== 'bridge') {
      throw new Error('Failed to build bridge connecting riverbanks');
    }
    details.push('✓ Rule 4b: Built Bridge (2 Boards) connecting split banks along the river');

    // In MOVEMENT phase, Donkey B on Side 1 can now cross internally onto Side 0 via the bridge & collect Side 0 boards!
    state.phase = 'MOVEMENT';
    const donkeyB = state.transporters[donkeyBId];
    donkeyB.cargo = {};
    donkeyB.movesLeft = 2;
    const internalBridgeMove = canMoveTransporter(state, donkeyBId, splitHex.id, p1.id, side0.side);
    if (!internalBridgeMove.valid) {
      throw new Error(`Donkey B on Side ${side1.side} should cross internal bridge to Side ${side0.side}: ${internalBridgeMove.reason}`);
    }
    executeMoveTransporter(state, donkeyBId, splitHex.id, p1.id, side0.side);
    if (getTransporterSide(state, state.transporters[donkeyBId]) !== side0.side) {
      throw new Error('Expected Donkey B side to update after internal bridge crossing');
    }
    const bridgedPickup = canPickupGoods(state, donkeyBId, 'boards', 1, p1.id, side0.side);
    if (!bridgedPickup.valid) {
      throw new Error(`Donkey B after crossing bridge should collect Side 0 boards: ${bridgedPickup.reason}`);
    }
    details.push('✓ Rule 4c: After bridge construction, Donkey B crossed to Side 0 and gained access to Sawmill outputs');

    // === RULE 5: UI offset geometry puts Side 0 and Side 1 on clearly separated visual anchors ===
    const anchor0 = getHexSideVisualAnchor(state, splitHex.id, side0.side, 44);
    const anchor1 = getHexSideVisualAnchor(state, splitHex.id, side1.side, 44);
    const separation = Math.hypot(anchor0.dx - anchor1.dx, anchor0.dy - anchor1.dy);
    if (separation < 15) {
      throw new Error(`Expected UI side anchors on split hex ${splitHex.id} to be visually separated (>=15px), got ${separation.toFixed(1)}px`);
    }
    details.push(`✓ Rule 5: UI bank anchors separated by ${separation.toFixed(1)}px (${side0.compassLabel} vs ${side1.compassLabel})`);

    // === RULE 6: Land Road (1 Stone) alongside a river between adjacent forest tiles (Mesopotamia NWW <-> WW & NEW) ===
    const meso = createInitialGame('Meso Riverbank Road Test', 'scenario_mesopotamia', [
      { name: 'Solo', isAI: false },
    ], { isSolitaire: true, scenarioId: 'mesopotamia', maxRounds: 20 });
    const mesoP1 = meso.players[0];
    const mesoDonkey = Object.values(meso.transporters).find(t => t.ownerId === mesoP1.id)!;
    // NWW = '0,-1' (forest), WW = '-1,0' (forest), NEW = '1,-1' (forest).
    // SE bank on NWW ('0,-1') is the side flanking CP ('0,0')!
    const nwwSeSide = getNeighborSideOnHex(meso, '0,-1', '0,0') ?? 0;
    const wwSeSide = getMatchingBankAcrossRiverEdge(meso, '0,-1', nwwSeSide, '-1,0');
    const nwwNwSide = getHexSideLayout(meso, '0,-1').sides.find(s => s.side !== nwwSeSide)?.side ?? 1;

    meso.phase = 'BUILDING';
    mesoDonkey.hexId = '0,-1';
    mesoDonkey.side = nwwSeSide;
    mesoDonkey.cargo = { stone: 2 };

    // Paving Land Road (1 Stone) between NWW ('0,-1') and WW ('-1,0') alongside the river MUST succeed!
    const bankRoadCheckWW = canBuildRoad(meso, mesoP1.id, '0,-1', '-1,0', 'stone', mesoDonkey.id);
    if (!bankRoadCheckWW.valid || bankRoadCheckWW.isBridge || bankRoadCheckWW.cost !== 1) {
      throw new Error(`Expected legal 1-Stone Road alongside river between NWW and WW: ${bankRoadCheckWW.reason}`);
    }
    const builtBankRoadWW = executeBuildRoad(meso, mesoP1.id, '0,-1', '-1,0', 'stone', mesoDonkey.id);
    if (!builtBankRoadWW) {
      throw new Error('executeBuildRoad failed for Land Road alongside river between NWW and WW');
    }
    // Also pave NWW ('0,-1') <-> NEW ('1,-1') alongside the river
    const builtBankRoadNEW = executeBuildRoad(meso, mesoP1.id, '0,-1', '1,-1', 'stone', mesoDonkey.id);
    if (!builtBankRoadNEW) {
      throw new Error('executeBuildRoad failed for Land Road alongside river between NWW and NEW');
    }
    if ((mesoDonkey.cargo.stone || 0) !== 0) {
      throw new Error(`Expected 2 Stone consumed for 2 riverbank roads, remaining: ${mesoDonkey.cargo.stone}`);
    }
    details.push('✓ Rule 6a: Built 1-Stone Land Roads between Mesopotamia forest tiles (WW <-> NWW <-> NEW) alongside river');

    // Opposite NW bank remains unbridged and has NO road!
    if (doesSideTouchRoad(meso, '0,-1', nwwNwSide)) {
      throw new Error('Opposite unbridged NW bank of NWW should NOT touch the SE riverbank road!');
    }
    if (!doesSideTouchRoad(meso, '0,-1', nwwSeSide) || !doesSideTouchRoad(meso, '-1,0', wwSeSide)) {
      throw new Error('Expected SE banks of NWW and WW to touch the new riverbank road');
    }

    // Bridge (2 Boards) can still be constructed on the same river border if needed later
    addGoodOnSide(meso, '0,-1', nwwSeSide, 'boards', 2);
    const bridgeAfterRoadCheck = canBuildRoad(meso, mesoP1.id, '0,-1', '-1,0', 'boards', mesoDonkey.id, {
      buildType: 'bridge',
    });
    if (!bridgeAfterRoadCheck.valid || !bridgeAfterRoadCheck.isBridge) {
      throw new Error(`Expected Bridge (2 Boards) to remain buildable after paving a riverbank road: ${bridgeAfterRoadCheck.reason}`);
    }

    // Production refreshes Donkey on SE riverbank road to roadSpeed = 2, and a Wagon (roadOnly) can drive WW <-> NWW <-> NEW!
    runProductionPhase(meso);
    if (mesoDonkey.maxMoves !== 2) {
      throw new Error(`Expected Donkey on NWW SE bank touching riverbank road to gain 2 moves, got ${mesoDonkey.maxMoves}`);
    }
    meso.phase = 'MOVEMENT';
    const mesoWagonId = 't_meso_wagon_test';
    meso.transporters[mesoWagonId] = {
      id: mesoWagonId,
      ownerId: mesoP1.id,
      type: 'wagon',
      hexId: '0,-1',
      side: nwwSeSide,
      cargo: {},
      movesLeft: 3,
      maxMoves: 3,
      capacity: 3,
    };
    const wagonMoveWW = canMoveTransporter(meso, mesoWagonId, '-1,0', mesoP1.id);
    if (!wagonMoveWW.valid) {
      throw new Error(`Wagon should drive along paved riverbank road from NWW to WW: ${wagonMoveWW.reason}`);
    }
    executeMoveTransporter(meso, mesoWagonId, '-1,0', mesoP1.id);
    if (getTransporterSide(meso, meso.transporters[mesoWagonId]) !== wwSeSide) {
      throw new Error('Expected Wagon moving along riverbank road to land on WW SE bank');
    }
    // Wagon on opposite unbridged NW bank of NWW must STILL be blocked from driving to WW
    const nwWagonId = 't_meso_nw_wagon_test';
    meso.transporters[nwWagonId] = {
      id: nwWagonId,
      ownerId: mesoP1.id,
      type: 'wagon',
      hexId: '0,-1',
      side: nwwNwSide,
      cargo: {},
      movesLeft: 3,
      maxMoves: 3,
      capacity: 3,
    };
    if (canMoveTransporter(meso, nwWagonId, '-1,0', mesoP1.id).valid) {
      throw new Error('Wagon on unbridged NW bank must NOT be allowed to use SE riverbank road!');
    }
    details.push('✓ Rule 6b: Verified Donkey road speed, Wagon travel along riverbank road, and NW opposite-bank isolation');

    // Rule 7: Exhaustive Geometric Water-Barrier & Bridge-Span Verification across ALL map presets
    // Verifies that:
    //  a) No dry-border road segment crosses or comes within 7px of any rendered river curve inside either endpoint hex
    //  b) No riverbank road segment crosses or comes within 7px of any rendered river curve inside either endpoint hex
    //  c) Every river bridge spans strictly perpendicular across the water at the river midpoint with short bank landings
    const HEX_R = 60;
    const MIN_CLEARANCE = 7.0; // river half-width (2.75) + road half-width (4.25) = 7.0px

    const distPointToSeg = (
      p: { x: number; y: number },
      a: { x: number; y: number },
      b: { x: number; y: number }
    ): number => {
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const lenSq = abx * abx + aby * aby;
      if (lenSq < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq));
      return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
    };

    const segsIntersect = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      c: { x: number; y: number },
      d: { x: number; y: number }
    ): boolean => {
      const ccw = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) =>
        (p3.y - p1.y) * (p2.x - p1.x) - (p2.y - p1.y) * (p3.x - p1.x);
      const d1 = ccw(a, b, c);
      const d2 = ccw(a, b, d);
      const d3 = ccw(c, d, a);
      const d4 = ccw(c, d, b);
      return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
    };

    const distSegToSeg = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      c: { x: number; y: number },
      d: { x: number; y: number }
    ): number => {
      if (segsIntersect(a, b, c, d)) return 0;
      return Math.min(
        distPointToSeg(a, c, d),
        distPointToSeg(b, c, d),
        distPointToSeg(c, a, b),
        distPointToSeg(d, a, b)
      );
    };

    const getTileRiverPolylines = (
      st: GameState,
      hexId: string
    ): Array<Array<{ x: number; y: number }>> => {
      const hex = st.hexes[hexId];
      if (!hex) return [];
      const inc = Object.values(st.edges).filter(e => e.isRiver && (e.hexA === hexId || e.hexB === hexId));
      if (inc.length === 0) return [];
      const orient = st.hexOrientation || 'pointy';
      const center = hexToPixel(hex.q, hex.r, HEX_R, orient);
      const mids = inc.map(re => {
        const otherKey = re.hexA === hexId ? re.hexB : re.hexA;
        const oc = parseHexKey(otherKey);
        const seg = getSharedEdgeSegment(hex.q, hex.r, oc.q, oc.r, HEX_R, orient);
        return { x: seg.midX, y: seg.midY };
      });
      if (mids.length === 1) {
        return [[center, mids[0]]];
      }
      if (mids.length === 2) {
        const samples: Array<{ x: number; y: number }> = [];
        const STEPS = 20;
        for (let i = 0; i <= STEPS; i++) {
          const t = i / STEPS;
          const omt = 1 - t;
          samples.push({
            x: omt * omt * mids[0].x + 2 * omt * t * center.x + t * t * mids[1].x,
            y: omt * omt * mids[0].y + 2 * omt * t * center.y + t * t * mids[1].y,
          });
        }
        return [samples];
      }
      return mids.map(m => [m, center]);
    };

    const minDistBetweenPolylines = (
      p1: Array<{ x: number; y: number }>,
      p2: Array<{ x: number; y: number }>
    ): number => {
      let minD = Infinity;
      for (let i = 0; i < p1.length - 1; i++) {
        for (let j = 0; j < p2.length - 1; j++) {
          const d = distSegToSeg(p1[i], p1[i + 1], p2[j], p2[j + 1]);
          if (d < minD) minD = d;
        }
      }
      return minD;
    };

    let checkedDryRoads = 0;
    let checkedBankRoads = 0;
    let checkedBridges = 0;
    let worstRoadClearance = Infinity;

    for (const preset of Object.values(MAP_PRESETS)) {
      if (!preset.riverEdges || preset.riverEdges.length === 0) continue;
      const st = createInitialGame(`Geom ${preset.id}`, preset.id, [{ name: 'Tester', isAI: false }]);
      const orient = st.hexOrientation || 'pointy';
      const riverCache: Record<string, Array<Array<{ x: number; y: number }>>> = {};
      const getRivers = (hId: string) => {
        if (!riverCache[hId]) riverCache[hId] = getTileRiverPolylines(st, hId);
        return riverCache[hId];
      };

      for (const edge of Object.values(st.edges)) {
        const hA = st.hexes[edge.hexA];
        const hB = st.hexes[edge.hexB];
        if (!hA || !hB || hA.terrain === 'water' || hB.terrain === 'water') continue;

        const tileRivers = [...getRivers(edge.hexA), ...getRivers(edge.hexB)];

        if (!edge.isRiver) {
          const geom = getDryRoadGeometry(st, edge, HEX_R);
          checkedDryRoads++;
          for (const riverLine of tileRivers) {
            const d = minDistBetweenPolylines(geom.points, riverLine);
            if (d < worstRoadClearance) worstRoadClearance = d;
            if (d <= MIN_CLEARANCE) {
              throw new Error(
                `Dry road on ${preset.id} edge ${edge.id} violates water barrier clearance: ${d.toFixed(2)}px <= ${MIN_CLEARANCE}px`
              );
            }
          }
        } else {
          // Verify bridge geometry: short, strictly perpendicular across the river at midpoint
          const bGeom = getRiverBridgeGeometry(st, edge, HEX_R);
          checkedBridges++;
          const spanLen = Math.hypot(bGeom.end.x - bGeom.start.x, bGeom.end.y - bGeom.start.y);
          if (spanLen < 14 || spanLen > 32) {
            throw new Error(
              `Bridge on ${preset.id} edge ${edge.id} span ${spanLen.toFixed(2)}px should only span water + small bank margin (14..32px)`
            );
          }
          const bDirX = (bGeom.end.x - bGeom.start.x) / spanLen;
          const bDirY = (bGeom.end.y - bGeom.start.y) / spanLen;
          const dot = Math.abs(bDirX * bGeom.riverDir.x + bDirY * bGeom.riverDir.y);
          if (dot > 1e-6) {
            throw new Error(`Bridge on ${preset.id} edge ${edge.id} is not perpendicular to river (dot=${dot})`);
          }
          const cA = hexToPixel(hA.q, hA.r, HEX_R, orient);
          const cB = hexToPixel(hB.q, hB.r, HEX_R, orient);
          const expectedMidX = (cA.x + cB.x) / 2;
          const expectedMidY = (cA.y + cB.y) / 2;
          const actualMidX = (bGeom.start.x + bGeom.end.x) / 2;
          const actualMidY = (bGeom.start.y + bGeom.end.y) / 2;
          if (Math.hypot(actualMidX - expectedMidX, actualMidY - expectedMidY) > 1e-4) {
            throw new Error(`Bridge on ${preset.id} edge ${edge.id} is not centered on river crossing`);
          }

          // Verify every riverbank road stays clear of water barriers
          const bankPairs = getRiverEdgeBankPairs(st, edge);
          bankPairs.forEach((pair, pIdx) => {
            const geom = getRiverBankRoadGeometry(st, edge, pair, HEX_R, pIdx);
            checkedBankRoads++;
            for (const riverLine of tileRivers) {
              const d = minDistBetweenPolylines(geom.points, riverLine);
              if (d < worstRoadClearance) worstRoadClearance = d;
              if (d <= MIN_CLEARANCE) {
                throw new Error(
                  `Riverbank road on ${preset.id} edge ${edge.id} (pair ${pair.hexASide}->${pair.hexBSide}) violates water barrier clearance: ${d.toFixed(2)}px <= ${MIN_CLEARANCE}px`
                );
              }
            }
          });
        }
      }
    }
    details.push(
      `✓ Rule 7: Audited ${checkedDryRoads} dry roads, ${checkedBankRoads} riverbank roads, & ${checkedBridges} perpendicular river bridges across all river presets (min water clearance ${worstRoadClearance.toFixed(1)}px > ${MIN_CLEARANCE}px)`
    );

    return {
      id: 'river_divided_tile_rules',
      category: 'River Bank Isolation & UI',
      name: 'River-Divided Tiles (Build, Production, Cargo, Roads & UI Offsets)',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'river_divided_tile_rules',
      category: 'River Bank Isolation & UI',
      name: 'River-Divided Tiles (Build, Production, Cargo, Roads & UI Offsets)',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * 15. Loaded Cargo for Building & Production + Prompt Candidate Detection
 * Verifies:
 * a) Factories & Roads can be built directly using items loaded on transporters (0 ground goods)
 * b) Factories consume loaded transporter cargo directly during Production (and mix ground + cargo)
 * c) Opt-out (false) and selective transporter ID allowlist keep non-selected transporters untouched
 * d) River-divided tile isolation still blocks loaded cargo on an opposite unbridged bank
 * e) willAdvanceFromWonderRunProduction & getProductionCargoCandidates detect real eligible candidates cleanly
 */
export function testLoadedCargoBuildAndProduction(): TestResult {
  const start = performance.now();
  const details: string[] = [];

  try {
    // a) Build factory & road using ONLY loaded cargo (0 ground goods)
    {
      const state = createTestGame();
      const p1 = state.players[0];
      const allP1T = Object.values(state.transporters).filter(t => t.ownerId === p1.id);
      const donkey = allP1T[0];
      for (const extra of allP1T.slice(1)) {
        delete state.transporters[extra.id];
      }

      // Find an unsplit pasture hex with an un-paved land neighbor
      const targetHex = Object.values(state.hexes).find(h => {
        if (h.terrain === 'water' || h.building) return false;
        const layout = getHexSideLayout(state, h.id);
        return !layout.isSplit && layout.sides[0].nonRiverNeighborIds.some(nId => state.hexes[nId]?.terrain !== 'water');
      });
      if (!targetHex) throw new Error('Could not find non-split land hex for cargo build test');

      targetHex.terrain = 'pasture';
      targetHex.building = undefined;
      targetHex.goods = {};
      targetHex.goodsBySide = undefined;

      donkey.hexId = targetHex.id;
      donkey.side = 0;
      donkey.cargo = { boards: 2, stone: 2 }; // 2 boards + 1 stone for Sawmill, 1 stone left for Road
      state.phase = 'BUILDING';

      const buildCheck = canBuildFactory(state, p1.id, targetHex.id, 'sawmill', donkey.id);
      if (!buildCheck.valid) {
        throw new Error(`Expected legal Sawmill build from loaded cargo: ${buildCheck.reason}`);
      }
      if (!executeBuildFactory(state, p1.id, targetHex.id, 'sawmill', donkey.id)) {
        throw new Error('executeBuildFactory failed with loaded cargo');
      }
      if (state.hexes[targetHex.id].building?.type !== 'sawmill') {
        throw new Error('Sawmill was not placed after cargo build');
      }
      if ((donkey.cargo.boards || 0) !== 0 || (donkey.cargo.stone || 0) !== 1) {
        throw new Error(`Unexpected remaining cargo after Sawmill build: ${JSON.stringify(donkey.cargo)}`);
      }

      const layout = getHexSideLayout(state, targetHex.id);
      const landNeighborId = layout.sides[0].nonRiverNeighborIds.find(nId => state.hexes[nId]?.terrain !== 'water');
      if (!landNeighborId) throw new Error('Missing land neighbor for road cargo build test');

      const roadCheck = canBuildRoad(state, p1.id, targetHex.id, landNeighborId, 'stone', donkey.id);
      if (!roadCheck.valid) {
        throw new Error(`Expected legal Road build from loaded stone: ${roadCheck.reason}`);
      }
      if (!executeBuildRoad(state, p1.id, targetHex.id, landNeighborId, 'stone', donkey.id)) {
        throw new Error('executeBuildRoad failed with loaded stone');
      }
      if ((donkey.cargo.stone || 0) !== 0) {
        throw new Error(`Expected stone cargo to drop to 0 after Road build, got ${donkey.cargo.stone}`);
      }
      details.push('✓ Building Sawmill & Road directly from loaded transporter cargo succeeded with 0 ground goods');
    }

    // b) Production consumes loaded cargo on factory hex (pure cargo + mixed ground+cargo + Wonder advance)
    {
      const state = createTestGame();
      const p1 = state.players[0];
      const allP1T = Object.values(state.transporters).filter(t => t.ownerId === p1.id);
      const donkey = allP1T[0];
      for (const extra of allP1T.slice(1)) {
        delete state.transporters[extra.id];
      }

      const targetHex = Object.values(state.hexes).find(h => h.terrain !== 'water' && !getHexSideLayout(state, h.id).isSplit);
      if (!targetHex) throw new Error('Missing land hex for cargo production test');

      targetHex.terrain = 'pasture';
      targetHex.goods = {};
      targetHex.goodsBySide = undefined;
      targetHex.building = { id: 'b_sawmill_test15', type: 'sawmill', ownerId: p1.id, builtRound: state.round, side: 0 };

      donkey.hexId = targetHex.id;
      donkey.side = 0;
      donkey.cargo = { wood: 2 };

      state.phase = 'WONDER';
      if (!willAdvanceFromWonderRunProduction(state)) {
        throw new Error('Expected willAdvanceFromWonderRunProduction=true during WONDER phase before end-game');
      }
      const candidates = getProductionCargoCandidates(state, p1.id);
      if (
        candidates.length !== 1 ||
        candidates[0].transporterId !== donkey.id ||
        candidates[0].usableGoods.find(g => g.good === 'wood')?.quantity !== 2
      ) {
        throw new Error(`Unexpected prompt candidates for Sawmill cargo: ${JSON.stringify(candidates)}`);
      }

      advancePhase(state); // WONDER -> PRODUCTION (Round + 1) with default allowTransporterCargo: true
      if ((donkey.cargo.wood || 0) !== 0) {
        throw new Error(`Expected 2 wood to be consumed from Donkey cargo during Production, got ${donkey.cargo.wood}`);
      }
      if ((state.hexes[targetHex.id].goods.boards || 0) !== 4) {
        throw new Error(`Expected Sawmill to emit 4 boards from loaded cargo, got ${state.hexes[targetHex.id].goods.boards}`);
      }

      // Check Mint mixed ground + loaded cargo
      targetHex.goods = {};
      targetHex.goodsBySide = undefined;
      addGoodOnSide(state, targetHex.id, 0, 'gold', 1);
      targetHex.building = { id: 'b_mint_test15', type: 'mint', ownerId: p1.id, builtRound: state.round, side: 0 };
      donkey.cargo = { gold: 1, fuel: 1 }; // Mint wants 2 gold + 1 fuel
      runProductionPhase(state);
      if ((state.hexes[targetHex.id].goods.coin || 0) !== 1 || (donkey.cargo.gold || 0) !== 0 || (donkey.cargo.fuel || 0) !== 0) {
        throw new Error('Expected Mint to combine 1 ground gold + 1 carried gold + 1 carried fuel into 1 coin');
      }
      details.push('✓ Production consumes pure loaded cargo (Sawmill) & mixed ground+cargo (Mint)');
    }

    // c) Opt-out (false) & selective allowlist ([d1.id]) + primary producer / end-game guards
    {
      const state = createTestGame();
      const p1 = state.players[0];
      const allP1T = Object.values(state.transporters).filter(t => t.ownerId === p1.id);
      const d1 = allP1T[0];
      const d2 = {
        ...d1,
        id: 't_extra_cargo_test',
        cargo: { wood: 1 } as Partial<Record<GoodType, number>>,
      };
      state.transporters[d2.id] = d2;

      const targetHex = Object.values(state.hexes).find(h => h.terrain !== 'water' && !getHexSideLayout(state, h.id).isSplit);
      if (!targetHex) throw new Error('Missing hex for opt-out test');
      targetHex.terrain = 'pasture';
      targetHex.goods = {};
      targetHex.goodsBySide = undefined;
      targetHex.building = { id: 'b_sawmill_optout_test15', type: 'sawmill', ownerId: p1.id, builtRound: state.round, side: 0 };

      d1.hexId = targetHex.id;
      d1.side = 0;
      d1.cargo = { wood: 1 };
      d2.hexId = targetHex.id;
      d2.side = 0;
      d2.cargo = { wood: 1 };

      // Opt-out leaves both untouched
      runProductionPhase(state, { allowTransporterCargo: false });
      if ((d1.cargo.wood || 0) !== 1 || (d2.cargo.wood || 0) !== 1 || (targetHex.goods.boards || 0) !== 0) {
        throw new Error('allowTransporterCargo=false must not consume transporter cargo');
      }

      // Selective allowlist [d1.id] consumes only d1
      runProductionPhase(state, { allowTransporterCargo: [d1.id] });
      if ((d1.cargo.wood || 0) !== 0 || (d2.cargo.wood || 0) !== 1 || (targetHex.goods.boards || 0) !== 2) {
        throw new Error('Selective allowlist [d1.id] should consume d1 and leave d2 untouched');
      }

      // Primary producer or Wonder end-game checks return no candidates / false
      targetHex.building = { id: 'b_woodcutter_test15', type: 'woodcutter', ownerId: p1.id, builtRound: state.round, side: 0 };
      if (getProductionCargoCandidates(state, p1.id).length !== 0) {
        throw new Error('Primary producer should never return transporter cargo prompt candidates');
      }
      state.phase = 'PRODUCTION';
      if (willAdvanceFromWonderRunProduction(state)) {
        throw new Error('willAdvanceFromWonderRunProduction should be false outside WONDER phase');
      }
      state.phase = 'WONDER';
      state.wonder.forEach(tier => {
        while (tier.bricks.length < tier.totalSlots) {
          tier.bricks.push({
            brickIndex: tier.bricks.length,
            tier: tier.tierIndex,
            ownerId: p1.id,
            points: tier.pointsPerBrick,
            round: state.round,
          });
        }
      });
      if (willAdvanceFromWonderRunProduction(state)) {
        throw new Error('willAdvanceFromWonderRunProduction should be false when Wonder is already complete');
      }
      details.push('✓ Opt-out (false), selective transporter allowlist, and primary/end-game guards verified');
    }

    // d) River-divided tile isolation blocks loaded cargo across unbridged river
    {
      const state = createTestGame();
      const p1 = state.players[0];
      const splitHex = Object.values(state.hexes).find(h => {
        if (h.terrain === 'water') return false;
        const layout = getHexSideLayout(state, h.id);
        return layout.isSplit && layout.sides.length >= 2;
      });
      if (!splitHex) throw new Error('Expected split hex on river_valley');
      const layout = getHexSideLayout(state, splitHex.id);
      const side0 = layout.sides[0];
      const side1 = layout.sides[1];

      splitHex.terrain = 'pasture';
      splitHex.goods = {};
      splitHex.goodsBySide = undefined;
      splitHex.building = { id: 'b_sawmill_river_test15', type: 'sawmill', ownerId: p1.id, builtRound: state.round, side: side0.side };

      const allP1T = Object.values(state.transporters).filter(t => t.ownerId === p1.id);
      const donkey = allP1T[0];
      for (const extra of allP1T.slice(1)) {
        delete state.transporters[extra.id];
      }
      donkey.hexId = splitHex.id;
      donkey.side = side1.side; // Opposite unbridged bank
      donkey.cargo = { wood: 2 };

      if (getProductionCargoCandidates(state, p1.id).length !== 0) {
        throw new Error('Transporter on opposite unbridged bank must NOT appear in production cargo candidates');
      }
      runProductionPhase(state);
      if ((donkey.cargo.wood || 0) !== 2 || (splitHex.goods.boards || 0) !== 0) {
        throw new Error('Opposite-bank transporter cargo must NOT be consumed across unbridged river');
      }
      details.push('✓ Riverbank isolation blocks loaded cargo across unbridged river in Production and prompt checks');
    }

    return {
      id: 'loaded_cargo_build_and_production',
      category: 'Cargo & Production',
      name: 'Loaded Cargo for Building & Production + Prompt Detection',
      passed: true,
      durationMs: Math.round(performance.now() - start),
      details,
    };
  } catch (err: any) {
    return {
      id: 'loaded_cargo_build_and_production',
      category: 'Cargo & Production',
      name: 'Loaded Cargo for Building & Production + Prompt Detection',
      passed: false,
      durationMs: Math.round(performance.now() - start),
      details,
      error: err.message,
    };
  }
}

/**
 * Run the entire test suite and return aggregate metrics
 */
export function runAllGameSimulations(): SimulationSuiteResult {
  const startTime = performance.now();
  const tests: TestResult[] = [
    testInitialGameState(),
    testCargoTransport(),
    testMovementAndRivers(),
    testRoadAndBridgeConstruction(),
    testAllBuildingTypesConstruction(),
    testProductionConversions(),
    testDonkeyBreeding(),
    testWonderAndScoring(),
    testUndoRedoMemory(),
    testGooseBreedingAndTechUpgrades(),
    testSolitaireScenarioRules(),
    testResignAndDeletePermissions(),
    testStockBeginnerBotEndToEnd(),
    testRiverDividedTileRules(),
    testLoadedCargoBuildAndProduction(),
  ];

  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  return {
    total: tests.length,
    passed,
    failed,
    durationMs: Math.round(performance.now() - startTime),
    tests,
  };
}
