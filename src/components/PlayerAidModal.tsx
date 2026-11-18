/**
 * Roads & Boats - Official Player Aid & Reference Matrix
 * Replicates the authentic physical game reference card from Splotter Spellen:
 * Complete Building & Production Matrix, Vehicles Specifications,
 * Goods Transformation Tech Tree, Turn Phase Flow, and Scoring Guide.
 */

import React, { useState } from 'react';
import { BUILDING_SPECS, GOOD_DETAILS, TRANSPORTER_SPECS } from '../game/constants';
import { BuildingType, GoodType, TransporterType } from '../game/types';

interface PlayerAidModalProps {
  onClose: () => void;
}

export const PlayerAidModal: React.FC<PlayerAidModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'buildings' | 'vehicles' | 'techtree' | 'phases' | 'scoring'>('buildings');
  const [filterCategory, setFilterCategory] = useState<'all' | 'primary' | 'secondary' | 'transporter'>('all');

  const buildingList = Object.entries(BUILDING_SPECS).filter(([type, spec]) => {
    if (type === 'wonder') return false;
    if (filterCategory === 'all') return true;
    return spec.category === filterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-5xl bg-slate-950 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-b border-amber-800/50 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">📋</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif-title text-amber-200 tracking-wide truncate">
                  Roads & Boats · Official Player Aid
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                  Reference Card
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Splotter Spellen Production Matrix, Fleet Specifications & Logistics Tech Tree
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Player Aid"
            className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
            title="Close Player Aid"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-slate-900/60 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('buildings')}
            className={`pb-2.5 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'buildings'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏗️</span>
            <span>Buildings & Factories</span>
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`pb-2.5 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vehicles'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🚚</span>
            <span>Vehicles & Fleet</span>
          </button>

          <button
            onClick={() => setActiveTab('techtree')}
            className={`pb-2.5 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'techtree'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔄</span>
            <span>Logistics Tech Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('phases')}
            className={`pb-2.5 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'phases'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⏳</span>
            <span>Turn Phases & Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            className={`pb-2.5 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'scoring'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏆</span>
            <span>Scoring & Goods Values</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-200">
          {/* TAB 1: BUILDINGS & FACTORIES */}
          {activeTab === 'buildings' && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar max-w-full">
                  {(['all', 'primary', 'secondary', 'transporter'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0 ${
                        filterCategory === cat
                          ? 'bg-amber-400 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'all'
                        ? 'All Structures'
                        : cat === 'primary'
                        ? 'Primary Extractors'
                        : cat === 'secondary'
                        ? 'Secondary Refineries'
                        : 'Transport Workshops'}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  Showing {buildingList.length} structures
                </span>
              </div>

              {/* Table / Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {buildingList.map(([typeKey, spec]) => {
                  const costEntries = Object.entries(spec.cost);
                  const inputEntries = Object.entries(spec.production.inputs);
                  const outputEntries = Object.entries(spec.production.outputs);

                  return (
                    <div
                      key={typeKey}
                      className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors shadow"
                    >
                      {/* Title & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{spec.icon}</span>
                          <div>
                            <h4 className="text-sm font-bold text-white font-serif-title">{spec.name}</h4>
                            <span className="text-[10px] uppercase font-mono text-slate-400">
                              {spec.category === 'primary'
                                ? 'Primary Extractor'
                                : spec.category === 'secondary'
                                ? 'Secondary Processor'
                                : 'Transport Workshop'}
                            </span>
                          </div>
                        </div>

                        {/* Allowed Terrain Badge */}
                        <div className="text-right">
                          {spec.allowedTerrain ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-amber-300 border border-slate-700">
                              {spec.allowedTerrain.join(' / ')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                              Any Land
                            </span>
                          )}
                          {spec.requiresAdjacentWater && (
                            <p className="text-[9px] text-sky-400 mt-0.5 font-medium">Adjacent River/Water</p>
                          )}
                        </div>
                      </div>

                      {/* Construction Cost */}
                      <div className="flex items-center gap-2 text-[11px] bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                        <span className="font-semibold text-slate-400 shrink-0">Build Cost:</span>
                        <div className="flex items-center gap-2">
                          {costEntries.length > 0 ? (
                            costEntries.map(([g, q]) => (
                              <span key={g} className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-200 font-mono font-bold">
                                {q} {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">Free / Special</span>
                          )}
                        </div>
                      </div>

                      {/* Production Mechanism */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold text-slate-400">Production Cycle:</span>
                          <span className="text-amber-300 font-mono text-[10px]">
                            {inputEntries.length > 0
                              ? inputEntries.map(([g, q]) => `${q} ${g}`).join(' + ') + ' → '
                              : 'None → '}
                            {outputEntries.length > 0
                              ? outputEntries.map(([g, q]) => `${q} ${g}`).join(' + ')
                              : typeKey === 'wagonfactory'
                              ? '1 Wagon'
                              : typeKey === 'shipyard'
                              ? '1 Rowboat'
                              : 'Victory Points'}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-snug">{spec.production.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLES & TRANSPORTERS */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Transporters are your active workforce. Only goods placed inside a transporter are secure from rival theft under the Neutral Goods Law.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(TRANSPORTER_SPECS).map(([typeKey, spec]) => (
                  <div
                    key={typeKey}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{spec.icon}</span>
                        <div>
                          <h4 className="text-base font-bold text-white font-serif-title">{spec.name}</h4>
                          <span className="text-[10px] font-mono text-amber-300">
                            Capacity: {spec.capacity} items
                          </span>
                        </div>
                      </div>

                      {/* Speed Badges */}
                      <div className="flex flex-col items-end gap-1 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          Road: {spec.roadSpeed} hexes
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Off-road: {spec.baseSpeed} hex
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{spec.description}</p>

                    {/* Technical Specifications Matrix */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-center">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase block">Route Terrain</span>
                        <span className="text-slate-200 font-bold">
                          {spec.waterOnly ? 'Water/River' : spec.roadOnly ? 'Roads Only' : 'All-Terrain'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase block">River Crossing</span>
                        <span className="text-slate-200 font-bold">
                          {spec.waterOnly ? 'Navigable' : 'Bridge Req.'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase block">Build Fuel</span>
                        <span className={spec.requiresFuel ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {spec.requiresFuel ? 'Built w/ Fuel' : 'No Fuel Needed'}
                        </span>
                      </div>
                    </div>

                    {/* Build Requirements */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Construction / Breeding:</span>
                      <span className="font-semibold text-amber-300">
                        {typeKey === 'donkey'
                          ? '2 Donkeys alone on empty Pasture (Capacity permanently 2 goods)'
                          : typeKey === 'wagon'
                          ? '1 Donkey + 2 Boards at Wagon Factory'
                          : typeKey === 'truck'
                          ? '1 Fuel + 1 Iron at Truck Factory (Requires Trucking Research)'
                          : typeKey === 'raft'
                          ? '2 Trunks (Wood) at Raft Factory (Shore, Cap 3, Spd 3)'
                          : typeKey === 'rowboat'
                          ? '5 Boards at Rowboat Factory (Shore, Cap 5, Spd 4; Requires Rowing)'
                          : '2 Fuel + 1 Iron at Steamer Factory (Shore, Cap 8, Spd 6; Requires Shipping)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOGISTICS TECH TREE */}
          {activeTab === 'techtree' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Visual production flow replicating the physical 3rd Edition Roads & Boats tech tree. Starting inventory: 3 Donkeys, 5 Boards, 1 Stone, and 2 Geese on your home tile.
              </p>

              <div className="space-y-3">
                {/* 1. Timber & Construction Pipeline */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌲</span>
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                      The Lumber & Construction Pipeline
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="p-2 rounded-lg bg-slate-950 border border-emerald-900 text-emerald-200">
                      Forest Hex
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-white">
                      🪓 Woodcutter (1 Board)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-amber-900 text-amber-300 font-bold">
                      🪵 1 Trunk / Wood
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-white">
                      🪵 Sawmill (2 Boards, 1 Stone)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-200 font-bold">
                      🪵 2 Refined Boards
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Boards build all bridges (2 Boards), workshops, and boats. Land Roads strictly require 1 Stone!
                  </p>
                </div>

                {/* 2. Masonry & Stone Factory Pipeline */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏺</span>
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                      Masonry, Clay & Stone Factory Pipeline
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="p-2 rounded-lg bg-slate-950 border border-amber-900 text-amber-200">
                      Shore Tile
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-white">
                      🏺 Clay Pit (3 Boards)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-amber-900 text-amber-300 font-bold">
                      🏺 Raw Clay
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-white">
                      🧱 Stone Factory (2 Boards)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-amber-950/80 border border-amber-600 text-amber-200 font-bold">
                      🪨 2 Stone
                    </span>
                    <span className="text-slate-500">+</span>
                    <span className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
                      🏛️ Wonder (Any Home Goods)
                    </span>
                  </div>
                </div>

                {/* 3. Deep Mining, Currency & Finance */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
                      Highland Ores, Minted Gold & Stock Certificates
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200">
                      Mountain Hex
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-white">
                      💎 Mine (3 Boards, 1 Stone)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-amber-800 text-amber-300 font-bold">
                      ✨ 1 Gold or Iron / turn (6 bag)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-white">
                      🪙 Royal Mint (2 Boards, 1 Stone)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-amber-400 text-slate-950 font-bold">
                      🪙 1 Coin (40 VP!)
                    </span>
                    <span className="text-slate-500">+</span>
                    <span className="p-2 rounded-lg bg-slate-800 text-white">
                      📜 1 Paper
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-purple-500 text-white font-bold">
                      📈 1 Stock Share (120 VP!)
                    </span>
                  </div>
                </div>

                {/* 4. Natural Animal Breeding */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🫏</span>
                    <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                      Natural Pasture Breeding (The Privacy Rule)
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="p-2 rounded-lg bg-slate-950 border border-emerald-800 text-emerald-300">
                      🌱 Empty Pasture Hex (No Buildings / No Goods)
                    </span>
                    <span className="text-slate-500">+</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                      🫏 Exactly 2 Donkeys of Same Player (No Cargo)
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-emerald-400 text-slate-950 font-bold">
                      🫏 1 Newborn Donkey!
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    No building needed! Donkeys naturally reproduce when two of them have complete privacy on an empty pasture hex during the Production Phase.
                  </p>
                </div>

                {/* 5. Geese & Technological Research */}
                <div className="p-4 rounded-xl bg-slate-900 border border-amber-600/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪿</span>
                    <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                      Geese Breeding & Technological Advancements
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="p-2 rounded-lg bg-slate-950 border border-amber-900 text-amber-300">
                      🪿 Exactly 2 Geese alone on Pasture
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-amber-400 text-slate-950 font-bold">
                      🪿 +1 Newborn Goose!
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-sky-600 text-sky-200">
                      🧪 2 Geese + 1 Paper on same hex
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="p-2 rounded-lg bg-sky-400 text-slate-950 font-bold">
                      🚀 Research Discovery
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Research consumes exactly <span className="text-amber-300 font-bold">2 Geese and 1 Paper</span> on the same hex. Unlocks advanced vehicle factories and mining technologies:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="font-bold text-amber-300">🚣 Rowing (Rowboat Factory):</span>
                      <p className="text-slate-400 mt-0.5">Unlocks Rowboat Factory (costs 2 boards, 1 stone) to build 5-capacity, 4-speed rowboats from 5 boards + free upgrade from Raft Factory.</p>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="font-bold text-amber-300">🚚 Trucking (Steam Truck Factory):</span>
                      <p className="text-slate-400 mt-0.5">Unlocks Truck Factory (costs 2 boards, 2 stone) to assemble 6-capacity, 4-speed trucks from 1 fuel + 1 iron + free upgrade from Wagon Factory.</p>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="font-bold text-amber-300">🚢 Shipping (Steamer Factory):</span>
                      <p className="text-slate-400 mt-0.5">Unlocks Steamer Factory (costs 2 boards, 2 stone) to craft 8-capacity, 6-speed steamers from 2 fuel + 1 iron + free upgrade.</p>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="font-bold text-amber-300">💎 Specialisation (Specialized Mines):</span>
                      <p className="text-slate-400 mt-0.5">Sets mine ore pool to 4 Gold (0 Iron) or 4 Iron (0 Gold), drawing 1 counter per turn (mutually exclusive per mine with Enlargement).</p>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="font-bold text-amber-300">⛏️ Enlargement (Large Mines):</span>
                      <p className="text-slate-400 mt-0.5">Expands mine ore bag to 5 Gold + 5 Iron (10 counters total), drawing 1 per turn (mutually exclusive per mine with Specialisation).</p>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="font-bold text-amber-300">🪜 New Shafts (Mine Replenishment):</span>
                      <p className="text-slate-400 mt-0.5">Sinks new shafts into depleted mountain mines to refill their ore counter pool.</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-[10px] text-amber-300/90 font-mono space-y-1">
                    <div>ℹ️ Official Splotter Rule: Donkey carrying capacity is always 2 goods. No research ever changes donkey capacity.</div>
                    <div>🪿 Geese never use cargo capacity—any transporter can carry geese alongside a full load (e.g., 2 Geese + 2 Boards on a Donkey).</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TURN PHASES & RULES */}
          {activeTab === 'phases' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                  The Four Turn Phases of Each Round
                </h4>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-white mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs">
                        1
                      </span>
                      <span>Phase 1: Production</span>
                    </div>
                    <p className="text-slate-300 pl-7">
                      Primary extractors (Woodcutters, Clay Pits, Quarries on Rock, 1-ore-per-turn Mines on Mountain) generate raw materials. Secondary refineries convert raw materials into boards, stone, fuel, paper, coins, and stocks. Empty pastures with exactly 2 Donkeys or exactly 2 Geese reproduce naturally. Movement points reset.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-white mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs">
                        2
                      </span>
                      <span>Phase 2: Movement & Logistics</span>
                    </div>
                    <p className="text-slate-300 pl-7">
                      Command donkeys (1 off-road OR 2 road-only moves), wagons, and watercraft across the map. Cargo pickup and dropping are permitted exclusively during the Movement Phase.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-white mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs">
                        3
                      </span>
                      <span>Phase 3: Building & Construction</span>
                    </div>
                    <p className="text-slate-300 pl-7">
                      Transporters at sites build Land Roads (strictly 1 Stone), River Bridges (strictly 2 Boards), factories, workshops, or conduct Research (2 Geese + 1 Paper).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-white mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs">
                        4
                      </span>
                      <span>Phase 4: The Wonder of the World</span>
                    </div>
                    <p className="text-slate-300 pl-7">
                      Spend any goods at your home (starting) tile to place bricks into the Wonder (cost starts at 1 good, +1 per extra brick this round, and +1 base after brick #17). If no player contributes during the round, 1 Neutral brick is placed!
                    </p>
                  </div>
                </div>
              </div>

              {/* Invariant Rules */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Cardinal Tabletop Laws
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Neutral Goods:</strong> Goods on hex tiles belong to NOBODY. Any transporter may claim them. Goods inside transporters are 100% private.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Road vs. Bridge Materials:</strong> Land Roads strictly cost 1 Stone. River Bridges strictly cost 2 Boards.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Road Exclusivity:</strong> Wheeled wagons and trucks CANNOT move off-road. Donkeys cannot mix off-road and road moves in the same round.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: SCORING & GOODS VALUES */}
          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(GOOD_DETAILS).map(([typeKey, detail]) => (
                  <div
                    key={typeKey}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{detail.icon}</span>
                      <div>
                        <p className="font-bold text-white">{detail.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {typeKey.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-slate-950 text-amber-400 font-mono font-bold text-xs border border-slate-800">
                      {detail.points} VP
                    </span>
                  </div>
                ))}
              </div>

              {/* Wonder Row Scoring Box */}
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/50 space-y-2">
                <h4 className="text-sm font-bold text-amber-300">
                  Wonder of the World Row Scoring (10 VP per Row)
                </h4>
                <p className="text-xs text-slate-300">
                  Every row of the 13-row stepped Wonder awards 10 VP divided proportionally among player-owned (non-neutral) bricks in that row. Filling earlier 4-slot rows gives up to 2 VP per brick, while later rows distribute 10 VP across 5, 6, or 7 slots!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Rows 1–4 (4 slots each)</span>
                    <span className="text-amber-400 font-extrabold text-sm">10 VP / Row</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Rows 5–8 (5 slots each)</span>
                    <span className="text-amber-300 font-extrabold text-sm">10 VP / Row</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Rows 9–11 (6 slots each)</span>
                    <span className="text-amber-200 font-extrabold text-sm">10 VP / Row</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/60 shadow">
                    <span className="text-[10px] text-amber-300 block">Rows 12–13 (7 &amp; 3 slots)</span>
                    <span className="text-amber-400 font-extrabold text-sm">10 VP / Row</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            Roads & Boats · Splotter Spellen Standard Reference
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow ml-auto"
          >
            Close Player Aid
          </button>
        </div>
      </div>
    </div>
  );
};
