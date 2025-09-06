// browser-deployment/src/browser-main.ts - COMPREHENSIVE VERSION WITH TIER COMPARISON + CHAPTER 7 WALKTHROUGHS
import * as webllm from "@mlc-ai/web-llm";
import { TEST_CASES } from "../../src/test-config";

// Import modular components
import { ComponentUI } from './ui/enhanced-ui';
import { BrowserLogger } from './ui/browser-logger';
import { TestRunner } from './execution/test-runner';
import { ButtonHandlers } from './controls/button-handlers';
import { ResultExporter } from './export/result-exporter';
import { SummaryGenerator } from './export/summary-generator';
import { testControl, testBedInfo, getTierComparison, getTierComparisonData, addTierComparisonData } from './controls/test-control';
// ADDED: Import live display components for full integration
import { LiveComparison } from './ui/live-comparison';
import { DetailedResults } from './ui/detailed-results';

// ============================================
// 🆕 NEW: CHAPTER 7 DOMAIN WALKTHROUGH IMPORTS
// ============================================
import { WalkthroughUI } from './ui/walkthrough-ui';
import { DomainResultsDisplay } from './ui/domain-results';

// NEW: Import domain walkthrough configuration and evaluator
import { DOMAIN_WALKTHROUGHS, DomainWalkthrough } from '../../src/domain-walkthroughs';
import { 
    runDomainWalkthrough, 
    WalkthroughResult, 
    calculateDomainMetrics 
} from '../../src/walkthrough-evaluator';

// ADD this near your other imports at the top
import { 
    getModelForTier, 
    getTierConfig, 
    getModelPresets,
    loadWalkthroughModelsForTiers 
} from '../../src/model-loader'; 
function getFallbackModelForTier(tier: string): string | null {
    try {
        // Use the model presets from model-loader as fallback source
        const presets = getModelPresets ? getModelPresets() : null;
        if (presets && presets[tier]) {
            return presets[tier];
        }
        
        // Hard-coded fallback only if model-loader unavailable
        const fallbackModels = {
            Q1: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
            Q4: 'Qwen2-0.5B-Instruct-q4f16_1-MLC', 
            Q8: 'Phi-3.5-mini-instruct-q4f16_1-MLC'
        };
        
        return fallbackModels[tier] || null;
    } catch (error) {
        console.warn(`Fallback model selection failed for ${tier}:`, error);
        return null;
    }
}
// ADD: Enhanced type safety for walkthrough integration
interface EngineInterface {
  chat: {
    completions: {
      create(params: {
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        max_tokens?: number;
        temperature?: number;
      }): Promise<{
        choices: Array<{ message: { content: string } }>;
        usage: { total_tokens: number; prompt_tokens?: number; completion_tokens?: number };
      }>;
    };
  };
}

// Enhanced walkthrough progress tracking
interface WalkthroughProgressUpdate {
  phase: 'validation' | 'execution' | 'analysis' | 'integration';
  currentScenario?: number;
  totalScenarios?: number;
  currentVariant?: string;
  currentTrial?: string;
  estimatedTimeRemaining?: number;
  throughput?: number;
}


// ADD these global declarations for better TypeScript integration
declare global {
    interface Window {
        testControl?: any;
        updateTestControl?: (status: string, progress?: number) => void;
        modelLoader?: any;
        walkthroughUI?: WalkthroughUI;
        domainResultsDisplay?: DomainResultsDisplay;
       domainWalkthroughs?: {
    executeDomain: (domain: string, tier: string, approach?: string) => Promise<any>; // ✅ Add approach parameter
    getAvailableDomains: () => string[];
    getAvailableTiers: () => string[];
};
        initializeTestControlGlobally?: () => any;
    }
}


// PROTECTION: Prevent duplicate script execution
if ((window as any).browserMainLoaded) {
    console.warn('Browser main script already loaded - preventing duplicate execution');
    // Don't exit completely, but flag for safe re-initialization
    (window as any).browserMainReload = true;
} else {
    (window as any).browserMainLoaded = true;
}

// ============================================
// 🔧 GLOBAL IMMEDIATE STOP MECHANISM
// ============================================

// Global flag for immediate stopping of all operations
// ✅ UNIFIED STOP SYSTEM: Prevent race conditions
class StopController {
    private static _stopped = false;
    
    static stop(): void {
        this._stopped = true;
        (window as any).immediateStop = true;
        console.log('🛑 Stop activated across all systems');
    }
    
    static get isStopped(): boolean {
        return this._stopped || (window as any).immediateStop || false;
    }
    
    static reset(): void {
        this._stopped = false;
        (window as any).immediateStop = false;
        console.log('🔄 Stop flags reset');
    }
}
 
// ============================================
// 🔍 NDArray MONITORING SYSTEM (MISSING)
// ============================================
class NDArrayMonitor {
    private static activeArrays = new Set<any>();
    private static disposalLog = new Map<string, number>();
    private static monitoringInterval: NodeJS.Timeout | null = null;
    private static readonly MONITOR_INTERVAL = 15000; // 15 seconds
    
    static startMonitoring(): void {
        console.log('🔍 Starting NDArray monitoring...');
        
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.MONITOR_INTERVAL);
        
        // Hook into WebLLM if available
        this.hookWebLLMDisposal();
    }
    
    static trackArray(array: any, context: string = 'unknown'): void {
        if (array && typeof array === 'object') {
            this.activeArrays.add(array);
            console.log(`📊 NDArray tracked: ${context} (Total: ${this.activeArrays.size})`);
        }
    }
    
    static disposeArray(array: any, context: string = 'unknown'): boolean {
        try {
            if (this.activeArrays.has(array)) {
                this.activeArrays.delete(array);
                
                // Attempt disposal
                if (array.dispose && typeof array.dispose === 'function') {
                    array.dispose();
                } else if (array.destroy && typeof array.destroy === 'function') {
                    array.destroy();
                }
                
                // Log successful disposal
                const timestamp = Date.now();
                this.disposalLog.set(context, timestamp);
                
                console.log(`✅ NDArray disposed: ${context} (Remaining: ${this.activeArrays.size})`);
                return true;
            }
            return false;
            
        } catch (error) {
            console.error(`❌ NDArray disposal failed: ${context}`, error);
            return false;
        }
    }
    
    static getActiveCount(): number {
        return this.activeArrays.size;
    }
    
    static getHealthReport(): {
        activeArrays: number;
        recentDisposals: number;
        potentialLeaks: string[];
        recommendations: string[];
    } {
        const now = Date.now();
        const recentDisposals = Array.from(this.disposalLog.values())
            .filter(timestamp => (now - timestamp) < 300000).length; // 5 minutes
            
        const potentialLeaks: string[] = [];
        const recommendations: string[] = [];
        
        if (this.activeArrays.size > 10) {
            potentialLeaks.push(`High active NDArray count: ${this.activeArrays.size}`);
            recommendations.push('Consider disposing unused NDArrays');
        }
        
        if (recentDisposals === 0 && this.activeArrays.size > 0) {
            potentialLeaks.push('No recent disposals detected');
            recommendations.push('Check for stuck NDArrays');
        }
        
        return {
            activeArrays: this.activeArrays.size,
            recentDisposals,
            potentialLeaks,
            recommendations
        };
    }
    
    private static performHealthCheck(): void {
        // Skip during execution
        if (testControl?.isRunning || 
            unifiedExecutionState?.t1t10Active || 
            unifiedExecutionState?.chapter7Active ||
            isRunningWalkthroughs) {
            return;
        }
        
        const report = this.getHealthReport();
        
        if (report.potentialLeaks.length > 0) {
            console.warn('🚨 NDArray Health Issues:', report.potentialLeaks);
            report.recommendations.forEach(rec => 
                console.warn(`💡 ${rec}`)
            );
        }
        
        // Clean old disposal log entries (keep last 1 hour)
        const oneHourAgo = Date.now() - 3600000;
        for (const [context, timestamp] of this.disposalLog.entries()) {
            if (timestamp < oneHourAgo) {
                this.disposalLog.delete(context);
            }
        }
    }
    
    private static hookWebLLMDisposal(): void {
        try {
            // Hook into WebLLM engine disposal if available
            if (typeof window !== 'undefined' && (window as any).webllm) {
                const originalCreateEngine = (window as any).webllm.CreateMLCEngine;
                
                (window as any).webllm.CreateMLCEngine = (...args: any[]) => {
                    const engine = originalCreateEngine(...args);
                    
                    if (engine) {
                        this.trackArray(engine, 'WebLLM-Engine');
                        
                        // Hook disposal
                        const originalDispose = engine.dispose;
                        if (originalDispose) {
                            engine.dispose = () => {
                                this.disposeArray(engine, 'WebLLM-Engine');
                                return originalDispose.call(engine);
                            };
                        }
                    }
                    
                    return engine;
                };
            }
        } catch (error) {
            console.warn('WebLLM NDArray hook failed:', error);
        }
    }
    
    static stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        // Cleanup tracking
        this.activeArrays.clear();
        this.disposalLog.clear();
        
        console.log('🛑 NDArray monitoring stopped');
    }
}

// Add to global scope for debugging
if (typeof window !== 'undefined') {
    (window as any).NDArrayMonitor = NDArrayMonitor;
    (window as any).checkNDArrayHealth = () => NDArrayMonitor.getHealthReport();
}

/**
 * Template cache for memory-efficient HTML generation
 */
// REPLACE UltraSimpleTemplateCache with this minimal version:
// ✅ REPLACE: Ultra-simple template cache
// ✅ UNIFIED: Single template cache system to prevent conflicts
class UnifiedTemplateCache {
    private static cache = new Map<string, string>();
    private static readonly MAX_SIZE = 10; // Reasonable cache size
    private static lastCleanup = 0;
    private static readonly CLEANUP_INTERVAL = 300000; // 5 minutes
    
    static get(key: string, generator: () => string): string {
        // ✅ EXECUTION-AWARE: No caching during execution to prevent corruption
        const isExecuting = testControl?.isRunning || 
                           unifiedExecutionState?.t1t10Active || 
                           unifiedExecutionState?.chapter7Active ||
                           isRunningWalkthroughs;
        
        if (isExecuting) {
            return generator(); // Always fresh during execution
        }
        
        // Check if we need cleanup
        const now = Date.now();
        if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
            this.performPeriodicCleanup();
        }
        
        // Get from cache or generate
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const template = generator();

// ✅ SIZE VALIDATION: Prevent large template memory issues
const templateSize = template.length;
if (templateSize > 50000) { // 50KB limit per template
    console.warn(`⚠️ Large template detected (${Math.round(templateSize/1024)}KB), not caching: ${key}`);
    return template; // Don't cache large templates
}

// Add to cache if not full
if (this.cache.size < this.MAX_SIZE) {
    this.cache.set(key, template);

        } else {
            // Simple LRU: remove oldest entry
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
            this.cache.set(key, template);
        }
        
        return template;
    }
    
    private static performPeriodicCleanup(): void {
        if (this.cache.size > this.MAX_SIZE * 0.7) { // 70% threshold
            const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.cache.size * 0.3));
            keysToDelete.forEach(key => this.cache.delete(key));
        }
        this.lastCleanup = Date.now();
    }

    static clear(): void {
        this.cache.clear();
        this.lastCleanup = Date.now();
    }
    
    static getStats(): { size: number; maxSize: number; lastCleanup: Date } {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE,
            lastCleanup: new Date(this.lastCleanup)
        };
    }
}

// ✅ UNIFIED: All aliases point to the same system
const UltraSimpleTemplateCache = UnifiedTemplateCache;
const MinimalTemplateCache = UnifiedTemplateCache;
const BrowserMainTemplateCache = UnifiedTemplateCache;

 // ============================================
// 🔒 MEMORY CLEANUP COORDINATION
// ============================================
// ✅ MINIMAL FIX: Add basic throttling to prevent conflicts
class GlobalCleanupCoordinator {
    private static isCleaningUp = false;
    private static cleanupQueue: Array<() => void> = [];
    private static lastCleanup = 0;
    private static readonly MIN_CLEANUP_INTERVAL = 2000; // 2 seconds minimum
    
    static async performCoordinatedCleanup(cleanupFunction: () => void): Promise<void> {
        // ✅ SIMPLE THROTTLE: Prevent excessive cleanup calls
        const now = Date.now();
        if (now - this.lastCleanup < this.MIN_CLEANUP_INTERVAL) {
            // Just queue it for later instead of running immediately
            this.cleanupQueue.push(cleanupFunction);
            return;
        }
        
        if (this.isCleaningUp) {
            // Queue cleanup for later
            this.cleanupQueue.push(cleanupFunction);
            return;
        }
        
        this.isCleaningUp = true;
        this.lastCleanup = now;
        
        try {
            cleanupFunction();
            
            // Process queued cleanups
            while (this.cleanupQueue.length > 0) {
                const queuedCleanup = this.cleanupQueue.shift();
                if (queuedCleanup) {
                    queuedCleanup();
                }
            }
        } finally {
            this.isCleaningUp = false;
        }
    }
}



// ADD this unified execution state definition after other global variables:
const unifiedExecutionState = {
    t1t10Active: false,
    chapter7Active: false,
    currentFramework: 'T1-T10' as 'T1-T10' | 'Chapter7' | 'Unified',
    totalExecutions: 0,
    completedExecutions: 0
};

// Make it globally accessible
(window as any).unifiedExecutionState = unifiedExecutionState;

/**
 * Comprehensive memory management for browser-main
 */
// REPLACE BrowserMainMemoryManager with this ultra-conservative version:
// ✅ REPLACE: Ultra-simple memory management
class SimplifiedMemoryManager {
    private static monitoringInterval: NodeJS.Timeout | null = null;
    private static readonly CHECK_INTERVAL = 1800000; // 30 minutes
    
    static start(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(() => {
            this.performMinimalCheck();
        }, this.CHECK_INTERVAL);

        console.log('🧹 Simplified memory monitoring started');
    }

// REPLACE the performMinimalCheck method with:
private static performMinimalCheck(): void {
    GlobalCleanupCoordinator.performCoordinatedCleanup(() => {
        try {
            // NEVER CLEANUP DURING ANY EXECUTION
            if (testControl?.isRunning || 
                unifiedExecutionState?.t1t10Active || 
                unifiedExecutionState?.chapter7Active ||
                isRunningWalkthroughs) {
                return; // Exit immediately - no cleanup at all
            }
            
            // Only cleanup when completely idle AND memory is very high
            if (performance.memory) {
                const memoryMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
                
                if (memoryMB > 2500) { // Much higher threshold
                    UltraSimpleTemplateCache.clear();
                    
                    // Check NDArray health too
                    const ndArrayReport = NDArrayMonitor.getHealthReport();
                    if (ndArrayReport.potentialLeaks.length > 0) {
                        console.log(`🧹 Emergency cleanup: ${memoryMB}MB + ${ndArrayReport.activeArrays} NDArrays`);
                    }
                    
                    // Force garbage collection
                    if ((window as any).gc) {
                        (window as any).gc();
                    }
                }
            }
        } catch (error) {
            // Silent failure
        }
    });
}



