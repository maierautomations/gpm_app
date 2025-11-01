import { logger } from './logger';

interface PerformanceMark {
  label: string;
  timestamp: number;
}

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private enabled: boolean = __DEV__; // Only in development

  /**
   * Mark a point in time during startup
   */
  mark(label: string): void {
    if (!this.enabled) return;

    const timestamp = Date.now();
    this.marks.set(label, timestamp);

    logger.debug(`[Perf] ${label} @ ${timestamp}ms`);
  }

  /**
   * Measure time between two marks
   */
  measure(startLabel: string, endLabel: string): number {
    if (!this.enabled) return 0;

    const start = this.marks.get(startLabel);
    const end = this.marks.get(endLabel);

    if (!start || !end) {
      logger.warn(`[Perf] Missing marks: ${startLabel} or ${endLabel}`);
      return 0;
    }

    const duration = end - start;
    logger.debug(`[Perf] ${startLabel} → ${endLabel}: ${duration}ms`);

    return duration;
  }

  /**
   * Get complete startup summary
   */
  getStartupSummary(): { total: number; breakdown: Record<string, number> } {
    if (!this.enabled) {
      return { total: 0, breakdown: {} };
    }

    const appStart = this.marks.get('app_module_load') || 0;
    const appReady = this.marks.get('home_data_loaded') || 0;

    return {
      total: appReady - appStart,
      breakdown: {
        moduleLoad: this.measure('app_module_load', 'app_component_mount'),
        authInit: this.measure('app_component_mount', 'auth_complete'),
        firstRender: this.measure('auth_complete', 'home_screen_mount'),
        dataLoad: this.measure('home_screen_mount', 'home_data_loaded'),
      }
    };
  }

  /**
   * Log startup summary (call after app is fully ready)
   */
  logSummary(): void {
    if (!this.enabled) return;

    const summary = this.getStartupSummary();

    logger.info(
      `🚀 App startup completed in ${summary.total}ms`,
      summary.breakdown
    );

    // Warn if any phase is too slow
    if (summary.breakdown.authInit > 500) {
      logger.warn('⚠️ Auth initialization is slow (>500ms)');
    }
    if (summary.breakdown.dataLoad > 1000) {
      logger.warn('⚠️ Data loading is slow (>1000ms)');
    }
  }

  /**
   * Clear all marks (useful for testing)
   */
  clear(): void {
    this.marks.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();
