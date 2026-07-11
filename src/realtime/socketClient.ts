import { io, type Socket } from 'socket.io-client';

import { resolveApiBaseUrl } from '@/api/apiSlice';

export const REALTIME_EVENTS = {
  notificationNew: 'notification:new',
  documentStatus: 'document:status',
} as const;

export type DocumentStatusEvent = {
  documentId: string;
  status: 'READY' | 'FAILED';
  title: string;
  processingError?: string;
};

export type RealtimeNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata?: {
    documentId?: string;
    quizId?: string;
    [key: string]: unknown;
  };
  readAt: string | null;
  createdAt: string;
};

export type NotificationNewEvent = {
  notification: RealtimeNotification;
};

let socket: Socket | null = null;
let currentToken: string | null = null;

export function connectSocket(accessToken: string) {
  if (socket && currentToken === accessToken) {
    return socket;
  }

  disconnectSocket();

  socket = io(resolveSocketBaseUrl(), {
    auth: {
      token: accessToken,
    },
    transports: ['websocket'],
    reconnection: true,
  });
  currentToken = accessToken;

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = null;
}

function resolveSocketBaseUrl() {
  return resolveApiBaseUrl().replace(/\/api\/v1$/, '');
}
