import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Volume2, ArrowRight, Repeat, Zap } from 'lucide-react';

interface PhonologicalProcess {
  name: string;
  type: 'assimilation' | 'dissimilation' | 'deletion' | 'insertion' | 'metathesis' | 'lenition' | 'fortition';
  description: string;
  examples: { input: string; output: string; context: string }[];
  frequency: 'common' | 'occasional' | 'rare';
}

interface PhonologicalProcessesDisplayProps {
  processes: PhonologicalProcess[];
}

const PhonologicalProcessesDisplay: React.FC<PhonologicalProcessesDisplayProps> = ({ 
  processes 
}) => {
  const getProcessIcon = (type: string) => {
    switch (type) {
      case 'assimilation': return <Repeat className="h-4 w-4" />;
      case 'dissimilation': return <Zap className="h-4 w-4" />;
      case 'deletion': return <Volume2 className="h-4 w-4" />;
      case 'insertion': return <Volume2 className="h-4 w-4" />;
      case 'metathesis': return <ArrowRight className="h-4 w-4" />;
      default: return <Volume2 className="h-4 w-4" />;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'common': return 'default';
      case 'occasional': return 'secondary';
      case 'rare': return 'outline';
      default: return 'secondary';
    }
  };

  const groupedProcesses = processes.reduce((acc, process) => {
    if (!acc[process.type]) {
      acc[process.type] = [];
    }
    acc[process.type].push(process);
    return acc;
  }, {} as Record<string, PhonologicalProcess[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5" />
          <span>Phonological Processes</span>
        </CardTitle>
        <CardDescription>
          Sound changes and alternations in the language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={Object.keys(groupedProcesses)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {Object.keys(groupedProcesses).slice(0, 3).map(type => (
              <TabsTrigger key={type} value={type} className="capitalize">
                <div className="flex items-center space-x-1">
                  {getProcessIcon(type)}
                  <span>{type}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedProcesses).map(([type, typeProcesses]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {typeProcesses.map((process, index) => (
                <Card key={index}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        {getProcessIcon(process.type)}
                        <span>{process.name}</span>
                      </CardTitle>
                      <Badge variant={getFrequencyColor(process.frequency)} className="capitalize">
                        {process.frequency}
                      </Badge>
                    </div>
                    <CardDescription>{process.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h4 className="font-medium">Examples:</h4>
                      <div className="space-y-3">
                        {process.examples.map((example, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-mono text-lg">{example.input}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-lg font-semibold">{example.output}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Context: {example.context}
                            </p>
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

export default PhonologicalProcessesDisplay;