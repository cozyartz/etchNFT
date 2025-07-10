import React, { useState } from 'react';
import AIChat from './AIChat';
import { BotIcon } from './HelpCenterIcons';

export default function HelpCenterWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* Floating AI Chat Button */}
      {!isChatOpen && (
        <button 
          onClick={toggleChat}
          className="fixed bottom-4 right-4 z-40 w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-neon hover:scale-110 transition-all duration-300 group"
        >
          <div className="w-8 h-8 text-black group-hover:animate-pulse">
            <BotIcon />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-green rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-black">AI</span>
          </div>
        </button>
      )}

      {/* AI Chat Component */}
      <AIChat 
        isOpen={isChatOpen} 
        onToggle={toggleChat} 
        onClose={closeChat} 
      />
    </>
  );
}