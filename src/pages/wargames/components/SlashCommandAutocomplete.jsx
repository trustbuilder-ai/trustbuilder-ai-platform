import React from 'react';
import { formatCommandDisplay } from '../utils/commandDefinitions';
import './SlashCommandAutocomplete.css';

const SlashCommandAutocomplete = ({ 
  suggestions, 
  selectedIndex, 
  onSelect,
  visible 
}) => {
  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="slash-command-autocomplete">
      <div className="autocomplete-header">
        <span className="header-icon">⚡</span>
        <span className="header-text">COMMANDS</span>
      </div>
      <div className="autocomplete-list">
        {suggestions.map((command, index) => (
          <div
            key={command.name}
            className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelect(command)}
            onMouseEnter={(e) => {
              // Update selected index on hover
              const newIndex = suggestions.findIndex(cmd => cmd.name === command.name);
              if (newIndex !== -1) {
                e.currentTarget.parentElement.parentElement
                  .dispatchEvent(new CustomEvent('hover-item', { 
                    detail: { index: newIndex } 
                  }));
              }
            }}
          >
            <div className="command-info">
              <span className="command-name">{formatCommandDisplay(command)}</span>
              <span className="command-description">{command.description}</span>
            </div>
            {index === selectedIndex && (
              <span className="selection-indicator">▶</span>
            )}
          </div>
        ))}
      </div>
      <div className="autocomplete-footer">
        <span className="footer-hint">
          <kbd>↑↓</kbd> Navigate <kbd>Tab</kbd> or <kbd>Enter</kbd> Select <kbd>Esc</kbd> Cancel
        </span>
      </div>
    </div>
  );
};

export default SlashCommandAutocomplete;