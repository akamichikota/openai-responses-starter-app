import { useEffect } from "react";
import useConversationStore from "@/stores/useConversationStore";
import useChatbotStore from "@/stores/useChatbotStore";

export function useChatHistory() {
  const { selectedChatbot } = useChatbotStore();
  const { loadConversationForChatbot } = useConversationStore();

  useEffect(() => {
    if (selectedChatbot) {
      loadConversationForChatbot(selectedChatbot.id, selectedChatbot.welcomeMessage);
    }
  }, [selectedChatbot, loadConversationForChatbot]);
}