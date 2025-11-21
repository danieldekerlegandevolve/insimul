import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LanguageSelector from '@/components/LanguageSelector';
import ConlangConfigComponent from '@/components/ConlangConfig';
import AdvancedConfig from '@/components/AdvancedConfig';
import LanguageStatistics from '@/components/LanguageStatistics';
import ConlangDisplay from '@/components/ConlangDisplay';
import PhoneticChart from '@/components/PhoneticChart';
import WritingSystemDisplay from '@/components/WritingSystemDisplay';
import CulturalContextDisplay from '@/components/CulturalContextDisplay';
import SampleTextsDisplay from '@/components/SampleTextsDisplay';
import EtymologyDisplay from '@/components/EtymologyDisplay';
import LearningModule from '@/components/LearningModule';
import { ConlangGenerator } from '@/utils/conlangGenerator';
import { AdvancedConlangGenerator } from '@/utils/advancedConlangGenerator';
import { ConlangConfig, GeneratedConlang } from '@/types/language';
import { Sparkles, Languages, AlertCircle, Download, Share2, BookOpen, Globe, PenTool, GraduationCap } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Index = () => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [config, setConfig] = useState<ConlangConfig>({
    selectedLanguages: [],
    name: '',
    emphasis: {
      phonology: 50,
      grammar: 50,
      vocabulary: 50,
    },
    complexity: 'moderate',
    purpose: 'artistic',
    includeWritingSystem: false,
    includeCulturalContext: false,
    includeAdvancedPhonetics: false,
    generateSampleTexts: false,
  });
  const [generatedConlang, setGeneratedConlang] = useState<GeneratedConlang | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLanguageToggle = (languageId: string) => {
    const newSelection = selectedLanguages.includes(languageId)
      ? selectedLanguages.filter(id => id !== languageId)
      : [...selectedLanguages, languageId];
    
    if (newSelection.length <= 6) {
      setSelectedLanguages(newSelection);
      setConfig(prev => ({ ...prev, selectedLanguages: newSelection }));
    } else {
      showError('You can select up to 6 languages maximum');
    }
  };

  const handleGenerate = async () => {
    if (selectedLanguages.length < 2) {
      showError('Please select at least 2 languages');
      return;
    }

    if (!config.name.trim()) {
      showError('Please enter a name for your language');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate processing time based on complexity and features
      const baseTime = config.complexity === 'simple' ? 1000 : 
                      config.complexity === 'moderate' ? 1500 : 2000;
      const additionalTime = (config.includeWritingSystem ? 500 : 0) +
                           (config.includeCulturalContext ? 500 : 0) +
                           (config.generateSampleTexts ? 300 : 0);
      
      await new Promise(resolve => setTimeout(resolve, baseTime + additionalTime));
      
      // Generate base conlang
      const generator = new ConlangGenerator(config);
      const baseResult = generator.generate();
      
      // Generate advanced features
      const advancedGenerator = new AdvancedConlangGenerator(config, baseResult);
      const result: GeneratedConlang = {
        ...baseResult,
        writingSystem: config.includeWritingSystem ? advancedGenerator.generateWritingSystem() : undefined,
        culturalContext: config.includeCulturalContext ? advancedGenerator.generateCulturalContext() : undefined,
        sampleTexts: config.generateSampleTexts ? advancedGenerator.generateSampleTexts() : undefined,
        etymology: config.includeAdvancedPhonetics ? advancedGenerator.generateEtymologies() : undefined,
      };
      
      setGeneratedConlang(result);
      showSuccess(`${config.name} has been generated successfully with all requested features!`);
    } catch (error) {
      showError('Failed to generate language. Please try again.');
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!generatedConlang) return;
    
    const exportData = {
      ...generatedConlang,
      generatedAt: new Date().toISOString(),
      config: config,
      version: '2.0',
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedConlang.name.toLowerCase().replace(/\s+/g, '-')}-conlang-v2.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Complete language data exported successfully!');
  };

  const handleShare = async () => {
    if (!generatedConlang) return;
    
    const features = [];
    if (generatedConlang.writingSystem) features.push('writing system');
    if (generatedConlang.culturalContext) features.push('cultural context');
    if (generatedConlang.sampleTexts) features.push('sample texts');
    
    const shareText = `Check out my constructed language "${generatedConlang.name}"! ${generatedConlang.description}${features.length > 0 ? ` Complete with ${features.join(', ')}.` : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${generatedConlang.name} - Advanced Constructed Language`,
          text: shareText,
          url: window.location.href,
        });
        showSuccess('Language shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showSuccess('Language description copied to clipboard!');
      } catch (error) {
        showError('Failed to copy to clipboard');
      }
    }
  };

  const canGenerate = selectedLanguages.length >= 2 && config.name.trim().length > 0;

  // Generate learning modules if conlang exists
  const learningModules = generatedConlang ? 
    new AdvancedConlangGenerator(config, generatedConlang).generateLearningModules() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Languages className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Advanced Conlang Generator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create sophisticated constructed languages with writing systems, cultural context, etymology, and interactive learning modules.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="xl:col-span-2 space-y-6">
            <Tabs defaultValue="languages" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="basic">Basic Config</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="languages" className="space-y-4">
                <LanguageSelector
                  selectedLanguages={selectedLanguages}
                  onLanguageToggle={handleLanguageToggle}
                />
              </TabsContent>

              <TabsContent value="basic" className="space-y-4">
                <ConlangConfigComponent
                  config={config}
                  onConfigChange={setConfig}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <AdvancedConfig
                  config={config}
                  onConfigChange={setConfig}
                />
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <LanguageStatistics selectedLanguages={selectedLanguages} />
              </TabsContent>
            </Tabs>

            {/* Generation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Language</span>
                </CardTitle>
                <CardDescription>
                  Create your constructed language with all selected features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLanguages.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selected {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''} 
                      ({config.complexity} complexity, {config.purpose} purpose).
                      {selectedLanguages.length < 2 && ' Select at least 2 languages to generate.'}
                      {config.includeWritingSystem && ' Writing system enabled.'}
                      {config.includeCulturalContext && ' Cultural context enabled.'}
                      {config.generateSampleTexts && ' Sample texts enabled.'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                    className="flex-1"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate {config.name || 'Language'}
                      </>
                    )}
                  </Button>

                  {generatedConlang && (
                    <>
                      <Button
                        onClick={handleExport}
                        variant="outline"
                        size="lg"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleShare}
                        variant="outline"
                        size="lg"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {generatedConlang ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="learn">Learn</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <ConlangDisplay conlang={generatedConlang} />
                  <PhoneticChart inventory={generatedConlang.phoneticInventory} />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  {generatedConlang.writingSystem && (
                    <WritingSystemDisplay 
                      writingSystem={generatedConlang.writingSystem}
                      sampleText={generatedConlang.sampleTexts?.[0]?.conlang}
                    />
                  )}
                  
                  {generatedConlang.culturalContext && (
                    <CulturalContextDisplay culturalContext={generatedConlang.culturalContext} />
                  )}
                  
                  {generatedConlang.sampleTexts && (
                    <SampleTextsDisplay sampleTexts={generatedConlang.sampleTexts} />
                  )}
                  
                  {generatedConlang.etymology && (
                    <EtymologyDisplay etymologies={generatedConlang.etymology} />
                  )}
                </TabsContent>

                <TabsContent value="learn" className="space-y-4">
                  {learningModules.map((module, index) => (
                    <LearningModule key={module.id} module={module} />
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <CardContent className="text-center space-y-4">
                  <Languages className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-muted-foreground">
                      Your Advanced Language Will Appear Here
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure settings and generate a complete constructed language with writing system, culture, and learning tools
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;