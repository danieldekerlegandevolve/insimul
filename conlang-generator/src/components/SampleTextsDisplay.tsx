import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SampleText } from '@/types/language';
import { MessageSquare, BookOpen, Heart, HelpCircle } from 'lucide-react';

interface SampleTextsDisplayProps {
  sampleTexts: SampleText[];
}

const SampleTextsDisplay: React.FC<SampleTextsDisplayProps> = ({ sampleTexts }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'greeting': return <MessageSquare className="h-4 w-4" />;
      case 'question': return <HelpCircle className="h-4 w-4" />;
      case 'poem': return <Heart className="h-4 w-4" />;
      case 'proverb': return <BookOpen className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const groupedTexts = sampleTexts.reduce((acc, text) => {
    if (!acc[text.type]) {
      acc[text.type] = [];
    }
    acc[text.type].push(text);
    return acc;
  }, {} as Record<string, SampleText[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>Sample Texts</span>
        </CardTitle>
        <CardDescription>
          Example sentences and phrases in your constructed language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={Object.keys(groupedTexts)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {Object.keys(groupedTexts).map(type => (
              <TabsTrigger key={type} value={type} className="capitalize">
                <div className="flex items-center space-x-1">
                  {getTypeIcon(type)}
                  <span>{type}s</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedTexts).map(([type, texts]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {texts.map((text, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {text.type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium text-sm text-muted-foreground">Conlang:</h5>
                            <p className="font-mono text-lg">{text.conlang}</p>
                          </div>
                          
                          {text.transliteration && (
                            <div>
                              <h5 className="font-medium text-sm text-muted-foreground">Transliteration:</h5>
                              <p className="font-mono text-sm">{text.transliteration}</p>
                            </div>
                          )}
                          
                          <div>
                            <h5 className="font-medium text-sm text-muted-foreground">English:</h5>
                            <p className="text-sm">{text.english}</p>
                          </div>
                        </div>
                      </div>

                      {text.grammaticalAnalysis && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Grammatical Analysis:</h5>
                          <div className="space-y-1">
                            {text.grammaticalAnalysis.map((analysis, idx) => (
                              <p key={idx} className="text-xs font-mono bg-muted p-2 rounded">
                                {analysis}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
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

export default SampleTextsDisplay;