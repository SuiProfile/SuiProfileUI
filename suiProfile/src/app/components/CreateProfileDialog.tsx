import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { Toast } from "../models/toast";
import { THEMES } from "../static/themes";

type CreateProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (result: any) => void;
  autoNavigateOnSuccess?: boolean;
};

export function CreateProfileDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProfileDialogProps) {
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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      showToast("Image uploaded successfully", "success");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      
      let errorMessage = "Upload failed";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      showToast(errorMessage, "error");
      setAvatarPreview("");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !formData.slug || !formData.username) return;

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

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            showToast("Profile created successfully!", "success");
            setLoading(false);
            onCreated?.(result);
            onOpenChange(false);
          },
          onError: (err) => {
            console.error("❌ Error creating profile:", err);
            showToast("Profile creation failed", "error");
            setLoading(false);
          },
        }
      );
    } catch (err) {
      console.error("❌ Error preparing transaction:", err);
      showToast("Transaction preparation failed", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account && open) {
      onOpenChange(false);
    }
  }, [account, open, navigate, onOpenChange]);

  useEffect(() => {
    const load = async () => {
      if (!account) return;
      try {
        const list = await profileService.listMyUsernames(client, account.address);
        setMyUsernames(list);
        if (!formData.username && list.length > 0) {
          setFormData((prev) => ({ ...prev, username: list[0] }));
        }
      } catch (e) {
          console.warn("Usernames not loaded successfully", e);
      }
    };
    load();
  }, [account, client, profileService, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay: dark, soft fade */}
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />

        {/* Content: dark-first */}
        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2
            rounded-3xl border border-neutral-800
            bg-[#1A1A1A] p-6 md:p-8 shadow-2xl
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
            data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
            focus:outline-none
          "
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="text-left">
              <div className="w-14 h-14 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-black text-2xl font-bold">add_circle</span>
              </div>
              <Dialog.Title className="text-2xl md:text-3xl font-bold text-neutral-100">
                Create New Profile
              </Dialog.Title>
              <Dialog.Description className="text-neutral-400 mt-1">
                Create your Linktree profile and share your links
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                className="h-10 w-10 rounded-xl border border-neutral-800 hover:bg-neutral-800/60 transition flex items-center justify-center text-neutral-300"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </Dialog.Close>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`fixed left-1/2 bottom-8 -translate-x-1/2 z-[60] min-w-[280px] px-6 py-3.5 rounded-2xl font-semibold text-sm shadow-2xl ${
                toast.type === "error" ? "bg-red-500 text-white" : "bg-lime-400 text-black"
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

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-400">error</span>
              <span className="text-sm text-red-400 flex-1">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-neutral-800 bg-[#141414]">
              <div className="relative">
                {avatarPreview || formData.avatarCid ? (
                  <img
                    src={avatarPreview || (formData.avatarCid ? walrusService.buildUrl(formData.avatarCid) : "")}
                    alt="Avatar"
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-lime-400"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-neutral-400 text-5xl">person</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                <div className="px-6 py-2.5 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 border border-lime-400/20">
                  <span className="material-symbols-outlined text-lg">upload</span>
                  {uploading ? "Uploading..." : "Upload Avatar"}
                </div>
              </label>
              <p className="text-xs text-neutral-400 text-center">PNG, JPG or GIF - Maximum 5MB</p>
            </div>

            {/* Username */}
            <div>
              <label className="text-sm font-semibold text-neutral-100 mb-3 block flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-neutral-300">account_circle</span>
                Username *
              </label>
              {myUsernames.length > 0 ? (
                <select
                  className="w-full h-14 px-4 rounded-2xl border border-neutral-800 bg-[#141414] text-neutral-100 outline-none focus:border-lime-400/70 focus:ring-4 focus:ring-lime-400/10 transition-all duration-200 font-medium"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  required
                >
                  {myUsernames.map((u) => (
                    <option key={u} value={u} className="bg-[#141414]">
                      @{u}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">@</span>
                  <input
                    className="w-full h-14 pl-9 pr-4 rounded-2xl border border-neutral-800 bg-[#141414] text-neutral-100 outline-none focus:border-lime-400/70 focus:ring-4 focus:ring-lime-400/10 transition-all duration-200 font-medium"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) =>
                      handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    required
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-neutral-500">Select the username you registered</p>
            </div>

            {/* Slug */}
            <div>
              <label className="text-sm font-semibold text-neutral-100 mb-3 block flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-neutral-300">link</span>
                Profile Slug *
              </label>
              <input
                className="w-full h-14 px-4 rounded-2xl border border-neutral-800 bg-[#141414] text-neutral-100 outline-none focus:border-lime-400/70 focus:ring-4 focus:ring-lime-400/10 transition-all duration-200 font-medium"
                placeholder="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
              />
              <div className="mt-2 p-3 rounded-xl border border-lime-400/20 bg-lime-400/5">
                <p className="text-xs text-lime-400 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">link</span>
                  Profile URL: {formData.username ? `/${formData.username}/${formData.slug || "<slug>"}` : "/<username>/<slug>"}
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-semibold text-neutral-100 mb-3 block flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-neutral-300">description</span>
                  Bio
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-2xl border border-neutral-800 bg-[#141414] text-neutral-100 outline-none focus:border-lime-400/70 focus:ring-4 focus:ring-lime-400/10 transition-all duration-200 resize-none"
                placeholder="Introduce yourself..."
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="mt-2 text-xs text-neutral-500">{formData.bio.length}/500 characters</p>
            </div>

            {/* Theme */}
            <div>
              <label className="text-sm font-semibold text-neutral-100 mb-3 block flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-neutral-300">palette</span>
                Theme Selection
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => handleChange("theme", theme.value)}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      formData.theme === theme.value
                        ? "border-lime-400 bg-lime-400/5"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-2xl ${
                          formData.theme === theme.value ? "text-lime-400" : "text-neutral-500"
                        }`}
                      >
                        {theme.icon}
                      </span>
                      <span
                        className={`font-medium text-sm ${
                          formData.theme === theme.value ? "text-lime-400" : "text-neutral-300"
                        }`}
                      >
                        {theme.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Toggle */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-[#141414]">
              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isCategory}
                    onChange={(e) => handleChange("isCategory", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:bg-lime-400 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-100 mb-1">Category Profile</p>
                  <p className="text-xs text-neutral-500">Create a category profile linked to your main profile</p>
                </div>
              </label>
            </div>

            {/* Parent Slug */}
            {formData.isCategory && (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                <label className="text-sm font-semibold text-amber-300 mb-3 block flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">account_tree</span>
                  Main Profile Slug
                </label>
                <input
                  className="w-full h-14 px-4 rounded-2xl border border-amber-500/30 bg-[#141414] text-neutral-100 outline-none focus:border-amber-400/70 focus:ring-4 focus:ring-amber-400/10 transition-all duration-200 font-medium"
                  placeholder="username-main"
                  value={formData.parentSlug}
                  onChange={(e) => handleChange("parentSlug", e.target.value)}
                />
                <p className="mt-2 text-xs text-amber-300/80">The slug of the main profile this category is linked to</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !formData.username || !formData.slug}
                className={`h-12 md:h-14 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  loading || !formData.username || !formData.slug
                    ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                    : "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/30"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add_circle</span>
                    Create Profile
                  </> 
                )}
              </button>

              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={loading}
                  className="h-12 md:h-14 rounded-2xl border border-neutral-800 text-neutral-300 font-medium hover:bg-neutral-800/60 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
