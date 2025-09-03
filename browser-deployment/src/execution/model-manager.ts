// browser-deployment/src/execution/model-manager.ts - Enhanced with Chapter 7 Domain Walkthrough Integration
import { testBedInfo, testControl, updatePerformanceMetrics } from '../controls/test-control';
// ============================================
// 🆕 NEW: CHAPTER 7 WALKTHROUGH IMPORTS
// ============================================
import { 
    unifiedExecutionState, 
    updateUnifiedExecutionState,
    addWalkthroughResult,
    getWalkthroughResults 
} from '../controls/test-control';
 
import { BrowserLogger } from '../ui/browser-logger';
import { ComponentUI } from '../ui/enhanced-ui'; // ADDED: For live component integration
import { LiveComparison } from '../ui/live-comparison'; // ADDED: For real-time updates
import * as webllm from "@mlc-ai/web-llm";
 
// ENHANCED: Prevent circular references with safety check
function updateTestControl(status: string, progress?: number) {
    // PREVENT CIRCULAR CALLS
    if ((updateTestControl as any)._inProgress) {
        console.log(`[ModelManager-Fallback] ${status}${progress ? ` (${progress}%)` : ''}`);
        return;
    }
    
    (updateTestControl as any)._inProgress = true;
    
    try {
        if (typeof window !== 'undefined' && window.testControl?.updateStatus) {
            window.testControl.updateStatus(status, progress);
        } else if (typeof window !== 'undefined' && window.updateTestControl && 
                   window.updateTestControl !== updateTestControl) {
            window.updateTestControl(status, progress);
        } else {
            console.log(`[ModelManager] ${status}${progress ? ` (${progress}%)` : ''}`);
        }
    } catch (error) {
        // Silent fallback
        console.log(`[ModelManager] ${status}${progress ? ` (${progress}%)` : ''}`);
    } finally {
        (updateTestControl as any)._inProgress = false;
    }
}

// Export for use within this module
export { updateTestControl };
const CreateMLCEngine = webllm.CreateMLCEngine;
// Make it available globally with safety checks
if (typeof window !== 'undefined') {
    if (!window.updateTestControl) {
        window.updateTestControl = updateTestControl;
    }
    
    // Also provide a backup reference
    (window as any).modelManagerUpdateTestControl = updateTestControl;
}


// Make it available globally if needed
if (typeof window !== 'undefined' && !window.updateTestControl) {
    window.updateTestControl = updateTestControl;
}
// ADD global declarations for proper TypeScript support
declare global {
    interface Window {
        testControl?: any;
        updateTestControl?: (status: string, progress?: number) => void;
        ModelLoaderManager?: any;
    }
}

// ============================================
// 🆕 NEW: CHAPTER 7 INTERFACES
// ============================================

// Domain-specific model preferences for Chapter 7
interface DomainModelPreferences {
    'appointment-booking': string[];
    'spatial-navigation': string[];
    'failure-diagnostics': string[];
}

// Unified model loading context
interface ModelLoadingContext {
    framework: 'T1-T10' | 'Chapter7' | 'Unified';
    tier: string;
    domain?: string;
    purpose: string;
    priority: 'high' | 'medium' | 'low';
}

// Chapter 7 model performance metrics
interface Chapter7ModelMetrics {
    domainOptimization: Record<string, number>;
    scenarioPerformance: Record<string, number>;
    mcdCompliance: number;
    resourceEfficiency: number;
}

// ✅ ENHANCED: Standardized engine interface for walkthrough compatibility
interface WalkthroughCompatibleEngine {
  chat: {
    completions: {
      create(params: {
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        max_tokens?: number;
        temperature?: number;
        top_p?: number;
        model?: string;
      }): Promise<{
        choices: Array<{ 
          message: { content: string };
          finish_reason?: string;
        }>;
        usage: { 
          total_tokens: number; 
          prompt_tokens?: number; 
          completion_tokens?: number;
        };
        model?: string;
        id?: string;
      }>;
    };
  };
  // Enhanced walkthrough methods
  _mcdConfig?: string[];
  _mcdTier?: string;
  _walkthroughCompatible?: boolean;
  _walkthroughConfig?: any;
  _domainOptimization?: DomainOptimizationConfig;
  
  // Health and monitoring
  getHealth?(): Promise<EngineHealth>;
  getPerformanceMetrics?(): EnginePerformanceMetrics;
  destroy?(): Promise<void>;
}

// Enhanced domain optimization configuration
interface DomainOptimizationConfig {
  domain: string;
  tier: string;
  optimizationLevel: number;
  mcdCompliance: number;
  expectedLatency: number;
  expectedTokens: number;
  fallbackStrategy: 'graceful' | 'immediate' | 'none';
}

// Engine health monitoring
interface EngineHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  memoryUsage: number;
  lastTest: number;
  issues: string[];
  recommendations: string[];
}

// Engine performance metrics
interface EnginePerformanceMetrics {
  averageLatency: number;
  averageTokens: number;
  successRate: number;
  totalRequests: number;
  errorRate: number;
  lastUpdated: number;
}

/**
 * Template cache for DOM update optimization
 */
// REPLACE the entire ModelManagerTemplateCache class with this simplified version:
class SimpleProgressTemplates {
    private static readonly templates = {
        loading: (framework: string, tier: string, domain: string, text: string) => `
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                Current: Loading Model
            </span>
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                ${framework}: ${tier}${domain}
            </span>
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                ${text}
            </span>
        `,
        
        ready: (framework: string, tier: string, domain: string, text: string, badge: string = '📊') => `
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                Current: Model Ready
            </span>
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                ${badge} ${framework}: ${tier}${domain}
            </span>
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                ${text}
            </span>
        `,
        
        error: (framework: string, tier: string, domain: string, text: string) => `
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                Current: Load Failed
            </span>
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                ${framework}: ${tier}${domain}
            </span>
            <span style="background: rgba(220, 53, 69, 0.7); color: white; padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                ${text}
            </span>
        `
    };
    
    static getTemplate(status: 'loading' | 'ready' | 'error', framework: string, tier: string, domain: string, text: string, badge?: string): string {
        const template = this.templates[status];
        return template ? template(framework, tier, domain, text, badge) : `<span>${text}</span>`;
    }
    
    // No cleanup needed - static templates
    static clearCache(): void {
        // No-op for compatibility
    }
}

// Update the alias for backward compatibility
const ModelManagerTemplateCache = SimpleProgressTemplates;
// ADD THIS ENTIRE CLASS after SimpleProgressTemplates:
class UnifiedUpdateManager {
    private static updateQueue = new Set<string>();
    private static isProcessing = false;
    private static lastUpdate = 0;
    private static readonly UPDATE_DELAY = 100; // 100ms between updates
    
    static scheduleUpdate(updateType: string, updateFunction: () => void | Promise<void>): void {
		// ✅ ADD: Emergency protection
    this.emergencyQueueReset();
    // ✅ QUEUE SIZE LIMIT: Prevent queue from growing too large
    if (this.updateQueue.size > 50) {
        console.warn('Update queue too large, clearing old updates');
        this.updateQueue.clear();
        this.isProcessing = false;
    }
    
    // Prevent duplicate updates of same type
    if (this.updateQueue.has(updateType)) {
        return;
    }
    
    // ✅ EXECUTION-AWARE: Don't schedule during critical execution
    if (testControl?.isRunning) {
        return; // Skip UI updates completely during execution
    }
    
    this.updateQueue.add(updateType);
    
    // Process updates with delay
    setTimeout(() => this.processUpdate(updateType, updateFunction), this.UPDATE_DELAY);
}

    // ✅ ADD: Queue health monitoring and protection
static getQueueHealth(): {
    queueSize: number;
    isProcessing: boolean;
    healthy: boolean;
    lastUpdate: number;
} {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdate;
    
    return {
        queueSize: this.updateQueue.size,
        isProcessing: this.isProcessing,
        healthy: this.updateQueue.size < 30 && timeSinceLastUpdate < 10000, // Under 30 items and updated within 10s
        lastUpdate: this.lastUpdate
    };
}

// ✅ ADD: Emergency queue reset if needed
static emergencyQueueReset(): void {
    if (this.updateQueue.size > 100 || this.isProcessing && (Date.now() - this.lastUpdate) > 30000) {
        console.warn('UnifiedUpdateManager: Emergency queue reset triggered');
        this.updateQueue.clear();
        this.isProcessing = false;
        this.lastUpdate = Date.now();
    }
}
    private static async processUpdate(updateType: string, updateFunction: () => void | Promise<void>): Promise<void> {
        if (this.isProcessing) {
            // Reschedule if already processing
            setTimeout(() => this.processUpdate(updateType, updateFunction), 50);
            return;
        }
        
        this.isProcessing = true;
        
        try {
            await Promise.resolve(updateFunction());
        } catch (error) {
            console.warn(`Update failed (${updateType}):`, error);
        } finally {
            this.updateQueue.delete(updateType);
            this.isProcessing = false;
        }
    }
    
    static clearQueue(): void {
        this.updateQueue.clear();
        this.isProcessing = false;
    }
}


class UltraLightMemoryManager {
    private static cleanupInterval: NodeJS.Timeout | null = null;
    private static lastCleanup: number = 0;
    
    static start(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // ✅ FIXED: Much less frequent cleanup for better performance
        this.cleanupInterval = setInterval(() => {
            this.performMinimalCleanup();
        }, 600000); // 10 minutes instead of 5
        
        console.log('🧹 Ultra-light memory management started');
    }
    
    private static performMinimalCleanup(): void {
    const now = Date.now();
    
    // ✅ TIER-AWARE: More frequent cleanup during tier transitions
    // ✅ ENHANCED: Walkthrough-aware cleanup timing
    const isTierTransition = testControl?.currentTier && 
        testControl.currentTier !== testControl.previousTier;
    const currentTier = testControl?.currentTier;
    const isWalkthroughActive = (window as any).unifiedExecutionState?.chapter7Active || 
                               (window as any).walkthroughUI?.state?.isRunning;
    
    // ✅ CONSERVATIVE: Longer intervals during walkthrough execution
    let cleanupInterval;
    if (isWalkthroughActive) {
        // Much longer intervals during walkthrough execution
        cleanupInterval = currentTier === 'Q8' ? 2700000 :  // 45 minutes for Q8 during walkthroughs
                         1800000;                            // 30 minutes for others during walkthroughs
    } else {
        // Standard intervals when walkthroughs not active
        cleanupInterval = currentTier === 'Q8' ? 1800000 :  // 30 minutes for Q8
                         isTierTransition ? 300000 : 900000; // 5 min vs 15 min for others
    }
    
    if (now - this.lastCleanup < cleanupInterval) return;
    
    this.lastCleanup = now;
    
    try {
        // Skip cleanup during active operations
        if (testControl?.isRunning || testControl?.isPaused || testControl?.loadingModel) {
            console.log(`🧹 Skipping cleanup - system active (${currentTier || 'unknown'} tier)`);
            return;
        }
const memoryThreshold = currentTier === 'Q8' ? 2048 : 1200; // 2GB vs 1.2GB
        
        if (typeof performance !== 'undefined' && performance.memory) {
            const usedMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
            
            if (usedMB > memoryThreshold) {
                console.log(`🧹 ${currentTier} memory cleanup: ${usedMB}MB > ${memoryThreshold}MB threshold`);
                
                // ✅ ENHANCED: Q8-specific gentle cleanup
                if (currentTier === 'Q8') {
                    // Very gentle cleanup for Q8
                    BrowserModelLoader.cleanupModelCache();
                    console.log('⚡ Q8 gentle cleanup: Only cache cleared');
                } else {
                    // More aggressive cleanup for Q1/Q4
                    BrowserModelLoader.cleanupModelCache();
                    UnifiedUpdateManager.clearQueue();
                    console.log('🔄 Standard cleanup completed');
                }
            }
        }
// Additional safety: Skip if tier transition is in progress
if (isTierTransition && testControl?.currentTier !== testControl?.previousTier) {
    console.log('🧹 Skipping cleanup - tier transition in progress');
    return;
}

        
        // ✅ TIER TRANSITION: Force cleanup between tiers
        if (isTierTransition) {
            BrowserModelLoader.cleanupModelCache();
            UnifiedUpdateManager.clearQueue();
            console.log('🧹 Tier transition cleanup completed');
        }

        
        // ✅ MINIMAL: Only essential queue clearing
        UnifiedUpdateManager.clearQueue();
        
        // Check for genuinely stuck states only (45+ minutes)
        if (testBedInfo.loadedModels) {
            let stuckCount = 0;
            Object.values(testBedInfo.loadedModels).forEach(model => {
                if (model && model.status === '🔄 Loading' && model.loadStartTime) {
                    const loadTime = now - model.loadStartTime;
                    if (loadTime > 2700000) { // 45 minutes instead of 30
                        model.status = '⚠️ Timeout';
                        model.error = 'Loading timeout - system cleanup';
                        stuckCount++;
                    }
                }
            });
            
            if (stuckCount > 0) {
                console.log(`🧹 Cleaned up ${stuckCount} genuinely stuck loading states`);
            }
        }
        
    } catch (error) {
        // Silent cleanup failure
    }
}


    
    static stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Update the alias for backward compatibility
const OptimizedMemoryManager = UltraLightMemoryManager;
// Global cleanup coordinator
class ModelManagerCleanupCoordinator {
    private static isCleaningUp = false;
    private static cleanupQueue: Array<() => void> = [];
    private static lastCleanup = 0;
    
    static async performCoordinatedCleanup(): Promise<void> {
        if (this.isCleaningUp) {
            return; // Skip if already cleaning
        }
        
        const now = Date.now();
        if (now - this.lastCleanup < 300000) { // 5 minutes minimum
            return;
        }
        
        this.isCleaningUp = true;
        
        try {
            // COORDINATE with all systems
            if ((window as any).testRunnerCleanup || 
                (window as any).modelManagerCleanup ||
                (window as any).trialExecutorCleanup) {
                console.log('🔄 Other systems cleaning up - deferring model manager cleanup');
                return;
            }
            
            (window as any).modelManagerCleanup = true;
            
            // ATOMIC cleanup sequence
            await this.cleanupModelCache();
            await this.cleanupStaleEngines();
            UnifiedUpdateManager.clearQueue();
            
            this.lastCleanup = now;
            console.log('🧹 Coordinated model manager cleanup completed');
            
        } catch (error) {
            console.warn('Coordinated cleanup failed:', error);
        } finally {
            this.isCleaningUp = false;
            delete (window as any).modelManagerCleanup;
        }
    }
    
    private static async cleanupModelCache(): Promise<void> {
        BrowserModelLoader.cleanupModelCache();
    }
    
    private static async cleanupStaleEngines(): Promise<void> {
        // Check for engines that have been loading too long
        if (testBedInfo.loadedModels) {
            const now = Date.now();
            Object.entries(testBedInfo.loadedModels).forEach(([key, model]) => {
                if (model && model.status === '🔄 Loading' && model.loadStartTime) {
                    const loadTime = now - model.loadStartTime;
                    if (loadTime > 1800000) { // 30 minutes
                        model.status = '⚠️ Stale';
                        model.error = 'Loading exceeded maximum time - cleared by cleanup';
                    }
                }
            });
        }
    }
}


export class BrowserModelLoader {
    // ============================================
    // 🔄 EXISTING T1-T10 MODEL PREFERENCES (PRESERVED)
    // ============================================
   private static engineProtection = new Set<string>();
    private static protectionTimeouts = new Map<string, NodeJS.Timeout>();
        // ✅ NEW: Q8-aware memory management constants
    private static readonly MEMORY_THRESHOLDS = {
        Q1: 512,   // 512MB
        Q4: 1024,  // 1GB
        Q8: 2048   // 2GB (matches Node.js 6GB allocation)
    };
    
