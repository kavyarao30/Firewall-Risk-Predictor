import { useSelector } from 'react-redux';
import { ExclamationCircleOutlined, RobotOutlined, BulbOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { RISK_LEVELS, formatRiskScore, formatRuleDiff } from '../util/constants.js';
import { useState } from 'react';

export default function Results({ caseId, onDone }) {
  const [activeTab, setActiveTab] = useState('analysis');
  
  // Use Redux state instead of local state
  const loading = useSelector(state => state.assessment.loading);
  const error = useSelector(state => state.assessment.error);
  const result = useSelector(state => state.assessment.result);

  if (loading) {
    return (
      <div className="results-view">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing firewall changes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-view">
        <div className="error-message">
          <h3><ExclamationCircleOutlined /> Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={onDone}>
            <ArrowLeftOutlined /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return <div className="results-view">No results found</div>;
  }

  const riskLevel = formatRiskScore(result.riskScore);
  const caseNames = { 1: 'Vendor Access', 2: 'Rule Cleanup', 3: 'Internet-Facing Service' };

  return (
    <div className="results-view">
      {/* Header with Risk Score */}
      <div className="results-header">
        <div>
          <h2>Risk Analysis Results</h2>
          <p className="result-case">{caseNames[caseId] || 'Assessment'}</p>
        </div>
        <div className="result-score-large" style={{ backgroundColor: riskLevel.color }}>
          <div className="score-number">{result.riskScore}</div>
          <div className="score-label">{riskLevel.label} Risk</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="results-tabs">
        <button
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          AI Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'scoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('scoring')}
        >
          Risk Scoring Details
        </button>
        <button
          className={`tab-btn ${activeTab === 'thinking' ? 'active' : ''}`}
          onClick={() => setActiveTab('thinking')}
        >
          AI Thinking Process
        </button>
      </div>

      <div className="tab-content">
        {/* AI Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="ai-analysis-section">
            {/* AI Summary */}
            {result.aiSummary && (
              <div className="analysis-card ai-powered">
                <div className="card-header">
                  <h3><RobotOutlined /> AI-Powered Analysis</h3>
                  <span className="ai-badge">Hugging Face</span>
                </div>
                <p className="analysis-summary">
                  {typeof result.aiSummary === 'string' ? result.aiSummary : JSON.stringify(result.aiSummary)}
                </p>
              </div>
            )}

            {/* Main Concern */}
            {result.aiMainConcern && (
              <div className="analysis-card concern">
                <div className="card-header">
                  <h3><ExclamationCircleOutlined /> Main Security Concern</h3>
                </div>
                <p className="concern-text">
                  {typeof result.aiMainConcern === 'string' ? result.aiMainConcern : JSON.stringify(result.aiMainConcern)}
                </p>
              </div>
            )}

            {/* Recommendation */}
            {result.aiRecommendation && (
              <div className="analysis-card recommendation">
                <div className="card-header">
                  <h3>✅ Recommended Actions</h3>
                </div>
                <p className="recommendation-text">
                    {result.aiRecommendation?.length > 0 ? (
                      <ul>
                        {result.aiRecommendation.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    ) : (
                      "No recommendations available"
                    )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Thinking Process Tab */}
        {activeTab === 'thinking' && (
          <div className="thinking-process-section">
            {result.thinkingSteps && result.thinkingSteps.length > 0 ? (
              <div className="analysis-card thinking">
                <div className="card-header">
                  <h3><BulbOutlined /> AI Thinking Process</h3>
                </div>
                <ol className="thinking-steps">
                  {result.thinkingSteps.map((step, idx) => (
                    <li key={idx}>{typeof step === 'string' ? step : JSON.stringify(step)}</li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="analysis-card thinking">
                <div className="card-header">
                  <h3><BulbOutlined /> AI Thinking Process</h3>
                </div>
                <p style={{ color: '#999', fontStyle: 'italic' }}>No thinking process data available</p>
              </div>
            )}
          </div>
        )}

        {/* Scoring Details Tab */}
        {activeTab === 'scoring' && (
          <div className="scoring-details-section">
            <div className="scoring-card">
              <h3>Risk Score Calculation</h3>
              <div className="score-breakdown">
                <div className="score-item">
                  <span className="score-label">Base Score</span>
                  <span className="score-value">10</span>
                </div>
                {result.findings && result.findings.map((finding, idx) => (
                  <div key={idx} className="score-item">
                    <span className="score-label">{finding.title}</span>
                    <span 
                      className="score-contribution"
                      style={{ color: Object.values(RISK_LEVELS).find(r => r.label === finding.type)?.color }}
                    >
                      +{finding.riskContribution || 5}
                    </span>
                  </div>
                ))}
              </div>
              <div className="score-total">
                <strong>Total Risk Score:</strong>
                <span style={{ fontSize: '24px', color: riskLevel.color, fontWeight: 'bold' }}>
                  {result.riskScore} / 100
                </span>
              </div>
            </div>

            {/* Findings */}
            {result.findings && result.findings.length > 0 && (
              <div className="findings-section">
                <h3>Risk Findings</h3>
                <div className="findings-list">
                  {result.findings.map((finding, idx) => {
                    const findingRiskLevel = Object.values(RISK_LEVELS).find(r => r.label === finding.type) || RISK_LEVELS.INFO;
                    return (
                      <div key={idx} className="finding-card" style={{ borderLeftColor: findingRiskLevel.color }}>
                        <div className="finding-header">
                          <h4>{typeof finding.title === 'string' ? finding.title : JSON.stringify(finding.title)}</h4>
                          <span className="finding-type" style={{ backgroundColor: findingRiskLevel.color }}>
                            {typeof finding.type === 'string' ? finding.type : JSON.stringify(finding.type)}
                          </span>
                        </div>
                        {finding.description && (
                          <p className="finding-description" style={{ marginBottom: '12px' }}>
                            {typeof finding.description === 'string' ? finding.description : JSON.stringify(finding.description)}
                          </p>
                        )}
                        {finding.recommendation && (
                          <p className="finding-recommendation">
                            <strong>Recommendation:</strong> {typeof finding.recommendation === 'string' ? finding.recommendation : JSON.stringify(finding.recommendation)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="results-actions">
        <button className="btn btn-secondary" onClick={onDone}>
          <ArrowLeftOutlined /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}