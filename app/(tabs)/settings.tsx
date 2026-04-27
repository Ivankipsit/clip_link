import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { AppearanceMode, useAppearance } from "@/context/appearance-context";
import { useSync } from "@/context/sync-context";
import { deleteAllCategories, getCategories } from "@/store/categories-store";
import { deleteAllLinks, getLinks } from "@/store/links-store";
import { LogEntry, clearLogs, getLogs } from "@/store/logs-store";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

const MODES: { value: AppearanceMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function SettingsScreen() {
  const { mode, setMode, resolvedTheme } = useAppearance();
  const {
    isOnline,
    syncEnabled,
    setSyncEnabled,
    smartCategorize,
    setSmartCategorize,
    deleteLinksOnCategoryRemove,
    setDeleteLinksOnCategoryRemove,
    categoryViewMode,
    setCategoryViewMode,
  } = useSync();
  const colors = Colors[resolvedTheme];

  const [categoryCount, setCategoryCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      getCategories().then((cats) => setCategoryCount(cats.length));
      getLinks().then((lnks) => setLinkCount(lnks.length));
      getLogs().then(setLogs);
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.textSecondary }]}
          >
            Appearance
          </ThemedText>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {MODES.map((m, i) => (
              <Pressable
                key={m.value}
                style={[
                  styles.row,
                  i < MODES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => setMode(m.value)}
              >
                <ThemedText style={{ fontSize: 16 }}>{m.label}</ThemedText>
                {mode === m.value && (
                  <IconSymbol
                    name="checkmark"
                    size={18}
                    color={colors.accent}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.textSecondary }]}
          >
            Data & Sync
          </ThemedText>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <ThemedText style={{ fontSize: 16 }}>Enable Sync</ThemedText>
                <ThemedText
                  style={{ fontSize: 12, color: colors.textSecondary }}
                >
                  Sync bookmarks to the cloud via Supabase
                </ThemedText>
              </View>
              <Switch
                value={syncEnabled}
                onValueChange={setSyncEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View
              style={[
                styles.row,
                { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <ThemedText style={{ fontSize: 16 }}>Status</ThemedText>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isOnline
                        ? colors.success
                        : colors.warning,
                    },
                  ]}
                />
                <ThemedText
                  style={{ fontSize: 14, color: colors.textSecondary }}
                >
                  {isOnline ? "Online" : "Offline"}
                </ThemedText>
              </View>
            </View>
            <View
              style={[
                styles.row,
                { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <ThemedText style={{ fontSize: 16 }}>Storage</ThemedText>
              <ThemedText style={{ fontSize: 14, color: colors.textSecondary }}>
                {syncEnabled ? "Local + Cloud" : "Local only"}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.textSecondary }]}
          >
            Features
          </ThemedText>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <ThemedText style={{ fontSize: 16 }}>
                  Smart Categorize
                </ThemedText>
                <ThemedText
                  style={{ fontSize: 12, color: colors.textSecondary }}
                >
                  Auto-suggest category based on URL
                </ThemedText>
              </View>
              <Switch
                value={smartCategorize}
                onValueChange={setSmartCategorize}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View
              style={[
                styles.row,
                { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <View style={styles.rowLabel}>
                <ThemedText style={{ fontSize: 16 }}>
                  Delete Links with Category
                </ThemedText>
                <ThemedText
                  style={{ fontSize: 12, color: colors.textSecondary }}
                >
                  Delete associated links when removing a category
                </ThemedText>
              </View>
              <Switch
                value={deleteLinksOnCategoryRemove}
                onValueChange={setDeleteLinksOnCategoryRemove}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View
              style={[
                styles.row,
                { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <View style={styles.rowLabel}>
                <ThemedText style={{ fontSize: 16 }}>Category View</ThemedText>
                <ThemedText
                  style={{ fontSize: 12, color: colors.textSecondary }}
                >
                  Display categories as list or grid
                </ThemedText>
              </View>
              <View style={styles.statusRow}>
                <Pressable
                  onPress={() => setCategoryViewMode("list")}
                  style={[
                    styles.viewModeBtn,
                    {
                      backgroundColor:
                        categoryViewMode === "list"
                          ? colors.accent
                          : colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <IconSymbol
                    name="list.bullet"
                    size={16}
                    color={categoryViewMode === "list" ? "#fff" : colors.text}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setCategoryViewMode("grid")}
                  style={[
                    styles.viewModeBtn,
                    {
                      backgroundColor:
                        categoryViewMode === "grid"
                          ? colors.accent
                          : colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <IconSymbol
                    name="square.grid.2x2"
                    size={16}
                    color={categoryViewMode === "grid" ? "#fff" : colors.text}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <View style={styles.logHeader}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Logs
            </ThemedText>
            {logs.length > 0 && (
              <Pressable
                onPress={() => {
                  const doClear = () => {
                    clearLogs().then(() => setLogs([]));
                  };
                  if (Platform.OS === "web") {
                    if (window.confirm("Clear all logs?")) doClear();
                  } else {
                    Alert.alert("Clear Logs", "Remove all log entries?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Clear", style: "destructive", onPress: doClear },
                    ]);
                  }
                }}
              >
                <ThemedText style={{ fontSize: 12, color: colors.destructive }}>
                  Clear
                </ThemedText>
              </Pressable>
            )}
          </View>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                maxHeight: 300,
              },
            ]}
          >
            {logs.length === 0 ? (
              <View style={styles.row}>
                <ThemedText
                  style={{ fontSize: 14, color: colors.textSecondary }}
                >
                  No activity yet
                </ThemedText>
              </View>
            ) : (
              <ScrollView nestedScrollEnabled>
                {logs.slice(0, 50).map((log, i) => (
                  <View
                    key={log.id}
                    style={[
                      styles.logRow,
                      i > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>
                        {log.action}
                      </ThemedText>
                      <ThemedText
                        numberOfLines={1}
                        style={{ fontSize: 12, color: colors.textSecondary }}
                      >
                        {log.detail}
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={{ fontSize: 11, color: colors.textSecondary }}
                    >
                      {formatTime(log.timestamp)}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.textSecondary }]}
          >
            Danger Zone
          </ThemedText>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Pressable
              style={[styles.row, { opacity: categoryCount === 0 ? 0.4 : 1 }]}
              disabled={categoryCount === 0}
              onPress={() => {
                const doDelete = () => {
                  deleteAllCategories().then(() => setCategoryCount(0));
                };
                if (Platform.OS === "web") {
                  if (
                    window.confirm(
                      "Delete all categories? This cannot be undone.",
                    )
                  ) {
                    doDelete();
                  }
                } else {
                  Alert.alert(
                    "Delete All Categories",
                    "This will remove all categories. This cannot be undone.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: doDelete,
                      },
                    ],
                  );
                }
              }}
            >
              <View style={styles.rowLabel}>
                <ThemedText style={{ fontSize: 16, color: colors.destructive }}>
                  Delete All Categories
                </ThemedText>
                <ThemedText
                  style={{ fontSize: 12, color: colors.textSecondary }}
                >
                  Remove every category and subcategory
                </ThemedText>
              </View>
              <IconSymbol name="trash" size={18} color={colors.destructive} />
            </Pressable>
            <Pressable
              style={[
                styles.row,
                {
                  opacity: linkCount === 0 ? 0.4 : 1,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
              disabled={linkCount === 0}
              onPress={() => {
                const doDelete = () => {
                  deleteAllLinks().then(() => setLinkCount(0));
                };
                if (Platform.OS === "web") {
                  if (
                    window.confirm("Delete all links? This cannot be undone.")
                  ) {
                    doDelete();
                  }
                } else {
                  Alert.alert(
                    "Delete All Links",
                    "This will remove all saved links. This cannot be undone.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: doDelete,
                      },
                    ],
                  );
                }
              }}
            >
              <View style={styles.rowLabel}>
                <ThemedText style={{ fontSize: 16, color: colors.destructive }}>
                  Delete All Links
                </ThemedText>
                <ThemedText
                  style={{ fontSize: 12, color: colors.textSecondary }}
                >
                  Remove every saved link
                </ThemedText>
              </View>
              <IconSymbol name="trash" size={18} color={colors.destructive} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 24 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  rowLabel: { flex: 1, gap: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  viewModeBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 4,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    gap: 8,
  },
});
