// src/app/layouts/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
