import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSuiServices } from "../hooks/useSuiServices";
import type { ProfileData } from "../services/profileService";

export function Links() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const urlRegex = /^https?:\/\/(?:[a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}(?:\/\S*)?$/i;

  useEffect(() => {
    if (!account) {
      navigate("/");
      return;
    }
    loadProfiles();
  }, [account]);

  const loadProfiles = async () => {
    if (!account) return;
    try {
      setLoading(true);
      const ids = await profileService.getUserProfiles(client, account.address);
      const details = await Promise.all(ids.map((id) => profileService.getProfile(client, id)));
      const list = details.filter((p): p is ProfileData => p !== null);
      setProfiles(list);
      if (list.length > 0 && !selectedProfileId) {
        setSelectedProfileId(list[0].id);
        setSelectedProfile(list[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const found = profiles.find((p) => p.id === selectedProfileId) || null;
    setSelectedProfile(found);
  }, [selectedProfileId, profiles]);

  const handleAddLink = () => {
    if (!selectedProfileId) return;
    const tLabel = label.trim();
    const tUrl = url.trim();
    if (!tLabel || tLabel.length < 2) return;
    if (!(tUrl.startsWith("/") || urlRegex.test(tUrl))) return;

    setSaving(true);
    const tx = profileService.addLink(selectedProfileId, tLabel, tUrl);
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async () => {
          const p = await profileService.getProfile(client, selectedProfileId);
          if (p) {
            setSelectedProfile(p);
            setProfiles((prev) => prev.map((x) => (x.id === p.id ? p : x)));
          }
          setLabel("");
          setUrl("");
          setSaving(false);
        },
        onError: (e) => {
          console.error(e);
          setSaving(false);
        },
      }
    );
  };

  const handleRemoveLink = (linkLabel: string) => {
    if (!selectedProfileId) return;
    setSaving(true);
    const tx = profileService.removeLink(selectedProfileId, linkLabel);
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async () => {
          const p = await profileService.getProfile(client, selectedProfileId);
          if (p) {
            setSelectedProfile(p);
            setProfiles((prev) => prev.map((x) => (x.id === p.id ? p : x)));
          }
          setSaving(false);
        },
        onError: () => setSaving(false),
      }
    );
  };

  if (!account) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <p className="text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Profil Linkleri</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Seçtiğiniz profile link ekleyin veya kaldırın</p>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Önce bir profil oluşturun.</p>
          <button
            onClick={() => navigate("/profile/create")}
            className="h-11 px-5 rounded-full bg-lime-400 text-black font-bold shadow-lg shadow-lime-400/30 hover:bg-lime-300 transition"
          >
            Profil Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Profil seçimi + Link Ekleme */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Profil Seç */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Profil Seç</h3>
              <select
                className="w-full h-11 px-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.slug}
                  </option>
                ))}
              </select>
            </div>

            {/* Yeni Link Ekle */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Yeni Link Ekle</h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.currentTarget.value)}
                  maxLength={60}
                  className="h-11 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all"
                  placeholder="Başlık (ör. Instagram)"
                />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.currentTarget.value)}
                  maxLength={200}
                  className={`h-11 text-sm rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 outline-none transition-all ${
                    url && !(url.startsWith("/") || urlRegex.test(url))
                      ? "border-red-400 dark:border-red-500 focus:ring-4 focus:ring-red-400/20"
                      : "border-gray-200 dark:border-gray-700 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
                  }`}
                  placeholder="https://... veya /username/slug"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dış linkler <strong>https://</strong> ile başlamalı. İç linkler <strong>/username/slug</strong> formatında.
                </p>
                <button
                  type="button"
                  onClick={handleAddLink}
                  disabled={saving || !label || !(url.startsWith("/") || urlRegex.test(url))}
                  className={`h-11 w-full rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    saving || !label || !(url.startsWith("/") || urlRegex.test(url))
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/30"
                  }`}
                >
                  {saving && (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{saving ? "Ekleniyor..." : "Link Ekle"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Mevcut Linkler */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {selectedProfile?.slug || "Profil"}
              </h4>
              <span className="text-xs px-3 py-1 rounded-full bg-lime-400/10 text-lime-600 dark:text-lime-400 font-medium">
                {selectedProfile?.links.size ?? 0} link
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {selectedProfile && selectedProfile.links.size > 0 ? (
                Array.from(selectedProfile.links).map(([l, u]) => (
                  <li
                    key={l}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 hover:border-lime-400/50 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{l}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u}</div>
                    </div>
                    <button
                      type="button"
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
                      onClick={() => handleRemoveLink(l)}
                      disabled={saving}
                    >
                      Sil
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  Bu profilde henüz link yok. Sol taraftan ekleyin.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
