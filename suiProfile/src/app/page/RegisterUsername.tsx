import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { pageMessages } from "../static/messages";
import { Toast } from "../models/toast";

export default function RegisterUsername() {
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
      showToast(pageMessages.registerUsername.maxUsernames, "error");
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
            showToast(pageMessages.registerUsername.success, "success");
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
              showToast(pageMessages.registerUsername.maxUsernames, "error");
            } else if (msg.includes("EUsernameAlreadyTaken")) {
              showToast(pageMessages.registerUsername.alreadyRegistered, "error");
            } else {
              showToast(pageMessages.registerUsername.error, "error");
            }
            setLoading(false);
          },
        }
      );
    } catch (error) {
      console.error("❌ Error preparing transaction:", error);
      showToast(pageMessages.registerUsername.transactionError, "error");
      setLoading(false);
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
      } catch (e) {
        console.warn("Kullanıcı adları alınamadı", e);
      }
    };
    load();
  }, [account, client, profileService]);

  if (!account) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-lime-400 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-black text-4xl">check</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pageMessages.registerUsername.success}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Redirecting to profile creation...</p>
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
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
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-black text-3xl font-bold">person_add</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{pageMessages.registerUsername.title}</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {pageMessages.registerUsername.subtitle}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <span className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">account_circle</span>
                {pageMessages.registerUsername.username} *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                  @
                </span>
                <input
                  className="w-full h-14 pl-9 pr-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all duration-200 font-medium"
                  placeholder={pageMessages.registerUsername.usernamePlaceholder}
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {pageMessages.registerUsername.usernameDescription}
              </p>
              
              {/* Availability Status */}
              {username.length >= 3 && (
                <div className="mt-3 flex items-center gap-2">
                  {checking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">{pageMessages.registerUsername.checking}</span>
                    </>
                  ) : available === true ? (
                    <>
                      <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                      <span className="text-sm text-green-500 font-medium">{pageMessages.registerUsername.available}</span>
                    </>
                  ) : available === false ? (
                    <>
                      <span className="material-symbols-outlined text-red-500 text-lg">cancel</span>
                      <span className="text-sm text-red-500 font-medium">{pageMessages.registerUsername.taken}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* Current Usernames */}
            {myUsernames.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Your Usernames:</p>
                <div className="flex gap-2 flex-wrap">
                  {myUsernames.map(u => (
                    <span key={u} className="px-3 py-1 rounded-full text-xs bg-lime-400 text-black">@{u}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {pageMessages.registerUsername.maxUsernames}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || !username || username.length < 3 || available === false || myUsernames.length >= maxUsernames}
                className={`h-14 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  (loading || !username || username.length < 3 || available === false || myUsernames.length >= maxUsernames)
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/30"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    {pageMessages.registerUsername.registering}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">person_add</span>
                    {pageMessages.registerUsername.register}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                disabled={loading}
                className="h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
              >
                {pageMessages.registerUsername.cancel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}