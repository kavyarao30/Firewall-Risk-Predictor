/**
 * Unified analyzer module
 * Handles API calls to HF with proper error handling
 */
import { InferenceClient } from "@huggingface/inference";
import { getThinkingPrompt, getAnalysisPrompt } from "./prompts.js";

export class AIAnalyzer {
  constructor(apiKey) {
    this.client = apiKey ? new InferenceClient(apiKey) : null;
    this.apiKey = apiKey;
  }

  async generateThinkingSteps(caseId, userInput, detectedFactors) {
    if (!this.client || !this.apiKey) {
      throw new Error("Hugging Face API key not configured");
    }

    const userPrompt = getThinkingPrompt(caseId, userInput, detectedFactors);

    try {
      const response = await this.client.chatCompletion({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a firewall security expert providing structured analysis.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices?.[0]?.message?.content || "";
      return this._parseThinkingSteps(content);
    } catch (error) {
      console.error("Error generating thinking steps:", error.message);
      throw error;
    }
  }

  async generateAnalysis(caseId, userInput, riskScore, detectedFactors) {
    if (!this.client || !this.apiKey) {
      throw new Error("Hugging Face API key not configured");
    }

    const userPrompt = getAnalysisPrompt(
      caseId,
      userInput,
      riskScore,
      detectedFactors,
    );

    try {
      const response = await this.client.chatCompletion({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a firewall security expert providing structured JSON analysis.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = response.choices?.[0]?.message?.content || "";
      return this._parseAnalysis(content);
    } catch (error) {
      console.error("Error generating analysis:", error.message);
      throw error;
    }
  }

  _parseThinkingSteps(content) {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn("Could not parse JSON:", e.message);
      }
    }

    // Fallback: split into steps
    return content
      .split("\n")
      .filter((s) => s.trim().length > 0)
      .slice(0, 6);
  }

  _parseAnalysis(content) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn("Could not parse JSON:", e.message);
      }
    }

    return {
      summary: content || "Analysis generated",
      mainConcern: "See summary for details",
      recommendation: "Review and implement recommended controls",
    };
  }
}
