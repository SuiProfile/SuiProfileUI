import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Button, 
  Card, 
  Container, 
  Flex, 
  Heading, 
  Text,
  Badge,
  Separator,
} from "@radix-ui/themes";
import { useSuiServices } from "../hooks/useSuiServices";
import { ProfileData } from "../services/profileService";

export function Dashboard() {
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
      // Kullanıcı adlarını çek
      try {
        const list = await profileService.listMyUsernames(client, account.address);
        setMyUsernames(list);
      } catch {}
      const profileIds = await profileService.getUserProfiles(client, account.address);
      
      const profilesData = await Promise.all(
        profileIds.map(id => profileService.getProfile(client, id))
      );

      const validProfiles = profilesData.filter((p): p is ProfileData => p !== null);
      setProfiles(validProfiles);
      
      // Username kontrolü - eğer profil varsa username de var demektir
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
      <Container size="3" py="8">
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Text size="4">Profiller yükleniyor...</Text>
        </Flex>
      </Container>
    );
  }

  // Zorunlu kayıt akışı kaldırıldı: hasUsername false olsa da dashboard gösterilir

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7" mb="1">Dashboard</Heading>
            <Text color="gray">Profillerinizi yönetin</Text>
          </Box>
          <Button size="3" onClick={() => navigate("/profile/create")}>
            + Yeni Profil
          </Button>
        </Flex>

        {/* Stats */}
        <Card>
          <Flex gap="6" p="4">
            <Box>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Toplam Profil
              </Text>
              <Heading size="6">{profiles.length}</Heading>
            </Box>
            <Separator orientation="vertical" />
            <Box>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Ana Profiller
              </Text>
              <Heading size="6">
                {profiles.filter(p => !p.isCategory).length}
              </Heading>
            </Box>
            <Separator orientation="vertical" />
            <Box>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Kategori Profiller
              </Text>
              <Heading size="6">
                {profiles.filter(p => p.isCategory).length}
              </Heading>
            </Box>
          </Flex>
        </Card>

        {/* Kullanıcı Adlarım */}
        <Card>
          <Flex direction="column" p="4" gap="2">
            <Text size="2" color="gray">Kullanıcı Adlarım</Text>
            {myUsernames.length === 0 ? (
              <Text size="2" color="gray">Henüz kullanıcı adınız yok. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/register-username')}>Şimdi ekleyin</span>.</Text>
            ) : (
              <Flex gap="2" wrap="wrap">
                {myUsernames.map(u => (
                  <Box key={u} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--accent-a3)", fontSize: 12 }}>
                    @{u}
                  </Box>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Profiles grouped by username */}
        <Box>
          <Heading size="5" mb="4">Profilleriniz</Heading>
          {myUsernames.length === 0 ? (
            <Card>
              <Flex direction="column" gap="3" align="center" p="6">
                <Text size="5">📝</Text>
                <Text color="gray">Henüz kullanıcı adınız yok</Text>
                <Button onClick={() => navigate("/register-username")}>
                  Kullanıcı Adı Ekle
                </Button>
              </Flex>
            </Card>
          ) : (
            <Flex direction="column" gap="5">
              {myUsernames.map((uname) => {
                const items = profiles.filter(p => p.baseUsername === uname);
                return (
                  <Card key={uname}>
                    <Flex direction="column" p="4" gap="3">
                      <Flex align="center" justify="between">
                        <Heading size="4">@{uname}</Heading>
                        <Button size="2" onClick={() => navigate("/profile/create")}>+ Profil Oluştur</Button>
                      </Flex>
                      {items.length === 0 ? (
                        <Text size="2" color="gray">Bu kullanıcı adı altında profil yok</Text>
                      ) : (
                        <Flex direction="column" gap="3">
                          {items.map((profile) => (
                            <Card key={profile.id}>
                              <Flex p="4" gap="4" align="center">
                                <Box 
                                  style={{ 
                                    width: 60, 
                                    height: 60, 
                                    borderRadius: 8,
                                    background: "var(--accent-a3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 24,
                                  }}
                                >
                                  {profile.avatarCid ? "🖼️" : "👤"}
                                </Box>
                                <Flex direction="column" gap="1" style={{ flex: 1 }}>
                                  <Flex align="center" gap="2">
                                    <Heading size="4">/{profile.slug}</Heading>
                                    {profile.isCategory && (
                                      <Badge color="blue">Kategori</Badge>
                                    )}
                                  </Flex>
                                  <Text size="2" color="gray">
                                    {profile.bio || "Bio eklenmemiş"}
                                  </Text>
                                  <Text size="1" color="gray">
                                    {profile.links.size} link • Tema: {profile.theme}
                                  </Text>
                                </Flex>
                                <Flex gap="2">
                                  <Button 
                                    variant="soft" 
                                    onClick={() => navigate(`/profile/${profile.id}/edit`)}
                                  >
                                    Düzenle
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => navigate(`/${profile.slug}`)}
                                  >
                                    Görüntüle
                                  </Button>
                                  <Button 
                                    variant="ghost"
                                    onClick={() => navigate(`/profile/${profile.id}/stats`)}
                                  >
                                    📊
                                  </Button>
                                </Flex>
                              </Flex>
                            </Card>
                          ))}
                        </Flex>
                      )}
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          )}
        </Box>
      </Flex>
    </Container>
  );
}

