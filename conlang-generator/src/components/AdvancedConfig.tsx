import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ConlangConfig } from '@/types/language';
import { Settings, Target, Zap, Clock, Globe, BookOpen } from 'lucide-react';

interface AdvancedConfigProps {
  config: ConlangConfig;
  onConfigChange: (config: ConlangConfig) => void;
}

const AdvancedConfig: React.FC<AdvancedConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const handleComplexityChange = (complexity: 'simple' | 'moderate' | 'complex') => {
    onConfigChange({ ...config, complexity });
  };

  const handlePurposeChange = (purpose: 'artistic' | 'auxiliary' | 'experimental' | 'fictional') => {
    onConfigChange({ ...config, purpose });
  };

  const handleSwitchChange = (field: keyof ConlangConfig, value: boolean) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Advanced Settings</span>
        </CardTitle>
        <CardDescription>
          Fine-tune your language generation with advanced parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Complexity Level</span>
            </Label>
            <Select value={config.complexity} onValueChange={handleComplexityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple - Basic features only</SelectItem>
                <SelectItem value="moderate">Moderate - Balanced complexity</SelectItem>
                <SelectItem value="complex">Complex - Advanced features</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Language Purpose</span>
            </Label>
            <Select value={config.purpose} onValueChange={handlePurposeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artistic">Artistic - For creative expression</SelectItem>
                <SelectItem value="auxiliary">Auxiliary - International communication</SelectItem>
                <SelectItem value="experimental">Experimental - Linguistic research</SelectItem>
                <SelectItem value="fictional">Fictional - For stories/games</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Feature Generation</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Include Writing System</span>
                </Label>
                <p className="text-sm text-muted-foreground">Generate a complete orthographic system</p>
              </div>
              <Switch 
                checked={config.includeWritingSystem}
                onCheckedChange={(value) => handleSwitchChange('includeWritingSystem', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Cultural Context</span>
                </Label>
                <p className="text-sm text-muted-foreground">Add cultural and historical background</p>
              </div>
              <Switch 
                checked={config.includeCulturalContext}
                onCheckedChange={(value) => handleSwitchChange('includeCulturalContext', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Advanced Phonetics</Label>
                <p className="text-sm text-muted-foreground">Include detailed phonological processes</p>
              </div>
              <Switch 
                checked={config.includeAdvancedPhonetics}
                onCheckedChange={(value) => handleSwitchChange('includeAdvancedPhonetics', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sample Texts</Label>
                <p className="text-sm text-muted-foreground">Generate example sentences and phrases</p>
              </div>
              <Switch 
                checked={config.generateSampleTexts}
                onCheckedChange={(value) => handleSwitchChange('generateSampleTexts', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Language Evolution</span>
                </Label>
                <p className="text-sm text-muted-foreground">Show historical development over time</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dialect Variations</Label>
                <p className="text-sm text-muted-foreground">Generate regional language variants</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Interactive Learning</Label>
                <p className="text-sm text-muted-foreground">Create educational modules and exercises</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Generation Parameters</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Phonological Complexity</Label>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Slider defaultValue={[75]} max={100} step={5} className="w-full" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Morphological Richness</Label>
                <span className="text-sm text-muted-foreground">60%</span>
              </div>
              <Slider defaultValue={[60]} max={100} step={5} className="w-full" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Syntactic Variation</Label>
                <span className="text-sm text-muted-foreground">50%</span>
              </div>
              <Slider defaultValue={[50]} max={100} step={5} className="w-full" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Lexical Innovation</Label>
                <span className="text-sm text-muted-foreground">80%</span>
              </div>
              <Slider defaultValue={[80]} max={100} step={5} className="w-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedConfig;