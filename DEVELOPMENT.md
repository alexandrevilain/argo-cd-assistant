# Development Guide

This guide describes how to set up a local development environment for the Argo CD Assistant extension.

## Prerequisites

Before you begin, make sure these tools are installed:

- [Bun](https://bun.sh)
- A Docker-compatible container runtime (Docker Desktop, Colima, …)
- [Kind](https://kind.sigs.k8s.io/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Argo CD CLI](https://argo-cd.readthedocs.io/en/stable/cli_installation/)
- OpenAI API key (or a compatible LLM provider key)

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/alexandrevilain/argo-cd-assistant.git
cd argo-cd-assistant
bun install
```

### 2. Create a Kind cluster

Create a local Kubernetes cluster with Kind, from the repository root:

```bash
kind create cluster --config dev/kind.yaml
```

The config mounts the repository into the Kind node (`/workspace`) so the backend runs in the cluster straight from your sources. With Colima, the repository must be under a directory Colima shares with its VM (your home directory by default).

### 3. Install Argo CD with extension support

Apply the development kustomization which installs Argo CD and enables extension support:

```bash
# Create the argocd namespace
kubectl create namespace argocd

# Apply the kustomization
kubectl apply -k dev/ --server-side --force-conflicts
```

Server-side apply is required: some Argo CD CRDs are too large for a client-side `kubectl apply` (`metadata.annotations: Too long`).

This sets up Argo CD with:

- Extension proxy and plain HTTP (`server.insecure`) enabled ([`dev/patches/argocd-cmd-params-cm.yaml`](dev/patches/argocd-cmd-params-cm.yaml))
- Assistant extension configured ([`dev/patches/argocd-cm.yaml`](dev/patches/argocd-cm.yaml))
- RBAC permissions for the assistant account ([`dev/patches/argocd-rbac-cm.yaml`](dev/patches/argocd-rbac-cm.yaml))
- The backend running in-cluster with hot reload ([`dev/backend.yaml`](dev/backend.yaml))

### 4. Access the Argo CD UI

Retrieve the initial admin password and access the UI:

```bash
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward to access the Argo CD UI
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Access Argo CD at http://localhost:8080
# Username: admin
# Password: (from the command above)
```

### 5. Create the assistant user and generate a token

Use the Argo CD CLI to generate an API token for the assistant account:

```bash
# Log in to Argo CD (use the admin password from step 4)
argocd login localhost:8080 --username admin --plaintext

# The assistant account is already created via the ConfigMap
# Generate a token for the assistant account
argocd account generate-token --account assistant

# Save this token — you'll need it for the backend configuration
```

### 6. Configure the backend

Create a `.env` file in the `apps/backend/` directory:

```bash
cat > apps/backend/.env <<EOF
# OpenAI configuration
OPENAI_API_KEY=your-openai-api-key-here
# OPENAI_BASE_URL (set if using another provider)
# MODEL (defaults to gpt5-mini)

# Argo CD configuration
ARGOCD_API_TOKEN=your-assistant-token-from-step-5
EOF
```

The in-cluster backend loads this file on startup, so restart it once the file is created:

```bash
kubectl -n argocd rollout restart deployment assistant-backend
```

### 7. Start development servers

The backend already runs in the cluster with hot reload (`bun run --hot`): edits to `apps/backend` or `packages/argocd` are picked up automatically. Follow its logs with:

```bash
kubectl -n argocd logs -f deployment/assistant-backend
```

Extension UI:

```bash
bun run dev:ext
```

This builds the extension UI in watch mode and continuously updates the extension in the running Argo CD server Pod.

## Running tests

```bash
# Run tests for all packages
bun test
```

## Linting & Formatting

Use the root scripts defined in [`package.json`](package.json):

```bash
# Lint all workspaces
bun run lint

# Attempt to fix lint issues
bun run lint:fix

# Write Prettier formatting
bun run format

# Check formatting without writing
bun run format:check
```

## Building for production

```bash
# Build all components
bun run build:ext
bun run build:backend

# Generate third-party licenses
bun run gen:licenses
```

## Common issues

### Extension not loading

1. Verify that the extension proxy is enabled:

   ```bash
   kubectl get cm argocd-cmd-params-cm -n argocd -o yaml | grep proxy
   ```

2. Check the extension configuration:

   ```bash
   kubectl get cm argocd-cm -n argocd -o yaml | grep -A 10 extension.config
   ```

3. Inspect Argo CD server logs for errors.

### Backend connection issues

1. Verify the backend pod is running and check its logs:

   ```bash
   kubectl -n argocd get pods -l app=assistant-backend
   kubectl -n argocd logs deployment/assistant-backend
   ```

2. If the pod can't find its sources, check the repository is mounted in the Kind node (the cluster must be created with `dev/kind.yaml` from the repository root):

   ```bash
   docker exec kind-control-plane ls /workspace
   ```

### RBAC permission errors

If you encounter permission denied errors:

1. Confirm that the assistant account exists:

   ```bash
   argocd account list
   ```

2. Review the RBAC configuration:

   ```bash
   kubectl get cm argocd-rbac-cm -n argocd -o yaml
   ```

3. Regenerate the token if needed:
   ```bash
   argocd account generate-token --account assistant
   ```

## Contributing

### Code style

- Use TypeScript for all code.
- Follow the existing code style.
- Run linting before committing:
  ```bash
  bun run lint
  ```

### Commit messages

Follow the Conventional Commits format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions or changes

### Pull requests

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add tests if applicable.
5. Update documentation.
6. Submit a pull request.

## Resources

- Argo CD Extensions documentation: https://argo-cd.readthedocs.io/en/stable/developer-guide/extensions/ui-extensions/
- Argo CD API documentation: https://cd.apps.argoproj.io/swagger-ui
- Hono documentation: https://hono.dev/
- AI SDK documentation: https://ai-sdk.dev/docs/introduction
