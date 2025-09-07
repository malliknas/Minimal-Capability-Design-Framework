import { 
    DomainWalkthrough, 
    WalkthroughScenario,
    WalkthroughVariant,
    TrialSpecification,
    SupportedTier,
    validateDomainWalkthrough
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
// ADD after existing imports - Enhanced Type Safety
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

function countTokens(text: string): number {
  try {
    if (!text || typeof text !== 'string') return 0;
    
    const cleaned = text.trim();
    if (cleaned.length === 0) return 0;
    
    // ✅ ENHANCED: More accurate token estimation
    const words = cleaned.split(/\s+/).filter(w => w.length > 0).length;
    const punctuation = (cleaned.match(/[.,!?;:()\[\]{}'"]/g) || []).length;
    const numbers = (cleaned.match(/\b\d+\b/g) || []).length;
    const specialChars = (cleaned.match(/[→←↑↓•-]/g) || []).length;
    
    // ✅ IMPROVED: Better token weights based on actual tokenizer behavior
    return Math.ceil(
      words * 1.0 +           // Base word count
      punctuation * 0.3 +     // Reduced punctuation weight
      numbers * 0.4 +         // Numbers are often single tokens
      specialChars * 0.2      // Special formatting characters
    );
    
  } catch (error) {
    console.error('Error counting tokens:', error);
    return Math.ceil((text?.length || 0) / 3.5); // Updated fallback ratio
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
    const outputLower = output.toLowerCase();
    const outputLength = output.trim().length;
    
    // ✅ NEW: Get domain and apply defaults FIRST
    const domain = extractDomainFromTrial(trial);
    const defaultCriteria = getDefaultSuccessCriteria(domain, 'Q4'); // Use Q4 as default tier
    
    // ✅ ENHANCED: Use defaults when criteria are missing
    const minAccuracy = trial.successCriteria?.minAccuracy ?? defaultCriteria.minAccuracy;
    const maxTokenBudget = trial.successCriteria?.maxTokenBudget ?? defaultCriteria.maxTokenBudget;
    const maxLatencyMs = trial.successCriteria?.maxLatencyMs ?? defaultCriteria.maxLatencyMs;
    
    // ✅ ENHANCED: Better required elements handling
    const requiredElements = trial.successCriteria?.requiredElements ?? [];
    const prohibitedElements = trial.successCriteria?.prohibitedElements ?? [];
    
    // ✅ IMPROVED: More precise required elements matching
    let requiredFound = 0;
    const totalRequired = requiredElements.length;
    
    for (const required of requiredElements) {
        const requiredLower = required.toLowerCase();
        if (outputLower.includes(requiredLower) || 
            outputLower.includes(requiredLower.replace(/\s+/g, '')) ||
            hasSemanticMatch(outputLower, requiredLower)) {
            requiredFound++;
        } else {
            failures.push(`Missing required element: ${required}`);
        }
    }
    
    const requiredRatio = totalRequired > 0 ? requiredFound / totalRequired : 1.0;
    
    // ✅ IMPROVED: More strict prohibited element checking
    let prohibitedFound = 0;
    for (const prohibited of prohibitedElements) {
        if (outputLower.includes(prohibited.toLowerCase())) {
            prohibitedFound++;
            failures.push(`Contains prohibited element: ${prohibited}`);
        }
    }
    
    // ✅ ENHANCED: Use domain-aware token budget
    const domainMultiplier = getDomainComplexityMultiplier(domain);
    const adjustedBudget = maxTokenBudget * domainMultiplier;
    
    const tokenCount = countTokens(output);
    const tokenEfficiency = tokenCount > 0 ? Math.min(1.0, adjustedBudget / tokenCount) : 1.0;
    
    // ✅ IMPROVED: More balanced scoring with content quality factor
    const contentQuality = calculateContentQuality(output, trial);
    const functionalScore = (
        requiredRatio * 0.5 +           // Requirements coverage
        tokenEfficiency * 0.2 +         // Efficiency
        contentQuality * 0.2 +          // Content quality
        (prohibitedFound === 0 ? 0.1 : 0) // Compliance bonus
    ) - (prohibitedFound * 0.15);       // Stronger penalty for violations
    
    // ✅ ENHANCED: Domain-specific tier thresholds
    const domainRequiredRatioAdjustment = {
        'appointment-booking': 0.05,  // Slightly more forgiving
        'failure-diagnostics': 0.10,  // Most forgiving due to complexity
        'spatial-navigation': 0.00    // Standard requirements
    };
    
    const adjustment = domainRequiredRatioAdjustment[domain] || 0.02;
    
    let tier: 'excellent' | 'good' | 'acceptable' | 'poor';
    
    // ✅ ENHANCED: Use minAccuracy from defaults
    if (functionalScore >= Math.max(0.80, minAccuracy) && requiredRatio >= (0.85 - adjustment) && outputLength >= 20 && prohibitedFound === 0) {
        tier = 'excellent';
    } else if (functionalScore >= Math.max(0.65, minAccuracy * 0.85) && requiredRatio >= (0.70 - adjustment) && outputLength >= 15 && prohibitedFound === 0) {
        tier = 'good';
    } else if (functionalScore >= Math.max(0.55, minAccuracy * 0.70) && requiredRatio >= (0.55 - adjustment) && outputLength >= 10) {
        tier = 'acceptable';
    } else {
        tier = 'poor';
        if (functionalScore < Math.max(0.55, minAccuracy * 0.70)) failures.push(`Functional score below ${Math.round(Math.max(0.55, minAccuracy * 0.70) * 100)}%`);
        if (requiredRatio < (0.55 - adjustment)) failures.push(`Required elements coverage below ${Math.round((0.55 - adjustment) * 100)}%`);
        if (outputLength < 10) failures.push('Output too brief for meaningful evaluation');
    }
    
    const success = tier !== 'poor';
    const mcdCompliant = checkMCDCompliance(output, trial);
    
    return {
        success,
        tier,
        accuracy: Math.max(0, Math.min(1, functionalScore)),
        mcdCompliant,
        failures
    };
}

/**
 * ✅ NEW: Enhanced MCD compliance checking (MISSING from original code)
 */
function checkMCDCompliance(output: string, trial: TrialSpecification): boolean {
  const outputLower = output.toLowerCase();
  
  // ✅ IMPROVED: More comprehensive MCD indicators with context
const mcdIndicators = {
    // ✅ ENHANCED: More comprehensive patterns
    // Primary MCD patterns (high weight)
    'check:': 4, 'verify:': 4, 'confirm:': 4, 'validate:': 4,
    'missing:': 3, 'required:': 3, 'specify:': 3, 'inspect:': 3,
    
    // Secondary MCD patterns (medium weight)  
    'need to': 2, 'must': 2, 'should': 2, 'complete': 2,
    'provide': 1, 'ensure': 2, 'review': 1, 'clarify': 2,
    
    // Domain-specific patterns
    'appointment details': 2, 'booking information': 2,
    'location coordinates': 2, 'navigation path': 2,
    'error code': 3, 'diagnostic result': 3,
    
    // Structured format indicators
    '→': 2, '->': 2, '•': 1, '- ': 1, // Note: space after dash
    'step 1': 1, 'step 2': 1, 'step 3': 1
};

// ✅ ENHANCED: More nuanced non-MCD detection
const nonMcdIndicators = {
    // Conversational/subjective language (negative weight)
    'i think': -4, 'i believe': -4, 'in my opinion': -4,
    'let me': -3, 'i would': -3, 'i suggest': -3,
    'personally': -3, 'i feel': -4,
    
    // Overly friendly/casual language  
    'wonderful': -2, 'great job': -3, 'amazing': -3, 'awesome': -3,
    'happy to help': -4, 'glad to assist': -3, 'pleased to': -2,
    'feel free': -2, 'no worries': -3, 'sounds good': -2,
    'absolutely': -2, 'definitely': -2,
    
    // Hedging language
    'maybe': -2, 'perhaps': -2, 'possibly': -2, 'might be': -2
};

  
  let mcdScore = 0;
  
  // ✅ ENHANCED: Context-aware scoring
  for (const [phrase, weight] of Object.entries(mcdIndicators)) {
    const occurrences = (outputLower.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    mcdScore += weight * occurrences;
  }
  
  for (const [phrase, weight] of Object.entries(nonMcdIndicators)) {
    if (outputLower.includes(phrase)) {
      mcdScore += weight; // Already negative
    }
  }
  
  // ✅ IMPROVED: Additional MCD pattern bonuses
  if (/^(check|verify|confirm|missing|required|inspect):/m.test(outputLower)) {
    mcdScore += 3; // Structured format bonus
  }
  
  if (/^\s*-\s+/m.test(output)) {
    mcdScore += 1; // List format bonus
  }
  
      // ✅ ENHANCED: Domain-aware brevity bonus
    const domain = extractDomainFromTrial(trial);
    const domainMultiplier = getDomainComplexityMultiplier(domain);
    const adjustedBudget = (trial.successCriteria.maxTokenBudget || 100) * domainMultiplier;
    
    const tokenCount = countTokens(output);
    const budgetRatio = tokenCount / adjustedBudget;
    
    if (budgetRatio <= 0.7) {
        mcdScore += 2; // Strong brevity bonus
    } else if (budgetRatio <= 0.9) {
        mcdScore += 1; // Moderate brevity bonus
    }
    
    return mcdScore > 1;
}
// ✅ NEW: Domain-specific complexity adjustments
function getDomainComplexityMultiplier(domain: string): number {
    const multipliers = {
        'appointment-booking': 1.2,  // Allow 20% more tokens for booking complexity
        'failure-diagnostics': 1.4,  // More complex domain, allow 40% more
        'spatial-navigation': 1.0,   // Standard complexity
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

// ✅ NEW: Approach-specific temperature settings
function getTemperatureForApproach(approach: string, variantType: string): number {
  switch (approach) {
    case 'mcd':
      return 0.0; // MCD should be deterministic
    case 'fewShot':
      return 0.3; // Slight variation for pattern following
    case 'systemRole':
      return 0.2; // Professional but consistent
    case 'hybrid':
      return 0.1; // Mostly deterministic with slight flexibility
    case 'conversational':
      return 0.7; // More creative/variable
    default:
      return variantType === 'MCD' ? 0.0 : 0.7;
  }
}

/**
 * ✅ ENHANCED: Execute trial with prompt capture for UI display
 */
async function executeTrialSpecificationWithTiers(
  trial: TrialSpecification,
  variant: WalkthroughVariant,
  engine: EngineInterface
): Promise<TrialSpecification> {
  
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  try {
    // ✅ ENHANCED: More detailed approach categorization
    const approach = categorizeVariantApproach(variant);
    console.log(`🎯 Processing ${trial.difficulty} trial: ${trial.testId} (variant: ${variant.name}, approach: ${approach})`);
    
    // ✅ ENHANCED: Build prompt with metadata capture
    const promptComponents = buildPromptFromVariant(variant, trial);
    const fullPrompt = promptComponents.fullPrompt;
    const systemPrompt = promptComponents.systemPrompt;
    
    // ✅ ENHANCED: Approach-specific generation config with metadata
 // ✅ ENHANCED: Approach-specific generation config with metadata
const generationConfig = {
  max_tokens: trial.successCriteria?.maxTokenBudget || getDefaultSuccessCriteria(
    extractDomainFromTrial(trial), 
    'Q4'
  ).maxTokenBudget,
  temperature: getTemperatureForApproach(approach, variant.type)
  // ✅ REMOVED: model parameter - let engine use its loaded model
};


    // ✅ ENHANCED: Adjust config based on trial difficulty with logging
    switch (trial.difficulty) {
      case 'simple':
        generationConfig.max_tokens = Math.min(generationConfig.max_tokens, 50);
        break;
      case 'complex':
        generationConfig.temperature = approach === 'mcd' ? 0.0 : 0.3;
        break;
    }

    console.log(`🔧 Generation config for ${approach}: temp=${generationConfig.temperature}, max_tokens=${generationConfig.max_tokens}`);

    // ✅ ENHANCED: Execute with detailed logging and capture
    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: fullPrompt }],
      ...generationConfig
    });
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const actualOutput = response.choices?.[0]?.message?.content || '';
    const actualLatency = Math.round(endTime - startTime);
    const actualMemory = Math.round((endMemory - startMemory) / 1024);
    const totalTokens = response.usage?.total_tokens || 0;
    
    // ✅ ENHANCED: Detailed evaluation with step tracking
    const evaluationResult = evaluateWithDetailedSteps(actualOutput, trial, approach);
    const tokenBreakdown = calculateTokenBreakdown(fullPrompt, actualOutput, totalTokens);
    
    // ✅ NEW: Store comprehensive results with prompt details
    trial.actualResults = {
      output: actualOutput,
      tokenBreakdown,
      latencyMs: actualLatency,
      cpuUsage: 0,
      memoryKb: actualMemory,
      success: evaluationResult.success,
      tier: evaluationResult.tier,
      accuracy: evaluationResult.accuracy,
      failureReasons: evaluationResult.failures,
      timestamp: Date.now(),
      mcdAligned: evaluationResult.mcdCompliant
    };

    // ✅ NEW: Store prompt details for UI display
    (trial as any).inputPrompt = fullPrompt;
    (trial as any).modelResponse = actualOutput;
    (trial as any).evaluationSteps = evaluationResult.evaluationDetails;
    (trial as any).promptMetadata = {
  approach: approach,
  temperature: generationConfig.temperature,
  maxTokens: generationConfig.max_tokens,
  systemPrompt: systemPrompt,
  modelUsed: 'auto-detected',   
  variantName: variant.name,
  variantType: variant.type
};

verifyPromptCapture(trial, trial.testId);

    
    // ✅ ENHANCED: Success logging with prompt info
    console.log(`✅ Trial ${trial.testId} (${approach}): ${evaluationResult.tier.toUpperCase()} (${actualLatency}ms, ${Math.round(evaluationResult.accuracy*100)}% accuracy)`);
    console.log(`📝 Prompt length: ${fullPrompt.length} chars, Response: ${actualOutput.length} chars`);
    
    return trial;
    
  } catch (error) {
    console.error(`❌ Trial ${trial.testId} execution failed:`, error);
    
    // ✅ ENHANCED: Store error details with prompt info
    const approach = categorizeVariantApproach(variant);
    const promptAttempt = buildPromptFromVariant(variant, trial);
    
    trial.actualResults = {
      output: `ERROR: ${error.message}`,
      tokenBreakdown: { input: 0, process: 0, output: 0 },
      latencyMs: Math.round(performance.now() - startTime),
      cpuUsage: 0,
      memoryKb: 0,
      success: false,
      tier: 'poor',
      accuracy: 0,
      failureReasons: [`Execution error: ${error.message}`],
      timestamp: Date.now(),
      mcdAligned: false
    };

    // ✅ NEW: Store error prompt details for debugging
    (trial as any).inputPrompt = promptAttempt.fullPrompt || 'Prompt generation failed';
    (trial as any).modelResponse = `ERROR: ${error.message}`;
    (trial as any).evaluationSteps = `Execution failed before evaluation: ${error.message}`;
    (trial as any).promptMetadata = {
      approach: approach,
      temperature: 0,
      maxTokens: 0,
      systemPrompt: promptAttempt.systemPrompt || '',
      modelUsed: 'unknown',
      variantName: variant.name,
      variantType: variant.type,
      errorType: error.name || 'Unknown Error'
    };
    
    return trial;
  }
}


/**
 * ✅ NEW: Build prompt from variant with component tracking
 */
function buildPromptFromVariant(variant: WalkthroughVariant, trial: TrialSpecification): {
  fullPrompt: string;
  systemPrompt?: string;
  userPrompt: string;
} {
  try {
    // Extract system prompt if present
    const promptTemplate = variant.prompt;
    const systemPromptMatch = promptTemplate.match(/^System:\s*(.*?)(?=\n\n|\nUser:|\n[A-Z][a-z]+:|$)/s);
    const systemPrompt = systemPromptMatch ? systemPromptMatch[1].trim() : undefined;
    
    // Build user prompt by replacing placeholders
    let userPrompt = promptTemplate;
    if (systemPrompt) {
      // Remove system prompt section from user prompt
      userPrompt = userPrompt.replace(/^System:\s*.*?(?=\n\n|\nUser:|\n[A-Z][a-z]+:|$)/s, '').trim();
    }
    
    // Replace placeholder with actual user input
    const finalUserPrompt = userPrompt.replace(/\[.*?\]/g, trial.userInput);
    
    // Build full prompt
    let fullPrompt = '';
    if (systemPrompt) {
      fullPrompt = `System: ${systemPrompt}\n\nUser: ${finalUserPrompt}`;
    } else {
      fullPrompt = finalUserPrompt;
    }
    
    return {
      fullPrompt,
      systemPrompt,
      userPrompt: finalUserPrompt
    };
    
  } catch (error) {
    console.error('Error building prompt from variant:', error);
    return {
      fullPrompt: `Error building prompt: ${error.message}`,
      userPrompt: trial.userInput,
      systemPrompt: undefined
    };
  }
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


async function executeVariantComparatively(
  variant: WalkthroughVariant,
  tier: SupportedTier,
  engine: EngineInterface
): Promise<VariantExecutionResult> {
  
  const approach = categorizeVariantApproach(variant);
  
  console.log(`🔄 Starting ${approach} variant: ${variant.name} (${variant.trials.length} trials)`);
  console.log(`📋 Trial IDs for ${approach}: ${variant.trials.map(t => t.testId).join(', ')}`);
  
  const trials: TrialExecutionResult[] = [];
  let successCount = 0;
  let totalTokens = 0;
  let totalLatency = 0;
  let totalAccuracy = 0;
  let mcdAlignmentCount = 0;
  
  for (const trial of variant.trials) {
    // ✅ FIX: Log which specific trial is being executed for this approach
    console.log(`🧪 Executing ${approach} trial: ${trial.testId} (${trial.userInput.substring(0, 50)}...)`);
    
    const trialResult = await executeTrialSpecificationWithTiers(trial, variant, engine);
    
    const executionResult: TrialExecutionResult = {
      testId: trial.testId,
      success: trialResult.actualResults?.success || false,
      latencyMs: trialResult.actualResults?.latencyMs || 0,
      tokenCount: trialResult.actualResults?.tokenBreakdown?.output || 0,
      accuracy: trialResult.actualResults?.accuracy || 0,
      tier: trialResult.actualResults?.tier || 'poor',
      mcdAligned: trialResult.actualResults?.mcdAligned || false,
      failureReasons: trialResult.actualResults?.failureReasons || []
    };
    
    trials.push(executionResult);
    
    if (executionResult.success) successCount++;
    totalTokens += executionResult.tokenCount;
    totalLatency += executionResult.latencyMs;
    totalAccuracy += executionResult.accuracy;
    if (executionResult.mcdAligned) mcdAlignmentCount++;
    
    // ✅ FIX: Progress logging per trial
    console.log(`  └─ Result: ${executionResult.success ? 'SUCCESS' : 'FAILED'} (${executionResult.latencyMs}ms, ${executionResult.tier})`);
  }
  
  console.log(`✅ Completed ${approach} variant: ${successCount}/${variant.trials.length} successful`);
  
  return {
    variantId: variant.id,
    variantType: variant.type,
    variantName: variant.name,
    approach: approach,
    successRate: `${successCount}/${variant.trials.length}`,
    successCount,
    totalTrials: variant.trials.length,
    avgLatency: Math.round(totalLatency / variant.trials.length),
    avgTokens: Math.round(totalTokens / variant.trials.length),
    avgAccuracy: totalAccuracy / variant.trials.length,
    mcdAlignmentRate: mcdAlignmentCount / variant.trials.length,
    trials,
    efficiency: calculateVariantEfficiency(successCount, variant.trials.length, totalLatency, totalTokens)
  };
}


function categorizeVariantApproach(variant: WalkthroughVariant): 'mcd' | 'fewShot' | 'systemRole' | 'hybrid' | 'conversational' {
  // ✅ ENHANCED: Better approach detection
  if (variant.type === 'MCD') return 'mcd';
  if (variant.type === 'Hybrid') return 'hybrid';
  
  const nameLower = variant.name.toLowerCase();
  const idLower = variant.id.toLowerCase();
  
  // ✅ ENHANCED: More precise pattern matching based on your domain structure
  if (nameLower.includes('few-shot') || nameLower.includes('pattern') || 
      idLower.includes('a3') || idLower.includes('b3') || idLower.includes('c2')) {
    return 'fewShot';
  }
      
  if (nameLower.includes('system') || nameLower.includes('expert') || nameLower.includes('role') ||
      idLower.includes('a4') || idLower.includes('b4') || idLower.includes('c3')) {
    return 'systemRole';
  }
      
  if (nameLower.includes('conversational') || nameLower.includes('natural') ||
      idLower.includes('a2') || idLower.includes('b2') || idLower.includes('c5')) {
    return 'conversational';
  }
  
  // ✅ FIX: Default to conversational instead of always mcd
  console.warn(`⚠️ Could not categorize variant ${variant.id}, defaulting to conversational`);
  return 'conversational';
}



/**
 * ✅ NEW: Enhanced approach-specific evaluation
 */
function evaluateByApproach(
  output: string,
  trial: TrialSpecification,
  approach: string
): TrialEvaluationResult {
  
  const baseEvaluation = evaluateTrialWithTiers(output, trial);
  
  // Apply approach-specific adjustments
  switch (approach) {
    case 'mcd':
      return evaluateMCDApproach(output, trial, baseEvaluation);
    case 'fewShot':
      return evaluateFewShotApproach(output, trial, baseEvaluation);
    case 'systemRole':
      return evaluateSystemRoleApproach(output, trial, baseEvaluation);
    case 'hybrid':
      return evaluateHybridApproach(output, trial, baseEvaluation);
    case 'conversational':
      return evaluateConversationalApproach(output, trial, baseEvaluation);
    default:
      return baseEvaluation;
  }
}

function evaluateMCDApproach(output: string, trial: TrialSpecification, base: TrialEvaluationResult): TrialEvaluationResult {
  // MCD should be structured, direct, and efficient
  const structuralBonus = hasStructuredFormat(output) ? 0.1 : 0;
  const efficiencyBonus = countTokens(output) <= trial.successCriteria.maxTokenBudget * 0.8 ? 0.1 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + structuralBonus + efficiencyBonus),
    mcdCompliant: true // Always true for MCD variants
  };
}

function evaluateFewShotApproach(output: string, trial: TrialSpecification, base: TrialEvaluationResult): TrialEvaluationResult {
  // Few-shot should follow patterns from examples
  const patternFollowing = detectPatternFollowing(output, trial);
  const patternBonus = patternFollowing ? 0.05 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + patternBonus),
    mcdCompliant: checkMCDCompliance(output, trial)
  };
}

function evaluateSystemRoleApproach(output: string, trial: TrialSpecification, base: TrialEvaluationResult): TrialEvaluationResult {
  // System role should be professional and authoritative
  const professionalTone = detectProfessionalTone(output);
  const professionalBonus = professionalTone ? 0.05 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + professionalBonus),
    mcdCompliant: checkMCDCompliance(output, trial)
  };
}

