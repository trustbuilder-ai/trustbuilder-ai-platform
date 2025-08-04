import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  parseCommand, 
  getCommandSuggestions, 
  generateHelpText,
  COMMAND_TYPES 
} from '../utils/commandDefinitions';
import {
  listTournamentsTournamentsGet,
  joinTournamentTournamentsTournamentIdJoinPost,
  startChallengeChallengesChallengeIdStartPost,
  listChallengesChallengesGet,
  getCurrentUserInfoUsersMeGet,
  getChallengeContextChallengesChallengeIdContextGet
} from '../../../backend_client/sdk.gen';

/**
 * Custom hook for managing slash commands in the Wargames interface
 */
export default function useSlashCommands(session, wargamesContext, onChallengeMessages) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const inputRef = useRef(null);

  // Handle input changes to detect slash commands
  const handleInputChange = useCallback((value) => {
    // Check if input starts with '/' and we're at the beginning of a command
    if (value.startsWith('/') && !value.includes('\n')) {
      const suggestions = getCommandSuggestions(value);
      setSuggestions(suggestions);
      setShowAutocomplete(suggestions.length > 0);
      setSelectedIndex(0);
    } else {
      setShowAutocomplete(false);
      setSuggestions([]);
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showAutocomplete) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        return true;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : 0);
        return true;
        
      case 'Tab':
      case 'Enter':
        if (showAutocomplete && suggestions.length > 0) {
          e.preventDefault();
          const selected = suggestions[selectedIndex];
          return selected;
        }
        return false;
        
      case 'Escape':
        e.preventDefault();
        setShowAutocomplete(false);
        return true;
        
      default:
        return false;
    }
  }, [showAutocomplete, suggestions, selectedIndex]);

  // Execute a command
  const executeCommand = useCallback(async (input, onResult) => {
    const { command, commandDef, args, isValid } = parseCommand(input);
    
    if (!isValid) {
      onResult([{
        type: 'error',
        text: `Invalid command: ${command || input}`
      }]);
      return;
    }

    // Add to history
    setCommandHistory(prev => [...prev, input]);
    setIsExecuting(true);

    try {
      let results = [];
      
      switch (commandDef.type) {
        case COMMAND_TYPES.HELP:
          results = generateHelpText();
          break;
          
        case COMMAND_TYPES.LIST_TOURNAMENTS:
          if (!session) {
            results = [{
              type: 'error',
              text: 'You must be logged in to list tournaments'
            }];
            break;
          }
          
          const tournamentsResponse = await listTournamentsTournamentsGet({
            requiresAuth: true
          });
          
          if (tournamentsResponse.data) {
            results = [
              {
                type: 'system',
                text: '=== AVAILABLE TOURNAMENTS ==='
              },
              ...tournamentsResponse.data.map(tournament => ({
                type: 'system',
                text: `[${tournament.id}] ${tournament.name} - ${tournament.description || 'No description'}`
              }))
            ];
            
            if (tournamentsResponse.data.length === 0) {
              results.push({
                type: 'system',
                text: 'No tournaments available at this time.'
              });
            }
          }
          break;
          
        case COMMAND_TYPES.JOIN_TOURNAMENT:
          if (!session) {
            results = [{
              type: 'error',
              text: 'You must be logged in to join tournaments'
            }];
            break;
          }
          
          const tournamentId = parseInt(args[0]);
          if (isNaN(tournamentId)) {
            results = [{
              type: 'error',
              text: 'Invalid tournament ID. Please provide a number.'
            }];
            break;
          }
          
          const joinResponse = await joinTournamentTournamentsTournamentIdJoinPost({
            path: {
              tournament_id: tournamentId
            },
            requiresAuth: true
          });
          
          if (joinResponse.data) {
            // Get tournament details to store the name
            const tournamentsResponse = await listTournamentsTournamentsGet({
              requiresAuth: true
            });
            
            const tournament = tournamentsResponse.data?.find(t => t.id === tournamentId);
            const tournamentName = tournament?.name || `Tournament ${tournamentId}`;
            
            // Update context
            wargamesContext.joinTournament(tournamentId, tournamentName);
            
            results = [{
              type: 'success',
              text: `Successfully joined tournament: ${tournamentName}`
            }];
          }
          break;
          
        case COMMAND_TYPES.LIST_CHALLENGES:
          if (!session) {
            results = [{
              type: 'error',
              text: 'You must be logged in to list challenges'
            }];
            break;
          }
          
          if (!wargamesContext.hasTournament) {
            results = [{
              type: 'error',
              text: 'You must join a tournament first. Use /join-tournament <id>'
            }];
            break;
          }
          
          const challengesResponse = await listChallengesChallengesGet({
            query: {
              tournament_id: wargamesContext.currentTournamentId
            },
            requiresAuth: true
          });
          
          if (challengesResponse.data) {
            results = [
              {
                type: 'system',
                text: `=== CHALLENGES IN ${wargamesContext.tournamentName.toUpperCase()} ===`
              },
              ...challengesResponse.data.map(challenge => ({
                type: 'system',
                text: `[${challenge.id}] ${challenge.name} - ${challenge.description || 'No description'}`
              }))
            ];
            
            if (challengesResponse.data.length === 0) {
              results.push({
                type: 'system',
                text: 'No challenges available in this tournament.'
              });
            }
          }
          break;
          
        case COMMAND_TYPES.START_CHALLENGE:
          if (!session) {
            results = [{
              type: 'error',
              text: 'You must be logged in to start challenges'
            }];
            break;
          }
          
          const challengeId = parseInt(args[0]);
          if (isNaN(challengeId)) {
            results = [{
              type: 'error',
              text: 'Invalid challenge ID. Please provide a number.'
            }];
            break;
          }
          
          try {
            const startResponse = await startChallengeChallengesChallengeIdStartPost({
              path: {
                challenge_id: challengeId
              },
              requiresAuth: true
            });
            
            console.log('Start challenge response:', startResponse);
            
            // Check if the response indicates success
            if (startResponse.data || (startResponse.response && startResponse.response.ok)) {
              // Get challenge details
              const challengesResponse = await listChallengesChallengesGet({
                requiresAuth: true
              });
              
              const challenge = challengesResponse.data?.find(c => c.id === challengeId);
              const challengeName = challenge?.name || `Challenge ${challengeId}`;
              
              // Update context (assume can contribute for new challenge)
              console.log('Updating context with challenge:', challengeId, challengeName);
              wargamesContext.startChallenge(challengeId, challengeName, true);
              
              // Fetch existing challenge messages
              let contextResponse;
              try {
                contextResponse = await getChallengeContextChallengesChallengeIdContextGet({
                  path: {
                    challenge_id: challengeId
                  },
                  requiresAuth: true
                });
                
                if (contextResponse.data) {
                  // Update canContribute status
                  const canContribute = contextResponse.data.user_challenge_context?.can_contribute ?? true;
                  wargamesContext.startChallenge(challengeId, challengeName, canContribute);
                  
                  // Update remaining message count
                  if (contextResponse.data.remaining_message_count !== undefined) {
                    wargamesContext.setRemainingMessageCount(contextResponse.data.remaining_message_count);
                  }
                  
                  // Process eval_result
                  if (contextResponse.data.eval_result) {
                    const evalResult = contextResponse.data.eval_result;
                    
                    // Update evaluation status in context
                    wargamesContext.setEvaluationStatus(evalResult.status);
                    
                    // Add evaluation messages for non-terminal states
                    if (evalResult.status === 'NOT_EVALUATED') {
                      onChallengeMessages([{
                        type: 'system',
                        text: 'Challenge has not been evaluated yet.'
                      }]);
                    } else if (!['SUCCEEDED', 'FAILED', 'ERRORED'].includes(evalResult.status)) {
                      onChallengeMessages([{
                        type: 'system',
                        text: `Evaluation Status: ${evalResult.status}`
                      }]);
                    }
                    
                    // Add reason if provided
                    if (evalResult.reason) {
                      onChallengeMessages([{
                        type: 'system',
                        text: `Reason: ${evalResult.reason}`
                      }]);
                    }
                  }
                  
                  if (contextResponse.data.messages && contextResponse.data.messages.length > 0) {
                    console.log('Found existing messages:', contextResponse.data.messages.length);
                    // Filter out system messages and convert to display format
                    const existingMessages = contextResponse.data.messages
                      .filter(msg => msg.role !== 'system')
                      .map(msg => ({
                        type: msg.role,
                        text: msg.content
                      }));
                    onChallengeMessages(existingMessages);
                  }
                  
                  // Add completion message if challenge is complete
                  if (!canContribute) {
                    onChallengeMessages([{
                      type: 'system',
                      text: 'This challenge has been completed and cannot accept new messages.'
                    }]);
                  }
                }
              } catch (err) {
                console.error('Error fetching challenge context:', err);
              }
              
              results = [{
                type: 'success',
                text: `Started challenge: ${challengeName}`
              }];
              
              // Add challenge description if available
              if (challenge?.description) {
                results.push({
                  type: 'system',
                  text: `[CHALLENGE]: ${challenge.description}`
                });
              }
            } else {
              // Handle case where response doesn't have data
              console.error('Start challenge response missing data:', startResponse);
              
              // Extract error details
              let errorMessage = `Failed to start challenge ${challengeId}.`;
              let shouldCheckActiveChallenge = false;
              
              if (startResponse.error) {
                if (startResponse.error.detail) {
                  errorMessage += ` ${startResponse.error.detail}`;
                  // Check if error indicates challenge already started
                  if (startResponse.error.detail.toLowerCase().includes('already') || 
                      startResponse.error.detail.toLowerCase().includes('active')) {
                    shouldCheckActiveChallenge = true;
                  }
                } else if (startResponse.error.message) {
                  errorMessage += ` ${startResponse.error.message}`;
                } else if (typeof startResponse.error === 'string') {
                  errorMessage += ` ${startResponse.error}`;
                }
              }
              
              // If challenge might already be started, check user's active challenges
              if (shouldCheckActiveChallenge || startResponse.response?.status === 400) {
                try {
                  const userInfo = await getCurrentUserInfoUsersMeGet({
                    requiresAuth: true
                  });
                  
                  if (userInfo.data?.active_challenges) {
                    const activeChallenge = userInfo.data.active_challenges.find(c => c.id === challengeId);
                    if (activeChallenge) {
                      // Challenge is already active, update context
                      console.log('Challenge already active, updating context');
                      // Need to get canContribute status
                      let canContribute = true;
                      let contextResponse;
                      
                      // Fetch existing challenge messages
                      try {
                        contextResponse = await getChallengeContextChallengesChallengeIdContextGet({
                          path: {
                            challenge_id: challengeId
                          },
                          requiresAuth: true
                        });
                        
                        if (contextResponse.data) {
                          // Get canContribute status
                          canContribute = contextResponse.data.user_challenge_context?.can_contribute ?? true;
                          
                          // Update remaining message count
                          if (contextResponse.data.remaining_message_count !== undefined) {
                            wargamesContext.setRemainingMessageCount(contextResponse.data.remaining_message_count);
                          }
                          
                          // Process eval_result
                          if (contextResponse.data.eval_result) {
                            const evalResult = contextResponse.data.eval_result;
                            
                            // Update evaluation status in context
                            wargamesContext.setEvaluationStatus(evalResult.status);
                            
                            // Add evaluation messages for non-terminal states
                            if (evalResult.status === 'NOT_EVALUATED') {
                              onChallengeMessages([{
                                type: 'system',
                                text: 'Challenge has not been evaluated yet.'
                              }]);
                            } else if (!['SUCCEEDED', 'FAILED', 'ERRORED'].includes(evalResult.status)) {
                              onChallengeMessages([{
                                type: 'system',
                                text: `Evaluation Status: ${evalResult.status}`
                              }]);
                            }
                            
                            // Add reason if provided
                            if (evalResult.reason) {
                              onChallengeMessages([{
                                type: 'system',
                                text: `Reason: ${evalResult.reason}`
                              }]);
                            }
                          }
                          
                          if (contextResponse.data.messages && contextResponse.data.messages.length > 0) {
                            console.log('Found existing messages:', contextResponse.data.messages.length);
                            // Filter out system messages and convert to display format
                            const existingMessages = contextResponse.data.messages
                              .filter(msg => msg.role !== 'system')
                              .map(msg => ({
                                type: msg.role,
                                text: msg.content
                              }));
                            onChallengeMessages(existingMessages);
                          }
                        }
                      } catch (err) {
                        console.error('Error fetching challenge context:', err);
                      }
                      
                      // Update context with correct canContribute status
                      wargamesContext.startChallenge(challengeId, activeChallenge.name, canContribute);
                      
                      results = [{
                        type: 'success',
                        text: `Challenge already active: ${activeChallenge.name}`
                      }];
                      
                      // Add challenge description if available  
                      if (activeChallenge.description) {
                        results.push({
                          type: 'system',
                          text: `[CHALLENGE]: ${activeChallenge.description}`
                        });
                      }
                      
                      if (!canContribute) {
                        results.push({
                          type: 'system',
                          text: 'This challenge has been completed and cannot accept new messages.'
                        });
                      }
                      break;
                    }
                  }
                } catch (err) {
                  console.error('Error checking user info:', err);
                }
              }
              
              results = [{
                type: 'error',
                text: errorMessage
              }];
            }
          } catch (err) {
            console.error('Error starting challenge:', err);
            throw err; // Re-throw to be caught by outer try-catch
          }
          break;
          
        default:
          results = [{
            type: 'error',
            text: `Unknown command: ${command}`
          }];
      }
      
      onResult(results);
      
    } catch (error) {
      console.error('Command execution error:', error);
      onResult([{
        type: 'error',
        text: `Command failed: ${error.message || 'Unknown error'}`
      }]);
    } finally {
      setIsExecuting(false);
    }
  }, [session, wargamesContext, onChallengeMessages]);

  // Reset autocomplete state
  const resetAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
    setSuggestions([]);
    setSelectedIndex(0);
  }, []);

  return {
    // State
    suggestions,
    selectedIndex,
    showAutocomplete,
    isExecuting,
    
    // Methods
    handleInputChange,
    handleKeyDown,
    executeCommand,
    resetAutocomplete,
    
    // Utilities
    parseCommand,
    getCommandSuggestions
  };
}