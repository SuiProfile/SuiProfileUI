import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useSuiServices } from "../hooks/useSuiServices";
import { CreateProfileDialog } from "../components/CreateProfileDialog";

import { checkLink } from "../services/link.service";
import { LibraryItem } from "../../models/library-item";
import { DragPayload } from "../../models/drag-payload";
import { ProfileData } from "../../models/entity/profile-data";

const MAX_LABEL_LEN = 60;
const MAX_URL_LEN = 200;
const LIB_STORAGE_KEY = "links-lib-v1";
const ORDER_STORAGE_KEY = "profile-link-order-v1";

const urlRegex = /^https?:\/\/(?:[a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}(?:\/\S*)?$/i;

function googleFaviconFrom(urlLike: string | undefined | null, size: 16 | 24 | 32 | 48 | 64 = 32): string | null {
  if (!urlLike) return null;
  try {
    const u = new URL(urlLike);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=${size}`;
  } catch {
    return null;
  }
}

export default function Links() {
  // ---- Hooks ----
  const account = useCurrentAccount();
  const { client, profileService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // UI state
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

  // Library + inputs
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  // Tx & load
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ message, type });
    // auto-hide
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 2200);
  };

  // Local order per profile
  const [orders, setOrders] = useState<Record<string, string[]>>({});

  // Guards
  const droppingRef = useRef<Set<string>>(new Set());
  const deletingRef = useRef<Set<string>>(new Set());
  const libIdCounter = useRef(1);

  // Search / filter
  const [search, setSearch] = useState("");

  // Close preview with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProfileId("");
        setSelectedProfile(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- Bootstrap: library & orders ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIB_STORAGE_KEY);
      if (raw) {
        const parsed: LibraryItem[] = JSON.parse(raw);
        setLibrary(parsed);
        const maxId = parsed.reduce((m, x) => Math.max(m, parseInt(x.id, 10) || 0), 0);
        libIdCounter.current = maxId + 1;
      }
    } catch {}
    try {
      const raw = localStorage.getItem(ORDER_STORAGE_KEY);
      if (raw) setOrders(JSON.parse(raw));
    } catch {}
  }, []);

  // ---- Profiles load ----
  useEffect(() => {
    if (!account) return;
    (async () => {
      try {
        setLoading(true);
        const ids = await profileService.getUserProfiles(client, account.address);
        const details = await Promise.all(ids.map((id) => profileService.getProfile(client, id)));
        const list = details.filter((p): p is ProfileData => p !== null);
        setProfiles(list);
        if (list.length > 0 && !selectedProfileId) setSelectedProfileId(list[0].id);
      } catch (e) {
        console.error(e);
        showToast("Profiller yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useEffect(() => {
    const found = profiles.find((p) => p.id === selectedProfileId) || null;
    setSelectedProfile(found || null);
  }, [selectedProfileId, profiles]);

  // ---- Persist helpers ----
  const persistLibrary = (next: LibraryItem[]) => {
    setLibrary(next);
    try {
      localStorage.setItem(LIB_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const persistOrders = (next: Record<string, string[]>) => {
    setOrders(next);
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  // ---- Library ops (SERVİS ENTEGRASYONU) ----
  const addToLibrary = async () => {
    const label = newLabel.trim();
    const url = newUrl.trim();

    if (!label || label.length < 2) return showToast("Başlık en az 2 karakter");
    if (!(url.startsWith("/") || urlRegex.test(url))) return showToast("URL https:// ile başlamalı veya /slug olmalı");

    // duplicate in library (case-insensitive label + exact url)
    const nameKey = label.toLocaleLowerCase("tr");
    if (library.some((l) => l.url === url && l.label.toLocaleLowerCase("tr") === nameKey)) {
      return showToast("Kütüphanede zaten var");
    }

    setAddingToLibrary(true);

    try {
      let finalUrl = url;
      let favicon: string | undefined;

      // /slug ise harici test yapma (on-chain iç navigasyon olabilir)
      if (urlRegex.test(url)) {
        // Harici URL → serviste test et
        const res = await checkLink(url, { timeoutMs: 6000 });
        if (!res.reachable) {
          showToast("Linke ulaşılamadı (timeout veya CORS)", "error");
          setAddingToLibrary(false);
          return;
        }
        finalUrl = res.finalUrl || url; // yönlendirme sonrası
        favicon = res.favicon || googleFaviconFrom(finalUrl) || undefined;
      } else {
        // /slug → favicon yok, eklemeye izin ver
        favicon = undefined;
      }

      const item: LibraryItem = {
        id: String(libIdCounter.current++),
        label: label.slice(0, MAX_LABEL_LEN),
        url: finalUrl.slice(0, MAX_URL_LEN),
        favicon,
      };

      const next = [item, ...library];
      persistLibrary(next);

      setNewLabel("");
      setNewUrl("");
      showToast("Kütüphaneye eklendi", "success");
    } catch (err) {
      console.error(err);
      showToast("Ekleme sırasında bir hata oluştu");
    } finally {
      setAddingToLibrary(false);
    }
  };

  // ---- Chain ops ----
  const refreshProfile = async (profileId: string) => {
    const p = await profileService.getProfile(client, profileId);
    if (p) {
      setProfiles((prev) => prev.map((x) => (x.id === p.id ? p : x)));
      if (selectedProfileId === p.id) setSelectedProfile(p);
    }
  };

  const addLinkOnChain = (profileId: string, label: string, url: string) =>
    new Promise<void>((resolve, reject) => {
      const tx = profileService.addLink(profileId, label, url);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async () => {
            await refreshProfile(profileId);
            resolve();
          },
          onError: (e) => {
            console.error(e);
            reject(e);
          }
        }
      );
    });

  const removeLinkOnChain = (profileId: string, label: string) =>
    new Promise<void>((resolve, reject) => {
      const tx = profileService.removeLink(profileId, label);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async () => {
            await refreshProfile(profileId);
            resolve();
          },
          onError: (e) => {
            console.error(e);
            reject(e);
          }
        }
      );
    });

  // ---- DnD helpers ----
  const onDragStart = (e: React.DragEvent, payload: DragPayload) => {
    const token = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    e.dataTransfer.setData("application/json", JSON.stringify({ ...payload, token }));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOverProfile = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDropToProfile = async (e: React.DragEvent, toProfileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;
    const key = payload.token || payload.linkId;
    if (droppingRef.current.has(key)) return;
    droppingRef.current.add(key);

    try {
      if (payload.from === "library") {
        const libItem = library.find((l) => l.id === payload.linkId);
        if (!libItem) return;
        const target = profiles.find((p) => p.id === toProfileId);
        if (!target) return;

        // duplicate label (on-chain key)
        if (target.links.has(libItem.label)) {
          showToast("Bu label profilde zaten var");
          return;
        }

        setSaving(true);
        await addLinkOnChain(toProfileId, libItem.label, libItem.url);

        // order append
        const nextOrder = { ...(orders || {}) };
        const currentBase = Array.from((profiles.find((p) => p.id === toProfileId)?.links.keys()) || []);
        const current = nextOrder[toProfileId] ?? currentBase;
        if (!current.includes(libItem.label)) current.push(libItem.label);
        nextOrder[toProfileId] = current;
        persistOrders(nextOrder);
        showToast("Profile eklendi", "success");
      } else {
        const fromProfileId = payload.fromProfileId!;
        const fromProfile = profiles.find((p) => p.id === fromProfileId);
        const toProfile = profiles.find((p) => p.id === toProfileId);
        if (!fromProfile || !toProfile) return;

        const label = payload.linkId; // profile -> label is id
        const url = fromProfile.links.get(label) || "";
        if (!url) return;

        if (fromProfileId === toProfileId) {
          // reorder to end
          const nextOrder = { ...(orders || {}) };
          const baseKeys = Array.from(fromProfile.links.keys());
          const current = nextOrder[fromProfileId] ?? baseKeys;
          const filtered = current.filter((x) => x !== label);
          filtered.push(label);
          nextOrder[fromProfileId] = filtered;
          persistOrders(nextOrder);
          showToast("Sıra güncellendi", "success");
        } else {
          if (toProfile.links.has(label)) {
            showToast("Hedef profilde aynı label var");
            return;
          }
          setSaving(true);
          await addLinkOnChain(toProfileId, label, url);
          await removeLinkOnChain(fromProfileId, label);

          const nextOrder = { ...(orders || {}) };
          const tgtBase = Array.from((profiles.find((p) => p.id === toProfileId)?.links.keys()) || []);
          const tgt = nextOrder[toProfileId] ?? tgtBase;
          if (!tgt.includes(label)) tgt.push(label);
          nextOrder[toProfileId] = tgt;

          const srcBase = Array.from((profiles.find((p) => p.id === fromProfileId)?.links.keys()) || []);
          const src = (nextOrder[fromProfileId] ?? srcBase).filter((x) => x !== label);
          nextOrder[fromProfileId] = src;

          persistOrders(nextOrder);
          showToast("Profil değiştirildi", "success");
        }
      }
    } catch {
      showToast("İşlem başarısız");
    } finally {
      setSaving(false);
      setTimeout(() => droppingRef.current.delete(key), 0);
    }
  };

  const onDropBeforeIndex = async (e: React.DragEvent, toProfileId: string, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;
    const key = payload.token || payload.linkId;
    if (droppingRef.current.has(key)) return;
    droppingRef.current.add(key);

    try {
      if (payload.from === "library") {
        const libItem = library.find((l) => l.id === payload.linkId);
        if (!libItem) return;
        const target = profiles.find((p) => p.id === toProfileId);
        if (!target) return;
        if (target.links.has(libItem.label)) {
          showToast("Bu label profilde zaten var");
          return;
        }
        setSaving(true);
        await addLinkOnChain(toProfileId, libItem.label, libItem.url);

        const nextOrder = { ...(orders || {}) };
        const currentBase = Array.from((profiles.find((p) => p.id === toProfileId)?.links.keys()) || []);
        const current = nextOrder[toProfileId] ?? currentBase;
        const idx = Math.max(0, Math.min(toIndex, current.length));
        const filtered = current.filter((x) => x !== libItem.label);
        filtered.splice(idx, 0, libItem.label);
        nextOrder[toProfileId] = filtered;
        persistOrders(nextOrder);
        showToast("Profile eklendi", "success");
      } else {
        const fromProfileId = payload.fromProfileId!;
        const label = payload.linkId;

        if (fromProfileId === toProfileId) {
          const nextOrder = { ...(orders || {}) };
          const base = Array.from((profiles.find((p) => p.id === toProfileId)?.links.keys()) || []);
          const current = nextOrder[toProfileId] ?? base;
          const filtered = current.filter((x) => x !== label);
          const idx = Math.max(0, Math.min(toIndex, filtered.length));
          filtered.splice(idx, 0, label);
          nextOrder[toProfileId] = filtered;
          persistOrders(nextOrder);
          showToast("Sıra güncellendi", "success");
        } else {
          const fromProfile = profiles.find((p) => p.id === fromProfileId);
          const toProfile = profiles.find((p) => p.id === toProfileId);
          if (!fromProfile || !toProfile) return;
          const url = fromProfile.links.get(label) || "";
          if (!url) return;
          if (toProfile.links.has(label)) {
            showToast("Hedef profilde aynı label var");
            return;
          }
          setSaving(true);
          await addLinkOnChain(toProfileId, label, url);
          await removeLinkOnChain(fromProfileId, label);

          const nextOrder = { ...(orders || {}) };
          const tgtBase = Array.from((profiles.find((p) => p.id === toProfileId)?.links.keys()) || []);
          const tgt = nextOrder[toProfileId] ?? tgtBase;
          const cleaned = tgt.filter((x) => x !== label);
          const idx = Math.max(0, Math.min(toIndex, cleaned.length));
          cleaned.splice(idx, 0, label);
          nextOrder[toProfileId] = cleaned;

          const srcBase = Array.from((profiles.find((p) => p.id === fromProfileId)?.links.keys()) || []);
          nextOrder[fromProfileId] = (nextOrder[fromProfileId] ?? srcBase).filter((x) => x !== label);

          persistOrders(nextOrder);
          showToast("Profil değiştirildi", "success");
        }
      }
    } catch {
      showToast("İşlem başarısız");
    } finally {
      setSaving(false);
      setTimeout(() => droppingRef.current.delete(key), 0);
    }
  };

  // ---- Remove button ----
  const handleRemoveLink = async (profileId: string, label: string) => {
    const key = `${profileId}:${label}`;
    if (deletingRef.current.has(key)) return;
    deletingRef.current.add(key);
    try {
      setSaving(true);
      await removeLinkOnChain(profileId, label);
      const nextOrder = { ...(orders || {}) };
      const base = Array.from((profiles.find((p) => p.id === profileId)?.links.keys()) || []);
      nextOrder[profileId] = (nextOrder[profileId] ?? base).filter((x) => x !== label);
      persistOrders(nextOrder);
      showToast("Link silindi", "success");
    } catch {
      showToast("Silinemedi");
    } finally {
      setSaving(false);
      setTimeout(() => deletingRef.current.delete(key), 0);
    }
  };

  // ---- Derived ----
  const profileMatches = (p: ProfileData, term: string) => {
    if (!term) return true;
    const q = term.toLowerCase();
    if (p.slug?.toLowerCase().includes(q)) return true;
    for (const [label, url] of p.links) {
      if (label.toLowerCase().includes(q)) return true;
      if (url.toLowerCase().includes(q)) return true;
    }
    return false;
  };

  const filteredProfiles = useMemo(
    () => profiles.filter((p) => profileMatches(p, search)),
    [profiles, search]
  );

  const getOrderedLabels = (p: ProfileData) => {
    const keys = Array.from(p.links.keys());
    const ord = orders[p.id];
    if (!ord) return keys;
    const set = new Set(keys);
    const filtered = ord.filter((k) => set.has(k));
    const remaining = keys.filter((k) => !ord.includes(k));
    return [...filtered, ...remaining];
  };

  // ---- Content ----
  let content: React.ReactNode = null;

  if (!account) {
    content = null;
  } else if (loading) {
    content = (
      <div className="p-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <p className="text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  } else if (filteredProfiles.length === 0) {
    content = (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-8 text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {profiles.length === 0 ? "Önce bir profil oluşturun." : "Filtreye uyan profil bulunamadı."}
        </p>
        <button
          onClick={() => setCreateProfileOpen(true)}
          className="h-11 px-5 rounded-full bg-lime-400 text-black font-bold shadow-lg shadow-lime-400/30 hover:bg-lime-300 transition"
        >
          Profil Oluştur
        </button>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Library + Profiles grid */}
        <div className={`${selectedProfile ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col gap-6`}>
          {/* Library */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Kütüphane</h4>
              <span className="text-xs text-gray-500">{library.length} link</span>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-3">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.currentTarget.value)}
                maxLength={MAX_LABEL_LEN}
                className={`h-10 rounded-lg border bg-white dark:bg-gray-900 px-3 text-sm outline-none focus:ring-2 focus:ring-[#2665D6] ${
                  newLabel && newLabel.trim().length < 2 ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-700"
                }`}
                placeholder="Başlık (ör. Instagram)"
              />
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.currentTarget.value)}
                maxLength={MAX_URL_LEN}
                className={`h-10 rounded-lg border bg-white dark:bg-gray-900 px-3 text-sm outline-none focus:ring-2 focus:ring-[#2665D6] ${
                  newUrl && !(newUrl.startsWith("/") || urlRegex.test(newUrl))
                    ? "border-red-400 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                placeholder="https://... veya /username/slug"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addToLibrary();
                }}
              />
              <button
                type="button"
                onClick={addToLibrary}
                className="h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 rounded-xl bg-lime-400 text-black font-bold shadow-lg shadow-lime-400/30 hover:bg-lime-300 transition w-full md:w-auto disabled:opacity-50"
                disabled={addingToLibrary}
              >
                {addingToLibrary && <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />}
                <span>Ekle</span>
              </button>
            </div>

            <ul className="flex flex-col gap-2">
              {library.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2"
                  draggable
                  onDragStart={(e) => onDragStart(e, { linkId: item.id, from: "library" })}
                  title={item.url}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {/* 👇 Favicon başta */}
                    {item.favicon ? (
                      <img src={item.favicon} alt="" className="w-4 h-4 rounded" loading="lazy" />
                    ) : (
                      <i className="pi pi-link text-gray-400 text-sm" />
                    )}
                    <div className="truncate">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-xs text-gray-500 truncate">{item.url}</div>
                    </div>
                  </div>
                </li>
              ))}
              {library.length === 0 && <li className="text-xs text-gray-500">Henüz link yok.</li>}
            </ul>
          </div>

          {/* Profiles grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProfiles.map((p) => {
              const labels = getOrderedLabels(p);
              const isSelected = selectedProfileId === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 hover:ring-2 hover:ring-[#2665D6]/30 cursor-pointer ${
                    isSelected ? "ring-2 ring-[#2665D6]" : ""
                  }`}
                  onClick={() => {
                    setSelectedProfileId(p.id);
                    setSelectedProfile(p);
                  }}
                  onDragOver={onDragOverProfile}
                  onDrop={(e) => onDropToProfile(e, p.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold truncate pr-2">{p.slug}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{p.links.size} link</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfileId(p.id);
                          setSelectedProfile(p);
                        }}
                        className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
                      >
                        Seç
                      </button>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {labels.map((label, idx) => {
                      const url = p.links.get(label) || "";
                      const fav = googleFaviconFrom(url, 16);
                      return (
                        <li
                          key={label}
                          className="group flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 cursor-move"
                          draggable
                          onDragStart={(e) => onDragStart(e, { linkId: label, from: "profile", fromProfileId: p.id })}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => onDropBeforeIndex(e, p.id, idx)}
                          title={url}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <i className="pi pi-grip-vertical text-gray-400" />
                            {/* 👇 Favicon başta */}
                            {fav ? (
                              <img src={fav} alt="" className="w-4 h-4 rounded shrink-0" loading="lazy" />
                            ) : (
                              <i className="pi pi-link text-gray-400 text-sm shrink-0" />
                            )}
                            <div className="truncate">
                              <div className="text-sm font-medium truncate">{label}</div>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#2665D6] hover:underline truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {url}
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLink(p.id, label);
                            }}
                            disabled={saving}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Sil
                          </button>
                        </li>
                      );
                    })}
                    {/* Drop at end */}
                    <li
                      className="h-8 rounded-md border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-400"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDropBeforeIndex(e, p.id, labels.length)}
                    >
                      Bırak
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Preview (desktop) */}
        {selectedProfile && (
          <aside className="hidden lg:block lg:col-span-4 w-full lg:border-l border-gray-800 self-start">
            <div className="lg:sticky lg:top-6 p-6 lg:p-8 pt-0">
              <ProfilePhonePreview
                title={selectedProfile.slug}
                firstUrl={Array.from(selectedProfile.links.values())[0] ?? "—"}
                links={Array.from(selectedProfile.links.entries()).map(([label, url]) => ({ label, url }))}
                onClose={() => {
                  setSelectedProfileId("");
                  setSelectedProfile(null);
                }}
              />
            </div>
          </aside>
        )}

        {/* MOBILE OVERLAY PREVIEW */}
        {selectedProfile && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/70">
            <div className="absolute inset-x-0 bottom-0 top-10">
              <div className="px-4">
                <ProfilePhonePreview
                  title={selectedProfile.slug}
                  firstUrl={Array.from(selectedProfile.links.values())[0] ?? "—"}
                  links={Array.from(selectedProfile.links.entries()).map(([label, url]) => ({ label, url }))}
                  onClose={() => {
                    setSelectedProfileId("");
                    setSelectedProfile(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Profil Linkleri</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Kütüphaneden sürükleyip profillere bırak.</p>
      </div>

      {/* TOP MENUBAR */}
      <div className="w-full mb-6">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm px-4 sm:px-5 py-3">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
            {/* Search / Filter */}
            <div className="flex-1 flex items-center gap-2">
              <div className="relative w-full">
                <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  placeholder="Profilleri filtrele (slug, label, url)..."
                  className="w-full h-11 rounded-xl pl-9 pr-10 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 grid place-items-center"
                    aria-label="Temizle"
                  >
                    <i className="pi pi-times text-gray-500 text-xs" />
                  </button>
                )}
              </div>
            </div>
            {/* New Profile Button */}
            <div className="flex-none">
              <button
                onClick={() => setCreateProfileOpen(true)}
                className="h-11 px-5 rounded-xl bg-lime-400 text-black font-bold shadow-lg shadow-lime-400/30 hover:bg-lime-300 transition w-full md:w-auto"
              >
                Yeni Profil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow text-white ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Create Profile Dialog */}
      <CreateProfileDialog
        open={createProfileOpen}
        onOpenChange={setCreateProfileOpen}
        autoNavigateOnSuccess={true}
        onCreated={async () => {
          if (!account) return;
          try {
            setLoading(true);
            const ids = await profileService.getUserProfiles(client, account.address);
            const details = await Promise.all(ids.map((id) => profileService.getProfile(client, id)));
            const list = details.filter((p): p is ProfileData => p !== null);
            setProfiles(list);
            if (list.length > 0 && !selectedProfileId) setSelectedProfileId(list[0].id);
            showToast("Profil oluşturuldu", "success");
          } finally {
            setLoading(false);
          }
        }}
      />

      {/* Main content */}
      {content}
    </div>
  );
}

