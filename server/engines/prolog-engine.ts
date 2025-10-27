/**
 * Prolog Engine Availability Checker
 * 
 * Simple utility to check if SWI-Prolog is installed and available
 */

import { execSync } from 'child_process';

class PrologEngine {
  private available: boolean | null = null;

  /**
   * Check if SWI-Prolog is installed and available
   */
  isAvailable(): boolean {
    // Cache the result to avoid multiple checks
    if (this.available !== null) {
      return this.available;
    }

    try {
      // Try to execute swipl --version
      execSync('swipl --version', { 
        stdio: 'pipe',
        timeout: 5000
      });
      
      this.available = true;
      console.log('✅ SWI-Prolog is available');
      return true;
    } catch (error) {
      this.available = false;
      console.warn('⚠️  SWI-Prolog not found. Install with: brew install swi-prolog');
      return false;
    }
  }

  /**
   * Get SWI-Prolog version
   */
  getVersion(): string | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const output = execSync('swipl --version', { 
        encoding: 'utf-8',
        stdio: 'pipe' 
      });
      return output.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Reset availability check (for testing)
   */
  reset(): void {
    this.available = null;
  }
}

// Export singleton instance
export const prologEngine = new PrologEngine();
