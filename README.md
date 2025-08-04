# Backend client

Trustbuilder AI: Turning Adversity into Assurance.

WarGames-AI is a crowdsourced security platform that enables AI providers to validate the safety and robustness of their language models through competitive wargames and red-teaming exercises conducted by a global community of security researchers.

## Try Online

[WarGames-AI Platform](https://trustbuilder-ai.github.io/trustbuilder-ai-platform/)

## Setup

Client generated with command:

```sh
npx @hey-api/openapi-ts -i ~/Projects/trustbuilder-ai/wargames-ai-backend/openapi.json -o src/backend_client
```

## Health Check

See contents of test-health-check.ts for simple client use.

```sh
npx tsx test-health-check.ts
```

## Environment

Set `SUPABASE_PUBLIC_ANON_KEY` to supabase anonymous key or add to .env.

## Backend host

The backend host (repo: wargames-ai-backend) is running here (as of JULY/27/2025):

`https://wargames-ai-backend-357559285333.us-west1.run.app`
