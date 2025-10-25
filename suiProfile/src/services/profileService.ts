import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/sui/bcs";

export interface ProfileData {
  id: string;
  owner: string;
  slug: string;
  baseUsername: string;
  avatarCid: string;
  bio: string;
  links: Map<string, string>;
  theme: string;
  isCategory: boolean;
  parentSlug: string;
  createdAt: number;
}

export interface CreateProfileParams {
  username: string;  // 🆕 USERNAME EKLENDI
  slug: string;
  avatarCid: string;
  bio: string;
  theme: string;
  isCategory: boolean;
  parentSlug: string;
}

export interface UpdateProfileParams {
  bio: string;
  avatarCid: string;
  theme: string;
}

export class ProfileService {
  constructor(
    private packageId: string,
    private registryId: string,
    private clockId: string = "0x6"
  ) {}

  /**
   * Username'i kayıt eder (claim eder)
   */
  registerUsername(username: string): Transaction {
    const tx = new Transaction();
    
    const usernameBytes = Array.from(new TextEncoder().encode(username));
    
    tx.moveCall({
      target: `${this.packageId}::profile::register_username`,
      arguments: [
        tx.object(this.registryId),
        tx.pure(bcs.vector(bcs.U8).serialize(usernameBytes)),
      ],
    });

    return tx;
  }

