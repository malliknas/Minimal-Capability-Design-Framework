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
type TimeoutID = ReturnType<typeof setTimeout>;
// ============================================
// 🎯 UNIFIED DOMAIN RESULTS DISPLAY CLASS (SINGLE DEFINITION)
// ============================================
 

export class DomainResultsDisplay {
  private results: EnhancedWalkthroughResult[] = [];
   private groupedResults: { [domain: string]: { [tier: string]: EnhancedWalkthroughResult[] } } = {};
  private options: DomainResultsDisplayOptions;
    private isInitialized: boolean = false;
	private subscribersInitialized: boolean = false;
  private isUpdating: boolean = false;
  private updateCount: number = 0;
  private readonly MAX_UPDATES_PER_SECOND = 3;
  private lastUpdateReset: number = Date.now();
   // ✅ FIX: More conservative memory management
private static readonly MEMORY_WARNING_THRESHOLD = 300; // Increased from 200
private static readonly MEMORY_CLEANUP_THRESHOLD = 500; // Much higher threshold
private updateTimeout: TimeoutID | null = null;
private lastUpdateTime: number = 0;

private readonly UPDATE_THROTTLE_MS = 1000; // 1 second instead of 200ms
private static readonly MAX_RESULTS = 200;// Increased from 100 - less aggressive cleanup
private activeEventListeners: Map<string, { element: Element; event: string; handler: EventListener }> = new Map();

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
 * ✅ NEW: Performance state analyzer
 */
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
/**
 * Start ultra-conservative memory management
 */
private startPeriodicMemoryManagement(): void {
  // Ultra-conservative - every 15 minutes
  setInterval(() => {
    // Only run if NOT executing trials
    if (!(window as any).unifiedExecutionState?.isExecuting && 
        !(window as any).immediateStop) {
      this.manageResultsMemory(); // ✅ This calls both result cleanup AND cache cleanup
    }
  }, 900000); // 15 minutes - very conservative
  
  console.log('🧹 Ultra-conservative domain results memory management started');
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
public initialize(): void {
  try {
    if (this.isInitialized) {
      console.log('DomainResultsDisplay already initialized');
      return;
    }

    console.log('🔧 Initializing DomainResultsDisplay with multi-approach support...');
    
    // ✅ INITIALIZE: Approach results storage
    this.approachResults = new Map();
    
    this.ensureCSS();
    this.injectEmergencyButtonCSS();
    this.setupContainers();
    this.ensureEssentialUI();
    this.attachEventListeners();
    this.setupGlobalFunctions();
    this.setupErrorRecoverySystem();
    this.ensureWalkthroughIntegration();
    this.initializeSubscribers();
    
    this.isInitialized = true;
    
    console.log('✅ DomainResultsDisplay initialized with multi-approach support');
    
    if (this.results.length > 0 || this.approachResults.size > 0) {
      this.throttledUpdate();
    }
    this.startPeriodicMemoryManagement();
  } catch (error) {
    console.error('Error initializing DomainResultsDisplay:', error);
    this.handleError('Initialization failed', error);
    this.basicInitialization();
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

private attachEventListeners(): void {
    try {
        // Clean up existing listeners first
        this.cleanupEventListeners();
        
        // Attach with tracking
        document.addEventListener('click', this.boundGlobalClick);
        this.activeEventListeners.set('global-click', {
            element: document,
            event: 'click',
            handler: this.boundGlobalClick
        });
        
        // Set up periodic cleanup
        this.startEventListenerMonitoring();
        
    } catch (error) {
        console.error('Error attaching event listeners:', error);
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


// ✅ FIXED: Complete subscriber implementation with guard
private initializeSubscribers(): void {
  try {
    // ✅ GUARD: Prevent multiple event listener registration
    if (this.subscribersInitialized) {
      console.log('⚠️ Subscribers already initialized, skipping...');
      return;
    }
    
    // Subscribe to single source events from WalkthroughUI
    document.addEventListener('singleSourceResultAdded', (event: CustomEvent) => {
      this.handleResultFromSingleSource(event);
    });
    
    this.subscribersInitialized = true; // ✅ SET FLAG
    console.log('✅ DomainResults subscribed to single source events');
    
  } catch (error) {
    console.error('❌ Failed to initialize domain results subscribers:', error);
  }
}


/**
 * ✅ FIXED: Handle results from single source with proper multi-approach support
 */
private handleResultFromSingleSource(event: CustomEvent): void {
  try {
    const { result, timestamp } = event.detail;
    
    if (!result || !this.validateWalkthroughResult(result)) {
      console.warn('⚠️ Invalid result received from single source:', result);
      return;
    }

    // ✅ FIX: Check for approach-specific results
    const approach = result.approach || result.approachType || 'default';
    const domainTierKey = `${result.domain}-${result.tier}`;
    
    // ✅ NEW: Store with approach context
    this.storeApproachResult(result, approach, domainTierKey, timestamp);
    
    this.scheduleDisplayUpdate();
    
    console.log(`📰 DomainResults received: ${domainTierKey}-${approach}`);
    
  } catch (error) {
    console.error('❌ Error handling result from single source:', error);
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
private displayUpdateTimeout: TimeoutID | null = null;

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


/**
 * Handle auto-scroll functionality
 */
private handleAutoScroll(): void {
  try {
    const autoScrollWalkthroughs = document.getElementById('autoScrollWalkthroughs') as HTMLInputElement;
    if (autoScrollWalkthroughs?.checked) {
      // Scroll to the latest result
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
  let timeout: ReturnType<typeof setTimeout>; // ✅ Browser compatible
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
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
private validateWalkthroughResult(result: any): boolean {
  try {
    // Basic structure validation
    if (!result || typeof result !== 'object') {
      console.error('Result must be an object');
      return false;
    }

    // ✅ ADD: Handle undefined results specifically
    if (result === undefined) {
      console.warn('⚠️ Result is undefined, rejecting');
      return false;
    }

    // Required fields validation
    const requiredFields = ['domain', 'tier', 'walkthroughId'];
    for (const field of requiredFields) {
      if (!result[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // ✅ ADD: Flexible domainMetrics validation (allows missing fields)
   if (!result.domainMetrics) {
  console.warn(`Missing domainMetrics, creating default for: ${result.walkthroughId}`);
  result.domainMetrics = {
    overallSuccess: false,
    mcdAlignmentScore: 0,
    userExperienceScore: 0,
    resourceEfficiency: 0,
    fallbackTriggered: true
  };
} else {
  // ✅ VALIDATE: Sanitize existing metrics to prevent overflow
  result.domainMetrics = this.sanitizeDomainMetrics(result.domainMetrics, result.walkthroughId);
}

    return true;
  } catch (error) {
    console.error('Error validating walkthrough result:', error);
    return false;
  }
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
/**
 * Ensure required CSS is available
 */
/**
 * Ensure required CSS is available
 */
private ensureCSS(): void {
  try {
    if (document.getElementById('domain-results-styles')) return;
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
      
      .trial-item {
        border-left: 3px solid #6c757d;
        padding: 8px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 4px;
        font-size: 0.85rem;
      }
      
      .trial-item.success {
        border-left-color: #28a745;
      }
      
      .trial-item.failure {
        border-left-color: #dc3545;
      }
      
      .trial-header {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        margin-bottom: 4px;
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
    `;
    document.head.appendChild(style);
    console.log('✅ Domain results CSS injected successfully with horizontal approach fixes');
  } catch (error) {
    console.error('Error injecting CSS:', error);
  }
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
private throttledUpdate(): void {
  // ✅ IMMEDIATE GUARD: Block if updating
  if (this.isUpdating) {
    console.log('🛑 Throttled update blocked - already updating');
    return;
  }
  
  const now = Date.now();
  
  // Clear any existing timeout
  if (this.updateTimeout) {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }

  // Check if enough time passed for immediate update
  if (now - this.lastUpdateTime >= this.UPDATE_THROTTLE_MS) {
    this.performUpdate();
    this.lastUpdateTime = now;
  } else {
    // Schedule delayed update
    const delay = this.UPDATE_THROTTLE_MS - (now - this.lastUpdateTime);
    this.updateTimeout = setTimeout(() => {
      // ✅ DOUBLE CHECK: Still safe to update?
      if (!this.isUpdating && !(window as any).immediateStop) {
        this.performUpdate();
        this.lastUpdateTime = Date.now();
      }
      this.updateTimeout = null;
    }, delay);
  }
}



/**
 * Perform the actual update with bulletproof circuit breaker
 */
private performUpdate(): void {
  try {
    // ✅ CIRCUIT BREAKER: Reset counter every second
    const now = Date.now();
    if (now - this.lastUpdateReset > 1000) {
      this.updateCount = 0;
      this.lastUpdateReset = now;
    }
    
    // ✅ HARD LIMIT: Max 3 updates per second
    if (this.updateCount >= this.MAX_UPDATES_PER_SECOND) {
      console.warn('🔴 CIRCUIT BREAKER: Domain results update limit reached, blocking...');
      return;
    }
    
    // ✅ RECURSION GUARD: Prevent overlapping calls
    if (this.isUpdating) {
      console.warn('🛑 Domain results already updating, blocking recursive call');
      return;
    }
    
    // ✅ GLOBAL STOP: Respect immediate stop flag
    if ((window as any).immediateStop) {
      console.log('🛑 Skipping domain results update - immediate stop active');
      return;
    }
    
    // ✅ SET GUARDS
    this.isUpdating = true;
    this.updateCount++;
    
    console.log('🔄 Updating domain results display...');
    
    // ✅ SAFE EXECUTION: Wrap in try-catch
    this.safeRenderViews();
    this.ensureButtonVisibility();
    console.log('✅ Domain results update completed');
    
  } catch (error) {
    console.error('❌ Domain results update failed:', error);
    this.handleError('Display update failed', error);
  } finally {
    // ✅ CRITICAL: Always reset the guard
    this.isUpdating = false;
  }
}





/**
 * Render views with individual error boundaries
 */

private safeRenderViews(): void {
  // ✅ GUARD: Skip if updating is in progress elsewhere
  if ((window as any).immediateStop) {
    console.log('🛑 Skipping domain results rendering - immediate stop requested');
    return;
  }
  
  const renderOperations = [
    { name: 'Summary', method: () => this.renderSummaryView() },
    { name: 'Detailed', method: () => this.renderDetailedView() },
    { name: 'Comparison', method: () => this.renderComparisonView() }
  ];

  renderOperations.forEach(operation => {
    try {
      // ✅ ISOLATE: Each render operation in try-catch
      operation.method();
      
    } catch (error) {
      console.error(`Error rendering ${operation.name} view:`, error);
      this.renderErrorView(operation.name.toLowerCase(), error);
    }
  });
  
  // ✅ PREVENT: DOM mutation events from triggering more updates
  setTimeout(() => {
    // Reset any flags that might cause re-triggering
    this.lastUpdateTime = Date.now();
  }, 50);
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
private generateSummaryHTML(): string {
  try {
    console.log('🔍 Generating summary - Results:', this.results.length, 'Approach Results:', this.approachResults?.size || 0);
    
    // ✅ GUARD: Better null/undefined checking
    const hasResults = this.results && Array.isArray(this.results) && this.results.length > 0;
    const hasApproachResults = this.approachResults && this.approachResults.size > 0;
    
    if (!hasResults && !hasApproachResults) {
      return `
        <div class="no-results">
          <div class="no-results-icon">📊</div>
          <h3>No Results Available</h3>
          <p>Execute walkthroughs to see results here</p>
        </div>
      `;
    }

    let html = '<div class="walkthrough-summary-grid">';

    // ✅ FIXED: Better approach results handling with null checks
    if (hasApproachResults) {
      console.log('📊 Displaying approach results for', this.approachResults.size, 'domain-tier combinations');
      
      try {
        const sortedKeys = Array.from(this.approachResults.keys()).sort();
        
        for (const domainTierKey of sortedKeys) {
          const approaches = this.approachResults.get(domainTierKey);
          
          // ✅ GUARD: Ensure approaches exist and have content
          if (!approaches || approaches.size === 0) {
            console.warn(`No approaches found for ${domainTierKey}`);
            continue;
          }
          
          const [domain, tier] = domainTierKey.split('-');
          
          // ✅ GUARD: Validate domain and tier
          if (!domain || !tier) {
            console.warn(`Invalid domain-tier key: ${domainTierKey}`);
            continue;
          }
          
          html += `
            <div class="domain-tier-section">
              <h3>${this.getDomainIcon(domain)} ${this.getDomainDisplayName(domain)} - ${tier} Tier</h3>
              <div class="approaches-tested" style="display: flex !important; flex-wrap: wrap !important; gap: 8px !important; align-items: center !important; margin-top: 4px;">
                <strong>Approaches tested:</strong> ${Array.from(approaches.keys()).map(a => this.getApproachDisplayName(a)).join(', ')} (${approaches.size} total)
              </div>
              
              <div class="multi-approach-results">
          `;
          
          // ✅ FIXED: Safe approach iteration
          const sortedApproaches = Array.from(approaches.entries()).sort(([a], [b]) => a.localeCompare(b));
          
          for (const [approach, result] of sortedApproaches) {
            try {
              // ✅ GUARD: Validate result before processing
              if (!result) {
                console.warn(`Empty result for approach ${approach} in ${domainTierKey}`);
                html += `<div class="error">No data available for ${approach}</div>`;
                continue;
              }
              
              html += this.generateSingleApproachHTML(result, approach);
            } catch (approachError) {
              console.error(`Error generating HTML for approach ${approach}:`, approachError);
              html += `<div class="error">Error displaying ${approach} results</div>`;
            }
          }
          
          html += `
              </div>
            </div>
          `;
        }
      } catch (approachError) {
        console.error('Error processing approach results:', approachError);
        html += '<div class="error">Error displaying approach results</div>';
      }
    } 
    
    // ✅ IMPROVED: Better fallback handling
    else if (hasResults) {
      console.log('📊 Fallback: Displaying standard results...');
      
      try {
        const domains = this.getUniqueDomains();
        if (domains.length === 0) {
          html += '<div class="error">No valid domains found in results</div>';
        } else {
          const sortedDomains = domains.sort(); // Sort for consistency
          for (const domain of sortedDomains) {
            try {
              const domainSummary = this.generateDomainSummaryHTML(domain);
              if (domainSummary) {
                html += domainSummary;
              }
            } catch (domainError) {
              console.error(`Error generating domain summary for ${domain}:`, domainError);
              html += `<div class="error">Error displaying ${domain} summary</div>`;
            }
          }
        }
      } catch (fallbackError) {
        console.error('Error in fallback results display:', fallbackError);
        html += '<div class="error">Error displaying results</div>';
      }
    }

    html += '</div>';
    
    // ✅ VALIDATE: Ensure we have some content
    if (html === '<div class="walkthrough-summary-grid"></div>') {
      return `
        <div class="no-results">
          <div class="no-results-icon">⚠️</div>
          <h3>No Display Content</h3>
          <p>Results exist but couldn't be displayed. Check console for details.</p>
        </div>
      `;
    }
    
    return html;
    
  } catch (error) {
    console.error('❌ Critical error generating summary HTML:', error);
    return `
      <div class="error">
        <div class="error-icon">❌</div>
        <h3>Summary Generation Error</h3>
        <p>Unable to generate summary. Please refresh the page.</p>
        <details>
          <summary>Technical Details</summary>
          <pre>${error.message || 'Unknown error'}</pre>
        </details>
      </div>
    `;
  }
}





/**
 * ✅ NEW: Calculate success rate display format
 */
private calculateSuccessRateDisplay(result: any): string {
  try {
    const scenarios = result.scenarioResults || [];
    if (scenarios.length === 0) return '0/0';
    
    const successful = scenarios.filter(s => {
      if (!s.response || typeof s.response !== 'string') return false;
      return !s.response.trim().toLowerCase().startsWith('error:');
    }).length;
    
    return `${successful}/${scenarios.length}`;
  } catch (error) {
    console.error('Error calculating success rate display:', error);
    return '0/0';
  }
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

  private generateTierSummaryHTML(result: EnhancedWalkthroughResult): string {
  try {
    const metrics = (result as any).domainMetrics;
    const successIcon = metrics.overallSuccess ? '✅' : '❌';
    const fallbackIcon = metrics.fallbackTriggered ? '⚠️' : '✅';

    // ✅ NEW: Analyze performance state
    const performanceState = this.analyzePerformanceState(result);
    const performanceIcon = this.getPerformanceIcon(performanceState.status);

    const avgTokens = this.calculateAverageTokens(result.scenarioResults);
    const avgLatency = this.calculateAverageLatency(result.scenarioResults);
    const scenarioSuccessRate = this.calculateScenarioSuccessRate(result.scenarioResults);

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

/**
 * ✅ HELPER: Calculate success rate from result safely
 */
private calculateSuccessRateFromResult(result: any): number {
  try {
    if (!result) return 0;
    
    if (result.domainMetrics?.overallSuccess !== undefined) {
      return result.domainMetrics.overallSuccess ? 100 : 0;
    }
    
    const scenarios = result.scenarioResults || [];
    if (scenarios.length === 0) return 0;
    
    const successful = scenarios.filter(s => 
      s.response && 
      typeof s.response === 'string' && 
      !s.response.trim().toLowerCase().startsWith('error:')
    ).length;
    
    return (successful / scenarios.length) * 100;
  } catch (error) {
    console.error('Error calculating success rate:', error);
    return 0;
  }
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
  try {
    if (value === undefined || value === null || isNaN(value)) {
      console.warn(`Invalid ${label} value: ${value}, defaulting to 0%`);
      return '0.0%';
    }
    
    let numValue = Number(value);
    
    // ✅ CONTEXT-AWARE: Check metric type to determine format
    const percentageMetrics = ['mcdAlignmentScore', 'userExperienceScore', 'resourceEfficiency'];
    const isPercentageMetric = percentageMetrics.some(metric => label.includes(metric));
    
    if (isPercentageMetric) {
      // ✅ SMART DETECTION: For percentage metrics, be more intelligent about format
      if (numValue <= 1.0) {
        // Decimal format (0-1), convert to percentage
        numValue = numValue * 100;
      }
      // If already 0-100, use as-is
      // If > 100, it's an error - clamp it
      if (numValue > 100.0) {
        console.warn(`${label} overflow detected: ${numValue}%, clamping to 100%`);
        numValue = 100.0;
      }
    } else {
      // ✅ NON-PERCENTAGE: Handle other metrics that might be displayed as percentages
      if (numValue > 100.0) {
        console.warn(`${label} overflow detected: ${numValue}%, clamping to 100%`);
        numValue = 100.0;
      }
    }
    
    // ✅ CLAMP: Ensure within valid range
    numValue = Math.max(0, Math.min(100, numValue));
    
    return `${numValue.toFixed(1)}%`;
    
  } catch (error) {
    console.error(`Error formatting ${label}:`, error);
    return '0.0%';
  }
}


  private generateScenarioDetailsHTML(result: EnhancedWalkthroughResult): string {
  try {
    let html = `
      <div class="scenario-details">
        <h4>🎬 Trial Execution Results</h4>
        <div class="scenarios-list">
    `;

    // Handle new scenario structure with variants
    const scenarioResults = (result as any).scenarioResults || [];
    
    for (const scenario of scenarioResults) {
      if (scenario.variants) {
        // New structure with variants
        html += `
          <div class="scenario-item enhanced">
            <div class="scenario-header">
              <span class="step-number">Scenario ${scenario.step}</span>
              <span class="context-info">${scenario.context}</span>
            </div>
            
            <div class="variants-container">
        `;
        
        for (const variant of scenario.variants) {
          const variantSuccessRate = variant.measuredProfile?.actualSuccessCount || 0;
          const variantTotalTrials = variant.measuredProfile?.totalTrials || 0;
          const statusIcon = variantSuccessRate > 0 ? '✅' : '❌';
          
          html += `
            <div class="variant-result ${variant.type.toLowerCase()}">
              <div class="variant-header">
                <span class="variant-type ${variant.type.toLowerCase()}">${variant.type}</span>
                <span class="variant-name">${variant.name}</span>
                <span class="status-icon">${statusIcon}</span>
              </div>
              
              <div class="variant-metrics">
                <div class="metric">
                  <span class="metric-label">Success Rate:</span>
                  <span class="metric-value">${variant.measuredProfile?.successRate || '0/0'}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Avg Latency:</span>
                  <span class="metric-value">${variant.measuredProfile?.avgLatency || 0}ms</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Avg Tokens:</span>
                  <span class="metric-value">${variant.measuredProfile?.avgTokens || 0}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">MCD Alignment:</span>
                  <span class="metric-value">${variant.measuredProfile?.mcdAlignmentScore || 0}%</span>
                </div>
              </div>
              
              ${variant.trials && variant.trials.length > 0 ? `
                <div class="trials-summary">
                  <details>
                    <summary>View ${variant.trials.length} Trial Details</summary>
                    <div class="trials-list">
                      ${variant.trials.map(trial => `
                        <div class="trial-item ${trial.success ? 'success' : 'failure'}">
                          <div class="trial-header">
                            <span class="trial-id">${trial.testId}</span>
                            <span class="trial-score">${trial.evaluationScore.toFixed(1)}%</span>
                          </div>
                          <div class="trial-input">Input: ${trial.userInput}</div>
                          ${trial.actualResults ? `
                            <div class="trial-results">
                              <span>Latency: ${trial.actualResults.latencyMs}ms</span>
                              <span>Tokens: ${trial.actualResults.tokenBreakdown?.output || 0}</span>
                              <span>Success: ${trial.actualResults.success ? '✅' : '❌'}</span>
                            </div>
                          ` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </details>
                </div>
              ` : ''}
            </div>
          `;
        }
        
        // Add MCD vs Non-MCD comparison
        if (scenario.mcdVsNonMcdComparison) {
          const comp = scenario.mcdVsNonMcdComparison;
          html += `
            <div class="mcd-comparison">
              <h5>🆚 MCD vs Non-MCD Comparison</h5>
              <div class="comparison-grid">
                <div class="comparison-metric">
                  <span class="metric-label">Success Rate:</span>
                  <span class="mcd-value">MCD: ${comp.mcdSuccess}</span>
                  <span class="non-mcd-value">Non-MCD: ${comp.nonMcdSuccess}</span>
                </div>
                <div class="comparison-metric">
                  <span class="metric-label">Avg Latency:</span>
                  <span class="mcd-value">MCD: ${comp.mcdAvgLatency}ms</span>
                  <span class="non-mcd-value">Non-MCD: ${comp.nonMcdAvgLatency}ms</span>
                </div>
                <div class="comparison-metric">
                  <span class="metric-label">Avg Tokens:</span>
                  <span class="mcd-value">MCD: ${comp.mcdAvgTokens}</span>
                  <span class="non-mcd-value">Non-MCD: ${comp.nonMcdAvgTokens}</span>
                </div>
              </div>
            </div>
          `;
        }
        
        html += `</div></div>`;
      } else {
        // Fallback for old structure
        html += this.generateLegacyScenarioHTML(scenario);
      }
    }

    html += '</div></div>';
    return html;
  } catch (error) {
    console.error('Error generating enhanced scenario details HTML:', error);
    return '<div class="error">Error generating trial execution details</div>';
  }
}

private generateLegacyScenarioHTML(scenario: any): string {
  const hasError = scenario.response?.startsWith('ERROR:');
  const statusIcon = hasError ? '❌' : '✅';
  
  return `
    <div class="scenario-item legacy ${hasError ? 'error' : 'success'}">
      <div class="scenario-header">
        <span class="step-number">Step ${scenario.step}</span>
        <span class="status-icon">${statusIcon}</span>
        <span class="performance-summary">
          ${scenario.tokensUsed || 0} tokens • ${(scenario.latencyMs || 0).toFixed(0)}ms
        </span>
      </div>
      
      <div class="scenario-content">
        <div class="user-input">
          <strong>User:</strong> ${scenario.userInput || 'N/A'}
        </div>
        <div class="assistant-response">
          <strong>Assistant:</strong> ${this.truncateResponse(scenario.response || 'No response')}
        </div>
      </div>
    </div>
  `;
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

  private calculateAverageTokens(scenarios: ScenarioResult[]): number {
    try {
      if (!scenarios || scenarios.length === 0) return 0;
      return scenarios.reduce((sum, s) => sum + s.tokensUsed, 0) / scenarios.length;
    } catch (error) {
      console.error('Error calculating average tokens:', error);
      return 0;
    }
  }

  private calculateAverageLatency(scenarios: ScenarioResult[]): number {
    try {
      if (!scenarios || scenarios.length === 0) return 0;
      return scenarios.reduce((sum, s) => sum + s.latencyMs, 0) / scenarios.length;
    } catch (error) {
      console.error('Error calculating average latency:', error);
      return 0;
    }
  }
 
// ✅ REPLACE: Line ~3200 calculateScenarioSuccessRate method
private calculateScenarioSuccessRate(scenarios: ScenarioResult[]): number {
  try {
    if (!scenarios || scenarios.length === 0) return 0;
    
    // ✅ DOMAIN-AWARE: Different success criteria per domain
    const successful = scenarios.filter(scenario => {
      if (!scenario.response || typeof scenario.response !== 'string') return false;
      
      const response = scenario.response.trim().toLowerCase();
      
      // Explicit failures
      const failures = ['error:', 'failed:', 'cannot', 'unable to', 'sorry'];
      if (failures.some(fail => response.startsWith(fail))) return false;
      
      // Domain-specific success indicators
      const domainSuccessPatterns = {
        'appointment': /\b(confirmed|booked|scheduled)\b/,
        'navigation': /\b(north|south|east|west|\d+m)\b/,
        'diagnostic': /\b(check|verify|inspect|test)\b/
      };
      
      // Check for domain-specific success patterns
      const hasSuccessPattern = Object.values(domainSuccessPatterns)
        .some(pattern => pattern.test(response));
      
      // Minimum viability: meaningful response length
      const hasMinimumContent = response.length >= 15 && 
        response.split(' ').length >= 4;
      
      return hasSuccessPattern || hasMinimumContent;
    }).length;
    
    return (successful / scenarios.length) * 100;
    
  } catch (error) {
    console.error('Error calculating scenario success rate:', error);
    return 0;
  }
}


// ✅ ADD: More efficient memory management
private manageResultsMemoryEfficiently(): void {
  try {
    // Skip during execution
    if ((window as any).unifiedExecutionState?.isExecuting) return;
    
    const currentMemoryMB = this.estimateMemoryUsage();
    
    if (currentMemoryMB > 100) { // 100MB threshold
      console.log(`🧹 Memory usage: ${currentMemoryMB}MB, starting cleanup...`);
      
      // 1. Clean template cache first (quick wins)
      this.cleanupTemplateCache();
      
      // 2. Remove oldest results while preserving diversity
      if (this.results.length > 150) {
        this.results = this.selectRepresentativeSample(this.results, 100);
        this.rebuildGroupedResults();
      }
      
      // 3. Clear approach results cache for completed analyses
      this.cleanupCompletedApproachResults();
      
      console.log(`✅ Memory cleanup completed. New usage: ${this.estimateMemoryUsage()}MB`);
    }
    
  } catch (error) {
    console.error('Memory management error:', error);
  }
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
private getMetricValue(result: EnhancedWalkthroughResult | undefined, metricKey: string, format: string): string {
  try {
    if (!result) return 'N/A';

    let value: any;
    
    if (metricKey === 'avgTokens') {
      value = this.calculateAverageTokens(result.scenarioResults);
    } else if (metricKey === 'avgLatency') {
      value = this.calculateAverageLatency(result.scenarioResults);
    } else {
      value = (result as any).domainMetrics[metricKey];
    }

    if (value === undefined || value === null) return 'N/A';

    switch (format) {
      case 'boolean':
        return value ? '✅ Yes' : '❌ No';
      case 'percentage':
        // ✅ FIX: Use safe percentage formatting
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
        const avgTokens = this.calculateAverageTokens(result.scenarioResults);
        // ✅ FAIR: Score based on efficiency relative to tier expectations
        value = Math.max(0, 1 - (avgTokens / expectations.maxTokens));
      } else if (metricKey === 'avgLatency') {
        const avgLatency = this.calculateAverageLatency(result.scenarioResults);
        // ✅ FAIR: Score based on speed relative to tier expectations
        value = Math.max(0, 1 - (avgLatency / expectations.maxLatency));
      } else if (metricKey === 'overallSuccess') {
        const successRate = (result as any).domainMetrics.overallSuccess ? 1 : 0;
        // ✅ FAIR: Score based on meeting tier success expectations
        value = successRate >= expectations.expectedSuccess ? 1 : successRate / expectations.expectedSuccess;
      } else {
        // ✅ NEUTRAL: Direct metric comparison
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
 
private manageResultsMemory(): void {
  try {
    if ((window as any).immediateStop) {
      console.log('🧹 Skipping memory management - immediate stop requested');
      return;
    }
    
    if (this.results.length > DomainResultsDisplay.MEMORY_CLEANUP_THRESHOLD) {
      const targetSize = DomainResultsDisplay.MEMORY_WARNING_THRESHOLD;
      const preservedResults = this.selectRepresentativeSample(this.results, targetSize);
      const removedCount = this.results.length - preservedResults.length;
      
      this.results = preservedResults;
      console.log(`🧹 Memory cleanup: Removed ${removedCount} results`);
      this.rebuildGroupedResults();
    }
    
    // ✅ FIX: Safe template cache cleanup
    this.cleanupTemplateCache();
    
  } catch (error) {
    console.error('Error in memory management:', error);
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

/**
 * Integration with unified execution system
 */
public setExecutionAware(isExecuting: boolean): void {
  try {
    if (isExecuting) {
      // Pause all DOM operations during execution
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
      }
      console.log('🔄 Domain results display paused for trial execution');
    } else {
      // Resume operations after execution
      console.log('▶️ Domain results display resumed after trial execution');
      // Trigger delayed update
      setTimeout(() => {
        this.throttledUpdate();
      }, 1000);
    }
  } catch (error) {
    console.error('Error setting execution awareness:', error);
  }
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
private performEnhancedComparativeAnalysis(approachResults: Map<string, any>): ComparativeAnalysis {
  // Enhanced version of existing method with better statistical analysis
  // ... implementation details
}

private calculateStatisticalSignificance(approachResults: Map<string, any>): any {
  // Calculate p-values and statistical significance
  // ... implementation details
}

private calculateConfidenceInterval(approachResults: Map<string, any>): any {
  // Calculate confidence intervals for metrics
  // ... implementation details  
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
}


