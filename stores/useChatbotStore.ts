import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chatbot } from "@/types/chatbot";
import { createPersistConfig } from "@/lib/persist-store";

interface ChatbotState {
  selectedChatbot: Chatbot | null;
  showChat: boolean;
  setSelectedChatbot: (chatbot: Chatbot | null) => void;
  setShowChat: (show: boolean) => void;
  resetToHome: () => void;
}

const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
      selectedChatbot: null,
      showChat: false,
      setSelectedChatbot: (chatbot) => set({ selectedChatbot: chatbot }),
      setShowChat: (show) => set({ showChat: show }),
      resetToHome: () => set({ selectedChatbot: null, showChat: false }),
    }),
    createPersistConfig("chatbot-store")
  )
);

export default useChatbotStore;