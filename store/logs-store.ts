import AsyncStorage from "@react-native-async-storage/async-storage";

export type LogEntry = {
  id: string;
  action: string;
  detail: string;
  timestamp: number;
};

const STORAGE_KEY = "clip_link_logs";
const MAX_LOGS = 200;

async function getRawLogs(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLogs(logs: LogEntry[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export async function addLog(action: string, detail: string): Promise<void> {
  const logs = await getRawLogs();
  const entry: LogEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    detail,
    timestamp: Date.now(),
  };
  logs.unshift(entry);
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
  await saveLogs(logs);
}

export async function getLogs(): Promise<LogEntry[]> {
  return getRawLogs();
}

export async function clearLogs(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
