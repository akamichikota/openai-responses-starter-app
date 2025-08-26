// ローカルストレージを安全に使用するためのヘルパー関数

export const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage が使用できない場合は何もしない
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage が使用できない場合は何もしない
    }
  }
};

export const getChatHistory = (chatbotId: string) => {
  const data = storage.getItem(`chat-history-${chatbotId}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const saveChatHistory = (chatbotId: string, chatMessages: any[], conversationItems: any[]) => {
  const data = {
    chatMessages,
    conversationItems,
    timestamp: Date.now()
  };
  storage.setItem(`chat-history-${chatbotId}`, JSON.stringify(data));
};

export const clearChatHistory = (chatbotId: string) => {
  storage.removeItem(`chat-history-${chatbotId}`);
};