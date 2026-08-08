import { PostHog } from 'posthog-node';
import { env } from './env.js';

let client: PostHog | null = null;

export function getAnalytics(): PostHog | null {
  if (!env.POSTHOG_API_KEY) return null;
  if (!client) {
    client = new PostHog(env.POSTHOG_API_KEY, { host: env.POSTHOG_HOST });
  }
  return client;
}

export function track(distinctId: string, event: string, properties?: Record<string, unknown>): void {
  getAnalytics()?.capture({ distinctId, event, properties });
}

export async function shutdownAnalytics(): Promise<void> {
  await client?.shutdown();
}
