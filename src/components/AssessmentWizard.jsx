import { useState } from 'react';
import { FileTextOutlined, FormOutlined, FileOutlined, MessageOutlined } from '@ant-design/icons';
import { DEMO_USE_CASES, FORM_SCHEMAS } from '../util/constants.js';
import Message from './Message.jsx';

export default function AssessmentWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState('select-case');
  const [selectedCase, setSelectedCase] = useState(null);
  const [inputMethod, setInputMethod] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [formData, setFormData] = useState({});

  const handleCaseSelect = (useCase) => {
    setSelectedCase(useCase);
    setFormData({}); // Reset form data for new case
    setStep('input-method');
  };

  const handleInputMethodSelect = (method) => {
    setInputMethod(method);
    if (method === 'file') {
      Message.warning('File upload not implemented in this demo. Please use form or natural language input.');
    } else {
      setStep('input-details');
    }
  };

  const handleFormFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const convertFormDataToText = () => {
    const schema = FORM_SCHEMAS[selectedCase.id];
    return schema.fields
      .map(field => `${field.label}: ${formData[field.name] || 'Not specified'}`)
      .join('; ');
  };

  const handleAnalysisStart = () => {
    if (selectedCase) {
      const input = inputMethod === 'form' ? convertFormDataToText() : inputValue;
      onComplete({
        caseId: selectedCase.id,
        inputMethod,
        input,
        formData: inputMethod === 'form' ? formData : null, // Pass actual form data for scoring
      });
    }
  };

  return (
    <div className="assessment-wizard">
      {step === 'select-case' && (
        <div className="wizard-step">
          <h2>Select Use Case</h2>
          <p>Choose a firewall change scenario to analyze</p>
          <div className="use-cases-grid">
            {DEMO_USE_CASES.map(useCase => (
              <div
                key={useCase.id}
                className="use-case-card"
                onClick={() => handleCaseSelect(useCase)}
              >
                <div>
                    <h3>{useCase.title}</h3>
                    <p className="description">{useCase.description}</p>
                    <p className="scenario">{useCase.scenario}</p>
                </div>
                <button className="select-btn">Select</button>
              </div>
            ))}
          </div>
          <div className="wizard-actions">
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'input-method' && selectedCase && (
        <div className="wizard-step">
          <h2>Input Method</h2>
          <p>How would you like to provide firewall change details?</p>
          <div className="input-methods">
            <div
              className="method-card"
              onClick={() => handleInputMethodSelect('natural-language')}
            >
              <div className="method-icon"><MessageOutlined /></div>
              <h3>Natural Language</h3>
              <p>Describe changes in plain English</p>
            </div>
            <div
              className="method-card"
              onClick={() => handleInputMethodSelect('form')}
            >
              <div className="method-icon"><FormOutlined /></div>
              <h3>Form Entry</h3>
              <p>Use structured form inputs</p>
            </div>
            <div
              className="method-card"
              onClick={() => handleInputMethodSelect('file')}
            >
              <div className="method-icon"><FileOutlined /></div>
              <h3>File Import</h3>
              <p>Upload firewall config or rules</p>
            </div>
          </div>
          <div className="wizard-actions">
            <button className="btn btn-secondary" onClick={() => setStep('select-case')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'input-details' && selectedCase && (
        <div className="wizard-step">
          <h2>
            {inputMethod === 'natural-language'
              ? 'Describe Changes'
              : 'Enter Change Details'}
          </h2>

          {inputMethod === 'natural-language' ? (
            <textarea
              className="input-field"
              placeholder="Describe the firewall changes you want to make..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              rows="6"
            />
          ) : (
            <div>
              <div className="form-description">
                <FileTextOutlined /> Please fill in the details below. This information helps us assess the risk accurately.
              </div>
              <div className="form-fields">
                {FORM_SCHEMAS[selectedCase.id].fields.map(field => (
                  <div key={field.name} className="form-group">
                    <label htmlFor={field.name}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={e => handleFormFieldChange(field.name, e.target.value)}
                      >
                        <option value="">Select an option...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={e => handleFormFieldChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="wizard-actions">
            <button className="btn btn-secondary" onClick={() => setStep('input-method')}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAnalysisStart}
              disabled={inputMethod === 'form' 
                ? !Object.values(formData).some(v => v && v.trim())
                : !inputValue.trim()
              }
            >
              Start Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
