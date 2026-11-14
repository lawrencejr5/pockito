import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { CloudSyncProvider, useCloudSync } from '@/components/CloudSyncProvider';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { CurrencyProvider } from '@/components/CurrencyProvider';
import { TransactionsProvider } from '@/components/TransactionsProvider';
import { WealthProvider } from '@/components/WealthProvider';
import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'GoogleSans-Regular': require('../assets/fonts/GoogleSans-Regular.ttf'),
    'GoogleSans-Medium': require('../assets/fonts/GoogleSans-Medium.ttf'),
    'GoogleSans-SemiBold': require('../assets/fonts/GoogleSans-SemiBold.ttf'),
    'GoogleSans-Bold': require('../assets/fonts/GoogleSans-Bold.ttf'),
    'GoogleSans-Italic': require('../assets/fonts/GoogleSans-Italic.ttf'),
    'GoogleSans-MediumItalic': require('../assets/fonts/GoogleSans-MediumItalic.ttf'),
    'GoogleSans-SemiBoldItalic': require('../assets/fonts/GoogleSans-SemiBoldItalic.ttf'),
    'GoogleSans-BoldItalic': require('../assets/fonts/GoogleSans-BoldItalic.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexClientProvider>
        <CloudSyncProvider>
          <CurrencyProvider>
            <TransactionsProvider>
              <WealthProvider>
                <RootLayoutNav />
              </WealthProvider>
            </TransactionsProvider>
          </CurrencyProvider>
        </CloudSyncProvider>
      </ConvexClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isCloudMode, isAuthenticated } = useCloudSync();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sign-in"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: !isCloudMode || isAuthenticated,
          }}
        />
        <Stack.Screen
          name="add-transaction"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}
