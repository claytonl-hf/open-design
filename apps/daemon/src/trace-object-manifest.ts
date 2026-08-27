// Trace object manifest builder.
//
// Forge Design fork: telemetry is no-op. buildTraceObjectManifests always
// returns undefined. No object manifests are built or uploaded.

import type {
  ArtifactManifestEntry,
  ArtifactSummary,
  AttachmentManifestEntry,
  InputTextSnapshotManifestEntry,
  ObjectManifestCompleteness,
} from './langfuse-trace.js';

export interface TraceObjectUploadManifests {
  attachmentManifest?: AttachmentManifestEntry[];
  artifactManifest?: ArtifactManifestEntry[];
  inputTextSnapshotManifest?: InputTextSnapshotManifestEntry[];
  completeness: ObjectManifestCompleteness;
}

export interface TraceObjectSource {
  objectClass: 'attachment' | 'artifact' | 'input_text_snapshot';
  id: string;
  filename: string;
  mime: string;
  type?: string;
  body?: Buffer;
  sizeBytes?: number;
  reason?: string;
  source: string;
  truncated?: boolean;
}

export interface BuildTraceObjectManifestsOptions {
  installationId: string | null;
  projectId: string;
  runId: string;
  projectsRoot: string;
  projectMetadata?: Record<string, unknown> | null;
  attachmentPaths?: string[];
  artifacts?: TraceArtifactObjectSource[];
  prompt: string;
  prefs: {
    metrics?: boolean;
    content?: boolean;
    artifactManifest?: boolean;
  };
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
  uploadMode?: 'manifest-only' | 'upload';
}

export interface TraceArtifactObjectSource {
  summary: ArtifactSummary;
  sourcePath?: string;
}

// Stubbed: always returns undefined. No manifests are built or uploaded.
export async function buildTraceObjectManifests(
  _opts: BuildTraceObjectManifestsOptions,
): Promise<TraceObjectUploadManifests | undefined> {
  return undefined;
}