    private static readonly CLEANUP_INTERVALS = {
        Q1: 900000,  // 15 minutes
        Q4: 1200000, // 20 minutes  
        Q8: 1800000  // 30 minutes (less frequent for Q8)
    };
    // ✅ NEW: Engine protection methods
    static protectEngine(tier: string, domain?: string): void {
        const key = domain ? `${tier}-${domain}` : tier;
        
        // Add protection
        this.engineProtection.add(key);
        console.log(`🛡️ Engine ${key} is now protected from disposal`);
        
        // Clear any existing timeout
        const existingTimeout = this.protectionTimeouts.get(key);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        // Auto-unprotect after 30 seconds (safety mechanism)
        const timeout = setTimeout(() => {
            this.engineProtection.delete(key);
            this.protectionTimeouts.delete(key);
            console.log(`🔓 Engine ${key} protection expired (auto-cleanup)`);
        }, 30000);
        
        this.protectionTimeouts.set(key, timeout);
    }
    
    static unprotectEngine(tier: string, domain?: string): void {
        const key = domain ? `${tier}-${domain}` : tier;
        
        // Remove protection
        this.engineProtection.delete(key);
        console.log(`🔓 Engine ${key} protection removed`);
        
        // Clear timeout
        const timeout = this.protectionTimeouts.get(key);
        if (timeout) {
            clearTimeout(timeout);
            this.protectionTimeouts.delete(key);
        }
    }
    
    static isEngineProtected(tier: string, domain?: string): boolean {
        const key = domain ? `${tier}-${domain}` : tier;
        return this.engineProtection.has(key);
    }
    private static modelLoadingCache = new Map<string, {
        promise: Promise<any>;
        timestamp: number;
        tier: string;
        context?: ModelLoadingContext;
    }>();
    
