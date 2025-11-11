import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Play, FileText, Users, Globe, Cog, BarChart3, BookOpen, Download, Upload, Trash2, Edit3, Sparkles, Check, X, Plus, Info, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SimulationConfigDialog } from "@/components/SimulationConfigDialog";
import { WorldCreateDialog } from "@/components/WorldCreateDialog";
import { CharacterCreateDialog } from "@/components/CharacterCreateDialog";
import { ActionCreateDialog } from "@/components/ActionCreateDialog";
import { SimulationCreateDialog } from "@/components/SimulationCreateDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { ImportDialog } from "@/components/ImportDialog";
import { WorldDetailsDialog } from "@/components/WorldDetailsDialog";
import { RuleCreateDialog } from "@/components/RuleCreateDialog";
import { CharacterEditDialog } from "@/components/CharacterEditDialog";
import { CharacterChatDialog } from "@/components/CharacterChatDialog";
import { TruthTab } from "@/components/TruthTab";
import { QuestsTab } from "@/components/QuestsTab";
import { HierarchicalLocationsTab } from "@/components/HierarchicalLocationsTab";
import { InsimulRuleCompiler } from "@/lib/unified-syntax";
import { RuleExporter } from "@/lib/rule-exporter";
import type { InsertWorld, InsertCharacter, InsertSimulation } from "@shared/schema";

const SYNTAX_EXAMPLES = {
  insimul: `// Insimul Syntax - Noble Succession
rule noble_succession {
  when (
    Person(?heir) and
    Noble(?lord) and
    parent_of(?lord, ?heir) and
    eldest_child(?heir) and
    dies(?lord)
  )
  then {
    inherit_title(?heir, ?lord.title)
    create_succession_event(?heir)
    tracery_generate("succession_ceremony", {heir: ?heir.name})
  }
  priority: 9
  tags: [nobility, inheritance]
}

tracery succession_ceremony {
  "origin": ["#heir# is crowned the new ruler of #realm#."],
  "realm": ["Aldermere", "the Northern Reaches"]
}`,

  ensemble: `// Ensemble Social Rules
rule rivalry_formation {
    when (Person(?person1) and
          Person(?person2) and
          conflict_of_interest(?person1, ?person2) and
          public_confrontation(?person1, ?person2))
    then {
        create_rivalry(?person1, ?person2)
        reduce_reputation(?person1, 1)
        increase_tension(?person1, ?person2, 3)
    }
}`,

  kismet: `% Kismet Social Traits
default trait nobles_prefer_luxury(>Self, @Location):
    +++@if Self is noble of Location, Location has luxury@.
    likelihood: 0.9

default trait romantic_attraction(>Self, <Other):
    +++(romance if Self attracted_to Other, Other.charisma >= 7).

marriage_suitable(Person1, Person2) :- 
    age_appropriate(Person1, Person2),
    social_class_compatible(Person1, Person2).`
};

interface World {
  id: string;
  name: string;
  description: string | null;
  sourceFormats: string[] | null;
  config: Record<string, any> | null;
  population: number | null;
  currentYear: number | null;
  foundedYear: number | null;
  governmentType: string | null;
  economicSystem: string | null;
  socialStructure: Record<string, any> | null;
  culturalValues: Record<string, any> | null;
  locations: any[] | null;
  genealogies: Record<string, any> | null;
  generationConfig: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

// Rule interface - represents individual rules in the database
interface Rule {
  id: string;
  name: string;
  path: string;
  content: string;
  sourceFormat: string;
  worldId: string;
}

interface Character {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  occupation?: string | null;
  worldId: string;
}

interface Action {
  id: string;
  name: string;
  description: string | null;
  actionType: string;
  category: string | null;
  duration: number | null;
  difficulty: number | null;
  energyCost: number | null;
  worldId: string;
  targetType: string | null;
  requiresTarget: boolean | null;
  range: number | null;
  cooldown: number | null;
  verbPast: string | null;
  verbPresent: string | null;
  tags: string[] | null;
  effects: any[] | null;
  prerequisites: any[] | null;
}

interface Simulation {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  worldId: string;
  results?: any;
}

export default function UnifiedEditor() {
  const [selectedWorld, setSelectedWorld] = useState<string>('');
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [aiEditInstructions, setAiEditInstructions] = useState<string>('');
  const [showAiEditor, setShowAiEditor] = useState<boolean>(false);
  const [activeRule, setActiveRule] = useState<Rule | null>(null);
  const [ruleContent, setRuleContent] = useState('');
  const [sourceFormat, setSystemType] = useState<string>('insimul');
  const [activeTab, setActiveTab] = useState('editor');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [worldDetailsOpen, setWorldDetailsOpen] = useState(false);
  const [ruleCreateDialogOpen, setRuleCreateDialogOpen] = useState(false);
  const [characterEditDialogOpen, setCharacterEditDialogOpen] = useState(false);
  const [characterChatDialogOpen, setCharacterChatDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [chatCharacter, setChatCharacter] = useState<any>(null);
  const [includeCharactersDefault, setIncludeCharactersDefault] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const ruleCompiler = new InsimulRuleCompiler();
  const ruleExporter = new RuleExporter();
  
  // Refs to track whether we're loading a file vs user changing system type
  const isLoadingFileRef = useRef(false);
  const previousSystemTypeRef = useRef<string>(sourceFormat);

  // Queries - now world-centric
  const { data: worlds = [] } = useQuery<World[]>({
    queryKey: ['/api/worlds'],
  });

  const { data: rules = [] } = useQuery<Rule[]>({
    queryKey: ['/api/worlds', selectedWorld, 'rules'],
    enabled: !!selectedWorld,
  });

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['/api/worlds', selectedWorld, 'characters'],
    enabled: !!selectedWorld,
  });

