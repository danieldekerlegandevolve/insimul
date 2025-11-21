import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Crown, GraduationCap, MapPin, Clock } from 'lucide-react';

interface SociolinguisticVariation {
  dimension: 'register' | 'age' | 'gender' | 'class' | 'profession' | 'region';
  name: string;
  description: string;
  features: {
    phonological?: string[];
    lexical?: { [standard: string]: string };
    grammatical?: string[];
    pragmatic?: string[];
  };
  examples: {
    context: string;
    standard: string;
    variant: string;
    explanation: string;
  }[];
}

interface SociolinguisticDisplayProps {
  variations: SociolinguisticVariation[];
  languageName: string;
}

const SociolinguisticDisplay: React.FC<SociolinguisticDisplayProps> = ({ 
  variations, 
  languageName 
}) => {
  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case 'register': return <Crown className="h-4 w-4" />;
      case 'age': return <Clock className="h-4 w-4" />;
      case 'gender': return <Users className="h-4 w-4" />;
      case 'class': return <Crown className="h-4 w-4" />;
      case 'profession': return <GraduationCap className="h-4 w-4" />;
      case 'region': return <MapPin className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getDimensionColor = (dimension: string) => {
    switch (dimension) {
      case 'register': return 'default';
      case 'age': return 'secondary';
      case 'gender': return 'outline';
      case 'class': return 'destructive';
      case 'profession': return 'default';
      case 'region': return 'secondary';
      default: return 'outline';
    }
  };

  const groupedVariations = variations.reduce((acc, variation) => {
    if (!acc[variation.dimension]) {
      acc[variation.dimension] = [];
    }
    acc[variation.dimension].push(variation);
    return acc;
  }, {} as Record<string, SociolinguisticVariation[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Sociolinguistic Variation</span>
        </CardTitle>
        <CardDescription>
          Social and contextual variations in {languageName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={Object.keys(groupedVariations)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {Object.keys(groupedVariations).slice(0, 3).map(dimension => (
              <TabsTrigger key={dimension} value={dimension} className="capitalize">
                <div className="flex items-center space-x-1">
                  {getDimensionIcon(dimension)}
                  <span>{dimension}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedVariations).map(([dimension, dimVariations]) => (
            <TabsContent key={dimension} value={dimension} className="space-y-4">
              {dimVariations.map((variation, index) => (
                <Card key={index}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        {getDimensionIcon(variation.dimension)}
                        <span>{variation.name}</span>
                      </CardTitle>
                      <Badge variant={getDimensionColor(variation.dimension)} className="capitalize">
                        {variation.dimension}
                      </Badge>
                    </div>
                    <CardDescription>{variation.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="features" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="examples">Examples</TabsTrigger>
                      </TabsList>

                      <TabsContent value="features" className="space-y-4">
                        {variation.features.phonological && (
                          <div className="space-y-2">
                            <h5 className="font-medium">Phonological Features:</h5>
                            <ul className="space-y-1">
                              {variation.features.phonological.map((feature, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <span className="text-primary">•</span>
                                  <span className="text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {variation.features.lexical && Object.keys(variation.features.lexical).length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium">Lexical Differences:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(variation.features.lexical).map(([standard, variant]) => (
                                <div key={standard} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                  <span className="font-mono">{standard}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="font-mono font-semibold">{variant}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {variation.features.grammatical && (
                          <div className="space-y-2">
                            <h5 className="font-medium">Grammatical Features:</h5>
                            <ul className="space-y-1">
                              {variation.features.grammatical.map((feature, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <span className="text-primary">•</span>
                                  <span className="text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {variation.features.pragmatic && (
                          <div className="space-y-2">
                            <h5 className="font-medium">Pragmatic Features:</h5>
                            <ul className="space-y-1">
                              {variation.features.pragmatic.map((feature, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <span className="text-primary">•</span>
                                  <span className="text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="examples" className="space-y-4">
                        {variation.examples.map((example, idx) => (
                          <div key={idx} className="p-4 bg-muted rounded-lg space-y-3">
                            <div className="font-medium text-sm">
                              Context: {example.context}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm text-muted-foreground">Standard:</span>
                                <p className="font-mono">{example.standard}</p>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Variant:</span>
                                <p className="font-mono font-semibold text-primary">{example.variant}</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{example.explanation}</p>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
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

export default SociolinguisticDisplay;