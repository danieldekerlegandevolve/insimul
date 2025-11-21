import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneratedConlang } from '@/types/language';
import { FileText, Download, BookOpen, Globe, Users, Zap, Volume2, PenTool } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface LanguageDocumentationProps {
  conlang: GeneratedConlang;
}

const LanguageDocumentation: React.FC<LanguageDocumentationProps> = ({ conlang }) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html' | 'latex' | 'markdown'>('pdf');

  const generateDocumentation = () => {
    const doc = createDocumentationContent();
    downloadDocumentation(doc, selectedFormat);
  };

  const createDocumentationContent = () => {
    return {
      title: `${conlang.name}: A Comprehensive Grammar`,
      sections: [
        {
          title: 'Introduction',
          content: generateIntroduction()
        },
        {
          title: 'Phonology',
          content: generatePhonologySection()
        },
        {
          title: 'Morphology',
          content: generateMorphologySection()
        },
        {
          title: 'Syntax',
          content: generateSyntaxSection()
        },
        {
          title: 'Lexicon',
          content: generateLexiconSection()
        },
        {
          title: 'Writing System',
          content: generateWritingSystemSection()
        },
        {
          title: 'Cultural Context',
          content: generateCulturalSection()
        },
        {
          title: 'Sample Texts',
          content: generateSampleTextsSection()
        }
      ]
    };
  };

  const generateIntroduction = () => {
    return `
# Introduction to ${conlang.name}

${conlang.description}

## Typological Overview

${conlang.name} is a ${conlang.features.agglutinative ? 'agglutinative' : 
  conlang.features.fusional ? 'fusional' : 'isolating'} language with ${conlang.features.wordOrder} word order.

### Key Features:
${conlang.uniqueFeatures.map(feature => `- ${feature}`).join('\n')}

## Genetic Classification

${conlang.name} belongs to the constructed ${conlang.name}ic language family, created for ${conlang.complexity} linguistic complexity.

## Geographic Distribution

${conlang.culturalContext ? `Spoken in the ${conlang.culturalContext.region} by approximately ${conlang.culturalContext.speakers.toLocaleString()} speakers.` : 'Geographic distribution varies by implementation context.'}
    `;
  };

  const generatePhonologySection = () => {
    return `
# Phonology

## Consonant Inventory

${conlang.name} has ${conlang.phonemes.consonants.length} consonant phonemes:

${Object.entries(conlang.phoneticInventory.consonantChart).map(([category, sounds]) => 
  `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n${sounds.join(', ')}`
).join('\n\n')}

## Vowel Inventory

The language has ${conlang.phonemes.vowels.length} vowel phonemes:

${Object.entries(conlang.phoneticInventory.vowelChart).map(([category, sounds]) => 
  `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n${sounds.join(', ')}`
).join('\n\n')}

## Phonotactics

${conlang.phoneticInventory.phonotactics.map(rule => `- ${rule}`).join('\n')}

${conlang.features.hasTones ? `
## Tone System

${conlang.name} is a tonal language with the following tones:
${conlang.phonemes.tones?.map(tone => `- ${tone}`).join('\n') || ''}
` : ''}
    `;
  };

  const generateMorphologySection = () => {
    return `
# Morphology

## Word Formation

${conlang.name} employs ${conlang.features.agglutinative ? 'agglutinative' : 
  conlang.features.fusional ? 'fusional' : 'isolating'} morphology.

${conlang.grammar.wordFormation ? `
### Word Formation Processes:
${conlang.grammar.wordFormation.map(process => `- ${process}`).join('\n')}
` : ''}

## Nominal Morphology

${conlang.features.hasGender && conlang.grammar.genders ? `
### Gender System
${conlang.name} has ${conlang.grammar.genders.length} grammatical genders:
${conlang.grammar.genders.map(gender => `- ${gender}`).join('\n')}
` : ''}

${conlang.features.hasCase && conlang.grammar.nounCases ? `
### Case System
The language has ${conlang.grammar.nounCases.length} cases:
${conlang.grammar.nounCases.map(case_ => `- ${case_}`).join('\n')}
` : ''}

### Pluralization
${conlang.grammar.pluralization}

## Verbal Morphology

### Tense System
${conlang.grammar.verbTenses.map(tense => `- ${tense}`).join('\n')}

${conlang.grammar.verbAgreement ? `
### Agreement
${conlang.grammar.verbAgreement.map(agreement => `- ${agreement}`).join('\n')}
` : ''}
    `;
  };

  const generateSyntaxSection = () => {
    return `
# Syntax

## Basic Word Order

${conlang.name} follows ${conlang.features.wordOrder} word order.

${conlang.grammar.syntaxRules ? `
## Syntactic Rules

${conlang.grammar.syntaxRules.map(rule => `- ${rule}`).join('\n')}
` : ''}

${conlang.grammar.questionFormation ? `
## Question Formation

${conlang.grammar.questionFormation}
` : ''}

${conlang.grammar.alignment ? `
## Morphosyntactic Alignment

${conlang.name} exhibits ${conlang.grammar.alignment} alignment.
` : ''}
    `;
  };

  const generateLexiconSection = () => {
    return `
# Lexicon

## Core Vocabulary

${Object.entries(conlang.sampleWords).map(([english, conlang_word]) => 
  `**${english}**: ${conlang_word}`
).join('\n')}

${conlang.etymology ? `
## Etymology

Selected etymologies:

${conlang.etymology.slice(0, 5).map(etym => `
### ${etym.word} "${etym.meaning}"
- Origin: ${etym.origin}
- Evolution: ${etym.evolution.join(' > ')}
${etym.cognates ? `- Cognates: ${Object.entries(etym.cognates).map(([lang, word]) => `${lang}: ${word}`).join(', ')}` : ''}
`).join('\n')}
` : ''}
    `;
  };

  const generateWritingSystemSection = () => {
    if (!conlang.writingSystem) return '# Writing System\n\nNo writing system specified.';
    
    return `
# Writing System

## Script Type

${conlang.name} uses a ${conlang.writingSystem.type} writing system.

## Writing Direction

Text is written ${conlang.writingSystem.direction === 'ltr' ? 'left-to-right' : 
  conlang.writingSystem.direction === 'rtl' ? 'right-to-left' : 
  conlang.writingSystem.direction === 'ttb' ? 'top-to-bottom' : 'in boustrophedon style'}.

## Character Set

The writing system includes ${conlang.writingSystem.characters?.length || 0} characters.

${conlang.writingSystem.specialFeatures ? `
## Special Features

${conlang.writingSystem.specialFeatures.map(feature => `- ${feature}`).join('\n')}
` : ''}

## Numerals

${conlang.writingSystem.numerals?.join(', ') || 'Standard numerals'}
    `;
  };

  const generateCulturalSection = () => {
    if (!conlang.culturalContext) return '# Cultural Context\n\nNo cultural context specified.';
    
    return `
# Cultural Context

## Geographic Setting

${conlang.culturalContext.region}

### Geographic Features
${conlang.culturalContext.geographicalFeatures?.map(feature => `- ${feature}`).join('\n') || ''}

## Demographics

- **Speakers**: ${conlang.culturalContext.speakers.toLocaleString()}
- **Status**: ${conlang.culturalContext.status}

${conlang.culturalContext.historicalPeriod ? `
## Historical Period

${conlang.culturalContext.historicalPeriod}
` : ''}

${conlang.culturalContext.socialStructure ? `
## Social Structure

${conlang.culturalContext.socialStructure}
` : ''}

${conlang.culturalContext.culturalNotes ? `
## Cultural Notes

${conlang.culturalContext.culturalNotes.map(note => `- ${note}`).join('\n')}
` : ''}
    `;
  };

  const generateSampleTextsSection = () => {
    if (!conlang.sampleTexts) return '# Sample Texts\n\nNo sample texts available.';
    
    return `
# Sample Texts

${conlang.sampleTexts.map(text => `
## ${text.type.charAt(0).toUpperCase() + text.type.slice(1)}

**${conlang.name}**: ${text.conlang}

${text.transliteration ? `**Transliteration**: ${text.transliteration}` : ''}

**English**: ${text.english}

${text.grammaticalAnalysis ? `
**Analysis**: ${text.grammaticalAnalysis.join('; ')}
` : ''}
`).join('\n')}
    `;
  };

  const downloadDocumentation = (doc: any, format: string) => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'markdown':
        content = generateMarkdown(doc);
        filename = `${conlang.name.toLowerCase().replace(/\s+/g, '-')}-grammar.md`;
        mimeType = 'text/markdown';
        break;
      case 'html':
        content = generateHTML(doc);
        filename = `${conlang.name.toLowerCase().replace(/\s+/g, '-')}-grammar.html`;
        mimeType = 'text/html';
        break;
      case 'latex':
        content = generateLaTeX(doc);
        filename = `${conlang.name.toLowerCase().replace(/\s+/g, '-')}-grammar.tex`;
        mimeType = 'text/plain';
        break;
      default:
        content = generateMarkdown(doc);
        filename = `${conlang.name.toLowerCase().replace(/\s+/g, '-')}-grammar.md`;
        mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess(`Documentation exported as ${format.toUpperCase()}`);
  };

  const generateMarkdown = (doc: any) => {
    return `# ${doc.title}\n\n${doc.sections.map((section: any) => section.content).join('\n\n')}`;
  };

  const generateHTML = (doc: any) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title}</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        .phoneme { font-family: 'Charis SIL', 'Doulos SIL', serif; }
    </style>
