import storage from "../utils/storage";
import type { LinkGroup, LinkItem, LinksState } from "../models/links";

const STORAGE_KEY = "links-page-state-v2";

/**
 * Yerel depolamada kayıtlı grup ve kütüphane verilerini yükler.
 * Eğer kayıt varsa *her zaman* onları döndürür; yoksa boş dizi döndürür.
 */
export function loadInitialState(): LinksState {
  const saved = storage.getJSON<LinksState>(STORAGE_KEY);
  if (
    saved &&
    Array.isArray(saved.groups) &&
    Array.isArray(saved.library)
  ) {
    return {
      groups: saved.groups,
      library: saved.library,
    };
  }
  return { groups: [], library: [] };
}

/**
 * Durumu localStorage'a kaydeder.
 */
export function persistState(state: LinksState) {
  // Dosya içindeki gruplar & kütüphaneyi mutlaka array olarak sakla
  const toSave: LinksState = {
    groups: Array.isArray(state.groups) ? state.groups : [],
    library: Array.isArray(state.library) ? state.library : [],
  };
  if (toSave && (toSave.groups.length > 0 || toSave.library.length > 0)) {
    storage.setJSON(STORAGE_KEY, toSave);
  }
}

export function nextGroupId(groups: LinkGroup[]): string {
  let maxId = 0;
  for (const g of groups) {
    const n = parseInt(g.id, 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  }
  return String(maxId + 1);
}

export function nextLinkId(groups: LinkGroup[], library: LinkItem[]): string {
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
  return String(maxId + 1);
}

export function canAddLinkToGroup(group: LinkGroup, link: LinkItem) {
  if (group.links.length >= 10) return { ok: false, reason: "max" } as const;
  if (group.links.some(l => l.url === link.url)) return { ok: false, reason: "dup" } as const;
  return { ok: true } as const;
}
