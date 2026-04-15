import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import ReceiveSharingIntent from "react-native-receive-sharing-intent";

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
    // Get shared intent when app opens from share sheet
    ReceiveSharingIntent.getReceivedFiles(
      (files: any[]) => processFiles(files),
      (error: any) => console.log("Share intent error:", error),
    );

    // Listen for app state changes to catch shares while app is backgrounded
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        ReceiveSharingIntent.getReceivedFiles(
          (files: any[]) => processFiles(files),
          (error: any) => console.log("Share intent error:", error),
        );
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      ReceiveSharingIntent.clearReceivedFiles();
    };
  }, [processFiles]);

  const clearSharedItem = useCallback(() => {
    setSharedItem(null);
    ReceiveSharingIntent.clearReceivedFiles();
  }, []);

  return { sharedItem, clearSharedItem };
}
