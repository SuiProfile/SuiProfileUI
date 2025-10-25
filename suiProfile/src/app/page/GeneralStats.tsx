import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSuiServices } from "../hooks/useSuiServices";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ProfileData } from "../../models/entity/profile-data";
import { CHART_COLORS } from "../static/chart_colors";


export default function GeneralStats() {
  const account = useCurrentAccount();
  const { client, profileService, statisticsService } = useSuiServices();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [profileStats, setProfileStats] = useState<Array<{name: string, clicks: number}>>([]);
  const [categoryStats, setCategoryStats] = useState<Array<{name: string, value: number}>>([]);

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
        const profileData: Array<{name: string, clicks: number}> = [];
        const categoryData: Array<{name: string, value: number}> = [];
        
        for (const p of list) {
          try {
            const statsId = await statisticsService.resolveStats(client, p.id);
            if (statsId) {
              const s = await statisticsService.getStatistics(client, statsId);
              if (s) {
                t += s.totalClicks;
                u += s.uniqueVisitors;
                
                // Profil bazlı istatistikler
                profileData.push({
                  name: p.slug,
                  clicks: s.totalClicks
                });
                
                // Kategori bazlı istatistikler
                if (p.isCategory) {
                  categoryData.push({
                    name: p.slug,
                    value: s.totalClicks
                  });
                }
              }
            }
          } catch {}
        }
        setTotalClicks(t);
        setUniqueVisitors(u);
        setProfileStats(profileData.sort((a, b) => b.clicks - a.clicks));
        setCategoryStats(categoryData.sort((a, b) => b.value - a.value));
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
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-gray-500 dark:text-gray-400">Genel istatistikler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Genel İstatistikler</h1>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-400 text-sm">analytics</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tüm profillerinizin genel performansı</p>
          </div>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-3xl p-6 text-black shadow-xl shadow-lime-400/20">
          <div className="flex items-start justify-between mb-4">
            <span className="material-symbols-outlined text-4xl opacity-80">person</span>
            <div className="px-3 py-1 bg-black/10 rounded-full text-xs font-bold">TOTAL</div>
          </div>
          <p className="text-5xl font-bold mb-1">{profiles.length}</p>
          <p className="text-sm opacity-80 font-medium">Toplam Profil</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl p-6 text-black shadow-xl shadow-emerald-400/20">
          <div className="flex items-start justify-between mb-4">
            <span className="material-symbols-outlined text-4xl opacity-80">account_circle</span>
            <div className="px-3 py-1 bg-black/10 rounded-full text-xs font-bold">MAIN</div>
          </div>
          <p className="text-5xl font-bold mb-1">{mainCount}</p>
          <p className="text-sm opacity-80 font-medium">Ana Profiller</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-400/20">
          <div className="flex items-start justify-between mb-4">
            <span className="material-symbols-outlined text-4xl opacity-80">category</span>
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">CATEGORY</div>
          </div>
          <p className="text-5xl font-bold mb-1">{catCount}</p>
          <p className="text-sm opacity-80 font-medium">Kategori Profiller</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl p-6 text-white shadow-xl shadow-purple-400/20">
          <div className="flex items-start justify-between mb-4">
            <span className="material-symbols-outlined text-4xl opacity-80">mouse</span>
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">CLICKS</div>
          </div>
          <p className="text-5xl font-bold mb-1">{totalClicks.toLocaleString()}</p>
          <p className="text-sm opacity-80 font-medium">Toplam Tıklama</p>
        </div>
      </div>

      {/* Unique Visitors Card */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-lime-400/20 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-lime-600 dark:text-lime-400 text-2xl">group</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Benzersiz Ziyaretçi</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{uniqueVisitors.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profile Performance Chart */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-lime-400/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-lime-600 dark:text-lime-400">bar_chart</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profil Performansı</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">En çok tıklanan profiller</p>
            </div>
          </div>
          
          {profileStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-600">Henüz veri yok</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profileStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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

        {/* Category Distribution Chart */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-400/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">pie_chart</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kategori Dağılımı</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Kategori profillerin performansı</p>
            </div>
          </div>
          
          {categoryStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-600">Henüz kategori profili yok</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryStats.map((_, index) => (
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
    </div>
  );
}


