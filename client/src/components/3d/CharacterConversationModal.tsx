import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { X, Send, Loader2, User } from 'lucide-react';

interface Character {
  id: string;
  firstName: string;
  lastName: string;
  age?: number | string;
  gender?: string;
  occupation?: string;
  currentLocation?: string;
  [key: string]: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CharacterConversationModalProps {
  character: Character;
  worldData: any;
  open: boolean;
  onClose: () => void;
}

export function CharacterConversationModal({
  character,
  worldData,
  open,
  onClose
}: CharacterConversationModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && character) {
      // Determine greeting based on character data
      const truths = worldData.truths?.filter((t: any) =>
        t.timestep === 0 && (!t.characterId || t.characterId === character.id)
      ) || [];

      // Check for language preferences
      const languageTruths = truths.filter((t: any) =>
        t.entryType === 'language' || (t.content?.includes('fluency') && t.content?.includes('language'))
      );

      // Default to English
      let greeting = `Hello! I'm ${character.firstName} ${character.lastName}.`;

      if (character.occupation) {
        greeting += ` I work as a ${character.occupation}.`;
      }

      greeting += ' How can I help you today?';

      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }]);
    } else {
      setMessages([]);
      setInputText('');
    }
  }, [open, character, worldData]);

  const buildSystemPrompt = () => {
    if (!character) return '';

    const truths = worldData.truths?.filter((t: any) =>
      t.timestep === 0 && (!t.characterId || t.characterId === character.id)
    ) || [];

    let prompt = `You are ${character.firstName} ${character.lastName}`;

    if (character.age) prompt += ` (${character.age} years old)`;
    if (character.gender) prompt += `, ${character.gender}`;
    if (character.occupation) prompt += `, working as a ${character.occupation}`;

    prompt += '.\n\n';

    if (character.currentLocation) {
      prompt += `CURRENT LOCATION: ${character.currentLocation}\n\n`;
    }

    prompt += `BEHAVIOR:\n`;
    prompt += `1. Stay in character at all times\n`;
    prompt += `2. Keep responses conversational and under 3 sentences unless asked for more\n`;
    prompt += `3. You can talk about your location, the world, your work, and your daily life\n`;
    prompt += `4. Be helpful and friendly\n`;
    prompt += `5. Reference specific details about your world when relevant\n\n`;

    // Add character-specific truths
    if (truths.length > 0) {
      const characterTruths = truths.filter((t: any) => t.characterId === character.id);
      if (characterTruths.length > 0) {
        prompt += `Facts about you:\n`;
        characterTruths.forEach((truth: any) => {
          if (!truth.content?.includes('fluency')) {
            prompt += `- ${truth.content}\n`;
          }
        });
        prompt += '\n';
      }
    }

    // Add world context
    const worldTruths = truths.filter((t: any) => !t.characterId);
    if (worldTruths.length > 0) {
      prompt += `Known facts about the world:\n`;
      worldTruths.slice(0, 15).forEach((truth: any) => {
        prompt += `- ${truth.content}\n`;
      });
      prompt += '\n';
    }

    // Add settlement context
    const settlement = worldData.settlements?.find((s: any) => s.name === character.currentLocation);
    if (settlement) {
      prompt += `About ${settlement.name}:\n`;
      prompt += `- Type: ${settlement.settlementType}\n`;
      if (settlement.terrain) prompt += `- Terrain: ${settlement.terrain}\n`;
      if (settlement.population) prompt += `- Population: ${settlement.population}\n`;

      const businesses = worldData.businesses?.filter((b: any) => b.settlementId === settlement.id) || [];
      if (businesses.length > 0) {
        prompt += `- Notable businesses: ${businesses.slice(0, 5).map((b: any) => b.name).join(', ')}\n`;
      }
      prompt += '\n';
    }

    // Add personality if available
    if (character.personality && Object.keys(character.personality).length > 0) {
      prompt += `Your personality traits:\n`;
      Object.entries(character.personality).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  };

  const sendMessageToGemini = async (userMessage: string): Promise<string> => {
    const systemPrompt = buildSystemPrompt();

    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        messages: conversationHistory,
        temperature: 0.8,
        maxTokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to get response (${response.status})`);
    }

    const data = await response.json();
    return data.response;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Get AI response
      const aiResponse = await sendMessageToGemini(userMessage);

      // Add AI message
      const newAiMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto">
      <Card className="w-[90vw] h-[80vh] max-w-4xl bg-black/90 border-white/20 text-white flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/20">
          <CardTitle className="flex items-center gap-3">
            <User className="w-6 h-6" />
            <div>
              <div className="text-xl">{character.firstName} {character.lastName}</div>
              {character.occupation && (
                <div className="text-sm text-gray-400 font-normal">{character.occupation}</div>
              )}
            </div>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-lg px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 min-h-[60px] max-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