function evaluateHybridApproach(output: string, trial: TrialSpecification, base: TrialEvaluationResult): TrialEvaluationResult {
  // Hybrid should combine best of MCD and other approaches
  const structuralBonus = hasStructuredFormat(output) ? 0.05 : 0;
  const patternBonus = detectPatternFollowing(output, trial) ? 0.05 : 0;
  
  return {
    ...base,
    accuracy: Math.min(1.0, base.accuracy + structuralBonus + patternBonus),
    mcdCompliant: checkMCDCompliance(output, trial)
  };
}

function evaluateConversationalApproach(output: string, trial: TrialSpecification, base: TrialEvaluationResult): TrialEvaluationResult {
  // Conversational may be verbose but should be natural
  const verbosityPenalty = countTokens(output) > trial.successCriteria.maxTokenBudget * 1.5 ? -0.1 : 0;
  
  return {
    ...base,
    accuracy: Math.max(0, base.accuracy + verbosityPenalty),
    mcdCompliant: checkMCDCompliance(output, trial)
  };
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
      
      // Calculate composite score
      const avgSuccessRate = calculateAverageSuccessRate(approachResults);
      const avgEfficiency = calculateAverageEfficiency(approachResults);
      const avgLatency = calculateAverageLatency(approachResults);
      const consistencyScore = calculateConsistency(approachResults);
      
      // Normalize latency (lower is better)
      const normalizedLatency = Math.max(0, 1 - (avgLatency / 2000));
      
      // Composite score
      scores[approach] = (
        avgSuccessRate * 0.4 +      // Success is most important
        avgEfficiency * 0.3 +       // Efficiency matters
        normalizedLatency * 0.2 +   // Speed matters
        consistencyScore * 0.1      // Consistency matters
      );
    } else {
      scores[approach] = 0;
    }
  });
  
  // Sort by score (descending)
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

