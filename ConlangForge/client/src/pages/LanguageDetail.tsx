import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VocabularyTable } from "@/components/VocabularyTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, FileText, GitBranch, Sparkles, Search, ArrowLeftRight, Volume2 } from "lucide-react";
import type { Language } from "@shared/schema";
import { useSpeech } from "@/hooks/use-speech";

export default function LanguageDetail() {
  const [, params] = useRoute("/language/:id");
  const languageId = params?.id;
  const [conjugationSearch, setConjugationSearch] = useState("");
  const [declensionSearch, setDeclensionSearch] = useState("");
  const { speak, isSpeaking, supported: speechSupported } = useSpeech({ rate: 0.8 });

  const { data: language, isLoading } = useQuery<Language>({
    queryKey: [`/api/languages/${languageId}`],
    enabled: !!languageId,
  });

  const { data: children = [] } = useQuery<Language[]>({
    queryKey: [`/api/languages/${languageId}/children`],
    enabled: !!languageId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold" data-testid="text-language-detail-name">{language.name}</h1>
              <p className="text-muted-foreground">{language.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {language.influences?.map((influence) => (
                  <Badge key={influence} variant="secondary">
                    {influence}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/language/${language.id}/chat`}>
                <Button data-testid="button-chat-with-language">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              </Link>
              <Link href={`/compare?languages=${language.id}`}>
                <Button variant="outline" data-testid="button-compare-language">
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Compare
                </Button>
              </Link>
              <Link href={`/create?parentId=${language.id}`}>
                <Button variant="outline" data-testid="button-create-child-language">
                  <GitBranch className="mr-2 h-4 w-4" />
                  Create Child
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="phonology" data-testid="tab-phonology">Phonology</TabsTrigger>
            <TabsTrigger value="grammar" data-testid="tab-grammar">Grammar</TabsTrigger>
            <TabsTrigger value="syntax" data-testid="tab-syntax">Syntax</TabsTrigger>
            <TabsTrigger value="vocabulary" data-testid="tab-vocabulary">Vocabulary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vocabulary Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{language.vocabulary?.length || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">words</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grammar Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{language.grammar?.rules?.length || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">rules defined</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Child Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{children.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">descendants</p>
                </CardContent>
              </Card>
            </div>

            {children.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Descendant Languages</CardTitle>
                  <CardDescription>
                    Languages derived from {language.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {children.map((child) => (
                      <Link key={child.id} href={`/language/${child.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-md border hover-elevate active-elevate-2">
                          <div>
                            <p className="font-semibold">{child.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {child.description}
                            </p>
                          </div>
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="phonology" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Phonological System</CardTitle>
                <CardDescription>
                  The sound system and pronunciation rules of {language.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Consonants</h3>
                  <div className="flex flex-wrap gap-2">
                    {language.phonology?.consonants?.map((consonant) => (
                      <Badge key={consonant} variant="outline" className="font-ipa">
                        {consonant}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Vowels</h3>
                  <div className="flex flex-wrap gap-2">
                    {language.phonology?.vowels?.map((vowel) => (
                      <Badge key={vowel} variant="outline" className="font-ipa">
                        {vowel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Syllable Structure</h3>
                    <p className="text-sm text-muted-foreground">
                      {language.phonology?.syllableStructure}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Stress Pattern</h3>
                    <p className="text-sm text-muted-foreground">
                      {language.phonology?.stressPattern}
                    </p>
                  </div>
                </div>

                {language.phonology?.evolutionRules && language.phonology.evolutionRules.length > 0 && (
                  <div data-testid="section-evolution-rules">
                    <h3 className="font-semibold mb-3">Sound Evolution Rules</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      How sounds changed from the parent language
                    </p>
                    <div className="space-y-4">
                      {language.phonology.evolutionRules.map((rule, index) => (
                        <Card key={index} className="bg-muted/50" data-testid={`evolution-rule-${index}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="font-mono text-xs shrink-0" data-testid={`rule-notation-${index}`}>
                                {rule.rule}
                              </Badge>
                              <div className="flex-1 space-y-2">
                                <p className="text-sm" data-testid={`rule-description-${index}`}>{rule.description}</p>
                                {rule.examples && rule.examples.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Examples:</p>
                                    <div className="space-y-1">
                                      {rule.examples.map((example, exIdx) => (
                                        <div key={exIdx} className="text-sm flex items-center gap-2" data-testid={`rule-example-${index}-${exIdx}`}>
                                          <span className="font-mono text-primary">{example.parent}</span>
                                          <span className="text-muted-foreground">→</span>
                                          <span className="font-mono text-primary">{example.child}</span>
                                          <span className="text-muted-foreground text-xs">"{example.meaning}"</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {language.vocabulary && language.vocabulary.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Pronunciation Examples</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {speechSupported 
                        ? "Click the speaker icon to hear words pronounced"
                        : "Sample words with IPA pronunciation"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {language.vocabulary.slice(0, 8).map((vocab, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                          data-testid={`pronunciation-example-${index}`}
                        >
                          <div className="flex-1">
                            <div className="font-ipa font-semibold">{vocab.word}</div>
                            <div className="text-sm text-muted-foreground">{vocab.translation}</div>
                            {vocab.pronunciation && (
                              <div className="text-xs text-muted-foreground font-ipa mt-1">
                                /{vocab.pronunciation}/
                              </div>
                            )}
                          </div>
                          {speechSupported && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => speak(vocab.word, `phonology-${index}`)}
                              data-testid={`button-speak-phonology-${index}`}
                              aria-label={`Pronounce ${vocab.word}`}
                              className="flex-shrink-0"
                            >
                              {isSpeaking(`phonology-${index}`) ? (
                                <Volume2 className="h-4 w-4 text-primary" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {language.phonology?.phoneticNotes && (
                  <div>
                    <h3 className="font-semibold mb-2">Phonetic Notes</h3>
                    <p className="text-sm text-muted-foreground">
                      {language.phonology.phoneticNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grammar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grammatical Structure</CardTitle>
                <CardDescription>
                  Core grammatical features and morphology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Word Order</h3>
                    <p className="text-sm text-muted-foreground">{language.grammar?.wordOrder}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Articles</h3>
                    <p className="text-sm text-muted-foreground">{language.grammar?.articles}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Pluralization</h3>
                    <p className="text-sm text-muted-foreground">{language.grammar?.pluralization}</p>
                  </div>
                </div>

                {language.grammar?.nounCases && language.grammar.nounCases.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Noun Cases</h3>
                    <div className="flex flex-wrap gap-2">
                      {language.grammar.nounCases.map((nounCase) => (
                        <Badge key={nounCase} variant="secondary">
                          {nounCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {language.grammar?.verbTenses && language.grammar.verbTenses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Verb Tenses</h3>
                    <div className="flex flex-wrap gap-2">
                      {language.grammar.verbTenses.map((tense) => (
                        <Badge key={tense} variant="secondary">
                          {tense}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {language.grammar?.rules && language.grammar.rules.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Grammar Rules</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {language.grammar.rules.map((rule, index) => (
                        <AccordionItem key={index} value={`rule-${index}`}>
                          <AccordionTrigger>{rule.title}</AccordionTrigger>
                          <AccordionContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                            {rule.examples && rule.examples.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-sm font-medium">Examples:</p>
                                {rule.examples.map((example, i) => (
                                  <p key={i} className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                    {example}
                                  </p>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {language.grammar?.conjugations && language.grammar.conjugations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Verb Conjugations</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete conjugation tables for common verbs
                    </p>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search conjugations by verb, translation, tense, person, or form..."
                        value={conjugationSearch}
                        onChange={(e) => setConjugationSearch(e.target.value)}
                        className="pl-10"
                        data-testid="input-conjugation-search"
                      />
                    </div>
                    <div className="space-y-6">
                      {language.grammar.conjugations
                        .filter(conj => {
                          if (!conjugationSearch) return true;
                          const search = conjugationSearch.toLowerCase();
                          return (
                            conj.verb.toLowerCase().includes(search) ||
                            conj.translation.toLowerCase().includes(search) ||
                            conj.forms.some(form =>
                              form.tense.toLowerCase().includes(search) ||
                              form.person.toLowerCase().includes(search) ||
                              form.number.toLowerCase().includes(search) ||
                              form.form.toLowerCase().includes(search)
                            )
                          );
                        })
                        .map((conj, index) => (
                        <Card key={index} data-testid={`conjugation-${index}`}>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="font-mono text-primary">{conj.verb}</span>
                              <span className="text-muted-foreground text-sm font-normal">— {conj.translation}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2 text-sm font-semibold">Tense</th>
                                    <th className="text-left p-2 text-sm font-semibold">Person</th>
                                    <th className="text-left p-2 text-sm font-semibold">Number</th>
                                    <th className="text-left p-2 text-sm font-semibold">Form</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {conj.forms.map((form, formIdx) => (
                                    <tr key={formIdx} className="border-b border-border/50" data-testid={`conjugation-form-${index}-${formIdx}`}>
                                      <td className="p-2 text-sm">{form.tense}</td>
                                      <td className="p-2 text-sm">{form.person}</td>
                                      <td className="p-2 text-sm">{form.number}</td>
                                      <td className="p-2 text-sm font-mono text-primary">{form.form}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {language.grammar?.declensions && language.grammar.declensions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Noun Declensions</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete declension tables for common nouns
                    </p>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search declensions by noun, translation, case, or form..."
                        value={declensionSearch}
                        onChange={(e) => setDeclensionSearch(e.target.value)}
                        className="pl-10"
                        data-testid="input-declension-search"
                      />
                    </div>
                    <div className="space-y-6">
                      {language.grammar.declensions
                        .filter(decl => {
                          if (!declensionSearch) return true;
                          const search = declensionSearch.toLowerCase();
                          return (
                            decl.noun.toLowerCase().includes(search) ||
                            decl.translation.toLowerCase().includes(search) ||
                            (decl.gender && decl.gender.toLowerCase().includes(search)) ||
                            decl.forms.some(form =>
                              form.case.toLowerCase().includes(search) ||
                              form.number.toLowerCase().includes(search) ||
                              form.form.toLowerCase().includes(search)
                            )
                          );
                        })
                        .map((decl, index) => (
                        <Card key={index} data-testid={`declension-${index}`}>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="font-mono text-primary">{decl.noun}</span>
                              <span className="text-muted-foreground text-sm font-normal">— {decl.translation}</span>
                              {decl.gender && (
                                <Badge variant="outline" className="ml-2 text-xs">{decl.gender}</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2 text-sm font-semibold">Case</th>
                                    <th className="text-left p-2 text-sm font-semibold">Number</th>
                                    <th className="text-left p-2 text-sm font-semibold">Form</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {decl.forms.map((form, formIdx) => (
                                    <tr key={formIdx} className="border-b border-border/50" data-testid={`declension-form-${index}-${formIdx}`}>
                                      <td className="p-2 text-sm">{form.case}</td>
                                      <td className="p-2 text-sm">{form.number}</td>
                                      <td className="p-2 text-sm font-mono text-primary">{form.form}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="syntax" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Syntactic Patterns</CardTitle>
                <CardDescription>
                  Sentence structure and word arrangement rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Sentence Structure</h3>
                    <p className="text-sm text-muted-foreground">
                      {language.syntax?.sentenceStructure}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Question Formation</h3>
                    <p className="text-sm text-muted-foreground">
                      {language.syntax?.questionFormation}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Negation</h3>
                    <p className="text-sm text-muted-foreground">{language.syntax?.negation}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Subordination</h3>
                    <p className="text-sm text-muted-foreground">
                      {language.syntax?.subordination}
                    </p>
                  </div>
                </div>

                {language.syntax?.patterns && language.syntax.patterns.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Common Patterns</h3>
                    <div className="space-y-3">
                      {language.syntax.patterns.map((pattern, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-2">
                          <p className="font-mono text-sm font-semibold">{pattern.pattern}</p>
                          <p className="text-sm text-muted-foreground">{pattern.description}</p>
                          <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {pattern.example}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vocabulary">
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary</CardTitle>
                <CardDescription>
                  Complete lexicon of {language.name} with {language.vocabulary?.length || 0} words
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VocabularyTable vocabulary={language.vocabulary || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
