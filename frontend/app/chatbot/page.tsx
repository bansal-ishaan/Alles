"use client";
import { serverUrl } from "@/lib/constants";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Moon } from "lucide-react";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 👇 First AI message on load
  useEffect(() => {
    setMessages([
      {
        role: "bot",
        text: "Well, look who finally showed up 👀. I’m Luna, your sarcastic sidekick. Ready to chat?",
      },
    ]);
  }, []);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
  const res = await fetch(`${serverUrl}/api/v1/gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage.text }),
  });

  const data = await res.json();
  const botMessage: Message = { role: "bot", text: data.reply };

  setMessages((prev) => [...prev, botMessage]);
} catch {
  // removed `err` to satisfy ESLint
  setMessages((prev) => [
    ...prev,
    {
      role: "bot",
      text: "Oops, even I couldn't come up with a reply. 🙃",
    },
  ]);
} finally {
  setLoading(false);
}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gray-700/5 rounded-full blur-3xl animate-pulse -top-48 -left-48"></div>
        <div className="absolute w-96 h-96 bg-gray-600/5 rounded-full blur-3xl animate-pulse -bottom-48 -right-48"></div>
        <div className="absolute w-64 h-64 bg-gray-500/5 rounded-full blur-2xl animate-bounce top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <Bot className="w-8 h-8 text-gray-300" />
              <Moon className="w-4 h-4 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-200 via-white to-gray-300 bg-clip-text text-transparent">
                🌙 Luna AI
              </h1>
              <p className="text-gray-400 text-sm">Your intelligent AI assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 relative z-10 max-w-4xl mx-auto w-full px-6 py-6">
        <div className="h-full flex flex-col">
          {/* Chat Window */}
          <div className="flex-1 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 overflow-y-auto space-y-4 mb-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end space-x-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center mb-1">
                    <Bot className="w-4 h-4 text-gray-200" />
                  </div>
                )}
                
                <div
                  className={`p-4 rounded-2xl max-w-xs lg:max-w-md transition-all duration-200 hover:scale-[1.02] ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-br-sm"
                      : "bg-gray-700/50 backdrop-blur-sm border border-gray-600/30 text-gray-100 rounded-bl-sm italic"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center mb-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-end space-x-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center mb-1">
                  <Bot className="w-4 h-4 text-gray-200" />
                </div>
                <div className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/30 text-gray-100 rounded-2xl rounded-bl-sm p-4 max-w-xs italic">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-300">Typing… probably something groundbreaking. 🙄</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-700/50 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Say something..."
                className="flex-1 bg-gray-700/50 border border-gray-600/30 rounded-xl p-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 disabled:from-gray-700 disabled:to-gray-800 text-white px-6 py-3 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-gray-900/60 backdrop-blur-sm border-t border-gray-700/30 py-3">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-xs">
            Powered by AI intelligence • Luna is here to help 🌙
          </p>
        </div>
      </div>
    </div>
  );
}
