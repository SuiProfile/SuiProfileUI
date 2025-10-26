import { useEffect, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate, useParams } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { ProfileData } from "../models/entity/profile-data";

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const THEMES = [
  { value: "dark", label: "Dark", icon: "dark_mode" },
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "blue", label: "Blue", icon: "water_drop" },
  { value: "green", label: "Green", icon: "eco" },
  { value: "purple", label: "Purple", icon: "palette" },
  { value: "pink", label: "Pink", icon: "favorite" }
];

export default function EditProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService, walrusService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    bio: "",
    avatarCid: "",
    theme: "dark",
  });

  const [newLink, setNewLink] = useState({ label: "", url: "" });
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!account || !profileId) {
      navigate("/");
      return;
    }
    loadProfile();
  }, [account, profileId]);

  const loadProfile = async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      const data = await profileService.getProfile(client, profileId);
      
      if (!data) {
        setError("Profil bulunamadı");
        return;
      }

      if (data.owner !== account?.address) {
        setError("Bu profili düzenleme yetkiniz yok");
        return;
      }

      setProfile(data);
      setFormData({
        bio: data.bio,
        avatarCid: data.avatarCid,
        theme: data.theme,
      });
      
      if (data.avatarCid) {
        setAvatarPreview(walrusService.buildUrl(data.avatarCid));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileId) return;

    setSaving(true);
    setError("");

    try {
      const tx = profileService.updateProfile(profileId, formData);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            showToast("Profil güncellendi", "success");
            loadProfile();
            setSaving(false);
          },
          onError: (error) => {
            console.error("Error updating profile:", error);
            showToast("Profil güncellenemedi", "error");
            setSaving(false);
          },
        }
      );
    } catch (error) {
      console.error("Error preparing transaction:", error);
      showToast("İşlem hazırlanamadı", "error");
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!profileId || !newLink.label || !newLink.url) {
      showToast("Lütfen tüm alanları doldurun", "error");
      return;
    }

    setSaving(true);

    try {
      const tx = profileService.addLink(profileId, newLink.label, newLink.url);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            showToast("Link eklendi", "success");
            setNewLink({ label: "", url: "" });
            loadProfile();
            setSaving(false);
          },
          onError: (error) => {
            console.error("Error adding link:", error);
            showToast("Link eklenemedi", "error");
            setSaving(false);
          },
        }
      );
    } catch (error) {
      console.error("Error preparing transaction:", error);
      showToast("İşlem hazırlanamadı", "error");
      setSaving(false);
    }
  };

  const handleRemoveLink = async (label: string) => {
    if (!profileId) return;

    setSaving(true);

    try {
      const tx = profileService.removeLink(profileId, label);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            showToast("Link silindi", "success");
            loadProfile();
            setSaving(false);
          },
          onError: (error) => {
            console.error("Error removing link:", error);
            showToast("Link silinemedi", "error");
            setSaving(false);
          },
        }
      );
    } catch (error) {
      console.error("Error preparing transaction:", error);
      showToast("İşlem hazırlanamadı", "error");
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    try {
      setUploading(true);
      const cid = await walrusService.upload(file);
      setFormData(prev => ({ ...prev, avatarCid: cid }));
      showToast("Görsel yüklendi", "success");
    } catch (err) {
      console.error(err);
      showToast("Yükleme başarısız", "error");
      setAvatarPreview("");
    } finally {
      setUploading(false);
    }
  };

  if (!account || !profileId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-500 dark:text-gray-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <span className="material-symbols-outlined text-red-500 text-6xl mb-4 block">error</span>
            <h2 className="text-red-500 text-xl font-bold mb-3">{error}</h2>
            <button
              onClick={() => navigate("/dashboard")}
              className="h-12 px-6 rounded-2xl bg-lime-400 text-black font-semibold hover:bg-lime-300 transition-all"
            >
              Dashboard'a Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed left-1/2 bottom-8 -translate-x-1/2 z-50 min-w-[280px] px-6 py-3.5 rounded-2xl font-semibold text-sm shadow-2xl ${
            toast.type === "error" 
              ? "bg-red-500 text-white" 
              : "bg-lime-400 text-black"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {toast.type === "error" ? "error" : "check_circle"}
            </span>
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Profil Düzenle</h1>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lime-400 text-sm">link</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">/{profile?.slug}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="h-11 px-5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Dashboard
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Profile Info */}
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-lime-400/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-lime-600 dark:text-lime-400">image</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Avatar</h3>
              </div>

              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="relative">
                  {avatarPreview || formData.avatarCid ? (
                    <img
                      src={avatarPreview || walrusService.buildUrl(formData.avatarCid)}
                      alt="Avatar"
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-lime-400"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-6xl">person</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="px-6 py-2.5 bg-lime-400/10 hover:bg-lime-400/20 text-lime-600 dark:text-lime-400 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 border border-lime-400/20">
                    <span className="material-symbols-outlined text-lg">upload</span>
                    {uploading ? "Yükleniyor..." : "Avatar Değiştir"}
                  </div>
                </label>
              </div>
            </div>

            {/* Bio Section */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-400/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">description</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Biyografi</h3>
              </div>

              <textarea
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200 resize-none"
                placeholder="Kendinizi tanıtın..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={5}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {formData.bio.length}/500 karakter
              </p>
            </div>

            {/* Theme Selection */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">palette</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tema Seçimi</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, theme: theme.value }))}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                      formData.theme === theme.value
                        ? "border-lime-400 bg-lime-400/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-2xl ${
                        formData.theme === theme.value ? "text-lime-600 dark:text-lime-400" : "text-gray-400"
                      }`}>
                        {theme.icon}
                      </span>
                      <span className={`font-medium text-sm ${
                        formData.theme === theme.value 
                          ? "text-lime-600 dark:text-lime-400" 
                          : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {theme.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className={`w-full h-14 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                saving
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/30"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>

          {/* Right Column - Links */}
          <div className="space-y-6">
            {/* Add Link Section */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">add_link</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Yeni Link Ekle</h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
                  {profile?.links.size || 0} / 10
                </span>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Link Adı (örn: Instagram)"
                  value={newLink.label}
                  onChange={(e) => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200"
                />
                <input
                  type="url"
                  placeholder="URL (https://...)"
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200"
                />
                <button
                  onClick={handleAddLink}
                  disabled={saving || !newLink.label || !newLink.url}
                  className={`w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    (saving || !newLink.label || !newLink.url)
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-lime-400 text-black hover:bg-lime-300"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Link Ekle
                </button>
              </div>
            </div>

            {/* Links List */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-400/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">link</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Linklerim</h3>
              </div>

              <div className="space-y-3">
                {profile && profile.links.size === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-6xl mb-3 block">link_off</span>
                    <p className="text-sm text-gray-400 dark:text-gray-600">Henüz link eklenmemiş</p>
                  </div>
                ) : (
                  Array.from(profile?.links || []).map(([label, url]) => (
                    <div
                      key={label}
                      className="group flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-lime-400 transition-all duration-200"
                    >
                      <div className="w-10 h-10 bg-lime-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-lime-600 dark:text-lime-400 text-lg">open_in_new</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{url}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveLink(label)}
                        disabled={saving}
                        className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}