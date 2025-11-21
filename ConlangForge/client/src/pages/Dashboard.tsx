import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LanguageCard } from "@/components/LanguageCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import type { Language } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { exportLanguage, type ExportFormat } from "@/lib/exportLanguage";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(search.toLowerCase()) ||
    lang.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateChild = (parentId: string) => {
    setLocation(`/create?parentId=${parentId}`);
  };

  const handleExport = async (languageId: string, format: ExportFormat) => {
    const language = languages.find((l) => l.id === languageId);
    if (!language) return;

    try {
      await exportLanguage(language, format);
      
      const formatText = format === "both" ? "PDF and DOCX guides" : `${format.toUpperCase()} guide`;
      toast({
        title: "Export Successful",
        description: `${language.name} ${formatText} ${format === "both" ? "have" : "has"} been downloaded.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the language guide.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Languages</h1>
              <p className="text-muted-foreground mt-1">
                Manage your constructed languages and explore their genealogy
              </p>
            </div>
            <Link href="/create">
              <Button size="lg" data-testid="button-create-new-language">
                <Plus className="mr-2 h-5 w-5" />
                Create Language
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="relative">
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        ) : languages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search languages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-languages"
              />
            </div>

            {filteredLanguages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No languages match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLanguages.map((language) => (
                  <LanguageCard
                    key={language.id}
                    language={language}
                    onCreateChild={handleCreateChild}
                    onExport={handleExport}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
