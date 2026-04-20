import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AIAnalyzer } from "./analyzer.js";
import { getNLPParsingPrompt } from "./prompts.js";

dotenv.config({ path: ".env.server" });

const app = express();
const PORT = process.env.PORT || 3000;
const HF_API_KEY =
  process.env.VITE_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY;
const analyzer = HF_API_KEY ? new AIAnalyzer(HF_API_KEY) : null;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", api_configured: !!HF_API_KEY });
});

// Parse user input using HF API
app.post("/api/parse-input", async (req, res) => {
  try {
    if (!analyzer) {
      return res
        .status(400)
        .json({ error: "Hugging Face API key not configured" });
    }

    const { userInput, caseId = 1 } = req.body;
    if (!userInput)
      return res.status(400).json({ error: "userInput field is required" });

    const prompt = getNLPParsingPrompt(userInput, caseId);

    // Call HF API to parse the input
    const response = await analyzer.client.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a firewall security expert. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices?.[0]?.message?.content || "";

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("HF API did not return valid JSON for NLP parsing");
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (
      !parsedResult.detectedFactors ||
      typeof parsedResult.confidence !== "number"
    ) {
      throw new Error("NLP response missing required fields");
    }

    res.json(parsedResult);
  } catch (error) {
    console.error("Error in /api/parse-input:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate thinking steps
app.post("/api/smart-thinking", async (req, res) => {
  try {
    if (!analyzer) {
      return res
        .status(400)
        .json({ error: "Hugging Face API key not configured" });
    }

    const { caseId, userInput, detectedFactors } = req.body;
    if (!caseId)
      return res.status(400).json({ error: "caseId field is required" });

    const thinkingSteps = await analyzer.generateThinkingSteps(
      caseId,
      userInput,
      detectedFactors,
    );
    res.json({ thinkingSteps });
  } catch (error) {
    console.error("Error in /api/smart-thinking:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate risk analysis
app.post("/api/risk-analysis", async (req, res) => {
  try {
    if (!analyzer) {
      return res
        .status(400)
        .json({ error: "Hugging Face API key not configured" });
    }

    const { caseId, userInput, riskScore, detectedFactors } = req.body;
    if (!caseId)
      return res.status(400).json({ error: "caseId field is required" });

    const analysis = await analyzer.generateAnalysis(
      caseId,
      userInput,
      riskScore,
      detectedFactors,
    );
    res.json(analysis);
  } catch (error) {
    console.error("Error in /api/risk-analysis:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Firewall Predictor API running on http://localhost:${PORT}`);
  console.log(`🤖 Model: Meta-Llama-3-8B-Instruct`);
  console.log(`🔑 API configured: ${!!HF_API_KEY}`);
  if (!HF_API_KEY) {
    console.warn(`⚠️  Hugging Face API key missing in .env.server`);
  }
});
