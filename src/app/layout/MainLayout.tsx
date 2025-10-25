import { Outlet, Link, useLocation } from "react-router-dom";
import { useMemo } from "react";

export default function MainLayout() {
  const { pathname } = useLocation();
  const menu = useMemo(
    () => [
      { label: "Ürünler", to: "/products" },
      { label: "Şablonlar", to: "/templates" },
      { label: "Pazar yeri", to: "/marketplace" },
      { label: "Öğrenmek", to: "/learn" },
      { label: "Fiyatlandırma", to: "/pricing" },
    ],
    []
  );

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 w-[98%] sm:w-5/6 md:w-2/3 rounded-xl border border-gray-200 shadow-lg">
        <div className="w-full px-2 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-center">
          <div className="w-full flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-white">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">SuiProfile</h2>
                </div>
              </Link>
            </div>

            {/* Mobile Menu Hamburger */}
            <div className="flex items-center md:hidden">
              {/* You could add state for mobile menu expand/collapse if needed later */}
              <button
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-primary focus:outline-none"
                aria-label="Menu"
                onClick={() => {
                  // Implement mobile menu logic if necessary
                  const mobileMenu = document.getElementById("main-mobile-menu");
                  if (mobileMenu) mobileMenu.classList.toggle("hidden");
                }}
              >
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </button>
            </div>

            {/* Navigation Links - Desktop */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-8">
              {menu.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  className={`text-sm font-medium text-white hover:text-primary transition-colors ${pathname === m.to ? "text-primary" : ""
                    }`}
                >
                  {m.label}
                </Link>
              ))}
            </nav>

            {/* Call-to-Action Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 z-[101] relative">
              <Link to="/auth">
                <button
                  type="button"
                  className="bg-gray-200 text-black border-0 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors text-xs sm:text-sm"
                >
                  Giriş yapmak
                </button>
              </Link>
              <Link to="/auth">
                <button
                  type="button"
                  className="bg-black text-white border-0 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-xs sm:text-sm"
                >
                  Ücretsiz kaydolun
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          id="main-mobile-menu"
          className="md:hidden absolute top-[100%] left-0 w-full bg-[#222] rounded-b-xl shadow-lg border-t border-gray-700 flex flex-col gap-1 py-3 px-3 z-50 hidden"
        >
          <nav className="flex flex-col gap-2 mb-3">
            {menu.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className={`text-sm font-medium text-white hover:text-primary transition-colors rounded px-2 py-2 ${pathname === m.to ? "text-primary" : ""
                  }`}
                onClick={() => {
                  // Close menu on click
                  const mobileMenu = document.getElementById("main-mobile-menu");
                  if (mobileMenu) mobileMenu.classList.add("hidden");
                }}
              >
                {m.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
            <Link to="/auth">
              <button
                type="button"
                className="bg-gray-200 text-black border-0 px-3 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors text-xs"
              >
                Giriş yapmak
              </button>
            </Link>
            <Link to="/auth">
              <button
                type="button"
                className="bg-black text-white border-0 px-3 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-xs"
              >
                Ücretsiz kaydolun
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-27 bg-[#1a202c]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="h-12 flex items-center justify-center text-xs text-gray-500 border-t bg-[#1a202c]">
        © {new Date().getFullYear()} — SuiProfile
      </footer>
    </div>
  );
}
