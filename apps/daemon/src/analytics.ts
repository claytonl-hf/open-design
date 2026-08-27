// Daemon-side analytics capture.
//
// Forge Design fork: all telemetry is no-op. createAnalyticsService always
// returns NOOP_SERVICE. No data is sent to PostHog or any third party.

import crypto from 'node:crypto';
import type { Request } from 'express';
import {
  anonymizeArtifactId as anonymizeArtifactIdShared,
  type AnalyticsClientType,
  type AnalyticsAttributionQuality,
  type AnalyticsConfigResponse,
  type AnalyticsDistributionMechanism,
  type AnalyticsEntrySurface,
  type AnalyticsHostProduct,
  type AnalyticsPublisherClass,
} from '@open-design/contracts/analytics';
import { readTelemetryEnvironment } from './telemetry-environment.js';

export interface AnalyticsContext {
  deviceId: string;
  sessionId: string;
  clientType: AnalyticsClientType;
  locale: string;
  requestId: string | null;
  entrySurface?: AnalyticsEntrySurface;
  hostProduct?: AnalyticsHostProduct;
  externalPluginId?: string;
  externalPluginVersion?: string;
  distributionMechanism?: AnalyticsDistributionMechanism;
  publisherClass?: AnalyticsPublisherClass;
  attributionQuality?: AnalyticsAttributionQuality;
  mcpSessionId?: string;
}

// Stubbed: always returns null (no analytics context).
export function readAnalyticsContext(_req: Request): AnalyticsContext | null {
  return null;
}

export interface PosthogConfig {
  key: string;
  host: string;
  env: string;
}

// Stubbed: always returns null (no PostHog config).
export function readPosthogConfig(
  _env: NodeJS.ProcessEnv = process.env,
): PosthogConfig | null {
  return null;
}

// Stubbed: always returns disabled.
export function readPublicConfigResponse(
  env: NodeJS.ProcessEnv = process.env,
): AnalyticsConfigResponse {
  return { enabled: false, env: readTelemetryEnvironment(env), key: null, host: null };
}

export interface AnalyticsService {
  capture(args: {
    eventName: string;
    context: AnalyticsContext;
    appVersion: string;
    properties: Record<string, unknown>;
    insertId: string;
  }): Promise<void>;
  captureSafety(args: {
    eventName: string;
    distinctId?: string;
    appVersion: string;
    properties: Record<string, unknown>;
    insertId?: string;
  }): Promise<void>;
  mergeAnonymousPerson(args: {
    anonymousDistinctId: string;
    distinctId: string;
    properties?: Record<string, unknown>;
    insertId?: string;
  }): Promise<void>;
  identifyGroup(args: {
    context: AnalyticsContext;
    groupType: 'workspace';
    groupKey: string;
    properties: Record<string, unknown>;
  }): Promise<void>;
  shutdown(): Promise<void>;
}

const NOOP_SERVICE: AnalyticsService = {
  capture: async () => undefined,
  captureSafety: async () => undefined,
  mergeAnonymousPerson: async () => undefined,
  identifyGroup: async () => undefined,
  shutdown: async () => undefined,
};

// Always returns the no-op service. No PostHog client is created.
export function createAnalyticsService(
  _args: { env?: NodeJS.ProcessEnv; dataDir: string },
): AnalyticsService {
  return NOOP_SERVICE;
}

// Re-export so server.ts and route handlers don't need a second import path.
export const anonymizeArtifactId = anonymizeArtifactIdShared;

// Generate a fresh insert_id for daemon-internal events.
export function newInsertId(): string {
  return crypto.randomUUID();
}
