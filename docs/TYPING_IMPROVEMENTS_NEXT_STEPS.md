# TypeScript Typing Improvements - Next Steps

**Date: January 26, 2025**

## Overview

Following the successful migration from JSX to TSX, this document outlines specific typing improvements needed to achieve full TypeScript type safety. Each category includes real examples from the codebase with current issues and recommended fixes.

## 1. Replace `any` Types with Proper Types

### Category: API Response Types

**Current Problem:**
Many API hooks and components use `any` for API responses, losing type safety.

**Example from `src/features/wargames/context/WargamesContext.tsx:13`:**
```typescript
// CURRENT - Line 13
evaluationStatus: any | null; // TODO: Define proper evaluation status type

// IMPROVED
import { EvalResult } from '../../../backend_client/types.gen';

interface WargamesContextValue {
  evaluationStatus: EvalResult | null;
  // ...
}
```

**Example from `src/shared/hooks/useApiData.ts:9`:**
```typescript
// CURRENT
export function useApiData<T>(
  apiCall: (params?: any) => Promise<T>,
  options?: { requiresAuth?: boolean; params?: any }
) {
  // ...
}

// IMPROVED
export function useApiData<T, P = void>(
  apiCall: (params?: P) => Promise<T>,
  options?: { requiresAuth?: boolean; params?: P }
) {
  // ...
}
```

### Category: Error Handling

**Example from `src/shared/hooks/useApiData.ts:27`:**
```typescript
// CURRENT
} catch (err: any) {
  setError(err.message || 'An error occurred');
}

// IMPROVED
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'An error occurred';
  setError(errorMessage);
}
```

## 2. Add Missing Component Prop Interfaces

### Category: Components with Implicit Any Props

**Example from `src/features/wargames/components/options/ModeSelector.tsx:3`:**
```typescript
// CURRENT - Missing type annotations
const ModeSelector = ({ initialMode = "single", onModeChange }) => {
  const [mode, setMode] = useState(initialMode);
  
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

// IMPROVED
type GameMode = "single" | "batch";

interface ModeSelectorProps {
  initialMode?: GameMode;
  onModeChange?: (mode: GameMode) => void;
}

const ModeSelector = ({ initialMode = "single", onModeChange }: ModeSelectorProps) => {
  const [mode, setMode] = useState<GameMode>(initialMode);
  
  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };
```

**Example from `src/features/wargames/hooks/useSlashCommands.ts:20`:**
```typescript
// CURRENT - Parameters have no types
export default function useSlashCommands(session, wargamesContext, onChallengeMessages) {

// IMPROVED
import { Session } from '@supabase/supabase-js';
import { WargamesContextValue } from '../context/WargamesContext';
import { Message } from '../../../backend_client/types.gen';

export default function useSlashCommands(
  session: Session | null,
  wargamesContext: WargamesContextValue,
  onChallengeMessages: (messages: Message[]) => void
) {
```

## 3. Type API Responses Properly

### Category: Using Generated Types from backend_client

**Example from `src/features/console/pages/Tournaments.tsx:39-41`:**
```typescript
// CURRENT - Using untyped data with property access
if (userInfo.data?.active_tournaments) {
  const joinedIds = new Set(
    userInfo.data.active_tournaments.map((t) => t.id) // 't' is implicitly any
  );
}

// IMPROVED
import { UserInfo, Tournament } from '../../../backend_client/types.gen';

const userInfo = useApiData<UserInfo>(getCurrentUserInfoUsersMeGet, {
  requiresAuth: true,
});

if (userInfo.data?.active_tournaments) {
  const joinedIds = new Set(
    userInfo.data.active_tournaments.map((t: Tournament) => t.id)
  );
}
```

## 4. Add Return Type Annotations to Functions

### Category: Hook Return Types

**Example from `src/features/wargames/hooks/useSlashCommands.ts`:**
```typescript
// CURRENT - No return type specified
export default function useSlashCommands(session, wargamesContext, onChallengeMessages) {
  // ... hook implementation
  return {
    suggestions,
    selectedIndex,
    showAutocomplete,
    handleInputChange,
    // ...
  };
}

// IMPROVED
interface SlashCommandsReturn {
  suggestions: CommandSuggestion[];
  selectedIndex: number;
  showAutocomplete: boolean;
  handleInputChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  executeCommand: (commandString: string) => Promise<void>;
  selectSuggestion: (index: number) => void;
  commandHistory: string[];
  isExecuting: boolean;
}

export default function useSlashCommands(
  session: Session | null,
  wargamesContext: WargamesContextValue,
  onChallengeMessages: (messages: Message[]) => void
): SlashCommandsReturn {
  // ... implementation
}
```

## 5. Type Event Handlers Correctly

### Category: Form and DOM Events

