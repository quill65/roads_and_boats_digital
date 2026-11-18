/**
 * Roads & Boats - Interactive Test Simulation Suite Modal
 * Allows players and developers to run automated game action simulations in real-time.
 */

import React, { useState } from 'react';
import {
  runAllGameSimulations,
  SimulationSuiteResult,
  TestResult,
  testInitialGameState,
  testCargoTransport,
  testMovementAndRivers,
  testRoadAndBridgeConstruction,
  testAllBuildingTypesConstruction,
  testProductionConversions,
  testDonkeyBreeding,
  testWonderAndScoring,
  testUndoRedoMemory,
  testStockBeginnerBotEndToEnd,
} from '../game/simulationTest';

interface TestSimulationModalProps {
  onClose: () => void;
}

export const TestSimulationModal: React.FC<TestSimulationModalProps> = ({ onClose }) => {
  const [suiteResult, setSuiteResult] = useState<SimulationSuiteResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [expandedTestIds, setExpandedTestIds] = useState<Record<string, boolean>>({});

  const handleRunAll = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllGameSimulations();
      setSuiteResult(res);
      setIsRunning(false);
      // Auto-expand any failed tests or all tests if passed
      const expandMap: Record<string, boolean> = {};
      res.tests.forEach(t => {
        expandMap[t.id] = true;
      });
      setExpandedTestIds(expandMap);
    }, 120);
  };

  const handleRunSingle = (fn: () => TestResult) => {
    const single = fn();
    setSuiteResult(prev => {
      const existing = prev ? [...prev.tests] : [];
      const idx = existing.findIndex(t => t.id === single.id);
      if (idx >= 0) {
        existing[idx] = single;
      } else {
        existing.push(single);
      }
      return {
        total: existing.length,
        passed: existing.filter(t => t.passed).length,
        failed: existing.filter(t => !t.passed).length,
        durationMs: existing.reduce((sum, t) => sum + t.durationMs, 0),
        tests: existing,
      };
    });
    setExpandedTestIds(prev => ({ ...prev, [single.id]: true }));
  };

  const categories = suiteResult
    ? ['all', ...Array.from(new Set(suiteResult.tests.map(t => t.category)))]
    : ['all'];

  const filteredTests = suiteResult?.tests.filter(
    t => activeCategoryFilter === 'all' || t.category === activeCategoryFilter
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[92dvh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <span className="text-2xl shrink-0">🧪</span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span>Automated Gameplay Simulator & Test Suite</span>
                {suiteResult && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                      suiteResult.failed === 0
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                        : 'bg-red-950 border border-red-500 text-red-300'
                    }`}
                  >
                    {suiteResult.passed}/{suiteResult.total} PASSED
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Simulates user taking all game actions: roads, bridges, all 16 buildings, cargo, breeding, and wonder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              disabled={isRunning}
              onClick={handleRunAll}
              className="px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition-colors shadow-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{isRunning ? '⏳ Running...' : '▶️ Run All Tests'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close Test Suite"
              className="w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Launch Scenario Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar shrink-0">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider shrink-0">
            Quick Runs:
          </span>
          <button
            onClick={() => handleRunSingle(testInitialGameState)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            📦 Setup Stock
          </button>
          <button
            onClick={() => handleRunSingle(testCargoTransport)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            🎒 Cargo Pick/Drop
          </button>
          <button
            onClick={() => handleRunSingle(testRoadAndBridgeConstruction)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            🛣️ Roads & Bridges
          </button>
          <button
            onClick={() => handleRunSingle(testAllBuildingTypesConstruction)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            🏗️ All 16 Buildings
          </button>
          <button
            onClick={() => handleRunSingle(testProductionConversions)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            🪵 Production Mill
          </button>
          <button
            onClick={() => handleRunSingle(testDonkeyBreeding)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            🌱 Donkey Breeding
          </button>
          <button
            onClick={() => handleRunSingle(testWonderAndScoring)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            🏛️ Wonder & VP
          </button>
          <button
            onClick={() => handleRunSingle(testUndoRedoMemory)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            ⏪ Undo & Redo
          </button>
          <button
            onClick={() => handleRunSingle(testStockBeginnerBotEndToEnd)}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 shrink-0 transition-colors"
          >
            🤖 Stock AI Bot
          </button>
        </div>

        {/* Filter Tabs */}
        {suiteResult && (
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`pb-2.5 px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 shrink-0 ${
                  activeCategoryFilter === cat
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? `All Tests (${suiteResult.total})` : cat}
              </button>
            ))}
          </div>
        )}

        {/* Test List Content */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-3">
          {!suiteResult && !isRunning && (
            <div className="text-center py-12 space-y-3">
              <span className="text-5xl">🧪</span>
              <h4 className="text-base font-bold text-white">Automated Rulebook & Action Verification</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <strong>"Run All Tests"</strong> above to launch simulation suites that programmatically exercise:
                all 16 factories, road & bridge construction with pooled resources, donkey breeding, river blocking,
                transport capacity, wonder contributions, and undo/redo choice memory.
              </p>
              <button
                onClick={handleRunAll}
                className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg"
              >
                Run Simulation Now
              </button>
            </div>
          )}

          {isRunning && (
            <div className="text-center py-16 space-y-3">
              <div className="inline-block animate-spin text-4xl">⚙️</div>
              <p className="text-sm font-semibold text-slate-200">Executing automated game action simulations...</p>
            </div>
          )}

          {suiteResult && !isRunning && (
            <>
              {/* Summary Metric Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Total Tests</p>
                  <p className="text-lg font-bold text-white font-mono-numbers">{suiteResult.total}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Passed</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono-numbers">{suiteResult.passed}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Failed</p>
                  <p className={`text-lg font-bold font-mono-numbers ${suiteResult.failed > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {suiteResult.failed}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Execution Time</p>
                  <p className="text-lg font-bold text-amber-300 font-mono-numbers">{suiteResult.durationMs}ms</p>
                </div>
              </div>

              {/* Individual Test Cards */}
              <div className="space-y-2.5">
                {filteredTests.map(test => {
                  const isExpanded = Boolean(expandedTestIds[test.id]);

                  return (
                    <div
                      key={test.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        test.passed
                          ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                          : 'bg-red-950/20 border-red-800/80'
                      }`}
                    >
                      <div
                        onClick={() =>
                          setExpandedTestIds(prev => ({ ...prev, [test.id]: !prev[test.id] }))
                        }
                        className="px-4 py-3 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{test.passed ? '✅' : '❌'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{test.name}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                                {test.category}
                              </span>
                            </div>
                            {test.error && (
                              <p className="text-xs text-red-400 font-mono mt-0.5">{test.error}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-slate-400">
                            {test.durationMs}ms
                          </span>
                          <span className="text-xs text-slate-500">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Detail Assertion Logs */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                          {test.details.map((detail, dIdx) => (
                            <p key={dIdx} className="text-emerald-300/90 leading-relaxed">
                              {detail}
                            </p>
                          ))}
                          {test.error && (
                            <p className="text-red-400 font-bold mt-1">❌ Failure: {test.error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <span>CLI equivalent: <code className="text-emerald-300 font-mono">npm test</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
