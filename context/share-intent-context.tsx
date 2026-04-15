import { SharedItem, useShareIntent } from "@/hooks/use-share-intent";
import React, { createContext, useContext } from "react";

type ShareIntentContextType = {
  sharedItem: SharedItem | null;
  clearSharedItem: () => void;
};

const ShareIntentContext = createContext<ShareIntentContextType>({
  sharedItem: null,
  clearSharedItem: () => {},
});

export function ShareIntentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sharedItem, clearSharedItem } = useShareIntent();

  return (
    <ShareIntentContext.Provider value={{ sharedItem, clearSharedItem }}>
      {children}
    </ShareIntentContext.Provider>
  );
}

export function useSharedLink() {
  return useContext(ShareIntentContext);
}
