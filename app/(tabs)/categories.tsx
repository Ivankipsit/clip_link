import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useAppearance } from "@/context/appearance-context";
import {
    Category,
    addCategory,
    addSubCategory,
    deleteCategory,
    deleteSubCategory,
    getCategories,
    updateCategory,
    updateSubCategory
} from "@/store/categories-store";
import {
    countLinksByCategory,
    countLinksBySubCategory,
} from "@/store/links-store";

export default function CategoriesScreen() {
  const { resolvedTheme } = useAppearance();
  const colors = Colors[resolvedTheme];
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    "category" | "subcategory" | "edit"
  >("category");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [editingType, setEditingType] = useState<"category" | "subcategory">(
    "category",
  );

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, []),
  );

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
    await updateLinkCounts(cats);
  };

  const updateLinkCounts = async (cats: Category[]) => {
    const counts: Record<string, number> = {};
    for (const cat of cats) {
      counts[cat.id] = await countLinksByCategory(cat.name);
      for (const subCat of cat.subCategories) {
        counts[subCat.id] = await countLinksBySubCategory(subCat.name);
      }
    }
    setLinkCounts(counts);
  };

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const openAddCategoryModal = () => {
    setModalType("category");
    setInputValue("");
    setSelectedCategoryId(null);
    setModalVisible(true);
  };

  const openAddSubCategoryModal = (categoryId: string) => {
    setModalType("subcategory");
    setSelectedCategoryId(categoryId);
    setInputValue("");
    setModalVisible(true);
  };

  const openEditModal = (
    id: string,
    name: string,
    type: "category" | "subcategory",
  ) => {
    setModalType("edit");
    setEditingType(type);
    setSelectedItemId(id);
    setInputValue(name);
    if (type === "subcategory") {
      const category = categories.find((c) =>
        c.subCategories.some((s) => s.id === id),
      );
      setSelectedCategoryId(category?.id ?? null);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!inputValue.trim()) return;

    if (modalType === "category") {
      if (selectedItemId) {
        // Edit category
        await updateCategory(selectedItemId, inputValue.trim());
      } else {
        // Add category
        await addCategory(inputValue.trim());
      }
    } else if (modalType === "subcategory" && selectedCategoryId) {
      await addSubCategory(selectedCategoryId, inputValue.trim());
    } else if (modalType === "edit") {
      if (editingType === "category") {
        await updateCategory(selectedItemId!, inputValue.trim());
      } else {
        await updateSubCategory(selectedItemId!, inputValue.trim());
      }
    }

    setModalVisible(false);
    setInputValue("");
    setSelectedItemId(null);
    setSelectedCategoryId(null);
    loadCategories();
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      "Delete Category",
      "Are you sure? This will not delete the links.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(id);
            loadCategories();
          },
        },
      ],
    );
  };

  const handleDeleteSubCategory = (id: string) => {
    Alert.alert(
      "Delete Sub-Category",
      "Are you sure? This will not delete the links.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSubCategory(id);
            loadCategories();
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          categories.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <ThemedText
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            No categories yet. Tap + to create one.
          </ThemedText>
        }
        renderItem={({ item: category }) => (
          <View key={category.id}>
            <Pressable
              style={[
                styles.categoryItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryContent}>
                <IconSymbol
                  name={
                    expandedCategories.has(category.id)
                      ? "chevron.down"
                      : "chevron.right"
                  }
                  size={18}
                  color={colors.accent}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.categoryTitle}>
                    {category.name}
                  </ThemedText>
                  <ThemedText style={styles.countText}>
                    {linkCounts[category.id] || 0} links
                  </ThemedText>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    openEditModal(category.id, category.name, "category")
                  }
                  style={styles.iconButton}
                  hitSlop={8}
                >
                  <IconSymbol
                    name="pencil.circle.fill"
                    size={18}
                    color={colors.accent}
                  />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteCategory(category.id)}
                  style={styles.iconButton}
                  hitSlop={8}
                >
                  <IconSymbol
                    name="trash"
                    size={18}
                    color={colors.destructive}
                  />
                </Pressable>
              </View>
            </Pressable>

            {expandedCategories.has(category.id) && (
              <View>
                {category.subCategories.map((subCategory) => (
                  <Pressable
                    key={subCategory.id}
                    style={[
                      styles.subCategoryItem,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.subCategoryContent}>
                      <IconSymbol
                        name="link"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.subCategoryTitle}>
                          {subCategory.name}
                        </ThemedText>
                        <ThemedText style={styles.countText}>
                          {linkCounts[subCategory.id] || 0} links
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() =>
                          openEditModal(
                            subCategory.id,
                            subCategory.name,
                            "subcategory",
                          )
                        }
                        style={styles.iconButton}
                        hitSlop={8}
                      >
                        <IconSymbol
                          name="pencil.circle.fill"
                          size={18}
                          color={colors.accent}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteSubCategory(subCategory.id)}
                        style={styles.iconButton}
                        hitSlop={8}
                      >
                        <IconSymbol
                          name="trash"
                          size={18}
                          color={colors.destructive}
                        />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}

                <Pressable
                  style={[
                    styles.addSubCategoryBtn,
                    { borderColor: colors.accent },
                  ]}
                  onPress={() => openAddSubCategoryModal(category.id)}
                >
                  <IconSymbol name="plus" size={16} color={colors.accent} />
                  <ThemedText style={{ color: colors.accent, fontSize: 13 }}>
                    Add sub-category
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={openAddCategoryModal}
      >
        <IconSymbol name="plus" size={28} color="#fff" />
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">
                {modalType === "category"
                  ? selectedItemId
                    ? "Edit Category"
                    : "Add Category"
                  : modalType === "subcategory"
                    ? "Add Sub-Category"
                    : editingType === "category"
                      ? "Edit Category"
                      : "Edit Sub-Category"}
              </ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark" size={22} color={colors.icon} />
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholder={
                modalType === "category" || editingType === "category"
                  ? "Category name"
                  : "Sub-category name"
              }
              placeholderTextColor={colors.placeholder}
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
            />

            <Pressable
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSave}
            >
              <ThemedText
                style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
              >
                Save
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  categoryItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  categoryTitle: { fontSize: 16, fontWeight: "600" },
  countText: { fontSize: 12, marginTop: 4 },
  subCategoryItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginLeft: 32,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subCategoryContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  subCategoryTitle: { fontSize: 14, fontWeight: "500" },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    padding: 6,
  },
  addSubCategoryBtn: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 12,
    marginLeft: 32,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  saveBtn: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
});
