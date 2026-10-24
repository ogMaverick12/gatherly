import {
  PlanSchema,
  type Intake,
  type Milestone,
  type Plan,
  type PlanTask,
  type Vendor,
} from '@/lib/plan';

/**
 * Share links.
 *
 * A share link carries the plan in the URL *fragment*, which browsers do
 * not send to the server. Nothing about the plan passes through the
 * network, and no server state is created.
 *
 * The payload is a compact JSON document, deflated when the browser
 * supports it, encoded as base64url so it is safe in a URL.
 */

export const SHARE_VERSION = 'g1' as const;
const COMPRESSED_PREFIX = 'g1z';
const PLAIN_PREFIX = 'g1j';

export interface SharePayload {
  readonly v: 1;
  readonly intake: Intake;
  readonly tasks: readonly PlanTask[];
  readonly vendors: readonly Vendor[];
  readonly milestones: readonly Milestone[];
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const source = new Response(bytes.slice()).body;
    if (!source) return null;
    const stream = source.pipeThrough(new CompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const source = new Response(bytes.slice()).body;
    if (!source) return null;
    const stream = source.pipeThrough(new DecompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/** The part of a plan that is worth sharing. Chat and ideas are not. */
export function toSharePayload(plan: Plan): SharePayload {
  return {
    v: 1,
    intake: plan.intake,
    tasks: plan.tasks,
    vendors: plan.vendors,
    milestones: plan.milestones,
  };
}

export async function encodeShareFragment(plan: Plan): Promise<string> {
  const json = JSON.stringify(toSharePayload(plan));
  const bytes = new TextEncoder().encode(json);
  const compressed = await deflate(bytes);
  if (compressed && compressed.length < bytes.length) {
    return `${COMPRESSED_PREFIX}.${bytesToBase64Url(compressed)}`;
  }
  return `${PLAIN_PREFIX}.${bytesToBase64Url(bytes)}`;
}

export async function decodeShareFragment(fragment: string): Promise<Plan | null> {
  const trimmed = fragment.trim().replace(/^#/, '');
  const separator = trimmed.indexOf('.');
  if (separator < 0) return null;
  const prefix = trimmed.slice(0, separator);
  const body = trimmed.slice(separator + 1);
  if (!body) return null;

  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(body);
  } catch {
    return null;
  }

  if (prefix === COMPRESSED_PREFIX) {
    const inflated = await inflate(bytes);
    if (!inflated) return null;
    bytes = inflated;
  } else if (prefix !== PLAIN_PREFIX) {
    return null;
  }

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }

  if (!json || typeof json !== 'object') return null;
  const payload = json as Partial<SharePayload>;
  if (payload.v !== 1) return null;

  const now = new Date();
  const candidate = {
    version: 1,
    id: `shared_${now.getTime().toString(36)}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    intake: payload.intake,
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    vendors: Array.isArray(payload.vendors) ? payload.vendors : [],
    milestones: Array.isArray(payload.milestones) ? payload.milestones : [],
    ideas: [],
    chat: [],
    settings: {
      theme: 'system',
      textSize: 'standard',
      calmMode: false,
      reducedMotion: false,
    },
  };

  const parsed = PlanSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function buildShareUrl(origin: string, fragment: string): string {
  return `${origin.replace(/\/$/, '')}/plan#${fragment}`;
}