    private static readonly CACHE_TTL = 300000; // 5 minutes for T1-T10
private static readonly WALKTHROUGH_CACHE_TTL = 600000; // 10 minutes for Chapter 7

// ✅ NEW: Get cache TTL based on context
private static getCacheTTL(context?: ModelLoadingContext): number {
    return context?.framework === 'Chapter7' ? 
        this.WALKTHROUGH_CACHE_TTL : 
        this.CACHE_TTL;
}

	
	// ✅ NEW: Clean stale cache entries to prevent memory accumulation
static cleanupModelCache(): void {
    try {
        const now = Date.now();
        const staleEntries: string[] = [];
        
        // Remove entries older than 5 minutes  
       // ✅ WALKTHROUGH-AWARE: Different TTL for different contexts
this.modelLoadingCache.forEach((entry, key) => {
    const isWalkthroughEntry = entry.context?.framework === 'Chapter7' || key.includes('Chapter7');
    const ttl = isWalkthroughEntry ? 600000 : 300000; // 10 min vs 5 min
    
    // ✅ PROTECTION: Don't cleanup active walkthrough entries
    const isWalkthroughActive = (window as any).walkthroughUI?.state?.isRunning;
    if (isWalkthroughEntry && isWalkthroughActive) {
        return; // Skip cleanup for active walkthrough entries
    }
    
    if (now - entry.timestamp > ttl) {
        staleEntries.push(key);
    }
});

        
        staleEntries.forEach(key => this.modelLoadingCache.delete(key));
        
        if (staleEntries.length > 0) {
            console.log(`🧹 Cleaned ${staleEntries.length} stale cache entries`);
        }
    } catch (error) {
        // Silent cleanup failure
    }
}
// ✅ NEW: Dispose previous tier's engine to prevent memory buildup
static async disposeModelEngine(tier: string, context?: ModelLoadingContext): Promise<void> {
    try {
        const modelKey = context?.framework === 'Chapter7' && context.domain ? 
            `${tier}-${context.domain}` : tier;
        
        // ENHANCED: Check ALL active states
        if (BrowserModelLoader.isEngineProtected(tier, context?.domain)) {
            console.log(`🛡️ Engine ${modelKey} is protected from disposal - skipping`);
            return;
        }
        
        // CRITICAL: Check for ANY engine activity
        if (testControl?.isRunning || 
            testControl?.isPaused || 
            testControl?.loadingModel ||
            this.engineRecreationLock) {
            console.log(`🛡️ Engine ${modelKey} disposal skipped - system active`);
            return;
        }
        
        // ATOMIC: Lock during disposal
        if (!this.disposalLocks) this.disposalLocks = new Set();
        if (this.disposalLocks.has(modelKey)) {
            console.log(`🛡️ Engine ${modelKey} disposal already in progress`);
            return;
        }
        this.disposalLocks.add(modelKey);
        
        try {
            // Get actual engine reference
            const engineRef = (window as any).currentMLCEngine;
            if (engineRef && typeof engineRef.dispose === 'function') {
                console.log(`🗑️ Disposing engine for ${modelKey}`);
                await engineRef.dispose();
                
                // Wait for disposal to complete
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Clear model entry
            if (testBedInfo.loadedModels?.[modelKey]) {
                testBedInfo.loadedModels[modelKey].status = '🗑️ Disposed';
                delete testBedInfo.loadedModels[modelKey];
            }
            
            // Clean cache
            BrowserModelLoader.cleanupModelCache();
            
        } finally {
            this.disposalLocks.delete(modelKey);
        }
        
    } catch (error) {
        console.warn('Error disposing model engine:', error);
    }
}

// ADD: Disposal coordination
private static disposalLocks = new Set<string>();



	
    // ENHANCED: Comprehensive model preferences with better categorization
    static getModelPreferences(tier: string): string[] {
        const preferences = {
            Q1: [
                "Qwen2-0.5B-Instruct-q4f16_1-MLC",
                "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
                "Phi-1_5-1_3B-q4f16_1-MLC",
                "gemma-2-2b-it-q4f16_1-MLC"
            ],
            Q4: [
                "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
                "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k", 
                "Phi-3-mini-4k-instruct-q4f16_1-MLC",
                "gemma-2-2b-it-q4f16_1-MLC"
            ],
            Q8: [
                "Llama-3.2-1B-Instruct-q4f32_1-MLC",
                "gemma-2-2b-it-q4f16_1-MLC",
                "Phi-3-mini-4k-instruct-q4f16_1-MLC"
            ]
        };
        
        return preferences[tier as keyof typeof preferences] || [];
    }

    // ============================================
    // 🆕 NEW: CHAPTER 7 DOMAIN MODEL PREFERENCES
    // ============================================

    // Get domain-specific model preferences for Chapter 7 walkthroughs
    static getDomainModelPreferences(domain: string, tier: string): string[] {
        // Domain-specific optimizations for different use cases
        const domainPreferences: DomainModelPreferences = {
            'appointment-booking': [
                // Slot-filling optimized models
                "gemma-2-2b-it-q4f16_1-MLC",      // Good for structured conversations
                "Phi-3-mini-4k-instruct-q4f16_1-MLC", // Instruction following
                "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC" // Lightweight fallback
            ],
            'spatial-navigation': [
                // Reasoning and constraint-handling optimized
                "Llama-3.2-1B-Instruct-q4f32_1-MLC", // Good reasoning capabilities
                "Phi-3-mini-4k-instruct-q4f16_1-MLC", // Instruction precision
                "gemma-2-2b-it-q4f16_1-MLC"      // Balanced performance
            ],
            'failure-diagnostics': [
                // Problem-solving and analysis optimized
                "Phi-3-mini-4k-instruct-q4f16_1-MLC", // Analytical capabilities
                "gemma-2-2b-it-q4f16_1-MLC",      // Good reasoning
                "Qwen2-0.5B-Instruct-q4f16_1-MLC" // Lightweight option
            ]
        };

        // Get domain-specific preferences, then filter by tier availability
        const domainSpecific = domainPreferences[domain as keyof DomainModelPreferences] || [];
        const tierPreferences = BrowserModelLoader.getModelPreferences(tier);
        
        // Combine domain preferences with tier preferences, prioritizing domain-specific
        const combinedPreferences = [
            ...domainSpecific.filter(model => 
                BrowserModelLoader.isModelSuitableForTier(model, tier)
            ),
            ...tierPreferences
        ];

        // Remove duplicates while preserving order
        return [...new Set(combinedPreferences)];
    }

    // Check if a model is suitable for a specific tier
    private static isModelSuitableForTier(modelName: string, tier: string): boolean {
        const modelSize = BrowserModelLoader.extractModelSize(modelName);
        
        switch (tier) {
            case 'Q1':
                return modelSize <= 1.1; // Up to 1.1B parameters
            case 'Q4':
                return modelSize <= 2.0; // Up to 2B parameters  
            case 'Q8':
                return modelSize <= 7.0; // Up to 7B parameters
            default:
                return true;
        }
    }

    // ============================================
    // 🔄 EXISTING FUNCTIONS (ENHANCED FOR CHAPTER 7)
    // ============================================
    
    // ENHANCED: Comprehensive model selection with detailed logging + Chapter 7 support
    static getAvailableModel(preferredModels: string[], tier: string, context?: ModelLoadingContext): string {
        // Safety check for availableModels
        const availableModels = testBedInfo?.availableModels || [];
        
        if (availableModels.length === 0) {
            throw new Error(`❌ No models available in system`);
        }
        
        // ✅ NEW: Framework-specific logging
        const frameworkLabel = context?.framework || 'T1-T10';
        const domainLabel = context?.domain ? ` (${context.domain})` : '';
        
        BrowserLogger.log(`[${tier}${domainLabel}] 🔍 Looking for models: ${preferredModels.slice(0, 2).join(', ')}...`, 
                          context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10');
        
        // Try to find preferred models
        for (const preferred of preferredModels) {
            if (availableModels.includes(preferred)) {
                BrowserLogger.log(`[${tier}${domainLabel}] ✅ Found optimal model: ${preferred}`, 
                                context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10');
                
                // ENHANCED: Safe property initialization with comprehensive tracking
                if (!testBedInfo.selectedModels) {
                    testBedInfo.selectedModels = {};
                }
                testBedInfo.selectedModels[tier] = preferred;
                
                // ✅ NEW: Track Chapter 7 domain-specific selection
                if (context?.framework === 'Chapter7' && context.domain) {
                    if (!testBedInfo.selectedModels.chapter7) {
                        testBedInfo.selectedModels.chapter7 = {};
                    }
                    testBedInfo.selectedModels.chapter7[context.domain] = {
                        tier,
                        model: preferred,
                        timestamp: Date.now()
                    };
                }
                
               
                // ✅ EXECUTION-AWARE: Only update when safe
if (!testControl?.isRunning) {
    setTimeout(() => BrowserModelLoader.updateLiveComponentsOnModelSelection(tier, preferred, context), 50);
}

                
                return preferred;
            }
        }
        
        // ENHANCED: Comprehensive fallback logic for Q1 tier + domain awareness
        if (tier === "Q1") {
            const smallModels = availableModels.filter(m => 
                m.toLowerCase().includes('tiny') || 
                m.toLowerCase().includes('0.5b') ||
                m.toLowerCase().includes('1b') ||
                m.toLowerCase().includes('phi-1') ||
                m.toLowerCase().includes('qwen2-0.5b')
            ).sort((a, b) => {
                // Enhanced size-based sorting with domain preference
                const aSize = BrowserModelLoader.extractModelSize(a);
                const bSize = BrowserModelLoader.extractModelSize(b);
                
                // ✅ NEW: Prefer domain-optimized models if available
                if (context?.domain) {
                    const aDomainScore = BrowserModelLoader.getDomainOptimizationScore(a, context.domain);
                    const bDomainScore = BrowserModelLoader.getDomainOptimizationScore(b, context.domain);
                    if (aDomainScore !== bDomainScore) {
                        return bDomainScore - aDomainScore; // Higher score first
                    }
                }
                
                return aSize - bSize;
            });
            
            if (smallModels.length > 0) {
                const selected = smallModels[0];
                BrowserLogger.log(`[${tier}${domainLabel}] 🔄 Using smallest available: ${selected}`, 
                                context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10');
                BrowserLogger.log(`[${tier}${domainLabel}] 📊 Estimated size: ${BrowserModelLoader.estimateModelSize(selected)}`, 
                                context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10');
                
                if (!testBedInfo.selectedModels) {
                    testBedInfo.selectedModels = {};
                }
                testBedInfo.selectedModels[tier] = selected;
                
                // ✅ NEW: Track Chapter 7 selection
                if (context?.framework === 'Chapter7' && context.domain) {
                    if (!testBedInfo.selectedModels.chapter7) {
                        testBedInfo.selectedModels.chapter7 = {};
                    }
                    testBedInfo.selectedModels.chapter7[context.domain] = {
                        tier,
                        model: selected,
                        timestamp: Date.now(),
                        fallback: true
                    };
                }
                
                // ADDED: Update live components
                BrowserModelLoader.updateLiveComponentsOnModelSelection(tier, selected, context);
                
                return selected;
            }
        }
        
        // ENHANCED: General fallback models with better filtering + domain optimization
        const fallbackModels = availableModels.filter(m => {
            const name = m.toLowerCase();
            return name.includes('tiny') || 
                   name.includes('phi') ||
                   name.includes('gemma-2b') ||
                   name.includes('qwen2') ||
                   (name.includes('1b') && !name.includes('11b'));
        }).sort((a, b) => {
            const aSize = BrowserModelLoader.extractModelSize(a);
            const bSize = BrowserModelLoader.extractModelSize(b);
            
            // ✅ NEW: Domain optimization for Chapter 7
            if (context?.domain) {
                const aDomainScore = BrowserModelLoader.getDomainOptimizationScore(a, context.domain);
                const bDomainScore = BrowserModelLoader.getDomainOptimizationScore(b, context.domain);
                if (aDomainScore !== bDomainScore) {
                    return bDomainScore - aDomainScore;
                }
            }
            
            return aSize - bSize;
        });
        
        if (fallbackModels.length > 0) {
            const selected = fallbackModels[0];
            BrowserLogger.log(`[${tier}${domainLabel}] ⚠️ Using fallback: ${selected}`, 
                            context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10');
            BrowserLogger.log(`[${tier}${domainLabel}] 📊 Estimated size: ${BrowserModelLoader.estimateModelSize(selected)}`, 
                            context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10');
            
            if (!testBedInfo.selectedModels) {
                testBedInfo.selectedModels = {};
            }
            testBedInfo.selectedModels[tier] = selected;
            
            // ✅ NEW: Track Chapter 7 fallback selection
            if (context?.framework === 'Chapter7' && context.domain) {
                if (!testBedInfo.selectedModels.chapter7) {
                    testBedInfo.selectedModels.chapter7 = {};
                }
                testBedInfo.selectedModels.chapter7[context.domain] = {
                    tier,
                    model: selected,
                    timestamp: Date.now(),
                    fallback: true,
                    generalFallback: true
                };
            }
            
            // ADDED: Update live components
            BrowserModelLoader.updateLiveComponentsOnModelSelection(tier, selected, context);
            
            return selected;
        }
        
        throw new Error(`❌ No suitable models found for ${tier} tier${domainLabel}`);
    }
    // ADD THIS METHOD before the loadModel method:
// REPLACE with execution-aware timeout system:
private static async createEngineWithTimeout(model: string, options: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
        let engineCreated = false;
        let timeoutHandle: NodeJS.Timeout | null = null;
        
        // ✅ ENHANCED: Q8-specific timeout (longer for complex models)
        const getModelLoadingTimeout = (): number => {
            const currentTier = testControl?.currentTier;
            
            // Longer timeout during trial execution to prevent conflicts
            if (testControl?.isRunning) {
                return currentTier === 'Q8' ? 450000 : 300000; // 7.5 min vs 5 min
            }
            
            // ✅ NEW: Q8-specific idle timeout (longer)
            return currentTier === 'Q8' ? 240000 : 120000; // 4 min vs 2 min when idle
        };
        
        const TIMEOUT_MS = getModelLoadingTimeout();
        
        const cleanup = () => {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
                timeoutHandle = null;
            }
        };
        
        timeoutHandle = setTimeout(() => {
            if (!engineCreated) {
                cleanup();
                const timeoutMins = Math.round(TIMEOUT_MS / 60000);
                const error = new Error(`Model loading timeout after ${timeoutMins} minutes for ${model}`);
                error.name = 'ModelLoadTimeout';
                reject(error);
            }
        }, TIMEOUT_MS);
        
        try {
            BrowserLogger.log(`🔧 Creating MLCEngine for ${model}`, 'ModelManager');
            
            const engine = await webllm.CreateMLCEngine(model, {
                ...options,
                initProgressCallback: (progress) => {
                    // ✅ NON-BLOCKING: Essential checks only
                    if (testControl?.stopRequested || (window as any).immediateStop) {
                        cleanup();
                        reject(new Error('Model loading cancelled by user'));
                        return;
                    }
                    
                    // ✅ DEFERRED: Call original callback without blocking
                    if (options.initProgressCallback) {
                        setTimeout(() => {
                            try {
                                options.initProgressCallback(progress);
                            } catch (error) {
                                console.warn('Progress callback error:', error);
                            }
                        }, 0);
                    }
                }
            });
            
            engineCreated = true;
            cleanup();
            
            if (!engine) {
                reject(new Error(`Engine creation returned null for ${model}`));
                return;
            }
            
            BrowserLogger.log(`✅ MLCEngine created successfully for ${model}`, 'ModelManager');
            resolve(engine);
            
        } catch (error) {
    engineCreated = true;
    cleanup();
    
    // ✅ FIXED: Enhanced error recovery with retry suggestions
    const classifiedError = BrowserModelLoader.classifyLoadingError(error, model);
    
    // Add recovery context to the error
    (classifiedError as any).recoveryContext = {
        model, // tier variable not available here, use model instead
        attemptTime: Date.now(),
        systemMemory: typeof performance !== 'undefined' && performance.memory ? 
            Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) : 'unknown',
        webgpuAvailable: !!navigator.gpu
    };
    
    reject(classifiedError);
}


    });
}

// ✅ NEW: Engine health validation to prevent using disposed engines
static async validateEngineHealthComprehensive(engine: any): Promise<boolean> {
    try {
        // FUNCTIONAL TEST WITH TIMEOUT
        const testResult = await Promise.race([
            engine.chat.completions.create({
                messages: [{ role: "user", content: "health_check" }],
                max_tokens: 1,
                temperature: 0
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), 3000)
            )
        ]);
        
        return !!(testResult?.choices?.[0]?.message?.content);
        
    } catch (error) {
        if (error.message.includes('disposed') || error.message.includes('NDArray')) {
            console.log(`🚨 Engine NDArray disposal detected: ${error.message}`);
        }
        return false;
    }
}

// Update the sync version to use async
static validateEngineHealth(engine: any): boolean {
    // Quick sync version for compatibility
    try {
        if (!engine || typeof engine !== 'object') return false;
        if (!engine.chat?.completions?.create) return false;
        if (engine._disposed || engine._destroyed) return false;
        if (engine.toString?.().includes('disposed')) return false;
        return true;
    } catch (error) {
        return false;
    }
}


    // ✅ ADD: Atomic cache operations to prevent race conditions
private static cacheOperationLocks = new Set<string>();

// ✅ ENHANCED: Atomic cache access
private static async acquireCacheLock(cacheKey: string): Promise<void> {
    if (this.cacheOperationLocks.has(cacheKey)) {
        // Wait for existing operation to complete
        let waitTime = 0;
        const maxWait = 10000; // 10 second timeout
        
        while (this.cacheOperationLocks.has(cacheKey) && waitTime < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitTime += 100;
        }
        
        if (waitTime >= maxWait) {
            console.warn(`Cache lock timeout for ${cacheKey}`);
        }
    }
    
    this.cacheOperationLocks.add(cacheKey);
}

private static releaseCacheLock(cacheKey: string): void {
    this.cacheOperationLocks.delete(cacheKey);
}

  // ENHANCED: Comprehensive model loading with live integration + Chapter 7 support
static async loadModel(tier: string, context?: ModelLoadingContext): Promise<any> {
    const startTime = performance.now();

    /* ───────────── preliminary checks ───────────── */
    if (testControl?.stopRequested) throw new Error('Test execution stopped by user');
    if (!tier || typeof tier !== 'string') throw new Error(`❌ Invalid tier: ${tier}`);
// ✅ NEW: Cleanup before loading new tier if tier changed
// ✅ FIXED: Safe disposal check - only when NOT running trials
if (testControl?.previousTier && testControl.previousTier !== tier) {
    console.log(`🔄 Tier transition detected: ${testControl.previousTier} → ${tier}`);
    
    // CRITICAL: Only dispose if NO trials are running or paused
    if (!testControl?.isRunning && !testControl?.isPaused && !testControl?.loadingModel) {
        console.log(`🗑️ Safe to dispose ${testControl.previousTier} - no active operations`);
        await BrowserModelLoader.disposeModelEngine(testControl.previousTier);
        BrowserModelLoader.cleanupModelCache();
        
        // Brief pause for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 100));
    } else {
        console.log(`🛡️ Skipping disposal of ${testControl.previousTier} - trials are active`);
    }
}


    // ✅ FIXED: Define variables BEFORE using them
    const frameworkLabel = context?.framework || 'T1-T10';
    const domainLabel = context?.domain ? ` for ${context.domain}` : '';
    const logFramework = context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10';

    // ✅ FIXED: Check cache first to prevent duplicate loading
    const cacheKey = context?.framework === 'Chapter7' && context.domain ? 
        `${tier}-${context.domain}-${context.framework}` : 
        `${tier}-${context?.framework || 'T1-T10'}`;

// In loadModel method, enhance cache validation
// ENHANCED: Atomic cache validation with locks
// ENHANCED: Atomic cache validation with locks
await BrowserModelLoader.acquireCacheLock(cacheKey);

try {
    const cachedEntry = BrowserModelLoader.modelLoadingCache.get(cacheKey);
    const cacheTTL = BrowserModelLoader.getCacheTTL(context);
if (cachedEntry && (Date.now() - cachedEntry.timestamp) < cacheTTL) {

        
        // COMPREHENSIVE VALIDATION WITH TIMEOUT
        const engine = await Promise.race([
            cachedEntry.promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Cache validation timeout')), 5000)
            )
        ]);
        
        // MULTI-LEVEL HEALTH CHECK
                // ✅ WALKTHROUGH-AWARE: Less aggressive health checks for Chapter 7
        const isWalkthroughContext = context?.framework === 'Chapter7';

        const healthChecks = [
            BrowserModelLoader.validateEngineHealth(engine),
            !BrowserModelLoader.engineRecreationLock,
            !(window as any).engineRecreationInProgress,
            BrowserModelLoader.getEngineState(tier) === 'ready'
        ];

        // ✅ RELAXED: More lenient for walkthrough engines
        const requiredHealthyChecks = isWalkthroughContext ? 3 : 4; // Allow 1 failed check for walkthroughs
        const healthyCount = healthChecks.filter(check => check === true).length;

        if (healthyCount >= requiredHealthyChecks) {
            // ✅ CONDITIONAL FUNCTIONAL TEST: Skip for recent walkthrough engines
            const skipFunctionalTest = isWalkthroughContext && 
                (Date.now() - cachedEntry.timestamp) < 120000; // Skip if loaded within 2 minutes
            
            if (skipFunctionalTest) {
                console.log(`✅ Cached walkthrough engine for ${tier} - skipping functional test (recent)`);
                BrowserModelLoader.releaseCacheLock(cacheKey);
                return engine;
            }
            
            // FUNCTIONAL TEST with longer timeout for walkthroughs
            try {
                const testTimeout = isWalkthroughContext ? 5000 : 3000; // 5s vs 3s timeout
                
                await Promise.race([
                    engine.chat.completions.create({
                        messages: [{ role: "user", content: isWalkthroughContext ? "walkthrough_test" : "cache_test" }],
                        max_tokens: 1
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Cache test timeout')), testTimeout)
                    )
                ]);
                
                console.log(`✅ Cached engine for ${tier} passed ${isWalkthroughContext ? 'walkthrough' : 'comprehensive'} validation`);
                BrowserModelLoader.releaseCacheLock(cacheKey);
                return engine;
                
            } catch (testError) {
                // ✅ LENIENT: Don't invalidate walkthrough cache on single test failure
                if (isWalkthroughContext && !testError.message.includes('disposed')) {
                    console.log(`⚠️ Walkthrough engine test failed but keeping cache: ${testError.message}`);
                    BrowserModelLoader.releaseCacheLock(cacheKey);
                    return engine;
                }
                
                console.log(`⚠️ Cached engine for ${tier} failed functional test: ${testError.message}`);
                BrowserModelLoader.modelLoadingCache.delete(cacheKey);
            }
        } else {
            console.log(`⚠️ Cached engine for ${tier} failed health checks (${healthyCount}/${healthChecks.length})`);
            BrowserModelLoader.modelLoadingCache.delete(cacheKey);
        }

    }
} finally {
    BrowserModelLoader.releaseCacheLock(cacheKey);
}





    BrowserLogger.log(`🔧 Loading ${tier} model${domainLabel}...`, logFramework);
    BrowserModelLoader.updateLiveComponentsOnLoadStart(tier, context);
    if (testControl) testControl.currentTier = tier;

    /* ───────────── framework flags ──────────────── */
    if (context?.framework === 'Chapter7') {
        updateUnifiedExecutionState({ chapter7Active: true, currentFramework: 'Chapter7' });
    } else if (context?.framework === 'Unified') {
        updateUnifiedExecutionState({ t1t10Active: true, chapter7Active: true, currentFramework: 'Unified' });
    }

    /* ───────────── main work inside try ─────────── */
    try {
        // ✅ FIXED: Create and cache the loading promise
        const loadingPromise = BrowserModelLoader.performModelLoad(tier, context, startTime);
        BrowserModelLoader.modelLoadingCache.set(cacheKey, {
            promise: loadingPromise,
            timestamp: Date.now(),
            tier,
            context
        });
        
        return await loadingPromise;

    } catch (error) {
        const loadDuration = performance.now() - startTime;
        const modelKey = context?.framework === 'Chapter7' && context.domain ? `${tier}-${context.domain}` : tier;

        if (testBedInfo?.loadedModels?.[modelKey]) {
            testBedInfo.loadedModels[modelKey].status = '❌ Failed';
            testBedInfo.loadedModels[modelKey].loadDuration = Math.round(loadDuration);
            testBedInfo.loadedModels[modelKey].error = error?.message || 'Unknown error';
        }

        const msg = error?.message || 'Unknown error occurred';
        BrowserLogger.log(`❌ Failed to load ${tier} model${domainLabel}: ${msg}`, logFramework);
        BrowserLogger.log(`⏱️ Failed after: ${Math.round(loadDuration)}ms`, logFramework);

        BrowserLogger.updateTestBedInfo();
        BrowserModelLoader.updateLiveComponentsOnLoadError(tier, msg, context);

        throw new Error(`Model loading failed for ${tier}${domainLabel}: ${msg}`);
    }
}


// ✅ ADD: Complete extracted loading logic for caching
private static async performModelLoad(tier: string, context: ModelLoadingContext | undefined, startTime: number): Promise<any> {
    const frameworkLabel = context?.framework || 'T1-T10';
    const domainLabel = context?.domain ? ` for ${context.domain}` : '';
    const logFramework = context?.framework === 'Chapter7' ? 'Chapter7' : 'T1-T10';
    
    /* 1. Pick preferred model */
    const preferredModels = context?.framework === 'Chapter7' && context.domain
        ? BrowserModelLoader.getDomainModelPreferences(context.domain, tier)
        : BrowserModelLoader.getModelPreferences(tier);

    const selectedModel = BrowserModelLoader.getAvailableModel(preferredModels, tier, context);

    /* 2. Create / update tracking entry */
    if (!testBedInfo.loadedModels) testBedInfo.loadedModels = {};
    const modelKey = context?.framework === 'Chapter7' && context.domain ? `${tier}-${context.domain}` : tier;

    testBedInfo.loadedModels[modelKey] = {
        name: selectedModel,
        size: 'Loading...',
        type: `${tier} Tier Model${domainLabel}`,
        status: '🔄 Loading',
        loadStartTime: Date.now(),
        loadDuration: 0,
        estimatedSize: BrowserModelLoader.estimateModelSize(selectedModel),
        framework: frameworkLabel,
        domain: context?.domain,
        purpose: context?.purpose || 'Testing'
    };

    BrowserLogger.updateTestBedInfo();
    BrowserModelLoader.updateLiveComponentsOnLoadProgress(tier, 'Initializing...', context);

    let maxSizeEncountered = 0;
    let finalModelSize = 'Unknown';
    let progressUpdateCount = 0;

    /* 3. Create engine with timeout and progress tracking */
    const engine = await BrowserModelLoader.createEngineWithTimeout(selectedModel, {
		
        initProgressCallback: (progress) => {
            // ✅ CRITICAL: Only essential operations during model loading
            if (testControl?.stopRequested) throw new Error('Model loading cancelled by user');
            
            const text = progress?.text || 'Loading...';
            progressUpdateCount++;
            
            // ✅ THROTTLED: Reduce logging frequency during execution
            const isExecuting = testControl?.isRunning;
            const shouldLog = !isExecuting && (progressUpdateCount % 10 === 0 || text.includes('completed'));
            
            if (shouldLog) {
                BrowserLogger.log(`📥 Loading ${tier}${domainLabel}: ${text}`, logFramework);
            }

            // ✅ DEFERRED: Non-blocking UI updates
            setTimeout(() => {
                try {
                    BrowserModelLoader.updateLiveComponentsOnLoadProgress(tier, text, context);
                    
                    // Size tracking (lightweight)
                    if (text.includes('MB')) {
                        const m = text.match(/(\d+)MB/);
                        if (m) {
                            const cur = parseInt(m[1], 10);
                            if (cur > maxSizeEncountered) {
                                maxSizeEncountered = cur;
                                finalModelSize = `${cur}MB`;
                                if (testBedInfo.loadedModels?.[modelKey]) {
                                    testBedInfo.loadedModels[modelKey].size = finalModelSize;
                                }
                            }
                        }
                    }
                    
                    // Progress percentage (lightweight)
                    if (text.includes('%')) {
                        const m = text.match(/(\d+)%/);
                        if (m && testBedInfo.loadedModels?.[modelKey]) {
                            testBedInfo.loadedModels[modelKey].loadProgress = parseInt(m[1], 10);
                        }
                    }
                } catch (error) {
                    // Silent failure - don't block model loading
                }
            }, 100);
        }
    });
BrowserModelLoader.setCurrentEngine(engine, tier);
    /* 4. Configure engine */
    (engine as any)._mcdConfig = BrowserModelLoader.getModelPreferences(tier);
    (engine as any)._mcdTier = tier;
    (engine as any)._walkthroughCompatible = context?.framework === 'Chapter7';
    (engine as any)._walkthroughConfig = context?.framework === 'Chapter7' && context.domain ?
        BrowserModelLoader.getTierConfigForWalkthrough(tier, context.domain) : null;

    /* 5. Success bookkeeping */
    const loadDuration = performance.now() - startTime;
    if (testBedInfo.loadedModels?.[modelKey]) {
        const entry = testBedInfo.loadedModels[modelKey];

        if (entry.size === 'Loading...' || entry.size === '0MB' || entry.size === 'Unknown') {
            entry.size = maxSizeEncountered > 0 ? `${maxSizeEncountered}MB` : entry.estimatedSize;
        }

        entry.status = '✅ Loaded';
        entry.loadDuration = Math.round(loadDuration);

        if (context?.framework === 'Chapter7' && context.domain) {
            entry.chapter7Metrics = {
                domainOptimization: BrowserModelLoader.getDomainOptimizationScore(selectedModel, context.domain),
                expectedMCDCompliance: BrowserModelLoader.estimateMCDCompliance(selectedModel, context.domain),
                resourceEfficiency: BrowserModelLoader.calculateResourceEfficiency(selectedModel, finalModelSize)
            };
        }
    }

    BrowserModelLoader.updatePerformanceMetrics(tier, loadDuration,
        testBedInfo.loadedModels?.[modelKey].size, context);

    BrowserLogger.log(`✅ ${tier} model loaded successfully${domainLabel}!`, logFramework);
    BrowserLogger.log(`📊 Model: ${selectedModel}`, logFramework);
    BrowserLogger.log(`💾 Final Size: ${testBedInfo.loadedModels?.[modelKey].size}`, logFramework);
    BrowserLogger.log(`⏱️ Load Time: ${Math.round(loadDuration)}ms`, logFramework);

    if (context?.framework === 'Chapter7' && context.domain) {
        BrowserLogger.log(`🎯 Domain Optimization: ${
            BrowserModelLoader.getDomainOptimizationScore(selectedModel, context.domain)
        }%`, 'Chapter7');
    }

    BrowserLogger.updateTestBedInfo();
BrowserModelLoader.updateLiveComponentsOnLoadComplete(tier, selectedModel, context);

// ✅ NEW: Update tier tracking for cleanup
if (testControl) {
    testControl.previousTier = testControl.currentTier;
    testControl.currentTier = tier;
}

return engine;

}

// ✅ ENHANCED: Concurrent model loading for multiple tiers/domains
static async loadModelsForWalkthroughBatch(
    requests: Array<{
        tier: string;
        domain?: string;
        context?: ModelLoadingContext;
        priority?: 'high' | 'medium' | 'low';
    }>,
    maxConcurrency: number = 1 
): Promise<Map<string, WalkthroughCompatibleEngine>> {
    const results = new Map<string, WalkthroughCompatibleEngine>();
    const errors = new Map<string, Error>();
    
    BrowserLogger.log(`🚀 Starting batch model loading: ${requests.length} requests with concurrency ${maxConcurrency}`, 'ModelManager');
    // ✅ ADD: Memory pressure check before batch processing  
// ✅ ENHANCED: Q8-aware memory pressure check
if (performance.memory) {
    const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
    const currentTier = testControl?.currentTier;
    
    // ✅ NEW: Higher thresholds for Q8
    const memoryThreshold = currentTier === 'Q8' ? 1500 : 800; // 1.5GB vs 800MB
    
    if (usedMB > memoryThreshold) {
        BrowserLogger.log(`⚠️ High memory usage (${usedMB.toFixed(1)}MB) - using sequential loading for ${currentTier}`, 'ModelManager');
        maxConcurrency = 1;
        
        // Force garbage collection if available
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        // ✅ NEW: Longer wait for Q8 memory settling
        const waitTime = currentTier === 'Q8' ? 2000 : 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
}

    // Sort by priority
    const sortedRequests = requests.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
    });
    
    // Process in batches
    for (let i = 0; i < sortedRequests.length; i += maxConcurrency) {
        const batch = sortedRequests.slice(i, i + maxConcurrency);
        
        // Check for stop conditions
        if (testControl?.stopRequested || (window as any).immediateStop) {
            BrowserLogger.log('🛑 Batch model loading stopped by user', 'ModelManager');
            break;
        }
        
        BrowserLogger.log(`📦 Processing batch ${Math.floor(i/maxConcurrency) + 1}/${Math.ceil(sortedRequests.length/maxConcurrency)}`, 'ModelManager');
        
        const batchPromises = batch.map(async (request) => {
            const requestKey = `${request.tier}${request.domain ? `-${request.domain}` : ''}`;
            
            try {
                // Enhanced context for batch loading
                const enhancedContext: ModelLoadingContext = {
                    framework: request.domain ? 'Chapter7' : 'T1-T10',
                    tier: request.tier,
                    domain: request.domain,
                    purpose: request.domain ? `${request.domain} domain walkthrough` : 'T1-T10 testing',
                    priority: request.priority || 'medium'
                };
                
                const engine = await BrowserModelLoader.loadModel(request.tier, enhancedContext);
                const enhancedEngine = BrowserModelLoader.enhanceEngineForWalkthroughs(engine, enhancedContext);
                
                results.set(requestKey, enhancedEngine);
                BrowserLogger.log(`✅ Batch loaded: ${requestKey}`, 'ModelManager');
                
                return { key: requestKey, engine: enhancedEngine };
                
            } catch (error) {
                errors.set(requestKey, error as Error);
                BrowserLogger.log(`❌ Batch failed: ${requestKey} - ${error?.message}`, 'ModelManager');
                return { key: requestKey, error: error as Error };
            }
        });
        
        // Wait for batch completion
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Brief pause between batches
        if (i + maxConcurrency < sortedRequests.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    const successCount = results.size;
    const errorCount = errors.size;
    
    BrowserLogger.log(`📊 Batch loading completed: ${successCount} successful, ${errorCount} failed`, 'ModelManager');
    
    // Log any errors
    if (errorCount > 0) {
        BrowserLogger.log(`⚠️ Batch loading errors:`, 'ModelManager');
        errors.forEach((error, key) => {
            BrowserLogger.log(`  • ${key}: ${error.message}`, 'ModelManager');
        });
    }
    
    return results;
}
// ✅ ADD: Critical engine recovery method for NDArray disposal
static async forceRecreateEngineWithProtection(tier: string): Promise<void> {
    console.log(`🔄 Protected engine recreation for ${tier}...`);
    
    try {
        // ATOMIC: Multiple lock protection
        if (this.engineRecreationLock) {
            throw new Error('Engine recreation already in progress');
        }
        
        // COORDINATION: Check all system states
        if (testControl?.isRunning || testControl?.isPaused || testControl?.loadingModel) {
            throw new Error('Cannot recreate engine during active operations');
        }
        
        this.engineRecreationLock = true;
        
        // ENHANCED: Mark engine as being recreated globally
        (window as any).engineRecreationInProgress = true;
        this.setEngineState(tier, 'recreating');
        
        // DISPOSAL WITH VALIDATION
        const currentEngine = (window as any).currentMLCEngine;
        if (currentEngine) {
            console.log('🗑️ Disposing engine with enhanced validation...');
            
            try {
                // Timeout-protected disposal
                await Promise.race([
                    (async () => {
                        if (typeof currentEngine.dispose === 'function') {
                            await currentEngine.dispose();
                        }
                    })(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Disposal timeout')), 10000)
                    )
                ]);
            } catch (disposalError) {
                console.log('Engine disposal completed with errors (expected):', disposalError.message);
            }
            
            // VALIDATED CLEANUP: Check NDArray disposal in steps
            let cleanupValidated = false;
            for (let attempt = 0; attempt < 10; attempt++) {
                const isClean = await this.validateNDArrayDisposal();
                if (isClean) {
                    console.log(`✅ NDArray cleanup validated after ${attempt + 1} attempts`);
                    cleanupValidated = true;
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (!cleanupValidated) {
                console.warn('⚠️ NDArray cleanup validation failed - proceeding with caution');
            }
        }
        
        // CLEAR ALL REFERENCES ATOMICALLY
        delete (window as any).currentMLCEngine;
        delete (window as any).engineCache;
        delete (window as any).mlcEngine;
        this.currentEngine = null;
        
        // FORCE GC AND WAIT
        if ((window as any).gc) {
            try { (window as any).gc(); } catch (e) { /* ignore */ }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // CREATE NEW ENGINE WITH COMPREHENSIVE ERROR HANDLING
        const preferredModels = BrowserModelLoader.getModelPreferences(tier);
        const selectedModel = BrowserModelLoader.getAvailableModel(preferredModels, tier);
        
        console.log(`🔧 Creating protected new engine for ${selectedModel}`);
        
        const newEngine = await Promise.race([
            webllm.CreateMLCEngine(selectedModel, {
                initProgressCallback: (progress) => {
                    // SAFE: Validate progress object
                    if (progress && typeof progress === 'object' && progress.progress !== undefined) {
                        const percentage = (progress.progress * 100).toFixed(1);
                        console.log(`🔄 Protected recreation: ${percentage}%`);
                    }
                }
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Engine creation timeout')), 180000) // 3 minutes
            )
        ]);
        
        if (!newEngine) {
            throw new Error(`Protected engine creation failed for ${tier}`);
        }
        
        // CONFIGURE AND VALIDATE
        (newEngine as any)._mcdConfig = preferredModels;
        (newEngine as any)._mcdTier = tier;
        (newEngine as any)._protectedRecreation = true;
        (newEngine as any)._recreationTime = Date.now();
        
        // VALIDATE ENGINE BEFORE SETTING
        const isHealthy = this.validateEngineHealth(newEngine);
        if (!isHealthy) {
            throw new Error(`New engine failed health validation for ${tier}`);
        }
        
        // SET ENGINE ATOMICALLY
        (window as any).currentMLCEngine = newEngine;
        this.currentEngine = newEngine;
        this.setEngineState(tier, 'ready');
        
        console.log(`✅ Protected engine recreation completed for ${tier}`);
        
    } catch (error) {
        console.error(`❌ Protected engine recreation failed for ${tier}:`, error);
        this.setEngineState(tier, 'error');
        throw error;
    } finally {
        this.engineRecreationLock = false;
        delete (window as any).engineRecreationInProgress;
    }
}


// ADD: Atomic lock for recreation
private static engineRecreationLock = false;
// ✅ ADD: Enhanced NDArray disposal validation
static async validateNDArrayDisposal(): Promise<boolean> {
    try {
        if (typeof window !== 'undefined' && (window as any).NDArrayMonitor) {
            const report = (window as any).NDArrayMonitor.getHealthReport();
            console.log(`📊 NDArray health check: ${report.activeArrays} active arrays`);
            return report.activeArrays === 0;
        }
        return true; // Assume clean if monitor not available
    } catch (error) {
        console.warn('NDArray validation failed:', error);
        return false;
    }
}

// ✅ ENHANCED: Integrate NDArray validation into engine recreation
static async forceRecreateEngineWithValidation(tier: string): Promise<void> {
    console.log(`🔄 Enhanced engine recreation for ${tier} with NDArray validation...`);
    
    try {
        // 1. ATOMIC LOCK
        if (this.engineRecreationLock) {
            throw new Error('Engine recreation already in progress');
        }
        this.engineRecreationLock = true;
        
        // 2. DISPOSE WITH NDArray MONITORING
        const currentEngine = (window as any).currentMLCEngine;
        if (currentEngine) {
            console.log('🗑️ Disposing current engine with NDArray monitoring...');
            
            try {
                if (typeof currentEngine.dispose === 'function') {
                    await currentEngine.dispose();
                }
            } catch (e) {
                console.log('Engine disposal completed (expected errors):', e.message);
            }
            
            // 3. VALIDATE NDArray CLEANUP
            let validationAttempts = 0;
            const maxValidationAttempts = 15; // 15 seconds max
            
            while (validationAttempts < maxValidationAttempts) {
                const isClean = await this.validateNDArrayDisposal();
                
                if (isClean) {
                    console.log(`✅ NDArray cleanup validated after ${validationAttempts + 1} attempts`);
                    break;
                }
                
                console.log(`⏳ Waiting for NDArray cleanup... (${validationAttempts + 1}/${maxValidationAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                validationAttempts++;
            }
            
            if (validationAttempts >= maxValidationAttempts) {
                console.warn('⚠️ NDArray cleanup validation timeout - proceeding with caution');
            }
        }
        
        // 4. CLEAR REFERENCES & FORCE GC
        delete (window as any).currentMLCEngine;
        delete (window as any).engineCache;
        delete (window as any).mlcEngine;
        
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        // 5. ADDITIONAL STABILIZATION
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 6. CREATE NEW ENGINE
        const preferredModels = BrowserModelLoader.getModelPreferences(tier);
        const selectedModel = BrowserModelLoader.getAvailableModel(preferredModels, tier);
        
        console.log(`🔧 Creating validated new engine for ${selectedModel}`);
        
        const newEngine = await webllm.CreateMLCEngine(selectedModel, {
            initProgressCallback: (progress) => {
                const percentage = progress && typeof progress === 'object' ? 
                    (progress.progress * 100).toFixed(1) : 'Unknown';
                console.log(`🔄 Validated engine recreation: ${percentage}%`);
                
                if (testBedInfo.loadedModels && testBedInfo.loadedModels[tier]) {
                    testBedInfo.loadedModels[tier].status = '🔄 Recreating (Validated)';
                }
            }
        });
        
        if (!newEngine) {
            throw new Error(`Validated engine creation failed for ${tier}`);
        }
        
        // 7. CONFIGURE & TRACK
        (newEngine as any)._mcdConfig = preferredModels;
        (newEngine as any)._mcdTier = tier;
        (newEngine as any)._validatedRecreation = true;
        (newEngine as any)._recreationTime = Date.now();
        
        (window as any).currentMLCEngine = newEngine;
        this.currentEngine = newEngine;
        
        // 8. FINAL VALIDATION
        const finalValidation = await this.validateNDArrayDisposal();
        console.log(`✅ Engine recreation completed for ${tier} (NDArray clean: ${finalValidation})`);
        
    } catch (error) {
        console.error(`❌ Enhanced engine recreation failed for ${tier}:`, error);
        throw error;
    } finally {
        this.engineRecreationLock = false;
    }
}


// ✅ ENHANCED: Engine enhancement for walkthrough compatibility
private static enhanceEngineForWalkthroughs(
    baseEngine: any, 
    context: ModelLoadingContext
): WalkthroughCompatibleEngine {
    
    // Create enhanced wrapper
    const enhancedEngine: WalkthroughCompatibleEngine = {
        chat: {
            completions: {
                create: async (params) => {
    try {
        // Enhanced parameter validation
        if (!params?.messages || !Array.isArray(params.messages)) {
            throw new Error('Invalid messages parameter for walkthrough engine');
        }
        
        // ✅ NEW: Token budget enforcement for walkthroughs
        let enforcedParams = { ...params };
        if (context.domain) {
            const domainTokenBudget = BrowserModelLoader.getDomainTokenBudget(context.domain, context.tier);
            enforcedParams.max_tokens = Math.min(domainTokenBudget, params.max_tokens || domainTokenBudget);
            
            // Add domain-specific stop sequences
            const stopSequences = BrowserModelLoader.getDomainStopSequences(context.domain);
            if (stopSequences.length > 0) {
                enforcedParams.stop = stopSequences;
            }
        }
        
        // Performance monitoring
        const startTime = performance.now();
        
        const response = await baseEngine.chat.completions.create({
            ...enforcedParams,
            // Apply domain-specific optimizations
            temperature: context.domain ? 
                BrowserModelLoader.getDomainTemperature(context.domain, context.tier) : 
                params.temperature,
            top_p: context.domain ?
                BrowserModelLoader.getDomainTopP(context.domain, context.tier) :
                params.top_p
        });
        
        const endTime = performance.now();
        
        // ✅ NEW: Detect and handle fallback triggers
        if (context.domain) {
            const triggers = BrowserModelLoader.detectFallbackTriggers(response, endTime - startTime, context);
            if (triggers.length > 0) {
                BrowserModelLoader.handleFallbackTriggers(triggers, context);
            }
        }
        
        // Update performance metrics
        BrowserModelLoader.updateEngineMetrics(context.tier, context.domain, {
            latency: endTime - startTime,
            tokens: response.usage?.total_tokens || 0,
            success: !!response.choices?.[0]?.message?.content
        });
        
        return response;
        
    } catch (error) {
        // ✅ NEW: Handle execution failures as fallback triggers
        if (context.domain) {
            BrowserModelLoader.handleFallbackTriggers(['execution_failure'], context);
        }
        BrowserLogger.log(`❌ Enhanced engine error for ${context.tier}${context.domain ? `-${context.domain}` : ''}: ${error?.message}`, 'ModelManager');
        throw error;
    }
}

            }
        },
        
        // Enhanced configuration
        _mcdConfig: BrowserModelLoader.getModelPreferences(context.tier),
        _mcdTier: context.tier,
        _walkthroughCompatible: context.framework === 'Chapter7',
        _walkthroughConfig: context.domain ? 
            BrowserModelLoader.getTierConfigForWalkthrough(context.tier, context.domain) : null,
        _domainOptimization: context.domain ? {
            domain: context.domain,
            tier: context.tier,
            optimizationLevel: BrowserModelLoader.getDomainOptimizationScore(testBedInfo.selectedModels?.[context.tier] || '', context.domain),
            mcdCompliance: BrowserModelLoader.estimateMCDCompliance(testBedInfo.selectedModels?.[context.tier] || '', context.domain),
            expectedLatency: BrowserModelLoader.getExpectedLatency(context.tier, context.domain),
            expectedTokens: BrowserModelLoader.getExpectedTokens(context.tier, context.domain),
            fallbackStrategy: context.tier === 'Q1' ? 'graceful' : 'immediate'
        } : undefined,
        
        // Health monitoring
        getHealth: async () => {
            return BrowserModelLoader.checkEngineHealth(baseEngine, context);
        },
        
        // Performance metrics
        getPerformanceMetrics: () => {
            return BrowserModelLoader.getEnginePerformanceMetrics(context.tier, context.domain);
        },
        
        // Cleanup
        destroy: async () => {
            if (baseEngine && typeof baseEngine.destroy === 'function') {
                await baseEngine.destroy();
            }
        }
    };
    
    return enhancedEngine;
}

static initializeNDArrayMonitoring(): void {
    if (typeof window !== 'undefined' && (window as any).NDArrayMonitor) {
        // Hook into engine creation
        const originalCreateEngine = webllm.CreateMLCEngine;
        webllm.CreateMLCEngine = async (...args) => {
            const engine = await originalCreateEngine(...args);
            if (engine) {
                (window as any).NDArrayMonitor.trackArray(engine, `Engine-${Date.now()}`);
            }
            return engine;
        };
        
        console.log('🔍 NDArray monitoring integrated with model manager');
    }
}

private static classifyLoadingError(error: any, modelName: string): Error {
    const originalMessage = error?.message || 'Unknown error';
    let enhancedMessage = originalMessage;
    let errorType = 'UnknownError';
    
    // Classify error types
    if (originalMessage.includes('fetch')) {
        errorType = 'NetworkError';
        enhancedMessage = `Network error loading ${modelName}: ${originalMessage}. Check internet connection.`;
    } else if (originalMessage.includes('memory') || originalMessage.includes('out of memory')) {
        errorType = 'MemoryError';
        enhancedMessage = `Insufficient memory to load ${modelName}: ${originalMessage}. Try closing other applications.`;
    } else if (originalMessage.includes('WebGPU') || originalMessage.includes('GPU')) {
        errorType = 'WebGPUError';
        enhancedMessage = `WebGPU error loading ${modelName}: ${originalMessage}. Check WebGPU support.`;
    } else if (originalMessage.includes('timeout')) {
        errorType = 'TimeoutError';
        enhancedMessage = `Timeout loading ${modelName}: ${originalMessage}. Model may be too large or network too slow.`;
    } else if (originalMessage.includes('not found') || originalMessage.includes('404')) {
        errorType = 'ModelNotFoundError';
        enhancedMessage = `Model not found: ${modelName}. Check model availability.`;
    }
    
    const classifiedError = new Error(enhancedMessage);
    classifiedError.name = errorType;
    (classifiedError as any).originalError = error;
    (classifiedError as any).modelName = modelName;
    
    return classifiedError;
}


    // ============================================
    // 🆕 NEW: CHAPTER 7 SPECIFIC FUNCTIONS
    // ============================================
	// ✅ ENHANCED: Advanced system integration for walkthroughs
static async initializeWalkthroughModelSystem(): Promise<{
    success: boolean;
    readyDomains: string[];
    readyTiers: string[];
    issues: string[];
    recommendations: string[];
}> {
    const readyDomains: string[] = [];
    const readyTiers: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
        BrowserLogger.log('🎯 Initializing enhanced walkthrough model system...', 'Chapter7');
        
        // Check system capabilities
        const systemCapabilities = BrowserModelLoader.validateSystemCapabilities();
        if (!systemCapabilities.chapter7Ready) {
            issues.push('Chapter 7 system not ready');
            recommendations.push('Ensure WebGPU is enabled and models are available');
        }
        
        // Validate each domain
        const domains = ['appointment-booking', 'spatial-navigation', 'failure-diagnostics'];
        const tiers = ['Q1', 'Q4', 'Q8'];
        
        for (const domain of domains) {
            let domainReady = true;
            
            for (const tier of tiers) {
                const validation = BrowserModelLoader.validateDomainModelAvailability(domain, tier);
                if (!validation.isAvailable) {
                    issues.push(`${domain} domain not available for ${tier} tier`);
                    domainReady = false;
                } else if (!validation.domainOptimized) {
                    recommendations.push(`${domain} domain will use fallback models in ${tier} tier`);
                }
            }
            
            if (domainReady) {
                readyDomains.push(domain);
            }
        }
        
        // Check tier readiness
        for (const tier of tiers) {
            const validation = BrowserModelLoader.validateModelAvailability(tier);
            if (validation.isAvailable) {
                readyTiers.push(tier);
            }
        }
        
        // Set up enhanced model manager if ready
        if (readyDomains.length > 0 && readyTiers.length > 0) {
            // Register enhanced capabilities globally
            if (typeof window !== 'undefined') {
                (window as any).walkthroughModelManager = {
                    loadModelsForDomains: BrowserModelLoader.
				// ✅ ADD: Memory pressure check before batch processing


				    loadModelsForWalkthroughBatch,
                    getSystemCapabilities: BrowserModelLoader.validateSystemCapabilities,
                    getModelSummary: BrowserModelLoader.getModelSummary,
                    checkDomainOptimization: (domain: string, tier: string) => {
                        const modelName = testBedInfo.selectedModels?.[tier] || '';
                        return BrowserModelLoader.getDomainOptimizationScore(modelName, domain);
                    }
                };
                
                BrowserLogger.log('✅ Enhanced walkthrough model manager registered globally', 'Chapter7');
            }
        }
        
        const success = readyDomains.length > 0 && readyTiers.length > 0 && issues.length === 0;
        
        BrowserLogger.log(`📊 Walkthrough model system initialization: ${success ? 'SUCCESS' : 'PARTIAL'}`, 'Chapter7');
        BrowserLogger.log(`📋 Ready domains: ${readyDomains.join(', ')}`, 'Chapter7');
        BrowserLogger.log(`🏗️ Ready tiers: ${readyTiers.join(', ')}`, 'Chapter7');
        
        return {
            success,
            readyDomains,
            readyTiers,
            issues,
            recommendations
        };
        
    } catch (error) {
        const errorMsg = `Walkthrough model system initialization failed: ${error?.message}`;
        issues.push(errorMsg);
        BrowserLogger.log(`❌ ${errorMsg}`, 'Chapter7');
        
        return {
            success: false,
            readyDomains,
            readyTiers,
            issues,
            recommendations
        };
    }
}

	
// Get tier configuration for walkthroughs
private static getTierConfigForWalkthrough(tier: string, domain: string): object {
    // Basic tier configuration
    const baseConfig = {
        Q1: { maxTokens: 60, temperature: 0.7, topP: 0.9 },
        Q4: { maxTokens: 150, temperature: 0.0, topP: 1.0 },
        Q8: { maxTokens: 200, temperature: 0.0, topP: 1.0 }
    };
    
    return baseConfig[tier as keyof typeof baseConfig] || baseConfig.Q4;
}

    // Load model specifically for Chapter 7 domain walkthrough
    static async loadModelForDomain(domain: string, tier: string): Promise<any> {
        const context: ModelLoadingContext = {
            framework: 'Chapter7',
            tier,
            domain,
            purpose: `${domain} domain walkthrough`,
            priority: 'high'
        };
        
        BrowserLogger.logWalkthrough(`🔧 Loading model for ${domain} domain`, domain);
        return BrowserModelLoader.loadModel(tier, context);
    }

    // Load model for unified framework (both T1-T10 and Chapter 7)
    static async loadModelForUnified(tier: string, primaryDomain?: string): Promise<any> {
        const context: ModelLoadingContext = {
            framework: 'Unified',
            tier,
            domain: primaryDomain,
            purpose: 'Unified T1-T10 and Chapter 7 testing',
            priority: 'high'
        };
        
        BrowserLogger.logUnified(`🚀 Loading unified framework model for ${tier} tier`);
        return BrowserModelLoader.loadModel(tier, context);
    }
// ✅ NEW: Load model with automatic tier fallback for complex cases
static async loadModelWithFallback(
    primaryTier: string, 
    context: ModelLoadingContext,
    maxRetries: number = 2
): Promise<any> {
    const tierSequence = BrowserModelLoader.getTierFallbackSequence(primaryTier);
    let lastError: Error | null = null;
    
    BrowserLogger.log(`🔄 Attempting tier sequence: ${tierSequence.join(' → ')} for ${context.domain || 'general'}`, 'ModelManager');
    
    for (let i = 0; i < tierSequence.length && i < maxRetries; i++) {
        try {
            const tier = tierSequence[i];
            const fallbackContext = { ...context, tier };
            
            if (i > 0) {
                BrowserLogger.log(`⚠️ ${tierSequence[i-1]} failed, trying ${tier} as fallback`, 'ModelManager');
            }
            
            return await BrowserModelLoader.loadModel(tier, fallbackContext);
            
        } catch (error) {
            lastError = error as Error;
            if (i === tierSequence.length - 1) {
                BrowserLogger.log(`❌ All tier fallbacks exhausted for ${context.domain || 'general'}`, 'ModelManager');
                break;
            }
        }
    }
    
    throw lastError || new Error(`All tier fallbacks failed for ${primaryTier}`);
}

// ✅ NEW: Get tier fallback sequence
private static getTierFallbackSequence(primaryTier: string): string[] {
    const sequences = {
        Q8: ['Q8', 'Q4', 'Q1'],  // Complex → simpler for resource constraints
        Q4: ['Q4', 'Q1'],        // Balanced → minimal for speed
        Q1: ['Q1']               // Minimal only (no fallback needed)
    };
    return sequences[primaryTier] || ['Q1'];
}

    // Get domain optimization score for model selection
    private static getDomainOptimizationScore(modelName: string, domain: string): number {
        const name = modelName.toLowerCase();
        
        // Domain-specific scoring based on model characteristics
        switch (domain) {
            case 'appointment-booking':
                // Prefer models good at structured conversations and slot-filling
                if (name.includes('gemma')) return 90; // Excellent for structured tasks
                if (name.includes('phi-3')) return 85; // Good instruction following
                if (name.includes('tinyllama')) return 70; // Decent fallback
                if (name.includes('qwen')) return 75; // Good reasoning
                break;
                
            case 'spatial-navigation':
                // Prefer models good at reasoning and constraint handling
                if (name.includes('llama-3.2')) return 95; // Excellent reasoning
                if (name.includes('phi-3')) return 90; // Good analytical
                if (name.includes('gemma')) return 80; // Good balance
                if (name.includes('qwen')) return 85; // Good reasoning
                break;
                
            case 'failure-diagnostics':
                // Prefer models good at problem analysis and over-engineering detection
                if (name.includes('phi-3')) return 95; // Excellent analytical
                if (name.includes('gemma')) return 85; // Good reasoning
                if (name.includes('llama')) return 80; // Good analysis
                if (name.includes('qwen')) return 90; // Excellent reasoning
                break;
        }
        
        // Default scoring for unknown domains
        return 50;
    }

    // Estimate MCD compliance for domain-specific models
    private static estimateMCDCompliance(modelName: string, domain: string): number {
        const baseCompliance = BrowserModelLoader.getDomainOptimizationScore(modelName, domain);
        const name = modelName.toLowerCase();
        
        // Adjust based on model characteristics
        let complianceScore = baseCompliance;
        
        // Larger models tend to have better MCD compliance
        if (name.includes('3b') || name.includes('7b')) complianceScore += 10;
        if (name.includes('2b')) complianceScore += 5;
        if (name.includes('0.5b')) complianceScore -= 10;
        
        // Instruction-tuned models typically better for MCD
        if (name.includes('instruct') || name.includes('chat')) complianceScore += 5;
        
        // Quantization impact
        if (name.includes('q4f32_1')) complianceScore += 5; // Better precision
        if (name.includes('q4f16_1')) complianceScore += 0; // Standard
        
        return Math.max(0, Math.min(100, complianceScore));
    }

    // Calculate resource efficiency score
    private static calculateResourceEfficiency(modelName: string, modelSize: string): number {
        const sizeNum = parseInt(modelSize.replace(/[^\d]/g, '')) || 1000; // Default 1GB if parsing fails
        const modelSizeParams = BrowserModelLoader.extractModelSize(modelName);
        
        // Calculate efficiency as performance per MB
        let efficiencyScore = 100;
        
        // Penalize larger sizes
        if (sizeNum > 2000) efficiencyScore -= 30; // > 2GB
        else if (sizeNum > 1000) efficiencyScore -= 15; // > 1GB
        else if (sizeNum > 500) efficiencyScore -= 5;   // > 500MB
        
        // Reward smaller parameter models with good performance
        if (modelSizeParams <= 1.0 && sizeNum < 600) efficiencyScore += 20;
        if (modelSizeParams <= 0.5 && sizeNum < 300) efficiencyScore += 30;
        
        return Math.max(0, Math.min(100, efficiencyScore));
    }

    // Validate domain model availability
    static validateDomainModelAvailability(domain: string, tier: string): { 
        isAvailable: boolean; 
        availableModels: string[]; 
        reason?: string;
        domainOptimized: boolean;
    } {
        try {
            const domainPreferences = BrowserModelLoader.getDomainModelPreferences(domain, tier);
            const availableModels = testBedInfo?.availableModels || [];
            
            if (availableModels.length === 0) {
                return {
                    isAvailable: false,
                    availableModels: [],
                    reason: 'No models detected in system',
                    domainOptimized: false
                };
            }
            
            // Check domain-optimized models
            const availableDomainModels = domainPreferences.filter(model => availableModels.includes(model));
            if (availableDomainModels.length > 0) {
                return {
                    isAvailable: true,
                    availableModels: availableDomainModels,
                    domainOptimized: true
                };
            }
            
            // Fall back to tier preferences
            const tierPreferences = BrowserModelLoader.getModelPreferences(tier);
            const availableTierModels = tierPreferences.filter(model => availableModels.includes(model));
            
            if (availableTierModels.length > 0) {
                return {
                    isAvailable: true,
                    availableModels: availableTierModels,
                    domainOptimized: false
                };
            }
            
            return {
                isAvailable: false,
                availableModels: [],
                reason: `No suitable models found for ${domain} domain in ${tier} tier`,
                domainOptimized: false
            };
            
        } catch (error) {
            BrowserLogger.logWalkthrough(`❌ Error validating ${domain} model availability: ${error?.message}`, domain);
            return {
                isAvailable: false,
                availableModels: [],
                reason: `Validation error: ${error?.message}`,
                domainOptimized: false
            };
        }
    }
// ✅ ENHANCED: Advanced domain analytics and intelligence
private static getDomainTemperature(domain: string, tier: string): number {
    // Domain-specific temperature optimization
    const domainSettings = {
        'appointment-booking': {
            Q1: 0.3, Q4: 0.1, Q8: 0.0  // Lower temp for structured conversations
        },
        'spatial-navigation': {
            Q1: 0.5, Q4: 0.2, Q8: 0.1  // Medium temp for reasoning tasks
        },
        'failure-diagnostics': {
            Q1: 0.7, Q4: 0.3, Q8: 0.2  // Higher temp for creative problem solving
        }
    };
    
    return domainSettings[domain]?.[tier] || 0.7;
}

private static getDomainTopP(domain: string, tier: string): number {
    // Domain-specific nucleus sampling optimization
    const domainSettings = {
        'appointment-booking': {
            Q1: 0.8, Q4: 0.9, Q8: 1.0  // More focused for slot-filling
        },
        'spatial-navigation': {
            Q1: 0.7, Q4: 0.85, Q8: 0.95  // Balanced for reasoning
        },
        'failure-diagnostics': {
            Q1: 0.9, Q4: 0.95, Q8: 1.0  // Broader for creative analysis
        }
    };
    
    return domainSettings[domain]?.[tier] || 0.9;
}
// ✅ NEW: Domain-specific token budgets from walkthrough specifications
private static getDomainTokenBudget(domain: string, tier: string): number {
    // Connect to actual walkthrough specification budgets
    const domainBudgets = {
        'appointment-booking': { Q1: 50, Q4: 60, Q8: 75 },  // From D1 specs
        'spatial-navigation': { Q1: 40, Q4: 45, Q8: 70 },   // From D2 specs  
        'failure-diagnostics': { Q1: 50, Q4: 60, Q8: 150 }  // From D3 specs
    };
    
    return domainBudgets[domain]?.[tier] || 100;
}

// ✅ NEW: Domain-specific stop sequences to prevent over-generation
private static getDomainStopSequences(domain: string): string[] {
    const stopSequences = {
        'appointment-booking': ['\n\n', 'Let me know', 'Please tell me'],
        'spatial-navigation': ['\n\n', 'Consider', 'You might want'],
        'failure-diagnostics': ['\n\n', 'We should', 'It would be good']
    };
    
    return stopSequences[domain] || ['\n\n'];
}

// ✅ NEW: Detect fallback triggers during execution
// ✅ NEW: Detect fallback triggers during execution
private static detectFallbackTriggers(response: any, latency: number, context: ModelLoadingContext): string[] {
    const triggers: string[] = [];
    
    try {
        // Check latency triggers from domain specs
        const maxLatency = context.domain === 'appointment-booking' ? 450 :
                          context.domain === 'spatial-navigation' ? 400 : 500;
        if (latency > maxLatency) {
            triggers.push('timeout_error');
        }
        
        // Check token overflow
        const expectedTokens = BrowserModelLoader.getExpectedTokens(context.tier, context.domain);
        if (response.usage?.total_tokens > expectedTokens * 1.5) {
            triggers.push('resource_exhausted');
        }
        
        // Check for validation issues - FIXED LINE
        if (!response.choices?.[0]?.message?.content || response.choices?.message?.content?.trim().length === 0) {
            triggers.push('validation_failed');
        }
        
    } catch (error) {
        triggers.push('unknown_error');
    }
    
    return triggers;
}

// Add to BrowserModelLoader class
private static engineStates = new Map<string, 'loading' | 'ready' | 'disposing' | 'recreating'>();

static setEngineState(tier: string, state: string): void {
    this.engineStates.set(tier, state as any);
    console.log(`🔧 Engine ${tier} state: ${state}`);
}

static getEngineState(tier: string): string {
    return this.engineStates.get(tier) || 'unknown';
}

// ✅ NEW: Handle fallback triggers
private static handleFallbackTriggers(triggers: string[], context: ModelLoadingContext): void {
    try {
        BrowserLogger.log(`⚠️ Fallback triggers detected for ${context.tier}${context.domain ? `-${context.domain}` : ''}: ${triggers.join(', ')}`, 'ModelManager');
        
        // Update performance metrics with trigger information
        if (!testBedInfo.performanceMetrics) {
            testBedInfo.performanceMetrics = {};
        }
        
        if (!testBedInfo.performanceMetrics.fallbackTriggers) {
            testBedInfo.performanceMetrics.fallbackTriggers = {};
        }
        
        const key = context.domain ? `${context.tier}-${context.domain}` : context.tier;
        if (!testBedInfo.performanceMetrics.fallbackTriggers[key]) {
            testBedInfo.performanceMetrics.fallbackTriggers[key] = [];
        }
        
        testBedInfo.performanceMetrics.fallbackTriggers[key].push({
            triggers,
            timestamp: Date.now(),
            domain: context.domain,
            tier: context.tier
        });
        
        // Notify walkthrough system if available
        if (typeof window !== 'undefined' && (window as any).walkthroughUI?.handleFallbackTriggers) {
            (window as any).walkthroughUI.handleFallbackTriggers(triggers, context);
        }
        
    } catch (error) {
        console.warn('Error handling fallback triggers:', error);
    }
}

private static getExpectedLatency(tier: string, domain?: string): number {
    // Base expectations by tier
    const baseLatency = {
        Q1: 200,  // Fast, lightweight
        Q4: 500,  // Balanced
        Q8: 1000  // Quality-focused
    };
    
    // Domain complexity adjustments
    const domainMultipliers = {
        'appointment-booking': 1.0,    // Standard complexity
        'spatial-navigation': 1.3,     // Higher reasoning complexity
        'failure-diagnostics': 1.5     // Highest analytical complexity
    };
    
    const base = baseLatency[tier] || 500;
    const multiplier = domain ? domainMultipliers[domain] || 1.0 : 1.0;
    
    return Math.round(base * multiplier);
}

private static getExpectedTokens(tier: string, domain?: string): number {
    // Base token expectations by tier
    const baseTokens = {
        Q1: 50,   // Concise responses
        Q4: 120,  // Balanced responses
        Q8: 200   // Comprehensive responses
    };
    
    // Domain verbosity adjustments
    const domainMultipliers = {
        'appointment-booking': 0.8,    // More concise
        'spatial-navigation': 1.2,     // More detailed explanations
        'failure-diagnostics': 1.4     // Most comprehensive analysis
    };
    
    const base = baseTokens[tier] || 120;
    const multiplier = domain ? domainMultipliers[domain] || 1.0 : 1.0;
    
    return Math.round(base * multiplier);
}

private static updateEngineMetrics(tier: string, domain: string | undefined, metrics: {
    latency: number;
    tokens: number;
    success: boolean;
}) {
    try {
        if (!testBedInfo.performanceMetrics) {
            testBedInfo.performanceMetrics = {};
        }
        
        const key = domain ? `${tier}-${domain}` : tier;
        
        if (!testBedInfo.performanceMetrics.engineMetrics) {
            testBedInfo.performanceMetrics.engineMetrics = {};
        }
        
        if (!testBedInfo.performanceMetrics.engineMetrics[key]) {
            testBedInfo.performanceMetrics.engineMetrics[key] = {
                totalRequests: 0,
                successfulRequests: 0,
                totalLatency: 0,
                totalTokens: 0,
                averageLatency: 0,
                averageTokens: 0,
                successRate: 0,
                lastUpdated: Date.now()
            };
        }
        
        const stats = testBedInfo.performanceMetrics.engineMetrics[key];
        stats.totalRequests++;
        if (metrics.success) stats.successfulRequests++;
        stats.totalLatency += metrics.latency;
        stats.totalTokens += metrics.tokens;
        stats.averageLatency = Math.round(stats.totalLatency / stats.totalRequests);
        stats.averageTokens = Math.round(stats.totalTokens / stats.totalRequests);
        stats.successRate = Math.round((stats.successfulRequests / stats.totalRequests) * 100);
        stats.lastUpdated = Date.now();
        
    } catch (error) {
        console.warn('Failed to update engine metrics:', error);
    }
}

private static async checkEngineHealth(engine: any, context: ModelLoadingContext): Promise<EngineHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
        const startTime = performance.now();
        
        // Test basic functionality
        const testResponse = await Promise.race([
            engine.chat.completions.create({
                messages: [{ role: "user", content: "test" }],
                max_tokens: 5
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), 5000)
            )
        ]);
        
        const responseTime = performance.now() - startTime;
        
        // Analyze response
        if (!testResponse || !testResponse.choices || testResponse.choices.length === 0) {
            issues.push('Engine not responding correctly');
        }
        
        if (responseTime > 3000) {
            issues.push('High response time detected');
            recommendations.push('Consider using a smaller model for better performance');
        }
        
        // Memory check
        let memoryUsage = 0;
        if (typeof performance !== 'undefined' && performance.memory) {
            memoryUsage = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
            if (memoryUsage > 1500) {
                issues.push('High memory usage detected');
                recommendations.push('Consider refreshing the application');
            }
        }
        
        // Determine status
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (issues.length > 2) status = 'unhealthy';
        else if (issues.length > 0) status = 'degraded';
        
        return {
            status,
            responseTime: Math.round(responseTime),
            memoryUsage,
            lastTest: Date.now(),
            issues,
            recommendations
        };
        
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: -1,
            memoryUsage: 0,
            lastTest: Date.now(),
            issues: [`Health check failed: ${error?.message}`],
            recommendations: ['Reload the model', 'Check system resources']
        };
    }
}

private static getEnginePerformanceMetrics(tier: string, domain?: string): EnginePerformanceMetrics {
    const key = domain ? `${tier}-${domain}` : tier;
    const stats = testBedInfo.performanceMetrics?.engineMetrics?.[key];
    
    if (!stats) {
        return {
            averageLatency: 0,
            averageTokens: 0,
            successRate: 0,
            totalRequests: 0,
            errorRate: 0,
            lastUpdated: Date.now()
        };
    }
    
    return {
        averageLatency: stats.averageLatency,
        averageTokens: stats.averageTokens,
        successRate: stats.successRate,
        totalRequests: stats.totalRequests,
        errorRate: 100 - stats.successRate,
        lastUpdated: stats.lastUpdated
    };
}

    // ============================================
    // 🔄 EXISTING FUNCTIONS (PRESERVED)
    // ============================================
    
    // ENHANCED: More comprehensive size estimation (preserved exactly)
    static estimateModelSize(modelName: string): string {
        if (!modelName || typeof modelName !== 'string') {
            return 'Unknown';
        }
        
        // Convert to lowercase for consistent matching
        const name = modelName.toLowerCase();
        
        // ENHANCED: More specific size-based patterns
        if (name.includes('0.5b')) return '~300MB';
        if (name.includes('1b') || name.includes('1.1b')) return '~600MB';
        if (name.includes('2b')) return '~1.2GB';
        if (name.includes('3b')) return '~2GB';
        if (name.includes('7b')) return '~4GB';
        if (name.includes('13b')) return '~8GB';
        
        // ENHANCED: Model-specific patterns with more models
        if (name.includes('qwen2-0.5b')) return '~266MB';
        if (name.includes('tinyllama-1.1b')) return '~600MB';
        if (name.includes('llama-3.2-1b')) return '~650MB';
        if (name.includes('gemma-2-2b')) return '~1.2GB';
        if (name.includes('phi-3-mini')) return '~2GB';
        if (name.includes('phi-1')) return '~800MB';
        if (name.includes('phi-1_5')) return '~800MB';
        
        // ENHANCED: Quantization-based fallbacks with more precision
        if (name.includes('q4f16_1')) return '~600MB';
        if (name.includes('q4f32_1')) return '~800MB';
        if (name.includes('q8f16_1')) return '~1GB';
        if (name.includes('q16f16_1')) return '~2GB';
        
        return 'Unknown';
    }
    
    // ENHANCED: Comprehensive model availability validation + Chapter 7 support
    static validateModelAvailability(tier: string, domain?: string): { 
        isAvailable: boolean; 
        availableModels: string[]; 
        reason?: string;
        domainOptimized?: boolean;
    } {
        try {
            // ✅ NEW: Use domain-specific validation for Chapter 7
            if (domain) {
                return BrowserModelLoader.validateDomainModelAvailability(domain, tier);
            }
            
            // Original T1-T10 validation (preserved exactly)
            const preferredModels = BrowserModelLoader.getModelPreferences(tier);
            const availableModels = testBedInfo?.availableModels || [];
            
            if (availableModels.length === 0) {
                return {
                    isAvailable: false,
                    availableModels: [],
                    reason: 'No models detected in system'
                };
            }
            
            // Check preferred models
            const availablePreferred = preferredModels.filter(model => availableModels.includes(model));
            if (availablePreferred.length > 0) {
                return {
                    isAvailable: true,
                    availableModels: availablePreferred
                };
            }
            
            // Check fallback models
            const availableFallbacks = availableModels.filter(model => {
                const name = model.toLowerCase();
                return name.includes('tiny') || 
                       name.includes('phi') ||
                       name.includes('gemma') ||
                       name.includes('qwen');
            });
            
            if (availableFallbacks.length > 0) {
                return {
                    isAvailable: true,
                    availableModels: availableFallbacks
                };
            }
            
            return {
                isAvailable: false,
                availableModels: [],
                reason: `No suitable models found for ${tier} tier`
            };
            
        } catch (error) {
            BrowserLogger.log(`❌ Error validating ${tier} availability: ${error?.message}`);
            return {
                isAvailable: false,
                availableModels: [],
                reason: `Validation error: ${error?.message}`
            };
        }
    }

    // ============================================
    // 🔄 EXISTING HELPER METHODS (ENHANCED)
    // ============================================
// FIXED: Add synchronization for live component updates
 
 
 

    // ENHANCED: Live component integration + Chapter 7 support
    private static updateLiveComponentsOnModelSelection(tier: string, modelName: string, context?: ModelLoadingContext) {
    UnifiedUpdateManager.scheduleUpdate('modelSelection', async () => {
        try {
            // Update live comparison if visible
            const liveContainer = document.getElementById('liveComparisonContainer');
            if (liveContainer && liveContainer.style.display !== 'none') {
                if (typeof LiveComparison !== 'undefined' && LiveComparison.updateLiveComparison) {
                    await LiveComparison.updateLiveComparison();
                }
            }
            
            // Update component UI
            if (typeof ComponentUI !== 'undefined' && ComponentUI.updateLiveComponents) {
                await ComponentUI.updateLiveComponents();
            }
            
            // NEW: Update walkthrough components for Chapter 7
            if (context?.framework === 'Chapter7' && context.domain) {
                if (typeof window !== 'undefined' && (window as any).updateDomainResults) {
                    await Promise.resolve((window as any).updateDomainResults(context.domain));
                }
            }
            
        } catch (error) {
            console.warn('Could not update live components on model selection:', error);
        }
    });
}




    private static updateLiveComponentsOnLoadStart(tier: string, context?: ModelLoadingContext) {
    UnifiedUpdateManager.scheduleUpdate('loadStart', () => {
        try {
            const progressIndicator = document.getElementById('liveProgressIndicator');
            if (progressIndicator) {
                const frameworkLabel = context?.framework || 'T1-T10';
                const domainLabel = context?.domain ? ` (${context.domain})` : '';
                
                progressIndicator.innerHTML = SimpleProgressTemplates.getTemplate(
                    'loading', frameworkLabel, tier, domainLabel, '🔄 Initializing...'
                );
            }
        } catch (error) {
            console.warn('Could not update live components on load start:', error);
        }
    });
}

// ADD THIS COMPLETE METHOD after updateLiveComponentsOnLoadStart:
// ✅ ENHANCED: Advanced real-time progress with detailed analytics
private static updateLiveComponentsOnLoadProgress(tier: string, progressText: string, context?: ModelLoadingContext) {
    // Skip during active execution to prevent conflicts
    if (testControl?.isRunning || testControl?.isPaused) return;
    
    try {
        const progressIndicator = document.getElementById('liveProgressIndicator');
        if (!progressIndicator) return;
        
        // Enhanced progress analysis
        const progressAnalysis = BrowserModelLoader.analyzeProgressText(progressText);
        const frameworkLabel = context?.framework || 'T1-T10';
        const domainLabel = context?.domain ? ` (${context.domain})` : '';
        const frameworkBadge = context?.framework === 'Chapter7' ? '🎯' : 
                              context?.framework === 'Unified' ? '🚀' : '📊';
        
        // Calculate ETA if percentage available
        let etaText = '';
        if (progressAnalysis.percentage > 0) {
            const elapsed = Date.now() - (testBedInfo.loadedModels?.[tier]?.loadStartTime || Date.now());
            const totalEstimated = elapsed / (progressAnalysis.percentage / 100);
            const remaining = totalEstimated - elapsed;
            
            if (remaining > 0 && progressAnalysis.percentage < 95) {
                const remainingSeconds = Math.round(remaining / 1000);
                etaText = ` (ETA: ${remainingSeconds}s)`;
            }
        }
        
        // Enhanced domain optimization info
        let optimizationText = '';
        if (context?.domain && progressAnalysis.percentage > 50) {
            const score = BrowserModelLoader.getDomainOptimizationScore(
                testBedInfo.selectedModels?.[tier] || '', 
                context.domain
            );
            optimizationText = ` • Opt: ${score}%`;
        }
        
        // Create enhanced progress display
        const progressDisplay = `
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem;">
                <span style="background: rgba(255, 193, 7, 0.8); color: #333; padding: 4px 8px; border-radius: 15px; font-weight: 600;">
                    ${frameworkBadge} ${frameworkLabel}${domainLabel}
                </span>
                <span style="background: rgba(255, 255, 255, 0.8); padding: 4px 8px; border-radius: 15px; font-weight: 600;">
                    ${progressAnalysis.displayText}${etaText}
                </span>
                ${progressAnalysis.percentage > 0 ? `
                    <div style="width: 60px; height: 6px; background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${progressAnalysis.percentage}%; height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s;"></div>
                    </div>
                ` : ''}
                ${optimizationText ? `
                    <span style="background: rgba(40, 167, 69, 0.8); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem;">
                        ${optimizationText}
                    </span>
                ` : ''}
            </div>
        `;
        
        progressIndicator.innerHTML = progressDisplay;
        
        // Enhanced walkthrough UI integration
        if (context?.framework === 'Chapter7' && window.walkthroughUI?.updateModelLoadingProgress) {
            window.walkthroughUI.updateModelLoadingProgress({
                tier,
                domain: context.domain,
                progress: progressAnalysis.percentage,
                stage: progressAnalysis.stage,
                eta: etaText,
                optimizationScore: context.domain ? 
                    BrowserModelLoader.getDomainOptimizationScore(testBedInfo.selectedModels?.[tier] || '', context.domain) : 
                    undefined
            });
        }
        
        // Enhanced domain results integration
        if (context?.domain && window.domainResultsDisplay?.updateModelProgress) {
            window.domainResultsDisplay.updateModelProgress({
                domain: context.domain,
                tier,
                progress: progressAnalysis.percentage,
                stage: progressAnalysis.stage
            });
        }
        
    } catch (error) {
        // Silent failure - don't block model loading
    }
}

// ✅ NEW: Advanced progress text analysis
private static analyzeProgressText(progressText: string): {
    percentage: number;
    stage: string;
    displayText: string;
    estimatedRemaining?: number;
} {
    let percentage = 0;
    let stage = 'initializing';
    let displayText = '🔄 Loading...';
    
    try {
        // Extract percentage
        const percentMatch = progressText.match(/(\d+)%/);
        if (percentMatch) {
            percentage = parseInt(percentMatch[1], 10);
        }
        
        // Determine stage based on content
        if (progressText.includes('download') || progressText.includes('fetch')) {
            stage = 'downloading';
            displayText = `📥 Downloading${percentage > 0 ? ` ${percentage}%` : '...'}`;
        } else if (progressText.includes('load') || progressText.includes('init')) {
            stage = 'loading';
            displayText = `🔧 Loading${percentage > 0 ? ` ${percentage}%` : '...'}`;
        } else if (progressText.includes('complete') || percentage >= 100) {
            stage = 'completing';
            displayText = '✅ Finalizing...';
            percentage = 100;
        } else if (progressText.includes('shard') || progressText.includes('chunk')) {
            stage = 'processing';
            displayText = `⚙️ Processing${percentage > 0 ? ` ${percentage}%` : '...'}`;
        } else if (percentage > 0) {
            stage = 'progress';
            displayText = `🔄 ${percentage}% Loaded`;
        }
        
        // Handle size information
        const sizeMatch = progressText.match(/(\d+(?:\.\d+)?)\s*MB/i);
        if (sizeMatch && percentage > 0) {
            displayText += ` (${sizeMatch[1]}MB)`;
        }
        
    } catch (error) {
        // Fallback to simple display
        displayText = '🔄 Loading...';
    }
    
    return {
        percentage,
        stage,
        displayText
    };
}





    // REPLACE updateLiveComponentsOnLoadComplete method with:
private static updateLiveComponentsOnLoadComplete(tier: string, modelName: string, context?: ModelLoadingContext) {
    // ✅ DEFERRED: Don't block model loading completion
    setTimeout(() => {
        try {
            // Only update when not executing trials
            if (testControl?.isRunning) return;
            
            // Update progress indicator
            const progressIndicator = document.getElementById('liveProgressIndicator');
            if (progressIndicator) {
                const frameworkLabel = context?.framework || 'T1-T10';
                const domainLabel = context?.domain ? ` (${context.domain})` : '';
                const frameworkBadge = context?.framework === 'Chapter7' ? '🎯' : 
                                      context?.framework === 'Unified' ? '🚀' : '📊';
                
                progressIndicator.innerHTML = `
                    <span style="background: rgba(40, 167, 69, 0.7); color: white; padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                        ${frameworkBadge} ${frameworkLabel}${domainLabel}: ✅ ${modelName.split('-')[0]} Ready
                    </span>
                `;
            }
            
            // ✅ SAFE: Only update components when safe
            if (typeof ComponentUI !== 'undefined' && ComponentUI.updateLiveComponents) {
                ComponentUI.updateLiveComponents();
            }
            
            if (typeof LiveComparison !== 'undefined' && LiveComparison.updateLiveComparison) {
                LiveComparison.updateLiveComparison();
            }
            
        } catch (error) {
            // Silent failure
        }
    }, 100);
}




    private static updateLiveComponentsOnLoadError(tier: string, errorMessage: string, context?: ModelLoadingContext) {
    UnifiedUpdateManager.scheduleUpdate('loadError', () => {
        try {
            const progressIndicator = document.getElementById('liveProgressIndicator');
            if (progressIndicator) {
                const frameworkLabel = context?.framework || 'T1-T10';
                const domainLabel = context?.domain ? ` (${context.domain})` : '';
                
                progressIndicator.innerHTML = SimpleProgressTemplates.getTemplate(
                    'error', frameworkLabel, tier, domainLabel, '❌ Error'
                );
            }
        } catch (error) {
            console.warn('Could not update live components on load error:', error);
        }
    });
}


    // ENHANCED: Performance metrics integration + Chapter 7 tracking
   private static updatePerformanceMetrics(tier: string, loadDuration: number, modelSize: string, context?: ModelLoadingContext) {
    // ✅ IMMEDIATE EXIT: Don't update during execution
    if (testControl?.isRunning) return;
    
    try {
        if (!testBedInfo.performanceMetrics) {
            testBedInfo.performanceMetrics = {
                totalTestsRun: 0,
                averageTestTime: 0,
                totalExecutionTime: 0,
                memoryUsage: 0
            };
        }
        
        // ✅ SIMPLIFIED: Essential metrics only
        testBedInfo.performanceMetrics.modelLoadingTime = testBedInfo.performanceMetrics.modelLoadingTime || {};
        testBedInfo.performanceMetrics.modelLoadingTime[tier] = {
            duration: loadDuration,
            size: modelSize,
            timestamp: Date.now(),
            framework: context?.framework || 'T1-T10',
            domain: context?.domain
        };
        
        // ✅ REMOVED: No recursive call to avoid potential issues
        
    } catch (error) {
        // Silent failure
    }
}



    // NEW: Extract model size from name for sorting (preserved exactly)
    private static extractModelSize(modelName: string): number {
        const name = modelName.toLowerCase();
        
        if (name.includes('0.5b')) return 0.5;
        if (name.includes('1.1b')) return 1.1;
        if (name.includes('1b')) return 1.0;
        if (name.includes('2b')) return 2.0;
        if (name.includes('3b')) return 3.0;
        if (name.includes('7b')) return 7.0;
        if (name.includes('13b')) return 13.0;
        
        // Default to medium size for unknown models
        return 5.0;
    }

    // ENHANCED: Comprehensive system validation + Chapter 7 readiness
    static validateSystemCapabilities(): { 
        canRun: boolean; 
        warnings: string[]; 
        recommendations: string[];
        chapter7Ready: boolean;
        unifiedReady: boolean;
    } {
        const warnings = [];
        const recommendations = [];
        let canRun = true;
        let chapter7Ready = true;
        let unifiedReady = true;
        
        try {
            // Check WebGPU
            if (!navigator.gpu) {
                warnings.push('WebGPU not supported');
                recommendations.push('Use Chrome/Edge with WebGPU enabled');
                canRun = false;
                chapter7Ready = false;
            }
            
            // Check available models
            const availableModels = testBedInfo?.availableModels || [];
            if (availableModels.length === 0) {
                warnings.push('No models detected');
                recommendations.push('Check internet connection and refresh page');
                canRun = false;
                chapter7Ready = false;
            }
            
            // Check memory
            const deviceMemory = (navigator as any).deviceMemory;
            if (deviceMemory && deviceMemory < 4) {
                warnings.push('Low system memory detected');
                recommendations.push('Close other applications for better performance');
            }
            
            // Check model availability for each tier (T1-T10)
            const tiers = ['Q1', 'Q4', 'Q8'];
            for (const tier of tiers) {
                const validation = BrowserModelLoader.validateModelAvailability(tier);
                if (!validation.isAvailable) {
                    warnings.push(`No models available for ${tier} tier`);
                }
            }
            
            // ✅ NEW: Check Chapter 7 domain model availability
            const domains = ['appointment-booking', 'spatial-navigation', 'failure-diagnostics'];
            let domainIssues = 0;
            
            for (const domain of domains) {
                for (const tier of tiers) {
                    const domainValidation = BrowserModelLoader.validateDomainModelAvailability(domain, tier);
                    if (!domainValidation.isAvailable) {
                        warnings.push(`No models available for ${domain} domain in ${tier} tier`);
                        domainIssues++;
                    } else if (!domainValidation.domainOptimized) {
                        recommendations.push(`${domain} domain will use fallback models - performance may be suboptimal`);
                    }
                }
            }
            
            // ✅ NEW: Chapter 7 readiness assessment
            if (domainIssues > 0) {
                chapter7Ready = false;
                if (domainIssues >= domains.length * tiers.length * 0.5) {
                    recommendations.push('Chapter 7 domain walkthroughs may have limited model availability');
                }
            }
            
            // ✅ NEW: Unified framework readiness
            unifiedReady = canRun && chapter7Ready;
            if (!unifiedReady) {
                recommendations.push('Unified framework requires both T1-T10 and Chapter 7 capabilities');
            }
            
            // ✅ NEW: Framework-specific recommendations
            if (chapter7Ready && canRun) {
                recommendations.push('🎯 Chapter 7 domain walkthroughs ready for execution');
            }
            
            if (unifiedReady) {
                recommendations.push('🚀 Unified research framework (T1-T10 + Chapter 7) ready for comprehensive validation');
            }
            
            return { canRun, warnings, recommendations, chapter7Ready, unifiedReady };
            
        } catch (error) {
            warnings.push(`System validation error: ${error?.message}`);
            return { 
                canRun: false, 
                warnings, 
                recommendations,
                chapter7Ready: false,
                unifiedReady: false 
            };
        }
    }

    // ✅ NEW: Get comprehensive model summary for external use
    static getModelSummary(): any {
        return {
            t1t10Models: {
                Q1: testBedInfo.selectedModels?.Q1,
                Q4: testBedInfo.selectedModels?.Q4,
                Q8: testBedInfo.selectedModels?.Q8
            },
            chapter7Models: testBedInfo.selectedModels?.chapter7 || {},
            loadedModels: testBedInfo.loadedModels || {},
            systemCapabilities: BrowserModelLoader.validateSystemCapabilities(),
            availableModels: testBedInfo?.availableModels || []
        };
    }
// ✅ ADD: Easy access to enhanced engines for external systems
static getEnhancedEngine(tier: string, domain?: string): WalkthroughCompatibleEngine | null {
    try {
        const key = domain ? `${tier}-${domain}` : tier;
        
        // Check if we have a cached enhanced engine
        if ((window as any).enhancedEngineCache?.[key]) {
            return (window as any).enhancedEngineCache[key];
        }
        
        // If engine exists in loaded models, create enhanced wrapper
        const modelKey = domain ? `${tier}-${domain}` : tier;
        if (testBedInfo.loadedModels?.[modelKey]?.status === '✅ Loaded') {
            BrowserLogger.log(`🔧 Creating enhanced engine interface for ${key}`, 'ModelManager');
            
            // This would need the base engine - simplified for now
            return {
                chat: { completions: { create: async () => ({ choices: [], usage: { total_tokens: 0 } }) } },
                _mcdTier: tier,
                _walkthroughCompatible: !!domain,
                _domainOptimization: domain ? {
                    domain,
                    tier,
                    optimizationLevel: BrowserModelLoader.getDomainOptimizationScore(
                        testBedInfo.selectedModels?.[tier] || '', domain
                    ),
                    mcdCompliance: BrowserModelLoader.estimateMCDCompliance(
                        testBedInfo.selectedModels?.[tier] || '', domain
                    ),
                    expectedLatency: BrowserModelLoader.getExpectedLatency(tier, domain),
                    expectedTokens: BrowserModelLoader.getExpectedTokens(tier, domain),
                    fallbackStrategy: tier === 'Q1' ? 'graceful' : 'immediate'
                } : undefined
            } as WalkthroughCompatibleEngine;
        }
        
        return null;
        
    } catch (error) {
        BrowserLogger.log(`❌ Error getting enhanced engine for ${tier}${domain ? `-${domain}` : ''}: ${error?.message}`, 'ModelManager');
        return null;
    }
}

    // ✅ NEW: Clean up models and reset state
 static resetModelState() {
        try {
            if (testBedInfo.loadedModels) {
                testBedInfo.loadedModels = {};
            }
            
            if (testBedInfo.selectedModels) {
                testBedInfo.selectedModels = {};
            }
            
            BrowserLogger.log('🗑️ Model state reset - Ready for new model loading', 'Unified');
            BrowserLogger.updateTestBedInfo();
            
        } catch (error) {
            console.error('Error resetting model state:', error);
        }
    }

    // FIXED: Add comprehensive cleanup method
/**
 * Comprehensive cleanup with full resource management
 */
// ✅ ADD: Complete system readiness check
static async performSystemReadinessCheck(): Promise<{
    ready: boolean;
    t1t10Ready: boolean;
    chapter7Ready: boolean;
    modelStatus: { [key: string]: string };
    recommendations: string[];
}> {
    const modelStatus: { [key: string]: string } = {};
    const recommendations: string[] = [];
    
    try {
        BrowserLogger.log('🔍 Performing comprehensive system readiness check...', 'ModelManager');
        
        // Check T1-T10 readiness
        const tiers = ['Q1', 'Q4', 'Q8'];
        let t1t10Issues = 0;
        
        for (const tier of tiers) {
            const validation = BrowserModelLoader.validateModelAvailability(tier);
            if (validation.isAvailable) {
                modelStatus[tier] = '✅ Ready';
            } else {
                modelStatus[tier] = '❌ Not Available';
                t1t10Issues++;
                recommendations.push(`Load a model for ${tier} tier`);
            }
        }
        
        // Check Chapter 7 readiness
        const domains = ['appointment-booking', 'spatial-navigation', 'failure-diagnostics'];
        let chapter7Issues = 0;
        
        for (const domain of domains) {
            for (const tier of tiers) {
                const key = `${domain}-${tier}`;
                const validation = BrowserModelLoader.validateDomainModelAvailability(domain, tier);
                
                if (validation.isAvailable) {
                    modelStatus[key] = validation.domainOptimized ? '✅ Optimized' : '⚠️ Fallback';
                    if (!validation.domainOptimized) {
                        recommendations.push(`Consider domain-optimized models for ${domain}`);
                    }
                } else {
                    modelStatus[key] = '❌ Not Available';
                    chapter7Issues++;
                }
            }
        }
        
        const t1t10Ready = t1t10Issues === 0;
        const chapter7Ready = chapter7Issues < (domains.length * tiers.length * 0.5); // Allow 50% fallback
        const ready = t1t10Ready && chapter7Ready;
        
        // System-level recommendations
        if (!ready) {
            if (!navigator.gpu) {
                recommendations.push('Enable WebGPU in your browser for optimal performance');
            }
            
            const memoryUsage = BrowserModelLoader.getSystemHealth().modelManager.memoryUsage;
            if (memoryUsage.includes('MB') && parseInt(memoryUsage) > 1200) {
                recommendations.push('Consider refreshing the page to free up memory');
            }
        }
        
        BrowserLogger.log(`📊 System readiness: ${ready ? 'READY' : 'PARTIAL'} (T1-T10: ${t1t10Ready ? 'OK' : 'Issues'}, Chapter7: ${chapter7Ready ? 'OK' : 'Issues'})`, 'ModelManager');
        
        return {
            ready,
            t1t10Ready,
            chapter7Ready,
            modelStatus,
            recommendations
        };
        
    } catch (error) {
        BrowserLogger.log(`❌ System readiness check failed: ${error?.message}`, 'ModelManager');
        return {
            ready: false,
            t1t10Ready: false,
            chapter7Ready: false,
            modelStatus: { error: error?.message || 'Check failed' },
            recommendations: ['Refresh the page and try again']
        };
    }
}
// ✅ ADD: Track current engine for recovery
private static currentEngine: any = null;

// ✅ ADD: Update currentEngine when models load
static setCurrentEngine(engine: any, tier: string): void {
    this.currentEngine = engine;
    (window as any).currentMLCEngine = engine;
    console.log(`🔧 Current engine set for ${tier}`);
}

static getCurrentEngine(): any {
    return this.currentEngine || (window as any).currentMLCEngine;
}

// REPLACE the cleanup method:
static cleanup(): void {
    try {
        // Stop ultra-light memory manager
        UltraLightMemoryManager.stop();
        
        // Clear unified update manager
        UnifiedUpdateManager.clearQueue();
        
        // Mark any loading models as interrupted
        if (testBedInfo.loadedModels) {
            Object.values(testBedInfo.loadedModels).forEach(model => {
                if (model && model.status === '🔄 Loading') {
                    model.status = '⚠️ Interrupted';
                    model.error = 'System cleanup interrupted loading';
                }
            });
        }
        
        console.log('🧹 ModelManager cleanup completed');
        
    } catch (error) {
        console.error('Error during ModelManager cleanup:', error);
    }
}

// REPLACE the initialize method:
static initialize(): void {
    try {
        // Ensure updateTestControl is available
        if (typeof window !== 'undefined' && !window.updateTestControl) {
            window.updateTestControl = updateTestControl;
        }
        
        // Start ultra-light memory manager with execution awareness
        UltraLightMemoryManager.start();
        
        // Set up cleanup on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                BrowserModelLoader.cleanup();
            });
        }
        
        console.log('✅ ModelManager initialized with execution-aware resource management');
        
    } catch (error) {
        console.error('Error initializing ModelManager:', error);
        throw error; // Re-throw to see the actual error
    }
}
static getSystemHealth(): {
    modelManager: {
        healthy: boolean;
        loadedModels: number;
        updateQueueHealth: any;
        memoryUsage: string;
        issues: string[];
    };
    integration: {
        testControlReady: boolean;
        webllmReady: boolean;
        browserCompatible: boolean;
    };
    performance: {
        averageLoadTime: number;
        successRate: number;
        lastLoadTime?: number;
    };
} {
    const issues: string[] = [];
    
    try {
        // Model manager health
        const loadedModelCount = Object.keys(testBedInfo.loadedModels || {}).length;
        const updateQueueHealth = UnifiedUpdateManager.getQueueHealth();
        
        if (!updateQueueHealth.healthy) {
            issues.push('Update queue unhealthy');
        }
        
     
        // Memory usage
let memoryUsage = 'Unknown';
if (typeof performance !== 'undefined' && performance.memory) {
    const used = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
    memoryUsage = `${used}MB`;
    
    // ✅ ENHANCED: Q8-aware memory thresholds
    const currentTier = testControl?.currentTier;
    const threshold = BrowserModelLoader.MEMORY_THRESHOLDS[currentTier] || 1024;
    
    if (used > threshold) {
        issues.push(`High memory usage for ${currentTier}: ${used}MB > ${threshold}MB threshold`);
    }
}

        
        // Integration health
        const testControlReady = typeof window !== 'undefined' && 
            (window.testControl || window.updateTestControl);
        const webllmReady = typeof webllm !== 'undefined' && 
            webllm.prebuiltAppConfig?.model_list?.length > 0;
        const browserCompatible = !!navigator.gpu;
        
        if (!testControlReady) issues.push('Test control integration missing');
        if (!webllmReady) issues.push('WebLLM not ready');
        if (!browserCompatible) issues.push('WebGPU not supported');
        
        // Performance metrics
        const performanceMetrics = testBedInfo.performanceMetrics?.modelLoadingTime || {};
        const loadTimes = Object.values(performanceMetrics).map((m: any) => m.duration).filter(Boolean);
        const averageLoadTime = loadTimes.length > 0 ? 
            loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;
        const successRate = loadedModelCount > 0 ? 100 : 0; // Simplified calculation
        
        return {
            modelManager: {
                healthy: issues.length === 0,
                loadedModels: loadedModelCount,
                updateQueueHealth,
                memoryUsage,
                issues
            },
            integration: {
                testControlReady,
                webllmReady,
                browserCompatible
            },
            performance: {
                averageLoadTime: Math.round(averageLoadTime),
                successRate,
                lastLoadTime: loadTimes.length > 0 ? loadTimes[loadTimes.length - 1] : undefined
            }
        };
        
    } catch (error) {
        return {
            modelManager: {
                healthy: false,
                loadedModels: 0,
                updateQueueHealth: { healthy: false, error: 'Failed to check' },
                memoryUsage: 'Error',
                issues: [`Health check failed: ${error?.message}`]
            },
            integration: {
                testControlReady: false,
                webllmReady: false,
                browserCompatible: false
            },
            performance: {
                averageLoadTime: 0,
                successRate: 0
            }
        };
    }
}

}
  // ✅ ADD: Make BrowserModelLoader available as modelManager globally
if (typeof window !== 'undefined') {
    // Main model manager interface
    (window as any).modelManager = BrowserModelLoader;
    (window as any).globalModelManager = BrowserModelLoader;
    
    // Also expose as ModelManager for compatibility
    (window as any).ModelManager = BrowserModelLoader;
}


// Auto-initialize ModelManager when loaded
if (typeof window !== 'undefined') {
    const initializeModelManager = () => {
        try {
            // Ensure updateTestControl is available before initializing
            if (!window.updateTestControl) {
                window.updateTestControl = updateTestControl;
            }
            
            BrowserModelLoader.initialize();
        } catch (error) {
            console.error('Error initializing ModelManager:', error);
            // Don't retry on updateTestControl errors - they're not critical
            if (error.message && !error.message.includes('updateTestControl')) {
                setTimeout(() => {
                    try {
                        BrowserModelLoader.initialize();
                    } catch (retryError) {
                        console.error('ModelManager retry failed:', retryError);
                    }
                }, 5000);
            }
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModelManager);
    } else {
        initializeModelManager();
    }
}

// ✅ ADD: Global health check access
if (typeof window !== 'undefined') {
    (window as any).modelManagerHealth = () => {
        const health = BrowserModelLoader.getSystemHealth();
        console.group('🏥 Model Manager System Health');
        console.log('Overall Health:', health.modelManager.healthy ? '✅ Healthy' : '⚠️ Issues Detected');
        console.log('Loaded Models:', health.modelManager.loadedModels);
        console.log('Memory Usage:', health.modelManager.memoryUsage);
        console.log('Average Load Time:', `${health.performance.averageLoadTime}ms`);
        if (health.modelManager.issues.length > 0) {
            console.group('Issues:');
            health.modelManager.issues.forEach(issue => console.warn(`• ${issue}`));
            console.groupEnd();
        }
        console.groupEnd();
        return health;
    };
}
// ✅ ADD: Enhanced global walkthrough integration
if (typeof window !== 'undefined') {
    // Enhanced model manager interface
    (window as any).enhancedModelManager = {
        // System status
        getSystemHealth: BrowserModelLoader.getSystemHealth,
        checkReadiness: BrowserModelLoader.performSystemReadinessCheck,
        
        // Model management
        getEnhancedEngine: BrowserModelLoader.getEnhancedEngine,
        loadBatch: BrowserModelLoader.loadModelsForWalkthroughBatch,
        
        // Chapter 7 specific
        initializeWalkthrough: BrowserModelLoader.initializeWalkthroughModelSystem,
        getDomainOptimization: (domain: string, tier: string) => {
            const modelName = testBedInfo.selectedModels?.[tier] || '';
            return BrowserModelLoader.getDomainOptimizationScore(modelName, domain);
        },
        
        // System utilities
        resetState: BrowserModelLoader.resetModelState,
        cleanup: BrowserModelLoader.cleanup
    };
    
    // Quick status check function
    (window as any).checkWalkthroughReadiness = async () => {
        const readiness = await BrowserModelLoader.performSystemReadinessCheck();
        
        console.group('🎯 Walkthrough System Readiness');
        console.log('Overall Ready:', readiness.ready ? '✅ YES' : '⚠️ PARTIAL');
        console.log('T1-T10 Framework:', readiness.t1t10Ready ? '✅ Ready' : '❌ Issues');
        console.log('Chapter 7 Framework:', readiness.chapter7Ready ? '✅ Ready' : '❌ Issues');
        
        if (readiness.recommendations.length > 0) {
            console.group('Recommendations:');
            readiness.recommendations.forEach(rec => console.log(`• ${rec}`));
            console.groupEnd();
        }
        
        console.groupEnd();
        return readiness;
    };
}
// ✅ ENHANCED: NDArray-aware global functions
if (typeof window !== 'undefined') {
    // Core model manager with NDArray integration
    (window as any).modelManagerWithNDArray = {
        ...BrowserModelLoader,
        validateNDArrays: BrowserModelLoader.validateNDArrayDisposal,
        forceRecreateWithValidation: BrowserModelLoader.forceRecreateEngineWithValidation,
        
        // Quick diagnostic function
        getFullSystemStatus: () => {
            const health = BrowserModelLoader.getSystemHealth();
            const ndArrayHealth = (window as any).NDArrayMonitor?.getHealthReport() || 
                                  { activeArrays: 'Monitor not available' };
            
            return {
                ...health,
                ndArrayHealth
            };
        }
    };
    
    // Quick debug function
    (window as any).debugModelManager = () => {
        console.group('🔧 Model Manager Debug Status');
        
        const health = BrowserModelLoader.getSystemHealth();
        console.log('Model Manager Health:', health.modelManager.healthy ? '✅' : '❌');
        console.log('Memory Usage:', health.modelManager.memoryUsage);
        console.log('Loaded Models:', health.modelManager.loadedModels);
        
        const ndArrayStatus = (window as any).NDArrayMonitor?.getHealthReport();
        if (ndArrayStatus) {
            console.log('NDArray Status:', ndArrayStatus.activeArrays === 0 ? '✅ Clean' : 
                       `⚠️ ${ndArrayStatus.activeArrays} active`);
        }
        
        console.groupEnd();
        return { health, ndArrayStatus };
    };
}
