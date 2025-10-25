import { useState } from "react";
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
          onSuccess: () => {
            console.log("✅ Username registered successfully");
            showToast("Kullanıcı adı başarıyla kaydedildi!", "success");
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
              navigate("/profile/create");
            }, 2000);
          },
          onError: (error) => {
            console.error("❌ Error registering username:", error);
            showToast("Kullanıcı adı kaydedilemedi", "error");
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
              disabled={loading}
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
              disabled={loading || !username || username.length < 3 || available !== true}
              style={{
                background: "linear-gradient(135deg, #2665D6 0%, #E6291B 100%)",
                color: "white",
                cursor: (loading || !username || username.length < 3 || available !== true) ? "not-allowed" : "pointer",
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

