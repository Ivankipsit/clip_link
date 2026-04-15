import { Pressable, StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { AppearanceMode, useAppearance } from "@/context/appearance-context";
import { useSync } from "@/context/sync-context";

const MODES: { value: AppearanceMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function SettingsScreen() {
  const { mode, setMode, resolvedTheme } = useAppearance();
  const { isOnline, syncEnabled, setSyncEnabled } = useSync();
  const colors = Colors[resolvedTheme];

  return (
    <ThemedView style={styles.container}>
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
                <IconSymbol name="checkmark" size={18} color={colors.accent} />
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
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
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
                    backgroundColor: isOnline ? colors.success : colors.warning,
                  },
                ]}
              />
              <ThemedText style={{ fontSize: 14, color: colors.textSecondary }}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 24 },
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
});
