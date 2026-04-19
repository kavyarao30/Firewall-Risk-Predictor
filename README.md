# 🔥 Firewall Change Risk Predictor

A React application for firewall change risk analysis using **Hugging Face AI** for real-time thinking and risk assessment. Features intelligent confidence scoring, assessment history tracking, and detailed risk artifacts.

**📚 For complete flow documentation with examples, see [README_FLOW.md](README_FLOW.md)**

---

## 🎯 Quick Overview

| Feature        | Details                              |
| -------------- | ------------------------------------ |
| **Analysis**   | Hugging Face AI (required)           |
| **Confidence** | Form data (70%) + NLP (30%) blended  |
| **Streaming**  | Character-by-char typing animation   |
| **History**    | Persistent localStorage tracking     |
| **Components** | Dashboard, Wizard, Analysis, Results |
| **State**      | Redux + Redux-Saga orchestration     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation & Run

```bash
npm install

# Full stack (requires HF API backend)
npm run dev:all

# Separate terminals
npm run server  # Terminal 1: Backend at http://localhost:3000
npm run dev     # Terminal 2: Frontend at http://localhost:5173
```

**⚠️ Important:** Hugging Face API is **required** for analysis. The backend server must be running.

**Frontend:** http://localhost:5173  
**Backend (required):** http://localhost:3000

---

## 📱 User Journey

### 1. Dashboard

- View assessment history with risk scores
- See recurring security issues
- Check risk distribution statistics
- **Clear All button** - Delete all assessments (with confirmation)

### 2. New Assessment

- Select use case (Vendor Access, Rule Cleanup, Internet Service)
- Choose input method (Form or Natural Language)
- Provide firewall change details

### 3. Streaming Analysis

- Real-time confidence calculation
- Detected keywords display
- Animated thinking process (char-by-char)
- Progress bar with percentage

### 4. Results

- Risk score (0-100) with color coding
- AI-powered summary text
- Main security concern
- Recommended actions (specific to risks found)
- Detailed findings list

### 5. Auto-Save

