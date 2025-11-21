import { db } from "@db";
import { reputations, type Reputation, type InsertReputation } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Reputation Service
 * Handles all reputation/karma business logic for the game
 */

export interface ViolationData {
  violationType: string;
  severity: 'minor' | 'moderate' | 'severe';
  ruleId?: string;
  description?: string;
}

export interface ReputationAdjustment {
  amount: number;
  reason: string;
}

export interface ViolationResponse {
  previousScore: number;
  newScore: number;
  previousStanding: string;
  newStanding: string;
  violationCount: number;
  penaltyApplied: 'warning' | 'fine' | 'combat' | 'banishment';
  penaltyAmount?: number;
  message: string;
  isBanned: boolean;
}

/**
 * Calculate standing text based on reputation score
 */
export function calculateStanding(score: number): string {
  if (score >= 51) return 'revered';
  if (score >= 1) return 'friendly';
  if (score >= -49) return 'neutral';
  if (score >= -99) return 'unfriendly';
  return 'hostile';
}

/**
 * Calculate reputation penalty based on severity
 */
function getSeverityPenalty(severity: 'minor' | 'moderate' | 'severe'): number {
  switch (severity) {
    case 'minor': return -5;
    case 'moderate': return -10;
    case 'severe': return -25;
    default: return -5;
  }
}

/**
 * Determine penalty level based on violation count
 * 1 = warning, 2 = fine, 3 = combat, 4+ = banishment
 */
function getPenaltyLevel(violationCount: number): number {
  return Math.min(violationCount, 4);
}

/**
 * Get or create reputation record for a playthrough + entity
 */
