import { useState } from "react";

export default function ProfilePage() {
  // ZK Login alanları: address, email, name, picture
  const [name, setName] = useState("Sui Kullanıcısı");
  const [username, setUsername] = useState("kullaniciadi");
  const [email, setEmail] = useState("user@example.com");
  const [address, setAddress] = useState("0x12f3...9a2c");
  const [picture, setPicture] = useState("");
  const [bio, setBio] = useState("Merhaba! Linklerimi burada topluyorum.");

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile summary */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {picture ? (
            <img src={picture} alt="avatar" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow" />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold" style={{ background: "#2665D6" }}>
              {name.charAt(0)}
            </div>
          )}
          <div className="text-xl font-bold">{name}</div>
          <div className="text-sm text-gray-500">@{username}</div>
          <div className="text-xs text-gray-500">{email}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs mt-1 px-2 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #2665D6 0%,#f55200 100%)" }}>
              {address}
            </div>
            <button type="button" className="p-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => copyToClipboard(address)} aria-label="Kopyala">
              <i className="pi pi-copy text-xs" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm sm:text-[0.95rem] font-medium text-white"
              style={{ background: "linear-gradient(135deg, #2665D6 0%,#f55200 100%)" }}
            >
              Profili Görs
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm sm:text-[0.95rem] font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <i className="pi pi-share-alt" />
              <span className="ml-1">Paylaş</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editable info */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Ad Soyad
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6]"
              placeholder="Adınız"
            />
          </label>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Kullanıcı Adı
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6]"
              placeholder="@kullaniciadi"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            E-posta
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6]"
              placeholder="email@ornek.com"
            />
          </label>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Profil Fotoğrafı (URL)
            <input
              id="picture"
              value={picture}
              onChange={(e) => setPicture(e.currentTarget.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6]"
              placeholder="https://.../avatar.png"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mt-4">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Cüzdan Adresi
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.currentTarget.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6]"
              placeholder="0x..."
            />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => copyToClipboard(address)} className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              Kopyala
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-800 my-6" />

        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block">
          Biyografi
          <input
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.currentTarget.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2665D6]"
            placeholder="Kendinizden kısaca bahsedin"
          />
        </label>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 py-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            İptal
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #2665D6 0%,#f55200 100%)" }}
          >
            <i className="pi pi-check" />
            <span className="ml-1">Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
}


