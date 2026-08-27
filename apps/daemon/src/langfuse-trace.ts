// Langfuse trace forwarding for completed agent runs.
//
// Forge Design fork: all telemetry is no-op. Every network/config function
// returns null or a skipped delivery state. No data is sent to Langfuse or
// any relay. Type exports are preserved so callers (server.ts, routes/runs.ts,
// task-observation-rollout.ts, task-observation-otlp-exporter.ts, and tests)
// continue to compile. Pure redaction utility functions are kept since they
// do not send data anywhere.

import type {
  SafeRunQualityV1,
} from '@open-design/contracts';

import type { TelemetryPrefs } from './app-config.js';
import type { RunFailureClassification } from './run-failure-classification.js';
import {
  canonicalizeToolAnalyticsName,
  type RunTelemetryTimestamps,
  type RunTimingAnalytics,
} from './run-analytics-observability.js';
import type {
  RunDiagnosticsAnalytics,
  StreamTailSummary,
} from './run-diagnostics.js';
import type { PromptStackTelemetry } from './prompt-telemetry.js';
import type { RunObservationExporter } from './observability/run-exporter.js';

export const INPUT_MAX_BYTES = 64 * 1024;
export const HARD_BATCH_MAX_BYTES = 1024 * 1024;

export interface LangfuseConfig {
  authHeader: string;
  baseUrl: string;
  timeoutMs: number;
  retries: number;
}

export type LangfuseDeliveryStatus =
  | 'not_expected'
  | 'queued'
  | 'accepted'
  | 'failed';

export type LangfuseDropReason =
  | 'metrics_consent_off'
  | 'content_consent_off'
  | 'missing_sink_config'
  | 'payload_too_large'
  | 'payload_build_error'
  | 'export_mapping_mismatch'
  | 'task_hierarchy_rollout'
  | 'relay_429'
  | 'relay_413'
  | 'relay_5xx'
  | 'langfuse_4xx'
  | 'langfuse_5xx'
  | 'vela_400'
  | 'vela_401'
  | 'vela_403'
  | 'vela_413'
  | 'vela_429'
  | 'vela_5xx'
  | 'network_error';

export interface LangfuseDeliveryState {
  langfuse_expected: boolean;
  langfuse_delivery_status: LangfuseDeliveryStatus;
  langfuse_drop_reason?: LangfuseDropReason;
  langfuse_attempt_count?: number;
  langfuse_idempotency_key?: string;
}

export type TelemetrySinkConfig =
  | {
      kind: 'relay';
      relayUrl: string;
      timeoutMs: number;
      retries: number;
    }
  | ({
      kind: 'langfuse';
    } & LangfuseConfig);

export interface VelaTelemetrySinkConfig {
  kind: 'vela';
  apiUrl: string;
  controlKey: string;
  timeoutMs: number;
  retries: number;
}

export type RunTelemetrySinkConfig =
  | TelemetrySinkConfig
  | VelaTelemetrySinkConfig;

export interface RunSummary {
  runId: string;
  status: 'succeeded' | 'failed' | 'canceled';
  startedAt: number;
  endedAt: number;
  error?: string;
  errorCode?: string;
  failure?: RunFailureClassification;
  timings?: RunTimingAnalytics;
  timingMarks?: RunTelemetryTimestamps;
  stderr?: {
    tail: string;
    lineCount: number;
    truncated: boolean;
  };
  stdout?: {
    tail: string;
    lineCount: number;
    truncated: boolean;
  };
  diagnostics?: unknown;
  retryAttemptCount?: number;
  retryFinalResult?: string;
  retrySuppressedReason?: string;
  retryOriginalFailure?: RunFailureClassification;
}

export interface MessageSummary {
  messageId: string;
  prompt: string;
  output: string;
  usage?: {
    inputTokens?: number;
    inputTokensProvider?: number;
    inputTokensEffective?: number;
    outputTokens?: number;
    totalTokens?: number;
    thoughtTokens?: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
    uncachedInputTokens?: number;
    estimatedContextTokens?: number;
    cacheHitRatio?: number;
    cacheTokenSource?: 'anthropic' | 'openai' | 'unavailable';
  };
}

