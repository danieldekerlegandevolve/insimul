# Phase 9: Economic Systems - Prolog Specification

## Architecture Philosophy

**Prolog-first design**: Economic predicates enable simulation rules to trigger trade, employment, and market transactions. TypeScript manages wealth tracking, prices, and transaction history, while Prolog determines economic behavior based on needs, resources, and social relationships.

---

## Core Prolog Predicates

### 1. Wealth & Money

```prolog
% Wealth
has_money(Character, Amount).
wealth_level(Character, Level).  % poor, working_class, middle_class, wealthy, rich

% Income & expenses
income(Character, Amount).
salary(Character, Employer, Amount).
expenses(Character, Amount).

% Debts
owes_money(Debtor, Creditor, Amount).
in_debt(Character).

% Examples:
has_money(alice, 500).
wealth_level(alice, middle_class).
salary(alice, tavern_business, 50).
owes_money(bob, alice, 100).
```

### 2. Employment & Occupation

```prolog
% Employment (already partially exists, but enhanced)
employed(Character, Business, Occupation).
unemployed(Character).
seeking_employment(Character, OccupationType).

% Employment history
worked_for(Character, Business, StartYear, EndYear).
promoted(Character, Business, OldPosition, NewPosition, Year).
fired(Character, Business, Year, Reason).

% Wages
earns_wage(Character, Amount).
wage_for_occupation(Occupation, Amount).

% Examples:
employed(alice, tavern_001, barmaid).
earns_wage(alice, 50).
worked_for(bob, farm_001, 1890, 1895).
```

### 3. Trade & Commerce

```prolog
% Trade transactions
traded(Seller, Buyer, Item, Price, Timestep).
recent_trade(Seller, Buyer, Item).

% Market prices
market_price(Item, Price).
price_at(Item, Business, Price).

% Goods & inventory
has_goods(Business, Item, Quantity).
needs_goods(Business, Item).
produces(Business, Item).

% Examples:
traded(alice, bob, bread, 5, 1000).
market_price(bread, 5).
has_goods(bakery_001, bread, 50).
produces(bakery_001, bread).
```

### 4. Business Economics

```prolog
% Business finances
business_revenue(Business, Amount).
business_expenses(Business, Amount).
business_profit(Business, Amount).
profitable(Business).
bankrupt(Business).

% Customers
customer_of(Customer, Business).
regular_customer(Customer, Business).
transaction_count(Customer, Business, Count).

% Supply & demand
high_demand(Item).
oversupply(Item).
shortage(Item).

% Examples:
business_revenue(tavern_001, 500).
business_profit(tavern_001, 100).
profitable(tavern_001).
customer_of(alice, bakery_001).
high_demand(bread).
```

### 5. Pricing & Value

```prolog
% Value assessment
item_value(Item, Value).
fair_price(Item, Price).
expensive(Item, Price).
cheap(Item, Price).

% Negotiation
willing_to_pay(Buyer, Item, MaxPrice).
willing_to_sell(Seller, Item, MinPrice).
negotiated_price(Buyer, Seller, Item, FinalPrice).

% Examples:
item_value(bread, 5).
expensive(bread, 10).  % If price > value * 1.5
cheap(bread, 3).       % If price < value * 0.8
willing_to_pay(alice, bread, 7).
```

### 6. Economic Class & Social Mobility

```prolog
% Economic classes
poor(Character).
working_class(Character).
middle_class(Character).
wealthy(Character).
rich(Character).

% Class transitions
upward_mobility(Character, OldClass, NewClass, Year).
downward_mobility(Character, OldClass, NewClass, Year).

% Class based on wealth thresholds
poor(X) :- has_money(X, M), M < 100.
working_class(X) :- has_money(X, M), M >= 100, M < 500.
middle_class(X) :- has_money(X, M), M >= 500, M < 2000.
wealthy(X) :- has_money(X, M), M >= 2000, M < 10000.
rich(X) :- has_money(X, M), M >= 10000.
```

---

## Prolog Rule Examples (For Simulation)

### Employment & Job Seeking

```prolog
% Rule: Seek employment when unemployed and poor
trigger_job_search(Character) :-
    unemployed(Character),
    adult(Character),
    has_money(Character, Money),
    Money < 50,
    has_skill(Character, Skill, Level),
    Level > 3.
% Effect: seeking_employment(Character, SkillType)

% Rule: Hire employee when business needs workers
trigger_hire(Business, Character) :-
    business_needs_worker(Business, Skill),
    seeking_employment(Character, Skill),
    has_skill(Character, Skill, Level),
    Level > 3,
    can_afford_salary(Business, Character).
% Effect: employ(Character, Business, Occupation, Salary)

% Rule: Fire employee when business is unprofitable
trigger_fire(Business, Employee) :-
    employed(Employee, Business, _),
    business_profit(Business, Profit),
    Profit < 0,
    \+ essential_employee(Employee, Business).
% Effect: fire(Employee, Business, Reason)
```

