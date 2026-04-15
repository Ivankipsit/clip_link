import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type SyncContextType = {
  isOnline: boolean;
  syncEnabled: boolean;
  setSyncEnabled: (v: boolean) => void;
};

const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  syncEnabled: false,
  setSyncEnabled: () => {},
});

const SYNC_KEY = "clip_link_sync_enabled";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncEnabled, setSyncEnabledState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SYNC_KEY).then((val) => {
      if (val === "true") setSyncEnabledState(true);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  const setSyncEnabled = useCallback((v: boolean) => {
    setSyncEnabledState(v);
    AsyncStorage.setItem(SYNC_KEY, v ? "true" : "false");
  }, []);

  return (
    <SyncContext.Provider value={{ isOnline, syncEnabled, setSyncEnabled }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
