// Prompt-stack telemetry builder.
//
// Forge Design fork: all telemetry functions are no-op stubs that return
// minimal valid objects. No prompt content is captured or retained for
// telemetry purposes. Type exports are preserved so callers (server.ts,
// runtimes/*-child-evidence.ts, task-observation-rollout.ts, and tests)
// continue to compile.

import { createHash } from 'node:crypto';

import type { StrategyInputStageV2 } from '@open-design/contracts';
import type { StrategyTaskFinalTextIdentity } from './strategies/task-store.js';

export const PROMPT_STACK_REDACTION_VERSION = 'prompt-stack-redaction-v1';
export const PROMPT_STACK_PATH_MARKER = '[REDACTED:path]';

export type PromptTelemetrySectionKind =
  | 'formOverride'
  | 'daemonSystemPrompt'
  | 'runtimeToolPrompt'
  | 'researchCommandContract'
  | 'runContextPrompt'
  | 'clientSystemPrompt'
  | 'echoGuard'
  | 'userRequest'
  | 'skillPrompt'
  | 'designSystemPrompt'
  | 'pluginStagePrompt'
  | 'odNextExactFinalText'
  | 'cwdHint'
  | 'linkedDirsHint'
  | 'attachments'
  | 'commentAttachments'
  | 'promptImagePaths';

export interface PromptTelemetryInputSection {
  kind: PromptTelemetrySectionKind;
  content?: string | null;
  captureContent?: boolean;
  metadata?: unknown;
}

export interface PromptTelemetrySection {
  kind: PromptTelemetrySectionKind;
  ordinal: number;
  present: boolean;
  contentMode: 'redacted-section-content' | 'metadata-only';
  rawBytes: number;
  redactedBytes: number;
  fingerprint: string;
  truncated: boolean;
  truncationReason?: 'section_byte_limit' | 'total_budget_exceeded';
  redactedContent?: string;
  metadata?: Record<string, unknown>;
}

export interface PromptStackTelemetry {
  redactionVersion: typeof PROMPT_STACK_REDACTION_VERSION;
  promptFingerprint: string;
  stackFingerprint: string;
  rawBytes: number;
  redactedBytes: number;
  sectionCount: number;
  redactedContentBytes: number;
  redactedContentBudgetBytes: number;
  sections: PromptTelemetrySection[];
  odNextExactSend?: OdNextExactSendPromptEvidenceV1;
}

export interface OdNextExactSendPromptEvidenceV1 {
  schema: 'open-design.od-next-exact-send-prompt/v1';
  boundary: 'hostComposed';
  kind: StrategyTaskFinalTextIdentity['kind'];
  promptSchema: StrategyTaskFinalTextIdentity['schema'];
  stage: StrategyInputStageV2;
  sha256: string;
  utf8Bytes: number;
}

export class InvalidOdNextExactSendPromptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOdNextExactSendPromptError';
  }
}

