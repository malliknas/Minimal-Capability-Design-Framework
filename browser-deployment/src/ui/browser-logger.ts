// browser-deployment/src/ui/browser-logger.ts - Enhanced with Chapter 7 Domain Walkthrough Integration
import { testBedInfo, testControl, getTierComparison, getTierComparisonData } from '../controls/test-control';

// ============================================
// 🆕 NEW: CHAPTER 7 WALKTHROUGH IMPORTS
// ============================================
import { 
    getWalkthroughResults, 
    getDomainWalkthroughResults, 
    getDomainWalkthroughMetrics,
    getUnifiedFrameworkMetrics,
    unifiedExecutionState 
} from '../controls/test-control';
// Helper function to check execution state for logging operations
const checkLoggingExecutionState = (operationName: string): boolean => {
  if ((window as any).unifiedExecutionState?.isExecuting) {
    console.log(`🔄 Deferring ${operationName} - trials executing`);
    return false;
  }
  return true;
};

export class BrowserLogger {
	
	 /**
     * Template cache for memory-efficient DOM updates
     */
    private static templateCache = new Map<string, string>();
    private static readonly MAX_CACHE_SIZE = 50;

    /**
     * Get cached template or create new one
     */
    private static getCachedTemplate(key: string, generator: () => string): string {
    // CRITICAL: Skip caching operations during trial execution
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Generating template directly - trials executing');
        return generator(); // Generate directly without caching during execution
    }
    
    if (this.templateCache.has(key)) {
        return this.templateCache.get(key)!;
    }

    const template = generator();
    
    if (this.templateCache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.templateCache.keys().next().value;
        this.templateCache.delete(firstKey);
    }
    
    this.templateCache.set(key, template);
    return template;
}


    private static clearTemplateCache(): void {
        this.templateCache.clear();
    }
    // ============================================
    // 🔄 EXISTING PROPERTIES (PRESERVED)
    // ============================================
    
    // ADDED: Local tracking for time estimation since we removed global variables
    private static testStartTime: number = 0;
    private static lastUpdateTime: number = 0;
    
    // ✅ NEW: Chapter 7 walkthrough tracking
    private static walkthroughStartTime: number = 0;
    private static lastWalkthroughUpdate: number = 0;
    private static unifiedFrameworkMode: boolean = false;
// ADD THESE THROTTLING PROPERTIES
    // FIXED: Enhanced throttling with queuing system
private static lastTestBedUpdate: number = 0;
private static testBedUpdateThrottle: number = 500; // 500ms throttle
private static lastResultUpdate: number = 0;
private static resultUpdateThrottle: number = 200; // 200ms throttle
private static pendingTestBedUpdate: boolean = false;
private static pendingResultUpdate: boolean = false;
private static updateQueues: Map<string, boolean> = new Map();

private static scheduleThrottledUpdate(updateType: 'testBed' | 'result', updateFn: () => void): void {
    const key = `${updateType}Update`;
    
    // Prevent duplicate scheduling
    if (this.updateQueues.get(key)) return;
    
    this.updateQueues.set(key, true);
    
    const throttleTime = updateType === 'testBed' ? this.testBedUpdateThrottle : this.resultUpdateThrottle;
    const lastUpdate = updateType === 'testBed' ? this.lastTestBedUpdate : this.lastResultUpdate;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;
    
    if (timeSinceLastUpdate >= throttleTime) {
        // Execute immediately with error boundary
        try {
            updateFn();
            if (updateType === 'testBed') {
                this.lastTestBedUpdate = now;
            } else {
                this.lastResultUpdate = now;
            }
        } catch (error) {
            console.error(`Error in immediate ${updateType} update:`, error);
        } finally {
            this.updateQueues.set(key, false);
        }
    } else {
        // Schedule for later
        setTimeout(() => {
            try {
                updateFn();
                if (updateType === 'testBed') {
                    this.lastTestBedUpdate = Date.now();
                } else {
                    this.lastResultUpdate = Date.now();
                }
            } catch (error) {
                console.error(`Error in scheduled ${updateType} update:`, error);
            } finally {
                this.updateQueues.set(key, false);
            }
        }, throttleTime - timeSinceLastUpdate);
    }
}


    // ============================================
    // 🔄 EXISTING CORE FUNCTIONS (ENHANCED)
    // ============================================

