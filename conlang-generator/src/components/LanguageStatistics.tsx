import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { languages } from '@/data/languages';
import { BarChart3, Globe, Users } from 'lucide-react';

interface LanguageStatisticsProps {
  selectedLanguages: string[];
}

const LanguageStatistics: React.FC<LanguageStatisticsProps> = ({ selectedLanguages }) => {
  const familyDistribution = languages.reduce((acc, lang) => {
    acc[lang.family] = (acc[lang.family] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const selectedFamilies = languages
    .filter(lang => selectedLanguages.includes(lang.id))
    .map(lang => lang.family);

  const uniqueSelectedFamilies = [...new Set(selectedFamilies)];

  const featureAnalysis = {
    tonal: languages.filter(lang => selectedLanguages.includes(lang.id) && lang.features.hasTones).length,
    gendered: languages.filter(lang => selectedLanguages.includes(lang.id) && lang.features.hasGender).length,
    cased: languages.filter(lang => selectedLanguages.includes(lang.id) && lang.features.hasCase).length,
    agglutinative: languages.filter(lang => selectedLanguages.includes(lang.id) && lang.features.agglutinative).length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Language Analysis</span>
        </CardTitle>
        <CardDescription>
          Statistical overview of your selected languages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{selectedLanguages.length}</div>
            <div className="text-sm text-muted-foreground">Selected Languages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{uniqueSelectedFamilies.length}</div>
            <div className="text-sm text-muted-foreground">Language Families</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{languages.length}</div>
            <div className="text-sm text-muted-foreground">Total Available</div>
          </div>
        </div>

        {selectedLanguages.length > 0 && (
          <>
            <div className="space-y-3">
              <h4 className="font-medium flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Selected Families</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {uniqueSelectedFamilies.map(family => (
                  <Badge key={family} variant="secondary">
                    {family}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Feature Distribution</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tonal Languages</span>
                  <span className="text-sm text-muted-foreground">
                    {featureAnalysis.tonal}/{selectedLanguages.length}
                  </span>
                </div>
                <Progress value={(featureAnalysis.tonal / selectedLanguages.length) * 100} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gendered Languages</span>
                  <span className="text-sm text-muted-foreground">
                    {featureAnalysis.gendered}/{selectedLanguages.length}
                  </span>
                </div>
                <Progress value={(featureAnalysis.gendered / selectedLanguages.length) * 100} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Case Systems</span>
                  <span className="text-sm text-muted-foreground">
                    {featureAnalysis.cased}/{selectedLanguages.length}
                  </span>
                </div>
                <Progress value={(featureAnalysis.cased / selectedLanguages.length) * 100} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Agglutinative</span>
                  <span className="text-sm text-muted-foreground">
                    {featureAnalysis.agglutinative}/{selectedLanguages.length}
                  </span>
                </div>
                <Progress value={(featureAnalysis.agglutinative / selectedLanguages.length) * 100} className="h-2" />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LanguageStatistics;