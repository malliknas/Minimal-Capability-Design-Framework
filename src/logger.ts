// src/logger.ts - Enhanced Browser-Only Version with Chapter 7 Domain Walkthrough Integration

// ============================================
// 🔄 EXISTING INTERFACES (PRESERVED)
// ============================================

// ✅ Enhanced TestLog type matching appendix structure  
interface TestLog {
  // Core test identification
  testID: string;
  variant: string;
  prompt: string | string[]; // Support multi-turn prompts (T4, T9)
  output: string;
  
  // Model and execution context
  model: string;
  quantization: string;
  
  // Performance metrics (from appendix results)
  tokensUsed: number;
  latencyMs: string;
  completion: "✅ Yes" | "⚠ Partial" | "❌ No";
  overflow: "✅ Yes" | "❌ No";
  
  // MCD framework metrics
  semanticDrift: string;
  fallbackTriggered: string;
  mcdAligned: boolean;
  
  // Extended metrics (test-specific)
  slotAccuracy?: "✅ All" | "⚠ Partial" | "❌ Missing" | "❌ Error";
  semanticFidelity?: string;
  expectedTokenRange?: string;
  semanticAnchors?: string[];
  
  // Multi-turn specific (T4, T9)
  recoverySuccess?: string;
  promptDepth?: string;
  
  // Fallback tracking (T10)
  originalTier?: string;
  originalFailure?: string;
  
  // Metadata
  timestamp: string;
  notes?: string;
}

// ✅ Test trace structure for individual test logs (appendix format)
interface TestTrace {
  testID: string;
  description: string;
  model: string;
  subsystem: string;
  setting: string;
  measurement: string;
  trials: TestLog[];
}

// ✅ Comprehensive test summary (updated for browser environment)
interface TestSummary {
  executionMetadata: {
    timestamp: string;
    totalDuration: number;
    totalTests: number;
    browser: string;        // ← Changed from nodeVersion
    platform: string;
  };
  
  tierDistribution: {
    Q1: number;
    Q4: number;
    Q8: number;
  };
  
  completionRates: {
    Q1: number;
    Q4: number;
    Q8: number;
  };
  
  averageLatency: {
    Q1: number;
    Q4: number;
    Q8: number;
  };
  
  fallbackMetrics: {
    Q1ToQ4: number;
    totalFallbacks: number;
    fallbackSuccessRate: number;
  };
  
  mcdValidation: {
    alignedTests: number;
    nonAlignedTests: number;
    mcdSuccessRate: number;
    overEngineeredTests: number;
  };
  
  testSpecificMetrics: {
    multiTurnSuccess: number; // T4, T9
    spatialNavigationAccuracy: number; // T5
    recoveryChainEffectiveness: number; // T9
    semanticDriftRate: number;
  };
}

// ============================================
// 🆕 NEW: CHAPTER 7 WALKTHROUGH INTERFACES
// ============================================

// Domain walkthrough log structure (compatible with existing patterns)
interface WalkthroughLog {
  // Core walkthrough identification
  walkthroughId: string;
  domain: string;
  tier: string;
  scenarioStep: number;
  
  // Execution context
  userInput: string;
  assistantResponse: string;
  
  // Performance metrics (matching TestLog structure)
  tokensUsed: number;
  latencyMs: number;
  completion: "✅ Yes" | "⚠ Partial" | "❌ No";
  
  // MCD framework metrics
  mcdAligned: boolean;
  fallbacksTriggered: string[];
  qualityMetrics: { [metric: string]: number };
  
  // Domain-specific metrics
  mcdPrincipleAdherence: { [principle: string]: boolean };
  
  // Metadata
  timestamp: string;
  notes?: string;
}

// Comprehensive walkthrough summary
interface WalkthroughSummary {
  executionMetadata: {
    timestamp: string;
    totalDuration: number;
    totalWalkthroughs: number;
    browser: string;
    platform: string;
  };
  
  domainDistribution: {
    appointmentBooking: number;
    spatialNavigation: number;
    failureDiagnostics: number;
  };
  
  tierDistribution: {
    Q1: number;
    Q4: number;
    Q8: number;
  };
  
  successRates: {
    overall: number;
    byDomain: { [domain: string]: number };
    byTier: { [tier: string]: number };
  };
  
  mcdMetrics: {
    averageAlignment: number;
    averageResourceEfficiency: number;
    averageUserExperience: number;
    fallbackRate: number;
  };
  
  domainSpecificMetrics: {
    appointmentBooking: {
      slotExtractionRate: number;
      confirmationEfficiency: number;
    };
    spatialNavigation: {
      landmarkAccuracy: number;
      routeEfficiency: number;
    };
    failureDiagnostics: {
      complexityDetectionRate: number;
      solutionAppropriatenessScore: number;
    };
  };
}
// ✅ ENHANCED: Bridge interface for walkthrough-evaluator.ts integration
interface WalkthroughResultLog extends WalkthroughLog {
  // Enhanced fields from walkthrough-evaluator.ts
  executionTime?: number;
  scenarioResults?: Array<{
    step: number;
    context: string;
    variants: Array<{
      id: string;
      type: 'MCD' | 'Non-MCD';
      measuredProfile: {
        avgLatency: number;
        avgTokens: number;
        successRate: string;
        mcdAlignmentScore: number;
      };
    }>;
  }>;
  recommendations?: string[];
  
  // Enhanced metrics from evaluator
  domainMetrics?: {
    overallSuccess: boolean;
    mcdAlignmentScore: number;
    resourceEfficiency: number;
    userExperienceScore: number;
    fallbackTriggered: boolean;
  };
}

// Integration status tracking
interface LoggerIntegrationStatus {
  walkthroughUIConnected: boolean;
  domainResultsConnected: boolean;
  evaluatorConnected: boolean;
  driftDetectorConnected: boolean;
  lastUpdate: string;
}

// ============================================
// 🔄 EXISTING T1-T10 FUNCTIONS (PRESERVED)
// ============================================

// ✅ BROWSER VERSION: Main results saving function with download API
export const saveResults = (results: TestLog[]): void => {
  try {
    // Format results
    const formattedResults = results.map(formatTestLog);
    
    // Generate comprehensive summary
    const summary = generateTestSummary(results);
    
    // Download main results JSON
    downloadJSON(formattedResults, 'mcd-results.json');
    
    // Download summary JSON
    downloadJSON(summary, 'mcd-summary.json');
    
    // Download drift analysis CSV
    exportDriftAnalysis(results);
    
    console.log(`\n💾 Results downloaded successfully:`);
    console.log(`   📄 mcd-results.json (${results.length} test logs)`);
    console.log(`   📊 mcd-summary.json (execution summary)`);
    console.log(`   📈 mcd-drift-analysis.csv (drift analysis)`);
    
  } catch (error) {
    console.error(`❌ Failed to download results:`, error);
    throw error;
  }
};

// ✅ BROWSER VERSION: Save individual test traces with download API
export const saveTestTrace = async (testID: string, traceData: TestTrace): Promise<void> => {
  try {
    // Format trace data for appendix compatibility
    const formattedTrace = {
      testMetadata: {
        testID: traceData.testID,
        description: traceData.description,
        model: traceData.model,
        subsystem: traceData.subsystem,
        testSetting: traceData.setting,
        measurementTool: traceData.measurement,
        timestamp: new Date().toISOString()
      },
      
      trialResults: traceData.trials.map(trial => ({
        trial: trial.variant,
        outputSummary: truncateOutput(trial.output, 50),
        tokens: trial.tokensUsed,
        latency: trial.latencyMs,
        completion: trial.completion,
        drift: trial.semanticDrift,
        overflow: trial.overflow,
        notes: generateTrialNotes(trial)
      })),
      
      aggregateMetrics: calculateTraceMetrics(traceData.trials)
    };
    
    // Download trace file
    downloadJSON(formattedTrace, `trace-${testID}.json`);
    
  } catch (error) {
    console.error(`❌ Failed to download trace for ${testID}:`, error);
  }
};

