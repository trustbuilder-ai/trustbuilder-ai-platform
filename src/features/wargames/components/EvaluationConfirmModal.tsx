import React, { useEffect } from 'react';
import './EvaluationConfirmModal.css';

const EvaluationConfirmModal = ({ isOpen, onConfirm, onCancel, theme }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="eval-modal-overlay" onClick={onCancel}>
      <div 
        className={`eval-modal-content theme-${theme}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="eval-modal-header">
          <h3>Confirm Evaluation</h3>
          <button 
            className="eval-modal-close" 
            onClick={onCancel}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        
        <div className="eval-modal-body">
          <div className="eval-modal-warning">
            <span className="warning-icon">⚠️</span>
            <p className="warning-text">
              Once an evaluations is run the challenge is ended.
            </p>
          </div>
          <p className="eval-modal-question">
            Are you sure you want to proceed with the evaluation?
          </p>
        </div>
        
        <div className="eval-modal-footer">
          <button 
            className="eval-modal-button eval-modal-cancel" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="eval-modal-button eval-modal-confirm" 
            onClick={onConfirm}
          >
            Proceed with Evaluation
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationConfirmModal;
