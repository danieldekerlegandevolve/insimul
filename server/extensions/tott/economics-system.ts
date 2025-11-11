/**
 * Economics System (Phase 9)
 * 
 * Prolog-First Design:
 * - TypeScript manages wealth, transactions, and market state
 * - Prolog determines economic behavior via rules
 * - Enables trade, employment, and economic mobility
 * 
 * Based on Talk of the Town's economy and business systems
 */

import { storage } from '../../db/storage';
import type { Character, Business } from '@shared/schema';
import { getRelationshipDetails } from './social-dynamics-system.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type EconomicClass = 'poor' | 'working_class' | 'middle_class' | 'wealthy' | 'rich';
export type TransactionType = 'purchase' | 'sale' | 'salary' | 'loan' | 'repayment' | 'gift';

export interface Wealth {
  characterId: string;
  currentMoney: number;
  income: {
    salary?: number;
    businessProfit?: number;
    other?: number;
  };
  expenses: {
    housing?: number;
    food?: number;
    other?: number;
  };
  netWorth: number;
  economicClass: EconomicClass;
  transactions: Transaction[];
  wealthHistory: Array<{
    timestamp: number;
    amount: number;
  }>;
}

export interface Transaction {
  id: string;
  timestamp: number;
  type: TransactionType;
  fromId?: string;
  toId?: string;
  amount: number;
  item?: string;
  itemQuantity?: number;
  location?: string;
  businessId?: string;
  description?: string;
}

export interface EmploymentContract {
  id: string;
  employeeId: string;
  employerId: string;
  occupation: string;
  salary: number;
  startDate: number;
  endDate?: number;
  status: 'active' | 'terminated' | 'resigned';
  terminationReason?: string;
  terminationDate?: number;
  performanceRating?: number;
  promotions: Array<{
    date: number;
    oldPosition: string;
    newPosition: string;
    newSalary: number;
  }>;
}

export interface Trade {
  id: string;
  timestamp: number;
  sellerId: string;
  buyerId: string;
  item: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  discount?: number;
  location: string;
  businessId?: string;
  negotiated: boolean;
  negotiationFactor?: number;
}

export interface MarketData {
  worldId: string;
  timestamp: number;
  prices: {
    [item: string]: {
      current: number;
      average: number;
      high: number;
      low: number;
      trend: 'rising' | 'falling' | 'stable';
    };
  };
  supply: {
    [item: string]: number;
  };
  demand: {
    [item: string]: number;
  };
  indicators: {
    averageWealth: number;
    medianWealth: number;
    unemploymentRate: number;
    inflationRate: number;
  };
}

export interface Debt {
  id: string;
  debtorId: string;
  creditorId: string;
  originalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  loanDate: number;
  dueDate?: number;
  payments: Array<{
    amount: number;
    timestamp: number;
  }>;
  status: 'active' | 'paid' | 'defaulted';
  defaultDate?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Wealth thresholds
  poorThreshold: 100,
  workingClassThreshold: 500,
  middleClassThreshold: 2000,
  wealthyThreshold: 10000,
  
  // Base salaries by occupation
  baseSalaries: {
    laborer: 20,
    apprentice: 25,
    craftsman: 40,
    merchant: 50,
    manager: 60,
    barmaid: 30,
    farmer: 35,
    baker: 40,
    blacksmith: 45,
    tavernkeeper: 55
  },
  
  // Price negotiation
  maxFriendDiscount: 0.3,
  enemyPremium: 0.2,
  familyDiscount: 0.2,
  
  // Market dynamics
  highDemandThreshold: 2.0,
  oversupplyThreshold: 0.5,
  priceAdjustmentRate: 0.1,
  
  // Debt
  defaultInterestRate: 0.05,
  defaultLoanTerm: 365  // days
};

// In-memory storage for economic data
const wealthRecords = new Map<string, Wealth>();
const employmentContracts = new Map<string, EmploymentContract>();
const tradeHistory: Trade[] = [];
const marketData = new Map<string, MarketData>();
const debts = new Map<string, Debt>();

// ============================================================================
// WEALTH MANAGEMENT
// ============================================================================

