import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useSuiServices } from "../hooks/useSuiServices";
import { ProfileData } from "../models/entity/profile-data";
import { WalrusService } from "../services/walrus.service";

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
    
    // Initialize WalrusService
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-lg">Yükleniyor...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
        <div className="max-w-md w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/10 p-8 text-center">
          <div className="text-4xl mb-2">😕</div>
          <h2 className="text-xl font-bold mb-2">{error || "Profil bulunamadı"}</h2>
          <button
            onClick={() => navigate("/")}
            className="mt-2 h-10 px-4 rounded-full bg-primary text-accent font-bold"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const getAvatarUrl = (avatarCid: string | undefined): string | undefined => {
    if (!avatarCid || !walrusService) return undefined;
    return walrusService.buildUrl(avatarCid);
  };

  const avatarUrl = getAvatarUrl(profile.avatarCid);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header / hero */}
        <div className="flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full ring-4 ring-white dark:ring-black/30 overflow-hidden bg-accent text-white flex items-center justify-center text-3xl">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={`${username} avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initial if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.textContent = username?.charAt(0).toUpperCase() || "?";
                  }
                }}
              />
            ) : (
              (username?.charAt(0).toUpperCase() || "?")
            )}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">@{username}</h1>
          <p className="text-gray-500 dark:text-gray-400">{slug}</p>
          {profile.bio && (
            <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-xl">{profile.bio}</p>
          )}
        </div>

        {/* Links */}
        <div className="mt-8 space-y-3">
          {profile.links.size === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-primary/50 dark:border-primary/50 p-10 text-center">
              <p className="text-gray-600 dark:text-primary/80">Henüz link eklenmemiş</p>
            </div>
          ) : (
            Array.from(profile.links.entries()).map(([label, url]) => (
              <button
                key={label}
                onClick={() => handleLinkClick(label, url)}
                className="w-full p-4 bg-lime-400 text-black rounded-lg font-semibold hover:bg-lime-300 transition-colors"
              >
                {label}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500">Powered by Walrus Linktree</p>
        </div>
      </div>
    </div>
  );
}

