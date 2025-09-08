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

export type ViewType = 'scrollytell' | 'chat' | 'tree';

export interface ScrollyTellContextValue extends ScrollyTellState {
  setCurrentChatLeafId: (id: number) => void;
  updateMessageTree: (tree: MessageTree) => void;
  updateScrollyTellData: (data: ScrollyTellData) => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  getMessagePath: (leafId: number) => MessageContainer[];
}