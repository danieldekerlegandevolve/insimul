import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { GamepadIcon, Clock, Activity, User } from 'lucide-react';

interface Playthrough {
  id: string;
  userId: string;
  worldId: string;
  name?: string;
  status: string;
  currentTimestep?: number;
  playtime?: number;
  actionsCount?: number;
  createdAt: string;
  lastPlayedAt?: string;
}

interface PlaythroughAnalyticsProps {
  worldId: string;
}

export function PlaythroughAnalytics({ worldId }: PlaythroughAnalyticsProps) {
  const [playthroughs, setPlaythroughs] = useState<Playthrough[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    loadPlaythroughs();
  }, [worldId, token]);

  const loadPlaythroughs = async () => {
    if (!token) {
      setError('Authentication required to view analytics');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/worlds/${worldId}/analytics/playthroughs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaythroughs(data);
        setError(null);
      } else if (response.status === 403) {
        setError('Only world owners can view analytics');
      } else {
        setError('Failed to load playthrough analytics');
      }
    } catch (err) {
      console.error('Failed to load playthroughs:', err);
      setError('Failed to load playthrough analytics');
    } finally {
      setLoading(false);
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

  const totalPlaytime = playthroughs.reduce((sum, p) => sum + (p.playtime || 0), 0);
  const totalActions = playthroughs.reduce((sum, p) => sum + (p.actionsCount || 0), 0);
  const activePlayers = playthroughs.filter(p => p.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Playthrough Analytics</CardTitle>
          <CardDescription>Player activity and engagement metrics for this world</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm">Total Players</span>
              </div>
              <p className="text-3xl font-bold">{playthroughs.length}</p>
              <p className="text-xs text-muted-foreground">
                {activePlayers} active
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Total Playtime</span>
              </div>
              <p className="text-3xl font-bold">{formatDuration(totalPlaytime)}</p>
              <p className="text-xs text-muted-foreground">
                Across all players
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Total Actions</span>
              </div>
              <p className="text-3xl font-bold">{totalActions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Player interactions
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GamepadIcon className="w-4 h-4" />
                <span className="text-sm">Avg. Actions</span>
              </div>
              <p className="text-3xl font-bold">
                {playthroughs.length > 0 ? Math.round(totalActions / playthroughs.length) : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Per player
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player Playthroughs ({playthroughs.length})</CardTitle>
          <CardDescription>Individual player sessions and progress</CardDescription>
        </CardHeader>
        <CardContent>
          {playthroughs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No playthroughs yet. Players will appear here when they start playing.
            </div>
          ) : (
            <div className="space-y-3">
              {playthroughs.map((playthrough) => (
                <div key={playthrough.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{playthrough.name || 'Unnamed Playthrough'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Player ID: {playthrough.userId.substring(0, 8)}...
                      </p>
                    </div>
                    <Badge variant={playthrough.status === 'active' ? 'default' : 'secondary'}>
                      {playthrough.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Actions:</span>{' '}
                      <span className="font-medium">{playthrough.actionsCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Playtime:</span>{' '}
                      <span className="font-medium">{formatDuration(playthrough.playtime)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Started:</span>{' '}
                      <span className="font-medium">{formatDate(playthrough.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Played:</span>{' '}
                      <span className="font-medium">{formatDate(playthrough.lastPlayedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