### Trade & Shopping

```prolog
% Rule: Buy goods when needed
trigger_purchase(Buyer, Seller, Item) :-
    needs_item(Buyer, Item),
    has_goods(Seller, Item, Quantity),
    Quantity > 0,
    market_price(Item, Price),
    has_money(Buyer, Money),
    Money >= Price,
    at_same_location(Buyer, Seller).
% Effect: trade(Buyer, Seller, Item, Price, Timestep)

% Rule: Sell goods to make profit
trigger_sale(Seller, Buyer, Item) :-
    business_has_excess(Seller, Item),
    wants_item(Buyer, Item),
    market_price(Item, Price),
    has_money(Buyer, Money),
    Money >= Price.
% Effect: trade(Seller, Buyer, Item, Price, Timestep)
```

### Price Negotiation

```prolog
% Rule: Negotiate lower price with friends
trigger_discount(Seller, Buyer, Item) :-
    friends(Seller, Buyer),
    wants_to_buy(Buyer, Item, Seller),
    market_price(Item, BasePrice),
    relationship_charge(Seller, Buyer, Charge),
    Charge > 10.
% Effect: Reduce price by (Charge / 100) * BasePrice

% Rule: Charge premium to enemies
trigger_premium(Seller, Buyer, Item) :-
    wants_to_buy(Buyer, Item, Seller),
    relationship_charge(Seller, Buyer, Charge),
    Charge < -5,
    market_price(Item, BasePrice).
% Effect: Increase price by 0.2 * BasePrice
```

### Business Economics

```prolog
% Rule: Raise prices when demand is high
trigger_price_increase(Business, Item) :-
    produces(Business, Item),
    high_demand(Item),
    market_price(Item, CurrentPrice),
    \+ expensive(Item, CurrentPrice).
% Effect: Increase market_price(Item) by 10%

% Rule: Lower prices when oversupply
trigger_price_decrease(Business, Item) :-
    has_goods(Business, Item, Quantity),
    Quantity > 20,
    market_price(Item, CurrentPrice),
    \+ cheap(Item, CurrentPrice).
% Effect: Decrease market_price(Item) by 10%

% Rule: Business goes bankrupt
trigger_bankruptcy(Business) :-
    business_profit(Business, Profit),
    Profit < -500,
    business_revenue(Business, Revenue),
    Revenue < 50.
% Effect: bankrupt(Business), fire all employees
```

### Economic Mobility

```prolog
% Rule: Move up economic class
trigger_upward_mobility(Character) :-
    working_class(Character),
    has_money(Character, Money),
    Money >= 500,  % Threshold for middle class
    employed(Character, _, _),
    salary(Character, _, Salary),
    Salary > 40.
% Effect: Change wealth_level(Character, middle_class)

% Rule: Fall into poverty
trigger_downward_mobility(Character) :-
    middle_class(Character),
    has_money(Character, Money),
    Money < 100,
    unemployed(Character).
% Effect: Change wealth_level(Character, poor)
```

### Debt & Loans

```prolog
% Rule: Borrow money when desperate
trigger_loan_request(Borrower, Lender) :-
    has_money(Borrower, Money),
    Money < 10,
    needs_money(Borrower, Amount),
    friends(Borrower, Lender),
    has_money(Lender, LenderMoney),
    LenderMoney > Amount * 2,
    relationship_trust(Lender, Borrower, Trust),
    Trust > 0.7.
% Effect: Transfer money, create debt

% Rule: Repay debt when able
trigger_debt_repayment(Debtor, Creditor) :-
    owes_money(Debtor, Creditor, Amount),
    has_money(Debtor, Money),
    Money > Amount * 1.5,  % Has surplus
    relationship_charge(Debtor, Creditor, Charge),
    Charge > 0.  % Not enemies
% Effect: Transfer money, remove debt
```

---

## Data Structures (TypeScript)

### Wealth & Money

