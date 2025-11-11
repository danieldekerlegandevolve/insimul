/**
 * Business System Extension for Insimul
 * Implements Talk of the Town business management (founding, closing, ownership transfer)
 */

import { storage } from '../../db/storage';
import { generateEvent } from './event-system.js';
import { fireEmployee } from './hiring-system.js';
import type { Business, Character, BusinessType, OccupationVocation } from '@shared/schema';

export interface BusinessFoundingOptions {
  worldId: string;
  founderId: string;
  name: string;
  businessType: BusinessType;
  address: string;
  currentYear: number;
  currentTimestep: number;
  
  // Optional initial setup
  initialVacancies?: {
    day?: OccupationVocation[];
    night?: OccupationVocation[];
  };
}

export interface BusinessClosureOptions {
  businessId: string;
  reason: 'bankruptcy' | 'retirement' | 'death' | 'sold' | 'relocated' | 'other';
  currentYear: number;
  currentTimestep: number;
  notifyEmployees?: boolean;
}

export interface OwnershipTransferOptions {
  businessId: string;
  newOwnerId: string;
  transferReason: 'sale' | 'inheritance' | 'gift' | 'partnership';
  salePrice?: number;
  currentYear: number;
  currentTimestep: number;
}

/**
 * Found a new business
 */
export async function foundBusiness(options: BusinessFoundingOptions): Promise<Business> {
  const { worldId, founderId, name, businessType, address, currentYear, currentTimestep, initialVacancies } = options;
  
  // Get founder
  const founder = await storage.getCharacter(founderId);
  if (!founder) {
    throw new Error(`Founder character ${founderId} not found`);
  }
  
  // Create business
  const business = await storage.createBusiness({
    worldId,
    name,
    businessType,
    address,
    ownerId: founderId,
    foundedYear: currentYear,
    isOutOfBusiness: false,
    vacancies: initialVacancies || { day: [], night: [] }
  });
  
  console.log(`✓ Founded business: ${name} (${businessType}) by ${founder.firstName} ${founder.lastName}`);
  
  // Store in founder's business history
  const customData = (founder as any).customData as Record<string, any> | undefined;
  const businessHistory = (customData?.businessHistory as any[]) || [];
  businessHistory.push({
    businessId: business.id,
    businessName: name,
    role: 'founder',
    startYear: currentYear,
    endYear: null,
    active: true
  });
  
  await storage.updateCharacter(founderId, {
    ...((customData || true) && {
      customData: {
        ...(customData || {}),
        businessHistory,
        currentBusiness: business.id
      }
    })
  } as any);
  
  // Generate founding event
  try {
    await generateEvent({
      worldId,
      currentYear,
      currentTimestep,
      characterId: founderId,
      eventType: 'business_founding',
      autoGenerateNarrative: true
    }, {
      businessId: business.id,
      businessName: name,
      location: address
    });
  } catch (error) {
    console.error('Failed to generate business founding event:', error);
  }
  
  return business;
}

/**
 * Close a business
 */
