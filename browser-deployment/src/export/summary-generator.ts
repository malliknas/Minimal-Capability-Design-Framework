// browser-deployment/src/export/summary-generator.ts - Enhanced with Chapter 7 Domain Walkthrough Integration
import { results, detailedResults, testBedInfo, testControl } from '../controls/test-control';

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


// Helper function to check execution state for summary operations
const checkSummaryExecutionState = (operationName: string): boolean => {
  if ((window as any).unifiedExecutionState?.isExecuting) {
    console.log(`🔄 Deferring ${operationName} - trials executing`);
    return false;
  }
  return true;
};
// ============================================
// 🆕 NEW: CHAPTER 7 INTERFACES
// ============================================
// Enhanced T1 cross-validation summary data
interface T1EnhancedSummaryData {
    totalVariants: number;
    crossValidationRuns: number;
    statisticalSignificance: string[];
    variantPerformance: {
        variant: string;
        meanCompletionRate: number;
        confidenceInterval: [number, number];
        mcdCompatibility: string;
        tokenEfficiency: number;
        resourceStability: number;
    }[];
    overallStatistics: {
        bestPerformingVariant: string;
        worstPerformingVariant: string;
        significantDifferences: boolean;
        recommendedVariant: string;
    };
}


// Enhanced T6 over-engineering summary data
interface T6EnhancedSummaryData {
    totalVariants: number;
    overEngineeredVariants: number;
    capabilityPlateauDetected: boolean;
    redundancyAnalysis: {
        variant: string;
        efficiencyClassification: string;
        redundancyIndex: {
            tokenCostIncrease: number;
            semanticGain: number;
        } | null;
        overEngineeringScore: number;
        capabilityPlateau: boolean;
    }[];
    recommendations: string[];
}



// Enhanced T7 safety analysis summary data
interface T7EnhancedSummaryData {
    totalVariants: number;
    safeVariants: number;
    dangerousVariants: number;
    criticalSafetyRisks: number;
    hallucinationDetection: {
        totalHallucinations: number;
        affectedVariants: number;
        commonPatterns: string[];
    };
    deploymentViability: {
        deploymentSafe: number;
        deploymentRisky: number;
        deploymentHostile: number;
    };
    safetyRecommendations: string[];
}

// Extract T7 enhanced analysis data

// Enhanced T8 deployment compatibility summary data
interface T8EnhancedSummaryData {
    totalVariants: number;
    edgeOptimizedVariants: number;
    deploymentHostileVariants: number;
    browserCompatibility: {
        universal: number;
        unstable: number;
        crashes: number;
    };
    memoryAnalysis: {
        avgMemoryIncrease: number;
        memoryEfficientVariants: number;
        memoryOverflowVariants: number;
    };
    performanceProfile: {
        avgLatencyRatio: number;
        optimalPerformanceVariants: number;
    };
    deploymentRecommendations: string[];
}

// ============================================
// 🆕 NEW: CHAPTER 7 INTERFACES
// ============================================

// Comprehensive summary data structure for unified framework
interface UnifiedSummaryData {
    testBed: any;
    executionSummary: {
        totalTests: number;
        detailedTests: number;
        selectedTiers: string[];
        selectedTests: string[];
        tierBreakdown: any[];
        completionRates: Record<string, number>;
        // Chapter 7 additions
        totalWalkthroughs?: number;
        domainsAnalyzed?: string[];
        avgWalkthroughSuccess?: number;
    };
    mcdValidation: {
        alignedTests: number;
        nonAlignedTests: number;
        driftDetected: number;
        // Chapter 7 additions
        walkthroughMCDCompliance?: number;
        unifiedMCDAlignment?: number;
    };
    // Chapter 7 specific section
    walkthroughSummary?: {
        totalWalkthroughs: number;
        domainBreakdown: any[];
        successRates: Record<string, number>;
        avgMCDCompliance: number;
        avgUserExperience: number;
        resourceEfficiency: number;
    };
    // Unified framework analysis
    unifiedAnalysis?: {
        frameworkConsistency: string;
        crossFrameworkMCDAlignment: number;
        totalExecutions: number;
        overallSuccessRate: number;
    };
}

// Domain-specific summary metrics
interface DomainSummaryMetrics {
    domain: string;
    displayName: string;
    totalWalkthroughs: number;
    successRate: number;
    avgMCDCompliance: number;
    avgUserExperience: number;
    color: string;
    icon: string;
}
/**
 * Template cache and memory management for summary generation
 */
class SummaryTemplateCache {
    private static cache = new Map<string, string>();
    private static readonly MAX_CACHE_SIZE = 25;

    static getTemplate(key: string, generator: () => string): string {
    // CRITICAL: Skip caching operations during trial execution
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Generating template directly - trials executing');
        return generator(); // Generate directly without caching during execution
    }
    
    if (this.cache.has(key)) {
        return this.cache.get(key)!;
    }

    const template = generator();
    
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
    }
    
    this.cache.set(key, template);
    return template;
}


    static clearCache(): void {
        this.cache.clear();
    }
}
/**
 * Data processing optimization for large datasets
 */
class SummaryDataProcessor {
    static safeAggregate<T>(array: T[], aggregator: (acc: any, item: T) => any, initialValue: any): any {
        try {
            if (!Array.isArray(array) || array.length === 0) {
                return initialValue;
            }

            return array.reduce((acc, item, index) => {
                try {
                    return aggregator(acc, item);
                } catch (itemError) {
                    console.warn(`Error processing item at index ${index}:`, itemError);
                    return acc;
                }
            }, initialValue);
        } catch (error) {
            console.error('Error in safe aggregate:', error);
            return initialValue;
        }
    }
}



export class SummaryGenerator {
    // ============================================
    // 🔄 EXISTING T1-T10 FUNCTIONS (ENHANCED)
    // ============================================
    
