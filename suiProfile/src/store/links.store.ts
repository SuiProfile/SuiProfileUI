import storage from "../utils/storage";
import type { LinkGroup, LinkItem, LinksState } from "../models/links";

let STORAGE_KEY = "links-page-state-v2";

export function setLinksStorageKey(namespace: string | undefined) {
  STORAGE_KEY = namespace ? `links-page-state-v2:${namespace}` : "links-page-state-v2";
}

export function loadInitialState(): LinksState {
  const saved = storage.getJSON<LinksState>(STORAGE_KEY);
  if (saved && Array.isArray(saved.groups) && Array.isArray(saved.library)) {
    return { groups: saved.groups, library: saved.library };
  }
  return { groups: [], library: [] };
}

export function persistState(state: LinksState) {
  const toSave: LinksState = {
    groups: Array.isArray(state.groups) ? state.groups : [],
    library: Array.isArray(state.library) ? state.library : [],
  };
  if (toSave && (toSave.groups.length > 0 || toSave.library.length > 0)) {
    storage.setJSON(STORAGE_KEY, toSave);
  }
}

export function nextGroupId(groups: LinkGroup[]): string {
  const KEY = "__group_id_counter";
  let maxId = 0;
  for (const g of groups) {
    const n = parseInt(g.id, 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  }
  let storageMax = 0;
  try {
    const v = localStorage.getItem(KEY);
    storageMax = v ? parseInt(v, 10) : 0;
    if (isNaN(storageMax)) storageMax = 0;
  } catch {}
  const nextId = Math.max(maxId, storageMax) + 1;
  try {
    localStorage.setItem(KEY, String(nextId));
  } catch {}
  return String(nextId);
}

export function nextLinkId(groups: LinkGroup[], library: LinkItem[]): string {
  const KEY = "__link_id_counter";
  let maxId = 0;
  for (const l of library) {
    const n = parseInt(l.id, 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  }
  for (const g of groups) {
    for (const l of g.links) {
      const n = parseInt(l.id, 10);
      if (!isNaN(n) && n > maxId) maxId = n;
    }
  }
  let storageMax = 0;
  try {
    const v = localStorage.getItem(KEY);
    storageMax = v ? parseInt(v, 10) : 0;
  } catch {}
  const nextId = Math.max(maxId, storageMax) + 1;
  try {
    localStorage.setItem(KEY, String(nextId));
  } catch {}
  return String(nextId);
}

export function canAddLinkToGroup(group: LinkGroup, link: LinkItem) {
  if (group.links.length >= 10) return { ok: false, reason: "max" } as const;
  if (group.links.some((l) => l.url === link.url)) return { ok: false, reason: "dup" } as const;
  return { ok: true } as const;
}


