/**
 * AI Bot Framework - Type Definitions
 */

import { BotProfileId, GameState } from '../../types';

export interface BotProfileDefinition {
  readonly id: BotProfileId;
  readonly name: string;
  readonly shortLabel: string;
  readonly difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readonly description: string;
  readonly focus: string;
}

export type BotRunner = (state: GameState, botPlayerId: string) => void;
