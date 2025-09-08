# ScrollyTell Implementation Plan

**NOTE: Field "completion_date" in each phase indicates whether the phase was completed and when it was completed.**

## 1. Libraries to Install

```bash
pnpm add react-scrollama @react-spring/web d3 @llm-ui/react @llm-ui/markdown reactflow
```

**Library breakdown:**
- `react-scrollama` - For scrollytelling functionality and scroll-triggered animations
- `@react-spring/web` - For smooth animations (works well with scrollama)
- `d3` - For data visualizations and graphs
- `@llm-ui/react` & `@llm-ui/markdown` - For styling LLM messages consistently
- `reactflow` - Available for future interactive diagram needs

## 2. Directory Structure

```
src/features/scrollytell/
├── components/
│   ├── ScrollySection.tsx
│   ├── ScrollySection.css
│   ├── MessageDisplay.tsx
│   ├── MessageDisplay.css
│   ├── TreeConnections.tsx
│   ├── AnimatedGraph.tsx
│   ├── AnimatedGraph.css
│   ├── ViewSelector.tsx
│   ├── ViewSelector.css
│   ├── StreamingText.tsx
│   ├── StreamingText.css
│   └── graphs/
│       ├── PieChart.tsx
│       ├── BarChart.tsx
│       └── LineChart.tsx
├── context/
│   └── ScrollyTellContext.tsx
├── hooks/
│   ├── index.ts
│   ├── useScrollProgress.ts
│   ├── useMessageAnimation.ts
│   └── useGraphAnimation.ts
├── layouts/
│   ├── ScrollyTellLayout.tsx
│   └── ScrollyTellLayout.css
├── pages/
│   ├── ScrollyTellView.tsx
│   ├── ChatView.tsx
│   ├── TreeView.tsx
│   └── ScrollyTell.css
├── types/
│   └── index.ts
├── utils/
│   ├── messageTreeUtils.ts
│   ├── animationUtils.ts
│   └── treeLayout.ts
├── data/
│   └── sampleData.ts
└── index.ts  // Main export file for cleaner imports
```

## 3. Export Strategy for Clean Abstraction

Create an index.ts file in the scrollytell feature root:

```typescript
// src/features/scrollytell/index.ts
export { default as ScrollyTellLayout } from './layouts/ScrollyTellLayout';
export { default as ScrollyTellView } from './pages/ScrollyTellView';
export { default as ChatView } from './pages/ChatView';
export { default as TreeView } from './pages/TreeView';
export * from './types';
```

## 4. Key Implementation Steps

### Phase 1: Core Setup
**completion_date:** 2025-09-08
1. Create the base ScrollyTell feature module structure
2. Set up TypeScript interfaces matching the design doc data models
3. Create the ScrollyTellContext for state management
4. Implement the base layout with header and view navigation
5. Create index.ts for clean exports
6. Implement tree layout algorithm for vertical column display
7. Create SVG connection component for tree visualization

### Phase 2: ScrollyTell View
**completion_date:** _Not completed_
1. Implement ScrollySection component with react-scrollama
2. Create StreamingText component for animated message display
3. Implement scroll-triggered animation logic
4. Add text interpolation based on scroll position

### Phase 3: Data Visualizations
**completion_date:** _Not completed_
1. Create AnimatedGraph wrapper component
2. Implement PieChart, BarChart, LineChart using D3
3. Add scroll-triggered graph animations
4. Connect graphs to ScrollySection triggers

### Phase 4: Message Components
**completion_date:** _Not completed_
1. Integrate llm-ui for message styling
2. Create MessageDisplay component with fork/tree view links
3. Implement message streaming animation
4. Add parent-child message relationship handling

### Phase 5: Alternative Views
**completion_date:** _Not completed_
1. Implement ChatView with linear message display
2. Create TreeView using react-flow and dagre
3. Ensure consistent LLM message styling across views
4. Add view state synchronization

### Phase 6: Integration
**completion_date:** _Not completed_
1. Add routes to App.tsx for ScrollyTell features
2. Create navigation from existing app to ScrollyTell
3. Load and parse sample data
4. Test all three views with sample MessageTree data

