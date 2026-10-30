/**
 * Chat message factory used by the assistant controller.
 */

import type { ChatMessage } from '@/lib/plan';
import type { Mode } from '../components/assistant-stream';

/** A chat message with the id and timestamp the log expects. */
export function newMessage(
  role: ChatMessage['role'],
  content: string,
  mode: Mode | null,
): ChatMessage {
  const stamp = Date.now().toString(36);
  return {
    id: `chat_${role}_${stamp}`,
    role,
    content,
    mode,
    createdAt: new Date().toISOString(),
  };
}
