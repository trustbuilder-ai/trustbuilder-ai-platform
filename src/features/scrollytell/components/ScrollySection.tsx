import React from 'react';
import { Scrollama, Step } from 'react-scrollama';
import { ScrollyTellSection, MessageContainer, VisualData } from '../types';
import { useScrollProgress } from '../hooks';
import MessageDisplay from './MessageDisplay';
import AnimatedGraph from './AnimatedGraph';
import './ScrollySection.css';

interface ScrollySectionProps {
  sections: ScrollyTellSection[];
  messageTree: MessageContainer[];
  onMessageComplete?: (messageId: number) => void;
  completedMessages: Set<number>;
}

const ScrollySection: React.FC<ScrollySectionProps> = ({
  sections,
  messageTree,
  onMessageComplete,
  completedMessages
}) => {
  const {
    currentStepIndex,
    stepProgress,
    handleStepEnter,
    handleStepProgress,
    handleStepExit
  } = useScrollProgress();

  const getMessagesForSection = (messageIds: number[] | undefined) => {
    if (!messageIds) return [];
    return messageIds.map(id => 
      messageTree.find(msg => msg.id === id)
    ).filter(Boolean) as MessageContainer[];
  };

  const renderSectionContent = (section: ScrollyTellSection, index: number) => {
    const messages = getMessagesForSection(section.message_ids);
    const isActive = currentStepIndex === index;
    
    return (
      <div className="scrolly-content">
        {/* Render messages if present */}
        {messages.length > 0 && (
          <div className="messages-container">
            {messages.map((message, msgIndex) => {
              const previousMessageId = msgIndex > 0 ? messages[msgIndex - 1].id : null;
              const canStart = !previousMessageId || completedMessages.has(previousMessageId);
              
              return (
                <MessageDisplay
                  key={message.id}
                  message={message}
                  progress={isActive ? stepProgress : 0}
                  isActive={isActive}
                  canStart={canStart}
                  onComplete={() => onMessageComplete?.(message.id)}
                />
              );
            })}
          </div>
        )}
        
        {/* Render text/visual data */}
        <div className="section-data">
          {section.data.type === 'markdown' && (
            <div className="markdown-content">
              {section.data.label && <h3>{section.data.label}</h3>}
              <div dangerouslySetInnerHTML={{ __html: section.data.data }} />
            </div>
          )}
          
          {section.data.type === 'html' && (
            <div className="html-content">
              {section.data.label && <h3>{section.data.label}</h3>}
              <div dangerouslySetInnerHTML={{ __html: section.data.data }} />
            </div>
          )}
          
          {section.data.type === 'text' && (
            <div className="text-content">
              {section.data.label && <h3>{section.data.label}</h3>}
              <p>{section.data.data}</p>
            </div>
          )}
          
          {['pie', 'bar', 'line'].includes(section.data.type) && (
            <AnimatedGraph
              data={section.data as VisualData}
              isActive={isActive}
              progress={stepProgress}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="scrolly-section">
      <Scrollama
        offset={0.25}  // Trigger when element is 25% from top (75% up the page)
        onStepEnter={handleStepEnter}
        onStepProgress={handleStepProgress}
        onStepExit={handleStepExit}
        debug={false}
      >
        {sections.map((section, index) => (
          <Step data={{ index, section }} key={index}>
            <div className="scrolly-step">
              {renderSectionContent(section, index)}
            </div>
          </Step>
        ))}
      </Scrollama>
    </div>
  );
};

export default ScrollySection;