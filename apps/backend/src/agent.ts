import { Experimental_Agent as Agent, stepCountIs, dynamicTool, LanguageModel } from 'ai';

import { z } from 'zod';

import { ArgoCDClient } from '@/argocd';

export function createAgent(
  argoClient: ArgoCDClient,
  applicationName: string,
  model: LanguageModel,
) {
  return new Agent({
    model,
    system: `You are an SRE agent and Argo CD/Kubernetes expert embedded inside the Argo CD UI.

Operating principles:
- Prefer calling tools to inspect real cluster/application state before answering. Never invent values.
- Scope all analysis to the current Argo CD Application and its resources.
- Be concise and action-oriented. When suggesting remediation, provide exact commands (kubectl/argocd) and explain risks.
- If information is missing or ambiguous, state what is unknown and ask a targeted follow-up, but only after using available tools.
- Do not provide credentials or tokens. Redact secrets.

Tool selection guidance:
- getApplication: use for app health/sync status, source (repo/path/revision), destination (cluster/namespace), history.
- getApplicationResourceTree: use for topology and ownership graph, to locate workloads/pods and their health/sync.
- getApplicationManagedResources: use for drift/OutOfSync analysis and to enumerate managed kinds/names/namespaces.
- getPodLogs: use to debug pod workloads by fetching container logs.
- getApplicationLogs: use to debug Argo CD application sync/reconciliation issues.
- getWorkloadLogs: use to fetch logs from specific workload resources (Deployment, StatefulSet, etc.).
- getApplicationEvents: use to investigate Kubernetes events for the application (warnings, errors, state changes).
- getResourceEvents: use to fetch Kubernetes events for specific resources.

Response style:
- Start with a short summary, then numbered steps/actions.
- Quote resource identifiers verbatim (Kind/name.namespace).
- When you reference logs/events you did not retrieve, say so and suggest how to fetch them.`,
    stopWhen: stepCountIs(10),
    tools: {
      getApplication: dynamicTool({
        description:
          'Fetch the Argo CD Application object for the current app. Use for status/sync/health, source (repo/path/revision), and destination (cluster/namespace). Returns V1alpha1Application.',
        inputSchema: z.object(),
        execute: async () => {
          const application = await argoClient.getApplication(applicationName);
          if (application.metadata && application.metadata.managedFields) {
            // Empty managed fields as they consumes token for nothing.
            // It may be interesting for the end-user to see them, for SSA issues, but not for the agent.
            application.metadata.managedFields = [];
          }
          return application;
        },
      }),
      getApplicationResourceTree: dynamicTool({
        description:
          'Fetch the resource tree (DAG) for the current application. Use to locate workloads/pods and ownership, and to see per-resource health/sync. Returns V1alpha1ApplicationTree.',
        inputSchema: z.object(),
        execute: async () => {
          return argoClient.getApplicationResourceTree(applicationName);
        },
      }),
      getApplicationManagedResources: dynamicTool({
        description:
          'List managed resources for the current application, including drift info. Use to analyze OutOfSync/drift and enumerate kinds/names/namespaces.',
        inputSchema: z.object(),
        execute: async () => {
          return argoClient.getApplicationManagedResources(applicationName);
        },
      }),
      getPodLogs: dynamicTool({
        description: 'Fetch logs for a pod. Use to debug workloads.',
        inputSchema: z.object({
          podName: z.string().describe('The name of the pod'),
        }),
        execute: async (input) => {
          const { podName } = input as { podName: string };
          return argoClient.getPodLogs(applicationName, podName);
        },
      }),
      getApplicationLogs: dynamicTool({
        description:
          'Fetch application-level logs from Argo CD. Use to debug application sync/reconciliation issues.',
        inputSchema: z.object(),
        execute: async () => {
          return argoClient.getApplicationLogs(applicationName);
        },
      }),
      getWorkloadLogs: dynamicTool({
        description:
          'Fetch logs for a specific workload resource (Deployment, StatefulSet, etc.). Use when you need logs from a specific resource identified in the resource tree.',
        inputSchema: z.object({
          applicationNamespace: z.string().describe('The namespace of the application'),
          namespace: z.string().describe('The namespace of the resource'),
          name: z.string().describe('The name of the resource'),
          group: z.string().describe('The API group of the resource'),
          kind: z.string().describe('The kind of the resource'),
          version: z.string().describe('The API version of the resource'),
        }),
        execute: async (input) => {
          const { applicationNamespace, namespace, name, group, kind, version } = input as {
            applicationNamespace: string;
            namespace: string;
            name: string;
            group: string;
            kind: string;
            version: string;
          };
          return argoClient.getWorkloadLogs(applicationName, applicationNamespace, {
            namespace,
            name,
            group,
            kind,
            version,
          });
        },
      }),
      getApplicationEvents: dynamicTool({
        description:
          'Fetch Kubernetes events for the current application. Use to investigate warnings, errors, or state changes.',
        inputSchema: z.object(),
        execute: async () => {
          return argoClient.getApplicationEvents(applicationName);
        },
      }),
      getResourceEvents: dynamicTool({
        description:
          'Fetch Kubernetes events for a specific resource. Use to debug issues with individual resources.',
        inputSchema: z.object({
          applicationNamespace: z.string().describe('The namespace of the application'),
          resourceUID: z.string().describe('The UID of the resource'),
          resourceNamespace: z.string().describe('The namespace of the resource'),
          resourceName: z.string().describe('The name of the resource'),
        }),
        execute: async (input) => {
          const { applicationNamespace, resourceUID, resourceNamespace, resourceName } = input as {
            applicationNamespace: string;
            resourceUID: string;
            resourceNamespace: string;
            resourceName: string;
          };
          return argoClient.getResourceEvents(
            applicationName,
            applicationNamespace,
            resourceUID,
            resourceNamespace,
            resourceName,
          );
        },
      }),
    },
  });
}
