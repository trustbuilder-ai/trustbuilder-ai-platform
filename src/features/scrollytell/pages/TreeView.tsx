import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Button, AlertDialog, Callout, TextField, IconButton, Card, Badge, Text, Box } from '@radix-ui/themes';
import { InfoCircledIcon, EnterFullScreenIcon, ExitFullScreenIcon, MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useUserContext, useEvaluation } from '../hooks';
import { deleteChatContextChatContextsChatContextIdDelete } from '../../../backend_client/sdk.gen';
import type { MessageContainer } from '../../../backend_client/types.gen';
import { calculateTreeLayout, calculateBoundingBox } from '../utils/treeLayout';
import TreeConnections from '../components/TreeConnections';
import LLMUIMessage from '../components/LLMUIMessage';
import TreeNodeTabs from '../components/TreeNodeTabs';
import './ScrollyTell.css';

const TreeView: React.FC = () => {
  const {
    currentChatLeafId,
    setCurrentChatLeafId,
    setCurrentView
  } = useScrollyTell();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Theater mode state
  const [theaterMode, setTheaterMode] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageContainer[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Search refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Use shared context hook
  const {
    contextData,
    loading,
    error,
    refetch,
    userMessageTree,
    setUserMessageTree,
    setContextId
  } = useUserContext();

  // Use shared message tree (already extracted by useUserContext)
  const messageTree = userMessageTree || [];

  // Use shared evaluation hook
  const { evalResults, evaluatingNodes, evaluateMessage } = useEvaluation(contextData?.chat_context?.id);

  // Calculate layout once when messageTree changes
  const layout = useMemo(() => calculateTreeLayout(messageTree), [messageTree]);

  // Get dimensions for container
  const { width, height } = useMemo(() => calculateBoundingBox(layout), [layout]);

  // Refs for scrolling
  const activeNodeRef = useRef<HTMLDivElement>(null);
  const treeVisualizationRef = useRef<HTMLDivElement>(null);

  // Read messageId from URL parameter and update currentChatLeafId if present
  useEffect(() => {
    const messageIdParam = searchParams.get('messageId');
    if (messageIdParam) {
      const messageId = parseInt(messageIdParam, 10);
      if (!isNaN(messageId) && messageId !== currentChatLeafId) {
        console.log('[TreeView] Setting currentChatLeafId from URL:', messageId);
        setCurrentChatLeafId(messageId);
      }
    }
  }, [searchParams, setCurrentChatLeafId]); // Only run when URL changes, not on currentChatLeafId change

  // Auto-scroll to active node on mount or when currentChatLeafId changes
  useEffect(() => {
    // Check that we have a valid node in the layout before attempting to scroll
    const nodePosition = layout.get(currentChatLeafId);
    if (!nodePosition) {
      console.log('[TreeView] Node not found in layout, skipping auto-scroll:', currentChatLeafId);
      return;
    }

    if (activeNodeRef.current && treeVisualizationRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        const node = activeNodeRef.current;
        const container = treeVisualizationRef.current;

        if (node && container) {
          // Get node position (it's absolute positioned)
          const nodeRect = node.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          // Calculate the center position
          const scrollLeft = node.offsetLeft - (container.clientWidth / 2) + (nodeRect.width / 2);
          const scrollTop = node.offsetTop - (container.clientHeight / 2) + (nodeRect.height / 2);

          console.log('[TreeView] Auto-scrolling to node:', {
            nodeId: currentChatLeafId,
            scrollLeft,
            scrollTop
          });

          // Smooth scroll to center the node
          container.scrollTo({
            left: scrollLeft,
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      }, 200);
    }
  }, [currentChatLeafId, layout]);

  // Handle chat navigation
  const handleChatClick = (messageId: number) => {
    setCurrentChatLeafId(messageId);
    setCurrentView('chat');
    navigate('/scrollytell/chat');
  };

  // Handle reset conversation
  const handleResetConversation = async () => {
    if (!contextData?.chat_context?.id) return;

    console.log('[TreeView] Reset starting:', {
      contextId: contextData.chat_context.id,
      contextIdType: typeof contextData.chat_context.id,
      fullContext: contextData.chat_context
    });

    setIsResetting(true);
    setResetError(null);

    try {
      // Delete the current context
      await deleteChatContextChatContextsChatContextIdDelete({
        path: { chat_context_id: contextData.chat_context.id },
        throwOnError: true,
      });

      // Clear shared state immediately to reflect reset
      setUserMessageTree(null);
      setContextId(null);

      // Refetch to create a fresh context with template defaults
      // useUserContext will update the shared state when new data arrives
      refetch();
    } catch (err) {
      // Show actual error details from backend
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'error' in err
        ? String((err as any).error)
        : 'Failed to reset conversation';
      setResetError(errorMessage);
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Search messages function
  const searchMessages = (query: string, messages: MessageContainer[]): MessageContainer[] => {
    if (!query.trim()) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    const matches = messages.filter(container => {
      const content = container.message.content.toLowerCase();
      // All terms must appear as substrings (non-contiguous)
      return terms.every(term => content.includes(term));
    });

    // Return top 10 results
    return matches.slice(0, 10);
  };

  // Update search results when query changes
  useEffect(() => {
    const results = searchMessages(searchQuery, messageTree);
    setSearchResults(results);
    setSelectedResultIndex(0); // Reset selection
  }, [searchQuery, messageTree]);

  // Keyboard navigation handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedResultIndex]) {
          setCurrentChatLeafId(searchResults[selectedResultIndex].id_in_tree);
          setIsSearchOpen(false);
          setSearchQuery('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Auto-scroll dropdown to keep selected item visible
  useEffect(() => {
    if (searchDropdownRef.current && selectedResultIndex >= 0 && searchResults.length > 0) {
      const selectedElement = searchDropdownRef.current.children[selectedResultIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedResultIndex, searchResults.length]);

  // Search term highlighting helper
  const highlightSearchTerms = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const lowerText = text.toLowerCase();

    // Find all term positions
    const positions: Array<{start: number, end: number}> = [];
    terms.forEach(term => {
      let idx = 0;
      while ((idx = lowerText.indexOf(term, idx)) !== -1) {
        positions.push({ start: idx, end: idx + term.length });
        idx += term.length;
      }
    });

    // Sort and merge overlapping positions
    positions.sort((a, b) => a.start - b.start);
    const merged: typeof positions = [];
    positions.forEach(pos => {
      if (merged.length === 0 || pos.start > merged[merged.length - 1].end) {
        merged.push(pos);
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, pos.end);
      }
    });

    // Build highlighted text
    let result: React.ReactNode[] = [];
    let lastIndex = 0;
    merged.forEach((pos, i) => {
      result.push(text.slice(lastIndex, pos.start));
      result.push(
        <Text key={i} weight="bold" style={{ backgroundColor: 'var(--yellow-3)' }}>
          {text.slice(pos.start, pos.end)}
        </Text>
      );
      lastIndex = pos.end;
    });
    result.push(text.slice(lastIndex));

    return result;
  };

  // Auth gate
  if (!session) {
    return (
      <div className="tree-view">
        <div className="view-container">
          <h2>Tree View</h2>
          <p className="view-description">
            Please sign in to view and edit your personal message tree.
          </p>
          <div className="auth-gate">
            <p>This view requires authentication to load your personal conversation history.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tree-view">
        <div className="view-container">
          <h2>Tree View</h2>
          <p className="view-description">Loading your conversation tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tree-view">
        <div className="view-container">
          <h2>Tree View</h2>
          <p className="view-description error">
            Error loading your context: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-view" data-theater-mode={theaterMode}>
      <div className="view-container">
        {/* Header with Search, Theater Mode and Reset buttons */}
        <Flex justify="between" align="center" mb="2">
          <h2>Tree View</h2>

          {/* Search Input */}
          <Box style={{ position: 'relative', flex: 1, maxWidth: '400px', marginLeft: '2rem', marginRight: '2rem' }}>
            <TextField.Root
              ref={searchInputRef}
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(e.target.value.trim().length > 0);
              }}
              onKeyDown={handleSearchKeyDown}
              size="2"
            >
              <TextField.Slot>
                <MagnifyingGlassIcon />
              </TextField.Slot>
              {searchQuery && (
                <TextField.Slot>
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                  >
                    <Cross2Icon />
                  </IconButton>
                </TextField.Slot>
              )}
            </TextField.Root>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <Card
                ref={searchDropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 1000,
                }}
              >
                {searchResults.map((container, index) => (
                  <Box
                    key={container.id_in_tree}
                    p="2"
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--gray-4)',
                      backgroundColor: index === selectedResultIndex ? 'var(--purple-3)' : 'transparent',
                    }}
                    onClick={() => {
                      setCurrentChatLeafId(container.id_in_tree);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    onMouseEnter={() => setSelectedResultIndex(index)}
                    className="search-result-item"
                  >
                    <Flex justify="between" mb="1">
                      <Text size="1" weight="bold" color="purple">
                        #{container.id_in_tree}
                      </Text>
                      <Badge size="1" variant="soft">
                        {container.message.role}
                      </Badge>
                    </Flex>
                    <Text size="2" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {highlightSearchTerms(container.message.content, searchQuery)}
                    </Text>
                  </Box>
                ))}
              </Card>
            )}

            {/* No results message */}
            {isSearchOpen && searchQuery.trim() && searchResults.length === 0 && (
              <Card style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                zIndex: 1000,
              }}>
                <Box p="3">
                  <Text size="2" color="gray">No messages found</Text>
                </Box>
              </Card>
            )}
          </Box>

          <Flex gap="2">
            <Button
              variant="soft"
              onClick={() => setTheaterMode(!theaterMode)}
            >
              {theaterMode ? <ExitFullScreenIcon /> : <EnterFullScreenIcon />}
              {theaterMode ? 'Exit Theater' : 'Theater Mode'}
            </Button>
            <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button
                color="red"
                variant="soft"
                disabled={isResetting || loading}
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="450px">
              <AlertDialog.Title>Reset Conversation Tree?</AlertDialog.Title>
              <AlertDialog.Description size="2">
                This will delete your entire conversation history and reset to the default template state.
                This action cannot be undone.
              </AlertDialog.Description>

              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button
                    variant="solid"
                    color="red"
                    onClick={handleResetConversation}
                  >
                    Reset
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
          </Flex>
        </Flex>

        <p className="view-description">
          Visualizes the entire MessageTree structure with branching conversations.
        </p>

        {/* Error message if reset fails */}
        {resetError && (
          <Callout.Root color="red" mb="3">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Failed to reset: {resetError}
            </Callout.Text>
          </Callout.Root>
        )}

        <div className="tree-visualization" ref={treeVisualizationRef}>
          <div className="tree-canvas" style={{ width, height, position: 'relative' }}>
            {/* SVG layer for connections */}
            <TreeConnections layout={layout} currentLeafId={currentChatLeafId} />

            {/* Nodes positioned absolutely */}
            {messageTree.map(container => {
              const position = layout.get(container.id_in_tree);
              if (!position) return null;

              const isActive = container.id_in_tree === currentChatLeafId;
              const isSearchMatch = searchResults.some(r => r.id_in_tree === container.id_in_tree);

              return (
                <div
                  key={container.id_in_tree}
                  ref={isActive ? activeNodeRef : null}
                  className={`tree-node ${isActive ? 'active' : ''} ${isSearchMatch ? 'search-match' : ''}`}
                  style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    width: position.width
                  }}
                  onClick={() => setCurrentChatLeafId(container.id_in_tree)}
                >
                  <div className="tree-node-header">
                    <span className="node-id">#{container.id_in_tree}</span>
                  </div>
                  <div className="tree-node-content">
                    <LLMUIMessage
                      message={container}
                      truncate={true}
                      maxLength={50}
                      showActions={false}
                    />
                  </div>
                  <TreeNodeTabs
                    message={container}
                    onEvaluate={evaluateMessage}
                    onChatClick={handleChatClick}
                    evalResult={evalResults[container.id_in_tree]}
                    isEvaluating={evaluatingNodes.has(container.id_in_tree)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="tree-info">
          <p>Total messages: {messageTree.length}</p>
          <p>Current selection: Message #{currentChatLeafId}</p>
          <p>Click on any message to update the current chat path</p>
        </div>
      </div>
    </div>
  );
};

export default TreeView;