  /**
   * Yeni profil oluşturur
   */
  createProfile(params: CreateProfileParams): Transaction {
    const tx = new Transaction();
    
    const usernameBytes = Array.from(new TextEncoder().encode(params.username));
    const slugBytes = Array.from(new TextEncoder().encode(params.slug));
    const avatarCidBytes = Array.from(new TextEncoder().encode(params.avatarCid));
    const bioBytes = Array.from(new TextEncoder().encode(params.bio));
    const themeBytes = Array.from(new TextEncoder().encode(params.theme));
    const parentSlugBytes = Array.from(new TextEncoder().encode(params.parentSlug));
    
    console.log("🔧 Creating profile transaction WITH username parameter...");
    tx.moveCall({
      target: `${this.packageId}::profile::create_profile`,
      arguments: [
        tx.object(this.registryId),
        tx.pure(bcs.vector(bcs.U8).serialize(usernameBytes)), // ← 🆕 USERNAME EKLENDI
        tx.pure(bcs.vector(bcs.U8).serialize(slugBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(avatarCidBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(bioBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(themeBytes)),
        tx.pure(bcs.bool().serialize(params.isCategory)),
        tx.pure(bcs.vector(bcs.U8).serialize(parentSlugBytes)),
        tx.object(this.clockId), // ← CLOCK GERİ EKLENDİ
      ],
    });

    return tx;
  }

  /**
   * Profili günceller
   */
  updateProfile(profileId: string, params: UpdateProfileParams): Transaction {
    const tx = new Transaction();
    
    const bioBytes = Array.from(new TextEncoder().encode(params.bio));
    const avatarCidBytes = Array.from(new TextEncoder().encode(params.avatarCid));
    const themeBytes = Array.from(new TextEncoder().encode(params.theme));
    
    tx.moveCall({
      target: `${this.packageId}::profile::update_profile`,
      arguments: [
        tx.object(profileId),
        tx.pure(bcs.vector(bcs.U8).serialize(bioBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(avatarCidBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(themeBytes)),
      ],
    });

    return tx;
  }

  /**
   * Profil link ekler veya günceller
   */
  addLink(profileId: string, label: string, url: string): Transaction {
    const tx = new Transaction();
    
    const labelBytes = Array.from(new TextEncoder().encode(label));
    const urlBytes = Array.from(new TextEncoder().encode(url));
    
    tx.moveCall({
      target: `${this.packageId}::profile::add_link`,
      arguments: [
        tx.object(this.registryId),
        tx.object(profileId),
        tx.pure(bcs.vector(bcs.U8).serialize(labelBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(urlBytes)),
      ],
    });

    return tx;
  }

  /**
   * Link kaldırır
   */
  removeLink(profileId: string, label: string): Transaction {
    const tx = new Transaction();
    
    const labelBytes = Array.from(new TextEncoder().encode(label));
    
    tx.moveCall({
      target: `${this.packageId}::profile::remove_link`,
      arguments: [
        tx.object(profileId),
        tx.pure(bcs.vector(bcs.U8).serialize(labelBytes)),
      ],
    });

    return tx;
  }

  /**
   * Tüm linkleri temizler
   */
  clearLinks(profileId: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::profile::clear_links`,
      arguments: [
        tx.object(profileId),
      ],
    });

    return tx;
  }

  /**
   * Slug'dan profil ID'sini çözer
   */
  async resolveSlug(client: SuiClient, username: string, slug: string): Promise<string | null> {
    try {
      const result = await client.devInspectTransactionBlock({
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
        transactionBlock: (() => {
          const tx = new Transaction();
          const usernameBytes = Array.from(new TextEncoder().encode(username));
          const slugBytes = Array.from(new TextEncoder().encode(slug));
          
          console.log("🔧 Calling resolve_slug with:", { username, slug });
          
          tx.moveCall({
            target: `${this.packageId}::profile::resolve_slug`,
            arguments: [
              tx.object(this.registryId),
              tx.pure(bcs.vector(bcs.U8).serialize(usernameBytes)),
              tx.pure(bcs.vector(bcs.U8).serialize(slugBytes)),
            ],
          });
          return tx;
        })(),
      });

      if (result.results && result.results[0]?.returnValues) {
        const bytes = result.results[0].returnValues[0][0];
        const profileId = `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
        console.log("✅ Resolved profile ID:", profileId);
        return profileId;
      }
      console.log("⚠️ No results from resolve_slug");
      return null;
    } catch (error) {
      console.error("❌ Error resolving slug:", error);
      return null;
    }
  }

  /**
   * Username sahibini bulur
   */
  async getUsernameOwner(client: SuiClient, username: string): Promise<string | null> {
    try {
      const result = await client.devInspectTransactionBlock({
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
        transactionBlock: (() => {
          const tx = new Transaction();
          const usernameBytes = Array.from(new TextEncoder().encode(username));
          tx.moveCall({
            target: `${this.packageId}::profile::get_username_owner`,
            arguments: [
              tx.object(this.registryId),
              tx.pure(bcs.vector(bcs.U8).serialize(usernameBytes)),
            ],
          });
          return tx;
        })(),
      });

      if (result.results && result.results[0]?.returnValues) {
        const bytes = result.results[0].returnValues[0][0];
        return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      }
      return null;
    } catch (error) {
      console.error("Error getting username owner:", error);
      return null;
    }
  }

  /**
   * Kullanıcının tüm profillerini getirir
   */
  async getUserProfiles(client: SuiClient, owner: string): Promise<string[]> {
    try {
      const result = await client.getOwnedObjects({
        owner,
        filter: {
          StructType: `${this.packageId}::profile::LinkTreeProfile`,
        },
        options: {
          showContent: true,
        },
      });

      return result.data.map(obj => obj.data?.objectId || "").filter(Boolean);
    } catch (error) {
      console.error("Error getting user profiles:", error);
      return [];
    }
  }

  /**
   * Profil detaylarını getirir
   */
  async getProfile(client: SuiClient, profileId: string): Promise<ProfileData | null> {
    try {
      const object = await client.getObject({
        id: profileId,
        options: {
          showContent: true,
        },
      });

      if (!object.data || object.data.content?.dataType !== "moveObject") {
        return null;
      }

      const fields = object.data.content.fields as any;
      
      // Debug: Sui'den gelen yapıyı görelim
      console.log("🔍 Profile fields:", fields);
      console.log("🔍 Links structure:", fields.links);
      
      // Parse VecMap<String, String> from Sui
      const linksMap = new Map<string, string>();
      if (fields.links?.fields?.contents) {
        const contents = fields.links.fields.contents;
        console.log("✅ Parsing links from contents:", contents);
        for (const item of contents) {
          if (item.fields?.key && item.fields?.value) {
            linksMap.set(item.fields.key, item.fields.value);
          }
        }
      } else {
        console.log("⚠️ Links structure not found, trying alternative parsing...");
        // Alternatif: Eğer farklı bir yapı ise
        if (fields.links && typeof fields.links === 'object') {
          console.log("🔧 Trying Object.entries:", fields.links);
        }
      }
      
      console.log("📊 Final links map:", linksMap);
      
      return {
        id: profileId,
        owner: fields.owner,
        slug: fields.slug,
        baseUsername: fields.base_username,
        avatarCid: fields.avatar_cid,
        bio: fields.bio,
        links: linksMap,
        theme: fields.theme,
        isCategory: fields.is_category,
        parentSlug: fields.parent_slug,
        createdAt: parseInt(fields.created_at),
      };
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  }
}

