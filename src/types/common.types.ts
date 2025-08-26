import { ReactNode, CSSProperties } from 'react';

// Base component props that many components can extend
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
}

// For components that accept children
export interface WithChildren {
  children: ReactNode;
}

// Common event handler types
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type ChangeHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

// Common state types
export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;