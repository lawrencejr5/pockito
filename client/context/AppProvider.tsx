import React, { ReactNode } from "react";

import { NotificationProvider } from "@/context/NotificiationContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "./SettingsContext";

const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <AuthProvider>
          <TransactionProvider>{children}</TransactionProvider>
        </AuthProvider>
      </NotificationProvider>
    </SettingsProvider>
  );
};

export default AppProvider;
