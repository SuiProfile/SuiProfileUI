import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-background-light dark:bg-background-dark font-display text-charcoal dark:text-white">
      <header className="w-full px-6 py-4 flex items-center justify-center">
        <div className="w-full max-w-6xl flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            SuiProfile*
          </Link>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      <footer className="h-12 flex items-center justify-center text-xs text-gray-500 border-t">
        © {new Date().getFullYear()} — SuiProfile
      </footer>
    </div>
  );
}