```typescript
interface Wealth {
  characterId: string;
  currentMoney: number;
  
  // Income sources
  income: {
    salary?: number;
    businessProfit?: number;
    other?: number;
  };
  
  // Expenses
  expenses: {
    housing?: number;
    food?: number;
    other?: number;
  };
  
  // Net worth
  netWorth: number;  // Money + asset value
  economicClass: 'poor' | 'working_class' | 'middle_class' | 'wealthy' | 'rich';
  
  // History
  transactions: Transaction[];
  wealthHistory: Array<{
    timestamp: number;
    amount: number;
  }>;
}
```

### Transaction

```typescript
interface Transaction {
  id: string;
  timestamp: number;
  type: 'purchase' | 'sale' | 'salary' | 'loan' | 'repayment' | 'gift';
  
  // Parties
  fromId?: string;  // Payer/seller
  toId?: string;    // Receiver/buyer
  
  // Details
  amount: number;
  item?: string;
  itemQuantity?: number;
  
  // Location
  location?: string;
  businessId?: string;
  
  // Notes
  description?: string;
}
```

### Employment Contract

```typescript
interface EmploymentContract {
  id: string;
  employeeId: string;
  employerId: string;  // Business ID
  occupation: string;
  
  // Terms
  salary: number;
  startDate: number;
  endDate?: number;
  
  // Status
  status: 'active' | 'terminated' | 'resigned';
  terminationReason?: string;
  terminationDate?: number;
  
  // Performance
  performanceRating?: number;  // 0-10
  promotions: Array<{
    date: number;
    oldPosition: string;
    newPosition: string;
    newSalary: number;
  }>;
}
```

### Trade

```typescript
interface Trade {
  id: string;
  timestamp: number;
  
  // Parties
  sellerId: string;
  buyerId: string;
  
  // Item
  item: string;
  quantity: number;
  
  // Pricing
  basePrice: number;      // Market price
  finalPrice: number;     // Negotiated price
  discount?: number;      // % off
  
  // Location
  location: string;
  businessId?: string;
  
  // Negotiation
  negotiated: boolean;
  negotiationFactor?: number;  // Based on relationship
}
```

### Market Data

```typescript
interface MarketData {
  worldId: string;
  timestamp: number;
  
  // Prices
  prices: {
    [item: string]: {
      current: number;
      average: number;
      high: number;
      low: number;
      trend: 'rising' | 'falling' | 'stable';
    };
  };
  
  // Supply & demand
  supply: {
    [item: string]: number;  // Total quantity available
  };
  
  demand: {
    [item: string]: number;  // Total demand
  };
  
  // Economic indicators
  indicators: {
    averageWealth: number;
    medianWealth: number;
    unemploymentRate: number;
    inflationRate: number;
  };
}
```

### Debt

```typescript
interface Debt {
  id: string;
  debtorId: string;
  creditorId: string;
  
  // Amount
  originalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  
  // Dates
  loanDate: number;
  dueDate?: number;
  
  // Repayment
  payments: Array<{
    amount: number;
    timestamp: number;
  }>;
  
  // Status
  status: 'active' | 'paid' | 'defaulted';
  defaultDate?: number;
}
```

---

## Economic Calculations

### Wealth Classification

```typescript
function classifyWealth(money: number): string {
  if (money < 100) return 'poor';
  if (money < 500) return 'working_class';
  if (money < 2000) return 'middle_class';
  if (money < 10000) return 'wealthy';
  return 'rich';
}
```

### Price Negotiation

```typescript
function negotiatePrice(
  basePrice: number,
  seller: Character,
  buyer: Character,
  relationship: Relationship
): number {
  let finalPrice = basePrice;
  
  // Friend discount
  if (relationship.charge > 10) {
    const discount = Math.min(0.3, relationship.charge / 50);
    finalPrice *= (1 - discount);
  }
  
  // Enemy premium
  if (relationship.charge < -5) {
    finalPrice *= 1.2;
  }
  
  // Family discount
  if (areRelated(seller.id, buyer.id)) {
    finalPrice *= 0.8;
  }
  
  // Haggling skill (personality-based)
  const buyerHaggling = buyer.personality.extroversion * 0.1;
  const sellerResistance = seller.personality.conscientiousness * 0.05;
  
  finalPrice *= (1 - buyerHaggling + sellerResistance);
  
  return Math.max(1, Math.round(finalPrice));
}
```

### Salary Determination

