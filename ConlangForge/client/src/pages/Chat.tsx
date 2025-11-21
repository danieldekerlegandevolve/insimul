import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChatInterface } from "@/components/ChatInterface";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Language, ChatMessage, ChatResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [, params] = useRoute("/language/:id/chat");
  const languageId = params?.id;
  const { toast } = useToast();

  const { data: language, isLoading: isLoadingLanguage } = useQuery<Language>({
    queryKey: [`/api/languages/${languageId}`],
    enabled: !!languageId,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${languageId}`],
    enabled: !!languageId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest<ChatResponse>("POST", "/api/chat", {
        languageId,
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${languageId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async (message: string) => {
    await sendMessageMutation.mutateAsync(message);
  };

  if (isLoadingLanguage || isLoadingMessages) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!language) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Language Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested language doesn't exist.</p>
          <Link href="/">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <Link href={`/language/${languageId}`}>
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-language">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {language.name}
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold">Chat with AI in {language.name}</h1>
            <p className="text-muted-foreground mt-1">
              Practice and explore your constructed language with an AI assistant
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <ChatInterface
          language={language}
          messages={messages}
          onSendMessage={handleSendMessage}
          isPending={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}
