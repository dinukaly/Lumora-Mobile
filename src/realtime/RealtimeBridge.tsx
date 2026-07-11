import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { apiSlice } from '@/api/apiSlice';
import { documentsApi } from '@/api/documentsApi';
import { notificationsApi, type NotificationItem } from '@/api/notificationsApi';
import {
  connectSocket,
  disconnectSocket,
  REALTIME_EVENTS,
  type DocumentStatusEvent,
  type NotificationNewEvent,
} from '@/realtime/socketClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/store';

export function RealtimeBridge({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);

    function handleDocumentStatus(payload: DocumentStatusEvent) {
      patchDocumentCaches(dispatch, payload);
      dispatch(apiSlice.util.invalidateTags(['Documents', 'Progress']));
    }

    function handleNotificationNew(payload: NotificationNewEvent) {
      patchNotificationCaches(dispatch, payload.notification);

      const tagsToInvalidate: (
        | 'Notifications'
        | 'Progress'
        | 'Flashcards'
        | 'Quizzes'
      )[] = ['Notifications', 'Progress'];

      if (payload.notification.type.includes('FLASHCARD')) {
        tagsToInvalidate.push('Flashcards');
      }

      if (payload.notification.type.includes('QUIZ')) {
        tagsToInvalidate.push('Quizzes');
      }

      dispatch(apiSlice.util.invalidateTags(tagsToInvalidate));
    }

    socket.on(REALTIME_EVENTS.documentStatus, handleDocumentStatus);
    socket.on(REALTIME_EVENTS.notificationNew, handleNotificationNew);

    return () => {
      socket.off(REALTIME_EVENTS.documentStatus, handleDocumentStatus);
      socket.off(REALTIME_EVENTS.notificationNew, handleNotificationNew);
      disconnectSocket();
    };
  }, [accessToken, dispatch, isAuthenticated]);

  return <>{children}</>;
}

function patchDocumentCaches(
  dispatch: ReturnType<typeof useAppDispatch>,
  payload: DocumentStatusEvent,
) {
  const updatedAt = new Date().toISOString();

  dispatch(
    documentsApi.util.updateQueryData('getDocument', payload.documentId, (draft) => {
      draft.status = payload.status;
      draft.title = payload.title;
      draft.processingError = payload.processingError ?? null;
      draft.updatedAt = updatedAt;
    }),
  );

  const cachedListArgs = documentsApi.util.selectCachedArgsForQuery(
    store.getState(),
    'listDocuments',
  );

  for (const args of cachedListArgs) {
    dispatch(
      documentsApi.util.updateQueryData('listDocuments', args, (draft) => {
        const documentIndex = draft.documents.findIndex(
          (document) => document._id === payload.documentId,
        );

        if (documentIndex === -1) {
          return;
        }

        if (args?.status && args.status !== payload.status) {
          draft.documents.splice(documentIndex, 1);
          draft.pagination.total = Math.max(0, draft.pagination.total - 1);
          return;
        }

        draft.documents[documentIndex].status = payload.status;
        draft.documents[documentIndex].title = payload.title;
        draft.documents[documentIndex].processingError =
          payload.processingError ?? null;
        draft.documents[documentIndex].updatedAt = updatedAt;
      }),
    );
  }
}

function patchNotificationCaches(
  dispatch: ReturnType<typeof useAppDispatch>,
  notification: NotificationItem,
) {
  const cachedNotificationArgs = notificationsApi.util.selectCachedArgsForQuery(
    store.getState(),
    'getNotifications',
  );

  for (const args of cachedNotificationArgs) {
    dispatch(
      notificationsApi.util.updateQueryData('getNotifications', args, (draft) => {
        if (draft.notifications.some((item) => item.id === notification.id)) {
          return;
        }

        draft.total += 1;
        draft.unreadCount += notification.readAt ? 0 : 1;

        const isUnreadOnly = Boolean(args?.unreadOnly);
        const isFirstPage = (args?.page ?? 1) === 1;
        const limit = args?.limit ?? draft.notifications.length + 1;

        if (isUnreadOnly && notification.readAt) {
          return;
        }

        if (isFirstPage) {
          draft.notifications.unshift(notification);

          if (draft.notifications.length > limit) {
            draft.notifications.pop();
          }
        }
      }),
    );
  }
}
