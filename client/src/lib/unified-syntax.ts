/**
 * Insimul Rule Syntax for Insimul
 * Combines elements from Ensemble, Kismet, and Talk of the Town
 */


// Base types for the insimul syntax
export type SourceFormat = 'ensemble' | 'kismet' | 'tott' | 'insimul';

export interface InsimulRule {
  id: string;
  name: string;
  sourceFormat: SourceFormat; // Format for authoring/display only - all rules execute as Insimul
  ruleType: 'trigger' | 'volition' | 'trait' | 'default' | 'pattern' | 'genealogy';
  priority: number;
  likelihood?: number;
  conditions: Condition[];
  effects: Effect[];
  tags: string[];
  dependencies: string[];
  isActive: boolean;
}

export interface Condition {
  type: 'predicate' | 'pattern' | 'comparison' | 'temporal' | 'genealogy' | 'negation';
  predicate?: string;
  first?: string;
  second?: string;
  operator?: 'equals' | 'greater' | 'less' | 'like' | 'connected' | 'parent_of' | 'sibling_of';
  value?: any;
  negated?: boolean;
  pattern?: string;
}

export interface Effect {
  type: 'set' | 'modify' | 'trigger_event' | 'generate_text' | 'create_relationship' | 'add' | 'remove' | 'call';
  target: string;
  action: string;
  value?: any;
  parameters?: Record<string, any>;
  traceryTemplate?: string;
}

export interface TraceryGrammar {
  [key: string]: string | string[];
}

// Insimul syntax examples and templates
export const SYNTAX_EXAMPLES = {
  // Ensemble-style rule
  ensemble_inheritance: `
rule inheritance_succession {
  when (
    Person(?heir) and
    Noble(?lord) and
    parent_of(?lord, ?heir) and
    eldest_child(?heir) and
    dies(?lord)
  )
  then {
    inherit_title(?heir, ?lord.title)
    inherit_lands(?heir, ?lord.holdings)
    generate_succession_ceremony(?heir)
  }
  priority: 8
  tags: [nobility, inheritance, succession]
}`,

  // Kismet-style rule  
  kismet_romance: `
default trait romantic_towards_crush(>Self, <Other):
  +++(romance if Self crushing_on Other).
  likelihood: 0.8
  tags: [romance, relationships]
  
time year: ?[1000:1100] season: [winter|spring|summer|fall]*.`,

  // Talk of the Town style genealogy rule
  tott_genealogy: `
genealogy birth_event {
  when (
    Person(?mother) and
    Person(?father) and
    married(?mother, ?father) and
    fertile(?mother) and
    fertile(?father) and
    random_chance(0.3)
  )
  then {
    create_child(?child, ?mother, ?father)
    set_birth_year(?child, current_year)
    inherit_traits(?child, ?mother, ?father)
    generate_birth_name(?child)
  }
  priority: 5
  tags: [genealogy, birth, family]
}`,

  // Unified syntax combining all approaches
  unified_complex: `
pattern chosen_one_connection {
  when (
    Person(?hero) and
    Person(?ally) and
    hero.role == "chosen_one" and
    ally.role == "chosen_one" and
    lacking_path(?hero, ?ally) and
    same_hometown(?hero, ?ally)
  )
  then {
    create_bond(?hero, ?ally, "destiny_linked")
    generate_meeting_event(?hero, ?ally)
    tracery_generate("chosen_ones_meet", {hero: ?hero.name, ally: ?ally.name})
  }
  priority: 9
  likelihood: 0.9
  tags: [chosen_one, destiny, narrative]
}

tracery chosen_ones_meet {
  "origin": ["As fate would have it, #hero# and #ally# crossed paths in #location#..."],
  "location": ["the ancient library", "the village square", "the sacred grove"]
}`
};

// Syntax highlighting patterns
export const SYNTAX_PATTERNS = {
  keywords: /\b(rule|when|then|pattern|genealogy|tracery|default|trait|time|if|and|or|not)\b/g,
  strings: /"[^"]*"/g,
  comments: /\/\/.*$/gm,
  variables: /\?[a-zA-Z_][a-zA-Z0-9_]*/g,
  operators: /[<>=!+\-*/%]+/g,
  numbers: /\b\d+(\.\d+)?\b/g,
  predicates: /[a-zA-Z_][a-zA-Z0-9_]*\(/g,
  tags: /\[[^\]]*\]/g,
  tracery: /#[a-zA-Z_][a-zA-Z0-9_]*#/g,
};

// Rule compilation and validation
export class InsimulRuleCompiler {
  
  compile(source: string, sourceFormat?: SourceFormat): InsimulRule[] {
    const rules: InsimulRule[] = [];
    
    // Parse different syntax types based on sourceFormat
    switch (sourceFormat) {
      case 'ensemble':
        return this.compileEnsemble(source);
      case 'kismet':
        return this.compileKismet(source);
      case 'tott':
        return this.compileTott(source);
      case 'insimul':
        return this.compileInsimul(source);
      default:
        // Try to auto-detect format and compile
        return this.compileInsimul(source); // Default to Insimul
    }
  }