export async function getWealth(characterId: string): Promise<Wealth> {
  let wealth = wealthRecords.get(characterId);
  
  if (!wealth) {
    wealth = {
      characterId,
      currentMoney: 100,  // Starting money
      income: {},
      expenses: {},
      netWorth: 100,
      economicClass: classifyWealth(100),
      transactions: [],
      wealthHistory: [{ timestamp: 0, amount: 100 }]
    };
    wealthRecords.set(characterId, wealth);
  }
  
  return wealth;
}

export function classifyWealth(money: number): EconomicClass {
  if (money < CONFIG.poorThreshold) return 'poor';
  if (money < CONFIG.workingClassThreshold) return 'working_class';
  if (money < CONFIG.middleClassThreshold) return 'middle_class';
  if (money < CONFIG.wealthyThreshold) return 'wealthy';
  return 'rich';
}

export async function addMoney(
  characterId: string,
  amount: number,
  reason: string,
  currentTimestep: number
): Promise<Wealth> {
  const wealth = await getWealth(characterId);
  
  wealth.currentMoney += amount;
  wealth.netWorth += amount;
  wealth.economicClass = classifyWealth(wealth.currentMoney);
  
  wealth.transactions.push({
    id: `txn_${Date.now()}`,
    timestamp: currentTimestep,
    type: 'gift',
    toId: characterId,
    amount,
    description: reason
  });
  
  wealth.wealthHistory.push({
    timestamp: currentTimestep,
    amount: wealth.currentMoney
  });
  
  wealthRecords.set(characterId, wealth);
  return wealth;
}

export async function subtractMoney(
  characterId: string,
  amount: number,
  reason: string,
  currentTimestep: number
): Promise<Wealth> {
  const wealth = await getWealth(characterId);
  
  if (wealth.currentMoney < amount) {
    throw new Error(`Insufficient funds: has ${wealth.currentMoney}, needs ${amount}`);
  }
  
  wealth.currentMoney -= amount;
  wealth.netWorth -= amount;
  wealth.economicClass = classifyWealth(wealth.currentMoney);
  
  wealth.transactions.push({
    id: `txn_${Date.now()}`,
    timestamp: currentTimestep,
    type: 'purchase',
    fromId: characterId,
    amount,
    description: reason
  });
  
  wealth.wealthHistory.push({
    timestamp: currentTimestep,
    amount: wealth.currentMoney
  });
  
  wealthRecords.set(characterId, wealth);
  return wealth;
}

export async function transferMoney(
  fromId: string,
  toId: string,
  amount: number,
  reason: string,
  currentTimestep: number
): Promise<{ from: Wealth; to: Wealth }> {
  await subtractMoney(fromId, amount, reason, currentTimestep);
  await addMoney(toId, amount, reason, currentTimestep);
  
  return {
    from: await getWealth(fromId),
    to: await getWealth(toId)
  };
}

export async function getWealthDistribution(worldId: string): Promise<{
  byClass: Record<EconomicClass, number>;
  total: number;
  average: number;
  median: number;
}> {
  const characters = await storage.getCharactersByWorld(worldId);
  const wealths = await Promise.all(
    characters.map(c => getWealth(c.id))
  );
  
  const byClass: Record<EconomicClass, number> = {
    poor: 0,
    working_class: 0,
    middle_class: 0,
    wealthy: 0,
    rich: 0
  };
  
  wealths.forEach(w => {
    byClass[w.economicClass]++;
  });
  
  const amounts = wealths.map(w => w.currentMoney).sort((a, b) => a - b);
  const total = wealths.length;
  const average = amounts.reduce((a, b) => a + b, 0) / total;
  const median = amounts[Math.floor(total / 2)];
  
  return { byClass, total, average, median };
}

// ============================================================================
// EMPLOYMENT
// ============================================================================

export async function hireEmployee(
  employeeId: string,
  businessId: string,
  occupation: string,
  salary: number,
  currentTimestep: number
): Promise<EmploymentContract> {
  const contract: EmploymentContract = {
    id: `contract_${Date.now()}`,
    employeeId,
    employerId: businessId,
    occupation,
    salary,
    startDate: currentTimestep,
    status: 'active',
    promotions: []
  };
  
  employmentContracts.set(contract.id, contract);
  
  // Update wealth income
  const wealth = await getWealth(employeeId);
  wealth.income.salary = salary;
  wealthRecords.set(employeeId, wealth);
  
  return contract;
}

