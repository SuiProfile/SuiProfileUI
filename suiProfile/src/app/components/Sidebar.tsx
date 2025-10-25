import { ConnectButton } from "@mysten/dapp-kit";
import { Link, useLocation } from "react-router-dom";
import { navigationMessages } from "../static/messages";

function NavItem({ to, icon, label, badge }: { to: string; icon: string; label: string; badge?: string }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group ${
        active
          ? "bg-lime-400/20 text-lime-400 font-semibold"
          : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
      }`}
    >
      <span className={`material-symbols-outlined mr-3 text-xl ${active ? "text-lime-400" : "group-hover:text-gray-200"}`}>
        {icon}
      </span>
      <span className="text-[15px]">{label}</span>
      {badge && (
        <span className="ml-auto bg-lime-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const logoUrl = (import.meta as any).env?.VITE_APP_LOGO_URL as string | undefined;
  return (
    <aside className="hidden md:flex md:w-64 flex-col justify-between bg-[#1A1A1A] border-r border-gray-800 p-4 h-screen sticky top-0">
      {/* Header */}
      <div>
        <div className="flex items-center mb-8 px-2">
          <Link to="/" className="flex items-center">
            {logoUrl ? (
              <div className="flex justify-center w-full">
                <img src={logoUrl} alt="logo" className="w-[120px] h-[60px] object-contain mx-auto" />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-black font-bold text-xl">account_circle</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-base">{navigationMessages.sidebar.appName}</h1>
                  <p className="text-gray-500 text-xs">{navigationMessages.sidebar.tagline}</p>
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          <NavItem to="/my-profiles" icon="account_circle" label={navigationMessages.navItems.myProfiles} />
          <NavItem to="/dashboard" icon="dashboard" label={navigationMessages.navItems.dashboard} />
          <NavItem to="/stats" icon="insights" label={navigationMessages.navItems.analytics} badge={navigationMessages.badges.beta} />
          <NavItem to="/links" icon="link" label={navigationMessages.navItems.links} />
        </nav>

        {/* Tools Section */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
            {navigationMessages.sidebar.tools}
          </h3>
          <nav className="space-y-1">
            <NavItem to="/settings" icon="settings" label={navigationMessages.navItems.settings} />
          </nav>
        </div>
      </div>

      {/* Footer Section - Wallet Connection */}
      <div className="w-full">
        <ConnectButton />
      </div>
    </aside>
  );
}
