import { fetch } from 'expo/fetch';

import { resolveApiBaseUrl } from '@/api/apiConfig';
import type {
  MessageCitation,
  MessageTokenUsage,
  SendChatMessageRequest,
} from '@/api/conversationsApi';

export type StreamedAssistantMessage = {
  id: string;
  conversationId: string;
  role: 'assistant';
  content: string;
  citations?: MessageCitation[];
  tokenUsage?: MessageTokenUsage;
  createdAt: string;
};

export type ChatStreamCallbacks = {
  onConversation?: (conversationId: string) => void;
  onChunk?: (content: string) => void;
  onDone?: (message: StreamedAssistantMessage) => void;
  onError?: (message: string) => void;
};

const STREAMING_CHAT_ENABLED = false;

export function isChatStreamingSupported() {
  return (
    STREAMING_CHAT_ENABLED &&
    typeof ReadableStream !== 'undefined' &&
    typeof TextDecoder !== 'undefined'
  );
}

export async function streamChatMessage({
  accessToken,
  body,
  callbacks,
}: {
  accessToken: string;
  body: SendChatMessageRequest;
  callbacks?: ChatStreamCallbacks;
}) {
  if (!isChatStreamingSupported()) {
    throw new Error('Streaming chat is disabled until mobile runtime validation is complete.');
  }

  const response = await fetch(`${resolveApiBaseUrl()}/ai/chat?stream=true`, {
    method: 'POST',
    headers: {
      accept: 'text/event-stream',
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ...body,
      action: body.action ?? 'CHAT',
      stream: true,
    }),
  });

  if (!response.ok) {
    const message = await getResponseErrorMessage(response);
    callbacks?.onError?.(message);
    throw new Error(message);
  }

  if (!response.body) {
    const message = 'Streaming response body is unavailable in this runtime.';
    callbacks?.onError?.(message);
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        flushEventBuffer(buffer, callbacks);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = flushBufferedEvents(buffer, callbacks);
    }
  } finally {
    reader.releaseLock();
  }
}

function flushBufferedEvents(buffer: string, callbacks?: ChatStreamCallbacks) {
  let remainingBuffer = buffer;

  while (true) {
    const boundaryIndex = getEventBoundaryIndex(remainingBuffer);

    if (boundaryIndex === -1) {
      return remainingBuffer;
    }

    const separatorLength =
      remainingBuffer.slice(boundaryIndex, boundaryIndex + 4) === '\r\n\r\n' ? 4 : 2;
    const rawEvent = remainingBuffer.slice(0, boundaryIndex);

    remainingBuffer = remainingBuffer.slice(boundaryIndex + separatorLength);
    dispatchStreamEvent(rawEvent, callbacks);
  }
}

function flushEventBuffer(buffer: string, callbacks?: ChatStreamCallbacks) {
  const trimmed = buffer.trim();

  if (!trimmed) {
    return;
  }

  dispatchStreamEvent(trimmed, callbacks);
}

function dispatchStreamEvent(rawEvent: string, callbacks?: ChatStreamCallbacks) {
  const lines = rawEvent.split(/\r?\n/);
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }

  if (!dataLines.length) {
    return;
  }

  const payload = JSON.parse(dataLines.join('\n')) as {
    conversationId?: string;
    content?: string;
    message?: StreamedAssistantMessage;
    messageText?: string;
  };

  if (eventName === 'conversation' && payload.conversationId) {
    callbacks?.onConversation?.(payload.conversationId);
    return;
  }

  if (eventName === 'chunk' && payload.content) {
    callbacks?.onChunk?.(payload.content);
    return;
  }

  if (eventName === 'done' && payload.message) {
    callbacks?.onDone?.(payload.message);
    return;
  }

  if (eventName === 'error') {
    const message = getSseErrorMessage(payload);
    callbacks?.onError?.(message);
    throw new Error(message);
  }
}

function getEventBoundaryIndex(buffer: string) {
  const unixBoundaryIndex = buffer.indexOf('\n\n');
  const windowsBoundaryIndex = buffer.indexOf('\r\n\r\n');

  if (unixBoundaryIndex === -1) {
    return windowsBoundaryIndex;
  }

  if (windowsBoundaryIndex === -1) {
    return unixBoundaryIndex;
  }

  return Math.min(unixBoundaryIndex, windowsBoundaryIndex);
}

async function getResponseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: {
        message?: string;
      };
    };

    return payload.error?.message || `Streaming request failed (${response.status}).`;
  } catch {
    return `Streaming request failed (${response.status}).`;
  }
}

function getSseErrorMessage(payload: { messageText?: string; message?: unknown }) {
  return (
    payload.messageText ||
    (typeof payload.message === 'string' ? payload.message : undefined) ||
    'Streaming chat failed before a full response was received.'
  );
}
