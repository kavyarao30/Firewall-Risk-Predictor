import { useState, useEffect } from 'react';
import { Modal, Tooltip, Empty, Spin } from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { RISK_LEVELS, formatRiskScore } from '../util/constants.js';
import {
  getAllAssessments,
  deleteAssessmentById,
  getAssessmentById,
  clearAllAssessments,
} from '../services/storageService.js';

const CASE_NAMES = {
  1: 'Vendor Access',
  2: 'Rule Cleanup',
  3: 'Internet-Facing Service',
};

export default function AssessmentsHistory({ onBack }) {
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [assessments, filterLevel, sortBy]);

  const loadAssessments = () => {
    setLoading(true);
    try {
      const data = getAllAssessments();
      setAssessments(data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...assessments];

    // Apply risk level filter
    if (filterLevel !== 'ALL') {
      filtered = filtered.filter(
        (a) => (a.result?.riskLevel || 'INFO') === filterLevel
      );
    }

    // Apply sorting
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'highestRisk') {
      filtered.sort((a, b) => (b.result?.riskScore || 0) - (a.result?.riskScore || 0));
    } else if (sortBy === 'lowestRisk') {
      filtered.sort((a, b) => (a.result?.riskScore || 0) - (b.result?.riskScore || 0));
    }

    setFilteredAssessments(filtered);
  };

  const handleViewDetails = (assessment) => {
    setSelectedAssessment(assessment);
    setDetailsOpen(true);
  };

  const handleDeleteAssessment = (id) => {
    Modal.confirm({
      title: 'Delete Assessment',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this assessment? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        if (deleteAssessmentById(id)) {
          setAssessments((prev) => prev.filter((a) => a.id !== id));
          setDetailsOpen(false);
          setSelectedAssessment(null);
        }
      },
    });
  };

  const handleClearAllAssessments = () => {
    Modal.confirm({
      title: 'Clear All Assessments',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete all assessments? This action cannot be undone.',
      okText: 'Yes, Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        if (clearAllAssessments()) {
          setAssessments([]);
          setFilteredAssessments([]);
          setDetailsOpen(false);
          setSelectedAssessment(null);
        }
      },
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="assessments-history">
      {/* Header */}
      <div className="history-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeftOutlined /> Back
        </button>
        <h1>Assessment History</h1>
        <div className="header-actions">
          <Tooltip title="Refresh assessments">
            <button className="refresh-btn" onClick={loadAssessments} title="Refresh">
              <ReloadOutlined /> Refresh
            </button>
          </Tooltip>
          <Tooltip title="Clear all assessments">
            <button 
              className="secondary-btn danger-btn"
              onClick={handleClearAllAssessments}
              disabled={assessments.length === 0}
            >
              <DeleteOutlined /> Clear All
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Controls */}
      <div className="history-controls">
        <div className="filter-group">
          <label>Filter by Risk Level:</label>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="highestRisk">Highest Risk</option>
            <option value="lowestRisk">Lowest Risk</option>
          </select>
        </div>

        <div className="count-display">
          Total: <strong>{filteredAssessments.length}</strong> / {assessments.length} assessments
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <Spin size="large" tip="Loading assessments..." />
        </div>
      ) : filteredAssessments.length === 0 ? (
        <Empty
          description={assessments.length === 0 ? "No assessments yet" : "No assessments match your filters"}
          style={{ marginTop: '50px' }}
        />
      ) : (
        <div className="assessments-table-wrapper">
          <table className="assessments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Risk Score</th>
                <th>Main Concern</th>
                <th>AI Summary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.map((assessment) => {
                const riskLevel =
                  RISK_LEVELS[assessment.result?.riskLevel] || RISK_LEVELS.INFO;
                const caseType = CASE_NAMES[assessment.caseId] || 'Unknown';

                return (
                  <tr key={assessment.id} className="assessment-row">
                    <td className="date-cell">
                      <div className="date-main">{formatDate(assessment.timestamp)}</div>
                      <div className="date-relative">{formatDuration(assessment.timestamp)}</div>
                    </td>

                    <td className="type-cell">
                      <span className="case-type">{caseType}</span>
                    </td>

                    <td className="risk-cell">
                      <div
                        className="risk-badge"
                        style={{ backgroundColor: riskLevel.color }}
                      >
                        <span className="risk-score">
                          {assessment.result?.riskScore || 0}
                        </span>
                        <span className="risk-label">{riskLevel.label}</span>
                      </div>
                    </td>

                    <td className="concern-cell">
                      <div className="concern-text">
                        {assessment.result?.aiMainConcern || assessment.result?.mainConcern || 'N/A'}
                      </div>
                    </td>

                    <td className="summary-cell">
                      <div className="summary-text">
                        {assessment.result?.aiSummary
                          ? assessment.result.aiSummary.substring(0, 60) + '...'
                          : assessment.result?.summary
                          ? assessment.result.summary.substring(0, 60) + '...'
                          : 'N/A'}
                      </div>
                    </td>

                    <td className="actions-cell">
                      <Tooltip title="View Details">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(assessment)}
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteAssessment(assessment.id)}
                        >
                          <DeleteOutlined />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        title={`Assessment Details - ${CASE_NAMES[selectedAssessment?.caseId]}`}
        open={detailsOpen}
        onCancel={() => setDetailsOpen(false)}
        footer={[
          <button
            key="delete"
            className="btn btn-danger"
            onClick={() => handleDeleteAssessment(selectedAssessment?.id)}
          >
            <DeleteOutlined /> Delete
          </button>,
          <button key="close" className="btn btn-primary" onClick={() => setDetailsOpen(false)}>
            Close
          </button>,
        ]}
        width={800}
        className="assessment-details-modal"
      >
        {selectedAssessment && (
          <div className="modal-content">
            {/* Header Info */}
            <div className="modal-header-info">
              <div className="info-item">
                <span className="label">Date:</span>
                <span className="value">{formatDate(selectedAssessment.timestamp)}</span>
              </div>
              <div className="info-item">
                <span className="label">Case Type:</span>
                <span className="value">{CASE_NAMES[selectedAssessment.caseId]}</span>
              </div>
              <div className="info-item">
                <span className="label">Risk Score:</span>
                <span
                  className="value risk-score-badge"
                  style={{
                    backgroundColor:
                      RISK_LEVELS[selectedAssessment.result?.riskLevel]?.color ||
                      RISK_LEVELS.INFO.color,
                  }}
                >
                  {selectedAssessment.result?.riskScore || 0} (
                  {selectedAssessment.result?.riskLevel || 'INFO'})
                </span>
              </div>
            </div>

            {/* Tabs Content */}
            <div className="modal-sections">
              {/* AI Analysis */}
              {selectedAssessment.result?.aiSummary && (
                <div className="modal-section">
                  <h3>
                    <RobotOutlined /> AI Summary
                  </h3>
                  <p>{selectedAssessment.result.aiSummary}</p>
                </div>
              )}

              {/* Main Concern */}
              {(selectedAssessment.result?.aiMainConcern || selectedAssessment.result?.mainConcern) && (
                <div className="modal-section concern">
                  <h3>
                    <ExclamationCircleOutlined /> Main Security Concern
                  </h3>
                  <p>
                    {selectedAssessment.result?.aiMainConcern || selectedAssessment.result?.mainConcern}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {selectedAssessment.result?.aiRecommendation && (
                <div className="modal-section recommendations">
                  <h3>✅ Recommendations</h3>
                  <ul>
                    {(Array.isArray(selectedAssessment.result.aiRecommendation)
                      ? selectedAssessment.result.aiRecommendation
                      : [selectedAssessment.result.aiRecommendation]
                    ).map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Thinking Steps */}
              {selectedAssessment.result?.thinkingSteps && (
                <div className="modal-section thinking">
                  <h3>
                    <BulbOutlined /> AI Thinking Process
                  </h3>
                  <ol>
                    {selectedAssessment.result.thinkingSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Findings */}
              {selectedAssessment.result?.findings && selectedAssessment.result.findings.length > 0 && (
                <div className="modal-section findings">
                  <h3>Risk Findings</h3>
                  <div className="findings-list">
                    {selectedAssessment.result.findings.map((finding, idx) => (
                      <div key={idx} className={`finding-item finding-${finding.type}`}>
                        <div className="finding-title">{finding.title}</div>
                        <div className="finding-description">{finding.description}</div>
                        {finding.recommendation && (
                          <div className="finding-recommendation">
                            <strong>→</strong> {finding.recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Input */}
              {selectedAssessment.userInput && (
                <div className="modal-section user-input">
                  <h3>User Input</h3>
                  <p className="user-input-text">{selectedAssessment.userInput}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
