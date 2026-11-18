/**
 * AI Bot Opponent Dispatcher & Public Registry
 */

import { GameState } from '../../types';
import { DEFAULT_BOT_PROFILE_ID } from './registry';
import { runStockBeginnerBotTurn } from './stockBeginnerBot';
import { BotRunner } from './types';

export type { BotProfileDefinition, BotRunner } from './types';
export { BOT_PROFILES, DEFAULT_BOT_PROFILE_ID, getBotProfile } from './registry';

const BOT_RUNNERS: Record<string, BotRunner> = {
  stock_beginner: runStockBeginnerBotTurn,
};

export function runBotTurn(state: GameState, botPlayerId: string): void {
  const bot = state.players.find(p => p.id === botPlayerId);
  if (!bot || !bot.isAI || bot.resigned) return;

  const profileId = bot.aiProfileId || DEFAULT_BOT_PROFILE_ID;
  const runner = BOT_RUNNERS[profileId] || BOT_RUNNERS[DEFAULT_BOT_PROFILE_ID];
  runner(state, botPlayerId);
}
