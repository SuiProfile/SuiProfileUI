// EditProfileModal.tsx
import { useEffect, useState } from "react";
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
  Select,
  TextArea,
  IconButton,
  Dialog,
  Separator
} from "@radix-ui/themes";
import { TrashIcon } from "@radix-ui/react-icons";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useSuiServices } from "../hooks/useSuiServices";
import type { ProfileData } from "../services/profileService";

interface Toast {
  message: string;
  type: "success" | "error";
}

const THEMES = ["dark", "light", "blue", "green", "purple", "pink"];

type EditProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSaved?: () => void;   // değişiklikler kaydedilince tetiklenir
  onClose?: () => void;   // modal kapanınca tetiklenir
};

export function EditProfileModal({
  open,
  onOpenChange,
  profileId,
  onSaved,
  onClose
}: EditProfileModalProps) {
  const account = useCurrentAccount();
  const { client, profileService, walrusService } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    bio: "",
    avatarCid: "",
    theme: "dark"
  });

  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // modal açıldığında yükle
    if (!open) return;
    if (!account || !profileId) {
      setError("Profil bilgisi için oturum gerekli");
      setProfile(null);
      setLoading(false);
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account, profileId]);

  const loadProfile = async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError("");
      const data = await profileService.getProfile(client, profileId);

      if (!data) {
        setError("Profil bulunamadı");
        setProfile(null);
        return;
      }

      if (data.owner !== account?.address) {
        setError("Bu profili düzenleme yetkiniz yok");
        setProfile(null);
        return;
      }

      setProfile(data);
      setFormData({
        bio: data.bio,
        avatarCid: data.avatarCid,
        theme: data.theme
      });
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Profil yüklenemedi");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileId) return;

    setSaving(true);
    setError("");

    try {
      const tx = profileService.updateProfile(profileId, formData);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            showToast("Profil güncellendi", "success");
            loadProfile();
            setSaving(false);
            onSaved?.();
          },
          onError: (err) => {
            console.error("Error updating profile:", err);
            showToast("Profil güncellenemedi", "error");
            setSaving(false);
          }
        }
      );
    } catch (err) {
      console.error("Error preparing transaction:", err);
      showToast("İşlem hazırlanamadı", "error");
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!profileId || !newLink.label || !newLink.url) {
      showToast("Lütfen tüm alanları doldurun", "error");
      return;
    }

    if (newLink.label.length < 2) {
      showToast("Link adı en az 2 karakter olmalı", "error");
      return;
    }

    if (!newLink.url.match(/^https?:\/\//i)) {
      showToast("URL http:// veya https:// ile başlamalı", "error");
      return;
    }

    if (profile && profile.links.size >= 10) {
      showToast("En fazla 10 link ekleyebilirsiniz", "error");
      return;
    }

    setSaving(true);

    try {
      const tx = profileService.addLink(profileId, newLink.label, newLink.url);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            showToast("Link eklendi", "success");
            setNewLink({ label: "", url: "" });
            loadProfile();
            setSaving(false);
            onSaved?.();
          },
          onError: (err) => {
            console.error("Error adding link:", err);
            showToast("Link eklenemedi", "error");
            setSaving(false);
          }
        }
      );
    } catch (err) {
      console.error("Error preparing transaction:", err);
      showToast("İşlem hazırlanamadı", "error");
      setSaving(false);
    }
  };

  const handleRemoveLink = async (label: string) => {
    if (!profileId) return;

    setSaving(true);

    try {
      const tx = profileService.removeLink(profileId, label);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            showToast("Link silindi", "success");
            loadProfile();
            setSaving(false);
            onSaved?.();
          },
          onError: (err) => {
            console.error("Error removing link:", err);
            showToast("Link silinemedi", "error");
            setSaving(false);
          }
        }
      );
    } catch (err) {
      console.error("Error preparing transaction:", err);
      showToast("İşlem hazırlanamadı", "error");
      setSaving(false);
    }
  };

  const closeModal = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) onClose?.();
  };

  return (
    <Dialog.Root open={open} onOpenChange={closeModal}>
      <Dialog.Content
        size="4"
        maxWidth="920px"
        style={{
          padding: 0,
          overflow: "hidden",
          borderRadius: 16
        }}
      >
        {/* Header */}
        <Box p="4" style={{ background: "var(--color-panel)", borderBottom: "1px solid var(--gray-a5)" }}>
          <Flex align="center" justify="between">
            <Box>
              <Heading size="6">Profil Düzenle</Heading>
              <Text color="gray" size="2">/{profile?.slug ?? profileId}</Text>
            </Box>
            <Flex gap="3" align="center">
              <Button variant="soft" onClick={() => closeModal(false)}>Kapat</Button>
            </Flex>
          </Flex>
        </Box>

        {/* Toast */}
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
              textAlign: "center"
            }}
          >
            {toast.message}
          </Box>
        )}

        {/* Body */}
        <Box p="5">
          {!account ? (
            <Callout.Root color="red">
              <Callout.Text>İşlem için cüzdan bağlantısı gerekli.</Callout.Text>
            </Callout.Root>
          ) : loading ? (
            <Container size="2" py="5">
              <Flex justify="center" align="center" style={{ minHeight: 240 }}>
                <Text size="4">Profil yükleniyor...</Text>
              </Flex>
            </Container>
          ) : error && !profile ? (
            <Callout.Root color="red">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          ) : (
            <Flex direction="column" gap="5">
              {/* Grid: Sol Profil, Sağ Linkler */}
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 24
                }}
              >
                {/* Profil Bilgileri */}
                <Card>
                  <Box p="5">
                    <Heading size="5" mb="4">Profil Bilgileri</Heading>
                    <Flex direction="column" gap="4">
                      {/* Bio */}
                      <Box>
                        <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                          Biyografi
                        </Text>
                        <TextArea
                          size="3"
                          value={formData.bio}
                          onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                          rows={3}
                          placeholder="Kendinizi tanıtın..."
                        />
                      </Box>

                      {/* Avatar */}
                      <Box>
                        <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                          Avatar CID (Walrus)
                        </Text>
                        <TextField.Root
                          size="3"
                          value={formData.avatarCid}
                          onChange={(e) => setFormData((p) => ({ ...p, avatarCid: e.target.value }))}
                          placeholder="Qm..."
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploading(true);
                              const cid = await walrusService.upload(file);
                              setFormData((p) => ({ ...p, avatarCid: cid }));
                              showToast("Görsel yüklendi", "success");
                            } catch (err) {
                              console.error(err);
                              showToast("Yükleme başarısız", "error");
                            } finally {
                              setUploading(false);
                            }
                          }}
                          style={{ marginTop: 8 }}
                        />
                        {formData.avatarCid && (
                          <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                            Önizleme: {walrusService.buildUrl(formData.avatarCid)}
                          </Text>
                        )}
                        {uploading && (
                          <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                            Yükleniyor...
                          </Text>
                        )}
                      </Box>

                      {/* Tema */}
                      <Box>
                        <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
                          Tema
                        </Text>
                        <Select.Root
                          value={formData.theme}
                          onValueChange={(value) => setFormData((p) => ({ ...p, theme: value }))}
                        >
                          <Select.Trigger style={{ width: "100%" }} />
                          <Select.Content>
                            {THEMES.map((theme) => (
                              <Select.Item key={theme} value={theme}>
                                {theme.charAt(0).toUpperCase() + theme.slice(1)}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Box>

                      <Button
                        size="3"
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        style={{
                          background: "linear-gradient(135deg, #2665D6 0%, #E6291B 100%)",
                          color: "white",
                          cursor: saving ? "not-allowed" : "pointer"
                        }}
                      >
                        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                      </Button>
                    </Flex>
                  </Box>
                </Card>

                {/* Linkler */}
                <Card>
                  <Box p="5">
                    <Flex justify="between" align="center" mb="4">
                      <Heading size="5">Linkler</Heading>
                      <Text size="2" color="gray">{profile?.links.size || 0} / 10</Text>
                    </Flex>

                    {/* Yeni Link */}
                    <Box mb="4" p="4" style={{ background: "var(--accent-a2)", borderRadius: "12px" }}>
                      <Text size="2" weight="medium" mb="3" style={{ display: "block" }}>
                        Yeni Link Ekle
                      </Text>
                      <Flex direction="column" gap="2">
                        <TextField.Root
                          size="3"
                          placeholder="Link Adı (örn: Instagram)"
                          value={newLink.label}
                          onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))}
                        />
                        <TextField.Root
                          size="3"
                          placeholder="URL (https://...)"
                          value={newLink.url}
                          onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))}
                        />
                        <Button
                          size="3"
                          onClick={handleAddLink}
                          disabled={saving || !newLink.label || !newLink.url}
                          style={{
                            background: "linear-gradient(135deg, #2665D6 0%, #E6291B 100%)",
                            color: "white",
                            cursor: saving || !newLink.label || !newLink.url ? "not-allowed" : "pointer"
                          }}
                        >
                          {saving ? "Ekleniyor..." : "Ekle"}
                        </Button>
                      </Flex>
                    </Box>

                    {/* Liste */}
                    <Flex direction="column" gap="2">
                      {profile && profile.links.size === 0 ? (
                        <Box p="4" style={{ textAlign: "center", color: "var(--gray-a10)" }}>
                          <Text size="2">Henüz link eklenmemiş</Text>
                        </Box>
                      ) : (
                        Array.from(profile?.links || []).map(([label, url]) => (
                          <Flex
                            key={label}
                            align="center"
                            gap="3"
                            p="3"
                            style={{
                              background: "var(--gray-a2)",
                              borderRadius: "12px",
                              border: "1px solid var(--gray-a4)",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--gray-a3)";
                              e.currentTarget.style.borderColor = "var(--accent-a6)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--gray-a2)";
                              e.currentTarget.style.borderColor = "var(--gray-a4)";
                            }}
                          >
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text weight="medium" style={{ display: "block" }} size="3">
                                {label}
                              </Text>
                              <Text size="1" color="gray" style={{ wordBreak: "break-all", display: "block" }}>
                                {url}
                              </Text>
                            </Box>
                            <IconButton
                              variant="ghost"
                              color="red"
                              onClick={() => handleRemoveLink(label)}
                              disabled={saving}
                            >
                              <TrashIcon />
                            </IconButton>
                          </Flex>
                        ))
                      )}
                    </Flex>
                  </Box>
                </Card>
              </Box>
            </Flex>
          )}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
