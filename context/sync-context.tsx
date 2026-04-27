import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

export type CategoryViewMode = "list" | "grid";

type SyncContextType = {
  isOnline: boolean;
  syncEnabled: boolean;
  setSyncEnabled: (v: boolean) => void;
  smartCategorize: boolean;
  setSmartCategorize: (v: boolean) => void;
  deleteLinksOnCategoryRemove: boolean;
  setDeleteLinksOnCategoryRemove: (v: boolean) => void;
  categoryViewMode: CategoryViewMode;
  setCategoryViewMode: (v: CategoryViewMode) => void;
};

const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  syncEnabled: false,
  setSyncEnabled: () => {},
  smartCategorize: true,
  setSmartCategorize: () => {},
  deleteLinksOnCategoryRemove: false,
  setDeleteLinksOnCategoryRemove: () => {},
  categoryViewMode: "list",
  setCategoryViewMode: () => {},
});

const SYNC_KEY = "clip_link_sync_enabled";
const SMART_CATEGORIZE_KEY = "clip_link_smart_categorize";
const DELETE_LINKS_ON_CAT_REMOVE_KEY = "clip_link_delete_links_on_cat_remove";
const CATEGORY_VIEW_MODE_KEY = "clip_link_category_view_mode";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncEnabled, setSyncEnabledState] = useState(false);
  const [smartCategorize, setSmartCategorizeState] = useState(true);
  const [deleteLinksOnCategoryRemove, setDeleteLinksOnCategoryRemoveState] =
    useState(false);
  const [categoryViewMode, setCategoryViewModeState] =
    useState<CategoryViewMode>("list");

  useEffect(() => {
    AsyncStorage.getItem(SYNC_KEY).then((val) => {
      if (val === "true") setSyncEnabledState(true);
    });
    AsyncStorage.getItem(SMART_CATEGORIZE_KEY).then((val) => {
      if (val === "false") setSmartCategorizeState(false);
    });
    AsyncStorage.getItem(DELETE_LINKS_ON_CAT_REMOVE_KEY).then((val) => {
      if (val === "true") setDeleteLinksOnCategoryRemoveState(true);
    });
    AsyncStorage.getItem(CATEGORY_VIEW_MODE_KEY).then((val) => {
      if (val === "grid") setCategoryViewModeState("grid");
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

  const setSmartCategorize = useCallback((v: boolean) => {
    setSmartCategorizeState(v);
    AsyncStorage.setItem(SMART_CATEGORIZE_KEY, v ? "true" : "false");
  }, []);

  const setDeleteLinksOnCategoryRemove = useCallback((v: boolean) => {
    setDeleteLinksOnCategoryRemoveState(v);
    AsyncStorage.setItem(DELETE_LINKS_ON_CAT_REMOVE_KEY, v ? "true" : "false");
  }, []);

  const setCategoryViewMode = useCallback((v: CategoryViewMode) => {
    setCategoryViewModeState(v);
    AsyncStorage.setItem(CATEGORY_VIEW_MODE_KEY, v);
  }, []);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        syncEnabled,
        setSyncEnabled,
        smartCategorize,
        setSmartCategorize,
        deleteLinksOnCategoryRemove,
        setDeleteLinksOnCategoryRemove,
        categoryViewMode,
        setCategoryViewMode,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