export async function fireEmployee(
  employeeId: string,
  businessId: string,
  reason: string,
  currentTimestep: number
): Promise<void> {
  // Find active contract
  const contract = Array.from(employmentContracts.values()).find(
    c => c.employeeId === employeeId && 
         c.employerId === businessId && 
         c.status === 'active'
  );
  
  if (!contract) {
    throw new Error('No active employment contract found');
  }
  
  contract.status = 'terminated';
  contract.terminationReason = reason;
  contract.terminationDate = currentTimestep;
  contract.endDate = currentTimestep;
  
  employmentContracts.set(contract.id, contract);
  
  // Update wealth income
  const wealth = await getWealth(employeeId);
  delete wealth.income.salary;
  wealthRecords.set(employeeId, wealth);
}

export async function promoteEmployee(
  employeeId: string,
  businessId: string,
  newPosition: string,
  newSalary: number,
  currentTimestep: number
): Promise<EmploymentContract> {
  const contract = Array.from(employmentContracts.values()).find(
    c => c.employeeId === employeeId && 
         c.employerId === businessId && 
         c.status === 'active'
  );
  
  if (!contract) {
    throw new Error('No active employment contract found');
  }
  
  contract.promotions.push({
    date: currentTimestep,
    oldPosition: contract.occupation,
    newPosition,
    newSalary
  });
  
  contract.occupation = newPosition;
  contract.salary = newSalary;
  
  employmentContracts.set(contract.id, contract);
  
  // Update wealth income
  const wealth = await getWealth(employeeId);
  wealth.income.salary = newSalary;
  wealthRecords.set(employeeId, wealth);
  
  return contract;
}

export async function paySalaries(worldId: string, currentTimestep: number): Promise<number> {
  let totalPaid = 0;
  
  for (const contract of employmentContracts.values()) {
    if (contract.status === 'active') {
      try {
        await transferMoney(
          contract.employerId,
          contract.employeeId,
          contract.salary,
          `Salary payment for ${contract.occupation}`,
          currentTimestep
        );
        totalPaid += contract.salary;
      } catch (error) {
        console.error(`Failed to pay salary for ${contract.employeeId}:`, error);
      }
    }
  }
  
  return totalPaid;
}

export function calculateSalary(
  occupation: string,
  skill: number = 5,
  businessProfitability: number = 1.0
): number {
  const base = CONFIG.baseSalaries[occupation as keyof typeof CONFIG.baseSalaries] || 30;
  const skillMultiplier = 0.8 + (skill / 10) * 0.4;
  const profitMultiplier = Math.min(1.5, Math.max(0.5, businessProfitability));
  
  return Math.round(base * skillMultiplier * profitMultiplier);
}

// ============================================================================
// TRADE & COMMERCE
// ============================================================================

export async function executeTrade(
  sellerId: string,
  buyerId: string,
  item: string,
  quantity: number,
  location: string,
  currentTimestep: number
): Promise<Trade> {
  const seller = await storage.getCharacter(sellerId);
  const buyer = await storage.getCharacter(buyerId);
  
  if (!seller || !buyer) {
    throw new Error('Seller or buyer not found');
  }
  
  // Get base price
  const worldId = seller.worldId;
  const market = await getMarketData(worldId, currentTimestep);
  const basePrice = market.prices[item]?.current || 10;
  
  // Negotiate price based on relationship
  const relationship = await getRelationshipDetails(sellerId, buyerId, 1900);
  const finalPrice = await negotiatePrice(basePrice, seller, buyer, relationship);
  
  const totalCost = finalPrice * quantity;
  
  // Execute transaction
  await transferMoney(buyerId, sellerId, totalCost, `Purchase of ${quantity}x ${item}`, currentTimestep);
  
  const trade: Trade = {
    id: `trade_${Date.now()}`,
    timestamp: currentTimestep,
    sellerId,
    buyerId,
    item,
    quantity,
    basePrice,
    finalPrice,
    discount: basePrice > 0 ? (basePrice - finalPrice) / basePrice : 0,
    location,
    negotiated: finalPrice !== basePrice,
    negotiationFactor: relationship.charge / 20
  };
  
  tradeHistory.push(trade);
  
  // Update market supply/demand
  market.supply[item] = (market.supply[item] || 0) - quantity;
  market.demand[item] = (market.demand[item] || 0) + quantity;
  
  return trade;
}

