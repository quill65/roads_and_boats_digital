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

export type {
  BuildRoadOptions,
  LegalResearchUpgrade,
  ResearchSiteCandidate,
} from './engine/building';
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
  getEligibleResearchSites,
  getLegalResearchUpgrades,
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
  buildRoundedPolylinePath,
  doesSideFlankRiverEdge,
  doesSideTouchRoad,
  edgeHasBankRoadPair,
  ensureHexGoodsBySide,
  getAccessibleSidesOnHex,
  getBestAccessibleSide,
  getBuildingSide,
  getCompassLabel,
  getDryRoadGeometry,
  getEntrySideFromNeighbor,
  getValidEntrySidesFromNeighbor,
  getGoodsOnSide,
  getHexSideLayout,
  getHexSideVisualAnchor,
  getInteractableSidesForTransporter,
  getMatchingBankAcrossRiverEdge,
  getNeighborSideOnHex,
  getRiverBankNormal,
  getRiverBankRoadGeometry,
  getRiverBridgeGeometry,
  getRiverEdgeBankPairs,
  getRiverEdgeRoadTargets,
  getRoadHubPoint,
  getTransporterSide,
  getWatercraftVisualOffset,
  isHexDividedByUnbridgedRiver,
  isSideAdjacentToWater,
  normalizeSideForHex,
  removeGoodOnSide,
  syncHexTotalGoods,
} from './riverSides';

