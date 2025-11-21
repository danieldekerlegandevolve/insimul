import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhoneticInventory } from '@/types/language';
import { Volume2, Grid3X3 } from 'lucide-react';

interface PhoneticChartProps {
  inventory: PhoneticInventory;
}

const PhoneticChart: React.FC<PhoneticChartProps> = ({ inventory }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Grid3X3 className="h-5 w-5" />
            <span>Consonant Chart</span>
          </CardTitle>
          <CardDescription>
            Consonants organized by place and manner of articulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(inventory.consonantChart).map(([category, sounds]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium capitalize">{category}</h4>
                <div className="flex flex-wrap gap-1">
                  {sounds.map((sound, index) => (
                    <Badge key={index} variant="outline" className="font-mono">
                      {sound}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Vowel Chart</span>
          </CardTitle>
          <CardDescription>
            Vowels organized by height and backness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(inventory.vowelChart).map(([category, sounds]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium capitalize">{category}</h4>
                <div className="flex flex-wrap gap-1">
                  {sounds.map((sound, index) => (
                    <Badge key={index} variant="secondary" className="font-mono">
                      {sound}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phonotactics</CardTitle>
          <CardDescription>
            Rules governing sound combinations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {inventory.phonotactics.map((rule, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span className="text-sm">{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneticChart;