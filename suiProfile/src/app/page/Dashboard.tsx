import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { pageMessages } from "../static/messages/page";
import { ProfileData } from "../models/entity/profile-data";

export default function Dashboard() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService } = useSuiServices();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [myUsernames, setMyUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);

  useEffect(() => {
    if (!account) {
      navigate("/");
      return;
    }

    loadProfiles();
  }, [account]);

  const loadProfiles = async () => {
    if (!account) return;

    try {
      setLoading(true);
      try {
        const list = await profileService.listMyUsernames(client, account.address);
        setMyUsernames(list);
      } catch {}
      const profileIds = await profileService.getUserProfiles(client, account.address);
      
      const profilesData = await Promise.all(
        profileIds.map(id => profileService.getProfile(client, id))
      );

      const validProfiles = profilesData.filter((p: any): p is ProfileData => p !== null);
      setProfiles(validProfiles);
      
      setHasUsername(validProfiles.length > 0);
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <p className="text-lg">{pageMessages.dashboard.loadingProfiles}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-text-light dark:text-text-dark text-3xl md:text-4xl font-black tracking-tight">{pageMessages.dashboard.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">{pageMessages.dashboard.subtitle}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate("/profile/create")}
            className="h-11 px-5 rounded-full bg-primary text-accent font-bold shadow-lg shadow-primary/30 hover:bg-opacity-90 transition"
          >
            {pageMessages.dashboard.newProfile}
          </button>
          <button
            onClick={() => navigate("/register-username")}
            className="h-11 px-5 rounded-full border-2 border-accent text-accent font-bold hover:bg-accent hover:text-white transition dark:text-primary dark:border-primary dark:hover:bg-primary dark:hover:text-accent"
          >
            {pageMessages.dashboard.addUsername}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">{pageMessages.dashboard.totalProfiles}</p>
          <p className="text-3xl md:text-4xl font-bold">{profiles.length}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">{pageMessages.dashboard.mainProfiles}</p>
          <p className="text-3xl md:text-4xl font-bold">{profiles.filter(p => !p.isCategory).length}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">{pageMessages.dashboard.categoryProfiles}</p>
          <p className="text-3xl md:text-4xl font-bold">{profiles.filter(p => p.isCategory).length}</p>
        </div>
      </div>

      {/* Kullanıcı Adlarım */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-4 mb-8">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{pageMessages.dashboard.myUsernames}</p>
        {myUsernames.length === 0 ? (
          <p className="text-sm text-gray-600">{pageMessages.dashboard.noUsernames} <span className="underline cursor-pointer" onClick={() => navigate('/register-username')}>Şimdi ekleyin</span>.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {myUsernames.map(u => (
              <span key={u} className="px-3 py-1 rounded-full text-xs bg-accent text-white">@{u}</span>
            ))}
          </div>
        )}
      </div>

      {/* Profiles grouped by username */}
      <div className="flex flex-col gap-6">
        {myUsernames.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-primary/50 dark:border-primary/50 p-10 text-center">
            <p className="text-gray-600 dark:text-primary/80">{pageMessages.dashboard.noUsernameYet}</p>
          </div>
        ) : (
          myUsernames.map((uname) => {
            const items = profiles.filter(p => p.baseUsername === uname);
            return (
              <div key={uname} className="p-4 @container bg-white dark:bg-accent/10 rounded-xl shadow-lg border border-gray-200 dark:border-primary/20">
                <div className="flex items-center justify-between gap-4 p-2 md:p-4">
                  <div>
                    <p className="text-text-light dark:text-text-dark text-xl md:text-2xl font-bold tracking-tight">@{uname}</p>
                    <p className="text-primary text-sm font-semibold">{items.length} {pageMessages.dashboard.profiles}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/profile/create')}
                      className="h-10 px-4 rounded-full bg-primary text-accent text-sm font-bold hover:bg-opacity-90 transition"
                    >
                      {pageMessages.dashboard.createProfile}
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 px-4 border-2 border-dashed border-primary/50 dark:border-primary/50 rounded-lg">
                    <p className="text-gray-500 dark:text-primary/80">{pageMessages.dashboard.noProfilesUnderUsername}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2 md:p-4">
                    {items.map((profile) => (
                      <div key={profile.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 overflow-hidden shadow-sm">
                        <div className="h-20 bg-gradient-to-r from-primary/30 to-accent/30" />
                        <div className="p-4">
                          <div className="-mt-10 mb-2">
                            <div className="w-16 h-16 rounded-full ring-4 ring-white dark:ring-black/30 overflow-hidden flex items-center justify-center bg-accent text-white text-xl">
                              {profile.avatarCid ? '🖼️' : (profile.baseUsername?.charAt(0)?.toUpperCase() || '?')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">/{profile.slug}</h3>
                            {profile.isCategory && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-600/10 text-blue-600">{pageMessages.dashboard.category}</span>
                            )}
                          </div>
                          {profile.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{profile.bio}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{profile.links.size} {pageMessages.dashboard.links} • {pageMessages.dashboard.theme}: {profile.theme}</p>
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={() => navigate(`/${profile.slug}`)}
                              className="h-9 px-3 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-accent transition"
                            >
                              {pageMessages.dashboard.view}
                            </button>
                            <button
                              onClick={() => navigate(`/profile/${profile.id}/edit`)}
                              className="h-9 px-3 rounded-full bg-primary text-accent text-sm font-bold hover:bg-opacity-90 transition"
                            >
                              {pageMessages.dashboard.edit}
                            </button>
                            <button
                              onClick={() => navigate(`/profile/${profile.id}/stats`)}
                              className="h-9 px-3 rounded-full bg-transparent text-sm font-semibold hover:bg-gray-200 dark:hover:bg-primary/20 transition flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-base">analytics</span>
                              {pageMessages.dashboard.stats}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
