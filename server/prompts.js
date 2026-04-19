/**
 * Centralized prompt templates for all use cases
 */

export function getThinkingPrompt(caseId, userInput, detectedFactors) {
  const prompts = {
    1: `You are a firewall security expert analyzing a vendor access request. 
User input: "${userInput || "No details provided"}"
Detected factors: ${JSON.stringify(detectedFactors || {})}

Generate 6 brief thinking steps (1 sentence each) considering RISK LEVEL. Focus on:
1. Risk assessment scope (what systems are at stake?)
2. Principle of least privilege application
3. Jump host/bastion host necessity
4. Time-based access windows
5. Audit logging requirements
6. Rollback and incident response plan

Return ONLY a JSON array of strings. No other text.`,

    2: `You are a firewall security expert analyzing a rule cleanup request.
User input: "${userInput || "No details provided"}"
Detected factors: ${JSON.stringify(detectedFactors || {})}

Generate 6 brief thinking steps (1 sentence each) considering RISK OF BREAKING THINGS. Focus on:
1. Dependency mapping and impact analysis
2. Hidden relationships between rules
3. Production system impact assessment
4. Gradual cleanup strategy (phases)
5. Testing and validation approach
6. Rollback procedures

Return ONLY a JSON array of strings. No other text.`,

    3: `You are a firewall security expert analyzing a new internet-facing service deployment.
User input: "${userInput || "No details provided"}"
Detected factors: ${JSON.stringify(detectedFactors || {})}

Generate 6 brief thinking steps (1 sentence each) considering EXTERNAL ATTACK SURFACE. Focus on:
1. DDoS protection requirements
2. Web Application Firewall (WAF) necessity
3. Encryption and TLS requirements
4. Rate limiting and throttling
5. Authentication and authorization
6. Monitoring and alerting

Return ONLY a JSON array of strings. No other text.`,
  };

  return prompts[caseId] || prompts[1];
}

export function getAnalysisPrompt(
  caseId,
  userInput,
  riskScore,
  detectedFactors,
) {
  // Determine risk level and urgency based on score
  const getRiskLevel = (score) => {
    if (score >= 80)
      return { level: "CRITICAL", urgency: "IMMEDIATE ACTION REQUIRED" };
    if (score >= 60)
      return { level: "HIGH", urgency: "Urgent - Address within 24 hours" };
    if (score >= 40)
      return { level: "MEDIUM", urgency: "Address within 1-2 weeks" };
    return { level: "LOW", urgency: "Monitor and plan accordingly" };
  };

  const riskInfo = getRiskLevel(riskScore);

  // Enhanced output format that emphasizes risk score-driven analysis
  const outputFormat = `Generate JSON with:
- "riskLevel": "${riskInfo.level}" 
- "urgency": "${riskInfo.urgency}"
- "summary": string with 2-3 sentences explaining why the risk score is ${riskScore}/100 and what the main threats are
- "mainConcern": string with 1-2 sentences clearly stating the PRIMARY risk factor driving the high score
- "recommendation": array of strings with specific, actionable mitigations prioritized by impact on risk reduction
Return ONLY valid JSON, no other text.`;

  const prompts = {
    1: `VENDOR ACCESS REQUEST ANALYSIS
Risk Score: ${riskScore}/100 (${riskInfo.level})
Status: ${riskInfo.urgency}

User Input: "${userInput || "No details"}"
Detected Risk Factors: ${JSON.stringify(detectedFactors || {})}

CRITICAL: The risk score of ${riskScore}/100 reflects the security posture. Higher scores indicate:
- Overbroad access scopes (CIDR ranges larger than necessary)
- Lack of jump host/bastion for external access
- Production environment exposure
- Missing time-based restrictions
- Insufficient audit logging

${outputFormat}

Base your analysis on these risk drivers. For score ${riskScore}: 
${
  riskScore >= 80
    ? "This is CRITICAL - immediate controls must be implemented. Deny by default, grant minimally."
    : riskScore >= 60
    ? "This is HIGH RISK - significant mitigations required before approval."
    : riskScore >= 40
    ? "This has MEDIUM risk - standard controls apply, document all access."
    : "This is LOW RISK - basic controls sufficient, but still maintain audit trail."
}`,

    2: `FIREWALL RULE CLEANUP ANALYSIS
Risk Score: ${riskScore}/100 (${riskInfo.level})
Status: ${riskInfo.urgency}

User Input: "${userInput || "No details"}"
Detected Risk Factors: ${JSON.stringify(detectedFactors || {})}

CRITICAL: The risk score of ${riskScore}/100 reflects potential impact of rule removal. Higher scores indicate:
- Production systems will be affected
- Complex dependencies exist
- Hidden relationships between rules
- Lack of rollback planning
- Missing impact assessment

${outputFormat}

Base your analysis on these risk drivers. For score ${riskScore}:
${
  riskScore >= 80
    ? "This is CRITICAL - DO NOT remove rules immediately. Full dependency mapping required, staged removal only."
    : riskScore >= 60
    ? "This is HIGH RISK - Extensive testing required before any removals. Create rollback plan first."
    : riskScore >= 40
    ? "This has MEDIUM risk - Test in staging, document impact, implement gradual removal."
    : "This is LOW RISK - Can proceed with cleanup, but maintain records of all removals for audit."
}`,

    3: `INTERNET-FACING SERVICE ANALYSIS
Risk Score: ${riskScore}/100 (${riskInfo.level})
Status: ${riskInfo.urgency}

User Input: "${userInput || "No details"}"
Detected Risk Factors: ${JSON.stringify(detectedFactors || {})}

CRITICAL: The risk score of ${riskScore}/100 reflects external attack surface exposure. Higher scores indicate:
- Missing DDoS protection
- No Web Application Firewall (WAF)
- Weak encryption (TLS < 1.3)
- No rate limiting
- Missing authentication controls

${outputFormat}

Base your analysis on these risk drivers. For score ${riskScore}:
${
  riskScore >= 80
    ? "This is CRITICAL - DO NOT expose publicly yet. Implement multi-layer defenses: WAF, DDoS, rate limiting, TLS 1.3."
    : riskScore >= 60
    ? "This is HIGH RISK - Require WAF and DDoS protection before public exposure. Upgrade TLS to 1.3."
    : riskScore >= 40
    ? "This has MEDIUM risk - Implement standard protections: WAF, TLS 1.3, rate limiting."
    : "This is LOW RISK - Basic protections sufficient, but monitor continuously."
}`,
  };

  return prompts[caseId] || prompts[1];
}
