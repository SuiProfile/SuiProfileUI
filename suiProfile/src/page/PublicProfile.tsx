import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { 
  Box, 
  Button, 
  Card, 
  Container, 
  Flex, 
  Heading, 
  Text,
  Avatar,
} from "@radix-ui/themes";
import { useSuiServices } from "../hooks/useSuiServices";
import { ProfileData } from "../services/profileService";

export function PublicProfile() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const { client, profileService, statisticsService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username || !slug) {
      navigate("/");
      return;
    }

    loadProfile();
  }, [username, slug]);

  const loadProfile = async () => {
    if (!username || !slug) return;

    try {
      setLoading(true);
      
      console.log("🔍 Resolving profile:", username, slug);
      
      // Username ve slug'dan profil ID'sini çöz
      const profileId = await profileService.resolveSlug(client, username, slug);
      
      if (!profileId) {
        setError("Profil bulunamadı");
        setLoading(false);
        return;
      }

      console.log("✅ Profile ID resolved:", profileId);

      // Profil detaylarını getir
      const data = await profileService.getProfile(client, profileId);
      
      if (!data) {
        setError("Profil yüklenemedi");
        setLoading(false);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      setError("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (label: string, url: string) => {
    if (!profile) return;

    // İstatistik kaydı için transaction oluştur
    try {
      const statsId = await statisticsService.resolveStats(client, profile.id);
      
      if (statsId) {
        const tx = statisticsService.trackClick(statsId, label, window.location.hostname);
        
        // Tıklama kaydını arka planda gönder
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: () => console.log("Click tracked"),
            onError: (error) => console.error("Error tracking click:", error),
          }
        );
      }
    } catch (error) {
      console.error("Error tracking click:", error);
    }

    // Link'e yönlendir
    if (url.startsWith("/")) {
      // Internal link
      navigate(url);
    } else {
      // External link
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <Container size="2" py="9">
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Text size="4">Yükleniyor...</Text>
        </Flex>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container size="2" py="9">
        <Card>
          <Flex direction="column" gap="4" align="center" p="6">
            <Text size="6">😕</Text>
            <Heading size="5">{error || "Profil bulunamadı"}</Heading>
            <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
          </Flex>
        </Card>
      </Container>
    );
  }

  // Tema renklerini dinamik olarak ayarla
  const themeColors: Record<string, string> = {
    dark: "var(--gray-12)",
    light: "var(--gray-1)",
    blue: "var(--blue-9)",
    green: "var(--green-9)",
    purple: "var(--purple-9)",
    pink: "var(--pink-9)",
  };

  const backgroundColor = themeColors[profile.theme] || themeColors.dark;

  return (
    <Box 
      style={{ 
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${backgroundColor} 0%, var(--gray-1) 100%)`,
        paddingTop: 60,
        paddingBottom: 60,
      }}
    >
      <Container size="2">
        <Flex direction="column" gap="6" align="center">
          {/* Avatar */}
          <Avatar
            size="8"
            src={profile.avatarCid ? `https://aggregator.walrus-testnet.walrus.space/v1/${profile.avatarCid}` : undefined}
            fallback={username?.charAt(0).toUpperCase() || "?"}
            style={{ width: 120, height: 120 }}
          />

          {/* Profile Info */}
          <Box style={{ textAlign: "center" }}>
            <Heading size="8" mb="2">@{username}</Heading>
            <Text size="3" color="gray" mb="3" style={{ display: "block" }}>
              {slug}
            </Text>
            {profile.bio && (
              <Text size="4" color="gray" style={{ maxWidth: 500, display: "block" }}>
                {profile.bio}
              </Text>
            )}
          </Box>

          {/* Links */}
          <Flex direction="column" gap="3" style={{ width: "100%", maxWidth: 600 }}>
            {profile.links.size === 0 ? (
              <Card>
                <Flex justify="center" p="6">
                  <Text color="gray">Henüz link eklenmemiş</Text>
                </Flex>
              </Card>
            ) : (
              Array.from(profile.links).map(([label, url]) => (
                <Card 
                  key={label}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleLinkClick(label, url)}
                >
                  <Flex 
                    align="center" 
                    justify="between" 
                    p="4"
                    style={{
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Text size="4" weight="medium">
                      {label}
                    </Text>
                    <Text size="2" color="gray">
                      {url.startsWith("/") ? "→" : "↗"}
                    </Text>
                  </Flex>
                </Card>
              ))
            )}
          </Flex>

          {/* Footer */}
          <Box style={{ textAlign: "center", marginTop: 40 }}>
            <Text size="1" color="gray">
              Powered by Walrus Linktree
            </Text>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

