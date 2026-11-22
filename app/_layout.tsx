import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import SignInScreen from "@/app/sign-in";
import { AppLoader } from "@/components/AppLoader";
import { BudgetsProvider, useBudgets } from "@/components/BudgetsProvider";
import {
  CloudSyncProvider,
  useCloudSync,
} from "@/components/CloudSyncProvider";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { CurrencyProvider, useCurrency } from "@/components/CurrencyProvider";
import { PaywallScreen } from "@/components/PaywallScreen";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import {
  SubscriptionProvider,
  useSubscription,
} from "@/components/SubscriptionProvider";
import {
  TransactionsProvider,
  useTransactions,
} from "@/components/TransactionsProvider";
import { WealthProvider, useWealth } from "@/components/WealthProvider";
import { useColorScheme } from "@/components/useColorScheme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset & auth loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "GoogleSans-Regular": require("../assets/fonts/GoogleSans-Regular.ttf"),
    "GoogleSans-Medium": require("../assets/fonts/GoogleSans-Medium.ttf"),
    "GoogleSans-SemiBold": require("../assets/fonts/GoogleSans-SemiBold.ttf"),
    "GoogleSans-Bold": require("../assets/fonts/GoogleSans-Bold.ttf"),
    "GoogleSans-Italic": require("../assets/fonts/GoogleSans-Italic.ttf"),
    "GoogleSans-MediumItalic": require("../assets/fonts/GoogleSans-MediumItalic.ttf"),
    "GoogleSans-SemiBoldItalic": require("../assets/fonts/GoogleSans-SemiBoldItalic.ttf"),
    "GoogleSans-BoldItalic": require("../assets/fonts/GoogleSans-BoldItalic.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexClientProvider>
        <CloudSyncProvider>
          <SubscriptionProvider>
            <PushNotificationProvider>
              <CurrencyProvider>
                <TransactionsProvider>
                  <BudgetsProvider>
                    <WealthProvider>
                      <RootLayoutNav />
                    </WealthProvider>
                  </BudgetsProvider>
                </TransactionsProvider>
              </CurrencyProvider>
            </PushNotificationProvider>
          </SubscriptionProvider>
        </CloudSyncProvider>
      </ConvexClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isAuthLoading, isSyncing } = useCloudSync();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const { isLoading: txLoading } = useTransactions();
  const { isLoading: budgetsLoading } = useBudgets();
  const { isLoading: wealthLoading } = useWealth();
  const { isLoading: currencyLoading } = useCurrency();
  const [showBrandSplash, setShowBrandSplash] = useState(true);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splashOpacity = useSharedValue(0);

  const splashImageStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: splashOpacity.value,
  }));

  useEffect(() => {
    if (!isAuthLoading) {
      SplashScreen.hideAsync().catch(() => {});
      splashOpacity.value = withTiming(1, {
        duration: 550,
        easing: Easing.out(Easing.cubic),
      });
      if (!splashTimerRef.current) {
        splashTimerRef.current = setTimeout(() => {
          setShowBrandSplash(false);
        }, 2000);
      }
    }
  }, [isAuthLoading, splashOpacity]);

  useEffect(() => {
    return () => {
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }
    };
  }, []);

  if (isAuthLoading || showBrandSplash) {
    return (
      <Animated.View
        exiting={FadeOut.duration(250)}
        style={{ flex: 1, backgroundColor: "#161714" }}
      >
        <Animated.View style={splashImageStyle}>
          <Image
            source={require("../assets/images/splash-screen.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    );
  }

  const isDataLoading =
    txLoading ||
    budgetsLoading ||
    wealthLoading ||
    currencyLoading ||
    subscriptionLoading;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {!isAuthenticated ? (
        <SignInScreen />
      ) : isSyncing || isDataLoading ? (
        <AppLoader />
      ) : !isSubscribed ? (
        <PaywallScreen />
      ) : (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-transaction"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="wealth-item"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="report"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="budget"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="transaction/[id]"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>
      )}
    </ThemeProvider>
  );
}
