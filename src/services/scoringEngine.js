/**
 * 🧮 Risk Scoring Engine - Enhanced & Scenario-Aware
 *
 * Three focused cases:
 * 1. Vendor Access - Detects overbroad access, jump host, time restrictions
 * 2. Rule Cleanup - Prevents outage by detecting dependencies & lifecycle
 * 3. Internet-Facing Service - Flags missing WAF, DDoS, TLS, rate limiting
 */

// ============================================================================
// CASE 1: VENDOR ACCESS - Jump Host & Restrictions focused
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
    score += 15;
    findings.push({
      type: "HIGH",
      title: "Production environment",
      description: "Changes affect live production systems",
      riskContribution: 15,
    });
  }

  // Time-based restrictions (unrestricted = HIGH RISK)
  if (
    !factors.timeWindow ||
    factors.timeWindow.trim() === "" ||
    isUnrestrictedAccess(factors.accessScope)
  ) {
    score += 20;
    findings.push({
      type: "CRITICAL",
      title: "No time-based access restrictions or 24/7 access requested",
      description: "Vendor has unrestricted or continuous access window",
      recommendation:
        "Require specific time windows (business hours, specific dates)",
      riskContribution: 20,
    });
  }

  // Audit logging
  if (factors.auditLogging === "No") {
    score += 10;
    findings.push({
      type: "MEDIUM",
      title: "Audit logging not enabled",
      description: "Vendor access activities won't be logged",
      recommendation:
        "Enable comprehensive audit logging for all vendor access",
      riskContribution: 10,
    });
  }

  // Security assessment or auditor context on production = higher scrutiny
  if (
    factors.environment === "Production" &&
    isSecurityAudit(factors.accessScope)
  ) {
    score += 15;
    findings.push({
      type: "HIGH",
      title: "Security audit/assessment on production",
      description: "Vendor has elevated access for security testing",
      recommendation:
        "Require signed NDA, defined scope boundaries, audit trail",
      riskContribution: 15,
    });
  }

  return {
    score: Math.min(score, 100),
    findings,
  };
}

// ============================================================================
// CASE 2: RULE CLEANUP - Dependencies & Testing focused
// ============================================================================