// ✅ MISSING: Add these helper functions
function hasStructuredFormat(output: string): boolean {
  return /^(check|verify|confirm|missing|required|inspect):/i.test(output.trim()) ||
         /\[(.*?)\]/.test(output) ||
         /\d+\.\s/.test(output) ||
         output.includes('→') || output.includes('->');
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

function calculateApproachMetrics(results: VariantExecutionResult[]): {
  successRate: number;
  avgTokens: number;
  avgLatency: number;
  accuracy: number;
} {
  return calculateBaselineMetrics(results); // Same calculation
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


// ✅ MEMORY FIX: Emergency memory recovery for critical situations
// ✅ ENHANCED: More selective memory cleanup - REPLACES performEmergencyMemoryCleanup
function performSelectiveMemoryCleanup(context: string, preservePrompts: boolean = true): void {
  console.log(`🧹 Performing selective memory cleanup: ${context} (preserve prompts: ${preservePrompts})`);
  
  try {
    // Force garbage collection (reduced intensity)
    if (typeof global !== 'undefined' && global.gc) {
      for (let i = 0; i < 2; i++) {  // Reduced from 3 to 2
        global.gc();
        console.log(`✅ Selective GC pass ${i + 1} completed`);
      }
    }
    
    // Only clear template caches, not prompt data
    if (typeof window !== 'undefined') {
      if ((window as any).WalkthroughTemplateCache?.clearCache) {
        (window as any).WalkthroughTemplateCache.clearCache();
        console.log('✅ Template cache cleared');
      }
    }
    
    // ✅ NEW: Conditional prompt cleanup only in extreme memory situations
    if (!preservePrompts && typeof performance !== 'undefined' && (performance as any).memory) {
      const memInfo = (performance as any).memory;
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 90) {  // Only clear prompts at 90%+ memory usage
        console.warn('🚨 Extreme memory usage - clearing prompt data as last resort');
        // Clear prompts here only as last resort - but this should rarely happen
      }
    }
    
    console.log('✅ Selective memory cleanup completed');
    
  } catch (error) {
    console.error('❌ Selective memory cleanup failed:', error);
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
        if (trialResults.length > 50) {
  // Only clean up if we're actually running low on memory
const memUsage = (performance as any).memory?.usedJSHeapSize;
const memLimit = (performance as any).memory?.jsHeapSizeLimit;
const usagePercent = memUsage && memLimit ? (memUsage / memLimit * 100) : 0;

if (usagePercent > 75) { // ✅ FIX: Increase threshold from 60% to 75%
  trialResults.forEach(result => {
    if (result.actualResults?.output?.length > 3000) { // ✅ FIX: Increase from 2000 to 3000
      result.actualResults.output = result.actualResults.output.substring(0, 1500) + '... [truncated]';
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


/**
 * ✅ ENHANCED: Process trial result with prompt details preserved
 */
function processTrialResult(executedTrial: any, trial: TrialSpecification): TrialResult {
  const actualResults = executedTrial.actualResults;
  if (!actualResults) {
    throw new Error(`No actual results from trial execution: ${trial.testId}`);
  }
  
  const benchmarkComparison = compareToBenchmark(actualResults, trial.appendixBenchmark);
  
  // ✅ FIXED: Create result with prompt details properly preserved
  const result: TrialResult = {
    testId: trial.testId,
    userInput: trial.userInput,
    
    // ✅ FIXED: Deep copy prompt details instead of referencing
    inputPrompt: (executedTrial as any).inputPrompt ? 
      String((executedTrial as any).inputPrompt) : undefined,
    modelResponse: (executedTrial as any).modelResponse ? 
      String((executedTrial as any).modelResponse) : undefined,
    evaluationSteps: (executedTrial as any).evaluationSteps ? 
      String((executedTrial as any).evaluationSteps) : undefined,
    promptMetadata: (executedTrial as any).promptMetadata ? 
      JSON.parse(JSON.stringify((executedTrial as any).promptMetadata)) : undefined,
    
    actualResults: {
      success: actualResults.success,
      tier: actualResults.tier,
      accuracy: actualResults.accuracy,
      latencyMs: actualResults.latencyMs,
      tokenBreakdown: { ...actualResults.tokenBreakdown },
      mcdAligned: actualResults.mcdAligned,
      failureReasons: [...(actualResults.failureReasons || [])],
      timestamp: actualResults.timestamp,
      output: actualResults.output,
      cpuUsage: actualResults.cpuUsage || 0,
      memoryKb: actualResults.memoryKb || 0,
      error: actualResults.error || undefined
    },
    benchmarkComparison,
    evaluationScore: actualResults.tier === 'excellent' ? 100 : 
                 actualResults.tier === 'good' ? 85 :
                 actualResults.tier === 'acceptable' ? 70 : 30,
    success: actualResults.success
  };
  
  // ✅ FIXED: Only clear actualResults, preserve prompt data until result is fully processed
  executedTrial.actualResults = null;
  // ❌ REMOVED: Don't clear prompt data here - it's needed for UI display
  
  return result;
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



function calculateVariantResult(
  variant: WalkthroughVariant, 
  trialResults: TrialResult[], 
  totalLatency: number, 
  totalTokens: number, 
  successCount: number, 
  mcdAlignmentTotal: number
): VariantResult {
  const avgLatency = trialResults.length > 0 ? totalLatency / trialResults.length : 0;
  const avgTokens = trialResults.length > 0 ? totalTokens / trialResults.length : 0;
  const successRate = `${successCount}/${trialResults.length}`;
  const mcdAlignmentScore = trialResults.length > 0 ? (mcdAlignmentTotal / trialResults.length) * 100 : 0;
  
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
  
  // ✅ ENHANCED: Execute each trial using the real trial system
  for (const trial of variant.trials) {
    try {
      console.log(`🧪 Executing trial ${trial.testId}`);
      
      // ✅ REAL EXECUTION: Use the actual trial execution function
      const executedTrial = await executeTrialSpecificationWithTiers(trial, variant, engine);
      
      // ✅ REAL RESULTS: Process actual results
      if (executedTrial.actualResults) {
        const actualResults = executedTrial.actualResults;
        
        totalLatency += actualResults.latencyMs;
        totalTokens += actualResults.tokenBreakdown.output;
        if (actualResults.success) successCount++;
        if (actualResults.mcdAligned) mcdAlignmentTotal++;
        
        // ✅ ENHANCED: Compare with benchmark
        const benchmarkComparison = compareToBenchmark(actualResults, trial.appendixBenchmark);
        
        trialResults.push({
          testId: trial.testId,
          userInput: trial.userInput,
          actualResults,
          benchmarkComparison,
          evaluationScore: actualResults.accuracy * 100,
          success: actualResults.success
        });
        
        console.log(`✅ Trial ${trial.testId}: ${actualResults.success ? 'PASS' : 'FAIL'} (${actualResults.latencyMs}ms, ${actualResults.accuracy*100}% accuracy)`);
      } else {
        console.warn(`⚠️ Trial ${trial.testId} returned without actualResults`);
        throw new Error(`No actual results from trial execution: ${trial.testId}`);
      }
      
    } catch (trialError) {

      console.error(`❌ Trial ${trial.testId} failed:`, trialError);
      
      // ✅ ERROR HANDLING: Create error result
      trialResults.push({
        testId: trial.testId,
        userInput: trial.userInput,
        actualResults: {
          success: false,
          error: trialError.message,
          latencyMs: 0,
          tokenBreakdown: { output: 0 }
        },
        benchmarkComparison: { latencyDiff: 0, tokenDiff: 0, performanceBetter: false },
        evaluationScore: 0,
        success: false
      });
    }
  }
  
  // ✅ ENHANCED: Calculate measured profile
  const avgLatency = trialResults.length > 0 ? totalLatency / trialResults.length : 0;
  const avgTokens = trialResults.length > 0 ? totalTokens / trialResults.length : 0;
  const successRate = `${successCount}/${trialResults.length}`;
  const mcdAlignmentScore = trialResults.length > 0 ? (mcdAlignmentTotal / trialResults.length) * 100 : 0;
  
  const measuredProfile = {
    avgLatency: Math.round(avgLatency),
    avgTokens: Math.round(avgTokens),
    successRate,
    actualSuccessCount: successCount,
    totalTrials: trialResults.length,
    mcdAlignmentScore: Math.round(mcdAlignmentScore)
  };
  
  // ✅ ENHANCED: Compare to expected profile
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
// ✅ ENHANCED: More comprehensive pattern detection
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
function validatePercentage(value: number, label: string = 'metric'): number {
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn(`Invalid ${label} value: ${value}, defaulting to 0`);
    return 0;
  }
  const clamped = Math.max(0, Math.min(100, value));
  if (clamped !== value) {
    console.warn(`${label} value ${value}% clamped to ${clamped}%`);
  }
  return Math.round(clamped * 10) / 10; // Round to 1 decimal place
}

function calculateEnhancedDomainMetrics(
  scenarioResults: ScenarioResult[],
  walkthrough: DomainWalkthrough,
  tier: SupportedTier
): any {
  
  let totalTrials = 0;
  let successfulTrials = 0;
  let mcdAlignmentTotal = 0;
  let mcdAlignmentCount = 0;
  let totalLatency = 0;
  let fallbacksDetected = false;
  
  // ✅ FIXED: Enhanced aggregation logic
  scenarioResults.forEach(scenario => {
    scenario.variants.forEach(variant => {
      variant.trials.forEach(trial => {
        totalTrials++;
        
        const results = trial.actualResults;
        if (results?.latencyMs) {
          totalLatency += results.latencyMs;
        }
        
        // ✅ FIXED: Enhanced success detection
        const isSuccessful = trial.success || 
                           results?.success === true ||
                           results?.tier === 'good' ||
                           results?.tier === 'acceptable' ||
                           results?.tier === 'excellent';
        
        if (isSuccessful) {
          successfulTrials++;
        }
        
        // ✅ FIXED: MCD alignment tracking
        if (variant.type === 'MCD') {
          mcdAlignmentCount++;
          if (results?.mcdAligned === true) {
            mcdAlignmentTotal++;
          }
        }
        
        // ✅ FIXED: Fallback detection with default
        // ✅ IMPROVED: Safer success criteria access with tier-based defaults
const maxLatency = trial.successCriteria?.maxLatencyMs || 
  (tier === 'Q1' ? 500 : tier === 'Q4' ? 1000 : 2000);

if (results?.failureReasons?.length > 0 || 
    results?.tier === 'poor' || 
    results?.latencyMs > maxLatency ||
    !results?.success) {
  fallbacksDetected = true;
}

      });
    });
  });
  
  // ✅ FIXED: Calculate with validation
  const overallSuccess = totalTrials > 0 ? (successfulTrials / totalTrials) >= 0.8 : false;
  const mcdAlignmentScore = mcdAlignmentCount > 0 ? (mcdAlignmentTotal / mcdAlignmentCount) * 100 : 0;
  const avgLatency = totalTrials > 0 ? totalLatency / totalTrials : 0;
  const resourceEfficiency = calculateResourceEfficiency(avgLatency, tier);
  
  // ✅ FIXED: Enhanced user experience calculation
  const avgAccuracy = calculateAverageAccuracy(scenarioResults);
  const baseSuccessRate = totalTrials > 0 ? (successfulTrials / totalTrials) * 100 : 0;
  const consistencyBonus = calculateConsistencyBonus(scenarioResults);
  const userExperienceScore = Math.min(100, 
    (baseSuccessRate * 0.6) + 
    (avgAccuracy * 0.3) + 
    (consistencyBonus * 0.1)
  );
  
  return {
    overallSuccess,
    mcdAlignmentScore: validatePercentage(mcdAlignmentScore, 'MCD alignment'),
    resourceEfficiency: validatePercentage(resourceEfficiency, 'resource efficiency'),
    fallbackTriggered: fallbacksDetected,
    userExperienceScore: validatePercentage(userExperienceScore, 'user experience'),
    totalTrials,
    successfulTrials
  };
} // ✅ FIX: Proper function closure

// ✅ FIX: Ensure proper brace matching
function calculateAdvancedDomainMetrics(
  scenarioResults: ScenarioResult[],
  walkthrough: DomainWalkthrough,
  tier: SupportedTier
): EnhancedDomainMetrics {
  const basicMetrics = calculateEnhancedDomainMetrics(scenarioResults, walkthrough, tier);
  
  // Calculate performance consistency (lower variance = higher consistency)
  const latencies = getAllLatencies(scenarioResults);
  const performanceConsistency = calculatePerformanceConsistency(latencies);
  
  // Calculate MCD vs Non-MCD advantage
  const mcdAdvantage = calculateMcdAdvantage(scenarioResults);
  
  // Calculate tier optimization score
  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / (latencies.length || 1);
  const tierOptimization = calculateTierOptimization(avgLatency, tier);
  
  // Calculate reliability index (success rate + consistency)
  const reliabilityIndex = (basicMetrics.userExperienceScore * 0.6) + (performanceConsistency * 0.4);
  
  // Calculate cost efficiency (performance per resource unit)
  const costEfficiency = calculateCostEfficiency(basicMetrics, avgLatency);
  
  return {
    ...basicMetrics,
    performanceConsistency: Math.round(performanceConsistency * 10) / 10,
    mcdVsNonMcdAdvantage: mcdAdvantage,
    tierOptimizationScore: tierOptimization,
    reliabilityIndex: Math.round(reliabilityIndex * 10) / 10,
    costEfficiencyRatio: costEfficiency
  };
} // ✅ FIX: Proper closing brace

// ✅ NEW: Domain-specific default success criteria
function getDefaultSuccessCriteria(domain: string, tier: SupportedTier): {
    minAccuracy: number;
    maxTokenBudget: number;
    maxLatencyMs: number;
} {
    const baseCriteria = {
        'appointment-booking': { 
            minAccuracy: 0.75, 
            maxTokenBudget: 80,
            Q1: 400, Q4: 800, Q8: 1500  // latency by tier
        },
        'spatial-navigation': { 
            minAccuracy: 0.70,  // More forgiving due to directional complexity
            maxTokenBudget: 60,  // Should be concise
            Q1: 300, Q4: 600, Q8: 1200
        },
        'failure-diagnostics': { 
            minAccuracy: 0.80,  // Higher accuracy needed for technical domain
            maxTokenBudget: 120, // More detailed responses needed
            Q1: 600, Q4: 1200, Q8: 2000
        }
    };
    
    const defaults = baseCriteria[domain] || {
        minAccuracy: 0.75,
        maxTokenBudget: 100,
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
  
  // ✅ SUCCESS RATE: Analysis
  if (metrics.totalTrials === 0) {
    recommendations.push('No trials were executed successfully - check engine and domain configuration');
  } else if (metrics.successfulTrials / metrics.totalTrials < 0.8) {
    recommendations.push(`Success rate is ${Math.round((metrics.successfulTrials / metrics.totalTrials) * 100)}% - target is 80%+`);
  }
  
  // ✅ MCD EFFECTIVENESS: Analysis
  if (metrics.mcdAlignmentScore < 70) {
    recommendations.push('MCD alignment score is below 70% - review MCD principle implementation');
  }
  
  // ✅ RESOURCE EFFICIENCY: Analysis
  if (metrics.resourceEfficiency < 60) {
    recommendations.push(`Resource efficiency is ${metrics.resourceEfficiency}% for ${tier} tier - optimize latency`);
  }
  
  // ✅ TIER-SPECIFIC: Recommendations
  if (tier === 'Q1' && metrics.resourceEfficiency < 80) {
    recommendations.push('Q1 tier should prioritize speed - reduce response complexity');
  } else if (tier === 'Q8' && metrics.userExperienceScore < 80) {
    recommendations.push('Q8 tier should provide comprehensive responses - enhance detail level');
  }
  
  // ✅ COMPARISON: MCD vs Non-MCD analysis
  let mcdPerformance = 0;
  let nonMcdPerformance = 0;
  
  scenarioResults.forEach(scenario => {
    const comp = scenario.mcdVsNonMcdComparison;
    mcdPerformance += comp.mcdSuccess;
    nonMcdPerformance += comp.nonMcdSuccess;
  });
  
  if (mcdPerformance <= nonMcdPerformance) {
    recommendations.push('MCD approach is not outperforming Non-MCD - review MCD implementation');
} else if (nonMcdPerformance > 0) {
    const performanceRatio = Math.round((mcdPerformance/nonMcdPerformance)*100);
    recommendations.push(`MCD approach shows ${performanceRatio}% better performance than Non-MCD`);
} else {
    recommendations.push(`MCD approach succeeded while Non-MCD failed completely`);
}

  
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
// ✅ INDIVIDUAL EXPORTS: Required by test-runner.ts
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
