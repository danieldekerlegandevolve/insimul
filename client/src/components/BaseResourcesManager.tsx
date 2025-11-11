import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, CheckSquare, Square, AlertCircle } from "lucide-react";

interface BaseResource {
  id: string;
  name: string;
  description?: string;
  category?: string;
  ruleType?: string;
  actionType?: string;
  sourceFormat?: string;
  tags?: string[];
}

interface BaseResourcesManagerProps {
  resources: BaseResource[];
  resourceType: 'rule' | 'action';
  icon: React.ReactNode;
  onRefresh: () => void;
}

export function BaseResourcesManager({ resources, resourceType, icon, onRefresh }: BaseResourcesManagerProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<BaseResource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === resources.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(resources.map(r => r.id)));
    }
  };

  const handleDeleteSingle = async (resource: BaseResource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSingle = async () => {
    if (!resourceToDelete) return;

    setDeleting(true);
    try {
      const endpoint = resourceType === 'rule' ? '/api/rules' : '/api/actions';
      const response = await fetch(`${endpoint}/${resourceToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Deleted ${resourceType} "${resourceToDelete.name}"`
        });
        setDeleteDialogOpen(false);
        setResourceToDelete(null);
        onRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to delete ${resourceType}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;

    try {
      const endpoint = resourceType === 'rule' ? '/api/rules' : '/api/actions';
      
      for (const id of idsToDelete) {
        try {
          const response = await fetch(`${endpoint}/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      toast({
        title: successCount > 0 ? "Bulk Delete Complete" : "Bulk Delete Failed",
        description: `Deleted ${successCount} ${resourceType}${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 && successCount === 0 ? "destructive" : "default"
      });

      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to complete bulk delete`,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No base {resourceType}s found</p>
        <p className="text-sm mt-2">
          Create base {resourceType}s through the Import Data modal or Create New {resourceType === 'rule' ? 'Rule' : 'Action'} dialog
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Bulk Actions Bar */}
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === resources.length ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              {selectedIds.size === resources.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} of {resources.length} selected
            </span>
          </div>

          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
        </div>

        {/* Resource List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedIds.has(resource.id)}
                        onCheckedChange={() => toggleSelection(resource.id)}
                      />
                    </div>

                    {/* Icon */}
                    <div className="pt-1">{icon}</div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-medium">{resource.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              🌐 Global
                            </Badge>
                            {resource.sourceFormat && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.sourceFormat}
                              </Badge>
                            )}
                            {resource.category && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.category}
                              </Badge>
                            )}
                            {resource.ruleType && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.ruleType}
                              </Badge>
                            )}
                            {resource.actionType && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.actionType}
                              </Badge>
                            )}
                          </div>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {resource.description}
                            </p>
                          )}
                          {resource.tags && resource.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {resource.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSingle(resource)}
                          disabled={deleting}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Base {resourceType === 'rule' ? 'Rule' : 'Action'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resourceToDelete?.name}"? This will remove it from all worlds that use this base {resourceType}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSingle}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Base {resourceType === 'rule' ? 'Rules' : 'Actions'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} base {resourceType}{selectedIds.size !== 1 ? 's' : ''}? 
              This will remove them from all worlds that use these base {resourceType}s.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : `Delete ${selectedIds.size} ${resourceType}${selectedIds.size !== 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
