import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, Map, MapPin, Building, Plus, ChevronRight, Trash2, Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface CountryDetailViewProps {
  country: any;
  states: any[];
  settlements: any[];
  onSelectState: (state: any) => void;
  onSelectSettlement: (settlement: any) => void;
  onAddState: () => void;
  onAddSettlement: () => void;
  canEdit?: boolean;
  onDeleteCountry?: () => void;
  onDeleteState?: (stateId: string) => void;
  onDeleteSettlement?: (settlementId: string) => void;
  onBulkDeleteStates?: (stateIds: string[]) => void;
  onBulkDeleteSettlements?: (settlementIds: string[]) => void;
}

export function CountryDetailView({
  country,
  states,
  settlements,
  onSelectState,
  onSelectSettlement,
  onAddState,
  onAddSettlement,
  canEdit = true,
  onDeleteCountry,
  onDeleteState,
  onDeleteSettlement,
  onBulkDeleteStates,
  onBulkDeleteSettlements
}: CountryDetailViewProps) {
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [selectedSettlements, setSelectedSettlements] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [deleteCountryConfirmOpen, setDeleteCountryConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'state' | 'settlement' } | null>(null);
  const [bulkDeleteType, setBulkDeleteType] = useState<'states' | 'settlements' | null>(null);

  const toggleStateSelection = (stateId: string) => {
    const newSelection = new Set(selectedStates);
    if (newSelection.has(stateId)) {
      newSelection.delete(stateId);
    } else {
      newSelection.add(stateId);
    }
    setSelectedStates(newSelection);
  };

  const toggleSettlementSelection = (settlementId: string) => {
    const newSelection = new Set(selectedSettlements);
    if (newSelection.has(settlementId)) {
      newSelection.delete(settlementId);
    } else {
      newSelection.add(settlementId);
    }
    setSelectedSettlements(newSelection);
  };

  const toggleAllStates = () => {
    if (selectedStates.size === states.length) {
      setSelectedStates(new Set());
    } else {
      setSelectedStates(new Set(states.map(s => s.id)));
    }
  };

  const toggleAllSettlements = () => {
    if (selectedSettlements.size === settlements.length) {
      setSelectedSettlements(new Set());
    } else {
      setSelectedSettlements(new Set(settlements.map(s => s.id)));
    }
  };

  const handleDeleteClick = (item: { id: string; name: string; type: 'state' | 'settlement' }) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleBulkDeleteClick = (type: 'states' | 'settlements') => {
    setBulkDeleteType(type);
    setBulkDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'state' && onDeleteState) {
        onDeleteState(itemToDelete.id);
      } else if (itemToDelete.type === 'settlement' && onDeleteSettlement) {
        onDeleteSettlement(itemToDelete.id);
      }
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const confirmBulkDelete = () => {
    if (bulkDeleteType === 'states' && onBulkDeleteStates) {
      onBulkDeleteStates(Array.from(selectedStates));
      setSelectedStates(new Set());
    } else if (bulkDeleteType === 'settlements' && onBulkDeleteSettlements) {
      onBulkDeleteSettlements(Array.from(selectedSettlements));
      setSelectedSettlements(new Set());
    }
    setBulkDeleteConfirmOpen(false);
    setBulkDeleteType(null);
  };

  return (
    <div className="space-y-6">
      {/* Country Info Card */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{country.name}</CardTitle>
                <CardDescription className="mt-1">{country.description}</CardDescription>
              </div>
            </div>
            {onDeleteCountry && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCountryConfirmOpen(true)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={!canEdit}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Country
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!canEdit && (
                    <TooltipContent>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        <span>Only the world owner can delete countries</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Government</span>
              <p className="font-semibold">{country.governmentType || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Economy</span>
              <p className="font-semibold">{country.economicSystem || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Founded</span>
              <p className="font-semibold">{country.foundedYear || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Status</span>
              <p className="font-semibold">{country.isActive ? '✓ Active' : 'Dissolved'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* States & Provinces Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            States & Provinces ({states.length})
          </h3>
          <div className="flex gap-2">
            {states.length > 0 && onBulkDeleteStates && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllStates}
              >
                {selectedStates.size === states.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
            {selectedStates.size > 0 && onBulkDeleteStates && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkDeleteClick('states')}
                disabled={!canEdit}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedStates.size}
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button onClick={onAddState} size="sm" disabled={!canEdit}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add State
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canEdit && (
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      <span>Only the world owner can add states</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid gap-4">
          {states.map((state) => (
            <Card
              key={state.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => onSelectState(state)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {onBulkDeleteStates && (
                      <Checkbox
                        checked={selectedStates.has(state.id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleStateSelection(state.id)}
                      />
                    )}
                    <Building className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">{state.name}</h4>
                      <p className="text-sm text-muted-foreground">{state.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onDeleteState && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick({ id: state.id, name: state.name, type: 'state' });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Settlements Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Settlements ({settlements.length})
          </h3>
          <div className="flex gap-2">
            {settlements.length > 0 && onBulkDeleteSettlements && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllSettlements}
              >
                {selectedSettlements.size === settlements.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
            {selectedSettlements.size > 0 && onBulkDeleteSettlements && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkDeleteClick('settlements')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedSettlements.size}
              </Button>
            )}
            <Button onClick={onAddSettlement} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Settlement
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {settlements.map((settlement) => (
            <Card
              key={settlement.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => onSelectSettlement(settlement)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {onBulkDeleteSettlements && (
                      <Checkbox
                        checked={selectedSettlements.has(settlement.id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleSettlementSelection(settlement.id)}
                      />
                    )}
                    <MapPin className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{settlement.name}</CardTitle>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                      {settlement.settlementType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onDeleteSettlement && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick({ id: settlement.id, name: settlement.name, type: 'settlement' });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Pop: {settlement.population?.toLocaleString() || 0}</span>
                  {settlement.terrain && <span>{settlement.terrain}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'state' ? 'State' : 'Settlement'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
              This will permanently remove the {itemToDelete?.type} and all associated data.
              <p className="mt-2 text-destructive font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {itemToDelete?.type === 'state' ? 'State' : 'Settlement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple {bulkDeleteType === 'states' ? 'States' : 'Settlements'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>
                {bulkDeleteType === 'states' ? selectedStates.size : selectedSettlements.size}
              </strong> {bulkDeleteType === 'states' ? 'state(s)' : 'settlement(s)'}?
              This will permanently remove all selected items and their associated data.
              <p className="mt-2 text-destructive font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {bulkDeleteType === 'states' ? selectedStates.size : selectedSettlements.size} {bulkDeleteType === 'states' ? 'State(s)' : 'Settlement(s)'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Country Confirmation Dialog */}
      <AlertDialog open={deleteCountryConfirmOpen} onOpenChange={setDeleteCountryConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Country?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{country.name}</strong>?
              <p className="mt-2">This will also permanently delete:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All {states.length} state(s) in this country</li>
                <li>All {settlements.length} settlement(s) in this country</li>
                <li>All associated data</li>
              </ul>
              <p className="mt-2 text-destructive font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDeleteCountry?.();
                setDeleteCountryConfirmOpen(false);
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Country
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
