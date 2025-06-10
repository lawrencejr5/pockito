import React from "react";
import { Stack } from "expo-router";
import SafeArea from "@/components/SafeArea";
import { useState } from "react";
import { useFonts } from "expo-font";
import AppLoading from "expo-app-loading";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [fontsLoaded] = useFonts({
    "Raleway-Black": require("../assets/fonts/raleway/Raleway-Black.ttf"),
    "Raleway-Bold": require("../assets/fonts/raleway/Raleway-Bold.ttf"),
    "Raleway-ExtraBold": require("../assets/fonts/raleway/Raleway-ExtraBold.ttf"),
    "Raleway-Light": require("../assets/fonts/raleway/Raleway-Light.ttf"),
    "Raleway-Medium": require("../assets/fonts/raleway/Raleway-Medium.ttf"),
    "Raleway-Regular": require("../assets/fonts/raleway/Raleway-Regular.ttf"),
    "Raleway-SemiBold": require("../assets/fonts/raleway/Raleway-SemiBold.ttf"),
    "Raleway-Thin": require("../assets/fonts/raleway/Raleway-Thin.ttf"),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <SafeArea>
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
    </SafeArea>
  );
}
