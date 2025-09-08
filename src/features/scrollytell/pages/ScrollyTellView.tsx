import React, { useState } from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import ScrollySection from '../components/ScrollySection';
import { useSequentialMessageAnimation } from '../hooks';
import './ScrollyTell.css';

const ScrollyTellView: React.FC = () => {
  const { scrollyTellData, messageTree } = useScrollyTell();
  const { completedMessages, markComplete } = useSequentialMessageAnimation(messageTree.length);

  return (
    <div className="scrollytell-view">
      <div className="scrollytell-container">
        <div className="scrollytell-intro">
          <h1>TrustBuilder ScrollyTell</h1>
          <p className="subtitle">
            Understanding LLM Capabilities, Risks, and Limitations
          </p>
        </div>
        
        <ScrollySection
          sections={scrollyTellData.scrolly_tell_sections}
          messageTree={messageTree}
          onMessageComplete={markComplete}
          completedMessages={completedMessages}
        />
      </div>
    </div>
  );
};

export default ScrollyTellView;