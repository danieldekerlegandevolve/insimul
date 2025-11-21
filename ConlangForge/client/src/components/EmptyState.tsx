import { Button } from "@/components/ui/button";
import { Languages, Plus } from "lucide-react";
import { Link } from "wouter";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Languages className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">No Languages Yet</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Start your linguistic journey by creating your first constructed language. 
        The AI will generate vocabulary, grammar, syntax, and phonology for you.
      </p>
      
      <Link href="/create">
        <Button size="lg" data-testid="button-create-first-language">
          <Plus className="mr-2 h-5 w-5" />
          Create Your First Language
        </Button>
      </Link>
    </div>
  );
}
