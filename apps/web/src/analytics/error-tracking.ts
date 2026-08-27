// Direct-fetch safety telemetry transport.
//
// Forge Design fork: all safety/error telemetry is no-op. No events are
// sent to PostHog or any third-party service. Export signatures are
// preserved so callers (provider.tsx, KitErrorBoundary.tsx, observability/*)
// continue to compile.

import { scrubFilePath } from './scrub';

interface ExceptionTrackingContext {
  apiKey: string;
  host: string;
  distinctId: string;
  appVersion?: string;
  sessionId?: string;
  telemetryEnv?: string;
}

export function setExceptionTrackingContext(
  _next: ExceptionTrackingContext,
): void {
  // no-op
}

export function clearExceptionTrackingContext(): void {
  // no-op
}

export function patchExceptionTrackingAppVersion(_version: string): void {
  // no-op
}

export function installErrorHandlers(): void {
  // no-op
}

export function reportHandledException(
  _error: unknown,
  _message?: string,
): void {
  // no-op
}

export function reportSafetyEvent(
  _eventName: string,
  _properties: Record<string, unknown> = {},
): void {
  // no-op
}

// Re-exported helper for file-path scrubbing (pure utility, no telemetry).
export { scrubFilePath };