export interface ArtifactSummary {
  slug: string;
  type: string;
  sizeBytes: number;
  sha256?: string;
  createdAt?: string;
}

export type ObjectManifestCompleteness = 'complete' | 'partial' | 'unavailable';

export type ObjectManifestStatus = 'ok' | 'partial' | 'unavailable';

export type ObjectManifestSensitivity = 'public' | 'internal' | 'private' | 'sensitive';

export type ObjectManifestAccessScope = 'owner' | 'project' | 'workspace' | 'evaluator';

export type ObjectManifestRetentionPolicy =
  | 'ephemeral'
  | 'observability_90d'
  | 'project_lifetime'
  | 'eval_fixture'
  | 'legal_hold';

export interface TraceSafeObjectManifestBase {
  object_class: 'attachment' | 'artifact' | 'input_text_snapshot';
  storage_ref: string;
  status: ObjectManifestStatus;
  reason?: string;
  project_id: string | null;
  run_id: string;
  workspace_id: string | null;
  size_bytes?: number;
  sha256?: string;
  mime_type?: string;
  extension?: string;
  redacted: boolean;
  truncated: boolean;
  stored_in_open_design: boolean;
  retention_policy: ObjectManifestRetentionPolicy;
  access_scope: ObjectManifestAccessScope;
  sensitivity: ObjectManifestSensitivity;
  source: 'user_upload' | 'agent_generated' | 'user_prompt';
  expires_at: string | null;
  approved_by: string | null;
  open_in_open_design_url?: null;
  preview_status?: string;
  access_policy?: 'open_design_auth_required';
}

export interface AttachmentManifestEntry extends TraceSafeObjectManifestBase {
  object_class: 'attachment';
  attachment_id: string;
}

export interface ArtifactManifestEntry extends TraceSafeObjectManifestBase {
  object_class: 'artifact';
  artifact_id: string;
  type: string;
  artifact_kind?: string;
  build_status?: string;
  preview_status?: string;
  export_status?: string;
}

export interface InputTextSnapshotManifestEntry extends TraceSafeObjectManifestBase {
  object_class: 'input_text_snapshot';
  input_text_snapshot_id: string;
  type: 'text';
}

export interface TraceObjectSummary {
  new_file_count: number;
  modified_file_count: number;
  recovered_file_count: number;
  candidate_file_count: number;
  uploaded_file_count: number;
  skipped_file_count: number;
  skip_reasons: Record<string, number>;
}

export interface ToolCallSummary {
  id: string;
  name: string;
  startedAt: number;
  endedAt: number;
  input?: string;
  output?: string;
  isError?: boolean;
}

export interface AgentEventSummary {
  id: string;
  name: string;
  timestamp: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  level?: 'DEFAULT' | 'WARNING' | 'ERROR';
  statusMessage?: string;
}

export interface EventsSummary {
  toolCalls: number;
  errors: number;
  durationMs: number;
}

export interface RuntimeInfo {
  nodeVersion?: string;
  os?: string;
  osRelease?: string;
  arch?: string;
  appVersion?: string;
  appChannel?: string;
  packaged?: boolean;
  clientType?: 'desktop' | 'web' | 'unknown';
  agentCliVersion?: string;
  runtimeCompanionName?: string;
  runtimeCompanionVersion?: string;
}

export interface TurnInfo {
  model?: string;
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
}

export interface ReportContext {
  installationId: string | null;
  projectId: string;
  conversationId: string;
  agentId?: string;
  run: RunSummary;
  message: MessageSummary;
  artifacts: ArtifactSummary[];
  attachmentManifest?: AttachmentManifestEntry[];
  artifactManifest?: ArtifactManifestEntry[];
  inputTextSnapshotManifest?: InputTextSnapshotManifestEntry[];
  manifestCompleteness?: ObjectManifestCompleteness;
  traceObjectSummary?: TraceObjectSummary;
  tools?: ToolCallSummary[];
  agentEvents?: AgentEventSummary[];
  eventsSummary: EventsSummary;
  prefs: TelemetryPrefs;
  langfuse?: LangfuseDeliveryState;
  turn?: TurnInfo;
  runtime?: RuntimeInfo;
  promptTelemetry?: PromptStackTelemetry;
  strategyRolloutDecision?: {
    requestedMode: string;
    effectiveMode: string;
    primaryReasonCode: string;
    syntheticCanary?: boolean;
    reasonCodes?: readonly string[];
  };
  extraTags?: string[];
}

