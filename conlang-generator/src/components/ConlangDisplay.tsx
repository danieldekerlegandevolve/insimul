import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneratedConlang } from '@/types/language';
import { Globe, Volume2, BookOpen, Zap } from 'lucide-react';

interface ConlangDisplayProps {
  conlang: GeneratedConlang;
}

const ConlangDisplay: React.FC<ConlangDisplayProps> = ({ conlang }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Globe className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">{conlang.name}</CardTitle>
        </div>
        <CardDescription className="text-base leading-relaxed">
          {conlang.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phonology">Phonology</TabsTrigger>
            <TabsTrigger value="grammar">Grammar</TabsTrigger>
            <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Key Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{conlang.features.wordOrder}</Badge>
                    {conlang.features.hasGender && <Badge variant="secondary">Gendered</Badge>}
                    {conlang.features.hasCase && <Badge variant="secondary">Cases</Badge>}
                    {conlang.features.hasTones && <Badge variant="secondary">Tonal</Badge>}
                    {conlang.features.agglutinative && <Badge variant="outline">Agglutinative</Badge>}
                    {conlang.features.fusional && <Badge variant="outline">Fusional</Badge>}
                    {conlang.features.isolating && <Badge variant="outline">Isolating</Badge>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Language Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {conlang.rules.slice(0, 4).map((rule, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="phonology" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Volume2 className="h-5 w-5" />
                    <span>Consonants ({conlang.phonemes.consonants.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {conlang.phonemes.consonants.map((consonant, index) => (
                      <Badge key={index} variant="outline" className="font-mono">
                        {consonant}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vowels ({conlang.phonemes.vowels.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {conlang.phonemes.vowels.map((vowel, index) => (
                      <Badge key={index} variant="outline" className="font-mono">
                        {vowel}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consonant Clusters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {conlang.phonemes.clusters.map((cluster, index) => (
                    <Badge key={index} variant="secondary" className="font-mono">
                      {cluster}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grammar" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verb Tenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {conlang.grammar.verbTenses.map((tense, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="text-primary">•</span>
                        <span className="capitalize">{tense}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {conlang.grammar.nounCases && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Noun Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {conlang.grammar.nounCases.map((case_, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="text-primary">•</span>
                          <span className="capitalize">{case_}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {conlang.grammar.genders && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Grammatical Genders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {conlang.grammar.genders.map((gender, index) => (
                        <Badge key={index} variant="secondary" className="capitalize">
                          {gender}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pluralization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{conlang.grammar.pluralization}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vocabulary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Sample Vocabulary</span>
                </CardTitle>
                <CardDescription>
                  Basic words generated using the phonological rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(conlang.sampleWords).map(([english, conlangWord]) => (
                    <div key={english} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">{english}</span>
                      <span className="font-mono font-semibold">{conlangWord}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConlangDisplay;