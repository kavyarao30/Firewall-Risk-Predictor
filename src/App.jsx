import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { FireOutlined, HistoryOutlined } from '@ant-design/icons'
import { requestAnalysis } from './slices/assessmentSlice'
import Dashboard from './components/Dashboard.jsx'
import AssessmentWizard from './components/AssessmentWizard.jsx'
import StreamingAnalysis from './components/StreamingAnalysis.jsx'
import Results from './components/Results.jsx'
import TopologyView from './components/TopologyView.jsx'
import AssessmentsHistory from './components/AssessmentsHistory.jsx'
import './App.css'

function App() {
  const dispatch = useDispatch()
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedCase, setSelectedCase] = useState(null)
  const [assessment, setAssessment] = useState(null)

  const handleStartAssessment = () => {
    setCurrentView('wizard')
  }

  const handleWizardComplete = (assessmentData) => {
    // Dispatch saga action to fetch analysis
    dispatch(requestAnalysis({
      caseId: assessmentData.caseId,
      userInput: assessmentData.input,
      formData: assessmentData.formData
    }))
    
    setSelectedCase(assessmentData.caseId)
    setAssessment(assessmentData)
    setCurrentView('analysis')
  }

  const handleWizardCancel = () => {
    setCurrentView('dashboard')
  }

  const handleAnalysisComplete = () => {
    setCurrentView('results')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedCase(null)
    setAssessment(null)
  }

  const handleTopology = () => {
    setCurrentView('topology')
  }

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-brand">
          <h1><FireOutlined /> Firewall Predictor</h1>
        </div>
        <div className="nav-links">
          <button
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentView('history')}
          >
            <HistoryOutlined /> History
          </button>
          {/* <button
            className={`nav-btn ${currentView === 'topology' ? 'active' : ''}`}
            onClick={handleTopology}
          >
            Topology
          </button> */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard onStartAssessment={handleStartAssessment} />
        )}

        {currentView === 'history' && (
          <AssessmentsHistory onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'wizard' && (
          <AssessmentWizard
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}

        {currentView === 'analysis' && selectedCase && assessment && (
          <StreamingAnalysis
            caseId={selectedCase}
            userInput={assessment.input}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {currentView === 'results' && selectedCase && (
          <Results caseId={selectedCase} onDone={handleBackToDashboard} />
        )}

        {currentView === 'topology' && <TopologyView />}
      </main>
    </div>
  )
}

export default App
