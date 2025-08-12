# Directory Structure

## Overview
The application is organized using a feature-based architecture that cleanly separates the two main interfaces: Console (admin) and Wargames (challenge).

## Structure

```
src/
├── features/              # Feature-based modules
│   ├── console/           # Admin/Console interface
│   │   ├── components/    # Console-specific components
│   │   │   ├── Breadcrumbs.jsx/.css
│   │   │   ├── DataCard.tsx/.css
│   │   │   ├── SearchBar.jsx/.css
│   │   │   └── Sidebar.jsx/.css
│   │   ├── layouts/       # Console layout wrapper
│   │   │   └── ConsoleLayout.jsx/.css
│   │   └── pages/         # Console pages
│   │       ├── Dashboard.tsx/.css
│   │       ├── Models.jsx
│   │       ├── RedTeaming.jsx
│   │       └── Tournaments.jsx/.css
│   │
│   └── wargames/          # Wargames challenge interface
│       ├── components/    # Wargames-specific components
│       │   ├── ChallengesOverlay/
│       │   ├── EvaluationConfirmModal.jsx/.css
│       │   ├── GameStatus.jsx
│       │   ├── ModelOutput.jsx
│       │   ├── SlashCommandAutocomplete.jsx/.css
│       │   ├── commandDefinitions.js
│       │   └── options/
│       ├── context/       # Wargames state management
│       │   └── WargamesContext.jsx
│       ├── hooks/         # Wargames-specific hooks
│       │   ├── useSlashCommands.js
│       │   └── useWargamesScripts.js
│       ├── layouts/       # Wargames layout wrapper
│       │   └── WargamesLayout.jsx/.css
│       ├── pages/         # Wargames pages
│       │   ├── ChallengeDebug.jsx/.css
│       │   ├── Wargames.jsx
│       │   └── WargamesChallenge.jsx/.css
│       ├── styles/        # Wargames styles
│       │   └── tailwind.css
│       └── themes/        # Theme files
│           ├── cyberpunk.css
│           ├── dark.css
│           └── light.css
│
├── shared/                # Shared resources
│   ├── components/        # Shared UI components
│   │   ├── Header.jsx/.css
│   │   ├── LoginModal.jsx/.css
│   │   ├── ProtectedCard.jsx/.css/.d.ts
│   │   └── auth/
│   │       ├── Callback.jsx/.css
│   │       ├── EmailInput.jsx
│   │       ├── OtpInput.jsx
│   │       └── OtpInputStyled.jsx
│   ├── constants/         # Shared constants
│   │   └── wargames.ts
│   ├── hooks/            # Shared React hooks
│   │   ├── index.ts
│   │   ├── useApiData.ts
│   │   ├── useAuth.ts
│   │   └── usePaginatedData.ts
│   └── lib/              # Shared libraries
│       ├── api-client.ts
│       └── supabase.ts
│
├── backend_client/        # Generated API client
├── layouts/              # Root layout
│   └── RootLayout.jsx
├── pages/                # Landing pages
│   ├── Home.jsx
│   └── Pages.css
├── App.jsx               # Main app component
├── App.css               # Global styles
├── config.ts             # App configuration
├── index.css             # Root styles
└── main.jsx              # App entry point
```

## Key Benefits

1. **Feature Isolation**: Console and Wargames are completely separated, making it easy to work on one without affecting the other
2. **Shared Resources**: Common components, hooks, and utilities are centralized in the `shared/` folder
3. **Clear Organization**: Each feature has its own components, pages, hooks, and styles
4. **Scalability**: New features can be added as separate modules without mixing concerns
5. **Maintainability**: Clear boundaries make it easy to understand what code belongs to which interface

## Import Patterns

- Within a feature: Use relative imports (e.g., `../components/`)
- To shared resources: Use relative imports from feature root (e.g., `../../../shared/`)
- To backend client: Use relative imports from feature root (e.g., `../../../backend_client/`)