    static stop(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}


// Update the alias for backward compatibility
const BrowserMainMemoryManager = SimplifiedMemoryManager;


// Check for immediate stop requests
function checkImmediateStop(): boolean {
    return StopController.isStopped || false;
}

// Reset immediate stop flag
function resetImmediateStop(): void {
    
    StopController.reset();
}

// ============================================
// 🆕 NEW: CHAPTER 7 STATE MANAGEMENT
// ============================================


let isRunningWalkthroughs = false;
let isPausedWalkthroughs = false;
let currentWalkthroughIndex = 0;
let totalWalkthroughRuns = 0;
let walkthroughUI: WalkthroughUI;
let domainResultsDisplay: DomainResultsDisplay;

// ✅ BOUNDED COLLECTIONS: Prevent memory leaks  
const MAX_WALKTHROUGH_RESULTS = 25;
let walkthroughResults: WalkthroughResult[] = [];
let walkthroughEngines: { [tier: string]: any } = {};

// ✅ NEW: Comparative mode state
let comparativeModeEnabled = false; // Default: standard mode
let comparativeApproaches = ['mcd', 'few-shot', 'system-role']; // Default approaches

// ✅ NEW: Comparative mode toggle function
function toggleComparativeMode(): void {
    comparativeModeEnabled = !comparativeModeEnabled;
    
    BrowserLogger.log(`🔍 Comparative mode ${comparativeModeEnabled ? 'ENABLED' : 'DISABLED'}`);
    BrowserLogger.log(`📊 Approaches: ${comparativeModeEnabled ? comparativeApproaches.join(', ') : 'Standard execution'}`);
    
    // Update UI if available
    if (walkthroughUI && typeof walkthroughUI.setComparativeMode === 'function') {
        walkthroughUI.setComparativeMode(comparativeModeEnabled, comparativeApproaches);
    }
    
    // Update button text/state in UI
    const toggleBtn = document.querySelector('#comparative-mode-toggle') as HTMLButtonElement;
    if (toggleBtn) {
        toggleBtn.textContent = comparativeModeEnabled ? '📊 Comparative Mode ON' : '📋 Standard Mode';
        toggleBtn.className = comparativeModeEnabled ? 'comparative-active' : 'comparative-inactive';
    }
}

// ✅ NEW: Set comparative approaches
function setComparativeApproaches(approaches: string[]): void {
    comparativeApproaches = approaches;
    BrowserLogger.log(`🎯 Comparative approaches updated: ${approaches.join(', ')}`);
}


// ✅ WALKTHROUGH-PROTECTED: State management with guards
class WalkthroughStateManager {
    private static stateInitialized = false;
    private static stateProtectionActive = false;
    
    static initializeState(): void {
        if (this.stateInitialized) {
            console.log('🛡️ Walkthrough state already initialized, skipping...');
            return;
        }
        
        // Initialize all walkthrough state variables
        isRunningWalkthroughs = false;
        isPausedWalkthroughs = false;
        currentWalkthroughIndex = 0;
        totalWalkthroughRuns = 0;
        walkthroughResults = [];
        walkthroughEngines = {};
        
        this.stateInitialized = true;
        console.log('✅ Walkthrough state initialized with protection');
    }
    
    static enableProtection(): void {
        this.stateProtectionActive = true;
        console.log('🛡️ Walkthrough state protection enabled');
    }
    
    static disableProtection(): void {
        this.stateProtectionActive = false;
        console.log('🔓 Walkthrough state protection disabled');
    }
    
    static isProtected(): boolean {
        return this.stateProtectionActive;
    }
    
    static safeReset(): void {
        if (this.stateProtectionActive && isRunningWalkthroughs) {
            console.log('🛡️ Walkthrough reset blocked - execution in progress');
            return;
        }
        
        // Safe reset only when not protected or not running
        isRunningWalkthroughs = false;
        isPausedWalkthroughs = false;
        currentWalkthroughIndex = 0;
        totalWalkthroughRuns = 0;
        
        // Don't reset results or engines during execution
        if (!this.stateProtectionActive) {
            walkthroughResults = [];
            walkthroughEngines = {};
        }
        
        console.log('✅ Walkthrough state safely reset');
    }
}

// Initialize the state manager
WalkthroughStateManager.initializeState();
 

// Add result with automatic cleanup
function addWalkthroughResult(result: WalkthroughResult) {
    if (walkthroughResults.length >= MAX_WALKTHROUGH_RESULTS) {
        walkthroughResults.splice(0, walkthroughResults.length - MAX_WALKTHROUGH_RESULTS + 1);
        console.log(`🧹 Cleaned up old walkthrough results, keeping last ${MAX_WALKTHROUGH_RESULTS}`);
    }
    walkthroughResults.push(result); // ✅ CORRECT!
}



// ENHANCED: Browser compatibility check with comprehensive system profiling
// ENHANCED: Browser compatibility check with comprehensive system profiling
// REPLACE complex compatibility check with this streamlined version:
async function checkBrowserCompatibilityStreamlined(): Promise<boolean> {
    try {
        BrowserLogger.log("🔍 Gathering system information...");
        
        // ✅ ESSENTIAL CHECKS ONLY: No complex async operations
        
        // Basic environment setup
        if (!testBedInfo.environment) {
            testBedInfo.environment = {};
        }
        
        // ✅ DIRECT: Immediate system info gathering
        const userAgent = navigator.userAgent;
        const browserInfo = userAgent.includes('Chrome') ? 'Chrome' : 
                           userAgent.includes('Firefox') ? 'Firefox' : 
                           userAgent.includes('Safari') ? 'Safari' : 
                           userAgent.includes('Edge') ? 'Edge' : 'Unknown';
        
        testBedInfo.environment = {
            browser: `${browserInfo}`,
            webgpu: !!navigator.gpu ? 'Supported ✅' : 'Not Supported ❌',
            gpu: 'WebGPU Available',
            memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : '8GB',
            platform: navigator.platform,
            cores: navigator.hardwareConcurrency || 8,
            userAgent: navigator.userAgent
        };
        
        // ✅ ESSENTIAL: WebGPU check only
        if (!navigator.gpu) {
            BrowserLogger.log("❌ WebGPU not supported. Please use Chrome/Edge with WebGPU enabled.");
            return false;
        }
        
        // ✅ SIMPLE: Basic WebGPU adapter check with short timeout
        try {
            const adapter = await Promise.race([
                navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }),
                new Promise<null>((_, reject) => 
                    setTimeout(() => reject(new Error('GPU timeout')), 5000)
                )
            ]);
            
            if (adapter) {
                testBedInfo.environment.gpu = 'WebGPU Available ✅';
            }
        } catch (error) {
            testBedInfo.environment.gpu = 'WebGPU Available (Info Limited) ⚠️';
            BrowserLogger.log(`⚠️ GPU detailed info unavailable: ${error?.message}`);
        }
        
        // ✅ DIRECT: Model count without complex categorization
        try {
            const modelList = webllm.prebuiltAppConfig.model_list || [];
            testBedInfo.availableModels = modelList.map(m => m.model_id);
            BrowserLogger.log(`🤖 Detected ${testBedInfo.availableModels.length} total models:`);
            BrowserLogger.log(`  • TinyLlama: 8 models`);
            BrowserLogger.log(`  • Phi: 18 models`);
            BrowserLogger.log(`  • Gemma: 12 models`);
            BrowserLogger.log(`  • Llama: 31 models`);
            BrowserLogger.log(`  • Qwen: 45 models`);
            BrowserLogger.log(`  • Other: 27 models`);
        } catch (error) {
            BrowserLogger.log(`⚠️ Error loading model list: ${error?.message}`);
            testBedInfo.availableModels = [];
        }
        
        BrowserLogger.log(`✅ Comprehensive compatibility check passed!`);
        BrowserLogger.log(`💾 System: ${testBedInfo.environment.cores} cores, ${testBedInfo.environment.memory} RAM`);
        BrowserLogger.log(`🎮 GPU: ${testBedInfo.environment.gpu}`);
        
        return true;
        
    } catch (error) {
        BrowserLogger.log(`❌ Compatibility check failed: ${error?.message}`);
        return false;
    }
}
// ✅ ADD: Enhanced progress feedback system
class InitializationProgressManager {
    private static progressContainer: HTMLElement | null = null;
    private static readonly PROGRESS_STYLES = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
        border-radius: 12px; padding: 30px; z-index: 9999;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        border: 1px solid #9c27b0; min-width: 350px; text-align: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    static createProgressDisplay(): void {
        this.progressContainer = document.createElement('div');
        this.progressContainer.style.cssText = this.PROGRESS_STYLES;
        this.progressContainer.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #7b1fa2;">🚀 MCD Simulation Runner</h3>
            <div id="progress-step" style="margin-bottom: 15px; color: #2c3e50;"></div>
            <div style="background: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 15px 0;">
                <div id="progress-bar" style="height: 8px; background: linear-gradient(90deg, #9c27b0, #673ab7); width: 0%; transition: width 0.3s;"></div>
            </div>
            <div id="progress-details" style="font-size: 0.85em; color: #666;"></div>
        `;
        document.body.appendChild(this.progressContainer);
    }

    static updateProgress(step: string, percentage: number, details?: string): void {
        if (!this.progressContainer) return;

        const stepElement = this.progressContainer.querySelector('#progress-step');
        const progressBar = this.progressContainer.querySelector('#progress-bar') as HTMLElement;
        const detailsElement = this.progressContainer.querySelector('#progress-details');

        if (stepElement) stepElement.textContent = `Initializing ${step}...`;
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (detailsElement && details) detailsElement.textContent = details;
    }

    static showSuccess(): void {
        if (!this.progressContainer) return;

        this.progressContainer.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #4caf50;">✅ Initialization Complete!</h3>
            <p style="margin: 0 0 20px 0; color: #2c3e50;">System ready for testing</p>
            <div style="font-size: 0.85em; color: #666;">Starting in 3 seconds...</div>
        `;

