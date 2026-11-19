/**
 * Production Phase Research & Legal Factory/Mine Upgrades Dialog
 * Shown automatically when a Production Phase begins and the player has
 * >= 2 Geese + 1 Paper on an accessible tile side with unresearched technologies remaining.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { GameState, ResearchUpgradeSelection } from '../game/types';
import { BUILDING_SPECS, TECH_UPGRADES, TERRAIN_INFO } from '../game/constants';
import {
  getEligibleResearchSites,
  getHexSideLayout,
  getLegalResearchUpgrades,
} from '../game/engine';

interface ProductionResearchModalProps {
  gameState: GameState;
  activePlayerId: string;
  onClose: () => void;
  onConductResearch: (
    hexId: string,
    techId: string,
    transporterId: string | undefined,
    upgrades: ResearchUpgradeSelection[]
  ) => Promise<boolean> | boolean | void;
}

export const ProductionResearchModal: React.FC<ProductionResearchModalProps> = ({
  gameState,
  activePlayerId,
  onClose,
  onConductResearch,
}) => {
  const player = gameState.players.find(p => p.id === activePlayerId);
  const unlockedSet = useMemo(
    () => new Set(player?.unlockedTechs || []),
    [player?.unlockedTechs]
  );

  const eligibleSites = useMemo(
    () => getEligibleResearchSites(gameState, activePlayerId),
    [gameState, activePlayerId]
  );

  const unresearchedTechs = useMemo(
    () => Object.values(TECH_UPGRADES).filter(t => !unlockedSet.has(t.id)),
    [unlockedSet]
  );

  const [selectedSiteIdx, setSelectedSiteIdx] = useState(0);
  const [selectedTechId, setSelectedTechId] = useState<string>(
    () => unresearchedTechs[0]?.id || ''
  );
  const [checkedUpgradeHexIds, setCheckedUpgradeHexIds] = useState<Set<string>>(new Set());
  const [mineSpecByHexId, setMineSpecByHexId] = useState<Record<string, 'gold' | 'iron'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep selected site index valid if sites shrink after completing a research
  useEffect(() => {
    if (selectedSiteIdx >= eligibleSites.length) {
      setSelectedSiteIdx(0);
    }
  }, [eligibleSites.length, selectedSiteIdx]);

  // Keep selectedTechId valid when unlocked technologies update
  useEffect(() => {
    if (!selectedTechId || unlockedSet.has(selectedTechId)) {
      setSelectedTechId(unresearchedTechs[0]?.id || '');
    }
  }, [selectedTechId, unlockedSet, unresearchedTechs]);

  const legalUpgrades = useMemo(() => {
    if (!selectedTechId) return [];
    return getLegalResearchUpgrades(gameState, activePlayerId, selectedTechId);
  }, [gameState, activePlayerId, selectedTechId]);

  // Default all legal upgrades for the newly selected technology to checked (with Gold default for mines)
  useEffect(() => {
    setCheckedUpgradeHexIds(new Set(legalUpgrades.map(u => u.hexId)));
    const defaults: Record<string, 'gold' | 'iron'> = {};
    legalUpgrades.forEach(u => {
      if (u.upgradeKind === 'specialize_mine') {
        defaults[u.hexId] = 'gold';
      }
    });
    setMineSpecByHexId(defaults);
  }, [selectedTechId, legalUpgrades.map(u => `${u.hexId}:${u.upgradeKind}`).join('|')]);

  const activeSite = eligibleSites[selectedSiteIdx] || eligibleSites[0] || null;
  const activeTech = selectedTechId ? TECH_UPGRADES[selectedTechId] : null;

  if (!activeSite || unresearchedTechs.length === 0) {
    return null;
  }

  const toggleUpgradeHex = (hexId: string) => {
    setCheckedUpgradeHexIds(prev => {
      const next = new Set(prev);
      if (next.has(hexId)) {
        next.delete(hexId);
      } else {
        next.add(hexId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!activeSite || !activeTech || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const chosenUpgrades: ResearchUpgradeSelection[] = legalUpgrades
        .filter(u => checkedUpgradeHexIds.has(u.hexId))
        .map(u => ({
          hexId: u.hexId,
          mineSpecialization:
            u.upgradeKind === 'specialize_mine' ? mineSpecByHexId[u.hexId] || 'gold' : undefined,
        }));

      await onConductResearch(
        activeSite.hexId,
        activeTech.id,
        activeSite.transporterId,
        chosenUpgrades
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUpgradeCount = legalUpgrades.filter(u => checkedUpgradeHexIds.has(u.hexId)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-sky-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-800/90 border-b border-slate-700/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-2xl shrink-0">🧪</span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                Production Phase Research
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Round {gameState.round} · Attended tile with 2 Geese + 1 Paper · Choose technology &amp; legal upgrades
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Research Dialog"
            className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Research Site Selector / Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Research Site (2 Geese + 1 Paper)
              </h4>
              <span className="text-[11px] font-mono text-emerald-400">
                🪿 {activeSite.totalGeese} Geese · 📜 {activeSite.totalPaper} Paper
              </span>
            </div>

            {eligibleSites.length === 1 ? (
              (() => {
                const hex = gameState.hexes[activeSite.hexId];
                const tInfo = hex ? TERRAIN_INFO[hex.terrain] : null;
                return (
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span>{tInfo?.icon || '🗺️'}</span>
                      <span>
                        {tInfo?.name || 'Tile'} ({activeSite.hexId})
                        {activeSite.compassLabel ? ` · ${activeSite.compassLabel}` : ''}
                      </span>
                    </span>
                    <span className="text-slate-400">Consumes 2 Geese &amp; 1 Paper here</span>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-wrap gap-2">
                {eligibleSites.map((site, idx) => {
                  const hex = gameState.hexes[site.hexId];
                  const tInfo = hex ? TERRAIN_INFO[hex.terrain] : null;
                  const isSel = idx === selectedSiteIdx;
                  return (
                    <button
                      key={`${site.hexId}_${site.side}`}
                      type="button"
                      onClick={() => setSelectedSiteIdx(idx)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-sky-950/70 border-sky-400 text-white shadow'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span>{tInfo?.icon || '🗺️'}</span>
                      <span>
                        ({site.hexId})
                        {site.compassLabel ? ` · ${site.compassLabel}` : ''}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 ml-1">
                        🪿{site.totalGeese} 📜{site.totalPaper}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Choose Technology */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Choose Research Technology
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(TECH_UPGRADES).map(tech => {
                const isUnlocked = unlockedSet.has(tech.id);
                const isSelected = selectedTechId === tech.id;
                const techUpgrades = isUnlocked
                  ? []
                  : getLegalResearchUpgrades(gameState, activePlayerId, tech.id);

                return (
                  <button
                    key={tech.id}
                    type="button"
                    disabled={isUnlocked}
                    onClick={() => setSelectedTechId(tech.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isUnlocked
                        ? 'bg-emerald-950/20 border-emerald-900/50 opacity-55 cursor-not-allowed'
                        : isSelected
                        ? 'bg-sky-950/60 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{tech.icon}</span>
                        <span className="font-bold text-white text-xs sm:text-sm leading-snug">
                          {tech.name}
                        </span>
                      </div>
                      {isUnlocked ? (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700 shrink-0">
                          Researched
                        </span>
                      ) : techUpgrades.length > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600/70 shrink-0 whitespace-nowrap">
                          {techUpgrades.length} upgrade{techUpgrades.length === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{tech.benefit}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Choose Legal Factory / Mine Upgrades on Map */}
          {activeTech && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  3. Legal Upgrades on Your Map ({activeTech.name})
                </h4>
                {legalUpgrades.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedUpgradeCount} / {legalUpgrades.length} selected
                  </span>
                )}
              </div>

              {legalUpgrades.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                  No existing factories or mines on your map qualify for an immediate upgrade with{' '}
                  <strong className="text-slate-200">{activeTech.name}</strong>. Researching it will
                  still unlock it for future construction and production.
                </div>
              ) : (
                <div className="space-y-2">
                  {legalUpgrades.map(upg => {
                    const checked = checkedUpgradeHexIds.has(upg.hexId);
                    const hex = gameState.hexes[upg.hexId];
                    const bSpec = BUILDING_SPECS[upg.currentType];
                    const targetSpec = BUILDING_SPECS[upg.targetType];
                    const layout = hex ? getHexSideLayout(gameState, hex.id) : null;
                    const sideLabel =
                      hex?.building && layout?.isSplit && hex.building.side !== undefined
                        ? layout.sides[hex.building.side]?.compassLabel
                        : null;
                    const mineChoice = mineSpecByHexId[upg.hexId] || 'gold';

                    return (
                      <div
                        key={upg.buildingId}
                        className={`p-3 rounded-xl border transition-all ${
                          checked
                            ? 'bg-amber-950/25 border-amber-500/60'
                            : 'bg-slate-950/60 border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUpgradeHex(upg.hexId)}
                            className="mt-1 h-4 w-4 accent-amber-400 rounded cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                                <span>{bSpec?.icon || '🏭'}</span>
                                <span>{upg.currentName}</span>
                                <span className="text-amber-400">→</span>
                                <span>{targetSpec?.icon || '⬆️'}</span>
                                <span className="text-amber-300">{upg.targetName}</span>
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                Hex ({upg.hexId}
                                {sideLabel ? ` · ${sideLabel}` : ''})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300">{upg.description}</p>

                            {upg.upgradeKind === 'specialize_mine' && checked && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-[11px] text-slate-400">Ore Focus:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMineSpecByHexId(prev => ({ ...prev, [upg.hexId]: 'gold' }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                    mineChoice === 'gold'
                                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                                  }`}
                                >
                                  ✨ 4 Gold
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMineSpecByHexId(prev => ({ ...prev, [upg.hexId]: 'iron' }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                    mineChoice === 'iron'
                                      ? 'bg-sky-400 text-slate-950 border-sky-300'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                                  }`}
                                >
                                  ⚙️ 4 Iron
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            Skip / Done
          </button>
          <button
            type="button"
            disabled={!activeTech || isSubmitting}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-extrabold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-colors shadow"
          >
            {isSubmitting
              ? 'Researching...'
              : selectedUpgradeCount > 0
              ? `Research & Apply ${selectedUpgradeCount} Upgrade${selectedUpgradeCount === 1 ? '' : 's'}`
              : 'Conduct Research (2 Geese + 1 Paper)'}
          </button>
        </div>
      </div>
    </div>
  );
};
