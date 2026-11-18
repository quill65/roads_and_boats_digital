/**
 * Roads & Boats - Official Game Constants, Building Recipes, and Transporter Profiles
 * Replicates the authentic Splotter Spellen tabletop rules & player aid.
 */

import { BuildingType, GoodType, TerrainType, TransporterType, WonderTier } from './types';

export const TERRAIN_AERIAL_TEXTURES: Record<TerrainType, string> = {
  pasture: '/src/assets/images/hex_terrain_pasture_1794373446454.jpg',
  forest: '/src/assets/images/hex_terrain_forest_1794373447412.jpg',
  mountain: '/src/assets/images/hex_terrain_mountain_1794373448258.jpg',
  rock: '/src/assets/images/hex_terrain_rock_1794593090544.jpg',
  water: '/src/assets/images/hex_terrain_water_1794373449020.jpg',
  desert: '/src/assets/images/hex_terrain_desert_1794373449556.jpg',
};

export interface TerrainInfo {
  name: string;
  fullName: string;
  icon: string;
  description: string;
  tint: string;
  tintOpacity: number;
  stroke: string;
  accentBg: string;
  badgeClass: string;
}

export const TERRAIN_INFO: Record<TerrainType, TerrainInfo> = {
  pasture: {
    name: 'Pasture',
    fullName: 'Lush Grass Pasture',
    icon: '🌱',
    description: 'Fertile grasslands. Site where two donkeys alone breed naturally without buildings or goods.',
    tint: '#22c55e',
    tintOpacity: 0.28,
    stroke: '#16a34a',
    accentBg: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
    badgeClass: 'bg-emerald-600 text-white',
  },
  forest: {
    name: 'Forest',
    fullName: 'Dense Timber Forest',
    icon: '🌲',
    description: 'Highland woods producing raw trunks. Required terrain for Woodcutters.',
    tint: '#064e3b',
    tintOpacity: 0.45,
    stroke: '#14532d',
    accentBg: 'bg-green-950/80 border-green-700 text-green-300',
    badgeClass: 'bg-emerald-900 text-emerald-100',
  },
  mountain: {
    name: 'Mountain',
    fullName: 'Rugged Ore Mountain',
    icon: '⛰️',
    description: 'Mineral-rich brown crags and deep veins. Essential terrain for Mines (Gold & Iron).',
    tint: '#78350f',
    tintOpacity: 0.38,
    stroke: '#b45309',
    accentBg: 'bg-amber-950/80 border-amber-700 text-amber-200',
    badgeClass: 'bg-amber-800 text-amber-100',
  },
  rock: {
    name: 'Rock',
    fullName: 'Granite Rock Plateau',
    icon: '🪨',
    description: 'Pale grey limestone and granite bedrock. Essential terrain for Stone Quarries.',
    tint: '#94a3b8',
    tintOpacity: 0.32,
    stroke: '#cbd5e1',
    accentBg: 'bg-slate-900/90 border-slate-400 text-slate-200',
    badgeClass: 'bg-slate-600 text-slate-100',
  },
  water: {
    name: 'Water',
    fullName: 'Deep Waterway & Sea',
    icon: '🌊',
    description: 'Open water navigable by Rafts, Rowboats, and Steamers. Land units cannot cross without bridges.',
    tint: '#0284c7',
    tintOpacity: 0.32,
    stroke: '#38bdf8',
    accentBg: 'bg-sky-950/80 border-sky-500 text-sky-300',
    badgeClass: 'bg-sky-600 text-white',
  },
  desert: {
    name: 'Desert',
    fullName: 'Sunbaked Arid Desert',
    icon: '🏜️',
    description: 'Expansive sand dunes and sandstone ridges. Open wilderness requiring roads to cross efficiently.',
    tint: '#d97706',
    tintOpacity: 0.32,
    stroke: '#f59e0b',
    accentBg: 'bg-amber-950/80 border-amber-500 text-amber-300',
    badgeClass: 'bg-amber-600 text-white',
  },
};

export {
  ROADS_AND_BOATS_RULES,
  SETUP_RULES,
  TRANSPORTER_RULES,
  INFRASTRUCTURE_RULES,
  BREEDING_RULES,
  RESEARCH_RULES,
  BUILDING_RULES,
  WONDER_TIER_RULES,
  GOOD_VICTORY_POINTS,
} from './rules-engine';

