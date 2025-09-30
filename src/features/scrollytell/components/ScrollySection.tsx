import React from 'react';
import { ScrollyTellSection, MessageContainer, VisualData } from '../types';
import MessageDisplay from './MessageDisplay';
import AnimatedGraph from './AnimatedGraph';
import './ScrollySection.css';

interface ScrollySectionProps {
  sections: ScrollyTellSection[];
  messageTree: MessageContainer[];
}

const ScrollySection: React.FC<ScrollySectionProps> = ({
  sections,
  messageTree,
}) => {
  const getMessagesForSection = (messageIds: number[] | undefined) => {
    if (!messageIds) return [];
    return messageIds.map(id =>
      messageTree.find(msg => msg.id_in_tree === id)
    ).filter(Boolean) as MessageContainer[];
  };

  const renderSectionContent = (section: ScrollyTellSection, index: number) => {
    const messages = getMessagesForSection(section.message_ids);

    return (
      <div className="scrolly-content">
        {/* Render messages if present */}
        {messages.length > 0 && (
          <div className="messages-container">
            {messages.map((message) => (
              <MessageDisplay
                key={message.id_in_tree}
                message={message}
              />
            ))}
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
              isActive={true}
              progress={1}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="scrolly-section">
      {sections.map((section, index) => (
        <div className="scrolly-step" key={index}>
          {renderSectionContent(section, index)}
        </div>
      ))}
    </div>
  );
};

export default ScrollySection;