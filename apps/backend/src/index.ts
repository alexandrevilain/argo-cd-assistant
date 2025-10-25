import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { convertToModelMessages, type UIMessage } from 'ai';

import { ArgoCDClient } from '@/argocd';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import config from './config';
import { createAgent } from './agent';

const app = new Hono();
app.use(logger());

const openai = createOpenAICompatible({
  name: 'provider',
  baseURL: config.OPENAI_BASE_URL,
  apiKey: config.OPENAI_API_KEY,
});

app.get('/', (c) => {
  return c.text('');
});

app.post('/api/agent', async (c) => {
  const { messages }: { messages: UIMessage[] } = await c.req.json();

  const argocdEndpoint = c.req.header('Origin') || '';
  const [_, applicationName] = (c.req.header('Argocd-Application-Name') || '').split(':');

  const argoClient = new ArgoCDClient(argocdEndpoint, config.ARGOCD_API_TOKEN);

  return createAgent(argoClient, applicationName, openai(config.MODEL))
    .stream({
      messages: convertToModelMessages(messages),
    })
    .toUIMessageStreamResponse();
});

export default {
  port: config.PORT,
  fetch: app.fetch,
};
