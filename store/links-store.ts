import { supabase } from "@/lib/supabase";
import { addLog } from "@/store/logs-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export const generateId = () => Crypto.randomUUID();

export type Link = {
  id: string;
  url: string;
  title: string;
  categoryPath: string;
  createdAt: number;
  synced: boolean;
};

const STORAGE_KEY = "clip_link_links";

const isSupabaseConfigured = () => {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
};

// -----------------------------
// Local helpers
// -----------------------------

async function getLocalLinks(): Promise<Link[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Normalize old links that may lack categoryPath
    return parsed.map((l: any) => ({
      ...l,
      categoryPath: l.categoryPath ?? l.category ?? "",
    }));
  } catch {
    return [];
  }
}

async function setLocalLinks(links: Link[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

// -----------------------------
// Get Links
// -----------------------------

export async function getLinks(): Promise<Link[]> {
  if (!isSupabaseConfigured()) return getLocalLinks();

  try {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .order("created_at", { ascending: false })
      .execute();

    if (error) throw error;

    return (data || []).map((l: any) => ({
      id: l.id,
      url: l.url,
      title: l.title,
      categoryPath: l.category_path || "",
      createdAt: l.created_at,
      synced: true,
    }));
  } catch {
    return getLocalLinks();
  }
}

// -----------------------------
// Save Link
// -----------------------------

export async function saveLink(
  link: Omit<Link, "id" | "createdAt" | "synced">,
): Promise<Link> {
  const id = generateId();
  const createdAt = Date.now();

  const newLink: Link = {
    ...link,
    id,
    createdAt,
    synced: false,
  };

  const local = await getLocalLinks();
  await setLocalLinks([newLink, ...local]);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("links").insert([
        {
          id,
          url: link.url,
          title: link.title,
          category_path: link.categoryPath,
          created_at: createdAt,
          updated_at: createdAt,
        },
      ]);
    } catch (e) {
      console.log("Insert failed:", e);
    }
  }

  await addLog("Link Added", newLink.title || newLink.url);
  return newLink;
}

// -----------------------------
// Update Link
// -----------------------------

export async function updateLink(
  id: string,
  updates: Partial<Omit<Link, "id" | "createdAt">>,
) {
  const payload: any = {
    updated_at: Date.now(),
  };

  if (updates.url !== undefined) payload.url = updates.url;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.categoryPath !== undefined)
    payload.category_path = updates.categoryPath;

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("links").update(payload).eq("id", id);
    } catch (e) {
      console.log("Update failed:", e);
    }
  }

  const local = await getLocalLinks();
  const updated = local.map((l) =>
    l.id === id ? { ...l, ...updates, synced: false } : l,
  );

  await setLocalLinks(updated);
  await addLog("Link Updated", updates.title || updates.url || id);
}

// -----------------------------
// Delete Link
// -----------------------------

export async function deleteLink(id: string) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from("links").delete().eq("id", id);
    } catch (e) {
      console.log("Delete failed:", e);
    }
  }

  const local = await getLocalLinks();
  const deleted = local.find((l) => l.id === id);
  await setLocalLinks(local.filter((l) => l.id !== id));
  await addLog("Link Deleted", deleted?.title || id);
}

// -----------------------------
// Sync Helpers
// -----------------------------

export async function markSynced(ids: string[]): Promise<void> {
  const links = await getLocalLinks();
  const updated = links.map((l) =>
    ids.includes(l.id) ? { ...l, synced: true } : l,
  );
  await setLocalLinks(updated);
}

export async function getUnsyncedLinks(): Promise<Link[]> {
  const links = await getLocalLinks();
  return links.filter((l) => !l.synced);
}

// -----------------------------
// Filters
// -----------------------------

export async function countLinksByCategoryPath(
  categoryPath: string,
): Promise<number> {
  const links = await getLinks();
  return links.filter(
    (l) =>
      l.categoryPath === categoryPath ||
      (l.categoryPath && l.categoryPath.startsWith(categoryPath + " > ")),
  ).length;
}

export async function clearCategoryPathFromLinks(
  categoryPath: string,
): Promise<void> {
  const local = await getLocalLinks();
  const updated = local.map((l) =>
    l.categoryPath === categoryPath ||
    (l.categoryPath && l.categoryPath.startsWith(categoryPath + " > "))
      ? { ...l, categoryPath: "", synced: false }
      : l,
  );
  await setLocalLinks(updated);
}

export async function deleteLinksByCategoryPath(
  categoryPath: string,
): Promise<void> {
  const local = await getLocalLinks();
  await setLocalLinks(
    local.filter(
      (l) =>
        l.categoryPath !== categoryPath &&
        !(l.categoryPath && l.categoryPath.startsWith(categoryPath + " > ")),
    ),
  );
}

export async function deleteAllLinks(): Promise<void> {
  const count = (await getLocalLinks()).length;
  await setLocalLinks([]);
  await addLog("All Links Deleted", `${count} links removed`);
}
