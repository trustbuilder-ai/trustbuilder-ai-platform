import { Message, MessageContainer, ChatContext } from '../../../backend_client/types.gen';

// Re-export MessageContainer from generated types
export type { MessageContainer, ChatContext };

// MessageTree type alias using the generated MessageContainer type
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
  chat_template_id?: number;
  scrolly_tell_sections: ScrollyTellSection[];
}

export interface ScrollyTellRegistryEntry {
  id: string;
  name: string;
  description: string;
  scrollyTellData: ScrollyTellData;
  defaultChatLeafId: number;
}

export type ScrollyTellRegistry = Record<string, ScrollyTellRegistryEntry>;

export interface ScrollyTellState {
  currentChatLeafId: number;
  scrollyTellData: ScrollyTellData;
}

export type ViewType = 'scrollytell' | 'chat' | 'tree';

export interface ScrollyTellContextValue extends ScrollyTellState {
  setCurrentChatLeafId: (id: number) => void;
  updateScrollyTellData: (data: ScrollyTellData) => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedSampleId: string | null;
  availableSamples: ScrollyTellRegistryEntry[];
  selectSample: (sampleId: string) => void;
  // Shared message tree state
  userMessageTree: MessageContainer[] | null;
  setUserMessageTree: (tree: MessageContainer[] | null) => void;
  contextId: string | null;
  setContextId: (id: string | null) => void;
}