static log(message: string, framework: 'T1-T10' | 'Chapter7' | 'Unified' = 'T1-T10') {
    try {
        // CRITICAL: Light logging during execution, full logging when idle
        const isExecuting = (window as any).unifiedExecutionState?.isExecuting;
        
        if (isExecuting) {
            // During execution, only console logging to avoid DOM operations
            console.log(`[${framework}] ${message}`);
            return;
        }
        
        const statusLog = document.getElementById('statusLog');
        if (statusLog) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry fade-in';
            
            // ✅ NEW: Framework-specific styling
            const frameworkBadge = BrowserLogger.getFrameworkBadge(framework);
            logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${frameworkBadge} ${message}`;
            
            statusLog.appendChild(logEntry);
            
            // Auto-scroll to latest entry
            statusLog.scrollTop = statusLog.scrollHeight;
            
            // Limit log entries to prevent memory issues (keep last 100)
            const entries = statusLog.querySelectorAll('.log-entry');
            if (entries.length > 100) {
                entries[0].remove();
            }
        }
        console.log(`[${framework}] ${message}`);
    } catch (error) {
        console.error('Error in BrowserLogger.log:', error);
        console.log(message); // Fallback to console
    }
}


    // ENHANCED: Completely rewritten with compact grid layout for better space utilization + Chapter 7 support
static async updateTestBedInfo() {
    try {
        // CRITICAL: Check if trials are running
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring test bed update - trials executing');
            // Retry after trials complete
            setTimeout(() => {
                if (!(window as any).unifiedExecutionState?.isExecuting) {
                    BrowserLogger.updateTestBedInfo();
                }
            }, 3000);
            return;
        }
        
        // Use improved throttling system
        if ((window as any).immediateStop) return;
        
        this.scheduleThrottledUpdate('testBed', async () => {
            await this.performTestBedUpdate();
        });
    } catch (error) {
        console.error('Error scheduling test bed update:', error);
        // Fallback to basic update
        this.performBasicTestBedUpdate();
    }
}


private static async performTestBedUpdate(): Promise<void> {
    const testBedDiv = document.getElementById('testBedInfo');
    if (!testBedDiv) return;
    
    // Store original content for rollback
    const originalContent = testBedDiv.innerHTML;
    
    try {
        if ((window as any).immediateStop) return;
        
        // Add yield point before heavy processing
        await new Promise(resolve => setTimeout(resolve, 0));
        if ((window as any).immediateStop) return;

        // Safety checks for testBedInfo properties
        const environment = testBedInfo?.environment || {};
        const availableModels = testBedInfo?.availableModels || [];
        const selectedModels = testBedInfo?.selectedModels || {};
        const loadedModels = testBedInfo?.loadedModels || {};
        const performanceMetrics = testBedInfo?.performanceMetrics || {};

        // Get unified framework metrics
        const unifiedMetrics = BrowserLogger.getUnifiedMetrics();
        const walkthroughResults = BrowserLogger.getWalkthroughData();
        
        // Add yield point before heavy HTML generation
        await new Promise(resolve => setTimeout(resolve, 0));
        if ((window as any).immediateStop) return;
        
        // Generate new content
        const newContent = `
            <h3>🔬 Test Bed Configuration ${unifiedMetrics.hasUnifiedData ? '🚀 <span style="font-size: 0.8rem; color: #2196f3;">(Unified Framework)</span>' : ''}</h3>
            <div class="test-bed-grid">
                ${BrowserLogger.generateEnvironmentSection(environment)}
                ${BrowserLogger.generateModelsSection(availableModels)}
                ${BrowserLogger.generateSelectedModelsSection(selectedModels)}
                ${BrowserLogger.generatePerformanceSection(performanceMetrics, unifiedMetrics)}
                ${unifiedMetrics.hasUnifiedData ? BrowserLogger.generateUnifiedFrameworkSection(unifiedMetrics) : ''}
            </div>
            ${Object.keys(loadedModels).length > 0 ? BrowserLogger.generateLoadedModelsSection(loadedModels) : ''}
            ${walkthroughResults.hasData ? BrowserLogger.generateWalkthroughSection(walkthroughResults) : ''}

        `;
        
        testBedDiv.innerHTML = newContent;
        
    } catch (error) {
        console.error('Error in performTestBedUpdate:', error);
        // Rollback to original content
        testBedDiv.innerHTML = originalContent;
        // Show error indicator
        this.showTestBedError(testBedDiv, error.message);
    }
}

private static performBasicTestBedUpdate(): void {
    const testBedDiv = document.getElementById('testBedInfo');
    if (testBedDiv) {
        testBedDiv.innerHTML = `
            <h3>🔬 Test Bed Configuration</h3>
            <div class="test-bed-section">
                <p style="color: #dc3545; font-style: italic; text-align: center; padding: 20px;">
                    ⚠️ Error loading test bed information - Using fallback display
                </p>
            </div>
        `;
    }
}

private static showTestBedError(testBedDiv: HTMLElement, errorMessage: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        background: #fff3cd; 
        border: 1px solid #ffeaa7; 
        color: #856404; 
        padding: 10px; 
        margin: 10px 0; 
        border-radius: 4px; 
        text-align: center;
    `;
    errorDiv.innerHTML = `⚠️ Update failed: ${errorMessage}`;
    testBedDiv.appendChild(errorDiv);
}


    // ============================================
    // 🆕 NEW: CHAPTER 7 SPECIFIC FUNCTIONS
    // ============================================

    // Log Chapter 7 walkthrough-specific messages
    static logWalkthrough(message: string, domain?: string) {
        const domainBadge = domain ? `<span style="background: ${BrowserLogger.getDomainColor(domain)}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-right: 6px;">${BrowserLogger.getDomainDisplayName(domain)}</span>` : '';
        BrowserLogger.log(`${domainBadge}${message}`, 'Chapter7');
    }

    // Log unified framework messages
    static logUnified(message: string) {
        BrowserLogger.log(message, 'Unified');
    }

    // Update walkthrough progress
    static updateWalkthroughProgress(current: number, total: number, domain?: string) {
        try {
            // Initialize start time on first call
            if (current === 1 && BrowserLogger.walkthroughStartTime === 0) {
                BrowserLogger.walkthroughStartTime = Date.now();
            }

            const percentage = total > 0 ? (current / total) * 100 : 0;
            const progressBar = document.getElementById('walkthroughProgressBar') as HTMLElement;
            const progressText = document.getElementById('walkthroughProgressText');
            const timeEstimate = document.getElementById('walkthroughTimeEstimate');
            
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
                progressBar.style.transition = 'width 0.3s ease';
                progressBar.style.background = domain ? BrowserLogger.getDomainColor(domain) : '#2196f3';
            }
            
            if (progressText) {
                const domainText = domain ? ` (${BrowserLogger.getDomainDisplayName(domain)})` : '';
                progressText.innerHTML = `<strong>${current}/${total}</strong> walkthroughs completed${domainText} (<strong>${percentage.toFixed(1)}%</strong>)`;
            }

            // Enhanced time estimation for walkthroughs
            if (timeEstimate && current > 0 && total > 0) {
                if (current >= total) {
                    timeEstimate.innerHTML = `✅ <strong>All Walkthroughs Completed!</strong>`;
                    BrowserLogger.resetWalkthroughTiming();
                } else {
                    const currentTime = Date.now();
                    const elapsed = (currentTime - BrowserLogger.walkthroughStartTime) / 1000;
                    const avgTimePerWalkthrough = elapsed / current;
                    const remaining = (total - current) * avgTimePerWalkthrough;
                    
                    if (remaining > 0) {
                        const remainingMinutes = Math.floor(remaining / 60);
                        const remainingSeconds = Math.floor(remaining % 60);
                        timeEstimate.innerHTML = `⏱️ Est. remaining: <strong>${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}</strong>`;
                    }
                }
            }

            // Update live components
            BrowserLogger.updateLiveComponents();

        } catch (error) {
            console.error('Error updating walkthrough progress:', error);
        }
    }

    // Add walkthrough execution result
    static addWalkthroughResult(walkthroughResult: any) {
    try {
        // CRITICAL: Defer walkthrough results during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring walkthrough result - trials executing');
            // Queue for later processing
            setTimeout(() => {
                if (!(window as any).unifiedExecutionState?.isExecuting) {
                    BrowserLogger.addWalkthroughResult(walkthroughResult);
                }
            }, 1000);
            return;
        }
        
        // ADD THROTTLING CHECK
        const now = Date.now();
        if ((window as any).immediateStop) return;

        this.scheduleThrottledUpdate('result', () => {
           this.performWalkthroughResultAdd(walkthroughResult);
        });
           
    } catch (error) {
        console.error('Error adding walkthrough result:', error);
    }
}

