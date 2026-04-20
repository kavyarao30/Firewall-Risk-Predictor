/**
 * 🤖 Consolidated AI Service
 * Combines rule-based scoring with HF API enhancement
 */

import {
  analyzeVendorAccess,
  analyzeRuleCleanup,
  analyzeInternetFacing,
} from "./scoringEngine.js";
import { saveAssessment } from "./storageService.js";

const API_URL = "http://localhost:3000";

/**
 * Generate complete analysis with rule-based scoring
 *
 * @param {number} caseId - Use case identifier (1=Vendor Access, 2=Rule Cleanup, 3=Internet-facing Service)
 * @param {string} userInput - Original user text input (used for regex-based detection)
 * @param {string|object} scoringInput - Structured input for scoring engine (formData if available, else userInput)
 * @param {object} parsedNLPResult - Result from parseNLInput() containing:
 *   - confidence: number (0-100)
 *   - keywords: array of detected risk factors
 *   - detectedFactors: object with boolean flags for each risk category
 *   - entities: object containing detected environment, devices, services
 * @returns {Promise<object>} Complete analysis result with riskScore, thinkingSteps, and recommendations
 */
export async function generateAIAnalysis(
  caseId,
  userInput,
  scoringInput,
  parsedNLPResult,
) {
  try {
    // Check if backend AI service is available before analysis
    const backendAvailable = await isBackendAvailable();
    if (!backendAvailable) {
      throw new Error("AI backend service is not available. Please ensure the server is running and the Hugging Face API is configured.");
    }

    // Prepare factor data for scoring
    let factorData = scoringInput || userInput;

    // Convert natural language input to structured factor data for scoring engine
    // Only convert if factorData is still a string (hasn't been converted from formData)
    if (typeof factorData === "string") {
      // Pass: caseId (to determine which factors matter)
      //       factorData (raw text for regex pattern matching)
      //       parsedNLPResult.detectedFactors (pre-parsed keywords & flags)
      factorData = convertNLToFactors(
        caseId,
        factorData,
        parsedNLPResult.detectedFactors,
      );
    }

    let analysis;
    switch (caseId) {
      case 1:
        analysis = analyzeVendorAccess(factorData);
        break;
      case 2:
        analysis = analyzeRuleCleanup(factorData);
        break;
      case 3:
        analysis = analyzeInternetFacing(factorData);
        break;
      default:
        analysis = analyzeVendorAccess(factorData);
    }

    // Call backend API for intelligent thinking steps
    // Pass detectedFactors so API can tailor thinking to specific risk factors found
    const aiThinkingSteps = await generateAIThinkingPoints(
      caseId,
      userInput,
      parsedNLPResult.detectedFactors,
    );

    // Call backend API for risk analysis using:
    // - riskScore from rule-based engine
    // - detectedFactors to provide context for AI reasoning
    const aiAnalysis = await generateRiskAnalysisFromHF(
      caseId,
      userInput,
      analysis.riskScore,
      parsedNLPResult.detectedFactors,
    );

    // Set thinking steps from API
    analysis.thinkingSteps = aiThinkingSteps;

    // Set analysis fields from API
    if (aiAnalysis) {
      analysis.aiSummary = aiAnalysis.summary;
      analysis.aiMainConcern = aiAnalysis.mainConcern;
      analysis.aiRecommendation = aiAnalysis.recommendation;
    }

    // Save assessment
    saveAssessment({ caseId, userInput, result: analysis });
    return analysis;
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
}

/**
 * Convert NL-parsed factors to scoring engine format
 *
 * @param {number} caseId - Use case identifier (determines which factors to extract)
 * @param {string} nlInput - Raw text input (used for regex-based detection when needed)
 * @param {object} detectedFactors - Pre-parsed factors from parseNLInput() containing:
 *   - isProduction, scopeIsOverbroad, hasTimeBasedRestrictions, hasJumpHost,
 *     hasDependencies, securityLevel, isInternetFacing, hasProtection
 * @returns {object} Structured factor data specific to the use case:
 *   - Case 1 (Vendor): accessScope, environment, hasJumpHost, timeWindow, auditLogging, vendorName
 *   - Case 2 (Cleanup): rulesToRemove, affectedSystems, hasDependencies, environment, hasRollbackPlan, impactAssessment
 *   - Case 3 (Internet): serviceName, publicEndpoint, hasWAF, hasDDoSProtection, sslVersion, rateLimiting
 */
function convertNLToFactors(caseId, nlInput, detectedFactors) {
  const factors = {};

  if (caseId === 1) {
    // Vendor Access case
    factors.accessScope = nlInput; // Keep the full input for overbroad detection
    factors.environment = detectedFactors.isProduction
      ? "Production"
      : "Development";
    factors.hasJumpHost = detectedFactors.hasJumpHost ? "Yes" : "No";
    factors.timeWindow = detectedFactors.hasTimeBasedRestrictions ? "Yes" : "";
    factors.auditLogging = detectedFactors.hasProtection ? "Yes" : "No";
    factors.vendorName = "";
  } else if (caseId === 2) {
    // Rule Cleanup case
    factors.rulesToRemove = "15"; // Default if not detected
    factors.affectedSystems = nlInput;
    factors.hasDependencies = detectedFactors.hasDependencies ? "Yes" : "No";
    factors.environment = detectedFactors.isProduction
      ? "Production"
      : "Development";
    factors.hasRollbackPlan = "No";
    factors.impactAssessment = nlInput;
  } else if (caseId === 3) {
    // Internet-Facing Service case - Enhanced NLP for each protection
    factors.serviceName = "";
    factors.publicEndpoint = nlInput; // Use full input for internet-facing detection

    // Enhanced detection for each protection type
    const lower = nlInput.toLowerCase();

    // WAF detection - look for explicit "WAF", "firewall", "enabled", "configured"
    factors.hasWAF =
      /\bwaf\b|web.?application.?firewall|firewall.*(enabled|configured)/.test(
        lower,
      ) && !/no\s+waf|no\s+firewall/.test(lower)
        ? "Yes"
        : "No";

    // DDoS detection - look for Cloudflare, CloudFront, Shield, or explicit "DDoS protection"
    factors.hasDDoSProtection =
      /cloudflare|cloudfront|aws\s+shield|ddos.?protection|ddos.*(enabled|configured)|protection.*enabled/.test(
        lower,
      ) && !/no\s+ddos|ddos.*not.*enabled|not.*ddos/.test(lower)
        ? "Yes"
        : "No";

    // TLS detection - HTTPS is strong (1.3), HTTP-only or explicit TLS 1.2 is weak
    if (
      /\bhttps\b|tls.*1\.3|tls\s+enforcement|enforce.*tls/.test(lower) &&
      !/http\s+only|no\s+https|no\s+tls|http\s+and\s+https/.test(lower)
    ) {
      factors.sslVersion = "TLS 1.3";
    } else if (
      /tls\s+1\.2|tlsv?1\.2|no\s+https|no\s+tls|http\s+and\s+https|needs\s+http|plain\s+http/.test(
        lower,
      )
    ) {
      factors.sslVersion = "TLS 1.2";
    } else if (/\bhttps\b/.test(lower)) {
      // If only HTTPS is mentioned without version, assume modern TLS 1.3
      factors.sslVersion = "TLS 1.3";
    } else {
      factors.sslVersion = "TLS 1.2"; // Default to weak if uncertain
    }

    // Rate limiting detection
    factors.rateLimiting =
      /rate.?limit|rate\s+limiting|req\/min|requests.*per|throttl/.test(
        lower,
      ) && !/no\s+rate|rate.*not/.test(lower)
        ? "Yes"
        : "No";
  }

  return factors;
}

/**
 * Generate intelligent thinking steps from backend API
 *
 * @param {number} caseId - Use case identifier
 * @param {string} userInput - Original user input (sent to API for context)
 * @param {object} detectedFactors - Pre-parsed factors (sent to API to tailor thinking steps)
 * @returns {Promise<array|null>} Array of thinking step strings, or null if API fails/unavailable
 *
 * Variable Path:
 * Saga → generateAIAnalysis → this function
 * Returns data that flows: API response → analysis.thinkingSteps → Redux setThinkingPoints → StreamingAnalysis component
 */
export async function generateAIThinkingPoints(
  caseId,
  userInput,
  detectedFactors,
) {
  const response = await fetch(`${API_URL}/api/smart-thinking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId, userInput, detectedFactors }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(
      `Smart thinking API failed (${response.status}): ${errorData}`,
    );
  }

  const data = await response.json();
  if (!data.thinkingSteps) {
    throw new Error("Smart thinking API returned no thinkingSteps");
  }
  return data.thinkingSteps;
}

/**
 * Generate risk analysis from backend API
 *
 * @param {number} caseId - Use case identifier
 * @param {string} userInput - Original user input
 * @param {number} riskScore - Risk score from rule-based scoring engine (0-100)
 * @param {object} detectedFactors - Pre-parsed factors (sent to API for context-aware analysis)
 * @returns {Promise<object|null>} Analysis result with summary, mainConcern, recommendation, or null if API fails
 *
 * Variable Path:
 * Saga → generateAIAnalysis → this function
 * Returns data that flows: API response → analysis.aiSummary/aiMainConcern/aiRecommendation → Redux analysisSuccess → Results component
 */
async function generateRiskAnalysisFromHF(
  caseId,
  userInput,
  riskScore,
  detectedFactors,
) {
  const response = await fetch(`${API_URL}/api/risk-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId, userInput, riskScore, detectedFactors }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(
      `Risk analysis API failed (${response.status}): ${errorData}`,
    );
  }

  const data = await response.json();
  if (!data.summary || !data.mainConcern || !data.recommendation) {
    throw new Error("Risk analysis API returned incomplete data");
  }
  return data;
}

/**
 * Check if backend is available
 */
export async function isBackendAvailable() {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.status === "ok" && data.api_configured;
  } catch {
    return false;
  }
}
