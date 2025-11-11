import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { InsimulRuleCompiler } from '@/lib/unified-syntax';
import { RuleExporter } from '@/lib/rule-exporter';
import type { SystemType } from '@/lib/unified-syntax';

interface RuleConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: {
    id: string;
    name: string;
    content: string;
    sourceFormat: SystemType;
  };
  onConvert: (ruleId: string, newContent: string, newSystemType: SystemType) => void;
}

export function RuleConvertDialog({ open, onOpenChange, rule, onConvert }: RuleConvertDialogProps) {
  const [targetFormat, setTargetFormat] = useState<SystemType>('insimul');
  const [convertedContent, setConvertedContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  const formatOptions = [
    { value: 'insimul', label: 'Insimul' },
    { value: 'ensemble', label: 'Ensemble JSON' },
    { value: 'kismet', label: 'Kismet Prolog' },
    { value: 'tott', label: 'Talk of the Town JSON' },
  ];

  const handlePreview = () => {
    setIsConverting(true);
    setError('');
    setConvertedContent('');

    try {
      const compiler = new InsimulRuleCompiler();
      const exporter = new RuleExporter();

      // Parse the current rule
      const parsedRules = compiler.compile(rule.content, rule.sourceFormat);
      
      if (parsedRules.length === 0) {
        setError(`Could not parse rule as ${rule.sourceFormat} format. Please check the syntax.`);
        setIsConverting(false);
        return;
      }

      // Convert to target format
      const converted = exporter.exportToFormat(parsedRules, targetFormat, false, []);
      setConvertedContent(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert rule');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvert = () => {
    if (!convertedContent) {
      handlePreview();
      return;
    }

    onConvert(rule.id, convertedContent, targetFormat);
    onOpenChange(false);
    // Reset state
    setConvertedContent('');
    setError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setConvertedContent('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Convert Rule Format
          </DialogTitle>
          <DialogDescription>
            Convert "{rule.name}" from {rule.sourceFormat} to another format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="target-format">Target Format</Label>
            <Select value={targetFormat} onValueChange={(value: SystemType) => setTargetFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select target format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions
                  .filter(option => option.value !== rule.sourceFormat) // Don't show current format
                  .map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Button */}
          <Button
            onClick={handlePreview}
            disabled={isConverting || targetFormat === rule.sourceFormat}
            className="w-full"
            variant="outline"
          >
            {isConverting ? 'Converting...' : 'Preview Conversion'}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Original Content */}
          <div className="space-y-2">
            <Label>Original ({rule.sourceFormat})</Label>
            <pre className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-auto max-h-[200px] text-sm">
              {rule.content}
            </pre>
          </div>

          {/* Converted Content */}
          {convertedContent && (
            <div className="space-y-2">
              <Label>Converted ({targetFormat})</Label>
              <pre className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg overflow-auto max-h-[200px] text-sm">
                {convertedContent}
              </pre>
            </div>
          )}

          {/* Conversion Info */}
          {convertedContent && (
            <Alert>
              <AlertDescription>
                <strong>Note:</strong> This will replace the rule's content and change its system type to {targetFormat}.
                You can undo this by converting back or restoring from a backup.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!convertedContent || isConverting}
          >
            {convertedContent ? 'Apply Conversion' : 'Preview First'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
