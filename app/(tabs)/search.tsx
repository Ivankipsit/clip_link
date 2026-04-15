import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
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
import { Colors } from "@/constants/theme";
import { useAppearance } from "@/context/appearance-context";
import { Link, getLinks } from "@/store/links-store";

export default function SearchScreen() {
  const { resolvedTheme } = useAppearance();
  const colors = Colors[resolvedTheme];
  const [links, setLinks] = useState<Link[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    [],
  );

  useFocusEffect(
    useCallback(() => {
      getLinks().then(setLinks);
    }, []),
  );

  const categories = useMemo(
    () => [...new Set(links.map((l) => l.category).filter(Boolean))],
    [links],
  );

  const subCategories = useMemo(
    () => [...new Set(links.map((l) => l.subCategory).filter(Boolean))],
    [links],
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const toggleSubCategory = (sub: string) => {
    setSelectedSubCategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub],
    );
  };

  const clearSearch = () => {
    setQuery("");
    setSelectedCategories([]);
    setSelectedSubCategories([]);
  };

  const filteredLinks = useMemo(() => {
    let result = links;

    if (selectedCategories.length > 0) {
      result = result.filter((l) => selectedCategories.includes(l.category));
    }

    if (selectedSubCategories.length > 0) {
      result = result.filter((l) =>
        selectedSubCategories.includes(l.subCategory),
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.subCategory.toLowerCase().includes(q),
      );
    }

    return result;
  }, [links, query, selectedCategories, selectedSubCategories]);

  const hasFilters =
    query.trim() ||
    selectedCategories.length > 0 ||
    selectedSubCategories.length > 0;

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

      {categories.length > 0 && (
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
            {categories.map((cat) => {
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
                    style={{
                      fontSize: 13,
                      color: selected ? "#fff" : colors.text,
                    }}
                  >
                    {cat}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {subCategories.length > 0 && (
        <View style={styles.filterSection}>
          <ThemedText
            style={[styles.filterLabel, { color: colors.textSecondary }]}
          >
            Sub-categories
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {subCategories.map((sub) => {
              const selected = selectedSubCategories.includes(sub);
              return (
                <Pressable
                  key={sub}
                  onPress={() => toggleSubCategory(sub)}
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
                    style={{
                      fontSize: 13,
                      color: selected ? "#fff" : colors.text,
                    }}
                  >
                    {sub}
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
          <ThemedText
            style={{ color: colors.textSecondary, textAlign: "center" }}
          >
            {hasFilters ? "No matching links." : "No links yet."}
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
            <ThemedText numberOfLines={1} style={{ fontWeight: "600" }}>
              {item.title}
            </ThemedText>
            <ThemedText
              numberOfLines={1}
              style={{ color: colors.textSecondary, fontSize: 13 }}
            >
              {item.url}
            </ThemedText>
          </Pressable>
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
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
});
