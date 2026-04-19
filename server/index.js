import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AIAnalyzer } from "./analyzer.js";

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