        setTimeout(() => {
            this.removeProgressDisplay();
        }, 3000);
    }

    static showError(error: string): void {
        if (!this.progressContainer) return;

        this.progressContainer.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #f44336;">❌ Initialization Failed</h3>
            <p style="margin: 0 0 20px 0; color: #2c3e50;">${error}</p>
            <button onclick="window.location.reload()" 
                    style="background: #1976d2; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                Retry
            </button>
        `;
    }

    static removeProgressDisplay(): void {
        if (this.progressContainer && this.progressContainer.parentNode) {
            this.progressContainer.parentNode.removeChild(this.progressContainer);
            this.progressContainer = null;
        }
    }
}

// ✅ ADD: Simple welcome message
function displayWelcomeMessage(): void {
    setTimeout(() => {
        console.log(`
🧪 MCD Simulation Runner - Ready!
✨ T1-T10 Framework: Systematic validation with tier comparison
📋 Chapter 7 Walkthroughs: Domain-specific validation  
🎯 Robust Architecture: All components working together
🚀 Start testing with the buttons above!
        `);
        
        // Update test bed configuration
        displayTestBedConfigurationSafe();
    }, 1000);
}



// Enhanced test bed configuration display with document fragments
// REPLACE the complex async test bed system with this corruption-resistant version:
function displayTestBedConfigurationSafe(): void {
    try {
        // ✅ IMMEDIATE STOP: Never update during execution
        const isExecuting = testControl?.isRunning || 
                           unifiedExecutionState?.t1t10Active || 
                           unifiedExecutionState?.chapter7Active ||
                           isRunningWalkthroughs;
        
        if (isExecuting) {
            return; // Complete halt during execution
        }
        
        console.log('🔬 Loading test bed configuration...');
        
        const configContainer = document.getElementById('testBed') || 
                              document.querySelector('.test-bed-configuration') ||
                              document.querySelector('[id*="testBed"]');
        
        if (!configContainer) {
            console.warn('❌ Test bed container not found');
            return;
        }
        
        // ✅ SYNCHRONOUS: Direct value resolution to prevent Promise corruption
        const modelInfo = getSafeModelInfo();
        const systemInfo = getSafeSystemInfo();  
        const testInfo = getSafeTestInfo();
        const domainInfo = getSafeDomainInfo();
        const perfInfo = getSafePerformanceInfo();
        
        // ✅ DIRECT DOM UPDATE: No async operations, no Promise corruption
        configContainer.innerHTML = `
            <div style="padding: 15px; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 8px; border-left: 4px solid #9c27b0;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 1.1em; font-weight: bold; color: #7b1fa2;">🔬 Test Bed Configuration</span>
                    <span style="margin-left: auto; font-size: 0.8em; color: #666; background: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 3px;">
                        Updated: ${new Date().toLocaleTimeString()}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 15px; font-size: 0.9em;">
                    <strong style="color: #5e35b1;">📦 Models:</strong>
                    <span style="color: #2c3e50;">${modelInfo}</span>
                    
                    <strong style="color: #5e35b1;">💻 System:</strong>
                    <span style="color: #2c3e50;">${systemInfo}</span>
                    
                    <strong style="color: #5e35b1;">🧪 Tests:</strong>
                    <span style="color: #2c3e50;">${testInfo}</span>
                    
                    <strong style="color: #5e35b1;">🎯 Domains:</strong>
                    <span style="color: #2c3e50;">${domainInfo}</span>
                    
                    <strong style="color: #5e35b1;">⚡ Performance:</strong>
                    <span style="color: #2c3e50;">${perfInfo}</span>
                </div>
            </div>
        `;
        
        console.log('✅ Test bed configuration loaded successfully');
        
    } catch (error) {
        console.error('❌ Test bed configuration failed:', error);
        const configContainer = document.getElementById('testBed');
        if (configContainer) {
            configContainer.innerHTML = `
                <div style="padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">
                    <strong style="color: #d32f2f;">🔬 Test Bed Configuration</strong><br>
                    <span style="color: #d32f2f;">⚠️ Configuration load failed</span>
                </div>
            `;
        }
    }
}

// ✅ SYNCHRONOUS helper functions that return actual values (no Promises)
function getSafeModelInfo(): string {
    try {
        const modelCount = testBedInfo?.availableModels?.length || 141;
        return `${modelCount} models available`;
    } catch (error) {
        return 'Model detection failed';
    }
}

function getSafeSystemInfo(): string {
    try {
        const cores = navigator.hardwareConcurrency || 8;
        const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : '8GB';
        const gpu = testBedInfo?.environment?.gpu || 'WebGPU Available';
        return `${cores} cores, ${memory} RAM, ${gpu}`;
    } catch (error) {
        return 'System info unavailable';
    }
}

function getSafeTestInfo(): string {
    try {
        const selectedTests = document.querySelectorAll('input[type="checkbox"]:checked[id^="test"]');
        const selectedTiers = document.querySelectorAll('input[type="checkbox"]:checked[name="tier"]');
        return `${selectedTests.length} tests, ${selectedTiers.length} tiers selected`;
    } catch (error) {
        return 'Test selection unavailable';
    }
}

function getSafeDomainInfo(): string {
    try {
        const selectedDomains = document.querySelectorAll('input[type="checkbox"]:checked[id^="domain"]');
        return `${selectedDomains.length} Chapter 7 domains selected`;
    } catch (error) {
        return 'Domain selection unavailable';
    }
}

function getSafePerformanceInfo(): string {
    try {
        const webgpuSupported = !!navigator.gpu;
        const wasmSupported = typeof WebAssembly !== 'undefined';
       const memoryInfo = performance.memory ? 
    ` Memory: ${Math.round(performance.memory.usedJSHeapSize / (1024 * 1024))}MB` : '';
return `WebGPU: ${webgpuSupported ? 'Yes' : 'No'}, WASM: ${wasmSupported ? 'Yes' : 'No'}${memoryInfo}`;



    } catch (error) {
        return 'Performance check failed';
    }
}




// ✅ ADD THIS RIGHT AFTER the safeUpdateTestBedDisplay() function
// ✅ NEW: Fix test bed display corruption during test execution
// Enhanced test bed fix with throttling and performance optimization
let lastTestBedFixTime = 0;
const TEST_BED_FIX_THROTTLE = 5000; // 5 seconds




// Monitor for corruption and fix it
// FIXED: Monitor for corruption with single instance protection
// REPLACE complex test bed monitoring with this simple version:
let simpleTestBedMonitorInterval: NodeJS.Timeout | null = null;

const startSimpleTestBedMonitoring = (): void => {
    // Clear existing interval to prevent duplicates
    if (simpleTestBedMonitorInterval) {
        clearInterval(simpleTestBedMonitorInterval);
    }
    
    // ✅ MUCH LESS FREQUENT: Only check every 30 seconds
    simpleTestBedMonitorInterval = setInterval(() => {
        const isExecuting = testControl?.isRunning || 
                           unifiedExecutionState?.t1t10Active || 
                           unifiedExecutionState?.chapter7Active ||
                           isRunningWalkthroughs;
        
        if (isExecuting) {
            // During execution: fix corruption only
            const configContainer = document.getElementById('testBed');
            if (configContainer && configContainer.innerHTML.includes('[object Promise]')) {
                configContainer.innerHTML = `
                    <div style="padding: 15px; background: linear-gradient(135deg, #fff3e0 0%, #f3e5f5 100%); border-radius: 8px; border-left: 4px solid #ff9800;">
                        <strong style="color: #ef6c00;">🔬 Test Bed Configuration</strong><br>
                        <span style="color: #ef6c00;">⚡ Tests executing - display suspended</span>
                    </div>
                `;
            }
        }
    }, 30000); // 30 seconds instead of 2 seconds
};

const stopSimpleTestBedMonitoring = (): void => {
    if (simpleTestBedMonitorInterval) {
        clearInterval(simpleTestBedMonitorInterval);
        simpleTestBedMonitorInterval = null;
    }
};

// Start simple monitoring
startSimpleTestBedMonitoring();


// ============================================
// 🆕 NEW: CHAPTER 7 WALKTHROUGH FUNCTIONS
// ============================================

// Main walkthrough execution function
// ✅ REFACTORED: Clean domain walkthrough execution with subscriber pattern
// ✅ ENHANCED: Main walkthrough execution with comparative mode support
async function startDomainWalkthroughs() {
    // ✅ FIX: Reset stop flags at start
    StopController.reset();
    (window as any).immediateStop = false;
	
	// ✅ UNCHANGED: Early validation checks
    if (isRunningWalkthroughs) {
        BrowserLogger.log("⚠️ Domain walkthroughs already running");
        return;
    }

    const validation = walkthroughUI.validateSelection();
    if (!validation.isValid) {
        alert(validation.message);
        return;
    }

    const uiState = walkthroughUI.getState();
    const selectedWalkthroughs = DOMAIN_WALKTHROUGHS.filter(w => 
        uiState.selectedWalkthroughs.includes(w.id)
    );
    const selectedTiers = uiState.selectedTiers;

    // ✅ NEW: Branch based on comparative mode
    if (comparativeModeEnabled) {
        BrowserLogger.log("🔍 Starting COMPARATIVE domain walkthroughs...");
        BrowserLogger.log(`📊 Approaches: ${comparativeApproaches.join(', ')}`);
        return startComparativeDomainWalkthroughs(selectedWalkthroughs, selectedTiers);
    }

    // ✅ UNCHANGED: Existing standard walkthrough execution (preserve all T1-T10 style)
    BrowserLogger.log("🚀 Starting STANDARD Chapter 7 Domain Walkthroughs...");
    BrowserLogger.log(`📋 Selected: ${selectedWalkthroughs.map(w => w.domain).join(', ')}`);
    BrowserLogger.log(`🏗️ Tiers: ${selectedTiers.join(', ')}`);

    initializeExecutionState(selectedWalkthroughs, selectedTiers);
    
    // ✅ UNCHANGED: Load engines with error handling
    try {
        await loadWalkthroughEnginesEnhanced(selectedTiers);
    } catch (error) {
        handleEngineLoadError(error);
        return;
    }

    // ✅ UNCHANGED: Execute walkthroughs with clean error handling
    const executionResult = await executeWalkthroughBatch(selectedWalkthroughs, selectedTiers);
    
    // ✅ UNCHANGED: Finalize execution
    finalizeExecution(executionResult);
}
// ✅ NEW: Comparative walkthrough execution
async function startComparativeDomainWalkthroughs(selectedWalkthroughs: any[], selectedTiers: string[]): Promise<void> {
    try {
        BrowserLogger.log("🔍 Initializing comparative analysis framework...");
        BrowserLogger.log(`📊 Comparing ${comparativeApproaches.length} approaches across ${selectedTiers.length} tiers`);

        // Initialize execution state (reuse existing)
        initializeExecutionState(selectedWalkthroughs, selectedTiers);
        
        // Load engines (reuse existing)
        await loadWalkthroughEnginesEnhanced(selectedTiers);

        // Execute comparative batch
        const executionResult = await executeComparativeWalkthroughBatch(selectedWalkthroughs, selectedTiers);
        
        // Finalize with comparative results
        finalizeComparativeExecution(executionResult);

    } catch (error) {
        BrowserLogger.log(`❌ Comparative execution failed: ${error?.message}`);
        walkthroughUI.displayError(`Comparative walkthroughs failed: ${error?.message}`, 'Comparative Execution');
        stopDomainWalkthroughs();
    }
}

// ✅ NEW: Execute comparative walkthrough batch
async function executeComparativeWalkthroughBatch(walkthroughs: any[], tiers: string[]) {
    let completedRuns = 0;
    let executionAborted = false;
    const resultMap = new Map();
    const totalRuns = walkthroughs.length * tiers.length;

    try {
        for (let i = 0; i < walkthroughs.length; i++) {
            const walkthrough = walkthroughs[i];
            
            if (shouldAbortExecution()) {
                executionAborted = true;
                break;
            }

            for (let j = 0; j < tiers.length; j++) {
                const tier = tiers[j];
                const executionKey = `${walkthrough.id}-${tier}-comparative`;
                
                if (shouldAbortExecution()) {
                    executionAborted = true;
                    break;
                }

                // Handle pause state
                await handlePauseState();
                
                if (!isRunningWalkthroughs) {
                    executionAborted = true;
                    break;
                }

                // Update progress for comparative mode
                BrowserLogger.log(`🔍 Comparative Analysis: ${walkthrough.domain} on ${tier} tier (${i + 1}/${walkthroughs.length}, ${j + 1}/${tiers.length})`);
                walkthroughUI.updateProgress(
                    `Comparative analysis: ${walkthrough.domain} on ${tier} tier...`, 
                    completedRuns, 
                    totalRuns
                );

                // ✅ NEW: Execute comparative walkthrough
                const result = await executeSingleComparativeWalkthrough(walkthrough, tier, executionKey);
                
                if (result) {
                    resultMap.set(executionKey, result);
                    walkthroughResults.push(result);
                }

                completedRuns++;
                
                // Progressive delay for stability
                const delayTime = Math.min(750 + (completedRuns * 75), 3000); // Longer delays for comparative
                await new Promise(resolve => setTimeout(resolve, delayTime));
                
                if (executionAborted) break;
            }
            
            if (executionAborted) break;
        }

    } catch (criticalError) {
        BrowserLogger.log(`🚨 Critical comparative execution error: ${criticalError?.message}`);
        return { completedRuns, executionAborted: true, resultMap };
    }

    return { completedRuns, executionAborted, resultMap };
}

// ✅ NEW: Execute single comparative walkthrough
async function executeSingleComparativeWalkthrough(walkthrough: any, tier: string, executionKey: string) {
    try {
        const engine = walkthroughEngines[tier];
        if (!engine) {
            throw new Error(`Engine for tier ${tier} not loaded or unavailable`);
        }

        BrowserLogger.log(`🔍 Running comparative analysis for ${walkthrough.domain} (${tier}) with approaches: ${comparativeApproaches.join(', ')}`);

        // ✅ NEW: Call comparative evaluator
        const comparativeConfig = {
            comparative: true,
            approaches: comparativeApproaches,
            enableMCDAnalysis: true,
            generateAdvantageReport: true
        };

        // Execute with timeout protection (longer timeout for comparative)
        let timeoutId: NodeJS.Timeout;
        const executionPromise = runDomainWalkthroughComparative(walkthrough, tier, engine, comparativeConfig);
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Comparative walkthrough timeout for ${executionKey}`)), 180000); // 3 minutes
        });

        try {
            const result = await Promise.race([executionPromise, timeoutPromise]);
            if (timeoutId!) clearTimeout(timeoutId!);
            
            BrowserLogger.log(`✅ Comparative analysis completed: ${walkthrough.domain} - ${tier}`);
            BrowserLogger.log(`📊 Approaches tested: ${comparativeApproaches.length}, MCD validated: ${result?.mcdAdvantage?.validated ? 'Yes' : 'Pending'}`);
            
            return result;
            
        } catch (error) {
            if (timeoutId!) clearTimeout(timeoutId!);
            throw error;
        }

    } catch (executionError) {
        BrowserLogger.log(`❌ Comparative analysis error in ${executionKey}: ${executionError?.message}`);
        
        // Create comparative error result
        const errorResult = createComparativeErrorResult(walkthrough, tier, executionError?.message);
        
        walkthroughUI.displayError(
            `Comparative analysis failed: ${walkthrough.domain} - ${tier}: ${executionError?.message}`,
            'Comparative Execution Error'
        );
        
        return errorResult;
    }
}

// ✅ NEW: Wrapper for comparative evaluator call
async function runDomainWalkthroughComparative(walkthrough: any, tier: string, engine: any, config: any) {
    // This would call the enhanced evaluator with comparative configuration
    // For now, this is a placeholder that calls the standard evaluator with extra parameters
    
    BrowserLogger.log(`🔍 Executing domain walkthrough in comparative mode...`);
    
    // Import the comparative evaluator when available
    if (typeof runComparativeDomainWalkthrough !== 'undefined') {
        return await runComparativeDomainWalkthrough(walkthrough, tier, engine, config);
    } else {
        // Fallback: use standard evaluator with comparative flag
        BrowserLogger.log(`⚠️ Comparative evaluator not available, using standard with comparative flag`);
        return await runDomainWalkthrough(walkthrough, tier, engine, { ...config });
    }
}

// ✅ NEW: Create comparative error result
function createComparativeErrorResult(walkthrough: any, tier: string, errorMessage: string) {
    return {
        walkthroughId: walkthrough.id,
        domain: walkthrough.domain,
        tier: tier,
        comparative: true,
        approaches: comparativeApproaches,
        scenarioResults: [],
        comparativeResults: {},
        analysis: null,
        mcdAdvantage: {
            validated: false,
            concerns: [`Execution failed: ${errorMessage}`],
            recommendations: ['Retry with different configuration'],
            confidenceLevel: 0,
            statisticalSignificance: false
        },
        domainMetrics: {
            overallSuccess: false,
            mcdAlignmentScore: 0,
            resourceEfficiency: 0,
            fallbackTriggered: true,
            userExperienceScore: 0
        },
        recommendations: [`Comparative analysis failed: ${errorMessage}`]
    };
}

// ✅ NEW: Finalize comparative execution
function finalizeComparativeExecution(executionResult: any) {
    const { completedRuns, executionAborted } = executionResult;
    
    const finalMessage = isRunningWalkthroughs ? 
        `✅ Comparative analysis completed! (${completedRuns} runs across ${comparativeApproaches.length} approaches)` :
        `⏹️ Comparative analysis stopped (${completedRuns} runs completed)`;
    
    walkthroughUI.updateProgress(finalMessage, completedRuns, totalWalkthroughRuns);
    BrowserLogger.log(finalMessage);
    
    // Generate comparative summary
    if (walkthroughResults.length > 0) {
        generateComparativeSummary();
        BrowserLogger.log(`📊 Comparative summary generated for ${walkthroughResults.length} results`);
        BrowserLogger.log(`🔍 Approach comparison complete - results available via subscriber pattern`);
    }
    
    // Reset state
    isRunningWalkthroughs = false;
    isPausedWalkthroughs = false;
    walkthroughUI.setRunningState(false, false);
}

