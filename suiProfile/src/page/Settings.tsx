import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Settings() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  if (!account) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Ayarlar</h1>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-400 text-sm">settings</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">Hesap ve uygulama ayarlarınız</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Panel - Hesap Bilgileri */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lime-400">account_circle</span>
              Hesap Bilgileri
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cüzdan Adresi</label>
                <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg mt-1">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ağ</label>
                <p className="text-sm text-gray-900 dark:text-white">Sui Testnet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Panel - Ayarlar */}
        <div className="lg:col-span-2">
          <div className="space-y-6">

            {/* Bildirim Ayarları */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lime-400">notifications</span>
                Bildirim Ayarları
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Bildirimler</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Yeni etkileşimler için bildirim al</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 dark:peer-focus:ring-lime-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-lime-400"></div>
                  </label>
                </div>
              </div>
            </div>


            {/* Hakkında */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lime-400">info</span>
                Hakkında
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Versiyon</span>
                  <span className="text-sm text-gray-900 dark:text-white">1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ağ</span>
                  <span className="text-sm text-gray-900 dark:text-white">Sui Testnet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Son Güncelleme</span>
                  <span className="text-sm text-gray-900 dark:text-white">Bugün</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