- Assessment automatically saved to localStorage
- Dashboard statistics updated
- New assessment appears in history

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           REACT COMPONENTS (UI Layer)           │
│  Dashboard → Wizard → StreamingAnalysis → Results│
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      REDUX STATE + REDUX-SAGA ORCHESTRATION     │
│  Manages state, triggers side effects            │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          SERVICE LAYER (Business Logic)          │
│  ├─ NLP Service (keyword extraction)             │
│  ├─ Scoring Engine (rule-based analysis)         │
│  ├─ AI Service (HF enhancement + fallback)       │
│  └─ Storage Service (localStorage management)    │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│       DATA LAYER & OPTIONAL BACKEND              │
│  ├─ localStorage (persistent assessments)        │
│  └─ HF API (http://localhost:3000 - optional)    │
└─────────────────────────────────────────────────┘
```

---

## 💡 Key Features

### 1. Blended Confidence Scoring

**Intelligently combines form data with NLP:**

- Form data (structured): 70% weight
- NLP keywords (text): 30% weight
- Example: 100% form + 50% NLP = **85%** confidence

**Why?** Form data is more reliable than free-text, so it gets higher weight.

### 2. Rule-Based Scoring Engine

**Deterministic risk calculation (no AI needed):**

- Detects factors: production environment, overbroad scope, missing protections
- Calculates risk score: base 10 + factor penalties (capped at 100)
- Generates findings: specific security issues
- Creates recommendations: actionable security improvements

### 3. Graceful AI Fallback

**HF API is optional:**

- Scoring engine generates fallback summaries
- If HF API available: Use AI-enhanced text
- If HF API fails: Use fallback text (user doesn't know)
- Result: Analysis always works

### 4. Real-Time Streaming

**Professional animation:**

- Thinking points type character-by-character
- Progress bar animates 0-100% smoothly
- Confidence updated before results
- Detected keywords shown during analysis

### 5. Assessment History

**Persistent tracking:**

- Auto-save to localStorage
- Dashboard shows recent assessments (top 5)
- Risk distribution from all history
- Recurring issues (most common findings)
- Clear All button (with confirmation modal)

---

## 📊 Data Flow

### Complete Assessment Flow

```
INPUT (Form or Text)
    ↓
NLP Service: parseNLInput()
    → Extract keywords & factors
    → Calculate confidence (0-100%)
    ↓
Conditional Confidence Blending:
    IF formData exists:
        → calculateBlendedConfidence(parsed, formData)
        → Formula: (form% × 0.7) + (nlp% × 0.3)
    ELSE:
        → Use NLP confidence only
    ↓
Scoring Engine: analyzeVendorAccess/Cleanup/InternetFacing()
    → Rule-based risk calculation
    → Returns: {riskScore, riskLevel, findings, ...}
    ↓
AI Service: generateAIAnalysis()
    → TRY: Call HF API for enhancements
    → CATCH: Use scoring engine fallback values
    ↓
Redux: Store result + thinking points
    → analysisSuccess(result)
    → setThinkingPoints(points)
    ↓
Storage: saveAssessment()
    → Persist to localStorage
    ↓
UI: Display results with animations
    → Show confidence, keywords, findings
    → User sees final analysis
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx           ← Assessment history, stats, Clear All button
│   ├── AssessmentWizard.jsx    ← 3-step form (case selection, input method, data)
│   ├── StreamingAnalysis.jsx   ← Real-time animation & thinking display
│   ├── Results.jsx             ← Analysis results with findings
│   ├── TopologyView.jsx        ← Network visualization (optional)
│   └── Message.jsx             ← Notification utility
│
├── services/
│   ├── nlpService.js           ← Keyword extraction, confidence blending
│   ├── scoringEngine.js        ← Rule-based analysis (3 case types)
│   ├── aiService.js            ← HF API orchestration, fallback
│   └── storageService.js       ← localStorage persistence & statistics
│
├── sagas/
│   └── assessmentSaga.js       ← Redux-Saga orchestration of entire flow
│
├── slices/
│   └── assessmentSlice.js      ← Redux state & actions
│
├── store/
│   └── index.js                ← Redux store setup with Saga middleware
│
├── util/
│   └── constants.js            ← Form schemas, risk levels, use cases
│
├── App.jsx                     ← Main app router & navigation
├── App.css                     ← Application styling (2000+ lines)
├── main.jsx                    ← React entry point
└── index.css                   ← Global styles
```

---

## 🔄 State Management (Redux)

### Redux Store Structure

```javascript
{
  assessment: {
    // Results & Analysis
    result: {
      riskScore: 0-100,
      riskLevel: "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      findings: [...],
      aiSummary: string,
      aiMainConcern: string,
      aiRecommendation: [...]
    },

    // UI State
    loading: boolean,
    error: null | string,
    thinkingPoints: [],

    // Confidence & Keywords
    confidenceScore: 0-100,
    detectedKeywords: [],

    // Config
    useAIBackend: boolean
  }
}
```

### Redux Actions

- `requestAnalysis({caseId, userInput, formData})` - Initiate analysis (saga)
- `analysisSuccess(result)` - Store successful analysis
- `analysisFailure(error)` - Store error message
- `setThinkingPoints(points)` - Update animation data
- `setConfidenceAndKeywords({confidence, keywords})` - Update UI display
- `setUseAIBackend(boolean)` - Set HF availability flag

---

## 🧠 Service Layer Details

### NLP Service

**`parseNLInput(userInput)`**

- Detects keywords: "production", "jump host", "legacy", "WAF", etc.
- Extracts factors: isProduction, scopeIsOverbroad, hasDependencies, etc.
- Calculates confidence: (keywords.length / 8) × 100
- Returns: `{confidence, keywords, detectedFactors, entities}`

**`calculateBlendedConfidence(parsed, formData)`**

- If formData: blends form completion (70%) + NLP (30%)
- If no formData: returns NLP confidence as-is
- Example: 80% form + 60% NLP = 74% final

### Scoring Engine

**Three analyzers (case-specific):**

1. **analyzeVendorAccess()** - Vendor permission scope
2. **analyzeRuleCleanup()** - Rule removal impact
3. **analyzeInternetFacing()** - Internet protection

**All return:**

```javascript
{
  riskScore: 0-100,
  riskLevel: "CRITICAL|HIGH|MEDIUM|LOW|INFO",
  findings: [{type, title, description}, ...],
  artifacts: {ruleDiff, suggestedRules, ...},
  aiSummary: string,              // Fallback
  aiMainConcern: string,          // Fallback
  aiRecommendation: string[]      // Fallback
}
```

### AI Service

**`generateAIAnalysis(caseId, userInput, scoringInput, parsed)`**

1. Call scoring engine → get base analysis + fallback values
2. TRY: Call HF API for AI enhancement
3. CATCH: Keep fallback values (user doesn't see error)
4. Return: Complete analysis with AI or fallback summaries

**Fallback strategy ensures users always get analysis.**

### Storage Service

| Function                  | Purpose                            |
| ------------------------- | ---------------------------------- |
| `getAllAssessments()`     | Get all from localStorage          |
| `saveAssessment()`        | Persist new assessment             |
| `getRiskDistribution()`   | Count by risk level                |
| `getRecentAssessments(5)` | Last 5 assessments                 |
| `getRecurringIssues()`    | Top 5 common findings              |
| `getStatistics()`         | Dashboard stats                    |
| `clearAllAssessments()`   | Delete all (requires confirmation) |

---

## 🎯 Use Cases

### Case 1: Vendor Access

Firewall rules for 3rd-party vendor access

- **Detects:** Overbroad scope, missing restrictions, direct access
- **Risks:** Unauthorized access, compliance violations
- **Recommends:** Least privilege access, time-based restrictions

### Case 2: Rule Cleanup

Removing old firewall rules

- **Detects:** Hidden dependencies, production systems, cascading risks
- **Risks:** Service outages, cascading failures
- **Recommends:** Impact analysis, rollback planning

### Case 3: Internet-Facing Service

New public API or web application

- **Detects:** Missing WAF, DDoS, TLS, rate limiting
- **Risks:** DDoS attacks, application exploits, brute force
- **Recommends:** Security hardening checklist

---

## 💾 Assessment Data Structure

```javascript
{
  id: 1634567890123,                      // Timestamp ID
  timestamp: "2024-04-19T10:30:00Z",      // ISO string
  caseId: 1,                              // 1=Vendor, 2=Cleanup, 3=Internet
  userInput: "Original user description",
  formData: {vendor, scope, environment, ...} || null,
  result: {
    riskScore: 75,
    riskLevel: "HIGH",
    confidenceScore: 85,
    detectedKeywords: ["🏭 Production", "⚠️ Scope"],
    findings: [{type, title, description}, ...],
    artifacts: {ruleDiff, suggestedRules, ...},
    aiSummary: string,
    aiMainConcern: string,
    aiRecommendation: [string, ...],
    thinkingSteps: [string, ...]
  }
}
```

---

## 🎨 UI Features

### Confidence Display

- Shows percentage (0-100%)
- Green if ≥70%, yellow if 40-69%, red if <40%
- Updates during analysis, before results shown

### Detected Keywords

- Emoji indicators: 🏭, ⚠️, ✅, 🔗, 🛡️, etc.
- Shows what system extracted from input
- Helps user understand analysis basis

### Streaming Animation

- Typing animation (char-by-char)
- Smooth progress bar (0-100%)
- Real-time thinking points display
- Professional, realistic feel

### Risk Visualization

- Color-coded badges:
  - 🔴 **CRITICAL** (80-100)
  - 🟠 **HIGH** (60-79)
  - 🟡 **MEDIUM** (40-59)
  - 🟢 **LOW** (20-39)
  - 🔵 **INFO** (0-19)

### Dashboard Management

- **Clear All button** - Delete all assessments
- **Confirmation modal** - Prevents accidental deletion
- **Auto-refresh** - Dashboard updates after clear
- **Disabled when empty** - Button disabled if no assessments

---

## 🔧 Advanced Configuration

### Environment Setup

No API keys required for offline operation.

**Optional: Hugging Face Enhancement**

```bash
# Terminal 1: Run backend
npm run server

# Terminal 2: Run frontend
npm run dev
```

Backend will attempt to call HF API if configured. If not available, scoring engine fallback is used.

---

## 📈 Example: Form Input (High Confidence)

```
User selects: Vendor Access
Input: Form (all 6 fields filled)
Form data:
  - vendorName: "Acme Corp"
  - accessScope: "Database servers"
  - environment: "Production"
  - timeWindow: "9 AM - 5 PM"
  - hasJumpHost: "Yes"
  - auditLogging: "Yes"

Processing:
1. Form completion: 6/6 = 100%
2. NLP keywords found: 2 (production, restricted)
3. NLP confidence: (2/8) × 100 = 25%
4. Blended: (100% × 0.7) + (25% × 0.3) = 77.5%
   → Rounded to 78%

Result: 78% confidence (HIGH) with form-based accuracy
```

---

## 📈 Example: Natural Language Only (Lower Confidence)

```
User selects: Rule Cleanup
Input: Text only (no form)
Text: "We need to remove old payment rules in production.
       It's legacy but someone might still need them.
       We don't have time to test thoroughly."

Processing:
1. No form data
2. NLP keywords: "production", "legacy", "no time"
   → 3 keywords detected
3. NLP confidence: (3/8) × 100 = 37.5%
4. Blended: 37.5% (form not available)

Result: 37.5% confidence (LOW) with uncertainty flag
System shows: "No form data: using NLP confidence only (37.5%)"
```

---

## 🔐 Security & Storage

- No sensitive data in localStorage
- All analysis local only (no cloud transmission without server)
- Deterministic, reproducible scoring
- Assessments can be cleared with one click

---

## 📚 Documentation

| Document                  | Contents                             |
| ------------------------- | ------------------------------------ |
| **README.md** (this file) | Quick start & overview               |
| **README_FLOW.md**        | Complete flow with detailed examples |
| **SCORING_ENGINE.md**     | Risk calculation algorithm details   |
| **STORE_OPTIMIZATION.md** | Redux state design documentation     |

---

## 🎓 Technology Stack

- **React 19** - UI components
- **Redux** - State management
- **Redux-Saga** - Side effects orchestration
- **Ant Design 6** - UI components & icons
- **Vite** - Build & dev server
- **Express** - Optional backend (HF proxy)
- **Hugging Face** - Optional AI enhancement

---

## 🚀 Tips & Tricks

1. **Maximize confidence** - Use form input (70% vs 30% weight)
2. **Check keywords** - Verify what system detected in your input
3. **Review history** - Dashboard shows risk patterns over time
4. **Clear when needed** - Use "Clear All" to reset statistics
5. **Browser console** - See confidence calculation details

---

## 📝 License

Demo application for learning and demonstration purposes.

---

**Ready to assess your firewall changes? Start with the Dashboard!** →
