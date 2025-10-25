import {
  Application,
  ApplicationLogEntry,
  V1alpha1ApplicationTree,
  V1EventList,
  V1alpha1ResourceDiff,
  V1alpha1ResourceResult,
} from '../types';
import { HttpClient } from './http';

export class ArgoCDClient {
  private client: HttpClient;

  constructor(baseUrl: string, apiToken: string) {
    this.client = new HttpClient(baseUrl, apiToken);
  }

  private async fetchLogs(
    url: string,
    params?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<string[]> {
    const body = await this.client.getText(url, params);
    return this.parseLogPayload(body);
  }

  private parseLogPayload(payload: string): string[] {
    if (!payload) {
      return [];
    }

    const entries: string[] = [];
    const lines = payload.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      try {
        const parsed = JSON.parse(trimmed);
        const entry = (parsed?.result ?? parsed) as ApplicationLogEntry;
        if (entry.content) {
          entries.push(entry.content);
        }
      } catch {
        // Ignore lines that are not valid JSON payloads.
      }
    }

    return entries;
  }

  public async getApplication(applicationName: string) {
    return this.client.get<Application>(`/api/v1/applications/${applicationName}`);
  }

  public async getApplicationResourceTree(applicationName: string) {
    return this.client.get<V1alpha1ApplicationTree>(
      `/api/v1/applications/${applicationName}/resource-tree`,
    );
  }

  public async getApplicationManagedResources(
    applicationName: string,
    filters?: {
      namespace?: string;
      name?: string;
      version?: string;
      group?: string;
      kind?: string;
      appNamespace?: string;
      project?: string;
    },
  ) {
    return this.client.get<{ items: V1alpha1ResourceDiff[] }>(
      `/api/v1/applications/${applicationName}/managed-resources`,
      filters,
    );
  }

  public async getApplicationLogs(applicationName: string) {
    return this.fetchLogs(`/api/v1/applications/${applicationName}/logs`, {
      follow: false,
      tailLines: 100,
    });
  }

  public async getWorkloadLogs(
    applicationName: string,
    applicationNamespace: string,
    resourceRef: V1alpha1ResourceResult,
  ) {
    return this.fetchLogs(`/api/v1/applications/${applicationName}/logs`, {
      appNamespace: applicationNamespace,
      namespace: resourceRef.namespace,
      resourceName: resourceRef.name,
      group: resourceRef.group,
      kind: resourceRef.kind,
      version: resourceRef.version,
      follow: false,
      tailLines: 100,
    });
  }

  public async getPodLogs(applicationName: string, podName: string) {
    return this.fetchLogs(`/api/v1/applications/${applicationName}/pods/${podName}/logs`, {
      follow: false,
      tailLines: 100,
    });
  }

  public async getApplicationEvents(applicationName: string) {
    return this.client.get<V1EventList>(`/api/v1/applications/${applicationName}/events`);
  }

  public async getResourceEvents(
    applicationName: string,
    applicationNamespace: string,
    resourceUID: string,
    resourceNamespace: string,
    resourceName: string,
  ) {
    return this.client.get<V1EventList>(`/api/v1/applications/${applicationName}/events`, {
      appNamespace: applicationNamespace,
      resourceNamespace,
      resourceUID,
      resourceName,
    });
  }
}
