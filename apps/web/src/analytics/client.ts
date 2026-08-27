// PostHog browser client wrapper.
//
// Forge Design fork: all analytics is no-op. getAnalyticsClient returns null,
// capture/applyConsent/applyIdentity are no-ops, and posthog-js is never
// loaded. Export signatures are preserved so callers (provider.tsx and
// components importing getResolvedDeviceId) continue to compile.

import {
  type AnalyticsClientType,
  type AnalyticsConfigureGlobals,
} from '@open-design/contracts/analytics';

// Local type alias so exported signatures that referenced PostHog still
// compile without the posthog-js dependency. Includes the minimal method
// surface that provider.tsx calls on the returned client.
interface PostHog {
  register(props: Record<string, unknown>): void;
}

interface AnalyticsContext {
  anonymousId: string;
  sessionId: string;
  clientType: AnalyticsClientType;
  locale: string;
  appVersion: string;
  isFirstSession?: boolean;
}

export function getResolvedAnonymousId(): string | null {
  return null;
}

export function getResolvedDeviceId(): string | null {
  return null;
}

export function getConfigureGlobals(): AnalyticsConfigureGlobals {
  return {
    has_available_configure_cli: false,
    configure_type: 'unknown',
    configure_availability: 'unknown',
    runtime_type: 'none',
    cli_runnable: false,
    byok_runnable: false,
    amr_runnable: false,
  };
}

export function setConfigureGlobals(_next: AnalyticsConfigureGlobals): void {
  // no-op
}

export function setAnalyticsUserId(_userId: string | null): void {
  // no-op
}

export function setAnalyticsPersonProperties(
  _properties: Record<string, unknown>,
): void {
  // no-op
}

export function bootstrapExceptionTracking(
  _context: AnalyticsContext,
): Promise<void> {
  return Promise.resolve();
}

export async function getAnalyticsClient(
  _context: AnalyticsContext,
): Promise<PostHog | null> {
  return null;
}

export function applyConsent(_consentGranted: boolean): void {
  // no-op
}

export function applyIdentity(_installationId: string | null): void {
  // no-op
}

export function capture(
  _client: PostHog | null,
  _args: {
    event: string;
    properties: Record<string, unknown>;
    insertId: string;
    requestId?: string | null;
  },
): void {
  // no-op
}
