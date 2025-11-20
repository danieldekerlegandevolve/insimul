import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Plus } from 'lucide-react';

interface World {
  id: string;
  name: string;
  ownerId?: string;
  visibility?: string;
  requiresAuth?: boolean;
  allowedUserIds?: string[];
}

interface WorldSettingsDialogProps {
  worldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdated?: () => void;
}

export function WorldSettingsDialog({
  worldId,
  open,
  onOpenChange,
  onSettingsUpdated,
}: WorldSettingsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [world, setWorld] = useState<World | null>(null);
  const [visibility, setVisibility] = useState<string>('private');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const { token, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadWorldSettings();
    }
  }, [open, worldId]);

  const loadWorldSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/worlds/${worldId}`);
      if (response.ok) {
        const worldData = await response.json();
        setWorld(worldData);
        setVisibility(worldData.visibility || 'private');
        setRequiresAuth(worldData.requiresAuth || false);
        setAllowedUserIds(worldData.allowedUserIds || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load world settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load world settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load world settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/worlds/${worldId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visibility,
          requiresAuth,
          allowedUserIds,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'World settings updated successfully',
        });
        onOpenChange(false);
        if (onSettingsUpdated) {
          onSettingsUpdated();
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update world settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update world settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update world settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addAllowedUser = () => {
    if (newUserId.trim() && !allowedUserIds.includes(newUserId.trim())) {
      setAllowedUserIds([...allowedUserIds, newUserId.trim()]);
      setNewUserId('');
    }
  };

  const removeAllowedUser = (userId: string) => {
    setAllowedUserIds(allowedUserIds.filter((id) => id !== userId));
  };

  const isOwner = world?.ownerId && user?.id === world.ownerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>World Settings</DialogTitle>
          <DialogDescription>
            Configure access permissions and visibility for this world
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isOwner ? (
          <div className="py-8 text-center text-muted-foreground">
            Only the world owner can modify settings.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="space-y-2">
              <Label>Owner</Label>
              <div className="text-sm text-muted-foreground">
                {world?.ownerId ? (
                  <Badge variant="secondary">{world.ownerId === user?.id ? 'You' : world.ownerId.substring(0, 8) + '...'}</Badge>
                ) : (
                  <span className="text-muted-foreground">No owner set</span>
                )}
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger id="visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Public</span>
                      <span className="text-xs text-muted-foreground">Anyone can find and access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="unlisted">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Unlisted</span>
                      <span className="text-xs text-muted-foreground">Accessible with link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Private</span>
                      <span className="text-xs text-muted-foreground">Only allowed users</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Requires Auth */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requiresAuth">Require Authentication</Label>
                <div className="text-xs text-muted-foreground">
                  Players must be logged in to access
                </div>
              </div>
              <Switch
                id="requiresAuth"
                checked={requiresAuth}
                onCheckedChange={setRequiresAuth}
              />
            </div>

            {/* Allowed Users (only for private worlds) */}
            {visibility === 'private' && (
              <div className="space-y-2">
                <Label>Allowed Users</Label>
                <div className="text-xs text-muted-foreground mb-2">
                  Add user IDs who can access this private world
                </div>

                {/* Existing allowed users */}
                {allowedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {allowedUserIds.map((userId) => (
                      <Badge key={userId} variant="secondary" className="gap-1">
                        {userId.substring(0, 8)}...
                        <button
                          type="button"
                          onClick={() => removeAllowedUser(userId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add new user */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter user ID"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAllowedUser();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={addAllowedUser}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isOwner && (
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