/** Telefon önizleme bileşeni (desktop+mobile reuse) */
function ProfilePhonePreview({
  title,
  firstUrl,
  links,
  onClose
}: {
  title: string;
  firstUrl: string;
  links: { label: string; url: string }[];
  onClose: () => void;
}) {
  return (
    <div className="w-full max-w-sm mx-auto relative">
      <div className="relative bg-black rounded-[48px] border-[14px] border-gray-800 overflow-hidden shadow-2xl shadow-lime-500/10 h-[min(740px,calc(100vh-6rem))]">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black" />
        <div className="p-6 pt-10 flex flex-col items-center h-full relative">
          {/* top notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-gray-900 rounded-b-2xl flex items-center justify-center">
            <div className="w-8 h-2 bg-gray-700 rounded-full" />
          </div>

          {/* close */}
          <button
            className="absolute top-6 right-6 p-1.5 bg-black/30 rounded-full"
            onClick={onClose}
            aria-label="Close preview"
            title="Close"
          >
            <span className="material-icons text-white text-lg">close</span>
          </button>

          {/* avatar */}
          <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center mb-4 mt-12">
            <span className="material-icons text-6xl text-gray-300">person</span>
          </div>

          {/* title / subtitle */}
          <h3 className="font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-6">{firstUrl}</p>

          {/* links */}
          <div className="w-full flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent px-1">
            {links.length > 0 ? (
              <div className="flex flex-col gap-3 pb-4">
                {links.map((l, idx) => (
                  <a
                    key={`${l.label}-${idx}`}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#9DF871] text-black text-center py-3.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
                  >
                    {l.label || `Link ${idx + 1}`}
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Bu profilde link yok</div>
            )}
          </div>

          {/* footer */}
          <div className="w-full mt-4">
            <div className="text-center text-xs text-gray-500">Report · Privacy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