function scoreRuleCleanup(factors) {
  let score = 10;
  const findings = [];

  // Production impact (MAIN RISK)
  if (factors.environment === "Production") {
    score += 30;
    findings.push({
      type: "CRITICAL",
      title: "Production system impact",
      description:
        "Rule cleanup will affect live production systems and real services",
      recommendation:
        "Extensive testing required; consider phased rollout or maintenance window",
      riskContribution: 30,
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
  } else if (isUncertainDependencies(factors.affectedSystems)) {
    // Uncertain dependencies (e.g., "worried about sync issues")
    score += 20;
    findings.push({
      type: "HIGH",
      title: "Uncertain dependencies",
      description: "Potential dependencies exist but are not fully understood",
      recommendation:
        "Conduct thorough dependency analysis before removing rules",
      riskContribution: 20,
    });
  }

  // Legacy services
  if (hasLegacyServices(factors.affectedSystems)) {
    score += 20;
    findings.push({
      type: "HIGH",
      title: "Legacy services affected",
      description: "Rule removal may impact older, critical systems",
      recommendation:
        "Legacy systems often have undocumented dependencies; proceed with caution",
      riskContribution: 20,
    });
  }

  // Security incident context = higher risk
  if (isSecurityIncident(factors.affectedSystems)) {
    score += 25;
    findings.push({
      type: "CRITICAL",
      title: "Security incident response",
      description: "Rules being removed due to active security incident",
      recommendation:
        "Verify incident scope before removing; maintain rollback ready state",
      riskContribution: 25,
    });
  }

  // Rollback plan (MITIGATING FACTOR - reduces risk)
  if (factors.hasRollbackPlan === "Yes") {
    score = Math.max(score - 15, 10); // Reduce score for having rollback plan
    findings.push({
      type: "POSITIVE",
      title: "Rollback plan documented",
      description: "Can quickly restore rules if issues occur",
      recommendation: "Ensure rollback procedures are tested and ready",
      riskContribution: -15,
    });
  } else if (factors.hasRollbackPlan !== "Yes") {
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

  // Staging testing (MITIGATING FACTOR)
  if (isTestedInStaging(factors.impactAssessment)) {
    score = Math.max(score - 10, 10);
    findings.push({
      type: "POSITIVE",
      title: "Tested in staging environment",
      description: "Changes have been validated in non-production",
      recommendation: "Monitor closely during production rollout",
      riskContribution: -10,
    });
  }

  return {
    score: Math.min(score, 100),
    findings,
  };
}

// ============================================================================
// CASE 3: INTERNET-FACING SERVICE - Protection focused
// ============================================================================

function scoreInternetFacing(factors) {
  let score = 10;
  const findings = [];

  // Detect internet exposure
  const isPublic = isInternetFacing(factors.publicEndpoint);

  if (isPublic) {
    score += 15;
    findings.push({
      type: "CRITICAL",
      title: "Internet-facing exposure detected",
      description: "Service is accessible from the public internet",
      recommendation: "Implement multiple layers of protection",
      riskContribution: 15,
    });

    // No WAF (MAIN MITIGATION)
    if (factors.hasWAF === "No") {
      // Check if WAF is planned for future
      if (hasPlannedProtections(factors.publicEndpoint, "waf")) {
        score += 15; // Reduced from 25 if WAF is planned
        findings.push({
          type: "HIGH",
          title: "WAF planned but not yet deployed",
          description:
            "Web Application Firewall protection not enabled before launch",
          recommendation:
            "Deploy WAF immediately, don't rely on 'later' implementation",
          riskContribution: 15,
        });
      } else {
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
    }

    // Weak or missing TLS
    if (hasWeakTLS(factors.sslVersion)) {
      score += 25;
      findings.push({
        type: "CRITICAL",
        title: "Weak or missing TLS encryption",
        description: "Plain HTTP, TLS 1.2 or below, or HTTPS not enforced",
        recommendation: "Enforce TLS 1.3; redirect HTTP to HTTPS",
        riskContribution: 25,
      });
    }

    // DDoS protection
    if (factors.hasDDoSProtection === "No") {
      if (hasPlannedProtections(factors.publicEndpoint, "ddos")) {
        score += 10; // Reduced if DDoS is planned
      } else {
        score += 15;
      }
      findings.push({
        type: "HIGH",
        title: "No DDoS protection",
        description: "Service vulnerable to volumetric DDoS attacks",
        recommendation: "Enable DDoS protection (CDN, cloud DDoS service, WAF)",
        riskContribution:
          factors.hasDDoSProtection === "No" &&
          !hasPlannedProtections(factors.publicEndpoint, "ddos")
            ? 15
            : 10,
      });
    }

    // Rate limiting
    if (factors.rateLimiting === "No") {
      score += 12;
      findings.push({
        type: "MEDIUM",
        title: "Rate limiting not enabled",
        description: "No protection against brute force or API abuse",
        recommendation: "Implement rate limiting on all endpoints",
        riskContribution: 12,
      });
    }

    // Legacy payment system context = higher risk
    if (isLegacyPaymentService(factors.publicEndpoint)) {
      score += 20;
      findings.push({
        type: "CRITICAL",
        title: "Legacy payment system exposed",
        description: "Old payment processing code exposed to internet",
        recommendation: "Modernize payment service before internet exposure",
        riskContribution: 20,
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

  // Check for large CIDR ranges (/8-/16 are too broad, /17-/24 are acceptable)
  const cidrPattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})\b/g;
  let match;
  while ((match = cidrPattern.exec(scope)) !== null) {
    const cidrBits = parseInt(match[2]);
    if (cidrBits <= 16) return true;
  }

  // Check for multiple sensitive ports (2+ = overbroad) - expanded list
  const allPorts = scope.match(/\b(22|3306|5432|1433|27017|443|8080|8443)\b/g);
  if (allPorts && allPorts.length >= 2) {
    // At least 2 ports, check for multiple SENSITIVE ones (not just 443+8080)
    const sensitivePorts = scope.match(/\b(22|3306|5432|1433|27017)\b/g);
    if (sensitivePorts && sensitivePorts.length >= 2) return true;
    // Multiple ports in general (even if one is 443) = still overbroad
    if (allPorts.length >= 2) return true;
  }

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
 * Detect unrestricted time-based access (24/7, no restrictions)
 */
function isUnrestrictedAccess(accessScope) {
  if (!accessScope) return false;
  const scope = accessScope.toLowerCase();
  return /\b(24\/7|24-7|round.?the.?clock|always|unrestricted|no restrictions|immediate access)\b/.test(
    scope,
  );
}

/**
 * Detect security audit/assessment context
 */
function isSecurityAudit(accessScope) {
  if (!accessScope) return false;
  const scope = accessScope.toLowerCase();
  return /\b(security.?(audit|assessment|test|eval)|penetration.?test|auditor|security.?analyst)\b/.test(
    scope,
  );
}

/**
 * Detect uncertain dependencies
 */
function isUncertainDependencies(affectedSystems) {
  if (!affectedSystems) return false;
  const systems = affectedSystems.toLowerCase();
  return /\b(worried|concerned|not.?sure|uncertain|unsure|might|could|may cause|sync issue|compatibility)\b/.test(
    systems,
  );
}

/**
 * Detect security incident context
 */
function isSecurityIncident(affectedSystems) {
  if (!affectedSystems) return false;
  const systems = affectedSystems.toLowerCase();
  return /\b(security.?(incident|breach|attack|threat)|compromised|unauthorized|attack vector|malicious)\b/.test(
    systems,
  );
}

/**
 * Detect if testing was done in staging
 */
function isTestedInStaging(impactAssessment) {
  if (!impactAssessment) return false;
  const assessment = impactAssessment.toLowerCase();
  return /\b(tested.?in.?staging|staging.?environment|tested|validated|staging|verified)\b/.test(
    assessment,
  );
}

/**
 * Detect if service is legacy payment system
 */
function isLegacyPaymentService(endpoint) {
  if (!endpoint) return false;
  const ep = endpoint.toLowerCase();
  return /\b(payment|billing|legacy.?payment|old.?payment)\b/.test(ep);
}

/**
 * Detect planned future protections (red flag for "we'll do it later")
 */
function hasPlannedProtections(endpoint, protectionType) {
  if (!endpoint) return false;
  const ep = endpoint.toLowerCase();
  if (protectionType === "waf") {
    return /\b(waf.?later|add.*waf|get.?waf|plan|future|later|soon|eventually)\b/.test(
      ep,
    );
  }
  if (protectionType === "ddos") {
    return /\b(ddos.?(later|future)|ddos.?plan|add.*ddos|get.*ddos)\b/.test(ep);
  }
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
    /\b(internet|external|public|global|www|internet.?facing)\b/,
  ];
  return patterns.some((p) => p.test(endpoint));
}

/**
 * Detect weak or missing TLS
 */
function hasWeakTLS(sslVersion) {
  if (!sslVersion) return true; // Missing TLS is weak
  const v = sslVersion.toLowerCase();
  // TLS 1.2 and below is considered weak
  return (
    v.includes("http") ||
    v.includes("1.2") ||
    v.includes("1.1") ||
    v.includes("1.0") ||
    v.includes("ssl") ||
    !v.includes("1.3")
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
 * Detects overbroad access, jump host, and time restrictions
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
 * Prevents outage by detecting dependencies and assessing test readiness
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
 * Flags missing WAF, DDoS, TLS, and rate limiting
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
