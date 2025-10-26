import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { pageMessages } from "../static/messages/page";
import { ProfileData } from "../models/entity/profile-data";
import { StatisticsData } from "../models/statistics-data";
import { WalrusService } from "../services/walrus.service";
import { DashboardSnapshot } from "../components/DashboardSnapshot";

export default function Dashboard() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService, statisticsService } = useSuiServices();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [myUsernames, setMyUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStats, setAllStats] = useState<Map<string, StatisticsData>>(new Map());
  const [walrusService, setWalrusService] = useState<WalrusService | null>(null);

  useEffect(() => {
    if (!account) {
      navigate("/");
      return;
    }

    // Initialize WalrusService
    const publisherUrls = import.meta.env.VITE_WALRUS_PUBLISHER_URLS?.split(',') || [];
    const aggregatorUrls = import.meta.env.VITE_WALRUS_AGGREGATOR_URLS?.split(',') || [];
    
    if (publisherUrls.length > 0 && aggregatorUrls.length > 0) {
      const walrus = new WalrusService(publisherUrls, aggregatorUrls);
      setWalrusService(walrus);
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
      
      // Load statistics for all profiles
      const statsMap = new Map<string, StatisticsData>();
      for (const profile of validProfiles) {
        try {
          const statsId = await statisticsService.resolveStats(client, profile.id);
          if (statsId) {
            const statsData = await statisticsService.getStatistics(client, statsId);
            if (statsData) {
              statsMap.set(profile.id, statsData);
            }
          }
        } catch (error) {
          console.log(`No stats found for profile ${profile.id}`);
        }
      }
      setAllStats(statsMap);
      
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (avatarCid: string | undefined): string | undefined => {
    if (!avatarCid || !walrusService) return undefined;
    return walrusService.buildUrl(avatarCid);
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
    <div id="dashboard-container" className="max-w-7xl mx-auto p-4 md:p-8">
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
          {/* Dashboard NFT Snapshot Button */}
          <DashboardSnapshot
            profileId={account.address}
            username={myUsernames[0] || "user"}
            stats={{
              totalClicks: Array.from(allStats.values()).reduce((total, stats) => total + stats.totalClicks, 0),
              totalLinks: profiles.reduce((total, profile) => total + profile.links.size, 0),
            }}
            containerId="dashboard-container"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
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
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-gradient-to-br from-lime-400 to-lime-500 text-black shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm font-medium">Total Clicks</p>
          <p className="text-3xl md:text-4xl font-bold">
            {Array.from(allStats.values()).reduce((total, stats) => total + stats.totalClicks, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Usernames */}
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

      {/* General Statistics Table */}
      {allStats.size > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-lime-400/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-lime-600 dark:text-lime-400">analytics</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profile Performance</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">All your profiles' general statistics</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-800">
                <tr className="text-left">
                  <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Profile</th>
                  <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Total Clicks</th>
                  <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Unique Visitors</th>
                  <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Active Link</th>
                  <th className="py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles
                  .filter(profile => allStats.has(profile.id))
                  .map((profile) => {
                    const stats = allStats.get(profile.id)!;
                    return (
                      <tr key={profile.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full ring-2 ring-lime-400 overflow-hidden flex items-center justify-center bg-lime-400 text-black text-sm font-bold">
                              {getAvatarUrl(profile.avatarCid) ? (
                                <img 
                                  src={getAvatarUrl(profile.avatarCid)} 
                                  alt={`${profile.baseUsername} avatar`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.textContent = profile.baseUsername?.charAt(0)?.toUpperCase() || '?';
                                    }
                                  }}
                                />
                              ) : (
                                profile.baseUsername?.charAt(0)?.toUpperCase() || '?'
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">/{profile.slug}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">@{profile.baseUsername}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 font-semibold">
                          {stats.totalClicks.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          {stats.uniqueVisitors.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          {stats.linkClicks.size}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/profile/${profile.id}/stats`)}
                              className="h-8 px-3 rounded-lg bg-lime-400 text-black text-xs font-semibold hover:bg-lime-300 transition-all flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">analytics</span>
                              Details
                            </button>
                            <button
                              onClick={() => navigate(`/${profile.slug}`)}
                              className="h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                              {getAvatarUrl(profile.avatarCid) ? (
                                <img 
                                  src={getAvatarUrl(profile.avatarCid)} 
                                  alt={`${profile.baseUsername} avatar`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.textContent = profile.baseUsername?.charAt(0)?.toUpperCase() || '?';
                                    }
                                  }}
                                />
                              ) : (
                                profile.baseUsername?.charAt(0)?.toUpperCase() || '?'
                              )}
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
                          {allStats.has(profile.id) && (
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-lime-600 dark:text-lime-400">
                                <span className="material-symbols-outlined text-sm">mouse</span>
                                {allStats.get(profile.id)!.totalClicks.toLocaleString()} tıklama
                              </span>
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined text-sm">group</span>
                                {allStats.get(profile.id)!.uniqueVisitors.toLocaleString()} ziyaretçi
                              </span>
                            </div>
                          )}
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
