import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Box, 
  Button, 
  Card, 
  Container, 
  Flex, 
  Heading, 
  Text,
  Separator,
  Table,
} from "@radix-ui/themes";
import { useSuiServices } from "../hooks/useSuiServices";
import { StatisticsData } from "../services/statisticsService";
import { ProfileData } from "../services/profileService";

export function Statistics() {
  const { profileId } = useParams<{ profileId: string }>();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService, statisticsService } = useSuiServices();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (!account || !profileId) {
    return null;
  }

  if (loading) {
    return (
      <Container size="3" py="8">
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Text size="4">İstatistikler yükleniyor...</Text>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="2" py="8">
        <Card>
          <Flex direction="column" gap="4" align="center" p="6">
            <Heading size="5" color="red">{error}</Heading>
            <Button onClick={() => navigate("/dashboard")}>
              Dashboard'a Dön
            </Button>
          </Flex>
        </Card>
      </Container>
    );
  }

  const linkClicksArray = stats ? Array.from(stats.linkClicks).sort((a, b) => b[1] - a[1]) : [];
  const sourceClicksArray = stats ? Array.from(stats.sourceClicks).sort((a, b) => b[1] - a[1]) : [];

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex justify="between" align="center">
          <Box>
            <Heading size="7" mb="1">İstatistikler</Heading>
            <Text color="gray">/{profile?.slug}</Text>
          </Box>
          <Flex gap="2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/profile/${profileId}/edit`)}
            >
              Profili Düzenle
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
            >
              ← Dashboard
            </Button>
          </Flex>
        </Flex>

        {!stats ? (
          <Card>
            <Flex direction="column" gap="4" align="center" p="6">
              <Text size="5">📊</Text>
              <Heading size="5">İstatistik Bulunamadı</Heading>
              <Text color="gray" align="center">
                Bu profil için henüz istatistik objesi oluşturulmamış.
                İstatistikleri görmek için önce bir istatistik objesi oluşturmalısınız.
              </Text>
            </Flex>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <Card>
              <Flex gap="6" p="5" wrap="wrap">
                <Box style={{ flex: 1, minWidth: 150 }}>
                  <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                    Toplam Tıklama
                  </Text>
                  <Heading size="8">{stats.totalClicks}</Heading>
                </Box>
                <Separator orientation="vertical" />
                <Box style={{ flex: 1, minWidth: 150 }}>
                  <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                    Benzersiz Ziyaretçi
                  </Text>
                  <Heading size="8">{stats.uniqueVisitors}</Heading>
                </Box>
                <Separator orientation="vertical" />
                <Box style={{ flex: 1, minWidth: 150 }}>
                  <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                    Link Sayısı
                  </Text>
                  <Heading size="8">{stats.linkClicks.size}</Heading>
                </Box>
                <Separator orientation="vertical" />
                <Box style={{ flex: 1, minWidth: 150 }}>
                  <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                    Kaynak Sayısı
                  </Text>
                  <Heading size="8">{stats.sourceClicks.size}</Heading>
                </Box>
              </Flex>
            </Card>

            {/* Link Clicks Table */}
            <Card>
              <Box p="4">
                <Heading size="5" mb="4">Link Tıklamaları</Heading>
                {linkClicksArray.length === 0 ? (
                  <Text color="gray">Henüz tıklama kaydı yok</Text>
                ) : (
                  <Table.Root variant="surface">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Link</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Tıklama Sayısı</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Yüzde</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {linkClicksArray.map(([label, count]) => {
                        const percentage = stats.totalClicks > 0 
                          ? ((count / stats.totalClicks) * 100).toFixed(1) 
                          : 0;
                        
                        return (
                          <Table.Row key={label}>
                            <Table.Cell>
                              <Text weight="medium">{label}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text>{count}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text color="gray">{percentage}%</Text>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                )}
              </Box>
            </Card>

            {/* Source Clicks Table */}
            <Card>
              <Box p="4">
                <Heading size="5" mb="4">Kaynak Bazlı Tıklamalar</Heading>
                {sourceClicksArray.length === 0 ? (
                  <Text color="gray">Henüz kaynak verisi yok</Text>
                ) : (
                  <Table.Root variant="surface">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Kaynak</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Tıklama Sayısı</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Yüzde</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {sourceClicksArray.map(([source, count]) => {
                        const percentage = stats.totalClicks > 0 
                          ? ((count / stats.totalClicks) * 100).toFixed(1) 
                          : 0;
                        
                        return (
                          <Table.Row key={source}>
                            <Table.Cell>
                              <Text weight="medium">{source || "Direct"}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text>{count}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text color="gray">{percentage}%</Text>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                )}
              </Box>
            </Card>

            {/* Last Click Info */}
            {stats.lastClickMs > 0 && (
              <Card variant="surface">
                <Flex align="center" gap="2" p="3">
                  <Text size="2" color="gray">
                    Son tıklama: {new Date(stats.lastClickMs).toLocaleString("tr-TR")}
                  </Text>
                </Flex>
              </Card>
            )}
          </>
        )}
      </Flex>
    </Container>
  );
}

