import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useAppearance } from "@/context/appearance-context";
import { useSync } from "@/context/sync-context";
import {
  Category,
  addCategory,
  countDescendants,
  deleteCategory,
  getAllCategoryPaths,
  getCategories,
  getCategoryPath,
  getChildren,
  updateCategory,
} from "@/store/categories-store";
import {
  Link,
  clearCategoryPathFromLinks,
  countLinksByCategoryPath,
  deleteLink,
  deleteLinksByCategoryPath,
  getLinks,
  saveLink,
  updateLink,
} from "@/store/links-store";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

type SortMode = "name-asc" | "name-desc" | "links-desc" | "links-asc";
type FilterMode = "all" | "folders" | "links";

export default function BrowseScreen() {
  const { resolvedTheme } = useAppearance();
  const {
    isOnline,
    smartCategorize,
    deleteLinksOnCategoryRemove,
    categoryViewMode,
    setCategoryViewMode,
  } = useSync();
  const colors = Colors[resolvedTheme];

  // Data
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({});

  // Navigation
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const currentParentId =
    navigationStack.length > 0
      ? navigationStack[navigationStack.length - 1]
      : null;

  // Toolbar
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  // Category modal
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catInputValue, setCatInputValue] = useState("");

  // Link modal
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkEditingId, setLinkEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [categoryPath, setCategoryPath] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showCategoryTree, setShowCategoryTree] = useState(false);
  const [treeStack, setTreeStack] = useState<(string | null)[]>([null]);

  // FAB menu
  const [showFabMenu, setShowFabMenu] = useState(false);

  const categoryPaths = getAllCategoryPaths(allCategories);

  // Current children categories sorted
  const currentChildren = useMemo(() => {
    const children = getChildren(allCategories, currentParentId);
    return [...children].sort((a, b) => {
      switch (sortMode) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "links-desc":
          return (linkCounts[b.id] || 0) - (linkCounts[a.id] || 0);
        case "links-asc":
          return (linkCounts[a.id] || 0) - (linkCounts[b.id] || 0);
        default:
          return 0;
      }
    });
  }, [allCategories, currentParentId, sortMode, linkCounts]);

  // Links in current folder
  const currentLinks = useMemo(() => {
    if (currentParentId === null) {
      return allLinks.filter((l) => !l.categoryPath);
    }
    const path = getCategoryPath(allCategories, currentParentId);
    return allLinks.filter((l) => l.categoryPath === path);
  }, [allLinks, allCategories, currentParentId]);

  // Combined data for FlatList
  const listData = useMemo(() => {
    const items: { type: "folder" | "link"; data: Category | Link }[] = [];
    if (filterMode !== "links") {
      currentChildren.forEach((c) => items.push({ type: "folder", data: c }));
    }
    if (filterMode !== "folders") {
      currentLinks.forEach((l) => items.push({ type: "link", data: l }));
    }
    return items;
  }, [currentChildren, currentLinks, filterMode]);

  useFocusEffect(
    useCallback(() => {
      setNavigationStack([]);
      loadData();
    }, []),
  );

  const loadData = async () => {
    const cats = await getCategories();
    setAllCategories(cats);
    const lnks = await getLinks();
    setAllLinks(lnks);
    await updateLinkCounts(cats);
  };

  const updateLinkCounts = async (cats: Category[]) => {
    const counts: Record<string, number> = {};
    for (const cat of cats) {
      const path = getCategoryPath(cats, cat.id);
      counts[cat.id] = await countLinksByCategoryPath(path);
    }
    setLinkCounts(counts);
  };

  // --- Navigation ---
  const navigateInto = (id: string) =>
    setNavigationStack([...navigationStack, id]);
  const navigateBack = () => setNavigationStack(navigationStack.slice(0, -1));

  // --- Category CRUD ---
  const openAddCategory = () => {
    setCatEditingId(null);
    setCatInputValue("");
    setCatModalVisible(true);
    setShowFabMenu(false);
  };

  const openEditCategory = (id: string, name: string) => {
    setCatEditingId(id);
    setCatInputValue(name);
    setCatModalVisible(true);
  };

  const resetCatModal = () => {
    setCatModalVisible(false);
    setCatInputValue("");
    setCatEditingId(null);
  };

  const handleSaveCategory = async () => {
    if (!catInputValue.trim()) return;
    if (catEditingId) {
      await updateCategory(catEditingId, catInputValue.trim());
    } else {
      await addCategory(catInputValue.trim(), currentParentId);
    }
    resetCatModal();
    loadData();
  };

  const handleDeleteCategory = (id: string) => {
    const cat = allCategories.find((c) => c.id === id);
    if (!cat) return;
    const path = getCategoryPath(allCategories, id);
    const msg = deleteLinksOnCategoryRemove
      ? "This will also delete all links in this category."
      : "Links will be kept but uncategorized.";

    const doDelete = async () => {
      if (deleteLinksOnCategoryRemove) {
        await deleteLinksByCategoryPath(path);
      } else {
        await clearCategoryPathFromLinks(path);
      }
      await deleteCategory(id);
      if (navigationStack.includes(id)) {
        setNavigationStack(
          navigationStack.slice(0, navigationStack.indexOf(id)),
        );
      }
      loadData();
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${cat.name}"?\n${msg}`)) doDelete();
      return;
    }
    Alert.alert(`Delete "${cat.name}"?`, msg, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  // --- Link CRUD ---
  const isValidUrl = (s: string): boolean => {
    try {
      new URL(s.includes("://") ? s : `https://${s}`);
      return true;
    } catch {
      return false;
    }
  };

  const suggestCategory = (inputUrl: string) => {
    if (!inputUrl || linkEditingId || !smartCategorize) return;
    let hostname = "";
    let pathname = "";
    try {
      const parsed = new URL(
        inputUrl.includes("://") ? inputUrl : `https://${inputUrl}`,
      );
      hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
      pathname = parsed.pathname.toLowerCase();
    } catch {
      return;
    }
    const urlParts = [
      hostname,
      ...hostname.split("."),
      ...pathname.split("/").filter(Boolean),
    ];
    const domainMatch = allLinks.find((l) => {
      try {
        return (
          new URL(l.url.includes("://") ? l.url : `https://${l.url}`).hostname
            .replace(/^www\./, "")
            .toLowerCase() === hostname
        );
      } catch {
        return false;
      }
    });
    if (domainMatch?.categoryPath) {
      setCategoryPath(domainMatch.categoryPath);
      return;
    }
    for (const { path } of categoryPaths) {
      const pathWords = path
        .toLowerCase()
        .split(/[\s>]+/)
        .filter(Boolean);
      if (
        urlParts.some((part) =>
          pathWords.some(
            (w) => w.length > 2 && (part.includes(w) || w.includes(part)),
          ),
        )
      ) {
        setCategoryPath(path);
        return;
      }
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text);
      suggestCategory(text);
    }
  };

  const ensureCategoryPath = async (path: string) => {
    if (!path.trim()) return;
    const segments = path
      .split(" > ")
      .map((s) => s.trim())
      .filter(Boolean);
    if (segments.length === 0) return;
    let cats = await getCategories();
    let parentId: string | null = null;
    for (const segment of segments) {
      const existing = cats.find(
        (c) =>
          c.parentId === parentId &&
          c.name.toLowerCase() === segment.toLowerCase(),
      );
      if (existing) {
        parentId = existing.id;
      } else {
        const newCat = await addCategory(segment, parentId);
        cats = await getCategories();
        parentId = newCat.id;
      }
    }
  };

  const openAddLink = () => {
    setLinkEditingId(null);
    setUrl("");
    setTitle("");
    if (currentParentId) {
      setCategoryPath(getCategoryPath(allCategories, currentParentId));
    } else {
      setCategoryPath("");
    }
    setUrlError("");
    setShowCategoryTree(false);
    setTreeStack([null]);
    setShowFabMenu(false);
    setLinkModalVisible(true);
  };

  const openEditLink = (link: Link) => {
    setLinkEditingId(link.id);
    setUrl(link.url);
    setTitle(link.title);
    setCategoryPath(link.categoryPath);
    setUrlError("");
    setShowCategoryTree(false);
    setTreeStack([null]);
    getCategories().then(setAllCategories);
    setLinkModalVisible(true);
  };

  const handleSaveLink = async () => {
    if (!isValidUrl(url)) {
      setUrlError("Please enter a valid URL");
      return;
    }
    if (linkEditingId) {
      await updateLink(linkEditingId, {
        url: url.trim(),
        title: title.trim() || url.trim(),
        categoryPath: categoryPath.trim(),
        synced: false,
      });
    } else {
      await saveLink({
        url: url.trim(),
        title: title.trim() || url.trim(),
        categoryPath: categoryPath.trim(),
      });
    }
    await ensureCategoryPath(categoryPath.trim());
    resetLinkModal();
    loadData();
  };

  const resetLinkModal = () => {
    setUrl("");
    setTitle("");
    setCategoryPath("");
    setLinkEditingId(null);
    setUrlError("");
    setShowCategoryTree(false);
    setTreeStack([null]);
    setLinkModalVisible(false);
  };

  const handleDeleteLink = (id: string) => {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this link?")) {
        deleteLink(id).then(() => loadData());
      }
      return;
    }
    Alert.alert("Delete Link", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteLink(id).then(() => loadData()),
      },
    ]);
  };

  // --- Constants ---
  const SORT_OPTIONS: { value: SortMode; label: string; icon: string }[] = [
    { value: "name-asc", label: "Name A → Z", icon: "textformat.abc" },
    { value: "name-desc", label: "Name Z → A", icon: "textformat.abc" },
    { value: "links-desc", label: "Most links", icon: "arrow.down" },
    { value: "links-asc", label: "Fewest links", icon: "arrow.up" },
  ];

  const FILTER_MODES: { value: FilterMode; label: string }[] = [
    { value: "all", label: "All" },
    { value: "folders", label: "Folders" },
    { value: "links", label: "Links" },
  ];

  // --- Render ---
  const renderFolder = (cat: Category) => {
    const isGrid = categoryViewMode === "grid";
    const childCount = countDescendants(allCategories, cat.id);
    const linkCount = linkCounts[cat.id] || 0;
    return (
      <Pressable
        key={cat.id}
        style={[
          isGrid ? styles.gridItem : styles.listItem,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => navigateInto(cat.id)}
        onLongPress={() => openEditCategory(cat.id, cat.name)}
      >
        {isGrid ? (
          <View style={styles.gridItemContent}>
            <IconSymbol name="folder.fill" size={48} color={colors.accent} />
            <ThemedText numberOfLines={2} style={styles.gridItemName}>
              {cat.name}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listItemContent}>
            <IconSymbol name="folder.fill" size={22} color={colors.accent} />
            <View style={styles.listItemText}>
              <ThemedText numberOfLines={1} style={styles.listItemName}>
                {cat.name}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.listItemMeta, { color: colors.textSecondary }]}
            >
              {linkCount} links{childCount > 0 ? ` · ${childCount} sub` : ""}
            </ThemedText>
            <ThemedText
              style={[styles.listItemType, { color: colors.textSecondary }]}
            >
              Folder
            </ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  const renderLink = (link: Link) => {
    const isGrid = categoryViewMode === "grid";
    return (
      <Pressable
        key={link.id}
        style={[
          isGrid ? styles.gridItem : styles.listItem,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => Linking.openURL(link.url)}
        onLongPress={() => openEditLink(link)}
      >
        {isGrid ? (
          <View style={styles.gridItemContent}>
            <IconSymbol name="link" size={36} color={colors.textSecondary} />
            <ThemedText numberOfLines={2} style={styles.gridItemName}>
              {link.title}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listItemContent}>
            <IconSymbol name="link" size={20} color={colors.textSecondary} />
            <View style={styles.listItemText}>
              <ThemedText numberOfLines={1} style={styles.listItemName}>
                {link.title}
              </ThemedText>
              <ThemedText
                numberOfLines={1}
                style={{ fontSize: 12, color: colors.accent }}
              >
                {link.url}
              </ThemedText>
            </View>
            <View style={styles.linkActions}>
              <Pressable
                onPress={() => openEditLink(link)}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <IconSymbol
                  name="pencil.circle.fill"
                  size={18}
                  color={colors.accent}
                />
              </Pressable>
              <Pressable
                onPress={() => handleDeleteLink(link.id)}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <IconSymbol name="trash" size={18} color={colors.destructive} />
              </Pressable>
            </View>
            <ThemedText
              style={[styles.listItemType, { color: colors.textSecondary }]}
            >
              Link
            </ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  const breadcrumb = navigationStack.map((id) => {
    const cat = allCategories.find((c) => c.id === id);
    return cat?.name || "";
  });

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

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {navigationStack.length > 0 ? (
            <View style={styles.breadcrumbRow}>
              <Pressable style={styles.backBtn} onPress={navigateBack}>
                <IconSymbol
                  name="chevron.left"
                  size={18}
                  color={colors.accent}
                />
              </Pressable>
              <ThemedText
                numberOfLines={1}
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  flexShrink: 1,
                }}
              >
                {breadcrumb.slice(0, -1).join(" > ")}
                {breadcrumb.length > 1 ? " > " : ""}
              </ThemedText>
              <ThemedText
                style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}
              >
                {breadcrumb[breadcrumb.length - 1]}
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="subtitle">Browse</ThemedText>
          )}
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.toolbarBtn}
            onPress={() => {
              setShowSortMenu(!showSortMenu);
              setShowViewMenu(false);
            }}
          >
            <IconSymbol
              name="arrow.up.arrow.down"
              size={14}
              color={colors.accent}
            />
            <ThemedText
              style={[styles.toolbarBtnText, { color: colors.accent }]}
            >
              Sort
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.toolbarBtn}
            onPress={() => {
              setShowViewMenu(!showViewMenu);
              setShowSortMenu(false);
            }}
          >
            <IconSymbol
              name={
                categoryViewMode === "list" ? "list.bullet" : "square.grid.2x2"
              }
              size={14}
              color={colors.accent}
            />
            <ThemedText
              style={[styles.toolbarBtnText, { color: colors.accent }]}
            >
              View
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_MODES.map((fm) => (
          <Pressable
            key={fm.value}
            onPress={() => setFilterMode(fm.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filterMode === fm.value
                    ? colors.accent
                    : colors.surfaceSecondary,
                borderColor:
                  filterMode === fm.value ? colors.accent : colors.border,
              },
            ]}
          >
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: filterMode === fm.value ? "#fff" : colors.text,
              }}
            >
              {fm.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Sort dropdown */}
      {showSortMenu && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.dropdownItem,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => {
                setSortMode(opt.value);
                setShowSortMenu(false);
              }}
            >
              <IconSymbol
                name={opt.icon as any}
                size={16}
                color={colors.text}
              />
              <ThemedText style={{ fontSize: 14, flex: 1 }}>
                {opt.label}
              </ThemedText>
              {sortMode === opt.value && (
                <IconSymbol name="checkmark" size={14} color={colors.accent} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* View dropdown */}
      {showViewMenu && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              setCategoryViewMode("list");
              setShowViewMenu(false);
            }}
          >
            <IconSymbol name="list.bullet" size={16} color={colors.text} />
            <ThemedText style={{ fontSize: 14 }}>List</ThemedText>
            {categoryViewMode === "list" && (
              <IconSymbol name="checkmark" size={14} color={colors.accent} />
            )}
          </Pressable>
          <Pressable
            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              setCategoryViewMode("grid");
              setShowViewMenu(false);
            }}
          >
            <IconSymbol name="square.grid.2x2" size={16} color={colors.text} />
            <ThemedText style={{ fontSize: 14 }}>Grid</ThemedText>
            {categoryViewMode === "grid" && (
              <IconSymbol name="checkmark" size={14} color={colors.accent} />
            )}
          </Pressable>
        </View>
      )}

      {/* Main content */}
      {categoryViewMode === "grid" ? (
        <FlatList
          key="grid"
          data={listData}
          keyExtractor={(item) =>
            item.type === "folder"
              ? `f-${(item.data as Category).id}`
              : `l-${(item.data as Link).id}`
          }
          numColumns={4}
          contentContainerStyle={
            listData.length === 0 ? styles.emptyContainer : styles.gridList
          }
          ListEmptyComponent={
            <ThemedText
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {filterMode === "links"
                ? "No links here."
                : filterMode === "folders"
                  ? "No folders here."
                  : "Empty. Tap + to add."}
            </ThemedText>
          }
          renderItem={({ item }) =>
            item.type === "folder"
              ? renderFolder(item.data as Category)
              : renderLink(item.data as Link)
          }
        />
      ) : (
        <FlatList
          key="list"
          data={listData}
          keyExtractor={(item) =>
            item.type === "folder"
              ? `f-${(item.data as Category).id}`
              : `l-${(item.data as Link).id}`
          }
          contentContainerStyle={
            listData.length === 0 ? styles.emptyContainer : styles.list
          }
          ListEmptyComponent={
            <ThemedText
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {filterMode === "links"
                ? "No links here."
                : filterMode === "folders"
                  ? "No folders here."
                  : "Empty. Tap + to add."}
            </ThemedText>
          }
          renderItem={({ item }) =>
            item.type === "folder"
              ? renderFolder(item.data as Category)
              : renderLink(item.data as Link)
          }
        />
      )}

      {/* FAB menu */}
      {showFabMenu && (
        <View style={styles.fabMenu}>
          <Pressable
            style={[
              styles.fabMenuItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={openAddLink}
          >
            <IconSymbol name="link" size={18} color={colors.accent} />
            <ThemedText style={{ fontSize: 14 }}>Add Link</ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.fabMenuItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={openAddCategory}
          >
            <IconSymbol name="folder.fill" size={18} color={colors.accent} />
            <ThemedText style={{ fontSize: 14 }}>Add Folder</ThemedText>
          </Pressable>
        </View>
      )}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setShowFabMenu(!showFabMenu)}
      >
        <IconSymbol
          name={showFabMenu ? "xmark" : "plus"}
          size={28}
          color="#fff"
        />
      </Pressable>

      {/* Category Modal */}
      <Modal
        visible={catModalVisible}
        animationType="slide"
        transparent
        onRequestClose={resetCatModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={resetCatModal} />
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">
                {catEditingId ? "Edit Folder" : "Add Folder"}
              </ThemedText>
              <Pressable onPress={resetCatModal}>
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
              placeholder="Folder name"
              placeholderTextColor={colors.placeholder}
              value={catInputValue}
              onChangeText={setCatInputValue}
              autoFocus
            />
            <Pressable
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSaveCategory}
            >
              <ThemedText
                style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
              >
                Save
              </ThemedText>
            </Pressable>
            {catEditingId && (
              <Pressable
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.destructive },
                ]}
                onPress={() => {
                  resetCatModal();
                  handleDeleteCategory(catEditingId);
                }}
              >
                <ThemedText
                  style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
                >
                  Delete
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* Link Modal */}
      <Modal
        visible={linkModalVisible}
        animationType="slide"
        transparent
        onRequestClose={resetLinkModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={resetLinkModal} />
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <ThemedText type="subtitle">
              {linkEditingId ? "Edit Link" : "Add Link"}
            </ThemedText>

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
                placeholderTextColor={colors.placeholder}
                placeholder="URL"
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setUrlError("");
                  suggestCategory(t);
                }}
              />
              <Pressable style={styles.pasteBtn} onPress={handlePaste}>
                <IconSymbol name="doc.on.clipboard" size={18} color="#fff" />
              </Pressable>
            </View>
            {urlError && <ThemedText>{urlError}</ThemedText>}

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

            <View
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                },
              ]}
            >
              <TextInput
                style={{
                  color: colors.text,
                  fontSize: 15,
                  flex: 1,
                  paddingVertical: 0,
                }}
                placeholderTextColor={colors.placeholder}
                placeholder="Category (e.g. Tech > Frontend)"
                value={categoryPath}
                onChangeText={(t) => {
                  setCategoryPath(t);
                  setShowCategoryTree(false);
                }}
              />
              {categoryPath ? (
                <Pressable onPress={() => setCategoryPath("")} hitSlop={8}>
                  <IconSymbol name="xmark" size={16} color={colors.icon} />
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  getCategories().then(setAllCategories);
                  setTreeStack([null]);
                  setShowCategoryTree(!showCategoryTree);
                }}
                hitSlop={8}
              >
                <IconSymbol
                  name={showCategoryTree ? "chevron.down" : "folder.fill"}
                  size={18}
                  color={colors.accent}
                />
              </Pressable>
            </View>

            {showCategoryTree &&
              allCategories.length > 0 &&
              (() => {
                const tp = treeStack[treeStack.length - 1];
                const children = getChildren(allCategories, tp);
                return (
                  <View
                    style={[
                      styles.treeContainer,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    {treeStack.length > 1 && (
                      <Pressable
                        style={[
                          styles.treeItem,
                          { borderBottomColor: colors.border },
                        ]}
                        onPress={() => setTreeStack(treeStack.slice(0, -1))}
                      >
                        <IconSymbol
                          name="chevron.left"
                          size={14}
                          color={colors.accent}
                        />
                        <ThemedText
                          style={{ fontSize: 14, color: colors.accent }}
                        >
                          Back
                        </ThemedText>
                      </Pressable>
                    )}
                    {tp && (
                      <Pressable
                        style={[
                          styles.treeItem,
                          {
                            borderBottomColor: colors.border,
                            backgroundColor: colors.surfaceSecondary,
                          },
                        ]}
                        onPress={() => {
                          setCategoryPath(getCategoryPath(allCategories, tp));
                          setShowCategoryTree(false);
                        }}
                      >
                        <IconSymbol
                          name="checkmark"
                          size={14}
                          color={colors.accent}
                        />
                        <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>
                          Select &ldquo;
                          {allCategories.find((c) => c.id === tp)?.name}
                          &rdquo;
                        </ThemedText>
                      </Pressable>
                    )}
                    <ScrollView
                      style={{ maxHeight: 180 }}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {children.map((cat) => {
                        const hasKids =
                          getChildren(allCategories, cat.id).length > 0;
                        return (
                          <Pressable
                            key={cat.id}
                            style={[
                              styles.treeItem,
                              { borderBottomColor: colors.border },
                            ]}
                            onPress={() => {
                              if (hasKids) {
                                setTreeStack([...treeStack, cat.id]);
                              } else {
                                setCategoryPath(
                                  getCategoryPath(allCategories, cat.id),
                                );
                                setShowCategoryTree(false);
                              }
                            }}
                          >
                            <IconSymbol
                              name="folder.fill"
                              size={16}
                              color={colors.accent}
                            />
                            <ThemedText style={{ fontSize: 14, flex: 1 }}>
                              {cat.name}
                            </ThemedText>
                            {hasKids && (
                              <IconSymbol
                                name="chevron.right"
                                size={14}
                                color={colors.textSecondary}
                              />
                            )}
                          </Pressable>
                        );
                      })}
                      {children.length === 0 && (
                        <View
                          style={[
                            styles.treeItem,
                            { borderBottomColor: colors.border },
                          ]}
                        >
                          <ThemedText
                            style={{
                              fontSize: 13,
                              color: colors.textSecondary,
                            }}
                          >
                            No subcategories
                          </ThemedText>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                );
              })()}

            <Pressable
              style={[
                styles.saveBtn,
                {
                  backgroundColor: isValidUrl(url)
                    ? colors.accent
                    : colors.border,
                },
              ]}
              onPress={handleSaveLink}
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
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  statusText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  backBtn: { padding: 4, marginRight: 8 },
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  toolbarBtnText: { fontSize: 13, fontWeight: "600" },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },

  dropdown: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 100,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 160,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  list: { paddingVertical: 0 },
  gridList: { padding: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  listItemText: { flex: 1 },
  listItemName: { fontSize: 14 },
  listItemMeta: { fontSize: 12, width: 100, textAlign: "right" },
  listItemType: { fontSize: 12, width: 50, textAlign: "right" },

  gridItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
    margin: 4,
  },
  gridItemContent: { alignItems: "center", gap: 6 },
  gridItemName: { fontSize: 12, textAlign: "center" },

  linkActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 4 },

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
    zIndex: 50,
  },
  fabMenu: {
    position: "absolute",
    bottom: 90,
    right: 24,
    gap: 8,
    zIndex: 50,
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
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
  saveBtn: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },

  treeContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
  },
  treeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
