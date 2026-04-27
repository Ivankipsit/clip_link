import { addLog } from "@/store/logs-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

const CATEGORIES_KEY = "clip_link_categories";

export async function getCategories(): Promise<Category[]> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const cats: Category[] = JSON.parse(raw);
    // Sanitize: remove self-referencing and deduplicate (same name + parentId)
    const seen = new Set<string>();
    const clean = cats.filter((c) => {
      if (c.parentId === c.id) return false;
      const key = `${c.name.toLowerCase()}|${c.parentId ?? "null"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (clean.length !== cats.length) {
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(clean));
    }
    return clean;
  } catch {
    return [];
  }
}

let _idCounter = 0;

export async function addCategory(
  name: string,
  parentId: string | null = null,
): Promise<Category> {
  const categories = await getCategories();
  const newCategory: Category = {
    id: `${Date.now()}_${++_idCounter}`,
    name,
    parentId,
  };
  categories.push(newCategory);
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  await addLog("Folder Added", name);
  return newCategory;
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const categories = await getCategories();
  const category = categories.find((c) => c.id === id);
  if (category) {
    category.name = name;
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    await addLog("Folder Renamed", name);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const categories = await getCategories();
  // Collect all descendant IDs recursively
  const toDelete = new Set<string>();
  const collect = (parentId: string) => {
    if (toDelete.has(parentId)) return;
    toDelete.add(parentId);
    for (const c of categories) {
      if (c.parentId === parentId && c.id !== parentId) collect(c.id);
    }
  };
  collect(id);
  const filtered = categories.filter((c) => !toDelete.has(c.id));
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
  const deleted = categories.find((c) => c.id === id);
  await addLog("Folder Deleted", deleted?.name || id);
}

/** Get direct children of a parent (null = root) */
export function getChildren(
  categories: Category[],
  parentId: string | null,
): Category[] {
  return categories.filter((c) => c.parentId === parentId);
}

/** Get the full breadcrumb path for a category: "A > B > C" */
export function getCategoryPath(
  categories: Category[],
  categoryId: string,
): string {
  const parts: string[] = [];
  const visited = new Set<string>();
  let current = categories.find((c) => c.id === categoryId);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);
    current = current.parentId
      ? categories.find((c) => c.id === current!.parentId)
      : undefined;
  }
  return parts.join(" > ");
}

/** Get all possible category paths (for suggestions in link form) */
export function getAllCategoryPaths(categories: Category[]): {
  id: string;
  path: string;
}[] {
  return categories.map((c) => ({
    id: c.id,
    path: getCategoryPath(categories, c.id),
  }));
}

/** Delete ALL categories */
export async function deleteAllCategories(): Promise<void> {
  const count = (await getCategories()).length;
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify([]));
  await addLog("All Folders Deleted", `${count} folders removed`);
}

/** Count all descendants (children, grandchildren, etc.) */
export function countDescendants(
  categories: Category[],
  parentId: string,
  visited: Set<string> = new Set(),
): number {
  if (visited.has(parentId)) return 0;
  visited.add(parentId);
  let count = 0;
  for (const c of categories) {
    if (c.parentId === parentId && c.id !== parentId) {
      count += 1 + countDescendants(categories, c.id, visited);
    }
  }
  return count;
}
