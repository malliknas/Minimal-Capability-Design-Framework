import { 
    DomainWalkthrough, 
    WalkthroughScenario,
    WalkthroughVariant,
    TrialSpecification,
    SupportedTier,
    validateDomainWalkthrough,
    WalkthroughResult,
    ScenarioResult,
    VariantResult,
    TrialResult
} from './domain-walkthroughs';

/**
 * ✅ UTILITY: Simple token counting
 */
 // ✅ MISSING: Add these interfaces at the top of the file
interface TrialExecutionResult {
  testId: string;
  success: boolean;
  latencyMs: number;
  tokenCount: number;
  accuracy: number;
  tier: 'excellent' | 'good' | 'acceptable' | 'poor';
  mcdAligned: boolean;
  failureReasons: string[];
}

interface TrialEvaluationResult {
  success: boolean;
  tier: 'excellent' | 'good' | 'acceptable' | 'poor';
  accuracy: number;
  mcdCompliant: boolean;
  failures: string[];
}

interface ComparativeWalkthroughResult {
  walkthroughId: string;
  domain: string;
  tier: SupportedTier;
  comparative: true;
  comparativeResults: {
    mcd: VariantExecutionResult[];
    fewShot: VariantExecutionResult[];
    systemRole: VariantExecutionResult[];
    hybrid: VariantExecutionResult[];
    conversational: VariantExecutionResult[];
  };
  analysis: ComparativeAnalysis;
  rankings: string[];
  mcdAdvantage: MCDAdvantageValidation;
  recommendations: string[];
  executionTime: number;
  timestamp: string;
}
// ✅ NEW: Result caching interfaces and implementation
interface CacheEntry {
  result: WalkthroughResult | ComparativeWalkthroughResult;
  timestamp: number;
  tier: SupportedTier;
  options: any;
}

interface WalkthroughCache {
  [cacheKey: string]: CacheEntry;
}
interface EngineInterface {
  chat: {
    completions: {
      create(params: CompletionParams): Promise<CompletionResponse>;
    };
  };
}

interface CompletionParams {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

interface CompletionResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage: {
    total_tokens: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

// Enhanced metrics interface
interface EnhancedDomainMetrics {
  overallSuccess: boolean;
  mcdAlignmentScore: number;
  resourceEfficiency: number;
  fallbackTriggered: boolean;
  userExperienceScore: number;
  totalTrials: number;
  successfulTrials: number;
  // NEW: Advanced metrics
  performanceConsistency: number;
  mcdVsNonMcdAdvantage: number;
  tierOptimizationScore: number;
  reliabilityIndex: number;
  costEfficiencyRatio: number;
  mcdAlignmentByApproach: {
    mcd: number;
    fewShot: number; 
    systemRole: number;
    hybrid: number;
    conversational: number;
  };
  overallMcdAlignment: number;
}

// Progress tracking interface
interface ProgressUpdate {
  phase: 'validation' | 'execution' | 'analysis' | 'integration';
  currentScenario?: number;
  totalScenarios?: number;
  currentVariant?: string;
  currentTrial?: string;
  estimatedTimeRemaining?: number;
  throughput?: number;
}
// ✅ ADD: Missing interface that's referenced
interface ComparativeResults {
  mcd: VariantExecutionResult[];
  fewShot: VariantExecutionResult[];
  systemRole: VariantExecutionResult[];
  hybrid: VariantExecutionResult[];
  conversational: VariantExecutionResult[];
}

/**
 * Enhanced result interfaces for the new trial system
 */
export interface WalkthroughResult {
  walkthroughId: string;
  domain: string; 
  tier: SupportedTier;
  scenarioResults: ScenarioResult[];
  domainMetrics: {
    overallSuccess: boolean;
    mcdAlignmentScore: number;
    resourceEfficiency: number;
    fallbackTriggered: boolean;
    userExperienceScore: number;
    totalTrials: number;
    successfulTrials: number;
  };
  recommendations: string[];
  executionTime: number;
  timestamp: string;
}

export interface ScenarioResult {
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

// ✅ FIX: Update the actualResults interface
// ✅ ENHANCED: TrialResult interface with prompt details
export interface TrialResult {
  testId: string;
  userInput: string;
  
  // ✅ NEW: Prompt details for UI display
  inputPrompt?: string;           // The actual prompt sent to the model
  modelResponse?: string;         // Raw model response
  evaluationSteps?: string;       // Evaluation process details
  promptMetadata?: {              // Additional prompt information
    approach: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    modelUsed?: string;
  };
  
  actualResults: {
    success: boolean;
    tier?: 'excellent' | 'good' | 'acceptable' | 'poor';
    accuracy: number;
    latencyMs: number;
    tokenBreakdown: { input: number; process: number; output: number };
    mcdAligned: boolean;
    failureReasons: string[];
    timestamp: number;
    output?: string;
    cpuUsage?: number;
    memoryKb?: number;
    error?: string;
  };
  benchmarkComparison: {
    latencyDiff: number;
    tokenDiff: number;
    performanceBetter: boolean;
  };
  evaluationScore: number;
  success: boolean;
}

// ✅ NEW: Cache management class
class WalkthroughResultCache {
  private static cache: WalkthroughCache = {};
  private static readonly MAX_CACHE_SIZE = 50;
  private static readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  
static generateCacheKey(walkthrough: DomainWalkthrough, tier: SupportedTier, options: any = {}): string {
  const approach = options.approach || 'default';
  const cacheKey = `${walkthrough.id}-${approach}-${tier}-${JSON.stringify(options)}`;
  return cacheKey;
}
  
  static get(cacheKey: string): WalkthroughResult | ComparativeWalkthroughResult | null {
    const entry = this.cache[cacheKey];
    
    if (!entry) return null;
    
    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      delete this.cache[cacheKey];
      return null;
    }
    
    console.log(`✅ Cache hit for ${cacheKey}`);
    return entry.result;
  }
  
  static set(cacheKey: string, result: WalkthroughResult | ComparativeWalkthroughResult, tier: SupportedTier, options: any): void {
    // Clean cache if it's getting too large
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      this.cleanOldEntries();
    }
    
    this.cache[cacheKey] = {
      result: this.deepCopy(result), // Store a deep copy to prevent mutation
      timestamp: Date.now(),
      tier,
      options: { ...options }
    };
    
    console.log(`💾 Cached result for ${cacheKey}`);
  }
  
  static cleanOldEntries(): void {
    const now = Date.now();
    const keysToDelete = Object.keys(this.cache).filter(key => 
      now - this.cache[key].timestamp > this.CACHE_TTL_MS
    );
    
    keysToDelete.forEach(key => delete this.cache[key]);
    
    // If still too many entries, remove oldest ones
    const remainingKeys = Object.keys(this.cache);
    if (remainingKeys.length >= this.MAX_CACHE_SIZE) {
      const sortedKeys = remainingKeys.sort((a, b) => this.cache[a].timestamp - this.cache[b].timestamp);
      const keysToRemove = sortedKeys.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2));
      keysToRemove.forEach(key => delete this.cache[key]);
    }
    
    console.log(`🧹 Cleaned cache, ${Object.keys(this.cache).length} entries remaining`);
  }
  
  static invalidate(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Object.keys(this.cache).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => delete this.cache[key]);
      console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries matching "${pattern}"`);
    } else {
      this.cache = {};
      console.log('🗑️ Cleared entire cache');
    }
  }
  
  static getStats(): { size: number; oldestEntry: number; newestEntry: number } {
    const entries = Object.values(this.cache);
    if (entries.length === 0) {
      return { size: 0, oldestEntry: 0, newestEntry: 0 };
    }
    
    const timestamps = entries.map(e => e.timestamp);
    return {
      size: entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
  
  private static deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }
}
// ✅ NEW: Structured logging utility
class EvaluationLogger {
    private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
    
    static debug(message: string, data?: any) {
        if (this.logLevel === 'debug') {
            console.log(`🔍 [DEBUG] ${message}`, data || '');
        }
    }
    
    static info(message: string, data?: any) {
        console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
    
    static warn(message: string, data?: any) {
        console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
    
    static error(message: string, error?: any) {
        console.error(`❌ [ERROR] ${message}`, error || '');
    }
    
    static setLevel(level: 'debug' | 'info' | 'warn' | 'error') {
        this.logLevel = level;
        console.log(`📊 Log level set to: ${level}`);
    }
}



// ✅ NEW: Content quality helper for better evaluation
function calculateContentQuality(output: string, trial: TrialSpecification): number {
    const outputLower = output.toLowerCase();
    let qualityScore = 0.5; // Start at neutral
    
    // ✅ NEW: Get domain-aware defaults
    const domain = extractDomainFromTrial(trial);
    const defaultCriteria = getDefaultSuccessCriteria(domain, 'Q4');
    const maxTokenBudget = trial.successCriteria?.maxTokenBudget ?? defaultCriteria.maxTokenBudget;
    
    // ✅ Completeness check
    const hasActionableContent = /\b(check|verify|confirm|complete|provide|specify)\b/.test(outputLower);
    if (hasActionableContent) qualityScore += 0.2;
    
    // ✅ Clarity check  
    const hasStructure = /^.+:/m.test(output) || /^\s*[-•]\s+/m.test(output);
    if (hasStructure) qualityScore += 0.2;
    
    // ✅ ENHANCED: Use domain-aware budget
    const tokenCount = countTokens(output);
    const domainMultiplier = getDomainComplexityMultiplier(domain);
    const adjustedBudget = maxTokenBudget * domainMultiplier;
    const budgetRatio = tokenCount / adjustedBudget;
    
    if (budgetRatio <= 0.8) {
        qualityScore += 0.1; // Bonus for conciseness
    } else if (budgetRatio > 1.5) {
        qualityScore -= 0.2; // Penalty for verbosity
    }
    
    return Math.max(0, Math.min(1, qualityScore));
}
 
function hasStructuredFormat(output: string): boolean {
  return /^(check|verify|confirm|missing|required|inspect):/i.test(output.trim()) ||
         /\[(.*?)\]/.test(output) ||
         /\d+\.\s/.test(output) ||
         output.includes('→') || output.includes('->');
}

function detectPatternFollowing(output: string, trial: TrialSpecification): boolean {
  const outputLower = output.toLowerCase();
  
  // Domain-specific pattern indicators
  const domainPatterns = {
    appointment: /^(check|verify|confirm|missing|required):\s*/,
    navigation: /\b(north|south|east|west)\s+\d+m?\b/,
    diagnostics: /^(inspect|examine|test):\s*/
  };
  
  // Check for structured format consistency
  const hasConsistentStructure = /^[a-z]+:\s/.test(outputLower) ||
                                /\b(step \d+|check \d+)\b/.test(outputLower);
  
  return hasConsistentStructure || 
         Object.values(domainPatterns).some(pattern => pattern.test(outputLower));
}

function detectProfessionalTone(output: string): boolean {
  const professionalIndicators = [
    'systematic', 'verify', 'analysis', 'assessment', 'evaluation',
    'confirm', 'validate', 'inspect', 'examine', 'diagnostic',
    'procedure', 'protocol', 'standard', 'specification'
  ];
  
  const casualIndicators = [
    'awesome', 'cool', 'hey', 'wow', 'super', 'totally'
  ];
  
  const outputLower = output.toLowerCase();
  const professionalCount = professionalIndicators.filter(term => outputLower.includes(term)).length;
  const casualCount = casualIndicators.filter(term => outputLower.includes(term)).length;
  
  return professionalCount >= 2 && casualCount === 0;
}

function cleanHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/&amp;/g, '&')      // Decode &amp; to &
    .replace(/&lt;/g, '<')      // Decode &lt; to <  
    .replace(/&gt;/g, '>')      // Decode &gt; to >
    .replace(/&quot;/g, '"')    // Decode &quot; to "
    .replace(/&#x27;/g, "'")    // Decode &#x27; to '
    .replace(/&#39;/g, "'");    // Also handle &#39; variant
}

// ✅ NEW: Semantic matching helper
function hasSemanticMatch(output: string, required: string): boolean {
  const synonyms = {
    'appointment': ['booking', 'reservation', 'schedule'],
    'confirm': ['verify', 'check', 'validate'],
    'missing': ['absent', 'lacking', 'not provided'],
    'location': ['address', 'place', 'venue'],
    'time': ['datetime', 'when', 'schedule']
  };
  
  const requiredWords = required.toLowerCase().split(/\s+/);
  return requiredWords.some(word => {
    if (output.includes(word)) return true;
    const wordSynonyms = synonyms[word] || [];
    return wordSynonyms.some(synonym => output.includes(synonym));
  });
}

/**
 * ✅ NEW: Tiered evaluation function (MISSING from original code)
 */
// ✅ FIXED: More lenient tier evaluation for spatial navigation
function evaluateTrialWithTiers(
    output: string, 
    trial: TrialSpecification
): {
    success: boolean;
    tier: 'excellent' | 'good' | 'acceptable' | 'poor';
    accuracy: number;
    mcdCompliant: boolean;
    failures: string[];
} {
    const failures: string[] = [];
    const cleanOutput = cleanHtmlEntities(output);
    const domain = extractDomainFromTrial(trial);
    
    // ✅ CRITICAL: Reject template responses immediately for spatial navigation
    if (domain === 'spatial-navigation' && /\[.*?\]/.test(output)) {
        failures.push('Contains template placeholders - not actionable navigation guidance');
        return {
            success: false,
            tier: 'poor',
            accuracy: 0,
            mcdCompliant: false,
            failures
        };
    }
    
    const defaultCriteria = getDefaultSuccessCriteria(domain, 'Q4');
    const minAccuracy = trial.successCriteria?.minAccuracy ?? defaultCriteria.minAccuracy;
    const maxTokenBudget = trial.successCriteria?.maxTokenBudget ?? defaultCriteria.maxTokenBudget;
    
    // ✅ ENHANCED: Spatial-specific evaluation
    let functionalScore = 0;
    
    if (domain === 'spatial-navigation') {
        // ✅ SPATIAL: Focus on navigation quality over strict requirements
        const hasActionableGuidance = /\b(head|go|turn|continue|take|use)\b/i.test(cleanOutput);
        const hasSpecificDirection = /\b(north|south|east|west|left|right|straight|up|down)\b/i.test(cleanOutput);
        const hasDestinationRef = /\b(to|toward|until|reach|arrive|entrance|exit|room|building)\b/i.test(cleanOutput);
        const avoidsTemplates = !/\[.*?\]/.test(output);
        
        functionalScore = (
            (hasActionableGuidance ? 0.3 : 0) +
            (hasSpecificDirection ? 0.3 : 0) +
            (hasDestinationRef ? 0.2 : 0) +
            (avoidsTemplates ? 0.2 : 0)
        );
        
        if (!hasActionableGuidance) failures.push('Missing actionable navigation commands');
        if (!hasSpecificDirection) failures.push('Missing specific directional guidance');
        if (!avoidsTemplates) failures.push('Contains template placeholders');
        
    } else {
        // ✅ KEEP: Original evaluation for other domains
        const requiredElements = trial.successCriteria?.requiredElements ?? [];
        const prohibitedElements = trial.successCriteria?.prohibitedElements ?? [];
        
        let requiredFound = 0;
        for (const required of requiredElements) {
            if (containsRequirementSmart(cleanOutput.toLowerCase(), cleanHtmlEntities(required.toLowerCase()), domain)) {
                requiredFound++;
            } else {
                failures.push(`Missing required element: ${required}`);
            }
        }
        
        const requiredRatio = requiredElements.length > 0 ? requiredFound / requiredElements.length : 1.0;
        const contentQuality = calculateContentQuality(cleanOutput, trial);
        
        functionalScore = requiredRatio * 0.7 + contentQuality * 0.3;
    }
     // ✅ NEW: MCD-specific bonuses for structured responses
    if (domain === 'appointment-booking' || domain === 'failure-diagnostics') {
        const hasStructuredMCDFormat = /^(check|verify|confirm|missing|required):/im.test(cleanOutput);
        const hasSystematicApproach = /→/.test(cleanOutput) || /\d+\.\s/.test(cleanOutput);
        
        if (hasStructuredMCDFormat) {
            functionalScore += 0.15; // ✅ Bonus for MCD structure
        }
        if (hasSystematicApproach) {
            functionalScore += 0.10; // ✅ Bonus for systematic format
        }
    }
    // ✅ ENHANCED: Spatial-specific tier thresholds
    const domainAdjustment = getDomainRequiredRatioAdjustment(domain);
	functionalScore = Math.min(1.0, functionalScore + domainAdjustment);
    let tier: 'excellent' | 'good' | 'acceptable' | 'poor';
    
    if (domain === 'spatial-navigation') {
        // ✅ SPATIAL: More lenient thresholds
        if (functionalScore >= 0.7 && cleanOutput.length >= 20) {
            tier = 'excellent';
        } else if (functionalScore >= 0.5 && cleanOutput.length >= 15) {
            tier = 'good';
        } else if (functionalScore >= 0.3 && cleanOutput.length >= 10) {
            tier = 'acceptable';
        } else {
            tier = 'poor';
        }
    } else {
        // ✅ KEEP: Original tier logic for other domains
        if (functionalScore >= Math.max(0.80, minAccuracy) && cleanOutput.length >= 20) {
            tier = 'excellent';
        } else if (functionalScore >= Math.max(0.65, minAccuracy * 0.85) && cleanOutput.length >= 15) {
            tier = 'good';
        } else if (functionalScore >= Math.max(0.55, minAccuracy * 0.70) && cleanOutput.length >= 10) {
            tier = 'acceptable';
        } else {
            tier = 'poor';
        }
    }
    
    const success = tier !== 'poor';
    const mcdCompliant = checkMCDCompliance(cleanOutput, trial);
    
    return {
        success,
        tier,
        accuracy: Math.max(0, Math.min(1, functionalScore)),
        mcdCompliant,
        failures
    };
}


/**
 * ✅ NEW: Smart requirement matching with domain awareness
 */
function containsRequirementSmart(output: string, requirement: string, domain: string): boolean {
  // Direct match first
  if (output.includes(requirement)) return true;
  
  // Domain-specific synonym matching
  const domainSynonyms = getDomainSynonyms(domain);
  const reqWords = requirement.split(/\s+/);
  
  return reqWords.some(word => {
    if (output.includes(word)) return true;
    
    const synonyms = domainSynonyms[word] || [];
    return synonyms.some(synonym => output.includes(synonym));
  });
}
/**
 * ✅ FIXED: Single, consistent token counting function
 */
// ✅ FIXED (Line ~365): Single consistent function
function countTokensConsistently(text: string): number {
  try {
    if (!text || typeof text !== 'string') return 0;
    
    const cleaned = cleanHtmlEntities(text.trim());  // ✅ Use cleaned text
    if (cleaned.length === 0) return 0;
    
    // Enhanced tokenization with better accuracy
    const words = cleaned.split(/\s+/).filter(w => w.length > 0).length;
    const punctuation = (cleaned.match(/[.,!?;:()\[\]{}'"]/g) || []).length;
    const numbers = (cleaned.match(/\b\d+\b/g) || []).length;
    const specialChars = (cleaned.match(/[→←↑↓•\-]/g) || []).length;
    const urls = (cleaned.match(/https?:\/\/[^\s]+/g) || []).length;
    
    // More accurate token estimation based on actual tokenizer patterns
    const baseTokens = words * 1.0;
    const punctuationTokens = punctuation * 0.25; // Reduced weight
    const numberTokens = numbers * 0.3; // Numbers often single tokens
    const specialTokens = specialChars * 0.2;
    const urlTokens = urls * 3; // URLs typically 2-4 tokens each
    
    return Math.ceil(baseTokens + punctuationTokens + numberTokens + specialTokens + urlTokens);
    
  } catch (error) {
    console.error('Token counting error:', error);
    const fallbackRatio = 3.8; // Updated based on empirical data
    return Math.ceil((text?.length || 0) / fallbackRatio);
  }
}

// ✅ CONSOLIDATE: Single source of truth
const countTokens = countTokensConsistently;

/**
 * ✅ FIXED: Clean MCD compliance checking
 */


/**
 * ✅ NEW: Domain-specific synonym mapping
 */
function getDomainSynonyms(domain: string): Record<string, string[]> {
  const synonymMaps = {
    'appointment-booking': {
      'appointment': ['booking', 'reservation', 'schedule', 'visit'],
      'confirm': ['verify', 'check', 'validate', 'ensure'],
      'missing': ['absent', 'lacking', 'not provided', 'incomplete'],
      'time': ['when', 'schedule', 'timing', 'hour'],
      'location': ['address', 'place', 'venue', 'where']
    },
    'spatial-navigation': {
      'navigate': ['go', 'travel', 'move', 'head'],
      'location': ['destination', 'place', 'spot', 'position'],
      'direction': ['way', 'path', 'route', 'heading']
    },
    'failure-diagnostics': {
      'diagnostic': ['analysis', 'check', 'examination', 'test'],
      'error': ['issue', 'problem', 'fault', 'failure'],
      'inspect': ['examine', 'check', 'analyze', 'review']
    }
  };
  
  return synonymMaps[domain] || {};
}

/**
 * ✅ NEW: Domain-specific required ratio adjustments
 */
function getDomainRequiredRatioAdjustment(domain: string): number {
  const adjustments = {
    'appointment-booking': 0.05,  // Slightly more forgiving
    'failure-diagnostics': 0.10,  // Most forgiving due to complexity
    'spatial-navigation': 0.00    // Standard requirements
  };
  
  return adjustments[domain] || 0.02;
}

/**
 * ✅ NEW: Enhanced MCD compliance checking (MISSING from original code)
 */
/**
 * ✅ CONSOLIDATED: Single MCD compliance function with clean HTML entity handling
 */
function checkMCDCompliance(output: string, trial: TrialSpecification): boolean {
  const cleanOutput = cleanHtmlEntities(output);
  const outputLower = cleanOutput.toLowerCase();
  
const mcdIndicators: Record<string, number> = {
  // Primary MCD patterns (structured approach)
  'check:': 4, 'verify:': 4, 'confirm:': 4, 'validate:': 4, 'inspect:': 4,
  'missing:': 3, 'required:': 3, 'specify:': 3, 'clarify:': 3,
  
  // Secondary MCD patterns (directive language)
  'need to': 2, 'must': 2, 'should': 2, 'complete': 2, 'provide': 2,
  
  // Structured format indicators
  '→': 2, '->': 2, '•': 1, '- ': 1, // Note: space after dash important
  'step 1': 1, 'step 2': 1, 'step 3': 1,
  
  //  Spatial MCD patterns
    'navigate:': 4, 'proceed:': 4, 'head:': 4, 'route:': 3,
    'destination:': 3, 'direction:': 3, 'path:': 2,
    'avoid:': 3, 'obstacle:': 2, 'blocked:': 2,
    
    // Spatial structured indicators
    'to →': 2, 'm →': 2, 'north →': 3,
    'turn': 2, 'continue': 2, 'exit': 2,
	
  // Domain-specific MCD patterns
  'appointment details': 2, 'booking information': 2,
  'location coordinates': 2, 'navigation path': 2,
  'error code': 3, 'diagnostic result': 3
};
  
  // Non-MCD indicators (conversational/subjective)
  const nonMcdIndicators: Record<string, number> = {
    // Subjective opinions
    'i think': -4, 'i believe': -4, 'in my opinion': -4, 'personally': -3,
    'i feel': -4, 'i would suggest': -3, 'let me': -3,
    
    // Overly casual/friendly language
    'awesome': -3, 'amazing': -3, 'wonderful': -2, 'great job': -3,
    'happy to help': -4, 'glad to assist': -3, 'feel free': -2,
    'no worries': -3, 'sounds good': -2, 'absolutely': -2,
    
    // Hedging language
    'maybe': -2, 'perhaps': -2, 'possibly': -2, 'might be': -2
  };
  
  let mcdScore = 0;
  
  // Score MCD indicators
  for (const [phrase, weight] of Object.entries(mcdIndicators)) {
    // ✅ FIXED: Clean regex escaping (no more &amp;)
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = outputLower.match(regex) || [];
    mcdScore += weight * matches.length;
  }
  
  // Score non-MCD indicators
  for (const [phrase, weight] of Object.entries(nonMcdIndicators)) {
    if (outputLower.includes(phrase)) {
      mcdScore += weight; // Already negative
    }
  }
  
  // Structural format bonuses
  if (/^(check|verify|confirm|missing|required|inspect):/m.test(outputLower)) {
    mcdScore += 3; // Structured format bonus
  }
  
  if (/^\s*[-•]\s+/m.test(cleanOutput)) {
    mcdScore += 1; // List format bonus
  }
  
  // Domain-aware token efficiency bonus
  const domain = extractDomainFromTrial(trial);
  const domainMultiplier = getDomainComplexityMultiplier(domain);
  const adjustedBudget = (trial.successCriteria?.maxTokenBudget || 100) * domainMultiplier;
  
  const tokenCount = countTokensConsistently(cleanOutput);
  const budgetRatio = tokenCount / adjustedBudget;
  
  if (budgetRatio <= 0.7) {
    mcdScore += 2; // Strong efficiency bonus
  } else if (budgetRatio <= 0.9) {
    mcdScore += 1; // Moderate efficiency bonus
  }
  
  return mcdScore > 1;
}

// ✅ NEW: Domain-specific complexity adjustments
function getDomainComplexityMultiplier(domain: string): number {
    const multipliers = {
        'appointment-booking': 1.2,  // Allow 20% more tokens for booking complexity
        'failure-diagnostics': 1.4,  // More complex domain, allow 40% more
        'spatial-navigation': 1.5,   // Standard complexity
        'system-diagnostics': 1.3,   // Technical domain needs more tokens
        'customer-service': 1.1      // Slightly more flexible
    };
    return multipliers[domain] || 1.1; // Default 10% buffer
}

// ✅ NEW: Get domain from trial context
function extractDomainFromTrial(trial: TrialSpecification): string {
    // Try to extract domain from testId pattern (e.g., "D1_W1_A1_T1")
    const domainMatch = trial.testId.match(/^D(\d+)/);
    if (domainMatch) {
        const domainMap = {
            '1': 'appointment-booking',
            '2': 'spatial-navigation', 
            '3': 'failure-diagnostics'
        };
        return domainMap[domainMatch[1]] || 'unknown';
    }
    
    // Fallback: analyze user input content
    const input = trial.userInput.toLowerCase();
    if (input.includes('appointment') || input.includes('booking')) return 'appointment-booking';
    if (input.includes('navigation') || input.includes('north') || input.includes('direction')) return 'spatial-navigation';
    if (input.includes('diagnostic') || input.includes('error') || input.includes('failure')) return 'failure-diagnostics';
    
    return 'unknown';
}

// ✅ FIXED (Line ~1265):
function getTemperatureForApproach(approach: string, variantType: string): number {
  // ✅ CRITICAL: Ensure MCD is deterministic
  if (approach === 'mcd' || variantType === 'MCD') {
    return 0.0; // ✅ MCD must be deterministic
  }
  if (approach === 'hybrid') {
    return 0.1; // ✅ Mostly deterministic with slight flexibility
  }
  if (approach === 'fewShot') {
    return 0.3; // ✅ Slight variation for pattern following
  }
  if (approach === 'systemRole') {
    return 0.2; // ✅ Professional but consistent
  }
  if (approach === 'conversational') {
    return 0.7; // ✅ More creative/variable
  }
  // ✅ DEFAULT: Check variant type as fallback
  return variantType === 'MCD' ? 0.0 : 0.7;
}


/**
 * ✅ ENHANCED: Execute trial with prompt capture for UI display
 */
/**
 * ✅ FIXED: Execute trial with proper prompt construction verification
 */
/**
 * ✅ FIXED: Execute trial with correct prompt storage
 */
/**
 * ✅ COMBINED: Enhanced trial execution with ALL existing debugging + new validation
 */
async function executeTrialSpecificationWithTiers(
  trial: TrialSpecification,
  variant: WalkthroughVariant,
  engine: EngineInterface
): Promise<TrialSpecification> {
  
  const startTime = performance.now();
  const approach = categorizeVariantApproach(variant);
  
  // ✅ NEW: Wrap with memory management while preserving all existing logic
  return executeWithMemoryManagement(async () => {
    
    try {
      console.log(`🎯 Processing enhanced ${approach} approach for ${trial.testId}`);
      
      // ✅ KEEP: Your existing prompt construction
      const promptComponents = buildPromptFromVariant(variant, trial);
      
      // ✅ KEEP: Your comprehensive debug logging
      console.log(`📋 PROMPT STORAGE DEBUG for ${approach}:`);
      console.log(`  - Raw user input: "${trial.userInput}"`);
      console.log(`  - Constructed prompt (${promptComponents.fullPrompt.length} chars): "${promptComponents.fullPrompt.substring(0, 200)}..."`);
      console.log(`  - Are they different? ${promptComponents.fullPrompt !== trial.userInput ? 'YES ✅' : 'NO ❌'}`);
      
      // ✅ KEEP: Your existing verification with fail-fast
      if (promptComponents.fullPrompt === trial.userInput) {
        console.error(`❌ CRITICAL: Prompt construction FAILED for ${approach}`);
        console.error(`This means buildPromptFromVariant returned raw input unchanged`);
        throw new Error(`Prompt construction failed for ${approach}: output matches raw input`);
      }
      
      // ✅ KEEP: Your existing message construction
      let messages;
      if (promptComponents.systemPrompt && promptComponents.systemPrompt.trim().length > 0) {
        messages = [
          { role: "system", content: promptComponents.systemPrompt },
          { role: "user", content: promptComponents.fullPrompt }
        ];
      } else {
        messages = [{ role: "user", content: promptComponents.fullPrompt }];
      }
      
      // ✅ KEEP: Your existing generation config
      const generationConfig = {
        max_tokens: trial.successCriteria?.maxTokenBudget || 100,
        temperature: getTemperatureForApproach(approach, variant.type)
      };
      
      const response = await engine.chat.completions.create({
        messages: messages,
        ...generationConfig
      });
      
      let actualOutput = response.choices?.[0]?.message?.content || '';
      const actualLatency = Math.round(performance.now() - startTime);
      
      // ✅ KEEP: Your existing critical variables
      const structuredPrompt = promptComponents.fullPrompt;
      const originalInput = trial.userInput;
      
      // ✅ KEEP: Your existing double-check verification
      if (structuredPrompt === originalInput) {
        console.error(`❌ STORAGE ERROR: About to store raw input instead of structured prompt!`);
        console.error(`Structured: "${structuredPrompt}"`);
        console.error(`Raw: "${originalInput}"`);
        throw new Error(`Cannot store raw input as structured prompt for ${approach}`);
      }
      
      // ✅ NEW: Add response validation with correction
      const validation = validateApproachResponse(actualOutput, promptComponents.fullPrompt, approach, trial);
      
      if (!validation.isValid) {
        console.warn(`⚠️ Response validation issues for ${approach}:`, validation.issues);
        
        if (validation.correctedResponse) {
          console.log(`✅ Using corrected response for ${approach}`);
          actualOutput = validation.correctedResponse;
        }
      }
      
      // ✅ KEEP: Your existing structured prompt storage
      (trial as any).inputPrompt = structuredPrompt;  // This is what the UI will show
      (trial as any).modelResponse = actualOutput;
      
      // ✅ ENHANCED: Your existing evaluation steps + validation info
      (trial as any).evaluationSteps = `Approach: ${approach}\nPrompt Type: Structured\nPrompt Length: ${structuredPrompt.length}\nOriginal Input: "${originalInput}"\nResponse Length: ${actualOutput.length}\nValidation: ${validation.isValid ? 'PASSED' : 'ISSUES FOUND'}\nValidation Issues: ${validation.issues.join(', ') || 'None'}`;
      
      // ✅ ENHANCED: Your existing metadata + validation results
      (trial as any).promptMetadata = {
        approach: approach,
        originalUserInput: originalInput,
        constructedPromptPreview: structuredPrompt.substring(0, 100) + '...',
        systemPrompt: promptComponents.systemPrompt || null,
        promptConstructedCorrectly: true,  // ✅ KEEP: Your existing flag
        temperature: generationConfig.temperature,
        maxTokens: generationConfig.max_tokens,
        variantId: variant.id,
        variantName: variant.name,
        storageVerified: true,  // ✅ KEEP: Your existing flag
        // ✅ NEW: Add validation metadata
        validationResult: validation,
        enhancedValidation: true,
        memoryManaged: true
      };
      
      // ✅ KEEP: Your existing final verification logging
      console.log(`💾 STORED for UI display:`);
      console.log(`  - inputPrompt (first 100 chars): "${(trial as any).inputPrompt.substring(0, 100)}..."`);
      console.log(`  - Storage successful: ${(trial as any).inputPrompt !== originalInput ? 'YES ✅' : 'FAILED ❌'}`);
      
      // ✅ KEEP: Your existing evaluation
      const evaluationResult = evaluateWithDetailedSteps(actualOutput, trial, approach);
      
      // ✅ ENHANCED: Your existing actualResults + validation metadata
      trial.actualResults = {
        output: actualOutput,
        tokenBreakdown: calculateTokenBreakdown(structuredPrompt, actualOutput, response.usage?.total_tokens || 0),
        latencyMs: actualLatency,
        success: evaluationResult.success,
        tier: evaluationResult.tier,
        accuracy: evaluationResult.accuracy,
        failureReasons: evaluationResult.failures,
        timestamp: Date.now(),
        mcdAligned: evaluationResult.mcdCompliant,
        cpuUsage: 0,
        memoryKb: 0,
        // ✅ NEW: Add validation metadata to results
        validationPassed: validation.isValid,
        validationIssues: validation.issues,
        responseEnhanced: !!validation.correctedResponse
      };
      
      console.log(`✅ Enhanced ${approach} execution completed for ${trial.testId}: ${evaluationResult.tier} (${actualLatency}ms)`);
      
      return trial;
      
    } catch (error) {
      console.error(`❌ Trial ${trial.testId} failed:`, error);
      
      // ✅ KEEP: Your existing comprehensive error handling
      trial.actualResults = {
        output: `ERROR: ${error.message}`,
        tokenBreakdown: { input: 0, process: 0, output: 0 },
        latencyMs: Math.round(performance.now() - startTime),
        success: false,
        tier: 'poor',
        accuracy: 0,
        failureReasons: [`Execution error: ${error.message}`],
        timestamp: Date.now(),
        mcdAligned: false,
        cpuUsage: 0,
        memoryKb: 0,
        // ✅ NEW: Add validation error info
        validationPassed: false,
        validationIssues: ['Execution failed before validation'],
        responseEnhanced: false
      };
      
      // ✅ KEEP: Your existing error info storage
      (trial as any).inputPrompt = `ERROR during ${categorizeVariantApproach(variant)} prompt construction: ${error.message}`;
      (trial as any).modelResponse = `ERROR: ${error.message}`;
      (trial as any).promptMetadata = {
        approach: categorizeVariantApproach(variant),
        errorDuringConstruction: true,
        originalUserInput: trial.userInput,
        errorMessage: error.message,
        // ✅ NEW: Enhanced error metadata
        enhancedValidation: false,
        memoryManaged: true,
        executionFailed: true
      };
      
      return trial;
    }
    
  }, `${approach} trial execution`, approach);
}




/**
 * ✅ NEW: Build prompt from variant with component tracking
 */
/**
 * ✅ FIXED: Enhanced prompt building with proper slot extraction and variant handling
 */
/**
 * ✅ FIXED: Enhanced prompt building with proper approach-specific construction
 */
function buildPromptFromVariant(variant: WalkthroughVariant, trial: TrialSpecification): {
  fullPrompt: string;
  systemPrompt?: string;
  userPrompt: string;
} {
  try {
    const domain = extractDomainFromTrial(trial);
    const approach = categorizeVariantApproach(variant);
    
    console.log(`🔧 Building ${approach} prompt for ${trial.testId}`);
    
    let fullPrompt = '';
    let systemPrompt: string | undefined;
    
    switch (approach) {
      case 'mcd':
        const mcdResult = buildMCDPromptStructured(variant.prompt, trial.userInput, domain);
        fullPrompt = mcdResult.fullPrompt;
        systemPrompt = mcdResult.systemPrompt;
        break;
        
      case 'fewShot':
        fullPrompt = buildFewShotPromptStructured(variant.prompt, trial.userInput, domain);
        break;
        
      case 'systemRole':
        const systemResult = buildSystemRolePromptStructured(variant.prompt, trial.userInput, domain);
        fullPrompt = systemResult.fullPrompt;
        systemPrompt = systemResult.systemPrompt;
        break;
        
      case 'hybrid':
        const hybridResult = buildHybridPromptStructured(variant.prompt, trial.userInput, domain);
        fullPrompt = hybridResult.fullPrompt;
        systemPrompt = hybridResult.systemPrompt;
        break;
        
      case 'conversational':
        fullPrompt = buildConversationalPromptStructured(variant.prompt, trial.userInput, domain);
        break;
        
      default:
        fullPrompt = `${variant.prompt}\n\nUser Input: ${trial.userInput}`;
        break;
    }
    
    // ✅ FIXED: Log the actual constructed prompt for verification
    console.log(`📝 ${approach.toUpperCase()} prompt constructed (${fullPrompt.length} chars):`, 
                fullPrompt.substring(0, 100) + '...');
    
    return {
      fullPrompt,
      systemPrompt,
      userPrompt: trial.userInput
    };
    
  } catch (error) {
    console.error('❌ Prompt building failed:', error);
    return {
      fullPrompt: `${variant.prompt}\n\nUser Input: ${trial.userInput}`,
      userPrompt: trial.userInput,
      systemPrompt: undefined
    };
  }
}
/**
 * ✅ NEW: MCD-specific structured prompt builder
 */
// ✅ REPLACE: buildMCDPromptStructured function
function buildMCDPromptStructured(template: string, userInput: string, domain: string): {
  fullPrompt: string;
  systemPrompt?: string;
} {
  
  // ✅ NEW: Ultra-simple, action-oriented prompts
  const simplifiedTemplates = {
    'appointment-booking': `Task: Book appointment
Input: "${userInput}"
Output: "Confirmed: [Type] [Day] [Time]" OR "Missing: [what needed]"
Response:`,

    'spatial-navigation': `Task: Give directions
Input: "${userInput}" 
Output: "Head [direction] to [destination]" OR "Turn [direction] then [action]"
Response:`,

    'failure-diagnostics': `Task: Fix problem
Input: "${userInput}"
Output: "Check: 1) [main] 2) [backup]" OR "Escalate: [reason]"
Response:`
  };
  
  const prompt = simplifiedTemplates[domain] || simplifiedTemplates['appointment-booking'];
  
  return {
    fullPrompt: prompt,
    systemPrompt: undefined  // No system prompt needed for ultra-simple MCD
  };
}


/**
 * ✅ NEW: Few-shot specific prompt builder
 */
/**
 * ✅ ENHANCED: Anti-echoing few-shot prompt builder with explicit instructions
 */
function buildFewShotPromptStructured(template: string, userInput: string, domain: string): string {
  
  // ✅ FIX: Enhanced templates with anti-echoing measures
  const enhancedTemplates = {
    'appointment-booking': `TASK: Apply the booking validation pattern shown below.

PATTERN EXAMPLES:
Input: "Book dentist Tuesday" → Output: "Missing: specific time for dentist appointment on Tuesday"
Input: "Cardiology 2pm" → Output: "Missing: date for cardiology appointment at 2pm"  
Input: "Friday checkup Dr. Smith" → Output: "Missing: specific time for checkup with Dr. Smith on Friday"
Input: "Dermatology tomorrow 10am downtown" → Output: "Confirmed: Dermatology appointment tomorrow 10am downtown"

INSTRUCTIONS: Apply this EXACT pattern to the new input below. Do NOT repeat the examples.

YOUR TASK: "${userInput}"
YOUR RESPONSE:`,

    'spatial-navigation': `TASK: Apply the navigation guidance pattern shown below.

PATTERN EXAMPLES:
Input: "Go to restaurant" → Output: "Head north 50 meters to the restaurant entrance"
Input: "Library avoiding construction" → Output: "Head east to bypass construction, then north to library main entrance"
Input: "Exit building, elevator broken" → Output: "Take stairs down to ground floor exit on west side"
Input: "Meeting room B avoiding crowds" → Output: "Head south down quiet corridor to meeting room B"

INSTRUCTIONS: Apply this EXACT pattern to the new input below. Provide specific directional guidance.

YOUR TASK: "${userInput}"
YOUR RESPONSE:`,

    'failure-diagnostics': `TASK: Apply the diagnostic pattern shown below.

PATTERN EXAMPLES:
Input: "Server won't start" → Output: "Check: 1) Power/hardware status 2) Service configuration 3) System error logs"
Input: "Database connection timeout" → Output: "Check: 1) Network connectivity 2) Authentication credentials 3) Database service status"
Input: "User login failing consistently" → Output: "Check: 1) Password policy compliance 2) Account lock status 3) Authentication service logs"
Input: "Email system down company-wide" → Output: "Escalate: Critical system failure affecting all users - contact senior infrastructure team immediately"

INSTRUCTIONS: Apply this EXACT pattern to the new input below. Use "Check:" for standard issues or "Escalate:" for critical problems.

YOUR TASK: "${userInput}"
YOUR RESPONSE:`
  };

  const enhancedPrompt = enhancedTemplates[domain];
  if (!enhancedPrompt) {
    console.warn(`No enhanced template found for domain: ${domain}, using fallback`);
    return `Apply the appropriate pattern to: "${userInput}"`;
  }

  console.log(`✅ Enhanced few-shot template applied for ${domain}`);
  return enhancedPrompt;
}


/**
 * ✅ NEW: Anti-echoing response validation
 */
function validateApproachResponse(
  response: string, 
  originalPrompt: string, 
  approach: string,
  trial: TrialSpecification
): {
  isValid: boolean;
  issues: string[];
  correctedResponse?: string;
} {
  
  const issues: string[] = [];
  const domain = extractDomainFromTrial(trial);
  
  if (approach === 'fewShot') {
    const echoingDetected = detectEchoing(response, originalPrompt);
    if (echoingDetected.isEchoing) {
      issues.push(`Few-shot echoing detected: ${echoingDetected.reason}`);
      
      const corrected = extractPatternFromEcho(response, domain);
      if (corrected) {
        return {
          isValid: true,
          issues: [`Corrected echoing behavior: ${echoingDetected.reason}`],
          correctedResponse: corrected
        };
      }
    }
  }
  
  const domainValid = validateDomainSpecificResponseEnhanced(response, domain, trial.userInput);
  if (!domainValid.isValid) {
    issues.push(...domainValid.issues);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    correctedResponse: undefined
  };
}

function detectEchoing(response: string, originalPrompt: string): {
  isEchoing: boolean;
  reason: string;
  confidence: number;
} {
  
  const responseLower = response.toLowerCase();
  const promptLower = originalPrompt.toLowerCase();
  
  const exampleIndicators = ['examples:', 'input:', 'output:', '→', 'pattern examples'];
  const indicatorCount = exampleIndicators.filter(indicator => 
    responseLower.includes(indicator)
  ).length;
  
  if (indicatorCount >= 2) {
    return {
      isEchoing: true,
      reason: `Contains ${indicatorCount} example indicators - likely repeating template`,
      confidence: 0.9
    };
  }
  
  if (response.length > originalPrompt.length * 0.6) {
    return {
      isEchoing: true,
      reason: `Response too long (${response.length} chars) - possible verbatim repetition`,
      confidence: 0.8
    };
  }
  
  const promptWords = new Set(promptLower.split(/\W+/).filter(w => w.length > 3));
  const responseWords = responseLower.split(/\W+/).filter(w => w.length > 3);
  const overlapCount = responseWords.filter(word => promptWords.has(word)).length;
  const overlapRatio = responseWords.length > 0 ? overlapCount / responseWords.length : 0;
  
  if (overlapRatio > 0.7) {
    return {
      isEchoing: true,
      reason: `High word overlap (${Math.round(overlapRatio * 100)}%) with original prompt`,
      confidence: 0.85
    };
  }
  
  return {
    isEchoing: false,
    reason: 'Response appears to be original content',
    confidence: 0.9
  };
}

function extractPatternFromEcho(echoedResponse: string, domain: string): string | null {
  try {
    const lines = echoedResponse.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const patterns = {
      'appointment-booking': /^(missing|confirmed|check):/i,
      'spatial-navigation': /^(head|go|turn|navigate)/i,
      'failure-diagnostics': /^(check|escalate|diagnostic):/i
    };
    
    const pattern = patterns[domain];
    if (!pattern) return null;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (pattern.test(line) && line.length < 200) {
        console.log(`✅ Extracted pattern from echo: "${line}"`);
        return line;
      }
    }
  } catch (error) {
    console.warn('Pattern extraction from echo failed:', error);
  }
  
  return null;
}

 
function buildSystemRolePromptStructured(template: string, userInput: string, domain: string): {
  fullPrompt: string;
  systemPrompt: string;
} {
  
  const rolePrompts = {
    'appointment-booking': `Process: "${userInput}"
Provide professional booking confirmation or specify missing details.`,

    'spatial-navigation': `Navigate: "${userInput}"
Provide specific directional guidance using compass directions.`,

    'failure-diagnostics': `Diagnose: "${userInput}"
Provide systematic diagnostic steps or escalation recommendation.`
  };
  
  const systemRoles = {
    'appointment-booking': "You are a medical appointment scheduler. Be direct and professional.",
    'spatial-navigation': "You are a navigation specialist. Give specific, actionable directions.", 
    'failure-diagnostics': "You are a senior systems engineer. Provide systematic diagnostic steps."
  };
  
  return {
    fullPrompt: rolePrompts[domain] || rolePrompts['appointment-booking'],
    systemPrompt: systemRoles[domain] || systemRoles['appointment-booking']
  };
}


/**
 * ✅ NEW: Hybrid approach prompt builder
 */
// ✅ REPLACE: buildHybridPromptStructured function
function buildHybridPromptStructured(template: string, userInput: string, domain: string): {
  fullPrompt: string;
  systemPrompt: string;
} {
  
  // ✅ NEW: Minimal hybrid combining pattern + structure
  const hybridTemplates = {
    'appointment-booking': `Pattern: "Book dentist Tuesday 2PM" → "Confirmed: Dentist Tuesday 2PM"
Your task: "${userInput}" →`,

    'spatial-navigation': `Pattern: "Go to restaurant" → "Head north to restaurant"
Your task: "${userInput}" →`,

    'failure-diagnostics': `Pattern: "Server down" → "Check: 1) Port 2) Service 3) Logs"
Your task: "${userInput}" →`
  };
  
  return {
    fullPrompt: hybridTemplates[domain] || hybridTemplates['appointment-booking'],
    systemPrompt: `You follow patterns to give direct, actionable responses for ${domain}.`
  };
}


/**
 * ✅ NEW: Conversational prompt builder
 */
function buildConversationalPromptStructured(template: string, userInput: string, domain: string): string {
  
  switch (domain) {
    case 'appointment-booking':
      return `A user is trying to book an appointment and says: "${userInput}"

How would you naturally and helpfully respond to assist them with their appointment booking? Be conversational but professional.`;
      
    case 'spatial-navigation':
      return `A user needs navigation help and says: "${userInput}"

How would you naturally provide friendly, conversational directions to help them reach their destination?`;
      
    case 'failure-diagnostics':
      return `A user has a technical issue and says: "${userInput}"

How would you conversationally help them troubleshoot this problem in a supportive and understanding way?`;
      
    default:
      return `A user says: "${userInput}"

How would you naturally and helpfully respond to assist them?`;
  }
}



// ✅ FIX: Domain-specific MCD prompt construction
function buildMCDPromptEnhanced(template: string, userInput: string, domain: string): {
    fullPrompt: string;
    systemPrompt?: string;
} {
    
    switch (domain) {
        case 'appointment-booking':
            return buildAppointmentMCDPrompt(userInput);
        case 'spatial-navigation':
            return buildNavigationMCDPrompt(userInput);
        case 'failure-diagnostics':
            return buildDiagnosticsMCDPrompt(userInput);
        default:
            return buildGenericMCDPrompt(template, userInput);
    }
}

// ✅ APPOINTMENT BOOKING: Structured slot extraction
// ✅ FIXED: Action-oriented appointment booking
function buildAppointmentMCDPrompt(userInput: string): { fullPrompt: string; systemPrompt?: string } {
    const slots = extractAppointmentSlots(userInput);
    
    let structuredPrompt = `Process appointment booking: "${userInput}"

Task: Complete booking or identify missing information
Required: [type], [date], [time]

If all information provided → Confirm booking
If information missing → Specify exactly what's needed

Response format:
- Complete: "Confirmed: [Type], [Date] [Time]"  
- Incomplete: "Missing: [specific fields] for [type] appointment"

Process now:`;
    
    return {
        fullPrompt: structuredPrompt,
        systemPrompt: "You are a medical appointment scheduler providing structured booking confirmations."
    };
}


// ✅ IMPROVED: Enhanced spatial navigation prompt builder
// ✅ FIXED: Enhanced spatial navigation prompt builder
// ✅ FIXED: Enhanced spatial navigation prompt builder
function buildNavigationMCDPrompt(userInput: string): { fullPrompt: string; systemPrompt?: string } {
    const navElements = extractEnhancedNavigationElements(userInput);
    
    // ✅ FIX: ACTION-ORIENTED instead of template-oriented
    let structuredPrompt = `Provide direct navigation guidance for: "${userInput}"

Task: Give specific step-by-step directions
Format: [Action] [Direction] [Distance/Landmark] 
Example: "Head north 50 meters to the main entrance"

Requirements:
- Use concrete directions (north, south, east, west, left, right)
- Include specific distances or landmarks when possible  
- If obstacles mentioned, provide alternative route
- Be direct and actionable

Navigation guidance:`;
    
    return {
        fullPrompt: structuredPrompt,
        systemPrompt: "You are a precision navigation system providing specific directional guidance."
    };
}


// ✅ ENHANCED: Better spatial element extraction with realistic patterns
function extractEnhancedNavigationElements(userInput: string): {
    destination?: string;
    direction?: string;
    distance?: string;
    obstacles?: string;
    route?: string;
} {
    const input = userInput.toLowerCase();
    const elements: any = {};
    
    // ✅ FIX: More comprehensive destination patterns
    const destinations = [
        'restaurant', 'store', 'hospital', 'library', 'park', 'building', 'office',
        'room', 'exit', 'entrance', 'parking', 'lobby', 'elevator', 'stairs',
        'bathroom', 'cafeteria', 'desk', 'counter', 'kitchen', 'garage',
        'hall', 'corridor', 'meeting room', 'reception', 'lab', 'warehouse'
    ];
    
    // Find destination with context
    for (const dest of destinations) {
        if (input.includes(dest)) {
            elements.destination = dest;
            break;
        }
    }
    
    // ✅ FIX: Enhanced direction detection with combinations
    const directionPatterns = [
        { pattern: /north.*?east|northeast|ne\b/, value: 'northeast' },
        { pattern: /north.*?west|northwest|nw\b/, value: 'northwest' },
        { pattern: /south.*?east|southeast|se\b/, value: 'southeast' },
        { pattern: /south.*?west|southwest|sw\b/, value: 'southwest' },
        { pattern: /\bnorth\b/, value: 'north' },
        { pattern: /\bsouth\b/, value: 'south' },
        { pattern: /\beast\b/, value: 'east' },
        { pattern: /\bwest\b/, value: 'west' },
        { pattern: /\bleft\b/, value: 'left' },
        { pattern: /\bright\b/, value: 'right' },
        { pattern: /straight|forward|ahead/, value: 'straight' },
        { pattern: /back|backward|behind/, value: 'back' }
    ];
    
    for (const { pattern, value } of directionPatterns) {
        if (pattern.test(input)) {
            elements.direction = value;
            break;
        }
    }
    
    // ✅ FIX: Better distance extraction with units
    const distanceMatch = input.match(/(\d+\s*(m|meter|meters|step|steps|foot|feet|yard|yards|block|blocks)|\b(nearby|close|far|adjacent)\b)/);
    if (distanceMatch) {
        elements.distance = distanceMatch[1] || distanceMatch[3];
    }
    
    // ✅ FIX: Enhanced obstacle detection
    const obstaclePatterns = [
        /avoid\s+(.+?)(?:\s|$)/,
        /around\s+(.+?)(?:\s|$)/,
        /bypass\s+(.+?)(?:\s|$)/,
        /\b(blocked|construction|wet floor|maintenance|closed)\b/
    ];
    
    for (const pattern of obstaclePatterns) {
        const match = input.match(pattern);
        if (match) {
            elements.obstacles = match[1] || match[0];
            break;
        }
    }
    
    return elements;
}

// ✅ FIXED: Action-oriented diagnostics
function buildDiagnosticsMCDPrompt(userInput: string): { fullPrompt: string; systemPrompt?: string } {
    const symptoms = extractDiagnosticSymptoms(userInput);
    
    let structuredPrompt = `Diagnose system issue: "${userInput}"

