/**
 * Google Drive Authentication & Rulebook File Loader
 * Uses Firebase Auth (client-side) + Google Drive API v3 (drive.readonly)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory only (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export interface DriveRuleFile {
  id: string;
  name: string;
  mimeType: string;
  path: string;
  modifiedTime?: string;
  size?: string;
  content: string;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    await syncDriveRuleFilesToServer([], { stage: 'googleSignIn' }, error?.message || String(error));
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export async function syncDriveRuleFilesToServer(
  files: DriveRuleFile[],
  diagnostics?: any,
  error?: string | null
) {
  try {
    await fetch('/api/drive-rules/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cachedAccessToken ? { Authorization: `Bearer ${cachedAccessToken}` } : {}),
      },
      body: JSON.stringify({ files, diagnostics, error: error || null }),
    });
  } catch (err) {
    console.warn('Failed to sync Drive rule files to local server workspace:', err);
  }
}

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
}

async function queryDriveFiles(token: string, q: string): Promise<DriveFileMetadata[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', `${q} and trashed = false`);
  url.searchParams.set(
    'fields',
    'files(id, name, mimeType, parents, modifiedTime, size)'
  );
  url.searchParams.set('pageSize', '50');
  url.searchParams.set('supportsAllDrives', 'true');
  url.searchParams.set('includeItemsFromAllDrives', 'true');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.files || [];
}

async function downloadDriveFileText(token: string, file: DriveFileMetadata): Promise<string> {
  const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';
  const url = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download ${file.name} (${res.status}): ${errText}`);
  }
  return await res.text();
}

/**
 * Searches Google Drive for `game_files/roads&boats/roadsandboats*`
 * Also searches broadly for files matching `roadsandboats` in case folder structure differs.
 */