## 5. Type Definitions

```typescript
// src/features/scrollytell/types/index.ts
import { Message } from '../../../backend_client/types.gen';

export interface MessageContainer {
  id: number;
  parent_message_id: number | null;
  message: Message;
}

export type MessageTree = MessageContainer[];

export interface VisualData {
  data: any;
  type: string;
  label: any;
  metadata: any;
}

export interface TextData {
  data: any;
  type: string;
  label: any;
  metadata: any;
}

export interface ScrollyTellSection {
  message_ids?: number[];
  data: VisualData | TextData;
  metadata?: any;
}

export interface ScrollyTellData {
  scrolly_tell_sections: ScrollyTellSection[];
}

export interface ScrollyTellState {
  currentChatLeafId: number;
  messageTree: MessageTree;
  scrollyTellData: ScrollyTellData;
}
```

## 6. Route Configuration with Clean Imports

Update App.tsx:

```typescript
// Clean import from scrollytell feature
import { 
  ScrollyTellLayout, 
  ScrollyTellView, 
  ChatView, 
  TreeView 
} from "./features/scrollytell";

// Add routes
<Route path="/scrollytell" element={<ScrollyTellLayout />}>
  <Route index element={<ScrollyTellView />} />
  <Route path="chat" element={<ChatView />} />
  <Route path="tree" element={<TreeView />} />
</Route>
```

## 7. Hook Exports for Clean Abstraction

```typescript
// src/features/scrollytell/hooks/index.ts
export { default as useScrollProgress } from './useScrollProgress';
export { default as useMessageAnimation } from './useMessageAnimation';
export { default as useGraphAnimation } from './useGraphAnimation';
```

## 8. Component Implementation Details

### ScrollySection Component
- Uses react-scrollama for scroll detection
- Triggers message streaming when section enters viewport
- Controls animation speed based on scroll position
- Manages section transitions

### MessageDisplay Component
- Integrates llm-ui for consistent styling
- Implements streaming text animation
- Provides fork and tree view navigation links
- Handles message parent-child relationships

### AnimatedGraph Component
- Wrapper for D3 visualizations
- Manages scroll-triggered animations
- Supports multiple graph types (pie, bar, line)
- Configurable through metadata props

### ViewSelector Component
- Navigation between ScrollyTell, Chat, and Tree views
- Maintains view state synchronization
- Visual indicator for active view

### StreamingText Component
- Simulates LLM text streaming
- Variable speed based on scroll progress
- Pause/resume based on visibility
- Word-by-word or character animation options

## 9. State Management

### ScrollyTellContext
- Manages MessageTree data
- Tracks currentChatLeafId
- Stores ScrollyTellData sections
- Provides methods for navigation and updates
- Synchronizes state across all three views

## 10. Animation Strategy

### Scroll-based Triggers
- Section entrance at 25% viewport height
- Full content display at 75% scroll progress
- Animation speed proportional to scroll velocity
- Smooth transitions between sections

### Message Streaming
- Start when first line becomes visible
- Complete when 75% up the page
- No pause once started (unless scrolled out of view)
- Sequential message display (wait for previous to complete)

### Graph Animations
- Trigger on section visibility
- Use @react-spring for smooth transitions
- Support for enter, update, and exit animations
- Configurable duration and easing

## 11. Sample Data Integration

### Data Loading
- Import from data/sampleData.ts
- Parse MessageTree structure
- Build parent-child relationships
- Initialize ScrollyTellData sections

### Testing Data
- Use provided sample MessageTree
- Include branching conversation paths
- Test with various VisualData types
- Verify TextData rendering (markdown/HTML)

## 12. Performance Considerations

- Lazy load graph components
- Virtualize long message lists in Chat view
- Debounce scroll events
- Memoize expensive calculations
- Use React.memo for pure components
- Implement code splitting for views

## 13. Accessibility

- Keyboard navigation support
- ARIA labels for interactive elements
- Focus management between views
- Screen reader announcements for message updates
- Reduced motion options

## 14. Testing Strategy

- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for scroll behaviors
- E2E tests for view navigation
- Performance testing for animations
- Accessibility testing with axe-core