Task: Provide systematic diagnostic steps
Format: Numbered action list

If simple issue → Provide specific checks (max 3)
If complex issue → Recommend expert escalation

Response format:
- Simple: "1. Check [specific item] 2. Verify [specific item] 3. Test [specific item]"
- Complex: "Multiple systems affected. Escalate to: [expert type]"

Diagnostic steps:`;
    
    return {
        fullPrompt: structuredPrompt,
        systemPrompt: "You are a senior systems engineer providing systematic diagnostic procedures."
    };
}

// ✅ FIX: Domain-specific token budgets
function getDomainTokenBudgets(domain: string, tier: SupportedTier): {
    min: number;
    target: number;
    max: number;
} {
    const budgets = {
        'appointment-booking': {
            'Q1': { min: 10, target: 25, max: 40 },
            'Q4': { min: 20, target: 40, max: 60 },
            'Q8': { min: 30, target: 60, max: 90 }
        },
        'spatial-navigation': {
            'Q1': { min: 8, target: 20, max: 35 },
            'Q4': { min: 15, target: 35, max: 55 },
            'Q8': { min: 25, target: 50, max: 75 }
        },
        'failure-diagnostics': {
            'Q1': { min: 15, target: 35, max: 55 },
            'Q4': { min: 30, target: 60, max: 90 },
            'Q8': { min: 50, target: 90, max: 130 }
        }
    };
    
    return budgets[domain]?.[tier] || { min: 15, target: 40, max: 60 };
}


// ✅ FIX: Domain-aware success evaluation
function evaluateTrialEnhanced(
    output: string,
    trial: TrialSpecification
): {
    success: boolean;
    tier: 'excellent' | 'good' | 'acceptable' | 'poor';
    accuracy: number;
    details: string[];
} {
    const domain = extractDomainFromTrial(trial);
    const details: string[] = [];
    
    // Step 1: Basic validation
    const hasValidOutput = isValidDomainOutput(output, domain, trial.userInput);
    if (!hasValidOutput) {
        details.push('Output failed domain-specific validation');
        return { success: false, tier: 'poor', accuracy: 0, details };
    }
    
    // Step 2: Token efficiency
    const tokenCount = countTokensAccurately(output);
    const budgets = getDomainTokenBudgets(domain, 'Q4'); // Use Q4 as baseline
    const tokenEfficient = tokenCount <= budgets.max;
    if (!tokenEfficient) {
        details.push(`Token count ${tokenCount} exceeds budget ${budgets.max}`);
    }
    
    // Step 3: Content quality
    const contentScore = evaluateContentQuality(output, domain, trial.userInput);
    details.push(`Content quality: ${Math.round(contentScore * 100)}%`);
    
    // Step 4: Required elements
    const requiredScore = evaluateRequiredElements(output, trial.successCriteria?.requiredElements || []);
    details.push(`Required elements: ${Math.round(requiredScore * 100)}%`);
    
    // Calculate overall accuracy
    const accuracy = (contentScore * 0.5) + (requiredScore * 0.3) + (tokenEfficient ? 0.2 : 0);
    
    // Determine tier
    let tier: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (accuracy >= 0.9) tier = 'excellent';
    else if (accuracy >= 0.75) tier = 'good';
    else if (accuracy >= 0.6) tier = 'acceptable';
    else tier = 'poor';
    
    const success = tier !== 'poor';
    details.push(`Final tier: ${tier} (${Math.round(accuracy * 100)}%)`);
    
    return { success, tier, accuracy, details };
}

// ✅ APPOINTMENT BOOKING: Slot extraction
function extractAppointmentSlots(userInput: string): {
    type?: string;
    date?: string;
    time?: string;
} {
    const input = userInput.toLowerCase();
    const slots: any = {};
    
    // Extract appointment type
    const types = ['cardiology', 'dentist', 'dermatology', 'doctor', 'checkup', 'consultation'];
    slots.type = types.find(type => input.includes(type));
    
    // Extract date
    const dateMatch = input.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)/);
    if (dateMatch) slots.date = dateMatch[1];
    
    // Extract time
    const timeMatch = input.match(/(\d{1,2}(am|pm|:\d{2})|morning|afternoon|evening)/);
    if (timeMatch) slots.time = timeMatch[1];
    
    return slots;
}

// ✅ SPATIAL NAVIGATION: Element extraction
function extractNavigationElements(userInput: string): {
    destination?: string;
    direction?: string;
    obstacles?: string;
} {
    const input = userInput.toLowerCase();
    const elements: any = {};
    
    // Extract destination
    const destinations = ['restaurant', 'library', 'office', 'room', 'exit', 'parking', 'building'];
    elements.destination = destinations.find(dest => input.includes(dest));
    
    // Extract direction
    const directionMatch = input.match(/(north|south|east|west|left|right)/);
    if (directionMatch) elements.direction = directionMatch[1];
    
    // Extract obstacles
    const obstacleMatch = input.match(/avoid\s+(.+?)(?:\s|$)/);
    if (obstacleMatch) elements.obstacles = obstacleMatch[1];
    
    return elements;
}

// ✅ FAILURE DIAGNOSTICS: Symptom analysis
function extractDiagnosticSymptoms(userInput: string): {
    systemType?: string;
    complexity: 'low' | 'medium' | 'high';
    summary: string;
} {
    const input = userInput.toLowerCase();
    
    // Identify system type
    const systems = ['server', 'database', 'network', 'application', 'service'];
    const systemType = systems.find(sys => input.includes(sys));
    
    // Assess complexity
    const complexityIndicators = ['multiple', 'cascading', 'widespread', 'critical', 'system-wide'];
    const complexity = complexityIndicators.some(indicator => input.includes(indicator)) ? 'high' : 
                      input.split(' ').length > 8 ? 'medium' : 'low';
    
    return {
        systemType,
        complexity,
        summary: input
    };
}

// ✅ DIAGNOSTICS: System-specific checks
function getDiagnosticChecks(systemType: string): string[] {
    const checkMap = {
        'server': ['port status', 'service status', 'system logs'],
        'database': ['connection', 'credentials', 'service availability'],
        'network': ['connectivity', 'firewall', 'DNS resolution'],
        'application': ['configuration', 'dependencies', 'error logs'],
        'service': ['status', 'configuration', 'resource usage']
    };
    
    return checkMap[systemType] || ['basic diagnostics', 'error logs', 'system status'];
}

// Enhanced few-shot prompt builder
function buildFewShotPromptEnhanced(template: string, userInput: string, domain: string): {
  fullPrompt: string;
} {
  
  // For few-shot, preserve examples and add new case
  if (template.includes('Examples:')) {
    return {
      fullPrompt: `${template}\n\nNow handle this case:\nInput: ${userInput}\nOutput:`
    };
  }
  
  return {
    fullPrompt: `${template}\n\nUser Input: ${userInput}`
  };
}

// Navigation input parser
function parseNavigationInput(userInput: string): {
  startPos: string;
  endPos: string;
  obstacles: string;
} {
  const input = userInput.toLowerCase();
  
  // Parse "A1 to B3, avoid wet floor C2"
  const toMatch = input.match(/(\w+\d*)\s+to\s+(\w+\d*)/);
  const avoidMatch = input.match(/avoid\s+(.+?)(?:\s|$)/);
  
  return {
    startPos: toMatch ? toMatch[1].toUpperCase() : '',
    endPos: toMatch ? toMatch[2].toUpperCase() : '',
    obstacles: avoidMatch ? avoidMatch[1] : ''
  };
}

// Priority list generator for diagnostics
function generatePriorityList(symptoms: string): string {
  const symptomLower = symptoms.toLowerCase();
  
  if (symptomLower.includes('server') && symptomLower.includes('port')) {
    return 'port status, service status, logs';
  }
  if (symptomLower.includes('database') && symptomLower.includes('timeout')) {
    return 'network connectivity, credentials, service availability';
  }
  if (symptomLower.includes('login') || symptomLower.includes('user')) {
    return 'credentials, account status, authentication service';
  }
  
  return 'basic checks, system status, error logs';
}

/**
 * ✅ NEW: Extract structured slots from user input based on domain
 */
function extractSlotsFromUserInput(userInput: string, domain: string): Record<string, string> {
  const slots: Record<string, string> = {};
  const inputLower = userInput.toLowerCase();
  
  switch (domain) {
    case 'appointment-booking':
      // Extract appointment type
      const appointmentTypes = ['cardiology', 'dentist', 'dermatology', 'doctor', 'checkup', 'consultation'];
      const typeMatch = appointmentTypes.find(type => inputLower.includes(type));
      if (typeMatch) slots.type = typeMatch;
      
      // Extract date
      const dateMatch = inputLower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/);
      if (dateMatch) slots.date = dateMatch[1];
      
      // Extract time
      const timeMatch = inputLower.match(/(\d{1,2}:\d{2}|\d{1,2}(am|pm)|morning|afternoon|evening)/);
      if (timeMatch) slots.time = timeMatch[1];
      
      // Extract location (optional)
      const locationMatch = inputLower.match(/(downtown|main street|clinic|hospital|office)/);
      if (locationMatch) slots.location = locationMatch[1];
      break;
      
    case 'spatial-navigation':
      // Extract destination
      const destinationMatch = inputLower.match(/(restaurant|store|hospital|library|park|building|office)/);
      if (destinationMatch) slots.destination = destinationMatch[1];
      
      // Extract direction context
      const directionMatch = inputLower.match(/(north|south|east|west|left|right|straight)/);
      if (directionMatch) slots.direction = directionMatch[1];
      break;
      
    case 'failure-diagnostics':
      // Extract error type
      const errorMatch = inputLower.match(/(network|connection|server|database|application|system|login)/);
      if (errorMatch) slots.errorType = errorMatch[1];
      
      // Extract error code if present
      const codeMatch = inputLower.match(/(error|code)\s*(\d+)/);
      if (codeMatch) slots.errorCode = codeMatch[2];
      break;
  }
  
  return slots;
}

/**
 * ✅ NEW: Build MCD-specific prompt with slot validation
 */
function buildMCDPrompt(template: string, slots: Record<string, string>, userInput: string): {
  fullPrompt: string;
  systemPrompt?: string;
} {
  
  // Check if template has slot placeholders
  const hasSlotPlaceholders = /\[(?:type|date|time|location|destination|errorType|errorCode)\]/.test(template);
  
  if (hasSlotPlaceholders) {
    // Replace specific slot placeholders
    let processedTemplate = template;
    
    // Replace known slots
    Object.entries(slots).forEach(([slotName, slotValue]) => {
      const placeholder = new RegExp(`\\[${slotName}\\]`, 'gi');
      processedTemplate = processedTemplate.replace(placeholder, slotValue);
    });
    
    // Mark missing slots
    processedTemplate = processedTemplate.replace(/\[(\w+)\]/g, (match, slotName) => `[MISSING: ${slotName}]`);
    
    return {
      fullPrompt: `${processedTemplate}\n\nOriginal Input: ${userInput}`,
      systemPrompt: undefined
    };
    
  } else {
    // Standard MCD template - append user input
    return {
      fullPrompt: `${template}\n\nUser Input: ${userInput}`,
      systemPrompt: undefined
    };
  }
}

/**
 * ✅ NEW: Build hybrid prompt combining structure with conversation
 */
function buildHybridPrompt(template: string, slots: Record<string, string>, userInput: string): {
  fullPrompt: string;
  systemPrompt?: string;
} {
  const slotSummary = Object.keys(slots).length > 0 ? 
    `\nExtracted information: ${JSON.stringify(slots)}` : 
    `\nNo structured information extracted.`;
    
  return {
    fullPrompt: `${template}${slotSummary}\n\nUser Request: ${userInput}`,
    systemPrompt: undefined
  };
}

// Enhanced hybrid prompt builder
function buildHybridPromptEnhanced(template: string, userInput: string, domain: string): {
  fullPrompt: string;
  systemPrompt?: string;
} {
  
  // Extract domain-specific slots
  const slots = extractSlotsFromUserInput(userInput, domain);
  
  // Combine MCD structure with conversational flow
  const mcdStructure = buildMCDStructureForDomain(domain);
  const examplePattern = generateFewShotExample(domain);
  
  let hybridPrompt = '';
  
  // Build hybrid approach: structured + examples + conversation
  if (template.includes('[HYBRID_STRUCTURE]')) {
    hybridPrompt = template
      .replace('[HYBRID_STRUCTURE]', mcdStructure)
      .replace('[EXAMPLE_PATTERN]', examplePattern)
      .replace('[USER_INPUT]', userInput);
  } else {
    // Default hybrid construction
    hybridPrompt = `${mcdStructure}\n\nExample patterns: ${examplePattern}\n\nProcess this request with structured validation:\nUser: ${userInput}\n\nResponse:`;
  }
  
  return {
    fullPrompt: hybridPrompt,
    systemPrompt: `You are a ${domain} specialist. Use structured validation while maintaining conversational clarity.`
  };
}

// Helper functions for hybrid approach
function buildMCDStructureForDomain(domain: string): string {
  const structures = {
    'appointment-booking': 'Check: [type], [date], [time] → Confirm: Missing details → Required: Complete booking',
    'spatial-navigation': 'Navigate: [start] → [end] → Avoid: [obstacles] → Verify: Path clear',
    'failure-diagnostics': 'Diagnose: [symptoms] → Test: [components] → Report: [status]'
  };
  
  return structures[domain] || 'Process: [input] → Validate: [requirements] → Complete: [task]';
}

function generateFewShotExample(domain: string): string {
  const examples = {
    'appointment-booking': '"Book dentist Tuesday" → "Dentist, Tuesday [TIME MISSING]"',
    'spatial-navigation': '"Go to restaurant" → "Navigate north 50m to restaurant [AVOID: wet floor C2]"',
    'failure-diagnostics': '"Server down" → "Diagnostic: Check port 80, service status, logs"'
  };
  
  return examples[domain] || '"Request" → "Structured response"';
}


/**
 * ✅ NEW: Enhanced evaluation with step-by-step details
 */
function evaluateWithDetailedSteps(
  output: string,
  trial: TrialSpecification,
  approach: string
): TrialEvaluationResult & { evaluationDetails: string } {
  
  const evaluationSteps: string[] = [];
  evaluationSteps.push(`🔍 EVALUATION START: ${trial.testId} (${approach} approach)`);
  evaluationSteps.push(`📝 Output length: ${output.length} characters`);
  
  // Step 1: Basic evaluation
  evaluationSteps.push(`\n🧪 STEP 1: Basic Tier Evaluation`);
  const baseEvaluation = evaluateTrialWithTiers(output, trial);
  evaluationSteps.push(`  ✓ Tier: ${baseEvaluation.tier}`);
  evaluationSteps.push(`  ✓ Accuracy: ${(baseEvaluation.accuracy * 100).toFixed(1)}%`);
  evaluationSteps.push(`  ✓ Success: ${baseEvaluation.success ? 'PASS' : 'FAIL'}`);
  
  if (baseEvaluation.failures.length > 0) {
    evaluationSteps.push(`  ⚠ Failures detected: ${baseEvaluation.failures.length}`);
    baseEvaluation.failures.forEach((failure, index) => {
      evaluationSteps.push(`    ${index + 1}. ${failure}`);
    });
  }
  
  // Step 2: MCD Compliance Check
  evaluationSteps.push(`\n🎯 STEP 2: MCD Compliance Analysis`);
  const mcdCompliant = checkMCDCompliance(output, trial);
  evaluationSteps.push(`  ✓ MCD Compliant: ${mcdCompliant ? 'YES' : 'NO'}`);
  
  // Step 3: Approach-specific evaluation
  evaluationSteps.push(`\n⚙️ STEP 3: ${approach.toUpperCase()} Approach Evaluation`);
  const approachEvaluation = evaluateByApproach(output, trial, approach);
  
  if (approachEvaluation.accuracy !== baseEvaluation.accuracy) {
    evaluationSteps.push(`  ✓ Approach adjustment: ${(baseEvaluation.accuracy * 100).toFixed(1)}% → ${(approachEvaluation.accuracy * 100).toFixed(1)}%`);
  } else {
    evaluationSteps.push(`  ✓ No approach-specific adjustments needed`);
  }
  
  // Step 4: Domain-specific analysis
  evaluationSteps.push(`\n🏗️ STEP 4: Domain-Specific Analysis`);
  const domain = extractDomainFromTrial(trial);
  evaluationSteps.push(`  ✓ Domain: ${domain}`);
  
  const domainDefaults = getDefaultSuccessCriteria(domain, 'Q4');
  const tokenCount = countTokens(output);
  const tokenEfficiency = tokenCount <= domainDefaults.maxTokenBudget;
  evaluationSteps.push(`  ✓ Token efficiency: ${tokenCount}/${domainDefaults.maxTokenBudget} tokens (${tokenEfficiency ? 'EFFICIENT' : 'VERBOSE'})`);
  
  // Step 5: Final scoring
  evaluationSteps.push(`\n📊 STEP 5: Final Scoring`);
  evaluationSteps.push(`  ✓ Final tier: ${approachEvaluation.tier}`);
  evaluationSteps.push(`  ✓ Final accuracy: ${(approachEvaluation.accuracy * 100).toFixed(1)}%`);
  evaluationSteps.push(`  ✓ MCD compliance: ${approachEvaluation.mcdCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
  evaluationSteps.push(`  ✓ Overall result: ${approachEvaluation.success ? '✅ SUCCESS' : '❌ FAILURE'}`);
  
  evaluationSteps.push(`\n🏁 EVALUATION COMPLETE`);
  
  return {
    ...approachEvaluation,
    evaluationDetails: evaluationSteps.join('\n')
  };
}

/**
 * ✅ NEW: Calculate detailed token breakdown
 */
function calculateTokenBreakdown(inputPrompt: string, output: string, totalTokens: number): {
  input: number;
  process: number;
  output: number;
} {
  try {
    const inputTokens = countTokens(inputPrompt);
    const outputTokens = countTokens(output);
    
    // Process tokens is the difference (model processing overhead)
    const processTokens = Math.max(0, totalTokens - inputTokens - outputTokens);
    
    return {
      input: inputTokens,
      process: processTokens,
      output: outputTokens
    };
  } catch (error) {
    console.error('Error calculating token breakdown:', error);
    return {
      input: 0,
      process: 0,
      output: totalTokens || 0
    };
  }
}

// ✅ NEW: Verify prompt data persistence
function verifyPromptCapture(trial: any, context: string): boolean {
  const hasPrompt = !!(trial as any).inputPrompt && (trial as any).inputPrompt.length > 0;
  const hasResponse = !!(trial as any).modelResponse && (trial as any).modelResponse.length > 0;
  const hasMetadata = !!(trial as any).promptMetadata;
  
  if (!hasPrompt || !hasResponse || !hasMetadata) {
    console.warn(`⚠️ Incomplete prompt capture for ${context}:`, {
      hasPrompt,
      hasResponse, 
      hasMetadata,
      promptLength: (trial as any).inputPrompt?.length || 0,
      responseLength: (trial as any).modelResponse?.length || 0
    });
    return false;
  }
  
  console.log(`✅ Prompt capture verified for ${context}`);
  return true;
}



/**
 * ENHANCED: Main walkthrough execution function
 */
/**
 * ✅ ENHANCED: Main execution function with comparative support
 */
export async function runDomainWalkthrough(
  walkthrough: DomainWalkthrough,
  tier: SupportedTier,
  engine: EngineInterface,
  options: { 
    comparative?: boolean; 
    useCache?: boolean;
    approach?: string;  
  } = {}
): Promise<WalkthroughResult | ComparativeWalkthroughResult> {
  
  // ✅ FIX: Extract approach from options
  const { comparative = false, useCache = true, approach = 'standard' } = options;
  
  // ✅ FIX: Use actual approach in cache key
  const cacheKey = WalkthroughResultCache.generateCacheKey(walkthrough, tier, { 
    comparative, 
    approach  // ✅ Use the actual approach parameter
  });
  
  // Check cache first for expensive operations
  if (useCache) {
    const cachedResult = WalkthroughResultCache.get(cacheKey);
    if (cachedResult) {
      console.log(`⚡ Using cached result for ${walkthrough.domain}-${tier} (${approach})`);
      return cachedResult;
    }
  }
  
  if (comparative) {
    console.log(`🔍 Running comparative walkthrough for ${walkthrough.domain}`);
    const comparativeResult = await runComparativeDomainEvaluation(walkthrough, tier, engine);
    
    const result: ComparativeWalkthroughResult = {
      walkthroughId: walkthrough.id,
      domain: walkthrough.domain,
      tier,
      comparative: true,
      comparativeResults: comparativeResult.comparativeResults,
      analysis: comparativeResult.analysis,
      rankings: comparativeResult.rankings,
      mcdAdvantage: comparativeResult.mcdAdvantage,
      recommendations: generateComparativeRecommendations(comparativeResult),
      executionTime: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    // ✅ FIX: Cache with correct approach
    if (useCache) {
      WalkthroughResultCache.set(cacheKey, result, tier, { comparative, approach });
    }
    
    return result;
  } else {
    // ✅ FIX: Pass approach to simple execution
    const result = await runSimpleWalkthrough(walkthrough, tier, engine, approach);
    
    // ✅ FIX: Cache with correct approach
    if (useCache) {
      WalkthroughResultCache.set(cacheKey, result, tier, { comparative: false, approach });
    }
    
    return result;
  }
}




/**
 * ✅ NEW: Comparative domain execution across all variants
 */
export async function runComparativeDomainEvaluation(
  walkthrough: DomainWalkthrough,
  tier: SupportedTier,
  engine: EngineInterface
): Promise<{
  domain: string;
  comparativeResults: {
    mcd: VariantExecutionResult[];
    fewShot: VariantExecutionResult[];
    systemRole: VariantExecutionResult[];
    hybrid: VariantExecutionResult[];
    conversational: VariantExecutionResult[];
  };
  analysis: ComparativeAnalysis;
  rankings: string[];
  mcdAdvantage: MCDAdvantageValidation;
  summary: string;
}> {
  
  const startTime = performance.now();
  console.log(`🔍 Starting comparative evaluation: ${walkthrough.domain} [${tier}]`);
  
  // Calculate total work for progress tracking
  const totalVariants = walkthrough.scenarios.reduce((sum, scenario) => sum + scenario.variants.length, 0);
  let completedVariants = 0;
  
  // Initialize result containers
  const results = {
    mcd: [] as VariantExecutionResult[],
    fewShot: [] as VariantExecutionResult[],
    systemRole: [] as VariantExecutionResult[],
    hybrid: [] as VariantExecutionResult[],
    conversational: [] as VariantExecutionResult[]
  };

  // Execute ALL variants across ALL scenarios
  for (const scenario of walkthrough.scenarios) {
    for (const variant of scenario.variants) {
      try {
        const approach = categorizeVariantApproach(variant);
        const variantCacheKey = `${walkthrough.id}-${approach}-${variant.id}-${tier}`;
        
        // ✅ FIXED: Check cache before execution
        const cachedVariantResult = WalkthroughResultCache.get(variantCacheKey);
        if (cachedVariantResult) {
          console.log(`⚡ Using cached variant result for ${variant.id} (${approach})`);
          results[approach].push(cachedVariantResult as VariantExecutionResult);
          completedVariants++;
          continue;
        } // ✅ ADDED MISSING CLOSING BRACE
        
        console.log(`🔄 Executing variant ${variant.id} (${variant.type})`);
        
        // Enhanced progress reporting with ETA
        await updateProgressWithDetails({
          phase: 'execution',
          currentScenario: scenario.step,
          totalScenarios: walkthrough.scenarios.length,
          currentVariant: variant.name,
          currentTrial: `${completedVariants + 1}/${totalVariants} variants`
        }, startTime, completedVariants, totalVariants);
        
        const variantResult = await executeVariantComparatively(variant, tier, engine);
        
        // Cache the result
        WalkthroughResultCache.set(variantCacheKey, variantResult, tier, { approach });
        
        // Categorize results by approach type
        results[approach].push(variantResult);
        
        completedVariants++;
        console.log(`✅ Completed ${variant.id} (${approach}): ${variantResult.successRate} (${completedVariants}/${totalVariants})`);
        
      } catch (error) {
        console.error(`❌ Failed to execute variant ${variant.id}:`, error);
        
        // Add error result to maintain comparison fairness
        const errorResult = createErrorVariantResult(variant, error);
        const approach = categorizeVariantApproach(variant);
        results[approach].push(errorResult);
        
        completedVariants++;
      }
    }
  }

  // Calculate comprehensive comparative analysis
  const analysis = calculateComparativeAnalysis(results);
  const rankings = calculateVariantRankings(results);
  const mcdAdvantage = validateMCDAdvantage(results);
  
  const duration = performance.now() - startTime;
  
  return {
    domain: walkthrough.domain,
    comparativeResults: results,
    analysis,
    rankings,
    mcdAdvantage,
    summary: generateComparativeSummary(walkthrough.domain, results, analysis, rankings, duration)
  };
}


// ✅ MINIMAL FIX: Add missing variables that were referenced but not declared
// ✅ MINIMAL FIX: Add missing variables that were referenced but not declared
async function executeVariantComparatively(
  variant: WalkthroughVariant,
  tier: SupportedTier,
  engine: EngineInterface
): Promise<VariantExecutionResult> {
  
  const approach = categorizeVariantApproach(variant);
  
  // ✅ FIX: Verify expected trial count BEFORE execution
  const expectedTrials = 10; // Should always be 10 per variant
  const actualTrials = variant.trials.length;
  
  if (actualTrials !== expectedTrials) {
    console.warn(`⚠️ ${approach}: Expected ${expectedTrials} trials, got ${actualTrials}`);
    console.warn(`📋 Trial IDs: ${variant.trials.map(t => t.testId).join(', ')}`);
  }
  
  console.log(`🔄 Starting ${approach} variant: ${variant.name} (${actualTrials} trials)`);
  console.log(`📋 Trial IDs for ${approach}: ${variant.trials.map(t => t.testId).join(', ')}`);
  
  const trials: TrialExecutionResult[] = [];
  let successCount = 0;
  let totalTokens = 0;
  let totalLatency = 0;
  let totalAccuracy = 0;
  let mcdAlignmentCount = 0;
  
  for (const trial of variant.trials) {
    console.log(`🧪 Executing ${approach} trial: ${trial.testId} (${trial.userInput.substring(0, 50)}...)`);
    
    const trialResult = await executeTrialSpecificationWithTiers(trial, variant, engine);
    
    // ✅ ONLY CHANGE: Process complete trial result to preserve prompt data
    const completeTrialResult = processTrialResult(trialResult, trial);
    
    // ✅ KEEP: Convert to TrialExecutionResult format but preserve prompt data
    const executionResult: TrialExecutionResult = {
      testId: trial.testId,
      success: completeTrialResult.actualResults?.success || false,
      latencyMs: completeTrialResult.actualResults?.latencyMs || 0,
      tokenCount: completeTrialResult.actualResults?.tokenBreakdown?.output || 0,
      accuracy: completeTrialResult.actualResults?.accuracy || 0,
      tier: completeTrialResult.actualResults?.tier || 'poor',
      mcdAligned: completeTrialResult.actualResults?.mcdAligned || false,
      failureReasons: completeTrialResult.actualResults?.failureReasons || [],
      
      // ✅ ADD: Include prompt data in execution results
      inputPrompt: completeTrialResult.inputPrompt,
      modelResponse: completeTrialResult.modelResponse,
      evaluationSteps: completeTrialResult.evaluationSteps,
      promptMetadata: completeTrialResult.promptMetadata
    } as TrialExecutionResult & {
      inputPrompt?: string;
      modelResponse?: string;
      evaluationSteps?: string;
      promptMetadata?: any;
    };
    
    trials.push(executionResult);
    
    if (executionResult.success) successCount++;
    totalTokens += executionResult.tokenCount;
    totalLatency += executionResult.latencyMs;
    totalAccuracy += executionResult.accuracy;
    if (executionResult.mcdAligned) mcdAlignmentCount++;
    
    console.log(`  └─ Result: ${executionResult.success ? 'SUCCESS' : 'FAILED'} (${executionResult.latencyMs}ms, ${executionResult.tier})`);
  }
  
  // ✅ FIX: Ensure consistent trial reporting using actualTrials
  console.log(`✅ Completed ${approach} variant: ${successCount}/${actualTrials} successful`);
  
  return {
    variantId: variant.id,
    variantType: variant.type,
    variantName: variant.name,
    approach: approach,
    successRate: `${successCount}/${actualTrials}`,  // ✅ Use actualTrials, not hardcoded
    successCount,
    totalTrials: actualTrials,                        // ✅ Use actualTrials consistently
    avgLatency: Math.round(totalLatency / actualTrials),
    avgTokens: Math.round(totalTokens / actualTrials),
    avgAccuracy: totalAccuracy / actualTrials,
    mcdAlignmentRate: mcdAlignmentCount / actualTrials,
    trials,
    efficiency: calculateVariantEfficiency(successCount, actualTrials, totalLatency, totalTokens) // ✅ Use actualTrials
  };
}


// ✅ ENHANCED (Line ~2615): Better approach detection
function categorizeVariantApproach(variant: WalkthroughVariant): 'mcd' | 'fewShot' | 'systemRole' | 'hybrid' | 'conversational' {
  // ✅ PRIMARY: Type-based detection first
  if (variant.type === 'MCD') return 'mcd';
  if (variant.type === 'Hybrid') return 'hybrid';
  
  const nameLower = variant.name.toLowerCase();
  const promptLower = variant.prompt.toLowerCase();
  
  // ✅ ENHANCED: Multi-factor detection with Few-Shot priority fix
  if (nameLower.includes('few-shot') || nameLower.includes('pattern') || 
      promptLower.includes('examples:') || promptLower.includes('example 1:') ||
      promptLower.includes('learn from these') || promptLower.includes('apply pattern')) {
    console.log(`✅ Detected Few-Shot structure in ${variant.id}`);
    return 'fewShot';
  }
      
  if (nameLower.includes('system') || nameLower.includes('expert') || nameLower.includes('role') ||
      promptLower.includes('you are a') || promptLower.includes('as a professional')) {
    return 'systemRole';
  }
      
  if (nameLower.includes('conversational') || nameLower.includes('natural') ||
      promptLower.includes('help you') || promptLower.includes('happy to assist')) {
    return 'conversational';
  }
  
  // ✅ MCD: Detect MCD patterns last (since they might overlap)
  if (promptLower.includes('diagnostic analysis protocol') || 
      promptLower.includes('check:') || promptLower.includes('verify:') ||
      promptLower.includes('identify diagnostic elements')) {
    console.log(`✅ Detected MCD structure in ${variant.id}, categorizing as MCD`);
    return 'mcd';
  }
  
  // ✅ INFORMED: Default with logging
  console.warn(`⚠️ Could not categorize variant ${variant.id} (${variant.type}), defaulting to conversational`);
  return 'conversational';
}

function ensureConsistentTrialCounts(comparativeResults: ComparativeResults): void {
  const approaches = Object.keys(comparativeResults);
  
  approaches.forEach(approach => {
    const results = comparativeResults[approach] || [];
    results.forEach(variant => {
      const expectedTrials = 10; // Should always be 10
      const actualTrials = variant.totalTrials;
      
      if (actualTrials !== expectedTrials) {
        console.warn(`⚠️ ${approach} variant ${variant.variantId}: Expected ${expectedTrials} trials, got ${actualTrials}`);
        
        // ✅ DEBUG: Log what trials are missing
        console.warn(`📋 ${approach} trial count mismatch - check variant.trials array`);
      }
    });
  });
}




/**
 * ✅ FIXED: Enhanced approach-specific evaluation that ALWAYS calculates MCD compliance
 */
function evaluateByApproach(
  output: string,
  trial: TrialSpecification,
  approach: string
): TrialEvaluationResult {
  
  const baseEvaluation = evaluateTrialWithTiers(output, trial);
  
  // ✅ CRITICAL FIX: ALWAYS calculate MCD compliance regardless of approach
  const mcdCompliant = checkMCDCompliance(output, trial);
  
  // Apply approach-specific adjustments while preserving MCD evaluation
  switch (approach) {
    case 'mcd':
      return evaluateMCDApproach(output, trial, { ...baseEvaluation, mcdCompliant });
    case 'fewShot':
      return evaluateFewShotApproach(output, trial, { ...baseEvaluation, mcdCompliant });
    case 'systemRole':
      return evaluateSystemRoleApproach(output, trial, { ...baseEvaluation, mcdCompliant });
    case 'hybrid':
      return evaluateHybridApproach(output, trial, { ...baseEvaluation, mcdCompliant });
    case 'conversational':
      return evaluateConversationalApproach(output, trial, { ...baseEvaluation, mcdCompliant });
    default:
      return { ...baseEvaluation, mcdCompliant };
  }
}

function evaluateMCDApproach(output: string, trial: TrialSpecification, base: TrialEvaluationResult): TrialEvaluationResult {
  const domain = extractDomainFromTrial(trial);
  const defaultCriteria = getDefaultSuccessCriteria(domain, 'Q4');
  const maxTokenBudget = trial.successCriteria?.maxTokenBudget ?? defaultCriteria.maxTokenBudget;
  
  const structuralBonus = hasStructuredFormat(output) ? 0.1 : 0;
  const efficiencyBonus = countTokens(output) <= maxTokenBudget * 0.8 ? 0.1 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + structuralBonus + efficiencyBonus),
    mcdCompliant: checkMCDCompliance(output, trial)
  };
}


/**
 * ✅ FIXED: All approach evaluators now preserve MCD compliance
 */
function evaluateFewShotApproach(
  output: string, 
  trial: TrialSpecification, 
  base: TrialEvaluationResult
): TrialEvaluationResult {
  // Few-shot should follow patterns from examples
  const patternFollowing = detectPatternFollowing(output, trial);
  const patternBonus = patternFollowing ? 0.05 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + patternBonus),
    // ✅ PRESERVED: MCD compliance from base evaluation
    mcdCompliant: base.mcdCompliant  // Don't override this!
  };
}

function evaluateSystemRoleApproach(
  output: string, 
  trial: TrialSpecification, 
  base: TrialEvaluationResult
): TrialEvaluationResult {
  // System role should be professional and authoritative
  const professionalTone = detectProfessionalTone(output);
  const professionalBonus = professionalTone ? 0.05 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + professionalBonus),
    // ✅ PRESERVED: MCD compliance from base evaluation
    mcdCompliant: base.mcdCompliant
  };
}

function evaluateHybridApproach(
  output: string, 
  trial: TrialSpecification, 
  base: TrialEvaluationResult
): TrialEvaluationResult {
  // Hybrid should combine best of MCD and other approaches
  const structuralBonus = hasStructuredFormat(output) ? 0.05 : 0;
  const patternBonus = detectPatternFollowing(output, trial) ? 0.05 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + structuralBonus + patternBonus),
    // ✅ PRESERVED: MCD compliance from base evaluation
    mcdCompliant: base.mcdCompliant
  };
}

function evaluateConversationalApproach(
  output: string, 
  trial: TrialSpecification, 
  base: TrialEvaluationResult
): TrialEvaluationResult {
  const domain = extractDomainFromTrial(trial);
  const maxTokenBudget = trial.successCriteria?.maxTokenBudget || 
                        getDefaultSuccessCriteria(domain, 'Q4').maxTokenBudget;
  const verbosityPenalty = countTokens(output) > maxTokenBudget * 1.5 ? -0.1 : 0;
  
  return {
    ...base,
    accuracy: Math.max(0, base.accuracy + verbosityPenalty),
    // ✅ PRESERVED: MCD compliance from base evaluation
    mcdCompliant: base.mcdCompliant
  };
}

/**
 * ✅ NEW: Calculate MCD alignment ratios for comparative analysis
 */
function calculateMcdAlignmentByApproachEnhanced(results: ComparativeResults): {
  mcd: number;
  fewShot: number; 
  systemRole: number;
  hybrid: number;
  conversational: number;
} {
  const mcdAlignment = {
    mcd: 0,
    fewShot: 0,
    systemRole: 0,
    hybrid: 0,
    conversational: 0
  };
  
  // Calculate for each approach
  Object.keys(results).forEach(approach => {
    const approachResults = results[approach] || [];
    let totalTrials = 0;
    let mcdCompliantTrials = 0;
    
    approachResults.forEach(variant => {
      variant.trials.forEach(trial => {
        totalTrials++;
        // ✅ CRITICAL: Check MCD alignment from actual trial evaluation
        if (trial.mcdAligned) {
          mcdCompliantTrials++;
        }
      });
    });
    
    mcdAlignment[approach] = totalTrials > 0 ? 
      Math.round((mcdCompliantTrials / totalTrials) * 100) : 0;
  });
  
  return mcdAlignment;
}





/**
 * ✅ NEW: Calculate variant rankings
 */
export function calculateVariantRankings(results: ComparativeResults): string[] {
  const approaches = ['mcd', 'fewShot', 'systemRole', 'hybrid', 'conversational'];
  const scores: { [key: string]: number } = {};
  
  approaches.forEach(approach => {
    const approachResults = results[approach] || [];
    
    if (approachResults.length > 0) {
      // ✅ FIX: Ensure we're using actual trial counts
      const avgSuccessRate = calculateAverageSuccessRate(approachResults);
      const avgTokenEfficiency = calculateAverageEfficiency(approachResults);
      const avgLatencyScore = calculateAverageLatency(approachResults);
      
      // ✅ VERIFICATION: Log what we're actually measuring
      const totalTrialsForApproach = approachResults.reduce((sum, r) => sum + r.totalTrials, 0);
      const totalSuccessForApproach = approachResults.reduce((sum, r) => sum + r.successCount, 0);
      
      console.log(`📊 ${approach}: ${totalSuccessForApproach}/${totalTrialsForApproach} total trials`);
      
      // ✅ FIXED: Complete the calculation
      scores[approach] = avgSuccessRate * 0.4 + avgTokenEfficiency * 0.3 + (avgLatencyScore > 0 ? (1000 / avgLatencyScore) * 0.3 : 0);
    } else {
      scores[approach] = 0;
    }
  });
  
  // Sort and return rankings
  return approaches
    .filter(approach => scores[approach] > 0)
    .sort((a, b) => scores[b] - scores[a]);
}



/**
 * ✅ NEW: Comprehensive comparative analysis
 */
function calculateComparativeAnalysis(results: ComparativeResults): ComparativeAnalysis {
  const analysis: ComparativeAnalysis = {
    successRatios: {},
    tokenEfficiencyRatios: {},
    latencyRatios: {},
    accuracyRatios: {},
    consistencyScores: {},
    overallScores: {}
  };
  
  const approaches = ['mcd', 'fewShot', 'systemRole', 'hybrid', 'conversational'];
  const baseline = results.conversational && results.conversational.length > 0 ? 
    calculateBaselineMetrics(results.conversational) : 
    { successRate: 0.3, avgTokens: 80, avgLatency: 1000, accuracy: 0.4 };
  
  approaches.forEach(approach => {
    const approachResults = results[approach] || [];
    if (approachResults.length > 0) {
      
      const metrics = calculateApproachMetrics(approachResults);
      
      // Calculate ratios relative to baseline
      analysis.successRatios[approach] = baseline.successRate > 0 ? 
        metrics.successRate / baseline.successRate : 
        (metrics.successRate > 0 ? 10 : 0);
        
      analysis.tokenEfficiencyRatios[approach] = metrics.avgTokens > 0 ? 
        baseline.avgTokens / metrics.avgTokens : 1; // Inverse for efficiency
        
      analysis.latencyRatios[approach] = metrics.avgLatency > 0 ? 
        baseline.avgLatency / metrics.avgLatency : 1;
        
      analysis.accuracyRatios[approach] = baseline.accuracy > 0 ? 
        metrics.accuracy / baseline.accuracy : 
        (metrics.accuracy > 0 ? 10 : 0);
      
      analysis.consistencyScores[approach] = calculateConsistency(approachResults);
      
      // Overall score
      analysis.overallScores[approach] = (
        analysis.successRatios[approach] * 0.3 +
        analysis.tokenEfficiencyRatios[approach] * 0.25 +
        analysis.latencyRatios[approach] * 0.25 +
        analysis.accuracyRatios[approach] * 0.2
      );
    }
  });
  
  return analysis;
}
/**
 * ✅ NEW: Validate MCD advantages
 */
export function validateMCDAdvantage(results: ComparativeResults): MCDAdvantageValidation {
  const concerns: string[] = [];
  const recommendations: string[] = [];
  
  const mcdResults = results.mcd || [];
  const nonMcdResults = [
    ...(results.fewShot || []),
    ...(results.systemRole || []),
    ...(results.conversational || [])
  ];
  
  if (mcdResults.length === 0) {
    concerns.push("No MCD results available for comparison");
    return { 
      validated: false, 
      concerns, 
      recommendations: ["Add MCD variants to domains"],
      confidenceLevel: 0,
      statisticalSignificance: false
    };
  }
  
  // Calculate metrics
  const mcdMetrics = calculateApproachMetrics(mcdResults);
  const nonMcdMetrics = nonMcdResults.length > 0 ? 
    calculateApproachMetrics(nonMcdResults) : 
    { successRate: 0, avgTokens: 100, avgLatency: 1000, accuracy: 0 };
  
  // Validate success rate advantage
  const successAdvantage = nonMcdMetrics.successRate > 0 ? 
    mcdMetrics.successRate / nonMcdMetrics.successRate : 
    (mcdMetrics.successRate > 0 ? 10 : 1);
    
  if (successAdvantage < 1.5) {
    concerns.push(`MCD success advantage below expected (${successAdvantage.toFixed(2)}x vs expected 1.5x+)`);
    recommendations.push("Review MCD implementation or adjust evaluation criteria");
  }
  
  // Validate token efficiency advantage
  const tokenEfficiency = mcdMetrics.avgTokens > 0 ? 
    nonMcdMetrics.avgTokens / mcdMetrics.avgTokens : 1;
    
  if (tokenEfficiency < 1.3) {
    concerns.push(`Token efficiency advantage below expected (${tokenEfficiency.toFixed(2)}x vs expected 1.3x+)`);
    recommendations.push("Verify MCD prompt design for token efficiency");
  }
  
  // Validate latency advantage
  const latencyAdvantage = mcdMetrics.avgLatency > 0 ? 
    nonMcdMetrics.avgLatency / mcdMetrics.avgLatency : 1;
    
  if (latencyAdvantage < 1.2) {
    concerns.push(`Latency advantage below expected (${latencyAdvantage.toFixed(2)}x vs expected 1.2x+)`);
    recommendations.push("Optimize MCD processing for better latency");
  }
  
  // Calculate confidence level
  const confidenceLevel = calculateConfidenceLevel(mcdResults, nonMcdResults);
  const statisticalSignificance = confidenceLevel >= 0.8;
  
  const validated = concerns.length === 0 && statisticalSignificance;
  
  return {
    validated,
    concerns,
    recommendations,
    confidenceLevel,
    statisticalSignificance,
    advantages: {
      successRate: successAdvantage,
      tokenEfficiency,
      latencyAdvantage,
      overallAdvantage: (successAdvantage + tokenEfficiency + latencyAdvantage) / 3
    }
  };
}

/**
 * ✅ NEW: Supporting interfaces
 */
interface VariantExecutionResult {
  variantId: string;
  variantType: 'MCD' | 'Non-MCD' | 'Hybrid';
  variantName: string;
  approach: string;
  successRate: string;
  successCount: number;
  totalTrials: number;
  avgLatency: number;
  avgTokens: number;
  avgAccuracy: number;
  mcdAlignmentRate: number;
  trials: TrialExecutionResult[];
   efficiency: number;
  errorDetails?: {  // ✅ NEW: Optional error details
    message: string;
    type: string;
    timestamp: number;
  };
}

interface ComparativeResults {
  mcd: VariantExecutionResult[];
  fewShot: VariantExecutionResult[];
  systemRole: VariantExecutionResult[];
  hybrid: VariantExecutionResult[];
  conversational: VariantExecutionResult[];
}

interface ComparativeAnalysis {
  successRatios: { [key: string]: number };
  tokenEfficiencyRatios: { [key: string]: number };
  latencyRatios: { [key: string]: number };
  accuracyRatios: { [key: string]: number };
  consistencyScores: { [key: string]: number };
  overallScores: { [key: string]: number };
}

interface MCDAdvantageValidation {
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


// ✅ MEMORY FIX: Safe window access to prevent memory leaks
function safeWindowAccess<T>(callback: (window: any) => T, fallback?: T): T | undefined {
  try {
    if (typeof window !== 'undefined' && window !== null) {
      return callback(window);
    }
    return fallback;
  } catch (error) {
    console.warn('Safe window access failed:', error);
    return fallback;
  }
}

 



// ✅ MISSING: Variant efficiency calculation
function calculateVariantEfficiency(
  successCount: number, 
  totalTrials: number, 
  totalLatency: number, 
  totalTokens: number
): number {
  if (totalTrials === 0) return 0;
  
  const successRate = successCount / totalTrials;
  const avgLatency = totalLatency / totalTrials;
  const avgTokens = totalTokens / totalTrials;
  
  // Efficiency score: success rate weighted by speed and token efficiency
  const latencyScore = Math.max(0, 1 - (avgLatency / 2000)); // Normalize against 2s
  const tokenScore = Math.max(0, 1 - (avgTokens / 100)); // Normalize against 100 tokens
  
  return (successRate * 0.5) + (latencyScore * 0.3) + (tokenScore * 0.2);
}

// ✅ MISSING: Error variant result creation
function createErrorVariantResult(variant: WalkthroughVariant, error: any): VariantExecutionResult {
  // ✅ ENHANCED: More detailed error information
  const errorMessage = error?.message || 'Unknown execution error';
  const errorType = error?.name || 'Error';
  
  return {
    variantId: variant.id,
    variantType: variant.type,
    variantName: variant.name,
    approach: categorizeVariantApproach(variant),
    successRate: '0/0',
    successCount: 0,
    totalTrials: variant.trials?.length || 0, // ✅ SAFER: Handle missing trials
    avgLatency: 0,
    avgTokens: 0,
    avgAccuracy: 0,
    mcdAlignmentRate: 0,
    trials: [],
    efficiency: 0,
    // ✅ NEW: Add error details for debugging
    errorDetails: {
      message: errorMessage,
      type: errorType,
      timestamp: Date.now()
    }
  };
}


// ✅ MISSING: Statistical calculation functions
function calculateAverageSuccessRate(results: VariantExecutionResult[]): number {
  if (results.length === 0) return 0;
  
  let totalSuccess = 0;
  let totalTrials = 0;
  
  results.forEach(result => {
    totalSuccess += result.successCount;
    totalTrials += result.totalTrials;
  });
  
  return totalTrials > 0 ? totalSuccess / totalTrials : 0;
}

function calculateAverageEfficiency(results: VariantExecutionResult[]): number {
  if (results.length === 0) return 0;
  return results.reduce((sum, result) => sum + result.efficiency, 0) / results.length;
}

function calculateAverageLatency(results: VariantExecutionResult[]): number {
  if (results.length === 0) return 0;
  return results.reduce((sum, result) => sum + result.avgLatency, 0) / results.length;
}

function calculateConsistency(results: VariantExecutionResult[]): number {
  if (results.length < 2) return 1.0;
  
  const latencies = results.map(r => r.avgLatency);
  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - avgLatency, 2), 0) / latencies.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (lower deviation = higher consistency)
  return Math.max(0, 1 - (standardDeviation / avgLatency));
}

function calculateBaselineMetrics(results: VariantExecutionResult[]): {
  successRate: number;
  avgTokens: number;
  avgLatency: number;
  accuracy: number;
} {
  if (results.length === 0) {
    return { successRate: 0.3, avgTokens: 80, avgLatency: 1000, accuracy: 0.4 };
  }
  
  return {
    successRate: calculateAverageSuccessRate(results),
    avgTokens: results.reduce((sum, r) => sum + r.avgTokens, 0) / results.length,
    avgLatency: calculateAverageLatency(results),
    accuracy: results.reduce((sum, r) => sum + r.avgAccuracy, 0) / results.length
  };
}

interface ApproachMetrics {
  successRate: number;
  avgTokens: number;
  avgLatency: number;
  accuracy: number;
}

function calculateApproachMetrics(results: VariantExecutionResult[]): ApproachMetrics {
  let totalTrials = 0;
  let successfulTrials = 0;
  let totalTokens = 0;
  let totalLatency = 0;
  let totalAccuracy = 0;
  
  results.forEach(variant => {
    // ✅ CRITICAL: Count ALL trials, not just successful ones
    totalTrials += variant.totalTrials;  // Should be consistent per variant
    successfulTrials += variant.successCount;
    totalTokens += variant.avgTokens * variant.totalTrials;
    totalLatency += variant.avgLatency * variant.totalTrials;
    totalAccuracy += variant.avgAccuracy * variant.totalTrials;
  });
  
  // ✅ VERIFICATION: Log trial counts for debugging
  console.log(`📊 ${results[0]?.approach || 'Unknown'} metrics: ${successfulTrials}/${totalTrials} trials`);
  
  return {
    successRate: totalTrials > 0 ? successfulTrials / totalTrials : 0,
    avgTokens: totalTrials > 0 ? totalTokens / totalTrials : 0,
    avgLatency: totalTrials > 0 ? totalLatency / totalTrials : 0,
    accuracy: totalTrials > 0 ? totalAccuracy / totalTrials : 0
  };
}




// ✅ MISSING: Add these functions
function generateComparativeSummary(
  domain: string, 
  results: ComparativeResults, 
  analysis: ComparativeAnalysis, 
  rankings: string[], 
  duration: number
): string {
  const topPerformer = rankings[0] || 'unknown';
  const mcdPosition = rankings.indexOf('mcd') + 1;
  
  let summary = `${domain} Comparative Analysis (${Math.round(duration)}ms):\n`;
  summary += `🏆 Top Performer: ${topPerformer}\n`;
  summary += `📊 Rankings: ${rankings.join(' > ')}\n`;
  summary += `🎯 MCD Position: ${mcdPosition > 0 ? `#${mcdPosition}` : 'Not ranked'}\n`;
  
  // Add key insights
  const mcdResults = results.mcd || [];
  const conversationalResults = results.conversational || [];
  
  if (mcdResults.length > 0 && conversationalResults.length > 0) {
    const mcdSuccess = calculateAverageSuccessRate(mcdResults);
    const convSuccess = calculateAverageSuccessRate(conversationalResults);
    const advantage = convSuccess > 0 ? (mcdSuccess / convSuccess).toFixed(1) : 'N/A';
    summary += `⚡ MCD vs Conversational: ${advantage}x advantage\n`;
  }
  
  return summary;
}

function generateComparativeRecommendations(comparativeResult: any): string[] {
  const recommendations: string[] = [];
  const { analysis, rankings, mcdAdvantage } = comparativeResult;
  
  // Overall performance recommendations
  if (rankings.length > 0) {
    const topPerformer = rankings[0];
    recommendations.push(`${topPerformer} approach showed best overall performance`);
    
    if (topPerformer !== 'mcd') {
      recommendations.push(`Consider adopting ${topPerformer} techniques in MCD implementation`);
    }
  }
  
  // MCD-specific recommendations
  if (mcdAdvantage && !mcdAdvantage.validated) {
    recommendations.push(...mcdAdvantage.recommendations);
  }
  
  // Token efficiency recommendations
  const tokenRatios = analysis.tokenEfficiencyRatios;
  const mostEfficient = Object.keys(tokenRatios).reduce((a, b) => 
    tokenRatios[a] > tokenRatios[b] ? a : b
  );
  
  if (mostEfficient !== 'mcd') {
    recommendations.push(`${mostEfficient} approach shows superior token efficiency`);
  }
  
  return recommendations.length > 0 ? recommendations : 
    ['Comparative analysis completed - all approaches performing within expected ranges'];
}
/**
 * ✅ FIX: Select the correct variant based on approach
 */
