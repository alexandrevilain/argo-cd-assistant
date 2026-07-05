import { Hono } from 'hono';
import { createAgentUIStreamResponse, type UIMessage } from 'ai';

import { ArgoCDClient } from '@/argocd';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import config from './config';
import { createAgent } from './agent';
import { readTextFile } from './fs';
import { requestId, type RequestIdVariables } from 'hono/request-id';
import { structuredLogger } from '@hono/structured-logger';
import { createLogger, type Logger } from './logger';

const rootLogger = createLogger({ level: config.LOG_LEVEL, format: config.LOG_FORMAT });

const app = new Hono<{ Variables: RequestIdVariables & { logger: Logger } }>();

app.use(requestId());
app.use(
  structuredLogger({
    createLogger: (c) => rootLogger.child({ requestId: c.var.requestId }),
  }),
);

const openai = createOpenAICompatible({
  name: 'provider',
  baseURL: config.OPENAI_BASE_URL,
  apiKey: config.OPENAI_API_KEY,
});

let customPrompt: string | null = null;
if (config.CUSTOM_PROMPT_FILE) {
  customPrompt = await readTextFile(config.CUSTOM_PROMPT_FILE);
}

app.get('/', (c) => {
  return c.text('');
});

app.post('/api/agent', async (c) => {
  const log = c.get('logger');

  const { messages }: { messages: UIMessage[] } = await c.req.json();

  const argocdEndpoint = c.req.header('Origin') || '';
  const [_, applicationName] = (c.req.header('Argocd-Application-Name') || '').split(':');

  const argoClient = new ArgoCDClient(argocdEndpoint, config.ARGOCD_API_TOKEN);

  return createAgentUIStreamResponse({
    agent: createAgent(argoClient, applicationName, openai(config.MODEL), log, customPrompt),
    uiMessages: messages,
    onError: (err) => {
      // Errors surfaced here are model/provider call or stream failures (tool
      // execution errors are handled inside the agent). Log the full detail
      // server-side and return a generic message to the client.
      log.error({ err }, 'agent stream error');
      return 'An error occurred.';
    },
  });
});

export default {
  port: config.PORT,
  fetch: app.fetch,
  idleTimeout: 30,
};
