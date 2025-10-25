import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ConnectButton } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect } from "react";
import { Auth } from "./page/Auth";
import { Dashboard } from "./page/Dashboard";
import { RegisterUsername } from "./page/RegisterUsername";
import { CreateProfile } from "./page/CreateProfile";
import { EditProfile } from "./page/EditProfile";
import { PublicProfile } from "./page/PublicProfile";
import { Statistics } from "./page/Statistics";
import { MyProfiles } from "./page/MyProfiles";
import { Sidebar } from "./components/Sidebar";
import { GeneralStats } from "./page/GeneralStats";
import { Links } from "./page/Links";
import { Settings } from "./page/Settings";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const logoUrl = (import.meta as any).env?.VITE_APP_LOGO_URL as string | undefined;
  
  // Public profile sayfalarında header'ı gizle
  const isPublicProfile = location.pathname.startsWith("/") && 
                          !location.pathname.startsWith("/dashboard") &&
                          !location.pathname.startsWith("/profile") &&
                          !location.pathname.startsWith("/my-profiles") &&
                          !location.pathname.startsWith("/stats") &&
                          !location.pathname.startsWith("/links") &&
                          !location.pathname.startsWith("/settings") &&
                          !location.pathname.startsWith("/register-username") &&
                          location.pathname !== "/";

  // Cüzdan bağlantısı kesildiğinde Auth sayfasına yönlendir
  useEffect(() => {
    if (!account && !isPublicProfile && location.pathname !== "/") {
      navigate("/");
    }
  }, [account, isPublicProfile, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      {isPublicProfile && children}
      {!isPublicProfile && account && (
        <div className="flex">
          <Sidebar />
          {/* Main content */}
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
      )}
      {!isPublicProfile && !account && (
        <div>
          {/* Minimal header with left logo and right connect */}
          <div className="flex items-center justify-between p-4">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-10" />
            )}
            <ConnectButton />
          </div>
          <main className="p-4 md:p-8">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-profiles" element={<MyProfiles />} />
          <Route path="/stats" element={<GeneralStats />} />
          <Route path="/links" element={<Links />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/register-username" element={<RegisterUsername />} />
          <Route path="/profile/create" element={<CreateProfile />} />
          <Route path="/profile/:profileId/edit" element={<EditProfile />} />
          <Route path="/profile/:profileId/stats" element={<Statistics />} />
          <Route path="/:username/:slug" element={<PublicProfile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;