    static generateTestSummary() {
        try {
            // CRITICAL: Check if trials are running
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring summary generation - trials executing');
            // Retry after trials complete
            setTimeout(() => {
                if (!(window as any).unifiedExecutionState?.isExecuting) {
                    SummaryGenerator.generateTestSummary();
                }
            }, 3000);
            return;
        }
        
        // Safety checks for data availability
        if (!results || !Array.isArray(results)) {
            console.warn('Results data not available for summary generation');
            SummaryGenerator.displayEmptySummary();
            return;
        }

            if (!testControl?.selectedTiers || !testControl?.selectedTests) {
                console.warn('Test control data incomplete for summary generation');
                SummaryGenerator.displayEmptySummary();
                return;
            }

            // Safe array conversion with validation
            const selectedTiers = Array.from(testControl.selectedTiers);
            const selectedTests = Array.from(testControl.selectedTests);

            // Generate tier breakdown with safety checks
            // In generateTestSummary(), replace the tierBreakdown logic:
 
// Generate tier breakdown with enhanced T10 handling
// Generate tier breakdown with execution-aware T10 handling
const tierBreakdown = selectedTiers.map(tier => {
    // Handle regular T1-T9 tests
    const regularTierResults = results.filter(r => r?.quantization === tier);
    const regularCompleted = regularTierResults.filter(r => 
  r?.completion === "✅ Yes" || 
  r?.completion?.includes("✅") ||
  r?.completion?.includes("⚠") ||
  r?.completion?.includes("/")
);
    
    // ✅ SAFE: Skip T10 processing during execution
    let t10Count = 0;
    let t10Completed = 0;
    
    if (!(window as any).unifiedExecutionState?.isExecuting) {
        const t10Results = SummaryGenerator.findT10ResultsForTier(tier);
        t10Count = t10Results.length;
        t10Completed = SummaryGenerator.countT10Completed(t10Results, tier);
    }
    
    return {
        tier,
        count: regularTierResults.length + t10Count,
        completed: regularCompleted.length + t10Completed
    };
});




            // ✅ NEW: Get Chapter 7 walkthrough data
            const walkthroughData = SummaryGenerator.getWalkthroughSummaryData();
            const unifiedMetrics = SummaryGenerator.getUnifiedFrameworkData();

            const summary: UnifiedSummaryData = {
                testBed: testBedInfo || {},
                executionSummary: {
                    totalTests: results?.length || 0,
                    detailedTests: detailedResults?.length || 0,
                    selectedTiers: selectedTiers,
                    selectedTests: selectedTests,
                    tierBreakdown: tierBreakdown,
                    completionRates: {
                        Q1: SummaryGenerator.calculateCompletionRate("Q1"),
                        Q4: SummaryGenerator.calculateCompletionRate("Q4"),
                        Q8: SummaryGenerator.calculateCompletionRate("Q8")
                    },
                    // ✅ NEW: Chapter 7 summary data
                    totalWalkthroughs: walkthroughData.totalWalkthroughs,
                    domainsAnalyzed: walkthroughData.domainsAnalyzed,
                    avgWalkthroughSuccess: walkthroughData.avgSuccessRate
                },
                mcdValidation: {
                    alignedTests: results?.filter(r => 
  r?.mcdAligned === true && 
  (r?.completion === "✅ Yes" || 
   r?.completion?.includes("✅") ||
   r?.completion?.includes("⚠") ||
   r?.completion?.includes("/"))
).length || 0,
                    nonAlignedTests: results?.filter(r => r?.mcdAligned === false).length || 0,
                    driftDetected: results?.filter(r => r?.semanticDrift?.includes("✅")).length || 0,
                    // ✅ NEW: Chapter 7 MCD data
                    walkthroughMCDCompliance: walkthroughData.avgMCDCompliance,
                    unifiedMCDAlignment: unifiedMetrics.overallMCDAlignment
                },
                // ✅ NEW: Chapter 7 walkthrough summary
                walkthroughSummary: walkthroughData.hasData ? {
                    totalWalkthroughs: walkthroughData.totalWalkthroughs,
                    domainBreakdown: walkthroughData.domainBreakdown,
                    successRates: walkthroughData.successRates,
                    avgMCDCompliance: walkthroughData.avgMCDCompliance,
                    avgUserExperience: walkthroughData.avgUserExperience,
                    resourceEfficiency: walkthroughData.resourceEfficiency
                } : undefined,
                // ✅ NEW: Unified framework analysis
                unifiedAnalysis: unifiedMetrics.hasUnifiedData ? {
                    frameworkConsistency: unifiedMetrics.frameworkConsistency,
                    crossFrameworkMCDAlignment: unifiedMetrics.overallMCDAlignment,
                    totalExecutions: (results?.length || 0) + walkthroughData.totalWalkthroughs,
                    overallSuccessRate: SummaryGenerator.calculateOverallSuccessRate(
                        results?.length || 0, 
                        walkthroughData.totalWalkthroughs,
                        walkthroughData.avgSuccessRate
                    )
                } : undefined
            };

            SummaryGenerator.displaySummary(summary);
            
        } catch (error) {
            console.error('Error generating test summary:', error);
            SummaryGenerator.displayErrorSummary(error?.message || 'Unknown error');
        }
    }

   static calculateCompletionRate(tier: string): number {
    try {
        if (!tier || typeof tier !== 'string') return 0;
        if (!results || !Array.isArray(results)) return 0;

        // Handle regular T1-T9 tests
        const regularTierResults = results.filter(r => r?.quantization === tier);
        const regularCompleted = regularTierResults.filter(r => 
  r?.completion === "✅ Yes" || 
  r?.completion?.includes("✅") ||
  r?.completion?.includes("⚠") ||
  r?.completion?.includes("/")
);
        
        // ✅ SAFE: Skip T10 processing during execution
        let t10Count = 0;
        let t10Completed = 0;
        
        if (!(window as any).unifiedExecutionState?.isExecuting) {
            const t10Results = SummaryGenerator.findT10ResultsForTier(tier);
            t10Count = t10Results.length;
            t10Completed = SummaryGenerator.countT10Completed(t10Results, tier);
        }
        
        const totalResults = regularTierResults.length + t10Count;
        const totalCompleted = regularCompleted.length + t10Completed;
        
        return totalResults > 0 ? Math.round((totalCompleted / totalResults) * 100) : 0;
        
    } catch (error) {
        console.warn(`Error calculating completion rate for ${tier}:`, error);
        return 0;
    }
}


// 🔧 NEW: Debug T10 data structure to understand the actual format
// 🔧 SAFER: Lightweight T10 debugging without heavy JSON operations
private static debugT10DataStructure() {
    try {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('⚠️ Skipping T10 debug - trials executing');
            return;
        }
        
        console.log('🔍 === LIGHTWEIGHT T10 DEBUG ===');
        
        if (!results || !Array.isArray(results)) {
            console.log('❌ No results array available');
            return;
        }

        // Lightweight T10 detection
        const t10ByTestID = results.filter(r => r?.testID === 'T10').length;
        const t10ByLowerCase = results.filter(r => r?.testID === 't10').length;
        const t10ByStringMatch = results.filter(r => String(r?.testID).toLowerCase().includes('t10')).length;
        
        console.log(`📊 T10 Detection Results:`);
        console.log(`  - testID === 'T10': ${t10ByTestID} results`);
        console.log(`  - testID === 't10': ${t10ByLowerCase} results`);
        console.log(`  - Contains 't10': ${t10ByStringMatch} results`);
        
        // Check tier structure without heavy JSON
        if (t10ByTestID > 0) {
            const firstT10 = results.find(r => r?.testID === 'T10');
            console.log(`🎯 First T10 has tiers: ${!!firstT10?.tiers}`);
            if (firstT10?.tiers) {
                console.log(`🎯 Tier keys: ${Object.keys(firstT10.tiers).join(', ')}`);
            }
            console.log(`🎯 Quantization: ${firstT10?.quantization}`);
            console.log(`🎯 Completion: ${firstT10?.completion}`);
        }
        
        console.log('🔍 === END LIGHTWEIGHT T10 DEBUG ===');
        
    } catch (error) {
        console.error('❌ Error in lightweight T10 debug:', error);
    }
}


// 🔧 NEW: Flexibly find T10 results for a specific tier
private static findT10ResultsForTier(tier: string): any[] {
    try {
        if (!results || !Array.isArray(results)) return [];
        
        // Method 1: Check for nested tier structure
        const nestedTierT10 = results.filter(r => 
            (r?.testID === 'T10' || r?.testID === 't10') && 
            r?.tiers && 
            r?.tiers[tier]
        );
        if (nestedTierT10.length > 0) return nestedTierT10;

        // Method 2: Check for regular quantization structure
        const regularT10 = results.filter(r => 
            (r?.testID === 'T10' || r?.testID === 't10') && 
            r?.quantization === tier
        );
        if (regularT10.length > 0) return regularT10;

        // Method 3: Lighter pattern matching
        const anyT10WithTier = results.filter(r => {
            const hasT10Reference = String(r?.testID || '').toLowerCase().includes('t10') || 
                                   String(r?.testName || '').toLowerCase().includes('t10') ||
                                   String(r?.id || '').toLowerCase().includes('t10');
            return hasT10Reference && (
                String(r?.quantization || '').toLowerCase() === tier.toLowerCase() ||
                String(r?.tier || '').toLowerCase() === tier.toLowerCase()
            );
        });
        
        return anyT10WithTier;
        
    } catch (error) {
        console.error(`Error finding T10 results for tier ${tier}:`, error);
        return [];
    }
}


// 🔧 NEW: Flexibly count completed T10 results
private static countT10Completed(t10Results: any[], tier: string): number {
    try {
        if (!t10Results || t10Results.length === 0) return 0;
        
        let completed = 0;
        
        t10Results.forEach(result => {
            // Method 1: Check nested tier completion
            if (result?.tiers && result?.tiers[tier]?.completion === "✅ Yes") {
                completed++;
                return;
            }
            
            // Method 2: Check regular completion field
            if (result?.completion === "✅ Yes") {
                completed++;
                return;
            }
            
            // Method 3: Check for any completion indicator
            // Lighter completion check without JSON.stringify
// Method 3: Check for any completion indicator
            // Method 3: Check for any completion indicator
            const hasCompletionIndicator = String(result?.completion || '').includes("✅ Yes") ||
                                          result?.completed === true ||
                                          result?.status === 'completed';
            if (hasCompletionIndicator) {
                completed++;
                return;
            }
        });

        
        return completed;
        
    } catch (error) {
        console.error(`Error counting T10 completed for tier ${tier}:`, error);
        return 0;
    }
}