export interface StructuredPromptStackInput {
  type: 'open-design.prompt-stack';
  redactionVersion: typeof PROMPT_STACK_REDACTION_VERSION;
  promptFingerprint: string;
  stackFingerprint: string;
  sectionCount: number;
  redactedContentBytes: number;
  redactedContentBudgetBytes: number;
  sections: Array<{
    kind: PromptTelemetrySectionKind;
    ordinal: number;
    contentMode: PromptTelemetrySection['contentMode'];
    rawBytes: number;
    redactedBytes: number;
    fingerprint: string;
    truncated: boolean;
    truncationReason?: PromptTelemetrySection['truncationReason'];
    redactedContent?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface SafeChildPromptInput extends Record<string, unknown> {
  type: 'open-design.child-injected-prompt';
  redactionVersion: typeof PROMPT_STACK_REDACTION_VERSION;
  messageCount: number;
  capturedMessageCount: number;
  rawBytes: number;
  redactedContentBytes: number;
  redactedContentBudgetBytes: number;
  truncated: boolean;
  messages: Array<{
    ordinal: number;
    rawBytes: number;
    redactedBytes: number;
    fingerprint: string;
    truncated: boolean;
    redactedContent: string;
  }>;
}

export interface SafeChildPromptTelemetry {
  hash: string;
  bytes: number;
  safePayload: SafeChildPromptInput;
  truncated: boolean;
}

// ---------------------------------------------------------------------------
// Stubbed functions — return minimal valid objects, no content captured.
// ---------------------------------------------------------------------------

export function redactLocalPaths(input: string): string {
  return input;
}

export function buildSafeChildPromptTelemetry(
  messages: readonly string[],
): SafeChildPromptTelemetry {
  const rawBytes = messages.reduce(
    (total, message) => total + Buffer.byteLength(message, 'utf8'),
    0,
  );
  return {
    hash: createHash('sha256').update(JSON.stringify(messages), 'utf8').digest('hex'),
    bytes: rawBytes,
    safePayload: {
      type: 'open-design.child-injected-prompt',
      redactionVersion: PROMPT_STACK_REDACTION_VERSION,
      messageCount: messages.length,
      capturedMessageCount: 0,
      rawBytes,
      redactedContentBytes: 0,
      redactedContentBudgetBytes: 0,
      truncated: false,
      messages: [],
    },
    truncated: false,
  };
}

export function buildPromptStackTelemetry({
  composedPrompt,
  sections: _sections,
}: {
  composedPrompt: string;
  sections: PromptTelemetryInputSection[];
}): PromptStackTelemetry {
  const rawBytes = Buffer.byteLength(composedPrompt, 'utf8');
  return {
    redactionVersion: PROMPT_STACK_REDACTION_VERSION,
    promptFingerprint: createHash('sha256').update(composedPrompt, 'utf8').digest('hex'),
    stackFingerprint: '',
    rawBytes,
    redactedBytes: rawBytes,
    sectionCount: 0,
    redactedContentBytes: 0,
    redactedContentBudgetBytes: 0,
    sections: [],
  };
}

export function bindOdNextExactSendPromptEvidence(input: {
  telemetry: PromptStackTelemetry;
  finalText: string;
  persisted: StrategyTaskFinalTextIdentity;
  stage: StrategyInputStageV2;
}): PromptStackTelemetry {
  return input.telemetry;
}

export function assertOdNextExactSendPromptEvidence(
  _input: {
    telemetry: PromptStackTelemetry;
    persisted: StrategyTaskFinalTextIdentity;
    stage: StrategyInputStageV2;
  },
): void {
  // No-op: validation disabled in Forge Design fork.
}

export function promptStackWithoutContent(
  telemetry: PromptStackTelemetry,
): PromptStackTelemetry {
  return {
    ...telemetry,
    redactedContentBytes: 0,
    sections: telemetry.sections.map(
      ({ redactedContent: _content, ...section }) => section,
    ),
  };
}

export function structuredPromptStackInput(
  telemetry: PromptStackTelemetry,
): StructuredPromptStackInput {
  return {
    type: 'open-design.prompt-stack',
    redactionVersion: telemetry.redactionVersion,
    promptFingerprint: telemetry.promptFingerprint,
    stackFingerprint: telemetry.stackFingerprint,
    sectionCount: telemetry.sectionCount,
    redactedContentBytes: telemetry.redactedContentBytes,
    redactedContentBudgetBytes: telemetry.redactedContentBudgetBytes,
    sections: telemetry.sections.map((section) => ({
      kind: section.kind,
      ordinal: section.ordinal,
      contentMode: section.contentMode,
      rawBytes: section.rawBytes,
      redactedBytes: section.redactedBytes,
      fingerprint: section.fingerprint,
      truncated: section.truncated,
      ...(section.truncationReason
        ? { truncationReason: section.truncationReason }
        : {}),
      ...(section.redactedContent !== undefined
        ? { redactedContent: section.redactedContent }
        : {}),
      ...(section.metadata ? { metadata: section.metadata } : {}),
    })),
  };
}

export function buildPromptStackFlatMetadata(
  telemetry: PromptStackTelemetry,
): Record<string, unknown> {
  return {
    promptStack_redactionVersion: telemetry.redactionVersion,
    promptStack_promptFingerprint: telemetry.promptFingerprint,
    promptStack_stackFingerprint: telemetry.stackFingerprint,
    promptStack_sectionCount: telemetry.sectionCount,
    promptStack_redactedContentBytes: telemetry.redactedContentBytes,
    promptStack_redactedContentBudgetBytes: telemetry.redactedContentBudgetBytes,
  };
}
