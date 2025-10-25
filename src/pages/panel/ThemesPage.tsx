import { useEffect, useMemo, useState } from "react";

const THEME_KEY = "ui-theme"; // light | dark
const SHARE_BG_KEY = "share-bg"; // css background string

export default function ThemesPage() {
  const prefersDark = useMemo(
    () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
    []
  );

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    if (stored) return stored;
    return prefersDark ? "dark" : "light";
  });

  const [shareBg, setShareBg] = useState<string>(() => {
    return (
      localStorage.getItem(SHARE_BG_KEY) ||
      "linear-gradient(135deg, #2665D6 0%, #E6291B 60%, #D2E823 100%)"
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SHARE_BG_KEY, shareBg);
  }, [shareBg]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tema Ayarları</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Uygulamanın görünümünü ve paylaşılacak sayfanın arka planını buradan yönetin.
        </p>
      </div>

      <div className="pt-6">
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold">Karanlık / Aydınlık Mod</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tercihiniz tüm uygulamaya uygulanır.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className={`relative w-28 h-14 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                }`}
              aria-label="Tema değiştir"
            >
              <div
                className={`absolute top-1 bottom-1 w-12 rounded-full bg-white dark:bg-gray-700 shadow transition-transform flex items-center justify-center text-lg ${theme === "dark" ? "translate-x-14" : "translate-x-1"
                  }`}
              >
                <i className={`pi ${theme === "dark" ? "pi-moon" : "pi-sun"}`} />
              </div>
            </button>
          </div>
        </section>
      </div>

      <div className="py-6">
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg font-semibold">Paylaşılan Sayfa Arka Planı</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bir gradyan seçin.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Presets - horizontal scroll (10 öneri) */}
            <div className="lg:col-span-3">
              <div className="-mx-2 px-2 overflow-x-auto pb-1">
                <div className="flex gap-3 min-w-max">
                  {[
                    "linear-gradient(135deg, #2665D6 0%, #E6291B 60%, #D2E823 100%)",
                    "linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)",
                    "linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)",
                    "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
                    "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                    "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
                    "linear-gradient(135deg, #9333EA 0%, #DB2777 100%)",
                    "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
                    "linear-gradient(135deg, #2DD4BF 0%, #4F46E5 100%)",
                    "linear-gradient(135deg, #84CC16 0%, #22C55E 100%)",
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setShareBg(preset)}
                      className={`h-12 w-28 shrink-0 rounded-lg border ${shareBg === preset
                        ? "border-[#2665D6] ring-2 ring-[#2665D6]/40"
                        : "border-gray-300 dark:border-gray-700"
                        }`}
                      style={{ background: preset }}
                      aria-label={`Preset ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-3 text-xs text-gray-500 dark:text-gray-400">Önizleme</div>
            <div className="h-56 sm:h-72 flex items-center justify-center" style={{ background: shareBg }}>
              <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/60 rounded-xl px-6 py-4 shadow">
                <div className="text-sm text-gray-600 dark:text-gray-300">@kullaniciadi</div>
                <div className="text-xl font-bold">Profil Önizleme</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


