/**
 * Talk of the Town (TotT) Systems
 * 
 * All systems derived from James Ryan's Talk of the Town social simulation.
 * Includes core simulation features and 8 phases of polish features.
 * 
 * Phases implemented:
 * - Phase 13: Physical Appearance
 * - Phase 14: Grieving System
 * - Phase 15: College Education
 * - Phase 16: Building Commission
 * - Phase 17: Advanced Names
 * - Phase 18: Drama Recognition
 * - Phase 19: Artifacts & Signals
 * - Phase 20: Sexuality & Fertility
 */

// Phase 13: Physical Appearance
export * from './appearance-system';

// Phase 19: Artifacts & Signals
export * from './artifact-system';

// Phases 11-12: Autonomous Behavior
export * from './autonomous-behavior-system';

// Phase 16: Building Commission
export * from './building-commission-system';

// Business operations (business.py)
export * from './business-system';

// Conversation & dialogue (conversation.py)
export * from './conversation-system';

// Phase 18: Drama Recognition
export * from './drama-recognition-system';

// Economic systems (economy features)
export * from './economics-system';

// Phase 15: College Education
export * from './education-system';

// Event scheduling & management (event.py)
export * from './event-system';

// Phase 14: Grieving System
export * from './grieving-system';

// Job hiring & employment (occupation.py)
export * from './hiring-system';

// Knowledge & Mental Models (belief.py)
export * from './knowledge-system';

// Birth, death, aging, marriage lifecycle (person.py)
export * from './lifecycle-system';

// Phase 17: Advanced Names
export * from './name-system';

// Phase 12: Personality-Driven Behavior
export * from './personality-behavior-system';

// Relationship Utilities
export * from './relationship-utils';

// Daily routines & schedules (routine.py)
export * from './routine-system';

// Phase 20: Sexuality & Fertility
export * from './sexuality-system';

// Social Dynamics
export * from './social-dynamics-system';

// Town-wide simulation events
export * from './town-events-system';
