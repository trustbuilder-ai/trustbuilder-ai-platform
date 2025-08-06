import React, { useEffect, useRef, useState, useCallback } from "react";

const ModelOutput = ({ messages, error }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const prevMessageCount = useRef(messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Detect if user has manually scrolled
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      setUserHasScrolled(!isAtBottom);
    }
  }, []);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User hasn't scrolled up manually
    // 2. New messages were added (not a full replacement)
    const messageCountIncreased = messages.length > prevMessageCount.current;
    
    if (!userHasScrolled || messageCountIncreased) {
      scrollToBottom();
    }
    
    prevMessageCount.current = messages.length;
  }, [messages, userHasScrolled]);

  const getMessageTypeStyle = (type) => {
    switch (type) {
      case 'system':
        return 'text-cyan-400';
      case 'model':
      case 'assistant':
        return 'text-green-400';
      case 'user':
        return 'text-yellow-400';
      case 'tool':
      case 'tool_call':
      case 'tool result':
        return 'text-purple-400';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'unknown role':
      default:
        return 'text-gray-400';
    }
  };

  const getMessageLabel = (type) => {
    switch (type) {
      case 'system':
        return '[SYSTEM]';
      case 'model':
      case 'assistant':
        return '[MODEL]';
      case 'user':
        return '[USER]';
      case 'tool':
        return '[TOOL]';
      case 'tool_call':
        return '[TOOL_CALL]';
      case 'tool result':
        return '[TOOL_RESULT]';
      case 'error':
        return '[ERROR]';
      case 'success':
        return '[SUCCESS]';
      case 'unknown role':
        return '[UNKNOWN]';
      default:
        return '[UNKNOWN]';
    }
  };

  return (
    <div className="cyber-card glow-border flex-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-green-400">MODEL OUTPUT</h2>
        <button className="text-gray-400 hover:text-green-400 transition-colors">
          <i data-lucide="maximize-2" className="w-5 h-5"></i>
        </button>
      </div>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="bg-black/50 rounded p-6 min-h-[450px] max-h-[550px] overflow-y-auto font-mono text-sm"
      >
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-400">Error loading messages: {error.message}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">No messages available</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className={getMessageTypeStyle(message.type)}>
                  {getMessageLabel(message.type)}
                </span>
                <p className="text-gray-300">
                  {message.isLoading ? (
                    <span className="inline-flex items-center">
                      {message.text}
                      <span className="ml-2 inline-flex">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse animation-delay-200">.</span>
                        <span className="animate-pulse animation-delay-400">.</span>
                      </span>
                    </span>
                  ) : (
                    message.text
                  )}
                </p>
              </div>
            ))}
            <div className="typing-cursor" ref={messagesEndRef}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelOutput;