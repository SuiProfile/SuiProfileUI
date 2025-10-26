import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useSuiServices } from "../hooks/useSuiServices";
import { ProfileData } from "../models/entity/profile-data";
import { WalrusService } from "../services/walrus.service";

// Tema konfigürasyonları
const THEME_CONFIGS = {
  dark: {
    bg: "bg-[#0D0D0D]",
    text: "text-white",
    textSecondary: "text-gray-400",
    card: "bg-[#1A1A1A]",
    button: "bg-lime-400 text-black hover:bg-lime-300",
    border: "border-gray-800",
    accent: "lime-400",
  },
  light: {
    bg: "bg-gray-50",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    card: "bg-white",
    button: "bg-gray-900 text-white hover:bg-gray-800",
    border: "border-gray-200",
    accent: "gray-900",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900",
    text: "text-white",
    textSecondary: "text-blue-200",
    card: "bg-blue-800/30 backdrop-blur-sm",
    button: "bg-blue-400 text-blue-900 hover:bg-blue-300",
    border: "border-blue-700",
    accent: "blue-400",
  },
  green: {
    bg: "bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900",
    text: "text-white",
    textSecondary: "text-emerald-200",
    card: "bg-emerald-800/30 backdrop-blur-sm",
    button: "bg-emerald-400 text-emerald-900 hover:bg-emerald-300",
    border: "border-emerald-700",
    accent: "emerald-400",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-900 via-violet-800 to-fuchsia-900",
    text: "text-white",
    textSecondary: "text-purple-200",
    card: "bg-purple-800/30 backdrop-blur-sm",
    button: "bg-purple-400 text-purple-900 hover:bg-purple-300",
    border: "border-purple-700",
    accent: "purple-400",
  },
  pink: {
    bg: "bg-gradient-to-br from-pink-900 via-rose-800 to-red-900",
    text: "text-white",
    textSecondary: "text-pink-200",
    card: "bg-pink-800/30 backdrop-blur-sm",
    button: "bg-pink-400 text-pink-900 hover:bg-pink-300",
    border: "border-pink-700",
    accent: "pink-400",
  },
};

export default function PublicProfile() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const { client, profileService, statisticsService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walrusService, setWalrusService] = useState<WalrusService | null>(null);

  useEffect(() => {
    if (!username || !slug) {
      navigate("/");
      return;
    }
    
    const publisherUrls = import.meta.env.VITE_WALRUS_PUBLISHER_URLS?.split(',') || [];
    const aggregatorUrls = import.meta.env.VITE_WALRUS_AGGREGATOR_URLS?.split(',') || [];
    
    if (publisherUrls.length > 0 && aggregatorUrls.length > 0) {
      const walrus = new WalrusService(publisherUrls, aggregatorUrls);
      setWalrusService(walrus);
    }
    
    loadProfile();
  }, [username, slug]);

  const loadProfile = async () => {
    if (!username || !slug) return;
    try {
      setLoading(true);
      const profileId = await profileService.resolveSlug(client, username, slug);
      if (!profileId) {
        setError("Profil bulunamadı");
        setLoading(false);
        return;
      }
      const data = await profileService.getProfile(client, profileId);
      if (!data) {
        setError("Profil yüklenemedi");
        setLoading(false);
        return;
      }
      setProfile(data);
    } catch (e) {
      console.error(e);
      setError("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (label: string, url: string) => {
    if (!profile) return;
    try {
      const statsId = await statisticsService.resolveStats(client, profile.id);
      if (statsId) {
        const tx = statisticsService.trackClick(statsId, label, window.location.hostname);
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: () => {},
            onError: () => {},
          }
        );
      }
    } catch {}
    if (url.startsWith("/")) {
      navigate(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const getAvatarUrl = (avatarCid: string | undefined): string | undefined => {
    if (!avatarCid || !walrusService) return undefined;
    return walrusService.buildUrl(avatarCid);
  };

  // Tema seçimi (varsayılan: dark)
  const theme = THEME_CONFIGS[profile?.theme as keyof typeof THEME_CONFIGS] || THEME_CONFIGS.dark;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-6">
        <div className="max-w-md w-full rounded-3xl border border-gray-800 bg-[#1A1A1A] p-8 text-center">
          <span className="material-symbols-outlined text-gray-500 text-6xl mb-4 block">error</span>
          <h2 className="text-xl font-bold text-white mb-2">{error || "Profil bulunamadı"}</h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 h-12 px-6 rounded-2xl bg-lime-400 text-black font-semibold hover:bg-lime-300 transition-all"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(profile.avatarCid);

  return (
    <div className={`min-h-screen ${theme.bg} transition-all duration-500`}>
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        {/* Header / Avatar */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Avatar */}
          <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full ${theme.card} ${theme.border} border-4 overflow-hidden mb-6 shadow-2xl`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={`${username} avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center ${theme.text} text-4xl font-bold">${username?.charAt(0).toUpperCase() || "?"}</div>`;
                  }
                }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${theme.text} text-4xl font-bold`}>
                {username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* Username & Bio */}
          <h1 className={`text-4xl md:text-5xl font-bold ${theme.text} mb-2`}>
            @{username}
          </h1>
          {slug !== username && (
            <p className={`text-sm ${theme.textSecondary} font-medium mb-3`}>
              {slug}
            </p>
          )}
          {profile.bio && (
            <p className={`${theme.textSecondary} max-w-lg text-base md:text-lg leading-relaxed px-4`}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4 mb-12">
          {profile.links.size === 0 ? (
            <div className={`${theme.card} ${theme.border} border-2 border-dashed rounded-3xl p-12 text-center`}>
              <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">link_off</span>
              <p className={theme.textSecondary}>Henüz link eklenmemiş</p>
            </div>
          ) : (
            Array.from(profile.links.entries()).map(([label, url]: [string, string], index: number) => (              <button
                key={label}
                onClick={() => handleLinkClick(label, url)}
                className={`group w-full ${theme.button} rounded-2xl p-5 font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-between`}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards',
                }}
              >
                <span>{label}</span>
                <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            ))
          )}
        </div>

        {/* Social Links (if any internal links exist) */}
        {Array.from(profile.links.entries()).some(([_, url]) => url.startsWith('/')) && (
          <div className={`${theme.card} ${theme.border} border rounded-3xl p-6 mb-8`}>
            <h3 className={`${theme.text} font-semibold mb-4 text-center`}>Diğer Profiller</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from(profile.links.entries())
                .filter(([_, url]) => url.startsWith('/'))
                .map(([label, url]) => (
                  <button
                    key={label}
                    onClick={() => handleLinkClick(label, url)}
                    className={`px-4 py-2 ${theme.button} rounded-xl text-sm font-medium transition-all duration-200`}
                  >
                    {label}
                  </button>
                ))
              }
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center gap-2 px-6 py-3 ${theme.card} ${theme.border} border rounded-full`}>
            <span className="material-symbols-outlined text-lime-400 text-sm">link</span>
            <span className={`text-xs ${theme.textSecondary} font-medium`}>
              Powered by Sui Profile
            </span>
          </div>
          
          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `@${username}'s Profile`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link kopyalandı!');
              }
            }}
            className={`${theme.textSecondary} hover:${theme.text} text-sm font-medium flex items-center gap-2 mx-auto transition-colors`}
          >
            <span className="material-symbols-outlined text-base">share</span>
            Profili Paylaş
          </button>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}