/**
 * Consolidated constants and utilities
 */

// Risk levels configuration
export const RISK_LEVELS = {
  CRITICAL: { value: 4, label: "Critical", color: "#d32f2f" },
  HIGH: { value: 3, label: "High", color: "#f57c00" },
  MEDIUM: { value: 2, label: "Medium", color: "#fbc02d" },
  LOW: { value: 1, label: "Low", color: "#388e3c" },
  INFO: { value: 0, label: "Info", color: "#1976d2" },
};

// Use case definitions
export const DEMO_USE_CASES = [
  {
    id: 1,
    title: "Vendor Access",
    description: "Review firewall changes for vendor access",
    scenario:
      "🔑 Imagine your firewall is like a doorman at a club. A friend of a friend (vendor) needs to get in. Should the doorman let them access only their friend's table, or the entire VIP room? We need to make sure they get just enough access but not too much.",
  },
  {
    id: 2,
    title: "Rule Cleanup",
    description: "Analyze impact of rule cleanup",
    scenario:
      "🧹 Think of your firewall rules like toys in a toy box. Some toys are broken and nobody plays with them anymore. But before we throw them away, we need to check if anyone secretly still needs them! Removing the wrong toy might break something important.",
  },
  {
    id: 3,
    title: "New Internet-Facing Service",
    description: "Assess new internet-facing services",
    scenario:
      "🌐 Imagine you're opening a new shop on a busy street where anyone from the internet can see it. Is the shop locked? Does it have security cameras? Is there someone watching the door? We need to make sure it's safe before the grand opening!",
  },
];

// Format functions
export const formatRiskScore = (score) => {
  if (score >= 80) return RISK_LEVELS.CRITICAL;
  if (score >= 60) return RISK_LEVELS.HIGH;
  if (score >= 40) return RISK_LEVELS.MEDIUM;
  if (score >= 20) return RISK_LEVELS.LOW;
  return RISK_LEVELS.INFO;
};

// Form field schemas for each use case
export const FORM_SCHEMAS = {
  1: {
    // Vendor Access
    fields: [
      {
        name: "vendorName",
        label: "Vendor Name",
        type: "text",
        placeholder: "e.g., Acme Corp",
      },
      {
        name: "accessScope",
        label: "Access Scope",
        type: "text",
        placeholder: "e.g., Database servers, App servers",
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        options: ["Development", "Production"],
      },
      {
        name: "timeWindow",
        label: "Time-Based Access Window",
        type: "text",
        placeholder: "e.g., 9 AM - 5 PM, Business Hours",
      },
      {
        name: "hasJumpHost",
        label: "Access via Jump Host?",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        name: "auditLogging",
        label: "Audit Logging Enabled?",
        type: "select",
        options: ["Yes", "No"],
      },
    ],
  },
  2: {
    // Rule Cleanup
    fields: [
      {
        name: "rulesToRemove",
        label: "Number of Rules to Remove",
        type: "number",
        placeholder: "e.g., 15",
      },
      {
        name: "affectedSystems",
        label: "Affected Systems",
        type: "text",
        placeholder: "e.g., Legacy Payment System, Old API",
      },
      {
        name: "hasDependencies",
        label: "Any Hidden Dependencies?",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        options: ["Development", "Production"],
      },
      {
        name: "hasRollbackPlan",
        label: "Rollback Plan Documented?",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        name: "impactAssessment",
        label: "Impact Assessment",
        type: "text",
        placeholder: "Describe potential impact of cleanup",
      },
    ],
  },
  3: {
    // Internet-Facing Service
    fields: [
      {
        name: "serviceName",
        label: "Service Name",
        type: "text",
        placeholder: "e.g., Public API, Web Portal",
      },
      {
        name: "publicEndpoint",
        label: "Public Endpoint/Domain",
        type: "text",
        placeholder: "e.g., api.company.com",
      },
      {
        name: "hasWAF",
        label: "Web Application Firewall (WAF) Enabled?",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        name: "hasDDoSProtection",
        label: "DDoS Protection Configured?",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        name: "sslVersion",
        label: "SSL/TLS Version",
        type: "select",
        options: ["TLS 1.2", "TLS 1.3", "Mixed"],
      },
      {
        name: "rateLimiting",
        label: "Rate Limiting Enabled?",
        type: "select",
        options: ["Yes", "No"],
      },
    ],
  },
};
