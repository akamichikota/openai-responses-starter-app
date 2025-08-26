"use client";
import { chatbots } from "@/data/chatbots";
import { Chatbot } from "@/types/chatbot";
import ChatbotCard from "./chatbot-card";
import { Search, Filter, Sparkles, Zap, Brain } from "lucide-react";
import { useState, useEffect } from "react";

interface HomePageProps {
  onChatbotSelect: (chatbot: Chatbot) => void;
}

export default function HomePage({ onChatbotSelect }: HomePageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoaded, setIsLoaded] = useState(false);

  const categories = ["all", ...new Set(chatbots.map(bot => bot.category))];
  const featuredBots = chatbots.filter(bot => bot.featured);
  
  const filteredBots = chatbots.filter(bot => {
    const matchesSearch = bot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || bot.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Studio</h1>
              <p className="text-xs text-gray-300">Powered by Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-300">
              <Sparkles className="w-4 h-4" />
              <span>Premium AI Experience</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                AI の力で
              </span>
              <br />
              可能性を無限に
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              最先端のAIがあなたの創造性、生産性、学習を革新的にサポート
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="AIアシスタントを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <button className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
                    <Zap className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-white text-black shadow-lg transform scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20'
                  }`}
                >
                  {category === "all" ? "すべて" : category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {featuredBots.length > 0 && (
        <section className="relative z-40 px-6 mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">人気のアシスタント</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBots.map((chatbot, index) => (
                <ChatbotCard
                  key={chatbot.id}
                  chatbot={chatbot}
                  onClick={onChatbotSelect}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Chatbots Section */}
      <section className="relative z-40 px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">
              {searchTerm || selectedCategory !== "all" ? "検索結果" : "すべてのアシスタント"}
            </h2>
            <div className="flex items-center space-x-2 text-gray-400">
              <Filter className="w-5 h-5" />
              <span className="text-sm">{filteredBots.length} 件見つかりました</span>
            </div>
          </div>

          {filteredBots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredBots.map((chatbot, index) => (
                <ChatbotCard
                  key={chatbot.id}
                  chatbot={chatbot}
                  onClick={onChatbotSelect}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">検索結果が見つかりません</h3>
              <p className="text-gray-400 mb-8">別のキーワードで検索するか、フィルターを変更してください</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                リセット
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 px-6 py-8 bg-black/20 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © 2024 AI Studio. Revolutionizing human-AI interaction.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}