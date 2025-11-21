import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, BookOpen, X } from "lucide-react";
import type { ChatMessage, Language } from "@shared/schema";

interface ChatInterfaceProps {
  language: Language;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isPending: boolean;
}

export function ChatInterface({ language, messages, onSendMessage, isPending }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showReference, setShowReference] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  };

  const commonPhrases = language.vocabulary?.slice(0, 10) || [];

  return (
    <div className="grid lg:grid-cols-[1fr,320px] gap-6 h-[calc(100vh-12rem)]">
      <div className="flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Conversation in {language.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReference(!showReference)}
                className="lg:hidden"
                data-testid="button-toggle-reference"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {showReference ? "Hide" : "Show"} Reference
              </Button>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div className="space-y-2 max-w-md">
                    <p className="text-lg font-medium">Start a conversation</p>
                    <p className="text-sm">
                      The AI will respond in {language.name} and provide translations.
                      Try asking questions or making statements!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 space-y-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      {message.inConlang && message.role === "assistant" && (
                        <p className="text-sm font-mono border-t border-border/50 pt-2 opacity-90">
                          {message.inConlang}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <CardContent className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="resize-none min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isPending}
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isPending}
                className="h-[60px] w-[60px]"
                data-testid="button-send-message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {showReference && (
        <Card className="lg:sticky lg:top-6 h-fit max-h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Quick Reference</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReference(false)}
                className="lg:hidden h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Common Phrases</h4>
                <div className="space-y-2">
                  {commonPhrases.map((item, index) => (
                    <div key={index} className="text-sm space-y-1">
                      <p className="font-mono font-semibold">{item.word}</p>
                      <p className="text-muted-foreground">{item.translation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Grammar Notes</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Word Order:</span> {language.grammar?.wordOrder}</p>
                  {language.grammar?.articles && (
                    <p><span className="font-medium text-foreground">Articles:</span> {language.grammar.articles}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Influences</h4>
                <div className="flex flex-wrap gap-1">
                  {language.influences?.map((inf) => (
                    <Badge key={inf} variant="secondary" className="text-xs">
                      {inf}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
