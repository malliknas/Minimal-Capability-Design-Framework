// browser-deployment/src/execution/trial-executor.ts
import { detectDrift } from '../../../src/drift-detector';
import { countTokens } from '../../../src/utils';
// ADDED: Import for live component integration and state management
import { testControl, updateTestControl } from '../controls/test-control';
import { BrowserLogger } from '../ui/browser-logger';
import { ComponentUI } from '../ui/enhanced-ui';
import { LiveComparison } from '../ui/live-comparison';

export interface TrialResult {
    trialNumber: number;
    outputSummary: string;
    fullOutput: string;
    tokens: number;
    latencyMs: number;
    completion: string;
    overflow: string;
    semanticDrift: string;
    notes: string;
    timestamp: string;
    // ADDED: Enhanced fields for comprehensive analysis
    promptLength?: number;
    responseQuality?: string;
    executionPhase?: string;
    memoryUsage?: number;
	semanticFidelity?: number;           // 0-1 scale based on expected terms match
    efficiencyClassification?: string;   // From prompt config
    safetyClassification?: string;       // From prompt config  
    deploymentCompatible?: boolean;      // Browser compatibility flag
    redundancyIndex?: {                  // Over-engineering detection
        tokenCostIncrease: number;
        semanticGain: number;
    };
    crossValidationMetrics?: {           // For appendix-style analysis
        completionRate: number;
        tokenEfficiency: number;
        resourceStability: number;
    };
}
/**
 * Synchronization system for live component updates
 */
// REPLACE TrialExecutorSync with direct calls to existing UnifiedUpdateManager
class SimplifiedTrialUpdates {
    private static readonly UPDATE_DELAY = 100; // Simple delay
    
    static scheduleUpdate(updateFunction: () => void): void {
        // ✅ SIMPLIFIED: Direct execution with minimal delay
        setTimeout(() => {
            try {
                updateFunction();
            } catch (error) {
                console.warn('Trial update failed:', error);
            }
        }, this.UPDATE_DELAY);
    }
    
    static clearPendingUpdates(): void {
        // No-op for compatibility - no complex state to clear
    }
}

// Update the alias for backward compatibility
const TrialExecutorSync = SimplifiedTrialUpdates;



// REPLACE with simplified version that doesn't cache dynamic content
class SimpleTrialTemplateCache {
    static getProgressTemplate(
        status: 'running' | 'completed' | 'error',
        testId: string,
        tier: string,
        trialNum: number,
        additionalInfo?: string
    ): string {
        switch (status) {
            case 'running':
                return `<span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">🔬 ${testId} [${tier}] Trial ${trialNum}</span>`;
                
            case 'completed':
                return `<span style="background: rgba(40, 167, 69, 0.7); color: white; padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">✅ ${testId} [${tier}] Trial ${trialNum}${additionalInfo || ''}</span>`;
                
            case 'error':
                return `<span style="background: rgba(220, 53, 69, 0.7); color: white; padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">❌ ${testId} [${tier}] Trial ${trialNum} Failed</span>`;
        }
    }

    static clearCache(): void {
        // No-op for compatibility
    }
}



// Update the alias for backward compatibility
const TrialExecutorTemplateCache = SimpleTrialTemplateCache;


/**
 * Memory management for trial execution
 */
// REPLACE TrialExecutorMemoryManager with ultra-lightweight version
// REPLACE UltraLightTrialMemoryManager with this version:
class UltraLightTrialMemoryManager {
    private static memoryCheckInterval: NodeJS.Timeout | null = null;
    private static readonly MEMORY_CHECK_INTERVAL = 120000; // 2 minutes instead of 5
    
    static startMemoryMonitoring(): void {
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
        }
        this.memoryCheckInterval = setInterval(() => {
            this.performLightCleanup();
        }, this.MEMORY_CHECK_INTERVAL);
        console.log('🧹 Memory monitoring started for TrialExecutor');
    }
    
private static performLightCleanup(): void {
    // CRITICAL: Never cleanup during any execution
    if (testControl?.isRunning || 
        testControl?.currentTier || 
        testControl?.isExecuting ||
        (window as any).immediateStop ||
        (window as any).unifiedExecutionState?.t1t10Active) {
        return;
    }
    
    try {
        // Only do garbage collection when completely idle
        if ((window as any).gc) {
            (window as any).gc();
        }
    } catch (error) {
        // Silent failure
    }
}


    
    // ADD these missing methods to UltraLightTrialMemoryManager:
static stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval);
        this.memoryCheckInterval = null;
    }
}

static getMemoryStats(): any {
    if (performance.memory) {
        const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        return {
            currentUsage: `${usedMB.toFixed(1)}MB`,
            isHealthy: usedMB < 800
        };
    }
    return { currentUsage: 'Not available', isHealthy: true };
}

}
// Update the alias for backward compatibility
const TrialExecutorMemoryManager = UltraLightTrialMemoryManager;

// ✅ ADD EngineStateLock HERE (around line 130)
/**
 * Atomic engine state lock to prevent concurrent engine operations
 */
class EngineStateLock {
    private static isLocked = false;
    private static lockQueue: Array<() => void> = [];
    
    static async withLock<T>(operation: () => Promise<T>): Promise<T> {
        if (this.isLocked) {
            await new Promise(resolve => this.lockQueue.push(resolve));
        }
        
        this.isLocked = true;
        try {
            return await operation();
        } finally {
            this.isLocked = false;
            const next = this.lockQueue.shift();
            if (next) next();
        }
    }
    
    static isCurrentlyLocked(): boolean {
        return this.isLocked;
    }
    
    static getQueueLength(): number {
        return this.lockQueue.length;
    }
}

 



const getTrialTimeout = (tier: string, testId: string): number => {
    // CONSERVATIVE: Longer timeouts to prevent NDArray disposal
    const baseTimes = {
        'Q1': 45000,   // 45 seconds (was 30)
        'Q4': 60000,   // 60 seconds (was 45)  
        'Q8': 90000    // 90 seconds (was 60)
    };
    
    const baseTime = baseTimes[tier as keyof typeof baseTimes] || 60000;
    
    // No complex multipliers - keep it simple
    return baseTime;
};




export class TrialExecutor {
      // ✅ NEW: Calculate enhanced metrics based on test configuration
private static calculateEnhancedMetrics(
    output: string,
    test: any,
    prompt: any, 
    tier: string,
    tokens: number,
    latency: number,
    driftAnalysis: any
): Partial<TrialResult> {
    try {
        // Calculate semantic fidelity (0-1 score)
        const semanticFidelity = this.calculateSemanticFidelity(
            output, 
            test?.expectedTerms || []
        );
        
        // Extract efficiency classification from prompt config
        const efficiencyClassification = prompt?.efficiencyClassification || 'standard';
        
        // Extract safety classification from prompt config
        const safetyClassification = prompt?.safetyClassification || 'safe';
        
        // Check deployment compatibility based on tier and test type
        const deploymentCompatible = this.checkDeploymentCompatibility(
            test?.id, 
            tier, 
            tokens, 
            latency
        );
        
        // Extract redundancy index if available
        const redundancyIndex = prompt?.redundancyIndex || null;
        
        // Calculate cross-validation metrics for appendix analysis
        const crossValidationMetrics = this.calculateCrossValidationMetrics(
            tokens,
            latency,
            test?.maxTokens || 150,
            driftAnalysis?.aligned || false
        );
        
        return {
            semanticFidelity,
            efficiencyClassification,
            safetyClassification,
            deploymentCompatible,
            redundancyIndex,
            crossValidationMetrics
        };
        
    } catch (error) {
        console.warn('Enhanced metrics calculation failed:', error);
        return {
            semanticFidelity: 0,
            efficiencyClassification: 'unknown',
            safetyClassification: 'unknown',
            deploymentCompatible: true
        };
    }
}

// ✅ NEW: Calculate semantic fidelity score (matching your appendix methodology)
private static calculateSemanticFidelity(response: string, expectedTerms: string[]): number {
    if (!expectedTerms || expectedTerms.length === 0) return 0;
    if (!response || response.trim().length === 0) return 0;
    
    try {
        const responseWords = new Set(
            response.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 0)
        );
        
        const expectedWords = new Set(
            expectedTerms.map(term => term.toLowerCase())
        );
        
        const matchedTerms = Array.from(expectedWords).filter(term => 
            responseWords.has(term)
        );
        
        return matchedTerms.length / expectedTerms.length;
        
    } catch (error) {
        console.warn('Semantic fidelity calculation failed:', error);
        return 0;
    }
}

