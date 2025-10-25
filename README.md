# Argo CD Assistant

An AI-powered assistant for Argo CD that analyzes, explains, and helps you debug your applications and resources right from the dashboard.

![Demo of ArgoCD assistant helping debug an application stuck in Progressing](assets/demo/demo.gif)

## Features

- 🤖 AI-powered chat interface integrated into the Argo CD UI
- 🔍 Query and analyze your Argo CD applications and resources

## Installation

### Configure Argo CD

Enable the proxy extension feature in Argo CD by adding the following entry to the `argocd-cmd-params-cm`:

```yaml
server.enable.proxy.extension: 'true'
```

Then authorize the extension in the Argo CD API server and define permissions for the assistant account in the `argocd-rbac-cm`:

```yaml
policy.csv: |
  p, role:readonly, extensions, invoke, assistant, allow

  p, role:assistant, applications, get, *, allow
  p, role:assistant, applications, list, *, allow
  p, role:assistant, applications, syncstatus, *, allow
  p, role:assistant, applications, resource, *, allow
  p, role:assistant, applications, logs, *, allow
  p, role:assistant, applications, events, *, allow
  p, role:assistant, accounts, get, assistant, allow

  g, assistant, role:assistant
```

Next, configure the extension in the `argocd-cm` and create the assistant account:

```yaml
accounts.assistant: apiKey
extension.config: |
  extensions:
    - name: assistant
      backend:
        connectionTimeout: 2s
        keepAlive: 15s
        idleConnectionTimeout: 60s
        maxIdleConnections: 30
        services:
        - url: http://assistant.argocd:3000 # replace with your backend service URL
```

Finally, create an API token for the assistant account:

```bash
argocd account generate-token --account assistant
```

### Install the backend

```bash
git clone https://github.com/alexandrevilain/argo-cd-assistant.git
cd argo-cd-assistant
kubectl create secret generic assistant \
  --from-literal=ARGOCD_API_TOKEN=assistant-api-token \ # replace with the token generated above
  --from-literal=OPENAI_API_KEY=your-api-key \
  --from-literal=OPENAI_BASE_URL="https://openrouter.ai/api/v1" \ # optional, default is https://api.openai.com/v1.
  --from-literal=MODEL="anthropic/claude-haiku-4.5" \ # optional, default is gpt-5-mini
  -n argocd
kubectl apply -f deploy/manifests
```

Note: A Helm chart will be available soon.

### Install the UI extension

Install the UI extension by mounting the React component in the Argo CD API server. You can automate this using the `argocd-extension-installer`. This approach runs an init container that downloads, extracts, and places the files in the correct location.

The YAML below shows an example Kustomize patch to install this UI extension:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argocd-server
spec:
  template:
    spec:
      initContainers:
        - name: extension-assistant
          image: quay.io/argoprojlabs/argocd-extension-installer:v0.0.8
          env:
            - name: EXTENSION_URL
              value: https://github.com/alexandrevilain/argo-cd-assistant/releases/download/v0.0.2/extension.tar
          volumeMounts:
            - name: extensions
              mountPath: /tmp/extensions/
          securityContext:
            runAsUser: 1000
            allowPrivilegeEscalation: false
      containers:
        - name: argocd-server
          volumeMounts:
            - name: extensions
              mountPath: /tmp/extensions/
      volumes:
        - name: extensions
          emptyDir: {}
```

## Development

For local development setup and contribution guidelines, see [`DEVELOPMENT.md`](DEVELOPMENT.md).

## Contributing

Contributions are welcome. Please see [`DEVELOPMENT.md`](DEVELOPMENT.md) for development setup and guidelines.

## Support

For issues and questions, please open an issue on the GitHub repository (https://github.com/alexandrevilain/argo-cd-assistant/issues).

## License

This project is licensed under the Apache License 2.0 - see the [`LICENSE`](LICENSE) file for details.
