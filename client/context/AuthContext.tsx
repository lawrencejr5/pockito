import React, { useContext, createContext, ReactNode, useState } from "react";

import axios from "axios";

import {
  NotificationContextType,
  useNotificationContext,
} from "./NotificiationContext";

const AuthContext = createContext<AuthContextType | null>(null);

export interface UserType {
  username?: string;
  user?: string;
  email?: string;
  password?: string;
}

// Auth provider functions starts here....
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } =
    useNotificationContext() as NotificationContextType;

  const [signedIn, setSignedIn] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // Registering user
  const registerUser = async (
    username: string | undefined,
    email: string | undefined,
    password: string | undefined
  ): Promise<void> => {
    try {
      const { data } = await axios.post(
        "http://192.168.0.186:5000/api/v1/users/register",
        { username, email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      showNotification(data?.msg, "success");
      setSignedIn(data?.userId);
      setToken(data?.token);
    } catch (err: any) {
      const errMsg = err.response.data.msg;
      showNotification(errMsg, "error");
      throw new Error(errMsg);
    }
  };

  const loginUser = async (
    user: string | undefined,
    password: string | undefined
  ): Promise<void> => {
    try {
      const { data } = await axios.post(
        "http://192.168.0.186:5000/api/v1/users/login",
        { user, password }
      );
      showNotification(data?.msg, "success");
      setSignedIn(data?.userId);
      setToken(data?.token);
    } catch (err: any) {
      const errMsg = err.response.data.msg;
      showNotification(errMsg, "error");
      throw new Error(errMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ registerUser, loginUser, signedIn, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export interface AuthContextType {
  registerUser: (
    username?: string,
    email?: string,
    password?: string
  ) => Promise<void>;

  loginUser: (user: string, password: string) => Promise<void>;

  signedIn: string;
  token: string;
}

export const useAuthContext = () => {
  return useContext(AuthContext);
};