  private compileEnsemble(source: string): InsimulRule[] {
    // Parse Ensemble JSON format (triggerRules.json, volitionRules.json, actions.json)
    const rules: InsimulRule[] = [];
    
    try {
      const ensembleData = JSON.parse(source);
      
      // Handle array of rules (top-level array)
      if (Array.isArray(ensembleData)) {
        const hasVolitionRules = ensembleData.some(rule => rule.weight !== undefined);
        const ruleType = hasVolitionRules ? 'volition' : 'trigger';
        
        ensembleData.forEach((rule: any, index: number) => {
          rules.push({
            id: `${ruleType}_${index}`,
            name: rule.name || `${ruleType} Rule ${index + 1}`,
            sourceFormat: 'ensemble',
            ruleType: ruleType,
            priority: rule.weight || 5,
            conditions: this.parseEnsembleJsonConditions(rule.conditions || []),
            effects: this.parseEnsembleJsonEffects(rule.effects || []),
            tags: [],
            dependencies: [],
            isActive: true
          });
        });
      }
      
      // Handle new multi-section format with triggerRules, volitionRules, and actions
      else if (ensembleData.triggerRules || ensembleData.volitionRules || ensembleData.actions) {
        
        // Parse triggerRules section
        if (ensembleData.triggerRules && ensembleData.triggerRules.rules) {
          ensembleData.triggerRules.rules.forEach((rule: any, index: number) => {
            rules.push({
              id: `trigger_${index}`,
              name: rule.name || `Trigger Rule ${index + 1}`,
              sourceFormat: 'ensemble',
              ruleType: rule.originalType || 'trigger',  // Preserve original type for round-trip
              priority: 5,
              likelihood: rule.likelihood,  // Preserve likelihood metadata
              conditions: this.parseEnsembleJsonConditions(rule.conditions || []),
              effects: this.parseEnsembleJsonEffects(rule.effects || []),
              tags: [],
              dependencies: [],
              isActive: true
            });
          });
        }
        
        // Parse volitionRules section
        if (ensembleData.volitionRules && ensembleData.volitionRules.rules) {
          ensembleData.volitionRules.rules.forEach((rule: any, index: number) => {
            rules.push({
              id: `volition_${index}`,
              name: rule.name || `Volition Rule ${index + 1}`,
              sourceFormat: 'ensemble',
              ruleType: 'volition',
              priority: rule.weight || 5,
              weight: rule.weight,  // Preserve weight metadata
              conditions: this.parseEnsembleJsonConditions(rule.conditions || []),
              effects: this.parseEnsembleJsonEffects(rule.effects || []),
              tags: [],
              dependencies: [],
              isActive: true
            });
          });
        }
        
        // Parse actions section (existing logic)
        if (ensembleData.actions) {
          ensembleData.actions.forEach((action: any, index: number) => {
            rules.push({
              id: `action_${index}`,
              name: action.name || `Action ${index + 1}`,
              sourceFormat: 'ensemble',
              ruleType: 'default',
              priority: 3,
              conditions: this.parseEnsembleJsonConditions(action.conditions || []),
              effects: [{
                type: 'trigger_event',
                target: 'action',
                action: action.intent?.type || 'unknown',
                value: action.leadsTo || [],
                parameters: action.intent
              }],
              tags: [],
              dependencies: [],
              isActive: true
            });
          });
        }
      }
      
      // Handle legacy actions object format (for backward compatibility)
      else if (ensembleData.actions) {
        ensembleData.actions.forEach((action: any, index: number) => {
          rules.push({
            id: `action_${index}`,
            name: action.name || `Action ${index + 1}`,
            sourceFormat: 'ensemble',
            ruleType: 'default',
            priority: 3,
            conditions: this.parseEnsembleJsonConditions(action.conditions || []),
            effects: [{
              type: 'trigger_event',
              target: 'action',
              action: action.intent?.type || 'unknown',
              value: action.leadsTo || [],
              parameters: action.intent
            }],
            tags: [],
            dependencies: [],
            isActive: true
          });
        });
      }
      
      // Handle object with rules array
      else if (ensembleData.rules) {
        // Determine rule type from fileName, type field, or rule structure
        let ruleType: 'trigger' | 'volition' = 'trigger';
        
        if (ensembleData.type === 'volition' || 
            (ensembleData.fileName && ensembleData.fileName.includes('volition')) ||
            ensembleData.rules.some((rule: any) => rule.weight !== undefined)) {
          ruleType = 'volition';
        }
        
        ensembleData.rules.forEach((rule: any, index: number) => {
          rules.push({
            id: `${ruleType}_${index}`,
            name: rule.name || `${ruleType} Rule ${index + 1}`,
            sourceFormat: 'ensemble',
            ruleType: ruleType,
            priority: rule.weight || 5,
            conditions: this.parseEnsembleJsonConditions(rule.conditions || []),
            effects: this.parseEnsembleJsonEffects(rule.effects || []),
            tags: [],
            dependencies: [],
            isActive: true
          });
        });
      }
      
      else {
        // Fallback to text-based parsing for non-JSON content
        return this.parseEnsembleTextRules(source);
      }
      
    } catch (error) {
      // If JSON parsing fails, try text-based parsing
      return this.parseEnsembleTextRules(source);
    }
    
    return rules;
  }

  private compileKismet(source: string): InsimulRule[] {
    // Parse Kismet-style Prolog syntax with traits, patterns, and rules
    const rules: InsimulRule[] = [];
    
    // Parse trait definitions: default trait name(Args): body. likelihood: value
    const traitPattern = /default\s+trait\s+(\w+)(\([^)]*\))?\s*:\s*([^.]+)\.\s*(?:likelihood:\s*([\d.]+))?/g;
    let traitMatch;
    while ((traitMatch = traitPattern.exec(source)) !== null) {
      const [, name, argsStr, body, likelihood] = traitMatch;
      
      rules.push({
        id: `kismet_trait_${name}_${rules.length}`,
        name: name,
        sourceFormat: 'kismet',
        ruleType: 'trait',
        priority: 5,
        likelihood: likelihood ? parseFloat(likelihood) : 0.5,
        conditions: this.parseKismetConditions(argsStr || ''),
        effects: this.parseKismetEffects(body),
        tags: this.extractTags(body),
        dependencies: [],
        isActive: true
      });
    }
    
    // Parse pattern rules: pattern name: conditions -> effects.
    const patternPattern = /pattern\s+(\w+)\s*:\s*([^->]+)->\s*([^.]+)\./g;
    let patternMatch;
    while ((patternMatch = patternPattern.exec(source)) !== null) {
      const [, name, conditionsStr, effectsStr] = patternMatch;
      
      rules.push({
        id: `kismet_pattern_${name}_${rules.length}`,
        name: name,
        sourceFormat: 'kismet',
        ruleType: 'pattern',
        priority: 6,
        conditions: this.parseKismetConditions(conditionsStr),
        effects: this.parseKismetEffects(effectsStr),
        tags: [],
        dependencies: [],
        isActive: true
      });
    }
    
