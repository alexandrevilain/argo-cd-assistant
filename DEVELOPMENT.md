# Development Guide

This guide describes how to set up a local development environment for the Argo CD Assistant extension.

## Prerequisites

Before you begin, make sure these tools are installed:

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com/)
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

Create a local Kubernetes cluster with Kind:

```bash
kind create cluster
```

### 3. Install Argo CD with extension support

Apply the development kustomization which installs Argo CD and enables extension support:

```bash
# Create the argocd namespace
kubectl create namespace argocd

# Apply the kustomization
kubectl apply -k dev/
```

This sets up Argo CD with:

- Extension proxy enabled ([`dev/patches/argocd-cmd-params-cm.yaml`](dev/patches/argocd-cmd-params-cm.yaml))
- Assistant extension configured ([`dev/patches/argocd-cm.yaml`](dev/patches/argocd-cm.yaml))
- RBAC permissions for the assistant account ([`dev/patches/argocd-rbac-cm.yaml`](dev/patches/argocd-rbac-cm.yaml))
- ExternalName service for local backend access ([`dev/service.yaml`](dev/service.yaml))

### 4. Access the Argo CD UI

Retrieve the initial admin password and access the UI:

```bash
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward to access the Argo CD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access Argo CD at https://localhost:8080
# Username: admin
# Password: (from the command above)
```

### 5. Create the assistant user and generate a token

Use the Argo CD CLI to generate an API token for the assistant account:

```bash
# Log in to Argo CD (use the admin password from step 4)
argocd login localhost:8080 --username admin --insecure

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

# Server configuration
PORT=3000
NODE_TLS_REJECT_UNAUTHORIZED=0
EOF
```

Note: `NODE_TLS_REJECT_UNAUTHORIZED=0` is only for local development with self-signed certificates. Do not use this in production.

### 7. Start development servers

Open two terminal windows:

Terminal 1 — Backend server:

```bash
bun run dev:backend
```

This starts the backend server with hot reload on port 3000.

Terminal 2 — Extension UI:

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

1. Verify the backend is running and reachable:

   ```bash
   curl http://localhost:3000/
   ```

2. Check the ExternalName service:

   ```bash
   kubectl get svc dockerhost -n argocd
   ```

3. Ensure `host.docker.internal` resolves correctly in Kind.

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