**Example from `src/features/console/pages/ChallengeDebug.tsx:24`:**
```typescript
// CURRENT
const handleAddMessage = async (e) => {
  e.preventDefault();
  // ...
}

// IMPROVED
const handleAddMessage = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
}
```

**Example from callback handlers:**
```typescript
// CURRENT
const handleInputChange = useCallback((value) => {
  // ...
}, []);

// IMPROVED
const handleInputChange = useCallback((value: string) => {
  // ...
}, []);
```

## 6. Fix State Type Inference

### Category: Complex State Objects

**Example from `src/features/console/pages/Tournaments.tsx:27`:**
```typescript
// CURRENT - challengeContexts uses implicit any
const [challengeContexts, setChallengeContexts] = useState({});

// IMPROVED
import { ChallengeContextResponse } from '../../../backend_client/types.gen';

const [challengeContexts, setChallengeContexts] = useState<Record<string, ChallengeContextResponse>>({});
```

## 7. Type Utility Functions

### Category: Command Definitions

**Example from `src/features/wargames/components/commandDefinitions.ts`:**
```typescript
// CURRENT - Missing types for command structures
export const COMMAND_TYPES = {
  TOURNAMENTS: 'tournaments',
  CHALLENGE: 'challenge',
  // ...
};

// IMPROVED
export const COMMAND_TYPES = {
  TOURNAMENTS: 'tournaments',
  CHALLENGE: 'challenge',
  // ...
} as const;

export type CommandType = typeof COMMAND_TYPES[keyof typeof COMMAND_TYPES];

interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  type: CommandType;
  requiresAuth: boolean;
}

export function parseCommand(input: string): CommandDefinition | null {
  // ...
}
```

## Implementation Priority

### High Priority (Week 1)
1. **API Response Types** - Use generated types from `backend_client/types.gen.ts`
2. **Hook Parameters** - Type all custom hook parameters and returns
3. **Context Types** - Complete WargamesContext typing

### Medium Priority (Week 2)
1. **Event Handlers** - Add proper event types for all handlers
2. **Component Props** - Add interfaces for all component props
3. **State Types** - Fix useState calls with complex objects

### Low Priority (Week 3+)
1. **Utility Functions** - Type helper functions and utilities
2. **Constants** - Add const assertions and literal types
3. **Strict Mode** - Enable stricter TypeScript rules

## Migration Strategy

### 1. Use Generated Types
The project has auto-generated types in `src/backend_client/types.gen.ts`. Use these for all API-related typing:
```typescript
import { 
  Tournament,
  Challenges,
  UserInfo,
  Message,
  ChallengeContextResponse
} from '../backend_client/types.gen';
```

### 2. Create Domain Types
Create type files for each feature domain:
```
src/types/
├── tournament.types.ts
├── challenge.types.ts
├── game.types.ts
└── ui.types.ts
```

### 3. Gradual Strictness
Enable TypeScript strict mode flags one at a time:
```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": true,        // Start here
    "strictNullChecks": true,     // Then this
    "strictFunctionTypes": true,  // Then this
    "strict": true                 // Finally, full strict mode
  }
}
```

### 4. Type Guards and Assertions
Create type guards for runtime type checking:
```typescript
// Type guard example
function isMessage(obj: unknown): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'role' in obj &&
    'content' in obj
  );
}

// Use in code
if (isMessage(data)) {
  // data is typed as Message here
  console.log(data.content);
}
```

## Testing Approach

### 1. Compile-Time Checks
```bash
# Run type checking without building
npx tsc --noEmit

# Check specific files
npx tsc --noEmit src/features/wargames/**/*.tsx
```

### 2. Runtime Validation
Add runtime type validation for API responses:
```typescript
import { z } from 'zod'; // If using zod

const TournamentSchema = z.object({
  id: z.number(),
  name: z.string(),
  // ...
});

// Validate API response
const tournament = TournamentSchema.parse(apiResponse);
```

## Benefits After Implementation

1. **IntelliSense** - Full autocomplete for all props and methods
2. **Refactoring Safety** - Rename operations update all usages
3. **Error Prevention** - Catch type mismatches at compile time
4. **Documentation** - Types serve as inline documentation
5. **Developer Experience** - Faster development with better tooling

## Tools and Resources

### Helpful VSCode Extensions
- TypeScript Error Lens
- Pretty TypeScript Errors
- TypeScript Importer

### Type Checking Commands
```bash
# Check all files
npm run type-check

# Watch mode for development
npx tsc --watch --noEmit

# Generate type coverage report
npx type-coverage
```

## Conclusion

These improvements will transform the codebase from a partially typed TypeScript project to a fully type-safe application. Start with high-priority items that affect the most code, then gradually work through medium and low priority improvements. The existing generated types in `backend_client/types.gen.ts` provide a solid foundation for typing API-related code.