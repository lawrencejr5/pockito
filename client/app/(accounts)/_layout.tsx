import React from "react";

import { Stack } from "expo-router";

const AccountLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="change_password" />
      <Stack.Screen name="user_details" />
    </Stack>
  );
};

export default AccountLayout;
