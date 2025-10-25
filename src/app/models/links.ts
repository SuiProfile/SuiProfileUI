import type { LinkModel } from "./link";

export type LinkItem = LinkModel & { url: string; favicon?: string };

export type LinkGroup = {
  id: string;
  name: string;
  links: LinkItem[];
};

export type LinksState = {
  groups: LinkGroup[];
  library: LinkItem[];
};