export async function fetchRoadsAndBoatsDriveRuleFiles(
  accessToken: string,
  customPattern?: string
): Promise<DriveRuleFile[]> {
  const discoveredById = new Map<string, { meta: DriveFileMetadata; path: string }>();
  const diagnostics: Record<string, any> = {
    steps: [],
    errors: [],
  };

  try {
    // 1. Traverse folder path: game_files -> roads&boats -> roadsandboats*
    try {
      const gameFilesFolders = await queryDriveFiles(
        accessToken,
        `mimeType = 'application/vnd.google-apps.folder' and name contains 'game_files'`
      );
      diagnostics.steps.push({ step: 'game_files_folders', count: gameFilesFolders.length });

      for (const gf of gameFilesFolders) {
        const subFolders = await queryDriveFiles(
          accessToken,
          `'${gf.id}' in parents and mimeType = 'application/vnd.google-apps.folder'`
        );
        const rbFolders = subFolders.filter(f =>
          f.name.toLowerCase().replace(/\s+/g, '').includes('roads')
        );

        for (const rbf of rbFolders) {
          const children = await queryDriveFiles(
            accessToken,
            `'${rbf.id}' in parents and mimeType != 'application/vnd.google-apps.folder'`
          );
          for (const child of children) {
            discoveredById.set(child.id, {
              meta: child,
              path: `${gf.name}/${rbf.name}/${child.name}`,
            });
          }
        }
      }
    } catch (e: any) {
      diagnostics.errors.push({ step: 'step1_folder_walk', error: e.message });
    }

    // 2. Also search directly for any `roads&boats` folder anywhere in Drive
    try {
      const directRbFolders = await queryDriveFiles(
        accessToken,
        `mimeType = 'application/vnd.google-apps.folder' and name contains 'roads'`
      );
      diagnostics.steps.push({ step: 'roads_folders', count: directRbFolders.length });
      for (const rbf of directRbFolders) {
        const children = await queryDriveFiles(
          accessToken,
          `'${rbf.id}' in parents and mimeType != 'application/vnd.google-apps.folder'`
        );
        for (const child of children) {
          if (!discoveredById.has(child.id)) {
            discoveredById.set(child.id, {
              meta: child,
              path: `${rbf.name}/${child.name}`,
            });
          }
        }
      }
    } catch (e: any) {
      diagnostics.errors.push({ step: 'step2_roads_folders', error: e.message });
    }

    // 3. Direct filename search for `roadsandboats*`, `r&b*`, `splotter*` (or customPattern)
    try {
      const searchTerm = (customPattern || 'roadsandboats').replace(/'/g, "\\'");
      const directMatches = await queryDriveFiles(
        accessToken,
        `mimeType != 'application/vnd.google-apps.folder' and (name contains '${searchTerm}' or name contains 'roads' or name contains 'r&b' or name contains 'splotter')`
      );
      diagnostics.steps.push({ step: 'direct_filename_matches', count: directMatches.length });
      for (const file of directMatches) {
        if (!discoveredById.has(file.id)) {
          discoveredById.set(file.id, {
            meta: file,
            path: file.name,
          });
        }
      }
    } catch (e: any) {
      diagnostics.errors.push({ step: 'step3_direct_search', error: e.message });
    }

    diagnostics.allDiscoveredFiles = Array.from(discoveredById.values()).map(d => ({
      id: d.meta.id,
      name: d.meta.name,
      path: d.path,
      mimeType: d.meta.mimeType,
      size: d.meta.size,
    }));

    // If all 3 queries threw an API error (e.g. 403 SERVICE_DISABLED), surface it clearly
    if (discoveredById.size === 0 && diagnostics.errors.length > 0) {
      const firstErr = diagnostics.errors[0].error;
      await syncDriveRuleFilesToServer([], diagnostics, firstErr);
      throw new Error(firstErr);
    }

    // Allow .json, .ts, .tsx, .js, .md, .txt, and scenario .pdf files in game_files/roads&boats
    const candidates = Array.from(discoveredById.values()).filter(({ meta, path: fPath }) => {
      const lower = meta.name.toLowerCase();
      const lowerPath = fPath.toLowerCase();
      const isTextRuleFile =
        lower.endsWith('.json') ||
        lower.endsWith('.ts') ||
        lower.endsWith('.tsx') ||
        lower.endsWith('.js') ||
        lower.endsWith('.md') ||
        lower.endsWith('.txt') ||
        meta.mimeType.includes('json') ||
        meta.mimeType.includes('text') ||
        meta.mimeType === 'application/vnd.google-apps.document';
      const isScenarioPdf =
        (lower.endsWith('.pdf') || meta.mimeType === 'application/pdf') &&
        (lowerPath.includes('roads') ||
          lower.includes('splotter') ||
          lower.includes('r&b') ||
          lower.includes('scenario') ||
          lower.includes('map'));
      return isTextRuleFile || isScenarioPdf;
    });

    diagnostics.candidateFiles = candidates.map(c => ({
      name: c.meta.name,
      path: c.path,
      mimeType: c.meta.mimeType,
    }));

    const downloaded: DriveRuleFile[] = [];
    for (const { meta, path } of candidates) {
      try {
        const isPdf =
          meta.name.toLowerCase().endsWith('.pdf') || meta.mimeType === 'application/pdf';
        const content = isPdf
          ? JSON.stringify(
              {
                driveFileId: meta.id,
                fileName: meta.name,
                drivePath: path,
                mimeType: meta.mimeType,
                sizeBytes: meta.size,
                modifiedTime: meta.modifiedTime,
                attribution: 'Splotter Spellen (Jeroen Doumen & Joris Wiersinga) & Scenario Authors',
                status: 'Integrated into Scenario Map Sets Menu (non-duplicate maps added)',
              },
              null,
              2
            )
          : await downloadDriveFileText(accessToken, meta);
        downloaded.push({
          id: meta.id,
          name: meta.name,
          mimeType: meta.mimeType,
          path,
          modifiedTime: meta.modifiedTime,
          size: meta.size,
          content,
        });
      } catch (err: any) {
        diagnostics.errors.push({ step: `download_${meta.name}`, error: err.message });
      }
    }

    await syncDriveRuleFilesToServer(downloaded, diagnostics, null);
    return downloaded;
  } catch (err: any) {
    await syncDriveRuleFilesToServer([], diagnostics, err?.message || String(err));
    throw err;
  }
}
