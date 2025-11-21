import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MessageSquare, GitBranch, Eye, ChevronDown } from "lucide-react";
import type { Language } from "@shared/schema";
import { Link } from "wouter";
import type { ExportFormat } from "@/lib/exportLanguage";

interface LanguageCardProps {
  language: Language;
  onCreateChild?: (parentId: string) => void;
  onExport?: (languageId: string, format: ExportFormat) => void;
}

export function LanguageCard({ language, onCreateChild, onExport }: LanguageCardProps) {
  const vocabularyCount = language.vocabulary?.length || 0;
  const grammarRulesCount = language.grammar?.rules?.length || 0;
  
  return (
    <Card className="h-full flex flex-col hover-elevate">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h3 className="text-lg font-semibold leading-tight truncate" data-testid={`text-language-name-${language.id}`}>
            {language.name}
          </h3>
          {language.parentId && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span className="truncate">Child language</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {language.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {language.influences?.slice(0, 3).map((influence) => (
            <Badge key={influence} variant="secondary" className="text-xs">
              {influence}
            </Badge>
          ))}
          {language.influences?.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{language.influences.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Vocabulary</p>
            <p className="text-lg font-semibold" data-testid={`text-vocab-count-${language.id}`}>
              {vocabularyCount}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Grammar Rules</p>
            <p className="text-lg font-semibold">
              {grammarRulesCount}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 pt-4">
        <Link href={`/language/${language.id}`}>
          <Button size="sm" variant="default" data-testid={`button-view-${language.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </Link>
        
        <Link href={`/language/${language.id}/chat`}>
          <Button size="sm" variant="outline" data-testid={`button-chat-${language.id}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </Link>
        
        {onCreateChild && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreateChild(language.id)}
            data-testid={`button-create-child-${language.id}`}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Child
          </Button>
        )}
        
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                data-testid={`button-export-${language.id}`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onExport(language.id, "pdf")}
                data-testid={`button-export-pdf-${language.id}`}
              >
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExport(language.id, "docx")}
                data-testid={`button-export-docx-${language.id}`}
              >
                Export as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExport(language.id, "both")}
                data-testid={`button-export-both-${language.id}`}
              >
                Export Both Formats
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  );
}
