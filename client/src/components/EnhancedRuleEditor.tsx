import { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Info, 
  Lightbulb, 
  CheckCircle2, 
  Zap,
  HelpCircle 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Validation warning from the API
 */
interface ValidationWarning {
  severity: 'info' | 'warning' | 'suggestion';
  message: string;
  predicateName?: string;
  suggestion?: string;
  quickFixes?: QuickFix[];
}

interface QuickFix {
  title: string;
  description?: string;
  replacement?: string;
  predicateName?: string;
}

interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  predicatesFound: number;
  unknownPredicates: number;
}

interface AutocompleteSuggestion {
  name: string;
  arity: number;
  description?: string;
  examples: string[];
  source: 'core' | 'discovered';
  confidence?: 'high' | 'medium' | 'low';
}

interface EnhancedRuleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function EnhancedRuleEditor({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  'data-testid': dataTestId
}: EnhancedRuleEditorProps) {
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [validationStats, setValidationStats] = useState<{ predicatesFound: number; unknownPredicates: number } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced validation
  useEffect(() => {
    if (!value || disabled) {
      setWarnings([]);
      setValidationStats(null);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      validateRule(value);
    }, 1000); // 1 second debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, disabled]);

  /**
   * Validate rule content
   */
  const validateRule = async (content: string) => {
    try {
      const res = await apiRequest('POST', '/api/rules/validate', { content });
      const response: ValidationResult = await res.json();

      setWarnings(response.warnings);
      setValidationStats({
        predicatesFound: response.predicatesFound,
        unknownPredicates: response.unknownPredicates
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  /**
   * Apply a quick fix
   */
  const applyQuickFix = (fix: QuickFix) => {
    if (!fix.replacement || !fix.predicateName) return;

    // Simple find-and-replace for the predicate name
    const regex = new RegExp(`\\b${fix.predicateName}\\b`, 'g');
    const newValue = value.replace(regex, fix.replacement);
    onChange(newValue);
  };

  /**
   * Get autocomplete suggestions
   */
  const { data: autocompleteSuggestions } = useQuery({
    queryKey: ['autocomplete', autocompleteQuery],
    queryFn: async () => {
      if (!autocompleteQuery || autocompleteQuery.length < 2) {
        return { suggestions: [] };
      }

      const res = await fetch(
        `/api/predicates/autocomplete/${encodeURIComponent(autocompleteQuery)}?limit=5`
      );
      
      if (!res.ok) {
        throw new Error('Failed to fetch autocomplete');
      }

      const response: { suggestions: AutocompleteSuggestion[] } = await res.json();
      return response;
    },
    enabled: showAutocomplete && autocompleteQuery.length >= 2
  });

  /**
   * Handle textarea change with autocomplete detection
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Detect if user is typing a predicate (simple heuristic)
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/([a-z_][a-zA-Z0-9_]*)$/);

    if (match && match[1].length >= 2) {
      setAutocompleteQuery(match[1]);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  /**
   * Insert autocomplete suggestion
   */
  const insertSuggestion = (suggestion: AutocompleteSuggestion) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Find the partial word to replace
    const match = textBeforeCursor.match(/([a-z_][a-zA-Z0-9_]*)$/);
    if (!match) return;

    const partialWord = match[1];
    const insertPosition = cursorPosition - partialWord.length;

    // Generate suggestion with example
    const example = suggestion.examples[0] || `${suggestion.name}(...)`;
    
    const newValue = 
      value.substring(0, insertPosition) + 
      example + 
      textAfterCursor;

    onChange(newValue);
    setShowAutocomplete(false);

    // Move cursor to end of insertion
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = insertPosition + example.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  /**
   * Get severity icon
   */
  const getSeverityIcon = (severity: ValidationWarning['severity']) => {
    switch (severity) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation Stats */}
      {validationStats && !disabled && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {validationStats.predicatesFound} predicates found
            </span>
          </div>
          {validationStats.unknownPredicates > 0 && (
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-slate-600 dark:text-slate-400">
                {validationStats.unknownPredicates} unknown
              </span>
            </div>
          )}
          {warnings.length === 0 && validationStats.unknownPredicates === 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              All good!
            </Badge>
          )}
        </div>
      )}

      {/* Textarea with autocomplete */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          data-testid={dataTestId}
        />

        {/* Autocomplete dropdown */}
        {showAutocomplete && autocompleteSuggestions?.suggestions && autocompleteSuggestions.suggestions.length > 0 && (
          <Card className="absolute z-10 w-96 mt-1 shadow-lg">
            <CardContent className="p-2">
              <div className="text-xs text-slate-500 mb-2 px-2">
                Autocomplete suggestions:
              </div>
              <div className="space-y-1">
                {autocompleteSuggestions.suggestions.map((suggestion: AutocompleteSuggestion, i: number) => (
                  <button
                    key={i}
                    onClick={() => insertSuggestion(suggestion)}
                    className="w-full text-left px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {suggestion.name}/{suggestion.arity}
                          </span>
                          <Badge 
                            variant={suggestion.source === 'core' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {suggestion.source}
                          </Badge>
                          {suggestion.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {suggestion.confidence}
                            </Badge>
                          )}
                        </div>
                        {suggestion.description && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {suggestion.description}
                          </div>
                        )}
                        {suggestion.examples[0] && (
                          <div className="text-xs font-mono text-slate-500 mt-1 truncate">
                            {suggestion.examples[0]}
                          </div>
                        )}
                      </div>
                      <Zap className="w-3 h-3 text-slate-400 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && !disabled && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <Alert 
              key={index}
              variant={warning.severity === 'warning' ? 'destructive' : 'default'}
              className={
                warning.severity === 'info' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950' :
                warning.severity === 'suggestion' ? 'border-purple-200 bg-purple-50 dark:bg-purple-950' :
                ''
              }
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(warning.severity)}
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-sm font-semibold mb-1">
                    {warning.severity === 'info' && 'Info'}
                    {warning.severity === 'warning' && 'Warning'}
                    {warning.severity === 'suggestion' && 'Suggestion'}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {warning.message}
                    {warning.suggestion && (
                      <div className="mt-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                        {warning.suggestion}
                      </div>
                    )}
                  </AlertDescription>
                  {warning.quickFixes && warning.quickFixes.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {warning.quickFixes.map((fix, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          onClick={() => applyQuickFix(fix)}
                          className="text-xs"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {fix.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