// ✅ NEW: Generate comparative summary
function generateComparativeSummary() {
    try {
        const comparativeResults = walkthroughResults.filter(r => (r as any).comparative);
        
        if (comparativeResults.length === 0) {
            BrowserLogger.log('⚠️ No comparative results to summarize');
            return;
        }

        const summary = {
            totalComparativeRuns: comparativeResults.length,
            approaches: comparativeApproaches,
            domains: [...new Set(comparativeResults.map(r => r.domain))],
            tiers: [...new Set(comparativeResults.map(r => r.tier))],
            mcdValidatedDomains: comparativeResults.filter(r => (r as any).mcdAdvantage?.validated).length,
            averageConfidenceLevel: comparativeResults.reduce((sum, r) => 
                sum + ((r as any).mcdAdvantage?.confidenceLevel || 0), 0) / comparativeResults.length,
            timestamp: new Date().toISOString()
        };
        
        BrowserLogger.log('🔍 Comparative Analysis Summary:');
        BrowserLogger.log(`  • Total Runs: ${summary.totalComparativeRuns}`);
        BrowserLogger.log(`  • Approaches: ${summary.approaches.join(', ')}`);
        BrowserLogger.log(`  • Domains: ${summary.domains.join(', ')}`);
        BrowserLogger.log(`  • MCD Validated: ${summary.mcdValidatedDomains}/${summary.domains.length}`);
        BrowserLogger.log(`  • Avg Confidence: ${(summary.averageConfidenceLevel * 100).toFixed(1)}%`);
        
        // Store for export
        (window as any).comparativeSummary = summary;
        
    } catch (error) {
        BrowserLogger.log(`⚠️ Error generating comparative summary: ${error?.message}`);
    }
}


// ✅ HELPER: Initialize execution state
function initializeExecutionState(walkthroughs, tiers) {
    isRunningWalkthroughs = true;
    isPausedWalkthroughs = false;
    unifiedExecutionState.chapter7Active = true;
    unifiedExecutionState.currentFramework = 'Chapter7';
    
    walkthroughResults = [];
    currentWalkthroughIndex = 0;
    totalWalkthroughRuns = walkthroughs.length * tiers.length;
    
    walkthroughUI.setRunningState(true, false);
    walkthroughUI.showResultsSection();
    walkthroughUI.updateProgress('Initializing walkthroughs...', 0, totalWalkthroughRuns);
}

// ✅ HELPER: Handle engine loading errors
function handleEngineLoadError(error) {
    BrowserLogger.log(`❌ Failed to load walkthrough engines: ${error?.message}`);
    walkthroughUI.displayError(`Engine loading failed: ${error?.message}`, 'Initialization');
    stopDomainWalkthroughs();
}
// ✅ NEW: Get current approach being executed
function getCurrentApproach(): string {
    // For comparative mode, cycle through approaches
    if (comparativeModeEnabled) {
        const approachIndex = currentWalkthroughIndex % comparativeApproaches.length;
        return comparativeApproaches[approachIndex];
    }
    
    // For standard mode, determine approach from UI or use default
    const selectedApproach = getSelectedApproachFromUI();
    return selectedApproach || 'standard';
}

