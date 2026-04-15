import AsyncStorage from "@react-native-async-storage/async-storage";

export type Category = {
  id: string;
  name: string;
  subCategories: SubCategory[];
};

export type SubCategory = {
  id: string;
  name: string;
  categoryId: string;
};

const CATEGORIES_KEY = "clip_link_categories";

export async function getCategories(): Promise<Category[]> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const categories: Category[] = JSON.parse(raw);
    return categories;
  } catch {
    return [];
  }
}

export async function addCategory(name: string): Promise<Category> {
  const categories = await getCategories();
  const newCategory: Category = {
    id: Date.now().toString(),
    name,
    subCategories: [],
  };
  categories.push(newCategory);
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  return newCategory;
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const categories = await getCategories();
  const category = categories.find((c) => c.id === id);
  if (category) {
    category.name = name;
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const categories = await getCategories();
  const filtered = categories.filter((c) => c.id !== id);
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
}

export async function addSubCategory(
  categoryId: string,
  name: string,
): Promise<SubCategory> {
  const categories = await getCategories();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) throw new Error("Category not found");

  const newSubCategory: SubCategory = {
    id: Date.now().toString(),
    name,
    categoryId,
  };
  category.subCategories.push(newSubCategory);
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  return newSubCategory;
}

export async function updateSubCategory(
  id: string,
  name: string,
): Promise<void> {
  const categories = await getCategories();
  for (const category of categories) {
    const subCategory = category.subCategories.find((s) => s.id === id);
    if (subCategory) {
      subCategory.name = name;
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      return;
    }
  }
}

export async function deleteSubCategory(id: string): Promise<void> {
  const categories = await getCategories();
  for (const category of categories) {
    category.subCategories = category.subCategories.filter((s) => s.id !== id);
  }
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}
