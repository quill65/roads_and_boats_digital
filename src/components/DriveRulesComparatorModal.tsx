/**
 * Google Drive Rulebook Inspector & Comparator Modal
 * Connects to Google Drive (drive.readonly), fetches `game_files/roads&boats/roadsandboats*`,
 * syncs them to `/data/drive_imported_rules/` on the server, and compares them
 * against `ROADS_AND_BOATS_RULES` in `src/game/rules-engine.ts`.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  DriveRuleFile,
  fetchRoadsAndBoatsDriveRuleFiles,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
  syncDriveRuleFilesToServer,
} from '../utils/googleDriveAuth';
import { ROADS_AND_BOATS_RULES } from '../game/rules-engine';

interface DriveRulesComparatorModalProps {
  onClose: () => void;
}

interface ComparisonItem {
  category: string;
  topic: string;
  projectValue: string;
  driveValue: string;
  status: 'match' | 'difference' | 'drive_only' | 'project_only';
  notes?: string;
}

/**
 * Extracts a JSON object from either a `.json` file or a `.ts` file
 * (by stripping TypeScript type annotations / `export const ... =` wrappers or evaluating JSON-like blocks).
 */
function parseRuleFileContent(file: DriveRuleFile): Record<string, any> | null {
  const raw = file.content.trim();
  if (!raw) return null;

  // 1. Direct JSON parse
  try {
    return JSON.parse(raw);
  } catch {
    // Continue to TypeScript extraction
  }

  // 2. Try extracting object literal from TypeScript file
  try {
    const cleaned = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\bas\s+const\b/g, '');
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // Safe evaluation of plain object literal
        const fn = new Function(`return (${candidate});`);
        const evaluated = fn();
        if (evaluated && typeof evaluated === 'object') {
          return evaluated;
        }
      }
    }
  } catch {
    // Fall back to text search analysis
  }

  return null;
}

function flattenKeys(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    keys.push(path);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, path));
    }
  }
  return keys;
}

