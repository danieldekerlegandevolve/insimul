/**
 * Style Preset Selector Component
 *
 * Allows users to select from pre-defined artistic styles or create custom ones.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Sparkles, Image, Wand2, Check } from 'lucide-react';
import { BUILTIN_STYLE_PRESETS, getStylePresetsByCategory, type StylePreset } from '@shared/style-presets';

interface StylePresetSelectorProps {
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string | null) => void;
  compact?: boolean;
}

export function StylePresetSelector({
  selectedStyleId,
  onStyleSelect,
  compact = false
}: StylePresetSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<StylePreset['category']>('fantasy');

  const categories: Array<{ id: StylePreset['category']; label: string; icon: any }> = [
    { id: 'fantasy', label: 'Fantasy', icon: Wand2 },
    { id: 'scifi', label: 'Sci-Fi', icon: Sparkles },
    { id: 'artistic', label: 'Artistic', icon: Palette },
    { id: 'historical', label: 'Historical', icon: Image },
    { id: 'modern', label: 'Modern', icon: Image },
  ];

  const presetsInCategory = getStylePresetsByCategory(activeCategory);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Style Preset</span>
          {selectedStyleId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStyleSelect(null)}
              className="h-6 px-2"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BUILTIN_STYLE_PRESETS.slice(0, 6).map((preset) => (
            <Card
              key={preset.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedStyleId === preset.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onStyleSelect(preset.id)}
            >
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium">{preset.name}</CardTitle>
                  {selectedStyleId === preset.id && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {/* Open full selector modal */}}
        >
          View All Styles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Style Presets
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose an artistic style for consistent generation
          </p>
        </div>
        {selectedStyleId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStyleSelect(null)}
          >
            Clear Style
          </Button>
        )}
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as StylePreset['category'])}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                <Icon className="h-3 w-3 mr-1" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid md:grid-cols-2 gap-3">
                {presetsInCategory.map((preset) => {
                  const isSelected = selectedStyleId === preset.id;

                  return (
                    <Card
                      key={preset.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                      }`}
                      onClick={() => onStyleSelect(preset.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {preset.name}
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {preset.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Color Palette */}
                        {preset.colorPalette && (
                          <div>
                            <p className="text-xs font-medium mb-2">Color Palette</p>
                            <div className="flex gap-1">
                              {preset.colorPalette.map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-8 h-8 rounded border border-border"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Style Modifiers Preview */}
                        <div>
                          <p className="text-xs font-medium mb-1">Style Keywords</p>
                          <div className="flex flex-wrap gap-1">
                            {preset.styleModifiers.slice(0, 3).map((modifier, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {modifier.split(',')[0]}
                              </Badge>
                            ))}
                            {preset.styleModifiers.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{preset.styleModifiers.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Recommended Provider */}
                        {preset.recommendedProvider && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3" />
                            <span>Best with: {preset.recommendedProvider}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Selected Style Summary */}
      {selectedStyleId && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Selected Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const preset = BUILTIN_STYLE_PRESETS.find(p => p.id === selectedStyleId);
              if (!preset) return null;

              return (
                <div className="space-y-2">
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preset.styleModifiers.map((modifier, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {modifier}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
