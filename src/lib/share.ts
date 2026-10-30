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

/**
 * Encode a plan into a URL fragment, compressing it when that is smaller.
 *
 * @param plan the plan to share
 * @returns the fragment body (no leading `#`), safe for a URL
 */
export async function encodeShareFragment(plan: Plan): Promise<string> {
  const json = JSON.stringify(toSharePayload(plan));
  const bytes = new TextEncoder().encode(json);
  const compressed = await deflate(bytes);
  if (compressed && compressed.length < bytes.length) {
    return `${COMPRESSED_PREFIX}.${bytesToBase64Url(compressed)}`;
  }
  return `${PLAIN_PREFIX}.${bytesToBase64Url(bytes)}`;
}

/** Split a fragment into its prefix and body, or null when it has no separator. */
function splitShareFragment(fragment: string): { prefix: string; body: string } | null {
  const trimmed = fragment.trim().replace(/^#/, '');
  const separator = trimmed.indexOf('.');
  if (separator < 0) return null;
  const body = trimmed.slice(separator + 1);
  if (!body) return null;
  return { prefix: trimmed.slice(0, separator), body };
}

/** Decode base64url and inflate a compressed fragment when required. */
async function decodeFragmentBytes(prefix: string, body: string): Promise<Uint8Array | null> {
  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(body);
  } catch {
    return null;
  }
  if (prefix === COMPRESSED_PREFIX) return inflate(bytes);
  return prefix === PLAIN_PREFIX ? bytes : null;
}

/** Parse and version-check the JSON payload inside a fragment. */
function readSharePayload(bytes: Uint8Array): Partial<SharePayload> | null {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (!json || typeof json !== 'object') return null;
  const payload = json as Partial<SharePayload>;
  return payload.v === 1 ? payload : null;
}

/** Build and validate a plan from a payload, filling the fields a share omits. */
function restoreSharedPlan(payload: Partial<SharePayload>): Plan | null {
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

/**
 * Decode a share fragment back into a validated plan.
 *
 * @param fragment the fragment body, with or without a leading `#`
 * @returns the restored plan, or null when the fragment is invalid or outdated
 */
export async function decodeShareFragment(fragment: string): Promise<Plan | null> {
  const parts = splitShareFragment(fragment);
  if (!parts) return null;
  const bytes = await decodeFragmentBytes(parts.prefix, parts.body);
  if (!bytes) return null;
  const payload = readSharePayload(bytes);
  return payload ? restoreSharedPlan(payload) : null;
}

/**
 * Build the full share URL for an encoded fragment.
 *
 * @param origin the site origin, with or without a trailing slash
 * @param fragment the encoded fragment body
 * @returns the absolute plan URL with the fragment attached
 */
export function buildShareUrl(origin: string, fragment: string): string {
  return `${origin.replace(/\/$/, '')}/plan#${fragment}`;
}
