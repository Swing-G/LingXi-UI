const STORAGE_KEY = "zhiguang_reading_history";
const MAX_ITEMS = 30;

export type HistoryItem = {
  id: string;
  title: string;
  authorNickname: string;
  coverImage?: string;
  tags: string[];
  visitedAt: number; // timestamp
};

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export function addHistory(item: Omit<HistoryItem, "visitedAt">): void {
  const list = getHistory().filter((h) => h.id !== item.id);
  list.unshift({ ...item, visitedAt: Date.now() });
  if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
