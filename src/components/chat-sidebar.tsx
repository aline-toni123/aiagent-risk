"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, Brain, Users, Bot, User, MessageCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string[];
  sources?: string[];
  confidence?: number;
  crewData?: any;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  plannerMode?: boolean;
  crewMode?: boolean;
}

export function ChatSidebar({ isOpen, onClose, plannerMode = false, crewMode = false }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const placeholder = crewMode 
    ? 'Ask the AI crew to collaborate on complex tasks...'
    : plannerMode 
    ? 'Describe your financial goal...' 
    : 'Ask about risk assessments...';

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('bearer_token');
      if (!token) throw new Error('Authentication required');

      const endpoint = crewMode ? '/api/crew' : '/api/chat';
      const requestBody = crewMode 
        ? { query: userMessage.content, process: 'sequential' }
        : { query: userMessage.content, mode: plannerMode ? 'planner' : 'general' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Session expired. Please log in again.');
          router.push('/login');
          return;
        }
        throw new Error('Failed to get response');
      }

      const data = await res.json();

      if (crewMode) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.finalPlan || 'Plan generated successfully',
          crewData: {
            agents: data.crew?.agents || [],
            tasks: data.tasks || [],
            knowledge: data.crew?.knowledge || [],
            totalTasks: data.crew?.totalTasks || 0,
            completedTasks: data.crew?.completedTasks || 0,
            process: data.crew?.process || 'sequential'
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response || data.message || 'Response received',
          thinking: data.thinking,
          sources: data.sources,
          confidence: data.confidence,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to send message');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-screen w-full md:w-[500px] bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {crewMode ? (
                <>
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Multi-Agent AI Crew</h2>
                </>
              ) : plannerMode ? (
                <>
                  <Brain className="h-5 w-5 text-primary animate-pulse" />
                  <h2 className="text-lg font-semibold">Agentic Finance Planner</h2>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">AI Assistant</h2>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mode Badge */}
          <div className="px-4 py-2 bg-muted/30 border-b">
            {crewMode ? (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                Multi-Agent Crew Mode
              </Badge>
            ) : plannerMode ? (
              <Badge variant="outline" className="gap-1">
                <Brain className="h-3 w-3" />
                Agentic Planner Mode
              </Badge>
            ) : (
              <Badge variant="outline">General Risk Assistant</Badge>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div ref={scrollRef} className="space-y-6">
              {messages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm mb-4">
                    {crewMode 
                      ? 'Ask the AI crew to collaborate on complex financial tasks'
                      : plannerMode
                      ? 'Describe your financial goals and let AI create a plan'
                      : 'Ask me anything about risk assessment'
                    }
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={`msg-${idx}`} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 max-w-[85%] space-y-2">
                      <div className={`rounded-lg p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      </div>
                      
                      {msg.role === 'assistant' && msg.crewData && (
                        <Card className="p-3 bg-muted/50">
                          <div className="text-xs font-semibold mb-2">🤖 Crew Execution</div>
                          <div className="space-y-2">
                            <div className="text-xs">
                              Process: {msg.crewData.process} • Tasks: {msg.crewData.completedTasks}/{msg.crewData.totalTasks}
                            </div>
                            {msg.crewData.agents && msg.crewData.agents.length > 0 && (
                              <div>
                                <div className="text-xs font-medium mb-1">Agents:</div>
                                {msg.crewData.agents.map((agent: any, i: number) => (
                                  <div key={`agent-${i}`} className="text-xs bg-background/50 rounded px-2 py-1 mb-1">
                                    {agent.name} - {agent.role}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {msg.role === 'assistant' && msg.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {msg.confidence}% Confidence
                        </Badge>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="rounded-full bg-primary p-2 h-8 w-8 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <Card className="p-4 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder={placeholder}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || isLoading} 
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
    </>
  );
}