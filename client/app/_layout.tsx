import React from "react";
import { Stack } from "expo-router";
import SafeArea from "@/components/SafeArea";
import { useFonts } from "expo-font";

import AppProvider from "@/context/AppProvider";

import { AuthContextType, useAuthContext } from "@/context/AuthContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Raleway-Bold": require("../assets/fonts/raleway/Raleway-Bold.ttf"),
    "Raleway-ExtraBold": require("../assets/fonts/raleway/Raleway-ExtraBold.ttf"),
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
    <AppProvider>
      <SafeArea>
        <StackContent />
      </SafeArea>
    </AppProvider>
  );
}

const StackContent = () => {
  const { isAuthenticated } = useAuthContext() as AuthContextType;
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated ? "(tabs)" : "(auth)"}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="(auth)" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
};