```typescript
function calculateSalary(
  occupation: string,
  skill: number,
  businessProfitability: number
): number {
  // Base salary by occupation
  const baseSalaries: Record<string, number> = {
    laborer: 20,
    apprentice: 25,
    craftsman: 40,
    merchant: 50,
    manager: 60,
    owner: 100
  };
  
  const base = baseSalaries[occupation] || 30;
  
  // Skill multiplier (skill 1-10)
  const skillMultiplier = 0.8 + (skill / 10) * 0.4;  // 0.8 to 1.2
  
  // Business profitability multiplier
  const profitMultiplier = Math.min(1.5, Math.max(0.5, businessProfitability / 100));
  
  return Math.round(base * skillMultiplier * profitMultiplier);
}
```

### Supply & Demand Pricing

```typescript
function calculateMarketPrice(
  item: string,
  basePrice: number,
  supply: number,
  demand: number
): number {
  const ratio = demand / Math.max(1, supply);
  
  let priceMultiplier = 1.0;
  
  if (ratio > 2.0) {
    // High demand, low supply
    priceMultiplier = 1.5;
  } else if (ratio > 1.2) {
    // Moderate demand
    priceMultiplier = 1.2;
  } else if (ratio < 0.5) {
    // Oversupply
    priceMultiplier = 0.7;
  } else if (ratio < 0.8) {
    // Slight oversupply
    priceMultiplier = 0.9;
  }
  
  return Math.round(basePrice * priceMultiplier);
}
```

---

## API Endpoints (Setup Utilities)

### Wealth Management

```typescript
// Get character wealth
GET /api/economy/wealth/:characterId

// Add money
POST /api/economy/wealth/add
{ characterId, amount, reason, currentTimestep }

// Subtract money
POST /api/economy/wealth/subtract
{ characterId, amount, reason, currentTimestep }

// Get wealth distribution
GET /api/economy/wealth/distribution/:worldId
```

### Employment

```typescript
// Hire employee
POST /api/economy/employment/hire
{ employeeId, businessId, occupation, salary, currentTimestep }

// Fire employee
POST /api/economy/employment/fire
{ employeeId, businessId, reason, currentTimestep }

// Promote employee
POST /api/economy/employment/promote
{ employeeId, businessId, newPosition, newSalary, currentTimestep }

// Pay salaries (for all employees)
POST /api/economy/employment/pay-salaries
{ worldId, currentTimestep }
```

### Trade

```typescript
// Execute trade
POST /api/economy/trade
{ sellerId, buyerId, item, quantity, location, currentTimestep }

// Get trade history
GET /api/economy/trade/history/:characterId

// Get market prices
GET /api/economy/market/prices/:worldId

// Update market price
POST /api/economy/market/price
{ worldId, item, newPrice }
```

### Debt & Loans

```typescript
// Create loan
POST /api/economy/loan/create
{ debtorId, creditorId, amount, interestRate, dueDate, currentTimestep }

// Repay debt
POST /api/economy/loan/repay
{ debtId, amount, currentTimestep }

// Get character debts
GET /api/economy/loan/:characterId
```

### Economy Statistics

```typescript
// Get economic indicators
GET /api/economy/stats/:worldId

// Get unemployment rate
GET /api/economy/stats/:worldId/unemployment

// Get wealth inequality (Gini coefficient)
GET /api/economy/stats/:worldId/inequality
```

---

## Economic Simulation Cycles

### Daily/Weekly Cycles

```typescript
// 1. Pay salaries (weekly)
for (employee of allEmployees) {
  await paySalary(employee, employee.salary);
}

// 2. Collect business revenue
for (business of allBusinesses) {
  await calculateRevenue(business);
}

// 3. Process purchases (daily)
for (character of allCharacters) {
  if (needsFood(character)) {
    await purchaseFood(character);
  }
}

// 4. Update market prices (weekly)
await updateMarketPrices(worldId);
```

---

## Success Criteria

✅ **Prolog predicates** for economic state
✅ **Wealth tracking** with classes
✅ **Employment contracts** with salaries
✅ **Trade mechanics** with negotiation
✅ **Market dynamics** with supply/demand
✅ **Debt system** with loans & repayment
✅ **Price calculation** based on relationships
✅ **Economic indicators** (unemployment, inequality)
✅ **Integration** with Phases 5-8

---

## Next Steps

1. Implement TypeScript economic system
2. Add wealth tracking & transactions
3. Implement trade mechanics
4. Add employment contracts
5. Implement market dynamics
6. Add debt & loan system
7. Create API endpoints
8. Update Prolog sync for economic facts
9. Test economic flows

---

**Phase 9 will enable**: Characters to earn money, trade goods, employ others, go into debt, and experience economic mobility - creating a functioning economy! 💰📈
