import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Progress } from 'antd';
import { RobotOutlined, BulbOutlined, CheckOutlined, SmileOutlined, StarOutlined, LoadingOutlined } from '@ant-design/icons';

export default function StreamingAnalysis({ caseId, userInput, onAnalysisComplete }) {
  const thinkingPoints = useSelector(state => state.assessment.thinkingPoints);
  const error = useSelector(state => state.assessment.error);
  const useAIBackend = useSelector(state => state.assessment.useAIBackend);
  const confidenceScore = useSelector(state => state.assessment.confidenceScore);
  const detectedKeywords = useSelector(state => state.assessment.detectedKeywords);
  
  // Local component state (not needed globally)
  const [displayedThoughts, setDisplayedThoughts] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [understanding, setUnderstanding] = useState(null);
  
  const displayedThoughtsRef = useRef([]);

  // Keep ref in sync with Redux state
  useEffect(() => {
    displayedThoughtsRef.current = displayedThoughts;
  }, [displayedThoughts]);

  // --- Main Effect: Stream Analysis (using thinkingPoints from Redux store) ---
  useEffect(() => {
    let isMounted = true;
    let thoughtInterval;

    const streamAnalysis = () => {
      try {
        // Wait for thinkingPoints from API
        if (!thinkingPoints || thinkingPoints.length === 0) {
          // Still waiting for API data, don't start streaming yet
          return;
        }
        
        setDisplayedThoughts([]);
        displayedThoughtsRef.current = [];
        setIsComplete(false); // START with false, set to true after streaming completes

        // Populate understanding summary from Redux store (set by saga)
        if (detectedKeywords && detectedKeywords.length > 0) {
          setUnderstanding({
            keywords: detectedKeywords,
            confidence: confidenceScore
          });
        }

        // Stream thinking thoughts one by one
        let index = 0;
        thoughtInterval = setInterval(() => {
          if (index < thinkingPoints.length) {
            if (isMounted) {
              const newThoughts = [...displayedThoughtsRef.current, thinkingPoints[index]];
              displayedThoughtsRef.current = newThoughts;
              setDisplayedThoughts(newThoughts);
            }
            index++;
          } else {
            // All steps streamed - mark as complete
            clearInterval(thoughtInterval);
            if (isMounted) {
              setIsComplete(true);
              // Don't call onAnalysisComplete() here - wait for user to click "View Results" button
            }
          }
        }, 1000);
      } catch (err) {
        console.error("Error streaming analysis:", err);
      }
    };

    streamAnalysis();

    return () => {
      isMounted = false;
      if (thoughtInterval) clearInterval(thoughtInterval);
    };
    // Only re-run when thinkingPoints, keywords, or confidence changes
  }, [thinkingPoints, caseId, userInput, detectedKeywords, confidenceScore]);


  return (
    <div className="streaming-analysis">
      <div className="analysis-header">
        <h2><RobotOutlined /> AI Agent Analysis {useAIBackend && <span className="ai-badge">HF Powered</span>}</h2>
        <p>Analyzing firewall change for risks and security implications...</p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="analysis-container">
        {/* Progress Indicator */}
        <div className="progress-indicator" style={{ marginBottom: '24px' }}>
          <Progress
            percent={isComplete ? 100 : Math.min(95, (displayedThoughts.length / (thinkingPoints?.length || 1)) * 100)}
            status={isComplete ? 'success' : 'active'}
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
            format={(percent) => isComplete ? 'Complete' : `${percent.toFixed(0)}%`}
          />
        </div>

        {/* Thinking Process - DISPLAYED FIRST */}
        <section className="thinking-process">
          <h3>{useAIBackend ? <><RobotOutlined /> AI Thinking (via Hugging Face)</> : <><BulbOutlined /> Thinking Process</>}</h3>
          <div className="thoughts-stream">
            {displayedThoughts && displayedThoughts.length > 0 ? (
              displayedThoughts.map((thought, idx) => (
                <div key={idx} className="thought-item">
                  <span className="thought-text">{thought}</span>
                  <span className="thought-cursor">{idx === displayedThoughts.length - 1 ? '|' : ''}</span>
                </div>
              ))
            ) : !error ? (
              <div className="thought-item">
                <span className="thought-text" style={{ color: '#999', fontStyle: 'italic' }}>
                  <LoadingOutlined /> Waiting for AI thinking analysis...
                </span>
              </div>
            ) : (
              <div className="thought-item">
                <span className="thought-text" style={{ color: '#d32f2f', fontStyle: 'italic' }}>
                  Unable to generate thinking analysis. Showing results only.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Understanding Summary */}
        {understanding && (
          <section className="understanding-summary">
            <h3><SmileOutlined /> What I Understood</h3>
            <div className="understanding-content">
              <div className="keywords-detected">
                <p>
                  <strong>Detected Factors:</strong>
                </p>
                <div className="keywords-list">
                  {understanding.keywords.length > 0 ? (
                    understanding.keywords.map((kw, idx) => (
                      <span key={idx} className="keyword-badge">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <p style={{ fontSize: "12px", color: "#999" }}>
                      Continue adding details to detect more factors
                    </p>
                  )}
                </div>
              </div>
              <div className="confidence-level">
                <p>
                  <strong>Confidence:</strong>{" "}
                  <span className="confidence-value">{understanding.confidence?.toFixed(0)}%</span>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Completion Status */}
        {isComplete && (
          <section className="completion-status">
            <div className="status-message">
              <h3><StarOutlined /> Analysis Complete</h3>
              <p>Risk assessment and recommendations generated</p>
              <button className="btn btn-primary" onClick={onAnalysisComplete}>
                View Results
              </button>
            </div>
          </section>
        )}
      </div>


    </div>
  );
}
