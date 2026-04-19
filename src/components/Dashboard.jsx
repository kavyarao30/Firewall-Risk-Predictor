import { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined, FireOutlined, PlusOutlined } from '@ant-design/icons';
import { RISK_LEVELS, formatRiskScore } from '../util/constants.js';
import {
  getRiskDistribution, 
  getRecentAssessments,
  getRecurringIssues,
  getStatistics
} from '../services/storageService.js';

export default function Dashboard({ onStartAssessment }) {
  const [riskDistribution, setRiskDistribution] = useState({});
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [recurringIssues, setRecurringIssues] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Load data from storage
    refreshDashboard();
  }, []);

  const refreshDashboard = () => {
    setRiskDistribution(getRiskDistribution());
    setRecentAssessments(getRecentAssessments(5));
    setRecurringIssues(getRecurringIssues());
    setStats(getStatistics());
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h1><FireOutlined /> Firewall Change Risk Predictor</h1>
        </div>
        <p>Rule-based risk analysis for firewall changes</p>
      </div>

      <div className="dashboard-grid">
        {/* Risk Distribution */}
        <section className="risk-distribution">
          <h2>Risk Distribution</h2>
          <div className="risk-bars">
            {Object.entries(RISK_LEVELS).map(([key, level]) => {
              const count = riskDistribution[key.toUpperCase()] || 0;
              const total = Object.values(riskDistribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={key} className="risk-bar-item">
                  <div className="bar-label">
                    <span>{level.label}</span>
                    <span className="count">{count}</span>
                  </div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: level.color
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Assessments */}
        <section className="recent-assessments">
          <h2>Recent Assessments</h2>
          <div className="assessment-list">
            {recentAssessments.length > 0 ? (
              recentAssessments.map(assessment => {
                const riskLevel = RISK_LEVELS[assessment.result?.riskLevel] || {};
                const caseNames = { 1: 'Vendor Access', 2: 'Rule Cleanup', 3: 'Internet Service' };
                const date = new Date(assessment.timestamp);
                const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
                
                return (
                  <div key={assessment.id} className="assessment-card">
                    <div className="assessment-info">
                      <div className="assessment-title-group">
                        <div className="assessment-title">{caseNames[assessment.caseId] || 'Assessment'}</div>
                        <Tooltip title={assessment.userInput || 'No input provided'}>
                          <div className="assessment-icon-info">
                            <InfoCircleOutlined />
                          </div>
                        </Tooltip>
                      </div>
                      <div className="assessment-date">{formattedDate}</div>
                    </div>
                    <div 
                      className="risk-badge" 
                      style={{ backgroundColor: riskLevel.color }}
                    >
                      {assessment.result?.riskScore || 0}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No assessments yet. Start one to get started!</p>
            )}
          </div>
        </section>

        {/* Recurring Issues */}
        <section className="recurring-issues">
          <h2>Recurring Issues</h2>
          <div className="issues-list">
            {recurringIssues.length > 0 ? (
              recurringIssues.map((issue, idx) => (
                <div key={idx} className="issue-item">
                  <div className="issue-info">
                    <div className="issue-title">{issue.issue}</div>
                    <div className="issue-count">{issue.count} occurrences</div>
                  </div>
                  <div 
                    className="issue-severity" 
                    style={{
                      backgroundColor: RISK_LEVELS[issue.severity]?.color
                    }}
                  >
                    {issue.severity}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No issues detected yet.</p>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="dashboard-cta">
          <button 
            className="btn btn-primary btn-large"
            onClick={onStartAssessment}
          >
            <PlusOutlined /> New Assessment
          </button>
        </section>
      </div>
    </div>
  );
}
