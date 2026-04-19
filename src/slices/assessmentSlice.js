import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // ✅ Global state - needed across multiple components
  result: null, // Analysis result (used by Results, Dashboard)
  loading: false, // Loading state
  error: null, // Error message
  thinkingPoints: [], // Set by saga, used by StreamingAnalysis
  useAIBackend: false, // Backend availability flag
  confidenceScore: 0, // Confidence percentage (0-100)
  detectedKeywords: [], // Keywords detected from user input
};

const assessmentSlice = createSlice({
  name: "assessment",
  initialState,
  reducers: {
    // --- Analysis Request Action (saga will handle the side effect) ---
    requestAnalysis(state, action) {
      state.loading = true;
      state.error = null;
      state.thinkingPoints = []; // Clear old thinking points
      // payload: { caseId, userInput }
    },

    // --- Analysis Response Actions ---
    analysisSuccess(state, action) {
      state.loading = false;
      state.result = action.payload;
      state.error = null;
    },
    analysisFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    setThinkingPoints(state, action) {
      state.thinkingPoints = action.payload;
    },

    setUseAIBackend(state, action) {
      state.useAIBackend = action.payload;
    },

    setConfidenceAndKeywords(state, action) {
      state.confidenceScore = action.payload.confidence;
      state.detectedKeywords = action.payload.keywords;
    },

    resetAssessment(state) {
      state.result = null;
      state.loading = false;
      state.error = null;
      state.thinkingPoints = [];
      state.useAIBackend = false;
      state.confidenceScore = 0;
      state.detectedKeywords = [];
    },
  },
});

export const {
  requestAnalysis,
  analysisSuccess,
  analysisFailure,
  setThinkingPoints,
  setUseAIBackend,
  setConfidenceAndKeywords,
  resetAssessment,
} = assessmentSlice.actions;

export default assessmentSlice.reducer;
