# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Argo CD Assistant is an AI-powered chat assistant embedded in the Argo CD UI that analyzes, explains, and debugs Argo CD applications and their Kubernetes resources. It is a **Bun monorepo** with three workspaces:

- `apps/backend` — Hono HTTP server that runs the LLM agent (AI SDK `ToolLoopAgent`).
- `apps/extension` — React UI extension mounted into the Argo CD API server, bundled by Vite as a UMD module.
- `packages/argocd` — shared Argo CD API client (`ArgoCDClient`) and generated TypeScript types, consumed by both apps.

## Commands

Run from the repo root; scripts delegate into the right workspace.

- `bun install` — install all workspace dependencies.
- `bun run dev:backend` — backend with hot reload on port 3000 (sets `LOG_FORMAT=pretty` and `NODE_TLS_REJECT_UNAUTHORIZED=0`). Requires `apps/backend/.env`.
- `bun run dev:ext` — Vite watch build of the extension. On each build it `kubectl cp`s the bundle into the running `argocd-server` pod (see the `argocd-uploader` plugin in `apps/extension/vite.config.ts`), so a local Kind cluster with Argo CD must be running.
- `bun run build:backend` — compiles a standalone binary to `apps/backend/dist/server`.
- `bun run build:ext` — production bundle + `extension.tar` in `apps/extension/dist`.
- `bun run lint` / `bun run lint:fix` — ESLint over `.js,.jsx,.ts,.tsx`.
- `bun run format` / `bun run format:check` — Prettier.
- `bun run typecheck` — `tsc --noEmit`.

There is currently **no test suite** — `bun test` (the root `test` script) just prints "No tests for now".

Full local setup (Kind cluster, Argo CD install, assistant token, `.env`) is documented in `DEVELOPMENT.md`.

## Architecture & request flow

1. The extension registers a top-bar action menu item via `window.extensionsAPI.registerTopBarActionMenuExt` (`apps/extension/src/index.tsx`). Argo CD passes the current `application` object as a prop.
2. `ChatContainer` uses `@ai-sdk/react`'s `useChat` with a `DefaultChatTransport` pointed at `/extensions/assistant/api/agent`. Argo CD's **proxy extension** feature forwards this to the backend service. The transport sends `Origin`, `Argocd-Application-Name` (`<namespace>:<name>`), and `Argocd-Project-Name` headers.
3. The backend `POST /api/agent` (`apps/backend/src/index.ts`) reads those headers: **`Origin` becomes the Argo CD API base URL** and the application name scopes the agent. It constructs a per-request `ArgoCDClient(origin, ARGOCD_API_TOKEN)` and streams the agent response with `createAgentUIStreamResponse`.
4. `createAgent` (`apps/backend/src/agent.ts`) builds a `ToolLoopAgent` (max 10 steps) whose system prompt hard-scopes analysis to the single application. Tools (`getApplication`, `getApplicationResourceTree`, `getApplicationManagedResources`, `getPodLogs`, `getWorkloadLogs`, `getApplicationLogs`, `getApplicationEvents`, `getResourceEvents`) are thin wrappers over `ArgoCDClient` methods.

Key architectural points:

- The backend does **not** hold an Argo CD endpoint in config — it trusts the `Origin` header of the incoming proxied request as the target Argo CD server. Auth to Argo CD is a single service-account API token (`ARGOCD_API_TOKEN`).
- Everything is scoped to one application per request; the agent cannot reach other applications.
- Chat history is persisted client-side in `localStorage` keyed by `chat-history:<namespace>:<name>`.
- The LLM provider is OpenAI-compatible (`@ai-sdk/openai-compatible`); point `OPENAI_BASE_URL`/`MODEL` at any compatible provider (e.g. OpenRouter).

## Configuration (backend)

Config is parsed and validated with Zod in `apps/backend/src/config.ts`. Required: `OPENAI_API_KEY`, `ARGOCD_API_TOKEN`. Optional: `PORT` (3000), `MODEL` (`gpt-5-mini`), `OPENAI_BASE_URL`, `LOG_LEVEL`, `LOG_FORMAT` (`json`/`pretty`), `CUSTOM_PROMPT_FILE` (a file whose contents are appended to the system prompt for admin-provided context).

## Conventions

- Import shared code via the `@/*` path alias, which maps to `packages/*/src` (so `@/argocd` → `packages/argocd/src`). Put reusable Argo CD logic in `packages/argocd`, not duplicated helpers.
- Prettier config: 2-space indent, 100-char lines, single quotes, trailing commas. TypeScript is `strict` with `noUnusedLocals`/`noUnusedParameters`.
- Commits follow Conventional Commits with a workspace scope: `type(scope): summary` (e.g. `feat(backend): ...`).

### Argo CD types are generated

`packages/argocd/src/types/argocd.d.ts` is generated from the Argo CD swagger spec — do not edit it by hand. To regenerate against a new Argo CD version, from `packages/argocd`: `bun run download-swagger` (edit the pinned version in the script) then `bun run generate-types`.
