import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import storage, { namespacedStorage } from "../../app/utils/storage";
import type { LinksState, LinkItem } from "../../app/models/links";

type SharedProfile = {
  name: string;
  bio?: string;
  links: Array<{ text: string; url: string; favicon?: string }>;
};

export default function ShareProfilePage() {
  const { name } = useParams<{ name: string }>();
  const [profile, setProfile] = useState<SharedProfile | null>(null);

  const username = (name || "kullanici").trim();

  useEffect(() => {
    // 1) Try explicit share namespace first: share:<username>
    const share = namespacedStorage("share:");
    const shared = share.getJSON<SharedProfile>(username, null as any);
    if (shared && Array.isArray(shared.links)) {
      setProfile(shared);
      return;
    }

    // 2) Fallback: derive from editor state (all group links, flattened)
    const saved = storage.getJSON<LinksState>("links-page-state-v2", { groups: [], library: [] });
    const items: LinkItem[] = [];
    if (!saved) {
      return;
    }
    for (const g of saved.groups || []) {
      for (const l of g.links || []) items.push(l);
    }
    // If nothing in groups, show library entries
    if (items.length === 0) for (const l of saved.library || []) items.push(l);

    setProfile({
      name: username,
      bio: "Merhaba! Ben bir yazılım geliştiricisiyim. Projelerime göz atın.",
      links: items.map(l => ({ text: l.text, url: l.url, favicon: (l as any).favicon }))
    });
  }, [username]);

  const copyMe = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch { }
  };

  const avatarLetter = useMemo(() => (username ? username.charAt(0).toUpperCase() : "?"), [username]);

  if (!profile) return null;

  return (
    <div className="relative pt-16 flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-gray-800 text-white flex items-center justify-center text-3xl font-bold z-20">
        {avatarLetter}
      </div>

      {/* Username */}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">{username}</h1>
      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-gray-400 max-w-lg mb-6 pb-3">{profile.bio}</p>
      )}

      {/* Links */}
      <div className="w-full flex flex-col gap-3 mb-4">
        {profile.links.map((l, i) => (
          <a
            key={`${l.url}-${i}`}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 font-semibold text-white shadow hover:opacity-95 transition"
            style={{ background: "linear-gradient(135deg,#6D28D9 0%, #8B5CF6 100%)" }}
          >
            {l.favicon && (
              <img src={l.favicon} alt="icon" className="w-5 h-5 rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
            <span>{l.text}</span>
          </a>
        ))}
      </div>

      {/* Copy link */}
      <div className="w-full py-3">
        <button
          type="button"
          onClick={copyMe}
          className="w-full rounded-xl py-3 text-sm bg-white/10 text-white hover:bg-white/15 transition border border-white/10"
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <i className="pi pi-link" />
            Kopyala
          </span>
        </button>
      </div>

      {/* Socials (placeholders) */}
      <div className="mt-8 grid grid-cols-4 gap-6 text-center">
        {[
          { icon: "pi-facebook", label: "Facebook" },
          { icon: "pi-twitter", label: "Twitter" },
          { icon: "pi-instagram", label: "Instagram" },
          { icon: "pi-linkedin", label: "LinkedIn" }
        ].map(s => (
          <div key={s.icon} className="flex flex-col items-center gap-2 text-white/80">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <i className={`pi ${s.icon}`} />
            </div>
            <div className="text-[10px]">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


