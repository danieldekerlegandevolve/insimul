import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Volume2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Character {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  gender: string;
  occupation: string | null;
  personality: Record<string, any>;
  [key: string]: any;
}

interface Truth {
  id: string;
  title: string;
  content: string;
  entryType: string;
  timestep: number;
  [key: string]: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CharacterChatDialogProps {
  character: Character | null;
  truths: Truth[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterChatDialog({ character, truths, open, onOpenChange }: CharacterChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && character) {
      // Extract language fluency to determine greeting language
      const presentTruths = truths.filter(t => t.timestep === 0);

      const frenchTruth = presentTruths.find(t =>
        (t.entryType === 'language' && t.title?.includes('French')) ||
        (t.content?.includes('French') && t.content?.includes('fluency'))
      );
      const englishTruth = presentTruths.find(t =>
        (t.entryType === 'language' && t.title?.includes('English')) ||
        (t.content?.includes('English') && t.content?.includes('fluency'))
      );

      // Default to English if no language data is found
      let frenchFluency = 0;
      let englishFluency = 100;
      
      if (frenchTruth?.sourceData?.value) {
        frenchFluency = frenchTruth.sourceData.value;
      } else if (frenchTruth?.content) {
        const match = frenchTruth.content.match(/(\d+)\/100 fluency in French/);
        if (match && match[1]) {
          frenchFluency = parseInt(match[1]);
        }
      }
      
      if (englishTruth?.sourceData?.value) {
        englishFluency = englishTruth.sourceData.value;
      } else if (englishTruth?.content) {
        const match = englishTruth.content.match(/(\d+)\/100 fluency in English/);
        if (match && match[1]) {
          englishFluency = parseInt(match[1]);
        }
      }
      
      // Determine greeting based on dominant language
      let greeting: string;
      if (frenchFluency > englishFluency) {
        // French is dominant - greet in French
        greeting = `Bonjour! Je m'appelle ${character.firstName} ${character.lastName}. Comment puis-je vous aider aujourd'hui?`;
      } else if (englishFluency >= 70) {
        // English is dominant and fluent
        greeting = `Hello! I'm ${character.firstName} ${character.lastName}. How can I help you today?`;
      } else if (englishFluency >= 50) {
        // English is dominant but intermediate - simpler greeting
        greeting = `Hello! My name is ${character.firstName} ${character.lastName}. How can I help you?`;
      } else {
        // English is dominant but poor - very simple with possible French mixing
        greeting = `Hello... uh, I am ${character.firstName}. Sorry, my English is not very good. Parlez-vous français?`;
      }
      
      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }]);
    } else {
      setMessages([]);
      setInputText('');
    }
  }, [open, character, truths]);

  const buildSystemPrompt = () => {
    if (!character) return '';

    const presentTruths = truths.filter(t => t.timestep === 0);

    // Extract language fluency from truths
    // Check both sourceData.value and parse from content string
    const frenchTruth = presentTruths.find(t =>
      (t.entryType === 'language' && t.title?.includes('French')) ||
      (t.content?.includes('French') && t.content?.includes('fluency'))
    );
    const englishTruth = presentTruths.find(t =>
      (t.entryType === 'language' && t.title?.includes('English')) ||
      (t.content?.includes('English') && t.content?.includes('fluency'))
    );

    // Default to English if no language data is found
    let frenchFluency = 0;
    let englishFluency = 100;

    if (frenchTruth?.sourceData?.value) {
      frenchFluency = frenchTruth.sourceData.value;
    } else if (frenchTruth?.content) {
      const match = frenchTruth.content.match(/(\d+)\/100 fluency in French/);
      if (match && match[1]) {
        frenchFluency = parseInt(match[1]);
      }
    }

    if (englishTruth?.sourceData?.value) {
      englishFluency = englishTruth.sourceData.value;
    } else if (englishTruth?.content) {
      const match = englishTruth.content.match(/(\d+)\/100 fluency in English/);
      if (match && match[1]) {
        englishFluency = parseInt(match[1]);
      }
    }

    const dominantLanguage = frenchFluency > englishFluency ? 'French' : 'English';
    const dominantFluency = Math.max(frenchFluency, englishFluency);
    const secondaryLanguage = dominantLanguage === 'French' ? 'English' : 'French';
    const secondaryFluency = Math.min(frenchFluency, englishFluency);

    let prompt = `You are ${character.firstName} ${character.lastName} (${character.age || '?'} years old, ${character.gender}, ${character.occupation || 'no occupation'}).

CURRENT LOCATION: ${character.currentLocation || 'Unknown'}

LANGUAGE SKILLS:
- French: ${frenchFluency}/100 (${frenchFluency >= 70 ? 'fluent' : frenchFluency >= 50 ? 'conversational' : 'basic'})
- English: ${englishFluency}/100 (${englishFluency >= 70 ? 'fluent' : englishFluency >= 50 ? 'conversational' : 'basic'})
- Native: ${dominantLanguage}

BEHAVIOR:
1. Speak ${dominantLanguage} by default. Switch to ${secondaryLanguage} if user speaks it.
2. ${secondaryFluency < 50 ? `Struggle with ${secondaryLanguage}: use simple words, make errors, apologize for poor skills.` : secondaryFluency < 70 ? `Show ${secondaryLanguage} limitations: occasional errors, simpler grammar.` : `Speak both languages fluently.`}
3. Keep responses under 3 sentences unless asked for more.
4. You can talk about your location, the world, your relationships, and your daily life.

`;

    if (presentTruths.length > 0) {
      prompt += `Current Truths about you:\n`;
      presentTruths.forEach(truth => {
        // Skip language truths as we've already processed them
        if (!truth.content?.includes('fluency') && truth.entryType !== 'language') {
          prompt += `- ${truth.content}\n`;
        }
      });
      prompt += '\n';
    }

    // Add world context - all truths (not just character-specific)
    const worldTruths = truths.filter(t => t.timestep === 0 && !t.characterId);
    if (worldTruths.length > 0) {
      prompt += `Known facts about the world:\n`;
      worldTruths.slice(0, 10).forEach(truth => {
        prompt += `- ${truth.content}\n`;
      });
      prompt += '\n';
    }

    if (character.personality && Object.keys(character.personality).length > 0) {
      prompt += `Personality Traits:\n`;
      Object.entries(character.personality).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
      prompt += '\n';
    }

    // Add relationships context
    if (character.friendIds && character.friendIds.length > 0) {
      prompt += `Friends: You have ${character.friendIds.length} friends in this world.\n`;
    }
    if (character.coworkerIds && character.coworkerIds.length > 0) {
      prompt += `Coworkers: You work with ${character.coworkerIds.length} colleagues.\n`;
    }
    if (character.spouseId) {
      prompt += `Family: You are married.\n`;
    }

    prompt += `\nQUEST SYSTEM: You can assign language quests using this format:
**QUEST_ASSIGN**
Title: [short title]
Description: [1 sentence]
Type: conversation|translation|vocabulary|grammar|cultural
Difficulty: beginner|intermediate|advanced
Language: French|English
**END_QUEST**

Only assign quests when natural in conversation. Base difficulty on player's skills.

Stay in character. Show your language abilities authentically. You can reference your location, the world, and your life experiences.`;

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
        maxTokens: 2048  // Increased from 500 to allow for full responses
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to get response from Gemini (${response.status})`);
    }

    const data = await response.json();
    return data.response;
  };

  const textToSpeech = async (text: string): Promise<Blob> => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: character?.gender === 'female' ? 'Kore' : 'Charon',
          gender: character?.gender || 'neutral'
        })
      });

      if (!response.ok) {
        console.warn('Server TTS failed, falling back to browser TTS');
        // Fallback to browser's Web Speech API
        return await browserTextToSpeech(text);
      }

      return await response.blob();
    } catch (error) {
      console.warn('TTS error, using browser fallback:', error);
      return await browserTextToSpeech(text);
    }
  };

  const browserTextToSpeech = async (text: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser does not support speech synthesis'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR'; // French by default
      utterance.rate = 0.9;
      
      // Try to find a French voice
      const voices = speechSynthesis.getVoices();
      const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onend = () => {
        // Create a silent audio blob as placeholder
        const silence = new Blob([], { type: 'audio/wav' });
        resolve(silence);
      };

      utterance.onerror = (error) => {
        reject(error);
      };

      speechSynthesis.speak(utterance);
    });
  };

  const speechToText = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/stt', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to convert speech to text');
    }

    const data = await response.json();
    return data.transcript;
  };

  const playAudio = async (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(audioUrl);
    };

    await audio.play();
  };

  const parseAndCreateQuest = async (response: string): Promise<string> => {
    // Check if response contains a quest assignment
    const questMatch = response.match(/\*\*QUEST_ASSIGN\*\*[\s\S]*?\*\*END_QUEST\*\*/);
    
    if (!questMatch || !character) {
      return response;
    }

    const questBlock = questMatch[1];
    const titleMatch = questBlock.match(/Title:\s*(.+)/);
    const descMatch = questBlock.match(/Description:\s*(.+)/);
    const typeMatch = questBlock.match(/Type:\s*(\w+)/);
    const difficultyMatch = questBlock.match(/Difficulty:\s*(\w+)/);
    const languageMatch = questBlock.match(/Language:\s*(\w+)/);

    if (titleMatch && descMatch && typeMatch && difficultyMatch && languageMatch) {
      try {
        // Create the quest
        await fetch(`/api/worlds/${character.worldId}/quests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedTo: 'Player', // Default player name
            assignedBy: `${character.firstName} ${character.lastName}`,
            assignedByCharacterId: character.id,
            title: titleMatch[1].trim(),
            description: descMatch[1].trim(),
            questType: typeMatch[1].trim().toLowerCase(),
            difficulty: difficultyMatch[1].trim().toLowerCase(),
            targetLanguage: languageMatch[1].trim(),
            conversationContext: response,
            status: 'active',
            experienceReward: difficultyMatch[1].trim().toLowerCase() === 'beginner' ? 10 : 
                             difficultyMatch[1].trim().toLowerCase() === 'intermediate' ? 25 : 50,
          })
        });

        toast({
          title: 'New Quest Assigned!',
          description: `${character.firstName} has assigned you: "${titleMatch[1].trim()}"`,
        });
      } catch (error) {
        console.error('Failed to create quest:', error);
      }
    }

    // Return response with quest markers removed for display
    const cleanedResponse = response.replace(/\*\*QUEST_ASSIGN\*\*[\s\S]*?\*\*END_QUEST\*\*/, '').trim();
    
    // If the response is empty after removing quest markers, return a default message
    if (!cleanedResponse) {
      return "I've assigned you a new quest! Check the Quests tab to see the details.";
    }
    
    return cleanedResponse;
  };

  const createAutomaticQuest = async (userMessage: string, characterResponse: string) => {
    if (!character) return;

    // Extract key words and phrases from the conversation
    const conversationText = `${userMessage} ${characterResponse}`;

    // Determine quest type based on conversation content
    let questType = 'vocabulary';
    let title = '';
    let description = '';
    let completionCriteria: Record<string, any> = {};
    let progress: Record<string, any> = {};

    // Check for questions about location
    if (conversationText.match(/où|where|bibliothèque|library|restaurant|café|magasin|store/i)) {
      questType = 'vocabulary';
      title = 'Learn Location Vocabulary';
      description = 'Practice asking for and giving directions to common places in French';
      completionCriteria = {
        type: 'vocabulary_usage',
        category: 'locations',
        targetWords: ['bibliothèque', 'restaurant', 'café', 'magasin', 'parc', 'école', 'hôtel', 'gare', 'banque', 'musée'],
        requiredCount: 10,
        description: 'Use 10 different location-related vocabulary words in conversation'
      };
      progress = {
        wordsUsed: [],
        currentCount: 0
      };
    }
    // Check for greetings
    else if (conversationText.match(/bonjour|hello|salut|comment|ça va|how are you/i)) {
      questType = 'conversation';
      title = 'Master French Greetings';
      description = 'Practice common French greetings and polite expressions';
      completionCriteria = {
        type: 'conversation_turns',
        requiredTurns: 5,
        keywords: ['bonjour', 'bonsoir', 'au revoir', 'merci', 's\'il vous plaît', 'comment allez-vous'],
        description: 'Complete 5 conversation exchanges using polite French greetings'
      };
      progress = {
        turnsCompleted: 0,
        keywordsUsed: []
      };
    }
    // Check for questions
    else if (conversationText.match(/\?|pourquoi|comment|quand|qui|what|why|how|when|who/i)) {
      questType = 'grammar';
      title = 'Form Questions in French';
      description = 'Learn to ask questions using French question words and inversion';
      completionCriteria = {
        type: 'grammar_pattern',
        patterns: ['pourquoi', 'comment', 'quand', 'où', 'qui', 'que', 'quel'],
        requiredCount: 5,
        description: 'Ask 5 questions using different French question words'
      };
      progress = {
        patternsUsed: [],
        currentCount: 0
      };
    }
    // Check for past/future tense
    else if (conversationText.match(/était|été|sera|will|was|yesterday|tomorrow|hier|demain/i)) {
      questType = 'grammar';
      title = 'Practice French Verb Tenses';
      description = 'Learn to use past and future tenses in French conversation';
      completionCriteria = {
        type: 'grammar_tenses',
        tenses: ['passé composé', 'imparfait', 'futur simple'],
        requiredCount: 3,
        description: 'Use past or future tense verbs in 3 different sentences'
      };
      progress = {
        tensesUsed: [],
        sentenceCount: 0
      };
    }
    // Check for food-related vocabulary
    else if (conversationText.match(/manger|nourriture|pain|fromage|viande|légume|fruit|eat|food|bread|cheese|meat|vegetable|fruit/i)) {
      questType = 'vocabulary';
      title = 'Food Vocabulary Practice';
      description = 'Learn and use French food-related vocabulary';
      completionCriteria = {
        type: 'vocabulary_usage',
        category: 'food',
        targetWords: ['pain', 'fromage', 'viande', 'poisson', 'légume', 'fruit', 'eau', 'café', 'thé', 'vin'],
        requiredCount: 10,
        description: 'Use 10 different food-related vocabulary words in conversation'
      };
      progress = {
        wordsUsed: [],
        currentCount: 0
      };
    }
    // Default: vocabulary from the conversation
    else {
      questType = 'vocabulary';
      title = 'Expand Your French Vocabulary';
      description = `Practice words and phrases from your conversation with ${character.firstName}`;
      completionCriteria = {
        type: 'conversation_engagement',
        requiredMessages: 8,
        description: 'Continue the conversation with 8 meaningful messages'
      };
      progress = {
        messagesCount: 0
      };
    }

    try {
      await fetch(`/api/worlds/${character.worldId}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: 'Player',
          assignedBy: `${character.firstName} ${character.lastName}`,
          assignedByCharacterId: character.id,
          title: title,
          description: description,
          questType: questType,
          difficulty: 'beginner',
          targetLanguage: 'French',
          conversationContext: `User: ${userMessage}\n${character.firstName}: ${characterResponse}`,
          status: 'active',
          experienceReward: 10,
          completionCriteria: completionCriteria,
          progress: progress
        })
      });

      console.log('Automatic quest created:', title);
    } catch (error) {
      console.error('Failed to create automatic quest:', error);
    }
  };

  const updateQuestProgress = async (userMessage: string) => {
    if (!character) return;

    try {
      // Fetch active quests for this character
      const response = await fetch(`/api/worlds/${character.worldId}/quests`);
      if (!response.ok) return;

      const allQuests = await response.json();
      const activeQuests = allQuests.filter((q: any) =>
        q.status === 'active' && q.assignedByCharacterId === character.id
      );

      for (const quest of activeQuests) {
        if (!quest.completionCriteria || !quest.progress) continue;

        const criteria = quest.completionCriteria;
        let progress = { ...quest.progress };
        let updated = false;
        let completed = false;

        const messageLower = userMessage.toLowerCase();

        switch (criteria.type) {
          case 'vocabulary_usage':
            // Check if user message contains any target words
            if (criteria.targetWords) {
              const newWords = criteria.targetWords.filter((word: string) =>
                messageLower.includes(word.toLowerCase()) &&
                !progress.wordsUsed?.includes(word)
              );

              if (newWords.length > 0) {
                progress.wordsUsed = [...(progress.wordsUsed || []), ...newWords];
                progress.currentCount = progress.wordsUsed.length;
                updated = true;

                if (progress.currentCount >= criteria.requiredCount) {
                  completed = true;
                }
              }
            }
            break;

          case 'conversation_turns':
            progress.turnsCompleted = (progress.turnsCompleted || 0) + 1;

            // Check for keywords
            if (criteria.keywords) {
              const newKeywords = criteria.keywords.filter((keyword: string) =>
                messageLower.includes(keyword.toLowerCase()) &&
                !progress.keywordsUsed?.includes(keyword)
              );
              if (newKeywords.length > 0) {
                progress.keywordsUsed = [...(progress.keywordsUsed || []), ...newKeywords];
              }
            }

            updated = true;
            if (progress.turnsCompleted >= criteria.requiredTurns) {
              completed = true;
            }
            break;

          case 'grammar_pattern':
            // Check for question patterns
            if (criteria.patterns) {
              const newPatterns = criteria.patterns.filter((pattern: string) =>
                messageLower.includes(pattern.toLowerCase()) &&
                !progress.patternsUsed?.includes(pattern)
              );

              if (newPatterns.length > 0) {
                progress.patternsUsed = [...(progress.patternsUsed || []), ...newPatterns];
                progress.currentCount = progress.patternsUsed.length;
                updated = true;

                if (progress.currentCount >= criteria.requiredCount) {
                  completed = true;
                }
              }
            }
            break;

          case 'conversation_engagement':
            progress.messagesCount = (progress.messagesCount || 0) + 1;
            updated = true;

            if (progress.messagesCount >= criteria.requiredMessages) {
              completed = true;
            }
            break;
        }

        // Update quest if progress changed
        if (updated) {
          await fetch(`/api/quests/${quest.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              progress,
              status: completed ? 'completed' : 'active',
              completedAt: completed ? new Date() : null
            })
          });

          if (completed) {
            toast({
              title: 'Quest Completed! 🎉',
              description: `You've completed: ${quest.title}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to update quest progress:', error);
    }
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
      // Update quest progress based on user message
      await updateQuestProgress(userMessage);

      // Get AI response
      const aiResponse = await sendMessageToGemini(userMessage);

      // Parse and create quest if present
      const cleanedResponse = await parseAndCreateQuest(aiResponse);

      // Add AI message (with quest markers removed)
      const newAiMessage: Message = {
        role: 'assistant',
        content: cleanedResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAiMessage]);

      // Convert to speech and play (without quest markers)
      const audioBlob = await textToSpeech(cleanedResponse);
      await playAudio(audioBlob);

      // Automatically create a quest based on the conversation
      await createAutomaticQuest(userMessage, cleanedResponse);

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process message',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsProcessing(true);
        try {
          // Convert speech to text
          const transcript = await speechToText(audioBlob);
          setInputText(transcript);

          // Automatically send the message
          if (transcript.trim()) {
            const userMessage: Message = {
              role: 'user',
              content: transcript,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);

            // Get AI response
            const aiResponse = await sendMessageToGemini(transcript);
            const aiMessage: Message = {
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);

            // Convert to speech and play
            const responseAudioBlob = await textToSpeech(aiResponse);
            await playAudio(responseAudioBlob);
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to process speech',
            variant: 'destructive'
          });
        } finally {
          setIsProcessing(false);
          setInputText('');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!character) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Talk with {character.firstName} {character.lastName}
          </DialogTitle>
          <DialogDescription>
            Have a voice conversation with {character.firstName}. Click the microphone to speak or type your message.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 h-[400px]">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use the microphone..."
            className="flex-1 min-h-[60px] max-h-[120px]"
            disabled={isProcessing || isRecording}
          />
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing || isRecording}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isSpeaking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>{character.firstName} is speaking...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
