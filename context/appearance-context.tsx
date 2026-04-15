import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type AppearanceMode = "light" | "dark" | "system";

type AppearanceContextType = {
  mode: AppearanceMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: AppearanceMode) => void;
};

const AppearanceContext = createContext<AppearanceContextType>({
  mode: "system",
  resolvedTheme: "light",
  setMode: () => {},
});

const STORAGE_KEY = "clip_link_appearance";

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<AppearanceMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark" || val === "system") {
        setModeState(val);
      }
    });
  }, []);

  const setMode = (m: AppearanceMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  };

  const resolvedTheme: "light" | "dark" =
    mode === "system" ? (systemScheme ?? "light") : mode;

  return (
    <AppearanceContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
