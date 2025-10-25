import { Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const THEME_KEY = "ui-theme";
const SHARE_BG_KEY = "share-bg";

export default function ShareLayout() {
  const prefersDark = useMemo(
    () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
    []
  );

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    return stored ?? (prefersDark ? "dark" : "light");
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
  }, [theme]);

  useEffect(() => {
    const onStorage = () => {
      const t = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
      if (t && t !== theme) setTheme(t);
      const bg = localStorage.getItem(SHARE_BG_KEY);
      if (bg) setShareBg(bg);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [theme]);

  return (
    <div className="min-h-dvh flex flex-col bg-background-light dark:bg-background-dark">
      <header className="py-5 px-4 sm:px-6 flex justify-center">
        <div className="w-full max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center dark:bg-white/80 dark:text-black">
              <span className="text-xs font-bold">SP</span>
            </div>
            <div className="text-sm font-semibold">SuiProfile</div>
          </div>
          <div className="text-xs text-white/80 dark:text-white/80 hidden sm:block">Paylaşılan Sayfa</div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="relative w-full max-w-xl backdrop-blur-sm bg-white/85 dark:bg-gray-900/75 rounded-3xl shadow-2xl border border-white/50 dark:border-white/10 p-5 sm:p-8 overflow-hidden">
          {/* Top banner only avatar-height and full card width */}
          <div className="absolute inset-x-0 top-0 h-28 rounded-t-3xl" style={{ background: shareBg }} />
          {/* Space below banner so content starts after it */}
          <div className="relative z-10 pt-28">
            <Outlet />
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-white/80 dark:text-white/70">
        © {new Date().getFullYear()} — SuiProfile
      </footer>
    </div>
  );
}


