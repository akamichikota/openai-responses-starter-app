import { create } from "zustand";
import { Item } from "@/lib/assistant";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { INITIAL_MESSAGE } from "@/config/constants";
import { getChatHistory, saveChatHistory, clearChatHistory } from "@/lib/storage";

interface ConversationState {
  // Items displayed in the chat
  chatMessages: Item[];
  // Items sent to the Responses API
  conversationItems: any[];
  // Whether we are waiting for the assistant response
  isAssistantLoading: boolean;
  // Current chatbot ID for conversation history
  currentChatbotId: string | null;

  setChatMessages: (items: Item[]) => void;
  setConversationItems: (messages: any[]) => void;
  addChatMessage: (item: Item) => void;
  addConversationItem: (message: ChatCompletionMessageParam) => void;
  setAssistantLoading: (loading: boolean) => void;
  rawSet: (state: any) => void;
  resetConversation: (welcomeMessage?: string, chatbotId?: string) => void;
  loadConversationForChatbot: (chatbotId: string, welcomeMessage: string) => void;
}

const useConversationStore = create<ConversationState>((set, get) => ({
  chatMessages: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: INITIAL_MESSAGE }],
    },
  ],
  conversationItems: [],
  isAssistantLoading: false,
  currentChatbotId: null,
  setChatMessages: (items) => {
    set({ chatMessages: items });
    // 履歴を保存
    const state = get();
    if (state.currentChatbotId) {
      saveChatHistory(state.currentChatbotId, items, state.conversationItems);
    }
  },
  setConversationItems: (messages) => {
    set({ conversationItems: messages });
    // 履歴を保存
    const state = get();
    if (state.currentChatbotId) {
      saveChatHistory(state.currentChatbotId, state.chatMessages, messages);
    }
  },
  addChatMessage: (item) => {
    set((state) => {
      const newMessages = [...state.chatMessages, item];
      // 履歴を保存
      if (state.currentChatbotId) {
        saveChatHistory(state.currentChatbotId, newMessages, state.conversationItems);
      }
      return { chatMessages: newMessages };
    });
  },
  addConversationItem: (message) => {
    set((state) => {
      const newItems = [...state.conversationItems, message];
      // 履歴を保存
      if (state.currentChatbotId) {
        saveChatHistory(state.currentChatbotId, state.chatMessages, newItems);
      }
      return { conversationItems: newItems };
    });
  },
  setAssistantLoading: (loading) => set({ isAssistantLoading: loading }),
  rawSet: set,
  resetConversation: (welcomeMessage?: string, chatbotId?: string) => {
    const newMessages = [
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: welcomeMessage || INITIAL_MESSAGE }],
      },
    ];
    set(() => ({
      chatMessages: newMessages,
      conversationItems: [],
      currentChatbotId: chatbotId || null,
    }));
    // 履歴をクリア
    if (chatbotId) {
      clearChatHistory(chatbotId);
      // 新しいウェルカムメッセージで履歴を保存
      saveChatHistory(chatbotId, newMessages, []);
    }
  },
  loadConversationForChatbot: (chatbotId: string, welcomeMessage: string) => {
    const history = getChatHistory(chatbotId);
    if (history && history.chatMessages && history.chatMessages.length > 0) {
      console.log('Loading chat history for', chatbotId, history);
      set({
        chatMessages: history.chatMessages,
        conversationItems: history.conversationItems || [],
        currentChatbotId: chatbotId,
      });
    } else {
      console.log('Creating new chat for', chatbotId);
      const newMessages = [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: welcomeMessage }],
        },
      ];
      set({
        chatMessages: newMessages,
        conversationItems: [],
        currentChatbotId: chatbotId,
      });
      // 新しいウェルカムメッセージで履歴を保存
      saveChatHistory(chatbotId, newMessages, []);
    }
  },
}));

export default useConversationStore;
