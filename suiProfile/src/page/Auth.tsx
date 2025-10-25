import { useState, useEffect } from "react";
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
} from "@radix-ui/themes";
import { useSuiServices } from "../hooks/useSuiServices";

export function Auth() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { client, profileService } = useSuiServices();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (account) {
      // Zorunlu kayıt akışını kaldır: doğrudan dashboard'a yönlendir
      setChecking(true);
      setTimeout(() => {
        navigate("/dashboard");
        setChecking(false);
      }, 800);
    }
  }, [account, navigate]);

  const checkUserProfile = async () => {};

  if (account) {
    return (
      <Container size="2" py="8">
        <Card size="4">
          <Flex direction="column" gap="4" align="center" p="4">
            <Heading size="6" align="center">
              🎉 Hoş Geldiniz!
            </Heading>
            <Text align="center" color="gray">
              Sui cüzdanınız başarıyla bağlandı
            </Text>
            <Box p="4" style={{ background: "var(--green-a3)", borderRadius: "8px", width: "100%" }}>
              <Text size="2" weight="medium">
                Cüzdan Adresi:
              </Text>
              <Text size="1" color="gray" style={{ wordBreak: "break-all" }}>
                {account.address}
              </Text>
            </Box>
            
            {checking ? (
              <Text color="gray">Yönlendiriliyor...</Text>
            ) : null}
          </Flex>
        </Card>
      </Container>
    );
  }

  const handleGoogleLogin = () => {
    alert("Google OAuth yakında eklenecek!");
  };

  return (
    <Container size="3" py="9">
      <Flex direction="column" align="center" gap="8">
        <Box style={{ textAlign: "center" }}>
          <Heading size="9" mb="3">
            Walrus Linktree
          </Heading>
          <Text size="5" color="gray">
            Web3 kimliğinizi yönetin
          </Text>
        </Box>

        <Card size="4" style={{ width: "100%", maxWidth: 450 }}>
          <Flex direction="column" gap="4" p="5">
            <Box style={{ textAlign: "center" }} mb="2">
              <Heading size="5" mb="2">
                Başlayın
              </Heading>
              <Text size="2" color="gray">
                Devam etmek için cüzdanınızı bağlayın
              </Text>
            </Box>

            <Box 
              p="4" 
              style={{ 
                border: "2px dashed var(--accent-a6)", 
                borderRadius: 12,
                textAlign: "center",
                background: "var(--accent-a2)",
              }}
            >
              <Text size="6" style={{ display: "block", marginBottom: 12 }}>
                🔗
              </Text>
              <Text size="2" color="gray" mb="2" style={{ display: "block" }}>
                Yukarıdaki <strong>"Connect Wallet"</strong> butonunu kullanın
              </Text>
              <Text size="1" color="gray">
                Sui Wallet, Suiet veya diğer Sui cüzdanlarınızla bağlanın
              </Text>
            </Box>

            <Box my="2">
              <Flex align="center" gap="3">
                <Box style={{ flex: 1, height: 1, background: "var(--gray-a5)" }} />
                <Text size="2" color="gray">yakında</Text>
                <Box style={{ flex: 1, height: 1, background: "var(--gray-a5)" }} />
              </Flex>
            </Box>

            <Button 
              size="4" 
              variant="outline"
              onClick={handleGoogleLogin}
              disabled
              style={{ opacity: 0.5 }}
            >
              <Flex align="center" gap="2">
                <span>🌐</span>
                <span>Google ile Devam Et (Yakında)</span>
              </Flex>
            </Button>

            <Text size="1" color="gray" style={{ textAlign: "center", marginTop: 8 }}>
              Giriş yaparak{" "}
              <Text as="span" weight="medium">
                Kullanım Şartları
              </Text>{" "}
              ve{" "}
              <Text as="span" weight="medium">
                Gizlilik Politikası
              </Text>
              'nı kabul etmiş olursunuz.
            </Text>
          </Flex>
        </Card>

        <Card style={{ maxWidth: 450, width: "100%" }} variant="surface">
          <Flex gap="3" align="start" p="4">
            <Text size="5">💡</Text>
            <Box>
              <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>
                Sui Cüzdanı Nedir?
              </Text>
              <Text size="2" color="gray">
                Sui blockchain üzerinde işlem yapmanızı sağlayan dijital cüzdanınız. 
                Sui Wallet veya Suiet gibi cüzdan eklentilerini kullanabilirsiniz.
              </Text>
            </Box>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}