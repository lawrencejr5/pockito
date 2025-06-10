import React from "react";

import SafeArea from "@/components/SafeArea";
import { Stack } from "expo-router";

const AuthLayout = () => {
  return (
    <SafeArea>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
      </Stack>
    </SafeArea>
  );
};

export default AuthLayout;
