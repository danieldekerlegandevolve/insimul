import { PrologManager } from './prolog-manager';
import { type IStorage } from './storage';
import type { Character } from '@shared/schema';

/**
 * PrologSyncService
 * 
 * Synchronizes Insimul database data (MongoDB/PostgreSQL) to Prolog knowledge base
 * Ensures 1:1 correspondence between Insimul data and Prolog facts
 */
export class PrologSyncService {
  private storage: IStorage;
  private prologManager: PrologManager;

  constructor(storage: IStorage, prologManager: PrologManager) {
    this.storage = storage;
    this.prologManager = prologManager;
  }

  /**
   * Sync entire world to Prolog knowledge base
   */
  async syncWorldToProlog(worldId: string): Promise<void> {
    console.log(`🔄 Syncing world ${worldId} to Prolog...`);
    
    try {
      // Sync all components
      await this.syncWorldMetadata(worldId);
      await this.syncCharactersToProlog(worldId);
      await this.syncRelationshipsToProlog(worldId);
      await this.syncLocationsToProlog(worldId);
      await this.syncBusinessesToProlog(worldId);
      await this.addHelperRules();
      
      console.log(`✅ World ${worldId} synced to Prolog`);
    } catch (error) {
      console.error(`❌ Failed to sync world ${worldId} to Prolog:`, error);
      throw error;
    }
  }

  /**
   * Sync world metadata as Prolog facts
   */
  private async syncWorldMetadata(worldId: string): Promise<void> {
    const world = await this.storage.getWorld(worldId);
    if (!world) {
      throw new Error(`World ${worldId} not found`);
    }

    const worldName = this.sanitizeAtom(world.name);
    await this.prologManager.addFact(`world(${worldName})`);
    
    if (world.description) {
      const desc = this.escapeString(world.description);
      await this.prologManager.addFact(`world_description(${worldName}, '${desc}')`);
    }
  }

  /**
   * Sync all characters to Prolog facts
   */
  async syncCharactersToProlog(worldId: string): Promise<void> {
    const characters = await this.storage.getCharactersByWorld(worldId);
    console.log(`  📝 Syncing ${characters.length} characters...`);

    for (const character of characters) {
      await this.syncCharacterToProlog(character);
    }
  }

  /**
   * Sync single character to Prolog facts
   */
  private async syncCharacterToProlog(character: Character): Promise<void> {
    const charId = this.sanitizeAtom(`${character.firstName}_${character.lastName}_${character.id}`);
    
    // Core person fact
    await this.prologManager.addFact(`person(${charId})`);
    
    // Names
    const firstName = this.escapeString(character.firstName);
    const lastName = this.escapeString(character.lastName);
    const fullName = this.escapeString(`${character.firstName} ${character.lastName}`);
    
    await this.prologManager.addFact(`first_name(${charId}, '${firstName}')`);
    await this.prologManager.addFact(`last_name(${charId}, '${lastName}')`);
    await this.prologManager.addFact(`full_name(${charId}, '${fullName}')`);
    
    // Demographics
    const gender = this.sanitizeAtom(character.gender);
    await this.prologManager.addFact(`gender(${charId}, ${gender})`);
    
    if (character.birthYear !== null) {
      await this.prologManager.addFact(`birth_year(${charId}, ${character.birthYear})`);
      
      // Calculate age if alive
      if (character.isAlive) {
        const currentYear = new Date().getFullYear();
        const age = currentYear - character.birthYear;
        await this.prologManager.addFact(`age(${charId}, ${age})`);
        await this.prologManager.addFact(`alive(${charId})`);
      } else {
        await this.prologManager.addFact(`dead(${charId})`);
      }
    }
    
    // Occupation
    if (character.occupation) {
      const occupation = this.sanitizeAtom(character.occupation);
      await this.prologManager.addFact(`occupation(${charId}, ${occupation})`);
    }
    
    // Location
    if (character.currentLocation) {
      const locationId = this.sanitizeAtom(character.currentLocation);
      await this.prologManager.addFact(`at_location(${charId}, ${locationId})`);
    }
  }

  /**
   * Sync relationships to Prolog facts
   */
  async syncRelationshipsToProlog(worldId: string): Promise<void> {
    const characters = await this.storage.getCharactersByWorld(worldId);
    console.log(`  💕 Syncing relationships...`);

    for (const character of characters) {
      const charId = this.sanitizeAtom(`${character.firstName}_${character.lastName}_${character.id}`);
      
      // Spouse
      if (character.spouseId) {
        const spouse = characters.find(c => c.id === character.spouseId);
        if (spouse) {
          const spouseId = this.sanitizeAtom(`${spouse.firstName}_${spouse.lastName}_${spouse.id}`);
          await this.prologManager.addFact(`married_to(${charId}, ${spouseId})`);
          await this.prologManager.addFact(`spouse_of(${charId}, ${spouseId})`);
        }
      }
      
      // Parents
      if (character.parentIds && character.parentIds.length > 0) {
        for (const parentId of character.parentIds) {
          const parent = characters.find(c => c.id === parentId);
          if (parent) {
            const pId = this.sanitizeAtom(`${parent.firstName}_${parent.lastName}_${parent.id}`);
            await this.prologManager.addFact(`parent_of(${pId}, ${charId})`);
            await this.prologManager.addFact(`child_of(${charId}, ${pId})`);
          }
        }
      }
      
      // Friends
      if (character.friendIds && character.friendIds.length > 0) {
        for (const friendId of character.friendIds) {
          const friend = characters.find(c => c.id === friendId);
          if (friend) {
            const fId = this.sanitizeAtom(`${friend.firstName}_${friend.lastName}_${friend.id}`);
            await this.prologManager.addFact(`friend_of(${charId}, ${fId})`);
          }
        }
      }
    }
  }

