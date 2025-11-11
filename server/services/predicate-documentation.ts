import { PredicateDiscoveryService } from './predicate-discovery.js';

/**
 * Documentation export formats
 */
export type DocFormat = 'markdown' | 'html' | 'json';

/**
 * Documentation Exporter - Generates documentation from predicate schema
 */
export class PredicateDocumentationExporter {
  constructor(private discoveryService: PredicateDiscoveryService) {}

  /**
   * Export all predicates as documentation
   */
  async exportDocumentation(format: DocFormat = 'markdown', worldId?: string): Promise<string> {
    await this.discoveryService.initialize();
    const predicates = await this.discoveryService.getAllPredicates();

    // Filter by world if specified
    const filtered = worldId
      ? predicates.filter(p => {
          // Include all core predicates plus discovered ones from this world
          return p.source === 'core' || 
            (p.source === 'discovered' && (p as any).discoveredFrom?.some((r: string) => r.startsWith(worldId)));
        })
      : predicates;

    switch (format) {
      case 'markdown':
        return this.generateMarkdown(filtered);
      case 'html':
        return this.generateHTML(filtered);
      case 'json':
        return this.generateJSON(filtered);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdown(predicates: any[]): string {
    const lines: string[] = [];
    
    lines.push('# Predicate Reference');
    lines.push('');
    lines.push('Auto-generated documentation for all available predicates.');
    lines.push('');

    // Group by category
    const byCategory = new Map<string, any[]>();
    for (const pred of predicates) {
      const cat = pred.category || 'uncategorized';
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat)!.push(pred);
    }

    // Sort categories
    const categories = Array.from(byCategory.keys()).sort();

    for (const category of categories) {
      const preds = byCategory.get(category)!;
      
      lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}`);
      lines.push('');

      // Sort predicates within category
      preds.sort((a, b) => a.name.localeCompare(b.name));

      for (const pred of preds) {
        lines.push(`### \`${pred.name}/${pred.arity}\``);
        lines.push('');

        if (pred.description) {
          lines.push(pred.description);
          lines.push('');
        }

        // Source badge
        lines.push(`**Source:** ${pred.source}${pred.builtIn ? ' (built-in)' : ''}`);
        lines.push('');

        // Arguments
        if (pred.args && pred.args.length > 0) {
          lines.push('**Arguments:**');
          for (const arg of pred.args) {
            lines.push(`- \`${arg.name}\` (${arg.type})${arg.description ? `: ${arg.description}` : ''}`);
          }
          lines.push('');
        }

        // Usage statistics
        if (pred.usageCount) {
          lines.push(`**Usage Count:** ${pred.usageCount}`);
          if (pred.confidence) {
            lines.push(`**Confidence:** ${pred.confidence}`);
          }
          lines.push('');
        }

        // Examples
        if (pred.examples && pred.examples.length > 0) {
          lines.push('**Examples:**');
          lines.push('```prolog');
          pred.examples.slice(0, 3).forEach((ex: string) => lines.push(ex));
          lines.push('```');
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }

    // Add metadata footer
    lines.push('');
    lines.push('---');
    lines.push(`Generated on: ${new Date().toISOString()}`);
    lines.push(`Total predicates: ${predicates.length}`);

    return lines.join('\n');
  }

  /**
   * Generate HTML documentation
   */
  private generateHTML(predicates: any[]): string {
    const htmlLines: string[] = [];
    
    htmlLines.push('<!DOCTYPE html>');
    htmlLines.push('<html lang="en">');
    htmlLines.push('<head>');
    htmlLines.push('<meta charset="UTF-8">');
    htmlLines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    htmlLines.push('<title>Predicate Reference</title>');
    htmlLines.push('<style>');
    htmlLines.push('body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; }');
    htmlLines.push('h1 { color: #2563eb; }');
    htmlLines.push('h2 { color: #1e40af; margin-top: 40px; }');
    htmlLines.push('h3 { color: #1e3a8a; }');
    htmlLines.push('code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: "Courier New", monospace; }');
    htmlLines.push('.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.875em; font-weight: 500; }');
    htmlLines.push('.badge-core { background: #dbeafe; color: #1e40af; }');
    htmlLines.push('.badge-discovered { background: #fef3c7; color: #92400e; }');
    htmlLines.push('.badge-high { background: #d1fae5; color: #065f46; }');
    htmlLines.push('.badge-medium { background: #fed7aa; color: #9a3412; }');
    htmlLines.push('.badge-low { background: #e5e7eb; color: #374151; }');
    htmlLines.push('pre { background: #1f2937; color: #f9fafb; padding: 16px; border-radius: 6px; overflow-x: auto; }');
    htmlLines.push('</style>');
    htmlLines.push('</head>');
    htmlLines.push('<body>');
    htmlLines.push('<h1>Predicate Reference</h1>');
    htmlLines.push('<p>Auto-generated documentation for all available predicates.</p>');

    // Group by category
    const byCategory = new Map<string, any[]>();
    for (const pred of predicates) {
      const cat = pred.category || 'uncategorized';
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat)!.push(pred);
    }

    const categories = Array.from(byCategory.keys()).sort();

    for (const category of categories) {
      const preds = byCategory.get(category)!;
      htmlLines.push(`<h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>`);

      preds.sort((a, b) => a.name.localeCompare(b.name));

      for (const pred of preds) {
        htmlLines.push(`<h3><code>${pred.name}/${pred.arity}</code></h3>`);
        
        if (pred.description) {
          htmlLines.push(`<p>${pred.description}</p>`);
        }

        htmlLines.push(`<p><span class="badge badge-${pred.source}">${pred.source}</span>`);
        if (pred.confidence) {
          htmlLines.push(` <span class="badge badge-${pred.confidence}">${pred.confidence}</span>`);
        }
        htmlLines.push('</p>');

        if (pred.usageCount) {
          htmlLines.push(`<p><strong>Usage Count:</strong> ${pred.usageCount}</p>`);
        }

        if (pred.args && pred.args.length > 0) {
          htmlLines.push('<p><strong>Arguments:</strong></p>');
          htmlLines.push('<ul>');
          for (const arg of pred.args) {
            htmlLines.push(`<li><code>${arg.name}</code> (${arg.type})${arg.description ? `: ${arg.description}` : ''}</li>`);
          }
          htmlLines.push('</ul>');
        }

        if (pred.examples && pred.examples.length > 0) {
          htmlLines.push('<p><strong>Examples:</strong></p>');
          htmlLines.push('<pre>');
          pred.examples.slice(0, 3).forEach((ex: string) => htmlLines.push(ex));
          htmlLines.push('</pre>');
        }

        htmlLines.push('<hr>');
      }
    }

    htmlLines.push('<p style="margin-top: 40px; color: #6b7280; font-size: 0.875em;">');
    htmlLines.push(`Generated on: ${new Date().toISOString()}<br>`);
    htmlLines.push(`Total predicates: ${predicates.length}`);
    htmlLines.push('</p>');
    htmlLines.push('</body>');
    htmlLines.push('</html>');

    return htmlLines.join('\n');
  }

  /**
   * Generate JSON documentation
   */
  private generateJSON(predicates: any[]): string {
    const doc = {
      meta: {
        generated: new Date().toISOString(),
        totalPredicates: predicates.length
      },
      predicates: predicates.map(p => ({
        name: p.name,
        arity: p.arity,
        description: p.description,
        category: p.category,
        source: p.source,
        builtIn: p.builtIn,
        args: p.args,
        examples: p.examples,
        usageCount: p.usageCount,
        confidence: p.confidence
      }))
    };

    return JSON.stringify(doc, null, 2);
  }
}
