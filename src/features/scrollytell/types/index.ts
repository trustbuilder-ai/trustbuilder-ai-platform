import { Message, MessageContainer } from '../../../backend_client/types.gen';

// Re-export MessageContainer from generated types
export type { MessageContainer };

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
  messageTree: MessageTree;
  scrollyTellData: ScrollyTellData;
}

export type ViewType = 'scrollytell' | 'chat' | 'tree';

export interface ScrollyTellContextValue extends ScrollyTellState {
  setCurrentChatLeafId: (id: number) => void;
  updateMessageTree: (tree: MessageTree) => void;
  updateScrollyTellData: (data: ScrollyTellData) => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  getMessagePath: (leafId: number) => MessageContainer[];
  forkMessage: (parentMessageId: number, role?: 'user' | 'assistant' | 'system', content?: string) => MessageContainer | null;
  selectedSampleId: string | null;
  availableSamples: ScrollyTellRegistryEntry[];
  selectSample: (sampleId: string) => void;
}