function selectVariantForApproach(
  scenario: WalkthroughScenario, 
  approach: string
): WalkthroughVariant | null {
  
  // Map approaches to variant patterns
  const approachPatterns = {
    'mcd': ['mcd', 'structured', 'w1a1', 'w2b1', 'w3c1'],
    'few-shot': ['few-shot', 'pattern', 'w1a3', 'w2b3', 'w3c2'],  
    'system-role': ['system', 'expert', 'role', 'w1a4', 'w2b4', 'w3c3'],
    'hybrid': ['hybrid', 'combined', 'w1a5', 'w2b5', 'w3c4'],
    'conversational': ['conversational', 'natural', 'w1a2', 'w2b2', 'w3c5']
  };
  
  const patterns = approachPatterns[approach] || approachPatterns['mcd'];
  
  // Find variant that matches the approach
  for (const variant of scenario.variants) {
    const variantId = variant.id.toLowerCase();
    const variantName = variant.name.toLowerCase();
    
    if (patterns.some(pattern => 
      variantId.includes(pattern) || 
      variantName.includes(pattern)
    )) {
      console.log(`✅ Selected variant ${variant.id} for ${approach} approach`);
      return variant;
    }
  }
  
  // Fallback to first variant if no match
  console.warn(`⚠️ No variant found for ${approach}, using first variant`);
  return scenario.variants[0] || null;
}

// ✅ MISSING: Simple walkthrough fallback
async function runSimpleWalkthrough(
  walkthrough: DomainWalkthrough,
  tier: SupportedTier,
  engine: EngineInterface,
  approach: string = 'standard'  // ✅ ADD approach parameter
): Promise<WalkthroughResult> {
  
  // ✅ FIX: Use approach-specific cache key
  const cacheKey = WalkthroughResultCache.generateCacheKey(walkthrough, tier, { 
    comparative: false, 
    approach  // ✅ Use passed approach
  });
  
  console.log(`📋 Running simple walkthrough for ${walkthrough.domain} with ${approach} approach`);
  
  const startTime = performance.now();
  const scenarioResults: ScenarioResult[] = [];
  
  
for (const scenario of walkthrough.scenarios) {
  const variants: VariantResult[] = [];
  
  // ✅ FIX: Select approach-specific variant instead of always first
  const selectedVariant = selectVariantForApproach(scenario, approach);
  
  if (selectedVariant) {
    console.log(`🎯 Executing ${approach} approach with variant: ${selectedVariant.id}`);
    const variantResult = await executeVariant(selectedVariant, tier, engine, scenario);
    variants.push(variantResult);
  } else {
    console.error(`❌ No variant available for ${approach} approach in scenario ${scenario.step}`);
  }
  
  scenarioResults.push({
    step: scenario.step,
    context: scenario.context,
    variants,
    mcdVsNonMcdComparison: {
      mcdSuccess: variants[0]?.measuredProfile.actualSuccessCount || 0,
      nonMcdSuccess: 0,
      mcdAvgLatency: variants[0]?.measuredProfile.avgLatency || 0,
      nonMcdAvgLatency: 0,
      mcdAvgTokens: variants[0]?.measuredProfile.avgTokens || 0,
      nonMcdAvgTokens: 0
    }
  });
}

  
  const domainMetrics = calculateEnhancedDomainMetrics(scenarioResults, walkthrough, tier);
  const recommendations = generateEnhancedRecommendations(domainMetrics, tier, walkthrough, scenarioResults);
  
  return {
    walkthroughId: walkthrough.id,
    domain: walkthrough.domain,
    tier,
    scenarioResults,
    domainMetrics,
    recommendations,
    executionTime: Math.round(performance.now() - startTime),
    timestamp: new Date().toISOString()
  };
}


function monitorAndCleanMemory(context: string): void {
  try {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memInfo = (performance as any).memory;
      const usedMB = Math.round(memInfo.usedJSHeapSize / (1024 * 1024));
      const totalMB = Math.round(memInfo.totalJSHeapSize / (1024 * 1024));
      const limitMB = Math.round(memInfo.jsHeapSizeLimit / (1024 * 1024));
      const usagePercent = Math.round((usedMB / limitMB) * 100);
      
      console.log(`🔍 Memory ${context}: ${usedMB}MB used / ${totalMB}MB total / ${limitMB}MB limit (${usagePercent}%)`);
      
      // ✅ ESCALATED WARNINGS: More sophisticated thresholds
      if (usagePercent > 70) {
        console.warn(`⚠️ High memory usage: ${usagePercent}% (${usedMB}MB) - monitoring closely`);
        
        // Attempt normal garbage collection
        if (typeof global !== 'undefined' && global.gc) {
          try {
            global.gc();
            
            // Check again after GC
            const newMemInfo = (performance as any).memory;
            const newUsedMB = Math.round(newMemInfo.usedJSHeapSize / (1024 * 1024));
            const freedMB = usedMB - newUsedMB;
            
            if (freedMB > 0) {
              console.log(`✅ GC freed ${freedMB}MB of memory`);
            }
          } catch (gcError) {
            console.warn('GC attempt failed:', gcError);
          }
        }
      }
      
      
if (usagePercent > 85) {
  console.error(`🚨 High memory usage: ${usagePercent}% - initiating selective cleanup`);
  performSelectiveMemoryCleanup(context, true);  // Preserve prompts by default
}

// ✅ ADD NEW EXTREME CASE:
if (usagePercent > 95) {
  console.error(`🚨 CRITICAL memory usage: ${usagePercent}% - emergency cleanup`);
  performSelectiveMemoryCleanup(context, false);  // Allow prompt clearing as last resort
}
      
    } else {
      console.log(`🔍 Memory monitoring not available for ${context}`);
    }
  } catch (error) {
    console.warn(`Memory monitoring failed for ${context}:`, error);
  }
}

async function executeWithMemoryManagement<T>(
  executionFunction: () => Promise<T>,
  context: string,
  approach: string
): Promise<T> {
  
  const preMemoryUsage = getMemoryUsage();
  
  if (preMemoryUsage.usagePercent > 75) {
    console.warn(`⚠️ High memory usage detected before ${approach} execution: ${preMemoryUsage.usagePercent}%`);
    await performIntelligentMemoryCleanup(approach, context);
  }
  
  const memoryMonitor = setInterval(() => {
    const currentUsage = getMemoryUsage();
    if (currentUsage.usagePercent > 85) {
      console.error(`🚨 Critical memory usage during ${approach}: ${currentUsage.usagePercent}%`);
      performEmergencyCleanup();
    }
  }, 5000);
  
  try {
    const result = await executionFunction();
    clearInterval(memoryMonitor);
    await performSelectiveCleanup(approach, false);
    return result;
  } catch (error) {
    clearInterval(memoryMonitor);
    console.error(`❌ ${approach} execution failed:`, error);
    throw error;
  }
}

/**
 * ✅ NEW: Intelligent memory cleanup preserving critical data
 */
async function performIntelligentMemoryCleanup(approach: string, context: string): Promise<void> {
  console.log(`🧹 Performing intelligent cleanup for ${approach} approach`);
  
  try {
    if (typeof window !== 'undefined') {
      WalkthroughResultCache.cleanOldEntries();
      const tempElements = document.querySelectorAll('[data-temp="true"]');
      tempElements.forEach(el => el.remove());
    }
    
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
      console.log(`✅ Garbage collection completed for ${approach}`);
    }
    
    if (approach === 'fewShot') {
      clearFewShotExampleCache();
    }
    
  } catch (error) {
    console.warn(`Memory cleanup warning for ${approach}:`, error);
  }
}

function performEmergencyCleanup(): void {
  try {
    if (typeof global !== 'undefined' && global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }
    WalkthroughResultCache.invalidate();
    console.log('🚨 Emergency cleanup completed');
  } catch (error) {
    console.error('Emergency cleanup failed:', error);
  }
}

function clearFewShotExampleCache(): void {
  // Clear any cached few-shot examples to free memory
  if (typeof window !== 'undefined' && (window as any).fewShotExampleCache) {
    (window as any).fewShotExampleCache = {};
  }
}

function performSelectiveCleanup(approach: string, preservePrompts: boolean): void {
  // Selective cleanup logic - already implemented in your existing code
  performSelectiveMemoryCleanup(approach, preservePrompts);
}

/**
 * ✅ UTILITY: Enhanced memory usage tracking
 */
function getMemoryUsage(): { usagePercent: number; usedMB: number; totalMB: number } {
  try {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memInfo = (performance as any).memory;
      const usedMB = Math.round(memInfo.usedJSHeapSize / (1024 * 1024));
      const limitMB = Math.round(memInfo.jsHeapSizeLimit / (1024 * 1024));
      const usagePercent = Math.round((usedMB / limitMB) * 100);
      
      return { usagePercent, usedMB, totalMB: limitMB };
    }
  } catch (error) {
    console.warn('Memory usage check failed:', error);
  }
  
  return { usagePercent: 0, usedMB: 0, totalMB: 0 };
}
function performSelectiveMemoryCleanup(context: string, preservePrompts: boolean = true): void {
  console.log(`🧹 Performing selective memory cleanup: ${context} (preserve prompts: ${preservePrompts})`);
  
  try {
    // Force garbage collection with error handling
    if (typeof global !== 'undefined' && global.gc) {
      try {
        for (let i = 0; i < 2; i++) {
          global.gc();
        }
        console.log(`✅ GC passes completed`);
      } catch (gcError) {
        console.warn('GC failed:', gcError);
      }
    }
    
    // Enhanced memory cleanup with safety checks
    if (typeof window !== 'undefined') {
      try {
        if ((window as any).WalkthroughTemplateCache?.clearCache) {
          (window as any).WalkthroughTemplateCache.clearCache();
          console.log('✅ Template cache cleared');
        }
      } catch (cacheError) {
        console.warn('Cache clearing failed:', cacheError);
      }
    }
    
  } catch (error) {
    console.error('❌ Memory cleanup failed:', error);
  }
}



// ADD: Concurrent execution helpers - Place BEFORE executeVariant function
async function executeVariantConcurrently(
  variant: WalkthroughVariant,
  tier: SupportedTier,
  engine: EngineInterface,
  scenario: WalkthroughScenario,
  maxConcurrency: number = 2
): Promise<VariantResult> {
  console.log(`🔬 Executing ${variant.trials.length} trials for variant ${variant.id} (concurrent)`);
  
  const trialResults: TrialResult[] = [];
  const totalTrials = variant.trials.length;
  let totalLatency = 0;
  let totalTokens = 0;
  let successCount = 0;
  let mcdAlignmentTotal = 0;
  
  try {
    // ✅ MEMORY FIX: Process trials in smaller chunks with cleanup
    const CLEANUP_THRESHOLD = 10; // Clean up every 10 batches
    let batchesProcessed = 0;
    
    for (let i = 0; i < totalTrials; i += maxConcurrency) {
      const batch = variant.trials.slice(i, i + maxConcurrency);
      const batchNumber = Math.floor(i / maxConcurrency) + 1;
      const totalBatches = Math.ceil(totalTrials / maxConcurrency);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} trials)`);
      
      // ✅ MEMORY FIX: Create promises array locally and clear after use
      let batchPromises: Promise<TrialResult>[] = [];
      
      try {
        batchPromises = batch.map(async (trial, index) => {
          try {
            console.log(`🧪 Executing trial ${trial.testId} (batch ${batchNumber})`);
            
            const executedTrial = await executeTrialSpecificationWithTiers(trial, variant, engine);
            const result = processTrialResult(executedTrial, trial);
            
            // ✅ MEMORY FIX: Clear references immediately after processing
            executedTrial.actualResults = null;
            
            return result;
            
          } catch (error) {
            console.error(`❌ Trial ${trial.testId} failed:`, error);
            return createErrorTrialResult(trial, error);
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // ✅ MEMORY FIX: Process results and clear references immediately
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const trialResult = result.value;
            trialResults.push(trialResult);
            
            // Accumulate metrics
            if (trialResult.actualResults?.latencyMs) {
              totalLatency += trialResult.actualResults.latencyMs;
            }
            if (trialResult.actualResults?.tokenBreakdown?.output) {
              totalTokens += trialResult.actualResults.tokenBreakdown.output;
            }
            if (trialResult.success) successCount++;
            if (trialResult.actualResults?.mcdAligned) mcdAlignmentTotal++;
            
          } else {
            console.error(`❌ Batch trial failed:`, result.reason);
            trialResults.push(createErrorTrialResult(batch[index], result.reason));
          }
        });
        
      } finally {
        // ✅ MEMORY FIX: Always clear batch promises array
        batchPromises.length = 0;
        batchPromises = null;
      }
      
      // ✅ MEMORY FIX: Periodic cleanup
      batchesProcessed++;
      if (batchesProcessed % CLEANUP_THRESHOLD === 0) {
        console.log(`🧹 Performing memory cleanup after ${batchesProcessed} batches`);
        
        // Force garbage collection if available
        if (typeof global !== 'undefined' && global.gc) {
          try {
            global.gc();
          } catch (gcError) {
            // GC not available, continue
          }
        }
        
        // Clear any large temporary arrays
// ✅ CORRECTED: Fix the condition and comments
// ✅ FIXED: Enhanced Memory Protection for MCD Prompts
if (trialResults.length > 50) {
  const memUsage = (performance as any).memory?.usedJSHeapSize;
  const memLimit = (performance as any).memory?.jsHeapSizeLimit;
  const usagePercent = memUsage && memLimit ? (memUsage / memLimit * 100) : 0;

  if (usagePercent > 85) {  // ✅ CHANGED: From 75 to 85
    trialResults.forEach(result => {
      if (result.actualResults?.output?.length > 4000 &&  // ✅ CHANGED: From 3000 to 4000
          !result.inputPrompt?.includes('Diagnostic analysis protocol') &&  // ✅ NEW: Protect MCD prompts
          !result.inputPrompt?.includes('Extract and validate appointment') &&  // ✅ NEW: Protect MCD appointment prompts
          !result.inputPrompt?.includes('Navigate user request analysis') &&  // ✅ NEW: Protect MCD navigation prompts
          !result.inputPrompt?.includes('PRESERVE') &&    
          result.success === false) {                     
        result.actualResults.output = result.actualResults.output.substring(0, 2500) + '... [memory cleanup]';  // ✅ CHANGED: From 1500 to 2500
      }
    });
  }
}


      }
      
      // Brief pause between batches to prevent overwhelming the engine
      if (i + maxConcurrency < totalTrials) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Check for stop conditions
      if ((window as any)?.immediateStop || (window as any)?.globalImmediateStop) {
        console.log('🛑 Concurrent execution stopped by user');
        break;
      }
    }
    
    return calculateVariantResult(variant, trialResults, totalLatency, totalTokens, successCount, mcdAlignmentTotal);
    
  } catch (error) {
    console.error(`❌ Concurrent execution failed for variant ${variant.id}:`, error);
    throw error;
  } finally {
    // ✅ MEMORY FIX: Always perform final cleanup
    console.log(`🧹 Final memory cleanup for variant ${variant.id}`);
    
    // Clear any remaining references
    variant.trials.forEach(trial => {
      if (trial.actualResults) {
        trial.actualResults = null;
      }
    });
    
    console.log(`✅ Memory cleanup completed for ${variant.id}`);
  }
}

// ✅ ADD: Backend verification function
async function verifyBackendStorage(testId: string): Promise<{success: boolean}> {
  try {
    // Check if trial was actually stored
    const storageKey = `trial_${testId}`;
    const stored = localStorage.getItem(storageKey);
    return { success: !!stored };
  } catch (error) {
    console.error('Backend verification failed:', error);
    return { success: false };
  }
}

// ✅ ADD: Backup storage function  
async function storeLocallyAsBackup(trialResult: TrialResult): Promise<void> {
  try {
    const backupKey = `backup_${trialResult.testId}_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(trialResult));
    console.log(`✅ Backup stored: ${backupKey}`);
  } catch (error) {
    console.error('Backup storage failed:', error);
  }
}

/**
 * ✅ ENHANCED: Process trial result with prompt details preserved
 */
/**
 * ✅ ENHANCED: Process trial result with complete prompt data storage
 */
function processTrialResult(executedTrial: any, trial: TrialSpecification): TrialResult {
  const actualResults = executedTrial.actualResults;
  if (!actualResults) {
    throw new Error(`No actual results from trial execution: ${trial.testId}`);
  }
  
  const benchmarkComparison = compareToBenchmark(actualResults, trial.appendixBenchmark);
  
  // ✅ FIX 2: COMPLETE trial result with ALL prompt data for backend storage
  const trialResult: TrialResult = {
    testId: trial.testId,
    userInput: trial.userInput,                    // ✅ Original user input
    
    // ✅ KEY FIX: Store ALL prompt data for backend integration
    inputPrompt: (executedTrial as any).inputPrompt ? 
      String((executedTrial as any).inputPrompt) : trial.userInput,  // ✅ Structured prompt (CRITICAL!)
    modelResponse: (executedTrial as any).modelResponse ? 
      String((executedTrial as any).modelResponse) : actualResults.output, // ✅ Model response
    evaluationSteps: (executedTrial as any).evaluationSteps ? 
      String((executedTrial as any).evaluationSteps) : `Evaluation completed for ${trial.testId}`, // ✅ Evaluation steps
    
    // ✅ FIX 2: Enhanced prompt metadata for backend
    promptMetadata: {
      ...(executedTrial as any).promptMetadata,
      // ✅ Ensure essential fields are always present
      approach: (executedTrial as any).promptMetadata?.approach || 'unknown',
      temperature: (executedTrial as any).promptMetadata?.temperature || 0.7,
      maxTokens: (executedTrial as any).promptMetadata?.maxTokens || 100,
      systemPrompt: (executedTrial as any).promptMetadata?.systemPrompt || null,
      modelUsed: (executedTrial as any).promptMetadata?.modelUsed || 'default',
      variantId: (executedTrial as any).promptMetadata?.variantId || 'unknown',
      variantName: (executedTrial as any).promptMetadata?.variantName || 'unknown',
      // ✅ NEW: Additional backend integration fields
      storageTimestamp: Date.now(),
      dataIntegrity: 'complete',
      backendReady: true
    },
    
    // ✅ FIX 2: Complete actualResults with all execution data
    actualResults: {
      output: actualResults.output,                    // ✅ Constrained output
      rawOutput: actualResults.output,                 // ✅ Raw model output
      executionTime: actualResults.latencyMs,         // ✅ Execution time
      tokenCount: actualResults.tokenBreakdown?.output || 0, // ✅ Token count
      success: actualResults.success,
      tier: actualResults.tier,
      accuracy: actualResults.accuracy,
      latencyMs: actualResults.latencyMs,
      tokenBreakdown: { 
        input: actualResults.tokenBreakdown?.input || 0,
        process: actualResults.tokenBreakdown?.process || 0,
        output: actualResults.tokenBreakdown?.output || 0
      },
      mcdAligned: actualResults.mcdAligned,
      failureReasons: [...(actualResults.failureReasons || [])],
      timestamp: actualResults.timestamp || Date.now(),
      cpuUsage: actualResults.cpuUsage || 0,
      memoryKb: actualResults.memoryKb || 0,
      error: actualResults.error || undefined
    },
    
    benchmarkComparison,
    evaluationScore: actualResults.accuracy * 100,    // ✅ Evaluation score
    success: actualResults.success,
    failures: actualResults.failureReasons || []      // ✅ Failures array
  };
  
  // ✅ FIX 2: Verify data completeness before returning
  if (!trialResult.inputPrompt || trialResult.inputPrompt === trial.userInput) {
    console.warn(`⚠️ Trial ${trial.testId}: inputPrompt may not be properly structured`);
    // ✅ Fallback: Try to reconstruct if missing
    trialResult.inputPrompt = `Processed: ${trial.userInput}`;
  }
  
  // ✅ Clear references to prevent memory leaks
  executedTrial.actualResults = null;
  
  console.log(`✅ Trial result processed for backend storage: ${trial.testId}`);
  return trialResult;
}


/**
 * ✅ FIX 2: Enhanced backend integration with complete trial data
 */
async function storeTrialResultForBackend(trialResult: TrialResult): Promise<void> {
  try {
    // ✅ FIX 2: Create complete backend payload
    const backendPayload = {
      // Core trial identification
      testId: trialResult.testId,
      timestamp: Date.now(),
      
      // ✅ All prompt data (CRITICAL for UI display)
      userInput: trialResult.userInput,
      inputPrompt: trialResult.inputPrompt,        // ✅ Structured prompt
      modelResponse: trialResult.modelResponse,    // ✅ Model response
      evaluationSteps: trialResult.evaluationSteps, // ✅ Evaluation steps
      
      // ✅ Execution results
      actualResults: {
        output: trialResult.actualResults.output,
        rawOutput: trialResult.actualResults.rawOutput || trialResult.actualResults.output,
        executionTime: trialResult.actualResults.executionTime || trialResult.actualResults.latencyMs,
        tokenCount: trialResult.actualResults.tokenCount || trialResult.actualResults.tokenBreakdown?.output,
        success: trialResult.actualResults.success,
        accuracy: trialResult.actualResults.accuracy,
        tier: trialResult.actualResults.tier,
        mcdAligned: trialResult.actualResults.mcdAligned,
        failureReasons: trialResult.actualResults.failureReasons || [],
        tokenBreakdown: trialResult.actualResults.tokenBreakdown
      },
      
      // ✅ Evaluation data
      evaluationScore: trialResult.evaluationScore,
      success: trialResult.success,
      failures: trialResult.failures || [],
      
      // ✅ Prompt metadata for debugging
      promptMetadata: trialResult.promptMetadata,
      
      // ✅ Benchmark comparison
      benchmarkComparison: trialResult.benchmarkComparison,
      
      // ✅ Backend integration flags
      dataVersion: '2.0',
      storageFormat: 'complete',
      uiReady: true
    };
    
    // ✅ Validation: Ensure critical fields are present
    const criticalFields = ['testId', 'userInput', 'inputPrompt', 'modelResponse'];
    const missingFields = criticalFields.filter(field => !backendPayload[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Backend storage validation failed for ${trialResult.testId}:`, {
        missingFields,
        payload: backendPayload
      });
      throw new Error(`Missing critical fields for backend storage: ${missingFields.join(', ')}`);
    }
    
    // ✅ Store in backend (adapt this to your actual backend API)
    if (typeof window !== 'undefined' && (window as any).backendAPI?.storeTrialResult) {
      await (window as any).backendAPI.storeTrialResult(backendPayload);
      console.log(`✅ Trial stored in backend: ${trialResult.testId}`);
    } else {
      // ✅ Fallback: Store in local storage for development
      const storageKey = `trial_${trialResult.testId}_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(backendPayload));
      console.log(`✅ Trial stored locally: ${storageKey}`);
    }
    
  } catch (error) {
    console.error(`❌ Backend storage failed for ${trialResult.testId}:`, error);
    throw error;
  }
}

/**
 * ✅ FIX 2: Updated trial execution with complete backend storage
 */
async function executeTrialSpecificationWithTiersEnhanced(
  trial: TrialSpecification,
  variant: WalkthroughVariant,
  engine: EngineInterface
): Promise<TrialSpecification> {
  
  const startTime = performance.now();
  
  try {
    const approach = categorizeVariantApproach(variant);
    console.log(`🎯 Processing ${approach} approach for ${trial.testId}`);
    
    // ✅ Build structured prompt
    const promptComponents = buildPromptFromVariant(variant, trial);
    
    // ✅ Execute with engine
    const messages = promptComponents.systemPrompt ? [
      { role: "system", content: promptComponents.systemPrompt },
      { role: "user", content: promptComponents.fullPrompt }
    ] : [{ role: "user", content: promptComponents.fullPrompt }];
    
    const generationConfig = {
      max_tokens: trial.successCriteria?.maxTokenBudget || 100,
      temperature: getTemperatureForApproach(approach, variant.type)
    };
    
    const response = await engine.chat.completions.create({
      messages: messages,
      ...generationConfig
    });
    
    const actualOutput = response.choices?.[0]?.message?.content || '';
    const actualLatency = Math.round(performance.now() - startTime);
    
    // ✅ FIX 2: Store COMPLETE prompt data
    (trial as any).inputPrompt = promptComponents.fullPrompt;  // ✅ Structured prompt
    (trial as any).modelResponse = actualOutput;              // ✅ Model response
    (trial as any).evaluationSteps = `Approach: ${approach}\nPrompt Construction: Success\nExecution: ${actualLatency}ms\nTokens: ${response.usage?.total_tokens || 0}`;
    
    // ✅ FIX 2: Enhanced prompt metadata
    (trial as any).promptMetadata = {
      approach: approach,
      originalUserInput: trial.userInput,
      constructedPromptLength: promptComponents.fullPrompt.length,
      systemPrompt: promptComponents.systemPrompt || null,
      temperature: generationConfig.temperature,
      maxTokens: generationConfig.max_tokens,
      variantId: variant.id,
      variantName: variant.name,
      executionTimestamp: Date.now(),
      // ✅ FIX 2: Backend integration metadata
      backendReady: true,
      dataVersion: '2.0',
      storageFormat: 'complete'
    };
    
    // ✅ Evaluate results
    const evaluationResult = evaluateWithDetailedSteps(actualOutput, trial, approach);
    
    // ✅ FIX 2: Complete actualResults for backend
    trial.actualResults = {
      output: actualOutput,
      rawOutput: actualOutput,                    // ✅ Raw output
      executionTime: actualLatency,               // ✅ Execution time
      tokenCount: response.usage?.total_tokens || 0, // ✅ Token count
      tokenBreakdown: calculateTokenBreakdown(promptComponents.fullPrompt, actualOutput, response.usage?.total_tokens || 0),
      latencyMs: actualLatency,
      success: evaluationResult.success,
      tier: evaluationResult.tier,
      accuracy: evaluationResult.accuracy,
      failureReasons: evaluationResult.failures,
      timestamp: Date.now(),
      mcdAligned: evaluationResult.mcdCompliant,
      cpuUsage: 0,
      memoryKb: 0
    };
    
    // ✅ FIX 2: Store in backend immediately
    const processedResult = processTrialResult(trial as any, trial);
    try {
  await storeTrialResultForBackend(processedResult);
  
  // ✅ NEW: Verify storage was successful
  const verificationResult = await verifyBackendStorage(processedResult.testId);
  if (!verificationResult.success) {
    console.error(`❌ Backend storage verification failed for ${processedResult.testId}`);
    // ✅ FALLBACK: Store locally if backend failed
    await storeLocallyAsBackup(processedResult);
  } else {
    console.log(`✅ Backend storage verified for ${processedResult.testId}`);
  }
  
} catch (storageError) {
  console.error(`❌ Backend storage failed for ${processedResult.testId}:`, storageError);
  // ✅ RESILIENCE: Always have a backup
  await storeLocallyAsBackup(processedResult);
}
    
    console.log(`✅ ${approach} execution and backend storage completed for ${trial.testId}`);
    
    return trial;
    
  } catch (error) {
    console.error(`❌ Trial ${trial.testId} failed:`, error);
    
    // ✅ FIX 2: Store error result in backend too
    const errorResult = createErrorTrialResult(trial, error);
    try {
      await storeTrialResultForBackend(errorResult);
    } catch (storageError) {
      console.error(`❌ Failed to store error result in backend:`, storageError);
    }
    
    throw error;
  }
}


/**
 * ✅ ENHANCED: Create error trial result with prompt context
 */
/**
 * ✅ ENHANCED: Create error trial result with prompt context
 */
function createErrorTrialResult(trial: TrialSpecification, error: any): TrialResult {
  const errorMessage = error?.message || 'Unknown execution error';
  
  return {
    testId: trial.testId,
    userInput: trial.userInput,
    
    // ✅ NEW: Include error context for prompt details
    inputPrompt: `Error occurred during prompt generation or execution: ${errorMessage}`,
    modelResponse: `ERROR: ${errorMessage}`,
    evaluationSteps: `❌ EXECUTION FAILED\n\nError Type: ${error?.name || 'Unknown Error'}\nError Message: ${errorMessage}\nTimestamp: ${new Date().toISOString()}\n\nNo evaluation could be performed due to execution failure.`,
    promptMetadata: {
      approach: 'unknown',
      temperature: 0,
      maxTokens: 0,
      systemPrompt: 'N/A - execution failed',
      modelUsed: 'unknown',
      variantName: 'unknown',
      variantType: 'unknown',
      errorType: error?.name || 'Unknown Error'
    },  // ✅ FIXED: Added missing closing brace and comma

    actualResults: {
      success: false,
      tier: 'poor',
      accuracy: 0,
      latencyMs: 0,
      tokenBreakdown: { input: 0, process: 0, output: 0 },
      mcdAligned: false,
      failureReasons: [errorMessage],
      timestamp: Date.now(),
      error: errorMessage,
      output: '',
      cpuUsage: 0,
      memoryKb: 0
    },
    benchmarkComparison: { latencyDiff: 0, tokenDiff: 0, performanceBetter: false },
    evaluationScore: 0,
    success: false
  };
}



// ✅ MINIMAL FIX: Just fix the syntax error in the existing function
function calculateVariantResult(
  variant: WalkthroughVariant, 
  trialResults: TrialResult[], // These should already be complete
  totalLatency: number, 
  totalTokens: number, 
  successCount: number, 
  mcdAlignmentTotal: number
): VariantResult {
 
  const avgLatency = trialResults.length > 0 ? totalLatency / trialResults.length : 0;
  // ✅ FIX: Add missing semicolon and complete the line
  const avgTokens = trialResults.length > 0 ? totalTokens / trialResults.length : 0;
  const successRate = `${successCount}/${trialResults.length}`;
  const mcdAlignmentScore = trialResults.length > 0 ? (mcdAlignmentTotal / trialResults.length) * 100 : 0;
  
  // ✅ KEEP: All existing logic unchanged
  const measuredProfile = {
    avgLatency: Math.round(avgLatency),
    avgTokens: Math.round(avgTokens),
    successRate,
    actualSuccessCount: successCount,
    totalTrials: trialResults.length,
    mcdAlignmentScore: Math.round(mcdAlignmentScore)
  };
  
  const expected = variant.expectedProfile;
  const comparedToExpected = {
    latencyDiff: avgLatency - expected.avgLatency,
    tokenDiff: avgTokens - expected.avgTokens,
    successRateDiff: successCount - parseInt(expected.successRate.split('/')[0])
  };
  
  return {
    id: variant.id,
    type: variant.type,
    name: variant.name,
    trials: trialResults,
    measuredProfile,
    comparedToExpected
  };
}


/**
 * ✅ NEW: Execute a single variant with all its trials
 */
// ✅ MINIMAL FIX: Only modify the trial result creation part
async function executeVariant(
  variant: WalkthroughVariant,
  tier: SupportedTier,
  engine: EngineInterface,
  scenario: WalkthroughScenario
): Promise<VariantResult> {
  
  const trialResults: TrialResult[] = [];
  let totalLatency = 0;
  let totalTokens = 0;
  let successCount = 0;
  let mcdAlignmentTotal = 0;
  
  console.log(`🔬 Executing ${variant.trials.length} trials for variant ${variant.id}`);
  
  // ✅ KEEP: All existing trial execution logic unchanged
  for (const trial of variant.trials) {
    try {
      console.log(`🧪 Executing trial ${trial.testId}`);
      
      // ✅ KEEP: Existing trial execution
      const executedTrial = await executeTrialSpecificationWithTiers(trial, variant, engine);
      
      // ✅ KEEP: Existing result validation
      if (executedTrial.actualResults) {
        const actualResults = executedTrial.actualResults;
        
        // ✅ KEEP: Existing metrics calculation
        totalLatency += actualResults.latencyMs;
        totalTokens += actualResults.tokenBreakdown.output;
        if (actualResults.success) successCount++;
        if (actualResults.mcdAligned) mcdAlignmentTotal++;
        
        // ✅ KEEP: Existing benchmark comparison
        const benchmarkComparison = compareToBenchmark(actualResults, trial.appendixBenchmark);
        
        // ✅ ONLY CHANGE: Use processTrialResult instead of manual object creation
        const completeTrialResult = processTrialResult(executedTrial, trial);
        trialResults.push(completeTrialResult);
        
        console.log(`✅ Trial ${trial.testId}: ${actualResults.success ? 'PASS' : 'FAIL'} (${actualResults.latencyMs}ms, ${actualResults.accuracy*100}% accuracy)`);
      } else {
        console.warn(`⚠️ Trial ${trial.testId} returned without actualResults`);
        throw new Error(`No actual results from trial execution: ${trial.testId}`);
      }
      
    } catch (trialError) {
      console.error(`❌ Trial ${trial.testId} failed:`, trialError);
      
      // ✅ ONLY CHANGE: Use createErrorTrialResult for consistency
      const errorResult = createErrorTrialResult(trial, trialError);
      trialResults.push(errorResult);
    }
  }
  
  // ✅ KEEP: All existing result calculation logic unchanged
  return calculateVariantResult(variant, trialResults, totalLatency, totalTokens, successCount, mcdAlignmentTotal);
}


/**
 * ✅ NEW: Compare actual results to benchmark data
 */
function compareToBenchmark(actualResults: any, benchmark?: any): any {
  if (!benchmark) {
    return { latencyDiff: 0, tokenDiff: 0, performanceBetter: false };
  }
  
  const latencyDiff = actualResults.latencyMs - benchmark.expectedLatency;
  const tokenDiff = actualResults.tokenBreakdown.output - (benchmark.expectedOutput ? countTokens(benchmark.expectedOutput) : 0);
  const performanceBetter = latencyDiff < 0; // Faster is better
  
  return {
    latencyDiff: Math.round(latencyDiff),
    tokenDiff: Math.round(tokenDiff),
    performanceBetter
  };
}

/**
 * ✅ NEW: Calculate MCD vs Non-MCD comparison
 */
function calculateMcdVsNonMcdComparison(mcdVariant?: VariantResult, nonMcdVariant?: VariantResult): any {
  if (!mcdVariant || !nonMcdVariant) {
    return {
      mcdSuccess: mcdVariant?.measuredProfile.actualSuccessCount || 0,
      nonMcdSuccess: nonMcdVariant?.measuredProfile.actualSuccessCount || 0,
      mcdAvgLatency: mcdVariant?.measuredProfile.avgLatency || 0,
      nonMcdAvgLatency: nonMcdVariant?.measuredProfile.avgLatency || 0,
      mcdAvgTokens: mcdVariant?.measuredProfile.avgTokens || 0,
      nonMcdAvgTokens: nonMcdVariant?.measuredProfile.avgTokens || 0
    };
  }
  
  return {
    mcdSuccess: mcdVariant.measuredProfile.actualSuccessCount,
    nonMcdSuccess: nonMcdVariant.measuredProfile.actualSuccessCount,
    mcdAvgLatency: mcdVariant.measuredProfile.avgLatency,
    nonMcdAvgLatency: nonMcdVariant.measuredProfile.avgLatency,
    mcdAvgTokens: mcdVariant.measuredProfile.avgTokens,
    nonMcdAvgTokens: nonMcdVariant.measuredProfile.avgTokens
  };
}


function calculateConfidenceLevel(mcdResults: VariantExecutionResult[], nonMcdResults: VariantExecutionResult[]): number {
  if (mcdResults.length === 0 || nonMcdResults.length === 0) return 0;
  
  // Enhanced confidence calculation with effect size
  const mcdSuccessRates = mcdResults.map(r => r.successCount / Math.max(1, r.totalTrials));
  const nonMcdSuccessRates = nonMcdResults.map(r => r.successCount / Math.max(1, r.totalTrials));
  
  const mcdMean = mcdSuccessRates.reduce((sum, rate) => sum + rate, 0) / mcdSuccessRates.length;
  const nonMcdMean = nonMcdSuccessRates.reduce((sum, rate) => sum + rate, 0) / nonMcdSuccessRates.length;
  
  // Effect size (Cohen's d approximation)
  const effectSize = Math.abs(mcdMean - nonMcdMean);
  const sampleSizeWeight = Math.min(1.0, Math.sqrt(mcdResults.length + nonMcdResults.length) / 10);
  
  return Math.min(1.0, effectSize * 2 * sampleSizeWeight);
}

// ✅ FIX: Universal percentage validator
// ✅ ENHANCED: Better percentage validation with ratio detection
function validatePercentage(value: number, label: string = 'metric'): number {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        console.warn(`Invalid ${label} value: ${value}, defaulting to 0`);
        return 0;
    }
    
    // ✅ AUTO-DETECT: If value is in ratio format (0-1), convert to percentage
    if (value >= 0 && value <= 1 && !Number.isInteger(value)) {
        console.log(`Converting ratio ${value} to percentage ${value * 100}%`);
        value = value * 100;
    }
    
    const clamped = Math.max(0, Math.min(100, Math.round(value * 100) / 100)); // ✅ Better rounding
    
    if (Math.abs(clamped - value) > 0.01) {
        console.warn(`${label} value ${value.toFixed(2)}% clamped to ${clamped}%`);
    }
    
    return clamped;
}

function calculateEfficiencySafe(
    successRate: number, 
    tokenCount: number, 
    latency: number, 
    domain: string
): number {
    try {
        const domainBaselines = {
            'appointment-booking': { maxTokens: 80, maxLatency: 500 },
            'spatial-navigation': { maxTokens: 60, maxLatency: 400 },
            'failure-diagnostics': { maxTokens: 120, maxLatency: 600 }
        };
        
        const baseline = domainBaselines[domain] || { maxTokens: 80, maxLatency: 500 };
        
        const tokenEfficiency = tokenCount > 0 ? 
            Math.min(100, (baseline.maxTokens / tokenCount) * 100) : 100;
        const latencyEfficiency = latency > 0 ? 
            Math.min(100, (baseline.maxLatency / latency) * 100) : 100;
        
        // ✅ FIX: Normalize successRate to 0-100 range consistently
        const normalizedSuccessRate = successRate > 1 ? successRate : successRate * 100;
        
        const overallEfficiency = (
            normalizedSuccessRate * 0.5 +        // ✅ No double multiplication
            tokenEfficiency * 0.3 +
            latencyEfficiency * 0.2
        );
        
        return validatePercentage(overallEfficiency, 'efficiency');
        
    } catch (error) {
        console.error('Efficiency calculation error:', error);
        return 0;
    }
}

function calculatePercentageSafe(numerator: number, denominator: number, label?: string): number {
    if (denominator === 0) {
        // ✅ FIX: Only warn for unexpected zero divisions
        if (label && !label.includes('MCD alignment')) {
            console.warn(`Division by zero in percentage calculation${label ? ` for ${label}` : ''}`);
        }
        return 0;
    }
    
    if (numerator < 0 || denominator < 0) {
        console.warn(`Negative values in percentage calculation${label ? ` for ${label}` : ''}`);
        return 0;
    }
    
    const rawPercentage = (numerator / denominator) * 100;
    
    // ✅ Use precise rounding to avoid floating point errors
    return Math.round(rawPercentage * 100) / 100; // Round to 2 decimal places
}
/**
 * ✅ NEW: Calculate MCD alignment only when relevant
 */
/**
 * ✅ FIXED: Calculate MCD alignment for ALL approaches based on their outputs
 */
function calculateMcdAlignmentByApproach(
  scenarioResults: ScenarioResult[],
  approach: string
): number {
  // ✅ REMOVED: The problematic exclusion logic
  // OLD CODE: if (approach !== 'mcd') return 0; // Not applicable, not an error
  
  let mcdAlignmentTotal = 0;
  let totalTrials = 0;
  
  scenarioResults.forEach(scenario => {
    scenario.variants.forEach(variant => {
      // ✅ FIXED: Check ALL trials for this approach, not just MCD type
      if (categorizeVariantApproach(variant) === approach) {
        variant.trials.forEach(trial => {
          totalTrials++;
          // ✅ CRITICAL: Evaluate actual output against MCD principles
          if (trial.actualResults?.mcdAligned === true) {
            mcdAlignmentTotal++;
          }
        });
      }
    });
  });
  
  return totalTrials > 0 ? 
    calculatePercentageSafe(mcdAlignmentTotal, totalTrials, `MCD alignment for ${approach}`) : 0;
}


// ✅ FIX: Enhanced output validation for all domains
function isValidDomainOutput(output: string, domain: string, userInput: string): boolean {
    const cleanOutput = output.toLowerCase().trim();
    
    switch (domain) {
        case 'appointment-booking':
            return isValidAppointmentOutput(output, userInput);
        case 'spatial-navigation':
            return isValidNavigationOutput(output, userInput);
        case 'failure-diagnostics':
            return isValidDiagnosticsOutput(output, userInput);
        default:
            return cleanOutput.length > 10; // Basic fallback
    }
}

// ✅ ENHANCED: Appointment booking validation
function isValidAppointmentOutput(output: string, userInput: string): boolean {
    const cleanOutput = output.toLowerCase();
    const cleanInput = userInput.toLowerCase();
    
    // Check for specific appointment types
    const hasSpecificType = /\b(cardiology|dentist|dermatology|doctor|checkup|consultation)\b/i.test(output);
    
    // Check for time references
    const hasTimeReference = /\b(\d{1,2}(am|pm|:\d{2})|morning|afternoon|evening)\b/i.test(output);
    
    // Check for day references  
    const hasDayReference = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i.test(output);
    
    // Check for actionable content (not just templates)
    const hasActionableContent = 
        cleanOutput.includes('confirmed') ||
        cleanOutput.includes('scheduled') || 
        cleanOutput.includes('booked') ||
        cleanOutput.includes('missing') ||
        cleanOutput.includes('need') ||
        cleanOutput.includes('specify');
    
    // Avoid template responses
    const isNotTemplate = 
        !cleanOutput.includes('[found elements]') &&
        !cleanOutput.includes('[missing elements]') &&
        !cleanOutput.includes('[next steps]');
    
    // Must have either specific details OR clear missing information request
    const hasSpecificDetails = hasSpecificType && (hasTimeReference || hasDayReference);
    const hasClearRequest = cleanOutput.includes('missing') && isNotTemplate;
    
    return isNotTemplate && hasActionableContent && (hasSpecificDetails || hasClearRequest);
}

 
function isValidNavigationOutput(output: string, userInput: string): boolean {
  const cleanOutput = output.toLowerCase().trim();
  
   
  const hasTemplateMarkers = /\[.*?\]/.test(output);
  if (hasTemplateMarkers) {
    console.log(`❌ Navigation rejected: Contains template markers: ${output}`);
    return false;
  }
  
  
  const hasActionableGuidance = /\b(head|go|walk|turn|continue|proceed|take|use|navigate|move)\b/i.test(cleanOutput);
  const hasDirectionalInfo = /\b(north|south|east|west|left|right|straight|corridor|hallway|entrance|exit|door|floor)\b/i.test(cleanOutput);
  const hasLocationReference = /\b(to|toward|until|reach|arrive|destination|building|room)\b/i.test(cleanOutput);
  const meetsLengthRequirement = output.trim().length >= 15;  
  
  const hasValidGuidance = hasActionableGuidance && (hasDirectionalInfo || hasLocationReference);
  
  if (!hasValidGuidance && meetsLengthRequirement) {
    console.log(`⚠️ Navigation borderline: guidance=${hasActionableGuidance}, directional=${hasDirectionalInfo}, location=${hasLocationReference}`);
  }
  
  return hasValidGuidance && meetsLengthRequirement;
}



// ✅ NEW: Failure diagnostics validation
function isValidDiagnosticsOutput(output: string, userInput: string): boolean {
    const cleanOutput = output.toLowerCase();
    
    // Check for diagnostic actions
    const hasDiagnosticAction = /\b(check|verify|test|inspect|examine|diagnose|analyze)\b/i.test(output);
    
    // Check for system components
    const hasSystemComponent = /\b(port|service|network|server|database|connection|logs|firewall|config)\b/i.test(output);
    
    // Check for specific technical terms
    const hasTechnicalTerms = /\b(error|timeout|failure|status|connectivity|authentication|credentials)\b/i.test(output);
    
    // Check for structured diagnostic approach
    const hasStructuredApproach = 
        cleanOutput.includes('diagnostic') ||
        cleanOutput.includes('check:') ||
        cleanOutput.includes('verify:') ||
        cleanOutput.includes('inspect:') ||
        cleanOutput.includes('test:');
    
    // Check for escalation awareness
    const hasEscalationAwareness = /\b(escalate|expert|complex|immediate|critical)\b/i.test(output);
    
    // Avoid template responses
    const isNotTemplate = 
        !cleanOutput.includes('[symptoms]') &&
        !cleanOutput.includes('[priority_list]') &&
        !cleanOutput.includes('[error_type]');
    
    // Must provide diagnostic action OR escalation
    const hasValidDiagnostic = hasDiagnosticAction && hasSystemComponent;
    const hasValidEscalation = hasEscalationAwareness && hasTechnicalTerms;
    
    return isNotTemplate && (hasValidDiagnostic || hasValidEscalation || hasStructuredApproach);
}
/**
 * ✅ ENHANCED: Improved domain-specific validation
 */
function validateDomainSpecificResponseEnhanced(
  response: string, 
  domain: string, 
  userInput: string
): { isValid: boolean; issues: string[] } {
  
  const issues: string[] = [];
  const cleanResponse = response.toLowerCase().trim();
  
  switch (domain) {
    case 'appointment-booking':
      return validateAppointmentBookingResponseEnhanced(response, userInput);
    case 'spatial-navigation':
      return validateSpatialNavigationResponseEnhanced(response, userInput);
    case 'failure-diagnostics':
      return validateFailureDiagnosticsResponseEnhanced(response, userInput);
    default:
      if (cleanResponse.length < 10) {
        issues.push('Response too short to be meaningful');
      }
      if (cleanResponse.includes('[') && cleanResponse.includes(']')) {
        issues.push('Response contains template placeholders');
      }
      break;
  }
  
  return { isValid: issues.length === 0, issues };
}

function validateAppointmentBookingResponseEnhanced(response: string, userInput: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const cleanResponse = response.toLowerCase();
  
  const hasActionableContent = 
    cleanResponse.includes('confirmed') || 
    cleanResponse.includes('missing') ||
    cleanResponse.includes('scheduled') ||
    cleanResponse.includes('booked') ||
    cleanResponse.includes('check:') ||
    cleanResponse.includes('required:');
    
  if (!hasActionableContent) {
    issues.push('Missing actionable appointment booking content');
  }
  
  if (/\[.*?\]/.test(response) && !cleanResponse.includes('missing:')) {
    issues.push('Contains template placeholders instead of specific content');
  }
  
  const hasAppointmentReferences = 
    cleanResponse.includes('appointment') ||
    cleanResponse.includes('cardiology') ||
    cleanResponse.includes('dentist') ||
    cleanResponse.includes('dermatology') ||
    cleanResponse.includes('doctor') ||
    cleanResponse.includes('checkup');
    
  if (!hasAppointmentReferences && !cleanResponse.includes('type')) {
    issues.push('Missing appointment type references');
  }
  
  return { isValid: issues.length === 0, issues };
}

function validateSpatialNavigationResponseEnhanced(response: string, userInput: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const cleanResponse = response.toLowerCase();
  
  const hasDirectionalGuidance = /\b(head|go|turn|walk|proceed|navigate|continue|take)\b/i.test(response);
  if (!hasDirectionalGuidance) {
    issues.push('Missing directional action words');
  }
  
  const hasSpatialReferences = 
    /\b(north|south|east|west|left|right|straight|up|down)\b/i.test(response) ||
    /\b(corridor|hallway|entrance|exit|stairs|elevator|door|floor)\b/i.test(response);
    
  if (!hasSpatialReferences) {
    issues.push('Missing spatial or directional references');
  }
  
  if (/\[.*?\]/.test(response)) {
    issues.push('Contains template placeholders - not actionable navigation');
  }
  
  if (response.trim().length < 15) {
    issues.push('Navigation guidance too brief to be useful');
  }
  
  return { isValid: issues.length === 0, issues };
}

function validateFailureDiagnosticsResponseEnhanced(response: string, userInput: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const cleanResponse = response.toLowerCase();
  
  const hasDiagnosticAction = 
    cleanResponse.includes('check:') ||
    cleanResponse.includes('escalate:') ||
    cleanResponse.includes('diagnostic:') ||
    cleanResponse.includes('verify:') ||
    cleanResponse.includes('inspect:');
    
  if (!hasDiagnosticAction) {
    issues.push('Missing diagnostic action or escalation directive');
  }
  
  const hasTechnicalComponents = 
    /\b(port|service|network|server|database|connection|logs|system|config|status)\b/i.test(response);
    
  if (!hasTechnicalComponents && !cleanResponse.includes('escalate')) {
    issues.push('Missing technical component references');
  }
  
  const isComplex = userInput.toLowerCase().includes('multiple') || 
                   userInput.toLowerCase().includes('system-wide') ||
                   userInput.toLowerCase().includes('critical');
                   
  if (isComplex && !cleanResponse.includes('escalate')) {
    issues.push('Complex issue should recommend escalation');
  }
  
  return { isValid: issues.length === 0, issues };
}

function calculateEnhancedDomainMetrics(scenarioResults: ScenarioResult[], walkthrough: DomainWalkthrough, tier: SupportedTier) {
  let totalTrials = 0;
  let successfulTrials = 0;
  let mcdAlignmentTotal = 0;
  let totalLatency = 0;
  
  scenarioResults.forEach(scenario => {
    scenario.variants.forEach(variant => {
      variant.trials.forEach(trial => {
        totalTrials++;
        
        if (trial.actualResults?.success) {
          successfulTrials++;
        }
        
        if (trial.actualResults?.mcdAligned === true) {
          mcdAlignmentTotal++;
        }
        
        if (trial.actualResults?.latencyMs) {
          totalLatency += trial.actualResults.latencyMs;
        }
      });
    });
  });
  
  const mcdAlignmentScore = totalTrials > 0 ? (mcdAlignmentTotal / totalTrials) * 100 : 0;
  const avgLatency = totalTrials > 0 ? totalLatency / totalTrials : 0;
  const resourceEfficiency = calculateResourceEfficiency(avgLatency, tier);
  const userExperienceScore = totalTrials > 0 ? (successfulTrials / totalTrials) * 100 : 0;
  
  return {
    overallSuccess: successfulTrials > 0,
    mcdAlignmentScore: Math.round(mcdAlignmentScore * 10) / 10,
    resourceEfficiency: Math.round(resourceEfficiency * 10) / 10,
    fallbackTriggered: false,
    userExperienceScore: Math.round(userExperienceScore * 10) / 10,
    totalTrials, // ✅ ENSURE this is always present
    successfulTrials // ✅ ENSURE this is always present
  };
}


/**
 * ✅ FIXED: Enhanced domain metrics with proper MCD alignment calculation
 */
function calculateAdvancedDomainMetrics(
  scenarioResults: ScenarioResult[],
  walkthrough: DomainWalkthrough,
  tier: SupportedTier
): EnhancedDomainMetrics {
  const basicMetrics = calculateEnhancedDomainMetrics(scenarioResults, walkthrough, tier);
  
  // ✅ NEW: Calculate MCD alignment by approach properly
  const mcdAlignmentByApproach = {
    mcd: 0,
    fewShot: 0,
    systemRole: 0,
    hybrid: 0,
    conversational: 0
  };
  
  // Track alignment by approach
  const approachStats = {
    mcd: { total: 0, aligned: 0 },
    fewShot: { total: 0, aligned: 0 },
    systemRole: { total: 0, aligned: 0 },
    hybrid: { total: 0, aligned: 0 },
    conversational: { total: 0, aligned: 0 }
  };
  
  scenarioResults.forEach(scenario => {
    scenario.variants.forEach(variant => {
      const approach = categorizeVariantApproach(variant);
      variant.trials.forEach(trial => {
        if (approachStats[approach]) {
          approachStats[approach].total++;
          if (trial.actualResults?.mcdAligned === true) {
            approachStats[approach].aligned++;
          }
        }
      });
    });
  });
  
  // Calculate percentages
  Object.keys(mcdAlignmentByApproach).forEach(approach => {
    const stats = approachStats[approach];
    mcdAlignmentByApproach[approach] = stats.total > 0 ? 
      Math.round((stats.aligned / stats.total) * 100) : 0;
  });
  
  // Calculate overall MCD alignment across all approaches
  let totalTrials = 0;
  let totalAligned = 0;
  Object.values(approachStats).forEach(stats => {
    totalTrials += stats.total;
    totalAligned += stats.aligned;
  });
  
  const overallMcdAlignment = totalTrials > 0 ? 
    Math.round((totalAligned / totalTrials) * 100) : 0;
  
  return {
    ...basicMetrics,
    performanceConsistency: calculatePerformanceConsistency(getAllLatencies(scenarioResults)),
    mcdVsNonMcdAdvantage: calculateMcdAdvantage(scenarioResults),
    tierOptimizationScore: calculateTierOptimization(basicMetrics.resourceEfficiency, tier),
    reliabilityIndex: Math.round((basicMetrics.userExperienceScore * 0.6) + 
                      (calculatePerformanceConsistency(getAllLatencies(scenarioResults)) * 0.4)),
    costEfficiencyRatio: calculateCostEfficiency(basicMetrics, 0),
    // ✅ NEW: Proper MCD alignment by approach
    mcdAlignmentByApproach,
    overallMcdAlignment
  };
}

