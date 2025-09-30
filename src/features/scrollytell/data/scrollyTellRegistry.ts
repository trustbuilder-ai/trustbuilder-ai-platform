import { ScrollyTellRegistry, VisualData, TextData } from '../types';

// ============================================================================
// REUSABLE VISUAL AND TEXT DATA COMPONENTS
// ============================================================================

export const aiUsageChart: VisualData = {
  data: [
    { application: "Content Generation", usage: 28 },
    { application: "Code Assistance", usage: 22 },
    { application: "Customer Support", usage: 18 },
    { application: "Data Analysis", usage: 15 },
    { application: "Translation", usage: 8 },
    { application: "Education", usage: 6 },
    { application: "Other", usage: 3 }
  ],
  type: "pie",
  label: {
    title: "Enterprise AI/LLM Usage by Application",
    subtitle: "2024 Survey Results (n=500 companies)"
  },
  metadata: {
    innerRadius: 60, // Donut chart
    padAngle: 0.02,
    cornerRadius: 4,
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFA07A", "#98D8C8", "#F7DC6F"],
    showLabels: true,
    labelFormat: "{application}\n{usage}%",
    animationDuration: 1200,
    startAngle: -90,
    centerText: {
      primary: "AI Usage",
      secondary: "By Sector"
    }
  }
};

export const gpt4InfoCard: TextData = {
  data: `**GPT-4 Turbo**
Released: November 2023
Parameters: 1.76 trillion
Context Window: 128,000 tokens

Best for: Complex reasoning, creative writing, and code generation.`,
  type: "markdown",
  label: "Model Overview",
  metadata: {
    theme: "minimal",
    showBorder: true
  }
};

export const llmGlossary: TextData = {
  data: "<p><strong>LLM:</strong> Large Language Model - An AI system trained on vast amounts of text data to understand and generate human-like text.</p>",
  type: "html",
  label: "Glossary",
  metadata: {
    category: "definition"
  }
};

// ============================================================================
// SCROLLYTELL REGISTRY
// Message trees are now loaded from backend via chat_template_id
// ============================================================================

export const scrollyTellRegistry: ScrollyTellRegistry = {
  'scientific-terminology': {
    id: 'scientific-terminology',
    name: 'Scientific Terminology Constraint',
    description: 'Demonstrates how an LLM breaks rigid system constraints when faced with emotional pressure and real human needs.',
    scrollyTellData: {
      chat_template_id: 15,
      scrolly_tell_sections: [
        {
          message_ids: [1, 2, 3],
          data: gpt4InfoCard,
          metadata: {}
        },
        {
          // Visual only section - no message_ids
          data: aiUsageChart,
          metadata: {}
        },
        {
          message_ids: [4, 5],
          data: llmGlossary,
          metadata: {}
        },
        {
          message_ids: [6, 7, 8, 9],
          data: gpt4InfoCard,
          metadata: {}
        },
        {
          message_ids: [10],
          data: llmGlossary,
          metadata: {}
        }
      ]
    },
    defaultChatLeafId: 10
  }
};