export async function closeBusiness(options: BusinessClosureOptions): Promise<void> {
  const { businessId, reason, currentYear, currentTimestep, notifyEmployees = true } = options;
  
  // Get business
  const business = await storage.getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }
  
  if (business.isOutOfBusiness) {
    throw new Error(`Business ${business.name} is already closed`);
  }
  
  console.log(`✓ Closing business: ${business.name} (Reason: ${reason})`);
  
  // Fire all employees if requested
  if (notifyEmployees) {
    const employees = await storage.getCharactersByWorld(business.worldId);
    for (const employee of employees) {
      const customData = (employee as any).customData as Record<string, any> | undefined;
      const currentOccupation = customData?.currentOccupation as any;
      
      if (currentOccupation && currentOccupation.businessId === businessId) {
        try {
          await fireEmployee(employee.id, 'quit', currentYear);
          console.log(`  ✓ Terminated employee: ${employee.firstName} ${employee.lastName}`);
        } catch (error) {
          console.error(`Failed to fire employee ${employee.id}:`, error);
        }
      }
    }
  }
  
  // Update business status
  await storage.updateBusiness(businessId, {
    isOutOfBusiness: true,
    closedYear: currentYear
  });
  
  // Update owner's business history
  if (business.ownerId) {
    const owner = await storage.getCharacter(business.ownerId);
    if (owner) {
      const customData = (owner as any).customData as Record<string, any> | undefined;
      const businessHistory = (customData?.businessHistory as any[]) || [];
      const updatedHistory = businessHistory.map((bh: any) => {
        if (bh.businessId === businessId && bh.active) {
          return { ...bh, endYear: currentYear, active: false };
        }
        return bh;
      });
      
      await storage.updateCharacter(business.ownerId, {
        ...((customData || true) && {
          customData: {
            ...(customData || {}),
            businessHistory: updatedHistory,
            currentBusiness: null
          }
        })
      } as any);
    }
  }
  
  // Generate closure event
  try {
    await generateEvent({
      worldId: business.worldId,
      currentYear,
      currentTimestep,
      characterId: business.ownerId || '',
      eventType: 'business_closure',
      autoGenerateNarrative: true
    }, {
      businessId,
      businessName: business.name,
      location: business.address,
      tags: [reason]
    });
  } catch (error) {
    console.error('Failed to generate business closure event:', error);
  }
}

/**
 * Transfer business ownership
 */
export async function transferOwnership(options: OwnershipTransferOptions): Promise<void> {
  const { businessId, newOwnerId, transferReason, salePrice, currentYear, currentTimestep } = options;
  
  // Get business
  const business = await storage.getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }
  
  if (business.isOutOfBusiness) {
    throw new Error(`Cannot transfer ownership of inactive business: ${business.name}`);
  }
  
  // Get old and new owners
  const oldOwnerId = business.ownerId;
  const newOwner = await storage.getCharacter(newOwnerId);
  if (!newOwner) {
    throw new Error(`New owner character ${newOwnerId} not found`);
  }
  
  console.log(`✓ Transferring ownership of ${business.name} to ${newOwner.firstName} ${newOwner.lastName}`);
  
  // Update old owner's business history (if exists)
  if (oldOwnerId) {
    const oldOwner = await storage.getCharacter(oldOwnerId);
    if (oldOwner) {
      const customData = (oldOwner as any).customData as Record<string, any> | undefined;
      const businessHistory = (customData?.businessHistory as any[]) || [];
      const updatedHistory = businessHistory.map((bh: any) => {
        if (bh.businessId === businessId && bh.active) {
          return { ...bh, endYear: currentYear, active: false, exitReason: transferReason };
        }
        return bh;
      });
      
      await storage.updateCharacter(oldOwnerId, {
        ...((customData || true) && {
          customData: {
            ...(customData || {}),
            businessHistory: updatedHistory,
            currentBusiness: null
          }
        })
      } as any);
    }
  }
  
  // Update new owner's business history
  const newOwnerData = (newOwner as any).customData as Record<string, any> | undefined;
  const newBusinessHistory = (newOwnerData?.businessHistory as any[]) || [];
  newBusinessHistory.push({
    businessId,
    businessName: business.name,
    role: 'owner',
    startYear: currentYear,
    endYear: null,
    active: true,
    acquisitionReason: transferReason,
    purchasePrice: salePrice
  });
  
  await storage.updateCharacter(newOwnerId, {
    ...((newOwnerData || true) && {
      customData: {
        ...(newOwnerData || {}),
        businessHistory: newBusinessHistory,
        currentBusiness: businessId
      }
    })
  } as any);
  
  // Update business owner
  await storage.updateBusiness(businessId, {
    ownerId: newOwnerId
  });
  
  // Generate ownership transfer event
  try {
    await generateEvent({
      worldId: business.worldId,
      currentYear,
      currentTimestep,
      characterId: newOwnerId,
      eventType: 'business_founding',
      autoGenerateNarrative: true
    }, {
      businessId,
      businessName: business.name,
      targetCharacterId: oldOwnerId,
      targetCharacterName: oldOwnerId ? 'previous owner' : 'unknown',
      title: `${business.name} Changes Ownership`,
      narrativeText: `${newOwner.firstName} ${newOwner.lastName} took over ownership of ${business.name} in ${currentYear}.`,
      tags: [transferReason, salePrice ? `sale_${salePrice}` : '']
    });
  } catch (error) {
    console.error('Failed to generate ownership transfer event:', error);
  }
}