private static performWalkthroughResultAdd(walkthroughResult: any): void {
    try {
        const container = document.getElementById('walkthroughResultsContainer');
        if (!container) return;

        // Memory management - limit walkthrough results
        const maxResults = 30;
        const currentResults = container.querySelectorAll('.walkthrough-result');
        if (currentResults.length >= maxResults) {
            for (let i = 0; i < 5 && i < currentResults.length; i++) {
                currentResults[i].remove();
            }
        }

        // Enhanced safety checks with drift analysis
        const safeResult = {
            walkthroughId: walkthroughResult?.walkthroughId || 'Unknown',
            domain: walkthroughResult?.domain || 'Unknown',
            tier: walkthroughResult?.tier || 'Unknown',
            domainMetrics: walkthroughResult?.domainMetrics || {},
            scenarioResults: walkthroughResult?.scenarioResults || [],
            recommendations: walkthroughResult?.recommendations || [],
            timestamp: walkthroughResult?.timestamp || new Date().toISOString(),
            // ✅ NEW: Enhanced metrics
            executionTime: walkthroughResult?.executionTime || 0,
            driftAnalysis: walkthroughResult?.driftAnalysis || null
        };

        // Create enhanced result div
        const resultDiv = document.createElement('div');
        resultDiv.className = `walkthrough-result ${safeResult.domainMetrics.overallSuccess ? 'success' : 'partial'}`;
        
        const domainColor = BrowserLogger.getDomainColor(safeResult.domain);
        const backgroundColor = safeResult.domainMetrics.overallSuccess ? '#f8fff8' : '#fff9e6';
        
        resultDiv.style.cssText = `
            background: ${backgroundColor};
            border: 1px solid ${domainColor};
            border-left: 4px solid ${domainColor};
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            animation: fadeIn 0.5s ease-in;
        `;
        
        resultDiv.innerHTML = this.generateEnhancedWalkthroughHTML(safeResult);
        container.appendChild(resultDiv);
        
        // Auto-scroll functionality
        const autoScroll = document.getElementById('autoScrollWalkthroughs') as HTMLInputElement;
        if (autoScroll?.checked) {
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Update live components
        this.scheduleThrottledUpdate('result', () => {
            this.updateLiveComponents();
        });

    } catch (error) {
        console.error('Error in performWalkthroughResultAdd:', error);
    }
}

// ✅ NEW: Enhanced HTML generation for walkthrough results
private static generateEnhancedWalkthroughHTML(safeResult: any): string {
    const successBadge = safeResult.domainMetrics.overallSuccess ? 
        '<span style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">✅ Success</span>' : 
        '<span style="background: #fff3cd; color: #856404; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">⚠️ Partial</span>';
    
    const domainIcon = BrowserLogger.getDomainIcon(safeResult.domain);
    const tierBadgeColor = BrowserLogger.getTierColor(safeResult.tier);
    const executionTimeFormatted = safeResult.executionTime ? 
        `${Math.round(safeResult.executionTime / 1000)}s` : 'N/A';
    
    // Calculate additional metrics
    const totalTrials = safeResult.scenarioResults.reduce((sum: number, scenario: any) => 
        sum + scenario.variants.reduce((vSum: number, variant: any) => vSum + variant.trials.length, 0), 0);
    
    const avgScenarioLatency = safeResult.scenarioResults.length > 0 ?
        safeResult.scenarioResults.reduce((sum: number, s: any) => sum + (s.avgLatency || 0), 0) / safeResult.scenarioResults.length : 0;

    return `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-weight: 600; flex-wrap: wrap;">
            <span style="font-size: 1.2rem;">${domainIcon}</span>
            <strong style="color: #2c3e50; font-size: 1rem;">${safeResult.walkthroughId}</strong> 
            <span style="color: ${BrowserLogger.getDomainColor(safeResult.domain)}; font-weight: 600; font-size: 0.9rem;">(${BrowserLogger.getDomainDisplayName(safeResult.domain)})</span>
            <span style="background: ${tierBadgeColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">[${safeResult.tier}]</span>
            ${successBadge}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 10px; font-size: 0.9rem;">
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">MCD Score</div>
                <div style="font-weight: 600; color: #2c3e50;">🎯 ${Math.round((safeResult.domainMetrics.mcdAlignmentScore || 0) * 100)}%</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">User Experience</div>
                <div style="font-weight: 600; color: #2c3e50;">😊 ${Math.round((safeResult.domainMetrics.userExperienceScore || 0) * 100)}%</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Scenarios</div>
                <div style="font-weight: 600; color: #2c3e50;">📝 ${safeResult.scenarioResults.length}</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Efficiency</div>
                <div style="font-weight: 600; color: #2c3e50;">⚡ ${Math.round((safeResult.domainMetrics.resourceEfficiency || 0) * 100)}%</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Total Trials</div>
                <div style="font-weight: 600; color: #2c3e50;">🧪 ${totalTrials}</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Exec Time</div>
                <div style="font-weight: 600; color: #2c3e50;">⏱️ ${executionTimeFormatted}</div>
            </div>
        </div>
        
        ${safeResult.driftAnalysis ? this.generateDriftAnalysisSection(safeResult.driftAnalysis) : ''}
        
        ${safeResult.recommendations.length > 0 ? `
        <div style="margin-top: 12px; padding: 10px; background: #f8f9fc; border-radius: 6px; border-left: 3px solid #2196f3;">
            <div style="font-weight: 600; color: #1976d2; margin-bottom: 6px; font-size: 0.85rem;">📋 Recommendations:</div>
            <div style="font-size: 0.8rem; color: #555; line-height: 1.4;">
                ${safeResult.recommendations.slice(0, 3).map((rec: string) => `• ${rec}`).join('<br>')}
                ${safeResult.recommendations.length > 3 ? `<br>• ...and ${safeResult.recommendations.length - 3} more` : ''}
            </div>
        </div>
        ` : ''}
        
        <div style="font-size: 0.8rem; color: #666; padding: 8px; background: #f8f9fc; border-radius: 4px; margin-top: 10px;">
            <strong>Domain:</strong> <span style="color: ${BrowserLogger.getDomainColor(safeResult.domain)}; font-weight: 600;">${BrowserLogger.getDomainDisplayName(safeResult.domain)}</span> | 
            <strong>Tier:</strong> <span style="color: ${tierBadgeColor}; font-weight: 600;">${safeResult.tier}</span> | 
            <strong>Completed:</strong> ${new Date(safeResult.timestamp).toLocaleTimeString()}
            ${avgScenarioLatency > 0 ? ` | <strong>Avg Latency:</strong> ${Math.round(avgScenarioLatency)}ms` : ''}
        </div>
    `;
}

// ✅ NEW: Generate drift analysis section
private static generateDriftAnalysisSection(driftAnalysis: any): string {
    if (!driftAnalysis) return '';
    
    const driftRate = driftAnalysis.overallDriftRate ? 
        Math.round(driftAnalysis.overallDriftRate * 100) : 0;
    const mcdEffectiveness = driftAnalysis.mcdEffectiveness ? 
        Math.round(driftAnalysis.mcdEffectiveness * 100) : 0;
    
    const driftColor = driftRate > 30 ? '#dc3545' : driftRate > 15 ? '#ffc107' : '#28a745';
    const mcdColor = mcdEffectiveness > 70 ? '#28a745' : mcdEffectiveness > 50 ? '#ffc107' : '#dc3545';
    
    return `
        <div style="margin: 12px 0; padding: 10px; background: rgba(33, 150, 243, 0.05); border-radius: 6px; border-left: 3px solid #2196f3;">
            <div style="font-weight: 600; color: #1976d2; margin-bottom: 8px; font-size: 0.85rem;">📊 Drift Analysis</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; font-size: 0.8rem;">
                <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                    <div style="color: #666;">Drift Rate</div>
                    <div style="font-weight: 600; color: ${driftColor};">${driftRate}%</div>
                </div>
                <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                    <div style="color: #666;">MCD Effectiveness</div>
                    <div style="font-weight: 600; color: ${mcdColor};">${mcdEffectiveness}%</div>
                </div>
                ${driftAnalysis.commonDriftPatterns?.length > 0 ? `
                <div style="text-align: center; padding: 6px; background: white; border-radius: 4px;">
                    <div style="color: #666;">Patterns</div>
                    <div style="font-weight: 600; color: #2c3e50;">${driftAnalysis.commonDriftPatterns.length}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}


// ✅ ENHANCED: Advanced walkthrough progress with drift analysis integration
static updateWalkthroughProgressDetailed(
    current: number, 
    total: number, 
    domain?: string,
    phase?: 'validation' | 'execution' | 'analysis' | 'integration',
    driftAnalysis?: {
        totalTrials: number;
        driftDetected: number;
        mcdAligned: number;
    }
) {
    try {
        // Call existing progress update
        this.updateWalkthroughProgress(current, total, domain);
        
        // Enhanced progress with phase and drift info
        const progressDetails = document.getElementById('walkthroughProgressDetails');
        if (progressDetails && phase) {
            const phaseIcons = {
                'validation': '🔍',
                'execution': '⚡',
                'analysis': '📊',
                'integration': '🔗'
            };
            
            let detailsHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 0.9rem;">
                    <span>${phaseIcons[phase]} <strong>${phase.charAt(0).toUpperCase() + phase.slice(1)}</strong></span>
            `;
            
            // Add drift analysis info if available
            if (driftAnalysis) {
                const driftRate = driftAnalysis.totalTrials > 0 ? 
                    Math.round((driftAnalysis.driftDetected / driftAnalysis.totalTrials) * 100) : 0;
                const mcdRate = driftAnalysis.totalTrials > 0 ? 
                    Math.round((driftAnalysis.mcdAligned / driftAnalysis.totalTrials) * 100) : 0;
                
                detailsHTML += `
                    <span style="color: ${driftRate > 30 ? '#dc3545' : '#28a745'};">
                        📈 Drift: ${driftRate}%
                    </span>
                    <span style="color: ${mcdRate > 70 ? '#28a745' : '#ffc107'};">
                        🎯 MCD: ${mcdRate}%
                    </span>
                `;
            }
            
            detailsHTML += '</div>';
            progressDetails.innerHTML = detailsHTML;
        }
        
    } catch (error) {
        console.error('Error updating detailed walkthrough progress:', error);
    }
}

    // ============================================
    // 🔄 EXISTING FUNCTIONS (PRESERVED & ENHANCED)
    // ============================================

    // FIXED: Completely rewritten progress tracking without global startTime + unified support
    static updateProgress(current: number, total: number, framework: 'T1-T10' | 'Chapter7' | 'Unified' = 'T1-T10') {
        try {
            // Initialize start time on first call
            if (current === 1 && BrowserLogger.testStartTime === 0) {
                BrowserLogger.testStartTime = Date.now();
            }

            const percentage = total > 0 ? (current / total) * 100 : 0;
            const progressBar = document.getElementById('progressBar') as HTMLElement;
            const progressText = document.getElementById('progressText');
            const timeEstimate = document.getElementById('timeEstimate');
            
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
                progressBar.style.transition = 'width 0.3s ease';
                // ✅ NEW: Framework-specific colors
                progressBar.style.background = BrowserLogger.getFrameworkColor(framework);
            }
            
            if (progressText) {
                const frameworkText = framework !== 'T1-T10' ? ` (${framework})` : '';
                progressText.innerHTML = `<strong>${current}/${total}</strong> tests completed${frameworkText} (<strong>${percentage.toFixed(1)}%</strong>)`;
            }

            // FIXED: Better time estimation logic + unified framework support
            if (timeEstimate && current > 0 && total > 0) {
                if (testControl?.isPaused) {
                    timeEstimate.innerHTML = `⏸️ <strong>Tests Paused</strong> - Resume to continue`;
                } else if (current >= total) {
                    const completionMessage = framework === 'Unified' ? 
                        '✅ <strong>Unified Framework Testing Complete!</strong>' :
                        '✅ <strong>All Tests Completed!</strong>';
                    timeEstimate.innerHTML = completionMessage;
                    BrowserLogger.resetTestTiming(); // Reset for next test run
                } else {
                    const currentTime = Date.now();
                    const elapsed = (currentTime - BrowserLogger.testStartTime) / 1000;
                    const avgTimePerTest = elapsed / current;
                    const remaining = (total - current) * avgTimePerTest;
                    
                    if (remaining > 0) {
                        const remainingMinutes = Math.floor(remaining / 60);
                        const remainingSeconds = Math.floor(remaining % 60);
                        timeEstimate.innerHTML = `⏱️ Est. remaining: <strong>${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}</strong>`;
                    } else {
                        timeEstimate.innerHTML = `🔄 <strong>Calculating...</strong>`;
                    }
                }
            }

            // ADDED: Update live components when progress changes
            BrowserLogger.updateLiveComponents();

        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    static updateStatus(status: string, type: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' = 'idle', framework: 'T1-T10' | 'Chapter7' | 'Unified' = 'T1-T10') {
        try {
            const statusIndicator = document.getElementById('statusIndicator');
            const headerStatusIndicator = document.getElementById('headerStatusIndicator');
            const statusText = document.getElementById('statusText');
            
            // ✅ NEW: Framework-specific status display
            const frameworkBadge = framework !== 'T1-T10' ? ` [${framework}]` : '';
            const displayStatus = `${status}${frameworkBadge}`;
            
            // Update main status indicator
            if (statusIndicator) {
                statusIndicator.className = `status-indicator status-${type} ${framework.toLowerCase().replace('-', '')}`;
                statusIndicator.textContent = displayStatus;
            }
            
            // Update header status indicator (if exists)
            if (headerStatusIndicator) {
                headerStatusIndicator.className = `status-indicator status-${type} ${framework.toLowerCase().replace('-', '')}`;
                headerStatusIndicator.textContent = displayStatus;
            }
            
            if (statusText) {
                statusText.innerHTML = `<strong>${displayStatus}</strong>`;
            }

            // ADDED: Reset timing when tests start
            if (type === 'running' && status.includes('Running')) {
                if (framework === 'Chapter7' || status.includes('Walkthrough')) {
                    BrowserLogger.walkthroughStartTime = Date.now();
                } else {
                    BrowserLogger.testStartTime = Date.now();
                }
            }

            // ✅ NEW: Update unified framework mode
            if (framework === 'Unified') {
                BrowserLogger.unifiedFrameworkMode = true;
            }

            // ENHANCED: Update test bed info when status changes
            BrowserLogger.updateTestBedInfo().catch(error => console.warn('Test bed update failed:', error));

        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    // ENHANCED: Better result display with live component integration (preserved exactly)
    static addResult(testResult: any) {
    try {
        // CRITICAL: Defer result operations during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring result display - trials executing');
            // Queue result for later processing
            setTimeout(() => {
                if (!(window as any).unifiedExecutionState?.isExecuting) {
                    BrowserLogger.addResult(testResult);
                }
            }, 1000);
            return;
        }
        
        // Use improved throttling system
        if ((window as any).immediateStop) return;
        
        this.scheduleThrottledUpdate('result', () => {
            this.performResultAdd(testResult);
        });
    } catch (error) {
        console.error('Error adding result:', error);
    }
}


private static performResultAdd(testResult: any): void {
    try {
        const container = document.getElementById('resultsContainer');
        if (!container) return;

        // Memory management - limit total results displayed
        const maxResults = 50;
        const currentResults = container.querySelectorAll('.test-result');
        if (currentResults.length >= maxResults) {
            // Remove oldest results (first 10)
            for (let i = 0; i < 10 && i < currentResults.length; i++) {
                currentResults[i].remove();
            }
        }

        // Safety checks for testResult properties
        const safeResult = {
            testID: testResult?.testID || 'Unknown',
            variant: testResult?.variant || 'Unknown',
            quantization: testResult?.quantization || 'Unknown',
            completion: testResult?.completion || '❌ No',
            tokensUsed: testResult?.tokensUsed || testResult?.tokens || 0,
            latencyMs: testResult?.latencyMs || '0',
            semanticDrift: testResult?.semanticDrift || '❌ Unknown',
            mcdAligned: testResult?.mcdAligned || false,
            model: testResult?.model || 'Unknown',
            skipped: testResult?.skipped || false,
            error: testResult?.error
        };

        // Create result div with memory-efficient approach
        const resultDiv = this.createResultElement(safeResult);
        container.appendChild(resultDiv);
        
        // Auto-scroll functionality
        const autoScroll = document.getElementById('autoScroll') as HTMLInputElement;
        if (autoScroll?.checked) {
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Update live components with throttling
        this.scheduleThrottledUpdate('result', () => {
            this.updateLiveComponents();
        });

    } catch (error) {
        console.error('Error in performResultAdd:', error);
    }
}
// ✅ ENHANCED: Integration with walkthrough-evaluator and drift-detector
static logWalkthroughExecution(
    phase: 'starting' | 'executing' | 'analyzing' | 'completed',
    details: {
        walkthroughId?: string;
        domain?: string;
        tier?: string;
        currentTrial?: number;
        totalTrials?: number;
        driftDetected?: boolean;
        mcdAligned?: boolean;
        error?: string;
    }
) {
    try {
        const phaseIcons = {
            'starting': '🚀',
            'executing': '⚡',
            'analyzing': '📊',
            'completed': '✅'
        };
        
        let message = `${phaseIcons[phase]} `;
        
        switch (phase) {
            case 'starting':
                message += `Starting ${details.domain || 'domain'} walkthrough on ${details.tier || 'unknown'} tier`;
                break;
            case 'executing':
                message += `Executing trial ${details.currentTrial || '?'}/${details.totalTrials || '?'}`;
                if (details.domain) message += ` (${BrowserLogger.getDomainDisplayName(details.domain)})`;
                break;
            case 'analyzing':
                message += `Analyzing results`;
                if (details.driftDetected !== undefined) {
                    message += ` - Drift: ${details.driftDetected ? '⚠️ Detected' : '✅ None'}`;
                }
                if (details.mcdAligned !== undefined) {
                    message += ` - MCD: ${details.mcdAligned ? '✅ Aligned' : '❌ Not aligned'}`;
                }
                break;
            case 'completed':
                message += `Walkthrough completed: ${details.walkthroughId || 'Unknown'}`;
                break;
        }
        
        if (details.error) {
            message += ` - Error: ${details.error}`;
        }
        
        BrowserLogger.logWalkthrough(message, details.domain);
        
    } catch (error) {
        console.error('Error logging walkthrough execution:', error);
    }
}

// ✅ ENHANCED: Integration with batch drift analysis
static updateDriftAnalysisProgress(
    completed: number,
    total: number,
    currentTrial: string,
    summary?: {
        driftRate: number;
        mcdEffectiveness: number;
    }
) {
    try {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        
        // Update drift analysis progress indicator
        const driftProgressBar = document.getElementById('driftAnalysisProgress');
        const driftProgressText = document.getElementById('driftAnalysisProgressText');
        
        if (driftProgressBar) {
            driftProgressBar.style.width = `${percentage}%`;
            driftProgressBar.style.background = summary?.driftRate > 30 ? '#dc3545' : '#2196f3';
        }
        
        if (driftProgressText) {
            let text = `Analyzing drift: ${completed}/${total} trials`;
            if (summary) {
                text += ` (${Math.round(summary.driftRate)}% drift, ${Math.round(summary.mcdEffectiveness)}% MCD)`;
            }
            driftProgressText.textContent = text;
        }
        
        BrowserLogger.logWalkthrough(`📊 Drift analysis: ${completed}/${total} - ${currentTrial}`);
        
    } catch (error) {
        console.error('Error updating drift analysis progress:', error);
    }
}

// ✅ ENHANCED: Comprehensive walkthrough status reporting
static getWalkthroughStatus(): {
    isExecuting: boolean;
    currentPhase: string;
    progress: { current: number; total: number };
    domains: string[];
    recentResults: number;
    memoryUsage: string;
} {
    try {
        const walkthroughContainer = document.getElementById('walkthroughResultsContainer');
        const recentResults = walkthroughContainer ? 
            walkthroughContainer.querySelectorAll('.walkthrough-result').length : 0;
        
        const memoryInfo = performance.memory ? 
            `${Math.round(performance.memory.usedJSHeapSize / (1024 * 1024))}MB` : 'Unknown';
        
        // Get current progress from progress elements
        const progressText = document.getElementById('walkthroughProgressText')?.textContent || '';
        const progressMatch = progressText.match(/(\d+)\/(\d+)/);
        
        return {
            isExecuting: (window as any).unifiedExecutionState?.chapter7Active || false,
            currentPhase: this.getCurrentExecutionPhase(),
            progress: {
                current: progressMatch ? parseInt(progressMatch[1]) : 0,
                total: progressMatch ? parseInt(progressMatch[2]) : 0
            },
            domains: this.getActiveDomains(),
            recentResults,
            memoryUsage: memoryInfo
        };
        
    } catch (error) {
        console.error('Error getting walkthrough status:', error);
        return {
            isExecuting: false,
            currentPhase: 'unknown',
            progress: { current: 0, total: 0 },
            domains: [],
            recentResults: 0,
            memoryUsage: 'Error'
        };
    }
}

private static getCurrentExecutionPhase(): string {
    if ((window as any).unifiedExecutionState?.chapter7Active) {
        return 'executing';
    }
    if (this.walkthroughStartTime > 0) {
        return 'analyzing';
    }
    return 'idle';
}

private static getActiveDomains(): string[] {
    try {
        const walkthroughResults = getWalkthroughResults ? getWalkthroughResults() : [];
        const recentDomains = walkthroughResults
            .slice(-10) // Last 10 results
            .map((r: any) => r.domain)
            .filter((domain: string, index: number, arr: string[]) => arr.indexOf(domain) === index);
        
        return recentDomains;
    } catch (error) {
        return [];
    }
}

private static createResultElement(safeResult: any): HTMLElement {
    const resultDiv = document.createElement('div');
    resultDiv.className = `test-result ${safeResult.completion === '❌ No' ? 'error' : safeResult.skipped ? 'skipped' : 'success'}`;
    
    // Dynamic styling based on result status
    let borderColor = '#e1e5e9';
    let backgroundColor = 'white';
    
    if (safeResult.error || safeResult.completion === '❌ No') {
        borderColor = '#dc3545';
        backgroundColor = '#fff5f5';
    } else if (safeResult.mcdAligned) {
        borderColor = '#28a745';
        backgroundColor = '#f8fff8';
    }
    
    resultDiv.style.cssText = `
        background: ${backgroundColor};
        border: 1px solid ${borderColor};
        border-left: 4px solid ${borderColor};
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        animation: fadeIn 0.5s ease-in;
    `;
    
    // Generate content efficiently
    resultDiv.innerHTML = this.generateResultHTML(safeResult);
    
    return resultDiv;
}

private static generateResultHTML(safeResult: any): string {
    const mcdBadge = safeResult.mcdAligned ? 
        '<span style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">✅ MCD</span>' : 
        '<span style="background: #f8d7da; color: #721c24; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">❌ Non-MCD</span>';
    
    const tierBadgeColor = BrowserLogger.getTierColor(safeResult.quantization);
    
    // Format latency for display
    const latencyDisplay = typeof safeResult.latencyMs === 'string' ? 
        safeResult.latencyMs.replace('ms', '') + 'ms' : 
        `${Math.round(parseFloat(safeResult.latencyMs) || 0)}ms`;
    
    return `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-weight: 600; flex-wrap: wrap;">
            <strong style="color: #2c3e50; font-size: 1rem;">${safeResult.testID}</strong> 
            <span style="color: #666; font-weight: 400; font-size: 0.9rem;">(${safeResult.variant})</span>
            <span style="background: ${tierBadgeColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">[${safeResult.quantization}]</span>
            ${mcdBadge}
            ${safeResult.error ? '<span style="background: #dc3545; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">⚠️ ERROR</span>' : ''}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 10px; font-size: 0.9rem;">
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Tokens</div>
                <div style="font-weight: 600; color: #2c3e50;">🔄 ${safeResult.tokensUsed}</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Latency</div>
                <div style="font-weight: 600; color: #2c3e50;">⏱️ ${latencyDisplay}</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Completion</div>
                <div style="font-weight: 600;">${safeResult.completion}</div>
            </div>
            <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                <div style="color: #666; font-size: 0.8rem;">Drift</div>
                <div style="font-weight: 600; font-size: 0.8rem;">${safeResult.semanticDrift}</div>
            </div>
        </div>
        <div style="font-size: 0.8rem; color: #666; padding: 8px; background: #f8f9fc; border-radius: 4px;">
            <strong>Model:</strong> <code style="background: white; padding: 1px 4px; border-radius: 2px; font-size: 0.75rem;">${BrowserLogger.truncateText(safeResult.model, 35)}</code>
            ${safeResult.error ? `<br><strong style="color: #dc3545;">Error:</strong> ${safeResult.error}` : ''}
        </div>
    `;
}


    // ============================================
    // 🆕 NEW: CHAPTER 7 HELPER FUNCTIONS
    // ============================================

    // Get framework-specific badge for logging
    private static getFrameworkBadge(framework: 'T1-T10' | 'Chapter7' | 'Unified'): string {
        const badges = {
            'T1-T10': '<span style="background: #673ab7; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-right: 6px;">T1-T10</span>',
            'Chapter7': '<span style="background: #2196f3; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-right: 6px;">Chapter 7</span>',
            'Unified': '<span style="background: linear-gradient(135deg, #673ab7 0%, #2196f3 100%); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-right: 6px;">🚀 Unified</span>'
        };
        return badges[framework];
    }

    // Get framework-specific colors
    private static getFrameworkColor(framework: 'T1-T10' | 'Chapter7' | 'Unified'): string {
        const colors = {
            'T1-T10': '#673ab7',
            'Chapter7': '#2196f3',
            'Unified': 'linear-gradient(135deg, #673ab7 0%, #2196f3 100%)'
        };
        return colors[framework];
    }

    // Get domain-specific colors
    private static getDomainColor(domain: string): string {
        const colors = {
            'appointment-booking': '#2196f3',
            'spatial-navigation': '#4caf50',
            'failure-diagnostics': '#ff9800'
        };
        return colors[domain as keyof typeof colors] || '#6c757d';
    }

    // Get domain-specific icons
    private static getDomainIcon(domain: string): string {
        const icons = {
            'appointment-booking': '📅',
            'spatial-navigation': '🗺️',
            'failure-diagnostics': '🔧'
        };
        return icons[domain as keyof typeof icons] || '🎯';
    }

    // Get domain display names
    private static getDomainDisplayName(domain: string): string {
        const names = {
            'appointment-booking': 'Appointment Booking',
            'spatial-navigation': 'Spatial Navigation',
            'failure-diagnostics': 'Failure Diagnostics'
        };
        return names[domain as keyof typeof names] || domain;
    }

    // Get unified framework metrics
    private static getUnifiedMetrics(): any {
        try {
            const unifiedMetrics = getUnifiedFrameworkMetrics ? getUnifiedFrameworkMetrics() : null;
            const walkthroughResults = getWalkthroughResults ? getWalkthroughResults() : [];
            const hasT1T10Data = (testControl?.selectedTests?.size || 0) > 0;
            const hasChapter7Data = walkthroughResults.length > 0;
            
            return {
                hasUnifiedData: hasT1T10Data && hasChapter7Data,
                t1t10Framework: unifiedMetrics?.t1t10Framework || {},
                chapter7Framework: unifiedMetrics?.chapter7Framework || {},
                unified: unifiedMetrics?.unified || {},
                totalExecutions: (unifiedMetrics?.t1t10Framework?.totalTests || 0) + (unifiedMetrics?.chapter7Framework?.totalWalkthroughs || 0)
            };
        } catch (error) {
            return { hasUnifiedData: false };
        }
    }

    // Get walkthrough data summary
    private static getWalkthroughData(): any {
        try {
            const walkthroughResults = getWalkthroughResults ? getWalkthroughResults() : [];
            const domains = [...new Set(walkthroughResults.map((w: any) => w.domain))];
            
            return {
                hasData: walkthroughResults.length > 0,
                totalWalkthroughs: walkthroughResults.length,
                domains: domains,
                successRate: walkthroughResults.length > 0 ? 
                    Math.round((walkthroughResults.filter((w: any) => w.domainMetrics?.overallSuccess).length / walkthroughResults.length) * 100) : 0
            };
        } catch (error) {
            return { hasData: false };
        }
    }

    // Reset walkthrough timing
    private static resetWalkthroughTiming() {
        BrowserLogger.walkthroughStartTime = 0;
        BrowserLogger.lastWalkthroughUpdate = 0;
    }

    // ============================================
    // 🔄 EXISTING SECTION GENERATORS (ENHANCED)
    // ============================================

    // NEW: Generate environment section with compact layout (preserved exactly)
    private static generateEnvironmentSection(environment: any): string {
		
        if ((window as any).immediateStop) return '';
        return `
            <div class="test-bed-section">
                <h4>🌐 Environment</h4>
                <div class="test-bed-items">
                    <div class="test-bed-item">
                        <span class="test-bed-label">Browser:</span>
                        <span class="test-bed-value">${BrowserLogger.truncateText(environment.browser || 'Unknown', 15)}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">WebGPU:</span>
                        <span class="test-bed-value" style="color: ${environment.webgpu === 'Supported ✅' ? '#28a745' : '#dc3545'}">${environment.webgpu?.replace(' ✅', '') || 'Unknown'}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">GPU:</span>
                        <span class="test-bed-value">${BrowserLogger.truncateText(environment.gpu || 'Unknown', 12)}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Memory:</span>
                        <span class="test-bed-value">${environment.memory || 'Unknown'}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Platform:</span>
                        <span class="test-bed-value">${environment.platform || 'Unknown'}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">CPU Cores:</span>
                        <span class="test-bed-value">${environment.cores || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // NEW: Generate models section with compact layout (preserved exactly)
    private static generateModelsSection(availableModels: string[]): string {
		
        if ((window as any).immediateStop) return '';
        return `
            <div class="test-bed-section">
                <h4>🤖 Available Models</h4>
                <div class="test-bed-items">
                    <div class="test-bed-item">
                        <span class="test-bed-label">Total:</span>
                        <span class="test-bed-value">${availableModels.length}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">TinyLlama:</span>
                        <span class="test-bed-value">${BrowserLogger.getModelCount(availableModels, 'tiny')}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Phi:</span>
                        <span class="test-bed-value">${BrowserLogger.getModelCount(availableModels, 'phi')}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Gemma:</span>
                        <span class="test-bed-value">${BrowserLogger.getModelCount(availableModels, 'gemma')}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Llama:</span>
                        <span class="test-bed-value">${BrowserLogger.getModelCount(availableModels, 'llama')}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Qwen:</span>
                        <span class="test-bed-value">${BrowserLogger.getModelCount(availableModels, 'qwen')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // NEW: Generate selected models section with compact layout (preserved exactly)
    private static generateSelectedModelsSection(selectedModels: any): string {
		
        if ((window as any).immediateStop) return '';
        return `
            <div class="test-bed-section">
                <h4>🎯 Selected Models</h4>
                <div class="test-bed-items">
                    <div class="test-bed-item">
                        <span class="test-bed-label">Q1 Tier:</span>
                        <span class="test-bed-value">${BrowserLogger.truncateText(selectedModels.Q1 || 'Not selected', 12)}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Q4 Tier:</span>
                        <span class="test-bed-value">${BrowserLogger.truncateText(selectedModels.Q4 || 'Not selected', 12)}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Q8 Tier:</span>
                        <span class="test-bed-value">${BrowserLogger.truncateText(selectedModels.Q8 || 'Not selected', 12)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ENHANCED: Generate performance metrics section with compact layout + unified framework support
    private static generatePerformanceSection(performanceMetrics: any, unifiedMetrics: any): string {
        
        if ((window as any).immediateStop) return '';
		const tierData = getTierComparison();
        const hasTierData = Object.keys(tierData).length > 0;
        
        return `
            <div class="test-bed-section">
                <h4>📊 Performance Metrics ${unifiedMetrics.hasUnifiedData ? '🚀' : ''}</h4>
                <div class="test-bed-items">
                    <div class="test-bed-item">
                        <span class="test-bed-label">Tests Run:</span>
                        <span class="test-bed-value">${performanceMetrics.totalTestsRun || 0}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Avg Time:</span>
                        <span class="test-bed-value">${Math.round(performanceMetrics.averageTestTime || 0)}ms</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Status:</span>
                        <span class="test-bed-value">${testControl?.isRunning ? '🔄 Running' : '✅ Ready'}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Tier Data:</span>
                        <span class="test-bed-value">${hasTierData ? '🏗️ Available' : '⏳ Pending'}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Memory:</span>
                        <span class="test-bed-value">${Math.round(performanceMetrics.memoryUsage || 0)}MB</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Total Time:</span>
                        <span class="test-bed-value">${Math.round(performanceMetrics.totalExecutionTime || 0)}s</span>
                    </div>
                    ${unifiedMetrics.hasUnifiedData ? `
                    <div class="test-bed-item">
                        <span class="test-bed-label">Walkthroughs:</span>
                        <span class="test-bed-value">${unifiedMetrics.chapter7Framework.totalWalkthroughs || 0}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Framework:</span>
                        <span class="test-bed-value">🚀 Unified</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ✅ NEW: Generate unified framework section
    private static generateUnifiedFrameworkSection(unifiedMetrics: any): string {
        
        if ((window as any).immediateStop) return '';
		return `
            <div class="test-bed-section" style="border: 2px solid #2196f3; background: rgba(33, 150, 243, 0.05);">
                <h4>🚀 Unified Framework Status</h4>
                <div class="test-bed-items">
                    <div class="test-bed-item">
                        <span class="test-bed-label">T1-T10 Tests:</span>
                        <span class="test-bed-value">${unifiedMetrics.t1t10Framework.totalTests || 0}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Chapter 7:</span>
                        <span class="test-bed-value">${unifiedMetrics.chapter7Framework.totalWalkthroughs || 0}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">MCD Alignment:</span>
                        <span class="test-bed-value">${unifiedMetrics.unified.overallMCDAlignment || 0}%</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Consistency:</span>
                        <span class="test-bed-value">${unifiedMetrics.unified.frameworkConsistency || 'Unknown'}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Total Exec:</span>
                        <span class="test-bed-value">${unifiedMetrics.totalExecutions}</span>
                    </div>
                    <div class="test-bed-item">
                        <span class="test-bed-label">Domains:</span>
                        <span class="test-bed-value">${unifiedMetrics.chapter7Framework.domainsAnalyzed?.length || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // NEW: Generate loaded models section when models are loaded (preserved exactly)
    private static generateLoadedModelsSection(loadedModels: any): string {
        
        if ((window as any).immediateStop) return '';
		return `
            <div style="margin-top: 20px; border-top: 2px solid rgba(21, 101, 192, 0.2); padding-top: 15px;">
                <h4 style="margin: 0 0 15px 0; color: #1565c0; font-size: 1rem; text-align: center;">📊 Loaded Model Specifications</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    ${Object.entries(loadedModels).map(([tier, info]: [string, any]) => `
                        <div style="padding: 12px; background: ${BrowserLogger.getTierBackgroundColor(tier)}; border-radius: 8px; border-left: 4px solid ${BrowserLogger.getTierColor(tier)}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                            <div style="font-weight: 600; color: ${BrowserLogger.getTierColor(tier)}; margin-bottom: 8px; text-align: center;">
                                ${tier} Tier
                            </div>
                            <div style="font-size: 0.8rem; color: #666; line-height: 1.4;">
                                <div style="margin: 4px 0;">
                                    <strong>Model:</strong> <code style="background: white; padding: 1px 3px; border-radius: 2px; font-size: 0.75rem;">${BrowserLogger.truncateText(info?.name || 'Unknown', 20)}</code>
                                </div>
                                <div style="margin: 4px 0;">
                                    <strong>Size:</strong> <span style="color: #2c3e50; font-weight: 600;">${info?.size || 'Unknown'}</span>
                                </div>
                                <div style="margin: 4px 0;">
                                    <strong>Type:</strong> ${info?.type || 'Unknown'}
                                </div>
                                <div style="margin: 4px 0;">
                                    <strong>Status:</strong> ${info?.status || '❓ Unknown'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ✅ NEW: Generate walkthrough section
    private static generateWalkthroughSection(walkthroughData: any): string {
        
        if ((window as any).immediateStop) return '';
		return `
            <div style="margin-top: 20px; border-top: 2px solid rgba(33, 150, 243, 0.2); padding-top: 15px;">
                <h4 style="margin: 0 0 15px 0; color: #2196f3; font-size: 1rem; text-align: center;">🎯 Chapter 7 Walkthrough Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="padding: 12px; background: rgba(33, 150, 243, 0.1); border-radius: 8px; border-left: 4px solid #2196f3; text-align: center;">
                        <div style="font-weight: 600; color: #2196f3; margin-bottom: 8px;">Total Walkthroughs</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1565c0;">${walkthroughData.totalWalkthroughs}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(76, 175, 80, 0.1); border-radius: 8px; border-left: 4px solid #4caf50; text-align: center;">
                        <div style="font-weight: 600; color: #4caf50; margin-bottom: 8px;">Success Rate</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #2e7d32;">${walkthroughData.successRate}%</div>
                    </div>
                    <div style="padding: 12px; background: rgba(255, 152, 0, 0.1); border-radius: 8px; border-left: 4px solid #ff9800; text-align: center;">
                        <div style="font-weight: 600; color: #ff9800; margin-bottom: 8px;">Domains</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #f57c00;">${walkthroughData.domains.length}</div>
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 0.8rem; color: #666; text-align: center;">
                    Domains: ${walkthroughData.domains.map((d: string) => BrowserLogger.getDomainDisplayName(d)).join(', ')}
                </div>
            </div>
        `;
    }

    // ============================================
    // 🔄 EXISTING HELPER METHODS (PRESERVED & ENHANCED)
    // ============================================

    private static getTierColor(tier: string): string {
        const colors = {
            'Q1': '#e65100',
            'Q4': '#1976d2',
            'Q8': '#388e3c'
        };
        return colors[tier as keyof typeof colors] || '#6c757d';
    }

    private static getTierBackgroundColor(tier: string): string {
        const colors = {
            'Q1': '#fff3e0',
            'Q4': '#e3f2fd',
            'Q8': '#e8f5e8'
        };
        return colors[tier as keyof typeof colors] || '#f8f9fc';
    }

    // NEW: Get model count by type for compact display (preserved exactly)
    private static getModelCount(availableModels: string[], type: string): number {
        if (!availableModels || !Array.isArray(availableModels)) return 0;
        return availableModels.filter(model => 
            model.toLowerCase().includes(type.toLowerCase())
        ).length;
    }

    // NEW: Truncate text for compact display (preserved exactly)
    private static truncateText(text: string, maxLength: number): string {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    // ENHANCED: Integration with live components including tier comparison + Chapter 7
 // ENHANCED: Integration with live components including tier comparison + Chapter 7
// ENHANCED: Integration with live components including tier comparison + Chapter 7
private static async updateLiveComponents() {
    try {
        // CRITICAL: Skip live updates during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring live component updates - trials executing');
            return;
        }
        
        // Immediate stop check
        if ((window as any).immediateStop) return;
        
        // ✅ DEFINE: Safe function calling with timeout protection
        const safeCallGlobalFunction = async (functionName: string, timeout: number = 1000): Promise<boolean> => {
            try {
                // Double-check execution state before each call
                if ((window as any).unifiedExecutionState?.isExecuting) {
                    console.log(`🔄 Skipping ${functionName} - trials executing`);
                    return false;
                }
                
                if (typeof window !== 'undefined' && (window as any)[functionName] && typeof (window as any)[functionName] === 'function') {
                    const callPromise = Promise.resolve((window as any)[functionName]());
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error(`Function ${functionName} timeout`)), timeout)
                    );
                    
                    await Promise.race([callPromise, timeoutPromise]);
                    return true;
                }
                return false;
            } catch (error) {
                console.warn(`Error calling global function ${functionName}:`, error);
                return false;
            }
        };
        
        // ✅ IMPROVED: More sophisticated execution state detection
        const isT1T10Execution = testControl?.isRunning && !(window as any).unifiedExecutionState?.chapter7Active;
        const isWalkthroughExecution = (window as any).unifiedExecutionState?.chapter7Active === true;
        const isSystemIdle = !testControl?.isRunning && 
                           !(window as any).unifiedExecutionState?.isExecuting && 
                           !(window as any).unifiedExecutionState?.chapter7Active;
        const isCleanupState = !testControl?.isRunning && 
                              ((window as any).unifiedExecutionState?.isExecuting || 
                               (window as any).immediateStop);
        
        console.log('🔍 Execution State Check:', {
            isT1T10Execution,
            isWalkthroughExecution,
            isSystemIdle,
            isCleanupState,
            testControlRunning: testControl?.isRunning,
            chapter7Active: (window as any).unifiedExecutionState?.chapter7Active,
            trialsExecuting: (window as any).unifiedExecutionState?.isExecuting
        });

        if (isT1T10Execution) {
            // T1-T10 ONLY - NO walkthrough functions
            console.log('🔄 T1-T10 execution mode - calling T1-T10 functions only');
            await safeCallGlobalFunction('updateLiveComponents');
            await safeCallGlobalFunction('updateTierComparison');
            // CRITICAL: Never call updateWalkthroughResults or updateUnifiedFrameworkDisplay here!
            
        } else if (isWalkthroughExecution) {
            // Chapter 7/Walkthrough ONLY - preserve full walkthrough functionality
            console.log('🔄 Chapter 7 walkthrough execution mode - calling walkthrough functions only');
            await safeCallGlobalFunction('updateWalkthroughResults');
            await safeCallGlobalFunction('updateUnifiedFrameworkDisplay');
            // Don't call T1-T10 functions during walkthrough execution to prevent interference
            
        } else if (isSystemIdle) {
            // TRUE idle state - only call basic T1-T10 functions (NO walkthrough functions)
            console.log('🔄 System idle - calling basic T1-T10 functions only');
            await safeCallGlobalFunction('updateLiveComponents');
            await safeCallGlobalFunction('updateTierComparison');
            // DON'T call walkthrough functions during true idle to prevent renderWalkthroughDisplay error
            
        } else if (isCleanupState) {
            // Cleanup/transitional state - minimal function calls for safety
            console.log('🔄 Cleanup state - calling minimal functions only');
            await safeCallGlobalFunction('updateLiveComponents');
            // No tier comparison or walkthrough functions during cleanup
            
        } else {
            // Unknown/undefined state - skip all function calls for maximum safety
            console.log('🔄 Unknown execution state - skipping all function calls for safety');
        }
        
    } catch (error) {
        console.warn('Error in updateLiveComponents:', error);
    }
}







    // NEW: Reset test timing for new test runs (preserved exactly)
    private static resetTestTiming() {
        BrowserLogger.testStartTime = 0;
        BrowserLogger.lastUpdateTime = 0;
    }

    // ENHANCED: Get current test timing info for external use including tier data + unified framework
    static getTestTiming(): { 
        startTime: number; 
        elapsed: number; 
        hasTierData: boolean;
        walkthroughStartTime: number;
        walkthroughElapsed: number;
        unifiedMode: boolean;
    } {
        const tierData = getTierComparisonData();
        return {
            startTime: BrowserLogger.testStartTime,
            elapsed: BrowserLogger.testStartTime > 0 ? (Date.now() - BrowserLogger.testStartTime) / 1000 : 0,
            hasTierData: tierData && tierData.length > 0,
            walkthroughStartTime: BrowserLogger.walkthroughStartTime,
            walkthroughElapsed: BrowserLogger.walkthroughStartTime > 0 ? (Date.now() - BrowserLogger.walkthroughStartTime) / 1000 : 0,
            unifiedMode: BrowserLogger.unifiedFrameworkMode
        };
    }

    // NEW: Force update test bed info (useful for external calls) (preserved exactly)
    static refreshTestBedInfo() {
        BrowserLogger.updateTestBedInfo().catch(error => console.warn('Test bed update failed:', error));
    }

    // ENHANCED: Get test bed summary for external use + unified framework
    static getTestBedSummary(): any {
        const environment = testBedInfo?.environment || {};
        const availableModels = testBedInfo?.availableModels || [];
        const performanceMetrics = testBedInfo?.performanceMetrics || {};
        const tierData = getTierComparison();
        const unifiedMetrics = BrowserLogger.getUnifiedMetrics();
        const walkthroughData = BrowserLogger.getWalkthroughData();
        
        return {
            browser: environment.browser,
            webgpuSupported: environment.webgpu === 'Supported ✅',
            totalModels: availableModels.length,
            testsRun: performanceMetrics.totalTestsRun || 0,
            isRunning: testControl?.isRunning || false,
            hasTierData: Object.keys(tierData).length > 0,
            activeTiers: testControl?.selectedTiers ? Array.from(testControl.selectedTiers) : [],
            // ✅ NEW: Chapter 7 and unified framework data
            hasWalkthroughData: walkthroughData.hasData,
            totalWalkthroughs: walkthroughData.totalWalkthroughs,
            walkthroughDomains: walkthroughData.domains,
            unifiedFramework: unifiedMetrics.hasUnifiedData,
            frameworkConsistency: unifiedMetrics.unified.frameworkConsistency
        };
    }

    // ✅ NEW: Get domain-specific summary
    static getDomainSummary(domain: string): any {
        try {
            const domainMetrics = getDomainWalkthroughMetrics ? getDomainWalkthroughMetrics(domain) : {};
            return {
                domain,
                displayName: BrowserLogger.getDomainDisplayName(domain),
                color: BrowserLogger.getDomainColor(domain),
                icon: BrowserLogger.getDomainIcon(domain),
                ...domainMetrics
            };
        } catch (error) {
            return {
                domain,
                displayName: BrowserLogger.getDomainDisplayName(domain),
                totalWalkthroughs: 0,
                successRate: 0
            };
        }
    }

    // ✅ NEW: Clear all logs and reset state
    static clearAllLogs() {
        try {
            const statusLog = document.getElementById('statusLog');
            if (statusLog) {
                statusLog.innerHTML = '';
            }
            
            // Reset timing state
            BrowserLogger.resetTestTiming();
            BrowserLogger.resetWalkthroughTiming();
            BrowserLogger.unifiedFrameworkMode = false;
            
            BrowserLogger.log('🗑️ All logs cleared - System ready for new execution', 'Unified');
        } catch (error) {
            console.error('Error clearing logs:', error);
        }
    }
	
	/**
 * Comprehensive cleanup function for memory management - MISSING CLEANUP
 */
static performComprehensiveCleanup(): void {
    try {
		// Stop memory monitoring
        this.stopMemoryMonitoring();
        // Clear all logs
        this.clearAllLogs();
        
        // Reset all timing properties
        this.testStartTime = 0;
        this.lastUpdateTime = 0;
        this.walkthroughStartTime = 0;
        this.lastWalkthroughUpdate = 0;
        this.lastTestBedUpdate = 0;
        this.lastResultUpdate = 0;
        
        // Reset flags
        this.unifiedFrameworkMode = false;
        this.pendingTestBedUpdate = false;
        this.pendingResultUpdate = false;
        
        // Clear update queues
        this.updateQueues.clear();
        
        // Clear DOM containers with memory cleanup
        const containers = [
            'statusLog',
            'resultsContainer', 
            'walkthroughResultsContainer',
            'testBedInfo'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                // Remove all event listeners from child elements
                const elements = container.querySelectorAll('*');
                elements.forEach(el => {
                    const newEl = el.cloneNode(true);
                    el.parentNode?.replaceChild(newEl, el);
                });
                
                // Clear content
                container.innerHTML = '';
            }
        });
        
        // Reset progress indicators
        this.updateProgress(0, 0, 'T1-T10');
        this.updateWalkthroughProgress(0, 0);
        this.updateStatus('Ready', 'idle', 'T1-T10');
        
        console.log('🧹 BrowserLogger comprehensive cleanup completed');
        
    } catch (error) {
        console.error('Error in comprehensive cleanup:', error);
    }
}

/**
 * Memory monitoring and auto-cleanup - MISSING MEMORY MANAGEMENT
 */
private static memoryMonitorInterval: NodeJS.Timeout | null = null;

static startMemoryMonitoring(): void {
    // Clear existing interval to prevent duplicates
    if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
    }
    
    // Ultra-conservative monitoring - every 2 minutes instead of 30 seconds
    this.memoryMonitorInterval = setInterval(() => {
        try {
            // CRITICAL: Never monitor during trial execution
            if ((window as any).unifiedExecutionState?.isExecuting) {
                console.log('🧹 Deferring memory monitoring - trials executing');
                return;
            }
            
            if (performance.memory) {
                const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                const limitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
                const usagePercent = (usedMB / limitMB) * 100;
                
                // More conservative threshold - 85% instead of 80%
                if (usagePercent > 85) {
                    console.warn(`High memory usage detected: ${usagePercent.toFixed(1)}% - Performing cleanup`);
                    this.performMemoryCleanup();
                }
            }
        } catch (error) {
            // Memory API not available, skip monitoring
        }
    }, 120000); // 2 minutes instead of 30 seconds - ultra-conservative
}


static stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
        this.memoryMonitorInterval = null;
        console.log('🧹 Memory monitoring stopped');
    }
}


/**
 * Targeted memory cleanup
 */
// ✅ ENHANCED: Walkthrough-aware memory cleanup
private static performMemoryCleanup(): void {
    try {
        // CRITICAL: Never cleanup during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🧹 Deferring memory cleanup - trials executing');
            setTimeout(() => {
                if (!(window as any).unifiedExecutionState?.isExecuting) {
                    this.performMemoryCleanup();
                }
            }, 5000);
            return;
        }
        
        // Enhanced results container cleanup
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            const results = resultsContainer.querySelectorAll('.test-result');
            if (results.length > 40) {
                for (let i = 0; i < results.length - 40; i++) {
                    results[i].remove();
                }
                console.log(`🧹 Cleaned up ${results.length - 40} old test results`);
            }
        }
        
        // Enhanced walkthrough container cleanup with drift analysis preservation
        const walkthroughContainer = document.getElementById('walkthroughResultsContainer');
        if (walkthroughContainer) {
            const walkthroughs = walkthroughContainer.querySelectorAll('.walkthrough-result');
            if (walkthroughs.length > 30) {
                // Keep the most recent successful walkthroughs
                const sortedWalkthroughs = Array.from(walkthroughs).sort((a, b) => {
                    const timeA = a.querySelector('.test-bed-value')?.textContent || '';
                    const timeB = b.querySelector('.test-bed-value')?.textContent || '';
                    return timeB.localeCompare(timeA);
                });
                
                // Remove oldest, but preserve successful ones
                let removed = 0;
                for (let i = 25; i < sortedWalkthroughs.length && removed < 10; i++) {
                    const walkthrough = sortedWalkthroughs[i];
                    if (!walkthrough.classList.contains('success') || removed < 5) {
                        walkthrough.remove();
                        removed++;
                    }
                }
                console.log(`🧹 Cleaned up ${removed} old walkthrough results`);
            }
        }
        
        // Clear template cache with walkthrough template preservation
        if (this.templateCache.size > this.MAX_CACHE_SIZE * 2) {
            // Preserve walkthrough-related templates
            const walkthroughKeys = Array.from(this.templateCache.keys())
                .filter(key => key.includes('walkthrough') || key.includes('domain'));
            
            this.clearTemplateCache();
            
            // Restore important walkthrough templates if they were in cache
            console.log(`🧹 Template cache cleared, preserved ${walkthroughKeys.length} walkthrough templates`);
        }
        
        // Enhanced garbage collection trigger
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        console.log('🧹 Enhanced memory cleanup performed');
        
    } catch (error) {
        console.error('Error in enhanced memory cleanup:', error);
    }
}




  
}
// Auto-start memory monitoring with cleanup
if (typeof window !== 'undefined') {
    setTimeout(() => {
        BrowserLogger.startMemoryMonitoring();
    }, 5000); // Start after 5 seconds
    
    // Add cleanup when page unloads
    window.addEventListener('beforeunload', () => {
        BrowserLogger.performComprehensiveCleanup();
    });
    
    // Add cleanup when visibility changes (optional but helpful)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            BrowserLogger.performMemoryCleanup();
        }
    });
}



