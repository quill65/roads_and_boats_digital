/**
 * Cargo Management Modal: Pick Up and Drop Goods between Transporters and Hex Ground
 */

import React, { useState } from 'react';
import { GameState, GoodType, Transporter } from '../game/types';
import { BUILDING_SPECS, GOOD_DETAILS, TRANSPORTER_SPECS } from '../game/constants';
import {
  canDropGoods,
  canPickupGoods,
  getAccessibleSidesOnHex,
  getBuildingSide,
  getGoodsOnSide,
  getHexSideLayout,
  getInteractableSidesForTransporter,
  getTransporterCargoWeight,
  getTransporterSide,
} from '../game/engine';

interface TransporterCargoModalProps {
  gameState: GameState;
  transporter: Transporter;
  onClose: () => void;
  onPickup: (transporterId: string, good: GoodType, amount: number, targetSide?: number) => void;
  onDrop: (transporterId: string, good: GoodType, amount: number, targetSide?: number) => void;
}

export const TransporterCargoModal: React.FC<TransporterCargoModalProps> = ({
  gameState,
  transporter,
  onClose,
  onPickup,
  onDrop,
}) => {
  const hex = gameState.hexes[transporter.hexId];
  const spec = TRANSPORTER_SPECS[transporter.type];
  const currentWeight = getTransporterCargoWeight(transporter);
  const remainingCap = transporter.capacity - currentWeight;

  const layout = hex ? getHexSideLayout(gameState, hex.id) : null;
  const tSide = getTransporterSide(gameState, transporter);
  const interactableSides = hex
    ? spec.waterOnly
      ? getInteractableSidesForTransporter(gameState, transporter)
      : Array.from(getAccessibleSidesOnHex(gameState, hex.id, tSide))
    : [0];

  const [selectedSide, setSelectedSide] = useState<number>(tSide);
  const activeSide = interactableSides.includes(selectedSide)
    ? selectedSide
    : interactableSides[0] ?? 0;

  const activeRegion = layout?.sides[activeSide];
  const buildingSide = hex?.building ? getBuildingSide(gameState, hex) : null;
  const buildingRegion =
    hex?.building && buildingSide !== null && layout ? layout.sides[buildingSide] : null;
  const buildingOnAccessibleSide =
    buildingSide !== null ? interactableSides.includes(buildingSide) : false;

  const groundGoods = hex
    ? (Object.entries(getGoodsOnSide(gameState, hex.id, activeSide)).filter(
        ([_, qty]) => (qty || 0) > 0
      ) as [GoodType, number][])
    : [];

  const inaccessibleSidesWithGoods =
    hex && layout?.isSplit
      ? layout.sides
          .filter(r => !interactableSides.includes(r.side))
          .map(r => ({
            region: r,
            goods: Object.entries(getGoodsOnSide(gameState, hex.id, r.side)).filter(
              ([_, q]) => (q || 0) > 0
            ) as [GoodType, number][],
          }))
          .filter(x => x.goods.length > 0)
      : [];

  const cargoGoods = Object.entries(transporter.cargo).filter(
    ([_, qty]) => (qty || 0) > 0
  ) as [GoodType, number][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">{spec.icon}</span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span className="truncate">{spec.name} Cargo Manifest</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal shrink-0">
                  Hex ({transporter.hexId})
                  {layout?.isSplit && activeRegion ? ` · ${activeRegion.compassLabel}` : ''}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Load or unload items. Goods left on the ground are neutral!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Cargo Manifest"
            className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Capacity Bar & Split-River Bank Controls */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-slate-300">Carrying:</span>
              <span className="text-sm font-bold text-amber-400 font-mono-numbers whitespace-nowrap">
                {currentWeight} / {transporter.capacity} capacity
                {(transporter.cargo.goose || 0) > 0 && (
                  <span className="ml-1.5 text-xs text-slate-200 font-normal">
                    (+{transporter.cargo.goose} 🪿 free)
                  </span>
                )}
              </span>
            </div>
            {gameState.phase !== 'MOVEMENT' && (
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/70 border border-amber-700/60 px-2.5 py-0.5 rounded-md">
                Cargo loading/dropping is allowed only during the Movement Phase
              </span>
            )}
            <div className="w-24 sm:w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-300 ${
                  currentWeight >= transporter.capacity ? 'bg-red-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min((currentWeight / transporter.capacity) * 100, 100)}%` }}
              />
            </div>
          </div>

          {layout?.isSplit && interactableSides.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-1">
                Target Bank:
              </span>
              {interactableSides.map(s => {
                const reg = layout.sides[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSide(s)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                      activeSide === s
                        ? 'bg-sky-400 text-slate-950 border-sky-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {reg?.compassLabel || `Side ${s + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {hex?.building && layout?.isSplit && (
            <p
              className={`text-[11px] leading-snug ${
                buildingOnAccessibleSide ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {buildingOnAccessibleSide
                ? `${BUILDING_SPECS[hex.building.type].icon} ${BUILDING_SPECS[hex.building.type].name} is on this side (${buildingRegion?.compassLabel}) — dropped or loaded inputs feed it.`
                : `⚠️ ${BUILDING_SPECS[hex.building.type].icon} ${BUILDING_SPECS[hex.building.type].name} is across the unbridged river (${buildingRegion?.compassLabel}) — cannot feed inputs or collect outputs from here.`}
            </p>
          )}
        </div>

        {/* 2-Column Split: Ground (Hex Side) vs Transporter Cargo */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto">
          {/* Ground Goods */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                {layout?.isSplit && activeRegion
                  ? `${activeRegion.compassLabel} (${transporter.hexId})`
                  : `Ground on Hex (${transporter.hexId})`}
              </span>
              <span className="text-xs text-slate-500">Accessible Bank</span>
            </div>

            {groundGoods.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 italic">
                No items on the ground on this bank.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {groundGoods.map(([good, qty]) => {
                  const item = GOOD_DETAILS[good];
                  const pickCheck = canPickupGoods(
                    gameState,
                    transporter.id,
                    good,
                    1,
                    undefined,
                    layout?.isSplit ? activeSide : undefined
                  );
                  const canPick = pickCheck.valid;
                  return (
                    <div
                      key={`ground_${good}`}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {good === 'goose' && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/60">
                                0 capacity
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-mono-numbers">{qty} available</p>
                        </div>
                      </div>
                      <button
                        disabled={!canPick}
                        title={pickCheck.reason}
                        onClick={() =>
                          onPickup(
                            transporter.id,
                            good,
                            1,
                            layout?.isSplit ? activeSide : undefined
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          canPick
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        + Load (1)
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {inaccessibleSidesWithGoods.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                  Across Unbridged River (Locked):
                </span>
                {inaccessibleSidesWithGoods.map(({ region, goods }) => (
                  <div
                    key={region.side}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1"
                  >
                    <span className="font-semibold text-slate-300">{region.compassLabel}:</span>
                    <span className="font-mono-numbers">
                      {goods
                        .map(([g, q]) => `${GOOD_DETAILS[g]?.icon || ''}${q} ${g}`)
                        .join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transporter Cargo */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Inside {spec.name}
              </span>
              <span className="text-xs text-slate-500 font-mono-numbers">
                {remainingCap} slots free
              </span>
            </div>

            {cargoGoods.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 italic">
                Transporter is empty.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {cargoGoods.map(([good, qty]) => {
                  const item = GOOD_DETAILS[good];
                  const dropCheck = canDropGoods(
                    gameState,
                    transporter.id,
                    good,
                    1,
                    undefined,
                    layout?.isSplit ? activeSide : undefined
                  );
                  const canDrop = dropCheck.valid;
                  return (
                    <div
                      key={`cargo_${good}`}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {good === 'goose' && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/60">
                                0 capacity
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-mono-numbers">{qty} loaded</p>
                        </div>
                      </div>
                      <button
                        disabled={!canDrop}
                        title={dropCheck.reason}
                        onClick={() =>
                          onDrop(
                            transporter.id,
                            good,
                            1,
                            layout?.isSplit ? activeSide : undefined
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          canDrop
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        - Drop (1)
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