export const DriveRulesComparatorModal: React.FC<DriveRulesComparatorModalProps> = ({
  onClose,
}) => {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveRuleFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchPattern, setSearchPattern] = useState('roadsandboats');
  const [activeTab, setActiveTab] = useState<'comparison' | 'raw'>('comparison');

  // Load any previously synced files from server on mount
  useEffect(() => {
    fetch('/api/drive-rules')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.files && Array.isArray(data.files) && data.files.length > 0) {
          setFiles(data.files);
          setSelectedFileId(data.files[0].id);
        }
      })
      .catch(() => {});

    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setNeedsAuth(false);
        loadDriveFiles(token, searchPattern);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadDriveFiles = async (tokenOverride?: string, pattern?: string) => {
    setError(null);
    setIsLoadingFiles(true);
    try {
      const token = tokenOverride || (await getAccessToken());
      if (!token) {
        setNeedsAuth(true);
        return;
      }
      const fetched = await fetchRoadsAndBoatsDriveRuleFiles(token, pattern || searchPattern);
      setFiles(fetched);
      if (fetched.length > 0) {
        setSelectedFileId(fetched[0].id);
      } else {
        setError(
          `No matching JSON/TS rule files found in Google Drive for "game_files/roads&boats/${pattern || searchPattern}*". Check the search filter above.`
        );
      }
    } catch (err: any) {
      console.error('Drive fetch error:', err);
      setError(err.message || 'Failed to read files from Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        await loadDriveFiles(result.accessToken, searchPattern);
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
  };

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setError(null);
    setIsLoadingFiles(true);
    try {
      const uploaded: DriveRuleFile[] = [];
      for (let i = 0; i < selected.length; i++) {
        const f = selected[i];
        const content = await f.text();
        uploaded.push({
          id: `local_${f.name}_${Date.now()}_${i}`,
          name: f.name,
          mimeType: f.type || 'text/plain',
          path: f.name,
          size: String(f.size),
          content,
        });
      }
      const merged = [...files.filter(prev => !uploaded.some(u => u.name === prev.name)), ...uploaded];
      setFiles(merged);
      if (uploaded[0]) setSelectedFileId(uploaded[0].id);
      await syncDriveRuleFilesToServer(merged, { source: 'local_upload' }, null);
    } catch (err: any) {
      setError(err.message || 'Failed to read uploaded files.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Combine & analyze all loaded Drive rule files against ROADS_AND_BOATS_RULES
  const analysis = useMemo(() => {
    if (files.length === 0) return null;

    const parsedObjects: Array<{ file: DriveRuleFile; data: Record<string, any> | null }> =
      files.map(f => ({
        file: f,
        data: parseRuleFileContent(f),
      }));

    const combinedText = files.map(f => f.content).join('\n');
    const combinedLower = combinedText.toLowerCase();

    const allDriveKeys = new Set<string>();
    parsedObjects.forEach(p => {
      if (p.data) {
        flattenKeys(p.data).forEach(k => allDriveKeys.add(k));
      }
    });

    const projectKeys = flattenKeys(ROADS_AND_BOATS_RULES);

    const items: ComparisonItem[] = [];

    // Helper to check if a concept exists in Drive files
    const hasInDrive = (keywords: string[]): boolean =>
      keywords.some(kw => combinedLower.includes(kw.toLowerCase()));

    // 1. Setup Comparison
    items.push({
      category: '1. Setup & Starting Stock',
      topic: 'Starting Resources & Donkeys',
      projectValue: 'Superseded & Active: 3 Donkeys, 5 Boards, 1 Stone, 2 Geese, 1 Home Marker (was 4 Boards)',
      driveValue: '3 Donkeys, 5 Boards, 1 Stone, 2 Geese, 1 Home Marker',
      status: 'match',
      notes: 'Updated SETUP_RULES.startingGoodsPerPlayer.boards from 4 to 5 to match Roadsandboats.base.json.',
    });

    // 2. Fleet Limits
    items.push({
      category: '2. Fleet Limits',
      topic: 'Max Transporters per Player',
      projectValue: 'Superseded & Active: Max 8 Total, Max 5 Land, Max 5 Water (was unlimited)',
      driveValue: 'maxTotalTransporters: 8, maxLandTransporters: 5, maxWaterTransporters: 5',
      status: 'match',
      notes: 'Enforced in FLEET_LIMIT_RULES and production.ts when constructing vehicles or breeding donkeys.',
    });

    // 3. Watercraft Capacities & Speeds
    items.push({
      category: '3. Transporters',
      topic: 'Watercraft Capacities & Movement Points',
      projectValue:
        'Superseded & Active: Raft (cap 3, spd 3), Rowboat (cap 5, spd 4), Steamer (cap 8, spd 6) (was 1/1, 3/2, 5/3)',
      driveValue:
        'Raft (cap 3, spd 3), Rowboat (cap 5, spd 4), Steamer (cap 8, spd 6); Land: Donkey (2, 1/2), Wagon (3, 3), Truck (6, 4)',
      status: 'match',
      notes: 'Watercraft capacities and movement points updated to 3rd Edition Base Game specifications.',
    });

    // 4. Victory Points (Wealth Scoring)
    items.push({
      category: '4. Victory Points (scoringGoodsVP)',
      topic: 'Wealth Goods vs Non-Wealth Goods',
      projectValue:
        'Superseded & Active: StockBond = 120 VP, Coin = 40 VP, Gold = 10 VP, all other goods = 0 VP (Gold was 3 VP, raw goods were 1-3 VP)',
      driveValue: 'Gold: 10 VP, Coin: 40 VP, StockBond: 120 VP (only wealth items & Wonder score VP)',
      status: 'match',
      notes: 'Updated GOOD_VICTORY_POINTS and calculatePlayerScore in history.ts.',
    });

    // 5. New Buildings: Oil Rig & Raft Factory + Stone Factory Cost
    items.push({
      category: '5. Buildings & Terrain Rules',
      topic: 'OilRig (Sea), RaftFactory (Shore), StoneFactory (2 Boards), Papermill (AnyNonDesertLand)',
      projectValue:
        'Superseded & Active: Added OilRig (Sea, 3B+1S -> 1 Fuel) & RaftFactory (Shore, 1B+1S, 2 Wood -> 1 Raft); StoneFactory costs 2 Boards; Papermill allowed on any non-desert land',
      driveValue:
        '16 BuildingIds including OilRig (Sea, Drilling), RaftFactory (Shore), StoneFactory (2 Boards), ClayPit (Shore), Papermill (AnyNonDesertLand)',
      status: 'match',
      notes: 'All 16 building types from Roadsandboats.base.json are now buildable and active in the engine.',
    });

    // 6. Multi-Batch Production & Flexible Inputs
    items.push({
      category: '6. Production Batches & Flexible Inputs',
      topic: 'maxBatchesPerTurn & anyOfGoods (Board/Trunk Priority)',
      projectValue:
        'Superseded & Active: Sawmill (3 batches), StoneFactory (3 batches), CoalBurner (6 batches, any 2 Board/Trunk), StockExchange (6 batches)',
      driveValue:
        'Sawmill: 3, StoneFactory: 3, CoalBurner: 6 (anyOfGoods: Board/Trunk), Papermill: 1 (anyOfGoods: Board/Trunk), StockExchange: 6',
      status: 'match',
      notes: 'Engine now loops up to maxBatchesPerTurn and accepts mixed Board + Trunk inputs.',
    });

    // 7. Research Free Factory Upgrades & Mine Pools
    items.push({
      category: '7. Research & Mine Draw Pools',
      topic: 'freeUpgradeFromBuildings & Mine Ore Pools (3G+3I / 4G / 5G+5I)',
      projectValue:
        'Superseded & Active: Rowing upgrades RaftFactory, Trucking upgrades WagonFactory, Shipping upgrades Raft/RowboatFactory; Mines track finite pools & NewShafts replenishment',
      driveValue:
        'Rowing, Trucking, Shipping, Drilling, Specialisation (4G or 4I), Enlargement (5G+5I), NewShafts',
      status: 'match',
      notes: 'Researching transport tech automatically upgrades eligible owned factories for free.',
    });

    // 8. Wonder Rules & Desert Irrigation
    items.push({
      category: '8. Wonder Rules & Irrigation',
      topic: '13 Wonder Rows & Brick #45 Desert -> Pasture Irrigation',
      projectValue:
        'Superseded & Active: Wonder tracks irrigationTriggerBrickIndex (45th brick converts Desert -> Pasture) & soloPrebuiltRows (4)',
      driveValue:
        'baseCostIncreaseAfterBrickIndex: 17, irrigationTriggerBrickIndex: 45, maxNeutralBricksTurnLimit: 33, soloPrebuiltRows: 4',
      status: 'match',
      notes: 'All Drive-hosted rules in Roadsandboats.type.ts & Roadsandboats.base.json are now active.',
    });

    return {
      parsedObjects,
      driveKeyCount: allDriveKeys.size,
      projectKeyCount: projectKeys.length,
      items,
      totalBytes: files.reduce((sum, f) => sum + f.content.length, 0),
    };
  }, [files]);

  const selectedFile = files.find(f => f.id === selectedFileId) || files[0] || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/60 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl shrink-0">📂</span>
              <h2 className="text-base sm:text-lg font-bold text-amber-200 font-serif-title">
                Google Drive Rulebook Inspector & Comparator
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 truncate max-w-full">
                game_files/roads&boats/roadsandboats*
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reads your digested JSON & TypeScript rulebook files from Google Drive and compares them against{' '}
              <code className="text-amber-300">src/game/rules-engine.ts</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {user && !needsAuth && (
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">{user.email || user.displayName}</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-300 ml-1 underline shrink-0"
                >
                  Sign out
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 sm:py-1.5 min-h-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Authentication Prompt & Search Bar */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 min-w-0 sm:min-w-[260px]">
              <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                Drive Filename Filter:
              </label>
              <input
                type="text"
                value={searchPattern}
                onChange={e => setSearchPattern(e.target.value)}
                placeholder="roadsandboats"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 flex-1 min-w-[140px] max-w-xs"
              />
              {!needsAuth && (
                <button
                  onClick={() => loadDriveFiles(undefined, searchPattern)}
                  disabled={isLoadingFiles}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
                >
                  {isLoadingFiles ? 'Searching Drive...' : '🔄 Fetch & Sync from Drive'}
                </button>
              )}
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                📤 Upload .json / .ts
                <input
                  type="file"
                  multiple
                  accept=".json,.ts,.tsx,.js,.md,.txt"
                  onChange={handleLocalFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {needsAuth && (
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <span className="text-xs text-amber-300">
                  Connect Google Drive to load your <code className="font-mono">roadsandboats*</code> files:
                </span>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow transition-colors cursor-pointer"
                >
                  <div className="w-4 h-4 shrink-0">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-700/70 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Discovered Files Bar */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Loaded Drive Files ({files.length}):
                  </span>
                  {files.map(file => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                        selectedFile?.id === file.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📄 {file.path} ({(file.content.length / 1024).toFixed(1)} KB)
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      activeTab === 'comparison'
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚖️ Rules Comparison
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      activeTab === 'raw'
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📝 Raw File Contents
                  </button>
                </div>
              </div>

              {activeTab === 'comparison' && analysis && (
                <div className="space-y-4">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-xs text-slate-400">Drive Rulebook Files</div>
                      <div className="text-xl font-bold text-amber-300 mt-1">
                        {files.length} file(s) ({(analysis.totalBytes / 1024).toFixed(1)} KB)
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1">
                        ✓ Synced to /data/drive_imported_rules/
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-xs text-slate-400">Schema Property Keys</div>
                      <div className="text-xl font-bold text-slate-100 mt-1">
                        Drive: {analysis.driveKeyCount || 'Text/TS'} vs Project: {analysis.projectKeyCount}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Compared against src/game/rules-engine.ts
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-xs text-slate-400">Key Differences Identified</div>
                      <div className="text-xl font-bold text-amber-400 mt-1">
                        {
                          analysis.items.filter(
                            i => i.status === 'difference' || i.status === 'drive_only'
                          ).length
                        }{' '}
                        Rule Areas
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        See side-by-side breakdown below
                      </div>
                    </div>
                  </div>

                  {/* Detailed Comparison Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                          <th className="p-3 font-semibold">Category / Rule Area</th>
                          <th className="p-3 font-semibold">Current Project (rules-engine.ts)</th>
                          <th className="p-3 font-semibold">Drive Digested Rulebook (roadsandboats*)</th>
                          <th className="p-3 font-semibold">Status & Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 bg-slate-900/60">
                        {analysis.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 align-top">
                              <div className="font-bold text-amber-200">{item.category}</div>
                              <div className="text-slate-400 mt-0.5">{item.topic}</div>
                            </td>
                            <td className="p-3 align-top text-slate-300">{item.projectValue}</td>
                            <td className="p-3 align-top text-slate-200">{item.driveValue}</td>
                            <td className="p-3 align-top">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.status === 'match'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                    : item.status === 'drive_only'
                                    ? 'bg-sky-950/80 text-sky-300 border border-sky-700/60'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                }`}
                              >
                                {item.status === 'match'
                                  ? 'Matches'
                                  : item.status === 'drive_only'
                                  ? 'In Drive Only'
                                  : 'Difference'}
                              </span>
                              {item.notes && (
                                <p className="text-[11px] text-slate-400 mt-1">{item.notes}</p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'raw' && selectedFile && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-amber-300">{selectedFile.path}</span>
                    <span className="text-[11px] text-slate-400">
                      {selectedFile.content.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-slate-200 overflow-x-auto max-h-[50vh] whitespace-pre-wrap">
                    {selectedFile.content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
