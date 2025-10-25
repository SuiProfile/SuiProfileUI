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
  // localStorage içinde kaydedilmiş id'ye bak, ona göre bir fazlasını döndür
  const KEY = "__group_id_counter";
  let maxId = 0;

  // Mevcut gruplarda en büyük id'yi bul (numeric ise)
  for (const g of groups) {
    const n = parseInt(g.id, 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  }

  // storage utils ile saklanan değeri al
  let storageMax = 0;
  try {
    const v = localStorage.get(KEY);
    storageMax = v ? parseInt(v, 10) : 0;
    if (isNaN(storageMax)) storageMax = 0;
  } catch {
    storageMax = 0;
  }

  let nextId = Math.max(maxId, storageMax) + 1;
  
  try {
    localStorage.set(KEY, String(nextId));
  } catch {
    /* ignore if not possible */
  }

  return String(nextId);
}

export function nextLinkId(groups: LinkGroup[], library: LinkItem[]): string {
  // localStorage üzerinde daha önce kaydedilen id bilgisini kontrol et
  const KEY = "__link_id_counter";
  let maxId = 0;

  // Gruplar ve kütüphane içinde mevcut en büyük id'yi bul
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

  // localStorage'dan id counter'ı al, en büyük hangisiyse onu artır
  let storageMax = 0;
  try {
    const v = localStorage.getItem(KEY);
    storageMax = v ? parseInt(v, 10) : 0;
    if (isNaN(storageMax)) storageMax = 0;
  } catch {
    storageMax = 0;
  }

  let nextId = Math.max(maxId, storageMax) + 1;

  // localStorage'a yeni id counter'ı kaydet
  try {
    localStorage.setItem(KEY, String(nextId));
  } catch {
    /* ignore if not possible (e.g. privacy/incognito) */
  }

  return String(nextId);
}

/** Checks whether a link id already exists in library or any group */
export function isLinkIdTaken(id: string, groups: LinkGroup[], library: LinkItem[]): boolean {
  for (const l of library) if (l.id === id) return true;
  for (const g of groups) for (const l of g.links) if (l.id === id) return true;
  return false;
}

/**
 * Ensures the given id is unique; if it exists and is numeric, increment until unique.
 * If not numeric, falls back to nextLinkId.
 */
export function ensureUniqueLinkId(id: string, groups: LinkGroup[], library: LinkItem[]): string {
  if (!isLinkIdTaken(id, groups, library)) return id;
  const base = parseInt(id, 10);
  if (isNaN(base)) return nextLinkId(groups, library);
  let current = base;
  while (isLinkIdTaken(String(current), groups, library)) current += 1;
  return String(current);
}

export function canAddLinkToGroup(group: LinkGroup, link: LinkItem) {
  if (group.links.length >= 10) return { ok: false, reason: "max" } as const;
  if (group.links.some(l => l.url === link.url)) return { ok: false, reason: "dup" } as const;
  return { ok: true } as const;
}
