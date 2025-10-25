import { Button } from 'primereact/button'
import { memo, useState } from 'react'

const Feature = ({
  icon,
  title,
  desc
}: {
  icon: string
  title: string
  desc: string
}) => (
  <div className="flex flex-col items-center text-center gap-3 max-w-xs">
    <div className="relative flex items-center justify-center w-16 h-16">
      {/* Purple "outside the bounds" paint effect with sharp (not rounded) corners - KÖŞELİ kutu */}
      <div className="bg-purple-500/20 text-purple-400 z-10 flex items-center justify-center w-full h-full border-2 border-purple-500 rounded-none shadow-lg">
        <i className={`pi ${icon} text-3xl`} />
      </div>
    </div>
    <h3 className="text-xl font-bold text-white">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
)

const LandingPage = memo(() => {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Sui Wallet'ın yüklü olup olmadığını kontrol et
      if (typeof window !== 'undefined' && (window as any).suiWallet) {
        const wallet = (window as any).suiWallet
        
        // Wallet'a bağlanma izni iste
        const permissions = await wallet.requestPermissions()
        
        if (permissions) {
          // Hesap bilgilerini al
          const accounts = await wallet.getAccounts()
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0])
            console.log('Bağlı cüzdan adresi:', accounts[0])
          }
        }
      } else {
        alert('Sui Wallet bulunamadı! Lütfen Sui Wallet tarayıcı uzantısını yükleyin.')
        window.open('https://chrome.google.com/webstore/detail/sui-wallet', '_blank')
      }
    } catch (error) {
      console.error('Cüzdan bağlantı hatası:', error)
      alert('Cüzdan bağlantısı başarısız oldu.')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress('')
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-[#1a202c] font-display text-white">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">

          
          {/* Wallet Button */}
          <div>
            {walletAddress ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {shortenAddress(walletAddress)}
                </span>
                <Button
                  label="Bağlantıyı Kes"
                  onClick={disconnectWallet}
                  className="px-4 py-2 text-sm"
                  outlined
                  severity="danger"
                />
              </div>
            ) : (
              
              <Button
                label="Cüzdan Bağla"
                icon="pi pi-wallet"
                onClick={connectWallet}
                loading={isConnecting}
                className="px-6 py-2 text-sm font-semibold"
                style={{ 
                  background: 'linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%)',
                  border: 'none'
                }}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4 pt-32 pb-16 min-h-screen">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 max-w-3xl">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 shadow-2xl flex items-center justify-center"
            >
              <i className="pi pi-user text-5xl text-gray-500" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
            @kullaniciadi
          </h1>
          
          {/* Description */}
          <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
            Tüm linkleriniz tek bir yerde. Basit, şık ve tamamen size özel.
          </p>

          {/* CTA Button */}
          <div className="mt-6">
            <Button
              disabled={!walletAddress}
            >
              Profil sOluştur
            </Button>
            {!walletAddress && (
              <p className="text-sm text-gray-500 mt-3">
                Profil oluşturmak için önce cüzdanınızı bağlayın
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <section className="mt-32 w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-4">
            <Feature
              icon="pi-link"
              title="Özelleştirilebilir Linkler"
              desc="İstediğiniz kadar link ekleyin ve profilinizi kişiselleştirin."
            />
            <Feature
              icon="pi-palette"
              title="Görsel Tema"
              desc="Profilinizi markanıza veya tarzınıza uygun renkler ve temalarla özelleştirin."
            />
            <Feature
              icon="pi-chart-line"
              title="Detaylı Analitik"
              desc="Link tıklamalarınızı ve ziyaretçi etkileşimlerinizi takip edin."
            />
          </div>
        </section>
      </main>
    </div>
  )
})

export default LandingPage