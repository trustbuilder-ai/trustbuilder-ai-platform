/**
 * Slash command definitions for the Wargames interface
 */

export const COMMAND_TYPES = {
  HELP: 'help',
  LIST_TOURNAMENTS: 'list-tournaments',
  LIST_CHALLENGES: 'list-challenges',
  START_CHALLENGE: 'start-challenge'
};

export const COMMANDS = [
  {
    name: '/help',
    type: COMMAND_TYPES.HELP,
    description: 'Show available commands and usage',
    usage: '/help',
    requiresArgument: false,
    argumentHint: null,
    examples: ['/help']
  },
  {
    name: '/list-tournaments',
    type: COMMAND_TYPES.LIST_TOURNAMENTS,
    description: 'Display all available tournaments',
    usage: '/list-tournaments',
    requiresArgument: false,
    argumentHint: null,
    examples: ['/list-tournaments']
  },
  {
    name: '/list-challenges',
    type: COMMAND_TYPES.LIST_CHALLENGES,
    description: 'List all available challenges',
    usage: '/list-challenges',
    requiresArgument: false,
    argumentHint: null,
    examples: ['/list-challenges']
  },
  {
    name: '/start-challenge',
    type: COMMAND_TYPES.START_CHALLENGE,
    description: 'Start a specific challenge',
    usage: '/start-challenge <challenge_id>',
    requiresArgument: true,
    argumentHint: '<challenge_id>',
    examples: ['/start-challenge 101', '/start-challenge 5']
  }
];

/**
 * Parse a command string into command and arguments
 * @param {string} input - The full input string
 * @returns {Object} - { command: string, args: string[], isValid: boolean }
 */
export function parseCommand(input) {
  const trimmed = input.trim();
  
  if (!trimmed.startsWith('/')) {
    return { command: null, args: [], isValid: false };
  }
  
  const parts = trimmed.split(/\s+/);
  const commandName = parts[0];
  const args = parts.slice(1);
  
  const commandDef = COMMANDS.find(cmd => cmd.name === commandName);
  
  if (!commandDef) {
    return { command: commandName, args, isValid: false };
  }
  
  const isValid = commandDef.requiresArgument ? args.length > 0 : true;
  
  return {
    command: commandName,
    commandDef,
    args,
    isValid
  };
}

/**
 * Get command suggestions based on partial input
 * @param {string} input - The current input
 * @returns {Array} - Array of matching commands
 */
export function getCommandSuggestions(input) {
  if (!input.startsWith('/')) {
    return [];
  }
  
  const searchTerm = input.toLowerCase();
  
  return COMMANDS.filter(cmd => 
    cmd.name.toLowerCase().startsWith(searchTerm)
  );
}

/**
 * Format command for display with proper spacing
 * @param {Object} command - Command definition
 * @returns {string} - Formatted command string
 */
export function formatCommandDisplay(command) {
  return command.requiresArgument 
    ? `${command.name} ${command.argumentHint}`
    : command.name;
}

/**
 * Generate help text for all commands
 * @returns {Array} - Array of formatted help messages
 */
export function generateHelpText() {
  return [
    {
      type: 'system',
      text: '=== WARGAMES COMMAND INTERFACE ==='
    },
    {
      type: 'system',
      text: 'Available commands:'
    },
    ...COMMANDS.map(cmd => ({
      type: 'system',
      text: `  ${formatCommandDisplay(cmd)} - ${cmd.description}`
    })),
    {
      type: 'system',
      text: ''
    },
    {
      type: 'system',
      text: 'Examples:'
    },
    ...COMMANDS.flatMap(cmd => 
      cmd.examples.map(example => ({
        type: 'system',
        text: `  ${example}`
      }))
    )
  ];
}