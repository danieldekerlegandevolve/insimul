import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timeline, Clock, TrendingUp, Shuffle } from 'lucide-react';

interface LanguageEvolution {
  period: string;
  changes: string[];
  speakers: number;
  status: string;
  keyFeatures: string[];
}

interface LanguageEvolutionDisplayProps {
  evolution: LanguageEvolution[];
  languageName: string;
}

const LanguageEvolutionDisplay: React.FC<LanguageEvolutionDisplayProps> = ({ 
  evolution, 
  languageName 
}) => {
  const maxSpeakers = Math.max(...evolution.map(e => e.speakers));

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'proto': return 'secondary';
      case 'classical': return 'default';
      case 'medieval': return 'outline';
      case 'modern': return 'destructive';
      case 'contemporary': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Timeline className="h-5 w-5" />
          <span>Language Evolution</span>
        </CardTitle>
        <CardDescription>
          Historical development of {languageName} over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {evolution.map((period, index) => (
            <div key={index} className="relative">
              {/* Timeline connector */}
              {index < evolution.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-16 bg-border" />
              )}
              
              <div className="flex space-x-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                
                {/* Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{period.period}</h3>
                    <Badge variant={getStatusColor(period.status)} className="capitalize">
                      {period.status}
                    </Badge>
                  </div>
                  
                  {/* Speaker count */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>Speakers</span>
                      </span>
                      <span className="font-medium">
                        {period.speakers.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={(period.speakers / maxSpeakers) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  {/* Key features */}
                  {period.keyFeatures.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {period.keyFeatures.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Changes */}
                  {period.changes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center space-x-1">
                        <Shuffle className="h-4 w-4" />
                        <span>Major Changes:</span>
                      </h4>
                      <ul className="space-y-1">
                        {period.changes.map((change, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-primary text-xs mt-1">•</span>
                            <span className="text-sm">{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageEvolutionDisplay;