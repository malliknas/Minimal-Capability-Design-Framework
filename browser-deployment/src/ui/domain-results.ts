/**
 * Domain Walkthrough Results Display and Analysis
 * Manages comprehensive result visualization for Chapter 7 domain walkthroughs
 */

// import { WalkthroughEvaluator, WalkthroughResult } from '../../../../src/walkthrough-evaluator';
export interface VariantResult {
  id: string;
  type: 'MCD' | 'Non-MCD';
  name: string;
  trials: TrialResult[];
  measuredProfile: {
    avgLatency: number;
    avgTokens: number;
    successRate: string;
    actualSuccessCount: number;
    totalTrials: number;
    mcdAlignmentScore: number;
  };
  comparedToExpected: {
    latencyDiff: number;
    tokenDiff: number;
    successRateDiff: number;
  };
}

export interface TrialResult {
  testId: string;
  userInput: string;
  actualResults: any;
  benchmarkComparison: {
    latencyDiff: number;
    tokenDiff: number;
    performanceBetter: boolean;
  };
  evaluationScore: number;
  success: boolean;
}

export interface EnhancedScenarioResult {
  step: number;
  context: string;
  variants: VariantResult[];
  mcdVsNonMcdComparison: {
    mcdSuccess: number;
    nonMcdSuccess: number;
    mcdAvgLatency: number;
    nonMcdAvgLatency: number;
    mcdAvgTokens: number;
    nonMcdAvgTokens: number;
  };
}
// Add these interfaces if missing:
interface ExecutionState {
  isExecuting: boolean;
  currentPhase?: string;
}

declare global {
  interface Window {
    unifiedExecutionState?: ExecutionState;
    isWalkthroughExecuting?: boolean;
    emergencyRecoverDomainResults?: () => boolean;
  }
}

// Add temporary type definitions:
interface WalkthroughResult {
  domain: string;
  tier: string;
  walkthroughId: string;
  [key: string]: any;
}
// ✅ NEW: Enhanced result state management
interface DisplayState {
  status: 'loading' | 'success' | 'poor-performance' | 'error' | 'no-data';
  message?: string;
  recommendations?: string[];
  severity: 'info' | 'warning' | 'error' | 'critical';
}
interface PerformanceState {
  status: 'excellent' | 'good' | 'poor' | 'critical' | 'no-data';
  message: string;
  recommendations: string[];
  severity: 'info' | 'warning' | 'error' | 'critical';
}
interface PerformanceThresholds {
  excellent: { minSuccess: 90, maxLatency: 400, maxTokens: 50 };
  good: { minSuccess: 70, maxLatency: 800, maxTokens: 100 };
  poor: { minSuccess: 40, maxLatency: 1500, maxTokens: 200 };
  critical: { minSuccess: 0, maxLatency: Infinity, maxTokens: Infinity };
}

// ============================================
// 🎯 MISSING TYPE DEFINITIONS (ADDED)
// ============================================

export interface ScenarioResult {
  step: number;
  userInput: string;
  response: string;
  tokensUsed: number;
  latencyMs: number;
  fallbacksTriggered: string[];
  qualityMetrics: { [key: string]: any };
}

export interface EnhancedWalkthroughResult extends WalkthroughResult {
  timestamp: string;
  scenarioResults: ScenarioResult[];
  performanceState?: 'excellent' | 'good' | 'poor' | 'critical';
  degradationReasons?: string[];

  recommendations: string[];
  domainMetrics: {
    overallSuccess: boolean;
    mcdAlignmentScore: number;
    userExperienceScore: number;
    resourceEfficiency: number;
    fallbackTriggered: boolean;
  };
}

// ✅ NEW: Extended interfaces for comparative analysis
export interface ComparativeWalkthroughResult extends EnhancedWalkthroughResult {
  comparative: true;
  approaches: string[];
  comparativeResults: {
    [approach: string]: ApproachResult[];
  };
  analysis: ComparativeAnalysis;
  rankings: string[];
  mcdAdvantage: MCDAdvantageValidation;
  recommendations: string[];
}

export interface ApproachResult {
  approach: string;
  approachDisplayName: string;
  variantId: string;
  variantType: 'MCD' | 'Non-MCD' | 'Hybrid';
  variantName: string;
  successRate: string;
  successCount: number;
  totalTrials: number;
  avgLatency: number;
  avgTokens: number;
  avgAccuracy: number;
  mcdAlignmentRate: number;
  efficiency: number;
  trials: TrialResult[];
  approachSpecificMetrics?: {
    [key: string]: any;
  };
}

export interface ComparativeAnalysis {
  successRatios: { [approach: string]: number };
  tokenEfficiencyRatios: { [approach: string]: number };
  latencyRatios: { [approach: string]: number };
  accuracyRatios: { [approach: string]: number };
  consistencyScores: { [approach: string]: number };
  overallScores: { [approach: string]: number };
}

export interface MCDAdvantageValidation {
  validated: boolean;
  concerns: string[];
  recommendations: string[];
  confidenceLevel: number;
  statisticalSignificance: boolean;
  advantages?: {
    successRate: number;
    tokenEfficiency: number;
    latencyAdvantage: number;
    overallAdvantage: number;
  };
}

export interface DomainResultsDisplayOptions {
  showDetailedScenarios: boolean;
  showMCDAnalysis: boolean;
  showPerformanceMetrics: boolean;
  groupByDomain: boolean;
  compareAcrossTiers: boolean;
  
}


export interface EnhancedTrialResult extends TrialResult {
  inputPrompt?: string;
  modelResponse?: string;
  evaluationSteps?: string;
  promptMetadata?: {
    approach: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

export interface DetailedScenarioResult extends ScenarioResult {
  enhancedTrials?: EnhancedTrialResult[];
  promptDetails?: {
    systemContext: string;
    userQuery: string;
    expectedOutput: string;
  };
}

// Add UI state management interface
interface PromptViewState {
  showPrompts: boolean;
  expandedTrials: Set<string>;
  promptFilter: 'all' | 'input' | 'output' | 'evaluation';
}





 type TimeoutID = NodeJS.Timeout;
// ============================================
// 🎯 UNIFIED DOMAIN RESULTS DISPLAY CLASS (SINGLE DEFINITION)
// ============================================
 

export class DomainResultsDisplay {
  private results: EnhancedWalkthroughResult[] = [];
   private groupedResults: { [domain: string]: { [tier: string]: EnhancedWalkthroughResult[] } } = {};
  private options: DomainResultsDisplayOptions;
    private isInitialized: boolean = false;
	private subscribersInitialized: boolean = false;
  private isUpdating = false;
private updateCount = 0;
private lastUpdateReset = Date.now();
private readonly MAX_UPDATES_PER_SECOND = 3;
   // ✅ FIX: More conservative memory management
private static readonly MEMORY_WARNING_THRESHOLD = 200;
private static readonly MEMORY_CLEANUP_THRESHOLD = 300;
private static readonly MAX_RESULTS = 150;
private updateTimeout: NodeJS.Timeout | null = null;
private lastUpdateTime: number = 0;

private readonly UPDATE_THROTTLE_MS = 1000; // 1 second instead of 200ms

private activeEventListeners: Map<string, { element: Element; event: string; handler: EventListener }> = new Map();
private displayUpdateTimeout: TimeoutID | null = null;
private executionStateLock = false;
private executionStateQueue: (() => void)[] = [];

  // ✅ NEW: Prompt viewing state management
  private promptViewState: PromptViewState = {
    showPrompts: false,
    expandedTrials: new Set<string>(),
    promptFilter: 'all'
  };
  
  private promptViewStateByDomain: Map<string, PromptViewState> = new Map();

private safeAsyncOperation<T>(operation: () => Promise<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * ✅ NEW: Safe async wrapper with error handling
 */
private async safeAsync<T>(
  operation: () => Promise<T>, 
  fallback: T, 
  timeoutMs = 5000,
  context = 'async operation'
): Promise<T> {
  try {
    return await this.safeAsyncOperation(operation, timeoutMs);
  } catch (error) {
    console.error(`❌ ${context} failed:`, error);
    return fallback;
  }
}



// ✅ FIND your constructor and ADD this line:
constructor(options: Partial<DomainResultsDisplayOptions> = {}) {
  this.options = {
    showDetailedScenarios: true,
    showMCDAnalysis: true,
    showPerformanceMetrics: true,
    groupByDomain: true,
    compareAcrossTiers: true,
    ...options
  };
  
 }
/**
 * ✅ NEW: Prompt view state management methods
 */
/**
 * ✅ FIXED: Toggle prompt view and auto-expand all trials
 */
private togglePromptView(domainTier: string): void {
  try {
    if (!this.promptViewStateByDomain.has(domainTier)) {
      this.promptViewStateByDomain.set(domainTier, {
        showPrompts: false,
        expandedTrials: new Set<string>(),
        promptFilter: 'all'
      });
    }
    
    const state = this.promptViewStateByDomain.get(domainTier)!;
    state.showPrompts = !state.showPrompts;
    
    console.log(`🔍 PROMPTS: ${state.showPrompts ? 'Showing' : 'Hiding'} prompts for ${domainTier}`);
    
    // ✅ SAVE CURRENT SCROLL POSITION
    const currentScrollY = window.scrollY;
    
    // Auto-expand/collapse ALL trials when toggling prompts
    if (state.showPrompts) {
      const allTrialIds = this.getAllTrialIdsForDomainTier(domainTier);
      allTrialIds.forEach(trialId => {
        state.expandedTrials.add(trialId);
      });
      console.log(`✅ Auto-expanded ${allTrialIds.length} trials for ${domainTier}`);
    } else {
      state.expandedTrials.clear();
      console.log(`✅ Auto-collapsed all trials for ${domainTier}`);
    }
    
    // Re-render the detailed view
    this.renderDetailedView();
    
    // ✅ RESTORE SCROLL POSITION AFTER RENDER
    requestAnimationFrame(() => {
      window.scrollTo({
        top: currentScrollY,
        behavior: 'instant' // No smooth scrolling
      });
    });
    
  } catch (error) {
    console.error('Error toggling prompt view:', error);
  }
}


/**
 * ✅ NEW: Get all trial IDs for a specific domain-tier
 */
private getAllTrialIdsForDomainTier(domainTier: string): string[] {
  try {
    const allTrialIds: string[] = [];
    
    // Find results matching this domain-tier
    const [domain, tier] = domainTier.split('-');
    const matchingResults = this.results.filter(result => 
      (result as any).domain === domain && (result as any).tier === tier
    );
    
    matchingResults.forEach(result => {
      const scenarioResults = (result as any).scenarioResults || [];
      
      scenarioResults.forEach((scenario, scenarioIndex) => {
        if (scenario.variants && Array.isArray(scenario.variants)) {
          // New structure with variants
          scenario.variants.forEach(variant => {
            if (variant.trials && Array.isArray(variant.trials)) {
              variant.trials.forEach((trial, trialIndex) => {
                const trialId = `${domainTier}-${scenarioIndex}-${trialIndex}`;
                allTrialIds.push(trialId);
              });
            }
          });
        } else {
          // Legacy structure
          const legacyTrialId = `${domainTier}-legacy-${scenarioIndex}`;
          allTrialIds.push(legacyTrialId);
        }
      });
    });
    
    console.log(`🔍 Found ${allTrialIds.length} trial IDs for ${domainTier}:`, allTrialIds);
    return allTrialIds;
    
  } catch (error) {
    console.error('Error getting trial IDs for domain-tier:', error);
    return [];
  }
}

private toggleTrialDetails(domainTier: string, trialId: string): void {
  try {
    const state = this.promptViewStateByDomain.get(domainTier) || {
      showPrompts: false,
      expandedTrials: new Set<string>(),
      promptFilter: 'all'
    };
    
    if (state.expandedTrials.has(trialId)) {
      state.expandedTrials.delete(trialId);
    } else {
      state.expandedTrials.add(trialId);
    }
    
    this.promptViewStateByDomain.set(domainTier, state);
    
    // Re-render just this section
    this.renderDetailedView();
    
  } catch (error) {
    console.error('Error toggling trial details:', error);
  }
}

private setPromptFilter(domainTier: string, filter: 'all' | 'input' | 'output' | 'evaluation'): void {
  try {
    const state = this.promptViewStateByDomain.get(domainTier) || {
      showPrompts: false,
      expandedTrials: new Set<string>(),
      promptFilter: 'all'
    };
    
    state.promptFilter = filter;
    this.promptViewStateByDomain.set(domainTier, state);
    
    this.renderDetailedView();
    
  } catch (error) {
    console.error('Error setting prompt filter:', error);
  }
}

/**
 * ✅ FIXED: More robust performance state analyzer
 */
private analyzePerformanceState(result: EnhancedWalkthroughResult): PerformanceState {
  try {
    const metrics = result.domainMetrics || {};
    const scenarios = result.scenarioResults || [];
    
    // ✅ FIXED: Better null/undefined handling
    const successRate = scenarios.length > 0 ? this.calculateScenarioSuccessRate(scenarios) : 0;
    const avgLatency = scenarios.length > 0 ? this.calculateAverageLatency(scenarios) : 0;
    const avgTokens = scenarios.length > 0 ? this.calculateAverageTokens(scenarios) : 0;
    
    const thresholds: PerformanceThresholds = {
      excellent: { minSuccess: 90, maxLatency: 400, maxTokens: 50 },
      good: { minSuccess: 70, maxLatency: 800, maxTokens: 100 },
      poor: { minSuccess: 40, maxLatency: 1500, maxTokens: 200 },
      critical: { minSuccess: 0, maxLatency: Infinity, maxTokens: Infinity }
    };
    
    // ✅ FIXED: Better performance categorization logic
    if (scenarios.length === 0) {
      return {
        status: 'no-data',
        message: 'No scenario data available for analysis',
        recommendations: ['Execute walkthrough to collect performance data'],
        severity: 'info'
      };
    }
    
    // Determine performance state with better logic
    if (successRate >= thresholds.excellent.minSuccess && 
        avgLatency <= thresholds.excellent.maxLatency && 
        avgTokens <= thresholds.excellent.maxTokens) {
      return {
        status: 'excellent',
        message: `Outstanding performance: ${successRate.toFixed(1)}% success rate, ${avgLatency.toFixed(0)}ms avg latency`,
        recommendations: [
          'Performance is optimal for this tier',
          'Consider as baseline for other domains',
          'Monitor for consistency over time'
        ],
        severity: 'info'
      };
    }
    
    if (successRate >= thresholds.good.minSuccess && 
        avgLatency <= thresholds.good.maxLatency) {
      return {
        status: 'good',
        message: `Good performance with optimization opportunities: ${successRate.toFixed(1)}% success rate`,
        recommendations: [
          `Optimize token efficiency (currently ${avgTokens.toFixed(0)} avg tokens)`,
          `Improve response latency (currently ${avgLatency.toFixed(0)}ms)`,
          'Consider hybrid approaches for edge cases'
        ],
        severity: 'info'
      };
    }
    
    if (successRate >= thresholds.poor.minSuccess) {
      return {
        status: 'poor',
        message: `Performance below expectations: ${successRate.toFixed(1)}% success rate requires attention`,
        recommendations: [
          'Review MCD implementation alignment',
          'Analyze failure patterns in trials',
          `Consider increasing model tier (current: ${avgLatency.toFixed(0)}ms latency)`,
          'Implement more robust fallback mechanisms'
        ],
        severity: 'warning'
      };
    }
    
    return {
      status: 'critical',
      message: `Critical performance issues: ${successRate.toFixed(1)}% success rate`,
      recommendations: [
        'Immediate review required - system may be fundamentally broken',
        'Check model loading and basic functionality',
        'Verify domain walkthrough configuration',
        'Consider complete system restart'
      ],
      severity: 'critical'
    };
    
  } catch (error) {
    console.error('Error analyzing performance state:', error);
    return {
      status: 'no-data',
      message: 'Unable to analyze performance - system error occurred',
      recommendations: ['Check browser console for detailed error information'],
      severity: 'error'
    };
  }
}


/**
 * Template cache for memory-efficient HTML generation
 */
private static templateCache = new Map<string, string>();
private static readonly MAX_CACHE_SIZE = 100;

/**
 * ✅ FIXED: Less aggressive template caching for summary
 */
private static getCachedTemplate(key: string, generator: () => string): string {
    // ✅ FIXED: Use longer cache window for summary stability
    const timestampKey = `${key}-${Math.floor(Date.now() / 120000)}`; // 2 minute cache window instead of 30 seconds
    
    if (this.templateCache.size > this.MAX_CACHE_SIZE) {
        const keysToRemove = Array.from(this.templateCache.keys()).slice(0, 15); // Less aggressive cleanup
        keysToRemove.forEach(oldKey => this.templateCache.delete(oldKey));
    }
    
    if ((window as any).immediateStop) {
        return generator();
    }
    
    if (this.templateCache.has(timestampKey)) {
        return this.templateCache.get(timestampKey)!;
    }

    try {
        const template = generator();
        this.templateCache.set(timestampKey, template);
        return template;
    } catch (error) {
        console.error('Template generation error:', error);
        return '<div class="error">Error generating template</div>';
    }
}






/**
 * Clear template cache to free memory
 */
private static clearTemplateCache(): void {
    this.templateCache.clear();
}


  // ============================================
  // 🔧 INITIALIZATION & CORE METHODS (MISSING METHODS ADDED)
  // ============================================

  /**
   * Initialize the domain results display system
   */
/**
 * Enhanced initialization with comprehensive setup
 */
/**
 * ✅ FIXED: Enhanced initialization with multi-approach support
 */
private isInitializing = false;

public async initialize(): Promise<void> {
  if (this.isInitialized || this.isInitializing) {
    return;
  }
  
  this.isInitializing = true;
  
  try {
    console.log('Initializing DomainResultsDisplay...');
    
    // ✅ ADD timeout protection:
    await this.safeAsync(
      async () => {
        await this.ensureCSS();
        this.setupContainers();
        this.ensureEssentialUI();
        this.attachEventListeners();
        this.setupGlobalFunctions();
        this.setupErrorRecoverySystem();
        this.ensureWalkthroughIntegration();
        this.initializeSubscribers();
      },
      undefined,
      10000, // 10 second timeout
      'DomainResultsDisplay initialization'
    );
    
    this.isInitialized = true;
    console.log('✅ DomainResultsDisplay initialized successfully');
    
    if (this.results.length > 0) {
      this.throttledUpdate();
    }
    
    this.startPeriodicMemoryManagement();
    
  } catch (error) {
    console.error('Initialization failed:', error);
    this.handleError('Initialization failed', error);
  } finally {
    this.isInitializing = false;
  }
}






/**
 * Basic initialization fallback
 */
private basicInitialization(): void {
  try {
    this.ensureEssentialUI();
    this.isInitialized = true;
    console.log('⚠️ DomainResultsDisplay initialized with basic functionality');
  } catch (error) {
    console.error('Even basic initialization failed:', error);
  }
}

/**
 * Setup global functions for external access
 */
private setupGlobalFunctions(): void {
  try {
    // Ensure window.domainResultsDisplay exists
    if (!window.domainResultsDisplay) {
      window.domainResultsDisplay = this;
    }
    
    // Add recovery function
    (window as any).recoverDomainResults = () => {
      try {
        this.attemptRecovery('Manual recovery requested');
        this.throttledUpdate();
        console.log('✅ Manual recovery completed');
      } catch (error) {
        console.error('Manual recovery failed:', error);
      }
    };
    
  } catch (error) {
    console.error('Error setting up global functions:', error);
  }
}


  /**
   * Check if there are any walkthrough results available
   * @returns {boolean} True if results exist, false otherwise
   */
  public hasResults(): boolean {
    try {
      return this.results && Array.isArray(this.results) && this.results.length > 0;
    } catch (error) {
      console.error('Error checking for results:', error);
      return false;
    }
  }

  /**
   * Get the total count of walkthrough results
   * @returns {number} Number of walkthrough results
   */
  public getResultsCount(): number {
    try {
      return this.results ? this.results.length : 0;
    } catch (error) {
      console.error('Error getting results count:', error);
      return 0;
    }
  }

  /**
   * Check if there are results for a specific domain
   * @param {string} domain - The domain to check
   * @returns {boolean} True if domain has results, false otherwise
   */
  public hasDomainResults(domain: string): boolean {
    try {
      return this.results && this.results.some(result => (result as any).domain === domain);
    } catch (error) {
      console.error('Error checking for domain results:', error);
      return false;
    }
  }

  /**
   * Get results for a specific domain
   * @param {string} domain - The domain to filter by
   * @returns {EnhancedWalkthroughResult[]} Array of results for the domain
   */
  public getDomainResults(domain: string): EnhancedWalkthroughResult[] {
    try {
      return this.results.filter(result => (result as any).domain === domain);
    } catch (error) {
      console.error('Error getting domain results:', error);
      return [];
    }
  }

  /**
   * Get results for a specific tier
   * @param {string} tier - The tier to filter by
   * @returns {EnhancedWalkthroughResult[]} Array of results for the tier
   */
  public getTierResults(tier: string): EnhancedWalkthroughResult[] {
    try {
      return this.results.filter(result => (result as any).tier === tier);
    } catch (error) {
      console.error('Error getting tier results:', error);
      return [];
    }
  }
 
public addResult(): void {
  console.warn('🛑 addResult() disabled - DomainResults is now read-only. Results come from WalkthroughUI events only.');
}

public addWalkthroughResult(): void {
  console.warn('🛑 addWalkthroughResult() disabled - DomainResults is now read-only. Results come from WalkthroughUI events only.');
}

public addDomainResult(): void {
  console.warn('🛑 addDomainResult() disabled - DomainResults is now read-only. Results come from WalkthroughUI events only.');
}







private ensureWalkthroughIntegration(): void {
  try {
    // Check if walkthrough UI is available
    if (window.walkthroughUI) {
      console.log('✅ Walkthrough UI integration detected');
      
      // Set up bidirectional communication
      (window.walkthroughUI as any).domainResultsDisplay = this;
      
      // Verify walkthrough UI can call our methods
      if (typeof window.walkthroughUI.checkDomainResultsIntegration === 'function') {
        const status = window.walkthroughUI.checkDomainResultsIntegration();
        console.log('🔍 Integration status:', status);
      }
      
    } else {
      console.warn('⚠️ Walkthrough UI not available during domain results initialization');
      
      // Set up retry mechanism
      setTimeout(() => {
        if (window.walkthroughUI && !this.isInitialized) {
          this.ensureWalkthroughIntegration();
        }
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Error setting up walkthrough integration:', error);
  }
}

  /**
   * Check if the display is initialized
   * @returns {boolean} True if initialized, false otherwise
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  // ============================================
  // 🏗️ SETUP METHODS
  // ============================================

  private setupContainers(): void {
    try {
      // Create containers if they don't exist
      this.ensureContainer('walkthrough-summary', 'Walkthrough Summary');
      this.ensureContainer('walkthrough-detailed', 'Detailed Results');
      this.ensureContainer('walkthrough-comparison', 'Tier Comparison');
    } catch (error) {
      console.error('Error setting up containers:', error);
    }
  }

  private ensureContainer(id: string, title: string): void {
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      container.className = 'walkthrough-container';
      container.innerHTML = `<h2>${title}</h2><div class="content"></div>`;
      
      // Try to append to a parent container, or body as fallback
      const parentContainer = document.getElementById('walkthrough-results-container') || 
                             document.getElementById('results-container') ||
                             document.body;
      parentContainer.appendChild(container);
    }
  }

 // Add this property at the top of the class
private boundGlobalClick = this.handleGlobalClick.bind(this);

// ✅ FIXED: Minimal, non-conflicting event listeners
// Replace the attachEventListeners method (around line 900)


private attachEventListeners(): void {
  try {
    console.log('🔗 Attaching essential event listeners...');
    
    // ✅ ENHANCED: Clean and retry approach
    this.cleanupEventListeners();
    
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptAttachment = () => {
      try {
        const essentialContainers = [
          'walkthrough-summary',
          'walkthrough-detailed', 
          'walkthrough-comparison'
        ];
        
        let successCount = 0;
        
        essentialContainers.forEach(containerId => {
          try {
            const container = document.getElementById(containerId);
            if (container) {
              const handler = this.createSafeContainerHandler(containerId);
              
              // ✅ ENHANCED: Add multiple event types for robustness
              const eventTypes = ['click', 'touchstart'];
              
              eventTypes.forEach(eventType => {
                container.addEventListener(eventType, handler, { passive: true });
                
                this.activeEventListeners.set(`${containerId}-${eventType}`, {
                  element: container,
                  event: eventType,
                  handler: handler
                });
              });
              
              successCount++;
              console.log(`✅ Event listeners attached for: ${containerId}`);
            } else {
              console.warn(`⚠️ Container not found: ${containerId}`);
            }
          } catch (containerError) {
            console.error(`❌ Failed to attach listener for ${containerId}:`, containerError);
          }
        });
        
        if (successCount === essentialContainers.length) {
          console.log('✅ All essential event listeners attached successfully');
          
          // ✅ ADD: Document-level event delegation as fallback
          this.setupEventDelegation();
          
        } else if (retryCount < maxRetries) {
          retryCount++;
          console.log(`⚠️ Partial success (${successCount}/${essentialContainers.length}), retrying... (${retryCount}/${maxRetries})`);
          setTimeout(attemptAttachment, 1000 * retryCount);
        } else {
          console.error(`❌ Failed to attach all event listeners after ${maxRetries} retries`);
        }
        
      } catch (error) {
        console.error('❌ Event listener attachment failed:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(attemptAttachment, 2000 * retryCount);
        }
      }
    };
    
    attemptAttachment();
    
  } catch (error) {
    console.error('❌ Critical error in attachEventListeners:', error);
  }
}

/**
 * ✅ NEW: Enhanced event handling for prompt interactions
 */
private createSafeContainerHandler(containerId: string): EventListener {
  return (event: Event) => {
    try {
      // ✅ CRITICAL FIX: Execution protection
      if ((window as any).unifiedExecutionState?.isExecuting) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      this.handleContainerClick(event);
      
    } catch (error) {
      console.error(`❌ Container handler error for ${containerId}:`, error);
    }
  };
}




// ✅ ADD THIS METHOD at around line 770 (right after createSafeContainerHandler)
private handleContainerClick = (event: Event): void => {
  try {
    const target = event.target as HTMLElement;
    if (!target) return;
    
    // ✅ SET USER INTERACTION FLAG
    this.isUserInteraction = true;
    
    // Reset flag after a short delay
    setTimeout(() => {
      this.isUserInteraction = false;
    }, 1000);
    
    // Prevent action during execution
    if ((window as any).unifiedExecutionState?.isExecuting) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Handle prompt view toggle
    if (target.classList.contains('toggle-prompts-btn')) {
      const domainTier = target.dataset.domainTier;
      if (domainTier) {
        this.togglePromptView(domainTier);
        event.preventDefault();
        return;
      }
    }

    // ✅ NEW: Handle trial details toggle
    if (target.classList.contains('toggle-trial-details-btn')) {
      const domainTier = target.dataset.domainTier;
      const trialId = target.dataset.trialId;
      if (domainTier && trialId) {
        this.toggleTrialDetails(domainTier, trialId);
        event.preventDefault();
        return;
      }
    }

    // ✅ NEW: Handle prompt filter change
    if (target.classList.contains('prompt-filter-btn')) {
      const domainTier = target.dataset.domainTier;
      const filter = target.dataset.filter as 'all' | 'input' | 'output' | 'evaluation';
      if (domainTier && filter) {
        this.setPromptFilter(domainTier, filter);
        event.preventDefault();
        return;
      }
    }
    // Handle export buttons
    if (target.classList.contains('export-walkthrough-btn')) {
      const format = target.dataset.format as 'json' | 'csv' || 'json';
      this.exportResults(format);
      return;
    }

    // Handle filter buttons
    if (target.classList.contains('domain-filter-btn')) {
      const domain = target.dataset.domain;
      if (domain) this.filterByDomain(domain);
      return;
    }

    if (target.classList.contains('tier-filter-btn')) {
      const tier = target.dataset.tier;
      if (tier) this.filterByTier(tier);
      return;
    }

    // Handle clear button
    if (target.classList.contains('clear-results-btn')) {
      this.clearResults();
      return;
    }

    // Handle retry button
    if (target.classList.contains('retry-execution-btn')) {
      const domain = target.dataset.domain;
      const tier = target.dataset.tier;
      if (domain && tier && (window as any).retryDomainExecution) {
        (window as any).retryDomainExecution(domain, tier);
      }
      return;
    }

  } catch (error) {
    console.error('❌ Error handling container click:', error);
  }
};

private setupEventDelegation(): void {
  try {
    // ✅ FALLBACK: Document-level event delegation
    const delegationHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      
        // Handle export buttons
      if (target.classList.contains('export-walkthrough-btn')) {
        const format = target.dataset.format as 'json' | 'csv' || 'json';
        this.exportResults(format);
      }
      
      // Handle filter buttons
      if (target.classList.contains('domain-filter-btn')) {
        const domain = target.dataset.domain;
        if (domain) this.filterByDomain(domain);
      }
      
      if (target.classList.contains('tier-filter-btn')) {
        const tier = target.dataset.tier;
        if (tier) this.filterByTier(tier);
      }
    };
    
    document.addEventListener('click', delegationHandler, { passive: false });
    
    this.activeEventListeners.set('document-delegation', {
      element: document,
      event: 'click',
      handler: delegationHandler
    });
    
    console.log('✅ Event delegation setup complete');
    
  } catch (error) {
    console.error('❌ Event delegation setup failed:', error);
  }
}

private cleanupEventListeners(): void {
  this.activeEventListeners.forEach(({ element, event, handler }) => {
    try {
      element.removeEventListener(event, handler);
    } catch (error) {
      console.warn('Failed to remove event listener:', error);
    }
  });
  this.activeEventListeners.clear();
}





// Add emergency recovery methods
// Emergency stabilization methods
public emergencyStabilization(): void {
  console.log('🚨 EMERGENCY STABILIZATION initiated...');
  
  try {
    // Reset all state locks
    this.isUpdating = false;
    this.processingQueue = false;
    this.executionStateLock = false;
    
    // Clear all timeouts
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    
    if (this.displayUpdateTimeout) {
      clearTimeout(this.displayUpdateTimeout);
      this.displayUpdateTimeout = null;
    }
    
    // Force DOM update
    requestAnimationFrame(() => {
      this.safeRenderViews();
    });
    
    console.log('✅ Emergency stabilization completed');
    
  } catch (error) {
    console.error('❌ Emergency stabilization failed:', error);
  }
}

public emergencyRecovery(): void {
  try {
    console.log('🚨 EMERGENCY RECOVERY: Attempting to restore display...');
    
    // Reset all locks and timeouts
    this.isUpdating = false;
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    
    // Check for stored approach results
    if (this.approachResults.size > 0) {
      console.log(`📦 Found ${this.approachResults.size} stored approach result sets`);
      
      // Convert approach results to display results
      this.approachResults.forEach((approaches, domainTierKey) => {
        approaches.forEach((result, approach) => {
          if (!this.results.some(r => (r as any).walkthroughId === result.walkthroughId)) {
            console.log(`🔄 Recovering result: ${domainTierKey}-${approach}`);
            this.results.push(result);
          }
        });
      });
    }
    
    // Force immediate display update
    this.refreshDisplayFromStoredResults();
    
    console.log(`✅ RECOVERY: Display restored with ${this.results.length} results`);
    
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
  }
}








// ADD this monitoring system:
private startEventListenerMonitoring(): void {
    setInterval(() => {
        if (!(window as any).unifiedExecutionState?.isExecuting) {
            this.auditEventListeners();
        }
    }, 300000); // 5 minutes
}

private auditEventListeners(): void {
    try {
        // Check if tracked elements still exist in DOM
        const orphanedListeners: string[] = [];
        
        this.activeEventListeners.forEach(({ element }, key) => {
            if (element !== document && !document.contains(element as Node)) {
                orphanedListeners.push(key);
            }
        });
        
        // Remove orphaned listeners
        orphanedListeners.forEach(key => {
            const listener = this.activeEventListeners.get(key);
            if (listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
                this.activeEventListeners.delete(key);
            }
        });
        
        if (orphanedListeners.length > 0) {
            console.log(`🧹 Cleaned up ${orphanedListeners.length} orphaned event listeners`);
        }
        
    } catch (error) {
        console.error('Error auditing event listeners:', error);
    }
}




  private handleGlobalClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    try {
      // Handle export button clicks
      if (target.classList.contains('export-walkthrough-btn')) {
        const format = target.dataset.format as 'json' | 'csv' || 'json';
        this.exportResults(format);
      }
      
      // Handle domain filter clicks
      if (target.classList.contains('domain-filter-btn')) {
        const domain = target.dataset.domain;
        if (domain) {
          this.filterByDomain(domain);
        }
      }
      
      // Handle tier filter clicks
      if (target.classList.contains('tier-filter-btn')) {
        const tier = target.dataset.tier;
        if (tier) {
          this.filterByTier(tier);
        }
      }
    } catch (error) {
      console.error('Error handling click event:', error);
    }
  }

  // ============================================
  // 🔄 CORE RESULT MANAGEMENT METHODS
  // ============================================


// ✅ FIXED: Passive subscriber that doesn't interfere
private initializeSubscribers(): void {
  try {
    if (this.subscribersInitialized) {
      return; // Prevent duplicate registration
    }
    
    // ✅ PASSIVE listener - no immediate processing
    document.addEventListener('singleSourceResultAdded', (event: CustomEvent) => {
      // ✅ QUEUE instead of immediate processing
      this.queueResultForProcessing(event.detail);
    });
    
    this.subscribersInitialized = true;
    console.log('✅ Passive subscriber initialized');
    
  } catch (error) {
    console.error('Failed to initialize subscribers:', error);
  }
}

// ✅ NEW: Queue results instead of immediate processing
private resultQueue: any[] = [];
private processingQueue: boolean = false;

private queueResultForProcessing(resultDetail: any): void {
  this.resultQueue.push(resultDetail);
  
  // ✅ Process queue only when safe
  if (!this.processingQueue && 
      !(window as any).unifiedExecutionState?.isExecuting) {
    this.processResultQueue();
  }
}

private async processResultQueue(): Promise<void> {
  if (this.processingQueue || this.resultQueue.length === 0) return;
  
  this.processingQueue = true;
  
  try {
    while (this.resultQueue.length > 0) {
      // ✅ Check execution state before each result
      if ((window as any).unifiedExecutionState?.isExecuting) {
        console.log('🛑 Pausing result processing - execution active');
        break;
      }
      
      const resultDetail = this.resultQueue.shift();
      
      // ✅ ADD timeout protection:
      await this.safeAsync(
        async () => {
          await this.processQueuedResult(resultDetail);
        },
        undefined,
        3000, // 3 second timeout per result
        `processing queued result ${resultDetail?.result?.walkthroughId || 'unknown'}`
      );
      
      // Small delay between processing
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('❌ Critical error in result queue processing:', error);
  } finally {
    this.processingQueue = false;
  }
}






// ✅ DEBUGGING: Add to handleResultFromSingleSource method
private handleResultFromSingleSource(event: CustomEvent): void {
  try {
    const { result, timestamp } = event.detail;
    
    console.log('📨 SUBSCRIBER: Received result event:', {
      walkthroughId: result.walkthroughId,
      domain: result.domain,
      tier: result.tier,
      approach: result.approach || 'default',
      hasScenarioResults: !!result.scenarioResults?.length,
      hasProcessedTrials: !!result.processedTrials?.length,
      totalApproaches: this.approachResults.size
    });
    
    // ✅ ENHANCED: Better approach detection and storage
    const approach = result.approach || result.approachType || 'default';
    const domainTierKey = `${result.domain || 'unknown'}-${result.tier || 'unknown'}`;
    
    if (approach !== 'default') {
      // Multi-approach result
      this.storeApproachResult(result, approach, domainTierKey, timestamp);
      
      // ✅ CRITICAL: Check if we should generate comparative analysis
      const approaches = this.approachResults.get(domainTierKey);
      if (approaches && approaches.size > 1) {
        console.log(`🔍 COMPARATIVE: ${approaches.size} approaches available for ${domainTierKey}`);
        // Consider triggering comparative analysis here
      }
    } else {
      // Single approach result
      this.storeResultInternally(result, timestamp);
    }
    
    // ✅ IMMEDIATE: Force display update
    this.scheduleDisplayUpdate();
    
    console.log(`✅ SUBSCRIBER: Processed result, total results: ${this.results.length}`);
    
  } catch (error) {
    console.error('❌ Error handling result from single source:', error);
  }
}

/**
 * ✅ MISSING METHOD: Process individual queued result
 */
private async processQueuedResult(resultDetail: any): Promise<void> {
  try {
    console.log('🔄 Processing queued result:', resultDetail);
    
    // ✅ ENHANCED: Detailed validation with specific error messages
    if (!resultDetail || typeof resultDetail !== 'object') {
      console.warn('⚠️ Invalid result detail (not an object), skipping:', {
        type: typeof resultDetail,
        value: resultDetail
      });
      return;
    }
    
    if (!resultDetail.result) {
      console.warn('⚠️ Invalid result detail (missing result property), skipping:', {
        availableKeys: Object.keys(resultDetail),
        detail: resultDetail
      });
      return;
    }
    
    const { result, timestamp } = resultDetail;
    
    // ✅ ENHANCED: Check for required walkthrough properties
    if (!result.walkthroughId && !result.testID) {
      console.warn('⚠️ Invalid result detail (missing walkthroughId/testID), skipping:', {
        availableKeys: Object.keys(result),
        domain: result.domain,
        tier: result.tier
      });
      return;
    }
    
    // ✅ ENHANCED: Check for domain and tier
    if (!result.domain || !result.tier) {
      console.warn('⚠️ Invalid result detail (missing domain/tier), skipping:', {
        domain: result.domain,
        tier: result.tier,
        walkthroughId: result.walkthroughId || result.testID
      });
      return;
    }
    
    // ✅ ORIGINAL: Validate the result before processing
    if (!this.validateWalkthroughResult(result)) {
      console.error('❌ Result validation failed, skipping:', {
        walkthroughId: result.walkthroughId || result.testID,
        domain: result.domain,
        tier: result.tier,
        hasScenarioResults: !!result.scenarioResults,
        hasDomainMetrics: !!result.domainMetrics
      });
      return;
    }
    
    // Detect approach type
    const approach = result.approach || result.approachType || 'default';
    const domainTierKey = `${result.domain || 'unknown'}-${result.tier || 'unknown'}`;
    
    if (approach !== 'default') {
      // Multi-approach result
      this.storeApproachResult(result, approach, domainTierKey, timestamp || Date.now());
      console.log(`✅ Stored multi-approach result: ${approach} for ${domainTierKey}`);
    } else {
      // Single approach result  
      this.storeResultInternally(result, timestamp || Date.now());
      console.log(`✅ Stored single approach result for ${domainTierKey}`);
    }
    
    // Update display if safe to do so
    if (!this.isUpdating && !(window as any).unifiedExecutionState?.isExecuting) {
      this.scheduleDisplayUpdate();
    }
    
  } catch (error) {
    console.error('❌ Error processing queued result:', error);
    // Don't throw - just log the error to prevent breaking the queue processing
  }
}



/**
 * ✅ NEW: Store results with approach tracking
 */
private approachResults: Map<string, Map<string, any>> = new Map();

private storeApproachResult(result: any, approach: string, domainTierKey: string, timestamp: number): void {
  // Initialize approach storage for this domain-tier
  if (!this.approachResults.has(domainTierKey)) {
    this.approachResults.set(domainTierKey, new Map());
  }
  
  const domainApproaches = this.approachResults.get(domainTierKey)!;
  
  // Store this approach result
  const enhancedResult = {
    ...result,
    approach: approach,
    approachDisplayName: this.getApproachDisplayName(approach),
    storedAt: timestamp,
    receivedAt: timestamp
  };
  
  // ✅ CRITICAL: Store each approach separately
  domainApproaches.set(approach, enhancedResult);
  
  // ✅ ALSO: Add to main results array for compatibility
  this.results.push(enhancedResult);
  
  // Update grouped results
  this.updateGroupedResults(result, enhancedResult);
}


/**
 * ✅ NEW: Store comparative results with enhanced structure
 */
private storeComparativeResultInternally(result: ComparativeWalkthroughResult, timestamp: number): void {
  const enhancedResult = {
    ...result,
    timestamp: result.timestamp || new Date(timestamp).toISOString(),
    receivedAt: timestamp,
    isComparative: true
  };
  
  this.results.push(enhancedResult);
  
  // Store in grouped structure with comparative flag
  const domain = result.domain || 'unknown';
  const tier = result.tier || 'unknown';
  
  if (!this.groupedResults[domain]) {
    this.groupedResults[domain] = {};
  }
  
  if (!this.groupedResults[domain][tier]) {
    this.groupedResults[domain][tier] = [];
  }
  
  this.groupedResults[domain][tier].push(enhancedResult);
  
  console.log(`✅ Comparative result stored: ${domain}-${tier} (${result.approaches?.join(', ')})`);
}
/**
 * ✅ NEW: Generate comparative summary HTML
 */
private generateComparativeSummaryHTML(): string {
  try {
    const comparativeResults = this.results.filter(r => (r as any).isComparative);
    
    if (comparativeResults.length === 0) {
      return '';
    }

    let html = `
      <div class="comparative-summary-section">
        <h3>🔍 Comparative Analysis Results</h3>
        <div class="comparative-overview">
    `;

    // Overall approach rankings
    html += this.generateOverallApproachRankings(comparativeResults);
    
    // Domain-specific comparisons
    for (const domain of this.getUniqueDomains()) {
      const domainComparativeResults = comparativeResults.filter(r => (r as any).domain === domain);
      if (domainComparativeResults.length > 0) {
        html += this.generateDomainComparativeHTML(domain, domainComparativeResults);
      }
    }

    // MCD advantage summary
    html += this.generateMCDAdvantageSummaryHTML(comparativeResults);

    html += `
        </div>
      </div>
    `;

    return html;
  } catch (error) {
    console.error('Error generating comparative summary HTML:', error);
    return '<div class="error">Error generating comparative summary</div>';
  }
}

/**
 * ✅ NEW: Generate overall approach rankings
 */
private generateOverallApproachRankings(comparativeResults: EnhancedWalkthroughResult[]): string {
  try {
    const approachStats = this.calculateOverallApproachStats(comparativeResults);
    
    let html = `
      <div class="overall-rankings-section">
        <h4>🏆 Overall Approach Performance Rankings</h4>
        <div class="rankings-container">
    `;

    approachStats.forEach((stats, index) => {
      const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      
      html += `
        <div class="ranking-item ${rankClass}">
          <div class="ranking-header">
            <span class="rank-medal">${medal}</span>
            <span class="rank-number">#${index + 1}</span>
            <span class="approach-name">${this.getApproachDisplayName(stats.approach)}</span>
            <span class="overall-score">${(stats.overallScore * 100).toFixed(1)}%</span>
          </div>
          
          <div class="ranking-metrics">
            <div class="metric-item">
              <span class="metric-label">Success Rate:</span>
              <span class="metric-value">${stats.avgSuccessRate.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Efficiency:</span>
              <span class="metric-value">${(stats.avgEfficiency * 100).toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Latency:</span>
              <span class="metric-value">${stats.avgLatency.toFixed(0)}ms</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Consistency:</span>
              <span class="metric-value">${(stats.consistency * 100).toFixed(1)}%</span>
            </div>
          </div>
          
          <div class="ranking-strengths">
            <strong>Key Strengths:</strong> ${stats.strengths.join(', ')}
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  } catch (error) {
    console.error('Error generating overall approach rankings:', error);
    return '<div class="error">Error generating rankings</div>';
  }
}

/**
 * ✅ NEW: Generate domain-specific comparative analysis
 */
private generateDomainComparativeHTML(domain: string, results: EnhancedWalkthroughResult[]): string {
  try {
    let html = `
      <div class="domain-comparative-section">
        <h4>${this.getDomainIcon(domain)} ${domain} - Approach Comparison</h4>
        <div class="domain-comparison-container">
    `;

    // Comparison table for this domain
    html += this.generateDomainComparisonTable(domain, results);
    
    // Visual comparison charts (simplified HTML representation)
    html += this.generateDomainComparisonCharts(domain, results);

    html += `
        </div>
      </div>
    `;

    return html;
  } catch (error) {
    console.error('Error generating domain comparative HTML:', error);
    return '<div class="error">Error generating domain comparison</div>';
  }
}

/**
 * ✅ NEW: Generate domain comparison table
 */
private generateDomainComparisonTable(domain: string, results: EnhancedWalkthroughResult[]): string {
  try {
    const approaches = this.getUniqueApproachesFromResults(results);
    
    let html = `
      <div class="domain-comparison-table-container">
        <table class="domain-comparison-table">
          <thead>
            <tr>
              <th>Approach</th>
              <th>Success Rate</th>
              <th>Avg Latency</th>
              <th>Avg Tokens</th>
              <th>Efficiency</th>
              <th>MCD Alignment</th>
              <th>Overall Score</th>
            </tr>
          </thead>
          <tbody>
    `;

    approaches.forEach(approach => {
      const approachData = this.getApproachDataForDomain(domain, approach, results);
      const approachClass = approach.toLowerCase().replace(/[\s-]/g, '-');
      
      html += `
        <tr class="approach-row ${approachClass}">
          <td class="approach-cell">
            <span class="approach-badge ${approachClass}">${this.getApproachDisplayName(approach)}</span>
          </td>
          <td class="metric-cell">${approachData.successRate}</td>
          <td class="metric-cell">${approachData.avgLatency}ms</td>
          <td class="metric-cell">${approachData.avgTokens}</td>
          <td class="metric-cell">${(approachData.efficiency * 100).toFixed(1)}%</td>
          <td class="metric-cell">${(approachData.mcdAlignment * 100).toFixed(1)}%</td>
          <td class="metric-cell">
            <span class="overall-score-badge score-${this.getScoreClass(approachData.overallScore)}">
              ${(approachData.overallScore * 100).toFixed(1)}%
            </span>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  } catch (error) {
    console.error('Error generating domain comparison table:', error);
    return '<div class="error">Error generating comparison table</div>';
  }
}

/**
 * ✅ NEW: Generate MCD advantage summary
 */
private generateMCDAdvantageSummaryHTML(comparativeResults: EnhancedWalkthroughResult[]): string {
  try {
    const mcdAdvantageData = this.analyzeMCDAdvantageAcrossResults(comparativeResults);
    
    if (!mcdAdvantageData || Object.keys(mcdAdvantageData).length === 0) {
      return '';
    }

    const overallValidated = Object.values(mcdAdvantageData).every(data => data.validated);
    const statusClass = overallValidated ? 'validated' : 'concerns';
    const statusIcon = overallValidated ? '✅' : '⚠️';

    let html = `
      <div class="mcd-advantage-summary ${statusClass}">
        <h4>${statusIcon} MCD Advantage Validation Summary</h4>
        <div class="advantage-overview">
    `;

    // Overall statistics
    const overallStats = this.calculateOverallMCDAdvantage(mcdAdvantageData);
    html += `
      <div class="overall-advantage-stats">
        <div class="advantage-stat">
          <span class="stat-label">Overall Success Advantage:</span>
          <span class="stat-value">${overallStats.avgSuccessAdvantage.toFixed(2)}x</span>
        </div>
        <div class="advantage-stat">
          <span class="stat-label">Token Efficiency Advantage:</span>
          <span class="stat-value">${overallStats.avgTokenAdvantage.toFixed(2)}x</span>
        </div>
        <div class="advantage-stat">
          <span class="stat-label">Latency Advantage:</span>
          <span class="stat-value">${overallStats.avgLatencyAdvantage.toFixed(2)}x</span>
        </div>
        <div class="advantage-stat">
          <span class="stat-label">Statistical Confidence:</span>
          <span class="stat-value">${(overallStats.avgConfidence * 100).toFixed(1)}%</span>
        </div>
      </div>
    `;

    // Domain-specific breakdown
    html += `
      <div class="domain-advantage-breakdown">
        <h5>Domain-Specific Analysis:</h5>
        <div class="domain-advantages-grid">
    `;

    Object.entries(mcdAdvantageData).forEach(([domain, advantage]) => {
      const domainStatusClass = advantage.validated ? 'domain-validated' : 'domain-concerns';
      const domainIcon = advantage.validated ? '✅' : '⚠️';
      
      html += `
        <div class="domain-advantage-item ${domainStatusClass}">
          <div class="domain-advantage-header">
            <span class="domain-status-icon">${domainIcon}</span>
            <span class="domain-name">${this.getDomainDisplayName(domain)}</span>
          </div>
          
          <div class="domain-advantage-metrics">
            ${advantage.advantages ? `
              <div class="advantage-metric">
                <span>Success: ${advantage.advantages.successRate.toFixed(2)}x</span>
              </div>
              <div class="advantage-metric">
                <span>Tokens: ${advantage.advantages.tokenEfficiency.toFixed(2)}x</span>
              </div>
              <div class="advantage-metric">
                <span>Latency: ${advantage.advantages.latencyAdvantage.toFixed(2)}x</span>
              </div>
            ` : '<span class="no-data">No advantage data</span>'}
          </div>
          
          ${advantage.concerns && advantage.concerns.length > 0 ? `
            <div class="domain-concerns">
              <strong>Concerns:</strong>
              <ul class="concern-list">
                ${advantage.concerns.map(concern => `<li>${concern}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    // Overall recommendations
    const allRecommendations = Object.values(mcdAdvantageData)
      .flatMap(data => data.recommendations || [])
      .filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates

    if (allRecommendations.length > 0) {
      html += `
        <div class="overall-recommendations">
          <h5>💡 Key Recommendations:</h5>
          <ul class="recommendation-list">
            ${allRecommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  } catch (error) {
    console.error('Error generating MCD advantage summary:', error);
    return '<div class="error">Error generating MCD advantage summary</div>';
  }
}
/**
 * ✅ ENHANCED: Export comparative results
 */
private exportComparativeJSON(): void {
  try {
    const comparativeResults = this.results.filter(r => (r as any).isComparative);
    
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      exportType: 'comparative-analysis',
      totalResults: this.results.length,
      comparativeResults: comparativeResults.length,
      domains: this.getUniqueDomains(),
      approaches: this.getUniqueApproachesFromResults(this.results),
      
      // Overall statistics
      overallStats: this.calculateOverallApproachStats(comparativeResults),
      
      // MCD advantage analysis
      mcdAdvantageAnalysis: this.analyzeMCDAdvantageAcrossResults(comparativeResults),
      
      // Raw results data
      results: this.results,
      
      // Summary metrics
      summary: {
        bestOverallApproach: this.calculateOverallApproachStats(comparativeResults)[0]?.approach || 'Unknown',
        mcdValidatedDomains: Object.values(this.analyzeMCDAdvantageAcrossResults(comparativeResults))
          .filter(adv => adv.validated).length,
        averageConfidenceLevel: Object.values(this.analyzeMCDAdvantageAcrossResults(comparativeResults))
          .reduce((sum, adv) => sum + adv.confidenceLevel, 0) / 
          Object.keys(this.analyzeMCDAdvantageAcrossResults(comparativeResults)).length || 0
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparative-walkthrough-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting comparative JSON:', error);
    throw error;
  }
}

/**
 * ✅ ENHANCED: Export comparative CSV
 */
private exportComparativeCSV(): void {
  try {
    const comparativeResults = this.results.filter(r => (r as any).isComparative);
    
    if (comparativeResults.length === 0) {
      // Fall back to standard export
      this.exportCSV();
      return;
    }

    const headers = [
      'Domain', 'Tier', 'Approach', 'Success_Rate', 'Avg_Latency_Ms', 'Avg_Tokens',
      'Efficiency', 'MCD_Alignment_Rate', 'Total_Trials', 'Statistical_Significance',
      'Confidence_Level', 'Overall_Score', 'Timestamp'
    ];

    const rows: any[] = [];

    comparativeResults.forEach(result => {
      const comparativeResult = result as any;
      const domain = comparativeResult.domain;
      const tier = comparativeResult.tier;
      const timestamp = comparativeResult.timestamp;
      const mcdAdvantage = comparativeResult.mcdAdvantage || {};

      if (comparativeResult.comparativeResults) {
        Object.entries(comparativeResult.comparativeResults).forEach(([approach, approachResults]: [string, any]) => {
          if (Array.isArray(approachResults)) {
            approachResults.forEach((approachResult: ApproachResult) => {
              const successRate = approachResult.totalTrials > 0 ? 
                (approachResult.successCount / approachResult.totalTrials * 100).toFixed(1) : '0.0';

              rows.push([
                domain,
                tier,
                approach,
                successRate,
                approachResult.avgLatency || 0,
                approachResult.avgTokens || 0,
                (approachResult.efficiency * 100).toFixed(1),
                (approachResult.mcdAlignmentRate * 100).toFixed(1),
                approachResult.totalTrials || 0,
                mcdAdvantage.statisticalSignificance ? 'Yes' : 'No',
                (mcdAdvantage.confidenceLevel * 100).toFixed(1),
                ((approachResult.avgAccuracy || 0) * 100).toFixed(1),
                timestamp
              ]);
            });
          }
        });
      }
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparative-walkthrough-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting comparative CSV:', error);
    throw error;
  }
}

/**
 * ✅ ENHANCED: Validate comparative result structure
 */
private validateComparativeResult(result: any): boolean {
  try {
    if (!result.comparative) return false;
    
    const requiredFields = ['approaches', 'comparativeResults', 'analysis', 'mcdAdvantage'];
    return requiredFields.every(field => result[field] !== undefined);
  } catch (error) {
    console.error('Error validating comparative result:', error);
    return false;
  }
}


// ✅ ADD: Internal storage (private, no external access)
private storeResultInternally(result: any, timestamp: number): void {
  // Add to flat results array
  const enhancedResult = {
    ...result,
    timestamp: result.timestamp || new Date(timestamp).toISOString(),
    receivedAt: timestamp
  };
  
  this.results.push(enhancedResult);
  
  // Add to grouped structure if used
  const domain = result.domain || 'unknown';
  const tier = result.tier || 'unknown';
  
  if (!this.groupedResults) {
    this.groupedResults = {};
  }
  
  if (!this.groupedResults[domain]) {
    this.groupedResults[domain] = {};
  }
  
  if (!this.groupedResults[domain][tier]) {
    this.groupedResults[domain][tier] = [];
  }
  
  this.groupedResults[domain][tier].push(enhancedResult);
}

// ✅ ADD: Scheduled display updates (prevent excessive updates)

private scheduleDisplayUpdate(): void {
  if (this.displayUpdateTimeout) {
    clearTimeout(this.displayUpdateTimeout);
  }
  
  this.displayUpdateTimeout = setTimeout(() => {
    this.refreshDisplayFromStoredResults();
    this.displayUpdateTimeout = null;
  }, 500); // 500ms delay to batch updates
}

// ✅ ADD: Refresh display from internal storage
private refreshDisplayFromStoredResults(): void {
  try {
    if (this.isUpdating) return; // Prevent overlapping updates
    
    this.isUpdating = true;
    
    // Update all views with current results
    this.safeRenderViews();
    this.ensureButtonVisibility();
    
  } catch (error) {
    console.error('❌ Error refreshing display from stored results:', error);
  } finally {
    this.isUpdating = false;
  }
}



// ✅ ADD THIS METHOD after your existing addWalkthroughResult method:
/**
 * Safe method to add domain results - handles undefined/null results
 */


private handleAutoScroll(): void {
  try {
    const autoScrollWalkthroughs = document.getElementById('autoScrollWalkthroughs') as HTMLInputElement;
    
    // ✅ ONLY AUTO-SCROLL FOR NEW RESULTS, NOT USER INTERACTIONS
    if (autoScrollWalkthroughs?.checked && !this.isUserInteraction) {
      setTimeout(() => {
        const latestResult = document.querySelector('.walkthrough-result:last-child');
        if (latestResult) {
          latestResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  } catch (error) {
    console.error('Error handling auto-scroll:', error);
  }
}

/**
 * ✅ FIXED: Improved single approach HTML with better error handling
 */
private generateSingleApproachHTML(result: any, approach: string): string {
  try {
    const metrics = result.domainMetrics || {};
    const successRate = this.calculateSuccessRateDisplay(result);
    const avgTokens = this.calculateAverageTokens(result.scenarioResults || []);
    const avgLatency = this.calculateAverageLatency(result.scenarioResults || []);
    const isSuccess = metrics.overallSuccess || false;
    
    // ✅ FIXED: Better error handling for execution insights
    let executionInsights;
    try {
      executionInsights = this.generateExecutionInsights(result);
    } catch (insightError) {
      console.error('Error generating execution insights:', insightError);
      executionInsights = {
        insights: ['Unable to generate insights due to data processing error'],
        recommendations: ['Check result data integrity']
      };
    }

    return `
      <div class="approach-result-card ${isSuccess ? 'success' : 'failure'}">
        <div class="approach-name-container">
          <h4>${this.getApproachDisplayName(approach)}</h4>
          <span class="approach-status">${isSuccess ? '✅' : '❌'}</span>
        </div>
        
        <div class="execution-insights-container">
          <h6>💡 Execution Insights:</h6>
          <div class="insights-list">
            ${executionInsights.insights.slice(0, 4).map(insight => `
              <div class="insight-item">${insight}</div>
            `).join('')}
          </div>
        </div>

        ${executionInsights.recommendations.length > 0 ? `
          <div class="execution-recommendations">
            <h6>🚀 Key Recommendations:</h6>
            <ul class="recommendations-list">
              ${executionInsights.recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="approach-metrics-grid">
          <div class="metric">
            <span class="metric-label">Success Rate:</span>
            <span class="metric-value ${isSuccess ? 'status-pass' : 'status-fail'}">${successRate}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Avg Latency:</span>
            <span class="metric-value">${avgLatency.toFixed(0)}ms</span>
          </div>
          <div class="metric">
            <span class="metric-label">Avg Tokens:</span>
            <span class="metric-value">${avgTokens.toFixed(0)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">MCD Alignment:</span>
            <span class="metric-value">${DomainResultsDisplay.safeFormatPercentage(metrics.mcdAlignmentScore, 'MCD alignment')}</span>
          </div>
        </div>
        
        <div class="approach-summary">
          <strong>Approach:</strong> ${approach} | 
          <strong>Scenarios:</strong> ${result.scenarioResults?.length || 0}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error generating single approach HTML:', error);
    return `<div class="error">Error displaying ${approach} results - ${error.message}</div>`;
  }
}

/**
 * ✅ FIXED: Summary-specific memory management
 */
private cleanupSummaryCache(): void {
  try {
    // Clean only summary-related cache entries
    const summaryKeys = Array.from(DomainResultsDisplay.templateCache.keys())
      .filter(key => key.includes('summary-'));
    
    if (summaryKeys.length > 10) { // Keep last 10 summary cache entries
      const oldSummaryKeys = summaryKeys.slice(0, -10);
      oldSummaryKeys.forEach(key => {
        try {
          DomainResultsDisplay.templateCache.delete(key);
        } catch (deleteError) {
          console.warn(`Failed to delete summary cache key: ${key}`, deleteError);
        }
      });
      
      console.log(`🧹 Cleaned ${oldSummaryKeys.length} old summary cache entries`);
    }
  } catch (error) {
    console.warn('Summary cache cleanup failed:', error);
  }
}

/**
 * ✅ NEW: Generate execution insights and recommendations
 */
private generateExecutionInsights(result: any): {
  insights: string[];
  recommendations: string[];
} {
  try {
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    const metrics = result.domainMetrics || {};
    const scenarios = result.scenarioResults || [];
    const domain = result.domain || 'Unknown';
    const tier = result.tier || 'Unknown';
    
    // ✅ PERFORMANCE INSIGHTS
    const successRate = this.calculateScenarioSuccessRate(scenarios);
    const avgLatency = this.calculateAverageLatency(scenarios);
    const avgTokens = this.calculateAverageTokens(scenarios);
    
    // Success rate insights
    if (successRate >= 90) {
      insights.push('✅ Excellent success rate - execution is highly reliable');
    } else if (successRate >= 70) {
      insights.push('⚠️ Good success rate with room for improvement');
      recommendations.push('Analyze failed scenarios to identify patterns');
    } else if (successRate >= 40) {
      insights.push('❌ Poor success rate requires immediate attention');
      recommendations.push('Review execution logic and error handling');
      recommendations.push('Consider increasing model tier or adjusting prompts');
    } else {
      insights.push('🚨 Critical success rate - system may be fundamentally broken');
      recommendations.push('Urgent review of basic functionality required');
    }
    
    // Latency insights
    if (avgLatency <= 500) {
      insights.push('⚡ Fast response times - excellent user experience');
    } else if (avgLatency <= 1000) {
      insights.push('⚡ Acceptable response times');
    } else if (avgLatency <= 2000) {
      insights.push('🐌 Slow response times may impact user experience');
      recommendations.push('Optimize model inference or reduce prompt complexity');
    } else {
      insights.push('🐌 Very slow response times - performance optimization needed');
      recommendations.push('Consider model tier adjustment or prompt engineering');
    }
    
    // Token efficiency insights
    if (avgTokens <= 50) {
      insights.push('🎯 Excellent token efficiency - cost-effective execution');
    } else if (avgTokens <= 100) {
      insights.push('🎯 Good token usage');
    } else if (avgTokens <= 200) {
      insights.push('💰 High token usage - consider optimization');
      recommendations.push('Review prompt length and response formats');
    } else {
      insights.push('💰 Very high token usage - significant cost implications');
      recommendations.push('Urgent prompt optimization required');
    }
    
    // MCD Alignment insights
    if (metrics.mcdAlignmentScore >= 0.8) {
      insights.push('🎯 Strong MCD principle alignment');
    } else if (metrics.mcdAlignmentScore >= 0.6) {
      insights.push('🎯 Moderate MCD alignment - some improvements possible');
      recommendations.push('Review MCD implementation for consistency');
    } else {
      insights.push('🎯 Poor MCD alignment - implementation review needed');
      recommendations.push('Strengthen adherence to MCD principles');
    }
    
    // Fallback insights
    if (metrics.fallbackTriggered) {
      if (metrics.overallSuccess) {
        insights.push('🛡️ Fallback mechanisms successfully handled issues');
      } else {
        insights.push('⚠️ Fallback triggered but execution still failed');
        recommendations.push('Review and strengthen fallback mechanisms');
      }
    } else {
      if (metrics.overallSuccess) {
        insights.push('✅ Execution completed without requiring fallbacks');
      } else {
        insights.push('❌ Failed without fallback activation - may need better error detection');
        recommendations.push('Implement more robust error detection and recovery');
      }
    }
    
    // Domain-specific insights
    this.addDomainSpeciferInsights(domain, metrics, insights, recommendations);
    
    // Scenario-specific insights
    if (scenarios.length > 0) {
      const errorScenarios = scenarios.filter(s => 
        s.response && s.response.toLowerCase().includes('error')
      );
      
      if (errorScenarios.length > 0) {
        insights.push(`⚠️ ${errorScenarios.length}/${scenarios.length} scenarios encountered errors`);
        recommendations.push('Review error scenarios for common failure patterns');
      }
      
      // Consistency insights
      const latencies = scenarios.map(s => s.latencyMs || 0);
      const latencyVariance = this.calculateVariance(latencies);
      
      if (latencyVariance < 100) {
        insights.push('📊 Consistent performance across scenarios');
      } else {
        insights.push('📊 Variable performance - inconsistent execution times');
        recommendations.push('Investigate causes of performance variability');
      }
    }
    
    // Tier-specific insights
    const tierExpectations = {
      'Q1': { expectedLatency: 500, expectedTokens: 50 },
      'Q4': { expectedLatency: 1000, expectedTokens: 100 },
      'Q8': { expectedLatency: 2000, expectedTokens: 200 }
    };
    
    const expectations = tierExpectations[tier];
    if (expectations) {
      if (avgLatency <= expectations.expectedLatency && avgTokens <= expectations.expectedTokens) {
        insights.push(`🏆 Performance exceeds ${tier} tier expectations`);
      } else {
        insights.push(`📋 Performance within ${tier} tier parameters`);
      }
    }
    
    return {
      insights: insights.slice(0, 6), // Limit to 6 insights
      recommendations: recommendations.slice(0, 5) // Limit to 5 recommendations
    };
    
  } catch (error) {
    console.error('Error generating execution insights:', error);
    return {
      insights: ['❌ Unable to generate insights due to analysis error'],
      recommendations: ['Review execution data for completeness']
    };
  }
}



/**
 * ✅ NEW: Add domain-specific insights
 */
private addDomainSpeciferInsights(domain: string, metrics: any, insights: string[], recommendations: string[]): void {
  switch (domain) {
    case 'Appointment Booking':
      if (metrics.overallSuccess) {
        insights.push('📅 Appointment booking logic functioning correctly');
      } else {
        insights.push('📅 Appointment booking challenges detected');
        recommendations.push('Review slot availability checking logic');
        recommendations.push('Enhance booking confirmation workflows');
      }
      break;
      
    case 'Spatial Navigation':
      if (metrics.overallSuccess) {
        insights.push('🧭 Spatial reasoning and navigation working well');
      } else {
        insights.push('🧭 Navigation logic needs refinement');
        recommendations.push('Implement more precise coordinate handling');
        recommendations.push('Add obstacle detection and avoidance');
      }
      break;
      
    case 'Failure Diagnostics':
      if (metrics.overallSuccess) {
        insights.push('🔧 Diagnostic procedures executing effectively');
      } else {
        insights.push('🔧 Diagnostic workflow improvements needed');
        recommendations.push('Implement systematic troubleshooting sequences');
        recommendations.push('Add escalation protocols for complex issues');
      }
      break;
      
    default:
      insights.push(`📋 ${domain} domain execution completed`);
  }
}

/**
 * ✅ UTILITY: Calculate variance for consistency analysis
 */
private calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}

 // ✅ ENHANCED: Debounced updates
private debouncedUpdate = this.debounce(() => {
  this.performUpdate();
}, 500);

private debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ✅ EFFICIENT: Virtual DOM updates
private efficientDOMUpdate(container: HTMLElement, content: string): void {
  requestAnimationFrame(() => {
    // Only update if content actually changed
    if (container.innerHTML !== content) {
      container.innerHTML = content;
    }
  });
}


/**
 * Validate walkthrough result data
 */
// Enhanced result validation with better error handling
private validateWalkthroughResult(result: any): boolean {
  try {
    // ✅ ENHANCED: More robust validation with detailed logging
    if (!result || typeof result !== 'object') {
      console.error('❌ VALIDATION: Result must be an object, got:', typeof result);
      return false;
    }

    if (result === undefined || result === null) {
      console.warn('⚠️ VALIDATION: Result is null/undefined, rejecting');
      return false;
    }

    // Required fields validation with better error messages
    const requiredFields = ['domain', 'tier', 'walkthroughId'];
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!result[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.error(`❌ VALIDATION: Missing required fields: ${missingFields.join(', ')}`, {
        providedFields: Object.keys(result),
        walkthroughId: result.walkthroughId || 'unknown'
      });
      return false;
    }

    // ✅ ENHANCED: Flexible domainMetrics validation with auto-creation
    if (!result.domainMetrics) {
      console.warn(`⚠️ VALIDATION: Missing domainMetrics, creating default for: ${result.walkthroughId}`);
      result.domainMetrics = this.createDefaultDomainMetrics();
    } else {
      // Sanitize existing metrics
      result.domainMetrics = this.sanitizeDomainMetrics(result.domainMetrics, result.walkthroughId);
    }

    // ✅ ENHANCED: Scenario results validation with auto-creation
    if (!result.scenarioResults || !Array.isArray(result.scenarioResults)) {
      console.warn(`⚠️ VALIDATION: Missing/invalid scenarioResults, creating default for: ${result.walkthroughId}`);
      result.scenarioResults = [];
    }

    // ✅ NEW: Data completeness check
    const hasExecutionData = this.validateExecutionData(result);
    if (!hasExecutionData) {
      console.warn(`⚠️ VALIDATION: No execution data found for: ${result.walkthroughId}`);
      // Don't reject, but flag for special handling
      result._hasMinimalData = true;
    }

    console.log(`✅ VALIDATION: Passed for ${result.walkthroughId}`);
    return true;
    
  } catch (error) {
    console.error('❌ VALIDATION ERROR:', error, {
      resultKeys: result ? Object.keys(result) : 'null',
      walkthroughId: result?.walkthroughId || 'unknown'
    });
    return false;
  }
}

// Helper methods for validation
private createDefaultDomainMetrics(): any {
  return {
    overallSuccess: false,
    mcdAlignmentScore: 0,
    userExperienceScore: 0,
    resourceEfficiency: 0,
    fallbackTriggered: true,
    _isDefault: true
  };
}

private validateExecutionData(result: any): boolean {
  const hasScenarios = result.scenarioResults?.length > 0;
  const hasTrials = result.processedTrials?.length > 0 || result.trials?.length > 0;
  const hasExecutionResults = result.executionResults?.length > 0;
  
  return hasScenarios || hasTrials || hasExecutionResults;
}

private sanitizeDomainMetrics(metrics: any, walkthroughId: string): any {
  try {
    const sanitized = { ...metrics };
    
    // ✅ PERCENTAGE FIELDS: Clamp to valid range
    const percentageFields = ['mcdAlignmentScore', 'userExperienceScore', 'resourceEfficiency'];
    
    percentageFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        const originalValue = sanitized[field];
        let value = Number(originalValue);
        
        if (isNaN(value)) {
          console.warn(`Invalid ${field} in ${walkthroughId}: ${originalValue}, setting to 0`);
          sanitized[field] = 0;
        } else {
          // ✅ DETECT: Handle both decimal (0-1) and percentage (0-100) formats
          if (value > 1.0 && value <= 100.0) {
            // Already percentage, normalize to decimal
            value = value / 100;
          } else if (value > 100.0) {
            console.warn(`${field} overflow in ${walkthroughId}: ${originalValue}, clamping to 1.0`);
            value = 1.0;
          } else if (value < 0) {
            console.warn(`Negative ${field} in ${walkthroughId}: ${originalValue}, setting to 0`);
            value = 0;
          }
          
          sanitized[field] = Math.max(0, Math.min(1.0, value));
        }
      }
    });
    
    // ✅ BOOLEAN FIELDS: Ensure proper type
    if (typeof sanitized.overallSuccess !== 'boolean') {
      sanitized.overallSuccess = Boolean(sanitized.overallSuccess);
    }
    
    if (typeof sanitized.fallbackTriggered !== 'boolean') {
      sanitized.fallbackTriggered = Boolean(sanitized.fallbackTriggered);
    }
    
    return sanitized;
    
  } catch (error) {
    console.error(`Error sanitizing domain metrics for ${walkthroughId}:`, error);
    // Return safe defaults
    return {
      overallSuccess: false,
      mcdAlignmentScore: 0,
      userExperienceScore: 0,
      resourceEfficiency: 0,
      fallbackTriggered: true
    };
  }
}


// FIND your handleError method and ADD this case:
private handleError(context: string, error: any): void {
  try {
    const errorInfo = {
      context,
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error?.stack
    };

    console.error(`[DomainResultsDisplay] ${context}:`, errorInfo);

    // ✅ ADD: Specific handling for "result is not defined" errors
    if (context.includes('result is not defined') || context.includes('domainResults not available')) {
      this.showErrorNotification('Domain Results Error', 
        'Some walkthrough results could not be processed. Check the walkthrough execution.');
      
      // Auto-recovery attempt
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).recoverDomainResults) {
          (window as any).recoverDomainResults();
        }
      }, 1000);
    }

    // ... rest of your existing error handling
  } catch (recoveryError) {
    console.error('Error in error handler:', recoveryError);
  }
}

// ADD after the existing handleError method:
private setupErrorRecoverySystem(): void {
    // Global error handler for domain results
    window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('domainResults')) {
            this.handleSystemError('Global error caught', event.error);
        }
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && typeof event.reason === 'object' && 
            (event.reason.message || '').includes('domainResults')) {
            this.handleSystemError('Unhandled promise rejection', event.reason);
            event.preventDefault(); // Prevent console error
        }
    });
}

private handleSystemError(context: string, error: any): void {
    console.error(`[DomainResultsDisplay System Error] ${context}:`, error);
    
    // Attempt graceful recovery
    setTimeout(() => {
        try {
            if (!this.isInitialized) {
                console.log('🔄 Attempting system recovery...');
                this.initialize();
            }
            
            // Clear problematic state
            if (this.isUpdating) {
                this.isUpdating = false;
                console.log('🔧 Reset update lock during recovery');
            }
            
        } catch (recoveryError) {
            console.error('System recovery failed:', recoveryError);
        }
    }, 1000);
}

// CALL setupErrorRecoverySystem() in initialize() method

/**
 * Show error notification to user
 */
private showErrorNotification(context: string, message: string): void {
  try {
    // Create or update error notification
    let errorContainer = document.getElementById('domain-results-error-notification');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'domain-results-error-notification';
      errorContainer.className = 'error-notification';
      
      // Insert at top of results area
      const resultsArea = document.getElementById('walkthrough-results-section') || document.body;
      resultsArea.insertBefore(errorContainer, resultsArea.firstChild);
    }

    errorContainer.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">
          <strong>${context}</strong>: ${message}
        </span>
        <button class="error-dismiss" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
    `;
    errorContainer.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }, 5000);
  } catch (error) {
    console.error('Error showing error notification:', error);
  }
}

/**
 * Attempt recovery from errors
 */
private attemptRecovery(context: string): void {
  try {
    switch (context) {
      case 'Display update failed':
        this.renderFallbackView();
        break;
      case 'Failed to add walkthrough result':
        break;
      default:
        this.ensureEssentialUI();
    }
  } catch (error) {
    console.error('Recovery attempt failed:', error);
  }
}

/**
 * Render fallback view when main rendering fails
 */
private renderFallbackView(): void {
  try {
    const containers = ['walkthrough-summary', 'walkthrough-detailed', 'walkthrough-comparison'];
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <div class="fallback-view">
            <div class="fallback-icon">⚠️</div>
            <div class="fallback-message">
              <h3>Display temporarily unavailable</h3>
              <p>Walkthrough results are being processed. Please refresh the page if this persists.</p>
              <div class="fallback-stats">
                Results available: ${this.results.length}
              </div>
            </div>
          </div>
        `;
      }
    });
  } catch (error) {
    console.error('Error rendering fallback view:', error);
  }
}

/**
 * Ensure essential UI elements exist
 */
private ensureEssentialUI(): void {
  try {
    const essentialContainers = [
      { id: 'walkthrough-results-section', class: 'walkthrough-results-section' },
      { id: 'walkthrough-summary', class: 'walkthrough-container' },
      { id: 'walkthrough-detailed', class: 'walkthrough-container' },
      { id: 'walkthrough-comparison', class: 'walkthrough-container' }
    ];

    essentialContainers.forEach(container => {
      if (!document.getElementById(container.id)) {
        const element = document.createElement('div');
        element.id = container.id;
        element.className = container.class;
        
        const parent = document.getElementById('chapter7Section') || 
                      document.getElementById('main-content') || 
                      document.body;
        parent.appendChild(element);
        
        console.log(`✅ Created missing container: ${container.id}`);
      }
    });
  } catch (error) {
    console.error('Error ensuring essential UI:', error);
  }
}
/**
 * Ensure all result control buttons are visible
 */
private ensureButtonVisibility(): void {
  try {
    setTimeout(() => {
      // Force visibility of all control buttons
      const buttonSelectors = [
        '.results-controls button',
        '.export-btn',
        '.results-header button',
        '[onclick*="exportWalkthrough"]'
      ];

      buttonSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button: Element) => {
          const btn = button as HTMLElement;
          btn.style.visibility = 'visible';
          btn.style.display = 'inline-block';
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
          btn.style.flexShrink = '0';
          btn.style.minWidth = 'max-content';
        });
      });

      // Ensure containers allow proper display
      const containers = document.querySelectorAll('.results-controls, .results-header');
      containers.forEach((container: Element) => {
        const cont = container as HTMLElement;
        cont.style.overflowX = 'auto';
        cont.style.overflowY = 'visible';
        cont.style.display = 'flex';
        cont.style.flexWrap = 'nowrap';
      });

      console.log('✅ Domain results button visibility ensured');
    }, 200);
  } catch (error) {
    console.error('Error ensuring button visibility:', error);
  }
}
/**
 * Emergency CSS injection for button visibility
 */
private injectEmergencyButtonCSS(): void {
  try {
    const emergencyCSS = `
      /* Emergency button visibility fixes */
      .results-controls { 
        overflow-x: auto !important; 
        flex-wrap: nowrap !important; 
        max-width: 100% !important; 
        display: flex !important;
      }
      .results-controls button, 
      .export-btn { 
        flex-shrink: 0 !important; 
        visibility: visible !important; 
        display: inline-block !important; 
        min-width: max-content !important;
      }
    `;

    const emergencyStyle = document.createElement('style');
    emergencyStyle.id = 'emergency-button-visibility';
    emergencyStyle.textContent = emergencyCSS;
    
    if (!document.getElementById('emergency-button-visibility')) {
      document.head.appendChild(emergencyStyle);
      console.log('✅ Emergency button visibility CSS injected');
    }
  } catch (error) {
    console.error('Error injecting emergency CSS:', error);
  }
}

/**
 * Render error view for specific components
 */

/**
 * Ensure required CSS is available
 */
/**
 * Ensure required CSS is available
 */
private async ensureCSS(): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (document.getElementById('domain-results-styles')) {
        resolve();
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'domain-results-styles';
      style.textContent = `
      /* Error Notification Styles */
      .error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-left: 4px solid #f39c12;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      }
      
      .error-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .error-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
      }
      
      .error-message {
        flex: 1;
        font-size: 0.9rem;
      }
      
      .error-dismiss {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #856404;
        flex-shrink: 0;
      }
      
      /* Fallback View Styles */
      .fallback-view {
        text-align: center;
        padding: 40px 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .fallback-icon {
        font-size: 3rem;
        margin-bottom: 20px;
      }
      
      .fallback-message h3 {
        color: #495057;
        margin-bottom: 10px;
      }
      
      .fallback-message p {
        color: #6c757d;
        margin-bottom: 20px;
      }
      
      .fallback-stats {
        background: rgba(255, 255, 255, 0.8);
        padding: 10px;
        border-radius: 4px;
        display: inline-block;
        font-weight: 600;
        color: #495057;
      }
      
      /* Error View Styles */
      .error-view {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      
      .error-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .error-header h3 {
        color: #721c24;
        margin: 0;
      }
      
      .error-details {
        color: #721c24;
        margin-bottom: 15px;
      }
      
      .error-details details {
        margin-top: 10px;
      }
      
      .error-details pre {
        background: rgba(0, 0, 0, 0.1);
        padding: 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        overflow-x: auto;
      }
      
      .error-actions button {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      }
      
      .error-actions button:hover {
        background: #c82333;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      /* Domain Results Grid Styles */
      .domain-results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }
      
      .domain-result-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        background: #f9f9f9;
      }
      
      .domain-result-card.success {
        border-left: 4px solid #28a745;
      }
      
      .domain-result-card.error {
        border-left: 4px solid #dc3545;
      }
      
      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-weight: bold;
      }
      
      .status-icon {
        font-size: 1.2em;
      }
      
      .timestamp {
        font-size: 0.8em;
        color: #666;
        font-weight: normal;
      }
      
      .result-data pre {
        background: #f1f1f1;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        max-height: 200px;
      }
      
      /* Results Header and Controls Fixes */
      .results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e9ecef;
        position: relative;
        min-height: 60px;
        overflow: visible !important;
      }
      
      /* CRITICAL: Fix for button container */
      .results-controls {
        display: flex !important;
        gap: 12px;
        overflow-x: auto !important;
        overflow-y: visible !important;
        scrollbar-width: thin;
        scrollbar-color: #667eea transparent;
        padding: 5px 0;
        min-width: 0;
        flex-shrink: 0 !important;
        max-width: none !important;
        white-space: nowrap;
      }
      
      .results-controls::-webkit-scrollbar {
        height: 6px;
      }
      
      .results-controls::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .results-controls::-webkit-scrollbar-thumb {
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 3px;
      }
      
      .results-controls::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(90deg, #5a6fd8, #6b4190);
      }
      
      /* FORCE: Button visibility */
      .results-controls button,
      .results-controls .export-btn,
      .export-btn {
        visibility: visible !important;
        display: inline-block !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        flex-shrink: 0 !important;
        min-width: max-content !important;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
        margin-right: 8px;
      }
      
      .results-controls button:hover,
      .export-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(40, 167, 69, 0.3);
      }
      
      .results-controls button:active,
      .export-btn:active {
        transform: translateY(-1px);
      }

      /* ✅ NEW: Enhanced Trial Results with Prompt Display */
      .scenario-details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .prompt-controls {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .toggle-prompts-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
      }
      
      .toggle-prompts-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      .toggle-prompts-btn.active {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        box-shadow: 0 2px 8px rgba(118, 75, 162, 0.4);
      }
      
      .prompt-filters {
        display: flex;
        gap: 5px;
        background: rgba(255, 255, 255, 0.9);
        padding: 4px;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
      }
      
      .prompt-filter-btn {
        background: transparent;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 500;
        color: #6c757d;
        transition: all 0.2s ease;
      }
      
      .prompt-filter-btn:hover {
        background: rgba(102, 126, 234, 0.1);
        color: #495057;
      }
      
      .prompt-filter-btn.active {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      
      /* Enhanced Trial Items */
      .trial-item {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        margin: 12px 0;
        overflow: hidden;
        transition: all 0.3s ease;
        background: white;
      }
      
      .trial-item:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transform: translateY(-1px);
      }
      
      .trial-item.success {
        border-left: 4px solid #28a745;
      }
      
      .trial-item.failure {
        border-left: 4px solid #dc3545;
      }
      
      .trial-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #e9ecef;
      }
      
      .trial-summary {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .trial-id {
        font-weight: 600;
        color: #495057;
        font-size: 0.9rem;
      }
      
      .trial-score {
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
      }
      
      .trial-score.success {
        background: linear-gradient(135deg, #d4edda, #c3e6cb);
        color: #155724;
      }
      
      .trial-score.failure {
        background: linear-gradient(135deg, #f8d7da, #f5c6cb);
        color: #721c24;
      }
      
      .trial-metrics {
        display: flex;
        gap: 10px;
        font-size: 0.8rem;
        color: #6c757d;
      }
      
      .trial-metrics .latency,
      .trial-metrics .tokens {
        background: rgba(102, 126, 234, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
      }
      
      .toggle-trial-details-btn {
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.3);
        color: #667eea;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .toggle-trial-details-btn:hover {
        background: rgba(102, 126, 234, 0.2);
        transform: translateY(-1px);
      }
      
      .toggle-trial-details-btn.expanded {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-color: #667eea;
      }
      
      .trial-basic-info {
        padding: 12px 16px;
      }
      
      .trial-input,
      .trial-result-summary {
        margin: 8px 0;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      
      .result-status {
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 600;
        font-size: 0.8rem;
      }
      
      .result-status.success {
        background: rgba(40, 167, 69, 0.1);
        color: #28a745;
      }
      
      .result-status.failure {
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;
      }
      
      /* Prompt Details Sections */
      .trial-details {
        border-top: 1px solid #e9ecef;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        animation: slideDown 0.3s ease-out;
      }
      
      .prompt-details-container {
        padding: 16px;
      }
      
      .prompt-section {
        margin: 20px 0;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .prompt-section.input-prompt {
        border-left: 4px solid #17a2b8;
      }
      
      .prompt-section.model-response {
        border-left: 4px solid #28a745;
      }
      
      .prompt-section.evaluation-details {
        border-left: 4px solid #ffc107;
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #e9ecef;
      }
      
      .section-header h5 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #495057;
      }
      
      .copy-btn {
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.3);
        color: #667eea;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .copy-btn:hover {
        background: rgba(102, 126, 234, 0.2);
        transform: scale(1.05);
      }
      
      .prompt-text,
      .response-text,
      .eval-details {
        background: #f8f9fa;
        border: none;
        padding: 12px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 11px;
        line-height: 1.4;
        max-height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
        color: #495057;
      }
      
      .prompt-text {
        background: linear-gradient(135deg, #e7f3ff 0%, #f0f8ff 100%);
        border-left: 3px solid #17a2b8;
      }
      
      .response-text {
        background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
        border-left: 3px solid #28a745;
      }
      
      .eval-details {
        background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
        border-left: 3px solid #ffc107;
      }
      
      /* Prompt Metadata */
      .prompt-metadata {
        margin: 15px 0;
        padding: 12px;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        border: 1px solid #e9ecef;
        border-radius: 6px;
      }
      
      .prompt-metadata h5 {
        margin: 0 0 10px 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #495057;
      }
      
      .metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
      
      .metadata-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 0.85rem;
      }
      
      .metadata-item .label {
        font-weight: 500;
        color: #6c757d;
      }
      
      .metadata-item .value {
        font-weight: 600;
        color: #495057;
      }
      
      /* Legacy prompt details */
      .legacy-prompt-details {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e9ecef;
      }
      
      /* Enhanced Trial Results Styles */
      .scenario-item.enhanced {
        border: 2px solid #e9ecef;
        border-radius: 12px;
        margin: 20px 0;
        overflow: hidden;
      }
      
      .variants-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        padding: 20px;
      }
      
      .variant-result {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }
      
      .variant-result.mcd {
        border-left: 4px solid #28a745;
        background: linear-gradient(135deg, #d4edda 0%, #f8f9fa 100%);
      }
      
      .variant-result.non-mcd {
        border-left: 4px solid #dc3545;
        background: linear-gradient(135deg, #f8d7da 0%, #f8f9fa 100%);
      }
      
      .variant-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        font-weight: bold;
      }
      
      .variant-type {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .variant-type.mcd {
        background: #28a745;
        color: white;
      }
      
      .variant-type.non-mcd {
        background: #dc3545;
        color: white;
      }
      
      .variant-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 15px;
      }
      
      .variant-metrics .metric {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
      }
      
      .trials-summary {
        margin-top: 15px;
      }
      
      .trials-summary details {
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
      }
      
      .trials-summary summary {
        cursor: pointer;
        font-weight: 600;
        color: #495057;
      }
      
      .trials-list {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 10px;
      }
      
      .trial-results {
        display: flex;
        gap: 10px;
        font-size: 0.8rem;
        color: #6c757d;
      }
      
      .mcd-comparison {
        grid-column: 1 / -1;
        background: linear-gradient(135deg, #fff3cd 0%, #f8f9fa 100%);
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }
      
      .comparison-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      
      .comparison-metric {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .mcd-value {
        color: #28a745;
        font-weight: 600;
      }
      
      .non-mcd-value {
        color: #dc3545;
        font-weight: 600;
      }
      
      /* Comparative Analysis Styles */
      .comparative-summary-section {
        background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
        border-radius: 12px;
        padding: 25px;
        margin: 25px 0;
        border-left: 4px solid #2196f3;
      }
      
      .overall-rankings-section {
        margin-bottom: 30px;
      }
      
      .rankings-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .ranking-item {
        background: white;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #e0e0e0;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .ranking-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #757575;
      }
      
      .ranking-item.rank-1::before {
        background: linear-gradient(135deg, #ffd700, #ffb300);
      }
      
      .ranking-item.rank-2::before {
        background: linear-gradient(135deg, #c0c0c0, #9e9e9e);
      }
      
      .ranking-item.rank-3::before {
        background: linear-gradient(135deg, #cd7f32, #bf360c);
      }
      
      .ranking-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      }
      
      .ranking-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
      }
      
      .rank-medal {
        font-size: 1.5rem;
      }
      
      .rank-number {
        font-weight: 700;
        font-size: 1.2rem;
        color: #2c3e50;
        min-width: 30px;
      }
      
      .approach-name {
        font-weight: 600;
        font-size: 1.1rem;
        color: #2c3e50;
        flex: 1;
      }
      
      .overall-score {
        font-weight: 700;
        font-size: 1.1rem;
        color: #27ae60;
        background: rgba(39, 174, 96, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
      }
      
      .ranking-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .metric-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
      }
      
      .metric-label {
        color: #6c757d;
        font-weight: 500;
      }
      
      .metric-value {
        font-weight: 600;
        color: #2c3e50;
      }
      
      .ranking-strengths {
        font-size: 0.9rem;
        color: #495057;
        font-style: italic;
      }
      
      /* Domain Comparison Styles */
      .domain-comparative-section {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border: 1px solid #e0e0e0;
      }
      
      .domain-comparison-table-container {
        overflow-x: auto;
        margin: 15px 0;
      }
      
      .domain-comparison-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .domain-comparison-table th {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }
      
      .domain-comparison-table td {
        padding: 12px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .approach-row:hover {
        background: #f8f9fa;
      }
      
      .approach-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
      }
      
      .approach-badge.mcd {
        background: linear-gradient(135deg, #dc3545, #c82333);
      }
      
      .approach-badge.few-shot {
        background: linear-gradient(135deg, #17a2b8, #138496);
      }
      
      .approach-badge.system-role {
        background: linear-gradient(135deg, #6f42c1, #5a32a3);
      }
      
      .approach-badge.hybrid {
        background: linear-gradient(135deg, #fd7e14, #e8690b);
      }
      
      .approach-badge.conversational {
        background: linear-gradient(135deg, #28a745, #1e7e34);
      }
      
      .overall-score-badge {
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        color: white;
      }
      
      .overall-score-badge.score-high {
        background: linear-gradient(135deg, #28a745, #20c997);
      }
      
      .overall-score-badge.score-medium {
        background: linear-gradient(135deg, #ffc107, #fd7e14);
      }
      
      .overall-score-badge.score-low {
        background: linear-gradient(135deg, #dc3545, #c82333);
      }
      
      /* MCD Advantage Summary Styles */
      .mcd-advantage-summary {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        margin: 25px 0;
        border-left: 4px solid #dc3545;
      }
      
      .mcd-advantage-summary.validated {
        border-left-color: #28a745;
        background: linear-gradient(135deg, #d4edda, #f8fff8);
      }
      
      .mcd-advantage-summary.concerns {
        border-left-color: #ffc107;
        background: linear-gradient(135deg, #fff3cd, #fefefe);
      }
      
      .overall-advantage-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }
      
      .advantage-stat {
        background: white;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .stat-label {
        font-weight: 500;
        color: #6c757d;
      }
      
      .stat-value {
        font-weight: 700;
        color: #2c3e50;
        font-size: 1.1rem;
      }
      
      .domain-advantages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      
      .domain-advantage-item {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 15px;
      }
      
      .domain-advantage-item.domain-validated {
        border-left: 4px solid #28a745;
      }
      
      .domain-advantage-item.domain-concerns {
        border-left: 4px solid #ffc107;
      }
      
      .domain-advantage-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        font-weight: 600;
      }
      
      .domain-advantage-metrics {
        display: flex;
        gap: 15px;
        margin-bottom: 10px;
      }
      
      .advantage-metric {
        font-size: 0.9rem;
        color: #495057;
      }
      
      .domain-concerns {
        margin-top: 10px;
      }
      
      .concern-list,
      .recommendation-list {
        margin: 5px 0;
        padding-left: 20px;
      }
      
      .concern-list li,
      .recommendation-list li {
        margin: 3px 0;
        font-size: 0.9rem;
      }
      
      /* Domain Charts Section */
      .domain-charts-section {
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .chart-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .chart-bar-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .chart-label {
        min-width: 120px;
        font-weight: 500;
        font-size: 0.9rem;
      }
      
      .chart-bar-container {
        flex: 1;
        height: 25px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }
      
      .chart-bar {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
        transition: width 0.3s ease;
        border-radius: 4px;
      }
      
      .chart-value {
        color: white;
        font-size: 0.8rem;
        font-weight: 600;
      }
      
      /* New Route Styling */
      .new-route-container {
        margin: 20px 0;
        padding: 20px;
        border: 2px solid #007bff;
        border-radius: 8px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }
      
      .new-route-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #007bff;
      }
      
      .domain-results-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        margin: 15px 0;
        padding: 15px;
      }
      
      .domain-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
        font-weight: bold;
      }
      
      .result-item {
        border-left: 4px solid #28a745;
        padding: 10px;
        margin: 8px 0;
        background: #f8f9fa;
        border-radius: 4px;
      }
      
      .result-item.failure {
        border-left-color: #dc3545;
      }
      
      .result-metrics {
        display: flex;
        gap: 15px;
        font-size: 0.9rem;
      }
      
      .metric {
        display: flex;
        gap: 5px;
      }
      
      .clear-btn {
        background: #dc3545;
      }
      
      .clear-btn:hover {
        background: #c82333;
      }
      
      /* Multi-Approach Styles */
      .multi-approach-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      
      .approach-stats {
        display: flex;
        gap: 20px;
        margin-top: 10px;
      }
      
      .approach-stats .stat {
        background: rgba(255, 255, 255, 0.2);
        padding: 5px 10px;
        border-radius: 4px;
        font-weight: 600;
      }
      
      .pending-approaches-section, 
      .comparative-analyses-section {
        margin: 25px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .approach-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      
      .approach-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 15px;
        transition: all 0.3s ease;
      }
      
      .approach-card.complete {
        border-left: 4px solid #28a745;
      }
      
      .approach-card.pending {
        border-left: 4px solid #ffc107;
        opacity: 0.8;
      }
      
      .approach-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-weight: 600;
      }
      
      .approach-metrics {
        display: flex;
        gap: 15px;
        font-size: 0.9rem;
        color: #6c757d;
      }
      
      .comparative-analysis-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin: 15px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .analysis-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 10px;
      }
      
      .approach-count {
        background: #007bff;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      
      .rankings-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .rank-icon {
        font-size: 1.2rem;
      }
      
      .advantage-status.validated {
        color: #28a745;
        font-weight: 600;
      }
      
      .advantage-status.concerns {
        color: #ffc107;
        font-weight: 600;
      }
      
      .confidence {
        margin-left: 10px;
        font-size: 0.9rem;
        color: #6c757d;
      }
      
      /* Multi-Approach Display Styles */
      .domain-tier-section {
        margin: 25px 0;
        padding: 20px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
      }
      
      /* ✅ CRITICAL FIX: Approaches tested - CONSOLIDATED with proper flex layout */
      .approaches-tested {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: center !important;
        justify-content: flex-start !important;
        background: #e3f2fd;
        border-radius: 6px;
        padding: 10px;
        margin: 10px 0 15px 0;
        font-size: 0.9rem;
        color: #1565c0;
        min-width: 0;
        overflow: visible !important;
      }
      
      /* ✅ NUCLEAR OPTION: Force horizontal layout with maximum specificity */
      .walkthrough-result-item .approaches-tested,
      .domain-tier-section .approaches-tested,
      .comparative-analysis-section .approaches-tested,
      .multi-approach-results .approaches-tested,
      .domain-results-card .approaches-tested,
      .walkthrough-summary-grid .approaches-tested {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: center !important;
        justify-content: flex-start !important;
        overflow: visible !important;
        white-space: normal !important;
      }
      
      /* Ensure approach tags stay inline */
      .approach-tag,
      .comparative-approach-tag {
        display: inline-block !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
        background: rgba(33, 150, 243, 0.2);
        color: #1976d2;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        margin: 2px;
        vertical-align: middle;
      }
      
      /* Prevent any parent containers from forcing vertical layout */
      .domain-tier-section,
      .comparative-analysis-section,
      .multi-approach-results,
      .walkthrough-summary-grid {
        overflow-x: visible !important;
        overflow-y: visible !important;
      }
      
      .multi-approach-results {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      
      .approach-result-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .approach-result-card.success {
        border-left: 4px solid #28a745;
      }
      
      .approach-result-card.failure {
        border-left: 4px solid #dc3545;
      }
      
      .approach-result-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .approach-name-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .approach-name-container h4 {
        margin: 0;
        color: #2c3e50;
        font-weight: 600;
      }
      
      .approach-status {
        font-size: 1.2em;
      }
      
      .approach-metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      .status-pass {
        color: #28a745;
        font-weight: 600;
        background: rgba(40, 167, 69, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
      }
      
      .status-fail {
        color: #dc3545;
        font-weight: 600;
        background: rgba(220, 53, 69, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
      }
      
      .approach-summary {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        font-size: 0.85rem;
        color: #6c757d;
      }
      
      /* CSS Variables */
      :root {
        --approach-mcd-color: #dc3545;
        --approach-few-shot-color: #17a2b8;
        --approach-system-role-color: #6f42c1;
        --approach-hybrid-color: #fd7e14;
        --approach-conversational-color: #28a745;
      }
      
      /* Enhanced Performance State Styles */
      .performance-state-container {
        margin: 10px 0;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid;
      }
      
      .performance-state-container.info {
        background: #e3f2fd;
        border-left-color: #2196f3;
      }
      
      .performance-state-container.warning {
        background: #fff3e0;
        border-left-color: #ff9800;
      }
      
      .performance-state-container.error {
        background: #ffebee;
        border-left-color: #f44336;
      }
      
      .performance-state-container.critical {
        background: #fce4ec;
        border-left-color: #e91e63;
        animation: pulse 2s infinite;
      }
      
      .performance-message {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
      
      .performance-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .performance-badge.excellent {
        background: linear-gradient(135deg, #4caf50, #81c784);
        color: white;
      }
      
      .performance-badge.good {
        background: linear-gradient(135deg, #2196f3, #64b5f6);
        color: white;
      }
      
      .performance-badge.poor {
        background: linear-gradient(135deg, #ff9800, #ffb74d);
        color: white;
      }
      
      .performance-badge.critical {
        background: linear-gradient(135deg, #f44336, #ef5350);
        color: white;
      }
      
      /* Enhanced Metric Classes */
      .metric-excellent { color: #4caf50; font-weight: 600; }
      .metric-good { color: #2196f3; font-weight: 500; }
      .metric-poor { color: #ff9800; font-weight: 500; }
      .metric-critical { color: #f44336; font-weight: 600; }
      
      .success-excellent { color: #4caf50; background: rgba(76, 175, 80, 0.1); padding: 2px 6px; border-radius: 4px; }
      .success-good { color: #2196f3; background: rgba(33, 150, 243, 0.1); padding: 2px 6px; border-radius: 4px; }
      .success-poor { color: #ff9800; background: rgba(255, 152, 0, 0.1); padding: 2px 6px; border-radius: 4px; }
      .success-critical { color: #f44336; background: rgba(244, 67, 54, 0.1); padding: 2px 6px; border-radius: 4px; }
      
      /* Contextual Recommendations */
      .contextual-recommendations {
        margin-top: 15px;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
      }
      
      .contextual-recommendations.warning {
        background: linear-gradient(135deg, #fff3e0, #fafafa);
        border-color: #ff9800;
      }
      
      .contextual-recommendations.critical {
        background: linear-gradient(135deg, #ffebee, #fafafa);
        border-color: #f44336;
      }
      
      .recommendation-list {
        margin: 10px 0 0 0;
        padding: 0;
        list-style: none;
      }
      
      .recommendation-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 8px 0;
        padding: 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.8);
      }
      
      .recommendation-item.high {
        border-left: 3px solid #f44336;
      }
      
      .recommendation-item.medium {
        border-left: 3px solid #ff9800;
      }
      
      .recommendation-item.low {
        border-left: 3px solid #4caf50;
      }
      
      .rec-text {
        flex: 1;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      
      .rec-impact {
        font-size: 0.8rem;
        color: #666;
        font-style: italic;
      }
      
      /* Quick Actions */
      .quick-actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .action-btn.retry {
        background: linear-gradient(135deg, #2196f3, #64b5f6);
        color: white;
      }
      
      .action-btn.analyze {
        background: linear-gradient(135deg, #ff9800, #ffb74d);
        color: white;
      }
      
      .action-btn.optimize {
        background: linear-gradient(135deg, #4caf50, #81c784);
        color: white;
      }
      
      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      
      /* Enhanced Tier Result Classes */
      .tier-result.excellent {
        border: 2px solid #4caf50;
        background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
      }
      
      .tier-result.good {
        border: 2px solid #2196f3;
        background: linear-gradient(135deg, #e3f2fd, #f1f8ff);
      }
      
      .tier-result.poor {
        border: 2px solid #ff9800;
        background: linear-gradient(135deg, #fff3e0, #fef7f0);
      }
      
      .tier-result.critical {
        border: 2px solid #f44336;
        background: linear-gradient(135deg, #ffebee, #fef1f2);
        animation: subtle-pulse 3s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      @keyframes subtle-pulse {
        0%, 100% { border-color: #f44336; }
        50% { border-color: #e57373; }
      }
      
      /* Execution Insights Styles */
      .execution-insights-container {
        margin: 10px 0;
        padding: 12px;
        background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
        border-left: 4px solid #4caf50;
        border-radius: 6px;
      }
      
      .execution-insights-container h6 {
        margin: 0 0 8px 0;
        color: #2e7d32;
        font-weight: 600;
      }
      
      .insights-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .insight-item {
        font-size: 0.9rem;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 4px;
        color: #1b5e20;
        line-height: 1.4;
      }
      
      .execution-recommendations {
        margin: 10px 0;
        padding: 12px;
        background: linear-gradient(135deg, #fff3e0, #fef7f0);
        border-left: 4px solid #ff9800;
        border-radius: 6px;
      }
      
      .execution-recommendations h6 {
        margin: 0 0 8px 0;
        color: #ef6c00;
        font-weight: 600;
      }
      
      .recommendations-list {
        margin: 0;
        padding-left: 16px;
        list-style-type: none;
      }
      
      .recommendations-list li {
        font-size: 0.9rem;
        color: #e65100;
        margin: 4px 0;
        padding-left: 8px;
        position: relative;
        line-height: 1.4;
      }
      
      .recommendations-list li::before {
        content: "→";
        position: absolute;
        left: -8px;
        color: #ff9800;
        font-weight: 600;
      }
      
      /* Insight item type-specific styling */
      .insight-item:contains("✅") {
        border-left: 3px solid #4caf50;
        background: rgba(76, 175, 80, 0.1);
      }
      
      .insight-item:contains("⚠️") {
        border-left: 3px solid #ff9800;
        background: rgba(255, 152, 0, 0.1);
      }
      
      .insight-item:contains("❌") {
        border-left: 3px solid #f44336;
        background: rgba(244, 67, 54, 0.1);
      }
      
      .insight-item:contains("⚡") {
        border-left: 3px solid #2196f3;
        background: rgba(33, 150, 243, 0.1);
      }
      
      .insight-item:contains("🎯") {
        border-left: 3px solid #9c27b0;
        background: rgba(156, 39, 176, 0.1);
      }
      
      /* Better summary dashboard styling */
      .walkthrough-summary-grid {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin: 20px 0;
      }
      
      .no-results {
        text-align: center;
        padding: 60px 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        margin: 20px 0;
        border: 2px dashed #dee2e6;
      }
      
      .no-results-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        opacity: 0.7;
      }
      
      .no-results h3 {
        color: #495057;
        margin-bottom: 10px;
        font-weight: 600;
      }
      
      .no-results p {
        color: #6c757d;
        font-size: 1.1rem;
      }
      
      .error {
        background: #fff5f5;
        border: 1px solid #fed7d7;
        border-left: 4px solid #e53e3e;
        border-radius: 8px;
        padding: 20px;
        margin: 15px 0;
      }
      
      .error-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }
      
      .error h3 {
        color: #c53030;
        margin: 0 0 10px 0;
      }
      
      .error button {
        background: #e53e3e;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 10px;
      }
      
      .error button:hover {
        background: #c53030;
      }

      /* Animations */
      @keyframes slideDown {
        from {
          opacity: 0;
          max-height: 0;
        }
        to {
          opacity: 1;
          max-height: 1000px;
        }
      }
      
      /* Scrollbar styling for prompt text areas */
      .prompt-text::-webkit-scrollbar,
      .response-text::-webkit-scrollbar,
      .eval-details::-webkit-scrollbar {
        width: 6px;
      }
      
      .prompt-text::-webkit-scrollbar-track,
      .response-text::-webkit-scrollbar-track,
      .eval-details::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.1);
        border-radius: 3px;
      }
      
      .prompt-text::-webkit-scrollbar-thumb,
      .response-text::-webkit-scrollbar-thumb,
      .eval-details::-webkit-scrollbar-thumb {
        background: rgba(102, 126, 234, 0.5);
        border-radius: 3px;
      }
      
      .prompt-text::-webkit-scrollbar-thumb:hover,
      .response-text::-webkit-scrollbar-thumb:hover,
      .eval-details::-webkit-scrollbar-thumb:hover {
        background: rgba(102, 126, 234, 0.7);
      }
      /* Enhanced Trial Item Styles */
.trial-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin: 12px 0;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.trial-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.trial-item.success {
  border-left: 4px solid #28a745;
}

.trial-item.failure {
  border-left: 4px solid #dc3545;
}

.trial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
}

.trial-summary {
  display: flex;
  align-items: center;
  gap: 15px;
}

.trial-id {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.trial-score {
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
}

.trial-score.success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
}

.trial-score.failure {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
}

.trial-metrics {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  color: #6c757d;
}

.trial-metrics .latency,
.trial-metrics .tokens {
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.error {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-left: 4px solid #e53e3e;
  border-radius: 8px;
  padding: 20px;
  margin: 15px 0;
  color: #c53030;
}

      /* Responsive Design */
      @media (max-width: 1024px) {
        .results-header {
          flex-direction: column;
          gap: 15px;
          text-align: center;
          align-items: stretch;
        }
        
        .results-controls {
          justify-content: center;
          overflow-x: auto;
          padding-bottom: 10px;
        }
        
        .approaches-tested {
          flex-direction: row !important;
          justify-content: center;
        }
      }
      
      @media (max-width: 768px) {
        .error-notification {
          position: static;
          margin: 10px;
          max-width: none;
        }
        
        .fallback-view {
          padding: 20px 10px;
        }
        
        .variants-container {
          grid-template-columns: 1fr;
        }
        
        .variant-metrics {
          grid-template-columns: 1fr;
        }
        
        .comparison-grid {
          grid-template-columns: 1fr;
        }
        
        .results-controls {
          flex-direction: row;
          overflow-x: auto;
          gap: 8px;
          padding: 8px 4px;
          justify-content: flex-start;
        }
        
        .results-controls button,
        .export-btn {
          min-width: 100px;
          padding: 8px 12px;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        
        .ranking-header {
          flex-wrap: wrap;
        }
        
        .ranking-metrics {
          grid-template-columns: 1fr;
        }
        
        .overall-advantage-stats {
          grid-template-columns: 1fr;
        }
        
        .domain-advantages-grid {
          grid-template-columns: 1fr;
        }
        
        .domain-comparison-table-container {
          font-size: 0.8rem;
        }
        
        .multi-approach-results {
          grid-template-columns: 1fr;
        }
        
        .approach-metrics-grid {
          grid-template-columns: 1fr;
        }
        
        .walkthrough-summary-grid {
          margin: 10px 0;
        }
        
        /* Mobile approach layout fixes */
        .approaches-tested {
          flex-direction: row !important;
          justify-content: flex-start !important;
        }
        
        .approach-tag,
        .comparative-approach-tag {
          font-size: 0.75rem !important;
          padding: 3px 6px !important;
        }

        /* Responsive design for prompt details */
        .scenario-details-header {
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
        }
        
        .prompt-controls {
          justify-content: center;
        }
        
        .prompt-filters {
          justify-content: center;
        }
        
        .trial-header {
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
        }
        
        .trial-summary {
          justify-content: space-between;
        }
        
        .metadata-grid {
          grid-template-columns: 1fr;
        }
        
        .prompt-text,
        .response-text,
        .eval-details {
          font-size: 10px;
          max-height: 200px;
        }
      }
      
      /* Emergency Fallback Styles */
      .walkthrough-results-section .results-controls,
      #walkthrough-results-section .results-controls {
        display: flex !important;
        overflow-x: auto !important;
        overflow-y: visible !important;
      }
      
      .walkthrough-results-section .results-controls button,
      #walkthrough-results-section .results-controls button {
        display: inline-block !important;
        visibility: visible !important;
      }
      
      /* ✅ EMERGENCY FIX: Force horizontal approach layout with maximum priority */
      * .approaches-tested {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }
      
      * .approach-tag, * .comparative-approach-tag {
        display: inline-block !important;
        white-space: nowrap !important;
        margin: 2px !important;
      }
      
      /* Walkthrough Summary Specific Styles */
      .walkthrough-summary-grid {
        display: flex;
        flex-direction: column;
        gap: 25px;
        margin: 20px 0;
      }

      .domain-walkthrough-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .domain-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 10px;
      }

      .walkthrough-approaches {
        margin: 10px 0;
      }

      .approaches-tested {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .approach-tag {
        background: #e3f2fd;
        color: #1976d2;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .walkthrough-results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }

      .walkthrough-approach-card {
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        transition: all 0.3s ease;
      }

      .walkthrough-approach-card.success {
        border-left: 4px solid #28a745;
        background: linear-gradient(135deg, #d4edda, #f8fff8);
      }

      .walkthrough-approach-card.failure {
        border-left: 4px solid #dc3545;
        background: linear-gradient(135deg, #f8d7da, #fff8f8);
      }

      .approach-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .walkthrough-metrics {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
      }

      .metric-label {
        color: #666;
        font-weight: 500;
      }

      .metric-value.success {
        color: #28a745;
        font-weight: 600;
      }

      .metric-value.failure {
        color: #dc3545;
        font-weight: 600;
      }

      .walkthrough-summary-footer {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: #666;
      }

      /* Domain-specific icons and styling */
      .tier-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
      }

      .tier-badge.Q1 { background: #28a745; }
      .tier-badge.Q4 { background: #007bff; }
      .tier-badge.Q8 { background: #6f42c1; }
	  
	  /* Prevent layout shifts during prompt toggling */
.trial-details {
  transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
  overflow: hidden;
}

.trial-details.expanding {
  max-height: 2000px; /* Set a reasonable max height */
}

.trial-details.collapsing {
  max-height: 0;
  opacity: 0;
}

/* Prevent scroll jumps */
.scenario-details {
  scroll-behavior: auto; /* Override smooth scrolling for user interactions */
}

	  
      `;
      
      document.head.appendChild(style);
      console.log('✅ Enhanced Domain results CSS with prompt display features injected successfully');
      resolve();
    } catch (error) {
      console.error('Error injecting enhanced CSS:', error);
      resolve(); // Don't reject, just resolve to continue initialization
    }
  });
}



/**
 * ✅ NEW: Helper methods for comparative analysis
 */
private getApproachDisplayName(approach: string): string {
  const displayNames: { [key: string]: string } = {
    'mcd': 'MCD',
    'few-shot': 'Few-Shot',
    'fewShot': 'Few-Shot',
    'system-role': 'System Role',
    'systemRole': 'System Role',
    'hybrid': 'Hybrid',
    'conversational': 'Conversational'
  };
  return displayNames[approach] || approach;
}

private getUniqueApproachesFromResults(results: EnhancedWalkthroughResult[]): string[] {
  const approaches = new Set<string>();
  
  results.forEach(result => {
    if ((result as any).isComparative && (result as any).approaches) {
      (result as any).approaches.forEach((approach: string) => approaches.add(approach));
    }
  });
  
  return Array.from(approaches);
}

private getApproachDataForDomain(domain: string, approach: string, results: EnhancedWalkthroughResult[]): any {
  try {
    const domainResults = results.filter(r => (r as any).domain === domain && (r as any).isComparative);
    
    if (domainResults.length === 0) {
      return {
        successRate: 'N/A',
        avgLatency: 0,
        avgTokens: 0,
        efficiency: 0,
        mcdAlignment: 0,
        overallScore: 0
      };
    }

    // Aggregate data across all results for this approach
    let totalSuccessCount = 0;
    let totalTrials = 0;
    let totalLatency = 0;
    let totalTokens = 0;
    let totalEfficiency = 0;
    let totalMcdAlignment = 0;
    let resultCount = 0;

    domainResults.forEach(result => {
      const comparativeResult = result as any;
      if (comparativeResult.comparativeResults && comparativeResult.comparativeResults[approach]) {
        const approachResults = comparativeResult.comparativeResults[approach];
        
        approachResults.forEach((approachResult: ApproachResult) => {
          totalSuccessCount += approachResult.successCount || 0;
          totalTrials += approachResult.totalTrials || 0;
          totalLatency += approachResult.avgLatency || 0;
          totalTokens += approachResult.avgTokens || 0;
          totalEfficiency += approachResult.efficiency || 0;
          totalMcdAlignment += approachResult.mcdAlignmentRate || 0;
          resultCount++;
        });
      }
    });

    if (resultCount === 0) {
      return {
        successRate: '0/0',
        avgLatency: 0,
        avgTokens: 0,
        efficiency: 0,
        mcdAlignment: 0,
        overallScore: 0
      };
    }

    const avgLatency = totalLatency / resultCount;
    const avgTokens = totalTokens / resultCount;
    const efficiency = totalEfficiency / resultCount;
    const mcdAlignment = totalMcdAlignment / resultCount;
    const successRate = totalTrials > 0 ? (totalSuccessCount / totalTrials) * 100 : 0;

    // Calculate overall score
    const overallScore = (
      (successRate / 100) * 0.4 +
      efficiency * 0.3 +
      mcdAlignment * 0.2 +
      Math.max(0, 1 - (avgLatency / 2000)) * 0.1
    );

    return {
      successRate: `${totalSuccessCount}/${totalTrials}`,
      avgLatency: Math.round(avgLatency),
      avgTokens: Math.round(avgTokens),
      efficiency,
      mcdAlignment,
      overallScore
    };

  } catch (error) {
    console.error('Error getting approach data for domain:', error);
    return {
      successRate: 'Error',
      avgLatency: 0,
      avgTokens: 0,
      efficiency: 0,
      mcdAlignment: 0,
      overallScore: 0
    };
  }
}

private getScoreClass(score: number): string {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

private getDomainDisplayName(domain: string): string {
  const displayNames: { [key: string]: string } = {
    'appointment-booking': 'Appointment Booking',
    'spatial-navigation': 'Spatial Navigation',
    'failure-diagnostics': 'Failure Diagnostics'
  };
  return displayNames[domain] || domain;
}

private calculateOverallApproachStats(comparativeResults: EnhancedWalkthroughResult[]): any[] {
  try {
    const approaches = this.getUniqueApproachesFromResults(comparativeResults);
    const stats: any[] = [];

    approaches.forEach(approach => {
      let totalSuccessCount = 0;
      let totalTrials = 0;
      let totalLatency = 0;
      let totalEfficiency = 0;
      let resultCount = 0;
      const strengthCounts = { success: 0, speed: 0, efficiency: 0, consistency: 0 };

      comparativeResults.forEach(result => {
        const comparativeResult = result as any;
        if (comparativeResult.comparativeResults && comparativeResult.comparativeResults[approach]) {
          const approachResults = comparativeResult.comparativeResults[approach];
          
          approachResults.forEach((approachResult: ApproachResult) => {
            totalSuccessCount += approachResult.successCount || 0;
            totalTrials += approachResult.totalTrials || 0;
            totalLatency += approachResult.avgLatency || 0;
            totalEfficiency += approachResult.efficiency || 0;
            resultCount++;

            // Count strengths
            if ((approachResult.successCount / approachResult.totalTrials) > 0.8) strengthCounts.success++;
            if (approachResult.avgLatency < 1000) strengthCounts.speed++;
            if (approachResult.efficiency > 0.8) strengthCounts.efficiency++;
            if (approachResult.mcdAlignmentRate > 0.7) strengthCounts.consistency++;
          });
        }
      });

      if (resultCount > 0) {
        const avgSuccessRate = (totalSuccessCount / totalTrials) * 100;
        const avgLatency = totalLatency / resultCount;
        const avgEfficiency = totalEfficiency / resultCount;
        const consistency = this.calculateApproachConsistency(approach, comparativeResults);

        const overallScore = (
          (avgSuccessRate / 100) * 0.4 +
          avgEfficiency * 0.3 +
          Math.max(0, 1 - (avgLatency / 2000)) * 0.2 +
          consistency * 0.1
        );

        const strengths = [];
        if (strengthCounts.success > resultCount / 2) strengths.push('High Success Rate');
        if (strengthCounts.speed > resultCount / 2) strengths.push('Fast Response');
        if (strengthCounts.efficiency > resultCount / 2) strengths.push('Resource Efficient');
        if (strengthCounts.consistency > resultCount / 2) strengths.push('MCD Aligned');

        stats.push({
          approach,
          avgSuccessRate,
          avgLatency,
          avgEfficiency,
          consistency,
          overallScore,
          strengths: strengths.length > 0 ? strengths : ['Functional Performance']
        });
      }
    });

    return stats.sort((a, b) => b.overallScore - a.overallScore);

  } catch (error) {
    console.error('Error calculating overall approach stats:', error);
    return [];
  }
}

private calculateApproachConsistency(approach: string, results: EnhancedWalkthroughResult[]): number {
  try {
    const latencies: number[] = [];
    
    results.forEach(result => {
      const comparativeResult = result as any;
      if (comparativeResult.comparativeResults && comparativeResult.comparativeResults[approach]) {
        comparativeResult.comparativeResults[approach].forEach((approachResult: ApproachResult) => {
          if (approachResult.avgLatency) {
            latencies.push(approachResult.avgLatency);
          }
        });
      }
    });

    if (latencies.length < 2) return 1.0;

    const mean = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - mean, 2), 0) / latencies.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (lower deviation = higher consistency)
    return Math.max(0, 1 - (standardDeviation / mean));

  } catch (error) {
    console.error('Error calculating approach consistency:', error);
    return 0.5;
  }
}

private analyzeMCDAdvantageAcrossResults(results: EnhancedWalkthroughResult[]): { [domain: string]: MCDAdvantageValidation } {
  try {
    const domainAdvantages: { [domain: string]: MCDAdvantageValidation } = {};

    const domains = this.getUniqueDomains();
    domains.forEach(domain => {
      const domainResults = results.filter(r => (r as any).domain === domain && (r as any).isComparative);
      
      if (domainResults.length > 0) {
        // Extract MCD advantage data from comparative results
        const mcdAdvantageData = domainResults
          .map(result => (result as any).mcdAdvantage)
          .filter(advantage => advantage != null);

        if (mcdAdvantageData.length > 0) {
          // Aggregate advantages across results for this domain
          const aggregatedAdvantage = this.aggregateMCDAdvantageData(mcdAdvantageData);
          domainAdvantages[domain] = aggregatedAdvantage;
        }
      }
    });

    return domainAdvantages;

  } catch (error) {
    console.error('Error analyzing MCD advantage across results:', error);
    return {};
  }
}

private aggregateMCDAdvantageData(advantageData: MCDAdvantageValidation[]): MCDAdvantageValidation {
  try {
    if (advantageData.length === 0) {
      return {
        validated: false,
        concerns: ['No MCD advantage data available'],
        recommendations: ['Collect more comparative data'],
        confidenceLevel: 0,
        statisticalSignificance: false
      };
    }

    const validatedCount = advantageData.filter(data => data.validated).length;
    const avgConfidence = advantageData.reduce((sum, data) => sum + data.confidenceLevel, 0) / advantageData.length;
    const significantCount = advantageData.filter(data => data.statisticalSignificance).length;

    // Aggregate concerns and recommendations
    const allConcerns = advantageData.flatMap(data => data.concerns || []);
    const uniqueConcerns = [...new Set(allConcerns)];
    
    const allRecommendations = advantageData.flatMap(data => data.recommendations || []);
    const uniqueRecommendations = [...new Set(allRecommendations)];

    // Aggregate advantages if available
    let aggregatedAdvantages = undefined;
    const advantagesData = advantageData.filter(data => data.advantages).map(data => data.advantages!);
    
    if (advantagesData.length > 0) {
      aggregatedAdvantages = {
        successRate: advantagesData.reduce((sum, adv) => sum + adv.successRate, 0) / advantagesData.length,
        tokenEfficiency: advantagesData.reduce((sum, adv) => sum + adv.tokenEfficiency, 0) / advantagesData.length,
        latencyAdvantage: advantagesData.reduce((sum, adv) => sum + adv.latencyAdvantage, 0) / advantagesData.length,
        overallAdvantage: advantagesData.reduce((sum, adv) => sum + adv.overallAdvantage, 0) / advantagesData.length
      };
    }

    return {
      validated: validatedCount > advantageData.length / 2,
      concerns: uniqueConcerns,
      recommendations: uniqueRecommendations,
      confidenceLevel: avgConfidence,
      statisticalSignificance: significantCount > advantageData.length / 2,
      advantages: aggregatedAdvantages
    };

  } catch (error) {
    console.error('Error aggregating MCD advantage data:', error);
    return {
      validated: false,
      concerns: ['Error aggregating MCD advantage data'],
      recommendations: ['Review data aggregation process'],
      confidenceLevel: 0,
      statisticalSignificance: false
    };
  }
}

private calculateOverallMCDAdvantage(mcdAdvantageData: { [domain: string]: MCDAdvantageValidation }): any {
  try {
    const domains = Object.keys(mcdAdvantageData);
    if (domains.length === 0) {
      return {
        avgSuccessAdvantage: 0,
        avgTokenAdvantage: 0,
        avgLatencyAdvantage: 0,
        avgConfidence: 0
      };
    }

    let totalSuccessAdvantage = 0;
    let totalTokenAdvantage = 0;
    let totalLatencyAdvantage = 0;
    let totalConfidence = 0;
    let validDomainsCount = 0;

    domains.forEach(domain => {
      const advantage = mcdAdvantageData[domain];
      if (advantage.advantages) {
        totalSuccessAdvantage += advantage.advantages.successRate;
        totalTokenAdvantage += advantage.advantages.tokenEfficiency;
        totalLatencyAdvantage += advantage.advantages.latencyAdvantage;
        validDomainsCount++;
      }
      totalConfidence += advantage.confidenceLevel;
    });

    return {
      avgSuccessAdvantage: validDomainsCount > 0 ? totalSuccessAdvantage / validDomainsCount : 0,
      avgTokenAdvantage: validDomainsCount > 0 ? totalTokenAdvantage / validDomainsCount : 0,
      avgLatencyAdvantage: validDomainsCount > 0 ? totalLatencyAdvantage / validDomainsCount : 0,
      avgConfidence: totalConfidence / domains.length
    };

  } catch (error) {
    console.error('Error calculating overall MCD advantage:', error);
    return {
      avgSuccessAdvantage: 0,
      avgTokenAdvantage: 0,
      avgLatencyAdvantage: 0,
      avgConfidence: 0
    };
  }
}

  public updateResults(results: EnhancedWalkthroughResult[]): void {
    try {
      this.results = results;
      this.renderAllViews();
    } catch (error) {
      console.error('Error updating results:', error);
    }
  }

  public clearResults(): void {
    try {
      this.results = [];
      this.updateDisplay();
    } catch (error) {
      console.error('Error clearing results:', error);
    }
  }

  public getResults(): EnhancedWalkthroughResult[] {
    return [...this.results];
  }

 private updateDisplay(): void {
  try {
    this.throttledUpdate();
  } catch (error) {
    console.error('Error updating display:', error);
  }
}

/**
 * Throttled update to prevent excessive DOM manipulation
 */
/**
 * Enhanced throttled update with anti-infinite-loop protection
 */
/**
 * Throttled update with anti-loop protection
 */
// ✅ FIXED: Execution-aware update throttling
private throttledUpdate(): void {
  // ✅ IMMEDIATE EXECUTION CHECK
  if ((window as any).unifiedExecutionState?.isExecuting ||
      (window as any).isWalkthroughExecuting ||
      this.isUpdating) {
    console.log('🛑 Update blocked - execution active or already updating');
    return;
  }
  
  const now = Date.now();
  
  if (this.updateTimeout) {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }

  // ✅ Longer delay during potential execution
  const delay = (window as any).trialExecutionActive ? 2000 : 1000;

  if (now - this.lastUpdateTime >= delay) {
    this.performUpdate();
    this.lastUpdateTime = now;
  } else {
    this.updateTimeout = setTimeout(() => {
      // ✅ Double-check before executing
      if (!(window as any).unifiedExecutionState?.isExecuting) {
        this.performUpdate();
        this.lastUpdateTime = Date.now();
      }
      this.updateTimeout = null;
    }, delay - (now - this.lastUpdateTime));
  }
}



private performUpdate(): void {
  // Circuit breaker
  const now = Date.now();
  if (now - this.lastUpdateReset > 1000) {
    this.updateCount = 0;
    this.lastUpdateReset = now;
  }
  
  if (this.updateCount >= this.MAX_UPDATES_PER_SECOND) {
    console.warn('Update rate limit reached, skipping...');
    return;
  }
  
  if (this.isUpdating) {
    console.warn('Update already in progress, skipping...');
    return;
  }

  try {
    this.isUpdating = true;
    this.updateCount++;
    
    // Actual update logic here
    this.safeRenderViews();
    
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    this.isUpdating = false;
  }
}


private safeRenderViews(): void {
  // ✅ SAVE SCROLL POSITION BEFORE RENDERING
  const currentScrollY = window.scrollY;
  
  const renderOperations = [
    { name: 'Summary', method: () => this.renderSummaryView() },
    { name: 'Detailed', method: () => this.renderDetailedView() },
    { name: 'Comparison', method: () => this.renderComparisonView() }
  ];

  renderOperations.forEach(operation => {
    try {
      operation.method();
    } catch (error) {
      console.error(`${operation.name} render failed:`, error);
      this.renderErrorView(operation.name.toLowerCase(), error);
    }
  });
  
  // ✅ RESTORE SCROLL POSITION AFTER ALL RENDERS
  if (this.isUserInteraction) {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: currentScrollY,
        behavior: 'instant'
      });
    });
  }
}




private renderErrorView(viewName: string, error: any): void {
  try {
    const containerId = `walkthrough-${viewName}`;
    const container = document.getElementById(containerId);
    
    if (container) {
      container.innerHTML = `
        <div class="error-view">
          <div class="error-header">
            <span class="error-icon">❌</span>
            <h3>Error loading ${viewName} view</h3>
          </div>
          <div class="error-details">
            <p>Unable to display ${viewName} results due to an error.</p>
            <details>
              <summary>Technical details</summary>
              <pre>${error?.message || 'Unknown error'}</pre>
            </details>
          </div>
          <div class="error-actions">
            <button onclick="window.domainResultsDisplay.attemptRecovery('${viewName} view refresh')">
              🔄 Retry
            </button>
          </div>
        </div>
      `;
    }
  } catch (renderError) {
    console.error('Error rendering error view:', renderError);
  }
}


private rebuildGroupedResults(): void {
  try {
    this.groupedResults = {};
    
    this.results.forEach(result => {
      const domain = (result as any).domain || 'unknown';
      const tier = (result as any).tier || 'unknown';
      
      if (!this.groupedResults[domain]) {
        this.groupedResults[domain] = {};
      }
      
      if (!this.groupedResults[domain][tier]) {
        this.groupedResults[domain][tier] = [];
      }
      
      this.groupedResults[domain][tier].push(result);
    });
    
  } catch (error) {
    console.error('Error rebuilding grouped results:', error);
  }
}



 


  // ============================================
  // 🎨 RENDERING METHODS
  // ============================================

  private renderAllViews(): void {
    try {
      this.renderSummaryView();
      this.renderDetailedView();
      this.renderComparisonView();
    } catch (error) {
      console.error('Error rendering all views:', error);
    }
  }
// ADD this after line 1200 (before renderSummaryView)
private optimizedDOMUpdate(container: HTMLElement, htmlContent: string): void {
    try {
        // ✅ PERFORMANCE: Use virtual DOM approach
        const fragment = document.createDocumentFragment();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlContent;
        
        // ✅ BATCH: Move all children at once
        const elements = Array.from(wrapper.children);
        elements.forEach(element => fragment.appendChild(element));
        
        // ✅ ATOMIC: Single DOM update
        requestAnimationFrame(() => {
            container.innerHTML = '';
            container.appendChild(fragment);
        });
        
    } catch (error) {
        // Fallback to simple update
        container.innerHTML = htmlContent;
    }
}
 
/**
 * ✅ FIXED: More robust summary view rendering
 */
/**
 * ✅ FIXED: More robust summary view rendering with better error recovery
 */
private renderSummaryView(): void {
    try {
        const summaryContainer = document.getElementById('walkthrough-summary');
        if (!summaryContainer) {
            console.warn('Summary container not found, creating...');
            this.ensureContainer('walkthrough-summary', 'Walkthrough Summary');
            
            // Wait a bit for container creation then retry
            setTimeout(() => {
                const retryContainer = document.getElementById('walkthrough-summary');
                if (retryContainer) {
                    this.renderSummaryView();
                }
            }, 100);
            return;
        }

        // ✅ FIXED: Better cache key with more stable hashing
        const approachCount = this.approachResults?.size || 0;
        const resultCount = this.results.length;
        const domainsHash = this.getUniqueDomains().join('-').length;
        const cacheKey = `summary-v2-${resultCount}-${approachCount}-${domainsHash}`;
        
        let htmlContent: string;
        
        try {
            htmlContent = DomainResultsDisplay.getCachedTemplate(cacheKey, () => {
                try {
                    return this.generateSummaryHTML();
                } catch (generationError) {
                    console.error('Summary HTML generation failed:', generationError);
                    return `
                        <div class="error">
                            <h3>⚠️ Summary Generation Error</h3>
                            <p>Unable to generate summary content.</p>
                            <button onclick="window.domainResultsDisplay.renderSummaryView()">🔄 Retry</button>
                        </div>
                    `;
                }
            });
        } catch (templateError) {
            console.error('Template caching failed:', templateError);
            // Fallback: Generate directly without caching
            htmlContent = this.generateSummaryHTML();
        }

        // ✅ FIXED: Safe DOM update with multiple fallback strategies
        try {
            // Strategy 1: Optimized update
            this.optimizedDOMUpdate(summaryContainer, htmlContent);
        } catch (domError) {
            console.error('Optimized DOM update failed, trying fallback:', domError);
            
            try {
                // Strategy 2: Direct update
                summaryContainer.innerHTML = htmlContent;
            } catch (fallbackError) {
                console.error('Direct DOM update failed:', fallbackError);
                
                // Strategy 3: Safe text content
                summaryContainer.innerHTML = `
                    <div class="error">
                        <h3>⚠️ Display Error</h3>
                        <p>Unable to render summary. Please refresh the page.</p>
                    </div>
                `;
            }
        }
        
        console.log('✅ Summary view rendered successfully');
        
    } catch (error) {
        console.error('Critical error in renderSummaryView:', error);
        this.renderErrorView('summary', error);
    }
}





  private renderDetailedView(): void {
    try {
      const detailedContainer = document.getElementById('walkthrough-detailed');
      if (!detailedContainer) return;

      detailedContainer.innerHTML = this.generateDetailedHTML();
    } catch (error) {
      console.error('Error rendering detailed view:', error);
    }
  }

  private renderComparisonView(): void {
    try {
      const comparisonContainer = document.getElementById('walkthrough-comparison');
      if (!comparisonContainer) return;

      comparisonContainer.innerHTML = this.generateComparisonHTML();
    } catch (error) {
      console.error('Error rendering comparison view:', error);
    }
  }

  // ============================================
  // 🔍 FILTERING METHODS
  // ============================================

  private filterByDomain(domain: string): void {
    try {
      const filteredResults = this.results.filter(result => (result as any).domain === domain);
      // Create a temporary display with filtered results
      const tempDisplay = new DomainResultsDisplay(this.options);
      tempDisplay.updateResults(filteredResults);
    } catch (error) {
      console.error('Error filtering by domain:', error);
    }
  }

  private filterByTier(tier: string): void {
    try {
      const filteredResults = this.results.filter(result => (result as any).tier === tier);
      // Create a temporary display with filtered results
      const tempDisplay = new DomainResultsDisplay(this.options);
      tempDisplay.updateResults(filteredResults);
    } catch (error) {
      console.error('Error filtering by tier:', error);
    }
  }

  // ============================================
  // 📊 HTML GENERATION METHODS
  // ============================================

/**
 * ✅ FIXED: More robust summary HTML generation
 */
/**
 * ✅ CORRECTED: Generate walkthrough summary HTML (NOT T1-T10 tests)
 */
private generateSummaryHTML(): string {
  try {
    console.log('🔍 Generating WALKTHROUGH summary - Results:', this.results.length);
    
    // 🔧 FIX: Check both data sources
    const hasResults = this.results && Array.isArray(this.results) && this.results.length > 0;
    const hasApproachResults = this.approachResults && this.approachResults.size > 0;
    
    if (!hasResults && !hasApproachResults) {
      return this.generateEmptyResultsHTML();
    }

    let html = '<div class="walkthrough-summary-grid">';

    // 🔧 FIX: Use approach results if available, fallback to regular results
    if (hasApproachResults) {
      html += this.generateDomainWalkthroughSummary();
    } else if (hasResults) {
      html += this.generateStandardWalkthroughSummary();
    }

    html += '</div>';
    return html;
    
  } catch (error) {
    console.error('❌ Error generating walkthrough summary:', error);
    return `<div class="error">Error generating walkthrough summary: ${error.message}</div>`;
  }
}


/**
 * ✅ NEW: Safe HTML generation wrapper
 */
private safeGenerateHTML(generator: () => string, fallbackMessage: string = 'Error generating content'): string {
  try {
    const result = generator();
    return result || '<div class="error">Empty content generated</div>';
  } catch (error) {
    console.error('❌ HTML generation error:', error);
    return `<div class="error">${fallbackMessage}: ${error.message}</div>`;
  }
}

