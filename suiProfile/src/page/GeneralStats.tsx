import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import type { ProfileData } from "../services/profileService";

export function GeneralStats() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService, statisticsService } = useSuiServices();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);

  useEffect(() => {
    if (!account) return;
    const run = async () => {
      try {
        setLoading(true);
        const ids = await profileService.getUserProfiles(client, account.address);
        const details = await Promise.all(ids.map((id) => profileService.getProfile(client, id)));
        const list = details.filter((p): p is ProfileData => p !== null);
        setProfiles(list);

        // Aggregate stats by resolving each stats object
        let t = 0;
        let u = 0;
        for (const p of list) {
          try {
            const statsId = await statisticsService.resolveStats(client, p.id);
            if (statsId) {
              const s = await statisticsService.getStatistics(client, statsId);
              if (s) {
                t += s.totalClicks;
                u += s.uniqueVisitors;
              }
            }
          } catch {}
        }
        setTotalClicks(t);
        setUniqueVisitors(u);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [account, client, profileService, statisticsService]);

  const mainCount = useMemo(() => profiles.filter((p) => !p.isCategory).length, [profiles]);
  const catCount = useMemo(() => profiles.filter((p) => p.isCategory).length, [profiles]);

  if (!account) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <p className="text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Genel İstatistikler</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">Toplam Profil</p>
          <p className="text-3xl md:text-4xl font-bold">{profiles.length}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">Ana Profiller</p>
          <p className="text-3xl md:text-4xl font-bold">{mainCount}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">Kategori Profiller</p>
          <p className="text-3xl md:text-4xl font-bold">{catCount}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="opacity-80 text-sm">Toplam Tıklama</p>
          <p className="text-3xl md:text-4xl font-bold">{totalClicks}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">Benzersiz Ziyaretçi</p>
        <p className="text-2xl font-bold">{uniqueVisitors}</p>
      </div>
    </div>
  );
}


