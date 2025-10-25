import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

export default function PanelLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => [
      { label: "Profil", icon: "pi pi-user", to: "/panel/profile" },
      { label: "Linkler", icon: "pi pi-link", to: "/panel/links" },
      { label: "Temalar", icon: "pi pi-palette", to: "/panel/themes" },
      { label: "Analitik", icon: "pi pi-chart-line", to: "/panel/analytics" },
      { label: "Ayarlar", icon: "pi pi-cog", to: "/panel/settings" },
    ],
    []
  );

  return (
    <div className="min-h-dvh flex bg-background-light dark:bg-background-dark font-display text-charcoal dark:text-white">
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4 md:hidden">
          <button
            type="button"
            className="px-3 py-2 rounded-lg text-sm bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
            onClick={() => setOpen(true)}
          >
            <i className="pi pi-bars" /> Menü
          </button>
        </div>
        <Outlet />
      </main>

      {/* Persistent sidebar on md+ */}
      <aside className="hidden md:block w-72 border-l bg-white/70 dark:bg-gray-900/70 backdrop-blur p-4">
        <div className="sticky top-20">
          <h3 className="text-sm font-semibold mb-3">Panel Menüsü</h3>
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? "bg-gray-200 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <i className={`${item.icon} text-base`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-72 bg-white dark:bg-gray-900 border-l shadow-2xl z-50 p-4 transform transition-transform">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Panel Menüsü</h3>
              <button
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
              >
                <i className="pi pi-times" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {items.map((item) => (
                <button
                  key={item.to}
                  onClick={() => { navigate(item.to); setOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800/60"
                >
                  <i className={`${item.icon} text-base`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}


