import { useQuery } from "@tanstack/react-query";
import { LanguageTree } from "@/components/LanguageTree";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Language } from "@shared/schema";

export default function TreeView() {
  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-from-tree">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold">Language Genealogy</h1>
            <p className="text-muted-foreground mt-1">
              Explore the family tree of your constructed languages
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {languages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No languages created yet</p>
            <p className="text-sm mt-2">Create your first language to see it in the tree view</p>
          </div>
        ) : (
          <LanguageTree languages={languages} />
        )}
      </div>
    </div>
  );
}