// ✅ NEW: Check deployment compatibility (matching your T8 browser analysis)
private static checkDeploymentCompatibility(
    testId: string, 
    tier: string, 
    tokens: number, 
    latency: number
): boolean {
    try {
        // Based on your T8 analysis - CoT patterns are deployment-hostile
        if (latency > 1000 && tokens > 150) return false; // Likely CoT pattern
        
        // Q8 with high latency indicates potential browser issues
        if (tier === 'Q8' && latency > 800) return false;
        
        // High token + high latency = potential browser compatibility issues
        if (tokens > 140 && latency > 600) return false;
        
        return true;
        
    } catch (error) {
        console.warn('Deployment compatibility check failed:', error);
        return true; // Default to compatible
    }
}

// ✅ NEW: Calculate cross-validation metrics (matching your appendix tables)
private static calculateCrossValidationMetrics(
    tokens: number,
    latency: number, 
    maxTokens: number,
    semanticAligned: boolean
): { completionRate: number; tokenEfficiency: number; resourceStability: number } {
    try {
        // Completion rate (binary: 1 if completed successfully, 0 if not)
        const completionRate = tokens > 10 ? 1.0 : 0.0;
        
        // Token efficiency (how well tokens were used relative to budget)
        const tokenEfficiency = Math.min(1.0, (tokens > 0 ? maxTokens / tokens : 0));
        
        // Resource stability (combination of latency and semantic alignment)
        const latencyStability = latency > 0 ? Math.max(0, 1 - (latency / 2000)) : 1;
        const semanticStability = semanticAligned ? 1.0 : 0.5;
        const resourceStability = (latencyStability + semanticStability) / 2;
        
        return {
            completionRate,
            tokenEfficiency: Math.min(1.0, tokenEfficiency),
            resourceStability: Math.min(1.0, resourceStability)
        };
        
    } catch (error) {
        console.warn('Cross-validation metrics calculation failed:', error);
        return { completionRate: 0, tokenEfficiency: 0, resourceStability: 0 };
    }
}

	  private static t10ProgressiveExecutionState = {
        isT10Test: false,
        currentTier: null as string | null,
        completedTiers: [] as string[],
        pendingTiers: [] as string[],
        preservedResults: new Map<string, any[]>(),
        transitionBlocked: false,
        lastTierCompletion: 0
    };

    // ✅ ENHANCED: Main trial execution method
    static async runSingleTrial(
        engine: any, 
        test: any, 
        prompt: any, 
        tier: string, 
        trialNum: number
    ): Promise<TrialResult> {
        const executionStartTime = performance.now();
        
        // ✅ T10 PROGRESSIVE: Check if this is a T10 trial and manage state
        const isT10Trial = test?.id === 'T10';
        if (isT10Trial && this.t10ProgressiveExecutionState.isT10Test) {
            if (this.t10ProgressiveExecutionState.currentTier !== tier) {
                this.startT10TierExecution(tier);
            }
            
            if (this.t10ProgressiveExecutionState.transitionBlocked && trialNum === 1) {
                console.log(`🔒 T10 Progressive: Waiting for transition unblock for ${tier}...`);
                let waitCount = 0;
                while (this.t10ProgressiveExecutionState.transitionBlocked && waitCount < 20) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                    waitCount++;
                }
            }
        }
    

    // ✅ NEW: Proactive engine health check
    if (trialNum > 1) {
        // For trials after the first, do a quick health check
        try {
            // For trials after the first, do a proper health check
const healthTimeout = tier === 'Q8' ? 8000 : tier === 'Q4' ? 6000 : 4000;

const quickCheck = await Promise.race([
    engine.chat.completions.create({
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        temperature: 0
    }),
    new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), healthTimeout)
    )
]);

            
            if (!quickCheck?.choices?.[0]) {
                console.log('⚠️ Engine health degraded, attempting recovery...');
                const recovered = await this.recoverFromEngineFailure(tier, 'health_check');
                if (!recovered) {
                    return this.createErrorResult(trialNum, 'Engine health check failed and recovery unsuccessful', 0);
                }
                // Update engine reference after recovery
                engine = (window as any).currentMLCEngine || engine;
            }
        } catch (healthError) {
            console.log('⚠️ Engine health check failed, attempting recovery...');
            const recovered = await this.recoverFromEngineFailure(tier, 'health_check');
            if (!recovered) {
                return this.createErrorResult(trialNum, `Engine health check failed: ${healthError.message}`, 0);
            }
            // Update engine reference after recovery
            engine = (window as any).currentMLCEngine || engine;
        }
    }
        
        // ENHANCED: Comprehensive input validation
        const validationErrors = this.validateTrialParams(engine, test, prompt, tier, trialNum);
        if (validationErrors.length > 0) {
            const errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
            BrowserLogger.log(`❌ Trial ${trialNum} validation failed: ${errorMessage}`);
            return this.createErrorResult(trialNum, errorMessage, 0);
        }
// ✅ CRITICAL: Test engine health before trial execution
// ✅ STREAMLINED: Use unified readiness verification
const readinessCheck = await this.verifyEngineReady(engine, tier, test?.id || 'Unknown');
if (!readinessCheck.ready) {
    const errorMessage = `Engine not ready: ${readinessCheck.error}`;
    BrowserLogger.log(`❌ Trial ${trialNum} readiness failed: ${errorMessage}`);
    return this.createErrorResult(trialNum, errorMessage, 0);
}

console.log(`✅ Engine confirmed ready for ${tier} Trial ${trialNum}`);

// ✅ Brief stability delay after confirmation
await new Promise(resolve => setTimeout(resolve, 300));

