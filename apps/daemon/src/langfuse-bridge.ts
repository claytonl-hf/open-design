// Daemon ↔ langfuse-trace bridge.
//
// Forge Design fork: all telemetry is no-op. The three exported functions
// return skipped/undefined states immediately. Type exports are preserved
// so callers (server.ts, routes/telemetry.ts, task-observation-rollout.ts,
// and tests) continue to compile.

import {
  type TrackingRunCancelOrigin,
  type TrackingRunTerminalTrigger,
} from '@open-design/contracts/analytics';
import type { OdNextRolloutDecision, SafeRunQualityV1 } from '@open-design/contracts';

import type { TelemetryPrefs } from './app-config.js';
import type { AppVersionInfo } from './app-version.js';
import type {
  RunTelemetryTimestamps,
  RunUsageAnalytics,
} from './run-analytics-observability.js';
import type { RunFailureClassification } from './run-failure-classification.js';
import type { PromptStackTelemetry } from './prompt-telemetry.js';
import type { LangfuseDeliveryState } from './langfuse-trace.js';

export interface DaemonRunRecord {
  id: string;
  projectId: string | null;
  conversationId: string | null;
  assistantMessageId: string | null;
  agentId: string | null;
  status: string;
  exitCode?: number | null;
  signal?: string | null;
  error?: string | null;
  errorCode?: string | null;
  cancelOrigin?: TrackingRunCancelOrigin | null;
  terminalTrigger?: TrackingRunTerminalTrigger | null;
  analyticsTelemetry?: RunTelemetryTimestamps | null;
  createdAt: number;
  updatedAt: number;
  events: Array<{
    id: number;
    event: string;
    data: unknown;
    timestamp?: number;
  }>;
  userPrompt?: string;
  model?: string;
  resolvedModelId?: string | null;
  preflightAgentCliVersion?: string | null;
  reasoning?: string;
  skillId?: string;
  designSystemId?: string;
  designSystemDigest?: string;
  designSystemSelectionSource?: string;
  promptCache?: {
    stablePromptHash: string;
    hit: boolean;
    missReason: string | null;
    changedSections?: string[] | null;
  };
  clientType?: 'desktop' | 'web' | 'unknown';
  promptTelemetry?: PromptStackTelemetry;
  projectAttachmentPaths?: string[];
  projectMetadata?: Record<string, unknown> | null;
  retryAttemptCount?: number;
  retryFinalResult?: string;
  retrySuppressedReason?: string;
  retryOriginalFailure?: RunFailureClassification;
  strategyRolloutDecision?: OdNextRolloutDecision | null;
}

export interface BuildSafeRunQualityProjectionFromDaemonOpts {
  db: unknown;
  dataDir: string;
  run: SafeRunQualityDaemonRunRecord;
  prefs: TelemetryPrefs;
  installationId?: string | null;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}

/** Minimal durable Run surface required to rebuild the Task-safe projection. */
export interface SafeRunQualityDaemonRunRecord {
  id: string;
  projectId: string | null;
  conversationId: string | null;
  assistantMessageId: string | null;
  agentId: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
  events: DaemonRunRecord['events'];
  exitCode?: number | null | undefined;
  signal?: string | null | undefined;
  error?: string | null | undefined;
  errorCode?: string | null | undefined;
  cancelOrigin?: TrackingRunCancelOrigin | null | undefined;
  terminalTrigger?: TrackingRunTerminalTrigger | null | undefined;
  analyticsTelemetry?: RunTelemetryTimestamps | null | undefined;
  userPrompt?: string | undefined;
  projectAttachmentPaths?: string[] | undefined;
  projectMetadata?: Record<string, unknown> | null | undefined;
}

export interface ReportRunCompletedFromDaemonOpts {
  db: unknown;
  dataDir: string;
  run: DaemonRunRecord;
  persistedRunStatus?: string;
  persistedEndedAt?: number;
  /** App version info — collected once at daemon startup and reused. */
  appVersion?: AppVersionInfo | null;
  /** Exact identity persisted by the caller before crossing the network. */
  deliveryIdempotencyKey?: string;
  /** Persists each concrete transport attempt before fetch. */
  onDeliveryAttempt?: () => void;
  fetchImpl?: typeof fetch;
}

// Stubbed: always returns a skipped delivery state. No Langfuse trace is sent.
export async function reportRunCompletedFromDaemon(
  _opts: ReportRunCompletedFromDaemonOpts,
): Promise<LangfuseDeliveryState> {
  return {
    langfuse_expected: false,
    langfuse_delivery_status: 'not_expected',
    langfuse_drop_reason: 'missing_sink_config',
  };
}

// Stubbed: always returns undefined. No quality projection is built.
export async function buildSafeRunQualityProjectionFromDaemon(
  _opts: BuildSafeRunQualityProjectionFromDaemonOpts,
): Promise<SafeRunQualityV1 | undefined> {
  return undefined;
}

export interface ReportRunFeedbackFromDaemonOpts {
  dataDir: string;
  runId: string;
  rating: 'positive' | 'negative';
  reasonCodes: string[];
  hasCustomReason: boolean;
  /** Raw "other" free text. Empty when no custom reason. */
  customReason: string;
  /** Extra context for Langfuse score metadata (projectId / conversationId / assistantMessageId). */
  scoreMetadata?: Record<string, unknown>;
  fetchImpl?: typeof fetch;
}

export type FeedbackReportOutcome =
  | { status: 'accepted' }
  | { status: 'skipped_consent' }
  | { status: 'skipped_no_sink' };

// Stubbed: always returns skipped_no_sink. No feedback score is sent.
export async function reportRunFeedbackFromDaemon(
  _opts: ReportRunFeedbackFromDaemonOpts,
): Promise<FeedbackReportOutcome> {
  return { status: 'skipped_no_sink' };
}
