import { View, Text } from "react-native";
import React, { useContext, createContext, ReactNode } from "react";

import axios from "axios";

export interface TransactionContextType {}

const TransactionContext = createContext<TransactionContextType | null>(null);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TransactionContext.Provider value={""}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  return useContext(TransactionContext);
};