export interface ReportRunOpts {
  config?: RunTelemetrySinkConfig | LangfuseConfig | null;
  fetchImpl?: typeof fetch;
  configuredEnv?: Record<string, string>;
  deliveryPurpose?: 'final' | 'object-registration';
  deliveryIdempotencyKey?: string;
  onDeliveryAttempt?: () => void;
}

export interface ReportFeedbackOpts {
  config?: RunTelemetrySinkConfig | LangfuseConfig | null;
  fetchImpl?: typeof fetch;
  configuredEnv?: Record<string, string>;
}

export interface FeedbackReportContext {
  runId: string;
  installationId: string | null;
  prefs: TelemetryPrefs;
  rating: 'positive' | 'negative';
  reasonCodes: string[];
  customReason: string;
  hasCustomReason: boolean;
  metadata?: Record<string, unknown>;
}

export interface EffectiveRunTelemetrySinkDiagnostic {
  kind: RunTelemetrySinkConfig['kind'] | 'none';
  host: string | null;
  protocol: 'http' | 'https' | null;
}

export interface PostLegacyTelemetryBatchOptions {
  installationId?: string | null;
  fetchImpl?: typeof fetch;
  deliveryIdempotencyKey?: string;
  fallbackConfig?: TelemetrySinkConfig | null;
  maxTotalAttempts?: number;
  onAttempt?: () => void;
}

// ---------------------------------------------------------------------------
// Stubbed config / network functions — all return null or skipped state.
// ---------------------------------------------------------------------------

const SKIPPED_DELIVERY_STATE: LangfuseDeliveryState = {
  langfuse_expected: false,
  langfuse_delivery_status: 'not_expected',
  langfuse_drop_reason: 'missing_sink_config',
};

export function readLangfuseConfig(
  _env: NodeJS.ProcessEnv = process.env,
): LangfuseConfig | null {
  return null;
}

export function readTelemetrySinkConfig(
  _env: NodeJS.ProcessEnv = process.env,
): TelemetrySinkConfig | null {
  return null;
}

export function readTaskTelemetrySinkConfig(
  _env: NodeJS.ProcessEnv = process.env,
): TelemetrySinkConfig | null {
  return null;
}

export function readRunTelemetrySinkConfig(
  _env: NodeJS.ProcessEnv = process.env,
  _configuredEnv: Record<string, string> = {},
): RunTelemetrySinkConfig | null {
  return null;
}

export function readFeedbackTelemetrySinkConfig(
  _env: NodeJS.ProcessEnv = process.env,
  _configuredEnv: Record<string, string> = {},
): RunTelemetrySinkConfig | null {
  return null;
}

export function describeRunTelemetrySink(
  _sink: RunTelemetrySinkConfig | null,
): EffectiveRunTelemetrySinkDiagnostic {
  return { kind: 'none', host: null, protocol: null };
}

export function deriveLangfuseDeliveryState(
  _prefs: TelemetryPrefs,
  _sink: RunTelemetrySinkConfig | null,
): LangfuseDeliveryState {
  return SKIPPED_DELIVERY_STATE;
}

// ---------------------------------------------------------------------------
// Pure redaction utility functions — kept because they do not send data.
// ---------------------------------------------------------------------------

export const CONTENT_TOOL_NAMES: ReadonlySet<string> = new Set([
  'Read',
  'Write',
  'Edit',
  'MultiEdit',
  'NotebookEdit',
  'create_file',
  'str_replace_edit',
  'multi_edit',
  'Grep',
  'Search',
  'Glob',
  'Fetch',
  'Think',
  'Thinking',
  'read',
  'write',
  'edit',
  'grep',
  'search',
  'fetch',
  'think',
  'glob',
]);