async function negotiatePrice(
  basePrice: number,
  seller: Character,
  buyer: Character,
  relationship: any
): Promise<number> {
  let finalPrice = basePrice;
  
  // Friend discount
  if (relationship.charge > 10) {
    const discount = Math.min(CONFIG.maxFriendDiscount, relationship.charge / 50);
    finalPrice *= (1 - discount);
  }
  
  // Enemy premium
  if (relationship.charge < -5) {
    finalPrice *= (1 + CONFIG.enemyPremium);
  }
  
  // Family discount (check if related)
  if (seller.fatherId === buyer.fatherId || seller.motherId === buyer.motherId) {
    finalPrice *= (1 - CONFIG.familyDiscount);
  }
  
  // Haggling based on personality
  const buyerExtroversion = ((buyer.personality as any)?.extroversion || 0.5);
  const sellerConscientiousness = ((seller.personality as any)?.conscientiousness || 0.5);
  
  const hagglingEffect = buyerExtroversion * 0.1 - sellerConscientiousness * 0.05;
  finalPrice *= (1 + hagglingEffect);
  
  return Math.max(1, Math.round(finalPrice));
}

export async function getTradeHistory(characterId: string): Promise<Trade[]> {
  return tradeHistory.filter(
    t => t.sellerId === characterId || t.buyerId === characterId
  );
}

// ============================================================================
// MARKET DYNAMICS
// ============================================================================

export async function getMarketData(worldId: string, currentTimestep: number): Promise<MarketData> {
  let market = marketData.get(worldId);
  
  if (!market) {
    market = {
      worldId,
      timestamp: currentTimestep,
      prices: {
        bread: { current: 5, average: 5, high: 7, low: 3, trend: 'stable' },
        ale: { current: 3, average: 3, high: 4, low: 2, trend: 'stable' },
        tools: { current: 20, average: 20, high: 25, low: 15, trend: 'stable' },
        cloth: { current: 15, average: 15, high: 20, low: 10, trend: 'stable' }
      },
      supply: {
        bread: 100,
        ale: 150,
        tools: 50,
        cloth: 80
      },
      demand: {
        bread: 100,
        ale: 150,
        tools: 50,
        cloth: 80
      },
      indicators: {
        averageWealth: 500,
        medianWealth: 300,
        unemploymentRate: 0.1,
        inflationRate: 0.02
      }
    };
    marketData.set(worldId, market);
  }
  
  return market;
}

export async function updateMarketPrice(
  worldId: string,
  item: string,
  newPrice: number
): Promise<MarketData> {
  const market = await getMarketData(worldId, Date.now());
  
  if (!market.prices[item]) {
    market.prices[item] = {
      current: newPrice,
      average: newPrice,
      high: newPrice,
      low: newPrice,
      trend: 'stable'
    };
  } else {
    const oldPrice = market.prices[item].current;
    market.prices[item].current = newPrice;
    market.prices[item].high = Math.max(market.prices[item].high, newPrice);
    market.prices[item].low = Math.min(market.prices[item].low, newPrice);
    
    // Update trend
    if (newPrice > oldPrice * 1.1) {
      market.prices[item].trend = 'rising';
    } else if (newPrice < oldPrice * 0.9) {
      market.prices[item].trend = 'falling';
    } else {
      market.prices[item].trend = 'stable';
    }
  }
  
  marketData.set(worldId, market);
  return market;
}

export function calculateMarketPrice(
  basePrice: number,
  supply: number,
  demand: number
): number {
  const ratio = demand / Math.max(1, supply);
  
  let priceMultiplier = 1.0;
  
  if (ratio > CONFIG.highDemandThreshold) {
    priceMultiplier = 1.5;
  } else if (ratio > 1.2) {
    priceMultiplier = 1.2;
  } else if (ratio < CONFIG.oversupplyThreshold) {
    priceMultiplier = 0.7;
  } else if (ratio < 0.8) {
    priceMultiplier = 0.9;
  }
  
  return Math.round(basePrice * priceMultiplier);
}

