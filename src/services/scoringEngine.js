/**
 * 🧮 Risk Scoring Engine - Clean & Simple
 *
 * Three focused cases:
 * 1. Vendor Access - Detects overbroad access, suggests Jump Host
 * 2. Rule Cleanup - Prevents outage by detecting dependencies
 * 3. Internet-Facing Service - Flags missing WAF
 */

// ============================================================================
// CASE 1: VENDOR ACCESS - Jump Host focused
// ============================================================================

function scoreVendorAccess(factors) {
  let score = 10;
  const findings = [];

  // Check overbroad access (MAIN RISK)
  if (isOverbroadAccess(factors.accessScope)) {
    score += 30;
    findings.push({
      type: "CRITICAL",
      title: "Overbroad access scope detected",
      description:
        "Large CIDR ranges (e.g., /8, /16) or multiple sensitive ports detected",
      recommendation:
        "Restrict access to specific required servers/subnets only",
      riskContribution: 30,
    });
  }

  // Check for jump host (MAIN MITIGATION)
  if (factors.hasJumpHost === "No") {
    score += 20;
    findings.push({
      type: "CRITICAL",
      title: "No jump host - direct access",
      description: "Vendor is requesting direct access without bastion host",
      recommendation:
        "Implement jump host (bastion) for all external vendor access",
      riskContribution: 20,
    });
  }

  // Production environment increases risk
  if (factors.environment === "Production") {
    score += 20;
    findings.push({
      type: "HIGH",
      title: "Production environment",
      description: "Changes affect live production systems",
      riskContribution: 20,
    });
  }

  // Time-based restrictions
  if (!factors.timeWindow || factors.timeWindow.trim() === "") {
    score += 15;
    findings.push({
      type: "HIGH",
      title: "No time-based access restrictions",
      description: "Access window not defined",
      recommendation: "Set specific time windows (e.g., business hours only)",
      riskContribution: 15,
    });
  }

  // Audit logging
  if (factors.auditLogging === "No") {
    score += 15;
    findings.push({
      type: "MEDIUM",
      title: "Audit logging not enabled",
      description: "Vendor access activities won't be logged",
      recommendation:
        "Enable comprehensive audit logging for all vendor access",
      riskContribution: 15,
    });
  }

  return {
    score: Math.min(score, 100),
    findings,
  };
}

// ============================================================================
// CASE 2: RULE CLEANUP - Dependencies focused
// ============================================================================

function scoreRuleCleanup(factors) {
  let score = 10;
  const findings = [];

  // Production impact (MAIN RISK)
  if (factors.environment === "Production") {
    score += 35;
    findings.push({
      type: "CRITICAL",
      title: "Production system impact",
      description:
        "Rule cleanup will affect live production systems and real services",
      recommendation:
        "Extensive testing required; consider phased rollout or maintenance window",
      riskContribution: 35,
    });
  }

  // Hidden dependencies (MAIN RISK)
  if (factors.hasDependencies === "Yes") {
    score += 30;
    findings.push({
      type: "CRITICAL",
      title: "Hidden dependencies detected",
      description:
        "Other systems or services depend on these rules (potential outage)",
      recommendation:
        "Identify all dependent systems; ensure they have alternative access paths",
      riskContribution: 30,
    });
  }

  // Legacy services
  if (hasLegacyServices(factors.affectedSystems)) {
    score += 25;
    findings.push({
      type: "HIGH",
      title: "Legacy services affected",
      description: "Rule removal may impact older, critical systems",
      recommendation:
        "Legacy systems often have undocumented dependencies; proceed with caution",
      riskContribution: 25,
    });
  }

  // Rollback plan
  if (factors.hasRollbackPlan === "No") {
    score += 20;
    findings.push({
      type: "HIGH",
      title: "No rollback plan",
      description: "Cannot quickly restore rules if issues occur",
      recommendation:
        "Create documented rollback procedure before making changes",
      riskContribution: 20,
    });
  }

  return {
    score: Math.min(score, 100),
    findings,
  };
}

// ============================================================================
// CASE 3: INTERNET-FACING SERVICE - WAF focused
// ============================================================================