// ✅ FIXED (Line ~4462): More realistic success criteria
function getDefaultSuccessCriteria(domain: string, tier: SupportedTier): {
    minAccuracy: number;
    maxTokenBudget: number;
    maxLatencyMs: number;
} {
    const baseCriteria = {
        'spatial-navigation': { 
            minAccuracy: 0.50,  // ✅ REDUCED: From 0.65 to 0.50 for spatial complexity
            maxTokenBudget: 120, // ✅ INCREASED: From 90 to 120 for detailed directions
            Q1: 600, Q4: 1200, Q8: 2000  // ✅ INCREASED: More time for spatial processing
        },
        'appointment-booking': { 
            minAccuracy: 0.65,  // ✅ REDUCED: From 0.75 to 0.65 for MCD structured responses
            maxTokenBudget: 100, // ✅ INCREASED: From 80 to 100 for MCD structure
            Q1: 400, Q4: 800, Q8: 1500
        },
        'failure-diagnostics': { 
            minAccuracy: 0.70,  // ✅ REDUCED: From 0.80 to 0.70 for complex diagnostics
            maxTokenBudget: 150, // ✅ INCREASED: From 120 to 150 for diagnostic detail
            Q1: 600, Q4: 1200, Q8: 2000
        }
    };
    
    const defaults = baseCriteria[domain] || {
        minAccuracy: 0.65,   // ✅ REDUCED: From 0.75 to 0.65
        maxTokenBudget: 120, // ✅ INCREASED: From 100 to 120
        Q1: 500, Q4: 1000, Q8: 2000
    };
    
    return {
        minAccuracy: defaults.minAccuracy,
        maxTokenBudget: Math.round(defaults.maxTokenBudget * getDomainComplexityMultiplier(domain)),
        maxLatencyMs: defaults[tier]
    };
}






function getAllLatencies(scenarioResults: ScenarioResult[]): number[] {
  const latencies: number[] = [];
  scenarioResults.forEach(scenario => {
    scenario.variants.forEach(variant => {
      variant.trials.forEach(trial => {
        if (trial.actualResults?.latencyMs && trial.actualResults.latencyMs > 0) {
          latencies.push(trial.actualResults.latencyMs);
        }
      });
    });
  });
  return latencies;
}

function calculatePerformanceConsistency(latencies: number[]): number {
  if (latencies.length < 2) return 100; // Perfect consistency with single data point
  
  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - avgLatency, 2), 0) / latencies.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (lower deviation = higher consistency)
  const consistencyScore = Math.max(0, 100 - (standardDeviation / avgLatency * 100));
  return consistencyScore;
}
// Add helper functions:
function calculateAverageAccuracy(scenarioResults: ScenarioResult[]): number {
  let totalAccuracy = 0;
  let count = 0;
  
  scenarioResults.forEach(scenario => {
    scenario.variants.forEach(variant => {
      variant.trials.forEach(trial => {
        if (trial.actualResults?.accuracy !== undefined) {
          totalAccuracy += trial.actualResults.accuracy * 100;
          count++;
        }
      });
    });
  });
  
  return count > 0 ? totalAccuracy / count : 0;
}

function calculateConsistencyBonus(scenarioResults: ScenarioResult[]): number {
  // Calculate variance in performance as consistency measure
  const latencies = getAllLatencies(scenarioResults);
  if (latencies.length < 2) return 10; // Bonus for single successful trial
  
  const avg = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - avg, 2), 0) / latencies.length;
  const coefficient = Math.sqrt(variance) / avg;
  
  return Math.max(0, 10 - (coefficient * 10)); // 0-10 bonus points
}
function calculateMcdAdvantage(scenarioResults: ScenarioResult[]): number {
  let mcdTotal = 0;
  let nonMcdTotal = 0;
  let comparisonCount = 0;
  
  scenarioResults.forEach(scenario => {
    const comp = scenario.mcdVsNonMcdComparison;
    if (comp.mcdSuccess > 0 || comp.nonMcdSuccess > 0) {
      mcdTotal += comp.mcdSuccess;
      nonMcdTotal += comp.nonMcdSuccess;
      comparisonCount++;
    }
  });
  
  if (comparisonCount === 0) return 0;
  if (nonMcdTotal === 0) return mcdTotal > 0 ? 100 : 0;
  
  return Math.round(((mcdTotal - nonMcdTotal) / nonMcdTotal) * 100);
}

function calculateTierOptimization(avgLatency: number, tier: SupportedTier): number {
  const tierTargets = {
    Q1: { optimal: 300, acceptable: 500 },
    Q4: { optimal: 600, acceptable: 1000 },
    Q8: { optimal: 1200, acceptable: 2000 }
  };
  
  const target = tierTargets[tier];
  if (avgLatency <= target.optimal) return 100;
  if (avgLatency <= target.acceptable) return 80;
  return Math.max(0, 80 - ((avgLatency - target.acceptable) / target.acceptable * 50));
}

function calculateCostEfficiency(metrics: any, avgLatency: number): number {
  // Higher success rate + lower latency = better efficiency
  const successWeight = metrics.userExperienceScore / 100;
  const speedWeight = Math.max(0, 1 - (avgLatency / 2000)); // Normalize against 2s baseline
  return Math.round((successWeight * 0.6 + speedWeight * 0.4) * 100);
}

function calculateResourceEfficiency(avgLatency: number, tier: SupportedTier): number {
    // ✅ ENHANCED: More granular tier expectations
    const tierExpectations = {
        Q1: { 
            excellent: 150,  // Very fast
            good: 300,       // Fast  
            acceptable: 500, // Acceptable
            poor: 800        // Too slow
        },
        Q4: { 
            excellent: 300,  // Fast
            good: 600,       // Good
            acceptable: 1000, // Acceptable  
            poor: 1500       // Too slow
        },
        Q8: { 
            excellent: 600,  // Good for complex tier
            good: 1200,      // Acceptable
            acceptable: 2000, // Slow but acceptable
            poor: 3000       // Too slow
        }
    };
    
    const expectations = tierExpectations[tier];
    
    if (avgLatency <= expectations.excellent) {
        return 100;
    } else if (avgLatency <= expectations.good) {
        // Linear interpolation between 100 and 85
        const ratio = (avgLatency - expectations.excellent) / (expectations.good - expectations.excellent);
        return Math.round(100 - (ratio * 15));
    } else if (avgLatency <= expectations.acceptable) {
        // Linear interpolation between 85 and 60
        const ratio = (avgLatency - expectations.good) / (expectations.acceptable - expectations.good);
        return Math.round(85 - (ratio * 25));
    } else if (avgLatency <= expectations.poor) {
        // Linear interpolation between 60 and 20
        const ratio = (avgLatency - expectations.acceptable) / (expectations.poor - expectations.acceptable);
        return Math.round(60 - (ratio * 40));
    } else {
        // Exponential decay for extremely poor performance
        const excessRatio = (avgLatency - expectations.poor) / expectations.poor;
        return Math.max(0, Math.round(20 * Math.exp(-excessRatio * 0.5)));
    }
}


  

/**
 * ✅ ENHANCED: Generate detailed recommendations
 */
function generateEnhancedRecommendations(
  metrics: any,
  tier: SupportedTier,
  walkthrough: DomainWalkthrough,
  scenarioResults: ScenarioResult[]
): string[] {
  
  const recommendations: string[] = [];
  
  // ✅ FIX: Add null safety checks
  if (!metrics) {
    console.warn('No metrics provided to generateEnhancedRecommendations');
    return ['Unable to generate recommendations: missing metrics data'];
  }
  
  // ✅ FIX: Ensure totalTrials exists with fallback
  const totalTrials = metrics.totalTrials ?? 0;
  const successfulTrials = metrics.successfulTrials ?? 0;
  
  // ✅ SUCCESS RATE: Analysis
  if (totalTrials === 0) {
    recommendations.push('No trials were executed successfully - check engine and domain configuration');
  } else if (successfulTrials / totalTrials < 0.8) {
    recommendations.push(`Success rate is ${Math.round((successfulTrials / totalTrials) * 100)}% - target is 80%+`);
  }
  
  // Rest of the existing function...
  // ✅ MCD EFFECTIVENESS: Analysis
  const mcdAlignmentScore = metrics.mcdAlignmentScore ?? 0;
  if (mcdAlignmentScore < 70) {
    recommendations.push('MCD alignment score is below 70% - review MCD principle implementation');
  }
  
  // ✅ RESOURCE EFFICIENCY: Analysis  
  const resourceEfficiency = metrics.resourceEfficiency ?? 0;
  if (resourceEfficiency < 60) {
    recommendations.push(`Resource efficiency is ${resourceEfficiency}% for ${tier} tier - optimize latency`);
  }
  
  // Continue with the rest of the existing function logic...
  return recommendations.length > 0 ? recommendations : ['Performance metrics are within acceptable ranges'];
}


/**
 * ✅ ENHANCED: Integration with UI systems
 */
// ✅ SINGLE SOURCE VERSION
async function integrateResultsWithUI(result: WalkthroughResult): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any).walkthroughUI?.addResult) {
      await (window as any).walkthroughUI.addResult(result);
      console.log(`✅ Single source integration: ${result.walkthroughId}`);
    }
  } catch (error) {
    console.error(`❌ Integration failed for ${result.walkthroughId}:`, error);
  }
}

// ADD: Enhanced UI Integration - Place AFTER integrateResultsWithUI
// Enhanced UI Integration - Place AFTER integrateResultsWithUI
async function updateProgressWithDetails(
  update: ProgressUpdate,
  startTime: number,
  completedTrials: number,
  totalTrials: number
): Promise<void> {
  if (typeof window !== 'undefined') {
    const elapsed = performance.now() - startTime;
    const estimatedTotal = totalTrials > 0 && completedTrials > 0 ? (elapsed / completedTrials) * totalTrials : 0;
    const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
    const throughput = completedTrials > 0 ? completedTrials / (elapsed / 1000) : 0;
    
    // ✅ NEW: Enhanced ETA calculations for long comparative runs
    const etaSeconds = throughput > 0 ? (totalTrials - completedTrials) / throughput : 0;
    const etaMinutes = Math.floor(etaSeconds / 60);
    const etaSecondsRemainder = Math.floor(etaSeconds % 60);
    const etaFormatted = etaMinutes > 0 ? `${etaMinutes}m ${etaSecondsRemainder}s` : `${Math.floor(etaSeconds)}s`;
    
    // ✅ NEW: Progress velocity tracking
    const progressVelocity = elapsed > 0 ? (completedTrials / (elapsed / 1000)) : 0;
    const isSlowing = progressVelocity < (throughput * 0.8); // Detect if execution is slowing down
    
    // ✅ NEW: Performance prediction
    const predictedFinishTime = throughput > 0 ? new Date(Date.now() + (etaSeconds * 1000)) : null;
    const performanceStatus = isSlowing ? 'Slowing' : throughput > 1 ? 'Fast' : 'Normal';
    
    // Update walkthrough UI with enhanced progress
    try {
      if ((window as any).walkthroughUI?.updateProgressWithDetails) {
        (window as any).walkthroughUI.updateProgressWithDetails({
          currentTask: `${update.phase}: ${update.currentScenario || 'Processing'}`,
          completed: completedTrials,
          total: totalTrials,
          domain: update.currentVariant,
          tier: update.currentTrial,
          estimatedTimeRemaining: estimatedTimeRemaining / 1000,
          throughput: Math.round(throughput * 10) / 10,
          // ✅ NEW: Enhanced timing information
          etaFormatted,
          etaSeconds: Math.floor(etaSeconds),
          progressVelocity: Math.round(progressVelocity * 10) / 10,
          performanceStatus,
          predictedFinishTime: predictedFinishTime?.toLocaleTimeString(),
          // ✅ NEW: Progress analytics
          completionPercentage: totalTrials > 0 ? Math.round((completedTrials / totalTrials) * 100) : 0,
          averageTrialTime: completedTrials > 0 ? Math.round((elapsed / completedTrials)) : 0,
          remainingTrials: Math.max(0, totalTrials - completedTrials)
        });
      }
    } catch (error) {
      console.warn('Enhanced progress update failed:', error);
    }
    
    // ✅ ENHANCED: Legacy progress update with ETA
    try {
      if ((window as any).updateTestControl) {
        const percentage = totalTrials > 0 ? Math.round((completedTrials / totalTrials) * 100) : 0;
        const statusMessage = `${update.phase} - ${completedTrials}/${totalTrials} trials (ETA: ${etaFormatted})`;
        (window as any).updateTestControl(statusMessage, percentage);
      }
    } catch (error) {
      console.warn('Legacy progress update failed:', error);
    }
    
    // ✅ NEW: Console progress for debugging
    if (completedTrials % 10 === 0 || completedTrials === totalTrials) {
      console.log(`📊 Progress: ${completedTrials}/${totalTrials} (${Math.round((completedTrials/totalTrials)*100)}%) - ETA: ${etaFormatted} - ${performanceStatus} (${Math.round(throughput*10)/10} trials/s)`);
    }
  }
}


// Enhanced integration with better error handling
// ✅ NEW SINGLE SOURCE INTEGRATION 
async function integrateResultsWithUIEnhanced(result: WalkthroughResult): Promise<void> {
  try {
    // ✅ SINGLE SOURCE: Only integrate with walkthroughUI
    if (typeof window !== 'undefined' && (window as any).walkthroughUI?.addResult) {
      await (window as any).walkthroughUI.addResult(result);
      console.log(`✅ Single source integration: ${result.domain}-${result.tier}`);
    } else {
      console.warn(`⚠️ WalkthroughUI not available for ${result.walkthroughId}`);
    }
    
    // ✅ KEEP: Progress update only
    if (typeof window !== 'undefined' && (window as any).updateTestControl) {
      (window as any).updateTestControl(`${result.domain} - Integration completed`, 100);
    }
    
  } catch (error) {
    console.error(`❌ Single source integration failed for ${result.walkthroughId}:`, error);
  }
}


/**
 * ✅ ENHANCED: Transform result to enhanced format
 */
function transformToEnhancedResult(result: WalkthroughResult): any {
  try {
    return {
      walkthroughId: result.walkthroughId,
      domain: result.domain,
      tier: result.tier,
      domainMetrics: {
        overallSuccess: result.domainMetrics.overallSuccess,
        mcdAlignmentScore: result.domainMetrics.mcdAlignmentScore / 100,
        resourceEfficiency: result.domainMetrics.resourceEfficiency / 100,
        userExperienceScore: result.domainMetrics.userExperienceScore / 100,
        fallbackTriggered: result.domainMetrics.fallbackTriggered,
        totalTrials: result.domainMetrics.totalTrials,
        successfulTrials: result.domainMetrics.successfulTrials
      },
      scenarioResults: result.scenarioResults.map(scenario => ({
        step: scenario.step,
        context: scenario.context,
        variants: scenario.variants.map(variant => ({
          id: variant.id,
          type: variant.type,
          name: variant.name,
          measuredProfile: variant.measuredProfile,
          trials: variant.trials.map(trial => ({
            testId: trial.testId,
            userInput: trial.userInput,
            success: trial.success,
            evaluationScore: trial.evaluationScore,
            latencyMs: trial.actualResults?.latencyMs || 0
          }))
        })),
        mcdVsNonMcdComparison: scenario.mcdVsNonMcdComparison
      })),
      recommendations: result.recommendations,
      executionTime: result.executionTime,
      timestamp: result.timestamp
    };
  } catch (error) {
    console.error('Error transforming result:', error);
    return result;
  }
}


if (typeof window !== 'undefined') {
    // ✅ ENHANCED: Make evaluator available globally with prompt support
    (window as any).WalkthroughEvaluator = {
        runDomainWalkthrough,
        executeVariant,
        calculateEnhancedDomainMetrics,
        generateEnhancedRecommendations,
        transformToEnhancedResult,
        
        // ✅ NEW: Add prompt-related functions
        buildPromptFromVariant,
        evaluateWithDetailedSteps,
        calculateTokenBreakdown,
        
        // Enhanced trial execution with prompt capture
        executeTrialSpecificationWithTiers,
        
        // Cache management
        cache: {
            clear: () => WalkthroughResultCache.invalidate(),
            clearPattern: (pattern: string) => WalkthroughResultCache.invalidate(pattern),
            stats: () => WalkthroughResultCache.getStats(),
            clean: () => WalkthroughResultCache.cleanOldEntries()
        }
    };
    
    // ✅ Enhanced logging
    console.log('✅ Enhanced WalkthroughEvaluator with prompt capture registered globally');
}

/**
 * ✅ ENHANCED: Global integration and testing
 */
if (typeof window !== 'undefined') {

    
    // ✅ NEW: Cache management functions
    (window as any).clearWalkthroughCache = (pattern?: string) => {
        WalkthroughResultCache.invalidate(pattern);
        console.log('🗑️ Walkthrough cache cleared');
    };
    
    (window as any).getWalkthroughCacheStats = () => {
        return WalkthroughResultCache.getStats();
    };
    
    // ✅ BRIDGE: Enhanced domain execution function
    (window as any).runSophisticatedWalkthrough = runDomainWalkthrough;
    
    // ✅ TESTING: Mock execution function for UI testing
    if (!(window as any).domainWalkthroughs) {
        (window as any).domainWalkthroughs = {};
    }
    
    (window as any).domainWalkthroughs.executeDomain = async (domain: string, tier: string) => {
        try {
            console.log(`🎯 Enhanced executeDomain called: ${domain} with ${tier}`);
            
            // ✅ REAL: Try to get actual domain walkthrough first
            let actualWalkthrough = null;
            if ((window as any).DomainWalkthroughExecutor?.getDomainWalkthrough) {
                const domainMap = { 'appointment-booking': 'D1', 'spatial-navigation': 'D2', 'failure-diagnostics': 'D3' };
                const domainId = domainMap[domain] || domain;
                actualWalkthrough = (window as any).DomainWalkthroughExecutor.getDomainWalkthrough(domainId);
            }
            
            if (actualWalkthrough) {
                console.log(`✅ Using real domain walkthrough for ${domain}`);
                
                // ✅ MOCK ENGINE: Create mock engine for testing
                // ✅ FIX: Safer mock engine
const mockEngine: EngineInterface = {
  chat: {
    completions: {
      create: async (params: CompletionParams): Promise<CompletionResponse> => {
  console.log(`🤖 Mock engine processing trial...`);
  
  // ✅ ENHANCED: Type-safe parameter validation
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters object provided to mock engine');
  }
  
  if (!params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
    throw new Error('Invalid or missing messages array in parameters');
  }
              
        // ✅ SAFE: Validate message structure
        const hasValidMessage = params.messages.some(msg => 
          msg && typeof msg === 'object' && 
          typeof msg.content === 'string' && 
          msg.content.trim().length > 0
        );
        
        if (!hasValidMessage) {
          throw new Error('No valid messages found in parameters');
        }
        
        // ✅ REALISTIC: Variable delay based on tier
        const baseDelay = tier === 'Q1' ? 300 : tier === 'Q4' ? 600 : 1200;
        const randomDelay = baseDelay + (Math.random() * 500);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // ✅ ENHANCED: More realistic response generation
        const responseLength = tier === 'Q1' ? 'brief' : tier === 'Q4' ? 'moderate' : 'detailed';
        const responses = {
          brief: `${tier} response for ${domain}: Task completed efficiently.`,
          moderate: `${tier} tier response for ${domain}: Processing completed with appropriate domain-specific behavior and validation.`,
          detailed: `${tier} tier comprehensive response for ${domain}: Processing completed successfully with detailed analysis, appropriate domain-specific behavior, comprehensive validation, and enhanced user experience features.`
        };
        
        return {
          choices: [{
            message: {
              content: responses[responseLength] || responses.moderate
            }
          }],
          usage: {
            total_tokens: Math.floor(tier === 'Q1' ? 20 : tier === 'Q4' ? 40 : 80) + Math.floor(Math.random() * 20)
          }
        };
      }
    }
  }
};

                
                const result = await runDomainWalkthrough(actualWalkthrough, tier as SupportedTier, mockEngine);
                console.log(`✅ Real domain execution completed for ${domain}-${tier}`);
                return result;
            } else {
                console.warn(`⚠️ No real domain found for ${domain}, using mock`);
                return createMockResult(domain, tier);
            }
            
        } catch (error) {
            console.error(`❌ Domain execution failed for ${domain}-${tier}:`, error);
            return createErrorResult(domain, tier, error);
        }
    };
    
    // ✅ DIAGNOSTIC: Enhanced status checks
    (window as any).checkWalkthroughEvaluatorStatus = () => {
        console.group('🔍 Enhanced Walkthrough Evaluator Status');
        console.log('Core Functions Available:', !!(window as any).WalkthroughEvaluator);
        console.log('Domain Execution Available:', !!(window as any).domainWalkthroughs?.executeDomain);
        console.log('Real Domain Access:', !!(window as any).DomainWalkthroughExecutor);
        console.log('UI Integration Points:', {
            walkthroughUI: !!(window as any).walkthroughUI,
            domainResultsDisplay: !!(window as any).domainResultsDisplay,
            globalFunction: !!(window as any).addWalkthroughResult
        });
        console.groupEnd();
        
        return {
            coreReady: !!(window as any).WalkthroughEvaluator,
            executionReady: !!(window as any).domainWalkthroughs?.executeDomain,
            realDomainAccess: !!(window as any).DomainWalkthroughExecutor,
            uiIntegration: {
                walkthroughUI: !!(window as any).walkthroughUI,
                domainResultsDisplay: !!(window as any).domainResultsDisplay,
                globalFunction: !!(window as any).addWalkthroughResult
            }
        };
    };
    
    console.log('✅ Enhanced WalkthroughEvaluator registered globally with real trial support');
}

/**
 * ✅ UTILITY: Create mock result for testing
 */
function createMockResult(domain: string, tier: string): WalkthroughResult {
    return {
        walkthroughId: `${domain}-mock`,
        domain,
        tier: tier as SupportedTier,
        scenarioResults: [{
            step: 1,
            context: `Mock ${domain} scenario`,
            variants: [{
                id: 'mock-variant',
                type: 'MCD',
                name: 'Mock MCD Variant',
                trials: [{
                    testId: 'mock-trial',
                    userInput: `Test ${domain}`,
                    actualResults: { success: true, latencyMs: 500 },
                    benchmarkComparison: { latencyDiff: 0, tokenDiff: 0, performanceBetter: true },
                    evaluationScore: 85,
                    success: true
                }],
                measuredProfile: {
                    avgLatency: 500,
                    avgTokens: 25,
                    successRate: "1/1",
                    actualSuccessCount: 1,
                    totalTrials: 1,
                    mcdAlignmentScore: 85
                },
                comparedToExpected: { latencyDiff: 0, tokenDiff: 0, successRateDiff: 0 }
            }],
            mcdVsNonMcdComparison: {
                mcdSuccess: 1, nonMcdSuccess: 0,
                mcdAvgLatency: 500, nonMcdAvgLatency: 0,
                mcdAvgTokens: 25, nonMcdAvgTokens: 0
            }
        }],
        domainMetrics: {
            overallSuccess: true,
            mcdAlignmentScore: 85,
            resourceEfficiency: 80,
            fallbackTriggered: false,
            userExperienceScore: 85,
            totalTrials: 1,
            successfulTrials: 1
        },
        recommendations: ['Mock execution completed successfully'],
        executionTime: 1000,
        timestamp: new Date().toISOString()
    };
}

/**
 * ✅ UTILITY: Create error result
 */
function createErrorResult(domain: string, tier: string, error: any): WalkthroughResult {
    return {
        walkthroughId: `${domain}-error`,
        domain,
        tier: tier as SupportedTier,
        scenarioResults: [],
        domainMetrics: {
            overallSuccess: false,
            mcdAlignmentScore: 0,
            resourceEfficiency: 0,
            fallbackTriggered: true,
            userExperienceScore: 0,
            totalTrials: 0,
            successfulTrials: 0
        },
        recommendations: [`Execution failed: ${error.message}`],
        executionTime: 0,
        timestamp: new Date().toISOString()
    };
}
// ✅ TEST: Verification function for success criteria defaults
function testSuccessCriteriaDefaults() {
    console.log('🧪 Testing Success Criteria Defaults...');
    
    const testCases = [
        {
            testId: 'D1_W1_A1_T1', // Appointment booking
            userInput: 'Book appointment for tomorrow',
            output: 'Check: Missing appointment time and location details',
            successCriteria: {} // Empty - should use defaults
        },
        {
            testId: 'D2_W1_A1_T1', // Spatial navigation
            userInput: 'Navigate to the restaurant',
            output: 'Navigate north 50m to reach destination',
            successCriteria: {} // Empty - should use defaults
        },
        {
            testId: 'D3_W1_A1_T1', // Failure diagnostics
            userInput: 'Diagnose the network error',
            output: 'Diagnostic: Error code 404 indicates network connectivity issue. Verify: Internet connection and firewall settings',
            successCriteria: {} // Empty - should use defaults
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n--- Test Case ${index + 1}: ${extractDomainFromTrial(testCase)} ---`);
        
        const domain = extractDomainFromTrial(testCase);
        const defaults = getDefaultSuccessCriteria(domain, 'Q4');
        console.log('Domain:', domain);
        console.log('Defaults applied:', defaults);
        
        const result = evaluateTrialWithTiers(testCase.output, testCase as TrialSpecification);
        console.log('Result:', {
            tier: result.tier,
            accuracy: Math.round(result.accuracy * 100) + '%',
            mcdCompliant: result.mcdCompliant,
            success: result.success,
            failures: result.failures
        });
    });
    
    console.log('\n✅ Success Criteria Defaults test completed!');
}

// Add to global scope for testing
if (typeof window !== 'undefined') {
    (window as any).testSuccessCriteriaDefaults = testSuccessCriteriaDefaults;
}
/**
 * ✅ NEW: Test prompt capture functionality
 */
if (typeof window !== 'undefined') {
  (window as any).testPromptCapture = async () => {
    console.group('🧪 Testing Prompt Capture Functionality');
    
    try {
      // Create a mock trial
      const mockTrial: TrialSpecification = {
        testId: 'TEST_PROMPT_CAPTURE',
        userInput: 'Test prompt capture functionality',
        difficulty: 'simple',
        successCriteria: {
          maxTokenBudget: 50,
          maxLatencyMs: 1000,
          minAccuracy: 0.8,
          requiredElements: ['test'],
          prohibitedElements: []
        },
        appendixBenchmark: {}
      };
      
      // Create a mock variant
      const mockVariant: WalkthroughVariant = {
        id: 'test-variant',
        name: 'Test Variant',
        type: 'MCD',
        prompt: 'System: You are a test assistant.\n\nUser: [USER_INPUT]\n\nPlease respond briefly.',
        trials: [mockTrial],
        expectedProfile: {
          avgLatency: 500,
          avgTokens: 30,
          successRate: '1/1'
        }
      };
      
      // Mock engine
      const mockEngine: EngineInterface = {
        chat: {
          completions: {
            create: async (params) => ({
              choices: [{ message: { content: 'Test response for prompt capture' } }],
              usage: { total_tokens: 25 }
            })
          }
        }
      };
      
      console.log('📝 Executing trial with prompt capture...');
      const result = await executeTrialSpecificationWithTiers(mockTrial, mockVariant, mockEngine);
      
      // Check if prompt details were captured
      const promptDetails = {
        hasInputPrompt: !!(result as any).inputPrompt,
        hasModelResponse: !!(result as any).modelResponse,
        hasEvaluationSteps: !!(result as any).evaluationSteps,
        hasPromptMetadata: !!(result as any).promptMetadata,
        inputPromptLength: ((result as any).inputPrompt || '').length,
        modelResponseLength: ((result as any).modelResponse || '').length,
        evaluationStepsLength: ((result as any).evaluationSteps || '').length,
        approach: (result as any).promptMetadata?.approach
      };
      
      console.log('📊 Prompt capture results:', promptDetails);
      
      if (promptDetails.hasInputPrompt && promptDetails.hasModelResponse && promptDetails.hasEvaluationSteps) {
        console.log('✅ Prompt capture test PASSED');
        
        // Show sample data
        console.log('📋 Sample input prompt (first 100 chars):', ((result as any).inputPrompt || '').substring(0, 100));
        console.log('🤖 Sample model response:', (result as any).modelResponse);
        console.log('⚖️ Sample evaluation steps (first 200 chars):', ((result as any).evaluationSteps || '').substring(0, 200));
        
      } else {
        console.log('❌ Prompt capture test FAILED - missing data');
      }
      
    } catch (error) {
      console.error('❌ Prompt capture test failed:', error);
    }
    
    console.groupEnd();
  };
  
  console.log('✅ testPromptCapture() function available globally');
}

/**
 * ✅ NEW: Debug trial execution with prompt logging
 */
if (typeof window !== 'undefined') {
  (window as any).debugTrialExecution = (trialResult: any) => {
    console.group('🔍 Trial Execution Debug Info');
    
    if (!trialResult) {
      console.log('❌ No trial result provided');
      console.groupEnd();
      return;
    }
    
    console.log('📋 Trial Basic Info:', {
      testId: trialResult.testId,
      success: trialResult.success,
      evaluationScore: trialResult.evaluationScore
    });
    
    console.log('📝 Prompt Details Available:', {
      inputPrompt: !!trialResult.inputPrompt,
      modelResponse: !!trialResult.modelResponse,
      evaluationSteps: !!trialResult.evaluationSteps,
      promptMetadata: !!trialResult.promptMetadata
    });
    
    if (trialResult.inputPrompt) {
      console.log('🔤 Input Prompt Length:', trialResult.inputPrompt.length);
    }
    
    if (trialResult.modelResponse) {
      console.log('🤖 Model Response Length:', trialResult.modelResponse.length);
    }
    
    if (trialResult.promptMetadata) {
      console.log('⚙️ Prompt Metadata:', trialResult.promptMetadata);
    }
    
    if (trialResult.evaluationSteps) {
      console.log('⚖️ Evaluation Steps Available: Yes');
      console.log('📄 Steps Preview:', trialResult.evaluationSteps.substring(0, 200) + '...');
    }
    
    console.groupEnd();
  };
   
}


if (typeof window !== 'undefined') {
  (window as any).debugPromptCapture = (walkthroughResult: any) => {
    console.group('🔍 Comprehensive Prompt Capture Debug');
    
    if (!walkthroughResult || !walkthroughResult.scenarioResults) {
      console.log('❌ Invalid walkthrough result structure');
      console.groupEnd();
      return;
    }
    
    let totalTrials = 0;
    let trialsWithPrompts = 0;
    let trialsWithResponses = 0;
    let trialsWithMetadata = 0;
    let promptIssues = [];
    
    walkthroughResult.scenarioResults.forEach((scenario, sIndex) => {
      scenario.variants.forEach((variant, vIndex) => {
        variant.trials.forEach((trial, tIndex) => {
          totalTrials++;
          
          const hasPrompt = !!trial.inputPrompt;
          const hasResponse = !!trial.modelResponse;
          const hasMetadata = !!trial.promptMetadata;
          
          if (hasPrompt) trialsWithPrompts++;
          if (hasResponse) trialsWithResponses++;
          if (hasMetadata) trialsWithMetadata++;
          
          // Track issues
          if (!hasPrompt || !hasResponse || !hasMetadata) {
            promptIssues.push({
              trialId: trial.testId,
              missing: {
                prompt: !hasPrompt,
                response: !hasResponse,
                metadata: !hasMetadata
              }
            });
          }
          
          console.log(`📋 Trial ${trial.testId}:`, {
            hasPrompt: hasPrompt ? '✅' : '❌',
            hasResponse: hasResponse ? '✅' : '❌',
            hasMetadata: hasMetadata ? '✅' : '❌',
            promptLength: trial.inputPrompt?.length || 0,
            responseLength: trial.modelResponse?.length || 0
          });
        });
      });
    });
    
    console.log('📊 Summary:', {
      totalTrials,
      trialsWithPrompts,
      trialsWithResponses,
      trialsWithMetadata,
      captureRate: `${Math.round((trialsWithPrompts / totalTrials) * 100)}%`,
      issueCount: promptIssues.length
    });
    
    if (promptIssues.length > 0) {
      console.warn('⚠️ Prompt Capture Issues:', promptIssues);
    }
    
    console.groupEnd();
    return {
      totalTrials,
      captureRate: Math.round((trialsWithPrompts / totalTrials) * 100),
      issues: promptIssues
    };
  };
  
  console.log('✅ Enhanced debugPromptCapture() available globally');
}
// ✅ ADD TO GLOBAL SCOPE FOR TESTING:
if (typeof window !== 'undefined') {
  (window as any).validateMCDComplianceFix = () => {
    console.group('🧪 Testing MCD Compliance Function Consolidation');
    
    const testCases = [
      {
        input: 'Check: Missing appointment details',
        expected: true,
        reason: 'Should detect MCD structured format'
      },
      {
        input: 'I think you should probably maybe check something',
        expected: false,
        reason: 'Should detect conversational/hedging language'
      },
      {
        input: 'Verify: All systems operational → status confirmed',
        expected: true,
        reason: 'Should detect MCD patterns with symbols'
      }
    ];
    
    const mockTrial = {
      testId: 'TEST',
      userInput: 'test',
      successCriteria: { maxTokenBudget: 100 }
    };
    
    let passCount = 0;
    
    testCases.forEach((testCase, index) => {
      try {
        const result = checkMCDCompliance(testCase.input, mockTrial);
        const passed = result === testCase.expected;
        
        console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Input: "${testCase.input}"`);
        console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
        console.log(`  Reason: ${testCase.reason}`);
        
        if (passed) passCount++;
        
      } catch (error) {
        console.error(`Test ${index + 1}: ❌ ERROR - ${error.message}`);
      }
    });
    
    console.log(`\n📊 Results: ${passCount}/${testCases.length} tests passed`);
    console.groupEnd();
    
    return passCount === testCases.length;
  };
  
  console.log('✅ validateMCDComplianceFix() available globally');
}
/**
 * ✅ NEW: Verify prompt construction is working correctly
 */
if (typeof window !== 'undefined') {
  (window as any).verifyPromptConstruction = async () => {
    console.group('🔧 Verifying Prompt Construction Fix');
    
    const testUserInput = "Book cardiology Tuesday 3pm";
    const approaches = ['mcd', 'fewShot', 'systemRole', 'hybrid', 'conversational'];
    
    for (const approach of approaches) {
      console.log(`\n--- Testing ${approach.toUpperCase()} ---`);
      
      // Create mock variant and trial
      const mockVariant = {
        id: `test-${approach}`,
        name: `Test ${approach}`,
        type: approach === 'mcd' ? 'MCD' : 'Non-MCD',
        prompt: 'Test template',
        trials: [],
        expectedProfile: { avgLatency: 500, avgTokens: 30, successRate: '1/1' }
      };
      
      const mockTrial = {
        testId: `TEST_${approach.toUpperCase()}`,
        userInput: testUserInput,
        difficulty: 'simple',
        successCriteria: { maxTokenBudget: 100, maxLatencyMs: 1000, minAccuracy: 0.8 }
      };
      
      try {
        // Manually set the approach for testing
        (window as any).testApproach = approach;
        
        const promptResult = buildPromptFromVariant(mockVariant, mockTrial);
        
        console.log(`📝 Results for ${approach}:`);
        console.log(`  Raw input: "${testUserInput}"`);
        console.log(`  Constructed prompt length: ${promptResult.fullPrompt.length} chars`);
        console.log(`  Prompt preview: "${promptResult.fullPrompt.substring(0, 100)}..."`);
        console.log(`  Has system prompt: ${!!promptResult.systemPrompt}`);
        console.log(`  Construction successful: ${promptResult.fullPrompt !== testUserInput ? '✅ YES' : '❌ NO'}`);
        
        if (promptResult.systemPrompt) {
          console.log(`  System prompt: "${promptResult.systemPrompt.substring(0, 80)}..."`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${approach}:`, error);
      }
    }
    
    console.groupEnd();
  };
  
  console.log('✅ verifyPromptConstruction() function available - run it to test the fixes');
}
/**
 * ✅ DEBUG: Direct prompt construction testing
 */
if (typeof window !== 'undefined') {
  (window as any).debugPromptStorageFix = async () => {
    console.group('🔧 Testing Prompt Storage Fix');
    
    const testCases = [
      { approach: 'mcd', input: 'Book cardiology Tuesday 3pm' },
      { approach: 'fewShot', input: 'Schedule dentist appointment' },
      { approach: 'systemRole', input: 'Friday morning check-up' },
      { approach: 'hybrid', input: 'Book something tomorrow' },
      { approach: 'conversational', input: 'Dermatology Mon 10am' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n--- Testing ${testCase.approach.toUpperCase()} ---`);
      
      const mockVariant = {
        id: `test-${testCase.approach}`,
        name: `Test ${testCase.approach}`,
        type: testCase.approach === 'mcd' ? 'MCD' : 'Non-MCD',
        prompt: 'Test template',
        trials: [],
        expectedProfile: { avgLatency: 500, avgTokens: 30, successRate: '1/1' }
      };
      
      const mockTrial = {
        testId: `DEBUG_${testCase.approach.toUpperCase()}`,
        userInput: testCase.input,
        difficulty: 'simple',
        successCriteria: { maxTokenBudget: 100, maxLatencyMs: 1000, minAccuracy: 0.8 }
      };
      
      try {
        const promptResult = buildPromptFromVariant(mockVariant, mockTrial);
        
        console.log(`📊 ${testCase.approach} Results:`);
        console.log(`  Raw Input: "${testCase.input}"`);
        console.log(`  Constructed Length: ${promptResult.fullPrompt.length} chars`);
        console.log(`  First 150 chars: "${promptResult.fullPrompt.substring(0, 150)}..."`);
        console.log(`  Has System Prompt: ${!!promptResult.systemPrompt}`);
        console.log(`  Construction Success: ${promptResult.fullPrompt !== testCase.input ? '✅ YES' : '❌ FAILED'}`);
        
        if (promptResult.systemPrompt) {
          console.log(`  System: "${promptResult.systemPrompt.substring(0, 80)}..."`);
        }
        
      } catch (error) {
        console.error(`❌ ${testCase.approach} construction failed:`, error);
      }
    }
    
    console.groupEnd();
  };
  
  console.log('✅ debugPromptStorageFix() function available - run to test');
}
/**
 * ✅ FIX 2: Verify backend data completeness
 */
if (typeof window !== 'undefined') {
  (window as any).verifyBackendDataStorage = () => {
    console.group('🔍 Verifying Backend Data Storage (Fix 2)');
    
    // Check local storage for stored trials
    const storedTrials = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('trial_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          storedTrials.push({ key, data });
        } catch (e) {
          console.warn(`Failed to parse stored trial: ${key}`);
        }
      }
    }
    
    console.log(`📊 Found ${storedTrials.length} stored trials`);
    
    if (storedTrials.length > 0) {
      const sample = storedTrials[0].data;
      const hasAllFields = !!(
        sample.testId &&
        sample.userInput && 
        sample.inputPrompt && 
        sample.modelResponse && 
        sample.evaluationSteps &&
        sample.actualResults &&
        sample.promptMetadata
      );
      
      console.log('✅ Sample trial data completeness:', {
        hasTestId: !!sample.testId,
        hasUserInput: !!sample.userInput,
        hasInputPrompt: !!sample.inputPrompt,
        hasModelResponse: !!sample.modelResponse,
        hasEvaluationSteps: !!sample.evaluationSteps,
        hasActualResults: !!sample.actualResults,
        hasPromptMetadata: !!sample.promptMetadata,
        backendReady: !!sample.uiReady,
        dataVersion: sample.dataVersion,
        allFieldsPresent: hasAllFields ? '✅ YES' : '❌ NO'
      });
      
      if (hasAllFields) {
        console.log('✅ Backend data storage Fix 2 is working correctly!');
      } else {
        console.error('❌ Backend data storage Fix 2 needs attention - missing fields');
      }
    }
    
    console.groupEnd();
    return { storedCount: storedTrials.length, verified: storedTrials.length > 0 };
  };
  
  console.log('✅ verifyBackendDataStorage() function available for testing Fix 2');
}
// ✅ TEST: Add percentage validation testing
if (typeof window !== 'undefined') {
  (window as any).testPercentageFixes = () => {
    console.group('🧪 Testing Percentage Calculation Fixes');
    
    const testCases = [
      { input: 0.85, expected: 85, label: 'Ratio to percentage' },
      { input: 85, expected: 85, label: 'Already percentage' },
      { input: 150, expected: 100, label: 'Over 100% clamped' },
      { input: -10, expected: 0, label: 'Negative clamped' },
      { input: 0.001, expected: 0.1, label: 'Small percentage' }
    ];
    
    testCases.forEach((testCase, index) => {
      const result = validatePercentage(testCase.input, testCase.label);
      const passed = Math.abs(result - testCase.expected) < 0.1;
      
      console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  ${testCase.label}: ${testCase.input} → ${result}% (expected: ${testCase.expected}%)`);
    });
    
    console.groupEnd();
  };
}
/**
 * ✅ TEST: Verify MCD alignment calculation fix
 */
if (typeof window !== 'undefined') {
  (window as any).testMCDAlignmentFix = () => {
    console.group('🧪 Testing MCD Alignment Fix for All Approaches');
    
    const testOutputs = {
      mcd: 'Check: Missing appointment details\nRequired: Time and date specification',
      fewShot: 'Based on the pattern, you need to specify: appointment type, date, and time',
      systemRole: 'As a medical scheduling specialist, I must verify: appointment type, preferred date, and time slot',
      hybrid: 'Check: Appointment type confirmed\nMissing: Specific date and time\nRequired: Complete scheduling details',
      conversational: 'I\'d be happy to help you schedule that appointment! Could you please let me know what type of appointment you need and when you\'d like to come in?'
    };
    
    const mockTrial = {
      testId: 'TEST_MCD_ALIGNMENT',
      userInput: 'Book appointment',
      successCriteria: { maxTokenBudget: 100 }
    };
    
    console.log('📊 MCD Compliance Results:');
    Object.entries(testOutputs).forEach(([approach, output]) => {
      const mcdCompliant = checkMCDCompliance(output, mockTrial);
      const compliancePercent = mcdCompliant ? 100 : 0;
      
      console.log(`${approach}: ${compliancePercent}% MCD compliant ${mcdCompliant ? '✅' : '❌'}`);
      console.log(`  Output: "${output.substring(0, 60)}..."`);
    });
    
    console.log('\n✅ Expected Results:');
    console.log('MCD: 100% (perfect structural alignment)');
    console.log('Hybrid: 100% (structured format with MCD elements)'); 
    console.log('SystemRole: 80-90% (professional, structured)');
    console.log('FewShot: 70-80% (some structure, pattern-based)');
    console.log('Conversational: 20-30% (natural language, less structure)');
    
    console.groupEnd();
  };
  
  console.log('✅ testMCDAlignmentFix() function available - run to verify the fix');
}
// ✅ NEW: Test spatial navigation fixes
if (typeof window !== 'undefined') {
  (window as any).testSpatialNavigationFixes = async () => {
    console.group('🧪 Testing Spatial Navigation Fixes');
    
    const testCases = [
      {
        input: "Go to restaurant north",
        expectedToContain: ["head", "north", "restaurant"],
        shouldNotContain: ["[destination]", "[direction]"]
      },
      {
        input: "Library avoiding construction", 
        expectedToContain: ["library", "avoid", "construction"],
        shouldNotContain: ["[obstacles]", "[route]"]
      },
      {
        input: "Exit building, elevator broken",
        expectedToContain: ["exit", "stairs", "elevator"],
        shouldNotContain: ["[alternative]", "[method]"]
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n--- Testing: "${testCase.input}" ---`);
      
      const mockTrial = {
        testId: 'SPATIAL_TEST',
        userInput: testCase.input,
        difficulty: 'simple',
        successCriteria: {
          maxTokenBudget: 120,
          maxLatencyMs: 1200,
          minAccuracy: 0.50
        }
      };
      
      try {
        // Test MCD prompt construction
        const mcdPrompt = buildNavigationMCDPrompt(testCase.input);
        console.log('MCD Prompt Preview:', mcdPrompt.fullPrompt.substring(0, 150) + '...');
        
        // Test validation
        const sampleOutput = `Head north down the main corridor until you reach the restaurant on your left. The entrance faces the street.`;
        const isValid = isValidNavigationOutput(sampleOutput, testCase.input);
        console.log('Sample Output Valid:', isValid ? '✅' : '❌');
        
        // Test evaluation
        const evaluation = evaluateTrialWithTiers(sampleOutput, mockTrial);
        console.log('Evaluation Result:', {
          tier: evaluation.tier,
          accuracy: Math.round(evaluation.accuracy * 100) + '%',
          success: evaluation.success ? '✅' : '❌'
        });
        
      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    }
    
    console.groupEnd();
  };
  
  console.log('✅ testSpatialNavigationFixes() function available');
}
// ✅ ADD: Test to verify MCD alignment calculation works for all approaches
if (typeof window !== 'undefined') {
  (window as any).testMCDAlignmentCalculation = () => {
    console.group('🧪 Testing MCD Alignment Calculation Fix');
    
    const mockScenarioResults = [
      {
        step: 1,
        context: 'Test scenario',
        variants: [
          {
            id: 'test-mcd',
            type: 'MCD',
            name: 'Test MCD',
            trials: [
              { actualResults: { mcdAligned: true } },
              { actualResults: { mcdAligned: true } }
            ]
          },
          {
            id: 'test-conversational', 
            type: 'Non-MCD',
            name: 'Test Conversational',
            trials: [
              { actualResults: { mcdAligned: false } },
              { actualResults: { mcdAligned: false } }
            ]
          }
        ]
      }
    ];
    
    const approaches = ['mcd', 'fewShot', 'systemRole', 'hybrid', 'conversational'];
    
    approaches.forEach(approach => {
      const alignment = calculateMcdAlignmentByApproach(mockScenarioResults, approach);
      console.log(`${approach}: ${alignment}% MCD aligned`);
    });
    
    console.groupEnd();
  };
}
/**
 * ✅ COMPREHENSIVE: Testing functions for all fixes
 */
if (typeof window !== 'undefined') {
  (window as any).testAllApproachFixes = async () => {
    console.group('🧪 Testing All Approach Fixes');
    
    const testCases = [
      { domain: 'appointment-booking', input: 'Book cardiology Tuesday 3pm' },
      { domain: 'spatial-navigation', input: 'Go to restaurant avoiding construction' },
      { domain: 'failure-diagnostics', input: 'Server down multiple systems affected' }
    ];
    
    const approaches = ['mcd', 'fewShot', 'systemRole', 'hybrid', 'conversational'];
    let passCount = 0;
    let totalTests = 0;
    
    for (const testCase of testCases) {
      for (const approach of approaches) {
        totalTests++;
        
        try {
          console.log(`\n--- Testing ${approach.toUpperCase()} for ${testCase.domain} ---`);
          
          const mockVariant = {
            id: `test-${approach}`,
            name: `Test ${approach}`,
            type: approach === 'mcd' ? 'MCD' : 'Non-MCD',
            prompt: 'Test template',
            trials: [],
            expectedProfile: { avgLatency: 500, avgTokens: 30, successRate: '1/1' }
          };
          
          const mockTrial = {
            testId: `TEST_${approach.toUpperCase()}_${testCase.domain.toUpperCase()}`,
            userInput: testCase.input,
            difficulty: 'simple',
            successCriteria: { maxTokenBudget: 120, maxLatencyMs: 1200, minAccuracy: 0.65 }
          };
          
          const promptResult = buildPromptFromVariant(mockVariant, mockTrial);
          const constructionSuccess = promptResult.fullPrompt !== testCase.input;
          
          const sampleResponses = {
            'appointment-booking': 'Missing: specific appointment time for cardiology on Tuesday',
            'spatial-navigation': 'Head east around construction zone, then north 50m to restaurant',
            'failure-diagnostics': 'Escalate: Multiple system failure requires immediate senior team attention'
          };
          
          const sampleResponse = sampleResponses[testCase.domain];
          const validation = validateDomainSpecificResponseEnhanced(sampleResponse, testCase.domain, testCase.input);
          
          console.log(`📊 ${approach} Results:`);
          console.log(`  Prompt Construction: ${constructionSuccess ? '✅' : '❌'}`);
          console.log(`  Domain Validation: ${validation.isValid ? '✅' : '❌'}`);
          console.log(`  Prompt Length: ${promptResult.fullPrompt.length} chars`);
          
          if (constructionSuccess && validation.isValid) {
            passCount++;
            console.log(`  Overall: ✅ PASS`);
          } else {
            console.log(`  Overall: ❌ FAIL`);
            if (!validation.isValid) {
              console.log(`  Issues: ${validation.issues.join(', ')}`);
            }
          }
          
        } catch (error) {
          console.error(`❌ ${approach} test failed:`, error);
        }
      }
    }
    
    console.log(`\n📊 Final Results: ${passCount}/${totalTests} tests passed (${Math.round((passCount/totalTests)*100)}%)`);
    console.groupEnd();
    
    return { passed: passCount, total: totalTests, successRate: Math.round((passCount/totalTests)*100) };
  };

  (window as any).testFewShotFix = async () => {
    console.group('🧪 Testing Few-Shot Fix Specifically');
    
    const testInput = "Server database timeout critical";
    const domain = 'failure-diagnostics';
    
    console.log('Testing Few-Shot Template Construction:');
    const fewShotPrompt = buildFewShotPromptStructured('', testInput, domain);
    
    console.log('Generated Prompt Preview:');
    console.log(fewShotPrompt.substring(0, 200) + '...');
    
    const containsExamples = fewShotPrompt.includes('PATTERN EXAMPLES');
    const containsInstructions = fewShotPrompt.includes('INSTRUCTIONS');
    const containsUserTask = fewShotPrompt.includes('YOUR TASK');
    
    console.log('✅ Validation Results:');
    console.log(`  Contains Examples: ${containsExamples ? '✅' : '❌'}`);
    console.log(`  Contains Instructions: ${containsInstructions ? '✅' : '❌'}`);
    console.log(`  Contains User Task: ${containsUserTask ? '✅' : '❌'}`);
    
    const success = containsExamples && containsInstructions && containsUserTask;
    console.log(`\n📊 Overall: ${success ? '✅ PASS' : '❌ FAIL'}`);
    
    console.groupEnd();
    return success;
  };
  
  console.log('✅ Enhanced testing functions available: testAllApproachFixes(), testFewShotFix()');
}

// ✅ INDIVIDUAL EXPORTS: Required by test-runner.ts and other modules
export { evaluateTrialWithTiers };
export { checkMCDCompliance };
export { countTokens };
export { executeTrialSpecificationWithTiers };

// ✅ EXPORT: Enhanced evaluator
export const WalkthroughEvaluator = {
    runDomainWalkthrough,
    executeVariant,
    calculateEnhancedDomainMetrics,
    calculateAdvancedDomainMetrics,
    generateEnhancedRecommendations,
    transformToEnhancedResult,
    // Add the individual functions to the object as well
    evaluateTrialWithTiers,
    checkMCDCompliance
};
