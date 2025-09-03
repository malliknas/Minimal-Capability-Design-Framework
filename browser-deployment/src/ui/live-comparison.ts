// browser-deployment/src/ui/live-comparison.ts
import { results, detailedResults, testControl, getTierComparison, getTierComparisonData } from '../controls/test-control';

export class LiveComparison {
	
	// Helper function to check execution state for live comparison operations
private static checkLiveComparisonExecutionState(operationName: string): boolean {
  if ((window as any).unifiedExecutionState?.isExecuting) {
    console.log(`🔄 Deferring ${operationName} - trials executing`);
    return false;
  }
  return true;
}
    // FIXED: Initialize with proper visibility - hidden by default in always-visible detailed analysis system
	private static lastUpdateTime: number = 0;
// ✅ OPTIMIZED: Adaptive throttle based on execution state
private static get updateThrottle(): number {
    // During execution: longer throttle to reduce interference
    if ((window as any).unifiedExecutionState?.isExecuting) {
        return 2000; // 2 seconds during execution
    }
    // Normal operation: shorter throttle for responsiveness
    return 500; // 500ms for better user experience
}

private static updateInProgress = false;

/**
 * Template cache for memory-efficient HTML generation
 */
private static templateCache = new Map<string, string>();
private static readonly MAX_CACHE_SIZE = 40;

/**
 * Get cached template or create new one
 */
private static getCachedTemplate(key: string, generator: () => string): string {
    // ✅ OPTIMIZED: Use execution-aware cache key instead of bypassing cache
    const executionAwareKey = (window as any).unifiedExecutionState?.isExecuting 
    ? `${key}-executing-${Math.floor(Date.now() / 5000)}` // 5-second buckets during execution
    : key;
    
    if (this.templateCache.has(executionAwareKey)) {
        return this.templateCache.get(executionAwareKey)!;
    }

    const template = generator();
    
    // ✅ OPTIMIZED: Cache management with execution awareness
    if (this.templateCache.size >= this.MAX_CACHE_SIZE) {
        // Clear oldest non-execution templates first
        const keysToCheck = Array.from(this.templateCache.keys());
        const nonExecutingKey = keysToCheck.find(k => !k.includes('-executing'));
        if (nonExecutingKey) {
            this.templateCache.delete(nonExecutingKey);
        } else {
            const firstKey = keysToCheck[0];
            this.templateCache.delete(firstKey);
        }
    }
    
    this.templateCache.set(executionAwareKey, template);
    return template;
}

// ✅ ADD: Performance monitoring for cache efficiency
private static getPerformanceStats(): { cacheHitRate: number; updateFrequency: number } {
    try {
        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        
        return {
            cacheHitRate: this.templateCache.size > 0 ? 
                Math.min(100, (this.templateCache.size / this.MAX_CACHE_SIZE) * 100) : 0,
            updateFrequency: timeSinceLastUpdate > 0 ? 
                Math.round(60000 / timeSinceLastUpdate) : 0 // updates per minute
        };
    } catch (error) {
        return { cacheHitRate: 0, updateFrequency: 0 };
    }
}


/**
 * Clear template cache to free memory
 */
private static clearTemplateCache(): void {
    this.templateCache.clear();
}


    static initialize() {
        const liveContainer = document.getElementById('liveComparisonContainer');
        if (liveContainer) {
            // CHANGED: Keep hidden by default since detailed analysis is now always visible and takes precedence
            liveContainer.style.display = 'none';
            
            // ADDED: Only show if there are already results or if explicitly requested
            if (results && results.length > 0) {
                liveContainer.style.display = 'block';
                this.updateLiveComparison().catch(error => console.warn('Live comparison update failed:', error));
            }
        }
    }

    static async updateLiveComparison() {
    // CRITICAL: Check if trials are running
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Deferring live comparison update - trials executing');
        // Retry after trials complete
        setTimeout(() => {
            if (!(window as any).unifiedExecutionState?.isExecuting) {
                LiveComparison.updateLiveComparison();
            }
        }, 3000);
        return;
    }
    
    // Enhanced race condition protection
   // ✅ OPTIMIZED: More intelligent race condition protection
if (this.updateInProgress) {
    // Instead of skipping entirely, queue an update for later
    if (!(window as any).liveComparisonUpdateQueued) {
        (window as any).liveComparisonUpdateQueued = true;
        setTimeout(() => {
            (window as any).liveComparisonUpdateQueued = false;
            if (!this.updateInProgress) {
                this.updateLiveComparison().catch(console.warn);
            }
        }, 500); // Shorter queue delay
    }
    return;
}

// ✅ OPTIMIZED: Reduced throttle time for better responsiveness
const now = Date.now();
if (now - this.lastUpdateTime < this.updateThrottle / 2) return; // Halved throttle time

    if ((window as any).immediateStop) return;
    
    this.updateInProgress = true;
    this.lastUpdateTime = now;
    
