import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ConlangConfig } from '@/types/language';

interface ConlangConfigProps {
  config: ConlangConfig;
  onConfigChange: (config: ConlangConfig) => void;
}

const ConlangConfigComponent: React.FC<ConlangConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const handleNameChange = (name: string) => {
    onConfigChange({ ...config, name });
  };

  const handleEmphasisChange = (type: keyof ConlangConfig['emphasis'], value: number[]) => {
    onConfigChange({
      ...config,
      emphasis: {
        ...config.emphasis,
        [type]: value[0],
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Language Configuration</CardTitle>
        <CardDescription>
          Customize your constructed language settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="language-name">Language Name</Label>
          <Input
            id="language-name"
            placeholder="Enter your language name..."
            value={config.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Feature Emphasis</h3>
          <p className="text-sm text-muted-foreground">
            Adjust how much influence each aspect should have
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Phonology (Sound System)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.emphasis.phonology}%
                </span>
              </div>
              <Slider
                value={[config.emphasis.phonology]}
                onValueChange={(value) => handleEmphasisChange('phonology', value)}
                max={100}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Grammar Structure</Label>
                <span className="text-sm text-muted-foreground">
                  {config.emphasis.grammar}%
                </span>
              </div>
              <Slider
                value={[config.emphasis.grammar]}
                onValueChange={(value) => handleEmphasisChange('grammar', value)}
                max={100}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Vocabulary Generation</Label>
                <span className="text-sm text-muted-foreground">
                  {config.emphasis.vocabulary}%
                </span>
              </div>
              <Slider
                value={[config.emphasis.vocabulary]}
                onValueChange={(value) => handleEmphasisChange('vocabulary', value)}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConlangConfigComponent;