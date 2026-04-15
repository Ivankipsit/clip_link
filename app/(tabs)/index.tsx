import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useSharedLink } from "@/context/share-intent-context";
import { useSync } from "@/context/sync-context";
import { Link, deleteLink, getLinks, saveLink } from "@/store/links-store";

export default function LinksScreen() {
  const { resolvedTheme } = useAppearance();
  const { isOnline, syncEnabled } = useSync();
  const { sharedItem, clearSharedItem } = useSharedLink();
  const colors = Colors[resolvedTheme];
  const [links, setLinks] = useState<Link[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  useFocusEffect(
    useCallback(() => {
      getLinks().then(setLinks);
    }, []),
  );

  // Auto-open add modal when a URL is shared into the app
  useEffect(() => {
    if (sharedItem) {
      const sharedUrl = sharedItem.weblink || sharedItem.text || "";
      if (sharedUrl) {
        setUrl(sharedUrl);
        setModalVisible(true);
        clearSharedItem();
      }
    }
  }, [sharedItem, clearSharedItem]);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
  };

  const handleAdd = async () => {
    if (!url.trim()) return;
    await saveLink({
      url: url.trim(),
      title: title.trim() || url.trim(),
      category: category.trim(),
      subCategory: subCategory.trim(),
    });
    setUrl("");
    setTitle("");
    setCategory("");
    setSubCategory("");
    setModalVisible(false);
    getLinks().then(setLinks);
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
            onLongPress={() => handleDelete(item.id)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <ThemedText
                  numberOfLines={1}
                  style={[styles.cardTitle, { flex: 1 }]}
                >
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
              </View>
              <ThemedText
                numberOfLines={1}
                style={{ color: colors.textSecondary, fontSize: 13 }}
              >
                {item.url}
              </ThemedText>
              {(item.category || item.subCategory) && (
                <View style={styles.tags}>
                  {item.category ? (
                    <View
                      style={[
                        styles.tag,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                    >
                      <ThemedText
                        style={{ fontSize: 12, color: colors.textSecondary }}
                      >
                        {item.category}
                      </ThemedText>
                    </View>
                  ) : null}
                  {item.subCategory ? (
                    <View
                      style={[
                        styles.tag,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                    >
                      <ThemedText
                        style={{ fontSize: 12, color: colors.textSecondary }}
                      >
                        {item.subCategory}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </Pressable>
        )}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setModalVisible(true)}
      >
        <IconSymbol name="plus" size={28} color="#fff" />
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add Link</ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark" size={22} color={colors.icon} />
              </Pressable>
            </View>

            <View style={styles.urlRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.urlInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                placeholder="URL"
                placeholderTextColor={colors.placeholder}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Pressable
                style={[styles.pasteBtn, { backgroundColor: colors.accent }]}
                onPress={handlePaste}
              >
                <IconSymbol name="doc.on.clipboard" size={18} color="#fff" />
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
              placeholder="Title (optional)"
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholder="Category"
              placeholderTextColor={colors.placeholder}
              value={category}
              onChangeText={setCategory}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholder="Sub-category"
              placeholderTextColor={colors.placeholder}
              value={subCategory}
              onChangeText={setSubCategory}
            />

            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.accent }]}
              onPress={handleAdd}
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
  urlRow: { flexDirection: "row", gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  urlInput: { flex: 1 },
  pasteBtn: {
    width: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
});
