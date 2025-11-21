import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Etymology } from '@/types/language';
import { TreePine, ArrowRight, Globe } from 'lucide-react';

interface EtymologyDisplayProps {
  etymologies: Etymology[];
}

const EtymologyDisplay: React.FC<EtymologyDisplayProps> = ({ etymologies }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TreePine className="h-5 w-5" />
          <span>Etymology</span>
        </CardTitle>
        <CardDescription>
          Word origins and historical development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {etymologies.map((etymology, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-mono text-lg font-semibold">{etymology.word}</h4>
                <p className="text-sm text-muted-foreground">"{etymology.meaning}"</p>
              </div>
              <Badge variant="secondary">{etymology.origin}</Badge>
            </div>

            {etymology.evolution.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Historical Evolution:</h5>
                <div className="flex flex-wrap items-center gap-2">
                  {etymology.evolution.map((stage, idx) => (
                    <React.Fragment key={idx}>
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {stage}
                      </span>
                      {idx < etymology.evolution.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {etymology.cognates && Object.keys(etymology.cognates).length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>Cognates:</span>
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(etymology.cognates).map(([lang, word]) => (
                    <div key={lang} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                      <span className="text-muted-foreground">{lang}:</span>
                      <span className="font-mono">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EtymologyDisplay;