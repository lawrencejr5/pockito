import React from "react";
import { Stack } from "expo-router";
import SafeArea from "@/components/SafeArea";
import { useState } from "react";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [isAuthenticated] = useState(true);

  const [fontsLoaded] = useFonts({
    "Raleway-Bold": require("../assets/fonts/raleway/Raleway-Bold.ttf"),
    "Raleway-ExtraBold": require("../assets/fonts/raleway/Raleway-ExtraBold.ttf"),
    "Raleway-Medium": require("../assets/fonts/raleway/Raleway-Medium.ttf"),
    "Raleway-Regular": require("../assets/fonts/raleway/Raleway-Regular.ttf"),
    "Raleway-SemiBold": require("../assets/fonts/raleway/Raleway-SemiBold.ttf"),
    "Poppins-Regular": require("../assets/fonts/poppins/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../assets/fonts/poppins/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/poppins/Poppins-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
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