  /**
   * Sync locations to Prolog facts
   */
  async syncLocationsToProlog(worldId: string): Promise<void> {
    console.log(`  🗺️  Syncing locations...`);
    
    try {
      const settlements = await this.storage.getSettlementsByWorld(worldId);
      for (const settlement of settlements) {
        const settlementId = this.sanitizeAtom(settlement.name);
        const settlementName = this.escapeString(settlement.name);
        
        await this.prologManager.addFact(`settlement(${settlementId})`);
        await this.prologManager.addFact(`settlement_name(${settlementId}, '${settlementName}')`);
        
        if (settlement.settlementType) {
          const settType = this.sanitizeAtom(settlement.settlementType);
          await this.prologManager.addFact(`settlement_type(${settlementId}, ${settType})`);
        }
        
        if (settlement.population !== null) {
          await this.prologManager.addFact(`population(${settlementId}, ${settlement.population})`);
        }
      }
    } catch (error) {
      console.warn('  ⚠️  Failed to sync locations:', error);
    }
  }

  /**
   * Sync businesses to Prolog facts
   */
  async syncBusinessesToProlog(worldId: string): Promise<void> {
    console.log(`  🏪 Syncing businesses...`);
    
    try {
      // Check if method exists (some storage implementations may not have it)
      if (typeof (this.storage as any).getBusinessesByWorld === 'function') {
        const businesses = await (this.storage as any).getBusinessesByWorld(worldId);
        
        for (const business of businesses) {
          const businessId = this.sanitizeAtom(business.name);
          const businessName = this.escapeString(business.name);
          
          await this.prologManager.addFact(`business(${businessId})`);
          await this.prologManager.addFact(`business_name(${businessId}, '${businessName}')`);
          
          if (business.businessType) {
            const bizType = this.sanitizeAtom(business.businessType);
            await this.prologManager.addFact(`business_type(${businessId}, ${bizType})`);
          }
          
          if (business.ownerId) {
            const owner = await this.storage.getCharacter(business.ownerId);
            if (owner) {
              const ownerId = this.sanitizeAtom(`${owner.firstName}_${owner.lastName}_${owner.id}`);
              await this.prologManager.addFact(`owns(${ownerId}, ${businessId})`);
              await this.prologManager.addFact(`business_owner(${businessId}, ${ownerId})`);
            }
          }
        }
      } else {
        console.warn('  ⚠️  getBusinessesByWorld method not available');
      }
    } catch (error) {
      console.warn('  ⚠️  Failed to sync businesses:', error);
    }
  }

  /**
   * Add helper rules for common queries
   */
  async addHelperRules(): Promise<void> {
    console.log(`  🔧 Adding helper rules...`);
    
    // Sibling relationship
    await this.prologManager.addRule(
      'sibling_of(X, Y) :- parent_of(P, X), parent_of(P, Y), X \\= Y'
    );
    
    // Grandparent relationship
    await this.prologManager.addRule(
      'grandparent_of(GP, GC) :- parent_of(GP, P), parent_of(P, GC)'
    );
    
    // Ancestor relationship (transitive)
    await this.prologManager.addRule(
      'ancestor_of(A, D) :- parent_of(A, D)'
    );
    await this.prologManager.addRule(
      'ancestor_of(A, D) :- parent_of(A, X), ancestor_of(X, D)'
    );
    
    // Unmarried predicate
    await this.prologManager.addRule(
      'unmarried(X) :- person(X), \\+ married_to(X, _)'
    );
    
    // Same location predicate
    await this.prologManager.addRule(
      'same_location(X, Y) :- at_location(X, L), at_location(Y, L), X \\= Y'
    );
    
    // Eldest child (simplified)
    await this.prologManager.addRule(
      'eldest_child(X) :- person(X), parent_of(P, X), birth_year(X, BY), \\+ (parent_of(P, Y), birth_year(Y, BY2), BY2 < BY)'
    );
    
    // Adult predicate (age >= 18)
    await this.prologManager.addRule(
      'adult(X) :- age(X, A), A >= 18'
    );
    
    // Child predicate (age < 18)
    await this.prologManager.addRule(
      'child(X) :- age(X, A), A < 18'
    );
  }

  /**
   * Sanitize string to valid Prolog atom
   */
  private sanitizeAtom(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^([0-9])/, '_$1')
      .replace(/_+/g, '_');
  }

  /**
   * Escape string for Prolog
   */
  private escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  /**
   * Clear all Prolog facts for a world (before re-sync)
   */
  async clearWorldFromProlog(worldId: string): Promise<void> {
    console.log(`🗑️  Clearing world ${worldId} from Prolog...`);
    await this.prologManager.clearKnowledgeBase();
  }
}

// Export singleton factory
export function createPrologSyncService(storage: IStorage, prologManager: PrologManager): PrologSyncService {
  return new PrologSyncService(storage, prologManager);
}
