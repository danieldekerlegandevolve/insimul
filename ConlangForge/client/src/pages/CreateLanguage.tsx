import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LanguageForm } from "@/components/LanguageForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { InsertLanguage, Language } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateLanguage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const params = new URLSearchParams(window.location.search);
  const parentId = params.get("parentId");

  const { data: parentLanguage, isLoading: isLoadingParent } = useQuery<Language>({
    queryKey: [`/api/languages/${parentId}`],
    enabled: !!parentId,
  });

  const createLanguageMutation = useMutation({
    mutationFn: async (data: InsertLanguage) => {
      const response = await apiRequest("POST", "/api/languages/generate", data);
      return await response.json();
    },
    onSuccess: (data: Language) => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Language Created!",
        description: `${data.name} has been generated successfully.`,
      });
      setLocation(`/language/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate language",
        variant: "destructive",
      });
    },
  });

  if (parentId && isLoadingParent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {parentLanguage ? `Create Child Language` : "Create New Language"}
            </CardTitle>
            <CardDescription>
              {parentLanguage
                ? `Create a new language descended from ${parentLanguage.name}. The child language will inherit and evolve features from its parent.`
                : "Define your constructed language's characteristics and let AI generate the complete linguistic system for you."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageForm
              onSubmit={(data) => createLanguageMutation.mutateAsync(data)}
              isPending={createLanguageMutation.isPending}
              parentId={parentId || undefined}
              parentName={parentLanguage?.name}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