// ✅ BROWSER VERSION: Generate comprehensive test summary (updated for browser)
export const generateTestSummary = (results: TestLog[]): TestSummary => {
  const startTime = new Date().toISOString();
  
  return {
    executionMetadata: {
      timestamp: startTime,
      totalDuration: 0, // Will be updated by caller
      totalTests: results.length,
      browser: navigator.userAgent,    // ← Browser info instead of Node.js
      platform: navigator.platform     // ← Browser platform info
    },
    
    tierDistribution: {
      Q1: results.filter(r => r.quantization === "Q1").length,
      Q4: results.filter(r => r.quantization === "Q4").length,
      Q8: results.filter(r => r.quantization === "Q8").length
    },
    
    completionRates: {
      Q1: calculateCompletionRate(results, "Q1"),
      Q4: calculateCompletionRate(results, "Q4"),
      Q8: calculateCompletionRate(results, "Q8")
    },
    
    averageLatency: {
      Q1: calculateAverageLatency(results, "Q1"),
      Q4: calculateAverageLatency(results, "Q4"),
      Q8: calculateAverageLatency(results, "Q8")
    },
    
    fallbackMetrics: {
      Q1ToQ4: results.filter(r => r.fallbackTriggered?.includes("Q4")).length,
      totalFallbacks: results.filter(r => r.fallbackTriggered !== "No").length,
      fallbackSuccessRate: calculateFallbackSuccessRate(results)
    },
    
    mcdValidation: {
      alignedTests: results.filter(r => r.mcdAligned === true).length,
      nonAlignedTests: results.filter(r => r.mcdAligned === false).length,
      mcdSuccessRate: calculateMcdSuccessRate(results),
      overEngineeredTests: results.filter(r => 
        r.quantization === "Q8" && 
        r.semanticFidelity && 
        parseFloat(r.semanticFidelity) < 4.2 &&
        parseFloat(r.latencyMs) > 500
      ).length
    },
    
    testSpecificMetrics: {
      multiTurnSuccess: calculateMultiTurnSuccess(results),
      spatialNavigationAccuracy: calculateSpatialAccuracy(results),
      recoveryChainEffectiveness: calculateRecoveryEffectiveness(results),
      semanticDriftRate: calculateSemanticDriftRate(results)
    }
  };
};

// ✅ BROWSER VERSION: Export drift analysis to CSV with download API
export const exportDriftAnalysis = (results: TestLog[]): void => {
  const csvHeaders = [
    "TestID", "Variant", "Tier", "TokensUsed", "Latency", 
    "SemanticDrift", "FallbackTriggered", "MCDAligned", 
    "Completion", "Notes"
  ];
  
  const csvRows = results.map(result => [
    result.testID,
    result.variant,
    result.quantization,
    result.tokensUsed,
    result.latencyMs,
    result.semanticDrift.replace(/[✅⚠❌]/g, '').trim(),
    result.fallbackTriggered,
    result.mcdAligned ? "Yes" : "No",
    result.completion.replace(/[✅⚠❌]/g, '').trim(),
    result.notes || ""
  ]);
  
  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  try {
    // Download CSV file
    downloadCSV(csvContent, 'mcd-drift-analysis.csv');
  } catch (error) {
    console.error(`❌ Failed to download CSV:`, error);
  }
};

// ============================================
// 🆕 NEW: CHAPTER 7 WALKTHROUGH FUNCTIONS
// ============================================

// Save walkthrough results with comprehensive analysis
export const saveWalkthroughResults = (results: WalkthroughLog[]): void => {
  try {
    // Format walkthrough results
    const formattedResults = results.map(formatWalkthroughLog);
    
    // Generate comprehensive walkthrough summary
    const summary = generateWalkthroughSummary(results);
    
    // Download main walkthrough results JSON
    downloadJSON(formattedResults, 'chapter7-walkthrough-results.json');
    
    // Download walkthrough summary JSON
    downloadJSON(summary, 'chapter7-walkthrough-summary.json');
    
    // Download walkthrough analysis CSV
    exportWalkthroughAnalysis(results);
    
    console.log(`\n💾 Chapter 7 walkthrough results downloaded successfully:`);
    console.log(`   📄 chapter7-walkthrough-results.json (${results.length} walkthrough logs)`);
    console.log(`   📊 chapter7-walkthrough-summary.json (execution summary)`);
    console.log(`   📈 chapter7-walkthrough-analysis.csv (domain analysis)`);
    
  } catch (error) {
    console.error(`❌ Failed to download walkthrough results:`, error);
    throw error;
  }
};
// ✅ ENHANCED: Process walkthrough results from evaluator with comprehensive logging
export const saveWalkthroughEvaluatorResults = (
  evaluatorResults: Array<{
    walkthroughId: string;
    domain: string;
    tier: string;
    scenarioResults: Array<any>;
    domainMetrics: any;
    recommendations: string[];
    executionTime: number;
    timestamp: string;
  }>,
  progressCallback?: (status: string, progress: number) => void
): void => {
  try {
    if (progressCallback) {
      progressCallback('Converting evaluator results...', 10);
    }

    console.log(`📊 [LOGGER] Processing ${evaluatorResults.length} walkthrough evaluator results...`);
    
    // Convert evaluator results to logger format
    const walkthroughLogs: WalkthroughResultLog[] = evaluatorResults.map((result, index) => {
      // Extract scenario data for logging
      const scenarioLogs = result.scenarioResults.map((scenario, scenarioIndex) => {
        return {
          walkthroughId: `${result.walkthroughId}-scenario-${scenario.step}`,
          domain: result.domain,
          tier: result.tier,
          scenarioStep: scenario.step,
          userInput: scenario.context || `Scenario ${scenario.step}`,
          assistantResponse: extractResponseFromScenario(scenario),
          tokensUsed: calculateScenarioTokens(scenario),
          latencyMs: calculateScenarioLatency(scenario),
          completion: result.domainMetrics.overallSuccess ? "✅ Yes" : "❌ No",
          mcdAligned: result.domainMetrics.mcdAlignmentScore > 0.7,
          fallbacksTriggered: result.domainMetrics.fallbackTriggered ? ['MCD-Fallback'] : [],
          qualityMetrics: {
            mcdAlignment: result.domainMetrics.mcdAlignmentScore,
            resourceEfficiency: result.domainMetrics.resourceEfficiency,
            userExperience: result.domainMetrics.userExperienceScore
          },
          mcdPrincipleAdherence: extractMCDPrinciples(scenario, result.domain),
          timestamp: result.timestamp,
          notes: `From evaluator: ${result.recommendations.slice(0, 2).join('; ')}`,
          
          // Enhanced fields
          executionTime: result.executionTime,
          scenarioResults: result.scenarioResults,
          recommendations: result.recommendations,
          domainMetrics: result.domainMetrics
        } as WalkthroughResultLog;
      });
      
      return scenarioLogs;
    }).flat();

    if (progressCallback) {
      progressCallback('Generating enhanced summary...', 50);
    }
    
    // Generate enhanced summary with evaluator data
    const enhancedSummary = generateEnhancedWalkthroughSummary(walkthroughLogs, evaluatorResults);
    
    // Download results with enhanced metadata
    downloadJSON(walkthroughLogs, 'walkthrough-evaluator-results.json');
    downloadJSON(enhancedSummary, 'walkthrough-evaluator-summary.json');
    
    // Export detailed analysis CSV
    exportEnhancedWalkthroughAnalysis(walkthroughLogs, evaluatorResults);
    
    if (progressCallback) {
      progressCallback('Export completed', 100);
    }
    
    console.log(`✅ [LOGGER] Walkthrough evaluator results exported successfully:`);
    console.log(`   📄 walkthrough-evaluator-results.json (${walkthroughLogs.length} scenario logs)`);
    console.log(`   📊 walkthrough-evaluator-summary.json (enhanced analysis)`);
    console.log(`   📈 walkthrough-evaluator-analysis.csv (detailed metrics)`);
    
  } catch (error) {
    console.error(`❌ Failed to export walkthrough evaluator results:`, error);
    if (progressCallback) {
      progressCallback('Export failed', 0);
    }
    throw error;
  }
};

