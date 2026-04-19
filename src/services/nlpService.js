/**
 * 🧠 NLP Service
 * Natural Language Processing for intelligent risk assessment
 * Extracts context, intent, and risk factors from user input
 */

/**
 * Keywords database for risk factor detection
 */
const RISK_KEYWORDS = {
  environment: {
    production: ["prod", "production", "live", "critical", "main"],
    staging: ["staging", "stage", "test", "dev", "development"],
  },
  scope: {
    overbroad: [
      "everyone",
      "all users",
      "all servers",
      "wildcard",
      "*",
      "any",
      "entire",
      "all",
    ],
    restricted: [
      "specific",
      "limited",
      "restricted",
      "few",
      "targeted",
      "limited",
    ],
  },
  restrictions: {
    hasRestrictions: [
      "time-based",
      "time limited",
      "business hours",
      "scheduled",
      "temporary",
      "expires",
    ],
    noRestrictions: [
      "permanent",
      "always",
      "forever",
      "never expires",
      "indefinite",
    ],
  },
  jumpHost: {
    hasJumpHost: [
      "jump host",
      "bastion",
      "proxy",
      "intermediate",
      "via jump",
      "through bastion",
    ],
    noJumpHost: ["direct access", "direct", "no proxy"],
  },
  dependencies: {
    hasDependencies: [
      "depends",
      "legacy",
      "old system",
      "cascading",
      "interconnected",
      "critical services",
      "production workload",
    ],
    noDependencies: ["isolated", "standalone", "independent"],
  },
  security: {
    lowSecurity: [
      "ftp",
      "telnet",
      "http (not https)",
      "plain text",
      "unencrypted",
    ],
    highSecurity: ["encrypted", "tls", "https", "vpn", "mfa", "multi-factor"],
  },
  internet: {
    internetFacing: [
      "internet",
      "public",
      "external",
      "exposed",
      "from outside",
      "global",
      "www",
    ],
    internal: ["internal", "private", "intranet", "behind firewall"],
  },
  protection: {
    hasProtection: ["waf", "ddos", "rate limiting", "ips", "ids"],
    noProtection: ["no waf", "unprotected", "no ddos", "no rate limiting"],
  },
};

/**
 * Extract keywords, detected factors, and confidence from natural language input
 *
 * @param {string} input - User's natural language text input
 * @returns {object} Parsed NLP result containing:
 *   - rawInput: string (original user input)
 *   - keywords: array<string> (detected risk keywords with emoji indicators)
 *   - detectedFactors: object (boolean flags for 8 risk categories:
 *       isProduction, scopeIsOverbroad, hasTimeBasedRestrictions,
 *       hasJumpHost, hasDependencies, securityLevel, isInternetFacing, hasProtection)
 *   - confidence: number (0-100, based on keywords.length / 8 * 100)
 *   - entities: object (environment, devices, services, users - extracted from text)
 *
 * Note: Confidence calculation: Each detected keyword category contributes ~12.5%
 *       (100% / 8 categories). Max 8 keywords = 100% confidence.
 */
