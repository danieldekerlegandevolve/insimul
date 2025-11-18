import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Play, Trash2, Clock, Activity, Calendar, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Playthrough {
  id: string;
  userId: string;
  worldId: string;
  worldName?: string;
  worldVisibility?: string;
  name?: string;
  status: string;
  currentTimestep?: number;
  playtime?: number;
  actionsCount?: number;
  createdAt: string;
  lastPlayedAt?: string;
}

interface PlaythroughsListProps {
  onResumePlaythrough?: (worldId: string, playthroughId: string) => void;
}

export function PlaythroughsList({ onResumePlaythrough }: PlaythroughsListProps) {
  const [playthroughs, setPlaythroughs] = useState<Playthrough[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [playthroughToDelete, setPlaythroughToDelete] = useState<Playthrough | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadPlaythroughs();
  }, [token]);

  const loadPlaythroughs = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/playthroughs/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaythroughs(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load your playthroughs',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load playthroughs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your playthroughs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaythrough = async (playthrough: Playthrough) => {
    if (!token) return;

    try {
      setDeletingId(playthrough.id);
      const response = await fetch(`/api/playthroughs/${playthrough.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Playthrough deleted successfully',
        });
        // Remove from list
        setPlaythroughs(playthroughs.filter((p) => p.id !== playthrough.id));
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete playthrough',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete playthrough:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete playthrough',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setPlaythroughToDelete(null);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Playthroughs</CardTitle>
          <CardDescription>Please log in to view your playthroughs</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activePlaythroughs = playthroughs.filter((p) => p.status === 'active');
  const completedPlaythroughs = playthroughs.filter((p) => p.status === 'completed');
  const abandonedPlaythroughs = playthroughs.filter((p) => p.status === 'abandoned');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Playthroughs</CardTitle>
          <CardDescription>
            Manage your game sessions across all worlds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">{activePlaythroughs.length}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">{completedPlaythroughs.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-muted-foreground">
                {abandonedPlaythroughs.length}
              </div>
              <div className="text-sm text-muted-foreground">Abandoned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {playthroughs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>You haven't started any playthroughs yet.</p>
            <p className="mt-2 text-sm">Browse worlds to start playing!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {playthroughs.map((playthrough) => (
            <Card key={playthrough.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {playthrough.name || 'Unnamed Playthrough'}
                      </h3>
                      <Badge variant={playthrough.status === 'active' ? 'default' : 'secondary'}>
                        {playthrough.status}
                      </Badge>
                      {playthrough.worldVisibility && (
                        <Badge variant="outline">{playthrough.worldVisibility}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      World: <span className="font-medium">{playthrough.worldName}</span>
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Actions:</span>
                        <span className="font-medium">{playthrough.actionsCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Playtime:</span>
                        <span className="font-medium">{formatDuration(playthrough.playtime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Started:</span>
                        <span className="font-medium">{formatDate(playthrough.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Last Played:</span>
                        <span className="font-medium">{formatDate(playthrough.lastPlayedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {playthrough.status === 'active' && onResumePlaythrough && (
                      <Button
                        size="sm"
                        onClick={() => onResumePlaythrough(playthrough.worldId, playthrough.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === playthrough.id}
                      onClick={() => setPlaythroughToDelete(playthrough)}
                    >
                      {deletingId === playthrough.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={playthroughToDelete !== null}
        onOpenChange={(open) => !open && setPlaythroughToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playthrough?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this playthrough? All progress and play traces will be
              permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playthroughToDelete && handleDeletePlaythrough(playthroughToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
