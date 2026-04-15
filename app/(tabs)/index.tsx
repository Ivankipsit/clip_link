import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
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
import { useSync } from "@/context/sync-context";
import { Category, getCategories } from "@/store/categories-store";
import {
  Link,
  deleteLink,
  getLinks,
  saveLink,
  updateLink,
} from "@/store/links-store";

export default function LinksScreen() {
  const router = useRouter();

  const { resolvedTheme } = useAppearance();
  const { isOnline, syncEnabled } = useSync();
  const colors = Colors[resolvedTheme];

  const [links, setLinks] = useState<Link[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const [urlError, setUrlError] = useState("");

  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showSubCategorySuggestions, setShowSubCategorySuggestions] =
    useState(false);

  const selectedCategoryObj = categories.find((c) => c.name === category);
  const subCategories = selectedCategoryObj?.subCategories || [];

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString.includes("://") ? urlString : `https://${urlString}`);
      return true;
    } catch {
      return false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      getLinks().then(setLinks);
      getCategories().then(setCategories);
    }, []),
  );

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
  };

  const handleAdd = async () => {
    if (!isValidUrl(url)) {
      setUrlError("Please enter a valid URL");
      return;
    }

    if (editingId) {
      await updateLink(editingId, {
        url: url.trim(),
        title: title.trim() || url.trim(),
        category: category.trim(),
        subCategory: subCategory.trim(),
        synced: false,
      });
    } else {
      await saveLink({
        url: url.trim(),
        title: title.trim() || url.trim(),
        category: category.trim(),
        subCategory: subCategory.trim(),
      });
    }

    resetForm();
    getLinks().then(setLinks);
  };

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setCategory("");
    setSubCategory("");
    setEditingId(null);
    setUrlError("");
    setModalVisible(false);
  };

  const handleEdit = (link: Link) => {
    setEditingId(link.id);
    setUrl(link.url);
    setTitle(link.title);
    setCategory(link.category);
    setSubCategory(link.subCategory);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Link", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteLink(id);
          getLinks().then(setLinks);
        },
      },
    ]);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
      {!isOnline && (
        <View
          style={[styles.statusBanner, { backgroundColor: colors.warning }]}
        >
          <IconSymbol name="wifi.slash" size={14} color="#fff" />
          <ThemedText style={styles.statusText}>Offline</ThemedText>
        </View>
      )}

      <FlatList
        data={links}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          links.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <ThemedText
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            No links yet. Tap + to add one.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => Linking.openURL(item.url)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <ThemedText numberOfLines={1} style={styles.cardTitle}>
                  {item.title}
                </ThemedText>

                {syncEnabled && (
                  <View
                    style={[
                      styles.syncDot,
                      {
                        backgroundColor: item.synced
                          ? colors.success
                          : colors.textSecondary,
                      },
                    ]}
                  />
                )}

                <Pressable onPress={() => handleEdit(item)}>
                  <IconSymbol
                    name="pencil.circle.fill"
                    size={20}
                    color={colors.accent}
                  />
                </Pressable>

                <Pressable onPress={() => handleDelete(item.id)}>
                  <IconSymbol name="trash" size={20} color="#ff4444" />
                </Pressable>
              </View>

              <ThemedText numberOfLines={1} style={{ fontSize: 13 }}>
                {item.url}
              </ThemedText>

              {(item.category || item.subCategory) && (
                <View style={styles.tags}>
                  {item.category && (
                    <View style={styles.tag}>
                      <ThemedText>{item.category}</ThemedText>
                    </View>
                  )}
                  {item.subCategory && (
                    <View
                      style={[
                        styles.tag,
                        {
                          backgroundColor: colors.surfaceSecondary,
                        },
                      ]}
                    >
                      <ThemedText>{item.subCategory}</ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        )}
      />

      {/* FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setModalVisible(true)}
      >
        <IconSymbol name="plus" size={28} color="#fff" />
      </Pressable>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <ThemedText type="subtitle">
              {editingId ? "Edit Link" : "Add Link"}
            </ThemedText>

            {/* URL */}
            <View style={styles.urlRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                placeholderTextColor={colors.placeholder}
                placeholder="URL"
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setUrlError("");
                }}
              />
              <Pressable style={styles.pasteBtn} onPress={handlePaste}>
                <IconSymbol name="doc.on.clipboard" size={18} color="#fff" />
              </Pressable>
            </View>

            {urlError && <ThemedText>{urlError}</ThemedText>}

            {/* TITLE */}
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholderTextColor={colors.placeholder}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />

            {/* CATEGORY */}
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholderTextColor={colors.placeholder}
              placeholder="Category"
              value={category}
              onChangeText={(t) => {
                setCategory(t);
                setSubCategory("");
                setShowCategorySuggestions(true);
              }}
            />

            {showCategorySuggestions && category.length > 0 && (
              <View
                style={[
                  styles.suggestions,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                {categories.filter((c) =>
                  c.name.toLowerCase().includes(category.toLowerCase()),
                ).length > 0 ? (
                  categories
                    .filter((c) =>
                      c.name.toLowerCase().includes(category.toLowerCase()),
                    )
                    .map((c) => (
                      <Pressable
                        key={c.id}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setCategory(c.name);
                          setShowCategorySuggestions(false);
                        }}
                      >
                        <ThemedText>{c.name}</ThemedText>
                      </Pressable>
                    ))
                ) : (
                  <Pressable
                    style={styles.suggestionItem}
                    onPress={() => router.push("/categories")}
                  >
                    <ThemedText>No results. Add →</ThemedText>
                  </Pressable>
                )}
              </View>
            )}

            {/* SUBCATEGORY */}
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholderTextColor={colors.placeholder}
              placeholder="Sub-category"
              value={subCategory}
              editable={!!category}
              onChangeText={(t) => {
                setSubCategory(t);
                setShowSubCategorySuggestions(true);
              }}
            />

            {showSubCategorySuggestions && subCategory.length > 0 && (
              <View
                style={[
                  styles.suggestions,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                {subCategories.filter((s) =>
                  s.name.toLowerCase().includes(subCategory.toLowerCase()),
                ).length > 0 ? (
                  subCategories
                    .filter((s) =>
                      s.name.toLowerCase().includes(subCategory.toLowerCase()),
                    )
                    .map((s) => (
                      <Pressable
                        key={s.id}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setSubCategory(s.name);
                          setShowSubCategorySuggestions(false);
                        }}
                      >
                        <ThemedText>{s.name}</ThemedText>
                      </Pressable>
                    ))
                ) : (
                  <Pressable
                    style={styles.suggestionItem}
                    onPress={() => router.push("/categories")}
                  >
                    <ThemedText>No results. Add →</ThemedText>
                  </Pressable>
                )}
              </View>
            )}

            {/* SAVE */}
            <Pressable
              style={[
                styles.addBtn,
                {
                  backgroundColor: isValidUrl(url)
                    ? colors.accent
                    : colors.border,
                },
              ]}
              onPress={handleAdd}
              disabled={!isValidUrl(url)}
            >
              <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 10 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardContent: { gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  statusText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tags: { flexDirection: "row", gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  urlRow: { flexDirection: "row", gap: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  urlInput: { flex: 1 },
  pasteBtn: {
    width: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: { borderRadius: 10, padding: 14, alignItems: "center", marginTop: 4 },
  iconButton: { padding: 6 },
  dropdown: {
    marginTop: "auto",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    overflow: "hidden",
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1 },
});
