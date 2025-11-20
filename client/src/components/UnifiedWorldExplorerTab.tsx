import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useWorldPermissions } from '@/hooks/use-world-permissions';
import { ArrowLeft, ChevronRight, Plus, Lock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InsertCharacter, Character } from '@shared/schema';

import { CountriesListView } from './characters/CountriesListView';
import { StatesListView } from './characters/StatesListView';
import { SettlementsListView } from './characters/SettlementsListView';
import { CharactersListView } from './characters/CharactersListView';
import { CharacterDetailView } from './characters/CharacterDetailView';
import { CharacterEditDialog } from './CharacterEditDialog';
import { CharacterChatDialog } from './CharacterChatDialog';
import { CountryDialog } from './dialogs/CountryDialog';
import { StateDialog } from './dialogs/StateDialog';
import { SettlementDialog } from './dialogs/SettlementDialog';
import { BusinessDialog } from './dialogs/BusinessDialog';
import { ResidenceDialog } from './dialogs/ResidenceDialog';
import { LotDialog } from './dialogs/LotDialog';
import { CountryDetailView } from './locations/CountryDetailView';
import { StateDetailView } from './locations/StateDetailView';
import { SettlementDetailView } from './locations/SettlementDetailView';

interface UnifiedWorldExplorerTabProps {
  worldId: string;
}

type ViewLevel = 'countries' | 'country-detail' | 'states' | 'state-detail' | 'settlements' | 'settlement-detail' | 'characters' | 'character-detail';