/**
 * Get business summary with owner and employee count
 */
export async function getBusinessSummary(businessId: string): Promise<{
  business: Business;
  owner: Character | null;
  employeeCount: number;
  employees: Character[];
}> {
  const business = await storage.getBusiness(businessId);
  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }
  
  // Get owner
  let owner: Character | null = null;
  if (business.ownerId) {
    owner = await storage.getCharacter(business.ownerId) || null;
  }
  
  // Get employees
  const allCharacters = await storage.getCharactersByWorld(business.worldId);
  const employees = allCharacters.filter(char => {
    const customData = (char as any).customData as Record<string, any> | undefined;
    const currentOccupation = customData?.currentOccupation as any;
    return currentOccupation && currentOccupation.businessId === businessId;
  });
  
  return {
    business,
    owner,
    employeeCount: employees.length,
    employees
  };
}

/**
 * Get all businesses owned by a character
 */
export async function getCharacterBusinesses(characterId: string): Promise<Business[]> {
  const character = await storage.getCharacter(characterId);
  if (!character) {
    return [];
  }
  
  const customData = (character as any).customData as Record<string, any> | undefined;
  const businessHistory = (customData?.businessHistory as any[]) || [];
  
  // Get all active businesses
  const activeBusinesses = businessHistory.filter((bh: any) => bh.active);
  const businesses: Business[] = [];
  
  for (const bh of activeBusinesses) {
    try {
      const business = await storage.getBusiness(bh.businessId);
      if (business && !business.isOutOfBusiness) {
        businesses.push(business);
      }
    } catch (error) {
      console.error(`Failed to get business ${bh.businessId}:`, error);
    }
  }
  
  return businesses;
}

/**
 * Get all businesses in a world by status
 */
export async function getBusinessesByStatus(
  worldId: string,
  isOutOfBusiness?: boolean
): Promise<Business[]> {
  const allBusinesses = await storage.getBusinessesByWorld(worldId);
  
  if (isOutOfBusiness !== undefined) {
    return allBusinesses.filter((b: Business) => b.isOutOfBusiness === isOutOfBusiness);
  }
  
  return allBusinesses;
}

/**
 * Get business statistics for a world
 */
export async function getBusinessStatistics(worldId: string): Promise<{
  totalBusinesses: number;
  activeBusinesses: number;
  closedBusinesses: number;
  businessesByType: Record<string, number>;
  averageEmployeesPerBusiness: number;
  totalEmployees: number;
}> {
  const businesses = await storage.getBusinessesByWorld(worldId);
  const characters = await storage.getCharactersByWorld(worldId);
  
  const activeBusinesses = businesses.filter((b: Business) => !b.isOutOfBusiness);
  const closedBusinesses = businesses.filter((b: Business) => b.isOutOfBusiness);
  
  // Count by type
  const businessesByType: Record<string, number> = {};
  for (const business of businesses) {
    const type = business.businessType || 'unknown';
    businessesByType[type] = (businessesByType[type] || 0) + 1;
  }
  
  // Count employees
  let totalEmployees = 0;
  for (const character of characters) {
    const customData = (character as any).customData as Record<string, any> | undefined;
    const currentOccupation = customData?.currentOccupation as any;
    if (currentOccupation) {
      totalEmployees++;
    }
  }
  
  const averageEmployeesPerBusiness = activeBusinesses.length > 0 
    ? totalEmployees / activeBusinesses.length 
    : 0;
  
  return {
    totalBusinesses: businesses.length,
    activeBusinesses: activeBusinesses.length,
    closedBusinesses: closedBusinesses.length,
    businessesByType,
    averageEmployeesPerBusiness: Math.round(averageEmployeesPerBusiness * 10) / 10,
    totalEmployees
  };
}
