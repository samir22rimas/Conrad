"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Sparkles, Bug, Loader2, Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

// Valid ChatType enum values from backend schema
const VALID_CHAT_TYPES = ["TUTOR", "DEBUG", "REVIEW", "PROJECT"] as const;
type ChatType = typeof VALID_CHAT_TYPES[number];

function getModeType(mode: string): ChatType {
  const upper = mode.toUpperCase() as ChatType;
  return VALID_CHAT_TYPES.includes(upper) ? upper : "TUTOR";
}

// Inner component that uses useSearchParams (must be inside Suspense)
function TutorChat() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "tutor";
  const chatType = getModeType(mode);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "USER",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let currentChatId = chatId;
      if (!currentChatId) {
        const { data } = await api.post("/chat", {
          title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
          type: chatType,
        });
        currentChatId = data.id;
        setChatId(currentChatId);
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("conrad_token") : "";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const response = await fetch(`${apiBase}/api/chat/${currentChatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: userMessage.content }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      const aiMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, role: "ASSISTANT", content: "", createdAt: new Date().toISOString() },
      ]);

      // FIX: read loop with proper termination — isLoading cleared in finally
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                aiContent += data.chunk;
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiMessageId ? { ...m, content: aiContent } : m))
                );
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      // FIX: Always clear loading state whether streaming finished normally or errored
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-16 border-b border-border/50 glass flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">Conrad AI</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Socratic Mentor Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setChatId(null); setMessages([]); }}
            className="p-2 rounded-lg hover:bg-muted transition"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {chatType === "DEBUG" ? "Debug with Conrad" : "Learn with Conrad"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {chatType === "DEBUG"
                ? "Paste your buggy code and Conrad will guide you to the solution through systematic questioning."
                : "Ask any programming question. Conrad won't give you the answer — he'll help you discover it yourself."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Explain recursion with an analogy",
                "Why is my loop infinite?",
                "Review my React component",
                "Teach me Big O notation",
              ].map((suggestion) => (
                <button key={suggestion} onClick={() => setInput(suggestion)}
                  className="px-4 py-2 rounded-full bg-muted text-sm hover:bg-muted/80 transition border border-border/50">
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`max-w-3xl mx-auto flex gap-4 ${message.role === "USER" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                message.role === "USER" ? "bg-muted" : "bg-primary/10 border border-primary/20"
              }`}>
                {message.role === "USER" ? (
                  <User className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className={`flex-1 px-4 py-3 rounded-2xl ${
                message.role === "USER" ? "bg-muted text-foreground" : "bg-card border border-border/50"
              }`}>
                {message.role === "ASSISTANT" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === "USER" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Conrad is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/50 p-4 bg-background">
        <div className="max-w-3xl mx-auto relative">
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask Conrad anything about programming..."
            className="w-full px-4 py-3 pr-12 bg-muted rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none min-h-[52px] max-h-[200px] text-sm"
            rows={1} />
          <button onClick={handleSubmit} disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Conrad uses the Socratic method. He guides, he doesn't just answer.
        </p>
      </div>
    </div>
  );
}

// Suspense wrapper — required by Next.js 15 for useSearchParams
export default function TutorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading Conrad...</span>
        </div>
      </div>
    }>
      <TutorChat />
    </Suspense>
  );
}