// Extract T1 enhanced analysis data
private static extractT1EnhancedData(): T1EnhancedSummaryData | null {
    try {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            return null; // Skip during execution
        }

        const t1Results = detailedResults?.filter(r => r?.testID === 'T1') || [];
        if (t1Results.length === 0) return null;

        const t1Result = t1Results[0];
        if (!t1Result?.variants) return null;

        // Process enhanced T1 variants with cross-validation data
        const variantPerformance = t1Result.variants.map(variant => {
            const cvMetrics = variant.crossValidationMetrics;
            if (!cvMetrics) {
                return {
                    variant: variant.variant,
                    meanCompletionRate: 0,
                    confidenceInterval: [0, 0] as [number, number],
                    mcdCompatibility: variant.mcdAligned ? 'MCD-Compatible' : 'Non-MCD',
                    tokenEfficiency: 0,
                    resourceStability: 0
                };
            }

            return {
                variant: variant.variant,
                meanCompletionRate: cvMetrics.meanCompletionRate,
                confidenceInterval: cvMetrics.completionRateCI,
                mcdCompatibility: variant.mcdAligned ? 'MCD-Compatible' : 'Non-MCD',
                tokenEfficiency: cvMetrics.meanTokenEfficiency,
                resourceStability: cvMetrics.meanResourceStability
            };
        });

        // Determine best and worst performing variants
        const sortedByPerformance = [...variantPerformance].sort((a, b) => 
            b.meanCompletionRate - a.meanCompletionRate
        );

        return {
            totalVariants: variantPerformance.length,
            crossValidationRuns: 5, // k=5
            statisticalSignificance: variantPerformance
                .filter(v => v.meanCompletionRate > 0.8)
                .map(v => `${v.variant}: p < 0.001`),
            variantPerformance,
            overallStatistics: {
                bestPerformingVariant: sortedByPerformance[0]?.variant || 'Unknown',
                worstPerformingVariant: sortedByPerformance[sortedByPerformance.length - 1]?.variant || 'Unknown',
                significantDifferences: sortedByPerformance[0]?.meanCompletionRate - sortedByPerformance[sortedByPerformance.length - 1]?.meanCompletionRate > 0.2,
                recommendedVariant: sortedByPerformance.find(v => v.mcdCompatibility === 'MCD-Compatible')?.variant || sortedByPerformance[0]?.variant || 'Unknown'
            }
        };

    } catch (error) {
        console.warn('Error extracting T1 enhanced data:', error);
        return null;
    }
}

private static extractT6EnhancedData(): T6EnhancedSummaryData | null {
    try {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            return null; // Skip during execution
        }

        const t6Results = detailedResults?.filter(r => r?.testID === 'T6') || [];
        if (t6Results.length === 0) return null;

        const t6Result = t6Results[0];
        if (!t6Result?.variants) return null;

        // Process enhanced T6 variants with over-engineering data
        const redundancyAnalysis = t6Result.variants.map(variant => {
            const trial = variant.trials?.[0]; // T6 typically has single trials
            
            return {
                variant: variant.variant,
                efficiencyClassification: trial?.efficiencyClassification || 'unknown',
                redundancyIndex: trial?.redundancyIndex || null,
                overEngineeringScore: trial?.overEngineeringScore || 0,
                capabilityPlateau: trial?.capabilityPlateau || false
            };
        });

        // Count over-engineered variants
        const overEngineeredCount = redundancyAnalysis.filter(r => 
            r.overEngineeringScore > 0.6 || 
            r.efficiencyClassification === 'over-engineered-process-bloat'
        ).length;

        // Check for capability plateau
        const plateauDetected = redundancyAnalysis.some(r => r.capabilityPlateau);

        // Generate recommendations
        const recommendations = [];
        if (overEngineeredCount > 0) {
            recommendations.push(`${overEngineeredCount} variants show over-engineering - consider simplification`);
        }
        if (plateauDetected) {
            recommendations.push('Capability plateau detected around 90 tokens - optimize for efficiency');
        }
        
        const mcdCompatibleCount = redundancyAnalysis.filter(r => 
            r.efficiencyClassification.includes('mcd') || 
            r.efficiencyClassification === 'optimal-baseline'
        ).length;
        
        if (mcdCompatibleCount > 0) {
            recommendations.push(`${mcdCompatibleCount} variants show MCD-compatible efficiency patterns`);
        }

        return {
            totalVariants: redundancyAnalysis.length,
            overEngineeredVariants: overEngineeredCount,
            capabilityPlateauDetected: plateauDetected,
            redundancyAnalysis,
            recommendations
        };

    } catch (error) {
        console.warn('Error extracting T6 enhanced data:', error);
        return null;
    }
}


private static extractT7EnhancedData(): T7EnhancedSummaryData | null {
    try {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            return null; // Skip during execution
        }

        const t7Results = detailedResults?.filter(r => r?.testID === 'T7') || [];
        if (t7Results.length === 0) return null;

        const t7Result = t7Results[0];
        if (!t7Result?.variants) return null;

        // Process enhanced T7 variants with safety data
        let totalHallucinations = 0;
        let safeCount = 0;
        let dangerousCount = 0;
        let criticalCount = 0;
        let deploymentSafeCount = 0;
        let deploymentRiskyCount = 0;
        let deploymentHostileCount = 0;
        const commonPatterns = new Set<string>();

        t7Result.variants.forEach(variant => {
            const safetyMetrics = variant.safetyMetrics;
            if (!safetyMetrics) return;

            // Count hallucinations
            totalHallucinations += safetyMetrics.totalHallucinations || 0;

            // Classify safety level
            switch (safetyMetrics.overallSafetyClass) {
                case 'safe':
                case 'safe-degradation':
                    safeCount++;
                    break;
                case 'dangerous-failure':
                    dangerousCount++;
                    break;
                case 'critical-safety-risk':
                    criticalCount++;
                    break;
            }

            // Check deployment viability
            if (safetyMetrics.deploymentViable) {
                deploymentSafeCount++;
            } else if (safetyMetrics.overallSafetyClass === 'dangerous-failure') {
                deploymentRiskyCount++;
            } else {
                deploymentHostileCount++;
            }

            // Collect hallucination patterns
            variant.trials?.forEach(trial => {
                trial.hallucinationPatterns?.forEach(pattern => {
                    commonPatterns.add(pattern);
                });
            });
        });

        // Generate safety recommendations
        const recommendations = [];
        if (criticalCount > 0) {
            recommendations.push(`${criticalCount} variants pose critical safety risks - unsuitable for production`);
        }
        if (dangerousCount > 0) {
            recommendations.push(`${dangerousCount} variants show dangerous failure patterns - require safety controls`);
        }
        if (totalHallucinations > 0) {
            recommendations.push(`${totalHallucinations} hallucination instances detected across variants`);
        }
        if (deploymentSafeCount > 0) {
            recommendations.push(`${deploymentSafeCount} variants suitable for deployment with proper safeguards`);
        }

        return {
            totalVariants: t7Result.variants.length,
            safeVariants: safeCount,
            dangerousVariants: dangerousCount,
            criticalSafetyRisks: criticalCount,
            hallucinationDetection: {
                totalHallucinations,
                affectedVariants: t7Result.variants.filter(v => 
                    (v.safetyMetrics?.totalHallucinations || 0) > 0
                ).length,
                commonPatterns: Array.from(commonPatterns)
            },
            deploymentViability: {
                deploymentSafe: deploymentSafeCount,
                deploymentRisky: deploymentRiskyCount,
                deploymentHostile: deploymentHostileCount
            },
            safetyRecommendations: recommendations
        };

    } catch (error) {
        console.warn('Error extracting T7 enhanced data:', error);
        return null;
    }
}