// Helper functions for evaluator result processing
function extractResponseFromScenario(scenario: any): string {
  if (scenario.variants && scenario.variants.length > 0) {
    const mcdVariant = scenario.variants.find(v => v.type === 'MCD');
    if (mcdVariant && mcdVariant.trials && mcdVariant.trials.length > 0) {
      return mcdVariant.trials[0].userInput || 'No response captured';
    }
  }
  return scenario.context || 'Scenario executed';
}

function calculateScenarioTokens(scenario: any): number {
  if (scenario.variants && scenario.variants.length > 0) {
    return scenario.variants.reduce((total, variant) => {
      return total + (variant.measuredProfile?.avgTokens || 0);
    }, 0) / scenario.variants.length;
  }
  return 0;
}

function calculateScenarioLatency(scenario: any): number {
  if (scenario.variants && scenario.variants.length > 0) {
    return scenario.variants.reduce((total, variant) => {
      return total + (variant.measuredProfile?.avgLatency || 0);
    }, 0) / scenario.variants.length;
  }
  return 0;
}

function extractMCDPrinciples(scenario: any, domain: string): { [principle: string]: boolean } {
  const principles = {
    minimalCapability: true,
    taskFocus: true,
    boundedScope: true
  };
  
  // Domain-specific principles
  if (domain.includes('appointment')) {
    principles['slotFilling'] = true;
    principles['contextPreservation'] = true;
  } else if (domain.includes('spatial')) {
    principles['landmarkBased'] = true;
    principles['preciseDirections'] = true;
  } else if (domain.includes('failure')) {
    principles['appropriateComplexity'] = true;
    principles['solutionOriented'] = true;
  }
  
  return principles;
}

// Generate comprehensive walkthrough summary
export const generateWalkthroughSummary = (results: WalkthroughLog[]): WalkthroughSummary => {
  const startTime = new Date().toISOString();
  
  // Count by domain
  const appointmentBooking = results.filter(r => r.domain === "Appointment Booking").length;
  const spatialNavigation = results.filter(r => r.domain === "Spatial Navigation").length;
  const failureDiagnostics = results.filter(r => r.domain === "Failure Diagnostics").length;
  
  return {
    executionMetadata: {
      timestamp: startTime,
      totalDuration: 0, // Will be updated by caller
      totalWalkthroughs: results.length,
      browser: navigator.userAgent,
      platform: navigator.platform
    },
    
    domainDistribution: {
      appointmentBooking,
      spatialNavigation,
      failureDiagnostics
    },
    
    tierDistribution: {
      Q1: results.filter(r => r.tier === "Q1").length,
      Q4: results.filter(r => r.tier === "Q4").length,
      Q8: results.filter(r => r.tier === "Q8").length
    },
    
    successRates: {
      overall: calculateWalkthroughSuccessRate(results),
      byDomain: {
        "Appointment Booking": calculateWalkthroughSuccessRateByDomain(results, "Appointment Booking"),
        "Spatial Navigation": calculateWalkthroughSuccessRateByDomain(results, "Spatial Navigation"),
        "Failure Diagnostics": calculateWalkthroughSuccessRateByDomain(results, "Failure Diagnostics")
      },
      byTier: {
        "Q1": calculateWalkthroughSuccessRateByTier(results, "Q1"),
        "Q4": calculateWalkthroughSuccessRateByTier(results, "Q4"),
        "Q8": calculateWalkthroughSuccessRateByTier(results, "Q8")
      }
    },
    
    mcdMetrics: {
      averageAlignment: calculateAverageAlignment(results),
      averageResourceEfficiency: calculateAverageResourceEfficiency(results),
      averageUserExperience: calculateAverageUserExperience(results),
      fallbackRate: calculateWalkthroughFallbackRate(results)
    },
    
    domainSpecificMetrics: {
      appointmentBooking: {
        slotExtractionRate: calculateSlotExtractionRate(results),
        confirmationEfficiency: calculateConfirmationEfficiency(results)
      },
      spatialNavigation: {
        landmarkAccuracy: calculateLandmarkAccuracy(results),
        routeEfficiency: calculateRouteEfficiency(results)
      },
      failureDiagnostics: {
        complexityDetectionRate: calculateComplexityDetectionRate(results),
        solutionAppropriatenessScore: calculateSolutionAppropriatenessScore(results)
      }
    }
  };
};

// Export walkthrough analysis to CSV
export const exportWalkthroughAnalysis = (results: WalkthroughLog[]): void => {
  const csvHeaders = [
    "WalkthroughID", "Domain", "Tier", "ScenarioStep", "TokensUsed", "Latency", 
    "MCDAligned", "FallbacksTriggered", "Completion", "QualityScore", "Notes"
  ];
  
  const csvRows = results.map(result => [
    result.walkthroughId,
    result.domain,
    result.tier,
    result.scenarioStep,
    result.tokensUsed,
    result.latencyMs,
    result.mcdAligned ? "Yes" : "No",
    result.fallbacksTriggered.join("; "),
    result.completion.replace(/[✅⚠❌]/g, '').trim(),
    calculateOverallQualityScore(result),
    result.notes || ""
  ]);
  
  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  try {
    // Download CSV file
    downloadCSV(csvContent, 'chapter7-walkthrough-analysis.csv');
  } catch (error) {
    console.error(`❌ Failed to download walkthrough CSV:`, error);
  }
};

