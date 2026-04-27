import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useAppearance } from "@/context/appearance-context";

export default function TabLayout() {
  const { resolvedTheme } = useAppearance();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[resolvedTheme].tabIconSelected,
        tabBarInactiveTintColor: Colors[resolvedTheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[resolvedTheme].surface,
          borderTopColor: Colors[resolvedTheme].border,
        },
        headerStyle: {
          backgroundColor: Colors[resolvedTheme].surface,
        },
        headerTintColor: Colors[resolvedTheme].text,
        headerShadowVisible: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Browse",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="folder.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
