import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useApiData } from "../../hooks";
import { auth } from "../../lib/supabase";
import useWargamesScripts from "./hooks/useWargamesScripts";
import useSlashCommands from "./hooks/useSlashCommands";
import GameStatus from "./components/GameStatus";
import ModelOutput from "./components/ModelOutput";
import Options from "./components/options/Options";
import SlashCommandAutocomplete from "./components/SlashCommandAutocomplete";
import EvaluationConfirmModal from "./components/EvaluationConfirmModal";
import ChallengesOverlay from "./components/ChallengesOverlay";
import { parseCommand } from "./utils/commandDefinitions";
import { WargamesProvider, useWargamesContext } from "./context/WargamesContext";
import { 
  addMessageToChallengeChallengesChallengeIdAddMessagePost,
  getCurrentUserInfoUsersMeGet,
  listTournamentsTournamentsGet,
  listChallengesChallengesGet,
  getChallengeContextChallengesChallengeIdContextGet,
  evaluateChallengeContextChallengesChallengeIdEvaluateGet
} from "../../backend_client/sdk.gen";
import "./WargamesChallenge.css";

const WargamesChallengeContent = () => {
  const { session } = useAuth();
  useWargamesScripts(); // Load external dependencies
  
  const [theme, setTheme] = useState(() => 
    localStorage.getItem("wargamesTheme") || "cyberpunk"
  );
  const [userInput, setUserInput] = useState("");
  const [gameStatus, setGameStatus] = useState({
    state: "READY",
    players: 1,
    round: "-",
    score: "0.00"
  });
  const [messages, setMessages] = useState([]);
  const [commandExecuting, setCommandExecuting] = useState(false);
  const [showEvalConfirmModal, setShowEvalConfirmModal] = useState(false);
  const [showChallengesOverlay, setShowChallengesOverlay] = useState(false);
  
  
  // Get context
  const wargamesContext = useWargamesContext();
  
  // Clear state on mount
  useEffect(() => {
    // Clear any existing context state on page load
    wargamesContext.clearState();
    // Also clear any existing messages
    setMessages([]);
  }, []); // Empty dependency array means this runs only once on mount
  
  // Check for active tournaments only (not challenges) on mount
  useEffect(() => {
    const checkActiveTournament = async () => {
      if (!session) return;
      
      try {
        // Get user info to check active tournaments
        const userInfo = await getCurrentUserInfoUsersMeGet({
          requiresAuth: true
        });
        
        if (userInfo.data) {
          // Check for active tournament only - don't auto-resume challenges
          if (userInfo.data.active_tournaments && userInfo.data.active_tournaments.length > 0) {
            const activeTournament = userInfo.data.active_tournaments[0];
            console.log('Found active tournament:', activeTournament);
            wargamesContext.joinTournament(activeTournament.id, activeTournament.name);
          }
        }
      } catch (error) {
        console.error('Error checking active tournament:', error);
      }
    };
    
    checkActiveTournament();
  }, [session]); // Only run when session changes
  
  // Sync evaluation status to game status
  useEffect(() => {
    if (wargamesContext.evaluationStatus) {
      setGameStatus(prev => ({
        ...prev,
        state: wargamesContext.evaluationStatus,
        score: wargamesContext.evaluationStatus === "SUCCEEDED" ? "100.00" : prev.score
      }));
    } else if (wargamesContext.hasActiveChallenge) {
      setGameStatus(prev => ({
        ...prev,
        state: "ACTIVE"
      }));
    } else {
      setGameStatus(prev => ({
        ...prev,
        state: "READY"
      }));
    }
  }, [wargamesContext.evaluationStatus, wargamesContext.hasActiveChallenge]);
  
  // Callback to handle challenge messages
  const handleChallengeMessages = useCallback((existingMessages) => {
    setMessages(prev => [...prev, ...existingMessages]);
  }, []);
  
  // Initialize slash commands hook with context
  const {
    suggestions,
    selectedIndex,
    showAutocomplete,
    isExecuting,
    handleInputChange,
    handleKeyDown,
    executeCommand,
    resetAutocomplete
  } = useSlashCommands(session, wargamesContext, handleChallengeMessages);

  // Determine messages based on authentication state
  const getDisplayMessages = () => {
    if (!session && messages.length === 0) {
      return [{ type: "system", text: "User not authenticated. Unable to proceed." }];
    }
    return messages;
  };
  
  // Get dynamic placeholder text
  const getPlaceholderText = () => {
    if (!session) {
      return "Please log in to continue...";
    }
    if (!wargamesContext.hasTournament) {
      return "Type /help to get started or /list-tournaments to see available tournaments";
    }
    if (!wargamesContext.hasActiveChallenge) {
      return "Type /list-challenges to see available challenges";
    }
    if (!wargamesContext.canContribute) {
      return "This challenge is complete. Type / for commands";
    }
    return "Send a message to the challenge agent... (Type / for commands)";
  };
  
  // State for JOIN GAME authentication
  const [playerEmail, setPlayerEmail] = useState("");
  const [joinGameLoading, setJoinGameLoading] = useState(false);
  const [joinGameError, setJoinGameError] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  // Load theme CSS
  useEffect(() => {
    // Remove all existing wargames theme links
    const existingThemes = document.querySelectorAll('link[data-wargames-theme]');
    existingThemes.forEach(link => link.remove());

    // Create and add new theme link
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `/src/pages/wargames/themes/${theme}.css`;
    themeLink.setAttribute('data-wargames-theme', theme);
    
    // Add to head
    document.head.appendChild(themeLink);
    
    // Save preference
    localStorage.setItem("wargamesTheme", theme);
    
    // Cleanup function to remove theme on unmount
    return () => {
      const linkToRemove = document.querySelector(`link[data-wargames-theme="${theme}"]`);
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [theme]);


  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    // Check if it's a command
    if (trimmedInput.startsWith('/')) {
      const { isValid } = parseCommand(trimmedInput);
      
      if (!isValid && !showAutocomplete) {
        setMessages(prev => [...prev, {
          type: 'error',
          text: `Invalid command: ${trimmedInput}. Type /help for available commands.`
        }]);
        setUserInput("");
        return;
      }
      
      // Execute the command
      setCommandExecuting(true);
      setUserInput("");
      
      // Add user's command to messages
      setMessages(prev => [...prev, {
        type: 'user',
        text: trimmedInput
      }]);
      
      await executeCommand(trimmedInput, (results) => {
        setMessages(prev => [...prev, ...results]);
      });
      
      setCommandExecuting(false);
    } else {
      // Regular message - send to active challenge
      if (!session) {
        setMessages(prev => [...prev, {
          type: 'error',
          text: 'You must be logged in to send messages.'
        }]);
        return;
      }
      
      if (!wargamesContext.hasActiveChallenge) {
        console.log('Context state:', {
          hasActiveChallenge: wargamesContext.hasActiveChallenge,
          activeChallengeId: wargamesContext.activeChallengeId,
          challengeName: wargamesContext.challengeName
        });
        // Show user's message first, then the error
        setMessages(prev => [...prev, 
          {
            type: 'user',
            text: trimmedInput
          },
          {
            type: 'error',
            text: 'No active challenge. Use /start-challenge <id> to begin a challenge.'
          }
        ]);
        setUserInput("");
        return;
      }
      
      // Check if challenge can accept messages
      if (!wargamesContext.canContribute) {
        // Show user's message first, then the error
        setMessages(prev => [...prev, 
          {
            type: 'user',
            text: trimmedInput
          },
          {
            type: 'error',
            text: 'This challenge has been completed and cannot accept new messages.'
          }
        ]);
        setUserInput("");
        return;
      }
      
      // Add user message with optimistic update
      setMessages(prev => [...prev, {
        type: 'user',
        text: trimmedInput
      }]);
      
      // Add loading indicator
      setMessages(prev => [...prev, {
        type: 'system',
        text: '⏳ Processing...',
        isLoading: true
      }]);
      
      setUserInput("");
      setCommandExecuting(true);
      
      try {
        // Send message to the active challenge
        const response = await addMessageToChallengeChallengesChallengeIdAddMessagePost({
          path: {
            challenge_id: wargamesContext.activeChallengeId
          },
          query: {
            message: trimmedInput,
            role: 'user',
            solicit_llm_response: true
          },
          requiresAuth: true
        });
        
        if (response.data) {
          // Remove loading indicator
          setMessages(prev => prev.filter(msg => !msg.isLoading));
          
          // Get scroll position before updating
          const scrollContainer = document.querySelector('.bg-black\\/50.overflow-y-auto');
          const scrollPosition = scrollContainer?.scrollTop;
          const wasAtBottom = scrollContainer 
            ? scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 100
            : true;
          
          // Append only new messages from the LLM response
          if (response.data.messages && response.data.messages.length > 0) {
            const newMessages = response.data.messages.map(msg => ({
              type: msg.role,
              text: msg.content
            }));
            setMessages(prev => [...prev, ...newMessages]);
          }
          
          // Update remaining message count in context
          if (response.data.remaining_message_count !== undefined) {
            wargamesContext.setRemainingMessageCount(response.data.remaining_message_count);
          }
          
          // Restore scroll position after React re-renders
          setTimeout(() => {
            if (wasAtBottom && scrollContainer) {
              // If user was at bottom, scroll to new bottom
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            } else if (scrollPosition && scrollContainer) {
              // Otherwise preserve their position
              scrollContainer.scrollTop = scrollPosition;
            }
          }, 50);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Remove loading indicator and add error message
        setMessages(prev => [
          ...prev.filter(msg => !msg.isLoading),
          {
            type: 'error',
            text: `Failed to send message: ${error.message || 'Unknown error'}`
          }
        ]);
      } finally {
        setCommandExecuting(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    // Handle slash command autocomplete navigation
    const commandResult = handleKeyDown(e);
    
    if (commandResult === true) {
      // Event was handled by autocomplete
      return;
    } else if (commandResult && typeof commandResult === 'object') {
      // A command was selected
      e.preventDefault();
      setUserInput(commandResult.name + ' ');
      resetAutocomplete();
      return;
    }
    
    // Handle regular enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle input changes
  const handleInputChangeWithCommands = (e) => {
    const value = e.target.value;
    setUserInput(value);
    handleInputChange(value);
  };
  
  // Handle autocomplete selection
  const handleAutocompleteSelect = (command) => {
    setUserInput(command.name + ' ');
    resetAutocomplete();
    // Focus back on the textarea
    document.querySelector('.cyber-input')?.focus();
  };
  
  // Email validation regex
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleJoinSession = async () => {
    // Reset error
    setJoinGameError("");
    
    // Check if email is empty
    if (!playerEmail.trim()) {
      setJoinGameError("Please enter an email address");
      return;
    }
    
    // Validate email format
    if (!isValidEmail(playerEmail)) {
      setJoinGameError("Please enter a valid email address");
      return;
    }
    
    setJoinGameLoading(true);
    
    try {
      const { error } = await auth.signInWithOtp(playerEmail);
      
      if (error) throw error;
      
      // Successfully sent OTP
      setOtpMessage("Check your email for the 6-digit code!");
      setShowOtpInput(true);
    } catch (error) {
      setJoinGameError(error.message || "Failed to send verification code");
    } finally {
      setJoinGameLoading(false);
    }
  };
  
  const handleOtpVerification = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setJoinGameError("Please enter a 6-digit code");
      return;
    }
    
    setJoinGameLoading(true);
    setJoinGameError("");
    
    try {
      const { error } = await auth.verifyOtp(playerEmail, otp);
      
      if (error) throw error;
      
      // Successfully verified - user is now logged in
      setOtpMessage("Successfully logged in!");
      // Reset states
      setTimeout(() => {
        setShowOtpInput(false);
        setOtp("");
        setPlayerEmail("");
        setOtpMessage("");
      }, 1500);
    } catch (error) {
      setJoinGameError(error.message || "Invalid code. Please try again.");
    } finally {
      setJoinGameLoading(false);
    }
  };
  
  // Handle evaluation - show confirmation modal
  const handleEvaluate = () => {
    if (!session) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: 'You must be logged in to run evaluations.'
      }]);
      return;
    }
    
    if (!wargamesContext.hasActiveChallenge) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: 'No active challenge. Start a challenge first to run evaluation.'
      }]);
      return;
    }
    
    // Show confirmation modal
    setShowEvalConfirmModal(true);
  };
  
  // Handle challenge selection from overlay
  const handleChallengeSelect = useCallback(async (challengeId, challengeName, challengeDescription) => {
    console.log('Challenge selected from overlay:', challengeId, challengeName);
    
    // Initialize messages array to control order
    const messagesToDisplay = [];
    
    // Add SUCCESS message first
    messagesToDisplay.push({
      type: 'success',
      text: `Started challenge: ${challengeName}`
    });
    
    // Add CHALLENGE description if available
    if (challengeDescription) {
      messagesToDisplay.push({
        type: 'system',
        text: `[CHALLENGE]: ${challengeDescription}`
      });
    }
    
    // Fetch existing challenge messages
    try {
      const contextResponse = await getChallengeContextChallengesChallengeIdContextGet({
        path: {
          challenge_id: challengeId
        },
        requiresAuth: true
      });
      
      if (contextResponse.data) {
        // Update canContribute status
        const canContribute = contextResponse.data.user_challenge_context?.can_contribute ?? true;
        
        // Update remaining message count
        if (contextResponse.data.remaining_message_count !== undefined) {
          wargamesContext.setRemainingMessageCount(contextResponse.data.remaining_message_count);
        }
        
        // Process eval_result
        if (contextResponse.data.eval_result) {
          const evalResult = contextResponse.data.eval_result;
          wargamesContext.setEvaluationStatus(evalResult.status);
          
          // Add evaluation messages for non-terminal states
          if (evalResult.status === 'NOT_EVALUATED') {
            messagesToDisplay.push({
              type: 'system',
              text: 'Challenge has not been evaluated yet.'
            });
          } else if (!['SUCCEEDED', 'FAILED', 'ERRORED'].includes(evalResult.status)) {
            messagesToDisplay.push({
              type: 'system',
              text: `Evaluation Status: ${evalResult.status}`
            });
          }
          
          // Add reason if provided
          if (evalResult.reason) {
            messagesToDisplay.push({
              type: 'system',
              text: `Reason: ${evalResult.reason}`
            });
          }
        }
        
        if (contextResponse.data.messages && contextResponse.data.messages.length > 0) {
          console.log('Found existing messages:', contextResponse.data.messages.length);
          // Filter out system messages from the context endpoint
          // Only include user and assistant messages
          const existingMessages = contextResponse.data.messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
              type: msg.role,
              text: msg.content
            }));
          messagesToDisplay.push(...existingMessages);
        }
        
        // Add completion message if challenge is complete
        if (!canContribute) {
          messagesToDisplay.push({
            type: 'system',
            text: 'This challenge has been completed and cannot accept new messages.'
          });
        }
      }
    } catch (err) {
      console.error('Error fetching challenge context:', err);
    }
    
    // Set all messages at once in the correct order
    setMessages(messagesToDisplay);
  }, [wargamesContext]);
  
  // Confirm evaluation and actually run it
  const confirmEvaluation = async () => {
    setShowEvalConfirmModal(false);
    
    setMessages(prev => [...prev, {
      type: 'system',
      text: 'Running evaluation...'
    }]);
    
    try {
      const response = await evaluateChallengeContextChallengesChallengeIdEvaluateGet({
        path: {
          challenge_id: wargamesContext.activeChallengeId
        },
        requiresAuth: true
      });
      
      if (response.data) {
        console.log('Evaluation response:', response.data);
        
        // Display evaluation results based on EvalResult type
        const messages = [];
        
        messages.push({
          type: 'system',
          text: '=== EVALUATION RESULTS ==='
        });
        
        // Handle the EvalResult response
        const evalResult = response.data;
        
        // Update evaluation status in context
        wargamesContext.setEvaluationStatus(evalResult.status);
        
        // Display status
        switch (evalResult.status) {
          case 'SUCCEEDED':
            messages.push({
              type: 'success',
              text: '✓ Challenge Evaluation: SUCCEEDED'
            });
            break;
          case 'FAILED':
            messages.push({
              type: 'error',
              text: '✗ Challenge Evaluation: FAILED'
            });
            break;
          case 'ERRORED':
            messages.push({
              type: 'error',
              text: '⚠️ Challenge Evaluation: ERRORED'
            });
            break;
          case 'NOT_EVALUATED':
            messages.push({
              type: 'system',
              text: 'Challenge has not been evaluated yet.'
            });
            break;
          default:
            messages.push({
              type: 'system',
              text: `Evaluation Status: ${evalResult.status}`
            });
        }
        
        // Display reason if provided
        if (evalResult.reason) {
          messages.push({
            type: 'system',
            text: `Reason: ${evalResult.reason}`
          });
        }
        
        // Check if challenge is complete after evaluation (if status is SUCCEEDED)
        if (evalResult.status === 'SUCCEEDED' && wargamesContext.canContribute) {
          // Challenge might be completed now, update the context
          messages.push({
            type: 'system',
            text: 'Challenge completed successfully! 🎉'
          });
          
          // We should fetch the updated context to confirm the challenge state
          try {
            const contextResponse = await getChallengeContextChallengesChallengeIdContextGet({
              path: {
                challenge_id: wargamesContext.activeChallengeId
              },
              requiresAuth: true
            });
            
            if (contextResponse.data?.user_challenge_context) {
              const canContribute = contextResponse.data.user_challenge_context.can_contribute;
              if (canContribute !== wargamesContext.canContribute) {
                wargamesContext.startChallenge(
                  wargamesContext.activeChallengeId,
                  wargamesContext.challengeName,
                  canContribute
                );
              }
            }
          } catch (err) {
            console.error('Error fetching updated context:', err);
          }
        }
        
        setMessages(prev => [...prev, ...messages]);
      } else {
        console.log('No response data from evaluation');
        setMessages(prev => [...prev, {
          type: 'error',
          text: 'No response from evaluation endpoint.'
        }]);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        text: `Failed to run evaluation: ${error.message || 'Unknown error'}`
      }]);
    }
  };

  return (
    <div className="wargames-challenge-container cyber-grid">
      {/* Wargames Header */}
      <header className="wargames-header fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                WARGAMES-AI
              </h1>
              <span className="text-xs text-gray-500 uppercase">TrustBuilder</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="https://trb.ai.localhost" className="text-sm text-gray-400 hover:text-green-400 transition-colors">
                ← Back to Landing
              </Link>
              <span className="text-sm text-gray-400">Connected to: wargames-ai.trb.ai</span>
              <div className="w-2 h-2 bg-green-400 rounded-full pulse-glow"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-8 pt-20 pb-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Model Output & User Input */}
          <div className="flex-1 flex flex-col gap-10">
            <ModelOutput 
              messages={getDisplayMessages()} 
              loading={commandExecuting}
              error={null}
            />
            
            {/* User Input */}
            <div className="cyber-card glow-border-accent">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-cyan-400">USER INPUT</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Tokens: {userInput.length}/4096</span>
                </div>
              </div>
              <div className="space-y-4 relative">
                <SlashCommandAutocomplete
                  suggestions={suggestions}
                  selectedIndex={selectedIndex}
                  onSelect={handleAutocompleteSelect}
                  visible={showAutocomplete}
                />
                <textarea
                  className="cyber-input w-full h-36 resize-none"
                  placeholder={getPlaceholderText()}
                  value={userInput}
                  onChange={handleInputChangeWithCommands}
                  onKeyDown={handleKeyPress}
                  disabled={commandExecuting}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button className="option-button">
                      <i data-lucide="paperclip" className="w-4 h-4"></i>
                    </button>
                    <button className="option-button">
                      <i data-lucide="mic" className="w-4 h-4"></i>
                    </button>
                  </div>
                  <button 
                    className="cyber-button flex items-center space-x-2"
                    onClick={handleSendMessage}
                    disabled={commandExecuting || !userInput.trim()}
                  >
                    <i data-lucide="send" className="w-4 h-4"></i>
                    <span>{commandExecuting ? 'EXECUTING...' : 'EXECUTE'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Options & Game Status */}
          <div className="w-full lg:w-96 space-y-10">
            <Options
              session={session}
              theme={theme}
              onThemeChange={setTheme}
              playerEmail={playerEmail}
              setPlayerEmail={setPlayerEmail}
              showOtpInput={showOtpInput}
              otp={otp}
              setOtp={setOtp}
              joinGameLoading={joinGameLoading}
              joinGameError={joinGameError}
              setJoinGameError={setJoinGameError}
              otpMessage={otpMessage}
              handleJoinSession={handleJoinSession}
              handleOtpVerification={handleOtpVerification}
              setShowOtpInput={setShowOtpInput}
              setOtpMessage={setOtpMessage}
              onChallengesClick={() => setShowChallengesOverlay(true)}
              onModeChange={(mode) => console.log('Mode changed to:', mode)}
              onRunEval={handleEvaluate}
              onViewResults={handleEvaluate}
            />

            <GameStatus status={gameStatus} remainingMessageCount={wargamesContext.remainingMessageCount} />
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-gray-800">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between h-12 text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">Model: GPT-4</span>
              {wargamesContext.hasTournament && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-cyan-400">Tournament: {wargamesContext.tournamentName}</span>
                </>
              )}
              {wargamesContext.hasActiveChallenge && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-green-400">Challenge: {wargamesContext.challengeName}</span>
                </>
              )}
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Latency: 42ms</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">Requests: 127</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-green-400">● ONLINE</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Evaluation Confirmation Modal */}
      <EvaluationConfirmModal
        isOpen={showEvalConfirmModal}
        onConfirm={confirmEvaluation}
        onCancel={() => setShowEvalConfirmModal(false)}
        theme={theme}
      />
      
      {/* Challenges Overlay */}
      <ChallengesOverlay
        isOpen={showChallengesOverlay}
        onClose={() => setShowChallengesOverlay(false)}
        theme={theme}
        wargamesContext={wargamesContext}
        onSelectChallenge={handleChallengeSelect}
      />

    </div>
  );
};

// Main component with context provider
const WargamesChallenge = () => {
  return (
    <WargamesProvider>
      <WargamesChallengeContent />
    </WargamesProvider>
  );
};

export default WargamesChallenge;