</head>
<body>
    <h1>${doc.title}</h1>
    ${doc.sections.map((section: any) => `<div>${section.content.replace(/^# /gm, '<h1>').replace(/^## /gm, '<h2>').replace(/^### /gm, '<h3>').replace(/\n/g, '<br>')}</div>`).join('')}
</body>
</html>
    `;
  };

  const generateLaTeX = (doc: any) => {
    return `
\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{tipa}
\\usepackage{booktabs}
\\usepackage{longtable}
\\title{${doc.title}}
\\author{Conlang Generator}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

${doc.sections.map((section: any) => 
  section.content
    .replace(/^# /gm, '\\section{')
    .replace(/^## /gm, '\\subsection{')
    .replace(/^### /gm, '\\subsubsection{')
    .replace(/\n/g, '\n\n')
).join('\n\n')}

\\end{document}
    `;
  };

  const getDocumentationStats = () => {
    const stats = {
      phonemes: conlang.phonemes.consonants.length + conlang.phonemes.vowels.length,
      vocabulary: Object.keys(conlang.sampleWords).length,
      grammar_rules: conlang.rules.length,
      sample_texts: conlang.sampleTexts?.length || 0,
      unique_features: conlang.uniqueFeatures.length,
      pages_estimated: Math.ceil((
        conlang.rules.length * 0.5 +
        Object.keys(conlang.sampleWords).length * 0.1 +
        (conlang.sampleTexts?.length || 0) * 0.3 +
        conlang.uniqueFeatures.length * 0.2
      ))
    };
    return stats;
  };

  const stats = getDocumentationStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Language Documentation</span>
        </CardTitle>
        <CardDescription>
          Generate comprehensive linguistic documentation for {conlang.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contents">Contents</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.phonemes}</div>
                <div className="text-sm text-muted-foreground">Phonemes</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.vocabulary}</div>
                <div className="text-sm text-muted-foreground">Vocabulary Items</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.grammar_rules}</div>
                <div className="text-sm text-muted-foreground">Grammar Rules</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.sample_texts}</div>
                <div className="text-sm text-muted-foreground">Sample Texts</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.unique_features}</div>
                <div className="text-sm text-muted-foreground">Unique Features</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">~{stats.pages_estimated}</div>
                <div className="text-sm text-muted-foreground">Est. Pages</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Documentation Features:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">Complete phonological analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm">Morphological processes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm">Syntactic structures</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm">Cultural context</span>
                </div>
                {conlang.writingSystem && (
                  <div className="flex items-center space-x-2">
                    <PenTool className="h-4 w-4 text-primary" />
                    <span className="text-sm">Writing system</span>
                  </div>
                )}
                {conlang.etymology && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">Etymology & cognates</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contents" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Table of Contents:</h4>
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <div className="flex justify-between items-center">
                  <span>1. Introduction</span>
                  <Badge variant="outline">Overview</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>2. Phonology</span>
                  <Badge variant="outline">{stats.phonemes} phonemes</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>3. Morphology</span>
                  <Badge variant="outline">Word formation</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>4. Syntax</span>
                  <Badge variant="outline">{conlang.features.wordOrder} order</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>5. Lexicon</span>
                  <Badge variant="outline">{stats.vocabulary} entries</Badge>
                </div>
                {conlang.writingSystem && (
                  <div className="flex justify-between items-center">
                    <span>6. Writing System</span>
                    <Badge variant="outline">{conlang.writingSystem.type}</Badge>
                  </div>
                )}
                {conlang.culturalContext && (
                  <div className="flex justify-between items-center">
                    <span>7. Cultural Context</span>
                    <Badge variant="outline">{conlang.culturalContext.region}</Badge>
                  </div>
                )}
                {conlang.sampleTexts && (
                  <div className="flex justify-between items-center">
                    <span>8. Sample Texts</span>
                    <Badge variant="outline">{stats.sample_texts} texts</Badge>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Export Format:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['markdown', 'html', 'latex', 'pdf'] as const).map(format => (
                    <Button
                      key={format}
                      variant={selectedFormat === format ? 'default' : 'outline'}
                      onClick={() => setSelectedFormat(format)}
                      className="capitalize"
                    >
                      {format}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Export Details:</h5>
                <div className="text-sm space-y-1">
                  <p><strong>Format:</strong> {selectedFormat.toUpperCase()}</p>
                  <p><strong>Estimated size:</strong> ~{stats.pages_estimated} pages</p>
                  <p><strong>Includes:</strong> Complete grammar, phonology, lexicon, and cultural notes</p>
                  {selectedFormat === 'latex' && (
                    <p className="text-muted-foreground">LaTeX format requires compilation with XeLaTeX or LuaLaTeX for IPA symbols</p>
                  )}
                </div>
              </div>

              <Button onClick={generateDocumentation} className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Generate Documentation ({selectedFormat.toUpperCase()})
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LanguageDocumentation;