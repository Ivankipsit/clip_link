import { StyleSheet } from "react-native";

// Light: very subtle white and grey
// Dark: grey with purple accent
export const Colors = {
  light: {
    text: "#2c2c2e",
    textSecondary: "#8e8e93",
    background: "#f5f5f7",
    surface: "#ffffff",
    surfaceSecondary: "#ebebed",
    border: "#e0e0e5",
    tint: "#636366",
    accent: "#5a5a6e",
    icon: "#8e8e93",
    tabIconDefault: "#aeaeb2",
    tabIconSelected: "#2c2c2e",
    destructive: "#ff3b30",
    placeholder: "#aeaeb2",
    success: "#34c759",
    warning: "#ff9500",
  },
  dark: {
    text: "#f0eeff",
    textSecondary: "#a0a0b8",
    background: "#1a1a2e",
    surface: "#24243e",
    surfaceSecondary: "#2e2e4a",
    border: "#3a3a5c",
    tint: "#a78bfa",
    accent: "#8b5cf6",
    icon: "#a0a0b8",
    tabIconDefault: "#6b6b8a",
    tabIconSelected: "#a78bfa",
    destructive: "#ff453a",
    placeholder: "#6b6b8a",
    success: "#30d158",
    warning: "#ff9f0a",
  },
};

export type ThemeColors = (typeof Colors)["light"];

// ── Static typography (no color dependency) ──
export const Typography = StyleSheet.create({
  body: { fontSize: 16 },
  bodySmall: { fontSize: 14 },
  caption: { fontSize: 12 },
  captionMedium: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: "600" },
  labelMedium: { fontSize: 13, fontWeight: "600" },
  semibold: { fontSize: 14, fontWeight: "600" },
  buttonText: { fontWeight: "600", fontSize: 16 },
  textCenter: { textAlign: "center" },
});

// ── Dynamic styles that depend on theme colors ──
export function createThemedStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Text colors
    textSecondary: { color: colors.textSecondary },
    textAccent: { color: colors.accent },
    textDestructive: { color: colors.destructive },
    textWhite: { color: "#fff" },

    // Surfaces
    cardContainer: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    inputBase: {
      color: colors.text,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },

    // Borders
    separator: { borderTopWidth: 1, borderTopColor: colors.border },
    separatorBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  });
}

// ── Shared layout styles (no color dependency) ──
export const SharedStyles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
});