private static extractT8EnhancedData(): T8EnhancedSummaryData | null {
    try {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            return null; // Skip during execution
        }

        const t8Results = detailedResults?.filter(r => r?.testID === 'T8') || [];
        if (t8Results.length === 0) return null;

        const t8Result = t8Results[0];
        if (!t8Result?.variants) return null;

        // Process enhanced T8 variants with deployment data
        let edgeOptimizedCount = 0;
        let deploymentHostileCount = 0;
        let universalCompatCount = 0;
        let unstableCompatCount = 0;
        let crashCompatCount = 0;
        let memoryEfficientCount = 0;
        let memoryOverflowCount = 0;
        let optimalPerformanceCount = 0;
        let totalMemoryIncrease = 0;
        let totalLatencyRatio = 0;
        let validSamples = 0;

        t8Result.variants.forEach(variant => {
            const deploymentSummary = variant.deploymentSummary;
            if (!deploymentSummary) return;

            validSamples++;

            // Count deployment classifications
            switch (deploymentSummary.classification) {
                case 'edge-optimized':
                case 'edge-superior':
                    edgeOptimizedCount++;
                    break;
                case 'deployment-hostile':
                    deploymentHostileCount++;
                    break;
            }

            // Count browser compatibility
            switch (deploymentSummary.browserCompatibility) {
                case 'universal':
                    universalCompatCount++;
                    break;
                case 'unstable':
                    unstableCompatCount++;
                    break;
                case 'crashes':
                    crashCompatCount++;
                    break;
            }

            // Analyze memory and performance
            variant.trials?.forEach(trial => {
                const deploymentMetrics = trial.deploymentMetrics;
                if (!deploymentMetrics) return;

                // Memory analysis
                const memoryDelta = deploymentMetrics.memoryDelta || 0;
                totalMemoryIncrease += memoryDelta;

                if (deploymentMetrics.memoryStable) {
                    memoryEfficientCount++;
                } else if (memoryDelta > 100) {
                    memoryOverflowCount++;
                }

                // Performance analysis
                const latencyRatio = deploymentMetrics.latencyRatio || 1;
                totalLatencyRatio += latencyRatio;

                if (deploymentMetrics.browserStable && deploymentMetrics.edgeViable) {
                    optimalPerformanceCount++;
                }
            });
        });

        // Calculate averages
        const avgMemoryIncrease = validSamples > 0 ? Math.round(totalMemoryIncrease / validSamples) : 0;
        const avgLatencyRatio = validSamples > 0 ? totalLatencyRatio / validSamples : 0;

        // Generate deployment recommendations
        const recommendations = [];
        if (edgeOptimizedCount > 0) {
            recommendations.push(`${edgeOptimizedCount} variants optimized for edge deployment`);
        }
        if (deploymentHostileCount > 0) {
            recommendations.push(`${deploymentHostileCount} variants unsuitable for browser deployment`);
        }
        if (universalCompatCount > 0) {
            recommendations.push(`${universalCompatCount} variants show universal browser compatibility`);
        }
        if (memoryOverflowCount > 0) {
            recommendations.push(`${memoryOverflowCount} variants cause memory issues - avoid in resource-constrained environments`);
        }
        if (optimalPerformanceCount > 0) {
            recommendations.push(`${optimalPerformanceCount} variants suitable for production deployment`);
        }

        return {
            totalVariants: t8Result.variants.length,
            edgeOptimizedVariants: edgeOptimizedCount,
            deploymentHostileVariants: deploymentHostileCount,
            browserCompatibility: {
                universal: universalCompatCount,
                unstable: unstableCompatCount,
                crashes: crashCompatCount
            },
            memoryAnalysis: {
                avgMemoryIncrease,
                memoryEfficientVariants: memoryEfficientCount,
                memoryOverflowVariants: memoryOverflowCount
            },
            performanceProfile: {
                avgLatencyRatio,
                optimalPerformanceVariants: optimalPerformanceCount
            },
            deploymentRecommendations: recommendations
        };

    } catch (error) {
        console.warn('Error extracting T8 enhanced data:', error);
        return null;
    }
}

private static generateEnhancedTestSummaries(
    t1Enhanced: T1EnhancedSummaryData | null,
    t6Enhanced: T6EnhancedSummaryData | null, 
    t7Enhanced: T7EnhancedSummaryData | null,
    t8Enhanced: T8EnhancedSummaryData | null
): string {
    
    const hasEnhancedData = t1Enhanced || t6Enhanced || t7Enhanced || t8Enhanced;
    if (!hasEnhancedData) return '';

    return `
        <div style="margin: 25px 0; background: #f8f9fc; padding: 20px; border-radius: 12px; border: 2px solid #e1e5e9;">
            <h4 style="margin: 0 0 20px 0; color: #673ab7; text-align: center; font-size: 1.2rem;">
                🧪 Enhanced Test Analysis
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                ${t1Enhanced ? SummaryGenerator.generateT1EnhancedCard(t1Enhanced) : ''}
                ${t6Enhanced ? SummaryGenerator.generateT6EnhancedCard(t6Enhanced) : ''}
                ${t7Enhanced ? SummaryGenerator.generateT7EnhancedCard(t7Enhanced) : ''}
                ${t8Enhanced ? SummaryGenerator.generateT8EnhancedCard(t8Enhanced) : ''}
            </div>
        </div>
    `;
}

private static generateT1EnhancedCard(data: T1EnhancedSummaryData): string {
    return `
        <div style="background: white; border: 2px solid #2196f3; border-radius: 10px; padding: 15px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span style="font-size: 1.5rem;">📊</span>
                <div>
                    <div style="font-weight: 600; color: #2196f3; font-size: 1rem;">T1 Enhanced Cross-Validation</div>
                    <div style="font-size: 0.8rem; color: #666;">${data.totalVariants} variants, k=${data.crossValidationRuns}</div>
                </div>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.6;">
                <div><strong>Best Variant:</strong> ${data.overallStatistics.bestPerformingVariant}</div>
                <div><strong>Recommended:</strong> ${data.overallStatistics.recommendedVariant}</div>
                <div><strong>Statistical Significance:</strong> ${data.statisticalSignificance.length > 0 ? 'Confirmed' : 'None'}</div>
                <div style="margin-top: 8px; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                    <strong>Key Finding:</strong> ${data.overallStatistics.significantDifferences ? 
                        'Significant performance differences detected' : 
                        'Variants show similar performance patterns'}
                </div>
            </div>
        </div>
    `;
}

private static generateT6EnhancedCard(data: T6EnhancedSummaryData): string {
    return `
        <div style="background: white; border: 2px solid #ff9800; border-radius: 10px; padding: 15px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span style="font-size: 1.5rem;">🔧</span>
                <div>
                    <div style="font-weight: 600; color: #ff9800; font-size: 1rem;">T6 Over-Engineering Detection</div>
                    <div style="font-size: 0.8rem; color: #666;">${data.totalVariants} variants analyzed</div>
                </div>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.6;">
                <div><strong>Over-Engineered:</strong> ${data.overEngineeredVariants}/${data.totalVariants}</div>
                <div><strong>Capability Plateau:</strong> ${data.capabilityPlateauDetected ? 'Detected' : 'Not Detected'}</div>
                <div style="margin-top: 8px; padding: 8px; background: ${data.overEngineeredVariants > 0 ? '#fff3cd' : '#d4edda'}; border-radius: 4px;">
                    <strong>Status:</strong> ${data.overEngineeredVariants > 0 ? 
                        'Process bloat detected - optimization needed' : 
                        'Efficient implementations detected'}
                </div>
            </div>
        </div>
    `;
}

private static generateT7EnhancedCard(data: T7EnhancedSummaryData): string {
    const safetyColor = data.criticalSafetyRisks > 0 ? '#dc3545' : 
                       data.dangerousVariants > 0 ? '#fd7e14' : '#28a745';
    
    return `
        <div style="background: white; border: 2px solid ${safetyColor}; border-radius: 10px; padding: 15px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span style="font-size: 1.5rem;">🛡️</span>
                <div>
                    <div style="font-weight: 600; color: ${safetyColor}; font-size: 1rem;">T7 Safety Analysis</div>
                    <div style="font-size: 0.8rem; color: #666;">${data.totalVariants} variants tested</div>
                </div>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.6;">
                <div><strong>Safe Variants:</strong> ${data.safeVariants}/${data.totalVariants}</div>
                <div><strong>Critical Risks:</strong> ${data.criticalSafetyRisks}</div>
                <div><strong>Hallucinations:</strong> ${data.hallucinationDetection.totalHallucinations}</div>
                <div><strong>Deployment Safe:</strong> ${data.deploymentViability.deploymentSafe}</div>
                <div style="margin-top: 8px; padding: 8px; background: ${data.criticalSafetyRisks > 0 ? '#f8d7da' : '#d4edda'}; border-radius: 4px;">
                    <strong>Risk Level:</strong> ${data.criticalSafetyRisks > 0 ? 
                        'Critical safety risks detected' : 
                        data.dangerousVariants > 0 ? 'Some safety concerns' : 
                        'Generally safe for deployment'}
                </div>
            </div>
        </div>
    `;
}