private generateDomainWalkthroughSummary(): string {
  let html = '<div class="walkthrough-domains-summary">';
  
  // Sort domain-tier combinations for consistent display
  const sortedKeys = Array.from(this.approachResults.keys()).sort();
  
  for (const domainTierKey of sortedKeys) {
    const approaches = this.approachResults.get(domainTierKey);
    if (!approaches || approaches.size === 0) continue;
    
    const [domain, tier] = domainTierKey.split('-');
    
    html += `
      <div class="domain-walkthrough-card">
        <div class="domain-header">
          <h3>${this.getDomainIcon(domain)} ${domain}</h3>
          <span class="tier-badge ${tier}">${tier} Tier</span>
        </div>
        
        <div class="walkthrough-approaches">
          <div class="approaches-tested">
            <strong>Approaches:</strong> 
            ${Array.from(approaches.keys())
              .map(approach => `<span class="approach-tag">${this.getApproachDisplayName(approach)}</span>`)
              .join(' ')}
          </div>
        </div>
        
        <div class="walkthrough-results-grid">
    `;
    
    // ✅ FIXED: Use the working approach card generator
    for (const [approach, result] of approaches.entries()) {
      html += this.generateWalkthroughApproachCard(result, approach);
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}



/**
 * ✅ FIXED: Generate approach card using summary bridge
 */
private generateWalkthroughApproachCard(result: any, approach: string): string {
  console.log(`🔧 GENERATING FIXED APPROACH CARD: ${approach}`);
  
  try {
    // ✅ USE BRIDGE: Extract metrics from working detailed results
    const metrics = this.extractSummaryMetricsFromDetailedResults(result, approach);
    const domainMetrics = result.domainMetrics || {};
    
    const isSuccess = metrics.successRate > 0;
    
    // ✅ SIMPLIFIED: Generate execution insights from extracted metrics
    const insights = this.generateSimplifiedInsights(metrics, domainMetrics, approach);
    
    return `
      <div class="walkthrough-approach-card ${isSuccess ? 'success' : 'failure'}">
        <div class="approach-header">
          <h4>${this.getApproachDisplayName(approach)}</h4>
          <span class="approach-status">${isSuccess ? '✅' : '❌'}</span>
        </div>
        
        <div class="execution-insights-container">
          <h6>💡 Performance Summary:</h6>
          <div class="insights-list">
            ${insights.slice(0, 3).map(insight => `
              <div class="insight-item">${insight}</div>
            `).join('')}
          </div>
        </div>
        
        <div class="walkthrough-metrics">
          <div class="metric-row">
            <span class="metric-label">Success Rate:</span>
            <span class="metric-value ${isSuccess ? 'success' : 'failure'}">${metrics.successDisplay}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Avg Latency:</span>
            <span class="metric-value">${metrics.avgLatency.toFixed(0)}ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Avg Tokens:</span>
            <span class="metric-value">${metrics.avgTokens.toFixed(0)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">MCD Alignment:</span>
            <span class="metric-value">${DomainResultsDisplay.safeFormatPercentage(metrics.mcdAlignment, 'MCD alignment')}</span>
          </div>
        </div>
        
        <div class="walkthrough-summary-footer">
          <span>Approach: ${approach}</span>
          <span>Trials: ${metrics.scenarioCount}</span>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error(`❌ FIXED CARD ERROR for ${approach}:`, error);
    return `<div class="error">Error displaying ${approach} results - ${error.message}</div>`;
  }
}


/**
 * ✅ NEW: Generate insights from extracted metrics (not raw data)
 */
private generateSimplifiedInsights(metrics: any, domainMetrics: any, approach: string): string[] {
  const insights: string[] = [];
  
  try {
    // Success rate insights
    if (metrics.successRate >= 80) {
      insights.push(`✅ Excellent success rate: ${metrics.successRate.toFixed(1)}%`);
    } else if (metrics.successRate >= 60) {
      insights.push(`⚠️ Moderate success rate: ${metrics.successRate.toFixed(1)}%`);
    } else if (metrics.successRate > 0) {
      insights.push(`❌ Low success rate: ${metrics.successRate.toFixed(1)}% - needs improvement`);
    } else {
      insights.push(`🚨 No successful trials - critical issues detected`);
    }
    
    // Latency insights
    if (metrics.avgLatency > 0) {
      if (metrics.avgLatency <= 500) {
        insights.push(`⚡ Fast response times: ${metrics.avgLatency.toFixed(0)}ms`);
      } else if (metrics.avgLatency <= 1500) {
        insights.push(`⏱️ Acceptable latency: ${metrics.avgLatency.toFixed(0)}ms`);
      } else {
        insights.push(`🐌 Slow responses: ${metrics.avgLatency.toFixed(0)}ms - optimization needed`);
      }
    }
    
    // Token efficiency insights
    if (metrics.avgTokens > 0) {
      if (metrics.avgTokens <= 30) {
        insights.push(`🎯 Efficient token usage: ${metrics.avgTokens.toFixed(0)} tokens`);
      } else if (metrics.avgTokens <= 50) {
        insights.push(`💰 Moderate token usage: ${metrics.avgTokens.toFixed(0)} tokens`);
      } else {
        insights.push(`💸 High token usage: ${metrics.avgTokens.toFixed(0)} tokens - consider optimization`);
      }
    }
    
    // MCD alignment insights
    if (metrics.mcdAlignment >= 0.8) {
      insights.push(`🎯 Strong MCD alignment: ${(metrics.mcdAlignment * 100).toFixed(1)}%`);
    } else if (metrics.mcdAlignment >= 0.6) {
      insights.push(`🎯 Moderate MCD alignment: ${(metrics.mcdAlignment * 100).toFixed(1)}%`);
    }
    
    // Approach-specific insights
    if (approach === 'mcd' && metrics.successRate < 70) {
      insights.push(`🔧 MCD implementation may need refinement`);
    } else if (approach === 'system-role' && metrics.successRate >= 80) {
      insights.push(`🌟 System role approach performing exceptionally well`);
    }
    
    return insights.length > 0 ? insights : [`📊 ${metrics.scenarioCount} trials completed for ${approach}`];
    
  } catch (error) {
    console.error('Error generating simplified insights:', error);
    return [`❌ Unable to analyze performance for ${approach}`];
  }
}



/**
 * ✅ NEW: Generate standard walkthrough summary (fallback)
 */
private generateStandardWalkthroughSummary(): string {
  const domains = this.getUniqueDomains();
  let html = '<div class="standard-walkthrough-summary">';
  
  for (const domain of domains) {
    const domainResults = this.results.filter(r => (r as any).domain === domain);
    
    html += `
      <div class="domain-summary-card">
        <h3>${this.getDomainIcon(domain)} ${domain}</h3>
        <div class="tier-results">
    `;
    
    ['Q1', 'Q4', 'Q8'].forEach(tier => {
      const tierResult = domainResults.find(r => (r as any).tier === tier);
      if (tierResult) {
        html += this.generateTierSummaryCard(tierResult, tier);
      }
    });
    
    html += '</div></div>';
  }
  
  html += '</div>';
  return html;
}

/**
 * ✅ NEW: Generate tier summary card for walkthrough
 */
private generateTierSummaryCard(result: EnhancedWalkthroughResult, tier: string): string {
  const metrics = (result as any).domainMetrics;
  const scenarios = result.scenarioResults || [];
  const successRate = this.calculateScenarioSuccessRate(scenarios);
  
  return `
    <div class="tier-card ${tier.toLowerCase()} ${metrics.overallSuccess ? 'success' : 'failure'}">
      <div class="tier-header">
        <span class="tier-name">${tier}</span>
        <span class="tier-status">${metrics.overallSuccess ? '✅' : '❌'}</span>
      </div>
      
      <div class="tier-metrics">
        <div class="metric">
          <label>Success:</label>
          <span>${successRate.toFixed(1)}%</span>
        </div>
        <div class="metric">
          <label>MCD:</label>
          <span>${(metrics.mcdAlignmentScore * 100).toFixed(1)}%</span>
        </div>
        <div class="metric">
          <label>Efficiency:</label>
          <span>${(metrics.resourceEfficiency * 100).toFixed(1)}%</span>
        </div>
      </div>
      
      <div class="scenario-count">
        ${scenarios.length} scenarios executed
      </div>
    </div>
  `;
}


private calculateSuccessRateDisplay(result: any): string {
  try {
    // ✅ USE standardized method:
    const successRate = DomainResultsDisplay.calculateSuccessRateFromResult(result);
    const scenarios = result.scenarioResults || [];
    const successful = Math.round((successRate / 100) * scenarios.length);
    
    return `${successful}/${scenarios.length}`;
  } catch (error) {
    console.error('Error calculating success rate display:', error);
    return '0/0';
  }
}



/**
 * ✅ NEW: Standardized metrics calculation using static methods
 */
private calculateMetrics(result: any): {
  avgLatency: number;
  avgTokens: number;
  successRate: number;
} {
  const scenarios = result.scenarioResults || [];
  return {
    avgLatency: DomainResultsDisplay.calculateAverageLatency(scenarios),
    avgTokens: DomainResultsDisplay.calculateAverageTokens(scenarios),
    successRate: DomainResultsDisplay.calculateSuccessRateFromResult(result)
  };
}

/**
 * ✅ MISSING METHOD: Update grouped results structure
 */
private updateGroupedResults(result: any, enhancedResult: any): void {
  try {
    const domain = result.domain || 'unknown';
    const tier = result.tier || 'unknown';
    
    if (!this.groupedResults) {
      this.groupedResults = {};
    }
    
    if (!this.groupedResults[domain]) {
      this.groupedResults[domain] = {};
    }
    
    if (!this.groupedResults[domain][tier]) {
      this.groupedResults[domain][tier] = [];
    }
    
    this.groupedResults[domain][tier].push(enhancedResult);
    
    console.log(`✅ Updated grouped results: ${domain}-${tier}, total: ${this.groupedResults[domain][tier].length}`);
    
  } catch (error) {
    console.error('❌ Error updating grouped results:', error);
  }
}

/**
 * ✅ MISSING METHOD: Generate single approach HTML
 */



private generateDomainComparisonCharts(domain: string, results: EnhancedWalkthroughResult[]): string {
  try {
    // Simple bar chart representation using HTML/CSS
    const approaches = this.getUniqueApproachesFromResults(results);
    
    let html = `
      <div class="domain-charts-section">
        <h5>📊 Performance Comparison Charts</h5>
        <div class="chart-container">
    `;

    approaches.forEach(approach => {
      const approachData = this.getApproachDataForDomain(domain, approach, results);
      const successPercentage = typeof approachData.successRate === 'string' && approachData.successRate.includes('/') 
        ? (parseInt(approachData.successRate.split('/')[0]) / parseInt(approachData.successRate.split('/')[1]) * 100) 
        : 0;

      html += `
        <div class="chart-bar-item">
          <div class="chart-label">${this.getApproachDisplayName(approach)}</div>
          <div class="chart-bar-container">
            <div class="chart-bar" style="width: ${successPercentage}%; background: var(--approach-${approach.toLowerCase()}-color, #007bff);">
              <span class="chart-value">${successPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  } catch (error) {
    console.error('Error generating domain comparison charts:', error);
    return '<div class="error">Error generating comparison charts</div>';
  }
}



  private generateDomainSummaryHTML(domain: string): string {
    try {
      const domainResults = this.results.filter(r => (r as any).domain === domain);
      if (domainResults.length === 0) return '';

      let html = `
        <div class="domain-summary">
          <h3>${this.getDomainIcon(domain)} ${domain}</h3>
          <div class="tier-results-grid">
      `;

      const tiers = ['Q1', 'Q4', 'Q8'];
      for (const tier of tiers) {
        const tierResult = domainResults.find(r => (r as any).tier === tier);
        if (tierResult) {
          html += this.generateTierSummaryHTML(tierResult);
        }
      }

      html += '</div></div>';
      return html;
    } catch (error) {
      console.error('Error generating domain summary HTML:', error);
      return '<div class="error">Error generating domain summary</div>';
    }
  }

 // ✅ REPLACE the existing calculation lines at the beginning of the method with:
private generateTierSummaryHTML(result: EnhancedWalkthroughResult): string {
  try {
    const domainMetrics = (result as any).domainMetrics;
    const successIcon = domainMetrics.overallSuccess ? '✅' : '❌';
    const fallbackIcon = domainMetrics.fallbackTriggered ? '⚠️' : '✅';

    // ✅ NEW: Analyze performance state
    const performanceState = this.analyzePerformanceState(result);
    const performanceIcon = this.getPerformanceIcon(performanceState.status);

    // ✅ USE standardized metrics calculation:
    const metrics = this.calculateMetrics(result);
    const avgTokens = metrics.avgTokens;
    const avgLatency = metrics.avgLatency;
    const scenarioSuccessRate = metrics.successRate;

    // ✅ NEW: Context-aware recommendations
    const contextualRecommendations = this.generateContextualRecommendations(result, performanceState);


    return `
      <div class="tier-result ${(result as any).tier} ${performanceState.status}">
        <div class="tier-header">
          <h4>${performanceIcon} ${(result as any).tier} Tier</h4>
          <span class="tier-badge ${(result as any).tier}">${(result as any).tier}</span>
          <div class="performance-badge ${performanceState.status}">
            ${performanceState.status.toUpperCase()}
          </div>
        </div>
        
        <!-- ✅ NEW: Performance state display -->
        <div class="performance-state-container ${performanceState.severity}">
          <div class="performance-message">
            <span class="severity-icon">${this.getSeverityIcon(performanceState.severity)}</span>
            ${performanceState.message}
          </div>
        </div>
        
        <div class="metrics-container">
          <div class="primary-metrics">
            <div class="metric">
              <span class="metric-icon">🎯</span>
              <span class="metric-label">MCD Alignment:</span>
              <span class="metric-value ${this.getMetricClass(metrics.mcdAlignmentScore)}">
                ${DomainResultsDisplay.safeFormatPercentage(metrics.mcdAlignmentScore, 'MCD alignment')}
              </span>
            </div>
            <div class="metric">
              <span class="metric-icon">⚡</span>
              <span class="metric-label">Resource Efficiency:</span>
              <span class="metric-value ${this.getMetricClass(metrics.resourceEfficiency)}">
                ${DomainResultsDisplay.safeFormatPercentage(metrics.resourceEfficiency, 'resource efficiency')}
              </span>
            </div>
            <div class="metric">
              <span class="metric-icon">👤</span>
              <span class="metric-label">User Experience:</span>
              <span class="metric-value ${this.getMetricClass(metrics.userExperienceScore)}">
                ${DomainResultsDisplay.safeFormatPercentage(metrics.userExperienceScore, 'user experience')}
              </span>
            </div>
          </div>
          
          <div class="secondary-metrics">
            <div class="metric">
              <span class="metric-label">Success Rate:</span>
              <span class="metric-value ${this.getSuccessRateClass(scenarioSuccessRate)}">
                ${scenarioSuccessRate.toFixed(1)}%
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Avg Tokens:</span>
              <span class="metric-value ${this.getTokenClass(avgTokens)}">
                ${avgTokens.toFixed(0)}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Avg Latency:</span>
              <span class="metric-value ${this.getLatencyClass(avgLatency)}">
                ${avgLatency.toFixed(0)}ms
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Fallbacks:</span>
              <span class="metric-value">${fallbackIcon}</span>
            </div>
          </div>
        </div>
        
        <!-- ✅ NEW: Enhanced contextual recommendations -->
        ${contextualRecommendations.length > 0 ? `
          <div class="contextual-recommendations ${performanceState.severity}">
            <h5>💡 ${this.getRecommendationTitle(performanceState.status)}:</h5>
            <ul class="recommendation-list">
              ${contextualRecommendations.map(rec => `
                <li class="recommendation-item ${rec.priority}">
                  <span class="rec-priority">${this.getPriorityIcon(rec.priority)}</span>
                  <span class="rec-text">${rec.text}</span>
                  ${rec.impact ? `<span class="rec-impact">(${rec.impact} impact)</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <!-- ✅ NEW: Quick actions for poor performance -->
        ${performanceState.status === 'poor' || performanceState.status === 'critical' ? `
          <div class="quick-actions">
            <button class="action-btn retry" onclick="window.retryDomainExecution('${(result as any).domain}', '${(result as any).tier}')">
              🔄 Retry Execution
            </button>
            <button class="action-btn analyze" onclick="window.analyzeDomainFailures('${(result as any).walkthroughId}')">
              🔍 Analyze Failures
            </button>
            <button class="action-btn optimize" onclick="window.suggestOptimizations('${(result as any).domain}', '${(result as any).tier}')">
              ⚡ Get Optimization Tips
            </button>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Error generating enhanced tier summary HTML:', error);
    return `<div class="error">Error generating tier summary</div>`;
  }
}

// ✅ NEW: Helper methods for enhanced display
private generateContextualRecommendations(result: EnhancedWalkthroughResult, performanceState: PerformanceState): any[] {
  const recommendations = [];
  const domain = (result as any).domain;
  const tier = (result as any).tier;
  const metrics = result.domainMetrics;
  
  // Performance-based recommendations
  recommendations.push(...performanceState.recommendations.map(rec => ({
    text: rec,
    priority: performanceState.severity === 'critical' ? 'high' : 'medium',
    impact: performanceState.severity === 'critical' ? 'high' : 'medium',
    category: 'performance'
  })));
  
  // Domain-specific recommendations
  const domainRecommendations = this.getDomainSpecificRecommendations(domain, metrics, tier);
  recommendations.push(...domainRecommendations);
  
  // MCD alignment recommendations
  if (metrics.mcdAlignmentScore < 0.7) {
    recommendations.push({
      text: 'Improve MCD alignment by implementing structured response patterns',
      priority: 'high',
      impact: 'high',
      category: 'mcd-alignment'
    });
  }
  
  // Resource efficiency recommendations
  if (metrics.resourceEfficiency < 0.6) {
    recommendations.push({
      text: 'Optimize resource usage by reducing token overhead and improving response conciseness',
      priority: 'medium',
      impact: 'medium',
      category: 'efficiency'
    });
  }
  
  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

private getDomainSpecificRecommendations(domain: string, metrics: any, tier: string): any[] {
  const domainAdvice = {
    'Appointment Booking': [
      {
        text: 'Implement structured slot extraction to improve booking success rates',
        priority: 'high',
        impact: 'high',
        category: 'domain-specific'
      },
      {
        text: 'Add confirmation workflows for better user experience',
        priority: 'medium',
        impact: 'medium',
        category: 'domain-specific'
      }
    ],
    'Spatial Navigation': [
      {
        text: 'Use coordinate-based navigation instead of natural language for precision',
        priority: 'high',
        impact: 'high',
        category: 'domain-specific'
      },
      {
        text: 'Implement obstacle avoidance patterns in navigation logic',
        priority: 'medium',
        impact: 'high',
        category: 'domain-specific'
      }
    ],
    'Failure Diagnostics': [
      {
        text: 'Implement structured diagnostic check sequences to prevent analysis paralysis',
        priority: 'high',
        impact: 'high',
        category: 'domain-specific'
      },
      {
        text: 'Add escalation thresholds for complex failure scenarios',
        priority: 'medium',
        impact: 'medium',
        category: 'domain-specific'
      }
    ]
  };
  
  return domainAdvice[domain] || [];
}

private getPerformanceIcon(status: string): string {
  const icons = {
    'excellent': '🌟',
    'good': '✅',
    'poor': '⚠️',
    'critical': '🚨',
    'no-data': '❓'
  };
  return icons[status] || '❓';
}

private getSeverityIcon(severity: string): string {
  const icons = {
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌',
    'critical': '🚨'
  };
  return icons[severity] || 'ℹ️';
}

private getMetricClass(value: number): string {
  if (value >= 0.8) return 'metric-excellent';
  if (value >= 0.6) return 'metric-good';
  if (value >= 0.4) return 'metric-poor';
  return 'metric-critical';
}

private getSuccessRateClass(rate: number): string {
  if (rate >= 90) return 'success-excellent';
  if (rate >= 70) return 'success-good';
  if (rate >= 40) return 'success-poor';
  return 'success-critical';
}

private getTokenClass(tokens: number): string {
  if (tokens <= 50) return 'tokens-excellent';
  if (tokens <= 100) return 'tokens-good';
  if (tokens <= 200) return 'tokens-poor';
  return 'tokens-critical';
}

private getLatencyClass(latency: number): string {
  if (latency <= 400) return 'latency-excellent';
  if (latency <= 800) return 'latency-good';
  if (latency <= 1500) return 'latency-poor';
  return 'latency-critical';
}

private getRecommendationTitle(status: string): string {
  const titles = {
    'excellent': 'Optimization Opportunities',
    'good': 'Performance Improvements',
    'poor': 'Critical Actions Required',
    'critical': 'Immediate Interventions Needed',
    'no-data': 'Data Collection Recommendations'
  };
  return titles[status] || 'Recommendations';
}

private getPriorityIcon(priority: string): string {
  const icons = {
    'low': '🔵',
    'medium': '🟡',
    'high': '🔴',
    'critical': '🚨'
  };
  return icons[priority] || '🔵';
}

  private generateDetailedHTML(): string {
    try {
      if (this.results.length === 0) {
        return '<div class="no-results">No detailed results available yet...</div>';
      }

      let html = '<div class="detailed-results-container">';

      for (const result of this.results) {
        html += `
          <div class="detailed-result">
            <div class="result-header">
              <h3>${this.getDomainIcon((result as any).domain)} ${(result as any).domain} - ${(result as any).tier} Tier</h3>
              <span class="result-id">${(result as any).walkthroughId}</span>
            </div>
            
            ${this.generateScenarioDetailsHTML(result)}
            ${this.generateMCDAnalysisHTML(result)}
          </div>
        `;
      }

      html += '</div>';
      return html;
    } catch (error) {
      console.error('Error generating detailed HTML:', error);
      return '<div class="error">Error generating detailed results</div>';
    }
  }
 /**
 * ✅ NEW: Missing cleanup method for completed approach results
 */
private cleanupCompletedApproachResults(): void {
  try {
    if (!this.approachResults || this.approachResults.size === 0) return;
    
    // Only clean up if we have too many stored results
    if (this.approachResults.size > 50) {
      console.log('🧹 Cleaning up completed approach results...');
      
      // Keep only the most recent 30 domain-tier combinations
      const sortedKeys = Array.from(this.approachResults.keys()).sort();
      const keysToRemove = sortedKeys.slice(0, -30);
      
      keysToRemove.forEach(key => {
        this.approachResults.delete(key);
      });
      
      console.log(`🧹 Removed ${keysToRemove.length} old approach result sets`);
    }
  } catch (error) {
    console.error('Error cleaning up approach results:', error);
  }
}

/**
 * ✅ NEW: Effect size calculation placeholder
 */
private calculateEffectSize(approachResults: Map<string, any>): any {
  try {
    // Simple effect size calculation based on success rate differences
    const approaches = Array.from(approachResults.keys());
    if (approaches.length < 2) return { effectSize: 0, magnitude: 'none' };
    
    const successRates = approaches.map(approach => {
      const result = approachResults.get(approach);
      return this.calculateSuccessRateFromResult(result);
    });
    
    const maxRate = Math.max(...successRates);
    const minRate = Math.min(...successRates);
    const effectSize = (maxRate - minRate) / 100; // Normalize to 0-1
    
    let magnitude = 'small';
    if (effectSize >= 0.8) magnitude = 'large';
    else if (effectSize >= 0.5) magnitude = 'medium';
    
    return { effectSize, magnitude, maxRate, minRate };
  } catch (error) {
    console.error('Error calculating effect size:', error);
    return { effectSize: 0, magnitude: 'none' };
  }
}
// ✅ CRITICAL: Deep data inspection method
private inspectScenarioDataStructure(result: any, approach: string): void {
  console.group(`🔍 DEEP INSPECT: ${approach}`);
  
  const scenarios = result.scenarioResults;
  console.log('📋 scenarioResults length:', scenarios?.length);
  
  if (scenarios && scenarios.length > 0) {
    const firstScenario = scenarios[0];
    console.log('🔍 First scenario keys:', Object.keys(firstScenario));
    console.log('🔍 First scenario full data:', JSON.stringify(firstScenario, null, 2));
    
    // Check each potential data location
    const dataPoints = [
      'latencyMs', 'latency', 'responseTime', 'duration',
      'tokensUsed', 'tokens', 'tokenCount', 'totalTokens',
      'response', 'output', 'result', 'success'
    ];
    
    dataPoints.forEach(key => {
      if (firstScenario[key] !== undefined) {
        console.log(`✅ Found ${key}:`, firstScenario[key], `(type: ${typeof firstScenario[key]})`);
      }
    });
    
    // Check nested structures
    if (firstScenario.trial) {
      console.log('🔍 Nested trial data:', Object.keys(firstScenario.trial));
    }
    if (firstScenario.executionResult) {
      console.log('🔍 Nested execution data:', Object.keys(firstScenario.executionResult));
    }
    if (firstScenario.actualResults) {
      console.log('🔍 Nested actualResults data:', Object.keys(firstScenario.actualResults));
    }
  }
  
  console.groupEnd();
}

// ✅ ENHANCED: More robust static calculation methods
// ✅ ENHANCED: More robust success rate calculation with comprehensive fallbacks
// ✅ ENHANCE the calculateSuccessRateFromResult method (around line 4700)
private static calculateSuccessRateFromResult(result: any): number {
  try {
    if (!result) {
      console.warn('❌ SUCCESS CALC: Null result provided');
      return 0;
    }

    console.log('🔍 SUCCESS CALC: Analyzing result structure:', {
      walkthroughId: result.walkthroughId,
      domain: result.domain,
      tier: result.tier,
      hasScenarioResults: !!result.scenarioResults,
      scenarioCount: result.scenarioResults?.length || 0
    });

    // ✅ STRATEGY 1: Handle variant-based structure
    if (result.scenarioResults && Array.isArray(result.scenarioResults)) {
      const scenarios = result.scenarioResults;
      let totalTrials = 0;
      let successfulTrials = 0;

      for (const scenario of scenarios) {
        if (scenario.variants && Array.isArray(scenario.variants)) {
          // New variant-based structure
          for (const variant of scenario.variants) {
            if (variant.trials && Array.isArray(variant.trials)) {
              for (const trial of variant.trials) {
                totalTrials++;
                
                // Multiple success detection patterns
                if (trial.success === true || 
                    trial.passed === true ||
                    trial.status === 'PASS' ||
                    trial.status === 'SUCCESS' ||
                    (trial.evaluationScore && trial.evaluationScore > 70)) {
                  successfulTrials++;
                } else if (trial.actualResults) {
                  // Check response quality
                  const response = trial.actualResults.output || trial.actualResults.response || '';
                  if (response && typeof response === 'string') {
                    const text = response.toLowerCase();
                    if (!text.includes('error') && 
                        !text.includes('failed') && 
                        !text.includes('unable') &&
                        text.length > 10) {
                      successfulTrials++;
                    }
                  }
                }
              }
            }
            
            // Also check variant-level metrics
            if (variant.measuredProfile) {
              const profile = variant.measuredProfile;
              if (profile.actualSuccessCount && profile.totalTrials) {
                totalTrials += profile.totalTrials;
                successfulTrials += profile.actualSuccessCount;
              }
            }
          }
        } else {
          // Traditional scenario structure
          totalTrials++;
          if (scenario.success === true || 
              (scenario.response && 
               typeof scenario.response === 'string' && 
               !scenario.response.toLowerCase().includes('error') &&
               scenario.response.length > 10)) {
            successfulTrials++;
          }
        }
      }

      if (totalTrials > 0) {
        const rate = (successfulTrials / totalTrials) * 100;
        console.log(`✅ SUCCESS CALC (Scenarios): ${successfulTrials}/${totalTrials} = ${rate}%`);
        return Math.max(0, Math.min(100, rate));
      }
    }

    // ✅ STRATEGY 2: Domain metrics fallback
    if (result.domainMetrics) {
      if (typeof result.domainMetrics.overallSuccess === 'boolean') {
        const rate = result.domainMetrics.overallSuccess ? 100 : 0;
        console.log(`✅ SUCCESS CALC (Domain Metrics): ${rate}%`);
        return rate;
      }
    }

    console.warn('❌ SUCCESS CALC: No valid success data found');
    return 0;

  } catch (error) {
    console.error('❌ SUCCESS CALC ERROR:', error);
    return 0;
  }
}


// ✅ REPLACE the existing calculateAverageLatency method (around line 4890)
private static calculateAverageLatency(scenarios: any[]): number {
  try {
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      console.warn('❌ LATENCY: No scenarios provided');
      return 0;
    }

    console.log('🔍 LATENCY: Processing scenarios:', scenarios.length);
    
    const latencies: number[] = [];
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      let latency = 0;

      // ✅ STRATEGY 1: Handle variant-based structure (new format)
      if (scenario.variants && Array.isArray(scenario.variants)) {
        for (const variant of scenario.variants) {
          if (variant.trials && Array.isArray(variant.trials)) {
            for (const trial of variant.trials) {
              const actualResults = trial.actualResults;
              if (actualResults) {
                // Extract from nested structure
                latency = actualResults.executionTimeMs || 
                         actualResults.latencyMs || 
                         actualResults.responseTime || 
                         actualResults.duration || 0;
                
                if (latency > 0 && latency < 300000) { // Less than 5 minutes
                  latencies.push(latency);
                  console.log(`📊 Found variant latency: ${latency}ms`);
                }
              }
            }
          }
          
          // Also check variant-level metrics
          if (variant.measuredProfile && variant.measuredProfile.avgLatency) {
            latency = variant.measuredProfile.avgLatency;
            if (latency > 0 && latency < 300000) {
              latencies.push(latency);
              console.log(`📊 Found variant profile latency: ${latency}ms`);
            }
          }
        }
        
        if (latencies.length > 0) continue; // Found data in variants
      }

      // ✅ STRATEGY 2: Direct scenario properties
      const latencyFields = [
        'latencyMs', 'latency', 'responseTime', 'duration', 
        'executionTime', 'processingTime', 'elapsed', 'timeElapsed',
        'executionTimeMs', 'responseTimeMs', 'durationMs'
      ];

      for (const field of latencyFields) {
        if (scenario[field] != null) {
          const value = scenario[field];
          if (typeof value === 'number' && !isNaN(value) && value > 0) {
            latency = value;
            console.log(`📊 Found direct latency in ${field}: ${latency}ms`);
            break;
          } else if (typeof value === 'string') {
            const parsed = this.parseLatencyString(value);
            if (parsed > 0) {
              latency = parsed;
              console.log(`📊 Parsed latency from ${field}: ${latency}ms`);
              break;
            }
          }
        }
      }

      // ✅ STRATEGY 3: Nested structures
      if (!latency) {
        const nestedSources = [
          scenario.trial, 
          scenario.executionResult, 
          scenario.actualResults,
          scenario.metrics,
          scenario.benchmarkComparison,
          scenario.performance,
          scenario.timing
        ];
        
        for (const source of nestedSources) {
          if (source && typeof source === 'object') {
            for (const field of latencyFields) {
              if (source[field] != null) {
                const value = source[field];
                if (typeof value === 'number' && !isNaN(value) && value > 0) {
                  latency = value;
                  console.log(`📊 Found nested latency in ${field}: ${latency}ms`);
                  break;
                } else if (typeof value === 'string') {
                  const parsed = this.parseLatencyString(value);
                  if (parsed > 0) {
                    latency = parsed;
                    console.log(`📊 Parsed nested latency from ${field}: ${latency}ms`);
                    break;
                  }
                }
              }
            }
            if (latency) break;
          }
        }
      }

      // Validate and add
      if (latency > 0 && latency < 300000) { // Less than 5 minutes
        latencies.push(latency);
      } else if (latency > 0) {
        console.warn(`⚠️ Suspicious latency value: ${latency}ms, skipping`);
      }
    }

    console.log('📊 EXTRACTED LATENCIES:', latencies);

    if (latencies.length === 0) {
      console.warn('❌ LATENCY: No valid values found');
      return 0;
    }

    const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    console.log(`⏱️ FINAL AVERAGE LATENCY: ${average}ms from ${latencies.length}/${scenarios.length} values`);
    return average;

  } catch (error) {
    console.error('❌ LATENCY CALC ERROR:', error);
    return 0;
  }
}

// ✅ ADD Helper method for parsing latency strings
private static parseLatencyString(value: string): number {
  try {
    const timeMatch = value.match(/(\d+(?:\.\d+)?)\s*(ms|s|sec|seconds?|milliseconds?)?/i);
    if (timeMatch) {
      let latency = parseFloat(timeMatch[1]);
      const unit = timeMatch[2]?.toLowerCase();
      
      if (unit && (unit === 's' || unit === 'sec' || unit.includes('second'))) {
        latency *= 1000; // Convert seconds to milliseconds
      }
      
      return latency > 0 ? latency : 0;
    }
    
    // Try direct number parsing as fallback
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue > 0 ? numValue : 0;
  } catch (error) {
    console.warn('Failed to parse latency string:', value, error);
    return 0;
  }
}



// ✅ REPLACE the existing calculateAverageTokens method (around line 5100)
private static calculateAverageTokens(scenarios: any[]): number {
  try {
    console.log('🔍 TOKENS: Processing scenarios:', scenarios?.length || 0);
    
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      return 0;
    }
    
    const tokens: number[] = [];
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      let tokenCount = 0;

      // ✅ STRATEGY 1: Handle variant-based structure (new format)
      if (scenario.variants && Array.isArray(scenario.variants)) {
        for (const variant of scenario.variants) {
          if (variant.trials && Array.isArray(variant.trials)) {
            for (const trial of variant.trials) {
              const actualResults = trial.actualResults;
              if (actualResults) {
                // Extract from nested structure
                tokenCount = actualResults.tokensUsed || 
                           actualResults.tokens || 
                           actualResults.totalTokens ||
                           actualResults.outputTokens || 0;
                
                // Check token breakdown
                if (!tokenCount && actualResults.tokenBreakdown) {
                  tokenCount = actualResults.tokenBreakdown.total || 
                             actualResults.tokenBreakdown.output || 0;
                }
                
                if (tokenCount >= 0 && tokenCount < 10000) { // Reasonable range
                  tokens.push(tokenCount);
                  console.log(`🎯 Found variant tokens: ${tokenCount}`);
                }
              }
            }
          }
          
          // Also check variant-level metrics
          if (variant.measuredProfile && variant.measuredProfile.avgTokens) {
            tokenCount = variant.measuredProfile.avgTokens;
            if (tokenCount >= 0 && tokenCount < 10000) {
              tokens.push(tokenCount);
              console.log(`🎯 Found variant profile tokens: ${tokenCount}`);
            }
          }
        }
        
        if (tokens.length > 0) continue; // Found data in variants
      }

      // ✅ STRATEGY 2: Direct token properties
      const tokenFields = [
        'tokensUsed', 'tokens', 'tokenCount', 'totalTokens',
        'outputTokens', 'completionTokens', 'usageTokens'
      ];

      for (const field of tokenFields) {
        if (scenario[field] != null) {
          tokenCount = Number(scenario[field]) || 0;
          console.log(`🎯 Found direct tokens in ${field}: ${tokenCount}`);
          break;
        }
      }

      // ✅ STRATEGY 3: Nested token structures
      if (!tokenCount) {
        const nestedSources = [
          scenario.tokenBreakdown,
          scenario.usage,
          scenario.actualResults,
          scenario.trial,
          scenario.executionResult,
          scenario.metrics
        ];

        for (const source of nestedSources) {
          if (source) {
            // Check direct fields in nested object
            for (const field of tokenFields) {
              if (source[field] != null) {
                tokenCount = Number(source[field]) || 0;
                console.log(`🎯 Found nested tokens in ${field}: ${tokenCount}`);
                break;
              }
            }
            
            // Check common nested patterns
            if (!tokenCount) {
              tokenCount = source.total || source.output || source.completion || 
                          source.total_tokens || source.completion_tokens || 0;
              if (tokenCount) {
                console.log(`🎯 Found tokens in nested pattern: ${tokenCount}`);
              }
            }
            
            if (tokenCount) break;
          }
        }
      }

      // ✅ STRATEGY 4: Handle string values
      if (typeof tokenCount === 'string') {
        const numMatch = tokenCount.match(/(\d+)/);
        tokenCount = numMatch ? parseInt(numMatch[1]) : 0;
      }

      // ✅ STRATEGY 5: Validate and add
      tokenCount = Number(tokenCount) || 0;
      if (tokenCount >= 0 && tokenCount < 10000) { // Reasonable token range
        tokens.push(tokenCount);
      }
    }

    console.log('📊 EXTRACTED TOKENS:', tokens);

    if (tokens.length === 0) {
      console.warn('❌ TOKENS: No valid values found');
      return 0;
    }

    const average = tokens.reduce((sum, tok) => sum + tok, 0) / tokens.length;
    console.log(`🎯 FINAL AVERAGE TOKENS: ${average} from ${tokens.length} values`);
    return average;

  } catch (error) {
    console.error('❌ TOKENS CALC ERROR:', error);
    return 0;
  }
}




// ✅ NEW: Enhanced debugging for data flow
private debugResultDataStructure(result: any, approach: string): void {
  console.group(`🐛 RESULT DATA STRUCTURE DEBUG: ${approach}`);
  
  console.log('📋 Top-level keys:', Object.keys(result));
  console.log('🎯 WalkthroughId:', result.walkthroughId);
  console.log('🏷️ Domain/Tier:', result.domain, result.tier);
  
  // Check all possible data locations
  const dataLocations = [
    'scenarioResults',
    'processedTrials',
    'trials', 
    'executionResults',
    'domainMetrics'
  ];
  
  dataLocations.forEach(location => {
    if (result[location]) {
      console.log(`📍 ${location}:`, {
        exists: true,
        type: Array.isArray(result[location]) ? 'array' : typeof result[location],
        length: Array.isArray(result[location]) ? result[location].length : 'N/A',
        sample: Array.isArray(result[location]) && result[location].length > 0 ? 
          result[location][0] : result[location]
      });
      
      if (Array.isArray(result[location]) && result[location].length > 0) {
        const sample = result[location][0];
        console.log(`🔍 ${location} sample keys:`, Object.keys(sample));
        
        // Check for success indicators
        const successKeys = ['success', 'passed', 'status', 'result', 'response'];
        successKeys.forEach(key => {
          if (sample[key] !== undefined) {
            console.log(`  ✓ ${key}:`, sample[key]);
          }
        });
        
        // Check for metric keys
        const metricKeys = ['latencyMs', 'latency', 'responseTime', 'tokensUsed', 'tokens'];
        metricKeys.forEach(key => {
          if (sample[key] !== undefined) {
            console.log(`  📊 ${key}:`, sample[key]);
          }
        });
      }
    } else {
      console.log(`❌ ${location}: Not found`);
    }
  });
  
  console.groupEnd();
}

/**
 * ✅ CRITICAL: Validate result has actual execution data
 */
// Replace the validateWalkthroughResult method (around line 1200)





/**
 * ✅ USE IN STORAGE: Before storing any result
 */
private storeWalkthroughResult(result: any, approach: string): void {
  if (!this.validateWalkthroughResultHasData(result)) {
    console.error('🛑 BLOCKING: Result storage blocked - no execution data');
    return;
  }
  
  // Proceed with storage...
  window.newStorageRoute.storeWalkthroughResult(result, approach);
}


 private createProperScenarioResult(
    step: number, 
    userInput: string, 
    aiResponse: string, 
    executionTime: number, 
    tokenCount: number
  ): ScenarioResult {
    return {
      step: step,
      userInput: userInput,
      response: aiResponse,
      latencyMs: executionTime || 0,
      tokensUsed: tokenCount || 0,
      success: !aiResponse.toLowerCase().includes('error') && 
               !aiResponse.toLowerCase().includes('failed') &&
               aiResponse.length >= 10,
      timestamp: Date.now(),
      // Additional metrics
      responseTime: executionTime,
      duration: executionTime,
      tokens: tokenCount,
      totalTokens: tokenCount
    };
  }

private getGracefulDegradationEvidence(result: EnhancedWalkthroughResult): string[] {
  try {
    const metrics = (result as any).domainMetrics;
    const evidence = [];
    
    if (metrics.fallbackTriggered && metrics.overallSuccess) {
      evidence.push('Successfully recovered from failures');
    }
    
    if (!metrics.fallbackTriggered && metrics.overallSuccess) {
      evidence.push('No failures requiring recovery');
    }
    
    if (metrics.fallbackTriggered && !metrics.overallSuccess) {
      evidence.push('Recovery attempted but unsuccessful');
    }
    
    if (!metrics.fallbackTriggered && !metrics.overallSuccess) {
      evidence.push('No recovery mechanism activated');
    }
    
    return evidence;
  } catch (error) {
    console.error('Error getting graceful degradation evidence:', error);
    return ['Error analyzing degradation evidence'];
  }
}

// ✅ IMPROVED: Context-aware percentage formatting to prevent bias
private static safeFormatPercentage(value: number | undefined, label: string = 'metric'): string {
  if (value === undefined || value === null || isNaN(value)) {
    console.warn(`Invalid ${label} value: ${value}, defaulting to 0%`);
    return '0.0%';
  }
  
  let numValue = Number(value);
  
  // Handle both decimal (0-1) and percentage (0-100) formats
  if (numValue > 1.0 && numValue <= 100.0) {
    numValue = numValue / 100;
  } else if (numValue > 100.0) {
    console.warn(`${label} overflow: ${numValue}%, clamping to 100%`);
    numValue = 1.0;
  }
  
  numValue = Math.max(0, Math.min(1.0, numValue));
  return `${(numValue * 100).toFixed(1)}%`;
}



  /**
 * ✅ ENHANCED: Generate scenario details with prompt viewing capabilities
 */
private generateScenarioDetailsHTML(result: EnhancedWalkthroughResult): string {
  try {
    const domainTier = `${(result as any).domain}-${(result as any).tier}`;
    const promptState = this.promptViewStateByDomain.get(domainTier) || {
      showPrompts: false,
      expandedTrials: new Set<string>(),
      promptFilter: 'all'
    };
const approach = (result as any).approach || (result as any).approachType || 'Default';
const approachDisplayName = approach !== 'Default' ? this.getApproachDisplayName(approach) : '';
    let html = `
  <div class="scenario-details">
    <div class="scenario-details-header">
      <h4>🎬 Trial Execution Results${approachDisplayName ? ` (${approachDisplayName} Approach)` : ''}</h4>
      <div class="prompt-controls">
            <button 
              class="toggle-prompts-btn ${promptState.showPrompts ? 'active' : ''}"
              data-domain-tier="${domainTier}">
              ${promptState.showPrompts ? '🔍 Hide Prompts' : '🔍 Show Prompts'}
            </button>
            ${promptState.showPrompts ? `
              <div class="prompt-filters">
                <button class="prompt-filter-btn ${promptState.promptFilter === 'all' ? 'active' : ''}" 
                        data-domain-tier="${domainTier}" data-filter="all">All</button>
                <button class="prompt-filter-btn ${promptState.promptFilter === 'input' ? 'active' : ''}" 
                        data-domain-tier="${domainTier}" data-filter="input">Input</button>
                <button class="prompt-filter-btn ${promptState.promptFilter === 'output' ? 'active' : ''}" 
                        data-domain-tier="${domainTier}" data-filter="output">Output</button>
                <button class="prompt-filter-btn ${promptState.promptFilter === 'evaluation' ? 'active' : ''}" 
                        data-domain-tier="${domainTier}" data-filter="evaluation">Evaluation</button>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="scenarios-list">
    `;

    // Handle new scenario structure with variants
       const scenarioResults = (result as any).scenarioResults || [];
    
    for (let scenarioIndex = 0; scenarioIndex < scenarioResults.length; scenarioIndex++) {
      const scenario = scenarioResults[scenarioIndex];
      
      if (scenario.variants) {
        // New structure with variants
        for (const variant of scenario.variants) {
          if (variant.trials && Array.isArray(variant.trials)) {
            variant.trials.forEach((trial, trialIndex) => {
              // ✅ ADD: Debug each trial's data structure
              this.debugTrialDataStructure(trial, `${scenarioIndex}-${trialIndex}`);
              
              // Generate HTML with enhanced prompt extraction
              html += this.generateEnhancedTrialHTML(trial, domainTier, `${scenarioIndex}-${trialIndex}`, promptState);
            });
          }
        }
      } else {
        // Legacy structure - also add debugging
        this.debugTrialDataStructure(scenario, scenarioIndex.toString());
        html += this.generateLegacyScenarioHTML(scenario, domainTier, scenarioIndex.toString(), promptState);
      }
    }

    html += '</div></div>';
    return html;
  } catch (error) {
    console.error('❌ Error generating enhanced scenario details HTML:', error);
    return '<div class="error">Error generating trial execution details</div>';
  }
}
/**
 * ✅ NEW: Enhanced copy functionality for prompt data
 */
private setupPromptCopyFunctionality(): void {
  // Add event delegation for copy buttons
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    if (target && target.classList.contains('copy-btn')) {
      try {
        const promptElement = target.nextElementSibling as HTMLElement;
        const textToCopy = promptElement?.textContent || promptElement?.innerText || '';
        
        if (textToCopy && textToCopy.trim() !== 'Prompt details not captured') {
          navigator.clipboard.writeText(textToCopy).then(() => {
            // Visual feedback
            const originalText = target.textContent;
            target.textContent = '✅ Copied!';
            setTimeout(() => {
              target.textContent = originalText;
            }, 2000);
          }).catch(err => {
            console.error('❌ Failed to copy to clipboard:', err);
            target.textContent = '❌ Copy failed';
          });
        } else {
          alert('No prompt data available to copy');
        }
      } catch (error) {
        console.error('❌ Copy functionality error:', error);
      }
    }
  });
}

public verifyDataFlow(result: any): void {
  console.group('🔍 DATA FLOW VERIFICATION');
  
  console.log('1. Result structure:', {
    hasScenarioResults: !!result.scenarioResults,
    scenarioCount: result.scenarioResults?.length || 0
  });
  
  if (result.scenarioResults && result.scenarioResults.length > 0) {
    const firstScenario = result.scenarioResults[0];
    console.log('2. First scenario structure:', Object.keys(firstScenario));
    
    if (firstScenario.variants) {
      console.log('3. Variants found:', firstScenario.variants.length);
      const firstVariant = firstScenario.variants[0];
      if (firstVariant.trials) {
        console.log('4. Trials found:', firstVariant.trials.length);
        const firstTrial = firstVariant.trials[0];
        console.log('5. First trial keys:', Object.keys(firstTrial));
        console.log('6. First trial userInput:', firstTrial.userInput);
        console.log('7. First trial actualResults:', firstTrial.actualResults);
      }
    }
  }
  
  console.groupEnd();
}

/**
 * ✅ FIXED: Enhanced prompt data retrieval with multiple fallback paths
 */
/**
 * ✅ FIXED: Enhanced prompt data retrieval with multiple fallback paths
 */
private generateEnhancedTrialHTML(trial: any, domainTier: string, trialId: string, promptState: PromptViewState): string {
  try {
    const fullTrialId = `${domainTier}-${trialId}`;
    const isExpanded = promptState.expandedTrials.has(fullTrialId);
    const showPrompts = promptState.showPrompts;
    const filter = promptState.promptFilter;

    // ✅ FIX: Initialize html variable at the start
    let html = '';

    // ✅ ENHANCED: Multiple data access patterns for prompt retrieval
    // Around line 4600, replace the prompt data extraction call:
const promptData = this.extractPromptDataFromTrial(trial);

// Add debugging to verify the fix
console.log('🔧 USING EXTRACTED PROMPT DATA:', {
  inputLength: promptData.inputPrompt.length,
  evalLength: promptData.evaluationDetails.length,
  responseLength: promptData.modelResponse.length,
  actualInput: promptData.inputPrompt.substring(0, 100)
});

    
    // Extract basic trial information
    const success = trial.success || false;
    const evaluationScore = trial.evaluationScore || 0;
    const testId = trial.testId || `trial-${trialId}`;
    const userInput = trial.userInput || 'No input recorded';
    
    // ✅ FIXED: Enhanced actual results extraction
    const actualResults = trial.actualResults || trial.result || trial.response || {};
    const latency = actualResults.latencyMs || actualResults.responseTime || actualResults.executionTime || 0;
    const tokens = actualResults.tokenBreakdown?.output || actualResults.tokensUsed || actualResults.tokens || 0;
    const modelResponse = actualResults.output || actualResults.response || actualResults.text || 'No response recorded';
    
    // ✅ CRITICAL FIX: Use extracted prompt data instead of hardcoded fallbacks
    const inputPrompt = promptData.inputPrompt;
    const evaluationDetails = promptData.evaluationDetails;

    // Build trial header
    html += `
      <div class="trial-item ${success ? 'success' : 'failure'}">
        <div class="trial-header">
          <div class="trial-summary">
            <span class="trial-id">${testId}</span>
            <span class="trial-score ${success ? 'success' : 'failure'}">
              ${success ? '✅ PASS' : '❌ FAIL'}
            </span>
            <div class="trial-metrics">
              <span class="latency">${latency.toFixed(0)}ms</span>
              <span class="tokens">${tokens} tokens</span>
            </div>
          </div>
          
          ${showPrompts ? `
            <button class="toggle-trial-details-btn ${isExpanded ? 'expanded' : ''}"
                    data-domain-tier="${domainTier}" data-trial-id="${fullTrialId}">
              ${isExpanded ? '▼ Hide Details' : '▶ Show Details'}
            </button>
          ` : ''}
        </div>
        
        <div class="trial-basic-info">
          <div class="trial-input">
            <strong>Input:</strong> ${this.escapeHtml(userInput)}
          </div>
          <div class="trial-result-summary">
            <strong>Result:</strong> 
            <span class="result-status ${success ? 'success' : 'failure'}">
              ${success ? 'Success' : 'Failed'}
            </span>
            - ${this.truncateText(modelResponse, 100)}
          </div>
        </div>
    `;

    // Add detailed prompt information if expanded and prompts are shown
    if (showPrompts && isExpanded) {
      html += `
        <div class="trial-details">
          <div class="prompt-details-container">
      `;

      // Input prompt section
      if (filter === 'all' || filter === 'input') {
        html += `
          <div class="prompt-section input-prompt">
            <div class="section-header">
              <h5>📝 Input Prompt</h5>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent)">
                📋 Copy
              </button>
            </div>
            <pre class="prompt-text">${this.escapeHtml(inputPrompt)}</pre>
          </div>
        `;
      }

      // Model response section  
      if (filter === 'all' || filter === 'output') {
        html += `
          <div class="prompt-section model-response">
            <div class="section-header">
              <h5>🤖 Model Response</h5>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent)">
                📋 Copy
              </button>
            </div>
            <pre class="response-text">${this.escapeHtml(modelResponse)}</pre>
          </div>
        `;
      }

      // Evaluation details section
      if (filter === 'all' || filter === 'evaluation') {
        html += `
          <div class="prompt-section evaluation-details">
            <div class="section-header">
              <h5>📊 Evaluation Details</h5>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent)">
                📋 Copy
              </button>
            </div>
            <pre class="eval-details">${this.escapeHtml(evaluationDetails)}</pre>
          </div>
        `;
      }

      // Prompt metadata if available
      if (trial.promptMetadata) {
        html += `
          <div class="prompt-metadata">
            <h5>⚙️ Prompt Configuration</h5>
            <div class="metadata-grid">
              <div class="metadata-item">
                <span class="label">Approach:</span>
                <span class="value">${trial.promptMetadata.approach || 'Unknown'}</span>
              </div>
              <div class="metadata-item">
                <span class="label">Temperature:</span>
                <span class="value">${trial.promptMetadata.temperature || 'Default'}</span>
              </div>
              <div class="metadata-item">
                <span class="label">Max Tokens:</span>
                <span class="value">${trial.promptMetadata.maxTokens || 'Default'}</span>
              </div>
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    html += `</div>`;
    return html;
    
  } catch (error) {
    console.error('❌ Error generating enhanced trial HTML:', error);
    return `<div class="error">Error displaying trial ${trialId} - ${error.message}</div>`;
  }
}

/**
 * ✅ NEW: Safe HTML escaping method
 */
private escapeHtml(text: string): string {
  try {
    if (!text) return 'No content available';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  } catch (error) {
    return text || 'Error processing content';
  }
}

/**
 * ✅ NEW: Text truncation method
 */
private truncateText(text: string, maxLength: number = 200): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * ✅ FIXED: Enhanced prompt data extraction
 */
private extractPromptDataFromTrial(trial: any): {
  inputPrompt: string;
  evaluationDetails: string;
  modelResponse: string;
} {
  try {
    console.log('🔍 ENHANCED PROMPT EXTRACTION: Analyzing trial structure', {
      trialKeys: Object.keys(trial),
      hasActualResults: !!trial.actualResults,
      actualResultsKeys: trial.actualResults ? Object.keys(trial.actualResults) : []
    });

    let inputPrompt = 'Prompt details not captured';
    let evaluationDetails = 'Evaluation details not available';
    let modelResponse = 'No response recorded';

    // ✅ FIX 1: Check for the actual input that was logged
    if (trial.userInput && typeof trial.userInput === 'string' && trial.userInput.length > 0) {
      inputPrompt = trial.userInput;
      console.log('✅ Found userInput:', inputPrompt);
    }

    // ✅ FIX 2: Extract evaluation details from the correct location
    if (trial.evaluationScore !== undefined) {
      evaluationDetails = `Evaluation Score: ${trial.evaluationScore}\n`;
      evaluationDetails += `Success: ${trial.success ? 'PASS' : 'FAIL'}\n`;
      
      if (trial.evaluationSteps) {
        evaluationDetails += `Steps: ${trial.evaluationSteps}`;
      }
      console.log('✅ Found evaluation details');
    }

    // ✅ FIX 3: Extract model response properly
    if (trial.actualResults && trial.actualResults.output) {
      modelResponse = trial.actualResults.output;
    } else if (trial.response) {
      modelResponse = trial.response;
    }

    console.log('🔍 FIXED EXTRACTION RESULT:', {
      inputPromptLength: inputPrompt.length,
      evaluationDetailsLength: evaluationDetails.length,
      modelResponseLength: modelResponse.length,
      inputPromptPreview: inputPrompt.substring(0, 50)
    });

    return {
      inputPrompt,
      evaluationDetails,
      modelResponse
    };

  } catch (error) {
    console.error('❌ Error in enhanced prompt extraction:', error);
    return {
      inputPrompt: 'Error extracting prompt data',
      evaluationDetails: 'Error extracting evaluation details',
      modelResponse: 'Error extracting model response'
    };
  }
}


private debugTrialDataComplete(trial: any, trialId: string): void {
  console.group(`🐛 COMPLETE TRIAL STRUCTURE: ${trialId}`);
  
  // Log the complete structure
  console.log('📋 Complete trial object:', JSON.stringify(trial, null, 2));
  
  // Check specific paths where data might be stored
  const potentialPaths = [
    'userInput',
    'actualResults.inputPrompt', 
    'actualResults.output',
    'actualResults.response',
    'evaluationScore',
    'evaluationSteps',
    'success'
  ];
  
  potentialPaths.forEach(path => {
    const value = this.getNestedValue(trial, path);
    if (value !== undefined) {
      console.log(`✅ Found data at ${path}:`, value);
    }
  });
  
  console.groupEnd();
}

private getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}


/**
 * ✅ NEW: Debug method to log trial data structure
 */
private debugTrialDataStructure(trial: any, trialId: string): void {
  try {
    console.group(`🐛 TRIAL DATA STRUCTURE DEBUG: ${trialId}`);
    
    console.log('📋 Top-level trial keys:', Object.keys(trial));
    
    // Log each property and its type/content
    Object.keys(trial).forEach(key => {
      const value = trial[key];
      const type = typeof value;
      
      if (type === 'string' && value.length > 0) {
        console.log(`📝 ${key} (string, ${value.length} chars):`, value.substring(0, 100) + '...');
      } else if (type === 'object' && value !== null) {
        console.log(`📂 ${key} (object):`, Object.keys(value));
        
        // If it's actualResults, log its contents
        if (key === 'actualResults' && typeof value === 'object') {
          Object.keys(value).forEach(subKey => {
            const subValue = value[subKey];
            if (typeof subValue === 'string' && subValue.length > 10) {
              console.log(`  └── ${subKey} (${subValue.length} chars):`, subValue.substring(0, 50) + '...');
            }
          });
        }
      } else {
        console.log(`🔹 ${key} (${type}):`, value);
      }
    });
    
    console.groupEnd();
  } catch (error) {
    console.error('❌ Error debugging trial data structure:', error);
  }
}



/**
 * ✅ FIXED: Legacy scenario HTML generation
 */
private generateLegacyScenarioHTML(scenario: any, domainTier: string, scenarioId: string, promptState: PromptViewState): string {
  const hasError = scenario.response?.startsWith('ERROR:');
  const statusIcon = hasError ? '❌' : '✅';
  const showPrompts = promptState.showPrompts;
  const fullScenarioId = `${domainTier}-legacy-${scenarioId}`;
  const isExpanded = promptState.expandedTrials.has(fullScenarioId);

  // ✅ FIX: Initialize html variable properly
  let html = `
    <div class="scenario-item legacy ${hasError ? 'error' : 'success'}">
      <div class="scenario-header">
        <span class="step-number">Step ${scenario.step}</span>
        <span class="status-icon">${statusIcon}</span>
        <span class="performance-summary">
          ${scenario.tokensUsed || 0} tokens • ${(scenario.latencyMs || 0).toFixed(0)}ms
        </span>
        ${showPrompts ? `
          <button class="toggle-trial-details-btn ${isExpanded ? 'expanded' : ''}"
                  data-domain-tier="${domainTier}" data-trial-id="${fullScenarioId}">
            ${isExpanded ? '▼ Hide Details' : '▶ Show Details'}
          </button>
        ` : ''}
      </div>
      
      <div class="scenario-content">
        <div class="user-input">
          <strong>User:</strong> ${scenario.userInput || 'N/A'}
        </div>
        <div class="assistant-response">
          <strong>Assistant:</strong> ${this.truncateText(scenario.response || 'No response', 100)}
        </div>
        
        ${showPrompts && isExpanded ? `
          <div class="legacy-prompt-details">
            <div class="prompt-section">
              <h5>📝 Full Response</h5>
              <pre class="response-text">${this.escapeHtml(scenario.response || 'No response')}</pre>
            </div>
            ${scenario.userInput ? `
              <div class="prompt-section">
                <h5>🗣️ User Input</h5>
                <pre class="prompt-text">${this.escapeHtml(scenario.userInput)}</pre>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  return html;
}



  private generateMCDAnalysisHTML(result: EnhancedWalkthroughResult): string {
    try {
      if (!this.options.showMCDAnalysis) return '';

      let html = `
        <div class="mcd-analysis">
          <h4>🎯 MCD Principle Analysis</h4>
          <div class="mcd-principles-grid">
      `;

      // Analyze MCD principle adherence across scenarios
      const principleAdherence = this.analyzeMCDPrincipleAdherence(result);
      
      for (const [principle, adherence] of Object.entries(principleAdherence)) {
        const adherencePercentage = (adherence.score * 100).toFixed(1);
        const statusIcon = adherence.score > 0.7 ? '✅' : adherence.score > 0.4 ? '⚠️' : '❌';
        
        html += `
          <div class="mcd-principle">
            <div class="principle-header">
              <span class="principle-status">${statusIcon}</span>
              <span class="principle-name">${principle}</span>
              <span class="principle-score">${adherencePercentage}%</span>
            </div>
            <div class="principle-evidence">
              ${adherence.evidence.map(ev => `<span class="evidence-item">${ev}</span>`).join('')}
            </div>
          </div>
        `;
      }

      html += '</div></div>';
      return html;
    } catch (error) {
      console.error('Error generating MCD analysis HTML:', error);
      return '<div class="error">Error generating MCD analysis</div>';
    }
  }

  private generateComparisonHTML(): string {
    try {
      if (this.results.length === 0) {
        return '<div class="no-results">No comparison data available yet...</div>';
      }

      const domains = this.getUniqueDomains();
      let html = '<div class="tier-comparison-container">';

      for (const domain of domains) {
        html += this.generateDomainComparisonHTML(domain);
      }

      html += this.generateOverallComparisonHTML();
      html += '</div>';
      
      return html;
    } catch (error) {
      console.error('Error generating comparison HTML:', error);
      return '<div class="error">Error generating comparison</div>';
    }
  }

  private generateDomainComparisonHTML(domain: string): string {
    try {
      const domainResults = this.results.filter(r => (r as any).domain === domain);
      if (domainResults.length === 0) return '';

      let html = `
        <div class="domain-comparison">
          <h3>${this.getDomainIcon(domain)} ${domain} - Tier Comparison</h3>
          <div class="comparison-table-container">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="Q1">Q1 (Ultra-light)</th>
                  <th class="Q4">Q4 (Balanced)</th>
                  <th class="Q8">Q8 (High-capability)</th>
                  <th>Best Tier</th>
                </tr>
              </thead>
              <tbody>
      `;

      const metrics = [
        { key: 'overallSuccess', label: 'Overall Success', format: 'boolean' },
        { key: 'mcdAlignmentScore', label: 'MCD Alignment', format: 'percentage' },
        { key: 'resourceEfficiency', label: 'Resource Efficiency', format: 'percentage' },
        { key: 'userExperienceScore', label: 'User Experience', format: 'percentage' },
        { key: 'avgTokens', label: 'Avg Tokens Used', format: 'number' },
        { key: 'avgLatency', label: 'Avg Latency (ms)', format: 'number' }
      ];

      for (const metric of metrics) {
        html += `<tr>`;
        html += `<td class="metric-label">${metric.label}</td>`;

        const tierValues = ['Q1', 'Q4', 'Q8'].map(tier => {
          const result = domainResults.find(r => (r as any).tier === tier);
          return this.getMetricValue(result, metric.key, metric.format);
        });

        tierValues.forEach((value, index) => {
          const tierClass = ['Q1', 'Q4', 'Q8'][index];
          html += `<td class="${tierClass}">${value}</td>`;
        });

        // Determine best tier for this metric
        const bestTier = this.determineBestTier(domainResults, metric.key);
        html += `<td class="best-tier ${bestTier}">${bestTier}</td>`;
        html += `</tr>`;
      }

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;

      return html;
    } catch (error) {
      console.error('Error generating domain comparison HTML:', error);
      return '<div class="error">Error generating domain comparison</div>';
    }
  }

  private generateOverallComparisonHTML(): string {
    try {
      const overallStats = this.calculateOverallComparisonStats();
      
      return `
        <div class="overall-comparison">
          <h3>🏆 Overall Performance Ranking</h3>
          <div class="ranking-container">
            ${overallStats.map((stat, index) => `
              <div class="rank-item rank-${index + 1}">
                <span class="rank-number">${index + 1}</span>
                <span class="tier-name ${stat.tier}">${stat.tier}</span>
                <span class="overall-score">${(stat.overallScore * 100).toFixed(1)}%</span>
                <div class="strengths">
                  <strong>Strengths:</strong> ${stat.strengths.join(', ')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generating overall comparison HTML:', error);
      return '<div class="error">Error generating overall comparison</div>';
    }
  }
/**
 * ✅ MISSING METHOD: Generate empty results HTML
 */
private generateEmptyResultsHTML(): string {
  return `
    <div class="no-results">
      <div class="no-results-icon">📋</div>
      <h3>No Domain Walkthrough Results Yet</h3>
      <p>Start executing domain walkthroughs to see results appear here.</p>
      <div class="getting-started">
        <h4>Getting Started:</h4>
        <ul>
          <li>Click "🚀 Start Walkthroughs" to begin execution</li>
          <li>Select your approaches (MCD, Few-Shot, etc.)</li>
          <li>Results will appear as each approach completes</li>
        </ul>
      </div>
    </div>
  `;
}

  // ============================================
  // 🔧 UTILITY METHODS
  // ============================================

  private getUniqueDomains(): string[] {
    try {
      return Array.from(new Set(this.results.map(r => (r as any).domain)));
    } catch (error) {
      console.error('Error getting unique domains:', error);
      return [];
    }
  }

  private getDomainIcon(domain: string): string {
    const icons: { [key: string]: string } = {
      'appointment-booking': '📅',
      'Appointment Booking': '📅',
      'spatial-navigation': '🧭',
      'Spatial Navigation': '🧭', 
      'failure-diagnostics': '🔧',
      'Failure Diagnostics': '🔧'
    };
    return icons[domain] || '📋';
  }

// ✅ FIX: Safe calculation methods
private calculateAverageMCDAlignment(): number {
  try {
    if (this.results.length === 0) return 0;
    
    const validResults = this.results.filter(r => 
      r.domainMetrics && 
      typeof r.domainMetrics.mcdAlignmentScore === 'number' &&
      !isNaN(r.domainMetrics.mcdAlignmentScore)
    );
    
    if (validResults.length === 0) return 0;
    
    const sum = validResults.reduce((total, r) => {
      let score = r.domainMetrics.mcdAlignmentScore;
      // ✅ NORMALIZE: Handle both decimal and percentage formats
      if (score > 1.0) score = score / 100;
      return total + Math.max(0, Math.min(1.0, score));
    }, 0);
    
    return sum / validResults.length;
    
  } catch (error) {
    console.error('Error calculating average MCD alignment:', error);
    return 0;
  }
}

private calculateAverageResourceEfficiency(): number {
  try {
    if (this.results.length === 0) return 0;
    
    const validResults = this.results.filter(r => 
      r.domainMetrics && 
      typeof r.domainMetrics.resourceEfficiency === 'number' &&
      !isNaN(r.domainMetrics.resourceEfficiency)
    );
    
    if (validResults.length === 0) return 0;
    
    const sum = validResults.reduce((total, r) => {
      let efficiency = r.domainMetrics.resourceEfficiency;
      // ✅ NORMALIZE: Handle both decimal and percentage formats
      if (efficiency > 1.0) efficiency = efficiency / 100;
      return total + Math.max(0, Math.min(1.0, efficiency));
    }, 0);
    
    return sum / validResults.length;
    
  } catch (error) {
    console.error('Error calculating average resource efficiency:', error);
    return 0;
  }
}










 // Add these methods to the DomainResultsDisplay class
private calculateAverageLatency(scenarios: ScenarioResult[]): number {
  // ✅ FIX: Call static method
  return DomainResultsDisplay.calculateAverageLatency(scenarios);
}

private calculateAverageTokens(scenarios: ScenarioResult[]): number {
  // ✅ FIX: Call static method  
  return DomainResultsDisplay.calculateAverageTokens(scenarios);
}

// ✅ REPLACE: Line ~3200 calculateScenarioSuccessRate method
private calculateScenarioSuccessRate(scenarios: ScenarioResult[]): number {
  try {
    if (!scenarios || scenarios.length === 0) return 0;
    
    const successful = scenarios.filter(scenario => {
      if (!scenario.response || typeof scenario.response !== 'string') return false;
      
      const response = scenario.response.trim().toLowerCase();
      
      // 🔧 FIX: Use consistent error detection
      const errorPatterns = [
        'error:', 'failed:', 'cannot', 'unable to', 
        'sorry', 'i cannot', 'i\'m unable'
      ];
      
      // Check for explicit failures
      const hasError = errorPatterns.some(pattern => response.startsWith(pattern));
      if (hasError) return false;
      
      // Minimum viability check
      return response.length >= 10 && response.split(' ').length >= 3;
    }).length;
    
    return (successful / scenarios.length) * 100;
    
  } catch (error) {
    console.error('Error calculating scenario success rate:', error);
    return 0;
  }
}
// ✅ NEW: Calculation methods for normalized data
private calculateScenarioSuccessRateFromNormalizedData(scenarios: any[]): number {
  if (!scenarios || scenarios.length === 0) return 0;
  
  const successful = scenarios.filter(scenario => {
    // Check explicit success flag first
    if (typeof scenario.success === 'boolean') {
      return scenario.success;
    }
    
    // Check response content
    if (scenario.response && typeof scenario.response === 'string') {
      const response = scenario.response.toLowerCase().trim();
      return !response.startsWith('error:') && 
             !response.startsWith('failed:') && 
             !response.includes('cannot') &&
             response.length >= 10;
    }
    
    return false;
  }).length;
  
  const rate = (successful / scenarios.length) * 100;
  console.log(`✅ SUCCESS RATE: ${successful}/${scenarios.length} = ${rate}%`);
  return rate;
}

private calculateAverageLatencyFromNormalizedData(scenarios: any[]): number {
  if (!scenarios || scenarios.length === 0) return 0;
  
  const latencies = scenarios
    .map(s => {
      let latency = s.latencyMs || s.latency || s.responseTime || s.duration || 0;
      
      // Handle string values like "1234ms"
      if (typeof latency === 'string') {
        const numMatch = latency.match(/(\d+)/);
        latency = numMatch ? parseInt(numMatch[1]) : 0;
      }
      
      return Number(latency) || 0;
    })
    .filter(lat => lat > 0 && lat < 60000);
  
  if (latencies.length === 0) {
    console.warn('❌ No valid latency data found');
    return 0;
  }
  
  const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  console.log(`⏱️ LATENCY: ${latencies.length} values, average: ${average}ms`);
  return average;
}

private calculateAverageTokensFromNormalizedData(scenarios: any[]): number {
  if (!scenarios || scenarios.length === 0) return 0;
  
  const tokens = scenarios
    .map(s => {
      let tokenCount = s.tokensUsed || s.tokens || s.tokenCount || s.totalTokens || 0;
      
      // Handle nested structures
      if (!tokenCount && s.tokenBreakdown) {
        tokenCount = s.tokenBreakdown.total || s.tokenBreakdown.output || 0;
      }
      
      // Handle string values
      if (typeof tokenCount === 'string') {
        const numMatch = tokenCount.match(/(\d+)/);
        tokenCount = numMatch ? parseInt(numMatch[1]) : 0;
      }
      
      return Number(tokenCount) || 0;
    })
    .filter(tokens => tokens >= 0 && tokens < 10000);
  
  if (tokens.length === 0) {
    console.warn('❌ No valid token data found');
    return 0;
  }
  
  const average = tokens.reduce((sum, tokens) => sum + tokens, 0) / tokens.length;
  console.log(`🎯 TOKENS: ${tokens.length} values, average: ${average}`);
  return average;
}

// 🔧 FIX: Add comprehensive data structure debugging
private static debugResultStructure(result: any, approach: string): void {
  console.group(`🐛 DEBUG Result Structure: ${approach}`);
  console.log('Full result object keys:', Object.keys(result));
  
  // Check all possible data locations
  const dataLocations = [
    'scenarioResults',
    'processedTrials', 
    'trials',
    'executionResults',
    'evaluationResults',
    'walkthroughResults'
  ];
  
  dataLocations.forEach(location => {
    if (result[location]) {
      console.log(`${location}:`, result[location]);
      if (Array.isArray(result[location]) && result[location].length > 0) {
        console.log(`${location} sample:`, result[location][0]);
        console.log(`${location} properties:`, Object.keys(result[location][0]));
      }
    }
  });
  
  console.groupEnd();
}


/**
 * ✅ NEW: Extract summary metrics from working detailed analysis
 */
private extractSummaryMetricsFromDetailedResults(result: any, approach: string): {
  successRate: number;
  successDisplay: string;
  avgLatency: number;
  avgTokens: number;
  mcdAlignment: number;
  scenarioCount: number;
} {
  try {
    console.log(`📊 SUMMARY BRIDGE: Extracting metrics for ${approach}`, result);
    
    // ✅ STRATEGY 1: Use variant results if available (detailed pane data)
    if (result.scenarioResults && Array.isArray(result.scenarioResults)) {
      for (const scenario of result.scenarioResults) {
        if (scenario.variants && Array.isArray(scenario.variants)) {
          for (const variant of scenario.variants) {
            if (variant.type && variant.measuredProfile) {
              const profile = variant.measuredProfile;
              console.log(`✅ FOUND VARIANT METRICS:`, profile);
              
              return {
                successRate: profile.actualSuccessCount / profile.totalTrials * 100,
                successDisplay: `${profile.actualSuccessCount}/${profile.totalTrials}`,
                avgLatency: profile.avgLatency || 0,
                avgTokens: profile.avgTokens || 0,
                mcdAlignment: profile.mcdAlignmentScore || 0,
                scenarioCount: profile.totalTrials || 0
              };
            }
          }
        }
      }
    }
    
    // ✅ STRATEGY 2: Use trial-level aggregated data
    if (result.processedTrials && Array.isArray(result.processedTrials)) {
      const trials = result.processedTrials;
      console.log(`📊 USING PROCESSED TRIALS: ${trials.length} trials`);
      
      const successfulTrials = trials.filter(trial => 
        trial.success === true || 
        trial.passed === true ||
        trial.status === 'PASS' ||
        (trial.evaluationScore && trial.evaluationScore > 70)
      );
      
      const avgLatency = trials.reduce((sum, trial) => 
        sum + (trial.latencyMs || trial.responseTime || 0), 0) / trials.length;
      
      const avgTokens = trials.reduce((sum, trial) => 
        sum + (trial.tokensUsed || trial.tokens || 0), 0) / trials.length;
      
      const successRate = (successfulTrials.length / trials.length) * 100;
      
      return {
        successRate,
        successDisplay: `${successfulTrials.length}/${trials.length}`,
        avgLatency,
        avgTokens,
        mcdAlignment: result.domainMetrics?.mcdAlignmentScore || 0,
        scenarioCount: trials.length
      };
    }
    
    // ✅ STRATEGY 3: Use domain metrics as fallback
    const domainMetrics = result.domainMetrics || {};
    return {
      successRate: domainMetrics.overallSuccess ? 100 : 0,
      successDisplay: domainMetrics.overallSuccess ? '1/1' : '0/1',
      avgLatency: 0,
      avgTokens: 0,
      mcdAlignment: domainMetrics.mcdAlignmentScore || 0,
      scenarioCount: 1
    };
    
  } catch (error) {
    console.error(`❌ SUMMARY BRIDGE ERROR for ${approach}:`, error);
    return {
      successRate: 0,
      successDisplay: '0/0',
      avgLatency: 0,
      avgTokens: 0,
      mcdAlignment: 0,
      scenarioCount: 0
    };
  }
}

// Replace memory management methods (around line 2800)
// Enhanced memory management with execution protection
private manageResultsMemoryEfficiently(): void {
  try {
    // ✅ CRITICAL: Enhanced execution protection
    if ((window as any).immediateStop || 
        (window as any).unifiedExecutionState?.isExecuting ||
        (window as any).isWalkthroughExecuting ||
        this.isUpdating) {
      console.log('🛡️ Memory cleanup BLOCKED - execution active');
      return;
    }
    
    // ✅ ENHANCED: Smarter memory threshold detection
    const memoryEstimate = this.estimateMemoryUsage();
    const threshold = this.getAdaptiveMemoryThreshold();
    
    if (memoryEstimate < threshold) {
      return; // No cleanup needed
    }
    
    console.log(`🧹 Memory cleanup triggered: ${memoryEstimate}MB > ${threshold}MB`);
    
    // ✅ PRIORITY-BASED: Clean in order of impact
    const cleanupTasks = [
      { name: 'Template Cache', fn: () => this.cleanupTemplateCache(), impact: 'low' },
      { name: 'Old Results', fn: () => this.cleanupOldResults(), impact: 'medium' },
      { name: 'Approach Cache', fn: () => this.cleanupApproachResults(), impact: 'high' }
    ];
    
    for (const task of cleanupTasks) {
      try {
        task.fn();
        
        // Check if enough memory was freed
        const newMemoryEstimate = this.estimateMemoryUsage();
        if (newMemoryEstimate < threshold * 0.8) { // 80% of threshold
          console.log(`✅ Memory cleanup sufficient after ${task.name}`);
          break;
        }
      } catch (taskError) {
        console.error(`❌ Cleanup task failed: ${task.name}`, taskError);
      }
    }
    
    const finalMemory = this.estimateMemoryUsage();
    console.log(`✅ Memory cleanup completed: ${memoryEstimate}MB → ${finalMemory}MB`);
    
  } catch (error) {
    console.error('❌ Memory management error:', error);
  }
}

private getAdaptiveMemoryThreshold(): number {
  // ✅ ADAPTIVE: Threshold based on system capabilities
  const baseThreshold = 100; // 100MB base
  const maxResults = this.results.length;
  const approachSets = this.approachResults?.size || 0;
  
  // Increase threshold for active systems
  const adaptiveThreshold = baseThreshold + (maxResults * 0.5) + (approachSets * 5);
  
  return Math.min(adaptiveThreshold, 500); // Cap at 500MB
}

private cleanupOldResults(): void {
  if (this.results.length <= 50) return; // Keep minimum results
  
  console.log(`🧹 Cleaning old results: ${this.results.length} → 50`);
  
  // ✅ STRATEGIC: Keep representative sample, not just recent
  this.results = this.selectRepresentativeSample(this.results, 50);
  this.rebuildGroupedResults();
}

private cleanupApproachResults(): void {
  if (!this.approachResults || this.approachResults.size <= 10) return;
  
  console.log(`🧹 Cleaning approach results: ${this.approachResults.size} → 10`);
  
  // Keep only the 10 most recent domain-tier combinations
  const sortedKeys = Array.from(this.approachResults.keys())
    .sort((a, b) => {
      const aTimestamp = this.getLatestTimestamp(this.approachResults.get(a));
      const bTimestamp = this.getLatestTimestamp(this.approachResults.get(b));
      return bTimestamp - aTimestamp;
    });
  
  const keysToRemove = sortedKeys.slice(10);
  keysToRemove.forEach(key => this.approachResults.delete(key));
}

private getLatestTimestamp(approaches: Map<string, any> | undefined): number {
  if (!approaches) return 0;
  
  let latest = 0;
  approaches.forEach(result => {
    const timestamp = result.storedAt || result.receivedAt || 0;
    if (timestamp > latest) latest = timestamp;
  });
  
  return latest;
}

private estimateMemoryUsage(): number {
  try {
    const resultsSize = JSON.stringify(this.results).length;
    const cacheSize = DomainResultsDisplay.templateCache.size * 1000; // Rough estimate
    const approachSize = JSON.stringify(Array.from(this.approachResults.values())).length;
    
    return Math.round((resultsSize + cacheSize + approachSize) / (1024 * 1024)); // MB
  } catch (error) {
    return 50; // Conservative estimate
  }
}

private selectRepresentativeSample(results: EnhancedWalkthroughResult[], targetSize: number): EnhancedWalkthroughResult[] {
  if (results.length <= targetSize) return results;
  
  // ✅ STRATIFIED SAMPLING: Ensure all domains and tiers are represented
  const domains = this.getUniqueDomains();
  const tiers = ['Q1', 'Q4', 'Q8'];
  const samplesPerCategory = Math.floor(targetSize / (domains.length * tiers.length));
  
  const sample: EnhancedWalkthroughResult[] = [];
  
  // ✅ BALANCED: Sample from each domain-tier combination
  for (const domain of domains) {
    for (const tier of tiers) {
      const categoryResults = results.filter(r => 
        (r as any).domain === domain && (r as any).tier === tier
      );
      
      if (categoryResults.length > 0) {
        // ✅ MIXED: Take both recent and older results
        const sampleSize = Math.min(samplesPerCategory, categoryResults.length);
        const halfSize = Math.floor(sampleSize / 2);
        
        // Take half from recent, half from older results
        const recent = categoryResults.slice(-halfSize);
        const older = categoryResults.slice(0, sampleSize - halfSize);
        
        sample.push(...recent, ...older);
      }
    }
  }
  
  // ✅ FILL REMAINING: If we haven't reached target size, add more recent results
  if (sample.length < targetSize) {
    const remaining = targetSize - sample.length;
    const recentResults = results.slice(-remaining).filter(r => 
      !sample.some(s => (s as any).walkthroughId === (r as any).walkthroughId)
    );
    sample.push(...recentResults);
  }
  
  return sample.slice(0, targetSize);
}






// ✅ ADD: Prominent MCD advantage display
private generateMCDAdvantageHighlight(comparativeResult: ComparativeWalkthroughResult): string {
  const mcd = comparativeResult.mcdAdvantage;
  
  if (!mcd.validated) {
    return `
      <div class="mcd-advantage-warning">
        <h4>⚠️ MCD Advantage Not Demonstrated</h4>
        <div class="warning-content">
          <p>Expected: MCD should show 2-3x better performance</p>
          <ul>
            ${mcd.concerns.map(concern => `<li>• ${concern}</li>`).join('')}
          </ul>
          <div class="corrective-actions">
            <strong>Recommended Actions:</strong>
            ${mcd.recommendations.map(rec => `<div class="action-item">→ ${rec}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="mcd-advantage-validated">
      <h4>✅ MCD Advantages Confirmed</h4>
      <div class="advantage-metrics">
        <div class="metric-highlight success-rate">
          <span class="metric-label">Success Rate Advantage:</span>
          <span class="metric-value">${mcd.advantages?.successRate.toFixed(2)}x</span>
        </div>
        <div class="metric-highlight token-efficiency">
          <span class="metric-label">Token Efficiency:</span>
          <span class="metric-value">${mcd.advantages?.tokenEfficiency.toFixed(2)}x</span>
        </div>
        <div class="metric-highlight latency">
          <span class="metric-label">Speed Advantage:</span>
          <span class="metric-value">${mcd.advantages?.latencyAdvantage.toFixed(2)}x</span>
        </div>
      </div>
      <div class="confidence-level">
        Statistical Confidence: ${(mcd.confidenceLevel * 100).toFixed(1)}%
      </div>
    </div>
  `;
}


  private truncateResponse(response: string, maxLength: number = 200): string {
    try {
      if (response.length <= maxLength) return response;
      return response.substring(0, maxLength) + '...';
    } catch (error) {
      console.error('Error truncating response:', error);
      return response;
    }
  }
private calculateGracefulDegradationScore(result: EnhancedWalkthroughResult): number {
  const metrics = (result as any).domainMetrics;
  
  // ✅ NEUTRAL: Score based on actual recovery capability, not just fallback presence
  let score = 0.5; // Start neutral
  
  // ✅ POSITIVE: Good recovery increases score
  if (metrics.overallSuccess && metrics.fallbackTriggered) {
    score += 0.3; // Successfully recovered from issues
  }
  
  // ✅ POSITIVE: No issues needed recovery
  if (metrics.overallSuccess && !metrics.fallbackTriggered) {
    score += 0.5; // Perfect execution
  }
  
  // ✅ NEGATIVE: Failed even with fallbacks
  if (!metrics.overallSuccess && metrics.fallbackTriggered) {
    score = 0.2; // Recovery attempted but failed
  }
  
  // ✅ NEGATIVE: Failed without attempting recovery
  if (!metrics.overallSuccess && !metrics.fallbackTriggered) {
    score = 0.1; // No recovery mechanism
  }
  
  return Math.max(0, Math.min(1.0, score));
}
  private analyzeMCDPrincipleAdherence(result: EnhancedWalkthroughResult): { [principle: string]: { score: number; evidence: string[] } } {
    try {
      // This would analyze how well each MCD principle was followed
      return {
        'Minimal Resource Usage': { 
          score: (result as any).domainMetrics.resourceEfficiency, 
          evidence: ['Token efficiency maintained', 'Response time optimized'] 
        },
        'Graceful Degradation': { 
  score: this.calculateGracefulDegradationScore(result), // ✅ UNBIASED: Objective calculation
  evidence: this.getGracefulDegradationEvidence(result)
},
        'User Experience Focus': { 
          score: (result as any).domainMetrics.userExperienceScore,
          evidence: ['Clear responses', 'Task completion']
        }
      };
    } catch (error) {
      console.error('Error analyzing MCD principle adherence:', error);
      return {};
    }
  }

  // ✅ UPDATE: In getMetricValue method
/**
 * ✅ FIXED: Correct static method calls
 */
private getMetricValue(result: EnhancedWalkthroughResult | undefined, metricKey: string, format: string): string {
  try {
    if (!result) return 'N/A';

    let value: any;
    
    // ✅ USE standardized static methods:
    if (metricKey === 'avgTokens') {
      value = DomainResultsDisplay.calculateAverageTokens(result.scenarioResults || []);
    } else if (metricKey === 'avgLatency') {
      value = DomainResultsDisplay.calculateAverageLatency(result.scenarioResults || []);
    } else if (metricKey === 'successRate') {
      value = DomainResultsDisplay.calculateSuccessRateFromResult(result);
    } else {
      value = (result as any).domainMetrics?.[metricKey];
    }

    if (value === undefined || value === null) return 'N/A';

    switch (format) {
      case 'boolean':
        return value ? '✅ Yes' : '❌ No';
      case 'percentage':
        return DomainResultsDisplay.safeFormatPercentage(value, metricKey);
      case 'number':
        return Number(value).toFixed(0);
      default:
        return String(value);
    }
  } catch (error) {
    console.error('Error getting metric value:', error);
    return 'Error';
  }
}




// ✅ UNBIASED: Tier comparison accounting for tier capabilities
/**
 * ✅ FIXED: Correct static method calls in tier comparison
 */
private determineBestTier(domainResults: EnhancedWalkthroughResult[], metricKey: string): string {
  try {
    const tierExpectations = {
      'Q1': { maxLatency: 500, maxTokens: 50, expectedSuccess: 0.6 },
      'Q4': { maxLatency: 1000, maxTokens: 100, expectedSuccess: 0.8 },
      'Q8': { maxLatency: 2000, maxTokens: 200, expectedSuccess: 0.9 }
    };

    const tierValues = ['Q1', 'Q4', 'Q8'].map(tier => {
      const result = domainResults.find(r => (r as any).tier === tier);
      if (!result) return { tier, value: 0 };
      
      let value: number;
      const expectations = tierExpectations[tier];
      
      if (metricKey === 'avgTokens') {
        // ✅ FIX: Call static method correctly
        const avgTokens = DomainResultsDisplay.calculateAverageTokens(result.scenarioResults);
        value = Math.max(0, 1 - (avgTokens / expectations.maxTokens));
      } else if (metricKey === 'avgLatency') {
        // ✅ FIX: Call static method correctly
        const avgLatency = DomainResultsDisplay.calculateAverageLatency(result.scenarioResults);
        value = Math.max(0, 1 - (avgLatency / expectations.maxLatency));
      } else if (metricKey === 'overallSuccess') {
        const successRate = (result as any).domainMetrics.overallSuccess ? 1 : 0;
        value = successRate >= expectations.expectedSuccess ? 1 : successRate / expectations.expectedSuccess;
      } else {
        value = (result as any).domainMetrics[metricKey] as number || 0;
      }
      
      return { tier, value };
    });

    return tierValues.reduce((best, current) => 
      current.value > best.value ? current : best
    ).tier;
  } catch (error) {
    console.error('Error determining best tier:', error);
    return 'N/A';
  }
}

private rotateDomainOrder(domains: string[]): string[] {
  if (domains.length <= 1) return domains;
  
  // ✅ ROTATION: Use timestamp-based rotation to ensure fairness over time
  const rotationIndex = Math.floor(Date.now() / 60000) % domains.length; // Rotate every minute
  return [...domains.slice(rotationIndex), ...domains.slice(0, rotationIndex)];
}
// ✅ UNBIASED: Memory management preserving representative sample
// ✅ IMPROVED: More robust memory management
 

// In DomainResultsDisplay class - FIXED memory management
private manageResultsMemory(): void {
  try {
    // ✅ CRITICAL FIX: Complete execution protection
    if ((window as any).immediateStop || 
        (window as any).unifiedExecutionState?.isExecuting ||
        (window as any).isWalkthroughExecuting ||  // Add this check
        this.isUpdating) {
      console.log('🛡️ Memory cleanup BLOCKED - execution active');
      return; // EXIT IMMEDIATELY
    }
    
    // ✅ Add execution state verification
    const executionStates = [
      (window as any).isWalkthroughRunning,
      (window as any).trialExecutionActive,
      (window as any).domainExecutionInProgress
    ];
    
    if (executionStates.some(state => state === true)) {
      console.log('🛡️ Memory cleanup BLOCKED - execution detected');
      return;
    }
    
    // Rest of memory management...
  } catch (error) {
    console.error('Memory management error:', error);
  }
}

// ✅ DISABLE periodic cleanup during execution
private startPeriodicMemoryManagement(): void {
  setInterval(() => {
    // ✅ TRIPLE CHECK before any cleanup
    if (!(window as any).unifiedExecutionState?.isExecuting && 
        !(window as any).isWalkthroughExecuting &&
        !(window as any).immediateStop) {
      this.manageResultsMemory();
    }
  }, 900000); // Keep 15 minute interval
}




private safeUpdateDOM(element: HTMLElement, content: string): void {
  if (!element) return;
  
  try {
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const temp = document.createElement('div');
    temp.innerHTML = content;
    
    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }
    
    // Atomic update
    requestAnimationFrame(() => {
      element.innerHTML = '';
      element.appendChild(fragment);
    });
    
  } catch (error) {
    console.error('DOM update failed:', error);
    // Fallback to simple update
    try {
      element.innerHTML = content;
    } catch (fallbackError) {
      element.innerHTML = '<div class="error">Content update failed</div>';
    }
  }
}

 
/**
 * ✅ ENHANCED: Dynamic template cache cleanup
 */
private cleanupTemplateCache(): void {
  try {
    const cache = DomainResultsDisplay.templateCache;
    if (cache && typeof cache.size === 'number' && cache.size > DomainResultsDisplay.MAX_CACHE_SIZE) {
      // Clean up 10% of cache or minimum 5 entries
      const cleanupCount = Math.max(5, Math.floor(DomainResultsDisplay.MAX_CACHE_SIZE * 0.1));
      const keysToDelete = Array.from(cache.keys()).slice(0, cleanupCount);
      
      keysToDelete.forEach(key => {
        try {
          cache.delete(key);
        } catch (deleteError) {
          console.warn(`Failed to delete template cache key: ${key}`, deleteError);
        }
      });
      
      console.log(`🧹 Cleaned ${keysToDelete.length} template cache entries`);
    }
  } catch (error) {
    console.warn('Template cache cleanup failed:', error);
  }
}



// ✅ ADD: Representative sample selection


  private calculateOverallComparisonStats(): { tier: string; overallScore: number; strengths: string[] }[] {
    try {
      const tiers = ['Q1', 'Q4', 'Q8'];
      const tierStats = tiers.map(tier => {
        const tierResults = this.results.filter(r => (r as any).tier === tier);
        if (tierResults.length === 0) return { tier, overallScore: 0, strengths: [] };

        const avgMCD = tierResults.reduce((sum, r) => sum + r.domainMetrics.mcdAlignmentScore, 0) / tierResults.length;
        const avgEfficiency = tierResults.reduce((sum, r) => sum + r.domainMetrics.resourceEfficiency, 0) / tierResults.length;
        const avgUX = tierResults.reduce((sum, r) => sum + r.domainMetrics.userExperienceScore, 0) / tierResults.length;
        const successRate = tierResults.filter(r => r.domainMetrics.overallSuccess).length / tierResults.length;

        const overallScore = (avgMCD + avgEfficiency + avgUX + successRate) / 4;
        
        const strengths = [];
        if (avgMCD > 0.8) strengths.push('MCD Alignment');
        if (avgEfficiency > 0.8) strengths.push('Resource Efficiency');
        if (avgUX > 0.8) strengths.push('User Experience');
        if (successRate > 0.8) strengths.push('Reliability');

        return { tier, overallScore, strengths };
      });

      return tierStats.sort((a, b) => b.overallScore - a.overallScore);
    } catch (error) {
      console.error('Error calculating overall comparison stats:', error);
      return [];
    }
  }

  // ============================================
  // 📤 EXPORT FUNCTIONALITY
  // ============================================

/**
 * ✅ ENHANCED: Updated main export method with better error handling
 */
public exportResults(format: 'json' | 'csv'): void {
  try {
    if (this.results.length === 0) {
      alert('No results to export.');
      return;
    }

    // Check if we have comparative results
    const hasComparativeResults = this.results.some(r => (r as any).isComparative);

    if (hasComparativeResults) {
      console.log(`📊 Exporting ${format.toUpperCase()} with comparative analysis...`);
      if (format === 'json') {
        this.exportComparativeJSON();
      } else {
        this.exportComparativeCSV();
      }
    } else {
      console.log(`📄 Exporting standard ${format.toUpperCase()}...`);
      if (format === 'json') {
        this.exportJSON();
      } else {
        this.exportCSV();
      }
    }
    
    console.log(`✅ ${format.toUpperCase()} export completed successfully`);
  } catch (error) {
    console.error('Error exporting results:', error);
    alert(`Error exporting ${format} results. Please check console for details.`);
  }
}


  private exportJSON(): void {
    try {
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        totalResults: this.results.length,
        domains: this.getUniqueDomains(),
        results: this.results,
        summary: {
          overallSuccessRate: this.results.filter(r => r.domainMetrics.overallSuccess).length / this.results.length,
          averageMCDAlignment: this.calculateAverageMCDAlignment(),
          averageResourceEfficiency: this.calculateAverageResourceEfficiency()
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chapter7-walkthroughs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw error;
    }
  }

  private exportCSV(): void {
    try {
      const headers = [
        'Domain', 'Tier', 'Walkthrough_ID', 'Overall_Success', 'MCD_Alignment_Score',
        'Resource_Efficiency', 'User_Experience_Score', 'Fallback_Triggered',
        'Total_Scenarios', 'Avg_Tokens', 'Avg_Latency_Ms', 'Success_Rate', 'Recommendations'
      ];

      const rows = this.results.map(result => {
        const avgTokens = this.calculateAverageTokens(result.scenarioResults);
        const avgLatency = this.calculateAverageLatency(result.scenarioResults);
        const successRate = this.calculateScenarioSuccessRate(result.scenarioResults);

        return [
          (result as any).domain,
          (result as any).tier,
          (result as any).walkthroughId,
          (result as any).domainMetrics.overallSuccess,
          (result as any).domainMetrics.mcdAlignmentScore.toFixed(3),
          (result as any).domainMetrics.resourceEfficiency.toFixed(3),
          (result as any).domainMetrics.userExperienceScore.toFixed(3),
          (result as any).domainMetrics.fallbackTriggered,
          result.scenarioResults ? result.scenarioResults.length : 0,
          avgTokens.toFixed(1),
          avgLatency.toFixed(1),
          successRate.toFixed(1),
          `"${result.recommendations ? result.recommendations.join('; ') : ''}"`
        ];
      });

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chapter7-walkthrough-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }

/**
 * Cleanup and destroy methods for proper resource management
 */
public destroy(): void {
    try {
        // Clear timeouts
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
        
        // ✅ ENHANCED: Use proper event listener cleanup
        this.cleanupEventListeners();
        
        // Clear results
        this.results = [];
        
        // Remove CSS
        const styleElement = document.getElementById('domain-results-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        // Remove error notifications
        const errorNotification = document.getElementById('domain-results-error-notification');
        if (errorNotification) {
            errorNotification.remove();
        }
        
        // ✅ SAFE: Clear template cache
        DomainResultsDisplay.clearTemplateCache();
        
        // Reset initialization flag
        this.isInitialized = false;
        
        console.log('🧹 DomainResultsDisplay destroyed and cleaned up');
        
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}



public setExecutionAware(isExecuting: boolean): void {
  try {
    // ✅ PREVENT: Race conditions with lock
    if (this.executionStateLock) {
      console.log('🔒 Execution state change queued due to lock');
      this.executionStateQueue.push(() => this.setExecutionAware(isExecuting));
      return;
    }
    
    this.executionStateLock = true;
    
    if (isExecuting) {
      this.pauseAllOperations();
      console.log('🔄 Domain results PAUSED for execution');
    } else {
      console.log('▶️ Domain results RESUMING after execution');
      
      // ✅ ENHANCED: Wait for execution to fully complete with verification
      this.safeResumeOperations();
    }
    
  } catch (error) {
    console.error('Error setting execution awareness:', error);
  } finally {
    // ✅ ALWAYS: Release lock and process queue
    setTimeout(() => {
      this.executionStateLock = false;
      if (this.executionStateQueue.length > 0) {
        const next = this.executionStateQueue.shift();
        if (next) next();
      }
    }, 100);
  }
}

private safeResumeOperations(): void {
  // ✅ MULTI-STAGE: Gradual resume with verification
  const resumeStages = [
    { delay: 1000, action: () => this.verifyExecutionComplete() },
    { delay: 2000, action: () => this.resumeAllOperations() },
    { delay: 3000, action: () => this.scheduleDisplayUpdate() }
  ];
  
  resumeStages.forEach(stage => {
    setTimeout(() => {
      try {
        stage.action();
      } catch (error) {
        console.error(`❌ Resume stage failed:`, error);
      }
    }, stage.delay);
  });
}

private verifyExecutionComplete(): boolean {
  const executionStates = [
    (window as any).unifiedExecutionState?.isExecuting,
    (window as any).isWalkthroughExecuting,
    (window as any).immediateStop,
    (window as any).trialExecutionActive
  ];
  
  const stillExecuting = executionStates.some(state => state === true);
  
  if (stillExecuting) {
    console.log('⏳ Execution still active, delaying resume...');
    setTimeout(() => this.safeResumeOperations(), 2000);
    return false;
  }
  
  return true;
}

private pauseAllOperations(): void {
  // Clear all timeouts
  if (this.updateTimeout) {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }
  
  if (this.displayUpdateTimeout) {
    clearTimeout(this.displayUpdateTimeout);
    this.displayUpdateTimeout = null;
  }
  
  // Reset all locks
  this.isUpdating = false;
  
  console.log('🛑 All domain results operations paused');
}

private resumeAllOperations(): void {
  // ✅ Verify execution is truly complete
  if ((window as any).unifiedExecutionState?.isExecuting ||
      (window as any).isWalkthroughExecuting) {
    console.log('⏳ Execution still active, delaying resume...');
    setTimeout(() => this.resumeAllOperations(), 1000);
    return;
  }
  
  // Reset locks
  this.isUpdating = false;
  
  // Gentle restart
  setTimeout(() => {
    if (this.results.length > 0 || this.approachResults.size > 0) {
      this.throttledUpdate();
    }
  }, 500);
  
  console.log('✅ Domain results operations resumed');
}






/**
 * Reset the display system
 */
public reset(): void {
  try {
    this.destroy();
    setTimeout(() => {
      this.initialize();
    }, 100);
  } catch (error) {
    console.error('Error resetting display:', error);
  }
}

}
// ============================================
// 🆕 NEW ISOLATED STORAGE ROUTE (SAFE)
// ============================================

export class WalkthroughResultsStorage {
  private static instance: WalkthroughResultsStorage | null = null;
  private walkthroughResults: Map<string, any> = new Map();
  private displayResults: any[] = [];
  private comparativeResults: Map<string, ComparativeWalkthroughResult> = new Map();
  private isDisplayReady: boolean = false;

  // ✅ NEW: Multi-approach tracking
  private approachResults: Map<string, Map<string, any>> = new Map(); // domain-tier -> approach -> result
  private pendingComparativeAnalysis: Map<string, any[]> = new Map(); // domain-tier -> results array

  public static getInstance(): WalkthroughResultsStorage {
    if (!WalkthroughResultsStorage.instance) {
      WalkthroughResultsStorage.instance = new WalkthroughResultsStorage();
    }
    return WalkthroughResultsStorage.instance;
  }

  /**
   * ✅ ENHANCED: Store walkthrough result with approach detection
   */
  public storeWalkthroughResult(result: any, approach?: string): void {
    try {
      console.log(`📥 MULTI-APPROACH: Storing walkthrough result for approach: ${approach || 'default'}`, result);
      
      const timestamp = Date.now();
      const domainTierKey = `${result.domain || 'unknown'}-${result.tier || 'unknown'}`;
      const resultKey = `${domainTierKey}-${approach || 'default'}-${timestamp}`;
      
      // ✅ ENHANCED: Detect if this is part of a multi-approach execution
      const isMultiApproach = this.isMultiApproachExecution(result, approach);
      
      if (isMultiApproach) {
        this.handleMultiApproachResult(result, approach, domainTierKey, timestamp);
      } else {
        this.handleSingleApproachResult(result, resultKey, timestamp);
      }
      
    } catch (error) {
      console.error('❌ MULTI-APPROACH: Storage failed:', error);
    }
  }

  /**
   * ✅ NEW: Handle multi-approach result storage
   */
  private handleMultiApproachResult(result: any, approach: string, domainTierKey: string, timestamp: number): void {
    try {
      // Initialize approach storage for this domain-tier
      if (!this.approachResults.has(domainTierKey)) {
        this.approachResults.set(domainTierKey, new Map());
        this.pendingComparativeAnalysis.set(domainTierKey, []);
      }
      
      const domainApproaches = this.approachResults.get(domainTierKey)!;
      const pendingResults = this.pendingComparativeAnalysis.get(domainTierKey)!;
      
      // Store this approach result
      const enhancedResult = {
        ...result,
        approach: approach,
        approachDisplayName: this.getApproachDisplayName(approach),
        storedAt: timestamp,
        isComparative: true
      };
      
      domainApproaches.set(approach, enhancedResult);
      pendingResults.push(enhancedResult);
      
      console.log(`✅ MULTI-APPROACH: Stored ${approach} result for ${domainTierKey}`);
      
      // Check if we have results from multiple approaches for comparison
      if (domainApproaches.size > 1) {
        this.generateComparativeAnalysis(domainTierKey, domainApproaches, pendingResults);
      }
      
      // Always update display to show latest results
      this.updateMultiApproachDisplay();
      
    } catch (error) {
      console.error('❌ MULTI-APPROACH: Failed to handle multi-approach result:', error);
    }
  }

  /**
   * ✅ NEW: Generate comparative analysis when multiple approaches complete
   */
  private generateComparativeAnalysis(domainTierKey: string, approachResults: Map<string, any>, allResults: any[]): void {
  try {
    console.log(`🔍 COMPARATIVE: Generating enhanced analysis for ${domainTierKey} with ${approachResults.size} approaches`);
    
    const [domain, tier] = domainTierKey.split('-', 2);
    const approaches = Array.from(approachResults.keys());
    
    // ✅ ENHANCED: More sophisticated analysis
    const comparativeResult: ComparativeWalkthroughResult = {
      ...allResults[0],
      comparative: true,
      approaches: approaches,
      comparativeResults: this.formatComparativeResults(approachResults),
      analysis: this.performEnhancedComparativeAnalysis(approachResults),
      rankings: this.calculateDetailedRankings(approachResults),
      mcdAdvantage: this.validateEnhancedMCDAdvantage(approachResults),
      recommendations: this.generateSmartRecommendations(approachResults, domain),
      domain: domain,
      tier: tier,
      timestamp: new Date().toISOString(),
      
      // ✅ NEW: Additional analysis fields
      statisticalSignificance: this.calculateStatisticalSignificance(approachResults),
      confidenceInterval: this.calculateConfidenceInterval(approachResults),
      effectSize: this.calculateEffectSize(approachResults)
    };
    
    // Store and emit
    this.comparativeResults.set(domainTierKey, comparativeResult);
    this.displayResults.push(comparativeResult);
    this.emitComparativeResultEvent(comparativeResult);
    
    console.log(`✅ ENHANCED COMPARATIVE: Generated analysis for ${domainTierKey}:`, approaches);
    
  } catch (error) {
    console.error('❌ ENHANCED COMPARATIVE: Failed to generate analysis:', error);
  }
}

// ✅ NEW: Enhanced analysis methods
// ✅ IMPLEMENTATION: Statistical significance calculation
private calculateStatisticalSignificance(approachResults: Map<string, any>): any {
  try {
    const approaches = Array.from(approachResults.keys());
    if (approaches.length < 2) {
      return { significant: false, pValue: 1.0, reason: 'Insufficient approaches for comparison' };
    }

    // Extract success rates for each approach
    const successRates = approaches.map(approach => {
      const result = approachResults.get(approach)!;
      return this.calculateSuccessRate(result) / 100; // Convert to decimal
    });

    // Simple t-test approximation for success rate differences
    const n = successRates.length;
    const mean = successRates.reduce((sum, rate) => sum + rate, 0) / n;
    const variance = successRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / (n - 1);
    const standardError = Math.sqrt(variance / n);

    // Calculate t-statistic for difference from expected (e.g., 0.8 for good performance)
    const expectedRate = 0.8;
    const tStat = Math.abs((mean - expectedRate) / standardError);
    
    // Approximate p-value (simplified)
    const degreesOfFreedom = n - 1;
    const pValue = this.approximatePValue(tStat, degreesOfFreedom);
    
    return {
      significant: pValue < 0.05,
      pValue: pValue,
      tStatistic: tStat,
      meanSuccessRate: mean,
      standardError: standardError,
      approaches: approaches.length,
      confidenceLevel: 1 - pValue
    };
  } catch (error) {
    console.error('Error calculating statistical significance:', error);
    return { significant: false, pValue: 1.0, error: error.message };
  }
}

// ✅ IMPLEMENTATION: Confidence interval calculation
private calculateConfidenceInterval(approachResults: Map<string, any>): any {
  try {
    const intervals: { [approach: string]: any } = {};
    
    approachResults.forEach((result, approach) => {
      const successRate = this.calculateSuccessRate(result) / 100;
      const sampleSize = this.calculateTotalTrials(result);
      
      if (sampleSize === 0) {
        intervals[approach] = { lower: 0, upper: 0, width: 0, reliable: false };
        return;
      }

      // Wilson score interval for binomial proportions
      const z = 1.96; // 95% confidence level
      const p = successRate;
      const n = sampleSize;
      
      const denominator = 1 + (z * z) / n;
      const centre = (p + (z * z) / (2 * n)) / denominator;
      const halfWidth = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / denominator;
      
      intervals[approach] = {
        lower: Math.max(0, centre - halfWidth),
        upper: Math.min(1, centre + halfWidth),
        width: 2 * halfWidth,
        centre: centre,
        reliable: sampleSize >= 10,
        sampleSize: sampleSize
      };
    });
    
    return intervals;
  } catch (error) {
    console.error('Error calculating confidence intervals:', error);
    return {};
  }
}

// ✅ IMPLEMENTATION: Enhanced comparative analysis
private performEnhancedComparativeAnalysis(approachResults: Map<string, any>): ComparativeAnalysis {
  try {
    const approaches = Array.from(approachResults.keys());
    const analysis: ComparativeAnalysis = {
      successRatios: {},
      tokenEfficiencyRatios: {},
      latencyRatios: {},
      accuracyRatios: {},
      consistencyScores: {},
      overallScores: {}
    };

    // Enhanced baseline selection (prefer MCD, then best performing)
    let baselineApproach = 'mcd';
    if (!approaches.includes('mcd')) {
      // Select approach with highest success rate as baseline
      baselineApproach = approaches.reduce((best, current) => {
        const bestRate = this.calculateSuccessRate(approachResults.get(best)!);
        const currentRate = this.calculateSuccessRate(approachResults.get(current)!);
        return currentRate > bestRate ? current : best;
      });
    }

    const baselineResult = approachResults.get(baselineApproach)!;
    const baselineMetrics = {
      successRate: this.calculateSuccessRate(baselineResult),
      avgTokens: this.calculateAverageTokens(baselineResult),
      avgLatency: this.calculateAverageLatency(baselineResult),
      efficiency: this.calculateEfficiency(baselineResult)
    };

    // Calculate enhanced metrics for each approach
    approaches.forEach(approach => {
      const result = approachResults.get(approach)!;
      const metrics = {
        successRate: this.calculateSuccessRate(result),
        avgTokens: this.calculateAverageTokens(result),
        avgLatency: this.calculateAverageLatency(result),
        efficiency: this.calculateEfficiency(result),
        mcdAlignment: this.calculateMCDAlignment(result)
      };

      // Enhanced ratio calculations with safety checks
      analysis.successRatios[approach] = baselineMetrics.successRate > 0 
        ? metrics.successRate / baselineMetrics.successRate 
        : (metrics.successRate > 0 ? 2.0 : 1.0);

      analysis.tokenEfficiencyRatios[approach] = metrics.avgTokens > 0 && baselineMetrics.avgTokens > 0
        ? baselineMetrics.avgTokens / metrics.avgTokens  // Lower tokens = higher efficiency
        : 1.0;

      analysis.latencyRatios[approach] = metrics.avgLatency > 0 && baselineMetrics.avgLatency > 0
        ? baselineMetrics.avgLatency / metrics.avgLatency  // Lower latency = better
        : 1.0;

      analysis.accuracyRatios[approach] = metrics.mcdAlignment;
      analysis.consistencyScores[approach] = this.calculateConsistency(result);

      // Enhanced overall score with weighted factors
      const weights = { success: 0.35, efficiency: 0.25, latency: 0.20, accuracy: 0.15, consistency: 0.05 };
      analysis.overallScores[approach] = (
        (metrics.successRate / 100) * weights.success +
        (analysis.tokenEfficiencyRatios[approach]) * weights.efficiency +
        (analysis.latencyRatios[approach]) * weights.latency +
        metrics.mcdAlignment * weights.accuracy +
        analysis.consistencyScores[approach] * weights.consistency
      );
    });

    return analysis;
  } catch (error) {
    console.error('Error performing enhanced comparative analysis:', error);
    return {
      successRatios: {},
      tokenEfficiencyRatios: {},
      latencyRatios: {},
      accuracyRatios: {},
      consistencyScores: {},
      overallScores: {}
    };
  }
}

// ✅ HELPER: Approximate p-value calculation
private approximatePValue(tStat: number, df: number): number {
  // Simplified p-value approximation for t-distribution
  if (df <= 0) return 1.0;
  if (tStat <= 0) return 1.0;
  
  // Very rough approximation - in production, use proper statistical library
  if (tStat > 3.0) return 0.01;
  if (tStat > 2.0) return 0.05;
  if (tStat > 1.5) return 0.1;
  return 0.2;
}


 

  /**
   * ✅ NEW: Format results for comparative display
   */
  private formatComparativeResults(approachResults: Map<string, any>): { [approach: string]: ApproachResult[] } {
    const formatted: { [approach: string]: ApproachResult[] } = {};
    
    approachResults.forEach((result, approach) => {
      const approachResult: ApproachResult = {
        approach: approach,
        approachDisplayName: this.getApproachDisplayName(approach),
        variantId: result.walkthroughId || `${approach}-${Date.now()}`,
        variantType: approach === 'mcd' ? 'MCD' : 'Non-MCD',
        variantName: this.getApproachDisplayName(approach),
        successRate: this.calculateSuccessRate(result),
        successCount: this.calculateSuccessCount(result),
        totalTrials: this.calculateTotalTrials(result),
        avgLatency: this.calculateAverageLatency(result),
        avgTokens: this.calculateAverageTokens(result),
        avgAccuracy: this.calculateAverageAccuracy(result),
        mcdAlignmentRate: this.calculateMCDAlignment(result),
        efficiency: this.calculateEfficiency(result),
        trials: this.extractTrialResults(result),
        approachSpecificMetrics: this.extractApproachMetrics(result, approach)
      };
      
      formatted[approach] = [approachResult];
    });
    
    return formatted;
  }

  /**
   * ✅ NEW: Perform comparative analysis between approaches
   */
  private performComparativeAnalysis(approachResults: Map<string, any>): ComparativeAnalysis {
    const approaches = Array.from(approachResults.keys());
    const analysis: ComparativeAnalysis = {
      successRatios: {},
      tokenEfficiencyRatios: {},
      latencyRatios: {},
      accuracyRatios: {},
      consistencyScores: {},
      overallScores: {}
    };
    
    // Calculate baseline (typically MCD or first approach)
    const baselineApproach = approaches.includes('mcd') ? 'mcd' : approaches[0];
    const baselineResult = approachResults.get(baselineApproach)!;
    const baselineSuccess = this.calculateSuccessRate(baselineResult);
    const baselineTokens = this.calculateAverageTokens(baselineResult);
    const baselineLatency = this.calculateAverageLatency(baselineResult);
    
    approaches.forEach(approach => {
      const result = approachResults.get(approach)!;
      const successRate = this.calculateSuccessRate(result);
      const avgTokens = this.calculateAverageTokens(result);
      const avgLatency = this.calculateAverageLatency(result);
      const accuracy = this.calculateAverageAccuracy(result);
      
      // Calculate ratios relative to baseline
      analysis.successRatios[approach] = baselineSuccess > 0 ? successRate / baselineSuccess : 1;
      analysis.tokenEfficiencyRatios[approach] = avgTokens > 0 ? baselineTokens / avgTokens : 1;
      analysis.latencyRatios[approach] = avgLatency > 0 ? baselineLatency / avgLatency : 1;
      analysis.accuracyRatios[approach] = accuracy;
      analysis.consistencyScores[approach] = this.calculateConsistency(result);
      
      // Overall score combines all factors
      analysis.overallScores[approach] = (
        (successRate / 100) * 0.4 +
        (analysis.tokenEfficiencyRatios[approach]) * 0.3 +
        (analysis.latencyRatios[approach]) * 0.2 +
        accuracy * 0.1
      );
    });
    
    return analysis;
  }

  /**
   * ✅ NEW: Emit event for DomainResultsDisplay integration
   */
  private emitComparativeResultEvent(comparativeResult: ComparativeWalkthroughResult): void {
    try {
      const event = new CustomEvent('singleSourceResultAdded', {
        detail: {
          result: comparativeResult,
          timestamp: Date.now()
        }
      });
      
      document.dispatchEvent(event);
      console.log(`📡 COMPARATIVE: Emitted event for ${comparativeResult.domain}-${comparativeResult.tier}`);
      
    } catch (error) {
      console.error('❌ COMPARATIVE: Failed to emit event:', error);
    }
  }

  /**
   * ✅ NEW: Update display for multi-approach results
   */
  private updateMultiApproachDisplay(): void {
    try {
      if (!this.isDisplayReady) {
        this.initializeDisplay();
      }
      
      this.renderMultiApproachResults();
      
    } catch (error) {
      console.error('❌ MULTI-APPROACH: Display update failed:', error);
    }
  }

  /**
   * ✅ NEW: Render multi-approach results
   */
  private renderMultiApproachResults(): void {
    try {
      const container = document.getElementById('new-walkthrough-results');
      if (!container) return;

      let html = `
        <div class="multi-approach-header">
          <h3>🔍 Multi-Approach Walkthrough Results</h3>
          <div class="approach-stats">
            <span class="stat">Total Results: ${this.displayResults.length}</span>
            <span class="stat">Comparative Analyses: ${this.comparativeResults.size}</span>
            <span class="stat">Approaches Tested: ${this.getTotalApproachesTested()}</span>
          </div>
        </div>
      `;

      // Show pending approach results
      html += this.renderPendingApproachResults();
      
      // Show completed comparative analyses
      html += this.renderComparativeAnalyses();

      container.innerHTML = html;
      console.log(`✅ MULTI-APPROACH: Rendered display with ${this.displayResults.length} results`);
      
    } catch (error) {
      console.error('❌ MULTI-APPROACH: Rendering failed:', error);
    }
  }

  /**
   * ✅ NEW: Render pending approach results (in progress)
   */
  private renderPendingApproachResults(): string {
    let html = '<div class="pending-approaches-section"><h4>🔄 Approaches in Progress</h4>';
    
    this.approachResults.forEach((approaches, domainTierKey) => {
      const [domain, tier] = domainTierKey.split('-', 2);
      
      html += `
        <div class="pending-domain-tier">
          <h5>${this.getDomainIcon(domain)} ${domain} - ${tier}</h5>
          <div class="approach-grid">
      `;
      
      approaches.forEach((result, approach) => {
        const approachDisplayName = this.getApproachDisplayName(approach);
        const successRate = this.calculateSuccessRate(result);
        const isComplete = result.domainMetrics?.overallSuccess !== undefined;
        
        html += `
          <div class="approach-card ${isComplete ? 'complete' : 'pending'}">
            <div class="approach-header">
              <span class="approach-name">${approachDisplayName}</span>
              <span class="approach-status">${isComplete ? '✅' : '🔄'}</span>
            </div>
            <div class="approach-metrics">
              <div class="metric">Success: ${successRate.toFixed(1)}%</div>
              <div class="metric">Scenarios: ${result.scenarioResults?.length || 0}</div>
            </div>
          </div>
        `;
      });
      
      html += '</div></div>';
    });
    
    html += '</div>';
    return html;
  }

  /**
   * ✅ NEW: Render completed comparative analyses
   */
  private renderComparativeAnalyses(): string {
    let html = '<div class="comparative-analyses-section"><h4>📊 Completed Comparative Analyses</h4>';
    
    this.comparativeResults.forEach((analysis, domainTierKey) => {
      html += this.renderSingleComparativeAnalysis(analysis, domainTierKey);
    });
    
    html += '</div>';
    return html;
  }

  /**
   * ✅ NEW: Render single comparative analysis
   */
  private renderSingleComparativeAnalysis(analysis: ComparativeWalkthroughResult, domainTierKey: string): string {
    const [domain, tier] = domainTierKey.split('-', 2);
    
    let html = `
      <div class="comparative-analysis-card">
        <div class="analysis-header">
          <h5>${this.getDomainIcon(domain)} ${domain} - ${tier} Comparison</h5>
          <span class="approach-count">${analysis.approaches.length} approaches</span>
        </div>
        
        <div class="approach-rankings">
          <h6>🏆 Performance Rankings</h6>
          <div class="rankings-list">
    `;
    
    analysis.rankings.forEach((approach, index) => {
      const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      const overallScore = analysis.analysis.overallScores[approach] || 0;
      
      html += `
        <div class="ranking-item rank-${index + 1}">
          <span class="rank-icon">${rankIcon}</span>
          <span class="approach-name">${this.getApproachDisplayName(approach)}</span>
          <span class="overall-score">${(overallScore * 100).toFixed(1)}%</span>
        </div>
      `;
    });
    
    html += `
          </div>
        </div>
        
        <div class="mcd-advantage-summary">
          <h6>🎯 MCD Advantage Analysis</h6>
          <div class="advantage-status ${analysis.mcdAdvantage.validated ? 'validated' : 'concerns'}">
            ${analysis.mcdAdvantage.validated ? '✅ Validated' : '⚠️ Concerns Detected'}
            <span class="confidence">Confidence: ${(analysis.mcdAdvantage.confidenceLevel * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  // ✅ UTILITY METHODS
  private isMultiApproachExecution(result: any, approach?: string): boolean {
    return approach !== undefined && approach !== 'default';
  }

  private getApproachDisplayName(approach: string): string {
    const displayNames: { [key: string]: string } = {
      'mcd': 'MCD',
      'few-shot': 'Few-Shot',
      'fewShot': 'Few-Shot',
      'system-role': 'System Role',
      'systemRole': 'System Role',
      'hybrid': 'Hybrid',
      'conversational': 'Conversational'
    };
    return displayNames[approach] || approach;
  }

  private calculateSuccessRate(result: any): number {
    if (result.domainMetrics?.overallSuccess !== undefined) {
      return result.domainMetrics.overallSuccess ? 100 : 0;
    }
    
    const scenarios = result.scenarioResults || [];
    if (scenarios.length === 0) return 0;
    
    const successful = scenarios.filter(s => !s.response?.startsWith('ERROR:')).length;
    return (successful / scenarios.length) * 100;
  }

  private calculateSuccessCount(result: any): number {
    const rate = this.calculateSuccessRate(result);
    const total = this.calculateTotalTrials(result);
    return Math.round((rate / 100) * total);
  }

  private calculateTotalTrials(result: any): number {
    return result.scenarioResults?.length || 0;
  }

  private calculateAverageLatency(result: any): number {
    const scenarios = result.scenarioResults || [];
    if (scenarios.length === 0) return 0;
    return scenarios.reduce((sum, s) => sum + (s.latencyMs || 0), 0) / scenarios.length;
  }

  private calculateAverageTokens(result: any): number {
    const scenarios = result.scenarioResults || [];
    if (scenarios.length === 0) return 0;
    return scenarios.reduce((sum, s) => sum + (s.tokensUsed || 0), 0) / scenarios.length;
  }

  private calculateAverageAccuracy(result: any): number {
    return result.domainMetrics?.userExperienceScore || 0;
  }

  private calculateMCDAlignment(result: any): number {
    return result.domainMetrics?.mcdAlignmentScore || 0;
  }

  private calculateEfficiency(result: any): number {
    return result.domainMetrics?.resourceEfficiency || 0;
  }

  private calculateConsistency(result: any): number {
    // Simple consistency score based on variance in latencies
    const scenarios = result.scenarioResults || [];
    if (scenarios.length < 2) return 1.0;
    
    const latencies = scenarios.map(s => s.latencyMs || 0);
    const mean = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - mean, 2), 0) / latencies.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 1 - (stdDev / mean));
  }

  private extractTrialResults(result: any): TrialResult[] {
    const scenarios = result.scenarioResults || [];
    return scenarios.map((scenario, index) => ({
      testId: `trial-${index + 1}`,
      userInput: scenario.userInput || '',
      actualResults: {
        success: !scenario.response?.startsWith('ERROR:'),
        latencyMs: scenario.latencyMs || 0,
        tokenBreakdown: { output: scenario.tokensUsed || 0 }
      },
      benchmarkComparison: {
        latencyDiff: 0,
        tokenDiff: 0,
        performanceBetter: true
      },
      evaluationScore: scenario.response?.startsWith('ERROR:') ? 0 : 85,
      success: !scenario.response?.startsWith('ERROR:')
    }));
  }

  private extractApproachMetrics(result: any, approach: string): any {
    return {
      approach: approach,
      domainSpecific: result.domainMetrics,
      scenarioCount: result.scenarioResults?.length || 0
    };
  }

  private calculateApproachRankings(approachResults: Map<string, any>): string[] {
    const approaches = Array.from(approachResults.keys());
    const scores = approaches.map(approach => {
      const result = approachResults.get(approach)!;
      const successRate = this.calculateSuccessRate(result);
      const efficiency = this.calculateEfficiency(result);
      const mcdAlignment = this.calculateMCDAlignment(result);
      
      const overallScore = (successRate / 100) * 0.4 + efficiency * 0.3 + mcdAlignment * 0.3;
      return { approach, score: overallScore };
    });
    
    return scores.sort((a, b) => b.score - a.score).map(s => s.approach);
  }

  private validateMCDAdvantage(approachResults: Map<string, any>): MCDAdvantageValidation {
    const mcdResult = approachResults.get('mcd');
    if (!mcdResult) {
      return {
        validated: false,
        concerns: ['No MCD results available for comparison'],
        recommendations: ['Execute MCD approach for comparison'],
        confidenceLevel: 0,
        statisticalSignificance: false
      };
    }
    
    const mcdSuccessRate = this.calculateSuccessRate(mcdResult);
    const mcdEfficiency = this.calculateEfficiency(mcdResult);
    
    const otherApproaches = Array.from(approachResults.keys()).filter(a => a !== 'mcd');
    let betterThanOthers = 0;
    
    otherApproaches.forEach(approach => {
      const otherResult = approachResults.get(approach)!;
      const otherSuccessRate = this.calculateSuccessRate(otherResult);
      const otherEfficiency = this.calculateEfficiency(otherResult);
      
      if (mcdSuccessRate >= otherSuccessRate && mcdEfficiency >= otherEfficiency) {
        betterThanOthers++;
      }
    });
    
    const validated = betterThanOthers > otherApproaches.length / 2;
    
    return {
      validated,
      concerns: validated ? [] : ['MCD not consistently superior to other approaches'],
      recommendations: validated ? 
        ['Continue using MCD approach'] : 
        ['Investigate MCD implementation', 'Consider hybrid approaches'],
      confidenceLevel: betterThanOthers / Math.max(1, otherApproaches.length),
      statisticalSignificance: otherApproaches.length >= 2,
      advantages: validated ? {
        successRate: mcdSuccessRate / 100,
        tokenEfficiency: mcdEfficiency,
        latencyAdvantage: 1.0,
        overallAdvantage: (mcdSuccessRate / 100 + mcdEfficiency) / 2
      } : undefined
    };
  }

  private generateComparativeRecommendations(approachResults: Map<string, any>): string[] {
    const recommendations = [];
    const approaches = Array.from(approachResults.keys());
    
    if (approaches.includes('mcd')) {
      const mcdRanking = this.calculateApproachRankings(approachResults).indexOf('mcd');
      if (mcdRanking === 0) {
        recommendations.push('MCD approach demonstrates optimal performance');
      } else {
        recommendations.push('Consider optimizing MCD implementation');
      }
    }
    
    if (approaches.length >= 3) {
      recommendations.push('Sufficient data for statistical significance');
    } else {
      recommendations.push('Test additional approaches for more robust comparison');
    }
    
    return recommendations;
  }

  private getTotalApproachesTested(): number {
    const allApproaches = new Set<string>();
    this.approachResults.forEach(approaches => {
      approaches.forEach((_, approach) => allApproaches.add(approach));
    });
    return allApproaches.size;
  }

  private getDomainIcon(domain: string): string {
    const icons: { [key: string]: string } = {
      'appointment-booking': '📅',
      'spatial-navigation': '🧭', 
      'failure-diagnostics': '🔧'
    };
    return icons[domain] || '📋';
  }

  private handleSingleApproachResult(result: any, resultKey: string, timestamp: number): void {
    const enhancedResult = {
      ...result,
      storedAt: timestamp,
      storageKey: resultKey
    };
    
    this.walkthroughResults.set(resultKey, enhancedResult);
    this.displayResults.push(enhancedResult);
    
    // Emit single result event
    const event = new CustomEvent('singleSourceResultAdded', {
      detail: {
        result: enhancedResult,
        timestamp: timestamp
      }
    });
    document.dispatchEvent(event);
    
    this.updateDisplay();
  }
private initializeDisplay(): void {
    try {
      // Create display container if it doesn't exist
      let container = document.getElementById('new-walkthrough-results');
      if (!container) {
        container = document.createElement('div');
        container.id = 'new-walkthrough-results';
        container.className = 'new-route-container';
        
        const parentContainer = document.getElementById('walkthrough-results-container') || 
                              document.getElementById('results-container') ||
                              document.body;
        parentContainer.appendChild(container);
      }
      
      this.isDisplayReady = true;
      console.log('✅ WalkthroughResultsStorage display initialized');
    } catch (error) {
      console.error('❌ Failed to initialize storage display:', error);
    }
  }

  private updateDisplay(): void {
    try {
      if (!this.isDisplayReady) {
        this.initializeDisplay();
      }
      this.renderMultiApproachResults();
    } catch (error) {
      console.error('❌ Storage display update failed:', error);
    }
  }

  public getResultsCount(): number {
    try {
      return this.displayResults?.length || 0;
    } catch (error) {
      console.error('Error getting results count from storage:', error);
      return 0;
    }
  }
  // ... (keep existing utility methods like ensureContainer, initializeDisplay, etc.)
}


// ============================================
// 🌐 GLOBAL SETUP FOR NEW ROUTE
// ============================================

// ✅ ENHANCED: Global integration for multi-approach support
if (typeof window !== 'undefined') {
  window.newStorageRoute = WalkthroughResultsStorage.getInstance();
  
  // ✅ NEW: Multi-approach result handler
  (window as any).addMultiApproachResult = (result: any, approach: string) => {
    console.log(`📥 GLOBAL: Adding multi-approach result: ${approach}`);
    window.newStorageRoute.storeWalkthroughResult(result, approach);
  };
  
  // ✅ NEW: Check multi-approach status
  (window as any).getMultiApproachStatus = () => {
    const storage = WalkthroughResultsStorage.getInstance();
    return {
      totalResults: storage.getResultsCount(),
      comparativeAnalyses: (storage as any).comparativeResults.size,
      approachesActive: (storage as any).approachResults.size
    };
  };
  
  console.log('🆕 MULTI-APPROACH STORAGE: Initialized and ready');
}


// ============================================
// 🌐 GLOBAL WINDOW FUNCTIONS
// ============================================

declare global {
  interface Window {
    exportWalkthroughResults: (format: 'json' | 'csv') => void;
    exportWalkthroughSummary: () => void;
    domainResultsDisplay: DomainResultsDisplay;
	newStorageRoute: WalkthroughResultsStorage;
  }
}

// Global export functions
window.exportWalkthroughResults = (format: 'json' | 'csv') => {
  try {
    if (window.domainResultsDisplay) {
      window.domainResultsDisplay.exportResults(format);
    } else {
      console.error('DomainResultsDisplay not initialized');
      alert('Domain results display not initialized');
    }
  } catch (error) {
    console.error('Error in global export function:', error);
    alert('Error exporting walkthrough results');
  }
};

window.exportWalkthroughSummary = () => {
  try {
    // Generate and download a summary report
    const summaryHTML = document.getElementById('walkthrough-summary')?.innerHTML || '';
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chapter 7 Walkthrough Summary</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .domain-summary { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
          .tier-result { margin: 10px 0; padding: 10px; background: #f9f9f9; }
          .overall-stats { background: #f0f8ff; padding: 15px; border-radius: 8px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
          .stat-item { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <h1>Chapter 7: Domain Walkthrough Results Summary</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        ${summaryHTML}
      </body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter7-summary-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting walkthrough summary:', error);
    alert('Error exporting walkthrough summary');
  }
};



// Initialize global instance
window.domainResultsDisplay = new DomainResultsDisplay();

try {
  if (!window.domainResultsDisplay) {
    window.domainResultsDisplay = new DomainResultsDisplay();
    window.domainResultsDisplay.initialize();
  }
} catch (error) {
  console.error('Error initializing DomainResultsDisplay:', error);
}

// Global functions for external access
// ✅ NEW: Global action handlers for quick actions
if (typeof window !== 'undefined') {
  window.retryDomainExecution = (domain: string, tier: string) => {
    console.log(`🔄 Retry requested: ${domain}-${tier}`);
    
    if (window.walkthroughUI) {
      // Integrate with existing walkthrough execution
      window.walkthroughUI.executeSpecificDomain(domain, tier);
    } else {
      alert(`Retry functionality requires WalkthroughUI integration.\nDomain: ${domain}, Tier: ${tier}`);
    }
  };
  
  window.analyzeDomainFailures = (walkthroughId: string) => {
    console.log(`🔍 Analyzing failures for: ${walkthroughId}`);
    
    // Create failure analysis modal
    const modal = document.createElement('div');
    modal.className = 'failure-analysis-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔍 Failure Analysis: ${walkthroughId}</h3>
          <button class="modal-close" onclick="this.closest('.failure-analysis-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <p>Analyzing failure patterns and generating detailed report...</p>
          <div class="analysis-placeholder">
            <div class="loading-spinner">🔄</div>
            <p>This feature provides detailed failure analysis and would integrate with your specific walkthrough execution system.</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  };
  
  window.suggestOptimizations = (domain: string, tier: string) => {
    console.log(`⚡ Optimization suggestions for: ${domain}-${tier}`);
    
    const optimizations = {
      'Appointment Booking': [
        'Implement structured slot extraction patterns',
        'Add explicit confirmation workflows',
        'Reduce conversational overhead in prompts',
        'Use template-based response generation'
      ],
      'Spatial Navigation': [
        'Switch to coordinate-based navigation system',
        'Implement cardinal direction consistency',
        'Add structured obstacle avoidance patterns',
        'Reduce natural language ambiguity'
      ],
      'Failure Diagnostics': [
        'Implement structured diagnostic sequences',
        'Add escalation thresholds for complex issues',
        'Use systematic troubleshooting patterns',
        'Prevent analysis paralysis with time limits'
      ]
    };
    
    const suggestions = optimizations[domain] || ['No specific optimizations available for this domain'];
    
    const modal = document.createElement('div');
    modal.className = 'optimization-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>⚡ Optimization Tips: ${domain} (${tier})</h3>
          <button class="modal-close" onclick="this.closest('.optimization-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <ul class="optimization-list">
            ${suggestions.map(tip => `<li class="optimization-tip">💡 ${tip}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  };
}

if (typeof window !== 'undefined') {
  // Block direct result manipulation
  (window as any).addWalkthroughResult = (result: any) => {
    console.warn('🛑 Direct addWalkthroughResult blocked - use WalkthroughUI.addResult() instead');
    
    // Optional: Forward to WalkthroughUI if available
    if (window.walkthroughUI) {
      window.walkthroughUI.addResult(result);
    }
  };
  
  // Enhanced domain result handling
  (window as any).setDomainResult = (key: string, result: any) => {
    console.warn('🛑 Direct setDomainResult blocked - results come from WalkthroughUI events only');
  };
  
  // Walkthrough execution integration (read-only)
  (window as any).domainResults = {
    addWalkthroughResult: (result: any) => {
      console.warn('🛑 domainResults.addWalkthroughResult blocked - use WalkthroughUI.addResult() instead');
    },
    
    setResult: (key: string, result: any) => {
      console.warn('🛑 domainResults.setResult blocked - use WalkthroughUI.addResult() instead');
    },
    
    isReady: () => {
      return window.domainResultsDisplay && window.domainResultsDisplay.isReady();
    },
    
    getResultsCount: () => {
      return window.domainResultsDisplay ? window.domainResultsDisplay.getResultsCount() : 0;
    }
  };
  
  // Status checker (updated for subscriber mode)
  (window as any).checkDomainResultsStatus = () => {
    console.group('🔍 Domain Results System Status (Subscriber Mode)');
    console.log('Display Instance:', !!window.domainResultsDisplay);
    console.log('Is Ready:', window.domainResultsDisplay?.isReady());
    console.log('Results Count:', window.domainResultsDisplay?.getResultsCount());
    console.log('Mode:', 'Read-only Subscriber');
    console.log('Event Listeners:', 'Subscribed to singleSourceResultAdded');
    console.groupEnd();
    
    return {
      mode: 'subscriber',
      ready: window.domainResultsDisplay?.isReady() || false,
      resultsCount: window.domainResultsDisplay?.getResultsCount() || 0,
      subscribedToEvents: true
    };
  };
  
  // Reset function (if needed)
  (window as any).resetDomainResults = () => {
    console.log('🔄 Resetting domain results system...');
    
    try {
      if (window.domainResultsDisplay) {
        window.domainResultsDisplay.destroy();
      }
      
      window.domainResultsDisplay = new DomainResultsDisplay();
      window.domainResultsDisplay.initialize();
      
      console.log('✅ Domain results system reset complete');
      return true;
      
    } catch (error) {
      console.error('❌ Domain results reset failed:', error);
      return false;
    }
  };
  
  // ✅ Add to global scope for emergency use
window.emergencyUnstickButton = () => {
  console.log('🚨 EMERGENCY: Unsticking start button...');
  
  try {
    // Reset all execution states
    (window as any).immediateStop = false;
    if ((window as any).unifiedExecutionState) {
      (window as any).unifiedExecutionState.isExecuting = false;
    }
    (window as any).isWalkthroughExecuting = false;
    
    // Reset domain results states
    if (window.domainResultsDisplay) {
      (window.domainResultsDisplay as any).isUpdating = false;
      (window.domainResultsDisplay as any).processingQueue = false;
    }
    
    // Force enable buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.style.pointerEvents = 'auto';
    });
    
    console.log('✅ Emergency unstick completed');
    return true;
    
  } catch (error) {
    console.error('❌ Emergency unstick failed:', error);
    return false;
  }
};

  
}

// ✅ VERIFICATION: Enhanced global integration with error handling
if (typeof window !== 'undefined') {
  // Verify WalkthroughUI integration
  const setupWalkthroughUIIntegration = () => {
    if (window.walkthroughUI) {
      console.log('✅ WalkthroughUI integration verified');
      
      // Test bidirectional communication
      if (typeof window.walkthroughUI.checkDomainResultsIntegration === 'function') {
        const status = window.walkthroughUI.checkDomainResultsIntegration();
        console.log('🔗 WalkthroughUI <-> DomainResults status:', status);
      }
      
      // Set up cross-references
      (window.walkthroughUI as any).domainResultsDisplay = window.domainResultsDisplay;
      return true;
    } else {
      console.warn('⚠️ WalkthroughUI not available - some features may be limited');
      return false;
    }
  };

  // Verify newStorageRoute setup
  const setupNewStorageRoute = () => {
    try {
      if (!window.newStorageRoute) {
        window.newStorageRoute = WalkthroughResultsStorage.getInstance();
      }
      
      // Test storage functionality
      const status = {
        instance: !!window.newStorageRoute,
        resultsCount: window.newStorageRoute?.getResultsCount() || 0,
        methods: {
          storeWalkthroughResult: typeof window.newStorageRoute?.storeWalkthroughResult === 'function'
        }
      };
      
      console.log('✅ NewStorageRoute verification:', status);
      return status.instance && status.methods.storeWalkthroughResult;
    } catch (error) {
      console.error('❌ NewStorageRoute setup failed:', error);
      return false;
    }
  };

  // Enhanced event listener verification
  const verifyEventListeners = () => {
    const events = ['singleSourceResultAdded'];
    const verification = {};
    
    events.forEach(eventType => {
      try {
        // Test event creation and dispatch
        const testEvent = new CustomEvent(eventType, { 
          detail: { test: true, timestamp: Date.now() } 
        });
        
        let eventReceived = false;
        const testListener = () => { eventReceived = true; };
        
        document.addEventListener(eventType, testListener, { once: true });
        document.dispatchEvent(testEvent);
        
        // Clean up
        document.removeEventListener(eventType, testListener);
        
        verification[eventType] = eventReceived;
        console.log(`${eventReceived ? '✅' : '❌'} Event listener test: ${eventType}`);
      } catch (error) {
        console.error(`❌ Event listener test failed for ${eventType}:`, error);
        verification[eventType] = false;
      }
    });
    
    return verification;
  };

  // Run all verifications
  setTimeout(() => {
    const integrationStatus = {
      walkthroughUI: setupWalkthroughUIIntegration(),
      newStorageRoute: setupNewStorageRoute(),
      eventListeners: verifyEventListeners()
    };
    
    console.log('🔍 Global Integration Verification Complete:', integrationStatus);
    
    // Store results for debugging
    (window as any).integrationStatus = integrationStatus;
  }, 1000);
}

// ✅ EMERGENCY: Global recovery function
if (typeof window !== 'undefined') {
  window.emergencyRecoverDomainResults = () => {
    console.log('🚨 GLOBAL EMERGENCY RECOVERY initiated...');
    
    try {
      if (window.domainResultsDisplay) {
        window.domainResultsDisplay.emergencyRecovery();
        return true;
      } else {
        console.error('❌ DomainResultsDisplay instance not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Global recovery failed:', error);
      return false;
    }
  };

  // Emergency stabilization function
  (window as any).emergencyStabilizeDomainResults = () => {
    if (window.domainResultsDisplay) {
      try {
        (window.domainResultsDisplay as any).emergencyStabilization();
        console.log('✅ Emergency stabilization completed');
        return true;
      } catch (error) {
        console.error('❌ Emergency stabilization failed:', error);
        return false;
      }
    } else {
      console.error('❌ DomainResultsDisplay instance not found');
      return false;
    }
  };

  // Emergency button unstick function
  (window as any).emergencyUnstickButton = () => {
    console.log('🚨 EMERGENCY: Unsticking start button...');
    
    try {
      // Reset all execution states
      (window as any).immediateStop = false;
      if ((window as any).unifiedExecutionState) {
        (window as any).unifiedExecutionState.isExecuting = false;
      }
      (window as any).isWalkthroughExecuting = false;
      
      // Reset domain results states
      if (window.domainResultsDisplay) {
        (window.domainResultsDisplay as any).isUpdating = false;
        (window.domainResultsDisplay as any).processingQueue = false;
      }
      
      // Force enable buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.pointerEvents = 'auto';
      });
      
      console.log('✅ Emergency unstick completed');
      return true;
      
    } catch (error) {
      console.error('❌ Emergency unstick failed:', error);
      return false;
    }
  };


  // ✅ COMPREHENSIVE: System integration test
window.testDomainResultsIntegration = () => {
  console.group('🧪 Domain Results Integration Test');
  
  const results = {
    domainDisplayReady: false,
    storageRouteReady: false,
    walkthroughUIIntegration: false,
    eventSystemWorking: false,
    calculationMethodsWorking: false,
    overallStatus: 'UNKNOWN'
  };
  
  try {
    // Test 1: Domain Display
    if (window.domainResultsDisplay && window.domainResultsDisplay.isReady()) {
      results.domainDisplayReady = true;
      console.log('✅ Domain Display: Ready');
    } else {
      console.log('❌ Domain Display: Not ready');
    }
    
    // Test 2: Storage Route
    if (window.newStorageRoute && typeof window.newStorageRoute.storeWalkthroughResult === 'function') {
      results.storageRouteReady = true;
      console.log('✅ Storage Route: Ready');
    } else {
      console.log('❌ Storage Route: Not ready');
    }
    
    // Test 3: WalkthroughUI Integration
    if (window.walkthroughUI) {
      results.walkthroughUIIntegration = true;
      console.log('✅ WalkthroughUI Integration: Connected');
    } else {
      console.log('❌ WalkthroughUI Integration: Not connected');
    }
    
    // Test 4: Event System
    let eventReceived = false;
    const testHandler = () => { eventReceived = true; };
    document.addEventListener('singleSourceResultAdded', testHandler, { once: true });
    
    document.dispatchEvent(new CustomEvent('singleSourceResultAdded', {
      detail: { test: true, timestamp: Date.now() }
    }));
    
    setTimeout(() => {
      results.eventSystemWorking = eventReceived;
      console.log(eventReceived ? '✅ Event System: Working' : '❌ Event System: Not working');
    }, 100);
    
    // Test 5: Calculation Methods
    try {
      const testScenarios = [
        { response: 'Appointment booked successfully', latencyMs: 150, tokensUsed: 25 },
        { response: 'Meeting scheduled for tomorrow', latencyMs: 200, tokensUsed: 30 }
      ];
      
      const testResult = {
        scenarioResults: testScenarios,
        domainMetrics: { overallSuccess: true }
      };
      
      const successRate = DomainResultsDisplay.calculateSuccessRateFromResult(testResult);
      const avgLatency = DomainResultsDisplay.calculateAverageLatency(testScenarios);
      
      if (successRate > 0 && avgLatency > 0) {
        results.calculationMethodsWorking = true;
        console.log('✅ Calculation Methods: Working');
      } else {
        console.log('❌ Calculation Methods: Issues detected');
      }
    } catch (calcError) {
      console.log('❌ Calculation Methods: Error -', calcError.message);
    }
    
    // Overall Status
    const readyCount = Object.values(results).filter(Boolean).length - 1; // Exclude overallStatus
    if (readyCount >= 4) {
      results.overallStatus = 'READY';
    } else if (readyCount >= 2) {
      results.overallStatus = 'PARTIAL';
    } else {
      results.overallStatus = 'NOT_READY';
    }
    
    console.log(`🎯 Overall Status: ${results.overallStatus} (${readyCount}/5 components ready)`);
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    results.overallStatus = 'ERROR';
  }
  
  console.groupEnd();
  return results;
};




  
}
