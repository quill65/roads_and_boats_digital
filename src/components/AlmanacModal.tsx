/**
 * Roads & Boats Almanac & Comprehensive Rulebook Modal
 */

import React, { useState } from 'react';
import { BUILDING_SPECS, GOOD_DETAILS, TRANSPORTER_SPECS } from '../game/constants';

interface AlmanacModalProps {
  onClose: () => void;
}

export const AlmanacModal: React.FC<AlmanacModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'rules' | 'transporters' | 'buildings' | 'scoring'>('rules');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-2xl shrink-0">📖</span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-serif-title text-amber-200 truncate">
                Roads & Boats Almanac & Rulebook
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Official Splotter Spellen Logistics Guide & Reference Manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Almanac"
            className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 pt-2 overflow-x-auto no-scrollbar shrink-0">
          {(['rules', 'transporters', 'buildings', 'scoring'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 px-3 sm:px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 capitalize whitespace-nowrap shrink-0 ${
                tab === t
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'rules'
                ? 'Core Rules'
                : t === 'transporters'
                ? 'Fleet & Craft'
                : t === 'buildings'
                ? 'Factories & Mines'
                : 'Scoring & Goods'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4">
          {tab === 'rules' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-amber-300">1. The Neutral Goods Invariant</h4>
                <p>
                  In Roads & Boats, <strong className="text-white">goods lying on the ground belong to NOBODY</strong>. Any player whose transporter moves onto a tile may load open goods. To safeguard your inventory, keep goods inside your own transporters or behind secure road networks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-amber-300">2. Rivers, Bridges & Waterways</h4>
                <p>
                  Natural rivers run along hex borders. Bridged river borders allow wheeled Wagons & Steam Trucks to cross cleanly. Pave a Bridge strictly with <strong className="text-white">1 Stone</strong> across a river border (Boards cannot build bridges). Watercraft (Rafts, Rowboats, Steamers) travel along river borders and open sea tiles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-amber-300">3. Roads & Movement</h4>
                <p>
                  Paving a Land Road strictly costs <strong className="text-white">1 Stone</strong> (Boards cannot build land roads). Donkeys move either <strong className="text-white">1 hex off-road OR 2 hexes strictly on paved Roads/Bridges</strong> per round. Wagons and Steam Trucks are strictly Road-Only.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-amber-300">4. Round Structure</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li><strong className="text-white">Production:</strong> Primary extractors harvest timber/clay/stone/ore (Mines draw 1 ore counter per turn from a finite bag); secondary factories convert raw goods; two donkeys alone on empty pasture reproduce naturally; conduct Research (2 Geese + 1 Paper with a transporter present on the tile) and apply legal factory/mine upgrades — unattended Geese &amp; Paper are removed from the game.</li>
                  <li><strong className="text-white">Movement:</strong> Command your donkeys, wagons, and watercraft. Pick up and drop goods at your location (Movement Phase only).</li>
                  <li><strong className="text-white">Building:</strong> Construct roads (1 Stone), bridges (1 Stone), and factories.</li>
                  <li><strong className="text-white">Wonder:</strong> Spend any goods on your home (starting) tile to place Wonder bricks (1 good first brick, escalating per brick in a round & after brick #17). If no player lays a brick, a Neutral brick is placed!</li>
                </ol>
              </div>
            </div>
          )}

          {tab === 'transporters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(TRANSPORTER_SPECS).map(([type, spec]) => (
                <div key={type} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{spec.icon}</span>
                      <h4 className="text-sm font-bold text-white">{spec.name}</h4>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-400">
                      Cap: {spec.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{spec.description}</p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
                    <span>Base Speed: {spec.baseSpeed}</span>
                    <span>Road Speed: {spec.roadSpeed}</span>
                    <span>{spec.waterOnly ? 'Water Only' : spec.roadOnly ? 'Roads Only' : 'All-Terrain'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'buildings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(BUILDING_SPECS).map(([type, spec]) => (
                <div key={type} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{spec.icon}</span>
                      <h4 className="text-sm font-bold text-white">{spec.name}</h4>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-slate-500">{spec.category}</span>
                  </div>
                  <p className="text-xs text-slate-400">{spec.description}</p>
                  <div className="text-[11px] text-amber-300 font-mono-numbers">
                    Output: {spec.production.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'scoring' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(GOOD_DETAILS).map(([type, item]) => (
                  <div key={type} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-medium text-white">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-amber-400">
                      {item.points} VP
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200/90 space-y-2">
                <h4 className="text-sm font-bold text-amber-300">Wonder Victory Points (10 VP per Row)</h4>
                <p>
                  The Wonder consists of 13 horizontal rows (capacities 4×4, 4×5, 3×6, 7, and 3 = 64 bricks total). Each row is worth <strong>10 VP total</strong>, divided proportionally among the non-neutral bricks placed in that row (rounded down). Placing Brick #45 irrigates all Desert hexes into Pasture!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            Close Almanac
          </button>
        </div>
      </div>
    </div>
  );
};
