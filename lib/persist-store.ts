export const createPersistConfig = (name: string) => ({
  name,
  storage: {
    getItem: (name: string) => {
      if (typeof window === 'undefined') return null;
      try {
        const item = localStorage.getItem(name);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: any) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch {
        // localStorage が使用できない場合は何もしない
      }
    },
    removeItem: (name: string) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.removeItem(name);
      } catch {
        // localStorage が使用できない場合は何もしない
      }
    },
  },
});