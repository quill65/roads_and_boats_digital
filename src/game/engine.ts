/**
 * Roads & Boats - Authoritative Game Logic Engine Barrel Export
 */

export type { CreateGameOptions } from './engine/setup';
export {
  canDeleteMatch,
  canRenameMatch,
  createInitialGame,
  findExistingPlayer,
  generateGameCode,
  getActiveHumanPlayers,
  isElevatedPrivilegedPlayer,
  isHexGameCode,
  isOnlyActivePlayerRemaining,
  isPlayerMatchStarter,
  isSolitaireMap,
  isSoloGameState,
  reconnectSoloPlayer,
  resignPlayer,
  sanitizeUniquePlayers,
} from './engine/setup';

export {
  addLog,
  calculatePlayerScore,
  calculateScores,
  getLeaderPlayerId,
  createSnapshotFromState,
  restoreStateFromSnapshot,
  recordHistorySnapshot,
  undoMove,
  redoMove,
  revertToHistoryIndex,
} from './engine/history';

export {
  canMoveTransporter,
  executeMoveTransporter,
  getGoodCargoWeight,
  getTransporterCargoWeight,
  canPickupGoods,
  executePickupGoods,
  canDropGoods,
  executeDropGoods,
} from './engine/movement';

export {
  calculateWonderContributionCost,
  canBuildRoad,
  executeBuildRoad,
  canBuildFactory,
  executeBuildFactory,
  canBuildWonder,
  executeBuildWonder,
  canResearchTech,
  executeResearchTech,
  canReplenishMine,
  executeReplenishMine,
  canBuildRaft,
  executeBuildRaft,
  getAccessibleSiteMaterials,
  getBuilderAccessibleSides,
} from './engine/building';

export type { ProductionPhaseOptions, TransporterProductionCandidate } from './engine/production';
export {
  runProductionPhase,
  advancePhase,
  getProductionCargoCandidates,
  willAdvanceFromWonderRunProduction,
} from './engine/production';
export type { BotProfileDefinition } from './engine/bot';
export { BOT_PROFILES, DEFAULT_BOT_PROFILE_ID, getBotProfile, runBotTurn } from './engine/bot';
export {
  addGoodOnSide,
  areSidesConnectedByBridgeOnHex,
  doesSideFlankRiverEdge,
  doesSideTouchRoad,
  ensureHexGoodsBySide,
  getAccessibleSidesOnHex,
  getBestAccessibleSide,
  getBuildingSide,
  getCompassLabel,
  getEntrySideFromNeighbor,
  getValidEntrySidesFromNeighbor,
  getGoodsOnSide,
  getHexSideLayout,
  getHexSideVisualAnchor,
  getInteractableSidesForTransporter,
  getMatchingBankAcrossRiverEdge,
  getNeighborSideOnHex,
  getTransporterSide,
  getWatercraftVisualOffset,
  isHexDividedByUnbridgedRiver,
  isSideAdjacentToWater,
  normalizeSideForHex,
  removeGoodOnSide,
  syncHexTotalGoods,
} from './riverSides';

