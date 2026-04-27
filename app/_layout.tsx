import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import {
    AppearanceProvider,
    useAppearance,
} from "@/context/appearance-context";
import { SyncProvider } from "@/context/sync-context";

function RootLayoutInner() {
  const { resolvedTheme } = useAppearance();
  return (
    <ThemeProvider value={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <SyncProvider>
        <RootLayoutInner />
      </SyncProvider>
    </AppearanceProvider>
  );
}
