"use client";
import { Chatbot } from "@/types/chatbot";
import { Star, ArrowRight } from "lucide-react";
import { useState } from "react";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onClick: (chatbot: Chatbot) => void;
  index: number;
}

export default function ChatbotCard({ chatbot, onClick, index }: ChatbotCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative cursor-pointer transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(chatbot)}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Card Container */}
      <div className="relative overflow-hidden rounded-2xl h-80 backdrop-blur-sm border border-white/20 shadow-2xl">
        {/* Background Gradient */}
        <div
          className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${chatbot.gradientFrom || '#667eea'} 0%, ${chatbot.gradientTo || '#764ba2'} 100%)`
          }}
        />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 animate-pulse" 
            style={{
              backgroundImage: "radial-gradient(circle at 30px 30px, rgba(255,255,255,0.4) 2px, transparent 2px)",
              backgroundSize: "60px 60px"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {chatbot.featured && (
                <div className="flex items-center bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
                  <Star className="w-3 h-3 text-yellow-300 fill-current" />
                  <span className="text-xs font-medium ml-1">人気</span>
                </div>
              )}
              <span className="text-xs font-medium bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
                {chatbot.category}
              </span>
            </div>
          </div>

          {/* Icon */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-6xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              {chatbot.icon}
            </div>
          </div>

          {/* Bottom Content */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold leading-tight group-hover:text-yellow-200 transition-colors">
              {chatbot.title}
            </h3>
            
            <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
              {chatbot.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {chatbot.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="text-xs bg-white/10 backdrop-blur-sm rounded-md px-2 py-1 border border-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Action Button */}
            <div className={`flex items-center justify-between transition-all duration-300 ${
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}>
              <span className="text-sm font-medium">今すぐ開始</span>
              <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>

      {/* Glow Effect */}
      <div 
        className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{
          background: `linear-gradient(135deg, ${chatbot.gradientFrom || '#667eea'} 0%, ${chatbot.gradientTo || '#764ba2'} 100%)`
        }}
      />
    </div>
  );
}