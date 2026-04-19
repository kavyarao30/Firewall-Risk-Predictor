import { call, put, takeEvery } from "redux-saga/effects";
import {
  analysisSuccess,
  analysisFailure,
  requestAnalysis,
  setThinkingPoints,
  setConfidenceAndKeywords,
} from "../slices/assessmentSlice";
import { generateAIAnalysis } from "../services/aiService.js";
import { parseNLInput } from "../services/nlpService.js";

/**
 * Worker Saga: Process assessment request and orchestrate analysis
 */
function* fetchAnalysisSaga(action) {
  try {
    const { caseId, userInput, formData } = action.payload;

    // STEP 1: Parse user input ONCE to extract keywords, confidence, and detected factors
    // Returned object structure: { confidence, keywords, detectedFactors, rawInput, entities }
    const parsedNLPResult = yield call(parseNLInput, userInput);

    // STEP 2: Dispatch confidence and keywords to Redux (used by StreamingAnalysis)
    yield put(
      setConfidenceAndKeywords({
        confidence: Math.round(parsedNLPResult.confidence),
        keywords: parsedNLPResult.keywords,
      }),
    );

    // STEP 3: Select scoring input (formData is more accurate than free-form text)
    const scoringInput = formData || userInput;

    // STEP 4: Call AI analysis, passing parsed result
    // - caseId: to determine use case (1=Vendor, 2=Cleanup, 3=Internet-facing)
    // - userInput: for regex-based protection detection
    // - scoringInput: for converting NL to structured factor data
    // - parsedNLPResult: contains detectedFactors needed by API endpoints
    const analysisResult = yield call(
      generateAIAnalysis,
      caseId,
      userInput,
      scoringInput,
      parsedNLPResult,
    );

    // STEP 5: Store thinking points for streaming animation
    // Will be empty array if API didn't return data (component waits for data)
    yield put(setThinkingPoints(analysisResult.thinkingSteps || []));

    // STEP 6: Dispatch complete analysis result to Redux
    yield put(analysisSuccess(analysisResult));
  } catch (error) {
    // Handle error: store error message in Redux for Results component display
    yield put(analysisFailure(error.message));
    console.error("Analysis saga error:", error);
  }
}

/**
 * Watcher Saga: Listen for requestAnalysis actions
 */
export function* assessmentSaga() {
  yield takeEvery(requestAnalysis.type, fetchAnalysisSaga);
}

export default assessmentSaga;