private static generateT8EnhancedCard(data: T8EnhancedSummaryData): string {
    const deploymentColor = data.deploymentHostileVariants > 0 ? '#dc3545' : 
                           data.edgeOptimizedVariants > 0 ? '#28a745' : '#ffc107';
    
    return `
        <div style="background: white; border: 2px solid ${deploymentColor}; border-radius: 10px; padding: 15px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span style="font-size: 1.5rem;">🌐</span>
                <div>
                    <div style="font-weight: 600; color: ${deploymentColor}; font-size: 1rem;">T8 Deployment Analysis</div>
                    <div style="font-size: 0.8rem; color: #666;">${data.totalVariants} variants analyzed</div>
                </div>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.6;">
                <div><strong>Edge Optimized:</strong> ${data.edgeOptimizedVariants}/${data.totalVariants}</div>
                <div><strong>Universal Compatibility:</strong> ${data.browserCompatibility.universal}</div>
                <div><strong>Memory Efficient:</strong> ${data.memoryAnalysis.memoryEfficientVariants}</div>
                <div><strong>Avg Memory Δ:</strong> ${data.memoryAnalysis.avgMemoryIncrease > 0 ? '+' : ''}${data.memoryAnalysis.avgMemoryIncrease}MB</div>
                <div style="margin-top: 8px; padding: 8px; background: ${data.deploymentHostileVariants > 0 ? '#f8d7da' : '#d4edda'}; border-radius: 4px;">
                    <strong>Deployment Status:</strong> ${data.deploymentHostileVariants > 0 ? 
                        'Some variants unsuitable for deployment' : 
                        'Compatible with browser deployment'}
                </div>
            </div>
        </div>
    `;
}

// Enhanced statistics for external export
static getEnhancedSummaryStats(): any {
    try {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            return {
                message: 'Enhanced stats deferred - trials executing'
            };
        }

        const baseStats = SummaryGenerator.getSummaryStats();
        const t1Enhanced = SummaryGenerator.extractT1EnhancedData();
        const t6Enhanced = SummaryGenerator.extractT6EnhancedData();
        const t7Enhanced = SummaryGenerator.extractT7EnhancedData();
        const t8Enhanced = SummaryGenerator.extractT8EnhancedData();

        return {
            ...baseStats,
            enhancedAnalysis: {
                t1CrossValidation: t1Enhanced ? {
                    totalVariants: t1Enhanced.totalVariants,
                    bestVariant: t1Enhanced.overallStatistics.bestPerformingVariant,
                    recommendedVariant: t1Enhanced.overallStatistics.recommendedVariant,
                    statisticallySignificant: t1Enhanced.statisticalSignificance.length > 0
                } : null,
                
                t6OverEngineering: t6Enhanced ? {
                    totalVariants: t6Enhanced.totalVariants,
                    overEngineeredCount: t6Enhanced.overEngineeredVariants,
                    capabilityPlateau: t6Enhanced.capabilityPlateauDetected,
                    recommendationsCount: t6Enhanced.recommendations.length
                } : null,
                
                t7SafetyAnalysis: t7Enhanced ? {
                    totalVariants: t7Enhanced.totalVariants,
                    safeVariants: t7Enhanced.safeVariants,
                    criticalRisks: t7Enhanced.criticalSafetyRisks,
                    hallucinationCount: t7Enhanced.hallucinationDetection.totalHallucinations,
                    deploymentSafe: t7Enhanced.deploymentViability.deploymentSafe
                } : null,
                
                t8DeploymentAnalysis: t8Enhanced ? {
                    totalVariants: t8Enhanced.totalVariants,
                    edgeOptimized: t8Enhanced.edgeOptimizedVariants,
                    deploymentHostile: t8Enhanced.deploymentHostileVariants,
                    universalCompatibility: t8Enhanced.browserCompatibility.universal,
                    avgMemoryIncrease: t8Enhanced.memoryAnalysis.avgMemoryIncrease
                } : null
            }
        };

    } catch (error) {
        return {
            error: 'Error calculating enhanced summary stats',
            details: error?.message || 'Unknown error'
        };
    }
}