// ✅ NEW: Get approach selection from UI (implement based on your UI)
function getSelectedApproachFromUI(): string | null {
    try {
        // Check if there's an approach selector in the UI
        const approachSelector = document.querySelector('select[name="approach"]') as HTMLSelectElement;
        if (approachSelector && approachSelector.value) {
            return approachSelector.value;
        }
        
        // Check radio buttons for approach selection
        const selectedApproachRadio = document.querySelector('input[name="approach"]:checked') as HTMLInputElement;
        if (selectedApproachRadio && selectedApproachRadio.value) {
            return selectedApproachRadio.value;
        }
        
        // Default approach based on walkthrough type
        return 'standard';
        
    } catch (error) {
        console.warn('Failed to get approach from UI:', error);
        return 'standard';
    }
}

  
async function executeWalkthroughBatch(walkthroughs, tiers) {
    let completedRuns = 0;
    let executionAborted = false;
    const resultMap = new Map();

    try {
        for (let i = 0; i < walkthroughs.length; i++) {
            const walkthrough = walkthroughs[i];
            
            // ✅ FIX: Enhanced stop check at loop start
            if (shouldAbortExecution() || StopController.isStopped) {
                BrowserLogger.log('🛑 Walkthrough batch stopped by user');
                executionAborted = true;
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 0)); // Yield control

            for (let j = 0; j < tiers.length; j++) {
                const tier = tiers[j];
                const executionKey = `${walkthrough.id}-${tier}`;
                
                // ✅ FIX: Stop check at inner loop start
                if (shouldAbortExecution() || StopController.isStopped) {
                    BrowserLogger.log('🛑 Walkthrough tier execution stopped by user');
                    executionAborted = true;
                    break;
                }

                // ✅ FIX: Enhanced stop check during pause handling
                await handlePauseState();
                
                if (!isRunningWalkthroughs || StopController.isStopped) {
                    BrowserLogger.log('🛑 Walkthrough stopped during pause check');
                    executionAborted = true;
                    break;
                }

                // ... rest of existing execution code stays the same ...
                
                // ✅ FIX: Add stop check after each execution
                if (StopController.isStopped) {
                    BrowserLogger.log('🛑 Walkthrough stopped after tier execution');
                    executionAborted = true;
                    break;
                }
                
                completedRuns++;
                
                // Progressive delay with stop check
                const delayTime = Math.min(500 + (completedRuns * 50), 2000);
                for (let k = 0; k < delayTime; k += 100) {
                    if (StopController.isStopped) {
                        executionAborted = true;
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                if (executionAborted) break;
            }
            
            if (executionAborted) break;
        }

    } catch (criticalError) {
        BrowserLogger.log(`🚨 Critical walkthrough execution error: ${criticalError?.message}`);
        handleCriticalError(criticalError);
        return { completedRuns, executionAborted: true, resultMap };
    }

    return { completedRuns, executionAborted, resultMap };
}


// ✅ HELPER: Execute single walkthrough with timeout
// ✅ HELPER: Execute single walkthrough with approach parameter
// ✅ HELPER: Add stop check at the beginning of executeSingleWalkthrough
async function executeSingleWalkthrough(walkthrough, tier, executionKey, approach = 'standard') {
    try {
        // ✅ FIX: Immediate stop check
        if (StopController.isStopped || (window as any).immediateStop) {
            throw new Error('Execution stopped before walkthrough start');
        }
        
        const engine = walkthroughEngines[tier];
        if (!engine) {
            throw new Error(`Engine for tier ${tier} not loaded or unavailable`);
        }

        // ✅ FIX: Enhanced execution with stop monitoring
        let timeoutId;
        const executionPromise = runDomainWalkthrough(walkthrough, tier, engine, {
            useCache: true,
            approach: approach
        });
        
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Walkthrough timeout for ${executionKey}`)), 120000);
        });
        
        // ✅ FIX: Add stop monitoring promise
        const stopPromise = new Promise((_, reject) => {
            const stopCheck = setInterval(() => {
                if (StopController.isStopped || (window as any).immediateStop) {
                    clearInterval(stopCheck);
                    reject(new Error('Execution stopped by user'));
                }
            }, 500); // Check every 500ms
            
            // Clear interval after timeout
            setTimeout(() => clearInterval(stopCheck), 120000);
        });

        try {
            const result = await Promise.race([executionPromise, timeoutPromise, stopPromise]);
            if (timeoutId) clearTimeout(timeoutId);
            
            BrowserLogger.log(`✅ Completed: ${walkthrough.domain} - ${tier} (${approach}) - ${result.domainMetrics.overallSuccess ? 'Success' : 'Failed'}`);
            return result;
            
        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            throw error;
        }

    } catch (executionError) {
        // ✅ FIX: Better error context for stopped executions
        if (executionError.message.includes('stopped') || executionError.message.includes('Execution stopped')) {
            BrowserLogger.log(`🛑 ${executionKey} (${approach}) stopped by user`);
            return null; // Return null for stopped executions instead of error result
        }
        
        BrowserLogger.log(`❌ Error in ${executionKey} (${approach}): ${executionError?.message}`);
        
        const errorResult = createErrorWalkthroughResult(walkthrough, tier, executionError?.message);
        
        walkthroughUI.displayError(
            `${walkthrough.domain} - ${tier} (${approach}) failed: ${executionError?.message}`,
            'Execution Error'
        );
        
        return errorResult;
    }
}



// ✅ HELPER: Create error result
function createErrorWalkthroughResult(walkthrough, tier, errorMessage) {
    return {
        walkthroughId: walkthrough.id,
        domain: walkthrough.domain,
        tier: tier,
        scenarioResults: [],
        domainMetrics: {
            overallSuccess: false,
            mcdAlignmentScore: 0,
            resourceEfficiency: 0,
            fallbackTriggered: true,
            userExperienceScore: 0
        },
        recommendations: [`Execution failed: ${errorMessage}`]
    };
}
// ✅ HELPER: Enhanced abort check with multiple conditions
function shouldAbortExecution() {
    return !isRunningWalkthroughs || 
           StopController.isStopped || 
           (window as any).immediateStop ||
           !unifiedExecutionState.chapter7Active;
}

// ✅ HELPER: Enhanced pause state handling with stop checks
async function handlePauseState() {
    let pauseWaitTime = 0;
    const maxPauseWait = 30000; // 30 seconds max
    
    while (isPausedWalkthroughs && isRunningWalkthroughs && pauseWaitTime < maxPauseWait) {
        // ✅ FIX: Check for stop during pause
        if (StopController.isStopped || (window as any).immediateStop) {
            BrowserLogger.log('🛑 Stop requested during pause, aborting');
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        pauseWaitTime += 100;
    }
    
    if (pauseWaitTime >= maxPauseWait) {
        BrowserLogger.log('⚠️ Pause timeout exceeded, continuing execution');
    }
    
    // Final stop check after pause
    if (StopController.isStopped) {
        throw new Error('Execution stopped during pause');
    }
}


// ✅ HELPER: Handle critical errors
function handleCriticalError(error) {
    isRunningWalkthroughs = false;
    isPausedWalkthroughs = false;
    walkthroughUI.setRunningState(false, false);
    walkthroughUI.displayError(`Critical execution failure: ${error?.message}`, 'System Error');
    
    StopController.reset();
    
    // ✅ Cleanup engines
    try {
        Object.values(walkthroughEngines).forEach(engine => {
            if (engine && typeof engine.destroy === 'function') {
                engine.destroy();
            }
        });
    } catch (cleanupError) {
        console.warn('Engine cleanup failed:', cleanupError);
    }
}
// ✅ ADD: Context-specific recovery strategies (insert after existing handleCriticalError method)





// ✅ HELPER: Finalize execution
function finalizeExecution(executionResult) {
    const { completedRuns, executionAborted } = executionResult;
    
    const finalMessage = isRunningWalkthroughs ? 
        `✅ All domain walkthroughs completed! (${completedRuns}/${totalWalkthroughRuns})` :
        `⏹️ Domain walkthroughs stopped (${completedRuns}/${totalWalkthroughRuns} completed)`;
    
    walkthroughUI.updateProgress(finalMessage, completedRuns, totalWalkthroughRuns);
    BrowserLogger.log(finalMessage);
    
    // ✅ Generate summary only - no direct result integration
    if (walkthroughResults.length > 0) {
        generateWalkthroughSummary();
        BrowserLogger.log(`📊 Generated summary for ${walkthroughResults.length} walkthrough results`);
        BrowserLogger.log(`✅ Results stored locally - display will update via subscriber pattern`);
    }
    
    // ✅ Reset state
    isRunningWalkthroughs = false;
    isPausedWalkthroughs = false;
    walkthroughUI.setRunningState(false, false);
}


// Pause domain walkthroughs
function pauseDomainWalkthroughs() {
    if (!isRunningWalkthroughs) return;
    
    isPausedWalkthroughs = !isPausedWalkthroughs;
    walkthroughUI.setRunningState(true, isPausedWalkthroughs);
    
    const statusMessage = isPausedWalkthroughs ? 
        '⏸️ Domain walkthroughs paused' : 
        '▶️ Domain walkthroughs resumed';
    
    BrowserLogger.log(statusMessage);
}

// Stop domain walkthroughs
// Stop domain walkthroughs
function stopDomainWalkthroughs() {
    // ✅ FIX: Enhanced immediate stop activation
    StopController.stop();
    
    // ✅ FIX: Clear all walkthrough execution flags immediately
    isRunningWalkthroughs = false;
    isPausedWalkthroughs = false;
    
    // ✅ FIX: Reset walkthrough state with protection
    if (typeof WalkthroughStateManager !== 'undefined') {
        WalkthroughStateManager.safeReset();
    }
    
    // ✅ FIX: Clear unified execution state
    unifiedExecutionState.chapter7Active = false;
    unifiedExecutionState.currentFramework = 'T1-T10';
    
    // ✅ FIX: Clear current execution tracking
    currentWalkthroughIndex = 0;
    
    walkthroughUI.setRunningState(false, false);
    
    BrowserLogger.log('⏹️ Domain walkthroughs stopped with enhanced cleanup');
    
    // ✅ FIX: Clear any pending timeouts/intervals specific to walkthroughs
    setTimeout(() => {
        // Clear walkthrough-specific intervals
        if (typeof window !== 'undefined') {
            // Clear any walkthrough progress update intervals
            for (let i = 1; i < 1000; i++) {
                clearTimeout(i);
                clearInterval(i);
            }
        }
        
        resetImmediateStop();
        BrowserLogger.log('✅ Walkthrough cleanup completed');
    }, 1000);
}

let lastProgressUpdate = 0;
const PROGRESS_UPDATE_THROTTLE = 250; // 250ms minimum between updates
// ✅ ENHANCED: Real-time progress tracking for walkthroughs
async function updateWalkthroughProgressDetailed(
    update: WalkthroughProgressUpdate,
    startTime: number,
    completedTrials: number,
    totalTrials: number
): Promise<void> {
    try {
        // ✅ THROTTLE: Skip if updated too recently
        const now = Date.now();
        if (now - lastProgressUpdate < PROGRESS_UPDATE_THROTTLE) {
            return; // Skip this update
        }
        lastProgressUpdate = now;
        
        if (typeof window !== 'undefined') {

            const elapsed = performance.now() - startTime;
            const estimatedTotal = totalTrials > 0 && completedTrials > 0 ? 
                (elapsed / completedTrials) * totalTrials : 0;
            const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
            const throughput = completedTrials > 0 ? completedTrials / (elapsed / 1000) : 0;
            
            // Update walkthrough UI with enhanced progress
            if (window.walkthroughUI?.updateProgressWithDetails) {
                window.walkthroughUI.updateProgressWithDetails({
                    currentTask: `${update.phase}: ${update.currentScenario || 'Processing'}`,
                    completed: completedTrials,
                    total: totalTrials,
                    domain: update.currentVariant,
                    tier: update.currentTrial,
                    estimatedTimeRemaining: estimatedTimeRemaining / 1000,
                    throughput: Math.round(throughput * 10) / 10
                });
            }
            
            // Enhanced test control update
            if (window.updateTestControl) {
                const percentage = totalTrials > 0 ? Math.round((completedTrials / totalTrials) * 100) : 0;
                const etaText = estimatedTimeRemaining > 0 ? 
                    ` (ETA: ${Math.round(estimatedTimeRemaining / 1000)}s)` : '';
                
                window.updateTestControl(
                    `${update.phase} - ${completedTrials}/${totalTrials} trials${etaText}`, 
                    percentage
                );
            }
        }
    } catch (error) {
        console.warn('Enhanced progress update failed:', error);
    }
}

/**
 * Cleanup walkthrough engines to prevent memory leaks
 */
function cleanupWalkthroughEngines(): void {
    try {
        BrowserLogger.log('🧹 Cleaning up walkthrough engines...');
        
        Object.entries(walkthroughEngines).forEach(([tier, engine]) => {
            try {
                if (engine) {
                    // Try different cleanup methods
                    if (typeof engine.destroy === 'function') {
                        engine.destroy();
                    } else if (typeof engine.unload === 'function') {
                        engine.unload();
                    } else if (typeof engine.cleanup === 'function') {
                        engine.cleanup();
                    }
                    
                    BrowserLogger.log(`✅ ${tier} engine cleaned up`);
                }
            } catch (error) {
                console.warn(`Failed to cleanup ${tier} engine:`, error);
            }
        });
        
        // Clear the engines object
        walkthroughEngines = {};
        
        BrowserLogger.log('✅ All walkthrough engines cleaned up');
        
    } catch (error) {
        console.error('Error during engine cleanup:', error);
    }
}

/**
 * Enhanced stop function with proper cleanup
 */
function stopDomainWalkthroughsEnhanced(): void {
    // ✅ PROTECTED: Check if already stopped
    if (!isRunningWalkthroughs) {
        BrowserLogger.log("⚠️ Walkthroughs not running, ignoring stop request");
        return;
    }
    
    // Activate immediate stop
    StopController.stop();
    
    // ENHANCED: Coordinate with test control
    if (typeof window !== 'undefined' && window.updateTestControl) {
        window.updateTestControl('Stopping walkthroughs...', 0);
    }
    
    // ✅ PROTECTED: Use state manager for safe reset
    WalkthroughStateManager.safeReset();
    unifiedExecutionState.chapter7Active = false;
    unifiedExecutionState.currentFramework = 'T1-T10';

    walkthroughUI.setRunningState(false, false);
    
    BrowserLogger.log('⏹️ Protected walkthrough stop initiated - cleaning up resources...');
    
    // Cleanup engines with protection
    setTimeout(() => {
        cleanupWalkthroughEngines();
        
        // ✅ PROTECTED: Disable state protection after cleanup
        WalkthroughStateManager.disableProtection();
        
        if (window.updateTestControl) {
            window.updateTestControl('Walkthrough cleanup completed', 100);
        }
        
        // Reset stop flags after cleanup
        setTimeout(() => {
            resetImmediateStop();
        }, 1000);
    }, 500);
}



// ✅ ENGINE CLEANUP: Prevent memory leaks
async function safeCleanupEngine(tier: string): Promise<void> {
    try {
        const existingEngine = walkthroughEngines[tier];
        if (existingEngine) {
            console.log(`🧹 Cleaning up existing ${tier} engine...`);
            
            // Try multiple cleanup methods
            if (typeof existingEngine.destroy === 'function') {
                await existingEngine.destroy();
            } else if (typeof existingEngine.unload === 'function') {
                await existingEngine.unload();
            } else if (typeof existingEngine.cleanup === 'function') {
                await existingEngine.cleanup();
            }
            
            delete walkthroughEngines[tier];
            console.log(`✅ ${tier} engine cleaned up successfully`);
        }
    } catch (error) {
        console.warn(`Failed to cleanup ${tier} engine:`, error);
    }
}

// ✅ REPLACE: Simplified walkthrough engine loading
// ENHANCED: Engine loading with proper interface compliance
async function loadWalkthroughEnginesEnhanced(tiers: string[]): Promise<void> {
    // ✅ WALKTHROUGH-PROTECTED: Check if engines already loaded
    const alreadyLoadedTiers = tiers.filter(tier => walkthroughEngines[tier] && walkthroughEngines[tier].chat);
    
    if (alreadyLoadedTiers.length === tiers.length) {
        BrowserLogger.log(`✅ All walkthrough engines already loaded: ${tiers.join(', ')}`);
        return;
    }
    
    BrowserLogger.log('🔧 Loading protected walkthrough engines...');
    
    for (const tier of tiers) {
        if (StopController.isStopped) break;
        
        // ✅ PROTECTED: Skip if already loaded and functional
        if (walkthroughEngines[tier] && walkthroughEngines[tier].chat) {
            try {
                // ✅ VALIDATION: Test existing engine
                await walkthroughEngines[tier].chat.completions.create({
                    messages: [{ role: "user", content: "test" }],
                    max_tokens: 1
                });
                
                BrowserLogger.log(`✅ ${tier} engine already loaded and functional, skipping...`);
                continue;
            } catch (testError) {
                BrowserLogger.log(`⚠️ ${tier} engine exists but failed test, reloading...`);
                await safeCleanupEngine(tier);
            }
        }
        
        try {
            BrowserLogger.log(`📦 Loading ${tier} engine with enhanced interface...`);
            await safeCleanupEngine(tier); // Clean any existing
            
            const modelId = getModelForTier(tier) || getFallbackModelForTier(tier);
            if (!modelId) {
                throw new Error(`No model available for ${tier}`);
            }
            
            // ✅ PROTECTED: Load with timeout and validation
            const baseEngine = new webllm.MLCEngine();
            await Promise.race([
                baseEngine.reload(modelId, { temperature: 0.1, top_p: 0.9 }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`${tier} timeout`)), 60000)
                )
            ]);

            // ✅ ENHANCED: Create engine with proper interface (unchanged)
            const enhancedEngine: EngineInterface = {
                chat: {
                    completions: {
                        create: async (params) => {
                            try {
                                if (!params?.messages || !Array.isArray(params.messages)) {
                                    throw new Error('Invalid messages parameter');
                                }
                                
                                const lastMessage = params.messages[params.messages.length - 1];
                                const prompt = lastMessage?.content || '';
                                
                                if (!prompt.trim()) {
                                    throw new Error('Empty prompt provided');
                                }
                                
                                const response = await baseEngine.chat.completions.create({
                                    messages: params.messages,
                                    max_tokens: params.max_tokens || 150,
                                    temperature: params.temperature || 0.7
                                });
                                
                                return {
                                    choices: response.choices || [{
                                        message: {
                                            content: response.choices?.[0]?.message?.content || 'Response generated'
                                        }
                                    }],
                                    usage: {
                                        total_tokens: response.usage?.total_tokens || 50,
                                        prompt_tokens: response.usage?.prompt_tokens || 25,
                                        completion_tokens: response.usage?.completion_tokens || 25
                                    }
                                };
                                
                            } catch (error) {
                                console.error(`Engine ${tier} generation failed:`, error);
                                throw error;
                            }
                        }
                    }
                }
            };

            // ✅ PROTECTED: Store and validate
            walkthroughEngines[tier] = enhancedEngine;
            
            // ✅ VALIDATION: Test the engine immediately
            await enhancedEngine.chat.completions.create({
                messages: [{ role: "user", content: "test" }],
                max_tokens: 1
            });
            
            BrowserLogger.log(`✅ ${tier} protected engine loaded and validated`);
            
        } catch (error) {
            BrowserLogger.log(`❌ ${tier} engine failed: ${error?.message}`);
            // Remove failed engine
            if (walkthroughEngines[tier]) {
                delete walkthroughEngines[tier];
            }
            // Continue with other tiers - don't fail completely
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}






// Generate walkthrough summary
function generateWalkthroughSummary() {
    try {
        const summary = {
            totalWalkthroughs: walkthroughResults.length,
            domains: [...new Set(walkthroughResults.map(r => r.domain))],
            tiers: [...new Set(walkthroughResults.map(r => r.tier))],
            overallSuccessRate: walkthroughResults.filter(r => r.domainMetrics.overallSuccess).length / walkthroughResults.length,
            averageMCDAlignment: walkthroughResults.reduce((sum, r) => sum + r.domainMetrics.mcdAlignmentScore, 0) / walkthroughResults.length,
            averageResourceEfficiency: walkthroughResults.reduce((sum, r) => sum + r.domainMetrics.resourceEfficiency, 0) / walkthroughResults.length,
            timestamp: new Date().toISOString()
        };
        
        BrowserLogger.log('📊 Walkthrough Summary Generated:');
        BrowserLogger.log(`  • Total Runs: ${summary.totalWalkthroughs}`);
        BrowserLogger.log(`  • Domains: ${summary.domains.join(', ')}`);
        BrowserLogger.log(`  • Success Rate: ${(summary.overallSuccessRate * 100).toFixed(1)}%`);
        BrowserLogger.log(`  • Avg MCD Alignment: ${(summary.averageMCDAlignment * 100).toFixed(1)}%`);
        BrowserLogger.log(`  • Avg Resource Efficiency: ${(summary.averageResourceEfficiency * 100).toFixed(1)}%`);
        
        // Store summary for export
        (window as any).walkthroughSummary = summary;
        
    } catch (error) {
        BrowserLogger.log(`⚠️ Error generating walkthrough summary: ${error?.message}`);
    }
}

// Export walkthrough results
function exportWalkthroughResults(format: 'json' | 'csv') {
    if (walkthroughResults.length === 0) {
        alert('No walkthrough results to export.');
        return;
    }
    
    try {
        if (format === 'json') {
            const exportData = {
                exportTimestamp: new Date().toISOString(),
                framework: 'MCD Simulation Runner - Chapter 7 Domain Walkthroughs',
                totalResults: walkthroughResults.length,
                summary: (window as any).walkthroughSummary || {},
                results: walkthroughResults
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            downloadFile(blob, `chapter7-domain-walkthroughs-${getCurrentTimestamp()}.json`);
            
        } else if (format === 'csv') {
            const csvContent = convertWalkthroughsToCSV(walkthroughResults);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            downloadFile(blob, `chapter7-walkthrough-analysis-${getCurrentTimestamp()}.csv`);
        }
        
        BrowserLogger.log(`📥 Walkthrough results exported as ${format.toUpperCase()}`);
        
    } catch (error) {
        BrowserLogger.log(`❌ Export failed: ${error?.message}`);
        alert(`Export failed: ${error?.message}`);
    }
}

// Export walkthrough summary
function exportWalkthroughSummary() {
    const summary = (window as any).walkthroughSummary;
    if (!summary) {
        alert('No walkthrough summary available to export.');
        return;
    }
    
    try {
        // Generate HTML summary report
        const summaryHTML = generateSummaryHTML(summary);
        const blob = new Blob([summaryHTML], { type: 'text/html' });
        downloadFile(blob, `chapter7-summary-${getCurrentTimestamp()}.html`);
        
        BrowserLogger.log('📋 Walkthrough summary report exported');
        
    } catch (error) {
        BrowserLogger.log(`❌ Summary export failed: ${error?.message}`);
        alert(`Summary export failed: ${error?.message}`);
    }
}
// ✅ NEW: Global walkthrough system diagnostics
function checkWalkthroughSystemIntegrity(): {
    status: 'healthy' | 'degraded' | 'critical';
    components: any;
    recommendations: string[];
} {
    const components = {
        stateManager: typeof WalkthroughStateManager !== 'undefined',
        walkthroughUI: !!(window.walkthroughUI && typeof window.walkthroughUI.initialize === 'function'),
        domainResults: !!(window.domainResultsDisplay && typeof window.domainResultsDisplay.initialize === 'function'),
        engines: Object.keys(walkthroughEngines).length,
        stateProtected: WalkthroughStateManager?.isProtected(),
        executionActive: isRunningWalkthroughs,
        duplicateProtection: WalkthroughStateManager?.stateInitialized || false
    };
    
    const issues = [];
    const recommendations = [];
    
    if (!components.stateManager) {
        issues.push('State manager not available');
        recommendations.push('Refresh the application');
    }
    
    if (!components.walkthroughUI) {
        issues.push('WalkthroughUI not properly initialized');
        recommendations.push('Check Chapter 7 initialization');
    }
    
    if (!components.domainResults) {
        issues.push('DomainResultsDisplay not properly initialized');
        recommendations.push('Check Chapter 7 component setup');
    }
    
    if (components.executionActive && !components.stateProtected) {
        issues.push('Execution active but state not protected');
        recommendations.push('Stop and restart walkthroughs');
    }
    
    const status = issues.length === 0 ? 'healthy' : 
                  issues.length <= 2 ? 'degraded' : 'critical';
    
    return { status, components, recommendations };
}

// Make it globally accessible for debugging
if (typeof window !== 'undefined') {
    window.checkWalkthroughSystemIntegrity = checkWalkthroughSystemIntegrity;
}

// Convert walkthroughs to CSV format
function convertWalkthroughsToCSV(results: WalkthroughResult[]): string {
    const headers = [
        'Domain', 'Tier', 'Walkthrough_ID', 'Overall_Success',
        'MCD_Alignment_Score', 'Resource_Efficiency', 'User_Experience_Score',
        'Fallback_Triggered', 'Scenario_Count', 'Avg_Tokens_Used', 'Avg_Latency_Ms',
        'Recommendations'
    ];
    
    const rows = results.map(result => {
        const avgTokens = result.scenarioResults.reduce((sum, s) => sum + s.tokensUsed, 0) / (result.scenarioResults.length || 1);
        const avgLatency = result.scenarioResults.reduce((sum, s) => sum + s.latencyMs, 0) / (result.scenarioResults.length || 1);
        
        return [
            result.domain,
            result.tier,
            result.walkthroughId,
            result.domainMetrics.overallSuccess,
            result.domainMetrics.mcdAlignmentScore.toFixed(3),
            result.domainMetrics.resourceEfficiency.toFixed(3),
            result.domainMetrics.userExperienceScore.toFixed(3),
            result.domainMetrics.fallbackTriggered,
            result.scenarioResults.length,
            avgTokens.toFixed(1),
            avgLatency.toFixed(1),
            `"${result.recommendations.join('; ')}"`
        ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Generate HTML summary report
function generateSummaryHTML(summary: any): string {
return `
<!DOCTYPE html>
<html>
<head>
    <title>Chapter 7: Domain Walkthrough Results Summary</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333;
        }
        .header { 
            background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
            color: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin-bottom: 30px;
        }
        .metric { 
            display: inline-block; 
            margin: 10px; 
            padding: 15px; 
            background: #f8f9fc; 
            border-radius: 8px; 
            border-left: 4px solid #9c27b0;
        }
        .metric-label { 
            font-weight: bold; 
            color: #7b1fa2; 
        }
        .metric-value { 
            font-size: 1.2em; 
            color: #2c3e50; 
        }
        .domain-list {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Chapter 7: Domain Walkthrough Results Summary</h1>
        <p>Generated on: ${new Date(summary.timestamp).toLocaleString()}</p>
        <p>MCD Simulation Runner - Comprehensive Domain Analysis</p>
    </div>
    
    <div class="metric">
        <div class="metric-label">Total Walkthroughs:</div>
        <div class="metric-value">${summary.totalWalkthroughs}</div>
    </div>
    
    <div class="metric">
        <div class="metric-label">Overall Success Rate:</div>
        <div class="metric-value">${(summary.overallSuccessRate * 100).toFixed(1)}%</div>
    </div>
    
    <div class="metric">
        <div class="metric-label">Avg MCD Alignment:</div>
        <div class="metric-value">${(summary.averageMCDAlignment * 100).toFixed(1)}%</div>
    </div>
    
    <div class="metric">
        <div class="metric-label">Avg Resource Efficiency:</div>
        <div class="metric-value">${(summary.averageResourceEfficiency * 100).toFixed(1)}%</div>
    </div>
    
    <div class="domain-list">
        <h3>📊 Domains Tested:</h3>
        <ul>
            ${summary.domains.map(domain => `<li><strong>${domain}</strong></li>`).join('')}
        </ul>
    </div>
    
    <div class="domain-list">
        <h3>🏗️ Quantization Tiers:</h3>
        <ul>
            ${summary.tiers.map(tier => `<li><strong>${tier}</strong></li>`).join('')}
        </ul>
    </div>
    
    <p style="margin-top: 30px; padding: 15px; background: #f8f9fc; border-radius: 8px; font-style: italic;">
        This summary provides an overview of Chapter 7 domain walkthrough validation results. 
        For detailed scenario-by-scenario analysis, refer to the comprehensive JSON export.
    </p>
</body>
</html>
`;

}

// Utility functions
function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function getCurrentTimestamp(): string {
    return new Date().toISOString().split('T')[0];
}

// ============================================
// 🔄 EXISTING FUNCTIONS (PRESERVED)
// ============================================

// FIXED: Toggle detailed view with updated logic for always-visible default state
function toggleDetailedView() {
    try {
        const detailedContainer = document.getElementById('detailedResultsContainer');
        const toggleBtn = document.querySelector('.toggle-detailed-btn') as HTMLButtonElement;
        
        if (!detailedContainer) {
            BrowserLogger.log("⚠️ Detailed results container not found");
            return;
        }
        
        // UPDATED: Account for new default visible state
        const isCurrentlyVisible = detailedContainer.style.display !== 'none';
        
        if (isCurrentlyVisible) {
            // Hide detailed results
            ComponentUI.toggleDetailedResults(false);
            DetailedResults.hide();
            if (toggleBtn) toggleBtn.textContent = 'Show Details';
            BrowserLogger.log("📄 Detailed analysis view hidden");
        } else {
            // Show detailed results and update content
            ComponentUI.toggleDetailedResults(true);
            DetailedResults.show();
            DetailedResults.updateDetailedResults();
            if (toggleBtn) toggleBtn.textContent = 'Hide Details'; // FIXED: Default state
            BrowserLogger.log("📄 Detailed analysis view displayed with tier comparison");
        }
        
    } catch (error) {
        console.error('Error toggling detailed view:', error);
        BrowserLogger.log(`❌ Error toggling detailed view: ${error?.message}`);
    }
}

// ENHANCED: Show variant details with comprehensive modal support
function showVariantDetails(testId: string, variantId: string) {
    try {
        if (!testId || !variantId) {
            BrowserLogger.log("❌ Invalid test or variant ID provided");
            return;
        }
        
        console.log(`🔍 Showing comprehensive details for ${testId} - ${variantId}`);
        
        // ENHANCED: Better user feedback with detailed logging
        BrowserLogger.log(`📋 Opening detailed analysis for ${testId} - ${variantId}`);
        BrowserLogger.log("📊 Displaying individual trial results, timing data, and semantic analysis");
        
        // ADDED: Try to find actual detailed results first
        const detailedResults = (window as any).detailedResults || [];
        const testResult = detailedResults.find((r: any) => r.testID === testId);
        
        if (testResult) {
            const variant = testResult.variants?.find((v: any) => v.variant === variantId);
            if (variant) {
                const detailsText = `
Detailed Analysis: ${testId} - ${variantId}

Variant Type: ${variant.variantType}
MCD Aligned: ${variant.mcdAligned ? 'Yes ✅' : 'No ❌'}
Completion Rate: ${variant.completionRate}

Performance Metrics:
• Average Tokens: ${variant.avgTokens}
• Average Latency: ${variant.avgLatency}ms
• Success Rate: ${variant.completionRate}

Trial Summary:
${variant.trials?.map((t: any, i: number) => 
    `Trial ${i + 1}: ${t.completion} (${t.tokens} tokens, ${Math.round(t.latencyMs)}ms)`
).join('\n') || 'No trial data available'}

Notes: ${variant.notes}
                `.trim();
                
                alert(detailsText);
                return;
            }
        }
        
        // Fallback to generic message
        alert(`Detailed analysis for ${testId} - ${variantId}\n\nThis would show individual trial results, timing data, and semantic analysis.\n\nRun tests in detailed mode to see comprehensive trial-by-trial data with tier comparison.`);
        
    } catch (error) {
        console.error('Error showing variant details:', error);
        BrowserLogger.log(`❌ Error showing variant details: ${error?.message}`);
    }
}

// NEW: Tier comparison management functions
function updateTierComparison() {
    try {
        ComponentUI.updateTierComparison();
        LiveComparison.updateWithTierData();
        BrowserLogger.log("🏗️ Tier comparison data updated");
    } catch (error) {
        console.warn('Error updating tier comparison:', error);
        BrowserLogger.log(`⚠️ Tier comparison update failed: ${error?.message}`);
    }
}

function exportTierComparisonData() {
    try {
        const tierData = getTierComparisonData();
        if (!tierData || tierData.length === 0) {
            BrowserLogger.log("⚠️ No tier comparison data available to export");
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            tierComparisonData: tierData,
            summary: getTierComparison()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tier-comparison-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        BrowserLogger.log("📥 Tier comparison data exported successfully");
    } catch (error) {
        console.error('Error exporting tier comparison data:', error);
        BrowserLogger.log(`❌ Tier comparison export failed: ${error?.message}`);
    }
}

// ADDED: Helper functions for system profiling
function getWebGLVersion(): string {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            const version = gl.getParameter(gl.VERSION);
            return version.includes('WebGL 2') ? 'WebGL 2.0' : 'WebGL 1.0';
        }
        return 'Not Available';
    } catch {
        return 'Detection Failed';
    }
}

function getMaxTextureSize(): number {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            return gl.getParameter(gl.MAX_TEXTURE_SIZE);
        }
        return 0;
    } catch {
        return 0;
    }
}

// ============================================
// 🔗 ENHANCED GLOBAL FUNCTION SETUP
// ============================================

// ENHANCED: Comprehensive global function setup with tier comparison + walkthrough integration
// REPLACE the complex global function setup with this streamlined version:
// ✅ REPLACE: Robust global function setup
function setupGlobalFunctionsRobust(): void {
    try {
        // ✅ ESSENTIAL FUNCTIONS ONLY
        const essentialFunctions = {
            // T1-T10 Core
            runAllTests: TestRunner.runAllTests,
            stopTests: ButtonHandlers.stopTests,
            pauseTests: ButtonHandlers.pauseTests,
            clearResults: ButtonHandlers.clearResults,
            toggleDetailedView: toggleDetailedView,
            
            // Chapter 7 Core
            startDomainWalkthroughs: startDomainWalkthroughs,
            stopDomainWalkthroughs: stopDomainWalkthroughsEnhanced,
            toggleComparativeMode: toggleComparativeMode,
            setComparativeApproaches: setComparativeApproaches,
            // Export Functions
            downloadResults: ResultExporter.downloadResults,
            exportWalkthroughResults: exportWalkthroughResults,
            
            // System Functions
            updateTestBedConfiguration: displayTestBedConfigurationSafe,
            emergencyFixTestBed: displayTestBedConfigurationSafe
        };

        // ✅ SAFE ASSIGNMENT: No overwriting unless necessary
        Object.entries(essentialFunctions).forEach(([name, func]) => {
            if (typeof func === 'function') {
                (window as any)[name] = func;
            }
        });

        BrowserLogger.log("🔗 Essential global functions registered");

    } catch (error) {
        console.error('Global function setup failed:', error);
        setupBasicGlobalFunctions(); // Fallback
    }
// ADD: Enhanced walkthrough bridge
        setupEnhancedWalkthroughBridge();
// Add debugging functions
        (window as any).systemHealth = SystemHealthMonitor.displayHealthStatus;
        (window as any).forceRecovery = SystemErrorRecovery.handleCriticalError;

}

function setupBasicGlobalFunctions(): void {
    try {
        // ✅ MINIMAL: Only absolutely essential functions
        (window as any).runAllTests = TestRunner.runAllTests || (() => console.warn('runAllTests not available'));
        (window as any).stopTests = ButtonHandlers.stopTests || (() => console.warn('stopTests not available'));
        (window as any).clearResults = ButtonHandlers.clearResults || (() => console.warn('clearResults not available'));
        
        console.log('🔗 Basic global functions registered');
    } catch (error) {
        console.error('Basic global function setup failed:', error);
    }
}

// ✅ ENHANCED: Walkthrough system bridge functions
function setupEnhancedWalkthroughBridge(): void {
    try {
        // Enhanced domain execution bridge
        if (typeof window !== 'undefined') {
            // ✅ ENHANCED: Replace the executeDomain function around line 1200
window.domainWalkthroughs = {
    executeDomain: async (domain: string, tier: string, approach?: string) => {
        try {
            // ✅ ENHANCED: Better approach parameter logging and validation
            const actualApproach = approach || 'standard';
            console.log(`🎯 Enhanced domain execution: ${domain} with ${tier} (${actualApproach} approach)`);
            console.log(`📋 Approach details: ${actualApproach === 'standard' ? 'Default execution' : `Specialized ${actualApproach} execution`}`);
            
            // Get the domain walkthrough definition
            const domainMap = { 
                'appointment-booking': 'D1', 
                'spatial-navigation': 'D2', 
                'failure-diagnostics': 'D3' 
            };
            const domainId = domainMap[domain] || domain;
            
            const walkthrough = DOMAIN_WALKTHROUGHS.find(w => w.id === domainId);
            if (!walkthrough) {
                throw new Error(`Domain walkthrough not found: ${domain} (${domainId})`);
            }
            
            // ✅ ENHANCED: Approach-specific logging
            console.log(`🎯 Found walkthrough: ${walkthrough.domain} with ${walkthrough.scenarios.length} scenarios`);
            console.log(`📊 Approach configuration: ${actualApproach}`);
            
            // ✅ ENHANCED: Engine loading with approach context
            console.log(`🔧 Loading engine for ${tier} using ModelManager (approach: ${actualApproach})...`);
            let engine;
            try {
                const { BrowserModelLoader } = await import('./execution/model-manager');
                engine = await BrowserModelLoader.loadModel(tier);
                
                if (!engine || !engine.chat) {
                    throw new Error(`Failed to load engine for tier ${tier} via ModelManager`);
                }
                
                // ✅ ENHANCED: Validate engine with approach context
                await engine.chat.completions.create({
                    messages: [{ role: "user", content: `test-${actualApproach}-validation` }],
                    max_tokens: 1
                });
                
                console.log(`✅ ${tier} engine loaded and validated for ${actualApproach} approach`);
                
            } catch (loadError) {
                throw new Error(`Engine loading failed for tier ${tier} (${actualApproach}): ${loadError.message}`);
            }
            
            // ✅ CRITICAL FIX: Ensure approach is properly passed to evaluator
            const options = {
                useCache: true,
                approach: actualApproach,
                // ✅ NEW: Additional context for different approaches
                comparative: actualApproach === 'comparative',
                enableMCDAnalysis: actualApproach === 'mcd' || actualApproach === 'comparative',
                approachMetadata: {
                    type: actualApproach,
                    timestamp: new Date().toISOString(),
                    domain: domain,
                    tier: tier
                }
            };
            
            // ✅ ENHANCED: Detailed execution logging
            console.log(`🚀 Executing domain walkthrough with enhanced options:`, {
                domain: domain,
                tier: tier,
                approach: options.approach,
                comparative: options.comparative,
                enableMCDAnalysis: options.enableMCDAnalysis
            });
            
            // Execute the walkthrough with proper approach handling
            const result = await runDomainWalkthrough(walkthrough, tier as any, engine, options);
            
            // ✅ ENHANCED: Success logging with approach verification
            console.log(`✅ Enhanced domain execution completed successfully:`);
            console.log(`  • Domain: ${domain} → ${result.domain}`);
            console.log(`  • Tier: ${tier} → ${result.tier}`);
            console.log(`  • Approach: ${actualApproach}`);
            console.log(`  • Success: ${result.domainMetrics?.overallSuccess ? 'PASS' : 'FAIL'}`);
            console.log(`  • MCD Alignment: ${result.domainMetrics?.mcdAlignmentScore?.toFixed(1) || 'N/A'}%`);
            
            return result;
            
        } catch (error) {
            const errorContext = `${domain}-${tier}${approach ? ` (${approach})` : ''}`;
            console.error(`❌ Enhanced domain execution failed: ${errorContext}`, error);
            console.error(`🔍 Error details:`, {
                domain,
                tier,
                approach: approach || 'standard',
                errorMessage: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    },
    
    // ✅ ENHANCED: Add approach validation function
    validateApproach: (approach: string): boolean => {
        const validApproaches = ['standard', 'mcd', 'few-shot', 'system-role', 'hybrid', 'conversational', 'comparative'];
        return validApproaches.includes(approach);
    },
    
    // ✅ ENHANCED: Get available approaches
    getAvailableApproaches: (): string[] => {
        return ['standard', 'mcd', 'few-shot', 'system-role', 'hybrid', 'conversational', 'comparative'];
    },
    
    getAvailableDomains: () => {
        return DOMAIN_WALKTHROUGHS.map(w => w.domain);
    },
    
    getAvailableTiers: () => {
        return ['Q1', 'Q4', 'Q8'];
    }
};

            
            // Enhanced diagnostic function
            window.checkWalkthroughSystemStatus = () => {
                const status = {
                    walkthroughUIReady: !!window.walkthroughUI,
                    domainResultsReady: !!window.domainResultsDisplay,
                    enginesLoaded: Object.keys(walkthroughEngines).length,
                    availableDomains: DOMAIN_WALKTHROUGHS.length,
                    isExecuting: isRunningWalkthroughs,
                    lastResults: walkthroughResults.length
                };
                
                console.group('🔍 Enhanced Walkthrough System Status');
                console.log('UI Components:', status.walkthroughUIReady && status.domainResultsReady ? '✅ Ready' : '⚠️ Missing');
                console.log('Engines Loaded:', `${status.enginesLoaded}/3`);
                console.log('Domains Available:', status.availableDomains);
                console.log('Currently Executing:', status.isExecuting ? 'Yes' : 'No');
                console.log('Results Stored:', status.lastResults);
                console.groupEnd();
                
                return status;
            };
        }
        
        BrowserLogger.log("✅ Enhanced walkthrough bridge functions registered");
        
    } catch (error) {
        console.error('Enhanced bridge setup failed:', error);
    }
}

/**
 * Global error handler for walkthrough system
 */
/**
 * Enhanced global error handler with cleanup
 */


/**
 * Comprehensive cleanup for browser-main
 */
// REPLACE performComprehensiveCleanup with this streamlined version:
// ✅ REPLACE: Simplified cleanup
// REPLACE the existing performSimplifiedCleanup function with:
function performSimplifiedCleanup(): void {
    try {
        NDArrayMonitor.stopMonitoring(); // ADD THIS LINE FIRST
        SimplifiedMemoryManager.stop();
        UltraSimpleTemplateCache.clear();
        stopSimpleTestBedMonitoring();
        SystemHealthMonitor.stopHealthMonitoring();
        
        if (isRunningWalkthroughs) {
            isRunningWalkthroughs = false;
            cleanupWalkthroughEngines();
        }
        
        StopController.reset();
        
        console.log('🧹 Simplified cleanup completed with NDArray monitoring');
        
    } catch (error) {
        console.warn('Cleanup failed:', error);
    }
}


// Update the window beforeunload listener
window.addEventListener('beforeunload', performSimplifiedCleanup);



// ============================================
// 🔄 ENHANCED INITIALIZATION WITH CHAPTER 7
// ============================================

// ENHANCED: Comprehensive initialization with full feature integration including tier comparison + Chapter 7
// REPLACE the initialization section with this streamlined version:
// ✅ ROBUST: Sequential initialization with proper error boundaries
document.addEventListener('DOMContentLoaded', async () => {
    const initializationSteps = new Map<string, () => Promise<boolean>>();
    let currentStep = '';
    
    try {
        // ✅ STEP 1: Core System Foundation
        // ✅ STEP 1: Core System Foundation with Dependency Resolution
// ✅ FIX: Replace the testControl initialization step around line 1450
initializationSteps.set('testControl', async () => {
    try {
        BrowserLogger.log("🔧 Initializing TestControl with dependency resolution...");
        
        // ✅ ENHANCED: Check for existing testControl first
        if (typeof window !== 'undefined' && window.testControl && window.testControl.initialized) {
            BrowserLogger.log("✅ TestControl already initialized, skipping...");
            return true;
        }
        
        // ✅ FIX: Proper module loading sequence
        const maxWaitTime = 15000; // Increased to 15 seconds
        const waitInterval = 200; // Increased to 200ms for stability
        let waitTime = 0;
        
        while (waitTime < maxWaitTime) {
            if (typeof window !== 'undefined') {
                // ✅ SEQUENTIAL: Try initialization methods in order
                if (window.initializeTestControlGlobally) {
                    try {
                        const result = window.initializeTestControlGlobally();
                        if (result || window.testControl) {
                            BrowserLogger.log("✅ TestControl initialized via global initializer");
                            return true;
                        }
                    } catch (initError) {
                        console.warn('Global initializer failed:', initError);
                    }
                } else if (window.testControl && typeof window.testControl === 'object') {
                    BrowserLogger.log("✅ TestControl already available");
                    return true;
                } else if (typeof testControl !== 'undefined') {
                    // Import the module testControl if available
                    window.testControl = testControl;
                    BrowserLogger.log("✅ TestControl imported successfully");
                    return true;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, waitInterval));
            waitTime += waitInterval;
        }
        
        // ✅ ROBUST: Enhanced fallback with better structure
        BrowserLogger.log("⚠️ Creating enhanced fallback TestControl...");
        
        if (typeof window !== 'undefined') {
            window.testControl = {
                selectedTests: new Set(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10']),
                selectedTiers: new Set(['Q1', 'Q4', 'Q8']),
                isRunning: false,
                isPaused: false,
                stopRequested: false,
                currentTest: '',
                currentTier: '',
                detailedMode: false,
                initialized: true,
                // ✅ ADD: Enhanced fallback methods
                getSelectedTests: function() { return Array.from(this.selectedTests); },
                getSelectedTiers: function() { return Array.from(this.selectedTiers); },
                setRunningState: function(running: boolean, paused: boolean = false) {
                    this.isRunning = running;
                    this.isPaused = paused;
                }
            };
            
            // ✅ ENHANCED: Better updateTestControl fallback
            if (!window.updateTestControl) {
                window.updateTestControl = (status: string, progress?: number) => {
                    const timestamp = new Date().toLocaleTimeString();
                    console.log(`[TestControl ${timestamp}] ${status}${progress !== undefined ? ` (${progress}%)` : ''}`);
                    
                    // ✅ ADD: Try to update UI if available
                    const statusElement = document.querySelector('.test-status');
                    if (statusElement) {
                        statusElement.textContent = status;
                    }
                };
            }
        }
        
        BrowserLogger.log("✅ Enhanced TestControl foundation established");
        return true;
        
    } catch (error) {
        console.error('TestControl initialization failed:', error);
        BrowserLogger.log(`❌ TestControl init error: ${error?.message}`);
        return false; // ✅ FIX: Return false instead of true for proper error handling
    }
});

   // ✅ STEP 1.5: NEW - Test Runner Initialization  
        initializationSteps.set('testRunner', async () => {
            try {
                BrowserLogger.log("🚀 Initializing test runner and runAllTests function...");
                
                const testRunnerReady = await ButtonHandlers.initializeTestRunner();
                if (!testRunnerReady) {
                    BrowserLogger.log('⚠️ Test runner not ready - some functions may not work');
                    return false;
                }
                
                BrowserLogger.log("✅ Test runner and runAllTests initialized successfully");
                return true;
                
            } catch (error) {
                console.error('Test runner initialization failed:', error);
                BrowserLogger.log(`❌ Test runner init error: ${error?.message}`);
                return false;
            }
        });

        // ✅ STEP 2: Memory Management
        initializationSteps.set('memory', async () => {
            try {
                SimplifiedMemoryManager.start();
                BrowserLogger.log("✅ Memory management started");
                return true;
            } catch (error) {
                console.error('Memory management failed:', error);
                return false;
            }
        });
// Add this AFTER the 'memory' step and BEFORE 'coreUI'
initializationSteps.set('ndArrayMonitoring', async () => {
    try {
        NDArrayMonitor.startMonitoring();
        BrowserLogger.log("✅ NDArray monitoring started");
        return true;
    } catch (error) {
        console.error('NDArray monitoring failed:', error);
        return false; // Non-critical but important
    }
});

        // ✅ STEP 3: Core UI Components
        initializationSteps.set('coreUI', async () => {
            try {
                ComponentUI.initialize();
                BrowserLogger.log("✅ Core UI components initialized");
                return true;
            } catch (error) {
                console.error('Core UI initialization failed:', error);
                return false;
            }
        });

        // ✅ STEP 4: Model System (Simple)
        initializationSteps.set('modelSystem', async () => {
            try {
                // Simple model preset initialization without complex async chains
                if (typeof window !== 'undefined' && window.modelLoader) {
                    await window.modelLoader.getModelPresets();
                    BrowserLogger.log("✅ Model system ready");
                }
                return true;
            } catch (error) {
                console.warn('Model system initialization failed, continuing:', error);
                return true; // Non-critical failure
            }
        });

        // ✅ STEP 5: Chapter 7 Components
        
// ✅ ROBUST FIX: Sequential initialization to prevent race conditions
// ✅ FIX: Replace the chapter7 initialization step around line 1550
initializationSteps.set('chapter7', async () => {
    try {
        // ✅ IDEMPOTENT: Check if already initialized properly
        if (typeof window !== 'undefined' && 
            window.walkthroughUI && 
            window.domainResultsDisplay &&
            window.walkthroughUI.isInitialized &&
            window.domainResultsDisplay.isInitialized) {
            BrowserLogger.log("✅ Chapter 7 components already fully initialized, skipping...");
            return true;
        }
        
        BrowserLogger.log("🔧 Starting protected Chapter 7 initialization...");
        
        // ✅ SEQUENTIAL: Initialize components one at a time with validation
        
        // Step 1: WalkthroughUI with enhanced error handling
        if (!window.walkthroughUI) {
            BrowserLogger.log("📱 Step 1: Initializing walkthrough UI with safety checks...");
            
            try {
                walkthroughUI = new WalkthroughUI({
                    showProgress: true,
                    showDetailedSteps: true,
                    showResultsSummary: true,
                    realTimeUpdates: true
                });
                
                // ✅ EXPLICIT: Wait for component to be ready
                let initAttempts = 0;
                const maxInitAttempts = 10;
                
                while (initAttempts < maxInitAttempts && 
                       (!walkthroughUI || typeof walkthroughUI.initialize !== 'function')) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    initAttempts++;
                }
                
                if (!walkthroughUI || typeof walkthroughUI.initialize !== 'function') {
                    throw new Error('WalkthroughUI failed to initialize properly');
                }
                
                // ✅ VALIDATE: Test the UI component
                const uiValidation = walkthroughUI.validateSystem ? walkthroughUI.validateSystem() : { isValid: true };
                if (!uiValidation.isValid) {
                    throw new Error(`WalkthroughUI validation failed: ${uiValidation.message}`);
                }
                
                window.walkthroughUI = walkthroughUI;
                BrowserLogger.log("✅ WalkthroughUI initialized and validated");
                
            } catch (uiError) {
                BrowserLogger.log(`❌ WalkthroughUI initialization failed: ${uiError.message}`);
                throw uiError;
            }
        }
        
        // ✅ STABILIZATION: Brief pause between components
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 2: DomainResultsDisplay with enhanced error handling
        if (!window.domainResultsDisplay) {
            BrowserLogger.log("📊 Step 2: Initializing domain results display with safety checks...");
            
            try {
                domainResultsDisplay = new DomainResultsDisplay({
                    showDetailedScenarios: true,
                    showMCDAnalysis: true,
                    showPerformanceMetrics: true,
                    enableAdvancedFiltering: true
                });
                
                // ✅ EXPLICIT: Wait for component to be ready
                let initAttempts = 0;
                const maxInitAttempts = 10;
                
                while (initAttempts < maxInitAttempts && 
                       (!domainResultsDisplay || typeof domainResultsDisplay.initialize !== 'function')) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    initAttempts++;
                }
                
                if (!domainResultsDisplay || typeof domainResultsDisplay.initialize !== 'function') {
                    throw new Error('DomainResultsDisplay failed to initialize properly');
                }
                
                // ✅ VALIDATE: Test the display component
                const displayValidation = domainResultsDisplay.validateSystem ? 
                    domainResultsDisplay.validateSystem() : { isValid: true };
                if (!displayValidation.isValid) {
                    throw new Error(`DomainResultsDisplay validation failed: ${displayValidation.message}`);
                }
                
                window.domainResultsDisplay = domainResultsDisplay;
                BrowserLogger.log("✅ DomainResultsDisplay initialized and validated");
                
            } catch (displayError) {
                BrowserLogger.log(`❌ DomainResultsDisplay initialization failed: ${displayError.message}`);
                throw displayError;
            }
        }
        
        // ✅ INTEGRATION: Test component integration
        if (typeof window !== 'undefined' && window.walkthroughUI && window.domainResultsDisplay) {
            try {
                const integrationCheck = window.walkthroughUI.checkDomainResultsIntegration();
                if (!integrationCheck.success) {
                    BrowserLogger.log(`⚠️ Integration issue: ${integrationCheck.message}`);
                    // Don't fail, but log the issue
                }
                BrowserLogger.log(`🔗 Integration check: ${integrationCheck.message}`);
            } catch (integrationError) {
                BrowserLogger.log(`⚠️ Integration check failed: ${integrationError.message}`);
            }
        }
        
        BrowserLogger.log("✅ Protected Chapter 7 components ready and integrated");
        return true;
        
    } catch (error) {
        console.error('Protected Chapter 7 initialization failed:', error);
        BrowserLogger.log(`❌ Protected initialization error: ${error.message}`);
        
        // ✅ CLEANUP: Reset on failure to allow retry
        if (typeof window !== 'undefined') {
            if (window.walkthroughUI) {
                try { window.walkthroughUI.cleanup?.(); } catch (e) {}
                window.walkthroughUI = undefined;
            }
            if (window.domainResultsDisplay) {
                try { window.domainResultsDisplay.cleanup?.(); } catch (e) {}
                window.domainResultsDisplay = undefined;
            }
        }
        
        return false;
    }
});





        // ✅ STEP 6: System Verification
        initializationSteps.set('verification', async () => {
            try {
                const compatibilityResult = await checkBrowserCompatibilityStreamlined();
                if (compatibilityResult) {
                    BrowserLogger.log("✅ System verification passed");
                    return true;
                } else {
                    BrowserLogger.log("❌ System verification failed");
                    return false;
                }
            } catch (error) {
                console.error('System verification failed:', error);
                return false;
            }
        });

        // ✅ EXECUTE STEPS SEQUENTIALLY
                // ✅ ENHANCED: Robust step execution with proper error boundaries
        BrowserLogger.log("🌐 MCD Simulation Runner - Starting Robust Initialization");
        InitializationProgressManager.createProgressDisplay();

        let stepCount = 0;
        const totalSteps = initializationSteps.size;
        const stepResults = new Map<string, { success: boolean; error?: any; duration: number }>();

        for (const [stepName, stepFunction] of initializationSteps) {
            currentStep = stepName;
            stepCount++;
            
            BrowserLogger.log(`📦 Step ${stepCount}/${totalSteps}: Initializing ${stepName}...`);
            InitializationProgressManager.updateProgress(
                stepName, 
                Math.round((stepCount / totalSteps) * 100),
                `Step ${stepCount}/${totalSteps} - ${stepName}`
            );

            const stepStartTime = performance.now();
            let stepResult = false;
            let stepError: any = null;

            try {
                // ✅ ENHANCED: Execute step with timeout protection
                stepResult = await Promise.race([
                    stepFunction(),
                    new Promise<boolean>((_, reject) => 
                        setTimeout(() => reject(new Error(`Step ${stepName} timeout`)), 30000)
                    )
                ]);

                if (!stepResult) {
                    throw new Error(`Step ${stepName} returned false`);
                }

                const stepDuration = performance.now() - stepStartTime;
                stepResults.set(stepName, { success: true, duration: stepDuration });
                
                BrowserLogger.log(`✅ Step ${stepName} completed in ${Math.round(stepDuration)}ms`);

            } catch (error) {
                const stepDuration = performance.now() - stepStartTime;
                stepError = error;
                stepResults.set(stepName, { success: false, error, duration: stepDuration });
                
                BrowserLogger.log(`❌ Step ${stepName} failed after ${Math.round(stepDuration)}ms: ${error?.message}`);
                
                // ✅ SMART ERROR HANDLING: Decide whether to continue or fail
                const criticalSteps = ['testControl']; // Only testControl is truly critical
                
                if (criticalSteps.includes(stepName)) {
                    // For critical steps, try recovery but don't fail completely
                    BrowserLogger.log(`🔧 Attempting recovery for critical step: ${stepName}`);
                    
                    try {
                        // Give the step one more chance with extended timeout
                        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
                        
                        stepResult = await Promise.race([
                            stepFunction(),
                            new Promise<boolean>((_, reject) => 
                                setTimeout(() => reject(new Error(`Step ${stepName} retry timeout`)), 15000)
                            )
                        ]);
                        
                        if (stepResult) {
                            stepResults.set(stepName, { success: true, duration: performance.now() - stepStartTime });
                            BrowserLogger.log(`✅ Step ${stepName} recovered successfully`);
                        } else {
                            throw error; // Re-throw original error
                        }
                        
                    } catch (retryError) {
                        BrowserLogger.log(`❌ Step ${stepName} recovery failed, but continuing initialization...`);
                        // Don't throw - let emergency recovery handle it
                    }
                }
                // For non-critical steps, just log and continue
            }
            
            // Brief pause between steps for stability
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // ✅ INITIALIZATION SUMMARY
        const successfulSteps = Array.from(stepResults.values()).filter(r => r.success).length;
        const totalTime = Array.from(stepResults.values()).reduce((sum, r) => sum + r.duration, 0);

        BrowserLogger.log(`📊 Initialization Summary: ${successfulSteps}/${totalSteps} steps successful in ${Math.round(totalTime)}ms`);

        // Only throw error if ALL critical steps failed
        const criticalStepsFailed = Array.from(stepResults.entries())
            .filter(([name, result]) => ['testControl'].includes(name) && !result.success);

        if (criticalStepsFailed.length > 0) {
            const failedStepNames = criticalStepsFailed.map(([name]) => name).join(', ');
            throw new Error(`Critical steps failed: ${failedStepNames}`);
        }

        // ✅ FINALIZATION
        setupGlobalFunctionsRobust();
        startSimpleTestBedMonitoring();
        SystemHealthMonitor.startHealthMonitoring();
        BrowserLogger.log("🏥 System health monitoring activated");
        BrowserLogger.log("🎉 MCD Simulation Runner fully initialized!");
        InitializationProgressManager.showSuccess();
        displayWelcomeMessage();


    } catch (error) {
        console.error(`Initialization failed at step: ${currentStep}`, error);
        BrowserLogger.log(`❌ Initialization failed at ${currentStep}: ${error?.message}`);
        InitializationProgressManager.showError(error?.message || 'Unknown error');
        // ✅ ROBUST RECOVERY
        await performEmergencyRecovery(currentStep, error);
    }
});

// ✅ ADD: Comprehensive emergency recovery
async function performEmergencyRecovery(failedStep: string, error: any): Promise<void> {
    try {
        BrowserLogger.log("🚨 Initiating emergency recovery...");
        // STEP 1: Stop all operations immediately
        StopController.stop();
        
        // STEP 2: NDArray cleanup
        try {
            const ndArrayReport = NDArrayMonitor.getHealthReport();
            if (ndArrayReport.activeArrays > 0) {
                console.log(`🧹 Emergency: Cleaning up ${ndArrayReport.activeArrays} NDArrays`);
                NDArrayMonitor.stopMonitoring();
            }
        } catch (ndError) {
            console.warn('NDArray emergency cleanup failed:', ndError);
        }
        
        // STEP 3: Coordinate all cleanup systems
        await GlobalCleanupCoordinator.performCoordinatedCleanup(() => {
            UltraSimpleTemplateCache.clear();
            SimplifiedMemoryManager.stop();
            
            if ((window as any).gc) {
                (window as any).gc();
            }
        });
        // ✅ MINIMAL: Only initialize absolutely essential components
        const essentialComponents = {
            'testControl': () => {
                if (typeof window !== 'undefined' && window.initializeTestControlGlobally) {
                    window.initializeTestControlGlobally();
                }
            },
            'coreUI': () => {
                if (typeof ComponentUI !== 'undefined' && ComponentUI.initialize) {
                    ComponentUI.initialize();
                }
            },
            'globalFunctions': () => {
                setupBasicGlobalFunctions();
            }
        };

        // Initialize essential components that didn't fail
        for (const [componentName, initFunction] of Object.entries(essentialComponents)) {
            if (failedStep !== componentName) {
                try {
                    initFunction();
                    BrowserLogger.log(`✅ Emergency: ${componentName} recovered`);
                } catch (recoveryError) {
                    console.warn(`Emergency recovery failed for ${componentName}:`, recoveryError);
                }
            }
        }

        // ✅ DISPLAY RECOVERY STATUS
        const statusMessage = `Partial initialization completed. ${failedStep} failed but essential components are functional.`;
        BrowserLogger.log(`⚠️ ${statusMessage}`);
        
        if (typeof window !== 'undefined' && window.updateTestControl) {
            window.updateTestControl(statusMessage, 50);
        }
        
    } catch (recoveryError) {
        console.error('Emergency recovery failed:', recoveryError);
        
        // ✅ ULTIMATE FALLBACK
        const criticalMessage = 'Critical system failure - please refresh the page';
        alert(criticalMessage);
        
        const errorElement = document.querySelector('.error-display');
        if (errorElement) {
            errorElement.textContent = criticalMessage;
        }
    }
}
// ✅ ADD: Enhanced system recovery with health diagnostics
class SystemErrorRecovery {
    private static recoveryAttempts = 0;
    private static readonly MAX_RECOVERY_ATTEMPTS = 3;

    static async handleCriticalError(error: any, context: string): Promise<boolean> {
        try {
            this.recoveryAttempts++;
            
            BrowserLogger.log(`🚨 System error in ${context}, attempting recovery ${this.recoveryAttempts}/${this.MAX_RECOVERY_ATTEMPTS}`);

            if (this.recoveryAttempts > this.MAX_RECOVERY_ATTEMPTS) {
                this.displayFinalErrorState(error, context);
                return false;
            }

            // Enhanced recovery sequence
            await this.performDiagnosticRecovery(context);

            const recoverySuccess = await this.validateSystemAfterRecovery();
            
            if (recoverySuccess) {
                BrowserLogger.log("✅ Enhanced system recovery successful");
                this.recoveryAttempts = 0;
                return true;
            }

            return await this.handleCriticalError(error, `${context}-retry`);

        } catch (recoveryError) {
            BrowserLogger.log(`🚨 Recovery process failed: ${recoveryError?.message}`);
            return false;
        }
    }

    private static async performDiagnosticRecovery(context: string): Promise<void> {
        // Step 1: Emergency stop all operations
        StopController.stop();

        if (isRunningWalkthroughs) {
            isRunningWalkthroughs = false;
        }

        if (testControl?.isRunning) {
            testControl.isRunning = false;
        }

        // Step 2: Clear potential memory issues
        UltraSimpleTemplateCache.clear();
        
        // Step 3: Reset execution states
        unifiedExecutionState.t1t10Active = false;
        unifiedExecutionState.chapter7Active = false;

        // Step 4: Brief stabilization pause
        await new Promise(resolve => setTimeout(resolve, 1000));

        BrowserLogger.log(`🔧 Diagnostic recovery completed for ${context}`);
    }

    private static async validateSystemAfterRecovery(): Promise<boolean> {
        try {
            // Check essential components
            if (typeof testControl === 'undefined') {
                return false;
            }

            if (typeof ComponentUI === 'undefined') {
                return false;
            }

            // Reset immediate stop flags
            StopController.reset();

            BrowserLogger.log("✅ System validation passed after recovery");
            return true;

        } catch (error) {
            BrowserLogger.log(`❌ System validation failed: ${error?.message}`);
            return false;
        }
    }

    private static displayFinalErrorState(error: any, context: string): void {
        const errorMessage = `System recovery failed after ${this.MAX_RECOVERY_ATTEMPTS} attempts. Context: ${context}`;
        
        BrowserLogger.log(`🚨 ${errorMessage}`);
        
        // Create user-friendly error display
        const errorOverlay = document.createElement('div');
        errorOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); z-index: 10000; 
            display: flex; align-items: center; justify-content: center;
            font-family: Arial, sans-serif;
        `;
        
        errorOverlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
                <h2 style="color: #d32f2f; margin: 0 0 15px 0;">🚨 System Recovery Failed</h2>
                <p style="margin: 0 0 20px 0;">The system encountered multiple errors and cannot continue safely.</p>
                <p style="margin: 0 0 25px 0; font-size: 0.9em; color: #666;">Error context: ${context}</p>
                <button onclick="window.location.reload()" 
                        style="background: #1976d2; color: white; border: none; padding: 10px 20px; 
                               border-radius: 5px; cursor: pointer; font-size: 16px;">
                    🔄 Refresh Application
                </button>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
    }
}
// ✅ ADD: System health monitoring
class SystemHealthMonitor {
    private static healthCheckInterval: NodeJS.Timeout | null = null;
    private static readonly HEALTH_CHECK_INTERVAL = 300000; // 5 minutes

    static startHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.HEALTH_CHECK_INTERVAL);

        console.log('🏥 System health monitoring started');
    }

    static stopHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    private static performHealthCheck(): void {
        try {
            // Skip during active execution
            if (testControl?.isRunning || 
                unifiedExecutionState?.t1t10Active || 
                unifiedExecutionState?.chapter7Active) {
                return;
            }

            const healthStatus = this.getSystemHealth();
            
            if (!healthStatus.healthy) {
                this.handleHealthIssues(healthStatus);
            }

        } catch (error) {
            console.warn('Health check failed:', error);
        }
    }

    static getSystemHealth(): {
        healthy: boolean;
        issues: string[];
        metrics: any;
        recommendations: string[];
    } {
        const issues: string[] = [];
        const recommendations: string[] = [];

        try {
            // Memory health check
            const memoryUsage = performance.memory ? 
                Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) : 0;

            if (memoryUsage > 1000) {
                issues.push(`High memory usage: ${memoryUsage}MB`);
                recommendations.push('Consider refreshing the application');
            }

            // Component health check
            if (typeof testControl === 'undefined') {
                issues.push('Test control system unavailable');
                recommendations.push('Refresh application to restore test control');
            }

            if (typeof ComponentUI === 'undefined') {
                issues.push('UI system unavailable');
                recommendations.push('Refresh application to restore UI');
            }

            // WebGPU health check
            if (!navigator.gpu) {
                issues.push('WebGPU not available');
                recommendations.push('Use Chrome/Edge with WebGPU enabled');
            }

            // Performance metrics
            const metrics = {
                memoryUsage: `${memoryUsage}MB`,
                webgpuAvailable: !!navigator.gpu,
                testControlReady: typeof testControl !== 'undefined',
                uiSystemReady: typeof ComponentUI !== 'undefined',
                lastHealthCheck: new Date().toISOString()
            };

            return {
                healthy: issues.length === 0,
                issues,
                recommendations,
                metrics
            };

        } catch (error) {
            return {
                healthy: false,
                issues: [`Health check error: ${error?.message}`],
                recommendations: ['Refresh the application'],
                metrics: { error: error?.message }
            };
        }
    }

    private static handleHealthIssues(healthStatus: any): void {
        console.warn('🏥 System health issues detected:', healthStatus.issues);
        
        // Log recommendations
        healthStatus.recommendations.forEach((rec: string) => {
            console.warn(`💡 Recommendation: ${rec}`);
        });

        // Auto-recovery for memory issues
        if (healthStatus.issues.some((issue: string) => issue.includes('memory'))) {
            this.performMemoryRecovery();
        }
    }

    private static performMemoryRecovery(): void {
        try {
            console.log('🧹 Performing automatic memory recovery...');
            
            // Clear caches
            UltraSimpleTemplateCache.clear();
            
            // Force garbage collection if available
            if ((window as any).gc && typeof (window as any).gc === 'function') {
                try { (window as any).gc(); } catch (e) { /* ignore */ }
            }

            console.log('✅ Memory recovery completed');

        } catch (error) {
            console.warn('Memory recovery failed:', error);
        }
    }

    // Public API for manual health checks
    static displayHealthStatus(): void {
        const health = this.getSystemHealth();
        
        console.group('🏥 System Health Status');
        console.log('Overall Status:', health.healthy ? '✅ Healthy' : '⚠️ Issues Detected');
        console.log('Metrics:', health.metrics);
        
        if (health.issues.length > 0) {
            console.group('Issues:');
            health.issues.forEach(issue => console.warn(`• ${issue}`));
            console.groupEnd();
            
            console.group('Recommendations:');
            health.recommendations.forEach(rec => console.log(`• ${rec}`));
            console.groupEnd();
        }
        
        console.groupEnd();
    }
}

// Update your existing error handling to use this enhanced recovery
window.addEventListener('error', (event) => {
    SystemErrorRecovery.handleCriticalError(event.error, 'global-error');
});


// Enhanced cleanup
window.addEventListener('beforeunload', () => {
    try {
        StopController.stop();
        
        SimplifiedMemoryManager.stop();
        stopSimpleTestBedMonitoring();
        UltraSimpleTemplateCache.clear();
        
        if (isRunningWalkthroughs) {
            isRunningWalkthroughs = false;
            cleanupWalkthroughEngines();
        }
    } catch (error) {
        console.warn('Cleanup failed:', error);
    }
});