// ============================================================================
// DEBT & LOANS
// ============================================================================

export async function createLoan(
  debtorId: string,
  creditorId: string,
  amount: number,
  interestRate: number = CONFIG.defaultInterestRate,
  dueDate: number,
  currentTimestep: number
): Promise<Debt> {
  // Transfer money
  await transferMoney(creditorId, debtorId, amount, 'Loan disbursement', currentTimestep);
  
  const debt: Debt = {
    id: `debt_${Date.now()}`,
    debtorId,
    creditorId,
    originalAmount: amount,
    remainingAmount: amount * (1 + interestRate),
    interestRate,
    loanDate: currentTimestep,
    dueDate,
    payments: [],
    status: 'active'
  };
  
  debts.set(debt.id, debt);
  return debt;
}

export async function repayDebt(
  debtId: string,
  amount: number,
  currentTimestep: number
): Promise<Debt> {
  const debt = debts.get(debtId);
  
  if (!debt) {
    throw new Error('Debt not found');
  }
  
  if (debt.status !== 'active') {
    throw new Error('Debt is not active');
  }
  
  // Transfer payment
  await transferMoney(debt.debtorId, debt.creditorId, amount, 'Debt repayment', currentTimestep);
  
  debt.remainingAmount -= amount;
  debt.payments.push({
    amount,
    timestamp: currentTimestep
  });
  
  if (debt.remainingAmount <= 0) {
    debt.status = 'paid';
    debt.remainingAmount = 0;
  }
  
  debts.set(debtId, debt);
  return debt;
}

export async function getCharacterDebts(characterId: string): Promise<{
  asDebtor: Debt[];
  asCreditor: Debt[];
  totalOwed: number;
  totalOwedTo: number;
}> {
  const allDebts = Array.from(debts.values());
  
  const asDebtor = allDebts.filter(d => d.debtorId === characterId && d.status === 'active');
  const asCreditor = allDebts.filter(d => d.creditorId === characterId && d.status === 'active');
  
  const totalOwed = asDebtor.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalOwedTo = asCreditor.reduce((sum, d) => sum + d.remainingAmount, 0);
  
  return { asDebtor, asCreditor, totalOwed, totalOwedTo };
}

// ============================================================================
// ECONOMIC STATISTICS
// ============================================================================

export async function getEconomicStats(worldId: string): Promise<{
  totalWealth: number;
  averageWealth: number;
  medianWealth: number;
  giniCoefficient: number;
  unemploymentRate: number;
  totalTrades: number;
  totalDebts: number;
}> {
  const characters = await storage.getCharactersByWorld(worldId);
  const wealths = await Promise.all(characters.map(c => getWealth(c.id)));
  
  const amounts = wealths.map(w => w.currentMoney).sort((a, b) => a - b);
  const totalWealth = amounts.reduce((a, b) => a + b, 0);
  const averageWealth = totalWealth / amounts.length;
  const medianWealth = amounts[Math.floor(amounts.length / 2)];
  
  // Calculate Gini coefficient (wealth inequality)
  let numerator = 0;
  for (let i = 0; i < amounts.length; i++) {
    for (let j = 0; j < amounts.length; j++) {
      numerator += Math.abs(amounts[i] - amounts[j]);
    }
  }
  const giniCoefficient = numerator / (2 * amounts.length * totalWealth);
  
  // Unemployment rate
  const employed = Array.from(employmentContracts.values()).filter(c => c.status === 'active').length;
  const unemploymentRate = 1 - (employed / characters.length);
  
  const totalTrades = tradeHistory.filter(t => {
    return wealths.some(w => w.characterId === t.buyerId || w.characterId === t.sellerId);
  }).length;
  
  const totalDebts = Array.from(debts.values()).filter(d => d.status === 'active').length;
  
  return {
    totalWealth,
    averageWealth,
    medianWealth,
    giniCoefficient,
    unemploymentRate,
    totalTrades,
    totalDebts
  };
}

export async function getUnemploymentRate(worldId: string): Promise<number> {
  const characters = await storage.getCharactersByWorld(worldId);
  const employed = Array.from(employmentContracts.values()).filter(c => c.status === 'active').length;
  return 1 - (employed / characters.length);
}
