/**
 * 🧠 NLP Service with HF API
 * Uses Hugging Face API for intelligent natural language understanding
 * Extracts context, intent, and risk factors from user input
 */

const API_URL = "http://localhost:3000";

/**
 * Check if backend API is healthy
 * @returns {Promise<boolean>} True if backend is available and healthy
 */
async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Parse user input using HF API to intelligently extract risk factors
 *
 * @param {string} input - User's natural language text input
 * @param {number} caseId - Scenario ID (1=Vendor Access, 2=Rule Cleanup, 3=Internet-Facing Service)
 * @returns {Promise<object>} Parsed NLP result containing:
 *   - rawInput: string (original user input)
 *   - keywords: array<string> (detected risk keywords with descriptions)
 *   - detectedFactors: object (boolean flags for risk categories)
 *   - confidence: number (0-100, from HF API assessment)
 *   - entities: object (environment, devices, services, users)
 */
export async function parseNLInput(input, caseId = 1) {
  try {
    // Check backend health before parsing
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      throw new Error("Backend API is not available");
    }

    // Call backend API to use HF API for NLP parsing
    const response = await fetch(`${API_URL}/api/parse-input`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: input, caseId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`NLP parsing failed (${response.status}): ${errorData}`);
    }

    const data = await response.json();

    // Validate required fields
    if (!data.detectedFactors || typeof data.confidence !== "number") {
      throw new Error("NLP API returned invalid response structure");
    }

    return {
      rawInput: input,
      keywords: data.keywords || [],
      detectedFactors: data.detectedFactors,
      confidence: data.confidence,
      entities: data.entities || {
        environment: null,
        devices: [],
        services: [],
        users: [],
      },
    };
  } catch (error) {
    console.error("NLP parsing error:", error);
    throw error;
  }
}
