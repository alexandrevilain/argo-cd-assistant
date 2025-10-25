# Repository Guidelines

## Project Structure & Module Organization

- Root is a Bun monorepo; `apps` holds runtime targets, `packages` shares code, infra lives under `deploy` and `dev`.
- `apps/backend` is the TypeScript server (Hono entry `src/index.ts`), expects a `.env` with Argo CD and OpenAI secrets.
- `apps/extension` contains the React UI extension; static assets live in `apps/extension/public`.
- `packages/argocd` ships reusable Argo CD API clients and types consumed by both runtime apps.
- Manifests in `deploy/manifests` support cluster installs; `dev/` offers Kustomize overlays for local Kind setups; built artifacts land in `dist/`.

## Build, Test, and Development Commands

- `bun run dev:backend` starts the backend with hot reload; set up `.env` first.
- `bun run dev:ext` watches and syncs the extension bundle into a running Argo CD server.
- `bun run build:backend` and `bun run build:ext` produce production bundles in `dist/`.
- `bun test` runs the Bun test runner across workspaces; add `--watch` while iterating.
- `bun run lint`, `bun run lint:fix`, `bun run format`, and `bun run format:check` enforce code style; `bun run gen:licenses` refreshes third-party attributions.

## Coding Style & Naming Conventions

- Prettier enforces 2-space indentation, 100-character lines, single quotes, and trailing commas (see `prettier.config.cjs`).
- TypeScript is the default; prefer explicit return types on exported functions and keep React components typed with `FC` alternatives only when necessary.
- Use PascalCase for React components, camelCase for functions and variables, and SCREAMING_SNAKE_CASE for environment variables and feature flags.
- Align imports so shared utilities live in `packages/argocd` instead of duplicating helper modules.

## Testing Guidelines

- Prefer colocated `*.test.ts` or `*.spec.ts` files next to the code under test; backend integration suites can live under `apps/backend/tests`.
- Aim for high coverage on request handlers, data mappers, and Argo CD API adapters; include mocks for external HTTP calls.
- Run `bun test` before opening a pull request and document any skipped or flaky specs in the PR body.

## Commit & Pull Request Guidelines

- Existing history follows a Conventional Commits style—use `type(scope): imperative summary`, e.g., `feat(backend): add application health endpoint`.
- Keep commits focused and include relevant workspace prefixes in the scope when touching multiple areas (e.g., `apps`, `packages`).
- Pull requests must describe the user impact, list test evidence (`bun test`, `bun run lint`), and link any Argo CD issues or design docs.
- Capture UI changes with before/after screenshots or short clips; note backend configuration updates and required secrets in the checklist.
