import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate, useParams } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { StatisticsData } from "../services/statisticsService";
import { ProfileData } from "../services/profileService";

export function Statistics() {
  const { profileId } = useParams<{ profileId: string }>();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService, statisticsService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!account || !profileId) {
      navigate("/");
      return;
    }

    loadData();
  }, [account, profileId]);

  const loadData = async () => {
    if (!profileId) return;

    try {
      setLoading(true);

      // Profil bilgilerini yükle
      const profileData = await profileService.getProfile(client, profileId);
      
      if (!profileData) {
        setError("Profil bulunamadı");
        return;
      }

      if (profileData.owner !== account?.address) {
        setError("Bu profili görüntüleme yetkiniz yok");
        return;
      }

      setProfile(profileData);

      // İstatistikleri yükle
      const statsId = await statisticsService.resolveStats(client, profileId);
      
      if (statsId) {
        const statsData = await statisticsService.getStatistics(client, statsId);
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStats = async () => {
    if (!profileId) return;
    try {
      setCreating(true);
      const tx = statisticsService.createStatistics(profileId);
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async () => {
            await loadData();
            setCreating(false);
          },
          onError: () => setCreating(false),
        }
      );
    } catch {
      setCreating(false);
    }
  };

  if (!account || !profileId) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <p className="text-lg">İstatistikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-8 text-center">
          <h2 className="text-red-500 font-bold mb-3">{error}</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="h-10 px-4 rounded-full bg-primary text-accent font-bold"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

  const linkClicksArray = stats ? Array.from(stats.linkClicks).sort((a, b) => b[1] - a[1]) : [];
  const sourceClicksArray = stats ? Array.from(stats.sourceClicks).sort((a, b) => b[1] - a[1]) : [];
  const totalClicks = stats?.totalClicks || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">İstatistikler</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">/{profile?.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/profile/${profileId}/edit`)}
            className="h-10 px-4 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-accent transition"
          >
            Profili Düzenle
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="h-10 px-4 rounded-full bg-transparent text-sm font-semibold hover:bg-gray-200 dark:hover:bg-primary/20 transition"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {!stats ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-8 text-center">
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-xl font-bold mb-2">İstatistik Bulunamadı</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Bu profil için henüz istatistik objesi oluşturulmamış.
          </p>
          <button
            onClick={handleCreateStats}
            disabled={creating}
            className="h-11 px-5 rounded-full bg-primary text-accent font-bold shadow-lg shadow-primary/30 hover:bg-opacity-90 transition disabled:opacity-60"
          >
            {creating ? 'Oluşturuluyor...' : 'İstatistik Oluştur'}
          </button>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="opacity-80 text-sm">Toplam Tıklama</p>
              <p className="text-3xl md:text-4xl font-bold">{stats.totalClicks}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="opacity-80 text-sm">Benzersiz Ziyaretçi</p>
              <p className="text-3xl md:text-4xl font-bold">{stats.uniqueVisitors}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="opacity-80 text-sm">Link Sayısı</p>
              <p className="text-3xl md:text-4xl font-bold">{stats.linkClicks.size}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-accent text-white shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="opacity-80 text-sm">Kaynak Sayısı</p>
              <p className="text-3xl md:text-4xl font-bold">{stats.sourceClicks.size}</p>
            </div>
          </div>

          {/* Link clicks */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-4 mb-6">
            <h3 className="text-lg font-bold mb-4">Link Tıklamaları</h3>
            {linkClicksArray.length === 0 ? (
              <p className="text-sm text-gray-600">Henüz tıklama kaydı yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4">Link</th>
                      <th className="py-2 pr-4">Tıklama</th>
                      <th className="py-2 pr-4">Yüzde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkClicksArray.map(([label, count]) => {
                      const pct = totalClicks > 0 ? ((count / totalClicks) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={label} className="border-t border-gray-200 dark:border-gray-800">
                          <td className="py-2 pr-4 font-medium">{label}</td>
                          <td className="py-2 pr-4">{count}</td>
                          <td className="py-2 pr-4 text-gray-500">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Source clicks */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-4">
            <h3 className="text-lg font-bold mb-4">Kaynak Bazlı Tıklamalar</h3>
            {sourceClicksArray.length === 0 ? (
              <p className="text-sm text-gray-600">Henüz kaynak verisi yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4">Kaynak</th>
                      <th className="py-2 pr-4">Tıklama</th>
                      <th className="py-2 pr-4">Yüzde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceClicksArray.map(([source, count]) => {
                      const pct = totalClicks > 0 ? ((count / totalClicks) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={source} className="border-t border-gray-200 dark:border-gray-800">
                          <td className="py-2 pr-4 font-medium">{source || 'Direct'}</td>
                          <td className="py-2 pr-4">{count}</td>
                          <td className="py-2 pr-4 text-gray-500">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {stats.lastClickMs > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-3 mt-6">
              <p className="text-sm text-gray-600">Son tıklama: {new Date(stats.lastClickMs).toLocaleString('tr-TR')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

