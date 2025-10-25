import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";

export function Auth() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (account) {
      setChecking(true);
      setTimeout(() => {
        navigate("/dashboard");
        setChecking(false);
      }, 800);
    }
  }, [account, navigate]);

  if (account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            {/* Success Animation */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-lime-400 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-black text-4xl">check</span>
              </div>
            </div>


            {/* Wallet Address */}
            <div className="bg-gray-50 dark:bg-[#0D0D0D] rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">WALLET ADDRESS</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">{account.address}</p>
            </div>

            {/* Loading */}
            {checking && (
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Redirecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <div className="w-full max-w-xl pt-18 -mt-10">

        {/* Main Card */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-10">
          {/* Connect Wallet Message */}
          <div className="p-6 bg-gradient-to-br from-lime-400/10 to-emerald-500/10 rounded-2xl border-2 border-dashed border-lime-400/30 mb-6 text-center">
            <div className="w-16 h-16 bg-lime-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-lime-600 dark:text-lime-400 text-4xl">account_balance_wallet</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Use the <strong className="text-lime-600 dark:text-lime-400">"Connect Wallet"</strong> button above
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click the connect button in the top right corner to get started
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#1A1A1A] px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Google Button (Coming Soon) */}
          <button
            disabled
            className="w-full h-12 rounded-xl bg-gray-50 dark:bg-[#0D0D0D] border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 font-medium flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
          >
            <span className="material-symbols-outlined">language</span>
            <span>Continue with Google</span>
            <span className="text-xs ml-auto">(Soon)</span>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <span className="material-symbols-outlined text-lime-400 text-2xl mb-2 block">shield</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Secure</p>
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <span className="material-symbols-outlined text-lime-400 text-2xl mb-2 block">flash_on</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Fast</p>
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <span className="material-symbols-outlined text-lime-400 text-2xl mb-2 block">lock</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Private</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            By continuing, you agree to our{" "}
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}