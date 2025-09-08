import React from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import './ScrollyTell.css';

const ScrollyTellView: React.FC = () => {
  const { scrollyTellData, messageTree, currentChatLeafId } = useScrollyTell();

  return (
    <div className="scrollytell-view">
      <div className="view-container">
        <h2>ScrollyTell View</h2>
        <p className="view-description">
          This view will display LLM messages interleaved with text and animated graphs in a scrollytelling format.
        </p>
        
        <div className="data-info">
          <div className="info-card">
            <h3>Message Tree</h3>
            <p>{messageTree.length} messages loaded</p>
            <p>Current leaf ID: {currentChatLeafId}</p>
          </div>
          
          <div className="info-card">
            <h3>ScrollyTell Sections</h3>
            <p>{scrollyTellData.scrolly_tell_sections.length} sections configured</p>
            <ul>
              {scrollyTellData.scrolly_tell_sections.map((section, index) => (
                <li key={index}>
                  Section {index + 1}: {section.data.type} 
                  {section.message_ids && ` (${section.message_ids.length} messages)`}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="placeholder-content">
          <p>🚧 ScrollyTell implementation coming in Phase 2</p>
        </div>
      </div>
    </div>
  );
};

export default ScrollyTellView;