import {
  BUILDING_RULES,
  GOOD_VICTORY_POINTS,
  RESEARCH_RULES,
  TRANSPORTER_RULES,
  WONDER_TIER_RULES,
  BuildingRuleSpec,
  ResearchTechRuleSpec,
  TransporterRuleSpec,
} from './rules-engine';

export type TransporterSpec = TransporterRuleSpec;
export type BuildingSpec = BuildingRuleSpec;
export type TechUpgradeSpec = ResearchTechRuleSpec;

export const TRANSPORTER_SPECS: Record<TransporterType, TransporterRuleSpec> = TRANSPORTER_RULES;
export const BUILDING_SPECS: Record<BuildingType, BuildingRuleSpec> = BUILDING_RULES;
export const TECH_UPGRADES: Record<string, ResearchTechRuleSpec> = RESEARCH_RULES.technologies;

export const GOOD_DETAILS: Record<
  GoodType,
  {
    name: string;
    points: number;
    color: string;
    bgClass: string;
    borderClass: string;
    icon: string;
  }
> = {
  wood: { name: 'Trunk / Wood', points: GOOD_VICTORY_POINTS.wood, color: '#92400e', bgClass: 'bg-amber-900', borderClass: 'border-amber-700', icon: '🪵' },
  clay: { name: 'Clay', points: GOOD_VICTORY_POINTS.clay, color: '#c2410c', bgClass: 'bg-orange-800', borderClass: 'border-orange-600', icon: '🏺' },
  stone: { name: 'Stone', points: GOOD_VICTORY_POINTS.stone, color: '#475569', bgClass: 'bg-slate-700', borderClass: 'border-slate-500', icon: '🪨' },
  iron: { name: 'Iron', points: GOOD_VICTORY_POINTS.iron, color: '#334155', bgClass: 'bg-slate-800', borderClass: 'border-slate-600', icon: '⚙️' },
  gold: { name: 'Gold', points: GOOD_VICTORY_POINTS.gold, color: '#eab308', bgClass: 'bg-yellow-500', borderClass: 'border-yellow-400', icon: '✨' },
  boards: { name: 'Boards', points: GOOD_VICTORY_POINTS.boards, color: '#b45309', bgClass: 'bg-amber-700', borderClass: 'border-amber-500', icon: '🪵' },
  bricks: { name: 'Bricks', points: GOOD_VICTORY_POINTS.bricks, color: '#dc2626', bgClass: 'bg-red-700', borderClass: 'border-red-500', icon: '🧱' },
  paper: { name: 'Paper', points: GOOD_VICTORY_POINTS.paper, color: '#e2e8f0', bgClass: 'bg-slate-200 text-slate-900', borderClass: 'border-slate-400', icon: '📜' },
  fuel: { name: 'Fuel', points: GOOD_VICTORY_POINTS.fuel, color: '#18181b', bgClass: 'bg-zinc-900', borderClass: 'border-zinc-700', icon: '⛽' },
  coin: { name: 'Coin', points: GOOD_VICTORY_POINTS.coin, color: '#f59e0b', bgClass: 'bg-amber-500', borderClass: 'border-amber-300', icon: '🪙' },
  stock: { name: 'Stock Certificate', points: GOOD_VICTORY_POINTS.stock, color: '#10b981', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400', icon: '📈' },
  goose: { name: 'Goose', points: GOOD_VICTORY_POINTS.goose, color: '#f8fafc', bgClass: 'bg-slate-100 text-slate-900', borderClass: 'border-slate-300', icon: '🪿' },
};

export const INITIAL_WONDER_TIERS: WonderTier[] = WONDER_TIER_RULES.map(tier => ({
  tierIndex: tier.tierIndex,
  name: tier.name,
  pointsPerBrick: tier.pointsPerBrick,
  totalSlots: tier.totalSlots,
  bricks: [],
}));

export const PLAYER_COLORS = [
  { name: 'Azure', hex: '#3b82f6', border: '#1d4ed8', bg: 'bg-blue-600', text: 'text-blue-400' },
  { name: 'Crimson', hex: '#ef4444', border: '#b91c1c', bg: 'bg-red-600', text: 'text-red-400' },
  { name: 'Emerald', hex: '#10b981', border: '#047857', bg: 'bg-emerald-600', text: 'text-emerald-400' },
  { name: 'Amber', hex: '#f59e0b', border: '#b45309', bg: 'bg-amber-600', text: 'text-amber-400' },
];