    // Parse volition rules with weights: rule_name(Args) :- body. weight: value
    const volitionPattern = /(\w+)\(([^)]*)\)\s*:-\s*([^.]+)\.\s*(?:weight:\s*([\d.]+))?/g;
    let volitionMatch;
    while ((volitionMatch = volitionPattern.exec(source)) !== null) {
      const [, name, argsStr, body, weight] = volitionMatch;
      
      rules.push({
        id: `kismet_volition_${name}_${rules.length}`,
        name: name,
        sourceFormat: 'kismet',
        ruleType: 'volition',
        priority: weight ? parseInt(weight) : 7,
        conditions: this.parseKismetConditions(argsStr),
        effects: this.parseKismetEffects(body),
        tags: this.extractTags(body),
        dependencies: [],
        isActive: true
      });
    }
    
    // Fallback: simple trait parsing for compatibility
    if (rules.length === 0) {
      const simpleTraitMatches = source.match(/default\s+trait\s+(\w+)[^.]*\./g);
      if (simpleTraitMatches) {
        simpleTraitMatches.forEach((traitMatch, index) => {
          const nameMatch = traitMatch.match(/trait\s+(\w+)/);
          if (nameMatch) {
            rules.push({
              id: `trait_${index}`,
              name: nameMatch[1],
              sourceFormat: 'kismet',
              ruleType: 'trait',
              priority: 5,
              likelihood: this.extractLikelihood(traitMatch),
              conditions: this.parseKismetConditions(traitMatch),
              effects: this.parseKismetEffects(traitMatch),
              tags: [],
              dependencies: [],
              isActive: true
            });
          }
        });
      }
    }
    
    return rules;
  }

  private compileTott(source: string): InsimulRule[] {
    // Parse Talk of the Town JSON and Python-like rules
    const rules: InsimulRule[] = [];
    
    try {
      // Try to parse as JSON first (TotT can export to JSON)
      const tottData = JSON.parse(source);
      
      // Handle different TotT JSON structures
      if (Array.isArray(tottData)) {
        // Array of rules
        tottData.forEach((rule, index) => {
          if (rule.name && rule.type) {
            rules.push({
              id: `tott_${rule.type}_${index}`,
              name: rule.name,
              sourceFormat: 'tott',
              ruleType: this.mapTottRuleType(rule.type),
              priority: rule.priority || 5,
              conditions: this.parseTottConditions(rule.conditions || rule.triggers || []),
              effects: this.parseTottEffects(rule.effects || rule.outcomes || []),
              tags: rule.tags || [rule.type],
              dependencies: rule.dependencies || [],
              isActive: rule.active !== false
            });
          }
        });
      } else if (tottData.genealogy_rules || tottData.trigger_rules || tottData.character_rules) {
        // Structured TotT export with categorized rules
        ['genealogy_rules', 'trigger_rules', 'character_rules'].forEach(category => {
          const categoryRules = tottData[category];
          if (Array.isArray(categoryRules)) {
            categoryRules.forEach((rule, index) => {
              rules.push({
                id: `tott_${category}_${index}`,
                name: rule.name || `${category}_rule_${index}`,
                sourceFormat: 'tott',
                ruleType: this.mapTottCategory(category),
                priority: rule.priority || 5,
                conditions: this.parseTottConditions(rule.conditions || []),
                effects: this.parseTottEffects(rule.effects || []),
                tags: [category.replace('_rules', '')],
                dependencies: [],
                isActive: true
              });
            });
          }
        });
      }
      
    } catch (jsonError) {
      // If not JSON, parse as Python-like class definitions
      
      // Parse class-based rules: class RuleName: def apply(self): ...
      const classPattern = /class\s+(\w+)\s*(?:\([^)]*\))?\s*:\s*([\s\S]*?)(?=class\s+\w+|$)/g;
      let classMatch;
      while ((classMatch = classPattern.exec(source)) !== null) {
        const [, className, classBody] = classMatch;
        
        // Look for genealogy methods
        if (classBody.includes('def genealogy') || className.toLowerCase().includes('genealogy')) {
          rules.push({
            id: `tott_genealogy_${className}`,
            name: className,
            sourceFormat: 'tott',
            ruleType: 'genealogy',
            priority: 8,
            conditions: this.parseTottPythonConditions(classBody),
            effects: this.parseTottPythonEffects(classBody),
            tags: ['genealogy'],
            dependencies: [],
            isActive: true
          });
        }
        
        // Look for trigger methods
        if (classBody.includes('def trigger') || classBody.includes('def apply')) {
          rules.push({
            id: `tott_trigger_${className}`,
            name: className,
            sourceFormat: 'tott',
            ruleType: 'trigger',
            priority: 7,
            conditions: this.parseTottPythonConditions(classBody),
            effects: this.parseTottPythonEffects(classBody),
            tags: ['trigger'],
            dependencies: [],
            isActive: true
          });
        }
      }
      
      // Parse function-based rules: def rule_name(): ...
      const functionPattern = /def\s+(\w+)\s*\([^)]*\)\s*:\s*([\s\S]*?)(?=def\s+\w+|class\s+\w+|$)/g;
      let functionMatch;
      while ((functionMatch = functionPattern.exec(source)) !== null) {
        const [, functionName, functionBody] = functionMatch;
        
        if (functionName.startsWith('rule_') || functionName.includes('genealogy') || functionName.includes('trigger')) {
          const ruleType = functionName.includes('genealogy') ? 'genealogy' : 
                          functionName.includes('trigger') ? 'trigger' : 'default';
          
          rules.push({
            id: `tott_function_${functionName}`,
            name: functionName,
            sourceFormat: 'tott',
            ruleType: ruleType as any,
            priority: 6,
            conditions: this.parseTottPythonConditions(functionBody),
            effects: this.parseTottPythonEffects(functionBody),
            tags: [ruleType],
            dependencies: [],
            isActive: true
          });
        }
      }
    }
    
    return rules;
  }

  private compileInsimul(source: string): InsimulRule[] {
    // Parse the unified syntax combining all approaches
    const rules: InsimulRule[] = [];
    
    // Improved regex to handle nested braces and multiline content
    const rulePattern = /(rule|pattern|genealogy|tracery)\s+(\w+)\s*\{/g;
    let match;
    
    while ((match = rulePattern.exec(source)) !== null) {
      const ruleType = match[1];
      const ruleName = match[2];
      const startPos = match.index;
      
      // Find the matching closing brace by counting braces
      let braceCount = 1;
      let pos = rulePattern.lastIndex;
      let endPos = pos;
      
      while (pos < source.length && braceCount > 0) {
        if (source[pos] === '{') braceCount++;
        else if (source[pos] === '}') braceCount--;
        pos++;
      }
      
      if (braceCount === 0) {
        endPos = pos;
        const ruleContent = source.substring(startPos, endPos);
        
        const mappedRuleType = this.mapRuleType(ruleType);
        rules.push({
          id: `insimul_${rules.length}`,
          name: ruleName,
          sourceFormat: 'insimul',
          ruleType: mappedRuleType,
          priority: this.extractPriority(ruleContent),
          likelihood: this.extractLikelihood(ruleContent),
          conditions: this.parseInsimulConditions(ruleContent),
          effects: this.parseInsimulEffects(ruleContent),
          tags: this.extractTags(ruleContent),
          dependencies: [],
          isActive: true
        });
      }
    }
    
    return rules;
  }

  private parseEnsembleJsonConditions(conditions: any[]): Condition[] {
    return conditions.map(condition => ({
      type: 'predicate',
      predicate: `${condition.category}_${condition.type}`,
      first: condition.first,
      second: condition.second,
      operator: this.mapEnsembleOperator(condition.operator),
      value: condition.value,
      negated: false
    }));
  }
  
  private mapEnsembleOperator(operator?: string): 'equals' | 'greater' | 'less' | 'like' | 'connected' | 'parent_of' | 'sibling_of' {
    switch (operator) {
      case '>': return 'greater';
      case '<': return 'less';
      case '=': 
      case '==': return 'equals';
      default: return 'equals';
    }
  }

  private parseEnsembleTextRules(source: string): InsimulRule[] {
    // Fallback to parse text-based Ensemble rules (legacy format)
    const rules: InsimulRule[] = [];
    
    // Extract rule blocks
    const ruleMatches = source.match(/rule\s+(\w+)\s*{[^}]*}/g);
    if (ruleMatches) {
      ruleMatches.forEach((ruleMatch, index) => {
        const nameMatch = ruleMatch.match(/rule\s+(\w+)/);
        if (nameMatch) {
          rules.push({
            id: `rule_${index}`,
            name: nameMatch[1],
            sourceFormat: 'ensemble',
            ruleType: 'trigger',
            priority: 5,
            conditions: this.parseEnsembleTextConditions(ruleMatch),
            effects: this.parseEnsembleTextEffects(ruleMatch),
            tags: [],
            dependencies: [],
            isActive: true
          });
        }
      });
    }
    
    return rules;
  }

  private parseEnsembleTextConditions(ruleText: string): Condition[] {
    const conditions: Condition[] = [];
    const whenMatch = ruleText.match(/when\s*\(([^)]*)\)/);
    
    if (whenMatch) {
      const conditionText = whenMatch[1];
      // Parse conditions like "Person(?heir) and Noble(?lord) and parent_of(?lord, ?heir)"
      const predicates = conditionText.split(/\s+and\s+/);
      
      predicates.forEach(predicate => {
        const cleanPredicate = predicate.trim();
        if (cleanPredicate.includes('(')) {
          const match = cleanPredicate.match(/(\w+)\(([^)]*)\)/);
          if (match) {
            const params = match[2].split(',').map(p => p.trim());
            conditions.push({
              type: 'predicate',
              predicate: match[1],
              first: params[0]?.replace('?', ''),
              second: params[1]?.replace('?', ''),
            });
          }
        }
      });
    }
    
    return conditions;
  }

  private parseEnsembleJsonEffects(effects: any[]): Effect[] {
    return effects.map(effect => ({
      type: this.mapEnsembleEffectType(effect.category, effect.intentType),
      target: effect.first || 'self',
      action: `${effect.category}_${effect.type}`,
      value: effect.value,
      parameters: {
        category: effect.category,
        type: effect.type,
        first: effect.first,
        second: effect.second,
        weight: effect.weight,
        operator: effect.operator,
        intentType: effect.intentType
      }
    }));
  }
  
  private mapEnsembleEffectType(category: string, intentType?: boolean): 'set' | 'modify' | 'trigger_event' | 'generate_text' | 'create_relationship' | 'add' | 'remove' | 'call' {
    if (category === 'relationship') return 'create_relationship';
    if (category === 'network' || category === 'bond') return 'modify';
    if (category === 'attribute') return 'modify';
    if (intentType === false) return 'remove';
    return 'set';
  }

  private parseEnsembleTextEffects(ruleText: string): Effect[] {
    const effects: Effect[] = [];
    const thenMatch = ruleText.match(/then\s*{([^}]*)}/);
    
    if (thenMatch) {
      const effectText = thenMatch[1];
      const effectLines = effectText.split('\n').map(line => line.trim()).filter(line => line);
      
      effectLines.forEach(line => {
        if (line.includes('(')) {
          const match = line.match(/(\w+)\(([^)]*)\)/);
          if (match) {
            effects.push({
              type: 'set',
              target: match[2].split(',')[0]?.trim().replace('?', '') || '',
              action: match[1],
              value: match[2].split(',').slice(1).join(',').trim()
            });
          }
        }
      });
    }
    
    return effects;
  }

  private parseKismetConditions(argsText: string): Condition[] {
    // Parse Kismet-style conditions from trait arguments
    const conditions: Condition[] = [];
    
    if (!argsText) return conditions;
    
    // Handle different argument formats
    if (argsText.includes('(') && argsText.includes(')')) {
      // Extract arguments from parentheses: (Self, Other) or (Self)
      const argsMatch = argsText.match(/\(([^)]*)\)/);
      if (argsMatch) {
        const args = argsMatch[1].split(',').map(arg => arg.trim());
        if (args.length >= 1 && args[0]) {
          // Create a basic predicate condition from the first argument
          conditions.push({
            type: 'predicate',
            predicate: 'has_trait',
            first: args[0].replace(/[<>]/g, ''), // Remove Kismet direction indicators
            second: args[1]?.replace(/[<>]/g, '')
          });
        }
      }
    } else if (argsText.trim()) {
      // Simple argument format: just text
      conditions.push({
        type: 'predicate',
        predicate: 'has_trait',
        first: argsText.trim().replace(/[<>]/g, '')
      });
    }
    
    // Also check for @if statements and other patterns in the text
    const ifMatches = argsText.match(/@if\s+([^@]+)@/g);
    if (ifMatches) {
      ifMatches.forEach(ifMatch => {
        const conditionText = ifMatch.replace(/@if\s+/, '').replace('@', '');
        conditions.push({
          type: 'comparison',
          predicate: conditionText.trim()
        });
      });
    }
    
    return conditions;
  }

  private parseKismetEffects(bodyText: string): Effect[] {
    // Parse Kismet-style effects from trait body text
    const effects: Effect[] = [];
    
    if (!bodyText) return effects;
    
    // The bodyText may be in different formats:
    // 1. Direct effect text (already extracted): "+++(romance if Self crushing_on Other)"
    // 2. Full trait format: ": +++(romance if Self crushing_on Other). likelihood: 0.8"
    // 3. Simple text: "true" or function calls
    
    let effectText = bodyText.trim();
    
    // First try to extract from colon-period format (for backward compatibility)
    const colonPeriodMatch = bodyText.match(/:\s*([^.]+)\./);
    if (colonPeriodMatch) {
      effectText = colonPeriodMatch[1].trim();
    } else {
      // Handle direct effect text - remove trailing period if present
      effectText = effectText.replace(/\.$/, '');
    }
    
    // Handle different effect formats
    if (effectText.startsWith('+++')) {
      // Kismet likelihood modifier: +++(romance if Self crushing_on Other)
      const innerMatch = effectText.match(/\+\+\+\(([^)]+)\)/);
      if (innerMatch) {
        effects.push({
          type: 'modify',
          target: 'likelihood',
          action: 'increase_likelihood',
          value: innerMatch[1]
        });
      } else {
        // Handle +++text without parentheses
        const simpleMatch = effectText.match(/\+\+\+(.+)/);
        if (simpleMatch) {
          effects.push({
            type: 'modify',
            target: 'likelihood',
            action: 'increase_likelihood',
            value: simpleMatch[1].trim()
          });
        }
      }
    } else if (effectText.startsWith('---')) {
      // Kismet likelihood decreaser: ---(condition)
      const innerMatch = effectText.match(/---\(([^)]+)\)/);
      if (innerMatch) {
        effects.push({
          type: 'modify',
          target: 'likelihood',
          action: 'decrease_likelihood',
          value: innerMatch[1]
        });
      } else {
        const simpleMatch = effectText.match(/---(.+)/);
        if (simpleMatch) {
          effects.push({
            type: 'modify',
            target: 'likelihood',
            action: 'decrease_likelihood',
            value: simpleMatch[1].trim()
          });
        }
      }
    } else if (effectText.includes('(') && effectText.includes(')')) {
      // Function call format: action(target) or predicate(args)
      const funcMatch = effectText.match(/(\w+)\(([^)]*)\)/);
      if (funcMatch) {
        const [, functionName, args] = funcMatch;
        const argList = args ? args.split(',').map(arg => arg.trim()) : [];
        
        effects.push({
          type: 'call',
          target: argList[0] || 'self',
          action: functionName,
          value: argList.length > 1 ? argList.slice(1) : true,
          parameters: {
            function: functionName,
            arguments: argList
          }
        });
      }
    } else if (effectText === 'true' || effectText === 'false') {
      // Boolean effects
      effects.push({
        type: 'set',
        target: 'self',
        action: 'activate',
        value: effectText === 'true'
      });
    } else if (effectText.includes(' if ')) {
      // Conditional effects: "action if condition"
      const conditionalMatch = effectText.match(/(.+?)\s+if\s+(.+)/);
      if (conditionalMatch) {
        effects.push({
          type: 'modify',
          target: 'conditional',
          action: conditionalMatch[1].trim(),
          value: conditionalMatch[2].trim(),
          parameters: {
            condition: conditionalMatch[2].trim(),
            action: conditionalMatch[1].trim()
          }
        });
      }
    } else if (effectText.trim()) {
      // Generic effect text - non-empty content
      effects.push({
        type: 'modify',
        target: 'self',
        action: 'apply',
        value: effectText
      });
    }
    
    return effects;
  }

  private parseInsimulConditions(ruleText: string): Condition[] {
    const conditions: Condition[] = [];
    const whenMatch = ruleText.match(/when\s*\(([^}]*)\)/);
    
    if (whenMatch) {
      const conditionText = whenMatch[1];
      const lines = conditionText.split('\n').map(line => line.trim()).filter(line => line);
      
      lines.forEach(line => {
        if (line.includes('==') || line.includes('!=') || line.includes('>') || line.includes('<')) {
          const parts = line.split(/[=!><]+/);
          if (parts.length >= 2) {
            conditions.push({
              type: 'comparison',
              first: parts[0].trim(),
              operator: this.extractOperator(line),
              value: parts[1].trim().replace(/['"]/g, '')
            });
          }
        } else if (line.includes('(')) {
          const match = line.match(/(\w+)\(([^)]*)\)/);
          if (match) {
            const params = match[2].split(',').map(p => p.trim());
            conditions.push({
              type: 'predicate',
              predicate: match[1],
              first: params[0]?.replace('?', ''),
              second: params[1]?.replace('?', ''),
            });
          }
        }
      });
    }
    
    return conditions;
  }

  private parseInsimulEffects(ruleText: string): Effect[] {
    const effects: Effect[] = [];
    const m = /then\s*{([\s\S]*?)}/m.exec(ruleText);
    
    if (m) {
      const effectText = m[1];
      const lines = effectText.split('\n').map(line => line.trim()).filter(line => line);
      
      lines.forEach(line => {
        if (line.startsWith('create_')) {
          const match = line.match(/(\w+)\(([^)]*)\)/);
          if (match) {
            effects.push({
              type: 'create_relationship',
              target: match[2].split(',')[0]?.trim().replace('?', '') || '',
              action: match[1],
              parameters: this.parseParameters(match[2])
            });
          }
        } else if (line.startsWith('tracery_generate')) {
          const match = line.match(/tracery_generate\("([^"]*)"[^)]*\)/);
          if (match) {
            effects.push({
              type: 'generate_text',
              target: 'narrative',
              action: 'generate',
              traceryTemplate: match[1]
            });
          }
        } else if (line.includes('(')) {
          const match = line.match(/(\w+)\(([^)]*)\)/);
          if (match) {
            effects.push({
              type: 'set',
              target: match[2].split(',')[0]?.trim().replace('?', '') || '',
              action: match[1],
              value: match[2].split(',').slice(1).join(',').trim()
            });
          }
        }
      });
    }
    
    return effects;
  }

  private extractPriority(ruleText: string): number {
    const match = ruleText.match(/priority:\s*(\d+)/);
    return match ? parseInt(match[1]) : 5;
  }

  private extractLikelihood(ruleText: string): number {
    const match = ruleText.match(/likelihood:\s*([0-9.]+)/);
    return match ? parseFloat(match[1]) : 1.0;
  }

  private extractTags(ruleText: string): string[] {
    const match = ruleText.match(/tags:\s*\[([^\]]*)\]/);
    if (match) {
      return match[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
    }
    return [];
  }

  private extractOperator(line: string): Condition['operator'] {
    if (line.includes('==')) return 'equals';
    if (line.includes('!=')) return 'equals'; // Will be negated
    if (line.includes('>=')) return 'greater';
    if (line.includes('<=')) return 'less';
    if (line.includes('>')) return 'greater';
    if (line.includes('<')) return 'less';
    return 'equals';
  }

  private mapRuleType(ruleKeyword: string): InsimulRule['ruleType'] {
    switch (ruleKeyword) {
      case 'rule': return 'trigger';
      case 'pattern': return 'pattern';
      case 'genealogy': return 'genealogy';
      case 'tracery': return 'default';
      default: return 'trigger';
    }
  }

  private parseParameters(paramString: string): Record<string, any> {
    const params: Record<string, any> = {};
    const parts = paramString.split(',');
    
    parts.forEach((part, index) => {
      const trimmed = part.trim().replace('?', '');
      params[`param${index}`] = trimmed;
    });
    
    return params;
  }

  compileToSystem(source: string, targetSystem: string): string {
    const rules = this.compile(source, 'insimul');
    
    switch (targetSystem) {
      case 'ensemble':
        return this.generateEnsembleJson(rules);
      case 'kismet':
        return this.generateKismetProlog(rules);
      case 'tott':
        return this.generateTottPython(rules);
      case 'prolog':
        return this.generateSwiProlog(rules);
      default:
        return source; // Return original for insimul system
    }
  }

  // Generate SWI Prolog syntax from Insimul rules
  generateSwiProlog(rules: InsimulRule[]): string {
    let prologOutput = '% SWI Prolog Rules Generated from Insimul\n';
    prologOutput += '% Auto-generated on ' + new Date().toISOString() + '\n\n';
    
    // Add fundamental predicates declarations
    prologOutput += ':- dynamic person/1.\n';
    prologOutput += ':- dynamic noble/1.\n';
    prologOutput += ':- dynamic parent_of/2.\n';
    prologOutput += ':- dynamic eldest_child/1.\n';
    prologOutput += ':- dynamic dies/1.\n';
    prologOutput += ':- dynamic age/2.\n';
    prologOutput += ':- dynamic inherit_title/2.\n';
    prologOutput += ':- dynamic inherit_lands/2.\n';
    prologOutput += ':- dynamic set_status/2.\n';
    prologOutput += ':- dynamic create_succession_event/2.\n';
    prologOutput += ':- dynamic same_location/2.\n';
    prologOutput += ':- dynamic unmarried/1.\n';
    prologOutput += ':- dynamic relationship/3.\n\n';
    
    rules.forEach(rule => {
      prologOutput += this.convertRuleToProlog(rule) + '\n\n';
    });
    
    return prologOutput;
  }

  private convertRuleToProlog(rule: InsimulRule): string {
    let prolog = `% Rule: ${rule.name}\n`;
    prolog += `% Priority: ${rule.priority}, Likelihood: ${rule.likelihood}\n`;
    prolog += `% Tags: [${rule.tags.join(', ')}]\n`;
    
    // Convert rule to Prolog format
    const ruleName = this.sanitizePrologIdentifier(rule.name);
    
    // Build condition part
    const conditions = rule.conditions.map(cond => this.convertConditionToProlog(cond)).join(', ');
    
    // Build effect part - in Prolog, effects are typically handled as implications
    const effects = rule.effects.map(eff => this.convertEffectToProlog(eff)).join(', ');
    
    if (conditions && effects) {
      prolog += `${ruleName}_condition(Context) :- ${conditions}.\n`;
      prolog += `${ruleName}_effect(Context) :- ${effects}.\n`;
      prolog += `${ruleName}_execute(Context) :- ${ruleName}_condition(Context), ${ruleName}_effect(Context).\n`;
    } else if (conditions) {
      prolog += `${ruleName}(Context) :- ${conditions}.\n`;
    }
    
    return prolog;
  }

  private convertConditionToProlog(condition: Condition): string {
    switch (condition.type) {
      case 'predicate':
        if (condition.first && condition.second) {
          return `${condition.predicate}(${condition.first}, ${condition.second})`;
        } else if (condition.first) {
          return `${condition.predicate}(${condition.first})`;
        } else {
          return condition.predicate || 'true';
        }
      
      case 'comparison':
        // Handle comparison operators
        if (condition.predicate?.includes('>=')) {
          const parts = condition.predicate.split('>=');
          return `${parts[0].trim()} >= ${parts[1].trim()}`;
        } else if (condition.predicate?.includes('==')) {
          const parts = condition.predicate.split('==');
          return `${parts[0].trim()} = ${parts[1].trim()}`;
        }
        return condition.predicate || 'true';
      
      case 'negation':
        return `\\+ ${this.convertConditionToProlog({ type: 'predicate', predicate: condition.predicate })}`;
      
      default:
        return condition.predicate || 'true';
    }
  }

  private convertEffectToProlog(effect: Effect): string {
    switch (effect.type) {
      case 'set':
        if (effect.value) {
          return `assertz(${effect.action}(${effect.target}, ${effect.value}))`;
        } else {
          return `assertz(${effect.action}(${effect.target}))`;
        }
      
      case 'add':
        return `assertz(${effect.action}(${effect.target}))`;
      
      case 'remove':
        return `retract(${effect.action}(${effect.target}))`;
      
      case 'call':
        return `${effect.action}(${effect.target})`;
      
      default:
        return `${effect.action}(${effect.target})`;
    }
  }

  private sanitizePrologIdentifier(name: string): string {
    // Convert to valid Prolog atom - lowercase, replace spaces/special chars with underscores
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^([0-9])/, '_$1');
  }

  private generateEnsembleJson(rules: InsimulRule[]): string {
    // Generate proper Ensemble JSON format
    const triggerRules = rules.filter(rule => rule.ruleType === 'trigger');
    const volitionRules = rules.filter(rule => rule.ruleType === 'volition');
    const actionRules = rules.filter(rule => rule.ruleType === 'default');
    
    if (triggerRules.length > 0) {
      return JSON.stringify({
        fileName: "triggerRules",
        type: "trigger",
        rules: triggerRules.map(rule => ({
          name: rule.name,
          conditions: this.convertToEnsembleConditions(rule.conditions),
          effects: this.convertToEnsembleEffects(rule.effects)
        }))
      }, null, 2);
    }
    
    else if (volitionRules.length > 0) {
      return JSON.stringify({
        fileName: "volitionRules",
        type: "volition",
        rules: volitionRules.map(rule => ({
          name: rule.name,
          conditions: this.convertToEnsembleConditions(rule.conditions),
          effects: this.convertToEnsembleVolitionEffects(rule.effects, rule.priority)
        }))
      }, null, 2);
    }
    
    else if (actionRules.length > 0) {
      return JSON.stringify({
        actions: actionRules.map(rule => ({
          name: rule.name,
          conditions: this.convertToEnsembleConditions(rule.conditions),
          influenceRules: [],
          intent: rule.effects[0]?.parameters || {},
          leadsTo: Array.isArray(rule.effects[0]?.value) ? rule.effects[0].value : []
        }))
      }, null, 2);
    }
    
    // Fallback: return as generic rule format
    return JSON.stringify({
      fileName: "customRules",
      type: "trigger",
      rules: rules.map(rule => ({
        name: rule.name,
        conditions: this.convertToEnsembleConditions(rule.conditions),
        effects: this.convertToEnsembleEffects(rule.effects)
      }))
    }, null, 2);
  }
  
  private convertToEnsembleConditions(conditions: Condition[]): any[] {
    return conditions.map(condition => {
      const parts = condition.predicate?.split('_') || ['trait', 'unknown'];
      return {
        category: parts[0],
        type: parts.slice(1).join('_'),
        first: condition.first,
        second: condition.second,
        value: condition.value,
        operator: this.mapToEnsembleOperator(condition.operator)
      };
    });
  }
  
  private convertToEnsembleEffects(effects: Effect[]): any[] {
    return effects.map(effect => {
      const parts = effect.action?.split('_') || ['trait', 'unknown'];
      return {
        category: parts[0],
        type: parts.slice(1).join('_'),
        first: effect.target,
        second: effect.parameters?.second,
        value: effect.value,
        operator: effect.parameters?.operator
      };
    });
  }
  
  private convertToEnsembleVolitionEffects(effects: Effect[], weight: number): any[] {
    return effects.map(effect => {
      const parts = effect.action?.split('_') || ['trait', 'unknown'];
      return {
        category: parts[0],
        type: parts.slice(1).join('_'),
        first: effect.target,
        second: effect.parameters?.second,
        weight: weight,
        intentType: true,
        value: effect.value
      };
    });
  }
  
  private mapToEnsembleOperator(operator?: string): string {
    switch (operator) {
      case 'greater': return '>';
      case 'less': return '<';
      case 'equals': return '=';
      default: return '=';
    }
  }

  private generateKismetProlog(rules: InsimulRule[]): string {
    // Placeholder for Kismet Prolog generation
    return rules.map(rule => 
      `default trait ${rule.name}(>Self, <Other):\n  ${rule.conditions.map(c => c.predicate).join(' and ')}.`
    ).join('\n\n');
  }

  private generateTottPython(rules: InsimulRule[]): string {
    // Placeholder for Talk of the Town Python generation
    return rules.map(rule => 
      `# ${rule.name}\ndef ${rule.name}(context):\n    # Implementation needed\n    pass`
    ).join('\n\n');
  }

  exportToFormat(rules: InsimulRule[], targetFormat: SourceFormat, includeComments: boolean = true, characters?: any[]): string {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    rules.forEach((rule, index) => {
      // Validate rule structure
      if (!rule.name) {
        errors.push(`Rule ${index}: Missing rule name`);
      }
      
      if (!rule.conditions || rule.conditions.length === 0) {
        warnings.push(`Rule ${rule.name}: No conditions defined`);
      }
      
      if (!rule.effects || rule.effects.length === 0) {
        warnings.push(`Rule ${rule.name}: No effects defined`);
      }
      
      // Validate condition references
      rule.conditions.forEach((condition, condIndex) => {
        if (condition.type === 'predicate' && !condition.predicate) {
          errors.push(`Rule ${rule.name}, condition ${condIndex}: Missing predicate`);
        }
      });
      
      // Check for circular dependencies
      if (rule.dependencies.includes(rule.name)) {
        errors.push(`Rule ${rule.name}: Circular dependency detected`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Kismet parsing helper methods
  private parseKismetPatternConditions(conditionsStr: string): Condition[] {
    const conditions: Condition[] = [];
    const conditionParts = conditionsStr.split(',').map(s => s.trim());
    
    conditionParts.forEach(part => {
      if (part.includes('(') && part.includes(')')) {
        const match = part.match(/(\w+)\((.*?)\)/);
        if (match) {
          const [, predicate, args] = match;
          const argList = args.split(',').map(s => s.trim());
          conditions.push({
            type: 'predicate',
            predicate: predicate,
            first: argList[0],
            second: argList[1]
          });
        }
      } else {
        conditions.push({
          type: 'predicate',
          predicate: part
        });
      }
    });
    
    return conditions;
  }

  private parseKismetPatternEffects(effectsStr: string): Effect[] {
    const effects: Effect[] = [];
    const effectParts = effectsStr.split(',').map(s => s.trim());
    
    effectParts.forEach(part => {
      if (part.includes('++') || part.includes('--')) {
        const isIncrease = part.includes('++');
        const predicate = part.replace(/[+-]/g, '').trim();
        effects.push({
          type: 'modify',
          target: predicate,
          action: isIncrease ? 'increase' : 'decrease',
          value: 1
        });
      } else {
        effects.push({
          type: 'call',
          target: part,
          action: part
        });
      }
    });
    
    return effects;
  }

  // Talk of the Town parsing helper methods  
  private mapTottRuleType(tottType: string): 'trigger' | 'volition' | 'trait' | 'default' | 'pattern' | 'genealogy' {
    switch (tottType.toLowerCase()) {
      case 'genealogy': return 'genealogy';
      case 'trigger': return 'trigger';
      case 'trait': return 'trait';
      case 'pattern': return 'pattern';
      case 'volition': return 'volition';
      default: return 'default';
    }
  }

  private mapTottCategory(category: string): 'trigger' | 'volition' | 'trait' | 'default' | 'pattern' | 'genealogy' {
    if (category.includes('genealogy')) return 'genealogy';
    if (category.includes('trigger')) return 'trigger';
    if (category.includes('character')) return 'trait';
    return 'default';
  }

  private parseTottConditions(conditions: any[]): Condition[] {
    return conditions.map(cond => {
      if (typeof cond === 'string') {
        return {
          type: 'predicate' as const,
          predicate: cond
        };
      } else if (cond.type && cond.predicate) {
        return {
          type: cond.type,
          predicate: cond.predicate,
          first: cond.first,
          second: cond.second,
          operator: cond.operator,
          value: cond.value
        };
      } else {
        return {
          type: 'predicate' as const,
          predicate: JSON.stringify(cond)
        };
      }
    });
  }

  private parseTottEffects(effects: any[]): Effect[] {
    return effects.map(eff => {
      if (typeof eff === 'string') {
        return {
          type: 'call' as const,
          target: eff,
          action: eff
        };
      } else if (eff.type && eff.action) {
        return {
          type: eff.type,
          target: eff.target || eff.action,
          action: eff.action,
          value: eff.value,
          parameters: eff.parameters
        };
      } else {
        return {
          type: 'call' as const,
          target: JSON.stringify(eff),
          action: 'execute'
        };
      }
    });
  }

  private parseTottPythonConditions(pythonCode: string): Condition[] {
    const conditions: Condition[] = [];
    
    // Look for if statements and function calls
    const ifMatches = pythonCode.match(/if\s+([^:]+):/g);
    if (ifMatches) {
      ifMatches.forEach(match => {
        const condition = match.replace('if ', '').replace(':', '').trim();
        conditions.push({
          type: 'predicate',
          predicate: condition
        });
      });
    }
    
    // Look for function calls that might be conditions
    const functionMatches = pythonCode.match(/(\w+)\([^)]*\)/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        if (!match.includes('print') && !match.includes('return')) {
          conditions.push({
            type: 'predicate',
            predicate: match
          });
        }
      });
    }
    
    return conditions;
  }

  private parseTottPythonEffects(pythonCode: string): Effect[] {
    const effects: Effect[] = [];
    
    // Look for assignment statements
    const assignMatches = pythonCode.match(/(\w+)\s*=\s*([^;\n]+)/g);
    if (assignMatches) {
      assignMatches.forEach(match => {
        const [target, value] = match.split('=').map(s => s.trim());
        effects.push({
          type: 'set',
          target: target,
          action: 'assign',
          value: value
        });
      });
    }
    
    // Look for function calls that are effects
    const callMatches = pythonCode.match(/(\w+)\([^)]*\)/g);
    if (callMatches) {
      callMatches.forEach(match => {
        const functionName = match.split('(')[0];
        if (!['if', 'for', 'while', 'return', 'print'].includes(functionName)) {
          effects.push({
            type: 'call',
            target: functionName,
            action: match
          });
        }
      });
    }
    
    return effects;
  }
}