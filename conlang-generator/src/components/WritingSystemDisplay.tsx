import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WritingSystem } from '@/types/language';
import { PenTool, ArrowRight, ArrowLeft, ArrowDown, Shuffle } from 'lucide-react';

interface WritingSystemDisplayProps {
  writingSystem: WritingSystem;
  sampleText?: string;
}

const WritingSystemDisplay: React.FC<WritingSystemDisplayProps> = ({ 
  writingSystem, 
  sampleText 
}) => {
  const getDirectionIcon = () => {
    switch (writingSystem.direction) {
      case 'ltr': return <ArrowRight className="h-4 w-4" />;
      case 'rtl': return <ArrowLeft className="h-4 w-4" />;
      case 'ttb': return <ArrowDown className="h-4 w-4" />;
      case 'boustrophedon': return <Shuffle className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getDirectionName = () => {
    switch (writingSystem.direction) {
      case 'ltr': return 'Left to Right';
      case 'rtl': return 'Right to Left';
      case 'ttb': return 'Top to Bottom';
      case 'boustrophedon': return 'Boustrophedon';
      default: return 'Left to Right';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PenTool className="h-5 w-5" />
            <span>Writing System</span>
          </CardTitle>
          <CardDescription>
            Script and orthographic conventions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">System Type</h4>
              <Badge variant="default" className="capitalize">
                {writingSystem.type}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Writing Direction</h4>
              <div className="flex items-center space-x-2">
                {getDirectionIcon()}
                <span className="text-sm">{getDirectionName()}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Word Separation</h4>
              <Badge variant={writingSystem.hasSpaces ? "secondary" : "outline"}>
                {writingSystem.hasSpaces ? "Uses Spaces" : "No Spaces"}
              </Badge>
            </div>
          </div>

          {writingSystem.characters && (
            <div className="space-y-2">
              <h4 className="font-medium">Character Set ({writingSystem.characters.length})</h4>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex flex-wrap gap-2 font-mono text-lg">
                  {writingSystem.characters.slice(0, 50).map((char, index) => (
                    <span key={index} className="px-2 py-1 bg-background rounded border">
                      {char}
                    </span>
                  ))}
                  {writingSystem.characters.length > 50 && (
                    <span className="text-muted-foreground">
                      ... and {writingSystem.characters.length - 50} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {writingSystem.numerals && (
            <div className="space-y-2">
              <h4 className="font-medium">Numerals</h4>
              <div className="flex space-x-2 font-mono text-lg">
                {writingSystem.numerals.map((num, index) => (
                  <span key={index} className="px-2 py-1 bg-muted rounded">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}

          {writingSystem.specialFeatures && (
            <div className="space-y-2">
              <h4 className="font-medium">Special Features</h4>
              <ul className="space-y-1">
                {writingSystem.specialFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sampleText && (
            <div className="space-y-2">
              <h4 className="font-medium">Sample Text</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className={`font-mono text-lg ${
                  writingSystem.direction === 'rtl' ? 'text-right' : 
                  writingSystem.direction === 'ttb' ? 'writing-mode-vertical-rl' : 'text-left'
                }`}>
                  {sampleText}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WritingSystemDisplay;