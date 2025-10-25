import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate, useParams } from "react-router-dom";
import { useSuiServices } from "../hooks/useSuiServices";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ProfileData } from "../../models/entity/profile-data";
import { StatisticsData } from "../../models/statistics-data";
import { CHART_COLORS } from "../static/chart-colors";

export default function Statistics() {
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

  // Chart data preparation
  const linkClicksData = useMemo(() => {
    if (!stats) return [];
    return Array.from(stats.linkClicks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, clicks: value }));
  }, [stats]);

  const sourceClicksData = useMemo(() => {
    if (!stats) return [];
    return Array.from(stats.sourceClicks)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ 
        name: name || 'Direct', 
        value,
        percentage: stats.totalClicks > 0 ? ((value / stats.totalClicks) * 100).toFixed(1) : 0
      }));
  }, [stats]);

  if (!account || !profileId) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-gray-500 dark:text-gray-400">İstatistikler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4 block">error</span>
          <h2 className="text-red-500 text-xl font-bold mb-3">{error}</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="h-12 px-6 rounded-2xl bg-lime-400 text-black font-semibold hover:bg-lime-300 transition-all"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

  const totalClicks = stats?.totalClicks || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">İstatistikler</h1>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-400 text-sm">link</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">/{profile?.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/profile/${profileId}/edit`)}
            className="h-11 px-5 rounded-xl border-2 border-lime-400 text-lime-600 dark:text-lime-400 text-sm font-semibold hover:bg-lime-400/10 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Profili Düzenle
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="h-11 px-5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Dashboard
          </button>
        </div>
      </div>

      {!stats ? (
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-lime-400/20 to-emerald-500/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-lime-600 dark:text-lime-400 text-6xl">analytics</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">İstatistik Bulunamadı</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Bu profil için henüz istatistik objesi oluşturulmamış. İstatistikleri takip etmeye başlamak için oluşturun.
          </p>
          <button
            onClick={handleCreateStats}
            disabled={creating}
            className="h-14 px-8 rounded-2xl bg-lime-400 text-black font-semibold hover:bg-lime-300 transition-all disabled:opacity-60 flex items-center gap-2 mx-auto"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Oluşturuluyor...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">add_chart</span>
                İstatistik Oluştur
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-3xl p-6 text-black shadow-xl shadow-lime-400/20">
              <div className="flex items-start justify-between mb-4">
                <span className="material-symbols-outlined text-4xl opacity-80">mouse</span>
                <div className="px-3 py-1 bg-black/10 rounded-full text-xs font-bold">TOTAL</div>
              </div>
              <p className="text-5xl font-bold mb-1">{stats.totalClicks.toLocaleString()}</p>
              <p className="text-sm opacity-80 font-medium">Toplam Tıklama</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl p-6 text-black shadow-xl shadow-emerald-400/20">
              <div className="flex items-start justify-between mb-4">
                <span className="material-symbols-outlined text-4xl opacity-80">group</span>
                <div className="px-3 py-1 bg-black/10 rounded-full text-xs font-bold">UNIQUE</div>
              </div>
              <p className="text-5xl font-bold mb-1">{stats.uniqueVisitors.toLocaleString()}</p>
              <p className="text-sm opacity-80 font-medium">Benzersiz Ziyaretçi</p>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-400/20">
              <div className="flex items-start justify-between mb-4">
                <span className="material-symbols-outlined text-4xl opacity-80">link</span>
                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">LINKS</div>
              </div>
              <p className="text-5xl font-bold mb-1">{stats.linkClicks.size}</p>
              <p className="text-sm opacity-80 font-medium">Aktif Link Sayısı</p>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl p-6 text-white shadow-xl shadow-purple-400/20">
              <div className="flex items-start justify-between mb-4">
                <span className="material-symbols-outlined text-4xl opacity-80">language</span>
                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">SOURCES</div>
              </div>
              <p className="text-5xl font-bold mb-1">{stats.sourceClicks.size}</p>
              <p className="text-sm opacity-80 font-medium">Farklı Kaynak</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Link Clicks Bar Chart */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-lime-400/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-lime-600 dark:text-lime-400">bar_chart</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Link Performansı</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">En çok tıklanan linkler</p>
                </div>
              </div>
              
              {linkClicksData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-600">Henüz veri yok</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={linkClicksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1A1A1A', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="clicks" fill="#a3e635" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Source Clicks Pie Chart */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-400/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">pie_chart</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kaynak Dağılımı</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Trafik kaynakları</p>
                </div>
              </div>
              
              {sourceClicksData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-600">Henüz veri yok</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceClicksData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceClicksData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1A1A1A', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Link Clicks Table */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lime-400">format_list_numbered</span>
                Detaylı Link İstatistikleri
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-left">
                      <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Link</th>
                      <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Tıklama</th>
                      <th className="py-3 font-semibold text-gray-600 dark:text-gray-400">Oran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(stats.linkClicks)
                      .sort((a, b) => b[1] - a[1])
                      .map(([label, count]) => {
                        const pct = totalClicks > 0 ? ((count / totalClicks) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={label} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{label}</td>
                            <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{count}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[60px]">
                                  <div className="h-full bg-lime-400 rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px]">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Source Clicks Table */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">source</span>
                Kaynak Bazlı Detaylar
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-left">
                      <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Kaynak</th>
                      <th className="py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Tıklama</th>
                      <th className="py-3 font-semibold text-gray-600 dark:text-gray-400">Oran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(stats.sourceClicks)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => {
                        const pct = totalClicks > 0 ? ((count / totalClicks) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={source} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{source || 'Direct'}</td>
                            <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{count}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[60px]">
                                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px]">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Last Click Info */}
          {stats.lastClickMs > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">schedule</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">Son tıklama:</strong> {new Date(stats.lastClickMs).toLocaleString('tr-TR')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}