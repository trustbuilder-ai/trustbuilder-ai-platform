declare module '@llm-ui/react' {
  export function useLLMOutput(options: any): any;
  export function useStreamExample(text: string, options?: any): any;
}

declare module '@llm-ui/markdown' {
  export function markdownLookBack(): any;
}