import React from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { useApiData } from '../../../shared/hooks/useApiData';
import { getChatTemplateChatTemplatesChatTemplateIdGet } from '../../../backend_client/sdk.gen';
import type { ChatTemplatesPublic, MessageContainer } from '../../../backend_client/types.gen';
import ScrollySection from '../components/ScrollySection';
import './ScrollyTell.css';

const ScrollyTellView: React.FC = () => {
  const { scrollyTellData } = useScrollyTell();

  // Fetch template data using the shared hook pattern
  const templateData = useApiData<ChatTemplatesPublic>(
    getChatTemplateChatTemplatesChatTemplateIdGet,
    {
      enabled: !!scrollyTellData.chat_template_id,
      initialParams: scrollyTellData.chat_template_id ? {
        path: { chat_template_id: scrollyTellData.chat_template_id }
      } : undefined
    }
  );

  const { data, loading, error } = templateData;

  // Extract message tree from template data
  const templateMessageTree = (data?.chat_template?.message_tree as MessageContainer[]) || [];

  if (loading) {
    return (
      <div className="scrollytell-view">
        <div className="scrollytell-container">
          <div className="scrollytell-intro">
            <h1>TrustBuilder ScrollyTell</h1>
            <p className="subtitle">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scrollytell-view">
        <div className="scrollytell-container">
          <div className="scrollytell-intro">
            <h1>TrustBuilder ScrollyTell</h1>
            <p className="subtitle error">
              Error loading template: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          messageTree={templateMessageTree}
        />
      </div>
    </div>
  );
};

export default ScrollyTellView;