function scoreInternetFacing(factors) {
  let score = 10;
  const findings = [];

  // Detect internet exposure
  const isPublic = isInternetFacing(factors.publicEndpoint);

  if (isPublic) {
    score += 20;
    findings.push({
      type: "CRITICAL",
      title: "Internet-facing exposure detected",
      description: "Service is accessible from the public internet",
      riskContribution: 20,
    });

    // No WAF (MAIN MITIGATION)
    if (factors.hasWAF === "No") {
      score += 25;
      findings.push({
        type: "CRITICAL",
        title: "Web Application Firewall (WAF) not enabled",
        description:
          "No WAF protection against common web attacks (SQL injection, XSS, etc.)",
        recommendation:
          "Enable WAF immediately; this is critical for internet-facing services",
        riskContribution: 25,
      });
    }

    // Additional security gaps
    if (hasWeakTLS(factors.sslVersion)) {
      score += 20;
      findings.push({
        type: "HIGH",
        title: "Weak or missing TLS enforcement",
        description: "TLS 1.2 or below, or no HTTPS enforcement",
        recommendation: "Enforce TLS 1.3; redirect HTTP to HTTPS",
        riskContribution: 20,
      });
    }

    if (factors.hasDDoSProtection === "No") {
      score += 15;
      findings.push({
        type: "HIGH",
        title: "No DDoS protection",
        description: "Service vulnerable to DDoS attacks",
        recommendation:
          "Enable DDoS protection (CDN, cloud DDoS service, etc.)",
        riskContribution: 15,
      });
    }

    if (factors.rateLimiting === "No") {
      score += 10;
      findings.push({
        type: "MEDIUM",
        title: "Rate limiting not enabled",
        description: "No protection against brute force or API abuse",
        recommendation: "Implement rate limiting on all endpoints",
        riskContribution: 10,
      });
    }
  }

  return {
    score: Math.min(score, 100),
    findings,
  };
}

// ============================================================================
// DETECTION HELPERS
// ============================================================================

/**
 * Detect if access scope is overbroad (large CIDR ranges or multiple sensitive ports)
 */
function isOverbroadAccess(accessScope) {
  if (!accessScope) return false;

  const scope = accessScope.toLowerCase();

  // Check for large CIDR ranges (/8-/16 are too broad)
  const cidrPattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})\b/g;
  let match;
  while ((match = cidrPattern.exec(scope)) !== null) {
    const cidrBits = parseInt(match[2]);
    if (cidrBits <= 16) return true;
  }

  // Check for multiple sensitive ports (2+ = overbroad)
  const portMatches = scope.match(/\b(22|3306|5432|1433|27017)\b/g);
  if (portMatches && portMatches.length >= 2) return true;

  // Check for keywords indicating unrestricted access
  if (
    /\b(all|entire|unrestricted|any)\b.*\b(subnet|network|range|ports?)\b/.test(
      scope,
    )
  )
    return true;

  return false;
}

/**
 * Detect if legacy services are mentioned
 */
function hasLegacyServices(affectedSystems) {
  if (!affectedSystems) return false;
  const legacyKeywords = [
    "legacy",
    "old",
    "deprecated",
    "payment",
    "billing",
    "core",
    "critical",
    "mainframe",
  ];
  return legacyKeywords.some((kw) =>
    affectedSystems.toLowerCase().includes(kw),
  );
}

/**
 * Detect if service is internet-facing
 */
function isInternetFacing(publicEndpoint) {
  if (!publicEndpoint) return false;
  const endpoint = publicEndpoint.toLowerCase();
  const patterns = [
    /\b(api|public|web|app|service)\..*\.(com|org|net|io|dev)/,
    /^(http|https):\/\//,
    /\b(internet|external|public|global|www)\b/,
  ];
  return patterns.some((p) => p.test(endpoint));
}

/**
 * Detect weak or missing TLS
 */
function hasWeakTLS(sslVersion) {
  if (!sslVersion) return true;
  const v = sslVersion.toLowerCase();
  return (
    v.includes("1.2") ||
    v.includes("1.1") ||
    v.includes("1.0") ||
    v.includes("ssl")
  );
}

// ============================================================================
// PUBLIC EXPORTS
// ============================================================================

/**
 * Get risk level from score
 */
export function getRiskLevel(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "INFO";
}

/**
 * Analyze Vendor Access (Case 1)
 * Detects overbroad access and suggests Jump Host
 * NOTE: aiSummary, aiMainConcern, aiRecommendation will be provided by HF API
 */
export function analyzeVendorAccess(factors) {
  const riskData = scoreVendorAccess(factors);
  const riskLevel = getRiskLevel(riskData.score);
  riskData.level = riskLevel;

  return {
    riskScore: riskData.score,
    riskLevel,
    findings: riskData.findings,
  };
}

/**
 * Analyze Rule Cleanup (Case 2)
 * Prevents outage by detecting hidden dependencies
 * NOTE: aiSummary, aiMainConcern, aiRecommendation will be provided by HF API
 */
export function analyzeRuleCleanup(factors) {
  const riskData = scoreRuleCleanup(factors);
  const riskLevel = getRiskLevel(riskData.score);
  riskData.level = riskLevel;

  return {
    riskScore: riskData.score,
    riskLevel,
    findings: riskData.findings,
  };
}

/**
 * Analyze Internet-Facing Service (Case 3)
 * Flags missing WAF for new internet-facing services
 * NOTE: aiSummary, aiMainConcern, aiRecommendation will be provided by HF API
 */
export function analyzeInternetFacing(factors) {
  const riskData = scoreInternetFacing(factors);
  const riskLevel = getRiskLevel(riskData.score);
  riskData.level = riskLevel;

  return {
    riskScore: riskData.score,
    riskLevel,
    findings: riskData.findings,
  };
}


