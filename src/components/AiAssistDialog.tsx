import * as React from 'react'

type Step = {
  label: string
  key: string
}

const STEPS: Step[] = [
  { key: 'extracting', label: 'Extracting page content' },
  { key: 'preparing', label: 'Preparing AI model' },
  { key: 'thinking', label: 'Analyzing with AI' },
  { key: 'complete', label: 'Apply suggestions' },
];

const FIELD_LABELS: Record<string, string> = {
  authorizationEndpoint: 'Authorization Endpoint',
  tokenEndpoint: 'Token Endpoint',
  clientId: 'Client ID',
  clientSecret: 'Client Secret',
  scope: 'Scope',
  redirectUriFieldSelector: 'Redirect URI (page input)',
};

type Props = {
  currentStep: string
  downloading: boolean
  downloadProgress: number
  suggestions?: AiSuggestions | null
  onApplyAll?: () => void
  onClose?: () => void
  onCancel: () => void
}

const AiAssistDialog = ({ currentStep, downloading, downloadProgress, suggestions, onApplyAll, onClose, onCancel }: Props) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  const isComplete = currentStep === 'complete';

  const foundFields = isComplete && suggestions
    ? Object.keys(FIELD_LABELS).filter(key => {
        if (key === 'redirectUriFieldSelector') return !!suggestions.redirectUriFieldSelector;
        return !!(suggestions as any)[key];
      })
    : [];

  return (
    <div className="ai-dialog">
      <div className="ai-dialog-steps">
        {STEPS.map((step, i) => {
          let status: 'done' | 'active' | 'pending';
          if (i < currentIndex) status = 'done';
          else if (i === currentIndex) status = step.key === 'complete' ? 'done' : 'active';
          else status = 'pending';

          return (
            <div key={step.key} className={`ai-dialog-step ai-dialog-step--${status}`}>
              {status === 'active'
                ? <span className="ai-dialog-step-spinner" />
                : <span className="ai-dialog-step-icon">{status === 'done' ? '✓' : (i + 1)}</span>
              }
              <span className="ai-dialog-step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
      {downloading && (
        <div className="ai-dialog-download">
          <div className="ai-dialog-download-text">
            Downloading model... {downloadProgress}%
          </div>
          <div className="ai-dialog-progress-track">
            <div
              className="ai-dialog-progress-bar"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <div className="ai-dialog-download-note">
            First time only. Requires 22 GB+ free space.
          </div>
        </div>
      )}
      {isComplete && (
        <div className="ai-dialog-complete">
          {foundFields.length > 0 ? (
            <>
              <div className="ai-dialog-complete-text">Found suggestions for:</div>
              <ul className="ai-dialog-complete-fields">
                {foundFields.map(key => (
                  <li key={key}>{FIELD_LABELS[key]}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="ai-dialog-complete-text">No suggestions found.</div>
          )}
          <div className="ai-dialog-complete-actions">
            {foundFields.length > 0 && onApplyAll && (
              <button type="button" className="ai-dialog-apply-all" onClick={onApplyAll}>
                Apply All
              </button>
            )}
            <button type="button" className="ai-dialog-cancel" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}
      {!isComplete && (
        <button type="button" className="ai-dialog-cancel" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
};

export { STEPS };
export default AiAssistDialog;
