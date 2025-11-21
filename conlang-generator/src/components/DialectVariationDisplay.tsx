import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialectVariation } from '@/types/language';
import { MapPin, Volume2, BookOpen, Zap } from 'lucide-react';

interface DialectVariationDisplayProps {
  dialectVariations: DialectVariation[];
}

const DialectVariationDisplay: React.FC<DialectVariationDisplayProps> = ({ 
  dialectVariations 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Dialect Variations</span>
        </CardTitle>
        <CardDescription>
          Regional and social variations of the language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {dialectVariations.map((dialect, index) => (
            <Card key={index}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dialect.name}</CardTitle>
                  <Badge variant="outline">{dialect.region}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="phonological" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="phonological">
                      <div className="flex items-center space-x-1">
                        <Volume2 className="h-3 w-3" />
                        <span>Sounds</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="lexical">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Words</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="grammatical">
                      <div className="flex items-center space-x-1">
                        <Zap className="h-3 w-3" />
                        <span>Grammar</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="phonological" className="space-y-3">
                    {dialect.differences.phonological && dialect.differences.phonological.length > 0 ? (
                      <ul className="space-y-2">
                        {dialect.differences.phonological.map((change, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-primary">•</span>
                            <span className="text-sm">{change}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No significant phonological differences</p>
                    )}
                  </TabsContent>

                  <TabsContent value="lexical" className="space-y-3">
                    {dialect.differences.lexical && Object.keys(dialect.differences.lexical).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(dialect.differences.lexical).map(([standard, dialectal]) => (
                          <div key={standard} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Standard: <span className="font-mono">{standard}</span></p>
                              <p className="text-sm text-muted-foreground">Dialect: <span className="font-mono">{dialectal}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No significant lexical differences</p>
                    )}
                  </TabsContent>

                  <TabsContent value="grammatical" className="space-y-3">
                    {dialect.differences.grammatical && dialect.differences.grammatical.length > 0 ? (
                      <ul className="space-y-2">
                        {dialect.differences.grammatical.map((change, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-primary">•</span>
                            <span className="text-sm">{change}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No significant grammatical differences</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DialectVariationDisplay;