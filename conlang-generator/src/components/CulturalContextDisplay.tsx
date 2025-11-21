import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CulturalContext } from '@/types/language';
import { Globe, Users, Clock, Mountain } from 'lucide-react';

interface CulturalContextDisplayProps {
  culturalContext: CulturalContext;
}

const CulturalContextDisplay: React.FC<CulturalContextDisplayProps> = ({ 
  culturalContext 
}) => {
  const formatSpeakerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'living': return 'default';
      case 'endangered': return 'destructive';
      case 'extinct': return 'secondary';
      case 'constructed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Cultural Context</span>
          </CardTitle>
          <CardDescription>
            Historical and cultural background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Mountain className="h-4 w-4" />
                <span>Region</span>
              </h4>
              <p className="text-sm">{culturalContext.region}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Speakers</span>
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">
                  {formatSpeakerCount(culturalContext.speakers)}
                </span>
                <Badge variant={getStatusColor(culturalContext.status)} className="capitalize">
                  {culturalContext.status}
                </Badge>
              </div>
            </div>
          </div>

          {culturalContext.historicalPeriod && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Historical Period</span>
              </h4>
              <p className="text-sm">{culturalContext.historicalPeriod}</p>
            </div>
          )}

          {culturalContext.geographicalFeatures && (
            <div className="space-y-2">
              <h4 className="font-medium">Geographical Features</h4>
              <div className="flex flex-wrap gap-2">
                {culturalContext.geographicalFeatures.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {culturalContext.socialStructure && (
            <div className="space-y-2">
              <h4 className="font-medium">Social Structure</h4>
              <p className="text-sm">{culturalContext.socialStructure}</p>
            </div>
          )}

          {culturalContext.culturalNotes && (
            <div className="space-y-2">
              <h4 className="font-medium">Cultural Notes</h4>
              <ul className="space-y-1">
                {culturalContext.culturalNotes.map((note, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CulturalContextDisplay;