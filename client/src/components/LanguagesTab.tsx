import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWorldPermissions } from '@/hooks/use-world-permissions';
import { useAuth } from '@/contexts/AuthContext';
import type {
  WorldLanguage,
  LanguageScopeType,
  ConlangConfig,
  LanguageChatMessage
} from '@shared/language';
import {
  Globe,
  Sparkles,
  MessageCircle,
  Trash2,
  Loader2
} from 'lucide-react';

interface LanguagesTabProps {
  worldId: string;
}

type LanguageWithDates = WorldLanguage & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

const BASE_LANGUAGE_OPTIONS = [
  { id: 'english', name: 'English' },
  { id: 'japanese', name: 'Japanese' },
  { id: 'spanish', name: 'Spanish' },
  { id: 'mandarin', name: 'Mandarin Chinese' },
];

export function LanguagesTab({ worldId }: LanguagesTabProps) {
  const { toast } = useToast();
  const { canEdit, loading: permissionsLoading } = useWorldPermissions(worldId);
  const { token } = useAuth();

  const [languages, setLanguages] = useState<LanguageWithDates[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(false);

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageWithDates | null>(null);

  const [scopeType, setScopeType] = useState<LanguageScopeType>('world');
  const [countryId, setCountryId] = useState<string | undefined>();
  const [stateId, setStateId] = useState<string | undefined>();
  const [settlementId, setSettlementId] = useState<string | undefined>();

  const [filterScopeType, setFilterScopeType] = useState<LanguageScopeType | 'all'>('all');
  const [filterCountryId, setFilterCountryId] = useState<string | undefined>();
  const [filterStateId, setFilterStateId] = useState<string | undefined>();
  const [filterSettlementId, setFilterSettlementId] = useState<string | undefined>();

  const [languageName, setLanguageName] = useState('');
  const [selectedBaseLanguages, setSelectedBaseLanguages] = useState<string[]>(['english']);
  const [phonologyEmphasis, setPhonologyEmphasis] = useState('0.5');
  const [grammarEmphasis, setGrammarEmphasis] = useState('0.3');
  const [vocabularyEmphasis, setVocabularyEmphasis] = useState('0.2');
  const [complexity, setComplexity] = useState<ConlangConfig['complexity']>('moderate');
  const [purpose, setPurpose] = useState<ConlangConfig['purpose']>('fictional');
  const [includeWritingSystem, setIncludeWritingSystem] = useState(true);
  const [includeCulturalContext, setIncludeCulturalContext] = useState(true);
  const [includeAdvancedPhonetics, setIncludeAdvancedPhonetics] = useState(false);
  const [generateSampleTexts, setGenerateSampleTexts] = useState(true);
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'offline' | 'llm-hybrid'>('offline');
  const [makePrimary, setMakePrimary] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [chatMessages, setChatMessages] = useState<LanguageChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);

  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    loadLanguages();
    loadLocations();
    loadGeminiStatus();
  }, [worldId]);

  useEffect(() => {
    if (selectedLanguage) {
      loadChatHistory(selectedLanguage.id);
    } else if (languages.length > 0) {
      setSelectedLanguage(languages[0]);
    }
  }, [languages, selectedLanguage?.id]);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const loadGeminiStatus = async () => {
    try {
      const res = await fetch('/api/gemini/status');
      if (!res.ok) {
        throw new Error('Failed to fetch Gemini status');
      }
      const data = await res.json();
      setGeminiConfigured(Boolean(data.configured));
    } catch {
      setGeminiConfigured(null);
    }
  };

  const loadLanguages = async () => {
    try {
      setLanguagesLoading(true);
      const res = await fetch(`/api/worlds/${worldId}/languages`);
      if (!res.ok) {
        throw new Error('Failed to fetch languages');
      }
      const data = await res.json();
      setLanguages(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load languages',
        variant: 'destructive',
      });
    } finally {
      setLanguagesLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const [countriesRes, settlementsRes] = await Promise.all([
        fetch(`/api/worlds/${worldId}/countries`),
        fetch(`/api/worlds/${worldId}/settlements`),
      ]);

      if (countriesRes.ok) {
        const countriesData = await countriesRes.json();
        setCountries(countriesData);
        const allStates: any[] = [];
        await Promise.all(
          countriesData.map(async (country: any) => {
            const res = await fetch(`/api/countries/${country.id}/states`);
            if (res.ok) {
              const stateData = await res.json();
              allStates.push(...stateData);
            }
          }),
        );
        setStates(allStates);
      }

      if (settlementsRes.ok) {
        const settlementsData = await settlementsRes.json();
        setSettlements(settlementsData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load location data',
        variant: 'destructive',
      });
    }
  };

  const loadChatHistory = async (languageId: string) => {
    try {
      setChatLoading(true);
      const res = await fetch(`/api/languages/${languageId}/chat`);
      if (!res.ok) {
        throw new Error('Failed to fetch chat history');
      }
      const data = await res.json();
      setChatMessages(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load chat history',
        variant: 'destructive',
      });
    } finally {
      setChatLoading(false);
    }
  };

  const resolveScopeId = (): string | undefined => {
    if (scopeType === 'world') {
      return worldId;
    }
    if (scopeType === 'country') {
      return countryId;
    }
    if (scopeType === 'state') {
      return stateId;
    }
    if (scopeType === 'settlement') {
      return settlementId;
    }
    return undefined;
  };

  const handleGenerate = async () => {
    if (!canEdit || permissionsLoading) {
      toast({
        title: 'Insufficient permissions',
        description: 'You do not have permission to edit this world.',
        variant: 'destructive',
      });
      return;
    }

    if (!languageName.trim()) {
      toast({
        title: 'Language name required',
        description: 'Please provide a name for the language.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBaseLanguages.length === 0) {
      toast({
        title: 'Base languages required',
        description: 'Select at least one base language to influence the conlang.',
        variant: 'destructive',
      });
      return;
    }

    const scopeIdValue = resolveScopeId();
    if (!scopeIdValue) {
      toast({
        title: 'Location required',
        description: 'Select a valid scope for the language.',
        variant: 'destructive',
      });
      return;
    }

    const phonology = parseFloat(phonologyEmphasis) || 0;
    const grammar = parseFloat(grammarEmphasis) || 0;
    const vocabulary = parseFloat(vocabularyEmphasis) || 0;

    const total = phonology + grammar + vocabulary;
    const config: ConlangConfig = {
      selectedLanguages: selectedBaseLanguages,
      name: languageName,
      emphasis:
        total > 0
          ? {
              phonology: phonology / total,
              grammar: grammar / total,
              vocabulary: vocabulary / total,
            }
          : {
              phonology: 0.5,
              grammar: 0.3,
              vocabulary: 0.2,
            },
      complexity,
      purpose,
      includeWritingSystem,
      includeCulturalContext,
      includeAdvancedPhonetics,
      generateSampleTexts,
    };

    try {
      setIsGenerating(true);
      const res = await fetch(`/api/worlds/${worldId}/languages/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          scopeType,
          scopeId: scopeIdValue,
          config,
          description: description || null,
          makePrimary,
          mode,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to generate language');
      }

      const created = await res.json();
      toast({
        title: 'Language generated',
        description: created.name,
      });
      setLanguageName('');
      setDescription('');
      setSelectedBaseLanguages(['english']);
      setPhonologyEmphasis('0.5');
      setGrammarEmphasis('0.3');
      setVocabularyEmphasis('0.2');
      setMode('offline');
      setMakePrimary(true);
      await loadLanguages();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate language',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteLanguage = async (language: LanguageWithDates) => {
    if (!canEdit || permissionsLoading) {
      toast({
        title: 'Insufficient permissions',
        description: 'You do not have permission to edit this world.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(`Delete language "${language.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/languages/${language.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete language');
      }
      toast({
        title: 'Language deleted',
        description: language.name,
      });
      if (selectedLanguage?.id === language.id) {
        setSelectedLanguage(null);
        setChatMessages([]);
      }
      await loadLanguages();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete language',
        variant: 'destructive',
      });
    }
  };

  const handleSendChat = async () => {
    if (!selectedLanguage || !chatInput.trim()) return;
    try {
      setChatSending(true);
      const res = await fetch(`/api/languages/${selectedLanguage.id}/chat`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          worldId,
          scopeType: selectedLanguage.scopeType,
          scopeId: selectedLanguage.scopeId,
          message: chatInput.trim(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to send chat message');
      }
      const data = await res.json();
      if (Array.isArray(data.history)) {
        setChatMessages(data.history);
      }
      setChatInput('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setChatSending(false);
    }
  };

  const scopeLabelForLanguage = (language: WorldLanguage): string => {
    if (language.scopeType === 'world') {
      return 'World';
    }
    if (language.scopeType === 'country') {
      const country = countries.find((c) => c.id === language.scopeId);
      return country ? `Country: ${country.name}` : 'Country';
    }
    if (language.scopeType === 'state') {
      const state = states.find((s) => s.id === language.scopeId);
      return state ? `State: ${state.name}` : 'State';
    }
    if (language.scopeType === 'settlement') {
      const settlement = settlements.find((s) => s.id === language.scopeId);
      return settlement ? `Settlement: ${settlement.name}` : 'Settlement';
    }
    return language.scopeType;
  };

  const filteredLanguages = useMemo(
    () => {
      let result = [...languages];

      if (filterScopeType !== 'all') {
        result = result.filter((lang) => lang.scopeType === filterScopeType);

        if (filterScopeType === 'country' && filterCountryId) {
          result = result.filter((lang) => lang.scopeId === filterCountryId);
        } else if (filterScopeType === 'state' && filterStateId) {
          result = result.filter((lang) => lang.scopeId === filterStateId);
        } else if (filterScopeType === 'settlement' && filterSettlementId) {
          result = result.filter((lang) => lang.scopeId === filterSettlementId);
        }
      }

      return result;
    },
    [languages, filterScopeType, filterCountryId, filterStateId, filterSettlementId],
  );

  const sortedLanguages = useMemo(
    () =>
      [...filteredLanguages].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.name.localeCompare(b.name);
      }),
    [filteredLanguages],
  );

  const sortedChatMessages = useMemo(
    () =>
      [...chatMessages].sort((a, b) => {
        const aTime = new Date(a.createdAt as any).getTime();
        const bTime = new Date(b.createdAt as any).getTime();
        return aTime - bTime;
      }),
    [chatMessages],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Languages
          </h2>
          <p className="text-muted-foreground">
            Create, manage, and chat about the languages of your world.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {languages.length} language{languages.length === 1 ? '' : 's'}
        </div>
      </div>

      {geminiConfigured === false && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Gemini AI is not configured on the server. LLM-hybrid language generation and language chat will fall back to offline behavior.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate Language</CardTitle>
          <CardDescription>
            Configure a new language and generate it procedurally or with LLM enrichment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Language name</label>
              <Input
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                placeholder="e.g., Elytharin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <Select value={mode} onValueChange={(v: 'offline' | 'llm-hybrid') => setMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline only</SelectItem>
                  <SelectItem value="llm-hybrid">Offline + LLM enrichment</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'llm-hybrid' && geminiConfigured === false && (
                <p className="text-xs text-destructive">
                  Gemini is not configured; enrichment will be skipped.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Scope</label>
              <Select
                value={scopeType}
                onValueChange={(v: LanguageScopeType) => {
                  setScopeType(v);
                  setCountryId(undefined);
                  setStateId(undefined);
                  setSettlementId(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="world">World</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="settlement">Settlement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scopeType === 'country' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Select value={countryId} onValueChange={(v) => setCountryId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scopeType === 'state' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Select value={stateId} onValueChange={(v) => setStateId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scopeType === 'settlement' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Settlement</label>
                <Select value={settlementId} onValueChange={(v) => setSettlementId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select settlement" />
                  </SelectTrigger>
                  <SelectContent>
                    {settlements.map((settlement) => (
                      <SelectItem key={settlement.id} value={settlement.id}>
                        {settlement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Base languages</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {BASE_LANGUAGE_OPTIONS.map((opt) => {
                const checked = selectedBaseLanguages.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedBaseLanguages((prev) =>
                        checked ? prev.filter((id) => id !== opt.id) : [...prev, opt.id],
                      );
                    }}
                    className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition-colors ${{
                      true: 'bg-primary text-primary-foreground border-primary',
                      false: 'bg-background hover:bg-muted',
                    }[String(checked) as 'true' | 'false']}`}
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Phonology weight</label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={phonologyEmphasis}
                onChange={(e) => setPhonologyEmphasis(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Grammar weight</label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={grammarEmphasis}
                onChange={(e) => setGrammarEmphasis(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Vocabulary weight</label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={vocabularyEmphasis}
                onChange={(e) => setVocabularyEmphasis(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Complexity</label>
              <Select value={complexity} onValueChange={(v: ConlangConfig['complexity']) => setComplexity(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose</label>
              <Select value={purpose} onValueChange={(v: ConlangConfig['purpose']) => setPurpose(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="auxiliary">Auxiliary</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                  <SelectItem value="fictional">Fictional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Checkbox
                checked={makePrimary}
                onCheckedChange={(v) => setMakePrimary(Boolean(v))}
                id="make-primary-language"
              />
              <label htmlFor="make-primary-language" className="text-sm">
                Make primary language for this scope
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={includeWritingSystem}
                onCheckedChange={(v) => setIncludeWritingSystem(Boolean(v))}
                id="include-writing-system"
              />
              <label htmlFor="include-writing-system" className="text-sm">
                Include writing system
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={includeCulturalContext}
                onCheckedChange={(v) => setIncludeCulturalContext(Boolean(v))}
                id="include-cultural-context"
              />
              <label htmlFor="include-cultural-context" className="text-sm">
                Include cultural context
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={includeAdvancedPhonetics}
                onCheckedChange={(v) => setIncludeAdvancedPhonetics(Boolean(v))}
                id="include-advanced-phonetics"
              />
              <label htmlFor="include-advanced-phonetics" className="text-sm">
                Advanced phonetics
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={generateSampleTexts}
                onCheckedChange={(v) => setGenerateSampleTexts(Boolean(v))}
                id="generate-sample-texts"
              />
              <label htmlFor="generate-sample-texts" className="text-sm">
                Generate sample texts
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">High-level description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the language's vibe, culture, or usage."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={isGenerating || permissionsLoading || !canEdit}>
              {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate language
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-[480px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Languages in this world
            </CardTitle>
            <CardDescription>Primary languages are shown first.</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Filter by scope:</span>
              <Select
                value={filterScopeType}
                onValueChange={(v) => {
                  const value = v as LanguageScopeType | 'all';
                  setFilterScopeType(value);
                  setFilterCountryId(undefined);
                  setFilterStateId(undefined);
                  setFilterSettlementId(undefined);
                }}
              >
                <SelectTrigger className="h-8 w-28">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="world">World</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="settlement">Settlement</SelectItem>
                </SelectContent>
              </Select>

              {filterScopeType === 'country' && (
                <Select
                  value={filterCountryId}
                  onValueChange={(v) => setFilterCountryId(v)}
                >
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filterScopeType === 'state' && (
                <Select
                  value={filterStateId}
                  onValueChange={(v) => setFilterStateId(v)}
                >
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filterScopeType === 'settlement' && (
                <Select
                  value={filterSettlementId}
                  onValueChange={(v) => setFilterSettlementId(v)}
                >
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue placeholder="Settlement" />
                  </SelectTrigger>
                  <SelectContent>
                    {settlements.map((settlement) => (
                      <SelectItem key={settlement.id} value={settlement.id}>
                        {settlement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {languagesLoading ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Loading languages...
              </div>
            ) : sortedLanguages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No languages yet. Generate one above to get started.
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {sortedLanguages.map((language) => {
                    const isSelected = selectedLanguage?.id === language.id;
                    return (
                      <button
                        key={language.id}
                        type="button"
                        onClick={() => setSelectedLanguage(language)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{language.name}</span>
                            {language.isPrimary && <Badge variant="default">Primary</Badge>}
                            <Badge variant="outline">{language.kind === 'real' ? 'Real' : 'Constructed'}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                            <span>{scopeLabelForLanguage(language)}</span>
                            {language.realCode && <span>Code: {language.realCode}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLanguage(language);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="h-[480px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Language details and chat
            </CardTitle>
            <CardDescription>
              Inspect a language and chat about it using English and the conlang.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col gap-3">
            {!selectedLanguage ? (
              <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
                Select a language to view details and chat.
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{selectedLanguage.name}</h3>
                    {selectedLanguage.isPrimary && <Badge variant="default">Primary</Badge>}
                    <Badge variant="outline">{selectedLanguage.kind === 'real' ? 'Real' : 'Constructed'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{scopeLabelForLanguage(selectedLanguage)}</span>
                    {selectedLanguage.config?.complexity && (
                      <span>Complexity: {selectedLanguage.config.complexity}</span>
                    )}
                    {selectedLanguage.config?.purpose && (
                      <span>Purpose: {selectedLanguage.config.purpose}</span>
                    )}
                  </div>
                  {selectedLanguage.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {selectedLanguage.description}
                    </p>
                  )}
                </div>

                <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
                  <TabsList className="w-full justify-start mb-2">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="samples">Samples</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chat" className="flex-1 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col">
                      <CardContent className="p-2 flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 mb-2">
                          <div className="space-y-2 px-1">
                            {chatLoading ? (
                              <div className="text-xs text-muted-foreground text-center py-4">
                                Loading chat history...
                              </div>
                            ) : sortedChatMessages.length === 0 ? (
                              <div className="text-xs text-muted-foreground text-center py-4">
                                No messages yet. Start the conversation below.
                              </div>
                            ) : (
                              sortedChatMessages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                      msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                    }`}
                                  >
                                    <div>{msg.content}</div>
                                    {msg.inLanguage && (
                                      <div className="mt-1 text-xs opacity-80">{msg.inLanguage}</div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                        <div className="flex items-end gap-2 mt-2">
                          <Textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            rows={2}
                            placeholder="Ask about this language in English. The assistant will reply in English and in the conlang."
                            className="resize-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChat();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={handleSendChat}
                            disabled={chatSending || !chatInput.trim()}
                            className="shrink-0"
                          >
                            {chatSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="samples" className="flex-1 min-h-0">
                    <Card className="h-full">
                      <CardContent className="p-3 h-full">
                        <ScrollArea className="h-full">
                          <div className="space-y-3">
                            {selectedLanguage.sampleTexts && selectedLanguage.sampleTexts.length > 0 ? (
                              selectedLanguage.sampleTexts.map((sample, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-md border p-2 text-xs space-y-1"
                                >
                                  <div className="font-semibold flex items-center gap-2">
                                    <Badge variant="outline">{sample.type}</Badge>
                                  </div>
                                  <div>{sample.english}</div>
                                  <div className="text-muted-foreground">{sample.language}</div>
                                  {sample.transliteration && (
                                    <div className="text-muted-foreground">
                                      {sample.transliteration}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground text-center py-4">
                                No sample texts stored for this language.
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
