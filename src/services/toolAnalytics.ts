/**
 * Tool Analytics Service
 * Tracks tool execution metrics, performance, and usage patterns
 */

import { ToolMetrics } from '../types/toolRegistry';

export class ToolAnalytics {
  private metrics = new Map<string, ToolMetrics>();
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Track a tool execution
   */
  trackExecution(
    toolName: string,
    duration: number,
    success: boolean,
    errorMessage?: string
  ): void {
    if (!this.enabled) return;

    const existing = this.metrics.get(toolName) || this.createEmptyMetrics();

    existing.executionCount++;
    existing.totalDuration += duration;
    existing.averageDuration = existing.totalDuration / existing.executionCount;
    existing.lastExecuted = Date.now();

    if (success) {
      existing.successCount++;
    } else {
      existing.failureCount++;
      if (errorMessage) {
        existing.errorMessages.push(errorMessage);
        // Keep only last 10 errors
        if (existing.errorMessages.length > 10) {
          existing.errorMessages.shift();
        }
      }
    }

    this.metrics.set(toolName, existing);
  }

  /**
   * Get metrics for a specific tool
   */
  getMetrics(toolName: string): ToolMetrics | null {
    return this.metrics.get(toolName) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, ToolMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get top N most used tools
   */
  getTopTools(limit: number = 10): Array<{ name: string; metrics: ToolMetrics }> {
    return Array.from(this.metrics.entries())
      .sort((a, b) => b[1].executionCount - a[1].executionCount)
      .slice(0, limit)
      .map(([name, metrics]) => ({ name, metrics }));
  }

  /**
   * Get tools exceeding performance threshold
   */
  getSlowTools(thresholdMs: number = 1000): Array<{ name: string; metrics: ToolMetrics }> {
    return Array.from(this.metrics.entries())
      .filter(([_, metrics]) => metrics.averageDuration > thresholdMs)
      .map(([name, metrics]) => ({ name, metrics }))
      .sort((a, b) => b.metrics.averageDuration - a.metrics.averageDuration);
  }

  /**
   * Get tools with high failure rates
   */
  getProblematicTools(minExecutions: number = 5, failureRateThreshold: number = 0.2): Array<{ name: string; metrics: ToolMetrics; failureRate: number }> {
    return Array.from(this.metrics.entries())
      .filter(([_, metrics]) => metrics.executionCount >= minExecutions)
      .map(([name, metrics]) => ({
        name,
        metrics,
        failureRate: metrics.failureCount / metrics.executionCount,
      }))
      .filter(item => item.failureRate >= failureRateThreshold)
      .sort((a, b) => b.failureRate - a.failureRate);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const allMetrics = Array.from(this.metrics.values());
    
    const totalExecutions = allMetrics.reduce((sum, m) => sum + m.executionCount, 0);
    const totalSuccess = allMetrics.reduce((sum, m) => sum + m.successCount, 0);
    const totalFailures = allMetrics.reduce((sum, m) => sum + m.failureCount, 0);
    const avgDuration = allMetrics.reduce((sum, m) => sum + m.averageDuration, 0) / (allMetrics.length || 1);

    return {
      toolsTracked: this.metrics.size,
      totalExecutions,
      totalSuccess,
      totalFailures,
      overallSuccessRate: totalExecutions > 0 ? totalSuccess / totalExecutions : 0,
      averageDuration: avgDuration,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Reset metrics for a specific tool
   */
  resetTool(toolName: string): void {
    this.metrics.delete(toolName);
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const data = {
      summary: this.getSummary(),
      topTools: this.getTopTools(),
      slowTools: this.getSlowTools(),
      problematicTools: this.getProblematicTools(),
      allMetrics: Object.fromEntries(this.metrics),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): ToolMetrics {
    return {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      errorMessages: [],
    };
  }
}

