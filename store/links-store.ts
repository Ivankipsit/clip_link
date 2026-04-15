import AsyncStorage from "@react-native-async-storage/async-storage";

export type Link = {
  id: string;
  url: string;
  title: string;
  category: string;
  subCategory: string;
  createdAt: number;
  synced: boolean;
};

const STORAGE_KEY = "clip_link_links";

export async function getLinks(): Promise<Link[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const links: Link[] = JSON.parse(raw);
    // Migrate older records that lack `synced`
    return links.map((l) => ({ ...l, synced: l.synced ?? false }));
  } catch {
    return [];
  }
}

export async function saveLink(
  link: Omit<Link, "id" | "createdAt" | "synced">,
): Promise<Link> {
  const links = await getLinks();
  const newLink: Link = {
    ...link,
    id: Date.now().toString(),
    createdAt: Date.now(),
    synced: false,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newLink, ...links]));
  return newLink;
}

export async function deleteLink(id: string): Promise<void> {
  const links = await getLinks();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(links.filter((l) => l.id !== id)),
  );
}

export async function markSynced(ids: string[]): Promise<void> {
  const links = await getLinks();
  const updated = links.map((l) =>
    ids.includes(l.id) ? { ...l, synced: true } : l,
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function getUnsyncedLinks(): Promise<Link[]> {
  const links = await getLinks();
  return links.filter((l) => !l.synced);
}
