"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import HomePage from "@/components/home-page";
import ClientOnly from "@/components/client-only";
import { Menu, X, ArrowLeft, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useConversationStore from "@/stores/useConversationStore";
import useChatbotStore from "@/stores/useChatbotStore";
import { Chatbot } from "@/types/chatbot";

export default function Main() {
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const { loadConversationForChatbot, resetConversation } = useConversationStore();
  const { selectedChatbot, showChat, setSelectedChatbot, setShowChat, resetToHome } = useChatbotStore();

  // Initialize state when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === "undefined") return;
      
      console.log('Initializing app state:', { selectedChatbot, showChat });
      
      // Check if we need to restore state after OAuth redirect
      const isConnected = new URLSearchParams(window.location.search).get("connected");
      if (isConnected === "1") {
        if (selectedChatbot) {
          console.log('Restoring after OAuth redirect');
          loadConversationForChatbot(selectedChatbot.id, selectedChatbot.welcomeMessage);
        }
        router.replace("/", { scroll: false });
      } else if (selectedChatbot && showChat) {
        // Restore conversation for the current chatbot when page reloads
        console.log('Restoring conversation for chatbot:', selectedChatbot.id);
        loadConversationForChatbot(selectedChatbot.id, selectedChatbot.welcomeMessage);
      }
      
      setIsInitialized(true);
    }, 100); // Small delay to ensure Zustand state is hydrated
    
    return () => clearTimeout(timer);
  }, [selectedChatbot, showChat, loadConversationForChatbot, router]);

  const handleChatbotSelect = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setShowChat(true);
    loadConversationForChatbot(chatbot.id, chatbot.welcomeMessage);
  };

  const handleBackToHome = () => {
    resetToHome();
  };

  const handleClearChat = () => {
    if (selectedChatbot) {
      resetConversation(selectedChatbot.welcomeMessage, selectedChatbot.id);
    }
  };

  // Show loading until initialized to prevent flicker
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <ClientOnly>
      {!showChat ? (
        <HomePage onChatbotSelect={handleChatbotSelect} />
      ) : (
        <div className="flex justify-center h-screen">
          <div className="w-full md:w-[70%] flex flex-col">
            {/* Back button and chatbot info */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleBackToHome}
                  className="mr-3 p-1 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
                {selectedChatbot && (
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{selectedChatbot.icon}</span>
                    <span className="font-medium text-gray-800">{selectedChatbot.title}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleClearChat}
                className="p-1 hover:bg-gray-100 rounded-full"
                title="チャット履歴をクリア"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <Assistant />
          </div>
          <div className=" hidden md:block w-[30%]">
            <ToolsPanel />
          </div>
          {/* Hamburger menu for small screens */}
          <div className="absolute top-4 right-4 md:hidden">
            <button onClick={() => setIsToolsPanelOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
          {/* Overlay panel for ToolsPanel on small screens */}
          {isToolsPanelOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30">
              <div className="w-full bg-white h-full p-4">
                <button className="mb-4" onClick={() => setIsToolsPanelOpen(false)}>
                  <X size={24} />
                </button>
                <ToolsPanel />
              </div>
            </div>
          )}
        </div>
      )}
    </ClientOnly>
  );
}
