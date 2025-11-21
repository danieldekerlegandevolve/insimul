import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Shuffle, Zap, Volume2 } from 'lucide-react';

interface MorphophonologicalRule {
  name: string;
  type: 'vowel-harmony' | 'consonant-gradation' | 'ablaut' | 'umlaut' | 'sandhi' | 'mutation';
  description: string;
  environment: string;
  examples: {
    base: string;
    modified: string;
    context: string;
    meaning: string;
  }[];
  frequency: 'systematic' | 'common' | 'lexicalized';
}

interface MorphophonologyDisplayProps {
  rules: MorphophonologicalRule[];
  languageName: string;
}

const MorphophonologyDisplay: React.FC<MorphophonologyDisplayProps> = ({ 
  rules, 
  languageName 
}) => {
  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'vowel-harmony': return <Volume2 className="h-4 w-4" />;
      case 'consonant-gradation': return <Shuffle className="h-4 w-4" />;
      case 'ablaut': return <Zap className="h-4 w-4" />;
      case 'umlaut': return <Volume2 className="h-4 w-4" />;
      case 'sandhi': return <ArrowRight className="h-4 w-4" />;
      case 'mutation': return <Shuffle className="h-4 w-4" />;
      default: return <Volume2 className="h-4 w-4" />;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'systematic': return 'default';
      case 'common': return 'secondary';
      case 'lexicalized': return 'outline';
      default: return 'secondary';
    }
  };

  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.type]) {
      acc[rule.type] = [];
    }
    acc[rule.type].push(rule);
    return acc;
  }, {} as Record<string, MorphophonologicalRule[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shuffle className="h-5 w-5" />
          <span>Morphophonology</span>
        </CardTitle>
        <CardDescription>
          Sound alternations in {languageName} morphology
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={Object.keys(groupedRules)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {Object.keys(groupedRules).slice(0, 3).map(type => (
              <TabsTrigger key={type} value={type} className="capitalize">
                <div className="flex items-center space-x-1">
                  {getRuleIcon(type)}
                  <span>{type.replace('-', ' ')}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedRules).map(([type, typeRules]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {typeRules.map((rule, index) => (
                <Card key={index}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        {getRuleIcon(rule.type)}
                        <span>{rule.name}</span>
                      </CardTitle>
                      <Badge variant={getFrequencyColor(rule.frequency)} className="capitalize">
                        {rule.frequency}
                      </Badge>
                    </div>
                    <CardDescription>{rule.description}</CardDescription>
                    <div className="text-sm text-muted-foreground">
                      <strong>Environment:</strong> {rule.environment}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h4 className="font-medium">Examples:</h4>
                      <div className="grid gap-3">
                        {rule.examples.map((example, idx) => (
                          <div key={idx} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-mono text-lg font-semibold">{example.base}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-lg font-semibold text-primary">{example.modified}</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><strong>Context:</strong> {example.context}</p>
                              <p><strong>Meaning:</strong> {example.meaning}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MorphophonologyDisplay;