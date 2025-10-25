
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