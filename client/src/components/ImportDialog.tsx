import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { SystemType } from '@/lib/editor-types';
import { InsimulRuleCompiler } from '@/lib/unified-syntax';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onImportComplete: () => void;
}

interface FileImport {
  file: File;
  content: string;
  format: SystemType;
  type: 'rules' | 'characters' | 'actions' | 'truth';
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

export function ImportDialog({
  open,
  onOpenChange,
  worldId,
  onImportComplete
}: ImportDialogProps) {
  const [importFormat, setImportFormat] = useState<SystemType>('insimul');
  const [importContent, setImportContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileImport[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState<'rules' | 'characters' | 'actions' | 'truth'>('rules');
  const [isBaseResource, setIsBaseResource] = useState(false);
  const [parseResults, setParseResults] = useState<{ rules: number; characters: number; actions: number; truths: number } | null>(null);
  const { toast } = useToast();
  const ruleCompiler = new InsimulRuleCompiler();

  const formatOptions = [
    { value: 'insimul', label: 'Insimul Format', description: 'Unified narrative simulation syntax' },
    { value: 'ensemble', label: 'Ensemble JSON', description: 'Social simulation rules as JSON' },
    { value: 'kismet', label: 'Kismet Prolog', description: 'Prolog-style social rules' },
    { value: 'tott', label: 'Talk of the Town Python', description: 'Python classes and methods' }
  ];

  const detectFileTypeAndFormat = (fileName: string): { type: 'rules' | 'characters' | 'actions' | 'truth', format: SystemType } => {
    const lowerName = fileName.toLowerCase();
    const extension = lowerName.split('.').pop();
    
    // Detect type from filename with improved pattern matching
    if (lowerName.includes('cast') || lowerName.includes('character') || lowerName.includes('people')) {
      return { type: 'characters', format: 'ensemble' };
    } else if (lowerName.includes('action') || lowerName.includes('behavior') || lowerName.includes('interaction')) {
      return { type: 'actions', format: 'ensemble' };
    } else if (lowerName.includes('history') || lowerName.includes('truth') || lowerName.includes('event')) {
      return { type: 'truth', format: 'ensemble' };
    } else {
      // Default to rules (will be refined by content detection if JSON)
      let format: SystemType = 'insimul';
      if (extension === 'insimul') format = 'insimul';
      else if (extension === 'json' || extension === 'ens') format = 'ensemble';
      else if (extension === 'lp' || extension === 'kis') format = 'kismet';
      else if (extension === 'py') format = 'tott';
      return { type: 'rules', format };
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileImports: FileImport[] = [];
    
    // Read all files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let { type, format } = detectFileTypeAndFormat(file.name);
      
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        
        // Refine type detection based on content (JSON files only)
        if (format === 'ensemble' && type === 'rules') {
          try {
            const parsed = JSON.parse(content);
            // Check if it's actually an actions file
            if (parsed.actions && Array.isArray(parsed.actions)) {
              type = 'actions';
              console.log(`Detected ${file.name} as actions based on content structure`);
            }
            // Check if it's a cast/characters file
            else if (parsed.cast || (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0 && typeof Object.values(parsed)[0] === 'object')) {
              type = 'characters';
              console.log(`Detected ${file.name} as characters based on content structure`);
            }
            // Check if it's a history/truth file
            else if (parsed.history && Array.isArray(parsed.history)) {
              type = 'truth';
              console.log(`Detected ${file.name} as truth based on content structure`);
            }
          } catch {
            // Not JSON or parsing failed, keep as rules
          }
        }
        
        fileImports.push({
          file,
          content,
          format,
          type,
          status: 'pending'
        });
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
        toast({
          title: 'File Read Error',
          description: `Failed to read ${file.name}`,
          variant: 'destructive'
        });
      }
    }
    
    setSelectedFiles(fileImports);
    
    // If only one file, also set the content for paste preview
    if (fileImports.length === 1) {
      setImportContent(fileImports[0].content);
      setImportFormat(fileImports[0].format);
      setImportType(fileImports[0].type);
    } else {
      // Clear paste content when multiple files selected
      setImportContent('');
    }
    
    toast({
      title: 'Files Loaded',
      description: `${fileImports.length} file(s) ready to import`
    });
  };

  const handlePreview = () => {
    try {
      let results = { rules: 0, characters: 0, actions: 0, truths: 0 };

      if (importType === 'characters') {
        // Parse Ensemble cast file
        const castData = JSON.parse(importContent);
        const characterNames = Object.keys(castData);
        results.characters = characterNames.length;

        toast({
          title: 'Content Parsed',
          description: `Found ${results.characters} characters ready to import`
        });
      } else if (importType === 'actions') {
        // Parse Ensemble actions file
        const actionsData = JSON.parse(importContent);
        results.actions = actionsData.actions?.length || 0;

        toast({
          title: 'Content Parsed',
          description: `Found ${results.actions} ${isBaseResource ? 'base ' : ''}actions ready to import`
        });
      } else if (importType === 'truth') {
        // Parse Ensemble history/truth file
        const truthData = JSON.parse(importContent);

        // Handle Ensemble history format: { history: [{ pos: 0, data: [...] }] }
        let truthCount = 0;
        if (truthData.history && Array.isArray(truthData.history)) {
          // Count total data items across all history entries
          truthCount = truthData.history.reduce((sum: number, entry: any) => {
            return sum + (Array.isArray(entry.data) ? entry.data.length : 0);
          }, 0);
        } else if (Array.isArray(truthData)) {
          truthCount = truthData.length;
        }

        results.truths = truthCount;

        toast({
          title: 'Content Parsed',
          description: `Found ${results.truths} Truths ready to import`
        });
      } else {
        // Parse rules
        const parsedRules = ruleCompiler.compile(importContent, importFormat);
        results.rules = parsedRules.length;
        
        toast({
          title: 'Content Parsed',
          description: `Found ${results.rules} ${isBaseResource ? 'base ' : ''}rules ready to import`
        });
      }
      
      setParseResults(results);
    } catch (error) {
      toast({
        title: 'Parse Error',
        description: error instanceof Error ? error.message : 'Failed to parse content',
        variant: 'destructive'
      });
    }
  };

  const importSingleContent = async (content: string, type: 'rules' | 'characters' | 'actions' | 'truth', format: SystemType): Promise<{ success: boolean, count: number, message?: string }> => {

    try {
      if (type === 'characters') {
        // Import Ensemble cast file
        const castData = JSON.parse(content);
        const characterNames = Object.keys(castData);
        
        if (characterNames.length === 0) {
          throw new Error('No characters found in the cast file');
        }

        // Create characters in the database
        let successCount = 0;
        for (const fullName of characterNames) {
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || nameParts[0];
          
          const response = await fetch('/api/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              worldId: worldId,
              firstName: firstName,
              lastName: lastName,
              gender: 'unknown',
              age: null
            })
          });

          if (response.ok) successCount++;
        }

        return { success: true, count: successCount, message: `Imported ${successCount} of ${characterNames.length} characters` };

      } else if (type === 'actions') {
        // Import actions
        const actionsData = JSON.parse(content);
        const actions = actionsData.actions || [];
        
        if (actions.length === 0) {
          throw new Error('No actions found in the file');
        }

        // Create actions in the database (base or world-specific)
        const endpoint = '/api/actions';
        let successCount = 0;
        for (const action of actions) {
          const body: any = {
            name: action.name || action.displayName || 'Unnamed Action',
            description: action.displayName || action.name,
            actionType: action.type || 'social',
            category: action.category || null,
            sourceFormat: 'ensemble',
            prerequisites: action.conditions || [],
            effects: action.effects || [],
            energyCost: action.energyCost || null,
            cooldown: action.cooldown || null,
            targetType: action.targetType || null,
            customData: action,
            isBase: isBaseResource
          };
          
          // Only add worldId for non-base actions
          if (!isBaseResource) {
            body.worldId = worldId;
          }
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (response.ok) successCount++;
        }

        return { success: true, count: successCount, message: `Imported ${successCount} of ${actions.length} ${isBaseResource ? 'base ' : ''}actions` };

      } else if (type === 'truth') {
        // Import Ensemble history/truth file
        const truthData = JSON.parse(content);

        // Validate that we have truth data in some format
        const hasHistoryFormat = truthData.history && Array.isArray(truthData.history);
        const hasDirectArray = Array.isArray(truthData);

        if (!hasHistoryFormat && !hasDirectArray) {
          throw new Error('No Truths found in the file');
        }

        const response = await fetch(`/api/worlds/${worldId}/truth/import-ensemble`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });

        if (!response.ok) {
          throw new Error('Failed to import Truths');
        }

        const result = await response.json();

        return { success: true, count: result.count, message: `Imported ${result.count} Truths` };

      } else {
        // Import rules - create individual rules (base or world-specific)
        const parsedRules = ruleCompiler.compile(content, format);

        if (parsedRules.length === 0) {
          throw new Error('No valid rules found in the content');
        }

        // Create individual rules in the database
        const endpoint = '/api/rules';
        let successCount = 0;
        for (const parsedRule of parsedRules) {
          try {
            const body: any = {
              name: parsedRule.name,
              content, // Store original content for reference
              sourceFormat: format,
              ruleType: parsedRule.ruleType || 'trigger',
              priority: parsedRule.priority || 5,
              likelihood: parsedRule.likelihood || 1.0,
              conditions: parsedRule.conditions || [],
              effects: parsedRule.effects || [],
              tags: parsedRule.tags || [],
              dependencies: parsedRule.dependencies || [],
              isActive: true,
              isCompiled: false,
              compiledOutput: {},
              isBase: isBaseResource
            };
            
            // Only add worldId for non-base rules
            if (!isBaseResource) {
              body.worldId = worldId;
            }
            
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });

            if (response.ok) successCount++;
          } catch (error) {
            console.error(`Failed to import ${isBaseResource ? 'base ' : ''}rule ${parsedRule.name}:`, error);
          }
        }

        return { success: true, count: successCount, message: `Imported ${successCount} of ${parsedRules.length} ${isBaseResource ? 'base ' : ''}rules` };
      }
    } catch (error) {
      return { success: false, count: 0, message: error instanceof Error ? error.message : 'Import failed' };
    }
  };

  const handleImport = async () => {
    // Check if we have either pasted content or selected files
    if (!importContent.trim() && selectedFiles.length === 0) {
      toast({
        title: 'No Content',
        description: 'Please paste content or upload files to import',
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);

    try {
      // If we have pasted content, import that
      if (importContent.trim() && selectedFiles.length === 0) {
        const result = await importSingleContent(importContent, importType, importFormat);
        
        if (result.success) {
          toast({
            title: 'Import Successful',
            description: result.message
          });
          setImportContent('');
          setParseResults(null);
          onImportComplete();
          onOpenChange(false);
        } else {
          throw new Error(result.message);
        }
      } 
      // If we have selected files, import each one
      else if (selectedFiles.length > 0) {
        let totalSuccess = 0;
        let totalFailed = 0;
        const updatedFiles = [...selectedFiles];
        
        for (let i = 0; i < updatedFiles.length; i++) {
          const fileImport = updatedFiles[i];
          updatedFiles[i].status = 'processing';
          setSelectedFiles([...updatedFiles]);
          
          const result = await importSingleContent(fileImport.content, fileImport.type, fileImport.format);
          
          if (result.success) {
            updatedFiles[i].status = 'success';
            updatedFiles[i].message = result.message;
            totalSuccess++;
          } else {
            updatedFiles[i].status = 'error';
            updatedFiles[i].message = result.message;
            totalFailed++;
          }
          
          setSelectedFiles([...updatedFiles]);
        }
        
        toast({
          title: 'Batch Import Complete',
          description: `Successfully imported ${totalSuccess} file(s). ${totalFailed > 0 ? `${totalFailed} failed.` : ''}`
        });
        
        // Reset if all successful
        if (totalFailed === 0) {
          setSelectedFiles([]);
          onImportComplete();
          onOpenChange(false);
        }
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import content',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedFormat = formatOptions.find(option => option.value === importFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" data-testid="import-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </DialogTitle>
          <DialogDescription>
            Import rules, characters, and actions from various formats. Mark rules/actions as base resources to make them globally available.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Import Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="import-type">Import Type</Label>
            <Select value={importType} onValueChange={(value: 'rules' | 'characters' | 'actions' | 'truth') => setImportType(value)} data-testid="select-import-type">
              <SelectTrigger>
                <SelectValue placeholder="Select what to import" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rules">
                  <div className="flex flex-col">
                    <span className="font-medium">Rules</span>
                    <span className="text-sm text-muted-foreground">Social simulation rules</span>
                  </div>
                </SelectItem>
                <SelectItem value="characters">
                  <div className="flex flex-col">
                    <span className="font-medium">Characters (Cast)</span>
                    <span className="text-sm text-muted-foreground">Ensemble cast file</span>
                  </div>
                </SelectItem>
                <SelectItem value="actions">
                  <div className="flex flex-col">
                    <span className="font-medium">Actions</span>
                    <span className="text-sm text-muted-foreground">Ensemble actions file</span>
                  </div>
                </SelectItem>
                <SelectItem value="truth">
                  <div className="flex flex-col">
                    <span className="font-medium">Truth (History)</span>
                    <span className="text-sm text-muted-foreground">Ensemble history/truth file</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Base Resource Checkbox (only for rules and actions) */}
          {(importType === 'rules' || importType === 'actions') && (
            <div className="flex items-center space-x-2">
              <input
                id="is-base-resource"
                type="checkbox"
                checked={isBaseResource}
                onChange={(e) => setIsBaseResource(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <Label htmlFor="is-base-resource" className="cursor-pointer">
                Import as Base Resource (global, available to all worlds)
              </Label>
            </div>
          )}

          {/* Import Format Selection (only for rules) */}
          {importType === 'rules' && (
            <div className="space-y-2">
              <Label htmlFor="import-format">Import Format</Label>
              <Select value={importFormat} onValueChange={(value: SystemType) => setImportFormat(value)} data-testid="select-import-format">
                <SelectTrigger>
                  <SelectValue placeholder="Select import format" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} data-testid={`format-option-${option.value}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFormat && (
                <p className="text-sm text-muted-foreground">{selectedFormat.description}</p>
              )}
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload File(s)</Label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".insimul,.json,.ens,.lp,.kis,.py,.txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-950 dark:file:text-blue-300"
              data-testid="input-file-upload"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm font-medium">Selected Files ({selectedFiles.length}):</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedFiles.map((fileImport, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{fileImport.file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">({fileImport.type})</span>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {fileImport.status === 'pending' && <span className="text-xs text-muted-foreground">Pending</span>}
                        {fileImport.status === 'processing' && <span className="text-xs text-blue-600">Processing...</span>}
                        {fileImport.status === 'success' && <span className="text-xs text-green-600">✓ Success</span>}
                        {fileImport.status === 'error' && <span className="text-xs text-red-600">✗ Error</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  className="text-xs"
                >
                  Clear Files
                </Button>
              </div>
            )}
          </div>

          {/* Content Input (only shown if no files selected) */}
          {selectedFiles.length === 0 && (
            <div className="space-y-2">
              <Label htmlFor="import-content">Or Paste Content</Label>
              <Textarea
                id="import-content"
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                placeholder={`Paste your ${importFormat} format content here...`}
                className="min-h-[300px] font-mono text-sm"
                data-testid="textarea-import-content"
              />
            </div>
          )}

          {/* Parse Results */}
          {parseResults && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Ready to import: <strong>{parseResults.rules} rules</strong>
                {parseResults.characters > 0 && `, ${parseResults.characters} characters`}
                {parseResults.actions > 0 && `, ${parseResults.actions} actions`}
                {parseResults.truths > 0 && `, ${parseResults.truths} Truths`}
              </AlertDescription>
            </Alert>
          )}

          {/* Import Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handlePreview} 
              variant="outline"
              disabled={!importContent.trim() || isImporting}
              data-testid="button-preview-import"
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={(!importContent.trim() && selectedFiles.length === 0) || isImporting}
              data-testid="button-import"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? (selectedFiles.length > 1 ? 'Importing Files...' : 'Importing...') : `Import ${selectedFiles.length > 1 ? `${selectedFiles.length} Files` : ''}`}
            </Button>
          </div>

          {/* Help Text */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Supported formats:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Rules:</strong> Insimul (.insimul), Ensemble (.json), Kismet (.lp), TotT (.py)</li>
                <li><strong>Characters:</strong> Ensemble cast files (.json) with character names</li>
                <li><strong>Actions:</strong> Ensemble actions files (.json) with action definitions</li>
                <li><strong>Truth:</strong> Ensemble history files (.json) with past/present/future events</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Multiple Files:</strong> Select multiple files to batch import. Each file will be processed sequentially with progress tracking.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <strong>Base Resources:</strong> Check "Import as Base Resource" for rules/actions to make them globally available across all worlds. Otherwise, they'll be specific to the current world.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
