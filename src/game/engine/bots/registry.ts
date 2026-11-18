/**
 * AI Bot Opponent Registry
 * Allows players to choose from available AI opponent profiles.
 */

import { BotProfileId } from '../../types';
import { BotProfileDefinition } from './types';

export const DEFAULT_BOT_PROFILE_ID: BotProfileId = 'stock_beginner';

export const BOT_PROFILES: ReadonlyArray<BotProfileDefinition> = [
  {
    id: 'stock_beginner',
    name: 'Stock Apprentice (AI)',
    shortLabel: 'Stock Apprentice',
    difficulty: 'Beginner',
    description:
      'Plans and builds an independent pipeline for Stock Certificates (Woodcutter, Sawmill, Quarry, Mine, Paper Mill, Coal Burner, Mint, Stock Exchange + Mine Research). Ignores Wonder bricks and other players.',
    focus: 'Stock Certificates (120 VP)',
  },
];

export function getBotProfile(profileId?: string): BotProfileDefinition {
  return BOT_PROFILES.find(b => b.id === profileId) || BOT_PROFILES[0];
}