export async function getOrCreateReputation(
  playthroughId: string,
  userId: string,
  entityType: string,
  entityId: string
): Promise<Reputation> {
  // Try to find existing reputation
  const existing = await db
    .select()
    .from(reputations)
    .where(
      and(
        eq(reputations.playthroughId, playthroughId),
        eq(reputations.entityType, entityType),
        eq(reputations.entityId, entityId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new reputation record with neutral standing
  const newReputation: InsertReputation = {
    playthroughId,
    userId,
    entityType,
    entityId,
    score: 0,
    standing: 'neutral',
    violationCount: 0,
    warningCount: 0,
    violationHistory: [],
    isBanned: false,
    totalFinesPaid: 0,
    outstandingFines: 0,
    hasDiscounts: false,
    hasSpecialAccess: false,
    tags: []
  };

  const [created] = await db.insert(reputations).values(newReputation).returning();
  return created;
}

/**
 * Get all reputations for a playthrough
 */
export async function getPlaythroughReputations(playthroughId: string): Promise<Reputation[]> {
  return await db
    .select()
    .from(reputations)
    .where(eq(reputations.playthroughId, playthroughId));
}

/**
 * Record a rule violation and apply graduated enforcement
 */
export async function recordViolation(
  playthroughId: string,
  userId: string,
  entityType: string,
  entityId: string,
  violation: ViolationData
): Promise<ViolationResponse> {
  // Get or create reputation
  const reputation = await getOrCreateReputation(playthroughId, userId, entityType, entityId);

  const previousScore = reputation.score;
  const previousStanding = reputation.standing;

  // Increment violation count
  const newViolationCount = reputation.violationCount + 1;
  const newWarningCount = reputation.warningCount + (violation.severity === 'minor' ? 1 : 0);

  // Calculate penalty level
  const penaltyLevel = getPenaltyLevel(newViolationCount);

  // Calculate reputation change
  const severityPenalty = getSeverityPenalty(violation.severity);
  let reputationChange = severityPenalty;
  let penaltyAmount = 0;
  let isBanned = false;
  let banExpiry: Date | null = null;

  // Apply graduated enforcement
  let penaltyApplied: 'warning' | 'fine' | 'combat' | 'banishment';
  let message: string;

  switch (penaltyLevel) {
    case 1: // Warning
      penaltyApplied = 'warning';
      reputationChange = -5;
      message = `Warning issued for ${violation.violationType}. First offense.`;
      break;

    case 2: // Fine
      penaltyApplied = 'fine';
      reputationChange = -10;
      penaltyAmount = 50; // 50 gold fine
      message = `Fine imposed: 50 gold for ${violation.violationType}. Second offense.`;
      break;

    case 3: // Combat alert
      penaltyApplied = 'combat';
      reputationChange = -25;
      message = `Guards alerted! ${violation.violationType} detected. Third offense.`;
      break;

    case 4: // Banishment
    default:
      penaltyApplied = 'banishment';
      reputationChange = -50;
      isBanned = true;
      banExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      message = `BANISHED from this location for ${violation.violationType}. You may return in 24 hours.`;
      break;
  }

  // Calculate new score (clamped to -100, 100)
  const newScore = Math.max(-100, Math.min(100, previousScore + reputationChange));
  const newStanding = calculateStanding(newScore);

  // Update violation history
  const violationRecord = {
    type: violation.violationType,
    severity: violation.severity,
    timestamp: new Date().toISOString(),
    penaltyApplied
  };

  const updatedHistory = [...reputation.violationHistory, violationRecord];

  // Update reputation in database
  await db
    .update(reputations)
    .set({
      score: newScore,
      standing: newStanding,
      violationCount: newViolationCount,
      warningCount: newWarningCount,
      lastViolation: new Date(),
      violationHistory: updatedHistory,
      isBanned,
      banExpiry,
      outstandingFines: reputation.outstandingFines + penaltyAmount,
      updatedAt: new Date()
    })
    .where(eq(reputations.id, reputation.id));

  return {
    previousScore,
    newScore,
    previousStanding,
    newStanding,
    violationCount: newViolationCount,
    penaltyApplied,
    penaltyAmount: penaltyAmount > 0 ? penaltyAmount : undefined,
    message,
    isBanned
  };
}

/**
 * Manually adjust reputation (for quests, rewards, etc.)
 */
export async function adjustReputation(
  playthroughId: string,
  userId: string,
  entityType: string,
  entityId: string,
  adjustment: ReputationAdjustment
): Promise<Reputation> {
  // Get or create reputation
  const reputation = await getOrCreateReputation(playthroughId, userId, entityType, entityId);

  // Calculate new score (clamped to -100, 100)
  const newScore = Math.max(-100, Math.min(100, reputation.score + adjustment.amount));
  const newStanding = calculateStanding(newScore);

  // Check if we should remove ban if reputation is improving significantly
  let isBanned = reputation.isBanned;
  let banExpiry = reputation.banExpiry;

  if (newScore > -50 && reputation.isBanned) {
    // Reputation improved enough to lift ban
    isBanned = false;
    banExpiry = null;
  }

  // Update reputation in database
  const [updated] = await db
    .update(reputations)
    .set({
      score: newScore,
      standing: newStanding,
      isBanned,
      banExpiry,
      updatedAt: new Date()
    })
    .where(eq(reputations.id, reputation.id))
    .returning();

  return updated;
}

/**
 * Check if player is banned from an entity
 */
export async function checkBanStatus(
  playthroughId: string,
  entityType: string,
  entityId: string
): Promise<{ isBanned: boolean; banExpiry: Date | null; reason?: string }> {
  const existing = await db
    .select()
    .from(reputations)
    .where(
      and(
        eq(reputations.playthroughId, playthroughId),
        eq(reputations.entityType, entityType),
        eq(reputations.entityId, entityId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    return { isBanned: false, banExpiry: null };
  }

  const reputation = existing[0];

  // Check if ban has expired
  if (reputation.isBanned && reputation.banExpiry) {
    const now = new Date();
    if (now > reputation.banExpiry) {
      // Ban expired, automatically lift it
      await db
        .update(reputations)
        .set({
          isBanned: false,
          banExpiry: null,
          updatedAt: new Date()
        })
        .where(eq(reputations.id, reputation.id));

      return { isBanned: false, banExpiry: null };
    }
  }

  return {
    isBanned: reputation.isBanned,
    banExpiry: reputation.banExpiry,
    reason: reputation.isBanned ? 'Multiple rule violations' : undefined
  };
}

/**
 * Pay outstanding fines
 */
export async function payFines(
  playthroughId: string,
  entityType: string,
  entityId: string,
  amount: number
): Promise<Reputation> {
  const existing = await db
    .select()
    .from(reputations)
    .where(
      and(
        eq(reputations.playthroughId, playthroughId),
        eq(reputations.entityType, entityType),
        eq(reputations.entityId, entityId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error('No reputation record found');
  }

  const reputation = existing[0];
  const amountPaid = Math.min(amount, reputation.outstandingFines);

  const [updated] = await db
    .update(reputations)
    .set({
      totalFinesPaid: reputation.totalFinesPaid + amountPaid,
      outstandingFines: reputation.outstandingFines - amountPaid,
      updatedAt: new Date()
    })
    .where(eq(reputations.id, reputation.id))
    .returning();

  return updated;
}
