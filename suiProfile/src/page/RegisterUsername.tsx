import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export function RegisterUsername() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { profileService, client } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [myUsernames, setMyUsernames] = useState<string[]>([]);
  const maxUsernames = 3;
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const owner = await profileService.getUsernameOwner(client, value);
      setAvailable(owner === null);
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(sanitized);
    
    if (sanitized.length >= 3) {
      checkUsername(sanitized);
    } else {
      setAvailable(null);
    }
  };

  const handleRegister = async () => {
    if (!account || !username || username.length < 3) return;
    if (myUsernames.length >= maxUsernames) {
      showToast("En fazla 3 kullanıcı adı ekleyebilirsiniz", "error");
      return;
    }

    console.log("Registering username:", username);

    setLoading(true);
    setError("");

    try {
      const tx = profileService.registerUsername(username);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async () => {
            console.log("✅ Username registered successfully");
            showToast("Kullanıcı adı başarıyla kaydedildi!", "success");
            setSuccess(true);
            setLoading(false);
            try {
              const list = await profileService.listMyUsernames(client, account.address);
              setMyUsernames(list);
            } catch {}
            setTimeout(() => {
              navigate("/profile/create");
            }, 2000);
          },
          onError: (error) => {
            console.error("❌ Error registering username:", error);
            const msg = (error as any)?.message || "";
            if (msg.includes("EUsernameLimitReached") || msg.toLowerCase().includes("limit") ) {
              showToast("En fazla 3 kullanıcı adı ekleyebilirsiniz", "error");
            } else if (msg.includes("EUsernameAlreadyTaken")) {
              showToast("Kullanıcı adı alınmış", "error");
            } else {
              showToast("Kullanıcı adı kaydedilemedi", "error");
            }
            setLoading(false);
          },
        }
      );
    } catch (error) {
      console.error("❌ Error preparing transaction:", error);
      showToast("İşlem hazırlanamadı", "error");
      setLoading(false);
    }
  };

  if (!account) {
    navigate("/");
    return null;
  }

  useEffect(() => {
    const load = async () => {
      if (!account) return;
      try {
        const list = await profileService.listMyUsernames(client, account.address);
        setMyUsernames(list);
      } catch (e) {
        console.warn("Kullanıcı adları listelenemedi (boş olabilir)", e);
      }
    };
    load();
  }, [account, client, profileService]);

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
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-black text-3xl font-bold">person_add</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Kullanıcı Adı Oluştur</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Bu kullanıcı adı tüm profillerinizde temel olarak kullanılacak
            </p>
          </div>

          {/* My Usernames Section */}
          <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Kullanıcı Adlarım</p>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                myUsernames.length >= maxUsernames 
                  ? "bg-red-500/20 text-red-600 dark:text-red-400" 
                  : "bg-lime-400/20 text-lime-600 dark:text-lime-400"
              }`}>
                {myUsernames.length}/{maxUsernames}
              </span>
            </div>
            {myUsernames.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Henüz kullanıcı adınız yok</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {myUsernames.map((n) => (
                  <span key={n} className="px-4 py-2 rounded-xl text-sm font-medium bg-lime-400/10 text-lime-600 dark:text-lime-400 border border-lime-400/20">
                    @{n}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600">error</span>
              <span className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-2xl border border-lime-500/30 bg-lime-500/10 p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-lime-600">check_circle</span>
              <span className="text-sm text-lime-600 dark:text-lime-400 flex-1">
                Kullanıcı adı başarıyla kaydedildi! Profil oluşturma sayfasına yönlendiriliyorsunuz...
              </span>
            </div>
          )}

          {/* Username Input */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">
              Kullanıcı Adı Seç
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                @
              </span>
              <input
                className="w-full h-14 pl-9 pr-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="ornek-kullanici"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                disabled={loading || myUsernames.length >= maxUsernames}
              />
            </div>
            
            {/* Validation Messages */}
            <div className="flex items-center gap-2 mt-3 min-h-[20px]">
              {checking && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="text-sm">Kontrol ediliyor...</span>
                </div>
              )}
              {available === true && (
                <div className="flex items-center gap-2 text-lime-600 dark:text-lime-400">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span className="text-sm font-medium">Kullanılabilir</span>
                </div>
              )}
              {available === false && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  <span className="text-sm font-medium">Bu kullanıcı adı alınmış</span>
                </div>
              )}
              {myUsernames.length >= maxUsernames && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span className="text-sm font-medium">Limit dolu (3)</span>
                </div>
              )}
            </div>
            
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              En az 3 karakter. Sadece küçük harf, rakam ve tire (-) kullanılabilir.
            </p>
          </div>

          {/* Warning Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 flex-shrink-0">warning</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">Önemli Not</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Kullanıcı adınızı bir kere seçtikten sonra değiştiremezsiniz. Lütfen dikkatli seçin.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={handleRegister}
              disabled={loading || !username || username.length < 3 || available !== true || myUsernames.length >= maxUsernames}
              className={`h-14 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                (loading || !username || username.length < 3 || available !== true || myUsernames.length >= maxUsernames)
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/30"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">check</span>
                  Kullanıcı Adını Kaydet
                </>
              )}
            </button>
            <button
              onClick={() => navigate("/")}
              disabled={loading}
              className="h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
            >
              İptal
            </button>
          </div>

          {/* Example Usage Box */}
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">info</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Örnek Kullanım</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Kullanıcı adınız:</span>
                <code className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-mono">ahmet</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Ana profil:</span>
                <code className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-mono">ahmet-main</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Kategori profil:</span>
                <code className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-mono">ahmet-sosyal</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}