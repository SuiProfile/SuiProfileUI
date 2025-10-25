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
} from "@radix-ui/themes";
import { useSuiServices } from "../hooks/useSuiServices";

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export function RegisterUsername() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { profileService, client } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [myUsernames, setMyUsernames] = useState<string[]>([]);
  const maxUsernames = 3;
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const owner = await profileService.getUsernameOwner(client, value);
      setAvailable(owner === null);
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Username sadece küçük harf, rakam ve tire içerebilir
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(sanitized);
    
    if (sanitized.length >= 3) {
      checkUsername(sanitized);
    } else {
      setAvailable(null);
    }
  };

  const handleRegister = async () => {
    if (!account || !username || username.length < 3) return;
    if (myUsernames.length >= maxUsernames) {
      showToast("En fazla 3 kullanıcı adı ekleyebilirsiniz", "error");
      return;
    }

    console.log("Registering username:", username);

    setLoading(true);
    setError("");

    try {
      const tx = profileService.registerUsername(username);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async () => {
            console.log("✅ Username registered successfully");
            showToast("Kullanıcı adı başarıyla kaydedildi!", "success");
            setSuccess(true);
            setLoading(false);
            // Listeyi güncelle
            try {
              const list = await profileService.listMyUsernames(client, account.address);
              setMyUsernames(list);
            } catch {}
            setTimeout(() => {
              navigate("/profile/create");
            }, 2000);
          },
          onError: (error) => {
            console.error("❌ Error registering username:", error);
            const msg = (error as any)?.message || "";
            if (msg.includes("EUsernameLimitReached") || msg.toLowerCase().includes("limit") ) {
              showToast("En fazla 3 kullanıcı adı ekleyebilirsiniz", "error");
            } else if (msg.includes("EUsernameAlreadyTaken")) {
              showToast("Kullanıcı adı alınmış", "error");
            } else {
              showToast("Kullanıcı adı kaydedilemedi", "error");
            }
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

  if (!account) {
    navigate("/");
    return null;
  }

  // Kullanıcının mevcut kullanıcı adlarını yükle
  // İlk render ve cüzdan değişiminde
  useEffect(() => {
    const load = async () => {
      if (!account) return;
      try {
        const list = await profileService.listMyUsernames(client, account.address);
        setMyUsernames(list);
      } catch (e) {
        console.warn("Kullanıcı adları listelenemedi (boş olabilir)", e);
      }
    };
    load();
  }, [account, client, profileService]);

  return (
    <Container size="2" py="8">
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
        <Flex direction="column" gap="5" p="5">
          <Box style={{ textAlign: "center" }}>
            <Heading size="6" mb="2">
              Kullanıcı Adı Oluştur
            </Heading>
            <Text color="gray">
              Bu kullanıcı adı tüm profillerinizde temel olarak kullanılacak
            </Text>
          </Box>

          {/* Mevcut kullanıcı adlarım */}
          <Box>
            <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
              Kullanıcı Adlarım ({myUsernames.length}/{maxUsernames})
            </Text>
            {myUsernames.length === 0 ? (
              <Text size="2" color="gray">Henüz kullanıcı adınız yok</Text>
            ) : (
              <Flex gap="2" wrap="wrap">
                {myUsernames.map((n) => (
                  <Box key={n} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--accent-a3)", fontSize: 12 }}>
                    @{n}
                  </Box>
                ))}
              </Flex>
            )}
          </Box>

          {error && (
            <Callout.Root color="red">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          {success && (
            <Callout.Root color="green">
              <Callout.Text>
                ✓ Kullanıcı adı başarıyla kaydedildi! Profil oluşturma sayfasına yönlendiriliyorsunuz...
              </Callout.Text>
            </Callout.Root>
          )}

          <Box>
            <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
              Kullanıcı Adı
            </Text>
            <TextField.Root
              size="3"
              placeholder="ornek-kullanici"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={loading || myUsernames.length >= maxUsernames}
            />
            <Flex align="center" gap="2" mt="2">
              {checking && (
                <Text size="1" color="gray">Kontrol ediliyor...</Text>
              )}
              {available === true && (
                <Text size="1" color="green">✓ Kullanılabilir</Text>
              )}
              {available === false && (
                <Text size="1" color="red">✗ Bu kullanıcı adı alınmış</Text>
              )}
              {myUsernames.length >= maxUsernames && (
                <Text size="1" color="red">Limit dolu (3)</Text>
              )}
            </Flex>
            <Text size="1" color="gray" mt="2" style={{ display: "block" }}>
              En az 3 karakter. Sadece küçük harf, rakam ve tire (-) kullanılabilir.
            </Text>
          </Box>

          <Callout.Root>
            <Callout.Text>
              <strong>Önemli:</strong> Kullanıcı adınızı bir kere seçtikten sonra değiştiremezsiniz. 
              Lütfen dikkatli seçin.
            </Callout.Text>
          </Callout.Root>

          <Flex direction="column" gap="2">
            <Button 
              size="3" 
              onClick={handleRegister}
              disabled={loading || !username || username.length < 3 || available !== true || myUsernames.length >= maxUsernames}
              style={{
                background: "linear-gradient(135deg, #2665D6 0%, #E6291B 100%)",
                color: "white",
                cursor: (loading || !username || username.length < 3 || available !== true || myUsernames.length >= maxUsernames) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Kaydediliyor..." : "Kullanıcı Adını Kaydet"}
            </Button>
            <Button 
              size="3"
              variant="ghost" 
              onClick={() => navigate("/")}
              disabled={loading}
            >
              İptal
            </Button>
          </Flex>

          <Box style={{ background: "var(--accent-a2)", padding: 16, borderRadius: 8 }}>
            <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
              📝 Örnek Kullanım
            </Text>
            <Text size="2" color="gray" style={{ display: "block" }}>
              Kullanıcı adınız: <code>ahmet</code>
            </Text>
            <Text size="2" color="gray" style={{ display: "block" }}>
              Ana profil: <code>ahmet-main</code>
            </Text>
            <Text size="2" color="gray" style={{ display: "block" }}>
              Kategori profil: <code>ahmet-sosyal</code>
            </Text>
          </Box>
        </Flex>
      </Card>
    </Container>
  );
}