    try {
        const liveContent = document.getElementById('liveComparisonContent');
        const progressIndicator = document.getElementById('liveProgressIndicator');
        
        if (!liveContent || !progressIndicator) return;

        // Update progress indicator with cached template
        const progressKey = `progress-${testControl?.currentTest}-${testControl?.currentTier}-${testControl?.isRunning}`;
        const progressHTML = this.getCachedTemplate(progressKey, () => `
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                Current: ${testControl?.currentTest || 'Ready'}
            </span>
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem; margin-right: 10px;">
                Tier: ${testControl?.currentTier || 'N/A'}
            </span>
            <span style="background: rgba(255, 255, 255, 0.7); padding: 4px 8px; border-radius: 15px; font-weight: 600; font-size: 0.8rem;">
                ${testControl?.isRunning ? (testControl?.isPaused ? '⏸️ Paused' : '🔄 Running') : '✅ Ready'}
            </span>
        `);
        
        progressIndicator.innerHTML = progressHTML;

        // Safety check for results array
        if (!results || !Array.isArray(results)) {
            liveContent.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        // Add yield before expensive DOM generation
        await new Promise(resolve => setTimeout(resolve, 0));
        if ((window as any).immediateStop) return;
        
        // Generate the complete live display with caching
        // ✅ OPTIMIZED: Generate sections separately for better caching
const appendixKey = `appendix-${results.length}-${testControl?.currentTest}-${testControl?.isRunning}`;
const tierComparisonKey = `tier-${Object.values(results.reduce((groups, r) => { 
    groups[r?.quantization] = (groups[r?.quantization] || 0) + 1; 
    return groups; 
}, {})).join('-')}`;
const analysisKey = `analysis-${results.length}`;

const appendixHTML = this.getCachedTemplate(appendixKey, () => this.generateAppendixStyleDisplay());
const tierComparisonHTML = this.getCachedTemplate(tierComparisonKey, () => this.generateEnhancedTierComparisonSync());
const analysisHTML = this.getCachedTemplate(analysisKey, () => this.generateAdvancedTierAnalysis());

const liveDisplayHTML = `
    ${appendixHTML}
    
    <!-- Separator between appendix display and tier comparison -->
    <div style="margin: 25px 0; border-top: 2px solid #e1e5e9;"></div>
    
    ${tierComparisonHTML}
    
    <!-- NEW: Advanced tier analysis section -->
    ${analysisHTML}
`;


        // Use document fragment for better performance
       // ✅ OPTIMIZED: Non-blocking DOM update with better error handling
try {
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
        try {
            if ((window as any).immediateStop) return;
            
            // ✅ OPTIMIZED: More efficient DOM update
            if (liveContent.innerHTML === liveDisplayHTML) {
                // Skip update if content hasn't changed
                return;
            }
            
            // Use document fragment for better performance
            const fragment = document.createDocumentFragment();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = liveDisplayHTML;
            
            // ✅ ADDED: Batch DOM operations
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            liveContent.innerHTML = '';
            liveContent.appendChild(fragment);
            
            // ✅ CLEANUP: Remove temp div reference
            tempDiv.remove();
            
        } catch (domError) {
            console.warn('DOM update failed:', domError);
        }
    });
    
} catch (fragmentError) {
    console.error('Fragment creation failed:', fragmentError);
    // Fallback to direct innerHTML update
    liveContent.innerHTML = liveDisplayHTML;
}

        
    } catch (error) {
        console.error('Error in updateLiveComparison:', error);
        this.showUpdateError(error.message);
    } finally {
        this.updateInProgress = false;
    }
}

    // ENHANCED: Show method with integration for always-visible detailed analysis system