// Save individual walkthrough trace
export const saveWalkthroughTrace = async (walkthroughId: string, domain: string, traceData: WalkthroughLog[]): Promise<void> => {
  try {
    const formattedTrace = {
      walkthroughMetadata: {
        walkthroughId,
        domain,
        totalScenarios: traceData.length,
        timestamp: new Date().toISOString()
      },
      
      scenarioResults: traceData.map(scenario => ({
        step: scenario.scenarioStep,
        userInput: truncateOutput(scenario.userInput, 100),
        assistantResponse: truncateOutput(scenario.assistantResponse, 100),
        tokens: scenario.tokensUsed,
        latency: scenario.latencyMs,
        completion: scenario.completion,
        mcdAligned: scenario.mcdAligned,
        fallbacks: scenario.fallbacksTriggered,
        qualityMetrics: scenario.qualityMetrics,
        notes: scenario.notes || ""
      })),
      
      aggregateMetrics: calculateWalkthroughTraceMetrics(traceData)
    };
    
    // Download trace file
    downloadJSON(formattedTrace, `walkthrough-trace-${walkthroughId}-${domain.replace(/\s+/g, '-').toLowerCase()}.json`);
    
  } catch (error) {
    console.error(`❌ Failed to download walkthrough trace for ${walkthroughId}:`, error);
  }
};
// ✅ ENHANCED: Progress-aware bulk export with UI integration
export const exportWalkthroughResultsWithProgress = async (
  results: WalkthroughResultLog[],
  options: {
    includeTraces?: boolean;
    includeUnified?: boolean;
    t1t10Results?: TestLog[];
    progressCallback?: (status: string, progress: number) => void;
    uiCallback?: (phase: 'preparation' | 'processing' | 'export' | 'completion', data?: any) => void;
  } = {}
): Promise<void> => {
  const { progressCallback, uiCallback } = options;
  
  try {
    // Phase 1: Preparation
    if (uiCallback) uiCallback('preparation', { totalResults: results.length });
    if (progressCallback) progressCallback('Preparing walkthrough export...', 0);
    
    // Validate results
    const validation = validateWalkthroughResultsBeforeExport(results);
    if (!validation.isValid) {
      console.warn('Walkthrough result validation issues:', validation.issues);
    }
    
    const processedResults = validation.processedResults as WalkthroughResultLog[];
    
    // Phase 2: Processing
    if (uiCallback) uiCallback('processing', { validatedResults: processedResults.length });
    if (progressCallback) progressCallback('Generating comprehensive analysis...', 25);
    
    // Generate enhanced summary
    const enhancedSummary = generateEnhancedWalkthroughSummary(processedResults);
    
    // Generate domain breakdown
    const domainBreakdown = generateDomainBreakdown(processedResults);
    
    // Phase 3: Export
    if (uiCallback) uiCallback('export', { formats: ['json', 'csv', 'traces'] });
    if (progressCallback) progressCallback('Exporting files...', 50);
    
    // Export main results
    await Promise.all([
      downloadJSONAsync(processedResults, 'walkthrough-comprehensive-results.json'),
      downloadJSONAsync(enhancedSummary, 'walkthrough-comprehensive-summary.json'),
      downloadJSONAsync(domainBreakdown, 'walkthrough-domain-breakdown.json')
    ]);
    
    if (progressCallback) progressCallback('Exporting analysis...', 75);
    
    // Export CSV analysis
    exportEnhancedWalkthroughAnalysis(processedResults);
    
    // Optional: Export individual traces
    if (options.includeTraces) {
      await exportWalkthroughTraces(processedResults, progressCallback);
    }
    
    // Optional: Export unified results
    if (options.includeUnified && options.t1t10Results) {
      if (progressCallback) progressCallback('Creating unified export...', 90);
      saveUnifiedResults(options.t1t10Results, processedResults);
    }
    
    // Phase 4: Completion
    if (uiCallback) {
      uiCallback('completion', {
        totalFiles: options.includeTraces ? processedResults.length + 3 : 3,
        totalSize: 'Calculated after download'
      });
    }
    
    if (progressCallback) progressCallback('Export completed successfully', 100);
    
    console.log(`✅ [LOGGER] Comprehensive walkthrough export completed`);
    
  } catch (error) {
    console.error(`❌ Enhanced walkthrough export failed:`, error);
    if (progressCallback) progressCallback('Export failed', 0);
    throw error;
  }
};

// Async download helper
async function downloadJSONAsync(data: any, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      downloadJSON(data, filename);
      // Small delay to prevent browser download limits
      setTimeout(resolve, 100);
    } catch (error) {
      reject(error);
    }
  });
}

