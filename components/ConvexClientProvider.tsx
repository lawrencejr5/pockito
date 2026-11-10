import React, { ReactNode } from 'react';
import { Platform } from 'react-native';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ||
  (Constants.expoConfig?.extra?.convexUrl as string) ||
  'https://exciting-warthog-322.convex.cloud';

export const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      {children}
    </ConvexAuthProvider>
  );
}