export function UnifiedWorldExplorerTab({ worldId }: UnifiedWorldExplorerTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit, loading: permissionsLoading } = useWorldPermissions(worldId);

  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('countries');
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Data state
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [truths, setTruths] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [residences, setResidences] = useState<any[]>([]);

  // Dialog states
  const [showCountryDialog, setShowCountryDialog] = useState(false);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [showResidenceDialog, setShowResidenceDialog] = useState(false);
  const [showLotDialog, setShowLotDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatCharacter, setChatCharacter] = useState<Character | null>(null);

  // Load initial data
  useEffect(() => {
    if (worldId) {
      fetchCountries();
      fetchAllCharacters();
      fetchTruths();
    }
  }, [worldId]);

  // Fetch functions
  const fetchCountries = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/countries`);
      if (res.ok) setCountries(await res.json());
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchStates = async (countryId: string) => {
    try {
      const res = await fetch(`/api/countries/${countryId}/states`);
      if (res.ok) setStates(await res.json());
    } catch (error) {
      console.error('Failed to fetch states:', error);
    }
  };

  const fetchSettlements = async (countryId?: string, stateId?: string) => {
    try {
      const url = stateId
        ? `/api/states/${stateId}/settlements`
        : countryId
        ? `/api/countries/${countryId}/settlements`
        : `/api/worlds/${worldId}/settlements`;
      const res = await fetch(url);
      if (res.ok) setSettlements(await res.json());
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    }
  };

  const fetchCharacters = async (settlementId: string) => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/characters`);
      if (res.ok) {
        const allChars = await res.json();
        const filtered = allChars.filter((c: any) => c.currentLocation === settlementId);
        setCharacters(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };

  const fetchAllCharacters = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/characters`);
      if (res.ok) setAllCharacters(await res.json());
    } catch (error) {
      console.error('Failed to fetch all characters:', error);
    }
  };

  const fetchTruths = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/truths`);
      if (res.ok) setTruths(await res.json());
    } catch (error) {
      console.error('Failed to fetch truths:', error);
    }
  };

  const fetchLots = async (settlementId: string) => {
    try {
      const res = await fetch(`/api/settlements/${settlementId}/lots`);
      if (res.ok) setLots(await res.json());
    } catch (error) {
      console.error('Failed to fetch lots:', error);
    }
  };

  const fetchBusinesses = async (settlementId: string) => {
    try {
      const res = await fetch(`/api/settlements/${settlementId}/businesses`);
      if (res.ok) setBusinesses(await res.json());
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    }
  };

  const fetchResidences = async (settlementId: string) => {
    try {
      const res = await fetch(`/api/settlements/${settlementId}/residences`);
      if (res.ok) setResidences(await res.json());
    } catch (error) {
      console.error('Failed to fetch residences:', error);
      // Residences might not exist yet, set empty array
      setResidences([]);
    }
  };

  // Character creation mutation
  const createCharacterMutation = useMutation({
    mutationFn: async (data: InsertCharacter) => {
      console.log('UnifiedWorldExplorerTab: Creating character with data:', data);
      console.log('UnifiedWorldExplorerTab: Using worldId:', worldId);
      const response = await apiRequest('POST', `/api/worlds/${worldId}/characters`, data);
      const result = await response.json();
      console.log('UnifiedWorldExplorerTab: Character created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('UnifiedWorldExplorerTab: onSuccess called with data:', data);
      if (selectedSettlement) {
        console.log('UnifiedWorldExplorerTab: Fetching characters for settlement:', selectedSettlement.id);
        fetchCharacters(selectedSettlement.id);
      }
      fetchAllCharacters();
      toast({
        title: "Character created",
        description: "The character was successfully created.",
      });
    },
    onError: (error) => {
      console.error('UnifiedWorldExplorerTab: onError called with error:', error);
      toast({
        title: "Error",
        description: `Failed to create character: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Navigation handlers
  const selectCountry = (country: any) => {
    setSelectedCountry(country);
    fetchStates(country.id);
    fetchSettlements(country.id);
    setViewLevel('country-detail');
  };

  const selectState = (state: any) => {
    setSelectedState(state);
    fetchSettlements(undefined, state.id);
    setViewLevel('state-detail');
  };

  const selectSettlement = (settlement: any) => {
    setSelectedSettlement(settlement);
    fetchCharacters(settlement.id);
    fetchLots(settlement.id);
    fetchBusinesses(settlement.id);
    fetchResidences(settlement.id);
    setViewLevel('settlement-detail');
  };

  const viewCharacters = () => {
    if (selectedSettlement) {
      setViewLevel('characters');
    }
  };

  const selectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setViewLevel('character-detail');
  };

  const goBack = () => {
    if (viewLevel === 'character-detail') {
      setViewLevel('characters');
      setSelectedCharacter(null);
    } else if (viewLevel === 'characters') {
      setViewLevel('settlement-detail');
    } else if (viewLevel === 'settlement-detail') {
      if (selectedState) {
        setViewLevel('state-detail');
        // Refetch state's settlements when going back
        fetchSettlements(undefined, selectedState.id);
      } else if (selectedCountry) {
        setViewLevel('country-detail');
        // Refetch country's settlements when going back
        fetchSettlements(selectedCountry.id);
      }
      setSelectedSettlement(null);
      setCharacters([]);
    } else if (viewLevel === 'state-detail') {
      setSelectedState(null);
      // Refetch country's settlements when going back from state
      if (selectedCountry?.id) {
        fetchSettlements(selectedCountry.id);
      }
      setViewLevel('country-detail');
    } else if (viewLevel === 'country-detail') {
      setViewLevel('countries');
      setSelectedCountry(null);
      setSelectedState(null);
      setStates([]);
      setSettlements([]);
    } else if (viewLevel === 'states') {
      setViewLevel('country-detail');
    } else if (viewLevel === 'settlements') {
      if (selectedState) {
        setViewLevel('state-detail');
      } else {
        setViewLevel('country-detail');
      }
    }
  };

  // Navigation helpers for jumping to specific levels
  const navigateToCountries = () => {
    setViewLevel('countries');
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedSettlement(null);
    setSelectedCharacter(null);
    setStates([]);
    setSettlements([]);
    setCharacters([]);
  };

  const navigateToCountryDetail = () => {
    if (selectedCountry) {
      setSelectedState(null);
      setSelectedSettlement(null);
      setSelectedCharacter(null);
      setCharacters([]);
      // Refetch country's settlements when navigating to country detail
      fetchSettlements(selectedCountry.id);
      setViewLevel('country-detail');
    }
  };

  const navigateToStateDetail = () => {
    if (selectedState) {
      setViewLevel('state-detail');
      setSelectedSettlement(null);
      setSelectedCharacter(null);
      setCharacters([]);
    }
  };

  const navigateToSettlementDetail = () => {
    if (selectedSettlement) {
      setViewLevel('settlement-detail');
      setSelectedCharacter(null);
    }
  };

  const navigateToCharacters = () => {
    if (selectedSettlement) {
      setViewLevel('characters');
      setSelectedCharacter(null);
    }
  };

  // Breadcrumb rendering
  const renderBreadcrumb = () => {
    const parts: JSX.Element[] = [];

    if (viewLevel !== 'countries') {
      parts.push(
        <Button key="back" variant="ghost" size="sm" onClick={goBack} className="gap-1 hover:bg-primary/10">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      );
    }

    // World
    parts.push(
      viewLevel === 'countries' ? (
        <span key="world" className="text-sm text-primary font-medium">World</span>
      ) : (
        <button
          key="world"
          onClick={navigateToCountries}
          className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium"
        >
          World
        </button>
      )
    );

    if (selectedCountry) {
      parts.push(<ChevronRight key="sep1" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        viewLevel === 'country-detail' ? (
          <span key="country" className="text-sm font-medium text-primary">
            {selectedCountry.name}
          </span>
        ) : (
          <button
            key="country"
            onClick={navigateToCountryDetail}
            className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium"
          >
            {selectedCountry.name}
          </button>
        )
      );
    }

    if (selectedState) {
      parts.push(<ChevronRight key="sep2" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        viewLevel === 'state-detail' ? (
          <span key="state" className="text-sm font-medium text-primary">
            {selectedState.name}
          </span>
        ) : (
          <button
            key="state"
            onClick={navigateToStateDetail}
            className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium"
          >
            {selectedState.name}
          </button>
        )
      );
    }

    if (selectedSettlement) {
      parts.push(<ChevronRight key="sep3" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        (viewLevel === 'settlement-detail' || viewLevel === 'characters') ? (
          <span key="settlement" className="text-sm font-medium text-primary">
            {selectedSettlement.name}
          </span>
        ) : (
          <button
            key="settlement"
            onClick={navigateToSettlementDetail}
            className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium"
          >
            {selectedSettlement.name}
          </button>
        )
      );
    }

    if (viewLevel === 'characters' || viewLevel === 'character-detail') {
      parts.push(<ChevronRight key="sep4" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        viewLevel === 'characters' ? (
          <span key="characters" className="text-sm font-medium text-primary">Characters</span>
        ) : (
          <button
            key="characters"
            onClick={navigateToCharacters}
            className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium"
          >
            Characters
          </button>
        )
      );
    }

    if (selectedCharacter) {
      parts.push(<ChevronRight key="sep5" className="w-4 h-4 text-muted-foreground" />);
      parts.push(
        <span key="character" className="text-sm font-semibold text-primary">
          {[selectedCharacter.firstName, selectedCharacter.lastName].filter(Boolean).join(' ')}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2 mb-6 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
        {parts}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-6">
      {renderBreadcrumb()}

      {/* Countries View */}
      {viewLevel === 'countries' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Society
              </h2>
              <p className="text-muted-foreground mt-1">Explore your world's locations, settlements, and characters</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => setShowCountryDialog(true)}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      disabled={!canEdit || permissionsLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Country
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canEdit && (
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      <span>Only the world owner can add countries</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          <CountriesListView countries={countries} onSelectCountry={selectCountry} />
        </div>
      )}

      {/* Country Detail View */}
      {viewLevel === 'country-detail' && selectedCountry && (
        <CountryDetailView
          country={selectedCountry}
          states={states}
          settlements={settlements}
          onSelectState={selectState}
          onSelectSettlement={selectSettlement}
          onAddState={() => setShowStateDialog(true)}
          onAddSettlement={() => setShowSettlementDialog(true)}
          canEdit={canEdit}
          onDeleteCountry={async () => {
            try {
              await fetch(`/api/countries/${selectedCountry.id}`, { method: 'DELETE' });
              setSelectedCountry(null);
              setStates([]);
              setSettlements([]);
              setViewLevel('countries');
              fetchCountries();
              toast({ title: 'Country deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete country', variant: 'destructive' });
            }
          }}
          onDeleteState={async (stateId: string) => {
            try {
              await fetch(`/api/states/${stateId}`, { method: 'DELETE' });
              fetchStates(selectedCountry.id);
              toast({ title: 'State deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete state', variant: 'destructive' });
            }
          }}
          onDeleteSettlement={async (settlementId: string) => {
            try {
              await fetch(`/api/settlements/${settlementId}`, { method: 'DELETE' });
              fetchSettlements(selectedCountry.id);
              toast({ title: 'Settlement deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete settlement', variant: 'destructive' });
            }
          }}
          onBulkDeleteStates={async (stateIds: string[]) => {
            try {
              await Promise.all(stateIds.map(id => fetch(`/api/states/${id}`, { method: 'DELETE' })));
              fetchStates(selectedCountry.id);
              toast({ title: `${stateIds.length} state(s) deleted successfully` });
            } catch (error) {
              toast({ title: 'Failed to delete states', variant: 'destructive' });
            }
          }}
          onBulkDeleteSettlements={async (settlementIds: string[]) => {
            try {
              await Promise.all(settlementIds.map(id => fetch(`/api/settlements/${id}`, { method: 'DELETE' })));
              fetchSettlements(selectedCountry.id);
              toast({ title: `${settlementIds.length} settlement(s) deleted successfully` });
            } catch (error) {
              toast({ title: 'Failed to delete settlements', variant: 'destructive' });
            }
          }}
        />
      )}

      {/* State Detail View */}
      {viewLevel === 'state-detail' && selectedState && (
        <StateDetailView
          state={selectedState}
          settlements={settlements}
          onSelectSettlement={selectSettlement}
          onAddSettlement={() => setShowSettlementDialog(true)}
          canEdit={canEdit}
          onDeleteSettlement={async (settlementId: string) => {
            try {
              await fetch(`/api/settlements/${settlementId}`, { method: 'DELETE' });
              if (selectedState) {
                fetchSettlements(undefined, selectedState.id);
              }
              toast({ title: 'Settlement deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete settlement', variant: 'destructive' });
            }
          }}
          onBulkDeleteSettlements={async (settlementIds: string[]) => {
            try {
              await Promise.all(settlementIds.map(id => fetch(`/api/settlements/${id}`, { method: 'DELETE' })));
              if (selectedState) {
                fetchSettlements(undefined, selectedState.id);
              }
              toast({ title: `${settlementIds.length} settlement(s) deleted successfully` });
            } catch (error) {
              toast({ title: 'Failed to delete settlements', variant: 'destructive' });
            }
          }}
        />
      )}

      {/* Settlement Detail View */}
      {viewLevel === 'settlement-detail' && selectedSettlement && (
        <SettlementDetailView
          settlement={selectedSettlement}
          lots={lots}
          businesses={businesses}
          residences={residences}
          characters={characters}
          onViewCharacter={selectCharacter}
          onAddCharacter={() => viewCharacters()}
          onAddLot={() => setShowLotDialog(true)}
          onAddBusiness={() => setShowBusinessDialog(true)}
          onAddResidence={() => setShowResidenceDialog(true)}
          canEdit={canEdit}
          onDeleteLot={async (lotId: string) => {
            try {
              await fetch(`/api/lots/${lotId}`, { method: 'DELETE' });
              fetchLots(selectedSettlement.id);
              toast({ title: 'Lot deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete lot', variant: 'destructive' });
            }
          }}
          onDeleteBusiness={async (businessId: string) => {
            try {
              await fetch(`/api/businesses/${businessId}`, { method: 'DELETE' });
              fetchBusinesses(selectedSettlement.id);
              toast({ title: 'Business deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete business', variant: 'destructive' });
            }
          }}
          onDeleteResidence={async (residenceId: string) => {
            try {
              await fetch(`/api/residences/${residenceId}`, { method: 'DELETE' });
              fetchResidences(selectedSettlement.id);
              toast({ title: 'Residence deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete residence', variant: 'destructive' });
            }
          }}
        />
      )}

      {/* Characters View */}
      {viewLevel === 'characters' && (
        <CharactersListView
          characters={characters}
          worldId={worldId}
          settlementId={selectedSettlement?.id}
          onSelectCharacter={selectCharacter}
          onCreateCharacter={(data) => createCharacterMutation.mutate(data)}
          isCreating={createCharacterMutation.isPending}
          canEdit={canEdit}
          onDeleteCharacter={async (characterId: string) => {
            try {
              await fetch(`/api/characters/${characterId}`, { method: 'DELETE' });
              if (selectedSettlement) {
                fetchCharacters(selectedSettlement.id);
              }
              toast({ title: 'Character deleted successfully' });
            } catch (error) {
              toast({ title: 'Failed to delete character', variant: 'destructive' });
            }
          }}
          onBulkDeleteCharacters={async (characterIds: string[]) => {
            try {
              await Promise.all(characterIds.map(id => fetch(`/api/characters/${id}`, { method: 'DELETE' })));
              if (selectedSettlement) {
                fetchCharacters(selectedSettlement.id);
              }
              toast({ title: `${characterIds.length} character(s) deleted successfully` });
            } catch (error) {
              toast({ title: 'Failed to delete characters', variant: 'destructive' });
            }
          }}
        />
      )}

      {/* Character Detail View */}
      {viewLevel === 'character-detail' && selectedCharacter && (
        <CharacterDetailView
          character={selectedCharacter}
          allCharacters={allCharacters}
          onEditCharacter={(char) => {
            setCharacterToEdit(char);
            setShowEditDialog(true);
          }}
          onChatWithCharacter={(char) => {
            setChatCharacter(char);
            setShowChatDialog(true);
          }}
          onViewCharacter={selectCharacter}
        />
      )}

      {/* Country Dialog */}
      <CountryDialog
        open={showCountryDialog}
        onOpenChange={setShowCountryDialog}
        worldId={worldId}
        onSuccess={() => {
          setShowCountryDialog(false);
          fetchCountries();
        }}
      />

      {/* State Dialog */}
      <StateDialog
        open={showStateDialog}
        onOpenChange={setShowStateDialog}
        worldId={worldId}
        countryId={selectedCountry?.id}
        countryName={selectedCountry?.name}
        onSuccess={() => {
          setShowStateDialog(false);
          if (selectedCountry) fetchStates(selectedCountry.id);
        }}
      />

      {/* Settlement Dialog */}
      <SettlementDialog
        open={showSettlementDialog}
        onOpenChange={setShowSettlementDialog}
        worldId={worldId}
        countryId={selectedCountry?.id}
        stateId={selectedState?.id}
        onSuccess={() => {
          setShowSettlementDialog(false);
          if (selectedState) {
            fetchSettlements(undefined, selectedState.id);
          } else if (selectedCountry) {
            fetchSettlements(selectedCountry.id);
          }
        }}
      />

      {/* Edit Dialog */}
      <CharacterEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        character={characterToEdit}
        navigationContext={{
          worldName: 'World',
          countryName: selectedCountry?.name,
          stateName: selectedState?.name,
          settlementName: selectedSettlement?.name,
          onNavigateBack: goBack,
          onNavigateToCountries: navigateToCountries,
          onNavigateToStates: navigateToCountryDetail,
          onNavigateToSettlements: navigateToStateDetail,
          onNavigateToCharacters: navigateToCharacters
        }}
        onCharacterUpdated={() => {
          if (selectedSettlement) {
            fetchCharacters(selectedSettlement.id);
          }
          fetchAllCharacters();
          if (selectedCharacter && characterToEdit?.id === selectedCharacter.id) {
            fetchAllCharacters().then(() => {
              const updated = allCharacters.find(c => c.id === selectedCharacter.id);
              if (updated) setSelectedCharacter(updated);
            });
          }
          setShowEditDialog(false);
        }}
        onCharacterDeleted={() => {
          if (selectedSettlement) {
            fetchCharacters(selectedSettlement.id);
          }
          fetchAllCharacters();
          if (selectedCharacter && characterToEdit?.id === selectedCharacter.id) {
            goBack();
          }
          setShowEditDialog(false);
        }}
      />

      {/* Chat Dialog */}
      {chatCharacter && (
        <CharacterChatDialog
          open={showChatDialog}
          onOpenChange={setShowChatDialog}
          character={chatCharacter as any}
          truths={truths.filter(t => t.characterId === chatCharacter.id)}
        />
      )}

      {/* Business Dialog */}
      {selectedSettlement && (
        <BusinessDialog
          open={showBusinessDialog}
          onOpenChange={setShowBusinessDialog}
          settlementId={selectedSettlement.id}
          onSubmit={async (data) => {
            try {
              const response = await fetch(`/api/settlements/${selectedSettlement.id}/businesses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                fetchBusinesses(selectedSettlement.id);
                toast({ title: 'Business created successfully' });
              } else {
                toast({ title: 'Failed to create business', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Failed to create business', variant: 'destructive' });
            }
          }}
        />
      )}

      {/* Residence Dialog */}
      {selectedSettlement && (
        <ResidenceDialog
          open={showResidenceDialog}
          onOpenChange={setShowResidenceDialog}
          settlementId={selectedSettlement.id}
          onSubmit={async (data) => {
            try {
              const response = await fetch(`/api/settlements/${selectedSettlement.id}/residences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                fetchResidences(selectedSettlement.id);
                toast({ title: 'Residence created successfully' });
              } else {
                toast({ title: 'Failed to create residence', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Failed to create residence', variant: 'destructive' });
            }
          }}
        />
      )}

      {/* Lot Dialog */}
      {selectedSettlement && (
        <LotDialog
          open={showLotDialog}
          onOpenChange={setShowLotDialog}
          settlementId={selectedSettlement.id}
          onSubmit={async (data) => {
            try {
              const response = await fetch(`/api/settlements/${selectedSettlement.id}/lots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                fetchLots(selectedSettlement.id);
                toast({ title: 'Lot created successfully' });
              } else {
                toast({ title: 'Failed to create lot', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Failed to create lot', variant: 'destructive' });
            }
          }}
        />
      )}
    </div>
  );
}
