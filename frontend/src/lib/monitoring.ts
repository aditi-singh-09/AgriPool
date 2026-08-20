import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

export function initErrorMonitoring(): void {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: 0.2,
      environment: import.meta.env.MODE,
    });
  }

  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: true,
      autocapture: true,
    });
  }
}

export { posthog };