const CONTENT_TOOL_NAMES_LOWER: ReadonlySet<string> = new Set(
  [...CONTENT_TOOL_NAMES].map((name) => name.toLowerCase()),
);

const PARTIAL_REDACT_TOOL_NAMES_LOWER: ReadonlySet<string> = new Set([
  'bash',
  'shell',
  'execute',
  'terminal',
]);

export function isContentToolName(toolName: string): boolean {
  const normalized = toolName.trim().toLowerCase();
  if (!normalized) return false;
  return CONTENT_TOOL_NAMES_LOWER.has(normalized);
}

export function isPartialRedactToolName(toolName: string): boolean {
  const normalized = toolName.trim().toLowerCase();
  if (!normalized) return false;
  return PARTIAL_REDACT_TOOL_NAMES_LOWER.has(normalized);
}

export function shouldFullyRedactToolPayload(toolName: string): boolean {
  return !isPartialRedactToolName(toolName);
}

export function telemetrySafeToolName(toolName: string): string {
  return canonicalizeToolAnalyticsName(toolName);
}

export function toolPayloadRedactionPlaceholder(
  toolName: string,
  direction: 'input' | 'output',
): string {
  const label = toolName.trim() || 'unnamed';
  if (isContentToolName(label)) {
    return `[REDACTED:tool_${direction}:content_tool:${telemetrySafeToolName(label)}]`;
  }
  return `[REDACTED:tool_${direction}:unknown_tool]`;
}

// ---------------------------------------------------------------------------
// Stubbed payload builders and transport functions.
// ---------------------------------------------------------------------------

export function buildSafeRunQualityProjectionV1(
  _input: {
    prefs: TelemetryPrefs;
    messageOutput?: string;
    errorMessage?: string;
    errorCode?: string;
    failure?: RunFailureClassification;
    tools?: readonly ToolCallSummary[];
    attachmentManifest?: readonly AttachmentManifestEntry[];
    artifactManifest?: readonly ArtifactManifestEntry[];
    inputTextSnapshotManifest?: readonly InputTextSnapshotManifestEntry[];
    manifestCompleteness?: ObjectManifestCompleteness;
    exitCode?: number | null;
    signal?: string | null;
    stderr?: StreamTailSummary;
    stdout?: StreamTailSummary;
    diagnostics?: RunDiagnosticsAnalytics;
  },
): SafeRunQualityV1 | undefined {
  return undefined;
}

export function buildTracePayload(
  _ctx: ReportContext,
  _deliveryPurpose: 'final' | 'object-registration' = 'final',
): unknown[] {
  return [];
}

type TransportAttemptObserver = () => void;

export async function postLangfuseBatch(
  _config: LangfuseConfig,
  _batch: unknown[],
  _fetchImpl: typeof fetch,
  _onAttempt?: TransportAttemptObserver,
): Promise<LangfuseDeliveryState> {
  return SKIPPED_DELIVERY_STATE;
}

export async function postLegacyTelemetryBatch(
  _config: RunTelemetrySinkConfig,
  _batch: unknown[],
  _options: PostLegacyTelemetryBatchOptions = {},
): Promise<LangfuseDeliveryState> {
  return SKIPPED_DELIVERY_STATE;
}

export const legacyLangfuseRunExporter: RunObservationExporter<
  ReportContext,
  ReportRunOpts,
  LangfuseDeliveryState
> = {
  id: 'legacy-langfuse-ingestion-v1',
  exportRun: async () => SKIPPED_DELIVERY_STATE,
};

export function reportRunCompleted(
  _ctx: ReportContext,
  _opts: ReportRunOpts = {},
): Promise<LangfuseDeliveryState> {
  return Promise.resolve(SKIPPED_DELIVERY_STATE);
}

export function buildFeedbackPayload(_ctx: FeedbackReportContext): unknown[] {
  return [];
}

export async function reportRunFeedback(
  _ctx: FeedbackReportContext,
  _opts: ReportFeedbackOpts = {},
): Promise<void> {
  return;
}
