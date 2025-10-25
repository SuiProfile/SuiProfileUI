import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { pageMessages } from "../static/messages";
import { ProfileData } from "../models/entity/profile-data";

export default function MyProfiles() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService } = useSuiServices();

  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);

  useEffect(() => {
    if (!account) return;
    const run = async () => {
      try {
        setLoading(true);
        const names = await profileService.listMyUsernames(client, account.address);
        setUsernames(names);

        const ids = await profileService.getUserProfiles(client, account.address);
        const details = await Promise.all(ids.map((id) => profileService.getProfile(client, id)));
        setProfiles(details.filter((p: any): p is ProfileData => p !== null));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [account, client, profileService]);

  const stats = useMemo(() => {
    const total = profiles.length;
    const main = profiles.filter((p) => !p.isCategory).length;
    const cat = total - main;
    return { total, main, cat };
  }, [profiles]);

  const groups = useMemo(() => {
    const by: Record<string, ProfileData[]> = {};
    for (const uname of usernames) by[uname] = [];
    for (const p of profiles) {
      const uname = p.baseUsername;
      if (!by[uname]) by[uname] = [];
      by[uname].push(p);
    }
    return by;
  }, [usernames, profiles]);

  const avatarUrl = (cid?: string) =>
    cid ? `https://aggregator.walrus-testnet.walrus.space/v1/${cid}` : undefined;

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-end mb-4">
          {/* ConnectButton üst bar'da zaten */}
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">{pageMessages.myProfiles.connectWallet}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{pageMessages.myProfiles.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            @{account.address.slice(0, 6)}...{account.address.slice(-4)}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate("/profile/create")}
            className="h-11 px-5 rounded-full bg-primary text-accent font-bold shadow-lg shadow-primary/30 hover:bg-opacity-90 transition"
          >
            {pageMessages.myProfiles.createNewProfile}
          </button>
          <button
            onClick={() => navigate("/register-username")}
            className="h-11 px-5 rounded-full border-2 border-accent text-accent font-bold hover:bg-accent hover:text-white transition dark:text-primary dark:border-primary dark:hover:bg-primary dark:hover:text-accent"
          >
            {pageMessages.myProfiles.createNewUser}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">{pageMessages.myProfiles.totalProfiles}</p>
          <p className="text-3xl md:text-4xl font-bold">{stats.total}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">{pageMessages.myProfiles.mainProfiles}</p>
          <p className="text-3xl md:text-4xl font-bold">{stats.main}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">{pageMessages.myProfiles.categoryProfiles}</p>
          <p className="text-3xl md:text-4xl font-bold">{stats.cat}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <p>{pageMessages.myProfiles.loading}</p>
        </div>
      ) : usernames.length === 0 && profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-primary/50 dark:border-primary/50 p-10 text-center">
          <p className="text-gray-600 dark:text-primary/80">
            {pageMessages.myProfiles.noUsernameAndProfile}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groups).map(([uname, list]) => (
            <div key={uname} className="p-4 @container bg-white dark:bg-accent/10 rounded-xl shadow-lg border border-gray-200 dark:border-primary/20">
              <div className="flex items-center justify-between gap-4 p-2 md:p-4">
                <div>
                  <p className="text-xl md:text-2xl font-bold tracking-tight">@{uname}</p>
                  <p className="text-primary text-sm font-semibold">{list.length} {pageMessages.myProfiles.profile}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/profile/create")}
                    className="h-10 px-4 rounded-full bg-primary text-accent text-sm font-bold hover:bg-opacity-90 transition"
                  >
                    {pageMessages.myProfiles.createProfile}
                  </button>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-primary/50 dark:border-primary/50 rounded-lg">
                  <p className="text-gray-500 dark:text-primary/80">{pageMessages.myProfiles.noProfilesUnderUsername}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2 md:p-4">
                  {list.map((p) => (
                    <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 overflow-hidden shadow-sm">
                      <div className="h-20 bg-gradient-to-r from-primary/30 to-accent/30" />
                      <div className="p-4">
                        <div className="-mt-10 mb-2">
                          <div className="w-16 h-16 rounded-full ring-4 ring-white dark:ring-black/30 overflow-hidden">
                            {p.avatarCid ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatarUrl(p.avatarCid)} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-accent text-white text-xl">
                                {p.baseUsername?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">/{p.slug}</h3>
                          {p.isCategory && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-600/10 text-blue-600">{pageMessages.myProfiles.category}</span>
                          )}
                        </div>
                        {p.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{p.bio}</p>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => navigate(`/${p.slug}`)}
                            className="h-9 px-3 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-accent transition"
                          >
                            {pageMessages.myProfiles.view}
                          </button>
                          <button
                            onClick={() => navigate(`/profile/${p.id}/edit`)}
                            className="h-9 px-3 rounded-full bg-primary text-accent text-sm font-bold hover:bg-opacity-90 transition"
                          >
                            {pageMessages.myProfiles.edit}
                          </button>
                          <button
                            onClick={() => navigate(`/profile/${p.id}/stats`)}
                            className="h-9 px-3 rounded-full bg-transparent text-sm font-semibold hover:bg-gray-200 dark:hover:bg-primary/20 transition"
                          >
                            {pageMessages.myProfiles.stats}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}