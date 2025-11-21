import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, X } from "lucide-react";
import type { Language } from "@shared/schema";

export default function CompareLanguages() {
  const [location, setLocation] = useLocation();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  // Read language IDs from query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const languagesParam = params.get('languages');
    if (languagesParam) {
      const languageIds = languagesParam.split(',').filter(id => id.trim());
      setSelectedLanguages(languageIds.slice(0, 3)); // Max 3 languages
    }
  }, []);

  const handleAddLanguage = (languageId: string) => {
    if (selectedLanguages.length < 3 && !selectedLanguages.includes(languageId)) {
      setSelectedLanguages([...selectedLanguages, languageId]);
    }
  };

  const handleRemoveLanguage = (languageId: string) => {
    setSelectedLanguages(selectedLanguages.filter(id => id !== languageId));
  };

  const comparedLanguages = languages.filter(lang => selectedLanguages.includes(lang.id));

  // Calculate similarity scores
  const calculatePhonologySimilarity = (lang1: Language, lang2: Language): number => {
    const consonants1 = lang1.phonology.consonants || [];
    const consonants2 = lang2.phonology.consonants || [];
    const vowels1 = lang1.phonology.vowels || [];
    const vowels2 = lang2.phonology.vowels || [];
    
    const sharedConsonants = consonants1.filter(c => consonants2.includes(c)).length;
    const sharedVowels = vowels1.filter(v => vowels2.includes(v)).length;
    const allConsonants = Array.from(new Set([...consonants1, ...consonants2]));
    const allVowels = Array.from(new Set([...vowels1, ...vowels2]));
    const totalUnique = allConsonants.length + allVowels.length;
    
    if (totalUnique === 0) return 0;
    return Math.round(((sharedConsonants + sharedVowels) / totalUnique) * 100);
  };

  const calculateGrammarSimilarity = (lang1: Language, lang2: Language): number => {
    let score = 0;
    if (lang1.grammar.wordOrder === lang2.grammar.wordOrder) score += 30;
    
    const sharedCases = lang1.grammar.nounCases.filter(c => lang2.grammar.nounCases.includes(c)).length;
    const totalCases = Array.from(new Set([...lang1.grammar.nounCases, ...lang2.grammar.nounCases])).length;
    if (totalCases > 0) {
      score += (sharedCases / totalCases) * 30;
    }
    
    const sharedTenses = lang1.grammar.verbTenses.filter(t => lang2.grammar.verbTenses.includes(t)).length;
    const totalTenses = Array.from(new Set([...lang1.grammar.verbTenses, ...lang2.grammar.verbTenses])).length;
    if (totalTenses > 0) {
      score += (sharedTenses / totalTenses) * 40;
    }
    
    return Math.round(score);
  };

  const calculateVocabularySimilarity = (lang1: Language, lang2: Language): number => {
    const words1 = lang1.vocabulary.map(v => v.word.toLowerCase());
    const words2 = lang2.vocabulary.map(v => v.word.toLowerCase());
    
    if (words1.length === 0 && words2.length === 0) return 0;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Check for similar words (first 3 characters match)
    let similarWords = 0;
    words1.forEach(w1 => {
      const prefix1 = w1.substring(0, 3);
      if (words2.some(w2 => w2.substring(0, 3) === prefix1)) {
        similarWords++;
      }
    });
    
    return Math.round((similarWords / Math.max(words1.length, words2.length)) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Compare Languages</h1>
              <p className="text-muted-foreground">Analyze similarities and differences between languages</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Languages to Compare</CardTitle>
            <CardDescription>
              Choose 2-3 languages for side-by-side comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {selectedLanguages.map(langId => {
                const lang = languages.find(l => l.id === langId);
                return lang ? (
                  <Badge key={langId} variant="secondary" className="px-4 py-2 text-sm">
                    {lang.name}
                    <button
                      onClick={() => handleRemoveLanguage(langId)}
                      className="ml-2 hover:text-destructive"
                      data-testid={`button-remove-${lang.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              
              {selectedLanguages.length < 3 && (
                <Select onValueChange={handleAddLanguage}>
                  <SelectTrigger className="w-[200px]" data-testid="select-add-language">
                    <SelectValue placeholder="Add language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter(lang => !selectedLanguages.includes(lang.id))
                      .map(lang => (
                        <SelectItem key={lang.id} value={lang.id}>
                          {lang.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {comparedLanguages.length >= 2 && (
          <div className="space-y-8">
            {/* Phonology Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Phonology Comparison</CardTitle>
                <CardDescription>Sound systems and pronunciation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${comparedLanguages.length}, 1fr)` }}>
                  {comparedLanguages.map((lang, idx) => (
                    <div key={lang.id} className="space-y-4">
                      <h3 className="font-semibold text-lg" data-testid={`phonology-${lang.name}`}>{lang.name}</h3>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Consonants ({lang.phonology.consonants.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {lang.phonology.consonants.map(c => (
                            <Badge key={c} variant="outline" className="font-ipa text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Vowels ({lang.phonology.vowels.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {lang.phonology.vowels.map(v => (
                            <Badge key={v} variant="outline" className="font-ipa text-xs">{v}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Syllable Structure</p>
                        <p className="text-sm text-muted-foreground">{lang.phonology.syllableStructure}</p>
                      </div>

                      {idx < comparedLanguages.length - 1 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium">Similarity with {comparedLanguages[idx + 1].name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${calculatePhonologySimilarity(lang, comparedLanguages[idx + 1])}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{calculatePhonologySimilarity(lang, comparedLanguages[idx + 1])}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grammar Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Grammar Comparison</CardTitle>
                <CardDescription>Grammatical structures and features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${comparedLanguages.length}, 1fr)` }}>
                  {comparedLanguages.map((lang, idx) => (
                    <div key={lang.id} className="space-y-4">
                      <h3 className="font-semibold text-lg" data-testid={`grammar-${lang.name}`}>{lang.name}</h3>
                      
                      <div>
                        <p className="text-sm font-medium">Word Order</p>
                        <Badge variant="secondary">{lang.grammar.wordOrder}</Badge>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Noun Cases ({lang.grammar.nounCases.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {lang.grammar.nounCases.map(c => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Verb Tenses ({lang.grammar.verbTenses.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {lang.grammar.verbTenses.map(t => (
                            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>

                      {idx < comparedLanguages.length - 1 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium">Similarity with {comparedLanguages[idx + 1].name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${calculateGrammarSimilarity(lang, comparedLanguages[idx + 1])}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{calculateGrammarSimilarity(lang, comparedLanguages[idx + 1])}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vocabulary Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary Comparison</CardTitle>
                <CardDescription>Shared and divergent words</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${comparedLanguages.length}, 1fr)` }}>
                  {comparedLanguages.map((lang, idx) => (
                    <div key={lang.id} className="space-y-4">
                      <h3 className="font-semibold text-lg" data-testid={`vocabulary-${lang.name}`}>{lang.name}</h3>
                      
                      <div>
                        <p className="text-sm font-medium">Total Words</p>
                        <p className="text-2xl font-bold">{lang.vocabulary.length}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Sample Words</p>
                        <div className="space-y-1">
                          {lang.vocabulary.slice(0, 5).map(word => (
                            <div key={word.word} className="text-sm">
                              <span className="font-mono text-primary">{word.word}</span>
                              <span className="text-muted-foreground"> — {word.translation}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {idx < comparedLanguages.length - 1 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium">Similarity with {comparedLanguages[idx + 1].name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${calculateVocabularySimilarity(lang, comparedLanguages[idx + 1])}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{calculateVocabularySimilarity(lang, comparedLanguages[idx + 1])}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Syntax Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Syntax Comparison</CardTitle>
                <CardDescription>Sentence structure and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${comparedLanguages.length}, 1fr)` }}>
                  {comparedLanguages.map(lang => (
                    <div key={lang.id} className="space-y-4">
                      <h3 className="font-semibold text-lg" data-testid={`syntax-${lang.name}`}>{lang.name}</h3>
                      
                      <div>
                        <p className="text-sm font-medium">Sentence Structure</p>
                        <p className="text-sm text-muted-foreground">{lang.syntax.sentenceStructure}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Question Formation</p>
                        <p className="text-sm text-muted-foreground">{lang.syntax.questionFormation}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Negation</p>
                        <p className="text-sm text-muted-foreground">{lang.syntax.negation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {comparedLanguages.length < 2 && selectedLanguages.length > 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Select at least 2 languages to compare</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
