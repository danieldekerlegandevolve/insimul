import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Globe, Users, Play, Search, Loader2, Lock, Eye } from 'lucide-react';

interface World {
  id: string;
  name: string;
  description?: string;
  worldType?: string;
  visibility: string;
  ownerId?: string;
  isOwner?: boolean;
  playerCount?: number;
  requiresAuth?: boolean;
  createdAt?: string;
}

interface WorldBrowserProps {
  onPlayWorld?: (worldId: string) => void;
}

export function WorldBrowser({ onPlayWorld }: WorldBrowserProps) {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [filteredWorlds, setFilteredWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadPublicWorlds();
  }, [token]);

  useEffect(() => {
    // Filter worlds based on search query
    if (!searchQuery.trim()) {
      setFilteredWorlds(worlds);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredWorlds(
        worlds.filter(
          (world) =>
            world.name.toLowerCase().includes(query) ||
            world.description?.toLowerCase().includes(query) ||
            world.worldType?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, worlds]);

  const loadPublicWorlds = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/worlds?visibility=public', {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setWorlds(data);
        setFilteredWorlds(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load public worlds',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load public worlds:', error);
      toast({
        title: 'Error',
        description: 'Failed to load public worlds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayWorld = (world: World) => {
    if (world.requiresAuth && !isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to play this world',
        variant: 'destructive',
      });
      return;
    }

    if (onPlayWorld) {
      onPlayWorld(world.id);
    }
  };

  const getWorldTypeColor = (worldType?: string) => {
    const type = (worldType || '').toLowerCase();
    if (type.includes('fantasy')) return 'bg-purple-500/10 text-purple-700';
    if (type.includes('sci-fi') || type.includes('space')) return 'bg-blue-500/10 text-blue-700';
    if (type.includes('modern')) return 'bg-gray-500/10 text-gray-700';
    if (type.includes('historical')) return 'bg-amber-500/10 text-amber-700';
    if (type.includes('cyberpunk')) return 'bg-pink-500/10 text-pink-700';
    if (type.includes('post-apocalyptic')) return 'bg-orange-500/10 text-orange-700';
    return 'bg-green-500/10 text-green-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Browse Public Worlds
          </CardTitle>
          <CardDescription>
            Discover and play in worlds created by the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search worlds by name, description, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredWorlds.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {searchQuery ? (
              <p>No worlds found matching "{searchQuery}"</p>
            ) : (
              <p>No public worlds available yet. Be the first to create one!</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorlds.map((world) => (
            <Card key={world.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{world.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {world.worldType && (
                        <Badge className={getWorldTypeColor(world.worldType)}>
                          {world.worldType}
                        </Badge>
                      )}
                      {world.isOwner && <Badge variant="secondary">Your World</Badge>}
                      {world.requiresAuth && (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Auth Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {world.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{world.playerCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="capitalize">{world.visibility}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handlePlayWorld(world)}
                  disabled={world.requiresAuth && !isAuthenticated}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {world.isOwner ? 'Open World' : 'Play'}
                </Button>

                {world.requiresAuth && !isAuthenticated && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Login required to play
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
