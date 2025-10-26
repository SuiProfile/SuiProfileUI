// src/app/layouts/PublicLayout.tsx
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  const logoUrl = (import.meta as any).env?.VITE_APP_LOGO_URL as string | undefined;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="flex items-center justify-between p-4">
        {logoUrl ? (
          <img src={logoUrl} alt="logo" className="h-10 w-auto object-contain" />
        ) : (
          <div className="h-10" />
        )}
      </div>
      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
