import React from "react";
import { Stack } from "expo-router";
import SafeArea from "@/components/SafeArea";
import { useState } from "react";
import { useFonts } from "expo-font";
import AppLoading from "expo-app-loading";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
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
