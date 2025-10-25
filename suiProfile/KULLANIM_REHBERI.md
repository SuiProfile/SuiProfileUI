# 🚀 Walrus Linktree - Kullanım Rehberi

## 📖 Proje Hakkında

Walrus Linktree, Sui blockchain üzerinde çalışan merkezi olmayan bir linktree uygulamasıdır. Kullanıcılar Sui cüzdanlarını bağlayarak profillerini oluşturabilir ve linklerini yönetebilirler.

## 🎯 Kullanıcı Akışı

### 1. Ana Sayfa (/)
- Kullanıcı Sui cüzdanını bağlar
- Sistem otomatik olarak profil kontrolü yapar
- **Profil varsa:** Dashboard'a yönlendirilir
- **Profil yoksa:** Username kayıt sayfasına yönlendirilir

### 2. Username Kayıt (/register-username)
- Kullanıcı benzersiz bir kullanıcı adı seçer
- Sistem gerçek zamanlı olarak kullanılabilirlik kontrolü yapar
- Username blockchain'e kaydedilir
- Başarılı kayıttan sonra profil oluşturma sayfasına yönlendirilir

### 3. Profil Oluşturma (/profile/create)
- Kullanıcı profil bilgilerini doldurur:
  - Slug (profil URL'i)
  - Biyografi
  - Avatar CID (Walrus'ta saklanan görsel)
  - Tema seçimi
  - Kategori profili seçeneği
- Profil blockchain'e kaydedilir
- Dashboard'a yönlendirilir

### 4. Dashboard (/dashboard)
- Tüm profillerin listesi
- Her profil için:
  - Düzenle butonu → Profil düzenleme sayfası
  - Görüntüle butonu → Public profil
  - İstatistik butonu → Analitik sayfası
- Yeni profil oluşturma butonu

### 5. Profil Düzenleme (/profile/:id/edit)
- Profil Bilgileri sekmesi:
  - Bio, avatar, tema güncellemesi
- Linkler sekmesi:
  - Link ekleme/silme
  - Internal link desteği (başka profillere yönlendirme)

### 6. Public Profil (/:slug)
- Herkesin görebileceği profil sayfası
- Linktree benzeri görünüm
- Link tıklamaları otomatik olarak kaydedilir
- Tema desteği ile özelleştirilebilir görünüm

### 7. İstatistikler (/profile/:id/stats)
- Toplam tıklama sayısı
- Benzersiz ziyaretçi sayısı
- Link bazlı tıklama istatistikleri
- Kaynak bazlı tıklama analizi

## 🔧 Teknik Detaylar

### Servisler

#### ProfileService
```typescript
- registerUsername(username: string): Transaction
- createProfile(params: CreateProfileParams): Transaction
- updateProfile(profileId: string, params: UpdateProfileParams): Transaction
- addLink(profileId: string, label: string, url: string): Transaction
- removeLink(profileId: string, label: string): Transaction
- resolveSlug(client: SuiClient, slug: string): Promise<string | null>
- getUserProfiles(client: SuiClient, owner: string): Promise<string[]>
- getProfile(client: SuiClient, profileId: string): Promise<ProfileData | null>
```

#### StatisticsService
```typescript
- createStatistics(profileId: string): Transaction
- trackClick(statsId: string, label: string, source: string): Transaction
- resetStatistics(statsId: string): Transaction
- resolveStats(client: SuiClient, profileId: string): Promise<string | null>
- getStatistics(client: SuiClient, statsId: string): Promise<StatisticsData | null>
```

### Sayfalar ve Route'lar

| Route | Sayfa | Açıklama |
|-------|-------|----------|
| `/` | Auth | Ana sayfa / Giriş |
| `/register-username` | RegisterUsername | Username kayıt |
| `/profile/create` | CreateProfile | Yeni profil oluşturma |
| `/profile/:id/edit` | EditProfile | Profil düzenleme |
| `/profile/:id/stats` | Statistics | İstatistikler |
| `/dashboard` | Dashboard | Kullanıcı paneli |
| `/:slug` | PublicProfile | Public profil görüntüleme |

## 🎨 Özellikler

### ✅ Tamamlanan
- ✨ Sui cüzdan entegrasyonu
- 🔐 Otomatik profil kontrolü ve yönlendirme
- 📝 Username kayıt sistemi (gerçek zamanlı kontrol)
- 🎯 Profil oluşturma ve düzenleme
- 🔗 Link yönetimi (ekleme, silme, güncelleme)
- 🌐 Internal link desteği
- 🎨 6 farklı tema (dark, light, blue, green, purple, pink)
- 📂 Kategori profil sistemi
- 📊 Detaylı istatistik takibi
- 🌍 Public profil görüntüleme
- 📈 Link tıklama analizi
- 🎯 Responsive tasarım
- 🇹🇷 Türkçe arayüz

### 🚧 Gelecek Özellikler
- 🌐 Google OAuth entegrasyonu
- 📱 QR kod oluşturma
- 🖼️ Walrus görsel yükleme entegrasyonu
- 📧 E-posta bildirimleri
- 🎨 Özel tema oluşturma
- 📊 Gelişmiş analitik

## 🛠️ Kurulum

### Gereksinimler
- Node.js (v18+)
- npm veya pnpm
- Sui Wallet eklentisi

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **`.env` dosyasını oluşturun:**
Proje kök dizininde `.env` dosyası oluşturun ve aşağıdaki değerleri ekleyin:
```env
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0x4bb9ed1a0fd8794dcbce35a1318e597ad25c736d75fe0d07eca01850b96d760d
VITE_PROFILE_REGISTRY_ID=0x339ac5d24e734068ace44dc3cfb84e75ea08a2f1e09fd5485bd750972ef5ad89
VITE_STATS_REGISTRY_ID=0x030b791d25d59e103d8945285a6e9288fd908c69f4fa89ca2ac73704c0a1a4c6
VITE_PUBLISHER_ID=0x1663b989c1bfb5e29e56f540ecf3146e601cfc7439e7bb861f83a55a5dd87911
VITE_DISPLAY_ID=0xc6d0759c43714d7e7cd820e3b78d2dc86f55e607ba69d03d176d6fb62e912635
VITE_UPGRADE_CAP_ID=0x403f481e2cdc25fc08ca6f8b077c42ac8159f3ed49a756ce38896857fd6e7915
VITE_INITIAL_SHARED_VERSION=626981848
VITE_CLOCK_ID=0x6
```

3. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

4. **Tarayıcınızda açın:**
```
http://localhost:5173
```

## 📚 API Dokümantasyonu

Detaylı API dokümantasyonu için ilk mesajdaki Walrus Linktree API dokümantasyonuna bakın.

## 🎯 Kullanım Örnekleri

### Username Kaydetme
```typescript
const tx = profileService.registerUsername("myusername");
await signAndExecute({ transaction: tx });
```

### Profil Oluşturma
```typescript
const tx = profileService.createProfile({
  slug: "myusername-main",
  avatarCid: "Qm...",
  bio: "My bio",
  theme: "dark",
  isCategory: false,
  parentSlug: "",
});
await signAndExecute({ transaction: tx });
```

### Link Ekleme
```typescript
const tx = profileService.addLink(
  profileId,
  "Instagram",
  "https://instagram.com/myprofile"
);
await signAndExecute({ transaction: tx });
```

### Internal Link Ekleme
```typescript
const tx = profileService.addLink(
  profileId,
  "Shopping Profile",
  "/myusername-shopping"
);
await signAndExecute({ transaction: tx });
```

## 🐛 Sorun Giderme

### Cüzdan Bağlanamıyor
- Sui Wallet eklentisinin yüklü olduğundan emin olun
- Cüzdanınızın testnet'e bağlı olduğunu kontrol edin

### İşlem Başarısız
- Cüzdanınızda yeterli SUI token olduğundan emin olun
- Network bağlantınızı kontrol edin

### Profil Bulunamıyor
- Slug'ın doğru girildiğinden emin olun
- Profil blockchain'e kaydedilmişse biraz bekleyin

## 📞 Destek

Sorunlarınız için GitHub Issues kullanabilirsiniz.

## 📄 Lisans

MIT License

---

**Powered by Sui & Walrus** 🚀

