/**
 * 💾 Storage Service
 * Manages assessment history using localStorage
 */

const STORAGE_KEY = "firewall-assessments";

/**
 * Get all stored assessments
 */
export function getAllAssessments() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read assessments:", error);
    return [];
  }
}

/**
 * Save a new assessment
 */
export function saveAssessment(assessment) {
  try {
    const assessments = getAllAssessments();
    const newAssessment = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...assessment,
    };
    assessments.unshift(newAssessment); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
    return newAssessment;
  } catch (error) {
    console.error("Failed to save assessment:", error);
    return null;
  }
}

/**
 * Get assessment by ID
 */
export function getAssessmentById(id) {
  const assessments = getAllAssessments();
  return assessments.find((a) => a.id === id);
}

/**
 * Get risk distribution for dashboard
 */
export function getRiskDistribution() {
  const assessments = getAllAssessments();
  const distribution = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  };

  assessments.forEach((assessment) => {
    const level = assessment.result?.riskLevel || "INFO";
    distribution[level]++;
  });

  return distribution;
}

/**
 * Get recurring issues (most common findings)
 */
export function getRecurringIssues() {
  const assessments = getAllAssessments();
  const issueMap = {};

  assessments.forEach((assessment) => {
    const findings = assessment.result?.findings || [];
    findings.forEach((finding) => {
      const issue = finding.title;
      issueMap[issue] = (issueMap[issue] || 0) + 1;
    });
  });

  // Convert to array and sort by frequency
  return Object.entries(issueMap)
    .map(([issue, count]) => ({
      issue,
      count,
      severity:
        count > 5
          ? "CRITICAL"
          : count > 3
          ? "HIGH"
          : count > 1
          ? "MEDIUM"
          : "LOW",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5
}

/**
 * Get recent assessments
 */
export function getRecentAssessments(limit = 5) {
  return getAllAssessments().slice(0, limit);
}

/**
 * Clear all assessments
 */
export function clearAllAssessments() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear assessments:", error);
    return false;
  }
}

/**
 * Get statistics
 */
export function getStatistics() {
  const assessments = getAllAssessments();
  const distribution = getRiskDistribution();

  const totalScore = assessments.reduce(
    (sum, a) => sum + (a.result?.riskScore || 0),
    0,
  );
  const avgScore = assessments.length > 0 ? totalScore / assessments.length : 0;

  return {
    totalAssessments: assessments.length,
    averageRiskScore: Math.round(avgScore),
    distribution,
    mostCommonFinding: getRecurringIssues()[0]?.issue || "None",
  };
}

/**
 * Delete a single assessment by ID
 */
export function deleteAssessmentById(id) {
  try {
    const assessments = getAllAssessments();
    const filtered = assessments.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete assessment:", error);
    return false;
  }
}