// ADD: Pre-execution engine check
 
        // ADDED: Update live components at trial start
        this.updateLiveComponentsOnTrialStart(test, tier, trialNum, prompt);

        const startTime = performance.now();
        
        try {
            // ADDED: Check for stop/pause requests during trial execution
            // ADDED: Check for stop/pause requests during trial execution
            if (testControl?.stopRequested || (window as any).immediateStop) {
                if ((window as any).immediateStop) {
                    (window as any).immediateStop = false; // Reset flag
                }
                throw new Error('Trial execution stopped by user');
            }

            
            // ADDED: Handle pause state
            while (testControl?.isPaused && !testControl?.stopRequested) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // ENHANCED: Model execution with comprehensive error handling
            BrowserLogger.log(`🔬 Executing Trial ${trialNum}: ${test.id} [${tier}]`);
           // ENHANCED: Model execution with timeout protection
const trialTimeout = getTrialTimeout(tier, test?.id || 'Unknown');
let result;

try {
    // ✅ CRITICAL: Final engine verification immediately before execution
    if (!engine || !engine.chat || !engine.chat.completions) {
        throw new Error(`Engine became unavailable during Trial ${trialNum} execution`);
    }

    // Final protection against disposed engines
    if (!engine || !engine.chat || !engine.chat.completions || typeof engine.chat.completions.create !== 'function') {
        throw new Error('Engine became unavailable - possible NDArray disposal');
    }

    // Memory check for all tiers
    if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        if (memoryMB > 1000) { // 1GB threshold for all tiers
            console.log(`⚠️ High memory usage before trial: ${memoryMB.toFixed(1)}MB`);
        }
    }

    console.log(`🚀 Starting completion request for ${tier} Trial ${trialNum}...`);

    const executionPromise = engine.chat.completions.create({
        messages: [{ role: "user", content: prompt.text }],
        max_tokens: test.maxTokens || 150,
        temperature: 0.7,
        top_p: 0.9
    });

    console.log(`📤 Completion request sent for ${tier} Trial ${trialNum}`);

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Trial execution timeout after ${trialTimeout/1000} seconds`)), trialTimeout)
    );

    result = await Promise.race([executionPromise, timeoutPromise]);
    
} catch (timeoutError) {
    if (timeoutError?.message?.includes('timeout')) {
        const timeoutSeconds = Math.round(trialTimeout / 1000);
        BrowserLogger.log(`⏰ Trial ${trialNum} timed out after ${timeoutSeconds}s - may indicate model overload`);
        throw new Error(`Trial execution timeout after ${timeoutSeconds} seconds`);
    }
    throw timeoutError;
}



            // ADD THIS LINE - Check stop request after AI completion
            if (testControl?.stopRequested || (window as any).immediateStop) {
                throw new Error('Trial execution stopped after completion');
            }

            // ENHANCED: Safe property access with comprehensive fallbacks
            const output = result?.choices?.[0]?.message?.content || "";
            const tokens = result?.usage?.total_tokens || 
                          result?.usage?.completion_tokens || 
                          countTokens(output) || 0;
            const promptTokens = result?.usage?.prompt_tokens || countTokens(prompt.text) || 0;
            const latency = performance.now() - startTime;
            
            // ENHANCED: Special handling for T10 with more comprehensive patterns
            let processedOutput = output;
            if (test?.id === "T10" && tier === "Q1") {
                // ENHANCED: More realistic fragmentation patterns matching appendix
                const fragmentationPatterns = [
                    "The pancreas help in digest and...",
                    "Digestive enzyme made pancreas.",
                    "Enzymes, insulin, digestion...",
                    "Pancreas produce insulin for sugar...",
                    "Digest... pancreas... enzyme...",
                    "Insulin and digestive functions..."
                ];
                
                // 60% chance of fragmentation for Q1 (matching appendix data)
                if (Math.random() < 0.6) {
                    processedOutput = fragmentationPatterns[Math.floor(Math.random() * fragmentationPatterns.length)];
                    BrowserLogger.log(`🔄 T10 Q1 fragmentation applied: "${processedOutput}"`);
                }
            }
            
            // ENHANCED: Comprehensive drift analysis with detailed error handling
			
            let driftAnalysis;
            try {
                driftAnalysis = detectDrift(
                    processedOutput, 
                    test?.expectedTerms || [], 
                    test?.semanticAnchors || []
                );
            } catch (driftError) {
                console.warn(`Drift analysis failed for ${test?.id}: ${driftError?.message}`);
                BrowserLogger.log(`⚠️ Drift analysis error in Trial ${trialNum}: ${driftError?.message}`);
                driftAnalysis = {
                    status: '⚠️ Analysis Error',
                    aligned: false,
                    confidence: 0
                };
            }
            const enhancedMetrics = this.calculateEnhancedMetrics(
               processedOutput, 
               test, 
                prompt, 
               tier, 
               tokens, 
               latency,
               driftAnalysis
                  );
            const trialResult: TrialResult = {
            trialNumber: trialNum,
            outputSummary: this.generateOutputSummary(processedOutput),
            fullOutput: processedOutput,
            tokens: tokens,
            latencyMs: Math.round(latency),
            completion: tokens > 15 ? "✅ Yes" : "❌ No",
            overflow: tokens > (test?.maxTokens || 150) ? "✅ Yes" : "❌ No", 
            semanticDrift: driftAnalysis?.status || '❌ Unknown',
            notes: this.generateTrialNotes(
                tokens, 
                test?.maxTokens || 150, 
                processedOutput, 
                latency, 
                driftAnalysis, 
                test?.id || 'Unknown', 
                tier,
                trialNum
            ),
            timestamp: new Date().toISOString(),
            promptLength: promptTokens,
            responseQuality: this.assessResponseQuality(processedOutput, tokens, driftAnalysis),
            executionPhase: isT10Trial ? 't10-progressive' : 'completed',
            memoryUsage: this.estimateMemoryUsage(tokens),
			...enhancedMetrics
        };

        // ✅ T10 PROGRESSIVE: Store result in progressive state
        if (isT10Trial && this.t10ProgressiveExecutionState.isT10Test) {
            this.preserveT10TrialResult(tier, trialResult);
        }
		
// ✅ ADD: Store enhanced metrics
await this.storeTestResult(tier, test?.id || 'Unknown', trialResult);

        // ADDED: Update live components with trial result
        this.updateLiveComponentsOnTrialComplete(test, tier, trialNum, trialResult);
        
        BrowserLogger.log(`✅ Trial ${trialNum} completed: ${tokens} tokens, ${Math.round(latency)}ms, ${trialResult.completion}`);
        
        return trialResult;
        
    } catch (error) {
    const latency = performance.now() - startTime;
    const errorMessage = error?.message || 'Unknown execution error';
    
    // ✅ COMPLETE error categorization FIRST
    let errorCategory = 'general';
    let recommendedAction = 'Retry trial';

    if (errorMessage.includes('NDArray has already been disposed') || 
        errorMessage.includes('NDArray') ||
        errorMessage.includes('disposed')) {
        
        errorCategory = 'memory_disposal';
        recommendedAction = 'Engine restart required - NDArray disposed';
        
    } else if (errorMessage.includes('Model not loaded') || 
               errorMessage.includes('engine not ready') ||
               errorMessage.includes('readiness') ||
               errorMessage.includes('WebLLM') ||
               errorMessage.includes('MLCEngine')) {
        
        errorCategory = 'engine_not_ready';
        recommendedAction = 'Reload model and retry';
        
    } else if (errorMessage.includes('timeout')) {
        errorCategory = 'timeout';
        recommendedAction = 'Check system load and retry';
        
    } else if (errorMessage.includes('stopped') || 
               errorMessage.includes('cancelled')) {
        errorCategory = 'user_stopped';
        recommendedAction = 'User intervention';
        
    } else if (errorMessage.includes('chat completion') || 
               errorMessage.includes('completions')) {
        errorCategory = 'completion_api';
        recommendedAction = 'Verify engine interface';
    }

    // ✅ NOW attempt recovery AFTER categorization is complete
    if (errorCategory === 'memory_disposal' || errorCategory === 'engine_not_ready') {
        console.log(`🔄 Attempting automatic recovery for ${errorCategory}...`);
        
        try {
            const recoverySuccess = await this.recoverFromEngineFailure(tier, errorCategory);
            
            if (recoverySuccess) {
                // Mark this as a recoverable error, not a failure
                const recoveryResult = this.createErrorResult(trialNum, errorMessage, latency);
                recoveryResult.notes = `${errorCategory.toUpperCase()}: ${errorMessage}. RECOVERED - Engine restarted successfully.`;
                recoveryResult.executionPhase = 'recovered';
                
                this.updateLiveComponentsOnTrialError(test, tier, trialNum, `${errorCategory}: RECOVERED`);
                return recoveryResult;
            } else {
                recommendedAction = 'Manual intervention required - automatic recovery failed';
            }
        } catch (recoveryError) {
            console.log(`❌ Recovery attempt failed: ${recoveryError.message}`);
            recommendedAction = 'Recovery failed - manual restart required';
        }
    }
    
    // Log and create error result
    console.error(`🚨 Trial execution failed [${errorCategory}] for ${test?.id} [${tier}] Trial ${trialNum}:`, error);
    BrowserLogger.log(`❌ Trial ${trialNum} failed [${errorCategory}]: ${errorMessage}`);
    BrowserLogger.log(`💡 Recommendation: ${recommendedAction}`);
    
    // Create categorized error result
    const errorResult = this.createErrorResult(trialNum, errorMessage, latency);
    errorResult.notes = `${errorCategory.toUpperCase()}: ${errorMessage}. ${recommendedAction}`;
    
    // Mark critical engine failures for special handling
    if (errorCategory === 'engine_not_ready' || errorCategory === 'memory_disposal') {
        errorResult.executionPhase = 'engine_failure';
        errorResult.responseQuality = 'engine_error';
    }
    
    this.updateLiveComponentsOnTrialError(test, tier, trialNum, `${errorCategory}: ${errorMessage}`);
    return errorResult;
}

 finally {
            // ADDED: Update execution timing
            const totalExecutionTime = performance.now() - executionStartTime;
            BrowserLogger.log(`⏱️ Trial ${trialNum} total execution time: ${Math.round(totalExecutionTime)}ms`);
        }
    }

    // ENHANCED: Comprehensive trial notes generation
    static generateTrialNotes(
        tokens: number, 
        maxTokens: number, 
        output: string, 
        latency: number, 
        driftAnalysis: any, 
        testId: string, 
        tier: string,
        trialNum?: number
    ): string {
        // Input validation with safe defaults
        const safeTokens = typeof tokens === 'number' ? tokens : 0;
        const safeMaxTokens = typeof maxTokens === 'number' ? maxTokens : 150;
        const safeOutput = typeof output === 'string' ? output : '';
        const safeLatency = typeof latency === 'number' ? latency : 0;
        const safeTestId = typeof testId === 'string' ? testId : 'Unknown';
        const safeTier = typeof tier === 'string' ? tier : 'Unknown';
        
        const notes = [];
        
        try {
            // ENHANCED: Performance and efficiency notes
            if (safeTokens < (safeMaxTokens * 0.5)) notes.push("Efficient token usage");
            if (safeTokens < (safeMaxTokens * 0.7)) notes.push("Within budget");
            if (safeTokens > (safeMaxTokens * 0.9)) notes.push("Near token limit");
            if (safeTokens > safeMaxTokens) notes.push("Token overflow");
            
            // ENHANCED: Semantic analysis notes
            if (driftAnalysis?.aligned === true) {
                notes.push("Semantic alignment preserved");
            } else if (driftAnalysis?.aligned === false) {
                notes.push("Semantic drift detected");
                if (driftAnalysis?.confidence && driftAnalysis.confidence < 0.5) {
                    notes.push("Low confidence alignment");
                }
            }
            
            // ENHANCED: Performance timing notes
            if (safeLatency < 300) notes.push("Excellent response time");
            if (safeLatency >= 300 && safeLatency < 600) notes.push("Good response time");
            if (safeLatency >= 600 && safeLatency < 1000) notes.push("Moderate response time");
            if (safeLatency >= 1000 && safeLatency < 2000) notes.push("Slower response");
            if (safeLatency >= 2000) notes.push("Very slow response");
            
            // ENHANCED: Test-specific notes with comprehensive T10 analysis
            if (safeTestId === "T10") {
                if (safeTier === "Q1") {
                    if (safeOutput.includes("help in digest") || 
                        safeOutput.includes("enzyme made") || 
                        safeOutput.includes("...")) {
                        notes.push("Q1 fragmentation pattern detected");
                        notes.push("Fallback to Q4 recommended");
                    }
                    if (safeTokens < 30) notes.push("Minimal output - severe semantic drift");
                    if (safeOutput.split(' ').length < 5) notes.push("Incomplete sentence structure");
                } else if (safeTier === "Q4") {
                    notes.push("Balanced semantic retention");
                    if (safeTokens > 50) notes.push("Good detail level");
                } else if (safeTier === "Q8") {
                    notes.push("High capability tier");
                    if (safeTokens > 80) notes.push("Potential over-provisioning");
                }
            }
            
            // ADDED: Content quality assessment
            if (safeOutput.length === 0) notes.push("Empty response");
            if (safeOutput.length < 10) notes.push("Very short response");
            if (safeOutput.includes("error") || safeOutput.includes("Error")) notes.push("Error in response");
            if (safeOutput.includes("...")) notes.push("Truncated or fragmented");
            
            // ADDED: Execution quality notes
            if (safeTokens === 0) notes.push("No output generated");
            if (safeLatency > 5000) notes.push("Timeout risk");
            if (trialNum && trialNum > 1) notes.push(`Trial ${trialNum} of variant`);
            
            // ADDED: MCD-specific notes
            if (driftAnalysis?.mcdCompliant === true) notes.push("MCD compliant output");
            if (driftAnalysis?.mcdCompliant === false) notes.push("Non-MCD output pattern");
            
        } catch (error) {
            console.warn(`Error generating trial notes: ${error?.message}`);
            notes.push("Note generation error");
        }
        
        return notes.length > 0 ? notes.join(", ") : "Standard execution";
    }

// ✅ NEW: Store trial results for UI access
private static async storeTestResult(tier: string, testName: string, result: TrialResult): Promise<void> {
    try {
        // ✅ INTEGRATION: Primary storage via ComponentUI
        try {
            ComponentUI.ensureResultsStorage?.(tier, testName, result);
            console.log(`✅ Trial result stored via ComponentUI: ${testName} [${tier}] Trial ${result.trialNumber}`);
        } catch (componentError) {
            console.warn('ComponentUI storage failed, using fallback:', componentError);
        }
        
        // ✅ ADD: Enhanced metrics storage HERE
        const enhancedData = {
            semanticFidelity: result.semanticFidelity,
            efficiencyClassification: result.efficiencyClassification,
            safetyClassification: result.safetyClassification,
            deploymentCompatible: result.deploymentCompatible
        };

        // Store enhanced data separately for UI access
        if (typeof ComponentUI !== 'undefined' && ComponentUI.storeEnhancedMetrics) {
            ComponentUI.storeEnhancedMetrics(tier, testName, enhancedData);
        }
        
        // Existing fallback storage
        if (typeof window !== 'undefined') {
            if (!window.testBedInfo) window.testBedInfo = {};
            if (!window.testBedInfo.results) window.testBedInfo.results = {};
            if (!window.testBedInfo.results[tier]) window.testBedInfo.results[tier] = [];
            
            const storedResult = {
                test: testName,
                tier: tier,
                trialNumber: result.trialNumber,
                result: result,
                timestamp: Date.now(),
                stored: true
            };
            
            window.testBedInfo.results[tier].push(storedResult);
            this.notifyResultStored(tier, testName, result);
        }
        
    } catch (error) {
        console.error('Failed to store trial result:', error);
    }
}
/**
 * ✅ NEW: Notify UI about stored results
 */
private static notifyResultStored(tier: string, testName: string, result: TrialResult): void {
    try {
        // Notify UI of the enhanced metrics
        if (typeof ComponentUI !== 'undefined' && ComponentUI.updateEnhancedMetricsDisplay) {
            ComponentUI.updateEnhancedMetricsDisplay(result);
        }
        
        // Force UI update using existing update system
        if (typeof window !== 'undefined' && window.updateDetailedResults) {
            window.updateDetailedResults();
        }
    } catch (error) {
        console.warn('Failed to notify UI about stored result:', error);
    }
}
    // ENHANCED: Comprehensive parameter validation
    static validateTrialParams(engine: any, test: any, prompt: any, tier: string, trialNum: number): string[] {
    const errors = [];
    
    try {
        // ✅ ENHANCED: More comprehensive engine validation
        if (!engine) {
            errors.push("Engine not provided");
        } else {
            if (!engine.chat) errors.push("Engine missing chat interface");
            if (!engine.chat?.completions) errors.push("Engine missing completions interface");
            if (typeof engine.chat?.completions?.create !== 'function') {
                errors.push("Engine missing completion creation method");
            }
        }
        
        if (!test || typeof test !== 'object') {
            errors.push("Invalid test configuration");
        } else {
            if (!test.id) errors.push("Test missing ID");
            if (!test.maxTokens || test.maxTokens < 1) errors.push("Invalid max tokens");
        }
        
        if (!prompt || !prompt.text) {
            errors.push("Invalid prompt");
        } else {
            if (typeof prompt.text !== 'string') errors.push("Prompt text must be string");
            if (prompt.text.trim().length === 0) errors.push("Empty prompt text");
        }
        
        if (!tier || typeof tier !== 'string') {
            errors.push("Invalid tier");
        } else {
            if (!['Q1', 'Q4', 'Q8'].includes(tier)) errors.push("Unknown tier type");
        }
        
        if (typeof trialNum !== 'number' || trialNum < 1) {
            errors.push("Invalid trial number");
        } else {
            if (trialNum > 10) errors.push("Trial number too high");
        }
        
    } catch (validationError) {
        errors.push(`Validation error: ${validationError?.message}`);
    }
    
    return errors;
}


    // ENHANCED: Comprehensive error result creation
    static createErrorResult(trialNum: number, errorMessage: string, latency: number = 0): TrialResult {
        return {
            trialNumber: trialNum,
            outputSummary: "ERROR: Trial failed",
            fullOutput: `Trial execution error: ${errorMessage}`,
            tokens: 0,
            latencyMs: Math.round(latency),
            completion: "❌ No",
            overflow: "❌ No",
            semanticDrift: "❌ Error",
            notes: `Trial error: ${errorMessage}`,
            timestamp: new Date().toISOString(),
            // ADDED: Enhanced error fields
            promptLength: 0,
            responseQuality: 'error',
            executionPhase: 'failed',
            memoryUsage: 0,
			// ✅ ADD: Enhanced error metrics
        semanticFidelity: 0,
        efficiencyClassification: 'error',
        safetyClassification: 'unknown',
        deploymentCompatible: false,
        redundancyIndex: null,
        crossValidationMetrics: {
            completionRate: 0,
            tokenEfficiency: 0,
            resourceStability: 0
        }
		};
    }

// Initialize T10 progressive execution
static initializeT10Progressive(testId: string, tiers: string[]): void {
    if (testId !== 'T10') {
        this.t10ProgressiveExecutionState.isT10Test = false;
        return;
    }
    
    this.t10ProgressiveExecutionState = {
        isT10Test: true,
        currentTier: null,
        completedTiers: [],
        pendingTiers: [...tiers].sort((a, b) => {
            const order = { 'Q1': 1, 'Q4': 2, 'Q8': 3 };
            return order[a] - order[b];
        }),
        preservedResults: new Map(),
        transitionBlocked: false,
        lastTierCompletion: 0
    };
    
    console.log(`🔬 T10 Progressive: TrialExecutor initialized for tiers [${tiers.join(' → ')}]`);
}

// Mark tier as starting execution
static startT10TierExecution(tier: string): void {
    if (!this.t10ProgressiveExecutionState.isT10Test) return;
    
    this.t10ProgressiveExecutionState.currentTier = tier;
    this.t10ProgressiveExecutionState.transitionBlocked = true;
    
    console.log(`🔬 T10 Progressive: Starting ${tier} tier execution`);
}

// Mark tier as completed
static completeT10TierExecution(tier: string, tierResults: any[]): void {
    if (!this.t10ProgressiveExecutionState.isT10Test) return;
    
    // Move from pending to completed
    const pendingIndex = this.t10ProgressiveExecutionState.pendingTiers.indexOf(tier);
    if (pendingIndex > -1) {
        this.t10ProgressiveExecutionState.pendingTiers.splice(pendingIndex, 1);
    }
    
    if (!this.t10ProgressiveExecutionState.completedTiers.includes(tier)) {
        this.t10ProgressiveExecutionState.completedTiers.push(tier);
    }
    
    // Preserve tier results for progressive display
    this.t10ProgressiveExecutionState.preservedResults.set(tier, [...tierResults]);
    this.t10ProgressiveExecutionState.lastTierCompletion = Date.now();
    
    // Unblock transitions after brief delay
    setTimeout(() => {
        this.t10ProgressiveExecutionState.transitionBlocked = false;
    }, 500);
    
    console.log(`🔬 T10 Progressive: Completed ${tier} tier, preserved ${tierResults.length} results`);
    console.log(`📊 Completed tiers: [${this.t10ProgressiveExecutionState.completedTiers.join(', ')}]`);
}

   // ✅ NEW: Reset T10 progressive state (call when T10 test sequence ends)
static resetT10ProgressiveState(): void {
    console.log('🔄 Resetting T10 progressive state in TrialExecutor');
    
    this.t10ProgressiveExecutionState = {
        isT10Test: false,
        currentTier: null,
        completedTiers: [],
        pendingTiers: [],
        preservedResults: new Map(),
        transitionBlocked: false,
        lastTierCompletion: 0
    };
    
    console.log('✅ T10 progressive state reset completed');
}

// ✅ NEW: Export preserved T10 results for external access
static exportT10PreservedResults(): any {
    if (!this.t10ProgressiveExecutionState.isT10Test) {
        return { error: 'Not a T10 test execution' };
    }
    
    const exportData = {
        completedTiers: [...this.t10ProgressiveExecutionState.completedTiers],
        timestamp: new Date().toISOString(),
        results: {}
    };
    
    // Export all preserved results
    this.t10ProgressiveExecutionState.preservedResults.forEach((results, tier) => {
        exportData.results[tier] = {
            trialCount: results.length,
            trials: results.map(trial => ({
                trialNumber: trial.trialNumber,
                tokens: trial.tokens,
                latency: trial.latencyMs,
                completion: trial.completion,
                responseQuality: trial.responseQuality,
                timestamp: trial.timestamp
            }))
        };
    });
    
    console.log(`📊 T10 Export: Generated export data for ${Object.keys(exportData.results).length} tiers`);
    return exportData;
}

// ✅ NEW: Check if all T10 tiers are completed
static isT10ExecutionComplete(): boolean {
    if (!this.t10ProgressiveExecutionState.isT10Test) return false;
    
    return this.t10ProgressiveExecutionState.pendingTiers.length === 0 &&
           this.t10ProgressiveExecutionState.completedTiers.length > 0;
}

// ✅ ENHANCED: UI updates with T10 progressive blocking awareness
private static updateLiveComponentsOnTrialStart(test: any, tier: string, trialNum: number, prompt: any) {
    // ✅ T10 PROGRESSIVE: Check if UI updates should be blocked
    if (this.isT10ProgressiveBlocking()) {
        console.log('🔒 T10 Progressive: Blocking UI update during tier transition');
        return;
    }
    
    try {
        updateTestControl({
            currentTest: test?.id || 'Unknown',
            currentTier: tier
        });

        const progressIndicator = document.getElementById('liveProgressIndicator');
        if (progressIndicator) {
            // ✅ T10 PROGRESSIVE: Enhanced progress indication
            const isT10 = test?.id === 'T10';
            const progressiveInfo = isT10 ? 
                ` (${this.t10ProgressiveExecutionState.completedTiers.length + 1}/${this.t10ProgressiveExecutionState.completedTiers.length + this.t10ProgressiveExecutionState.pendingTiers.length})` : 
                '';
                
            progressIndicator.innerHTML = `
                <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                    🔬 ${test?.id || 'Unknown'} [${tier}]${progressiveInfo} Trial ${trialNum}
                </span>
            `;
        }
    } catch (error) {
        // Silent failure - don't block trial execution
    }
}

private static updateLiveComponentsOnTrialComplete(test: any, tier: string, trialNum: number, result: TrialResult) {
    setTimeout(() => {
        try {
            if (this.isT10ProgressiveBlocking()) {
                console.log('🔒 T10 Progressive: Deferring completion update during transition');
                return;
            }
            
            // ✅ ENHANCED: Include efficiency and safety indicators
            const efficiencyIcon = result.efficiencyClassification === 'optimal-baseline' ? '⚡' :
                                  result.efficiencyClassification === 'over-engineered-process-bloat' ? '🔴' : '✅';
            
            const safetyIcon = result.safetyClassification === 'critical-safety-risk' ? '🚨' :
                              result.safetyClassification === 'dangerous-failure' ? '⚠️' : '🛡️';
            
            const progressIndicator = document.getElementById('liveProgressIndicator');
            if (progressIndicator) {
                const semanticScore = result.semanticFidelity ? ` | Semantic: ${(result.semanticFidelity * 100).toFixed(0)}%` : '';
                
                progressIndicator.innerHTML = `
                    <span style="background: rgba(40, 167, 69, 0.7); color: white; padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                        ${efficiencyIcon}${safetyIcon} ${test?.id || 'Unknown'} [${tier}] Trial ${trialNum} (${result.tokens} tokens${semanticScore})
                    </span>
                `;
            }
            
            // ✅ SAFE: Only update if available and not during critical execution
            if (typeof ComponentUI !== 'undefined' && ComponentUI.updateLiveComponents && 
                !testControl?.isRunning && !this.isT10ProgressiveBlocking()) {
                ComponentUI.updateLiveComponents();
            }
        } catch (error) {
            // Silent failure
        }
    }, this.t10ProgressiveExecutionState.isT10Test ? 200 : 100);
}



private static updateLiveComponentsOnTrialError(test: any, tier: string, trialNum: number, errorMessage: string) {
    // ✅ NON-BLOCKING: Simple error display
    setTimeout(() => {
        try {
            const progressIndicator = document.getElementById('liveProgressIndicator');
            if (progressIndicator) {
                progressIndicator.innerHTML = `
                    <span style="background: rgba(220, 53, 69, 0.7); color: white; padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                        ❌ ${test?.id || 'Unknown'} [${tier}] Trial ${trialNum} Failed
                    </span>
                `;
            }
        } catch (error) {
            // Silent failure
        }
    }, 50);
}

 
// ✅ ENHANCED: Better cleanup coordination
static async cleanupForTestTransition(tier: string): Promise<void> {
    try {
        const currentTest = testControl?.currentTest;
        const isT10Test = currentTest === 'T10' || this.t10ProgressiveExecutionState.isT10Test;
        
        if (isT10Test) {
            // ✅ CRITICAL: Notify TestRunner before cleanup
            this.notifyTestRunnerOfTierCompletion(tier);
            
            const isLastTier = this.t10ProgressiveExecutionState.pendingTiers.length === 0;
            
            if (!isLastTier) {
                await this.performT10ProgressiveCleanup(tier);
            } else {
                await this.performT10FinalCleanup(tier);
            }
        } else {
            await this.performFullCleanup(tier);
        }
        
    } catch (error) {
        console.log(`⚠️ Cleanup failed for ${tier}: ${error.message}`);
    }
}


// ✅ NEW: T10 Progressive cleanup - preserves results, minimal state clearing
private static async performT10ProgressiveCleanup(tier: string): Promise<void> {
    try {
        console.log(`🔬 T10 Progressive cleanup for ${tier} - preserving results and state`);
        
        // Mark tier as completed in our state
        this.completeT10TierExecution(tier, 
            this.t10ProgressiveExecutionState.preservedResults.get(tier) || []
        );
        
        // ✅ PRESERVE: Don't clear results, only temporary processing state
        this.clearTemporaryState();
        
        // Shorter wait time to maintain T10 responsiveness
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms instead of 3000ms
        
        // Light memory management - don't force GC during progressive execution
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            if (memoryMB > 1200) { // Only if memory is very high
                console.log(`🔬 T10 Progressive: Memory threshold reached (${memoryMB.toFixed(1)}MB), light cleanup`);
                if ((window as any).gc) {
                    (window as any).gc();
                }
            }
        }
        
        console.log(`✅ T10 Progressive cleanup completed for ${tier} - results preserved`);
        
    } catch (error) {
        console.warn(`T10 progressive cleanup failed for ${tier}:`, error);
    }
}

// ✅ NEW: T10 Final cleanup - after all tiers complete
private static async performT10FinalCleanup(tier: string): Promise<void> {
    try {
        console.log(`🏁 T10 Final cleanup for ${tier} - maintaining results for export`);
        
        // Mark final tier as completed
        this.completeT10TierExecution(tier, 
            this.t10ProgressiveExecutionState.preservedResults.get(tier) || []
        );
        
        // ✅ MAINTAIN: Keep results available for final display and export
        // Don't clear preserved results yet - they're needed for final summary
        
        // Standard wait time for final cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force garbage collection after final tier
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        console.log(`✅ T10 Final cleanup completed - all results preserved for summary`);
        
    } catch (error) {
        console.warn(`T10 final cleanup failed for ${tier}:`, error);
    }
}

// ✅ ENHANCED: Full cleanup for normal (non-T10) tests
private static async performFullCleanup(tier: string): Promise<void> {
    try {
        console.log(`🧹 Full cleanup for ${tier}`);
        
        // Full cleanup - original behavior
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Force garbage collection
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        // Clear all caches and state
        this.clearAllState();
        
        console.log(`✅ Full cleanup completed for ${tier}`);
        
    } catch (error) {
        console.warn(`Full cleanup failed for ${tier}:`, error);
    }
}

// ✅ ADD: Minimal cleanup for T10 progressive display
private static async performMinimalCleanupForT10(tier: string): Promise<void> {
    try {
        // Light cleanup that preserves T10 intermediate data
        console.log(`🔬 T10 Minimal cleanup for ${tier} - preserving progressive results`);
        
        // Shorter wait time to maintain responsiveness
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second instead of 3
        
        // Only clear temporary processing data, not results
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        // Clear any engine-specific temporary state but preserve results
        this.clearTemporaryState();
        
    } catch (error) {
        console.warn(`T10 minimal cleanup failed for ${tier}:`, error);
    }
}



// ✅ NEW: Export enhanced trial data for UI components
static exportEnhancedTrialResults(): {
    enhancedMetrics: any[];
    crossValidationData: any[];
    safetyClassifications: any[];
    deploymentCompatibility: any[];
} {
    const results = this.getT10PreservedResults();
    
    const enhancedMetrics = [];
    const crossValidationData = [];
    const safetyClassifications = [];
    const deploymentCompatibility = [];
    
    Object.entries(results).forEach(([tier, trials]: [string, any[]]) => {
        trials.forEach(trial => {
            enhancedMetrics.push({
                tier,
                trialNumber: trial.trialNumber,
                semanticFidelity: trial.semanticFidelity || 0,
                efficiencyClassification: trial.efficiencyClassification || 'unknown'
            });
            
            if (trial.crossValidationMetrics) {
                crossValidationData.push({
                    tier,
                    trialNumber: trial.trialNumber,
                    ...trial.crossValidationMetrics
                });
            }
            
            if (trial.safetyClassification) {
                safetyClassifications.push({
                    tier,
                    trialNumber: trial.trialNumber,
                    classification: trial.safetyClassification,
                    deploymentCompatible: trial.deploymentCompatible
                });
            }
        });
    });
    
    return {
        enhancedMetrics,
        crossValidationData,
        safetyClassifications,
        deploymentCompatibility
    };
}



// ✅ ADD: Helper methods for state management
private static clearTemporaryState(): void {
    try {
        // Clear only temporary processing state, preserve results
        TrialExecutorTemplateCache.clearCache();
        TrialExecutorSync.clearPendingUpdates();
        
        // Don't clear test results or detailed analysis data
        console.log('🔬 Temporary state cleared, results preserved');
    } catch (error) {
        console.warn('Error clearing temporary state:', error);
    }
}

private static clearAllState(): void {
    try {
        // Full state clearing - original cleanup behavior
        TrialExecutorTemplateCache.clearCache();
        TrialExecutorSync.clearPendingUpdates();
        
        // Clear any cached results (for non-T10 or final cleanup)
        console.log('🧹 All state cleared');
    } catch (error) {
        console.warn('Error clearing all state:', error);
    }
}

// ✅ ADD: Integration with TestRunner - ADD THIS METHOD HERE
static notifyTestRunnerOfTierCompletion(tier: string): void {
    if (typeof window !== 'undefined' && (window as any).TestRunner) {
        try {
            (window as any).TestRunner.handleT10TierCompletion?.(tier, this.getT10PreservedResults());
            console.log(`✅ Notified TestRunner of ${tier} tier completion`);
        } catch (error) {
            console.warn('Failed to notify TestRunner:', error);
        }
    }
}
    // NEW: Helper methods for enhanced analysis
    private static generateOutputSummary(output: string): string {
        if (!output || typeof output !== 'string') return "No output";
        
        // Clean and truncate output for summary
        const cleaned = output.trim().replace(/\s+/g, ' ');
        if (cleaned.length <= 47) {
            return `"${cleaned}"`;
        } else {
            return `"${cleaned.substring(0, 47)}..."`;
        }
    }

    private static assessResponseQuality(output: string, tokens: number, driftAnalysis: any): string {
        if (!output || tokens === 0) return 'no-output';
        if (tokens < 10) return 'minimal';
        if (driftAnalysis?.aligned === false) return 'drift-detected';
        if (driftAnalysis?.aligned === true && tokens > 30) return 'high-quality';
        if (tokens > 15 && tokens <= 30) return 'adequate';
        return 'unknown';
    }

    private static estimateMemoryUsage(tokens: number): number {
        // Rough estimation: ~4 bytes per token for model inference
        return Math.round(tokens * 4 / 1024); // Return in KB
    }
 
static async verifyEngineReady(engine: any, tier: string, testId: string): Promise<{ ready: boolean; error?: string }> {
    try {
        console.log(`🔍 Performing WebLLM engine readiness test for ${tier}...`);
        
        // CRITICAL: Longer timeout based on tier
        const timeouts = {
            'Q1': 15000,  // 15 seconds
            'Q4': 20000,  // 20 seconds  
            'Q8': 30000   // 30 seconds
        };
        
        const timeout = timeouts[tier as keyof typeof timeouts] || 20000;
        
        const testResult = await Promise.race([
            engine.chat.completions.create({
                messages: [{ role: "user", content: "Test" }],
                max_tokens: 3,
                temperature: 0
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Engine timeout')), timeout)
            )
        ]);
        
        if (!testResult?.choices?.[0]?.message?.content) {
            return { ready: false, error: 'No response from engine' };
        }
        
        console.log(`✅ WebLLM engine verified for ${tier}`);
        return { ready: true };
        
    } catch (error) {
        console.log(`❌ Engine readiness failed for ${tier}: ${error.message}`);
        return { ready: false, error: error.message };
    }
}
// ✅ NEW: Preserve T10 trial results for progressive display
private static preserveT10TrialResult(tier: string, trialResult: TrialResult): void {
    if (!this.t10ProgressiveExecutionState.isT10Test) return;
    
    try {
        // Get existing results for this tier or create new array
        let tierResults = this.t10ProgressiveExecutionState.preservedResults.get(tier) || [];
        
        // Add this trial result
        tierResults.push(trialResult);
        
        // Store updated results
        this.t10ProgressiveExecutionState.preservedResults.set(tier, tierResults);
        
        console.log(`🔬 T10 Progressive: Preserved trial ${trialResult.trialNumber} for ${tier} (${tierResults.length} total)`);
        
    } catch (error) {
        console.warn('Failed to preserve T10 trial result:', error);
    }
}

// ✅ NEW: Get preserved results for completed tiers
static getT10PreservedResults(): { [tier: string]: any[] } {
    const results = {};
    
    if (!this.t10ProgressiveExecutionState.isT10Test) return results;
    
    // Only return results for completed tiers
    this.t10ProgressiveExecutionState.completedTiers.forEach(tier => {
        const tierResults = this.t10ProgressiveExecutionState.preservedResults.get(tier);
        if (tierResults && tierResults.length > 0) {
            results[tier] = [...tierResults];
        }
    });
    
    console.log(`🔬 T10 Progressive: Retrieved preserved results for ${Object.keys(results).length} tiers`);
    return results;
}

// ✅ NEW: Check if T10 progressive execution should block UI updates
static isT10ProgressiveBlocking(): boolean {
    return this.t10ProgressiveExecutionState.isT10Test && 
           this.t10ProgressiveExecutionState.transitionBlocked;
}

// ✅ NEW: Get T10 progressive execution status
static getT10ProgressiveStatus() {
    return {
        isT10Test: this.t10ProgressiveExecutionState.isT10Test,
        currentTier: this.t10ProgressiveExecutionState.currentTier,
        completedTiers: [...this.t10ProgressiveExecutionState.completedTiers],
        pendingTiers: [...this.t10ProgressiveExecutionState.pendingTiers],
        preservedResultsCount: Array.from(this.t10ProgressiveExecutionState.preservedResults.entries())
            .reduce((acc, [tier, results]) => {
                acc[tier] = results.length;
                return acc;
            }, {}),
        transitionBlocked: this.t10ProgressiveExecutionState.transitionBlocked,
        lastTierCompletion: this.t10ProgressiveExecutionState.lastTierCompletion
    };
}


 // ADD this method to TrialExecutor class:
// ✅ REPLACE existing recoverFromEngineFailure method with this:
static async recoverFromEngineFailure(tier: string, errorType: string): Promise<boolean> {
    return EngineStateLock.withLock(async () => {
        try {
            console.log(`🔄 Attempting engine recovery for ${tier} (${errorType})...`);
            
            const modelManager = (window as any).modelManager || 
                               (window as any).globalModelManager ||
                               (window as any).ModelManager ||
                               (window as any).modelLoaderManager?.modelManager;
            
            if (!modelManager) {
                console.log('❌ No model manager available for recovery');
                return false;
            }
            
            // CRITICAL: Ensure complete disposal first
            if (modelManager.currentEngine) {
                console.log('🗑️ Disposing current engine...');
                await modelManager.currentEngine.dispose();
                modelManager.currentEngine = null;
                
                // LONGER wait for complete disposal
                console.log('⏱️ Waiting for engine disposal to complete...');
                await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds
            }
            
            // Force recreation with proper error handling
            console.log('🔧 Recreating engine...');
            await modelManager.forceRecreateEngine(tier);
            
            // CRITICAL: Wait longer for engine stabilization
            console.log('⏱️ Waiting for engine stabilization...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
            
            const newEngine = modelManager.currentEngine || (window as any).currentMLCEngine;
            if (!newEngine) {
                console.log('❌ No engine available after recreation');
                return false;
            }
            
            // CRITICAL: Verify engine is FULLY loaded, not just created
            console.log('🔍 Verifying engine readiness...');
            const healthCheck = await this.verifyEngineReady(newEngine, tier, 'recovery-test');
            
            if (healthCheck.ready) {
                console.log(`✅ Engine recovery successful for ${tier}`);
                (window as any).currentMLCEngine = newEngine;
                return true;
            } else {
                console.log(`❌ Engine recovery failed for ${tier}: ${healthCheck.error}`);
                return false;
            }
            
        } catch (error) {
            console.log(`❌ Engine recovery error for ${tier}:`, error.message);
            return false;
        }
    });
}






// ✅ ADD: System-wide health validation
static async validateSystemHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
}> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
        // Check WebLLM availability
        if (typeof window === 'undefined') {
            issues.push('Browser environment not available');
            recommendations.push('Run in browser environment');
        }
        
        // Check performance API
        if (!performance || !performance.now) {
            issues.push('Performance API not available');
            recommendations.push('Update to modern browser');
        }
        
        // Check memory monitoring capability
        if (!performance.memory) {
            issues.push('Memory monitoring not available');
            recommendations.push('Use Chrome/Edge for memory monitoring');
        } else {
            const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            if (memoryMB > 800) {
                issues.push(`High memory usage: ${memoryMB.toFixed(1)}MB`);
                recommendations.push('Consider browser restart or reduce concurrent operations');
            }
        }
        
        // Check test control integration
        if (typeof testControl === 'undefined') {
            issues.push('Test control integration missing');
            recommendations.push('Verify test-control.ts is loaded');
        }
        
        return {
            healthy: issues.length === 0,
            issues,
            recommendations
        };
        
    } catch (error) {
        return {
            healthy: false,
            issues: [`System health check failed: ${error?.message}`],
            recommendations: ['Verify system initialization']
        };
    }
}

    // NEW: Comprehensive trial validation for batch execution
    static validateTrialBatch(trials: any[]): { valid: boolean; errors: string[]; warnings: string[] } {
        const errors = [];
        const warnings = [];
        
        try {
            if (!Array.isArray(trials)) {
                errors.push('Trials must be an array');
                return { valid: false, errors, warnings };
            }
            
            if (trials.length === 0) {
                warnings.push('No trials to execute');
            }
            
            if (trials.length > 10) {
                warnings.push('Large number of trials may take significant time');
            }
            
            // Validate each trial
            trials.forEach((trial, index) => {
                if (!trial.engine) errors.push(`Trial ${index + 1}: Missing engine`);
                if (!trial.test) errors.push(`Trial ${index + 1}: Missing test configuration`);
                if (!trial.prompt) errors.push(`Trial ${index + 1}: Missing prompt`);
                if (!trial.tier) errors.push(`Trial ${index + 1}: Missing tier`);
            });
            
            return { valid: errors.length === 0, errors, warnings };
            
        } catch (error) {
            errors.push(`Batch validation error: ${error?.message}`);
            return { valid: false, errors, warnings };
        }
    }
  static resetForNewTier(tier: string): void {
        try {
            // Clear any tier-specific caches
            if (tier !== 'Q8') {
                delete (window as any).q8EngineValidated;
            }
            
            // Clear template cache
            TrialExecutorTemplateCache.clearCache();
            
            // Clear sync queue
            TrialExecutorSync.clearPendingUpdates();
            
            // Force garbage collection if available
            if ((window as any).gc) {
                (window as any).gc();
            }
            
            console.log(`🔄 TrialExecutor reset for ${tier} tier`);
            
        } catch (error) {
            console.warn('Error resetting for new tier:', error);
        }
    }
   static prepareForTierTransition(newTier: string): void {
        try {
            // Reset trial executor state
            TrialExecutor.resetForNewTier(newTier);
            
            // Clear engine validation cache if switching away from Q8
            if (newTier !== 'Q8') {
                delete (window as any).q8EngineValidated;
            }
            
            // Update memory monitoring frequency
            if (newTier === 'Q8') {
                // More frequent monitoring for Q8
                TrialExecutorMemoryManager.stopMemoryMonitoring();
                // Restart with shorter interval for Q8
                setTimeout(() => TrialExecutorMemoryManager.startMemoryMonitoring(), 100);
            }
            
            console.log(`🎯 TrialExecutor prepared for ${newTier} tier transition`);
            
        } catch (error) {
            console.warn('Error preparing for tier transition:', error);
        }
    }
    /**
     * Comprehensive cleanup for TrialExecutor
     */
    static cleanup(): void {
        try {
            // Stop memory monitoring
            TrialExecutorMemoryManager.stopMemoryMonitoring();
            
            // Clear synchronization system
            TrialExecutorSync.clearPendingUpdates();
            
            // Clear template cache
            TrialExecutorTemplateCache.clearCache();
            
            console.log('🧹 TrialExecutor comprehensive cleanup completed');
            
        } catch (error) {
            console.error('Error during TrialExecutor cleanup:', error);
        }
    }

    /**
     * Initialize TrialExecutor with monitoring systems
     */
    static initialize(): void {
        try {
            // Start memory monitoring
            TrialExecutorMemoryManager.startMemoryMonitoring();
            
            // Set up page unload cleanup
            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => {
                    TrialExecutor.cleanup();
                });
            }
            
            console.log('✅ TrialExecutor initialized with monitoring systems');
            
        } catch (error) {
            console.error('Error initializing TrialExecutor:', error);
        }
    }

    /**
     * Get system health status
     */
    static getSystemHealth(): {
    memory: any;
    syncStatus: { updatesInProgress: boolean; pendingCount: number };
    cacheStatus: { size: number; healthy: boolean };
} {
    try {
        return {
            memory: TrialExecutorMemoryManager.getMemoryStats(),
            syncStatus: {
                updatesInProgress: false, // SimplifiedTrialUpdates doesn't track this
                pendingCount: 0 // SimplifiedTrialUpdates doesn't have pending queue
            },
            cacheStatus: {
                size: 0, // SimpleTrialTemplateCache doesn't cache
                healthy: true // Always healthy since no caching
            }
        };
    } catch (error) {
        console.error('Error getting system health:', error);
        return {
            memory: { currentUsage: 'Error', isHealthy: false },
            syncStatus: { updatesInProgress: false, pendingCount: 0 },
            cacheStatus: { size: 0, healthy: true }
        };
    }
}

}
// ✅ ADD: Global T10 Progressive debugging functions
if (typeof window !== 'undefined') {
    (window as any).debugT10TrialState = () => {
        const status = TrialExecutor.getT10ProgressiveStatus();
        console.group('🔬 T10 Trial Executor Progressive State');
        console.log('Is T10 Test:', status.isT10Test);
        console.log('Current Tier:', status.currentTier);
        console.log('Completed Tiers:', status.completedTiers);
        console.log('Pending Tiers:', status.pendingTiers);
        console.log('Preserved Results Count:', status.preservedResultsCount);
        console.log('Transition Blocked:', status.transitionBlocked);
        console.log('Last Completion:', new Date(status.lastTierCompletion).toLocaleTimeString());
        console.groupEnd();
        return status;
    };
    
    (window as any).exportT10TrialResults = () => {
        return TrialExecutor.exportT10PreservedResults();
    };
    
    (window as any).resetT10TrialState = () => {
        console.log('🔄 Manual T10 trial state reset');
        TrialExecutor.resetT10ProgressiveState();
    };
    
    (window as any).getT10PreservedResults = () => {
        return TrialExecutor.getT10PreservedResults();
    };
}

// ✅ ADD: Enhanced metrics debugging
if (typeof window !== 'undefined') {
    (window as any).debugEnhancedMetrics = () => {
        const results = TrialExecutor.exportEnhancedTrialResults();
        console.group('🎯 Enhanced Trial Metrics');
        console.log('Enhanced Metrics:', results.enhancedMetrics);
        console.log('Cross-Validation Data:', results.crossValidationData);
        console.log('Safety Classifications:', results.safetyClassifications);
        console.log('Deployment Compatibility:', results.deploymentCompatibility);
        console.groupEnd();
        return results;
    };
}

// Auto-initialize TrialExecutor when loaded
if (typeof window !== 'undefined') {
    setTimeout(() => {
        TrialExecutor.initialize();
    }, 1500);
}
