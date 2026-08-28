export interface NavLeaf {
  href: string;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}
