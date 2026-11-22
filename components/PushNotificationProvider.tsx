import { useMutation, useQuery } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useCloudSync } from '@/components/CloudSyncProvider';
import { api } from '@/convex/_generated/api';
import {
  getDeviceTimeZone,
  registerForPushNotificationsAsync,
} from '@/utils/reg_push_notifications';

type PushNotificationContextValue = {
  expoPushToken: string | null;
  registerNow: () => Promise<string | null>;
};

const PushNotificationContext = createContext<PushNotificationContextValue | null>(
  null,
);

function handleNotificationNavigation(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const data = response.notification.request.content.data as
    | { type?: string }
    | undefined;
  if (data?.type === 'daily-nudge') {
    router.push('/add-transaction');
  } else if (data?.type === 'weekly-wealth') {
    router.navigate('/(tabs)/wealth');
  } else if (data?.type === 'budget-alert') {
    router.push('/budget');
  }
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCloudSync();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip');
  const storePushToken = useMutation(api.users.storePushToken);

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const lastHandledIdRef = useRef<string | null>(null);

  const registerNow = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      if (isAuthenticated) {
        await storePushToken({
          token,
          timezone: getDeviceTimeZone(),
        }).catch(() => {});
      }
    }
    return token;
  }, [isAuthenticated, storePushToken]);

  useEffect(() => {
    if (!isAuthenticated || !viewer) return;
    if (viewer.notificationsEnabled === false) return;
    void registerNow();
  }, [isAuthenticated, viewer?.notificationsEnabled, registerNow]);

  useEffect(() => {
    if (!isAuthenticated) return;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const id = response.notification.request.identifier;
        if (lastHandledIdRef.current === id) return;
        lastHandledIdRef.current = id;
        handleNotificationNavigation(response);
      })
      .catch(() => {});

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const id = response.notification.request.identifier;
        lastHandledIdRef.current = id;
        handleNotificationNavigation(response);
      });

    return () => {
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  const value = useMemo<PushNotificationContextValue>(
    () => ({ expoPushToken, registerNow }),
    [expoPushToken, registerNow],
  );

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotification() {
  const ctx = useContext(PushNotificationContext);
  if (!ctx) {
    throw new Error('usePushNotification must be used inside PushNotificationProvider');
  }
  return ctx;
}

