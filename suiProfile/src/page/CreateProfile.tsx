import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Button, 
  Card, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  TextField,
  Callout,
  Switch,
  Select,
  TextArea,
} from "@radix-ui/themes";
import { useSuiServices } from "../hooks/useSuiServices";

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const THEMES = ["dark", "light", "blue", "green", "purple", "pink"];

export function CreateProfile() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { profileService, client } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [formData, setFormData] = useState({
    username: "",      // 🆕 USERNAME EKLENDI
    slug: "",
    avatarCid: "",
    bio: "",
    theme: "dark",
    isCategory: false,
    parentSlug: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [myUsernames, setMyUsernames] = useState<string[]>([]);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !formData.slug) return;

    console.log("Creating profile:", formData);

    setLoading(true);
    setError("");

    try {
      const tx = profileService.createProfile({
        username: formData.username,  // 🆕 USERNAME EKLENDI
        slug: formData.slug,
        avatarCid: formData.avatarCid,
        bio: formData.bio,
        theme: formData.theme,
        isCategory: formData.isCategory,
        parentSlug: formData.parentSlug,
      });

      // 🔍 DEBUG: Transaction'ı görün
      console.log("Real transaction:", tx);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log("✅ Profile created:", result);
            showToast("Profil başarıyla oluşturuldu!", "success");
            setLoading(false);
            
            // Dashboard'a yönlendir
            setTimeout(() => {
              navigate("/dashboard");
            }, 1500);
          },
          onError: (error) => {
            console.error("❌ Error creating profile:", error);
            showToast("Profil oluşturulamadı", "error");
            setLoading(false);
          },
        }
      );
    } catch (error) {
      console.error("❌ Error preparing transaction:", error);
      showToast("İşlem hazırlanamadı", "error");
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!account) {
      navigate("/");
    }
  }, [account, navigate]);

  // Kullanıcı adlarını yükle ve dropdown önerisine çevir
  useEffect(() => {
    const load = async () => {
      if (!account) return;
      try {
        const list = await profileService.listMyUsernames(client, account.address);
        setMyUsernames(list);
        // Eğer username alanı boşsa ve listede en az bir username varsa varsayılan seç
        if (!formData.username && list.length > 0) {
          setFormData(prev => ({ ...prev, username: list[0] }));
        }
      } catch (e) {
        console.warn("Kullanıcı adları alınamadı", e);
      }
    };
    load();
  }, [account, client, profileService]);

  if (!account) {
    return null;
  }

  return (
    <Container size="2" py="6">
      {/* Toast Notification */}
      {toast && (
        <Box
          style={{
            position: "fixed",
            left: "50%",
            bottom: "36px",
            transform: "translateX(-50%)",
            zIndex: 9999,
            minWidth: "200px",
            maxWidth: "90vw",
            padding: "12px 32px",
            borderRadius: "999px",
            background: toast.type === "error" ? "#ef4444" : "#22c55e",
            color: "#fff",
            fontWeight: 600,
            boxShadow: "0 4px 32px 0 rgb(0 0 0 / 20%)",
            textAlign: "center",
          }}
        >
          {toast.message}
        </Box>
      )}

      <Card size="4">
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="5" p="5">
            <Box>
              <Heading size="6" mb="2">Yeni Profil Oluştur</Heading>
              <Text color="gray">
                Linktree profilinizi oluşturun ve linklerinizi paylaşın
              </Text>
            </Box>

            {error && (
              <Callout.Root color="red">
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            {/* Username */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                Username * (Kayıtlı kullanıcı adınız)
              </Text>
              {myUsernames.length > 0 ? (
                <Select.Root
                  value={formData.username}
                  onValueChange={(value) => handleChange("username", value)}
                >
                  <Select.Trigger style={{ width: "100%" }} />
                  <Select.Content>
                    {myUsernames.map((u) => (
                      <Select.Item key={u} value={u}>@{u}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              ) : (
                <TextField.Root
                  size="3"
                  placeholder="kullanici-adi"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                />
              )}
              <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                Register ettiğiniz username'i seçin veya girin
              </Text>
            </Box>

            {/* Slug */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                Profil Slug *
              </Text>
              <TextField.Root
                size="3"
                placeholder="main"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
              />
              <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                Profil URL'iniz: {formData.username ? `/${formData.username}/${formData.slug}` : "/<username>/<slug>"}
              </Text>
            </Box>

            {/* Bio */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                Biyografi
              </Text>
              <TextArea
                size="3"
                placeholder="Kendinizi tanıtın..."
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={3}
              />
            </Box>

            {/* Avatar CID */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                Avatar CID (Walrus)
              </Text>
              <TextField.Root
                size="3"
                placeholder="Qm..."
                value={formData.avatarCid}
                onChange={(e) => handleChange("avatarCid", e.target.value)}
              />
              <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                Walrus'ta saklanan avatar görselinizin CID'si
              </Text>
            </Box>

            {/* Theme */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                Tema
              </Text>
              <Select.Root
                value={formData.theme}
                onValueChange={(value) => handleChange("theme", value)}
              >
                <Select.Trigger style={{ width: "100%" }} />
                <Select.Content>
                  {THEMES.map(theme => (
                    <Select.Item key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Is Category */}
            <Box>
              <Flex align="center" gap="2">
                <Switch
                  checked={formData.isCategory}
                  onCheckedChange={(checked) => handleChange("isCategory", checked)}
                />
                <Box>
                  <Text size="2" weight="medium" style={{ display: "block" }}>
                    Kategori Profili
                  </Text>
                  <Text size="1" color="gray">
                    Ana profilinize bağlı bir kategori profili
                  </Text>
                </Box>
              </Flex>
            </Box>

            {/* Parent Slug (if category) */}
            {formData.isCategory && (
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                  Ana Profil Slug
                </Text>
                <TextField.Root
                  size="3"
                  placeholder="kullanici-adi-main"
                  value={formData.parentSlug}
                  onChange={(e) => handleChange("parentSlug", e.target.value)}
                />
                <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                  Bu kategorinin bağlı olduğu ana profil
                </Text>
              </Box>
            )}

            {/* Actions */}
            <Flex gap="2">
              <Button 
                size="3" 
                type="submit" 
                disabled={loading || !formData.username || !formData.slug}
                style={{
                  background: "linear-gradient(135deg, #2665D6 0%, #E6291B 100%)",
                  color: "white",
                  cursor: (loading || !formData.username || !formData.slug) ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Oluşturuluyor..." : "Profil Oluştur"}
              </Button>
              <Button 
                size="3"
                type="button"
                variant="ghost" 
                onClick={() => navigate("/")}
                disabled={loading}
              >
                İptal
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}

