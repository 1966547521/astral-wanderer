const PREFIX = 'astral_wanderer_';

export class SaveManager {
  save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      console.warn('Failed to save:', key);
    }
  }

  load<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  }

  clearAll(): void {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}