static show() {
    // CRITICAL: Check if trials are running before showing
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Deferring live comparison show - trials executing');
        setTimeout(() => {
            if (!(window as any).unifiedExecutionState?.isExecuting) {
                LiveComparison.show();
            }
        }, 2000);
        return;
    }
    
    const liveContainer = document.getElementById('liveComparisonContainer');
    if (liveContainer) {
        liveContainer.style.display = 'block';
        this.updateLiveComparison().catch(error => console.warn('Live comparison update failed:', error));
        
        // ADDED: Log the relationship with always-visible detailed analysis
        console.log('📊 Live comparison displayed below always-visible detailed analysis');
    }
}


    // RESTORED: Appendix-style live test display
    private static generateAppendixStyleDisplay(): string {
        // CRITICAL: Skip heavy generation during trial execution
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Deferring appendix display generation - trials executing');
        return `
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; color: #1565c0; font-style: italic;">
                📊 Live comparison display deferred - trials executing
                <div style="font-size: 0.85rem; margin-top: 8px; color: #673ab7;">
                    📄 <strong>See detailed analysis above</strong> for comprehensive real-time insights
                </div>
            </div>
        `;
    }
    
    if (!results || results.length === 0) {
        return this.getEmptyStateHTML();
    }

        // Get current and recent test data
        const currentTest = testControl?.currentTest;
        const currentTier = testControl?.currentTier;
        const recentResults = results.slice(-10); // Show last 10 results

        // Group recent results by test for appendix-style display
        const testGroups: { [key: string]: any[] } = {};
        recentResults.forEach(result => {
            const key = `${result.testID}-${result.quantization}`;
            if (!testGroups[key]) testGroups[key] = [];
            testGroups[key].push(result);
        });

        return `
            <div style="background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e1e5e9;">
                <h4 style="color: #2c3e50; font-size: 1.1rem; font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    📄 Live Test Execution Log
                    ${testControl?.isRunning ? '<span style="font-size: 0.8rem; background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; animation: pulse 2s infinite;">RUNNING</span>' : ''}
                </h4>
                
                <!-- ADDED: Integration note with always-visible detailed analysis -->
                <div style="background: rgba(103, 58, 183, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.85rem; color: #673ab7;">
                    💡 <strong>Integration Note:</strong> This live comparison works alongside the always-visible detailed analysis above for comprehensive test monitoring
                </div>
                
                ${this.generateCurrentTestSection(currentTest, currentTier)}
                
                <div style="margin-top: 20px;">
                    <h5 style="color: #495057; font-size: 1rem; font-weight: 600; margin-bottom: 10px;">Recent Test Results (Appendix Style)</h5>
                    ${this.generateAppendixTable(recentResults)}
                </div>
            </div>
        `;
    }

    // Current test execution section
    private static generateCurrentTestSection(currentTest: string, currentTier: string): string {
        if (!testControl?.isRunning || !currentTest || !currentTier) {
            return `
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #6c757d;">
                    <p style="color: #6c757d; font-style: italic; margin: 0;">
                        ${testControl?.isRunning ? 'Preparing next test...' : 'Click "🚀 Start Tests" to begin live execution tracking'}
                    </p>
                    <p style="color: #673ab7; font-size: 0.85rem; margin: 8px 0 0 0;">
                        📄 <strong>Detailed results</strong> are always visible above for immediate access to comprehensive analysis
                    </p>
                </div>
            `;
        }

        return `
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: #2c3e50; font-size: 1rem;">Currently Executing: ${currentTest}</strong>
                    <span style="background: ${this.getTierColor(currentTier)}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${currentTier} Tier</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; font-size: 0.85rem;">
                    <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                        <div style="font-weight: 600; color: #2c3e50;">Status</div>
                        <div style="color: #28a745; font-weight: 600;">${testControl?.isPaused ? 'Paused' : 'Running'}</div>
                    </div>
                    <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                        <div style="font-weight: 600; color: #2c3e50;">Mode</div>
                        <div style="color: #667eea; font-weight: 600;">${testControl?.detailedMode ? 'Detailed' : 'Standard'}</div>
                    </div>
                    <div style="background: #f8f9fc; padding: 8px; border-radius: 4px; text-align: center;">
                        <div style="font-weight: 600; color: #2c3e50;">Progress</div>
                        <div style="color: #e65100; font-weight: 600;">${results.length} tests</div>
                    </div>
                </div>
                
                <!-- ADDED: Reference to always-visible detailed analysis -->
                <div style="margin-top: 10px; padding: 8px; background: rgba(103, 58, 183, 0.05); border-radius: 4px; font-size: 0.8rem; color: #673ab7;">
                    📄 <strong>See above:</strong> Comprehensive detailed analysis is always visible for immediate trial-by-trial insights
                </div>
            </div>
        `;
    }

    // RESTORED: Appendix-style table generation
    private static generateAppendixTable(recentResults: any[]): string {
        if (!recentResults || recentResults.length === 0) {
            return `
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; color: #6c757d; font-style: italic;">
                    No test results yet. Results will appear here as tests execute.
                    <div style="margin-top: 8px; font-size: 0.85rem; color: #673ab7;">
                        📄 <strong>Detailed analysis above</strong> will show comprehensive trial-by-trial data
                    </div>
                </div>
            `;
        }

        const tableHTML = `
            <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <th style="padding: 10px 8px; text-align: left; font-weight: 600; border: none;">Test ID</th>
                            <th style="padding: 10px 8px; text-align: left; font-weight: 600; border: none;">Variant</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 600; border: none;">Tier</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 600; border: none;">Tokens</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 600; border: none;">Latency</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 600; border: none;">Completion</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 600; border: none;">Drift</th>
                            <th style="padding: 10px 8px; text-align: center; font-weight: 600; border: none;">MCD</th>
                            <th style="padding: 10px 8px; text-align: left; font-weight: 600; border: none;">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentResults.map((result, index) => `
                            <tr style="border-bottom: 1px solid #e1e5e9; ${index % 2 === 0 ? 'background: #f8f9fc;' : 'background: white;'} ${result?.mcdAligned ? 'border-left: 3px solid #28a745;' : ''}">
                                <td style="padding: 8px; font-weight: 600; color: #2c3e50;">${result?.testID || 'Unknown'}</td>
                                <td style="padding: 8px; color: #495057; font-size: 0.8rem;">${result?.variant || 'N/A'}</td>
                                // Replace the tier column:
<td style="padding: 8px; text-align: center;">
    <span style="background: ${this.getTierColor(this.getResultTier(result))}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
        ${this.getResultTier(result) || 'N/A'}
    </span>
</td>

                                <td style="padding: 8px; text-align: center; color: #2c3e50; font-weight: 600;">${result?.tokensUsed || result?.tokens || 0}</td>
                                <td style="padding: 8px; text-align: center; color: #6c757d;">${this.formatLatency(result?.latencyMs)}</td>
                                <td style="padding: 8px; text-align: center;">${result?.completion || '❌ No'}</td>
                                <td style="padding: 8px; text-align: center; font-size: 0.8rem;">${this.formatDrift(result?.semanticDrift)}</td>
                                <td style="padding: 8px; text-align: center;">
                                    ${result?.mcdAligned ? '<span style="color: #28a745; font-weight: 600;">✅</span>' : '<span style="color: #dc3545; font-weight: 600;">❌</span>'}
                                </td>
                                <td style="padding: 8px; font-size: 0.8rem; color: #6c757d; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.generateNotes(result)}">
                                    ${this.generateNotes(result)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <!-- ADDED: Footer note about detailed analysis -->
                <div style="padding: 10px; background: #f8f9fc; border-top: 1px solid #e1e5e9; font-size: 0.8rem; color: #673ab7; text-align: center;">
                    📄 <strong>For comprehensive trial-by-trial analysis:</strong> See the always-visible detailed analysis section above
                </div>
            </div>
        `;

        return tableHTML;
    }

    // ENHANCED: Tier comparison section with advanced features
    private static async generateEnhancedTierComparison(): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 0));
        if ((window as any).immediateStop) return '';
		// Group results by tier for comparison
        const tierGroups = {
            Q1: results.filter(r => r?.quantization === 'Q1'),
            Q4: results.filter(r => r?.quantization === 'Q4'), 
            Q8: results.filter(r => r?.quantization === 'Q8')
        };

        // Get tier comparison data from test-control
        const tierComparisonData = getTierComparison();

        if (Object.values(tierGroups).every(group => group.length === 0)) {
            return `
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; color: #6c757d; font-style: italic;">
                    <div style="margin-bottom: 10px; font-size: 2rem;">🏗️</div>
                    <div>Tier comparison will appear here as tests complete across different quantization levels.</div>
                    <div style="font-size: 0.85rem; margin-top: 8px; opacity: 0.8;">
                        Advanced tier analysis with efficiency scoring and MCD verdicts coming soon...
                    </div>
                    <div style="margin-top: 12px; padding: 10px; background: rgba(103, 58, 183, 0.1); border-radius: 6px; font-size: 0.85rem; color: #673ab7;">
                        📄 <strong>Always-visible detailed analysis above</strong> provides immediate comprehensive insights
                    </div>
                </div>
            `;
        }

        return `
            <div>
                <h4 style="color: #2c3e50; font-size: 1.1rem; font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    🏗️ Advanced Tier Comparison Analysis
                    <span style="font-size: 0.8rem; background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 12px;">Live Updates</span>
                </h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    ${await this.generateTierCardsAsync(tierGroups, tierComparisonData)}
                </div>

            </div>
        `;
    }
// ENHANCED: Synchronous tier comparison to avoid race conditions
private static generateEnhancedTierComparisonSync(): string {
       // CRITICAL: Skip heavy tier comparison during trial execution
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Deferring tier comparison generation - trials executing');
        return `
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; text-align: center; color: #856404; font-style: italic;">
                🏗️ Tier comparison analysis deferred - trials executing
                <div style="font-size: 0.85rem; margin-top: 8px; color: #673ab7;">
                    📄 <strong>Detailed analysis above</strong> provides immediate tier performance insights
                </div>
            </div>
        `;
    }
    
    // Group results by tier for comparison
    const tierGroups = {
    Q1: [
        ...results.filter(r => r?.quantization === 'Q1'),
        ...results.filter(r => r?.testID === 'T10' && r?.tiers?.Q1)
            .map(r => ({ ...r, quantization: 'Q1', ...r.tiers.Q1 }))
    ],
    Q4: [
        ...results.filter(r => r?.quantization === 'Q4'),
        ...results.filter(r => r?.testID === 'T10' && r?.tiers?.Q4)
            .map(r => ({ ...r, quantization: 'Q4', ...r.tiers.Q4 }))
    ],
    Q8: [
        ...results.filter(r => r?.quantization === 'Q8'),
        ...results.filter(r => r?.testID === 'T10' && r?.tiers?.Q8)
            .map(r => ({ ...r, quantization: 'Q8', ...r.tiers.Q8 }))
    ]
};

    // Get tier comparison data from test-control
    const tierComparisonData = getTierComparison();

    if (Object.values(tierGroups).every(group => group.length === 0)) {
        return `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; color: #6c757d; font-style: italic;">
                <div style="margin-bottom: 10px; font-size: 2rem;">🏗️</div>
                <div>Tier comparison will appear here as tests complete across different quantization levels.</div>
                <div style="font-size: 0.85rem; margin-top: 8px; opacity: 0.8;">
                    Advanced tier analysis with efficiency scoring and MCD verdicts coming soon...
                </div>
                <div style="margin-top: 12px; padding: 10px; background: rgba(103, 58, 183, 0.1); border-radius: 6px; font-size: 0.85rem; color: #673ab7;">
                    📄 <strong>Always-visible detailed analysis above</strong> provides immediate comprehensive insights
                </div>
            </div>
        `;
    }

    // Use template caching for tier comparison
    const tierCacheKey = `tier-comparison-${Object.values(tierGroups).map(g => g.length).join('-')}`;
    
    return this.getCachedTemplate(tierCacheKey, () => `
        <div>
            <h4 style="color: #2c3e50; font-size: 1.1rem; font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                🏗️ Advanced Tier Comparison Analysis
                <span style="font-size: 0.8rem; background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 12px;">Live Updates</span>
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                ${this.generateTierCardsSync(tierGroups, tierComparisonData)}
            </div>
        </div>
    `);
}

/**
 * Synchronous tier card generation to avoid race conditions
 */
private static generateTierCardsSync(tierGroups: any, tierComparisonData: any): string {
    const cards: string[] = [];
    
    for (const [tier, tierResults] of Object.entries(tierGroups)) {
        if ((tierResults as any[]).length > 0) {
            cards.push(this.generateAdvancedTierCard(tier, tierResults as any[], tierComparisonData));
        }
    }
    
    return cards.join('');
}

    // ADD THIS NEW METHOD - Non-blocking tier card generation
    private static async generateTierCardsAsync(tierGroups: any, tierComparisonData: any): Promise<string> {
        const cards: string[] = [];
        
        for (const [tier, tierResults] of Object.entries(tierGroups)) {
            if ((window as any).immediateStop) break;
            
            if ((tierResults as any[]).length > 0) {
                cards.push(this.generateAdvancedTierCard(tier, tierResults as any[], tierComparisonData));
                await new Promise(resolve => setTimeout(resolve, 0)); // Yield between cards
            }
        }
        
        return cards.join('');
    }


    // NEW: Generate advanced tier card with efficiency scoring
    private static generateAdvancedTierCard(tier: string, tierResults: any[], tierComparisonData: any): string {
        const efficiencyScore = this.calculateEfficiencyScore(tierResults);
        const mcdVerdict = this.getMCDVerdict(tier, tierResults);
        const semanticQuality = this.calculateSemanticQuality(tierResults);

        return `
            <div style="background: white; border-radius: 10px; padding: 20px; border: 2px solid #e1e5e9; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 15px; text-align: center; padding: 10px; border-radius: 8px; color: white; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); background: ${this.getTierGradient(tier)};">
                    ${tier} Tier
                </h4>
                
                <!-- Core Metrics Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; padding: 10px 12px; background: #f8f9fc; border-radius: 6px; border-left: 3px solid ${this.getTierColor(tier)};">
                        <span style="font-weight: 500; color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Tests</span>
                        <span style="font-weight: 700; color: #2c3e50; font-size: 1rem;">${tierResults.length}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; padding: 10px 12px; background: #f8f9fc; border-radius: 6px; border-left: 3px solid ${this.getTierColor(tier)};">
                        <span style="font-weight: 500; color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Completed</span>
                        <span style="font-weight: 700; color: #2c3e50; font-size: 1rem;">${tierResults.filter(r => r?.completion === '✅ Yes').length}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; padding: 10px 12px; background: #f8f9fc; border-radius: 6px; border-left: 3px solid ${this.getTierColor(tier)};">
                        <span style="font-weight: 500; color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">MCD Aligned</span>
                        <span style="font-weight: 700; color: #2c3e50; font-size: 1rem;">${tierResults.filter(r => r?.mcdAligned).length}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; padding: 10px 12px; background: #f8f9fc; border-radius: 6px; border-left: 3px solid ${this.getTierColor(tier)};">
                        <span style="font-weight: 500; color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Avg Tokens</span>
                        <span style="font-weight: 700; color: #2c3e50; font-size: 1rem;">${this.calculateAvgTokens(tierResults)}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; padding: 10px 12px; background: #f8f9fc; border-radius: 6px; border-left: 3px solid ${this.getTierColor(tier)};">
                        <span style="font-weight: 500; color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Avg Latency</span>
                        <span style="font-weight: 700; color: #2c3e50; font-size: 1rem;">${this.calculateAvgLatency(tierResults)}ms</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; padding: 10px 12px; background: #f8f9fc; border-radius: 6px; border-left: 3px solid ${this.getTierColor(tier)};">
                        <span style="font-weight: 500; color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Success Rate</span>
                        <span style="font-weight: 700; color: ${this.getSuccessRateColor(tierResults)}; font-size: 1rem;">${this.calculateSuccessRate(tierResults)}%</span>
                    </div>
                </div>

                <!-- Advanced Analysis Section -->
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e5e9;">
                    <!-- Efficiency Score -->
                    <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.9rem; ${this.getEfficiencyScoreStyle(efficiencyScore)}">
                        📊 Efficiency Score: ${efficiencyScore.display}
                    </div>
                    
                    <!-- MCD Verdict -->
                    <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.9rem; ${this.getMCDVerdictStyle(mcdVerdict)}">
                        🎯 MCD Verdict: ${mcdVerdict}
                    </div>
                    
                    <!-- Semantic Quality -->
                    <div style="margin-bottom: 15px; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.9rem; ${this.getSemanticQualityStyle(semanticQuality)}">
                        🧠 Semantic Quality: ${semanticQuality}
                    </div>
                </div>

                <!-- Recent Tests Section -->
                <div style="border-top: 1px solid #e1e5e9; padding-top: 12px; margin-top: 15px;">
                    <div style="font-size: 0.8rem; font-weight: 600; color: #666; margin-bottom: 8px;">Recent Tests:</div>
                    ${tierResults.slice(-3).map(r => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin: 6px 0; background: #f8f9fc; border-radius: 6px; font-size: 0.8rem; transition: background 0.2s ease; ${r?.mcdAligned ? 'border-left: 4px solid #28a745;' : 'border-left: 4px solid #ffc107;'}">
                            <span style="font-weight: 600; color: #2c3e50;">${r?.testID || 'Unknown'}</span>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span>${r?.completion || '❌ No'}</span>
                                ${r?.mcdAligned ? '<span style="color: #28a745; font-size: 0.7rem;">✅ MCD</span>' : '<span style="color: #ffc107; font-size: 0.7rem;">⚠ Non-MCD</span>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- ADDED: Reference to detailed analysis -->
                <div style="margin-top: 12px; padding: 8px; background: rgba(103, 58, 183, 0.05); border-radius: 4px; font-size: 0.75rem; color: #673ab7; text-align: center;">
                    📄 <strong>See detailed analysis above</strong> for comprehensive trial-by-trial ${tier} tier insights
                </div>
            </div>
        `;
    }

    // NEW: Generate advanced tier analysis summary
    private static generateAdvancedTierAnalysis(): string {
        const tierData = getTierComparison();
        if (!tierData || Object.keys(tierData).length <= 1) {
            return '';
        }

        // Find best performing tier
        let bestTier = '';
        let bestScore = 0;
        
        Object.entries(tierData).forEach(([tier, data]: [string, any]) => {
            const score = (data.successRate + data.mcdAlignmentRate) / 2;
            if (score > bestScore) {
                bestScore = score;
                bestTier = tier;
            }
        });

        return `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e1e5e9;">
                <h4 style="color: #2c3e50; font-size: 1.1rem; font-weight: 600; margin-bottom: 15px;">
                    📈 Real-Time Tier Analysis Summary
                </h4>
                
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <div style="font-size: 0.95rem; line-height: 1.7; color: #2c3e50;">
                        <strong>📊 Best Performing Tier:</strong> ${bestTier} (${Math.round(bestScore)}% overall performance)<br>
                        <strong>🏗️ Active Comparisons:</strong> ${Object.keys(tierData).length} tiers being monitored<br>
                        <strong>🔄 Live Updates:</strong> Data refreshes automatically as tests complete<br>
                        <strong>🎯 MCD Optimization:</strong> Real-time efficiency scoring and performance analysis enabled<br>
                        <strong>📄 Integration:</strong> Comprehensive detailed analysis always visible above for immediate insights
                    </div>
                </div>
            </div>
        `;
    }
// ✅ ADD this helper method to handle T10's different structure
private static getResultTier(result: any): string {
    // Handle regular T1-T9 tests
    if (result?.quantization) {
        return result.quantization;
    }
    
    // Handle T10 tier-based structure
    if (result?.testID === 'T10' && result?.currentTier) {
        return result.currentTier;
    }
    
    // Try to infer from tiers object (if processing T10 data)
    if (result?.testID === 'T10' && result?.tiers) {
        // Return the first available tier
        const availableTiers = Object.keys(result.tiers);
        return availableTiers[0] || 'Unknown';
    }
    
    return 'Unknown';
}

    // NEW: Calculate efficiency score with MCD principles
    private static calculateEfficiencyScore(tierResults: any[]): { score: number; display: string } {
        if (!tierResults || tierResults.length === 0) {
            return { score: 0, display: '❓ Unknown' };
        }

        const successRate = this.calculateSuccessRate(tierResults) / 100;
        const avgTokens = this.calculateAvgTokens(tierResults);
        const avgLatency = this.calculateAvgLatency(tierResults);
        
        // MCD efficiency formula: prioritize success rate, penalize high tokens and latency
        const tokenEfficiency = Math.max(0, (100 - avgTokens) / 100);
        const speedEfficiency = Math.max(0, (1000 - avgLatency) / 1000);
        
        const score = Math.round((successRate * 0.5 + tokenEfficiency * 0.3 + speedEfficiency * 0.2) * 100);
        
        if (score >= 70) return { score, display: '🟢 Optimal' };
        if (score >= 50) return { score, display: '🟡 Adequate' };
        return { score, display: '🔴 Needs Improvement' };
    }

    // NEW: Get MCD verdict based on tier and performance
    private static getMCDVerdict(tier: string, tierResults: any[]): string {
        const successRate = this.calculateSuccessRate(tierResults) / 100;
        const avgTokens = this.calculateAvgTokens(tierResults);
        const avgLatency = this.calculateAvgLatency(tierResults);
        
        if (tier === 'Q1') {
            if (successRate >= 0.4 && avgLatency <= 300 && avgTokens <= 60) return '✅ Optimal';
            if (successRate >= 0.2) return '⚠ Adequate';
            return '❌ Insufficient';
        } else if (tier === 'Q4') {
            if (successRate >= 0.8 && avgLatency <= 500 && avgTokens <= 80) return '✅ Optimal';
            if (successRate >= 0.6) return '⚠ Adequate';
            return '❌ Underperforming';
        } else if (tier === 'Q8') {
            if (successRate >= 0.9 && avgTokens <= 100) {
                if (avgLatency <= 400) return '✅ Optimal';
                return '⚠ Overkill (slow)';
            }
            if (successRate >= 0.8) return '⚠ Adequate';
            return '❌ Waste of resources';
        }
        
        return '❓ Unknown';
    }

    // NEW: Calculate semantic quality based on drift analysis
    private static calculateSemanticQuality(tierResults: any[]): string {
        if (!tierResults || tierResults.length === 0) return '❓ Unknown';
        
        const highQualityResults = tierResults.filter(r => 
            r?.semanticDrift !== '❌ Error' && 
            r?.semanticDrift !== '❌ Unknown' &&
            !r?.semanticDrift?.includes('Error')
        );
        
        const percentage = (highQualityResults.length / tierResults.length) * 100;
        
        if (percentage >= 80) return '🟢 High';
        if (percentage >= 60) return '🟡 Moderate';
        return '🔴 Low';
    }

    // Helper methods
    static hide() {
        const liveContainer = document.getElementById('liveComparisonContainer');
        if (liveContainer) {
            liveContainer.style.display = 'none';
        }
    }

    // NEW: Method to update with tier data
    static updateWithTierData() {
    try {
        // CRITICAL: Skip updates during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring tier data update - trials executing');
            return;
        }
        
        const tierData = getTierComparison();
        if (tierData && tierData.length > 0) {
            this.updateLiveComparison().catch(error => console.warn('Live comparison update failed:', error));
        }
    } catch (error) {
        console.warn('Could not update with tier data:', error);
    }
}

// ✅ ADD: Smart cache size management
private static optimizeCacheSize(): void {
    try {
        // Skip optimization during execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            return;
        }
        
        const currentSize = this.templateCache.size;
        const targetSize = Math.floor(this.MAX_CACHE_SIZE * 0.7); // Keep 70% capacity
        
        if (currentSize > targetSize) {
            const keysToRemove = Array.from(this.templateCache.keys())
                .slice(0, currentSize - targetSize);
            
            keysToRemove.forEach(key => this.templateCache.delete(key));
            
            console.log(`🧹 Template cache optimized: ${currentSize} → ${this.templateCache.size} entries`);
        }
        
    } catch (error) {
        console.warn('Cache optimization failed:', error);
    }
}

    // ENHANCED: Empty state with always-visible detailed analysis integration
    private static getEmptyStateHTML(): string {
        return `
            <div style="text-align: center; padding: 40px 20px; color: #6c757d; font-size: 1rem;">
                <div style="margin-bottom: 15px; font-size: 3rem;">📊</div>
                <div>Click "🚀 Start Tests" to begin live comparison tracking</div>
                <div style="font-size: 0.85rem; margin-top: 12px; opacity: 0.8;">
                    Live test execution logs, tier comparisons, and advanced MCD analysis will appear here
                </div>
                <div style="margin-top: 20px; padding: 15px; background: rgba(103, 58, 183, 0.1); border-radius: 6px; color: #673ab7; font-size: 0.9rem;">
                    📄 <strong>Always Available:</strong> Comprehensive detailed analysis is permanently visible above for immediate access to trial-by-trial insights
                </div>
            </div>
        `;
    }

    private static getTierColor(tier: string): string {
        const colors = {
            'Q1': '#e65100',
            'Q4': '#1976d2',
            'Q8': '#388e3c'
        };
        return colors[tier as keyof typeof colors] || '#6c757d';
    }

    // NEW: Get tier gradient for enhanced styling
    private static getTierGradient(tier: string): string {
        const gradients = {
            'Q1': 'linear-gradient(135deg, #e65100 0%, #ff8a50 100%)',
            'Q4': 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            'Q8': 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)'
        };
        return gradients[tier as keyof typeof gradients] || 'linear-gradient(135deg, #6c757d 0%, #adb5bd 100%)';
    }

    // NEW: Get efficiency score styling
    private static getEfficiencyScoreStyle(efficiencyScore: { score: number; display: string }): string {
        if (efficiencyScore.display.includes('Optimal')) {
            return 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
        } else if (efficiencyScore.display.includes('Adequate')) {
            return 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;';
        } else {
            return 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
        }
    }

    // NEW: Get MCD verdict styling
    private static getMCDVerdictStyle(verdict: string): string {
        if (verdict.includes('Optimal')) {
            return 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
        } else if (verdict.includes('Adequate')) {
            return 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;';
        } else {
            return 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
        }
    }

    // NEW: Get semantic quality styling
    private static getSemanticQualityStyle(quality: string): string {
        if (quality.includes('High')) {
            return 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
        } else if (quality.includes('Moderate')) {
            return 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;';
        } else {
            return 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
        }
    }

    private static calculateAvgTokens(tierResults: any[]): number {
        if (!tierResults || tierResults.length === 0) return 0;
        
        const totalTokens = tierResults.reduce((sum, r) => {
            const tokens = r?.tokensUsed || r?.tokens || 0;
            return sum + (typeof tokens === 'number' ? tokens : 0);
        }, 0);
        
        return Math.round(totalTokens / tierResults.length);
    }

    private static calculateAvgLatency(tierResults: any[]): number {
        if (!tierResults || tierResults.length === 0) return 0;
        
        const totalLatency = tierResults.reduce((sum, r) => {
            const latency = parseFloat(r?.latencyMs) || 0;
            return sum + latency;
        }, 0);
        
        return Math.round(totalLatency / tierResults.length);
    }

    private static calculateSuccessRate(tierResults: any[]): number {
        if (!tierResults || tierResults.length === 0) return 0;
        
        const successful = tierResults.filter(r => r?.completion === '✅ Yes').length;
        return Math.round((successful / tierResults.length) * 100);
    }

    private static getSuccessRateColor(tierResults: any[]): string {
        const rate = this.calculateSuccessRate(tierResults);
        if (rate >= 80) return '#28a745';
        if (rate >= 60) return '#ffc107';
        return '#dc3545';
    }

    private static formatLatency(latencyMs: string | number): string {
        if (!latencyMs) return '0ms';
        const latency = typeof latencyMs === 'string' ? parseFloat(latencyMs) : latencyMs;
        return `${Math.round(latency)}ms`;
    }

    private static formatDrift(drift: string): string {
        if (!drift) return '❌ Unknown';
        if (drift.includes('✅')) return '✅ None';
        if (drift.includes('⚠')) return '⚠️ Mild';
        if (drift.includes('❌')) return '❌ Yes';
        return drift;
    }

    private static generateNotes(result: any): string {
        const notes = [];
        
        if (result?.tokensUsed && result.tokensUsed > 100) notes.push('High tokens');
        if (result?.latencyMs && parseFloat(result.latencyMs) > 1000) notes.push('Slow response');
        if (result?.mcdAligned) notes.push('MCD aligned');
        if (result?.completion === '❌ No') notes.push('Incomplete');
        if (result?.error) notes.push('Error occurred');
        
        return notes.length > 0 ? notes.join(', ') : 'Standard execution';
    }

/**
 * Show error when update fails
 */
private static showUpdateError(errorMessage: string): void {
    try {
        const liveContent = document.getElementById('liveComparisonContent');
        if (!liveContent) return;
        
        const errorTemplate = this.getCachedTemplate('update-error', () => `
            <div style="text-align: center; padding: 40px 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 20px 0;">
                <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                <div style="color: #856404; font-weight: 600; margin-bottom: 10px;">Error Loading Live Comparison</div>
                <div style="color: #856404; font-size: 0.9rem; margin-bottom: 15px;">${errorMessage}</div>
                <button onclick="LiveComparison.updateLiveComparison()" style="background: #ffc107; color: #212529; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;">
                    🔄 Retry Update
                </button>
            </div>
        `);
        
        liveContent.innerHTML = errorTemplate;
    } catch (displayError) {
        console.error('Error showing update error:', displayError);
    }
}

/**
 * Comprehensive cleanup for LiveComparison
 */
private static performComprehensiveCleanup(): void {
    try {
        // CRITICAL: Never cleanup during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🧹 Deferring comprehensive cleanup - trials executing');
            // Retry cleanup after execution
            setTimeout(() => {
                if (!(window as any).unifiedExecutionState?.isExecuting) {
                    this.performComprehensiveCleanup();
                }
            }, 5000);
            return;
        }
        
        // ✅ ENHANCED: Clear template cache more aggressively during cleanup
        this.clearTemplateCache();
        
        // ✅ ENHANCED: Reset all state variables
        this.updateInProgress = false;
        this.lastUpdateTime = 0;
        
        // ✅ ADDED: Clear any queued updates
        if ((window as any).liveComparisonUpdateQueued) {
            (window as any).liveComparisonUpdateQueued = false;
        }
        
        // ✅ ADDED: Force garbage collection hint
        if (window.gc && typeof window.gc === 'function') {
            try { window.gc(); } catch (gcError) { /* ignore */ }
        }
        
        console.log('🧹 LiveComparison comprehensive cleanup completed');
        
    } catch (error) {
        console.error('Error during LiveComparison cleanup:', error);
    }
}




}
// Auto-cleanup system
// Auto-cleanup system - EXECUTION AWARE
if (typeof window !== 'undefined') {
    let liveComparisonCleanupInterval: NodeJS.Timeout | null = null;
    
    const startLiveComparisonCleanup = () => {
        if (liveComparisonCleanupInterval) clearInterval(liveComparisonCleanupInterval);
        
        // Ultra-conservative - every 10 minutes instead of immediate
        liveComparisonCleanupInterval = setInterval(() => {
            try {
                // CRITICAL: Never cleanup during trial execution
                if ((window as any).unifiedExecutionState?.isExecuting) {
                    console.log('🧹 Deferring live comparison cleanup - trials executing');
                    return;
                }
                
                // Conservative template cache cleanup
                if (LiveComparison.templateCache && LiveComparison.templateCache.size > LiveComparison.MAX_CACHE_SIZE * 2) {
                    LiveComparison.clearTemplateCache();
                    console.log('🧹 Live comparison template cache cleared');
                }
            } catch (error) {
                console.warn('Live comparison cleanup error:', error);
            }
        }, 600000); // 10 minutes - ultra-conservative
    };
    
    // Execution-aware initialization
    setTimeout(() => {
        try {
            // Check execution state before initialization
            if ((window as any).unifiedExecutionState?.isExecuting) {
                console.log('🔄 Deferring live comparison initialization - trials executing');
                setTimeout(() => {
                    if (!(window as any).unifiedExecutionState?.isExecuting) {
                        LiveComparison.initialize();
                    }
                }, 3000);
                return;
            }
            
            LiveComparison.initialize();
        } catch (error) {
            console.error('LiveComparison initialization failed:', error);
        }
    }, 1800);
    
    // Start cleanup system
    startLiveComparisonCleanup();
    
    // Ultra-conservative cleanup on page unload
    window.addEventListener('beforeunload', () => {
        try {
            // Only cleanup if not executing
            if (!(window as any).unifiedExecutionState?.isExecuting) {
                if (liveComparisonCleanupInterval) {
                    clearInterval(liveComparisonCleanupInterval);
                }
                LiveComparison.performComprehensiveCleanup();
            }
        } catch (error) {
            console.warn('LiveComparison cleanup failed:', error);
        }
    });
    
    // Execution-aware global functions for debugging
    (window as any).cleanupLiveComparison = () => {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🧹 Deferring live comparison cleanup - trials executing');
            return;
        }
        LiveComparison.performComprehensiveCleanup();
    };
    
    (window as any).refreshLiveComparison = () => {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring live comparison refresh - trials executing');
            return;
        }
        LiveComparison.updateLiveComparison();
    };
}
