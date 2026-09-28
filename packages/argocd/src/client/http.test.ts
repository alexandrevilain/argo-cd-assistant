import { expect, test } from 'bun:test';
import { HttpClient } from './http';

test('API errors do not expose the Authorization header', async () => {
  const server = Bun.serve({
    port: 0,
    fetch: () => Response.json({ message: 'permission denied' }, { status: 403 }),
  });
  const client = new HttpClient(`http://localhost:${server.port}`, 'SECRET_TOKEN');

  for (const call of [() => client.get('/x'), () => client.getText('/x')]) {
    const err = await call().catch((e: unknown) => e);
    expect(JSON.stringify(err, Object.getOwnPropertyNames(err))).not.toContain('SECRET_TOKEN');
    expect(String(err)).toContain('(403)');
  }

  server.stop();
});
