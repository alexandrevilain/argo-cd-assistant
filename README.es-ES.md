

# Argo CD Assistant

Un asistente impulsado por IA para Argo CD que analiza, explica y te ayuda a depurar tus aplicaciones y recursos directamente desde el panel de control.

![Demostración del asistente de ArgoCD ayudando a depurar una aplicación bloqueada en Progressing](assets/demo/demo.gif)

## Características

- 🤖 Interfaz de chat impulsada por IA integrada en la UI de Argo CD
- 🔍 Consulta y analiza tus aplicaciones y recursos de Argo CD

## Instalación

### Configurar Argo CD

Habilita la característica de extensión proxy en Argo CD agregando la siguiente entrada en `argocd-cmd-params-cm`:

```yaml
server.enable.proxy.extension: 'true'
```

Luego, autoriza la extensión en el servidor API de Argo CD y define los permisos para la cuenta del asistente en `argocd-rbac-cm`:

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

A continuación, configura la extensión en `argocd-cm` y crea la cuenta del asistente:

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

Finalmente, crea un token de API para la cuenta del asistente:

```bash
argocd account generate-token --account assistant
```

### Instalar el backend

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

Nota: Un gráfico de Helm estará disponible próximamente.

### Instalar la extensión de UI

Instala la extensión de UI montando el componente de React en el servidor API de Argo CD. Puedes automatizar esto usando `argocd-extension-installer`. Este enfoque ejecuta un contenedor init que descarga, extrae y coloca los archivos en la ubicación correcta.

El YAML a continuación muestra un parche de Kustomize de ejemplo para instalar esta extensión de UI:

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

## Desarrollo

Para la configuración de desarrollo local y las directrices de contribución, consulta [`DEVELOPMENT.md`](DEVELOPMENT.md).

## Contribuciones

Las contribuciones son bienvenidas. Por favor, consulta [`DEVELOPMENT.md`](DEVELOPMENT.md) para la configuración y directrices de desarrollo.

## Soporte

Para reportar problemas y hacer preguntas, abre un issue en el repositorio de GitHub (https://github.com/alexandrevilain/argo-cd-assistant/issues).

## Licencia

Este proyecto está licenciado bajo la Licencia Apache 2.0. Consulta el archivo [`LICENSE`](LICENSE) para más detalles.