// Export individual walkthrough traces with progress
async function exportWalkthroughTraces(
  results: WalkthroughResultLog[],
  progressCallback?: (status: string, progress: number) => void
): Promise<void> {
  const walkthroughGroups = results.reduce((groups, result) => {
    const key = `${result.walkthroughId}-${result.domain}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(result);
    return groups;
  }, {} as { [key: string]: WalkthroughResultLog[] });
  
  const groupEntries = Object.entries(walkthroughGroups);
  
  for (let i = 0; i < groupEntries.length; i++) {
    const [key, traceResults] = groupEntries[i];
    
    if (progressCallback) {
      const progress = 75 + (i / groupEntries.length) * 15; // 75-90% range
      progressCallback(`Exporting trace ${i + 1}/${groupEntries.length}`, progress);
    }
    
    const [walkthroughId, domain] = key.split('-');
    await saveWalkthroughTrace(walkthroughId, domain, traceResults);
    
    // Small delay to prevent overwhelming the browser
    if (i < groupEntries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// ============================================
// 🆕 NEW: UNIFIED EXPORT FUNCTIONS
// ============================================

// Export both T1-T10 and Chapter 7 results together
export const saveUnifiedResults = (t1t10Results: TestLog[], walkthroughResults: WalkthroughLog[]): void => {
  try {
    const unifiedData = {
      exportMetadata: {
        timestamp: new Date().toISOString(),
        framework: "MCD Simulation Runner - Complete Research Framework",
        browser: navigator.userAgent,
        platform: navigator.platform
      },
      
      t1t10Framework: {
        summary: generateTestSummary(t1t10Results),
        results: t1t10Results.map(formatTestLog)
      },
      
      chapter7Framework: {
        summary: generateWalkthroughSummary(walkthroughResults),
        results: walkthroughResults.map(formatWalkthroughLog)
      },
      
      unifiedAnalysis: {
        totalExecutions: t1t10Results.length + walkthroughResults.length,
        frameworkComparison: generateFrameworkComparison(t1t10Results, walkthroughResults),
        tierPerformanceAcrossFrameworks: generateCrossTierAnalysis(t1t10Results, walkthroughResults)
      }
    };
    
    // Download unified results
    downloadJSON(unifiedData, 'mcd-unified-research-results.json');
    
    console.log(`\n💾 Unified research results downloaded successfully:`);
    console.log(`   📄 mcd-unified-research-results.json (complete framework analysis)`);
    console.log(`   📊 T1-T10 Results: ${t1t10Results.length} test logs`);
    console.log(`   📊 Chapter 7 Results: ${walkthroughResults.length} walkthrough logs`);
    
  } catch (error) {
    console.error(`❌ Failed to download unified results:`, error);
    throw error;
  }
};

// ============================================
// 🔄 EXISTING HELPER FUNCTIONS (PRESERVED)
// ============================================

// ✅ NEW: Browser download helper for JSON files
// REPLACE the existing downloadJSON function with this enhanced version:
function downloadJSON(data: any, filename: string): void {
    try {
        // Validate data before download
        if (!data) {
            throw new Error('No data provided for download');
        }
        
        // Add metadata for debugging
        const enhancedData = {
            ...data,
            exportMetadata: {
                filename,
                timestamp: new Date().toISOString(),
                browser: navigator.userAgent,
                dataSize: JSON.stringify(data).length
            }
        };
        
        const jsonString = JSON.stringify(enhancedData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Check blob size
        if (blob.size > 50 * 1024 * 1024) { // 50MB limit
            console.warn(`Large download: ${Math.round(blob.size / 1024 / 1024)}MB`);
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // Ensure element is added to DOM for compatibility
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup with delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`✅ Downloaded: ${filename} (${Math.round(blob.size / 1024)}KB)`);
        
    } catch (error) {
        console.error(`❌ Download failed for ${filename}:`, error);
        
        // Fallback: try to save to clipboard
        try {
            const jsonString = JSON.stringify(data, null, 2);
            navigator.clipboard.writeText(jsonString).then(() => {
                console.log(`📋 Data copied to clipboard as fallback for ${filename}`);
            }).catch(() => {
                console.log(`❌ Both download and clipboard fallback failed for ${filename}`);
            });
        } catch (clipboardError) {
            console.error('Clipboard fallback also failed:', clipboardError);
        }
        
        throw error;
    }
}


// ✅ NEW: Browser download helper for CSV files
// REPLACE the existing downloadCSV function with this enhanced version:
function downloadCSV(csvContent: string, filename: string): void {
    try {
        // Validate CSV content
        if (!csvContent || csvContent.trim().length === 0) {
            throw new Error('No CSV content provided for download');
        }
        
        // Add UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        
        const blob = new Blob([csvWithBOM], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        // Check blob size
        if (blob.size > 10 * 1024 * 1024) { // 10MB limit for CSV
            console.warn(`Large CSV download: ${Math.round(blob.size / 1024 / 1024)}MB`);
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // Ensure element is added to DOM for compatibility
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup with delay
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`✅ Downloaded CSV: ${filename} (${Math.round(blob.size / 1024)}KB)`);
        
    } catch (error) {
        console.error(`❌ CSV download failed for ${filename}:`, error);
        
        // Fallback: try to save to clipboard
        try {
            navigator.clipboard.writeText(csvContent).then(() => {
                console.log(`📋 CSV data copied to clipboard as fallback for ${filename}`);
            }).catch(() => {
                console.log(`❌ Both CSV download and clipboard fallback failed for ${filename}`);
            });
        } catch (clipboardError) {
            console.error('CSV clipboard fallback also failed:', clipboardError);
        }
        
        throw error;
    }
}

// ADD integration helper functions for cross-component coordination
export function reportLoggingStatus(): void {
    try {
        if (typeof window !== 'undefined' && window.updateTestControl) {
            window.updateTestControl('Logging system ready', 100);
        }
    } catch (error) {
        console.warn('TestControl integration unavailable:', error);
    }
}

// Enhanced result validation before logging
export function validateResultsBeforeExport(results: TestLog[] | WalkthroughLog[]): {
    isValid: boolean;
    issues: string[];
    processedResults: any[];
} {
    const issues: string[] = [];
    const processedResults: any[] = [];
    
    try {
        results.forEach((result, index) => {
            const processed = { ...result };
            
            // Validate required fields
            if (!result.timestamp) {
                processed.timestamp = new Date().toISOString();
                issues.push(`Added missing timestamp for result ${index}`);
            }
            
            // Validate test log specific fields
            if ('testID' in result) {
                const testResult = result as TestLog;
                if (!testResult.testID) {
                    issues.push(`Missing testID for test result ${index}`);
                }
                if (typeof testResult.tokensUsed === 'string') {
                    processed.tokensUsed = parseInt(testResult.tokensUsed) || 0;
                }
            }
            
            // Validate walkthrough log specific fields
            if ('walkthroughId' in result) {
                const walkthroughResult = result as WalkthroughLog;
                if (!walkthroughResult.walkthroughId) {
                    issues.push(`Missing walkthroughId for walkthrough result ${index}`);
                }
                if (!walkthroughResult.domain) {
                    issues.push(`Missing domain for walkthrough result ${index}`);
                }
            }
            
            processedResults.push(processed);
        });
        
        return {
            isValid: issues.length === 0,
            issues,
            processedResults
        };
        
    } catch (error) {
        return {
            isValid: false,
            issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
            processedResults: []
        };
    }
}

// Safe export wrapper with validation
export function safeExportResults(results: TestLog[], type: 'test' | 'trace' = 'test'): void {
    try {
        const validation = validateResultsBeforeExport(results);
        
        if (!validation.isValid) {
            console.warn('Result validation issues found:', validation.issues);
        }
        
        if (type === 'test') {
            saveResults(validation.processedResults as TestLog[]);
        } else {
            // Export individual traces
            const groupedByTest = validation.processedResults.reduce((groups, result) => {
                const testId = result.testID;
                if (!groups[testId]) groups[testId] = [];
                groups[testId].push(result);
                return groups;
            }, {} as { [testId: string]: TestLog[] });
            
            Object.entries(groupedByTest).forEach(([testId, testResults]) => {
                const traceData: TestTrace = {
                    testID: testId,
                    description: `Trace for ${testId}`,
                    model: testResults[0]?.model || 'Unknown',
                    subsystem: 'Browser Test Execution',
                    setting: 'Browser Environment',
                    measurement: 'performance.now()',
                    trials: testResults
                };
                
                saveTestTrace(testId, traceData);
            });
        }
        
    } catch (error) {
        console.error('Safe export failed:', error);
        throw error;
    }
}

// ✅ UNCHANGED: All existing helper functions below are already browser-compatible

function formatTestLog(log: TestLog): TestLog {
  return {
    ...log,
    // Ensure consistent formatting
    prompt: Array.isArray(log.prompt) ? log.prompt.join(" → ") : log.prompt,
    output: log.output.length > 200 ? log.output.substring(0, 200) + "..." : log.output,
    tokensUsed: typeof log.tokensUsed === 'string' ? parseInt(log.tokensUsed) : log.tokensUsed,
    timestamp: log.timestamp || new Date().toISOString()
  };
}

function truncateOutput(output: string, maxLength: number): string {
  return output.length > maxLength ? output.substring(0, maxLength) + "..." : output;
}

function generateTrialNotes(trial: TestLog): string {
  const notes: string[] = [];
  
  if (trial.tokensUsed < 20) notes.push("Short response");
  if (trial.overflow === "✅ Yes") notes.push("Token overflow");
  if (trial.semanticDrift.includes("✅")) notes.push("Drift detected");
  if (trial.fallbackTriggered !== "No") notes.push("Fallback triggered");
  if (trial.mcdAligned) notes.push("MCD aligned");
  
  return notes.join(", ") || "Standard execution";
}

function calculateTraceMetrics(trials: TestLog[]) {
  return {
    totalTrials: trials.length,
    averageTokens: Math.round(trials.reduce((sum, t) => sum + t.tokensUsed, 0) / trials.length),
    averageLatency: Math.round(trials.reduce((sum, t) => sum + parseFloat(t.latencyMs), 0) / trials.length),
    completionRate: `${Math.round((trials.filter(t => t.completion === "✅ Yes").length / trials.length) * 100)}%`,
    driftRate: `${Math.round((trials.filter(t => t.semanticDrift.includes("✅")).length / trials.length) * 100)}%`
  };
}

function calculateCompletionRate(results: TestLog[], tier: string): number {
  const tierResults = results.filter(r => r.quantization === tier);
  if (tierResults.length === 0) return 0;
  
  const completed = tierResults.filter(r => r.completion === "✅ Yes").length;
  return Math.round((completed / tierResults.length) * 100);
}

function calculateAverageLatency(results: TestLog[], tier: string): number {
  const tierResults = results.filter(r => r.quantization === tier);
  if (tierResults.length === 0) return 0;
  
  const latencies = tierResults.map(r => parseFloat(r.latencyMs)).filter(l => !isNaN(l));
  return latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
}

function calculateFallbackSuccessRate(results: TestLog[]): number {
  const fallbacks = results.filter(r => r.fallbackTriggered?.includes("Q4"));
  if (fallbacks.length === 0) return 0;
  
  const successful = fallbacks.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / fallbacks.length) * 100);
}

function calculateMcdSuccessRate(results: TestLog[]): number {
  const mcdTests = results.filter(r => r.mcdAligned === true);
  if (mcdTests.length === 0) return 0;
  
  const successful = mcdTests.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / mcdTests.length) * 100);
}

function calculateMultiTurnSuccess(results: TestLog[]): number {
  const multiTurnTests = results.filter(r => r.testID === "T4" || r.testID === "T9");
  if (multiTurnTests.length === 0) return 0;
  
  const successful = multiTurnTests.filter(r => 
    r.slotAccuracy === "✅ All" || r.recoverySuccess?.startsWith("✅")
  ).length;
  
  return Math.round((successful / multiTurnTests.length) * 100);
}

function calculateSpatialAccuracy(results: TestLog[]): number {
  const spatialTests = results.filter(r => r.testID === "T5");
  if (spatialTests.length === 0) return 0;
  
  const successful = spatialTests.filter(r => 
    r.completion === "✅ Yes" && !r.semanticDrift.includes("✅")
  ).length;
  
  return Math.round((successful / spatialTests.length) * 100);
}

function calculateRecoveryEffectiveness(results: TestLog[]): number {
  const recoveryTests = results.filter(r => r.testID === "T9");
  if (recoveryTests.length === 0) return 0;
  
  const effective = recoveryTests.filter(r => 
    r.recoverySuccess?.startsWith("✅")
  ).length;
  
  return Math.round((effective / recoveryTests.length) * 100);
}

function calculateSemanticDriftRate(results: TestLog[]): number {
  const driftResults = results.filter(r => r.semanticDrift.includes("✅"));
  return Math.round((driftResults.length / results.length) * 100);
}

// ============================================
// 🆕 NEW: CHAPTER 7 HELPER FUNCTIONS
// ============================================

function formatWalkthroughLog(log: WalkthroughLog): WalkthroughLog {
  return {
    ...log,
    assistantResponse: log.assistantResponse.length > 200 ? log.assistantResponse.substring(0, 200) + "..." : log.assistantResponse,
    timestamp: log.timestamp || new Date().toISOString()
  };
}

function calculateWalkthroughSuccessRate(results: WalkthroughLog[]): number {
  if (results.length === 0) return 0;
  const successful = results.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / results.length) * 100);
}

function calculateWalkthroughSuccessRateByDomain(results: WalkthroughLog[], domain: string): number {
  const domainResults = results.filter(r => r.domain === domain);
  if (domainResults.length === 0) return 0;
  const successful = domainResults.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / domainResults.length) * 100);
}

function calculateWalkthroughSuccessRateByTier(results: WalkthroughLog[], tier: string): number {
  const tierResults = results.filter(r => r.tier === tier);
  if (tierResults.length === 0) return 0;
  const successful = tierResults.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / tierResults.length) * 100);
}

function calculateAverageAlignment(results: WalkthroughLog[]): number {
  if (results.length === 0) return 0;
  const aligned = results.filter(r => r.mcdAligned).length;
  return Math.round((aligned / results.length) * 100);
}

function calculateAverageResourceEfficiency(results: WalkthroughLog[]): number {
  if (results.length === 0) return 0;
  // Calculate based on token efficiency and latency
  const efficiency = results.map(r => {
    const tokenEfficiency = Math.max(0, 100 - (r.tokensUsed / 2)); // Lower tokens = higher efficiency
    const latencyEfficiency = Math.max(0, 100 - (r.latencyMs / 10)); // Lower latency = higher efficiency
    return (tokenEfficiency + latencyEfficiency) / 2;
  });
  return Math.round(efficiency.reduce((a, b) => a + b, 0) / efficiency.length);
}

function calculateAverageUserExperience(results: WalkthroughLog[]): number {
  if (results.length === 0) return 0;
  // Calculate based on completion rate and lack of fallbacks
  const experience = results.map(r => {
    let score = 0;
    if (r.completion === "✅ Yes") score += 50;
    if (r.completion === "⚠ Partial") score += 25;
    if (r.fallbacksTriggered.length === 0) score += 30;
    if (r.mcdAligned) score += 20;
    return Math.min(100, score);
  });
  return Math.round(experience.reduce((a, b) => a + b, 0) / experience.length);
}

function calculateWalkthroughFallbackRate(results: WalkthroughLog[]): number {
  if (results.length === 0) return 0;
  const withFallbacks = results.filter(r => r.fallbacksTriggered.length > 0).length;
  return Math.round((withFallbacks / results.length) * 100);
}

// Domain-specific metric calculations
function calculateSlotExtractionRate(results: WalkthroughLog[]): number {
  const appointmentResults = results.filter(r => r.domain === "Appointment Booking");
  if (appointmentResults.length === 0) return 0;
  // Mock calculation - in real implementation, would analyze slot extraction success
  const successful = appointmentResults.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / appointmentResults.length) * 100);
}

function calculateConfirmationEfficiency(results: WalkthroughLog[]): number {
  const appointmentResults = results.filter(r => r.domain === "Appointment Booking");
  if (appointmentResults.length === 0) return 0;
  // Calculate efficiency based on scenario steps and token usage
  const avgSteps = appointmentResults.reduce((sum, r) => sum + r.scenarioStep, 0) / appointmentResults.length;
  return Math.max(0, Math.round(100 - (avgSteps - 1) * 20)); // Fewer steps = higher efficiency
}

function calculateLandmarkAccuracy(results: WalkthroughLog[]): number {
  const navigationResults = results.filter(r => r.domain === "Spatial Navigation");
  if (navigationResults.length === 0) return 0;
  const successful = navigationResults.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / navigationResults.length) * 100);
}

function calculateRouteEfficiency(results: WalkthroughLog[]): number {
  const navigationResults = results.filter(r => r.domain === "Spatial Navigation");
  if (navigationResults.length === 0) return 0;
  // Calculate based on successful completion with minimal fallbacks
  const efficient = navigationResults.filter(r => 
    r.completion === "✅ Yes" && r.fallbacksTriggered.length === 0
  ).length;
  return Math.round((efficient / navigationResults.length) * 100);
}

function calculateComplexityDetectionRate(results: WalkthroughLog[]): number {
  const diagnosticsResults = results.filter(r => r.domain === "Failure Diagnostics");
  if (diagnosticsResults.length === 0) return 0;
  const successful = diagnosticsResults.filter(r => r.completion === "✅ Yes").length;
  return Math.round((successful / diagnosticsResults.length) * 100);
}

function calculateSolutionAppropriatenessScore(results: WalkthroughLog[]): number {
  const diagnosticsResults = results.filter(r => r.domain === "Failure Diagnostics");
  if (diagnosticsResults.length === 0) return 0;
  // Calculate based on MCD alignment and efficiency
  const appropriate = diagnosticsResults.filter(r => 
    r.mcdAligned && r.completion === "✅ Yes"
  ).length;
  return Math.round((appropriate / diagnosticsResults.length) * 100);
}

function calculateOverallQualityScore(result: WalkthroughLog): number {
  let score = 0;
  if (result.completion === "✅ Yes") score += 40;
  if (result.completion === "⚠ Partial") score += 20;
  if (result.mcdAligned) score += 30;
  if (result.fallbacksTriggered.length === 0) score += 20;
  if (result.tokensUsed < 100) score += 10; // Efficiency bonus
  return Math.min(100, score);
}

function calculateWalkthroughTraceMetrics(walkthrough: WalkthroughLog[]) {
  return {
    totalScenarios: walkthrough.length,
    averageTokens: Math.round(walkthrough.reduce((sum, w) => sum + w.tokensUsed, 0) / walkthrough.length),
    averageLatency: Math.round(walkthrough.reduce((sum, w) => sum + w.latencyMs, 0) / walkthrough.length),
    completionRate: `${Math.round((walkthrough.filter(w => w.completion === "✅ Yes").length / walkthrough.length) * 100)}%`,
    mcdAlignmentRate: `${Math.round((walkthrough.filter(w => w.mcdAligned).length / walkthrough.length) * 100)}%`,
    fallbackRate: `${Math.round((walkthrough.filter(w => w.fallbacksTriggered.length > 0).length / walkthrough.length) * 100)}%`
  };
}
// ✅ ENHANCED: Generate comprehensive walkthrough summary with evaluator data
function generateEnhancedWalkthroughSummary(
  results: WalkthroughResultLog[],
  evaluatorResults?: Array<any>
): WalkthroughSummary & {
  evaluatorMetrics?: any;
  advancedAnalysis?: any;
} {
  const baseSummary = generateWalkthroughSummary(results);
  
  if (!evaluatorResults || evaluatorResults.length === 0) {
    return baseSummary;
  }
  
  // Enhanced analysis with evaluator data
  const evaluatorMetrics = {
    averageExecutionTime: evaluatorResults.reduce((sum, r) => sum + (r.executionTime || 0), 0) / evaluatorResults.length,
    totalRecommendations: evaluatorResults.reduce((sum, r) => sum + (r.recommendations?.length || 0), 0),
    scenarioDistribution: evaluatorResults.reduce((dist, r) => {
      const count = r.scenarioResults?.length || 0;
      dist[count] = (dist[count] || 0) + 1;
      return dist;
    }, {} as { [count: number]: number }),
    domainSpecificSuccess: calculateDomainSpecificSuccess(evaluatorResults)
  };
  
  const advancedAnalysis = {
    mcdVsNonMcdComparison: calculateMCDVsNonMCDComparison(evaluatorResults),
    tierEffectiveness: calculateTierEffectiveness(evaluatorResults),
    commonRecommendations: extractCommonRecommendations(evaluatorResults),
    performancePatterns: identifyPerformancePatterns(evaluatorResults)
  };
  
  return {
    ...baseSummary,
    evaluatorMetrics,
    advancedAnalysis
  };
}

// Generate detailed domain breakdown
function generateDomainBreakdown(results: WalkthroughResultLog[]): {
  [domain: string]: {
    totalScenarios: number;
    successRate: number;
    averageTokens: number;
    averageLatency: number;
    mcdAlignmentRate: number;
    commonIssues: string[];
    recommendations: string[];
  };
} {
  const domains = [...new Set(results.map(r => r.domain))];
  const breakdown = {};
  
  domains.forEach(domain => {
    const domainResults = results.filter(r => r.domain === domain);
    const successfulResults = domainResults.filter(r => r.completion === "✅ Yes");
    const mcdAlignedResults = domainResults.filter(r => r.mcdAligned);
    
    // Extract common issues from notes
    const issues = domainResults
      .map(r => r.notes)
      .filter(note => note && note.includes('error') || note?.includes('failed'))
      .slice(0, 5);
    
    // Extract recommendations
    const recommendations = domainResults
      .map(r => r.recommendations)
      .filter(rec => rec && rec.length > 0)
      .flat()
      .slice(0, 5);
    
    breakdown[domain] = {
      totalScenarios: domainResults.length,
      successRate: Math.round((successfulResults.length / domainResults.length) * 100),
      averageTokens: Math.round(domainResults.reduce((sum, r) => sum + r.tokensUsed, 0) / domainResults.length),
      averageLatency: Math.round(domainResults.reduce((sum, r) => sum + r.latencyMs, 0) / domainResults.length),
      mcdAlignmentRate: Math.round((mcdAlignedResults.length / domainResults.length) * 100),
      commonIssues: issues,
      recommendations: [...new Set(recommendations)]
    };
  });
  
  return breakdown;
}

// Enhanced analysis helper functions
function calculateDomainSpecificSuccess(evaluatorResults: Array<any>): { [domain: string]: number } {
  const domainSuccess = {};
  
  evaluatorResults.forEach(result => {
    const domain = result.domain;
    if (!domainSuccess[domain]) domainSuccess[domain] = { total: 0, success: 0 };
    
    domainSuccess[domain].total += 1;
    if (result.domainMetrics?.overallSuccess) {
      domainSuccess[domain].success += 1;
    }
  });
  
  Object.keys(domainSuccess).forEach(domain => {
    const data = domainSuccess[domain];
    domainSuccess[domain] = Math.round((data.success / data.total) * 100);
  });
  
  return domainSuccess;
}

function calculateMCDVsNonMCDComparison(evaluatorResults: Array<any>): {
  mcdPerformance: number;
  nonMcdPerformance: number;
  advantage: number;
} {
  let mcdSuccess = 0;
  let mcdTotal = 0;
  let nonMcdSuccess = 0;
  let nonMcdTotal = 0;
  
  evaluatorResults.forEach(result => {
    result.scenarioResults?.forEach(scenario => {
      scenario.variants?.forEach(variant => {
        if (variant.type === 'MCD') {
          mcdTotal += 1;
          if (variant.measuredProfile?.successRate?.includes('/')) {
            const [success, total] = variant.measuredProfile.successRate.split('/').map(Number);
            if (success === total) mcdSuccess += 1;
          }
        } else if (variant.type === 'Non-MCD') {
          nonMcdTotal += 1;
          if (variant.measuredProfile?.successRate?.includes('/')) {
            const [success, total] = variant.measuredProfile.successRate.split('/').map(Number);
            if (success === total) nonMcdSuccess += 1;
          }
        }
      });
    });
  });
  
  const mcdPerformance = mcdTotal > 0 ? (mcdSuccess / mcdTotal) * 100 : 0;
  const nonMcdPerformance = nonMcdTotal > 0 ? (nonMcdSuccess / nonMcdTotal) * 100 : 0;
  
  return {
    mcdPerformance: Math.round(mcdPerformance),
    nonMcdPerformance: Math.round(nonMcdPerformance),
    advantage: Math.round(mcdPerformance - nonMcdPerformance)
  };
}

function calculateTierEffectiveness(evaluatorResults: Array<any>): { [tier: string]: number } {
  const tierStats = {};
  
  evaluatorResults.forEach(result => {
    const tier = result.tier;
    if (!tierStats[tier]) tierStats[tier] = { total: 0, success: 0 };
    
    tierStats[tier].total += 1;
    if (result.domainMetrics?.overallSuccess) {
      tierStats[tier].success += 1;
    }
  });
  
  Object.keys(tierStats).forEach(tier => {
    const stats = tierStats[tier];
    tierStats[tier] = Math.round((stats.success / stats.total) * 100);
  });
  
  return tierStats;
}

function extractCommonRecommendations(evaluatorResults: Array<any>): string[] {
  const allRecommendations = evaluatorResults
    .map(r => r.recommendations || [])
    .flat();
  
  const recommendationCounts = allRecommendations.reduce((counts, rec) => {
    counts[rec] = (counts[rec] || 0) + 1;
    return counts;
  }, {});
  
  return Object.entries(recommendationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([rec]) => rec);
}

function identifyPerformancePatterns(evaluatorResults: Array<any>): {
  fastExecutions: number;
  slowExecutions: number;
  highTokenUsage: number;
  lowTokenUsage: number;
} {
  const executionTimes = evaluatorResults.map(r => r.executionTime || 0);
  const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
  
  return {
    fastExecutions: executionTimes.filter(t => t < avgExecutionTime * 0.8).length,
    slowExecutions: executionTimes.filter(t => t > avgExecutionTime * 1.2).length,
    highTokenUsage: 0, // Would need token data from scenarios
    lowTokenUsage: 0   // Would need token data from scenarios
  };
}

// Generate comparison between T1-T10 and Chapter 7 frameworks
function generateFrameworkComparison(t1t10Results: TestLog[], walkthroughResults: WalkthroughLog[]) {
  return {
    systematicValidation: {
      framework: "T1-T10 Tests",
      totalExecutions: t1t10Results.length,
      avgCompletionRate: calculateCompletionRate(t1t10Results, "Q4"), // Use Q4 as baseline
      avgMCDAlignment: Math.round((t1t10Results.filter(r => r.mcdAligned).length / t1t10Results.length) * 100)
    },
    practicalApplication: {
      framework: "Chapter 7 Walkthroughs",
      totalExecutions: walkthroughResults.length,
      avgCompletionRate: calculateWalkthroughSuccessRate(walkthroughResults),
      avgMCDAlignment: calculateAverageAlignment(walkthroughResults)
    },
    comparison: {
      completionRateDifference: calculateWalkthroughSuccessRate(walkthroughResults) - calculateCompletionRate(t1t10Results, "Q4"),
      mcdAlignmentDifference: calculateAverageAlignment(walkthroughResults) - Math.round((t1t10Results.filter(r => r.mcdAligned).length / t1t10Results.length) * 100)
    }
  };
}

// Generate cross-tier analysis
function generateCrossTierAnalysis(t1t10Results: TestLog[], walkthroughResults: WalkthroughLog[]) {
  const tiers = ["Q1", "Q4", "Q8"];
  const analysis = {};
  
  for (const tier of tiers) {
    const t1t10TierResults = t1t10Results.filter(r => r.quantization === tier);
    const walkthroughTierResults = walkthroughResults.filter(r => r.tier === tier);
    
    analysis[tier] = {
      t1t10Performance: {
        tests: t1t10TierResults.length,
        completionRate: calculateCompletionRate(t1t10Results, tier),
        avgLatency: calculateAverageLatency(t1t10Results, tier)
      },
      chapter7Performance: {
        walkthroughs: walkthroughTierResults.length,
        completionRate: calculateWalkthroughSuccessRateByTier(walkthroughResults, tier),
        avgLatency: walkthroughTierResults.length > 0 ? 
          Math.round(walkthroughTierResults.reduce((sum, w) => sum + w.latencyMs, 0) / walkthroughTierResults.length) : 0
      }
    };
  }
  
  return analysis;
}

// ============================================
// 🔗 EXPORTS FOR TYPESCRIPT INTEGRATION
// ============================================

// ✅ Export types for TypeScript (critical for evaluator.ts dependency)
export type { TestLog, TestTrace, TestSummary, WalkthroughLog, WalkthroughSummary };

// ✅ Export all logging functions for external use
export {
  // T1-T10 functions (existing)
  saveResults,
  saveTestTrace,
  generateTestSummary,
  exportDriftAnalysis,
  
  // Chapter 7 functions (new)
  saveWalkthroughResults,
  saveWalkthroughTrace,
  generateWalkthroughSummary,
  exportWalkthroughAnalysis,
  
  // Unified functions (integration)
  saveUnifiedResults
};

console.log('[Logger] 🎯 Enhanced logging system ready: T1-T10 + Chapter 7 + Unified export capabilities');
// ============
// 🆕 NEW: BROWSER INTEGRATION & GLOBAL REGISTRATION
// ============

// Global declarations for browser integration
declare global {
    interface Window {
        testControl?: any;
        updateTestControl?: (status: string, progress?: number) => void;
        LoggerManager?: any;
        downloadResults?: (results: any[], type: 'test' | 'walkthrough' | 'unified') => void;
    }
}

// Enhanced logger manager for browser access
export const LoggerManager = {
    // T1-T10 functions
    saveResults,
    saveTestTrace,
    generateTestSummary,
    exportDriftAnalysis,
    
    // Chapter 7 functions
    saveWalkthroughResults,
    saveWalkthroughTrace,
    generateWalkthroughSummary,
    exportWalkthroughAnalysis,
    
    // Unified functions
    saveUnifiedResults,
    
    // Utility functions
    downloadJSON,
    downloadCSV,
    
    // Type exports
    TestLog,
    WalkthroughLog
};

// Make available globally for browser integration
if (typeof window !== 'undefined') {
    window.LoggerManager = LoggerManager;
    
    // Convenient download function for UI components
    window.downloadResults = (results: any[], type: 'test' | 'walkthrough' | 'unified') => {
        try {
            if (window.updateTestControl) {
                window.updateTestControl('Preparing download...', 50);
            }
            
            if (type === 'test') {
                saveResults(results);
            } else if (type === 'walkthrough') {
                saveWalkthroughResults(results);
            } else if (type === 'unified') {
                // Assume results[0] is t1t10, results[1] is walkthrough
                saveUnifiedResults(results[0] || [], results[1] || []);
            }
            
            if (window.updateTestControl) {
                window.updateTestControl('Download completed', 100);
            }
            
        } catch (error) {
            console.error('Download failed:', error);
            if (window.updateTestControl) {
                window.updateTestControl('Download failed', 0);
            }
        }
    };
    
    console.log('✅ LoggerManager registered globally for browser integration');
	
	window.LoggerManager.saveWalkthroughEvaluatorResults = saveWalkthroughEvaluatorResults;
    window.LoggerManager.exportWalkthroughResultsWithProgress = exportWalkthroughResultsWithProgress;
    
    // ✅ ENHANCED: Advanced download function with integration hooks
    window.downloadWalkthroughResults = async (
      results: any[],
      type: 'evaluator' | 'basic' | 'comprehensive',
      progressCallback?: (status: string, progress: number) => void
    ) => {
      try {
        if (progressCallback) {
          progressCallback('Starting walkthrough export...', 0);
        }
        
        // Integrate with UI components if available
        let uiCallback;
        if (window.walkthroughUI && typeof window.walkthroughUI.updateProgress === 'function') {
          uiCallback = (phase: string, data?: any) => {
            window.walkthroughUI?.updateProgress(`Export ${phase}`, 0, 1);
          };
        }
        
        if (type === 'evaluator') {
          await saveWalkthroughEvaluatorResults(results, progressCallback);
        } else if (type === 'comprehensive') {
          await exportWalkthroughResultsWithProgress(results, {
            includeTraces: true,
            includeUnified: true,
            progressCallback,
            uiCallback
          });
        } else {
          saveWalkthroughResults(results);
        }
        
        // Update domain results display if available
        if (window.domainResultsDisplay && typeof window.domainResultsDisplay.showExportStatus === 'function') {
          window.domainResultsDisplay.showExportStatus('Export completed successfully');
        }
        
        if (progressCallback) {
          progressCallback('Export completed', 100);
        }
        
      } catch (error) {
        console.error('Walkthrough download failed:', error);
        if (progressCallback) {
          progressCallback('Export failed', 0);
        }
      }
    };
    
    // ✅ ADD: Integration status checker
    window.checkLoggerIntegration = (): LoggerIntegrationStatus => {
      return {
        walkthroughUIConnected: !!(window.walkthroughUI),
        domainResultsConnected: !!(window.domainResultsDisplay),
        evaluatorConnected: !!(window.WalkthroughEvaluator),
        driftDetectorConnected: !!(window.DriftDetectorManager),
        lastUpdate: new Date().toISOString()
      };
    };
    
    console.log('✅ Enhanced LoggerManager with comprehensive walkthrough integration registered globally');
}

// ✅ ADD: Validation function for walkthrough results
function validateWalkthroughResultsBeforeExport(results: WalkthroughResultLog[]): {
  isValid: boolean;
  issues: string[];
  processedResults: WalkthroughResultLog[];
} {
  const issues: string[] = [];
  const processedResults: WalkthroughResultLog[] = [];
  
  try {
    results.forEach((result, index) => {
      const processed = { ...result };
      
      // Validate required walkthrough fields
      if (!result.walkthroughId) {
        processed.walkthroughId = `walkthrough-${index}`;
        issues.push(`Added missing walkthroughId for result ${index}`);
      }
      
      if (!result.domain) {
        processed.domain = 'Unknown Domain';
        issues.push(`Added missing domain for result ${index}`);
      }
      
      if (!result.tier) {
        processed.tier = 'Q4'; // Default tier
        issues.push(`Added missing tier for result ${index}`);
      }
      
      if (!result.timestamp) {
        processed.timestamp = new Date().toISOString();
        issues.push(`Added missing timestamp for result ${index}`);
      }
      
      // Validate numeric fields
      if (typeof result.tokensUsed !== 'number') {
        processed.tokensUsed = parseInt(String(result.tokensUsed)) || 0;
      }
      
      if (typeof result.latencyMs !== 'number') {
        processed.latencyMs = parseInt(String(result.latencyMs)) || 0;
      }
      
      // Validate arrays
      if (!Array.isArray(result.fallbacksTriggered)) {
        processed.fallbacksTriggered = [];
      }
      
      processedResults.push(processed);
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      processedResults
    };
    
  } catch (error) {
    return {
      isValid: false,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      processedResults: []
    };
  }
	
}
// Auto-initialization and status reporting
if (typeof window !== 'undefined') {
    setTimeout(() => {
        reportLoggingStatus();
    }, 100);
}