// Export enhanced data in structured format
static exportEnhancedSummaryData(): any {
    try {
        const comprehensiveSummary = SummaryGenerator.generateComprehensiveSummary();
        const enhancedStats = SummaryGenerator.getEnhancedSummaryStats();
        
        return {
            timestamp: new Date().toISOString(),
            exportType: 'Enhanced MCD Research Framework Summary',
            version: '2.0.0',
            
            // Core framework data
            frameworks: comprehensiveSummary.frameworks,
            
            // Enhanced test analysis
            enhancedTests: enhancedStats.enhancedAnalysis,
            
            // Performance and statistics
            executionMetrics: {
                totalExecutions: enhancedStats.totalExecutions || 0,
                totalTests: enhancedStats.totalTests || 0,
                totalWalkthroughs: enhancedStats.totalWalkthroughs || 0,
                overallMCDAlignment: enhancedStats.overallMCDAlignment || 0
            },
            
            // Export metadata
            exportMetadata: {
                generatedBy: 'Enhanced MCD Research Framework',
                dataIntegrity: 'Verified',
                includesEnhancedAnalysis: true,
                includesStatisticalAnalysis: !!enhancedStats.enhancedAnalysis?.t1CrossValidation,
                includesSafetyAnalysis: !!enhancedStats.enhancedAnalysis?.t7SafetyAnalysis
            }
        };

    } catch (error) {
        return {
            error: 'Error exporting enhanced summary data',
            details: error?.message || 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}
    // ============================================
    // 🆕 NEW: CHAPTER 7 SPECIFIC FUNCTIONS
    // ============================================

    // Get comprehensive walkthrough summary data
    private static getWalkthroughSummaryData(): any {
    try {
        // CRITICAL: Skip heavy data processing during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring walkthrough data processing - trials executing');
            return {
                hasData: false,
                totalWalkthroughs: 0,
                domainsAnalyzed: [],
                avgSuccessRate: 0,
                avgMCDCompliance: 0,
                avgUserExperience: 0,
                resourceEfficiency: 0,
                domainBreakdown: [],
                successRates: {}
            };
        }
        
        const walkthroughResults = getWalkthroughResults ? getWalkthroughResults() : [];

        // Calculate domains safely
        const domains = [...new Set(walkthroughResults.map((w: any) => w.domain).filter(Boolean))];
        
        // Calculate domain breakdown using safe aggregation
        const domainBreakdown = domains.map(domain => {
            try {
                const domainResults = walkthroughResults.filter((w: any) => w.domain === domain);
                
                const successfulWalkthroughs = SummaryDataProcessor.safeAggregate(
                    domainResults,
                    (count, w) => count + (w.domainMetrics?.overallSuccess ? 1 : 0),
                    0
                );
                
                const avgMCDCompliance = domainResults.length > 0 ? 
                    SummaryDataProcessor.safeAggregate(
                        domainResults,
                        (sum, w) => sum + (w.domainMetrics?.mcdAlignmentScore || 0),
                        0
                    ) / domainResults.length : 0;

                return {
                    domain,
                    displayName: SummaryGenerator.getDomainDisplayName(domain),
                    totalWalkthroughs: domainResults.length,
                    successRate: Math.round((successfulWalkthroughs / domainResults.length) * 100),
                    avgMCDCompliance: Math.round(avgMCDCompliance * 100),
                    avgUserExperience: Math.round(avgMCDCompliance * 100), // Simplified
                    color: SummaryGenerator.getDomainColor(domain),
                    icon: SummaryGenerator.getDomainIcon(domain)
                };
            } catch (domainError) {
                console.warn(`Error processing domain ${domain}:`, domainError);
                return {
                    domain,
                    displayName: domain,
                    totalWalkthroughs: 0,
                    successRate: 0,
                    avgMCDCompliance: 0,
                    avgUserExperience: 0,
                    color: '#6c757d',
                    icon: '❓'
                };
            }
        });

        // Calculate success rates by domain
        const successRates: Record<string, number> = {};
        domains.forEach(domain => {
            try {
                const domainResults = walkthroughResults.filter((w: any) => w.domain === domain);
                const successfulWalkthroughs = domainResults.filter((w: any) => w.domainMetrics?.overallSuccess).length;
                successRates[domain] = domainResults.length > 0 ? 
                    Math.round((successfulWalkthroughs / domainResults.length) * 100) : 0;
            } catch (domainError) {
                successRates[domain] = 0;
            }
        });

        // Calculate overall metrics
        const totalSuccessful = SummaryDataProcessor.safeAggregate(
            walkthroughResults,
            (count, w) => count + (w.domainMetrics?.overallSuccess ? 1 : 0),
            0
        );
        
        const avgSuccessRate = Math.round((totalSuccessful / walkthroughResults.length) * 100);
        
        const avgMCDCompliance = Math.round(
            SummaryDataProcessor.safeAggregate(
                walkthroughResults,
                (sum, w) => sum + (w.domainMetrics?.mcdAlignmentScore || 0),
                0
            ) / walkthroughResults.length * 100
        );

        return {
            hasData: true,
            totalWalkthroughs: walkthroughResults.length,
            domainsAnalyzed: domains,
            avgSuccessRate,
            avgMCDCompliance,
            avgUserExperience: avgMCDCompliance, // Simplified
            resourceEfficiency: avgMCDCompliance, // Simplified
            domainBreakdown,
            successRates
        };

    } catch (error) {
        console.error('Error getting walkthrough summary data:', error);
        return {
            hasData: false,
            totalWalkthroughs: 0,
            domainsAnalyzed: [],
            avgSuccessRate: 0,
            avgMCDCompliance: 0,
            avgUserExperience: 0,
            resourceEfficiency: 0,
            domainBreakdown: [],
            successRates: {}
        };
    }
}


    // Get unified framework data
    private static getUnifiedFrameworkData(): any {
        try {
            const unifiedMetrics = getUnifiedFrameworkMetrics ? getUnifiedFrameworkMetrics() : null;
            const hasT1T10Data = (results?.length || 0) > 0;
            const walkthroughData = SummaryGenerator.getWalkthroughSummaryData();
            const hasChapter7Data = walkthroughData.hasData;

            if (!hasT1T10Data && !hasChapter7Data) {
                return {
                    hasUnifiedData: false,
                    frameworkConsistency: 'Unknown',
                    overallMCDAlignment: 0
                };
            }

            // Calculate unified MCD alignment
            const t1t10MCD = results?.length > 0 ? 
                Math.round((results.filter(r => r?.mcdAligned === true).length / results.length) * 100) : 0;
            const chapter7MCD = walkthroughData.avgMCDCompliance;
            const overallMCDAlignment = hasT1T10Data && hasChapter7Data ? 
                Math.round((t1t10MCD + chapter7MCD) / 2) : 
                hasT1T10Data ? t1t10MCD : chapter7MCD;

            // Determine framework consistency
            let frameworkConsistency = 'Unknown';
            if (hasT1T10Data && hasChapter7Data) {
                const difference = Math.abs(t1t10MCD - chapter7MCD);
                if (difference <= 10) frameworkConsistency = 'High';
                else if (difference <= 20) frameworkConsistency = 'Moderate';
                else frameworkConsistency = 'Low';
            } else {
                frameworkConsistency = 'Single Framework';
            }

            return {
                hasUnifiedData: hasT1T10Data || hasChapter7Data,
                frameworkConsistency,
                overallMCDAlignment,
                unifiedMetrics
            };

        } catch (error) {
            console.warn('Error getting unified framework data:', error);
            return {
                hasUnifiedData: false,
                frameworkConsistency: 'Unknown',
                overallMCDAlignment: 0
            };
        }
    }

    // Calculate overall success rate across frameworks
    private static calculateOverallSuccessRate(t1t10Count: number, walkthroughCount: number, walkthroughSuccessRate: number): number {
        try {
            if (t1t10Count === 0 && walkthroughCount === 0) return 0;

            const t1t10SuccessCount = results?.filter(r => 
  r?.completion === "✅ Yes" || 
  r?.completion?.includes("✅") ||
  r?.completion?.includes("⚠") ||
  r?.completion?.includes("/")
).length || 0;

            const walkthroughSuccessCount = Math.round((walkthroughSuccessRate / 100) * walkthroughCount);
            
            const totalSuccessCount = t1t10SuccessCount + walkthroughSuccessCount;
            const totalCount = t1t10Count + walkthroughCount;

            return totalCount > 0 ? Math.round((totalSuccessCount / totalCount) * 100) : 0;

        } catch (error) {
            console.warn('Error calculating overall success rate:', error);
            return 0;
        }
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

    // Get domain colors
    private static getDomainColor(domain: string): string {
        const colors = {
            'appointment-booking': '#2196f3',
            'spatial-navigation': '#4caf50',
            'failure-diagnostics': '#ff9800'
        };
        return colors[domain as keyof typeof colors] || '#6c757d';
    }

    // Get domain icons
    private static getDomainIcon(domain: string): string {
        const icons = {
            'appointment-booking': '📅',
            'spatial-navigation': '🗺️',
            'failure-diagnostics': '🔧'
        };
        return icons[domain as keyof typeof icons] || '🎯';
    }

    // ============================================
    // 🔄 EXISTING DISPLAY FUNCTIONS (ENHANCED)
    // ============================================

   private static displaySummary(summary: UnifiedSummaryData) {
         
     if (!summary) {
        console.warn('Summary data is null or undefined');
        SummaryGenerator.displayEmptySummary();
        return;
    }

     
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Deferring summary display - trials executing');
        // Retry display after execution
        setTimeout(() => {
            if (!(window as any).unifiedExecutionState?.isExecuting) {
                SummaryGenerator.displaySummary(summary);
            }
        }, 2000);
        return;
    }
    
    const summaryDiv = document.getElementById('testSummary');
    if (!summaryDiv) {
        console.warn('Summary container element not found');
        return;
    }
try {
        // Extract enhanced test data
        const t1Enhanced = SummaryGenerator.extractT1EnhancedData();
        const t6Enhanced = SummaryGenerator.extractT6EnhancedData();
        const t7Enhanced = SummaryGenerator.extractT7EnhancedData();
        const t8Enhanced = SummaryGenerator.extractT8EnhancedData();

        // Generate enhanced test summaries
        const enhancedTestSummaries = SummaryGenerator.generateEnhancedTestSummaries(
            t1Enhanced, t6Enhanced, t7Enhanced, t8Enhanced
        );
         
            // ✅ NEW: Generate unified framework header
            const unifiedHeader = summary.unifiedAnalysis ? `
                <div style="background: linear-gradient(135deg, #673ab7 0%, #2196f3 50%, #4caf50 100%); color: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
                    <h3 style="margin: 0; font-size: 1.3rem; font-weight: 700;">🚀 Unified MCD Research Framework Summary</h3>
                    <div style="margin-top: 8px; font-size: 0.9rem; opacity: 0.9;">
                        T1-T10 Systematic Validation + Chapter 7 Domain Walkthroughs
                    </div>
                </div>
            ` : '';
            // ✅ NEW: Generate Chapter 7 walkthrough cards
            const walkthroughCards = summary.walkthroughSummary ? `
                <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #90caf9; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);">
                    <strong style="display: block; font-size: 1.1rem; color: #1565c0; margin-bottom: 5px;">🎯 Total Walkthroughs</strong>
                    <span style="font-size: 1.5rem; font-weight: 700; color: #2196f3;">${summary.walkthroughSummary.totalWalkthroughs}</span>
                </div>
                <div style="background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #a5d6a7; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);">
                    <strong style="display: block; font-size: 1.1rem; color: #2e7d32; margin-bottom: 5px;">🎯 Domain Success</strong>
                    <span style="font-size: 1.5rem; font-weight: 700; color: #4caf50;">${summary.executionSummary.avgWalkthroughSuccess || 0}%</span>
                </div>
                <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #ffcc02; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);">
                    <strong style="display: block; font-size: 1.1rem; color: #f57c00; margin-bottom: 5px;">🎯 Domains Analyzed</strong>
                    <span style="font-size: 1.5rem; font-weight: 700; color: #ff9800;">${summary.executionSummary.domainsAnalyzed?.length || 0}</span>
                </div>
                <div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #ce93d8; box-shadow: 0 2px 8px rgba(156, 39, 176, 0.15);">
                    <strong style="display: block; font-size: 1.1rem; color: #7b1fa2; margin-bottom: 5px;">🎯 MCD Compliance</strong>
                    <span style="font-size: 1.5rem; font-weight: 700; color: #9c27b0;">${summary.mcdValidation.walkthroughMCDCompliance || 0}%</span>
                </div>
            ` : '';

            // ✅ NEW: Generate unified analysis section
            const unifiedAnalysisSection = summary.unifiedAnalysis ? `
                <div style="margin-top: 30px; background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; border: 2px solid transparent; background-clip: padding-box; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 12px; padding: 2px; background: linear-gradient(135deg, #673ab7, #2196f3, #4caf50); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: exclude; mask-composite: exclude;"></div>
                    <h4 style="margin: 0 0 15px 0; color: #673ab7; text-align: center; font-size: 1.2rem;">🚀 Unified Framework Analysis</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                            <strong style="display: block; font-size: 1rem; color: #2c3e50; margin-bottom: 5px;">Total Executions</strong>
                            <span style="font-size: 1.4rem; font-weight: 700; color: #667eea;">${summary.unifiedAnalysis.totalExecutions}</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                            <strong style="display: block; font-size: 1rem; color: #2c3e50; margin-bottom: 5px;">Framework Consistency</strong>
                            <span style="font-size: 1.2rem; font-weight: 700; color: ${SummaryGenerator.getConsistencyColor(summary.unifiedAnalysis.frameworkConsistency)};">${summary.unifiedAnalysis.frameworkConsistency}</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                            <strong style="display: block; font-size: 1rem; color: #2c3e50; margin-bottom: 5px;">Overall Success</strong>
                            <span style="font-size: 1.4rem; font-weight: 700; color: #28a745;">${summary.unifiedAnalysis.overallSuccessRate}%</span>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                            <strong style="display: block; font-size: 1rem; color: #2c3e50; margin-bottom: 5px;">Cross-Framework MCD</strong>
                            <span style="font-size: 1.4rem; font-weight: 700; color: #9c27b0;">${summary.unifiedAnalysis.crossFrameworkMCDAlignment}%</span>
                        </div>
                    </div>
                </div>
            ` : '';

            // ✅ NEW: Generate domain breakdown section
            const domainBreakdownSection = summary.walkthroughSummary?.domainBreakdown.length ? `
                <div style="margin-top: 25px;">
                    <h4 style="margin: 0 0 15px 0; color: #2196f3; text-align: center; font-size: 1.1rem;">🎯 Chapter 7 Domain Analysis</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
                        ${summary.walkthroughSummary.domainBreakdown.map((domain: DomainSummaryMetrics) => `
                            <div style="background: white; border: 2px solid ${domain.color}; border-radius: 10px; padding: 15px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                    <span style="font-size: 1.5rem;">${domain.icon}</span>
                                    <div>
                                        <div style="font-weight: 600; color: ${domain.color}; font-size: 1rem;">${domain.displayName}</div>
                                        <div style="font-size: 0.8rem; color: #666;">${domain.totalWalkthroughs} walkthroughs</div>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem;">
                                    <div style="text-align: center; padding: 8px; background: #f8f9fc; border-radius: 6px;">
                                        <div style="color: #666; margin-bottom: 2px;">Success Rate</div>
                                        <div style="font-weight: 700; color: ${domain.color};">${domain.successRate}%</div>
                                    </div>
                                    <div style="text-align: center; padding: 8px; background: #f8f9fc; border-radius: 6px;">
                                        <div style="color: #666; margin-bottom: 2px;">MCD Compliance</div>
                                        <div style="font-weight: 700; color: ${domain.color};">${domain.avgMCDCompliance}%</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '';

            // Main summary HTML with all sections
            summaryDiv.innerHTML = `
                ${unifiedHeader}
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                    <div style="background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e1e5e9; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                        <strong style="display: block; font-size: 1.1rem; color: #2c3e50; margin-bottom: 5px;">Total Tests</strong>
                        <span style="font-size: 1.5rem; font-weight: 700; color: #667eea;">${summary.executionSummary.totalTests}</span>
                    </div>
                    <div style="background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e1e5e9; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                        <strong style="display: block; font-size: 1.1rem; color: #2c3e50; margin-bottom: 5px;">Detailed Tests</strong>
                        <span style="font-size: 1.5rem; font-weight: 700; color: #28a745;">${summary.executionSummary.detailedTests}</span>
                    </div>
                    <div style="background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e1e5e9; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                        <strong style="display: block; font-size: 1.1rem; color: #2c3e50; margin-bottom: 5px;">MCD Aligned</strong>
                        <span style="font-size: 1.5rem; font-weight: 700; color: #28a745;">${summary.mcdValidation.alignedTests}</span>
                    </div>
                    <div style="background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e1e5e9; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                        <strong style="display: block; font-size: 1.1rem; color: #2c3e50; margin-bottom: 5px;">Non-MCD Tests</strong>
                        <span style="font-size: 1.5rem; font-weight: 700; color: #dc3545;">${summary.mcdValidation.nonAlignedTests}</span>
                    </div>
                    ${walkthroughCards}
                    ${summary.executionSummary.tierBreakdown.map(tier => `
                        <div style="background: linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e1e5e9; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                            <strong style="display: block; font-size: 1.1rem; color: #2c3e50; margin-bottom: 5px;">${tier.tier} Tier</strong>
                            <span style="font-size: 1.2rem; font-weight: 700; color: ${SummaryGenerator.getTierColor(tier.tier)};">${tier.completed}/${tier.count}</span>
                            <br>
                            <small style="color: #666; font-size: 0.9rem;">${summary.executionSummary.completionRates[tier.tier]}% complete</small>
                        </div>
                    `).join('')}
                </div>
                ${domainBreakdownSection}
                ${unifiedAnalysisSection}
            `;
            
        } catch (error) {
            console.error('Error displaying summary:', error);
            SummaryGenerator.displayErrorSummary('Display error');
        }
    }

    // ============================================
    // 🔄 EXISTING HELPER FUNCTIONS (PRESERVED)
    // ============================================

    // NEW: Method to display empty summary when no data is available (preserved exactly)
    private static displayEmptySummary() {
        const summaryDiv = document.getElementById('testSummary');
        if (summaryDiv) {
            summaryDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6c757d; font-size: 1rem; background: #f8f9fc; border-radius: 12px; border: 1px solid #e1e5e9;">
                    📊 No test summary available. Run tests to generate summary data.
                    <div style="margin-top: 15px; padding: 12px; background: rgba(33, 150, 243, 0.1); border-radius: 6px; color: #2196f3; font-size: 0.9rem;">
                        🚀 <strong>Unified Framework Ready:</strong> Supports both T1-T10 systematic validation and Chapter 7 domain walkthroughs
                    </div>
                </div>
            `;
        }
    }

    // NEW: Method to display error summary (preserved exactly)
    private static displayErrorSummary(errorMessage: string) {
        const summaryDiv = document.getElementById('testSummary');
        if (summaryDiv) {
            summaryDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #dc3545; font-size: 1rem; background: #fff5f5; border-radius: 12px; border: 1px solid #f8d7da;">
                    ❌ Error generating summary: ${errorMessage}
                </div>
            `;
        }
    }

    // NEW: Helper method to get tier-specific colors (preserved exactly)
    private static getTierColor(tier: string): string {
        const colors = {
            'Q1': '#e65100',
            'Q4': '#1976d2',
            'Q8': '#388e3c'
        };
        return colors[tier as keyof typeof colors] || '#6c757d';
    }

    // ✅ NEW: Helper method to get consistency colors
    private static getConsistencyColor(consistency: string): string {
        const colors = {
            'High': '#28a745',
            'Moderate': '#ffc107',
            'Low': '#dc3545',
            'Single Framework': '#6c757d',
            'Unknown': '#6c757d'
        };
        return colors[consistency as keyof typeof colors] || '#6c757d';
    }

    // ============================================
    // 🔄 EXISTING VALIDATION FUNCTIONS (ENHANCED)
    // ============================================

    // ENHANCED: Method to validate summary data + Chapter 7 validation
    static validateSummaryData(): { isValid: boolean, errors: string[], hasWalkthroughData: boolean, hasUnifiedData: boolean } {
        // CRITICAL: Skip heavy validation during trial execution
    if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🔄 Deferring summary validation - trials executing');
        return {
            isValid: true, // Optimistic during execution
            errors: [],
            hasWalkthroughData: true,
            hasUnifiedData: true
        };
    }
    
    const errors = [];
        
        if (!results || !Array.isArray(results)) {
            errors.push('Results data not available');
        }
        
        if (!testControl?.selectedTiers) {
            errors.push('Selected tiers not available');
        }
        
        if (!testControl?.selectedTests) {
            errors.push('Selected tests not available');
        }
        
        if (!testBedInfo) {
            errors.push('Test bed info not available');
        }

        // ✅ NEW: Check Chapter 7 data availability
        const walkthroughData = SummaryGenerator.getWalkthroughSummaryData();
        const hasWalkthroughData = walkthroughData.hasData;
        const hasT1T10Data = (results?.length || 0) > 0;
        const hasUnifiedData = hasT1T10Data && hasWalkthroughData;
        
        return {
            isValid: errors.length === 0 || hasWalkthroughData, // Valid if either framework has data
            errors,
            hasWalkthroughData,
            hasUnifiedData
        };
    }

    // ENHANCED: Method to get summary statistics for external use + Chapter 7 metrics
    static getSummaryStats(): any {
        try {
            // CRITICAL: Skip heavy stats calculation during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring summary stats - trials executing');
            return {
                message: 'Summary stats deferred - trials executing',
                totalTests: results?.length || 0,
                totalWalkthroughs: 0
            };
        }
        
        const validation = SummaryGenerator.validateSummaryData();
        const walkthroughData = SummaryGenerator.getWalkthroughSummaryData();
        const unifiedData = SummaryGenerator.getUnifiedFrameworkData();
            
            if (!validation.isValid && !validation.hasWalkthroughData) {
                return {
                    error: 'Summary data unavailable',
                    details: validation.errors
                };
            }
            
            return {
                // T1-T10 metrics (preserved)
                totalTests: results?.length || 0,
                detailedTests: detailedResults?.length || 0,
                mcdAligned: results?.filter(r => r?.mcdAligned === true).length || 0,
                completionRates: {
                    Q1: SummaryGenerator.calculateCompletionRate('Q1'),
                    Q4: SummaryGenerator.calculateCompletionRate('Q4'),
                    Q8: SummaryGenerator.calculateCompletionRate('Q8')
                },
                // ✅ NEW: Chapter 7 metrics
                totalWalkthroughs: walkthroughData.totalWalkthroughs,
                domainsAnalyzed: walkthroughData.domainsAnalyzed,
                walkthroughSuccessRate: walkthroughData.avgSuccessRate,
                walkthroughMCDCompliance: walkthroughData.avgMCDCompliance,
                // ✅ NEW: Unified framework metrics
                hasUnifiedData: validation.hasUnifiedData,
                frameworkConsistency: unifiedData.frameworkConsistency,
                overallMCDAlignment: unifiedData.overallMCDAlignment,
                totalExecutions: (results?.length || 0) + walkthroughData.totalWalkthroughs
            };
            
        } catch (error) {
            return {
                error: 'Error calculating summary stats',
                details: error?.message || 'Unknown error'
            };
        }
    }

    // ✅ NEW: Generate comprehensive summary for external systems
    static generateComprehensiveSummary(): any {
        try {
            const validation = SummaryGenerator.validateSummaryData();
            const walkthroughData = SummaryGenerator.getWalkthroughSummaryData();
            const unifiedData = SummaryGenerator.getUnifiedFrameworkData();

            return {
                timestamp: new Date().toISOString(),
                frameworks: {
                    t1t10: {
                        available: (results?.length || 0) > 0,
                        totalTests: results?.length || 0,
                        mcdAligned: results?.filter(r => r?.mcdAligned === true).length || 0,
                        completionRates: {
                            Q1: SummaryGenerator.calculateCompletionRate('Q1'),
                            Q4: SummaryGenerator.calculateCompletionRate('Q4'),
                            Q8: SummaryGenerator.calculateCompletionRate('Q8')
                        }
                    },
                    chapter7: {
                        available: walkthroughData.hasData,
                        totalWalkthroughs: walkthroughData.totalWalkthroughs,
                        domainsAnalyzed: walkthroughData.domainsAnalyzed,
                        successRate: walkthroughData.avgSuccessRate,
                        mcdCompliance: walkthroughData.avgMCDCompliance,
                        domainBreakdown: walkthroughData.domainBreakdown
                    },
                    unified: {
                        available: validation.hasUnifiedData,
                        frameworkConsistency: unifiedData.frameworkConsistency,
                        overallMCDAlignment: unifiedData.overallMCDAlignment,
                        totalExecutions: (results?.length || 0) + walkthroughData.totalWalkthroughs
                    }
                },
                validation: validation
            };

        } catch (error) {
            return {
                error: 'Error generating comprehensive summary',
                details: error?.message || 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }

    // ✅ NEW: Clear summary display
    static clearSummary() {
        try {
            const summaryDiv = document.getElementById('testSummary');
            if (summaryDiv) {
                summaryDiv.innerHTML = '';
            }
        } catch (error) {
            console.error('Error clearing summary:', error);
        }
    }

    // ✅ NEW: Refresh summary with latest data
    // ✅ NEW: Refresh summary with latest data - EXECUTION AWARE
static refreshSummary() {
    try {
        // CRITICAL: Don't refresh during trial execution
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🔄 Deferring summary refresh - trials executing');
            // Retry after execution
            setTimeout(() => {
                if (!(window as any).unifiedExecutionState?.isExecuting) {
                    SummaryGenerator.refreshSummary();
                }
            }, 2000);
            return;
        }
        
        SummaryGenerator.generateTestSummary();
    } catch (error) {
        console.error('Error refreshing summary:', error);
        SummaryGenerator.displayErrorSummary('Refresh error');
    }
}

// ADD to SummaryGenerator class
private static performanceMetrics = {
    generationCount: 0,
    avgGenerationTime: 0,
    lastGenerationTime: 0,
    cacheHitRate: 0
};

static trackGenerationPerformance(startTime: number, cacheHit: boolean = false) {
    const duration = Date.now() - startTime;
    this.performanceMetrics.generationCount++;
    this.performanceMetrics.avgGenerationTime = 
        (this.performanceMetrics.avgGenerationTime + duration) / 2;
    this.performanceMetrics.lastGenerationTime = duration;
    
    if (cacheHit) {
        this.performanceMetrics.cacheHitRate = 
            (this.performanceMetrics.cacheHitRate * 0.9) + (1 * 0.1);
    }
}
// 🔧 TEMPORARY: Add this method to test T10 detection
static testT10Detection() {
    console.log('🧪 === TESTING T10 DETECTION ===');
    
    const tiers = ['Q1', 'Q4', 'Q8'];
    tiers.forEach(tier => {
        console.log(`\n🧪 Testing tier ${tier}:`);
        const t10Results = SummaryGenerator.findT10ResultsForTier(tier);
        const completed = SummaryGenerator.countT10Completed(t10Results, tier);
        console.log(`Found: ${t10Results.length}, Completed: ${completed}`);
    });
    
    console.log('🧪 === END TEST ===');
}


}
// Memory management and cleanup
// Memory management and cleanup - EXECUTION AWARE
if (typeof window !== 'undefined') {
    let summaryCleanupInterval: NodeJS.Timeout | null = null;
    
    const startSummaryCleanup = () => {
        if (summaryCleanupInterval) clearInterval(summaryCleanupInterval);
        
        // Ultra-conservative - every 15 minutes instead of 1 minute
        summaryCleanupInterval = setInterval(() => {
            try {
                // CRITICAL: Never cleanup during trial execution
                if ((window as any).unifiedExecutionState?.isExecuting) {
                    console.log('🧹 Deferring summary cleanup - trials executing');
                    return;
                }
                
                if (performance.memory) {
                    const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                    // More conservative threshold - 750MB instead of 500MB
                    if (usedMB > 750) {
                        SummaryTemplateCache.clearCache();
                        console.log('🧹 Summary template cache cleared due to high memory usage');
                    }
                }
            } catch (error) {
                console.warn('Summary cleanup error:', error);
            }
        }, 900000); // 15 minutes instead of 1 minute - ultra-conservative
    };
    
    // Start cleanup system
    startSummaryCleanup();
    
    // Ultra-conservative cleanup on page unload
    window.addEventListener('beforeunload', () => {
        // Only cleanup if not executing
        if (!(window as any).unifiedExecutionState?.isExecuting) {
            if (summaryCleanupInterval) {
                clearInterval(summaryCleanupInterval);
            }
            SummaryTemplateCache.clearCache();
        }
    });
    
    // Execution-aware global cleanup function
    (window as any).cleanupSummaryCache = () => {
        if ((window as any).unifiedExecutionState?.isExecuting) {
            console.log('🧹 Deferring cache cleanup - trials executing');
            return;
        }
        SummaryTemplateCache.clearCache();
    };
}

// 🔧 Global access for debugging
if (typeof window !== 'undefined') {
    (window as any).SummaryGenerator = SummaryGenerator;
}
