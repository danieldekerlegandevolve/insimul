import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { languages } from '@/data/languages';
import { Language } from '@/types/language';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguageToggle: (languageId: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onLanguageToggle,
}) => {
  const groupedLanguages = languages.reduce((acc, lang) => {
    if (!acc[lang.family]) {
      acc[lang.family] = [];
    }
    acc[lang.family].push(lang);
    return acc;
  }, {} as Record<string, Language[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Base Languages</CardTitle>
        <CardDescription>
          Choose 2-4 languages to influence your constructed language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedLanguages).map(([family, langs]) => (
          <div key={family} className="space-y-3">
            <h3 className="font-semibold text-lg">{family} Family</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {langs.map((lang) => (
                <div
                  key={lang.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedLanguages.includes(lang.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onLanguageToggle(lang.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedLanguages.includes(lang.id)}
                      onChange={() => onLanguageToggle(lang.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium">{lang.name}</h4>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {lang.features.wordOrder}
                        </Badge>
                        {lang.features.hasGender && (
                          <Badge variant="outline" className="text-xs">
                            Gender
                          </Badge>
                        )}
                        {lang.features.hasCase && (
                          <Badge variant="outline" className="text-xs">
                            Cases
                          </Badge>
                        )}
                        {lang.features.hasTones && (
                          <Badge variant="outline" className="text-xs">
                            Tonal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LanguageSelector;