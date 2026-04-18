import fs from 'node:fs';
import defaultManifest from '../brain-regions.default.json';
import { aiosPath, aiosRootExists } from './paths';
import { topLevelRegions } from './fs-index';

export type ViewType = 'timeline' | 'grid' | 'kv-list';

export interface RegionEntry {
  id: string;
  label: string;
  icon: string;
  viewType: ViewType;
  order: number;
  /** True for regions discovered on disk but missing from the manifest. */
  discovered?: boolean;
}

const USER_OVERRIDE_PATH = 'META-COGNITION/regions.json';

function readUserOverride(): RegionEntry[] {
  if (!aiosRootExists()) return [];
  let raw: string;
  try {
    raw = fs.readFileSync(aiosPath(USER_OVERRIDE_PATH), 'utf8');
  } catch {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RegionEntry =>
        !!e &&
        typeof e === 'object' &&
        typeof e.id === 'string' &&
        typeof e.label === 'string'
    );
  } catch {
    return [];
  }
}

/**
 * Merge: user override entries beat defaults (by `id`), then any folders
 * present on disk but not in either list are appended as "discovered"
 * regions with a sensible fallback config.
 */
export function getRegionManifest(): RegionEntry[] {
  const byId = new Map<string, RegionEntry>();
  for (const d of defaultManifest as RegionEntry[]) {
    byId.set(d.id, { ...d });
  }
  for (const u of readUserOverride()) {
    byId.set(u.id, { ...(byId.get(u.id) ?? {}), ...u });
  }

  const existingIds = new Set(byId.keys());
  const discovered = topLevelRegions().filter((d) => !existingIds.has(d));
  let nextOrder =
    Math.max(0, ...Array.from(byId.values()).map((r) => r.order ?? 0)) + 1;
  for (const id of discovered) {
    byId.set(id, {
      id,
      label: id,
      icon: 'folder',
      viewType: 'timeline',
      order: nextOrder++,
      discovered: true
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.order - b.order);
}

export function getRegion(id: string): RegionEntry | undefined {
  return getRegionManifest().find((r) => r.id === id);
}
