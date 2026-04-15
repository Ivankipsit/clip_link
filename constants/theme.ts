import { Platform } from "react-native";

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

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
