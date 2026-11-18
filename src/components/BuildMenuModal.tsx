/**
 * Construction & Factory Erecting Modal for the Building Phase
 */

import React, { useState } from 'react';
import { BuildingType, GameState, GoodType, Transporter } from '../game/types';
import { BUILDING_SPECS, GOOD_DETAILS, TECH_UPGRADES, TRANSPORTER_SPECS } from '../game/constants';
import {
  canBuildFactory,
  canReplenishMine,
  canResearchTech,
  getAccessibleSiteMaterials,
  getHexSideLayout,
  getTransporterSide,
  isHexDividedByUnbridgedRiver,
} from '../game/engine';

interface BuildMenuModalProps {
  gameState: GameState;
  activePlayerId: string;
  selectedTransporter: Transporter;
  onClose: () => void;
  onSelectTransporter?: (transporterId: string) => void;
  onBuildFactory: (hexId: string, buildingType: BuildingType, transporterId: string) => void;
  onSelectRoadMode: () => void;
  onResearchTech?: (hexId: string, techId: string, transporterId: string) => void;
  onReplenishMine?: (hexId: string, transporterId: string) => void;
}

export const BuildMenuModal: React.FC<BuildMenuModalProps> = ({
  gameState,
  activePlayerId,
  selectedTransporter,
  onClose,
  onSelectTransporter,
  onBuildFactory,
  onSelectRoadMode,
  onResearchTech,
  onReplenishMine,
}) => {
  const hex = gameState.hexes[selectedTransporter.hexId];
  const [activeCategory, setActiveCategory] = useState<'factories' | 'infrastructure' | 'research'>('factories');

  if (!hex) return null;

  const player = gameState.players.find(p => p.id === activePlayerId);
  const layout = getHexSideLayout(gameState, hex.id);
  const builderSide = getTransporterSide(gameState, selectedTransporter);
  const builderBank = layout.sides[builderSide];
  const isUnbridgedSplit = isHexDividedByUnbridgedRiver(gameState, hex.id);

  const ownedOnHex = Object.values(gameState.transporters).filter(
    t => t.ownerId === activePlayerId && t.hexId === hex.id
  );

  const availableFactories = Object.entries(BUILDING_SPECS).filter(
    ([type]) => type !== 'wonder'
  ) as [BuildingType, typeof BUILDING_SPECS[BuildingType]][];

  const boardsMat = getAccessibleSiteMaterials(
    gameState,
    activePlayerId,
    hex.id,
    'boards',
    selectedTransporter.id
  );
  const stoneMat = getAccessibleSiteMaterials(
    gameState,
    activePlayerId,
    hex.id,
    'stone',
    selectedTransporter.id
  );
  const geeseMat = getAccessibleSiteMaterials(
    gameState,
    activePlayerId,
    hex.id,
    'goose',
    selectedTransporter.id
  );
  const paperMat = getAccessibleSiteMaterials(
    gameState,
    activePlayerId,
    hex.id,
    'paper',
    selectedTransporter.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-2xl shrink-0">🏗️</span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-2">
                <span>Construction Site: Hex ({hex.id})</span>
                {layout.isSplit && builderBank && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-700/70 text-sky-300">
                    {builderBank.compassLabel}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 capitalize truncate">
                Terrain: {hex.terrain} · Builder: {TRANSPORTER_SPECS[selectedTransporter.type].name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Construction Menu"
            className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Unbridged River Notice & Multi-Transporter Selector */}
        {(isUnbridgedSplit || (ownedOnHex.length > 1 && onSelectTransporter)) && (
          <div className="px-4 sm:px-6 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2 shrink-0">
            {isUnbridgedSplit && builderBank && (
              <p className="text-[11px] text-amber-300 leading-snug">
                🌊 River divides this tile without a bridge — building on the{' '}
                <strong className="text-white">{builderBank.compassLabel}</strong>. Only transporters and goods on this side can be used.
              </p>
            )}
            {ownedOnHex.length > 1 && onSelectTransporter && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-1">
                  Builder on tile:
                </span>
                {ownedOnHex.map(t => {
                  const tSide = getTransporterSide(gameState, t);
                  const tBank = layout.sides[tSide];
                  const isCur = t.id === selectedTransporter.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTransporter(t.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        isCur
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {TRANSPORTER_SPECS[t.type].icon} {TRANSPORTER_SPECS[t.type].name}
                      {layout.isSplit && tBank ? ` (${tBank.compassLabel})` : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 pt-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveCategory('factories')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap shrink-0 ${
              activeCategory === 'factories'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Factories & Workshops
          </button>
          <button
            onClick={() => setActiveCategory('infrastructure')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap shrink-0 ${
              activeCategory === 'infrastructure'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Roads & Bridges
          </button>
          <button
            onClick={() => setActiveCategory('research')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap shrink-0 ${
              activeCategory === 'research'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Research (2 Geese + 1 Paper)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto">
          {activeCategory === 'infrastructure' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0">🛣️</span>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white">Pave Roads & Bridges</h4>
                      <p className="text-xs text-slate-400">
                        Roads double donkey speed to 2 and enable Wagons. Bridges cross rivers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectRoadMode();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow whitespace-nowrap"
                  >
                    Select Border on Board
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/80">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <p className="font-semibold text-slate-200">Land Road Cost</p>
                    <p className="text-slate-400 mt-1">1 Stone strictly (Boards cannot build roads)</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <p className="font-semibold text-slate-200">River Bridge Cost</p>
                    <p className="text-slate-400 mt-1">2 Boards strictly across river edge (Stone cannot build bridges)</p>
                  </div>
                </div>
              </div>

              {/* Site Materials status (strictly scoped to accessible bank side) */}
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-300">
                  Accessible Materials{layout.isSplit && builderBank ? ` (${builderBank.compassLabel})` : ''}:
                </span>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className={`font-mono-numbers ${boardsMat.totalAvailable > 0 ? 'text-amber-300 font-bold' : 'text-slate-500'}`}>
                    🪵 {boardsMat.totalAvailable} Boards (Carried: {boardsMat.carriedByBuilder + boardsMat.onOtherTransporters}, Bank Ground: {boardsMat.onGround})
                  </span>
                  <span className={`font-mono-numbers ${stoneMat.totalAvailable > 0 ? 'text-amber-300 font-bold' : 'text-slate-500'}`}>
                    🪨 {stoneMat.totalAvailable} Stone (Carried: {stoneMat.carriedByBuilder + stoneMat.onOtherTransporters}, Bank Ground: {stoneMat.onGround})
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'factories' && (
            <div className="space-y-3">
              {hex.building?.type === 'mine' && hex.building.ownerId === activePlayerId && (() => {
                const replenishCheck = canReplenishMine(gameState, activePlayerId, hex.id);
                const poolGold = hex.building.minePool?.gold || 0;
                const poolIron = hex.building.minePool?.iron || 0;
                return (
                  <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-700/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-sky-200 flex items-center gap-2">
                        <span>🪜</span>
                        <span>Mine Shaft Management ({poolGold}G / {poolIron}I left)</span>
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {replenishCheck.valid
                          ? 'Mine depleted! Sink New Mine Shaft to restore ore pool.'
                          : replenishCheck.reason}
                      </p>
                    </div>
                    <button
                      disabled={!replenishCheck.valid || !onReplenishMine}
                      onClick={() => {
                        onReplenishMine?.(hex.id, selectedTransporter.id);
                        onClose();
                      }}
                      className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                        replenishCheck.valid && onReplenishMine
                          ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Sink New Mine Shaft
                    </button>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableFactories.map(([bType, spec]) => {
                  const check = canBuildFactory(
                    gameState,
                    activePlayerId,
                    hex.id,
                    bType,
                    selectedTransporter.id
                  );

                  return (
                    <div
                      key={bType}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        check.valid
                          ? 'bg-slate-800/80 border-slate-700 hover:border-amber-400/60'
                          : 'bg-slate-950/40 border-slate-800/60 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{spec.icon}</span>
                            <span className="font-bold text-white text-sm">{spec.name}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                            {spec.category}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2">{spec.description}</p>

                        {/* Cost Chips (accessible side only) */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(spec.cost).map(([mat, qty]) => {
                            const item = GOOD_DETAILS[mat as GoodType];
                            const matAccess = getAccessibleSiteMaterials(
                              gameState,
                              activePlayerId,
                              hex.id,
                              mat as GoodType,
                              selectedTransporter.id
                            );
                            const hasEnough = matAccess.totalAvailable >= (qty || 0);
                            return (
                              <span
                                key={mat}
                                className={`text-[11px] px-2 py-0.5 rounded font-mono-numbers ${
                                  hasEnough
                                    ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                                    : 'bg-red-950/80 border border-red-800 text-red-300'
                                }`}
                                title={`Carried: ${matAccess.carriedByBuilder}, Ground (side): ${matAccess.onGround}, Other Transporters (side): ${matAccess.onOtherTransporters}`}
                              >
                                {item?.icon || '📦'} {qty} {mat} (Have: {matAccess.totalAvailable})
                              </span>
                            );
                          })}
                        </div>

                        {/* Terrain check note */}
                        {spec.allowedTerrain && (
                          <p className="text-[10px] text-slate-500">
                            Allowed: {spec.allowedTerrain.join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
                        {!check.valid ? (
                          <span className="text-[11px] text-red-400 leading-snug flex-1" title={check.reason}>
                            {check.reason}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400">Ready to build</span>
                        )}

                        <button
                          disabled={!check.valid}
                          onClick={() => {
                            onBuildFactory(hex.id, bType, selectedTransporter.id);
                            onClose();
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                            check.valid
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 shadow'
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          Build
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeCategory === 'research' && (
            /* Academic Research Tab */
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-sky-800/60 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧪</span>
                  <div>
                    <h4 className="text-base font-bold text-white">Technological Research</h4>
                    <p className="text-xs text-slate-300">
                      Official Splotter Rule: Research consumes exactly <strong className="text-amber-300">2 Geese + 1 Paper</strong> on your accessible side of this hex.
                    </p>
                  </div>
                </div>

                {/* Site inventory for Geese and Paper */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">
                    Research Materials on Accessible Side{layout.isSplit && builderBank ? ` (${builderBank.compassLabel})` : ''}:
                  </span>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className={`font-mono ${geeseMat.totalAvailable >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                      🪿 {geeseMat.totalAvailable} / 2 Geese
                    </span>
                    <span className={`font-mono ${paperMat.totalAvailable >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                      📜 {paperMat.totalAvailable} / 1 Paper
                    </span>
                  </div>
                </div>
              </div>

              {/* Technologies List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(TECH_UPGRADES).map(tech => {
                  const isUnlocked = player?.unlockedTechs?.includes(tech.id);
                  const check = canResearchTech(gameState, activePlayerId, hex.id, tech.id, selectedTransporter.id);

                  return (
                    <div
                      key={tech.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        isUnlocked
                          ? 'bg-emerald-950/30 border-emerald-800/60'
                          : check.valid
                          ? 'bg-slate-800/80 border-sky-500/60 hover:border-sky-400'
                          : 'bg-slate-950/40 border-slate-800/60 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{tech.icon}</span>
                            <span className="font-bold text-white text-sm">{tech.name}</span>
                          </div>
                          {isUnlocked ? (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                              Researched
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-sky-800/60">
                              2 Geese + 1 Paper
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300">{tech.description}</p>
                        <p className="text-[11px] text-amber-300 font-medium">✨ {tech.benefit}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
                        {isUnlocked ? (
                          <span className="text-[11px] text-emerald-400 font-semibold">Active Breakthrough</span>
                        ) : !check.valid ? (
                          <span className="text-[11px] text-red-400 leading-snug flex-1" title={check.reason}>
                            {check.reason}
                          </span>
                        ) : (
                          <span className="text-[11px] text-sky-400 font-semibold">Ready to Discover</span>
                        )}

                        {!isUnlocked && (
                          <button
                            disabled={!check.valid}
                            onClick={() => {
                              onResearchTech?.(hex.id, tech.id, selectedTransporter.id);
                              onClose();
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                              check.valid
                                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            Research
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
