import { View, Text } from "react-native";
import React, { ReactNode } from "react";

import { NotificationProvider } from "@/context/NotificiationContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { AuthProvider } from "@/context/AuthContext";

const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <TransactionProvider>{children}</TransactionProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default AppProvider;