  const { data: actions = [] } = useQuery<Action[]>({
    queryKey: ['/api/worlds', selectedWorld, 'actions'],
    enabled: !!selectedWorld,
  });

  const { data: simulations = [] } = useQuery<Simulation[]>({
    queryKey: ['/api/worlds', selectedWorld, 'simulations'],
    enabled: !!selectedWorld,
  });

  const { data: truths = [] } = useQuery<any[]>({
    queryKey: ['/api/worlds', selectedWorld, 'truth'],
    enabled: !!selectedWorld,
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      path: string; 
      content: string; 
      sourceFormat: string; 
      worldId: string;
      ruleType: string;
      priority: number;
      likelihood: number;
      conditions: any[];
      effects: any[];
      tags: string[];
      dependencies: string[];
      isActive: boolean;
      isCompiled: boolean;
      compiledOutput: Record<string, any>;
    }) => {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create rule');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'rules'] });
      toast({ title: "Rule created successfully" });
      setRuleCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating rule",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async (data: { id: string; content?: string; name?: string; sourceFormat?: string }) => {
      const response = await fetch(`/api/rules/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (updatedRule, variables) => {
      // Update activeRule if it's the rule being saved
      if (activeRule && activeRule.id === variables.id) {
        setActiveRule({
          ...activeRule,
          content: variables.content || activeRule.content,
          name: variables.name || activeRule.name,
          sourceFormat: variables.sourceFormat || activeRule.sourceFormat,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'rules'] });
      toast({ title: "Rule updated successfully" });
      setEditingRule(null);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete rule');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'rules'] });
      toast({ title: "Rule deleted successfully" });
      setActiveRule(null);
      setRuleContent('');
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting rule",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    },
  });

  const generateRuleMutation = useMutation({
    mutationFn: async (data: { prompt: string; sourceFormat: string; bulkCreate?: boolean; worldId?: string }) => {
      const response = await fetch('/api/generate-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate rule');
      return response.json();
    },
    onSuccess: (data, variables) => {
      const generatedRule = data.rule;
      const isBulk = data.isBulk || false;
      
      // If worldId is passed, create a new rule file (for dialog-based creation)
      if (variables.worldId) {
        const fileName = `ai_generated_${Date.now()}.${variables.sourceFormat === 'insimul' ? 'insimul' : variables.sourceFormat}`;
        createRuleMutation.mutate({
          name: fileName,
          path: `Rules/${fileName}`,
          content: generatedRule,
          sourceFormat: variables.sourceFormat,
          worldId: variables.worldId,
          ruleType: 'trigger',
          priority: 5,
          likelihood: 1.0,
          conditions: [],
          effects: [],
          tags: [],
          dependencies: [],
          isActive: true,
          isCompiled: false,
          compiledOutput: {},
        });
        toast({ title: isBulk ? "Rules generated successfully" : "Rule generated successfully" });
      } else {
        // Otherwise append to current editor (legacy behavior for inline generation)
        setRuleContent(prev => prev + '\n\n' + generatedRule);
        toast({ title: "Rule generated successfully" });
      }
      // AI generation completed
    },
    onError: (error) => {
      toast({ 
        title: "Error generating rule", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  });

  // Creation mutations
  const createWorldMutation = useMutation({
    mutationFn: async (data: InsertWorld) => {
      const response = await apiRequest('POST', '/api/worlds', data);
      return await response.json();
    },
    onSuccess: (newWorld) => {
      queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
      setSelectedWorld(newWorld.id);
      toast({
        title: "World created",
        description: `${newWorld.name} has been created successfully.`,
      });
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const response = await apiRequest('POST', `/api/worlds/${selectedWorld}/characters`, data);
      return await response.json();
    },
    onSuccess: () => {
      console.log('Character created, invalidating cache for world:', selectedWorld);
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'characters'] });
      // Also invalidate the world query to update counts
      queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
      toast({
        title: "Character created",
        description: "New character has been created successfully.",
      });
    },
  });

  const createActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/worlds/${selectedWorld}/actions`, data);
      return await response.json();
    },
    onSuccess: () => {
      console.log('Action created, invalidating cache for world:', selectedWorld);
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
      toast({
        title: "Action created",
        description: "New action has been created successfully.",
      });
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete action');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'actions'] });
      toast({ title: "Action deleted successfully" });
    },
  });

  const createSimulationMutation = useMutation({
    mutationFn: async (data: InsertSimulation) => {
      const response = await apiRequest('POST', `/api/worlds/${selectedWorld}/simulations`, data);
      return await response.json();
    },
    onSuccess: () => {
      console.log('Simulation created, invalidating cache for world:', selectedWorld);
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'simulations'] });
      // Also invalidate the world query to update counts
      queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
      toast({
        title: "Simulation created",
        description: "New simulation has been created successfully.",
      });
    },
  });

  const validateRulesMutation = useMutation({
    mutationFn: async (data: { content: string; sourceFormat: string }) => {
      const response = await fetch('/api/rules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      const messages = [];
      if (data.errors?.length > 0) {
        messages.push(`❌ ${data.errors.length} error(s)`);
      }
      if (data.warnings?.length > 0) {
        messages.push(`⚠️ ${data.warnings.length} warning(s)`);
      }
      if (data.suggestions?.length > 0) {
        messages.push(`💡 ${data.suggestions.length} suggestion(s)`);
      }
      
      if (data.isValid && data.warnings?.length === 0 && data.suggestions?.length === 0) {
        toast({ 
          title: "✓ Rules are valid", 
          description: "No errors, warnings, or suggestions"
        });
      } else if (data.isValid) {
        toast({ 
          title: "✓ Rules are valid", 
          description: messages.join(' • ')
        });
      } else {
        toast({ 
          title: "Validation issues found", 
          description: messages.join(' • '),
          variant: "destructive" 
        });
      }
      
      // Log details to console for developers
      if (data.errors?.length > 0) {
        console.log('Validation Errors:', data.errors);
      }
      if (data.warnings?.length > 0) {
        console.log('Validation Warnings:', data.warnings);
      }
      if (data.suggestions?.length > 0) {
        console.log('Validation Suggestions:', data.suggestions);
      }
    },
  });

  const runSimulationMutation = useMutation({
    mutationFn: async ({ simulationId, config }: { simulationId: string; config?: any }) => {
      const response = await fetch(`/api/simulations/${simulationId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config || {}),
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const speedText = variables.config?.executionSpeed === 'fast' ? 'quickly' :
                       variables.config?.executionSpeed === 'detailed' ? 'with detailed analysis' : '';
      toast({ 
        title: "Simulation completed", 
        description: `Executed ${speedText} - check the Results tab for detailed breakdown` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'simulations'] });
    },
  });

  useEffect(() => {
    if (worlds.length > 0 && !selectedWorld) {
      setSelectedWorld(worlds[0].id);
    }
  }, [worlds, selectedWorld]);

  useEffect(() => {
    // Debug test functions (development only)
    if (import.meta.env.DEV) {
      (window as any).testEnsembleKismet = () => {
        try {
          console.log('🔄 Testing Ensemble ↔ Kismet conversion...');
          const ensembleContent = ruleContent;
          const ensembleRules = ruleCompiler.compile(ensembleContent, 'ensemble');
          const kismetContent = ruleExporter.exportToFormat(ensembleRules, 'kismet', false, []);
          const kismetRules = ruleCompiler.compile(kismetContent, 'kismet');
          const success = ensembleRules.length > 0 && kismetRules.length > 0;
          console.log(success ? '✅ Ensemble ↔ Kismet conversion successful!' : '❌ Ensemble ↔ Kismet conversion failed!');
          return { success, original_rules: ensembleRules.length, kismet_rules: kismetRules.length };
        } catch (error) {
          console.error('❌ Ensemble ↔ Kismet test failed:', error);
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      };

      (window as any).testInsimulEnsemble = () => {
        try {
          console.log('🔄 Testing Insimul ↔ Ensemble conversion...');
          
          // Get current content and determine starting format
          const content = ruleContent;
          const isInsimul = activeRule?.name.includes('.insimul') || false;
          const isEnsemble = activeRule?.name.includes('.ens') || false;
          
          if (isInsimul) {
            // Test: Insimul → Ensemble → Insimul
            console.log('📄 Starting with Insimul format');
            console.log('🔍 Step 1: Parsing Insimul content...');
            const insimulRules = ruleCompiler.compile(content, 'insimul');
            console.log('📊 Parsed Insimul rules:', insimulRules.length, 'rules found');
            insimulRules.forEach((rule, i) => {
              console.log(`  Rule ${i}: ${rule.name} (type: ${rule.ruleType}, likelihood: ${rule.likelihood || 'none'})`);
            });
            
            console.log('🔄 Step 2: Exporting to Ensemble...');
            const ensembleContent = ruleExporter.exportToFormat(insimulRules, 'ensemble', false, []);
            console.log('📄 Generated Ensemble content length:', ensembleContent.length);
            
            console.log('🔍 Step 3: Parsing Ensemble content back...');
            const ensembleRules = ruleCompiler.compile(ensembleContent, 'ensemble');
            console.log('📊 Parsed Ensemble rules:', ensembleRules.length, 'rules found');
            ensembleRules.forEach((rule, i) => {
              console.log(`  Rule ${i}: ${rule.name} (type: ${rule.ruleType}, likelihood: ${rule.likelihood || 'none'})`);
            });
            
            console.log('🔄 Step 4: Exporting back to Insimul...');
            const finalInsimulContent = ruleExporter.exportToFormat(ensembleRules, 'insimul', false, []);
            console.log('📄 Final Insimul content length:', finalInsimulContent.length);
            
            const success = insimulRules.length > 0 && ensembleRules.length > 0 && 
                           insimulRules.length === ensembleRules.length;
            console.log(success ? '✅ Insimul ↔ Ensemble conversion successful!' : '❌ Insimul ↔ Ensemble conversion failed!');
            
            return {
              success,
              original_rules: insimulRules.length,
              ensemble_rules: ensembleRules.length,
              ensemble_content: ensembleContent.substring(0, 500) + '...',
              final_content: finalInsimulContent.substring(0, 500) + '...'
            };
            
          } else if (isEnsemble) {
            // Test: Ensemble → Insimul → Ensemble
            console.log('📄 Starting with Ensemble format');
            console.log('🔍 Step 1: Parsing Ensemble content...');
            const ensembleRules = ruleCompiler.compile(content, 'ensemble');
            console.log('📊 Parsed Ensemble rules:', ensembleRules.length, 'rules found');
            ensembleRules.forEach((rule, i) => {
              console.log(`  Rule ${i}: ${rule.name} (type: ${rule.ruleType}, likelihood: ${rule.likelihood || 'none'})`);
            });
            
            console.log('🔄 Step 2: Exporting to Insimul...');
            const insimulContent = ruleExporter.exportToFormat(ensembleRules, 'insimul', false, []);
            console.log('📄 Generated Insimul content length:', insimulContent.length);
            
            console.log('🔍 Step 3: Parsing Insimul content back...');
            const insimulRules = ruleCompiler.compile(insimulContent, 'insimul');
            console.log('📊 Parsed Insimul rules:', insimulRules.length, 'rules found');
            insimulRules.forEach((rule, i) => {
              console.log(`  Rule ${i}: ${rule.name} (type: ${rule.ruleType}, likelihood: ${rule.likelihood || 'none'})`);
            });
            
            console.log('🔄 Step 4: Exporting back to Ensemble...');
            const finalEnsembleContent = ruleExporter.exportToFormat(insimulRules, 'ensemble', false, []);
            console.log('📄 Final Ensemble content length:', finalEnsembleContent.length);
            
            const success = ensembleRules.length > 0 && insimulRules.length > 0 && 
                           ensembleRules.length === insimulRules.length;
            console.log(success ? '✅ Ensemble ↔ Insimul conversion successful!' : '❌ Ensemble ↔ Insimul conversion failed!');
            
            return {
              success,
              original_rules: ensembleRules.length,
              insimul_rules: insimulRules.length,
              insimul_content: insimulContent.substring(0, 500) + '...',
              final_content: finalEnsembleContent.substring(0, 500) + '...'
            };
          } else {
            console.log('❓ File format not recognized as Insimul or Ensemble');
            return { success: false, error: 'File format not recognized' };
          }
          
        } catch (error) {
          console.error('❌ Insimul ↔ Ensemble test failed:', error);
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      };
    }
  }, [ruleCompiler, ruleExporter]);

  useEffect(() => {
    if (activeRule) {
      isLoadingFileRef.current = true;
      setRuleContent(activeRule.content);
      setSystemType(activeRule.sourceFormat);
      previousSystemTypeRef.current = activeRule.sourceFormat;
      // Reset loading flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isLoadingFileRef.current = false;
      }, 100);
    }
  }, [activeRule]);

  // Handle sourceFormat changes and convert rule content
  useEffect(() => {
    // Don't convert if we're loading a file or no active file or sourceFormat hasn't really changed
    if (isLoadingFileRef.current || !activeRule || !ruleContent.trim() || sourceFormat === previousSystemTypeRef.current) {
      previousSystemTypeRef.current = sourceFormat;
      return;
    }

    const convertRuleContent = async () => {
      try {
        // Parse current content using the previous system type
        const parsedRules = ruleCompiler.compile(ruleContent, previousSystemTypeRef.current as any);
        
        if (parsedRules.length === 0) {
          // If no rules could be parsed, show a warning but don't revert
          toast({
            title: "Warning",
            description: `Could not parse existing rules as ${previousSystemTypeRef.current} format. You may need to manually convert the content.`,
            variant: "destructive",
          });
          previousSystemTypeRef.current = sourceFormat;
          return;
        }

        // Convert to new format
        const convertedContent = ruleExporter.exportToFormat(
          parsedRules, 
          sourceFormat as any, 
          false, 
          characters
        );

        // Update content
        setRuleContent(convertedContent);
        
        // Show success notification
        toast({
          title: "Rules converted",
          description: `Successfully converted from ${previousSystemTypeRef.current} to ${sourceFormat} format.`,
        });

        previousSystemTypeRef.current = sourceFormat;
      } catch (error) {
        console.error('Rule conversion failed:', error);
        
        // Revert sourceFormat to previous value
        setSystemType(previousSystemTypeRef.current);
        
        // Show error notification
        toast({
          title: "Conversion failed",
          description: `Could not convert rules from ${previousSystemTypeRef.current} to ${sourceFormat}. ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    };

    convertRuleContent();
  }, [sourceFormat, activeRule, ruleContent, ruleCompiler, ruleExporter, characters, toast]);

  const handleCreateBlankFile = (selectedSystemType: string) => {
    if (!selectedWorld) return;
    
    const fileName = `new_rules_${Date.now()}.${selectedSystemType === 'insimul' ? 'insimul' : selectedSystemType}`;
    const defaultContent = SYNTAX_EXAMPLES[selectedSystemType as keyof typeof SYNTAX_EXAMPLES] || '';
    
    createRuleMutation.mutate({
      name: fileName,
      path: `Rules/${fileName}`,
      content: defaultContent,
      sourceFormat: selectedSystemType,
      worldId: selectedWorld,
      ruleType: 'trigger',
      priority: 5,
      likelihood: 1.0,
      conditions: [],
      effects: [],
      tags: [],
      dependencies: [],
      isActive: true,
      isCompiled: false,
      compiledOutput: {},
    });
  };

  const handleGenerateFileWithAI = (prompt: string, selectedSystemType: string, bulkCreate: boolean) => {
    if (!selectedWorld) return;
    
    setSystemType(selectedSystemType);
    generateRuleMutation.mutate({
      prompt: prompt,
      sourceFormat: selectedSystemType,
      bulkCreate: bulkCreate,
      worldId: selectedWorld,
    });
    // Dialog will close automatically after successful creation
  };

  const handleSaveFile = () => {
    if (!activeRule) return;
    updateRuleMutation.mutate({
      id: activeRule.id,
      content: ruleContent,
      sourceFormat: sourceFormat,
    });
  };

  const handleDeleteRule = (rule: Rule) => {
    if (window.confirm(`Are you sure you want to delete "${rule.name}"?`)) {
      deleteRuleMutation.mutate(rule.id);
    }
  };

  const handleStartEditName = (rule: Rule) => {
    setEditingRule(rule.id);
    setEditName(rule.name);
  };

  const handleSaveEditName = (rule: Rule) => {
    if (editName.trim() && editName !== rule.name) {
      updateRuleMutation.mutate({
        id: rule.id,
        name: editName.trim(),
      });
    } else {
      setEditingRule(null);
    }
  };

  const handleRenameFile = (fileId: string) => {
    if (editName.trim()) {
      updateRuleMutation.mutate({
        id: fileId,
        name: editName.trim(),
      });
      setEditingRule(null);
      setEditName('');
    }
  };

  const handleCancelEditName = () => {
    setEditingRule(null);
    setEditName('');
  };

  const editRuleMutation = useMutation({
    mutationFn: async (data: { currentContent: string; editInstructions: string; sourceFormat: string }) => {
      const response = await fetch('/api/edit-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to edit rule');
      return response.json();
    },
    onSuccess: (data) => {
      const editedRule = data.rule;
      setRuleContent(editedRule);
      toast({ title: "Rule edited successfully", description: "AI has updated your rule" });
      setAiEditInstructions('');
      setShowAiEditor(false);
    },
    onError: (error) => {
      toast({ 
        title: "Error editing rule", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  });

  const handleEditRuleWithAI = () => {
    if (!aiEditInstructions.trim() || !activeRule) return;
    editRuleMutation.mutate({
      currentContent: ruleContent,
      editInstructions: aiEditInstructions,
      sourceFormat: sourceFormat,
    });
  };

  const handleValidateRules = () => {
    validateRulesMutation.mutate({
      content: ruleContent,
      sourceFormat,
    });
  };

  const handleRunSimulation = (simulationId: string, config?: any) => {
    runSimulationMutation.mutate({ simulationId, config });
  };

  // Helper to get present truths for a character (timestep 0)
  const getCharacterPresentTruths = (characterId: string) => {
    return truths.filter(entry => 
      entry.characterId === characterId && 
      entry.timestep === 0
    ).slice(0, 2); // Show max 2 truths on card
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Insimul - Narrative Simulation Platform
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Combining Ensemble, Kismet, and Talk of the Town into an insimul development environment
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            {/* World Selection */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      World
                    </CardTitle>
                    <WorldCreateDialog 
                      onCreateWorld={(data) => createWorldMutation.mutate(data)}
                      isLoading={createWorldMutation.isPending}
                    />
                  </div>
                  <Select value={selectedWorld} onValueChange={setSelectedWorld}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select world" />
                    </SelectTrigger>
                    <SelectContent>
                      {worlds.map((world) => (
                        <SelectItem key={world.id} value={world.id}>
                          {world.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedWorld && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWorldDetailsOpen(true)}
                      className="w-full gap-2"
                    >
                      <Info className="w-4 h-4" />
                      View World Details
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* File Tree */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Rules ({rules.length})
                  </CardTitle>
                  <Button size="sm" onClick={() => setRuleCreateDialogOpen(true)} data-testid="button-create-file">+</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64">
                  {rules.map((file) => (
                    <div
                      key={file.id}
                      className={`group p-3 border-b ${
                        activeRule?.id === file.id ? 'bg-blue-50 dark:bg-blue-950 border-blue-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setActiveRule(file)}
                        >
                          {editingRule === file.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-sm h-6 px-2"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditName(file);
                                  if (e.key === 'Escape') handleCancelEditName();
                                }}
                                autoFocus
                                data-testid={`input-edit-name-${file.id}`}
                              />
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleSaveEditName(file)} data-testid={`button-save-edit-${file.id}`}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCancelEditName} data-testid={`button-cancel-edit-${file.id}`}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="font-medium text-sm">{file.name}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {file.sourceFormat}
                            </Badge>
                          </div>
                        </div>
                        
                        {editingRule !== file.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditName(file);
                              }}
                              data-testid={`button-edit-name-${file.id}`}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRule(file);
                              }}
                              disabled={deleteRuleMutation.isPending}
                              data-testid={`button-delete-file-${file.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Import/Export Actions */}
            {selectedWorld && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Import/Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setImportDialogOpen(true)}
                    className="w-full gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIncludeCharactersDefault(true);
                      setExportDialogOpen(true);
                    }}
                    disabled={rules.length === 0 && characters.length === 0}
                    className="w-full gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold">{characters.length}</div>
                  <div className="text-xs text-slate-600">Characters</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Globe className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-bold">{worlds.length}</div>
                  <div className="text-xs text-slate-600">Worlds</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="editor">Rules</TabsTrigger>
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="truth">Truth</TabsTrigger>
                <TabsTrigger value="quests">Quests</TabsTrigger>
                <TabsTrigger value="simulations">Simulations</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {activeRule ? activeRule.name : 'Select a rule to edit'}
                        </CardTitle>
                        {activeRule && (
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <Badge>{activeRule.sourceFormat}</Badge>
                            <span>{activeRule.path}</span>
                          </CardDescription>
                        )}
                      </div>
                      {activeRule && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingRule(activeRule.id);
                              setEditName(activeRule.name);
                            }}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Rename
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowAiEditor(!showAiEditor)}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 hover:from-purple-100 hover:to-pink-100"
                          >
                            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                            AI Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleValidateRules}
                            disabled={validateRulesMutation.isPending}
                          >
                            {validateRulesMutation.isPending ? (
                              <AlertCircle className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Validate
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete "${activeRule.name}"? This cannot be undone.`)) {
                                deleteRuleMutation.mutate(activeRule.id);
                              }
                            }}
                            disabled={deleteRuleMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSaveFile}
                            disabled={updateRuleMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Rename Input */}
                      {activeRule && editingRule === activeRule.id && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Label htmlFor="rename-input">Rename File</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="rename-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Enter new name"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameFile(activeRule.id);
                                } else if (e.key === 'Escape') {
                                  setEditingRule(null);
                                  setEditName('');
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleRenameFile(activeRule.id)}
                              disabled={!editName.trim()}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRule(null);
                                setEditName('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor="sourceFormat">System Type</Label>
                          <Select value={sourceFormat} onValueChange={setSystemType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="insimul">Insimul</SelectItem>
                              <SelectItem value="ensemble">Ensemble</SelectItem>
                              <SelectItem value="kismet">Kismet</SelectItem>
                              <SelectItem value="tott">Talk of the Town</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="content">Rule Content</Label>
                        
                        {/* AI Rule Editor */}
                        {activeRule && showAiEditor && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Rule Editor</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAiEditor(false)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Describe how you want to modify this rule... (e.g., 'Add a condition that checks character age')"
                                value={aiEditInstructions}
                                onChange={(e) => setAiEditInstructions(e.target.value)}
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditRuleWithAI();
                                  }
                                }}
                                data-testid="input-ai-edit-instructions"
                              />
                              <Button 
                                onClick={handleEditRuleWithAI}
                                disabled={editRuleMutation.isPending || !aiEditInstructions.trim()}
                                className="bg-purple-600 hover:bg-purple-700"
                                data-testid="button-edit-rule-ai"
                              >
                                {editRuleMutation.isPending ? (
                                  <>
                                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                    Editing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Apply
                                  </>
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              The AI will modify your current {sourceFormat} rule based on your instructions.
                            </p>
                          </div>
                        )}
                        
                        <Textarea
                          id="content"
                          value={ruleContent}
                          onChange={(e) => setRuleContent(e.target.value)}
                          placeholder={activeRule ? "Edit your rules here..." : "Select a file to start editing"}
                          className="min-h-[400px] font-mono text-sm"
                          disabled={!activeRule}
                          data-testid="textarea-rule-content"
                        />
                      </div>

                      {!activeRule && (
                        <div className="text-center py-8 text-slate-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Select a rule from the sidebar or create a new one to start editing</p>
                          <p className="text-sm mt-2">
                            Unified syntax combines Ensemble predicate logic, Kismet traits, and TotT genealogy
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="characters" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Characters ({characters.length})
                        </CardTitle>
                        <CardDescription>
                          Manage characters with genealogy, relationships, and social attributes
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <CharacterCreateDialog 
                          worldId={selectedWorld}
                          onCreateCharacter={(data) => createCharacterMutation.mutate(data)}
                          isLoading={createCharacterMutation.isPending}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {characters.map((character) => {
                        const presentTruths = getCharacterPresentTruths(character.id);
                        return (
                          <Card 
                            key={character.id} 
                            className="p-4"
                          >
                            <div 
                              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded p-2 -m-2 mb-2"
                              onClick={() => {
                                setSelectedCharacter(character);
                                setCharacterEditDialogOpen(true);
                              }}
                            >
                              <div className="font-semibold">
                                {character.firstName} {character.lastName}
                              </div>
                              {presentTruths.length > 0 ? (
                                <div className="mt-2 space-y-1">
                                  {presentTruths.map((truth) => (
                                    <div key={truth.id} className="text-xs text-slate-600">
                                      • {truth.content}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 mt-2 italic">
                                  No present truths
                                </div>
                              )}
                              {character.occupation && (
                                <Badge variant="outline" className="mt-2">
                                  {character.occupation}
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatCharacter(character);
                                setCharacterChatDialogOpen(true);
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Talk
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="locations" className="space-y-4">
                {selectedWorld && (
                  <HierarchicalLocationsTab worldId={selectedWorld} />
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="w-5 h-5" />
                          Actions ({actions.length})
                        </CardTitle>
                        <CardDescription>
                          Define actions that characters can perform in simulations
                        </CardDescription>
                      </div>
                      <ActionCreateDialog
                        open={actionDialogOpen}
                        onOpenChange={setActionDialogOpen}
                        onSubmit={createActionMutation.mutate}
                      >
                        <Button onClick={() => setActionDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Action
                        </Button>
                      </ActionCreateDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {actions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No actions defined yet. Create your first action to get started.
                          </div>
                        ) : (
                          actions.map((action) => (
                            <Card key={action.id} className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{action.name}</h3>
                                    <Badge variant="outline">{action.actionType}</Badge>
                                    {action.category && (
                                      <Badge variant="secondary">{action.category}</Badge>
                                    )}
                                  </div>
                                  {action.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {action.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    {action.duration && (
                                      <span>Duration: {action.duration} steps</span>
                                    )}
                                    {action.difficulty !== null && (
                                      <span>Difficulty: {(action.difficulty * 100).toFixed(0)}%</span>
                                    )}
                                    {action.targetType && (
                                      <span>Target: {action.targetType}</span>
                                    )}
                                  </div>
                                  {action.tags && action.tags.length > 0 && (
                                    <div className="flex gap-1 mt-2">
                                      {action.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteActionMutation.mutate(action.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="truth" className="space-y-4">
                {selectedWorld && (
                  <TruthTab worldId={selectedWorld} characters={characters} />
                )}
              </TabsContent>

              <TabsContent value="quests" className="space-y-4">
                {selectedWorld && (
                  <QuestsTab worldId={selectedWorld} />
                )}
              </TabsContent>

              <TabsContent value="simulations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="w-5 h-5" />
                          Simulations ({simulations.length})
                        </CardTitle>
                        <CardDescription>
                          Run insimul simulations combining all three systems
                        </CardDescription>
                      </div>
                      <SimulationCreateDialog 
                        worldId={selectedWorld}
                        onCreateSimulation={(data) => createSimulationMutation.mutate(data)}
                        isLoading={createSimulationMutation.isPending}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {simulations.map((simulation) => (
                        <Card key={simulation.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{simulation.name}</div>
                              {simulation.description && (
                                <p className="text-slate-600 text-sm mt-1">{simulation.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant={simulation.status === 'completed' ? 'default' : 
                                          simulation.status === 'running' ? 'secondary' : 'outline'}
                                >
                                  {simulation.status || 'pending'}
                                </Badge>
                              </div>
                            </div>
                            <SimulationConfigDialog
                              onRunSimulation={(config) => handleRunSimulation(simulation.id, config)}
                              isLoading={runSimulationMutation.isPending || simulation.status === 'running'}
                              worlds={worlds}
                            >
                              <Button
                                size="sm"
                                disabled={runSimulationMutation.isPending || simulation.status === 'running'}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Configure & Run
                              </Button>
                            </SimulationConfigDialog>
                          </div>

                          {simulation.results && (
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded">
                              <div className="text-sm font-medium mb-2">Simulation Results:</div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <strong>Execution Time:</strong><br />
                                  {Math.round(simulation.results.executionTime)}ms
                                </div>
                                <div>
                                  <strong>Rules Executed:</strong><br />
                                  {simulation.results.rulesExecuted}
                                </div>
                                <div>
                                  <strong>Events Generated:</strong><br />
                                  {simulation.results.eventsGenerated}
                                </div>
                                <div>
                                  <strong>Characters Affected:</strong><br />
                                  {simulation.results.charactersAffected}
                                </div>
                              </div>
                              {simulation.results.narrative && (
                                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded border">
                                  <div className="text-sm font-medium mb-1">Generated Narrative:</div>
                                  <p className="text-sm italic">{simulation.results.narrative}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Export Dialog */}
      {selectedWorld && (
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          rules={rules.flatMap(file => {
            try {
              return ruleCompiler.compile(file.content, file.sourceFormat as any);
            } catch (error) {
              console.warn(`Failed to compile rules from ${file.name}:`, error);
              return [];
            }
          })}
          worldName={worlds.find(w => w.id === selectedWorld)?.name || 'world'}
          characters={characters}
          actions={actions}
          includeCharacters={includeCharactersDefault}
          includeActions={false}
        />
      )}

      {/* Import Dialog */}
      {selectedWorld && (
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          worldId={selectedWorld}
          onImportComplete={() => {
            // Refresh all data after import
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'characters'] });
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'actions'] });
          }}
        />
      )}

      {/* World Details Dialog */}
      {selectedWorld && (
        <WorldDetailsDialog
          open={worldDetailsOpen}
          onOpenChange={setWorldDetailsOpen}
          world={(worlds.find(w => w.id === selectedWorld) as any) || null}
          onWorldUpdated={() => {
            // Refresh worlds list
            queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
          }}
          onWorldDeleted={() => {
            // Clear selection and refresh
            setSelectedWorld('');
            queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
          }}
        />
      )}

      {/* Rule Create Dialog */}
      {selectedWorld && (
        <RuleCreateDialog
          open={ruleCreateDialogOpen}
          onOpenChange={setRuleCreateDialogOpen}
          worldId={selectedWorld}
          onCreateBlank={handleCreateBlankFile}
          onGenerateWithAI={handleGenerateFileWithAI}
          isGenerating={generateRuleMutation.isPending}
        />
      )}

      {/* Character Chat Dialog */}
      {chatCharacter && (
        <CharacterChatDialog
          open={characterChatDialogOpen}
          onOpenChange={setCharacterChatDialogOpen}
          character={chatCharacter}
          truths={truths.filter(t => t.characterId === chatCharacter.id)}
        />
      )}

      {/* Character Edit Dialog */}
      {selectedCharacter && (
        <CharacterEditDialog
          open={characterEditDialogOpen}
          onOpenChange={setCharacterEditDialogOpen}
          character={selectedCharacter}
          onCharacterUpdated={() => {
            // Refresh characters list
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'characters'] });
          }}
          onCharacterDeleted={() => {
            // Clear selection and refresh
            setSelectedCharacter(null);
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', selectedWorld, 'characters'] });
          }}
        />
      )}
    </div>
  );
}