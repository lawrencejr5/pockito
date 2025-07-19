import { View, Text } from "react-native";
import React, {
  useContext,
  createContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { EndPoint } from "@/data/constants";
import {
  useNotificationContext,
  NotificationContextType,
} from "./NotificiationContext";

const TransactionContext = createContext<TransactionContextType | null>(null);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } =
    useNotificationContext() as NotificationContextType;

  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummaryType>({
    income: 0,
    expense: 0,
    balance: 0,
  });

  // Get all transactions for the current user
  const getUserTransactions = async (): Promise<void> => {
    try {
      const userId = await AsyncStorage.getItem("user");
      if (!userId) return;
      const { data } = await axios.get(`${EndPoint.TRANSACTION}/user/data`, {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
        },
      });
      setTransactions(data);
    } catch (err: any) {
      showNotification("Failed to fetch transactions", "error");
      console.log(err);
    }
  };

  // Get account summary
  const getAccountSummary = async (): Promise<void> => {
    try {
      const { data } = await axios.get(`${EndPoint.TRANSACTION}/user/summary`, {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
        },
      });
      setAccountSummary(data.summary);
    } catch (err: any) {
      showNotification("Failed to fetch transactions", "error");
      console.log(err);
    }
  };

  // Create a transaction
  const createTransaction = async (tx: TransactionType): Promise<void> => {
    try {
      const { data } = await axios.post(
        `${EndPoint.TRANSACTION}`,
        {
          ...tx,
        },
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
          },
        }
      );
      showNotification(data?.msg || "Transaction created", "success");
      await getUserTransactions();
      await getAccountSummary();
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Failed to create transaction",
        "error"
      );
      throw new Error(
        err.response?.data?.msg || "Failed to create transaction"
      );
    }
  };

  // Delete a transaction
  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      const { data } = await axios.delete(`${EndPoint.TRANSACTION}/${id}`);
      showNotification(data?.msg || "Transaction deleted", "success");
      await getUserTransactions();
    } catch (err: any) {
      showNotification(
        err.response?.data?.msg || "Failed to delete transaction",
        "error"
      );
      throw new Error(
        err.response?.data?.msg || "Failed to delete transaction"
      );
    }
  };

  useEffect(() => {
    getUserTransactions(), getAccountSummary();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        accountSummary,
        transactions,
        createTransaction,
        getUserTransactions,
        getAccountSummary,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  return useContext(TransactionContext);
};

export interface TransactionType {
  _id?: string;
  user_id?: string;
  title: string;
  type: "credit" | "debit";
  category: string;
  amount: number | null;
  createdAt?: string;
}

interface AccountSummaryType {
  income: number;
  expense: number;
  balance: number;
}

export interface TransactionContextType {
  accountSummary: AccountSummaryType;
  transactions: TransactionType[];
  createTransaction: (tx: TransactionType) => Promise<void>;
  getUserTransactions: () => Promise<void>;
  getAccountSummary: () => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}
