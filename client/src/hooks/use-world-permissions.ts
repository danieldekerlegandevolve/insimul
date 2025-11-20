import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WorldPermissions {
  canEdit: boolean;
  canView: boolean;
  isOwner: boolean;
  loading: boolean;
}

/**
 * Hook to check user's permissions for a specific world
 */
export function useWorldPermissions(worldId: string | undefined): WorldPermissions {
  const { token, user } = useAuth();
  const [permissions, setPermissions] = useState<WorldPermissions>({
    canEdit: false,
    canView: true,
    isOwner: false,
    loading: true,
  });

  useEffect(() => {
    if (!worldId) {
      setPermissions({
        canEdit: false,
        canView: false,
        isOwner: false,
        loading: false,
      });
      return;
    }

    const fetchPermissions = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch the world to check ownership
        const response = await fetch(`/api/worlds/${worldId}`, { headers });

        if (response.ok) {
          const world = await response.json();
          const isOwner = world.ownerId === user?.id;

          setPermissions({
            canEdit: isOwner,
            canView: true,
            isOwner: isOwner,
            loading: false,
          });
        } else {
          // If we can't fetch the world, assume no permissions
          setPermissions({
            canEdit: false,
            canView: false,
            isOwner: false,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Failed to check world permissions:', error);
        setPermissions({
          canEdit: false,
          canView: true,
          isOwner: false,
          loading: false,
        });
      }
    };

    fetchPermissions();
  }, [worldId, token, user?.id]);

  return permissions;
}
