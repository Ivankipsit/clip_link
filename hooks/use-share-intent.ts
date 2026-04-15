import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

// Note: react-native-receive-sharing-intent doesn't work with Expo managed workflow
// This is a placeholder for when we implement proper Expo sharing
// import ReceiveSharingIntent from "react-native-receive-sharing-intent";

export type SharedItem = {
  text: string;
  weblink?: string;
};

export function useShareIntent() {
  const [sharedItem, setSharedItem] = useState<SharedItem | null>(null);
  const appState = useRef(AppState.currentState);

  const processFiles = useCallback((files: any[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const text = file.text || file.weblink || "";
    const weblink = file.weblink || "";

    if (text || weblink) {
      setSharedItem({ text, weblink: weblink || undefined });
    }
  }, []);

  useEffect(() => {
    // Share intent functionality is disabled in Expo managed workflow
    // TODO: Implement using Expo's sharing APIs when available
    console.log("Share intent not available in Expo managed workflow");

    // Listen for app state changes (placeholder)
    const subscription = AppState.addEventListener("change", (nextState) => {
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [processFiles]);

  const clearSharedItem = useCallback(() => {
    setSharedItem(null);
    // ReceiveSharingIntent.clearReceivedFiles(); // Disabled for Expo
  }, []);

  return { sharedItem, clearSharedItem };
}
