import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpush from 'web-push';

const root = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.join(root, 'subscriptions.json');
const port = Number(process.env.PORT || 8787);
const origin = process.env.ALLOWED_ORIGIN || '*';
const cronSecret = process.env.CRON_SECRET || '';
const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:you@example.com';

if (publicKey && privateKey) webpush.setVapidDetails(subject, publicKey, privateKey);

const readSubscriptions = async () => {
  try { return JSON.parse(await readFile(storePath, 'utf8')); } catch { return []; }
};
const saveSubscriptions = (subscriptions) => writeFile(storePath, `${JSON.stringify(subscriptions, null, 2)}\n`);
const json = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': origin, 'access-control-allow-headers': 'content-type, x-cron-secret', 'access-control-allow-methods': 'GET, POST, OPTIONS' });
  response.end(JSON.stringify(body));
};
const body = async (request) => {
  let value = '';
  for await (const chunk of request) value += chunk;
  return JSON.parse(value || '{}');
};
const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  if (request.method === 'GET' && request.url === '/health') return json(response, 200, { ok: true });
  if (request.method === 'GET' && request.url === '/vapid-public-key') return json(response, publicKey ? 200 : 503, { publicKey });
  if (request.method === 'POST' && request.url === '/subscribe') {
    try {
      const input = await body(request);
      if (!input.subscription?.endpoint) return json(response, 400, { error: 'subscription.endpoint is required' });
      const subscriptions = await readSubscriptions();
      const next = subscriptions.filter((item) => item.endpoint !== input.subscription.endpoint);
      next.push({ ...input.subscription, timezone: input.timezone || 'Europe/Rome', updatedAt: new Date().toISOString() });
      await saveSubscriptions(next);
      return json(response, 201, { ok: true });
    } catch (error) { return json(response, 400, { error: error.message }); }
  }
  if (request.method === 'POST' && request.url === '/send-daily') {
    if (!cronSecret || request.headers['x-cron-secret'] !== cronSecret) return json(response, 401, { error: 'unauthorized' });
    if (!publicKey || !privateKey) return json(response, 503, { error: 'VAPID keys are not configured' });
    try {
      const input = await body(request);
      const subscriptions = await readSubscriptions();
      const stale = new Set();
      let sent = 0;
      for (const subscription of subscriptions) {
        try { await webpush.sendNotification(subscription, JSON.stringify(input)); sent += 1; }
        catch (error) { if ([404, 410].includes(error.statusCode)) stale.add(subscription.endpoint); else console.error(error.message); }
      }
      await saveSubscriptions(subscriptions.filter((item) => !stale.has(item.endpoint)));
      return json(response, 200, { ok: true, sent, removed: stale.size });
    } catch (error) { return json(response, 400, { error: error.message }); }
  }
  return json(response, 404, { error: 'not found' });
});

server.listen(port, () => console.log(`Jianwen push server listening on :${port}`));
