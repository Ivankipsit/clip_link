import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Clipboard,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Typography, createThemedStyles } from "@/constants/theme";
import { useAppearance } from "@/context/appearance-context";
import { getAllCategoryPaths, getCategories } from "@/store/categories-store";
import { Link, getLinks } from "@/store/links-store";

export default function SearchScreen() {
  const { resolvedTheme } = useAppearance();
  const colors = Colors[resolvedTheme];
  const themed = createThemedStyles(colors);
  const [links, setLinks] = useState<Link[]>([]);
  const [validCategoryPaths, setValidCategoryPaths] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getLinks().then(setLinks);
      getCategories().then((cats) => {
        const paths = getAllCategoryPaths(cats).map((p) => p.path);
        setValidCategoryPaths(paths);
      });
    }, []),
  );

  // Only show categories that still exist
  const categoryPaths = useMemo(
    () =>
      validCategoryPaths.filter((p) =>
        links.some(
          (l) =>
            l.categoryPath === p ||
            (l.categoryPath && l.categoryPath.startsWith(p + " > ")),
        ),
      ),
    [links, validCategoryPaths],
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const clearSearch = () => {
    setQuery("");
    setSelectedCategories([]);
  };

  const filteredLinks = useMemo(() => {
    let result = links;

    if (selectedCategories.length > 0) {
      result = result.filter((l) =>
        selectedCategories.some(
          (cat) =>
            l.categoryPath === cat || l.categoryPath.startsWith(cat + " > "),
        ),
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.categoryPath.toLowerCase().includes(q),
      );
    }

    return result;
  }, [links, query, selectedCategories]);

  const hasFilters = query.trim() || selectedCategories.length > 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchHeader}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={colors.placeholder}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search links..."
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
          />
          {hasFilters && (
            <Pressable onPress={clearSearch}>
              <IconSymbol name="xmark" size={16} color={colors.icon} />
            </Pressable>
          )}
        </View>
      </View>

      {categoryPaths.length > 0 && (
        <View style={styles.filterSection}>
          <ThemedText
            style={[styles.filterLabel, { color: colors.textSecondary }]}
          >
            Categories
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {categoryPaths.map((cat) => {
              const selected = selectedCategories.includes(cat);
              return (
                <Pressable
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? colors.accent
                        : colors.surfaceSecondary,
                      borderColor: selected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      Typography.captionMedium,
                      { color: selected ? "#fff" : colors.text },
                    ]}
                  >
                    {cat}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredLinks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredLinks.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <ThemedText style={[themed.textSecondary, Typography.textCenter]}>
            {hasFilters ? "No matching links." : "No links yet."}
          </ThemedText>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, themed.cardContainer]}>
            <View style={styles.cardBody}>
              <View style={styles.cardInfo}>
                <ThemedText numberOfLines={1} style={styles.cardTitle}>
                  {item.title}
                </ThemedText>
                <ThemedText
                  numberOfLines={1}
                  style={[Typography.caption, themed.textSecondary]}
                >
                  {item.categoryPath || "Uncategorized"}
                </ThemedText>
                <ThemedText
                  numberOfLines={1}
                  style={[Typography.captionMedium, themed.textAccent]}
                >
                  {item.url}
                </ThemedText>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => Linking.openURL(item.url)}
                  hitSlop={8}
                  style={styles.cardActionBtn}
                >
                  <IconSymbol name="safari" size={20} color={colors.accent} />
                </Pressable>
                <Pressable
                  onPress={() => Clipboard.setString(item.url)}
                  hitSlop={8}
                  style={styles.cardActionBtn}
                >
                  <IconSymbol
                    name="doc.on.doc"
                    size={20}
                    color={colors.accent}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: { padding: 16, paddingBottom: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  filterSection: { paddingHorizontal: 16, paddingBottom: 4 },
  filterLabel: { fontSize: 12, marginBottom: 6, fontWeight: "600" },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  list: { padding: 16, gap: 10 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontWeight: "600", fontSize: 15 },
  cardActions: { flexDirection: "row", gap: 8 },
  cardActionBtn: { padding: 6 },
});
