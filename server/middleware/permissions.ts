import { storage } from '../db/storage';

/**
 * Helper function to check if a user can access a world (read-only)
 */
export async function canAccessWorld(userId: string | undefined, worldId: string): Promise<boolean> {
  const world = await storage.getWorld(worldId);
  if (!world) return false;

  // Public worlds are accessible to everyone
  if (world.visibility === 'public') return true;

  // No auth required and it's unlisted
  if (!world.requiresAuth && world.visibility === 'unlisted') return true;

  // Private worlds or auth-required worlds need a logged-in user
  if (!userId) return false;

  // Owner always has access
  if (world.ownerId === userId) return true;

  // Check if user is in allowed list
  if (world.allowedUserIds && world.allowedUserIds.includes(userId)) return true;

  return false;
}

/**
 * Helper function to check if a user can edit a world (write access)
 */
export async function canEditWorld(userId: string | undefined, worldId: string): Promise<boolean> {
  if (!userId) return false;

  const world = await storage.getWorld(worldId);
  if (!world) return false;

  // Only the owner can edit
  return world.ownerId === userId;
}

/**
 * Helper function to check if a user owns a world
 */
export async function isWorldOwner(userId: string | undefined, worldId: string): Promise<boolean> {
  if (!userId) return false;

  const world = await storage.getWorld(worldId);
  if (!world) return false;

  return world.ownerId === userId;
}