export function parseNLInput(input) {
  const lower = input.toLowerCase();
  const extracted = {
    rawInput: input,
    keywords: [],
    detectedFactors: {},
    confidence: 0,
    entities: {
      environment: null,
      devices: [],
      services: [],
      users: [],
    },
  };

  // Extract environment
  if (matchesKeywords(lower, RISK_KEYWORDS.environment.production)) {
    extracted.entities.environment = "production";
    extracted.detectedFactors.isProduction = true;
    extracted.keywords.push("🏭 Production environment");
  } else if (matchesKeywords(lower, RISK_KEYWORDS.environment.staging)) {
    extracted.entities.environment = "staging";
    extracted.detectedFactors.isProduction = false;
    extracted.keywords.push("🧪 Staging environment");
  }

  // Extract scope assessment
  if (matchesKeywords(lower, RISK_KEYWORDS.scope.overbroad)) {
    extracted.detectedFactors.scopeIsOverbroad = true;
    extracted.keywords.push("⚠️ Broad access scope");
  } else if (matchesKeywords(lower, RISK_KEYWORDS.scope.restricted)) {
    extracted.detectedFactors.scopeIsOverbroad = false;
    extracted.keywords.push("✅ Restricted scope");
  }

  // Extract restrictions
  if (matchesKeywords(lower, RISK_KEYWORDS.restrictions.hasRestrictions)) {
    extracted.detectedFactors.hasTimeBasedRestrictions = true;
    extracted.keywords.push("⏱️ Time-based restrictions");
  } else if (
    matchesKeywords(lower, RISK_KEYWORDS.restrictions.noRestrictions)
  ) {
    extracted.detectedFactors.hasTimeBasedRestrictions = false;
    extracted.keywords.push("🔓 No time restrictions");
  }

  // Extract jump host usage
  if (matchesKeywords(lower, RISK_KEYWORDS.jumpHost.hasJumpHost)) {
    extracted.detectedFactors.hasJumpHost = true;
    extracted.keywords.push("🛡️ Jump host used");
  } else if (matchesKeywords(lower, RISK_KEYWORDS.jumpHost.noJumpHost)) {
    extracted.detectedFactors.hasJumpHost = false;
    extracted.keywords.push("📍 Direct access");
  }

  // Extract dependency info
  if (matchesKeywords(lower, RISK_KEYWORDS.dependencies.hasDependencies)) {
    extracted.detectedFactors.hasDependencies = true;
    extracted.keywords.push("🔗 Hidden dependencies");
  } else if (
    matchesKeywords(lower, RISK_KEYWORDS.dependencies.noDependencies)
  ) {
    extracted.detectedFactors.hasDependencies = false;
    extracted.keywords.push("✔️ No dependencies");
  }

  // Extract security level
  if (matchesKeywords(lower, RISK_KEYWORDS.security.lowSecurity)) {
    extracted.detectedFactors.securityLevel = "low";
    extracted.keywords.push("🚨 Low security protocol");
  } else if (matchesKeywords(lower, RISK_KEYWORDS.security.highSecurity)) {
    extracted.detectedFactors.securityLevel = "high";
    extracted.keywords.push("🔒 High security");
  }

  // Extract internet exposure
  if (matchesKeywords(lower, RISK_KEYWORDS.internet.internetFacing)) {
    extracted.detectedFactors.isInternetFacing = true;
    extracted.keywords.push("🌐 Internet-facing");
  } else if (matchesKeywords(lower, RISK_KEYWORDS.internet.internal)) {
    extracted.detectedFactors.isInternetFacing = false;
    extracted.keywords.push("🏢 Internal only");
  }

  // Extract protection info
  if (matchesKeywords(lower, RISK_KEYWORDS.protection.hasProtection)) {
    extracted.detectedFactors.hasProtection = true;
    extracted.keywords.push("🛡️ Protection enabled");
  } else if (matchesKeywords(lower, RISK_KEYWORDS.protection.noProtection)) {
    extracted.detectedFactors.hasProtection = false;
    extracted.keywords.push("⚠️ No protection");
  }

  // Extract entities (devices, services, users)
  const devicePattern = /(?:device|firewall|fw|server|vm|host)[-\s]?(\w+)/gi;
  let match;
  while ((match = devicePattern.exec(lower)) !== null) {
    extracted.entities.devices.push(match[1]);
  }

  const servicePattern = /(?:service|app|application|api)[-\s]?(\w+)/gi;
  while ((match = servicePattern.exec(lower)) !== null) {
    extracted.entities.services.push(match[1]);
  }

  // Calculate confidence based on keywords found
  extracted.confidence = Math.min(100, (extracted.keywords.length / 8) * 100);

  return extracted;
}

/**
 * Helper: Check if input contains any keywords from a list
 */
function matchesKeywords(input, keywords) {
  return keywords.some((keyword) => input.includes(keyword));
}
