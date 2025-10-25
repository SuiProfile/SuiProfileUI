import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { THEMES } from "../static/themes";
import { pageMessages } from "../static/messages";
import { Toast } from "../models/toast";

export default function CreateProfile() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { profileService, client, walrusService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [formData, setFormData] = useState({
    username: "",
    slug: "",
    avatarCid: "",
    bio: "",
    theme: "dark",
    isCategory: false,
    parentSlug: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [myUsernames, setMyUsernames] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !formData.slug || !formData.username) return;

    console.log("Creating profile:", formData);

    setLoading(true);
    setError("");

    try {
      const tx = profileService.createProfile({
        username: formData.username,
        slug: formData.slug,
        avatarCid: formData.avatarCid,
        bio: formData.bio,
        theme: formData.theme,
        isCategory: formData.isCategory,
        parentSlug: formData.parentSlug,
      });

      console.log("Real transaction:", tx);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log("✅ Profile created:", result);
            showToast(pageMessages.createProfile.success, "success");
            setLoading(false);
            
            setTimeout(() => {
              navigate("/dashboard");
            }, 1500);
          },
          onError: (error) => {
            console.error("❌ Error creating profile:", error);
            showToast(pageMessages.createProfile.error, "error");
            setLoading(false);
          },
        }
      );
    } catch (error) {
      console.error("❌ Error preparing transaction:", error);
      showToast(pageMessages.createProfile.transactionError, "error");
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("📁 File selected:", {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    try {
      setUploading(true);
      console.log("🚀 Starting upload...");
      
      const cid = await walrusService.upload(file);
      console.log("✅ Upload successful, CID:", cid);
      
      handleChange("avatarCid", cid);
      showToast(pageMessages.createProfile.imageUploadSuccess, "success");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      
      let errorMessage = pageMessages.createProfile.imageUploadError;
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      showToast(errorMessage, "error");
      setAvatarPreview("");
    } finally {
      setUploading(false);
    }
  };
  
  useEffect(() => {
    if (!account) {
      navigate("/");
    }
  }, [account, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!account) return;
      try {
        const list = await profileService.listMyUsernames(client, account.address);
        setMyUsernames(list);
        if (!formData.username && list.length > 0) {
          setFormData(prev => ({ ...prev, username: list[0] }));
        }
      } catch (e) {
        console.warn("Kullanıcı adları alınamadı", e);
      }
    };
    load();
  }, [account, client, profileService]);

  if (!account) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
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

      {/* Main Card */}
      <div className="w-full max-w-3xl">
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-black text-3xl font-bold">add_circle</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{pageMessages.createProfile.title}</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {pageMessages.createProfile.subtitle}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <span className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="relative">
                  {avatarPreview || formData.avatarCid ? (
                    <img
                      src={avatarPreview || walrusService.buildUrl(formData.avatarCid)}
                      alt="Avatar"
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-lime-400"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">person</span>
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
                    {uploading ? pageMessages.createProfile.uploading : pageMessages.createProfile.avatarUpload}
                  </div>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {pageMessages.createProfile.avatarDescription}
                </p>
              </div>

              {/* Username Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                  {pageMessages.createProfile.username} *
                </label>
                {myUsernames.length > 0 ? (
                  <select
                    className="w-full h-14 px-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200 font-medium"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    required
                  >
                    {myUsernames.map((u) => (
                      <option key={u} value={u}>@{u}</option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                      @
                    </span>
                    <input
                      className="w-full h-14 pl-9 pr-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200 font-medium"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      required
                    />
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {pageMessages.createProfile.usernameRequired}
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">link</span>
                  {pageMessages.createProfile.profileSlug} *
                </label>
                <input
                  className="w-full h-14 px-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200 font-medium"
                  placeholder="main"
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                />
                <div className="mt-2 p-3 bg-lime-400/10 rounded-xl border border-lime-400/20">
                  <p className="text-xs text-lime-600 dark:text-lime-400 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">link</span>
                    {pageMessages.createProfile.profileUrl} {formData.username ? `/${formData.username}/${formData.slug || "<slug>"}` : "/<username>/<slug>"}
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">description</span>
                  {pageMessages.createProfile.bio}
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200 resize-none"
                  placeholder={pageMessages.createProfile.bioPlaceholder}
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={4}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {formData.bio.length}/500 {pageMessages.createProfile.bioCharacterCount}
                </p>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">palette</span>
                  {pageMessages.createProfile.themeSelection}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => handleChange("theme", theme.value)}
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

              {/* Category Profile Toggle */}
              <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                <label className="flex items-start gap-4 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isCategory}
                      onChange={(e) => handleChange("isCategory", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:bg-lime-400 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{pageMessages.createProfile.categoryProfile}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pageMessages.createProfile.categoryProfileDescription}
                    </p>
                  </div>
                </label>
              </div>

              {/* Parent Slug (if category) */}
              {formData.isCategory && (
                <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                  <label className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-3 block flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">account_tree</span>
                    {pageMessages.createProfile.parentSlug}
                  </label>
                  <input
                    className="w-full h-14 px-4 rounded-2xl border-2 border-amber-500/30 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-200 font-medium"
                    placeholder={pageMessages.createProfile.parentSlugPlaceholder}
                    value={formData.parentSlug}
                    onChange={(e) => handleChange("parentSlug", e.target.value)}
                  />
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    {pageMessages.createProfile.parentSlugDescription}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !formData.username || !formData.slug}
                  className={`h-14 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                    (loading || !formData.username || !formData.slug)
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/30"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      {pageMessages.createProfile.creating}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">add_circle</span>
                      {pageMessages.createProfile.createButton}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  disabled={loading}
                  className="h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
                >
                  {pageMessages.createProfile.cancel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
